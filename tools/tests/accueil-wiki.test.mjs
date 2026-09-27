import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { estAccueil, titreAccueil, libelleSection, decouperAccueil, colonnes, extraireCorps, rendreAccueil, piedAccueil, tuile, epurerAccueil, rendreBoite, liensDe, icone, iconeTheme, genreBoite, scinderChapeau, rendreThemesAccueil, ordonnerBoites, estDemarrage, pictoTuile, illustrationWiki } from '../accueil_wiki.mjs';

const PICTO = (nom) => `<span class="accueil-boite-icone" aria-hidden="true">${icone(nom)}</span>`;
const CHEVRON = '<span class="accueil-chevron" aria-hidden="true"></span>';

// Pages d'accueil des wikis et des sections : découpage du corps en boîtes, nettoyage des artefacts,
// rendu façon page d'accueil de wiki, et état du site publié (docs/).
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = path.join(R, 'docs');
// Adresses par notion (12 septembre 2026) : l'accueil de chaque wiki est directement
// w/<wiki>/index.html (plus de dossier « 00 - Accueil »). Le wiki des travailleurs est
// archivé : les six accueils de section « 25 - Articles travailleurs » ont disparu avec lui.
// Restent les cinq pages d'accueil de l'encadrement (« 27 - Articles gestionnaires » en Droit
// et Ergonomie, « 00 - Accueil gestionnaires » ailleurs), à leur propre adresse de notion.
const ACCUEILS = [
  'droit-travail/index.html', 'droit-travail/27-articles-gestionnaires.html',
  'ergonomie/index.html', 'ergonomie/27-articles-gestionnaires.html',
  'hygiene/index.html', 'hygiene/00-accueil-gestionnaires.html',
  'legislation/00-accueil/00-accueil.html', 'psychosocial/index.html',
  'securite/index.html', 'securite/00-accueil-gestionnaires.html',
  'toxicologie/index.html', 'toxicologie/00-accueil-gestionnaires.html',
];
// copies des accueils gestionnaires dans l'espace encadrement
const ACCUEILS_G = ['droit-travail/27-articles-gestionnaires.html', 'ergonomie/27-articles-gestionnaires.html', 'hygiene/00-accueil-gestionnaires.html', 'securite/00-accueil-gestionnaires.html', 'toxicologie/00-accueil-gestionnaires.html'];

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
  assert.equal(piedAccueil('2026-09-09'), '<div class="page-meta"><span>Site généré le 2026-09-09</span><span class="accueil-marque">WIKI SST — Mines</span></div>');
  assert.equal(piedAccueil('2026-09-09', '<a href="x">Voir</a>'), '<div class="page-meta"><span>Site généré le 2026-09-09 · <a href="x">Voir</a></span><span class="accueil-marque">WIKI SST — Mines</span></div>');
  // tuile : pictogramme hors lecture d'écran, libellé + description tirée du texte qui suit ou du titre de la cible, jamais quand il répète le libellé
  // l'emoji de la note choisit un pictogramme MDI teinté (maquette) ; un emoji inconnu reste affiché
  const picto = (e, libelle) => pictoTuile(e, libelle);
  assert.equal(pictoTuile('👷', ''), '<span class="accueil-tuile-icone teinte-ambre" aria-hidden="true">' + icone('mdiAccountHardHat') + '</span>');
  assert.equal(pictoTuile('', 'Direction, RH'), '<span class="accueil-tuile-icone teinte-bleu" aria-hidden="true">' + icone('mdiOfficeBuildingOutline') + '</span>', 'sans emoji, le libellé suffit');
  assert.equal(pictoTuile('🚀', 'Autre'), '<span class="accueil-tuile-emoji" aria-hidden="true">🚀</span>', 'emoji inconnu conservé');
  assert.equal(pictoTuile('', ''), '');
  assert.equal(tuile('👷 <a href="a" title="👷 Bienvenue, travailleur">Travailleur, opérateur</a>'), picto('👷', 'Travailleur, opérateur') + '<a href="a" title="👷 Bienvenue, travailleur"><span class="accueil-tuile-libelle">Travailleur, opérateur</span><small class="accueil-tuile-desc">Bienvenue, travailleur</small></a>');
  assert.equal(tuile('👷 <a href="a" title="x">Démarrage - Travailleur</a> - tes droits'), picto('👷', 'Démarrage - Travailleur') + '<a href="a" title="x"><span class="accueil-tuile-libelle">Démarrage - Travailleur</span><small class="accueil-tuile-desc">tes droits</small></a>');
  assert.equal(tuile('👨‍💼 <a href="a" title="Superviseur">Superviseur</a>'), picto('👨‍💼', 'Superviseur') + '<a href="a" title="Superviseur"><span class="accueil-tuile-libelle">Superviseur</span></a>');
  assert.ok(colonnes(roles).includes('accueil-tuile-libelle'), 'les tuiles portent le libellé structuré');
});

