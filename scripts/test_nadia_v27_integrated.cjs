#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const files=new Set(["index.html","sw.js","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","happy-avatar-rose.png","happy-avatar-hair.svg"]);
const server=http.createServer((req,res)=>{
const url=new URL(req.url,"http://127.0.0.1");let name=url.pathname.replace(/^\/nadias-bloom\/?/,"")||"index.html";
if(!files.has(name)){res.writeHead(404);return res.end("missing")}
const ext=name.split(".").pop();const mime={html:"text/html;charset=utf-8",png:"image/png",svg:"image/svg+xml",js:"application/javascript",webmanifest:"application/manifest+json"}[ext]||"application/octet-stream";
try{res.writeHead(200,{"content-type":mime,"cache-control":"no-store"});res.end(fs.readFileSync(path.resolve("nadias-bloom",name)))}catch(e){res.writeHead(404);res.end("missing")}
});
(async()=>{
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const port=server.address().port,browser=await chromium.launch({headless:true,args:["--no-sandbox"]}),results=[];
try{
for(const [label,viewport] of [["desktop",{width:1280,height:880}],["mobile",{width:390,height:844}]]){
const context=await browser.newContext({viewport,acceptDownloads:true,serviceWorkers:"block"}),page=await context.newPage();
let checks=0;const errors=[],calls=[];page.on("pageerror",e=>errors.push(e.message));
const ck=(ok,msg)=>{assert(ok,label+": "+msg);checks++};
await page.route("**/auth/v1/**",async route=>{
const u=new URL(route.request().url());calls.push({path:u.pathname,method:route.request().method()});
let body={};try{body=JSON.parse(route.request().postData()||"{}")}catch{};
let response={};if(u.pathname.endsWith("/verify")||u.pathname.endsWith("/token"))response={access_token:"synthetic_access_token",refresh_token:"synthetic_refresh_token",expires_in:3600,user:{email:"fiction@example.test"}};
await route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*"},body:JSON.stringify(response)});
});
await page.goto("http://127.0.0.1:"+port+"/nadias-bloom/");
ck(await page.locator("link[rel=manifest]").count()===1,"PWA linked");
const manifest=await page.evaluate(async()=>await (await fetch("manifest.webmanifest")).json());
ck(manifest.icons.some(x=>x.sizes==="192x192")&&manifest.icons.some(x=>x.sizes==="512x512"),"PWA icons");
ck(await page.locator(".nb-promo").count()===1,"book advertisement");
ck((await page.content()).includes("Amazon"),"book Amazon navigation");
ck(!(await page.content()).includes("drive.google.com/file/d/1_rZL"),"full book PDF not linked");
ck(await page.locator(".nb-excerpts").count()===1,"excerpt only");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("kalender"));
await page.evaluate(()=>{const el=document.getElementById("monthChoose");el.value="2026-10";el.dispatchEvent(new Event("change",{bubbles:true}))});
ck((await page.locator("#bookDates").innerText()).includes("Herbstferien"),"Oct 2026 school holidays");
ck((await page.locator("#monthGrid").innerText()).includes("Feiertag")||(await page.locator("#bookDates").innerText()).includes("Tag der Deutschen Einheit"),"October 2026 public holiday");
await page.locator("#nb-next-month").click();ck((await page.locator("#monthChoose").inputValue())==="2026-11","calendar goes forward 2026");
await page.locator("#nb-this-month").click();ck((await page.locator("#monthChoose").inputValue())===new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0"),"today calendar");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("buch"));
await page.locator("#nb-prayer-city").selectOption("kassel");
await page.locator("#nb-save-prayer-config").click();
const st=await page.evaluate(()=>window.NADIAS_BLOOM_QA.read());
ck(st.settings.nbPrayer.mode==="auto"&&st.settings.nbPrayer.lat>50,"local astronomical prayer configured");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("iman"));
const prayers=await page.locator("#prayerRows").innerText();
ck(/Fajr/.test(prayers)&&/\d\d:\d\d/.test(prayers),"calculated prayer schedule appears");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("happy"));
ck(await page.locator("#nb-avatar-photo").count()===1,"friendly face exists");
await page.locator("#nb-avatar-enlarge").click();
ck(await page.locator("#nb-happy-avatar").evaluate(el=>el.classList.contains("nb-avatar-zoom")),"face can be enlarged");
await page.locator("#nb-avatar-dismiss").click();
ck(!(await page.locator("#nb-happy-avatar").evaluate(el=>el.classList.contains("nb-avatar-zoom"))),"face can be closed");
await page.locator("#nb-avatar-mode").selectOption("illustration");
await page.locator("#nb-avatar-hijab").selectOption("no");
ck(await page.locator("#nb-hair").isVisible(),"no-hijab hair illustration");
await page.locator("#nb-avatar-hijab").selectOption("yes");
ck(!(await page.locator("#nb-hair").isVisible()),"hijab illustration");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("buch"));
ck(await page.locator("#nb-auth-logged-out").isVisible(),"optional auth form");
await page.locator("#nb-auth-email").fill("fiction@example.test");
await page.locator("#nb-auth-password").fill("SyntheticPassword1234!");
await page.locator("#nb-email-code").click();
await page.waitForFunction(()=>document.querySelector("#nb-auth-status").textContent.includes("Postfach"));
ck(calls.some(x=>x.path.endsWith("/otp")),"email OTP request via isolated Supabase route");
await page.locator("#nb-auth-otp").fill("123456");
await page.locator("#nb-verify-code").click();
await page.waitForFunction(()=>!document.querySelector("#nb-auth-logged-in").hidden);
ck(await page.locator("#nb-auth-logged-in").isVisible(),"synthetic OTP verification session");
ck((await page.locator("#nb-auth-status").innerText()).includes("nicht"),"logged-in privacy/no sync notice");
await page.locator("#nb-logout").click();
ck(await page.locator("#nb-auth-logged-out").isVisible(),"logout");
await page.locator("#nb-recover-password").click();
await page.waitForFunction(()=>document.querySelector("#nb-auth-status").textContent.includes("Wiederherstellungs")||document.querySelector("#nb-auth-status").textContent.includes("Passwort-Link"));
ck(calls.some(x=>x.path.endsWith("/recover")),"password recovery request mocked");
ck(errors.length===0,"zero browser exceptions "+errors.join(", "));
const over=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);ck(over<=3,"no horizontal overflow: "+over);
results.push({label,checks,requests:calls.map(x=>x.path)});await context.close();
}
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({status:"PASS_NADIA_V27_ASTRONOMY_CALENDAR_AVATAR_AUTH_MOCK",totalChecks:results.reduce((s,x)=>s+x.checks,0),results,noLiveEmailSent:true,noActualGeminiCall:true,noPatientData:true},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
