#!/usr/bin/env node
"use strict";
/* PIGA synthetic-only Android downloaded-HTML regression.
 * Prevent recurrence of ERR_FILE_NOT_FOUND under content://media/... on Chrome Android.
 * node scripts/test_la_preuve_android_links.cjs
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),folder=path.join(root,"la-preuve-avant-le-diagnostic");
const pages=["index.html","app.html","workbench.html","studio.html","evaluation.html","licence.html","confidentialite.html"];
const domain="https://pigapocket.com/la-preuve-avant-le-diagnostic/";
const results=[];
for(const p of pages){
 const source=fs.readFileSync(path.join(folder,p),"utf8");
 const match=source.match(/<script id="ak-offline-links-v1">([\s\S]*?)<\/script>/)||source.match(/<script id="studio-file-links">([\s\S]*?)<\/script>/);
 assert(match,"Android guard missing "+p);new vm.Script(match[1],{filename:p});
 const anchors=[...source.matchAll(/<a\b[^>]*href=["']([^"']+)/gi)].map(x=>x[1]);
 function makeNodes(){return anchors.map(href=>({href,attrs:{},getAttribute(){return this.href},setAttribute(k,v){if(k==="href")this.href=v;else this.attrs[k]=v}}))}
 function check(protocol,bundle){
  const nodes=makeNodes();
  let notices=0;
  const marker={};
  const doc={querySelector(selector){
    if(selector.includes('ak-suite-bundle'))return bundle?marker:null;
    if(selector==='link[rel="manifest"]')return {remove(){}};
    if(selector==='header'||selector==='.ak-header,header')return {parentNode:true,insertAdjacentElement(){notices++}};
    return null;
   },querySelectorAll(){return nodes},createElement(){return {id:"",style:{},innerHTML:"",setAttribute(){}}},body:{firstChild:null,insertBefore(){notices++}}};
  const window={};
  vm.runInNewContext(match[1],{location:{protocol},document:doc,window,console},{timeout:2500,filename:p});
  return {nodes,notices,report:window.AK_OFFLINE_LINK_AUDIT};
 }
 const content=check("content:",false);
 const stillBroken=content.nodes.filter(x=>/^(?:index|app|workbench|studio|evaluation|licence|confidentialite|offline-suite)\.html/.test(x.href));
 assert.equal(stillBroken.length,0,p+": relative broken links under content://");
 const rewritten=content.nodes.filter(x=>x.href.startsWith(domain)).length;
 assert(rewritten>0,p+": no cross-app navigation rewritten to HTTPS");
 assert.equal(content.notices,1,p+": Android help message absent");
 const normal=check("https:",false);
 assert.deepEqual(normal.nodes.map(x=>x.href),anchors,p+": HTTPS URL regression");
 const file=check("file:",false);
 assert(!file.nodes.some(x=>/^(?:index|app|workbench|studio|evaluation|licence|confidentialite|offline-suite)\.html/.test(x.href)),p+": file:// relative broken");
 const zip=check("file:",true);
 assert.deepEqual(zip.nodes.map(x=>x.href),anchors,p+": offline ZIP navigation rewritten");
 results.push({page:p,links:anchors.length,androidOnlineLinks:rewritten,offlineNotice:content.notices});
}
const landing=fs.readFileSync(path.join(root,"offline-downloads.html"),"utf8");
const downloader=landing.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert(downloader);
new vm.Script(downloader,{filename:"offline-downloads.html"});
const app=fs.readFileSync(path.join(folder,"app.html"),"utf8");
assert(app.includes('location.protocol==="content:"'),"Current app Android guard absent");
assert(app.includes('id="lapreuve-offline-book-return"'),"Downloaded French app has no visible return to book");
assert(landing.includes("location.hostname.endsWith(\"github.io\")"),"Missing GitHub Pages path fallback");
assert(downloader.includes('location.protocol==="content:"'),"Download validation does not match actual Android guard");
const controls=new Map(),links=[];
function control(id){
 if(!controls.has(id))controls.set(id,{id,innerHTML:"",textContent:"",disabled:false,addEventListener(type,callback){this[type]=callback}});
 return controls.get(id);
}
const doc={getElementById:control,createElement(){return {download:"",href:"",click(){links.push(this.download)},remove(){}}},body:{appendChild(){}}};
let blob=null,fetchCalls=0;
class TestBlob{constructor(parts,options){this.size=parts.reduce((n,x)=>n+x.length,0);blob=this}}
const uri={createObjectURL(){return"blob:android-test"},revokeObjectURL(){}};
const fetcher=async uri=>{fetchCalls++;assert(uri.startsWith("/la-preuve-avant-le-diagnostic/app.html?android_fix="),"Canonical-domain download must use French root, not /ados subpath");return {ok:true,text:async()=>app}};
vm.runInNewContext(downloader,{document:doc,Blob:TestBlob,URL:uri,fetch:fetcher,location:{hostname:"pigapocket.com"},setTimeout(){}},{timeout:3000});
(async()=>{
 await control("lab-download").click.call(control("lab-download"));
 assert.equal(fetchCalls,1);
 assert(links.includes("LA_PREUVE_LAB_ANDROID_REPARATUR_V2_20261024.html"),"No new uniquely named Android HTML downloaded");
 assert(blob?.size>40000);
 assert(control("lab-status").textContent.includes("Erfolgreich"),"Android download failed validation");
 assert.equal(control("lab-download").disabled,false,"download button remains disabled");
 console.log(JSON.stringify({status:"PASS_ANDROID_CONTENT_LINKS",cases:pages.length,results,downloadName:links[0],downloadBytes:blob.size,clinicalGate2:"BLOCK",deviceAndroidNotEmulated:true},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
