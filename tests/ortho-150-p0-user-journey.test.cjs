'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../piga-ortho-3d'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('Public registration never silently swallows native browser validation',()=>{
 const h=read('portal.html'),js=read('portal.js');
 assert.match(h,/id="authHelp"/);assert.match(h,/aria-describedby="authHelp"/);
 assert.match(h,/id="loginState"[^>]+role="status"/);
 assert.match(js,/addEventListener\('invalid',/);
 assert.match(js,/Passwort für die Registrierung: mindestens 12 Zeichen/);
 assert.match(js,/removeAttribute\('minlength'\)/);
 assert.match(js,/setAttribute\('minlength','12'\)/);
 assert.match(js,/friendlyAuthError/);
 assert.match(js,/Invalid login credentials/i);
});
test('Studio and portal expose actual local movement route rather than a 404',()=>{
 for(const f of ['portal.html','studio.html','dashboard.html'])assert.match(read(f),/href="\.\/movement\.html"/);
 for(const f of ['movement.html','movement.js','movement-core.js','movement.css','print-geometry.js'])assert(fs.existsSync(path.join(root,f)),f);
 assert.match(read('movement.html'),/Forschungs- und Planungsprototyp/);
 assert.match(read('movement.js'),/gate1/);
});
test('Mobile PWA coherently busts the overlay cache, without pre-caching account pages',()=>{
 const sw=read('sw.js');
 assert.match(sw,/const CACHE='piga-ortho-v159-gated-movement-recovery'/);
 for(const f of ['movement.html','movement.js','movement.css','movement-core.js','print-geometry.js'])assert(sw.includes("'./"+f+"'"),f);
 for(const f of ['portal.html','portal.js','portal-auth.html','portal-auth-callback.js'])assert(!sw.includes("'./"+f+"'"),'auth resource must not be offline cached '+f);
 assert.match(read('setup-offer.js'),/if\(PAGE!=='dashboard\.html'\)return/);
});
test('3D and PIGA identity pages load local PWA manifest rather than blocking it',()=>{
 for(const f of ['studio.html','dashboard.html','movement.html'])assert.match(read(f),/manifest-src 'self'/);
 const c=read('portal.css');assert.match(c,/--piga-ink:/);assert.match(c,/--piga-gold:/);assert.match(c,/#loginState\.error/);
});
test('Clinical printing and actual patient diagnosis are never silently unlocked',()=>{
 assert.match(read('movement.html'),/keine klinische Therapie- oder Druckfreigabe|Forschungs- und Planungsprototyp/i);
 assert.match(read('studio.html'),/keine eigenständige Diagnose|Keine eigenständige Diagnose/i);
 assert.match(read('portal.html'),/Keine klinische Live-Freigabe/);
});
