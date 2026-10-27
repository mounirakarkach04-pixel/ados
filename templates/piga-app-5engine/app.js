"use strict";
(()=>{const form=document.getElementById("form"),input=document.getElementById("task"),out=document.getElementById("receipt"),status=document.getElementById("status");
form.addEventListener("submit",event=>{event.preventDefault();const q=input.value.trim();
 if(q.length<2||q.length>420){status.textContent="Gate 1: DELAY · Eingabe ungültig";return;}
 const privateRisk=/(patient(?:en|in)?|versichertennummer|geburtsdatum|iban|rezept|diagnos(?:e|tiz))/i.test(q);
 const receipt={schema:"piga.app.local-evidence.v1",at:new Date().toISOString(),engines:["intake","queue","govern","evidence","decision"],scope:"public-source-only",
 a7sem:{observation:"user-initiated form submit",privateRisk},gate1:privateRisk?"BLOCK":"ALLOW_LOCAL_EXPLANATION_ONLY",gate2:"BLOCK",externalEffects:0,
 a7semReverse:"PASS_NO_EFFECT",answer:privateRisk?"Keine privaten oder klinischen Daten hier eingeben.":"Als lokaler Vorschlag notiert; keine externe Aktion ausgelöst."};
 status.textContent="Gate 1: "+receipt.gate1+" · Gate 2: BLOCK";out.textContent=JSON.stringify(receipt,null,2);
});})();
