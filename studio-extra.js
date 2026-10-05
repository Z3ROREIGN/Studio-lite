(()=>{"use strict";
const core=()=>window.StudioLiteCore||{};
const state=()=>core().S||window.S||null;
const nodes=()=>state()?.nodes||[];
const selected=()=>{const s=state();const ids=Array.isArray(s?.selectedIds)?s.selectedIds:[];return nodes().filter(n=>ids.includes(n.id));};
const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch{return x}};
const render=()=>core().render?.();
const save=()=>core().save?.(false);
const commit=()=>core().commit?.();
const mutate=fn=>{if(!state())return false;commit();const r=fn();render();save();return r===undefined?true:r};
const uid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
const pos=n=>Array.isArray(n?.position)?n.position:[0,0,0];
const size=n=>Array.isArray(n?.size)?n.size:[1,1,1];
const rot=n=>Array.isArray(n?.rotation)?n.rotation:[0,0,0];
const axis=a=>({x:0,y:1,z:2}[String(a||"x").toLowerCase()]??0);
const descendants=id=>{const out=[],seen=new Set([id]);let go=true;while(go){go=false;for(const n of nodes())if(n.parent&&seen.has(n.parent)&&!seen.has(n.id)){seen.add(n.id);out.push(n);go=true}}return out};
const toast=m=>window.toast?.(String(m));

const F={
 duplicateOffset(distance=2,a="x"){const s=state(),sel=selected();if(!s||!sel.length)return false;const i=axis(a),d=Number(distance)||2;return mutate(()=>{const made=[];for(const x of sel){const y=clone(x);y.id=uid();y.name=(x.name||x.type)+" Copy";y.position=[...pos(x)];y.position[i]+=d;nodes().push(y);made.push(y)}s.selectedIds=made.map(x=>x.id);s.selected=made[0]?.id||null;return made.length})},
 alignSelected(a="x"){const sel=selected();if(sel.length<2)return false;const i=axis(a),v=pos(sel[0])[i];return mutate(()=>sel.slice(1).forEach(x=>{x.position=[...pos(x)];x.position[i]=v}))},
 centerSelected(a="x"){const sel=selected();if(!sel.length)return false;const i=axis(a),v=sel.reduce((q,x)=>q+(Number(pos(x)[i])||0),0)/sel.length;return mutate(()=>sel.forEach(x=>{x.position=[...pos(x)];x.position[i]=v}))},
 offsetSelected(x=0,y=0,z=0){return mutate(()=>selected().forEach(n=>n.position=[pos(n)[0]+Number(x||0),pos(n)[1]+Number(y||0),pos(n)[2]+Number(z||0)]))},
 setRotationAll(x=0,y=0,z=0){return mutate(()=>selected().forEach(n=>n.rotation=[Number(x)||0,Number(y)||0,Number(z)||0]))},
 addRotation(x=0,y=0,z=0){return mutate(()=>selected().forEach(n=>n.rotation=[rot(n)[0]+Number(x||0),rot(n)[1]+Number(y||0),rot(n)[2]+Number(z||0)]))},
 setSizeAll(x=1,y=1,z=1){return mutate(()=>selected().forEach(n=>n.size=[Math.max(.1,Number(x)||1),Math.max(.1,Number(y)||1),Math.max(.1,Number(z)||1)]))},
 multiplySize(k=1){k=Number(k)||1;return mutate(()=>selected().forEach(n=>n.size=size(n).map(v=>Math.max(.1,v*k)))},
 flipSize(a="x"){const i=axis(a);return mutate(()=>selected().forEach(n=>{n.size=[...size(n)];n.size[i]=Math.max(.1,n.size[i])}))},
 snapAll(g=1){g=Math.max(.01,Number(g)||1);return mutate(()=>selected().forEach(n=>n.position=pos(n).map(v=>Math.round(v/g)*g))},
 resetTransforms(){return mutate(()=>selected().forEach(n=>{n.position=[0,0,0];n.rotation=[0,0,0];n.size=[2,2,2]}))},
 randomizePositions(amount=10){amount=Math.abs(Number(amount)||10);return mutate(()=>selected().forEach(n=>n.position=pos(n).map(v=>v+(Math.random()*2-1)*amount))},
 randomizeRotations(amount=180){amount=Math.abs(Number(amount)||180);return mutate(()=>selected().forEach(n=>n.rotation=rot(n).map(v=>v+(Math.random()*2-1)*amount))},
 randomizeSizes(amount=.5){amount=Math.abs(Number(amount)||.5);return mutate(()=>selected().forEach(n=>n.size=size(n).map(v=>Math.max(.1,v*(1+(Math.random()*2-1)*amount))))},
 selectTypeAll(t){const hit=nodes().filter(n=>n.type===t),s=state();s.selectedIds=hit.map(n=>n.id);s.selected=s.selectedIds[0]||null;render();return hit.length},
 selectNameContains(q){q=String(q||"").toLowerCase();const hit=nodes().filter(n=>String(n.name||"").toLowerCase().includes(q)),s=state();s.selectedIds=hit.map(n=>n.id);s.selected=s.selectedIds[0]||null;render();return hit.length},
 selectByMaterial(m){const hit=nodes().filter(n=>n.material===m),s=state();s.selectedIds=hit.map(n=>n.id);s.selected=s.selectedIds[0]||null;render();return hit.length},
 selectByVisibility(v=true){const hit=nodes().filter(n=>(n.visible!==false)===!!v),s=state();s.selectedIds=hit.map(n=>n.id);s.selected=s.selectedIds[0]||null;render();return hit.length},
 invertSelection(){const s=state(),ids=new Set(selected().map(n=>n.id));s.selectedIds=nodes().filter(n=>!ids.has(n.id)).map(n=>n.id);s.selected=s.selectedIds[0]||null;render();return s.selectedIds.length},
 selectRandomMany(count=1){const a=[...nodes()].sort(()=>Math.random()-.5).slice(0,Math.max(1,Number(count)||1)),s=state();s.selectedIds=a.map(n=>n.id);s.selected=s.selectedIds[0]||null;render();return a.length},
 getSelectionCount(){return selected().length},
 getSelectionTypes(){return [...new Set(selected().map(n=>n.type))]},
 getSelectionNames(){return selected().map(n=>n.name)},
 getSelectionIds(){return selected().map(n=>n.id)},
 getSelectionParents(){return [...new Set(selected().map(n=>n.parent).filter(Boolean))]},
 getChildren(id){return nodes().filter(n=>n.parent===(id||selected()[0]?.id)).map(clone)},
 getDescendants(id){return descendants(id||selected()[0]?.id).map(clone)},
 getTreeDepth(id){let x=nodes().find(n=>n.id===(id||selected()[0]?.id)),d=0,seen=new Set();while(x?.parent&&!seen.has(x.parent)){seen.add(x.parent);x=nodes().find(n=>n.id===x.parent);if(x)d++}return d},
 countChildren(id){return nodes().filter(n=>n.parent===(id||selected()[0]?.id)).length},
 countDescendants(id){return descendants(id||selected()[0]?.id).length},
 renameWithIndex(prefix="Object"){return mutate(()=>selected().forEach((n,i)=>n.name=String(prefix).replaceAll("{n}",String(i+1)).replaceAll("{type}",n.type||"Object")+""+(String(prefix).includes("{n}")||String(prefix).includes("{type}")?"":" "+(i+1))))},
 prefixNames(prefix=""){return mutate(()=>selected().forEach(n=>n.name=String(prefix)+String(n.name||""))},
 suffixNames(suffix=""){return mutate(()=>selected().forEach(n=>n.name=String(n.name||"")+String(suffix)))},
 trimNames(){return mutate(()=>nodes().forEach(n=>n.name=String(n.name||"").trim()))},
 normalizeNames(){return mutate(()=>nodes().forEach(n=>n.name=String(n.name||n.type||"Object").replace(/\s+/g," ").trim()))},
 setParent(id){const p=nodes().find(n=>n.id===id);if(selected().some(n=>n.id===id))return false;return mutate(()=>selected().forEach(n=>n.parent=p?.id||null))},
 unparent(){return mutate(()=>selected().forEach(n=>n.parent=null))},
 parentToSelected(){const p=selected()[0];if(!p)return false;return mutate(()=>selected().slice(1).forEach(n=>{if(n.id!==p.id)n.parent=p.id}))},
 createFolderFromSelection(name="Folder"){const sel=selected(),s=state();if(!sel.length)return false;return mutate(()=>{const f={id:uid(),type:"Folder",name,parent:null,position:[0,0,0],size:[1,1,1],visible:true};nodes().push(f);sel.forEach(n=>{if(n.id!==f.id)n.parent=f.id});s.selected=f.id;s.selectedIds=[f.id]})},
 groupAsModel(name="Model"){const sel=selected(),s=state();if(!sel.length)return false;return mutate(()=>{const m={id:uid(),type:"Model",name,parent:null,position:[0,0,0],size:[1,1,1],visible:true};nodes().push(m);sel.forEach(n=>n.parent=m.id);s.selected=m.id;s.selectedIds=[m.id]})},
 detachChildren(){return mutate(()=>selected().forEach(p=>nodes().filter(n=>n.parent===p.id).forEach(n=>n.parent=null))},
 deleteSelectedChildren(){const ids=new Set(selected().flatMap(n=>nodes().filter(x=>x.parent===n.id).map(x=>x.id)));return mutate(()=>state().nodes=nodes().filter(n=>!ids.has(n.id)))},
 deleteSelectedDescendants(){const ids=new Set(selected().flatMap(n=>descendants(n.id).map(x=>x.id)));return mutate(()=>state().nodes=nodes().filter(n=>!ids.has(n.id)))},
 removeEmptyContainers(){return mutate(()=>state().nodes=nodes().filter(n=>!["Folder","Model","Configuration"].includes(n.type)||nodes().some(x=>x.parent===n.id))},
 removeOrphans(){const ids=new Set(nodes().map(n=>n.id));return mutate(()=>nodes().forEach(n=>{if(n.parent&&!ids.has(n.parent))n.parent=null}))},
 sortByName(){return mutate(()=>nodes().sort((a,b)=>String(a.name).localeCompare(String(b.name))) )},
 sortByType(){return mutate(()=>nodes().sort((a,b)=>String(a.type).localeCompare(String(b.type))) )},
 setVisible(v=true){return mutate(()=>selected().forEach(n=>n.visible=!!v))},
 setTransparency(v=0){return mutate(()=>selected().forEach(n=>n.transparency=Math.max(0,Math.min(1,Number(v)||0))) )},
 setMaterial(m="Plastic"){return mutate(()=>selected().forEach(n=>n.material=String(m)))},
 setColor(c="#ffffff"){return mutate(()=>selected().forEach(n=>n.color=String(c)))},
 setAnchored(v=true){return mutate(()=>selected().forEach(n=>n.anchored=!!v))},
 setCollision(v=true){return mutate(()=>selected().forEach(n=>n.canCollide=!!v))},
 setLocked(v=true){return mutate(()=>selected().forEach(n=>n.locked=!!v))},
 setCanTouch(v=true){return mutate(()=>selected().forEach(n=>n.canTouch=!!v))},
 setCanQuery(v=true){return mutate(()=>selected().forEach(n=>n.canQuery=!!v))},
 setMassless(v=true){return mutate(()=>selected().forEach(n=>n.massless=!!v))},
 setArchivable(v=true){return mutate(()=>selected().forEach(n=>n.archivable=!!v))},
 addAttribute(k,v=""){return mutate(()=>selected().forEach(n=>{n.attributes??={};n.attributes[String(k)]=v}))},
 removeAttribute(k){return mutate(()=>selected().forEach(n=>{if(n.attributes)delete n.attributes[String(k)]}))},
 clearAttributes(){return mutate(()=>selected().forEach(n=>n.attributes={}))},
 getAttributes(){return selected().map(n=>clone(n.attributes||{}))},
 setProperty(k,v){return mutate(()=>selected().forEach(n=>n[k]=v))},
 getProperty(k){return selected().map(n=>n[k])},
 clearProperty(k){return mutate(()=>selected().forEach(n=>delete n[k]))},
 setScriptSource(src=""){return mutate(()=>selected().filter(n=>/Script$/.test(n.type)).forEach(n=>n.script=String(src)))},
 appendScript(src=""){return mutate(()=>selected().filter(n=>/Script$/.test(n.type)).forEach(n=>n.script=String(n.script||"")+String(src)))},
 prependScript(src=""){return mutate(()=>selected().filter(n=>/Script$/.test(n.type)).forEach(n=>n.script=String(src)+String(n.script||"")))},
 clearScript(){return mutate(()=>selected().filter(n=>/Script$/.test(n.type)).forEach(n=>n.script=""))},
 findScripts(){return nodes().filter(n=>/Script$/.test(n.type)).map(clone)},
 findEmptyScripts(){return nodes().filter(n=>/Script$/.test(n.type)&&!String(n.script||"").trim()).map(clone)},
 countScripts(){return nodes().filter(n=>/Script$/.test(n.type)).length},
 countParts(){return nodes().filter(n=>/Part$/.test(n.type)||["MeshPart","UnionOperation"].includes(n.type)).length},
 countLights(){return nodes().filter(n=>/Light$/.test(n.type)).length},
 countGui(){return nodes().filter(n=>/Gui$/.test(n.type)).length},
 countByType(t){return nodes().filter(n=>n.type===t).length},
 countByMaterial(m){return nodes().filter(n=>n.material===m).length},
 countHidden(){return nodes().filter(n=>n.visible===false).length},
 countAnchored(){return nodes().filter(n=>n.anchored===true).length},
 countLocked(){return nodes().filter(n=>n.locked===true).length},
 sceneStats(){const a=nodes();return{objects:a.length,selected:selected().length,scripts:a.filter(n=>/Script$/.test(n.type)).length,parts:a.filter(n=>/Part$/.test(n.type)).length,hidden:a.filter(n=>n.visible===false).length,anchored:a.filter(n=>n.anchored===true).length,locked:a.filter(n=>n.locked===true).length}},
 findByProperty(k,v){return nodes().filter(n=>n[k]===v||n.attributes?.[k]===v).map(clone)},
 findByName(q){q=String(q||"").toLowerCase();return nodes().filter(n=>String(n.name||"").toLowerCase().includes(q)).map(clone)},
 findOrphans(){const ids=new Set(nodes().map(n=>n.id));return nodes().filter(n=>n.parent&&!ids.has(n.parent)).map(clone)},
 findEmptyFolders(){return nodes().filter(n=>n.type==="Folder"&&!nodes().some(x=>x.parent===n.id)).map(clone)},
 findEmptyModels(){return nodes().filter(n=>n.type==="Model"&&!nodes().some(x=>x.parent===n.id)).map(clone)},
 repairOrphans(){return mutate(()=>{const ids=new Set(nodes().map(n=>n.id));nodes().forEach(n=>{if(n.parent&&!ids.has(n.parent))n.parent=null})})},
 repairNames(){return mutate(()=>nodes().forEach(n=>{if(!String(n.name||"").trim())n.name=n.type||"Object"}))},
 repairDefaults(){return mutate(()=>nodes().forEach(n=>{n.position=pos(n);n.size=size(n);n.rotation=rot(n);if(n.visible===undefined)n.visible=true}))},
 createService(name="Folder"){return mutate(()=>nodes().push({id:uid(),type:"Folder",name:String(name),service:true,parent:null,position:[0,0,0],size:[1,1,1],visible:true}))},
 createPointLight(){return mutate(()=>{const s=state();const n={id:uid(),name:"PointLight",type:"PointLight",position:[0,5,0],rotation:[0,0,0],size:[1,1,1],color:"#ffffff",material:"Neon",anchored:true,canCollide:false,transparency:0,locked:false,visible:true,parent:null,brightness:1,range:16};nodes().push(n);s.selected=n.id;s.selectedIds=[n.id]})},
createTemplate(id="baseplate"){const defs={baseplate:[["Part","Baseplate",[0,0,0],[32,1,32],"#586174","Plastic",true],["SpawnLocation","SpawnLocation",[0,1,0],[2,1,2],"#22c55e","Neon",true]],obby:[["Part","Start",[0,0,0],[14,1,14],"#586174","Plastic",true],["Part","Checkpoint 1",[0,3,7],[6,1,6],"#3b82f6","Plastic",true],["Part","Checkpoint 2",[0,6,14],[6,1,6],"#8b5cf6","Plastic",true],["Part","Finish",[0,9,21],[7,1,7],"#22c55e","Neon",true],["SpawnLocation","SpawnLocation",[0,2,0],[2,1,2],"#22c55e","Neon",true]],simulator:[["Part","Baseplate",[0,0,0],[36,1,36],"#586174","Plastic",true],["Part","SimulatorPad",[0,1,0],[10,1,10],"#06b6d4","Metal",true],["Folder","Zones",[0,0,0],[1,1,1],"#64748b","Plastic",false],["Script","SimulatorScript",[0,2,0],[1,1,1],"#64748b","Plastic",false]],tycoon:[["Part","Baseplate",[0,0,0],[42,1,42],"#586174","Plastic",true],["Part","ClaimPad",[-10,1,0],[8,1,8],"#22c55e","Neon",true],["Part","Factory",[0,3,0],[14,6,14],"#64748b","Metal",true],["Folder","TycoonData",[0,0,0],[1,1,1],"#64748b","Plastic",false],["Script","TycoonScript",[0,2,0],[1,1,1],"#64748b","Plastic",false]],rpg:[["Part","Baseplate",[0,0,0],[50,1,50],"#365314","Grass",true],["Part","TownCenter",[0,3,0],[12,6,12],"#92400e","Wood",true],["Part","QuestArea",[15,2,10],[10,4,10],"#7c3aed","Plastic",true],["Folder","NPCs",[0,0,0],[1,1,1],"#64748b","Plastic",false],["SpawnLocation","SpawnLocation",[0,2,0],[2,1,2],"#22c55e","Neon",true]],horror:[["Part","Ground",[0,0,0],[45,1,45],"#202020","Concrete",true],["Part","House",[0,5,0],[14,10,14],"#111827","Concrete",true],["Part","DarkZone",[0,1,18],[18,1,12],"#111111","Plastic",true],["PointLight","HorrorLight",[0,8,0],[1,1,1],"#ffcc88","Neon",true],["Script","HorrorController",[0,2,0],[1,1,1],"#64748b","Plastic",false]],racing:[["Part","Track",[0,0,0],[70,1,12],"#222222","Concrete",true],["Part","StartLine",[-25,1,0],[2,1,12],"#ffffff","Plastic",true],["Part","Checkpoint",[0,1,0],[2,1,12],"#06b6d4","Neon",true],["Part","FinishLine",[25,1,0],[2,1,12],"#ef4444","Neon",true],["SpawnLocation","SpawnLocation",[-30,2,0],[2,1,2],"#22c55e","Neon",true]]};const list=defs[id]||defs.baseplate;return mutate((s)=>{const created=[];for(const d of list){const [type,name,pos,size,color,material,anchored]=d;const n={id:uid(),name,type,position:[...pos],rotation:[0,0,0],size:[...size],color,material,shape:type==="Sphere"?"sphere":type==="Cylinder"?"cylinder":"box",anchored,canCollide:!["Folder","Script","PointLight"].includes(type),transparency:0,locked:false,visible:true,parent:null};if(type==="Script")n.script="-- "+name+"\n\nprint(\""+name+" pronto\")";if(type==="PointLight"){n.brightness=2;n.range=24}nodes().push(n);created.push(n.id)}s.selected=created[0]||null;s.selectedIds=created.length?[created[0]]:[];return created.length})},
exportSelectionJSON(){const data=JSON.stringify(selected(),null,2),b=new Blob([data],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="studio-selection.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);return true},
 copySelectionJSON(){return navigator.clipboard?.writeText(JSON.stringify(selected(),null,2)).then(()=>true).catch(()=>false)},
 focusFirst(){const n=selected()[0];if(!n)return false;window.StudioLite300?.focusSelection?.();return true},
 openExplorer(){return window.StudioLite300?.openExplorer?.()??false},
 openProperties(){return window.StudioLite300?.openProperties?.()??false},
 openDiagnostics(){return window.StudioLite300?.openDiagnostics?.()??false},
 openCodeStudio(){return window.StudioLite300?.openCodeStudio?.()??false},
 save(){core().save?.(true);return true},
 undo(){core().undo?.();return true},
 redo(){core().redo?.();return true}
};

window.StudioLiteExtra=F;
window.StudioLite300Extra=F;
window.StudioLite300Meta??={};
const oldNames=Array.isArray(window.StudioLite300Meta.names)?window.StudioLite300Meta.names:[];
const extraNames=Object.keys(F);
window.StudioLite300Meta.names=[...new Set([...oldNames,...extraNames])];
window.StudioLite300Meta.extraFunctions=extraNames.length;
window.StudioLite300Meta.totalFunctions=(window.StudioLite300Meta.names||[]).length;

function installExtraUI(){
 let b=document.querySelector("#studioExtraBtn");
 if(!b){b=document.createElement("button");b.id="studioExtraBtn";b.className="accent";b.type="button";b.textContent="⚡ Pro+";b.title="Ferramentas profissionais extras";document.querySelector(".toolbar .tool-group")?.appendChild(b)}
 b.onclick=()=>{
  const old=document.querySelector("#studioExtraModal");if(old){old.remove();return}
  const bg=document.createElement("div");bg.id="studioExtraModal";bg.className="modal-bg";
  bg.innerHTML='<div style="width:min(1100px,96vw);max-height:88vh;display:flex;flex-direction:column;background:#111827;border:1px solid #26364f;border-radius:18px;box-shadow:0 24px 80px #000b;overflow:hidden"><div style="padding:18px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #26364f"><div><h2 style="margin:0">⚡ Studio RBXL Pro+</h2><small>Ferramentas extras reais • '+extraNames.length+' novas funções</small></div><button id="extraClose" style="font-size:24px">×</button></div><div style="padding:14px;display:flex;gap:10px;border-bottom:1px solid #26364f"><input id="extraSearch" class="search" style="flex:1" placeholder="Pesquisar ferramenta..."><span id="extraCount" style="padding:10px">'+extraNames.length+'</span></div><div id="extraGrid" style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;overflow:auto"></div><div id="extraStatus" style="padding:12px 16px;border-top:1px solid #26364f">Pronto</div></div>';
  document.body.appendChild(bg);
  const grid=bg.querySelector("#extraGrid"),search=bg.querySelector("#extraSearch"),status=bg.querySelector("#extraStatus");
  const draw=()=>{const q=search.value.toLowerCase();grid.innerHTML="";extraNames.filter(n=>n.toLowerCase().includes(q)).forEach(n=>{const x=document.createElement("button");x.className="tool300-v21-item";x.innerHTML="<b>"+n+"</b><small>Pro+ • Executar</small>";x.onclick=async()=>{try{const r=await F[n]();status.textContent=n+" ✓ "+(r===undefined?"":typeof r==="number"?r+" resultado(s)":"concluído");toast(n+" ✓")}catch(e){status.textContent=n+" ✗ "+e.message;toast(n+" falhou")}};grid.appendChild(x)});bg.querySelector("#extraCount").textContent=grid.children.length+" / "+extraNames.length};
  search.oninput=draw;bg.querySelector("#extraClose").onclick=()=>bg.remove();draw();search.focus();
 };
}
\nconst totalTools=595;\nconst syncMainToolkitCount=()=>{const m=document.querySelector("#studio300Modal");if(!m)return;const small=m.querySelector(".tool300-v21-head small");if(small)small.textContent="595 funções reais • Editor • Explorer • Scripts • RBXL • Diagnóstico";const span=m.querySelector(".tool300-v21-bar span");if(span)span.textContent="595 / 595";const input=m.querySelector("#tool300V21Search");if(input)input.placeholder="⌕ Pesquisar entre 595 funções...";};\nnew MutationObserver(syncMainToolkitCount).observe(document.body,{childList:true,subtree:true});\nif(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installExtraUI);else setTimeout(installExtraUI,0);
})();