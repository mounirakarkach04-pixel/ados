import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Source-only contracts. This public marketing preview MUST NOT expose clinic records,
// a direct unrestricted clinical workflow or unverified external provider/device effects.
const read=p=>fs.readFileSync(p,'utf8');
const root='piga-ortho-3d/';
const sales=read(root+'sales.html'),dashboard=read(root+'dashboard.html'),
      navigation=read(root+'navigation.js'),portal=read(root+'portal.html'),
      widget=read('quality/piga-assistant-widget.mjs'),
      voice=read(root+'voice.js'),shop=read(root+'kfo-shop-advisor.js'),sw=read(root+'sw.js');
new vm.Script(widget,{filename:'piga-assistant-widget.mjs'});
const modules=[
 'dashboard.html','direct.html','studio.html','imaging.html','devices.html',
 'device-hub.html','kfo-atlas.html','piga-voice.html','assist.html','workflow.html',
 'team.html','handoff.html','inventory.html','supply.html','procurement.html',
 'report.html','diagnostics.html','setup.html'
];
assert.equal(new Set(modules).size,18);
for(const name of modules){
 assert(fs.existsSync(root+name),'Missing advertised module '+name);
 assert(navigation.includes("href:'./"+name),'Module missing from governed navigation '+name);
}
assert(navigation.includes("href:'./portal.html'"),'Protected login entry must be discoverable');
assert(portal.includes('./portal-stability.js')&&portal.includes('./access-core.js'),'Authenticated portal must load safety modules');
assert(sales.includes('Sechs Einblicke'),'Six editorial previews retained');
assert(sales.includes('id="funktionen"')&&sales.includes('id="kfo-piga"'),'Sales topics preserved');
assert(sales.includes('Preis auf Anfrage')||sales.includes('12.000 €'),'Written licensing position preserved');
assert(sales.includes('data-piga-mount'),'Public assistant mount retained');
assert(sales.includes('Kein Zugang zu Praxisfunktionen'),'Public marketing page must not claim clinical access');
assert(!sales.includes('href="./direct.html"')&&!sales.includes('href="./imaging.html"'),
 'Public marketing page must not bypass clinical workspace presentation');
assert(dashboard.includes('data-piga-app="ortho-workspace"'));
assert(widget.includes('"ortho-preview":"ortho"')&&widget.includes('"ortho-workspace":"ortho"'));
assert(widget.includes('field.maxLength=420')&&widget.includes('question.length>420'));
assert(widget.includes('confirm.checked=false'),'Per-turn consent remains mandatory');
assert(widget.includes('answer.app!==profile'),'Isolate assistant profiles');
assert(widget.includes('Keine eindeutig weibliche Stimme installiert'),'Missing voice is disclosed');
assert(voice.includes("app:'ortho',message:q,consent:true"),'Ortho shares governed assistant endpoint');
assert(shop.includes("app:'kfo-shop',message:question,consent:true"),'KFO shop shares governed endpoint');
assert(voice.includes('https://pigapocket.com/api/piga/assistant/v1/ask'));
assert(shop.includes('https://pigapocket.com/api/piga/assistant/v1/ask'));
assert(/const CACHE='piga-ortho-v\d+-[a-z0-9-]+';/.test(sw),'Versioned offline cache must be present');
assert(!/GEMINI_API_KEY|OPENAI_API_KEY|service_role|AIza[0-9A-Za-z_-]{15,}/.test(sales+widget),
 'Do not expose private provider credentials');
console.log('PASS KFO governed public-preview/nav/auth boundary: 18 modules, no direct clinical marketing links, gated portal, versioned offline assets.');
