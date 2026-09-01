// Service worker du WIKI SST — généré à la construction
const VERSION = '20260901231704';
const P = 'wiki-sst-pages';
const M = 'wiki-sst-medias';
const ETAT = './__hl_etat__'; // état de synchronisation (hash déjà appliqués), rangé dans P

const NOYAU = ['./index.html', './assets/style.css', './assets/portail.css',
  './assets/app.js', './assets/hors-ligne.json', './offline.html'];

self.addEventListener('install', (e) => {
  // noyau minimal — ?v= et cache:'reload' contournent le cache HTTP de 10 min
  // de GitHub Pages, qui sinon peut figer un vieux CSS dans un cache tout neuf
  e.waitUntil((async () => {
    const c = await caches.open(P);
    for (const u of NOYAU) {
      try {
        const r = await fetch(u + '?v=' + VERSION, { cache: 'reload' });
        if (r.ok) await c.put(u, r);
      } catch (err) { /* la synchronisation comblera */ }
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  // ne purger QUE nos anciens caches : l'origine github.io est partagée
  // avec les autres sites (Procédures MRI…) — ne jamais toucher aux leurs
  e.waitUntil(caches.keys()
    .then((cles) => Promise.all(cles
      .filter((k) => k.indexOf('wiki-sst-') === 0 && k !== P && k !== M)
      .map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function sansQuery(u) { return u.split('?')[0]; }
async function secours(cle, req) {
  let m = await caches.match(cle);
  if (!m && cle.endsWith('/')) m = await caches.match(cle + 'index.html');
  if (m) return m;
  if (req.mode === 'navigate') {
    const o = await caches.match('./offline.html');
    if (o) return o;
  }
  return Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // une seule clé par ressource : la query (?v=) ne fait pas partie de la clé
  const cle = sansQuery(req.url);
  if (new URL(req.url).pathname.includes('/files/')) {
    // les captures et PDF ne changent pas : cache d'abord, réseau sinon
    e.respondWith(caches.match(cle).then((m) => m || fetch(req).then((rep) => {
      if (rep.ok && rep.type === 'basic') {
        const c2 = rep.clone();
        caches.open(M).then((c) => c.put(cle, c2)).catch(() => {});
      }
      return rep;
    })));
    return;
  }
  e.respondWith(
    fetch(req).then((rep) => {
      if (rep.ok && rep.type === 'basic') {
        const copie = rep.clone();
        caches.open(P).then((c) => c.put(cle, copie)).catch(() => {});
      }
      return rep;
    }).catch(() => secours(cle, req))
  );
});

// ---- synchronisation par tranches ----
// La page envoie {type:'sync', quoi, depuis} ; le SW traite UNE tranche courte,
// répond {type:'tranche', suivant} et la page enchaîne. Si le SW meurt, la page
// renvoie la même demande (chien de garde) et tout reprend où c'était rendu.
let manif = null;
async function liste() {
  if (manif) return manif;
  const c = await caches.open(P);
  try {
    const r = await fetch('./assets/hors-ligne.json?v=' + VERSION, { cache: 'no-store' });
    if (r.ok) {
      await c.put('./assets/hors-ligne.json', r.clone()).catch(() => {});
      manif = await r.json();
      return manif;
    }
  } catch (err) { /* hors ligne : repli sur la copie en cache */ }
  const m = await c.match('./assets/hors-ligne.json');
  if (!m) throw new Error('manifeste indisponible');
  manif = await m.json();
  return manif;
}
async function lireEtat(c) {
  const m = await c.match(ETAT);
  if (m) { try { return await m.json(); } catch (err) { /* on repart à neuf */ } }
  return { h: {} };
}
const enCours = new Set();

async function nettoyer(c, l, etat) {
  const chemins = new Set(l.pages.map((p) => p[0]));
  const garder = new Set([ETAT, './assets/hors-ligne.json', ...NOYAU]
    .map((u) => sansQuery(new URL(u, location.href).href)));
  for (const ch of chemins) garder.add(new URL('./' + ch, location.href).href);
  for (const k of await c.keys()) {
    const cle = sansQuery(k.url);
    if (!garder.has(cle) && !cle.endsWith('/')) await c.delete(k);
  }
  let purge = false;
  for (const ch of Object.keys(etat.h)) {
    if (!chemins.has(ch)) { delete etat.h[ch]; purge = true; }
  }
  if (purge) await c.put(ETAT, new Response(JSON.stringify(etat)));
}

// Une tranche traite au plus CHARGE téléchargements ou VERIF vérifications
// locales (avance rapide sur ce qui est déjà à jour, sans réseau) : chaque
// tranche reste courte même quand tout est à retélécharger, et un balayage
// de contrôle sur un cache complet ne prend que quelques allers-retours.
async function tranchePages(depuis, source, gen) {
  const l = await liste();
  const c = await caches.open(P);
  const etat = await lireEtat(c);
  const VERIF = 800, CHARGE = 120, PAR = 6;
  let i = depuis, verif = 0, charges = 0, rate = 0, quota = false;
  while (i < l.pages.length && verif < VERIF && charges < CHARGE && !quota) {
    const lot = l.pages.slice(i, Math.min(i + PAR, l.pages.length));
    i += lot.length;
    verif += lot.length;
    await Promise.all(lot.map(async ([chemin, h]) => {
      const u = './' + chemin;
      if (etat.h[chemin] === h && await c.match(u)) return;
      charges++;
      try {
        const r = await fetch(u + '?v=' + VERSION, { cache: 'no-store' });
        if (r.ok) { await c.put(u, r); etat.h[chemin] = h; } else rate++;
      } catch (err) {
        if (err && err.name === 'QuotaExceededError') quota = true; else rate++;
      }
    }));
  }
  await c.put(ETAT, new Response(JSON.stringify(etat))).catch(() => {});
  if (quota) { repondre(source, { type: 'erreur-quota', quoi: 'pages', gen }); return; }
  if (i >= l.pages.length) {
    await nettoyer(c, l, etat);
    repondre(source, { type: 'sync-fin', quoi: 'pages', total: l.pages.length, rate, gen });
  } else {
    repondre(source, { type: 'tranche', quoi: 'pages', suivant: i, total: l.pages.length, rate, gen });
  }
}

async function trancheMedias(depuis, source, gen) {
  const l = await liste();
  const c = await caches.open(M);
  const VERIF = 800, CHARGE = 20, PAR = 5;
  let i = depuis, verif = 0, charges = 0, rate = 0, quota = false;
  while (i < l.medias.length && verif < VERIF && charges < CHARGE && !quota) {
    const lot = l.medias.slice(i, Math.min(i + PAR, l.medias.length));
    i += lot.length;
    verif += lot.length;
    await Promise.all(lot.map(async ([chemin]) => {
      const u = './' + chemin;
      if (await c.match(u)) return;
      charges++;
      try {
        const r = await fetch(u);
        if (r.ok) await c.put(u, r); else rate++;
      } catch (err) {
        if (err && err.name === 'QuotaExceededError') quota = true; else rate++;
      }
    }));
  }
  if (quota) { repondre(source, { type: 'erreur-quota', quoi: 'medias', gen }); return; }
  if (i >= l.medias.length) {
    repondre(source, { type: 'sync-fin', quoi: 'medias', total: l.medias.length, rate, gen });
  } else {
    repondre(source, { type: 'tranche', quoi: 'medias', suivant: i, total: l.medias.length, rate, gen });
  }
}

async function diffuser(msg) {
  (await self.clients.matchAll({ includeUncontrolled: true })).forEach((cl) => cl.postMessage(msg));
}
function repondre(source, msg) {
  if (source) source.postMessage(msg); else diffuser(msg);
}

async function compterPages(l, c) {
  let en = 0;
  const LOT = 50;
  for (let i = 0; i < l.pages.length; i += LOT) {
    const r = await Promise.all(l.pages.slice(i, i + LOT).map((p) => c.match('./' + p[0])));
    en += r.filter(Boolean).length;
  }
  return { en, total: l.pages.length, octets: l.octetsPages };
}
async function compterMedias(l, c) {
  let en = 0, restant = 0;
  const LOT = 50;
  for (let i = 0; i < l.medias.length; i += LOT) {
    const tr = l.medias.slice(i, i + LOT);
    const r = await Promise.all(tr.map((m) => c.match('./' + m[0])));
    r.forEach((hit, j) => { if (hit) en++; else restant += tr[j][1] || 0; });
  }
  return { en, total: l.medias.length, octets: l.octetsMedias, restant };
}

self.addEventListener('message', (e) => {
  const d = e.data || {};
  const source = e.source;
  if (d.type === 'sync') {
    const quoi = d.quoi === 'medias' ? 'medias' : 'pages';
    const gen = d.gen || 0;
    if (enCours.has(quoi)) {
      // une tranche à la fois par type — la page réessaiera dans un instant
      repondre(source, { type: 'occupe', quoi, gen });
      return;
    }
    enCours.add(quoi);
    e.waitUntil(
      (quoi === 'pages' ? tranchePages(d.depuis || 0, source, gen) : trancheMedias(d.depuis || 0, source, gen))
        .catch((err) => repondre(source, { type: 'sync-erreur', quoi, gen, message: String((err && err.message) || err) }))
        .finally(() => enCours.delete(quoi))
    );
  } else if (d.type === 'etat') {
    e.waitUntil((async () => {
      try {
        const l = await liste();
        repondre(source, {
          type: 'etat',
          version: VERSION,
          enCours: Array.from(enCours),
          pages: await compterPages(l, await caches.open(P)),
          medias: await compterMedias(l, await caches.open(M)),
        });
      } catch (err) {
        repondre(source, { type: 'etat-indisponible' });
      }
    })());
  }
});
