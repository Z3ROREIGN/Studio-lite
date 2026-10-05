/* Studio Lite Professional Suite — no AI */
(()=>{"use strict";
const KEY="studio-lite-pro-suite-v1";
const get=()=>JSON.parse(localStorage.getItem(KEY)||'{"snapshots":[],"projects":[],"settings":{"autosave":true,"confirmDelete":true,"scriptWrap":false,"compactExplorer":false,"showStatus":true}}');
const put=s=>localStorage.setItem(KEY,JSON.stringify(s));
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const svg=(p)=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+p+"</svg>";
const icons={
home:svg('<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>'),
project:svg('<path d="M4 6h6l2 2h8v11H4z"/>'),
snapshot:svg('<path d="M5 5h14v14H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
search:svg('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>'),
keyboard:svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 10h.1M9 10h.1M12 10h.1M15 10h.1M18 10h.1M7 14h10"/>'),
settings:svg('<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="4"/>'),
shield:svg('<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>'),
close:svg('<path d="M6 6l12 12M18 6L6 18"/>'),
menu:svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
folder:svg('<path d="M3 6h7l2 2h9v10H3z"/>'),
code:svg('<path d="M9 7l-5 5 5 5M15 7l5 5-5 5M13 4l-2 16"/>'),
grid:svg('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>')
};
function root(){let r=document.getElementById("studioSuiteRoot");if(!r){r=document.createElement("div");r.id="studioSuiteRoot";document.body.appendChild(r)}return r}
function toast(t){const x=document.createElement("div");x.className="suite-toast";x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),2400)}
function projectState(){const s=window.StudioLiteCore?.S||window.S;return {name:document.getElementById("projectName")?.value||"Meu Primeiro Jogo",state:s?JSON.parse(JSON.stringify(s)):null}}
function saveProject(){document.getElementById("saveBtn")?.click();toast("Projeto salvo")}
function snapshot(label){const s=get(),p=projectState();s.snapshots.unshift({id:Date.now(),label:label||"Snapshot",time:new Date().toLocaleString("pt-BR"),project:p});s.snapshots=s.snapshots.slice(0,30);put(s);toast("Snapshot criado")}
function restore(id){const s=get(),x=s.snapshots.find(a=>a.id===id);if(!x?.project?.state)return toast("Snapshot sem estado restaurável");try{if(window.StudioLiteCore?.S)Object.assign(window.StudioLiteCore.S,x.project.state);if(window.S)Object.assign(window.S,x.project.state);window.render?.();window.renderTree?.();toast("Snapshot restaurado")}catch(e){toast("Não foi possível restaurar")}}
function open(){render("home");root().classList.add("open")}
function close(){root().classList.remove("open");document.querySelector(".suite-nav")?.classList.remove("mobile-open")}
function render(section){
 const r=root();const s=get();const labels={home:"Studio Suite",projects:"Projetos",snapshots:"Snapshots",search:"Pesquisa global",shortcuts:"Atalhos",settings:"Configurações",health:"Saúde do Studio"};
 r.innerHTML='<div class="suite-window"><aside class="suite-nav"><div class="suite-brand"><b>STUDIO SUITE</b><small>Professional workspace</small></div>'+
 [["home","Visão geral","home"],["projects","Projetos","project"],["snapshots","Snapshots","snapshot"],["search","Pesquisa global","search"],["shortcuts","Atalhos","keyboard"],["health","Diagnóstico","shield"],["settings","Configurações","settings"]].map(a=>'<button class="'+(section===a[0]?"active":"")+'" data-section="'+a[0]+'">'+icons[a[2]]+a[1]+"</button>").join("")+
 '<button style="margin-top:auto" id="suiteCloseNav">'+icons.close+"Fechar</button></aside><section class="suite-content"><header class="suite-head"><div style="display:flex;align-items:center;gap:8px"><button class="suite-mobile-nav" id="suiteMobileNav">'+icons.menu+'</button><div><h2>'+labels[section]+'</h2></div></div><button class="suite-close" id="suiteClose">'+icons.close+'</button></header><main class="suite-body">'+body(section,s)+'</main></section></div>';
 bind(section); 
}
function body(section,s){
 if(section==="home")return '<div class="suite-hero"><b>Centro profissional do Studio Lite</b><p>Ferramentas de projeto, versões, pesquisa, atalhos e diagnóstico em uma única interface.</p></div><div class="suite-grid">'+
 card(icons.project,"Projeto",esc(document.getElementById("projectName")?.value||"Meu Primeiro Jogo"),"Nome atual")+
 card(icons.snapshot,"Snapshots",s.snapshots.length,"versões locais")+
 card(icons.folder,"Objetos",document.querySelectorAll(".tree-row").length,"itens visíveis")+
 card(icons.code,"Scripts",document.querySelectorAll(".tree-row").length? "Explorer":"—","workspace")+
 card(icons.grid,"Viewport","WebGL / fallback","engine")+
 card(icons.shield,"Sistema","Operacional","diagnóstico")+'</div><div class="suite-card" style="margin-top:12px"><h3>Ações rápidas</h3><div class="suite-actions"><button class="suite-btn primary" data-action="save">Salvar</button><button class="suite-btn" data-action="snapshot">Criar snapshot</button><button class="suite-btn" data-action="explorer">Abrir Explorer</button><button class="suite-btn" data-action="command">Command Palette</button><button class="suite-btn" data-action="market">Marketplace</button></div></div>';
 if(section==="projects")return '<div class="suite-hero"><b>Gerenciador de projetos</b><p>Crie registros locais, duplique projetos e mantenha projetos recentes organizados.</p><div class="suite-actions"><input id="newProjectName" class="suite-input" style="max-width:300px" placeholder="Nome do projeto"><button class="suite-btn primary" id="createProject">Criar projeto</button></div></div><div class="suite-list">'+(s.projects.length?s.projects.map(p=>'<div class="suite-row"><div><b>'+esc(p.name)+'</b><small>'+esc(p.time)+'</small></div><div class="suite-actions"><button class="suite-btn" data-load-project="'+p.id+'">Abrir</button><button class="suite-btn" data-delete-project="'+p.id+'">Excluir</button></div></div>').join(""):'<div class="suite-empty">Nenhum projeto local registrado.</div>')+'</div>';
 if(section==="snapshots")return '<div class="suite-hero"><b>Versionamento local</b><p>Salve pontos de restauração antes de grandes alterações.</p><button class="suite-btn primary" id="createSnapshot">Criar snapshot agora</button></div><div class="suite-list">'+(s.snapshots.length?s.snapshots.map(x=>'<div class="suite-row"><div><b>'+esc(x.label)+'</b><small>'+esc(x.time)+'</small></div><div class="suite-actions"><button class="suite-btn" data-restore="'+x.id+'">Restaurar</button></div></div>').join(""):'<div class="suite-empty">Nenhum snapshot.</div>')+'</div>';
 if(section==="search")return '<div class="suite-hero"><b>Pesquisa global</b><p>Pesquise objetos atualmente carregados no Explorer, scripts e propriedades.</p><input id="globalSearch" class="suite-input pro-search" placeholder="Pesquisar por nome, tipo ou texto..."><div id="proSearchResults"></div></div>';
 if(section==="shortcuts")return '<div class="suite-hero"><b>Atalhos profissionais</b><p>Os atalhos abaixo são integrados ao editor quando a ação correspondente existe.</p></div><table class="suite-table"><thead><tr><th>Atalho</th><th>Ação</th><th>Disponibilidade</th></tr></thead><tbody>'+[
 ["Ctrl / Cmd + S","Salvar","Ativo"],["Ctrl / Cmd + Z","Desfazer","Ativo"],["Ctrl / Cmd + Y","Refazer","Ativo"],["Ctrl / Cmd + D","Duplicar","Ativo"],["Delete","Excluir seleção","Ativo"],["F","Focar seleção","Ativo"],["Ctrl / Cmd + K","Command Palette","Ativo"],["Esc","Fechar painel","Ativo"],["W","Mover","Editor"],["E","Rotacionar","Editor"],["R","Escalar","Editor"]].map(x=>'<tr><td><span class="suite-kbd">'+x[0]+'</span></td><td>'+x[1]+'</td><td style="color:#7f91a8">'+x[2]+'</td></tr>').join("")+'</tbody></table>';
 if(section==="health")return '<div class="suite-hero"><b>Diagnóstico do Studio</b><p>Verificação rápida da interface, módulos, WebGL, armazenamento e conectores disponíveis.</p><button id="runHealth" class="suite-btn primary">Executar diagnóstico</button></div><div id="healthResults">'+healthRows()+'</div>';
 return '<div class="suite-grid"><div class="suite-card"><h3>'+icons.settings+'Editor</h3><p>Configurações funcionais sem alterar aparência ou tema.</p>'+toggle("autosave","Autosave",s.settings.autosave)+'</div><div class="suite-card"><h3>'+icons.shield+'Segurança</h3><p>Preferências de confirmação e proteção local.</p>'+toggle("confirmDelete","Confirmar exclusão",s.settings.confirmDelete)+'</div><div class="suite-card"><h3>'+icons.folder+'Explorer</h3><p>Organização e densidade do Explorer.</p>'+toggle("compactExplorer","Explorer compacto",s.settings.compactExplorer)+'</div><div class="suite-card"><h3>'+icons.code+'Editor</h3><p>Preferências de edição de código.</p>'+toggle("scriptWrap","Quebra de linha",s.settings.scriptWrap)+'</div></div><div class="suite-card" style="margin-top:12px"><h3>Dados</h3><div class="suite-actions"><button id="exportSuiteData" class="suite-btn">Exportar configurações</button><button id="resetSuiteData" class="suite-btn">Restaurar configurações</button></div></div>';
}
function card(icon,title,value,label){return '<div class="suite-card"><h3>'+icon+title+'</h3><div class="suite-stat">'+value+'</div><div class="suite-label">'+label+'</div></div>'}
function toggle(k,label,on){return '<div class="suite-row"><div>'+label+'</div><button class="suite-switch '+(on?"on":"")+'" data-toggle="'+k+'"><i></i></button></div>'}
function healthRows(){const tests=[["DOM principal",!!document.getElementById("app")],["Explorer",!!document.getElementById("tree")],["Viewport",!!document.getElementById("canvas")],["Three.js",!!window.THREE],["Supabase",!!window.supabase],["Studio RBXL",!!document.getElementById("studioRbxlBtn")],["Marketplace",!!document.getElementById("platformBtn")],["LocalStorage",(()=>{try{localStorage.setItem("__slh","1");localStorage.removeItem("__slh");return true}catch{return false}})()]];return '<div class="suite-list">'+tests.map(t=>'<div class="suite-row"><div><b>'+esc(t[0])+'</b><small>'+(t[1]?"Operacional":"Não detectado")+'</small></div><strong style="color:'+(t[1]?"#72e6a3":"#ff8795")+'">'+(t[1]?"OK":"CHECK")+'</strong></div>').join("")+'</div>'}
function bind(section){
 root().querySelectorAll("[data-section]").forEach(b=>b.onclick=()=>render(b.dataset.section));
 document.getElementById("suiteClose")?.addEventListener("click",close);document.getElementById("suiteCloseNav")?.addEventListener("click",close);
 document.getElementById("suiteMobileNav")?.addEventListener("click",()=>document.querySelector(".suite-nav")?.classList.toggle("mobile-open"));
 root().addEventListener("click",e=>{if(e.target===root())close()},{once:true});
 root().querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==="save")saveProject();if(a==="snapshot")snapshot();if(a==="explorer")document.getElementById("explorerPanel")?.classList.toggle("open");if(a==="command")document.getElementById("commandBtn")?.click();if(a==="market")document.getElementById("platformBtn")?.click();});
 document.getElementById("createSnapshot")?.addEventListener("click",()=>snapshot());
 document.querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>restore(+b.dataset.restore));
 document.getElementById("createProject")?.addEventListener("click",()=>{const n=document.getElementById("newProjectName")?.value.trim();if(!n)return toast("Digite um nome");const s=get();s.projects.unshift({id:Date.now(),name:n,time:new Date().toLocaleString("pt-BR")});put(s);document.getElementById("projectName").value=n;toast("Projeto registrado");render("projects")});
 document.querySelectorAll("[data-delete-project]").forEach(b=>b.onclick=()=>{const s=get();s.projects=s.projects.filter(p=>p.id!==+b.dataset.deleteProject);put(s);render("projects")});
 document.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{const s=get();const k=b.dataset.toggle;s.settings[k]=!s.settings[k];put(s);render("settings")});
 document.getElementById("exportSuiteData")?.addEventListener("click",()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(get(),null,2)],{type:"application/json"}));a.download="studio-suite-config.json";a.click();URL.revokeObjectURL(a.href)});
 document.getElementById("resetSuiteData")?.addEventListener("click",()=>{localStorage.removeItem(KEY);toast("Configurações restauradas");render("settings")});
 document.getElementById("globalSearch")?.addEventListener("input",e=>globalSearch(e.target.value));
 document.getElementById("runHealth")?.addEventListener("click",()=>{document.getElementById("healthResults").innerHTML=healthRows();toast("Diagnóstico concluído")});
}
function globalSearch(q){const box=document.getElementById("proSearchResults");if(!box)return;const term=q.trim().toLowerCase();const rows=[...document.querySelectorAll(".tree-row")].map(x=>({name:x.textContent.trim(),el:x})).filter(x=>!term||x.name.toLowerCase().includes(term));box.innerHTML=rows.length?rows.slice(0,200).map((x,i)=>'<button class="suite-row pro-result" data-pro-result="'+i+'"><div><b>'+esc(x.name)+'</b><small>Explorer</small></div></button>').join(""):'<div class="suite-empty">Nenhum resultado encontrado.</div>';box.querySelectorAll("[data-pro-result]").forEach((b,i)=>b.onclick=()=>{rows[i].el.click();close()})}
document.addEventListener("keydown",e=>{const k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;if(mod&&k==="s"){e.preventDefault();saveProject()}else if(mod&&k==="k"){e.preventDefault();document.getElementById("platformBtn")?.click()}else if(e.key==="Escape"){if(root().classList.contains("open"))close()}else if(k==="f"&&!["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)){document.getElementById("focusBtn")?.click()}});
window.StudioProfessionalSuite={open,close,render,snapshot};
const settings=document.getElementById("settingsBtn");if(settings){settings.title="Configurações profissionais";settings.addEventListener("click",open)}
const top=document.querySelector(".actions");if(top&&!document.getElementById("proSuiteBtn")){const b=document.createElement("button");b.id="proSuiteBtn";b.title="Studio Suite";b.setAttribute("aria-label","Abrir Studio Suite");b.innerHTML=icons.grid; b.onclick=open;const platform=document.getElementById("platformBtn");top.insertBefore(b,platform||null)}
})();
