'use strict';
/* Local bounded analytics worker; only IndexedDB and CPU. No fetch, medical decisions,
   printer commands, network transport or long-running polling. */
const DB='PIGA_ORTHO_DEVICE_V1',MAX=5;
const open=()=>new Promise((ok,fail)=>{
 const r=indexedDB.open(DB,1);
 r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error||Error('IndexedDB'));
 r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('snapshots'))d.createObjectStore('snapshots',{keyPath:'name'});
 if(!d.objectStoreNames.contains('jobs')){const s=d.createObjectStore('jobs',{keyPath:'id'});s.createIndex('state','state',{unique:false})}
 if(!d.objectStoreNames.contains('events'))d.createObjectStore('events',{keyPath:'id'})};
});
const transact=(store,mode,fn)=>open().then(db=>new Promise((ok,fail)=>{
 const t=db.transaction(store,mode);let out;const s=t.objectStore(store);
 t.oncomplete=()=>{db.close();ok(out)};t.onerror=()=>{db.close();fail(t.error||Error('Transaction'))};
 t.onabort=()=>{db.close();fail(t.error||Error('Aborted'))};
 try{const request=fn(s);if(request&&typeof request==='object'&&'onsuccess' in request)request.onsuccess=()=>out=request.result;else out=request;}catch(err){t.abort();fail(err)}
}));
const now=()=>new Date().toISOString();
const load=async name=>(await transact('snapshots','readonly',s=>s.get(name)))?.data||{};
const hash=async o=>{
 const bytes=new TextEncoder().encode(JSON.stringify(o)),digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
};
async function recover(){
 await transact('jobs','readwrite',store=>{
  const request=store.getAll();
  request.onsuccess=()=>{for(const job of request.result){
   if(job.state==='RUNNING'&&(!Number.isFinite(Date.parse(job.startedAt||job.createdAt))||Date.now()-Date.parse(job.startedAt||job.createdAt)>60000)){
    job.state=job.attempts<3?'QUEUED':'FAILED';job.error='Unvollständige frühere Worker-Sitzung';store.put(job);
   }
  }};
 });
}
const claim=()=>new Promise(async(ok,fail)=>{
 let db;try{db=await open();const t=db.transaction('jobs','readwrite'),store=t.objectStore('jobs');
 const r=store.index('state').getAll('QUEUED');let selected=null;
 r.onsuccess=()=>{
  const arr=r.result.sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  if(!arr.length)return;
  selected=arr[0];selected.state='RUNNING';selected.startedAt=now();selected.attempts=Number(selected.attempts||0)+1;store.put(selected);
 };
 t.oncomplete=()=>{db.close();ok(selected)};
 t.onerror=()=>{db.close();fail(t.error||Error('Claim failed'))};
 t.onabort=()=>{db.close();fail(t.error||Error('Claim aborted'))};
 }catch(e){db?.close();fail(e)}
});
async function compute(kind){
 const suite=await load('suite'),direct=await load('direct');
 if(kind==='HEALTH_CHECK')return {engine:'PIGA ORTHO DEVICE',mode:'LOCAL',hasSuite:!!suite.version,hasDirect:!!direct.version,
 suiteRecords:Object.entries(suite).filter(([,v])=>Array.isArray(v)).reduce((o,[k,v])=>(o[k]=v.length,o),{}),
 directRecords:Object.entries(direct).filter(([,v])=>Array.isArray(v)).reduce((o,[k,v])=>(o[k]=v.length,o),{}),
 networkEffects:0,deviceActions:0};
 if(kind==='WORKFLOW_SUMMARY'){
  const items=Array.isArray(direct.tasks)?direct.tasks:[],calendar=Array.isArray(direct.calendar)?direct.calendar:[];
  return {cases:(direct.cases||[]).length,tasks:items.length,openTasks:items.filter(x=>x.status==='open'||x.status==='not_done').length,
 appointments:calendar.length,shifts:(suite.shifts||[]).length,networkEffects:0,deviceActions:0};
 }
 if(kind==='INVENTORY_FORECAST'){
  const items=(suite.inventory||[]).slice(0,3000);
  const low=items.filter(i=>Number(i.minimum)>0&&Number(i.quantity||0)<Number(i.minimum));
  return {articles:items.length,lowStock:low.length,criticalSkus:low.slice(0,50).map(i=>String(i.sku||'').slice(0,32)),
 note:'Hinweis zur manuellen Bestandsprüfung, kein Bestellauftrag.',networkEffects:0,deviceActions:0};
 }
 if(kind==='DATA_INTEGRITY_AUDIT'){
  const cases=Array.isArray(direct.cases)?direct.cases:[],tasks=Array.isArray(direct.tasks)?direct.tasks:[],
   stock=Array.isArray(suite.inventory)?suite.inventory:[];
  const ids=new Set(),duplicates=[];
  for(const c of cases.slice(0,5000)){const id=String(c.id||'');if(id&&ids.has(id))duplicates.push('DUPLICATE_CASE_ID');
   if(id)ids.add(id);}
  const orphanTasks=tasks.filter(t=>t.caseId&&!ids.has(String(t.caseId))).length;
  const badStock=stock.filter(x=>!Number.isFinite(Number(x.quantity))||Number(x.quantity)<0).length;
  return {checkedAt:now(),caseCount:cases.length,duplicateCaseIds:duplicates.length,
   orphanTasks,badStockQuantities:badStock,recommendation:duplicates.length||orphanTasks||badStock?
   'Manuelle Bestands- und Datenintegritätsprüfung einplanen':'Keine strukturellen Warnungen in geprüften lokalen Datensätzen.',
   actionsPerformed:0,clinicalAuthority:false,networkEffects:0,deviceActions:0};
 }
 if(kind==='IMPROVEMENT_BACKLOG'){
  const inventory=Array.isArray(suite.inventory)?suite.inventory:[],tasks=Array.isArray(direct.tasks)?direct.tasks:[],
   cases=Array.isArray(direct.cases)?direct.cases:[];
  const suggestions=[];
  if(inventory.some(x=>x.minimum==null||Number(x.minimum)<0))suggestions.push('Mindestbestände für Materialpositionen prüfen');
  if(tasks.filter(t=>t.status!=='done'&&t.status!=='closed').length>0)suggestions.push('Offene lokale Aufgaben nach Fälligkeit überprüfen');
  if(!cases.length)suggestions.push('Erste synthetische Testfälle für den End-to-End-Prozess anlegen');
  if(!inventory.length)suggestions.push('Synthetisches Inventar und Lieferzeiten konfigurieren');
  if(!suggestions.length)suggestions.push('Regulären Qualitäts- und Sicherungscheck fortsetzen');
  return {checkedAt:now(),suggestions:suggestions.slice(0,6),status:'PROPOSAL_ONLY',
   nextAdmission:'OWNER_REVIEW_REQUIRED_FOR_MUTATIONS',gate2:'BLOCK',
   actionsPerformed:0,clinicalAuthority:false,networkEffects:0,deviceActions:0};
 }
 throw Error('Nicht zugelassene Worker-Aufgabe');
}
async function finish(job,result,error){
 const at=now(),checksum=result?await hash(result):null;
 const state=error?'FAILED':'DONE',eventId=crypto.randomUUID();
 const db=await open();
 await new Promise((resolve,reject)=>{
  // Job completion, evidence receipt and history compaction are a single
  // IndexedDB transaction: no DONE job without its corresponding event.
  const tr=db.transaction(['jobs','events'],'readwrite');
  const jobs=tr.objectStore('jobs'),events=tr.objectStore('events');
  jobs.put({...job,state,endedAt:at,result:result||null,resultSha256:checksum,error:error||null});
  events.put({id:eventId,jobId:job.id,kind:job.kind,state,at,sha256:checksum});
  const jobRead=jobs.getAll(),eventRead=events.getAll();
  jobRead.onsuccess=()=>{
   const old=jobRead.result.filter(row=>['DONE','FAILED'].includes(row.state))
    .sort((a,b)=>String(b.endedAt||'').localeCompare(String(a.endedAt||''))).slice(250);
   old.forEach(row=>jobs.delete(row.id));
  };
  eventRead.onsuccess=()=>{
   const old=eventRead.result.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(350);
   old.forEach(row=>events.delete(row.id));
  };
  tr.oncomplete=()=>{db.close();resolve()};
  tr.onerror=()=>{db.close();reject(tr.error||Error('Atomic receipt failed'))};
  tr.onabort=()=>{db.close();reject(tr.error||Error('Receipt was rolled back'))};
 });
 return {id:job.id,kind:job.kind,state,sha256:checksum};
}
let busy=false;
self.onmessage=async event=>{
 if(event.data?.type!=='RUN'||busy)return;
 busy=true;const summary=[];
 try{await recover();const limit=Math.min(MAX,Math.max(1,Number(event.data.limit)||3));
  for(let i=0;i<limit;i++){
   const job=await claim();if(!job)break;
   try{summary.push(await finish(job,await compute(job.kind),null))}
   catch(err){summary.push(await finish(job,null,String(err.message||err).slice(0,250)))}
  }
  self.postMessage({type:'RESULT',processed:summary});
 }catch(error){self.postMessage({type:'ERROR',message:String(error.message||error)})}
 finally{busy=false}
};
