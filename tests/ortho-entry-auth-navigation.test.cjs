'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../piga-ortho-3d');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
test('Entry no longer silently bypasses the practice login',()=>{
 const h=read('index.html');
 assert.doesNotMatch(h,/<meta\s+http-equiv=["']refresh["']/i);
 assert.match(h,/<a[^>]+href="\.\/portal\.html"[^>]*>Anmelden oder registrieren<\/a>/);
 assert.match(h,/<a[^>]+href="\.\/dashboard\.html"[^>]*>Demo-Dashboard öffnen<\/a>/);
 assert.match(h,/Praxis-Anmeldung/);
 assert.match(h,/Technische Demo/);
});
test('Distinct research/3D and practice tools remain grounded',()=>{
 const h=read('index.html');
 for(const file of ['portal.html','dashboard.html','studio.html','movement.html','entry.css','manifest.webmanifest','icon.svg']){
  assert(fs.existsSync(path.join(root,file)),file+' must exist');
  assert(h.includes('./'+file),file+' must be linked');
 }
});
test('No false claims of medical access or automatic privileges',()=>{
 const h=read('index.html');
 assert.match(h,/E-Mail-Bestätigung und getrennte Praxisfreigabe erforderlich/);
 assert.match(h,/keine klinische Freigabe/i);
 assert.match(h,/Gate 2.*BLOCK/);
 assert.doesNotMatch(h,/<form|<script|onerror=|onclick=/i);
});
test('Entry does not break legacy auth redirect for older users',()=>{
 const old=read('auth.html');
 assert.match(old,/http-equiv="refresh" content="0; url=\.\/dashboard\.html"/);
 const entry=read('index.html');
 assert.match(entry,/id="praxis"/);
 assert.match(entry,/id="demo"/);
});
test('Accessible mobile layout without third-party services',()=>{
 const h=read('index.html'),css=read('entry.css');
 assert.match(h,/<html lang="de">/);
 assert.match(h,/class="skip" href="#inhalt"/);
 assert.match(h,/<main id="inhalt">/);
 assert.match(h,/Content-Security-Policy/);
 assert.match(css,/@media\(max-width:750px\)/);
 assert.match(css,/min-height:48px/);
 assert.doesNotMatch(h,/https?:\/\/|service_role|sb_secret_/);
});
