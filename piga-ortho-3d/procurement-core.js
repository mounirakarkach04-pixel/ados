'use strict';
/* Local purchase-planning only. Never orders, spends, opens an authenticated cart or guesses prices. */
window.PigaProcurement=(()=>{
 const number=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
 const safe=s=>String(s||'').trim().slice(0,100);
 function prepare(suite,direct){
  const raw=[...(Array.isArray(direct?.inventory)?direct.inventory:[]).map(x=>({
   code:safe(x.code),name:safe(x.name),qty:number(x.count),
   min:number(x.minimum??x.min),pack:number(x.packSize,1),source:'direkt'})),
   ...(Array.isArray(suite?.inventory)?suite.inventory:[]).map(x=>({
   code:safe(x.sku),name:safe(x.label),qty:number(x.quantity),
   min:number(x.minimum),pack:number(x.packSize,1),source:'inventur'}))];
  const merged=new Map();
  for(const item of raw)if(item.code){
   const key=item.code.toUpperCase();
   // Prefer dedicated inventory management data to the old direct mirror.
   if(!merged.has(key)||item.source==='inventur')merged.set(key,item);
  }
  const result=[];
  for(const item of merged.values()){
   if(!Number.isFinite(item.qty)||item.qty<0||item.min<=0||item.qty>=item.min)continue;
   const desired=Math.max(0,item.min-item.qty),pack=Math.max(1,Math.floor(item.pack)||1);
   const order=Math.ceil(desired/pack)*pack;
   result.push({code:item.code,name:item.name,available:item.qty,minimum:item.min,
    suggestedQuantity:order,packSize:pack,source:item.source,
    status:'PURCHASE_DRAFT_ONLY',price:'UNVERIFIED',orderSubmitted:false});
  }
  return result.sort((a,b)=>a.name.localeCompare(b.name,'de')).slice(0,300);
 }
 function csv(items){
  const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const fields=['Artikel','SKU','Bestand','Mindestbestand','Vorschlag','Packgroesse','Quelle','Status'];
  return '\uFEFF'+[fields,...items.map(x=>[x.name,x.code,x.available,x.minimum,x.suggestedQuantity,x.packSize,x.source,'NUR ENTWURF'])].map(r=>r.map(quote).join(';')).join('\r\n');
 }
 return {prepare,csv};
})();
