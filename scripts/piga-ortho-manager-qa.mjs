import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root='piga-ortho-3d/',read=f=>fs.readFileSync(root+f,'utf8');
const html=read('manager.html'),js=read('manager.js'),css=read('manager.css'),
nav=read('navigation.js'),sw=read('sw.js'),dash=read('dashboard.html');
new vm.Script(js,{filename:'manager.js'});
for(const id of ['managerRefresh','managerRun','managerDatabase','managerCloud','managerJobs','managerNative',
 'managerNativeDetail','managerMode','managerExplanation','managerLatest','managerSuggestions','managerExport'])
 assert(html.includes('id="'+id+'"'),'Manager DOM missing '+id);
assert(html.includes('src="./device-store.js"')&&html.includes('src="./manager.js"'));
assert(css.includes('max-width:760px')&&css.includes('manager-cols'),'mobile and desktop adaptive layout required');
assert(nav.includes("id:'manager'")&&nav.includes("href:'./manager.html'"),'Manager should be in navigation');
assert(dash.includes('href="./manager.html"'),'Manager must be linked from dashboard');
for(const file of ['manager.html','manager.css','manager.js'])
 assert(sw.includes("'./"+file+"'"),'Manager offline cache missing '+file);
assert(!/\bfetch\s*\(/.test(js),'Manager must not depend on Supabase or remote APIs');
assert(js.includes("window.PigaNative?.localRunnerStatus"),'Show native runner receipt when Android bridge available');
assert(js.includes("externalEffects:0"),'Status export cannot falsely claim outside effects');
assert(js.includes("new Worker('./device-worker.js')"),'Run actual bounded worker');
assert(js.includes("gate2:'BLOCK'"),'Manager cannot unlock clinical actions');
assert(js.includes("patientDetailsIncluded:false"),'Status export must omit patient details');
console.log('PIGA MANAGER QA PASS: all DOM actions, local-only worker, native status and adaptive navigation.');
