#!/usr/bin/env node
'use strict';
/* Quality gate for all 15 Nadia Bloom languages and air-gapped family data. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.join(__dirname,'..','nadias-bloom');
const online=fs.readFileSync(path.join(root,'index.html'),'utf8');
const offline=fs.readFileSync(path.join(root,'Nadias_Bloom_Offline.html'),'utf8');
const LANGS=['de','en','ar','fr','es','zh','it','pt','th','ms','id','ko','ja','ru','nl'];
const PHRASES=[
 'Weniger im Kopf.','Mehr im Herzen.','Dein Zuhause. Immer dabei.',
 'Der Monat im Blick','Ein besonderer Moment verdient Platz.',
 'Nicht jede Aufgabe ist dringend. Delegiere bewusst, verschiebe liebevoll und feiere, was bereits geschafft ist.',
 'Familienmitglied hinzufügen','Gericht einplanen','Buchung hinzufügen',
 'Meine Einträge','Wofür bin ich heute dankbar?','Kalender als .ics exportieren',
 'Zum Monat springen','Termin sicher speichern','Offline-App als vollständige Datei herunterladen ↓'
];
function packOf(source){
 const match=source.match(/\/\* NADIA_UI_I18N_V36_PACK_START \*\/\s*window\.NADIA_UI_V36_PACK=([\s\S]*?);\s*\/\* NADIA_UI_I18N_V36_PACK_END \*\//);
 assert.ok(match,'pack missing');
 const p=JSON.parse(match[1]);
 assert.equal(Object.keys(p).length,14,'exact language count');
 for(const l of LANGS.filter(x=>x!=='de')){
  assert.ok(p[l]&&Object.keys(p[l]).length>=300,'not enough translated strings '+l);
  for(const text of PHRASES)assert.ok(p[l][text],l+' untranslated phrase '+text);
 }
 return p
}
const a=packOf(online),b=packOf(offline);
for(const lang of LANGS.filter(x=>x!=='de'))assert.equal(Object.keys(a[lang]).length,Object.keys(b[lang]).length,'offline parity '+lang);
for(const h of [online,offline]){
 assert.ok(h.includes('nbTranslateWholeUI()'),'UI adapter');
 assert.ok(!h.includes('fetch("https://translate.googleapis.com'),'no remote translation at runtime');
 for(const m of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
}
console.log(JSON.stringify({status:'PASS',languages:LANGS.length,translatedStrings:Object.keys(a.en).length,offline:true,mode:'static'}));
if(!process.argv.includes('--browser'))process.exit(0);
(async()=>{
const {chromium}=require('playwright'),http=require('node:http');
const server=http.createServer((req,res)=>{
 const file=(new URL(req.url,'http://local')).pathname.split('/').pop()||'index.html';
 const fp=path.join(root,file);
 if(!['index.html','sw.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','Nadias_Bloom_Offline.html','barakah-home-2027-cover-480.webp'].includes(file)||!fs.existsSync(fp)){res.statusCode=404;return res.end()}
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.webmanifest')?'application/manifest+json':'application/octet-stream');
 res.end(fs.readFileSync(fp))
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let checks=0;
try{
const page=await browser.newPage({viewport:{width:393,height:850}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>!!window.NADIAS_BLOOM_QA);
for(const lang of LANGS){
 await page.evaluate(l=>window.NADIAS_BLOOM_QA.setLocale(l,'DE'),lang);
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('kalender'));
 const state=await page.evaluate(()=>({
  htmlLang:document.documentElement.lang,
  direction:document.documentElement.dir,
  label:document.querySelector('.nb-cal-heading h2')?.textContent?.trim(),
  monthJump:document.querySelector('.nb-cal-month-pick span')?.textContent?.trim(),
  placeholder:document.querySelector('#eventForm [name=title]')?.getAttribute('placeholder'),
  remembered:document.querySelector('#nb-lang-quick')?.value,
  warning:document.querySelector('#view-kalender .sub')?.textContent?.trim()
 }));
 assert.equal(state.remembered,lang,'selection not updated '+lang);
 assert.equal(state.direction,lang==='ar'?'rtl':'ltr','direction '+lang);
 if(lang!=='de'){
  assert.equal(state.label,a[lang]['Der Monat im Blick'],'calendar heading '+lang);
  assert.equal(state.monthJump,a[lang]['Zum Monat springen'],'month jump label '+lang);
  checks+=2;
 }
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('aufgaben'));
 const taskTitle=await page.locator('#view-aufgaben .card h2').first().textContent();
 if(lang!=='de')assert.equal(taskTitle.trim(),a[lang]['Eine Aufgabe notieren'],'task form '+lang);
 checks+=3;
}
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setLocale('fr','FR'));
await page.reload({waitUntil:'domcontentloaded'});
assert.equal(await page.locator('#nb-lang-quick').inputValue(),'fr','language not persisted');
checks++;
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('kinder'));
await page.locator('#memberForm [name=name]').fill('Mein Kind');
await page.locator('#memberForm button').first().click();
assert.ok((await page.locator('#memberList').innerText()).includes('Mein Kind'),'user content must not be translated');
checks++;
assert.deepEqual(errors,[],'uncaught js');
await page.close();

const standalone=await browser.newPage({viewport:{width:393,height:850}});
const remote=[];standalone.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
await standalone.context().setOffline(true);
await standalone.goto('file://'+path.join(root,'Nadias_Bloom_Offline.html'),{waitUntil:'domcontentloaded'});
await standalone.evaluate(()=>window.NADIAS_BLOOM_QA.setLocale('ar','MA'));
await standalone.evaluate(()=>window.NADIAS_BLOOM_QA.setView('kalender'));
assert.equal(await standalone.locator('html').getAttribute('dir'),'rtl');
assert.equal((await standalone.locator('.nb-cal-heading h2').innerText()).trim(),a.ar['Der Monat im Blick']);
assert.deepEqual(remote,[],'standalone should not attempt remote translation');
checks+=3;
await standalone.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({status:'PASS',mode:'browser',languages:LANGS.length,checks,offline:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
