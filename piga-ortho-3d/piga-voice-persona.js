'use strict';
/** PIGA voice standard 2026: warm, calm, adult, feminine.
 * Gemini Live/TTS model voice: Gacrux (female/mature). Alternative Sulafat (warm).
 * Browser speechSynthesis availability/voice gender is not guaranteed by OS.
 */
(()=>{
 const PROFILE=Object.freeze({id:'piga.voice.persona.v1',name:'PIGA',language:'de-DE',
  geminiVoice:'Gacrux',alternative:'Sulafat',character:'erwachsen, ruhig, warm, freundlich, klug',
  rate:0.87,pitch:1.02,volume:0.93});
 let available=[];
 const normalized=x=>String(x||'').toLocaleLowerCase('de-DE');
 const isGerman=v=>normalized(v.lang).startsWith('de');
 const choose=()=>{
  if(!('speechSynthesis' in window))return null;
  try{available=speechSynthesis.getVoices()||[]}catch{return null}
  const voices=available.filter(isGerman);
  const preferred=['gacrux','sulafat','anna','hed da','hedda','katja','petra','marlene','vicki','victoria','female','frau','woman'];
  const excluded=['male','mann','thomas','stefan','markus','charon','puck','or us','orus'];
  const plausible=voices.filter(v=>!excluded.some(x=>normalized(v.name).includes(x)));
  const matched=plausible.find(v=>preferred.some(x=>normalized(v.name).includes(x)));
  return matched||null;
 };
 function speak(text,onStatus){
  if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){
   onStatus?.('Gerätesprachausgabe nicht verfügbar.');return false;
  }
  const message=String(text||'').trim().slice(0,1800);
  if(!message){onStatus?.('Noch keine Antwort zum Vorlesen.');return false}
  try{
   speechSynthesis.cancel();
   const voice=choose(),utterance=new SpeechSynthesisUtterance(message);
   utterance.lang=PROFILE.language;utterance.rate=PROFILE.rate;
   utterance.pitch=PROFILE.pitch;utterance.volume=PROFILE.volume;
   if(voice)utterance.voice=voice;
   else onStatus?.('Keine eindeutig weibliche deutsche Gerätestimme erkannt. Vorlesen über Systemstandard; Gacrux steht bei freigegebener Gemini-TTS zur Verfügung.');
   utterance.onerror=()=>onStatus?.('Sprachausgabe nicht abgeschlossen.');
   speechSynthesis.speak(utterance);
   return true;
  }catch{onStatus?.('Sprachausgabe auf diesem Gerät nicht verfügbar.');return false}
 }
 window.PigaVoicePersona=Object.freeze({profile:PROFILE,speak,choose,stop:()=>{try{speechSynthesis.cancel()}catch{}}});
})();
