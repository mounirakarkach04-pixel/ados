import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const base='piga-ortho-3d/',read=file=>fs.readFileSync(base+file,'utf8');
for(const name of ['supply.html','supply.css','supply.js','kfo-atlas.html','kfo-atlas.css','kfo-atlas.js']){
 assert(fs.existsSync(base+name),'missing asset '+name);
}
const nav=read('navigation.js'),sw=read('sw.js'),brain=read('piga-brain.js'),v3=read('ortho-visual-v3.js');
for(const name of ['supply.html','supply.css','supply.js','kfo-atlas.html','kfo-atlas.css','kfo-atlas.js'])
 assert(sw.includes("'./"+name+"'"),'offline cache missing '+name);
for(const name of ['procurement','atlas'])assert(nav.includes("id:'"+name+"'"),'nav missing '+name);
assert(read('procurement.html').includes('href="./supply.html"'),'single purchasing entry must link detailed basket');
assert(v3.includes("'kfo-atlas':")&&v3.includes('supply:{title:'),'responsive skin missing');
assert(brain.includes("atlas:['KFO Fachatlas'"),'local PIGA chat missing atlas');
for(const file of ['supply.js','kfo-atlas.js','piga-brain.js'])
 new vm.Script(read(file),{filename:file});
assert(!/\bfetch\s*\(/.test(read('supply.js')),'supplier must not receive network requests');
assert(!/new\s+WebSocket\s*\(/.test(read('supply.js')),'no remote sockets');
assert(!/\bfetch\s*\(/.test(read('kfo-atlas.js')),'atlas must be offline');
assert(read('supply.js').includes("gate2:'BLOCK'"),'gate2 must block checkout');
assert(read('supply.js').includes('externalEffects:0'),'no external supplier effect');
assert(read('kfo-atlas.js').includes('Vordruck 4d'),'billing reference missing');
assert(read('kfo-atlas.js').includes('https://www.g-ba.de'),'authoritative rules link missing');

class Node {
 constructor(){this.textContent='';this.children=[];this.handlers={};this.attrs={};this.value='';this.disabled=false;this.style={};this.dataset={};}
 append(...xs){this.children.push(...xs)}
 replaceChildren(...xs){this.children=xs}
 addEventListener(event,cb){this.handlers[event]=cb}
 setAttribute(key,value){this.attrs[key]=value}
 remove(){this.removed=true}
 click(){if(this.handlers.click)return this.handlers.click();if(this.onclick)return this.onclick()}
}
const supplyHtml=read('supply.html');
const ids=[...supplyHtml.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
const controls=new Map(ids.map(x=>[x,new Node()]));
const document={getElementById:id=>controls.get(id)||null,createElement:()=>new Node(),body:new Node()};
const store={
 initialize:async name=>({inventory:name==='suite'?[
  {id:'r1',sku:'KFO-123',label:'Synthetischer Testbogen',unit:'Pack',quantity:1,minimum:8,incoming:0,packSize:4,category:'Bögen'},
  {id:'r2',sku:'KFO-234',label:'Synthetische Testbänder',unit:'Stück',quantity:10,minimum:3,incoming:0,packSize:1,category:'Bänder'}
 ]:[]}),status:()=> 'indexeddb'
};
const saved=new Map(),localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))};
const context={document,window:{PigaDeviceStore:store},localStorage,navigator:{clipboard:{writeText:async()=>{}}},
 URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob:class{},setTimeout,Date,Promise,JSON,Number,Math,Map,Set,console};
await vm.runInNewContext(read('supply.js'),context,{filename:'supply.js'});
assert.equal(controls.get('supplyCount').textContent,'2','only actual local test records counted');
assert.equal(controls.get('supplyLow').textContent,'1');
assert.equal(controls.get('supplyProposals').textContent,'1');
assert.equal(controls.get('supplyNeeds').children.length,1);
controls.get('supplyPrepare').click();
assert.equal(controls.get('supplyBasketCount').textContent,'1');
const draft=JSON.parse(saved.get('piga-ortho-supply-draft-v1'));
assert.equal(draft.items[0].order,8,'pack rounding should provide 8 packs');
assert.equal(draft.externalEffects,0);assert.equal(draft.gate2,'BLOCK');
controls.get('supplyClear').click();
assert.equal(controls.get('supplyBasketCount').textContent,'0','clear must not write to actual inventory');

const atlasHtml=read('kfo-atlas.html');
const atlasIds=[...atlasHtml.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
const atlas=new Map(atlasIds.map(x=>[x,new Node()]));
const filters=[...atlasHtml.matchAll(/data-atlas-group="([^"]+)"/g)].map(x=>{const n=new Node();n.dataset.atlasGroup=x[1];return n});
const atlasDoc={getElementById:id=>atlas.get(id)||null,querySelectorAll:()=>filters,createElement:()=>new Node()};
vm.runInNewContext(read('kfo-atlas.js'),{document:atlasDoc,console},{filename:'kfo-atlas.js'});
const before=atlas.get('atlasCards').children.length;
assert(before>=45,'atlas covers at least 45 distinct source-linked topics');
atlas.get('atlasSearch').value='Kreuzbiss';
atlas.get('atlasSearch').handlers.input();
assert.equal(atlas.get('atlasCards').children.length,1,'deterministic search');
filters.find(x=>x.dataset.atlasGroup==='Apparaturen').handlers.click();
assert(atlas.get('atlasCards').children.every(card=>card.className==='atlas-empty'||card.children[0]?.textContent==='Apparaturen'),'topic filter must restrict categories or show explicit empty result');
atlas.get('atlasReset').handlers.click();
assert.equal(atlas.get('atlasCards').children.length,before,'reset restores atlas');
console.log('PIGA ORTHO SUPPLY + ATLAS QA PASS: real local stock math, draft-only purchase gate, 45+ searchable topics, navigation and offline.');
