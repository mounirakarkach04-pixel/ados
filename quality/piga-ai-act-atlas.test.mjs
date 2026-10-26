import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {operationalArticles,operationalArticle,operationalAtlasSearch,ATLAS_BOUNDARY,atlasCategories} from "../ai-act-intelligence/article-operational-map.js";
const file=p=>readFileSync("ai-act-intelligence/"+p,"utf8");
test("all 119 consolidated article references are individually accessible, none omitted",()=>{
 const ids=operationalArticles.map(a=>a.ref);
 assert.equal(ids.length,119);assert.equal(new Set(ids).size,119);
 for(let n=1;n<=113;n++)assert.ok(ids.includes(String(n)),"missing article "+n);
 for(const id of ["4a","60a","75a","75b","75c","75d"])assert.ok(ids.includes(id));
});
test("each article has genuine evidence, counterexample, actor and official source",()=>{
 for(const a of operationalArticles){
  assert.match(a.source,new RegExp("/article-"+a.ref+"$"));
  for(const field of ["topic","categoryName","addressee","question","assessment","pigaControl","evidence","negativeTest"]){
   assert.ok(a[field]?.length>(field==="topic"?3:12),"missing "+field+" for "+a.ref);
  }
  assert.equal(a.reviewState,"NOT_ASSESSED");assert.equal(a.implementationState,"TEMPLATE_ONLY");
  assert.ok(!/CERTIFIED|COMPLIANT|PRODUCTION_ACTIVE/.test(a.implementationState));
 }
});
test("article-specific cases preserve real responsibility and role boundaries",()=>{
 const art=(id)=>operationalArticle(id);
 assert.match(art("14").assessment,/Aufsicht/);
 assert.match(art("50").pigaControl,/Kennzeichnung/);
 assert.match(art("86").negativeTest,/Erklärung/);
 assert.equal(art("28").scope,"AUTHORITY_OR_PROCEDURAL");
 assert.equal(art("64").scope,"AUTHORITY_OR_PROCEDURAL");
 assert.equal(art("105").scope,"SECTORAL_LEGISLATION");
 assert.equal(art("4a").category,"bias");
 assert.equal(art("60a").category,"innovation");
 assert.equal(art("75c").category,"enforcement");
 assert.ok(atlasCategories.length>=12);
 assert.match(ATLAS_BOUNDARY,/keine automatische Rechtsprüfung/);
});
test("search, filter, and delivery remain deterministic and privacy-preserving",()=>{
 assert.equal(operationalAtlasSearch({query:"Menschliche Aufsicht"}).some(x=>x.ref==="14"),true);
 assert.equal(operationalAtlasSearch({category:"notified"}).every(x=>x.scope==="AUTHORITY_OR_PROCEDURAL"),true);
 assert.equal(operationalAtlasSearch({limit:3}).length,3);
 const html=file("index.html"),sw=file("sw.js"),ui=file("article-operations.mjs");
 for(const id of ["atlas-search","atlas-category","atlas-list","atlas-export-all"])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('src="article-operations.mjs"'));
 for(const p of ["article-operational-map.js","article-operations.mjs"])assert.ok(sw.includes('"./'+p+'"'));
 assert.ok(sw.includes("v18-operational-atlas"));
 assert.doesNotMatch(ui,/localStorage|sessionStorage|sendBeacon|document.cookie/);
 assert.doesNotMatch(ui,/location.assign|client.functions.invoke/);
});
