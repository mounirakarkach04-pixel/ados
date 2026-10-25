#!/usr/bin/env node
'use strict';
/* PIGA Gate 1 synthetic only. No AI, provider auth calls, real emails or payments. */
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve('nadias-bloom'),allowed=new Set(['index.html','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png','barakah-home-2027-original-cover.png']);
assert.equal(fs.statSync(path.join(root,'barakah-home-2027-original-cover.png')).size,2414301,'unaltered BARAKAH cover');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),file=url.pathname.replace(/^\/nadias-bloom\/?/,'')||'index.html';if(!allowed.has(file)){res.writeHead(404);return res.end('404')}const mime=file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':'application/manifest+json';res.writeHead(200,{'content-type':mime});fs.createReadStream(path.join(root,file)).pipe(res)});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+server.address().port+'/nadias-bloom/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});let n=0;const report=[],screens=[];fs.mkdirSync('qa-screenshots',{recursive:true});
 try{for(const width of [320,393,1280]){
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url().split('?')[0])});
 const check=(v,why)=>{assert.ok(v,width+'px: '+why);n++};
 await page.goto(base);await page.evaluate(()=>window.NADIAS_BLOOM_QA.setLocale('de','DE'));
 check((await page.title()).includes('Nadia'),'title');check(await page.locator('#view-konto').count()===1,'12th account view');
 check(await page.locator('.nb29-tabs button').count()===5,'five navigation slots');
 check(await page.locator('[data-nb29-form]').count()===6,'six one-tap creation routes');
 check(await page.locator('#nb-lang-quick option').count()===15,'15 languages');
 check(await page.locator('img[src="barakah-home-2027-original-cover.png"]').count()>=2,'original book cover');
 check(await page.locator('#view-happy').count()===0,'Happy not falsely presented');
 await page.locator(width<900?'#nb29-add':'#nb29-desktop-add').click();
 check(await page.locator('#nb29-quick').isVisible(),'quick sheet opens');
 await page.locator('[data-nb29-form=taskForm]').click();
 check(await page.locator('#view-aufgaben').isVisible(),'quick action routes to task form');
 await page.locator('#taskForm [name=title]').fill('QA-v29-Aufgabe');
 await page.locator('#taskForm button').click();
 check((await page.locator('#taskList').innerText()).includes('QA-v29-Aufgabe'),'locally stored task');
 await page.locator('#nb29-search-trigger').click();await page.locator('#nb29-query').fill('QA-v29-Aufgabe');
 check((await page.locator('#nb29-results').innerText()).includes('QA-v29-Aufgabe'),'search local task');
 await page.locator('[data-nb29-result=aufgaben]').first().click();
 check(await page.locator('#nb29-search').isHidden(),'search closes safely');
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('konto'));
 check(await page.locator('#nb29-auth-host #nb-auth-card').count()===1,'auth moved without cloning');
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('buch'));
 check(await page.locator('#nb29-auth-anchor + #nb-auth-card').count()===1,'auth restored');
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setLocale('nl','NL'));
 check((await page.locator('[data-nb29=more]').innerText())==='Meer','Dutch navigation');
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setLocale('ar','MA'));
 check(await page.evaluate(()=>document.documentElement.dir)==='rtl','Arabic RTL');
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setLocale('de','DE'));
 const future=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+2);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')});
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('kalender'));
 await page.locator('#eventForm [name=title]').fill('QA-v29-Termin');await page.locator('#eventForm [name=date]').fill(future);await page.locator('#eventForm button').click();
 await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('start'));
 check((await page.locator('#nb29-week-list').innerText()).includes('QA-v29-Termin'),'seven-day agenda');
 await page.reload();check((await page.locator('#nb29-week-list').innerText()).includes('QA-v29-Termin'),'offline local persistence');
 const over=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 check(over<5,'no horizontal overflow '+over);
 if(width===393){for(const view of ['start','kalender','aufgaben','kinder','essen','einkauf','haushalt','geld','iman','journal','buch','konto']){await page.evaluate(v=>window.NADIAS_BLOOM_QA.setView(v),view);await page.screenshot({path:'qa-screenshots/nadia-v29-'+view+'.png',animations:'disabled'});screens.push(view)}}
 check(errors.length===0,'zero uncaught JS exceptions: '+errors.join('|'));
 check(external.length===0,'no outbound data: '+external.slice(0,3).join(','));
 report.push({width,overflow:over});await context.close()
 }}finally{await browser.close();await new Promise(ok=>server.close(ok))}
 assert.equal(screens.length,12,'12 Chromium previews generated');
 console.log(JSON.stringify({verdict:'PASS_NADIA_V29_MOBILE_UX',checks:n,views:12,screenshots:screens.length,report,externalCalls:0,realEmailsSent:0,modelCalls:0},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
