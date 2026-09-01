// Application installable (PWA) : icônes dessinées en pur calcul, manifeste,
// service worker de mise en cache, page hors-ligne. Aucune dépendance externe.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { encoderPixels } from './png_palette.mjs';

// ---------- icône : casque de chantier blanc sur fond bleu ----------
// Dessinée pixel par pixel : fond arrondi, dôme du casque, visière, nervure centrale.
function dessinerIcone(T, maskable) {
  const px = Buffer.alloc(T * T * 4);
  const BG = [37, 99, 235];      // #2563eb
  const BLANC = [255, 255, 255];
  const coin = maskable ? 0 : T * 0.21;
  // zone sûre maskable : le contenu tient dans 62 % du centre
  const s = maskable ? 0.60 : 0.80;
  const cx = T / 2;
  const R = T * 0.30 * s;
  const cy = T * 0.53;
  const visiereDemi = R * 1.5, visiereEp = R * 0.30;
  const nervureDemi = R * 0.16, nervureH = R * 0.55;

  const dansFond = (x, y) => {
    if (!coin) return true;
    const dx = Math.max(coin - x, x - (T - 1 - coin), 0);
    const dy = Math.max(coin - y, y - (T - 1 - coin), 0);
    return dx * dx + dy * dy <= coin * coin;
  };
  const dansCasque = (x, y) => {
    const dx = x - cx, dy = y - cy;
    if (dy <= 0 && dx * dx + dy * dy <= R * R) return true;                 // dôme
    if (Math.abs(dy - visiereEp / 2) <= visiereEp / 2 && Math.abs(dx) <= visiereDemi - Math.max(0, Math.abs(dx) - visiereDemi + visiereEp / 2)) {
      // visière en capsule : segment horizontal épaissi
      const ex = Math.max(Math.abs(dx) - (visiereDemi - visiereEp / 2), 0);
      const ey = dy - visiereEp / 2;
      if (ex * ex + ey * ey <= (visiereEp / 2) * (visiereEp / 2)) return true;
    }
    const ny = y - (cy - R - nervureH * 0.35);
    if (Math.abs(dx) <= nervureDemi && ny >= 0 && ny <= nervureH) return true; // nervure
    return false;
  };

  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      const i = (y * T + x) * 4;
      if (!dansFond(x, y)) { px[i + 3] = 0; continue; }
      const c = dansCasque(x, y) ? BLANC : BG;
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
    }
  }
  return encoderPixels(T, T, px);
}

export function genererPwa(OUT, version) {
  const assets = path.join(OUT, 'assets');
  fs.mkdirSync(assets, { recursive: true });

  for (const [nom, taille, maskable] of [
    ['icone-192.png', 192, false],
    ['icone-512.png', 512, false],
    ['icone-maskable-512.png', 512, true],
  ]) {
    const buf = dessinerIcone(taille, maskable);
    if (buf) fs.writeFileSync(path.join(assets, nom), buf);
  }

  fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
    name: 'WIKI SST — Mines',
    short_name: 'Wiki SST',
    description: 'Encyclopédie santé et sécurité du travail en milieu minier — travailleurs, gestion et prévention, recueil législatif.',
    lang: 'fr',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#16181d',
    theme_color: '#2563eb',
    icons: [
      { src: 'assets/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'assets/icone-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'assets/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 1));

  // Service worker. Deux caches STABLES (rien n'est jeté au déploiement) :
  //  - pages : tout le texte du site, delta par hash de fichier (hors-ligne.json)
  //  - medias : captures et PDF, immuables
  // La synchronisation est découpée en tranches courtes pilotées par la page :
  // un navigateur tue un worker occupé trop longtemps, jamais une tranche.
  fs.writeFileSync(path.join(OUT, 'sw.js'), `// Service worker du WIKI SST — généré à la construction
const VERSION = '${version}';
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
`);

  fs.writeFileSync(path.join(OUT, 'offline.html'), `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hors ligne — Wiki SST</title>
<style>body{font-family:-apple-system,'Segoe UI',sans-serif;background:#16181d;color:#e4e6e8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px}
.b{max-width:420px}h1{font-size:44px;margin:0 0 8px}p{line-height:1.6;color:#a9b1ba}a{color:#7ab0ff}</style></head>
<body><div class="b"><h1>📡</h1><h2>Pas de réseau</h2>
<p>Cette page n'est pas encore dans le cache de l'application. Le wiki se télécharge tout seul quand le réseau est là — <a href="./">retourner à l'accueil</a> ou réessayer quand le signal revient.</p></div></body></html>
`);
}

// Inventaire du site pour la synchronisation hors ligne : tout le texte d'un côté
// (avec un hash par fichier — seuls les fichiers modifiés se retéléchargent),
// les médias immuables (captures, PDF) de l'autre. À appeler en toute fin de construction.
export function genererListeHorsLigne(OUT, version) {
  const pages = [], medias = [];
  let octetsPages = 0, octetsMedias = 0;
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const chemin = rel + e.name;
      // sw.js se gère lui-même ; hors-ligne.json ne peut pas se lister lui-même
      if (chemin === 'sw.js' || chemin === 'assets/hors-ligne.json' || e.name === '.nojekyll') continue;
      const abs = path.join(d, e.name);
      if (e.isDirectory()) { walk(abs, chemin + '/'); continue; }
      const taille = fs.statSync(abs).size;
      if (chemin.startsWith('files/')) {
        medias.push([chemin, taille]);
        octetsMedias += taille;
      } else {
        // tout ce qui n'est pas un média est une « page » : aucune extension oubliée.
        // Le hash neutralise l'estampille de version (window.V, ?v=) présente dans
        // chaque HTML : sinon tous les hash changeraient à chaque build et le delta
        // retéléchargerait tout au lieu des seules pages réellement modifiées.
        const brut = fs.readFileSync(abs).toString('latin1').split(version).join('');
        const h = crypto.createHash('sha1').update(Buffer.from(brut, 'latin1')).digest('hex').slice(0, 10);
        pages.push([chemin, h, taille]);
        octetsPages += taille;
      }
    }
  })(OUT, '');
  fs.writeFileSync(path.join(OUT, 'assets', 'hors-ligne.json'),
    JSON.stringify({ version, pages, medias, octetsPages, octetsMedias }));
  return { pages: pages.length, medias: medias.length, octetsPages, octetsMedias };
}

// Balises à poser dans chaque <head> — `root` est le préfixe relatif de la page.
export function metaPwa(root) {
  return `<link rel="manifest" href="${root}manifest.webmanifest">
<meta name="theme-color" content="#2563eb">
<link rel="apple-touch-icon" href="${root}assets/icone-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Wiki SST">`;
}
