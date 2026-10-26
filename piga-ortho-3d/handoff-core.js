'use strict';
/* PIGA ORTHO 3D — integrated local technical handoff. NO medical or device authorisation.
   This is deliberately pure: code is reusable in the browser and easy to test offline. */
window.OrthoHandoffCore=(()=>{
 const STEPS=[
  {key:'intake',label:'Auftragseingang und Referenz prüfen',domain:'TEAM',description:'Pseudonyme Auftragskennung, keine Patientendaten'},
  {key:'geometry',label:'STL-Datei technisch prüfen',domain:'TECHNIK',description:'Format, Größenbegrenzung, Koordinaten, Hash'},
  {key:'material',label:'Materialbestand für Testauftrag prüfen',domain:'LABOR',description:'Sollmenge und aktuell lokal erfassten Bestand vergleichen'},
  {key:'clinical',label:'Fachliche Freigabe extern einholen',domain:'ARZT',description:'Hier keine klinische Entscheidung oder Freigabe möglich'},
  {key:'gate2',label:'Geräteausführung separat autorisieren',domain:'PIGA GATE 2',description:'Keine Druckerbefehle oder automatische Gate-2-Freigabe'},
  {key:'evidence',label:'Technische Übergabe dokumentieren',domain:'NACHWEIS',description:'Bericht, Hash und offene Freigaben getrennt ausweisen'}
 ];
 const allowedRef=s=>/^[A-Z0-9_-]{3,32}$/.test(String(s||'').trim().toUpperCase());
 const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
 const iso=()=>new Date().toISOString();
 const clipped=(s,n=150)=>String(s||'').trim().slice(0,n);
 function addCase(db,ref,label){
  ref=clipped(ref,32).toUpperCase();
  if(!allowedRef(ref))throw Error('Auftragskürzel: 3–32 Zeichen (A–Z, 0–9, _ oder -) erforderlich.');
  if(db.cases.some(x=>x.ref===ref))throw Error('Diese Auftragskennung existiert bereits.');
  if(db.cases.length>=1000)throw Error('Maximale Anzahl lokaler Testaufträge erreicht.');
  const value={id:uid(),ref,label:clipped(label||'Technische Modellbearbeitung'),state:'open',created:iso()};
  db.cases.push(value);return value;
 }
 function tasksFor(db,id){return db.tasks.filter(t=>t.caseId===id)}
 function seed(db,id){
  const c=db.cases.find(x=>x.id===id&&x.state==='open');
  if(!c)throw Error('Bitte einen offenen lokalen Testauftrag auswählen.');
  if(db.switches?.tasks===false)throw Error('Aufgabenmodul wurde in der Inhabersteuerung pausiert.');
  const existing=tasksFor(db,id);let added=0;
  if(db.tasks.length>2990)throw Error('Das lokale Aufgabenlimit ist erreicht.');
  for(const step of STEPS){
   if(existing.some(t=>t.handoffKey===step.key))continue;
   db.tasks.push({id:uid(),caseId:id,handoffKey:step.key,title:step.label,staffId:'',status:'open',created:iso(),note:''});added++;
  }return added;
 }
 function materialOptions(direct,suite){
  const suiteItems=(Array.isArray(suite?.inventory)?suite.inventory:[]).map(x=>({
   code:clipped(x.sku,32).toUpperCase(),label:clipped(x.label,120),qty:Number(x.quantity)||0,unit:clipped(x.unit||'Stück',24),source:'suite'}));
  const directItems=(Array.isArray(direct.inventory)?direct.inventory:[]).map(x=>({
   code:clipped(x.code,32).toUpperCase(),label:clipped(x.name,120),
   qty:Number(x.count)||0,unit:'Stück',source:'direct'}));
  const merged=new Map();
  for(const item of [...directItems,...suiteItems])if(item.code&&Number.isFinite(item.qty))merged.set(item.code,item);
  return [...merged.values()].sort((a,b)=>a.label.localeCompare(b.label,'de'));
 }
 function assess(direct,suite,id){
  const c=direct.cases.find(x=>x.id===id);
  if(!c)return {kind:'MISSING',message:'Auftrag nicht gefunden'};
  const entry=c.handoff||{},materials=materialOptions(direct,suite);
  const material=materials.find(x=>x.code===entry.material?.code);
  const requested=Number(entry.material?.quantity)||0;
  const stocked=!!material&&requested>0&&material.qty>=requested;
  const selected=!!material&&requested>0;
  const stl=entry.stl;
  const validSTL=!!stl&&/^[0-9a-f]{64}$/.test(stl.sha256||'')&&stl.triangles>0;
  const tasks=tasksFor(direct,id);
  const checklist=STEPS.map(step=>({
   ...step,
   task:tasks.find(t=>t.handoffKey===step.key)||null,
   isHumanApproval:step.key==='clinical'||step.key==='gate2',
   complete:step.key==='geometry'?validSTL:step.key==='material'?stocked:
    !!tasks.find(t=>t.handoffKey===step.key&&t.status==='done')
  }));
  const missing=[];
  if(!validSTL)missing.push('STL-Grundprüfung fehlt');
  if(!selected)missing.push('Material / Menge nicht festgelegt');
  else if(!stocked)missing.push('Materialbestand ist geringer als Sollmenge');
  if(tasks.filter(t=>['intake','geometry','material'].includes(t.handoffKey)).length<3)missing.push('Arbeitsplan noch nicht vollständig erstellt');
  // Clinical and device gates are never inferred from local checklists or an employee's clicks.
  const technicalReady=validSTL&&stocked&&tasks.some(t=>t.handoffKey==='intake'&&t.status==='done');
  return {kind:technicalReady?'TECHNICAL_REVIEW_READY':'TECHNICAL_PENDING',case:c,
   tasks:checklist,stl,material,requested,materialSelected:selected,materialAvailable:stocked,
   technicalReady,missing,gate1:'DELAY',gate2:'BLOCK',clinicalAuthority:'NOT_ASSIGNED',deviceActions:0,
   note:technicalReady?'Technische Unterlagen vorbereitet. Fachliche Prüfung und Gate 2 weiterhin erforderlich.':
   'Technische Vorbereitung offen – keine klinische Freigabe.'};
 }
 function log(direct,type,detail){
  direct.audit.unshift({id:uid(),type:clipped(type,72),detail:clipped(detail,160),at:iso()});
  direct.audit=direct.audit.slice(0,1200);
 }
 function markTask(direct,caseId,key,done,note){
  if(!['intake','geometry','material','evidence'].includes(key))throw Error('Dieser Schritt benötigt eine unabhängige fachliche oder Gerätefreigabe.');
  const t=direct.tasks.find(x=>x.caseId===caseId&&x.handoffKey===key);
  if(!t)throw Error('Arbeitsplan wurde noch nicht angelegt.');
  if(done&&key==='geometry'&&!direct.cases.find(c=>c.id===caseId)?.handoff?.stl?.sha256)
   throw Error('Vor dem Abschluss muss eine STL-Datei technisch geprüft werden.');
  if(done&&key==='material'){
   // Presence of material review does not assert there is enough material.
   if(!direct.cases.find(c=>c.id===caseId)?.handoff?.material?.code)throw Error('Zuerst Material wählen.');
  }
  t.status=done?'done':'open';t.note=clipped(note,280);t.respondedAt=iso();
  log(direct,'handoff_task_'+(done?'done':'reopen'),key+' · '+caseId);
  return t;
 }
 function assignMaterial(direct,caseId,code,quantity){
  const c=direct.cases.find(x=>x.id===caseId&&x.state==='open');if(!c)throw Error('Auftrag nicht offen.');
  const n=Number(quantity);if(!Number.isInteger(n)||n<1||n>10000)throw Error('Materialmenge muss zwischen 1 und 10.000 liegen.');
  if(!/^[A-Z0-9_-]{3,32}$/.test(code))throw Error('Bitte einen gültigen Materialartikel auswählen.');
  c.handoff??={};c.handoff.material={code,quantity:n,updatedAt:iso()};
  log(direct,'handoff_material_selected',c.ref+' · '+code+' x '+n);
  return c.handoff.material;
 }
 function stlFormat(buffer){
  const n=buffer.byteLength;
  if(n<30||n>25*1024*1024)throw Error('STL-Datei muss zwischen 30 Byte und 25 MiB groß sein.');
  const v=new DataView(buffer);
  let triangles=0,form='binary';
  if(n>=84){
   const count=v.getUint32(80,true);
   if(count>0&&84+count*50===n){
    triangles=count;
    // Coordinate/normal validity: inspect all vectors to prevent obvious corrupt geometry.
    for(let i=0;i<count;i++){
     const pos=84+i*50;
     for(let j=0;j<12;j++)if(!Number.isFinite(v.getFloat32(pos+j*4,true)))
      throw Error('STL enthält nicht-endliche Koordinaten.');
    }
   }
  }
  if(!triangles){
   form='ascii';
   const txt=new TextDecoder('utf-8').decode(buffer);
   if(!/^\s*solid\b/i.test(txt)||!/endsolid\s*$/i.test(txt))throw Error('Kein erkennbares STL-Format.');
   const facets=(txt.match(/\bfacet\s+normal\b/gi)||[]).length;
   const vertices=(txt.match(/\bvertex\b/gi)||[]).length;
   const close=(txt.match(/\bendfacet\b/gi)||[]).length;
   if(!facets||facets!==close||vertices!==facets*3)throw Error('Unvollständige ASCII-STL-Dreiecke.');
   const points=txt.matchAll(/\bvertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/g);
   let checked=0;
   for(const m of points){if(!m.slice(1).every(x=>Number.isFinite(Number(x))))throw Error('Ungültige ASCII-Koordinaten.');checked++}
   if(checked!==vertices)throw Error('STL-Koordinaten nicht vollständig lesbar.');
   triangles=facets;
  }
  return {format:form,triangles,size:n};
 }
 async function analyzeFile(file){
  if(!file||!/\.stl$/i.test(file.name))throw Error('Bitte eine .stl-Datei auswählen.');
  if(file.size>25*1024*1024)throw Error('Die STL-Datei überschreitet 25 MiB.');
  const buffer=await file.arrayBuffer(),meta=stlFormat(buffer);
  const digest=await crypto.subtle.digest('SHA-256',buffer);
  return {...meta,name:clipped(file.name,100),sha256:[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join(''),
   checkedAt:iso(),clinicalApproved:false,printerAuthorized:false};
 }
 return {STEPS,allowedRef,addCase,seed,tasksFor,materialOptions,assess,log,markTask,assignMaterial,stlFormat,analyzeFile};
})();
