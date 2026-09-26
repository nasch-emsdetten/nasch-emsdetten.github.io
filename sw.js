const VERSION='28.23';
const CACHE=`nasch-app-v${VERSION}`;
const CORE=['./emsdetten.html','./manifest-emsdetten.webmanifest','./version.json','./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(CORE.map(async url=>{try{const r=await fetch(url,{cache:'no-store'});if(r.ok)await cache.put(url,r.clone());}catch(_){}}));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('nasch-app-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());
});
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const u=new URL(event.request.url);
  if(u.origin===self.location.origin&&u.pathname.endsWith('/version.json')){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('./version.json')));return;
  }
  if(event.request.mode==='navigate'||(u.origin===self.location.origin&&u.pathname.endsWith('.html'))){
    event.respondWith((async()=>{try{const r=await fetch(event.request,{cache:'no-store'});if(r&&r.ok){const c=await caches.open(CACHE);await c.put('./emsdetten.html',r.clone());}return r;}catch(_){return(await caches.match('./emsdetten.html'))||(await caches.match(event.request));}})());return;
  }
  if(u.origin===self.location.origin){
    event.respondWith((async()=>{const cached=await caches.match(event.request);if(cached)return cached;const r=await fetch(event.request);if(r&&r.ok){const c=await caches.open(CACHE);await c.put(event.request,r.clone());}return r;})());
  }
});
