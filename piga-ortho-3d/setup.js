'use strict';
/* Nonblocking first-run setup. Security gates never bypassed; no remote credentials. */
(async()=>{
 const $=id=>document.getElementById(id),steps=6,KEY='piga-ortho-setup-v1';
 const S=window.PigaDeviceStore;let index=0;
 const fresh=()=>({version:1,deviceName:'',checks:{storage:'PENDING',network:'PENDING',bluetooth:'PENDING',worker:'PENDING',voice:'PENDING'},completed:false,updatedAt:null});
 let state=fresh();
 try{const data=JSON.parse(localStorage.getItem(KEY)||'null');if(data?.version===1&&data.checks){state={...fresh(),...data,checks:{...fresh().checks,...data.checks}};}}catch{}
 const persist=()=>{state.updatedAt=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(state))}catch{say('Gerätespeicher nicht verfügbar',true)}};
 const say=(m,error=false)=>{$('setupNotice').textContent=m;$('setupNotice').dataset.error=String(error)};
 const pages=[...document.querySelectorAll('[data-screen]')],buttons=[...document.querySelectorAll('[data-step]')];
 function show(n){
  index=Math.max(0,Math.min(steps-1,n));pages.forEach((p,i)=>p.hidden=i!==index);
  buttons.forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
  $('setupPosition').textContent=(index+1)+' / '+steps;$('setupProgress').style.width=((index+1)/steps*100)+'%';
  $('setupBack').disabled=index===0;$('setupNext').hidden=index===steps-1;
  $('setupStatus').textContent=state.completed?'Einrichtung auf diesem Gerät gespeichert':'App jederzeit zugänglich';
  if(index===5)summary();
 }
 function summary(){
  const root=$('setupSummary');root.replaceChildren();
  const detail=[
   ['Gerät',state.deviceName||'Noch nicht bezeichnet'],
   ['Lokaler Speicher',state.checks.storage],
   ['Netzwerk',state.checks.network],
   ['Bluetooth',state.checks.bluetooth],
   ['Worker',state.checks.worker],
   ['Sprache',state.checks.voice],
   ['PIGA Freigaben','Gate 1 DELAY · Gate 2 BLOCK'],
   ['Produktionsreife','Technische Evaluation; keine Patientendaten']
  ];
  for(const [key,value] of detail){const e=document.createElement('div'),b=document.createElement('b');
   b.textContent=key;e.append(b,document.createTextNode(String(value)));root.append(e)}
 }
 buttons.forEach(b=>b.addEventListener('click',()=>show(Number(b.dataset.step))));
 $('setupBack').onclick=()=>show(index-1);$('setupNext').onclick=()=>show(index+1);
 $('setupSkip').onclick=()=>{location.href='./dashboard.html'};
 $('setupDeviceName').value=state.deviceName;
 $('setupDeviceName').onchange=e=>{state.deviceName=String(e.target.value||'').trim().slice(0,40).replace(/[^A-Za-z0-9_-]/g,'').toUpperCase();e.target.value=state.deviceName;persist()};
 $('setupCheckStorage').onclick=async()=>{
  const el=$('setupStorageResult');el.textContent='Lokalen Speicher prüfen …';
  try{
   if(!S)throw Error('Device Store nicht verfügbar');
   await S.initialize('direct');
   const val=await S.get('direct');
   const stored=val?.data?'Testdaten vorhanden':'Noch keine Testdaten';
   let offline='Service Worker fehlt';
   if('serviceWorker' in navigator){
    const reg=await navigator.serviceWorker.getRegistration('./');
    offline=reg?'PWA Service Worker registriert':'PWA Service Worker nicht registriert';
   }
   const ok=S.status()==='indexeddb';
   state.checks.storage=ok?'BEREIT · IndexedDB · '+offline:'EINGESCHRÄNKT · Browser-Ersatzspeicher';
   el.textContent=state.checks.storage+' · '+stored;persist();say('Speicherprüfung abgeschlossen.');
  }catch(e){state.checks.storage='NICHT BEREIT · '+String(e.message).slice(0,100);el.textContent=state.checks.storage;persist();say('Browser-Speicher eingeschränkt.',true)}
 };
 $('setupScan').onclick=()=>{
  const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const kind=connection?.type||connection?.effectiveType||'nicht ermittelbar';
  const online=navigator.onLine?'ONLINE':'OFFLINE';
  const b=window.PigaNative;let native='';
  try{if(typeof b?.deviceSnapshot==='function')native=' · native Schnittstelle vorhanden';}catch{}
  state.checks.network=online+' · Browser meldet '+kind+native;
  $('setupNetworkResult').textContent=state.checks.network;
  persist();say('Netzwerkstatus gelesen – keine nicht autorisierte WLAN-Suche.');
 };
 $('setupBluetooth').onclick=async()=>{
  if(!navigator.bluetooth?.requestDevice){state.checks.bluetooth='NICHT VERFÜGBAR · Web Bluetooth fehlt';
   $('setupBluetoothResult').textContent=state.checks.bluetooth;persist();return}
  try{const dev=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[]});
   state.checks.bluetooth='AUSGEWÄHLT · '+String(dev.name||'Bluetooth Gerät').slice(0,50)+' · nicht verbunden';
   $('setupBluetoothResult').textContent=state.checks.bluetooth;persist();
  }catch(e){$('setupBluetoothResult').textContent='Keine Auswahl: '+String(e.message||e).slice(0,110);
   state.checks.bluetooth='ÜBERSPRUNGEN';persist()}
 };
 $('setupRunWorker').onclick=async()=>{
  const el=$('setupWorkerResult');if(typeof Worker==='undefined'){el.textContent='Web Worker nicht unterstützt.';state.checks.worker='NICHT VERFÜGBAR';persist();return}
  el.textContent='Begrenzten isolierten Worker prüfen …';
  try{
   const result=await new Promise((resolve,reject)=>{
    const worker=new Worker('./diagnostic-worker.js');const timer=setTimeout(()=>{worker.terminate();reject(Error('Timeout'))},6000);
    worker.onmessage=e=>{clearTimeout(timer);worker.terminate();if(e.data?.status==='PASS')resolve('BEREIT · isolierte SHA-256-Berechnung');else reject(Error(e.data?.error||'Workerfehler'))};
    worker.onerror=()=>{clearTimeout(timer);worker.terminate();reject(Error('Worker nicht ausführbar'))};
    worker.postMessage({kind:'SELF_TEST'});
   });
   state.checks.worker=result;el.textContent=result+' · kein dauerhaftes Hintergrundversprechen';persist();
  }catch(e){state.checks.worker='FEHLER · '+String(e.message).slice(0,90);el.textContent=state.checks.worker;persist()}
 };
 $('setupVoice').onclick=()=>{
  if(!('speechSynthesis' in window)){state.checks.voice='NICHT VERFÜGBAR';$('setupVoiceResult').textContent='Keine Sprachausgabe im Browser.';persist();return}
  const utter=new SpeechSynthesisUtterance('Willkommen bei PIGA ORTHO 3D. Ich bin für technische Fragen da.');
  utter.lang='de-DE';utter.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(utter);
  state.checks.voice='GERÄTESTIMME AKTIV · optionale Spracheingabe separat';$('setupVoiceResult').textContent=state.checks.voice;persist();
 };
 $('setupFinish').onclick=()=>{
  if(!$('setupConsent').checked)return say('Bitte zuerst bestätigen, dass diese öffentliche Testversion keine echten Patienten- oder Personaldaten verarbeitet.',true);
  state.completed=true;persist();show(5);$('setupFinishResult').textContent='Einrichtung lokal gespeichert. Du kannst PIGA jetzt öffnen und jederzeit hierher zurückkehren.';
  say('Einrichtung dieses Geräts gespeichert. Keine echte klinische Freigabe oder Mitarbeiterauthentifizierung.');
 };
 show(0);
})();
