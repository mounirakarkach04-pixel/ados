'use strict';
/* Device-first Ortho storage. IndexedDB is durable source; old localStorage keys remain
   compatibility mirrors for existing modules. Zero network calls or backend credentials. */
window.PigaDeviceStore=(()=>{
 const NAME='PIGA_ORTHO_DEVICE_V1',SCHEMA=1;
 const KEYS={suite:'piga-ortho-v12-local',direct:'piga-ortho-direct-v1'};
 const META='piga-ortho-transfer-metadata-v1';
 const allowed=new Set(['HEALTH_CHECK','INVENTORY_FORECAST','WORKFLOW_SUMMARY','DATA_INTEGRITY_AUDIT','IMPROVEMENT_BACKLOG']);
 const open=()=>new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(Error('IndexedDB nicht verfügbar'));return;}
  const req=indexedDB.open(NAME,SCHEMA);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains('snapshots'))db.createObjectStore('snapshots',{keyPath:'name'});
   if(!db.objectStoreNames.contains('jobs')){const s=db.createObjectStore('jobs',{keyPath:'id'});s.createIndex('state','state',{unique:false});}
   if(!db.objectStoreNames.contains('events'))db.createObjectStore('events',{keyPath:'id'});
  };
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db)};
  req.onerror=()=>reject(req.error||Error('Lokale Datenbank konnte nicht geöffnet werden'));
  req.onblocked=()=>reject(Error('Anderer Tab blockiert die Datenbankaktualisierung'));
 });
 const tx=(store,mode,action)=>open().then(db=>new Promise((resolve,reject)=>{
  const t=db.transaction(store,mode),s=t.objectStore(store);let result;
  t.oncomplete=()=>{db.close();resolve(result)};
  t.onerror=()=>{db.close();reject(t.error||Error('Datenbankfehler'))};
  t.onabort=()=>{db.close();reject(t.error||Error('Datenbanktransaktion abgebrochen'))};
  try{const r=action(s);if(r&&'onsuccess' in r)r.onsuccess=()=>{result=r.result};else result=r;}
  catch(e){try{t.abort()}catch{}reject(e)}
 }));
 const get=(name)=>tx('snapshots','readonly',s=>s.get(name));
 const snapshots=()=>tx('snapshots','readonly',s=>s.getAll());
 const put=(name,data)=>tx('snapshots','readwrite',s=>s.put({name,data,updatedAt:new Date().toISOString()}));
 const memory=(name)=>{try{return JSON.parse(localStorage.getItem(KEYS[name])||'null')}catch{return null}};
 const valid=(name,data)=>!!data&&typeof data==='object'&&!Array.isArray(data)&&data.version===1&&
 (name==='suite'?Array.isArray(data.staff)&&Array.isArray(data.inventory)&&Array.isArray(data.shifts):
 ['cases','tasks','calendar','inventory','team','audit'].every(key=>Array.isArray(data[key])));
 const tell=(name,data)=>{try{localStorage.setItem(KEYS[name],JSON.stringify(data));return true}catch{return false}};
 let availability='initializing';
 let chain=Promise.resolve();
 const broadcast=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('piga-ortho-device-updates'):null;
 const status=()=>availability;
 const meta=()=>{try{return JSON.parse(localStorage.getItem(META)||'{}')}catch{return {}}};
 const stamp=(field)=>{try{const m=meta();m[field]=new Date().toISOString();localStorage.setItem(META,JSON.stringify(m));window.dispatchEvent(new CustomEvent('piga-ortho-transfer-metadata',{detail:m}));}catch{}};
 const markBackup=()=>stamp('lastExport');
 const markImport=()=>stamp('lastImport');
 const flush=()=>chain;
 async function initialize(name){
  if(!(name in KEYS))throw Error('Ungültiger lokaler Bereich');
  try{
   const record=await get(name);
   if(record&&valid(name,record.data)){tell(name,record.data);availability='indexeddb';return record.data;}
   const legacy=memory(name);
   if(legacy&&valid(name,legacy))await put(name,legacy);
   availability='indexeddb';return legacy;
  }catch(error){
   availability='browser-fallback';
   document.dispatchEvent(new CustomEvent('piga-device-storage-warning',{detail:String(error.message)}));
   return memory(name);
  }
 }
 const enqueueWrite=(name,data)=>{
  if(!(name in KEYS)||!valid(name,data))return Promise.reject(Error('Ungültige Speicherstruktur'));
  // Snapshot is detached from the live mutable object before the queued transaction.
  const snapshot=structuredClone(data);
  chain=chain.catch(()=>{}).then(()=>put(name,snapshot)).then(()=>{
   availability='indexeddb';stamp('lastChange');try{broadcast?.postMessage({name})}catch{}
  },error=>{
   availability='browser-fallback';
   document.dispatchEvent(new CustomEvent('piga-device-storage-warning',{detail:String(error.message)}));
   throw error;
  });
  return chain;
 };
 const replace=async(name,data)=>{
  if(!valid(name,data))throw Error('Sicherungsformat ungültig: '+name);
  await put(name,structuredClone(data));tell(name,data);
  try{broadcast?.postMessage({name})}catch{}
 };
 const enqueueJob=async kind=>{
  if(!allowed.has(kind))throw Error('Nicht zugelassener lokaler Worker-Auftrag');
  const id=crypto.randomUUID(),job={id,kind,state:'QUEUED',createdAt:new Date().toISOString(),attempts:0};
  await tx('jobs','readwrite',s=>s.add(job));return job;
 };
 const listJobs=async()=>{const jobs=await tx('jobs','readonly',s=>s.getAll());return jobs.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,60)};
 const listEvents=async()=>{const events=await tx('events','readonly',s=>s.getAll());return events.sort((a,b)=>b.at.localeCompare(a.at)).slice(0,60)};
 const storageInfo=async()=>{
  let estimate=null,persistent=null;try{estimate=await navigator.storage?.estimate()}catch{}
  try{persistent=await navigator.storage?.persisted()}catch{}
  return {status:availability,usage:estimate?.usage??null,quota:estimate?.quota??null,persistent};
 };
 const persist=async()=>!!(await navigator.storage?.persist?.());
 const saveImagingReview=async record=>{
  if(!record||record.version!==1||!Array.isArray(record.steps)||!Array.isArray(record.history)||
   record.steps.length>8||record.history.length>30||!['IDLE','PAUSED','REJECTED','TECHNICAL_READY','RUNNING','AWAITING_APPROVAL','BLOCK'].includes(record.status))
   throw Error('Invalid bounded review record');
  const data={version:1,status:record.status==='RUNNING'||record.status==='AWAITING_APPROVAL'?'PAUSED':record.status,
   steps:record.steps.slice(0,8).map(x=>String(x).slice(0,90)),
   index:Math.max(0,Math.min(Number(record.index)||0,8)),
   history:record.history.slice(-30).map(x=>({at:String(x.at||'').slice(0,35),event:String(x.event||'').slice(0,170)})),
   session:String(record.session||'').slice(0,80)};
  if(JSON.stringify(data).length>14000)throw Error('Review metadata too large');
  return put('imaging-review',data);
 };
 const loadImagingReview=async()=>{const row=await get('imaging-review');return row?.data||null};
 const savePigaControl=async data=>{
  if(!data||data.schema!==1||!Array.isArray(data.messages)||!Array.isArray(data.requests)||!Array.isArray(data.teamMessages))
   throw Error('Invalid PIGA control state');
  const clean=m=>({id:String(m.id||'').slice(0,75),from:String(m.from||'').slice(0,35),
   content:String(m.content||'').slice(0,850),at:String(m.at||'').slice(0,35)});
  const request=r=>({id:String(r.id||'').slice(0,75),kind:String(r.kind||'').slice(0,40),
   description:String(r.description||'').slice(0,250),requestedBy:String(r.requestedBy||'').slice(0,40),
   requestedAt:String(r.requestedAt||'').slice(0,35),status:String(r.status||'').slice(0,35),
   decision:r.decision?String(r.decision).slice(0,25):null,
   decisionAt:r.decisionAt?String(r.decisionAt).slice(0,35):null,
   expiresAt:String(r.expiresAt||'').slice(0,35),ttlHours:24,
   clinicalAuthority:'NOT_ASSIGNED',gate1:'DELAY',gate2:'BLOCK',effects:0});
  const safe={schema:1,messages:data.messages.slice(-100).map(clean),
   teamMessages:data.teamMessages.slice(-100).map(clean),
   requests:data.requests.slice(-100).map(request)};
  if(JSON.stringify(safe).length>150000)throw Error('PIGA control state too large');
  await put('piga-control',safe);
  try{broadcast?.postMessage({name:'piga-control'})}catch{}
  return safe;
 };
 const loadPigaControl=async()=>{const row=await get('piga-control');return row?.data||null};
  return {initialize,save:enqueueWrite,get,snapshots,replace,status,enqueueJob,listJobs,listEvents,storageInfo,persist,keys:KEYS,meta,markBackup,markImport,flush,saveImagingReview,loadImagingReview,savePigaControl,loadPigaControl};
})();
