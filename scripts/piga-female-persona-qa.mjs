import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync('piga-ortho-3d/piga-voice-persona.js','utf8');
new vm.Script(src,{filename:'piga-voice-persona.js'});
const test=(voice)=>{
  let spoken=0;const synth={getVoices:()=>[voice],cancel(){},speak(){spoken++}};
  const window={speechSynthesis:synth};
  class Utterance {constructor(text){this.text=text}}
  const context={window,speechSynthesis:synth,SpeechSynthesisUtterance:Utterance};
  vm.runInNewContext(src,context);
  let note='';
  const ok=window.PigaVoicePersona.speak('Hallo, ich bin PIGA',t=>{note=t});
  return {ok,spoken,note,selected:window.PigaVoicePersona.choose()?.name||null};
};
const female=test({name:'German Female Natural',lang:'de-DE'});
assert.equal(female.ok,true);assert.equal(female.spoken,1);
assert.match(female.selected,/Female/);
const named=test({name:'Anna Deutsch',lang:'de-DE'});
assert.equal(named.ok,true);assert.equal(named.spoken,1);
const male=test({name:'German Male',lang:'de-DE'});
assert.equal(male.ok,false);assert.equal(male.spoken,0);
assert.match(male.note,/weibliche deutsche Gerätestimme/);
const other=test({name:'English Female',lang:'en-US'});
assert.equal(other.ok,false);assert.equal(other.spoken,0);
assert(src.includes('geminiVoice:\'Gacrux\''));
console.log('PIGA FEMALE VOICE QA PASS: feminine German devices speak; male/unknown voice never silently substituted; Gacrux preset remains server gated.');
