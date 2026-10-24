#!/usr/bin/env node
"use strict";
/* Read-only external API smoke test: no patients, no raw omics or protected fields. */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();const errors=[];
  page.on("pageerror",e=>errors.push(String(e.message)));
  const url="https://pigapocket.com/cancer-system-state/evidence";
  const res=await page.goto(url,{waitUntil:"domcontentloaded",timeout:25000});
  assert(res && res.ok(),"canonical evidence route must be HTTP success");
  assert((await page.title()).includes("Evidence Workbench"),"canonical workbench loaded");
  const outcomes=[];
  for(const item of [
   {id:"load-gdc",status:"gdc-status",source:"NCI GDC"},
   {id:"load-cbio",status:"cbio-status",source:"cBioPortal"}]){
    await page.locator("#"+item.id).click();
    try {await page.waitForFunction(id=>{
      const text=document.getElementById(id).textContent||"";
      return /^(Loaded|Catalogue unavailable)/.test(text);
    },item.status,{timeout:14500});}
    catch(e) { /* explicit status after bounded timeout below */ }
    const status=(await page.locator("#"+item.status).innerText()).trim();
    const loaded=/^Loaded \d+ PUBLIC catalogue records/.test(status);
    outcomes.push({source:item.source,loaded,status:status.slice(0,260)});
  }
  assert((await page.locator("#passport-status").innerText()).includes("Gate 2: BLOCK"),"clinical gate always BLOCK");
  assert(errors.length===0,"No uncaught browser exceptions: "+errors.join(";"));
  console.log("PIGA_PUBLIC_CATALOGUE_SMOKE="+JSON.stringify({status:outcomes.every(x=>x.loaded)?"LIVE_BOTH_AVAILABLE":outcomes.some(x=>x.loaded)?"LIVE_PARTIAL":"LIVE_SOURCE_UNAVAILABLE",url: url,sources:outcomes,clinicalGate2:"BLOCK",patientsQueried:0,rawOmicsQueried:0,providerOutageNonfatal:true},null,2));
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});