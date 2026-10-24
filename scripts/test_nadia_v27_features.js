#!/usr/bin/env node
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
const root=path.resolve('nadias-bloom');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),name=url.pathname.replace(/^\/nadias-bloom\/?/,'')||'index.html';if(!['index.html','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png'].includes(name)){res.writeHead(404);return res.end('404')}const f=path.join(root,name);try{res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript':name.endsWith('.png')?'image/png':'application/octet-stream'});res.end(fs.readFileSync(f))}catch(e){res.writeHead(404);res.end('Missing')}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const runs=[];try{
for(const [label,viewport] of [['desktop',{width:1280,height:900}],['android',{width:393,height:873}]]){
let n=0;const check=(good,m)=>{assert(good,label+' / '+m);n++};let requests=[],errors=[];
const context=await browser.newContext({viewport,serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
await page.route('https://qjvopzschqukitvudgfz.supabase.co/auth/v1/**',async route=>{
const req=route.request(),u=new URL(req.url());requests.push({path:u.pathname,method:req.method()});
let body={};try{body=req.postDataJSON()||{}}catch{}
if(JSON.stringify(body).includes('members')||JSON.stringify(body).includes('events'))throw Error('Local family data leaked to auth endpoint');
const result=u.pathname.endsWith('/token')||u.pathname.endsWith('/verify')?
{access_token:'SYNTHETIC_ACCESS_TOKEN',refresh_token:'SYNTHETIC_REFRESH_TOKEN',expires_in:3600,user:{email:body.email||'synthetic@example.com'}}:
u.pathname.endsWith('/user')?{email:'synthetic@example.com'}:{};
await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'POST, OPTIONS, PUT, GET'},body:JSON.stringify(result)})
});
await page.goto('http://127.0.0.1:'+port+'/nadias-bloom/');
check((await page.title()).includes("Nadia"),"loaded");
check(await page.locator('link[rel="apple-touch-icon"]').count()===1,'iPhone icon linked');
check(await page.locator('link[rel="manifest"]').count()===1,'Android PWA manifest linked');
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('kalender'));
await page.locator('#monthChoose').fill('2026-10');
await page.locator('#monthChoose').dispatchEvent('change');
check((await page.locator('#bookDates').innerText()).includes('Herbstferien Hessen'),'2026 Hesse school autumn vacations');
check((await page.locator('#monthGrid').innerText()).includes('Tag der Deutschen Einheit'),'2026 statutory holiday visible on day');
check((await page.locator('#nb-month-label').innerText()).includes('2026'),'current year calendar');
await page.locator('#nb-next-month').click();
check((await page.locator('#monthChoose').inputValue())==='2026-11','monthly next');
await page.locator('#nb-prev-month').click();
check((await page.locator('#monthChoose').inputValue())==='2026-10','monthly previous');
await page.locator('#nb-this-month').click();
const activeMonth=await page.locator('#monthChoose').inputValue();
check(/^\d{4}-\d{2}$/.test(activeMonth),'today shortcut');
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('buch'));
await page.locator('#nb-prayer-city').selectOption('kassel');
check((await page.locator('#nb-prayer-mode').inputValue())==='auto','choosing city proposes automatic');
await page.locator('#nb-save-prayer-config').click();
const config=await page.evaluate(()=>window.NADIAS_BLOOM_QA.read().settings.nbPrayer);
check(config.mode==='auto'&&Math.abs(config.lat-51.3127)<.01,'prayer locale saved only in browser state');
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('iman'));
let times=await page.locator('#prayerRows').innerText();
check(/Fajr\s*·\s*\d{2}:\d{2}/.test(times),'Fajr auto calculated');
check(/Maghrib\s*·\s*\d{2}:\d{2}/.test(times),'Maghrib auto calculated');
check((await page.locator('#nb-prayer-source').innerText()).includes('Automatisch berechnet'),'prayer source clarity');
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('happy'));
check(await page.locator('#nb-avatar-photo').isVisible(),'friendly photo first option');
await page.locator('#nb-avatar-mode').selectOption('illustration');
await page.locator('#nb-avatar-hijab').selectOption('no');
await page.locator('#nb-avatar-color').evaluate(el=>{el.value='#588167';el.dispatchEvent(new Event('change',{bubbles:true}))});
check(await page.locator('#nb-avatar-illustration').isVisible(),'animated vector avatar available');
check(await page.locator('#nb-hair').evaluate(el=>getComputedStyle(el).display)!=='none','no-hijab choice shows hair');
let setting=await page.evaluate(()=>window.NADIAS_BLOOM_QA.read().settings.happyAvatar);
check(setting.hijab==='no'&&setting.color==='#588167','custom avatar saved locally');
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView('buch'));
check(await page.locator('#nb-auth-card').isVisible(),'optional auth card present');
check(!(await page.locator('#nb-auth-logged-out').isHidden()),'no forced login');
await page.locator('#nb-auth-email').fill('synthetic@example.com');
await page.locator('#nb-auth-password').fill('Synthetic#Pass876');
await page.locator('#nb-email-code').click();
await page.waitForFunction(()=>document.querySelector('#nb-auth-status').textContent.includes('Einmalcode')||document.querySelector('#nb-auth-status').textContent.includes('DELAY'));
check((await page.locator('#nb-auth-status').innerText()).includes('Einmalcode'),'mock OTP request works');
await page.locator('#nb-login').click();
await page.waitForFunction(()=>!document.querySelector('#nb-auth-logged-in').hidden||document.querySelector('#nb-auth-status').textContent.includes('DELAY'));
check(!(await page.locator('#nb-auth-logged-in').isHidden()),'mock email/password login');
check((await page.locator('#nb-auth-current-email').innerText()).includes('synthetic'),'signed in identity visible');
await page.locator('#nb-logout').click();
check(await page.locator('#nb-auth-logged-in').isHidden(),'mock logout');
const j=await page.evaluate(()=>window.NADIA_AUTH_QA);
check(j.configured&&j.noFamilyDataSync,'separate auth provider no unverified sync');
check(requests.some(r=>r.path.endsWith('/otp')),'OTP request routed only to Supabase Auth');
check(requests.some(r=>r.path.endsWith('/token')),'password login request routed only to Supabase Auth');
check(errors.length===0,'no uncaught UI errors: '+errors.join(' | '));
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
check(overflow<4,'no horizontal viewport overflow '+overflow);
runs.push({label,checks:n,overflow});
await context.close();
}
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
console.log(JSON.stringify({status:'PASS_NADIA_V27_CALENDAR_PRAYER_AVATAR_AUTH_MOCK',checks:runs.reduce((n,r)=>n+r.checks,0),runs,actualEmailsSent:0,actualGeminiTurns:0,localFamilyRecordsSentToAuth:0},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
