// Application installable (PWA) : icônes dessinées en pur calcul, manifeste,
// service worker de mise en cache, page hors-ligne. Aucune dépendance externe.
import fs from 'node:fs';
import path from 'node:path';
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

  // Service worker : réseau d'abord (le contenu reste frais), cache en secours.
  // En plus du cache des pages visitées : mise en cache MASSIVE sur demande —
  // tout le texte du wiki en tâche de fond, les médias sur bouton (progression diffusée).
  fs.writeFileSync(path.join(OUT, 'sw.js'), `// Service worker du WIKI SST — généré à la construction
const CACHE = 'wiki-sst-${version}';
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
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((m) => m || fetch(req).then((rep) => {
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
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((m) => m || (req.mode === 'navigate' ? caches.match('./offline.html') : Response.error())))
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
`);

  fs.writeFileSync(path.join(OUT, 'offline.html'), `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hors ligne — Wiki SST</title>
<style>body{font-family:-apple-system,'Segoe UI',sans-serif;background:#16181d;color:#e4e6e8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px}
.b{max-width:420px}h1{font-size:44px;margin:0 0 8px}p{line-height:1.6;color:#a9b1ba}a{color:#7ab0ff}</style></head>
<body><div class="b"><h1>📡</h1><h2>Pas de réseau</h2>
<p>Cette page n'est pas encore dans le cache de l'application. Les pages que tu as déjà visitées restent consultables hors ligne — <a href="./">retourner à l'accueil</a> ou réessayer quand le signal revient.</p></div></body></html>
`);
}

// Inventaire du site pour la mise en cache massive : tout le texte d'un côté,
// les médias (captures, PDF) de l'autre. À appeler en toute fin de construction.
export function genererListeHorsLigne(OUT) {
  const pages = [], medias = [];
  let octetsPages = 0, octetsMedias = 0;
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'sw.js') continue;
      const abs = path.join(d, e.name);
      const chemin = rel + e.name;
      if (e.isDirectory()) { walk(abs, chemin + '/'); continue; }
      const taille = fs.statSync(abs).size;
      if (chemin.startsWith('files/')) { medias.push(chemin); octetsMedias += taille; }
      else if (/\.(html|css|js|json|webmanifest|png)$/.test(e.name)) { pages.push(chemin); octetsPages += taille; }
    }
  })(OUT, '');
  fs.writeFileSync(path.join(OUT, 'assets', 'hors-ligne.json'),
    JSON.stringify({ pages, medias, octetsPages, octetsMedias }));
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
