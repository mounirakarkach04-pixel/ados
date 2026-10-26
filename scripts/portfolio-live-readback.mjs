#!/usr/bin/env node
/**
 * PIGA Portfolio canonical URL readback — public GET only, bounded and finite.
 * No credentials, cookies, API calls, inference, mutations or paid providers.
 * PASS checks reachability, HTTPS origin, HTML title and target hints;
 * it NEVER certifies user journeys, AI, patient safety, payment or Gate 2.
 *
 * node scripts/portfolio-live-readback.mjs           # offline contract check
 * node scripts/portfolio-live-readback.mjs --live    # explicit public HTTPS check
 * node scripts/portfolio-live-readback.mjs --live --only=nadias-bloom
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'quality/portfolio-registry.json'), 'utf8'));
const args = process.argv.slice(2);
const unknown = args.filter(x => x !== '--live' && !x.startsWith('--only='));
if (unknown.length) throw new Error('Unsupported args: ' + unknown.join(', '));
const live = args.includes('--live');
const only = args.find(x => x.startsWith('--only='))?.slice(7) || null;
const apps = only ? registry.apps.filter(x => x.id === only) : registry.apps;
if (apps.length === 0) throw new Error('Unknown app id: ' + only);
const hints = {
  'ados-portal': ['ADOS'],
  'ados-research': ['ADOS', 'Evidenz'],
  'ai-act': ['AI Act'],
  'nadias-bloom': ['Nadia'],
  'ortho-preview': ['ORTHO'],
  'cancer-research': ['Cancer'],
  'cancer-intake': ['Cancer', 'Intake'],
  'la-preuve': ['Preuve'],
  'la-preuve-lab': ['Preuve', 'LAB']
};
const normalize = s => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function pageTitle(html) {
  return html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || '';
}
function verifiedTarget(app) {
  if (!app.canonical) return null;
  const url = new URL(app.canonical);
  if (url.protocol !== 'https:' || url.host !== 'pigapocket.com' || url.username || url.password || url.search || url.hash) {
    throw new Error(app.id + ': canonical URL is not the approved public origin');
  }
  return url;
}
async function publicGet(input) {
  let current = input;
  for (let redirects = 0; redirects <= 2; redirects++) {
    const response = await fetch(current, {
      method: 'GET', redirect: 'manual', credentials: 'omit',
      headers: {accept: 'text/html'}, signal: AbortSignal.timeout(9000)
    });
    if (response.status >= 300 && response.status < 400) {
      if (redirects === 2) throw new Error('Too many redirects');
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect without location');
      const dest = new URL(location, current);
      if (dest.protocol !== 'https:' || dest.host !== 'pigapocket.com' || dest.username || dest.password) {
        throw new Error('Redirect outside approved HTTPS origin');
      }
      await response.body?.cancel();
      current = dest;
      continue;
    }
    const mime = response.headers.get('content-type') || '';
    const length = Number(response.headers.get('content-length') || 0);
    if (length > 2_000_000) throw new Error('HTML size exceeds 2 MB');
    if (response.status !== 200 || !/text\/html/i.test(mime)) {
      await response.body?.cancel();
      return {status: 'FAIL_HTTP', httpStatus: response.status, contentType: mime, finalUrl: current.href};
    }
    // Bound returned content even for chunked HTML with no Content-Length.
    let html = '';
    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let size = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) {
        await reader.cancel();
        throw new Error('Stream exceeds 2 MB');
      }
      html += decoder.decode(value, {stream: true});
    }
    html += decoder.decode();
    return {status: 'HTTP_OK', httpStatus: 200, contentType: mime, finalUrl: current.href, title: pageTitle(html)};
  }
  throw new Error('Unexpected redirect state');
}
async function check(app) {
  const row = {id: app.id, name: app.name, canonical: app.canonical};
  let url;
  try { url = verifiedTarget(app); }
  catch (e) { return {...row, status: 'INVALID_CANONICAL', reason: e.message}; }
  if (!url) return {...row, status: 'NO_CANONICAL'};
  if (!live) return {...row, status: 'NOT_CHECKED', reason: 'Use --live for bounded public readback'};
  try {
    const result = await publicGet(url);
    if (result.status !== 'HTTP_OK') return {...row, ...result};
    const title = normalize(result.title);
    const expected = hints[app.id] || [app.name];
    if (!expected.every(w => title.includes(normalize(w)))) {
      return {...row, ...result, status: 'FAIL_TITLE', expected, reason: 'Possible wrong app or homepage fallback'};
    }
    return {...row, ...result, status: 'PASS', scope: 'public HTTPS HTML/title only'};
  } catch(e) {
    return {...row, status:'FAIL_FETCH', reason: String(e.message || e).slice(0,180)};
  }
}
const results = [];
for (let i = 0; i < apps.length; i += 3) {
  results.push(...await Promise.all(apps.slice(i,i+3).map(check)));
}
const report = {
  schema: 'piga.portfolio.readback.v1',
  checkedAt: new Date().toISOString(),
  mode: live ? 'public_https' : 'offline_registry_only',
  releaseClaim: 'No production, backend, clinical, payment or autonomy certification',
  checks: results
};
fs.mkdirSync(path.join(root, 'qa-artifacts'), {recursive:true});
const out = path.join(root, 'qa-artifacts/portfolio-live-readback.json');
fs.writeFileSync(out, JSON.stringify(report,null,2)+'\n');
for(const r of results) console.log(r.status.padEnd(18) + r.id.padEnd(20) + (r.title || r.reason || ''));
console.log('Evidence: ' + path.relative(root,out));
const failures = results.filter(x => x.status.startsWith('FAIL_') || x.status === 'INVALID_CANONICAL');
process.exitCode = failures.length ? 1 : 0;
