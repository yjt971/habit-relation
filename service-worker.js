const CACHE='habit-mission-v15-stable-v1';
const ASSETS=['./','./index.html','./css/style.css','./js/app.js','./js/data.js','./js/state.js','./js/ui.js','./js/frequency.js','./js/render.js','./js/events.js','./js/firebase.js','./manifest.webmanifest','./icons/icon-192x192.png','./icons/icon-512x512.png','./icons/apple-touch-icon.png','./assets/hero-bg.svg','./assets/map-bg.svg','./assets/mascot.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match('./index.html'))))});
