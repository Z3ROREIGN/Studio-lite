(()=>{"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const initial=[
{id:"spawn",name:"SpawnLocation",type:"SpawnLocation",position:[0,1,0],rotation:[0,0,0],size:[2,1,2],color:"#22c55e",material:"Neon",anchored:true,canCollide:true,transparency:0,locked:false,visible:true,parent:null},
{id:"base",name:"Baseplate",type:"Part",position:[0,0,0],rotation:[0,0,0],size:[24,1,24],color:"#586174",material:"Plastic",anchored:true,canCollide:true,transparency:0,locked:false,visible:true,parent:null},
{id:"platform",name:"Platform",type:"Part",position:[0,3,-7],rotation:[0,0,0],size:[6,1,4],color:"#8b5cf6",material:"Plastic",anchored:true,canCollide:true,transparency:0,locked:false,visible:true,parent:null}
];
const S={nodes:clone(initial),selected:"base",tool:"select",panel:"properties",playing:false,project:"Meu Primeiro Jogo",grid:1,snap:true,history:[],future:[],sourceRbxl:null,playSnapshot:null,clipboard:null,settings:{theme:"dark",outline:true,autosave:true}};
let scene,camera,renderer,ray,pointer,target,theta=.62,phi=.92,radius=27,orbit=false,drag=false,lx=0,ly=0,meshes=new Map(),selectionBox,dragStart=null,editorGrid=null,simLast=0,simVelocity=new Map();
function status(t){$("#status").textContent=t;$("#footerStatus").textContent=t}
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;$("#toastRoot").appendChild(d);setTimeout(()=>d.remove(),2400)}
function cur(){return S.nodes.find(n=>n.id===S.selected)}
function commit(){S.history.push({nodes:clone(S.nodes),selected:S.selected,project:S.project});if(S.history.length>60)S.history.shift();S.future=[]}
function restore(s){S.nodes=clone(s.nodes);S.selected=s.selected;S.project=s.project;$("#projectName").value=S.project;render()}
function save(notify=true){try{localStorage.setItem("studio-lite-v4",JSON.stringify({name:S.project,nodes:S.nodes,settings:S.settings,grid:S.grid,snap:S.snap}));status("Salvo localmente");if(notify)toast("Projeto salvo neste dispositivo")}catch(err){console.error(err);status("Falha ao salvar");toast("Não foi possível salvar: armazenamento cheio ou bloqueado")}}
function undo(){if(!S.history.length)return toast("Nada para desfazer");S.future.push({nodes:clone(S.nodes),selected:S.selected,project:S.project});restore(S.history.pop());save(false);toast("Desfeito")}
function redo(){if(!S.future.length)return toast("Nada para refazer");S.history.push({nodes:clone(S.nodes),selected:S.selected,project:S.project});restore(S.future.pop());save(false);toast("Refeito")}
function add(type="Part"){commit();const p={Part:[[4,1,4],"#3b82f6","Plastic","box"],SpawnLocation:[[2,1,2],"#22c55e","Neon","box"],Folder:[[1,1,1],"#64748b","Plastic","box"],Script:[[1,1,1],"#64748b","Plastic","box"],Sphere:[[4,4,4],"#f59e0b","Plastic","sphere"],Cylinder:[[3,4,3],"#06b6d4","Metal","cylinder"],Wedge:[[4,3,4],"#ef4444","Plastic","wedge"]}[type]||[[4,1,4],"#3b82f6","Plastic","box"];const n={id:uid(),name:type,type,position:[0,2,0],rotation:[0,0,0],size:p[0].slice(),color:p[1],material:p[2],shape:p[3],anchored:true,canCollide:type!=="Folder"&&type!=="Script",transparency:0,locked:false,visible:true,parent:null};if(type==="Script")n.script='-- Novo Script\n\nprint("Hello from Studio Lite!")';S.nodes.push(n);S.selected=n.id;render();save(false);toast(type+" criado");if(type==="Script")openScript(n.id)}
function duplicate(){const n=cur();if(!n)return;commit();const d=clone(n);d.id=uid();d.name=n.name+" Copy";d.position=[...n.position];d.position[0]+=S.snap?S.grid*2:2;d.position[2]+=S.snap?S.grid*2:2;S.nodes.push(d);S.selected=d.id;render();toast("Objeto duplicado")}
function remove(){const n=cur();if(!n)return;if(n.id==="spawn")return toast("O SpawnLocation principal está protegido");commit();const ids=new Set([n.id]);let again=true;while(again){again=false;S.nodes.forEach(x=>{if(x.parent&&ids.has(x.parent)&&!ids.has(x.id)){ids.add(x.id);again=true}})}S.nodes=S.nodes.filter(x=>!ids.has(x.id));S.selected=S.nodes.find(x=>x.type==="Part")?.id||S.nodes[0]?.id||null;render();save(false);toast("Objeto excluído")}
function rename(){const n=cur();if(!n)return;openPrompt("Renomear objeto","Novo nome",n.name,v=>{if(v){commit();n.name=v;render();save(false)}})}
function setTool(t){S.tool=t;$$(".tool").forEach(x=>x.classList.toggle("active",x.dataset.tool===t));status({select:"Seleção",move:"Mover",rotate:"Rotacionar",scale:"Escalar"}[t]||t)}
function init(){try{if(typeof THREE==="undefined")throw new Error("THREE indisponível");scene=new THREE.Scene();scene.background=new THREE.Color("#030303");camera=new THREE.PerspectiveCamera(55,1,.05,1500);const test=document.createElement("canvas"),gl=test.getContext("webgl2")||test.getContext("webgl")||test.getContext("experimental-webgl");if(!gl)throw new Error("WebGL indisponível");renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,context:gl});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;$("#canvas").appendChild(renderer.domElement);$("#engineHud").textContent="WebGL";scene.add(new THREE.HemisphereLight(0xffffff,0x111111,1.8));const l=new THREE.DirectionalLight(0xffffff,1.8);l.position.set(12,25,15);scene.add(l);editorGrid=new THREE.GridHelper(100,100,0x2c2c2c,0x111111);scene.add(editorGrid);target=new THREE.Vector3(0,1,0);ray=new THREE.Raycaster();pointer=new THREE.Vector2();selectionBox=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.9}));scene.add(selectionBox);selectionBox.visible=false;resize();renderer.domElement.oncontextmenu=e=>e.preventDefault();renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointermove",move);renderer.domElement.addEventListener("pointerup",up);renderer.domElement.addEventListener("pointercancel",up);renderer.domElement.addEventListener("wheel",wheel,{passive:false});addEventListener("resize",resize);loop()}catch(err){console.warn("WebGL indisponível",err);renderer=null;scene=null;camera=null;ray=null;pointer=null;selectionBox=null;initFallbackCanvas();$("#engineHud").textContent="2D COMPAT";status("Modo 2D compatível");const h=$("#viewport");if(h&&!$("#compat2d-badge")){const b=document.createElement("div");b.id="compat2d-badge";b.className="compat2d-badge";b.textContent="2D • COMPATÍVEL";h.appendChild(b)}}}
function resize(){const e=$("#canvas");if(!e?.clientWidth||!e?.clientHeight||!camera||!renderer)return;camera.aspect=e.clientWidth/e.clientHeight;camera.updateProjectionMatrix();renderer.setSize(e.clientWidth,e.clientHeight,false)}
function sync(){camera.position.set(target.x+radius*Math.sin(phi)*Math.sin(theta),target.y+radius*Math.cos(phi),target.z+radius*Math.sin(phi)*Math.cos(theta));camera.lookAt(target)}
function down(e){if(S.playing)return;if(e.button===1||e.button===2||e.shiftKey){orbit=true;lx=e.clientX;ly=e.clientY;return}const r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects([...meshes.values()]).filter(h=>h.object.visible);if(hits[0]?.object.userData.id){const n=S.nodes.find(x=>x.id===hits[0].object.userData.id);if(n?.locked)return toast("Objeto bloqueado");S.selected=hits[0].object.userData.id;drag=S.tool!=="select";lx=e.clientX;ly=e.clientY;dragStart=clone(n);render();status("Selecionado")}else{S.selected=null;render()}}
function move(e){if(orbit){theta-=(e.clientX-lx)*.008;phi=Math.max(.1,Math.min(Math.PI-.1,phi-(e.clientY-ly)*.008));lx=e.clientX;ly=e.clientY;sync();return}if(!drag||!cur())return;const n=cur(),dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;if(!n._dragged){commit();n._dragged=true}
 if(S.tool==="move"){n.position[0]+=dx*.025;n.position[1]-=dy*.025;if(S.snap)n.position=n.position.map(v=>Math.round(v/S.grid)*S.grid)}
 if(S.tool==="rotate"){n.rotation[1]+=dx*.5;n.rotation[0]-=dy*.15;if(S.snap)n.rotation=n.rotation.map(v=>Math.round(v/15)*15)}
 if(S.tool==="scale"){const q=Math.max(.1,1-dy*.01);n.size=n.size.map(v=>Math.max(.1,v*q));if(S.snap)n.size=n.size.map(v=>Math.max(.1,Math.round(v/S.grid)*S.grid))}
 render(false)}
