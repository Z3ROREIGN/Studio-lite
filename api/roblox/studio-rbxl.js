export const config = { api: { bodyParser: true } };

const BASE = "https://apis.roblox.com/cloud/v2";
const json = (res, status, body) => { res.status(status).setHeader("Cache-Control", "no-store").json(body); };
const clean = v => String(v ?? "").trim();
const validId = v => /^\d+$/.test(clean(v));

async function roblox(path, apiKey, init = {}) {
  const maxRetries = 5;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const r = await fetch(BASE + path, {
      ...init,
      headers: { "x-api-key": apiKey, ...(init.headers || {}) },
    });
    const text = await r.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    const headers = Object.fromEntries(r.headers.entries());
    if (r.status !== 429 || attempt === maxRetries) return { status: r.status, ok: r.ok, data, headers };

    const retryAfter = Number(headers["retry-after"]);
    const reset = Number(headers["x-ratelimit-reset"]);
    const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter
      : Number.isFinite(reset) && reset > 0
        ? reset
        : Math.min(2 ** attempt * 2, 20);
    await new Promise(resolve => setTimeout(resolve, Math.ceil(waitSeconds * 1000)));
  }
}

async function operation(path, apiKey) {
  // Roblox recommends polling asynchronous operations roughly every 5 seconds.
  for (let i = 0; i < 10; i++) {
    const r = await roblox("/" + String(path).replace(/^\//, ""), apiKey);
    if (!r.ok) {
      const message = r.data?.message || r.data?.error || ("Roblox operation HTTP " + r.status);
      const error = new Error(message);
      error.status = r.status;
      error.headers = r.headers;
      throw error;
    }
    if (r.data?.done) return r.data?.response || r.data;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error("O Roblox Open Cloud demorou demais para concluir a operação.");
}

async function listChildren(universeId, placeId, instanceId, apiKey) {
  const r = await roblox("/universes/" + universeId + "/places/" + placeId + "/instances/" + encodeURIComponent(instanceId) + ":listChildren", apiKey);
  if (!r.ok) throw new Error(r.data?.message || r.data?.error || ("Falha ao listar filhos (HTTP " + r.status + ")."));
  if (r.data?.response?.instances) return r.data.response.instances;
  if (r.data?.instances) return r.data.instances;
  if (r.data?.path) {
    const done = await operation(r.data.path, apiKey);
    return done?.instances || done?.response?.instances || [];
  }
  return [];
}

async function getInstance(universeId, placeId, instanceId, apiKey) {
  const r = await roblox("/universes/" + universeId + "/places/" + placeId + "/instances/" + encodeURIComponent(instanceId), apiKey);
  if (!r.ok) throw new Error(r.data?.message || r.data?.error || ("Falha ao obter instância (HTTP " + r.status + ")."));
  if (r.data?.engineInstance) return r.data.engineInstance;
  if (r.data?.response?.engineInstance) return r.data.response.engineInstance;
  if (r.data?.path) return operation(r.data.path, apiKey).then(x => x?.engineInstance || x);
  return r.data;
}

async function loadTree(universeId, placeId, apiKey) {
  const out = [];
  const queue = [{ id: "root", parent: null }];
  const seen = new Set();
  while (queue.length && out.length < 10000) {
    const current = queue.shift();
    if (seen.has(current.id)) continue;
    seen.add(current.id);
    const children = await listChildren(universeId, placeId, current.id, apiKey);
    for (const item of children) {
      const e = item.engineInstance || item.EngineInstance || {};
      const id = String(e.Id || e.id || item.id || item.path?.split("/").pop() || "");
      if (!id) continue;
      const details = e.Details || e.details || {};
      const type = String(e.ClassName || e.className || e.Type || details.ClassName || details.className || "Instance");
      const name = String(e.Name || e.name || details.Name || "Unnamed");
      const hasChildren = Boolean(item.hasChildren ?? item.HasChildren ?? e.HasChildren ?? e.hasChildren);
      out.push({ id, parent: current.id, name, type, hasChildren, details: details && typeof details === "object" ? details : {} });
      if (hasChildren) queue.push({ id });
    }
  }
  const scripts = out.filter(x => ["Script", "LocalScript", "ModuleScript"].includes(x.type));
  for (let i = 0; i < scripts.length; i += 6) {
    await Promise.all(scripts.slice(i, i + 6).map(async node => {
      try {
        const full = await getInstance(universeId, placeId, node.id, apiKey);
        const details = full?.Details || full?.details || {};
        node.source = typeof details.Source === "string" ? details.Source : (typeof details.source === "string" ? details.source : "");
        node.enabled = details.Enabled ?? details.enabled ?? true;
      } catch (e) {
        node.source = "";
        node.readError = e.message;
      }
    }));
  }
  return out;
}

async function updateScript(universeId, placeId, nodeId, scriptType, source, apiKey) {
  if (!validId(universeId) || !validId(placeId) || !nodeId) throw new Error("Identificação inválida.");
  if (!["Script", "LocalScript", "ModuleScript"].includes(scriptType)) throw new Error("Somente Script, LocalScript e ModuleScript podem ser editados.");
  const body = { engineInstance: { Details: { [scriptType]: { Source: String(source ?? "") } } } };
  const r = await roblox("/universes/" + universeId + "/places/" + placeId + "/instances/" + encodeURIComponent(nodeId), apiKey, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(r.data?.message || r.data?.error || ("Falha ao salvar (HTTP " + r.status + ")."));
  if (r.data?.path) await operation(r.data.path, apiKey);
  return true;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  const apiKey = clean(req.headers["x-roblox-api-key"] || req.body?.apiKey);
  if (!apiKey) return json(res, 401, { ok: false, code: "MISSING_API_KEY", error: "Informe sua chave de API do Roblox." });
  const body = req.body || {};
  const universeId = clean(body.universeId || req.headers["x-roblox-universe-id"]);
  const placeId = clean(body.placeId || req.headers["x-roblox-place-id"]);
  if (!validId(universeId) || !validId(placeId)) return json(res, 400, { ok: false, code: "INVALID_IDS", error: "Universe ID e Place ID são obrigatórios." });
  try {
    if (req.method === "GET") return json(res, 200, { ok: true, service: "studio-rbxl-open-cloud" });
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
    const action = clean(body.action || "load");
    if (action === "load") {
      const tree = await loadTree(universeId, placeId, apiKey);
      return json(res, 200, { ok: true, universeId, placeId, tree, editable: ["Script", "LocalScript", "ModuleScript"], readOnly: true });
    }
    if (action === "update") {
      await updateScript(universeId, placeId, clean(body.instanceId), clean(body.scriptType), body.source, apiKey);
      return json(res, 200, { ok: true, saved: true });
    }
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
    if (status === 429) {
      const reset = Number(error?.headers?.["x-ratelimit-reset"]);
      return json(res, 429, {
        ok: false,
        code: "ROBLOX_RATE_LIMITED",
        error: "O Roblox limitou temporariamente as solicitações. Aguarde alguns segundos e tente novamente.",
        retryAfter: Number.isFinite(reset) && reset > 0 ? reset : 5
      });
    }
    if (status === 403) {
      return json(res, 403, {
        ok: false,
        code: "ROBLOX_FORBIDDEN",
        error: error?.message || "A chave do Roblox não tem a permissão necessária."
      });
    }
    return json(res, 500, { ok: false, error: error?.message || String(error) });
  }
}
