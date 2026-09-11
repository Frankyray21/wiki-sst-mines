import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as yaml from 'js-yaml';
import { analyserQualite } from '../qualite.mjs';
import { cleAncre } from '../editorial.mjs';

const lot = JSON.parse(fs.readFileSync(new URL('../../content-updates/2026-09-06-terrain-references.json', import.meta.url), 'utf8'));
const chemins = [
  'Wiki Sécurité industrielle/25 - Articles travailleurs/Risques mécaniques/Espaces clos.md',
  'Wiki Hygiène industrielle/25 - Articles travailleurs/Espaces clos.md',
  'Wiki Hygiène industrielle/25 - Articles travailleurs/SIMDUT et FDS.md',
];
const communes = ['À quoi sert cette page', 'À éviter', 'À qui tu peux en parler'];
const anciennes = [
  ...communes, 'Reconnaître un espace clos', "Avant d'entrer, vérifie ces 5 choses", 'Pendant le travail', 'La règle la plus dure : ne pas entrer pour secourir',
];
const anciennesFds = [...communes, 'Les 4 sections à connaître par coeur', "Lire les pictogrammes en un coup d'oeil", 'Repérer les gestes critiques', 'Où trouver les FDS sur le site'];

test('terrain : trois notes ciblées, versions Espaces clos harmonisées', () => {
  assert.deepEqual(lot.notes.map(n => n.chemin), chemins);
  assert.equal(lot.notes[0].contenu, lot.notes[1].contenu);
  for (const note of lot.notes) assert.doesNotMatch(note.chemin, /\.\.|^[A-Z]:|^[/\\]/i);
});

test('terrain : publications et statuts conservés, seule la vérification documentaire est datée', () => {
  lot.notes.forEach(note => {
    const fm = yaml.load(note.contenu.match(/^---\n([\s\S]*?)\n---/)[1]);
    assert.equal(fm['publication-travailleur'], 'oui');
    assert.equal(fm['publication-gestionnaire'], 'non');
    assert.deepEqual(fm['public-cible'], ['travailleur']);
    assert.equal(fm['niveau-sensibilité'], 'publique');
    assert.equal(fm['traitement-publication'], 'page-travailleur');
    assert.equal(fm['archive-candidat'], false);
    assert.equal(fm.statut, 'ébauche'); assert.equal(fm['qualité'], 'ébauche');
    assert.ok(fm['sources-verifiees-le']);
    for (const champ of ['relecture-editoriale-le', 'relecteur-editorial', 'validation-specialisee-le', 'validateur-specialise']) assert.ok(!(champ in fm));
    assert.match(note.contenu, /aucune validation spécialisée/);
  });
});

test('terrain : anciennes ancres gardées, quatre références appelées et un tableau à deux colonnes', () => {
  lot.notes.forEach((note, i) => {
    const titres = [...note.contenu.matchAll(/^#{1,6} (.+)$/gm)].map(m => cleAncre(m[1]));
    const explicites = [...note.contenu.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    const ids = [...titres, ...explicites];
    for (const titre of i < 2 ? anciennes : anciennesFds) assert.equal(ids.filter(id => id === cleAncre(titre)).length, 1, titre);
    const refs = explicites.filter(id => id.startsWith('ref-'));
    assert.deepEqual(refs, [1, 2, 3, 4].map(n => `ref-${i < 2 ? 'ec' : 'fds'}-${n}`));
    for (const id of refs) assert.ok(note.contenu.includes('](#' + id + ')'));
    const tableaux = note.contenu.split('\n').filter(l => /^\| ---/.test(l));
    assert.equal(tableaux.length, 1);
    assert.equal(tableaux[0].split('|').length, 4);
    assert.doesNotMatch(note.contenu, /!\[|<img\b/);
    assert.match(note.contenu, /Sources consultées le \*\*6 septembre 2026\*\*/);
    assert.ok(!analyserQualite({ body: note.contenu }).defauts.some(d => ['tronque', 'sans-intro', 'source-directe-absente'].includes(d.code)));
  });
});

test('espaces clos : aucune fausse autorisation, seuil simplifié ou statistique sans contexte', () => {
  const t = lot.notes[0].contenu;
  assert.match(t, /moyens de prévention prévus sont en place/);
  assert.match(t, /à la noyade ou à l'entraînement/);
  assert.match(t, /ni une procédure d'entrée, ni un permis, ni une autorisation de sauvetage/);
  assert.match(t, /ne constituent pas une liste complète/);
  assert.match(t, /sa présence ne remplace pas les protections réelles/);
  assert.match(t, /La reprise exige une réévaluation par une personne qualifiée/);
  assert.match(t, /sans entrer à ton tour/);
  assert.doesNotMatch(t, /20,5|23 %|moitié des morts|5 conditions manque|galerie en cul-de-sac/i);
});

test('FDS : repérage élargi, formation contextualisée et pas de choix automatique de protection', () => {
  const t = lot.notes[2].contenu;
  for (const n of [1, 2, 4, 5, 6, 7, 8, 10, 11, 16]) assert.ok(t.includes(`**${n}**`));
  assert.match(t, /ne t'autorise pas à intervenir au-delà de ta formation/);
  assert.match(t, /La rubrique 8 ne suffit pas toujours/);
  assert.match(t, /révision annuelle du programme/);
  assert.match(t, /Exemple fictif/);
  assert.doesNotMatch(t, /4 sections suffisent|renouvelée aux 3 ans|pendant 15 minutes|N95/);
});
