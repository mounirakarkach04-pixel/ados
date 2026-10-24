#!/usr/bin/env node
"use strict";
/* ADOS 2026: three bounded browser loops, fictional-data-only test. */
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),http=require("node:http"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const {chromium}=require("playwright");
const baseDir=path.resolve("."),docs=new Set(["index.html","studio.html","datenschutz.html","nutzungsbedingungen.html","downloads/ADOS_Governance_Lite_v0_6_OFFLINE.html","cover.jpg"]);
let browser,server,base,events=[],failed=[];
const hash=x=>crypto.createHash("sha256").update(x).digest("hex");
async function start(){server=http.createServer((req,res)=>{let pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname).replace(/^\/+/,"");if(pathname==="")pathname="index.html";if(!docs.has(pathname)){res.writeHead(404);res.end("Not found");return;}try{const f=fs.readFileSync(path.join(baseDir,pathname));res.writeHead(200,{"content-type":pathname.endsWith(".html")?"text/html;charset=utf-8":"image/jpeg","cache-control":"no-store"});res.end(f)}catch(e){res.writeHead(404);res.end("Missing")}});await new Promise(r=>server.listen(0,"127.0.0.1",r));base="http://127.0.0.1:"+server.address().port}
async function open(context,file){const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(String(e.message||e)));const response=await page.goto(base+"/"+file,{waitUntil:"load",timeout:20000});assert.equal(response.status(),200,file+" not HTTP 200");return {page,errors}}
async function studio(context,cycle){
const {page,errors}=await open(context,"studio.html");try{
 await page.setViewportSize({width:390,height:845});
 assert((await page.locator(".author").innerText()).includes("MOUNIR AKARKACH"));
 assert.equal(await page.locator(".step").count(),3);
 let dimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 assert(dimensions.scroll<=dimensions.width+2,"Mobile overflow "+JSON.stringify(dimensions));
 await page.locator("#scenario").selectOption("5");assert.equal((await page.locator("#gate1").innerText()).trim(),"ALLOW");
 await page.locator("#scenario").selectOption("3");assert.equal((await page.locator("#gate1").innerText()).trim(),"BLOCK");
 await page.locator("#scenario").selectOption("0");assert.equal((await page.locator("#gate1").innerText()).trim(),"DELAY");
 const count=await page.locator(".entry").count();
 await page.locator("#counterfactual").click();assert((await page.locator("#sim-result").innerText()).includes("Gate 2 bleibt BLOCK"));assert.equal(await page.locator(".entry").count(),count);
 await page.locator("#claim").fill("Eine neue synthetische Beobachtung für den Übungsbericht");
 await page.locator("#provenance").fill("PAT-REAL-123");await page.locator("#add-evidence").click();
 assert.equal(await page.locator(".entry").count(),count,"Rejected source accepted");
 await page.locator("#provenance").fill("SYN-STUDY-TRAINING-42");await page.locator("#kind").selectOption("counter");await page.locator("#stance").selectOption("b");
 await page.locator("#add-evidence").click();assert.equal(await page.locator(".entry").count(),count+1);
 await page.locator("#student-status").selectOption("DELAY");await page.locator("#grade").click();assert((await page.locator("#grade-result").innerText()).includes("Korrekt"));
 await page.locator("#ledger [data-remove]").last().click();assert.equal(await page.locator(".entry").count(),count);
 for(const id of ["export-json","export-csv"]){const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#"+id).click()]);assert(dl.suggestedFilename().endsWith(id.endsWith("json")?".json":".csv"))}
 await page.evaluate(()=>{window.__printTest=false;window.print=()=>window.__printTest=true});await page.locator("#print").click();assert(await page.evaluate(()=>window.__printTest));
 await page.locator("#case-next").click();assert.equal((await page.locator("#case-id").innerText()).trim(),"SYN-ADOS-002");
 await page.locator("#reset").click();assert.equal(await page.locator("#evidence-count").innerText(),"2");
 assert.equal(errors.length,0,"JS errors "+JSON.stringify(errors));
 events.push({cycle,area:"studio",pass:true,mobile:dimensions,downloads:2,features:11});
}finally{await page.close()}}
async function site(context,cycle){for(const file of ["index.html","datenschutz.html","nutzungsbedingungen.html"]){const {page,errors}=await open(context,file);try{
 const links=await page.locator("a[href]").evaluateAll(as=>as.map(x=>x.getAttribute("href")));
 for(const h of links){if(h.startsWith("#"))assert(await page.locator('[id="'+h.slice(1)+'"]').count(),"Missing anchor "+file+" "+h);if(/^[\w-]+\.html$/.test(h))assert(docs.has(h),"Missing HTML link "+file+" -> "+h)}
 if(file==="index.html"){assert(await page.locator('a[href="studio.html"]').count()>0);assert(await page.locator('.author-line,.logo').count()>0);assert((await page.locator("#evidence-title").innerText()).includes("Weniger Behauptung"))}
 assert.equal(errors.length,0,file+" JS errors: "+errors.join(";"));
 events.push({cycle,area:file,pass:true,links:links.length});
}finally{await page.close()}}}
async function legacy(context,cycle){const {page,errors}=await open(context,"downloads/ADOS_Governance_Lite_v0_6_OFFLINE.html");try{
 assert((await page.locator(".brand-caption").innerText()).includes("AKARKACH DIAGNOSTIC"));
 assert((await page.locator(".brand-identity").innerText()).includes("MOUNIR AKARKACH"));
 assert(await page.locator(".ados-quickstart").count()===1);
 assert(await page.locator(".nav-item").count()>=7);
 assert(await page.locator("#consent-demo").count()===1);
 assert.equal(errors.length,0,"Old Governance Lite changed behavior: "+errors.join("; "));
 events.push({cycle,area:"governance-lite-v0.6",pass:true,existingScripts:6});
}finally{await page.close()}}
async function offline(context,cycle){
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ados-studio-"));
const single=path.join(dir,"ADOS_Evidence_Studio_v1_OFFLINE.html");fs.copyFileSync(path.join(baseDir,"studio.html"),single);
const page=await context.newPage();const errs=[];page.on("pageerror",e=>errs.push(e.message));
try{await page.goto("file://"+single,{waitUntil:"load"});assert.equal(await page.locator("#scenario option").count(),6);
 assert.equal(await page.locator("a[data-online]").count()>0,true);
 assert((await page.locator('[role="status"]').first().innerText()).includes("Offline-Modus"));
 await page.locator("#scenario").selectOption("5");assert.equal((await page.locator("#gate1").innerText()).trim(),"ALLOW");
 assert.equal(errs.length,0,errs.join("; "));
 events.push({cycle,area:"file-offline-studio",pass:true});
}finally{await page.close();fs.rmSync(dir,{recursive:true,force:true})}}
async function remote(){const hosts=["https://mounirakarkach04-pixel.github.io/ados/","https://pigapocket.com/ados/"];const paths=["index.html","studio.html","datenschutz.html","nutzungsbedingungen.html","downloads/ADOS_Governance_Lite_v0_6_OFFLINE.html"];const list=[];
for(const host of hosts)for(const p of paths){let x={host,p,status:null,hashMatch:false};try{const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),12000);try{const res=await fetch(host+p,{signal:ac.signal});const raw=Buffer.from(await res.arrayBuffer());x.status=res.status;x.byteLength=raw.length;const local=fs.readFileSync(path.join(baseDir,p));x.hashMatch=res.ok&&hash(raw)===hash(local);x.liveHash=hash(raw);x.sourceHash=hash(local);if(host.includes("pigapocket")&&p==="studio.html"){x.authority=res.headers.get("x-piga-ados-authority");x.csp=res.headers.get("content-security-policy")}}finally{clearTimeout(tm)}}catch(e){x.error=String(e.message||e)}list.push(x)}return list}
(async()=>{let success=true,live=[];try{await start();browser=await chromium.launch({headless:true,args:["--no-sandbox"]});const context=await browser.newContext({acceptDownloads:true,reducedMotion:"reduce"});for(let cycle=1;cycle<=3;cycle++){for(const [name,fn] of [["studio",studio],["site",site],["legacy",legacy],["offline",offline]])try{await fn(context,cycle)}catch(e){const err={cycle,area:name,message:String(e.stack||e).slice(0,3000)};failed.push(err);console.error("ADOS_QA_FAIL "+JSON.stringify(err));throw e}console.log("ADOS_QA_LOOP "+cycle+"/3: PASS")}await context.close();live=await remote()}catch(e){success=false;console.error("ADOS_QA_WORKER_HALTED "+String(e.message||e))}finally{if(browser)await browser.close().catch(()=>{});if(server)await new Promise(r=>server.close(r));const report={status:success?"PASS":"FAIL",cycles:3,finishedLoops:[...new Set(events.filter(e=>e.area==="file-offline-studio").map(e=>e.cycle))].length,checks:events,failures:failed,live,clinicalGate2:"BLOCK",realPatientData:false};fs.mkdirSync("qa-reports",{recursive:true});fs.writeFileSync("qa-reports/ados-evidence-loop.json",JSON.stringify(report,null,2));console.log("ADOS_QA_SUMMARY "+JSON.stringify({status:report.status,loops:report.finishedLoops,checks:events.length,failures:failed.length,liveMatched:live.filter(x=>x.hashMatch).length,liveTotal:live.length}));if(!success||failed.length)process.exitCode=1}})();
