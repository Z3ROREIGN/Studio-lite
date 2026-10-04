/* Studio RBXL — parser worker
 * Mantém o upload fora da thread principal e sempre envia ArrayBuffer transferido.
 */
self.onmessage = async event => {
  const { buffer, filename } = event.data || {};
  try {
    if (!(buffer instanceof ArrayBuffer)) throw new Error("Buffer do RBXL inválido.");
    if (!buffer.byteLength) throw new Error("O arquivo está vazio.");
    if (buffer.byteLength > 80 * 1024 * 1024) throw new Error("Este arquivo excede o limite de 80 MB.");

    self.postMessage({ type: "progress", message: "Enviando arquivo para o importador Roblox…" });

    const response = await fetch("/api/roblox/rbxl-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-RBXL-Filename": String(filename || "place.rbxl"),
      },
      body: buffer,
      cache: "no-store",
    });

    let data = null;
    try { data = await response.json(); } catch {}

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || ("Importador respondeu HTTP " + response.status));
    }

    if (!Array.isArray(data.instances) || !data.instances.length) {
      throw new Error("O importador não encontrou instâncias.");
    }

    self.postMessage({
      type: "progress",
      message: "Instâncias recebidas. Reconstruindo Explorer e Properties…",
    });
    self.postMessage({ type: "result", instances: data.instances });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error?.message || String(error),
    });
  }
};