import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEXTES_LOI, texteArticle, texteLoiDeLaPage, loiDeLaPage, numeroDeLaPage, insererTexteLoi, rendreTexteLoi, renommerLibelleCapture, LIBELLE_CAPTURE, LIBELLE_TEXTE } from '../textes_loi.mjs';
import { numeroSuit, lignesDePage } from '../extraire_textes_loi.mjs';
import { motsDePage, encoderListe, decoderListe } from '../recherche_mots.mjs';

// Texte officiel des articles de loi : données extraites des PDF (tools/textes-loi), repérage de
// l'article d'une page, pose dans le HTML, et état du site publié (docs/).
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = path.join(R, 'docs');
// nombre de pages d'articles du wiki par loi : l'extraction doit au moins les couvrir toutes
const PAGES_WIKI = { LSST: 393, LATMP: 527, LNT: 22, LMRSST: 301, RSST: 480, RSSM: 538, CSTC: 569 };

// « art-83-rssm » → nom complet du fichier (le slug porte aussi le titre de la note)
function pageParPrefixe(dossier, prefixe) {
  const f = fs.readdirSync(path.join(DOCS, 'w/legislation', dossier)).find(n => n === prefixe + '.html' || n.startsWith(prefixe + '-'));
  assert.ok(f, `page ${prefixe} dans ${dossier}`);
  return f;
}
function* pagesArticles() {
  (function* walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yield* walk(p); else if (/^art-.*\.html$/.test(e.name)) yield p; } });
  yield* (function* walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yield* walk(p); else if (/^art-.*\.html$/.test(e.name)) yield p; } })(path.join(DOCS, 'w/legislation'));
}

test('les sept lois sont extraites, contrôlées, et couvrent tous les articles du wiki', () => {
  for (const [loi, n] of Object.entries(PAGES_WIKI)) {
    const j = TEXTES_LOI[loi];
    assert.ok(j, `${loi} absente de tools/textes-loi`);
    const c = j.controles;
    assert.deepEqual([c.vides, c.doublons, c.nonCroissants, c.enTetesFuites], [0, 0, 0, 0], `${loi} : contrôles`);
    assert.ok(Object.keys(j.articles).length >= n, `${loi} : ${Object.keys(j.articles).length} articles extraits pour ${n} pages du wiki`);
    for (const [num, a] of Object.entries(j.articles)) {
      assert.ok(/^\d+(\.\d+)*$/.test(num), `${loi} ${num} : numéro`);
      assert.ok(a.paragraphes.length > 0 && a.paragraphes.every(t => typeof t === 'string' && t.trim()), `${loi} ${num} : paragraphes`);
      assert.ok(Number.isInteger(a.page) && a.page >= 1 && a.page <= c.pages, `${loi} ${num} : page ${a.page}`);
      for (const t of a.paragraphes) {
        for (const e of c.enTetes) if (e) assert.ok(!t.includes(e), `${loi} ${num} : titre courant « ${e} » dans le texte`);
        assert.ok(!/^\d+ sur \d+$/.test(t) && !/^À jour au /.test(t), `${loi} ${num} : pied de page dans le texte`);
      }
    }
  }
});

test('LSST art. 51 : dix-huit paragraphes, les seize obligations numérotées dans l’ordre', () => {
  const a = TEXTES_LOI.LSST.articles['51'];
  assert.equal(a.page, 16);
  assert.equal(a.paragraphes.length, 18);
  assert.match(a.paragraphes[0], /^L’employeur doit prendre les mesures nécessaires/);
  for (let i = 1; i <= 16; i++) assert.ok(a.paragraphes[i].startsWith(`${i}° `), `paragraphe ${i}° : ${a.paragraphes[i].slice(0, 30)}`);
  assert.match(a.paragraphes[17], /^Aux fins du paragraphe 16°/);
  // le CSTC numérote ses paragraphes « 1. », « 1.1. » : ils ouvrent chacun un paragraphe
  const c = TEXTES_LOI.CSTC.articles['2.4.1'];
  assert.ok(c.paragraphes.some(t => t.startsWith('1.1. Cet avis')) && c.paragraphes.some(t => t.startsWith('2. Avant la mise en oeuvre')));
  // « 7.01 » et « 7.1 » sont deux articles distincts du RSSM
  assert.ok(TEXTES_LOI.RSSM.articles['7.01'] && TEXTES_LOI.RSSM.articles['7.1']);
});

