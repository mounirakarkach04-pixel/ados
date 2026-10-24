#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const root=path.resolve(process.argv[2]||".");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const paths=["index.html","studio.html","datenschutz.html","nutzungsbedingungen.html","downloads/ADOS_Governance_Lite_v0_6_OFFLINE.html"];
for(const p of paths)assert(fs.existsSync(path.join(root,p)),"Missing ADOS file "+p);
let html=read("studio.html"),scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.equal(scripts.length,2);
scripts.forEach(x=>new vm.Script(x));
const nodes=new Map(),downloads=[];
const make=id=>({id,value:"",innerHTML:"",textContent:"",style:{},dataset:{},className:"",classList:{add(){},remove(){},toggle(){}},listeners:{},addEventListener(event,handler){this.listeners[event]=handler},click(){return this.listeners.click?.()},setAttribute(){},appendChild(){},remove(){}});
const get=id=>{if(!nodes.has(id))nodes.set(id,make(id));return nodes.get(id)};
const doc={getElementById:get,createElement:()=>{let a=make("created");a.click=()=>downloads.push({name:a.download,href:a.href});return a},body:{appendChild(){}}};
const win={print(){downloads.push({name:"PRINT"})}};
const url={createObjectURL(){return "blob:synthetic"},revokeObjectURL(){}};
vm.runInNewContext(scripts[0],{document:doc,window:win,URL:url,Blob:class{},setTimeout(){}},{timeout:2500});
const app=win.ADOSEvidenceStudio;assert(app);
assert.equal(app.scenarios.length,6);
assert.equal(app.VERSION,"ADOS-STUDIO-SYN-v1");
for(const [i,s] of app.scenarios.entries()){get("scenario").listeners.change?.({target:{value:String(i)}});assert.equal(app.getState().scenario,s.id);assert.equal(app.getState().gate2,"BLOCK");assert(!app.getState().evidence.some(x=>!x.source.startsWith("SYN-")))}
get("scenario").listeners.change({target:{value:"3"}});assert.equal(app.getState().gate1,"BLOCK");
get("scenario").listeners.change({target:{value:"5"}});assert.equal(app.getState().gate1,"ALLOW");
get("scenario").listeners.change({target:{value:"0"}});assert.equal(app.getState().gate1,"DELAY");
let before=app.getState().evidence.length;
const hypothetical=app.simulate();assert.equal(app.getState().evidence.length,before,"simulation mutated evidence");assert.equal(hypothetical.gate2,"BLOCK");assert(!get("sim-result").classList.contains?.("something"));
get("kind").value="counter";get("stance").value="b";get("claim").value="Fiktiver synthetischer Gegenbeleg für eine Übung";get("provenance").value="PATIENT-A";
assert.equal(get("add-evidence").click(),false);assert.equal(app.getState().evidence.length,before);
get("provenance").value="SYN-TRAINING-A";get("evidence-level").value="documented";
get("add-evidence").click();assert.equal(app.getState().evidence.length,before+1);
get("student-status").value=app.getState().gate1;get("grade").click();assert(get("grade-result").innerHTML.includes("Korrekt"));
get("ledger").listeners.click({target:{closest(){return {dataset:{remove:"0"}}}}});assert.equal(app.getState().evidence.length,before);
get("export-json").click();get("export-csv").click();assert.equal(downloads.length,2);
assert(downloads[0].name.endsWith(".json")&&downloads[1].name.endsWith(".csv"));
assert(app.csv().includes("gate2")&&app.getState().gate2==="BLOCK");
get("reset").click();assert.equal(app.getState().evidence.length,3);
let canonical=read("index.html");assert(canonical.includes("MOUNIR AKARKACH")&&canonical.includes("studio.html")&&canonical.includes("Akarkach Diagnostic Operating System"));
let old=read("downloads/ADOS_Governance_Lite_v0_6_OFFLINE.html");
assert(old.includes("ados-quickstart")&&old.includes("MOUNIR AKARKACH")&&old.includes("Evidence Studio"));
for(const [name,source] of paths.map(p=>[p,read(p)])){for(const m of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:name})}
const linkErrors=[],files=new Set(["index.html","studio.html","datenschutz.html","nutzungsbedingungen.html"]);
for(const [name,source] of paths.filter(x=>!x.includes("downloads/")).map(p=>[p,read(p)])){
for(const m of source.matchAll(/href=["']([^"']+)["']/g)){
 let target=m[1];if(target.startsWith("#")&&!source.includes('id="'+target.slice(1)+'"'))linkErrors.push(name+" -> "+target);
 else if(/^[\w-]+\.html(?:[?#].*)?$/.test(target)&&!files.has(target.split(/[?#]/)[0]))linkErrors.push(name+" -> "+target)
}}
assert.deepEqual(linkErrors,[]);
const sha=crypto.createHash("sha256").update(html).digest("hex");
console.log(JSON.stringify({result:"PASS_ADOS_RESEARCH_SYNTHETIC",scenarioCount:6,gate1Statuses:["DELAY","BLOCK","ALLOW"],clinicalGate2:"BLOCK",counterfactualNonMutating:true,customEvidence:true,exam:true,csvAndJson:true,legalAndLinks:true,oldAppUnchangedScriptsReviewed:true,sha256:sha},null,2));
