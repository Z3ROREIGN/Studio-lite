
/* ===== V12 PATCH — UNIVERSAL INSPECTOR AUTO-INJECTION ===== */
(()=>{"use strict";
const q=s=>document.querySelector(s);
let lastNodeId=null;
function inject(){
 const n=typeof cur==="function"?cur():null, root=q("#panel .panel");
 if(!n||!root)return;
 if(root.querySelector(".universal-properties-v12"))return;
 if(typeof renderUniversalProperties==="function")renderUniversalProperties(n,root);
 lastNodeId=n.id;
}
function watch(){
 const p=q("#panel");if(!p)return;
 new MutationObserver(()=>setTimeout(inject,0)).observe(p,{childList:true,subtree:true});
 setInterval(()=>{const n=typeof cur==="function"?cur():null;if(n?.id!==lastNodeId)inject()},250);
 setTimeout(inject,50);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch);else setTimeout(watch,50);
})();