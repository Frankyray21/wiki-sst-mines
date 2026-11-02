import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import {
  extrairePage, reecrireLiens, lierTelephones, lireMarkdown, validerQuestions, identifierTitres, sommaireDe, premierePhrase,
  genererEspaceTravailleurs, chargerConf, preparerEspace, texteDe,
} from '../espace_travailleurs.mjs';
import { verifierEspace } from '../travailleurs/verifier.mjs';
import { genererListeHorsLigne } from '../pwa.mjs';
import { SCRIPT_LIENS_404, scriptRedirection } from '../redirections.mjs';

const OUTILS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.resolve(OUTILS, '..', 'docs');
const ESPACE = path.join(DOCS, 'travailleurs');
const MOTS_INTERDITS = /bless|arrêt de travail|convalescen|lésion|accidenté|victime|absence|réclamation|indemnit/i;

// ---------- briques ----------

test('extrairePage garde le corps et retire ce qui relie la page au reste du wiki', () => {
  const html = `<h1 class="page-title">🎯 Démarrage rapide</h1><table><tr><th>Révision déclarée</th><td>2026-05-22</td></tr></table>
<div class="page-body"><p>Texte <a href="../../w/x.html">lien</a>.</p><div class="callout"><div>imbriqué</div></div>
<details class="backlinks"><summary>Pages qui pointent ici</summary><a href="../../index.html">Portail</a></details>
<nav class="voisins"><a href="a.html">←</a></nav><section class="avis"><form></form></section>
<div class="voir-aussi"><a href="../../g/index.html">Encadrement</a></div><div class="page-meta"><a href="../../graphe.html">graphe</a></div></div><footer>pied</footer>`;
  const p = extrairePage(html);
  assert.equal(p.titre, 'Démarrage rapide', 'pictogramme de tête retiré');
  assert.equal(p.revision, '2026-05-22');
  assert.match(p.corps, /imbriqué<\/div><\/div>/);
  for (const absent of ['backlinks', 'voisins', 'avis', 'voir-aussi', 'page-meta', 'pied', 'g/index.html']) assert.ok(!p.corps.includes(absent), absent);
});

test('reecrireLiens : espace → espace, reste du wiki → texte, externe → nouvel onglet, médias gardés', () => {
  const cible = (c) => ({ 'w/securite/cadenassage.html': 'cadenassage', 'w/psychosocial/theme/retour-au-travail.html': 'ton-retour-au-travail' })[c] || '';
  const corps = `<p><a href="../../w/securite/cadenassage.html#delais" title="t">le cadenassage</a>,
<a href="../../w/psychosocial/theme/retour-au-travail.html">retour</a>, <a href="../../g/index.html">encadrement</a>,
<a href="../../w/securite/demarrage-rapide-direction-et-rh.html">RH</a>, <a href="#sec">ancre</a>, <a href="tel:+18448380808">tél.</a>,
<a href="https://www.cnesst.gouv.qc.ca/">CNESST</a>, <a href="https://frankyray21.github.io/wiki-sst-mines/w/hygiene/bruit.html">bruit</a></p>
<p><a href="../../index.html">← Accueil</a></p><div class="page-img"><a class="img-lien img-zoom" href="../../files/infographies/x.svg"><img src="../../files/infographies/x.svg" srcset="../../files/a.png 1x, ../../files/b.png 2x"></a></div>
<p><span class="interne-inline" title="x">Toutes les pages travailleurs <small>(source non publiée)</small></span></p>`;
  const { html, coupes } = reecrireLiens(corps, 'w/securite/demarrage-rapide-travailleur.html', cible);
  assert.match(html, /<a href="cadenassage\.html#delais">le cadenassage<\/a>/);
  assert.match(html, /<a href="ton-retour-au-travail\.html">retour<\/a>/);
  assert.match(html, /<span class="et-hors">encadrement<\/span>/);
  assert.match(html, /<span class="et-hors">RH<\/span>/);
  assert.match(html, /<span class="et-hors">bruit<\/span>/, 'adresse absolue du wiki traitée comme interne');
  assert.match(html, /href="#sec"/);
  assert.match(html, /href="tel:\+18448380808"/);
  assert.match(html, /href="https:\/\/www\.cnesst\.gouv\.qc\.ca\/" target="_blank" rel="noopener noreferrer"/);
  assert.ok(!html.includes('Accueil'), 'paragraphe de navigation retiré');
  assert.ok(!html.includes('source non publiée') && !html.includes('Toutes les pages travailleurs'), 'mention interne retirée');
  assert.match(html, /<a class="img-lien img-zoom" href="\.\.\/files\/infographies\/x\.svg">/, 'le lien vers l’image (visionneuse) reste');
  assert.match(html, /src="\.\.\/files\/infographies\/x\.svg"/);
  assert.match(html, /srcset="\.\.\/files\/a\.png 1x, \.\.\/files\/b\.png 2x"/);
  assert.ok(coupes.includes('g/index.html') && coupes.includes('w/securite/demarrage-rapide-direction-et-rh.html'));
});

