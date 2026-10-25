import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root='piga-ortho-3d';
const names=['index.html','app.js','style.css','sw.js','icon.svg','manifest.webmanifest','privacy.html','README.txt','workflow.html','workflow.css','workflow.js'];
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
for(const name of names){
  assert(fs.existsSync(path.join(root,name)),'Missing web asset: '+name);
  assert.equal(read(name),fs.readFileSync(path.join(root,'web',name),'utf8'),'Web vs APK mismatch: '+name);
}
const html=read('workflow.html');
const main=read('index.html');
const css=read('workflow.css');
const js=read('workflow.js');
const sw=read('sw.js');
assert(main.includes('href="./workflow.html"'),'Main entry to navigator missing');
for(const name of ['workflow.html','workflow.css','workflow.js'])assert(sw.includes(name),'Offline SW cache missing '+name);
for(const name of ['workflow.css','workflow.js'])assert(html.includes('./'+name),'Workflow asset link missing '+name);
assert(!/https?:\/\//i.test(html),'External URLs forbidden in local UI');
assert(css.includes('@media(max-width:770px)'),'Mobile responsive rules missing');
const match=js.match(/const STAGES=(\[[\s\S]*?\]);\s*const \$/);
assert(match,'Expected static stage manifest missing');
const stages=JSON.parse(match[1]);
assert.equal(stages.length,12,'Exactly twelve process steps required');
assert.equal(new Set(stages.map(s=>s.title)).size,12,'Duplicate workflow steps');
for(const s of stages){
  assert(['ready','part','plan'].includes(s.kind),'Invalid release state');
  assert(s.module.startsWith('./index.html'),'Unsafe module navigation');
  for(const prop of ['title','short','subtitle','in','out','control','gate1','gate2','reverse','scope']){
    assert(typeof s[prop]==='string' && s[prop].length,'Missing stage property '+prop);
  }
  assert(Array.isArray(s.inputs)&&s.inputs.length>0);
  assert(Array.isArray(s.outputs)&&s.outputs.length>0);
  if(s.kind==='plan')assert(s.gate2.startsWith('BLOCK'),'Planned stage has an action gate');
}
for(const id of ['stageList','workbench','stageTitle','stageDescription','stageStatus','stageGlyph','stepCounter','schematicInput','schematicControl','schematicOutput','inputs','outputs','mode','openModule','gate1','gate2','reverse','back','next','exportSpec','printPlan','progressFill','scope'])
  assert(html.includes('id="'+id+'"'),'Missing required element '+id);
assert(html.includes('Mounir Akarkach')&&html.includes('Ibrahim Akarkach'),'Dedication missing');
assert(js.includes('application/json')&&js.includes('clinicalApproved:false'),'Export and nonclinical flag required');
process.stdout.write('PIGA ORTHO design QA PASS: 12 stages, 11 parity assets, offline cache, controls, gate boundaries, attribution.\n');