function up(){orbit=false;drag=false;S.nodes.forEach(n=>delete n._dragged);if(dragStart)save(false);dragStart=null}
function wheel(e){e.preventDefault();radius=Math.max(2,Math.min(160,radius*(e.deltaY>0?1.08:.92)));sync()}
function simulate(dt){if(!S.playing)return;dt=Math.min(Math.max(dt,0),.05);const physical=S.nodes.filter(n=>n.type!=="Folder"&&n.type!=="Script"&&n.visible!==false);for(const n of physical){if(n.anchored||!n.canCollide)continue;let v=simVelocity.get(n.id)||0;v-=28*dt;n.position[1]+=v*dt;const half=Math.max(.05,n.size[1]/2);let support=-Infinity;for(const floor of physical){if(floor.id===n.id||!floor.anchored||!floor.canCollide||floor.visible===false)continue;const ox=Math.abs(n.position[0]-floor.position[0]) <= (n.size[0]+floor.size[0])/2;const oz=Math.abs(n.position[2]-floor.position[2]) <= (n.size[2]+floor.size[2])/2;if(ox&&oz){const top=floor.position[1]+floor.size[1]/2;if(n.position[1]-half<=top+.15&&top>support)support=top}}if(support>-Infinity&&n.position[1]-half<support){n.position[1]=support+half;v=0}else if(n.position[1]-half<-.5){n.position[1]=-.5+half;v=0}simVelocity.set(n.id,v)}render(false)}
function copySelected(){const n=cur();if(!n)return toast("Selecione um objeto primeiro");S.clipboard=clone(n);toast("Objeto copiado")}
function pasteSelected(){if(!S.clipboard)return toast("Nenhum objeto copiado");commit();const n=clone(S.clipboard);n.id=uid();n.name=(n.name||"Object")+" Copy";n.position=[...(n.position||[0,2,0])];n.position[0]+=S.grid*2;n.position[2]+=S.grid*2;S.nodes.push(normalizeNode(n));S.selected=n.id;render();save(false);toast("Objeto colado")}
function newProject(){if(!confirm("Criar um projeto novo? Alterações não salvas serão substituídas."))return;commit();S.nodes=clone(initial);S.selected="base";S.project="Meu Primeiro Jogo";S.sourceRbxl=null;S.playSnapshot=null;simVelocity.clear();$("#projectName").value=S.project;view("home");render();save(false);toast("Novo projeto criado")}
function screenshot(){try{let url;if(renderer&&scene){renderer.render(scene,camera);url=renderer.domElement.toDataURL("image/png")}else if(typeof fallbackCanvas!=="undefined"&&fallbackCanvas){drawFallback();url=fallbackCanvas.toDataURL("image/png")}else{toast("Viewport ainda não está pronta");return}const a=document.createElement("a");a.download=(S.project||"studio-lite").replace(/[^a-z0-9_-]+/gi,"-")+".png";a.href=url;document.body.appendChild(a);a.click();a.remove();toast("Screenshot exportado")}catch(err){console.error(err);toast("Não foi possível capturar a viewport")}}
function loop(now=performance.now()){if(S.playing){const dt=(now-(simLast||now))/1000;simLast=now;simulate(dt)}if(renderer&&scene&&camera)renderer.render(scene,camera);else if(typeof drawFallback==="function"&&fallbackCtx)drawFallback();requestAnimationFrame(loop)}
function meshFor(n){let m=meshes.get(n.id);if(!m){m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.65,metalness:.08,transparent:true}));m.userData.id=n.id;m.userData.shape="box";scene.add(m);meshes.set(n.id,m)}return m}
function geometryFor(n){const s=n.shape||"box";if(s==="sphere")return new THREE.SphereGeometry(.5,32,20);if(s==="cylinder")return new THREE.CylinderGeometry(.5,.5,1,32);if(s==="wedge"){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(new Float32Array([-.5,-.5,-.5,.5,-.5,-.5,-.5,.5,-.5,-.5,-.5,.5,.5,-.5,.5,-.5,.5,.5]),3));g.setIndex([0,1,2,3,5,4,0,3,4,0,4,1,2,1,4,2,4,5,0,2,5,0,5,3]);g.computeVertexNormals();return g}return new THREE.BoxGeometry(1,1,1)}
function updateMeshes(){const ids=new Set();S.nodes.forEach(n=>{ids.add(n.id);const m=meshFor(n),shape=n.shape||"box";if(m.userData.shape!==shape){m.geometry.dispose();m.geometry=geometryFor(n);m.userData.shape=shape}m.position.set(...n.position);m.rotation.set(...n.rotation.map(v=>v*Math.PI/180));m.scale.set(...n.size);m.visible=!["Folder","Script"].includes(n.type)&&n.visible!==false;m.material.color.set(n.color||"#777");m.material.transparent=(n.transparency||0)>0;m.material.opacity=Math.max(.05,1-(n.transparency||0));m.material.roughness=n.material==="Glass"?.12:n.material==="Metal"?.3:.7;m.material.metalness=n.material==="Metal"?.8:n.material==="Neon"?.2:.05;m.material.emissive.set(n.material==="Neon"?(n.color||"#fff"):"#000");m.material.emissiveIntensity=n.material==="Neon"?.55:0});for(const [id,m] of meshes)if(!ids.has(id)){scene.remove(m);m.geometry.dispose();m.material.dispose();meshes.delete(id)}const n=cur();if(n&&S.settings.outline&&!["Folder","Script"].includes(n.type)&&n.visible!==false){selectionBox.visible=true;selectionBox.position.set(...n.position);selectionBox.rotation.set(...n.rotation.map(v=>v*Math.PI/180));selectionBox.scale.set(...n.size.map(v=>v*1.05))}else selectionBox.visible=false}
function tree(){const t=$("#tree"),filter=($("#treeSearch").value||"").toLowerCase();t.innerHTML='<div class="root">⌄ <b>Workspace</b></div>';const list=S.nodes.filter(n=>!filter||n.name.toLowerCase().includes(filter)||n.type.toLowerCase().includes(filter));list.forEach(n=>{const b=document.createElement("button");b.className="tree-row"+(n.id===S.selected?" selected":"");b.style.paddingLeft=(7+(n.parent?18:0))+"px";b.innerHTML="<span>"+icon(n)+"</span><span>"+esc(n.name)+"</span><span class=type>"+esc(n.type)+(n.locked?" 🔒":"")+"</span>";b.onclick=()=>{S.selected=n.id;render()};b.ondblclick=()=>rename();t.appendChild(b)});["Lighting","ReplicatedStorage","ServerScriptService","StarterGui","StarterPlayer"].forEach(x=>{const d=document.createElement("div");d.className="root muted";d.textContent="› "+x;t.appendChild(d)});$("#objectCount").textContent=S.nodes.length+" objetos"}
function panel(){const p=$("#panel");$$(".tab").forEach(x=>x.classList.toggle("active",x.dataset.panel===S.panel));if(S.panel==="toolbox"){p.innerHTML='<div class=panel-inner><input id=assetSearch class=search placeholder="⌕ Pesquisar objetos"><div class=section-title>STUDIO OBJECTS</div></div>';const root=p.firstChild;[["Part","Bloco físico"],["SpawnLocation","Ponto de spawn"],["Folder","Organizador"],["Script","Script Luau"]].forEach(([x,d])=>{const b=document.createElement("button");b.className="asset";b.dataset.asset=x;b.innerHTML='<span class=asset-icon>'+({Part:"◈",SpawnLocation:"⌂",Folder:"▱",Script:"◇"}[x])+'</span><span><b>'+x+'</b><small>'+d+'</small></span><strong>＋</strong>';b.onclick=()=>add(x);root.appendChild(b)});$("#assetSearch").oninput=e=>$$(".asset").forEach(a=>a.style.display=(!e.target.value||a.dataset.asset.toLowerCase().includes(e.target.value.toLowerCase()))?"flex":"none");return}
 const n=cur();if(!n){p.innerHTML='<div class=panel><div class=empty>Selecione um objeto no Explorer ou na cena.</div></div>';return}
 p.innerHTML='<div class=panel><div class=object><div class=object-icon>'+icon(n)+'</div><div><b>'+esc(n.name)+'</b><small>'+esc(n.type)+'</small></div></div></div>';const root=p.firstChild;
 section(root,"GENERAL");fieldText(root,"Name",n.name,v=>{if(v){commit();n.name=v;render();save(false)}});fieldText(root,"Class",n.type,()=>{},true);
 if(n.type!=="Folder"&&n.type!=="Script"){section(root,"TRANSFORM");vector(root,"Position",n.position,v=>{commit();n.position=v;render(false);save(false)});vector(root,"Rotation",n.rotation,v=>{commit();n.rotation=v;render(false);save(false)});vector(root,"Size",n.size,v=>{commit();n.size=v.map(x=>Math.max(.1,x));render(false);save(false)});
 section(root,"APPEARANCE");colorField(root,n);fieldSelect(root,"Material",n.material||"Plastic",v=>{commit();n.material=v;render(false);save(false)});fieldNumber(root,"Transparency",n.transparency||0,.05,0,1,v=>{commit();n.transparency=v;render(false);save(false)});
 section(root,"BEHAVIOR");toggle(root,"Anchored",n.anchored,v=>{commit();n.anchored=v;save(false)});toggle(root,"CanCollide",n.canCollide,v=>{commit();n.canCollide=v;save(false)});toggle(root,"Locked",n.locked,v=>{commit();n.locked=v;save(false)});toggle(root,"Visible",n.visible!==false,v=>{commit();n.visible=v;render(false);save(false)});
 section(root,"ACTIONS");const row=document.createElement("div");row.className="modal-actions";const db=document.createElement("button");db.textContent="Duplicate";db.onclick=duplicate;const xb=document.createElement("button");xb.textContent="Delete";xb.className="danger";xb.onclick=remove;row.append(db,xb);root.appendChild(row)}
 if(n.type==="Script"){section(root,"SCRIPT");const b=document.createElement("button");b.className="wide primary";b.textContent="Abrir Script Editor";b.onclick=()=>openScript(n.id);root.appendChild(b)}
}
function section(p,t){const d=document.createElement("div");d.className="section-title";d.textContent=t;p.appendChild(d)}
function fieldText(p,t,v,fn,disabled=false){const d=document.createElement("div");d.className="field";d.innerHTML="<span>"+t+"</span><input "+(disabled?"disabled ":"")+"value=\""+esc(v)+"\">";const i=d.querySelector("input");if(!disabled)i.onchange=()=>fn(i.value.trim());p.appendChild(d)}
function fieldNumber(p,t,v,step,min,max,fn){const d=document.createElement("div");d.className="field";d.innerHTML="<span>"+t+"</span><input type=number step="+step+" min="+min+" max="+max+" value="+v+">";d.querySelector("input").onchange=e=>fn(Math.max(min,Math.min(max,Number(e.target.value)||0)));p.appendChild(d)}
function fieldSelect(p,t,v,fn){const d=document.createElement("div");d.className="field";d.innerHTML="<span>"+t+"</span><select><option>Plastic</option><option>Metal</option><option>Wood</option><option>Glass</option><option>Neon</option></select>";const s=d.querySelector("select");s.value=v;s.onchange=()=>fn(s.value);p.appendChild(d)}
function colorField(p,n){const d=document.createElement("div");d.className="field";d.innerHTML="<span>Color</span><input type=color value=\""+(n.color||"#777")+"\">";const i=d.querySelector("input");i.oninput=e=>{n.color=e.target.value;updateMeshes()};i.onchange=()=>{commit();save(false)};p.appendChild(d)}
function vector(p,t,a,fn){const d=document.createElement("div");d.className="vector";d.innerHTML="<span>"+t+"</span><div></div>";a.forEach((v,i)=>{const x=document.createElement("input");x.type="number";x.step="0.1";x.value=Number(v.toFixed(3));x.onchange=()=>{const b=[...a];b[i]=Number(x.value)||0;fn(b);panel()};d.lastChild.appendChild(x)});p.appendChild(d)}
function toggle(p,t,v,fn){const d=document.createElement("div");d.className="toggle";d.innerHTML="<span>"+t+"</span><button class=switch "+(v?"on":"")+" aria-label="+t+"><i></i></button>";d.lastChild.onclick=()=>{fn(!v);panel()};p.appendChild(d)}
let fallbackCanvas=null,fallbackCtx=null,fallbackDrag=null;
function initFallbackCanvas(){const host=$("#canvas");host.innerHTML="";fallbackCanvas=document.createElement("canvas");fallbackCanvas.className="fallback-canvas";host.appendChild(fallbackCanvas);fallbackCtx=fallbackCanvas.getContext("2d",{alpha:false});fallbackCanvas.addEventListener("pointerdown",fallbackDown);fallbackCanvas.addEventListener("pointermove",fallbackMove);fallbackCanvas.addEventListener("pointerup",fallbackUp);fallbackCanvas.addEventListener("pointercancel",fallbackUp);fallbackCanvas.addEventListener("wheel",e=>{e.preventDefault();radius=Math.max(4,Math.min(160,radius*(e.deltaY>0?1.08:.92)));drawFallback()},{passive:false});fallbackCanvas.addEventListener("contextmenu",e=>e.preventDefault());addEventListener("resize",drawFallback);drawFallback()}
function fallbackProject(v){const h=$("#canvas"),s=Math.min(h.clientWidth,h.clientHeight)/(Math.max(radius,8)*1.8);return{x:h.clientWidth/2+v[0]*s,y:h.clientHeight*.62-v[1]*s-v[2]*s*.18}}
function drawFallback(){if(!fallbackCanvas||!fallbackCtx)return;const h=$("#canvas"),w=Math.max(1,h.clientWidth),z=Math.max(1,h.clientHeight),d=devicePixelRatio||1;fallbackCanvas.width=w*d;fallbackCanvas.height=z*d;fallbackCanvas.style.width=w+"px";fallbackCanvas.style.height=z+"px";const c=fallbackCtx;c.setTransform(d,0,0,d,0,0);c.fillStyle="#9bb7cf";c.fillRect(0,0,w,z);const s=Math.min(w,z)/(Math.max(radius,8)*1.8),cx=w/2,cy=z*.62;c.strokeStyle="rgba(40,50,60,.25)";for(let i=-20;i<=20;i++){let x=cx+i*S.grid*s;c.beginPath();c.moveTo(x,cy-20*s);c.lineTo(x,cy+20*s);c.stroke();let y=cy+i*S.grid*s;c.beginPath();c.moveTo(cx-20*s,y);c.lineTo(cx+20*s,y);c.stroke()}S.nodes.filter(o=>o.visible!==false&&!["Folder","Script","LocalScript","ModuleScript"].includes(o.type)).forEach(o=>{const p=fallbackProject(o.position||[0,0,0]),sx=Math.max(8,(o.size?.[0]||1)*s),sy=Math.max(8,(o.size?.[1]||1)*s*.72),sel=S.selectedIds?.includes(o.id)||S.selected===o.id;c.save();c.translate(p.x,p.y);c.rotate((o.rotation?.[1]||0)*Math.PI/180);c.fillStyle=o.color||"#6b7280";c.globalAlpha=Math.max(.15,1-(o.transparency||0));c.fillRect(-sx/2,-sy/2,sx,sy);if(sel){c.globalAlpha=1;c.strokeStyle="#fff";c.lineWidth=2;c.strokeRect(-sx/2-3,-sy/2-3,sx+6,sy+6)}c.restore()});c.globalAlpha=1;c.fillStyle="rgba(0,0,0,.58)";c.fillRect(14,z-54,255,36);c.fillStyle="#fff";c.font="12px sans-serif";c.fillText("Modo 2D • WebGL indisponível",26,z-32)}
function fallbackPick(e){const r=fallbackCanvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=null,bd=Infinity;S.nodes.forEach(o=>{if(o.visible===false||["Folder","Script","LocalScript","ModuleScript"].includes(o.type))return;const p=fallbackProject(o.position||[0,0,0]),s=Math.min(r.width,r.height)/(Math.max(radius,8)*1.8),dx=x-p.x,dy=y-p.y,hit=Math.abs(dx)<=Math.max(14,(o.size?.[0]||1)*s/2+5)&&Math.abs(dy)<=Math.max(14,(o.size?.[1]||1)*s*.36+5);if(hit&&dx*dx+dy*dy<bd){bd=dx*dx+dy*dy;best=o}});return best}
function fallbackDown(e){const o=fallbackPick(e);if(o){proSelect(o.id,e.ctrlKey||e.metaKey||e.shiftKey);fallbackDrag={id:o.id,x:e.clientX,y:e.clientY};render()}else if(!(e.ctrlKey||e.metaKey||e.shiftKey)){proSelect(null);render()}}
function fallbackMove(e){if(!fallbackDrag)return;const o=S.nodes.find(x=>x.id===fallbackDrag.id);if(!o)return;const dx=e.clientX-fallbackDrag.x,dy=e.clientY-fallbackDrag.y;fallbackDrag.x=e.clientX;fallbackDrag.y=e.clientY;if(!o._dragged){commit();o._dragged=true}if(S.tool==="move"){o.position[0]+=dx*.04;o.position[2]+=dy*.04}else if(S.tool==="rotate")o.rotation[1]+=dx*.7;else if(S.tool==="scale"){const q=Math.max(.1,1-dy*.01);o.size=o.size.map(v=>Math.max(.1,v*q))}drawFallback()}
function fallbackUp(){if(fallbackDrag){S.nodes.forEach(o=>delete o._dragged);save(false)}fallbackDrag=null}
function render(full=true){if(full){tree();panel()}if(renderer&&scene)updateMeshes();else drawFallback();const n=cur();$("#selectionInfo").textContent=n?(n.name+" • "+n.type):"Nenhum objeto selecionado";$("#gridHud").textContent="Grid "+S.grid+" stud"+(S.grid===1?"":"s")}
function focus(){const n=cur();if(!n)return;target?.set?.(...n.position);radius=Math.max(7,Math.max(...(n.size||[1,1,1]))*3);if(renderer)sync();else drawFallback();toast("Câmera focada")}
function view(kind){if(kind==="home"){theta=.62;phi=.92;radius=27;target?.set?.(0,1,0)}if(kind==="top"){theta=0;phi=.08;radius=28}if(kind==="front"){theta=0;phi=1.57;radius=28}if(kind==="right"){theta=1.57;phi=1.57;radius=28}if(renderer)sync();else drawFallback();toast("Visão: "+kind)}
function toggleGrid(){if(editorGrid){editorGrid.visible=!editorGrid.visible;toast(editorGrid.visible?"Grid visível":"Grid oculto")}}
function panCamera(dx,dy){const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),amount=radius*.0025;target.addScaledVector(right,dx*amount);target.addScaledVector(up,dy*amount);sync()}
function commandPalette(){const bg=document.createElement("div");bg.className="modal-bg";bg.innerHTML='<div class=modal><div class=modal-head><h2>Command Palette</h2><button id=cpX>×</button></div><input id=cpSearch placeholder="Pesquisar comando…"><div id=cpList></div></div>';$("#modalRoot").appendChild(bg);const cs=[["Criar Part",()=>add("Part")],["Criar Sphere",()=>add("Sphere")],["Criar Cylinder",()=>add("Cylinder")],["Criar Wedge",()=>add("Wedge")],["Duplicar",duplicate],["Excluir",remove],["Focar",focus],["Grid",toggleGrid],["Salvar",save],["Desfazer",undo],["Refazer",redo],["Exportar",exportProject],["Publicar",publish]];const draw=()=>{const q=$("#cpSearch").value.toLowerCase(),l=$("#cpList");l.innerHTML="";cs.filter(x=>x[0].toLowerCase().includes(q)).forEach(x=>{const b=document.createElement("button");b.className="asset";b.textContent=x[0];b.onclick=()=>{bg.remove();x[1]()};l.appendChild(b)})};$("#cpSearch").oninput=draw;$("#cpX").onclick=()=>bg.remove();draw();setTimeout(()=>$("#cpSearch").focus(),20)}
const CODE_LANGUAGES={luau:{label:"Luau",ext:"lua",template:'-- Studio Lite\nprint("Hello from Luau!")'},lua:{label:"Lua",ext:"lua",template:'-- Lua\nprint("Hello!")'},javascript:{label:"JavaScript",ext:"js",template:'// JavaScript\nconsole.log("Hello!");'},typescript:{label:"TypeScript",ext:"ts",template:'// TypeScript\nconst message: string = "Hello!";\nconsole.log(message);'},python:{label:"Python",ext:"py",template:'print("Hello from Python!")'},html:{label:"HTML",ext:"html",template:'<!doctype html>\n<html>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>'},css:{label:"CSS",ext:"css",template:'body {\n  margin: 0;\n  font-family: sans-serif;\n}'},php:{label:"PHP",ext:"php",template:'<?php\necho "Hello from PHP";'},csharp:{label:"C#",ext:"cs",template:'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello!");\n    }\n}'},java:{label:"Java",ext:"java",template:'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello!");\n    }\n}'},cpp:{label:"C++",ext:"cpp",template:'#include <iostream>\nint main() {\n    std::cout << "Hello!" << std::endl;\n    return 0;\n}'},sql:{label:"SQL",ext:"sql",template:'SELECT * FROM players;'},json:{label:"JSON",ext:"json",template:'{\n  "name": "Studio Lite",\n  "version": 1\n}'},markdown:{label:"Markdown",ext:"md",template:'# Studio Lite\n\nDocumentação do projeto.'}};
const CODE_LANGUAGE_ORDER=Object.keys(CODE_LANGUAGES);
S.codeFiles=S.codeFiles||{};
function codeLanguageForNode(n){return n?.language&&CODE_LANGUAGES[n.language]?n.language:"luau"}
function validateCode(source,lang){const errors=[];if(lang==="json"){try{JSON.parse(source||"{}")}catch(e){errors.push("JSON inválido: "+e.message)}}let r=0,s=0,c=0,q=null,escp=false;for(const ch of source||""){if(q){if(escp)escp=false;else if(ch==="\\")escp=true;else if(ch===q)q=null;continue}if(ch==="\""||ch==="'"){q=ch;continue}if(ch==="(")r++;if(ch===")")r--;if(ch==="[")s++;if(ch==="]")s--;if(ch==="{")c++;if(ch==="}")c--}if(r<0||s<0||c<0||r>0||s>0||c>0)errors.push("Parênteses, colchetes ou chaves desbalanceados.");return errors}
function formatCode(source,lang){if(lang==="json"){try{return JSON.stringify(JSON.parse(source),null,2)}catch{return source}}return String(source||"").replace(/\\r\\n/g,"\\n").replace(/[ \\t]+$/gm,"")}
function downloadCode(source,name,lang){const meta=CODE_LANGUAGES[lang]||CODE_LANGUAGES.luau;const base=(name||"script").replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"")||"script";const a=document.createElement("a");a.download=base+"."+meta.ext;a.href=URL.createObjectURL(new Blob([source],{type:"text/plain;charset=utf-8"}));document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function openScript(id){const n=S.nodes.find(x=>x.id===id);if(!n)return;openCodeStudio({node:n,title:n.name,initial:()=>n.script||CODE_LANGUAGES[codeLanguageForNode(n)].template,language:codeLanguageForNode(n),save:(source,lang)=>{commit();n.script=source;n.language=lang;save();render();toast("Código salvo")}})}
function openCodeStudio(opts={}){const node=opts.node||null,key=node?"node:"+node.id:"file:"+uid();let currentLang=CODE_LANGUAGES[opts.language]?opts.language:"luau";let source=typeof opts.initial==="function"?opts.initial():opts.initial;if(source==null)source=CODE_LANGUAGES[currentLang].template;const bg=document.createElement("div");bg.className="modal-bg";bg.innerHTML='<div class="script-window code-studio-window"><div class="script-head"><div><b>◇ '+esc(opts.title||"Code Studio")+'</b><small id="codeMeta" class="code-meta"></small></div><div class="code-actions"><button id="codeFormat">Formatar</button><button id="codeCheck">Validar</button><button id="codeDownload">Baixar</button><button id="codeSave" class="primary">Salvar</button><button id="codeClose">×</button></div></div><div class="code-toolbar"><select id="codeLanguage"></select><button id="codeTemplate">Modelo</button><span>Editor multilíngue</span></div><div class="editor"><div class="lines" id="codeLines"></div><textarea class="script-area" id="codeText" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea></div><div class="script-foot"><span id="codeStatus">Pronto</span> • <span id="codeCount">0</span> linhas • UTF-8</div></div>';$("#modalRoot").appendChild(bg);const ta=bg.querySelector("#codeText"),ln=bg.querySelector("#codeLines"),sel=bg.querySelector("#codeLanguage"),meta=bg.querySelector("#codeMeta"),foot=bg.querySelector("#codeStatus"),count=bg.querySelector("#codeCount");CODE_LANGUAGE_ORDER.forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=CODE_LANGUAGES[k].label;sel.appendChild(o)});sel.value=currentLang;ta.value=source;const sync=()=>{ln.innerHTML=ta.value.split("\n").map((_,i)=>i+1).join("<br>");count.textContent=ta.value.split("\n").length;meta.textContent=" • "+CODE_LANGUAGES[currentLang].label+" • ."+CODE_LANGUAGES[currentLang].ext};sync();ta.oninput=sync;sel.onchange=()=>{currentLang=sel.value;sync();foot.textContent="Linguagem: "+CODE_LANGUAGES[currentLang].label};bg.querySelector("#codeTemplate").onclick=()=>{if(ta.value.trim()&&!confirm("Substituir o código atual pelo modelo?"))return;ta.value=CODE_LANGUAGES[currentLang].template;sync()};bg.querySelector("#codeFormat").onclick=()=>{ta.value=formatCode(ta.value,currentLang);sync();foot.textContent="Código formatado"};bg.querySelector("#codeCheck").onclick=()=>{const e=validateCode(ta.value,currentLang);foot.textContent=e.length?"⚠ "+e.join(" | "):"✓ Nenhum erro estrutural básico encontrado"};bg.querySelector("#codeDownload").onclick=()=>downloadCode(ta.value,node?.name||opts.title||"script",currentLang);const close=()=>bg.remove();bg.querySelector("#codeClose").onclick=close;bg.querySelector("#codeSave").onclick=()=>{if(opts.save)opts.save(ta.value,currentLang);else{S.codeFiles[key]={name:opts.title||"script",language:currentLang,source:ta.value};save();toast("Código salvo localmente")}close()};ta.addEventListener("keydown",e=>{if(e.key==="Tab"){e.preventDefault();const a=ta.selectionStart,b=ta.selectionEnd;ta.value=ta.value.slice(0,a)+"    "+ta.value.slice(b);ta.selectionStart=ta.selectionEnd=a+4;sync()}if(e.key==="Enter"&&e.ctrlKey){e.preventDefault();bg.querySelector("#codeSave").click()}});setTimeout(()=>ta.focus(),30)}
function openPrompt(title,label,value,fn){const bg=document.createElement("div");bg.className="modal-bg";bg.innerHTML='<div class=modal><div class=modal-head><h2>'+esc(title)+'</h2><button id=x>×</button></div><p>'+esc(label)+'</p><input id=v value="'+esc(value)+'"><div class=modal-actions><button id=c>Cancelar</button><button id=o class=primary>Confirmar</button></div></div>';$("#modalRoot").appendChild(bg);$("#x").onclick=$("#c").onclick=()=>bg.remove();$("#o").onclick=()=>{const v=$("#v").value.trim();bg.remove();fn(v)};setTimeout(()=>$("#v").focus(),20)}
function publish(){
 const bg=document.createElement("div");bg.className="modal-bg";
 bg.innerHTML='<div class=modal><div class=modal-head><div><h2>Publicar no Roblox</h2><small style="color:#555">Open Cloud • Place Publishing</small></div><button id=x>×</button></div><p>Publique no seu próprio jogo usando <b>sua própria API Key do Roblox</b>. A chave é enviada somente durante esta publicação e <b>não é salva pelo Studio Lite</b>.</p><div class=notice><strong>Privacidade:</strong> a API Key não é armazenada em Vercel, Supabase, localStorage, cookies, GitHub ou no projeto. Ela é enviada pela conexão segura para a Function da Vercel e usada somente para esta requisição.</div><h3>CREDENCIAIS DO JOGO</h3><div class=row><input id=universe placeholder="Universe ID"><input id=place placeholder="Place ID"></div><div class=row><input id=robloxApiKey type=password autocomplete="off" placeholder="Roblox Open Cloud API Key"><button id=showRobloxKey type=button>Mostrar</button></div><label class=checkline><input id=rememberIds type=checkbox> lembrar apenas Universe/Place ID neste dispositivo</label><h3>ARQUIVO DO PLACE</h3><input id=pubfile type=file accept=".rbxl,.rbxlx"><label class=checkline><input id=useEditorFile type=checkbox> publicar o RBXLX gerado pelo editor</label><div class=notice>Permissão necessária: sua API Key precisa ter acesso de publicação de Places para esse Universe/Place.</div><div class=modal-actions><button id=c>Cancelar</button><button id=publishNow class=primary>↑ Enviar e Publicar</button></div><div id=pubstatus style="color:#666;font-size:11px;margin-top:8px"></div></div>';
 $("#modalRoot").appendChild(bg);
 try{const ids=JSON.parse(localStorage.getItem("studio-roblox-target")||"{}");$("#universe").value=ids.universe||"";$("#place").value=ids.place||""}catch{}
 $("#pubfile").onchange=()=>{const f=$("#pubfile").files[0];if(f)$("#pubstatus").textContent="Arquivo selecionado: "+f.name+" ("+Math.ceil(f.size/1024/1024*100)/100+" MB)"};
 $("#showRobloxKey").onclick=()=>{const input=$("#robloxApiKey");input.type=input.type==="password"?"text":"password";$("#showRobloxKey").textContent=input.type==="password"?"Mostrar":"Ocultar"};
 $("#x").onclick=$("#c").onclick=()=>{const key=$("#robloxApiKey");if(key)key.value="";bg.remove()};
 $("#publishNow").onclick=async()=>{
   const universe=$("#universe").value.trim(),place=$("#place").value.trim(),apiKey=$("#robloxApiKey").value.trim();
   let file=$("#pubfile").files[0]||S.sourceRbxl;
   if($("#useEditorFile").checked)file=new File([exportXML()],(S.project||"studio-project")+".rbxlx",{type:"application/xml"});
   if(!/^\d+$/.test(universe)||!/^[0-9]+$/.test(place))return toast("Universe ID e Place ID devem ser numéricos");
   if(!apiKey)return toast("Informe sua Roblox Open Cloud API Key");
   if(!file)return toast("Selecione um .rbxl/.rbxlx ou marque para publicar o RBXLX do editor");
   if(!/\.rbxlx?$/i.test(file.name))return toast("O arquivo precisa terminar em .rbxl ou .rbxlx");
   if($("#rememberIds").checked)localStorage.setItem("studio-roblox-target",JSON.stringify({universe,place}));
   $("#pubstatus").textContent="Enviando arquivo para Roblox…";$("#publishNow").disabled=true;status("Publicando…");
   try{
     const payload=await file.arrayBuffer();
     const contentType=file.name.toLowerCase().endsWith(".rbxlx")?"application/xml":"application/octet-stream";
     const headers={"Content-Type":contentType,"x-roblox-universe-id":universe,"x-roblox-place-id":place,"x-roblox-file-name":file.name,"x-roblox-api-key":apiKey};
     const res=await fetch("/api/roblox/publish",{method:"POST",headers,body:payload});
     const textBody=await res.text();
     if(!res.ok)throw Error("HTTP "+res.status+" — "+textBody.slice(0,500));
     $("#robloxApiKey").value="";
     $("#pubstatus").textContent="Publicado com sucesso. A API Key foi removida do formulário.";
     status("Publicado");toast("Place publicado no Roblox");setTimeout(()=>bg.remove(),1100)
   }catch(err){
     console.error(err);$("#robloxApiKey").value="";
     $("#pubstatus").textContent="Falha: "+err.message;status("Falha na publicação");$("#publishNow").disabled=false;toast("Não foi possível publicar")
   }
 }
}
function exportXML(){const xe=s=>String(s??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");const children=new Map();S.nodes.forEach(n=>{const p=n.parent||"__workspace__";if(!children.has(p))children.set(p,[]);children.get(p).push(n)});const renderNode=(n)=>{const cls=["Part","SpawnLocation","WedgePart","CornerWedgePart","MeshPart","UnionOperation"].includes(n.type)?n.type:"Part";const pos=n.position||[0,0,0],size=n.size||[1,1,1];const attrs="<string name=\"Name\">"+xe(n.name)+"</string><bool name=\"Anchored\">"+!!n.anchored+"</bool><bool name=\"CanCollide\">"+!!n.canCollide+"</bool><Vector3 name=\"size\"><X>"+size[0]+"</X><Y>"+size[1]+"</Y><Z>"+size[2]+"</Z></Vector3><CoordinateFrame name=\"CFrame\"><X>"+pos[0]+"</X><Y>"+pos[1]+"</Y><Z>"+pos[2]+"</Z><R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>";const kids=(children.get(n.id)||[]).map(renderNode).join("");return "<Item class=\""+cls+"\" referent=\"RBX"+xe(n.id)+"\"><Properties>"+attrs+"</Properties>"+kids+"</Item>"};const workspaceKids=(children.get("__workspace__")||[]).map(renderNode).join("");return "<?xml version=\"1.0\" encoding=\"utf-8\"?><roblox version=\"4\"><Item class=\"Workspace\" referent=\"RBXWorkspace\"><Properties><string name=\"Name\">Workspace</string></Properties>"+workspaceKids+"</Item></roblox>"}
function download(name,data,type){const b=new Blob([data],{type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),800)}
function exportProject(){const bg=document.createElement("div");bg.className="modal-bg";bg.innerHTML='<div class=modal><div class=modal-head><h2>Exportar projeto</h2><button id=x>×</button></div><p>Escolha o formato. JSON preserva todos os dados do editor; RBXLX cria um DataModel XML simplificado.</p><div class=modal-actions><button id=json>JSON completo</button><button id=rbxlx class=primary>RBXLX</button></div></div>';$("#modalRoot").appendChild(bg);$("#x").onclick=()=>bg.remove();$("#json").onclick=()=>{download((S.project||"studio-project")+".json",JSON.stringify({name:S.project,nodes:S.nodes},null,2),"application/json");bg.remove();toast("JSON exportado")};$("#rbxlx").onclick=()=>{download((S.project||"studio-project")+".rbxlx",exportXML(),"application/xml");bg.remove();toast("RBXLX exportado")}}
async function importFile(f){if(!f)return;status("Importando…");const name=f.name.toLowerCase();try{
 if(name.endsWith(".rbxl")){S.sourceRbxl=f;status("RBXL pronto para publicação");toast("RBXL carregado — agora use Publicar para enviar ao jogo");return}
 if(name.endsWith(".json")){const d=JSON.parse(await f.text());if(!Array.isArray(d.nodes))throw Error();commit();S.nodes=d.nodes.map(normalizeNode);S.project=d.name||S.project;$("#projectName").value=S.project;S.selected=S.nodes[0]?.id||null;render();save(false);toast("Projeto JSON importado");return}
 const doc=new DOMParser().parseFromString(await f.text(),"application/xml");if(doc.querySelector("parsererror"))throw Error();const els=[...doc.querySelectorAll("Item")].filter(e=>["Part","SpawnLocation","WedgePart","CornerWedgePart","MeshPart"].includes(e.getAttribute("class")));const out=els.map((e,i)=>{const prop=n=>e.querySelector('Properties > *[name="'+n+'"]'),txt=n=>prop(n)?.textContent||"";const vec=n=>{const z=prop(n);if(!z)return[0,0,0];return[+z.querySelector("X")?.textContent||0,+z.querySelector("Y")?.textContent||0,+z.querySelector("Z")?.textContent||0]};return normalizeNode({id:uid(),name:txt("Name")||"Part "+(i+1),type:e.getAttribute("class")==="MeshPart"?"Part":e.getAttribute("class"),position:vec("CFrame"),rotation:[0,0,0],size:vec("size").map(v=>v||1),color:"#64748b",material:"Plastic",anchored:txt("Anchored")==="true",canCollide:txt("CanCollide")!=="false",parent:null})});if(!out.length)return toast("Nenhum objeto compatível encontrado");commit();S.nodes=out;S.selected=out[0].id;S.sourceRbxl=null;render();save(false);toast(out.length+" objetos importados")
}catch(e){console.error(e);status("Falha na importação");toast("Arquivo inválido ou incompatível")}}
function normalizeNode(n){const d=Object.assign({id:uid(),name:"Object",type:"Part",position:[0,0,0],rotation:[0,0,0],size:[1,1,1],color:"#777",material:"Plastic",shape:"box",anchored:true,canCollide:true,transparency:0,locked:false,visible:true,parent:null},n||{});d.id=d.id||uid();d.name=String(d.name||"Object").slice(0,100);d.type=["Part","SpawnLocation","Folder","Script","Sphere","Cylinder","Wedge"].includes(d.type)?d.type:"Part";["position","rotation","size"].forEach(k=>{d[k]=Array.isArray(d[k])?d[k].slice(0,3).map(v=>Number(v)||0):[0,0,0]});d.size=d.size.map(v=>Math.max(.1,Math.abs(Number(v)||1)));d.transparency=Math.max(0,Math.min(1,Number(d.transparency)||0));d.visible=d.visible!==false;d.anchored=d.anchored!==false;d.canCollide=d.canCollide!==false;d.locked=!!d.locked;d.shape=d.shape||({Sphere:"sphere",Cylinder:"cylinder",Wedge:"wedge"}[d.type]||"box");return d}
function play(){if(!S.playing){S.playSnapshot={nodes:clone(S.nodes),selected:S.selected,project:S.project};simVelocity.clear();simLast=performance.now();S.playing=true}else{S.playing=false;if(S.playSnapshot){S.nodes=clone(S.playSnapshot.nodes);S.selected=S.playSnapshot.selected;S.project=S.playSnapshot.project;$("#projectName").value=S.project}S.playSnapshot=null;simVelocity.clear();render()}$("#playBadge").classList.toggle("on",S.playing);$("#playBtn").textContent=S.playing?"■ Stop":"▶ Play";status(S.playing?"Play Mode iniciado":"Edição retomada");toast(S.playing?"Play Mode":"Edição retomada")}
function settings(){
 const bg=document.createElement("div");bg.className="modal-bg";bg.innerHTML='<div class=modal><div class=modal-head><h2>Configurações</h2><button id=x>×</button></div><h3>EDITOR</h3><label class=checkline><input id=outline type=checkbox '+(S.settings.outline?"checked":"")+'> mostrar contorno de seleção</label><label class=checkline><input id=autosave type=checkbox '+(S.settings.autosave!==false?"checked":"")+'> autosave local</label><h3>ATALHOS</h3><div class=notice><b>W</b> mover · <b>E</b> girar · <b>R</b> escala · <b>F</b> focar · <b>Ctrl/⌘ D</b> duplicar · <b>Ctrl/⌘ Z</b> desfazer · <b>Ctrl/⌘ S</b> salvar · <b>P</b> publicar · <b>ESC</b> fechar modo Play</div><h3>DADOS</h3><div class=modal-actions><button id=clear class=danger>Limpar projeto local</button><button id=close class=primary>Concluir</button></div></div>';$("#modalRoot").appendChild(bg);$("#x").onclick=$("#close").onclick=()=>{S.settings.outline=$("#outline").checked;S.settings.autosave=$("#autosave").checked;save(false);bg.remove();render(false)};$("#clear").onclick=()=>{if(confirm("Apagar o projeto salvo neste dispositivo?")){localStorage.removeItem("studio-lite-v4");localStorage.removeItem("studio-roblox-target");location.reload()}}}
