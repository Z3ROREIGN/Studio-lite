/* Studio Lite — Supabase Realtime collaboration (no AI) */
(()=>{"use strict";
const URL="https://anlwpqwjjswkqncltcdl.supabase.co";
const KEY="sb_publishable_r3GoKwcOEaXySt7fFOM_0A_rNOc7Mq7";
let client=null,channel=null,room=null,clientId=crypto.randomUUID?.()||Math.random().toString(36).slice(2),remote=false,lastHash="",poll=null;
const toast=t=>window.StudioPlatformToast?.(t)||window.toast?.(t);
const state=()=>window.StudioLiteCore?.S||window.S||null;
const snapshot=()=>{const s=state();if(!s)return null;return {project:s.project||"Meu Primeiro Jogo",nodes:JSON.parse(JSON.stringify(s.nodes||[])),grid:s.grid||1,snap:s.snap!==false,ts:Date.now(),sender:clientId}};
const hash=x=>{try{return JSON.stringify(x)}catch{return ""}};
function ensure(){if(client)return client;if(!window.supabase?.createClient)return null;client=window.supabase.createClient(URL,KEY);return client}
function apply(data){const s=state();if(!s||!data?.nodes)return;remote=true;try{s.nodes=JSON.parse(JSON.stringify(data.nodes));s.project=String(data.project||s.project||"Meu Primeiro Jogo");s.grid=Number(data.grid)||1;s.snap=data.snap!==false;document.getElementById("projectName")?.setAttribute("value",s.project);document.getElementById("projectName")&&(document.getElementById("projectName").value=s.project);window.StudioLiteCore?.render?.();window.StudioLiteCore?.save?.(false)}finally{setTimeout(()=>remote=false,80)}}
async function send(event,payload){if(!channel)return false;try{await channel.send({type:"broadcast",event,payload});return true}catch(e){console.warn("Studio Realtime send",e);return false}}
function renderPresence(){const ps=channel?.presenceState?.()||{};const members=[];Object.values(ps).flat().forEach(x=>{if(x?.client_id&&!members.some(m=>m.client_id===x.client_id))members.push(x)});window.StudioPlatformRealtimeMembers?.(members)}
async function connect(code,name="Colaborador"){
 const c=ensure();if(!c)throw Error("Supabase client indisponível");
 await disconnect();room=String(code||"").trim().toUpperCase();if(!/^[A-Z0-9]{6,12}$/.test(room))throw Error("Código de sala inválido");
 channel=c.channel("studio-party:"+room,{config:{broadcast:{self:false},presence:{key:clientId}}});
 channel.on("broadcast",{event:"studio_state_request"},p=>{if(p?.payload?.sender===clientId)return;const snap=snapshot();if(snap)send("studio_state_response",{...snap,receiver:p?.payload?.sender||null})});
 channel.on("broadcast",{event:"studio_state_response"},p=>{if(p?.payload?.receiver&&p.payload.receiver!==clientId)return;apply(p.payload);lastHash=hash(snapshot()?.nodes||[])});
 channel.on("broadcast",{event:"studio_state"},p=>{if(p?.payload?.sender===clientId)return;apply(p.payload);lastHash=hash(snapshot()?.nodes||[])});
 channel.on("presence",{event:"sync"},renderPresence).on("presence",{event:"join"},renderPresence).on("presence",{event:"leave"},renderPresence);
 await new Promise((resolve,reject)=>channel.subscribe(async status=>{if(status==="SUBSCRIBED"){await channel.track({client_id:clientId,name:String(name||"Colaborador").slice(0,40),online_at:new Date().toISOString()});renderPresence();resolve()}else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"||status==="CLOSED")reject(Error("Não foi possível conectar à sala"))}));
 await send("studio_state_request",{sender:clientId});lastHash=hash(snapshot()?.nodes||[]);
 poll=setInterval(async()=>{if(remote||!channel)return;const snap=snapshot(),h=hash(snap?.nodes||[]);if(h&&h!==lastHash){lastHash=h;await send("studio_state",snap)}},900);
 window.StudioPlatformRealtimeStatus?.("Conectado • "+room);toast?.("Colaboração conectada");
 return true
}
async function disconnect(){if(poll){clearInterval(poll);poll=null}if(channel&&client){try{await channel.untrack()}catch{}try{await client.removeChannel(channel)}catch{}}channel=null;room=null;renderPresence();window.StudioPlatformRealtimeStatus?.("Desconectado")}
async function sync(){const snap=snapshot();if(snap){lastHash=hash(snap.nodes);return send("studio_state",snap)}return false}
window.StudioLiteRealtime={connect,disconnect,sync,isConnected:()=>!!channel,getRoom:()=>room};
})();