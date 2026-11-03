'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../piga-ortho-3d/access-core.js'),C=require('../piga-ortho-3d/movement-core.js'),P=require('../piga-ortho-3d/print-geometry.js');
const a=[0,0,0],b=[1,0,0],c=[0,1,0],d=[0,0,1];
const coords=new Float32Array([
 ...a,...c,...b,
 ...a,...b,...d,
 ...a,...d,...c,
 ...b,...c,...d
]);
function zipParts(buffer){
 const view=new DataView(buffer),bytes=new Uint8Array(buffer),parts={};let pos=0;
 while(pos+30<bytes.length&&view.getUint32(pos,true)===0x04034b50){
   const n=view.getUint16(pos+26,true),e=view.getUint16(pos+28,true),size=view.getUint32(pos+18,true);
   const name=new TextDecoder().decode(bytes.subarray(pos+30,pos+30+n));
   const data=bytes.subarray(pos+30+n+e,pos+30+n+e+size);
   parts[name]=new TextDecoder().decode(data);pos+=30+n+e+size;
 }return parts;
}
test('Only existing backend roles authorize privileged actions',()=>{
 assert.equal(A.permitted('owner','inviteStaff'),true);
 assert.equal(A.permitted('employee','acknowledge'),true);
 assert.equal(A.permitted('employee','inviteStaff'),false);
 assert.equal(A.permitted('accountant','viewTasks'),false);
 assert.equal(A.permitted('admin','downloadResearchPrint'),false);
 assert.equal(A.permitted('owner','clinicalPrinterStart'),false);
 assert.equal(A.canRespond('employee',{title:'aerztliche_kontrolle: ärztliche Schlusskontrolle'}),false);
 assert.equal(A.canRespond('owner',{title:'aerztliche_kontrolle: ärztliche Schlusskontrolle'}),true);
});
test('Case IDs match strict backend constraint and ten checks',()=>{
 assert.equal(A.safeRef('CASE-TEST-001'),true);
 assert.equal(A.safeRef('patient name'),false);
 assert.equal(A.safeRef('lowercase'),false);
 const rows=A.expectedTasks('caseUUID','clinicUUID','ownerUUID');
 assert.equal(rows.length,10);assert.equal(rows.filter(v=>v.state==='open').length,10);
 assert.equal(new Set(rows.map(v=>v.title.split(':')[0])).size,10);
});
test('Acknowledgement counts remain incomplete when controls are missing',()=>{
 assert.equal(A.taskSummary([{title:'scan_units: test',state:'done'},{title:'okklusion: test',state:'open'}]).pending,1);
});
test('Supplied printer files are not automatically certified',()=>{
 assert.equal(A.assessMachineFile({name:'model.stl',size:1000}).ok,false);
 assert.equal(A.assessMachineFile({name:'malware.exe',size:1000}).ok,false);
 assert.equal(A.assessMachineFile({name:'sliced.gcode',size:500}).ok,true);
 assert.equal(A.assessMachineFile({name:'sliced.ctb',size:500}).ok,true);
 assert.match(A.assessMachineFile({name:'sliced.ctb',size:500}).reason,/kein Sicherheits/);
});
test('Watertight geometric tetrahedron passes winding-aware topology',()=>{
 const result=P.topology(coords);
 assert.equal(result.status,'PASS');
 assert.equal(result.boundaryEdges,0);
 assert.equal(result.nonManifoldEdges,0);
});
test('Open surfaces are blocked from 3MF generation',()=>{
 const broken=coords.subarray(0,9*3);
 assert.equal(P.topology(broken).status,'BLOCK');
 assert.throws(()=>P.to3mf([{fdi:'11',coords:broken}]),/Topologie/);
});
test('3MF package contains required OPC and solid mesh model entries',()=>{
 const data=P.to3mf([{fdi:'11',coords}]),parts=zipParts(data);
 assert.ok(parts['[Content_Types].xml']);
 assert.ok(parts['_rels/.rels']);
 assert.ok(parts['3D/3dmodel.model']);
 assert.match(parts['3D/3dmodel.model'],/unit="millimeter"/);
 assert.match(parts['3D/3dmodel.model'],/name="FDI_11"/);
 assert.equal((parts['3D/3dmodel.model'].match(/<triangle /g)||[]).length,4);
 assert.match(parts['_rels/.rels'],/Target="\/3D\/3dmodel.model"/);
 assert.throws(()=>C.packZip([{name:'../secret',data:new Uint8Array(3)}]),/unsicher/);
});
