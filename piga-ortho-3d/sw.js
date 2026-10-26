'use strict';
/* Shared Ortho 3D worker: network first for live pages, offline fallback for previously visited assets. */
const CACHE='piga-ortho-v136-imaging-research';
const ASSETS=['./','./index.html','./studio.html','./direct.html','./direct.css','./no-auth-access.js','./inventory-local.js','./team-local.js','./praxis-local.js','./local-runtime.js','./direct.js','./direct.webmanifest','./direct-sw.js','./app.js','./style.css','./icon.svg','./manifest.webmanifest','./privacy.html','./README.txt','./workflow.html','./workflow.css','./workflow.js','./praxis.html','./praxis.css','./praxis.js','./operations.html','./operations.css','./operations.js','./handoff.html','./handoff.css','./handoff-core.js','./handoff.js','./diagnostics.html','./diagnostics.css','./diagnostics.js','./diagnostic-worker.js','./dashboard.html','./dashboard.css','./dashboard.js','./navigation.css' ,'./ortho-light.css','./ortho-visual-v3.css','./ortho-ops-center.css','./ortho-ops-center.js','./ortho-case-passport.css','./ortho-case-passport.js','./ortho-visual-v3.js','./imaging.js','./imaging-core.js','./imaging.css','./imaging.html','./device-integrity.js','./workspace-manager.css','./workspace-manager.js','./ortho-install.js','./assist-help.js','./sales.html','./visuals/ortho-hero.svg','./visuals/ortho-dashboard.svg','./visuals/ortho-calendar.svg','./visuals/ortho-team.svg','./visuals/ortho-inventory.svg','./visuals/ortho-ai.svg','./device-hub.html','./device-hub.css','./device-hub.js','./device-store.js','./device-worker.js','./transfer-offer.js','./worker-autoresume.js','./navigation.js','./report.html','./report.css','./report.js','./devices.html','./devices.css','./devices.js','./assist.html','./assist.css','./assist.js','./kfo-bema-2026.csv','./team.html','./team.css','./team.js','./auth.html','./auth.js','./inventory.html','./inventory.css','./inventory.js'];
const ALLOWED=new Set(ASSETS.map(f=>new URL(f,self.location).pathname));
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{
  await Promise.allSettled(ASSETS.map(async file=>{
   const response=await fetch(new Request(new URL(file,self.location),{cache:'reload'}));
   if(response.ok)await cache.put(new URL(file,self.location).toString(),response);
  }));
 }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(name=>name.startsWith('piga-ortho-')&&name!==CACHE).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!ALLOWED.has(url.pathname))return;
 event.respondWith((async()=>{
  try{
   const fresh=await fetch(request,{cache:'no-store'});
   if(fresh.ok){const copy=fresh.clone();const cache=await caches.open(CACHE);await cache.put(request,copy);}
   return fresh;
  }catch(error){
   const fallback=await caches.match(request,{ignoreSearch:true});
   return fallback||new Response('Offline nicht zwischengespeichert.',{status:503,headers:{'Content-Type':'text/plain;charset=UTF-8'}});
  }
 })());
});
