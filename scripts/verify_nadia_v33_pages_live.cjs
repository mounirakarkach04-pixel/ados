#!/usr/bin/env node
'use strict';
const {readFileSync}=require('node:fs'),{createHash}=require('node:crypto');
const origin='https://mounirakarkach04-pixel.github.io/ados/nadias-bloom/';
const checksum=x=>createHash('sha256').update(x).digest('hex');
const expected=checksum(readFileSync('nadias-bloom/index.html'));
async function get(name){
 const r=await fetch(origin+name,{redirect:'follow',headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(20000)});
 const buf=Buffer.from(await r.arrayBuffer());
 return {status:r.status,buffer:buf,sha256:checksum(buf),type:r.headers.get('content-type')};
}
(async()=>{
for(let attempt=1;attempt<=8;attempt++){
 try{
 const [page,sw,manifest,cover]=await Promise.all([get(''),get('sw.js'),get('manifest.webmanifest'),get('barakah-home-2027-cover-480.webp')]);
 const facts={
  attempt,release:'v34',pageStatus:page.status,pageByteExact:page.sha256===expected,
  v34Marker:page.buffer.toString().includes('v34-spacious-family-calendar'),
  showroomLink:page.buffer.toString().includes('pigapocket.com/showroom'),
  swStatus:sw.status,cacheV34:sw.buffer.toString().includes('nadias-bloom-v34-20261028'),
  manifestStatus:manifest.status,standalone:JSON.parse(manifest.buffer).display==='standalone',
  coverStatus:cover.status,webp:cover.type?.includes('image/webp')&&cover.buffer.length===30756,
  pageSha:page.sha256,expectedSha:expected
 };
 const pass=facts.pageStatus===200&&facts.pageByteExact&&facts.v34Marker&&facts.showroomLink&&facts.swStatus===200&&facts.cacheV34&&facts.manifestStatus===200&&facts.standalone&&facts.coverStatus===200&&facts.webp;
 console.log(JSON.stringify({result:pass?'PAGES_V34_HTTP_VERIFIED':'PAGES_V34_DELAY',...facts}));
 if(pass)return;
 }catch(e){console.log(JSON.stringify({result:'PAGES_V34_DELAY',attempt,error:String(e).slice(0,200)}))}
 if(attempt<8)await new Promise(resolve=>setTimeout(resolve,7000));
}
process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
