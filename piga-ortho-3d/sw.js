'use strict';
/* Device-first PWA offline release: atomic CORE cache, bounded prefetch and cache-first
 * versioned static assets. Browser controls life cycle; no background 24/7 guarantee.
 * Cache contains only public static assets, never patient/clinical records.
 */
const CACHE='piga-ortho-v153-central-piga-voice';
const ASSETS=['./','./index.html','./studio.html','./direct.html','./direct.css','./no-auth-access.js','./inventory-local.js','./team-local.js','./praxis-local.js','./local-runtime.js','./direct.js','./direct.webmanifest','./direct-sw.js','./app.js','./style.css','./icon.svg','./manifest.webmanifest','./privacy.html','./README.txt','./workflow.html','./workflow.css','./workflow.js','./praxis.html','./praxis.css','./praxis.js','./operations.html','./operations.css','./operations.js','./handoff.html','./handoff.css','./handoff-core.js','./handoff.js','./diagnostics.html','./diagnostics.css','./diagnostics.js','./diagnostic-worker.js','./dashboard.html','./dashboard.css','./dashboard.js','./navigation.css' ,'./ortho-light.css','./ortho-visual-v3.css','./ortho-ops-center.css','./ortho-ops-center.js','./ortho-case-passport.css','./ortho-case-passport.js','./ortho-visual-v3.js','./imaging.js','./imaging-gpu.js','./imaging-core.js','./imaging.css','./imaging.html','./device-integrity.js','./workspace-manager.css','./workspace-manager.js','./ortho-install.js','./assist-help.js','./sales.html','./visuals/ortho-hero.svg','./visuals/ortho-dashboard.svg','./visuals/ortho-calendar.svg','./visuals/ortho-team.svg','./visuals/ortho-inventory.svg','./visuals/ortho-ai.svg','./device-hub.html','./device-hub.css','./device-hub.js','./device-store.js','./device-worker.js','./device-resilience.js','./resilience-status.js','./manager.html','./manager.css','./manager.js','./dental-anatomy.js','./dental-webgl.js','./transfer-offer.js','./worker-autoresume.js','./procurement.html','./procurement.css','./procurement.js','./procurement-core.js','./kfo-atlas.html','./kfo-atlas.css','./kfo-atlas.js','./supply.html','./supply.css','./supply.js','./setup.html','./setup.css','./setup.js','./ortho-ai-status.js','./piga-voice.html','./voice.css','./voice.js','./piga-voice-persona.js','./kfo-shop-advisor.js','./visuals/piga-real-dentition.png','./responsive-overrides.css','./setup-offer.js','./piga-control.html','./piga-control.css','./piga-control.js','./piga-brain.js','./piga-pocket-widget.js','./piga-pocket-widget.css','./navigation.js','./report.html','./report.css','./report.js','./devices.html','./devices.css','./devices.js','./assist.html','./assist.css','./assist.js','./kfo-bema-2026.csv','./team.html','./team.css','./team.js','./auth.html','./auth.js','./inventory.html','./inventory.css','./inventory.js'];
const CORE=['./index.html','./dashboard.html','./navigation.js','./navigation.css',
 './device-store.js','./device-worker.js','./device-resilience.js',
 './manager.html','./manager.js','./manager.css','./studio.html','./app.js',
 './dental-anatomy.js','./style.css','./manifest.webmanifest',
 './visuals/piga-real-dentition.png','./responsive-overrides.css',
 './piga-voice.html','./voice.js','./voice.css','./piga-voice-persona.js'];
const ALLOWED=new Set(ASSETS.map(file=>new URL(file,self.location).pathname));
const CORE_URLS=CORE.map(file=>new URL(file,self.location).toString());
const isCore=url=>CORE_URLS.includes(url);
const isStatic=path=>/\.(?:js|css|svg|json|webmanifest|csv|txt)$/i.test(path);
async function prefetch(cache,files,failFast){
 // Limit in-flight requests so low-end Android devices are not overwhelmed.
 const CONCURRENCY=6;let cursor=0,ok=0,failures=0;
 const worker=async()=>{
  while(cursor<files.length){
   const file=files[cursor++],url=new URL(file,self.location).toString();
   try{
    const response=await fetch(new Request(url,{cache:'reload'}));
    if(!response.ok)throw Error('HTTP '+response.status);
    await cache.put(url,response);ok++;
   }catch(error){failures++;if(failFast)throw Error('Core asset unavailable: '+file);}
  }
 };
 await Promise.all(Array.from({length:Math.min(CONCURRENCY,files.length)},worker));
 return {ok,failures};
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 // If a core file fails, installation fails and an existing working worker stays active.
 await prefetch(cache,CORE,true);
 const optional=ASSETS.filter(file=>!CORE.includes(file));
 await prefetch(cache,optional,false);
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 for(const url of CORE_URLS){if(!await cache.match(url))throw Error('Release cache incomplete');}
 const names=await caches.keys();
 await Promise.all(names.filter(name=>name.startsWith('piga-ortho-')&&name!==CACHE).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!ALLOWED.has(url.pathname))return;
 const key=new URL(url.pathname,self.location).toString();
 if(isStatic(url.pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE),cached=await cache.match(key);
   if(cached){
    // Fast local response. New published releases are installed by new SW version.
    return cached;
   }
   try{
    const response=await fetch(request);
    if(response.ok){try{await cache.put(key,response.clone());}catch{}}
    return response;
   }catch{
    return new Response('Offline-Datei noch nicht gespeichert.',{status:503,
     headers:{'Content-Type':'text/plain;charset=UTF-8'}});
   }
  })());
  return;
 }
 // Documents remain network-first so direct links refresh; fall back to last verified cache.
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const fresh=await fetch(request,{cache:'no-store'});
   if(fresh.ok){try{await cache.put(key,fresh.clone())}catch{};return fresh;}
   if(fresh.status>=500)return (await cache.match(key))||fresh;
   return fresh;
  }catch{
   return (await cache.match(key))||new Response('Diese Seite ist auf diesem Gerät nicht offline gespeichert.',
      {status:503,headers:{'Content-Type':'text/plain;charset=UTF-8'}});
  }
 })());
});
