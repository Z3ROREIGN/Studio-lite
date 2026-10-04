/* Studio Lite — RBXL Full Import Studio
 * Binary parser: MrSprinkleToes/rbxBinaryParser (MIT), loaded on demand.
 * XML/RBXLX is parsed natively.
 */
(()=>{"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const STORE="studio-lite-v4";
const LARGE_DB="StudioLiteProjectsV1";
const LARGE_STORE="projects";
const LARGE_KEY="current";
let largeSaveTimer=null;
function openLargeDB(){
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(new Error("IndexedDB indisponível"));return}
    const req=indexedDB.open(LARGE_DB,1);
    req.onupgradeneeded=()=>{try{if(!req.result.objectStoreNames.contains(LARGE_STORE))req.result.createObjectStore(LARGE_STORE)}catch(e){reject(e)}};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error("Falha ao abrir armazenamento"));
  });
}
function idbPutState(state){
  return openLargeDB().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(LARGE_STORE,"readwrite");
    tx.objectStore(LARGE_STORE).put(state,LARGE_KEY);
    tx.oncomplete=()=>{db.close();resolve(true)};
    tx.onerror=()=>{db.close();reject(tx.error||new Error("Falha ao salvar projeto"))};
  }));
}
function idbGetState(){
  return openLargeDB().then(db=>new Promise((resolve,reject)=>{
    const req=db.transaction(LARGE_STORE,"readonly").objectStore(LARGE_STORE).get(LARGE_KEY);
    req.onsuccess=()=>{const v=req.result;db.close();resolve(v||null)};
    req.onerror=()=>{db.close();reject(req.error||new Error("Falha ao ler projeto"))};
  }));
}
function compactNode(n){
  const x={id:n.id,name:n.name,type:n.type,position:vec3(n.position),rotation:vec3(n.rotation),size:vec3(n.size),
    color:n.color,material:n.material,shape:n.shape,anchored:n.anchored,canCollide:n.canCollide,
    transparency:n.transparency,locked:n.locked,visible:n.visible,parent:n.parent,script:n.script||"",
    language:n.language,sourceClass:n.sourceClass,rbxProperties:n.rbxProperties||null};
  if(n.customProperties&&typeof n.customProperties==="object")x.customProperties=n.customProperties;
  return x;
}
function compactState(state){
  return {name:state.name||"Imported Roblox Place",nodes:(state.nodes||[]).map(compactNode),
    settings:state.settings||{theme:"dark",outline:true,autosave:true},grid:state.grid||1,snap:state.snap!==false,
    updatedAt:Date.now(),largeStorage:true};
}
// Use somente o parser oficial do projeto. O rbx-reader-rts externo tinha
// incompatibilidades de runtime que podiam terminar em:
// "Cannot read properties of undefined (reading 'buffer')".
const PARSER_URLS=[
  "https://cdn.jsdelivr.net/npm/rbx-reader-rts@1.0.8/+esm",
  "/api/roblox/rbx-parser?v=20261004-v30",
  "https://cdn.jsdelivr.net/gh/MrSprinkleToes/rbxBinaryParser@6e9f3a835054bb39ff442d5d830b0c4ac369dea2/dist/client/rbxBinaryParser.js"
];
let parserPromise=null;

/*
 * IMPORTANTE:
 * O parser antigo exporta decode(), mas algumas versões conseguem carregar
 * corretamente e só quebram quando decode() recebe um RBXL real. Antes,
 * escolhíamos esse parser apenas porque decode existia e nunca chegávamos
 * ao rbx-reader-rts. Agora cada parser é TESTADO com o arquivo real e,
 * se falhar, o próximo parser é tentado automaticamente.
 */
async function loadBinaryParser(){
  if(parserPromise)return parserPromise;
  parserPromise=(async()=>{
    const candidates=[];
    for(const url of PARSER_URLS){
      try{
        const m=await import(url);
        const parseBuffer=m?.parseBuffer||m?.default?.parseBuffer;
        const parseRBX=m?.parseRBX||m?.default?.parseRBX;
        const decode=m?.decode||m?.default?.decode;
        if(typeof parseBuffer==="function"||typeof parseRBX==="function"||typeof decode==="function"){
          candidates.push({url,parseBuffer,parseRBX,decode});
        }
      }catch{}
    }
    if(!candidates.length)throw new Error("Nenhum decodificador RBXL está disponível.");
    return async buffer=>{
      const ab=buffer instanceof ArrayBuffer?buffer:(buffer instanceof Uint8Array?buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength):null);
      if(!ab||ab.byteLength<16)throw new Error("Arquivo RBXL vazio ou incompleto.");
      const failures=[];
      for(const candidate of candidates){
        try{
          let result;
          if(typeof candidate.parseBuffer==="function")result=await candidate.parseBuffer(ab);
          else if(typeof candidate.parseRBX==="function")result=await candidate.parseRBX(new Uint8Array(ab));
          else result=await candidate.decode(ab);
          if(result&&(result.root||result.instances||result.Instances||Array.isArray(result)))return {result,parser:candidate.url};
          failures.push(candidate.url+" → resultado vazio");
        }catch(e){failures.push(candidate.url+" → "+(e?.message||String(e)))}
      }
      throw new Error("Não foi possível decodificar o arquivo. "+failures.join(" | "));
    };
  })().catch(e=>{parserPromise=null;throw e});
  return parserPromise;
}
function prepareBinaryImport(){return loadBinaryParser().then(()=>true).catch(()=>false)}

