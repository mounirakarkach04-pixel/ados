'use strict';
/* PIGA ORTHO DEVICE RESILIENCE v1.
 * On-device IndexedDB is primary; Supabase is OPTIONAL, never a boot dependency.
 * Foreground PWA worker is bounded, read-only and not a 24x7 daemon.
 * Browser tabs do not acquire device/server authority or sync patient data.
 */
(()=>{
 if(window.PigaOrthoResilience)return;
 const S=window.PigaDeviceStore,KEY='piga-ortho-local-review-schedule-v1';
 const JOBS=['HEALTH_CHECK','DATA_INTEGRITY_AUDIT','IMPROVEMENT_BACKLOG'];
 const INTERVAL=15*60*1000;
 let busy=false,live=true,runCount=0,lastError=null,lastRun=null,mode='DEVICE_ONLY';
 const now=()=>Date.now();
 const emit=()=>document.dispatchEvent(new CustomEvent('piga-ortho-resilience-state',{detail:status()}));
 const status=()=>({mode,storage:S?.status?.()||'unavailable',localOnly:true,supabaseRequired:false,
  lastRun,runCount,busy,lastError,background24x7:false,clinicalEffects:0,externalEffects:0,
  explanation:'Die lokale Datenbank läuft unabhängig von Supabase. Browser-Worker laufen nur im Vordergrund.'});
 const isReady=()=>!!S&&document.visibilityState!=='hidden'&&live;
 function lockStorage(){
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');return raw&&typeof raw==='object'?raw:{}}
  catch{return {}}
 }
 const record=()=>{try{localStorage.setItem(KEY,JSON.stringify({at:now(),jobs:JOBS}))}catch{}};
 async function execute(){
  if(!isReady()||busy)return false;
  busy=true;emit();
  let runner=null,timer=null;
  try{
   await Promise.all([S.initialize('suite'),S.initialize('direct')]);
   if(S.status()!=='indexeddb')throw Error('Lokale IndexedDB nicht verfügbar');
   const stored=lockStorage();
   if(now()-Number(stored.at||0)<INTERVAL-1000){mode='DEVICE_READY';return false;}
   // No writer in a second simultaneous tab. Where navigator.locks is absent, avoid automatic execution.
   const work=async lock=>{
    if(!lock)return false;
    if(now()-Number(lockStorage().at||0)<INTERVAL-1000)return false;
    for(const kind of JOBS)await S.enqueueUniqueJob(kind);
    record();
    const result=await new Promise((resolve,reject)=>{
     if(typeof Worker==='undefined'){reject(Error('Worker API fehlt'));return;}
     runner=new Worker('./device-worker.js');
     timer=setTimeout(()=>reject(Error('Worker-Zeitlimit überschritten')),12000);
     runner.onmessage=e=>{
      if(e.data?.type==='RESULT')resolve(e.data.processed||[]);
      else if(e.data?.type==='ERROR')reject(Error(String(e.data.message).slice(0,120)));
     };
     runner.onerror=()=>reject(Error('Lokaler Worker nicht ausführbar'));
     runner.postMessage({type:'RUN',limit:5});
    });
    lastRun=new Date().toISOString();runCount++;lastError=null;mode='DEVICE_READY';
    emit();return result.length>0;
   };
   if(navigator.locks?.request)return await navigator.locks.request('piga-ortho-auto-review',{mode:'exclusive',ifAvailable:true},work);
   // Existing manual runner remains functional. Never allow two opportunistic auto-runners without tab arbitration.
   lastError='Automatik benötigt Browser LockManager; manuelle Worker bleiben nutzbar';
   return false;
  }catch(error){
   lastError=String(error?.message||error).slice(0,160);
   mode=S?.status?.()==='indexeddb'?'DEVICE_READY':'LOCAL_STORAGE_UNAVAILABLE';emit();return false;
  }finally{
   if(timer)clearTimeout(timer);
   try{runner?.terminate()}catch{}
   busy=false;emit();
  }
 }
 function start(){
  if(!live||!isReady())return;
  // Running soon after page open and again only when foregrounded.
  void execute();
 }
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')start()});
 window.addEventListener('online',start);
 window.addEventListener('pageshow',start);
 const heartbeat=setInterval(()=>{if(isReady())start()},INTERVAL);
 window.addEventListener('pagehide',()=>{live=false;clearInterval(heartbeat)},{once:true});
 window.PigaOrthoResilience={status,runNow:execute};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
