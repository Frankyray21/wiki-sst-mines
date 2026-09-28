// Affichage des pages (27 septembre 2026) : titre de fenêtre sans emoji de tête, appels bibliographiques
// touchables au doigt, mots trop longs passés à la ligne.
// Le contrôle de rendu (tools/verif_rendu.mjs) relevait les deux défauts sur des pages de contenu : un lecteur
// d'écran annonçait l'emoji (« livre ouvert ») avant le titre, et les renvois « 1 », « 2 » faisaient moins
// de 16 px de haut sur téléphone (WCAG 2.5.8 : 24 px).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { titreFenetre } from '../adresses.mjs';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('titreFenetre : emojis de tête retirés (composés, sélecteur de variante), le reste intact', () => {
  assert.equal(titreFenetre('📖 Glossaire commun'), 'Glossaire commun');
  assert.equal(titreFenetre('⚖️ Index LMRSST, CNESST'), 'Index LMRSST, CNESST');
  assert.equal(titreFenetre('👷‍♂️ Démarrage rapide'), 'Démarrage rapide');
  assert.equal(titreFenetre('Articles 🎯 du wiki'), 'Articles 🎯 du wiki', 'un emoji au milieu reste');
  assert.equal(titreFenetre('🏠'), '🏠', 'un titre fait d’un emoji seul le garde');
  assert.equal(titreFenetre("Programme d'aide aux employés (PAE)"), "Programme d'aide aux employés (PAE)");
});

test('le générateur pose le titre de fenêtre par titreFenetre, dans les trois gabarits de page', () => {
  const gen = fs.readFileSync(path.join(R, 'tools/build_site.mjs'), 'utf8');
  const titres = [...gen.matchAll(/<title>\$\{([^}]*)\} — WIKI SST Mines<\/title>/g)].map(m => m[1]);
  assert.equal(titres.length, 3);
  for (const t of titres) assert.match(t, /^esc\(titreFenetre\(/, t);
});

test('site publié : aucun titre de fenêtre ne commence par un emoji', () => {
  const fautifs = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!(d === path.join(R, 'docs') && /^(files|assets)$/.test(e.name))) walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const m = fs.readFileSync(p, 'utf8').slice(0, 3000).match(/<title>([^<]*)<\/title>/);
      if (m && /^\p{Extended_Pictographic}/u.test(m[1])) fautifs.push(path.relative(R, p));
    }
  })(path.join(R, 'docs'));
  assert.deepEqual(fautifs.slice(0, 5), [], `${fautifs.length} page(s)`);
});

test('appels bibliographiques : zone touchable de 24 px au moins sur écran tactile, sans bouger la ligne', () => {
  const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
  const tactile = css.slice(css.indexOf('@media screen and (pointer: coarse) {'));
  const regle = tactile.match(/\.page-body a\[href\^="#ref-"\] \{([^}]*)\}/);
  assert.ok(regle, 'règle des appels dans le bloc tactile');
  assert.match(regle[1], /padding-block: 7px/);
  // l'appel reste en exposant et sans interligne : la ligne de texte ne s'écarte pas
  assert.match(css, /\.page-body a\[href\^="#ref-"\] \{\s*font-size: max\(\.75rem, \.72em\);\s*line-height: 0;\s*vertical-align: super;/);
});

test('un mot plus long que la colonne passe à la ligne au lieu de faire défiler la page (sans couper les autres)', () => {
  const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
  // « De la conformité à la prévention » : la flèche d'un schéma en caractères (« └────▶ », 500 px) faisait
  // défiler la page de 126 px au téléphone
  // L'encadré « En bref » de l'art. 5.2.1 CSTC reprenait une ligne de soulignés du tableau du PDF (+88 px)
  assert.match(css, /\.page-body p, \.page-body li, \.page-body dd, \.page-body blockquote, \.chapo p, \.chapo li \{ overflow-wrap: break-word; \}/);
  assert.ok(!/\.page-body p[^{]*\{[^}]*overflow-wrap: anywhere/.test(css), 'break-word : la largeur minimale des tableaux ne change pas');
  // « LOT 3 - NOTES INSTITUTIONNELLES/COMPLÉMENTAIRES » élargissait la grille de l'en-tête (+105 px au téléphone)
  assert.match(css, /\.article-titre \.page-title \{ overflow-wrap: anywhere; \}/);
});
