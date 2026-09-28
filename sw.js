const VERSION='29.18';
const CACHE=`nasch-app-v${VERSION}`;
const CORE=[
  './index.html','./emsdetten.html','./lohne.html','./werlte.html','./loeningen.html','./leitung.html',
  './manifest-emsdetten-v2916.webmanifest','./manifest-lohne-v2916.webmanifest','./manifest-werlte-v2916.webmanifest','./manifest-loeningen-v2916.webmanifest','./manifest-leitung-v2916.webmanifest',
  './manifest-emsdetten.webmanifest','./manifest-lohne.webmanifest','./manifest-werlte.webmanifest','./manifest-loeningen.webmanifest','./manifest-leitung.webmanifest',
  './version.json','./icon-any-180-v2916.png','./icon-any-192-v2916.png','./icon-any-512-v2916.png','./icon-maskable-192-v2916.png','./icon-maskable-512-v2916.png','./nasch-v299.js','./nasch-v299.css','./assets/timesheet-master.png'
];

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.all(CORE.map(async url=>{try{const r=await fetch(url,{cache:'no-store'});if(r.ok)await cache.put(url,r.clone())}catch(_){}}));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('nasch-app-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const u=new URL(event.request.url);
  if(u.origin===self.location.origin&&u.pathname.endsWith('/version.json')){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('./version.json')));return;
  }
  if(event.request.mode==='navigate'||(u.origin===self.location.origin&&u.pathname.endsWith('.html'))){
    event.respondWith((async()=>{
      try{const r=await fetch(event.request,{cache:'no-store'});if(r?.ok){const c=await caches.open(CACHE);await c.put(event.request,r.clone())}return r}
      catch(_){return (await caches.match(event.request))||(await caches.match('./index.html'))||(await caches.match('./emsdetten.html'))}
    })());return;
  }
  if(u.origin===self.location.origin){
    event.respondWith((async()=>{const cached=await caches.match(event.request);if(cached)return cached;const r=await fetch(event.request);if(r?.ok){const c=await caches.open(CACHE);await c.put(event.request,r.clone())}return r})());
  }
});

// Firebase Cloud Messaging: nur neutrale Hintergrundmeldung ohne Dienst-/Krank-/KV-Details.
try{
  importScripts(
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js'
  );
  firebase.initializeApp({
    apiKey:'AIzaSyDKDxx3xolYU93URftlU_xQF2TIrW147-4',
    authDomain:'nasch-emsdetten-10eb3.firebaseapp.com',
    projectId:'nasch-emsdetten-10eb3',
    messagingSenderId:'791791893008',
    appId:'1:791791893008:web:0147b30cd99e4003d3a895'
  });
  const messaging=firebase.messaging();
  messaging.onBackgroundMessage(payload=>{
    const data=payload?.data||{};
    return self.registration.showNotification('NASCH',{
      body:'Neue Meldung verfügbar',
      icon:'./icon-any-192-v2916.png',
      badge:'./icon-any-192-v2916.png',
      tag:data.noticeId?`nasch-${data.noticeId}`:'nasch-new-message',
      renotify:true,
      vibrate:[100],
      data:{url:data.url||'./'}
    });
  });
}catch(e){
  // PWA/Offline-Funktion bleibt auch ohne FCM erreichbar.
}

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification?.data?.url||'./';
  event.waitUntil((async()=>{
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of list){
      try{if('focus'in c){await c.focus();if('navigate'in c)await c.navigate(target);return}}catch(_){ }
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
