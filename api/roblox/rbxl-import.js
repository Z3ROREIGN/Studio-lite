import reader from "rbx-reader";

export const config = { api: { bodyParser: false } };

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
  if(v instanceof Uint8Array||Buffer.isBuffer(v))return Array.from(v);
  if(typeof v==="object"){
    if(seen.has(v))return null;
    seen.add(v);
    if(Array.isArray(v))return v.map(x=>safe(x,seen));
    const o={};
    for(const [k,x] of Object.entries(v)){if(k!=="Parent"&&k!=="Children")o[k]=safe(x,seen)}
    return o;
  }
  return String(v);
}
function plain(inst,map){
  const properties={};
  for(const [key,d] of Object.entries(inst?.Properties||{}))properties[key]=safe(d?.value);
  const p=inst?.Parent;
  return {
    id:String(map.get(inst)),
    className:String(inst?.ClassName||properties.ClassName||"Part"),
    name:String(inst?.Name||properties.Name||inst?.ClassName||"Instance"),
    parent:p&&map.has(p)?String(map.get(p)):null,
    properties,
    attributes:safe(inst?.Attributes||{})
  };
}
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  try{
    const body=await readBody(req);
    if(!body.length)return res.status(400).json({error:"Arquivo vazio"});
    if(body.length>80*1024*1024)return res.status(413).json({error:"Arquivo RBXL muito grande (limite 80 MB)."});
    const ab=body.buffer.slice(body.byteOffset,body.byteOffset+body.byteLength);
    const parsed=reader.parseBuffer(ab);
    const list=Array.isArray(parsed?.instances)?parsed.instances:[];
    const map=new Map(list.map((x,i)=>[x,i]));
    const instances=list.map(x=>plain(x,map));
    return res.status(200).json({ok:true,instances,count:instances.length});
  }catch(error){
    console.error("RBXL server parser",error);
    return res.status(422).json({ok:false,error:error?.message||String(error)});
  }
}
