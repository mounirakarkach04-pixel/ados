'use strict';
/* PIGA ORTHO 3D local operations cockpit: derived read-only facts, NO clinical decisions. */
(()=>{
 const root=document.getElementById('orthoOpsCenter');
 if(!root)return;
 const $=id=>document.getElementById(id),DS=window.PigaDeviceStore;
 const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e;};
 const list=(value)=>Array.isArray(value)?value.filter(v=>v&&typeof v==='object'):[];
 const safeNum=x=>Number.isFinite(Number(x))?Number(x):0;
 const localData=(name)=>{
  try{return JSON.parse(localStorage.getItem(name==='direct'?'piga-ortho-direct-v1':'piga-ortho-v12-local')||'null')}catch{return null}
 };
 const stored=async name=>{
  try{const record=await DS?.get(name);if(record?.data?.version===1)return record.data;}catch{}
  return localData(name)||{};
 };
 const localDate=t=>new Date(t).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'});
 const getState=async()=>{
  const [direct,suite,jobs]=await Promise.all([
   stored('direct'),stored('suite'),DS?.listJobs?.().catch(()=>[])||Promise.resolve([])
  ]);
  const cases=list(direct.cases),tasks=list(direct.tasks),calendar=list(direct.calendar),stock=list(suite.inventory),
   people=list(suite.staff),shifts=list(suite.shifts),audit=list(direct.audit);
  const now=new Date(),today=now.toLocaleDateString('de-DE');
  const future=calendar.filter(a=>{const d=new Date(a.start);return Number.isFinite(d.getTime())&&d.getTime()>=now.getTime()-30*60000})
   .sort((a,b)=>new Date(a.start)-new Date(b.start));
  const todays=calendar.filter(a=>{const d=new Date(a.start);return Number.isFinite(d.getTime())&&d.toLocaleDateString('de-DE')===today});
  const lowStock=stock.filter(x=>safeNum(x.minimum)>0&&safeNum(x.quantity)<safeNum(x.minimum));
  const expirySoon=stock.filter(x=>{const d=new Date(x.expiry_on);return x.expiry_on&&Number.isFinite(d.getTime())&&d.getTime()<=Date.now()+30*86400000});
  const openCases=cases.filter(x=>x.state!=='closed');
  const openTasks=tasks.filter(x=>x.status!=='done');
  const unplanned=openCases.filter(c=>!tasks.some(t=>t.caseId===c.id));
  const missing=tasks.filter(t=>t.status!=='done'&&!cases.some(c=>c.id===t.caseId));
  const failed=list(jobs).filter(j=>j.state==='FAILED');
  const activeShift=shifts.findLast(x=>x&&x.ended===null);
  return {cases,tasks,calendar,stock,people,shifts,audit,jobs:list(jobs),now,today,future,todays,lowStock,expirySoon,openCases,openTasks,unplanned,missing,failed,activeShift};
 };
 const route=(container,title,details,href,kind='normal')=>{
  const link=node('a',undefined,'ops-route ops-'+kind);link.href=href;
  const copy=node('span');copy.append(node('strong',title),node('small',details));
  const arr=node('span','↗','ops-arr');arr.setAttribute('aria-hidden','true');link.append(copy,arr);container.append(link);
 };
 let latest=null,loading=false;
 async function refresh(){
  if(loading)return;
  loading=true;
  try{
   const d=await getState();latest=d;
   $('opsDate').textContent=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d.now);
   $('opsCases').textContent=String(d.openCases.length);
   $('opsTasks').textContent=String(d.openTasks.length);
   $('opsCalendar').textContent=String(d.todays.length);
   $('opsStock').textContent=String(d.lowStock.length);
   $('opsTeam').textContent=String(d.people.length);
   const agenda=$('opsAgenda');agenda.replaceChildren();
   for(const a of d.future.slice(0,5))route(agenda,String(a.title||'Technischer Termin').slice(0,90),
    localDate(a.start)+' · '+(safeNum(a.minutes)||0)+' Minuten','./direct.html#calendar');
   if(!d.future.length)route(agenda,'Noch keine anstehenden Termine','Lege einen lokalen Testtermin an.','./direct.html#calendar','empty');
   const queue=$('opsQueue');queue.replaceChildren();
   if(d.lowStock.length)route(queue,d.lowStock.length+' Materialpositionen unter Mindestbestand',
    d.lowStock.slice(0,3).map(x=>String(x.sku||x.label||'Material').slice(0,30)).join(' · '),
    './inventory.html','warn');
   if(d.expirySoon.length)route(queue,d.expirySoon.length+' Materialien mit zeitnaher Verfallprüfung',
    'Verfallsdaten vor jeder realen Verwendung fachlich prüfen.','./inventory.html','warn');
   if(d.unplanned.length)route(queue,d.unplanned.length+' offene Testfälle ohne Aufgaben',
    'Nächsten technischen Schritt erfassen.','./direct.html#tasks');
   if(d.openTasks.length)route(queue,d.openTasks.length+' Aufgaben noch offen',
    d.openTasks.slice(0,2).map(x=>String(x.title||'Aufgabe').slice(0,34)).join(' · '),
    './direct.html#tasks');
   if(d.missing.length)route(queue,d.missing.length+' Aufgaben ohne bestehenden Fall',
    'Verknüpfung der lokalen Testaufgaben kontrollieren.','./direct.html#tasks','warn');
   if(d.failed.length)route(queue,d.failed.length+' lokale Worker-Aufträge fehlgeschlagen',
    'Technische Ausführungsdetails ansehen.','./device-hub.html','warn');
   if(d.activeShift)route(queue,'Aktive Auftragszeit',
    String(d.activeShift.ref||'Technischer Auftrag')+' · seit '+localDate(d.activeShift.started),
    './praxis.html');
   if(!queue.children.length)route(queue,'Keine offenen technischen Hinweise',
    'Testdaten können jederzeit ergänzt werden.','./direct.html#cases','ok');
   const recent=$('opsRecent');recent.replaceChildren();
   for(const a of d.audit.slice(0,4))route(recent,String(a.type||'Lokales Ereignis').replaceAll('_',' '),
    localDate(a.at)+' · '+String(a.detail||'').slice(0,125),'./direct.html#reports');
   if(!d.audit.length)route(recent,'Noch kein lokales Ereignisjournal',
    'Protokolle entstehen bei Testfällen, Aufgaben und Materialänderungen.','./direct.html#reports','empty');
   $('opsStatus').textContent='Lokale Auswertung · '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+
     ' · keine Server- oder Patientendaten';
  }catch(err){
   $('opsStatus').textContent='Lokale Auswertung momentan nicht verfügbar. Die Module bleiben über die Navigation erreichbar.';
  }finally{loading=false}
 }
 $('opsRefresh').onclick=refresh;
 $('opsExport').onclick=()=>{
  if(!latest){$('opsStatus').textContent='Bitte zuerst den lokalen Arbeitsstand laden.';return;}
  const d=latest,report={schema:'piga-ortho-technical-daily-brief-v1',generatedAt:new Date().toISOString(),
   localOnly:true,testOnly:true,containsNames:false,noMedicalDecision:true,
   counters:{openCases:d.openCases.length,openTasks:d.openTasks.length,appointmentsToday:d.todays.length,
    lowStock:d.lowStock.length,upcomingExpiry:d.expirySoon.length,teamTestProfiles:d.people.length,
    failedLocalJobs:d.failed.length},clinicalApproval:'NOT_VERIFIED',deviceExecution:'NOT_AUTHORIZED',
   pigaGate1:'UNKNOWN',pigaGate2:'BLOCK'};
  const a=node('a'),url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  a.href=url;a.download='PIGA-ORTHO-ARBEITSUEBERSICHT-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  $('opsStatus').textContent='Technische Übersicht als JSON exportiert (nur aggregierte Zahlen, keine Namen).';
 };
 let channel;
 try{if('BroadcastChannel' in window){channel=new BroadcastChannel('piga-ortho-device-updates');channel.onmessage=()=>{void refresh()}}}catch{}
 window.addEventListener('storage',e=>{
  if(['piga-ortho-direct-v1','piga-ortho-v12-local'].includes(e.key))void refresh();
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
 void refresh();
})();
