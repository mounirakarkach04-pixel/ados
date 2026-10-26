'use strict';
/* PIGA ORTHO 3D – Device-first UI orchestration.
   Only bounded approved read-only local jobs; no remote LLM or real clinical commands. */
(async()=>{
 const S=window.PigaDeviceStore,B=window.PigaBrain,$=id=>document.getElementById(id);
 if(!S||!B){$('pcNotice').textContent='PIGA-Basis nicht geladen. App aktualisieren.';return;}
 const defaults=()=>({schema:1,messages:[],teamMessages:[],requests:[]});
 let state=defaults(),audience='owner',busy=false,automatic=false,lastAnswer='',lastPulse=0,activeWorker=null,autoTimer=null,interval=null,channel=null;
 const stamp=()=>new Date().toISOString(),short=(v,n=300)=>String(v??'').trim().slice(0,n);
 const notice=(m,error=false)=>{const el=$('pcNotice');el.textContent=m;el.dataset.error=String(error)};
 const mk=(tag,txt,cls)=>{const el=document.createElement(tag);if(txt!==undefined)el.textContent=String(txt);if(cls)el.className=cls;return el};
 const savedRole=()=>{try{return sessionStorage.getItem('piga-control-view')||'owner'}catch{return 'owner'}};
 audience=savedRole()==='staff'?'staff':'owner';$('pcAudience').value=audience;
 async function load(){
  try{const data=await S.loadPigaControl();if(data?.schema===1&&Array.isArray(data.messages)&&Array.isArray(data.requests)&&Array.isArray(data.teamMessages))state=data;}
  catch(e){notice('Gerätedatenbank konnte nicht geladen werden: '+short(e.message,130),true);}
 }
 let writeQueue=Promise.resolve();
 function save(){
  const snapshot=structuredClone(state);
  writeQueue=writeQueue.catch(()=>{}).then(()=>S.savePigaControl(snapshot)).catch(e=>{notice('PIGA-Datenspeicherung fehlgeschlagen: '+short(e.message,120),true)});
  return writeQueue;
 }
 const message=(from,content)=>({id:crypto.randomUUID(),from,content:short(content,800),at:stamp()});
 function bubble(record){
  const root=mk('div','','pc-bubble');root.dataset.from=record.from==='user'?'user':'assistant';
  root.append(mk('div',record.content));root.append(mk('small',(record.from==='user'?'Du':'PIGA · lokal')+' · '+new Date(record.at).toLocaleTimeString('de-DE')));
  if(record.href&&record.href.startsWith('./')){
   const a=mk('a','Zum passenden Werkzeug');a.href=record.href;root.append(a);
  }
  return root;
 }
 function renderFeed(){
  const root=$('pcChatFeed');root.replaceChildren();
  const messages=state.messages.slice(-30);
  if(!messages.length){
   const intro=message('assistant','Willkommen im PIGA Control. Ich bin sofort offline nutzbar, erkläre dir die vorhandenen Werkzeuge und bereite sichere Prüfanfragen vor. Frag nach PIGA, DICOM, STL, Urlaub, Inventur, BEMA oder Workern.');
   root.append(bubble(intro));
  }else for(const m of messages){const el=bubble(m);
   if(m.from==='assistant'&&m.href){const a=mk('a','Modul öffnen');a.href=m.href;el.append(a)}
   root.append(el);
  }
  root.scrollTop=root.scrollHeight;
 }
 function renderTeam(){
  const root=$('pcTeamFeed');root.replaceChildren();
  const records=state.teamMessages.slice(-30);
  if(!records.length)root.append(mk('p','Noch keine technischen Teamnachrichten in diesem Browserprofil.'));
  for(const msg of records){
   const item=mk('div','','pc-team-item');
   item.append(mk('strong',msg.from),mk('p',msg.content),mk('small',new Date(msg.at).toLocaleString('de-DE')));
   root.append(item);
  }
  root.scrollTop=root.scrollHeight;
 }
 const kindLabel={LEAVE_REQUEST:'Urlaubsanfrage',PRINT_REVIEW:'Druckprüfung',INVENTORY_REVIEW:'Materialprüfung',
  BILLING_REVIEW:'Abrechnungsprüfung',CLINICAL_REVIEW:'Fachprüfung',TEAM_REVIEW:'Teamprüfung',
  GEOMETRY_REVIEW:'Geometrieprüfung',IMAGING_REVIEW:'DICOM-Vorschau',WORKER_CHECK:'Workerprüfung'};
 function renderRequests(){
  const root=$('pcRequests');root.replaceChildren();
  let pending=0;
  const items=state.requests.slice(-35).reverse();
  if(!items.length)root.append(mk('p','Noch keine lokalen Prüfanfragen.'));
  for(const r of items){
   const expired=Number.isFinite(Date.parse(r.expiresAt))&&Date.now()>Date.parse(r.expiresAt);
   if(r.status==='AWAITING_REVIEW'&&!expired)pending++;
   const block=mk('article','','pc-review-item');block.dataset.status=r.status;
   block.append(mk('strong',(kindLabel[r.kind]||r.kind)+' · '+(expired?'EXPIRED':r.status)));
   block.append(mk('p',r.description));
   block.append(mk('small',(r.requestedBy==='STAFF_UI_UNVERIFIED'?'Mitarbeiteransicht':'Inhaberansicht')+
    ' · '+new Date(r.requestedAt).toLocaleString('de-DE')+' · Gate 2 BLOCK'));
   if(r.status==='AWAITING_REVIEW'&&!expired&&audience==='owner'){
    const row=mk('div','','pc-review-buttons');
    const approve=mk('button','Freigeben · Identität erforderlich');approve.type='button';approve.disabled=true;
    approve.title='Keine verifizierte Betreiberidentität. Echte Genehmigungen bleiben gesperrt.';
    const reject=mk('button','Ablehnen');reject.type='button';
    const pause=mk('button','Pausieren');pause.type='button';
    for(const [button,result] of [[reject,'REJECT'],[pause,'PAUSE']]){
     button.addEventListener('click',async()=>{
      try{const index=state.requests.findIndex(q=>q.id===r.id);if(index<0)return;
       state.requests[index]=B.decide(state.requests[index],result,false);await save();renderRequests();
       notice('Entwurf '+(result==='REJECT'?'abgelehnt':'pausiert')+'. Keine reale Aktion ausgelöst.');
      }catch(e){notice(short(e.message),true)}
     });
    }
    row.append(approve,reject,pause);block.append(row);
   }
   root.append(block);
  }
  $('pcPending').textContent=String(pending);
 }
 function renderAudience(){
  const staff=audience==='staff';
  $('pcAudienceHint').textContent=staff?
   'Mitarbeiter-Hilfemodus · keine vertraulichen Inhaberfunktionen; keine echte Zugriffssperre.':
   'Inhaberansicht ist ohne sichere Anmeldung keine echte Autorisierung.';
  document.body.dataset.pigaAudience=audience;
  $('pcRequestKind').value=staff?'LEAVE_REQUEST':'INVENTORY_REVIEW';
  for(const el of document.querySelectorAll('[data-job]'))el.disabled=staff;
  for(const id of ['pcRun','pcAuto','pcPauseWorker'])$(id).disabled=staff;
  renderRequests();
 }
 async function submitChat(question){
  const q=short(question,500);if(!q)return;
  state.messages.push(message('user',q));
  let taskCount=0;
  try{const direct=(await S.get('direct'))?.data;taskCount=(direct?.tasks||[]).filter(t=>t.status==='open').length;}catch{}
  const result=B.answer(q,audience,{openTasks:taskCount,heartbeat:lastPulse?new Date(lastPulse).toLocaleTimeString('de-DE'):null});
  const response=message('assistant',result.reply);response.href=result.href;
  lastAnswer=result.reply;state.messages.push(response);
  let requested=false;
  const verbs=/\b(ich beantrage|beantrage|ich möchte beantragen|bitte anlegen|beauftrage|bitte prüfen|starte|lege an|erzeuge auftrag)\b/i;
  const actionable=['LEAVE_REQUEST','PRINT_REVIEW','INVENTORY_REVIEW','BILLING_REVIEW','CLINICAL_REVIEW','TEAM_REVIEW','GEOMETRY_REVIEW','IMAGING_REVIEW'];
  if(verbs.test(q)&&actionable.includes(result.kind)){
   state.requests.push(B.request(result.kind,q,audience));requested=true;
  }
  state.messages=state.messages.slice(-100);state.requests=state.requests.slice(-100);
  renderFeed();renderRequests();await save();
  if(requested)notice('PIGA hat einen technischen Entwurf im Freigabeeingang vorgemerkt. Keine Freigabe oder Ausführung.');
  else notice(result.source+' · '+result.routeTitle+' · keine externen Effekte');
 }
 $('pcChatForm').addEventListener('submit',e=>{
  e.preventDefault();const text=$('pcChatInput').value;$('pcChatInput').value='';
  void submitChat(text);
 });
 for(const button of document.querySelectorAll('#pcShortcuts [data-query]'))
  button.addEventListener('click',()=>{void submitChat(button.dataset.query)});
 $('pcAudience').addEventListener('change',e=>{
  audience=e.target.value==='staff'?'staff':'owner';
  try{sessionStorage.setItem('piga-control-view',audience)}catch{}
  renderAudience();notice('Ansichtsmodus geändert – keine echte Inhaber-/Mitarbeiter-Authentifizierung.');
 });
 $('pcRequestForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const kind=$('pcRequestKind').value,text=short($('pcRequestText').value,250);
  if(!text)return;
  if(audience==='staff'&&kind!=='LEAVE_REQUEST'){notice('Mitarbeiter können hier nur eine Urlaubs-Testanfrage vormerken.',true);return}
  state.requests.push(B.request(kind,text,audience));state.requests=state.requests.slice(-100);
  $('pcRequestText').value='';renderRequests();await save();notice('Anfrage in der lokalen PIGA Inbox gespeichert; wartet auf echte Berechtigungsprüfung.');
 });
 $('pcTeamForm').addEventListener('submit',async e=>{
  e.preventDefault();const n=short($('pcTeamName').value,32),text=short($('pcTeamMessage').value,500);
  if(!/^[A-Za-z0-9_-]{3,32}$/.test(n)||!text){notice('Gültigen Pseudonym-Namen und Text verwenden.',true);return}
  state.teamMessages.push(message(n,text));state.teamMessages=state.teamMessages.slice(-100);
  $('pcTeamMessage').value='';renderTeam();await save();notice('Lokal gespeichert; andere Tabs in diesem Browserprofil werden benachrichtigt.');
 });
 const info=async()=>{
  let jobs=[],events=[];
  try{[jobs,events]=await Promise.all([S.listJobs(),S.listEvents()])}catch(e){$('pcRuntimeHint').textContent='Datenbankstatus: '+short(e.message,70)}
  $('pcJobs').textContent=String(jobs.length);
  const pending=jobs.filter(j=>j.state==='QUEUED').length,running=jobs.filter(j=>j.state==='RUNNING').length;
  $('pcJobsHint').textContent=pending+' wartend · '+running+' in Bearbeitung';
  const root=$('pcEvents');root.replaceChildren();
  for(const ev of events.slice(0,12)){
   const item=mk('div','','pc-event');
   item.append(mk('strong',ev.kind+' · '+ev.state));
   item.append(mk('small',new Date(ev.at).toLocaleString('de-DE')+
    (ev.sha256?' · SHA256 '+ev.sha256.slice(0,18)+'…':'')));
   root.append(item);
  }
  if(!events.length)root.append(mk('p','Noch keine lokalen Worker-Ergebnisse.'));
  const last=events[0];
  if(last){
   $('pcTicker').textContent=last.kind+' · '+last.state+' · '+(last.sha256?'mit SHA-256 Prüfsumme':'Readback nicht bestätigt');
   $('pcTickTime').textContent=new Date(last.at).toLocaleTimeString('de-DE');
  }
 };
 async function workerRun(){
  if(busy||document.visibilityState==='hidden')return;
  if(!('Worker' in window)){notice('Dieser Browser unterstützt keine lokalen Web Worker.',true);return}
  busy=true;$('pcRuntime').textContent='RUNNING';
  $('pcRuntimeHint').textContent='Begrenzter lokaler Job-Lauf';
  const process=async()=>new Promise((resolve,reject)=>{
   const worker=new Worker('./device-worker.js');activeWorker=worker;
   const timer=setTimeout(()=>{worker.terminate();activeWorker=null;reject(Error('Worker-Timeout nach 25s'))},25000);
   worker.onmessage=e=>{clearTimeout(timer);worker.terminate();activeWorker=null;
    if(e.data?.type==='RESULT')resolve(e.data.processed||[]);
    else reject(Error(short(e.data?.message||'Worker error',100)))};
   worker.onerror=()=>{clearTimeout(timer);worker.terminate();activeWorker=null;reject(Error('Worker konnte nicht ausgeführt werden'))};
   worker.postMessage({type:'RUN',limit:5});
  });
  try{
   const execute=async()=>{const list=await process();await info();
    notice(list.length?list.length+' technisch lesende Worker-Aufträge abgeschlossen.':'Keine wartenden Worker-Aufträge.');
   };
   if(navigator.locks?.request)await navigator.locks.request('piga-ortho-local-job-run',{mode:'exclusive'},execute);
   else await execute();
  }catch(e){notice('Worker-Ausführung: '+short(e.message,150),true)}
  finally{busy=false;$('pcRuntime').textContent=document.visibilityState==='visible'?'FOREGROUND':'PAUSIERT';
   $('pcRuntimeHint').textContent='Gerätelokal · keine 24/7-Garantie'}
 }
 async function enqueue(kind){
  if(audience!=='owner')return notice('Lesende Worker-Aufträge sind im Mitarbeiteransichtsmodus deaktiviert.',true);
  try{await S.enqueueJob(kind);await info();notice('Technischer Auftrag '+kind+' in der lokalen IndexedDB-Warteschlange.');
   void workerRun();}
  catch(e){notice('Auftrag konnte nicht gespeichert werden: '+short(e.message),true)}
 }
 for(const btn of document.querySelectorAll('[data-job]'))btn.addEventListener('click',()=>{void enqueue(btn.dataset.job)});
 $('pcRun').onclick=()=>{void workerRun()};
 $('pcAuto').onclick=()=>{
  automatic=!automatic;const el=$('pcAuto');el.textContent='Auto bei geöffnetem Tab: '+(automatic?'AN':'AUS');
  el.setAttribute('aria-pressed',String(automatic));notice(automatic?'Automatik für lesende, begrenzte Jobs aktiv, solange diese Seite sichtbar ist.':'Automatik beendet.');
 };
 $('pcPauseWorker').onclick=()=>{automatic=false;$('pcAuto').textContent='Auto bei geöffnetem Tab: AUS';
  $('pcAuto').setAttribute('aria-pressed','false');notice('Automatische Worker-Wiederaufnahme pausiert. Ein laufender endlicher Job wird kontrolliert abgeschlossen.')};
 function heartbeat(){
  if(document.visibilityState!=='visible'){
   $('pcRuntime').textContent='PAUSIERT';$('pcRuntimeHint').textContent='Browser im Hintergrund; kein verlässlicher Worker';
   return;
  }
  lastPulse=Date.now();$('pcHeartbeat').textContent=new Date(lastPulse).toLocaleTimeString('de-DE');
  $('pcRuntime').textContent=busy?'RUNNING':'FOREGROUND';
  $('pcRuntimeHint').textContent='Lokaler Seiten-Heartbeat · kein Server';
  if(automatic&&audience==='owner'&&!busy)void S.listJobs().then(j=>{
   if(j.some(x=>x.state==='QUEUED'))void workerRun();
  }).catch(()=>{});
 }
 // Optional browser speech. Browser implementations may send voice data to their own providers.
 $('pcListen').onclick=()=>{
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition)return notice('Spracheingabe wird von diesem Browser nicht angeboten. Chat funktioniert weiterhin als Text.',true);
  const rec=new Recognition();rec.lang='de-DE';rec.interimResults=false;rec.maxAlternatives=1;
  rec.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';
   $('pcChatInput').value=short(text,500);$('pcChatInput').focus();notice('Gesprochene Frage eingefügt. Mit „PIGA fragen“ absenden.')};
  rec.onerror=e=>notice('Mikrofon/Spracherkennung: '+short(e.error,90),true);
  try{rec.start();notice('Mikrofon aktiv. Browserberechtigung ist ggf. erforderlich.')}catch(e){notice(short(e.message),true)}
 };
 $('pcSpeak').onclick=()=>{
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))
   return notice('Sprachausgabe wird hier nicht unterstützt.',true);
  const utter=new SpeechSynthesisUtterance(lastAnswer||'Willkommen im PIGA Control');
  utter.lang='de-DE';utter.rate=.97;speechSynthesis.cancel();speechSynthesis.speak(utter);
  notice('Gerätestimme liest die letzte PIGA-Antwort vor.');
 };
 $('pcWebForm').onsubmit=e=>{
  e.preventDefault();const q=short($('pcWebQuery').value,150);if(!q)return;
  if(/\b(patient|krankenkasse|versichertennummer|geburtsdatum|diagnose eines)\b/i.test(q))
   return notice('Keine patientenbezogenen Suchbegriffe im offenen Internet verwenden.',true);
  const url='https://www.google.com/search?q='+encodeURIComponent(q);
  const w=window.open(url,'_blank','noopener,noreferrer');
  if(!w)notice('Pop-up blockiert. Bitte Browserfreigabe für externe öffentliche Suche prüfen.',true);
  else notice('Öffentliche Suche im Browser geöffnet. PIGA hat keine Ergebnisse heimlich ausgelesen.');
 };
 document.addEventListener('visibilitychange',()=>{
  heartbeat();
  if(document.visibilityState==='visible'){void info();void load().then(()=>{renderTeam();renderRequests()})}
 });
 window.addEventListener('pageshow',heartbeat);
 if(typeof BroadcastChannel!=='undefined'){
  channel=new BroadcastChannel('piga-ortho-device-updates');
  channel.onmessage=e=>{
   if(e.data?.name==='piga-control')void load().then(()=>{renderTeam();renderRequests()});
   if(e.data?.name==='direct'||e.data?.name==='suite')void info();
  };
 }
 try{await S.initialize('direct');await load();}catch(e){notice('Lokale Datenbank: '+short(e.message),true)}
 renderFeed();renderTeam();renderAudience();await info();heartbeat();
 interval=setInterval(()=>{heartbeat();void info()},10000);
 window.addEventListener('pagehide',()=>{clearInterval(interval);if(activeWorker)activeWorker.terminate();channel?.close()},{once:true});
})();
