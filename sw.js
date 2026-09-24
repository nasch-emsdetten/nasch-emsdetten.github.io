/* NASCH PWA Service Worker · V25.3
   Ziel: HTML auf GitHub Pages immer zuerst aus dem Netz laden,
   damit neue Releases nicht durch einen alten PWA-Cache blockiert werden. */
const CACHE = 'nasch-app-v25.3';
const STATIC_ASSETS = [
  './manifest-emsdetten.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(STATIC_ASSETS.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE && /^nasch-(sandbox|app)-v/i.test(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  const isDocument = req.mode === 'navigate' || req.destination === 'document' || /\.html$/i.test(url.pathname);

  if(isDocument){
    // NETWORK FIRST: Releases auf GitHub werden sofort sichtbar.
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, {cache:'no-store'});
        if(fresh && fresh.ok){
          const cache = await caches.open(CACHE);
          await cache.put(req, fresh.clone());
        }
        return fresh;
      } catch(err) {
        const cached = await caches.match(req);
        if(cached) return cached;
        const fallback = await caches.match('./index.html');
        if(fallback) return fallback;
        throw err;
      }
    })());
    return;
  }

  // STATIC: Cache benutzen, aber im Hintergrund aktualisieren.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const networkPromise = fetch(req).then(async res => {
      if(res && res.ok){
        const cache = await caches.open(CACHE);
        await cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);

    if(cached){
      event.waitUntil(networkPromise);
      return cached;
    }
    const fresh = await networkPromise;
    return fresh || Response.error();
  })());
});
