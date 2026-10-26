// Dependency-free PIGA ACT accessibility and offline-scope regression checks.
// Run: node ai-act-intelligence/quality-accessibility.mjs
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import assert from 'node:assert/strict';
const dir=dirname(fileURLToPath(import.meta.url));
const read=name=>readFileSync(join(dir,name),'utf8');
const html=read('index.html'), css=read('design-v3.css'), sw=read('sw.js');
const checks=[
 ['German document language',()=>assert.match(html,/<html lang="de"/)],
 ['Keyboard skip navigation',()=>assert.match(html,/<a class="skip-link" href="#main-content">/)],
 ['Real skip destination',()=>assert.match(html,/<main id="main-content" tabindex="-1">/)],
 ['Skip link styled on focus',()=>assert.match(css,/\.skip-link:focus\s*\{/)],
 ['Keyboard focus indicator',()=>assert.match(css,/:focus-visible/)],
 ['Reduced motion',()=>assert.match(css,/prefers-reduced-motion:reduce/)],
 ['No inline event handlers in skip link',()=>assert.doesNotMatch(html,/<a class="skip-link"[^>]+on(?:focus|blur|click)=/i)],
 ['No cached cross-origin requests',()=>assert.match(sw,/url\.origin !== self\.location\.origin/)],
 ['No authenticated request interception',()=>assert.match(sw,/request\.headers\.has\("authorization"\)/)],
 ['Only explicitly enumerated public shell assets',()=>assert.match(sw,/!shellURLs\.has\(url\.href\)/)],
 ['Offline navigation has no arbitrary homepage fallback',()=>assert.doesNotMatch(sw,/catch\([^)]*=>\s*caches\.match\("\.\/index\.html"\)/)],
 ['Service worker refetches public assets bypassing stale HTTP cache',()=>assert.match(sw,/cache\.addAll\(SHELL\.map\(path => new Request\(path, \{cache:"reload"\}\)\)\)/)],
 ['Cache version forces CSS refresh for existing installations',()=>assert.match(sw,/piga-aiact-shell-v18-full-article-guides/)],
 ['Fixed mobile layout is included in cache refresh',()=>{assert.match(css,/@media screen and \(max-width:880px\)/);assert.match(css,/#view-results \.report-overview/)}],
 ['No private evidence paths in shell',()=>assert.doesNotMatch(sw,/\"\.\/(?:storage|auth|private|evidence)\//i)],
];
let failures=0;
for(const [name,fn] of checks){try{fn();console.log('PASS',name)}catch(e){failures++;console.error('FAIL',name,e.message)}}
if(failures)process.exitCode=1;
