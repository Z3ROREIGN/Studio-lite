(()=>{"use strict";
const getCore=()=>window.StudioLiteCore||{};
const getState=()=>getCore().S||window.S||null;
const getNodes=()=>getState()?.nodes||[];
const getSelected=()=>{const s=getState();return getNodes().filter(n=>Array.isArray(s?.selectedIds)&&s.selectedIds.includes(n.id));};

/* Função extra #301: duplicação inteligente com deslocamento.
   Duplica todos os objetos selecionados e move as cópias no eixo indicado.
   Uso: StudioLiteExtra.duplicateOffset(2,"x") */
function duplicateOffset(distance=2,axis="x"){
  const core=getCore(),state=getState(),selected=getSelected();
  if(!state||!selected.length||typeof core.duplicate!=="function") return false;
  const step=Number(distance)||2;
  const index={x:0,y:1,z:2}[String(axis).toLowerCase()]??0;
  if(typeof core.commit==="function") core.commit();
  const created=[];
  for(const original of selected){
    if(!original) continue;
    const before=new Set(getNodes().map(n=>n.id));
    core.duplicate();
    const now=getNodes().find(n=>!before.has(n.id));
    if(now){
      now.position=Array.isArray(now.position)?[...now.position]:[0,0,0];
      now.position[index]=(Number(now.position[index])||0)+step;
      created.push(now);
    }
  }
  if(typeof core.render==="function") core.render();
  if(typeof core.save==="function") core.save(false);
  window.toast?.(`Duplicado ${created.length} objeto(s) +${step} no eixo ${["X","Y","Z"][index]}`);
  return created.length;
}

/* Função extra #302: alinhar objetos selecionados.
   Alinha os objetos pelo centro do primeiro selecionado nos eixos X/Y/Z.
   Uso: StudioLiteExtra.alignSelected("x") */
function alignSelected(axis="x"){
  const core=getCore(),state=getState(),selected=getSelected();
  if(!state||selected.length<2) return false;
  const index={x:0,y:1,z:2}[String(axis).toLowerCase()]??0;
  const anchor=selected[0];
  const target=Array.isArray(anchor?.position)?Number(anchor.position[index])||0:0;
  if(typeof core.commit==="function") core.commit();
  let changed=0;
  for(let i=1;i<selected.length;i++){
    const node=selected[i];
    if(!node) continue;
    node.position=Array.isArray(node.position)?[...node.position]:[0,0,0];
    node.position[index]=target;
    changed++;
  }
  if(typeof core.render==="function") core.render();
  if(typeof core.save==="function") core.save(false);
  window.toast?.(`Alinhados ${changed} objeto(s) no eixo ${["X","Y","Z"][index]}`);
  return changed;
}

window.StudioLiteExtra={duplicateOffset,alignSelected};
window.StudioLite300Extra=window.StudioLiteExtra;
})();