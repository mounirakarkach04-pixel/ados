import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const base='piga-ortho-3d/';
const read=name=>fs.readFileSync(base+name,'utf8');
let passes=0;
const check=(name,fn)=>{fn();passes++;console.log('PASS '+name)};
const context={window:{},TextDecoder,TextEncoder,ArrayBuffer,DataView,Uint8Array,Uint8ClampedArray};
vm.runInNewContext(read('imaging-core.js'),context,{filename:'imaging-core.js'});
const P=context.window.PigaImaging;
function dicom({implicit=false,bits=16,signed=false,frames=1}={}){
 const rows=2,cols=3,parts=[],enc=new TextEncoder();
 const push=(a)=>parts.push(Uint8Array.from(a));
 const wr16=x=>[x&255,x>>8&255],wr32=x=>[x&255,(x>>8)&255,(x>>16)&255,(x>>>24)&255];
 const meta=(g,e,vr,raw)=>{
  const arr=typeof raw==='string'?enc.encode(raw):Uint8Array.from(raw),len=arr.length+(arr.length%2);
  push([...wr16(g),...wr16(e),...enc.encode(vr),...wr16(len),...arr,...new Uint8Array(len-arr.length)]);
 };
 const value=(g,e,vr,raw)=>{
  const arr=typeof raw==='string'?enc.encode(raw):Uint8Array.from(raw),len=arr.length+(arr.length%2);
  if(implicit)push([...wr16(g),...wr16(e),...wr32(len),...arr,...new Uint8Array(len-arr.length)]);
  else push([...wr16(g),...wr16(e),...enc.encode(vr),...wr16(len),...arr,...new Uint8Array(len-arr.length)]);
 };
 const bytes=new Uint8Array(132);bytes.set(enc.encode('DICM'),128);push(bytes);
 meta(2,0x10,'UI',implicit?'1.2.840.10008.1.2':'1.2.840.10008.1.2.1');
 value(0x28,2,'US',wr16(1));
 value(0x28,4,'CS','MONOCHROME2');
 value(0x28,0x10,'US',wr16(rows));value(0x28,0x11,'US',wr16(cols));
 value(0x28,0x100,'US',wr16(bits));value(0x28,0x101,'US',wr16(bits));
 value(0x28,0x103,'US',wr16(signed?1:0));
 if(frames>1)value(0x28,8,'IS',String(frames));
 const vals=Array.from({length:rows*cols*frames},(_,i)=>i===0&&signed?-1:i+5);
 const payload=bits===8?vals.map(v=>v&255):vals.flatMap(v=>wr16(v&0xffff));
 if(implicit)push([...wr16(0x7fe0),...wr16(0x10),...wr32(payload.length),...payload]);
 else push([...wr16(0x7fe0),...wr16(0x10),...enc.encode('OW'),0,0,...wr32(payload.length),...payload]);
 const n=parts.reduce((a,p)=>a+p.length,0),out=new Uint8Array(n);let off=0;
 for(const x of parts){out.set(x,off);off+=x.length;}return out.buffer;
}
check('Explicit VR Little Endian native DICOM decoding',()=>{
 const x=P.parseDicom(dicom());
 assert.equal(x.rows,2);assert.equal(x.cols,3);assert.equal(x.bits,16);
 assert.equal(x.pixel(0),5);assert.equal(x.pixel(5),10);assert.equal(x.ts,'1.2.840.10008.1.2.1');
});
check('Implicit VR Little Endian 16-bit signed multi-frame decoding',()=>{
 const x=P.parseDicom(dicom({implicit:true,frames:3,signed:true}));
 assert.equal(x.pixel(0),-1);assert.equal(x.frames,3);assert.equal(x.pixel(17),22);
});
check('DICOM 8-bit decode with threshold mask is accurate',()=>{
 const x=P.parseDicom(dicom({bits:8}));
 const y=P.grayscale(x,0,10,20,7);
 assert.equal(y.data.length,2*3*4);assert.equal(y.selected,4);
 assert.equal(y.width,3);assert.equal(y.height,2);
});
check('Reject corrupted headers and compressed pixel transfer syntaxes',()=>{
 let bad=new Uint8Array(dicom());bad[128]=0;
 assert.throws(()=>P.parseDicom(bad.buffer),/Header/);
 bad=new Uint8Array(dicom());const needle=new TextEncoder().encode('1.2.840.10008.1.2.1');
 for(let i=132;i<bad.length-needle.length;i++){
  if(needle.every((v,j)=>bad[i+j]===v)){bad[i+needle.length-1]='7'.charCodeAt(0);break;}
 }
 assert.throws(()=>P.parseDicom(bad.buffer),/Transfer-Syntax/);
});
check('Binary STL sample import and geometric distance without units claims',()=>{
 const m=(x)=>{
  const b=new ArrayBuffer(84+50),d=new DataView(b);d.setUint32(80,1,true);
  const points=[[x,0,0],[x,1,0],[x,0,1]];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)d.setFloat32(84+12+i*12+j*4,points[i][j],true);
  return P.parseStlSamples(b);
 };
 const a=m(0),b=m(2);
 const v=P.clearance(a,b);assert.equal(v.distanceModelUnits,2);
 assert.equal(v.registered,false);
 const stages=P.staging(a,b,8);
 assert.equal(stages.levels.length,9);assert.equal(stages.levels[0].fraction,0);
 assert.equal(stages.levels[8].fraction,1);
 assert.throws(()=>P.staging(a,b,100),/2 bis 30/);
});
check('No clinical results, backend fetch or remote patient data transfer in research core',()=>{
 const s=read('imaging-core.js')+read('imaging.js');
 assert(!/\bfetch\s*\(/.test(s));
 assert(s.includes("gate2:'BLOCK'"));
 assert(s.includes('clinicalAuthority'));
 assert(s.includes("showModal()"));
 assert(s.includes("decision==='reject'")&&s.includes("decision==='pause'"));
 assert(!s.includes("setInterval("));
});
check('Full app navigation, preview and PWA offline cache contain the imaging lab',()=>{
 const n=read('navigation.js'),v=read('ortho-visual-v3.js'),sw=read('sw.js'),html=read('studio.html');
 assert(n.includes("href:'./imaging.html'"));
 assert(v.includes("imaging:{title:"));
 assert(html.includes('href="./imaging.html"'));
 assert(html.includes('id="export4k"')&&html.includes('id="renderQuality"'));
 for(const f of ['imaging.html','imaging.css','imaging-core.js','imaging.js'])assert(sw.includes("'./"+f+"'"),f);
});
check('All imaging and STL scripts compile and HTML references match files',()=>{
 for(const f of ['imaging-core.js','imaging.js','app.js','navigation.js','sw.js'])
  new vm.Script(read(f),{filename:f});
 const h=read('imaging.html');
 for(const match of h.matchAll(/(?:href|src)="\.\/([^"#?]+)/g)){
  if(match[1])assert(fs.existsSync(base+match[1]),'missing '+match[1]);
 }
});
console.log('PIGA ORTHO Imaging, STL and gate QA PASS: '+passes+' suites');