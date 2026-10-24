#!/usr/bin/env node
// PIGA bounded Happy credential check: one token mint only, no Gemini inference.
// Never print / persist token, API secrets, user data or response bodies.
const https = require('node:https');
const base = 'https://qjvopzschqukitvudgfz.supabase.co/functions/v1/happy-live-token';
const origin='https://pigapocket.com';
function request(url,method,headers={},body){return new Promise((resolve,reject)=>{
 const req=https.request(url,{method,headers,timeout:12000},res=>{
  let chunks=[];res.on('data',b=>{if(chunks.reduce((s,c)=>s+c.length,0)<32768)chunks.push(b)});
  res.on('end',()=>{let parsed;try{parsed=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{};resolve({status:res.statusCode,cors:res.headers['access-control-allow-origin']||'',json:parsed})})
 });req.on('timeout',()=>req.destroy(new Error('TIMEOUT')));req.on('error',reject);if(body)req.write(body);req.end()
})}
(async()=>{
 const health=await request(base+'/health','GET',{Origin:origin});
 console.log('HAPPY_HEALTH',JSON.stringify({http:health.status,keyConfigured:health.json?.keyConfigured===true,model:health.json?.model,originAllowed:health.cors===origin}));
 const preflight=await request(base,'OPTIONS',{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'});
 console.log('HAPPY_CORS',JSON.stringify({http:preflight.status,originAllowed:preflight.cors===origin}));
 // Conserve provider resources: issue a one-use, short-lived token, DO NOT open Gemini websocket or generate audio.
 if(health.status===200 && health.json?.keyConfigured===true && preflight.status===204){
 const response=await request(base,'POST',{Origin:origin,'Content-Type':'application/json'},'{}');
 const minted=response.status===200 && response.json?.ok===true && typeof response.json?.token==='string' && response.json.token.length>12;
 console.log('HAPPY_TOKEN_MINT',JSON.stringify({http:response.status,tokenMinted:minted,errorCode:minted?null:response.json?.error||'unknown',googleStatus:response.json?.status||null}));
 process.exitCode=minted?0:2;
 }else{console.log('HAPPY_TOKEN_MINT',JSON.stringify({skipped:true,reason:'HEALTH_OR_CORS_UNAVAILABLE'}));process.exitCode=2}
})().catch(e=>{console.error('HAPPY_PROBE_FAILURE',String(e?.code||e?.message||'network_error'));process.exitCode=2});
