import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import {
  extrairePage, reecrireLiens, lierTelephones, lireMarkdown, validerQuestions, genererEspaceTravailleurs, chargerConf, texteDe,
} from '../espace_travailleurs.mjs';
import { verifierEspace } from '../travailleurs/verifier.mjs';
import { genererListeHorsLigne } from '../pwa.mjs';
import { SCRIPT_LIENS_404, scriptRedirection } from '../redirections.mjs';

const OUTILS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.resolve(OUTILS, '..', 'docs');
const ESPACE = path.join(DOCS, 'travailleurs');

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

test('reecrireLiens : espace → espace, reste du wiki → texte, externe → nouvel onglet, médias recalculés', () => {
  const cible = (c) => ({ 'w/droit-travail/reclamation-cnesst.html': 'reclamation-cnesst', 'w/psychosocial/theme/retour-au-travail.html': 'ton-retour-au-travail' })[c] || '';
  const corps = `<p><a href="../../w/droit-travail/reclamation-cnesst.html#delais" title="t">ta réclamation</a>,
<a href="../../w/psychosocial/theme/retour-au-travail.html">retour</a>, <a href="../../g/index.html">encadrement</a>,
<a href="../../w/securite/demarrage-rapide-direction-et-rh.html">RH</a>, <a href="#sec">ancre</a>, <a href="tel:+18448380808">tél.</a>,
<a href="https://www.cnesst.gouv.qc.ca/">CNESST</a>, <a href="https://frankyray21.github.io/wiki-sst-mines/w/hygiene/bruit.html">bruit</a></p>
<p><a href="../../index.html">← Accueil</a></p><img src="../../files/infographies/x.svg" srcset="../../files/a.png 1x, ../../files/b.png 2x">
<p><span class="interne-inline" title="x">Toutes les pages travailleurs <small>(source non publiée)</small></span></p>`;
  const { html, coupes } = reecrireLiens(corps, 'w/droit-travail/demarrage-rapide-travailleur.html', cible);
  assert.match(html, /<a href="reclamation-cnesst\.html#delais">ta réclamation<\/a>/);
  assert.match(html, /<a href="ton-retour-au-travail\.html">retour<\/a>/);
  assert.match(html, /<span class="et-hors">encadrement<\/span>/);
  assert.match(html, /<span class="et-hors">RH<\/span>/);
  assert.match(html, /<span class="et-hors">bruit<\/span>/, 'adresse absolue du wiki traitée comme interne');
  assert.match(html, /href="#sec"/);
  assert.match(html, /href="tel:\+18448380808"/);
  assert.match(html, /href="https:\/\/www\.cnesst\.gouv\.qc\.ca\/" target="_blank" rel="noopener noreferrer"/);
  assert.ok(!html.includes('Accueil'), 'paragraphe de navigation retiré');
  assert.ok(!html.includes('source non publiée') && !html.includes('Toutes les pages travailleurs'), 'mention interne retirée');
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

test('lireMarkdown : frontmatter, encadrés, et aucun lien hors de l’espace', () => {
  const slugs = new Set(['a', 'b']);
  const md = `---\ntitre: "Titre"\nresume: "Résumé."\nrevision: 2026-11-02\nsources:\n  - "LATMP, art. 32"\n---\n\nTexte vers [b](b.html).\n\n> [!warning] Attention\n> Un **délai** de 30 jours.\n\nFin.`;
  const p = lireMarkdown(md, slugs);
  assert.equal(p.titre, 'Titre');
  assert.equal(p.revision, '2026-11-02');
  assert.deepEqual(p.sources, ['LATMP, art. 32']);
  assert.match(p.corps, /<div class="callout callout-warning"><div class="callout-title"><span class="callout-icon">⚠️<\/span>Attention<\/div><div class="callout-body"><p>Un <strong>délai<\/strong> de 30 jours\.<\/p>/);
  assert.match(p.corps, /<a href="b\.html">b<\/a>/);
  assert.throws(() => lireMarkdown(md.replace('(b.html)', '(../w/droit-travail/x.html)'), slugs), /liens hors de l'espace/);
  assert.throws(() => lireMarkdown(md.replace('(b.html)', '(https://exemple.com)'), slugs), /liens hors de l'espace/);
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

// ---------- l'espace généré ----------

test('la configuration est complète : chaque page existe, a ses questions, et le relais est en https', () => {
  const conf = chargerConf(OUTILS);
  assert.ok(/^https:\/\//.test(conf.relais), 'relais configuré');
  assert.equal(conf.seuil, 80);
  const pages = conf.sections.flatMap(s => s.pages);
  assert.ok(pages.length >= 29, `${pages.length} pages`);
  for (const p of pages) {
    if (p.source) assert.ok(fs.existsSync(path.join(DOCS, p.source)), 'page du wiki présente : ' + p.source);
    else assert.ok(fs.existsSync(path.join(OUTILS, 'travailleurs', p.fichier)), 'page écrite présente : ' + p.fichier);
    assert.ok(fs.existsSync(path.join(OUTILS, 'travailleurs', 'questions', p.slug + '.json')), 'questions : ' + p.slug);
  }
  const etiquettes = conf.sections.map(s => s.etiquette).sort();
  assert.deepEqual(etiquettes, ['Après ta blessure', 'Prendre soin de toi', 'Préparer ton retour', 'Travailler en sécurité'],
    'sections = options du champ Section de la table Airtable et liste SECTIONS du relais');
  const relais = fs.readFileSync(path.join(OUTILS, 'attestations-worker', 'worker.js'), 'utf8');
  for (const e of etiquettes) assert.ok(relais.includes(`'${e}'`), 'le relais accepte la section ' + e);
});

test('contenu : chaque citation des explications se retrouve dans la page lue, et les types exigés sont là', () => {
  const r = verifierEspace(DOCS, { outils: OUTILS });
  assert.deepEqual(r.erreurs, []);
  assert.ok(r.questions >= 150, `${r.questions} questions`);
});

test('l’espace généré est fermé : aucun lien vers une autre page du site', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'espace-'));
  // copie légère de docs/ : seules les pages sources et les médias cités comptent
  const conf = chargerConf(OUTILS);
  for (const p of conf.sections.flatMap(s => s.pages).filter(p => p.source)) {
    fs.mkdirSync(path.dirname(path.join(tmp, p.source)), { recursive: true });
    fs.copyFileSync(path.join(DOCS, p.source), path.join(tmp, p.source));
  }
  const r = genererEspaceTravailleurs(tmp, { outils: OUTILS, journal: { log() {} } });
  const dossier = path.join(tmp, 'travailleurs');
  const fichiers = fs.readdirSync(dossier).filter(f => f.endsWith('.html'));
  assert.equal(fichiers.length, r.pages + 1, 'une page par lecture, plus l’accueil');
  const permis = new Set(fichiers);
  for (const f of fichiers) {
    const html = fs.readFileSync(path.join(dossier, f), 'utf8');
    for (const [, attr, v] of html.matchAll(/\s(href|src|action|formaction|srcset|poster)="([^"]*)"/g)) {
      if (/^(#|tel:|mailto:|data:)/.test(v)) continue;
      if (/^https:\/\//.test(v)) {
        assert.ok(!/frankyray21\.github\.io/.test(v), `${f} : lien absolu vers le wiki ${v}`);
        continue;
      }
      const chemin = v.split(/[?#]/)[0];
      if (attr === 'href' && permis.has(chemin)) continue;
      if (chemin === '../assets/style.css' || chemin.startsWith('assets/travailleurs.')) continue;
      assert.ok(attr !== 'href' && chemin.startsWith('../files/'), `${f} : ${attr}="${v}" sort de l’espace`);
    }
    assert.ok(!/app\.js|search-index|recherche\.html|graphe|g\/index\.html|\/w\//.test(html.replace(/\.\.\/files\/[^"]*/g, '')), `${f} : aucune ressource du wiki (script, recherche, graphe, encadrement)`);
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  }
  const accueil = fs.readFileSync(path.join(dossier, 'index.html'), 'utf8');
  assert.equal((accueil.match(/class="et-carte"/g) || []).length, r.pages);
  assert.match(accueil, /href="tel:911"/);
  assert.match(accueil, /href="ou-appeler\.html"/);
});

test('une page de lecture embarque ses questions, son temps estimé et l’adresse du relais', () => {
  const html = fs.readFileSync(path.join(ESPACE, 'reclamation-cnesst.html'), 'utf8');
  const donnees = JSON.parse(html.match(/<script type="application\/json" id="donnees-questions">([\s\S]*?)<\/script>/)[1]);
  assert.equal(donnees.slug, 'reclamation-cnesst');
  assert.ok(donnees.questions.length >= 5);
  assert.match(html, /data-relais="https:\/\/attestations-travailleurs\.frankyray-21\.workers\.dev"/);
  assert.match(html, /data-seuil="80"/);
  assert.match(html, /data-section="Après ta blessure"/);
  const minutes = Number(html.match(/data-minutes="(\d+)"/)[1]);
  const mots = Number(html.match(/data-mots="(\d+)"/)[1]);
  assert.equal(minutes, Math.ceil(mots / 180), '180 mots par minute');
  assert.match(html, /Lecture estimée ≈ \d+ min/);
  assert.ok(!html.includes('</script><'), 'pas de fermeture de script dans les données');
});

test('une page qui disparaît du site arrête la génération ; une correction périmée aussi', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'espace-vide-'));
  assert.throws(() => genererEspaceTravailleurs(tmp, { outils: OUTILS, journal: { log() {} } }), /page\(s\) introuvable\(s\)/);
  // outils factices : une page, une correction qui ne s'applique pas
  const outils = fs.mkdtempSync(path.join(os.tmpdir(), 'outils-'));
  fs.mkdirSync(path.join(outils, 'travailleurs', 'questions'), { recursive: true });
  for (const f of ['travailleurs.js', 'travailleurs.css']) fs.writeFileSync(path.join(outils, 'travailleurs', f), '');
  fs.writeFileSync(path.join(outils, 'travailleurs', 'pages.json'), JSON.stringify({ titre: 'E', sousTitre: 'S', seuil: 80, relais: '',
    sections: [{ id: 's', titre: 'S', etiquette: 'Après ta blessure', pages: [{ slug: 'p', source: 'w/p.html' }] }] }));
  fs.mkdirSync(path.join(tmp, 'w'));
  fs.writeFileSync(path.join(tmp, 'w', 'p.html'), '<h1 class="page-title">P</h1><div class="page-body"><p>Texte vrai.</p></div>');
  fs.writeFileSync(path.join(outils, 'travailleurs', 'corrections.json'), JSON.stringify({ corrections: [{ page: 'p', avant: 'Texte faux.', apres: 'x' }] }));
  assert.throws(() => genererEspaceTravailleurs(tmp, { outils, journal: { log() {} } }), /apparaît 0 fois/);
  fs.writeFileSync(path.join(outils, 'travailleurs', 'corrections.json'), JSON.stringify({ corrections: [{ page: 'p', avant: 'Texte vrai.', apres: 'Texte corrigé.' }] }));
  genererEspaceTravailleurs(tmp, { outils, journal: { log() {} } });
  assert.match(fs.readFileSync(path.join(tmp, 'travailleurs', 'p.html'), 'utf8'), /Texte corrigé\./);
});

test('les corrections de l’espace s’appliquent toutes aux pages du wiki publiées', () => {
  const f = path.join(OUTILS, 'travailleurs', 'corrections.json');
  if (!fs.existsSync(f)) return;
  const { corrections } = JSON.parse(fs.readFileSync(f, 'utf8'));
  const conf = chargerConf(OUTILS);
  const sources = new Map(conf.sections.flatMap(s => s.pages).map(p => [p.slug, p.source]));
  for (const c of corrections) {
    const html = fs.readFileSync(path.join(DOCS, sources.get(c.page)), 'utf8');
    assert.equal(html.split(c.avant).length - 1, 1, `${c.page} : passage « ${c.avant.slice(0, 60)} » présent une fois`);
    assert.ok(c.raison && c.raison.length > 10, `${c.page} : correction justifiée`);
    assert.ok(!texteDe(c.apres).includes('source non publiée'));
  }
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
  // l'ancienne redirection « travailleurs.html → portail » ne capture pas le dossier de l'espace
  let remplace = null;
  vm.runInNewContext(scriptRedirection({}), { location: { pathname: '/wiki-sst-mines/travailleurs/x.html', search: '', hash: '', replace(u) { remplace = u; } } });
  assert.equal(remplace, null);
  const page404 = fs.readFileSync(path.join(DOCS, '404.html'), 'utf8');
  assert.ok(page404.includes('suite-recherche') && page404.includes("travailleurs/index.html"), '404.html publiée à jour');
});
