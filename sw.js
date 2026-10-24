/* ADOS — 100% static educational offline cache, no case data or API requests */
const CACHE = "ados-scholar-offline-20261024-v2-book-links";
const FILES = ["./","./index.html","./offline-downloads.html","./studio.html","./datenschutz.html","./nutzungsbedingungen.html","./downloads/ADOS_Governance_Lite_v0_6_OFFLINE.html"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("ados-scholar-offline-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
const req=event.request;
if(req.method!=="GET"||req.mode!=="navigate")return;
const uri=new URL(req.url),scope=new URL(self.registration.scope);
if(uri.origin!==scope.origin||!uri.pathname.startsWith(scope.pathname))return;
event.respondWith(fetch(req).then(resp=>{
if(resp.ok&&resp.type==="basic")event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,resp.clone())));
return resp;
}).catch(()=>caches.match(req,{ignoreSearch:true}).then(found=>found||caches.match("./index.html"))));
});
