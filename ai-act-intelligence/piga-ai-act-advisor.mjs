/**
 * PIGA EU AI Act specialist, same central server-side Showroom model.
 * Public only: never transmits current assessment/report or customer evidence.
 * Requires an explicit click per turn; no background microphone or network request.
 */
const endpoint="https://pigapocket.com/api/piga/assistant/v1/ask";
const statusEndpoint="https://pigapocket.com/api/piga/assistant/v1/status?app=ai-act";
const $=id=>document.getElementById(id);
const forbidden=text=>/(?:\b(?:passwort|api.?key|token|iban|patientenakte|krankenkassennummer|versichertennummer)\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i.test(text);
let lastAnswer="";
async function request(url,options,ms){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
 try{return await fetch(url,{mode:"cors",credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",...options,signal:controller.signal})}
 finally{clearTimeout(timer)}
}
function status(message){const n=$("pigaAdvisorStatus");if(n)n.textContent=String(message);}
function voice(){
 if(!lastAnswer||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return status("Keine Sprachausgabe auf diesem Gerät verfügbar.");
 const utter=new SpeechSynthesisUtterance(lastAnswer.slice(0,1300));
 const voices=speechSynthesis.getVoices()||[];
 const names=/\b(?:gacrux|sulafat|katja|anna|hedda|vicki|viktoria|petra|marlene|helena|lena)\b/i;
 utter.voice=voices.find(x=>/^de(-|_)/i.test(x.lang)&&names.test(x.name))||voices.find(x=>/^de(-|_)/i.test(x.lang))||null;
 utter.lang=utter.voice?.lang||"de-DE";utter.rate=.88;utter.pitch=.96;utter.volume=.91;
 try{speechSynthesis.cancel();speechSynthesis.speak(utter);status("PIGA liest vor. Tatsächlicher Stimmklang hängt von Ihrem Gerät ab.")}
 catch{status("Sprachausgabe momentan nicht verfügbar.")}
}
function init(){
 const form=$("pigaAdvisorForm"),send=$("pigaAdvisorSend"),out=$("pigaAdvisorAnswer"),speak=$("pigaAdvisorSpeak");
 if(!form||!send||!out||!speak)return;
 $("pigaAdvisorStatusCheck")?.addEventListener("click",async()=>{
  status("Prüfe PIGA-Verbindung ohne Modellaufruf.");
  try{const r=await request(statusEndpoint,{method:"GET"},7000),data=await r.json();
   status(r.ok&&data?.schema==="piga.shared.voice.v1"&&data?.ready===true?
     "Die gemeinsame PIGA-KI ist bereit. Die kostenlose Voranalyse bleibt unabhängig verfügbar.":
     "Die zentrale Sprach-KI ist noch nicht freigegeben. EU-AI-Act-Explorer und Voranalyse bleiben unverändert verfügbar.");
  }catch{status("Die zentrale KI ist nicht erreichbar; die Voranalyse bleibt verfügbar.");}
 });
 form.addEventListener("submit",async event=>{
  event.preventDefault();if(send.disabled)return;
  const question=String($("pigaAdvisorQuestion")?.value||"").trim();
  if(question.length<2||question.length>650)return status("Bitte eine Frage mit 2 bis 650 Zeichen eingeben.");
  if(forbidden(question))return status("Keine Zugangsdaten oder personenbezogenen Nachweise in das öffentliche KI-Feld eingeben.");
  send.disabled=true;speak.disabled=true;lastAnswer="";
  status("PIGA prüft Ihre allgemeine Regulierungsfrage. Es werden keine Berichts- oder Kontodaten übermittelt.");
  out.textContent="PIGA bereitet die fachliche Antwort vor …";
  try{
   const r=await request(endpoint,{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({app:"ai-act",message:question,consent:true})},11000);
   const data=await r.json().catch(()=>({}));
   if(!r.ok||data?.status!=="ANSWER"||typeof data.answer!=="string"||
      data.gate2!=="BLOCK"||data.externalEffects!==0){
    out.textContent="Eine verifizierte Modellantwort ist momentan nicht verfügbar. Nutzen Sie den EU-AI-Act-Explorer und die amtlichen Rechtsquellen.";
    status("PIGA: "+String(data.reason||"Provider nicht freigegeben").slice(0,130));return;
   }
   lastAnswer=data.answer.slice(0,2400);out.textContent=lastAnswer;
   const sources=Array.isArray(data.sources)?data.sources.slice(0,5).filter(x=>/^https:\/\//i.test(String(x?.url||""))):[];
   if(sources.length){const list=document.createElement("ul");list.className="piga-advisor-sources";
    for(const item of sources){const link=document.createElement("a");link.href=item.url;link.rel="noopener noreferrer";link.target="_blank";link.textContent=String(item.title||"Quelle").slice(0,100);const li=document.createElement("li");li.append(link);list.append(li);}
    out.append(list);
   }
   speak.disabled=false;status("PIGA-Fachantwort, keine rechtliche Freigabe. Prüfen Sie Rechtsstand und Anwendbarkeit anhand amtlicher Quellen.");
  }catch{out.textContent="Der Modellzugang hat nicht rechtzeitig geantwortet. Der kostenlose Bericht bleibt verfügbar.";status("Zeitgrenze erreicht; keine automatische Wiederholung und keine externe Wirkung.")}
  finally{send.disabled=false;}
 });
 speak.addEventListener("click",voice);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
