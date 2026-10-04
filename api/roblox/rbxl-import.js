import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const config = { api: { bodyParser: false }, maxDuration: 300 };

function readBody(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];let total=0;let done=false;
    const finish=(fn,v)=>{if(done)return;done=true;fn(v)};
    req.on("data",c=>{
      try{
        const b=Buffer.isBuffer(c)?c:Buffer.from(c);total+=b.length;
        if(total>80*1024*1024){req.destroy();return finish(reject,Error("Arquivo maior que 80 MB"))}
        chunks.push(b);
      }catch(e){finish(reject,e)}
    });
    req.on("end",()=>finish(resolve,Buffer.concat(chunks)));
    req.on("error",e=>finish(reject,e));
    req.on("aborted",()=>finish(reject,Error("Upload interrompido pelo navegador.")));
  });
}
function json(res,status,payload){
  try{res.status(status).setHeader("Cache-Control","no-store");return res.json(payload)}
  catch(e){try{return res.status(500).send(JSON.stringify({ok:false,error:"Falha ao gerar a resposta do importador.",detail:String(e?.message||e)}))}catch{}}
}
function safe(v,seen=new WeakSet()){
  if(v===undefined)return null;
  if(v===null||typeof v==="string"||typeof v==="boolean")return v;
  if(typeof v==="number")return Number.isFinite(v)?v:null;
  if(typeof v==="bigint")return String(v);
  if(Buffer.isBuffer(v)||v instanceof Uint8Array)return Array.from(v);
  if(Array.isArray(v))return v.map(x=>safe(x,seen));
  if(typeof v==="object"){
    if(seen.has(v))return null;seen.add(v);
    const o={};for(const [k,x] of Object.entries(v)){if(k!=="Parent"&&k!=="Children")o[k]=safe(x,seen)}return o;
  }
  return String(v);
}
export default async function handler(req,res){
  if(req.method!=="POST")return json(res,405,{ok:false,error:"Método não permitido"});
  try{
    const body=await readBody(req);
    if(!body.length)return json(res,400,{ok:false,error:"Arquivo vazio"});
    if(body.length>80*1024*1024)return json(res,413,{ok:false,error:"Arquivo maior que 80 MB"});
    const arrayBuffer=body.buffer.slice(body.byteOffset,body.byteOffset+body.byteLength);
    const header=body.subarray(0,16);
    const expected=[0x3C,0x72,0x6F,0x62,0x6C,0x6F,0x78,0x21,0x89,0xFF,0x0D,0x0A,0x1A,0x0A,0x00,0x00];
    if(header.length<expected.length||!expected.every((v,i)=>header[i]===v))throw Error("Arquivo não é um RBXL/RBXM binário válido.");
    // Carrega pelo entrypoint CommonJS oficial para evitar incompatibilidade
    // do bundler ESM da Vercel com o pacote rbx-reader.
    let RBXReader;
    try{
      RBXReader=require("rbx-reader");
    }catch(loadError){
      throw Error(`Não foi possível carregar o rbx-reader no servidor: ${loadError?.message||String(loadError)}`);
    }
    const reader=RBXReader?.default||RBXReader;
    if(!reader||typeof reader!=="object")throw Error("O rbx-reader foi carregado, mas retornou um módulo inválido.");
    const parseBuffer=reader?.parseBuffer;
    const parse=reader?.parse;
    if(typeof parseBuffer!=="function"&&typeof parse!=="function")throw Error("O rbx-reader não expôs parseBuffer/parse no runtime.");
    const parsed=typeof parseBuffer==="function"
      ? await Promise.resolve(parseBuffer.call(reader,body))
      : await Promise.resolve(parse.call(reader,arrayBuffer));
    const list=Array.isArray(parsed?.instances)?parsed.instances:[];
    if(!list.length)return json(res,422,{ok:false,error:"O parser não encontrou instâncias no RBXL."});
    const index=new Map(list.map((x,i)=>[x,i]));
    const instances=list.map((inst,i)=>{
      const raw=inst?.Properties||inst?.properties||{};
      const parentRaw=raw.Parent?.value!==undefined?raw.Parent.value:raw.Parent;
      const props={};
      for(const [key,d] of Object.entries(raw))props[key]=safe(d?.value!==undefined?d.value:d);
      const parentIndex=parentRaw&&index.has(parentRaw)?index.get(parentRaw):null;
      return {id:String(i),className:String(inst?.ClassName||"Folder"),name:String(raw.Name?.value??raw.Name??inst?.Name??inst?.ClassName??"Instance"),parent:parentIndex==null?null:String(parentIndex),properties:props,attributes:safe(inst?.Attributes||{})};
    });
    return json(res,200,{ok:true,count:instances.length,instances});
  }catch(error){
    console.error("RBXL server parser",error);
    return json(res,422,{ok:false,error:error?.message||String(error),stage:"rbxl-parser"});
  }
}