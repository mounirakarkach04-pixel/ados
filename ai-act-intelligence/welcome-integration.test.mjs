import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
const dir=dirname(fileURLToPath(import.meta.url));
const read=name=>readFileSync(join(dir,name),"utf8");
const html=read("index.html"),style=read("design-v3.css"),sw=read("sw.js"),welcome=read("welcome-journey.mjs");
const checks=[
 ["welcome invitation",()=>assert.match(html,/WILLKOMMEN BEI PIGA/)],
 ["explicit free assessment",()=>assert.match(html,/Kostenfreie KI-Voranalyse starten/)],
 ["all 3 audience roles",()=>assert.deepEqual([...html.matchAll(/data-audience="(provider|deployer|both)"/g)].map(x=>x[1]),["provider","deployer","both"])],
 ["role field real",()=>assert.match(html,/id="f-role"/)],
 ["selection is accessible",()=>assert.equal((html.match(/aria-pressed="false"/g)||[]).length,3)],
 ["guide uses rendered result",()=>["result-guide-heading","result-guide-explanation","result-guide-cta","gate1","gate2"].forEach(id=>assert.match(html,new RegExp('id="'+id+'"')))],
 ["no new checkout shortcut",()=>assert.doesNotMatch(welcome,/location\.assign|functions\.invoke|fetch\s*\(/)],
 ["no visitor tracking or persistence",()=>assert.doesNotMatch(welcome,/localStorage|sessionStorage|sendBeacon|document\.cookie/)],
 ["demo strictly to own case",()=>assert.match(welcome,/if\(isDemo\).*destination:"assessment"/)],
 ["role choice does not submit form",()=>assert.match(welcome,/roleInput\.dispatchEvent/)],
 ["mobile onboarding layout",()=>assert.match(style,/\.audience-options\s*\{grid-template-columns:1fr/)],
 ["module loaded under self-only CSP",()=>{assert.match(html,/src="welcome-journey\.mjs"/);assert.match(html,/script-src 'self'/)}],
 ["public shell cache includes new module",()=>assert.match(sw,/"\.\/welcome-journey\.mjs"/)],
 ["cache never intercepts unauthorized data",()=>{assert.match(sw,/request\.headers\.has\("authorization"\)/);assert.match(sw,/!shellURLs\.has\(url\.href\)/)}]
];
let failed=0;for(const [name,fn] of checks){try{fn();console.log("PASS",name)}catch(e){failed++;console.error("FAIL",name,e.message)}}
if(failed)process.exitCode=1;else console.log("PASS "+checks.length+"/"+checks.length+" welcome-integration checks");
