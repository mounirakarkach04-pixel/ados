#!/usr/bin/env node
"use strict";
/* Offline link + ZIP integrity regression for LA PREUVE LAB.
 * 100% synthetic program source. No patient data, no network, no third-party packages.
 * node scripts/benchmarks/la_preuve_offline_links_test.js
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const {TextEncoder,TextDecoder}=require("node:util"),{Blob}=require("node:buffer");
const root=path.resolve(process.argv[2]||"artifacts/piga-pocket/public/la-preuve-avant-le-diagnostic");
const pages=["index.html","app.html","workbench.html","evaluation.html","confidentialite.html","licence.html"];
const assets=[...pages,"studio.html","manifest.webmanifest","sw.js"];
const content=Object.fromEntries(assets.map(p=>[p,fs.readFileSync(path.join(root,p),"utf8")]));
const generator=fs.readFileSync(path.join(root,"offline-suite.html"),"utf8");
const generatorScript=generator.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert(generatorScript,"ZIP generator script missing");
let standaloneCount=0,standaloneLinks=0;
for(const f of pages){
 const src=content[f],script=src.match(/<script id="ak-offline-links-v1">([\s\S]*?)<\/script>/)?.[1];
 assert(script,"single-file nav guard missing: "+f);
 const rel=[...src.matchAll(/\bhref=["']([^"']+)["']/g)].map(x=>x[1]);
 const anchors=rel.map(url=>({url,getAttribute(){return this.url},setAttribute(k,u){this.url=u}}));
 const banner=[];
 const baseDoc={
  querySelector(q){if(q.startsWith('meta[name="ak-suite-bundle"'))return null;if(q==="link[rel=\"manifest\"]")return {remove(){}};return null;},
  querySelectorAll(){return anchors;},createElement(){return {setAttribute(){},style:{},innerHTML:""}},body:{firstChild:null,insertBefore(el){banner.push(el)}}
 };
 const ctx={location:{protocol:"file:"},document:baseDoc,window:{}};
 vm.runInNewContext(script,ctx,{timeout:2000});
 const count=anchors.filter(x=>/^https:\/\/pigapocket\.com\/la-preuve-avant-le-diagnostic\/(?:index|app|workbench|studio|evaluation|licence|confidentialite|offline-suite)\.html/.test(x.url)).length;
 assert(count>0,"expected local navigational links: "+f);
 assert(ctx.window.AK_OFFLINE_LINK_AUDIT.rewritten>=count,"incomplete navigation patch: "+f);
 assert.equal(banner.length,1,"offline notice missing: "+f);
 standaloneCount++;standaloneLinks+=count;
 const bound=anchors.filter(x=>/^((index|app|workbench|studio|evaluation|licence|confidentialite|offline-suite)\.html)/.test(x.url));
 assert.equal(bound.length,0,"broken relative file navigation "+f);
 const before=[...src.matchAll(/\bhref=["']([^"']+)["']/g)].map(x=>x[1]);
 const onlineAnchors=before.map(url=>({url,getAttribute(){return this.url},setAttribute(k,v){this.url=v}}));
 const httpsCtx={location:{protocol:"https:"},document:{...baseDoc,querySelectorAll(){return onlineAnchors}},window:{}};
 vm.runInNewContext(script,httpsCtx,{timeout:2000});
 assert.deepEqual(onlineAnchors.map(x=>x.url),before,"https links changed unexpectedly: "+f);
 const bundledAnchors=before.map(url=>({url,getAttribute(){return this.url},setAttribute(k,v){this.url=v}}));
 const bundleCtx={location:{protocol:"file:"},document:{...baseDoc,querySelector(q){return q.startsWith("meta[name=")?{}:null},querySelectorAll(){return bundledAnchors}},window:{}};
 vm.runInNewContext(script,bundleCtx,{timeout:2000});
 assert.deepEqual(bundledAnchors.map(x=>x.url),before,"local ZIP links changed: "+f);
}
let blob=null,downloaded=false;const nodeMap={};
const document={
 baseURI:"https://local.invalid/la-preuve-avant-le-diagnostic/offline-suite.html",
 getElementById(id){return nodeMap[id]??(nodeMap[id]={textContent:"",disabled:false,style:{},addEventListener(ev,fn){this[ev]=fn}})},
 createElement(){return {href:"",download:"",click(){downloaded=true},remove(){}}},
 body:{appendChild(){}}
};
class ZipURL extends URL{static createObjectURL(b){blob=b;return "blob:verified-zip"}static revokeObjectURL(){}}
const sandbox={document,window:{},TextEncoder,Blob,URL:ZipURL,
 fetch:async u=>{const file=u.split("/").at(-1);return {ok:Object.hasOwn(content,file),status:Object.hasOwn(content,file)?200:404,text:async()=>content[file]}},
 setTimeout(){}};
vm.runInNewContext(generatorScript,sandbox,{timeout:5000});
(async()=>{
 await nodeMap.bundle.click();
 assert(downloaded&&blob&&blob.size>150000,"ZIP generation missing");
 assert(nodeMap.status.textContent.startsWith("Archive prête"),nodeMap.status.textContent);
 const data=new Uint8Array(await blob.arrayBuffer()),dv=new DataView(data.buffer,data.byteOffset,data.byteLength);
 const end=data.length-22,entryCount=dv.getUint16(end+10,true);
 assert.equal(dv.getUint32(end,true),0x06054b50);
 assert.equal(entryCount,10);
 let off=dv.getUint32(end+16,true),zipLinks=0;
 const files=[];
 for(let i=0;i<entryCount;i++){
  assert.equal(dv.getUint32(off,true),0x02014b50);
  const len=dv.getUint16(off+28,true),extra=dv.getUint16(off+30,true),comment=dv.getUint16(off+32,true);
  const size=dv.getUint32(off+24,true),local=dv.getUint32(off+42,true),crc=dv.getUint32(off+16,true);
  const name=new TextDecoder().decode(data.slice(off+46,off+46+len));
  assert.equal(dv.getUint32(local,true),0x04034b50);
  const datapos=local+30+dv.getUint16(local+26,true)+dv.getUint16(local+28,true);
  const bytes=data.slice(datapos,datapos+size);
  assert.equal(sandbox.window.LA_PREUVE_OFFLINE_PACK.crc32(bytes),crc,"bad CRC "+name);
  files.push(name);
  if(name.endsWith(".html")){
   const html=new TextDecoder().decode(bytes);
   assert(html.includes('name="ak-suite-bundle" content="local"'),"ZIP marker missing "+name);
   for(const m of html.matchAll(/\bhref=["']([^"']+)["']/g)){
    const href=m[1];zipLinks++;
    if(/^([\w.-]+\.html)(?:[?#].*)?$/.test(href)){assert(assets.includes(href.split(/[?#]/)[0]),"missing local HTML "+name+" -> "+href)}
    if(href.startsWith("#"))assert(html.includes('id="'+href.slice(1)+'"')||html.includes("id='"+href.slice(1)+"'"),"unresolved anchor "+name+" -> "+href);
   }
  }
  off+=46+len+extra+comment;
 }
 assert.equal(sandbox.window.LA_PREUVE_OFFLINE_PACK.crc32(new TextEncoder().encode("123456789")),0xcbf43926);
 assert(files.includes("README.txt"));assert.deepEqual(assets.filter(x=>!files.includes(x)),[]);
 for(const name of pages.concat(["studio.html"])){ 
  const scripts=content[name].matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g);
  for(const m of scripts)new Function(m[1]);
 }
 console.log(JSON.stringify({status:"PASS_SYNTHETIC_NAVIGATION",standalone_files:standaloneCount,standalone_online_links_repaired:standaloneLinks,complete_zip_entries:entryCount,zip_navigation_links:zipLinks,crc:"PASS",zip_bytes:data.length,clinical_gate2:"BLOCK",online_HTTP_not_checked:true},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