function togglePanels(which){$("#explorerPanel").classList.toggle("open",which==="explorer");$("#inspectorPanel").classList.toggle("open",which==="inspector")}
$("#saveBtn").onclick=()=>save();$("#newBtn").onclick=newProject;$("#screenshotBtn").onclick=screenshot;$("#codeStudioBtn").onclick=()=>openCodeStudio({title:"Novo Código",language:"luau"});$("#undoBtn").onclick=undo;$("#redoBtn").onclick=redo;$("#duplicateBtn").onclick=duplicate;$("#deleteBtn").onclick=remove;$("#renameBtn").onclick=rename;$("#focusBtn").onclick=focus;$("#publishBtn").onclick=publish;$("#publishRbxlBtn").onclick=()=>publish();$("#settingsBtn").onclick=settings;$("#exportBtn").onclick=exportProject;$("#importBtn").onclick=()=>$("#fileInput").click();$("#fileInput").onchange=e=>{importFile(e.target.files[0]);e.target.value=""};$("#projectName").onchange=e=>{commit();S.project=e.target.value.trim()||"Meu Primeiro Jogo";save(false)};$("#playBtn").onclick=play;$("#gridBtn").onclick=()=>{S.grid=S.grid===1 ? .5 : S.grid===.5 ? .25 : S.grid===.25 ? .1 : 1;render();toast("Grid "+S.grid)};$("#snapBtn").onclick=()=>{S.snap=!S.snap;$("#snapBtn").textContent="Snap: "+(S.snap?"ON":"OFF");toast("Snap "+(S.snap?"ativado":"desativado"))};$("#treeSearch").oninput=tree;$("#homeView").onclick=()=>view("home");$("#topView").onclick=()=>view("top");$("#frontView").onclick=()=>view("front");$("#rightView").onclick=()=>view("right");$("#fullscreenBtn").onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();};$("#explorerToggle").onclick=()=>togglePanels("explorer");$("#inspectorToggle").onclick=()=>togglePanels("inspector");$("#collapseBtn").onclick=()=>togglePanels("explorer");
$("#gridToggleBtn").onclick=toggleGrid;$("#commandBtn").onclick=commandPalette;$("#gridBtn").ondblclick=toggleGrid;document.addEventListener("click",e=>{const a=e.target.closest("[data-add]");if(a)add(a.dataset.add);const t=e.target.closest("[data-tool]");if(t)setTool(t.dataset.tool);const p=e.target.closest("[data-panel]");if(p){S.panel=p.dataset.panel;panel()}});
addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();save();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();redo();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="d"){e.preventDefault();duplicate();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="c"){if(!/input|textarea|select/i.test(e.target.tagName)){e.preventDefault();copySelected()}return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="v"){if(!/input|textarea|select/i.test(e.target.tagName)){e.preventDefault();pasteSelected()}return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();commandPalette();return}if(/input|textarea|select/i.test(e.target.tagName))return;const k=e.key.toLowerCase();if(k==="delete"||k==="backspace")remove();if(k==="w")setTool("move");if(k==="e")setTool("rotate");if(k==="r")setTool("scale");if(k==="f")focus();if(k==="p")publish();if(k==="escape"&&S.playing)play();if(k==="arrowup")panCamera(0,-12);if(k==="arrowdown")panCamera(0,12);if(k==="arrowleft")panCamera(-12,0);if(k==="arrowright")panCamera(12,0)});
try{const d=JSON.parse(localStorage.getItem("studio-lite-v4"));if(d?.nodes){S.nodes=d.nodes.map(normalizeNode);S.project=d.name||S.project;S.settings=Object.assign(S.settings,d.settings||{});S.grid=[1,.5,.25,.1].includes(d.grid)?d.grid:1;S.snap=d.snap!==false;$("#projectName").value=S.project}}catch{}
init();if(renderer){sync();render();status("Pronto")}else{render();status("Modo 2D compatível")}setInterval(()=>{if(!S.playing&&S.settings.autosave!==false)save(false)},30000);$("#deviceInfo").textContent="HTML • CSS • JS • MULTI-LANG • "+(innerWidth<=600?"MOBILE":"DESKTOP");

/* ===== STUDIO LITE PRO EXPANSION ===== */
S.selectedIds=S.selectedIds||[S.selected].filter(Boolean);
S.proVersion="5.0 PRO";
const _baseAdd=add,_baseRender=render,_basePanel=panel,_baseTree=tree,_baseSave=save,_baseDuplicate=duplicate,_baseRemove=remove;
function proSelect(id,multi=false){if(multi){if(S.selectedIds.includes(id))S.selectedIds=S.selectedIds.filter(x=>x!==id);else S.selectedIds.push(id)}else S.selectedIds=id?[id]:[];S.selected=S.selectedIds.at(-1)||null;if(id)S.__serviceTarget=null}
function proChildren(id){return S.nodes.filter(n=>(n.parent||null)===(id||null))}
function proDescendant(id,root){let n=S.nodes.find(x=>x.id===id),seen=new Set();while(n&&n.parent&&!seen.has(n.parent)){if(n.parent===root)return true;seen.add(n.parent);n=S.nodes.find(x=>x.id===n.parent)}return false}
function proGroup(){
 const ids=S.selectedIds.filter(id=>S.nodes.some(n=>n.id===id));if(!ids.length)return toast("Selecione pelo menos um objeto");
 commit();const m={id:uid(),name:"Model",type:"Model",position:[0,0,0],rotation:[0,0,0],size:[1,1,1],color:"#64748b",material:"Plastic",anchored:true,canCollide:false,transparency:0,locked:false,visible:true,parent:null};
 S.nodes.push(m);S.nodes.forEach(n=>{if(ids.includes(n.id))n.parent=m.id});proSelect(m.id);render();save(false);toast("Model criado")
}
function proUngroup(){const n=cur();if(!n||n.type!=="Model")return toast("Selecione um Model");commit();S.nodes.forEach(x=>{if(x.parent===n.id)x.parent=n.parent||null});S.nodes=S.nodes.filter(x=>x.id!==n.id);proSelect(null);render();save(false);toast("Model desagrupado")}
function proAdd(type){
 if(type==="Model"){commit();const n={id:uid(),name:"Model",type:"Model",position:[0,0,0],rotation:[0,0,0],size:[1,1,1],color:"#64748b",material:"Plastic",anchored:true,canCollide:false,transparency:0,locked:false,visible:true,parent:null};S.nodes.push(n);proSelect(n.id);render();save(false);return toast("Model criado")}
 _baseAdd(type==="MeshPart"||type==="Terrain"?"Part":type);
 const n=cur();if(!n)return;
 n.type=type;n.canCollide=!["Folder","Script","Model"].includes(type);n.parent=cur()&&S.selectedIds.length>1?null:n.parent;
 if(type==="MeshPart")n.meshId=n.meshId||"";if(type==="Terrain")n.terrain={brush:"block",resolution:4};
 if(type==="Terrain")n.material="Grass";
 render();save(false)
}
function proTree(){
 const t=$("#tree"),filter=($("#treeSearch").value||"").toLowerCase();t.innerHTML='<div class="root">⌄ <b>Workspace</b></div>';
 function walk(parent,depth){proChildren(parent).forEach(n=>{const match=!filter||n.name.toLowerCase().includes(filter)||n.type.toLowerCase().includes(filter);if(match){const b=document.createElement("button");b.className="tree-row"+(S.selectedIds.includes(n.id)?" selected":"");b.style.paddingLeft=(7+depth*18)+"px";const branch=proChildren(n.id).length?"▾":"•";b.innerHTML="<span>"+branch+" "+icon(n)+"</span><span>"+esc(n.name)+"</span><span class=type>"+esc(n.type)+(n.locked?" 🔒":"")+"</span>";b.onclick=e=>{proSelect(n.id,e.ctrlKey||e.metaKey||e.shiftKey);render()};b.ondblclick=()=>rename();t.appendChild(b)}walk(n.id,depth+1)})}
 walk(null,0);["Lighting","ReplicatedStorage","ServerScriptService","StarterGui","StarterPlayer"].forEach(x=>{const d=document.createElement("div");d.className="root muted";d.textContent="› "+x;t.appendChild(d)});
 $("#objectCount").textContent=S.nodes.length+" objetos"+(S.selectedIds.length?" • "+S.selectedIds.length+" selecionados":"")
}
function proPanel(){
 _basePanel();
 const p=$("#panel");if(S.panel==="toolbox"){const root=p.querySelector(".panel");if(root&&!root.dataset.pro){root.dataset.pro="1";[["Sphere","Esfera"],["Cylinder","Cilindro"],["Wedge","Cunha"],["Model","Modelo"],["MeshPart","MeshPart"],["Terrain","Terreno"]].forEach(([x,d])=>{const b=document.createElement("button");b.className="asset";b.innerHTML='<span class=asset-icon>◇</span><span><b>'+x+'</b><small>'+d+'</small></span><strong>＋</strong>';b.onclick=()=>proAdd(x);root.appendChild(b)});const tools=document.createElement("div");tools.innerHTML='<div class=section-title>WORKSPACE TOOLS</div><button class=wide id=proGroup>▣ Group Selected</button><button class=wide id=proUngroup>▱ Ungroup Model</button><button class=wide id=proValidate>✓ Validate Project</button>';root.appendChild(tools);$("#proGroup").onclick=proGroup;$("#proUngroup").onclick=proUngroup;$("#proValidate").onclick=validateProject}return}
 const n=cur();if(!n)return;
 const root=p.querySelector(".panel");if(!root||root.dataset.pro)return;root.dataset.pro="1";
 const sec=document.createElement("div");sec.innerHTML='<div class=section-title>HIERARCHY</div>';const sel=document.createElement("select");sel.style.cssText="width:100%;background:#0e0e0e;border:1px solid #252525;border-radius:5px;color:#ddd;padding:7px";sel.innerHTML='<option value="">Workspace</option>'+S.nodes.filter(x=>x.id!==n.id&&["Folder","Model"].includes(x.type)).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join("");sel.value=n.parent||"";sel.onchange=()=>{const v=sel.value;if(v===n.id||proDescendant(v,n.id))return toast("Parent inválido");commit();n.parent=v||null;render();save(false)};sec.appendChild(sel);root.appendChild(sec);
 const adv=document.createElement("div");adv.innerHTML='<div class=section-title>ADVANCED</div>';const rows=[["Reflectance",n.reflectance||0,0,1,.05],["Surface",n.surface||"Smooth",null,null,null]];const ref=document.createElement("input");ref.type="number";ref.min=0;ref.max=1;ref.step=.05;ref.value=n.reflectance||0;ref.onchange=()=>{commit();n.reflectance=+ref.value||0;save(false)};adv.appendChild(labelWrap("Reflectance",ref));const surface=document.createElement("select");["Smooth","Studs","Inlet","Universal","Hinge","Motor"].forEach(x=>surface.add(new Option(x,x)));surface.value=n.surface||"Smooth";surface.onchange=()=>{commit();n.surface=surface.value;save(false)};adv.appendChild(labelWrap("Surface",surface));root.appendChild(adv);
 if(n.type==="MeshPart"){const a=document.createElement("div");a.innerHTML='<div class=section-title>MESH</div>';const inp=document.createElement("input");inp.className="search";inp.placeholder="rbxassetid://...";inp.value=n.meshId||"";inp.onchange=()=>{commit();n.meshId=inp.value;save(false)};a.appendChild(inp);root.appendChild(a)}
 if(n.type==="Terrain"){const a=document.createElement("div");a.innerHTML='<div class=section-title>TERRAIN BRUSH</div>';["block","sphere","smooth","paint"].forEach(x=>{const b=document.createElement("button");b.textContent=x;b.style.margin="3px";b.onclick=()=>{n.terrain=n.terrain||{};n.terrain.brush=x;save(false);toast("Brush: "+x)};a.appendChild(b)});root.appendChild(a)}
}
function labelWrap(name,input){const d=document.createElement("div");d.className="field";const s=document.createElement("span");s.textContent=name;d.append(s,input);return d}
function validateProject(){
 const issues=[],ids=new Set();S.nodes.forEach(n=>{if(ids.has(n.id))issues.push("ID duplicado: "+n.id);ids.add(n.id);if(!n.name)issues.push("Objeto sem nome");if(n.parent&&!S.nodes.some(x=>x.id===n.parent))issues.push("Parent inexistente: "+n.name);if(!Array.isArray(n.position)||n.position.length!==3)issues.push("Position inválida: "+n.name);if(!Array.isArray(n.size)||n.size.some(v=>v<=0))issues.push("Size inválido: "+n.name)});
 const bg=document.createElement("div");bg.className="modal-bg";bg.innerHTML='<div class=modal><div class=modal-head><h2>Project Validation</h2><button id=px>×</button></div><div class=notice><strong>'+(!issues.length?"✓ Projeto pronto para exportação":"⚠ "+issues.length+" problema(s)")+'</strong><br>'+(!issues.length?"Nenhum erro estrutural encontrado.":"<br>"+issues.map(esc).join("<br>"))+'</div><div class=modal-actions><button id=pc class=primary>Concluir</button></div></div>';$("#modalRoot").appendChild(bg);$("#px").onclick=$("#pc").onclick=()=>bg.remove();return issues
}
function proDuplicate(){const ids=S.selectedIds.slice();if(ids.length<2)return _baseDuplicate();commit();const map=new Map();const copies=ids.map(id=>{const n=S.nodes.find(x=>x.id===id);const x=clone(n);x.id=uid();x.name=n.name+" Copy";x.position=x.position.map((v,i)=>v+(i===0||i===2?S.grid*2:0));map.set(id,x.id);return x});copies.forEach(x=>{if(x.parent&&map.has(x.parent))x.parent=map.get(x.parent)});S.nodes.push(...copies);S.selectedIds=copies.map(x=>x.id);S.selected=S.selectedIds.at(-1);render();save(false);toast(copies.length+" objetos duplicados")}
function proRemove(){if(S.selectedIds.length<2)return _baseRemove();commit();const ids=new Set(S.selectedIds);S.nodes=S.nodes.filter(n=>!ids.has(n.id)&&!proDescendant(n.id,[...ids][0]));proSelect(null);render();save(false);toast("Objetos removidos")}
function proRender(full=true){S.selectedIds=S.selectedIds||[S.selected].filter(Boolean);_baseRender(full)}
add=proAdd;tree=proTree;panel=proPanel;duplicate=proDuplicate;remove=proRemove;render=proRender;
const _oldSave=save;save=function(show=true){S.selectedIds=S.selectedIds||[S.selected].filter(Boolean);return _oldSave(show)};
$("[data-add]").forEach(b=>b.onclick=()=>proAdd(b.dataset.add));
$("#validateBtn")&&($("#validateBtn").onclick=validateProject);


