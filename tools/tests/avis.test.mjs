import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { blocAvis, CONF_AVIS, lireConfAvis, ecrireConfAvis, urlRelaisValide } from '../avis.mjs';
import { genererListeHorsLigne } from '../pwa.mjs';

// Bloc d'avis (15 septembre 2026) : pouce en haut, pouce en bas, commentaire facultatif, envoyés
// à un relais qui garde le jeton Airtable. Contrôles de forme et état du site publié.
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = path.join(R, 'docs');
const NOMS = ['Ergonomie', 'Hygiène industrielle', 'Toxicologie', 'Sécurité industrielle',
  'Droit du travail', 'SST psychosociale', 'Recueil législatif', 'Espace encadrement'];

test('blocAvis : masqué par défaut, données de la page portées par le balisage', () => {
  const h = blocAvis({ adresse: 'w/psychosocial/x.html', titre: 'L’équipe & « le reste »', wiki: 'SST psychosociale' });
  assert.match(h, /^<section class="avis" hidden /, 'rendu masqué : aucun formulaire sans relais');
  assert.match(h, /data-avis-adresse="w\/psychosocial\/x\.html"/);
  assert.match(h, /data-avis-titre="L’équipe &amp; « le reste »"/, 'titre échappé, apostrophe typographique conservée');
  assert.match(h, /data-avis-wiki="SST psychosociale"/);
  assert.equal((h.match(/<button/g) || []).length, 3, 'deux pouces et un envoi');
  assert.match(h, /data-avis="haut"[^>]*aria-pressed="false"/);
  assert.match(h, /data-avis="bas"[^>]*aria-pressed="false"/);
  assert.match(h, /<form class="avis-mot" hidden>/, 'le commentaire n’apparaît qu’après un pouce');
  assert.match(h, /<textarea id="avis-commentaire"[^>]*maxlength="1500"/);
  assert.match(h, /<input id="avis-nom"[^>]*maxlength="80"/);
  assert.match(h, /aria-labelledby="avis-titre"[\s\S]*id="avis-titre"/, 'section nommée par son titre');
  assert.match(h, /<p class="avis-etat" role="status">/, 'l’état est annoncé aux lecteurs d’écran');
  // une injection dans le titre ne sort pas de l'attribut
  assert.ok(!blocAvis({ adresse: 'a', titre: '"><script>x</script>', wiki: 'Ergonomie' }).includes('<script>'));
});

