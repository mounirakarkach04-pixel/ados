'use strict';
/** PIGA KFO-shop advisor v1.
 * User-triggered, PUBLIC NON-PATIENT questions only. Never upload the local
 * inventory, browsing history, supplier account, prescription or basket.
 * Reuse the server-side governed Showroom provider and female voice persona.
 */
(()=>{
 const $=id=>document.getElementById(id),form=$('kfoAdvisorForm');if(!form)return;
 const status=$('kfoAdvisorStatus'),answer=$('kfoAdvisorAnswer'),send=$('kfoAdvisorSend'),speak=$('kfoAdvisorSpeak');
 const endpoint='https://pigapocket.com/api/piga/assistant/v1/ask';
 const statusEndpoint='https://pigapocket.com/api/piga/assistant/v1/status?app=kfo-shop';
 let currentAnswer='',busy=false;
 const tell=text=>{status.textContent=text;};
 const blocked=text=>/(?:patient(?:in|en)?|geburtsdatum|versichertennummer|rezept|röntgen|diagnose\s+bei|passwort|iban|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i.test(text);
 async function bounded(url,options={},timeout=11500){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{return await fetch(url,{credentials:'omit',mode:'cors',cache:'no-store',referrerPolicy:'no-referrer',...options,signal:controller.signal})}
  finally{clearTimeout(timer)}
 }
 $('kfoAdvisorCheck')?.addEventListener('click',async()=>{
  tell('Prüfe den gemeinsamen PIGA-Showroom-Zugang – keine KI-Frage wird versendet.');
  try{
   const r=await bounded(statusEndpoint,{method:'GET'},7000),j=await r.json();
   tell(r.ok&&j?.schema==='piga.shared.voice.v1'&&j?.ready===true?
    'PIGA Zentrale freigegeben. Für eine Antwort einfach eine allgemeine Materialfrage stellen.':
    'PIGA Zentrale noch nicht freigegeben. Lokale Bestellliste bleibt ohne Cloud-KI verfügbar.');
  }catch{tell('PIGA Zentrale gerade nicht erreichbar. Einkaufsliste und lokaler Bestand funktionieren weiterhin.');}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const question=String($('kfoAdvisorQuestion')?.value||'').trim();
  if(question.length<2||question.length>600){tell('Bitte eine kurze Frage mit höchstens 600 Zeichen eingeben.');return;}
  if(blocked(question)){tell('Bitte keine personenbezogenen Patienten-, Konto- oder Behandlungsdaten senden.');return;}
  busy=true;send.disabled=true;speak.disabled=true;currentAnswer='';
  tell('PIGA prüft deine KFO-Materialfrage. Keine Bestellung wird ausgelöst.');
  answer.textContent='PIGA bereitet die Antwort vor …';
  try{
   const response=await bounded(endpoint,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({app:'kfo-shop',message:question,consent:true})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||data?.status!=='ANSWER'||typeof data.answer!=='string'||data.gate2!=='BLOCK'||data.externalEffects!==0){
    answer.textContent='Aktuell liegt keine bestätigte Modellantwort vor. Prüfe Artikel und Daten direkt beim Lieferanten.';
    tell('PIGA: '+String(data.reason||'Sprach-/Modellzugang momentan nicht verfügbar').slice(0,135));
    return;
   }
   currentAnswer=data.answer.slice(0,2400);
   answer.textContent=currentAnswer;
   tell('Fachantwort aus der PIGA Zentrale. Preise/Verfügbarkeit nur anhand aktueller Lieferantenquellen prüfen. Gate 2: BLOCK.');
   speak.disabled=false;
   const sources=Array.isArray(data.sources)?data.sources.filter(v=>/^https:\/\//.test(String(v?.url||''))).slice(0,4):[];
   if(sources.length){
    const list=document.createElement('ul');list.className='kfo-advisor-sources';
    for(const item of sources){
     const li=document.createElement('li'),a=document.createElement('a');
     a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';
     a.textContent=String(item.title||'Quelle').slice(0,110);li.append(a);list.append(li);
    }
    answer.append(list);
   }
  }catch{
   answer.textContent='Keine bestätigte Antwort. Die lokale Bestellliste bleibt unabhängig verfügbar.';
   tell('Antwortzeit überschritten oder Verbindung unterbrochen; keine automatische Wiederholung.');
  }finally{busy=false;send.disabled=false;}
 });
 speak.addEventListener('click',()=>{
  if(!currentAnswer)return;
  if(!window.PigaVoicePersona?.speak){tell('Auf diesem Gerät ist keine passende Sprachausgabe geladen.');return;}
  window.PigaVoicePersona.speak(currentAnswer,tell);
 });
})();
