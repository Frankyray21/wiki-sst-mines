import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as yaml from 'js-yaml';

const archive = JSON.parse(fs.readFileSync(new URL('../../content-updates/2026-09-06-rps-references-lot3.json', import.meta.url), 'utf8'));
const attendus = [
  { chemin: 'Wiki SST psychosociale/20 - Articles/Reconnaissance au travail.md', prefixe: 'rec', titres: ['Définition', 'Les quatre formes (Brun et Dugas)', "Pourquoi c'est un enjeu de santé", "Les règles d'or de la pratique", 'Application terrain', 'Ressources'] },
  { chemin: 'Wiki SST psychosociale/20 - Articles/Justice organisationnelle.md', prefixe: 'jus', titres: ['Définition', 'Ce que dit la recherche', 'Mesure', 'Application terrain', 'Ressources'] },
  { chemin: 'Wiki SST psychosociale/20 - Articles/Modèles et Théories/Définition du stress professionnel.md', prefixe: 'str', titres: ['Définition', 'Stress aigu vs chronique', 'Mécanismes', 'Application en mines', 'Documents et outils', 'Pour aller plus loin'] },
];

test('lot 3 : trois notes attendues et titres de sections conservés', () => {
  assert.deepEqual(archive.notes.map(n => n.chemin), attendus.map(n => n.chemin));
  archive.notes.forEach((note, i) => {
    const titre = note.chemin.split('/').at(-1).replace(/\.md$/, '');
    assert.ok(note.contenu.includes('# ' + titre + '\n'));
    for (const section of attendus[i].titres) assert.ok(note.contenu.includes('## ' + section + '\n'), section);
    assert.doesNotMatch(note.chemin, /\.\.|^[A-Z]:|^[/\\]/i);
  });
});

test('lot 3 : références appelées, tableau compact et exemple explicite', () => {
  archive.notes.forEach((note, i) => {
    const ids = [...note.contenu.matchAll(/id="(ref-[^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(ids, [1, 2, 3, 4].map(n => 'ref-' + attendus[i].prefixe + '-' + n));
    for (const id of ids) assert.ok(note.contenu.includes('](#' + id + ')'));
    const tables = note.contenu.split('\n').filter(l => /^\| ---/.test(l));
    assert.equal(tables.length, 1);
    assert.equal(tables[0].split('|').length, 4, 'deux colonnes');
    assert.match(note.contenu, /Exemple fictif/);
    assert.doesNotMatch(note.contenu, /Article en construction|!\[|<img\b/);
    assert.ok(note.contenu.includes('Sources consultées le **6 septembre 2026**'));
  });
});

test('lot 3 : publics et autorisations de publication conservés, pas de validation inventée', () => {
  archive.notes.forEach((note, i) => {
    const fm = yaml.load(note.contenu.match(/^---\n([\s\S]*?)\n---/)[1]);
    if (i < 2) {
      for (const cle of ['publication-travailleur', 'publication-gestionnaire', 'niveau-sensibilité', 'public-cible', 'traitement-publication']) assert.ok(!(cle in fm));
      assert.equal(fm['qualité'], 'partielle');
    } else {
      assert.equal(fm['publication-travailleur'], 'non');
      assert.equal(fm['publication-gestionnaire'], 'oui');
      assert.equal(fm['niveau-sensibilité'], 2);
      assert.equal(fm['traitement-publication'], 'publie');
      assert.equal(fm['archive-candidat'], false);
      assert.deepEqual(fm['public-cible'], ['superviseur', 'conseiller', 'direction']);
    }
    assert.ok(fm['sources-verifiees-le']);
    for (const cle of ['relecture-editoriale-le', 'relecteur-editorial', 'validation-specialisee-le', 'validateur-specialise']) assert.ok(!(cle in fm));
    assert.ok(note.contenu.includes('aucune validation spécialisée'));
  });
});

test('lot 3 : modèles distincts et affirmations non étayées retirées', () => {
  const [rec, jus, str] = archive.notes.map(n => n.contenu);
  assert.ok(rec.includes('Le manque de reconnaissance ne suffit donc pas'));
  assert.ok(rec.includes("pas un essai démontrant l'efficacité"));
  assert.ok(jus.includes('**quatre dimensions**'));
  assert.ok(jus.includes('deux grandes catégories'));
  assert.ok(jus.includes('**12 indicateurs**'));
  assert.ok(jus.includes('ni la preuve d\'une faute juridique'));
  assert.doesNotMatch(jus, /30\s?%|1,6 et 1,9|10 à 15\s?%|cinquième rang|grade 2 sur 4/);
  assert.doesNotMatch(str, /img-000|Usage personnel|stress aigu est utile|quelques minutes à quelques jours/i);
  assert.ok(str.includes('Le tableau n\'établit pas de seuil'));
  assert.ok(str.includes("ni de décider de l'aptitude"));
  assert.ok(str.includes('Une réaction qui se prolonge'));
});
