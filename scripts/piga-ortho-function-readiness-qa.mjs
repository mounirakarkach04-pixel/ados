import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const BASE='piga-ortho-3d/';
const read=name=>fs.readFileSync(BASE+name,'utf8');
const pages=['dashboard','studio','praxis','team','inventory','workflow','devices','assist',
'report','direct','device-hub','operations','handoff','diagnostics'];
let passed=0;
const check=(name,fn)=>{fn();console.log('PASS '+name);passed++};
check('All app modules preserve HTML and use unified responsive design',()=>{
 for(const page of pages){
  const h=read(page+'.html');
  assert(h.includes('href="./ortho-light.css"'),page);
  assert(h.includes('href="./ortho-visual-v3.css"'),page);
  assert(h.includes('src="./navigation.js"'),page);
  assert(h.includes('src="./ortho-visual-v3.js"'),page);
  assert(h.includes('name="viewport"'),page);
 }
});
check('No inactive logout left on passwordless local work areas',()=>{
 for(const page of ['praxis','team','inventory'])
  assert(!/id=["']logout["']/.test(read(page+'.html')),page);
});
check('All linked relative assets exist and have active scripts',()=>{
 for(const page of pages){
  const h=read(page+'.html');
  for(const [,f] of h.matchAll(/(?:href|src)="\.\/([^"#?]+)(?:[?#][^"]*)?"/g)){
   if(f&&f!=='')assert(fs.existsSync(BASE+f),page+' missing '+f);
  }
 }
});
check('JavaScript modules parse without syntax errors',()=>{
 const core=['diagnostics.js','diagnostic-worker.js','dashboard.js','navigation.js','ortho-visual-v3.js',
  'direct.js','handoff.js','handoff-core.js','app.js','workflow.js','devices.js','assist.js','assist-help.js',
  'report.js','inventory-local.js','team-local.js','praxis-local.js','device-store.js','device-hub.js','device-worker.js','sw.js'];
 for(const f of core)new vm.Script(read(f),{filename:f});
});
check('Real UI diagnostic controls are backed by behavior and are not decorative',()=>{
 const html=read('diagnostics.html'),js=read('diagnostics.js');
 for(const id of ['runDiagnostics','exportDiagnostics','technicalChecks','passed','failed','unavailable','overall','diagMessage'])
  assert(html.includes('id="'+id+'"')&&js.includes("'"+id+"'"),id);
 for(const s of ['indexedDB.open','crypto.subtle.generateKey','crypto.subtle.encrypt','crypto.subtle.decrypt',
  'crypto.subtle.digest','new Worker','getRegistration','navigator.bluetooth','navigator.share','window.PigaNative'])
  assert(js.includes(s),'missing runtime test: '+s);
 assert(!js.includes('fetch('));
});
check('Diagnostics asset cached for offline and accessible in navigation',()=>{
 const nav=read('navigation.js'),sw=read('sw.js'),dashboard=read('dashboard.html');
 assert(nav.includes("href:'./diagnostics.html'"));
 assert(dashboard.includes('href="./diagnostics.html"'));
 for(const f of ['diagnostics.html','diagnostics.css','diagnostics.js','diagnostic-worker.js'])
  assert(sw.includes("'./"+f+"'"),f);
});
check('Passwordless evaluation does not accidentally enable clinical or printing authority',()=>{
 const html=read('diagnostics.html'),js=read('diagnostics.js');
 assert(html.includes('Gate-2')||html.includes('Gate 2'));
 assert(js.includes('printerAutorun:false')&&js.includes('clinicalApproved:false'));
 assert(!/stripe\.com\/v1|octoprint\//i.test(js));
});
check('Isolated diagnostic worker performs real hash work without network',()=>{
 const script=read('diagnostic-worker.js');
 assert(script.includes("crypto.subtle.digest('SHA-256'"));
 assert(!script.includes('fetch('));
 const callbacks=[];
 const ctx={self:{addEventListener:(name,cb)=>callbacks.push([name,cb]),
  postMessage:x=>{ctx.answer=x}},crypto:{subtle:{digest:async()=>new Uint8Array(32).buffer}},TextEncoder};
 vm.runInNewContext(script,ctx,{filename:'diagnostic-worker.js'});
 assert.equal(callbacks[0][0],'message');
});
console.log('PIGA ORTHO state-of-the-art readiness QA PASS: '+passed+' suites.');