test('lierTelephones rend les numéros cliquables sans toucher aux liens ni aux balises', () => {
  const h = lierTelephones('<p>Appelle le 1 844 838-0808, Info-Social 811, le 9-8-8 ou le 9-1-1.</p><a href="x.html">514-935-1101</a><img alt="418 555 1234">');
  assert.match(h, /<a class="et-tel" href="tel:\+18448380808">1 844 838-0808<\/a>/);
  assert.match(h, /Info-Social <a class="et-tel" href="tel:811">811<\/a>/);
  assert.match(h, /href="tel:988">9-8-8</);
  assert.match(h, /href="tel:911">9-1-1</);
  assert.match(h, /<a href="x\.html">514-935-1101<\/a>/, 'lien existant intact');
  assert.match(h, /alt="418 555 1234"/, 'attribut intact');
});

test('identifierTitres et sommaireDe : des ancres uniques, un sommaire à deux niveaux', () => {
  const h = identifierTitres('<h2>Les énergies</h2><h3>À qui parler ?</h3><h2>Les énergies</h2><h2 id="sources">Sources</h2>', ['questions']);
  assert.match(h, /<h2 id="les-energies">Les énergies<\/h2><h3 id="a-qui-parler">À qui parler \?<\/h3><h2 id="les-energies-2">Les énergies<\/h2>/);
  assert.deepEqual(sommaireDe(h).map(e => `${e.niveau}:${e.id}:${e.titre}`), ['2:les-energies:Les énergies', '3:a-qui-parler:À qui parler ?', '2:les-energies-2:Les énergies', '2:sources:Sources']);
  assert.equal(premierePhrase('Le cadenassage sert à maintenir les sources. Arrêter ne suffit pas.'), 'Le cadenassage sert à maintenir les sources.');
});

