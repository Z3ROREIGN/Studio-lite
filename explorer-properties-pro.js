/* Studio Lite — Explorer & Properties Pro 2026.10 */
(()=>{"use strict";
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const API=()=>window.StudioLiteProTools||{}, C=()=>window.StudioLiteCore||{};
const state=()=>API().getState?.()||null;
const nodes=()=>state()?.nodes||[];
const uid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SERVICES=["Workspace","Lighting","Players","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService","CollectionService","HttpService","MarketplaceService","TweenService","RunService","DataStoreService","MemoryStoreService","MessagingService","TeleportService"];
const TYPES=(window.ROBLOX_TYPES||[]).map(x=>x[0]||x).concat(["Part","Folder","Model","Script","LocalScript","ModuleScript","MeshPart","UnionOperation","SpawnLocation","Seat","VehicleSeat","WedgePart","Sphere","Cylinder","Tool","RemoteEvent","RemoteFunction","BindableEvent","BindableFunction","Attachment","Decal","Texture","SurfaceGui","BillboardGui","Highlight","Camera","PointLight","SpotLight","SurfaceLight","ParticleEmitter","Beam","Trail","ProximityPrompt","ClickDetector","Sky","Atmosphere","Configuration","StringValue","BoolValue","IntValue","NumberValue","ObjectValue","Color3Value","Vector3Value","Terrain"]);
const uniq=a=>[...new Set(a)];
const OBJECT_TYPES=uniq(TYPES);
function selected(){const s=state();return nodes().find(n=>n.id===s?.selected)||null}
function commit(){C().commit?.()}
function refresh(){C().render?.();setTimeout(()=>{drawTree();drawProperties()},0)}
function save(){C().save?.(false)}
function toast(t){window.toast?.(t)}
function validParent(n,p){if(!p||p===n.id)return false;let x=p;while(x){if(x===n.id)return false;x=nodes().find(v=>v.id===x)?.parent||null}return true}
function add(type,parentId=null){
 const s=state();if(!s)return;
 const parent=nodes().find(n=>n.id===parentId);
 commit();
 const scripts=/^(Script|LocalScript|ModuleScript)$/.test(type), values=/Value$/.test(type);
 const container=["Folder","Model","Tool","Configuration","RemoteEvent","RemoteFunction","BindableEvent","BindableFunction"].includes(type);
 const n={id:uid(),name:type,type,position:[0,2,0],rotation:[0,0,0],size:[2,2,2],color:"#3b82f6",material:"Plastic",anchored:true,canCollide:!container&&!scripts&&!values,transparency:0,locked:false,visible:!container&&!scripts&&!values,parent:parent?parent.id:null,attributes:{}};
 if(type==="SpawnLocation"){n.size=[2,1,2];n.color="#22c55e"}
 if(type==="Sphere"){n.size=[4,4,4];n.shape="sphere"}
 if(type==="Cylinder"){n.size=[3,4,3];n.shape="cylinder"}
 if(type==="WedgePart"||type==="CornerWedgePart"){n.shape="wedge"}
 if(scripts){n.script="-- "+type+" criado no Studio Lite\n\nprint(\"Hello from Roblox!\")";n.language="luau"}
 if(values){n.value=type==="BoolValue"?false:type==="StringValue"?"":type==="ObjectValue"?null:0;n.visible=false;n.canCollide=false}
 if(container){n.visible=false;n.canCollide=false}
 s.nodes.push(n);s.selected=n.id;s.selectedIds=[n.id];save();refresh();toast(type+" criado");if(scripts)setTimeout(()=>window.openScript?.(n.id),30);return n
}
function remove(n=selected()){if(!n)return;if(n.id==="spawn"){toast("SpawnLocation principal protegido");return}commit();const ids=new Set([n.id]);let loop=true;while(loop){loop=false;nodes().forEach(x=>{if(x.parent&&ids.has(x.parent)&&!ids.has(x.id)){ids.add(x.id);loop=true}})}const s=state();s.nodes=s.nodes.filter(x=>!ids.has(x.id));s.selected=s.nodes[0]?.id||null;s.selectedIds=s.selected?[s.selected]:[];save();refresh();toast(ids.size>1?ids.size+" itens excluídos":"Item excluído")}
function rename(n=selected()){if(!n)return;const v=prompt("Novo nome",n.name);if(v?.trim()){commit();n.name=v.trim().slice(0,100);save();refresh()}}
function icon(n){const t=n?.type||"Folder";return {Part:"▣",MeshPart:"◆",Folder:"▱",Model:"◇",Script:"◇",LocalScript:"◇",ModuleScript:"◇",SpawnLocation:"⌂",Camera:"◉",Terrain:"▰",PointLight:"☼",Attachment:"⊙",Tool:"⚒"}[t]||"•"}
function kind(n){if(/Script$/.test(n.type))return"script";if(["Folder","Model","Tool","Configuration"].includes(n.type))return"folder";if(/Value$/.test(n.type))return"value";return"object"}
function treeChildren(parent){return nodes().filter(n=>(n.parent||null)===parent)}
function renderInto(list,depth,host){
 const filter=(q("#treeSearch")?.value||"").trim().toLowerCase();
 list.forEach(n=>{
  const children=treeChildren(n.id);
  const matches=!filter||String(n.name||"").toLowerCase().includes(filter)||String(n.type||"").toLowerCase().includes(filter);
  const childMatches=children.some(c=>String(c.name||"").toLowerCase().includes(filter)||String(c.type||"").toLowerCase().includes(filter));
  if(filter&&!matches&&!childMatches)return;
  const row=document.createElement("div");
  row.className="expro-row"+(state()?.selected===n.id?" selected":"");
  row.style.paddingLeft=(6+depth*16)+"px";
  const arrow=document.createElement("button");arrow.className="expro-arrow"+(children.length?"":" empty");arrow.textContent=children.length?(n._explorerExpanded!==false?"⌄":"›"):"·";arrow.title=children.length?"Expandir/Recolher":"";
  const ic=document.createElement("span");ic.className="expro-icon "+kind(n);ic.textContent=icon(n);
  const name=document.createElement("span");name.className="expro-name";name.textContent=n.name||n.type;
  const type=document.createElement("span");type.className="expro-type";type.textContent=n.type;
  const plus=document.createElement("button");plus.className="expro-more";plus.title="Adicionar filho";plus.textContent="＋";
  row.append(arrow,ic,name,type,plus);host.appendChild(row);
  row.onclick=e=>{if(e.target.closest(".expro-more")||e.target.closest(".expro-arrow"))return;const st=state();if(st){st.selected=n.id;st.selectedIds=[n.id]}C().render?.();drawTree();drawProperties()};
  row.ondblclick=()=>{/Script$/.test(n.type)?window.openScript?.(n.id):rename(n)};
  row.oncontextmenu=e=>{e.preventDefault();const st=state();if(st){st.selected=n.id;st.selectedIds=[n.id]}drawProperties();openContext(n,e.clientX,e.clientY)};
  arrow.onclick=e=>{e.stopPropagation();if(!children.length)return;n._explorerExpanded=!(n._explorerExpanded!==false);drawTree()};
  plus.onclick=e=>{e.stopPropagation();const st=state();if(st){st.selected=n.id;st.selectedIds=[n.id]}drawProperties();openAddMenu(n.id,e.clientX,e.clientY)};
  if(children.length&&(n._explorerExpanded!==false||filter)){const child=document.createElement("div");child.className="expro-children";host.appendChild(child);renderInto(children,depth+1,child)}
 });
}
function drawTree(){
 const host=q("#tree");if(!host)return;
 const filter=(q("#treeSearch")?.value||"").trim().toLowerCase();
 host.innerHTML="";
 const head=document.createElement("div");head.className="expro-root-head";head.innerHTML='<span class="expro-chevron">⌄</span><span class="expro-icon">⌂</span><b>Workspace</b><span class="expro-count">'+nodes().length+'</span><button class="expro-add-root" data-root-add="all" title="Adicionar objeto">＋</button><button class="expro-add-root" data-root-add="script" title="Adicionar Script">◇</button><button class="expro-add-root" data-root-add="folder" title="Adicionar Folder">▱</button>';host.appendChild(head);
 head.querySelectorAll("button").forEach(b=>b.onclick=e=>{e.stopPropagation();const a=b.dataset.rootAdd;if(a==="script")add("Script",null);else if(a==="folder")add("Folder",null);else openAddMenu(null,e.clientX,e.clientY)});
 const workspaceNode=nodes().find(n=>n.type==="Workspace");
 if(workspaceNode){
   const wr=document.createElement("div");
   wr.className="expro-workspace-row"+(state()?.selected===workspaceNode.id?" selected":"");
   wr.innerHTML='<button class="expro-arrow">⌄</button><span class="expro-icon">⌂</span><span class="expro-name">'+esc(workspaceNode.name||"Workspace")+'</span><span class="expro-type">Workspace</span><button class="expro-more" title="Adicionar objeto">＋</button>';
   host.appendChild(wr);
   wr.onclick=e=>{if(e.target.closest("button"))return;const st=state();if(st){st.selected=workspaceNode.id;st.selectedIds=[workspaceNode.id]}drawProperties();drawTree()};
   wr.querySelector(".expro-more").onclick=e=>{e.stopPropagation();openAddMenu(workspaceNode.id,e.clientX,e.clientY)};
   const child=workspaceNode._explorerExpanded!==false?document.createElement("div"):null;
   if(child){child.className="expro-children";host.appendChild(child);renderInto(treeChildren(workspaceNode.id),1,child)}
 }
 const roots=treeChildren(null).filter(n=>n.type!=="Workspace");
 renderInto(roots,0,host);
 // virtual Roblox services, always visible and expandable
 const svc=document.createElement("div");svc.className="expro-services";
 svc.innerHTML='<div class="expro-services-head"><span>ROBLOX SERVICES</span><small>'+SERVICES.length+'</small></div>';
 SERVICES.filter(x=>x!=="Workspace").forEach(name=>{
   const r=document.createElement("div");r.className="expro-service";r.innerHTML='<button class="expro-arrow empty">·</button><span class="expro-icon service">▱</span><span class="expro-name">'+name+'</span><span class="expro-type">Service</span><button class="expro-more">＋</button>';
   r.querySelector(".expro-more").onclick=e=>{e.stopPropagation();openAddMenu(null,e.clientX,e.clientY,name)};
   r.onclick=()=>toast(name+" é um serviço do Roblox. Objetos do editor ficam no Workspace.");
   svc.appendChild(r)
 });
 host.appendChild(svc);
 q("#objectCount").textContent=nodes().length+" objetos";
}
function openAddMenu(parentId,x,y,service){
 closeMenus();const box=document.createElement("div");box.id="exproMenu";box.className="expro-menu";
 box.innerHTML='<div class="expro-menu-title">ADICIONAR'+(service?" • "+esc(service):parentId?" COMO FILHO":"")+" </div><input placeholder="Pesquisar classe..." id="exproAddSearch"><div class="expro-menu-grid"></div>";
 document.body.appendChild(box);positionMenu(box,x,y);
 const grid=box.querySelector(".expro-menu-grid"),search=box.querySelector("input");
 const draw=term=>{grid.innerHTML="";uniq(OBJECT_TYPES).filter(t=>!term||t.toLowerCase().includes(term.toLowerCase())).slice(0,80).forEach(t=>{const b=document.createElement("button");b.textContent="+ "+t;b.onclick=()=>{closeMenus();add(t,parentId||null)};grid.appendChild(b)})};draw("");search.oninput=()=>draw(search.value);search.focus()
}
function openContext(n,x,y){closeMenus();const m=document.createElement("div");m.id="exproMenu";m.className="expro-menu expro-context";m.innerHTML='<div class="expro-menu-title">'+esc(n.name)+' <small>'+esc(n.type)+'</small></div><button data-a="add">＋ Adicionar filho</button><button data-a="script">◇ Adicionar Script</button><button data-a="folder">▱ Adicionar Folder</button><button data-a="rename">✎ Renomear</button><button data-a="duplicate">⧉ Duplicar</button><button data-a="delete" class="danger">⌫ Excluir</button>';
 document.body.appendChild(m);positionMenu(m,x,y);
 m.querySelector('[data-a="add"]').onclick=()=>openAddMenu(n.id,x,y);
 m.querySelector('[data-a="script"]').onclick=()=>{closeMenus();add("Script",n.id)};
 m.querySelector('[data-a="folder"]').onclick=()=>{closeMenus();add("Folder",n.id)};
 m.querySelector('[data-a="rename"]').onclick=()=>{closeMenus();rename(n)};
 m.querySelector('[data-a="duplicate"]').onclick=()=>{closeMenus();state().selected=n.id;API().duplicateSelected?.()};
 m.querySelector('[data-a="delete"]').onclick=()=>{closeMenus();remove(n)};
}
function positionMenu(el,x,y){el.style.left=Math.min(x||30,innerWidth-330)+"px";el.style.top=Math.min(y||80,innerHeight-430)+"px"}
function closeMenus(){q("#exproMenu")?.remove()}
function section(p,t){const d=document.createElement("div");d.className="expro-section";d.textContent=t;p.appendChild(d)}
function row(p,label,control){const d=document.createElement("div");d.className="expro-field";const l=document.createElement("label");l.textContent=label;d.append(l,control);p.appendChild(d);return d}
function input(v,type="text"){const i=document.createElement("input");i.type=type;i.value=v??"";return i}
function num(p,label,v,fn){const i=input(Number(v)||0,"number");i.step="0.01";row(p,label,i);i.onchange=()=>{commit();fn(Number(i.value)||0);save();refresh()}}
function vector(p,label,a,fn){const d=document.createElement("div");d.className="expro-vector";const vals=Array.isArray(a)?a:[0,0,0];["X","Y","Z"].forEach((k,j)=>{const i=input(vals[j]||0,"number");i.step=".01";i.title=k;i.onchange=()=>{commit();const v=[...vals].map(Number);v[j]=Number(i.value)||0;fn(v);save();refresh()};d.appendChild(i)});row(p,label,d)}
function toggle(p,label,v,fn){const b=document.createElement("button");b.className="expro-toggle "+(v?"on":"");b.textContent=v?"ON":"OFF";b.onclick=()=>{commit();fn(!v);save();drawProperties();refresh()};row(p,label,b)}
function select(p,label,v,opts,fn){const s=document.createElement("select");opts.forEach(o=>{const op=document.createElement("option");op.value=o;op.textContent=o;if(String(o)===String(v))op.selected=true;s.appendChild(op)});row(p,label,s);s.onchange=()=>{commit();fn(s.value);save();refresh()}}
function propInput(p,label,v,fn){const i=input(v);row(p,label,i);i.onchange=()=>{commit();fn(i.value);save();refresh()}}
function drawProperties(){
 const p=q("#panel");if(!p)return;
 const n=selected();p.innerHTML="";
 if(!n){p.innerHTML='<div class="expro-empty"><b>Nenhum objeto selecionado</b><span>Selecione um item no Explorer ou na cena.</span></div>';return}
 const head=document.createElement("div");head.className="expro-object-head";head.innerHTML='<div class="expro-big-icon">'+icon(n)+'</div><div><b>'+esc(n.name)+'</b><small>'+esc(n.type)+' • '+esc(n.id).slice(0,8)+'</small></div><button id="exproPropMenu">⋮</button>';p.appendChild(head);
 section(p,"IDENTIDADE");propInput(p,"Name",n.name,v=>n.name=String(v).slice(0,100));propInput(p,"Class",n.type,()=>{}).querySelector("input").disabled=true;
 const parents=[["","Workspace"],...nodes().filter(x=>x.id!==n.id).map(x=>[x.id,x.name+" • "+x.type])];select(p,"Parent",n.parent||"",parents.map(x=>x[0]),v=>{if(v&&validParent(n,v))n.parent=v||null});
 const parentRow=p.lastElementChild;const ps=parentRow.querySelector("select");parents.forEach((x,i)=>ps.options[i].textContent=x[1]);
 const nonTransform=/^(Folder|Model|Tool|Configuration|Workspace|Players|Lighting|ReplicatedFirst|ReplicatedStorage|ServerScriptService|ServerStorage|StarterGui|StarterPack|StarterPlayer|Teams|SoundService|Chat|TextChatService|MaterialService|TestService|VoiceChatService|Attachment|Decal|Texture|SurfaceGui|BillboardGui|Highlight|Camera|PointLight|SpotLight|SurfaceLight|ParticleEmitter|Beam|Trail|ProximityPrompt|ClickDetector|Sky|Atmosphere|Terrain)$/;
 if(!nonTransform.test(n.type)){
   section(p,"TRANSFORM");vector(p,"Position",n.position,v=>n.position=v);vector(p,"Rotation",n.rotation,v=>n.rotation=v);vector(p,"Size",n.size,v=>n.size=v.map(x=>Math.max(.05,Math.abs(x))));
 }
 if(n.type==="Workspace"){
   section(p,"WORKSPACE");
   num(p,"Gravity",n.rbxProperties?.Gravity??196.2,v=>{n.rbxProperties??={};n.rbxProperties.Gravity=v});
   toggle(p,"StreamingEnabled",!!n.rbxProperties?.StreamingEnabled,v=>{n.rbxProperties??={};n.rbxProperties.StreamingEnabled=v});
   toggle(p,"FilteringEnabled",n.rbxProperties?.FilteringEnabled!==false,v=>{n.rbxProperties??={};n.rbxProperties.FilteringEnabled=v});
 }
 section(p,"APPEARANCE");
 if(n.color!=null){const c=input(n.color,"color");row(p,"Color",c);c.onchange=()=>{commit();n.color=c.value;save();refresh()}}
 select(p,"Material",n.material||"Plastic",["Plastic","Metal","Wood","Glass","Neon","Concrete","Brick","Grass","Ice","Sand"],v=>n.material=v);
 num(p,"Transparency",n.transparency||0,v=>n.transparency=Math.max(0,Math.min(1,v)));
 if(["Part","MeshPart","UnionOperation","SpawnLocation","Seat","VehicleSeat","WedgePart","CornerWedgePart","Sphere","Cylinder"].includes(n.type))select(p,"Shape",n.shape||"box",["box","sphere","cylinder","wedge"],v=>n.shape=v);
 section(p,"BEHAVIOR");toggle(p,"Anchored",n.anchored!==false,v=>n.anchored=v);toggle(p,"CanCollide",n.canCollide!==false,v=>n.canCollide=v);toggle(p,"CanTouch",n.canTouch!==false,v=>n.canTouch=v);toggle(p,"CanQuery",n.canQuery!==false,v=>n.canQuery=v);toggle(p,"Locked",!!n.locked,v=>n.locked=v);toggle(p,"Visible",n.visible!==false,v=>n.visible=v);
 if(/Value$/.test(n.type)){section(p,"VALUE");const type=n.type;if(type==="BoolValue"){toggle(p,"Value",!!n.value,v=>n.value=v)}else if(type==="Color3Value"){const c=input(n.value||"#ffffff","color");row(p,"Value",c);c.onchange=()=>{commit();n.value=c.value;save();refresh()}}else if(type==="Vector3Value"){vector(p,"Value",n.value||[0,0,0],v=>n.value=v)}else propInput(p,"Value",n.value??"",v=>{n.value=/^(IntValue|NumberValue)$/.test(type)?Number(v)||0:v})}
 if(/Script$/.test(n.type)){section(p,"SCRIPT / LUAU");propInput(p,"Language",n.language||"luau",v=>n.language=v).querySelector("input").disabled=true;const ta=document.createElement("textarea");ta.className="expro-code";ta.value=n.script||"";ta.spellcheck=false;const r=row(p,"Source",ta);ta.onchange=()=>{commit();n.script=ta.value;save();toast("Script salvo")};const open=document.createElement("button");open.className="expro-primary";open.textContent="Abrir Code Studio";open.onclick=()=>window.openScript?.(n.id);r.appendChild(open)}
 section(p,"ATTRIBUTES");const attrs=n.attributes&&typeof n.attributes==="object"?n.attributes:{};const keys=Object.keys(attrs);keys.forEach(k=>propInput(p,k,attrs[k],v=>{n.attributes[k]=v}));
 const ab=document.createElement("button");ab.className="expro-secondary";ab.textContent="＋ Adicionar Attribute";ab.onclick=()=>{const k=prompt("Nome do Attribute");if(!k)return;commit();n.attributes??={};n.attributes[k]="";save();drawProperties()};p.appendChild(ab);
 const json=document.createElement("textarea");json.className="expro-json";json.value=JSON.stringify(n.rbxProperties||{},null,2);section(p,"ROBLOX PROPERTIES");p.appendChild(json);const apply=document.createElement("button");apply.className="expro-secondary";apply.textContent="Aplicar propriedades RBX";apply.onclick=()=>{try{const o=JSON.parse(json.value||"{}");commit();n.rbxProperties=o;Object.entries(o).forEach(([k,v])=>{if(k==="Name")n.name=String(v);if(k==="Source"&&/Script$/.test(n.type))n.script=String(v)});save();refresh();toast("Propriedades RBX atualizadas")}catch{toast("JSON de propriedades inválido")}};p.appendChild(apply);
 section(p,"HIERARCHY ACTIONS");const actions=document.createElement("div");actions.className="expro-actions";[["＋ Filho",()=>openAddMenu(n.id,innerWidth/2,100)],["◇ Script",()=>add("Script",n.id)],["▱ Folder",()=>add("Folder",n.id)],["⧉ Duplicar",()=>{state().selected=n.id;API().duplicateSelected?.()}],["⌫ Excluir",()=>remove(n)]].forEach(([t,f])=>{const b=document.createElement("button");b.textContent=t;b.onclick=f;actions.appendChild(b)});p.appendChild(actions);
}
function install(){
 const tree=q("#tree");if(!tree)return;
 let scheduled=false;
 const sync=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;drawTree();drawProperties()})};
 drawTree();drawProperties();
 q("#treeSearch")?.addEventListener("input",()=>drawTree());
 document.addEventListener("click",e=>{if(!e.target.closest("#exproMenu"))closeMenus()});
 const core=C();
 if(core.render&&!core.render.__explorerProWrapped){
   const original=core.render;
   const wrapped=function(...args){const result=original.apply(this,args);sync();return result};
   wrapped.__explorerProWrapped=true;
   core.render=wrapped;
 }
 window.StudioLiteExplorerPro={refresh:sync,add,remove,rename,drawTree,drawProperties};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(install,700));else setTimeout(install,700);
})();