/* Studio RBXL — Open Cloud script workspace
 * search-ui-fix
 * nested-script-children-fix
 * safe-script-actions-v01
 * Conecta a um Place existente e edita somente Script / LocalScript / ModuleScript.
 * A API Open Cloud atual não permite criar/remover Instances; ações destrutivas são bloqueadas com confirmação.
 */
(()=>{"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SCRIPT_TYPES=new Set(["Script","LocalScript","ModuleScript"]);
const state={apiKey:"",universeId:"",placeId:"",tree:[],files:new Map(),dirty:new Set(),removed:new Set(),current:null,expanded:new Set(["__workspace__"]),loading:new Set()};
const status=t=>{try{window.StudioLiteCore?.setStatus?.(t)}catch{}try{$("#status").textContent=t;$("#footerStatus").textContent=t}catch{}};
const icon=t=>SCRIPT_TYPES.has(t)?"▱":t==="Workspace"?"◈":t==="Folder"?"▰":"◇";

async function api(action,extra={}){
 const r=await fetch("/api/roblox/studio-rbxl",{method:"POST",headers:{"Content-Type":"application/json","x-roblox-api-key":state.apiKey},body:JSON.stringify({action,universeId:state.universeId,placeId:state.placeId,...extra})});
 let d={};try{d=await r.json()}catch{}
 if(!r.ok||!d.ok){
   const err=new Error(d.error||("Studio RBXL HTTP "+r.status));
   err.httpStatus=d.httpStatus||r.status;
   err.hint=d.hint||"Verifique a resposta da API do Roblox.";
   err.code=d.code||"STUDIO_RBXL_ERROR";
   throw err;
 }
 return d;
}
function style(){
 if($("#studioRbxlStyles"))return;
 const s=document.createElement("style");s.id="studioRbxlStyles";s.textContent=`
#studioRbxlModal{position:fixed;inset:0;z-index:99999;background:#05070b;color:#e8edf4;font:13px Inter,system-ui,sans-serif}
.rbxl-app{height:100%;display:grid;grid-template-rows:auto 1fr;overflow:hidden}
.rbxl-top{display:grid;grid-template-columns:minmax(190px,220px) 1fr auto;grid-template-areas:"brand meta actions";align-items:center;gap:9px;padding:7px 12px;border-bottom:1px solid #202732;background:#080b10;min-height:64px;box-sizing:border-box}
.rbxl-actions{grid-area:actions;display:flex;align-items:center;justify-content:flex-end;gap:5px;flex-wrap:wrap;max-width:680px}
.rbxl-actions .rbxl-btn{white-space:nowrap;padding:6px 9px;font-size:12px;min-height:30px}
.rbxl-action-group{display:flex;align-items:center;gap:4px;padding:3px;border:1px solid #202732;border-radius:8px;background:#0b1017}
.rbxl-action-group + .rbxl-action-group{margin-left:1px}
.rbxl-brand{grid-area:brand;display:flex;align-items:center;gap:10px;min-width:0}.rbxl-logo{width:34px;height:34px;display:grid;place-items:center;border:1px solid #344052;border-radius:9px;background:#111722;font-weight:800}.rbxl-brand b{display:block;font-size:13px;letter-spacing:.8px}.rbxl-brand small{display:block;color:#758195;font-size:9px;margin-top:2px}
.rbxl-meta{grid-area:meta;display:flex;gap:7px;min-width:0;flex-wrap:wrap;align-content:center}.rbxl-pill{border:1px solid #252e3a;background:#0d1219;color:#8e9aab;padding:7px 9px;border-radius:8px;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rbxl-pill strong{color:#dbe4ef}
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
.rbxl-status{display:flex;align-items:center;gap:8px;padding:0 14px;border-top:1px solid #202732;color:#728096;font-size:10px;background:#080b10}.rbxl-dot{width:6px;height:6px;border-radius:50%;background:#fff}.rbxl-auth{position:absolute;inset:0;z-index:3;display:grid;place-items:center;background:#05070bdd;backdrop-filter:blur(8px)}.rbxl-auth-card{width:min(560px,92vw);border:1px solid #293443;background:#0b1017;border-radius:18px;padding:25px;box-shadow:0 30px 100px #000}.rbxl-auth-card h2{margin:0 0 5px}.rbxl-auth-card p{color:#8290a2;font-size:11px;line-height:1.55;margin:0 0 18px}.rbxl-form{display:grid;gap:10px}.rbxl-form label{display:grid;gap:5px;color:#aab5c4;font-size:10px}.rbxl-form input{background:#080c12;border:1px solid #293442;color:#fff;padding:11px;border-radius:8px;outline:none}.rbxl-form input:focus{border-color:#fff}.rbxl-help{display:flex;gap:8px;align-items:center;margin-top:13px;color:#647286;font-size:9px}.rbxl-error{color:#ff8e8e!important}.rbxl-loading{padding:14px;color:#7e8a9d}.rbxl-confirm{position:fixed;inset:0;z-index:100001;display:grid;place-items:center;background:#000b;backdrop-filter:blur(8px)}.rbxl-confirm-card{width:min(480px,92vw);box-sizing:border-box;border:1px solid #303a48;background:#0b1017;border-radius:16px;padding:22px;box-shadow:0 30px 100px #000}.rbxl-confirm-card h3{margin:0 0 8px;font-size:16px}.rbxl-confirm-card p{margin:0;color:#8b97a8;line-height:1.55;font-size:11px}.rbxl-confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.rbxl-safe-note{margin-top:12px;padding:10px;border:1px solid #252e3a;border-radius:9px;color:#758195;font-size:10px;line-height:1.45}
@media(max-width:980px){.rbxl-top{grid-template-columns:1fr auto;grid-template-areas:"brand actions" "meta meta";gap:7px}.rbxl-actions{max-width:none}.rbxl-meta{width:100%}.rbxl-body{grid-template-columns:240px 1fr}}
@media(max-width:760px){.rbxl-top{grid-template-columns:1fr;grid-template-areas:"brand" "meta" "actions";padding:7px 9px}.rbxl-meta{display:flex}.rbxl-actions{justify-content:flex-start;width:100%;overflow:visible}.rbxl-action-group{flex-wrap:wrap}.rbxl-body{grid-template-columns:210px 1fr}.rbxl-code{padding:13px;font-size:12px}}
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
   <div class="rbxl-meta"><div class="rbxl-pill">Universe <strong id="rbxlUniverse">—</strong></div><div class="rbxl-pill">Place <strong id="rbxlPlace">—</strong></div><div class="rbxl-pill">Modo <strong>Edição + criação</strong></div></div>
   <div class="rbxl-actions"><div class="rbxl-action-group"><button class="rbxl-btn" id="rbxlNewScript">+ Script</button><button class="rbxl-btn" id="rbxlSendScript" disabled>Enviar ao Roblox</button><button class="rbxl-btn danger" id="rbxlRemoveScript">Excluir</button></div><div class="rbxl-action-group"><button class="rbxl-btn" id="rbxlSave" disabled>Salvar</button><button class="rbxl-btn" id="rbxlTestLuau">Testar Luau</button><button class="rbxl-btn" id="rbxlTestSave">Testar salvamento</button></div><div class="rbxl-action-group"><button class="rbxl-btn primary" id="rbxlPublish" disabled>Publicar alterações</button><button class="rbxl-btn" id="rbxlClose" aria-label="Fechar">×</button></div></div>
  </header>
  <div class="rbxl-body">
   <aside class="rbxl-tree"><div class="rbxl-tree-head"><b>WORKSPACE</b><span id="rbxlCount">0 arquivos</span><input id="rbxlSearch" class="rbxl-search" placeholder="⌕ Procurar script..."></div><div id="rbxlTree" class="rbxl-list"><div class="rbxl-loading">Conecte um Place para carregar o Workspace.</div></div></aside>
   <main class="rbxl-editor">
    <div class="rbxl-filebar"><div class="rbxl-filetab"><span>▱</span><b id="rbxlFileName">Nenhum arquivo</b><small id="rbxlFileType"></small><span id="rbxlDirty" class="rbxl-dirty"></span></div><div style="margin-left:auto;color:#657287;font-size:9px">Ctrl/⌘ + S salva • Esc fecha</div></div>
    <div class="rbxl-codewrap"><div id="rbxlWelcome" class="rbxl-welcome"><div class="rbxl-card"><h2>Workspace de código</h2><p>Conecte uma experiência Roblox existente. O Studio RBXL carrega a hierarquia e permite editar scripts existentes e criar novos scripts no Roblox com uma operação segura de Luau + SavePlaceAsync. Também existe o modo de rascunho local.</p><div class="badgegrid"><div class="rbxl-badge"><b>▱ Script</b>Editar Source</div><div class="rbxl-badge"><b>▱ LocalScript</b>Editar Source</div><div class="rbxl-badge"><b>▱ ModuleScript</b>Editar Source</div></div></div></div><textarea id="rbxlCode" class="rbxl-code" spellcheck="false" autocomplete="off" autocapitalize="off" style="display:none"></textarea></div>
    <div class="rbxl-status"><span class="rbxl-dot"></span><span id="rbxlStatus">Aguardando conexão</span><span id="rbxlHint" style="margin-left:auto"></span></div>
   </main>
  </div>
  <div id="rbxlAuth" class="rbxl-auth"><div class="rbxl-auth-card"><h2>Conectar ao Roblox Open Cloud</h2><p>Informe a chave da API e os IDs da experiência. A chave é usada apenas nesta sessão e não é gravada no projeto, no localStorage ou no GitHub.</p><form id="rbxlForm" class="rbxl-form">
    <label>Chave de API <input id="rbxlApiKey" type="password" required autocomplete="off" placeholder="Sua chave x-api-key"></label>
    <label>Universe ID <input id="rbxlUniverseInput" inputmode="numeric" required placeholder="Ex.: 1234567890"></label>
    <label>Place ID <input id="rbxlPlaceInput" inputmode="numeric" required placeholder="Ex.: 9876543210"></label>
    <button class="rbxl-btn primary" type="submit">Conectar e carregar Workspace</button><div id="rbxlAuthError" class="rbxl-help rbxl-error"></div>
   </form><div class="rbxl-help">✓ Hierarquia • ✓ Edição • ✓ Criação de scripts • ✓ Publicação segura</div></div></div>
 </div>`;
 document.body.appendChild(bg);
 const close=()=>{bg.remove();document.removeEventListener("keydown",key,true)};
 const key=e=>{if(e.key==="Escape"){close();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();saveCurrent()}};
 $("#rbxlClose").onclick=close;$("#rbxlNewScript").onclick=()=>requestScriptAction("create");$("#rbxlSendScript").onclick=sendCurrentDraftToRoblox;$("#rbxlRemoveScript").onclick=()=>requestScriptAction("remove");document.addEventListener("keydown",key,true);
 $("#rbxlForm").onsubmit=async e=>{e.preventDefault();await connect()};
 $("#rbxlSearch").oninput=()=>renderTree($("#rbxlSearch").value);
 $("#rbxlCode").oninput=markDirty;$("#rbxlSave").onclick=saveCurrent;$("#rbxlPublish").onclick=publishAll;$("#rbxlTestLuau").onclick=testLuau;$("#rbxlTestSave").onclick=testSavePermission;
 return true;
}
function nodePathSegments(node){
 if(!node)return [];
 const byId=new Map((state.tree||[]).map(n=>[String(n.id),n]));
 const start=byId.get(String(node.id))||node;
 const chain=[];
 const seen=new Set();
 let cur=start;
 for(let guard=0;cur&&guard++<60;){
   const id=String(cur.id??"").trim();
   if(id&&seen.has(id))return [];
   if(id)seen.add(id);
   const name=String(cur.name??"").trim();
   const parent=String(cur.parent??"").trim();
   if(name)chain.unshift(name);
   else return [];
   if(!parent||parent==="root"||parent==="__workspace__")break;
   cur=byId.get(parent)||null;
   if(!cur)return [];
 }
 if(!chain.length)return [];
 const root=chain[0];
 const validRoot=new Set(["Workspace","Players","Lighting","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService"]);
 if(!validRoot.has(root))return [];
 return chain;
}
function assertScriptPath(node){
 const segments=nodePathSegments(node);
 if(!segments.length)throw Error("Não foi possível reconstruir o caminho de "+String(node?.name||"script")+" na árvore atual.");
 if(segments.some(v=>!String(v).trim()))throw Error("O caminho do script contém um nome vazio.");
 return segments;
}
function nodeKindLabel(n){if(!n)return "item";if(SCRIPT_TYPES.has(n.type))return "script";if(n.type==="Folder"||n.hasChildren)return "pasta";return "objeto"}
function clearCurrentSelection(){state.current=null;$("#rbxlSave").disabled=true;$("#rbxlPublish").disabled=!hasPublishableChanges();$("#rbxlSendScript").disabled=true;$("#rbxlCode").style.display="none";$("#rbxlWelcome").style.display="grid";$("#rbxlFileName").textContent="Nenhum arquivo";$("#rbxlFileType").textContent="";$("#rbxlDirty").textContent=""}
function markSubtreeRemoved(id){const ids=new Set([id]);let changed=true;while(changed){changed=false;for(const n of state.tree)if(n.parent&&ids.has(n.parent)&&!ids.has(n.id)){ids.add(n.id);changed=true}}for(const x of ids){state.removed.add(x);state.dirty.delete(x);state.files.delete(x)}return ids}
async function deleteNodeFromRoblox(node){
 const b=$("#rbxlRemoveScript");b.disabled=true;b.textContent="Excluindo…";$("#rbxlStatus").textContent="Excluindo "+node.name+" no Roblox…";
 try{const d=await api("deleteInstance",{segments:assertScriptPath(node)});if(!d.taskPath)throw Error("O Roblox não retornou a tarefa de exclusão.");const task=await waitRobloxTask(d.taskPath);if(task.state!=="COMPLETE")throw Error("A exclusão não foi concluída.");const parentId=node.parent||"__workspace__";markSubtreeRemoved(node.id);clearCurrentSelection();await loadChildrenFor(resolveRobloxParentId(parentId));renderTree($("#rbxlSearch").value);$("#rbxlStatus").textContent="✓ "+node.name+" foi excluído do Roblox e salvo no Place.";$("#rbxlHint").textContent="Exclusão concluída";status("Exclusão concluída")}
 catch(e){$("#rbxlStatus").textContent="Não foi possível excluir "+node.name+": "+(e.message||String(e));$("#rbxlHint").textContent="Nada foi removido localmente";status("Exclusão não concluída")}
 finally{b.disabled=false;b.textContent="Excluir"}
}
function getSelectedNode(){return state.current?(state.files.get(state.current)||state.tree.find(n=>n.id===state.current)||null):null}
function openDeleteFileTab(){
 const old=$("#rbxlDeleteTab");if(old)old.remove();
 const items=state.tree.filter(n=>!n.virtual&&!state.removed.has(n.id)).sort((x,y)=>(x.name||"").localeCompare(y.name||""));
 const box=document.createElement("div");box.id="rbxlDeleteTab";box.className="rbxl-confirm";
 box.innerHTML='<div class="rbxl-confirm-card" style="max-width:620px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><h3 style="margin:0">Excluir arquivo ou pasta</h3><p style="margin:6px 0 0;color:#8995a5">Escolha exatamente o item que deseja remover.</p></div><button class="rbxl-btn" id="rbxlDeleteClose">×</button></div><input id="rbxlDeleteSearch" placeholder="Procurar arquivo, pasta ou objeto..." style="width:100%;box-sizing:border-box;margin-top:14px;background:#080c12;border:1px solid #293442;color:#fff;padding:11px;border-radius:8px"><div id="rbxlDeleteList" style="max-height:330px;overflow:auto;margin-top:10px;display:grid;gap:6px"></div><div class="rbxl-safe-note" style="margin-top:12px">Scripts, pastas e outros objetos podem ser removidos. Serviços do Roblox e o Workspace raiz são protegidos.</div></div>';
 document.body.appendChild(box);
 const list=$("#rbxlDeleteList"),search=$("#rbxlDeleteSearch");
 const pathOf=n=>nodePathSegments(n).join(" › ")||n.name;
 const draw=()=>{const q=search.value.trim().toLowerCase();list.innerHTML="";const found=items.filter(n=>!q||(n.name+" "+n.type+" "+pathOf(n)).toLowerCase().includes(q));if(!found.length){list.innerHTML='<div style="padding:18px;color:#778397;text-align:center">Nenhum item encontrado. Abra a pasta no Explorer para carregar mais itens.</div>';return}for(const n of found){const el=document.createElement("button");el.type="button";el.className="rbxl-btn";el.style.cssText="text-align:left;padding:11px;display:grid;grid-template-columns:1fr auto;gap:3px";el.innerHTML='<span><b>'+esc(n.name)+'</b><small style="display:block;color:#7d8999;margin-top:3px">'+esc(n.type)+" • "+esc(pathOf(n))+'</small></span><span>›</span>';el.onclick=()=>{box.remove();state.current=n.id;renderTree($("#rbxlSearch").value);confirmDeleteNode(n)};list.appendChild(el)}};
 search.oninput=draw;$("#rbxlDeleteClose").onclick=()=>box.remove();draw();search.focus();
}
function confirmDeleteNode(node){
 if(!node||node.virtual){showConfirm("Item protegido","O Workspace raiz não pode ser excluído.",()=>{});return}
 const path=nodePathSegments(node).join(" › ")||node.name,hasChildren=!!node.hasChildren;
 const warning=hasChildren?"\n\n⚠ Este item possui conteúdo dentro. A pasta e os itens encontrados abaixo dela serão removidos.":"";
 const isLocal=!!node.local;
 if(isLocal){showConfirm("Excluir somente o rascunho","Arquivo/objeto: "+node.name+"\nTipo: "+node.type+"\nLocal: "+path+"\n\nEste item ainda não existe no Roblox."+warning+"\n\nExcluir deste editor?",()=>{markSubtreeRemoved(node.id);clearCurrentSelection();renderTree($("#rbxlSearch").value);$("#rbxlStatus").textContent="✓ "+node.name+" removido deste editor.";status("Rascunho excluído")});return}
 showConfirm("Excluir do Roblox","Arquivo/objeto: "+node.name+"\nTipo: "+node.type+"\nLocal: "+path+warning+"\n\nIsso executará a exclusão no Roblox e salvará o Place.\n\nTem certeza que deseja continuar?",()=>deleteNodeFromRoblox(node));
}
function requestScriptAction(action){
 if(action==="create"){showCreateScript();return}
 openDeleteFileTab();
}
function luauString(value){
 const s=String(value??"");
 return "\""+s.replace(/\\/g,"\\\\").replace(/"/g,"\\\"").replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"\"";
}
function resolveRobloxParentId(parentId){
 const workspace=state.tree.find(n=>n.name==="Workspace"&&n.parent==="root");
 if(parentId==="root"||parentId==="__workspace__")return workspace?.id||"__workspace__";
 return parentId;
}
function robloxParentExpression(parentId){
 if(!parentId||parentId==="__workspace__"||parentId==="root")return 'game:GetService("Workspace")';
 const chain=[];let id=parentId;const seen=new Set();
 while(id&&id!=="root"&&id!=="__workspace__"&&!seen.has(id)){
   seen.add(id);const n=state.tree.find(x=>x.id===id);
   if(!n)break;
   chain.unshift(n.name);
   id=n.parent;
 }
 if(!chain.length)return 'game:GetService("Workspace")';
 let expr;
 const root=state.tree.find(n=>n.id===parentId&&n.parent==="root");
 if(root)expr='game:GetService('+luauString(root.name)+')';
 else{
   const service=state.tree.find(n=>n.id===id&&n.parent==="root");
   expr=service?'game:GetService('+luauString(service.name)+')':'game:GetService("Workspace")';
 }
 const nested=root?chain.slice(1):chain;
 for(const name of nested)expr+=':FindFirstChild('+luauString(name)+')';
 return expr;
}
async function waitRobloxTask(taskPath){
 for(let i=0;i<100;i++){
   const d=await api("task",{taskPath});
   if(d.state==="COMPLETE")return d;
   if(d.state==="FAILED"||d.state==="CANCELLED")throw Error(d.error?.message||d.error?.details||("A operação Roblox terminou em "+d.state+"."));
   $("#rbxlStatus").textContent="Enviando para o Roblox… "+Math.min(99,Math.round((i+1)/100*100))+"%";
   await new Promise(r=>setTimeout(r,3000));
 }
 throw Error("O Roblox demorou demais para concluir a criação. A tarefa pode continuar em processamento.");
}
async function sendScriptToRoblox(node,parentId){
 const b=$("#rbxlSendScript");
 b.disabled=true;b.textContent="Enviando…";
 $("#rbxlStatus").textContent="Criando "+node.name+" no Roblox…";
 try{
   const d=await api("createScript",{scriptType:node.type,name:node.name,parentPath:robloxParentExpression(parentId),source:node.source||""});
   if(!d.taskPath)throw Error("O Roblox não retornou o identificador da tarefa.");
   const task=await waitRobloxTask(d.taskPath);
   if(task.state!=="COMPLETE")throw Error("A criação não foi concluída.");
   state.dirty.delete(node.id);state.removed.delete(node.id);
   await loadChildrenFor(parentId);
   const created=state.tree.filter(n=>!state.removed.has(n.id)&&n.name===node.name&&n.parent===parentId&&n.type===node.type).at(-1);
   if(created){await selectFile(created.id)}
   else{
     $("#rbxlStatus").textContent="✓ Script criado no Roblox. Atualize a pasta para localizá-lo.";
     $("#rbxlHint").textContent="Criado e salvo no Roblox";
   }
   $("#rbxlPublish").disabled=!hasPublishableChanges();
   status("Script criado no Roblox");
 }catch(e){
   $("#rbxlStatus").textContent="Falha ao enviar para o Roblox: "+(e.message||String(e));
   $("#rbxlHint").textContent="Verifique universe.places:write + luau-execution-session:write";
   status("Falha ao criar script no Roblox");
 }finally{
   b.textContent="Enviar ao Roblox";
   const current=getSelectedNode();
   b.disabled=!(current?.local);
 }
}
function sendCurrentDraftToRoblox(){
 const n=state.current?state.files.get(state.current):null;
 if(!n?.local)return;
 sendScriptToRoblox(n,resolveRobloxParentId(n.parent));
}
function scriptLocationCandidates(){
 const loaded=state.tree.filter(n=>!n.virtual&&!state.removed.has(n.id));
 const candidates=[];
 const seen=new Set();
 const add=(id,name,type,parent)=>{if(seen.has(id))return;seen.add(id);candidates.push({id,name,type,parent})};
 add("__workspace__","Workspace","Workspace","root");
 for(const n of loaded){
   if(n.type==="Folder"||n.hasChildren||n.type==="Workspace"||n.parent==="root") add(n.id,n.name,n.type,n.parent);
 }
 return candidates;
}
function parentDisplayPath(id){
 if(id==="__workspace__"||id==="root")return "Workspace";
 const n=state.tree.find(x=>x.id===id);if(!n)return "Workspace";
 return nodePathSegments(n).join(" › ")||n.name;
}
function showCreateScript(){
 const old=$("#rbxlCreate");if(old)old.remove();
 const box=document.createElement("div");box.id="rbxlCreate";box.className="rbxl-confirm";
 box.innerHTML='<div class="rbxl-confirm-card" style="max-width:620px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><h3 style="margin:0">Criar Script</h3><p style="margin:6px 0 0;color:#8995a5">Primeiro escolha o local. Depois defina o tipo e o nome do script.</p></div><button class="rbxl-btn" id="rbxlCreateCancel">×</button></div><div style="margin-top:14px;padding:11px;border:1px solid #293442;border-radius:10px;background:#080c12"><div style="font-size:10px;color:#8995a5">LOCAL DO SCRIPT</div><div id="rbxlCreateLocationLabel" style="margin-top:5px;color:#fff;font-weight:700">Workspace</div><div id="rbxlCreateLocationPath" style="margin-top:3px;color:#657287;font-size:9px">Workspace</div></div><div style="display:grid;gap:8px;margin-top:10px"><label style="font-size:10px;color:#9aa6b5">Local<select id="rbxlCreateParent" style="width:100%;margin-top:5px;background:#080c12;border:1px solid #293442;color:#fff;padding:10px;border-radius:8px"></select></label><label style="font-size:10px;color:#9aa6b5">Tipo<select id="rbxlCreateType" style="width:100%;margin-top:5px;background:#080c12;border:1px solid #293442;color:#fff;padding:10px;border-radius:8px"><option>Script</option><option>LocalScript</option><option>ModuleScript</option></select></label><label style="font-size:10px;color:#9aa6b5">Nome<input id="rbxlCreateName" value="NewScript" maxlength="80" style="width:100%;box-sizing:border-box;margin-top:5px;background:#080c12;border:1px solid #293442;color:#fff;padding:10px;border-radius:8px"></label></div><div class="rbxl-safe-note">O local escolhido será usado tanto para o rascunho quanto para a criação real no Roblox. Se a pasta ainda não foi carregada, abra-a no Explorer antes de criar para que ela apareça na lista.</div><div class="rbxl-confirm-actions"><button class="rbxl-btn" id="rbxlCreateLocal">Criar local</button><button class="rbxl-btn primary" id="rbxlCreateRemote">Criar no Roblox</button></div></div>';
 document.body.appendChild(box);
 const select=$("#rbxlCreateParent"),label=$("#rbxlCreateLocationLabel"),path=$("#rbxlCreateLocationPath");
 const candidates=scriptLocationCandidates();
 select.innerHTML=candidates.map(n=>'<option value="'+esc(n.id)+'">'+esc(n.name)+' • '+esc(n.type)+'</option>').join("");
 const preferred=currentParentId();
 if(candidates.some(n=>n.id===preferred))select.value=preferred;else select.value="__workspace__";
 const refreshLocation=()=>{const n=candidates.find(x=>x.id===select.value)||candidates[0];if(!n)return;label.textContent=n.name;path.textContent=parentDisplayPath(n.id);};
 select.onchange=refreshLocation;refreshLocation();
 const close=()=>box.remove();
 $("#rbxlCreateCancel").onclick=close;
 const buildNode=()=>{
   const type=$("#rbxlCreateType").value,name=($("#rbxlCreateName").value||"NewScript").trim().replace(/[<>:"/\\\\|?*]/g,"").slice(0,80)||"NewScript";
   const parent=select.value||"__workspace__";
   const id="local-"+Date.now()+"-"+Math.random().toString(36).slice(2,8);
   const source=type==="ModuleScript"?"local module = {}\\n\\nreturn module\\n":type==="LocalScript"?"-- Novo LocalScript\\n":"-- Novo Script\\n";
   return {id,parent:parent==="__workspace__"?"root":parent,name,type,hasChildren:false,local:true,source,sourceLoaded:true};
 };
 const openDraft=n=>{
   state.tree.push(n);state.files.set(n.id,n);state.current=n.id;state.dirty.add(n.id);
   $("#rbxlSave").disabled=false;$("#rbxlPublish").disabled=true;$("#rbxlSendScript").disabled=false;close();
   $("#rbxlWelcome").style.display="none";$("#rbxlCode").style.display="block";$("#rbxlFileName").textContent=n.name;$("#rbxlFileType").textContent=n.type+" • rascunho";$("#rbxlDirty").textContent="•";$("#rbxlCode").value=n.source;$("#rbxlHint").textContent="Rascunho local • use Enviar ao Roblox quando quiser";$("#rbxlStatus").textContent="✓ "+n.name+" criado em "+parentDisplayPath(n.parent);renderTree($("#rbxlSearch").value);setTimeout(()=>$("#rbxlCode").focus(),0);
 };
 $("#rbxlCreateLocal").onclick=()=>openDraft(buildNode());
 $("#rbxlCreateRemote").onclick=async()=>{
   const n=buildNode(),parentId=resolveRobloxParentId(n.parent);close();$("#rbxlStatus").textContent="Preparando criação no Roblox em "+parentDisplayPath(parentId)+"…";
   try{
     const d=await api("createScript",{scriptType:n.type,name:n.name,parentPath:robloxParentExpression(parentId),source:n.source});
     if(!d.taskPath)throw Error("O Roblox não retornou a tarefa de criação.");
     const task=await waitRobloxTask(d.taskPath);
     if(task.state!=="COMPLETE")throw Error("A criação não foi concluída.");
     await loadChildrenFor(parentId);
     const created=state.tree.filter(x=>!state.removed.has(x.id)&&x.name===n.name&&x.parent===parentId&&x.type===n.type).at(-1);
     if(created)await selectFile(created.id);
     $("#rbxlStatus").textContent="✓ "+n.name+" criado em "+parentDisplayPath(parentId)+" e salvo no Roblox";
     $("#rbxlHint").textContent="Criado diretamente no local escolhido";
     status("Script criado no Roblox");
   }catch(e){$("#rbxlStatus").textContent="Falha ao criar no Roblox: "+(e.message||String(e));$("#rbxlHint").textContent="Verifique as permissões da chave Open Cloud";status("Falha ao criar script")}
 };
}
function currentParentId(){
 const n=state.current?state.files.get(state.current):null;
 if(n?.parent)return n.parent;
 return "__workspace__";
}

function showDiagnosticPanel(title,ok,message,solution){
 const old=$("#rbxlDiagnosticPanel");if(old)old.remove();
 const box=document.createElement("div");box.id="rbxlDiagnosticPanel";box.className="rbxl-confirm";
 const statusLabel=ok?"✓ TESTE CONCLUÍDO":"✕ PROBLEMA ENCONTRADO";
 const statusColor=ok?"#dff7e7":"#ffd7d7";
 box.innerHTML='<div class="rbxl-confirm-card rbxl-diagnostic-card" style="max-width:700px;width:min(700px,94vw);max-height:86vh;overflow:auto"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><div style="font-size:10px;letter-spacing:1px;color:#7d8999">'+statusLabel+'</div><h3 style="margin:5px 0 0;font-size:19px">'+esc(title)+'</h3></div><button class="rbxl-btn" id="rbxlDiagnosticClose">×</button></div><div style="margin-top:16px;padding:14px;border:1px solid #293442;border-radius:10px;background:#080c12"><div style="font-size:10px;color:#8995a5">O QUE ACONTECEU</div><div style="margin-top:7px;color:'+statusColor+';white-space:pre-wrap;line-height:1.55;font-size:12px">'+esc(message)+'</div></div><div style="margin-top:12px;padding:14px;border:1px solid #293442;border-radius:10px;background:#080c12"><div style="font-size:10px;color:#8995a5">COMO RESOLVER</div><div style="margin-top:7px;color:#dce5ef;white-space:pre-wrap;line-height:1.6;font-size:12px">'+esc(solution)+'</div></div><div class="rbxl-safe-note">Este diagnóstico não usa alert e permanece aberto nesta aba até você fechá-lo. O erro retornado pelo Roblox é mostrado acima para facilitar a correção.</div><div class="rbxl-confirm-actions"><button class="rbxl-btn primary" id="rbxlDiagnosticDone">Entendi</button></div></div>';
 document.body.appendChild(box);
 const close=()=>box.remove();
 $("#rbxlDiagnosticClose").onclick=close;$("#rbxlDiagnosticDone").onclick=close;
}

function showConfirm(title,message,onConfirm){
 const old=$("#rbxlConfirm");if(old)old.remove();
 const box=document.createElement("div");box.id="rbxlConfirm";box.className="rbxl-confirm";
 box.innerHTML='<div class="rbxl-confirm-card" role="alertdialog" aria-modal="true"><h3>'+esc(title)+'</h3><p>'+esc(message)+'</p><div class="rbxl-safe-note">Proteção: nada será enviado ao Roblox sem sua confirmação. Se a API não suportar a operação, ela será bloqueada sem fazer requisição destrutiva.</div><div class="rbxl-confirm-actions"><button class="rbxl-btn" id="rbxlConfirmCancel">Cancelar</button><button class="rbxl-btn primary" id="rbxlConfirmOk">Confirmar</button></div></div>';
 document.body.appendChild(box);
 const close=()=>box.remove();
 $("#rbxlConfirmCancel").onclick=close;
 $("#rbxlConfirmOk").onclick=async()=>{close();try{await onConfirm()}catch(e){$("#rbxlStatus").textContent="Ação bloqueada com segurança: "+(e.message||String(e))}};
}
function safeUnsupportedAction(action,detail=""){
 const msg=detail||("A API Roblox Open Cloud usada pelo Studio RBXL ainda não permite "+action+" de Instances. Nenhuma requisição destrutiva foi enviada.");
 $("#rbxlStatus").textContent=msg;
 $("#rbxlHint").textContent="Operação não suportada pela API";
 status("Studio RBXL: operação bloqueada com segurança");
}
function hasPublishableChanges(){return [...state.dirty].some(id=>{const n=state.files.get(id);return n&&!n.local&&!state.removed.has(n.id)})}
function markDirty(){if(!state.current)return;const n=state.files.get(state.current);if(!n)return;n.source=$("#rbxlCode").value;state.dirty.add(n.id);$("#rbxlDirty").textContent="•";$("#rbxlSave").disabled=false;$("#rbxlPublish").disabled=!hasPublishableChanges();$("#rbxlSendScript").disabled=!(n.local);$("#rbxlStatus").textContent="Alteração local não salva";status("Studio RBXL: alteração pendente")}
async function connect(){
 const key=$("#rbxlApiKey").value.trim(),u=$("#rbxlUniverseInput").value.trim(),p=$("#rbxlPlaceInput").value.trim(),err=$("#rbxlAuthError");err.textContent="";
 if(!key||!/^\d+$/.test(u)||!/^\d+$/.test(p)){err.textContent="Informe uma chave válida e IDs numéricos.";return}
 state.apiKey=key;state.universeId=u;state.placeId=p;state.tree=[];state.files.clear();state.dirty.clear();state.removed.clear();state.current=null;state.expanded=new Set(["__workspace__"]);
 const btn=$("#rbxlAuth").querySelector("button");btn.disabled=true;btn.textContent="Conectando…";$("#rbxlStatus").textContent="Carregando Workspace…";
 try{
  let d=await api("load");
  if(d.pending){
   $("#rbxlStatus").textContent="Aguardando resposta do Roblox…";
   d.tree=await waitCloudOperation(d.operationPath,"root");
  }
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
 catch(e){
   const message=e.message||String(e);
   const solution=e.hint||"Confira Universe ID, Place ID e a chave Open Cloud. O painel mostra o erro real retornado pela API.";
   err.textContent=message;
   $("#rbxlStatus").textContent="Falha na conexão";
   showDiagnosticPanel("Não foi possível conectar ao Roblox",false,message,solution);
 }
 finally{const b=$("#rbxlAuth")?.querySelector("button");if(b){b.disabled=false;b.textContent="Conectar e carregar Workspace"}}
}
function normalizeCloudInstances(items,parentId="root"){
 const CONTAINERS=new Set(["Folder","Model","Tool","Configuration","ScreenGui","SurfaceGui","BillboardGui","Frame","ScrollingFrame","ViewportFrame","WorldModel"]);
 return (Array.isArray(items)?items:[]).map(item=>{
  const e=item?.engineInstance||item?.EngineInstance||{};
  const details=e?.Details||e?.details||{};
  const id=String(e.Id||e.id||item?.id||"").trim();
  if(!id)return null;
  const type=["Script","LocalScript","ModuleScript"].find(t=>details?.[t]||details?.[t.toLowerCase()])||String(e.ClassName||e.className||e.Type||details.ClassName||details.className||"Instance");
  const explicitChildren=item?.hasChildren??item?.HasChildren??e.HasChildren??e.hasChildren;
  const hasChildren=explicitChildren===undefined?CONTAINERS.has(type):Boolean(explicitChildren);
  return {id,parent:String(parentId||"root"),name:String(e.Name||e.name||details.Name||"Unnamed"),type,hasChildren,details};
 }).filter(Boolean);
}
async function waitCloudOperation(operationPath,parentId="root"){
 for(let i=0;i<40;i++){
  const d=await api("operation",{operationPath});
  if(d.done){
   return normalizeCloudInstances(d.instances||[],parentId);
  }
  $("#rbxlStatus").textContent="Roblox está preparando a hierarquia… "+Math.min(99,Math.round(((i+1)/40)*100))+"%";
  await new Promise(r=>setTimeout(r,1200));
 }
 throw Error("O Roblox demorou demais para devolver a hierarquia. Tente novamente; a chave não foi exposta.");
}
function indexNodes(nodes){for(const n of nodes||[]){if(!n)continue;if(SCRIPT_TYPES.has(n.type)&&!state.files.has(n.id))state.files.set(n.id,{...n,source:"",sourceLoaded:false})}}
function countScripts(){return state.files.size}
async function loadChildrenFor(parentId){
 if(!parentId||parentId==="root")return;
 if(state.loading.has(parentId))return;
 state.loading.add(parentId);renderTree($("#rbxlSearch").value);$("#rbxlStatus").textContent="Carregando pasta…";
 try{
  let d=await api("children",{parentId});
  let children=Array.isArray(d.children)?d.children:[];
  if(d.pending)children=await waitCloudOperation(d.operationPath,parentId);
  const normalized=normalizeCloudInstances(children,parentId);
  const byId=new Map(state.tree.map(n=>[String(n.id),n]));
  for(const n of normalized){
   const existing=byId.get(String(n.id));
   if(existing)Object.assign(existing,n);
   else{state.tree.push(n);byId.set(String(n.id),n)}
  }
  indexNodes(normalized);
  state.expanded.add(parentId);
  renderTree($("#rbxlSearch").value);
  $("#rbxlStatus").textContent=normalized.length+" itens carregados";
 }
 catch(e){$("#rbxlStatus").textContent="Falha ao carregar pasta: "+e.message}
 finally{state.loading.delete(parentId);renderTree($("#rbxlSearch").value)}
}
function renderTree(filter=""){
 const root=$("#rbxlTree");if(!root)return;root.innerHTML="";
 if(!state.tree.length){root.innerHTML='<div class="rbxl-loading">Nenhuma instância foi retornada pelo Roblox.</div>';return}
 const visible=state.tree.filter(n=>!state.removed.has(n.id));
 const ids=new Set(visible.map(n=>String(n.id)));
 const all=[{id:"__workspace__",parent:null,name:"Workspace",type:"Workspace",virtual:true,hasChildren:true},...visible.map(n=>{
   const rawParent=String(n.parent||"root");
   const parent=rawParent==="root"||rawParent==="__workspace__"||!ids.has(rawParent)?"__workspace__":rawParent;
   return {...n,parent};
 })],by=new Map();
 all.forEach(n=>by.set(n.id,[]));all.forEach(n=>{if(n.parent&&by.has(n.parent))by.get(n.parent).push(n)});
 if(filter){visible.filter(n=>((n.name+" "+n.type).toLowerCase().includes(filter.toLowerCase()))).forEach(n=>addRow(n,0,true));return}
 const draw=(parent,depth)=>{for(const n of(by.get(parent)||[]).sort((a,b)=>{const as=SCRIPT_TYPES.has(a.type),bs=SCRIPT_TYPES.has(b.type);return as===bs?a.name.localeCompare(b.name):as?1:-1})){addRow(n,depth,false);if(n.hasChildren&&state.expanded.has(n.id))draw(n.id,depth+1)}};
 draw("__workspace__",0);
}
function addRow(n,depth,filtered){
 const root=$("#rbxlTree"),row=document.createElement("div");row.className="rbxl-row"+(state.current===n.id?" active":"");row.style.paddingLeft=(8+depth*15)+"px";
 const open=state.expanded.has(n.id),loading=state.loading.has(n.id);
 row.innerHTML='<span class="arrow">'+(n.hasChildren?(loading?"…":open?"⌄":"›"):"")+'</span><span>'+icon(n.type)+'</span><span class="name">'+esc(n.name)+'</span><span class="type">'+esc(n.type)+'</span>';
 row.onclick=async()=>{if(n.virtual)return;if(SCRIPT_TYPES.has(n.type)){await selectFile(n.id);if(n.hasChildren){if(open&&!filtered){state.expanded.delete(n.id);renderTree($("#rbxlSearch").value);return}await loadChildrenFor(n.id)}return}state.current=n.id;renderTree($("#rbxlSearch").value);$("#rbxlStatus").textContent=n.name+" selecionado • use Excluir para remover";if(n.hasChildren){if(open&&!filtered){state.expanded.delete(n.id);renderTree($("#rbxlSearch").value);return}await loadChildrenFor(n.id)}};
 root.appendChild(row);
}
async function selectFile(id){
 const n=state.files.get(id);if(!n)return;
 if(n.local){state.current=id;$("#rbxlWelcome").style.display="none";$("#rbxlCode").style.display="block";$("#rbxlFileName").textContent=n.name;$("#rbxlFileType").textContent=n.type+" • rascunho";$("#rbxlDirty").textContent=state.dirty.has(id)?"•":"*";$("#rbxlSendScript").disabled=false;$("#rbxlCode").value=n.source||"";$("#rbxlHint").textContent="Rascunho local • não enviado ao Roblox";$("#rbxlStatus").textContent=n.name+" aberto como rascunho";renderTree($("#rbxlSearch").value);setTimeout(()=>$("#rbxlCode").focus(),0);return}state.current=id;$("#rbxlWelcome").style.display="none";$("#rbxlCode").style.display="block";$("#rbxlFileName").textContent=n.name;$("#rbxlFileType").textContent=n.type;$("#rbxlDirty").textContent=state.dirty.has(id)?"•":"";$("#rbxlSendScript").disabled=true;
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
 if(n?.local){n.source=$("#rbxlCode").value;state.dirty.delete(n.id);$("#rbxlDirty").textContent="";$("#rbxlSave").disabled=true;$("#rbxlPublish").disabled=!hasPublishableChanges();$("#rbxlStatus").textContent="✓ "+n.name+" salvo no rascunho local. Para existir no Roblox, a API atual precisa oferecer criação de Instance.";status("Rascunho salvo localmente");return}
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
async function testLuau(){
 const b=$("#rbxlTestLuau"); if(!b)return;
 b.disabled=true; b.textContent="Testando…";
 $("#rbxlStatus").textContent="Testando Luau Execution no Roblox…";
 $("#rbxlHint").textContent="Nenhuma alteração será feita no Place.";
 try{
   const d=await api("diagnostic");
   $("#rbxlStatus").textContent="✓ Luau Execution está funcionando";
   $("#rbxlHint").textContent="A chave consegue criar e executar tarefas Luau neste Place.";
   status("Luau Execution OK");
   showDiagnosticPanel("Luau Execution funcionando",true,"A chave conseguiu criar e executar uma tarefa Luau neste Place.","Nenhuma correção é necessária para o Luau Execution. Se a publicação continuar falhando, execute “Testar salvamento”. Se o salvamento falhar, verifique universe.places:write e a configuração de salvamento do Place.");
 }catch(e){
   $("#rbxlStatus").textContent="✕ Luau Execution falhou: "+(e.message||String(e));
   $("#rbxlHint").textContent="A mensagem acima é o erro real retornado pelo Roblox.";
   status("Luau Execution falhou");
   showDiagnosticPanel("Luau Execution falhou",false,e.message||String(e),"Confira se a chave possui universe.place.luau-execution-session:write e se o Place correto está permitido na chave. Depois execute novamente “Testar Luau”. Para publicar/salvar o Place, também verifique universe.places:write e a configuração de salvamento do Place.");
 }finally{
   b.disabled=false; b.textContent="Testar Luau";
 }
}
async function testSavePermission(){
 const b=$("#rbxlTestSave"); if(!b)return;
 b.disabled=true; b.textContent="Testando…";
 $("#rbxlStatus").textContent="Testando permissão de salvamento do Place…";
 $("#rbxlHint").textContent="Teste seguro: SavePlaceAsync com SaveWithoutPublish=true.";
 try{
   await api("saveDiagnostic");
   $("#rbxlStatus").textContent="✓ Salvamento autorizado neste Place";
   $("#rbxlHint").textContent="A chave consegue executar SavePlaceAsync sem publicar uma nova versão.";
   status("Permissão de salvamento OK");
   showDiagnosticPanel("Salvamento autorizado",true,"O Roblox autorizou SavePlaceAsync neste Place com SaveWithoutPublish=true.","Nenhuma correção é necessária para a permissão de salvamento. A próxima etapa é testar “Publicar alterações”. Se a publicação falhar, a nova aba de diagnóstico mostrará o erro real e a orientação correspondente.");
 }catch(e){
   $("#rbxlStatus").textContent="✕ Salvamento bloqueado: "+(e.message||String(e));
   $("#rbxlHint").textContent="Esse é o erro real retornado pelo Roblox.";
   status("Permissão de salvamento falhou");
   showDiagnosticPanel("Salvamento bloqueado",false,e.message||String(e),"Verifique universe.places:write / Places: write, confirme que esta chave permite exatamente este Universe/Place e confira se a API de salvamento está habilitada nas configurações do Place. Depois execute novamente “Testar salvamento”.");
 }finally{
   b.disabled=false; b.textContent="Testar salvamento";
 }
}
async function publishAll(){
 const changes=[...state.dirty].map(id=>{const n=state.files.get(id);return n&&!n.local&&!state.removed.has(n.id)?{instanceId:n.id,scriptType:n.type,source:n.source}:null}).filter(Boolean);
 if(!changes.length){$("#rbxlStatus").textContent="Nenhuma alteração pendente para publicar.";return}
 const b=$("#rbxlPublish");b.disabled=true;b.textContent="Publicando…";$("#rbxlStatus").textContent="Publicando "+changes.length+" arquivo(s)…";
 try{const d=await api("publishMany",{changes});state.dirty.clear();$("#rbxlDirty").textContent="";$("#rbxlStatus").textContent="✓ "+(d.saved??changes.length)+" arquivo(s) publicado(s) no Roblox";$("#rbxlHint").textContent="Place salvo com SavePlaceAsync pelo servidor Roblox";status("Publicação concluída")}
 catch(e){$("#rbxlStatus").textContent="Falha na publicação: "+e.message;$("#rbxlHint").textContent="A publicação usa Luau + SavePlaceAsync. Verifique luau-execution-session:write/read e se o Place permite API de salvamento.";status("Falha na publicação")}
 finally{b.textContent="Publicar";b.disabled=!!state.dirty.size}
}
function install(){
 window.StudioLiteRBXL={open};const bind=()=>{const b=$("#studioRbxlBtn");if(!b)return;b.type="button";b.dataset.studioRbxl="true";b.onclick=e=>{e.preventDefault();e.stopPropagation();open()}};bind();
 document.addEventListener("click",e=>{const b=e.target?.closest?.("#studioRbxlBtn,[data-studio-rbxl]");if(!b)return;e.preventDefault();e.stopPropagation();open()},true);window.addEventListener("pageshow",bind)
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();