test('repérage de la loi et du numéro depuis le nom de la note, jamais depuis un nombre YAML', () => {
  assert.equal(numeroDeLaPage('art-49.1-LSST, droits généraux'), '49.1');
  assert.equal(numeroDeLaPage('art-312.100-RSSM'), '312.100');
  assert.equal(numeroDeLaPage('Comité de santé et de sécurité'), null);
  assert.equal(loiDeLaPage('RSST', 'art-51-RSST : interdiction de fumer'), 'RSST');
  assert.equal(loiDeLaPage(undefined, 'art-105-RSSM'), 'RSSM', 'frontmatter absent : sigle lu dans le nom');
  assert.equal(loiDeLaPage('Règlement canadien SST', 'art-14.48-RCSST'), null, 'loi hors recueil : pas de texte');
  assert.equal(loiDeLaPage(undefined, 'art-2.4.1-CSTC, 1. Le maître'), 'CSTC');
  assert.equal(texteLoiDeLaPage('RSST', 'art-51-RSST : interdiction de fumer').article.page, 20);
  assert.equal(texteLoiDeLaPage('LSST', 'art-9999-LSST'), null);
});

test('numeroSuit : le zéro de tête compte, la numérotation hiérarchique du CSTC est admise', () => {
  assert.equal(numeroSuit(['7', '1'], ['7', '01']), true);
  assert.equal(numeroSuit(['7', '01'], ['7', '1']), false);
  assert.equal(numeroSuit(['312', '100'], ['312', '10']), true);
  assert.equal(numeroSuit(['50'], ['51']), false);
  assert.equal(numeroSuit(['7', '1', '1', '1'], ['7', '1', '6']), true, 'sous-section 7.1.1 après l’article 7.1.6');
});

test('lignesDePage : regroupe par ordonnée, ordonne par abscisse, écarte les petits corps, marque les gros', () => {
  const item = (str, h, x, y) => ({ str, transform: [h, 0, 0, h, x, y], fontName: 'g_d0_f9' });
  const lignes = lignesDePage([item('L’employeur doit', 11, 87, 334), item('51.', 13, 54, 334), item('1979, c. 63, a. 51', 9, 54, 300), item('protéger la santé', 11, 54, 323)], 11);
  assert.equal(lignes.length, 2);
  assert.equal(lignes[0].texte, '51. L’employeur doit');
  assert.equal(lignes[0].morceaux[0].gras, true);
  assert.equal(lignes[0].morceaux[1].gras, false);
  assert.equal(lignes[1].texte, 'protéger la santé');
});

test('rendu et pose du texte officiel dans une page', () => {
  const tl = { loi: 'LSST', numero: '49', article: { page: 15, paragraphes: ['Le travailleur doit:', '1° prendre <connaissance> du programme;'] } };
  const bloc = rendreTexteLoi(tl);
  assert.ok(bloc.includes('<p>Le travailleur doit:</p>') && bloc.includes('<p class="alinea">1° prendre &lt;connaissance&gt; du programme;</p>'));
  assert.ok(bloc.includes('article 49 LSST') && bloc.includes('(page 15)') && bloc.includes('La capture ci-dessous et le PDF font foi.'));
  // 1. sous le titre du vault, renommé
  const avecTitre = `<p>x</p>\n<h2 id="texte-officiel-capture-du-pdf">${LIBELLE_CAPTURE}</h2>\n<span class="page-img"><a class="img-lien" href="a.png"><img class="img-doc" src="a.png" alt=""></a></span>`;
  const r1 = insererTexteLoi(avecTitre, tl);
  assert.equal(r1.mode, 'titre');
  assert.ok(r1.html.includes(`<h2 id="texte-officiel-capture-du-pdf">${LIBELLE_TEXTE}</h2>\n<div class="texte-loi"`) && !r1.html.includes(LIBELLE_CAPTURE));
  assert.ok(r1.html.indexOf('class="texte-loi"') < r1.html.indexOf('class="img-doc"'), 'le texte précède la capture');
  // 2. devant la capture, sans titre
  const r2 = insererTexteLoi('<p>x</p>\n<span class="page-img"><a class="img-lien" href="a.png"><img class="img-doc" src="a.png" alt=""></a></span>', tl);
  assert.equal(r2.mode, 'image');
  assert.ok(r2.html.indexOf('class="texte-loi"') < r2.html.indexOf('class="img-doc"'));
  // 3. en fin de page, titre ajouté, sans mention d'une capture absente
  const r3 = insererTexteLoi('<p>x</p>', tl);
  assert.equal(r3.mode, 'fin');
  assert.equal(r3.ajoutTitre, 'texte-officiel');
  assert.ok(r3.html.includes(`<h2 id="texte-officiel">${LIBELLE_TEXTE}</h2>`) && r3.html.includes('Le PDF fait foi.') && !r3.html.includes('capture ci-dessous'));
  const toc = renommerLibelleCapture([{ lv: 2, id: 'a', text: LIBELLE_CAPTURE }, { lv: 2, id: 'b', text: 'Voir aussi' }]);
  assert.deepEqual(toc.map(t => t.text), [LIBELLE_TEXTE, 'Voir aussi']);
});

