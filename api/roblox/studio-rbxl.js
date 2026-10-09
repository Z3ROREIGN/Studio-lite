export const config = { api: { bodyParser: true } };

const BASE = "https://apis.roblox.com/cloud/v2";
const json = (res, status, body) => { res.status(status).setHeader("Cache-Control", "no-store").json(body); };
const clean = v => String(v ?? "").trim();
const validId = v => /^\d+$/.test(clean(v));

async function teamCreateRequest(path, apiKey) {
  const r = await fetch("https://apis.roblox.com/legacy-develop" + path, {
    method: "GET",
    headers: { "x-api-key": apiKey, "Accept": "application/json" }
  });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  return { ok: r.ok, status: r.status, data };
}

async function setTeamCreateEnabled(universeId, enabled, apiKey) {
  const r = await fetch("https://apis.roblox.com/legacy-develop/v1/universes/" + universeId + "/teamcreate", {
    method: "PATCH",
    headers: { "x-api-key": apiKey, "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ isEnabled: Boolean(enabled) })
  });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!r.ok) {
    const message = data.message || data.errors?.[0]?.message || data.error || ("Roblox HTTP " + r.status);
    const e = new Error(message);
    e.status = r.status;
    e.roblox = data;
    throw e;
  }
  return { enabled: Boolean(enabled), status: r.status, data };
}

async function readTeamCreateStatus(universeId, placeId, apiKey) {
  // Read-only calls to Roblox's documented experimental Team Create endpoints.
  const [settings, session] = await Promise.all([
    teamCreateRequest("/v1/universes/" + universeId + "/teamcreate", apiKey),
    teamCreateRequest("/v1/places/" + placeId + "/teamcreate/active_session/members", apiKey)
  ]);
  const settingsBody = settings.data || {};
  const sessionBody = session.data || {};
  const members = sessionBody.data || sessionBody.members || sessionBody.activeSessionMembers || [];
  return {
    readOnly: true,
    experimental: true,
    universeId,
    placeId,
    settings: settings.ok ? { available: true, status: settings.status, data: settingsBody } : {
      available: false, status: settings.status,
      error: settingsBody.message || settingsBody.errors?.[0]?.message || settingsBody.error || "A Roblox não permitiu consultar as configurações de Team Create."
    },
    activeSession: session.ok ? {
      available: true, status: session.status,
      members: Array.isArray(members) ? members.map(m => ({
        userId: m.userId ?? m.id ?? null,
        name: m.username ?? m.name ?? m.displayName ?? null
      })) : [],
      rawCount: Array.isArray(members) ? members.length : null
    } : {
      available: false, status: session.status,
      error: sessionBody.message || sessionBody.errors?.[0]?.message || sessionBody.error || "A Roblox não permitiu consultar os membros da sessão ativa."
    },
    hint: "Consulta somente leitura. Os endpoints são experimentais e podem exigir o escopo legacy-universe:manage. A ausência de membros retornados não prova que SavePlaceAsync esteja livre de bloqueio."
  };
}

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