test('extraireCorps : entre le corps et les blocs voisins, backlinks et pied', () => {
  const page = '<x><div class="page-body">\n<p>a</p>\n<div class="callout">\n<p>b</p>\n</div>\n</div>\n<nav class="voisins" aria-label="Pages voisines">v</nav>\n<details class="backlinks">b</details>\n<div class="page-meta">m</div>';
  assert.equal(extraireCorps(page), '<p>a</p>\n<div class="callout">\n<p>b</p>\n</div>');
  assert.equal(extraireCorps('<div class="page-body">\n<p>a</p>\n</div>\n\n\n<div class="page-meta">m</div>'), '<p>a</p>');
  assert.equal(extraireCorps('<p>rien</p>'), null);
});

// Maquette de Frank (26 septembre 2026) : carte d'entrée (pictogramme, titre, chapeau scindé en sous-titre et
// description, nombre d'articles, place de la barre Lecture / PDF), ligne d'index, cartes à pictogramme.
test('rendu : carte d’entrée avec titre, chapeau scindé, domaine lu et nombre d’articles vu, index, cartes', () => {
  const html = rendreAccueil({ titre: '🏠 Wiki Test, mines', icone: '🧠', domaine: 'Page d’accueil du wiki <a href="i.html">🧠 Test</a>', compte: '12', chapeau: '<p>Chapeau <strong>court</strong>. Suite du chapeau.</p><p>Second paragraphe.</p>', index: [{ url: 'ia.html', libelle: 'Index alphabétique' }, { url: 't.html', libelle: 'Tous les thèmes' }], sections: [{ id: 's1', titre: 'Navigation', html: '<ul><li><a href="a">A</a></li></ul>', grand: false }, { id: 'themes-du-wiki', titre: 'Thèmes', html: '<div class="accueil-groupes accueil-themes"></div>', grand: true }] });
  assert.ok(html.startsWith('<div class="accueil-banniere">\n<span class="accueil-icone" aria-hidden="true">🧠</span>\n<header class="article-titre">\n<h1 class="page-title">Wiki Test, mines</h1>\n<div class="accueil-chapeau"><p class="accueil-sous-titre">Chapeau <strong>court</strong>.</p><p>Suite du chapeau.</p><p>Second paragraphe.</p></div>\n<div class="page-sub"><span class="accueil-domaine">Page d’accueil du wiki <a href="i.html">🧠 Test</a></span><span class="accueil-compte-pages">' + icone('mdiBookOpenPageVariantOutline') + ' <span class="accueil-nombre">12</span> articles</span></div>\n</header>\n</div>'), 'en-tête titre + domaine conservé pour la barre de lecture et verif_site');
  assert.ok(html.includes('<nav class="accueil-index" aria-label="Index et outils du wiki"><a href="ia.html">Index alphabétique</a></nav>'), '« Tous les thèmes » quitte la ligne d’index pour la boîte des thèmes');
  assert.ok(html.includes('<div class="page-body accueil-grille">'));
  assert.ok(html.includes('<section class="accueil-boite" aria-labelledby="s1"><div class="accueil-entete">' + PICTO('mdiCompassOutline') + '<div class="accueil-entete-texte"><h2 class="accueil-titre" id="s1">Navigation</h2></div></div><div class="accueil-corps">'));
  assert.ok(html.includes('<section class="accueil-boite accueil-large" aria-labelledby="themes-du-wiki"><div class="accueil-entete">' + PICTO('mdiLayersTripleOutline') + '<div class="accueil-entete-texte"><h2 class="accueil-titre" id="themes-du-wiki">Thèmes</h2></div><a class="accueil-entete-lien" href="t.html">Explorer tous les thèmes' + CHEVRON + '</a></div>'));
  assert.ok(!html.includes('infobox') && !html.includes('class="toc'));
  assert.ok(rendreAccueil({ titre: 'T', icone: 'x', domaine: 'd', compte: '1', chapeau: '', sections: [], index: [] }).includes(' <span class="accueil-nombre">1</span> article</span>'), 'singulier');
  // sans boîte des thèmes (accueil d'une section), « Tous les thèmes » reste dans la ligne d'index
  assert.ok(rendreAccueil({ titre: 'T', icone: 'x', domaine: 'd', compte: '2', chapeau: '', sections: [], index: [{ url: 't.html', libelle: 'Tous les thèmes' }] }).includes('<a href="t.html">Tous les thèmes</a>'));
  // le chapeau : première phrase hors balise et hors emphase ouverte
  assert.equal(scinderChapeau('<p>Voir <strong>art. 2</strong> et suite. Fin.</p>'), '<p class="accueil-sous-titre">Voir <strong>art. 2</strong> et suite.</p><p>Fin.</p>', 'un point dans une emphase ne coupe pas');
  assert.equal(scinderChapeau('<p>Sans point final</p>'), '<p class="accueil-sous-titre">Sans point final</p>');
  assert.equal(scinderChapeau('<ul><li>x</li></ul>'), '<ul><li>x</li></ul>', 'pas un paragraphe : inchangé');
  // pictogrammes des thèmes et des boîtes : d'après le titre, avec un repli
  assert.deepEqual(['Anatomie et biomécanique', 'Contraintes', 'Démarche', 'Fondements', 'TMS', 'Sujet inconnu'].map(iconeTheme), ['mdiHuman', 'mdiCogOutline', 'mdiSitemapOutline', 'mdiBookOpenVariant', 'mdiShieldPlusOutline', 'mdiTagOutline']);
  assert.deepEqual(genreBoite({ id: 'x', titre: 'Articles travailleurs (vulgarisés)' }), { icone: 'mdiAccountGroupOutline', sousTexte: 'Des explications simples et concrètes pour le terrain.' });
  assert.deepEqual(genreBoite({ id: 'x', titre: 'Pour les conseillers et les travailleurs' }), { icone: 'mdiFileDocumentOutline', sousTexte: '' }, 'le sous-titre ne va qu’aux listes « Articles … »');
  assert.deepEqual(genreBoite({ id: 'x', titre: 'Hiérarchie normative' }), { icone: '', sousTexte: '' });
  assert.throws(() => icone('mdiInexistant'), /icône inconnue/);
  // volets de thèmes : pictogramme teinté par position, titre vers la page du thème, compte, description, chevron
  const volets = rendreThemesAccueil([{ id: 'theme-a', url: 'a.html', titre: 'Contraintes', desc: 'Une phrase.', notions: [{ url: 'n.html', titre: 'Vibrations & bruit' }] }, { id: 'theme-b', url: 'b.html', titre: 'Vide', desc: '', notions: [] }]);
  assert.ok(volets.startsWith('<nav class="accueil-themes-nav" aria-label="Aller à un thème"><a href="#theme-a">Contraintes</a><a href="#theme-b">Vide</a></nav><div class="accueil-groupes accueil-themes">'));
  assert.ok(volets.includes('<details class="accueil-theme" id="theme-a" open><summary><span class="accueil-theme-icone teinte-1" aria-hidden="true">' + icone('mdiCogOutline') + '</span><span class="accueil-theme-texte"><span class="accueil-theme-titre"><a href="a.html">Contraintes</a></span><span class="accueil-theme-desc">Une phrase.</span></span><small>1 article</small>' + CHEVRON + '</summary><ul><li><a href="n.html">Vibrations &amp; bruit</a></li></ul><a class="accueil-theme-page" href="a.html">Page du thème →</a></details>'));
  assert.ok(volets.includes('<span class="accueil-theme-icone teinte-2" aria-hidden="true">') && volets.includes('<small>0 article</small>' + CHEVRON + '</summary><p class="page-sub">Aucun article rattaché pour l’instant.</p>'));
});

