import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root='piga-ortho-3d',read=f=>fs.readFileSync(root+'/'+f,'utf8');
let checks=0;function test(name,fn){fn();console.log('PASS '+name);checks++;}
const context={window:{},crypto:{randomUUID:(()=>{let seq=0;return()=>String(++seq)})()},TextDecoder};
vm.runInNewContext(read('handoff-core.js'),context,{filename:'handoff-core.js'});
const C=context.window.OrthoHandoffCore;
const mk=()=>({version:1,cases:[],tasks:[],calendar:[],inventory:[],team:[],audit:[],switches:{cases:true,tasks:true,calendar:true,inventory:true}});
let db=mk();
test('One case created with unique non-patient reference',()=>{
 const c=C.addCase(db,'TEST-001','synthetic model');assert.equal(c.ref,'TEST-001');
 assert.throws(()=>C.addCase(db,'TEST-001','duplicate'),/existiert/);
 assert.throws(()=>C.addCase(db,'INVALID PATIENT NAME','invalid'),/Auftragskürzel/);
});
const caseId=db.cases[0].id;
test('Idempotent workplan seeds exactly six shared tasks',()=>{
 assert.equal(C.seed(db,caseId),6);assert.equal(C.seed(db,caseId),0);
 assert.equal(db.tasks.length,6);
 assert(db.tasks.every(t=>t.caseId===caseId&&t.status==='open'&&t.handoffKey));
});
test('Gate-1 and Gate-2 fail closed without evidence',()=>{
 const r=C.assess(db,null,caseId);assert.equal(r.technicalReady,false);
 assert.equal(r.gate1,'DELAY');assert.equal(r.gate2,'BLOCK');assert.equal(r.deviceActions,0);
 assert.throws(()=>C.markTask(db,caseId,'clinical',true,'simulated'),/unabhängige/);
 assert.throws(()=>C.markTask(db,caseId,'gate2',true,'simulated'),/unabhängige/);
});
test('Geometry cannot be marked complete without a local STL integrity result',()=>{
 assert.throws(()=>C.markTask(db,caseId,'geometry',true,''),/STL/);
 const b=new ArrayBuffer(134),v=new DataView(b);v.setUint32(80,1,true);
 // One synthetic non-degenerate triangle, normal plus 3 vertices.
 for(let i=0;i<12;i++)v.setFloat32(84+i*4,i%5?i+1:0,true);
 const res=C.stlFormat(b);assert.equal(res.format,'binary');assert.equal(res.triangles,1);
 v.setFloat32(84+4,NaN,true);assert.throws(()=>C.stlFormat(b),/nicht-endliche/);
 db.cases[0].handoff={stl:{sha256:'a'.repeat(64),triangles:1,format:'binary'}};
 C.markTask(db,caseId,'geometry',true,'Checked');
 assert.equal(db.tasks.find(t=>t.handoffKey==='geometry').status,'done');
});
test('Read two inventory sources without reserving or mutating physical stock',()=>{
 const suite={inventory:[{sku:'MAT-1',label:'Resin',quantity:12,unit:'Stück'}]};
 db.inventory.push({code:'MAT-2',name:'Foil',count:5});
 let before=JSON.stringify(suite);
 let options=C.materialOptions(db,suite);
 assert.equal(options.length,2);
 assert.equal(JSON.stringify(options.map(x=>x.code).sort()),JSON.stringify(['MAT-1','MAT-2']));
 C.assignMaterial(db,caseId,'MAT-1',3);
 assert.equal(JSON.stringify(suite),before);
 C.markTask(db,caseId,'intake',true,'Checked by tester');
 const res=C.assess(db,suite,caseId);
 assert.equal(res.materialAvailable,true);assert.equal(res.technicalReady,true);
 assert.equal(res.gate1,'DELAY');assert.equal(res.gate2,'BLOCK');
 assert.throws(()=>C.assignMaterial(db,caseId,'MAT-1',-2),/Materialmenge/);
 C.assignMaterial(db,caseId,'MAT-1',20);
 assert.equal(C.assess(db,suite,caseId).technicalReady,false);
});
test('Dashboard and navigation connect the shared workflow',()=>{
 const n=read('navigation.js'),dash=read('dashboard.html'),v3=read('ortho-visual-v3.js');
 assert(n.includes("href:'./handoff.html'"));
 assert(dash.includes('href="./handoff.html"'));
 assert(v3.includes('handoff:{title:'));
});
test('Existing HTML is preserved and the new page uses the shared light design',()=>{
 const html=read('handoff.html');
 for(const f of ['navigation.css','ortho-light.css','ortho-visual-v3.css','handoff.css','device-store.js','handoff-core.js','handoff.js','navigation.js'])
   assert(html.includes('./'+f),f);
 for(const id of ['caseSelect','newCaseForm','exampleCase','seedTasks','handoffStl','materialCode',
 'materialForm','reviewForm','steps','downloadReport','countCases','countReady','nextStep'])
   assert(html.includes('id="'+id+'"'),id);
});
test('No clinical device or remote network side effects in case-to-lab code',()=>{
 const code=read('handoff.js')+read('handoff-core.js');
 assert(!/\bfetch\s*\(/.test(code));
 assert(!/supabase|OctoPrint|\.printStart\s*\(/i.test(code));
 assert(code.includes('gate2:\'BLOCK\''));
});
test('All integrated source files parse and are included in the PWA offline cache',()=>{
 for(const f of ['handoff.js','handoff-core.js','sw.js','ortho-visual-v3.js','navigation.js'])new vm.Script(read(f),{filename:f});
 const sw=read('sw.js');
 for(const f of ['handoff.html','handoff.css','handoff.js','handoff-core.js'])
   assert(sw.includes("'./"+f+"'"),f);
});
console.log('PIGA ORTHO handoff QA PASS · '+checks+' bounded tests');