async function operation(path, apiKey, options = {}) {
  const maxPolls = Math.max(1, Math.min(Number(options.maxPolls) || 120, 120));
  const delayMs = Math.max(250, Math.min(Number(options.delayMs) || 2500, 5000));
  for (let i = 0; i < maxPolls; i++) {
    const r = await roblox("/" + String(path).replace(/^\//, ""), apiKey);
    if (r.status === 409 && i < maxPolls - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      continue;
    }
    if (!r.ok) {
      const detail = r.data?.message || r.data?.error || r.data?.errorMessage || r.data?.detail || r.data?.description || "";
      const e = new Error(detail ? ("Roblox HTTP " + r.status + ": " + detail) : ("Roblox operation HTTP " + r.status));
      e.status = r.status;
      e.headers = r.headers;
      e.roblox = r.data;
      throw e;
    }
    const data = r.data || {};
    const state = String(data.state || "").toUpperCase();
    if (["FAILED", "ERROR", "CANCELLED", "CANCELED"].includes(state) || (data.done === true && data.error)) {
      const taskError = data.error;
      const message = typeof taskError === "string" ? taskError : taskError?.message || taskError?.detail || taskError?.description || data.response?.message;
      let logText = "";
      try {
        if (String(path).includes("/luau-execution-session-tasks/")) {
          const lr = await roblox("/" + String(path).replace(/^\/+/, "") + "/logs", apiKey);
          const logs = lr.data?.luauExecutionSessionTaskLogs || lr.data?.logs || [];
          const messages = [];
          for (const entry of Array.isArray(logs) ? logs : []) {
            for (const m of (entry?.messages || [])) messages.push(String(m));
          }
          logText = messages.filter(Boolean).join("\n");
        }
      } catch {}
      const finalMessage = logText ? ((message || "A tarefa Luau falhou.") + " | Logs: " + logText) : (message || "O Roblox recusou ou falhou a operação.");
      const e = new Error(finalMessage);
      e.status = 400; e.headers = r.headers; e.robloxTask = data; throw e;
    }
    if (["COMPLETE", "SUCCEEDED"].includes(state) || data.done === true) {
      return data.response || data.output || data;
    }
    if (i < maxPolls - 1) await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  if (options.allowPending) return { pending: true, path: String(path).replace(/^\/+/, "") };
  const e = new Error("O Roblox demorou mais de 5 minutos para concluir a operação. Verifique a tarefa no Roblox e tente novamente."); e.status = 504; throw e;
}
function inferScriptType(details) {
  const d = details && typeof details === "object" ? details : {};
  for (const type of SCRIPT_TYPES) if (d[type] && typeof d[type] === "object") return type;
  return "";
}
const CONTAINER_TYPES = new Set(["Folder","Model","Tool","Configuration","ScreenGui","SurfaceGui","BillboardGui","Frame","ScrollingFrame","ViewportFrame","WorldModel","Part","MeshPart","UnionOperation","Terrain","Camera","SpawnLocation","Seat","VehicleSeat","Accessory","Hat","Humanoid"]);
const ROOT_SERVICES = new Set(["Workspace","Players","Lighting","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService"]);
function unwrapInstance(item) {
  const e = item?.engineInstance || item?.EngineInstance || item?.instance?.engineInstance || item?.instance || item || {};
  return e && typeof e === "object" ? e : {};
}
function nodeFrom(item, parent) {
  const e = unwrapInstance(item);
  const details = e.Details || e.details || item?.Details || item?.details || {};
  const id = String(e.Id || e.id || item?.id || item?.instanceId || item?.path?.split("/").pop() || e.path?.split("/").pop() || "").trim();
  if (!id) return null;
  const scriptType = inferScriptType(details);
  const explicitClass = String(e.ClassName || e.className || e.Type || e.type || item?.ClassName || item?.className || "").trim();
  const detailClass = Object.keys(details).find(k => CONTAINER_TYPES.has(k) || SCRIPT_TYPES.includes(k)) || "";
  const name = String(e.Name || e.name || item?.Name || item?.name || details.Name || details.name || "").trim() || "Unnamed";
  const type = scriptType || explicitClass || detailClass || (ROOT_SERVICES.has(name) ? name : (item?.hasChildren ?? item?.HasChildren ?? e.HasChildren ?? e.hasChildren ? "Folder" : "Instance"));
  const explicitChildren = item?.hasChildren ?? item?.HasChildren ?? e.HasChildren ?? e.hasChildren;
  const hasChildren = explicitChildren === undefined ? (ROOT_SERVICES.has(name) || CONTAINER_TYPES.has(type)) : Boolean(explicitChildren);
  const actualParent = String(e.Parent || e.parent || item?.parent || parent || "root").trim() || "root";
  return { id, parent: actualParent === id ? parent : actualParent, name, type, hasChildren, details: details && typeof details === "object" ? details : {} };
}

async function listChildren(universeId, placeId, instanceId, apiKey) {
  const r = await roblox("/universes/" + universeId + "/places/" + placeId + "/instances/" + encodeURIComponent(instanceId) + ":listChildren", apiKey);
  if (!r.ok) { const e = new Error(r.data?.message || r.data?.error || ("Falha ao listar filhos (HTTP " + r.status + ").")); e.status = r.status; e.headers = r.headers; throw e; }
  if (r.data?.response?.instances) return r.data.response.instances;
  if (r.data?.response?.response?.instances) return r.data.response.response.instances;
  if (r.data?.instances) return r.data.instances;
  if (r.data?.path) {
    const done = await operation(r.data.path, apiKey, { maxPolls: 2, delayMs: 1200, allowPending: true });
    if (done?.pending) return { pending: true, operationPath: done.path };
    return { instances: done?.instances || done?.response?.instances || [] };
  }
  return { instances: [] };
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
  const result = await listChildren(universeId, placeId, "root", apiKey);
  if (result?.pending) return result;
  return (result?.instances || []).map(item => nodeFrom(item, "root")).filter(Boolean);
}
async function loadChildren(universeId, placeId, parentId, apiKey) {
  const result = await listChildren(universeId, placeId, parentId, apiKey);
  if (result?.pending) return result;
  return (result?.instances || []).map(item => nodeFrom(item, parentId)).filter(Boolean);
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

async function updateScriptWithInstance(universeId, placeId, instanceId, scriptType, source, apiKey) {
  if (!validId(universeId) || !validId(placeId) || !clean(instanceId)) throw new Error("Identificação da instância inválida.");
  if (!SCRIPT_TYPES.includes(scriptType)) throw new Error("Somente Script, LocalScript e ModuleScript podem ser editados.");
  const sourceText = String(source ?? "");
  if (sourceText.length > 190000) throw new Error("O código ultrapassa o limite permitido pela API do Roblox.");
  const path = "/universes/" + universeId + "/places/" + placeId + "/instances/" + encodeURIComponent(clean(instanceId));
  const body = {
    engineInstance: {
      Details: {
        [scriptType]: { Source: sourceText }
      }
    }
  };
  const r = await roblox(path, apiKey, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const message = r.data?.message || r.data?.error || ("Falha ao atualizar Script pelo Instance API (HTTP " + r.status + ").");
    const e = new Error(message);
    e.status = r.status; e.headers = r.headers; throw e;
  }
  if (!r.data?.path) throw new Error("O Roblox não retornou a operação de atualização da instância.");
  return { path: r.data.path };
}

async function resolveInstanceSegments(universeId, placeId, instanceId, apiKey) {
  const segments = [];
  let currentId = clean(instanceId);
  const seen = new Set();
  for (let guard = 0; guard < 50 && currentId && currentId !== "root"; guard++) {
    if (seen.has(currentId)) throw new Error("Foi detectado um ciclo na hierarquia do Roblox.");
    seen.add(currentId);
    const instance = await getInstance(universeId, placeId, currentId, apiKey);
    const engine = instance?.engineInstance || instance?.EngineInstance || instance || {};
    const name = clean(engine.Name || engine.name);
    if (!name) throw new Error("O Roblox retornou uma instância sem nome para o Instance ID informado.");
    segments.unshift(name);
    currentId = clean(engine.Parent || engine.parent);
  }
  if (!segments.length) throw new Error("Não foi possível reconstruir a localização da instância no Roblox.");
  const rootServices = new Set(["Workspace","Players","Lighting","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService"]);
  if (!rootServices.has(segments[0])) throw new Error("A instância pertence a um serviço raiz não suportado: " + segments[0]);
  return segments;
}

async function publishPlaceWithLuau(universeId, placeId, apiKey) {
  if (!validId(universeId) || !validId(placeId)) throw new Error("Universe ID ou Place ID inválido.");
  const path = "/universes/" + universeId + "/places/" + placeId + "/luau-execution-session-tasks";
  const script = [
    'local assetService = game:GetService("AssetService")',
    'local ok, result = pcall(function()',
    '  assetService:SavePlaceAsync({PlaceId = game.PlaceId, SaveWithoutPublish = false})',
    'end)',
    'if not ok then error("SavePlaceAsync: " .. tostring(result)) end',
    'return { published = true, placeId = game.PlaceId, universeId = game.GameId }'
  ].join("\n");
  const r = await roblox(path, apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script })
  });
  if (!r.ok) {
    const e = new Error(r.data?.message || r.data?.error || ("Falha ao iniciar publicação do Place (HTTP " + r.status + ")."));
    e.status = r.status; e.headers = r.headers; e.roblox = r.data; throw e;
  }
  if (!r.data?.path) throw new Error("O Roblox não retornou a tarefa de publicação.");
  const result = await operation(r.data.path, apiKey);
  return { published: true, taskPath: r.data.path, result };
}

async function updateScriptWithLuau(universeId, placeId, segments, scriptType, source, apiKey) {
  if (!validId(universeId) || !validId(placeId)) throw new Error("Identificação inválida.");
  if (!SCRIPT_TYPES.includes(scriptType)) throw new Error("Somente Script, LocalScript e ModuleScript podem ser editados.");
  if (!Array.isArray(segments) || !segments.length || segments.length > 40) {
    throw new Error("Caminho de script inválido: o editor não enviou a hierarquia completa.");
  }
  const cleanSegments = segments.map(v => String(v ?? "").trim());
  const badIndex = cleanSegments.findIndex(v => !v || v.length > 100 || /[\\u0000-\\u001F\\u007F]/.test(v));
  if (badIndex !== -1) {
    throw new Error("Caminho de script inválido: o nome do objeto na posição " + (badIndex + 1) + " está vazio ou contém caracteres de controle.");
  }
  const [root, ...children] = cleanSegments;
  const rootServices = new Set(["Workspace","Players","Lighting","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService"]);
  if (!rootServices.has(root)) throw new Error("O caminho precisa começar por um serviço válido.");
  const safe = value => JSON.stringify(String(value ?? "")).replace(/</g, "\\u003c");
  let expr = 'game:GetService(' + safe(root) + ')';
  for (const child of children) expr += ':FindFirstChild(' + safe(child) + ')';
  const script = [
    "local target = " + expr,
    "if not target then error(" + JSON.stringify("O script não foi encontrado no Roblox.") + ") end",
    "if not target:IsA(" + JSON.stringify(scriptType) + ") then error(" + JSON.stringify("O objeto encontrado não é do tipo esperado.") + ") end",
    "target.Source = " + safe(source),
    "game:GetService(" + JSON.stringify("AssetService") + "):SavePlaceAsync({PlaceId = game.PlaceId})",
    "return { saved = true, name = target.Name, className = target.ClassName }"
  ].join("\n");
  const path = "/universes/" + universeId + "/places/" + placeId + "/luau-execution-session-tasks";
  const r = await roblox(path, apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script })
  });
  if (!r.ok) {
    const e = new Error(r.data?.message || r.data?.error || ("Falha ao publicar script no Roblox (HTTP " + r.status + ")."));
    e.status = r.status; e.headers = r.headers; throw e;
  }
  return { path: r.data?.path || "", state: r.data?.state || "PROCESSING" };
}


