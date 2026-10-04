
/* ===== UNIVERSAL PROPERTY INSPECTOR V12 ===== */
(()=>{"use strict";
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const scriptTypes=new Set(["Script","LocalScript","ModuleScript"]);
const enumValues={
 Material:["Plastic","SmoothPlastic","Wood","WoodPlanks","Slate","Concrete","Granite","Marble","Brick","Pebble","Cobblestone","Rock","Basalt","Sandstone","Limestone","Pavement","Metal","CorrodedMetal","DiamondPlate","Foil","Grass","LeafyGrass","Sand","Fabric","Snow","Mud","Water","Glass","Neon","ForceField","Ice"],
 Shape:["Block","Ball","Cylinder"],
 CollisionFidelity:["Default","Hull","Box","PreciseConvexDecomposition"],
 FormFactor:["Symmetric","Brick","Plate"],
 SurfaceType:["Smooth","Glue","Weld","Studs","Inlet","Universal","Hinge","Motor","SteppingMotor","SmoothNoOutlines"],
 CastShadow:["On","Off","Automatic"]
};
const boolHints=/^(Anchored|CanCollide|CanTouch|CanQuery|Locked|Massless|CastShadow|Enabled|Visible|Archivable|AutoButtonColor|Active|Draggable|Selectable|ResetOnSpawn|ClipsDescendants|ScrollingEnabled|TextScaled|TextWrapped|RichText|Modal|RequiresHandle|ManualActivationOnly|Looped|Playing|Playing|ShouldEmit|LightInfluence|Brightness|Enabled)$/i;
const colorHints=/color/i;
const vector3Hints=/^(Position|Size|Orientation|Rotation|Velocity|AssemblyLinearVelocity|AssemblyAngularVelocity|PivotOffset|WorldPosition|ExtentsSize|MinExtents|MaxExtents)$/i;
const cframeHints=/CFrame|CoordinateFrame|Pivot/i;
const numberHints=/Transparency|Reflectance|Brightness|Range|Angle|Volume|PlaybackSpeed|Lifetime|Rate|Size|MaxForce|Torque|Elasticity|Friction|Density|WalkSpeed|JumpPower|Health|MaxHealth|HipHeight|Distance|Studs|Speed|Weight|Scale|Intensity|Offset|Padding|TextSize/i;
function normalizeAnyValue(v){
 if(v==null)return "";
 if(typeof v==="object"){
  if(Array.isArray(v))return v;
  if(["x","y","z"].every(k=>k in v))return [Number(v.x)||0,Number(v.y)||0,Number(v.z)||0];
  if(["X","Y","Z"].every(k=>k in v))return [Number(v.X)||0,Number(v.Y)||0,Number(v.Z)||0];
  if(["R","G","B"].every(k=>k in v))return {R:Number(v.R)||0,G:Number(v.G)||0,B:Number(v.B)||0};
 }
 return v;
}
function propertyEntries(n){
 const props=n?.rbxProperties&&typeof n.rbxProperties==="object"?n.rbxProperties:{};
 const merged={...props};
 const aliases={
  Name:n.name,Position:n.position,Rotation:n.rotation,Size:n.size,Color:n.color,
  Material:n.material,Transparency:n.transparency,Anchored:n.anchored,CanCollide:n.canCollide,
  Locked:n.locked,Visible:n.visible
 };
 Object.entries(aliases).forEach(([k,v])=>{if(v!==undefined&&!Object.prototype.hasOwnProperty.call(merged,k))merged[k]=v});
 return Object.entries(merged).sort((a,b)=>a[0].localeCompare(b[0]));
}
function propertyKind(name,v){
 v=normalizeAnyValue(v);
 if(typeof v==="boolean"||boolHints.test(name))return "bool";
 if(Array.isArray(v)&&v.length===3)return vector3Hints.test(name)?"vector3":"vector3";
 if(v&&typeof v==="object"&&["R","G","B"].every(k=>k in v))return "color";
 if(typeof v==="number"||numberHints.test(name))return "number";
 if(enumValues[name]||enumValues[name.replace(/3D$/,"")])return "enum";
 if(cframeHints.test(name))return "cframe";
 return "text";
}
function displayValue(v){v=normalizeAnyValue(v);return typeof v==="object"?JSON.stringify(v):String(v??"");}
function parseInput(name,value,kind,old){
 if(kind==="bool")return value==="true";
 if(kind==="number")return Number(value);
 if(kind==="vector3"){const a=value.split(",").map(Number);return a.length===3&&a.every(Number.isFinite)?a:old}
 if(kind==="color")return value;
 if(kind==="enum")return value;
 if(kind==="cframe"){try{return JSON.parse(value)}catch{return old}}
 return value;
}
function syncCoreProperty(n,name,v){
 const map={Name:"name",Position:"position",Rotation:"rotation",Size:"size",Color:"color",Material:"material",Transparency:"transparency",Anchored:"anchored",CanCollide:"canCollide",Locked:"locked",Visible:"visible"};
 if(map[name])n[map[name]]=v;
 n.rbxProperties=n.rbxProperties||{};
 n.rbxProperties[name]=v;
}
function commitInspector(n,name,v){
 if(typeof commit==="function")commit();
 syncCoreProperty(n,name,v);
 if(typeof render==="function")render(false);
 if(typeof save==="function")save(false);
}
function renderUniversalProperties(n,root){
 if(!n||!root)return;
 const old=root.querySelector(".universal-properties-v12");if(old)old.remove();
 const wrap=document.createElement("div");wrap.className="universal-properties-v12";
 const entries=propertyEntries(n);
 const head=document.createElement("div");head.className="section-title";head.innerHTML="PROPRIEDADES IMPORTADAS <span>"+entries.length+"</span>";wrap.appendChild(head);
 const search=document.createElement("input");search.className="search";search.placeholder="⌕ Pesquisar propriedade";search.type="search";wrap.appendChild(search);
 const list=document.createElement("div");list.className="universal-property-list";wrap.appendChild(list);
 const draw=()=>{
  list.innerHTML="";
  const filter=search.value.toLowerCase().trim();
  entries.filter(([k,v])=>!filter||k.toLowerCase().includes(filter)||displayValue(v).toLowerCase().includes(filter)).forEach(([name,raw])=>{
   const v=normalizeAnyValue(raw),kind=propertyKind(name,v);
   const row=document.createElement("div");row.className="u-property";
   const label=document.createElement("div");label.className="u-property-label";label.innerHTML="<b>"+esc(name)+"</b><small>"+esc(kind)+"</small>";
   const editor=document.createElement("div");editor.className="u-property-editor";
   if(kind==="bool"){
    const s=document.createElement("button");s.className="switch "+(!!v?"on":"");s.innerHTML="<i></i>";s.onclick=()=>{commitInspector(n,name,!v);renderUniversalProperties(n,root)};editor.appendChild(s);
   }else if(kind==="enum"){
    const s=document.createElement("select");(enumValues[name]||["Auto","Default","None"]).forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;s.appendChild(o)});s.value=String(v);s.onchange=()=>commitInspector(n,name,s.value);editor.appendChild(s);
   }else if(kind==="vector3"){
    const vals=Array.isArray(v)?v:[0,0,0];const box=document.createElement("div");box.className="u-vector";
    vals.forEach((x,i)=>{const inp=document.createElement("input");inp.type="number";inp.step=".01";inp.value=Number(x)||0;inp.onchange=()=>{const a=vals.slice();a[i]=Number(inp.value)||0;commitInspector(n,name,a)};box.appendChild(inp)});editor.appendChild(box);
   }else if(kind==="color"){
    const inp=document.createElement("input");inp.type="color";inp.value=typeof v==="string"&&/^#/.test(v)?v:"#777777";inp.onchange=()=>commitInspector(n,name,inp.value);editor.appendChild(inp);
   }else if(kind==="cframe"){
    const inp=document.createElement("input");inp.value=displayValue(v);inp.onchange=()=>commitInspector(n,name,parseInput(name,inp.value,kind,v));editor.appendChild(inp);
   }else{
    const inp=document.createElement("input");inp.value=displayValue(v);inp.onchange=()=>commitInspector(n,name,parseInput(name,inp.value,kind,v));editor.appendChild(inp);
   }
   row.append(label,editor);list.appendChild(row);
  });
  if(!list.children.length){const e=document.createElement("div");e.className="empty";e.textContent="Nenhuma propriedade encontrada.";list.appendChild(e)}
 };
 search.oninput=draw;draw();
 root.appendChild(wrap);
}
const originalPanel=window.panel;
window.renderUniversalProperties=renderUniversalProperties;
window.refreshUniversalProperties=()=>{const n=typeof cur==="function"?cur():null;const root=q("#panel .panel");if(n&&root)renderUniversalProperties(n,root)};
const boot=()=>{
 const original=window.panel;
 if(typeof original!=="function"||original.__v12)return;
 const wrapped=function(){original();const n=typeof cur==="function"?cur():null;const root=q("#panel .panel");if(n&&root)renderUniversalProperties(n,root)};
 wrapped.__v12=true;window.panel=wrapped;
};
setTimeout(boot,0);
const style=document.createElement("style");style.id="v12UniversalPropertyStyle";style.textContent=".universal-properties-v12{margin-top:12px;padding-top:8px;border-top:1px solid #202020}.universal-properties-v12>.section-title{display:flex;justify-content:space-between;align-items:center}.universal-properties-v12>.section-title span{font-size:9px;color:#666}.universal-properties-v12 .search{width:100%;box-sizing:border-box;margin:5px 0 8px}.universal-property-list{display:grid;gap:5px;max-height:440px;overflow:auto;padding-right:2px}.u-property{display:grid;grid-template-columns:minmax(100px,.8fr) minmax(120px,1.2fr);gap:7px;align-items:center;padding:7px 6px;border:1px solid #1c1c1c;border-radius:7px;background:#0b0b0b}.u-property-label{min-width:0}.u-property-label b{display:block;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.u-property-label small{display:block;color:#555;font-size:8px;margin-top:2px}.u-property-editor input,.u-property-editor select{width:100%;box-sizing:border-box;min-width:0;height:29px}.u-vector{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}.u-vector input{width:100%!important}.u-property-editor input[type=color]{padding:2px;cursor:pointer}.u-property-editor .switch{margin-left:auto}.universal-properties-v12 .empty{padding:12px 5px;color:#666;font-size:10px}@media(max-width:850px){.universal-property-list{max-height:360px}.u-property{grid-template-columns:1fr}.u-property-editor input,.u-property-editor select{min-height:38px}.u-vector input{min-height:38px}}";
document.head.appendChild(style);
})();