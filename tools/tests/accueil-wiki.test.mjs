import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { estAccueil, titreAccueil, libelleSection, decouperAccueil, colonnes, extraireCorps, rendreAccueil, piedAccueil, tuile } from '../accueil_wiki.mjs';

// Pages d'accueil des wikis et des sections : découpage du corps en boîtes, nettoyage des artefacts,
// rendu façon page d'accueil de wiki, et état du site publié (docs/).
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = path.join(R, 'docs');
const ACCUEILS = [
  'droit-travail/00-accueil/00-accueil.html', 'droit-travail/25-articles-travailleurs/25-articles-travailleurs.html', 'droit-travail/27-articles-gestionnaires/27-articles-gestionnaires.html',
  'ergonomie/00-accueil/00-accueil.html', 'ergonomie/25-articles-travailleurs/25-articles-travailleurs.html', 'ergonomie/27-articles-gestionnaires/27-articles-gestionnaires.html',
  'hygiene/00-accueil/00-accueil.html', 'hygiene/25-articles-travailleurs/00-accueil-travailleurs.html', 'hygiene/27-articles-gestionnaires/00-accueil-gestionnaires.html',
  'legislation/00-accueil/00-accueil.html', 'psychosocial/00-accueil/00-accueil.html',
  'securite/00-accueil/00-accueil.html', 'securite/25-articles-travailleurs/00-accueil-travailleurs.html', 'securite/27-articles-gestionnaires/00-accueil-gestionnaires.html',
  'toxicologie/00-accueil/00-accueil.html', 'toxicologie/25-articles-travailleurs/00-accueil-travailleurs.html', 'toxicologie/27-articles-gestionnaires/00-accueil-gestionnaires.html',
];
// copies des accueils gestionnaires dans l'espace encadrement
const ACCUEILS_G = ['droit-travail/27-articles-gestionnaires/27-articles-gestionnaires.html', 'ergonomie/27-articles-gestionnaires/27-articles-gestionnaires.html', 'hygiene/27-articles-gestionnaires/00-accueil-gestionnaires.html', 'securite/27-articles-gestionnaires/00-accueil-gestionnaires.html', 'toxicologie/27-articles-gestionnaires/00-accueil-gestionnaires.html'];

test('reconnaissance d’une page d’accueil et nettoyage des titres', () => {
  assert.equal(estAccueil({ fm: { type: 'accueil' }, base: 'Bienvenue, travailleur' }), true);
  assert.equal(estAccueil({ fm: {}, base: '00 - 🏠 Accueil SST psychosociale' }), true);
  assert.equal(estAccueil({ fm: { type: 'article' }, base: 'art-51-RSST' }), false);
  assert.equal(titreAccueil('🏠 Wiki SST psychosociale, mines'), 'Wiki SST psychosociale, mines');
  assert.equal(titreAccueil('👷 Bienvenue, travailleur'), 'Bienvenue, travailleur');
  assert.equal(libelleSection('15 - Navigation'), 'Navigation');
  assert.equal(libelleSection('<a href="x" title="Articles internes">20 - Articles internes (conseiller)</a>'), '<a href="x" title="Articles internes">Articles internes (conseiller)</a>');
  assert.equal(libelleSection('1. Diligence raisonnable'), '1. Diligence raisonnable', 'titre numéroté légitime conservé');
  assert.equal(libelleSection('2.1 Comment mesurer'), '2.1 Comment mesurer');
});

