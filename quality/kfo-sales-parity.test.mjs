import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Source-only contracts: no simulated provider call or real hardware effect counts as LIVE.
const read=p=>fs.readFileSync(p,'utf8');
const root='piga-ortho-3d/';
const sales=read(root+'sales.html'),dashboard=read(root+'dashboard.html'),
      widget=read('quality/piga-assistant-widget.mjs'),
      voice=read(root+'voice.js'),shop=read(root+'kfo-shop-advisor.js'),
      sw=read(root+'sw.js');
new vm.Script(widget,{filename:'piga-assistant-widget.mjs'});
const modules=[
 'dashboard.html','direct.html','studio.html','imaging.html','devices.html',
 'device-hub.html','kfo-atlas.html','piga-voice.html','assist.html','workflow.html',
 'team.html','handoff.html','inventory.html','supply.html','procurement.html',
 'report.html','diagnostics.html','setup.html'
];
for(const name of modules){
 assert(fs.existsSync(root+name),'Missing advertised module '+name);
 assert(sales.includes('href="./'+name+'"'),'Missing HTML deep link '+name);
}
assert.equal(new Set(modules).size,18);
assert(sales.includes('Sechs Einblicke'),'Original six visual panels preserved');
assert(sales.includes('id="funktionen"')&&sales.includes('id="kfo-piga"'));
assert(sales.includes('12.000 €'),'Existing written licensing offer preserved');
assert(sales.includes('data-piga-app="ortho-preview"')&&sales.includes('data-piga-mount'));
assert(dashboard.includes('data-piga-app="ortho-workspace"'));
assert(widget.includes('"ortho-preview":"ortho"')&&widget.includes('"ortho-workspace":"ortho"'));
assert(widget.includes('field.maxLength=420')&&widget.includes('question.length>420'));
assert(widget.includes('confirm.checked=false'),'Require consent for each distinct model turn');
assert(widget.includes('answer.app!==profile'),'Prevent profile mixup in shared server');
assert(widget.includes("Keine eindeutig weibliche Stimme installiert"),'Disclose missing named female browser voice');
assert(widget.includes("data-piga-mount"),'Sales assistant must mount in dedicated content');
assert(voice.includes("app:'ortho',message:q,consent:true"),'Ortho shares server core');
assert(shop.includes("app:'kfo-shop',message:question,consent:true"),'KFO material specialist shares server core');
assert(voice.includes("https://pigapocket.com/api/piga/assistant/v1/ask"));
assert(shop.includes("https://pigapocket.com/api/piga/assistant/v1/ask"));
assert(sw.includes("piga-ortho-v154-android-female-audio-check"),'Versioned offline cache must be refreshed');
assert(!/GEMINI_API_KEY|OPENAI_API_KEY|service_role|AIza[0-9A-Za-z_-]{15,}/.test(sales+widget),'No private provider secret at client');
console.log('PASS KFO HTML/offline parity: 18 real modules, original preview preserved, Showroom specialist profile, opt-in voice, fail-closed effects.');
