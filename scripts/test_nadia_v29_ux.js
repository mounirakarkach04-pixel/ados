#!/usr/bin/env node
'use strict';
// Nadia Bloom v32: browser acceptance on 320px, 393px, and desktop.
// All auth/cover network access blocked or locally simulated; no real email, AI, family data sent.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve('nadias-bloom');
const assets=new Set(['index.html','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png','barakah-home-2027-original-cover.png','barakah-home-2027-cover-480.webp']);
const original=fs.readFileSync(path.join(root,'barakah-home-2027-original-cover.png'));
const thumb=fs.readFileSync(path.join(root,'barakah-home-2027-cover-480.webp'));
assert.equal(original.length,2414301,'immutable original cover');
assert(thumb.length<40000&&thumb.toString('ascii',0,4)==='RIFF'&&thumb.toString('ascii',8,12)==='WEBP','actual compact original cover');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=pathname.replace(/^\/nadias-bloom\/?/,'')||'index.html';
 if(!assets.has(file)){res.writeHead(404);return res.end('404')}
 const mime=file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':'application/manifest+json';
 res.writeHead(200,{'content-type':mime});fs.createReadStream(path.join(root,file)).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/nadias-bloom/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const summary=[];let screenshots=0;
 try{
 for(const width of [320,393,1280]){
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',acceptDownloads:true});
  const page=await context.newPage(),errors=[],unexpected=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{
   const url=r.url();
   if(url.startsWith('https://')&&!url.includes('mounirakarkach04-pixel.github.io/ados/nadias-bloom/barakah-home-2027-cover-480.webp'))unexpected.push(url);
  });
  await page.route('https://mounirakarkach04-pixel.github.io/ados/nadias-bloom/barakah-home-2027-cover-480.webp',
    route=>route.fulfill({status:200,contentType:'image/webp',body:thumb}));
  await page.goto(base);
  let count=0;
  const check=(v,label)=>{assert.ok(v,width+'px: '+label);count++};
  check((await page.title()).includes('Nadia'),'app title');
  check((await page.evaluate(()=>window.NADIAS_BLOOM_QA.version)).includes('v32'),'release identity');
  check(await page.locator('#nb-install').count()===1,'install entry');
  check(await page.locator('#nb-lang-quick option').count()===15,'15 accessible languages');
  check(await page.locator('#view-buch #nb-auth-card').count()===1,'auth account is correctly in book and settings view');
  check(await page.locator('img[data-nb-original-cover]').count()===2,'both book previews carry original cover');
  check(await page.locator('#view-happy').count()===0,'disabled unverified voice');
  check(await page.locator('#nb-auth-provider option').count()===2,'two explicitly separate account realms');
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('buch'));
  const picture=page.locator('#view-buch img[data-nb-original-cover]').first();
  await picture.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{const image=document.querySelector('#view-buch img[data-nb-original-cover]');return image?.complete&&image.naturalWidth>0});
  check(await picture.evaluate(img=>img.naturalWidth)>400,'30KB original image visibly decoded');
  await page.locator('#nb-auth-provider').selectOption('failover');
  check(await page.evaluate(()=>window.NADIA_AUTH_QA.provider())==='failover','failover chosen explicitly');
  check(await page.evaluate(()=>!sessionStorage.getItem('nadias-bloom-auth-session-v1-failover')),'no legacy session copied');
  await page.locator('#nb-auth-provider').selectOption('primary');
  check(await page.evaluate(()=>window.NADIA_AUTH_QA.provider())==='primary','primary restored');
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('aufgaben'));
  await page.locator('#taskForm [name=title]').fill('QA-v32-PRIVATE-DO-NOT-EXPORT');
  await page.locator('#taskForm button').click();
  check((await page.locator('#taskList').innerText()).includes('QA-v32-PRIVATE-DO-NOT-EXPORT'),'local task created');
  await page.reload();
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('aufgaben'));
  check((await page.locator('#taskList').innerText()).includes('QA-v32-PRIVATE-DO-NOT-EXPORT'),'local task persists across reload');
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('buch'));
  const downloading=page.waitForEvent('download');
  await page.locator('#downloadOffline').click();
  const received=await downloading;
  const filePath=await received.path();
  const offline=fs.readFileSync(filePath,'utf8');
  check(offline.includes('data:image/webp;base64,'),'downloaded one-file app embeds actual WebP');
  check(!offline.includes('QA-v32-PRIVATE-DO-NOT-EXPORT'),'download does not leak personalized family records');
  check(offline.length<500000,'standalone HTML remains lightweight');
  const over=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(over<5,'viewport has no horizontal overflow: '+over);
  check(errors.length===0,'no uncaught page errors: '+errors.join(' | '));
  check(unexpected.length===0,'no unexpected outbound network calls');
  if(width===393){
   for(const view of ['start','kalender','aufgaben','kinder','essen','einkauf','haushalt','geld','iman','journal','buch']){
    await page.evaluate(v=>window.NADIAS_BLOOM_QA.setView(v),view);
    check(await page.locator('#view-'+view).isVisible(),'view '+view+' accessible');
    await page.screenshot({path:'qa-screenshots/nadia-v29-'+view+'.png',animations:'disabled'});
    screenshots++;
   }
  }
  summary.push({width,checks:count,overflow:over});
  await context.close();
 }
 }finally{await browser.close();await new Promise(ok=>server.close(ok))}
 assert.equal(screenshots,11,'eleven real app view screenshots');
 console.log(JSON.stringify({verdict:'PASS_NADIA_V32_BROWSER_UX_AND_COVER_EXPORT',summary,views:11,screenshots,emailsSent:0,aiCalls:0,realAuthE2E:'NOT_VERIFIED'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
