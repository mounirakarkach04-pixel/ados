#!/usr/bin/env node
'use strict';
// Bounded deterministic mock: never use live Gemini session tokens.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
(async()=>{
const root=path.resolve('nadias-bloom');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const name=(url.pathname==='/nadias-bloom/'||url.pathname==='/nadias-bloom')?'index.html':url.pathname.replace(/^\/nadias-bloom\//,'');
 if(!['index.html','sw.js','icon.svg','manifest.webmanifest'].includes(name)){res.writeHead(404);return res.end('not found')}
 const file=path.join(root,name);
 try{res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'application/javascript':'application/octet-stream','cache-control':'no-store'});res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end('not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
try{
for(const [label,viewport] of [['desktop',{width:1280,height:900}],['mobile',{width:390,height:844}]]){
let checks=0;const ck=(ok,why)=>{assert(ok,label+' / '+why);checks++};
const context=await browser.newContext({viewport,serviceWorkers:'block'});
await context.addInitScript(()=>{
  window.__HAPPY_SIM={mode:'ready',health:0,token:0,websocket:0,setup:0,turns:0};
  const originalFetch=window.fetch.bind(window);
  window.fetch=(url,options={})=>{
    const uri=String(url);
    if(!uri.includes('/happy-live-token'))return originalFetch(url,options);
    if(options.method==='GET'||uri.endsWith('/health')){
      window.__HAPPY_SIM.health++;
      const ready=window.__HAPPY_SIM.mode==='ready';
      return Promise.resolve(new Response(JSON.stringify({ok:ready,keyConfigured:ready,model:'gemini-3.1-flash-live-preview'}),{status:200,headers:{'content-type':'application/json'}}));
    }
    window.__HAPPY_SIM.token++;
    return Promise.resolve(new Response(JSON.stringify({ok:true,token:'SIMULATED_EPHEMERAL_TOKEN_NOT_VALID',model:'gemini-3.1-flash-live-preview'}),{status:200,headers:{'content-type':'application/json'}}));
  };
  window.WebSocket=class MockHappyWebSocket {
    constructor(){window.__HAPPY_SIM.websocket++;this.readyState=0;setTimeout(()=>{this.readyState=1;this.onopen?.()},10)}
    send(raw){const data=JSON.parse(raw);if(data.setup){window.__HAPPY_SIM.setup++;setTimeout(()=>this.onmessage?.({data:JSON.stringify({setupComplete:{}})}),10)}
    if(data.clientContent){window.__HAPPY_SIM.turns++;setTimeout(()=>this.onmessage?.({data:JSON.stringify({serverContent:{outputTranscription:{text:'Dies ist eine simulierte Happy-Antwort.'},turnComplete:true}})}),10)}}
    close(){this.readyState=3;this.onclose?.({code:1000})}
  };
});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+port+'/nadias-bloom/');
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('happy'));
ck(!(await page.locator('#happyOnline').isChecked()),'external AI strictly off by default');
ck((await page.evaluate(()=>window.__HAPPY_SIM)).health===0,'no provider calls before opt-in');
await page.locator('#happyOnline').check();
await page.waitForFunction(()=>document.querySelector('#happyStatus').textContent.includes('Happy Live bereit'));
ck(await page.locator('#happyOnline').isChecked(),'successful preflight retains explicitly opted-in mode');
const before=await page.evaluate(()=>({...window.__HAPPY_SIM}));
ck(before.health===1&&before.token===0&&before.websocket===0,'health-only preflight; no token or AI connection before message');
await page.locator('#happyInput').fill('Hallo Happy');
await page.locator('#happySend').click();
await page.waitForFunction(()=>document.querySelector('#happyChat').textContent.includes('simulierte Happy-Antwort'));
const after=await page.evaluate(()=>({...window.__HAPPY_SIM}));
ck(after.token===1&&after.websocket===1&&after.setup===1&&after.turns===1,'ephemeral credential then handshake then one answer');
ck((await page.locator('#happyChat').innerText()).includes('simulierte Happy-Antwort'),'response appears in chat');
await page.locator('#happyOnline').uncheck();
ck(!(await page.locator('#happyOnline').isChecked()),'user can shut down online mode');
ck((await page.locator('#happyStatus').innerText()).includes('Lokal bereit'),'local fallback visible');
await page.evaluate(()=>window.__HAPPY_SIM.mode='down');
await page.locator('#happyOnline').check();
await page.waitForFunction(()=>!document.querySelector('#happyOnline').checked);
ck((await page.locator('#happyStatus').innerText()).includes('DELAY'),'provider failure reverts to local safely');
ck(errors.length===0,'no JS exceptions');
const over=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
ck(over<=2,'no horizontal mobile overflow');
results.push({label,checks,overflow:over});
await context.close();
}
}finally{await browser.close();await new Promise(done=>server.close(done))}
console.log(JSON.stringify({status:'PASS_NADIA_HAPPY_V262_MOCK_END_TO_END',results,checks:results.reduce((s,r)=>s+r.checks,0),realGeminiCalls:0,noSecretsUsed:true},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
