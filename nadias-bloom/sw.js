/* Nadia's Bloom v28: safe, bounded offline shell. Authentication URLs are never cached. */
const CACHE='nadias-bloom-v35-20261028-account-entry-portfolio';
// Compact original-cover rendition for fast PWA installs; source PNG remains in repository.
const COVER_WEBP=new URL('./barakah-home-2027-cover-480.webp',self.location.href).toString();
const CORE=['./','./index.html','./manifest.webmanifest','./icon.svg','./barakah-home-2027-cover-480.webp','./Nadias_Bloom_Offline.html'];
const OPTIONAL=['./icon-192.png','./icon-512.png'];
const SCOPE=new URL('./',self.location.href);
const CACHEABLE=new Set([...CORE,...OPTIONAL].map(file=>new URL(file,SCOPE).pathname));
const NAVIGATIONS=new Set([new URL('./',SCOPE).pathname,new URL('index.html',SCOPE).pathname,new URL('Nadias_Bloom_Offline.html',SCOPE).pathname]);
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    // App shell, locally hosted original cover and standalone download are required offline.
    await Promise.allSettled(OPTIONAL.map(file=>cache.add(file)));

    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys())if(key.startsWith('nadias-bloom-')&&key!==CACHE)await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  const remoteCover=url.href===COVER_WEBP;
  if(req.method!=='GET'||(url.origin!==self.location.origin&&!remoteCover))return;
  /* Supabase login/reset may return ?token_hash, ?code, ?error and sensitive URLs.
     Do not intercept or persist ANY query-bearing request, even on the app root. */
  if(url.search||url.hash||req.headers.has('authorization'))return;
  if(req.mode==='navigate'&&!NAVIGATIONS.has(url.pathname))return;
  if(!CACHEABLE.has(url.pathname)&&!remoteCover)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(remoteCover||url.pathname.endsWith('/barakah-home-2027-original-cover.png')){
      const cached=await cache.match(req);if(cached)return cached;
    }
    try{
      const response=await fetch(req);
      if(response.ok||response.type==='opaque'){
        await cache.put(req,response.clone()).catch(()=>{});
      }
      return response;
    }catch{
      const cached=await cache.match(req);
      if(cached)return cached;
      if(req.mode==='navigate')return(await cache.match('./index.html'))||Response.error();
      return Response.error();
    }
  })());
});
