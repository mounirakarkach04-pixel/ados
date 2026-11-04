'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../piga-ortho-3d');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
test('PIGA A7SEM identity can remain verified when a separate practice RPC is unavailable',()=>{
 const s=read('portal.js');
 assert.match(s,/const \[membershipResult,adminResult\]=await Promise\.allSettled\(/);
 assert.match(s,/const membershipUnavailable=membershipResult\.status==='rejected'/);
 assert.match(s,/E-Mail-Konto bestätigt\. Praxisberechtigung derzeit nicht überprüfbar \(DELAY\)/);
 assert.match(s,/if\(membershipUnavailable\)[\s\S]{0,450}return;/);
});
test('Unavailable practice or admin permissions never unlock clinical workspace or admin enrollment',()=>{
 const s=read('portal.js');
 assert.match(s,/role=null;clinic=null;clinics=\[\];admin=false;/);
 assert.match(s,/\$\('clinicWorkspace'\)\.hidden=true;\$\('admin'\)\.hidden=true;\$\('adminEnrollment'\)\.hidden=true;/);
 assert.match(s,/\$\('adminEnrollment'\)\.hidden=admin\|\|adminUnavailable/);
 assert.match(s,/const membership=membershipUnavailable\?\[\]:membershipResult\.value/);
});
test('Registration and recovery remain separate from backend role admission',()=>{
 const s=read('portal.js'),h=read('portal.html');
 assert.match(s,/request\('\/auth\/v1\/signup\?redirect_to=/);
 assert.match(s,/request\('\/auth\/v1\/recover\?redirect_to=/);
 assert.match(s,/request\('\/auth\/v1\/user'\)/);
 assert.match(h,/id="loginForm"/);
 assert.match(h,/id="accessMessage"/);
 assert.match(h,/id="clinicWorkspace" hidden/);
});
test('No fake role on a pure confirmed account or old user password minimum',()=>{
 const s=read('portal.js');
 assert.match(s,/else \$\('password'\)\.removeAttribute\('minlength'\)/);
 assert.match(s,/clinic=null;clinics=\[\];admin=false/);
 assert.doesNotMatch(s,/admin=true;\s*\$\('clinicWorkspace'\)\.hidden=false/);
});

test('Rejected Auth identity cannot retain a session or accidentally show workspace',()=>{
 const s=read('portal.js');
 assert.match(s,/invalid access token\|invalid jwt\|jwt expired\|server 401/);
 assert.match(s,/catch\(e\)\{if\(!\$\('loginPanel'\)\.hidden\)\{session=null;identity=null;role=null;clinic=null;clinics=\[\];admin=false/);
 assert.match(s,/Die Anmeldung konnte nicht sicher bestätigt werden/);
});
