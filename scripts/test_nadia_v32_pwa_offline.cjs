#!/usr/bin/env node
'use strict';
// PIGA Nadia v32: real Chromium PWA service-worker / airplane mode shell acceptance.
// Local test user data only; no external login, email, or AI calls.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve('nadias-bloom');
const allowed=new Set(['index.html','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png','barakah-home-2027-original-cover.png']);
const server=http.createServer((req,res)=>{
 const pathName=new URL(req.url,'http://localhost').pathname;
 const file=pathName.replace(/^\/nadias-bloom\/?/,'')||'index.html';
 if(!allowed.has(file)){res.writeHead(404);return res.end('404')}
 const type=file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'application/manifest+json';
 res.writeHead(200,{'content-type':type,'cache-control':'no-store'});
 fs.createReadStream(path.join(root,file)).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/nadias-bloom/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:393,height:840},serviceWorkers:'allow'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const thumb=fs.readFileSync(path.join(root,'barakah-home-2027-cover-480.webp'));
  await context.route('https://mounirakarkach04-pixel.github.io/ados/nadias-bloom/barakah-home-2027-cover-480.webp',
    route=>route.fulfill({status:200,contentType:'image/webp',body:thumb}));
  await page.goto(base);
  assert((await page.title()).includes('Nadia'),'online shell loaded');
  await page.evaluate(async()=>{
   const url=new URL('sw.js',location.href);
   await navigator.serviceWorker.register(url.toString(),{scope:new URL('./',location.href).pathname});
   await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_,reject)=>setTimeout(()=>reject(Error('Service worker activation timed out')),18000))
   ]);
  });
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:20000});
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('aufgaben'));
  await page.locator('#taskForm [name=title]').fill('QA-v32-AIRPLANE-MODE');
  await page.locator('#taskForm button').click();
  assert((await page.locator('#taskList').innerText()).includes('QA-v32-AIRPLANE-MODE'),'test task is stored');
  const initial=await page.evaluate(()=>localStorage.getItem('nadias-bloom-barakah-v26'));
  assert(initial&&initial.includes('QA-v32-AIRPLANE-MODE'),'real local storage state saved');
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:20000});
  assert((await page.title()).includes('Nadia'),'PWA shell remains reachable offline');
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('aufgaben'));
  assert((await page.locator('#taskList').innerText()).includes('QA-v32-AIRPLANE-MODE'),'saved family task works in airplane mode');
  assert.equal(errors.length,0,'no JS errors after offline navigation');
  console.log(JSON.stringify({verdict:'PASS_NADIA_V32_PWA_OFFLINE',serviceWorker:true,offlineNavigation:true,localDataPersisted:true,providerCalls:0,emailsSent:0,aiCalls:0,scope:'Chromium localhost synthetic airplane mode; not owner Android device'},null,2));
  await context.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
