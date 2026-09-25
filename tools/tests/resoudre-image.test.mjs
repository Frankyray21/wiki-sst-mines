// Choix du fichier désigné par un renvoi d'image : même résultat qu'avant l'extraction du module, et les
// choix entre plusieurs fichiers du même nom sont signalés (cause des captures de cours fausses).
import test from 'node:test';
import assert from 'node:assert/strict';
import { choisirImage } from '../resoudre_image.mjs';

const W = 'Wiki SST psychosociale';
const fichiers = [
  `${W}/60-images/01-fondamentaux/img-000.png`,
  `${W}/60-images/06-prévention/img-000.png`,
  `${W}/60-images/04-stress-modèles/img-002.png`,
  `Wiki Toxicologie/images/img-000.png`,
  `${W}/20 - Articles/schema-local.png`,
];
const parChemin = new Map(fichiers.map(f => [f.toLowerCase(), f]));
const parNom = new Map();
for (const f of fichiers) { const b = f.split('/').pop().toLowerCase(); parNom.set(b, [...(parNom.get(b) || []), f]); }
const index = { parChemin, parNom };
const note = { dir: `${W}/20 - Articles`, wikiKey: W };

test('chemin exact, chemin relatif à la note, nom unique : un seul fichier, rien de signalé', () => {
  assert.deepEqual(choisirImage(`${W}/60-images/06-prévention/img-000.png`, note, index), { rel: `${W}/60-images/06-prévention/img-000.png` });
  assert.deepEqual(choisirImage('schema-local.png', note, index), { rel: `${W}/20 - Articles/schema-local.png` });
  assert.deepEqual(choisirImage('img-002.png', note, index), { rel: `${W}/60-images/04-stress-modèles/img-002.png` });
  assert.deepEqual(choisirImage('absente.png', note, index), { rel: null });
});

test('dossier précisé dans le renvoi : le bon fichier, rien de signalé', () => {
  assert.deepEqual(choisirImage('06-prévention/img-000.png', note, index), { rel: `${W}/60-images/06-prévention/img-000.png` });
  assert.deepEqual(choisirImage(' 01-fondamentaux/img-000.png ', note, index), { rel: `${W}/60-images/01-fondamentaux/img-000.png` });
});

test('nom seul partagé par plusieurs fichiers : le premier est pris, comme avant, et le choix est signalé', () => {
  // cas réel : la note voulait 06-prévention/img-000.png, le site montrait la pyramide de Maslow de 01-fondamentaux
  const r = choisirImage('img-000.png', note, index);
  assert.equal(r.rel, `${W}/60-images/01-fondamentaux/img-000.png`);
  assert.equal(r.ambigu.length, 3, 'le nom seul correspond aussi au fichier d’un autre wiki');
});

test('dossier précisé mais introuvable : repli sur le wiki de la note, signalé', () => {
  const r = choisirImage('10-conflits/img-000.png', note, index);
  assert.equal(r.rel, `${W}/60-images/01-fondamentaux/img-000.png`);
  assert.deepEqual(r.ambigu, [`${W}/60-images/01-fondamentaux/img-000.png`, `${W}/60-images/06-prévention/img-000.png`]);
  // hors de tout wiki candidat : le premier fichier du nom, signalé aussi
  const ailleurs = choisirImage('x/img-000.png', { dir: 'Autre', wikiKey: 'Autre' }, index);
  assert.equal(ailleurs.rel, fichiers[0]);
  assert.equal(ailleurs.ambigu.length, 3);
});
