'use strict';
/* Read-only shared PIGA assistant readiness, never access provider keys or patient data. */
(()=>{
 const button=document.getElementById('setupCheckAi');
 const output=document.getElementById('setupAiResult');
 const badge=document.getElementById('setupAiBadge');
 if(!button||!output||!badge)return;
 const endpoint='https://pigapocket.com/api/piga/assistant/v1/status?app=ortho';
 let busy=false;
 function show(message,kind){
  output.textContent=message;
  badge.textContent=kind==='good'?'PIGA bereit':kind==='warn'?'Vorbereitung offen':'Nicht erreichbar';
  badge.dataset.state=kind;
 }
 button.addEventListener('click',async()=>{
  if(busy)return;
  busy=true;button.disabled=true;
  output.textContent='Gemeinsame PIGA-Showroom-Verbindung wird geprüft …';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
  try{
   const response=await fetch(endpoint,{
    method:'GET',mode:'cors',credentials:'omit',cache:'no-store',
    headers:{accept:'application/json'},referrerPolicy:'no-referrer',signal:controller.signal
   });
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(data.schema!=='piga.shared.voice.v1'||data.app!=='ortho'){
    show('Der Server antwortet, aber nicht mit dem erwarteten zentralen PIGA-Profil. PIGA bleibt lokal verwendbar.','warn');return;
   }
   if(data.ready===true){
    show('Gemeinsamer PIGA-Status: READY. Das ist nur eine technische Bereitschaftsprüfung; der echte Sprachdialog und eine Kostenfreigabe müssen noch getrennt nachgewiesen werden.','good');
   }else{
    const state=typeof data.state==='string'?data.state:'UNBEKANNT';
    show('Gemeinsame PIGA-KI noch nicht bereit ('+state+'). Kein neuer API-Schlüssel auf dem Handy nötig. Lokale Funktionen bleiben verfügbar.','warn');
   }
  }catch{
   show('Zentraler PIGA-Status derzeit nicht erreichbar. Die lokalen KFO-Funktionen bleiben verfügbar; keine automatische Kostenfreigabe.','error');
  }finally{clearTimeout(timer);busy=false;button.disabled=false}
 });
})();
