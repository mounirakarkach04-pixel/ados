const CACHE='nadias-bloom-v27-20261024',CORE=['./','./index.html','./manifest.webmanifest','./icon.svg'],OPTIONAL=['./icon-192.png','./icon-512.png','./happy-avatar-rose.png','./happy-avatar-hair.svg'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE);await Promise.allSettled(OPTIONAL.map(url=>cache.add(url)));await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('nadias-bloom-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok){const cache=await caches.open(CACHE);void cache.put(event.request,response.clone()).catch(()=>{})}return response}catch{const cache=await caches.open(CACHE),match=await cache.match(event.request);if(match)return match;if(event.request.mode==='navigate')return(await cache.match('./index.html'))||Response.error();return Response.error()}})())
});
