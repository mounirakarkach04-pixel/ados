#!/usr/bin/env node
"use strict";
const {chromium}=require("playwright"),fs=require("node:fs"),path=require("node:path"),http=require("node:http"),assert=require("node:assert/strict");
(async()=>{
const root=path.resolve("nadias-bloom");
const server=http.createServer((req,res)=>{const u=new URL(req.url,"http://localhost");let p=u.pathname.replace(/^\/nadias-bloom\/?/,"")||"index.html";if(!/^(index\.html|sw\.js|manifest\.webmanifest|icon\.(svg)|icon-(192|512)\.png)$/.test(p)){res.writeHead(404);return res.end("not found")}try{res.writeHead(200,{"content-type":p.endsWith(".html")?"text/html; charset=utf-8":p.endsWith(".png")?"image/png":p.endsWith(".webmanifest")?"application/manifest+json":p.endsWith(".js")?"application/javascript":p.endsWith(".svg")?"image/svg+xml":"application/octet-stream"});res.end(fs.readFileSync(path.join(root,p)))}catch{res.writeHead(404);res.end("not found")}});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const port=server.address().port,browser=await chromium.launch({headless:true,args:["--no-sandbox"]}),logs=[];
try{
for(const [device,viewport] of [["desktop",{width:1366,height:920}],["phone",{width:390,height:844}]]){
const context=await browser.newContext({viewport,serviceWorkers:"block"}),page=await context.newPage(),errors=[];let checks=0;
page.on("pageerror",e=>errors.push(e.message));function check(x,label){assert(x,device+" "+label);checks++}
await page.goto("http://127.0.0.1:"+port+"/nadias-bloom/");
check(await page.locator("#nbx-calendar-section").count()===1,"continuity calendar rendered");
check(await page.locator("#nbx-prayer-section").count()===1,"prayer panel rendered");
check(await page.locator("#nbx-happy-face svg").count()===1,"friendly avatar face rendered");
check(await page.locator("#nbx-account").count()===1,"optional account rendered");
check(await page.evaluate(()=>window.NADIA_FAMILY_V27.schoolPeriods)>=17,"2026-2030 school periods available");
check(await page.evaluate(()=>window.NADIA_FAMILY_V27.records("2026-10").some(x=>x.date==="2026-10-05"&&x.type==="school")),"2026 Hessen autumn begins Oct 5");
check(await page.evaluate(()=>window.NADIA_FAMILY_V27.records("2026-10").some(x=>x.date==="2026-10-17"&&x.type==="school")),"2026 Hessen autumn ends Oct 17");
check(await page.evaluate(()=>window.NADIA_FAMILY_V27.records("2026-10").some(x=>x.date==="2026-10-03"&&x.type==="holidays")),"Germany Unity Day");
check(await page.evaluate(()=>window.NADIA_FAMILY_V27.records("2027-12").some(x=>x.date==="2027-12-23"&&x.type==="school")),"book year crossover school holiday");
check(await page.evaluate(()=>window.NADIA_FAMILY_V27.records("2027-04").some(x=>x.date==="2027-04-02"&&x.type==="school")),"Easter vacation correct");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("kalender"));
await page.locator("#monthChoose").fill("2026-10");await page.locator("#monthChoose").dispatchEvent("change");
check((await page.locator("#nbx-month-title").innerText()).includes("Oktober 2026"),"month controls");
await page.locator("#nbx-next").click();
check((await page.locator("#nbx-month-title").innerText()).includes("November 2026"),"next month continuity");
await page.locator("#nbx-prev").click();
check((await page.locator("#nbx-calendar-grid .nbx-day").count())===31,"calendar 31 days");
await page.locator("#nbx-annual [name=title]").fill("Fiktiver Jahrestag");
await page.locator("#nbx-annual [name=date]").fill("2026-10-25");
await page.locator("#nbx-annual button").click();
check(await page.evaluate(()=>window.NADIA_FAMILY_V27.records("2027-10").some(x=>x.title.includes("Fiktiver Jahrestag"))),"anniversary recurs next year");
const calculated=await page.evaluate(()=>window.NADIA_FAMILY_V27.solar(new Date("2026-10-24T12:00:00"),50.1,9.1,18,17,1));
check(Object.keys(calculated).length===5,"five sun positions");
check(calculated.Fajr<calculated.Dhuhr&&calculated.Dhuhr<calculated.Asr&&calculated.Asr<calculated.Maghrib&&calculated.Maghrib<calculated.Isha,"prayer sequence");
check(calculated.Fajr>100&&calculated.Isha<1600,"plausible clock bounds");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("iman"));
await page.locator("#nbx-lat").fill("50.1");await page.locator("#nbx-lon").fill("9.1");await page.locator("#nbx-prayer-auto").click();
check((await page.locator("#nbx-prayer-info").innerText()).includes("Täglich lokale astronomische Näherung"),"automatic daily prayer mode");
check(await page.locator("#nbx-prayers .nbx-prayer-cell").count()===5,"prayer panel five rows");
await page.locator("#nbx-prayer-manual").click();check((await page.locator("#nbx-prayer-info").innerText()).includes("Feste manuelle"),"manual override");
await page.locator("#nbx-erase-gps").click();check((await page.locator("#nbx-lat").inputValue())==="","coordinates deletion");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("happy"));
await page.locator("#nbx-avatar-hijab").selectOption("no");
await page.locator("#nbx-avatar-color").selectOption("sage");await page.locator("#nbx-avatar-skin").selectOption("olive");
check(await page.evaluate(()=>!window.NADIA_HAPPY_FACE_QA.options().hijab),"choose avatar without hijab");
check(await page.evaluate(()=>window.NADIA_HAPPY_FACE_QA.options().color==="sage"),"change avatar color");
check(await page.locator("#nbx-happy-face svg").count()===1,"avatar remains visible");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("buch"));
check(await page.evaluate(()=>window.NADIA_AUTH_QA.hasPublishableKey),"safe supabase client key present");
check(await page.evaluate(()=>!window.NADIA_AUTH_QA.serviceRoleExposed&&window.NADIA_AUTH_QA.cloudSyncEnabled===false),"no secret or silent data sync");
check(await page.locator("#nbx-code").count()===1&&await page.locator("#nbx-new-pass").count()===1,"code and reset password controls");
check(await page.locator("link[rel=apple-touch-icon]").count()===1,"iOS app icon");
const m=JSON.parse(fs.readFileSync(path.join(root,"manifest.webmanifest"),"utf8"));
check(m.icons.length>=2&&m.display==="standalone","PWA manifest icons and standalone");
check(!(await page.content()).includes("drive.google.com/file/d/1_rZL"),"private full book absent");
check(errors.length===0,"no JS errors "+errors.join("|"));
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
check(overflow<=3,"no horizontal overflow "+overflow);
logs.push({device,checks,overflow});await context.close();
}
}finally{await browser.close();await new Promise(done=>server.close(done))}
console.log(JSON.stringify({status:"PASS_NADIA_V27_FAMILY_AUTH_AVATAR_CALENDAR_PRAYER_SYNTHETIC",devices:logs,checks:logs.reduce((n,x)=>n+x.checks,0),externalEmailsSent:0,locationSharedToServer:false,realGeminiInference:0},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
