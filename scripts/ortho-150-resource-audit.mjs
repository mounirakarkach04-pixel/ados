#!/usr/bin/env node
// PIGA ORTHO 150 | Bounded static route/asset inventory. No network/no PHI/no modifications.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('piga-ortho-3d');
const pages=fs.readdirSync(root).filter(x=>x.endsWith('.html'));
const bad=[],valid=[],external=[];
const isStatic=/\.(?:html?|mjs|js|css|svg|png|webp|jpe?g|json|webmanifest|csv|txt|wasm|glb|stl|jpg)(?:[?#]|$)/i;
for(const page of pages){
 const body=fs.readFileSync(path.join(root,page),'utf8');
 for(const match of body.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)){
  const raw=match[1].trim();
  if(!raw||raw[0]==='#'||/^(?:data:|mailto:|tel:|javascript:)/i.test(raw))continue;
  if(/^https?:\/\//i.test(raw)||raw.startsWith('//')){external.push({from:page,to:raw});continue;}
  if(raw.startsWith('/'))continue;
  if(!isStatic.test(raw))continue;
  const decoded=decodeURIComponent(raw.split(/[?#]/)[0]);
  const target=path.resolve(root,path.dirname(page),decoded);
  const item={from:page,to:raw};
  if(target===root||!target.startsWith(root+path.sep)){bad.push({...item,reason:'OUTSIDE_ORTHO_TREE'});continue;}
  if(fs.existsSync(target)&&fs.statSync(target).isFile())valid.push(item);
  else bad.push({...item,reason:'MISSING_TARGET'});
 }
}
const unique=[...new Map(bad.map(x=>[x.from+' → '+x.to,x])).values()];
const result={schema:'piga.ortho.150.resource-audit.v1',scannedHtml:pages.length,existingRelativeAssets:valid.length,broken:unique.length,missing:unique.slice(0,90),externalCount:external.length,externalEffects:0};
console.log(JSON.stringify(result,null,2));
if(unique.length)process.exitCode=2;
