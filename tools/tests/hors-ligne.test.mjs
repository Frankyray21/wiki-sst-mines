import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Tests hermétiques : aucun réseau ni changement du dépôt ou du vault.
const dossier = path.dirname(fileURLToPath(import.meta.url));
const version = '20260906123456';
const origine = 'https://example.test/wiki/';
const pwa = fs.readFileSync(path.join(dossier, '../pwa.mjs'), 'utf8');
const capture = pwa.match(/fs\.writeFileSync\(path\.join\(OUT, 'sw\.js'\), `([\s\S]*?)`\);/);
assert.ok(capture, 'le service worker généré doit être identifiable');
const sw = capture[1].replaceAll('${version}', version);
const empreinte = (texte, v = version) => createHash('sha1').update(Buffer.from(texte).toString('latin1').split(v).join(''), 'latin1').digest('hex').slice(0, 10);
const manifeste = (fichiers, v = version) => ({ version: v, pages: fichiers.map(([u, corps]) => [u, empreinte(corps, v), Buffer.byteLength(corps)]), medias: [], octetsPages: fichiers.reduce((n, x) => n + Buffer.byteLength(x[1]), 0), octetsMedias: 0 });

function environnement(liste, corps = new Map()) {
  const stockage = new Map(), messages = [], evenements = {}, demandes = [];
  const quota = new Set();
  let manifesteReseau = liste, manifesteDisponible = true;
  const cle = u => new URL(typeof u === 'string' ? u : u.url, origine).href;
  const caches = {
    async open(nom) {
      if (!stockage.has(nom)) stockage.set(nom, new Map());
      const m = stockage.get(nom);
      return {
        async match(u) { return m.get(cle(u))?.clone(); },
        async put(u, r) {
          if (quota.has(cle(u))) throw new DOMException('plein', 'QuotaExceededError');
          m.set(cle(u), r.clone());
        },
        async keys() { return [...m.keys()].map(url => ({ url })); },
        async delete(u) { return m.delete(cle(u)); },
      };
    },
    async match(u) { for (const m of stockage.values()) if (m.has(cle(u))) return m.get(cle(u)).clone(); },
    async keys() { return [...stockage.keys()]; },
    async delete(k) { return stockage.delete(k); },
  };
  const ctx = vm.createContext({
    URL, Response, Headers, TextEncoder, Uint8Array, Set, crypto: webcrypto,
    location: new URL('sw.js', origine), caches,
    self: { addEventListener(k, fn) { evenements[k] = fn; }, skipWaiting: async () => {}, clients: { claim: async () => {}, matchAll: async () => [] } },
    fetch: async u => {
      const url = new URL(u, origine);
      if (url.pathname.endsWith('/assets/hors-ligne.json')) {
        if (!manifesteDisponible) throw new Error('hors ligne');
        return new Response(JSON.stringify(manifesteReseau));
      }
      const chemin = url.pathname.slice('/wiki/'.length);
      demandes.push(chemin);
      const rep = corps.get(chemin);
      if (rep instanceof Error) throw rep;
      if (typeof rep === 'number') return new Response('indisponible', { status: rep });
      return new Response(rep ?? '', { status: rep == null ? 404 : 200 });
    },
  });
  vm.runInContext(sw, ctx);
  const source = { postMessage(m) { messages.push(m); } };
  return {
    ctx, caches, messages, demandes, quota, corps,
    changerManifeste(l) { manifesteReseau = l; },
    reseauManifeste(on) { manifesteDisponible = on; },
    async semer(chemin, texte, h, recu = h) {
      const c = await caches.open('wiki-sst-pages');
      await c.put('./' + chemin, new Response(texte, { headers: recu ? { 'X-Wiki-SST-Hash': recu } : {} }));
      await c.put('./__hl_etat__', new Response(JSON.stringify({ h: h ? { [chemin]: h } : {} })));
    },
    async tranche(depuis = 0) { await ctx.tranchePages(depuis, source, 1); return messages.at(-1); },
    async compte(l = liste) { return ctx.compterPages(l, await caches.open('wiki-sst-pages')); },
    async contenu(chemin) { return (await (await caches.open('wiki-sst-pages')).match('./' + chemin)).text(); },
  };
}

let succes = 0;
async function test(nom, fn) { await fn(); succes++; console.log('OK ' + nom); }

