#!/usr/bin/env node
"use strict";
/* Software-level synthetic-only studio quality verification. No clinical inference. */
const fs=require("fs"),vm=require("vm"),assert=require("assert").strict,crypto=require("crypto");
const filename=process.argv[2]||"artifacts/piga-pocket/public/la-preuve-avant-le-diagnostic/studio.html";
const html=fs.readFileSync(filename,"utf8"),scripts=[...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert(scripts.length>=1,"Studio JS missing");const script=scripts[0];new Function(script);
const nodes=new Map(),events=[],sandbox={};
function node(id){
 if(nodes.has(id))return nodes.get(id);
 const elem={id,value:"",textContent:"",innerHTML:"",className:"",disabled:false,files:[],style:{},
  listeners:{},addEventListener(name,fn){this.listeners[name]=fn},click(){this.listeners.click?.({target:this,preventDefault(){}})},
  setAttribute(n,v){this[n]=v},getAttribute(n){return this[n]},replaceChildren(child){this.children=child.nodes||[]},
  classList:{remove(){},add(){}},parentElement:{addEventListener(){}}};
 nodes.set(id,elem);return elem;
}
const doc={getElementById:node,createDocumentFragment(){return {nodes:[],appendChild(x){this.nodes.push(x)}}},
createElement(type){return {type,className:"",style:{},remove(){},click(){},setAttribute(){}}},body:{appendChild(){}}};
for(const [name,value] of [["se","95"],["sp","98"],["prev","1"],["price","75"]])node(name).value=value;
const fakeWindow={};vm.runInNewContext(script,{document:doc,window:fakeWindow,Number,Array,Object,Math,JSON,String,Date,Intl,console,Blob,URL,setTimeout(){},...sandbox},{timeout:15000});
const api=fakeWindow.LA_PREUVE_STUDIO;assert(api,"public test API missing");
function result(i,change={}){return api.classify(api.base("SYN-TEST-"+i,change))}
let counts={ALLOW:0,DELAY:0,BLOCK:0,UNKNOWN:0};for(let i=0;i<1200;i++){
 const o=api.base("SYN-TEST-"+i),which=i%12;
 if(which===3)o.source="";if(which===4)o.method="";if(which===5)o.population="";
 if(which===6)o.quality="unknown";if(which===7)o.identity="unknown";
 if(which===8)o.identity="no";if(which===9)o.quality="no";if(which===10)o.interference="yes";if(which===11)o.high="100";
 const state=api.classify(o);assert.equal(state.gate2,"BLOCK");counts[state.gate1]++;
}
assert.deepEqual(counts,{ALLOW:300,DELAY:500,BLOCK:300,UNKNOWN:100});
assert.equal(result(1,{value:""}).gate1,"UNKNOWN");
assert.equal(result(2,{quality:"no",value:""}).gate1,"BLOCK");
assert.equal(result(3,{value:"195"}).gate1,"ALLOW","outside range is still documentary comparison");
const fhir=JSON.stringify({resourceType:"Bundle",meta:{tag:[{code:"SYNTHETIC-ONLY"}]},entry:[{resource:{resourceType:"Observation",id:"SYN-010",valueQuantity:{value:140,unit:"U_fictive"},referenceRange:[{low:{value:120},high:{value:160}}]}}]});
assert.equal(api.parseImport("fhir.json",fhir).length,1);
assert.throws(()=>api.parseImport("unsafe.json",JSON.stringify({resourceType:"Bundle",entry:[{resource:{resourceType:"Patient",id:"1"}}]})));
const fhirWithSubject=JSON.parse(fhir);fhirWithSubject.entry[0].resource.subject={reference:"Patient/123"};
assert.throws(()=>api.parseImport("unsafe.json",JSON.stringify(fhirWithSubject)));
assert.equal(api.parseImport("test.hl7","MSH|^~\\&|SYN|EDUCATION\rOBX|1|NM|SYN-001||141|U_fictive|120-160\r").length,1);
assert.throws(()=>api.parseImport("test.hl7","MSH|^~\\&|SYN\rPID|1|Alice\rOBX|1|NM|SYN-001||141|U_fictive|120-160"));
assert.equal(api.parseImport("set.csv","id;value;low;high;unit\nSYN-1;130;120;160;U_fictive").length,1);
assert.throws(()=>api.parseImport("set.csv","id;value;low;high;unit\nrealperson;130;120;160;U_fictive"));
assert.equal((node("waffle").children||[]).length,1000);
for(const id of ["verify","glitch","create","exam-start","exam-check","demo-fhir","demo-hl7","lab","doctor","reset"])assert(node(id).listeners.click,"Missing click handler "+id);
node("verify").click();assert(node("result").innerHTML.includes("Gate 2 : BLOCK"));
node("glitch").click();node("verify").click();assert(node("result").innerHTML.includes("BLOCK"));
node("create").value="";node("fault").value="quality";node("create").click();assert(api.getState().cases.length===4);
node("exam-start").click();node("exam-choice").value="BLOCK";node("exam-check").click();
assert(node("exam-feedback").textContent.includes("Attendu BLOCK"));
node("demo-fhir").click();node("demo-hl7").click();assert(api.getState().cases.length===6);
node("lab").click();assert(!node("doctor").disabled);node("doctor").click();assert(node("doctor").disabled);
node("reset").click();assert(api.getState().cases.length===3&&api.getState().events.length===0);
assert.equal(api.getState().gate2,"BLOCK");
console.log(JSON.stringify({status:"PASS_SYNTHETIC_STUDIO",sha256:crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex"),
cases:1200,states:counts,waffleDots:1000,syntheticCsv:true,limitedFHIR:true,limitedHL7:true,patientResourcesRejected:true,exam:true,roleplay:true,gate2:"BLOCK",patient_data:0},null,2));