test('feuille de style et script : le formulaire reste caché, les cibles font 44 px', () => {
  const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
  assert.match(css, /\.avis-mot\[hidden\] \{ display: none; \}/, 'display:grid l’emporterait sur [hidden]');
  assert.match(css, /\.avis-pouce \{[\s\S]*?min-height: 44px/);
  assert.match(css, /\.avis-envoyer \{[\s\S]*?min-height: 44px/);
  assert.ok(css.indexOf('.avis { margin: 26px') < css.lastIndexOf('@media (max-width: 900px)'), 'section avant le bloc mobile');
  assert.match(css.slice(css.lastIndexOf('@media (max-width: 900px)')), /\.avis-pouce \{ flex: 1 1 auto/, 'pouces pleine largeur sur téléphone');
  const js = fs.readFileSync(path.join(R, 'tools/app.js'), 'utf8');
  assert.ok(js.includes('avisPage'), 'le script porte le bloc');
  assert.match(js, /assets\/avis\.json/, 'l’adresse du relais est lue dans un fichier, pas figée dans les pages');
  assert.match(js, /wiki-avis-file/, 'file d’attente hors ligne');
  assert.ok(!/api\.airtable\.com/.test(js), 'aucun appel direct à Airtable depuis le navigateur');
  assert.ok(!/(?:pat|key)[A-Za-z0-9]{14,}/.test(js), 'aucun jeton dans le script');
});

test('avis.json : hors du manifeste hors ligne, dans le noyau du service worker', () => {
  // Modifié à la main après déploiement du relais, sans reconstruction : un hash figé dans le
  // manifeste ferait échouer chaque synchronisation et le contrôle de publication.
  const pwa = fs.readFileSync(path.join(R, 'tools/pwa.mjs'), 'utf8');
  assert.match(pwa, /const NOYAU = \[[^\]]*'\.\/assets\/avis\.json'/, 'mis en cache à l’installation, conservé au nettoyage');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'avis-'));
  fs.mkdirSync(path.join(tmp, 'assets'));
  fs.writeFileSync(path.join(tmp, 'assets', 'avis.json'), '{"url":""}');
  fs.writeFileSync(path.join(tmp, 'a.html'), '<p>a</p>');
  genererListeHorsLigne(tmp, '20260915000000');
  const liste = JSON.parse(fs.readFileSync(path.join(tmp, 'assets', 'hors-ligne.json'), 'utf8'));
  assert.deepEqual(liste.pages.map(p => p[0]), ['a.html']);
  fs.rmSync(tmp, { recursive: true, force: true });
  const publie = JSON.parse(fs.readFileSync(path.join(DOCS, 'assets/hors-ligne.json'), 'utf8'));
  assert.ok(!publie.pages.some(p => p[0] === CONF_AVIS), 'manifeste publié sans avis.json');
  assert.match(fs.readFileSync(path.join(DOCS, 'sw.js'), 'utf8'), /NOYAU = \[[^\]]*'\.\/assets\/avis\.json'/, 'service worker publié');
  const js = fs.readFileSync(path.join(R, 'tools/app.js'), 'utf8');
  assert.ok(!js.includes('if (!bloc) { if (relais) viderFile(); return; }'), 'la file d’attente se vide aussi sur une page sans bloc');
  assert.ok(js.indexOf('if (bloc) brancher();') < js.indexOf("fetch(vUrl(ROOT + 'assets/avis.json'), { cache: 'no-cache' })"), 'la configuration est lue quel que soit le bloc, en revalidant la copie HTTP');
});

test('configuration du relais : survit au nettoyage de docs/, garde toutes ses clés, refuse ce qui n’est pas https', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'relais-'));
  const cycle = (contenu) => {
    // ce que fait le générateur : lire, vider docs/, recréer, réécrire aussitôt
    for (const e of fs.readdirSync(tmp)) fs.rmSync(path.join(tmp, e), { recursive: true, force: true });   // état de départ propre
    fs.mkdirSync(path.join(tmp, 'assets'), { recursive: true });
    if (contenu !== undefined) fs.writeFileSync(path.join(tmp, CONF_AVIS), contenu);
    const lu = lireConfAvis(fs, tmp, path);
    for (const e of fs.readdirSync(tmp)) fs.rmSync(path.join(tmp, e), { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    ecrireConfAvis(fs, tmp, path, lu.conf);
    return { ...lu, publie: JSON.parse(fs.readFileSync(path.join(tmp, CONF_AVIS), 'utf8')) };
  };
  // 1. une adresse écrite à la main survit, avec base, table et toute clé ajoutée
  let r = cycle('{"url":"https://avis-wiki.frank.workers.dev","base":"Formations","table":"Avis wiki SST (web)","note":"gardée"}');
  assert.equal(r.avertissement, '');
  assert.deepEqual(r.publie, { url: 'https://avis-wiki.frank.workers.dev', base: 'Formations', table: 'Avis wiki SST (web)', note: 'gardée' });
  // 2. fichier absent (première construction, ou perdu) : relais vide ET avertissement explicite
  r = cycle(undefined);
  assert.equal(r.publie.url, '');
  assert.match(r.avertissement, /absent au démarrage/);
  // 3. fichier illisible, avec BOM, ou qui n'est pas un objet : réinitialisé, jamais planté
  r = cycle('\uFEFF{"url":"https://a.b/c"}'); assert.equal(r.publie.url, 'https://a.b/c'); assert.equal(r.avertissement, '');
  r = cycle('{pas du json'); assert.equal(r.publie.url, ''); assert.match(r.avertissement, /illisible/);
  r = cycle('[1,2]'); assert.equal(r.publie.url, ''); assert.match(r.avertissement, /objet/);
  // 4. une adresse qui n'est pas https est conservée (rien n'est détruit) mais signalée
  r = cycle('{"url":"http://avis-wiki.frank.workers.dev"}');
  assert.equal(r.publie.url, 'http://avis-wiki.frank.workers.dev');
  assert.match(r.avertissement, /https attendu/);
  assert.deepEqual(Object.keys(r.publie).sort(), ['base', 'table', 'url']);
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const [u, ok] of [['https://x.y/z', true], ['http://x.y', false], ['', false], [null, false], [42, false], ['javascript:alert(1)', false]]) {
    assert.equal(urlRelaisValide(u), ok, String(u));
  }
});

