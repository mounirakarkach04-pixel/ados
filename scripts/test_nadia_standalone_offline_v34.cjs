#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base=fs.existsSync('nadias-bloom/Nadias_Bloom_Offline.html')?'nadias-bloom':'artifacts/piga-pocket/public/nadias-bloom';
const htmlPath=path.resolve(base,'Nadias_Bloom_Offline.html');
const source=fs.readFileSync(htmlPath,'utf8');
const inlined=(source.match(/src="data:image\/webp;base64,UklG/g)||[]).length;
assert.equal(inlined,2,'both original-cover placements must be embedded');
assert(!/<link rel="manifest"/.test(source),'file-based offline app must not need PWA resources');
assert(!/<img[^>]*src="https?:/.test(source),'no remotely fetched image assets');
assert(!/<script[^>]+src=/.test(source),'no external scripts');
assert(source.includes('v34-spacious-family-calendar'),'current verified calendar');
(async()=>{
let browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [393,1280]){
  const ctx=await browser.newContext({viewport:{width,height:840},acceptDownloads:true});
  await ctx.setOffline(true);
  const page=await ctx.newPage(),requests=[],errors=[];
  page.on('request',req=>{if(/^https?:/.test(req.url()))requests.push(req.url())});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+htmlPath,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.NADIAS_BLOOM_QA?.version==='v34-spacious-family-calendar');
  const cover=page.locator('img[alt*="Originalcover"]').first();
  await cover.evaluate(el=>el.decode());
  assert((await cover.evaluate(el=>el.naturalWidth))>=400,'embedded cover decodes without internet');
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('kalender'));
  assert((await page.locator('[data-calendar-date]').count())>=28,'offline calendar displays all dates');
  const ds=await page.locator('[data-calendar-date]').first().getAttribute('data-calendar-date');
  await page.locator('[data-calendar-date]').first().click();
  await page.locator('#eventForm [name=title]').fill('OFFLINE-ONLY-EVENT');
  await page.locator('#eventForm [name=time]').fill('11:30');
  await page.locator('#eventForm button').first().click();
  assert((await page.locator('#nb-cal-day-list').innerText()).includes('OFFLINE-ONLY-EVENT'),'offline event created');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('kalender'));
  await page.locator('[data-calendar-date="'+ds+'"]').click();
  assert((await page.locator('#nb-cal-day-list').innerText()).includes('OFFLINE-ONLY-EVENT'),'offline event persists after full file reload');
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('aufgaben'));
  await page.locator('#taskForm [name=title]').fill('OFFLINE-ONLY-TASK');
  await page.locator('#taskForm button').first().click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('aufgaben'));
  assert((await page.locator('#taskList').innerText()).includes('OFFLINE-ONLY-TASK'),'offline task persists after file reload');
  await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('buch'));
  const dl=page.waitForEvent('download');
  await page.locator('#backup').click();
  const download=await dl;
  assert(download.suggestedFilename().endsWith('.json'),'offline local data export');
  assert.equal(requests.length,0,'no network access on offline file');
  assert.equal(errors.length,0,'no uncaught runtime errors: '+errors.join('; '));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=2,'no horizontal overflow at '+width);
  console.log(JSON.stringify({result:'PASS_OFFLINE_STANDALONE',width,cover:true,localPersistence:true,backup:true,networkRequests:0,overflow}));
  await ctx.close();
 }
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
