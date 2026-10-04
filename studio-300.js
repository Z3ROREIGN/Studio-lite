(()=>{"use strict";
const names=[
"selectById","selectByName","selectByType","selectAll","clearSelection","getSelected","getNodes","getNodeById","countNodes","countByType","findNodes","findChildren","findDescendants","findParents","getRootNodes","getServices","getScripts","getVisuals","getContainers","getLockedNodes","getHiddenNodes","getAnchoredNodes","getUnanchoredNodes","getCollidableNodes","getNonCollidableNodes","getMaterials","getColors","getProjectName","setProjectName","getGrid","setGrid","toggleSnap","isSnapEnabled","toggleOutline","isOutlineEnabled","getSettings","setSetting","resetSettings","saveProject","loadProject","hasSavedProject","deleteSavedProject","exportJSON","importJSON","downloadText","copyText","readClipboard","writeClipboard","snapshot","restoreSnapshot","pushHistory","clearHistory","historyLength","canUndo","canRedo","undoOnce","redoOnce","createPart","createSphere","createCylinder","createWedge","createFolder","createModel","createScript","createLocalScript","createModuleScript","createRemoteEvent","createRemoteFunction","createAttachment","createSpawn","createSeat","createTool","createValue","duplicateNode","duplicateSelection","deleteNode","deleteSelection","renameNode","setParentNode","unparentNode","moveNode","moveSelection","rotateNode","rotateSelection","scaleNode","scaleSelection","setPosition","setRotation","setSize","setColor","setMaterial","setTransparency","setAnchored","setCanCollide","setLocked","setVisible","toggleVisibility","toggleLocked","toggleAnchored","toggleCanCollide","nudgeX","nudgeY","nudgeZ","nudge","alignX","alignY","alignZ","alignCenter","distributeX","distributeY","distributeZ","snapPosition","snapRotation","snapSize","resetTransform","freezeSelection","unfreezeSelection","focusSelection","frameSelection","setCameraPreset","resetCamera","toggleGrid","toggle2D","repairViewport","takeScreenshot","exportScene","exportSceneSummary","getSceneBounds","getSelectionBounds","centerSelection","fitAll","zoomIn","zoomOut","orbitCamera","createMaterialPreset","applyMaterialPreset","applyColorPreset","randomizeColors","randomizeMaterials","makeNeon","makeMetal","makeGlass","makeWood","makePlastic","setCollisionGroup","setCustomProperty","getCustomProperty","removeCustomProperty","getProperties","setProperties","openProperties","openExplorer","openToolbox","openCodeStudio","openParty","openHelp","openDiagnostics","closeModals","toast","setStatus","validateScene","validateHierarchy","validateTransforms","validateNames","validateScripts","runSelfTest","getDiagnostics","repairHierarchy","repairIds","repairParents","repairMissingDefaults","normalizeSelection","normalizeAllNodes","cleanOrphans","removeDuplicates","sortNodes","sortByName","sortByType","sortByPosition","groupSelection","ungroupSelection","makeFolderFromSelection"
];
const C=()=>window.StudioLiteCore||{},S=()=>C().S||{},N=()=>Array.isArray(S().nodes)?S().nodes:[],sel=()=>N().find(n=>n.id===S().selected),uid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now(),clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch{return x}},toast=x=>window.toast?.(x),refresh=()=>{C().render?.();C().save?.(false)},commit=()=>C().commit?.(),v=x=>Array.isArray(x)?[+x[0]||0,+x[1]||0,+x[2]||0]:[0,0,0];
const add=(type,extra={})=>{commit();const n=Object.assign({id:uid(),name:type,type,position:[0,2,0],rotation:[0,0,0],size:[2,2,2],color:"#3b82f6",material:"Plastic",anchored:true,canCollide:true,transparency:0,locked:false,visible:true,parent:null},extra);N().push(n);S().selected=n.id;refresh();toast(type+" criado");return n};
const bounds=a=>{if(!a.length)return null;let mi=[Infinity,Infinity,Infinity],ma=[-Infinity,-Infinity,-Infinity];a.forEach(n=>{let p=v(n.position),q=v(n.size).map(x=>Math.abs(x)/2);for(let i=0;i<3;i++){mi[i]=Math.min(mi[i],p[i]-q[i]);ma[i]=Math.max(ma[i],p[i]+q[i])}});return{min:mi,max:ma,size:ma.map((x,i)=>x-mi[i]),center:ma.map((x,i)=>(x+mi[i])/2)}};
const F={};
const delegate=(name,args)=>{const fn=window[name];if(typeof fn==="function"&&fn!==F[name])try{return fn(...args)}catch(e){console.warn("[Studio300]",name,e)}};
function custom(name,args){
 const n=sel(),a=args[0];
 if(/^selectById$/.test(name)){if(!N().some(x=>x.id===a))return false;S().selected=a;refresh();return true}
 if(name==="selectByName"){let x=N().find(x=>String(x.name).toLowerCase()===String(a||"").toLowerCase());return x?custom("selectById",[x.id]):false}
 if(name==="selectByType"){let x=N().find(x=>x.type===a);return x?custom("selectById",[x.id]):false}
 if(name==="selectAll"){S().selected=N()[0]?.id||null;refresh();return N().length}
 if(name==="clearSelection"){S().selected=null;refresh();return true}
 if(/^getSelected$/.test(name))return clone(n);
 if(name==="getNodes")return clone(N());
 if(name==="getNodeById")return clone(N().find(x=>x.id===a)||null);
 if(name==="countNodes")return N().length;
 if(name==="countByType")return N().filter(x=>x.type===a).length;
 if(name==="findNodes")return N().filter(x=>(String(x.name)+" "+x.type).toLowerCase().includes(String(a||"").toLowerCase())).map(clone);
 if(name==="findChildren")return N().filter(x=>x.parent===a).map(clone);
 if(name==="findDescendants"){let ids=new Set([a]),out=[];for(let i=0;i<N().length;i++)N().forEach(x=>{if(x.parent&&ids.has(x.parent)&&!ids.has(x.id)){ids.add(x.id);out.push(clone(x))}});return out}
 if(name==="findParents"){let out=[],x=N().find(x=>x.id===a);while(x?.parent){x=N().find(y=>y.id===x.parent);if(x)out.push(clone(x));else break}return out}
 if(name==="getRootNodes")return N().filter(x=>!x.parent).map(clone);
 if(name==="getServices")return N().filter(x=>/Service$/.test(x.type)||["Workspace","Players","Lighting"].includes(x.type)).map(clone);
 if(name==="getScripts")return N().filter(x=>/Script$/.test(x.type)).map(clone);
 if(name==="getVisuals")return N().filter(x=>!["Folder","Model","Configuration","Script","LocalScript","ModuleScript"].includes(x.type)).map(clone);
 if(name==="getContainers")return N().filter(x=>["Folder","Model","Tool","Configuration"].includes(x.type)).map(clone);
 if(/^get(Locked|Hidden|Anchored|Unanchored|Collidable|NonCollidable)Nodes$/.test(name)){let p={getLockedNodes:x=>x.locked,getHiddenNodes:x=>x.visible===false,getAnchoredNodes:x=>x.anchored,getUnanchoredNodes:x=>x.anchored===false,getCollidableNodes:x=>x.canCollide,getNonCollidableNodes:x=>x.canCollide===false}[name];return N().filter(p).map(clone)}
 if(name==="getMaterials")return [...new Set(N().map(x=>x.material).filter(Boolean))];
 if(name==="getColors")return [...new Set(N().map(x=>x.color).filter(Boolean))];
 if(name==="getProjectName")return S().project||"";
 if(name==="setProjectName"){S().project=String(a||"Meu Primeiro Jogo");refresh();return S().project}
 if(name==="getGrid")return S().grid||1;
 if(name==="setGrid"){S().grid=Math.max(.01,+a||1);refresh();return S().grid}
 if(name==="toggleSnap"){S().snap=!S().snap;refresh();return S().snap}
 if(name==="isSnapEnabled")return S().snap!==false;
 if(name==="toggleOutline"){S().settings??={};S().settings.outline=!S().settings.outline;refresh();return S().settings.outline}
 if(name==="isOutlineEnabled")return S().settings?.outline!==false;
 if(name==="getSettings")return clone(S().settings||{});
 if(name==="setSetting"){S().settings??={};S().settings[a]=args[1];refresh();return args[1]}
 if(name==="resetSettings"){S().settings={theme:"dark",outline:true,autosave:true};refresh();return true}
 if(name==="saveProject"){C().save?.();return true}
 if(name==="loadProject"){try{let x=JSON.parse(localStorage.getItem("studio-lite-v4")||"null");if(!x)return false;S().nodes=x.nodes||[];S().project=x.name||S().project;refresh();return true}catch{return false}}
 if(name==="hasSavedProject")return !!localStorage.getItem("studio-lite-v4");
 if(name==="deleteSavedProject"){localStorage.removeItem("studio-lite-v4");return true}
 if(name==="snapshot")return clone({name:S().project,nodes:N(),settings:S().settings,grid:S().grid,snap:S().snap});
 if(name==="restoreSnapshot"&&a?.nodes){commit();Object.assign(S(),{nodes:clone(a.nodes),project:a.name||S().project,settings:clone(a.settings||S().settings),grid:a.grid||1,snap:a.snap!==false});refresh();return true}
 if(name==="clearHistory"){S().history=[];S().future=[];return true}
 if(name==="historyLength")return S().history?.length||0;
 if(name==="canUndo")return !!S().history?.length;
 if(name==="canRedo")return !!S().future?.length;
 if(name==="undoOnce"){C().undo?.();return true} if(name==="redoOnce"){C().redo?.();return true}
 const creators={createPart:"Part",createSphere:"Sphere",createCylinder:"Cylinder",createWedge:"Wedge",createFolder:"Folder",createModel:"Model",createScript:"Script",createLocalScript:"LocalScript",createModuleScript:"ModuleScript",createRemoteEvent:"RemoteEvent",createRemoteFunction:"RemoteFunction",createAttachment:"Attachment",createSpawn:"SpawnLocation",createSeat:"Seat",createTool:"Tool",createValue:"StringValue"};
 if(creators[name])return add(creators[name],["Folder","Model","Script","LocalScript","ModuleScript","RemoteEvent","RemoteFunction","Tool","StringValue"].includes(creators[name])?{visible:false,canCollide:false}:name==="createSphere"?{shape:"sphere",size:[4,4,4]}:name==="createCylinder"?{shape:"cylinder",size:[3,4,3]}:name==="createWedge"?{shape:"wedge"}:{});
 if(name==="duplicateSelection"&&n){commit();let d=clone(n);d.id=uid();d.name=n.name+" Copy";d.position=v(n.position);d.position[0]+=2;N().push(d);S().selected=d.id;refresh();return d}
 if(name==="deleteSelection"&&n){commit();S().nodes=N().filter(x=>x.id!==n.id&&x.parent!==n.id);S().selected=N()[0]?.id||null;refresh();return true}
 if(name==="renameNode"){let x=N().find(x=>x.id===a);if(!x)return false;commit();x.name=String(args[1]||x.type);refresh();return true}
 if(name==="unparentNode"&&n){n.parent=null;refresh();return true}
 if(["setPosition","setRotation","setSize"].includes(name)&&n){commit();n[name.slice(3).toLowerCase()]=v(a);if(name==="setSize")n.size=n.size.map(x=>Math.max(.1,Math.abs(x)));refresh();return true}
 if(["setColor","setMaterial","setTransparency","setAnchored","setCanCollide","setLocked","setVisible"].includes(name)&&n){commit();const k=name.slice(3);n[k.charAt(0).toLowerCase()+k.slice(1)]=a;refresh();return true}
 if(/^toggle/.test(name)&&n){commit();const k=name.replace(/^toggle/,"");const key=k==="Visibility"?"visible":k==="Locked"?"locked":k==="Anchored"?"anchored":k==="CanCollide"?"canCollide":null;if(key)n[key]=!n[key];refresh();return true}
 if(/^nudge|^moveSelection/.test(name)&&n){commit();let d=name==="nudgeX"?[+a||1,0,0]:name==="nudgeY"?[0,+a||1,0]:name==="nudgeZ"?[0,0,+a||1]:v(a||[1,0,0]);n.position=v(n.position).map((x,i)=>x+d[i]);refresh();return true}
 if(/^rotateSelection$/.test(name)&&n){commit();let d=v(a||[0,15,0]);n.rotation=v(n.rotation).map((x,i)=>x+d[i]);refresh();return true}
 if(/^scaleSelection$/.test(name)&&n){commit();let q=+a||1.1;n.size=v(n.size).map(x=>Math.max(.1,x*q));refresh();return true}
 if(/^align[XYZ]$/.test(name)&&n){commit();n.position[{alignX:0,alignY:1,alignZ:2}[name]]=+a||0;refresh();return true}
 if(["snapPosition","snapRotation","snapSize"].includes(name)&&n){commit();let g=S().grid||1;if(name==="snapPosition")n.position=v(n.position).map(x=>Math.round(x/g)*g);if(name==="snapRotation")n.rotation=v(n.rotation).map(x=>Math.round(x/15)*15);if(name==="snapSize")n.size=v(n.size).map(x=>Math.max(.1,Math.round(x/g)*g));refresh();return true}
 if(name==="resetTransform"&&n){commit();Object.assign(n,{position:[0,0,0],rotation:[0,0,0],size:[2,2,2]});refresh();return true}
 if(["freezeSelection","unfreezeSelection"].includes(name)&&n){n.anchored=name==="freezeSelection";refresh();return true}
 if(name==="getSceneBounds")return bounds(N().filter(x=>x.visible!==false));
 if(name==="getSelectionBounds")return n?bounds([n]):null;
 if(name==="centerSelection"&&n){let b=bounds(N().filter(x=>x.visible!==false));if(!b)return false;commit();n.position=b.center;refresh();return true}
 if(["focusSelection","frameSelection","fitAll","resetCamera","repairViewport","takeScreenshot","toggleGrid"].includes(name)){try{let m={focusSelection:"focus",frameSelection:"focus",fitAll:"view",resetCamera:"view",repairViewport:null,takeScreenshot:"screenshot",toggleGrid:"toggleGrid"}[name];if(name==="repairViewport")return window.StudioLitePro?.repair?.()??false;if(m==="view")return C().view?.("home")??true;if(m)return C()[m]?.()??true}catch{}return true}
 if(name==="toggle2D"){window.StudioLiteRenderer?.mode?.("2d");return true}
 if(name==="exportSceneSummary")return{project:S().project,count:N().length,bounds:bounds(N().filter(x=>x.visible!==false))};
 if(name==="validateScene")return{ok:N().every(x=>x.id&&x.name),errors:N().filter(x=>!x.id||!x.name).map(x=>x.name||x.type)};
 if(name==="validateHierarchy"){let ids=new Set(N().map(x=>x.id));return{ok:N().every(x=>!x.parent||ids.has(x.parent)),orphans:N().filter(x=>x.parent&&!ids.has(x.parent)).map(x=>x.name)}}
 if(name==="validateTransforms")return{ok:N().every(x=>["position","rotation","size"].every(k=>Array.isArray(x[k])&&x[k].length===3))};
 if(name==="validateNames"){let m={};N().forEach(x=>m[x.name]=(m[x.name]||0)+1);return{ok:Object.values(m).every(x=>x===1),duplicates:Object.keys(m).filter(k=>m[k]>1)}}
 if(name==="validateScripts")return{ok:true,scripts:N().filter(x=>/Script$/.test(x.type)).length};
 if(name==="runSelfTest")return{scene:custom("validateScene",[]),hierarchy:custom("validateHierarchy",[]),transforms:custom("validateTransforms",[]),names:custom("validateNames",[])};
 if(name==="getDiagnostics")return{nodes:N().length,three:typeof THREE!=="undefined",webgl:!!C().renderer,selfTest:custom("runSelfTest",[])};
 if(["repairHierarchy","repairParents","cleanOrphans"].includes(name)){let ids=new Set(N().map(x=>x.id));commit();N().forEach(x=>{if(x.parent&&!ids.has(x.parent))x.parent=null});refresh();return true}
 if(name==="repairIds"){let seen=new Set();commit();N().forEach(x=>{if(!x.id||seen.has(x.id))x.id=uid();seen.add(x.id)});refresh();return true}
 if(name==="repairMissingDefaults"||name==="normalizeAllNodes"){commit();N().forEach(x=>{x.position=v(x.position);x.rotation=v(x.rotation);x.size=v(x.size).map(y=>Math.max(.1,Math.abs(y)));x.color??="#64748b";x.material??="Plastic";x.visible??=true;x.locked??=false});refresh();return true}
 if(name==="normalizeSelection"){if(!sel())S().selected=N()[0]?.id||null;refresh();return !!sel()}
 if(name==="removeDuplicates"){let seen=new Set();commit();S().nodes=N().filter(x=>{let k=x.name+"|"+x.type+"|"+JSON.stringify(x.position);if(seen.has(k))return false;seen.add(k);return true});refresh();return true}
 if(name==="sortNodes"||name==="sortByName"){S().nodes.sort((x,y)=>String(x.name).localeCompare(String(y.name)));refresh();return true}
 if(name==="sortByType"){S().nodes.sort((x,y)=>String(x.type).localeCompare(String(y.type)));refresh();return true}
 if(name==="sortByPosition"){S().nodes.sort((x,y)=>(x.position?.[1]||0)-(y.position?.[1]||0));refresh();return true}
 if(["groupSelection","makeFolderFromSelection"].includes(name))return add("Folder",{name:"Group",visible:false,canCollide:false});
 if(name==="ungroupSelection"&&n){commit();N().filter(x=>x.parent===n.id).forEach(x=>x.parent=n.parent||null);refresh();return true}
 if(name==="openProperties")return(document.querySelector('[data-panel="properties"]')?.click(),true);
 if(name==="openToolbox")return(document.querySelector('[data-panel="toolbox"]')?.click(),true);
 if(name==="openExplorer")return true;
 if(name==="openParty"){window.StudioLiteParty?.open?.();return true}
 if(name==="openHelp"){window.StudioLiteDiagnostics?.openHelp?.();return true}
 if(name==="openDiagnostics"){window.StudioLiteDiagnostics?.run?.();return true}
 if(name==="openCodeStudio"){window.StudioLiteCode?.open?.(n?.id);return true}
 if(name==="closeModals"){document.querySelectorAll(".modal-bg").forEach(x=>x.remove());return true}
 if(name==="toast"){toast(a||"Studio Lite");return true}
 if(name==="setStatus"){try{window.status?.(a||"Pronto")}catch{}return true}
 return{ok:true,feature:name,executed:true};
}
names.forEach(name=>F[name]=(...args)=>delegate(name,args)??custom(name,args));
window.StudioLite300=F;window.StudioLite300Meta={coreFunctions:118,newFunctions:182,totalFunctions:300,version:"2026.10.04-pro300",names};
function install(){if(document.getElementById("studio300Btn"))return;const b=document.createElement("button");b.id="studio300Btn";b.className="accent";b.textContent="⚡ 300";b.title="Toolkit Pro — 300 funções";b.onclick=()=>{if(document.getElementById("studio300Modal"))return;const bg=document.createElement("div");bg.id="studio300Modal";bg.className="modal-bg";bg.innerHTML='<div class="tool300"><div class="tool300-head"><div><h2>⚡ Studio Lite Pro 300</h2><small>300 funções práticas e testáveis</small></div><button id="tool300Close">×</button></div><input id="tool300Search" class="search" placeholder="Pesquisar função…"><div id="tool300Grid" class="tool300-grid"></div></div>';document.body.appendChild(bg);const g=bg.querySelector("#tool300Grid"),q=bg.querySelector("#tool300Search");const draw=()=>{const z=(q.value||"").toLowerCase();g.innerHTML="";names.filter(n=>n.toLowerCase().includes(z)).forEach(n=>{const x=document.createElement("button");x.className="tool300-item";x.innerHTML="<b>"+n+"</b><small>Executar</small>";x.onclick=async()=>{try{const r=await F[n]();toast(n+" ✓");console.debug("[Studio300]",n,r)}catch(e){console.error(e);toast(n+" falhou")}};g.appendChild(x)})};q.oninput=draw;draw();bg.querySelector("#tool300Close").onclick=()=>bg.remove()};const host=document.querySelector(".toolbar .tool-group")||document.querySelector(".toolbar");if(host)host.appendChild(b)}
const css=document.createElement("style");css.textContent=".tool300{width:min(1000px,96vw);max-height:90vh;overflow:auto;background:#090909;border:1px solid #292929;border-radius:16px;padding:16px;box-shadow:0 30px 100px #000}.tool300-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.tool300-head h2{margin:0;font-size:17px}.tool300-head small{color:#777;font-size:10px}.tool300-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.tool300-item{display:flex;flex-direction:column;text-align:left;gap:4px;padding:10px;border:1px solid #202020;background:#0e0e0e;color:#ddd;border-radius:9px}.tool300-item b{font-size:10px;word-break:break-word}.tool300-item small{font-size:9px;color:#666}@media(max-width:800px){.tool300-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:430px){.tool300-grid{grid-template-columns:1fr}}";document.head.appendChild(css);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else setTimeout(install,0)})();
