#!/usr/bin/env node
"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict"),path=require("node:path");
(async()=>{
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]}),result=[];
try{
for(const [label,viewport] of [["desktop",{width:1280,height:900}],["mobile",{width:390,height:844}]]){
const context=await browser.newContext({viewport,acceptDownloads:true});const page=await context.newPage();let checks=0;const errors=[],network=[];page.on("pageerror",e=>errors.push(e.message));page.on("request",e=>{if(e.url().startsWith("http"))network.push(e.url())});const ck=(v,m)=>{assert(v,label+": "+m);checks++};
await page.goto("file://"+path.resolve("nadias-bloom/index.html"));
ck((await page.title()).includes("Nadia"),"title");
ck(await page.locator("#nb-quickstart-title").count()===1,"instant book onboarding");
ck(await page.locator(".nb-step").count()===4,"four start cards");
const qa=await page.evaluate(()=>window.NADIAS_BLOOM_QA&&({version:window.NADIAS_BLOOM_QA.version,duaCount:window.NADIAS_BLOOM_QA.duaCount,gate2:window.NADIAS_BLOOM_QA.gate2}));
ck(qa?.duaCount===365,"365 book-labelled dua entries");
ck(qa?.gate2==="CONFIRM_REQUIRED","action confirmation");
ck(qa?.version==="v27-portrait-avatar-calendar-prayer","version marker");
ck(await page.locator("[data-view]").count()>25,"all primary navigation areas");
await page.locator("#view-start .nb-step[data-view=aufgaben]").click();
ck(await page.locator("#view-aufgaben").isVisible(),"navigate to tasks from first view");
await page.locator("#taskForm [name=title]").fill("Fiktiv: Brot besorgen");await page.locator("#taskForm button").click();
ck((await page.locator("#taskList").innerText()).includes("Brot besorgen"),"task saved");
await page.locator("#view-start").count();
await page.locator(".sidebar [data-view=einkauf]").first().evaluate(el=>el.click());
ck(await page.locator("#view-einkauf").isVisible(),"shopping module navigation");
await page.locator("#shopForm [name=title]").fill("Fiktiver Reis");await page.locator("#shopForm button").click();
ck((await page.locator("#shopList").innerText()).includes("Fiktiver Reis"),"shopping list save");
await page.locator("[data-view=happy]").first().evaluate(el=>el.click());
ck(await page.locator("#view-happy").isVisible(),"Happy module accessible");
ck(!(await page.locator("#happyOnline").isChecked()),"online AI opt-in off");
await page.locator("#happyInput").fill("Was steht auf meiner Einkaufsliste?");
await page.locator("#happySend").click();
ck((await page.locator("#happyChat").innerText()).includes("Fiktiver Reis"),"Happy local reads shopping");
ck(network.length===0,"no external API calls in local mode");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("iman"));
ck((await page.locator("#duaText").innerText()).length>10,"actual book dua shown");
await page.evaluate(()=>window.NADIAS_BLOOM_QA.setView("buch"));
ck(await page.locator("#backup").isVisible(),"backup module");
ck(await page.locator('.nb-promo a[href*="amazon.de/s?k=BARAKAH"]').count()===1,"Amazon book search available");
ck(await page.locator(".nb-excerpts blockquote").count()===2,"public previews only");
ck(await page.locator('a[href*="drive.google.com/file/d/1_rZL"]').count()===0,"full book PDF not exposed");
ck(await page.locator('a[href="/nadias-bloom/download"]').count()===1,"Android/iPhone offline HTML link");
ck(await page.locator('a[href*="nadias-bloom/legacy"]').count()===1,"legacy recovery link");
const bad=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(x=>x.getAttribute("href")).filter(h=>h.length>1&&!document.getElementById(h.slice(1))&&h!=="#start"));
ck(bad.length===0,"internal links anchored");
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
ck(overflow<=2,"no horizontal overflow "+overflow);
ck(errors.length===0,"no runtime JS errors "+errors.join(";"));
result.push({label,checks,overflow});await context.close();
}
}finally{await browser.close()}
console.log(JSON.stringify({status:"PASS_NADIAS_BLOOM_26_1",checks:result.reduce((s,x)=>s+x.checks,0),result,pigaRootVoiceEdited:false,onlineApiCalled:false},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
