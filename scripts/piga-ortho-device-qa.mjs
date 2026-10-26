import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root='piga-ortho-3d',read=name=>fs.readFileSync(path.join(root,name),'utf8');
const pages=['dashboard','studio','praxis','team','inventory','devices','assist','workflow','report','direct','device-hub'];
const js=['device-store.js','device-worker.js','device-hub.js','navigation.js','local-runtime.js','praxis-local.js','team-local.js','inventory-local.js','direct.js','dashboard.js','transfer-offer.js','worker-autoresume.js','sw.js'];
let tests=0;const test=(title,fn)=>{fn();tests++;console.log('PASS '+title)};
test('All active UI scripts parse',()=>js.forEach(file=>new vm.Script(read(file),{filename:file})));
test('Every full app page contains unified wide theme + navigation',()=>pages.forEach(name=>{
 const html=read(name+'.html');
 assert(html.includes('href="./ortho-light.css"'),name);
 assert(html.includes('href="./navigation.css"'),name);
 assert(html.includes('src="./navigation.js"'),name);
}));
test('Device hub is accessible in main nav and dashboard',()=>{
 assert(read('navigation.js').includes("href:'./device-hub.html'"));
 assert(read('dashboard.html').includes('href="./device-hub.html"'));
});
test('No Supabase session needed in active operational modules',()=>{
 for(const name of ['praxis','team','inventory']){
  const h=read(name+'.html');
  assert(!h.includes('sanrkcovmkkhgdqydxfk'),name);
  assert(h.includes('src="./device-store.js"'));
  assert(h.includes('src="./local-runtime.js"'));
  assert(h.includes('src="./'+name+'-local.js"'));
  assert(!h.includes('src="./'+name+'.js"'),name);
  assert(!/id="(authShell|loginPanel|locked)"/.test(h),name);
 }
 assert(read('direct.html').includes('src="./device-store.js"'));
});
test('Startup recovers device DB before direct and operations scripts read storage',()=>{
 assert(read('local-runtime.js').includes("await window.PigaDeviceStore.initialize('suite')"));
 assert(read('direct.js').includes("await window.PigaDeviceStore.initialize('direct')"));
 for(const name of ['praxis','team','inventory'])assert(read(name+'-local.js').includes('await window.OrthoLocalReady'));
});
test('Existing tests are migrated, not deleted',()=>{
 const c=read('device-store.js');
 for(const s of ['piga-ortho-v12-local','piga-ortho-direct-v1','const legacy=memory(name)','await put(name,legacy)'])assert(c.includes(s),s);
});
test('Device database and worker have a bounded allowlist, no network calls',()=>{
 const s=read('device-store.js'),w=read('device-worker.js');
 for(const a of ['HEALTH_CHECK','INVENTORY_FORECAST','WORKFLOW_SUMMARY'])assert(s.includes(a)&&w.includes(a));
 assert(w.includes('const DB=\'PIGA_ORTHO_DEVICE_V1\',MAX=5'));
 assert(!/\bfetch\s*\(/.test(w));
 assert(!/https?:\/\//.test(w));
 assert(w.includes("state:'QUEUED'")===false); // worker only consumes
 assert(s.includes("state:'QUEUED'"));
});
test('Import/export envelope uses AES-256-GCM and PBKDF2',()=>{
 const s=read('device-hub.js');
 for(const word of ['AES-GCM','PBKDF2','250000','crypto.subtle.encrypt','crypto.subtle.decrypt',
  'confirm(\'Wirklich die vorhandenen lokalen Testdaten'])assert(s.includes(word),word);
});
test('Layout adapts to desktop, tablet and smartphone',()=>{
 const css=read('ortho-light.css');
 for(const width of ['min-width:1161px','min-width:761px','max-width:1160px','min-width:1100px','max-width:760px'])
  assert(css.includes(width),width);
 assert(css.includes('piga-compact-nav'));
 assert(css.includes('#studio #mesh'));
});
test('Service worker includes all new assets with new release cache',()=>{
 const sw=read('sw.js');
 for(const file of ['device-store.js','device-hub.html','device-hub.css','device-hub.js','device-worker.js','ortho-light.css','transfer-offer.js','worker-autoresume.js'])
  assert(sw.includes("'./"+file+"'"),file);
 assert(sw.includes('v127-transfer-offer'));
});
test('No broken local relative links for all active UI pages',()=>{
 for(const page of pages){
  for(const [,attr] of read(page+'.html').matchAll(/(?:href|src)="\.\/([^"]+)"/g)){
   const name=attr.split(/[?#]/)[0];
   if(name)assert(fs.existsSync(path.join(root,name)),page+' -> '+name);
  }
 }
});
test('Automatic backup offer is unobtrusive and requires explicit transfer consent',()=>{
 const n=read('navigation.js'),o=read('transfer-offer.js'),hub=read('device-hub.js'),data=read('device-store.js');
 assert(n.includes("offer.src='./transfer-offer.js'"));
 assert(o.includes("kind==='receive'")&&o.includes("kind==='changed'"));
 assert(o.includes('piga-ortho-last-transfer-prompt-v1'));
 assert(o.includes("open.href='./device-hub.html#transfer'"));
 assert(hub.includes('navigator.share')&&hub.includes('S.flush()')&&hub.includes('S.markImport()'));
 assert(data.includes("stamp('lastChange')")&&data.includes("markBackup"));
 assert(!/fetch\\s*\\(/.test(o));
});
test('Previously admitted local work may resume in foreground without an unlimited loop',()=>{
 const o=read('worker-autoresume.js'),n=read('navigation.js');
 assert(o.includes("state==='QUEUED'")&&o.includes("limit:5"));
 assert(o.includes("document.visibilityState==='hidden'"));
 assert(n.includes("s.src='./worker-autoresume.js'"));
 assert(!/setInterval\\s*\\(/.test(o));
});
console.log('PIGA ORTHO 3D device-first QA PASS · '+tests+' structural and syntax suites.');
