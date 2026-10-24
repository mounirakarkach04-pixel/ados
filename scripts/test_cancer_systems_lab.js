#!/usr/bin/env node
"use strict";
/* Cancer Systems Lab book companion — actual offline/browser QA.
 * All trials are toy mathematical scenarios; no real patients or clinical actions.
 */
const {chromium}=require("playwright"),fs=require("node:fs"),path=require("node:path"),os=require("node:os"),assert=require("node:assert/strict");
const source=path.resolve("cancer/index.html");
const companion="https://mounirakarkach04-pixel.github.io/ados/cancer-system-state/index.html";
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});let checks=0;
 try{
  for(const [label,viewport] of [["desktop",{width:1280,height:900}],["android-size",{width:390,height:844}]]){
   const context=await browser.newContext({acceptDownloads:true,viewport,reducedMotion:"reduce"}),page=await context.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   const check=(v,why)=>{assert(v,label+" "+why);checks++};
   await page.goto("file://"+source,{waitUntil:"load"});
   check((await page.title()).includes("Cancer Systems Lab"),"page title");
   check((await page.locator(".author").innerText()).includes("MOUNIR AKARKACH"),"author");
   check(await page.locator("#dynamics-chart").count()===1,"toy dynamics visible");
   check(await page.locator("#network-chart").count()===1,"network graphic visible");
   check(await page.locator("#gate-status").innerText().then(x=>/BLOCK|DELAY|UNKNOWN/.test(x)),"documentary Gate 1 state present");
   const first=await page.locator("#growth-value").innerText();
   await page.locator("#growth").evaluate(el=>{el.value="92";el.dispatchEvent(new Event("input",{bubbles:true}))});
   check((await page.locator("#growth-value").innerText())!==first,"slider input connected");
   await page.locator("#gate-run").click();
   check((await page.locator("#gate-status").innerText()).length>7,"Gate 1 gate run");
   const [guide]=await Promise.all([page.waitForEvent("download"),page.locator("#download-guide").click()]);
   check(guide.suggestedFilename().endsWith(".txt"),"study guide downloads");
   const [app]=await Promise.all([page.waitForEvent("download"),page.locator("#download-app").click()]);
   check(app.suggestedFilename()==="CANCER_SYSTEMS_LAB_OFFLINE_20261024.html","entire offline app downloaded");
   const tmp=path.join(os.tmpdir(),"cancer-systems-lab-"+label+".html");await app.saveAs(tmp);
   const offline=await context.newPage();
   try{await offline.goto("file://"+tmp,{waitUntil:"load"});check(await offline.locator("#gate-run").count()===1,"offline UI bootstraps");await offline.locator("#gate-run").click();check((await offline.locator("#gate-status").innerText()).length>7,"offline Gate 1 works");}finally{await offline.close();fs.rmSync(tmp,{force:true})}
   check(await page.locator('a[href="'+companion+'"]').count()>0,"50-profile book app linked");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   check(overflow<=2,"no horizontal overflow "+overflow);
   const dead=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].filter(x=>!document.getElementById(x.getAttribute("href").slice(1))).map(x=>x.getAttribute("href")));
   check(dead.length===0,"no broken anchor "+dead.join(","));
   check(errors.length===0,"no script exceptions "+errors.join("; "));
   await context.close();
  }
  const html=fs.readFileSync(source,"utf8");assert(/Gate 2[\s\S]{0,160}BLOCK/i.test(html),"Clinical Gate 2 BLOCK warning required");checks++;
  console.log(JSON.stringify({result:"PASS_CANCER_SYSTEMS_LAB",checks,headlessChromium:true,desktop:true,mobileWidth390:true,offlineSavedFile:true,toyGate2:"BLOCK",patients:0,sourceBytes:Buffer.byteLength(html)},null,2));
 }catch(e){console.error("SYSTEMS_LAB_FAIL",e.stack||String(e));process.exitCode=1;}finally{await browser.close()}
})();