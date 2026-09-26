import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { poserDansPage, lotDepuisSpec, trouverAncre, repereCapture, verifierSvg, verifierImage, blocMd } from '../poser_schemas.mjs';
import { appliquerRetouches } from '../retouches.mjs';

const outils = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.dirname(outils);
const docs = path.join(racine, 'docs');

const PAGE = [
  '<div class="page-body">',
  '<p>Premier paragraphe d&#39;introduction, assez long pour servir d’ancre.</p>',
  '<h3 id="section">Une section</h3>',
  '<p>Texte avant la capture de cours.</p>',
  '<span class="page-img"><a class="img-lien" href="../../files/images-wiki/pasted-image-20240101000000.png"><img src="../../files/images-wiki/pasted-image-20240101000000.png" alt="Illustration — X" loading="lazy"></a><span class="img-zoom">Toucher l\'image pour l\'agrandir</span></span>',
  '<p>Légende de la capture. Usage personnel.</p>',
  '<ul>', '<li>Première puce.</li>', '<li>Dernière puce de la liste, assez longue.</li>', '</ul>',
  '<p>Fin.</p>',
  '</div>',
].join('\n');
const schema = (fichier, ancre, extra = {}) => ({
  fichier, ancre, alt: 'Un schéma de démonstration qui montre un mécanisme simple, en deux parties.',
  legende: 'Légende prudente : densité > 1, sans chiffre inventé.', puces: ['Première partie.', 'Seconde partie < 1.'],
  sources: 'D’après {{lien:w/cible.html|la page cible}} et <a href="https://exemple.org/x">Exemple</a>.', ...extra,
});
const OPTS = { racine: '../../', dimsDe: () => ({ largeur: 480, hauteur: 500 }), titreDe: a => a === 'w/cible.html' ? 'Cible : l’exemple d\'essai' : null };

test('ancres : paragraphe, titre, début ou fragment de paragraphe, dernière puce ; erreurs explicites', () => {
  assert.ok(trouverAncre(PAGE, "Premier paragraphe d'introduction, assez long pour servir d'ancre."));
  assert.ok(trouverAncre(PAGE, 'Une section'));
  assert.ok(trouverAncre(PAGE, 'Premier paragraphe d’introduction, assez long'), 'début');
  assert.ok(trouverAncre(PAGE, 'Texte avant la capture'), 'fragment de 20 caractères et plus');
  const puce = trouverAncre(PAGE, 'Dernière puce de la liste');
  assert.equal(PAGE.slice(puce.fin - 5, puce.fin), '</ul>', 'après la liste entière');
  assert.throws(() => trouverAncre(PAGE, 'Première puce.'), /introuvable|pas la dernière/);
  assert.throws(() => trouverAncre(PAGE + '\n<p>Une section</p>', 'Une section'), /ambiguë/);
  assert.throws(() => trouverAncre(PAGE, 'Absent de la page, vraiment absent.'), /introuvable/);
  // le sommaire répète les titres : l'ancre reste le titre de la section
  const sommaire = '<nav class="toc" aria-label="Sommaire de la page"><ul><li class="toc-l3"><a href="#section">Une section</a></li></ul></nav>\n';
  const avecSommaire = sommaire + PAGE;
  const titre = trouverAncre(avecSommaire, 'Une section');
  assert.equal(avecSommaire.slice(titre.debut, titre.fin), '<h3 id="section">Une section</h3>');
});

