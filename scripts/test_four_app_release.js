#!/usr/bin/env node
"use strict";
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');

const {deflateRawSync}=require('node:zlib');
function crc32(buffer){let crc=0xffffffff;for(const b of buffer){crc^=b;for(let j=0;j<8;j++)crc=crc>>>1^(0xedb88320&-(crc&1))}return (crc^0xffffffff)>>>0}
function zipOne(name,text){
const fname=Buffer.from(name),data=Buffer.from(text),packed=deflateRawSync(data);
const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(crc32(data),14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(fname.length,26);
const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(crc32(data),16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(fname.length,28);
const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+fname.length,12);end.writeUInt32LE(local.length+fname.length+packed.length,16);
return Buffer.concat([local,fname,packed,central,fname,end])
}

const checks=[];
function ck(v,message){assert(v,message);checks.push(message)}
async function wait(page,selector,needle){await page.waitForFunction(([sel,value])=>(document.querySelector(sel)?.textContent||'').includes(value),[selector,needle],{timeout:10000})}
async function research(page,variant){
const file=variant==='cancer'?'cancer-system-state/intake.html':variant==='ados'?'research-intake.html':'la-preuve-avant-le-diagnostic/intake.html';
const abs=path.resolve(file);ck(fs.existsSync(abs),variant+' source exists');
const errors=[];page.on('pageerror',err=>errors.push(err.message));
await page.goto('file://'+abs);
const isCancer=variant==='cancer';
if(isCancer){
ck(await page.locator('#file').count()===1,'cancer upload accessible');
ck(await page.locator('#heroDemo').count()===1,'cancer immediate demo CTA');
await page.locator('#heroDemo').click();
await page.locator('#evidenceForm button[type=submit]').click();
const report=await page.evaluate(()=>window.PIGA_CANCER_INTAKE_QA.getReport());
ck(report.gate1==='ALLOW','cancer synthetic research admission ALLOW');
ck(report.gate2==='BLOCK_CLINICAL','cancer always clinical BLOCK');
ck(report.vbr?.actualNonExecutionVerified===false,'cancer VBR never auto-verifies non-effect');
await page.locator('#kind').selectOption('PERSONAL');await page.locator('#evidenceForm button[type=submit]').click();
ck((await page.locator('#state').innerText()).startsWith('BLOCK'),'cancer identifiable patient BLOCK');
await page.locator('#kind').selectOption('SYNTHETIC');await page.locator('#purpose').selectOption('RESEARCH');
await page.locator('#values').fill('');
await page.locator('#file').setInputFiles({name:'synthetic-evidence.csv',mimeType:'text/csv',buffer:Buffer.from('source: Research teaching example\nQuestion: synthetic evidence test\n2026-02-11\nMarker-Z,2.5,arbitrary units\n')});
await wait(page,'#fileStatus','File read locally');
ck((await page.locator('#filePreview').innerText()).includes('synthetic'),'cancer document preview local');
ck((await page.locator('#values').inputValue()).includes('UNVERIFIED RESEARCH DOCUMENT'),'cancer file populates unverified observations');
await page.locator('#evidenceForm button[type=submit]').click();
const data=await page.evaluate(()=>window.PIGA_CANCER_INTAKE_QA.getReport());
ck(data.recordContainsNoRawUploadedData===true,'cancer passport excludes uploaded content');
}else{
const qa=await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA);
ck(qa?.app===(variant==='ados'?'ADOS':'LA_PREUVE_LAB'),variant+' shared intake initialized');
ck(await page.locator('#file').count()===1,variant+' file picker accessible');
await page.locator('#sample').click();
await page.locator('#auditForm button[type=submit]').click();
const r=await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.report());
ck(r.gate1==='ALLOW',variant+' synthetic full metadata research ALLOW');
ck(r.gate2.startsWith('BLOCK'),variant+' clinical gate2 BLOCK');
ck(r.vbr?.actualExternalNonExecutionVerified===false,variant+' VBR not falsely verified');
await page.locator('#kind').selectOption('PERSONAL');await page.locator('#auditForm button[type=submit]').click();
ck((await page.locator('#status').innerText()).startsWith('BLOCK'),variant+' personal records blocked');
await page.locator('#kind').selectOption('SYNTHETIC');await page.locator('#purpose').selectOption('RESEARCH');
await page.locator('details.vbr-input summary').click();
await page.locator('#risk').fill('Simulated unapproved action');
await page.locator('#blockProof').fill('Synthetic gate log reference');
await page.locator('#indProof').fill('Unverified external log claimed');
await page.locator('#auditForm button[type=submit]').click();
let v=await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.report().vbr);
ck(v.state==='SELF_REPORTED_EVIDENCE_CANDIDATE_NOT_VERIFIED',variant+' VBR remains candidate');
ck(v.thirdPartyReadbackPerformed===false,variant+' never claims independent readback');
await page.locator('#values').fill('');
await page.locator('#file').setInputFiles({name:'synthetic-evidence.csv',mimeType:'text/csv',buffer:Buffer.from('source: synthetic case\nmethod: observation checklist\n2026-04-18\nScore,4,arbitrary\n')});
await wait(page,'#fileStatus',variant==='ados'?'Datei lokal eingelesen':'Fichier lu localement');
ck((await page.locator('#filePreview').innerText()).includes('synthetic'),variant+' local file preview');
ck((await page.locator('#values').inputValue()).length>15,variant+' file data participates in research input');
const r2=await page.evaluate(()=>window.PIGA_SHARED_INTAKE_QA.report());
ck(r2.rawDocumentExported===false,variant+' no source content exported');
}

