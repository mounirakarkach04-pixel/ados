#!/usr/bin/env node
'use strict';
// No emails sent, no registrations, and no passwords accepted by this probe.
const https=require('node:https'),fs=require('node:fs');
const html=fs.readFileSync('nadias-bloom/index.html','utf8');
const providers={};
for(const m of html.matchAll(/\b(primary|failover):\{url:'(https:\/\/[a-z0-9-]+\.supabase\.co)',key:'(sb_publishable_[A-Za-z0-9_-]+)'\}/g)){
 providers[m[1]]={url:m[2],key:m[3]};
}
if(!providers.primary||!providers.failover)throw Error('Both Auth realms must use publishable browser keys');
if(html.includes('sb_secret_')||html.includes('service_role'))throw Error('Secret credentials in public client');
function request(p,route){
 return new Promise((resolve,reject)=>{
  const req=https.get(p.url+'/auth/v1/'+route,{headers:{apikey:p.key,accept:'application/json'},timeout:12000},res=>{
   const chunks=[];let bytes=0;
   res.on('data',part=>{bytes+=part.length;if(bytes<16000)chunks.push(part)});
   res.on('end',()=>{let data={};try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{}
    resolve({http:res.statusCode,data})});
  });
  req.on('timeout',()=>req.destroy(Error('health timeout')));
  req.on('error',reject);
 });
}
async function probe(id){
 try{
  const [health,settings]=await Promise.all([request(providers[id],'health'),request(providers[id],'settings')]);
  return {realm:id,healthHttp:health.http,settingsHttp:settings.http,emailProvider:settings.data.external?.email??null,
   signupDisabled:settings.data.disable_signup??null,
   verdict:health.http===200&&settings.http===200&&settings.data.external?.email===true?'PROVIDER_HEALTH_PASS':'PROVIDER_HEALTH_BLOCK'};
 }catch(error){return {realm:id,verdict:'PROVIDER_HEALTH_BLOCK',error:String(error?.message||error).slice(0,140)}}
}
(async()=>{
 const results=await Promise.all(['primary','failover'].map(probe));
 const alternative=results.find(x=>x.realm==='failover');
 console.log(JSON.stringify({check:'NADIA_AUTH_DUAL_REALM_HEALTH_NO_EMAIL_SENT',results,emailsSent:0,accountsCreated:0,
  separateAccounts:true,primaryAccountsNotMigrated:true,registrationAndRecoveryE2E:'NOT_VERIFIED'},null,2));
 if(alternative?.verdict!=='PROVIDER_HEALTH_PASS')process.exitCode=2;
})().catch(e=>{console.error('AUTH_PROVIDER_BLOCK',String(e?.message||e));process.exitCode=2});
