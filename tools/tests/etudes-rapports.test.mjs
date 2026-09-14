import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Études et rapports (14 septembre 2026) : les fiches de sources quittent les volets de l'accueil
// d'un wiki pour une page « Études et rapports », classées par thème ; le titre de chaque volet
// mène à la page de son thème. Contrôles sur le site publié : rien n'est perdu.
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = path.join(R, 'docs');
const WIKIS = ['ergonomie', 'hygiene', 'toxicologie', 'securite', 'droit-travail', 'psychosocial'];
const estEtude = (t) => /\((?:19|20)\d{2}[a-z]?\)/.test(t) || /^Analyse\s*[-–]/i.test(t);
const texte = (h) => h.replace(/<[^>]+>/g, '').replace(/&#39;/g, '’').replace(/&amp;/g, '&').trim();
const lire = (rel) => fs.readFileSync(path.join(DOCS, rel), 'utf8');
const volets = (html) => [...html.matchAll(/<details class="accueil-theme" id="([^"]*)" open><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
  .map(([, id, summary, corps]) => ({ id, summary, corps }));

// pages d'article (« notion ») d'un wiki, à plat sous w/<slug>/
function notionsDuWiki(slug) {
  return fs.readdirSync(path.join(DOCS, 'w', slug))
    .filter(f => f.endsWith('.html'))
    .map(f => ({ f, html: lire(`w/${slug}/${f}`) }))
    .filter(x => x.html.includes('Un article du wiki'))
    .map(x => ({ ...x, titre: texte((x.html.match(/<h1 class="page-title">([\s\S]*?)<\/h1>/) || [])[1] || '') }));
}

test('accueils : les volets ne listent que des notions, le titre mène à la page du thème', () => {
  for (const slug of WIKIS) {
    const rel = `w/${slug}/index.html`;
    if (!fs.existsSync(path.join(DOCS, rel))) continue;
    const html = lire(rel);
    const v = volets(html);
    assert.ok(v.length, `${slug} : des volets de thème`);
    assert.ok(!html.includes('<h4>Études et rapports</h4>') && !html.includes('<h4>Notions</h4>'), `${slug} : plus de sous-titres dans les volets`);
    for (const { id, summary, corps } of v) {
      const page = (corps.match(/<a class="accueil-theme-page" href="([^"]*)">Page du thème →<\/a>/) || [])[1];
      assert.ok(page, `${slug} ${id} : lien « Page du thème »`);
      const lienTitre = summary.match(/<span class="accueil-theme-titre"><a href="([^"]*)">([\s\S]*?)<\/a><\/span>/);
      assert.ok(lienTitre, `${slug} ${id} : titre cliquable`);
      assert.equal(lienTitre[1], page, `${slug} ${id} : le titre mène à la page du thème`);
      assert.ok(fs.existsSync(path.join(DOCS, 'w', slug, lienTitre[1].replace(/^(\.\.\/)+/, '').replace(`w/${slug}/`, ''))), `${slug} ${id} : page du thème publiée`);
      const items = [...corps.matchAll(/<li><a href="[^"]*">([\s\S]*?)<\/a><\/li>/g)].map(m => texte(m[1]));
      const compte = Number((summary.match(/<small>(\d+) articles?<\/small>/) || [])[1]);
      assert.equal(compte, items.length, `${slug} ${id} : le compte annoncé est celui des articles listés`);
      for (const t of items) assert.ok(!estEtude(t), `${slug} ${id} : « ${t} » est une étude, elle ne va plus dans le volet`);
    }
  }
});

test('page « Études et rapports » : une par wiki qui en a, aucune étude perdue', () => {
  for (const slug of WIKIS) {
    const rel = `w/${slug}/etudes-et-rapports.html`;
    const etudes = notionsDuWiki(slug).filter(x => estEtude(x.titre));
    if (!etudes.length) { assert.ok(!fs.existsSync(path.join(DOCS, rel)), `${slug} : pas d’étude, pas de page`); continue; }
    assert.ok(fs.existsSync(path.join(DOCS, rel)), `${slug} : page « Études et rapports »`);
    const html = lire(rel);
    assert.match(html, /<h1 class="page-title">Études et rapports<\/h1>/);
    assert.match(html, new RegExp(`<div class="page-sub">${etudes.length} pages d'analyse de sources`), `${slug} : le compte annoncé`);
    const cibles = new Set([...html.matchAll(/<ul class="cat-pages">[\s\S]*?<\/ul>/g)].flatMap(m => [...m[0].matchAll(/href="([^"]*)"/g)].map(x => x[1].replace(/^(\.\.\/)+/, ''))));
    for (const e of etudes) assert.ok(cibles.has(`w/${slug}/${e.f}`), `${slug} : « ${e.titre} » figure sur la page`);
    for (const c of cibles) assert.ok(fs.existsSync(path.join(DOCS, c)), `${slug} : cible publiée — ${c}`);
    // groupée par thème, avec un groupe « Sans thème » pour celles qui n'en ont pas
    const groupes = [...html.matchAll(/<h2 id="([^"]*)">([\s\S]*?) <small>\((\d+)\)<\/small><\/h2>/g)];
    assert.ok(groupes.length, `${slug} : groupes par thème`);
    for (const [, id] of groupes) assert.ok(id === 'sans-theme' || lire(`w/${slug}/index.html`).includes(`id="${id}"`), `${slug} : le groupe ${id} est un thème du wiki`);
    const total = groupes.reduce((n, g) => n + Number(g[3]), 0);
    const nbLiens = [...html.matchAll(/<ul class="cat-pages">([\s\S]*?)<\/ul>/g)].reduce((n, m) => n + (m[1].match(/<li>/g) || []).length, 0);
    assert.equal(total, nbLiens, `${slug} : les comptes des groupes valent les liens listés`);
  }
});

test('la page est joignable : barre d’index de l’accueil et barre latérale du wiki', () => {
  const slug = 'psychosocial';
  const accueil = lire(`w/${slug}/index.html`);
  const barre = accueil.match(/<nav class="accueil-index"[\s\S]*?<\/nav>/)[0];
  assert.match(barre, /etudes-et-rapports\.html">Études et rapports<\/a>/, 'barre d’index de l’accueil');
  let avec = 0, sans = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const h = fs.readFileSync(p, 'utf8');
      if (!h.includes(`w/${slug}/index-alphabetique.html">Index alphabétique`)) continue;
      if (h.includes(`w/${slug}/etudes-et-rapports.html">Études et rapports`)) avec++; else sans.push(path.relative(DOCS, p));
    }
  })(path.join(DOCS, 'w', slug));
  assert.equal(sans.length, 0, `barres latérales sans le lien : ${sans.slice(0, 3).join(', ')}`);
  assert.ok(avec > 300, `${avec} barres latérales mènent à la page`);
});

test('la page d’un thème continue de lister ses études', () => {
  const html = lire('w/psychosocial/theme/communication.html');
  assert.match(html, /<h2>Articles de ce thème \(\d+\)<\/h2>/);
  const liens = [...html.matchAll(/<ul class="cat-pages">([\s\S]*?)<\/ul>/g)].map(m => m[1]).join('');
  assert.ok(/analyse-fruhen-et-al-2023\.html/.test(liens), 'l’étude Fruhen et al. (2023) reste sur la page du thème');
});