test('pose : blocs après leur ancre, capture et légende retirées, liens résolus, repassage sans effet', () => {
  const spec = {
    page: 'w/x/page.html', note: { titre: 'Page', wiki: 'Wiki X' },
    schemas: [schema('wiki-x-a-v1.svg', 'Texte avant la capture de cours.', { remplace: 'pasted-image-20240101000000' }), schema('wiki-x-b-v1.svg', 'Dernière puce de la liste, assez longue.')],
    paragraphesRetires: ['Légende de la capture. Usage personnel.'],
    remplacementsHtml: [{ avant: '<p>Fin.</p>', apres: '<p>Fin corrigée.</p>' }],
  };
  const h = poserDansPage(PAGE, spec, OPTS);
  assert.ok(!h.includes('pasted-image-20240101000000') && !h.includes('Usage personnel'));
  assert.ok(h.includes('<p>Texte avant la capture de cours.</p>\n<div class="infographie infographie-compacte infographie-schema">'));
  assert.ok(h.includes('</ul>\n<div class="infographie infographie-compacte infographie-schema"><span class="page-img"><a class="img-lien" href="../../files/infographies/wiki-x-b-v1.svg">'));
  assert.ok(h.includes('alt="Un schéma de démonstration qui montre un mécanisme simple, en deux parties." width="480" height="500" loading="lazy"'));
  assert.ok(h.includes('densité &gt; 1') && h.includes('<li>Seconde partie &lt; 1.</li>'));
  assert.ok(h.includes('<a href="../../w/cible.html" title="Cible : l’exemple d\'essai">la page cible</a>'));
  assert.ok(h.includes('<a class="external" target="_blank" rel="noopener" href="https://exemple.org/x">Exemple</a>'));
  assert.ok(h.includes('<p>Fin corrigée.</p>'));
  assert.equal(poserDansPage(h, spec, OPTS), h, 'second passage : même page');
});

test('sources : un lien <a> autre qu’un lien externe https est refusé, jamais publié en texte échappé', () => {
  for (const lien of ['<a class="external" href="../../files/livre.pdf#page=159">livre</a>', '<a href="../../w/cible.html">cible</a>']) {
    const spec = { page: 'w/x/page.html', note: { titre: 'Page', wiki: 'Wiki X' },
      schemas: [schema('wiki-x-a-v1.svg', 'Texte avant la capture de cours.', { sources: `D’après ${lien}.` })] };
    assert.throws(() => poserDansPage(PAGE, spec, OPTS), /lien de source non pris en charge/, lien);
  }
});

test('lot : insertion puis retrait de la capture, légende retirée, et il s’applique à une note plausible', () => {
  const spec = {
    page: 'w/x/page.html', note: { titre: 'Page', wiki: 'Wiki X' },
    schemas: [schema('wiki-x-a-v1.svg', 'Texte avant la capture de cours.', { remplace: 'pasted-image-20240101000000' })],
    paragraphesRetires: ['Légende de la capture. Usage personnel.'],
    retouchesVault: [{ type: 'remplacer', ligneContenant: 'Fin', avant: 'Fin.', apres: 'Fin corrigée.' }],
  };
  const lot = lotDepuisSpec(spec, { date: '2026-09-25', revision: 'essai', portee: 'p', precautions: '' });
  assert.deepEqual(lot.retouches.map(r => r.type), ['insererApres', 'supprimerLigne', 'supprimerLigne', 'remplacer']);
  assert.equal(lot.retouches[1].ligneContenant, '20240101000000');
  assert.deepEqual(lot.medias, [{ depuis: 'docs/files/infographies/wiki-x-a-v1.svg', dossierVault: 'Infographies' }]);
  const note = ['# Page', '', "Premier paragraphe d'introduction, assez long pour servir d'ancre.", '', '### Une section', '', 'Texte avant la capture de cours.', '', '![[Pasted image 20240101000000.png]]', '', 'Légende de la capture. Usage personnel.', '', 'Fin.', ''].join('\n');
  const r = appliquerRetouches(note, lot.retouches, { resoudreLien: () => 'Cible' });
  assert.ok(r.ok, JSON.stringify(r.rapports));
  assert.ok(r.texte.includes('![[Infographies/wiki-x-a-v1.svg|') && !r.texte.includes('Pasted image') && !r.texte.includes('Usage personnel'));
  assert.ok(r.texte.includes('{{lien') === false && r.texte.includes('[[Cible|la page cible]]'));
  assert.ok(r.texte.includes('Fin corrigée.'));
  assert.ok(blocMd(spec.schemas[0]).includes('densité &gt; 1'), 'bloc de la note échappé comme la page');
});

test('repère de capture et contrôle des SVG', () => {
  assert.equal(repereCapture('pasted-image-20241214152919'), '20241214152919');
  assert.equal(repereCapture('../x/img-001.png'), 'img-001.png');
  const ok = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="500" viewBox="0 0 480 500" role="img"><title id="t">Un titre utile</title><desc id="d">Une description assez longue pour être utile au lecteur.</desc></svg>';
  assert.deepEqual(verifierSvg(ok, 'ok'), { largeur: 480, hauteur: 500 });
  assert.throws(() => verifierSvg(ok.replace('height="500"', 'height="400"'), 'x'), /width\/height/);
  assert.throws(() => verifierSvg(ok.replace('</svg>', '<image href="http://x/y.png"/></svg>'), 'x'), /ressource externe/);
});