/* PRO INPUT + EXPORT */
const _proDownBase=down;
down=function(e){
 if(S.playing)return;
 if(e.button===1||e.button===2){orbit=true;lx=e.clientX;ly=e.clientY;return}
 const r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);
 const hit=ray.intersectObjects([...meshes.values()]).find(h=>h.object.visible);
 if(!hit){if(!(e.ctrlKey||e.metaKey||e.shiftKey)){proSelect(null);render()}return}
 const id=hit.object.userData.id,n=S.nodes.find(x=>x.id===id);if(!n||n.locked)return toast("Objeto bloqueado");
 proSelect(id,e.ctrlKey||e.metaKey||e.shiftKey);drag=S.tool!=="select";lx=e.clientX;ly=e.clientY;dragStart=clone(n);render();status(S.selectedIds.length>1?S.selectedIds.length+" selecionados":"Selecionado")
};
const _proMoveBase=move;
move=function(e){
 if(orbit){theta-=(e.clientX-lx)*.008;phi=Math.max(.1,Math.min(Math.PI-.1,phi-(e.clientY-ly)*.008));lx=e.clientX;ly=e.clientY;sync();return}
 if(!drag||!cur())return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;const ns=S.nodes.filter(n=>S.selectedIds.includes(n.id)&&!n.locked);if(!ns.length)return;if(!ns.some(n=>n._dragged)){commit();ns.forEach(n=>n._dragged=true)}
 ns.forEach(n=>{if(S.tool==="move"){n.position[0]+=dx*.025;n.position[1]-=dy*.025;if(S.snap)n.position=n.position.map(v=>Math.round(v/S.grid)*S.grid)}else if(S.tool==="rotate"){n.rotation[1]+=dx*.5;n.rotation[0]-=dy*.15;if(S.snap)n.rotation=n.rotation.map(v=>Math.round(v/15)*15)}else if(S.tool==="scale"){const q=Math.max(.1,1-dy*.01);n.size=n.size.map(v=>Math.max(.1,v*q));if(S.snap)n.size=n.size.map(v=>Math.max(.1,Math.round(v/S.grid)*S.grid))}});render(false)
};
function proExportXML(){
 const escx=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
 const vec=(name,a)=>'<Vector3 name="'+name+'"><X>'+a[0]+'</X><Y>'+a[1]+'</Y><Z>'+a[2]+'</Z></Vector3>';
 function item(n){let body='<string name="Name">'+escx(n.name)+'</string>';if(n.type!=="Folder"&&n.type!=="Model"&&n.type!=="Script"){body+='<bool name="Anchored">'+!!n.anchored+'</bool><bool name="CanCollide">'+!!n.canCollide+'</bool>'+vec("size",n.size)+'<CoordinateFrame name="CFrame"><X>'+n.position[0]+'</X><Y>'+n.position[1]+'</Y><Z>'+n.position[2]+'</Z><R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>'}if(n.type==="Script")body+='<ProtectedString name="Source">'+escx(n.script||"")+'</ProtectedString>';let kids=S.nodes.filter(x=>x.parent===n.id).map(item).join("");const cls=n.type==="Sphere"||n.type==="Cylinder"||n.type==="Wedge"?"Part":n.type==="Model"?"Model":n.type;return '<Item class="'+cls+'" referent="RBX'+escx(n.id)+'"><Properties>'+body+'</Properties>'+kids+'</Item>'}
 const roots=S.nodes.filter(n=>!n.parent).map(item).join("");return '<?xml version="1.0" encoding="utf-8"?><roblox version="4"><Item class="Workspace" referent="RBXWorkspace"><Properties><string name="Name">Workspace</string></Properties>'+roots+'</Item></roblox>'
}
exportXML=proExportXML;


/* ===== FINAL STUDIO FIXES ===== */
function studioToolbox(){
  const p=$("#panel");
  p.innerHTML='<div class="panel"><input id="assetSearch" class="search" placeholder="⌕ Pesquisar instâncias, serviços ou classes"><div id="assetList"></div></div>';
  const root=p.querySelector(".panel"), list=$("#assetList");
  const groups=[
    ["BASIC",ROBLOX_TYPES.filter(x=>["Part","MeshPart","UnionOperation","SpawnLocation","Seat","VehicleSeat","TrussPart","WedgePart","CornerWedgePart","Sphere","Cylinder","Model","Folder","Tool"].includes(x[0]))],
    ["SCRIPTS",ROBLOX_TYPES.filter(x=>["Script","LocalScript","ModuleScript"].includes(x[0]))],
    ["NETWORK",ROBLOX_TYPES.filter(x=>["RemoteEvent","RemoteFunction","BindableEvent","BindableFunction"].includes(x[0]))],
    ["VALUES",ROBLOX_TYPES.filter(x=>x[0].endsWith("Value"))],
    ["UI / VISUAL",ROBLOX_TYPES.filter(x=>["Decal","Texture","SurfaceGui","BillboardGui","Highlight","Camera","Attachment"].includes(x[0]))],
    ["LIGHTING / FX",ROBLOX_TYPES.filter(x=>["PointLight","SpotLight","SurfaceLight","ParticleEmitter","Beam","Trail","Sky","Atmosphere","ColorCorrectionEffect","BloomEffect","BlurEffect","SunRaysEffect","DepthOfFieldEffect"].includes(x[0]))],
    ["INTERACTION",ROBLOX_TYPES.filter(x=>["ProximityPrompt","ClickDetector"].includes(x[0]))],
    ["TERRAIN",ROBLOX_TYPES.filter(x=>x[0]==="Terrain")]
  ];
  const serviceGroup=document.createElement("div");
  serviceGroup.innerHTML='<div class="section-title">SERVICES</div>';
  ROBLOX_SERVICES.forEach(([name,,desc])=>{
    const b=document.createElement("button");b.className="asset";b.dataset.search=(name+" "+desc).toLowerCase();
    b.innerHTML='<span class="asset-icon">◆</span><span><b>'+esc(name)+'</b><small>'+esc(desc)+'</small></span><strong>→</strong>';
    b.onclick=()=>{const n=S.nodes.find(x=>x.service&&x.name===name);if(n){proSelect(n.id);S.panel="properties";render()}};
    serviceGroup.appendChild(b);
  });
  list.appendChild(serviceGroup);
  groups.forEach(([title,items])=>{
    const box=document.createElement("div");box.dataset.group=title.toLowerCase();
    box.innerHTML='<div class="section-title">'+title+'</div>';
    items.forEach(([type,desc])=>{
      const b=document.createElement("button");b.className="asset";b.dataset.search=(type+" "+desc).toLowerCase();
      b.innerHTML='<span class="asset-icon">◇</span><span><b>'+esc(type)+'</b><small>'+esc(desc)+'</small></span><strong>＋</strong>';
      b.onclick=()=>addRobloxObject(type);box.appendChild(b);
    });
    list.appendChild(box);
  });
  const input=$("#assetSearch");
  input.oninput=()=>{
    const q=input.value.toLowerCase().trim();
    $("#assetList .asset").forEach(b=>b.style.display=(!q||b.dataset.search.includes(q))?"flex":"none");
    $("#assetList [data-group]").forEach(g=>g.style.display=(!q||[...g.querySelectorAll(".asset")].some(b=>b.style.display!=="none"))?"block":"none");
  };
}
const _panelStudioFinal=panel;
panel=function(){
  if(S.panel==="toolbox"){studioToolbox();return}
  _panelStudioFinal();
  const n=cur();
  if(n&&["Script","LocalScript","ModuleScript"].includes(n.type)){
    const root=$("#panel .panel");if(root&&!root.querySelector("#openAnyScript")){
      const b=document.createElement("button");b.id="openAnyScript";b.className="wide primary";b.textContent="Abrir Script Editor";b.onclick=()=>openScript(n.id);root.appendChild(b);
    }
  }
};

function studioFixInit(){
  try{
    if(renderer){
      renderer.setClearColor(0x9bb7cf,1);
      scene.background=new THREE.Color(0x9bb7cf);
      const hemi=scene.children.find(x=>x.isHemisphereLight);if(hemi)hemi.intensity=1.35;
      if(!scene.getObjectByName("__studio_ground")){
        const g=new THREE.Mesh(new THREE.PlaneGeometry(500,500),new THREE.MeshStandardMaterial({color:0x5c6670,roughness:.95}));
        g.name="__studio_ground";g.rotation.x=-Math.PI/2;g.position.y=-.52;scene.add(g);
      }
    }
  }catch(e){console.warn(e)}
}
studioFixInit();
render();
save(false);

/* ===== CORE BRIDGE — cross-layer scope repair ===== */
window.StudioLiteCore={get S(){return S},get renderer(){return renderer},get scene(){return scene},get camera(){return camera},get fallbackCanvas(){return fallbackCanvas},get fallbackCtx(){return fallbackCtx},render,save,undo,redo,add,duplicate,remove,rename,setTool,focus,view,toggleGrid,screenshot,newProject,commandPalette,exportProject,publish,initFallbackCanvas,drawFallback,resize,normalizeNode,clone};
try{Object.defineProperties(window,{S:{configurable:true,get:()=>S},renderer:{configurable:true,get:()=>renderer},scene:{configurable:true,get:()=>scene},camera:{configurable:true,get:()=>camera},fallbackCanvas:{configurable:true,get:()=>fallbackCanvas},fallbackCtx:{configurable:true,get:()=>fallbackCtx}});Object.assign(window,{render,save,undo,redo,add,duplicate,remove,rename,setTool,focus,view,toggleGrid,screenshot,newProject,commandPalette,exportProject,publish,initFallbackCanvas,drawFallback,resize,normalizeNode,clone});}catch(e){console.warn("Core bridge",e)}

})();


/* =========================================================
   UNIVERSAL EXPERIENCE LAYER — v6.0
   Progressive rendering + clean workspace + Party/Team tools
   ========================================================= */