// Accueil allégé (26 septembre 2026) : ce qui est déjà offert par les volets de thèmes n'est pas répété
// en clair plus bas ; les tuiles par rôle ne répètent pas le titre de leur boîte.
test('epurerAccueil : tuiles sans description répétée, rangée de rôles, boîtes repliées quand la moitié des liens est déjà offerte', () => {
  const themes = { id: 'themes-du-wiki', titre: 'Thèmes', grand: true, html: '<div class="accueil-groupes accueil-themes"><details class="accueil-theme" id="theme-a" open><summary><span class="accueil-theme-titre"><a href="t/a.html">A</a></span></summary><ul><li><a href="p1.html">P1</a></li><li><a href="p2.html">P2</a></li><li><a href="p3.html">P3</a></li></ul></details></div>' };
  const roles = { id: 'roles', titre: 'Démarrage rapide par rôle', grand: false, html: '<ul class="accueil-tuiles">\n<li>👷 <a href="r1.html" title="🚀 Démarrage rapide - Travailleur"><span class="accueil-tuile-libelle">Travailleur</span><small class="accueil-tuile-desc">Démarrage rapide - Travailleur</small></a></li>\n<li>🏢 <a href="r2.html" title="x"><span class="accueil-tuile-libelle">Direction</span><small class="accueil-tuile-desc">obligations et prévention</small></a></li>\n</ul>' };
  const internes = { id: 'internes', titre: '<a href="i.html" title="Articles internes">Articles internes (conseiller)</a>', grand: true, html: '<div class="accueil-groupes"><div class="accueil-groupe"><h3 id="g"><a href="t/a.html">A</a></h3>\n<ul>\n<li><a href="p1.html">P1</a></li>\n<li><a href="p2.html">P2</a></li>\n</ul>\n</div></div>' };
  const navigation = { id: 'nav', titre: 'Navigation', grand: false, html: '<ul>\n<li><a href="faq.html">FAQ</a></li>\n<li><a href="p3.html">P3</a></li>\n<li><a href="mode.html">Mode d’emploi</a></li>\n</ul>' };
  const offerts = liensDe(themes.html);
  offerts.add('index.html');
  const { sections, journal } = epurerAccueil([themes, roles, internes, navigation], { liensOfferts: offerts });
  assert.deepEqual(sections.map(s => [s.replie, s.grand, s.nbLiens]), [[false, true, 4], [false, true, 2], [true, true, 3], [false, false, 3]]);
  assert.ok(sections[1].html.includes('<span class="accueil-tuile-libelle">Travailleur</span></a>') && !sections[1].html.includes('<small class="accueil-tuile-desc">Démarrage rapide'), 'description qui répète le titre de la boîte retirée (le title du lien reste)');
  assert.ok(sections[1].html.includes('<small class="accueil-tuile-desc">obligations et prévention</small>'), 'une vraie description reste');
  assert.equal(sections[2].html, internes.html, 'une boîte repliée reste entière');
  assert.deepEqual(journal, [{ boite: 'Démarrage rapide par rôle', sansDescription: 1, replie: false, liens: 2, repris: 0 }, { boite: 'Articles internes (conseiller)', sansDescription: 0, replie: true, liens: 3, repris: 3 }]);
  // la boîte des thèmes n'est jamais repliée, même si tous ses liens sont « offerts » (c'est elle qui les offre)
  assert.equal(sections[0].replie, false);
  // rendu : section ouverte, ou volet replié avec le nombre de pages dans le résumé
  assert.equal(rendreBoite(sections[3]), '<section class="accueil-boite" aria-labelledby="nav"><div class="accueil-entete">' + PICTO('mdiCompassOutline') + '<div class="accueil-entete-texte"><h2 class="accueil-titre" id="nav">Navigation</h2></div></div><div class="accueil-corps">\n' + navigation.html + '\n</div></section>');
  assert.equal(rendreBoite(sections[2]), '<details class="accueil-boite accueil-large accueil-repli"><summary><div class="accueil-entete">' + PICTO('mdiFileDocumentOutline') + '<div class="accueil-entete-texte"><h2 class="accueil-titre" id="internes">' + internes.titre + '</h2><p class="accueil-sous-texte">Outils, méthodes et références pour les professionnels.</p></div><span class="accueil-compte">3 pages</span>' + CHEVRON + '</div></summary><div class="accueil-corps">\n' + internes.html + '\n</div></details>');
  assert.ok(rendreBoite({ ...sections[2], nbLiens: 1 }).includes('<span class="accueil-compte">1 page</span>'));
  assert.ok(rendreAccueil({ titre: 'T', icone: 'x', domaine: 'd', compte: '3', chapeau: '', sections }).includes('<details class="accueil-boite accueil-large accueil-repli">'), 'rendreAccueil passe par rendreBoite');
  // sans lien offert (accueil de section) : rien ne change
  const seul = epurerAccueil([navigation], {});
  assert.deepEqual([seul.sections[0].replie, seul.sections[0].grand, seul.journal], [false, false, []]);
});

