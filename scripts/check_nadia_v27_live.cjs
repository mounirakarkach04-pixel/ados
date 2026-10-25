#!/usr/bin/env node
'use strict';
// Read-only PIGA / A7SEM Reverse evidence probe. No authentication, writes, AI inference or email.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const files = ['index.html','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png','barakah-home-2027-original-cover.png'];
const sites = [
  {name:'GitHub Pages',base:'https://mounirakarkach04-pixel.github.io/ados/nadias-bloom/'},
  {name:'Cloudflare canonical',base:'https://pigapocket.com/nadias-bloom/'}
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = [];
async function probe(url) {
  try {
    const resp = await fetch(url,{redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'user-agent':'Nadia-V29-Parity-ReadOnly/1.0'}});
    const bytes = Buffer.from(await resp.arrayBuffer());
    return {status:resp.status,contentType:resp.headers.get('content-type')||'',hash:hash(bytes),bytes:bytes.length,url:resp.url};
  } catch (e) { return {status:0,error:String(e?.message||e).slice(0,160)}; }
}
async function main(){
  let passed=0,failed=0;
  for(const site of sites){
    for(const file of files){
      const local=fs.readFileSync(path.join('nadias-bloom',file));
      const expected=hash(local),actual=await probe(new URL(file,site.base));
      const typeOK = file.endsWith('.png') ? /^image\/png/i.test(actual.contentType) : file.endsWith('.svg') ? /^image\/svg\+xml/i.test(actual.contentType) : file.endsWith('.webmanifest') ? /json|manifest/i.test(actual.contentType) : file.endsWith('.html') ? /html/i.test(actual.contentType) : /javascript|ecmascript/i.test(actual.contentType);
      const ok=actual.status===200&&actual.hash===expected&&typeOK;
      report.push({site:site.name,file,status:actual.status,sha256Match:actual.hash===expected,typeOK,bytes:actual.bytes||0,error:actual.error||''});
      ok?passed++:failed++;
    }
    const homepage=await probe(site.base);
    const homepageOK=homepage.status===200&&homepage.hash===hash(fs.readFileSync('nadias-bloom/index.html'))&&/html/i.test(homepage.contentType);
    report.push({site:site.name,file:'root alias /',status:homepage.status,sha256Match:homepage.hash===hash(fs.readFileSync('nadias-bloom/index.html')),typeOK:/html/i.test(homepage.contentType),error:homepage.error||''});
    homepageOK?passed++:failed++;
  }
  const health=await probe('https://pigapocket.com/nadias-bloom/health');
  let release='';
  if(health.status===200){
    try{const r=await fetch('https://pigapocket.com/nadias-bloom/health',{signal:AbortSignal.timeout(12000)});const data=await r.json();release=String(data.release||'')}catch(e){release='invalid-json'}
  }
  const healthOK=health.status===200&&release==='v29-botanical-mobile';
  report.push({site:'Cloudflare canonical',file:'health metadata',status:health.status,release,healthOK,error:health.error||''});
  healthOK?passed++:failed++;
  const happy={status:'WITHDRAWN',healthOK:false}; // no AI requests, no tokens
  console.log(JSON.stringify({verdict:failed===0?'STATIC_PARITY_PASS':'DELAY_STATIC_PARITY',passed,failed,aiCalls:0,emailsSent:0,probes:report},null,2));
  const md=['# Nadia v29 — read-only live parity','',`**Result:** ${failed===0?'PASS':'DELAY'} · ${passed} passed / ${failed} failed`,'','| Source | File | HTTP | SHA256 identical | MIME valid |','|---|---|---:|:---:|:---:|',...report.filter(x=>x.sha256Match!==undefined).map(x=>`| ${x.site} | ${x.file} | ${x.status} | ${x.sha256Match?'yes':'no'} | ${x.typeOK?'yes':'no'} |`),'',`Health release: ${release||'unavailable'}; Happy health HTTP: ${happy.status}; no AI model call or email sent.`,''];
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md.join('\n'));
  if(failed>0)process.exitCode=1;
}
main().catch(e=>{console.error(String(e));process.exitCode=1});
