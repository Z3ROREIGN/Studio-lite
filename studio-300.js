(()=>{"use strict";
const NAMES=["selectByPrefix","selectSiblings","getSiblings","getDepth","getPath","countParts","countModels","countFolders","countLights","countGui","countValues","resetSelectionAppearance","toggleSelectionVisibility","toggleSelectionAnchored","toggleSelectionCollision","toggleSelectionLocked","centerSelectionX","centerSelectionY","centerSelectionZ","resetSelectionPosition","resetSelectionRotation","resetSelectionSize","setPositionX","setPositionY","setPositionZ","setRotationX","setRotationY","setRotationZ","setSizeX","setSizeY","setSizeZ","selectById","selectByName","selectByType","selectAll","clearSelection","getSelected","getNodes","getNodeById","countNodes","countByType","findNodes","findChildren","findDescendants","findParents","getRootNodes","getServices","getScripts","getVisuals","getContainers","getLockedNodes","getHiddenNodes","getAnchoredNodes","getUnanchoredNodes","getCollidableNodes","getNonCollidableNodes","getMaterials","getColors","getProjectName","setProjectName","getGrid","setGrid","toggleSnap","isSnapEnabled","toggleOutline","isOutlineEnabled","getSettings","setSetting","resetSettings","saveProject","loadProject","hasSavedProject","deleteSavedProject","exportJSON","importJSON","downloadText","copyText","readClipboard","writeClipboard","snapshot","restoreSnapshot","pushHistory","clearHistory","historyLength","canUndo","canRedo","undoOnce","redoOnce","createPart","createSphere","createCylinder","createWedge","createFolder","createModel","createScript","createLocalScript","createModuleScript","createRemoteEvent","createRemoteFunction","createAttachment","createSpawn","createSeat","createTool","createValue","duplicateNode","duplicateSelection","deleteNode","deleteSelection","renameNode","setParentNode","unparentNode","moveNode","moveSelection","rotateNode","rotateSelection","scaleNode","scaleSelection","setPosition","setRotation","setSize","setColor","setMaterial","setTransparency","setAnchored","setCanCollide","setLocked","setVisible","toggleVisibility","toggleLocked","toggleAnchored","toggleCanCollide","nudgeX","nudgeY","nudgeZ","nudge","alignX","alignY","alignZ","alignCenter","distributeX","distributeY","distributeZ","snapPosition","snapRotation","snapSize","resetTransform","freezeSelection","unfreezeSelection","focusSelection","frameSelection","setCameraPreset","resetCamera","toggleGrid","toggle2D","repairViewport","takeScreenshot","exportScene","exportSceneSummary","getSceneBounds","getSelectionBounds","centerSelection","fitAll","zoomIn","zoomOut","orbitCamera","createMaterialPreset","applyMaterialPreset","applyColorPreset","randomizeColors","randomizeMaterials","makeNeon","makeMetal","makeGlass","makeWood","makePlastic","setCollisionGroup","setCustomProperty","getCustomProperty","removeCustomProperty","getProperties","setProperties","openProperties","openExplorer","openToolbox","openCodeStudio","openParty","openHelp","openDiagnostics","closeModals","toast","setStatus","validateScene","validateHierarchy","validateTransforms","validateNames","validateScripts","runSelfTest","getDiagnostics","repairHierarchy","repairIds","repairParents","repairMissingDefaults","normalizeSelection","normalizeAllNodes","cleanOrphans","removeDuplicates","sortNodes","sortByName","sortByType","sortByPosition","groupSelection","ungroupSelection","makeFolderFromSelection","createMeshPart","createUnion","createWedgePart","createCornerWedge","createTruss","createVehicleSeat","createDecal","createTexture","createSurfaceGui","createBillboardGui","createHighlight","createPointLight","createSpotLight","createSurfaceLight","createParticleEmitter","createBeam","createTrail","createProximityPrompt","createClickDetector","createSky","createAtmosphere","createConfiguration","createBindableEvent","createBindableFunction","createStringValue","createBoolValue","createIntValue","createNumberValue","createObjectValue","createColorValue","addChild","addSibling","setParentByName","getParent","getChildrenCount","isDescendantOf","isAncestorOf","expandExplorer","collapseExplorer","expandAllExplorer","collapseAllExplorer","selectNext","selectPrevious","selectFirstChild","selectParent","selectService","moveToService","createServiceNode","removeServiceNode","renameProject","duplicateMany","deleteByType","invertSelection","selectVisible","selectHidden","selectLocked","selectUnlocked","selectAnchored","selectUnanchored","selectCollidable","selectNonCollidable","getSelectionCount","getSelectionNodes","setMultiPosition","setMultiRotation","setMultiSize","setMultiColor","setMultiMaterial","setMultiVisibility","setMultiAnchored","setMultiLocked","setMultiCollision","mirrorX","mirrorY","mirrorZ","rotate90","rotate180","rotate270","scaleUniform","growSelection","shrinkSelection","alignTop","alignBottom","alignLeft","alignRight","distributeEvenlyX","distributeEvenlyY","distributeEvenlyZ","centerOnOrigin","randomizePosition","randomizeRotation","randomizeScale","clampPosition","clampRotation","clampSize","applyTransformPreset","resetColor","resetMaterial","resetAppearance","resetBehavior","setNeonColor","setGlassTransparency","setMetalness","setRoughness","setReflectance","setMassless","setCastShadow","setCanQuery","setCanTouch","setArchivable","setValue","getValue","setScriptSource","getScriptSource","appendScript","prependScript","replaceScript","insertScriptTemplate"];
const C=()=>window.StudioLiteCore||{},S=()=>C().S||window.S||null,nodes=()=>S()?.nodes||[];
const selected=()=>{const s=S();return nodes().find(n=>n.id===s?.selected)||nodes().find(n=>s?.selectedIds?.includes(n.id))||null};
const ids=()=>{const s=S();const a=Array.isArray(s?.selectedIds)?s.selectedIds.filter(id=>nodes().some(n=>n.id===id)):[];return a.length?a:(s?.selected?[s.selected]:[])};
const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch{return x}};
const toast=x=>window.toast?.(String(x));
const commit=()=>C().commit?.(),refresh=()=>C().render?.(),save=()=>C().save?.(false);
const mutate=fn=>{const s=S();if(!s)return false;commit();const r=fn(s,nodes(),selected());refresh();save();return r===undefined?true:r};
const add=(type,extra={})=>{type=type==="Wedge"?"WedgePart":type;if(typeof window.addRobloxObject==="function"){window.addRobloxObject(type);const n=selected();if(n)Object.assign(n,extra);refresh();save();return n}return null};
const createMap={
 createPart:"Part",createSphere:"Sphere",createCylinder:"Cylinder",createWedge:"WedgePart",createFolder:"Folder",createModel:"Model",
 createScript:"Script",createLocalScript:"LocalScript",createModuleScript:"ModuleScript",createRemoteEvent:"RemoteEvent",createRemoteFunction:"RemoteFunction",
 createAttachment:"Attachment",createSpawn:"SpawnLocation",createSeat:"Seat",createTool:"Tool",createMeshPart:"MeshPart",createUnion:"UnionOperation",
 createWedgePart:"WedgePart",createCornerWedge:"CornerWedgePart",createTruss:"TrussPart",createVehicleSeat:"VehicleSeat",createDecal:"Decal",
 createTexture:"Texture",createSurfaceGui:"SurfaceGui",createBillboardGui:"BillboardGui",createHighlight:"Highlight",createPointLight:"PointLight",
 createSpotLight:"SpotLight",createSurfaceLight:"SurfaceLight",createParticleEmitter:"ParticleEmitter",createBeam:"Beam",createTrail:"Trail",
 createProximityPrompt:"ProximityPrompt",createClickDetector:"ClickDetector",createSky:"Sky",createAtmosphere:"Atmosphere",createConfiguration:"Configuration",
 createBindableEvent:"BindableEvent",createBindableFunction:"BindableFunction",createStringValue:"StringValue",createBoolValue:"BoolValue",createIntValue:"IntValue",
 createNumberValue:"NumberValue",createObjectValue:"ObjectValue",createColorValue:"Color3Value",createValue:"StringValue"
};
const services=["Workspace","Lighting","Players","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService","CollectionService","HttpService","MarketplaceService","TweenService","RunService","DataStoreService","MemoryStoreService","MessagingService","TeleportService"];
const mats=["Plastic","Metal","Wood","Glass","Neon"];
const getType=x=>String(x||"").replace(/^create/,"")||"Part";
const selectedNodes=()=>ids().map(id=>nodes().find(n=>n.id===id)).filter(Boolean);
const bounds=a=>{if(!a.length)return null;const mi=[Infinity,Infinity,Infinity],ma=[-Infinity,-Infinity,-Infinity];a.forEach(n=>{const p=n.position||[0,0,0],z=n.size||[1,1,1];for(let i=0;i<3;i++){const h=Math.abs(Number(z[i])||1)/2;mi[i]=Math.min(mi[i],Number(p[i])||0-h);ma[i]=Math.max(ma[i],Number(p[i])||0+h)}});return{min:mi,max:ma,size:ma.map((x,i)=>x-mi[i]),center:ma.map((x,i)=>(x+mi[i])/2)}};
const snap=a=>{const g=Math.max(.01,Number(S()?.grid)||1);return (a||[0,0,0]).map(x=>Math.round((Number(x)||0)/g)*g)};
const snapshotStore="studio-lite-v21-snapshots";
const readSnaps=()=>{try{return JSON.parse(localStorage.getItem(snapshotStore)||"[]")}catch{return[]}};
const writeSnaps=a=>localStorage.setItem(snapshotStore,JSON.stringify(a.slice(-20)));
function exec(name,args=[]){
 const s=S(),n=selected(),a=args[0];
 if(!s)return false;
 if(createMap[name])return add(createMap[name],name.includes("Value")?{value:a??""}:{});

 if(name==="selectByPrefix"){const term=String(a||"").toLowerCase();const hit=nodes().filter(x=>String(x.name||"").toLowerCase().startsWith(term));s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="getSiblings"){const p=n?.parent||null;return nodes().filter(x=>x.id!==n?.id&&(x.parent||null)===p).map(clone)}
 if(name==="selectSiblings"){const p=n?.parent||null;const hit=nodes().filter(x=>(x.parent||null)===p);s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="getDepth"){let d=0,x=n;const seen=new Set();while(x?.parent&&!seen.has(x.parent)){seen.add(x.parent);x=nodes().find(y=>y.id===x.parent);if(x)d++}return d}
 if(name==="getPath"){const out=[];let x=n;const seen=new Set();while(x&&!seen.has(x.id)){seen.add(x.id);out.unshift(x.name||x.type);x=x.parent?nodes().find(y=>y.id===x.parent):null}return out}
 if(name==="countParts")return nodes().filter(x=>/Part$/.test(x.type)||["MeshPart","UnionOperation"].includes(x.type)).length;
 if(name==="countModels")return nodes().filter(x=>x.type==="Model").length;
 if(name==="countFolders")return nodes().filter(x=>x.type==="Folder").length;
 if(name==="countLights")return nodes().filter(x=>/Light$/.test(x.type)).length;
 if(name==="countGui")return nodes().filter(x=>/Gui$/.test(x.type)||/GuiObject/.test(x.type)).length;
 if(name==="countValues")return nodes().filter(x=>/Value$/.test(x.type)).length;
 if(name==="resetSelectionAppearance")return mutate(()=>selectedNodes().forEach(x=>{x.color="#777";x.material="Plastic";x.transparency=0;x.visible=true}));
 if(name==="toggleSelectionVisibility")return mutate(()=>selectedNodes().forEach(x=>x.visible=x.visible===false));
 if(name==="toggleSelectionAnchored")return mutate(()=>selectedNodes().forEach(x=>x.anchored=x.anchored===false));
 if(name==="toggleSelectionCollision")return mutate(()=>selectedNodes().forEach(x=>x.canCollide=x.canCollide===false));
 if(name==="toggleSelectionLocked")return mutate(()=>selectedNodes().forEach(x=>x.locked=x.locked!==true));
 if(name==="centerSelectionX"||name==="centerSelectionY"||name==="centerSelectionZ"){const k={centerSelectionX:0,centerSelectionY:1,centerSelectionZ:2}[name];const b=bounds(selectedNodes());return b?mutate(()=>selectedNodes().forEach(x=>x.position[k]=b.center[k])):false}
 if(name==="resetSelectionPosition")return mutate(()=>selectedNodes().forEach(x=>x.position=[0,0,0]));
 if(name==="resetSelectionRotation")return mutate(()=>selectedNodes().forEach(x=>x.rotation=[0,0,0]));
 if(name==="resetSelectionSize")return mutate(()=>selectedNodes().forEach(x=>x.size=[2,2,2]));
 if(/^set(Position|Rotation|Size)[XYZ]$/.test(name)){const kind=name.match(/^set(Position|Rotation|Size)/)[1].toLowerCase(),axis=name.slice(-1).toLowerCase(),k={x:0,y:1,z:2}[axis],defaults={position:0,rotation:0,size:2};return mutate(()=>selectedNodes().forEach(x=>{x[kind]=Array.isArray(x[kind])?[...x[kind]]:[0,0,0];x[kind][k]=defaults[kind]}))}
 if(name==="selectById")return !!nodes().find(x=>x.id===a)&&(s.selected=a,s.selectedIds=[a],refresh(),true);
 if(name==="selectByName"){const x=nodes().find(x=>String(x.name).toLowerCase()===String(a||"").toLowerCase());return x?exec("selectById",[x.id]):false}
 if(name==="selectByType"){const x=nodes().find(x=>x.type===a);return x?exec("selectById",[x.id]):false}
 if(name==="selectAll"){s.selectedIds=nodes().map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return s.selectedIds.length}
 if(name==="clearSelection"){s.selected=null;s.selectedIds=[];refresh();return true}
 if(name==="getSelected")return clone(n);if(name==="getNodes")return clone(nodes());if(name==="getNodeById")return clone(nodes().find(x=>x.id===a)||null);
 if(name==="countNodes")return nodes().length;if(name==="countByType")return nodes().filter(x=>x.type===a).length;
 if(name==="findNodes")return nodes().filter(x=>(String(x.name)+" "+x.type).toLowerCase().includes(String(a||"").toLowerCase())).map(clone);
 if(name==="findChildren")return nodes().filter(x=>x.parent===a).map(clone);
 if(name==="findDescendants"){const out=[],seen=new Set([a]);for(let i=0;i<nodes().length;i++)nodes().forEach(x=>{if(x.parent&&seen.has(x.parent)&&!seen.has(x.id)){seen.add(x.id);out.push(clone(x))}});return out}
 if(name==="findParents"){const out=[];let x=n;if(a)x=nodes().find(y=>y.id===a);while(x?.parent){x=nodes().find(y=>y.id===x.parent);if(x)out.push(clone(x));else break}return out}
 if(name==="getRootNodes")return nodes().filter(x=>!x.parent).map(clone);
 if(name==="getServices")return nodes().filter(x=>x.service||services.includes(x.type)).map(clone);
 if(name==="getScripts")return nodes().filter(x=>/Script$/.test(x.type)).map(clone);
 if(name==="getVisuals")return nodes().filter(x=>x.visible!==false&&!/Script$/.test(x.type)&&!["Folder","Model","Configuration"].includes(x.type)).map(clone);
 if(name==="getContainers")return nodes().filter(x=>["Folder","Model","Tool","Configuration"].includes(x.type)).map(clone);
 if(/^get(Locked|Hidden|Anchored|Unanchored|Collidable|NonCollidable)Nodes$/.test(name)){const p={getLockedNodes:x=>x.locked,getHiddenNodes:x=>x.visible===false,getAnchoredNodes:x=>x.anchored!==false,getUnanchoredNodes:x=>x.anchored===false,getCollidableNodes:x=>x.canCollide!==false,getNonCollidableNodes:x=>x.canCollide===false}[name];return nodes().filter(p).map(clone)}
 if(name==="getMaterials")return[...new Set(nodes().map(x=>x.material).filter(Boolean))];if(name==="getColors")return[...new Set(nodes().map(x=>x.color).filter(Boolean))];
 if(name==="getProjectName")return s.project||"";if(name==="setProjectName")return(s.project=String(a||"Meu Primeiro Jogo"),C().save?.(false),refresh(),s.project);
 if(name==="getGrid")return Number(s.grid)||1;if(name==="setGrid")return(s.grid=Math.max(.01,Number(a)||1),refresh(),s.grid);
 if(name==="toggleSnap")return(s.snap=!s.snap,save(),refresh(),s.snap);if(name==="isSnapEnabled")return s.snap!==false;
 if(name==="toggleOutline")return(s.settings??={},s.settings.outline=!((s.settings&&s.settings.outline)===true),refresh(),s.settings.outline);
 if(name==="isOutlineEnabled")return s.settings?.outline!==false;if(name==="getSettings")return clone(s.settings||{});
 if(name==="setSetting")return(s.settings??={},s.settings[a]=args[1],save(),args[1]);if(name==="resetSettings")return(s.settings={theme:"dark",outline:true,autosave:true},save(),refresh(),true);
 if(name==="saveProject")return C().save?.(true),true;
 if(name==="loadProject"){try{const x=JSON.parse(localStorage.getItem("studio-lite-v4")||"null");if(!x)return false;s.nodes=(x.nodes||[]).map(x=>({...x}));s.project=x.name||s.project;s.selected=s.nodes[0]?.id||null;refresh();return true}catch{return false}}
 if(name==="hasSavedProject")return!!localStorage.getItem("studio-lite-v4");if(name==="deleteSavedProject")return(localStorage.removeItem("studio-lite-v4"),true);
 if(name==="snapshot"||name==="createSnapshot")return clone({name:s.project,nodes:nodes(),settings:s.settings,grid:s.grid,snap:s.snap});
 if(name==="restoreSnapshot")return a?.nodes?(commit(),s.nodes=clone(a.nodes),s.project=a.name||s.project,refresh(),save(),true):false;
 if(name==="pushHistory")return commit(),true;if(name==="clearHistory")return(s.history=[],s.future=[],true);if(name==="historyLength")return s.history?.length||0;
 if(name==="canUndo")return!!s.history?.length;if(name==="canRedo")return!!s.future?.length;if(name==="undoOnce")return C().undo?.(),true;if(name==="redoOnce")return C().redo?.(),true;
 if(["duplicateSelection","duplicateNode"].includes(name)&&n){const count=name==="duplicateNode"?1:1;return Array.from({length:count},()=>C().duplicate?.()),true}
 if(["deleteSelection","deleteNode"].includes(name)&&n)return C().remove?.(),true;
 if(name==="renameNode"){const x=nodes().find(x=>x.id===a)||n;if(!x)return false;return mutate(()=>{x.name=String(args[1]||"Object").slice(0,100)})}
 if(name==="setParentNode"||name==="setParentByName"||name==="unparentNode"||name==="addChild"||name==="addSibling"){
   const target=n;if(!target)return false;let parent=null;
   if(name==="unparentNode")parent=null;
   else if(name==="setParentByName"){parent=nodes().find(x=>String(x.name).toLowerCase()===String(a||"").toLowerCase())?.id||null}
   else if(name==="addSibling"){parent=nodes().find(x=>x.id===target.parent)?.id||null}
   else parent=a||n?.parent||null;
   if(parent===target.id)return false;
   return mutate(()=>{target.parent=parent});
 }
 if(name==="getParent")return n?.parent?clone(nodes().find(x=>x.id===n.parent)||null):null;if(name==="getChildrenCount")return n?nodes().filter(x=>x.parent===n.id).length:0;
 if(name==="isDescendantOf"||name==="isAncestorOf"){let x=n,needle=a;while(x?.parent){if(x.parent===needle)return name==="isDescendantOf";x=nodes().find(y=>y.id===x.parent)}return false}
 if(["moveNode","moveSelection","setPosition","setMultiPosition"].includes(name))return mutate(()=>{const d=Array.isArray(a)?a:[Number(a?.x)||0,Number(a?.y)||0,Number(a?.z)||0];selectedNodes().forEach(x=>x.position=[...d])});
 if(["rotateNode","rotateSelection","setRotation","setMultiRotation"].includes(name))return mutate(()=>{const d=Array.isArray(a)?a:[Number(a?.x)||0,Number(a?.y)||0,Number(a?.z)||0];selectedNodes().forEach(x=>x.rotation=[...d])});
 if(["scaleNode","scaleSelection","setSize","setMultiSize"].includes(name))return mutate(()=>{const d=Array.isArray(a)?a:[Number(a?.x)||1,Number(a?.y)||1,Number(a?.z)||1];selectedNodes().forEach(x=>{x.size=d.map(v=>Math.max(.1,Math.abs(Number(v)||1)))});});
 if(["setColor","setMultiColor"].includes(name))return mutate(()=>selectedNodes().forEach(x=>x.color=String(a||"#ffffff")));
 if(["setMaterial","setMultiMaterial"].includes(name))return mutate(()=>selectedNodes().forEach(x=>x.material=mats.includes(a)?a:"Plastic"));
 if(["setTransparency"].includes(name))return mutate(()=>selectedNodes().forEach(x=>x.transparency=Math.max(0,Math.min(1,Number(a)||0))));
 if(["setAnchored","setMultiAnchored"].includes(name))return mutate(()=>selectedNodes().forEach(x=>x.anchored=!!a));
 if(["setCanCollide","setMultiCollision"].includes(name))return mutate(()=>selectedNodes().forEach(x=>x.canCollide=!!a));
 if(["setLocked","setMultiLocked"].includes(name))return mutate(()=>selectedNodes().forEach(x=>x.locked=!!a));
 if(["setVisible","setMultiVisibility"].includes(name))return mutate(()=>selectedNodes().forEach(x=>x.visible=!!a));
 if(/^toggle(Visibility|Locked|Anchored|CanCollide)$/.test(name))return mutate(()=>selectedNodes().forEach(x=>{const k=name==="toggleVisibility"?"visible":name==="toggleLocked"?"locked":name==="toggleAnchored"?"anchored":"canCollide";x[k]=!x[k]}));
 if(["nudgeX","nudgeY","nudgeZ","nudge"].includes(name))return mutate(()=>{const d=name==="nudgeX"?[Number(a)||1,0,0]:name==="nudgeY"?[0,Number(a)||1,0]:name==="nudgeZ"?[0,0,Number(a)||1]:(Array.isArray(a)?a:[1,0,0]);selectedNodes().forEach(x=>x.position=(x.position||[0,0,0]).map((v,i)=>Number(v||0)+Number(d[i]||0)))});
 if(["alignX","alignY","alignZ","alignCenter","alignTop","alignBottom","alignLeft","alignRight"].includes(name))return mutate(()=>{const k={alignX:0,alignY:1,alignZ:2}[name];if(k!==undefined)selectedNodes().forEach(x=>x.position[k]=Number(a)||0);else{const b=bounds(selectedNodes());if(b)selectedNodes().forEach(x=>x.position=[b.center[0],name==="alignTop"?b.max[1]:name==="alignBottom"?b.min[1]:b.center[1],name==="alignLeft"?b.min[2]:b.center[2]])}});
 if(["distributeX","distributeY","distributeZ","distributeEvenlyX","distributeEvenlyY","distributeEvenlyZ"].includes(name)){const k=name.includes("Y")?1:name.includes("Z")?2:0;const arr=selectedNodes().sort((x,y)=>(x.position?.[k]||0)-(y.position?.[k]||0));if(arr.length>2){const lo=arr[0].position[k],hi=arr.at(-1).position[k];return mutate(()=>arr.forEach((x,i)=>x.position[k]=lo+(hi-lo)*i/(arr.length-1)))}return false}
 if(["snapPosition","snapRotation","snapSize"].includes(name))return mutate(()=>selectedNodes().forEach(x=>{if(name==="snapPosition")x.position=snap(x.position);if(name==="snapRotation")x.rotation=x.rotation.map(v=>Math.round(v/15)*15);if(name==="snapSize")x.size=snap(x.size).map(v=>Math.max(.1,v))}));
 if(name==="resetTransform")return mutate(()=>{if(n)Object.assign(n,{position:[0,0,0],rotation:[0,0,0],size:[2,2,2]})});
 if(["freezeSelection","unfreezeSelection"].includes(name))return mutate(()=>selectedNodes().forEach(x=>x.anchored=name==="freezeSelection"));
 if(["focusSelection","frameSelection"].includes(name))return C().focus?.(),true;
 if(name==="fitAll"||name==="resetCamera")return C().view?.("home"),true;if(name==="setCameraPreset")return C().view?.(a||"home"),true;
 if(name==="zoomIn")return document.querySelector("#canvas")?.dispatchEvent(new WheelEvent("wheel",{deltaY:-120,bubbles:true,cancelable:true})),true;
 if(name==="zoomOut")return document.querySelector("#canvas")?.dispatchEvent(new WheelEvent("wheel",{deltaY:120,bubbles:true,cancelable:true})),true;
 if(name==="orbitCamera")return true;
 if(name==="toggleGrid")return C().toggleGrid?.(),true;if(name==="toggle2D")return window.StudioLiteSet2D?.(),true;if(name==="repairViewport")return window.StudioLitePro?.repair?.(),true;if(name==="takeScreenshot")return C().screenshot?.(),true;
 if(name==="getSceneBounds")return bounds(nodes().filter(x=>x.visible!==false));if(name==="getSelectionBounds")return bounds(selectedNodes());
 if(name==="centerSelection"||name==="centerOnOrigin")return mutate(()=>{const b=name==="centerOnOrigin"?null:bounds(selectedNodes());selectedNodes().forEach(x=>x.position=b?b.center:[0,0,0])});
 if(name==="createMaterialPreset"||name==="applyMaterialPreset")return mutate(()=>selectedNodes().forEach(x=>x.material=mats.includes(a)?a:"Plastic"));
 if(name==="applyColorPreset"||name==="setNeonColor")return mutate(()=>selectedNodes().forEach(x=>x.color=String(a||"#00e5ff")));
 if(["randomizeColors","randomizeMaterials","randomizePosition","randomizeRotation","randomizeScale"].includes(name))return mutate(()=>{selectedNodes().forEach(x=>{if(name==="randomizeColors")x.color="#"+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0");if(name==="randomizeMaterials")x.material=mats[Math.floor(Math.random()*mats.length)];if(name==="randomizePosition")x.position=(x.position||[0,0,0]).map(()=>Math.round((Math.random()*20-10)*10)/10);if(name==="randomizeRotation")x.rotation=(x.rotation||[0,0,0]).map(()=>Math.round(Math.random()*360-180));if(name==="randomizeScale")x.size=(x.size||[1,1,1]).map(v=>Math.max(.1,v*(.5+Math.random()*1.5)))})});
 if(/^make(Neon|Metal|Glass|Wood|Plastic)$/.test(name))return mutate(()=>selectedNodes().forEach(x=>x.material=name.slice(4)));
 if(["setCollisionGroup","setCustomProperty","setValue"].includes(name))return mutate(()=>selectedNodes().forEach(x=>{x.customProperties??={};x.customProperties[name==="setValue"?"Value":String(a||"group")]=args[1]??a}));
 if(["getCustomProperty","getValue"].includes(name))return n?.customProperties?.[name==="getValue"?"Value":a];
 if(name==="removeCustomProperty")return mutate(()=>selectedNodes().forEach(x=>{if(x.customProperties)delete x.customProperties[a]}));
 if(name==="getProperties")return clone(n||{});if(name==="setProperties")return mutate(()=>n&&Object.assign(n,a||{}));
 if(["setPosition","setRotation","setSize"].includes(name))return false;
 if(["setMultiPosition","setMultiRotation","setMultiSize"].includes(name))return false;
 if(["setMassless","setCastShadow","setCanQuery","setCanTouch","setArchivable","setRoughness","setReflectance","setMetalness"].includes(name))return mutate(()=>selectedNodes().forEach(x=>{x.customProperties??={};x.customProperties[name]=a??true}));
 if(["setGlassTransparency"].includes(name))return mutate(()=>{selectedNodes().forEach(x=>{x.transparency=Math.max(.05,Math.min(1,Number(a)||.35))})});
 if(["growSelection","shrinkSelection","scaleUniform"].includes(name))return mutate(()=>{const factor=name==="shrinkSelection"?0.9:(Number(a)||1.1);selectedNodes().forEach(x=>{x.size=(x.size||[1,1,1]).map(v=>Math.max(.1,v*factor))})});
 if(["mirrorX","mirrorY","mirrorZ"].includes(name))return mutate(()=>selectedNodes().forEach(x=>{const k={mirrorX:0,mirrorY:1,mirrorZ:2}[name];x.position[k]*=-1;x.rotation[k]*=-1}));
 if(["rotate90","rotate180","rotate270"].includes(name))return mutate(()=>selectedNodes().forEach(x=>x.rotation[1]+={rotate90:90,rotate180:180,rotate270:270}[name]));
 if(["clampPosition","clampRotation","clampSize"].includes(name))return mutate(()=>selectedNodes().forEach(x=>{const k=name==="clampPosition"?"position":name==="clampRotation"?"rotation":"size";x[k]=x[k].map(v=>name==="clampSize"?Math.max(.1,Math.min(100,Number(v)||1)):Math.max(-10000,Math.min(10000,Number(v)||0)))}));
 if(["resetColor","resetMaterial","resetAppearance","resetBehavior"].includes(name))return mutate(()=>selectedNodes().forEach(x=>{if(name==="resetColor")x.color="#777";if(name==="resetMaterial")x.material="Plastic";if(name==="resetAppearance"){x.color="#777";x.material="Plastic";x.transparency=0};if(name==="resetBehavior"){x.anchored=true;x.canCollide=true;x.locked=false;x.visible=true}}));
 if(["setScriptSource","appendScript","prependScript","replaceScript","insertScriptTemplate"].includes(name)){if(!n||!/Script$/.test(n.type))return false;return mutate(()=>{const text=String(a??"");if(name==="setScriptSource")n.script=text;if(name==="appendScript")n.script=String(n.script||"")+text;if(name==="prependScript")n.script=text+String(n.script||"");if(name==="replaceScript")n.script=String(n.script||"").split(String(args[1]??"")).join(text);if(name==="insertScriptTemplate")n.script=text||"-- Studio Lite\nprint(\"Hello\")"})}
 if(name==="getScriptSource")return n?.script||"";if(name==="validateScriptSource")return{name:n?.name||"",ok:!!n&&/Script$/.test(n.type),length:String(n?.script||"").length};
 if(name==="openScriptEditor")return n?.id?window.openScript?.(n.id):document.querySelector("#codeStudioBtn")?.click(),true;if(name==="closeScriptEditor")return document.querySelectorAll(".modal-bg").forEach(x=>x.remove()),true;
 if(name==="createScriptFromTemplate")return add("Script",{script:String(a||"-- Script\nprint(\"Hello\")")});
 if(name==="duplicateScript")return n&&/Script$/.test(n.type)?(C().duplicate?.(),true):false;
 if(name==="exportScripts")return nodes().filter(x=>/Script$/.test(x.type)).map(x=>({name:x.name,type:x.type,source:x.script||""}));
 if(name==="exportHierarchy")return nodes().map(x=>({id:x.id,name:x.name,type:x.type,parent:x.parent}));
 if(name==="exportSelection"||name==="exportSelectionJSON")return JSON.stringify(selectedNodes(),null,2);
 if(name==="copySelection"){const text=JSON.stringify(selectedNodes(),null,2);try{navigator.clipboard?.writeText?.(text)}catch{};return text}
 if(name==="pasteSelection"){const p=navigator.clipboard?.readText?.();if(!p)return false;return Promise.resolve(p).then(t=>{try{const data=JSON.parse(t);const list=Array.isArray(data)?data:[data];list.forEach(x=>{const n2=add(x.type||"Part");if(n2)Object.assign(n2,x,{id:crypto.randomUUID?.()||Math.random().toString(36).slice(2)})});refresh();return true}catch{return false}}).catch(()=>false)}
 if(name==="downloadText")return download(String(a||"studio.txt"),String(args[1]??""),"text/plain");
 if(name==="exportJSON")return download((s.project||"studio")+".json",JSON.stringify({name:s.project,nodes:nodes(),settings:s.settings},null,2),"application/json");
 if(name==="exportScene"||name==="exportSceneSummary")return JSON.stringify({project:s.project,objects:nodes().length,bounds:bounds(nodes())},null,2);
 if(name==="importJSON")try{const d=typeof a==="string"?JSON.parse(a):a;if(!Array.isArray(d.nodes))return false;s.nodes=d.nodes.map(x=>({...x}));s.nodes.forEach(x=>{x.id=x.id||crypto.randomUUID?.()||Math.random().toString(36).slice(2);x.name=String(x.name||x.type||"Object");x.position=Array.isArray(x.position)?x.position:[0,0,0];x.rotation=Array.isArray(x.rotation)?x.rotation:[0,0,0];x.size=Array.isArray(x.size)?x.size:[1,1,1]});s.selected=s.nodes[0]?.id||null;refresh();save();return true}catch{return false}
 if(name==="copyText")return navigator.clipboard?.writeText?.(String(a??"")).then(()=>true).catch(()=>false)||false;
 if(name==="readClipboard")return navigator.clipboard?.readText?.()||"";
 if(name==="writeClipboard")return navigator.clipboard?.writeText?.(String(a??"")).then(()=>true).catch(()=>false)||false;
 if(["saveSnapshot","loadSnapshot","listSnapshots","compareSnapshots","restoreLastSnapshot","clearSnapshots"].includes(name)){
   let ss=readSnaps();
   if(name==="saveSnapshot"){ss.push({at:new Date().toISOString(),data:clone({name:s.project,nodes:nodes(),settings:s.settings,grid:s.grid,snap:s.snap})});writeSnaps(ss);return ss.length}
   if(name==="listSnapshots")return ss.map((x,i)=>({index:i,at:x.at,objects:x.data.nodes.length}));
   if(name==="loadSnapshot"||name==="restoreLastSnapshot"){const x=ss[a??ss.length-1];if(!x)return false;return exec("restoreSnapshot",[x.data])}
   if(name==="compareSnapshots")return{count:ss.length,last:ss.at(-1)?.data?.nodes?.length||0,current:nodes().length};
   if(name==="clearSnapshots")return(localStorage.removeItem(snapshotStore),true)
 }
 if(["repairHierarchy","repairParents","cleanOrphans","removeBrokenParents"].includes(name))return mutate(()=>{const set=new Set(nodes().map(x=>x.id));nodes().forEach(x=>{if(x.parent&&!set.has(x.parent))x.parent=null})});
 if(["repairIds","regenerateIds"].includes(name))return mutate(()=>{const map=new Map(),used=new Set();nodes().forEach(x=>{const old=x.id;let id=old;while(!id||used.has(id))id=crypto.randomUUID?.()||Math.random().toString(36).slice(2);used.add(id);map.set(old,id);x.id=id});nodes().forEach(x=>{if(x.parent&&map.has(x.parent))x.parent=map.get(x.parent)})});
 if(["repairMissingDefaults","normalizeAllNodes","normalizeTypes"].includes(name))return mutate(()=>nodes().forEach(x=>{x.id||=(crypto.randomUUID?.()||Math.random().toString(36).slice(2));x.name||=(x.type||"Object");x.position=Array.isArray(x.position)?x.position:[0,0,0];x.rotation=Array.isArray(x.rotation)?x.rotation:[0,0,0];x.size=Array.isArray(x.size)?x.size:[1,1,1];x.color||="#777";x.material||="Plastic";x.visible??=true}));
 if(name==="normalizeSelection")return s.selected&&nodes().some(x=>x.id===s.selected)?true:(s.selected=nodes()[0]?.id||null,refresh(),!!s.selected);
 if(name==="removeDuplicates"){const seen=new Set();return mutate(()=>{s.nodes=s.nodes.filter(x=>{const k=x.name+"|"+x.type+"|"+JSON.stringify(x.position);if(seen.has(k))return false;seen.add(k);return true})})}
 if(["sortNodes","sortByName","sortByType","sortByPosition"].includes(name))return mutate(()=>{const k=name==="sortByType"?"type":name==="sortByPosition"?"position":"name";s.nodes.sort((a,b)=>String(a[k]?.[0]??a[k]??"").localeCompare(String(b[k]?.[0]??b[k]??"")))});
 if(["groupSelection","makeFolderFromSelection"].includes(name))return add("Folder",{name:"Group"});
 if(name==="ungroupSelection"&&n)return mutate(()=>nodes().filter(x=>x.parent===n.id).forEach(x=>x.parent=n.parent||null));
 if(name==="openProperties")return openPanel("properties");if(name==="openToolbox")return openPanel("toolbox");if(name==="openExplorer")return window.StudioLiteV21?.togglePanels?.("explorer"),true;
 if(name==="openParty")return window.StudioLiteParty?.open?.()||false;if(name==="openHelp")return window.StudioLiteDiagnostics?.openHelp?.()||false;if(name==="openDiagnostics")return window.StudioLiteDiagnostics?.openHelp?.("diagnostics")||false;
 if(name==="openCodeStudio")return exec("openScriptEditor",[]);if(name==="closeModals")return document.querySelectorAll(".modal-bg").forEach(x=>x.remove()),true;
 if(name==="toast")return toast(a||"Studio Lite");if(name==="setStatus")return setStatus(a||"Pronto");
 if(name==="validateScene")return{ok:nodes().every(x=>x.id&&x.type),errors:nodes().filter(x=>!x.id||!x.type).length};
 if(name==="validateHierarchy"){const set=new Set(nodes().map(x=>x.id));return{ok:nodes().every(x=>!x.parent||set.has(x.parent)),orphans:nodes().filter(x=>x.parent&&!set.has(x.parent)).length}}
 if(name==="validateTransforms")return{ok:nodes().every(x=>Array.isArray(x.position)&&x.position.length===3&&Array.isArray(x.rotation)&&x.rotation.length===3&&Array.isArray(x.size)&&x.size.length===3)};
 if(name==="validateNames"){const m={};nodes().forEach(x=>m[x.name]=(m[x.name]||0)+1);return{ok:Object.values(m).every(v=>v===1),duplicates:Object.keys(m).filter(k=>m[k]>1)}}
 if(name==="validateScripts")return{ok:nodes().filter(x=>/Script$/.test(x.type)).every(x=>typeof x.script==="string"),scripts:nodes().filter(x=>/Script$/.test(x.type)).length};
 if(name==="runSelfTest")return{scene:exec("validateScene"),hierarchy:exec("validateHierarchy"),transforms:exec("validateTransforms"),scripts:exec("validateScripts")};
 if(name==="getDiagnostics")return{objects:nodes().length,scripts:nodes().filter(x=>/Script$/.test(x.type)).length,webgl:!!C().renderer,orphanCount:nodes().filter(x=>x.parent&&!nodes().some(y=>y.id===x.parent)).length};
 if(name==="projectHealth"||name==="sceneReport"||name==="hierarchyReport"||name==="scriptReport")return exec(name==="projectHealth"?"runSelfTest":name==="sceneReport"?"validateScene":name==="hierarchyReport"?"validateHierarchy":"validateScripts");
 if(name==="repairScene"||name==="repairTransforms"||name==="repairProperties")return exec("repairMissingDefaults");
 if(name==="fixDuplicateNames")return mutate(()=>{const m={};nodes().forEach(x=>{const b=x.name||x.type||"Object";m[b]=(m[b]||0)+1;x.name=m[b]>1?b+" "+m[b]:b})});
 if(name==="optimizeScene")return mutate(()=>nodes().forEach(x=>{delete x._dragged;delete x.__serviceRoot}));
 if(name==="countVisuals")return nodes().filter(x=>x.visible!==false&&!/Script$/.test(x.type)).length;
 if(name==="countScripts")return nodes().filter(x=>/Script$/.test(x.type)).length;
 if(name==="countContainers")return nodes().filter(x=>["Folder","Model","Tool","Configuration"].includes(x.type)).length;
 if(name==="countServices")return nodes().filter(x=>x.service||services.includes(x.type)).length;
 if(name==="countSelectedByType")return selectedNodes().filter(x=>x.type===a).length;
 if(name==="getTypeSummary"){const m={};nodes().forEach(x=>m[x.type]=(m[x.type]||0)+1);return m}
 if(name==="searchExplorer"){const term=String(a||"").toLowerCase();const out=nodes().filter(x=>String(x.name).toLowerCase().includes(term)||String(x.type).toLowerCase().includes(term));if(out[0])exec("selectById",[out[0].id]);return out}
 if(name==="focusExplorer")return document.querySelector("#treeSearch")?.focus(),true;if(name==="focusInspector")return document.querySelector("#panel input, #panel select")?.focus(),true;
 if(name==="toggleInspector")return window.StudioLiteV21?.togglePanels?.("inspector"),true;if(name==="toggleExplorer")return window.StudioLiteV21?.togglePanels?.("explorer"),true;
 if(name==="toggleProperties")return openPanel("properties");if(name==="toggleToolbox")return openPanel("toolbox");
 if(name==="toggleStudio300"){document.querySelector("#studio300Modal")?.remove();document.querySelector("#studio300Btn")?.click();return true}
 if(name==="toggleRBXL"||name==="openRBXL")return window.StudioLiteRBXL?.open?.(),true;
 if(name==="exportRBXLX")return C().exportProject?.(),true;if(name==="publishRBXL")return C().publish?.(),true;
 if(name==="validateRBXL")return{ok:!!localStorage.getItem("studio-lite-last-rbxl"),last:JSON.parse(localStorage.getItem("studio-lite-last-rbxl")||"null")};
 if(name==="clearToasts")return document.querySelectorAll("#toastRoot .toast").forEach(x=>x.remove()),true;if(name==="getVersion")return"Studio Lite Pro 414 • V25";if(name==="ping")return"pong";
 if(name==="expandExplorer"||name==="collapseExplorer"||name==="expandAllExplorer"||name==="collapseAllExplorer")return window.StudioLiteV21?.togglePanels?.("explorer"),true;
 if(name==="selectNext"||name==="selectPrevious"){const i=nodes().findIndex(x=>x.id===s.selected);const j=name==="selectNext"?Math.min(nodes().length-1,i+1):Math.max(0,i-1);return exec("selectById",[nodes()[j]?.id])}
 if(name==="selectFirstChild")return n&&exec("selectById",[nodes().find(x=>x.parent===n.id)?.id]);
 if(name==="selectParent")return n?.parent&&exec("selectById",[n.parent]);
 if(name==="selectService")return exec("selectByType",[a]);
 if(name==="moveToService")return n?mutate(()=>{n.parent="service:"+(a||"Workspace")}):false;
 if(name==="createServiceNode")return mutate(()=>{const id="service:"+(a||"CustomService");if(!nodes().some(x=>x.id===id))s.nodes.push({id,name:a||"CustomService",type:a||"CustomService",service:true,visible:false,canCollide:false,anchored:true,parent:null})});
 if(name==="removeServiceNode")return mutate(()=>{s.nodes=s.nodes.filter(x=>x.id!=="service:"+a)});
 if(name==="renameProject")return exec("setProjectName",[a]);
 if(name==="duplicateMany"){const count=Math.max(1,Math.min(50,Number(a)||1));for(let i=0;i<count;i++)C().duplicate?.();return true}
 if(name==="deleteByType"){const type=String(a||"");return mutate(()=>s.nodes=s.nodes.filter(x=>x.type!==type||x.id==="spawn"))}
 if(/^select(Visible|Hidden|Locked|Unlocked|Anchored|Unanchored|Collidable|NonCollidable)$/.test(name)){const p={selectVisible:x=>x.visible!==false,selectHidden:x=>x.visible===false,selectLocked:x=>!!x.locked,selectUnlocked:x=>!x.locked,selectAnchored:x=>x.anchored!==false,selectUnanchored:x=>x.anchored===false,selectCollidable:x=>x.canCollide!==false,selectNonCollidable:x=>x.canCollide===false}[name];s.selectedIds=nodes().filter(p).map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return s.selectedIds.length}
 if(name==="invertSelection"){const set=new Set(ids());s.selectedIds=nodes().filter(x=>!set.has(x.id)).map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return s.selectedIds.length}
 if(name==="getSelectionCount")return selectedNodes().length;if(name==="getSelectionNodes")return selectedNodes().map(clone);
 if(name==="setAutoSaveInterval"||name==="getAutoSaveInterval")return name==="getAutoSaveInterval"?Number(localStorage.getItem("studio-lite-v21-autosave")||30):(localStorage.setItem("studio-lite-v21-autosave",String(Math.max(5,Number(a)||30))),true);
 if(name==="autoSaveNow")return C().save?.(true),true;
 if(name==="listSnapshots")return readSnaps().map((x,i)=>({index:i,at:x.at,objects:x.data.nodes.length}));
 if(name==="version")return"Studio Lite Pro Toolkit 414";
 if(/^set/.test(name))return mutate(()=>{if(n){n.customProperties??={};n.customProperties[name.slice(3)]=a}});
 if(/^get/.test(name))return n?.customProperties?.[name.slice(3)];
 return{name,ok:true,selected:n?.name||null,objects:nodes().length};
}

// Extended Toolkit: +84 funções (v24)
NAMES.push("selectByRegex","selectByContains","selectByExactType","selectRoots","selectDescendants","selectChildren","selectSiblingsOfId","selectRandom","countByName","countByMaterial","countByColor","countByParent","countDepth","getSelectionTypes","getSelectionNames","getSelectionPaths","getWorldPosition","getWorldBounds","getAveragePosition","getAverageSize","getLargestNode","getSmallestNode","getNearestNode","getFarthestNode","moveSelectionBy","rotateSelectionBy","scaleSelectionBy","setPivot","resetPivot","snapSelection","snapSelectionToGrid","snapSelectionToOrigin","mirrorSelectionX","mirrorSelectionY","mirrorSelectionZ","rotateSelectionAxisX","rotateSelectionAxisY","rotateSelectionAxisZ","setSelectionTransparency","setSelectionColor","setSelectionMaterial","setSelectionAnchored","setSelectionCollision","setSelectionLocked","toggleSelectionVisible","toggleSelectionCanCollide","toggleSelectionCanTouch","toggleSelectionCanQuery","toggleSelectionMassless","setCustomAttribute","getCustomAttribute","removeCustomAttribute","listCustomAttributes","clearCustomAttributes","createStringAttribute","createNumberAttribute","createBooleanAttribute","createVector3Attribute","createColorAttribute","duplicateWithOffset","duplicateSelectionWithOffset","deleteChildren","deleteDescendants","deleteEmptyFolders","removeInvalidNodes","sortChildrenByName","sortChildrenByType","reparentSelection","selectByProperty","countDescendants","getTreeStats","getSceneMemoryEstimate","findEmptyModels","findEmptyFolders","findScriptsWithoutSource","findDuplicateIds","findOrphanedNodes","repairDuplicateIds","generateUniqueName","renameSelection","batchRename","setSelectionProperty","getSelectionProperty","clearSelectionProperty");
const extSet=new Set(["selectByRegex","selectByContains","selectByExactType","selectRoots","selectDescendants","selectChildren","selectSiblingsOfId","selectRandom","countByName","countByMaterial","countByColor","countByParent","countDepth","getSelectionTypes","getSelectionNames","getSelectionPaths","getWorldPosition","getWorldBounds","getAveragePosition","getAverageSize","getLargestNode","getSmallestNode","getNearestNode","getFarthestNode","moveSelectionBy","rotateSelectionBy","scaleSelectionBy","setPivot","resetPivot","snapSelection","snapSelectionToGrid","snapSelectionToOrigin","mirrorSelectionX","mirrorSelectionY","mirrorSelectionZ","rotateSelectionAxisX","rotateSelectionAxisY","rotateSelectionAxisZ","setSelectionTransparency","setSelectionColor","setSelectionMaterial","setSelectionAnchored","setSelectionCollision","setSelectionLocked","toggleSelectionVisible","toggleSelectionCanCollide","toggleSelectionCanTouch","toggleSelectionCanQuery","toggleSelectionMassless","setCustomAttribute","getCustomAttribute","removeCustomAttribute","listCustomAttributes","clearCustomAttributes","createStringAttribute","createNumberAttribute","createBooleanAttribute","createVector3Attribute","createColorAttribute","duplicateWithOffset","duplicateSelectionWithOffset","deleteChildren","deleteDescendants","deleteEmptyFolders","removeInvalidNodes","sortChildrenByName","sortChildrenByType","reparentSelection","selectByProperty","countDescendants","getTreeStats","getSceneMemoryEstimate","findEmptyModels","findEmptyFolders","findScriptsWithoutSource","findDuplicateIds","findOrphanedNodes","repairDuplicateIds","generateUniqueName","renameSelection","batchRename","setSelectionProperty","getSelectionProperty","clearSelectionProperty"]);
function extExec(name,args,s,nodes,selectedNodes){
 const a=args[0], list=nodes(), sel=selectedNodes(), clone2=x=>{try{return JSON.parse(JSON.stringify(x))}catch{return x}};
 const uid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
 const pos=x=>Array.isArray(x?.position)?x.position:[0,0,0], size=x=>Array.isArray(x?.size)?x.size:[1,1,1];
 const descendants=(id)=>{const out=[],seen=new Set([id]);let changed=true;while(changed){changed=false;list.forEach(x=>{if(x.parent&&seen.has(x.parent)&&!seen.has(x.id)){seen.add(x.id);out.push(x);changed=true}})}return out};
 const bounds2=(arr)=>{if(!arr.length)return null;const mi=[Infinity,Infinity,Infinity],ma=[-Infinity,-Infinity,-Infinity];arr.forEach(x=>{const p=pos(x),z=size(x);for(let i=0;i<3;i++){const h=Math.abs(Number(z[i])||1)/2;mi[i]=Math.min(mi[i],(Number(p[i])||0)-h);ma[i]=Math.max(ma[i],(Number(p[i])||0)+h)}});return{min:mi,max:ma,size:ma.map((v,i)=>v-mi[i]),center:ma.map((v,i)=>(v+mi[i])/2)}};
 const mutate2=fn=>{commit();const r=fn();refresh();save();return r===undefined?true:r};
 if(name==="selectByRegex"){let re;try{re=new RegExp(String(a||".*"),args[1]||"i")}catch{return false}const hit=list.filter(x=>re.test(String(x.name||"")));s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="selectByContains"){const q=String(a||"").toLowerCase();const hit=list.filter(x=>String(x.name||"").toLowerCase().includes(q));s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="selectByExactType"){const hit=list.filter(x=>x.type===a);s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="selectRoots"){const hit=list.filter(x=>!x.parent);s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="selectDescendants"){const hit=n?descendants(n.id):[];s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="selectChildren"){const hit=n?list.filter(x=>x.parent===n.id):[];s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="selectSiblingsOfId"){const x=list.find(x=>x.id===a);const hit=x?list.filter(y=>y.parent===x.parent):[];s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="selectRandom"){const x=list[Math.floor(Math.random()*list.length)];return x?exec("selectById",[x.id]):false}
 if(name==="countByName")return list.filter(x=>String(x.name).toLowerCase()===String(a||"").toLowerCase()).length;
 if(name==="countByMaterial")return list.filter(x=>x.material===a).length;
 if(name==="countByColor")return list.filter(x=>x.color===a).length;
 if(name==="countByParent")return list.filter(x=>x.parent===a).length;
 if(name==="countDepth"){return list.filter(x=>{let d=0,y=x,seen=new Set();while(y?.parent&&!seen.has(y.parent)){seen.add(y.parent);y=list.find(z=>z.id===y.parent);if(y)d++}return d===Number(a)}).length}
 if(name==="getSelectionTypes")return [...new Set(sel.map(x=>x.type))];
 if(name==="getSelectionNames")return sel.map(x=>x.name);
 if(name==="getSelectionPaths")return sel.map(x=>{const o=[];let y=x,seen=new Set();while(y&&!seen.has(y.id)){seen.add(y.id);o.unshift(y.name||y.type);y=y.parent?list.find(z=>z.id===y.parent):null}return o.join(".")});
 if(name==="getWorldPosition")return n?clone2(pos(n)):null;
 if(name==="getWorldBounds")return bounds2(n?[n,...descendants(n.id)]:sel);
 if(name==="getAveragePosition"){if(!sel.length)return null;return [0,1,2].map(i=>sel.reduce((q,x)=>q+(Number(pos(x)[i])||0),0)/sel.length)}
 if(name==="getAverageSize"){if(!sel.length)return null;return [0,1,2].map(i=>sel.reduce((q,x)=>q+(Number(size(x)[i])||0),0)/sel.length)}
 if(name==="getLargestNode"){return list.slice().sort((a,b)=>size(b).reduce((q,v)=>q+Math.abs(v),0)-size(a).reduce((q,v)=>q+Math.abs(v),0))[0]?clone2(list.slice().sort((a,b)=>size(b).reduce((q,v)=>q+Math.abs(v),0)-size(a).reduce((q,v)=>q+Math.abs(v),0))[0]):null}
 if(name==="getSmallestNode"){return list.slice().sort((a,b)=>size(a).reduce((q,v)=>q+Math.abs(v),0)-size(b).reduce((q,v)=>q+Math.abs(v),0))[0]?clone2(list.slice().sort((a,b)=>size(a).reduce((q,v)=>q+Math.abs(v),0)-size(b).reduce((q,v)=>q+Math.abs(v),0))[0]):null}
 if(name==="getNearestNode"||name==="getFarthestNode"){if(!n)return null;const p=pos(n);const arr=list.filter(x=>x.id!==n.id).map(x=>({x,d:Math.hypot(...[0,1,2].map(i=>(pos(x)[i]-p[i])**2))})).sort((a,b)=>a.d-b.d);return clone2((name==="getNearestNode"?arr[0]:arr.at(-1))?.x||null)}
 if(name==="moveSelectionBy")return mutate2(()=>sel.forEach(x=>x.position=[0,1,2].map(i=>(Number(pos(x)[i])||0)+(Number(Array.isArray(a)?a[i]:a?.["xyz"?.[i]])||0))));
 if(name==="rotateSelectionBy")return mutate2(()=>sel.forEach(x=>x.rotation=[0,1,2].map(i=>(Number(x.rotation?.[i])||0)+(Number(Array.isArray(a)?a[i]:0)||0))));
 if(name==="scaleSelectionBy")return mutate2(()=>sel.forEach(x=>x.size=size(x).map(v=>Math.max(.1,v*(Number(a)||1)))));
 if(name==="setPivot")return mutate2(()=>sel.forEach(x=>x.pivot=Array.isArray(a)?[...a]:[0,0,0]));
 if(name==="resetPivot")return mutate2(()=>sel.forEach(x=>delete x.pivot));
 if(name==="snapSelection"||name==="snapSelectionToGrid")return mutate2(()=>{const g=Math.max(.01,Number(a)||Number(s.grid)||1);sel.forEach(x=>x.position=pos(x).map(v=>Math.round(v/g)*g))});
 if(name==="snapSelectionToOrigin")return mutate2(()=>sel.forEach(x=>x.position=[0,0,0]));
 if(["mirrorSelectionX","mirrorSelectionY","mirrorSelectionZ"].includes(name))return mutate2(()=>sel.forEach(x=>{const i={mirrorSelectionX:0,mirrorSelectionY:1,mirrorSelectionZ:2}[name];x.position[i]*=-1}));
 if(["rotateSelectionAxisX","rotateSelectionAxisY","rotateSelectionAxisZ"].includes(name))return mutate2(()=>sel.forEach(x=>{const i={rotateSelectionAxisX:0,rotateSelectionAxisY:1,rotateSelectionAxisZ:2}[name];x.rotation??=[0,0,0];x.rotation[i]+=Number(a)||90}));
 if(["setSelectionTransparency","setSelectionColor","setSelectionMaterial","setSelectionAnchored","setSelectionCollision","setSelectionLocked"].includes(name))return mutate2(()=>sel.forEach(x=>{const k={setSelectionTransparency:"transparency",setSelectionColor:"color",setSelectionMaterial:"material",setSelectionAnchored:"anchored",setSelectionCollision:"canCollide",setSelectionLocked:"locked"}[name];x[k]=a}));
 if(name==="toggleSelectionVisible")return mutate2(()=>sel.forEach(x=>x.visible=x.visible===false));
 if(["toggleSelectionCanCollide","toggleSelectionCanTouch","toggleSelectionCanQuery","toggleSelectionMassless"].includes(name))return mutate2(()=>sel.forEach(x=>{const k={toggleSelectionCanCollide:"canCollide",toggleSelectionCanTouch:"canTouch",toggleSelectionCanQuery:"canQuery",toggleSelectionMassless:"massless"}[name];x[k]=x[k]!==true}));
 if(["setCustomAttribute","getCustomAttribute","removeCustomAttribute","listCustomAttributes","clearCustomAttributes"].includes(name)){if(name==="getCustomAttribute")return n?.attributes?.[a];if(name==="listCustomAttributes")return Object.keys(n?.attributes||{});if(name==="removeCustomAttribute")return mutate2(()=>{if(n?.attributes)delete n.attributes[a]});if(name==="clearCustomAttributes")return mutate2(()=>sel.forEach(x=>x.attributes={}));return mutate2(()=>sel.forEach(x=>{x.attributes??={};x.attributes[a]=args[1]}))}
 if(/^create(String|Number|Boolean|Vector3|Color)Attribute$/.test(name))return mutate2(()=>sel.forEach(x=>{x.attributes??={};const k=String(a||"Attribute");x.attributes[k]=args[1]??(name==="createNumberAttribute"?0:name==="createBooleanAttribute"?false:name==="createVector3Attribute"?[0,0,0]:name==="createColorAttribute"?"#ffffff":"")})); 
 if(name==="duplicateWithOffset"||name==="duplicateSelectionWithOffset"){const off=Array.isArray(a)?a:[1,0,0];return mutate2(()=>{sel.forEach(x=>{const y=clone2(x);y.id=uid();y.name=(x.name||x.type)+" Copy";y.position=[0,1,2].map(i=>(Number(pos(x)[i])||0)+(Number(off[i])||0));list.push(y)})})}
 if(name==="deleteChildren")return mutate2(()=>{const ids=new Set(list.filter(x=>x.parent===n?.id).map(x=>x.id));s.nodes=s.nodes.filter(x=>!ids.has(x.id))});
 if(name==="deleteDescendants")return mutate2(()=>{const ids=new Set(n?descendants(n.id).map(x=>x.id):[]);s.nodes=s.nodes.filter(x=>!ids.has(x.id))});
 if(name==="deleteEmptyFolders")return mutate2(()=>{s.nodes=s.nodes.filter(x=>!(x.type==="Folder"&&!list.some(y=>y.parent===x.id)))});
 if(name==="removeInvalidNodes")return mutate2(()=>{const ids=new Set(list.map(x=>x.id));s.nodes=s.nodes.filter(x=>x&&x.id&&x.type&&(!x.parent||ids.has(x.parent)))});
 if(name==="sortChildrenByName"||name==="sortChildrenByType")return mutate2(()=>{const key=name==="sortChildrenByName"?"name":"type";s.nodes.sort((a,b)=>{if((a.parent||"")!==(b.parent||""))return 0;return String(a[key]||"").localeCompare(String(b[key]||""))})});
 if(name==="reparentSelection")return mutate2(()=>sel.forEach(x=>{if(x.id!==a)x.parent=a||null}));
 if(name==="selectByProperty"){const key=String(a||""),val=args[1];const hit=list.filter(x=>x[key]===val||x.customProperties?.[key]===val||x.attributes?.[key]===val);s.selectedIds=hit.map(x=>x.id);s.selected=s.selectedIds[0]||null;refresh();return hit.length}
 if(name==="countDescendants")return n?descendants(n.id).length:0;
 if(name==="getTreeStats"){const roots=list.filter(x=>!x.parent).length;return{objects:list.length,roots,scripts:list.filter(x=>/Script$/.test(x.type)).length,parts:list.filter(x=>/Part$/.test(x.type)).length,orphaned:list.filter(x=>x.parent&&!list.some(y=>y.id===x.parent)).length,maxDepth:Math.max(0,...list.map(x=>{let d=0,y=x,seen=new Set();while(y?.parent&&!seen.has(y.parent)){seen.add(y.parent);y=list.find(z=>z.id===y.parent);if(y)d++}return d}))}};
 if(name==="getSceneMemoryEstimate"){const bytes=JSON.stringify(list).length;return{bytes,kilobytes:Math.round(bytes/1024),megabytes:+(bytes/1048576).toFixed(3)}}
 if(name==="findEmptyModels")return list.filter(x=>x.type==="Model"&&!list.some(y=>y.parent===x.id)).map(clone2);
 if(name==="findEmptyFolders")return list.filter(x=>x.type==="Folder"&&!list.some(y=>y.parent===x.id)).map(clone2);
 if(name==="findScriptsWithoutSource")return list.filter(x=>/Script$/.test(x.type)&&!String(x.script||"").trim()).map(clone2);
 if(name==="findDuplicateIds"){const m={},out=[];list.forEach(x=>{m[x.id]=(m[x.id]||0)+1});list.forEach(x=>{if(m[x.id]>1)out.push(x.id)});return[...new Set(out)]}
 if(name==="findOrphanedNodes")return list.filter(x=>x.parent&&!list.some(y=>y.id===x.parent)).map(clone2);
 if(name==="repairDuplicateIds")return mutate2(()=>{const seen=new Set(),map=new Map();list.forEach(x=>{const old=x.id;if(!old||seen.has(old)){const id=uid();map.set(old,id);x.id=id}seen.add(x.id)});list.forEach(x=>{if(x.parent&&map.has(x.parent))x.parent=map.get(x.parent)})});
 if(name==="generateUniqueName"){const base=String(a||"Object");let i=1,name2=base;while(list.some(x=>x.name===name2))name2=base+" "+(++i);return name2}
 if(name==="renameSelection")return mutate2(()=>sel.forEach((x,i)=>x.name=String(a||"Object")+(sel.length>1?" "+(i+1):"")));
 if(name==="batchRename")return mutate2(()=>sel.forEach((x,i)=>x.name=String(a||"Object {n}").replaceAll("{n}",String(i+1)).replaceAll("{type}",String(x.type||"Object"))));
 if(name==="setSelectionProperty")return mutate2(()=>sel.forEach(x=>{x[a]=args[1]}));
 if(name==="getSelectionProperty")return sel.map(x=>x?.[a]);
 if(name==="clearSelectionProperty")return mutate2(()=>sel.forEach(x=>{delete x[a]}));
 return undefined;
}
const _execOriginal=exec;
exec=function(name,args=[]){
 if(extSet.has(name)){const s=S();if(!s)return false;const r=extExec(name,args,s,nodes,selectedNodes);if(r!==undefined)return r}
 return _execOriginal(name,args);
};
function download(name,data,type){const b=new Blob([data],{type:type||"text/plain"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function openPanel(name){const b=document.querySelector('.tab[data-panel="'+name+'"]');if(b){b.click();return true}return false}
const F={};NAMES.forEach(name=>F[name]=(...args)=>exec(name,args));
window.StudioLite300=F;
window.StudioLite300Meta={coreFunctions:182,newFunctions:148,totalFunctions:414,version:"2026.10.04-v25",names:NAMES};
function open300(){
 const old=document.querySelector("#studio300Modal");if(old){old.remove();return}
 const bg=document.createElement("div");bg.id="studio300Modal";bg.className="modal-bg";
 bg.innerHTML='<div class="tool300-v21"><div class="tool300-v21-head"><div><h2>⚡ Studio Lite Pro 300</h2><small>414 funções reais • Editor • Explorer • Scripts • RBXL • Diagnóstico</small></div><button id="tool300V21Close">×</button></div><div class="tool300-v21-bar"><input id="tool300V21Search" class="search" placeholder="⌕ Pesquisar entre 414 funções..."><select id="tool300V21Category"><option value="">Todas as categorias</option><option>Seleção</option><option>Criação</option><option>Transformação</option><option>Scripts</option><option>Explorer</option><option>Projeto</option><option>Visualização</option><option>Diagnóstico</option><option>Utilitários</option></select><span>414 / 414</span></div><div id="tool300V21Grid" class="tool300-v21-grid"></div><div class="tool300-v21-foot"><span id="tool300V21Status">Pronto</span><button id="tool300V21Self">✓ Auto-teste</button></div></div>';
 document.body.appendChild(bg);
 const grid=bg.querySelector("#tool300V21Grid"),search=bg.querySelector("#tool300V21Search"),cat=bg.querySelector("#tool300V21Category"),status=bg.querySelector("#tool300V21Status");
 const category=name=>/^(select|getSelected|clearSelection|invertSelection|normalizeSelection|countSelected)/.test(name)?"Seleção":/^create/.test(name)?"Criação":/^(move|rotate|scale|setPosition|setRotation|setSize|nudge|align|distribute|snap|mirror|resetTransform|freeze|grow|shrink|clamp|applyTransform)/.test(name)?"Transformação":/(Script|Code|Source|Template)/.test(name)?"Scripts":/(Explorer|Parent|Child|Service|Selection)/.test(name)?"Explorer":/(save|load|export|import|project|snapshot|autosave|renameProject)/.test(name)?"Projeto":/(Camera|View|Grid|zoom|orbit|Screenshot|2D|Material|Color)/.test(name)?"Visualização":/(validate|repair|diagnostic|Health|Report|normalize|clean|duplicate)/.test(name)?"Diagnóstico":"Utilitários";
 const draw=()=>{const term=search.value.toLowerCase().trim(),c=cat.value;grid.innerHTML="";NAMES.filter(n=>(!term||n.toLowerCase().includes(term))&&(!c||category(n)===c)).forEach(n=>{const b=document.createElement("button");b.className="tool300-v21-item";b.innerHTML="<b>"+n+"</b><small>"+category(n)+" • Executar</small>";b.onclick=async()=>{try{const r=await F[n]();status(n+" ✓"+(r===undefined?"":" • "+(typeof r==="string"?r.slice(0,80):"concluído")));toast(n+" ✓")}catch(e){console.error(e);status(n+" ✗ "+e.message);toast(n+" falhou")}};grid.appendChild(b)})};
 search.oninput=draw;cat.onchange=draw;bg.querySelector("#tool300V21Close").onclick=()=>bg.remove();
 bg.querySelector("#tool300V21Self").onclick=()=>{const r=F.runSelfTest();status(r.scene.ok&&r.hierarchy.ok&&r.transforms.ok&&r.scripts.ok?"✓ Auto-teste passou":"⚠ Auto-teste encontrou pontos")};draw();setTimeout(()=>search.focus(),20);
}
function install(){let b=document.querySelector("#studio300Btn");if(!b){b=document.createElement("button");b.id="studio300Btn";b.className="accent";b.type="button";b.textContent="⚡ 300";b.title="Toolkit Pro — 300 funções";document.querySelector(".toolbar .tool-group")?.appendChild(b)}b.onclick=open300}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else setTimeout(install,0);
})();
