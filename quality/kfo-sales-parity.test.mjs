import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';

// Public sales surface: user-approved, synthetic-data preview WITHOUT
// unauthorized links into the evaluation modules or commercial claims.
// Do not conflate source readiness with runtime, clinical or payment readiness.
const read = path => readFileSync(path, 'utf8');
const root = 'piga-ortho-3d/';
const sales = read(root + 'sales.html');
const dashboard = read(root + 'dashboard.html');
const widget = read('quality/piga-assistant-widget.mjs');
const voice = read(root + 'voice.js');
const shop = read(root + 'kfo-shop-advisor.js');
const sw = read(root + 'sw.js');
new vm.Script(widget, {filename:'piga-assistant-widget.mjs'});
const modules = [
 'dashboard.html','direct.html','studio.html','imaging.html','devices.html',
 'device-hub.html','kfo-atlas.html','piga-voice.html','assist.html','workflow.html',
 'team.html','handoff.html','inventory.html','supply.html','procurement.html',
 'report.html','diagnostics.html','setup.html'
];
assert.equal(new Set(modules).size, 18);
for (const name of modules) {
 assert(existsSync(root + name), 'Missing local evaluation module: ' + name);
 assert(!sales.includes('href="./' + name + '"'),
   'Commercial preview must not directly launch protected/evaluation module: ' + name);
}
assert(sales.includes('Sechs Einblicke'), 'Keep the six original product illustrations');
assert(sales.includes('id="funktionen"') && sales.includes('id="kfo-piga"'));
assert(sales.includes('Evaluationsstatus:'), 'Clearly declare the actual evaluation state');
assert(sales.includes('synthetische') && sales.includes('keine klinisch'),
 'Explicitly prevent clinical/patient use claims');
assert(sales.includes('Kein Modul lässt sich von der Verkaufsseite aus starten.'),
 'Protected functionality cannot be launched from public marketing');
assert(sales.includes('Preis auf Anfrage'), 'Keep non-checkout sales inquiries until verified release');
assert(sales.includes('mailto:mounirakarkach04@gmail.com'),
 'Inquiries must go to the declared product contact');
assert(!/mailto:dr\.akarkach@gmx\.de/i.test(sales),
 'Do not expose the unrelated physician contact on the sales preview');
assert(!sales.includes('data-piga-app="ortho-preview"'),
 'Public preview must not auto-mount a live specialist');
assert(dashboard.includes('data-piga-app="ortho-workspace"'),
 'Preserve the separate bounded evaluation assistant');
assert(widget.includes('"ortho-workspace":"ortho"'),
 'The app must use the existing shared fixed specialist mapping');
assert(voice.includes("app:'ortho',message:q,consent:true"),
 'Reuse the existing governed service, never a new browser provider secret');
assert(shop.includes("app:'kfo-shop',message:question,consent:true"));
assert(sw.includes('piga-ortho-v154-android-female-audio-check'),
 'Preserve the current offline asset revision');
assert(!/GEMINI_API_KEY|OPENAI_API_KEY|service_role|AIza[0-9A-Za-z_-]{15,}/.test(sales + widget),
 'No provider credentials belong in static marketing/assistant code');
console.log('PASS KFO source-only sales preview: 18 local modules preserved but unlinked; six illustrations, protected inquiry and clinical gates. NOT a production release.');
