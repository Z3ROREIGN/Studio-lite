export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "50mb",
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
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
    const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY;

    if (!apiKey) {
      res.status(500).json({
        error: "ROBLOX_OPEN_CLOUD_API_KEY is not configured in Vercel.",
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

    const upstream = await fetch(
      `https://apis.roblox.com/universes/v1/${universeId}/places/${placeId}/versions?versionType=Published`,
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "content-type": contentType,
        },
        body: req,
      }
    );

    const text = await upstream.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { message: text };
    }

    res.status(upstream.status).json({
      ok: upstream.ok,
      ...payload,
    });
  } catch (error) {
    res.status(500).json({
      error: "Falha ao comunicar com Roblox Open Cloud.",
      message: error?.message || String(error),
    });
  }
}
