import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element{
 constructor(tag='div',id=''){this.tagName=tag.toUpperCase();this.id=id;this.textContent='';this.className='';this.dataset={};this.disabled=false;
  this.children=[];this.events={};this.attributes={};this.style={};}
 append(...values){this.children.push(...values)}
 prepend(...values){this.children.unshift(...values)}
 replaceChildren(...values){this.children=[...values]}
 addEventListener(type,fn){this.events[type]=fn}
 setAttribute(k,v){this.attributes[k]=String(v)}
 click(){this.events.click?.({preventDefault(){}});this.clicked=true}
 remove(){this.removed=true}
}
const registry=new Map();
const el=id=>{if(!registry.has(id))registry.set(id,new Element('div',id));return registry.get(id)};
const tabs=['today','week','tasks'].map(t=>{const e=new Element('button');e.dataset.opsTab=t;return e});
const document={
 getElementById:el,
 createElement:tag=>new Element(tag),
 querySelectorAll:query=>query==='[data-ops-tab]'?tabs:[],
 addEventListener(){},
 body:new Element('body'),
 visibilityState:'visible',hidden:false
};
const today=new Date(),isoLocal=()=>[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-')+'T14:30';
const suites={version:1,staff:[],shifts:[],movements:[],inventory:[{id:'i1',sku:'MAT-01',quantity:2,minimum:5,expiry_on:''}]};
const directs={version:1,cases:[{id:'c1',ref:'CASE-01',state:'open'}],tasks:[{id:'t1',caseId:'c1',title:'STL lokal überprüfen',status:'open'}],
 calendar:[{id:'a1',title:'Test-Termin',start:isoLocal(),minutes:45}],inventory:[],team:[],audit:[]};
const mockStore={initialize:async name=>name==='suite'?suites:directs,listJobs:async()=>[{id:'j1',state:'FAILED'}],
 meta:()=>({lastChange:new Date().toISOString()}),status:()=> 'indexeddb'};
let lastBlob,printed=false;
const URLmock={createObjectURL:blob=>{lastBlob=blob;return 'blob:local-test'},revokeObjectURL(){}};
const win={PigaDeviceStore:mockStore,addEventListener(){},print(){printed=true}};
const context={window:win,document,URL:URLmock,Blob,Date,Promise,localStorage:{getItem:()=>null},setTimeout,clearTimeout,console};
vm.runInNewContext(fs.readFileSync('piga-ortho-3d/operations.js','utf8'),context,{filename:'operations.js'});
await new Promise(resolve=>setTimeout(resolve,25));
for(const [id,value] of [['opsTasks','1'],['opsToday','1'],['opsStock','1'],['opsWorkers','1']])
 assert.equal(el(id).textContent,value,id);
assert(el('opsAttention').children.length>=4,'priority list reflects stock, worker, tasks and backup');
assert(el('opsAgenda').children.some(n=>n.textContent!==undefined||n.children.length>0),'today appointment rendered');
tabs[2].click();
assert.equal(tabs[2].attributes['aria-pressed'],'true');
assert(el('opsAgenda').children.length>0,'task view can render');
el('opsPrint').click();assert(printed,'print button performs a real print action');
el('opsExport').click();assert(lastBlob,'JSON export starts a real local file');
const payload=JSON.parse(await lastBlob.text());
assert.equal(payload.summary.openTasks,1);assert.equal(payload.summary.lowStock,1);
assert.equal(payload.clinicalAuthority,false);assert.equal(payload.externalEffects,0);
assert.equal(payload.format,'piga-ortho-operations-brief-v1');
assert(!JSON.stringify(payload).includes('STL lokal überprüfen'),'brief excludes entered individual task text');
console.log('PASS Ortho operations runtime: real local data, actionable views, print, privacy-minimized JSON export, no clinical effects.');
