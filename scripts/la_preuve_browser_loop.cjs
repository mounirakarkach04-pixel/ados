#!/usr/bin/env node
"use strict";
/* PIGA LA PREUVE LAB — actual Chromium E2E, bounded 3-cycle self-test.
 * Only fictional case data; no server effects and no patient data.
 * Run: node scripts/la_preuve_browser_loop.cjs
 */
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),http=require("node:http"),assert=require("node:assert/strict"),crypto=require("node:crypto"),cp=require("node:child_process");
const {chromium}=require("playwright");
const folder=path.resolve("la-preuve-avant-le-diagnostic");
const names=["index.html","app.html","workbench.html","studio.html","evaluation.html","licence.html","confidentialite.html","offline-suite.html","sw.js","manifest.webmanifest"];
const totalCycles=Math.min(3,Math.max(1,Number(process.env.QA_CYCLES||3)));
let browser,server,base,log=[],failures=[],downloadCount=0;
const mime=n=>n.endsWith(".html")?"text/html; charset=utf-8":n.endsWith(".js")?"text/javascript":"application/json";
function check(cond,label){if(!cond)throw Error(label)}
async function startServer(){
 server=http.createServer((req,res)=>{
  let pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  let part=path.basename(pathname);
  if(!names.includes(part)||pathname.includes("..")){res.writeHead(404);res.end("Not found");return}
  let file=path.join(folder,part);
  try{let data=fs.readFileSync(file);res.writeHead(200,{"content-type":mime(part),"cache-control":"no-store","access-control-allow-origin":"*"});res.end(data)}
  catch(e){res.writeHead(404);res.end("Not found")}
 });
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 base="http://127.0.0.1:"+server.address().port;
}
async function openPage(context,name){
 let page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(String(e.message||e)));
 const response=await page.goto(base+"/"+name,{waitUntil:"load",timeout:18000});
 check(response&&response.status()===200,"Page HTTP 200: "+name);
 await page.waitForTimeout(110);
 return {page,errors};
}
async function auditLinks(page,name){
 let links=await page.locator("a[href]").evaluateAll(list=>list.map(a=>({raw:a.getAttribute("href"),url:a.href})));
 let count=0;
 for(const l of links){
  if(l.raw.startsWith("#")){
   const exists=await page.evaluate(hash=>!!document.getElementById(hash),l.raw.slice(1));
   check(exists,name+": anchor #"+l.raw.slice(1)+" missing");
   count++;
  }else if(/^[\w-]+\.html(?:[?#].*)?$/.test(l.raw)){
   const file=l.raw.split(/[?#]/)[0];
   check(names.includes(file),name+": missing local href "+l.raw);
   count++;
  }
 }
 return count;
}
async function checkStudio(context,cycle){
 const {page,errors}=await openPage(context,"studio.html");
 try{
  await page.setViewportSize({width:390,height:844});
  check(await page.locator(".author").innerText()==="MOUNIR AKARKACH","Studio author absent");
  check(await page.locator(".steps a").count()===4,"Studio onboarding steps");
  check(await page.locator(".dot").count()===1000,"Studio waffle not 1000");
  const viewport=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
  check(viewport.scroll<=viewport.width+2,"Studio horizontal viewport overflow "+JSON.stringify(viewport));
  await page.locator("#verify").click();
  check((await page.locator("#result").innerText()).includes("Gate 1 : ALLOW"),"Studio Gate1 ALLOW missing");
  await page.locator("#glitch").click();await page.locator("#verify").click();
  check(!(await page.locator("#result").innerText()).includes("Gate 1 : ALLOW"),"Studio glitch not detected");
  await page.locator("#fault").selectOption("quality");await page.locator("#create").click();await page.locator("#verify").click();
  check((await page.locator("#result").innerText()).includes("Gate 1 : BLOCK"),"Studio custom quality not blocked");
  await page.locator("#exam-start").click();await page.locator("#exam-choice").selectOption("BLOCK");await page.locator("#exam-check").click();
  check((await page.locator("#exam-feedback").innerText()).includes("Correct"),"Studio exam mismatch");
  await page.locator("#lab").click();check(await page.locator("#doctor").isEnabled(),"Doctor role not activated");
  await page.locator("#doctor").click();check(await page.locator("#doctor").isDisabled(),"Doctor step incomplete");
  await page.locator("#prev").fill("3");await page.locator("#prev").dispatchEvent("input");
  check(await page.locator(".dot").count()===1000,"Bayes slider redraw error");
  await page.locator("#demo-fhir").click();await page.locator("#demo-hl7").click();
  check((await page.locator("#total-cases").innerText()).trim()==="6","Studio demo imports not added");
  await page.locator("#file").setInputFiles({name:"faux_patient.json",mimeType:"application/json",buffer:Buffer.from('{"resourceType":"Patient","id":"real"}')});
  check((await page.locator("#import-status").innerText()).includes("BLOQUÉ"),"Unsafe file was accepted");
  for(const id of ["json","csv"]){
   const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#"+id).click()]);
   check(dl.suggestedFilename().endsWith("."+id),"Studio export "+id+" filename");
   downloadCount++;
  }
  let links=await auditLinks(page,"studio");
  check(errors.length===0,"Studio JS errors "+JSON.stringify(errors));
  await page.locator("#reset").click();
  check((await page.locator("#total-cases").innerText()).trim()==="3","Studio reset incorrect");
  log.push({cycle,module:"studio",outcome:"PASS",checks:["mobile 390","1000 waffle","gate1","glitch","case-builder","exam","roles","Bayes","FHIR+HL7","privacy","JSON+CSV","reset"],links});
 }finally{await page.close()}
}
async function checkApp(context,cycle){
 const {page,errors}=await openPage(context,"app.html");
 try{
  await page.locator('[data-tab="lots"]').first().click();
  await page.locator("#lot-demo").click();
  await page.locator("#lot-run").click();
  const n=await page.locator("#lot-output tbody tr").count();
  check(n===100,"LAB CSV expected 100 rows, got "+n);
  check((await page.locator("#lot-summary").innerText()).length>10,"LAB missing lot summary");
  await page.locator('[data-tab="guide"]').first().click();
  await page.locator("#q-run").click();
  check((await page.locator("#q-out").innerText()).includes("Gate 2")||(await page.locator("#q-out").innerText()).includes("BLOCK"),"LAB Gate2 output missing");
  const links=await auditLinks(page,"app");
  check(errors.length===0,"LAB JS errors "+JSON.stringify(errors));
  log.push({cycle,module:"app",outcome:"PASS",batchRows:n,links});
 }finally{await page.close()}
}
async function checkWorkbench(context,cycle){
 const {page,errors}=await openPage(context,"workbench.html");
 try{
  await page.locator("#rounds").selectOption("8");
  await page.locator("#run").click();
  check((await page.locator("#m-total").innerText()).trim()==="384","Workbench 384 cases missing");
  await page.locator('[data-page="capa"]').first().click();
  check((await page.locator("#capa-page").innerText()).includes("/8"),"CAPA pagination missing");
  await page.locator("#capa-next").click();
  check((await page.locator("#capa-page").innerText()).includes("2 / 8")||(await page.locator("#capa-page").innerText()).includes("2/8"),"CAPA next page not working");
  await page.locator('[data-page="trace"]').first().click();
  await page.locator("#replay").click();
  check((await page.locator("#replay-result").innerText()).includes("384/384"),"Workbench replay mismatch");
  const links=await auditLinks(page,"workbench");
  check(errors.length===0,"Workbench JS errors "+JSON.stringify(errors));
  log.push({cycle,module:"workbench",outcome:"PASS",cases:384,links});
 }finally{await page.close()}
}
async function checkPilot(context,cycle){
 const {page,errors}=await openPage(context,"evaluation.html");
 try{
  check(await page.locator("#begin").isDisabled(),"Pilot should require consent");
  await page.locator("#consent").check();check(await page.locator("#begin").isEnabled(),"Pilot consent did not enable start");
  await page.locator("#begin").click();
  check(await page.locator("#session").isVisible(),"Pilot session not visible");
  check((await page.locator("#counter").innerText()).includes("1"),"Pilot progress counter missing");
  const links=await auditLinks(page,"evaluation");
  check(errors.length===0,"Pilot JS errors "+JSON.stringify(errors));
  log.push({cycle,module:"evaluation",outcome:"PASS",links});
 }finally{await page.close()}
}
async function checkWebsite(context,cycle){
 for(const name of ["index.html","licence.html","confidentialite.html"]){
  const {page,errors}=await openPage(context,name);
  try{
   let links=await auditLinks(page,name);
   check(errors.length===0,name+" JS errors "+JSON.stringify(errors));
   if(name==="index.html")check(await page.locator('a[href="studio.html"]').count()>=1,"Book page missing Studio CTA");
   log.push({cycle,module:name,outcome:"PASS",links});
  }finally{await page.close()}
 }
}
async function checkZip(context,cycle){
 const {page,errors}=await openPage(context,"offline-suite.html");
 let dir=fs.mkdtempSync(path.join(os.tmpdir(),"lapreuve-qa-"));
 try{
  const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#bundle").click()]);
  check(dl.suggestedFilename().endsWith(".zip"),"Offline generator did not produce ZIP");
  const filename=path.join(dir,"complete.zip");
  await dl.saveAs(filename);
  const t=cp.execFileSync("unzip",["-t",filename],{encoding:"utf8",timeout:20000});
  check(t.includes("No errors detected"),"unzip -t corrupted");
  cp.execFileSync("unzip",["-oq",filename,"-d",dir],{timeout:20000});
  for(const name of names.filter(n=>n.endsWith(".html")&&n!=="offline-suite.html"))check(fs.existsSync(path.join(dir,name)),"Missing ZIP file "+name);
  const zipIndex=await context.newPage();
  try{
   await zipIndex.goto("file://"+path.join(dir,"index.html"),{waitUntil:"load"});
   check(await zipIndex.locator('meta[name="ak-suite-bundle"][content="local"]').count()===1,"ZIP bundle meta missing");
   const target=zipIndex.locator('a[href="studio.html"]').first();
   check(await target.count()===1,"ZIP page lost Studio link");
   await target.click();
   await zipIndex.waitForURL(/studio\.html/);
   check(zipIndex.url().startsWith("file:"),"Offline link wrongly redirected online");
   check(await zipIndex.locator(".dot").count()===1000,"Offline Studio did not bootstrap");
  }finally{await zipIndex.close()}
  check(errors.length===0,"Offline generator browser errors "+JSON.stringify(errors));
  log.push({cycle,module:"offline-zip",outcome:"PASS",unzip:"PASS",navigation:"file:// Studio",bytes:fs.statSync(filename).size});
 }finally{await page.close();fs.rmSync(dir,{recursive:true,force:true})}
}
async function checkOneFile(context,cycle){
 const solo=fs.mkdtempSync(path.join(os.tmpdir(),"lapreuve-single-"));
 fs.copyFileSync(path.join(folder,"studio.html"),path.join(solo,"studio.html"));
 const page=await context.newPage();
 try{
  await page.goto("file://"+path.join(solo,"studio.html"),{waitUntil:"load"});
  check(await page.locator(".dot").count()===1000,"single-file Studio did not run");
  const cross=await page.locator('a[href*="/la-preuve-avant-le-diagnostic/workbench.html"]').count();
  check(cross>0,"single file offline URL fallback absent");
  log.push({cycle,module:"file-single",outcome:"PASS",crossPageLinksRewritten:cross});
 }finally{await page.close();fs.rmSync(solo,{recursive:true,force:true})}
}
async function remoteReadback(){
 const remotes=["https://mounirakarkach04-pixel.github.io/ados/la-preuve-avant-le-diagnostic/","https://pigapocket.com/la-preuve-avant-le-diagnostic/"];
 const assets=["index.html","app.html","workbench.html","studio.html","evaluation.html","offline-suite.html"];
 const output=[];
 for(let base of remotes){
  for(let a of assets){
   let item={base,file:a,pass:false};
   try{
    const controller=new AbortController(),alarm=setTimeout(()=>controller.abort(),8000);
    try{
     const resp=await fetch(base+a,{redirect:"follow",signal:controller.signal});
     const text=await resp.text();
     const local=fs.readFileSync(path.join(folder,a));
     item.status=resp.status;item.bytes=Buffer.byteLength(text);item.sourceSha256=crypto.createHash("sha256").update(local).digest("hex");
     item.liveSha256=crypto.createHash("sha256").update(text).digest("hex");
     item.pass=resp.ok&&item.sourceSha256===item.liveSha256;
    }finally{clearTimeout(alarm)}
   }catch(e){item.error=String(e.message||e).slice(0,150)}
   output.push(item);
  }
 }
 return output;
}
(async()=>{
 const began=new Date().toISOString();let complete=false,live=[];
 try{
  await startServer();
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900},reducedMotion:"reduce"});
  for(let cycle=1;cycle<=totalCycles;cycle++){
   for(const [module,fn] of [["website",checkWebsite],["studio",checkStudio],["app",checkApp],["workbench",checkWorkbench],["pilot",checkPilot],["offline-zip",checkZip],["file-single",checkOneFile]]){
    try{await fn(ctx,cycle)}
    catch(e){let x={cycle,module,error:String(e.stack||e).slice(0,1800)};failures.push(x);console.error("FAIL "+JSON.stringify(x));throw e}
   }
   console.log("LOOP "+cycle+"/"+totalCycles+": PASS");
  }
  await ctx.close();
  live=await remoteReadback();
  complete=true;
 }catch(e){console.error("WORKER QA HALTED: "+String(e.stack||e).slice(0,2400))}
 finally{
  if(browser)await browser.close().catch(()=>{});
  if(server)await new Promise(r=>server.close(r));
  const report={title:"LA PREUVE LAB - Bounded Worker End-to-End QA",time:began,completed:complete,cyclesRequested:totalCycles,cyclesCompleted:new Set(log.filter(x=>x.module==="file-single").map(x=>x.cycle)).size,checks:log,errors:failures,liveReadback:live,clinicalGate2:"BLOCK",zeroRealPatientData:true};
  fs.mkdirSync("qa-reports",{recursive:true});fs.writeFileSync("qa-reports/la_preuve_browser_loop.json",JSON.stringify(report,null,2));
  console.log("QA_SUMMARY "+JSON.stringify({completed:complete,cycles:report.cyclesCompleted,checks:log.length,failures:failures.length,liveSourceMatches:live.filter(x=>x.pass).length,liveChecked:live.length}));
  if(!complete||failures.length)process.exitCode=1;
 }
})();
