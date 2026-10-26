'use strict';
/* PIGA ORTHO 3D · cross-module local operations cockpit.
   Read-only, deterministic recommendations from real IndexedDB test records.
   No external calls, clinical claims, printer actions or new authorization. */
(async()=>{
 const store=window.PigaDeviceStore,$=id=>document.getElementById(id);
 const add=(root,title,description,href,kind)=>{
  const item=document.createElement('div');item.className='ops-record';
  const left=document.createElement('div'),b=document.createElement('strong'),sm=document.createElement('small');
  b.textContent=title;sm.textContent=description||'';left.append(b,sm);
  const link=document.createElement('a');link.href=href;link.textContent='Öffnen';link.setAttribute('aria-label',title+' öffnen');
  if(kind)item.dataset.kind=kind;
  item.append(left,link);root.append(item);
 };
 const empty=(root,title,desc)=>add(root,title,desc,'./direct.html#overview','quiet');
 const readLegacy=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 const safeList=value=>Array.isArray(value)?value.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).slice(0,10000):[];
 const pad=n=>String(n).padStart(2,'0');
 const localDay=date=>[date.getFullYear(),pad(date.getMonth()+1),pad(date.getDate())].join('-');
 const ts=value=>{const n=new Date(value).valueOf();return Number.isFinite(n)?n:null};
 const human=value=>{const n=ts(value);return n===null?'Termin ohne gültige Zeit':new Date(n).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'})};
 const short=(v,n=100)=>String(v??'').trim().slice(0,n);
 const queue=[];
 let model=null,tab='today',busy=false;
 function derive(suite,direct,jobs,meta){
  const today=new Date(),midnight=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime();
  const tomorrow=new Date(today.getFullYear(),today.getMonth(),today.getDate()+1).getTime();
  const weekEnd=new Date(today.getFullYear(),today.getMonth(),today.getDate()+7).getTime();
  const appointments=safeList(direct.calendar).map(x=>({...x,timestamp:ts(x.start)})).filter(x=>x.timestamp!==null).sort((a,b)=>a.timestamp-b.timestamp);
  const tasks=safeList(direct.tasks).filter(x=>x.status!=='done'&&x.status!=='closed');
  const todayAgenda=appointments.filter(x=>x.timestamp>=midnight&&x.timestamp<tomorrow);
  const weekAgenda=appointments.filter(x=>x.timestamp>=midnight&&x.timestamp<weekEnd);
  const materials=safeList(suite.inventory);
  const lowStock=materials.filter(x=>Number(x.minimum)>0&&Number(x.quantity||0)<Number(x.minimum));
  const soonExpiry=materials.filter(x=>{const t=ts((x.expiry_on||'')+'T23:59:59');return t!==null&&t<today.getTime()+30*86400000;});
  const openJobs=safeList(jobs).filter(j=>['QUEUED','RUNNING','FAILED'].includes(j.state));
  const failedJobs=openJobs.filter(j=>j.state==='FAILED');
  const cases=safeList(direct.cases),openCases=cases.filter(x=>x.state!=='closed');
  const missingMin=materials.filter(x=>x.minimum===undefined||x.minimum===null);
  const lastChange=ts(meta.lastChange),lastExport=ts(meta.lastExport);
  const hasRecords=cases.length+safeList(direct.tasks).length+safeList(direct.calendar).length+materials.length+
   safeList(suite.staff).length+safeList(suite.shifts).length+safeList(suite.movements).length>0;
  const unsaved=hasRecords&&(!lastExport||(lastChange!==null&&lastChange>lastExport));
  const attention=[];
  if(failedJobs.length)attention.push({title:failedJobs.length+' Worker-Aufträge fehlgeschlagen',description:'Manuelle technische Prüfung; keine automatische Wiederholung externer Effekte.',href:'./device-hub.html',kind:'warning'});
  if(lowStock.length)attention.push({title:lowStock.length+' Materialpositionen unter Mindestbestand',description:'Bestände prüfen; kein automatischer Einkauf.',href:'./inventory.html',kind:'warning'});
  if(soonExpiry.length)attention.push({title:soonExpiry.length+' Verfallsdaten innerhalb von 30 Tagen',description:'Haltbarkeit manuell kontrollieren.',href:'./inventory.html',kind:'warning'});
  if(unsaved)attention.push({title:'Verschlüsselte Sicherung empfohlen',description:'Lokale Änderungen seit dem letzten Export oder noch keine Sicherung.',href:'./device-hub.html#transfer',kind:'caution'});
  if(tasks.length)attention.push({title:tasks.length+' offene lokale Aufgaben',description:'Aufgaben priorisieren, bearbeiten und dokumentieren.',href:'./direct.html#tasks',kind:'regular'});
  if(!hasRecords)attention.push({title:'Arbeitsbereich noch leer',description:'Einen pseudonymen Testfall erstellen oder vorhandene verschlüsselte Testdaten importieren.',href:'./direct.html#cases',kind:'quiet'});
  return {appointments,tasks,todayAgenda,weekAgenda,materials,lowStock,soonExpiry,missingMin,openJobs,failedJobs,cases,openCases,
   attention,hasRecords,unsaved,meta,observedAt:new Date().toISOString(),dbStatus:store.status()};
 }
 function set(id,n){$(id).textContent=String(n)}
 function display(){
  if(!model)return;
  set('opsTasks',model.tasks.length);set('opsToday',model.todayAgenda.length);
  set('opsStock',new Set([...model.lowStock,...model.soonExpiry].map(x=>x.id||x.sku)).size);
  set('opsWorkers',model.openJobs.length);
  set('opsTasksHelp',model.openCases.length+' offene Testfälle');
  set('opsTodayHelp',model.weekAgenda.length+' Termine in 7 Tagen');
  set('opsStockHelp',model.lowStock.length+' unter Minimum · '+model.soonExpiry.length+' Verfallshinweise');
  set('opsWorkersHelp',model.failedJobs.length+' fehlgeschlagen');
  const priorities=$('opsAttention');priorities.replaceChildren();
  for(const x of model.attention.slice(0,9))add(priorities,x.title,x.description,x.href,x.kind);
  if(!priorities.children.length)empty(priorities,'Keine akuten Hinweise','Die derzeitigen lokalen Testdaten ergeben keine weiteren Warnungen.');
  const root=$('opsAgenda');root.replaceChildren();
  if(tab==='tasks'){
   for(const x of model.tasks.slice(0,18)){
    const item=model.cases.find(c=>c.id===x.caseId);
    add(root,short(x.title,95), 'Testfall: '+short(item?.ref||'Unbekannt',35)+' · '+(x.status||'offen'),'./direct.html#tasks','regular');
   }
  }else{
   const list=tab==='week'?model.weekAgenda:model.todayAgenda;
   for(const x of list.slice(0,20))add(root,short(x.title,95),human(x.start)+' · '+(Number(x.minutes)||0)+' Minuten','./direct.html#calendar','regular');
  }
  if(!root.children.length)empty(root,tab==='tasks'?'Keine offenen Aufgaben':'Keine eingetragenen Termine','Es sind für diese Ansicht keine lokalen Testdaten hinterlegt.');
  const health=$('opsHealth');health.replaceChildren();
  add(health,'Lokaler Datenspeicher: '+(model.dbStatus==='indexeddb'?'IndexedDB bereit':'Browser-Ersatzmodus'),'Es findet kein automatischer Cloudabgleich statt.','./device-hub.html',model.dbStatus==='indexeddb'?'quiet':'warning');
  add(health,'Letzter Export: '+(model.meta.lastExport?human(model.meta.lastExport):'Noch keiner erfasst'),
    'Sicherungen vor Gerätewechsel erstellen und Kennwort getrennt aufbewahren.','./device-hub.html#transfer','quiet');
  add(health,'Worker: '+model.openJobs.length+' offene / fehlgeschlagene Aufträge',
    'Lokale Prüfjobs. Kein garantierter 24/7-Betrieb des Browsers.','./device-hub.html','quiet');
  set('opsReload','Aktualisiert: '+new Date(model.observedAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}));
 }
 async function refresh(){
  if(busy)return;busy=true;
  const button=$('opsReload');button.disabled=true;
  try{
   const [suite,direct,jobs]=await Promise.all([
    store.initialize('suite'),store.initialize('direct'),store.listJobs().catch(()=>[])]);
   model=derive(suite||readLegacy('piga-ortho-v12-local')||{},direct||readLegacy('piga-ortho-direct-v1')||{},jobs,store.meta());
   display();
  }catch(error){
   const root=$('opsAttention');root.replaceChildren();
   add(root,'Lokaler Datenreadback nicht möglich',String(error.message).slice(0,160),'./device-hub.html','warning');
  }finally{busy=false;button.disabled=false}
 }
 for(const b of document.querySelectorAll('[data-ops-tab]'))b.addEventListener('click',()=>{
  tab=b.dataset.opsTab;for(const node of document.querySelectorAll('[data-ops-tab]'))node.setAttribute('aria-pressed',String(node===b));
  display();
 });
 $('opsReload').addEventListener('click',refresh);
 $('opsPrint').addEventListener('click',()=>window.print());
 $('opsExport').addEventListener('click',()=>{
  if(!model)return;
  const safe={format:'piga-ortho-operations-brief-v1',observedAt:model.observedAt,testOnly:true,clinicalAuthority:false,
   externalEffects:0,summary:{openCases:model.openCases.length,openTasks:model.tasks.length,todayAppointments:model.todayAgenda.length,
   nextSevenDays:model.weekAgenda.length,lowStock:model.lowStock.length,expiring:model.soonExpiry.length,workerPending:model.openJobs.length,
   workerFailed:model.failedJobs.length,backupRecommended:model.unsaved},actions:model.attention.map(x=>({title:x.title,rule:x.description,route:x.href}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(safe,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='PIGA_ORTHO_3D_TAGESBRIEF_'+localDay(new Date())+'.json';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
 let delayed=null;
 window.addEventListener('focus',refresh);
 window.addEventListener('storage',()=>{clearTimeout(delayed);delayed=setTimeout(refresh,400)});
 window.addEventListener('pageshow',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 await refresh();
})();
