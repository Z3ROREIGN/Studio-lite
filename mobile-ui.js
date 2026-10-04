(()=>{"use strict";
const q=s=>document.querySelector(s);
const isTouch=()=>matchMedia("(pointer:coarse)").matches||innerWidth<=850;
const canvas=()=>q("#canvas canvas:not(.fallback-canvas)")||q("#canvas canvas");
const synth=(type,e,extra={})=>{const el=canvas();if(!el)return;const ev=new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:e.pointerId||99,pointerType:"mouse",button:e.button??0,buttons:e.buttons??1,clientX:e.clientX,clientY:e.clientY,shiftKey:!!extra.shiftKey,ctrlKey:!!e.ctrlKey,metaKey:!!e.metaKey});ev.__mobileSynthetic=true;el.dispatchEvent(ev)};
let active=new Map(),orbiting=false,lastCenter=null,lastDistance=0,ignore=false;
function setupTouch(){
 const host=q("#viewport");if(!host)return;
 host.addEventListener("pointerdown",e=>{if(!isTouch()||e.pointerType!=="touch"||ignore)return;e.preventDefault();e.stopImmediatePropagation();active.set(e.pointerId,{x:e.clientX,y:e.clientY});if(active.size===1)synth("pointerdown",e);else if(active.size===2){const a=[...active.values()];lastCenter={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};lastDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);orbiting=true;synth("pointerdown",{...e,clientX:lastCenter.x,clientY:lastCenter.y,buttons:1},{shiftKey:true})}},true);
 host.addEventListener("pointermove",e=>{if(!isTouch()||e.pointerType!=="touch"||ignore)return;e.preventDefault();e.stopImmediatePropagation();if(!active.has(e.pointerId))return;active.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...active.values()];if(pts.length>=2){const c={x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length},d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);if(lastDistance){ignore=true;host.dispatchEvent(new WheelEvent("wheel",{bubbles:true,cancelable:true,deltaY:(lastDistance-d)*1.8}));ignore=false}if(lastCenter){const dx=c.x-lastCenter.x,dy=c.y-lastCenter.y;synth("pointermove",{pointerId:e.pointerId,clientX:c.x,clientY:c.y,button:0,buttons:1},{shiftKey:true});if(Math.abs(dx)+Math.abs(dy)>0)lastCenter=c}else lastCenter=c;lastDistance=d;return}synth("pointermove",e,{shiftKey:orbiting})},true);
 const finish=e=>{if(!isTouch()||e.pointerType!=="touch"||ignore)return;e.preventDefault();e.stopImmediatePropagation();const wasOrbit=orbiting;active.delete(e.pointerId);synth("pointerup",e,{shiftKey:wasOrbit});if(active.size<2){if(wasOrbit&&active.size===1){const p=[...active.entries()][0];synth("pointerdown",{pointerId:p[0],clientX:p[1].x,clientY:p[1].y,button:0,buttons:1},{shiftKey:true})}orbiting=active.size===1;lastCenter=null;lastDistance=0}};
 host.addEventListener("pointerup",finish,true);host.addEventListener("pointercancel",finish,true)
}
function panelState(){
 const ex=q("#explorerPanel"),ins=q("#inspectorPanel");
 const exOpen=!!ex?.classList.contains("open"),insOpen=!!ins?.classList.contains("open");
 q("#explorerToggle")?.setAttribute("aria-expanded",String(exOpen));
 q("#inspectorToggle")?.setAttribute("aria-expanded",String(insOpen));
 q("#mobileControls [data-m=explorer]")?.classList.toggle("active",exOpen);
 q("#mobileControls [data-m=inspector]")?.classList.toggle("active",insOpen);
 let shade=q("#mobilePanelShade");
 if(!shade){shade=document.createElement("button");shade.id="mobilePanelShade";shade.type="button";shade.setAttribute("aria-label","Fechar painel");q("#viewport")?.appendChild(shade);shade.onclick=()=>{const exNow=q("#explorerPanel")?.classList.contains("open"),insNow=q("#inspectorPanel")?.classList.contains("open");if(exNow)q("#explorerToggle")?.click();else if(insNow)q("#inspectorToggle")?.click();panelState()}}
 shade.hidden=!(exOpen||insOpen);
}
function mobileToolbar(){
 const host=q(".viewport");if(!host||q("#mobileControls"))return;
 const bar=document.createElement("div");bar.id="mobileControls";bar.className="mobile-controls";
 bar.innerHTML='<button data-m="select" aria-label="Selecionar">⌁<small>Selecionar</small></button><button data-m="move" aria-label="Mover">✥<small>Mover</small></button><button data-m="rotate" aria-label="Girar">↻<small>Girar</small></button><button data-m="scale" aria-label="Escalar">↔<small>Escalar</small></button><span></span><button data-m="explorer" aria-label="Explorer" aria-expanded="false">☰<small>Explorer</small></button><button data-m="inspector" aria-label="Propriedades" aria-expanded="false">☷<small>Props</small></button>';
 host.appendChild(bar);
 bar.querySelector('[data-m="select"]')?.classList.add("active");
 bar.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{const m=b.dataset.m;if(["select","move","rotate","scale"].includes(m)){q('.tool[data-tool="'+m+'"]')?.click();bar.querySelectorAll("[data-m]").forEach(x=>x.classList.toggle("active",x.dataset.m===m))}else if(m==="explorer")q("#explorerToggle")?.click();else if(m==="inspector")q("#inspectorToggle")?.click();setTimeout(panelState,0)});
 panelState();
}
function mobileViewTools(){const va=q(".view-actions");if(!va)return;va.querySelector("#homeView")?.setAttribute("aria-label","Visão inicial");va.querySelector("#topView")?.setAttribute("aria-label","Visão superior");va.querySelector("#frontView")?.setAttribute("aria-label","Visão frontal");va.querySelector("#rightView")?.setAttribute("aria-label","Visão lateral")}
function boot(){setupTouch();mobileToolbar();mobileViewTools();const sync=()=>panelState();new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});addEventListener("resize",()=>{if(innerWidth>850){q("#mobileControls")?.remove();q("#mobilePanelShade")?.remove()}else if(!q("#mobileControls"))mobileToolbar();panelState()},{passive:true})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else setTimeout(boot,50);
window.StudioLiteMobile={version:"1.1.0",touchControls:true,panelToggle:true}
})();