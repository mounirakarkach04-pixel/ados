#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../nadias-bloom');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
let count=0;function check(v,label){assert.ok(v,label);count++}
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)){new vm.Script(m[1]);check(true,'inline-script-parse')}
new vm.Script(sw);check(true,'service-worker-parse');
const views=[...html.matchAll(/<section id="view-([a-z]+)"/g)].map(m=>m[1]);
const dialog=html.match(/<dialog id="nb-nav-dialog"[\s\S]*?<\/dialog>/)?.[0]||'';
const nav=[...dialog.matchAll(/data-view="([a-z]+)"/g)].map(m=>m[1]);
check(views.length===11&&nav.length===11&&views.every(v=>nav.includes(v)),'all-11-views-accessible');
check(html.includes('#nb-auth-card{display:none!important}')&&html.includes('uiPaused:true'),'optional-auth-paused');
check(html.includes('id="nb-data-card"')&&html.includes('id="backup"')&&html.includes('id="restoreFile"'),'backup-visible');
check(html.includes('pigapocket.com/showroom')&&html.includes('pigapocket.com/forschung-apps'),'main-showroom-links');
check(sw.includes("if(url.search||url.hash||req.headers.has('authorization'))return;"),'no-auth-cache');
check(html.includes('barakah-home-2027-cover-480.webp'),'original-cover');
check(html.includes('nbUpdateCalendarAgenda()'),'calendar-agenda');
check(!html.includes('id="view-happy"'),'no-unverified-voice');
check(JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8')).display==='standalone','pwa-installable');
check(html.includes('NB_V33_NAV_WORDS'),'translated-menu');
if(process.argv.includes('--static')){console.log(JSON.stringify({status:'PASS',checks:count,mode:'static',release:'v33'}));process.exit(0)}
(async()=>{
const {chromium}=require('playwright'),http=require('node:http');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 let rel=decodeURIComponent(u.pathname);
 if(!rel.startsWith('/nadias-bloom/')){res.writeHead(404);return res.end()}
 rel=rel.slice('/nadias-bloom/'.length)||'index.html';
 const resolved=path.resolve(root,rel);
 if(!resolved.startsWith(root+path.sep)||!fs.existsSync(resolved)||!fs.statSync(resolved).isFile()){res.writeHead(404);return res.end()}
 const type=rel.endsWith('.html')?'text/html; charset=utf-8':rel.endsWith('.webmanifest')?'application/manifest+json':rel.endsWith('.js')?'text/javascript':rel.endsWith('.svg')?'image/svg+xml':rel.endsWith('.png')?'image/png':'application/octet-stream';
 res.setHeader('Content-Type',type);res.end(fs.readFileSync(resolved));
});
await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',e=>e?reject(e):resolve()));
const url='http://127.0.0.1:'+server.address().port+'/nadias-bloom/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
try{
for(const width of [320,393,1280]){
 const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 await page.route('https://mounirakarkach04-pixel.github.io/**',r=>r.abort());
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.NADIAS_BLOOM_QA);
 const qa=await page.evaluate(()=>({version:window.NADIAS_BLOOM_QA.version,days:window.NADIAS_BLOOM_QA.duaCount,auth:window.NADIA_AUTH_QA.uiPaused}));
 check(qa.version==='v33-mobile-navigation-account-paused'&&qa.days===365&&qa.auth,'QA-state-'+width);
 check(await page.locator('#nb-auth-card').isHidden(),'no-login-prompt-'+width);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 check(overflow<=2,'no-horizontal-overflow-'+width+': '+overflow);
 if(width<=393){
   await page.locator('#nb-open-menu').click();
   check(await page.locator('#nb-nav-dialog').evaluate(el=>el.open),'mobile-menu-opens-'+width);
   check(await page.locator('#nb-nav-dialog [data-view]').count()===11,'all-menu-buttons-'+width);
   await page.locator('#nb-nav-dialog [data-view="kinder"]').click();
   check(await page.locator('#view-kinder').isVisible(),'family-nav-'+width);
   check(!await page.locator('#nb-nav-dialog').evaluate(el=>el.open),'menu-closes-'+width);
   await page.locator('#nb-open-menu').click();
   await page.locator('#nb-nav-close').click();
   check(!await page.locator('#nb-nav-dialog').evaluate(el=>el.open),'close-button-'+width);
 }
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('aufgaben'));
 await page.locator('#taskForm [name=title]').fill('QA-TEST-LOCAL-TASK');
 await page.locator('#taskForm button').click();
 check((await page.locator('#taskList').innerText()).includes('QA-TEST-LOCAL-TASK'),'local-task-save-'+width);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('aufgaben'));
 check((await page.locator('#taskList').innerText()).includes('QA-TEST-LOCAL-TASK'),'local-task-survives-reload-'+width);
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('kalender'));
 check(await page.locator('[data-calendar-date]').count()>=28,'calendar-populated-'+width);
 await page.locator('[data-calendar-date]').first().click();
 check((await page.locator('#nb-cal-selected-heading').innerText()).length>6,'calendar-day-agenda-'+width);
 check(errors.length===0,'no-uncaught-js-'+width+': '+errors.join('; '));
 if(width===393){
   await page.evaluate(()=>window.NADIAS_BLOOM_QA.setLocale('ar','MA'));
   check(await page.locator('html').getAttribute('dir')==='rtl','arabic-rtl');
   await page.locator('#nb-open-menu').click();
   check((await page.locator('#nb-nav-title').innerText()).includes('إلى'),'arabic-navigation');
   await page.locator('#nb-nav-close').click();
   await page.evaluate(()=>window.NADIAS_BLOOM_QA.setLocale('de','DE'));
   // Service Worker controlled offline navigation; no personal data sent to external endpoint.
   await page.waitForFunction(()=>navigator.serviceWorker?.controller,{timeout:20000}).catch(async()=>{await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>navigator.serviceWorker?.controller,{timeout:20000})});
   const swEvidence=await page.evaluate(async()=>{const keys=await caches.keys(),name=keys.find(k=>k.startsWith('nadias-bloom-v33-'));const cache=name?await caches.open(name):null;const root=cache?await cache.match(new URL('./',location.href).toString()):null;return {controlled:!!navigator.serviceWorker?.controller,keys,rootCached:!!root,pageUrl:location.href}});
   console.log('NADIA_V33_OFFLINE_PRECHECK',JSON.stringify(swEvidence));
   check(swEvidence.controlled&&swEvidence.rootCached,'offline-cache-ready-'+width);
   await context.setOffline(true);
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:12000});
   check(await page.locator('.view.active').count()===1,'offline-nav-'+width);
   await context.setOffline(false);
 }
 results.push({width,overflow,errors:errors.length});
 await context.close();
}
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({status:'PASS',mode:'browser',checks:count,viewports:results},null,2))
})().catch(e=>{console.error(e);process.exitCode=1});