async function createScriptWithLuau(universeId, placeId, scriptType, name, parentPath, source, apiKey) {
  if (!SCRIPT_TYPES.includes(scriptType)) throw new Error("Tipo de script inválido.");
  const safe = value => JSON.stringify(String(value ?? "")).replace(/</g, "\\u003c");
  const script = [
    "local parent = " + parentPath,
    "if not parent then error(\"Parent do novo script não foi encontrado\") end",
    "local script = Instance.new(" + safe(scriptType) + ")",
    "script.Name = " + safe(name),
    "script.Source = " + safe(source),
    "script.Parent = parent",
    "game:GetService(\"AssetService\"):SavePlaceAsync({PlaceId = game.PlaceId})",
    "return { created = true, name = script.Name, className = script.ClassName }"
  ].join("\n");
  const path = "/universes/" + universeId + "/places/" + placeId + "/luau-execution-session-tasks";
  const r = await roblox(path, apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script })
  });
  if (!r.ok) {
    const e = new Error(r.data?.message || r.data?.error || ("Falha ao criar Script no Roblox (HTTP " + r.status + ")."));
    e.status = r.status; e.headers = r.headers; throw e;
  }
  return { path: r.data?.path || "", state: r.data?.state || "PROCESSING" };
}


async function deleteInstanceWithLuau(universeId, placeId, segments, apiKey) {
  if (!Array.isArray(segments) || !segments.length || segments.length > 20) throw new Error("Caminho inválido.");
  const cleanSegments = segments.map(v => String(v ?? "").trim());
  const badIndex = cleanSegments.findIndex(v => !v || v.length > 100 || /[\\u0000-\\u001F\\u007F]/.test(v));
  if (badIndex !== -1) throw new Error("Caminho inválido: o nome do objeto na posição " + (badIndex + 1) + " está vazio ou contém caracteres de controle.");
  const [root, ...children] = cleanSegments;
  const rootServices = new Set(["Workspace","Players","Lighting","ReplicatedFirst","ReplicatedStorage","ServerScriptService","ServerStorage","StarterGui","StarterPack","StarterPlayer","Teams","SoundService","Chat","TextChatService","MaterialService","TestService","VoiceChatService"]);
  if (!rootServices.has(root)) throw new Error("A exclusão precisa começar por um serviço válido.");
  let expr = root === "Workspace" ? 'game:GetService("Workspace")' : 'game:GetService(' + JSON.stringify(root) + ')';
  for (const child of children) expr += ':FindFirstChild(' + JSON.stringify(child) + ')';
  const script = [
    "local target = " + expr,
    "if not target then error(" + JSON.stringify("O objeto não foi encontrado no Roblox.") + ") end",
    "if #target:GetChildren() >= 0 and target.Parent == game then error(" + JSON.stringify("Não é permitido excluir serviços do Roblox.") + ") end",
    "if target:IsA(" + JSON.stringify("Players") + ") then error(" + JSON.stringify("Não é permitido excluir um serviço.") + ") end",
    "local deletedName = target.Name",
    "local deletedClass = target.ClassName",
    "target:Destroy()",
    "game:GetService(" + JSON.stringify("AssetService") + "):SavePlaceAsync({PlaceId = game.PlaceId})",
    "return { deleted = true, name = deletedName, className = deletedClass }"
  ].join("\\n");
  const path = "/universes/" + universeId + "/places/" + placeId + "/luau-execution-session-tasks";
  const r = await roblox(path, apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script })
  });
  if (!r.ok) {
    const e = new Error(r.data?.message || r.data?.error || ("Falha ao excluir no Roblox (HTTP " + r.status + ")."));
    e.status = r.status; e.headers = r.headers; throw e;
  }
  return { path: r.data?.path || "", state: r.data?.state || "PROCESSING" };
}