test('feuille de style : les règles que seul un rendu réel révèle', () => {
  const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
  // un en-tête de boîte qui est un lien garde la couleur de titre : en bleu de lien, 4,27:1 sur le
  // fond pastel en thème clair, sous le seuil WCAG AA de 4,5:1
  assert.match(css, /\.page-body \.accueil-titre a \{ color: inherit; \}/);
  // les règles mobiles des accueils vivent dans le dernier bloc 900 px (celui que lit rendu-mobile)
  const bloc900 = css.slice(css.lastIndexOf('@media (max-width: 900px)'));
  assert.match(bloc900, /\.accueil-grille \{ grid-template-columns: 1fr;/, 'boîtes en une colonne sur téléphone');
  assert.match(bloc900, /\.accueil-corps a, \.accueil-chapeau a, \.accueil-titre a \{ padding: 4px 0; \}/, 'cibles tactiles de 24 px');
  assert.match(bloc900, /\.accueil-index a \{ display: inline-block; padding: 6px 0; \}/);
  assert.match(bloc900, /\.accueil-tuile-desc \{ font-size: 13px; \}/, 'description de tuile au plancher du site');
  assert.match(bloc900, /\.accueil-corps pre \{ border-color: var\(--border\); \}/, 'cadre défilant visible');
  // la section de base précède le bloc mobile, sinon ses règles l'emportent à spécificité égale
  assert.ok(css.indexOf('.accueil-grille { display: grid') < css.lastIndexOf('@media (max-width: 900px)'), 'section accueil avant le bloc mobile');
  // accueil allégé (26 septembre 2026)
  assert.match(css, /\.accueil-groupes\.accueil-themes \{ display: block; columns: 230px 3;/, 'volets en colonnes, sans le vide de la grille');
  assert.match(css, /\.accueil-theme:not\(\[open\]\) > summary \.accueil-theme-desc \{ display: none; \}/, 'volet fermé : une ligne');
  assert.match(bloc900, /\.accueil-themes-nav \{ display: none; \}/, 'téléphone : pas de raccourcis au-dessus des volets fermés');
  assert.match(css, /details\.accueil-boite > summary \{ list-style: none; cursor: pointer;/);
  // maquette du 26 septembre 2026 : jetons de surface et d'accent, marque, carte d'entrée en grille, pied
  for (const jeton of ['--bg-surface:', '--accent-ui: #2563eb;', '--teinte-rose:', '--rayon: 12px;']) assert.ok(css.includes(jeton), 'jeton ' + jeton);
  assert.equal((css.match(/--bg-surface: /g) || []).length, 3, 'surfaces définies en clair et dans les deux blocs sombres');
  assert.match(css, /\.brand-sst \{ color: var\(--accent-ui-text\); \}/);
  assert.match(css, /\.accueil-banniere \{\s*display: grid; grid-template-columns: auto minmax\(0, 1fr\) auto;/);
  assert.ok(!/grid-area: actions/.test(css) && !/\.accueil-banniere \.lecture-outils/.test(css), 'plus de boutons Lecture et PDF dans la carte d’entrée (retirés par app.js)');
  assert.match(css, /body:has\(\.accueil-banniere\) \.site-footer \{ display: none; \}/);
  assert.match(css, /\.breadcrumbs > a:last-of-type \{ color: var\(--accent-ui-text\); font-weight: 600; \}/);
  assert.match(css, /\.accueil-grille \{ display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; grid-auto-flow: dense; \}/, 'les petites boîtes comblent les trous');
});

test('site publié : les dix-sept accueils et leurs cinq copies encadrement sont rendus en bandeau et boîtes, sans artefact', () => {
  for (const rel of [...ACCUEILS.map(r => 'w/' + r), ...ACCUEILS_G.map(r => 'g/w/' + r)]) {
    const html = fs.readFileSync(path.join(DOCS, rel), 'utf8');
    if (rel.startsWith('g/')) assert.match(html, /<div class="page-meta"><span>Site généré le \d{4}-\d{2}-\d{2} · <a href="[^"]*">Voir cette page dans le fond documentaire<\/a><\/span><span class="accueil-marque">WIKI SST — Mines<\/span><\/div>/, rel + ' : lien vers le fond documentaire conservé');
    assert.ok(html.includes('<div class="accueil-banniere">') && html.includes('<header class="article-titre">'), rel + ' : bandeau');
    assert.ok(!html.includes('<aside class="infobox"') && !html.includes('<nav class="toc') && !html.includes('Un article du wiki'), rel + ' : ni infobox, ni sommaire, ni « Un article du wiki »');
    assert.ok(/<title>[^<🏠👷👔🏢]/.test(html), rel + ' : titre de fenêtre sans emoji de tête');
    // Les cinq accueils de l'encadrement perdent une boîte entière (« Section travailleurs »
    // n'avait plus aucun lien réel après l'archivage) : le seuil est plus bas pour eux.
    const seuilBoites = ACCUEILS_G.includes(rel.replace(/^(?:g\/)?w\//, '')) ? 2 : 3;
    assert.ok((html.match(/<(?:section|details) class="accueil-boite/g) || []).length >= seuilBoites, rel + ' : au moins ' + seuilBoites + ' boîte(s)');
    const corps = html.slice(html.indexOf('<div class="page-body accueil-grille">'), html.indexOf('<div class="page-meta">'));
    // un item réduit à une mention « (source interne) » ou « (abrogé) » est retiré ; un item qui l'accompagne d'une explication reste
    assert.ok(!/<li>\s*[^<\n]*<span class="(?:interne-inline|abroge-inline|missing-file)"[^>]*>[\s\S]*?<\/span>\s*<\/li>/.test(corps), rel + ' : aucun item réduit à une source non publiée');
    assert.ok(!corps.includes('[[') && !/<p>!/.test(corps), rel + ' : aucun wikilink brut ni nom de média');
    for (const m of corps.matchAll(/<h[23][^>]*>((?:<[^>]+>)*)([^<]*)/g)) assert.ok(!/^\d{1,3} +[-–—] +\p{L}/u.test(m[2]), rel + ' : titre sans préfixe de classement : ' + m[2]);
    assert.ok(html.includes('<nav class="accueil-index"') && html.includes('index-alphabetique.html'), rel + ' : index du wiki');
    assert.match(html, /<div class="page-meta"><span>Site généré le \d{4}-\d{2}-\d{2}(?: · <a [^>]*>Voir cette page dans le fond documentaire<\/a>)?<\/span><span class="accueil-marque">WIKI SST — Mines<\/span><\/div>/, rel + ' : pied réduit à la date de génération et à la marque');
    assert.ok(!html.includes('<details class="backlinks">') && !html.includes('Relecture éditoriale'), rel + ' : ni pages liées ni indicateurs éditoriaux');
    assert.match(html, /<div class="page-sub"><span class="accueil-domaine">(?:Page d’accueil du wiki|Section « [^»]+ » du wiki) <a href="[^"]*">[^<]*<\/a><\/span><span class="accueil-compte-pages"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="[^"]*"\/><\/svg> <span class="accueil-nombre">[\d\s\u00a0\u202f]+<\/span> articles?<\/span><\/div>/, rel + ' : domaine lu, nombre d’articles vu');
    assert.ok(html.includes('<span class="brand-sst">') || html.includes('<strong>WIKI SST</strong>'), rel + ' : marque (balise du générateur, ou posée par app.js)');
  }
  // l'accueil du wiki : fil d'Ariane arrêté au wiki, compteur = pages du wiki
  const psy = fs.readFileSync(path.join(DOCS, 'w/psychosocial/index.html'), 'utf8');
  assert.match(psy, /<div class="breadcrumbs"><a href="[^"]*index\.html">Portail<\/a> <span class="crumb-sep">›<\/span> <a href="[^"]*w\/psychosocial\/index\.html">SST psychosociale<\/a><\/div>/);
  assert.ok(psy.includes('<span class="new" title="Page introuvable : Gestion">Gestion</span>'), 'wikilink brut « [[Gestion » rendu en lien rouge');
  assert.ok(!psy.includes('Virage_strat'), 'nom de la vidéo non publiée retiré');
  assert.ok(psy.includes('<section class="accueil-boite accueil-large" aria-labelledby="demarrage-rapide-par-role">'), 'démarrage rapide par rôle : une rangée de tuiles sur toute la largeur');
  assert.ok(psy.includes('<ul class="accueil-tuiles">') && !psy.includes('accueil-tuile-desc'), 'tuiles sans la description qui répétait « Démarrage rapide »');
  assert.ok(psy.includes('<li><span class="accueil-tuile-icone teinte-bleu" aria-hidden="true">') && !psy.includes('<li>👨‍💼'), 'pictogramme de tuile MDI teinté, hors lecture d’écran');
  assert.ok(psy.includes('<p class="accueil-sous-titre">Base de connaissances sur <strong>dimensions psychosociales en SST</strong>') || psy.includes('<p class="accueil-sous-titre">Base de connaissances sur les <strong>dimensions psychosociales en SST</strong>'), 'première phrase du chapeau en sous-titre');
  assert.ok(fs.readFileSync(path.join(DOCS, 'w/legislation/00-accueil/00-accueil.html'), 'utf8').includes('<small class="accueil-tuile-desc">tes droits, tes obligations, tes recours en SST</small>'), 'une vraie description de tuile reste');
  // les six accueils de wiki : les boîtes par public, qui répètent les thèmes, sont repliées ; les thèmes et le démarrage rapide restent ouverts
  for (const w of ['droit-travail', 'ergonomie', 'hygiene', 'psychosocial', 'securite', 'toxicologie']) {
    const h = fs.readFileSync(path.join(DOCS, `w/${w}/index.html`), 'utf8');
    assert.ok(h.includes('<section class="accueil-boite accueil-large" aria-labelledby="themes-du-wiki"><div class="accueil-entete">' + PICTO('mdiLayersTripleOutline')) && h.includes('Explorer tous les thèmes' + CHEVRON + '</a>'), w + ' : thèmes ouverts, lien vers tous les thèmes');
    assert.match(h, /<details class="accueil-boite accueil-large accueil-repli"><summary><div class="accueil-entete"><span class="accueil-boite-icone" aria-hidden="true"><svg[\s\S]*?<\/svg><\/span><div class="accueil-entete-texte"><h2 class="accueil-titre" id="[^"]*">[\s\S]*?<\/h2>(?:<p class="accueil-sous-texte">[^<]*<\/p>)?<\/div><span class="accueil-compte">\d+ pages?<\/span><span class="accueil-chevron" aria-hidden="true"><\/span><\/div><\/summary>/, w + ' : au moins une carte repliée');
    assert.match(h, /<details class="accueil-theme" id="theme-[^"]*" open><summary><span class="accueil-theme-icone teinte-1" aria-hidden="true"><svg/, w + ' : lignes de thèmes à pictogramme');
    assert.ok(!/<details class="accueil-boite[^"]*" aria-labelledby/.test(h), w + ' : un volet replié ne porte pas aria-labelledby');
  }
  // grille des thèmes : première boîte de l'accueil de chaque wiki
  assert.ok(psy.includes('id="themes-du-wiki"') && psy.includes('w/psychosocial/theme/'), 'grille des thèmes en tête de l’accueil');
});

// ---------- passe de correction du 27 septembre 2026 : ordre, largeur, densité (comparaison à la maquette) ----------
test('boîte « Vues d’ensemble » (ancienne « Pages-index de sections ») : même pictogramme de liste', () => {
  assert.equal(genreBoite({ id: 'vues-densemble', titre: 'Vues d’ensemble' }).icone, 'mdiListBoxOutline');
  assert.equal(genreBoite({ id: 'pages-index-de-sections', titre: 'Pages-index de sections' }).icone, 'mdiListBoxOutline');
  for (const w of ['psychosocial', 'hygiene', 'droit-travail']) {
    const h = fs.readFileSync(path.join(DOCS, 'w', w, 'index.html'), 'utf8');
    assert.ok(h.includes('<h2 class="accueil-titre" id="vues-densemble">Vues d&#39;ensemble</h2>') && !h.includes('Pages-index de sections'), w);
  }
});

test('ordre de la maquette : le démarrage rapide par rôle précède les thèmes, le reste ne bouge pas', () => {
  const themes = { id: 'themes-du-wiki', titre: 'Thèmes' }, roles = { id: 'demarrage-rapide-par-role', titre: 'Démarrage rapide par rôle' };
  const internes = { id: 'internes', titre: 'Articles internes' }, nav = { id: 'nav', titre: 'Navigation' };
  assert.ok(estDemarrage(roles) && estDemarrage({ id: 'x', titre: '🚀 Démarrage rapide par profil' }) && !estDemarrage(nav) && !estDemarrage({ id: 'y', titre: 'Démarrage' }));
  assert.deepEqual(ordonnerBoites([themes, roles, internes]).map(s => s.id), ['demarrage-rapide-par-role', 'themes-du-wiki', 'internes']);
  assert.deepEqual(ordonnerBoites([nav, themes, internes, roles]).map(s => s.id), ['nav', 'demarrage-rapide-par-role', 'themes-du-wiki', 'internes']);
  // déjà dans l'ordre, ou sans thèmes (accueil du Recueil, accueils de l'encadrement) : inchangé
  for (const liste of [[roles, themes, internes], [nav, roles, internes], [themes, internes], []]) assert.deepEqual(ordonnerBoites(liste), liste);
  const html = rendreAccueil({ titre: 'T', icone: 'x', domaine: 'd', compte: '3', chapeau: '', index: [{ url: 'ia.html', libelle: 'Index alphabétique' }], sections: [
    { ...themes, html: '<div class="accueil-groupes accueil-themes"></div>', grand: true }, { ...roles, html: '<ul class="accueil-tuiles"></ul>', grand: true }, { ...internes, html: '<ul><li><a href="a">A</a></li></ul>', grand: false, replie: true, nbLiens: 1 }] });
  const ordre = [...html.matchAll(/id="(themes-du-wiki|demarrage-rapide-par-role|internes)"/g)].map(m => m[1]);
  assert.deepEqual(ordre, ['demarrage-rapide-par-role', 'themes-du-wiki', 'internes'], 'rendreAccueil rend les boîtes dans l’ordre de la maquette');
  // la ligne d'index ne coupe plus la page : elle suit la grille, avant le pied
  assert.ok(html.indexOf('<nav class="accueil-index"') > html.lastIndexOf('</div>') - 1 && html.endsWith('<nav class="accueil-index" aria-label="Index et outils du wiki"><a href="ia.html">Index alphabétique</a></nav>'), 'index sous la grille');
  assert.ok(!html.includes('</header>\n</div>\n<nav'), 'plus rien entre la carte d’entrée et la grille');
});

test('feuille de style : layout de la passe de correction (flex sans chevauchement, tuiles 2 × 2, cartes compactes)', () => {
  const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
  const bloc900 = css.slice(css.lastIndexOf('@media (max-width: 900px)'));
  // les pictogrammes prennent la couleur du texte (sans fill, un <path> est noir)
  assert.match(css, /\.ic \{ fill: currentColor;/, 'fill des pictogrammes');
  assert.ok(css.indexOf('.ic { fill: currentColor;') < css.indexOf('.accueil-banniere {'), 'règle posée avant la section des accueils');
  // en-tête de boîte en flex : le titre cède (min-width: 0), le lien de droite ne rétrécit pas
  assert.match(css, /\.accueil-entete \{ display: flex; align-items: center; gap: 12px;/);
  assert.match(css, /\.accueil-entete-texte \{ flex: 1 1 auto; min-width: 0; \}/);
  assert.match(css, /\.accueil-entete-lien \{ flex: none;/);
  assert.ok(!/\.accueil-entete > \.accueil-entete-lien \{ grid-column/.test(css), 'plus de placement en grille du lien « Explorer »');
  // tuiles : deux colonnes de même hauteur, quatre par rangée sur ordinateur, une colonne sous 340 px
  assert.match(css, /\.page-body \.accueil-tuiles \{ list-style: none; display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); grid-auto-rows: 1fr; gap: 10px;/);
  assert.match(css, /@media \(min-width: 901px\) \{ \.accueil-large \.accueil-tuiles \{ grid-template-columns: repeat\(auto-fill, minmax\(190px, 1fr\)\); \} \}/);
  assert.match(css, /@media \(max-width: 340px\) \{[^}]*\.page-body \.accueil-tuiles \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.page-body \.accueil-tuiles a::after \{ content: ''; position: absolute; inset: 0;/, 'toute la tuile est le lien');
  // carte d'entrée au téléphone : titre à côté du pictogramme, chapeau pleine largeur, compte et boutons sur une ligne ; marge sous la carte
  assert.match(bloc900, /\.accueil-banniere \{ padding: 14px; gap: 8px 12px; margin-bottom: 10px; grid-template-columns: auto minmax\(0, 1fr\) auto; grid-template-areas: "icone titre titre" "chapeau chapeau chapeau" "compte compte compte"; \}/);
  assert.match(bloc900, /\.accueil-banniere \.page-title \{ font-size: clamp\(21px, 5\.6vw, 24px\); \}/);
  assert.match(bloc900, /body:has\(\.accueil-banniere\) \.content \{ padding: 14px 14px 32px; \}/, '14 px de marge, comme la maquette');
  // cartes repliées : titre de 15,5 px, sous-titre sans la marge des paragraphes d'article
  assert.match(css, /\.page-body details\.accueil-boite \.accueil-titre \{ font-size: 15\.5px; font-weight: 600;/);
  assert.match(css, /\.page-body \.accueil-sous-texte \{ margin: 2px 0 0;/, 'spécificité : l’emporte sur .page-body p');
  // A− et A+ dans le menu : leur style, et le fait que la carte ne les garde qu'en repli
  assert.match(css, /\.lecture-taille-boutons button \{ min-width: 48px; min-height: 40px;/);
  const app = fs.readFileSync(path.join(R, 'tools/app.js'), 'utf8');
  assert.match(app, /if \(menu && document\.querySelector\('\.accueil-banniere'\)\) \{/, 'app.js déplace A− et A+ sur un accueil');
  assert.match(app, /rangee\.appendChild\(bMoins\);\r?\n\s*rangee\.appendChild\(bPlus\);/);
  assert.match(app, /menu\.appendChild\(groupe\);\r?\n\s*barre\.remove\(\);\r?\n\s*document\.documentElement\.removeAttribute\('data-lecture'\);/, 'sur un accueil, ni Lecture ni PDF, jamais en mode lecture');
  assert.match(app, /\(PDF \? '<button type="button" data-pdf /, 'le bouton PDF des articles reste');
});

test('site publié : les six accueils de wiki suivent l’ordre de la maquette et portent l’index sous les boîtes', () => {
  for (const w of ['droit-travail', 'ergonomie', 'hygiene', 'psychosocial', 'securite', 'toxicologie']) {
    const h = fs.readFileSync(path.join(DOCS, 'w', w, 'index.html'), 'utf8');
    const roles = h.indexOf('aria-labelledby="demarrage-rapide-par-role"'), themes = h.indexOf('aria-labelledby="themes-du-wiki"'), index = h.indexOf('<nav class="accueil-index"'), grille = h.indexOf('<div class="page-body accueil-grille">');
    assert.ok(roles > 0 && themes > roles, w + ' : démarrage rapide avant les thèmes');
    assert.ok(grille > 0 && index > themes && h.slice(grille, index).includes('themes-du-wiki'), w + ' : index après la grille');
    assert.ok(!h.includes('</header>\n</div>\n<nav class="accueil-index"'), w + ' : rien entre la carte et la grille');
  }
});

test('illustrations de la carte d’entrée : une par wiki, décorative, posée sur les dix-sept accueils', () => {
  for (const slug of ['ergonomie', 'hygiene', 'toxicologie', 'securite', 'droit-travail', 'psychosocial', 'legislation']) {
    const svg = illustrationWiki(slug);
    assert.match(svg, /^<svg class="illustration" xmlns="http:\/\/www\.w3\.org\/2000\/svg" aria-hidden="true" focusable="false" viewBox="0 0 96 96">/, slug);
    assert.ok(!/\sid="/.test(svg) && !/<!--/.test(svg) && svg.length < 2500, slug + ' : sans id ni commentaire, léger');
  }
  assert.equal(illustrationWiki('inconnu'), '');
  const avec = rendreAccueil({ titre: 'T', icone: '🦺', wiki: 'ergonomie', domaine: 'd', compte: '3', chapeau: '', sections: [] });
  assert.ok(avec.startsWith('<div class="accueil-banniere">\n<span class="accueil-icone accueil-illustration" aria-hidden="true"><svg class="illustration"'));
  assert.ok(rendreAccueil({ titre: 'T', icone: '🦺', domaine: 'd', compte: '3', chapeau: '', sections: [] }).includes('<span class="accueil-icone" aria-hidden="true">🦺</span>'), 'sans wiki : l’emoji');
  for (const rel of [...ACCUEILS.map(r => 'w/' + r), ...ACCUEILS_G.map(r => 'g/w/' + r)]) {
    const html = fs.readFileSync(path.join(DOCS, rel), 'utf8');
    const slug = rel.replace(/^g\//, '').split('/')[1];
    assert.ok(html.includes(`<span class="accueil-icone accueil-illustration" aria-hidden="true">${illustrationWiki(slug)}</span>`), rel);
  }
  const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
  assert.match(css, /\.accueil-illustration \.illustration \{ width: 84%; height: 84%;/);
});
