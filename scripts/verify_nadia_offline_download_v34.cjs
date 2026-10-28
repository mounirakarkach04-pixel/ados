#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const expected=fs.readFileSync('nadias-bloom/Nadias_Bloom_Offline.html');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const url='https://mounirakarkach04-pixel.github.io/ados/nadias-bloom/Nadias_Bloom_Offline.html';
(async()=>{
 let last=null;
 for(let n=1;n<=7;n++){
  try{
   const r=await fetch(url,{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(15000)});
   const b=Buffer.from(await r.arrayBuffer()),body=b.toString('utf8');
   const checks={
    http:r.status===200,bytes:sha(b)===sha(expected),mime:r.headers.get('content-type')?.includes('text/html'),
    calendar:body.includes('v34-spacious-family-calendar'),
    inlinedCover:(body.match(/src="data:image\/webp;base64,UklG/g)||[]).length===2,
    noExternalImage:!/<img[^>]+src="https?:/.test(body),
    noExternalScript:!/<script[^>]+src=/.test(body)
   };
   last={attempt:n,checks,actualSha:sha(b),expectedSha:sha(expected),bytes:b.length};
   if(Object.values(checks).every(Boolean)){console.log(JSON.stringify({status:'OFFLINE_DOWNLOAD_LIVE_PASS',url,...last}));return}
  }catch(e){last={attempt:n,error:String(e)}}
  if(n<7)await new Promise(resolve=>setTimeout(resolve,5000));
 }
 console.error(JSON.stringify({status:'OFFLINE_DOWNLOAD_LIVE_DELAY',url,...last}));process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
