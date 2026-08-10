
const CACHE="footballhub-v1";
const ASSETS=["./","./index.html","./css/main.css","./js/app.js","./js/ui/ui.js","./js/data/competitions.js","./js/data/teams.js","./js/data/matches.js","./js/modules/dashboard.js","./js/modules/competitions.js","./js/modules/matches.js","./js/modules/teams.js","./js/modules/standings.js","./js/services/storage.js","./manifest.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match("./index.html")))));
