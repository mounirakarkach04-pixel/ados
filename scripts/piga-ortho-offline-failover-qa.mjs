import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('piga-ortho-3d/sw.js','utf8');
const site='https://mounirakarkach04-pixel.github.io/ados/piga-ortho-3d/';
const asUrl=value=>new URL(typeof value==='string'?value:value.url,site).toString();
class Response {
 constructor(body='',init={}){this.body=body;this.status=init.status??200;this.ok=this.status>=200&&this.status<300;}
 clone(){return new Response(this.body,{status:this.status});}
}
class Request{constructor(input){this.url=asUrl(input);this.method='GET'}}
function simulation({fails=[],initialOld=false,offline=false}={}){
 const handlers={},history=new Map(),calls=[],dead=new Set(fails.map(asUrl));
 const status={skipWaiting:0,claimed:0,activeFetch:0,maxFetch:0};
 if(initialOld)history.set('piga-ortho-v145-previous',new Map([['original','safe']]));
 const self={location:site+'sw.js',addEventListener:(n,f)=>handlers[n]=f,skipWaiting:async()=>{status.skipWaiting++},
   clients:{claim:async()=>{status.claimed++}}};
 const caches={open:async name=>{
   if(!history.has(name))history.set(name,new Map());
   const map=history.get(name);
   return {put:async(key,value)=>{map.set(asUrl(key),value.clone())},
    match:async key=>map.get(asUrl(key))||null};
  },
  keys:async()=>[...history.keys()],delete:async name=>history.delete(name),
  match:async key=>{for(const entries of history.values())if(entries.has(asUrl(key)))return entries.get(asUrl(key));return null;}};
 const fetch=async request=>{
   const target=asUrl(request);calls.push(target);status.activeFetch++;
   status.maxFetch=Math.max(status.maxFetch,status.activeFetch);
   try{if(offline)throw Error('offline');if(dead.has(target))return new Response('unavailable',{status:404});
    return new Response('asset:'+target);}
   finally{status.activeFetch--}
 };
 const context={self,caches,fetch,Request,Response,URL,Set,Array,Promise,Error,Math};
 vm.runInNewContext(source,context,{filename:'sw.js'});
 const install=async()=>{let promise;handlers.install({waitUntil:p=>promise=p});await promise};
 const activate=async()=>{let promise;handlers.activate({waitUntil:p=>promise=p});await promise};
 const get=async (url,offlineOverride=false)=>{
   if(offlineOverride)offline=true;
   let output;handlers.fetch({request:{url:asUrl(url),method:'GET'},
    respondWith:p=>{output=p},waitUntil:()=>{}});
   return await output;
 };
 return {install,activate,get,status,calls,history};
}
const normal=simulation({initialOld:true});
await normal.install();await normal.activate();
assert.equal(normal.status.skipWaiting,1);
assert.equal(normal.status.claimed,1);
assert(normal.status.maxFetch<=6,'Too many parallel downloads for weak Android WiFi');
assert.equal(normal.history.size,1,'Old cache should be discarded only after good core');
const js=await normal.get('./device-worker.js',true);
assert.equal(js.status,200,'Offline JS should be served from cache');
const html=await normal.get('./manager.html',true);
assert.equal(html.status,200,'Manager must remain available without network');
const unavailable=simulation({fails:['./manager.js'],initialOld:true});
await assert.rejects(unavailable.install(),/Core asset unavailable/);
assert.equal(unavailable.status.skipWaiting,0,'Incomplete core release must not take over');
assert(unavailable.history.has('piga-ortho-v145-previous'),'Known good cache must survive failed install');
const optional=simulation({fails:['./kfo-atlas.css'],initialOld:true});
await optional.install();await optional.activate();
assert.equal(optional.status.claimed,1,'Optional illustration/asset failure must not block critical local app');
console.log('PIGA ORTHO OFFLINE FAILOVER PASS: atomic essentials, 6 concurrent max, old version preserved on failure, offline manager and workers.');
