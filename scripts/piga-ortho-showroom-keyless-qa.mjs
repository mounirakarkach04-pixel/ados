import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const dir='piga-ortho-3d/';
const read=name=>fs.readFileSync(dir+name,'utf8');
const html=read('piga-voice.html'),voice=read('voice.js'),status=read('ortho-ai-status.js'),sw=read('sw.js'),persona=read('piga-voice-persona.js');
for(const [path,code] of [['voice.js',voice],['ortho-ai-status.js',status],['piga-voice-persona.js',persona]])new vm.Script(code,{filename:path});
for(const id of ['voiceShowroomCheck','voiceShowroomEnable','voiceShowroomDisable','voiceShowroomState'])
 assert.ok(html.includes('id="'+id+'"'),'voice element '+id);
assert.match(html,/connect-src 'self' https:\/\/pigapocket\.com/);
assert.match(html,/src="\.\/piga-voice-persona\.js"/);
assert.match(voice,/https:\/\/pigapocket\.com\/api\/piga\/assistant\/v1\/ask/);
assert.match(voice,/https:\/\/pigapocket\.com\/api\/piga\/assistant\/v1\/status\?app=ortho/);
assert.ok(voice.includes("app:'ortho',message:q,consent:true"),'explicit send consent');
assert.ok(voice.includes("credentials:'omit'"),'no credential or cookie upload');
assert.ok(voice.includes('if(showroomEnabled&&!sensitive)'),'opt-in and patient guard');
assert.ok(voice.includes("data.gate2!=='BLOCK'"),'action gate must stay blocked');
assert.ok(voice.includes("window.LanguageModel?.availability"),'local fallback intact');
assert.ok(!/localStorage|AIza[0-9A-Za-z_-]+/.test(voice),'no key or conversation storage');
for(const file of ['piga-voice.html','voice.js','piga-voice-persona.js','kfo-shop-advisor.js'])
 assert.ok(sw.includes("'./"+file+"'"),'missing SW asset '+file);
assert.match(sw,/piga-ortho-v152-unified-female-kfo-advisor/);
assert.match(read('setup.html'),/href="\.\/piga-voice\.html"/);
assert.match(status,/keylessVoiceRouteReady/);
assert.ok(persona.includes("geminiVoice:'Gacrux'"));
assert.ok(persona.includes('rate:0.87'));
console.log('PASS legacy KFO voice + shared server + female persona + offline checks');