await test('HTTP 503 : ancienne copie conservée, disponible mais non à jour ; reprise HTTP 200', async () => {
  const l = manifeste([['a.html', 'nouveau ' + version]]), env = environnement(l, new Map([['a.html', 503]]));
  await env.semer('a.html', 'ancien', empreinte('ancien'));
  const fin = await env.tranche();
  assert.equal(fin.rate, 1); assert.equal(fin.complet, false);
  const compte = await env.compte();
  assert.equal(compte.en, 1); assert.equal(compte.aJour, 0); assert.equal(compte.anciens, 1);
  assert.equal(await env.contenu('a.html'), 'ancien');
  env.corps.set('a.html', 'nouveau ' + version);
  assert.equal((await env.tranche(0)).complet, true);
  assert.equal((await env.compte()).aJour, 1);
  assert.equal(await env.contenu('a.html'), 'nouveau ' + version);
});

await test('HTTP 200 avec contenu périmé : hash refusé, ancienne copie préservée', async () => {
  const env = environnement(manifeste([['a.html', 'nouveau']]), new Map([['a.html', 'ancien CDN']]));
  await env.semer('a.html', 'ancien local', empreinte('ancien local'));
  const fin = await env.tranche();
  assert.equal(fin.complet, false); assert.equal(fin.rate, 1);
  assert.equal(await env.contenu('a.html'), 'ancien local');
});

await test('Ancien état sans hash ni reçu : pas de complétude avant validation', async () => {
  const l = manifeste([['a.html', 'déjà disponible']]), env = environnement(l, new Map([['a.html', 'déjà disponible']]));
  await env.semer('a.html', 'déjà disponible', null, null);
  assert.equal((await env.compte()).en, 1); assert.equal((await env.compte()).aJour, 0);
  assert.equal((await env.tranche()).complet, true);
});

await test('État historique à jour mais réponse remplacée sans reçu : freshness invalidée', async () => {
  const l = manifeste([['a.html', 'nouveau']]), env = environnement(l, new Map([['a.html', 'nouveau']]));
  await env.semer('a.html', 'réponse réseau non vérifiée', l.pages[0][1], null);
  assert.equal((await env.compte()).aJour, 0);
  assert.equal((await env.tranche()).complet, true);
});

await test('Échec dans une tranche antérieure : fin incomplète, reprise de zéro ne télécharge que cet échec', async () => {
  const fichiers = Array.from({ length: 125 }, (_, i) => [i + '.html', 'page ' + i]);
  const env = environnement(manifeste(fichiers), new Map(fichiers));
  env.corps.set('0.html', 503);
  const debut = await env.tranche();
  assert.equal(debut.type, 'tranche'); assert.equal(debut.suivant, 120); assert.equal(debut.rate, 1);
  const fin = await env.tranche(debut.suivant);
  assert.equal(fin.rate, 0); assert.equal(fin.complet, false); assert.equal(fin.pages.aJour, 124);
  env.corps.set('0.html', 'page 0'); env.demandes.length = 0;
  assert.equal((await env.tranche(0)).complet, true);
  assert.deepEqual(env.demandes, ['0.html']);
});

await test('Quota partiel : ancienne copie conservée, reprise correcte après libération', async () => {
  const fichiers = [['a.html', 'A neuf'], ['b.html', 'B neuf']];
  const env = environnement(manifeste(fichiers), new Map(fichiers));
  await env.semer('b.html', 'B ancien', empreinte('B ancien'));
  env.quota.add(new URL('b.html', origine).href);
  assert.equal((await env.tranche()).type, 'erreur-quota');
  const compte = await env.compte();
  assert.equal(compte.en, 2); assert.equal(compte.aJour, 1);
  assert.equal(await env.contenu('b.html'), 'B ancien');
  env.quota.clear(); env.demandes.length = 0;
  assert.equal((await env.tranche(0)).complet, true);
  assert.deepEqual(env.demandes, ['b.html']);
});

await test('Quota sur métadonnées : aucune fausse complétude', async () => {
  const l = manifeste([['a.html', 'A neuf']]), env = environnement(l, new Map([['a.html', 'A neuf']]));
  env.quota.add(new URL('__hl_etat__', origine).href);
  assert.equal((await env.tranche()).type, 'erreur-quota');
  assert.equal((await env.compte()).en, 1); assert.equal((await env.compte()).aJour, 0);
});

