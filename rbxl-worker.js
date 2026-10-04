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
    const result=parse(new Uint8Array(buffer),()=>{});
    const instances=result?.instances||result;
    if(!Array.isArray(instances)||!instances.length)throw Error("O parser não encontrou instâncias.");
    self.postMessage({type:"progress",message:"Reconstruindo hierarquia…"});
    const idOf=new Map(instances.map((x,i)=>[x,String(x?.id??x?.referent??i)]));
    const safeValue=(v,depth=0,seen=new WeakSet())=>{
      if(v==null||typeof v==="string"||typeof v==="number"||typeof v==="boolean")return v;
      if(depth>4)return null;
      if(typeof v==="function"||typeof v==="symbol")return null;
      if(typeof v==="object"){
        if(seen.has(v))return null;
        seen.add(v);
        if(Array.isArray(v))return v.slice(0,5000).map(x=>safeValue(x,depth+1,seen));
        const o={};
        for(const [k,x] of Object.entries(v)){
          if(k==="Parent"||k==="Children")continue;
          o[k]=safeValue(x,depth+1,seen);
        }
        return o;
      }
      return null;
    };
    const safe=instances.map((inst,i)=>{
      const raw=inst?.properties||inst?.Properties||inst?.props||{};
      const parentRaw=raw?.Parent&&typeof raw.Parent==="object"&&"value" in raw.Parent?raw.Parent.value:raw?.Parent;
      let parent=null;
      if(parentRaw&&typeof parentRaw==="object")parent=idOf.get(parentRaw)||String(parentRaw.id??parentRaw.referent??"")||null;
      else if(parentRaw!=null)parent=String(parentRaw);
      const props={};
      for(const [k,v] of Object.entries(raw||{})){
        if(k==="Parent"||k==="Children")continue;
        const value=v&&typeof v==="object"&&"value" in v?v.value:v;
        props[k]=safeValue(value);
      }
      return {id:String(inst?.id??inst?.referent??i),className:String(inst?.className||inst?.ClassName||inst?.class||"Folder"),properties:props,parent};
    });
    self.postMessage({type:"result",instances:safe});
  }catch(error){
    self.postMessage({type:"error",message:error?.message||String(error)});
  }
};