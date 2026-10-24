#!/usr/bin/env node
"use strict";
const {chromium}=require("playwright"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const filename=path.resolve("cancer-system-state/index.html");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 let pass=0,checks=[],errors=[];
 const go=async(viewport,label,scheme)=>{
  const ctx=await browser.newContext({viewport,acceptDownloads:true,reducedMotion:"reduce"});
  const page=await ctx.newPage();page.on("pageerror",e=>errors.push(label+": "+e.message));
  const url="file://"+filename;await page.goto(url,{waitUntil:"load",timeout:20000});
  const check=(cond,msg)=>{assert(cond,label+": "+msg);checks.push(label+" · "+msg);pass++};
  check(await page.title()==="Cancer as a Legitimate System State | Research Companion · Mounir Akarkach","page title");
  check(await page.locator("#profile-list [data-profile]").count()===50,"50 profiles displayed");
  check(await page.locator("#axes .axis").count()===7,"seven A7SEM dimensions");
  check(await page.locator("#model-chart polyline").count()===2,"baseline and current plotted");
  check(await page.locator("#gate-result").innerText().then(x=>x.includes("Gate 1: DELAY")&&x.includes("Gate 2: BLOCK")),"initial documentary DELAY");
  const initial=await page.locator("#final-index").innerText();
  await page.locator("#adaptation").evaluate(el=>{el.value="92";el.dispatchEvent(new Event("input",{bubbles:true}))});
  check(await page.locator("#final-index").innerText()!==initial,"toy dynamics responds to parameter change");
  await page.locator("#search").fill("glioblastoma");
  check(await page.locator("#profile-list [data-profile]").count()===1,"filter research profile");
  await page.locator("#profile-list [data-profile]").first().click();
  check((await page.locator("#profile-title").innerText()).includes("Glioblastoma"),"select chapter");
  await page.locator("#alternative").check();await page.locator("#falsifiable").check();await page.locator("#evaluate").click();
  check((await page.locator("#gate-result").innerText()).includes("Gate 1: ALLOW"),"documentary ALLOW with all evidence prerequisites");
  await page.locator("#contradiction").check();await page.locator("#evaluate").click();
  check((await page.locator("#gate-result").innerText()).includes("Gate 1: BLOCK"),"counterevidence BLOCK");
  await page.locator("#reverse").click();
  check(await page.locator("#reverse-result").isVisible(),"A7SEM Reverse displays");
  const [dlJ]=await Promise.all([page.waitForEvent("download"),page.locator("#export-json").click()]);
  check(dlJ.suggestedFilename().endsWith(".json"),"research passport JSON download");
  const exportFile=path.join(require("node:os").tmpdir(),"cancer-syn-"+label+".json");await dlJ.saveAs(exportFile);
  const json=JSON.parse(fs.readFileSync(exportFile,"utf8"));fs.rmSync(exportFile,{force:true});
  check(json.gate2==="BLOCK"&&json.trajectory.length===25&&json.profile.number===34,"passport safety and content");
  const [dlC]=await Promise.all([page.waitForEvent("download"),page.locator("#export-csv").click()]);
  check(dlC.suggestedFilename().endsWith(".csv"),"toy trajectory CSV download");
  await page.locator("#reset").click();
  check((await page.locator("#gate-result").innerText()).includes("Gate 1: DELAY"),"reset restores documentary hold");
  const local=await page.locator("a[href]").evaluateAll(a=>a.map(x=>x.getAttribute("href")).filter(x=>x.startsWith("#")));
  const bad=await page.evaluate(()=>[...document.querySelectorAll("a[href^='#']")].map(a=>a.getAttribute("href").slice(1)).filter(id=>!document.getElementById(id)));
  check(bad.length===0,"zero broken local anchor links");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(overflow<=2,"no horizontal viewport overflow");
  check(errors.filter(x=>x.startsWith(label+":")).length===0,"zero JS runtime errors");
  await ctx.close();
 };
 try{
  await go({width:1280,height:850},"desktop");
  await go({width:390,height:844},"mobile");
  const src=fs.readFileSync(filename);let count=0;
  const text=src.toString("utf8");
  for(let i=0;i<50;i++){assert(text.includes(String.fromCharCode(34)));}
  assert(!/\bfetch\s*\(|XMLHttpRequest|new WebSocket\s*\(/.test(text),"No network calls allowed inside app");
  assert(text.includes("GATE 2 · ALL CLINICAL ACTIONS BLOCKED"),"Clinical warning required");
  console.log(JSON.stringify({result:"PASS_CANCER_BOOK_COMPANION",uiChecks:pass,profiles:50,dimensions:7,desktop:true,mobile:true,fileOffline:true,downloads:["json","csv"],gate2:"BLOCK",sourceSha256:crypto.createHash("sha256").update(src).digest("hex"),browserErrors:errors},null,2));
 }catch(e){console.error("CANCER_COMPANION_QA_FAILED",e.stack||e);process.exitCode=1;}
 finally{await browser.close()}
})();