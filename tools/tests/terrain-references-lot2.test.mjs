import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as yaml from 'js-yaml';
import { analyserQualite } from '../qualite.mjs';
import { cleAncre } from '../editorial.mjs';

const lot = JSON.parse(fs.readFileSync(new URL('../../content-updates/2026-09-06-terrain-references-lot2.json', import.meta.url), 'utf8'));
const anciensTitres = [
  [
    "Travailler avec des solvants en mine",
    "À quoi sert cette page",
    "Où tu en croises en mine",
    "Trois signes que tu en respires trop",
    "Trois pièges qui passent souvent inaperçus",
    "Le piège de la peau",
    "Le piège de l'odeur",
    "Le piège du « 5 minutes sans masque »",
    "Gestes qui font une différence",
    "Si tu es exposé fortement",
    "À éviter",
    "À qui tu peux en parler"
  ],
  [
    "Sommeil et quart de nuit (pour toi)",
    "À quoi sert cette page",
    "Contenu",
    "Points de vigilance",
    "Application terrain",
    "À éviter",
    "Pour aller plus loin"
  ],
  [
    "Obligations de l'employeur",
    "Vue d'ensemble",
    "Articles couverts",
    "Articles de loi pertinents",
    "Application terrain",
    "Pour aller plus loin"
  ]
];
const anciensFrontmatters = [
  "tags:\n  - wiki\n  - toxicologie\n  - travailleur\n  - solvants\ntheme: \"[[Toxicologie industrielle]]\"\nstatut: ébauche\npublic-cible:\n  - travailleur\nniveau-sensibilité: publique\nqualité: ébauche\npublication-travailleur: oui\npublication-gestionnaire: non\ntraitement-publication: page-travailleur\narchive-candidat: false\nversion-jumelle:\nrévision: 2026-05-20",
  "tags: [wiki, ergonomie, travailleurs, sommeil, quart-de-nuit, FIFO]\ntype: jumelle-travailleur\nniveau-sensibilité: vulgarisé\nqualité: brouillon\npublication-travailleur: oui\npublication-gestionnaire: non\ntraitement-publication: pour-travailleurs\nversion-jumelle: \"[[Sommeil et rythmes biologiques]]\"\nrévision: 2026-05-22\naliases:\n  - Sommeil et quart de nuit pour les travailleurs\n  - Quart de nuit, FIFO, comment dormir\nstatut: ébauche",
  "tags: [wiki, thème, droit, employeur, LSST, obligations]\ntype: thème\npublic-cible: conseiller, direction, superviseur\nniveau-sensibilité: interne\nqualité: brouillon\nrévision: 2026-05-22\nstatut: ébauche"
];
const chemins = [
  "Wiki Toxicologie/25 - Articles travailleurs/Solvants.md",
  "Wiki Ergonomie/25 - Articles travailleurs/Sommeil et quart de nuit.md",
  "Wiki Droit du travail/10 - Thèmes/Obligations de l'employeur.md"
];
const refs = [['sol', 5], ['nuit', 4], ['emp', 4]];

test('terrain lot 2 : trois notes, publics et statuts strictement conservés', () => {
  assert.deepEqual(lot.notes.map(n => n.chemin), chemins);
  lot.notes.forEach((note, i) => {
    assert.doesNotMatch(note.chemin, /\.\.|^[A-Z]:|^[/\\]/i);
    const fm = yaml.load(note.contenu.match(/^---\n([\s\S]*?)\n---/)[1]);
    const avant = yaml.load(anciensFrontmatters[i]);
    assert.ok(fm['sources-verifiees-le']);
    assert.equal(new Date(fm['révision']).toISOString().slice(0,10), '2026-09-06');
    delete fm['sources-verifiees-le']; delete fm['révision']; delete avant['révision'];
    assert.deepEqual(fm, avant);
    assert.match(note.contenu, /aucune validation spécialisée/);
  });
});

test('terrain lot 2 : anciens liens de section, références et tableaux compacts', () => {
  lot.notes.forEach((note, i) => {
    const titres = [...note.contenu.matchAll(/^#{1,6} (.+)$/gm)].map(m => cleAncre(m[1]));
    const explicites = [...note.contenu.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    const ids = [...titres, ...explicites];
    for (const ancien of anciensTitres[i]) assert.equal(ids.filter(id => id === cleAncre(ancien)).length, 1, ancien);
    const [prefixe, nombre] = refs[i];
    const attendues = Array.from({length: nombre}, (_, j) => 'ref-' + prefixe + '-' + (j + 1));
    assert.deepEqual(explicites.filter(id => id.startsWith('ref-')), attendues);
    for (const id of attendues) assert.ok(note.contenu.includes('](#' + id + ')'));
    const tableaux = note.contenu.split('\n').filter(l => /^\| ---/.test(l));
    assert.equal(tableaux.length, 1);
    assert.equal(tableaux[0].split('|').length, 4);
    assert.doesNotMatch(note.contenu, /!\[|<img\b/);
    assert.match(note.contenu, /Sources consultées le \*\*6 septembre 2026\*\*/);
    assert.ok(!analyserQualite({body:note.contenu}).defauts.some(d => ['tronque', 'sans-intro', 'source-directe-absente'].includes(d.code)));
  });
});

test('solvants : choix de protection conditionnel et réponse propre au produit', () => {
  const t = lot.notes[0].contenu;
  assert.match(t, /Aucun matériau de gant ne convient à tous les produits/);
  assert.match(t, /N95 filtre des particules, pas les vapeurs/);
  assert.match(t, /n'est pas non plus une solution universelle/);
  assert.match(t, /ne fixe pas une durée de rinçage universelle/);
  assert.match(t, /Ne retourne pas dans la zone simplement parce que tu te sens mieux/);
  assert.match(t, /1 800 463-5060/);
  assert.match(t, /leur absence ne démontre pas/);
  assert.doesNotMatch(t, /pendant 15 minutes|ton nez qui s'éteint|en quelques minutes|ouvre la porte|cartouche pour vapeurs organiques\*\*/);
});

test('sommeil : repère contextualisé, conduite prudente et prévention collective', () => {
  const t = lot.notes[1].contenu;
  assert.match(t, /7 à 9 heures/);
  assert.match(t, /pas une garantie de vigilance/);
  assert.match(t, /arrête-toi dans un endroit sûr/);
  assert.match(t, /ne remplace pas le sommeil/);
  assert.match(t, /somnolence au réveil peut persister/);
  assert.match(t, /pas seulement sur toi/);
  assert.match(t, /Exemple fictif/);
  assert.doesNotMatch(t, /0,05|3–4|3-4|6-7 h|7-8 h|majorité des accidents|dans les 2 h|Lunettes de soleil/);
});

test('employeur : renvois officiels et aucune garantie par la documentation', () => {
  const t = lot.notes[2].contenu;
  for (const renvoi of ['3° et 5°', '7° et 8°', '9° et 11°', '58–59', '68 et suivants', '#se:62)', '#se:62_1)', '#se:191)', '179–180, 182, 184–186']) assert.ok(t.includes(renvoi));
  assert.match(t, /ils ne garantissent ni la conformité ni l'absence de responsabilité/);
  assert.match(t, /ne remplace pas les obligations propres à l'employeur/);
  assert.match(t, /pas un inventaire exhaustif/);
  assert.match(t, /Exemple fictif/);
  assert.doesNotMatch(t, /\[\[art-|dix obligations|position défensive forte|renforcées en 2021-2024|sanctions administratives complètent/);
});
