export const config = { api: { bodyParser: true } };

const BASE = "https://apis.roblox.com/cloud/v2";
const json = (res, status, body) => { res.status(status).setHeader("Cache-Control", "no-store").json(body); };
const clean = v => String(v ?? "").trim();
const validId = v => /^\d+$/.test(clean(v));
const SCRIPT_TYPES = ["Script", "LocalScript", "ModuleScript"];

async function roblox(path, apiKey, init = {}) {
  const maxRetries = 4;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const r = await fetch(BASE + path, { ...init, headers: { "x-api-key": apiKey, ...(init.headers || {}) } });
    const text = await r.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    const headers = Object.fromEntries(r.headers.entries());
    if (r.status !== 429 || attempt === maxRetries) return { status: r.status, ok: r.ok, data, headers };
    const retryAfter = Number(headers["retry-after"]);
    const reset = Number(headers["x-ratelimit-reset"]);
    const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 8) : Number.isFinite(reset) && reset > 0 ? Math.min(reset, 8) : Math.min(2 ** attempt, 8);
    await new Promise(resolve => setTimeout(resolve, Math.ceil(waitSeconds * 1000)));
  }
}

async function operation(path, apiKey) {
  for (let i = 0; i < 8; i++) {
    const r = await roblox("/" + String(path).replace(/^\//, ""), apiKey);
    if (!r.ok) { const e = new Error(r.data?.message || r.data?.error || ("Roblox operation HTTP " + r.status)); e.status = r.status; e.headers = r.headers; throw e; }
    if (r.data?.done) return r.data?.response || r.data;
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
  const e = new Error("O Roblox ainda está processando a operação. Tente novamente em alguns segundos."); e.status = 504; throw e;
}

function inferScriptType(details) {
  const d = details && typeof details === "object" ? details : {};
  for (const type of SCRIPT_TYPES) if (d[type] && typeof d[type] === "object") return type;
  return "";
}
function nodeFrom(item, parent) {
  const e = item.engineInstance || item.EngineInstance || {};
  const id = String(e.Id || e.id || item.id || item.path?.split("/").pop() || "");
  if (!id) return null;
  const details = e.Details || e.details || {};
  const scriptType = inferScriptType(details);
  const name = String(e.Name || e.name || details.Name || "Unnamed");
  const type = scriptType || String(e.ClassName || e.className || e.Type || details.ClassName || details.className || (item.hasChildren ? "Folder" : "Instance"));
  return { id, parent, name, type, hasChildren: Boolean(item.hasChildren ?? item.HasChildren ?? e.HasChildren ?? e.hasChildren), details: details && typeof details === "object" ? details : {} };
}

async function listChildren(universeId, placeId, instanceId, apiKey) {
  const r = await roblox("/universes/" + universeId + "/places/" + placeId + "/instances/" + encodeURIComponent(instanceId) + ":listChildren", apiKey);
  if (!r.ok) { const e = new Error(r.data?.message || r.data?.error || ("Falha ao listar filhos (HTTP " + r.status + ").")); e.status = r.status; e.headers = r.headers; throw e; }
  if (r.data?.response?.instances) return r.data.response.instances;
  if (r.data?.instances) return r.data.instances;
  if (r.data?.path) { const done = await operation(r.data.path, apiKey); return done?.instances || done?.response?.instances || []; }
  return [];
}

async function getInstance(universeId, placeId, instanceId, apiKey) {
  const r = await roblox("/universes/" + universeId + "/places/" + placeId + "/instances/" + encodeURIComponent(instanceId), apiKey);
  if (!r.ok) { const e = new Error(r.data?.message || r.data?.error || ("Falha ao obter instância (HTTP " + r.status + ").")); e.status = r.status; e.headers = r.headers; throw e; }
  if (r.data?.engineInstance) return r.data.engineInstance;
  if (r.data?.response?.engineInstance) return r.data.response.engineInstance;
  if (r.data?.response?.instance?.engineInstance) return r.data.response.instance.engineInstance;
  if (r.data?.path) return operation(r.data.path, apiKey).then(x => x?.engineInstance || x);
  return r.data;
}

async function loadTree(universeId, placeId, apiKey) {
  const children = await listChildren(universeId, placeId, "root", apiKey);
  return children.map(item => nodeFrom(item, "root")).filter(Boolean);
}
async function loadChildren(universeId, placeId, parentId, apiKey) {
  const children = await listChildren(universeId, placeId, parentId, apiKey);
  return children.map(item => nodeFrom(item, parentId)).filter(Boolean);
}
function findScriptDetails(value, preferredType = "") {
  if (!value || typeof value !== "object") return null;
  const wanted = preferredType && SCRIPT_TYPES.includes(preferredType) ? preferredType : "";
  const queue = [value];
  const seen = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    for (const type of (wanted ? [wanted, ...SCRIPT_TYPES.filter(x => x !== wanted)] : SCRIPT_TYPES)) {
      const candidate = current[type] || current[type.toLowerCase()];
      if (candidate && typeof candidate === "object") return { type, details: candidate };
    }
    for (const key of Object.keys(current)) {
      const child = current[key];
      if (child && typeof child === "object") queue.push(child);
    }
  }
  return null;
}

function readStringProperty(obj, name) {
  if (!obj || typeof obj !== "object") return "";
  const exact = obj[name] ?? obj[name.toLowerCase()];
  return typeof exact === "string" ? exact : "";
}

async function loadScriptSource(universeId, placeId, instanceId, apiKey) {
  const full = await getInstance(universeId, placeId, instanceId, apiKey);
  const found = findScriptDetails(full);
  const fallback = full?.Details || full?.details || {};
  const type = found?.type || inferScriptType(fallback);
  const scriptDetails = found?.details || (type && fallback[type]) || fallback;
  const source = readStringProperty(scriptDetails, "Source") || readStringProperty(full, "Source");
  const enabledValue = scriptDetails?.Enabled ?? scriptDetails?.enabled ?? full?.Enabled ?? full?.enabled;
  return {
    scriptType: type,
    source,
    enabled: enabledValue === undefined ? true : Boolean(enabledValue)
  };
}

async function updateScript(universeId, placeId, nodeId, scriptType, source, apiKey) {
  if (!validId(universeId) || !validId(placeId) || !nodeId) throw new Error("Identificação inválida.");
  if (!SCRIPT_TYPES.includes(scriptType)) throw new Error("Somente Script, LocalScript e ModuleScript podem ser editados.");
  const body = { engineInstance: { Details: { [scriptType]: { Source: String(source ?? "") } } } };
  const r = await roblox("/universes/" + universeId + "/places/" + placeId + "/instances/" + encodeURIComponent(nodeId), apiKey, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) { const e = new Error(r.data?.message || r.data?.error || ("Falha ao salvar (HTTP " + r.status + ").")); e.status = r.status; e.headers = r.headers; throw e; }
  if (r.data?.path) await operation(r.data.path, apiKey);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  const body = req.body || {};
  const apiKey = clean(req.headers["x-roblox-api-key"] || body.apiKey);
  if (!apiKey) return json(res, 401, { ok: false, code: "MISSING_API_KEY", error: "Informe sua chave de API do Roblox." });
  const universeId = clean(body.universeId || req.headers["x-roblox-universe-id"]);
  const placeId = clean(body.placeId || req.headers["x-roblox-place-id"]);
  if (!validId(universeId) || !validId(placeId)) return json(res, 400, { ok: false, code: "INVALID_IDS", error: "Universe ID e Place ID são obrigatórios." });
  try {
    if (req.method === "GET") return json(res, 200, { ok: true, service: "studio-rbxl-open-cloud" });
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
    const action = clean(body.action || "load");
    if (action === "load") return json(res, 200, { ok: true, universeId, placeId, tree: await loadTree(universeId, placeId, apiKey), editable: SCRIPT_TYPES, readOnly: true, lazy: true });
    if (action === "children") {
      const parentId = clean(body.parentId);
      if (!parentId || parentId === "root") return json(res, 400, { ok: false, error: "Parent ID inválido." });
      return json(res, 200, { ok: true, parentId, children: await loadChildren(universeId, placeId, parentId, apiKey) });
    }
    if (action === "source") {
      const instanceId = clean(body.instanceId);
      if (!instanceId) return json(res, 400, { ok: false, error: "Instance ID obrigatório." });
      return json(res, 200, { ok: true, instanceId, ...(await loadScriptSource(universeId, placeId, instanceId, apiKey)) });
    }
    if (action === "update") { await updateScript(universeId, placeId, clean(body.instanceId), clean(body.scriptType), body.source, apiKey); return json(res, 200, { ok: true, saved: true }); }
    if (action === "updateMany") {
      const changes = Array.isArray(body.changes) ? body.changes : [];
      if (changes.length > 100) return json(res, 400, { ok: false, error: "Limite de 100 arquivos por salvamento." });
      for (const change of changes) await updateScript(universeId, placeId, clean(change.instanceId), clean(change.scriptType), change.source, apiKey);
      return json(res, 200, { ok: true, saved: changes.length });
    }
    return json(res, 400, { ok: false, error: "Ação inválida." });
  } catch (error) {
    console.error("Studio RBXL Open Cloud:", error);
    const status = Number(error?.status);
    if (status === 429) { const reset = Number(error?.headers?.["x-ratelimit-reset"]); return json(res, 429, { ok: false, code: "ROBLOX_RATE_LIMITED", error: "O Roblox limitou temporariamente as solicitações. Aguarde alguns segundos e tente novamente.", retryAfter: Number.isFinite(reset) && reset > 0 ? reset : 5 }); }
    if (status === 504) return json(res, 504, { ok: false, code: "ROBLOX_OPERATION_PENDING", error: error?.message || "O Roblox ainda está processando a operação.", retryable: true });
    if (status === 403) return json(res, 403, { ok: false, code: "ROBLOX_FORBIDDEN", error: error?.message || "A chave do Roblox não tem a permissão necessária." });
    return json(res, 500, { ok: false, error: error?.message || String(error) });
  }
}