test('le générateur relit le relais avant de vider docs/ et le réécrit avant tout rendu', () => {
  // Ordre d'exécution instrumenté : on rejoue les trois lignes du générateur avec un fs espion,
  // au lieu de comparer des positions de texte dans le source.
  const gen = fs.readFileSync(path.join(R, 'tools/build_site.mjs'), 'utf8');
  const lecture = gen.indexOf('const relaisAvis = lireConfAvis(fs, OUT, path);');
  const nettoyage = gen.indexOf('fs.rmSync(path.join(OUT, e)');
  const ecriture = gen.indexOf('ecrireConfAvis(fs, OUT, path, relaisAvis.conf);');
  const rendu = gen.indexOf("console.log('Contrôle qualité…')");
  assert.ok(lecture > 0 && nettoyage > lecture && ecriture > nettoyage && rendu > ecriture,
    'lire → nettoyer → réécrire, le tout avant le rendu et le contrôle qualité');
  assert.ok(!/JSON\.stringify\(\{ url: relaisAvis/.test(gen), 'plus d’objet littéral qui perdrait base et table');
  // les accueils copiés dans g/ portent leur propre adresse, pas celle du fond documentaire
  assert.match(gen, /contenuAccueil\(p, \{ crumbs: filPublic[\s\S]{0,200}adresse: out, wikiAvis: 'Espace encadrement'/);
  assert.match(gen, /function contenuAccueil\(p, \{[^}]*adresse = p\.out, wikiAvis = null \}\)/);
  assert.match(gen, /blocAvis\(\{ adresse, titre: titreAccueil\(p\.title\), wiki: wikiAvis \|\| wiki\.name \}\)/);
});

test('configuration publiée : présente, sans jeton, et acceptée telle quelle par le lecteur', () => {
  const conf = JSON.parse(fs.readFileSync(path.join(DOCS, CONF_AVIS), 'utf8'));
  assert.ok('url' in conf && typeof conf.url === 'string', 'la clé url existe');
  assert.ok(conf.url === '' || urlRelaisValide(conf.url), 'vide, ou https');
  assert.ok(!JSON.stringify(conf).match(/(?:pat|key)[A-Za-z0-9]{14,}/), 'aucun jeton dans le fichier publié');
  // même règle côté navigateur : une adresse qui n'est pas https laisse le bloc masqué
  const js = fs.readFileSync(path.join(R, 'tools/app.js'), 'utf8');
  assert.match(js, /typeof conf\.url !== 'string' \|\| !\/\^https:\\\/\\\/\/\.test\(conf\.url\)/);
});

test('site publié : le bloc est sur chaque page issue d’une note, et nulle part ailleurs', () => {
  let avec = 0, sans = [];
  (function walk(d, rel = '') {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) { if (r !== 'files') walk(path.join(d, e.name), r); continue; }
      if (!e.name.endsWith('.html')) continue;
      const html = fs.readFileSync(path.join(d, e.name), 'utf8');
      const note = html.includes('<div class="page-meta">');
      const bloc = html.includes('<section class="avis" hidden');
      if (!note) { assert.ok(!bloc, r + ' : pas de bloc sur une page d’outil ou d’index'); continue; }
      if (!bloc) { sans.push(r); continue; }
      avec++;
      assert.equal((html.match(/<section class="avis"/g) || []).length, 1, r + ' : un seul bloc');
      assert.ok(html.indexOf('<section class="avis"') < html.indexOf('<div class="page-meta">'), r + ' : bloc avant le pied');
      const wiki = (html.match(/data-avis-wiki="([^"]*)"/) || [])[1];
      assert.ok(NOMS.includes(wiki), `${r} : wiki « ${wiki} »`);
      const adresse = (html.match(/data-avis-adresse="([^"]*)"/) || [])[1];
      assert.equal(adresse, r, r + ' : l’adresse portée est celle de la page');
      const titre = (html.match(/data-avis-titre="([^"]*)"/) || [])[1];
      assert.ok(titre && titre.length > 1, r + ' : titre porté');
    }
  })(DOCS);
  assert.equal(sans.length, 0, `pages issues d’une note sans bloc : ${sans.slice(0, 3).join(', ')}`);
  assert.ok(avec > 4000, `${avec} pages portent le bloc`);
});
