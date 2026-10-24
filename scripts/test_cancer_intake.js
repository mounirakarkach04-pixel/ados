#!/usr/bin/env node
"use strict";
const {chromium}=require("playwright");
const path=require("node:path");
const assert=require("node:assert/strict");
(async()=>{
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});const result=[];
try{
for(const [label,viewport] of [["desktop",{width:1280,height:900}],["mobile",{width:390,height:844}]]){
const context=await browser.newContext({viewport,acceptDownloads:true});const page=await context.newPage();const errors=[];let checks=0;page.on("pageerror",e=>errors.push(e.message));const ck=(ok,msg)=>{assert(ok,label+" / "+msg);checks++};
await page.goto("file://"+path.resolve("cancer-system-state/intake.html"));
ck(await page.title().then(t=>t.includes("Evidence Intake")),"title");
ck(await page.locator('input[type="file"]').count()===1,"file upload");
ck(await page.locator("#kind").count()===1,"source classification");
ck(await page.locator("#purpose").count()===1,"intended purpose");
ck(await page.locator("#state").innerText().then(x=>x.includes("UNKNOWN")),"initial unknown");
ck(await page.locator("footer").innerText().then(x=>x.includes("Clinical Gate 2: BLOCK")),"clinical gate2");
ck(await page.locator("#ai-act a[href*='eur-lex.europa.eu']").count()===2,"official legal sources");
ck(await page.locator("#next a").count()===4,"follow-up application links");
await page.locator("#sample").click();await page.locator("#evidenceForm button[type=submit]").click();
ck(await page.locator("#state").innerText().then(x=>x.includes("ALLOW")),"synthetic full metadata research admission");
ck(await page.locator("#coverage").innerText()==="100%","coverage presence");
ck(await page.locator("#gapsCount").innerText()==="0","no synthetic metadata gaps");
ck(await page.locator("#export").isEnabled(),"JSON export available");
const p=await page.evaluate(()=>window.PIGA_CANCER_INTAKE_QA.getReport());
ck(p.gate2==="BLOCK_CLINICAL","no clinical action");
ck(p.coverageMeaning.includes("NOT a diagnostic probability"),"nonprobabilistic statement");
ck(p.recordContainsNoRawUploadedData===true,"report excludes imported text");
ck(p.a7sem.length===7&&p.reverse.length===6,"seven stages and six reverse");
ck(p.gate1==="ALLOW"&&p.kind==="SYNTHETIC","no patient classification");
await page.locator("#kind").selectOption("PERSONAL");await page.locator("#evidenceForm button[type=submit]").click();
ck(await page.locator("#state").innerText().then(x=>x.startsWith("BLOCK")),"real patient hard block");
await page.locator("#kind").selectOption("SYNTHETIC");await page.locator("#purpose").selectOption("CLINICAL");await page.locator("#evidenceForm button[type=submit]").click();
ck(await page.locator("#state").innerText().then(x=>x.startsWith("BLOCK")),"individual clinical request blocked");
await page.locator("#purpose").selectOption("RESEARCH");await page.locator("#source").fill("");
await page.locator("#evidenceForm button[type=submit]").click();
ck(await page.locator("#state").innerText().then(x=>x.startsWith("UNKNOWN")),"missing provenance unknown");
await page.locator("#source").fill("Synthetic course sheet");
await page.locator("#method").fill("");await page.locator("#evidenceForm button[type=submit]").click();
ck(await page.locator("#state").innerText().then(x=>x.startsWith("DELAY")),"missing method delay");
await page.locator("#sample").click();await page.locator("#file").setInputFiles({name:"research.csv",mimeType:"text/csv",buffer:Buffer.from("marker,value,unit,date\nMarker-X,1.4,arbitrary,2026-01-01\n")});
ck(await page.locator("#fileStatus").innerText().then(x=>x.includes("File read locally")),"offline CSV parsing");
await page.locator("#evidenceForm button[type=submit]").click();
const downloadPromise=page.waitForEvent("download");await page.locator("#export").click();const download=await downloadPromise;
ck(download.suggestedFilename().endsWith(".json"),"passport download");
ck(errors.length===0,"no JavaScript runtime errors "+errors.join("|"));
const over=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
ck(over<=2,"no mobile overflow "+over);
result.push({label,checks,over});
await context.close();
}
}finally{await browser.close()}
console.log(JSON.stringify({status:"PASS_CANCER_INTAKE_V1",checks:result.reduce((s,r)=>s+r.checks,0),results:result,noPatientDiagnosis:true,clinicalGate2:"BLOCK"},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
