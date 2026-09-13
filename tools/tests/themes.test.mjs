import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Thèmes (12 septembre 2026) : source = notes « type: thème » publiées de « 10 - Thèmes », ou
// — faute de thème authored — les notes index des sous-dossiers de « 20 - Articles internes »
// (Ergonomie). Vérifié contre le site réellement construit : ces règles sont appliquées dans
// build_site.mjs (rôles des pages), pas isolées dans un module testable indépendamment.
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = path.join(R, 'docs');
const lire = (rel) => fs.readFileSync(path.join(DOCS, rel), 'utf8');

test('un thème par wiki : compte attendu (psychosociale : 16 depuis l’ouverture des 4 thèmes internes, 13 sept. 2026)', () => {
  const attendu = { ergonomie: 5, hygiene: 4, toxicologie: 4, securite: 3, 'droit-travail': 4, psychosocial: 16 };
  for (const [wiki, n] of Object.entries(attendu)) {
    const dir = path.join(DOCS, 'w', wiki, 'theme');
    const themes = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html')) : [];
    assert.equal(themes.length, n, `w/${wiki}/theme : ${themes.length} thème(s), attendu ${n}`);
  }
});

test('page de thème : corps rédigé intact, liste générée des notions, sans infobox ni voir-aussi', () => {
  const html = lire('w/hygiene/theme/agresseurs-chimiques.html');
  assert.ok(html.includes('Un thème du wiki'));
  assert.match(html, /<h2>Articles de ce thème \(\d+\)<\/h2>/);
  assert.ok(!html.includes('<aside class="infobox"'));
  assert.ok(!html.includes('class="voir-aussi"'));
});

test('Ergonomie (aucun thème authored) : les 5 notes index de sous-dossier tiennent lieu de thème', () => {
  const dir = path.join(DOCS, 'w/ergonomie/theme');
  const themes = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();
  assert.deepEqual(themes, ['anatomie-et-biomecanique.html', 'contraintes.html', 'demarche.html', 'fondements.html', 'tms.html']);
});

test('notion rattachée à un thème : fil d’Ariane à trois maillons, ligne Thème dans l’infobox', () => {
  const html = lire('w/ergonomie/manutention-manuelle.html');
  assert.match(html, /<div class="breadcrumbs">.*Portail.*Ergonomie.*Contraintes.*<\/div>/);
  assert.ok(html.includes('<th>Thème</th>') && html.includes('w/ergonomie/theme/contraintes.html'));
});

test('nom réservé : une note dont le slug percute une page du site reçoit un suffixe, jamais une erreur', () => {
  assert.ok(fs.existsSync(path.join(DOCS, 'w/psychosocial/index-alphabetique-note.html')), '🔤 Index alphabétique (note) suffixée, pas fatale');
  assert.ok(fs.existsSync(path.join(DOCS, 'w/psychosocial/index-alphabetique.html')), 'page générée toujours à sa place');
});

test('collision 20 vs 27 (et racine vs sous-dossier) : suffixe nommé, jamais un « -2 » silencieux', () => {
  // Le Recueil garde son propre mécanisme -2/-3 (inchangé, ex. « acgih ») : seuls les six
  // wikis sont concernés par la nouvelle règle de collision (C7 du plan).
  for (const wiki of ['droit-travail', 'ergonomie', 'hygiene', 'psychosocial', 'securite', 'toxicologie']) {
    const dir = path.join(DOCS, 'w', wiki);
    const fichiers = new Set(fs.readdirSync(dir).filter(f => f.endsWith('.html')));
    for (const f of fichiers) {
      const m = f.match(/^(.+)-(\d+)\.html$/);
      // un « -2 » n'est un vestige de l'ancien mécanisme QUE si le nom sans suffixe existe
      // aussi (c'est alors le signe d'une vraie collision non nommée) ; « lsst-partie-2 » n'a
      // pas de « lsst-partie » à côté, ce n'est pas un suffixe de collision.
      if (m && fichiers.has(m[1] + '.html')) assert.fail(`w/${wiki}/${f} : suffixe numérique silencieux à côté de ${m[1]}.html`);
    }
  }
  assert.ok(fs.existsSync(path.join(DOCS, 'w/hygiene/contrainte-thermique.html')));
  assert.ok(fs.existsSync(path.join(DOCS, 'w/hygiene/contrainte-thermique-encadrement.html')));
});

test('page Thèmes : un lien par wiki vers chaque thème', () => {
  const html = lire('themes.html');
  assert.ok(html.includes('w/ergonomie/theme/contraintes.html'));
  assert.ok(html.includes('w/psychosocial/theme/communication.html'));
});