async function runLuauDiagnostic(universeId, placeId, apiKey) {
  const path = "/universes/" + universeId + "/places/" + placeId + "/luau-execution-session-tasks";
  const script = [
    'local ok, err = pcall(function() return game:GetService("Workspace") ~= nil end)',
    'if not ok then error(tostring(err)) end',
    'return { ok = true, placeId = game.PlaceId, universeId = game.GameId }'
  ].join("\n");
  const r = await roblox(path, apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script })
  });
  if (!r.ok) {
    const message = r.data?.message || r.data?.error || r.data?.errorMessage || ("Falha ao iniciar diagnóstico Luau (HTTP " + r.status + ").");
    const e = new Error(message);
    e.status = r.status; e.headers = r.headers; e.roblox = r.data; throw e;
  }
  if (!r.data?.path) throw new Error("O Roblox não retornou o caminho da tarefa Luau.");
  const task = await operation(r.data.path, apiKey);
  return { taskPath: r.data.path, state: "COMPLETE", output: task };
}

async function runSavePermissionDiagnostic(universeId, placeId, apiKey) {
  const path = "/universes/" + universeId + "/places/" + placeId + "/luau-execution-session-tasks";
  const script = [
    'local assetService = game:GetService("AssetService")',
    'local ok, result = pcall(function()',
    '  return assetService:SavePlaceAsync({PlaceId = game.PlaceId, SaveWithoutPublish = true})',
    'end)',
    'if not ok then error("SavePlaceAsync: " .. tostring(result)) end',
    'return { ok = true, saveWithoutPublish = true, placeId = game.PlaceId, universeId = game.GameId }'
  ].join("\n");
  const r = await roblox(path, apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script })
  });
  if (!r.ok) {
    const message = r.data?.message || r.data?.error || r.data?.errorMessage || ("Falha ao iniciar teste de salvamento (HTTP " + r.status + ").");
    const e = new Error(message);
    e.status = r.status; e.headers = r.headers; e.roblox = r.data; throw e;
  }
  if (!r.data?.path) throw new Error("O Roblox não retornou o caminho da tarefa de salvamento.");
  const task = await operation(r.data.path, apiKey);
  return { taskPath: r.data.path, state: "COMPLETE", output: task };
}


