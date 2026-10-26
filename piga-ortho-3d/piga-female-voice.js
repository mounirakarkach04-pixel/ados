'use strict';
/* PIGA voice presentation preset v1. Browser voice gender is NOT machine-readable.
 * Prefer known German feminine voice names; allow explicit selection and honest fallback.
 * One voice instance per turn, no parallel TTS, no silent microphone activation.
 */
(function(){
 const REGISTRY_VERSION='piga-female-voice-v1-20261026';
 const preferred=/\b(?:katja|hedda|vicki|anna|petra|marlene|heike|claudia|cornelia|viktoria|marlene|siri|ingrid|helena|lena|amala|sabine)\b/i;
 const toArray=()=>window.speechSynthesis?window.speechSynthesis.getVoices()||[]:[];
 let userVoiceURI='';
 function choices(){
  const all=toArray(),de=all.filter(v=>/^(de|en)(-|_)/i.test(v.lang));
  const female=de.filter(v=>preferred.test(v.name||''));
  const sorted=[...female,...de.filter(v=>!female.includes(v))];
  return sorted.map(v=>({name:v.name,lang:v.lang,voiceURI:v.voiceURI,preferred:female.includes(v)}));
 }
 function choose(){
  const all=toArray();
  if(userVoiceURI){const found=all.find(v=>v.voiceURI===userVoiceURI);if(found)return {voice:found,verified:false,selection:'manual'};}
  const picks=all.filter(v=>/^de(-|_)/i.test(v.lang)&&preferred.test(v.name||''));
  if(picks.length)return {voice:picks[0],verified:false,selection:'name-based-preference'};
  const de=all.find(v=>/^de(-|_)/i.test(v.lang));
  return {voice:de||null,verified:false,selection:de?'default-german-not-gender-verified':'no-german-voice'};
 }
 function setVoiceURI(uri){userVoiceURI=typeof uri==='string'?uri:'';return status();}
 function status(){
  const c=choose();return {version:REGISTRY_VERSION,preferredGenderPresentation:'female',language:'de-DE',
   rate:0.88,pitch:0.96,available:typeof window.speechSynthesis!=='undefined'&&typeof window.SpeechSynthesisUtterance==='function',
   selectedVoice:c.voice?.name||null,selection:c.selection,genderVerified:false,
   explanation:c.selection==='name-based-preference'?'Weibliche Stimme anhand des Namens bevorzugt; Klang hängt vom Gerät ab.':
    c.selection==='manual'?'Vom Nutzer ausgewählte Systemstimme; kein verlässliches Geschlechtsmerkmal vorhanden.':
    'Keine eindeutig benannte weibliche Stimme erkannt. Bitte in den Systemeinstellungen zusätzliche Stimmen installieren oder eine Stimme auswählen.'};
 }
 function speak(text){
  const st=status();if(!st.available)return {started:false,reason:'browser_tts_unavailable'};
  const utter=new SpeechSynthesisUtterance(String(text||'').slice(0,1800));
  const selected=choose();if(selected.voice)utter.voice=selected.voice;
  utter.lang=selected.voice?.lang||'de-DE';
  utter.rate=.88;utter.pitch=.96;utter.volume=.91;
  try{speechSynthesis.cancel();speechSynthesis.speak(utter);return {started:true,...st}}
  catch{return {started:false,reason:'browser_tts_failed',...st}}
 }
 window.PigaFemaleVoice=Object.freeze({version:REGISTRY_VERSION,choices,status,setVoiceURI,speak});
})();
