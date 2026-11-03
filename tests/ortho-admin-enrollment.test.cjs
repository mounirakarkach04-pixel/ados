'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../piga-ortho-3d');
const read=s=>fs.readFileSync(path.join(root,s),'utf8');
const html=read('portal.html'),js=read('portal.js'),sql=read('migrations/20261103_platform_admin_enrollment.sql');
test('Admin activation control exists only in signed-in restricted workspace',()=>{
 assert.match(html,/<section id="signedIn" hidden>/);
 assert.match(html,/<section class="panel" id="adminEnrollment" hidden>/);
 assert.match(html,/<form id="adminClaimForm"/);
 assert.match(html,/pattern="PIGA-ADMIN-\[A-F0-9\]\{48\}"/);
});
test('Admin activation uses authenticated RPC and readback not local role forging',()=>{
 assert.match(js,/rpc\/ortho_platform_claim_admin/);
 assert.match(js,/result!==true/);
 assert.match(js,/if\(!admin\)throw Error\('Adminrolle konnte nach Aktivierung nicht zurückgelesen werden/);
 assert.match(js,/\$\('adminEnrollment'\)\.hidden=admin/);
});
test('Code is one-time, hashed, expiring and email bound',()=>{
 assert.match(sql,/extensions\.gen_random_bytes\(24\)/);
 assert.match(sql,/pg_catalog\.sha256\(convert_to\(issued_token/);
 assert.match(sql,/token_hash=encode\(pg_catalog\.sha256\(convert_to\(p_code/);
 assert.match(sql,/expires_at>clock_timestamp\(\)/);
 assert.match(sql,/status='issued'/);
 assert.match(sql,/status='activated',activated_at/);
 assert.match(sql,/activated_user_id=actor,token_hash=null/);
 assert.match(sql,/email=verified_email/);
});
test('Admin claim requires verified nonanonymous Supabase identity',()=>{
 assert.match(sql,/actor uuid:=auth\.uid\(\)/);
 assert.match(sql,/email_confirmed_at is not null/);
 assert.match(sql,/is_anonymous,false/);
 assert.match(sql,/revoke all on function public\.ortho_platform_claim_admin\(text\) from PUBLIC,anon/);
 assert.match(sql,/grant execute on function public\.ortho_platform_claim_admin\(text\) to authenticated/);
});
test('Privileged invitation issuing is inaccessible to client roles',()=>{
 assert.match(sql,/create or replace function ortho_private\.issue_platform_admin_invitation/);
 assert.match(sql,/revoke all on function ortho_private\.issue_platform_admin_invitation\(text,integer\) from PUBLIC,anon,authenticated/);
 assert.match(sql,/revoke all on ortho_private\.platform_admin_preapprovals from PUBLIC,anon,authenticated/);
});
test('Admin activation cannot grant clinical or printer authority',()=>{
 assert.doesNotMatch(sql,/insert into public\.ortho_clinic_memberships|insert into public\.ortho_clinics|insert into public\.ortho_staff|grant complimentary|printer_start|printer_commands/i);
 assert.match(sql,/NO CLINICAL RIGHTS/);
});
test('Signup and reset redirects are explicit and no secret API credentials introduced',()=>{
 assert.match(js,/new URL\('\.\/auth\.html',location\.href\)/);
 assert.match(js,/auth\/v1\/signup\?redirect_to=/);
 assert.match(js,/auth\/v1\/recover\?redirect_to=/);
 assert.doesNotMatch(js,/service_role|sb_secret_|SUPABASE_SECRET_KEY/);
});
