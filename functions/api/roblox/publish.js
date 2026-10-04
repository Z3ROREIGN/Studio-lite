const JSON_HEADERS = {"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
}
export async function onRequestOptions(){
  return new Response(null,{status:204,headers:{
    "access-control-allow-methods":"POST, OPTIONS",
    "access-control-allow-headers":"content-type, x-roblox-universe-id, x-roblox-place-id, x-roblox-api-key, x-roblox-file-name"
  }});
}
export async function onRequestPost({request,env}){
  try{
    const universe=String(request.headers.get("x-roblox-universe-id")||"").trim();
    const place=String(request.headers.get("x-roblox-place-id")||"").trim();
    const apiKey=String(env?.ROBLOX_OPEN_CLOUD_API_KEY||request.headers.get("x-roblox-api-key")||"").trim();
    const fileName=String(request.headers.get("x-roblox-file-name")||"place.rbxl").trim();
    if(!/^\\d+$/.test(universe)||!/^\\d+$/.test(place))return json({error:"Universe ID e Place ID inválidos"},400);
    if(!apiKey)return json({error:"Roblox Open Cloud API Key não configurada"},401);
    if(!/\\.rbxlx?$/i.test(fileName))return json({error:"Arquivo deve ser .rbxl ou .rbxlx"},400);
    const body=await request.arrayBuffer();
    if(!body.byteLength)return json({error:"Arquivo vazio"},400);
    const contentType=/\\.rbxlx$/i.test(fileName)?"application/xml":"application/octet-stream";
    const robloxUrl="https://apis.roblox.com/universes/v1/"+encodeURIComponent(universe)+"/places/"+encodeURIComponent(place)+"/versions?versionType=Published";
    const upstream=await fetch(robloxUrl,{method:"POST",headers:{
      "x-api-key":apiKey,
      "content-type":contentType
    },body});
    const text=await upstream.text();
    let detail=text;
    try{detail=JSON.stringify(JSON.parse(text))}catch{}
    return new Response(detail,{status:upstream.status,headers:{"content-type":upstream.headers.get("content-type")||"application/json; charset=utf-8","cache-control":"no-store"}});
  }catch(error){
    return json({error:"Falha no proxy de publicação",detail:String(error?.message||error)},502);
  }
}
