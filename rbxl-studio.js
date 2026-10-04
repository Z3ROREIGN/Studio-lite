/* V13 — robust service roots + richer imported value normalization */
(()=>{"use strict";
const STORE="studio-lite-v4";
const SERVICE_SET=new Set(["Workspace","Lighting","Players","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService","CollectionService","HttpService","MarketplaceService","TweenService","RunService","DataStoreService","MemoryStoreService","MessagingService","TeleportService","UserInputService","ContextActionService","GuiService","Debris","InsertService","LocalizationService","PathfindingService","PhysicsService","SocialService","PolicyService","BadgeService","GroupService","UserService","AnalyticsService"]);
const SCRIPT_SET=new Set(["Script","LocalScript","ModuleScript"]);
const oldFetch=window.StudioLiteRBXL?.importFile;
function normalizeValue(v){
 if(v==null)return v;
 if(typeof v==="object"){
  if(v.type&&v.value!==undefined)return normalizeValue(v.value);
  if(v.X!==undefined||v.x!==undefined||v.Y!==undefined||v.y!==undefined||v.Z!==undefined||v.z!==undefined){
   const out={};
   ["X","Y","Z"].forEach(k=>{if(v[k]!==undefined)out[k]=v[k];});
   ["x","y","z"].forEach(k=>{if(v[k]!==undefined)out[k.toUpperCase()]=v[k];});
   return out;
  }
  if(v.R!==undefined||v.G!==undefined||v.B!==undefined||v.r!==undefined||v.g!==undefined||v.b!==undefined){
   return {R:v.R??v.r,G:v.G??v.g,B:v.B??v.b};
  }
 }
 return v;
}
function fixStateNodes(nodes){
 const serviceRoots=new Map();
 for(const n of nodes){
  if(SERVICE_SET.has(n.type)&&n.type!=="Workspace")serviceRoots.set(n.id,n.type);
 }
 const out=[];
 for(const raw of nodes){
  const n=JSON.parse(JSON.stringify(raw));
  n.rbxProperties=n.rbxProperties&&typeof n.rbxProperties==="object"?n.rbxProperties:{};
  for(const k of Object.keys(n.rbxProperties))n.rbxProperties[k]=normalizeValue(n.rbxProperties[k]);
  if(serviceRoots.has(n.id)){
   continue;
  }
  if(n.parent&&serviceRoots.has(n.parent))n.parent="service:"+serviceRoots.get(n.parent);
  if(n.parent&&!String(n.parent).startsWith("service:")&&!nodes.some(x=>x.id===n.parent))n.parent=null;
  if(SCRIPT_SET.has(n.type)){
   n.script=String(n.script??n.rbxProperties.Source??"");
   n.language=n.language||"luau";
   n.sourceClass=n.type;
  }
  out.push(n);
 }
 return out;
}
function loadAndFix(){
 try{
  const raw=localStorage.getItem(STORE);if(!raw)return;
  const s=JSON.parse(raw);if(!Array.isArray(s.nodes))return;
  const fixed=fixStateNodes(s.nodes);
  if(fixed.length!==s.nodes.length||fixed.some((n,i)=>n.parent!==s.nodes[i]?.parent)){
   s.nodes=fixed;localStorage.setItem(STORE,JSON.stringify(s));
  }
 }catch(e){console.warn("Studio RBXL service migration",e)}
}
loadAndFix();
window.StudioLiteRBXLServiceFix={run:loadAndFix};
})();