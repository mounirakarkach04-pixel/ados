import fs from 'node:fs'; import assert from 'node:assert/strict';import vm from 'node:vm';
const root='piga-ortho-3d/';
const f=n=>fs.readFileSync(root+n,'utf8');
const picture=fs.readFileSync(root+'visuals/piga-real-dentition.png');
assert.equal(picture.readUInt32BE(16),1672);
assert.equal(picture.readUInt32BE(20),940);
for(const n of ['setup.html','dashboard.html','piga-control.html','sales.html','imaging.html']){
 assert(f(n).includes('piga-real-dentition.png'),n+' image check');}
new vm.Script(f('voice.js'));
assert(f('piga-voice.html').includes('id="voiceLoad"'));
assert(f('sw.js').includes('piga-real-dentition.png'));
console.log('Dentition and local voice source checks passed');