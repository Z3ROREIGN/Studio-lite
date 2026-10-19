export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "50mb",
  },
};

const MAX_PLACE_BYTES = 4 * 1024 * 1024;
const RBXL_MAGIC = Buffer.from([0x3c,0x72,0x6f,0x62,0x6c,0x6f,0x78,0x21,0x89,0xff,0x0d,0x0a,0x1a,0x0a]);

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size > MAX_PLACE_BYTES) {
      const error = new Error("O arquivo excede o limite seguro de 4 MiB desta rota da Vercel.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(part);
  }
  return Buffer.concat(chunks, size);
}

function validatePlaceFile(body, fileName) {
  if (/\\.rbxl$/i.test(fileName)) {
    if (body.length < 32 || !body.subarray(0, RBXL_MAGIC.length).equals(RBXL_MAGIC)) {
      return "O arquivo não tem um cabeçalho RBXL binário válido. Nenhuma publicação foi feita.";
    }
    return null;
  }

  const xml = body.toString("utf8").replace(/^\\uFEFF/, "").trimStart();
  if (!xml || !/^<(?:\\?xml\\b[^>]*>\\s*)?<roblox(?:\\s|>)/i.test(xml)) {
    return "O arquivo .rbxlx não parece ser um Place XML Roblox válido. Nenhuma publicação foi feita.";
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      service: "roblox-place-publish-proxy",
      authMode: "per-user-api-key",
      version: "2026-10-04-per-user-key-v3",
      message: "Esta rota não usa nenhuma chave fixa da Vercel. Envie a chave do usuário no header x-roblox-api-key apenas no POST de publicação."
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const universeId = String(req.headers["x-roblox-universe-id"] || "").trim();
    const placeId = String(req.headers["x-roblox-place-id"] || "").trim();
    const fileName = String(req.headers["x-roblox-file-name"] || "place.rbxl").trim();

    // The key belongs to the user making this publication request.
    // It is intentionally NOT stored in Vercel Environment Variables,
    // Supabase, localStorage, cookies, or the repository.
    const apiKey = String(req.headers["x-roblox-api-key"] || "").trim();

    if (!apiKey) {
      res.status(401).json({
        error: "API Key do Roblox não informada.",
        code: "MISSING_ROBLOX_API_KEY",
      });
      return;
    }

    if (!/^\d+$/.test(universeId) || !/^\d+$/.test(placeId)) {
      res.status(400).json({ error: "Universe ID e Place ID inválidos." });
      return;
    }

    if (!/\.(rbxl|rbxlx)$/i.test(fileName)) {
      res.status(400).json({ error: "Somente arquivos .rbxl ou .rbxlx são aceitos." });
      return;
    }

    const contentType = /\.rbxlx$/i.test(fileName)
      ? "application/xml"
      : "application/octet-stream";

    const body = await readBody(req);

    if (!body.length) {
      res.status(400).json({ error: "O arquivo enviado está vazio." });
      return;
    }

    const fileValidationError = validatePlaceFile(body, fileName);
    if (fileValidationError) {
      res.status(400).json({ error: fileValidationError, code: "INVALID_PLACE_FILE" });
      return;
    }

    const upstream = await fetch(
      `https://apis.roblox.com/universes/v1/${universeId}/places/${placeId}/versions?versionType=Published`,
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "content-type": contentType,
          "content-length": String(body.length),
        },
        body,
      }
    );

    const text = await upstream.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { message: text };
    }

    // Never echo the API key back to the browser.
    res.status(upstream.status).json({
      ok: upstream.ok,
      ...payload,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode);
    if (statusCode === 413) {
      res.status(413).json({ error: error.message, code: "PLACE_FILE_TOO_LARGE" });
      return;
    }
    console.error("Roblox publish proxy error:", error);
    res.status(500).json({
      error: "Falha ao comunicar com Roblox Open Cloud.",
      message: error?.message || String(error),
    });
  }
}