(()=>{"use strict";
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const escU=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const KEY="studio-lite-universal-v6";
const U={mode:localStorage.getItem(KEY+".mode")||"auto",grid:true,party:JSON.parse(localStorage.getItem(KEY+".party")||'{"name":"Meu Party","max":6,"members":[{"name":"Você","team":"Builder","ready":true}],"code":"LOCAL-001"}'),density:localStorage.getItem(KEY+".density")||"comfortable"};
const saveU=()=>{localStorage.setItem(KEY+".mode",U.mode);localStorage.setItem(KEY+".party",JSON.stringify(U.party));localStorage.setItem(KEY+".density",U.density)};

function addStyle(){
 if(q("#universalStyle"))return;
 const s=document.createElement("style");s.id="universalStyle";
 s.textContent=`
 .u-dock{position:absolute;right:10px;top:48px;z-index:7;display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;max-width:min(430px,70vw);pointer-events:auto}
 .u-dock button{height:29px;padding:0 9px;background:#090909e8;border:1px solid #292929;color:#aaa;border-radius:7px;font-size:10px}
 .u-dock button.active{color:#fff;border-color:#666;background:#202020}
 .u-pop{position:fixed;inset:0;z-index:180;background:#000b;backdrop-filter:blur(12px);display:grid;place-items:center;padding:12px}
 .u-card{width:min(760px,100%);max-height:min(820px,94vh);overflow:auto;background:#0b0b0b;border:1px solid #303030;border-radius:15px;box-shadow:0 30px 100px #000;padding:18px}
 .u-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}.u-head h2{margin:0;font-size:18px}.u-head small{display:block;color:#666;margin-top:3px}
 .u-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.u-card button,.u-card input,.u-card select{background:#101010;color:#ddd;border:1px solid #292929;border-radius:7px;padding:9px}
 .u-card input,.u-card select{width:100%}.u-wide{grid-column:1/-1}.u-box{border:1px solid #222;background:#0e0e0e;border-radius:9px;padding:11px}.u-muted{color:#666;font-size:11px;line-height:1.5}
 .u-members{display:grid;gap:6px;margin-top:8px}.u-member{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #222;border-radius:8px}.u-member b{flex:1}.u-dot{width:8px;height:8px;border-radius:50%;background:#555}.u-dot.on{background:#22c55e;box-shadow:0 0 9px #22c55e}
 .u-scene{position:absolute;inset:0;overflow:hidden;perspective:900px;background:linear-gradient(#a9c7df 0%,#d7e7ef 55%,#7b9a63 55%,#5e7f4a 100%);display:none;touch-action:none}
 .u-scene.on{display:block}.u-world{position:absolute;left:50%;top:54%;width:0;height:0;transform-style:preserve-3d;transform:translate(-50%,-50%) rotateX(58deg) rotateZ(-25deg)}
 .u-ground{position:absolute;width:900px;height:900px;left:-450px;top:-450px;background:repeating-linear-gradient(0deg,#ffffff0c 0 1px,transparent 1px 40px),repeating-linear-gradient(90deg,#ffffff0c 0 1px,transparent 1px 40px);border:1px solid #ffffff22;transform:rotateX(90deg);transform-origin:center;box-shadow:0 0 0 100vmax #0000}
 .u-cube{position:absolute;transform-style:preserve-3d;cursor:pointer}.u-face{position:absolute;backface-visibility:visible;border:1px solid #ffffff35;background:#3b82f6dd;box-shadow:inset 0 0 20px #0002}.u-label{position:absolute;left:50%;top:-20px;transform:translateX(-50%) rotateZ(25deg) rotateX(-58deg);white-space:nowrap;color:#fff;background:#090909cc;border:1px solid #333;border-radius:5px;padding:2px 5px;font:9px system-ui;pointer-events:none}
 .u-status{position:absolute;left:10px;bottom:10px;background:#090909dc;border:1px solid #292929;color:#ddd;border-radius:8px;padding:7px 9px;font-size:10px;z-index:2}
 .u-clean .tree-row{height:28px}.u-clean .panel{padding:9px}.u-clean .section-title{margin-top:11px}
 @media(max-width:700px){.u-dock{top:44px;right:7px;max-width:90vw}.u-grid{grid-template-columns:1fr}.u-card{padding:13px}.u-wide{grid-column:auto}.u-scene .u-ground{width:600px;height:600px;left:-300px;top:-300px}}
 `;
 document.head.appendChild(s);
}
function pop(title,sub,body){
 const w=document.createElement("div");w.className="u-pop";
 w.innerHTML='<div class="u-card"><div class="u-head"><div><h2>'+escU(title)+'</h2><small>'+escU(sub||"")+'</small></div><button data-close>✕</button></div><div class="u-body">'+body+'</div></div>';
 w.querySelector("[data-close]").onclick=()=>w.remove();w.addEventListener("click",e=>{if(e.target===w)w.remove()});document.body.appendChild(w);return w;
}
function getNodes(){
 try{const x=JSON.parse(localStorage.getItem("studio-lite-v4")||"{}");return Array.isArray(x.nodes)?x.nodes:[]}
 catch{return[]}
}
function setMode(mode){
 U.mode=mode;saveU();
 const old=q("#uScene");if(old)old.remove();
 const canvas=q("#canvas");
 const fallback=canvas?.querySelector(".fallback-canvas");
 if(mode==="css3d"){makeCSS3D();if(fallback)fallback.style.display="none"}
 else if(fallback)fallback.style.display="";
 const b=qa(".u-mode");b.forEach(x=>x.classList.toggle("active",x.dataset.mode===mode));
 const hud=q("#engineHud");if(hud)hud.textContent=mode==="auto"?"AUTO":mode.toUpperCase();
}
function makeCSS3D(){
 let sc=q("#uScene");if(!sc){sc=document.createElement("div");sc.id="uScene";sc.className="u-scene";q("#canvas").appendChild(sc)}
 sc.classList.add("on");sc.innerHTML='<div class="u-world"><div class="u-ground"></div></div><div class="u-status">CSS 3D COMPAT • toque/clique nos objetos • zoom do navegador continua disponível</div>';
 const world=sc.querySelector(".u-world");
 const nodes=getNodes().filter(n=>n.visible!==false&&!["Folder","Script","LocalScript","ModuleScript"].includes(n.type));
 nodes.forEach(n=>{
   const x=Math.max(.2,Math.min(18,Number(n.size?.[0]||2))),y=Math.max(.2,Math.min(18,Number(n.size?.[1]||2))),z=Math.max(.2,Math.min(18,Number(n.size?.[2]||2)));
   const el=document.createElement("div");el.className="u-cube";el.dataset.id=n.id;
   el.style.width=x*18+"px";el.style.height=y*18+"px";el.style.left=(Number(n.position?.[0]||0)*18)+"px";el.style.top=(-Number(n.position?.[2]||0)*18)+"px";
   el.style.transform="translate(-50%,-50%) translateZ("+((Number(n.position?.[1]||0))*18)+"px)";
   const col=n.color||"#64748b", faces=[["front","translateZ("+(z*9)+"px)"],["back","rotateY(180deg) translateZ("+(z*9)+"px)"],["right","rotateY(90deg) translateZ("+(x*9)+"px)"],["left","rotateY(-90deg) translateZ("+(x*9)+"px)"],["top","rotateX(90deg) translateZ("+(y*9)+"px)"],["bottom","rotateX(-90deg) translateZ("+(y*9)+"px)"]];
   faces.forEach(([name,tr])=>{const f=document.createElement("div");f.className="u-face";f.style.width=x*18+"px";f.style.height=y*18+"px";f.style.transform=tr;f.style.background=col+"dd";el.appendChild(f)});
   const lab=document.createElement("div");lab.className="u-label";lab.textContent=n.name||n.type;el.appendChild(lab);
   el.onclick=()=>{const row=qa(".tree-row").find(r=>r.textContent.includes(n.name));row?.click();el.style.filter="brightness(1.35)";setTimeout(()=>el.style.filter="",300)};
   world.appendChild(el);
 });
}
function addDock(){
 if(q("#uDock"))return;
 const d=document.createElement("div");d.id="uDock";d.className="u-dock";
 d.innerHTML='<button class="u-mode" data-mode="auto">AUTO</button><button class="u-mode" data-mode="webgl">WEBGL</button><button class="u-mode" data-mode="css3d">CSS 3D</button><button class="u-mode" data-mode="2d">2D</button><button id="uParty">PARTY</button><button id="uLayout">LAYOUT</button>';
 q(".viewport")?.appendChild(d);
 qa(".u-mode").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
 q("#uParty").onclick=partyUI;q("#uLayout").onclick=layoutUI;
}
function partyUI(){
 const m=U.party.members||[];
 const w=pop("Party & Teams","Sessão local pronta para organizar testes, equipes e jogadores.",
 '<div class="u-grid"><div class="u-box"><b>Nome da Party</b><input id="pName" value="'+escU(U.party.name)+'"></div><div class="u-box"><b>Código</b><input id="pCode" value="'+escU(U.party.code)+'"><button id="pGen" style="margin-top:5px;width:100%">Gerar novo</button></div><div class="u-box"><b>Limite</b><select id="pMax"><option>2</option><option>4</option><option>6</option><option>8</option><option>12</option></select></div><div class="u-box"><b>Seu time</b><select id="pTeam"><option>Builder</option><option>Script</option><option>Design</option><option>Tester</option><option>Red</option><option>Blue</option></select></div><div class="u-box u-wide"><b>Membros</b><div class="u-members" id="pMembers"></div></div><button class="u-wide" id="pAdd">＋ Adicionar participante de teste</button><button class="u-wide" id="pReady">Alternar Ready</button><button class="u-wide" id="pSave">Salvar Party</button></div>');
 w.querySelector("#pMax").value=String(U.party.max);w.querySelector("#pTeam").value=m[0]?.team||"Builder";
 const draw=()=>{w.querySelector("#pMembers").innerHTML=(U.party.members||[]).map((x,i)=>'<div class="u-member"><i class="u-dot '+(x.ready?"on":"")+'"></i><b>'+escU(x.name)+'</b><span>'+escU(x.team)+'</span>'+(i?'<button data-i="'+i+'">✕</button>':"")+'</div>').join("");qa("#pMembers [data-i]").forEach(b=>b.onclick=()=>{U.party.members.splice(Number(b.dataset.i),1);draw();saveU()})};
 draw();
 w.querySelector("#pGen").onclick=()=>{U.party.code=Math.random().toString(36).slice(2,8).toUpperCase();w.querySelector("#pCode").value=U.party.code};
 w.querySelector("#pAdd").onclick=()=>{if(U.party.members.length>=U.party.max)return alert("Party cheia");U.party.members.push({name:"Player "+U.party.members.length,team:"Tester",ready:false});draw()};
 w.querySelector("#pReady").onclick=()=>{U.party.members[0].ready=!U.party.members[0].ready;draw()};
 w.querySelector("#pSave").onclick=()=>{U.party.name=w.querySelector("#pName").value||"Minha Party";U.party.max=Number(w.querySelector("#pMax").value);U.party.members[0].team=w.querySelector("#pTeam").value;U.party.code=w.querySelector("#pCode").value||"LOCAL-001";saveU();w.remove();partyUI()};
}
function layoutUI(){
 const w=pop("Workspace","Organização rápida para uma interface limpa.",'<div class="u-grid"><button id="dense">Compactar Explorer/Properties</button><button id="comfort">Espaçamento confortável</button><button id="focus">Modo foco: ocultar painéis</button><button id="resetLayout">Restaurar layout</button><div class="u-box u-wide u-muted">No celular, os painéis continuam como gavetas. No desktop, o foco reduz distrações sem apagar ferramentas.</div></div>');
 w.querySelector("#dense").onclick=()=>{document.body.classList.add("u-clean");U.density="compact";saveU();w.remove()};
 w.querySelector("#comfort").onclick=()=>{document.body.classList.remove("u-clean");U.density="comfortable";saveU();w.remove()};
 w.querySelector("#focus").onclick=()=>{q(".explorer")?.classList.toggle("focus-hidden");q(".inspector")?.classList.toggle("focus-hidden");w.remove()};
 w.querySelector("#resetLayout").onclick=()=>{document.body.classList.remove("u-clean");q(".explorer")?.classList.remove("focus-hidden");q(".inspector")?.classList.remove("focus-hidden");U.density="comfortable";saveU();w.remove()};
}
function addUniversalCommands(){
 const cmd=q("#commandBtn");if(cmd){const old=cmd.onclick;cmd.addEventListener("click",()=>setTimeout(()=>{},0))}
 document.addEventListener("keydown",e=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();partyUI()}
   if(e.key==="F6"){e.preventDefault();const order=["auto","webgl","css3d","2d"],i=order.indexOf(U.mode);setMode(order[(i+1)%order.length])}
   if(e.key==="F7"){e.preventDefault();partyUI()}
   if(e.key==="F8"){e.preventDefault();layoutUI()}
 });
}
function bootUniversal(){
 addStyle();addDock();addUniversalCommands();
 if(U.density==="compact")document.body.classList.add("u-clean");
 setTimeout(()=>{if(U.mode==="css3d")setMode("css3d");else if(U.mode==="2d")setMode("2d");else if(U.mode==="webgl")setMode("webgl")},350);
 setInterval(()=>{if(U.mode==="css3d")makeCSS3D()},1200);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bootUniversal);else bootUniversal();
})();/* STUDIO LITE V7 — UNIVERSAL / REALTIME / CLEAN 3D LAYER */
(()=>{
const U7={supa:null,party:null,channel:null,clientId:localStorage.getItem("studio-lite-client-id")||(crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36)),saveTimer:null,applyingRemote:false,mode:localStorage.getItem("studio-lite-universal-v7.mode")||"auto"};localStorage.setItem("studio-lite-client-id",U7.clientId);
const $7=s=>document.querySelector(s),esc7=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));const toast7=t=>{try{toast(t)}catch{console.info(t)}},partyCode7=()=>Math.random().toString(36).slice(2,8).toUpperCase();
const currentScene7=()=>({nodes:clone(S.nodes),name:S.project,grid:S.grid,snap:S.snap});
function applyScene7(scene){if(!scene||!Array.isArray(scene.nodes))return;U7.applyingRemote=true;S.nodes=scene.nodes.map(n=>normalizeNode(n));S.project=scene.name||S.project;S.grid=Number(scene.grid)||1;S.snap=scene.snap!==false;const sel=S.nodes.find(n=>n.id===S.selected)||S.nodes.find(n=>n.type==="Part")||S.nodes[0];S.selected=sel?.id||null;const pn=$7("#projectName");if(pn)pn.value=S.project;render();U7.applyingRemote=false}
async function initSupa7(){if(!window.supabase?.createClient)return false;try{U7.supa=window.supabase.createClient("https://anlwpqwjjswkqncltcdl.supabase.co","sb_publishable_r3GoKwcOEaXySt7fFOM_0A_rNOc7Mq7",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});try{const ss=await U7.supa.auth.getSession();if(!ss.data?.session){await U7.supa.auth.signInAnonymously()}}catch(e){console.info("Anonymous cloud session unavailable",e)}return true}catch(e){console.warn("Supabase init failed",e);return false}}
async function partyLeave7(){if(!U7.party)return;const code=U7.party.code;try{await U7.supa?.rpc("studio_party_member_leave",{p_code:code,p_client_id:U7.clientId})}catch{}try{if(U7.channel)await U7.supa.removeChannel(U7.channel)}catch{}U7.channel=null;U7.party=null;localStorage.removeItem("studio-lite-party-v7")}
async function refreshParty7(){if(!U7.party||!U7.supa)return;const {data}=await U7.supa.from("studio_party_members").select("client_id,display_name,team,ready,last_seen").eq("party_id",U7.party.id).order("created_at");const root=$7("#partyMembersV7");if(root&&data)root.innerHTML=data.map(m=>'<div class="u7-member"><span class="u7-dot"></span><b>'+esc7(m.display_name)+'</b><small>'+esc7(m.team)+(m.ready?" • READY":"")+'</small></div>').join("");const count=$7("#partyCountV7");if(count)count.textContent=(data?.length||0)+"/"+U7.party.max_members}
async function refreshPresence7(){if(!U7.channel)return;const state=U7.channel.presenceState(),root=$7("#partyMembersV7");if(!root)return;const flat=[];Object.values(state||{}).forEach(arr=>(arr||[]).forEach(x=>flat.push(x)));root.innerHTML=flat.map(m=>'<div class="u7-member"><span class="u7-dot live"></span><b>'+esc7(m.name||"Player")+'</b><small>'+esc7(m.team||"Builder")+(m.ready?" • READY":"")+'</small></div>').join("");const count=$7("#partyCountV7");if(count&&U7.party)count.textContent=flat.length+"/"+U7.party.max_members}
async function joinParty7(code,name,team){if(!U7.supa)return toast7("Supabase ainda não está disponível");code=String(code||"").trim().toUpperCase();if(!/^[A-Z0-9]{6,12}$/.test(code))return toast7("Código de Party inválido");const {data:party,error}=await U7.supa.from("studio_parties").select("*").eq("code",code).eq("status","open").maybeSingle();if(error||!party)return toast7("Party não encontrada ou fechada");await partyLeave7();U7.party={id:party.id,code:party.code,name:party.name,max_members:party.max_members,host_id:party.host_id};const memberName=String(name||"Player").trim().slice(0,40)||"Player",memberTeam=team||"Builder";const {error:me}=await U7.supa.rpc("studio_party_member_upsert",{p_code:code,p_client_id:U7.clientId,p_display_name:memberName,p_team:memberTeam,p_ready:false});if(me){U7.party=null;return toast7(me.message?.includes("PARTY_FULL")?"Party cheia":"Não foi possível entrar na Party")}applyScene7(party.scene);U7.channel=U7.supa.channel("studio-party-"+code,{config:{broadcast:{self:false},presence:{key:U7.clientId}}});U7.channel.on("broadcast",{event:"scene"},{callback:payload=>{if(payload?.payload?.client_id===U7.clientId)return;if(payload?.payload?.scene)applyScene7(payload.payload.scene)}}).on("broadcast",{event:"member"},{callback:()=>refreshParty7()}).on("presence",{event:"sync"},()=>refreshPresence7());await U7.channel.subscribe(async s=>{if(s==="SUBSCRIBED"){await U7.channel.track({client_id:U7.clientId,name:memberName,team:memberTeam,ready:false});await refreshPresence7()}});localStorage.setItem("studio-lite-party-v7",JSON.stringify(U7.party));status7("Party "+code+" • conectado");toast7("Conectado à Party "+code);document.querySelector("#partyV7Modal")?.remove();return true}
async function createParty7(name,maxMembers,displayName,team){if(!U7.supa)return toast7("Supabase ainda não está disponível");const code=partyCode7(),scene=currentScene7();const {data:party,error}=await U7.supa.from("studio_parties").insert({code,name:String(name||"Studio Party").slice(0,80),max_members:Number(maxMembers)||6,host_id:U7.clientId,scene,settings:{mode:"collaborative"}}).select("*").single();if(error||!party)return toast7("Não foi possível criar a Party");await joinParty7(code,displayName,team)}
function status7(t){try{status(t)}catch{}}
function partyModal7(){const root=$7("#modalRoot");if(!root)return;root.innerHTML='<div class="modal-bg" id="partyV7Modal"><div class="modal u7-modal"><div class="modal-head"><div><h2>Studio Party</h2><p>Colaboração em tempo real via Supabase Realtime.</p></div><button id="partyCloseV7">✕</button></div><div class="u7-party-state"><span class="u7-live-dot"></span><b id="partyStatusV7">'+(U7.party?"Conectado • "+U7.party.code:"Sem Party")+'</b><span id="partyCountV7">'+(U7.party?"…":"0/0")+'</span></div><div class="row"><div><label>Seu nome</label><input id="partyNameV7" maxlength="40" value="'+esc7(localStorage.getItem("studio-lite-display-name")||"Player")+'"></div><div><label>Equipe</label><select id="partyTeamV7"><option>Builder</option><option>Script</option><option>Design</option><option>Tester</option><option>Red</option><option>Blue</option></select></div></div><h3>Entrar</h3><div class="row"><input id="partyCodeV7" maxlength="12" placeholder="CÓDIGO DA PARTY"><button class="primary" id="partyJoinV7">Entrar na Party</button></div><h3>Criar</h3><div class="row"><input id="partyTitleV7" maxlength="80" value="Studio Party"><select id="partyMaxV7"><option value="2">2 membros</option><option value="4">4 membros</option><option value="6" selected>6 membros</option><option value="8">8 membros</option><option value="12">12 membros</option></select></div><button class="wide primary" id="partyCreateV7">＋ Criar nova Party</button><h3>Membros online</h3><div id="partyMembersV7" class="u7-members"></div><div class="modal-actions"><button id="partyCopyV7">Copiar código</button><button class="danger" id="partyLeaveV7">Sair</button></div></div></div>';const modal=$7("#partyV7Modal");$7("#partyCloseV7").onclick=()=>modal.remove();$7("#partyJoinV7").onclick=()=>joinParty7($7("#partyCodeV7").value,$7("#partyNameV7").value,$7("#partyTeamV7").value);$7("#partyCreateV7").onclick=()=>createParty7($7("#partyTitleV7").value,$7("#partyMaxV7").value,$7("#partyNameV7").value,$7("#partyTeamV7").value);$7("#partyCopyV7").onclick=async()=>{if(!U7.party)return toast7("Você não está em uma Party");await navigator.clipboard?.writeText(U7.party.code);toast7("Código copiado: "+U7.party.code)};$7("#partyLeaveV7").onclick=async()=>{await partyLeave7();modal.remove();toast7("Você saiu da Party")};$7("#partyNameV7").onchange=e=>localStorage.setItem("studio-lite-display-name",e.target.value.trim().slice(0,40));if(U7.party){refreshParty7();refreshPresence7()}}
let cloudProject7=localStorage.getItem("studio-lite-cloud-project-id")||null,cloudTimer7=null;
async function cloudSave7(){if(!U7.supa)return;clearTimeout(cloudTimer7);cloudTimer7=setTimeout(async()=>{try{const u=(await U7.supa.auth.getUser()).data?.user;if(!u)return;const scene=currentScene7();if(cloudProject7){const q=await U7.supa.from("studio_projects").update({name:S.project,scene,status:"draft",updated_at:new Date().toISOString()}).eq("id",cloudProject7).eq("user_id",u.id).select("id").maybeSingle();if(!q.data){cloudProject7=null}}if(!cloudProject7){const q=await U7.supa.from("studio_projects").insert({user_id:u.id,name:S.project,scene,status:"draft"}).select("id").single();if(q.data?.id){cloudProject7=q.data.id;localStorage.setItem("studio-lite-cloud-project-id",cloudProject7)}}if(cloudProject7){await U7.supa.from("studio_versions").insert({project_id:cloudProject7,user_id:u.id,version:Date.now(),label:"Autosave",scene,source_type:"web"})}}catch(e){console.warn("Cloud save",e)}},700)}
async function broadcastScene7(){if(!U7.party||!U7.channel||U7.applyingRemote)return;const scene=currentScene7();clearTimeout(U7.saveTimer);U7.saveTimer=setTimeout(async()=>{try{await U7.channel.send({type:"broadcast",event:"scene",payload:{client_id:U7.clientId,scene}});await U7.supa.rpc("studio_party_update_scene",{p_code:U7.party.code,p_scene:scene,p_settings:{mode:"collaborative"}})}catch(e){console.warn("Party sync",e)}},180)}
function inject7(){if(!$7("#partyV7Style")){const st=document.createElement("style");st.id="partyV7Style";st.textContent='.u7-modal{width:min(720px,100%)}.u7-party-state{display:flex;align-items:center;gap:8px;padding:10px;background:#101010;border:1px solid #242424;border-radius:9px;margin:8px 0 14px}.u7-party-state span:last-child{margin-left:auto;color:#777}.u7-live-dot,.u7-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 9px #22c55e}.u7-members{display:grid;gap:6px;max-height:220px;overflow:auto}.u7-member{display:flex;align-items:center;gap:8px;padding:9px 10px;background:#0e0e0e;border:1px solid #1d1d1d;border-radius:8px}.u7-member small{margin-left:auto;color:#666}.u7-dot.live{background:#60a5fa;box-shadow:0 0 8px #60a5fa}label{display:block;color:#666;font-size:10px;margin:3px 0}.u7-modebar{position:absolute;right:10px;bottom:46px;z-index:7;display:flex;gap:4px;padding:5px;background:#080808dd;border:1px solid #282828;border-radius:9px;backdrop-filter:blur(8px)}.u7-modebar button{height:28px;font-size:10px;padding:0 8px}.u7-modebar button.active{background:#eee;color:#050505;border-color:#fff}.u7-party-btn{font-weight:800}@media(max-width:600px){.u7-modebar{left:7px;right:7px;bottom:48px;overflow:auto}.u7-modebar button{flex:1;min-width:58px}.u7-modal .row{grid-template-columns:1fr}}';document.head.appendChild(st)}if(!$7("#u7Modebar")){const bar=document.createElement("div");bar.id="u7Modebar";bar.className="u7-modebar";bar.innerHTML='<button data-u7="auto">AUTO</button><button data-u7="webgl">WEBGL</button><button data-u7="css3d">3D SAFE</button><button data-u7="2d">2D</button><button data-u7="party" class="u7-party-btn">PARTY</button>';$7("#viewport")?.appendChild(bar);bar.querySelectorAll("button").forEach(b=>b.onclick=()=>b.dataset.u7==="party"?partyModal7():setMode7(b.dataset.u7))}}
let cssWorld7=null;
function setMode7(mode){mode=String(mode).toLowerCase();if(mode==="webgl"&&!renderer){try{init()}catch{}}if(mode==="auto")mode=renderer?"webgl":"css3d";U7.mode=mode;localStorage.setItem("studio-lite-universal-v7.mode",mode);const host=$7("#canvas");if(!host)return;host.classList.toggle("u7-hide-webgl",mode==="css3d"||mode==="2d");if(mode==="css3d"){makeCSS3D7();host.querySelectorAll("canvas").forEach(c=>c.style.visibility="hidden")}else if(mode==="2d"){if(typeof initFallbackCanvas==="function"&&!fallbackCanvas)initFallbackCanvas();host.querySelectorAll("canvas").forEach(c=>c.style.visibility=(c===fallbackCanvas?"visible":"hidden"));if(typeof drawFallback==="function")drawFallback()}else{host.querySelectorAll("canvas").forEach(c=>c.style.visibility="visible");cssWorld7?.remove();cssWorld7=null;resize?.();render?.()}$7("#engineHud").textContent=mode==="css3d"?"3D SAFE":mode==="2d"?"2D COMPAT":"WebGL";document.querySelectorAll("[data-u7]").forEach(b=>b.classList.toggle("active",b.dataset.u7===mode))}
function makeCSS3D7(){const host=$7("#canvas");if(!host)return;cssWorld7?.remove();const wrap=document.createElement("div");wrap.className="u7-css3d";wrap.style.cssText="position:absolute;inset:0;overflow:hidden;background:linear-gradient(#7fb7e8 0%,#d7ecfa 58%,#89b77a 58%,#6d9c5d 100%);perspective:900px";const world=document.createElement("div");world.style.cssText="position:absolute;left:50%;top:54%;width:1px;height:1px;transform-style:preserve-3d;transform:translate(-50%,-50%) rotateX(60deg) rotateZ(0deg)";const ground=document.createElement("div");ground.style.cssText="position:absolute;width:1100px;height:1100px;left:-550px;top:-550px;background-image:linear-gradient(rgba(0,0,0,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.13) 1px,transparent 1px);background-size:25px 25px;transform:translateZ(-3px)";world.appendChild(ground);S.nodes.filter(n=>n.type!=="Folder"&&n.type!=="Script"&&n.visible!==false).forEach(n=>{const d=document.createElement("div"),x=n.position?.[0]||0,y=n.position?.[1]||0,z=n.position?.[2]||0,sx=Math.max(10,(n.size?.[0]||2)*13),sy=Math.max(10,(n.size?.[1]||2)*13),sz=Math.max(10,(n.size?.[2]||2)*13);d.style.cssText="position:absolute;left:"+(x*13-sx/2)+"px;top:"+(-z*13-sz/2)+"px;width:"+sx+"px;height:"+Math.max(12,sy)+"px;background:"+(n.color||"#5b8def")+";border:1px solid rgba(255,255,255,.45);border-radius:3px;box-shadow:0 9px 15px rgba(0,0,0,.2);transform:translateZ("+(y*13)+"px);cursor:pointer";d.title=n.name;d.onclick=()=>{S.selected=n.id;render();makeCSS3D7()};world.appendChild(d)});wrap.appendChild(world);host.appendChild(wrap);cssWorld7=wrap}
function patchSave7(){if(window.__studioLiteSaveV7)return;window.__studioLiteSaveV7=true;const oldSave=save;save=function(notify=true){oldSave(notify);cloudSave7();broadcastScene7()}}
function patchRender7(){if(window.__studioLiteRenderV7)return;window.__studioLiteRenderV7=true;const oldRender=render;render=function(...args){oldRender(...args);if(U7.mode==="css3d")makeCSS3D7();if(U7.party)broadcastScene7()}}
function boot7(){inject7();patchSave7();patchRender7();document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();e.stopImmediatePropagation();$7("#commandBtn")?.click()}if(e.key==="F7"){e.preventDefault();partyModal7()}if(e.key==="F6"){e.preventDefault();const seq=["auto","webgl","css3d","2d"];setMode7(seq[(seq.indexOf(U7.mode)+1)%seq.length])}},true);document.addEventListener("visibilitychange",()=>{if(!document.hidden&&U7.party)refreshParty7()});initSupa7().then(ok=>{if(ok)status7("Supabase conectado • pronto");setMode7(U7.mode)})}
window.StudioLiteParty={open:partyModal7,join:joinParty7,create:createParty7,leave:partyLeave7};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot7);else boot7();
})();

