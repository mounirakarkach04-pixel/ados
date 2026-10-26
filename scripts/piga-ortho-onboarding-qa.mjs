import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const base='piga-ortho-3d/',read=s=>fs.readFileSync(base+s,'utf8');let n=0;
const test=(name,fn)=>{fn();console.log('PASS '+name);n++};
test('Six first-run steps and real actions',()=>{
 const h=read('setup.html'),js=read('setup.js');
 for(let i=0;i<6;i++)assert(h.includes('data-step="'+i+'"'));
 for(const id of ['setupScan','setupBluetooth','setupRunWorker','setupCheckStorage','setupVoice',
 'setupNext','setupBack','setupSkip','setupConsent','setupFinish','setupDeviceName'])assert(h.includes('id="'+id+'"')&&js.includes("'"+id+"'"),id);
 assert(h.includes('App sofort öffnen'));assert(js.includes("location.href='./dashboard.html'"));
});
test('Network scan does not enumerate private networks or turn on native settings',()=>{
 const s=read('setup.js');assert(s.includes('navigator.onLine'));assert(s.includes('navigator.bluetooth.requestDevice'));
 assert(!/\bfetch\s*\(/.test(s));assert(!s.includes('document.cookie'));
});
test('Device storage, worker and optional speech actually tested',()=>{
 const s=read('setup.js');assert(s.includes("S.initialize('direct')"));assert(s.includes("new Worker('./diagnostic-worker.js')"));
 assert(s.includes('speechSynthesis.speak'));assert(s.includes('sessionStorage')===false);
});
test('Nonblocking first-run offer retains app access',()=>{
 const s=read('setup-offer.js');assert(s.includes('sessionStorage.setItem'));assert(s.includes("open.href='./setup.html'"));
 assert(s.includes('box.remove()'));assert(!s.includes('location.replace'));
});
test('Wizard responsive and PWA offline integrated',()=>{
 const css=read('setup.css'),sw=read('sw.js'),nav=read('navigation.js');
 assert(css.includes('@media(max-width:760px)'));assert(css.includes('grid-template-columns'));
 for(const file of ['setup.html','setup.css','setup.js','setup-offer.js'])assert(sw.includes("'./"+file+"'"));
 assert(nav.includes("href:'./setup.html'"));assert(nav.includes("setUp.src='./setup-offer.js'"));
});
test('No open web client contains or requests Gemini API key',()=>{
 for(const f of ['setup.js','setup.html','piga-control.js','piga-brain.js']){
 const s=read(f);assert(!/AIza[0-9A-Za-z_-]{20,}/.test(s));assert(!/api\.generativelanguage\.googleapis\.com/i.test(s));
 }
});
test('Gate protection and no patient storage',()=>{
 const html=read('setup.html');assert(html.includes('Gate 2')||html.includes('GATE 2'));
 assert(html.includes('keine echten Patienten'));
});
test('Script syntax including old PIGA controls and new wizard',()=>{
 for(const f of ['setup.js','setup-offer.js','piga-control.js','piga-brain.js','device-store.js','navigation.js','sw.js'])
  new vm.Script(read(f),{filename:f});
});
console.log('PIGA ORTHO onboarding QA PASS '+n+' suites');