await test('Manifeste ancien hors ligne : jamais courant, rechargé au retour réseau', async () => {
  const ancien = manifeste([['a.html', 'ancien']], '20260901000000');
  const courant = manifeste([['a.html', 'nouveau']]);
  const env = environnement(courant, new Map([['a.html', 'ancien']]));
  await (await env.caches.open('wiki-sst-pages')).put('./assets/hors-ligne.json', new Response(JSON.stringify(ancien)));
  env.reseauManifeste(false);
  assert.equal((await env.tranche()).complet, false);
  env.reseauManifeste(true); env.corps.set('a.html', 'nouveau');
  assert.equal((await env.tranche(0)).complet, true);
});

const app = fs.readFileSync(path.join(dossier, '../app.js'), 'utf8');
const debutPwa = app.indexOf('  // ---------- application installable (PWA) ----------');
const finRelative = app.slice(debutPwa).search(/^  \}\)\(\);/m);
const finPwa = finRelative < 0 ? -1 : debutPwa + finRelative;
assert.ok(debutPwa >= 0 && finPwa > debutPwa);
const fragment = app.slice(debutPwa, finPwa);
function client(versionHtml = version) {
  const messages = [], evenements = {}, fenetre = {}, timers = new Map();
  const local = new Map([['hl-fini', versionHtml], ['hl-fini-v2', versionHtml]]), session = new Map();
  let compteur = 0;
  const stockage = m => ({ getItem(k) { return m.get(k) ?? null; }, setItem(k, v) { m.set(k, String(v)); }, removeItem(k) { m.delete(k); } });
  const actif = { postMessage(d) { messages.push(d); } };
  const ctx = vm.createContext({
    ROOT: './', window: { V: versionHtml, addEventListener(k, f) { fenetre[k] = f; } },
    navigator: { onLine: true, userAgent: 'Test', serviceWorker: { register: async () => ({}), ready: Promise.resolve({ active: actif }), addEventListener(k, f) { evenements[k] = f; } } },
    location: { protocol: 'https:', hostname: 'example.test' },
    document: { getElementById() { return null; } },
    matchMedia() { return { matches: false }; },
    localStorage: stockage(local), sessionStorage: stockage(session),
    setTimeout(fn, ms) { const id = ++compteur; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); }, setInterval() {}, Date,
  });
  vm.runInContext(fragment + '\n})();', ctx);
  const flush = () => new Promise(resolve => setImmediate(resolve));
  return {
    messages, local, session, timers, ctx, fenetre, flush,
    async message(d) { evenements.message({ data: d }); await flush(); },
    async minuterie() {
      const premier = [...timers.entries()].sort((a, b) => a[1].ms - b[1].ms)[0];
      if (!premier) return false;
      timers.delete(premier[0]); premier[1].fn(); await flush(); return true;
    },
  };
}
const etat = (aJour = 0, v = version) => ({ type: 'etat', version: v, manifesteActuel: true, pages: { en: 1, aJour, total: 1, octets: 5 }, medias: { en: 0, total: 0, octets: 0 }, enCours: [] });

await test('Client : ancien marqueur de fin recontrôlé ; copies anciennes ne marquent jamais la version complète', async () => {
  const c = client(); await c.flush(); await c.minuterie();
  assert.equal(c.messages.at(-1).type, 'etat');
  await c.message(etat(0));
  assert.equal(c.local.has('hl-fini-v2'), false);
  const demande = c.messages.at(-1); assert.equal(demande.type, 'sync'); assert.equal(demande.depuis, 0);
  await c.message({ type: 'sync-fin', quoi: 'pages', gen: demande.gen, complet: false, rate: 1, version });
  await c.message(etat(0));
  assert.equal(c.local.has('hl-fini-v2'), false);
  await c.minuterie();
  const reprise = c.messages.at(-1); assert.equal(reprise.type, 'sync'); assert.equal(reprise.depuis, 0);
  await c.message({ type: 'sync-fin', quoi: 'pages', gen: reprise.gen, complet: true, rate: 0, version });
  const medias = c.messages.at(-1); assert.equal(medias.quoi, 'medias');
  await c.message({ type: 'sync-fin', quoi: 'medias', gen: medias.gen, complet: true, rate: 0, version });
  await c.message(etat(1));
  assert.equal(c.local.get('hl-fini-v2'), version);
});