function normalizeBinaryResult(parsed){
 const result=parsed?.result??parsed;
 const root=result?.root;
 const roots=root?.Children||root?.children;
 if(Array.isArray(roots)&&roots.length)return roots;
 const flat=result?.instances||result?.Instances;
 if(Array.isArray(flat)&&flat.length)return flat;
 if(Array.isArray(result))return result;
 if(root&&typeof root==="object")return [root];
 return [];
}

function fromBinaryObjectTree(objects){
 const list=Array.isArray(objects)?objects:[];
 const nodes=[];
 const objectToNode=new Map();
 const normalizeProps=obj=>{
   const props={};
   const source=obj?.Properties||obj?.properties||{};
   if(source&&typeof source==="object"){
     for(const [k,v] of Object.entries(source)){
       props[k]=v?.value!==undefined?v.value:v;
     }
   }
   for(const [k,v] of Object.entries(obj||{})){
     if(!["Children","children","ClassName","className","class","Type","Properties","properties","Parent","parent"].includes(k)&&props[k]===undefined)props[k]=v;
   }
   return props;
 };
 const create=(obj,parentId=null)=>{
   if(!obj||typeof obj!=="object"||objectToNode.has(obj))return objectToNode.get(obj)?.id||null;
   const cls=String(obj.ClassName||obj.className||obj.class||obj.Type||"Part");
   const props=normalizeProps(obj);
   const name=props.Name??obj.Name??obj.name??cls;
   props.Name=name;
   let targetParent=parentId;
   if(services.has(cls)&&cls!=="Workspace")targetParent="service:"+cls;
   const n=makeNode(cls,props,targetParent);
   n.rbxProperties=props;
   if(services.has(cls)&&cls!=="Workspace"){
     n.__serviceRoot=true;n.visible=false;
   }
   nodes.push(n);
   objectToNode.set(obj,n);
   const children=obj.Children||obj.children;
   if(Array.isArray(children))children.forEach(ch=>create(ch,n.id));
   return n.id;
 };
 list.forEach(obj=>create(obj,null));
 // Binary parsers can return a flat instance list. Reconnect Parent references
 // after all nodes exist instead of silently flattening the Explorer.
 list.forEach(obj=>{
   const n=objectToNode.get(obj);
   if(!n)return;
   const parent=obj.Parent||obj.parent||obj?.Properties?.Parent||obj?.properties?.Parent;
   if(parent&&typeof parent==="object"){
     const p=objectToNode.get(parent);
     if(p&&p.id!==n.id)n.parent=p.id;
   }
 });
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
async function parseServerBinary(file){
 const buf=await file.arrayBuffer();
 const response=await fetch("/api/roblox/rbxl-import",{
   method:"POST",
   headers:{"Content-Type":"application/octet-stream","X-RBXL-Filename":file.name},
   body:buf
 });
 let data=null;
 try{data=await response.json()}catch{}
 if(!response.ok||!data?.ok){
   throw new Error(data?.error||("Servidor RBXL respondeu HTTP "+response.status));
 }
 const list=Array.isArray(data.instances)?data.instances:[];
 return list.map(x=>{
   const props=x.properties||{};
   if(x.attributes&&typeof x.attributes==="object")props.Attributes=x.attributes;
   const n=makeNode(x.className||"Part",props,null,x.id);
   n.parent=x.parent==null?null:"server:"+x.parent;
   n.rbxProperties=props;
   return n;
 });
}
function repairServerParents(nodes){
 const byServer=new Map(nodes.map((n,i)=>["server:"+String(n.rbxOriginalId??i),n.id]));
 return nodes.map(n=>{
   if(typeof n.parent==="string"&&n.parent.startsWith("server:"))n.parent=byServer.get(n.parent)||null;
   return n;
 });
}
async function parseFile(file){
 const ext=String(file?.name||"").toLowerCase().split(".").pop();
 const allowed=["rbxl","rbxlx","rbxm","rbxmx"];
 if(!allowed.includes(ext))throw new Error("Formato não suportado. Use RBXL, RBXLX, RBXM ou RBXMX.");
 if(!file||file.size<=0)throw new Error("O arquivo está vazio.");
 if(file.size>80*1024*1024)throw new Error("O arquivo é maior que o limite de 80 MB.");
 const buf=await file.arrayBuffer();
 if(!(buf instanceof ArrayBuffer)||buf.byteLength===0)throw new Error("Não foi possível ler o arquivo.");
 const bytes=new Uint8Array(buf);
 const head=new TextDecoder("utf-8").decode(bytes.slice(0,256)).replace(/^\uFEFF/,"").trimStart();
 const binary=bytes.length>=8&&String.fromCharCode(...bytes.slice(0,8))==="<roblox!";
 const xml=head.startsWith("<roblox")||ext==="rbxlx"||ext==="rbxmx";
 if(xml){
   try{
     const nodes=parseXML(new TextDecoder("utf-8").decode(bytes));
     if(!Array.isArray(nodes)||!nodes.length)throw new Error("O XML não contém instâncias.");
     return nodes;
   }catch(e){throw new Error("Não foi possível ler o XML Roblox: "+(e?.message||String(e)))}
 }
 if(binary){
   try{
     const serverNodes=await parseServerBinary(file);
     if(serverNodes.length)return repairServerParents(serverNodes);
   }catch(e){console.warn("Servidor RBXL indisponível; usando parser do navegador.",e)}
   try{
     const decode=await loadBinaryParser();
     const parsed=await decode(buf);
     const nodes=fromBinaryObjectTree(normalizeBinaryResult(parsed));
     if(nodes.length)return nodes;
   }catch(e){console.warn("Parser RBXL do navegador falhou.",e)}
   throw new Error("Não foi possível importar este arquivo binário Roblox. O formato pode usar dados que este Studio ainda não consegue converter.");
 }
 throw new Error("Arquivo Roblox inválido ou formato não reconhecido.");
}
function summarize(nodes){
 const scripts=nodes.filter(n=>scriptClasses.has(n.type)).length;
 const visual=nodes.filter(n=>visualClasses.has(n.type)).length;
 const servicesFound=[...new Set(nodes.map(n=>n.parent).filter(x=>String(x).startsWith("service:")).map(x=>String(x).slice(8)))];
 return {total:nodes.length,scripts,visual,services:servicesFound.length,serviceNames:servicesFound};
}
function backup(){
  // Backup de RBXL não deve duplicar o Place inteiro no LocalStorage.
  try{
    const current=readState();
    localStorage.setItem(STORE+"-before-rbxl",JSON.stringify({name:current.name||"Meu Primeiro Jogo",count:Number(current.objectCount||current.nodes?.length||0),at:Date.now()}));
  }catch{}
}
async function importFull(file){
 if(!file)return;
 status("Lendo Place Roblox…");
 const nodes=cleanNodes(await parseFile(file));
 if(!nodes.length)throw new Error("O Place não possui instâncias compatíveis.");
 backup();
 const state=readState();
 const name=file.name.replace(/\.(rbxl|rbxlx)$/i,"")||"Imported Roblox Place";
 const saved=await writeState({...state,name,nodes});
 localStorage.setItem("studio-lite-last-rbxl",JSON.stringify({file:file.name,...summarize(nodes),at:new Date().toISOString(),storage:saved.largeStorage?"indexeddb":"localstorage"}));
 return summarize(nodes);
}

function openStudioImport(){
 if($("#studioRbxlModal")){$("#studioRbxlModal").remove();return}
 const bg=document.createElement("div");bg.id="studioRbxlModal";bg.className="modal-bg";
 bg.innerHTML='<div class="rbxl-studio-modal">'+
 '<div class="modal-head"><div><h2>▣ Roblox Place Studio</h2><small>Importe o Place inteiro e transforme o Explorer em um projeto editável.</small></div><button id="rbxlClose">×</button></div>'+
 '<div class="rbxl-hero"><div class="rbxl-hero-icon">RBXL</div><div><b>Full Place Import</b><p>Carrega a hierarquia completa, serviços, Models, Folders, scripts e propriedades disponíveis no arquivo.</p></div></div>'+
 '<label class="rbxl-drop" id="rbxlDrop"><input id="rbxlPicker" type="file" accept=".rbxl,.rbxlx,.rbxm,.rbxmx" hidden><strong>Arraste seu .RBXL aqui</strong><span>ou toque para escolher • RBXL/RBXM binário + RBXLX/RBMX XML</span><small>O arquivo é processado localmente no navegador. Uma cópia do projeto atual é mantida como backup local.</small></label>'+
 '<div class="rbxl-features"><div><b>Explorer completo</b><span>Hierarquia e serviços</span></div><div><b>Code Studio</b><span>Script / LocalScript / ModuleScript</span></div><div><b>Properties</b><span>Transformações e dados importados</span></div><div><b>Search</b><span>Encontre qualquer instância</span></div></div>'+
 '<div class="rbxl-actions"><button id="rbxlCancel">Cancelar</button></div><div id="rbxlProgress" class="rbxl-progress"></div></div>';
 document.body.appendChild(bg);
 const picker=$("#rbxlPicker"),drop=$("#rbxlDrop"),progress=$("#rbxlProgress");
prepareBinaryImport().then(ok=>{
  progress.innerHTML=ok
    ? "<span>✓ Importador binário pronto</span>"
    : "<span>Importador binário será ativado automaticamente quando necessário.</span>";
});
 const close=()=>bg.remove();
 $("#rbxlClose").onclick=close;$("#rbxlCancel").onclick=close;
 drop.onclick=()=>picker.click();
 ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag")}));
 ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag")}));
 drop.addEventListener("drop",e=>{const f=e.dataTransfer?.files?.[0];if(f)process(f)});
 picker.onchange=()=>{const f=picker.files?.[0];if(f)process(f)};
 async function process(file){
   progress.innerHTML='<span class="spin"></span> Importando '+esc(file.name)+'…';
   try{
     const summary=await importFull(file);
     progress.innerHTML='<b>✓ Importação concluída</b><span>'+summary.total+' instâncias • '+summary.scripts+' scripts • '+summary.visual+' objetos 3D • '+summary.services+' serviços</span>';
     setTimeout(()=>location.reload(),700);
   }catch(err){
     console.error("RBXL Full Import",err);
     progress.innerHTML='<b class="error">Não foi possível importar</b><span>'+esc(err?.message||String(err))+'</span>';
     status("Falha na importação");
   }
 }
}
async function hydrateLargeProject(){
  try{
    const saved=await idbGetState();
    if(!saved||!Array.isArray(saved.nodes)||!saved.nodes.length)return;
    const core=window.StudioLiteCore;
    const s=core?.S||window.S;
    if(!s||!Array.isArray(s.nodes))return;
    s.nodes=saved.nodes.map(x=>({...x}));
    s.project=saved.name||s.project||"Imported Roblox Place";
    s.settings=saved.settings||s.settings||{};
    s.grid=saved.grid||1;
    s.snap=saved.snap!==false;
    core.render?.();
    core.setStatus?.("Projeto RBXL carregado");
  }catch(e){console.warn("Studio Lite: hydrate",e)}
}
function bridgeLargeSave(){
  const core=window.StudioLiteCore;
  if(!core||typeof core.save!=="function"||core.__largeSaveBridge)return;
  const original=core.save.bind(core);
  core.save=(...args)=>{
    const result=original(...args);
    try{
      const s=core.S||window.S;
      if(s&&Array.isArray(s.nodes)){
        const state={name:s.project||"Meu Primeiro Jogo",nodes:s.nodes,settings:s.settings||{},grid:s.grid||1,snap:s.snap!==false};
        clearTimeout(largeSaveTimer);
        largeSaveTimer=setTimeout(()=>idbPutState(compactState(state)).catch(()=>{}),120);
      }
    }catch{}
    return result;
  };
  core.__largeSaveBridge=true;
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
 if(oldInput)oldInput.accept=".rbxl,.rbxlx,.rbxm,.rbxmx,.json";
 window.StudioLiteRBXL={open:openStudioImport,importFile:importFull};
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",()=>{install();setTimeout(()=>{bridgeLargeSave();hydrateLargeProject();prepareBinaryImport()},80)});
}else{
  setTimeout(()=>{install();bridgeLargeSave();hydrateLargeProject();prepareBinaryImport()},0);
}

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
/* V15 — direct ESM parser loading fixes Blob/import failures */
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
  try{localStorage.setItem(STORE,JSON.stringify({name:s.name,objectCount:nodes.length,settings:s.settings,grid:s.grid,snap:s.snap,largeStorage:true,updatedAt:Date.now()}))}catch{}
 }catch(e){console.warn("RBXL service repair",e)}
}
run();
window.StudioLiteRBXLServiceFix={run};
})();
