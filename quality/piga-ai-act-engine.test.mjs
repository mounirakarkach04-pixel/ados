import test from "node:test";
import assert from "node:assert/strict";
import { evaluate, articleCatalog, LAW_VERSION } from "../ai-act-intelligence/engine.js";
const base={title:"HR Helper",purpose:"Ranks employment applicants",version:"1.0",role:"provider",sector:"employment",controls:{}};
test("all 113 statutory article numbers are indexed, unreviewed clearly marked",()=>{
 assert.equal(articleCatalog.length,113);
 assert.deepEqual(articleCatalog.map(x=>x.number),Array.from({length:113},(_,i)=>i+1));
 const r=evaluate(base);
 assert.equal(r.coverage.indexed,113);
 assert.ok(r.coverage.remaining_manual_review>0);
 assert.equal(r.law_version,"2026-07-27");
});
test("employment screening flags potential Annex III and does not auto certify",()=>{
 const r=evaluate(base);
 assert.equal(r.classification,"HIGH_RISK_POTENTIAL");
 assert.equal(r.gate1,"DELAY");
 assert.equal(r.gate2,"BLOCK");
 assert.ok(r.findings.some(x=>x.article==="9"&&x.status==="EVIDENCE_REQUIRED"));
});
test("prohibited practice never returns ALLOW",()=>{
 const r=evaluate({...base,prohibited:true,controls:{prohibited:true}});
 assert.equal(r.gate1,"BLOCK");
 assert.equal(r.reverse.status,"CONTRADICTION");
 assert.ok(r.findings.find(x=>x.article==="5"));
});
test("missing scope fails UNKNOWN",()=>{
 const r=evaluate({sector:"general"});
 assert.equal(r.gate1,"UNKNOWN");
 assert.equal(r.gate2,"BLOCK");
});
test("GPAI and transparency have distinct article checks",()=>{
 const r=evaluate({...base,sector:"general",gpai:true,systemic:true,chatbot:true,synthetic:true});
 for(const a of ["53","55","50"])assert.ok(r.findings.some(x=>x.article===a));
 assert.notEqual(r.gate1,"ALLOW");
});
test("self-declaration is not independently verified",()=>{
 const r=evaluate({...base,controls:{risk:true,technical:true}},[{name:"policy.pdf",size:221,uploaded:true,sha256:"abc"}]);
 const item=r.findings.find(x=>x.article==="9");
 assert.equal(item.status,"SELF_DECLARED_UNVERIFIED");
 assert.equal(r.evidence_status,"USER_DECLARED_NOT_INDEPENDENTLY_VERIFIED");
 assert.equal(r.ladder.find(x=>x.label.includes("Belegkette")).state,"UNVERIFIED_UPLOAD");
});
test("non-Annex III ordinary AI is not pre-certified as low risk",()=>{
 const r=evaluate({...base,sector:"general"});
 assert.equal(r.classification,"CLASSIFICATION_PENDING");
 assert.equal(r.gate1,"DELAY");
});
