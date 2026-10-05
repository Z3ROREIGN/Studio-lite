/* Studio Lite Extra — stable compatibility layer for Marketplace plugins/templates. */
(()=>{"use strict";
const C=()=>window.StudioLite300||{};
const call=(name,...args)=>{try{const fn=C()[name];return typeof fn==="function"?fn(...args):undefined}catch(e){console.error("StudioLiteExtra",name,e);return undefined}};
const toast=x=>window.toast?.(String(x));
const refresh=()=>call("getNodes")&&document.querySelector("#tree")&&document.querySelector("#treeSearch")?.dispatchEvent(new Event("input"));
const selectedCount=()=>Number(call("getSelectionCount")||0);
const selectedNames=()=>call("getSelectionNames")||[];
const F={
  duplicateOffset(amount=2,axis="x"){const n=selectedCount();if(!n)return false;const ok=call("duplicateSelection");toast(ok!==false?"Seleção duplicada":"Não foi possível duplicar");return ok!==false},
  groupAsModel(name="Model"){const ok=call("groupSelection");if(name&&ok!==false)call("renameNode",name);toast(ok!==false?"Model criado":"Selecione objetos primeiro");return ok!==false},
  createFolderFromSelection(name="Folder"){const ok=call("makeFolderFromSelection");if(name&&ok!==false)call("renameNode",name);toast(ok!==false?"Folder criado":"Selecione objetos primeiro");return ok!==false},
  createPointLight(){const ok=call("createPointLight");toast(ok!==false?"PointLight criado":"Não foi possível criar PointLight");return ok!==false},
  setProperty(key,value){const ok=call("setProperties",{[key]:value});return ok!==false},
  getProperty(key){const p=call("getProperties")||{};return p[key]},
  setMaterial(material="Plastic"){const ok=call("setMaterial",material);toast(ok!==false?"Material aplicado":"Selecione um objeto");return ok!==false},
  setColor(color="#ffffff"){const ok=call("setColor",color);toast(ok!==false?"Cor aplicada":"Selecione um objeto");return ok!==false},
  removeEmptyContainers(){const ok=call("cleanOrphans");toast("Otimização concluída");return ok!==false},
  repairOrphans(){const ok=call("repairParents");toast("Hierarquia reparada");return ok!==false},
  repairDefaults(){const ok=call("repairMissingDefaults");toast("Padrões reparados");return ok!==false},
  sceneStats(){return {objects:Number(call("countNodes")||0),selected:selectedCount(),scripts:Number(call("countNodes")||0)-Number(call("countNodes")||0)+Number((call("getScripts")||[]).length||0),parts:Number(call("countParts")||0),hidden:Number((call("getHiddenNodes")||[]).length||0),anchored:Number((call("getAnchoredNodes")||[]).length||0),locked:Number((call("getLockedNodes")||[]).length||0)}},
  createTemplate(id="baseplate"){
    const defs={
      baseplate:[["createPart","Baseplate"],["createSpawn","SpawnLocation"]],
      obby:[["createPart","Start"],["createPart","Checkpoint 1"],["createPart","Checkpoint 2"],["createPart","Finish"],["createSpawn","SpawnLocation"]],
      simulator:[["createPart","Baseplate"],["createPart","SimulatorPad"],["createFolder","Zones"],["createScript","SimulatorScript"]],
      tycoon:[["createPart","Baseplate"],["createPart","ClaimPad"],["createPart","Factory"],["createFolder","TycoonData"],["createScript","TycoonScript"]],
      rpg:[["createPart","Baseplate"],["createPart","TownCenter"],["createPart","QuestArea"],["createFolder","NPCs"],["createSpawn","SpawnLocation"]],
      horror:[["createPart","Ground"],["createPart","House"],["createPart","DarkZone"],["createPointLight","HorrorLight"],["createScript","HorrorController"]],
      racing:[["createPart","Track"],["createPart","StartLine"],["createPart","Checkpoint"],["createPart","FinishLine"],["createSpawn","SpawnLocation"]]
    };
    const list=defs[id]||defs.baseplate;let count=0;
    for(const [fn,name] of list){const r=call(fn);if(r!==false&&r!==undefined){count++;call("renameNode",name)}}
    call("saveProject");toast("Template aplicado: "+id);return count;
  },
  openExplorer(){return call("openExplorer")},
  openProperties(){return call("openProperties")},
  openDiagnostics(){return call("openDiagnostics")},
  openCodeStudio(){return call("openCodeStudio")},
  save(){return call("saveProject")},
  undo(){return call("undoOnce")},
  redo(){return call("redoOnce")}
};
window.StudioLiteExtra=F;
window.StudioLite300Extra=F;
window.StudioLite300Meta=window.StudioLite300Meta||{};
window.StudioLite300Meta.extraFunctions=Object.keys(F).length;
window.StudioLite300Meta.totalFunctions=(window.StudioLite300Meta.names||[]).length+Object.keys(F).length;
function installExtraUI(){
 let b=document.querySelector("#studioExtraBtn");
 if(!b){b=document.createElement("button");b.id="studioExtraBtn";b.className="accent";b.type="button";b.textContent="Pro+";b.title="Ferramentas profissionais extras";document.querySelector(".toolbar .tool-group")?.appendChild(b)}
 b.onclick=()=>{const old=document.querySelector("#studioExtraModal");if(old){old.remove();return}const bg=document.createElement("div");bg.id="studioExtraModal";bg.className="modal-bg";bg.innerHTML='<div class="modal"><div class="modal-head"><h2>Studio Pro+</h2><button id="extraClose">×</button></div><p>Ferramentas extras estáveis para o workspace.</p><div id="extraGrid" class="pgrid"></div></div>';document.body.appendChild(bg);const grid=bg.querySelector("#extraGrid");Object.keys(F).forEach(name=>{const x=document.createElement("button");x.className="asset";x.innerHTML="<b>"+name+"</b>";x.onclick=()=>{try{F[name]();toast(name+" ✓")}catch(e){toast(name+" falhou")}};grid.appendChild(x)});bg.querySelector("#extraClose").onclick=()=>bg.remove()}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installExtraUI);else setTimeout(installExtraUI,0);
})();