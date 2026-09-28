// Habillage du portail, de la page Thèmes et des pages de thème dans le style des accueils (27 septembre
// 2026) : mêmes règles dans le générateur et sur les pages publiées (tools/habillage_pages.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { habillerPortail, habillerPageThemes, habillerPageTheme } from '../habillage_pages.mjs';
import { icone, iconeTheme, illustrationWiki } from '../accueil_wiki.mjs';
import { rendrePortailContenu } from '../portail_racine.mjs';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = path.join(R, 'docs');

test('portail : titre à « SST » en accent, illustrations des wikis, pictogrammes des sujets', () => {
  const avant = '<h1>WIKI SST — Mines</h1><a class="portal-card" href="w/ergonomie/index.html">\n      <span class="portal-icon">🦺</span>\n</a><span class="portal-icon">🏷️</span>';
  const apres = habillerPortail(avant);
  assert.ok(apres.includes('<h1>WIKI <span class="brand-sst">SST</span> — Mines</h1>'));
  assert.ok(apres.includes(`<span class="portal-icon portal-illu" aria-hidden="true">${illustrationWiki('ergonomie')}</span>`));
  assert.ok(apres.includes(`<span class="portal-icon portal-picto" aria-hidden="true">${icone('mdiTagOutline')}</span>`));
  // le générateur (portail_racine.mjs) produit déjà ce balisage
  const g = rendrePortailContenu({ total: 10, cartesWikis: '', nbThemes: 1, nbPagesEncadrement: 1, taglineEncadrement: 't', nbCategories: 1, nbPagesQualite: 1 });
  assert.ok(g.includes('<h1>WIKI <span class="brand-sst">SST</span> — Mines</h1>') && !g.includes('<span class="portal-icon">🏷️</span>'));
  assert.equal(habillerPortail(apres), apres, 'rejouable');
});

test('page Thèmes : bloc par wiki, lignes à pictogramme teinté, « N articles », chevron', () => {
  const avant = '<h2>🦺 Ergonomie <small>(2)</small></h2><ul class="cat-pages"><li><a href="w/ergonomie/theme/contraintes.html">Contraintes</a> <small class="cat-compte">8</small></li><li><a href="w/ergonomie/theme/tms.html">TMS</a> <small class="cat-compte">1</small></li></ul>';
  const apres = habillerPageThemes(avant);
  assert.ok(apres.startsWith(`<section class="themes-wiki"><h2 class="themes-wiki-titre"><span class="themes-wiki-illu" aria-hidden="true">${illustrationWiki('ergonomie')}</span>Ergonomie <small>(2)</small></h2><ul class="themes-liste">`));
  assert.ok(apres.includes(`<li><a href="w/ergonomie/theme/contraintes.html"><span class="accueil-theme-icone teinte-1" aria-hidden="true">${icone(iconeTheme('Contraintes'))}</span><span class="themes-nom">Contraintes</span><small class="cat-compte">8 articles</small><span class="accueil-chevron" aria-hidden="true"></span></a></li>`));
  assert.ok(apres.includes('teinte-2') && apres.includes('<small class="cat-compte">1 article</small>'));
});

test('page de thème : notions en lignes, autres thèmes à pictogramme teinté selon leur place dans le wiki', () => {
  const avant = '<h2>Articles de ce thème (1)</h2>\n<ul class="cat-pages"><li><a href="a.html">A</a></li></ul>\n<h2>Autres thèmes du wiki</h2><ul class="cat-pages"><li><a href="t/tms.html">TMS</a></li></ul>';
  const apres = habillerPageTheme(avant, ['Contraintes', 'Démarche', 'TMS']);
  assert.ok(apres.includes('<ul class="cat-pages theme-notions"><li><a href="a.html">A</a></li></ul>'));
  assert.ok(apres.includes(`<ul class="cat-pages theme-voisins"><li><a href="t/tms.html"><span class="accueil-theme-icone teinte-3" aria-hidden="true">${icone(iconeTheme('TMS'))}</span>TMS</a></li></ul>`));
});

test('site publié : portail, page Thèmes et pages de thème habillés ; feuille de style', () => {
  const portail = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
  assert.equal((portail.match(/portal-icon portal-illu/g) || []).length, 7, 'sept wikis illustrés');
  assert.equal((portail.match(/portal-icon portal-picto/g) || []).length, 4, 'catégories, thèmes, contrôles, encadrement');
  assert.ok(portail.includes('<h1>WIKI <span class="brand-sst">SST</span> — Mines</h1>'));
  const themes = fs.readFileSync(path.join(DOCS, 'themes.html'), 'utf8');
  assert.equal((themes.match(/<section class="themes-wiki">/g) || []).length, 6, 'six wikis à thèmes');
  assert.ok(!themes.includes('<ul class="cat-pages">'));
  let pages = 0;
  for (const w of fs.readdirSync(path.join(DOCS, 'w'))) {
    const d = path.join(DOCS, 'w', w, 'theme');
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(f => f.endsWith('.html'))) {
      const h = fs.readFileSync(path.join(d, f), 'utf8');
      assert.ok(h.includes('<ul class="cat-pages theme-notions">') || h.includes('Aucun article n’est pour l’instant rattaché'), w + '/' + f);
      assert.ok(!h.includes('<h2>Autres thèmes du wiki</h2><ul class="cat-pages">'), w + '/' + f + ' : autres thèmes habillés');
      pages++;
    }
  }
  assert.ok(pages >= 36);
  const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
  for (const r of ['.portal-illu .illustration', '.themes-wiki {', '.cat-pages.theme-voisins li a { display: flex;', '.cat-pages.theme-notions li a { position: relative; display: flex;', '.portal-card::after']) assert.ok(css.includes(r), r);
  const portailCss = fs.readFileSync(path.join(R, 'tools/portail.css'), 'utf8');
  assert.equal((portailCss.match(/--p-fond: #14171c;/g) || []).length, 2, 'portail de l’encadrement : fond noir dans les deux blocs sombres');
});
