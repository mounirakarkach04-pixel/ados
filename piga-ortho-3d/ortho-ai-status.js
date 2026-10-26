'use strict';
/* Read-only proxy status on explicit user click. No user/patient data, key or secret transferred. */
(()=>{
 const button=document.getElementById('setupCheckAi');
 const output=document.getElementById('setupAiResult');
 const badge=document.getElementById('setupAiBadge');
 if(!button||!output||!badge)return;
 const endpoint='https://pigapocket.com/piga-ortho-3d/ai/status';
 let busy=false;
 function show(message,kind){
  output.textContent=message;
  badge.textContent=kind==='good'?'Server vorbereitet':kind==='warn'?'Einrichtung nötig':'Nicht erreichbar';
  badge.dataset.state=kind;
 }
 button.addEventListener('click',async()=>{
  if(busy)return;busy=true;button.disabled=true;
  output.textContent='Sichere Serververbindung wird geprüft …';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6500);
  try{
   const response=await fetch(endpoint,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',
     headers:{'accept':'application/json'},referrerPolicy:'no-referrer',signal:controller.signal});
   if(!response.ok)throw Error('Der Server meldet HTTP '+response.status);
   const data=await response.json();
   if(data.schema!=='piga-ortho-ai-status.v1')throw Error('Noch kein gültiger PIGA-Ortho-Proxy-Status');
   if(data.keylessVoiceRouteReady===true){
    show('PIGA Showroom-Sprach-KI ist über das vorhandene Cloudflare-AI-Binding vorbereitet. Kein Gemini-Schlüssel auf diesem Gerät nötig. Öffne PIGA Sprach-KI für Fragen.','good');
   }else if(data.showroomWorkersAIConfigured===true){
    show('Das bestehende Cloudflare-AI-Binding ist gefunden. Für den begrenzten Ortho-Sprachpfad fehlt noch die Betreiberfreigabe; lokal kannst du PIGA schon verwenden.','warn');
   }else if(!data.providerSecretConfigured){
    show('Der PIGA-Server ist vorhanden, aber der Betreiber muss einen neuen Schlüssel im geschützten Cloudflare-Secret GEMINI_API_KEY hinterlegen. Die App selbst braucht keinen Schlüssel.','warn');
   }else if(!data.operatorCostApproval||!data.featureReleaseConfigured){
    show('Server-Schlüssel ist hinterlegt. Kostenfreigabe oder geschützter Produktzugang fehlen noch. PIGA funktioniert weiterhin lokal.','warn');
   }else if(!data.userVerified||!data.tenantEntitlementVerified){
    show('Serverkonfiguration vorhanden. Eine verifizierte Praxisidentität und Berechtigung sind vor dem Online-Chat noch erforderlich.','warn');
   }else{
    show('Die KI-Verbindung ist vorbereitet; ein echter Chat-Test ist noch erforderlich.','good');
   }
  }catch(error){
   show('Der Proxy konnte noch nicht erreicht werden. Der lokale PIGA-Assistent funktioniert trotzdem. Betreiber: Cloudflare-Deployment und Domain-Verbindung prüfen.','error');
  }finally{clearTimeout(timer);busy=false;button.disabled=false;}
 });
})();
