#!/usr/bin/env node
'use strict';
// PIGA/Nadia v28: bounded pure security regression. No AI inference, email or mutation.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.NADIA_STATIC_ROOT||'nadias-bloom';
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
let count=0;
const check=(condition,label)=>{assert.ok(condition,label);count++};
for(const code of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1])){new vm.Script(code);count++}
new vm.Script(sw);count++;
const start=html.indexOf('const NB_STATE_LISTS='),end=html.indexOf('let nbStoredDataDamaged',start);
check(start>0&&end>start,'backup normalization is present');
const initial={members:[],events:[],tasks:[],shop:[],meals:[],routines:[],notes:[],shura:[],journal:[],money:[],daily:{},prayers:{Fajr:'',Dhuhr:'',Asr:'',Maghrib:'',Isha:''},prayerDone:{},choreDone:{},customRoutines:[],settings:{},migrated:false};
const context={initial,structuredClone};
vm.runInNewContext(html.slice(start,end)+';globalThis.clean=nbCleanState;',context,{timeout:2000});
const valid={members:[{id:'m',name:'QA'}],events:[{id:'e',date:'2026-10-25',title:'QA'}],tasks:[],shop:[],settings:{nbLocale:{lang:'nl',country:'NL'}}};
check(context.clean(valid,true).events.length===1,'valid backup accepted');
check(context.clean(valid,true).settings.nbLocale.country==='NL','locale preserved');
check(context.clean({...valid,migrated:false},false).migrated===false,'legacy migration preserved');
check(context.clean({...valid,migrated:true},false).migrated===true,'prior migration preserved');
function rejects(x){try{context.clean(x,true);return false}catch{return true}}
check(rejects({events:[],tasks:[],shop:[]}), 'missing core lists rejected');
check(rejects({...valid,members:new Array(3001).fill({})}), 'oversized backup rejected');
check(rejects({...valid,events:[{date:{invalid:true}}]}),'nested field rejected');
check(rejects({...valid,events:[{date:20261025}]}),'invalid date rejected');
check(rejects({...valid,members:[{name:'x'.repeat(6001)}]}),'oversized field rejected');
const malicious=JSON.parse('{"id":"x","__proto__":{"isAdmin":true}}');
check(!Object.hasOwn(context.clean({...valid,members:[malicious]},true).members[0],'__proto__'),'prototype keys stripped');
check(!Object.hasOwn(context.clean({...valid,admin:true},true),'admin'),'unexpected top-level properties excluded');
check(html.includes('localStorage.setItem(KEY,JSON.stringify(candidate));\n  state=candidate;'),'backup storage committed before in-memory state');
check(html.includes('if(!nbStoredDataDamaged&&!state.migrated)'),'damaged backup never overwritten by legacy migration');
check(!html.includes('happy-live-token')&&!html.includes('id="view-happy"'),'unverified Happy remains withdrawn');
const listeners={};const put=[];
const cache={addAll:async()=>{},add:async()=>{},put:async(req)=>{put.push(req.url)},match:async()=>null};
const worker={
 location:new URL('https://pigapocket.com/nadias-bloom/sw.js'),
 addEventListener:(event,fn)=>{listeners[event]=fn},
 skipWaiting:async()=>{},
 clients:{claim:async()=>{}}
};
const net=async()=>({ok:true,type:'basic',clone(){return this}});
vm.runInNewContext(sw,{self:worker,URL,caches:{open:async()=>cache,keys:async()=>[],delete:async()=>{}},fetch:net,Response:{error:()=>({status:0})},Set,Promise},{timeout:2000});
function fakeRequest(url,mode='navigate',auth=false,method='GET'){
 let handled;
 const req={url,mode,method,headers:{has:key=>key.toLowerCase()==='authorization'&&auth}};
 listeners.fetch({request:req,respondWith:x=>{handled=x}});
 return {handled:!!handled,settled:handled};
}
const origin='https://pigapocket.com/nadias-bloom/';
check(fakeRequest(origin).handled,'clean app navigation handled offline');
check(fakeRequest(origin+'index.html').handled,'clean index handled offline');
check(fakeRequest(origin+'icon.svg','no-cors').handled,'manifest static icon handled offline');
check(!fakeRequest(origin+'?token_hash=SECRET&type=recovery').handled,'recovery links never intercepted');
check(!fakeRequest(origin+'?code=SECRET').handled,'PKCE code links never intercepted');
check(!fakeRequest(origin+'index.html?utm=abc').handled,'query-bearing navigation never intercepted');
check(!fakeRequest(origin,'navigate',true).handled,'authorized requests bypass cache');
check(!fakeRequest('https://example.org/nadias-bloom/').handled,'cross-origin requests bypass cache');
check(!fakeRequest(origin+'legacy').handled,'legacy app outside cache allowlist');
check(!fakeRequest(origin,'navigate',false,'POST').handled,'non-GET requests bypass cache');
console.log(JSON.stringify({verdict:'PASS_NADIA_V28_SECURITY',checks:count,failed:0,realEmailSent:0,aiCalls:0,detail:'SW auth-cache exclusions and atomic bounded backup'},null,2));
