import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { poserDansPage, lotDepuisSpec, trouverAncre, repereCapture, verifierSvg, blocMd } from '../poser_schemas.mjs';
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
