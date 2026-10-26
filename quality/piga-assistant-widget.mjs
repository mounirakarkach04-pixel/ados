// General-purpose optional PIGA assistant. No automatic reads from hosting apps.
const el=document.querySelector("script[data-piga-app]");
const roles={"ados-portal":"research","ados-research":"research","nadias-bloom":"wellbeing","ortho-preview":"ortho-practice","ortho-workspace":"ortho-practice","cancer-research":"research","cancer-intake":"research","la-preuve":"research","la-preuve-lab":"research"};
const id=el?.dataset.pigaApp,profile=roles[id];
const lang=el?.dataset.pigaLang||document.documentElement.lang||"de";
const translated=lang.startsWith("fr")?["Interroger PIGA","Votre question générale","Pas de données privées, médicales ou confidentielles.","Envoyer","Aucune réponse disponible. Fonctions locales intactes."]:lang.startsWith("en")?["Ask PIGA","General question","No private, medical or confidential information.","Send","No answer available. Local features still work."]:["PIGA fragen","Allgemeine Fachfrage","Keine persönlichen, medizinischen oder vertraulichen Daten senden.","Senden","Keine Antwort verfügbar. Die App bleibt nutzbar."];
if(profile){
 const host=document.createElement("details");host.className="piga-common";
 const title=document.createElement("summary");title.textContent=translated[0];host.append(title);
 const form=document.createElement("form"),field=document.createElement("textarea"),hint=document.createElement("p"),status=document.createElement("p"),confirm=document.createElement("input"),send=document.createElement("button"),output=document.createElement("div");
 field.rows=3;field.maxLength=650;field.placeholder=translated[1];field.required=true;
 confirm.type="checkbox";const checkText=document.createElement("label");checkText.append(confirm,document.createTextNode(" "+translated[2]));
 send.type="submit";send.textContent=translated[3];status.role="status";status.textContent=translated[2];output.className="piga-common-answer";
 form.append(field,checkText,send);host.append(form,status,output);document.body.append(host);
 form.addEventListener("submit",async event=>{
  event.preventDefault();if(send.disabled||!confirm.checked)return void(status.textContent=translated[2]);
  const question=field.value.trim();if(question.length<2||question.length>650)return;
  send.disabled=true;status.textContent="PIGA …";
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),11000);
  try{
   const r=await fetch("https://pigapocket.com/api/piga/assistant/v1/ask",{method:"POST",headers:{"content-type":"application/json"},credentials:"omit",cache:"no-store",mode:"cors",referrerPolicy:"no-referrer",signal:c.signal,body:JSON.stringify({app:profile,message:question,consent:true})});
   const answer=await r.json();
   if(!r.ok||answer.status!=="ANSWER"||answer.gate2!=="BLOCK"||answer.externalEffects!==0)throw Error("PIGA_NOT_ADMITTED");
   output.textContent=String(answer.answer||"").slice(0,2400);status.textContent=translated[0];
  }catch{output.textContent=translated[4];status.textContent=translated[4]}
  finally{clearTimeout(timer);send.disabled=false}
 });
}
