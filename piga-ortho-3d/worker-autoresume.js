'use strict';
/* Resume already admitted, read-only local worker jobs when the PWA is foregrounded.
   Never installs a 24/7 browser daemon, remotely dispatches, or creates new jobs. */
(()=>{
 if(!('Worker' in window)||!('indexedDB' in window))return;
 let working=false,last=0;
 async function run(){
  if(working||document.visibilityState==='hidden'||Date.now()-last<45000)return;
  last=Date.now();
  const S=window.PigaDeviceStore;
  if(!S)return;
  let jobs;try{jobs=await S.listJobs()}catch{return}
  if(!jobs.some(j=>j.state==='QUEUED'||j.state==='RUNNING'))return;
  working=true;
  let worker,timer;
  try{
   worker=new Worker('./device-worker.js');
   const complete=(reason,detail)=>{
    clearTimeout(timer);worker?.terminate();working=false;
    if(detail?.length)window.dispatchEvent(new CustomEvent('piga-worker-resume',{detail:{reason,processed:detail.length}}));
   };
   worker.onmessage=e=>{
    if(e.data?.type==='RESULT')complete('RESULT',e.data.processed);
    else complete('ERROR',[]);
   };
   worker.onerror=()=>complete('ERROR',[]);
   timer=setTimeout(()=>complete('TIMEOUT',[]),30000);
   worker.postMessage({type:'RUN',limit:5});
  }catch{clearTimeout(timer);worker?.terminate();working=false}
 }
 const start=()=>{void run()};
 window.addEventListener('pageshow',start);
 document.addEventListener('visibilitychange',start);
 setTimeout(start,1500);
})();
