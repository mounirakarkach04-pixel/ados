'use strict';
(async()=>{
 const S=window.PigaDeviceStore,$=id=>document.getElementById(id);
 const B={suite:'Praxis, Personal & Material',direct:'Fälle, Aufgaben & Kalender'};
 const say=(id,message,error=false)=>{
  const e=$(id);e.textContent=message;e.dataset.state=error?'error':'ok';
 };
 const list=(root,title,detail)=>{
  const el=document.createElement('div');el.className='hub-row';const b=document.createElement('b'),sm=document.createElement('small');
  b.textContent=title;sm.textContent=detail;el.append(b,sm);root.append(el);
 };
 const bytes=n=>n===null?'Nicht verfügbar':n<1024?'0 KB':(n/1024/1024).toLocaleString('de-DE',{maximumFractionDigits:1})+' MB';
 const localFallback=(namespace)=>{
  try{return JSON.parse(localStorage.getItem(S.keys[namespace])||'null')}catch{return null}
 };
 const data=async name=>(await S.get(name).catch(()=>null))?.data||localFallback(name);
 const summary=(namespace,obj)=>{
  if(!obj)return 'Noch keine Testdaten auf diesem Gerät';
  return Object.entries(obj).filter(([,v])=>Array.isArray(v)).map(([k,v])=>k+': '+v.length).join(' · ')||'Leerer Arbeitsbereich';
 };
 async function refresh(){
  const info=await S.storageInfo(),jobs=await S.listJobs().catch(()=>[]);
  $('dbStatus').textContent=info.status==='indexeddb'?'Lokal bereit':info.status==='browser-fallback'?'Browser-Ersatzspeicher':'In Prüfung';
  $('used').textContent=bytes(info.usage);$('limit').textContent='Kontingent '+bytes(info.quota);
  $('persistent').textContent=info.persistent===true?'Dauerhaft genehmigt':info.persistent===false?'Nicht garantiert':'Nicht verfügbar';
  $('jobCount').textContent=String(jobs.length);
  const root=$('snapshotList');root.replaceChildren();
  for(const [name,label] of Object.entries(B))list(root,label,summary(name,await data(name)));
  const jobsRoot=$('jobs');jobsRoot.replaceChildren();
  for(const j of jobs.slice(0,16))list(jobsRoot,j.kind+' · '+j.state,
   (j.createdAt||'')+(j.endedAt?' · abgeschlossen '+j.endedAt:'')+
   (j.resultSha256?' · SHA-256 '+j.resultSha256.slice(0,22)+'…':'')+
   (j.error?' · '+j.error:'')+(j.result?' · '+JSON.stringify(j.result).slice(0,260):''));
  if(!jobs.length)list(jobsRoot,'Noch keine Worker-Aufträge','Eine technische Prüfung auswählen und speichern.');
  freshness();
 }
 const freshness=()=>{const m=S.meta();
  const exp=m.lastExport?new Date(m.lastExport).toLocaleString('de-DE'):'Noch keine verschlüsselte Sicherung erstellt';
  const imp=m.lastImport?new Date(m.lastImport).toLocaleString('de-DE'):'Noch kein Import durchgeführt';
  const changed=m.lastChange?new Date(m.lastChange).toLocaleString('de-DE'):'Keine Änderung protokolliert';
  $('transferFreshness').textContent='Letzte Änderung: '+changed+' · Export angeboten/erstellt: '+exp+' · letzter Import: '+imp;
 };
 freshness();
 const queue=()=>S.enqueueJob($('workKind').value).then(()=>{
  say('workerStatus','Auftrag in der Gerätedatenbank gespeichert.');return refresh();
 });
 let lastIntegrity=null;
 $('checkIntegrity').onclick=async()=>{
  const button=$('checkIntegrity');button.disabled=true;
  $('integrityStatus').textContent='Lokale Testdaten werden ausschließlich lesend geprüft …';
  $('exportIntegrity').disabled=true;
  try{
   await S.flush();
   if(!window.PigaOrthoIntegrity)throw Error('Integritätsmodul konnte nicht geladen werden.');
   lastIntegrity=await window.PigaOrthoIntegrity.audit(await data('suite'),await data('direct'));
   const v=lastIntegrity.summary,root=$('integrityIssues');root.replaceChildren();
   for(const item of lastIntegrity.issues.slice(0,40)){
    list(root,item.severity+' · '+item.code,item.section+' · '+item.description);
   }
   if(!lastIntegrity.issues.length)list(root,'Keine Strukturauffälligkeit','Technische Konsistenzprüfung ohne Befund.');
   const hint=v.errors?'Bitte Datenbestand vor weiterer Bearbeitung kontrollieren.':
    v.warnings?'Einige Testeinträge benötigen eine manuelle Kontrolle.':
    'Keine strukturellen Fehler in den geprüften Testdaten.';
   $('integrityStatus').textContent='Ergebnis: '+lastIntegrity.summary.status+' · '+v.errors+' Fehler · '+
     v.warnings+' Hinweise · '+v.information+' Informationsmeldungen. '+hint;
   $('integrityStatus').dataset.state=v.errors?'error':'ok';
   $('exportIntegrity').disabled=false;
  }catch(e){
   lastIntegrity=null;say('integrityStatus','Strukturprüfung nicht möglich: '+String(e.message||e),true);
  }finally{button.disabled=false}
 };
 $('exportIntegrity').onclick=()=>{
  if(!lastIntegrity)return say('integrityStatus','Bitte zuerst die lokale Datenprüfung ausführen.',true);
  const payload=JSON.stringify(lastIntegrity,null,2);
  download('PIGA-ORTHO-INTEGRITY-'+new Date().toISOString().slice(0,10)+'.json',payload);
  say('integrityStatus','Anonymisiertes Integritätsprotokoll als JSON exportiert.');
 };
 $('enqueue').onclick=()=>{queue().catch(e=>say('workerStatus',String(e.message),true));};
 $('refresh').onclick=()=>{refresh().catch(e=>say('workerStatus',String(e.message),true));};
 $('keep').onclick=async()=>{
  try{const ok=await S.persist();say('workerStatus',ok?'Dauerhafter Browserspeicher wurde zugesagt.':'Browser hat dauerhaften Speicher nicht zugesagt. Bitte weiterhin regelmäßig sichern.',!ok);}
  catch(e){say('workerStatus','Speicherberechtigung nicht verfügbar: '+e.message,true)}
  await refresh();
 };
 let worker=null,running=false;
 $('execute').onclick=()=>{
  if(running)return;
  if(typeof Worker==='undefined')return say('workerStatus','Dieser Browser unterstützt keine Web Worker.',true);
  try{
   running=true;$('execute').disabled=true;say('workerStatus','Lokaler Worker bearbeitet höchstens 5 gespeicherte Aufträge …');
   if(worker)worker.terminate();
   worker=new Worker('./device-worker.js');
   worker.onmessage=async e=>{
    if(e.data?.type==='RESULT'){
     say('workerStatus',e.data.processed.length+' technische Aufträge abgeschlossen. Keine externen Aktionen.');
    }else say('workerStatus','Lokaler Worker: '+(e.data?.message||'Unbekannter Fehler'),true);
    running=false;$('execute').disabled=false;worker.terminate();worker=null;await refresh();
   };
   worker.onerror=()=>{running=false;$('execute').disabled=false;worker?.terminate();worker=null;say('workerStatus','Worker-Skript konnte nicht ausgeführt werden.',true);};
   worker.postMessage({type:'RUN',limit:5});
  }catch(err){running=false;$('execute').disabled=false;say('workerStatus',err.message,true)}
 };
 const buf64=arr=>{let out='';for(let i=0;i<arr.length;i+=8192)out+=String.fromCharCode(...arr.subarray(i,i+8192));return btoa(out)};
 const from64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const derive=async(pass,salt)=>{
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 };
 const download=(name,content)=>{
  const u=URL.createObjectURL(new Blob([content],{type:'application/json'}));
  const a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),1300);
 };
 let shareCandidate=null;
 $('share').onclick=async()=>{
  if(!shareCandidate||!navigator.share||!(navigator.canShare?.({files:[shareCandidate]})))return say('transferStatus','Das Teilen von Dateien wird hier nicht unterstützt. Nutze die heruntergeladene verschlüsselte Sicherung.',true);
  try{await navigator.share({files:[shareCandidate],title:'PIGA ORTHO 3D – verschlüsselte Datensicherung'});
   say('transferStatus','System-Teilen wurde geöffnet. Datei und Kennwort getrennt und sicher übermitteln.');
  }catch(e){if(e.name!=='AbortError')say('transferStatus','Teilen nicht abgeschlossen: '+e.message,true)}
 };
 $('export').onclick=async()=>{
  const pass=$('secret').value;
  if(pass.length<12)return say('transferStatus','Mindestens 12 Zeichen für das Sicherungspasswort eingeben.',true);
  try{
   await S.flush();
   const suite=await data('suite'),direct=await data('direct');
   const payload={format:'piga-ortho-device-payload-v1',exportedAt:new Date().toISOString(),suite,direct};
   const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
   const key=await derive(pass,salt);
   const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(payload)));
   const envelope={format:'piga-ortho-encrypted-transfer-v1',kdf:'PBKDF2-SHA256',iterations:250000,cipher:'AES-256-GCM',
    salt:buf64(salt),iv:buf64(iv),ciphertext:buf64(new Uint8Array(ct))};
   const name='PIGA-ORTHO-DEVICE-'+new Date().toISOString().slice(0,10)+'.json';
   const text=JSON.stringify(envelope);
   download(name,text);S.markBackup();
   shareCandidate=typeof File!=='undefined'?new File([text],name,{type:'application/json'}):null;
   $('share').hidden=!(shareCandidate&&navigator.share&&navigator.canShare?.({files:[shareCandidate]}));
   say('transferStatus','Verschlüsselter Export gestartet. Speicher die Datei sicher; auf geeigneten Geräten ist direktes Teilen möglich.');
   freshness();
  }catch(e){say('transferStatus','Export fehlgeschlagen: '+String(e.message),true)}
 };
 const good=(name,thing)=>{
  if(thing===null)return true;
  if(!thing||typeof thing!=='object'||Array.isArray(thing)||thing.version!==1)return false;
  const fields=name==='suite'?['staff','shifts','inventory','movements','clock','schedule']:['cases','tasks','calendar','inventory','team','audit'];
  return fields.every(f=>Array.isArray(thing[f])&&thing[f].length<=10000);
 };
 $('import').onclick=async()=>{
  const file=$('backupFile').files?.[0],pass=$('secret').value;
  if(!file||pass.length<12)return say('transferStatus','Verschlüsselte JSON-Datei und Sicherungspasswort erforderlich.',true);
  if(file.size>10*1024*1024)return say('transferStatus','Sicherungsdatei größer als 10 MB abgewiesen.',true);
  try{
   const envelope=JSON.parse(await file.text());
   if(envelope.format!=='piga-ortho-encrypted-transfer-v1'||envelope.iterations!==250000||
    envelope.cipher!=='AES-256-GCM'||!envelope.salt||!envelope.iv||!envelope.ciphertext)throw Error('Unbekanntes Sicherungsformat');
   const salt=from64(envelope.salt),iv=from64(envelope.iv);if(salt.length!==16||iv.length!==12)throw Error('Ungültige Verschlüsselungsparameter');
   const key=await derive(pass,salt),content=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,from64(envelope.ciphertext));
   const o=JSON.parse(new TextDecoder().decode(content));
   if(o.format!=='piga-ortho-device-payload-v1'||!good('suite',o.suite)||!good('direct',o.direct))throw Error('Sicherungsinhalt ungültig');
   if(!o.suite&&!o.direct)throw Error('Sicherung enthält keine Testdaten');
   if(!confirm('Wirklich die vorhandenen lokalen Testdaten dieses Geräts durch die Sicherung ersetzen? Vorher eigene Sicherung erstellen.'))return;
   if(o.suite)await S.replace('suite',o.suite);
   if(o.direct)await S.replace('direct',o.direct);
   S.markImport();
   $('secret').value='';say('transferStatus','Sicherung erfolgreich eingelesen. Andere geöffnete Ortho-Tabs neu laden.');
   await refresh();
  }catch(e){say('transferStatus','Import fehlgeschlagen: Kennwort oder Datei prüfen. '+String(e.message),true)}
 };
 document.addEventListener('piga-device-storage-warning',e=>say('workerStatus','Lokaler Speicher: '+e.detail,true));
 await Promise.all([S.initialize('suite'),S.initialize('direct')]);
 await refresh();
})();
