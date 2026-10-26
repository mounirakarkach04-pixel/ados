import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const root='piga-ortho-3d/';
const read=f=>fs.readFileSync(root+f,'utf8');
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name)};
for(const f of ['workspace-manager.js','device-integrity.js','device-hub.js','navigation.js','sw.js']){
 test(f+' script syntax',()=>new vm.Script(read(f),{filename:f}));
}
const context={window:{},crypto:webcrypto,TextEncoder};
vm.runInNewContext(read('device-integrity.js'),context,{filename:'device-integrity.js'});
const audit=context.window.PigaOrthoIntegrity;
const suite={version:1,staff:[],inventory:[{sku:'MAT-A',quantity:5}],shifts:[]};
const direct={version:1,cases:[{id:'c1',ref:'CASE-A'}],tasks:[{id:'t1',caseId:'c1'}],
 calendar:[{id:'a1',refId:'c1',start:'2026-11-05T09:00:00.000Z'}],inventory:[],team:[],audit:[]};
test('Valid local records pass structured checks',()=>{
 const x=audit.inspect(suite,direct);
 assert.equal(x.summary.errors,0);assert.equal(x.summary.warnings,0);
 assert.equal(x.summary.status,'STRUCTURE_OK');assert.equal(x.counts['direct.cases'],1);
});
test('Duplicate IDs and case references are detected, without exposing patient content',()=>{
 const x=audit.inspect(suite,{...direct,cases:[...direct.cases,{id:'c1',ref:'CASE-A'}]});
 const codes=x.issues.map(z=>z.code);
 assert(codes.includes('DUPLICATE_ID'));assert(codes.includes('DUPLICATE_CASE_REF'));
 assert(!JSON.stringify(x).includes('CASE-A'));
});
test('Orphan task/calendar, invalid dates and negative stock are reported',()=>{
 const x=audit.inspect({...suite,inventory:[{sku:'MAT-A',quantity:-1}]},
 {...direct,tasks:[{id:'t1',caseId:'unknown'}],
 calendar:[{id:'a1',refId:'not-a-case',start:'bad-date'}]});
 const codes=x.issues.map(z=>z.code);
 assert(codes.includes('ORPHAN_REFERENCE'));assert(codes.includes('STOCK_INVALID'));
 assert(codes.includes('INVALID_DATE'));
});
test('Empty device database is not misrepresented as a clinical failure',()=>{
 const r=audit.inspect(null,null);
 assert.equal(r.summary.errors,0);
 assert(r.issues.every(x=>x.severity==='INFO'));
});
test('Ergonomic workspace is interactive, device-saved and Escape-reversible',()=>{
 const c=read('workspace-manager.js');
 for(const token of ['localStorage.getItem','localStorage.setItem','piga-maximized-panel','pointerdown',
  'piga-density-compact','piga-font-large','Escape','teardown()','Arbeitsfläche','aria-pressed'])
  assert(c.includes(token),token);
 assert(!/fetch\s*\(/.test(c));
});
test('Workspace uses responsive CSS with safe print and reduced motion',()=>{
 const c=read('workspace-manager.css');
 for(const token of ['max-width:760px','min-width:1100px','prefers-reduced-motion','@media print',
  '.piga-maximized-panel','.piga-workspace-bar','.piga-panel-backdrop','.piga-panel-close'])
  assert(c.includes(token),token);
});
test('Integrity controls are wired and do not change source records',()=>{
 const html=read('device-hub.html'),js=read('device-hub.js'),int=read('device-integrity.js');
 for(const id of ['checkIntegrity','exportIntegrity','integrityStatus','integrityIssues'])
  assert(html.includes('id="'+id+'"')&&js.includes("'"+id+"'"),id);
 assert(html.includes('src="./device-integrity.js"'));
 assert(js.includes('PigaOrthoIntegrity.audit'));
 assert(!/\bfetch\s*\(/.test(int));assert(!int.includes('indexedDB.open('));
});
test('All existing pages inherit controls via shared navigation',()=>{
 const nav=read('navigation.js');assert(nav.includes("workspace.src='./workspace-manager.js'"));
 assert(nav.includes("workspaceStyle.href='./workspace-manager.css'"));
 assert(fs.existsSync(root+'dashboard.html'));assert(fs.existsSync(root+'studio.html'));
});
test('Versioned offline PWA caches all new functional assets',()=>{
 const sw=read('sw.js');
 for(const f of ['workspace-manager.js','workspace-manager.css','device-integrity.js'])
  assert(sw.includes("'./"+f+"'"),f);
 assert(/piga-ortho-v[0-9]+-[a-z-]+/.test(sw),'Expected versioned Ortho PWA cache');
});
await (async()=>{
 const report=await audit.audit(suite,direct);
 assert(/^[a-f0-9]{64}$/.test(report.digest.suite));
 assert(/^[a-f0-9]{64}$/.test(report.digest.direct));
 assert(!JSON.stringify(report).includes('CASE-A'));
 console.log('PASS Read-only audit generates SHA-256 snapshot digests with no raw case data');count++;
})();
console.log('PIGA ORTHO workspace & data-integrity QA PASS · '+count+' suites.');
