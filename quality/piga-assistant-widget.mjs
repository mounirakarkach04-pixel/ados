// General-purpose optional PIGA assistant. No automatic reads from hosting apps.
const el=document.querySelector("script[data-piga-app]");
const roles={"ados-portal":"showroom","ados-research":"showroom","nadias-bloom":"nadias_bloom","ortho-preview":"ortho","ortho-workspace":"ortho","cancer-research":"cancer","cancer-intake":"cancer","la-preuve":"la_preuve","la-preuve-lab":"la_preuve"};
const id=el?.dataset.pigaApp,profile=roles[id];
const lang=el?.dataset.pigaLang||document.documentElement.lang||"de";
const translated=lang.startsWith("fr")?["Interroger PIGA","Votre question générale","Pas de données privées, médicales ou confidentielles.","Envoyer","Aucune réponse disponible. Fonctions locales intactes."]:lang.startsWith("en")?["Ask PIGA","General question","No private, medical or confidential information.","Send","No answer available. Local features still work."]:["PIGA fragen","Allgemeine Fachfrage","Keine persönlichen, medizinischen oder vertraulichen Daten senden.","Senden","Keine Antwort verfügbar. Die App bleibt nutzbar."];
if(profile){
 const host=document.createElement("details");host.className="piga-common";
 const title=document.createElement("summary");title.textContent=translated[0];host.append(title);
 const form=document.createElement("form"),field=document.createElement("textarea"),hint=document.createElement("p"),status=document.createElement("p"),confirm=document.createElement("input"),send=document.createElement("button"),output=document.createElement("div");
 field.rows=3;field.maxLength=420;field.placeholder=translated[1];field.required=true;
 confirm.type="checkbox";const checkText=document.createElement("label");checkText.append(confirm,document.createTextNode(" "+translated[2]));
 send.type="submit";send.textContent=translated[3];status.role="status";status.textContent=translated[2];output.className="piga-common-answer";
 const speak=document.createElement("button");speak.type="button";speak.textContent="♫ "+translated[0];speak.disabled=true;
 speak.addEventListener("click",()=>{if(!output.textContent||!window.speechSynthesis)return;
  const utter=new SpeechSynthesisUtterance(output.textContent.slice(0,1600));
  const voice=speechSynthesis.getVoices().find(v=>/katja|hedda|anna|vicki|petra|gacrux|sulafat/i.test(v.name)&&v.lang?.startsWith(lang.slice(0,2)));
  if(!voice){status.textContent="Keine eindeutig weibliche Stimme installiert; PIGA bleibt schriftlich.";return;}
  utter.voice=voice;utter.lang=voice.lang;utter.rate=.87;utter.pitch=1;
  speechSynthesis.cancel();speechSynthesis.speak(utter);
 });
 form.append(field,checkText,send,speak);host.append(form,status,output);(document.querySelector('[data-piga-mount]')||document.body).append(host);
 form.addEventListener("submit",async event=>{
  event.preventDefault();if(send.disabled||!confirm.checked)return void(status.textContent=translated[2]);
  const question=field.value.trim();if(question.length<2||question.length>420){status.textContent='Bitte maximal 420 Zeichen für den zentralen PIGA-Dienst eingeben.';return;}
  // Deliberately conservative only. Never claims reliable detection of all personal information.
  if(/(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\b(?:password|passwort|kennwort|api.?key|auth.?token|patientenakte|versichertennummer|iban|medical record|health record|patient record|mot de passe)\b)/i.test(question)){
   status.textContent=translated[2];return;
  }
  confirm.checked=false;send.disabled=true;speak.disabled=true;status.textContent="PIGA …";
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),11000);
  try{
   const r=await fetch("https://pigapocket.com/api/piga/assistant/v1/ask",{method:"POST",headers:{"content-type":"application/json"},credentials:"omit",cache:"no-store",mode:"cors",referrerPolicy:"no-referrer",signal:c.signal,body:JSON.stringify({app:profile,message:question,consent:true})});
   const answer=await r.json();
   if(!r.ok||answer.status!=="ANSWER"||answer.app!==profile||answer.gate2!=="BLOCK"||answer.externalEffects!==0||typeof answer.answer!=="string"||!answer.answer.trim())throw Error("PIGA_NOT_ADMITTED");
   output.textContent=String(answer.answer||"").slice(0,2400);speak.disabled=false;status.textContent=translated[0];
  }catch{output.textContent=translated[4];status.textContent=translated[4]}
  finally{clearTimeout(timer);send.disabled=false}
 });
}
