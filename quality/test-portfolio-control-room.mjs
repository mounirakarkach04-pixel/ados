#!/usr/bin/env node
/**
 * PIGA portfolio Control Room: real Chromium audit of the exact PR source.
 * Public static content only, no paid services, no remote APIs.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const report = {schema:'piga.portfolio.browser.v1',checks:[],viewports:[],scope:'local static browser, no canonical-live assertion'};
const registry=JSON.parse(fs.readFileSync('quality/portfolio-registry.json','utf8'));
assert.equal(registry.apps.length,11,'expected 11 independently registered entry points');
fs.mkdirSync('qa-artifacts/portfolio-browser',{recursive:true});
const browser=await chromium.launch({headless:true});
const origin='http://127.0.0.1:4179';
const targets=[
 {width:320,height:720,name:'small'},
 {width:390,height:844,name:'phone'},
 {width:768,height:1024,name:'tablet'},
 {width:1280,height:850,name:'desktop'}
];
try {
for(const v of targets){
 const page=await browser.newPage({viewport:{width:v.width,height:v.height},reducedMotion:'reduce'});
 const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(!r.url().startsWith(origin+'/'))requests.push(r.url())});
 const response=await page.goto(origin+'/quality/portfolio-control-room.html',{waitUntil:'networkidle',timeout:15000});
 assert.equal(response.status(),200,'HTTP 200 expected at '+v.name);
 await page.waitForFunction(()=>document.querySelectorAll('#cards .card').length===11,{timeout:8000});
 assert.equal(await page.locator('#count').innerText(),'11');
 assert.equal(await page.locator('#canonical').innerText(),String(registry.apps.filter(x=>x.canonical).length));
 assert.equal(await page.locator('#verified').innerText(),'0','static source must never invent live validations');
 assert.equal(await page.locator('#cards .card').count(),11);
 assert.equal(await page.locator('#cards .links a').count(),registry.apps.length+registry.apps.filter(x=>x.canonical).length);
 assert.equal(await page.locator('#status').innerText(),'11 von 11 Einträgen angezeigt. Keine Live-Funktionszusage.');
 const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 if(layout.scrollWidth>layout.width+1){
   const offenders=await page.evaluate(()=>[...document.body.querySelectorAll('*')]
     .map(el=>({element:el.tagName.toLowerCase()+(el.className && typeof el.className==='string'?'.'+el.className.replaceAll(' ','.'):''),right:Math.round(el.getBoundingClientRect().right)}))
     .filter(x=>x.right>window.innerWidth+1).slice(0,12));
   assert.fail(v.name+' horizontal overflow: '+layout.scrollWidth+'/'+layout.width+' offenders: '+JSON.stringify(offenders));
 }
 await page.locator('#search').fill('Nadia');
 assert.equal(await page.locator('#cards .card').count(),1,v.name+': Nadia search');
 await page.locator('#search').fill('');
 await page.locator('#area').selectOption('ortho');
 assert.equal(await page.locator('#cards .card').count(),3,v.name+': ortho category filter');
 await page.locator('#area').selectOption('');
 assert.equal(await page.locator('#cards .card').count(),11);
 await page.keyboard.press('Tab');
 const focus=await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,160));
 assert.ok(focus,v.name+': keyboard navigation missing');
 assert.deepEqual(errors,[],v.name+': uncaught browser errors');
 assert.deepEqual(requests,[],v.name+': unexpected remote/network requests');
 if(v.name==='phone'||v.name==='desktop'){
   await page.screenshot({path:'qa-artifacts/portfolio-browser/'+v.name+'.png',fullPage:true});
 }
 report.checks.push({viewport:v.name,passed:true,appCards:11,localOnly:true,zeroExternalCalls:true,noOverflow:true,keyboard:true,searchFilter:true});
 report.viewports.push({name:v.name,...layout});
 console.log('PASS '+v.name+' · 11 modules · mobile/layout/search/filter/keyboard/no remote APIs');
 await page.close();
}
} finally {
 await browser.close();
 fs.writeFileSync('qa-artifacts/portfolio-browser/evidence.json',JSON.stringify(report,null,2)+'\n');
}
