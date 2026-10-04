import reader from "rbx-reader";

export const config = { api: { bodyParser: false }, maxDuration: 60 };

function readBody(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];
    req.on("data",c=>chunks.push(Buffer.isBuffer(c)?c:Buffer.from(c)));
    req.on("end",()=>resolve(Buffer.concat(chunks)));
    req.on("error",reject);
  });
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
  if(req.method!=="POST")return res.status(405).json({ok:false,error:"Método não permitido"});
  try{
    const body=await readBody(req);
    if(!body.length)return res.status(400).json({ok:false,error:"Arquivo vazio"});
    if(body.length>80*1024*1024)return res.status(413).json({ok:false,error:"Arquivo maior que 80 MB"});
    // rbx-reader 1.5.x recebe ArrayBuffer, não Node Buffer.
    // Passar Buffer diretamente pode quebrar o ByteReader e resultar em HTTP 500.
    const arrayBuffer=body.buffer.slice(body.byteOffset,body.byteOffset+body.byteLength);
    const parse=reader?.parseBuffer;
    if(typeof parse!=="function")throw Error("O pacote rbx-reader não expôs parseBuffer no runtime.");
    const parsed=await Promise.resolve(parse.call(reader,arrayBuffer));
    const list=Array.isArray(parsed?.instances)?parsed.instances:[];
    if(!list.length)return res.status(422).json({ok:false,error:"O parser não encontrou instâncias no RBXL."});
    const index=new Map(list.map((x,i)=>[x,i]));
    const instances=list.map((inst,i)=>{
      const raw=inst?.Properties||inst?.properties||{};
      const parentRaw=raw.Parent?.value!==undefined?raw.Parent.value:raw.Parent;
      const props={};
      for(const [key,d] of Object.entries(raw))props[key]=safe(d?.value!==undefined?d.value:d);
      const parentIndex=parentRaw&&index.has(parentRaw)?index.get(parentRaw):null;
      return {id:String(i),className:String(inst?.ClassName||"Folder"),name:String(raw.Name?.value??raw.Name??inst?.Name??inst?.ClassName??"Instance"),parent:parentIndex==null?null:String(parentIndex),properties:props,attributes:safe(inst?.Attributes||{})};
    });
    return res.status(200).json({ok:true,count:instances.length,instances});
  }catch(error){
    console.error("RBXL server parser",error);
    return res.status(422).json({ok:false,error:error?.message||String(error),stage:"rbxl-parser"});
  }
}