/* ===== STUDIO LITE V8 — NAVIGATION + PERFORMANCE HARDENING ===== */
(()=>{
"use strict";
const V8={historyReady:false};
const q8=s=>document.querySelector(s);
function topModal8(){return [...document.querySelectorAll("#modalRoot .modal-bg")].at(-1)||null}
function closeTop8(){
 const m=topModal8(); if(m){m.remove();return true}
 const openPanel=document.querySelector(".sidebar.open"); if(openPanel){openPanel.classList.remove("open");return true}
 const pb=document.querySelector("#playBadge"); if(pb?.classList.contains("on")){document.querySelector("#playBtn")?.click();return true}
 return false;
}
window.studioBack=closeTop8;
function addModalBack8(root){
 if(!root||root.dataset.backReady==="1")return;
 const head=root.querySelector(".modal-head"); if(!head)return;
 root.dataset.backReady="1";
 const b=document.createElement("button"); b.className="studio-back-layer"; b.type="button"; b.title="Voltar"; b.textContent="← Voltar";
 b.onclick=()=>root.remove(); head.insertBefore(b,head.firstChild);
}
function scan8(){document.querySelectorAll("#modalRoot .modal-bg").forEach(addModalBack8)}
function setupNavigation8(){
 const back=q8("#backBtn"); if(back)back.onclick=()=>{if(!closeTop8())toast("Você já está na tela principal")};
 const root=q8("#modalRoot"); if(root)new MutationObserver(scan8).observe(root,{childList:true,subtree:true});
 addEventListener("popstate",()=>{if(!closeTop8())history.pushState(null,"",location.href)});
 if(!V8.historyReady){history.pushState({studioLite:true},"",location.href);V8.historyReady=true}
 addEventListener("keydown",e=>{if(e.key==="Escape"&&!/input|textarea|select/i.test(e.target?.tagName||"")){if(closeTop8())e.preventDefault()}},true);
 scan8();
}
function optimize8(){
 let t=0;
 addEventListener("resize",()=>{cancelAnimationFrame(t);t=requestAnimationFrame(()=>{try{resize?.()}catch{}})},{passive:true});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden){try{render?.(false)}catch{}}});
}
function install8(){setupNavigation8();optimize8()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install8);else install8();
})();


/* ===== STUDIO LITE V9 — UI / NAVIGATION / PARTY RELIABILITY ===== */
(()=>{
"use strict";
const q9=s=>document.querySelector(s), qa9=s=>[...document.querySelectorAll(s)];
const closeLayer9=()=>{
  const modal=qa9("#modalRoot .modal-bg").at(-1);
  if(modal){modal.remove();return true}
  const pop=qa9("#modalRoot .u-pop, body>.u-pop").at(-1);
  if(pop){pop.remove();return true}
  const open=qa9(".sidebar.open").at(-1);
  if(open){open.classList.remove("open");return true}
  const collapsed=q9(".explorer.collapsed");
  if(collapsed){collapsed.classList.remove("collapsed");q9(".workspace")?.classList.remove("explorer-collapsed");return true}
  const play=q9("#playBadge");
  if(play?.classList.contains("on")){q9("#playBtn")?.click();return true}
  return false;
};
window.studioBack=closeLayer9;

function toggleExplorer9(force){
  const ex=q9("#explorerPanel"), ws=q9(".workspace");
  if(!ex)return;
  if(force===true){ex.classList.remove("collapsed");ws?.classList.remove("explorer-collapsed");ex.classList.add("open");return}
  if(innerWidth<=850){ex.classList.toggle("open");q9("#inspectorPanel")?.classList.remove("open");return}
  ex.classList.toggle("collapsed");ws?.classList.toggle("explorer-collapsed",ex.classList.contains("collapsed"));
}
function toggleInspector9(force){
  const ins=q9("#inspectorPanel");
  if(!ins)return;
  if(innerWidth<=850)ins.classList.toggle("open",force===undefined?!ins.classList.contains("open"):force);
  else if(force===false)ins.classList.remove("collapsed");
}

function installNav9(){
  q9("#explorerToggle")?.addEventListener("click",e=>{e.preventDefault();toggleExplorer9()});
  q9("#collapseBtn")?.addEventListener("click",e=>{e.preventDefault();toggleExplorer9()});
  q9("#inspectorToggle")?.addEventListener("click",e=>{e.preventDefault();toggleInspector9()});
  q9("#backBtn")?.addEventListener("click",e=>{e.preventDefault();if(!closeLayer9()){try{history.back()}catch{}}});
  addEventListener("popstate",()=>{if(!closeLayer9()){history.pushState({studioLite:true},"",location.href)}});
  if(!history.state?.studioLite)history.pushState({studioLite:true},"",location.href);
  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape"||/input|textarea|select/i.test(e.target?.tagName||""))return;
    if(closeLayer9())e.preventDefault();
  },true);
  new MutationObserver(()=>qa9("#modalRoot .modal-bg").forEach(m=>{
    if(m.dataset.v9)return;
    m.dataset.v9="1";
    const head=m.querySelector(".modal-head");
    if(!head)return;
    const b=document.createElement("button");
    b.className="studio-back-layer";
    b.type="button";
    b.textContent="← Voltar";
    b.title="Voltar";
    b.onclick=()=>m.remove();
    head.insertBefore(b,head.firstChild);
  })).observe(q9("#modalRoot")||document.body,{childList:true,subtree:true});
}

function installParty9(){
  const btn=q9("#uParty");
  if(btn){
    btn.textContent="PARTY";
    btn.title="Colaboração em tempo real";
    btn.onclick=e=>{e.preventDefault();try{window.StudioLiteParty?.open?.()}catch(err){console.error(err);window.alert("Não foi possível abrir a Party.")}};
  }
  const oldOpen=window.StudioLiteParty?.open;
  if(oldOpen&&!window.__partyOpenV9){
    window.__partyOpenV9=true;
    window.StudioLiteParty.open=()=>{try{return oldOpen()}catch(err){console.error(err);toast("Não foi possível abrir a Party");return false}};
  }
}
function installLanguage9(){
  const map={
    "CREATE":"CRIAR","EDIT":"EDITAR","TRANSFORM":"TRANSFORMAR","VIEW":"VISUALIZAÇÃO","FILE":"ARQUIVO",
    "Select":"Selecionar","Move":"Mover","Rotate":"Rotacionar","Scale":"Escalar",
    "Properties":"Propriedades","Toolbox":"Ferramentas","Rename":"Renomear",
    "Front":"Frente","Right":"Direita","Top":"Topo","Perspective":"Perspectiva",
    "Ready":"Pronto","Play":"Executar","Stop":"Parar","Save":"Salvar",
    "Duplicate":"Duplicar","Delete":"Excluir","Conclude":"Concluir","Cancel":"Cancelar",
    "STUDIO OBJECTS":"OBJETOS DO STUDIO","WORKSPACE TOOLS":"FERRAMENTAS DO PROJETO",
    "GENERAL":"GERAL","TRANSFORM":"TRANSFORMAÇÃO","APPEARANCE":"APARÊNCIA","BEHAVIOR":"COMPORTAMENTO","ACTIONS":"AÇÕES",
    "SCRIPT":"SCRIPT","HIERARCHY":"HIERARQUIA","ADVANCED":"AVANÇADO","MESH":"MESH","TERRAIN BRUSH":"TERRENO"
  };
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walk.nextNode())nodes.push(walk.currentNode);
  nodes.forEach(n=>{
    if(n.parentElement?.closest("#tree,.explorer"))return;
    const v=n.nodeValue.trim();if(map[v])n.nodeValue=n.nodeValue.replace(v,map[v]);
  });
  q9("#projectName")?.setAttribute("aria-label","Nome do projeto");
  q9("#treeSearch")?.setAttribute("placeholder","⌕ Filtrar objetos");
}
function installLayout9(){
  const sync=()=>{if(innerWidth>850){q9("#explorerPanel")?.classList.remove("open");q9("#inspectorPanel")?.classList.remove("open")}};
  addEventListener("resize",sync,{passive:true});sync();
}
function boot9(){installNav9();installParty9();installLanguage9();installLayout9()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot9);else boot9();
})();


/* ===== STUDIO LITE CONSOLE — DEBUG / COMMANDS / LOG STREAM ===== */
(()=>{
"use strict";
const q=s=>document.querySelector(s);
const C={lines:[],open:false,max:500,installed:false,original:{}};
const safeString=v=>{try{if(typeof v==="string")return v;if(v instanceof Error)return v.stack||v.message;return JSON.stringify(v)}catch{return String(v)}};
function push(level,args){C.lines.push({time:new Date(),level,text:args.map(safeString).join(" ")});if(C.lines.length>C.max)C.lines.shift();renderConsole()}
function renderConsole(){const out=q("#studioConsoleOutput");if(!out)return;out.innerHTML=C.lines.map(x=>"<div class=\"console-line console-"+x.level+"\"><span>"+x.time.toLocaleTimeString()+"</span><b>"+x.level.toUpperCase()+"</b><em>"+esc(x.text)+"</em></div>").join("");out.scrollTop=out.scrollHeight}
function command(raw){const s=raw.trim(),low=s.toLowerCase();if(!s)return"";if(low==="help"||low==="?")return"Comandos: help, clear, objects, selected, save, validate, play, stop, focus, grid, party";if(low==="clear"){C.lines=[];renderConsole();return"Console limpo"}if(low==="objects")return"S.nodes: "+S.nodes.length+" objetos";if(low==="selected"){const n=cur();return n?"Selecionado: "+n.name+" ("+n.type+")":"Nenhum objeto selecionado"}if(low==="save"){save();return"Projeto salvo"}if(low==="validate"){try{const e=validateProject?.()||[];return Array.isArray(e)&&e.length?"Validação: "+e.join(" | "):"Validação concluída sem erros básicos"}catch(err){return"Falha na validação: "+err.message}}if(low==="play"){q("#playBtn")?.click();return"Play alternado"}if(low==="stop"){if(S.playing)q("#playBtn")?.click();return"Play parado"}if(low==="focus"){focus();return"Viewport focada"}if(low==="grid"){toggleGrid();return"Grid alternado"}if(low==="party"){window.StudioLiteParty?.open?.();return"Party aberta"}return"Comando desconhecido. Use: help"}
function open(){if(C.open){q("#studioConsole")?.remove();C.open=false;return}C.open=true;const bg=document.createElement("div");bg.id="studioConsole";bg.className="modal-bg";bg.innerHTML='<div class="studio-console"><div class="modal-head"><div><h2>⌘ Console</h2><small class="code-meta">Studio Lite • diagnóstico e comandos</small></div><div class="console-head-actions"><button id="consoleClear">Limpar</button><button id="consoleClose">×</button></div></div><div id="studioConsoleOutput" class="studio-console-output"></div><div class="studio-console-input"><span>›</span><input id="consoleCommand" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Digite help, objects, selected..."><button id="consoleRun" class="primary">Executar</button></div></div>';$("body").appendChild(bg);renderConsole();const input=q("#consoleCommand");q("#consoleClose").onclick=()=>{bg.remove();C.open=false};q("#consoleClear").onclick=()=>{C.lines=[];renderConsole()};const run=()=>{const raw=input.value.trim();if(!raw)return;push("input",["> "+raw]);const result=command(raw);if(result)push("info",[result]);input.value="";input.focus()};q("#consoleRun").onclick=run;input.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();run()}}}
function install(){if(C.installed)return;C.installed=true;C.original.log=console.log.bind(console);C.original.info=console.info.bind(console);C.original.warn=console.warn.bind(console);C.original.error=console.error.bind(console);["log","info","warn","error"].forEach(level=>{console[level]=(...args)=>{try{C.original[level](...args)}catch{};push(level,args)}});addEventListener("error",e=>push("error",[e.message+" @ "+e.filename+":"+e.lineno]));addEventListener("unhandledrejection",e=>push("error",["Unhandled rejection:",e.reason]));const b=document.createElement("button");b.id="consoleBtn";b.className="back-top";b.type="button";b.textContent="⌘ Console";b.title="Abrir Console";q(".topbar")?.appendChild(b);b.onclick=open;window.StudioLiteConsole={open,clear:()=>{C.lines=[];renderConsole()},log:(...a)=>push("log",a)};push("info",["Console iniciado"])}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else setTimeout(install,0);
})(); 

/* ===== STUDIO LITE V10 — TOGGLE / EXPLORER / FILE EDITOR HARDENING ===== */
(()=>{
"use strict";
const q10=s=>document.querySelector(s), qa10=s=>[...document.querySelectorAll(s)];
const scriptTypes10=new Set(["Script","LocalScript","ModuleScript"]);
const containerTypes10=new Set(["Folder","Model","Workspace","Players","Lighting","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService"]);
const visualTypes10=new Set(["Part","MeshPart","UnionOperation","SpawnLocation","Seat","VehicleSeat","TrussPart","WedgePart","CornerWedgePart","Sphere","Cylinder","Camera","Attachment","Decal","Texture","SurfaceGui","BillboardGui","PointLight","SpotLight","SurfaceLight","ParticleEmitter","Beam","Trail","ProximityPrompt","ClickDetector","Highlight","Sky","Atmosphere","ColorCorrectionEffect","BloomEffect","BlurEffect","SunRaysEffect","DepthOfFieldEffect","Terrain","Tool"]);
const templates10={
 Script:'-- Script criado no Studio Lite\n\nprint("Hello from Roblox!")',
 LocalScript:'-- LocalScript criado no Studio Lite\n\nprint("Hello from LocalScript!")',
 ModuleScript:'-- ModuleScript criado no Studio Lite\n\nlocal Module = {}\n\nreturn Module'
};
const typeInfo10=type=>{
 const all=Array.isArray(window.ROBLOX_TYPES)?window.ROBLOX_TYPES.map(x=>x?.[0]).filter(Boolean):[];
 return all.includes(type)||scriptTypes10.has(type)||containerTypes10.has(type)||visualTypes10.has(type);
};

function closeModalByHint10(hints){
 const ms=qa10("#modalRoot .modal-bg");
 for(let i=ms.length-1;i>=0;i--){
   const m=ms[i],txt=(m.textContent||"").toLowerCase();
   if(hints.some(h=>txt.includes(h))){m.remove();return true}
 }
 return false;
}
function explorerToggle10(){
 const ex=q10("#explorerPanel"),ws=q10(".workspace"),ins=q10("#inspectorPanel");
 if(!ex)return;
 if(innerWidth<=850){
   const open=ex.classList.contains("open");
   ex.classList.toggle("open",!open);
   if(!open)ins?.classList.remove("open");
   return;
 }
 const collapsed=ex.classList.contains("collapsed");
 ex.classList.toggle("collapsed",!collapsed);
 ws?.classList.toggle("explorer-collapsed",!collapsed);
}
function inspectorToggle10(){
 const ins=q10("#inspectorPanel"),ex=q10("#explorerPanel");
 if(!ins)return;
 const open=ins.classList.contains("open");
 if(innerWidth<=850){
   ins.classList.toggle("open",!open);
   if(!open)ex?.classList.remove("open");
 }else{
   ins.classList.toggle("collapsed",!open);
   q10(".workspace")?.classList.toggle("inspector-collapsed",!open);
 }
}
function bindToggles10(){
 const exBtn=q10("#explorerToggle"),colBtn=q10("#collapseBtn"),insBtn=q10("#inspectorToggle");
 if(exBtn)exBtn.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();explorerToggle10()};
 if(colBtn)colBtn.onclick=e=>{e.preventDefault();e.stopPropagation();explorerToggle10()};
 if(insBtn)insBtn.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();inspectorToggle10()};
 const modalButtons=[
   ["#settingsBtn",["configurações"]],
   ["#commandBtn",["command palette","paleta de comandos"]],
   ["#publishBtn",["publicar no roblox"]],
   ["#publishRbxlBtn",["publicar no roblox"]],
   ["#codeStudioBtn",["novo código","editor multilíngue","code studio"]]
 ];
 modalButtons.forEach(([sel,hints])=>{
   const b=q10(sel);if(!b)return;
   const old=b.onclick;
   if(b.dataset.v10)return;
   b.dataset.v10="1";
   b.onclick=e=>{
     if(closeModalByHint10(hints))return;
     try{old?.call(b,e)}catch(err){console.error(err);toast("Não foi possível abrir esta opção")}
   };
 });
}
function bindPartyToggle10(){
 const bind=()=>{
   const b=q10("#uParty");if(!b||b.dataset.v10)return;
   b.dataset.v10="1";
   b.onclick=e=>{
     e.preventDefault();
     if(closeModalByHint10(["studio party","colaboração em tempo real"]))return;
     try{window.StudioLiteParty?.open?.()}catch(err){console.error(err);toast("Não foi possível abrir a Party")}
   };
 };
 bind();
 new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
}

const normalizeNode10=n=>{
 const d=Object.assign({
   id:uid(),name:"Object",type:"Part",position:[0,0,0],rotation:[0,0,0],size:[1,1,1],
   color:"#777",material:"Plastic",shape:"box",anchored:true,canCollide:true,
   transparency:0,locked:false,visible:true,parent:null,script:"",language:"luau"
 },n||{});
 d.id=d.id||uid();
 d.name=String(d.name||"Object").slice(0,100);
 d.type=String(d.type||"Part");
 if(!typeInfo10(d.type)&&!/^[A-Za-z][A-Za-z0-9_]*$/.test(d.type))d.type="Part";
 d.position=Array.isArray(d.position)?d.position.slice(0,3).map(v=>Number(v)||0):[0,0,0];
 d.rotation=Array.isArray(d.rotation)?d.rotation.slice(0,3).map(v=>Number(v)||0):[0,0,0];
 d.size=Array.isArray(d.size)?d.size.slice(0,3).map(v=>Math.max(.1,Math.abs(Number(v)||1))):[1,1,1];
 d.transparency=Math.max(0,Math.min(1,Number(d.transparency)||0));
 d.visible=d.visible!==false;d.anchored=d.anchored!==false;d.canCollide=d.canCollide!==false;d.locked=!!d.locked;d.parent=d.parent||null;
 d.shape=d.shape||({Sphere:"sphere",Cylinder:"cylinder",Wedge:"wedge"}[d.type]||"box");
 if(scriptTypes10.has(d.type)){d.script=String(d.script??templates10[d.type]);d.language=d.language&&CODE_LANGUAGES[d.language]?d.language:"luau"}
 return d;
};
normalizeNode=normalizeNode10;

try{
 const raw=JSON.parse(localStorage.getItem("studio-lite-v4")||"{}");
 if(Array.isArray(raw.nodes)&&raw.nodes.length){
   S.nodes=raw.nodes.map(normalizeNode10);
   const selected=S.nodes.find(n=>n.id===S.selected)||S.nodes.find(n=>n.type==="Part")||S.nodes[0];
   S.selected=selected?.id||null;
   S.selectedIds=(S.selectedIds||[]).filter(id=>S.nodes.some(n=>n.id===id));
   if(!S.selectedIds.length&&S.selected)S.selectedIds=[S.selected];
 }
}catch(err){console.warn("V10 project migration",err)}

function createObject10(type){
 type=String(type||"Part");
 const base={id:uid(),name:type,type,position:[0,2,0],rotation:[0,0,0],size:[4,1,4],color:"#3b82f6",material:"Plastic",shape:"box",anchored:true,canCollide:true,transparency:0,locked:false,visible:true,parent:null};
 const preset={
   Part:{size:[4,1,4]},MeshPart:{size:[4,1,4]},UnionOperation:{size:[4,1,4]},SpawnLocation:{size:[2,1,2],color:"#22c55e",material:"Neon"},
   Seat:{size:[2,1,2],color:"#8b5cf6"},VehicleSeat:{size:[2,1,2],color:"#a855f7"},TrussPart:{size:[2,6,2]},
   WedgePart:{size:[4,3,4],shape:"wedge"},CornerWedgePart:{size:[4,3,4],shape:"wedge"},Sphere:{size:[4,4,4],shape:"sphere",color:"#f59e0b"},
   Cylinder:{size:[3,4,3],shape:"cylinder",color:"#06b6d4",material:"Metal"},Folder:{size:[1,1,1],canCollide:false},Model:{size:[1,1,1],canCollide:false},
   Tool:{size:[1,1,1],canCollide:false},Camera:{size:[1,1,1],canCollide:false,visible:false},Attachment:{size:[.4,.4,.4],canCollide:false},
   Terrain:{size:[1,1,1],canCollide:false,visible:false},Decal:{size:[1,1,1],canCollide:false,visible:false},Texture:{size:[1,1,1],canCollide:false,visible:false},
   SurfaceGui:{size:[1,1,1],canCollide:false,visible:false},BillboardGui:{size:[1,1,1],canCollide:false,visible:false}
 };
 Object.assign(base,preset[type]||{});
 if(scriptTypes10.has(type)){base.size=[1,1,1];base.canCollide=false;base.visible=false;base.script=templates10[type];base.language="luau"}
 if(type.endsWith("Value")){base.size=[1,1,1];base.canCollide=false;base.visible=false;base.value=type==="BoolValue"?false:type==="StringValue"?"":0}
 if(["RemoteEvent","RemoteFunction","BindableEvent","BindableFunction"].includes(type)){base.size=[1,1,1];base.canCollide=false;base.visible=false}
 return normalizeNode10(base);
}
function selectedContainer10(){
 const n=cur();
 if(n&&containerTypes10.has(n.type))return n.id;
 if(S.__serviceTarget)return S.__serviceTarget;
 return n?.parent||null;
}
function addRobloxObject10(type){
 const n=createObject10(type);n.parent=selectedContainer10();commit();S.nodes.push(n);S.selected=n.id;S.selectedIds=[n.id];render();save(false);toast(type+" criado");
 if(scriptTypes10.has(type))setTimeout(()=>openScript(n.id),30);
}
addRobloxObject=addRobloxObject10;add=addRobloxObject10;

