#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),path=require("node:path"),fs=require("node:fs");
const {chromium}=require("playwright");
const file=path.resolve("la-preuve-avant-le-diagnostic/LA_PREUVE_LAB_ANDROID_TOUT_EN_UN_OFFLINE.html");
async function check(){
 const raw=fs.readFileSync(file,"utf8");
 assert(raw.length>240000);
 for(const label of ["index.html","app.html","studio.html","workbench.html","evaluation.html","licence.html","confidentialite.html"])
  assert(raw.includes(label),"missing "+label);
 const m=raw.match(/<script>([\s\S]+)<\/script>/);
 assert(m);new Function(m[1]);
 const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-web-security"]});
 const results=[];
 try{
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:850},acceptDownloads:true});
   const errors=[];page.on("pageerror",err=>errors.push(String(err)));
   await page.goto("file://"+file,{waitUntil:"load"});
   await page.waitForFunction(()=>window.LA_PREUVE_ANDROID_ALL_IN_ONE?.getState().current==="app.html");
   const nav=page.locator("#offline-nav");
   assert.equal(await nav.locator("button").count(),7);
   const iframe=page.frameLocator("#workspace");
   await iframe.locator("#lot-demo").waitFor({timeout:15000});
   await iframe.locator('[data-tab="lots"]').first().click();
   await iframe.locator("#lot-demo").click();
   await iframe.locator("#lot-run").click();
   assert.equal(await iframe.locator("#lot-output tbody tr").count(),100,"100 CSV rows");
   await iframe.locator("a[href='workbench.html']").first().click();
   await page.waitForFunction(()=>window.LA_PREUVE_ANDROID_ALL_IN_ONE.getState().current==="workbench.html");
   await iframe.locator("#rounds").selectOption("2");
   await iframe.locator("#run").click();
   assert.equal((await iframe.locator("#m-total").innerText()).trim(),"96","96 QM rows");
   await nav.locator('button[data-page="studio.html"]').click();
   await iframe.locator("#waffle .dot").first().waitFor({timeout:15000});
   assert.equal(await iframe.locator("#waffle .dot").count(),1000,"1000 Bayes icons");
   await nav.locator('button[data-page="evaluation.html"]').click();
   await iframe.locator("#begin").waitFor();
   assert(await iframe.locator("#begin").isDisabled(),"study consent gate");
   await nav.locator('button[data-page="index.html"]').click();
   await iframe.locator(".ak-welcome").first().waitFor();
   await nav.locator('button[data-page="licence.html"]').click();
   assert((await iframe.locator("body").innerText()).length>100,"licence");
   await nav.locator('button[data-page="confidentialite.html"]').click();
   assert((await iframe.locator("body").innerText()).length>100,"privacy");
   const state=await page.evaluate(()=>window.LA_PREUVE_ANDROID_ALL_IN_ONE.getState());
   assert.equal(state.errors.length,0,"frame event errors");
   assert.equal(state.gate2,"BLOCK");
   assert.equal(errors.length,0,JSON.stringify(errors));
   results.push({width,opened:state.opened,iframeErrors:state.errors.length,uncaughtErrors:errors.length,g2:state.gate2,modules:await nav.locator("button").count()});
   await page.close();
  }
 }finally{await browser.close()}
 console.log(JSON.stringify({status:"PASS_ANDROID_ALL_IN_ONE",fileBytes:raw.length,results},null,2));
}
check().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