// Une illustration fournie par l'auteur (PNG ou JPEG) se pose comme un schéma : même bloc, même lot ; seul
// le contrôle du fichier change, et ses dimensions, lues dans son en-tête, réservent sa place comme pour un SVG.
test('image PNG ou JPEG : signature, largeur et poids contrôlés, place réservée', () => {
  const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
  const png = l => Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), u32(13), Buffer.from('IHDR'), u32(l), u32(700), Buffer.from([8, 2, 0, 0, 0]), Buffer.alloc(4)]);
  const jpeg = l => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, ...Buffer.from('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, 0, 0,
    0xff, 0xc0, 0x00, 0x11, 0x08, 0x05, 0xb2, l >> 8, l & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, 0xff, 0xd9]);
  assert.deepEqual(verifierImage(png(600), 'a.png'), { largeur: 600, hauteur: 700 });
  assert.deepEqual(verifierImage(jpeg(1080), 'a.jpg'), { largeur: 1080, hauteur: 1458 }, 'dimensions lues dans l’en-tête de trame, après le segment JFIF');
  assert.deepEqual(verifierImage(jpeg(1080), 'a.JPEG'), { largeur: 1080, hauteur: 1458 });
  assert.throws(() => verifierImage(jpeg(400), 'a.jpg'), /480 au moins/);
  assert.throws(() => verifierImage(png(600), 'a.jpg'), /extension trompeuse/);
  assert.throws(() => verifierImage(png(600), 'a.gif'), /format non pris en charge/);
  assert.throws(() => verifierImage(Buffer.concat([jpeg(1080), Buffer.alloc(1.6e6)]), 'a.jpg'), /1,5 Mo/);
  const spec = { page: 'w/x.html', schemas: [schema('wiki-x-a-v2.jpg', 'Une section')] };
  const h = poserDansPage(PAGE, spec, { ...OPTS, dimsDe: () => verifierImage(jpeg(1080), 'wiki-x-a-v2.jpg') });
  assert.ok(h.includes('<h3 id="section">Une section</h3>\n<div class="infographie infographie-compacte infographie-schema"><span class="page-img"><a class="img-lien" href="../../files/infographies/wiki-x-a-v2.jpg"><img src="../../files/infographies/wiki-x-a-v2.jpg" alt="Un schéma de démonstration qui montre un mécanisme simple, en deux parties." width="1080" height="1458" loading="lazy"></a>'));
  assert.ok(blocMd(spec.schemas[0]).includes('![[Infographies/wiki-x-a-v2.jpg|Un schéma de démonstration'));
});

// Style retenu par Frank le 26 septembre 2026 : dessin conçu sur fond sombre, que le thème sombre n'inverse pas.
test('schéma sur fond sombre : classe « infographie-sombre » dans la page et dans la note, jamais inversé', () => {
  const spec = { page: 'w/x.html', schemas: [schema('wiki-x-a-v2.svg', 'Une section', { sombre: true }), schema('wiki-x-b-v2.svg', 'Fin.')] };
  const h = poserDansPage(PAGE, spec, OPTS);
  assert.ok(h.includes('<h3 id="section">Une section</h3>\n<div class="infographie infographie-compacte infographie-schema infographie-sombre"><span class="page-img"><a class="img-lien" href="../../files/infographies/wiki-x-a-v2.svg">'));
  assert.ok(h.includes('<p>Fin.</p>\n<div class="infographie infographie-compacte infographie-schema"><span class="page-img">'), 'sans l’option, rien ne change');
  assert.ok(blocMd(spec.schemas[0]).startsWith('<div class="infographie infographie-compacte infographie-schema infographie-sombre">\n\n![[Infographies/wiki-x-a-v2.svg|'));
  assert.equal(poserDansPage(h, spec, OPTS), h, 'repassage sans effet');
  const css = fs.readFileSync(path.join(outils, 'style.css'), 'utf8');
  const regle = css.match(/([^}]*)\{ filter: none !important; \}/g).find(r => r.includes('infographie-sombre'));
  for (const sel of ['.infographie-schema.infographie-sombre .page-img img', ':root:not([data-theme="light"]):not([data-theme="auto"]) .infographie-schema.infographie-sombre .page-img img', ':root[data-theme="auto"] .infographie-schema.infographie-sombre .page-img img'])
    assert.ok(regle.includes(sel), 'la règle couvre : ' + sel);
});

