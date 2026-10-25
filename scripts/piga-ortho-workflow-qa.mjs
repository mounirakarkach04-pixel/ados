import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root='piga-ortho-3d';
const names=['index.html','app.js','style.css','sw.js','icon.svg','manifest.webmanifest','privacy.html','README.txt','workflow.html','workflow.css','workflow.js','praxis.html','praxis.css','praxis.js'];
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
for(const name of ['workflow.html','workflow.css','workflow.js','praxis.html','praxis.css','praxis.js'])assert(sw.includes(name),'Offline SW cache missing '+name);
for(const name of ['workflow.css','workflow.js'])assert(html.includes('./'+name),'Workflow asset link missing '+name);
assert(!/https?:\/\//i.test(html),'External URLs forbidden in local UI');
assert(read('praxis.css').includes('@media(max-width:600px)'),'Mobile staff UI missing');
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
assert(read('praxis.html').includes('id="authForm"'),'Auth form missing');
assert(read('praxis.html').includes('id="ownerArea"'),'Owner region missing');
assert(read('praxis.html').includes('id="startShift"'),'Work time clock missing');
assert(read('praxis.html').includes('id="costForm"'),'Private costing form missing');
assert(read('praxis.js').includes('/auth/v1/recover'),'Password recovery endpoint missing');
assert(read('praxis.js').includes('/rest/v1/rpc/ortho_claim_owner'),'Owner one-time claim missing');
assert(read('praxis.js').includes("profile?.role==='owner'"),'Owner guard absent');
assert(read('praxis.html').includes('Die Eingabe echter Patientendaten ist hier derzeit deaktiviert.'),'Health-data exclusion missing');
assert(js.includes('application/json')&&js.includes('clinicalApproved:false'),'Export and nonclinical flag required');

const praxis=read('praxis.html');
const workspace=read('praxis.js');
for(const id of ['staffCodeBadge','kpiStaff','kpiToday','kpiTotal','kpiState','workStaffCode','handoffPanel','traceCase','traceLoad','traceCsv','traceList','traceSummary']){
 assert(praxis.includes('id="'+id+'"'),'Missing v0.6 employee-trace UI '+id);
}
for(const required of ['staff_code','ortho_work_events','function loadTrail()','event_type','occurred_at','caseEvents','toLocaleString']){
 assert(workspace.includes(required),'Missing v0.6 employee-trace logic '+required);
}
assert(read('sw.js').includes('piga-ortho-v060-static'),'Offline service worker version not bumped');
assert(!workspace.includes("localStorage.setItem("),'Never persist sensitive staff session in localStorage');
assert(praxis.includes('Keine Patientennamen oder Krankenkassennummern'),'Patient-health-data exclusion missing in owner trace');
process.stdout.write('PIGA ORTHO design QA PASS: 12 stages, 14 parity assets, offline cache, controls, gate boundaries, attribution.\n');