test('découpage : chapeau, boîtes, artefacts retirés et wikilinks bruts réparés', () => {
  const corps = [
    '<p>!RPS___Virage_stratégique.mp4</p>',
    '<p>Base de connaissances sur les <strong>RPS</strong>.</p>',
    '<h2 id="demarrage">Démarrage rapide</h2>',
    '<ul>\n<li>👷 <a href="a.html">Travailleur</a></li>\n<li>👨‍💼 <a href="s.html">Superviseur</a> - responsable</li>\n<li></li>\n<li><span class="interne-inline" title="Source interne du vault, non publiée sur le site">Index images <small>(source interne)</small></span></li>\n</ul>',
    '<h2 id="15---navigation">15 - Navigation</h2>',
    '<ul>\n' + Array.from({ length: 9 }, (_, i) => `<li><a href="n${i}.html">Page ${i}</a></li>`).join('\n') + '\n</ul>',
    '<h2 id="20---articles">20 - Articles (conseiller)</h2>',
    '<h3 id="communication">Communication</h3>',
    '<ul>\n<li><a href="c.html">Ascendante</a></li>\n<li>[[Gestion</li>\n<li>[[Postures|Postures sécuritaires]</li>\n<li>[[art-2-LATMP, termes|<a href="l.html">art-2-LATMP</a>]]</li>\n<li>[[art-3, termes|<a href="a.html">LATMP</a> <a href="b.html">art. 3</a>, défin</li>\n</ul>',
    '<h3 id="05---conditions">05 - Conditions de travail</h3>',
    '<ul>\n<li><a href="d.html">Latitude</a></li>\n</ul>',
    '<h2 id="vide">Section vide</h2>',
    '<ul>\n<li><span class="abroge-inline" title="Non repris dans le wiki">Ancien <small>(abrogé)</small></span></li>\n</ul>',
  ].join('\n');
  const d = decouperAccueil(corps, { resoudre: (cible) => (cible === 'Postures' ? 'postures.html' : null) });
  assert.equal(d.chapeau, '<p>Base de connaissances sur les <strong>RPS</strong>.</p>');
  assert.deepEqual(d.sections.map(s => s.titre), ['Démarrage rapide', 'Navigation', 'Articles (conseiller)']);
  assert.deepEqual(d.sections.map(s => s.id), ['demarrage', '15---navigation', '20---articles'], 'ancres d’origine conservées');
  assert.deepEqual(d.sections.map(s => s.grand), [false, false, true]);
  assert.ok(!d.sections[0].html.includes('interne-inline'), 'item « source interne » retiré');
  assert.ok(d.sections[0].html.startsWith('<ul class="accueil-tuiles">') && !d.sections[0].html.includes('<li></li>'), 'rôles en tuiles, item vide retiré');
  assert.ok(d.sections[1].html.startsWith('<ul class="accueil-colonnes accueil-colonnes-courtes">'), 'neuf entrées courtes : colonnes');
  const articles = d.sections[2].html;
  assert.ok(articles.startsWith('<div class="accueil-groupes"><div class="accueil-groupe"><h3 id="communication">Communication</h3>'), 'premier groupe h3 inclus dans la grille');
  assert.ok(articles.includes('<h3 id="05---conditions">Conditions de travail</h3>'));
  assert.ok(articles.includes('<li><span class="new" title="Page introuvable : Gestion">Gestion</span></li>'), 'fragment sans page : lien rouge');
  assert.ok(articles.includes('<li><a href="postures.html">Postures sécuritaires</a></li>'), 'fragment résolu : lien');
  assert.ok(articles.includes('<li><a href="l.html">art-2-LATMP</a></li>'), 'alias imbriqué : lien intérieur conservé');
  assert.ok(articles.includes('<li><a href="a.html">LATMP</a> <a href="b.html">art. 3</a>, défin</li>'), 'alias à plusieurs liens, jamais fermé : contenu conservé');
  assert.ok(!articles.includes('[['));
  assert.deepEqual(d.retires, ['paragraphe « !RPS___Virage_stratégique.mp4 »', 'item « Index images (source interne) »', 'item « Ancien (abrogé) »', 'item vide', 'section vide « Section vide »']);
  assert.deepEqual(d.repares, ['Postures', '[[art-2-LATMP, termes|art-2-LATMP]]', '[[art-3, termes|LATMP art. 3, défin', 'Gestion (page introuvable)']);
});

test('colonnes : listes de premier niveau seulement, huit entrées et plus', () => {
  const courte = '<ul>\n<li><a href="a">A</a></li>\n</ul>';
  assert.equal(colonnes(courte), courte);
  const longue = '<ul>\n' + Array.from({ length: 8 }, (_, i) => `<li><a href="a">Une entrée assez longue numéro ${i}</a></li>`).join('\n') + '\n</ul>';
  assert.ok(colonnes(longue).startsWith('<ul class="accueil-colonnes">') && !colonnes(longue).includes('courtes'));
  const imbriquee = '<ul>\n<li>A<ul>\n' + Array.from({ length: 9 }, () => '<li>x</li>').join('') + '</ul></li>\n</ul>';
  assert.equal(colonnes(imbriquee), imbriquee, 'la sous-liste n’est pas touchée, la liste englobante a une entrée');
  const roles = '<ul>\n<li>👷 <a href="a">Travailleur</a></li>\n<li>🏢 <a href="b">Direction, RH</a></li>\n</ul>';
  assert.ok(colonnes(roles).startsWith('<ul class="accueil-tuiles">'), 'deux points d’entrée : tuiles');
  assert.equal(colonnes('<ul>\n<li>👷 <a href="a">Travailleur</a></li>\n<li><a href="b">Sans emoji</a></li>\n</ul>').startsWith('<ul>'), true, 'une entrée sans emoji : liste ordinaire');
  assert.equal(piedAccueil('2026-09-09'), '<div class="page-meta">Site généré le 2026-09-09</div>');
  assert.equal(piedAccueil('2026-09-09', '<a href="x">Voir</a>'), '<div class="page-meta">Site généré le 2026-09-09 · <a href="x">Voir</a></div>');
  // tuile : libellé + description tirée du texte qui suit ou du titre de la cible, jamais quand il répète le libellé
  assert.equal(tuile('👷 <a href="a" title="👷 Bienvenue, travailleur">Travailleur, opérateur</a>'), '👷 <a href="a" title="👷 Bienvenue, travailleur"><span class="accueil-tuile-libelle">Travailleur, opérateur</span><small class="accueil-tuile-desc">Bienvenue, travailleur</small></a>');
  assert.equal(tuile('👷 <a href="a" title="x">Démarrage - Travailleur</a> - tes droits'), '👷 <a href="a" title="x"><span class="accueil-tuile-libelle">Démarrage - Travailleur</span><small class="accueil-tuile-desc">tes droits</small></a>');
  assert.equal(tuile('👨‍💼 <a href="a" title="Superviseur">Superviseur</a>'), '👨‍💼 <a href="a" title="Superviseur"><span class="accueil-tuile-libelle">Superviseur</span></a>');
  assert.ok(colonnes(roles).includes('accueil-tuile-libelle'), 'les tuiles portent le libellé structuré');
});

