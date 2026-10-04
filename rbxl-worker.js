/* Studio RBXL — Worker de importação binária
 * O parsing binário é feito pelo endpoint robusto do servidor.
 * O Worker mantém o upload/processamento fora da UI principal.
 */
self.onmessage=async(e)=>{
  const {buffer,filename}=e.data||{};
  try{
    if(!(buffer instanceof ArrayBuffer))throw Error("Buffer do RBXL inválido.");
    if(buffer.byteLength>80*1024*1024)throw Error("Este arquivo binário excede o limite atual de 80 MB.");
    self.postMessage({type:"progress",message:"Enviando arquivo para o importador Roblox…"});
    const response=await fetch("/api/roblox/rbxl-import",{
      method:"POST",
      headers:{
        "Content-Type":"application/octet-stream",
        "X-RBXL-Filename":String(filename||"place.rbxl")
      },
      body:buffer
    });
    let data=null;
    try{data=await response.json()}catch{}
    if(!response.ok||!data?.ok)throw Error(data?.error||("Importador respondeu HTTP "+response.status));
    if(!Array.isArray(data.instances)||!data.instances.length)throw Error("O importador não encontrou instâncias.");
    self.postMessage({type:"progress",message:"Instâncias recebidas. Reconstruindo Explorer…"});
    self.postMessage({type:"result",instances:data.instances});
  }catch(error){
    self.postMessage({type:"error",message:error?.message||String(error)});
  }
};