test('versions antérieures en liste : la page porte la plus récente présente, le lot les connaît toutes', () => {
  const v2 = poserDansPage(PAGE, { page: 'w/x.html', schemas: [schema('wiki-x-a-v2.svg', 'Une section')] }, OPTS);
  const spec = { page: 'w/x.html', note: { titre: 'X', wiki: 'W' }, schemas: [schema('wiki-x-a-v3.svg', 'Une section', { remplaceSchema: ['wiki-x-a-v2.svg', 'wiki-x-a-v1.svg'] })] };
  const h = poserDansPage(v2, spec, OPTS);
  assert.ok(!h.includes('wiki-x-a-v2.svg') && h.includes('<h3 id="section">Une section</h3>\n<div class="infographie infographie-compacte infographie-schema"><span class="page-img"><a class="img-lien" href="../../files/infographies/wiki-x-a-v3.svg">'));
  assert.equal(h.split('infographie-schema').length - 1, 1, 'un seul bloc');
  const v1 = poserDansPage(PAGE, { page: 'w/x.html', schemas: [schema('wiki-x-a-v1.svg', 'Une section')] }, OPTS);
  assert.ok(poserDansPage(v1, spec, OPTS).includes('wiki-x-a-v3.svg') && !poserDansPage(v1, spec, OPTS).includes('wiki-x-a-v1.svg'), 'page restée en v1 : remplacée aussi');
  assert.throws(() => poserDansPage(PAGE, spec, OPTS), /absent de la page : wiki-x-a-v2\.svg ou wiki-x-a-v1\.svg/);
  const lot = lotDepuisSpec(spec, { date: 'd', revision: 'r', portee: 'p', precautions: '' });
  assert.deepEqual(lot.retouches[0].ancien, ['Infographies/wiki-x-a-v2.svg', 'Infographies/wiki-x-a-v1.svg']);
  assert.equal(lotDepuisSpec({ ...spec, schemas: [{ ...spec.schemas[0], remplaceSchema: 'wiki-x-a-v2.svg' }] }, { date: 'd', revision: 'r', portee: 'p', precautions: '' }).retouches[0].ancien, 'Infographies/wiki-x-a-v2.svg', 'une seule version : chaîne, comme avant');
});