const expanded10=new Set(["__workspace__"]);
const serviceNames10=Array.isArray(window.ROBLOX_SERVICES)?window.ROBLOX_SERVICES.map(x=>x?.[0]).filter(Boolean):["Lighting","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","ReplicatedFirst"];
const serviceIds10=new Map();
const serviceId10=name=>{if(!serviceIds10.has(name))serviceIds10.set(name,"service:"+name);return serviceIds10.get(name)};
const descendants10=id=>S.nodes.filter(n=>(n.parent||null)===(id||null));
function openExplorerFile10(n){
 if(!n)return;
 if(scriptTypes10.has(n.type)){openScript(n.id);return}
 if(n.type==="Folder"||n.type==="Model"){expanded10.has(n.id)?expanded10.delete(n.id):expanded10.add(n.id);renderTree10();return}
 S.selected=n.id;S.selectedIds=[n.id];render();
}
function rename10(){const n=cur();if(!n)return;openPrompt("Renomear","Novo nome",n.name,v=>{if(v){commit();n.name=v;render();save(false)}})}
rename=rename10;
function renderTree10(){
 const t=q10("#tree");if(!t)return;
 const filter=(q10("#treeSearch")?.value||"").toLowerCase().trim();t.innerHTML="";
 const root=document.createElement("div");root.className="root explorer-root";root.innerHTML='<button class="explorer-expander">⌄</button><b>Workspace</b><span class="type">DataModel</span>';
 root.onclick=()=>{S.__serviceTarget=null;expanded10.has("__workspace__")?expanded10.delete("__workspace__"):expanded10.add("__workspace__");renderTree10()};t.appendChild(root);
 if(expanded10.has("__workspace__")){
   const walk=(parent,depth)=>{
     descendants10(parent).forEach(n=>{
       const children=descendants10(n.id),match=!filter||n.name.toLowerCase().includes(filter)||n.type.toLowerCase().includes(filter),branch=children.length>0;
       if(match){
         const b=document.createElement("div");b.className="tree-row"+(S.selectedIds?.includes(n.id)||S.selected===n.id?" selected":"");b.style.paddingLeft=(7+depth*18)+"px";
         b.innerHTML='<span class="tree-arrow">'+(branch?(expanded10.has(n.id)?"▾":"▸"):"•")+'</span><span>'+esc(icon(n))+'</span><span class="tree-name">'+esc(n.name)+'</span><span class="type">'+esc(n.type)+(n.locked?" 🔒":"")+'</span>';
         b.onclick=e=>{if(e.target.closest(".tree-arrow")&&branch){expanded10.has(n.id)?expanded10.delete(n.id):expanded10.add(n.id);renderTree10();return}proSelect(n.id,e.ctrlKey||e.metaKey||e.shiftKey);render()};
         b.ondblclick=e=>{e.preventDefault();openExplorerFile10(n)};
         b.oncontextmenu=e=>{e.preventDefault();proSelect(n.id);render();toast(scriptTypes10.has(n.type)?"Dê duplo toque para editar o arquivo":"Objeto selecionado")};
         t.appendChild(b);
       }
       if(branch&&expanded10.has(n.id))walk(n.id,depth+1);
     });
   };
   walk(null,0);
 }
 const title=document.createElement("div");title.className="section-title explorer-services-title";title.textContent="SERVIÇOS";t.appendChild(title);
 serviceNames10.forEach(name=>{
   const sid=serviceId10(name),kids=S.nodes.filter(n=>n.parent===sid);
   const b=document.createElement("div");b.className="tree-row service-row";b.style.paddingLeft="7px";
   b.innerHTML='<span class="tree-arrow">'+(expanded10.has(sid)?"▾":"▸")+'</span><span>◆</span><span class="tree-name">'+esc(name)+'</span><span class="type">Service</span>';
   b.onclick=e=>{if(e.target.closest(".tree-arrow")){expanded10.has(sid)?expanded10.delete(sid):expanded10.add(sid);renderTree10();return}S.selected=null;S.selectedIds=[];S.__serviceTarget=sid;render();status(name+" selecionado")};
   b.ondblclick=()=>{expanded10.has(sid)?expanded10.delete(sid):expanded10.add(sid);renderTree10()};
   t.appendChild(b);
   if(expanded10.has(sid))kids.forEach(n=>{const row=document.createElement("div");row.className="tree-row"+(S.selected===n.id?" selected":"");row.style.paddingLeft="25px";row.innerHTML='<span class="tree-arrow">•</span><span>'+esc(icon(n))+'</span><span class="tree-name">'+esc(n.name)+'</span><span class="type">'+esc(n.type)+'</span>';row.onclick=()=>{S.__serviceTarget=null;S.selected=n.id;S.selectedIds=[n.id];render()};row.ondblclick=()=>openExplorerFile10(n);t.appendChild(row)});
 });
 q10("#objectCount").textContent=S.nodes.length+" objetos";
}
tree=renderTree10;

const basePanel10=panel;
panel=function(){
 basePanel10();
 const n=cur(),root=q10("#panel .panel");if(!n||!root)return;
 if(scriptTypes10.has(n.type)){
   root.querySelector("#openAnyScript")?.remove();
   root.querySelectorAll(".file-editor-card").forEach(x=>x.remove());
   const box=document.createElement("div");box.className="file-editor-card";
   box.innerHTML='<div class="section-title">ARQUIVO</div><div class="field"><span>Nome</span><input id="fileName10" value="'+esc(n.name)+'"></div><div class="field"><span>Linguagem</span><select id="fileLang10"><option value="luau">Luau</option><option value="lua">Lua</option></select></div><button id="editFile10" class="wide primary">✎ Editar arquivo</button><button id="duplicateFile10" class="wide">Duplicar arquivo</button>';
   root.appendChild(box);
   q10("#fileName10").onchange=e=>{const v=e.target.value.trim();if(v){commit();n.name=v;render();save(false)}};
   q10("#fileLang10").value=n.language&&CODE_LANGUAGES[n.language]?n.language:"luau";
   q10("#fileLang10").onchange=e=>{commit();n.language=e.target.value;save(false)};
   q10("#editFile10").onclick=()=>openScript(n.id);
   q10("#duplicateFile10").onclick=()=>{const copy=createObject10(n.type);copy.name=n.name+" Copy";copy.script=n.script;copy.language=n.language;copy.parent=n.parent;commit();S.nodes.push(copy);S.selected=copy.id;S.selectedIds=[copy.id];render();save(false);toast("Arquivo duplicado")};
 }
};
function openScript10(id){
 const n=S.nodes.find(x=>x.id===id);if(!n)return;
 if(!scriptTypes10.has(n.type))return toast("Este objeto não é um arquivo de script");
 n.script=String(n.script??templates10[n.type]);n.language=CODE_LANGUAGES[n.language]?n.language:"luau";
 openCodeStudio({node:n,title:n.name,initial:()=>n.script,language:n.language,save:(source,lang)=>{commit();n.script=source;n.language=lang;save();render();toast("Arquivo salvo")}});
}
openScript=openScript10;

if(!q10("#v10Style")){
 const st=document.createElement("style");st.id="v10Style";
 st.textContent=".studio-console{width:min(1050px,100%);height:min(720px,100%);background:#070707;border:1px solid #2d2d2d;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 120px #000}.studio-console-output{flex:1;min-height:0;overflow:auto;padding:10px;background:#050505;font:12px ui-monospace,SFMono-Regular,monospace}.console-line{display:grid;grid-template-columns:75px 58px 1fr;gap:8px;padding:4px 0;border-bottom:1px solid #0e0e0e}.console-line span{color:#444}.console-line b{font-size:9px}.console-line em{font-style:normal;color:#aaa;white-space:pre-wrap;word-break:break-word}.console-error b{color:#f87171}.console-warn b{color:#fbbf24}.console-info b{color:#60a5fa}.console-log b{color:#a3e635}.console-input{display:flex;align-items:center;gap:7px;padding:8px;border-top:1px solid #222;background:#0b0b0b}.console-input input{flex:1!important;width:auto!important;margin:0!important;background:#070707!important}.console-input button{height:38px}.console-head-actions{display:flex;gap:5px}.explorer-root{display:flex;align-items:center;gap:6px;cursor:pointer;padding:7px 8px;border-bottom:1px solid #1b1b1b}.explorer-root .explorer-expander{border:0;background:none;color:#aaa;padding:0;width:18px}.tree-row{display:flex!important;align-items:center;gap:6px;text-align:left!important;width:100%;min-height:29px;padding-top:4px!important;padding-bottom:4px!important}.tree-row .tree-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tree-row .type{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tree-arrow{width:13px;display:inline-block;text-align:center;color:#777;flex:0 0 13px}.service-row{opacity:.9}.explorer-services-title{margin:12px 8px 5px!important}.file-editor-card{margin-top:10px;padding:10px;border:1px solid #222;border-radius:9px;background:#0d0d0d}.file-editor-card .field{margin-bottom:7px}.workspace.inspector-collapsed{grid-template-columns:255px minmax(0,1fr) 0}@media(min-width:851px){.workspace.inspector-collapsed .inspector{width:0;min-width:0;border:0;opacity:0;overflow:hidden;pointer-events:none}}@media(max-width:850px){.tree-row{min-height:34px!important}.file-editor-card button{min-height:42px}}";
 document.head.appendChild(st);
}
bindToggles10();
bindPartyToggle10();
const boot10=()=>{bindToggles10();bindPartyToggle10();renderTree10()};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot10);else setTimeout(boot10,0);
})();

/* ===== STUDIO LITE V11 — PROFESSIONAL HELP / DIAGNOSTICS / SELF TEST ===== */
(()=>{
"use strict";
const q11=s=>document.querySelector(s), qa11=s=>[...document.querySelectorAll(s)];
const esc11=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const checks11=[];
function addCheck11(name,ok,detail){checks11.push({name:name,ok:!!ok,detail:detail||""});return !!ok}
function runSelfTest11(){
 checks11.length=0;
 addCheck11("DOM principal",!!q11("#canvas")&&!!q11("#tree")&&!!q11("#panel"));
 addCheck11("Three.js",typeof window.THREE!=="undefined");
 const hasWebgl=!!q11("#canvas canvas:not(.fallback-canvas)");
 const hasFallback=!!q11("#canvas .fallback-canvas");
 addCheck11("Motor de renderização",hasWebgl||hasFallback,hasWebgl?"WebGL":(hasFallback?"2D compatível":"viewport não inicializada"));
 let stored=null;
 try{stored=JSON.parse(localStorage.getItem("studio-lite-v4")||"null")}catch{}
 addCheck11("Estado do projeto",!!stored&&Array.isArray(stored.nodes),stored&&Array.isArray(stored.nodes)?stored.nodes.length+" objetos salvos":"nenhum projeto salvo");
 const nodes=Array.isArray(stored?.nodes)?stored.nodes:[];
 const ids=new Set(nodes.map(n=>n&&n.id).filter(Boolean));
 const broken=nodes.filter(n=>n&&n.parent&&!ids.has(n.parent));
 addCheck11("Hierarquia",broken.length===0,broken.length?broken.length+" parent(s) inválidos":"Parents válidos");
 const dup=nodes.length-ids.size;
 addCheck11("IDs únicos",dup===0,dup?dup+" duplicado(s)":"OK");
 addCheck11("LocalStorage",(()=>{try{const k="__studio_lite_test__";localStorage.setItem(k,"1");localStorage.removeItem(k);return true}catch{return false}})());
 addCheck11("Code Studio",!!q11("#codeStudioBtn")||!!q11(".code-editor")||typeof window.StudioLiteCode!=="undefined");
 addCheck11("Party",!!window.StudioLiteParty,"Supabase/Realtíme disponível");
 addCheck11("Console",!!window.StudioLiteConsole);
 addCheck11("Exportação",!!q11("#exportBtn")||!!q11("#exportJsonBtn")||!!q11("[data-action='export']"));
 addCheck11("Publicação",!!q11("#publishBtn"));
 return checks11;
}
function diagnostics11(){
 const results=runSelfTest11(),bad=results.filter(x=>!x.ok);
 return {ok:bad.length===0,total:results.length,passed:results.length-bad.length,failed:bad.length,results:results};
}
function openHelp11(tab){
 const old=q11("#studioHelpModal11");if(old){old.remove();return}
 const bg=document.createElement("div");bg.id="studioHelpModal11";bg.className="modal-bg";
 bg.innerHTML='<div class="studio-help11"><div class="modal-head"><div><h2>◈ Studio Lite Central</h2><small class="code-meta">Guia • Diagnóstico • Publicação • Segurança</small></div><div class="help-tabs11"><button data-tab="guide">Guia</button><button data-tab="publish">Publicar</button><button data-tab="security">Chaves</button><button data-tab="diagnostics">Diagnóstico</button><button id="helpClose11">×</button></div></div><div id="helpBody11" class="help-body11"></div></div>';
 document.body.appendChild(bg);
 const body=q11("#helpBody11");
 const render=mode=>{
  qa11(".help-tabs11 [data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===mode));
  if(mode==="diagnostics"){
   const d=diagnostics11();
   body.innerHTML='<div class="health-head11"><div><b>'+(d.ok?"Tudo pronto":"Atenção necessária")+'</b><small>'+d.passed+'/'+d.total+' verificações passaram</small></div><button id="rerun11" class="primary">Executar novamente</button></div><div class="health-list11">'+d.results.map(x=>'<div class="health-row11 '+(x.ok?"ok":"bad")+'"><b>'+(x.ok?"✓":"!")+'</b><span>'+esc11(x.name)+'</span><small>'+esc11(x.detail||"OK")+'</small></div>').join("")+'</div><div class="help-note11">Este diagnóstico é local. Ele valida a aplicação e a configuração disponível no navegador; não substitui um teste real de publicação no Roblox.</div>';
   q11("#rerun11").onclick=()=>render("diagnostics");return;
  }
  if(mode==="publish"){
   body.innerHTML='<div class="guide-grid11"><section><h3>1. Crie o jogo no Roblox</h3><p>Abra o Creator Dashboard, selecione sua experiência e identifique o <b>Universe ID</b> e o <b>Place ID</b>. Universe identifica a experiência; Place identifica o mapa.</p></section><section><h3>2. Crie a chave Open Cloud</h3><p>Nas configurações de segurança/Open Cloud, crie uma API Key com o recurso de publicação de Places necessário. Não salve essa chave nas Environment Variables da Vercel. O Studio Lite usa o modelo de chave por usuário: você cola a sua chave somente no campo de publicação.</p></section><section><h3>3. Publique com segurança</h3><p>No Studio Lite, use <b>RBXL → Roblox</b>, informe Universe ID, Place ID e a chave somente no momento do envio. Não coloque a chave no HTML, app.js, GitHub ou LocalStorage.</p></section><section><h3>4. Se o navegador bloquear</h3><p>O Studio Lite usa uma Vercel Function como proxy. A chave permanece no servidor e o navegador fala apenas com /api/roblox/publish.</p></section></div><div class="help-note11"><b>Importante:</b> o Studio Lite não inventa um RBXL binário válido. Para publicar um Place real, use um arquivo Roblox válido quando o fluxo exigir RBXL.</div>';
   return;
  }
  if(mode==="security"){
   body.innerHTML='<div class="guide-grid11"><section><h3>Roblox Open Cloud API Key</h3><p><b>Nunca</b> salve uma chave permanente no repositório. Para teste direto no navegador, a chave fica somente em memória durante a sessão. No Studio Lite, a chave é enviada somente no POST para a função /api/roblox/publish e não é salva no navegador, GitHub, Supabase ou Environment Variables.</p></section><section><h3>Supabase</h3><p>A chave <b>publishable/anon</b> pode ser usada no frontend quando as tabelas estiverem protegidas por RLS. <b>service_role/secret</b> nunca deve aparecer no frontend, GitHub ou HTML.</p></section><section><h3>Cloudflare</h3><p>Em Pages/Workers, coloque segredos no painel de Variables/Secrets. Não cole segredos em arquivos públicos.</p></section><section><h3>GitHub</h3><p>Pesquise por padrões como <code>API_KEY</code>, <code>service_role</code>, <code>secret</code> e tokens. Se uma chave real vazar, revogue/rotacione imediatamente.</p></section></div><div class="help-note11">Regra simples: tudo que chega ao navegador pode ser visto pelo usuário. Segredo de produção precisa ficar no servidor.</div>';
   return;
  }
  body.innerHTML='<div class="guide-grid11"><section><h3>Editor</h3><p>Use <b>W/E/R</b> para Mover/Rotacionar/Escalar. <b>Ctrl/⌘+Z</b> desfaz, <b>Ctrl/⌘+Shift+Z</b> refaz, <b>Ctrl/⌘+S</b> salva.</p></section><section><h3>Explorer</h3><p>Organize objetos em Models/Folders, use os serviços Roblox e dê duplo toque em Scripts para abrir o Code Studio.</p></section><section><h3>Console</h3><p>Abra <b>⌘ Console</b>. Use <code>help</code>, <code>selftest</code>, <code>objects</code>, <code>selected</code>, <code>validate</code>, <code>save</code>, <code>play</code> e <code>party</code>.</p></section><section><h3>Backup</h3><p>Salve localmente e exporte JSON regularmente antes de alterações grandes.</p></section></div><div class="help-note11">A Central do Studio Lite reúne as informações mais importantes para operar, diagnosticar e publicar o projeto.</div>';
 };
 qa11(".help-tabs11 [data-tab]").forEach(b=>b.onclick=()=>render(b.dataset.tab));
 q11("#helpClose11").onclick=()=>bg.remove();
 bg.addEventListener("click",e=>{if(e.target===bg)bg.remove()});
 render(tab||"guide");
}
function installHelp11(){
 if(q11("#studioHelpBtn11"))return;
 const top=q11(".topbar");if(!top)return;
 const b=document.createElement("button");b.id="studioHelpBtn11";b.className="back-top";b.type="button";b.textContent="? Ajuda";b.title="Central do Studio Lite";b.onclick=()=>openHelp11("guide");top.appendChild(b);
}
window.StudioLiteDiagnostics={run:diagnostics11,openHelp:openHelp11};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installHelp11);else setTimeout(installHelp11,0);
})();

/* ===== STUDIO LITE V11 — CONSOLE SELFTEST COMMAND ===== */
(()=>{
"use strict";
function patchConsole11(){
 const c=window.StudioLiteConsole;if(!c||c.__selfTestV11)return;
 c.__selfTestV11=true;
 const originalOpen=c.open;
 c.open=function(){
  originalOpen?.();
  setTimeout(()=>{
   const input=document.querySelector("#consoleCommand");
   if(!input||input.dataset.selftestV11)return;
   input.dataset.selftestV11="1";
   input.addEventListener("keydown",e=>{
    if(e.key!=="Enter")return;
    const raw=input.value.trim().toLowerCase();
    if(!["selftest","doctor","diagnose"].includes(raw))return;
    e.stopImmediatePropagation();
    const d=window.StudioLiteDiagnostics?.run?.();
    const result=d?(d.ok?"✓ ":"✗ ")+d.passed+"/"+d.total+" verificações passaram"+(d.failed?" • "+d.failed+" falharam":""):"Diagnóstico indisponível";
    const out=document.querySelector("#studioConsoleOutput");
    if(out){const line=document.createElement("div");line.className="console-line console-info";line.innerHTML="<span>"+new Date().toLocaleTimeString()+"</span><b>INFO</b><em>"+result.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))+"</em>";out.appendChild(line);out.scrollTop=out.scrollHeight}
    input.value="";
   },true);
  },50);
 };
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",patchConsole11);else setTimeout(patchConsole11,100);
})();
/* ===== 2D COMPATIBILITY VISIBILITY FIX ===== */
(()=>{const css=document.createElement("style");css.textContent=".compat2d-badge{position:absolute;left:12px;bottom:12px;z-index:8;padding:7px 10px;border:1px solid #2b2b2b;border-radius:8px;background:rgba(5,5,5,.88);color:#9ca3af;font:600 11px ui-monospace,SFMono-Regular,monospace;backdrop-filter:blur(8px);pointer-events:none}.fallback-canvas{display:block;width:100%;height:100%;touch-action:none}";document.head.appendChild(css);})();

