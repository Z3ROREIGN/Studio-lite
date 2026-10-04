export const config = {
  runtime: "nodejs",
};

const UPSTREAM =
  "https://raw.githubusercontent.com/MrSprinkleToes/rbxBinaryParser/master/dist/client/rbxBinaryParser.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { accept: "text/javascript, application/javascript, */*" },
    });

    if (!upstream.ok) {
      throw new Error(`Upstream parser returned ${upstream.status}`);
    }

    const source = await upstream.text();

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).send(source);
  } catch (error) {
    console.error("RBXL parser proxy error:", error);
    res.status(502).json({
      error: "Não foi possível carregar o parser RBXL.",
      message: error?.message || String(error),
    });
  }
}
