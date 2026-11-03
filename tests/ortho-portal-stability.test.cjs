'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../piga-ortho-3d/portal-stability.js');
test('only newest clinic task read can update visible practice',()=>{
 const gate=S.latestOnly(),first=gate.begin(),second=gate.begin();
 assert.equal(gate.valid(first),false);
 assert.equal(gate.valid(second),true);
 gate.invalidate();
 assert.equal(gate.valid(second),false);
 assert.equal(gate.valid(0),false);
});
test('async file hashes from stale selections cannot unlock print',async()=>{
 const gate=S.latestOnly();
 const first=gate.begin();
 const slow=new Promise(resolve=>setImmediate(()=>resolve(gate.valid(first))));
 const second=gate.begin();
 assert.equal(gate.valid(first),false);
 assert.equal(gate.valid(second),true);
 assert.equal(await slow,false);
 gate.invalidate();
 assert.equal(gate.valid(second),false);
});
test('popup is once per task per clinic until explicitly rearmed',()=>{
 const alerts=S.alertTracker();
 assert.equal(alerts.shouldNotify('a','task1'),true);
 assert.equal(alerts.shouldNotify('a','task1'),false);
 assert.equal(alerts.shouldNotify('b','task1'),true);
 alerts.forget('a','task1');
 assert.equal(alerts.shouldNotify('a','task1'),true);
 alerts.reset();
 assert.equal(alerts.shouldNotify('a','task1'),true);
 assert.equal(alerts.shouldNotify('',null),false);
});
test('printing remains blocked without every fresh attestation',()=>{
 const base={verifiedOwner:true,filePresent:true,sha256:'a'.repeat(64),size:3200,checked:4,model:'Formlabs Form 4'};
 assert.equal(S.printEligible(base),true);
 for(const mutation of [
  {verifiedOwner:false},{filePresent:false},{sha256:'invalid'},{size:0},
  {size:80*1024*1024+1},{checked:3},{model:'    '},
 ])assert.equal(S.printEligible({...base,...mutation}),false,JSON.stringify(mutation));
});

test('first-install guidance cannot block clinical workflows',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
 const script=fs.readFileSync(path.join(__dirname,'../piga-ortho-3d/setup-offer.js'),'utf8');
 for(const page of ['movement.html','portal.html','studio.html','imaging.html','handoff.html']){
   const blockedDocument=new Proxy({}, {get(){throw Error('Setup overlay attempted DOM access on '+page);}});
   assert.doesNotThrow(()=>vm.runInNewContext(script,{
     location:{pathname:'/piga-ortho-3d/'+page},document:blockedDocument
   }),page);
 }
});
