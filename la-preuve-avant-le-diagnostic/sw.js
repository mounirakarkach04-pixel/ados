/* LA PREUVE LAB v2 service worker: only static code, never input, patient data or exports. */
const CACHE="lapreuve-lab-v5-studio-20261024";
const FILES=["./","./index.html","./app.html","./confidentialite.html","./licence.html","./manifest.webmanifest","./workbench.html","./evaluation.html","./offline-suite.html","./studio.html"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("lapreuve-lab-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const u=new URL(event.request.url);
 if(event.request.method!=="GET"||u.origin!==self.location.origin||!FILES.some(x=>u.pathname.endsWith(x.replace("./","/")))||u.pathname.endsWith("/download"))return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,clone)))}
  return response;
 }).catch(()=>caches.match(event.request)));
});