async function runPublishPreflight(universeId, placeId, apiKey) {
  // Este teste usa a mesma operação que a publicação usa, mas com
  // SaveWithoutPublish=true. Assim conseguimos identificar bloqueios do Roblox
  // (incluindo PlaceOngoingTeamCreateSession) antes de alterar scripts.
  const path = "/universes/" + universeId + "/places/" + placeId + "/luau-execution-session-tasks";
  const script = [
    'local assetService = game:GetService("AssetService")',
    'local ok, result = pcall(function()',
    '  return assetService:SavePlaceAsync({PlaceId = game.PlaceId, SaveWithoutPublish = true})',
    'end)',
    'if not ok then error("SavePlaceAsync: " .. tostring(result)) end',
    'return { ok = true, placeId = game.PlaceId, universeId = game.GameId, saveWithoutPublish = true }'
  ].join("\n");
  const r = await roblox(path, apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script })
  });
  if (!r.ok) {
    const e = new Error(r.data?.message || r.data?.error || r.data?.errorMessage || ("Falha ao iniciar pré-diagnóstico de publicação (HTTP " + r.status + ")."));
    e.status = r.status; e.headers = r.headers; e.roblox = r.data; throw e;
  }
  if (!r.data?.path) throw new Error("O Roblox não retornou o caminho da tarefa de pré-diagnóstico.");
  const result = await operation(r.data.path, apiKey);
  return { taskPath: r.data.path, state: "COMPLETE", output: result };
}

