"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./studio.css";

type Node = {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  color: string;
  anchored: boolean;
  canCollide: boolean;
};

const initial: Node[] = [
  { id: "spawn", name: "SpawnLocation", type: "SpawnLocation", position: [0, 1, 0], rotation: [0, 0, 0], size: [2, 1, 2], color: "#22c55e", anchored: true, canCollide: true },
  { id: "part", name: "Part", type: "Part", position: [0, 0, 0], rotation: [0, 0, 0], size: [8, 1, 8], color: "#64748b", anchored: true, canCollide: true },
  { id: "part2", name: "Platform", type: "Part", position: [0, 3, -7], rotation: [0, 0, 0], size: [6, 1, 4], color: "#8b5cf6", anchored: true, canCollide: true },
];

const clampNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function Home() {
  const mount = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectsRef = useRef(new Map<string, THREE.Mesh>());
  const nodesRef = useRef<Node[]>(initial);

  const [nodes, setNodes] = useState<Node[]>(initial);
  const [selected, setSelected] = useState("part");
  const [tab, setTab] = useState<"home" | "connect" | "import">("home");
  const [project, setProject] = useState("Meu Primeiro Jogo");
  const [status, setStatus] = useState("Pronto");
  const [tool, setTool] = useState<"select" | "move" | "rotate" | "scale">("select");
  const [universeId, setUniverseId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
    const scene = sceneRef.current;
    if (!scene) return;

    const wanted = new Set(nodes.map((n) => n.id));
    for (const [id, mesh] of objectsRef.current) {
      if (!wanted.has(id)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
        objectsRef.current.delete(id);
      }
    }

    for (const node of nodes) {
      let mesh = objectsRef.current.get(node.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({ roughness: 0.72 })
        );
        mesh.userData.nodeId = node.id;
        scene.add(mesh);
        objectsRef.current.set(node.id, mesh);
      }
      mesh.position.set(...node.position);
      mesh.rotation.set(...node.rotation.map((v) => THREE.MathUtils.degToRad(v)) as [number, number, number]);
      mesh.scale.set(...node.size);
      (mesh.material as THREE.MeshStandardMaterial).color.set(node.color);
      mesh.material.needsUpdate = true;
      mesh.visible = true;
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.emissive.set(node.id === selected ? "#1d4ed8" : "#000000");
      material.emissiveIntensity = node.id === selected ? 0.22 : 0;
    }
  }, [nodes, selected]);

  useEffect(() => {
    if (!mount.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090d14");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, mount.current.clientWidth / mount.current.clientHeight, 0.1, 1000);
    camera.position.set(13, 11, 18);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.current.clientWidth, mount.current.clientHeight);
    renderer.domElement.style.cursor = "crosshair";
    mount.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x263241, 2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(8, 18, 10);
    scene.add(keyLight);
    scene.add(new THREE.GridHelper(50, 50, 0x344052, 0x1b2430));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...objectsRef.current.values()], false);
      const hit = hits[0];
      if (hit?.object.userData.nodeId) {
        setSelected(hit.object.userData.nodeId);
        setStatus("Objeto selecionado");
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    let raf = 0;
    const animate = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      if (!mount.current) return;
      camera.aspect = mount.current.clientWidth / mount.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.current.clientWidth, mount.current.clientHeight);
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.dispose();
      renderer.domElement.remove();
      objectsRef.current.clear();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  const updateSelected = useCallback((patch: Partial<Node>) => {
    setNodes((current) => current.map((node) => node.id === selected ? { ...node, ...patch } : node));
  }, [selected]);

  const updateVector = (key: "position" | "rotation" | "size", index: 0 | 1 | 2, value: string) => {
    const node = nodes.find((item) => item.id === selected);
    if (!node) return;
    const next = [...node[key]] as [number, number, number];
    next[index] = clampNumber(value, next[index]);
    updateSelected({ [key]: next });
  };

  function addPart() {
    const id = crypto.randomUUID();
    setNodes((current) => [...current, {
      id,
      name: "Part",
      type: "Part",
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      size: [4, 1, 4],
      color: "#3b82f6",
      anchored: true,
      canCollide: true,
    }]);
    setSelected(id);
    setStatus("Part criado");
  }

  function duplicateSelected() {
    const source = nodes.find((item) => item.id === selected);
    if (!source) return;
    const id = crypto.randomUUID();
    const copy: Node = { ...source, id, name: source.name + " Copy", position: [source.position[0] + 2, source.position[1], source.position[2] + 2] };
    setNodes((current) => [...current, copy]);
    setSelected(id);
    setStatus("Objeto duplicado");
  }

  function deleteSelected() {
    const node = nodes.find((item) => item.id === selected);
    if (!node || node.id === "spawn") return setStatus("SpawnLocation não pode ser removido");
    setNodes((current) => current.filter((item) => item.id !== selected));
    setSelected(nodes.find((item) => item.id !== selected)?.id || "spawn");
    setStatus("Objeto removido");
  }

  function transformSelected(mode: "move" | "rotate" | "scale") {
    const node = nodes.find((item) => item.id === selected);
    if (!node) return;
    if (mode === "move") updateSelected({ position: [node.position[0] + 1, node.position[1], node.position[2]] });
    if (mode === "rotate") updateSelected({ rotation: [node.rotation[0], node.rotation[1] + 15, node.rotation[2]] });
    if (mode === "scale") updateSelected({ size: [node.size[0] + 1, node.size[1], node.size[2] + 1] });
    setTool(mode);
    setStatus(mode === "move" ? "Movido 1 stud" : mode === "rotate" ? "Rotacionado 15°" : "Escalado 1 stud");
  }

  async function validateRoblox() {
    setStatus("Validando Roblox…");
    try {
      const r = await fetch("/api/roblox/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ universeId, apiKey }) });
      const d = await r.json();
      setStatus(r.ok ? "Roblox conectado" : "Falha: " + (d.error || "chave inválida"));
    } catch {
      setStatus("Falha de conexão");
    }
  }

  async function publish() {
    if (!file) return setStatus("Selecione um .rbxl/.rbxlx primeiro");
    setStatus("Publicando…");
    const form = new FormData();
    form.append("universeId", universeId);
    form.append("placeId", placeId);
    form.append("apiKey", apiKey);
    form.append("file", file);
    try {
      const r = await fetch("/api/roblox/publish", { method: "POST", body: form });
      const d = await r.json();
      setStatus(r.ok ? "Publicado no Roblox" : "Falha: " + (d.error || "publicação recusada"));
    } catch {
      setStatus("Falha de publicação");
    }
  }

  async function analyzeFile() {
    if (!file) return setStatus("Selecione um arquivo");
    const form = new FormData();
    form.append("file", file);
    setStatus("Analisando…");
    try {
      const r = await fetch("/api/import", { method: "POST", body: form });
      const d = await r.json();
      if (!r.ok) {
        setStatus("Falha: " + d.error);
        return;
      }
      if (d.type === "rbxlx") {
        const parsed = await fetch("/api/import/parse", { method: "POST", body: form });
        const result = await parsed.json();
        if (parsed.ok && Array.isArray(result.nodes)) {
          setNodes(result.nodes);
          setSelected(result.nodes[0]?.id || "spawn");
          setStatus(result.count + " objetos importados para o editor");
        } else {
          setStatus("Arquivo válido, mas a estrutura não pôde ser convertida");
        }
      } else {
        setStatus("RBXL binário validado para publicação");
      }
    } catch {
      setStatus("Falha ao analisar");
    }
  }

  async function save() {
    setStatus("Salvando…");
    try {
      const r = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: project, scene: { nodes } }) });
      setStatus(r.ok ? "Projeto salvo" : "Modo local — faça login no Supabase");
    } catch {
      setStatus("Servidor indisponível");
    }
  }

  const current = nodes.find((item) => item.id === selected);

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand"><div className="logo">S</div><div><b>Studio Lite</b><span>WEB EDITOR</span></div></div>
        <div className="projectName"><input value={project} onChange={(e) => setProject(e.target.value)} /><small>• {status}</small></div>
        <div className="actions"><button onClick={save}>Salvar</button><button className="primary" onClick={() => setTab("import")}>Publicar</button></div>
      </header>

      <div className="toolbar">
        <button onClick={addPart}>＋ Part</button>
        <button onClick={duplicateSelected}>⧉ Duplicar</button>
        <button onClick={deleteSelected}>⌫ Excluir</button>
        <div className="divider" />
        <button className={tool === "move" ? "toolActive" : ""} onClick={() => transformSelected("move")}>Move</button>
        <button className={tool === "rotate" ? "toolActive" : ""} onClick={() => transformSelected("rotate")}>Rotate</button>
        <button className={tool === "scale" ? "toolActive" : ""} onClick={() => transformSelected("scale")}>Scale</button>
        <div className="spacer" />
        <button onClick={() => setTab("connect")}>☁ Roblox</button>
        <button onClick={() => setTab("import")}>⇧ Importar</button>
      </div>

      <section className="workspace">
        <aside className="left panel">
          <div className="panelHead"><b>Explorer</b><button onClick={addPart}>＋</button></div>
          <div className="tree">
            <div className="treeRoot">▾ Workspace</div>
            {nodes.map((node) => (
              <button key={node.id} className={"treeItem " + (selected === node.id ? "selected" : "")} onClick={() => setSelected(node.id)}>
                ◈ {node.name}<em>{node.type}</em>
              </button>
            ))}
            <div className="treeRoot">▸ Lighting</div>
            <div className="treeRoot">▸ ReplicatedStorage</div>
            <div className="treeRoot">▸ ServerScriptService</div>
            <div className="treeRoot">▸ StarterGui</div>
          </div>
        </aside>

        <div className="viewport">
          <div ref={mount} className="canvas" />
          <div className="viewportHud"><span>Perspective</span><span>Grid 1 stud</span><span>FPS 60</span></div>
          <div className="crosshair">＋</div>
          <div className="toolHint">Clique em um objeto para selecionar • {tool === "select" ? "Select" : tool}</div>
        </div>

        <aside className="right panel">
          <div className="panelTabs"><button className="active">Properties</button><button>Toolbox</button></div>
          <div className="properties">
            <h4>{current?.name || "Selecione um objeto"}</h4>
            {current && <>
              <label>Transform</label>
              <VectorRow title="Position" values={current.position} onChange={(i, v) => updateVector("position", i, v)} />
              <VectorRow title="Rotation" values={current.rotation} onChange={(i, v) => updateVector("rotation", i, v)} suffix="°" />
              <VectorRow title="Size" values={current.size} onChange={(i, v) => updateVector("size", i, v)} />
              <label>Appearance</label>
              <div className="row"><span>Material</span><select><option>Plastic</option><option>Metal</option><option>Wood</option><option>Glass</option></select></div>
              <div className="row"><span>Color</span><input type="color" value={current.color} onChange={(e) => updateSelected({ color: e.target.value })} /></div>
              <label>Behavior</label>
              <div className="toggle"><span>Anchored</span><input type="checkbox" checked={current.anchored} onChange={(e) => updateSelected({ anchored: e.target.checked })} /></div>
              <div className="toggle"><span>CanCollide</span><input type="checkbox" checked={current.canCollide} onChange={(e) => updateSelected({ canCollide: e.target.checked })} /></div>
            </>}
          </div>
        </aside>
      </section>

      <footer className="statusbar"><span>Studio Lite Web</span><span>Editor 3D • Safe publish pipeline</span><span>WebGL</span></footer>

      {tab !== "home" && <div className="modal"><div className="modalCard">
        <button className="close" onClick={() => setTab("home")}>×</button>
        {tab === "connect" ? <>
          <div className="modalIcon">☁</div><h2>Conectar ao Roblox</h2>
          <p>A chave não é gravada no código público. Ela é enviada por HTTPS ao endpoint do servidor somente quando você valida ou publica.</p>
          <input placeholder="Universe ID" inputMode="numeric" value={universeId} onChange={(e) => setUniverseId(e.target.value)} />
          <input placeholder="Place ID" inputMode="numeric" value={placeId} onChange={(e) => setPlaceId(e.target.value)} />
          <input type="password" placeholder="Roblox API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" />
          <button className="primary wide" onClick={validateRoblox}>Validar conexão</button>
          <small>Restrinja a chave à experiência e conceda somente as permissões necessárias.</small>
        </> : <>
          <div className="modalIcon">⇧</div><h2>Importar experiência</h2>
          <p>Envie um arquivo .rbxl ou .rbxlx. O pipeline verifica extensão e tamanho antes da publicação.</p>
          <label className="drop">Selecione o arquivo
            <input type="file" accept=".rbxl,.rbxlx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file && <small>{file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB</small>}
          </label>
          <button className="wide" onClick={analyzeFile}>Analisar arquivo</button>
          <button className="primary wide" onClick={publish}>Publicar no Roblox</button>
        </>}
      </div></div>}
    </main>
  );
}

function VectorRow({ title, values, onChange, suffix = "" }: { title: string; values: [number, number, number]; onChange: (index: 0 | 1 | 2, value: string) => void; suffix?: string }) {
  return <div className="vectorRow"><span>{title}</span><div>{values.map((value, index) => <input key={index} aria-label={title + " " + index} value={value + suffix} onChange={(e) => onChange(index as 0 | 1 | 2, e.target.value.replace(suffix, ""))} />)}</div></div>;
}
