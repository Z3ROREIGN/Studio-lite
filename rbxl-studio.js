/* Studio RBXL — Open Cloud script workspace
 * search-ui-fix
 * Conecta a um Place existente e edita somente Script / LocalScript / ModuleScript.
 * Não cria nem remove instâncias.
 */
(()=>{"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SCRIPT_TYPES=new Set(["Script","LocalScript","ModuleScript"]);
const state={apiKey:"",universeId:"",placeId:"",tree:[],files:new Map(),dirty:new Set(),current:null,expanded:new Set(["__workspace__"]),loading:new Set()};
const status=t=>{try{window.StudioLiteCore?.setStatus?.(t)}catch{}try{$("#status").textContent=t;$("#footerStatus").textContent=t}catch{}};
const icon=t=>SCRIPT_TYPES.has(t)?"▱":t==="Workspace"?"◈":t==="Folder"?"▰":"◇";

async function api(action,extra={}){
 const r=await fetch("/api/roblox/studio-rbxl",{method:"POST",headers:{"Content-Type":"application/json","x-roblox-api-key":state.apiKey},body:JSON.stringify({action,universeId:state.universeId,placeId:state.placeId,...extra})});
 let d={};try{d=await r.json()}catch{}
 if(!r.ok||!d.ok)throw Error(d.error||("Studio RBXL HTTP "+r.status));
 return d;
}
function style(){
 if($("#studioRbxlStyles"))return;
 const s=document.createElement("style");s.id="studioRbxlStyles";s.textContent=`
#studioRbxlModal{position:fixed;inset:0;z-index:99999;background:#05070b;color:#e8edf4;font:13px Inter,system-ui,sans-serif}
.rbxl-app{height:100%;display:grid;grid-template-rows:62px 1fr;overflow:hidden}
.rbxl-top{display:flex;align-items:center;gap:14px;padding:0 18px;border-bottom:1px solid #202732;background:#080b10}
.rbxl-brand{display:flex;align-items:center;gap:10px;min-width:220px}.rbxl-logo{width:34px;height:34px;display:grid;place-items:center;border:1px solid #344052;border-radius:9px;background:#111722;font-weight:800}.rbxl-brand b{display:block;font-size:13px;letter-spacing:.8px}.rbxl-brand small{display:block;color:#758195;font-size:9px;margin-top:2px}
.rbxl-meta{display:flex;gap:7px;flex:1;min-width:0}.rbxl-pill{border:1px solid #252e3a;background:#0d1219;color:#8e9aab;padding:7px 9px;border-radius:8px;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rbxl-pill strong{color:#dbe4ef}
.rbxl-actions{display:flex;gap:7px}.rbxl-btn{border:1px solid #2a3441;background:#10161f;color:#d9e1eb;border-radius:8px;padding:9px 12px;cursor:pointer}.rbxl-btn:hover{background:#171e29}.rbxl-btn.primary{background:#ededed;border-color:#fff;color:#080808}.rbxl-btn:disabled{opacity:.45;cursor:not-allowed}
.rbxl-body{display:grid;grid-template-columns:290px 1fr;min-height:0}
.rbxl-tree{min-height:0;border-right:1px solid #202732;background:#080b10;display:flex;flex-direction:column}
.rbxl-tree-head{padding:14px;border-bottom:1px solid #202732}.rbxl-tree-head b{font-size:11px;letter-spacing:.6px}.rbxl-tree-head span{float:right;color:#687588;font-size:10px}
.rbxl-search{margin-top:10px;width:100%;box-sizing:border-box;background:#0d1219;border:1px solid #26303d;color:#e9eef5;border-radius:8px;padding:9px 10px;outline:none}
.rbxl-list{padding:9px;overflow:auto;min-height:0}.rbxl-row{display:flex;align-items:center;gap:7px;padding:7px 8px;border-radius:7px;color:#9ba7b7;cursor:pointer;user-select:none}.rbxl-row:hover{background:#111822;color:#e6ecf4}.rbxl-row.active{background:#202020;color:#fff}.rbxl-row .arrow{width:12px;color:#687588}.rbxl-row .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rbxl-row .type{margin-left:auto;color:#596679;font-size:9px}
.rbxl-editor{min-width:0;min-height:0;background:#050505;display:grid;grid-template-rows:48px 1fr 38px}
.rbxl-filebar{display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid #202732;background:#090d13}.rbxl-filetab{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #283240;border-radius:7px;background:#10161f;min-width:0}.rbxl-filetab b{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rbxl-filetab small{color:#667488}.rbxl-dirty{color:#fff;font-size:16px}
.rbxl-codewrap{position:relative;min-height:0}.rbxl-code{width:100%;height:100%;box-sizing:border-box;resize:none;border:0;outline:0;background:#060606;color:#dce5f0;padding:18px 22px;font:13px/1.65 "SFMono-Regular",Consolas,"Liberation Mono",monospace;tab-size:2}
.rbxl-welcome{height:100%;display:grid;place-items:center;padding:30px;box-sizing:border-box}.rbxl-card{max-width:580px;border:1px solid #27313e;background:#0b1017;border-radius:16px;padding:28px;box-shadow:0 20px 80px #0008}.rbxl-card h2{margin:0 0 8px;font-size:20px}.rbxl-card p{margin:0;color:#8591a2;line-height:1.6}.rbxl-card .badgegrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}.rbxl-badge{padding:10px;border:1px solid #242e3b;border-radius:9px;color:#9ca8b7;font-size:10px}.rbxl-badge b{display:block;color:#e0e7ef;margin-bottom:3px}
.rbxl-status{display:flex;align-items:center;gap:8px;padding:0 14px;border-top:1px solid #202732;color:#728096;font-size:10px;background:#080b10}.rbxl-dot{width:6px;height:6px;border-radius:50%;background:#fff}.rbxl-auth{position:absolute;inset:0;z-index:3;display:grid;place-items:center;background:#05070bdd;backdrop-filter:blur(8px)}.rbxl-auth-card{width:min(560px,92vw);border:1px solid #293443;background:#0b1017;border-radius:18px;padding:25px;box-shadow:0 30px 100px #000}.rbxl-auth-card h2{margin:0 0 5px}.rbxl-auth-card p{color:#8290a2;font-size:11px;line-height:1.55;margin:0 0 18px}.rbxl-form{display:grid;gap:10px}.rbxl-form label{display:grid;gap:5px;color:#aab5c4;font-size:10px}.rbxl-form input{background:#080c12;border:1px solid #293442;color:#fff;padding:11px;border-radius:8px;outline:none}.rbxl-form input:focus{border-color:#fff}.rbxl-help{display:flex;gap:8px;align-items:center;margin-top:13px;color:#647286;font-size:9px}.rbxl-error{color:#ff8e8e!important}.rbxl-loading{padding:14px;color:#7e8a9d}
@media(max-width:760px){.rbxl-meta{display:none}.rbxl-brand{min-width:0}.rbxl-body{grid-template-columns:220px 1fr}.rbxl-code{padding:13px;font-size:12px}}
@media(max-width:560px){.rbxl-body{grid-template-columns:1fr}.rbxl-tree{display:none}.rbxl-top{padding:0 9px;gap:7px}.rbxl-brand{flex:1}.rbxl-actions{gap:4px}.rbxl-btn{padding:8px}}
`;document.head.appendChild(s);
}
function open(){
 style();const old=$("#studioRbxlModal");if(old){old.remove();return true}
 const bg=document.createElement("div");bg.id="studioRbxlModal";
 bg.innerHTML=`
 <div class="rbxl-app" role="dialog" aria-modal="true" aria-label="Studio RBXL">
  <header class="rbxl-top">
   <div class="rbxl-brand"><div class="rbxl-logo">S</div><div><b>STUDIO RBXL</b><small>OPEN CLOUD SCRIPT WORKSPACE</small></div></div>
   <div class="rbxl-meta"><div class="rbxl-pill">Universe <strong id="rbxlUniverse">—</strong></div><div class="rbxl-pill">Place <strong id="rbxlPlace">—</strong></div><div class="rbxl-pill">Modo <strong>Somente edição</strong></div></div>
   <div class="rbxl-actions"><button class="rbxl-btn" id="rbxlSave" disabled>Salvar</button><button class="rbxl-btn primary" id="rbxlPublish" disabled>Publicar</button><button class="rbxl-btn" id="rbxlClose">×</button></div>
  </header>
  <div class="rbxl-body">
   <aside class="rbxl-tree"><div class="rbxl-tree-head"><b>WORKSPACE</b><span id="rbxlCount">0 arquivos</span><input id="rbxlSearch" class="rbxl-search" placeholder="⌕ Procurar script..."></div><div id="rbxlTree" class="rbxl-list"><div class="rbxl-loading">Conecte um Place para carregar o Workspace.</div></div></aside>
   <main class="rbxl-editor">
    <div class="rbxl-filebar"><div class="rbxl-filetab"><span>▱</span><b id="rbxlFileName">Nenhum arquivo</b><small id="rbxlFileType"></small><span id="rbxlDirty" class="rbxl-dirty"></span></div><div style="margin-left:auto;color:#657287;font-size:9px">Ctrl/⌘ + S salva • Esc fecha</div></div>
    <div class="rbxl-codewrap"><div id="rbxlWelcome" class="rbxl-welcome"><div class="rbxl-card"><h2>Workspace de código</h2><p>Conecte uma experiência Roblox existente. O Studio RBXL carrega a hierarquia e permite editar somente os arquivos de código já existentes. Não há comandos para criar ou excluir instâncias.</p><div class="badgegrid"><div class="rbxl-badge"><b>▱ Script</b>Editar Source</div><div class="rbxl-badge"><b>▱ LocalScript</b>Editar Source</div><div class="rbxl-badge"><b>▱ ModuleScript</b>Editar Source</div></div></div></div><textarea id="rbxlCode" class="rbxl-code" spellcheck="false" autocomplete="off" autocapitalize="off" style="display:none"></textarea></div>
    <div class="rbxl-status"><span class="rbxl-dot"></span><span id="rbxlStatus">Aguardando conexão</span><span id="rbxlHint" style="margin-left:auto"></span></div>
   </main>
  </div>
  <div id="rbxlAuth" class="rbxl-auth"><div class="rbxl-auth-card"><h2>Conectar ao Roblox Open Cloud</h2><p>Informe a chave da API e os IDs da experiência. A chave é usada apenas nesta sessão e não é gravada no projeto, no localStorage ou no GitHub.</p><form id="rbxlForm" class="rbxl-form">
    <label>Chave de API <input id="rbxlApiKey" type="password" required autocomplete="off" placeholder="Sua chave x-api-key"></label>
    <label>Universe ID <input id="rbxlUniverseInput" inputmode="numeric" required placeholder="Ex.: 1234567890"></label>
    <label>Place ID <input id="rbxlPlaceInput" inputmode="numeric" required placeholder="Ex.: 9876543210"></label>
    <button class="rbxl-btn primary" type="submit">Conectar e carregar Workspace</button><div id="rbxlAuthError" class="rbxl-help rbxl-error"></div>
   </form><div class="rbxl-help">✓ Somente leitura da hierarquia • ✓ Edição apenas de scripts existentes • ✓ Sem criar • ✓ Sem excluir</div></div></div>
 </div>`;
 document.body.appendChild(bg);
 const close=()=>{bg.remove();document.removeEventListener("keydown",key,true)};
 const key=e=>{if(e.key==="Escape"){close();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();saveCurrent()}};
 $("#rbxlClose").onclick=close;document.addEventListener("keydown",key,true);
 $("#rbxlForm").onsubmit=async e=>{e.preventDefault();await connect()};
 $("#rbxlSearch").oninput=()=>renderTree($("#rbxlSearch").value);
 $("#rbxlCode").oninput=markDirty;$("#rbxlSave").onclick=saveCurrent;$("#rbxlPublish").onclick=publishAll;
 return true;
}
function markDirty(){if(!state.current)return;const n=state.files.get(state.current);if(!n)return;n.source=$("#rbxlCode").value;state.dirty.add(n.id);$("#rbxlDirty").textContent="•";$("#rbxlSave").disabled=false;$("#rbxlPublish").disabled=false;$("#rbxlStatus").textContent="Alteração local não salva";status("Studio RBXL: alteração pendente")}
async function connect(){
 const key=$("#rbxlApiKey").value.trim(),u=$("#rbxlUniverseInput").value.trim(),p=$("#rbxlPlaceInput").value.trim(),err=$("#rbxlAuthError");err.textContent="";
 if(!key||!/^\d+$/.test(u)||!/^\d+$/.test(p)){err.textContent="Informe uma chave válida e IDs numéricos.";return}
 state.apiKey=key;state.universeId=u;state.placeId=p;state.tree=[];state.files.clear();state.expanded=new Set(["__workspace__"]);
 const btn=$("#rbxlAuth").querySelector("button");btn.disabled=true;btn.textContent="Conectando…";$("#rbxlStatus").textContent="Carregando Workspace…";
 try{
  const d=await api("load");
  state.tree=Array.isArray(d.tree)?d.tree:[];
  indexNodes(state.tree);
  $("#rbxlUniverse").textContent=u;
  $("#rbxlPlace").textContent=p;
  $("#rbxlAuth").remove();
  renderTree();
  const workspace=state.tree.find(n=>n.name==="Workspace");
  if(workspace){
    state.expanded.add(workspace.id);
    await loadChildrenFor(workspace.id);
  }
  $("#rbxlCount").textContent=countScripts()+" scripts";
  $("#rbxlStatus").textContent=state.tree.length+" itens carregados • pastas disponíveis no Explorer";
  status("Studio RBXL conectado")
}
 catch(e){err.textContent=e.message||String(e);$("#rbxlStatus").textContent="Falha na conexão"}
 finally{const b=$("#rbxlAuth")?.querySelector("button");if(b){b.disabled=false;b.textContent="Conectar e carregar Workspace"}}
}
function indexNodes(nodes){for(const n of nodes||[]){if(!n)continue;if(SCRIPT_TYPES.has(n.type)&&!state.files.has(n.id))state.files.set(n.id,{...n,source:"",sourceLoaded:false})}}
function countScripts(){return state.files.size}
async function loadChildrenFor(parentId){
 if(state.loading.has(parentId))return;
 state.loading.add(parentId);renderTree($("#rbxlSearch").value);$("#rbxlStatus").textContent="Carregando pasta…";
 try{const d=await api("children",{parentId});const ids=new Set(state.tree.map(n=>n.id));for(const n of(d.children||[])){if(!ids.has(n.id))state.tree.push(n)}indexNodes(d.children||[]);state.expanded.add(parentId);renderTree($("#rbxlSearch").value);$("#rbxlStatus").textContent="Pasta carregada"}
 catch(e){$("#rbxlStatus").textContent="Falha ao carregar pasta: "+e.message}
 finally{state.loading.delete(parentId);renderTree($("#rbxlSearch").value)}
}
function renderTree(filter=""){
 const root=$("#rbxlTree");if(!root)return;root.innerHTML="";
 if(!state.tree.length){root.innerHTML='<div class="rbxl-loading">Nenhuma instância foi retornada pelo Roblox.</div>';return}
 const all=[{id:"__workspace__",parent:null,name:"Workspace",type:"Workspace",virtual:true,hasChildren:true},...state.tree.map(n=>({...n,parent:n.parent==="root"?"__workspace__":n.parent}))],by=new Map();
 all.forEach(n=>by.set(n.id,[]));all.forEach(n=>{if(n.parent&&by.has(n.parent))by.get(n.parent).push(n)});
 if(filter){state.tree.filter(n=>((n.name+" "+n.type).toLowerCase().includes(filter.toLowerCase()))).forEach(n=>addRow(n,0,true));return}
 const draw=(parent,depth)=>{for(const n of(by.get(parent)||[]).sort((a,b)=>{const as=SCRIPT_TYPES.has(a.type),bs=SCRIPT_TYPES.has(b.type);return as===bs?a.name.localeCompare(b.name):as?1:-1})){addRow(n,depth,false);if(n.hasChildren&&state.expanded.has(n.id))draw(n.id,depth+1)}};
 draw("__workspace__",0);
}
function addRow(n,depth,filtered){
 const root=$("#rbxlTree"),row=document.createElement("div");row.className="rbxl-row"+(state.current===n.id?" active":"");row.style.paddingLeft=(8+depth*15)+"px";
 const open=state.expanded.has(n.id),loading=state.loading.has(n.id);
 row.innerHTML='<span class="arrow">'+(n.hasChildren?(loading?"…":open?"⌄":"›"):"")+'</span><span>'+icon(n.type)+'</span><span class="name">'+esc(n.name)+'</span><span class="type">'+esc(n.type)+'</span>';
 row.onclick=async()=>{if(SCRIPT_TYPES.has(n.type)){await selectFile(n.id);return}if(n.hasChildren&&!filtered){if(open){state.expanded.delete(n.id);renderTree($("#rbxlSearch").value)}else await loadChildrenFor(n.id)}else $("#rbxlStatus").textContent=n.name+" • somente leitura"};
 root.appendChild(row);
}
async function selectFile(id){
 const n=state.files.get(id);if(!n)return;state.current=id;$("#rbxlWelcome").style.display="none";$("#rbxlCode").style.display="block";$("#rbxlFileName").textContent=n.name;$("#rbxlFileType").textContent=n.type;$("#rbxlDirty").textContent=state.dirty.has(id)?"•":"";
 $("#rbxlCode").value=n.source||"";$("#rbxlHint").textContent=n.sourceLoaded?(n.enabled===false?"Desabilitado":"Luau"):"Carregando Source…";$("#rbxlStatus").textContent=n.name+" • carregando…";renderTree($("#rbxlSearch").value);
 try{if(!n.sourceLoaded){const d=await api("source",{instanceId:n.id});
      if(d.scriptType&&SCRIPT_TYPES.has(d.scriptType)) n.type=d.scriptType;
      n.source=String(d.source||"");
      n.enabled=d.enabled!==false;
      n.sourceLoaded=true}$("#rbxlCode").value=n.source||"";$("#rbxlHint").textContent=n.enabled===false?"Desabilitado":"Luau";$("#rbxlStatus").textContent=n.name+" aberto";renderTree($("#rbxlSearch").value);setTimeout(()=>$("#rbxlCode").focus(),0)}
 catch(e){$("#rbxlHint").textContent="Source indisponível";$("#rbxlStatus").textContent="Falha ao carregar Source: "+e.message}
}
async function saveCurrent(){
 const n=state.current?state.files.get(state.current):null;
 if(!n){$("#rbxlStatus").textContent="Nenhum script aberto.";return}
 if(!state.dirty.has(n.id)){$("#rbxlStatus").textContent="Nenhuma alteração pendente neste script.";return}
 const b=$("#rbxlSave");b.disabled=true;b.textContent="Salvando…";$("#rbxlStatus").textContent="Salvando "+n.name+"…";
 try{
   await api("update",{instanceId:n.id,scriptType:n.type,source:n.source});
   state.dirty.delete(n.id);n.sourceLoaded=true;$("#rbxlDirty").textContent="";$("#rbxlStatus").textContent="✓ "+n.name+" salvo no Roblox";status("Script salvo");
 }catch(e){
   $("#rbxlStatus").textContent="Falha ao salvar: "+e.message;status("Falha ao salvar");
 }finally{
   b.textContent="Salvar";b.disabled=!state.dirty.has(n.id);
 }
}
async function publishAll(){
 const changes=[...state.dirty].map(id=>{const n=state.files.get(id);return n&&{instanceId:n.id,scriptType:n.type,source:n.source}}).filter(Boolean);
 if(!changes.length){$("#rbxlStatus").textContent="Nenhuma alteração pendente para publicar.";return}
 const b=$("#rbxlPublish");b.disabled=true;b.textContent="Publicando…";$("#rbxlStatus").textContent="Publicando "+changes.length+" arquivo(s)…";
 try{const d=await api("updateMany",{changes});state.dirty.clear();$("#rbxlDirty").textContent="";$("#rbxlStatus").textContent="✓ "+(d.saved??changes.length)+" arquivo(s) atualizado(s) no Roblox";status("Publicação concluída")}
 catch(e){$("#rbxlStatus").textContent="Falha na publicação: "+e.message;status("Falha na publicação")}
 finally{b.textContent="Publicar";b.disabled=!!state.dirty.size}
}
function install(){
 window.StudioLiteRBXL={open};const bind=()=>{const b=$("#studioRbxlBtn");if(!b)return;b.type="button";b.dataset.studioRbxl="true";b.onclick=e=>{e.preventDefault();e.stopPropagation();open()}};bind();
 document.addEventListener("click",e=>{const b=e.target?.closest?.("#studioRbxlBtn,[data-studio-rbxl]");if(!b)return;e.preventDefault();e.stopPropagation();open()},true);window.addEventListener("pageshow",bind)
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();