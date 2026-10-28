#!/usr/bin/env node
'use strict';
// Bounded public URL probe. Read-only; does not see private family information.
const https=require('node:https'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const url='https://mounirakarkach04-pixel.github.io/ados/nadias-bloom/barakah-home-2027-cover-480.webp';
const expected='abbe4976ac406a362044c17ec192a3dc2d7d084d';
function probe(){
 return new Promise((resolve,reject)=>{
  const req=https.get(url,{headers:{accept:'image/webp'},timeout:12000},res=>{
   let len=0;const chunks=[];res.on('data',x=>{len+=x.length;if(len>100000){req.destroy(Error('Cover larger than 100 KB'));return}chunks.push(x)});
   res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));
  });
  req.on('error',reject);req.on('timeout',()=>req.destroy(Error('Timeout')));
 });
}
(async()=>{
 const x=await probe();
 const gitBlob=crypto.createHash('sha1').update('blob '+x.body.length+'\0').update(x.body).digest('hex');
 const cors=String(x.headers['access-control-allow-origin']||'');
 const report={url,status:x.status,mime:x.headers['content-type'],bytes:x.body.length,expectedBlob:gitBlob===expected,
  crossoriginFetchSupported:cors==='*'||cors.includes('https://pigapocket.com'),
  accessControlAllowOrigin:cors||'(missing)',noPII:true};
 console.log(JSON.stringify(report,null,2));
 assert.equal(report.status,200,'Public optimized cover HTTP 200');
 assert(report.mime?.includes('image/webp'),'Real image/webp MIME');
 assert.equal(x.body.length,30756,'Expected 30,756 byte original-cover rendition');
 assert(report.expectedBlob,'Exact generated owner-cover blob');
 // Real fetch from canonical origin requires CORS, unlike <img>; test this separately.
 if(!report.crossoriginFetchSupported){console.error('COVER_CORS_DELAY: downloaded HTML generator will have to use same-origin image URL or fallback PNG');process.exitCode=2;}
})().catch(e=>{console.error('COVER_DELIVERY_BLOCK',String(e.message||e));process.exitCode=2});
