import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const f=name=>readFileSync("piga-ortho-3d/"+name,"utf8");
const shop=f("supply.html"),logic=f("kfo-shop-advisor.js"),voice=f("voice.js"),
 persona=f("piga-voice-persona.js"),sw=f("sw.js"),styles=f("supply.css"),voicePage=f("piga-voice.html");
for(const [name,s] of [["KFO advisor",logic],["KFO voice",voice],["canonical voice persona",persona]]){
 new vm.Script(s,{filename:name});
}
assert.match(shop,/id="kfoAdvisorForm"/);
for(const id of ["kfoAdvisorQuestion","kfoAdvisorCheck","kfoAdvisorSend","kfoAdvisorSpeak","kfoAdvisorAnswer","kfoAdvisorStatus"])
 assert.ok(shop.includes('id="'+id+'"'),"missing "+id);
assert.match(shop,/connect-src 'self' https:\/\/pigapocket\.com/);
assert.match(shop,/piga-voice-persona\.js/);
assert.match(shop,/kfo-shop-advisor\.js/);
assert.match(logic,/app:'kfo-shop',message:question,consent:true/);
assert.match(logic,/credentials:'omit'/);
assert.match(logic,/data\.gate2!=='BLOCK'/);
assert.match(logic,/data\.externalEffects!==0/);
assert.match(logic,/patient/);
assert.match(logic,/currentAnswer=data\.answer\.slice/);
assert.match(logic,/answer\.textContent=currentAnswer/);
assert.doesNotMatch(logic,/innerHTML\s*=/);
assert.doesNotMatch(logic,/localStorage|sessionStorage|supplyBasket|supplyNeeds|supplyItems/);
assert.match(logic,/AbortController/);
assert.match(logic,/window\.PigaVoicePersona\.speak/);
assert.match(voice,/app:'ortho',message:q,consent:true/);
assert.match(voicePage,/piga-voice-persona\.js/);
assert.match(persona,/geminiVoice:'Gacrux'/);
assert.match(persona,/rate:0\.87/);
assert.match(sw,/piga-ortho-v153-kfo-html-parity-shared-showroom/);
assert.match(sw,/kfo-shop-advisor\.js/);
assert.match(sw,/piga-voice-persona\.js/);
assert.match(styles,/@media\(max-width:480px\)/);
const protectedPaths=shop.match(/connect-src[^;]+/g)||[];
assert.equal(protectedPaths.length,1);
console.log("PASS PIGA KFO shop and showroom shared assistant public UI contracts (26 assertions)");
