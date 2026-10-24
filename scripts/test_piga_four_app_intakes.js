#!/usr/bin/env node
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
 for(const [platform,viewport] of [['desktop',{width:1280,height:900}],['android-sized',{width:390,height:844}]]){
 for(const [name,file] of [['ADOS','research-intake.html'],['LA_PREUVE_LAB','la-preuve-avant-le-diagnostic/intake.html']]){
  const ctx=await browser.newContext({viewport,acceptDownloads:true});const page=await ctx.newPage(),errors=[];let checks=0;
  page.on('pageerror',e=>errors.push(e.message));const ck=(p,m)=>{assert(p,platform+' '+name+' '+m);checks++};
  await page.goto('file://'+path.resolve(file));
  ck(await page.locator('#auditForm').count()===1,'manual evidence form');
  ck(await page.locator('#file').count()===1,'file upload');
  ck(await page.locator('#vbr').count()===1,'VBR evidence panel');
  ck(await page.locator('#kind option').count()===4,'four source types');
  ck(await page.locator('#purpose option').count()===3,'governed purpose');
  ck(await page.locator('#status').innerText().then(x=>x.includes('UNKNOWN')),'initial unknown');
  await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.sample());
  await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.run());
  const good=await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.report());
  ck(good?.gate1==='ALLOW' && good?.gate2.startsWith('BLOCK'),'research metadata allow, clinical Gate2 block');
  ck(good?.a7sem.length===7 && good?.a7semReverse.length===6,'A7SEM dimensions + reverse challenges');
  ck(good?.rawDocumentExported===false,'no raw document in report');
  ck(good?.vbr.status==='UNVERIFIED','no invented verified non-execution');
  await page.locator('#vbr-input summary').click();
  await page.locator('#risk').fill('Synthetic unauthorized sharing risk');
  await page.locator('#blockProof').fill('Fictional gate2 denial record');
  await page.locator('#indProof').fill('Self reported system check, unverified');
  await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.run());
  const risk=await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.report());
  ck(risk.vbr.status==='SELF_REPORTED_EVIDENCE_CANDIDATE_NOT_VERIFIED' && risk.vbr.actualExternalNonExecutionVerified===false,'VBR candidate never automatically verified');
  await page.locator('#purpose').selectOption('CLINICAL');
  await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.run());
  ck(await page.locator('#status').innerText().then(x=>x.includes('BLOCK')),'clinical requests block');
  await page.locator('#purpose').selectOption('RESEARCH');
  await page.locator('#kind').selectOption('PERSONAL');
  await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.run());
  ck(await page.locator('#status').innerText().then(x=>x.includes('BLOCK')),'identifiable data block');
  await page.locator('#kind').selectOption('SYNTHETIC');
  await page.locator('#source').fill('');
  await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.run());
  ck(await page.locator('#status').innerText().then(x=>x.includes('UNKNOWN')),'missing source unknown');
  await page.locator('#source').fill('Fictional study source');
  await page.locator('#method').fill('');
  await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.run());
  ck(await page.locator('#status').innerText().then(x=>x.includes('DELAY')),'missing method delay');
  const workbook=fs.readFileSync(path.resolve('cancer-system-state/PIGA_Cancer_Evidence_Offline_Matrix_v1.xlsx'));
  await page.locator('#file').setInputFiles({name:'offline-research.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:workbook});
  await page.waitForFunction(()=>{const t=document.getElementById('fileStatus').textContent;return t.includes('lokal eingelesen')||t.includes('Fichier lu localement')||t.includes('Konnte Datei')||t.includes('ne peut pas être extrait')},{timeout:12000});
  const readStatus=await page.locator('#fileStatus').innerText();
  ck(readStatus.includes('lokal eingelesen')||readStatus.includes('Fichier lu localement'),'local XLSX worksheet parser '+readStatus.slice(0,100));
  await page.locator('#values').fill('SYNTHETIC observation only');
  await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.run());
  const p=await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.report());
  ck(p?.file?.characters>0,'extracted document text in memory');
  ck(!JSON.stringify(p).includes('SYNTHETIC observation only'),'no raw observations exported');
  ck(errors.length===0,'no page errors '+errors.join('|'));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  ck(overflow<=2,'mobile no overflow '+overflow);
  results.push({platform,name,checks,overflow});await ctx.close();
 }
 }
 }finally{await browser.close()}
 console.log(JSON.stringify({status:'PASS_PIGA_ADOS_PREUVE_INTAKES',checks:results.reduce((s,r)=>s+r.checks,0),results,gate2:'BLOCK',vbr:'NOT_AUTO_VERIFIED',noClinicalInference:true},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
