/* Studio RBXL — Web Worker parser
 * Keeps heavy RBXL/RBXM parsing off the main UI thread.
 */
self.onmessage=async(e)=>{
  const {buffer}=e.data||{};
  try{
    if(!(buffer instanceof ArrayBuffer))throw Error("Buffer do RBXL inválido.");
    self.postMessage({type:"progress",message:"Carregando parser…"});
    const mod=await import("https://cdn.jsdelivr.net/npm/rbx-reader-rts@1.0.8/+esm");
    const parse=mod.parseRBX||mod.default?.parseRBX;
    if(typeof parse!=="function")throw Error("Parser RBXL do navegador indisponível.");
    self.postMessage({type:"progress",message:"Lendo instâncias…"});
    const result=parse(new Uint8Array(buffer));
    const instances=result?.instances||result;
    if(!Array.isArray(instances)||!instances.length)throw Error("O parser não encontrou instâncias.");
    self.postMessage({type:"progress",message:"Reconstruindo hierarquia…"});
    self.postMessage({type:"result",instances});
  }catch(error){
    self.postMessage({type:"error",message:error?.message||String(error)});
  }
};