await test('Client : 3 reprises bornées depuis zéro, aucune boucle ; retour réseau réarme', async () => {
  const c = client(); await c.flush(); await c.minuterie(); await c.message(etat(0));
  for (let i = 0; i < 4; i++) {
    const demande = c.messages.filter(d => d.type === 'sync').at(-1);
    assert.equal(demande.depuis, 0);
    await c.message({ type: 'sync-fin', quoi: 'pages', gen: demande.gen, complet: false, rate: 1, version });
    await c.message(etat(0));
    if (i < 3) assert.equal(await c.minuterie(), true);
  }
  assert.equal(c.messages.filter(d => d.type === 'sync').length, 4);
  assert.equal(c.timers.size, 0);
  c.fenetre.online(); await c.flush(); await c.message(etat(0));
  assert.equal(c.messages.filter(d => d.type === 'sync').length, 5);
});

await test('Client : quota suspend les reprises et invalide la fin', async () => {
  const c = client(); await c.flush(); await c.minuterie(); await c.message(etat(0));
  const demande = c.messages.at(-1);
  await c.message({ type: 'erreur-quota', quoi: 'pages', gen: demande.gen });
  assert.equal(c.session.get('hl-quota'), '1'); assert.equal(c.local.has('hl-fini-v2'), false);
  assert.equal(c.timers.size, 0);
});

await test('Client : état ancienne version ou sans compteur de fraîcheur refuse FINI', async () => {
  const c = client(); await c.flush(); await c.minuterie();
  await c.message(etat(1, 'ancienne-version'));
  assert.equal(c.local.has('hl-fini-v2'), false);
  const ancienProtocole = etat(1); delete ancienProtocole.pages.aJour;
  await c.message(ancienProtocole);
  assert.equal(c.local.has('hl-fini-v2'), false);
});


await test('Client : HTML historique et SW actuel terminent pages et médias sans boucle', async () => {
  const c = client('20260901000000'); await c.flush(); await c.minuterie();
  await c.message(etat(0));
  const pages = c.messages.at(-1); assert.equal(pages.quoi, 'pages');
  await c.message({ type: 'sync-fin', quoi: 'pages', gen: pages.gen, complet: true, rate: 0, version });
  const medias = c.messages.at(-1); assert.equal(medias.quoi, 'medias');
  await c.message({ type: 'sync-fin', quoi: 'medias', gen: medias.gen, complet: true, rate: 0, version });
  await c.message(etat(1));
  assert.equal(c.local.get('hl-fini-v2'), version);
  assert.equal(c.timers.size, 0);
  assert.equal(c.ctx.window.V, '20260901000000', 'aucun changement artificiel de la version HTML');
});

await test('Client : un SW plus ancien que le HTML ne devient pas la version cible', async () => {
  const c = client(); await c.flush(); await c.minuterie();
  const ancienne = '20260901000000';
  await c.message(etat(1, ancienne));
  assert.equal(c.local.has('hl-fini-v2'), false);
  const demande = c.messages.at(-1);
  await c.message({ type: 'sync-fin', quoi: 'pages', gen: demande.gen, complet: true, rate: 0, version: ancienne });
  assert.equal(c.messages.some(m => m.quoi === 'medias'), false);
});

await test('Client : un manifeste de secours même plus récent ne devient jamais une cible fiable', async () => {
  const c = client('20260901000000'); await c.flush(); await c.minuterie();
  await c.message({ ...etat(1), manifesteActuel: false });
  assert.equal(c.local.has('hl-fini-v2'), false);
});

await test('Client : la cible adoptée ne recule pas sur un ancien état tardif', async () => {
  const c = client('20260901000000'); await c.flush(); await c.minuterie();
  await c.message(etat(1));
  assert.equal(c.local.get('hl-fini-v2'), version);
  await c.message(etat(1, '20260902000000'));
  assert.equal(c.local.has('hl-fini-v2'), false, 'l’ancien état ne certifie pas une version dépassée');
  await c.message(etat(1));
  assert.equal(c.local.get('hl-fini-v2'), version);
});

console.log('\n' + succes + ' tests réussis. Aucun fichier du dépôt modifié.');
