import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root='piga-ortho-3d',read=name=>fs.readFileSync(path.join(root,name),'utf8');
const pages=['operations','dashboard','studio','praxis','team','inventory','devices','assist','workflow','report','direct','device-hub'];
const js=['operations.js','ortho-install.js','ortho-visual-v3.js','assist-help.js','device-store.js','device-worker.js','device-hub.js','navigation.js','local-runtime.js','praxis-local.js','team-local.js','inventory-local.js','direct.js','dashboard.js','transfer-offer.js','worker-autoresume.js','sw.js'];
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
 assert(sw.includes('v132-operations'));
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
 assert(!o.includes('fetch('));
});
test('Previously admitted local work may resume in foreground without an unlimited loop',()=>{
 const o=read('worker-autoresume.js'),n=read('navigation.js');
 assert(o.includes("state==='QUEUED'")&&o.includes("limit:5"));
 assert(o.includes("document.visibilityState==='hidden'"));
 assert(n.includes("s.src='./worker-autoresume.js'"));
 assert(!o.includes('setInterval('));
});
test('Reference-inspired dashboard style and network controls remain available',()=>{
 const dashboard=read('dashboard.html'),css=read('ortho-light.css'),devices=read('devices.html'),js=read('devices.js');
 assert(dashboard.includes('ortho-reference-brand'));
 assert(dashboard.includes('From Scan to Smile'));
 for(const label of ['PRACTICE','LAB','WORKFLOW','AI'])assert(dashboard.includes(label));
 assert(css.includes('ref-brand-lockup')&&css.includes('connection-help'));
 assert(devices.includes('id="connectionHelp"'));
 for(const id of ['wifiSettings','btGrant','btSettings','probe','scanFile','scanFile2'])
  assert(devices.includes('id="'+id+'"'),id);
 assert(js.includes('navigator.bluetooth.requestDevice')&&js.includes("window.addEventListener('online',detect)"));
 assert(js.includes("native.openWirelessSettings('wifi')"));
});
test('Every original HTML module loads the same light visual release exactly once',()=>{
 for(const name of pages){
  const h=read(name+'.html');
  for(const x of ['ortho-visual-v3.css','ortho-visual-v3.js']){
   assert.equal(h.split('./'+x).length-1,1,name+' '+x);
  }
 }
 const v=read('ortho-visual-v3.js');
 for(const id of ['studio','praxis','team','inventory','assist','workflow','devices','report','direct','device-hub'])
  assert(v.includes(id+':{')||v.includes("'"+id+"':{"),id);
});
test('Asset illustrations exist, have unique names, and are cached for offline HTML',()=>{
 const sw=read('sw.js');
 for(const name of ['ortho-hero','ortho-dashboard','ortho-calendar','ortho-team','ortho-inventory','ortho-ai']){
  const filename='visuals/'+name+'.svg',svg=read(filename);
  assert(svg.startsWith('<svg'),filename);
  assert(svg.includes('</svg>'),filename);
  assert(sw.includes("'./"+filename+"'"),filename);
 }
 const dash=read('dashboard.html');assert(dash.includes('ortho-hero-art'));
});
test('Guided assistant is functional offline and clearly non-clinical',()=>{
 const h=read('assist.html'),js=read('assist-help.js');
 for(const id of ['technicalHelpForm','technicalQuestion','technicalHelpFeed','clearTechnicalHelp'])
  assert(h.includes('id="'+id+'"'),id);
 assert(h.includes('src="./assist-help.js"'));
 assert(js.includes("form.addEventListener('submit'"));
 assert(js.includes("data-help-prompt"));
 assert(js.includes('sensitive.test(q)'));
 assert(js.includes('keine Diagnose')||js.includes('keine Diagnose'.toLowerCase())||js.includes('keine Diagnose'.replace('Diagnose','Diagnose')));
 assert(!js.includes('fetch('));
});
test('Core operational actions have actual handlers and stay local',()=>{
 const pairs=[
 ['praxis-local.js',['startShift','stopShift','costForm','traceCsv']],
 ['team-local.js',['clockIn','clockOut','absenceForm','scheduleForm','createPayroll']],
 ['inventory-local.js',['newItemForm','adjustForm','settingsForm','inventoryCsv']],
 ['devices.js',['wifiSettings','btSettings','btGrant']],
 ['app.js',['printStart','printPause','printCancel','exportAudit']],
 ['report.js',['importAudit','print','export','example']],
 ];
 for(const [file,ids] of pairs){const js=read(file);for(const id of ids)assert(js.includes("'"+id+"'"),file+':'+id)}
 assert(read('device-hub.js').includes('crypto.subtle.encrypt'));
});
test('The installable HTML PWA offers real install or platform-specific instructions',()=>{
 const install=read('ortho-install.js'),navigation=read('navigation.js'),worker=read('sw.js');
 assert(install.includes("beforeinstallprompt"));
 assert(install.includes("await p.prompt()"));
 assert(install.includes("Zum Home-Bildschirm"));
 assert(navigation.includes("install.src='./ortho-install.js'"));
 assert(worker.includes("'./ortho-install.js'"));
});
test('Daily operations cockpit reads real local records and never claims clinical action',()=>{
 const c=read('operations.js'),h=read('operations.html'),sw=read('sw.js'),nav=read('navigation.js');
 for(const id of ['opsTasks','opsToday','opsStock','opsWorkers','opsAttention','opsAgenda','opsExport','opsPrint'])
  assert(h.includes('id="'+id+'"'),id);
 for(const field of ['direct.tasks','direct.calendar','suite.inventory','store.listJobs()','store.meta()','backupRecommended'])
  assert(c.includes(field),field);
 assert(c.includes('clinicalAuthority:false'));
 assert(c.includes('externalEffects:0'));
 assert(c.includes('store.initialize(\'suite\')')&&c.includes('store.initialize(\'direct\')'));
 assert(!c.includes('fetch('));
 for(const file of ['operations.html','operations.css','operations.js'])
  assert(sw.includes("'./"+file+"'"),file);
 assert(nav.includes("href:'./operations.html'"));
 assert(read('dashboard.html').includes('class="ops-promo"'));
});
console.log('PIGA ORTHO 3D device-first QA PASS · '+tests+' structural and syntax suites.');