async function getLuauTask(taskPath, apiKey) {
  const cleanPath = clean(taskPath).replace(/^\/+/, "");
  if (!cleanPath.startsWith("universes/") || !cleanPath.includes("/luau-execution-session-tasks/")) {
    const e = new Error("Tarefa Roblox inválida."); e.status = 400; throw e;
  }
  const r = await roblox("/" + cleanPath, apiKey);
  if (!r.ok) {
    const e = new Error(r.data?.message || r.data?.error || ("Falha ao consultar tarefa Roblox (HTTP " + r.status + ")."));
    e.status = r.status; e.headers = r.headers; throw e;
  }
  return r.data;
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
    if (action === "teamCreateStatus") return json(res, 200, { ok: true, diagnostic: await readTeamCreateStatus(universeId, placeId, apiKey) });
    if (action === "teamCreateToggle") {
      if (typeof body.enabled !== "boolean") return json(res, 400, { ok: false, error: "Informe enabled como true ou false." });
      const result = await setTeamCreateEnabled(universeId, body.enabled, apiKey);
      return json(res, 200, { ok: true, teamCreate: result, message: body.enabled ? "Team Create foi ativado." : "Team Create foi desativado para este Universe." });
    }
    if (action === "diagnostic") return json(res, 200, { ok: true, diagnostic: await runLuauDiagnostic(universeId, placeId, apiKey), message: "Luau Execution está funcionando para esta chave e Place." });
    if (action === "saveDiagnostic") return json(res, 200, { ok: true, diagnostic: await runSavePermissionDiagnostic(universeId, placeId, apiKey), message: "SavePlaceAsync com SaveWithoutPublish está autorizado neste Place." });
    if (action === "publishOnly") {
      const published = await publishPlaceWithLuau(universeId, placeId, apiKey);
      return json(res, 200, { ok: true, published: true, method: "save-place-only", taskPath: published.taskPath });
    }
    if (action === "publishPreflight") {
      return json(res, 200, {
        ok: true,
        diagnostic: await runPublishPreflight(universeId, placeId, apiKey),
        message: "O teste de publicação/salvamento foi concluído sem criar uma nova versão publicada."
      });
    }
    if (action === "load") {
      const tree = await loadTree(universeId, placeId, apiKey);
      if (tree?.pending) return json(res, 200, { ok: true, pending: true, operationPath: tree.operationPath, universeId, placeId, editable: SCRIPT_TYPES, readOnly: true, lazy: true });
      return json(res, 200, { ok: true, universeId, placeId, tree, editable: SCRIPT_TYPES, readOnly: true, lazy: true });
    }
    if (action === "children") {
      const parentId = clean(body.parentId);
      if (!parentId || parentId === "root") return json(res, 400, { ok: false, error: "Parent ID inválido." });
      const children = await loadChildren(universeId, placeId, parentId, apiKey);
      if (children?.pending) return json(res, 200, { ok: true, pending: true, operationPath: children.operationPath, parentId });
      return json(res, 200, { ok: true, parentId, children });
    }
    if (action === "operation") {
      const operationPath = clean(body.operationPath).replace(/^\/+/, "");
      const prefix = "universes/" + universeId + "/places/" + placeId + "/";
      if (!operationPath || !operationPath.startsWith(prefix) || !operationPath.includes("/operations/")) {
        return json(res, 400, { ok: false, code: "INVALID_OPERATION_PATH", error: "Caminho de operação inválido para este Place." });
      }
      const result = await operation(operationPath, apiKey, { maxPolls: 1, delayMs: 500, allowPending: true });
      if (result?.pending) return json(res, 200, { ok: true, done: false, operationPath });
      const raw = result?.response || result?.output || result || {};
      const instances = raw?.instances || raw?.response?.instances || raw?.response?.response?.instances || null;
      return json(res, 200, { ok: true, done: true, operationPath, instances });
    }
    if (action === "source") {
      const instanceId = clean(body.instanceId);
      if (!instanceId) return json(res, 400, { ok: false, error: "Instance ID obrigatório." });
      return json(res, 200, { ok: true, instanceId, ...(await loadScriptSource(universeId, placeId, instanceId, apiKey)) });
    }
    if (action === "update") {
      const instanceId = clean(body.instanceId);
      const task = await updateScriptWithInstance(universeId, placeId, instanceId, clean(body.scriptType), body.source, apiKey);
      await operation(task.path, apiKey);
      return json(res, 200, { ok: true, saved: true, published: true, method: "instance-api" });
    }
    if (action === "updateMany") {
      const changes = Array.isArray(body.changes) ? body.changes : [];
      if (changes.length > 100) return json(res, 400, { ok: false, error: "Limite de 100 arquivos por salvamento." });
      const results = [];
      for (const change of changes) {
        const task = await updateScriptWithInstance(universeId, placeId, clean(change.instanceId), clean(change.scriptType), change.source, apiKey);
        await operation(task.path, apiKey);
        results.push({ instanceId: clean(change.instanceId), ok: true });
      }
      return json(res, 200, { ok: true, saved: results.length, published: true, method: "instance-api" });
    }
    if (action === "publishMany") {
      const changes = Array.isArray(body.changes) ? body.changes : [];
      if (!changes.length) return json(res, 400, { ok: false, error: "Nenhuma alteração foi enviada para publicação." });
      if (changes.length > 100) return json(res, 400, { ok: false, error: "Limite de 100 arquivos por publicação." });

      // Primeiro aplica somente o Source dos scripts pela Engine Instances API,
      // que é o endpoint oficial para editar Script/LocalScript/ModuleScript.
      const saved = [];
      for (const change of changes) {
        const task = await updateScriptWithInstance(
          universeId,
          placeId,
          clean(change.instanceId),
          clean(change.scriptType),
          change.source,
          apiKey
        );
        await operation(task.path, apiKey);
        saved.push({ instanceId: clean(change.instanceId), ok: true });
      }

      // Depois cria uma versão publicada do Place. Assim uma falha no SavePlaceAsync
      // não desfaz as edições já aplicadas e o usuário pode tentar publicar novamente.
      const published = await publishPlaceWithLuau(universeId, placeId, apiKey);
      return json(res, 200, {
        ok: true,
        published: true,
        saved: saved.length,
        method: "instance-api-plus-save-place",
        taskPath: published.taskPath
      });
    }
    if (action === "createScript") {
      const scriptType = clean(body.scriptType);
      const name = clean(body.name).replace(/[<>:"/\\|?*]/g, "").slice(0, 80);
      const parentPath = clean(body.parentPath);
      if (!SCRIPT_TYPES.includes(scriptType)) return json(res, 400, { ok: false, error: "Tipo de script inválido." });
      if (!name) return json(res, 400, { ok: false, error: "Nome do script obrigatório." });
      if (!parentPath || !/^game(?::GetService\(\"[^\"]+\"\)|(?::FindFirstChild\(\"[^\"]+\"\))*)$/.test(parentPath)) return json(res, 400, { ok: false, error: "Local de criação inválido." });
      if (String(body.source ?? "").length > 180000) return json(res, 400, { ok: false, error: "O código é grande demais para esta operação." });
      const task = await createScriptWithLuau(universeId, placeId, scriptType, name, parentPath, String(body.source ?? ""), apiKey);
      return json(res, 200, { ok: true, taskPath: task.path, state: task.state, name, scriptType });
    }
    if (action === "deleteInstance") {
      const segments = Array.isArray(body.segments) ? body.segments : [];
      const task = await deleteInstanceWithLuau(universeId, placeId, segments, apiKey);
      return json(res, 200, { ok: true, taskPath: task.path, state: task.state });
    }
    if (action === "task") {
      const task = await getLuauTask(body.taskPath, apiKey);
      return json(res, 200, {
        ok: true,
        state: task.state || "PROCESSING",
        output: task.output || null,
        error: task.error || null,
        taskPath: clean(body.taskPath)
      });
    }
    return json(res, 400, { ok: false, error: "Ação inválida." });
  } catch (error) {
    console.error("Studio RBXL Open Cloud:", error);
    const status = Number(error?.status) || 500;
    const message = error?.message || String(error);
    const base = {
      ok: false,
      code: status >= 400 && status < 600 ? ("ROBLOX_HTTP_" + status) : "STUDIO_RBXL_ERROR",
      error: message,
      httpStatus: status
    };
    if (status === 429) {
      const reset = Number(error?.headers?.["x-ratelimit-reset"]);
      return json(res, 429, { ...base, code: "ROBLOX_RATE_LIMITED", retryAfter: Number.isFinite(reset) && reset > 0 ? reset : 5, hint: "Aguarde alguns segundos e tente novamente." });
    }
    if (status === 401) return json(res, 401, { ...base, code: "ROBLOX_UNAUTHORIZED", hint: "A chave foi recusada pelo Roblox. Confirme se a chave está ativa, se foi copiada inteira e se ela pertence ao Universe/Place selecionado." });
    const lowerMessage = message.toLowerCase();
    const teamCreateActive = lowerMessage.includes("placeongoingteamcreatesession") || lowerMessage.includes("ongoing team create session") || lowerMessage.includes("team create session");
    if (teamCreateActive) {
      return json(res, 409, {
        ...base,
        code: "ROBLOX_TEAM_CREATE_ACTIVE",
        httpStatus: 409,
        retryable: false,
        hint: "A Roblox bloqueou SavePlaceAsync com PlaceOngoingTeamCreateSession. Repetir a mesma chamada normalmente não resolve. A API oficial alternativa de publicação aceita um arquivo completo .rbxl/.rbxlx, mas este fluxo de editor de scripts não gera esse arquivo completo; não é seguro afirmar que os scripts foram publicados. Não é necessário cadastrar colaboradores no site. Se não houver sessão aberta no Studio, o bloqueio precisa ser corrigido pela Roblox ou contornado publicando um arquivo completo do Place pela Place Publishing API."
      });
    }
    if (status === 403 && clean(body.action) === "teamCreateToggle") return json(res, 403, { ...base, code: "TEAM_CREATE_SCOPE_REQUIRED", hint: "A Roblox recusou a alteração de Team Create porque esta chave não tem autorização para gerenciar colaboração. O endpoint exige o escopo legacy-team-collaboration:manage; isso não é o mesmo que universe.places:write. O site não vai pedir colaboradores nem insistir nesta ação. A publicação ainda pode ser bloqueada pelo próprio serviço do Roblox se ele retornar PlaceOngoingTeamCreateSession." });
    if (status === 403) return json(res, 403, { ...base, code: "ROBLOX_FORBIDDEN", hint: "A chave não tem permissão para esta operação. Confira o escopo específico exigido pela API, além do acesso ao Universe/Place." });
    if (status === 404) return json(res, 404, { ...base, code: "ROBLOX_NOT_FOUND", hint: "Confira se Universe ID e Place ID pertencem ao mesmo jogo e se a chave tem acesso a esse jogo." });
    if (status === 400) return json(res, 400, { ...base, code: "ROBLOX_INVALID_REQUEST", hint: "A requisição chegou ao Roblox, mas foi rejeitada. A mensagem acima é a resposta real da API." });
    if (status === 504) return json(res, 504, { ...base, code: "ROBLOX_OPERATION_PENDING", retryable: true, hint: "O Roblox demorou para concluir a operação." });
    return json(res, status >= 400 && status < 600 ? status : 500, base);
  }
}
