import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PIGA_ARTICLE_GUIDES,PIGA_AI_ACT_SOURCE,validatePigaGuides} from "../ai-act-intelligence/article-piga-guides.mjs";
const report=validatePigaGuides();assert.equal(report.ok,true,JSON.stringify(report));assert.equal(report.total,119);
const by=new Map(PIGA_ARTICLE_GUIDES.map(x=>[x.article,x]));
for(let n=1;n<=113;n++)assert.ok(by.has(String(n)),"Missing Article "+n);
for(const a of ["4a","60a","75a","75b","75c","75d"])assert.ok(by.has(a),"Missing inserted Article "+a);
for(const x of PIGA_ARTICLE_GUIDES){
 assert.ok(x.title.length>5&&x.group.length>5);
 assert.ok(x.control.length>35&&x.test.length>35&&x.proof.length>35);
 assert.ok(x.focus.length>30);
 assert.ok(x.primarySource.startsWith("https://eur-lex.europa.eu/"));
 assert.equal(x.implementationState,"CONTROL_BLUEPRINT_NOT_CUSTOMER_DEPLOYMENT");
 assert.ok(Array.isArray(x.roles)&&x.roles.length&&Array.isArray(x.lenses)&&x.lenses.length);
 assert.match(x.invariant,/Gate 1/);assert.match(x.invariant,/Gate 2/);
 if(x.kind==="institutional")assert.deepEqual(x.roles,["authority"]);
}
assert.equal(PIGA_AI_ACT_SOURCE.effective,"2026-07-27");
assert.equal(by.get("86").title,"Recht auf Erläuterung individueller Entscheidungen");
assert.equal(by.get("50").kind,"transparency");
assert.equal(by.get("73").kind,"oversight");
assert.equal(by.get("113").kind,"transition");
const html=readFileSync("ai-act-intelligence/index.html","utf8"),sw=readFileSync("ai-act-intelligence/sw.js","utf8");
assert.match(html,/id="piga-article-controls"/);assert.match(html,/src="article-piga-ui\.mjs"/);
assert.match(sw,/article-piga-guides\.mjs/);assert.match(sw,/article-piga-ui\.mjs/);
console.log(JSON.stringify({status:"PASS",count:report.total,inserted:6,pigaControlBlueprints:119,allFree:true,customerProductionClaims:false,offlineSourceCached:true},null,2));
