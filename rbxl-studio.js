/* Studio RBXL — importador robusto de RBXL/RBXM/RBXLX/RBXMX */
(()=>{"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const C=()=>window.StudioLiteCore||{};
const S=()=>C().S||window.S||null;
const STORE="studio-lite-v4";
const DB="StudioLiteProjectsV1",TABLE="projects",KEY="current";
const SERVICES=["Workspace","Lighting","Players","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService"];
const SCRIPT_TYPES=new Set(["Script","LocalScript","ModuleScript"]);
const VISUAL_TYPES=new Set(["Part","MeshPart","UnionOperation","WedgePart","CornerWedgePart","TrussPart","VehicleSeat","Seat","SpawnLocation"]);
const uid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch{return x}};
const vec=(v,d=[0,0,0])=>{
 if(Array.isArray(v))return [Number(v[0])||0,Number(v[1])||0,Number(v[2])||0];
 if(v&&typeof v==="object"){
   if(Array.isArray(v.value))return vec(v.value,d);
   if(Number.isFinite(Number(v.x))||Number.isFinite(Number(v.y))||Number.isFinite(Number(v.z)))
     return [Number(v.x)||0,Number(v.y)||0,Number(v.z)||0];
 }
 return d.slice();
};
const num=v=>Number.isFinite(Number(v))?Number(v):0;
function colorHex(v){
 if(Array.isArray(v)&&v.length>=3){
   const a=v.slice(0,3).map(x=>Math.max(0,Math.min(1,Number(x)||0)));
   return "#"+a.map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("");
 }
 if(v&&typeof v==="object"){
   if(["r","g","b"].every(k=>k in v))return colorHex([v.r,v.g,v.b]);
   if(Array.isArray(v.value))return colorHex(v.value);
 }
 if(typeof v==="number"){
   const n=v>>>0;
   return "#"+((n>>16)&255).toString(16).padStart(2,"0")+((n>>8)&255).toString(16).padStart(2,"0")+(n&255).toString(16).padStart(2,"0");
 }
 return null;
}
function cframeToTransform(v){
 if(Array.isArray(v)&&v.length>=12){
   const m=v;
   const x=m[3]||0,y=m[4]||0,z=m[5]||0;
   return {position:[x,y,z],rotation:[0,0,0]};
 }
 if(v&&typeof v==="object"){
   const p=vec(v.position||v.Position);
   const r=v.rotation;
   if(Array.isArray(r)&&r.length>=9){
     const m=r;
     const sy=Math.sqrt(m[0]*m[0]+m[3]*m[3]);
     let rx,ry,rz;
     if(sy>1e-6){
       rx=Math.atan2(m[7],m[8]);
       ry=Math.atan2(-m[6],sy);
       rz=Math.atan2(m[3],m[0]);
     }else{
       rx=Math.atan2(-m[5],m[4]); ry=Math.atan2(-m[6],sy); rz=0;
     }
     return {position:p,rotation:[rx*180/Math.PI,ry*180/Math.PI,rz*180/Math.PI]};
   }
   if(Array.isArray(r)&&r[0]==="matrix"){
     const m=r[1]||[];
     return cframeToTransform({position:p,rotation:m});
   }
   if(Array.isArray(v)&&v.length>=3)return {position:vec(v),rotation:[0,0,0]};
   return {position:p,rotation:[0,0,0]};
 }
 return {position:[0,0,0],rotation:[0,0,0]};
}
function makeNode(type,p,parent=null,id=null){
 p=p||{};
 const cf=cframeToTransform(getProp(p,"CFrame"));
 const n={
  id:id??uid(),
  name:String(getProp(p,"Name")??type),
  type:String(type||"Part"),
  position:vec(getProp(p,"Position"),cf.position),
  rotation:vec(getProp(p,"Orientation"),cf.rotation),
  size:vec(getProp(p,"Size"),[1,1,1]),
  color:colorHex(getProp(p,"Color3"))||"#777777",
  material:String(getProp(p,"Material")??"Plastic"),
  shape:"box",
  anchored:Boolean(getProp(p,"Anchored")??false),
  canCollide:Boolean(getProp(p,"CanCollide")??true),
  canTouch:Boolean(getProp(p,"CanTouch")??true),
  canQuery:Boolean(getProp(p,"CanQuery")??true),
  transparency:Math.max(0,Math.min(1,num(getProp(p,"Transparency")))),
  locked:Boolean(getProp(p,"Locked")??false),
  visible:true,
  parent:parent??null,
  script:"",
  language:"luau",
  sourceClass:String(type||"")
 };
 const ori=getProp(p,"Orientation");if(Array.isArray(ori))n.rotation=vec(ori);
 const shape=String(getProp(p,"Shape")??"").toLowerCase();
 if(shape==="ball"||shape==="sphere")n.shape="sphere";
 else if(shape==="cylinder")n.shape="cylinder";
 else if(shape==="wedge")n.shape="wedge";
 const src=getProp(p,"Source");
 if(typeof src==="string"){n.script=src;n.language="luau"}
 const attrs=getProp(p,"Attributes");
 if(attrs&&typeof attrs==="object")n.attributes=clone(attrs);
 n.rbxProperties=Object.fromEntries(
   Object.entries(p)
     .filter(([k])=>k!=="Parent"&&k!=="Children")
     .map(([k,v])=>[k,compactProperty(v)])
 );
 return n;
}
function parseXML(text){
 const doc=new DOMParser().parseFromString(text,"application/xml");
 if(doc.querySelector("parsererror"))throw Error("XML Roblox inválido ou corrompido.");
 const parseValue=el=>{
   const tag=el.tagName.toLowerCase(),t=(el.textContent||"").trim();
   if(["string","protectedstring","binarystring","sharedstring"].includes(tag))return t;
   if(tag==="bool")return t.toLowerCase()==="true";
   if(["int","int64","float","double","token","brickcolor"].includes(tag))return num(t);
   if(tag==="color3"){
     const n=num(t);return colorHex(n)||n;
   }
   if(tag==="color3uint8"){
     const n=num(t);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];
   }
   if(tag==="vector2")return {x:num(el.querySelector("X")?.textContent),y:num(el.querySelector("Y")?.textContent)};
   if(tag==="vector3"||tag==="vector3int16")return {x:num(el.querySelector("X")?.textContent),y:num(el.querySelector("Y")?.textContent),z:num(el.querySelector("Z")?.textContent)};
   if(tag==="coordinateframe"){
     const p=[num(el.querySelector("X")?.textContent),num(el.querySelector("Y")?.textContent),num(el.querySelector("Z")?.textContent)];
     const m=["R00","R01","R02","R10","R11","R12","R20","R21","R22"].map(k=>num(el.querySelector(k)?.textContent));
     return {position:p,rotation:m};
   }
   if(tag==="ref")return t==="null"||t==="nil"||!t?null:t;
   if(tag==="content")return t;
   if(tag==="physicalproperties")return {raw:t};
   return t;
 };
 const walk=(item,parent,all,refs)=>{
   const type=item.getAttribute("class")||"Folder",id=item.getAttribute("referent")||uid(),props={};
   const pe=item.querySelector(":scope > Properties");
   if(pe)for(const p of pe.children){const name=p.getAttribute("name");if(name)props[name]=parseValue(p)}
   const n=makeNode(type,props,parent,id);all.push(n);refs.set(id,n);
   for(const child of item.querySelectorAll(":scope > Item"))walk(child,n.id,all,refs);
   return n;
 };
 const all=[],refs=new Map();
 const roots=[...doc.documentElement.children].filter(x=>x.tagName==="Item");
 roots.forEach(x=>walk(x,null,all,refs));
 all.forEach(n=>{
   const parent=n.rbxProperties?.Parent;
   if(typeof parent==="string"&&refs.has(parent))n.parent=refs.get(parent).id;
 });
 return all;
}
function parseBinaryServerInstances(list){
 if(!Array.isArray(list)||!list.length)throw Error("O parser não encontrou instâncias.");
 const all=list.map((x,i)=>{
   const raw=x?.properties||x?.Properties||x?.props||{};
   const props={};
   for(const [key,val] of Object.entries(raw||{})){
     if(key==="Parent"||key==="Children")continue;
     props[key]=val&&typeof val==="object"&&"value" in val?val.value:val;
   }
   const className=String(x?.className||x?.ClassName||"Folder");
   const n=makeNode(className,props,null,"rbx-"+i);
   n.rbxOriginalId=String(x?.id??i);
   n.parent=x?.parent==null?null:"rbx-"+String(x.parent);
   if(SCRIPT_TYPES.has(n.type)&&typeof props.Source==="string")n.script=props.Source;
   if(x?.attributes&&typeof x.attributes==="object")n.attributes=clone(x.attributes);
   return n;
 });
 const valid=new Set(all.map(n=>n.id));
 all.forEach(n=>{if(n.parent&&!valid.has(n.parent))n.parent=null});
 return all;
}
function normalizeClientInstance(inst,i,all,objectIds){
 const raw=inst?.properties||inst?.Properties||inst?.props||{};
 const props={};
 for(const [key,val] of Object.entries(raw||{})){
   if(key==="Parent"||key==="Children")continue;
   props[key]=val&&typeof val==="object"&&"value" in val?val.value:val;
 }
 const className=String(inst?.className||inst?.ClassName||inst?.class||"Folder");
 const ref=inst?.id??inst?.referent??i;
 const n=makeNode(className,props,null,"rbx-"+i);
 n.rbxOriginalId=String(ref);
 if(inst?.attributes&&typeof inst.attributes==="object")n.attributes=clone(inst.attributes);
 all.push(n);
 objectIds.set(ref,i);
 objectIds.set(inst,i);
 return n;
}
function convertClientInstances(instances){
 if(!Array.isArray(instances)||!instances.length)throw Error("O parser do navegador não encontrou instâncias.");
 const all=[],objectIds=new Map();
 instances.forEach((inst,i)=>normalizeClientInstance(inst,i,all,objectIds));
 all.forEach((n,i)=>{
   const inst=instances[i],raw=inst?.properties||inst?.Properties||inst?.props||{};
   const pv=inst?.parent??(raw?.Parent&&typeof raw.Parent==="object"&&"value" in raw.Parent?raw.Parent.value:raw?.Parent);
   if(pv!=null){
     const idx=objectIds.get(pv);
     if(idx!=null)n.parent="rbx-"+idx;
     else if(typeof pv==="string"){
       const byRef=instances.findIndex(x=>String(x?.id??x?.referent??"")===pv);
       if(byRef>=0)n.parent="rbx-"+byRef;
     }
   }
 });
 const valid=new Set(all.map(n=>n.id));
 all.forEach(n=>{if(n.parent&&!valid.has(n.parent))n.parent=null});
 return all;
}
function parseBinaryWorker(file){
 return new Promise(async(resolve,reject)=>{
   let worker;
   try{worker=new Worker("/rbxl-worker.js?v=20261004-v47",{type:"module"})}
   catch(e){reject(e);return}
   const timer=setTimeout(()=>{worker.terminate();reject(Error("O processamento demorou demais e foi cancelado."))},180000);
   worker.onmessage=event=>{
     const data=event.data||{};
     if(data.type==="progress"){statusText(data.message);return}
     clearTimeout(timer);worker.terminate();
     if(data.type==="result"){
       try{resolve(convertClientInstances(data.instances))}catch(e){reject(e)}
     }else reject(Error(data.message||"Falha no Worker do importador."));
   };
   worker.onerror=e=>{
     clearTimeout(timer);worker.terminate();
     reject(Error(e?.message||"Falha no Worker do importador."));
   };
   try{
     statusText("Preparando processamento em segundo plano…");
     const buffer=await file.arrayBuffer();
     worker.postMessage({buffer,filename:file.name},[buffer]);
   }catch(e){clearTimeout(timer);worker.terminate();reject(e)}
 });
}
async function parseBinary(file){
 try{
   return await parseBinaryWorker(file);
 }catch(workerError){
   if(file.size<=4*1024*1024){
     try{
       statusText("Worker indisponível; usando fallback do servidor…");
       const buf=await file.arrayBuffer();
       const response=await fetch("/api/roblox/rbxl-import",{method:"POST",headers:{"Content-Type":"application/octet-stream","X-RBXL-Filename":file.name},body:buf});
       let data=null;try{data=await response.json()}catch{}
       if(!response.ok||!data?.ok){
      if(response.status===413)throw Error("O servidor rejeitou o arquivo porque a função de importação atingiu o limite de payload. No Vercel, o limite da função é 4,5 MB; use um RBXL/RBXM menor ou publique o importador em um backend com upload maior.");
      throw Error(data?.error||("Importador respondeu HTTP "+response.status));
    }
       return parseBinaryServerInstances(data.instances);
     }catch(e){workerError=e}
   }
   throw Error(workerError?.message||"Não foi possível processar este arquivo RBXL.");
 }
}
function detect(bytes,ext){
 // RBXL/RBXM binários começam com "<roblox!" — não são XML.
 if(ext==="rbxlx"||ext==="rbxmx")return true;
 if(ext==="rbxl"||ext==="rbxm"){
   if(bytes.length>=8){
     const sig=String.fromCharCode(...bytes.slice(0,8));
     if(sig==="<roblox!")return false;
   }
 }
 const h=new TextDecoder("utf-8").decode(bytes.slice(0,512)).replace(/^\uFEFF/,"").trimStart();
 return /^<roblox(?:\s|>)/i.test(h);
}
async function parseFile(file){
 if(!file)throw Error("Nenhum arquivo selecionado.");
 const ext=(file.name.split(".").pop()||"").toLowerCase();
 if(!["rbxl","rbxm","rbxlx","rbxmx"].includes(ext))throw Error("Use .rbxl, .rbxm, .rbxlx ou .rbxmx.");
 if(file.size<16)throw Error("O arquivo está vazio ou incompleto.");
 if(file.size>250*1024*1024)throw Error("Limite de 250 MB excedido.");
 const head=new Uint8Array(await file.slice(0,512).arrayBuffer());
 if(detect(head,ext)){
   const xml=await file.text();
   return parseXML(xml);
 }
 return parseBinary(file);
}
function compact(nodes){return nodes.map(n=>({id:n.id,name:n.name,type:n.type,position:vec(n.position),rotation:vec(n.rotation),size:vec(n.size,[1,1,1]),color:n.color,material:n.material,shape:n.shape,anchored:n.anchored,canCollide:n.canCollide,canTouch:n.canTouch,canQuery:n.canQuery,transparency:n.transparency,locked:n.locked,visible:n.visible,parent:n.parent,script:n.script||"",language:n.language,sourceClass:n.sourceClass,attributes:n.attributes||{},rbxProperties:n.rbxProperties||null,customProperties:n.customProperties||null}))}
function ensureWorkspaceHierarchy(nodes){
 const services=new Set(SERVICES.filter(x=>x!=="Workspace"));
 let workspace=nodes.find(n=>n.type==="Workspace");
 if(!workspace){
   workspace={id:uid(),name:"Workspace",type:"Workspace",position:[0,0,0],rotation:[0,0,0],size:[1,1,1],color:"#777777",material:"Plastic",anchored:true,canCollide:false,canTouch:true,canQuery:true,transparency:1,locked:false,visible:false,parent:null,script:"",language:"luau",sourceClass:"Workspace",attributes:{},rbxProperties:{Name:"Workspace",Gravity:196.2}};
   nodes.unshift(workspace);
 }
 workspace.parent=null;
 const valid=new Set(nodes.map(n=>n.id));
 for(const n of nodes){
   if(n===workspace)continue;
   if(n.parent===workspace.id)continue;
   if(n.parent&&!valid.has(n.parent))n.parent=null;
   if(!n.parent&&!services.has(n.type))n.parent=workspace.id;
 }
 return nodes;
}
async function importFull(file){
 const state=S()||{settings:{theme:"dark",outline:true,autosave:true},grid:1,snap:true};
 statusText("Lendo "+file.name+"…");
 let nodes=compact(await parseFile(file));
 if(!nodes.length)throw Error("Nenhuma instância foi encontrada.");
 nodes=ensureWorkspaceHierarchy(nodes);
 const ids=new Set(nodes.map(n=>n.id));
 nodes.forEach(n=>{if(n.parent&&!ids.has(n.parent))n.parent=null});
 const root=nodes.find(n=>n.type==="Workspace");
 if(root){
   nodes.forEach(n=>{
     if(n===root)return;
     if(!n.parent&&SERVICES.includes(n.type))n.parent=null;
   });
 }
 const payload={
   name:file.name.replace(/\.(rbxl|rbxm|rbxlx|rbxmx)$/i,"")||"Imported Roblox Place",
   nodes,
   settings:state.settings||{theme:"dark",outline:true,autosave:true},
   grid:Number(state.grid)||1,
   snap:state.snap!==false,
   updatedAt:Date.now(),
   largeStorage:true
 };
 try{localStorage.removeItem(STORE)}catch{}
 try{
   localStorage.setItem(STORE,JSON.stringify({
     name:payload.name,objectCount:nodes.length,
     settings:payload.settings,grid:payload.grid,snap:payload.snap,
     largeStorage:true,updatedAt:payload.updatedAt
   }));
 }catch(e){console.warn("Studio RBXL: localStorage cheio; projeto permanece no IndexedDB",e)}
 await putState(payload);

 // Hidrata o editor atual sem recarregar a página. Isso evita perder projetos
 // grandes e também mantém Explorer/Properties/viewport sincronizados.
 const core=C();
 const live=core.S;
 if(live&&Array.isArray(live.nodes)){
   const normalizer=core.normalizeNode;
   live.nodes=nodes.map(n=>normalizer?normalizer(n):n);
   live.project=payload.name;
   live.settings=Object.assign({},live.settings||{},payload.settings||{});
   live.grid=payload.grid;
   live.snap=payload.snap;
   live.selected=live.nodes.find(n=>n.type==="Part")?.id||live.nodes.find(n=>n.type!=="Workspace")?.id||live.nodes[0]?.id||null;
   live.selectedIds=live.selected?[live.selected]:[];
   live.sourceRbxl=null;
   live.history=[];
   live.future=[];
   core.render?.();
   core.save?.(false);
   setTimeout(()=>window.StudioLiteExplorerPro?.refresh?.(),60);
 }
 return payload;
}
function statusText(t){try{C().setStatus?.(t)}catch{}try{$("#status").textContent=t;$("#footerStatus").textContent=t}catch{}}
function open(){
 if($("#studioRbxlModal"))return $("#studioRbxlModal").remove();
 const bg=document.createElement("div");bg.id="studioRbxlModal";bg.className="modal-bg";
 bg.innerHTML='<div class="rbxl-studio-modal"><div class="modal-head"><div><h2>▣ Studio RBXL — Importação completa</h2><small>RBXL/RBXM binário • RBXLX/RBMX XML • hierarquia + propriedades + scripts</small></div><button id="rbxlClose">×</button></div><div class="rbxl-drop" id="rbxlDrop"><input id="rbxlPicker" type="file" accept=".rbxl,.rbxm,.rbxlx,.rbxmx" hidden><strong>Selecionar Place Roblox</strong><span>Toque aqui para escolher o arquivo</span><small>O Place é convertido para uma árvore editável. Arquivos grandes usam IndexedDB, evitando o erro de quota do localStorage.</small></div><div class="rbxl-checks"><span>✓ Explorer hierárquico</span><span>✓ Scripts editáveis</span><span>✓ Properties preservadas</span><span>✓ Backup local</span></div><div id="rbxlProgress" class="rbxl-progress">Pronto para importar.</div></div>';
 document.body.appendChild(bg);const picker=$("#rbxlPicker"),drop=$("#rbxlDrop"),progress=$("#rbxlProgress");
 const close=()=>bg.remove();$("#rbxlClose").onclick=close;drop.onclick=()=>picker.click();
 picker.onchange=()=>{const f=picker.files?.[0];if(f)process(f)};
 async function process(f){progress.innerHTML='<span class="spin"></span> Lendo '+esc(f.name)+'…';try{const p=await importFull(f);progress.innerHTML='<b>✓ Importado com sucesso</b><span>'+p.nodes.length+' instâncias • '+p.nodes.filter(n=>SCRIPT_TYPES.has(n.type)).length+' scripts</span>';setTimeout(()=>{window.StudioLiteExplorerPro?.refresh?.();statusText("Studio RBXL pronto");},120)}catch(e){console.error("Studio RBXL",e);progress.innerHTML='<b class="error">Falha na importação</b><span>'+esc(e.message||String(e))+'</span>';statusText("Falha na importação")}}
}
function install(){
 const b=$("#studioRbxlBtn");if(b)b.onclick=open;
 window.StudioLiteRBXL={open,importFile:importFull};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else setTimeout(install,0);
const st=document.createElement("style");st.textContent='.rbxl-studio-modal{width:min(780px,96vw);max-height:92vh;overflow:auto;background:#0a0d12;border:1px solid #27303b;border-radius:18px;padding:18px;box-shadow:0 30px 120px #000}.rbxl-drop{display:grid;gap:8px;place-items:center;text-align:center;padding:44px 16px;border:1px dashed #46505e;border-radius:14px;background:#0d1219;cursor:pointer}.rbxl-drop strong{font-size:17px}.rbxl-drop span{color:#9aa6b5;font-size:12px}.rbxl-drop small{max-width:560px;color:#657181;font-size:10px;line-height:1.5}.rbxl-checks{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:10px}.rbxl-checks span{padding:10px;border:1px solid #202a35;border-radius:9px;background:#0d1117;color:#9aa6b5;font-size:11px}.rbxl-progress{min-height:38px;margin-top:12px;color:#9aa6b5;font-size:11px}.rbxl-progress b{display:block;color:#dce7f4;margin-bottom:4px}.rbxl-progress .error{color:#ff8b8b}.spin{display:inline-block;width:12px;height:12px;border:2px solid #333;border-top-color:#fff;border-radius:50%;animation:rbxlspin .7s linear infinite;vertical-align:-2px;margin-right:5px}@keyframes rbxlspin{to{transform:rotate(360deg)}}@media(max-width:600px){.rbxl-studio-modal{padding:12px;border-radius:13px}.rbxl-drop{padding:34px 12px}.rbxl-checks{grid-template-columns:1fr}}';document.head.appendChild(st);
})();