import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocAvis, CONF_AVIS } from '../avis.mjs';

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

test('configuration du relais : présente, vide, sans jeton', () => {
  const conf = JSON.parse(fs.readFileSync(path.join(DOCS, CONF_AVIS), 'utf8'));
  assert.ok('url' in conf, 'la clé url existe');
  assert.ok(typeof conf.url === 'string');
  if (conf.url) assert.match(conf.url, /^https:\/\//, 'relais en https');
  assert.ok(!JSON.stringify(conf).match(/(?:pat|key)[A-Za-z0-9]{14,}/), 'aucun jeton dans le fichier publié');
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
