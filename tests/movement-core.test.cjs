'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../piga-ortho-3d/movement-core.js');
const points=new Float32Array([
  0,0,0, 1,0,0, 0,1,0,
  0,0,0, 0,1,0, 0,0,1,
  0,0,0, 0,0,1, 1,0,0,
  1,0,0, 0,0,1, 0,1,0
]);
const mesh=C.parseSTL(C.writeSTL(points,'tetra'));
const plan={x:1.2,y:-.3,z:2,rx:10,ry:5,rz:20};
const approx=(a,b,eps=.0001)=>assert.ok(Math.abs(a-b)<eps,String(a)+' != '+String(b));
test('STL binary parsing and bounds are deterministic',()=>{
 assert.equal(mesh.triangles,4);assert.equal(mesh.degenerate,0);
 assert.deepEqual(mesh.bounds.min,[0,0,0]);assert.deepEqual(mesh.bounds.max,[1,1,1]);
 assert.deepEqual(mesh.pivot,[.5,.5,.5]);
});
test('Identity transform roundtrips exact coordinates',()=>{
 const out=C.transform(mesh,{x:0,y:0,z:0,rx:0,ry:0,rz:0});assert.deepEqual(Array.from(out),Array.from(mesh.coords));
});
test('6DOF pure translation and stages',()=>{
 const p={x:2,y:0,z:-4,rx:0,ry:0,rz:0};
 const a=C.transform(mesh,C.atStage(p,2,4));
 approx(a[0],1);approx(a[1],0);approx(a[2],-2);
 assert.equal(C.rotationAngle(p),0);
});
test('Rotation preserves pairwise distance and determinant unity',()=>{
 const a=C.transform(mesh,plan),v=mesh.coords;
 const distance=(p,i,j)=>Math.hypot(p[i]-p[j],p[i+1]-p[j+1],p[i+2]-p[j+2]);
 approx(distance(a,0,3),distance(v,0,3));
 const m=C.matrix(plan),det=m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6]);
 approx(det,1);
});
test('Exported stage STL can be parsed and source triangles are preserved',()=>{
 const t=C.transform(mesh,C.atStage(plan,3,8)),r=C.parseSTL(C.writeSTL(t,'STAGE_3'));
 assert.equal(r.triangles,mesh.triangles);
 for(let i=0;i<t.length;i++)approx(t[i],r.coords[i]);
});
test('ASCII STL imports without guessing millimeter scale',()=>{
 const facet='facet normal 0 0 1\n outer loop\n vertex 0 0 0\n vertex 1 0 0\n vertex 0 1 0\n endloop\n endfacet\n';
 const s='solid tooth\n'+facet.repeat(4)+'endsolid tooth';
 const t=C.parseSTL(new TextEncoder().encode(s).buffer);
 assert.equal(t.triangles,4);assert.equal(t.degenerate,0);
});
test('No false clinical authority from incomplete or uncalibrated input',()=>{
 const teeth=[{fdi:'11',mesh,plan}];
 assert.equal(C.gate1(teeth,false,8).status,'BLOCK');
 assert.equal(C.gate1(teeth,true,8).status,'PASS');
 assert.equal(C.gate1([...teeth,...teeth],true,8).status,'BLOCK');
 assert.equal(C.gate1([{fdi:'99',mesh,plan}],true,8).status,'BLOCK');
 assert.equal(C.gate1(teeth,true,100).status,'BLOCK');
});
test('Invalid ranges and malformed geometry are blocked',()=>{
 assert.throws(()=>C.limits({...plan,x:21}));
 assert.throws(()=>C.atStage(plan,4,2));
 assert.throws(()=>C.atStage(plan,1.5,8));
 assert.throws(()=>C.atStage(plan,1,8.2));
 assert.throws(()=>C.limits({...plan,x:''}));
 assert.throws(()=>C.limits({...plan,rz:null}),/\b/);
 assert.throws(()=>C.parseSTL(new ArrayBuffer(83)));
 assert.throws(()=>C.parseSTL(new ArrayBuffer(84)));
});
test('ZIP provides valid local entries and central directory signature',()=>{
 const data=C.packZip([{name:'stage_0_FDI_11.stl',data:C.writeSTL(points,'MODEL')},{name:'evidence.json',data:new TextEncoder().encode('{}')}]);
 const view=new DataView(data);assert.equal(view.getUint32(0,true),0x04034b50);
 assert.equal(view.getUint32(data.byteLength-22,true),0x06054b50);
 assert.equal(view.getUint16(data.byteLength-22+10,true),2);
 assert.throws(()=>C.packZip([{name:'../unsafe.stl',data:new Uint8Array([0])}]));
});
