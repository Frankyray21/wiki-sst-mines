import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as yaml from 'js-yaml';

const archive = JSON.parse(fs.readFileSync(new URL('../../content-updates/2026-09-06-rps-references-lot2.json', import.meta.url), 'utf8'));
const prefixes = ['dem', 'lat', 'sou'];
const titres = ['Demandes psychologiques', 'Latitude décisionnelle', 'Soutien social au travail'];

test('lot limité aux trois notes attendues, chemins relatifs et titres conservés', () => {
  assert.equal(archive.notes.length, 3);
  assert.equal(new Set(archive.notes.map(n => n.chemin)).size, 3);
  archive.notes.forEach((note, i) => {
    assert.ok(note.chemin.startsWith('Wiki SST psychosociale/20 - Articles/'));
    assert.ok(note.chemin.endsWith('/' + titres[i] + '.md'));
    assert.doesNotMatch(note.chemin, /\.\.|^[A-Z]:|^[/\\]/i);
    assert.ok(note.contenu.includes('# ' + titres[i] + '\n'));
  });
});

test('quatre références appelées et un seul tableau compact par note', () => {
  archive.notes.forEach((note, i) => {
    for (let n = 1; n <= 4; n++) {
      const ancre = 'ref-' + prefixes[i] + '-' + n;
      assert.equal((note.contenu.match(new RegExp('id="' + ancre + '"', 'g')) || []).length, 1);
      assert.ok(note.contenu.includes('](#' + ancre + ')'));
    }
    const tables = note.contenu.split('\n').filter(l => /^\| ---/.test(l));
    assert.equal(tables.length, 1);
    assert.equal(tables[0].split('|').length, 4, 'deux colonnes');
    assert.doesNotMatch(note.contenu, /Article en construction|!\[|<img\b/);
    assert.match(note.contenu, /fictif|fictifs/);
  });
});

test('publication et publics inchangés, vérification documentaire sans attestation humaine', () => {
  archive.notes.forEach((note, i) => {
    const fm = yaml.load(note.contenu.match(/^---\n([\s\S]*?)\n---/)[1]);
    assert.equal(fm['publication-travailleur'], 'non');
    assert.equal(fm['publication-gestionnaire'], i === 2 ? 'à-réviser' : 'non');
    assert.equal(fm['niveau-sensibilité'], i === 2 ? 1 : 'interne');
    assert.deepEqual(new Set(fm['public-cible']), new Set(['conseiller', 'direction', 'superviseur']));
    assert.ok(fm['sources-verifiees-le']);
    for (const cle of ['relecture-editoriale-le', 'relecteur-editorial', 'validation-specialisee-le', 'validateur-specialise']) assert.ok(!fm[cle]);
    assert.ok(note.contenu.includes('aucune validation spécialisée'));
  });
});

test('soutien : ancienne ancre et limites conservées, promesses non étayées retirées', () => {
  const texte = archive.notes[2].contenu;
  assert.ok(texte.includes('id="quatre-formes-de-soutien"'));
  for (const titre of ['Définition', 'Sources de soutien', 'Absence de soutien et iso-strain', 'Application en mines', 'Documents et outils', 'Pour aller plus loin']) assert.ok(texte.includes('## ' + titre));
  assert.doesNotMatch(texte, /2,2 à 2,8|1,7 à 2,0|15 minutes par jour|plus rentable|isolated prisoner|le plus puissant/i);
  assert.ok(texte.includes('ne permet pas, à lui seul'));
  assert.ok(texte.includes('requiert une formation spécifique'));
});
