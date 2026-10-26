'use strict';
/* One-paned mobile / two-paned desktop PIGA Manager. No cloud credentials or patient data. */
(async()=>{
 const S=window.PigaDeviceStore,$=id=>document.getElementById(id);
 const show=(id,value)=>{const el=$(id);if(el)el.textContent=String(value)};
 const add=(root,text)=>{const item=document.createElement('div');item.className='manager-suggestion';item.textContent=String(text).slice(0,220);root.append(item)};
 let last=null;
 async function refresh(){
  $('managerRefresh').disabled=true;
  try{
   const [suite,direct,jobs,info]=await Promise.all([
    S.initialize('suite'),S.initialize('direct'),S.listJobs().catch(()=>[]),S.storageInfo()]);
   const native=(()=>{try{return typeof window.PigaNative?.localRunnerStatus==='function'?
    JSON.parse(window.PigaNative.localRunnerStatus()):null}catch{return null}})();
   const status=window.PigaOrthoResilience?.status?.()||{};
   const recent=jobs.filter(x=>['QUEUED','RUNNING','FAILED'].includes(x.state));
   const audit=jobs.filter(x=>x.kind==='DATA_INTEGRITY_AUDIT'&&x.state==='DONE');
   const suggestions=jobs.filter(x=>x.kind==='IMPROVEMENT_BACKLOG'&&x.state==='DONE');
   const lastSuggestion=suggestions[0]?.result?.suggestions;
   last={updatedAt:new Date().toISOString(),db:S.status(),native:!!native,
    nativeMode:native?.mode||'BROWSER_FOREGROUND_ONLY',jobsOpen:recent.length,
    lastNativeRun:native?.lastRun||null,
    localLastRun:status.lastRun||null,cloudRequired:false,patientDetailsIncluded:false,gate2:'BLOCK',externalEffects:0};
   show('managerDatabase',S.status()==='indexeddb'?'Lokal bereit':'Speicher prüfen');
   show('managerCloud','Optional');
   show('managerJobs',recent.length);
   show('managerNative',native?.mode==='NATIVE_SQLITE_SCHEDULED'?'Android SQLite':'Browser');
   show('managerNativeDetail',native?.lastRun?'Letzte native Prüfung: '+new Date(native.lastRun).toLocaleString('de-DE'):'Ohne native Zeitgarantie');
   show('managerMode',S.status()==='indexeddb'?'DEVICE FIRST':'PRÜFEN');
   show('managerExplanation',S.status()==='indexeddb'?
    'Die lokalen Daten sind unabhängig von Supabase. Die Cloud ist kein Startzwang; mehrere Geräte benötigen später einen autorisierten Abgleich.':
    'Die lokale Datenbank ist nicht bestätigt. Browser-Berechtigungen und verschlüsselte Sicherungen prüfen.');
   show('managerLatest',(status.lastRun?'Web-Prüfung: '+new Date(status.lastRun).toLocaleString('de-DE'):'Automatische Web-Prüfung noch nicht bestätigt')+
    ' · '+audit.length+' Integritätsberichte · '+suggestions.length+' Verbesserungsläufe');
   const root=$('managerSuggestions');root.replaceChildren();
   if(Array.isArray(lastSuggestion)&&lastSuggestion.length)for(const item of lastSuggestion.slice(0,6))add(root,item);
   else add(root,'Keine fertige lokale Prioritätenliste. Jetzt einen begrenzten Prüflauf auslösen.');
   if(recent.some(j=>j.state==='FAILED'))add(root,'Workerfehler: technische Prüfevidenz kontrollieren; nicht blind wiederholen.');
  }catch(error){show('managerExplanation','Gerätedatenbank konnte nicht geprüft werden: '+String(error.message).slice(0,120));}
  finally{$('managerRefresh').disabled=false;}
 }
 $('managerRefresh').onclick=()=>{void refresh()};
 $('managerRun').onclick=async()=>{
  const button=$('managerRun');button.disabled=true;show('managerLatest','Lokale Prüfungen laufen. Keine Netzwerk- oder Gerätewirkungen.');
  let worker,timer;
  try{
   for(const kind of ['HEALTH_CHECK','DATA_INTEGRITY_AUDIT','IMPROVEMENT_BACKLOG'])
    await S.enqueueUniqueJob(kind);
   const result=await new Promise((resolve,reject)=>{
    worker=new Worker('./device-worker.js');
    timer=setTimeout(()=>reject(Error('Worker nach 12 Sekunden gestoppt')),12000);
    worker.onmessage=e=>e.data?.type==='RESULT'?resolve(e.data.processed):e.data?.type==='ERROR'?reject(Error(String(e.data.message))):null;
    worker.onerror=()=>reject(Error('Lokaler Workerfehler'));
    worker.postMessage({type:'RUN',limit:5});
   });
   await refresh();show('managerLatest',(result?.length||0)+' lokale Prüfergebnisse gespeichert · keine externen Effekte');
  }catch(error){show('managerLatest','Begrenzter Prüflauf nicht abgeschlossen: '+String(error.message).slice(0,150));}
  finally{if(timer)clearTimeout(timer);try{worker?.terminate()}catch{}button.disabled=false;}
 };
 $('managerExport').onclick=()=>{
  if(!last)return;
  const blob=new Blob([JSON.stringify({schema:'piga-ortho-manager-status.v1',...last},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PIGA-ORTHO-STATUS.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 document.addEventListener('piga-ortho-resilience-state',()=>{void refresh()});
 await refresh();
})();
