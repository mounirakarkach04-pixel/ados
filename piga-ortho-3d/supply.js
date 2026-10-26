'use strict';
/* Deterministic supplier preparation; local readback, no shop API, no payment, no inventory writes. */
(async()=>{
 const $=id=>document.getElementById(id),KEY='piga-ortho-supply-draft-v1';
 const source=window.PigaDeviceStore;
 let suggestions=[],basket=[],lastRead=null;
 const safe=v=>String(v??'').trim().slice(0,140);
 const num=v=>{const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(1000000,n)):0};
 const round=v=>Math.round(v*1000)/1000;
 const state=message=>{$('supplyStatus').textContent=message};
 const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v?.version===1&&Array.isArray(v.items))return v.items.slice(0,200).filter(x=>x&&typeof x.sku==='string'&&Number.isFinite(Number(x.order))&&Number(x.order)>0).map(x=>({sku:safe(x.sku),label:safe(x.label),unit:safe(x.unit),order:num(x.order),category:safe(x.category)}));}catch{}return []};
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({version:1,at:new Date().toISOString(),items:basket.slice(0,200),gate1:'DELAY',gate2:'BLOCK',externalEffects:0}))}catch{state('Der Browser erlaubt keine dauerhafte lokale Bestellliste. Exportiere den Entwurf.')}}
 const row=(container,label,details)=>{
  const el=document.createElement('div'),b=document.createElement('b'),sm=document.createElement('small');
  el.className='supply-item';b.textContent=label;sm.textContent=details;el.append(b,sm);container.append(el);return el;
 };
 const serial=item=>item.sku+'; '+item.label+'; '+round(item.order)+' '+item.unit;
 const output=()=>({format:'piga-ortho-order-draft-v1',createdAt:new Date().toISOString(),
  vendorUrl:'https://kfoshop24.com/',state:'DRAFT_UNSUBMITTED',items:basket.map(x=>({...x,supplierProductId:null,mappingVerified:false})),
  containsPatientData:false,gate1:'DELAY',gate2:'BLOCK',externalEffects:0});
 function render(){
  $('supplyCount').textContent=String(lastRead?.total??0);
  $('supplyLow').textContent=String(lastRead?.low??0);
  $('supplyProposals').textContent=String(suggestions.length);
  $('supplyBasketCount').textContent=String(basket.length);
  const wants=$('supplyNeeds');wants.replaceChildren();
  if(!suggestions.length)row(wants,'Kein rechnerischer Bedarf','Mindestmengen und Bestände in der Inventur prüfen.');
  for(const x of suggestions.slice(0,150)){
   row(wants,x.label+' · '+x.sku,'Bestand '+x.quantity+' · Minimum '+x.minimum+
    ' · unterwegs '+x.incoming+' · Vorschlag '+round(x.order)+' '+x.unit+
    ' · Hersteller/Variante nicht mit Shop verifiziert');
  }
  const dst=$('supplyBasket');dst.replaceChildren();
  if(!basket.length)row(dst,'Bestellliste leer','PIGA kann aus lokalem Mindestbestand einen Entwurf vorbereiten.');
  for(const item of basket){
   const el=row(dst,item.label+' · '+item.sku,'Noch nicht an Lieferanten übergeben · Shop-ID nicht abgeglichen');
   const line=document.createElement('label'),field=document.createElement('input');
   field.type='number';field.min='0';field.max='1000000';field.step='0.001';field.value=String(item.order);
   field.setAttribute('aria-label','Bestellmenge '+item.sku);line.textContent='Menge ('+item.unit+'): ';
   field.addEventListener('change',()=>{
    const value=num(field.value);
    if(value<=0)basket=basket.filter(x=>x!==item);else item.order=round(value);
    persist();render();
   });
   line.append(field);el.append(line);
   const remove=document.createElement('button');remove.type='button';remove.textContent='Entfernen';
   remove.addEventListener('click',()=>{basket=basket.filter(x=>x!==item);persist();render()});el.append(remove);
  }
 }
 async function refresh(){
  $('supplyRefresh').disabled=true;
  try{
   if(!source)throw Error('Gerätelokaler Store fehlt');
   const [suite,direct]=await Promise.all([source.initialize('suite'),source.initialize('direct')]);
   if(source.status()!=='indexeddb')throw Error('IndexedDB nicht bereit; bitte Geräte-Datenbank prüfen');
   const catalog=[...(Array.isArray(suite?.inventory)?suite.inventory:[]),
     ...(Array.isArray(direct?.inventory)?direct.inventory:[])];
   const seen=new Set(),clean=[];
   for(const item of catalog){
    if(!item||typeof item!=='object')continue;
    const sku=safe(item.sku||item.id);
    if(!sku||seen.has(sku))continue;seen.add(sku);
    clean.push({...item,sku,label:safe(item.label||item.name||sku),unit:safe(item.unit||'Stück')});
   }
   const proposed=[];
   for(const x of clean){
    const minimum=num(x.minimum),quantity=num(x.quantity),incoming=num(x.incoming);
    const shortage=Math.max(0,minimum-quantity-incoming),pack=Math.max(.001,num(x.packSize)||1);
    const order=round(Math.ceil((shortage-1e-10)/pack)*pack);
    if(order>0)proposed.push({sku:x.sku,label:x.label,category:safe(x.category),unit:x.unit,
      quantity,minimum,incoming,order});
   }
   suggestions=proposed.sort((a,b)=>a.sku.localeCompare(b.sku));
   lastRead={total:clean.length,low:clean.filter(x=>num(x.minimum)>0&&num(x.quantity)<num(x.minimum)).length};
   state('Lokale Bestände gelesen. Kein Shopzugriff, keine Bestellung, keine Bestandsänderung.');
  }catch(error){suggestions=[];lastRead=null;state('Bestände nicht verfügbar: '+safe(error.message)+'. Bitte nur synthetische Testdaten nutzen.');}
  finally{$('supplyRefresh').disabled=false;render()}
 }
 $('supplyRefresh').addEventListener('click',refresh);
 $('supplyPrepare').addEventListener('click',()=>{
  const map=new Map(basket.map(x=>[x.sku,x]));
  for(const p of suggestions)if(!map.has(p.sku))map.set(p.sku,{sku:p.sku,label:p.label,category:p.category,unit:p.unit,order:p.order});
  basket=[...map.values()].slice(0,200);persist();render();
  state('Prüfbare lokale Bestellliste aktualisiert. Kein Artikel wurde in den Online-Shop gelegt.');
 });
 $('supplyClear').addEventListener('click',()=>{
  basket=[];persist();render();state('Lokale Bestellliste geleert; Materialbestand unverändert.');
 });
 $('supplyExport').addEventListener('click',()=>{
  const file=new Blob([JSON.stringify(output(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='PIGA-ORTHO-BESTELLENTWURF.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  state('Lokaler Bestellentwurf exportiert. Keine Bestellung im Shop.');
 });
 $('supplyCopy').addEventListener('click',async()=>{
  if(!basket.length){state('Bitte zuerst eine Bestellliste vorbereiten.');return;}
  const str='PIGA ORTHO 3D – Bestellentwurf (ohne Patientenangaben)\n'+basket.map(serial).join('\n')+'\nBitte Produktvariante und SKU im Shop prüfen.';
  try{await navigator.clipboard.writeText(str);state('Bestellliste kopiert – im Shop prüfen und manuell übernehmen.');}
  catch{state('Kopieren vom Browser blockiert. JSON-Export nutzen.');}
 });
 basket=load();await refresh();
})();