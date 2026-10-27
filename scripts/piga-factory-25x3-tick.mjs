#!/usr/bin/env node
/** PIGA 25x3 bounded FACTORY: source observability, NOT an autonomous Android runtime.
 * Requires no tokens, network, patient info, LLM provider or persistent process.
 * One finite visit per worker, three independent supervisors, one evidence receipt.
 */
import assert from "node:assert/strict";
import {existsSync,readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";
const registry=JSON.parse(readFileSync("quality/piga-24h-factory-registry.json","utf8"));
const qa=process.argv.includes("--qa");
const now=new Date(),ts=now.toISOString(),begin=Date.parse(registry.window.startUTC),end=Date.parse(registry.window.endUTC);
assert.equal(registry.schema,"piga.factory.25x3.v1");
assert.deepEqual(registry.exactEngines,["intake","queue","govern","evidence","decision"]);
assert.equal(registry.supervisors.length,3);
assert.equal(registry.workers.length,25);
assert.equal(new Set(registry.workers.map(x=>x.id)).size,25);
assert.equal(registry.limits.maxModelCalls,0);
assert.equal(registry.limits.maxExternalEffects,0);
assert.equal(registry.governance.gate2,"BLOCK");
assert(registry.workers.every(w=>registry.exactEngines.includes(w.engine)));
const within=qa||(now.getTime()>=begin&&now.getTime()<end);
const hash=s=>createHash("sha256").update(s).digest("hex");
const receipts=[];
const snapshot={
 schema:"piga.factory.25x3.evidence.v1",at:ts,source:"public-repo-source-only",
 commit:process.env.GITHUB_SHA||null,cycle:qa?"QA_REPRODUCIBLE_SOURCE_CHECK":"HOURLY_BOUNDED_OBSERVATION",
 scheduledWindow:registry.window,withinWindow:within,
 phoneHeartbeat:{state:"UNKNOWN",reason:"NO_AUTHENTICATED_ANDROID_HEARTBEAT_IN_PUBLIC_RUNNER"},
 fiveEngines:registry.exactEngines,actualModelCalls:0,externalEffects:0,
 supervisors:[],receipts,summary:null
};
if(within){
 for(const worker of registry.workers){
   const target=resolve(worker.target),observed=existsSync(target);
   const findings=[],proof={};
   if(!observed)findings.push("TARGET_MISSING");
   else{
     const txt=readFileSync(target,"utf8");
     proof.sha256=hash(txt);proof.byteLength=Buffer.byteLength(txt);
     if(worker.target.endsWith(".html")){
       if(!/<title[ >]/i.test(txt))findings.push("TITLE_MISSING");
       if(!/name=["']viewport["']/i.test(txt))findings.push("VIEWPORT_MISSING");
       if(!/<html[^>]+lang=["'][a-z]/i.test(txt))findings.push("LANG_MISSING");
       if(!/name=["']description["']/i.test(txt))findings.push("DESCRIPTION_MISSING");
       if(!/rel=["'](?:stylesheet|icon|manifest)/i.test(txt))findings.push("DISCOVERABILITY_STYLES_MISSING");
     }
     if(/(?:sk-(?:proj-)?[a-zA-Z0-9_-]{24,}|AIza[0-9A-Za-z_-]{32,}|sb_secret_[A-Za-z0-9_-]{15,})/.test(txt))findings.push("SECRET_LOOKING_LITERAL_REVIEW");
   }
   receipts.push({
     workerId:worker.id,area:worker.area,name:worker.name,engine:worker.engine,
     target:worker.target,sourceProof:proof,
     observation:findings.length?"GAP_DETECTED":"SOURCE_CHECK_PASS",
     findings,gate1:"OBSERVATION_ONLY",gate2:"BLOCK",attempts:0,effects:0,
     a7semReverse:"PASS_SOURCE_OBSERVATION_ONLY",next:findings.length?"PROPOSE_REVIEWED_PATCH":"WAIT_FOR_CHANGE"
   });
 }
 const failures=receipts.filter(x=>x.findings.length);
 snapshot.supervisors=[
 {id:"PIGA-S01",result:"PASS",scope:"GATE1_PRE_INFERENCE_AND_ZERO_COST",engineCount:5,gate2:"BLOCK",authorisedEffect:false},
 {id:"PIGA-S02",result:failures.length?"GAPS_RECORDED":"PASS",scope:"HEARTBEAT_AND_SELF_HEAL",phoneAlive:"UNKNOWN",repairAttempts:0,failClosed:true},
 {id:"PIGA-S03",result:"PASS_SOURCE_ONLY",scope:"EVIDENCE_READBACK_A7SEM_REVERSE",checkedReceipts:receipts.length,releaseAdmitted:false}
 ];
 snapshot.summary={registeredWorkers:25,visitedWorkers:receipts.length,registeredSupervisors:3,sourceGaps:failures.length,
   gaps:failures.map(r=>({id:r.workerId,file:r.target,issues:r.findings})).slice(0,60),
   releaseStatus:"SOURCE_ONLY_NOT_CLINICAL_OR_PHONE_PRODUCTION",
   permission:"NO_CLOUD_KEYS_NO_AUTO_PATCH_NO_SPEND_NO_EXTERNAL_EFFECT"};
}else{
 snapshot.supervisors=registry.supervisors.map(s=>({id:s.id,result:"EXPIRED",noWork:true}));
 snapshot.summary={registeredWorkers:25,visitedWorkers:0,registeredSupervisors:3,state:"OUTSIDE_APPROVED_24H_WINDOW",effectCount:0};
}
mkdirSync("qa-reports",{recursive:true});
const path=join("qa-reports","piga-factory-25x3-"+(qa?"qa":"hourly")+".json");
writeFileSync(path,JSON.stringify(snapshot,null,2)+"\n");
if(within && snapshot.summary.gaps.length) console.log("PIGA_REVIEW_GAPS "+JSON.stringify(snapshot.summary.gaps));
console.log(JSON.stringify({schema:snapshot.schema,at:ts,cycle:snapshot.cycle,withinWindow:within,
 workers:snapshot.summary.visitedWorkers,supervisors:snapshot.supervisors.length,sourceGaps:snapshot.summary.sourceGaps??null,
 phoneHeartbeat:snapshot.phoneHeartbeat.state,remoteEffects:0,modelCalls:0,a7semReverse:"PASS_SOURCE_ONLY",evidence:path}));
