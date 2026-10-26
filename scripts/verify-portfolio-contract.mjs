#!/usr/bin/env node
/* PIGA Portfolio source contract. Finite, deterministic, zero external calls.
   Source checks do not certify browser behavior, licenses, clinics or live deployment. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root,'quality','portfolio-registry.json'),'utf8'));
const errors = [];
let checked = 0;
function test(condition, id, why) { if (!condition) errors.push(id + ': ' + why); }
function attr(tag, key) {
  const pattern = new RegExp('\\b' + key + '\\s*=\\s*["\\x27]([^"\\x27]+)["\\x27]','i');
  return tag.match(pattern)?.[1] ?? null;
}
for (const a of registry.apps) {
  const file = path.join(root, a.path);
  if (!fs.existsSync(file)) { errors.push(a.id + ': missing ' + a.path); continue; }
  const html = fs.readFileSync(file,'utf8');
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? '';
  const main = html.match(/<main\b[^>]*>/i)?.[0] ?? '';
  const mainId = attr(main, 'id');
  const skip = html.match(/<a\b[^>]*class=["'][^"']*\bpiga-skip-link\b[^"']*["'][^>]*>/i)?.[0] ?? '';
  const css = html.match(/<link\b[^>]*href=["']([^"']*portfolio-polish\.css)["'][^>]*>/i)?.[1] ?? '';
  test(attr(htmlTag,'lang')===a.lang,a.id,'missing/wrong language ' + a.lang);
  test(/<meta\b[^>]*name=["']viewport["']/i.test(html),a.id,'missing viewport');
  test(/<meta\b[^>]*name=["']description["']/i.test(html),a.id,'missing description');
  test(/<title>[\s\S]*?<\/title>/i.test(html),a.id,'missing title');
  test(/<h1\b/i.test(html),a.id,'missing H1');
  test(Boolean(main),a.id,'missing main landmark');
  test(Boolean(mainId),a.id,'main must have id');
  test(attr(main,'tabindex')==='-1',a.id,'main must allow programmatic focus');
  test(Boolean(skip),a.id,'missing skip link');
  test(attr(skip,'href')==='#'+mainId,a.id,'skip link must target main');
  test(Boolean(css),a.id,'missing portfolio CSS link');
  if (css) test(fs.existsSync(path.resolve(path.dirname(file),css)),a.id,'missing CSS asset '+css);
  test((html.match(/portfolio-polish\.css/g)||[]).length===1,a.id,'portfolio CSS duplicate');
  test((html.match(/piga-skip-link/g)||[]).length===1,a.id,'skip link duplicate');
  checked++;
  console.log('CHECK ' + a.id.padEnd(20) + ' ' + a.path);
}
const sheet=fs.readFileSync(path.join(root,'quality','portfolio-polish.css'),'utf8');
test(/:focus-visible/.test(sheet),'design','no focus-visible style');
test(/prefers-reduced-motion/.test(sheet),'design','no reduced-motion handling');
test(registry.releasePolicy.fiveEngines.length===5,'governance','engine count not five');
test(registry.apps.length>=10,'inventory','expected at least ten entry points');
const room=fs.readFileSync(path.join(root,'quality','portfolio-control-room.html'),'utf8');
test(/portfolio-registry\.json/.test(room),'control-room','must load local portfolio registry');
test(/id=["']search["']/.test(room) && /id=["']area["']/.test(room),'control-room','missing search/filter UX');
test(/aria-live=["']polite["']/.test(room),'control-room','missing accessible status');
test(/Keine Live-Funktionszusage/.test(room),'control-room','no explicit release-status truth boundary');
const liveVerifier=fs.readFileSync(path.join(root,'scripts','portfolio-live-readback.mjs'),'utf8');
test(/--live/.test(liveVerifier) && /redirect: 'manual'/.test(liveVerifier),'readback','live must be opt-in and redirect-bounded');
console.log('\nPortfolio checked: ' + checked + '/' + registry.apps.length + '. Errors: ' + errors.length + '.');
for (const e of errors) console.error('FAIL ' + e);
process.exitCode = errors.length ? 1 : 0;
