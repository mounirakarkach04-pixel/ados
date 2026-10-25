'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;
const els=new Map(),store=new Map();
const make=()=>({textContent:'',disabled:false,value:'',files:[],classList:{add(){},remove(){},toggle(){}},append(...xs){this.children=(this.children||[]).concat(xs)},addEventListener(){},setAttribute(){},click(){}});
const $=k=>els.has(k)?els.get(k):(els.set(k,make()),els.get(k));
const loc={assign:x=>{loc.target=x}};
const sessionStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const scope={crypto,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,DataView,File,Blob,URL,location:loc,sessionStorage,navigator:{onLine:true},document:{getElementById:$,createElement:()=>make()},window:{addEventListener(){}},setTimeout};
scope.globalThis=scope;vm.createContext(scope);
vm.runInContext(fs.readFileSync('piga-ortho-3d/devices.js','utf8'),scope);
(async()=>{
  assert.equal(typeof $('demoJourney').onclick,'function');
  await $('demoJourney').onclick();
  assert.equal(loc.target,'./report.html');
  const data=JSON.parse(sessionStorage.getItem('piga-ortho-report-once'));
  assert.equal(data.schema,'piga-ortho-report-input.v1');
  assert.equal(data.gate1,'DELAY');assert.equal(data.gate2,'BLOCK');
  assert.equal(data.model.triangles,168);
  assert.deepEqual(Array.from(data.model.bounds).map(x=>Number(x.toFixed(4))),[51.6484,15.3979,6]);
  assert.equal(data.events.length,9);
  let prev='GENESIS';
  for(const [i,e] of data.events.entries()){
   assert.equal(e.sequence,i+1);assert.equal(e.previousSha256,prev);
   const record={...e};delete record.sha256;
   const actual=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(record)))).toString('hex');
   assert.equal(e.sha256,actual);prev=actual;
  }
  assert.equal(data.terminalSha256,prev);
  vm.runInContext(fs.readFileSync('piga-ortho-3d/report.js','utf8'),scope);
  await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal($('gate1').textContent,'DELAY');assert.equal($('gate2').textContent,'BLOCK');
  assert.match($('docStatus').textContent,/KONSISTENT/);
  assert.equal(sessionStorage.getItem('piga-ortho-report-once'),null);
  console.log('PIGA ORTHO E2E PASS: synthetic STL -> 168 triangles -> bounds/sha256 -> 9 events -> bounded two cycles -> PIGA DELAY/BLOCK -> printable report');
})().catch(e=>{console.error(e);process.exitCode=1;});