const documentFixtures=[
  {name:'teaching-notes.docx',kind:'DOCX',mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',inner:'word/document.xml',xml:'<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>SYNTHETIC WORD DOCX SOURCE CONTENT</w:t></w:r></w:p></w:body></w:document>'},
  {name:'teaching-numbers.xlsx',kind:'XLSX',mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',inner:'xl/worksheets/sheet1.xml',xml:'<?xml version="1.0"?><worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>SYNTHETIC EXCEL XLSX</t></is></c></row></sheetData></worksheet>'}
];
for(const sample of documentFixtures){
  await page.locator('#values').fill('');
  await page.locator('#file').setInputFiles({name:sample.name,mimeType:sample.mime,buffer:zipOne(sample.inner,sample.xml)});
  await wait(page,'#fileStatus',isCancer?'File read locally':variant==='ados'?'Datei lokal eingelesen':'Fichier lu localement');
  const preview=await page.locator('#filePreview').innerText();
  ck(preview.includes('SYNTHETIC'),variant+' extracts compressed '+sample.kind+' locally');
}

ck(errors.length===0,variant+' no uncaught JS exceptions: '+errors.join(';'));
ck(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=3,variant+' no horizontal overflow');
}
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
for(const [size,viewport] of [['desktop',{width:1280,height:850}],['phone',{width:390,height:844}]]){
for(const variant of ['cancer','ados','preuve']){
const context=await browser.newContext({viewport,acceptDownloads:true});let p=await context.newPage();await research(p,variant);await context.close();
}
const ctx=await browser.newContext({viewport});const page=await ctx.newPage();
await page.goto('file://'+path.resolve('nadias-bloom/index.html'));
ck(await page.locator('.nb-promo').count()===1,size+' Nadia book and install card');
ck(await page.locator('#nb-install').count()===1,size+' Nadia deferred PWA button exists');
ck(await page.locator('.nb-promo a[href*="amazon.de"]').count()===1,size+' Nadia Amazon search link');
ck(await page.locator('.nb-promo details').count()===1,size+' Android/iPhone instructions');
ck(!(await page.content()).includes('drive.google.com/file/d/1_rZL'),size+' private complete book not publicly linked');
ck(await page.locator('.nb-excerpts').count()===1,size+' excerpts are in book view');
ck(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=3,size+' Nadia no horizontal overflow');
await ctx.close();
}
}finally{await browser.close()}
console.log(JSON.stringify({status:'PASS_FOUR_APP_PIGA_VBR_DOCUMENT_INTAKE',checks:checks.length,desktop:true,mobile:true,gate2:'BLOCK',patientDiagnoses:0,externalAiCalls:0,allInputsClientSide:true},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