test('extraireCorps : entre le corps et les blocs voisins, backlinks et pied', () => {
  const page = '<x><div class="page-body">\n<p>a</p>\n<div class="callout">\n<p>b</p>\n</div>\n</div>\n<nav class="voisins" aria-label="Pages voisines">v</nav>\n<details class="backlinks">b</details>\n<div class="page-meta">m</div>';
  assert.equal(extraireCorps(page), '<p>a</p>\n<div class="callout">\n<p>b</p>\n</div>');
  assert.equal(extraireCorps('<div class="page-body">\n<p>a</p>\n</div>\n\n\n<div class="page-meta">m</div>'), '<p>a</p>');
  assert.equal(extraireCorps('<p>rien</p>'), null);
});

test('rendu : bandeau avec titre et domaine, chapeau, index, boîtes', () => {
  const html = rendreAccueil({ titre: '🏠 Wiki Test, mines', icone: '🧠', sousTitre: 'Page d’accueil du wiki <a href="i.html">🧠 Test</a> · 12 pages', chapeau: '<p>Chapeau.</p>', index: [{ url: 'ia.html', libelle: 'Index alphabétique' }], sections: [{ id: 's1', titre: 'Navigation', html: '<ul><li><a href="a">A</a></li></ul>', grand: false }, { id: 's2', titre: 'Articles', html: '<div class="accueil-groupes"></div>', grand: true }] });
  assert.ok(html.startsWith('<div class="accueil-banniere">\n<span class="accueil-icone" aria-hidden="true">🧠</span>\n<header class="article-titre">\n<h1 class="page-title">Wiki Test, mines</h1>\n<div class="page-sub">Page d’accueil du wiki <a href="i.html">🧠 Test</a> · 12 pages</div>\n</header>\n</div>'), 'en-tête titre + domaine conservé pour la barre de lecture et verif_site');
  assert.ok(html.includes('<div class="accueil-chapeau"><p>Chapeau.</p></div>'));
  assert.ok(html.includes('<nav class="accueil-index" aria-label="Index et outils du wiki"><a href="ia.html">Index alphabétique</a></nav>'));
  assert.ok(html.includes('<div class="page-body accueil-grille">'));
  assert.ok(html.includes('<section class="accueil-boite" aria-labelledby="s1"><h2 class="accueil-titre" id="s1">Navigation</h2>'));
  assert.ok(html.includes('<section class="accueil-boite accueil-large" aria-labelledby="s2">'));
  assert.ok(!html.includes('infobox') && !html.includes('class="toc'));
});

