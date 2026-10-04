/* Studio Lite — RBXL Full Import Studio
 * Binary parser: MrSprinkleToes/rbxBinaryParser (MIT), loaded on demand.
 * XML/RBXLX is parsed natively.
 */
(()=>{"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const STORE="studio-lite-v4";
const PARSER_URLS=["/api/roblox/rbx-parser?v=20261004","https://cdn.jsdelivr.net/gh/MrSprinkleToes/rbxBinaryParser@master/dist/client/rbxBinaryParser.js"];
let parserPromise=null;

const services=new Set([
 "Workspace","Lighting","Players","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage",
 "StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService",
 "TestService","VoiceChatService","CollectionService","HttpService","MarketplaceService","TweenService","RunService",
 "DataStoreService","MemoryStoreService","MessagingService","TeleportService","UserInputService","ContextActionService",
 "GuiService","Debris","InsertService","LocalizationService","PathfindingService","PhysicsService","SocialService",
 "PolicyService","BadgeService","GroupService","UserService","AnalyticsService"
]);
const scriptClasses=new Set(["Script","LocalScript","ModuleScript"]);
const visualClasses=new Set(["Part","SpawnLocation","MeshPart","UnionOperation","WedgePart","CornerWedgePart","TrussPart","Seat","VehicleSeat"]);
const containerClasses=new Set(["Model","Folder","Tool","Configuration"]);

function uid(){return (crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36));}
function toast(t){try{window.toast?.(t)}catch{}}
function status(t){try{window.status?.(t)}catch{}}
function clone(o){return JSON.parse(JSON.stringify(o));}

function readState(){
 try{const x=JSON.parse(localStorage.getItem(STORE)||"{}");return x&&Array.isArray(x.nodes)?x:{name:"Meu Primeiro Jogo",nodes:[]}}
 catch{return {name:"Meu Primeiro Jogo",nodes:[]}}
}
function writeState(state){
 localStorage.setItem(STORE,JSON.stringify({
   name:state.name||"Imported Roblox Place",
   nodes:state.nodes||[],
   settings:state.settings||{theme:"dark",outline:true,autosave:true},
   grid:state.grid||1,snap:state.snap!==false
 }));
}

function number(v,d=0){const n=Number(v);return Number.isFinite(n)?n:d}
function vec3(v){
 if(Array.isArray(v))return [number(v[0]),number(v[1]),number(v[2])];
 if(v&&typeof v==="object"){
   return [number(v.X??v.x),number(v.Y??v.y),number(v.Z??v.z)];
 }
 return [0,0,0];
}
function colorHex(v){
 if(typeof v==="string"&&/^#?[0-9a-f]{6}$/i.test(v))return v.startsWith("#")?v:"#"+v;
 if(v&&typeof v==="object"){
   const r=Math.round(Math.max(0,Math.min(1,number(v.R??v.r)))*255);
   const g=Math.round(Math.max(0,Math.min(1,number(v.G??v.g)))*255);
   const b=Math.round(Math.max(0,Math.min(1,number(v.B??v.b)))*255);
   return "#"+[r,g,b].map(x=>x.toString(16).padStart(2,"0")).join("");
 }
 if(Number.isFinite(Number(v))){
   const n=Math.max(0,Math.min(255,Number(v))).toString(16).padStart(2,"0");
   return "#"+n+n+n;
 }
 return "#64748b";
}
function parsePropertyElement(el){
 const tag=el.tagName;
 const text=el.textContent||"";
 if(["string","ProtectedString","Content","BinaryString"].includes(tag))return text;
 if(tag==="bool")return text==="true";
 if(["int","int64","float","double","BrickColor"].includes(tag))return number(text);
 if(["Vector3","Vector3int16","Color3","Color3uint8","Vector2","Vector2int16"].includes(tag)){
   const x=number(el.querySelector("X")?.textContent),y=number(el.querySelector("Y")?.textContent),z=number(el.querySelector("Z")?.textContent);
   if(tag.startsWith("Color"))return {R:x,G:y,B:z};
   return tag.startsWith("Vector2")?[x,y]:[x,y,z];
 }
 if(tag==="CoordinateFrame"||tag==="CFrame"){
   const p=[number(el.querySelector("X")?.textContent),number(el.querySelector("Y")?.textContent),number(el.querySelector("Z")?.textContent)];
   const r=[number(el.querySelector("R00")?.textContent,1),number(el.querySelector("R01")?.textContent),number(el.querySelector("R02")?.textContent),
            number(el.querySelector("R10")?.textContent),number(el.querySelector("R11")?.textContent,1),number(el.querySelector("R12")?.textContent),
            number(el.querySelector("R20")?.textContent),number(el.querySelector("R21")?.textContent),number(el.querySelector("R22")?.textContent,1)];
   return {position:p,rotationMatrix:r};
 }
 if(tag==="token"||tag==="Ref")return number(text);
 if(tag==="SharedString")return text;
 return text;
}
function xmlProperties(item){
 const out={};
 item.querySelectorAll(":scope > Properties > *").forEach(el=>{
   const name=el.getAttribute("name");
   if(name)out[name]=parsePropertyElement(el);
 });
 return out;
}
function prop(props,...names){
 for(const n of names)if(props[n]!==undefined)return props[n];
 return undefined;
}
function makeNode(className,props,parent,originalId){
 const p=vec3(prop(props,"Position","position"));
 const size=vec3(prop(props,"Size","size"));
 const source=prop(props,"Source","source");
 const cframe=prop(props,"CFrame","CoordinateFrame");
 const cf=cframe?.position?cframe.position:p;
 const type=className||"Part";
 const isScript=scriptClasses.has(type);
 const isVisual=visualClasses.has(type);
 const isContainer=containerClasses.has(type);
 const n={
   id:uid(),name:String(prop(props,"Name")||type).slice(0,100),type,
   position:cf||[0,0,0],rotation:[0,0,0],
   size:(size.some(v=>v!==0)?size:[1,1,1]).map(v=>Math.max(.1,Math.abs(number(v,1)))),
   color:colorHex(prop(props,"Color","Color3")),
   material:String(prop(props,"Material")||"Plastic"),
   shape:type==="WedgePart"||type==="CornerWedgePart"?"wedge":type==="MeshPart"?"box":"box",
   anchored:prop(props,"Anchored")!==false,
   canCollide:prop(props,"CanCollide")!==false,
   transparency:Math.max(0,Math.min(1,number(prop(props,"Transparency"),0))),
   locked:!!prop(props,"Locked"),visible:!isScript&&!(!isVisual&&!isContainer),
   parent:parent||null,
   script:isScript?String(source??""):"",
   language:isScript?"luau":undefined,
   sourceClass:type,
   rbxProperties:props,
   rbxOriginalId:originalId||null
 };
 if(type==="Sphere"){n.shape="sphere";n.size=[4,4,4]}
 if(type==="Cylinder"){n.shape="cylinder"}
 if(type==="Model"||type==="Folder"||type==="Configuration"||type==="Tool"){n.canCollide=false;n.visible=false}
 if(isScript)n.size=[1,1,1];
 return n;
}
function parseXML(text){
 const doc=new DOMParser().parseFromString(text,"application/xml");
 if(doc.querySelector("parsererror"))throw new Error("XML do Roblox inválido");
 const roots=[...doc.documentElement.children].filter(x=>x.tagName==="Item");
 const nodes=[];
 const walk=(item,parent)=>{
   const cls=item.getAttribute("class")||"Part";
   const props=xmlProperties(item);
   let targetParent=parent;
   if(services.has(cls)&&cls!=="Workspace")targetParent="service:"+cls;
   const n=makeNode(cls,props,targetParent,item.getAttribute("referent"));
   if(services.has(cls)&&cls!=="Workspace"){
     n.__serviceRoot=true;
     // Keep service contents in the virtual service branch.
     targetParent=n.id;
     n.visible=false;
     nodes.push(n);
   }else{
     nodes.push(n);
   }
   [...item.children].filter(x=>x.tagName==="Item").forEach(ch=>walk(ch,targetParent));
 };
 roots.forEach(r=>walk(r,null));
 return nodes;
}
async function loadBinaryParser(){
 if(parserPromise)return parserPromise;
 parserPromise=(async()=>{
   let lastError=null;
   for(const url of PARSER_URLS){
     try{
       const m=await import(url);
       const decode=m?.decode||m?.default?.decode;
       if(typeof decode!=="function")throw new Error("Parser binário não exportou decode");
       return decode;
     }catch(e){lastError=e}
   }
   throw new Error("Não foi possível carregar o parser RBXL binário. Verifique a conexão e tente novamente. Detalhe: "+(lastError?.message||lastError||"erro desconhecido"));
 })().catch(e=>{parserPromise=null;throw e});
 return parserPromise;
}
function fromBinaryObjectTree(objects){
 const nodes=[];
 const walk=(obj,parent)=>{
   if(!obj||typeof obj!=="object")return;
   const cls=String(obj.ClassName||obj.className||"Part");
   const props={};
   for(const [k,v] of Object.entries(obj)){
     if(k!=="Children"&&k!=="ClassName"&&k!=="className")props[k]=v;
   }
   const name=props.Name??props.name??cls;
   props.Name=name;
   let targetParent=parent;
   if(services.has(cls)&&cls!=="Workspace")targetParent="service:"+cls;
   const n=makeNode(cls,props,targetParent);
   if(services.has(cls)&&cls!=="Workspace"){n.__serviceRoot=true;n.visible=false;nodes.push(n);targetParent=n.id}
   else nodes.push(n);
   (obj.Children||[]).forEach(ch=>walk(ch,targetParent));
 };
 (objects||[]).forEach(x=>walk(x,null));
 return nodes;
}
function cleanNodes(nodes){
 const valid=new Set(nodes.map(n=>n.id));
 const serviceNames=new Set([...services]);
 return nodes.map(n=>{
   const x=clone(n);
   if(x.parent&&!valid.has(x.parent)&&!String(x.parent).startsWith("service:"))x.parent=null;
   if(String(x.parent||"").startsWith("service:")){
     const serviceName=String(x.parent).slice(8);
     if(!serviceNames.has(serviceName))x.parent=null;
   }
   delete x.__serviceRoot;
   return x;
 });
}
async function parseFile(file){
 const buf=await file.arrayBuffer();
 const bytes=new Uint8Array(buf);
 const sig=String.fromCharCode(...bytes.slice(0,8));
 if(sig==="<roblox"){
   const text=new TextDecoder("utf-8").decode(bytes);
   return parseXML(text);
 }
 if(sig==="<roblox!"){
   const decode=await loadBinaryParser();
   const result=decode(buf);
   return fromBinaryObjectTree(result);
 }
 throw new Error("O arquivo não parece ser um RBXL/RBXLX válido.");
}
function summarize(nodes){
 const scripts=nodes.filter(n=>scriptClasses.has(n.type)).length;
 const visual=nodes.filter(n=>visualClasses.has(n.type)).length;
 const servicesFound=[...new Set(nodes.map(n=>n.parent).filter(x=>String(x).startsWith("service:")).map(x=>String(x).slice(8)))];
 return {total:nodes.length,scripts,visual,services:servicesFound.length,serviceNames:servicesFound};
}
function backup(){
 try{
   const current=localStorage.getItem(STORE);
   if(current)localStorage.setItem(STORE+"-before-rbxl",current);
 }catch{}
}
async function importFull(file){
 if(!file)return;
 if(!/\.(rbxl|rbxlx)$/i.test(file.name))throw new Error("Escolha um arquivo .rbxl ou .rbxlx.");
 status("Lendo Place Roblox…");
 const nodes=cleanNodes(await parseFile(file));
 if(!nodes.length)throw new Error("O Place não possui instâncias compatíveis.");
 backup();
 const state=readState();
 const name=file.name.replace(/\.(rbxl|rbxlx)$/i,"")||"Imported Roblox Place";
 writeState({...state,name,nodes});
 localStorage.setItem("studio-lite-last-rbxl",JSON.stringify({file:file.name,...summarize(nodes),at:new Date().toISOString()}));
 return summarize(nodes);
}

function openStudioImport(){
 if($("#studioRbxlModal")){$("#studioRbxlModal").remove();return}
 const bg=document.createElement("div");bg.id="studioRbxlModal";bg.className="modal-bg";
 bg.innerHTML='<div class="rbxl-studio-modal">'+
 '<div class="modal-head"><div><h2>▣ Roblox Place Studio</h2><small>Importe o Place inteiro e transforme o Explorer em um projeto editável.</small></div><button id="rbxlClose">×</button></div>'+
 '<div class="rbxl-hero"><div class="rbxl-hero-icon">RBXL</div><div><b>Full Place Import</b><p>Carrega a hierarquia completa, serviços, Models, Folders, scripts e propriedades disponíveis no arquivo.</p></div></div>'+
 '<label class="rbxl-drop" id="rbxlDrop"><input id="rbxlPicker" type="file" accept=".rbxl,.rbxlx" hidden><strong>Arraste seu .RBXL aqui</strong><span>ou toque para escolher • RBXL binário + RBXLX XML</span><small>O arquivo é processado localmente no navegador. Uma cópia do projeto atual é mantida como backup local.</small></label>'+
 '<div class="rbxl-features"><div><b>Explorer completo</b><span>Hierarquia e serviços</span></div><div><b>Code Studio</b><span>Script / LocalScript / ModuleScript</span></div><div><b>Properties</b><span>Transformações e dados importados</span></div><div><b>Search</b><span>Encontre qualquer instância</span></div></div>'+
 '<div class="rbxl-actions"><button id="rbxlCancel">Cancelar</button></div><div id="rbxlProgress" class="rbxl-progress"></div></div>';
 document.body.appendChild(bg);
 const picker=$("#rbxlPicker"),drop=$("#rbxlDrop"),progress=$("#rbxlProgress");
 const close=()=>bg.remove();
 $("#rbxlClose").onclick=close;$("#rbxlCancel").onclick=close;
 drop.onclick=()=>picker.click();
 ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag")}));
 ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag")}));
 drop.addEventListener("drop",e=>{const f=e.dataTransfer?.files?.[0];if(f)process(f)});
 picker.onchange=()=>{const f=picker.files?.[0];if(f)process(f)};
 async function process(file){
   progress.innerHTML='<span class="spin"></span> Analisando '+esc(file.name)+'…';
   try{
     const summary=await importFull(file);
     progress.innerHTML='<b>✓ Importação concluída</b><span>'+summary.total+' instâncias • '+summary.scripts+' scripts • '+summary.visual+' objetos 3D • '+summary.services+' serviços</span>';
     setTimeout(()=>location.reload(),700);
   }catch(err){
     console.error("RBXL Full Import",err);
     progress.innerHTML='<b class="error">Falha ao importar</b><span>'+esc(err?.message||String(err))+'</span>';
     status("Falha na importação");
   }
 }
}
function install(){
 const existing=$("#studioRbxlBtn");
 if(existing){
   existing.onclick=openStudioImport;
   existing.title="Importar Place Roblox completo";
 }else{
   const toolbar=[...document.querySelectorAll(".toolbar .tool-group")].find(x=>/ARQUIVO/.test(x.textContent||""));
   if(toolbar){
     const b=document.createElement("button");b.id="studioRbxlBtn";b.className="accent";b.title="Importar Place Roblox completo";b.textContent="▣ Studio RBXL";b.onclick=openStudioImport;toolbar.appendChild(b);
   }
 }
 const imp=$("#importBtn");
 if(imp){imp.title="Importação rápida JSON/RBXLX. Use Studio RBXL para Place completo."}
 const oldInput=$("#fileInput");
 if(oldInput)oldInput.accept=".rbxl,.rbxlx,.json";
 window.StudioLiteRBXL={open:openStudioImport,importFile:importFull};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else setTimeout(install,0);

const style=document.createElement("style");style.textContent=
'.rbxl-studio-modal{width:min(860px,100%);max-height:min(900px,94vh);overflow:auto;background:#090909;border:1px solid #2b2b2b;border-radius:16px;box-shadow:0 30px 120px #000;padding:18px}'+
'.rbxl-hero{display:flex;gap:12px;align-items:center;padding:15px;border:1px solid #242424;border-radius:12px;background:linear-gradient(135deg,#111,#0b0b0b);margin:12px 0}'+
'.rbxl-hero-icon{width:58px;height:58px;display:grid;place-items:center;border:1px solid #3a3a3a;border-radius:12px;background:#151515;color:#fff;font:800 12px ui-monospace;letter-spacing:1px}'+
'.rbxl-hero b{font-size:15px}.rbxl-hero p{margin:4px 0 0;color:#777;font-size:11px;line-height:1.5}'+
'.rbxl-drop{display:grid;place-items:center;text-align:center;gap:6px;padding:38px 16px;border:1px dashed #444;border-radius:14px;background:#0d0d0d;cursor:pointer;transition:.18s}.rbxl-drop:hover,.rbxl-drop.drag{border-color:#fff;background:#151515;transform:translateY(-1px)}'+
'.rbxl-drop strong{font-size:16px}.rbxl-drop span{font-size:11px;color:#999}.rbxl-drop small{max-width:600px;color:#555;font-size:10px;line-height:1.5}'+
'.rbxl-features{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.rbxl-features div{border:1px solid #202020;border-radius:9px;padding:10px;background:#0d0d0d}.rbxl-features b{display:block;font-size:10px}.rbxl-features span{display:block;color:#666;font-size:9px;margin-top:3px;line-height:1.4}.rbxl-actions{display:flex;justify-content:flex-end;margin-top:12px}.rbxl-progress{min-height:22px;margin-top:10px;color:#999;font-size:11px}.rbxl-progress span{display:block;margin-top:4px}.rbxl-progress .error{color:#f87171}.spin{width:12px;height:12px;border:2px solid #333;border-top-color:#fff;border-radius:50%;animation:rbxlspin .7s linear infinite;display:inline-block!important;vertical-align:-2px}@keyframes rbxlspin{to{transform:rotate(360deg)}}'+
'@media(max-width:700px){.rbxl-studio-modal{padding:12px;border-radius:12px}.rbxl-features{grid-template-columns:repeat(2,1fr)}.rbxl-drop{padding:30px 12px;min-height:150px}}';
document.head.appendChild(style);
})();
/* V14 — keep imported Roblox services visible in Explorer */
(()=>{"use strict";
const STORE="studio-lite-v4";
const SERVICES=["Workspace","Lighting","Players","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService","CollectionService","HttpService","MarketplaceService","TweenService","RunService","DataStoreService","MemoryStoreService","MessagingService","TeleportService","UserInputService","ContextActionService","GuiService","Debris","InsertService","LocalizationService","PathfindingService","PhysicsService","SocialService","PolicyService","BadgeService","GroupService","UserService","AnalyticsService"];
function run(){
 try{
  const raw=localStorage.getItem(STORE); if(!raw)return;
  const s=JSON.parse(raw); if(!Array.isArray(s.nodes))return;
  const nodes=s.nodes.map(n=>({...n,rbxProperties:n.rbxProperties||{}}));
  const byType=new Map(nodes.map(n=>[n.type,n]));
  const referenced=[...new Set(nodes.map(n=>String(n.parent||"").startsWith("service:")?String(n.parent).slice(8):"").filter(Boolean))];
  for(const name of referenced){
   if(!SERVICES.includes(name)||byType.has(name))continue;
   nodes.unshift({id:"service:"+name,name,type:name,service:true,position:[0,0,0],rotation:[0,0,0],size:[1,1,1],color:"#64748b",material:"Plastic",anchored:true,canCollide:false,transparency:0,locked:false,visible:false,parent:null,rbxProperties:{}});
  }
  s.nodes=nodes;
  localStorage.setItem(STORE,JSON.stringify(s));
 }catch(e){console.warn("RBXL service repair",e)}
}
run();
window.StudioLiteRBXLServiceFix={run};
})();