test('site publié : le texte officiel précède la capture sur chaque article de loi du recueil', () => {
  let avec = 0, sans = 0;
  for (const p of pagesArticles()) {
    const base = path.basename(p, '.html');
    const m = base.match(/^art-(\d+(?:-\d+)*)-([a-z]{3,6})(?![a-z])/);
    const html = fs.readFileSync(p, 'utf8');
    const declaree = (html.match(/<th>Loi<\/th><td>([^<]*)/) || [])[1]?.trim().toUpperCase();
    const tl = m && (texteArticle(declaree, m[1].replace(/-/g, '.')) || texteArticle(m[2].toUpperCase(), m[1].replace(/-/g, '.')));
    if (!tl) { assert.ok(!html.includes('class="texte-loi"'), `${base} : bloc sans texte extrait`); sans++; continue; }
    avec++;
    const debut = html.indexOf(`<div class="texte-loi" data-loi="${tl.loi}" data-article="${tl.numero}">`);
    assert.ok(debut >= 0, `${base} : texte officiel absent`);
    assert.equal(html.split('class="texte-loi"').length, 2, `${base} : bloc posé une seule fois`);
    const capture = html.indexOf('class="img-doc"');
    if (capture >= 0) assert.ok(debut < capture, `${base} : le texte doit précéder la capture`);
    assert.ok(!html.includes(LIBELLE_CAPTURE), `${base} : ancien libellé « ${LIBELLE_CAPTURE} »`);
    assert.ok(html.includes(`>${LIBELLE_TEXTE}</h2>`), `${base} : titre « ${LIBELLE_TEXTE} »`);
  }
  assert.ok(avec >= 2800, `${avec} articles avec texte`);
  assert.ok(sans <= 5, `${sans} articles sans texte`);
  // quelques textes vérifiés contre les captures
  const lire = (dossier, prefixe) => fs.readFileSync(path.join(DOCS, 'w/legislation', dossier, pageParPrefixe(dossier, prefixe)), 'utf8');
  assert.ok(lire('20-reglements/rsst', 'art-51-rsst').includes('<p>Interdiction de fumer : Il est interdit de fumer dans tout lieu où des vapeurs ou des gaz inflammables sont susceptibles d’être présents.</p>'));
  assert.ok(lire('20-reglements/rssm', 'art-83-rssm').includes('cloisons construites en matériaux imputrescibles'));
  assert.ok(lire('10-lois-principales/lmrsst', 'art-52-lmrsst').includes('<p class="alinea">2° par le remplacement, dans le deuxième alinéa, de « francs » par « entiers ».</p>'));
});

test('recherche : les mots du texte officiel sont indexés et l’extrait montre le texte', () => {
  const index = JSON.parse(fs.readFileSync(path.join(DOCS, 'assets/search-index.json'), 'utf8'));
  const mots = JSON.parse(fs.readFileSync(path.join(DOCS, 'assets/search-mots.json'), 'utf8'));
  const id = (dossier, prefixe) => { const u = 'w/legislation/' + dossier + '/' + pageParPrefixe(dossier, prefixe); const i = index.findIndex(e => e.u === u); assert.ok(i >= 0, u); return i; };
  const trouve = (mot, dossier, prefixe) => mots.m[mot] && decoderListe(mots.m[mot]).includes(id(dossier, prefixe));
  assert.ok(trouve('imputrescibles', '20-reglements/rssm', 'art-83-rssm'), 'imputrescibles → RSSM 83');
  assert.ok(trouve('inflammables', '20-reglements/rsst', 'art-51-rsst'), 'inflammables → RSST 51');
  assert.ok(trouve('cloueuse', '20-reglements/cstc', 'art-7-1-2-2-cstc'), 'cloueuse → CSTC 7.1.2.2');
  assert.match(index[id('20-reglements/rsst', 'art-51-rsst')].x, /^Interdiction de fumer : Il est interdit/);
  assert.deepEqual([...motsDePage('L’employeur doit prendre les mesures nécessaires ; 12 ; œuvre')], ['employeur', 'prendre', 'mesures', 'necessaires', '12', 'oeuvre']);
  assert.deepEqual(decoderListe(encoderListe([3, 40, 41])), [3, 40, 41]);
});
