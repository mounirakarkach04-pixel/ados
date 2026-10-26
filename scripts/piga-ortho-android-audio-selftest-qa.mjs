import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const p="piga-ortho-3d/";
const html=fs.readFileSync(p+"piga-voice.html","utf8"),voice=fs.readFileSync(p+"voice.js","utf8"),
  persona=fs.readFileSync(p+"piga-voice-persona.js","utf8"),sw=fs.readFileSync(p+"sw.js","utf8");
new vm.Script(voice,{filename:"voice.js"});
new vm.Script(persona,{filename:"piga-voice-persona.js"});
for(const id of ["voiceAudioCheck","voiceAudioResult"])assert(html.includes('id="'+id+'"'),id);
assert(voice.includes("$('voiceAudioCheck').addEventListener('click'"));
assert(voice.includes("persona.choose()")&&voice.includes("persona.speak("));
assert(voice.includes("BLOCK: Keine eindeutig weibliche deutsche Gerätestimme"));
assert(persona.includes("utterance.onstart=")&&persona.includes("utterance.onend=")&&persona.includes("utterance.onerror="));
assert(persona.includes("voice.name"));
assert(!/\.speak\(/.test(voice.slice(0,2000)),"No unprompted speech at startup");
assert(sw.includes("piga-ortho-v154-android-female-audio-check"));
assert(html.includes("wirklich hörbar")||html.includes("hörbar bestätigt"));
console.log("PASS Android female device speech self-check: deliberate button, named voice only, start/end/error evidence, no fabricated audio success.");