test('feuille de style : les règles que seul un rendu réel révèle', () => {
  const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
  // un en-tête de boîte qui est un lien garde la couleur de titre : en bleu de lien, 4,27:1 sur le
  // fond pastel en thème clair, sous le seuil WCAG AA de 4,5:1
  assert.match(css, /\.page-body \.accueil-titre a \{ color: inherit; \}/);
  // les règles mobiles des accueils vivent dans le dernier bloc 900 px (celui que lit rendu-mobile)
  const bloc900 = css.slice(css.lastIndexOf('@media (max-width: 900px)'));
  assert.match(bloc900, /\.accueil-grille \{ grid-template-columns: 1fr;/, 'boîtes en une colonne sur téléphone');
  assert.match(bloc900, /\.accueil-corps a, \.accueil-index a, \.accueil-chapeau a, \.accueil-titre a \{ padding: 4px 0; \}/, 'cibles tactiles de 24 px');
  assert.match(bloc900, /\.accueil-tuile-desc \{ font-size: 13px; \}/, 'description de tuile au plancher du site');
  assert.match(bloc900, /\.accueil-corps pre \{ border-color: var\(--border\); \}/, 'cadre défilant visible');
  // la section de base précède le bloc mobile, sinon ses règles l'emportent à spécificité égale
  assert.ok(css.indexOf('.accueil-grille { display: grid') < css.lastIndexOf('@media (max-width: 900px)'), 'section accueil avant le bloc mobile');
});

test('site publié : les dix-sept accueils et leurs cinq copies encadrement sont rendus en bandeau et boîtes, sans artefact', () => {
  for (const rel of [...ACCUEILS.map(r => 'w/' + r), ...ACCUEILS_G.map(r => 'g/w/' + r)]) {
    const html = fs.readFileSync(path.join(DOCS, rel), 'utf8');
    if (rel.startsWith('g/')) assert.match(html, /<div class="page-meta">Site généré le \d{4}-\d{2}-\d{2} · <a href="[^"]*">Voir cette page dans le fond documentaire<\/a><\/div>/, rel + ' : lien vers le fond documentaire conservé');
    assert.ok(html.includes('<div class="accueil-banniere">') && html.includes('<header class="article-titre">'), rel + ' : bandeau');
    assert.ok(!html.includes('<aside class="infobox"') && !html.includes('<nav class="toc') && !html.includes('Un article du wiki'), rel + ' : ni infobox, ni sommaire, ni « Un article du wiki »');
    assert.ok(/<title>[^<🏠👷👔🏢]/.test(html), rel + ' : titre de fenêtre sans emoji de tête');
    assert.ok((html.match(/<section class="accueil-boite/g) || []).length >= 3, rel + ' : au moins trois boîtes');
    const corps = html.slice(html.indexOf('<div class="page-body accueil-grille">'), html.indexOf('<div class="page-meta">'));
    // un item réduit à une mention « (source interne) » ou « (abrogé) » est retiré ; un item qui l'accompagne d'une explication reste
    assert.ok(!/<li>\s*[^<\n]*<span class="(?:interne-inline|abroge-inline|missing-file)"[^>]*>[\s\S]*?<\/span>\s*<\/li>/.test(corps), rel + ' : aucun item réduit à une source non publiée');
    assert.ok(!corps.includes('[[') && !/<p>!/.test(corps), rel + ' : aucun wikilink brut ni nom de média');
    for (const m of corps.matchAll(/<h[23][^>]*>((?:<[^>]+>)*)([^<]*)/g)) assert.ok(!/^\d{1,3} +[-–—] +\p{L}/u.test(m[2]), rel + ' : titre sans préfixe de classement : ' + m[2]);
    assert.ok(html.includes('<nav class="accueil-index"') && html.includes('index-alphabetique.html'), rel + ' : index du wiki');
    assert.match(html, /<div class="page-meta">Site généré le \d{4}-\d{2}-\d{2}(?: · <a [^>]*>Voir cette page dans le fond documentaire<\/a>)?<\/div>/, rel + ' : pied réduit à la date de génération');
    assert.ok(!html.includes('<details class="backlinks">') && !html.includes('Relecture éditoriale'), rel + ' : ni pages liées ni indicateurs éditoriaux');
    assert.match(html, /<div class="page-sub">(?:Page d’accueil du wiki|Section « [^»]+ » du wiki) <a href="[^"]*">[^<]*<\/a> · [\d\s\u00a0\u202f]+ pages<\/div>/, rel + ' : domaine et nombre de pages');
  }
  // l'accueil du wiki : fil d'Ariane arrêté au wiki, compteur = pages du wiki
  const psy = fs.readFileSync(path.join(DOCS, 'w/psychosocial/00-accueil/00-accueil.html'), 'utf8');
  assert.match(psy, /<div class="breadcrumbs"><a href="[^"]*index\.html">Portail<\/a> <span class="crumb-sep">›<\/span> <a href="[^"]*w\/psychosocial\/index\.html">SST psychosociale<\/a><\/div>/);
  assert.ok(psy.includes('<span class="new" title="Page introuvable : Gestion">Gestion</span>'), 'wikilink brut « [[Gestion » rendu en lien rouge');
  assert.ok(!psy.includes('Virage_strat'), 'nom de la vidéo non publiée retiré');
  assert.ok(psy.includes('<ul class="accueil-tuiles">'), 'démarrage rapide par rôle en tuiles');
  assert.ok(psy.includes('<small class="accueil-tuile-desc">'), 'tuiles décrites par le titre de la page cible');
  const ergo = fs.readFileSync(path.join(DOCS, 'w/ergonomie/25-articles-travailleurs/25-articles-travailleurs.html'), 'utf8');
  assert.ok(ergo.includes('Section « Articles travailleurs » du wiki'));
});