/* ===== V15 — FINAL RENDERER / 2D / MOBILE HARDENING ===== */
(()=>{
"use strict";
const q15=s=>document.querySelector(s);
function ensure2D15(){
 const host=q15("#canvas");
 if(!host||typeof initFallbackCanvas!=="function")return false;
 if(!fallbackCanvas||!fallbackCtx)initFallbackCanvas();
 if(fallbackCanvas){
   fallbackCanvas.style.visibility="visible";
   fallbackCanvas.style.display="block";
   fallbackCanvas.style.zIndex="2";
   host.querySelectorAll("canvas").forEach(c=>{if(c!==canvas){c.style.visibility="hidden";c.style.pointerEvents="none"}});
   core.drawFallback?.();
 }
 q15("#engineHud")?.replaceChildren(document.createTextNode("2D COMPAT"));
 q15("#status")?.replaceChildren(document.createTextNode("Modo 2D compatível"));
 q15("#footerStatus")?.replaceChildren(document.createTextNode("Modo 2D compatível"));
 return true;
}
function ensureWebGL15(){
 const host=q15("#canvas"); if(!host)return;
 if(renderer){
   host.querySelectorAll("canvas").forEach(c=>{if(c!==renderer.domElement){c.style.visibility="hidden";c.style.pointerEvents="none"}else{c.style.visibility="visible";c.style.pointerEvents="auto"}});
   renderer.domElement.style.zIndex="1";
   resize?.(); render?.();
 }
 q15("#engineHud")?.replaceChildren(document.createTextNode("WebGL"));
}
function set2D15(){
 localStorage.setItem("studio-lite-universal-v7.mode","2d");
 localStorage.setItem("studio-lite-universal-v6.mode","2d");
 ensure2D15();
 document.querySelectorAll("[data-u7]").forEach(b=>b.classList.toggle("active",b.dataset.u7==="2d"));
 document.querySelectorAll(".u-mode").forEach(b=>b.classList.toggle("active",b.dataset.mode==="2d"));
}
function bind2D15(){
 document.querySelectorAll('[data-u7="2d"],.u-mode[data-mode="2d"]').forEach(b=>{
   if(b.dataset.v15==="1")return;
   b.dataset.v15="1";
   b.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();set2D15()},true);
 });
 const viewport=q15(".viewport");
 if(viewport&&!q15("#v15-2d-badge")){
   const b=document.createElement("div");b.id="v15-2d-badge";b.className="compat2d-badge";b.textContent="2D • COMPATÍVEL";
   b.style.cssText="position:absolute;left:10px;bottom:42px;z-index:9;padding:6px 9px;border:1px solid #303030;border-radius:7px;background:#080808dd;color:#aaa;font:600 10px ui-monospace,monospace;pointer-events:none;display:none";
   viewport.appendChild(b);
 }
 const mode=localStorage.getItem("studio-lite-universal-v7.mode")||localStorage.getItem("studio-lite-universal-v6.mode");
 if(mode==="2d"){setTimeout(()=>{set2D15();const b=q15("#v15-2d-badge");if(b)b.style.display="block"},500)}
}
const oldSetMode7=window.StudioLiteSetMode;
window.StudioLiteSetMode=set2D15;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(bind2D15,50));else setTimeout(bind2D15,50);
new MutationObserver(()=>bind2D15()).observe(document.body,{childList:true,subtree:true});
})();

/* ===== V16 — PROFESSIONAL RECOVERY / MODE CONTROL ===== */
(()=>{
"use strict";
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],core=()=>window.StudioLiteCore;
function mode16(mode){
 mode=String(mode||"auto").toLowerCase();
 try{localStorage.setItem("studio-lite-universal-v7.mode",mode);localStorage.setItem("studio-lite-universal-v6.mode",mode)}catch{}
 const c=core();
 if(mode==="2d"){window.StudioLiteSet2D?.();return true}
 const button=q(`.u-mode[data-mode="${mode}"]`);
 if(button){try{button.click();return true}catch(e){console.warn("mode button",e)}}
 if(mode==="webgl"&&c?.renderer){q("#canvas")?.querySelectorAll("canvas").forEach(x=>{x.style.visibility=x===c.renderer.domElement?"visible":"hidden";x.style.pointerEvents=x===c.renderer.domElement?"auto":"none"});c.resize?.();c.render?.(false)}
 q("#engineHud")?.replaceChildren(document.createTextNode(mode==="css3d"?"3D SAFE":mode==="auto"?"AUTO":"WebGL"));
 qa("[data-u7],.u-mode").forEach(b=>b.classList.toggle("active",(b.dataset.u7||b.dataset.mode)===mode));
 return true;
}
function repair16(){
 const c=core();try{localStorage.removeItem("studio-lite-universal-v7.mode");localStorage.removeItem("studio-lite-universal-v6.mode")}catch{}
 q("#uScene")?.remove();q(".u7-css3d")?.remove();
 if(c?.renderer){q("#canvas")?.querySelectorAll("canvas").forEach(x=>{x.style.visibility=x===c.renderer.domElement?"visible":"hidden";x.style.display="block";x.style.pointerEvents=x===c.renderer.domElement?"auto":"none"});c.resize?.();c.render?.(false);q("#engineHud")?.replaceChildren(document.createTextNode("WebGL"))}
 else if(c){window.StudioLiteSet2D?.()}
 window.StudioLiteConsole?.log?.("Viewport reparada");
 return true;
}
function install16(){
 if(q("#studioProBtn16"))return;
 if(!q("#studioProStyle16")){const st=document.createElement("style");st.id="studioProStyle16";st.textContent=".studio-pro16{width:min(760px,96vw);background:#090909;border:1px solid #303030;border-radius:16px;box-shadow:0 30px 120px #000;padding:18px}.studio-pro16 h2{margin:0}.studio-pro16 small{display:block;color:#666;margin-top:4px}.pro-grid16{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:16px}.pro-grid16 button{min-height:78px;background:#0e0e0e;border:1px solid #252525;border-radius:10px;color:#ddd;padding:10px;text-align:left}.pro-grid16 button:hover{border-color:#555;background:#151515}.pro-grid16 b{display:block}.pro-status16{margin-top:12px;padding:10px;border:1px solid #222;border-radius:8px;color:#888;background:#0d0d0d;font-size:11px}@media(max-width:650px){.pro-grid16{grid-template-columns:repeat(2,1fr)}.studio-pro16{width:100%;height:100%;overflow:auto;border-radius:10px}}";document.head.appendChild(st)}
 const actions=q(".actions");if(!actions)return;
 const b=document.createElement("button");b.id="studioProBtn16";b.type="button";b.textContent="⚡ Pro";b.title="Controles profissionais";actions.insertBefore(b,q("#publishBtn")||null);
 b.onclick=()=>{
  const old=q("#studioPro16");if(old){old.remove();return}
  const bg=document.createElement("div");bg.id="studioPro16";bg.className="modal-bg";
  bg.innerHTML='<div class="studio-pro16"><div class="modal-head"><div><h2>Studio Lite Pro</h2><small>Controle de renderização e recuperação</small></div><button id="proClose16">×</button></div><div class="pro-grid16"><button data-mode="auto"><b>AUTO</b><small>Automático</small></button><button data-mode="webgl"><b>WEBGL</b><small>3D principal</small></button><button data-mode="css3d"><b>3D SAFE</b><small>Compatibilidade</small></button><button data-mode="2d"><b>2D</b><small>Fallback universal</small></button><button id="proRepair16"><b>🛠 Reparar</b><small>Viewport congelada</small></button><button id="proDiag16"><b>✓ Diagnóstico</b><small>Verificar sistema</small></button><button id="proSave16"><b>Salvar</b><small>Backup local</small></button><button id="proParty16"><b>PARTY</b><small>Colaboração</small></button></div><div class="pro-status16" id="proStatus16">Sistema pronto</div></div>';
  document.body.appendChild(bg);
  q("#proClose16").onclick=()=>bg.remove();bg.addEventListener("click",e=>{if(e.target===bg)bg.remove()});
  qa("#studioPro16 [data-mode]").forEach(x=>x.onclick=()=>{mode16(x.dataset.mode);q("#proStatus16").textContent="Modo "+x.dataset.mode.toUpperCase()+" aplicado"});
  q("#proRepair16").onclick=()=>{repair16();q("#proStatus16").textContent="Viewport reparada"};
  q("#proDiag16").onclick=()=>window.StudioLiteDiagnostics?.openHelp?.("diagnostics");
  q("#proSave16").onclick=()=>{core()?.save?.();q("#proStatus16").textContent="Projeto salvo localmente"};
  q("#proParty16").onclick=()=>window.StudioLiteParty?.open?.();
 };
}
function boot16(){
 install16();window.StudioLitePro={mode:mode16,repair:repair16};
 try{const mode=localStorage.getItem("studio-lite-universal-v7.mode");if(mode==="2d")setTimeout(()=>mode16("2d"),120)}catch{}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot16);else setTimeout(boot16,100);
})();

/* ===== STUDIO LITE PRO TOOLKIT — 90 SAFE FUNCTIONS ===== */
(()=>{
"use strict";
const C=()=>window.StudioLiteCore||{}, S=()=>C().S, toast=t=>window.StudioLiteConsole?.log?.("[Pro] "+t);
const safe=(fn,fallback=null)=>{try{return fn()}catch(e){toast("Erro controlado: "+(e?.message||e));return fallback}};
const $=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
const F={
  getState:()=>safe(()=>S()),
  getSelected:()=>safe(()=>{const s=S();return s?.nodes?.find?.(n=>n.id===s.selected)||null}),
  select:id=>safe(()=>{const s=S();if(!s)return false;s.selected=id;C().render?.();return true}),
  clearSelection:()=>safe(()=>{const s=S();if(!s)return false;s.selected=null;C().render?.();return true}),
  getObjectCount:()=>safe(()=>S()?.nodes?.length||0,0),
  getObjectById:id=>safe(()=>S()?.nodes?.find?.(n=>n.id===id)||null),
  getChildren:id=>safe(()=>S()?.nodes?.filter?.(n=>n.parent===id)||[],[]),
  getRoots:()=>safe(()=>S()?.nodes?.filter?.(n=>!n.parent)||[],[]),
  setProjectName:n=>safe(()=>{const s=S();if(!s)return false;s.project=String(n||"Untitled");C().save?.(false);return true}),
  getProjectName:()=>safe(()=>S()?.project||"Untitled"),
  setGridSize:n=>safe(()=>{const s=S();s.grid=Math.max(.05,Number(n)||1);C().render?.();return s.grid}),
  getGridSize:()=>safe(()=>Number(S()?.grid)||1,1),
  setSnapSize:n=>safe(()=>{const s=S();s.snap=Math.max(.01,Number(n)||.25);C().save?.(false);return s.snap}),
  toggleGrid:()=>safe(()=>{C().toggleGrid?.();return true}),
  saveProject:()=>safe(()=>{C().save?.(true);return true}),
  undo:()=>safe(()=>{C().undo?.();return true}),
  redo:()=>safe(()=>{C().redo?.();return true}),
  duplicateSelected:()=>safe(()=>{C().duplicate?.();return true}),
  deleteSelected:()=>safe(()=>{C().remove?.();return true}),
  renameSelected:n=>safe(()=>{C().rename?.(String(n||"Object"));return true}),
  focusSelected:()=>safe(()=>{C().focus?.();return true}),
  topView:()=>safe(()=>{C().view?.("top");return true}),
  frontView:()=>safe(()=>{C().view?.("front");return true}),
  rightView:()=>safe(()=>{C().view?.("right");return true}),
  resetView:()=>safe(()=>{C().view?.("home");return true}),
  setTool:t=>safe(()=>{C().setTool?.(t);return true}),
  play:()=>safe(()=>{document.querySelector("#playBtn")?.click();return true}),
  stop:()=>safe(()=>{if(document.querySelector("#playBadge.on"))document.querySelector("#playBtn")?.click();return true}),
  screenshot:()=>safe(()=>{C().screenshot?.();return true}),
  newProject:()=>safe(()=>{C().newProject?.();return true}),
  openCommandPalette:()=>safe(()=>{C().commandPalette?.();return true}),
  openParty:()=>safe(()=>window.StudioLiteParty?.open?.()||false),
  openConsole:()=>safe(()=>window.StudioLiteConsole?.open?.()||false),
  clearConsole:()=>safe(()=>window.StudioLiteConsole?.clear?.()||false),
  runDiagnostics:()=>safe(()=>window.StudioLiteDiagnostics?.run?.()||null),
  openHelp:tab=>safe(()=>window.StudioLiteDiagnostics?.openHelp?.(tab)||false),
  set2D:()=>safe(()=>window.StudioLiteSet2D?.()||false),
  repairViewport:()=>safe(()=>window.StudioLitePro?.repair?.()||false),
  setRenderMode:m=>safe(()=>window.StudioLitePro?.mode?.(m)||false),
  getRenderMode:()=>safe(()=>localStorage.getItem("studio-lite-universal-v7.mode")||"auto"),
  exportJSON:()=>safe(()=>C().exportProject?.()||false),
  importJSONText:t=>safe(()=>{const f=new File([String(t)],"project.json",{type:"application/json"});return f}),
  validateProject:()=>safe(()=>{const s=S();return !!s?.nodes?.every?.(n=>n&&n.id&&n.type)}),
  countType:t=>safe(()=>S()?.nodes?.filter?.(n=>n.type===t).length||0,0),
  listTypes:()=>safe(()=>[...new Set((S()?.nodes||[]).map(n=>n.type))],[]),
  listNames:()=>safe(()=>[...(S()?.nodes||[])].map(n=>n.name||n.type),[]),
  setSelectedVisible:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.visible=!!v;C().render?.();C().save?.(false);return true}),
  setSelectedLocked:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.locked=!!v;C().save?.(false);return true}),
  setSelectedAnchored:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.anchored=!!v;C().save?.(false);return true}),
  setSelectedCanCollide:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.canCollide=!!v;C().save?.(false);return true}),
  setSelectedTransparency:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.transparency=Math.max(0,Math.min(1,Number(v)||0));C().render?.();C().save?.(false);return true}),
  setSelectedMaterial:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.material=String(v||"Plastic");C().render?.();C().save?.(false);return true}),
  setSelectedColor:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.color=String(v||"#ffffff");C().render?.();C().save?.(false);return true}),
  setSelectedPosition:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.position={x:Number(v?.x)||0,y:Number(v?.y)||0,z:Number(v?.z)||0};C().render?.();C().save?.(false);return true}),
  setSelectedRotation:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.rotation={x:Number(v?.x)||0,y:Number(v?.y)||0,z:Number(v?.z)||0};C().render?.();C().save?.(false);return true}),
  setSelectedSize:v=>safe(()=>{const n=F.getSelected();if(!n)return false;n.size={x:Math.max(.05,Number(v?.x)||1),y:Math.max(.05,Number(v?.y)||1),z:Math.max(.05,Number(v?.z)||1)};C().render?.();C().save?.(false);return true}),
  moveSelected:d=>safe(()=>{const n=F.getSelected();if(!n)return false;n.position??={x:0,y:0,z:0};n.position.x+=(Number(d?.x)||0);n.position.y+=(Number(d?.y)||0);n.position.z+=(Number(d?.z)||0);C().render?.();C().save?.(false);return true}),
  rotateSelected:d=>safe(()=>{const n=F.getSelected();if(!n)return false;n.rotation??={x:0,y:0,z:0};n.rotation.x+=(Number(d?.x)||0);n.rotation.y+=(Number(d?.y)||0);n.rotation.z+=(Number(d?.z)||0);C().render?.();C().save?.(false);return true}),
  scaleSelected:d=>safe(()=>{const n=F.getSelected();if(!n)return false;n.size??={x:1,y:1,z:1};n.size.x=Math.max(.05,n.size.x*(Number(d?.x)||1));n.size.y=Math.max(.05,n.size.y*(Number(d?.y)||1));n.size.z=Math.max(.05,n.size.z*(Number(d?.z)||1));C().render?.();C().save?.(false);return true}),
  getTree:()=>safe(()=>{const nodes=S()?.nodes||[];const walk=(parent=null)=>nodes.filter(n=>(n.parent||null)===parent).map(n=>({...n,children:walk(n.id)}));return walk(null)},[]),
  flattenTree:()=>safe(()=>F.getTree().flatMap(function walk(n){return n.flatMap(x=>[x,...walk(x.children||[])] )}),[]),
  orphanCount:()=>safe(()=>{const nodes=S()?.nodes||[],ids=new Set(nodes.map(n=>n.id));return nodes.filter(n=>n.parent&&!ids.has(n.parent)).length},0),
  duplicateIdCount:()=>safe(()=>{const a=S()?.nodes||[],m=new Map();a.forEach(n=>m.set(n.id,(m.get(n.id)||0)+1));return [...m.values()].filter(x=>x>1).length},0),
  repairHierarchy:()=>safe(()=>{const s=S();if(!s)return false;const ids=new Set(s.nodes.map(n=>n.id));s.nodes.forEach(n=>{if(n.parent&&!ids.has(n.parent))n.parent=null});C().save?.(false);C().render?.();return true}),
  centerSelected:()=>safe(()=>{const n=F.getSelected();if(!n)return false;n.position={x:0,y:0,z:0};C().render?.();return true}),
  resetSelectedTransform:()=>safe(()=>{const n=F.getSelected();if(!n)return false;n.position={x:0,y:0,z:0};n.rotation={x:0,y:0,z:0};n.size={x:1,y:1,z:1};C().render?.();return true}),
  selectFirst:()=>safe(()=>{const n=S()?.nodes?.[0];return n?F.select(n.id):false}),
  selectLast:()=>safe(()=>{const a=S()?.nodes||[],n=a[a.length-1];return n?F.select(n.id):false}),
  selectByType:t=>safe(()=>{const n=S()?.nodes?.find?.(x=>x.type===t);return n?F.select(n.id):false}),
  selectByName:t=>safe(()=>{const n=S()?.nodes?.find?.(x=>String(x.name).toLowerCase()===String(t).toLowerCase());return n?F.select(n.id):false}),
  searchObjects:t=>safe(()=>{const x=String(t||"").toLowerCase();return(S()?.nodes||[]).filter(n=>String(n.name||"").toLowerCase().includes(x)||String(n.type||"").toLowerCase().includes(x))},[]),
  projectStats:()=>safe(()=>{const a=S()?.nodes||[];return{objects:a.length,types:F.listTypes().length,scripts:a.filter(n=>/script/i.test(n.type||"")).length,models:a.filter(n=>n.type==="Model").length,folders:a.filter(n=>n.type==="Folder").length,orphans:F.orphanCount()}},{}),
  setAutoSave:v=>safe(()=>{const s=S();if(!s)return false;s.settings??={};s.settings.autosave=!!v;C().save?.(false);return true}),
  getSettings:()=>safe(()=>({...S()?.settings}),{}),
  setSetting:(k,v)=>safe(()=>{const s=S();s.settings??={};s.settings[k]=v;C().save?.(false);return true}),
  getSetting:k=>safe(()=>S()?.settings?.[k]),
  copySelected:()=>safe(()=>{document.execCommand?.("copy");return true}),
  focusExplorer:()=>safe(()=>{$("#explorerSearch")?.focus();return true}),
  focusCode:()=>safe(()=>{$(".file-editor-card textarea,textarea")?.focus();return true}),
  closeTopModal:()=>safe(()=>{const m=all("#modalRoot .modal-bg").at(-1);if(m){m.remove();return true}return false}),
  closeAllModals:()=>safe(()=>{all("#modalRoot .modal-bg").forEach(x=>x.remove());all(".modal-bg").forEach(x=>{if(x.id!=="studioPro16")x.remove()});return true}),
  isWebGL:()=>safe(()=>!!C().renderer,false),
  is2D:()=>safe(()=>getComputedStyle(C().fallbackCanvas||document.body).visibility!=="hidden"&&!!C().fallbackCanvas,false),
  memorySnapshot:()=>safe(()=>({localStorageBytes:Object.values(localStorage).join("").length,objects:F.getObjectCount(),history:S()?.history?.length||0}),{}),
  healthScore:()=>safe(()=>{const d=F.runDiagnostics();return d?Math.round((d.passed/d.total)*100):0},0),
  ping:()=>true,
  version:()=> "Studio Lite Pro Toolkit 1.0",
  resetMode:()=>safe(()=>F.setRenderMode("auto")),
  mobilePanels:()=>safe(()=>{document.querySelector("#explorerBtn")?.click();document.querySelector("#inspectorBtn")?.click();return true}),
  toggleFullscreen:()=>safe(()=>{document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();return true}),
  exportStats:()=>safe(()=>JSON.stringify(F.projectStats(),null,2)),
  audit:()=>safe(()=>({valid:F.validateProject(),orphans:F.orphanCount(),duplicateIds:F.duplicateIdCount(),stats:F.projectStats()}),{}),
  safeRender:()=>safe(()=>{C().resize?.();C().render?.(false);return true}),
  safeSave:()=>safe(()=>{C().save?.(false);return true}),
  emergencyRepair:()=>safe(()=>{F.repairHierarchy();F.resetMode();return F.safeRender()}),
  help:()=>Object.keys(F),
  noop:()=>true
};
window.StudioLiteProTools=F;
window.StudioLiteAPI={...F};
})();