test('lireMarkdown : frontmatter, encadrés, liens vers l’espace gardés, vers une page retirée rendus en texte, autres refusés', () => {
  const slugs = new Set(['a', 'b']);
  const md = `---\ntitre: "Titre"\nresume: "Résumé."\nrevision: 2026-11-02\nsources:\n  - "LATMP, art. 32"\n---\n\nTexte vers [b](b.html) et [c](c.html).\n\n> [!warning] Attention\n> Un **délai** de 30 jours.\n\nFin.`;
  const p = lireMarkdown(md, slugs, new Set(['a', 'b', 'c']));
  assert.equal(p.titre, 'Titre');
  assert.equal(p.revision, '2026-11-02');
  assert.deepEqual(p.sources, ['LATMP, art. 32']);
  assert.match(p.corps, /<div class="callout callout-warning"><div class="callout-title"><span class="callout-icon">⚠️<\/span>Attention<\/div><div class="callout-body"><p>Un <strong>délai<\/strong> de 30 jours\.<\/p>/);
  assert.match(p.corps, /<a href="b\.html">b<\/a>/);
  assert.match(p.corps, /<span class="et-hors">c<\/span>/, 'page connue mais hors de l’espace : texte');
  assert.throws(() => lireMarkdown(md, slugs), /liens hors de l'espace : c\.html/);
  assert.throws(() => lireMarkdown(md.replace('(b.html)', '(../w/droit-travail/x.html)'), slugs, new Set(['a', 'b', 'c'])), /liens hors de l'espace/);
  assert.throws(() => lireMarkdown(md.replace('(b.html)', '(https://exemple.com)'), slugs, new Set(['a', 'b', 'c'])), /liens hors de l'espace/);
  assert.throws(() => lireMarkdown('Pas de frontmatter', slugs), /frontmatter/);
});

test('validerQuestions refuse les questions mal formées', () => {
  const ok = { type: 'choix', id: 'q1', question: 'Q ?', options: ['a', 'b'], reponse: 1, explication: 'E' };
  assert.equal(validerQuestions({ page: 'p', questions: [ok] }, 'p').length, 1);
  const mauvais = [
    [{ ...ok, reponse: 2 }, /hors des options/],
    [{ ...ok, type: 'inconnu' }, /type inconnu/],
    [{ type: 'multi', id: 'q1', question: 'Q', options: ['a', 'b'], reponses: [0, 1], explication: 'E' }, /pas toutes/],
    [{ type: 'vf', id: 'q1', question: 'Q', reponse: 'vrai', explication: 'E' }, /true ou false/],
    [{ type: 'ordre', id: 'q1', question: 'Q', etapes: ['a', 'b'], explication: 'E' }, /3 à 7/],
    [{ type: 'court', id: 'q1', question: 'Q', attendu: [], explication: 'E' }, /attendu/],
    [{ ...ok, explication: '' }, /explication vide/],
  ];
  for (const [q, re] of mauvais) assert.throws(() => validerQuestions({ questions: [q] }, 'p'), re);
  assert.throws(() => validerQuestions({ questions: [ok, ok] }, 'p'), /double/);
  assert.throws(() => validerQuestions({ page: 'autre', questions: [ok] }, 'p'), /« page »/);
});

// ---------- la configuration et le contenu ----------

test('la configuration est complète : 18 pages en 5 thèmes, chacune avec ses questions, relais en https', () => {
  const conf = chargerConf(OUTILS);
  assert.ok(/^https:\/\//.test(conf.relais), 'relais configuré');
  assert.equal(conf.seuil, 80);
  assert.equal(conf.sections.length, 5);
  const pages = conf.sections.flatMap(s => s.pages);
  assert.equal(pages.length, 18, `${pages.length} pages`);
  for (const p of pages) {
    if (p.source) assert.ok(fs.existsSync(path.join(DOCS, p.source)), 'page du wiki présente : ' + p.source);
    else assert.ok(fs.existsSync(path.join(OUTILS, 'travailleurs', p.fichier)), 'page écrite présente : ' + p.fichier);
    assert.ok(fs.existsSync(path.join(OUTILS, 'travailleurs', 'questions', p.slug + '.json')), 'questions : ' + p.slug);
  }
  const etiquettes = conf.sections.map(s => s.etiquette).sort();
  assert.deepEqual(etiquettes, ['Obligations et appuis', 'Par où commencer', 'Prendre soin de toi', 'Retour au travail', 'Risques et réflexes'],
    'sections = options du champ Section de la table Airtable et liste SECTIONS du relais');
  const relais = fs.readFileSync(path.join(OUTILS, 'attestations-worker', 'worker.js'), 'utf8');
  for (const e of etiquettes) assert.ok(relais.includes(`'${e}'`), 'le relais accepte la section ' + e);
  // les pages retirées restent connues : leurs sources, questions et corrections attendent
  assert.equal(conf.horsEspace.slugs.length, 11);
  for (const s of conf.horsEspace.slugs) assert.ok(!pages.some(p => p.slug === s), `${s} n’est pas dans l’espace`);
});

test('contenu : chaque citation des explications se retrouve dans la page lue, et les types exigés sont là', () => {
  const r = verifierEspace(DOCS, { outils: OUTILS });
  assert.deepEqual(r.erreurs, []);
  assert.ok(r.questions >= 100, `${r.questions} questions`);
});

test('l’interface ne dit jamais que le lecteur est blessé ou en arrêt : nom, chapeau, sections, titres, menu, accueil', () => {
  const { conf, pages, sections } = preparerEspace(DOCS, { outils: OUTILS });
  for (const t of [conf.nom, conf.nomLong, texteDe(conf.sousTitre), conf.chapeau, conf.marque.gros, conf.marque.petit]) assert.doesNotMatch(t, MOTS_INTERDITS, t);
  for (const s of sections) for (const t of [s.titre, s.chapeau, s.etiquette]) assert.doesNotMatch(t, MOTS_INTERDITS, t);
  for (const p of pages) { assert.doesNotMatch(p.titre, MOTS_INTERDITS, p.titre); assert.doesNotMatch(p.slug, /bless|arret|lesion|sequelle|reclamation|indemnit|absence/, 'adresse de page : ' + p.slug); }
  const accueil = fs.readFileSync(path.join(ESPACE, 'index.html'), 'utf8');
  assert.doesNotMatch(texteDe(accueil), MOTS_INTERDITS, 'page d’accueil');
  // la barre latérale et l'en-tête de chaque page, pareil
  const article = fs.readFileSync(path.join(ESPACE, 'cadenassage.html'), 'utf8');
  const avantCorps = article.slice(0, article.indexOf('<div class="page-body">'));
  assert.doesNotMatch(texteDe(avantCorps), MOTS_INTERDITS, 'menu, fil d’Ariane, infobox, sommaire');
  // la description (aperçus de lien, favoris) est le sous-titre neutre du wiki, jamais le résumé de la page
  for (const f of ['garder-le-moral.html', 'readaptation-et-emploi-convenable.html', 'ton-retour-au-travail.html']) {
    const h = fs.readFileSync(path.join(ESPACE, f), 'utf8');
    assert.equal(h.match(/<meta name="description" content="([^"]*)">/)[1], texteDe(conf.sousTitre).replace(/&/g, '&amp;'), f);
  }
  // et pas de droits ni de démarches en vitrine : le wiki parle de prévention
  assert.doesNotMatch(conf.nom + texteDe(conf.sousTitre) + conf.chapeau + sections.map(s => s.titre).join(' '), /droit|démarche|réclamation/i);
});

// ---------- l'espace généré ----------

test('l’espace généré est fermé : aucun lien vers une autre page du site, aucune ressource du wiki', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'espace-'));
  const conf = chargerConf(OUTILS);
  for (const p of conf.sections.flatMap(s => s.pages).filter(p => p.source)) {
    fs.mkdirSync(path.dirname(path.join(tmp, p.source)), { recursive: true });
    fs.copyFileSync(path.join(DOCS, p.source), path.join(tmp, p.source));
  }
  const r = genererEspaceTravailleurs(tmp, { outils: OUTILS, journal: { log() {} }, date: '2026-11-02' });
  const dossier = path.join(tmp, 'travailleurs');
  const fichiers = fs.readdirSync(dossier).filter(f => f.endsWith('.html'));
  assert.equal(fichiers.length, r.pages + r.sections + 4, 'une page par lecture, une par thème, l’accueil, la recherche, mes lectures, l’index');
  const permis = new Set(fichiers);
  for (const f of fichiers) {
    const html = fs.readFileSync(path.join(dossier, f), 'utf8');
    for (const [, attr, v] of html.matchAll(/\s(href|src|action|formaction|srcset|poster)="([^"]*)"/g)) {
      if (/^(#|tel:|mailto:|data:)/.test(v)) continue;
      if (/^https:\/\//.test(v)) { assert.ok(!/frankyray21\.github\.io/.test(v), `${f} : lien absolu vers le wiki ${v}`); continue; }
      const chemin = v.split(/[?#]/)[0];
      if ((attr === 'href' || attr === 'action') && permis.has(chemin)) continue;
      if (chemin === '../assets/style.css' || chemin.startsWith('assets/travailleurs.')) continue;
      // médias (captures, schémas, PDF du recueil) : des fichiers, pas des pages
      assert.ok(chemin.startsWith('../files/'), `${f} : ${attr}="${v}" sort de l’espace`);
    }
    const sansMedias = html.replace(/\.\.\/files\/[^"]*/g, '');
    assert.ok(!/app\.js|search-index|hors-ligne|\/w\/|\/g\/|categorie|graphe\.html|themes\.html|qualite\.html/.test(sansMedias), `${f} : aucune ressource du wiki (script, recherche globale, graphe, encadrement, catégories)`);
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    assert.match(html, /<nav class="sidebar" id="sidebar"/, `${f} : barre latérale du wiki`);
    assert.match(html, /<input type="search" id="q"/, `${f} : recherche interne`);
  }
  // le script ne charge que l'index de la recherche de l'espace
  const js = fs.readFileSync(path.join(dossier, 'assets', 'travailleurs.js'), 'utf8');
  const fetches = [...js.matchAll(/fetch\(([^,)]+)/g)].map(m => m[1].trim());
  assert.equal(fetches.length, 3, 'index de recherche, attestation, recherche de nom');
  for (const f of fetches) assert.match(f, /^('assets\/index-recherche\.json'|RELAIS\b)/, 'appel réseau : ' + f);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dossier, 'assets', 'index-recherche.json'), 'utf8')).length, r.pages);
  const accueil = fs.readFileSync(path.join(dossier, 'index.html'), 'utf8');
  assert.match(accueil, /class="accueil-banniere"/, 'bannière d’accueil du wiki');
  assert.equal((accueil.match(/class="accueil-boite[ "]/g) || []).length, 5, 'par où commencer, les thèmes, mes lectures, besoin de parler, comment ça marche');
  assert.equal((accueil.match(/<details class="accueil-theme"/g) || []).length, r.sections - 1, 'un volet par thème, comme l’accueil d’un wiki');
  assert.match(accueil, /href="tel:911"/);
  assert.match(accueil, /href="ou-appeler\.html"/);
});

test('une page de lecture a l’infobox, le sommaire, « Voir aussi », les voisins, les pages liées, ses questions et le relais', () => {
  const html = fs.readFileSync(path.join(ESPACE, 'cadenassage.html'), 'utf8');
  const donnees = JSON.parse(html.match(/<script type="application\/json" id="donnees-questions">([\s\S]*?)<\/script>/)[1]);
  assert.equal(donnees.slug, 'cadenassage');
  assert.ok(donnees.questions.length >= 5);
  assert.match(html, /data-relais="https:\/\/attestations-wiki-travailleurs\.frankyray-21\.workers\.dev"/);
  assert.match(html, /data-seuil="80"/);
  assert.match(html, /data-section="Risques et réflexes"/);
  const minutes = Number(html.match(/data-minutes="(\d+)"/)[1]);
  const mots = Number(html.match(/data-mots="(\d+)"/)[1]);
  assert.equal(minutes, Math.ceil(mots / 180), '180 mots par minute');
  assert.match(html, /<div class="breadcrumbs"><a href="index\.html">Accueil<\/a> <span class="crumb-sep">›<\/span> <a href="section-risques\.html">/);
  assert.match(html, /<aside class="infobox">/);
  assert.match(html, /<nav class="toc" aria-label="Sommaire de la page">/);
  // chaque entrée du sommaire mène à un titre de la page
  for (const [, id] of html.matchAll(/<li class="toc-l[23]"><a href="#([^"]+)">/g)) assert.ok(html.includes(`id="${id}"`), 'ancre du sommaire : ' + id);
  assert.match(html, /<nav class="voir-aussi" aria-label="Dans le même thème"><h2>Dans le même thème<\/h2>/);
  assert.match(html, /<div class="lecture-outils" role="group"/, 'A−, A+, Lecture comme sur un article du wiki');
  assert.match(html, /<span id="chrono" aria-hidden="true">/, 'temps de lecture dans l’infobox');
  assert.match(html, /<div class="nav-title">Dans ce thème<\/div>/);
  assert.match(html, /<main class="content" id="principal">/, 'identifiant du contenu sans collision avec un titre « Contenu »');
  const md = fs.readFileSync(path.join(ESPACE, 'garder-le-moral.html'), 'utf8');
  assert.match(md, /<li class="toc-l2"><a href="#sources">Sources<\/a><\/li><li class="toc-l2"><a href="#questions">/, 'les sources d’une page écrite sont au sommaire');
  assert.match(html, /<nav class="voisins"/);
  assert.match(html, /<details class="backlinks"><summary>Pages qui pointent ici \(\d+\)<\/summary>/);
  assert.match(html, /<li class="active"><a href="cadenassage\.html" aria-current="page">/, 'page courante marquée dans le menu');
  assert.ok(!html.includes('</script><'), 'pas de fermeture de script dans les données');
});

test('les pages de section, la recherche et « Mes lectures » sont des pages du wiki', () => {
  const section = fs.readFileSync(path.join(ESPACE, 'section-soin.html'), 'utf8');
  assert.match(section, /<ul class="cat-pages theme-notions et-notions">/);
  assert.equal((section.match(/data-etat-badge data-slug="/g) || []).length, 3);
  assert.match(section, /<li class="active"><a href="section-soin\.html" aria-current="page">💬 Prendre soin de toi<\/a>/);
  const index = fs.readFileSync(path.join(ESPACE, 'index-alphabetique.html'), 'utf8');
  const listeIndex = index.slice(index.indexOf('<ul class="cat-pages">'), index.indexOf('</ul>', index.indexOf('<ul class="cat-pages">')));
  assert.equal((listeIndex.match(/<li><a href="[a-z0-9-]+\.html">/g) || []).length, 18);
  const recherche = fs.readFileSync(path.join(ESPACE, 'recherche.html'), 'utf8');
  assert.match(recherche, /<form class="et-recherche" role="search" action="recherche\.html" method="get">/);
  const parcours = fs.readFileSync(path.join(ESPACE, 'parcours.html'), 'utf8');
  assert.equal((parcours.match(/data-etat-badge data-slug="/g) || []).length, 18);
  assert.match(parcours, /id="listeAttestations"/);
});

test('une page qui disparaît du site arrête la génération ; une correction périmée aussi', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'espace-vide-'));
  assert.throws(() => genererEspaceTravailleurs(tmp, { outils: OUTILS, journal: { log() {} } }), /page\(s\) introuvable\(s\)/);
  // outils factices : une page, une correction qui ne s'applique pas
  const outils = fs.mkdtempSync(path.join(os.tmpdir(), 'outils-'));
  fs.mkdirSync(path.join(outils, 'travailleurs', 'questions'), { recursive: true });
  fs.mkdirSync(path.join(outils, 'travailleurs', 'pages'), { recursive: true });
  for (const f of ['travailleurs.js', 'travailleurs.css']) fs.writeFileSync(path.join(outils, 'travailleurs', f), '');
  fs.writeFileSync(path.join(outils, 'travailleurs', 'pages.json'), JSON.stringify({ nom: 'W', marque: { icone: '⛑️', gros: 'W', petit: 'p' }, sousTitre: 'S', chapeau: 'C', seuil: 80, relais: '',
    sections: [{ id: 's', titre: 'S', icone: '⛑️', etiquette: 'Par où commencer', chapeau: 'c', pages: [{ slug: 'p', source: 'w/p.html' }] }, { id: 't', titre: 'T', icone: '⛑️', etiquette: 'Risques et réflexes', chapeau: 'c', pages: [] }] }));
  fs.mkdirSync(path.join(tmp, 'w'));
  fs.writeFileSync(path.join(tmp, 'w', 'p.html'), '<h1 class="page-title">P</h1><div class="page-body"><p>Texte vrai.</p></div>');
  fs.writeFileSync(path.join(outils, 'travailleurs', 'corrections.json'), JSON.stringify({ corrections: [{ page: 'p', avant: 'Texte faux.', apres: 'x' }] }));
  assert.throws(() => genererEspaceTravailleurs(tmp, { outils, journal: { log() {} } }), /apparaît 0 fois/);
  fs.writeFileSync(path.join(outils, 'travailleurs', 'corrections.json'), JSON.stringify({ corrections: [{ page: 'p', avant: 'Texte vrai.', apres: 'Texte corrigé.' }, { page: 'absente', avant: 'x', apres: 'y' }] }));
  const r = genererEspaceTravailleurs(tmp, { outils, journal: { log() {} }, date: '2026-11-02' });
  assert.equal(r.corrections, 1, 'la correction d’une page hors de l’espace attend sans bloquer');
  assert.match(fs.readFileSync(path.join(tmp, 'travailleurs', 'p.html'), 'utf8'), /Texte corrigé\./);
});

test('les corrections de l’espace s’appliquent toutes aux pages du wiki publiées', () => {
  const f = path.join(OUTILS, 'travailleurs', 'corrections.json');
  if (!fs.existsSync(f)) return;
  const { corrections } = JSON.parse(fs.readFileSync(f, 'utf8'));
  const conf = chargerConf(OUTILS);
  const sources = new Map(conf.sections.flatMap(s => s.pages).map(p => [p.slug, p.source]));
  let appliquees = 0;
  for (const c of corrections) {
    if (!sources.has(c.page)) { assert.ok(conf.horsEspace.slugs.includes(c.page), `${c.page} : page connue, retirée de l’espace`); continue; }
    const html = fs.readFileSync(path.join(DOCS, sources.get(c.page)), 'utf8');
    assert.equal(html.split(c.avant).length - 1, 1, `${c.page} : passage « ${c.avant.slice(0, 60)} » présent une fois`);
    assert.ok(c.raison && c.raison.length > 10, `${c.page} : correction justifiée`);
    assert.ok(!texteDe(c.apres).includes('source non publiée'));
    appliquees++;
  }
  assert.ok(appliquees >= 10, `${appliquees} corrections appliquées`);
});

// ---------- isolement vis-à-vis du wiki ----------

test('le manifeste hors ligne du wiki ignore l’espace, et son service worker ne le sert pas', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-'));
  fs.mkdirSync(path.join(tmp, 'assets'));
  fs.mkdirSync(path.join(tmp, 'travailleurs'));
  fs.writeFileSync(path.join(tmp, 'index.html'), 'x');
  fs.writeFileSync(path.join(tmp, 'travailleurs', 'index.html'), 'x');
  genererListeHorsLigne(tmp, '20260101000000');
  const m = JSON.parse(fs.readFileSync(path.join(tmp, 'assets', 'hors-ligne.json'), 'utf8'));
  assert.deepEqual(m.pages.map(p => p[0]), ['index.html']);
  const sw = fs.readFileSync(path.join(DOCS, 'sw.js'), 'utf8');
  assert.match(sw, /pathname\.includes\('\/travailleurs\/'\)\) return;/, 'service worker publié : réseau seulement pour l’espace');
});

test('404 : une adresse inconnue de l’espace ramène à l’accueil de l’espace, sans recherche du wiki', () => {
  const elements = {
    'lien-accueil': { href: '', textContent: '' }, 'lien-recherche': { href: '' },
    'suite-recherche': { retire: false, remove() { this.retire = true; } },
  };
  const executer = (chemin) => {
    for (const e of Object.values(elements)) { e.href = ''; e.retire = false; }
    vm.runInNewContext(SCRIPT_LIENS_404, { location: { pathname: chemin }, document: { getElementById: (id) => elements[id] } });
  };
  executer('/wiki-sst-mines/travailleurs/page-disparue.html');
  assert.equal(elements['lien-accueil'].href, '/wiki-sst-mines/travailleurs/index.html');
  assert.equal(elements['suite-recherche'].retire, true);
  executer('/wiki-sst-mines/w/droit-travail/disparue.html');
  assert.equal(elements['lien-accueil'].href, '/wiki-sst-mines/index.html');
  assert.equal(elements['suite-recherche'].retire, false);
  let remplace = null;
  vm.runInNewContext(scriptRedirection({}), { location: { pathname: '/wiki-sst-mines/travailleurs/x.html', search: '', hash: '', replace(u) { remplace = u; } } });
  assert.equal(remplace, null);
  const page404 = fs.readFileSync(path.join(DOCS, '404.html'), 'utf8');
  assert.ok(page404.includes('suite-recherche') && page404.includes('travailleurs/index.html'), '404.html publiée à jour');
});
