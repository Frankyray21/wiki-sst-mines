import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAV, ROLES, SITUATIONS, EXPLORER, DOMAINES, rendrePortailEncadrement } from '../portail_encadrement.mjs';

// Le 12 septembre 2026, les adresses par notion ont changé les cibles du portail de
// l'encadrement (dossiers de cours retirés). Ce test vérifie contre le site RÉELLEMENT
// construit (docs/) que chaque cible existe encore — c'est ce que `verifier` fait aussi à la
// construction, où une cible manquante arrête le build (build_site.mjs).
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = path.join(R, 'docs');

test('toutes les cibles du portail existent dans le site construit', () => {
  const cibles = [
    ...NAV.map(n => n.cible), ...ROLES.map(r => r.cible), ...SITUATIONS.map(s => s.cible), ...EXPLORER.map(e => e.cible),
    ...DOMAINES.map(d => d.cible),
  ].filter(Boolean);
  for (const cible of cibles) {
    assert.ok(fs.existsSync(path.join(DOCS, cible.split('#')[0])), 'cible existante : ' + cible);
  }
});

test('rendrePortailEncadrement : rendu.morts vide quand toutes les cibles existent réellement', () => {
  const verifier = (c) => fs.existsSync(path.join(DOCS, c.split('#')[0]));
  const rendu = rendrePortailEncadrement({ R: '../', nbLois: 3326, majDate: '12 septembre 2026', verifier });
  assert.deepEqual(rendu.morts, []);
});

test('rendrePortailEncadrement : une cible absente est signalée dans morts, pas silencieusement', () => {
  // Une cible connue et par ailleurs valide échoue exprès, pour prouver que le mécanisme la
  // remonte (c'est ce qui fait échouer le build en cas de renommage non répercuté).
  const cibleAbsente = NAV.find(n => n.cible)?.cible;
  const rendu = rendrePortailEncadrement({ R: '../', nbLois: 1, majDate: 'x', verifier: (c) => c !== cibleAbsente });
  assert.ok(rendu.morts.includes(cibleAbsente));
  assert.ok(rendu.html.includes('href="#"'));
});
