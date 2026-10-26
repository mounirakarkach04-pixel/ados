import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root='piga-ortho-3d/';
const read=f=>fs.readFileSync(root+f,'utf8');
const files=['setup.html','setup.js','setup.css','setup-offer.js','navigation.js','sw.js','diagnostic-worker.js'];
for(const f of files)assert(fs.existsSync(root+f),'Missing setup asset: '+f);
for(const f of ['setup.js','setup-offer.js','navigation.js','diagnostic-worker.js'])
 new vm.Script(read(f),{filename:f});

const page=read('setup.html'),script=read('setup.js'),nav=read('navigation.js'),sw=read('sw.js'),offer=read('setup-offer.js');
for(const id of ['setupPosition','setupProgress','setupStatus','setupBack','setupNext','setupSkip','setupDeviceName',
 'setupSummary','setupConsent','setupFinish','setupNotice','setupCheckStorage','setupStorageResult',
 'setupScan','setupNetworkResult','setupBluetooth','setupBluetoothResult','setupRunWorker',
 'setupWorkerResult','setupVoice','setupVoiceResult']){
 assert(page.includes('id="'+id+'"'),'Missing DOM control: '+id);
}
for(let i=0;i<6;i++)assert(page.includes('data-screen="'+i+'"')&&page.includes('data-step="'+i+'"'),'Missing step '+i);
assert(page.includes('href="./dashboard.html"')&&page.includes('href="./piga-control.html"'),'Full app must remain accessible');
assert(nav.includes("href:'./setup.html'"),'Setup navigation missing');
assert(nav.includes("src='./setup-offer.js'"),'Setup offer not loaded globally');
for(const asset of ['setup.html','setup.js','setup.css','setup-offer.js','diagnostic-worker.js'])
 assert(sw.includes("'./"+asset+"'"),'Offline cache missing '+asset);
assert(offer.includes("?.completed===true")&&offer.includes('sessionStorage'),'First-run offer must dismiss and persist');
assert(!/\bfetch\s*\(/.test(script),'Setup cannot make cloud or patient network requests');
assert(!/new\s+WebSocket\s*\(/.test(script),'Setup cannot open remote sockets');
assert(script.includes("new Worker('./diagnostic-worker.js')"),'Worker test must be actual isolated execution');
assert(script.includes('worker.terminate()'),'Worker must be bounded/terminated');
assert(script.includes("requestDevice({acceptAllDevices:true"),'Bluetooth permission must be user-triggered');
assert(!script.includes('gatt.connect()'),'Setup must not connect clinical hardware automatically');

class Element{
 constructor(id=''){this.id=id;this.dataset={};this.hidden=false;this.disabled=false;this.value='';this.checked=false;
  this.children=[];this.attrs={};this.textContent='';this.style={};this.onclick=null;this.handlers={};}
 addEventListener(event,fn){this.handlers[event]=fn}
 setAttribute(k,v){this.attrs[k]=v}
 removeAttribute(k){delete this.attrs[k]}
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=children}
}
const ids=[...page.matchAll(/id="([^"]+)"/g)].map(x=>x[1]),elements=new Map(ids.map(id=>[id,new Element(id)]));
const screens=Array.from({length:6},(_,i)=>{const e=new Element();e.dataset.screen=String(i);return e});
const buttons=Array.from({length:6},(_,i)=>{const e=new Element();e.dataset.step=String(i);return e});
const saved=new Map(),fakeStorage={getItem:key=>saved.get(key)||null,setItem:(key,v)=>saved.set(key,String(v))};
const document={getElementById:id=>elements.get(id)||null,querySelectorAll:sel=>sel==='[data-screen]'?screens:sel==='[data-step]'?buttons:[],
 createElement:()=>new Element(),createTextNode:value=>({textContent:value})};
let workerCount=0,workerTerminated=0;
class MockWorker{
 constructor(path){assert.equal(path,'./diagnostic-worker.js');workerCount++}
 postMessage(){queueMicrotask(()=>this.onmessage({data:{kind:'SELF_TEST',status:'PASS',bytes:32}}))}
 terminate(){workerTerminated++}
}
const ctx={window:{PigaDeviceStore:{initialize:async()=>{},get:async()=>null,status:()=> 'indexeddb'}},
 document,localStorage:fakeStorage,navigator:{onLine:true},location:{href:''},
 Worker:MockWorker,setTimeout,clearTimeout,queueMicrotask,Date,Promise,JSON,String,Number,Object,
 speechSynthesis:{cancel(){},speak(){}},SpeechSynthesisUtterance:class{constructor(t){this.text=t}},console};
await vm.runInNewContext(script,ctx,{filename:'setup.js'});
assert.equal(elements.get('setupPosition').textContent,'1 / 6');
buttons[4].handlers.click();
assert.equal(elements.get('setupPosition').textContent,'5 / 6');
elements.get('setupNext').onclick();
assert.equal(elements.get('setupPosition').textContent,'6 / 6');
assert.equal(screens.filter(x=>!x.hidden).length,1);
elements.get('setupFinish').onclick();
assert.notEqual(JSON.parse(saved.get('piga-ortho-setup-v1')||'{}').completed,true,'Consent missing must not mark completed');
elements.get('setupConsent').checked=true;
elements.get('setupFinish').onclick();
assert.equal(JSON.parse(saved.get('piga-ortho-setup-v1')).completed,true);
elements.get('setupBack').onclick();
assert.equal(elements.get('setupPosition').textContent,'5 / 6');
elements.get('setupScan').onclick();
assert.match(elements.get('setupNetworkResult').textContent,/ONLINE/);
await elements.get('setupRunWorker').onclick();
assert.equal(workerCount,1);assert.equal(workerTerminated,1);
assert.match(elements.get('setupWorkerResult').textContent,/BEREIT/);
elements.get('setupSkip').onclick();
assert.equal(ctx.location.href,'./dashboard.html');
console.log('PIGA ORTHO setup QA PASS: offline assets, six steps, consent, navigation, network and terminated worker.');
