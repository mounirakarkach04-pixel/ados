import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const read=f=>fs.readFileSync('piga-ortho-3d/'+f,'utf8');let n=0;
const test=(label,fn)=>{fn();console.log('PASS '+label);n++};
const ctx={window:{}};new vm.Script(read('procurement-core.js')).runInNewContext(ctx);
const P=ctx.window.PigaProcurement;
test('Separate inventory and direct stocks combined without double-counting',()=>{
 const s={inventory:[{sku:'RES-A',label:'Resin A',quantity:2,minimum:10,packSize:3}]};
 const d={inventory:[{code:'RES-A',name:'Resin Mirror',count:40,minimum:10},
  {code:'FOIL-1',name:'Folie',count:1,minimum:6}]};
 const result=P.prepare(s,d);assert.equal(result.length,2);
 const resin=result.find(x=>x.code==='RES-A');assert.equal(resin.suggestedQuantity,9);
 assert.equal(resin.source,'inventur');
 assert.equal(result.find(x=>x.code==='FOIL-1').suggestedQuantity,5);
 assert(result.every(x=>x.orderSubmitted===false&&x.price==='UNVERIFIED'));
});
test('Already sufficient inventory is not requested',()=>{
 assert.equal(P.prepare({inventory:[{sku:'M1',label:'M1',quantity:15,minimum:10}]},null).length,0);
});
test('CSV reports draft-only with escaped values',()=>{
 const result=P.prepare({inventory:[{sku:'TEST',label:'A; B',quantity:0,minimum:2}]},null);
 const csv=P.csv(result);assert(csv.includes('NUR ENTWURF'));assert(csv.includes('A; B'));
 assert(!/buy\.stripe\.com|purchase/.test(csv));
});
test('UI offers owner review rather than executing shop API',()=>{
 const h=read('procurement.html'),js=read('procurement.js');
 for(const id of ['buyRefresh','buyExport','buyApproval','buyItems','buyResult','buyCount'])
 assert(h.includes('id="'+id+'"')&&js.includes("'"+id+"'"),id);
 assert(h.includes('https://kfoshop24.de/'));
 assert(js.includes('S.savePigaControl'));assert(js.includes("'INVENTORY_REVIEW'"));
 assert(!/\bfetch\s*\(|XMLHttpRequest|\.submit\(\)/.test(js));
});
test('Open page accessible and cached offline',()=>{
 const nav=read('navigation.js'),sw=read('sw.js');
 assert(nav.includes("href:'./procurement.html'"));
 for(const f of ['procurement.html','procurement.css','procurement-core.js','procurement.js'])assert(sw.includes("'./"+f+"'"),f);
 assert(read('dashboard.html').includes('href="./procurement.html"'));
});
test('No DICOM, patient, email or paid action occurs in shop drafts',()=>{
 const x=read('procurement.js')+read('procurement-core.js');
 assert(!/fetch\s*\(|emailjs|sendMail\s*\(|stripe\./i.test(x));
});
test('All executable new scripts parse',()=>{
 for(const f of ['setup.js','setup-offer.js','procurement.js','procurement-core.js','piga-brain.js','navigation.js'])
 new vm.Script(read(f),{filename:f});
});
console.log('PIGA ORTHO procurement QA PASS '+n+' suites');
