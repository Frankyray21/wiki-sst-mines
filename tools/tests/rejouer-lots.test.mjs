// Script unique de rejeu des lots du vault (27 septembre 2026) : ordre, essai sans écriture, application,
// second passage sans effet, lot en échec qui bloque toute écriture.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lotsARejouer, bilan } from '../rejouer_lots.mjs';

const outils = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.dirname(outils);
const lot = (titre, retouches) => ({ note: { titre, wiki: 'Wiki Ergonomie', page: 'w/ergonomie/x.html' }, medias: [], retouches });

function monde() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rejeu-'));
  const lots = path.join(d, 'lots'), vault = path.join(d, 'vault'), notes = path.join(vault, 'Wiki Ergonomie', '20 - Articles internes');
  fs.mkdirSync(lots); fs.mkdirSync(notes, { recursive: true });
  fs.writeFileSync(path.join(notes, 'Alpha.md'), '# Alpha\n\nLa valeur est de 3 ppm dans ce texte.\n');
  fs.writeFileSync(path.join(notes, 'Beta.md'), '# Beta\n\n## Schéma\n\nFin.\n');
  fs.writeFileSync(path.join(lots, '2026-09-27-corr-alpha.json'), JSON.stringify(lot('Alpha', [{ type: 'remplacer', ligneContenant: 'La valeur est de', avant: '3 ppm dans', apres: '2 ppm dans' }])));
  fs.writeFileSync(path.join(lots, '2026-09-25-beta-schemas.json'), JSON.stringify(lot('Beta', [{ type: 'insererApres', ligneContenant: '## Schéma', bloc: '<div class="infographie">b.svg</div>', marqueur: 'b.svg' }])));
  fs.writeFileSync(path.join(lots, '2026-09-26-table.json'), JSON.stringify({ raccourcir: {} }));
  fs.writeFileSync(path.join(lots, '2026-09-06-ancien.json'), JSON.stringify(lot('Alpha', [])));
  const lancer = (...a) => spawnSync(process.execPath, [path.join(outils, 'rejouer_lots.mjs'), '--vault', vault, '--dossier', lots, '--sans-outils', ...a], { cwd: d, encoding: 'utf8' });
  return { d, lots, notes, lancer };
}

test('lots retenus : format lot seulement, depuis le 25 septembre, schémas avant les corrections du 27', () => {
  const { lots } = monde();
  assert.deepEqual(lotsARejouer(lots), ['2026-09-25-beta-schemas.json', '2026-09-27-corr-alpha.json']);
  const reels = lotsARejouer(path.join(racine, 'content-updates'));
  assert.ok(reels.length >= 66, 'les 66 lots des 25 et 26 septembre, plus ceux du 27');
  assert.ok(!reels.includes('2026-09-26-libelles-courts.json'), 'la table des libellés n’est pas un lot');
  assert.ok(reels.indexOf('2026-09-25-corr-amiante-hygiene.json') < reels.indexOf('2026-09-25-aerosols-schemas.json'));
  assert.ok(reels.findIndex(f => f.startsWith('2026-09-27-corr-')) > reels.findIndex(f => f.endsWith('-schemas.json')));
});

test('essai sans écriture, application, puis second passage sans effet', () => {
  const { d, notes, lancer } = monde();
  const avant = fs.readFileSync(path.join(notes, 'Alpha.md'), 'utf8');
  const essai = lancer();
  assert.equal(essai.status, 0, essai.stdout + essai.stderr);
  assert.match(essai.stdout, /2 lots prêts \(2 retouche\(s\) à faire\), 0 en échec/);
  assert.equal(fs.readFileSync(path.join(notes, 'Alpha.md'), 'utf8'), avant, 'essai : rien n’est écrit');
  const app = lancer('--appliquer');
  assert.equal(app.status, 0, app.stdout + app.stderr);
  assert.match(fs.readFileSync(path.join(notes, 'Alpha.md'), 'utf8'), /2 ppm dans/);
  assert.match(fs.readFileSync(path.join(notes, 'Beta.md'), 'utf8'), /b\.svg/);
  assert.ok(fs.existsSync(path.join(d, 'sauvegarde-vault')), 'sauvegardes dans le dossier de lancement');
  const encore = lancer();
  assert.match(encore.stdout, /0 retouche\(s\) à faire/);
});

test('un lot en échec à l’essai : rien n’est écrit, même avec --appliquer', () => {
  const { lots, notes, lancer } = monde();
  fs.writeFileSync(path.join(lots, '2026-09-27-corr-zeta.json'), JSON.stringify(lot('Alpha', [{ type: 'remplacer', ligneContenant: 'phrase absente', avant: 'x', apres: 'y' }])));
  const r = lancer('--appliquer');
  assert.equal(r.status, 1);
  assert.match(r.stdout, /✗ 2026-09-27-corr-zeta\.json/);
  assert.match(fs.readFileSync(path.join(notes, 'Alpha.md'), 'utf8'), /3 ppm dans/, 'aucun lot appliqué');
});

test('bilan d’une sortie de appliquer_retouches', () => {
  assert.deepEqual(bilan('Note : W/a.md\n  ✓ remplacer « x » : appliquée\n  = insererApres « y » : déjà faite\n'), { faites: 1, deja: 1, echecs: 0, note: 'W/a.md' });
});
