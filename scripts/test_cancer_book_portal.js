#!/usr/bin/env node
"use strict";
/* PIGA Gate 1: synthetic book-portal/browser QA. No medical or patient data. */
const {chromium}=require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const source=path.resolve("cancer-system-state/book.html");
(async()=>{
  const html=fs.readFileSync(source,"utf8");
  assert(html.includes("clinical Gate 2: BLOCK"),"Clinical limitation missing");
  assert(html.includes("Public Specialist Edition V119"),"Book provenance missing");
  assert(html.includes("/ados/cancer-system-state/index.html"),"Reader Atlas link missing");
  assert(html.includes("/ados/cancer/index.html"),"Systems Lab link missing");
  assert(!/<script/i.test(html),"Static book portal must not need a script");
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  let checks=0;const results=[];
  try{
    for(const [label,viewport] of [["desktop",{width:1280,height:900}],["mobile",{width:390,height:844}]]){
      const context=await browser.newContext({viewport,reducedMotion:"reduce"});
      const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
      const check=(ok,msg)=>{assert(ok,label+": "+msg);checks++};
      await page.goto("file://"+source,{waitUntil:"load"});
      check((await page.title()).includes("Cancer as a Legitimate System State"),"title");
      check(await page.locator("h1").count()===1,"one semantic H1");
      check(await page.locator("#apps article.card").count()===3,"three book-linked companion products");
      check(await page.locator("#sources .boundary").innerText().then(s=>s.includes("Gate 2: BLOCK")),"clinical BLOCK shown");
      check(await page.locator("a[href$='/cancer-system-state/index.html']").count()===1,"Reader Atlas direct link");
      check(await page.locator("a[href$='/cancer/index.html']").count()===1,"Systems Lab direct link");
      check(await page.locator("a[href*='drive.google.com/file/d/1t5Vg0H']").count()===2,"source book references");
      check(await page.locator("#buy").count()===1,"dedicated Amazon book section");
      check((await page.locator("#buy").innerText()).includes("Cancer as a Legitimate System State"),"named Amazon book");
      check(await page.locator('#apps a[href="https://pigapocket.com/cancer-system-state/evidence"]').count()===1,"Evidence Workbench canonical link");
      check(await page.locator("a[href$='/cancer-system-state/evidence-workbench.html']").count()===1,"Evidence Workbench public backup");
      check((await page.locator("#apps").innerText()).includes("stages A–E"),"clinical evidence stages described");
      const amazon=await page.locator("#amazon-de-link").getAttribute("href");
      check(amazon==="https://amzn.eu/d/09KbBTIE","author-provided Amazon book URL");
      check((await page.locator("#buy").innerText()).includes("redirect target has not been independently checked"),"Amazon short-link redirect unverified disclaimer");
      check(await page.locator("#amazon-us-link").count()===1,"Amazon.com backup search");
      check((await page.locator("#buy").innerText()).includes("research edition is separate"),"research vs retail edition boundaries");
      check((await page.locator("meta[name=description]").getAttribute("content")).includes("three free"),"SEO updated for three apps");
      const missing=await page.evaluate(()=>[...document.querySelectorAll("a[href^='#']")].map(a=>a.getAttribute("href")).filter(h=>h.length>1&&!document.getElementById(h.slice(1))));
      check(missing.length===0,"valid internal anchors "+missing.join(","));
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      check(overflow<=2,"no horizontal overflow "+overflow);
      check(errors.length===0,"no script errors");
      results.push({viewport:label,checks:20,overflow,errors:errors.length});
      await context.close();
    }
  }finally{await browser.close();}
  console.log(JSON.stringify({result:"PASS_BOOK_READY_PORTAL",checks,htmlSha256:crypto.createHash("sha256").update(html).digest("hex"),clinicalGate2:"BLOCK",noPatientData:true,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
