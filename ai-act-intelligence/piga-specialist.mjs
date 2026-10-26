/* PIGA AI Act assistant — a public, opt-in UI over the SAME governed server-side
 * PIGA Showroom model route. No API key, user data storage, hidden analytics,
 * legal certification or external effects. All calls are bounded and optional.
 */
const ENDPOINT="https://pigapocket.com/api/piga/assistant/v1/ask";
const HEALTH="https://pigapocket.com/api/piga/assistant/v1/status?app=ai-act";
const ROOT="aiact-piga-specialist";
const BLOCKED=/(?:passwort|kennwort|api.?key|bearer\s|privat(?:er|e|es)?\s+schlüssel|patient(?:en|in)?name|versichertennummer|geburtsdatum|personalausweis|\bIBAN\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i;
const get=id=>document.getElementById(id);
function setStatus(t){const n=get("aiact-piga-status");if(n)n.textContent=t;}
async function bounded(url,opts={},milliseconds=10500){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),milliseconds);
 try { return await fetch(url,{mode:"cors",credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",...opts,signal:controller.signal}); }
 finally { clearTimeout(timer); }
}
const safeHttps=url=>{try{const u=new URL(String(url||""));return u.protocol==="https:"?u.href:null}catch{return null}};
function present(answer,sources){
 const n=get("aiact-piga-answer");if(!n)return;
 n.replaceChildren();const p=document.createElement("p");p.textContent=answer;n.append(p);
 const verified=Array.isArray(sources)?sources.slice(0,6):[];
 const links=verified.map(x=>({url:safeHttps(x?.url),title:String(x?.title||"Quelle").slice(0,120)})).filter(x=>x.url);
 if(links.length){
  const intro=document.createElement("strong");intro.textContent="Mitgelieferte Quellen zur eigenen Prüfung:";n.append(intro);
  const ul=document.createElement("ul");
  for(const x of links){const li=document.createElement("li"),a=document.createElement("a");
   a.href=x.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=x.title;li.append(a);ul.append(li);}
  n.append(ul);
 }
}
let lastAnswer="",busy=false;
function chooseVoice(){
 const all=typeof speechSynthesis!=="undefined"?speechSynthesis.getVoices():[];
 const german=all.filter(x=>String(x.lang||"").toLowerCase().startsWith("de"));
 const female=/\b(?:gacrux|aoede|sulafat|anna|vicki|katja|hedda|petra|marlene|claudia|viktoria|siri)\b/i;
 return german.find(x=>female.test(x.name||""))||german[0]||null;
}
function speech(){
 if(!lastAnswer)return setStatus("Erst nach einer bestätigten Antwort kann PIGA vorlesen.");
 if(typeof window.speechSynthesis==="undefined"||typeof window.SpeechSynthesisUtterance!=="function")
  return setStatus("Sprachausgabe wird auf diesem Gerät nicht unterstützt.");
 try{
  speechSynthesis.cancel();
  const utter=new SpeechSynthesisUtterance(lastAnswer.slice(0,1450));const voice=chooseVoice();
  if(voice)utter.voice=voice;utter.lang=voice?.lang||"de-DE";utter.rate=.87;utter.pitch=1.02;utter.volume=.93;
  speechSynthesis.speak(utter);
  setStatus(voice?"PIGA liest mit einer verfügbaren deutschen Gerätestimme; Klang und Geschlecht hängen vom Gerät ab.":
   "PIGA liest mit der Systemstimme. Keine bestätigte weibliche deutsche Stimme installiert.");
 }catch {setStatus("Die Sprachausgabe konnte nicht gestartet werden.");}
}
async function health(){
 setStatus("Ich prüfe nur die PIGA-Laufzeitfreigabe. Es wird keine KI-Frage gesendet.");
 try{
  const res=await bounded(HEALTH,{method:"GET"},6500),body=await res.json();
  const ready=res.ok&&body?.schema==="piga.shared.voice.v1"&&body.app==="ai-act"&&body.ready===true;
  setStatus(ready?"Zentrale PIGA-KI konfiguriert. Fragen werden nur nach deinem Klick gesendet.":
   "Zentrale PIGA-KI noch nicht freigegeben. Die kostenlose EU-AI-Act-Voranalyse bleibt nutzbar.");
 }catch{setStatus("Die zentrale PIGA-KI ist derzeit nicht erreichbar; die kostenlose Analyse bleibt verfügbar.");}
}
async function ask(event){
 event.preventDefault();
 const input=get("aiact-piga-question"),send=get("aiact-piga-send"),read=get("aiact-piga-read");
 if(!input||!send||busy)return;
 const message=input.value.trim();
 if(message.length<2||message.length>650)return setStatus("Bitte eine Frage mit 2 bis 650 Zeichen eingeben.");
 if(BLOCKED.test(message))return setStatus("Bitte keine personenbezogenen Daten, Zugangsdaten oder private Unterlagen eingeben.");
 busy=true;lastAnswer="";send.disabled=true;read.disabled=true;
 present("PIGA prüft deine Frage …",[]);
 setStatus("Anfrage an die zentrale PIGA-KI – nur nach deiner Zustimmung durch Absenden. Gate 2 bleibt BLOCK.");
 try{
  const res=await bounded(ENDPOINT,{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({app:"ai-act",message,consent:true})},11500);
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data?.status!=="ANSWER"||typeof data.answer!=="string"||
    data.gate2!=="BLOCK"||data.externalEffects!==0){
    present("Noch keine bestätigte PIGA-Antwort verfügbar. Bitte die kostenfreie Voranalyse oder die amtlichen EU-Quellen nutzen.",[]);
    return setStatus("PIGA Gate: "+String(data.reason||"modell_oder_kostenfreigabe_ausstehend").slice(0,130));
  }
  lastAnswer=data.answer.slice(0,2500);present(lastAnswer,data.sources);
  read.disabled=false;
  setStatus("Fachantwort bereit. Ohne gesondert geprüfte Primärquellen kein aktueller Rechts- oder Konformitätsnachweis.");
 }catch{
  present("Keine bestätigte Antwort empfangen. Die kostenfreie Voranalyse bleibt unabhängig verfügbar.",[]);
  setStatus("Verbindung oder Zeitgrenze überschritten. Keine automatische Wiederholung und kein zusätzlicher Modellaufruf.");
 }finally{busy=false;send.disabled=false;}
}
function init(){
 if(!get(ROOT))return;
 get("aiact-piga-form")?.addEventListener("submit",ask);
 get("aiact-piga-check")?.addEventListener("click",health);
 get("aiact-piga-read")?.addEventListener("click",speech);
 window.addEventListener("pagehide",()=>{try{speechSynthesis?.cancel()}catch{}},{once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
