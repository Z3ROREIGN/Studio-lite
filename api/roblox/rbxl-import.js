export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 300,
};

const MAX_BYTES = 80 * 1024 * 1024;
const HEADER = new Uint8Array([
  0x3c,0x72,0x6f,0x62,0x6c,0x6f,0x78,0x21,0x89,0xff,0x0d,0x0a,0x1a,0x0a,0x00,0x00
]);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };
    req.on("data", chunk => {
      try {
        const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += part.byteLength;
        if (total > MAX_BYTES) {
          try { req.destroy(); } catch {}
          return finish(reject, Object.assign(new Error("Arquivo maior que 80 MB."), { statusCode: 413 }));
        }
        chunks.push(part);
      } catch (error) {
        finish(reject, error);
      }
    });
    req.on("end", () => finish(resolve, Buffer.concat(chunks)));
    req.on("error", error => finish(reject, error));
    req.on("aborted", () => finish(reject, new Error("Upload interrompido pelo navegador.")));
  });
}

function json(res, status, payload) {
  res.status(status);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  return res.json(payload);
}

function safe(value, seen = new WeakSet(), depth = 0) {
  if (depth > 8) return null;
  if (value === undefined) return null;
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return String(value);
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Array.from(value);
  if (Array.isArray(value)) return value.map(item => safe(item, seen, depth + 1));
  if (typeof value === "object") {
    if (seen.has(value)) return null;
    seen.add(value);
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === "Parent" || key === "Children" || key === "Properties") continue;
      out[key] = safe(item, seen, depth + 1);
    }
    return out;
  }
  return String(value);
}

function descriptorValue(value) {
  if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value")) {
    return value.value;
  }
  return value;
}

async function getReader() {
  let RBXReaderModule;
  try {
    RBXReaderModule = await import("rbx-reader");
  } catch (error) {
    throw new Error("Não foi possível carregar o rbx-reader no runtime da Function: " + (error?.message || String(error)));
  }

  const candidates = [
    RBXReaderModule,
    RBXReaderModule?.default,
    RBXReaderModule?.default?.default,
  ];
  const reader = candidates.find(item => item && typeof item.parseBuffer === "function");
  if (!reader) {
    const keys = Object.keys(RBXReaderModule || {}).join(", ");
    throw new Error("O rbx-reader foi carregado, mas parseBuffer não está disponível no runtime. Exports: " + (keys || "nenhum"));
  }
  return reader;
}

function isBinaryRoblox(body) {
  if (body.length < HEADER.length) return false;
  for (let i = 0; i < HEADER.length; i++) {
    if (body[i] !== HEADER[i]) return false;
  }
  return true;
}

function normalizeInstanceList(parsed) {
  const list = Array.isArray(parsed?.instances) ? parsed.instances : [];
  if (!list.length) return [];

  const index = new Map(list.map((instance, index) => [instance, index]));
  const refMap = new Map();
  const idMap = new Map();
  list.forEach((instance, index) => {
    for (const key of ["Referent","referent","Reference","reference","id","ID"]) {
      const value = descriptorValue(instance?.[key]);
      if (value != null) refMap.set(String(value), index);
    }
    const props = instance?.Properties || instance?.properties || {};
    for (const key of ["Referent","referent"]) {
      const value = descriptorValue(props?.[key]);
      if (value != null) refMap.set(String(value), index);
    }
    idMap.set(String(index), index);
  });

  return list.map((instance, index) => {
    const properties = instance?.Properties || instance?.properties || {};
    const rawParent = descriptorValue(properties.Parent ?? instance?.Parent);
    let parent = null;

    if (rawParent && typeof rawParent === "object" && index.has(rawParent)) {
      parent = String(index.get(rawParent));
    } else if (typeof rawParent === "number" && rawParent >= 0 && rawParent < list.length) {
      parent = String(rawParent);
    } else if (typeof rawParent === "string") {
      const resolved = refMap.get(rawParent) ?? idMap.get(rawParent);
      if (resolved != null) parent = String(resolved);
    }

    const cleanProperties = {};
    for (const [name, descriptor] of Object.entries(properties)) {
      const value = descriptorValue(descriptor);
      if (name === "Parent") continue;
      cleanProperties[name] = safe(value);
    }

    const className = String(
      instance?.ClassName ||
      properties.ClassName?.value ||
      properties.ClassName ||
      "Folder"
    );

    const nameValue = descriptorValue(properties.Name);
    const name = String(
      nameValue ??
      instance?.Name ??
      className
    );

    return {
      id: String(index),
      className,
      name,
      parent,
      properties: cleanProperties,
      attributes: safe(instance?.Attributes || {}),
    };
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Método não permitido." });

  try {
    const body = await readBody(req);
    if (!body.length) return json(res, 400, { ok: false, error: "Arquivo vazio." });
    if (body.length > MAX_BYTES) return json(res, 413, { ok: false, error: "Arquivo maior que 80 MB." });
    if (!isBinaryRoblox(body)) {
      return json(res, 415, {
        ok: false,
        error: "Formato binário inválido. Use um RBXL/RBXM binário ou importe RBXLX/RBXMX pelo modo XML.",
      });
    }

    const reader = await getReader();

    // rbx-reader 1.5.x recebe ArrayBuffer, não Node Buffer.
    const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    const parsed = await Promise.resolve(reader.parseBuffer(arrayBuffer));
    const instances = normalizeInstanceList(parsed);

    if (!instances.length) {
      return json(res, 422, { ok: false, error: "O parser terminou, mas nenhuma instância foi encontrada." });
    }

    return json(res, 200, {
      ok: true,
      count: instances.length,
      instances,
      parser: "rbx-reader/1.5.x",
    });
  } catch (error) {
    console.error("Studio RBXL importer:", error);
    const status = Number(error?.statusCode) || 422;
    return json(res, status, {
      ok: false,
      error: error?.message || String(error),
      stage: "rbxl-parser",
    });
  }
}
