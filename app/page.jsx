"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./studio.css";

const initial = [
  { id:"spawn", name:"SpawnLocation", type:"SpawnLocation", position:[0,1,0], rotation:[0,0,0], size:[2,1,2], color:"#22c55e", anchored:true, canCollide:true },
  { id:"part", name:"Part", type:"Part", position:[0,0,0], rotation:[0,0,0], size:[8,1,8], color:"#64748b", anchored:true, canCollide:true },
  { id:"platform", name:"Platform", type:"Part", position:[0,3,-7], rotation:[0,0,0], size:[6,1,4], color:"#8b5cf6", anchored:true, canCollide:true }
];

const num = (v, fallback=0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

export default function Home() {
  const mount = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const objectsRef = useRef(new Map());
  const [nodes,setNodes] = useState(initial);
  const [selected,setSelected] = useState("part");
  const [tool,setTool] = useState("select");
  const [project,setProject] = useState("Meu Primeiro Jogo");
  const [status,setStatus] = useState("Pronto");
  const [modal,setModal] = useState(null);
  const [universeId,setUniverseId] = useState("");
  const [placeId,setPlaceId] = useState("");
  const [apiKey,setApiKey] = useState("");
  const [file,setFile] = useState(null);
  const [openScript,setOpenScript] = useState(null);
  const [scriptText,setScriptText] = useState("");
  const [panel,setPanel] = useState("properties");
  const current = nodes.find(n=>n.id===selected);

  useEffect(()=>{
    sceneRef.current && nodes.forEach(node=>{
      let mesh=objectsRef.current.get(node.id);
      if(!mesh){
        mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.68,metalness:.08}));
        mesh.userData.nodeId=node.id; sceneRef.current.add(mesh); objectsRef.current.set(node.id,mesh);
      }
      mesh.position.set(...node.position);
      mesh.rotation.set(...node.rotation.map(v=>THREE.MathUtils.degToRad(v)));
      mesh.scale.set(...node.size);
      mesh.material.color.set(node.color);
      mesh.material.emissive.set(node.id===selected ? "#2563eb" : "#000000");
      mesh.material.emissiveIntensity=node.id===selected?.18:0;
    });
    const wanted=new Set(nodes.map(n=>n.id));
    for(const [id,mesh] of objectsRef.current) if(!wanted.has(id)){sceneRef.current?.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();objectsRef.current.delete(id);}
  },[nodes,selected]);

  useEffect(()=>{
    if(!mount.current) return;
    const scene=new THREE.Scene(); scene.background=new THREE.Color("#050607"); sceneRef.current=scene;
    const camera=new THREE.PerspectiveCamera(55,mount.current.clientWidth/mount.current.clientHeight,.1,1000);
    const target=new THREE.Vector3(0,1,0); let theta=.62,phi=.92,radius=27;
    const sync=()=>{camera.position.set(target.x+radius*Math.sin(phi)*Math.sin(theta),target.y+radius*Math.cos(phi),target.z+radius*Math.sin(phi)*Math.cos(theta));camera.lookAt(target);}; sync(); cameraRef.current=camera;
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(mount.current.clientWidth,mount.current.clientHeight); mount.current.appendChild(renderer.domElement); rendererRef.current=renderer;
    scene.add(new THREE.HemisphereLight(0xffffff,0x111111,2));
    const light=new THREE.DirectionalLight(0xffffff,1.6); light.position.set(8,20,10); scene.add(light);
    const grid=new THREE.GridHelper(60,60,0x252525,0x111111); scene.add(grid);
    const ray=new THREE.Raycaster(), pointer=new THREE.Vector2(); let orbit=false,lx=0,ly=0;
    const down=e=>{
      if(e.button===1||e.button===2){orbit=true;lx=e.clientX;ly=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);return;}
      const rect=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-rect.left)/rect.width)*2-1; pointer.y=-((e.clientY-rect.top)/rect.height)*2+1; ray.setFromCamera(pointer,camera);
      const hit=ray.intersectObjects([...objectsRef.current.values()])[0]; if(hit?.object.userData.nodeId){setSelected(hit.object.userData.nodeId);setStatus("Objeto selecionado");}
    };
    const move=e=>{if(!orbit)return;theta-=(e.clientX-lx)*.008;phi=Math.max(.12,Math.min(Math.PI-.12,phi-(e.clientY-ly)*.008));lx=e.clientX;ly=e.clientY;sync();};
    const up=()=>orbit=false;
    const wheel=e=>{e.preventDefault();radius=Math.max(3,Math.min(100,radius*(e.deltaY>0?1.08:.92)));sync();};
    renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointermove",move);renderer.domElement.addEventListener("pointerup",up);renderer.domElement.addEventListener("wheel",wheel,{passive:false});renderer.domElement.oncontextmenu=e=>e.preventDefault();
    let raf; const loop=()=>{renderer.render(scene,camera);raf=requestAnimationFrame(loop)};loop();
    const resize=()=>{if(!mount.current)return;camera.aspect=mount.current.clientWidth/mount.current.clientHeight;camera.updateProjectionMatrix();renderer.setSize(mount.current.clientWidth,mount.current.clientHeight)};window.addEventListener("resize",resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);renderer.domElement.removeEventListener("pointerdown",down);renderer.domElement.removeEventListener("pointermove",move);renderer.domElement.removeEventListener("pointerup",up);renderer.domElement.removeEventListener("wheel",wheel);renderer.dispose();renderer.domElement.remove();objectsRef.current.clear()};
  },[]);

  const update=useCallback(p=>setNodes(list=>list.map(n=>n.id===selected?{...n,...p}:n)),[selected]);
  const vector=(key,i,value)=>{if(!current)return;const a=[...current[key]];a[i]=num(value,a[i]);update({[key]:a})};
  const add=(type="Part")=>{const id=crypto.randomUUID();const n={id,name:type==="Script"?"Script":type==="Folder"?"Folder":"Part",type,position:[0,2,0],rotation:[0,0,0],size:[4,1,4],color:"#3b82f6",anchored:true,canCollide:type==="Part",script:type==="Script"?'-- Novo Script\\n\\nprint("Hello from Studio Lite!")\\n':undefined};setNodes(x=>[...x,n]);setSelected(id);if(type==="Script"){setOpenScript(id);setScriptText(n.script)}setStatus(type+" criado")};
  const duplicate=()=>{if(!current)return;const id=crypto.randomUUID();setNodes(x=>[...x,{...current,id,name:current.name+" Copy",position:[current.position[0]+2,current.position[1],current.position[2]+2]}]);setSelected(id);setStatus("Objeto duplicado")};
  const remove=()=>{if(!current||current.id==="spawn")return setStatus("SpawnLocation não pode ser removido");setNodes(x=>x.filter(n=>n.id!==selected));setSelected("part");setStatus("Objeto removido")};
  const transform=mode=>{if(!current)return;if(mode==="move")update({position:[current.position[0]+1,current.position[1],current.position[2]]});if(mode==="rotate")update({rotation:[current.rotation[0],current.rotation[1]+15,current.rotation[2]]});if(mode==="scale")update({size:[current.size[0]+1,current.size[1],current.size[2]+1]});setTool(mode);setStatus(mode==="move"?"Movido 1 stud":mode==="rotate"?"Rotacionado 15°":"Escalado")};

  useEffect(()=>{const key=e=>{if(e.target.matches?.("input,textarea,select"))return;if(e.key==="Delete"||e.key==="Backspace")remove();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="d"){e.preventDefault();duplicate()}if(e.key.toLowerCase()==="w")transform("move");if(e.key.toLowerCase()==="e")transform("rotate");if(e.key.toLowerCase()==="r")transform("scale")};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)});

  const save=async()=>{setStatus("Salvando…");try{const r=await fetch("/api/projects",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:project,scene:{nodes}})});setStatus(r.ok?"Projeto salvo":"Faça login no Supabase para salvar")}catch{setStatus("Servidor indisponível")}};
  const validate=async()=>{setStatus("Validando Roblox…");try{const r=await fetch("/api/roblox/validate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({universeId,apiKey})});const d=await r.json();setStatus(r.ok?"Roblox conectado":"Falha: "+(d.error||"chave inválida"))}catch{setStatus("Falha de conexão")}};
  const publish=async()=>{if(!file)return setStatus("Selecione um .rbxl/.rbxlx");setStatus("Publicando…");const f=new FormData();f.append("universeId",universeId);f.append("placeId",placeId);f.append("apiKey",apiKey);f.append("file",file);try{const r=await fetch("/api/roblox/publish",{method:"POST",body:f});const d=await r.json();setStatus(r.ok?"Publicado no Roblox":"Falha: "+(d.error||"recusado"))}catch{setStatus("Falha de publicação")}};
  const analyze=async()=>{if(!file)return setStatus("Selecione um arquivo");const f=new FormData();f.append("file",file);setStatus("Analisando…");try{const r=await fetch("/api/import",{method:"POST",body:f});const d=await r.json();if(!r.ok)return setStatus("Falha: "+d.error);if(d.type==="rbxlx"){const p=await fetch("/api/import/parse",{method:"POST",body:f});const q=await p.json();if(p.ok&&Array.isArray(q.nodes)){setNodes(q.nodes);setSelected(q.nodes[0]?.id||"spawn");setStatus(q.count+" objetos importados")}else setStatus("Estrutura não convertida")}else setStatus("RBXL validado para publicação")}catch{setStatus("Falha ao analisar")}};

  return <main className="app">
    <header className="topbar">
      <div className="brand"><div className="logo">S</div><div><b>STUDIO LITE</b><span>WEB EDITOR</span></div></div>
      <div className="project"><input value={project} onChange={e=>setProject(e.target.value)}/><span className="dot"/> <small>{status}</small></div>
      <div className="topActions"><button onClick={save}>Salvar</button><button className="primary" onClick={()=>setModal("publish")}>Publicar</button></div>
    </header>
    <nav className="toolbar">
      <button className="accentBtn" onClick={()=>add()}>＋ Part</button><button onClick={duplicate}>⧉</button><button onClick={remove}>⌫</button><i/>
      <button className={tool==="move"?"active":""} onClick={()=>transform("move")}>Move</button><button className={tool==="rotate"?"active":""} onClick={()=>transform("rotate")}>Rotate</button><button className={tool==="scale"?"active":""} onClick={()=>transform("scale")}>Scale</button>
      <span/><button onClick={()=>setModal("roblox")}>☁ Roblox</button><button onClick={()=>setModal("import")}>⇧ Importar</button>
    </nav>
    <section className="workspace">
      <aside className="sidebar explorer">
        <div className="sideTitle"><strong>Explorer</strong><div><button onClick={()=>add()}>＋</button><button onClick={()=>add("Folder")}>▱</button><button onClick={()=>add("Script")}>◇</button></div></div>
        <div className="tree"><div className="root">⌄ <b>Workspace</b></div>{nodes.map(n=><button key={n.id} className={"treeItem "+(selected===n.id?"selected":"")} onClick={()=>setSelected(n.id)}><span>{n.type==="Script"?"◇":n.type==="Folder"?"▱":"◈"}</span>{n.name}<em>{n.type}</em></button>)}{["Lighting","ReplicatedStorage","ServerScriptService","StarterGui"].map(x=><div className="root muted" key={x}>› {x}</div>)}</div>
        <div className="shortcuts"><b>SHORTCUTS</b><span><kbd>W</kbd> Move <kbd>E</kbd> Rotate <kbd>R</kbd> Scale</span><span><kbd>⌘D</kbd> Duplicate <kbd>DEL</kbd> Delete</span></div>
      </aside>
      <div className="viewport"><div ref={mount} className="canvas"/><div className="hud"><span>Perspective</span><span>Grid 1 stud</span><span>WebGL</span></div><div className="center">＋</div><div className="hint">MMB/RMB arrastar para orbitar • roda para zoom</div></div>
      <aside className="sidebar inspector">
        <div className="tabs"><button className={panel==="properties"?"on":""} onClick={()=>setPanel("properties")}>Properties</button><button className={panel==="toolbox"?"on":""} onClick={()=>setPanel("toolbox")}>Toolbox</button></div>
        {panel==="toolbox"?<div className="toolbox"><div className="search">⌕ Pesquisar assets</div><h4>ASSETS</h4>{["Part","Folder","Script","SpawnLocation"].map(x=><button key={x} onClick={()=>add(x)}><b>{x[0]}</b><span>{x}<small>Studio object</small></span><strong>＋</strong></button>)}</div>:<div className="props">{current?<><div className="objectTitle"><div className="objIcon">◈</div><div><b>{current.name}</b><small>{current.type}</small></div></div><label>TRANSFORM</label><Vector title="Position" values={current.position} change={(i,v)=>vector("position",i,v)}/><Vector title="Rotation" values={current.rotation} change={(i,v)=>vector("rotation",i,v)} suffix="°"/><Vector title="Size" values={current.size} change={(i,v)=>vector("size",i,v)}/><label>APPEARANCE</label>{current.type!=="Script"&&<><div className="field"><span>Material</span><select><option>Plastic</option><option>Metal</option><option>Wood</option><option>Glass</option></select></div><div className="field"><span>Color</span><input type="color" value={current.color} onChange={e=>update({color:e.target.value})}/></div></>}{current.type==="Script"&&<button className="wide primary" onClick={()=>{setOpenScript(current.id);setScriptText(current.script||"")}}>Abrir Script Editor</button>}<label>BEHAVIOR</label><Toggle text="Anchored" value={current.anchored} change={v=>update({anchored:v})}/><Toggle text="CanCollide" value={current.canCollide} change={v=>update({canCollide:v})}/></>:<div className="empty">Selecione um objeto</div>}</div>}
      </aside>
    </section>
    <footer><span>STUDIO LITE <b>v0.1</b></span><span>● Ready</span><span>Three.js • Luau</span></footer>
    {openScript&&<div className="overlay"><div className="scriptWin"><header><b>◇ {nodes.find(n=>n.id===openScript)?.name||"Script"}</b><div><button className="primary" onClick={()=>{setNodes(x=>x.map(n=>n.id===openScript?{...n,script:scriptText}:n));setStatus("Script salvo")}}>Salvar</button><button onClick={()=>setOpenScript(null)}>×</button></div></header><div className="editor"><div>{scriptText.split("\n").map((_,i)=><span key={i}>{i+1}</span>)}</div><textarea spellCheck={false} value={scriptText} onChange={e=>setScriptText(e.target.value)}/></div><small>Luau • UTF-8 • {scriptText.split("\n").length} linhas</small></div></div>}
    {modal&&<div className="overlay"><div className="modalCard"><button className="x" onClick={()=>setModal(null)}>×</button>{modal==="roblox"||modal==="publish"?<><div className="modalLogo">☁</div><h2>Roblox Cloud</h2><p>Conecte sua experiência para validar ou publicar. A API key fica apenas na memória desta sessão.</p><input placeholder="Universe ID" value={universeId} onChange={e=>setUniverseId(e.target.value)}/><input placeholder="Place ID" value={placeId} onChange={e=>setPlaceId(e.target.value)}/><input type="password" placeholder="Roblox API Key" value={apiKey} onChange={e=>setApiKey(e.target.value)}/><button className="wide" onClick={validate}>Validar conexão</button></>:<><div className="modalLogo">⇧</div><h2>Importar experiência</h2><p>Arquivos .rbxl e .rbxlx até 100 MB.</p><label className="drop">Escolher arquivo<input type="file" accept=".rbxl,.rbxlx" onChange={e=>setFile(e.target.files?.[0]||null)}/>{file&&<small>{file.name} • {(file.size/1024/1024).toFixed(2)} MB</small>}</label><button className="wide" onClick={analyze}>Analisar</button><button className="wide primary" onClick={publish}>Publicar no Roblox</button></>}</div></div>}
  </main>
}

function Vector({title,values,change,suffix=""}){return <div className="vector"><span>{title}</span><div>{values.map((v,i)=><input key={i} value={v+suffix} onChange={e=>change(i,e.target.value.replace(suffix,""))}/>)}</div></div>}
function Toggle({text,value,change}){return <div className="toggle"><span>{text}</span><button className={value?"switch on":"switch"} onClick={()=>change(!value)}><i/></button></div>}
