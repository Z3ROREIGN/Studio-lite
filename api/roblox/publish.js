export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "50mb",
  },
};

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
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
      version: "2026-10-03-per-user-key-v2",
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
    console.error("Roblox publish proxy error:", error);
    res.status(500).json({
      error: "Falha ao comunicar com Roblox Open Cloud.",
      message: error?.message || String(error),
    });
  }
}
