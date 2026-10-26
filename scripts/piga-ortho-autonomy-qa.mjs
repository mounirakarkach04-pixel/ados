import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
const root='piga-ortho-3d/',read=f=>fs.readFileSync(root+f,'utf8');
const files=['device-resilience.js','resilience-status.js','dental-anatomy.js','device-store.js','device-worker.js',
 'device-hub.html','studio.html','app.js','navigation.js','sw.js'];
for(const f of files)assert(fs.existsSync(root+f),'missing local-first asset '+f);
for(const f of ['device-resilience.js','resilience-status.js','dental-anatomy.js','device-store.js','device-worker.js','app.js'])
 new vm.Script(read(f),{filename:f});
const store=read('device-store.js'),worker=read('device-worker.js'),nav=read('navigation.js'),sw=read('sw.js'),
resilience=read('device-resilience.js'),app=read('app.js'),studio=read('studio.html');
for(const k of ['DATA_INTEGRITY_AUDIT','IMPROVEMENT_BACKLOG'])assert(store.includes(k)&&worker.includes(k),'worker kind missing '+k);
assert(!/\bfetch\s*\(/.test(resilience),'automatic device runner must never require Supabase or make any cloud requests');
assert(!/\bfetch\s*\(/.test(worker),'local worker must not perform online actions');
assert(worker.includes("status:'PROPOSAL_ONLY'"),'optimization worker must propose rather than mutate');
assert(worker.includes('actionsPerformed:0'),'Worker must prove no action');
assert(resilience.includes("navigator.locks?.request"),'Automatic foreground workers must use exclusive browser tab lock');
assert(resilience.includes("document.visibilityState!=='hidden'"),'No 24x7 browser claim');
assert(nav.includes("r.src='./device-resilience.js'"),'Runner is not integrated across app');
assert(studio.includes('src="./dental-anatomy.js"'),'Dental specimen not loaded in 3D studio');
assert(app.includes("window.PigaDentalAnatomy?.build?.()"),'New dental orientation does not replace cube');
assert(app.includes("material:tr.material||'scan'"),'Dental materials not included in rendering');
assert(!app.includes("DEMO_WUERFEL.stl"),'Old cubic dental demo remains');
assert(read('device-hub.html').includes('id="resilienceStatus"'),'Device dashboard must expose truthful local status');
for(const file of ['device-resilience.js','resilience-status.js','dental-anatomy.js'])assert(sw.includes("'./"+file+"'"),'missing offline file '+file);
const client={};
vm.runInNewContext(read('dental-anatomy.js'),{window:client,Math,Infinity});
const jaw=client.PigaDentalAnatomy.build();
assert.equal(jaw.teeth,28);
assert(jaw.triangles>7000,'Detailed 28-tooth mesh unexpectedly small');
assert(jaw.triangles<=25000,'Phone-rendering geometry unexpectedly large');
assert(jaw.synthetic===true&&jaw.ok===false,'Synthetic anatomy cannot be admitted as patient geometry');
assert(jaw.vertices.some(t=>t.material==='gingiva'));
assert(jaw.vertices.some(t=>t.material==='enamel'));
for(let i=0;i<3;i++)assert(Number.isFinite(jaw.min[i])&&jaw.max[i]>jaw.min[i]);
const manifest=read('android/app/src/main/AndroidManifest.xml'),
native=read('android/app/src/main/java/com/piga/ortho/OrthoLocalRunnerJob.java'),
main=read('android/app/src/main/java/com/piga/ortho/MainActivity.java'),
gradle=read('android/app/build.gradle');
assert(manifest.includes('BIND_JOB_SERVICE')&&manifest.includes('RECEIVE_BOOT_COMPLETED'));
assert(native.includes('.setPeriodic(PERIOD).setPersisted(true)'), 'Native 15-minute persisted scheduler missing');
assert(native.includes('SQLiteOpenHelper'),'Native SQLite metadata journal missing');
assert(native.includes('guaranteed24x7",false'),'Android cannot promise exact 24/7');
assert(!/HttpURLConnection|URL\(/.test(native),'native worker must not perform network requests');
assert(main.includes('OrthoLocalRunnerJob.schedule(getApplicationContext())'),'Native scheduler not called');
assert(gradle.includes("from(orthoRoot)")&&!gradle.includes("file('../../web')"),'Android packaging must not use stale web snapshot');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'piga-ortho-runner-'));
try{
 const database=path.join(tmp,'runner.sqlite'),cmd='scripts/piga-ortho-pc-runner.mjs';
 const one=spawnSync(process.execPath,[cmd,'--once','--db',database],{encoding:'utf8',timeout:12000});
 assert.equal(one.status,0,'PC runner first pass failed '+one.stderr);
 assert.match(one.stdout,/3 bounded checks/);
 const again=spawnSync(process.execPath,[cmd,'--once','--db',database],{encoding:'utf8',timeout:12000});
 assert.equal(again.status,0);assert.match(again.stdout,/0 bounded checks/,'One slot must not re-run');
 const stat=spawnSync(process.execPath,[cmd,'--status','--db',database],{encoding:'utf8',timeout:12000});
 assert.equal(stat.status,0);
 const state=JSON.parse(stat.stdout);
 assert.equal(state.receipts,3);assert.equal(state.cloudRequired,false);assert.equal(state.externalEffects,0);
 assert.equal(state.clinicalAuthority,false);
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
console.log('PIGA ORTHO AUTONOMY PASS · 28-teeth mesh · native SQLite schedule · foreground jobs · executable desktop runner idempotence.');
