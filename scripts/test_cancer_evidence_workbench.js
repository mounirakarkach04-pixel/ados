#!/usr/bin/env node
"use strict";
/* Bounded PIGA/A7SEM Reverse browser QA. Strict nonclinical synthetic test fixtures. */
const {chromium}=require("playwright"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const source=path.resolve("cancer-system-state/evidence-workbench.html");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 let total=0;
 const checks=[];
 try{
 for(const [size,viewport] of [["desktop",{width:1280,height:900}],["android-sized",{width:390,height:844}]]){
  const context=await browser.newContext({viewport,acceptDownloads:true,reducedMotion:"reduce"});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  const test=(value,name)=>{assert(value,size+" "+name);total++;checks.push(name+" "+size)};
  await page.route("https://api.gdc.cancer.gov/**",route=>route.fulfill({status:200,contentType:"application/json",headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify({data:{hits:[{project_id:"TCGA-BRCA",name:"Breast Invasive Carcinoma",summary:{case_count:1098}}]}})}));
  await page.route("https://www.cbioportal.org/**",route=>route.fulfill({status:200,contentType:"application/json",headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify([{studyId:"brca_tcga_pub2015",name:"TCGA Breast",allSampleCount:1100}])}));
  await page.goto("file://"+source,{waitUntil:"load"});
  test((await page.title()).includes("Evidence Workbench"),"document title");
  test(await page.locator("#a7sem-list .entry").count()===7,"seven nonsequential A7SEM lenses");
  test((await page.locator("#passport-status").innerText()).includes("Gate 2: BLOCK"),"immutable clinical gate2");
  test((await page.locator("body").innerText()).includes("NOT INITIATED"),"clinical efficacy not falsely claimed");
  test((await page.locator("body").innerText()).includes("EU MDR"),"EU regulatory planning");
  test((await page.locator("body").innerText()).includes("FDA"),"FDA regulatory planning");
  const status=await page.evaluate(()=>window.PIGA_CANCER_RESEARCH.getStatus());
  test(status.gate2==="BLOCK"&&status.patientDataProcessed===false,"programmatic clinical protection");
  test(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=2,"responsive no overflow");
  await page.locator("#load-gdc").click();
  await page.waitForFunction(()=>document.querySelectorAll("#gdc-list .entry").length===1);
  test((await page.locator("#gdc-list").innerText()).includes("TCGA-BRCA"),"live API adapter GDC metadata mock");
  await page.locator("#load-cbio").click();
  await page.waitForFunction(()=>document.querySelectorAll("#cbio-list .entry").length===1);
  test((await page.locator("#cbio-list").innerText()).includes("brca_tcga_pub2015"),"live API adapter cBioPortal metadata mock");
  await page.locator("#example-omics").click();
  test((await page.locator("#omics-count").innerText())==="5","all five aggregate omics modes demo");
  test((await page.locator("#modality-count").innerText())==="5 / 5","all five coverage");
  test((await page.locator("#omics-status").innerText()).includes("NOT TCGA"),"synthetic demo correctly labeled");
  test((await page.locator("#evidence-gate").innerText())==="DELAY","unverified data never auto-ALLOW");
  const wrong="modality,cohort,feature,n,mean,sd,unit,source_url,patient_id\nproteomics,COHORT,GENE,100,1,1,U,https://example.org,person\n";
  const blocked=await page.evaluate(v=>{try{window.PIGA_CANCER_RESEARCH.testParseCSV(v);return false}catch(e){return /header/i.test(e.message)}},wrong);
  test(blocked,"reject patient_id CSV schema");
  const unauthorized="modality,cohort,feature,n,mean,sd,unit,source_url,access\nproteomics,PUBLIC_COHORT,GENE,100,1,1,U,https://example.org,controlled\n";
  test(await page.evaluate(v=>{try{window.PIGA_CANCER_RESEARCH.testParseCSV(v);return false}catch(e){return /public source/.test(e.message)}},unauthorized),"reject nonpublic data records");
  await page.locator("#benchmark-cohort").fill("PUBLIC_HOLDOUT_COHORT");
  await page.locator("#benchmark-base").fill("0.70");
  await page.locator("#benchmark-cand").fill("0.72");
  await page.locator("#benchmark-n").fill("100");
  await page.locator("#benchmark-source").fill("https://example.org/public-benchmark");
  await page.locator("#benchmark-run").click();
  test((await page.locator("#benchmark-status").innerText()).includes("NOT proof"),"benchmark has no superiority assertion");
  await page.locator("#hyp-evidence").fill("Public dataset / accession");
  await page.locator("#hyp-falsify").fill("A properly powered test shows no compensatory pathway effect");
  await page.locator("#hyp-build").click();
  test((await page.locator("#hyp-status").innerText()).includes("not a patient-level"),"resistance hypothesis nonclinical");
  await page.locator("#lab-endpoint").fill("Prespecified assay plus negative controls");
  await page.locator("#lab-protocol").fill("Three biological replicates, blinded controls, documented failures.");
  await page.locator("#lab-build").click();
  test((await page.locator("#lab-status").innerText()).includes("0 experiments"),"wet-lab results never invented");
  await page.locator("#trial-conditions").fill("Independent IRB review, prospectively registered randomized design, prespecified safety monitoring.");
  await page.locator("#trial-build").click();
  test((await page.locator("#trial-status").innerText()).includes("No trial approval"),"prospective trial not fabricated");
  const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#export-passport").click()]);
  test(dl.suggestedFilename().endsWith(".json"),"research passport downloadable");
  const saved=path.join(require("node:os").tmpdir(),"piga-evidence-"+size+".json");await dl.saveAs(saved);
  const passport=JSON.parse(fs.readFileSync(saved,"utf8"));fs.unlinkSync(saved);
  test(passport.gate2==="BLOCK"&&!passport.validations.executedWetLab&&!passport.validations.prospectiveTrial,"JSON provenance and clinical lock");
  test(passport.multiOmics.rows.length===5&&passport.a7sem.length===7,"JSON reproduces metadata and axes");
  const [csv]=await Promise.all([page.waitForEvent("download"),page.locator("#export-csv").click()]);
  test(csv.suggestedFilename().endsWith(".csv"),"aggregate CSV export");
  const [template]=await Promise.all([page.waitForEvent("download"),page.locator("#template-omics").click()]);
  test(template.suggestedFilename().includes("TEMPLATE"),"strict CSV import template");
  const [offlineDownload]=await Promise.all([page.waitForEvent("download"),page.locator("#download-workbench").click()]);
  test(offlineDownload.suggestedFilename().endsWith(".html"),"standalone full HTML app exported");
  const offlinePath=path.join(require("node:os").tmpdir(),"piga-evidence-offline-"+size+".html");
  await offlineDownload.saveAs(offlinePath);
  const offline=await context.newPage();
  try{
    await offline.goto("file://"+offlinePath,{waitUntil:"load"});
    test(await offline.locator("#load-gdc").count()===1,"offline app boots with public catalog controls");
    test((await offline.locator("#passport-status").innerText()).includes("Gate 2: BLOCK"),"offline downloaded app Gate2 BLOCK");
    test(await offline.evaluate(()=>window.PIGA_CANCER_RESEARCH.getStatus().gate2==="BLOCK"),"offline script operates without backend");
  }finally{await offline.close();fs.unlinkSync(offlinePath);}

  const missing=await page.evaluate(()=>[...document.querySelectorAll("a[href^='#']")].map(n=>n.getAttribute("href")).filter(h=>h.length>1&&!document.getElementById(h.slice(1))));
  test(missing.length===0,"all internal anchors valid");
  test(errors.length===0,"no JavaScript exceptions");
  test(await page.evaluate(()=>window.PIGA_CANCER_RESEARCH.getStatus().gate2==="BLOCK"),"post-interaction Gate2 stays BLOCK");
  await context.close();
 }
 }finally{await browser.close()}
 console.log(JSON.stringify({status:"PASS_EVIDENCE_WORKBENCH",checks:total,viewports:["1280","390"],clinicalGate2:"BLOCK",patientDataProcessed:false,externalCalls:"stubbed; real provider connectivity requires separate live check",assertions:checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
