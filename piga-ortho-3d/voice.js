'use strict';
/* PIGA KEYLESS LOCAL MODEL ADMISSION v1
 * No secret, Google session scraping, clinical records or silent model download.
 * Chrome built-in LanguageModel where permitted, WebLLM WebGPU after click,
 * finite local PIGA route when no model is available.
 */
(()=>{
 const $=id=>document.getElementById(id),A=(id,value)=>{const n=$(id);if(n)n.textContent=value};
 const localModel='SmolLM2-360M-Instruct-q4f32_1-MLC';
 const library='https://esm.run/@mlc-ai/web-llm@0.2.86';
 const context='Du bist PIGA, ein freundlicher technischer KFO-Praxisassistent. Antworte in der Sprache der Frage, bevorzugt Deutsch. Gib Unsicherheit ehrlich an. Erfinde keine rechtlichen oder medizinischen Diagnosen, Preise, Integrationen oder Live-Daten. Nie eigenmächtig Bestellungen, Medikamente, Patientenbehandlungen, Rechnungen oder Hardwareaktionen genehmigen. PIGA Gate 2 BLOCK für reale Effekte. Beschränke dich auf Orientierung und technische Lernhilfe.';
 let capability='unavailable',engine=null,modelType='rule',busy=false,lastAnswer='',recognizer=null,history=[];
 let showroomReady=false,showroomEnabled=false;
 const SHOWROOM_STATUS='https://pigapocket.com/piga-ortho-3d/ai/status';
 const SHOWROOM_ASK='https://pigapocket.com/piga-ortho-3d/ai/ask';
 const showroomState=text=>A('voiceShowroomState',text);
 async function checkShowroom(){
  showroomState('Prüfe das vorhandene PIGA-Cloudflare-AI-Binding …');
  $('voiceShowroomCheck').disabled=true;
  const stop=new AbortController(),timer=setTimeout(()=>stop.abort(),7000);
  try{
   const response=await fetch(SHOWROOM_STATUS,{method:'GET',credentials:'omit',mode:'cors',
    cache:'no-store',referrerPolicy:'no-referrer',signal:stop.signal});
   const data=await response.json();
   showroomReady=response.ok&&data?.schema==='piga-ortho-ai-status.v1'&&data?.keylessVoiceRouteReady===true;
   $('voiceShowroomEnable').disabled=!showroomReady;
   showroomState(showroomReady?
    'Der bestehende Cloudflare-Worker ist für begrenzte, governede Fragen bereit. Keine Gemini-Schlüssel auf dem Gerät nötig.':
    data?.showroomWorkersAIConfigured?
      'Das vorhandene Workers-AI-Binding ist erkannt. Die Betreiberfreigabe für den Ortho-Antwortweg fehlt noch. PIGA bleibt lokal nutzbar.':
      'Showroom-KI ist für PIGA ORTHO noch nicht serverseitig freigegeben. PIGA bleibt lokal nutzbar.');
  }catch{
   showroomReady=false;$('voiceShowroomEnable').disabled=true;
   showroomState('Cloudflare-Ortho-Status derzeit nicht erreichbar. Die lokale PIGA-Sprach-KI bleibt unabhängig verfügbar.');
  }finally{clearTimeout(timer);$('voiceShowroomCheck').disabled=false;}
 }
 $('voiceShowroomCheck').addEventListener('click',()=>{void checkShowroom()});
 $('voiceShowroomEnable').addEventListener('click',()=>{
  if(!showroomReady)return;showroomEnabled=true;
  $('voiceShowroomEnable').disabled=true;$('voiceShowroomDisable').disabled=false;
  A('voiceAnswerState','Showroom-KI');showroomState('Cloudflare-Workers-AI-Antwortweg ausgewählt. Keine Patientendaten oder Praxisaktionen.');
 });
 $('voiceShowroomDisable').addEventListener('click',()=>{
  showroomEnabled=false;$('voiceShowroomDisable').disabled=true;
  $('voiceShowroomEnable').disabled=!showroomReady;
  A('voiceAnswerState',engine?'Lokales Modell':'Lokales Wissen');
  showroomState('Showroom-KI deaktiviert. Das Gerät verwendet wieder den lokalen PIGA-Antwortweg.');
 });
 async function showroomAsk(q){
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),11000);
  try{
   const response=await fetch(SHOWROOM_ASK,{method:'POST',credentials:'omit',mode:'cors',cache:'no-store',
    headers:{'content-type':'application/json'},referrerPolicy:'no-referrer',
    body:JSON.stringify({message:q}),signal:abort.signal});
   const data=await response.json();
   if(!response.ok||data?.status!=='ANSWER'||typeof data.answer!=='string')throw Error(String(data.reason||'Governance / Anbieter nicht bereit'));
   if(data.gate2!=='BLOCK'||data.externalEffects!==0)throw Error('Unerwartete PIGA-Action-Admission');
   return {text:data.answer.slice(0,2300),mode:'PIGA Showroom · '+String(data.model||'Workers AI').slice(0,60)+' · A7SEM Reverse'};
  }finally{clearTimeout(timer);}
 }

 const messages=(role,content)=>({role,content:String(content).slice(0,1300)});
 function append(role,text,mode){
  const node=document.createElement('div');node.className='voice-bubble '+(role==='user'?'user':'piga');
  node.textContent=String(text).slice(0,3000);
  if(mode){const meta=document.createElement('small');meta.textContent=mode;node.append(meta);}
  $('voiceFeed').append(node);$('voiceFeed').scrollTop=$('voiceFeed').scrollHeight;
 }
 const availability=async()=>{
  let builtin='unavailable';
  if(typeof window.LanguageModel?.availability==='function'){
   try{builtin=await window.LanguageModel.availability()}catch{}
  }
  if(['available','downloadable','downloading'].includes(builtin))return {mode:'builtin',availability:builtin};
  if(navigator.gpu?.requestAdapter){
   try{
    const adapter=await navigator.gpu.requestAdapter({powerPreference:'low-power'});
    if(adapter&&Number(adapter.limits?.maxStorageBufferBindingSize||0)>=64*1024*1024)
     return {mode:'webgpu',availability:'downloadable'};
    if(adapter)return {mode:'webgpu',availability:'downloadable'};
   }catch{}
  }
  return {mode:'rule',availability:'unavailable'};
 };
 async function check(){
  A('voiceCapability','Prüfe den lokalen Modellzugang auf diesem Gerät …');
  const result=await availability();capability=result.mode;
  const state=result.mode==='builtin'?'Browser-Modell '+result.availability:
   result.mode==='webgpu'?'WebGPU verfügbar · Download möglich':'Kein unterstütztes lokales Sprachmodell';
  A('voiceModelState',engine?'Modell bereit':state);
  A('voiceCapability',result.mode==='rule'?
   'Dieses Gerät bietet momentan kein unterstütztes lokales Sprachmodell. PIGA-Wissensfunktionen bleiben verfügbar. Gemini kann später über einen offiziellen PIGA-Proxy angebunden werden.':
   result.mode==='builtin'?'Der Browser bietet ein lokales Sprachmodell. Es wird erst nach Zustimmung aktiviert.':
   'Ein lokales WebGPU-Sprachmodell kann nach deinem Klick heruntergeladen werden. Je nach Gerät kann der Start wegen Speicher-/GPU-Grenzen scheitern.');
  $('voiceLoad').disabled=capability==='rule'||!!engine||busy;
  return result;
 }
 const pct=value=>{
  const p=Math.max(0,Math.min(100,Number(value)||0));
  $('voiceProgress').style.width=p+'%';
  document.querySelector('.voice-progress')?.setAttribute('aria-valuenow',String(Math.round(p)));
 };
 async function activate(){
  if(busy||engine||capability==='rule')return;
  busy=true;$('voiceLoad').disabled=true;
  A('voiceCapability','Lade lokales Modell nur auf diesem Gerät …');pct(0);
  try{
   if(capability==='builtin'){
    if(!window.LanguageModel?.create)throw Error('Browser-Modell ist nicht verfügbar');
    engine=await window.LanguageModel.create({
     initialPrompts:[{role:'system',content:context}],
     monitor:monitor=>monitor.addEventListener?.('downloadprogress',event=>pct(event.loaded*100))
    });
    modelType='builtin';pct(100);
   }else{
    if(!navigator.onLine)throw Error('Der erste Modelldownload erfordert eine Internetverbindung');
    // User explicitly consented. The library downloads only public model weights,
    // never patient data nor a Google login/session or API key.
    const webllm=await import(library);
    if(!webllm?.CreateMLCEngine)throw Error('WebLLM Engine nicht geladen');
    engine=await webllm.CreateMLCEngine(localModel,{
     initProgressCallback:data=>{pct((data.progress||0)*100);
       A('voiceCapability',String(data.text||'Lokales Modell laden').slice(0,160));}
    });
    modelType='webgpu';pct(100);
   }
   A('voiceModelState','Lokales KI-Modell bereit');
   A('voiceCapability','Generatives Sprachmodell ist nun auf diesem Gerät geladen. Es darf nur Text antworten; keine externen PIGA-Aktionen.');
   $('voiceStop').disabled=false;A('voiceAnswerState','Lokales Modell');
  }catch(error){
   engine=null;modelType='rule';pct(0);
   A('voiceModelState','Nur PIGA-Fachwissen');
   A('voiceCapability','Lokales Modell konnte nicht gestartet werden: '+String(error?.message||error).slice(0,180)+'. Der lokale PIGA-Assistent bleibt nutzbar.');
   $('voiceLoad').disabled=false;
  }finally{busy=false;}
 }
 async function answer(q){
  const sensitive=/(patient(?:in|en)?|geburtsdatum|versichertennummer|diagnose.*patient|rezept|antibiotika|behandlung.*durchführen)/i.test(q);
  if(showroomEnabled&&!sensitive){
   try{return await showroomAsk(q);}
   catch(error){
    showroomState('Showroom-Antwort gerade nicht verfügbar ('+String(error?.message||error).slice(0,95)+'). Fallback auf das Gerät.');
    // Never replay or resend the same query without user action.
   }
  }
  if(engine&&!sensitive){
   if(modelType==='builtin'){
    const response=await engine.prompt(q);return {text:String(response).slice(0,3000),mode:'Lokales Browser-Sprachmodell · generativ'};
   }
   const turns=[messages('system',context),...history.slice(-6),messages('user',q)];
   const result=await engine.chat.completions.create({messages:turns,temperature:0.35,max_tokens:350});
   const text=String(result.choices?.[0]?.message?.content||'').slice(0,3000);
   if(!text)throw Error('Modell hat keine Antwort zurückgegeben');
   history.push(messages('user',q),messages('assistant',text));
   history=history.slice(-8);
   return {text,mode:'WebGPU · SmolLM2-360M · generativ lokal'};
  }
  if(sensitive)return {text:'Bitte keine echten Patienten- oder Gesundheitsdaten eingeben. Medizinische Handlungen benötigen eine ärztliche Prüfung und einen geschützten Praxiszugang. Für allgemeine KFO-Fachthemen steht der Fachatlas zur Verfügung.',mode:'PIGA Gate 1 DELAY · Gate 2 BLOCK'};
  const r=window.PigaBrain?.answer?.(q,'staff');
  return {text:r?.reply||'Lokales Sprachmodell ist nicht installiert. Öffne den KFO-Fachatlas oder lade ein Modell nach deiner Zustimmung.',mode:'Lokales Fachwissen · regelbasiert'};
 }
 $('voiceForm').addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;
  const input=$('voiceInput'),q=input.value.trim();
  if(!q)return;input.value='';append('user',q);busy=true;$('voiceSend').disabled=true;
  A('voiceStatus',engine?'Das lokale Modell verarbeitet deine Frage …':'Lokales PIGA-Wissen wird geprüft …');
  try{
   const out=await answer(q);
   lastAnswer=out.text;append('piga',out.text,out.mode);
   A('voiceStatus','Antwort: '+out.mode+' · keine externen Praxisaktionen');
  }catch(error){
   const fallback=window.PigaBrain?.answer?.(q,'staff');
   lastAnswer=fallback?.reply||'Die lokale Modellantwort ist fehlgeschlagen. Bitte erneut versuchen.';
   append('piga',lastAnswer,'Technischer Fallback · keine externe Aktion');
   A('voiceStatus','Lokaler Modellfehler; reguläres PIGA-Fachwissen verfügbar.');
  }finally{busy=false;$('voiceSend').disabled=false;}
 });
 $('voiceCheck').addEventListener('click',()=>{void check()});
 $('voiceLoad').addEventListener('click',()=>{void activate()});
 $('voiceStop').addEventListener('click',async()=>{
  try{engine?.unload?.();engine?.destroy?.()}catch{}engine=null;
  history=[];modelType='rule';pct(0);$('voiceStop').disabled=true;
  A('voiceAnswerState','Fachwissen');await check();
 });
 $('voiceClear').addEventListener('click',()=>{
  history=[];lastAnswer='';$('voiceFeed').replaceChildren();
  append('piga','Der Chatverlauf ist aus dieser Sitzung gelöscht. Keine Server-Speicherung.','PIGA lokal');
 });
 $('voiceListen').addEventListener('click',()=>{
  const NativeSpeech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!NativeSpeech){A('voiceMicState','Hier nicht verfügbar');return;}
  if(recognizer){try{recognizer.stop()}catch{}return;}
  recognizer=new NativeSpeech();recognizer.lang='de-DE';recognizer.interimResults=false;recognizer.continuous=false;
  recognizer.onresult=event=>{$('voiceInput').value=String(event.results?.[0]?.[0]?.transcript||'').slice(0,650);};
  recognizer.onend=()=>{recognizer=null;A('voiceMicState','Beendet')};
  recognizer.onerror=()=>{recognizer=null;A('voiceMicState','Nicht verfügbar')};
  A('voiceMicState','Mikrofon aktiv · Browserdienst möglicherweise online');
  try{recognizer.start()}catch{recognizer=null;A('voiceMicState','Nicht verfügbar')}
 });
 $('voiceSpeak').addEventListener('click',()=>{
  if(!lastAnswer){A('voiceStatus','Noch keine PIGA-Antwort vorhanden.');return;}
  if(!window.speechSynthesis){A('voiceStatus','Gerätestimme nicht verfügbar.');return;}
  speechSynthesis.cancel();
  const spoken=new SpeechSynthesisUtterance(lastAnswer.slice(0,1200));
  spoken.lang='de-DE';spoken.rate=.98;
  speechSynthesis.speak(spoken);
 });
 window.addEventListener('pagehide',()=>{try{recognizer?.stop();speechSynthesis?.cancel()}catch{}});
 void check();
 // No implicit network connection or model download on app boot.
})();
