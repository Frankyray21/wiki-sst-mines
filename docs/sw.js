// Service worker du WIKI SST — généré à la construction
const CACHE = 'wiki-sst-2026-09-01T15';
const NOYAU = ['./', './index.html', './t/index.html', './g/index.html',
  './assets/style.css', './assets/portail.css', './assets/app.js', './offline.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(NOYAU)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((rep) => {
      if (rep.ok && rep.type === 'basic') {
        const copie = rep.clone();
        caches.open(CACHE).then((c) => c.put(req, copie));
      }
      return rep;
    }).catch(() => caches.match(req).then((m) => m || (req.mode === 'navigate' ? caches.match('./offline.html') : Response.error())))
  );
});
