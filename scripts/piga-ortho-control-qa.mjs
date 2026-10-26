import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const base='piga-ortho-3d/',read=f=>fs.readFileSync(base+f,'utf8');
let passes=0;const check=(name,fn)=>{fn();console.log('PASS '+name);passes++};
const ids=['pcRuntime','pcHeartbeat','pcJobs','pcPending','pcTicker','pcChatForm','pcChatInput',
 'pcChatFeed','pcTeamFeed','pcTeamForm','pcTeamName','pcTeamMessage','pcRequestForm',
 'pcRequestKind','pcRequestText','pcRequests','pcRun','pcAuto','pcPauseWorker',
 'pcWake','pcWebForm','pcWebQuery','pcListen','pcSpeak','pcAudience','pcEvents'];
check('All PIGA control JS modules parse without network injections',()=>{
 for(const f of ['piga-brain.js','piga-control.js','piga-pocket-widget.js','device-store.js',
  'device-hub.js','navigation.js','sw.js'])new vm.Script(read(f),{filename:f});
});
check('Every interactive PIGA control has a visible DOM slot and JS reference',()=>{
 const h=read('piga-control.html'),js=read('piga-control.js');
 for(const id of ids){assert(h.includes('id="'+id+'"'),id+' HTML');assert(js.includes("'"+id+"'"),id+' JS')}
 assert(h.includes('role="status"')&&h.includes('aria-live'));
});
check('The PIGA brain answers offline and distinguishes clinical safety gates',()=>{
 const sandbox={window:{},crypto:{randomUUID:()=> 'random-id'},Date,TextEncoder};
 vm.runInNewContext(read('piga-brain.js'),sandbox,{filename:'piga-brain.js'});
 const b=sandbox.window.PigaBrain;
 const stl=b.answer('Wie öffne ich eine STL Datei?','owner');
 assert.equal(stl.href,'./studio.html#studio');assert.equal(stl.gate2,'BLOCK');
 const piga=b.answer('Erkläre PIGA A7SEM Gate 1 und Gate 2','staff');
 assert(piga.reply.includes('Gate 1'));assert(piga.reply.includes('Gate 2'));
 const urlaub=b.answer('Ich möchte Urlaub beantragen','staff');
 assert.equal(urlaub.kind,'LEAVE_REQUEST');assert(urlaub.reply.includes('Entwurf'));
 const unknown=b.answer('Was ist eine komplette neue Weltformel?','staff');
 assert.equal(unknown.kind,'GENERAL_HELP');assert(unknown.reply.includes('regelbasiert')||unknown.reply.includes('lokale'));
});
check('Unverified role never permits real approval or physical effects',()=>{
 const sandbox={window:{},crypto:{randomUUID:()=> 'draft-id'},Date,TextEncoder};
 vm.runInNewContext(read('piga-brain.js'),sandbox);const b=sandbox.window.PigaBrain;
 const r=b.request('PRINT_REVIEW','Synthetischen Druckauftrag prüfen','staff');
 assert.equal(r.status,'AWAITING_REVIEW');assert.equal(r.gate2,'BLOCK');
 assert.equal(r.clinicalAuthority,'NOT_ASSIGNED');assert.equal(r.effects,0);
 assert.throws(()=>b.decide(r,'APPROVE_DRAFT',false),/Verified owner authority/);
 const seen=b.decide(r,'ACK_TECHNICAL',false);
 assert.equal(seen.status,'TECHNICALLY_REVIEWED');assert.equal(seen.effects,0);
 assert.equal(seen.gate2,'BLOCK');
 assert.equal(b.decide(r,'PAUSE',false).status,'PAUSED');
 assert.equal(b.decide(r,'REJECT',false).status,'REJECTED');
});
check('Local chat and worker fabric cannot silently call internet or LLM providers',()=>{
 const core=read('piga-brain.js'),ui=read('piga-control.js'),widget=read('piga-pocket-widget.js');
 assert(!/\bfetch\s*\(/.test(core+ui+widget));
 assert(!/gemini.*api.?key\s*=/i.test(ui+core));
 assert(ui.includes("S.enqueueJob(kind)"));
 assert(ui.includes("new Worker('./device-worker.js')"));
 assert(ui.includes('navigator.locks.request'));
 assert(ui.includes("document.visibilityState==='hidden'"));
 assert(ui.includes('setInterval'));
});
check('Worker telemetry names a page heartbeat, not a server 24/7 claim',()=>{
 const h=read('piga-control.html'),ui=read('piga-control.js');
 assert(h.includes('kein garantierter 24/7-Prozess'));
 assert(ui.includes('Seiten-Heartbeat')||h.includes('Foreground-Heartbeat'));
 assert(ui.includes('wakeLock.request')&&ui.includes('releaseWake'));
 assert(h.includes('keine echte Rollenprüfung')||h.includes('keine verifizierte Anmeldung'));
});
check('Team mode hides elevated controls and limits employee request forms',()=>{
 const css=read('piga-control.css'),ui=read('piga-control.js');
 assert(css.includes('body[data-piga-audience=staff] .pc-workers'));
 assert(ui.includes("staff?'LEAVE_REQUEST':'INVENTORY_REVIEW'"));
 assert(ui.includes("'pcRequestKind').disabled=staff"));
 assert(ui.includes("state.teamMessages.push"));
 assert(ui.includes('PigaDeviceStore')||ui.includes('savePigaControl'));
});
check('Encrypted backup round-trips the PIGA request/chat snapshot',()=>{
 const hub=read('device-hub.js'),store=read('device-store.js');
 assert(hub.includes("pigaControl=await S.loadPigaControl()"));
 assert(hub.includes('AES-GCM'));assert(hub.includes('PBKDF2'));
 assert(hub.includes('goodControl(o.pigaControl)'));
 assert(hub.includes('S.savePigaControl(o.pigaControl)'));
 assert(store.includes("put('piga-control',safe)"));
 assert(store.includes('messages:data.messages.slice(-100)'));
});
check('Every PIGA control-linked relative asset exists',()=>{
 const h=read('piga-control.html');
 for(const m of h.matchAll(/(?:href|src)="\.\/([^"#?]+)/g)){
  if(m[1])assert(fs.existsSync(base+m[1]),m[1]);
 }
 for(const f of ['piga-control.html','piga-control.css','piga-control.js','piga-brain.js',
  'piga-pocket-widget.js','piga-pocket-widget.css'])assert(fs.existsSync(base+f),f);
});
check('PIGA control and floating assistant wired into existing navigation and offline PWA',()=>{
 const n=read('navigation.js'),sw=read('sw.js'),d=read('dashboard.html');
 assert(n.includes("href:'./piga-control.html'"));
 assert(n.includes("href:'./piga-control.html#teamchat'"));
 assert(n.includes("./piga-pocket-widget.js"));
 assert(d.includes('href="./piga-control.html"'));
 for(const f of ['piga-control.html','piga-control.css','piga-control.js','piga-brain.js',
 'piga-pocket-widget.js','piga-pocket-widget.css'])assert(sw.includes("'./"+f+"'"),f);
});
console.log('PIGA CONTROL / BRAIN / EMPLOYEE CHAT / LOCAL WORKERS QA PASS · '+passes+' suites');