// Rejoue la pose d'Espaces clos (faite à la main le 25 septembre 2026) : l'outil doit rendre la page
// publiée à l'octet près, depuis la page d'avant les schémas (historique Git requis).
const AVANT = 'f5df88ca47';
let pageAvant = null;
try { pageAvant = execFileSync('git', ['show', AVANT + ':docs/w/securite/espaces-clos.html'], { cwd: racine, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { /* clone sans cet historique */ }
test('équivalence : Espaces clos reposée par l’outil, à l’octet près', { skip: !pageAvant && 'historique Git absent' }, () => {
  const lot = JSON.parse(fs.readFileSync(path.join(racine, 'content-updates', '2026-09-25-espaces-clos-schemas.json'), 'utf8'));
  const sup = Object.fromEntries(lot.retouches.filter(r => r.type === 'supprimerLigne').map(r => [r.marqueur, r.ligneContenant]));
  const dec = s => s.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  const schemas = lot.retouches.filter(r => r.type === 'insererApres' && r.marqueur.startsWith('Infographies/')).map(r => ({
    fichier: r.marqueur.slice('Infographies/'.length), ancre: r.ligneContenant,
    remplace: sup[r.marqueur] ? 'pasted-image-' + sup[r.marqueur] : null,
    alt: r.bloc.match(/!\[\[Infographies\/[^|]+\|([^\]]+)\]\]/)[1],
    legende: dec(r.bloc.match(/<p class="infographie-legende">([\s\S]*?)<\/p>/)[1]),
    puces: [...r.bloc.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => dec(m[1])),
    sources: r.bloc.match(/<p class="infographie-sources">([\s\S]*?)<\/p>/)[1],
  }));
  const titreDe = a => fs.readFileSync(path.join(docs, a), 'utf8').match(/<h1 class="page-title">([\s\S]*?)<\/h1>/)[1].replace(/&#39;/g, "'").trim();
  const dimsDe = f => verifierSvg(fs.readFileSync(path.join(docs, 'files/infographies', f), 'utf8'), f);
  const obtenu = poserDansPage(pageAvant, { page: 'w/securite/espaces-clos.html', schemas }, { racine: '../../', dimsDe, titreDe });
  assert.equal(obtenu, fs.readFileSync(path.join(docs, 'w/securite/espaces-clos.html'), 'utf8'));
});

test('sans ancre : le schéma prend la place exacte de la capture, dans la page et dans la note', () => {
  const page = '<h4 id="t">Titre</h4>\n<table><tr><td>x</td></tr></table>\n<span class="page-img"><a class="img-lien" href="../../files/sst-images/pasted-image-20240906205917.png"><img src="x" alt="y" loading="lazy"></a><span class="img-zoom">Toucher</span></span>\n<p>Suite.</p>';
  const spec = { page: 'w/x/p.html', note: { titre: 'P' }, schemas: [schema('wiki-x-sur-place-v1.svg', null, { remplace: 'pasted-image-20240906205917' })] };
  const h = poserDansPage(page, spec, OPTS);
  assert.ok(h.includes('</table>\n<div class="infographie infographie-compacte infographie-schema">'), 'sous le tableau, à la place de la capture');
  assert.ok(h.includes('</div>\n<p>Suite.</p>') && !h.includes('pasted-image-20240906205917'));
  assert.equal(poserDansPage(h, spec, OPTS), h);
  const lot = lotDepuisSpec(spec, { date: 'd', revision: 'r', portee: 'p', precautions: '' });
  const note = ['#### Titre', '', '| a |', '|---|', '| x |', '', '![[Pasted image 20240906205917.png]]', '', 'Suite.', ''].join('\n');
  const r = appliquerRetouches(note, lot.retouches, { resoudreLien: () => 'Cible' });
  assert.ok(r.ok, JSON.stringify(r.rapports));
  assert.match(r.texte, /\| x \|\n\n<div class="infographie[^\n]*\n\n!\[\[Infographies\/wiki-x-sur-place-v1\.svg\|/, 'bloc à la place de la capture');
  assert.ok(!r.texte.includes('Pasted image') && r.texte.includes('</div>\n\nSuite.'));
  assert.deepEqual(appliquerRetouches(r.texte, lot.retouches, { resoudreLien: () => 'Cible' }).rapports.map(x => x.statut), ['déjà faite', 'déjà faite']);
});

test('correction de texte : un {{lien:…}} devient un lien avec la racine de la page, repassage sans effet', () => {
  const spec = { schemas: [], remplacementsHtml: [{ avant: '<p>Texte avant la capture de cours.</p>', apres: '<p>Voir {{lien:w/cible.html|la cible}}.</p>' }] };
  const w = poserDansPage(PAGE, spec, OPTS);
  assert.ok(w.includes('<p>Voir <a href="../../w/cible.html" title="Cible : l’exemple d\'essai">la cible</a>.</p>'));
  assert.equal(poserDansPage(w, spec, OPTS), w, 'correction déjà faite');
  const g = poserDansPage(PAGE, spec, { ...OPTS, racine: '../../../', hrefDe: a => '../../../' + a });
  assert.ok(g.includes('<a href="../../../w/cible.html"'), 'copie encadrement : racine plus profonde');
});

test('correction par motif : même correction sur une page et sa copie qui diffèrent d’un lien', () => {
  const spec = { schemas: [], remplacementsHtml: [{ motif: '<li>Première puce\\.(?: <a [^>]*>note</a>)?</li>', apres: '<li>Puce corrigée.</li>' }] };
  const lie = PAGE.replace('<li>Première puce.</li>', '<li>Première puce. <a href="x.html">note</a></li>');
  for (const p of [PAGE, lie]) {
    const r = poserDansPage(p, spec, OPTS);
    assert.ok(r.includes('<li>Puce corrigée.</li>') && !r.includes('Première puce'));
    assert.equal(poserDansPage(r, spec, OPTS), r, 'repassage sans effet');
  }
});

test('nouvelle version d’un schéma publié : elle prend la place de l’ancienne, dans la page et dans la note', () => {
  const v1 = { page: 'w/x/page.html', note: { titre: 'Page', wiki: 'Wiki X' }, schemas: [schema('wiki-x-a-v1.svg', 'Une section')] };
  const avecV1 = poserDansPage(PAGE, v1, OPTS);
  const v2 = { ...v1, schemas: [schema('wiki-x-a-v2.svg', 'Une section', { remplaceSchema: 'wiki-x-a-v1.svg', legende: 'Nouvelle légende.' })] };
  const h = poserDansPage(avecV1, v2, OPTS);
  assert.ok(!h.includes('wiki-x-a-v1.svg') && h.includes('<h3 id="section">Une section</h3>\n<div class="infographie infographie-compacte infographie-schema"><span class="page-img"><a class="img-lien" href="../../files/infographies/wiki-x-a-v2.svg">'));
  assert.equal(h.split('infographie-schema').length - 1, 1, 'un seul bloc');
  assert.equal(poserDansPage(h, v2, OPTS), h, 'second passage : même page');
  assert.throws(() => poserDansPage(PAGE, v2, OPTS), /schéma à remplacer absent/);
  // la note : bloc v1 remplacé ; note neuve : bloc inséré sous l'ancre
  const lot1 = lotDepuisSpec(v1, { date: 'd', revision: 'r', portee: 'p', precautions: '' });
  const lot2 = lotDepuisSpec(v2, { date: 'd', revision: 'r', portee: 'p', precautions: '' });
  assert.deepEqual(lot2.retouches.map(r => [r.type, r.ancien]), [['remplacerBloc', 'Infographies/wiki-x-a-v1.svg']]);
  assert.deepEqual(lot2.medias, [{ depuis: 'docs/files/infographies/wiki-x-a-v2.svg', dossierVault: 'Infographies' }]);
  const note = ['# Page', '', '### Une section', '', 'Texte avant la capture de cours.', ''].join('\n');
  const opts = { resoudreLien: () => 'Cible' };
  const noteV1 = appliquerRetouches(note, lot1.retouches, opts).texte;
  const depuisV1 = appliquerRetouches(noteV1, lot2.retouches, opts);
  const depuisRien = appliquerRetouches(note, lot2.retouches, opts);
  assert.ok(depuisV1.ok && depuisRien.ok);
  assert.equal(depuisV1.texte, depuisRien.texte, 'même note, qu’elle ait reçu la v1 ou non');
  assert.ok(depuisV1.texte.includes('Nouvelle légende.') && !depuisV1.texte.includes('wiki-x-a-v1.svg'));
});

test('nouvelle version d’un schéma qui avait remplacé une capture : capture et légende retirées une seule fois', () => {
  const v1 = { page: 'w/x/page.html', note: { titre: 'Page' }, schemas: [schema('wiki-x-a-v1.svg', null, { remplace: 'pasted-image-20240101000000' })], paragraphesRetires: ['Légende de la capture. Usage personnel.'] };
  const v2 = { ...v1, schemas: [schema('wiki-x-a-v2.svg', null, { remplace: 'pasted-image-20240101000000', remplaceSchema: 'wiki-x-a-v1.svg' })] };
  const h = poserDansPage(poserDansPage(PAGE, v1, OPTS), v2, OPTS);
  assert.ok(h.includes('wiki-x-a-v2.svg') && !h.includes('wiki-x-a-v1.svg') && !h.includes('pasted-image-20240101000000'));
  const lot = s => lotDepuisSpec(s, { date: 'd', revision: 'r', portee: 'p', precautions: '' });
  const note = ['### Une section', '', 'Texte avant la capture de cours.', '', '![[Pasted image 20240101000000.png]]', '', 'Légende de la capture. Usage personnel.', '', 'Fin.', ''].join('\n');
  const opts = { resoudreLien: () => 'Cible' };
  const noteV1 = appliquerRetouches(note, lot(v1).retouches, opts).texte;
  const depuisV1 = appliquerRetouches(noteV1, lot(v2).retouches, opts);
  const depuisRien = appliquerRetouches(note, lot(v2).retouches, opts);
  assert.ok(depuisV1.ok, JSON.stringify(depuisV1.rapports));
  assert.ok(depuisRien.ok, JSON.stringify(depuisRien.rapports));
  assert.equal(depuisV1.texte, depuisRien.texte);
  assert.deepEqual(appliquerRetouches(depuisV1.texte, lot(v2).retouches, opts).rapports.map(x => x.statut), ['déjà faite', 'déjà faite', 'déjà faite']);
});
