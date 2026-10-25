// No authenticated API or uploaded evidence is cached by this service worker.
const CACHE="piga-aiact-shell-v5-zenodo-bibliography";
const SHELL=["./","./index.html","./styles.css","./app.bundle.js","./engine.js","./portfolio.js","./publications.js","./icon.svg","./manifest.webmanifest","./privacy.html","./terms.html"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==self.location.origin||u.pathname.includes("/auth/")||u.pathname.includes("/storage/"))return;if(e.request.mode==="navigate"){e.respondWith(fetch(e.request).catch(()=>caches.match("./index.html")));return;}e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});
