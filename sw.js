const CACHE='nasch-app-v28.14';
const CORE=['./emsdetten.html','./manifest-emsdetten.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nasch-app-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(e.request.mode==='navigate'||u.pathname.endsWith('.html')){
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./emsdetten.html'))));
    return;
  }
  if(u.origin===self.location.origin){
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const clone=r.clone();caches.open(CACHE).then(x=>x.put(e.request,clone));return r;})));
  }
});
