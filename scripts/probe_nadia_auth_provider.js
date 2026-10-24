#!/usr/bin/env node
"use strict";
const https=require('node:https'),fs=require('node:fs');
const s=fs.readFileSync('nadias-bloom/index.html','utf8');
const m=s.match(/const NB_SUPABASE_KEY='(sb_publishable_[A-Za-z0-9_-]+)'/);
if(!m)throw Error('Public publishable key missing from Nadia Auth client (do not use service_role)');
const key=m[1];const base='https://qjvopzschqukitvudgfz.supabase.co/auth/v1';
function req(path){return new Promise((resolve,reject)=>{const r=https.get(base+path,{headers:{apikey:key,accept:'application/json'},timeout:14000},res=>{let chunks=[],bytes=0;res.on('data',b=>{bytes+=b.length;if(bytes<16000)chunks.push(b)});res.on('end',()=>{let data={};try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{}resolve({status:res.statusCode,data})})});r.on('timeout',()=>r.destroy(Error('Auth probe timeout')));r.on('error',reject)})}
(async()=>{
const [health,settings]=await Promise.all([req('/health'),req('/settings')]);
const info={check:'NADIA_AUTH_PROVIDER_NO_EMAIL_SENT',healthStatus:health.status,settingsStatus:settings.status,emailProviderFlag:settings.data.external?.email??null,disableSignup:settings.data.disable_signup??null,mailerAutoconfirm:settings.data.mailer_autoconfirm??null,newPaidServices:0,emailsSent:0,roleKey:'publishable'};
console.log(JSON.stringify(info,null,2));
if(health.status!==200||settings.status!==200||settings.data.external?.email!==true)process.exitCode=2;
})().catch(e=>{console.error('AUTH_PROVIDER_DELAY',String(e.message||'unavailable'));process.exitCode=2});
