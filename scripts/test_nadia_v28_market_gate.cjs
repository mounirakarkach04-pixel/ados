#!/usr/bin/env node
'use strict';
// PIGA Nadia v28 bounded release gate: read-only static checks and local AIPC synthetic cases.
// No network, no AI inference, no email and no family-data mutation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'../nadias-bloom');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const cover=fs.readFileSync(path.join(root,'barakah-home-2027-original-cover.png'));
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
let passed=0;const results=[];
function check(name,condition){assert.ok(condition,name);passed++;results.push(name)}
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
check('One independent app script',scripts.length===1);
for(const s of scripts)new vm.Script(s[1],{filename:'nadias-bloom/index.html'});
check('JavaScript syntax parses',true);
check('Exactly 15 locale declarations',(/const NB_LANGS=(\{[^;]+\});/.exec(html)||[])[1]&&Object.keys(JSON.parse(RegExp.$1)).length===15);
check('Dutch manual selection is present',html.includes('"nl":"Nederlands"')&&html.includes('id="nb-lang-setting"'));
check('Independent explicit country selection',html.includes('id="nb-country-setting"')&&html.includes('nbInGermany()'));
check('Country-specific civil dates gated',html.includes('if(nbInGermany())for(const [date,title] of nbHolidayDates(y))'));
check('Original BARAKAH cover referenced on home and book',html.split('src="barakah-home-2027-original-cover.png"').length===3);
check('Owner-authored cover is genuine PNG',cover.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
check('Cover is not empty or placeholder',cover.length>100000&&cover.readUInt32BE(16)>600&&cover.readUInt32BE(20)>800);
const blobSha=crypto.createHash('sha1').update('blob '+cover.length+'\0').update(cover).digest('hex');
check('Owner-authoritative original exact-byte Git blob',blobSha==='9ede6c54824fc671da58fb8d7b4c78460c9737be');
check('No Happy face or unverified model route',!html.includes('id="view-happy"')&&!html.includes('happy-live-token')&&!html.includes('happy-avatar-rose.png'));
check('Synthetic assistant does not execute external effects',!html.includes('LIVE_URL')&&html.includes("gate2:'CONFIRM_REQUIRED'"));
const begin=html.indexOf('/* NADIA_PIGA_AIPC_START');
const end=html.indexOf('/* NADIA_PIGA_AIPC_END */',begin);
check('PIGA anti-pathology governance block included',begin>0&&end>begin);
const policy=html.slice(begin,end+'/* NADIA_PIGA_AIPC_END */'.length);
const sandbox={window:{}};
vm.runInNewContext(policy,sandbox,{timeout:1500});
const engine=sandbox.window.NADIA_PIGA_GUARD;
check('AIPC registry includes 150 namespaced symptom entries',engine&&engine.registry.length===150);
const result=engine.selfTest();
check('18 PIGA/A7SEM local synthetic tests pass',result.status==='PASS_LOCAL_SYNTHETIC'&&result.passed===18&&result.total===18);
check('No inference or email during safety test',result.modelCalls===0&&result.emailsSent===0);
check('PWA is installable without browser chrome',manifest.display==='standalone'&&manifest.scope==='./'&&manifest.start_url==='./');
check('Apple and Android icon links',html.includes('rel="apple-touch-icon"')&&manifest.icons.some(x=>x.sizes==='192x192')&&manifest.icons.some(x=>x.sizes==='512x512'));
check('PWA service worker does not intercept auth callbacks',sw.includes('if(url.search||url.hash||req.headers.has')&&sw.includes('CACHEABLE.has(url.pathname)'));
check('Cover can be cached as public static asset',sw.includes('barakah-home-2027-original-cover.png'));
check('No service-role credentials in browser',!html.includes('sb_secret_')&&!html.includes('service_role'));
check('Existing auth recovery UI remains',html.includes('id="nb-auth-reset-panel"')&&html.includes('function nbAuthCallback'));
console.log(JSON.stringify({verdict:'PASS_PIGA_NADIA_V28_MARKET_GATE_LOCAL',passed,total:results.length,aipc:result.status,aipcChecks:result.passed,coverGitBlobSha:blobSha,emailsSent:0,modelCalls:0,paidServicesCreated:0,verificationScope:'source and synthetic only',checks:results},null,2));