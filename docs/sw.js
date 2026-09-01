// Service worker du WIKI SST — généré à la construction
const CACHE = 'wiki-sst-2026-09-01T16';
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
  const estMedia = new URL(req.url).pathname.includes('/files/');
  if (estMedia) {
    // les captures et PDF ne changent pas : cache d'abord, réseau sinon
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((rep) => {
      if (rep.ok && rep.type === 'basic') { const c2 = rep.clone(); caches.open(CACHE).then((c) => c.put(req, c2)); }
      return rep;
    })));
    return;
  }
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

// ---- mise en cache massive, pilotée par les pages ----
async function diffuser(msg) {
  (await self.clients.matchAll({ includeUncontrolled: true })).forEach((cl) => cl.postMessage(msg));
}
async function liste() {
  const r = await fetch('./assets/hors-ligne.json');
  return r.json();
}
let enCours = null;
async function precacher(quoi) {
  if (enCours === quoi) return;
  enCours = quoi;
  try {
    const l = await liste();
    const items = l[quoi] || [];
    const c = await caches.open(CACHE);
    let fait = 0;
    const LOT = 6;
    for (let i = 0; i < items.length; i += LOT) {
      await Promise.all(items.slice(i, i + LOT).map(async (u) => {
        const url = './' + u;
        if (!(await c.match(url))) {
          try { const r = await fetch(url); if (r.ok) await c.put(url, r); } catch (e) { /* réseau coupé : on continue */ }
        }
        fait++;
      }));
      if (fait % 60 < LOT || fait === items.length) diffuser({ type: 'progression', quoi, fait, total: items.length });
    }
    diffuser({ type: 'termine', quoi });
  } finally { enCours = null; }
}
async function compter(arr, c) {
  let n = 0;
  const LOT = 50;
  for (let i = 0; i < arr.length; i += LOT) {
    const r = await Promise.all(arr.slice(i, i + LOT).map((u) => c.match('./' + u)));
    n += r.filter(Boolean).length;
  }
  return n;
}
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'precache-pages') e.waitUntil(precacher('pages'));
  else if (d.type === 'precache-medias') e.waitUntil(precacher('medias'));
  else if (d.type === 'etat') {
    e.waitUntil((async () => {
      const l = await liste();
      const c = await caches.open(CACHE);
      e.source.postMessage({
        type: 'etat',
        pages: { en: await compter(l.pages, c), total: l.pages.length, octets: l.octetsPages },
        medias: { en: await compter(l.medias, c), total: l.medias.length, octets: l.octetsMedias },
      });
    })());
  }
});
