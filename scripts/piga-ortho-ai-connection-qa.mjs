import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const base='piga-ortho-3d/';
const read=name=>fs.readFileSync(base+name,'utf8');
const setup=read('setup.html'),script=read('ortho-ai-status.js'),css=read('setup.css'),widget=read('piga-pocket-widget.css'),nav=read('navigation.js'),sw=read('sw.js');
for(const name of ['ortho-ai-status.js','setup.html','setup.css','piga-pocket-widget.css'])
 assert(fs.existsSync(base+name),'Missing new file: '+name);
new vm.Script(script);
for(const id of ['setupAiBadge','setupAiResult','setupCheckAi'])assert(setup.includes('id="'+id+'"'),id);
assert(setup.includes('src="./ortho-ai-status.js"'),'client must load AI connection');
assert(setup.includes("connect-src https://pigapocket.com"),'allow only managed status endpoint');
assert(sw.includes("'./ortho-ai-status.js'"),'offline cache missing AI client');
assert(nav.includes("filename==='setup.html'?'setup'"),'setup must not highlight 3D tab');
assert(widget.includes('max-height:min(46dvh,390px)'),'mobile widget must fit viewport');
assert(css.includes('.setup-ai-card'),'mobile AI step should be compact');
assert(!script.includes('localStorage'),'no client-side API keys');
assert(!/GEMINI_API_KEY\s*[=:]\s*['"`][A-Za-z0-9]/.test(script),'no embedded API key');
assert(!/method:\s*['"]POST/.test(script),'AI status must not perform inference');
assert(script.includes("credentials:'omit'"),'no cookies transmitted to public read-only status');

class El{
 constructor(){this.textContent='';this.dataset={};this.disabled=false;this.handlers={};}
 addEventListener(type,fn){this.handlers[type]=fn}
}
const ids=new Map(['setupAiBadge','setupAiResult','setupCheckAi'].map(x=>[x,new El()]));
let hits=0;
const request=async(url,init)=>{
 hits++;assert.equal(url,'https://pigapocket.com/api/piga/assistant/v1/status?app=ortho');
 assert.equal(init.method,'GET');assert.equal(init.credentials,'omit');
 return {ok:true,json:async()=>({schema:'piga.shared.voice.v1',app:'ortho',ready:false,state:'WORKERS_AI_OR_QUOTA_UNAVAILABLE'})};
};
const context={document:{getElementById:id=>ids.get(id)||null},fetch:request,
 AbortController:class{constructor(){this.signal={}}abort(){}},setTimeout,clearTimeout};
vm.runInNewContext(script,context,{filename:'ortho-ai-status.js'});
assert.equal(hits,0,'status check only on intentional button click');
await ids.get('setupCheckAi').handlers.click();
assert.equal(hits,1);
assert.match(ids.get('setupAiResult').textContent,/Gemeinsame PIGA-KI noch nicht bereit/);
assert.match(ids.get('setupAiResult').textContent,/WORKERS_AI_OR_QUOTA_UNAVAILABLE/);
assert.equal(ids.get('setupAiBadge').dataset.state,'warn');
assert.equal(ids.get('setupCheckAi').disabled,false);
console.log('PIGA ORTHO AI onboarding QA PASS: explicit status read, no leaked key or provider call, responsive compact UI.');
