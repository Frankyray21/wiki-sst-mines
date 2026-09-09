import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventaire, preparer, poserRenvois, localiser, aplatir, ligneAvecLien, slugify } from '../appliquer_renvois.mjs';

// Pose des renvois tranchés (content-updates/2026-09-09-renvois-sources.json) dans les notes du
// vault. Tests hermétiques sur un faux vault dans un dossier temporaire, plus un contrôle du lot réel.
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function fauxVault() {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-renvois-'));
  const w = path.join(racine, 'Wiki SST psychosociale');
  fs.mkdirSync(path.join(w, '26 - Brouillons travailleurs'), { recursive: true });
  fs.mkdirSync(path.join(w, '50 - Analyses'), { recursive: true });
  fs.writeFileSync(path.join(w, '26 - Brouillons travailleurs', 'Quand ça va mal.md'), `---
titre: Quand ça va mal
---
# Quand ça va mal

## Ce qui bloque

- **La culture du « tough guy »** : on endure, on n'en parle pas.
- Te dire « je vais m'en remettre tout seul » et [[Savoir ce qui existe|savoir ce qui existe]] aide.
- Plusieurs travailleurs ont du mal à demander. Demander, c'est dur.

## Références

1. <span id="ref-uni-1"></span>Ligne déjà présente.

[[00 - 🏠 Accueil SST psychosociale]]
`);
  fs.writeFileSync(path.join(w, '26 - Brouillons travailleurs', 'Sans références.md'), `# Sans références

Sur un quart de 12 heures, la performance baisse.

[[00 - 🏠 Accueil SST psychosociale]]
`);
  for (const n of ['Analyse - Bowers et al. (2018)', 'Analyse - Labra et al. (2022)', 'Analyse - Folkard & Tucker (2003)']) fs.writeFileSync(path.join(w, '50 - Analyses', n + '.md'), '# ' + n + '\n');
  return racine;
}

test('aplatir et localiser : gras, wikilinks et guillemets n’empêchent pas de retrouver l’ancrage', () => {
  const md = '- **La culture du « tough guy »** : on endure.\n- Voir [[Note|savoir ce qui existe]] et [lien](https://x) ici. Encore ici.';
  assert.equal(aplatir(md).plat, '- La culture du « tough guy » : on endure.\n- Voir savoir ce qui existe et lien ici. Encore ici.');
  assert.equal(md.slice(localiser(md, 'La culture du « tough guy » : on endure.')), '\n- Voir [[Note|savoir ce qui existe]] et [lien](https://x) ici. Encore ici.');
  assert.equal(md.slice(localiser(md, 'savoir ce qui existe')), ' et [lien](https://x) ici. Encore ici.', 'après le wikilink entier');
  assert.equal(md.slice(localiser(md, 'ici', 2)), '.', 'deuxième occurrence');
  assert.equal(localiser(md, 'phrase absente'), -1);
  assert.equal(localiser(md, 'ici', 3), -1);
});

test('poserRenvois : appels numérotés dans l’ordre du texte, section Références complétée', () => {
  const md = fs.readFileSync(path.join(fauxVault(), 'Wiki SST psychosociale/26 - Brouillons travailleurs/Quand ça va mal.md'), 'utf8');
  const { md: apres, poses, manques } = poserRenvois(md, [
    { ancrage: 'Plusieurs travailleurs ont du mal à demander.', ligne: 'Labra (2022), B.' },
    { ancrage: 'La culture du « tough guy » : on endure, on n\'en parle pas.', ligne: 'Bowers (2018), A.' },
    { ancrage: 'Demander, c\'est dur.', ligne: 'Labra (2022), C.' },
    { ancrage: 'absent', ligne: 'x' },
  ], 'uni');
  assert.equal(manques.length, 1);
  assert.deepEqual(poses.map(p => p.num), [2, 3, 4], 'numéros continus après la référence existante');
  assert.ok(apres.includes("on n'en parle pas. [2](#ref-uni-2)\n"), 'premier dans le texte = 2');
  assert.ok(apres.includes('à demander. [3](#ref-uni-3) Demander, c\'est dur. [4](#ref-uni-4)\n'));
  assert.ok(apres.includes('1. <span id="ref-uni-1"></span>Ligne déjà présente.\n2. <span id="ref-uni-2"></span>Bowers (2018), A.\n3. <span id="ref-uni-3"></span>Labra (2022), B.\n4. <span id="ref-uni-4"></span>Labra (2022), C.\n\n[[00 - 🏠 Accueil SST psychosociale]]'));
  // note sans section Références : créée avant le pied de page
  const sans = poserRenvois('# T\n\nUne phrase.\n\n[[00 - 🏠 Accueil]]\n', [{ ancrage: 'Une phrase.', ligne: 'Folkard et Tucker (2003), X.' }], 'uni');
  assert.equal(sans.md, '# T\n\nUne phrase. [1](#ref-uni-1)\n\n## Références\n\n1. <span id="ref-uni-1"></span>Folkard et Tucker (2003), X.\n\n[[00 - 🏠 Accueil]]\n');
});

test('preparer : mêmes chemins et slugs que le site, notes introuvables signalées', () => {
  const inv = inventaire(fauxVault());
  assert.equal(slugify('Analyse - Folkard & Tucker (2003)'), 'analyse-folkard-tucker-2003');
  assert.ok(inv.parSortie.has('w/psychosocial/26-brouillons-travailleurs/quand-ca-va-mal.html'));
  const fiche = 'w/psychosocial/26-brouillons-travailleurs/quand-ca-va-mal.html';
  const { parNote, absents } = preparer({ renvois: [
    { fiche, source: 'analyse-bowers-et-al-2018', verdict: 'appliquer', ancrage: 'A', ligneBibliographie: 'Bowers et al. (2018), ligne.' },
    { fiche, source: 'analyse-labra-et-al-2022', verdict: 'resserrer', ancrage: 'B', ancrageFinal: 'B2', ligneBibliographie: 'vieux', ligneFinale: 'Labra et al. (2022), ligne.', occurrence: 2 },
    { fiche, source: 'analyse-inspq-2018', verdict: 'ecarter', ancrage: 'aucun', ligneBibliographie: 'aucun' },
    { fiche, source: 'analyse-inconnue-2000', verdict: 'appliquer', ancrage: 'C', ligneBibliographie: 'Inconnue (2000).' },
    { fiche: 'w/psychosocial/26-brouillons-travailleurs/inexistante.html', source: 'analyse-bowers-et-al-2018', verdict: 'appliquer', ancrage: 'D', ligneBibliographie: 'x' },
  ] }, inv);
  assert.equal(parNote.size, 1);
  const renvois = [...parNote.values()][0];
  assert.deepEqual(renvois.map(r => [r.ancrage, r.occurrence, r.ligne]), [
    ['A', undefined, '[[Analyse - Bowers et al. (2018)|Bowers et al. (2018)]], ligne.'],
    ['B2', 2, '[[Analyse - Labra et al. (2022)|Labra et al. (2022)]], ligne.'],
  ]);
  assert.deepEqual(absents.map(a => a.cause), ['note d’analyse introuvable', 'note de la fiche introuvable']);
  assert.equal(ligneAvecLien('Analyse ergonomique du travail (note de concept) — x', 'Analyse ergonomique du travail'), '[[Analyse ergonomique du travail]] — Analyse ergonomique du travail (note de concept) — x');
  assert.equal(ligneAvecLien('Tissot et al. (2022, INSPQ), Déterminants — x', 'Analyse - Tissot et al. (INSPQ 2022)'), '[[Analyse - Tissot et al. (INSPQ 2022)|Tissot et al. (2022, INSPQ)]], Déterminants — x');
  assert.equal(ligneAvecLien('Daniellou (dir., 1996), L\'ergonomie — x', 'Analyse - Daniellou (1996)'), '[[Analyse - Daniellou (1996)|Daniellou (dir., 1996)]], L\'ergonomie — x');
});

test('le lot des 59 renvois tranchés est complet et pointe vers des pages publiées', () => {
  const lot = JSON.parse(fs.readFileSync(path.join(R, 'content-updates/2026-09-09-renvois-sources.json'), 'utf8'));
  assert.equal(lot.renvois.length, 59);
  const verdicts = {};
  const analyses = new Set();
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/^analyse-.*\.html$/.test(e.name)) analyses.add(e.name.replace(/\.html$/, '')); } })(path.join(R, 'docs/w'));
  for (const r of lot.renvois) {
    verdicts[r.verdict] = (verdicts[r.verdict] || 0) + 1;
    assert.ok(fs.existsSync(path.join(R, 'docs', r.fiche)), `fiche publiée : ${r.fiche}`);
    if (r.verdict === 'ecarter') { assert.equal(r.ancrageFinal, 'aucun'); continue; }
    assert.ok(analyses.has(r.source), `note d’analyse publiée : ${r.source}`);
    for (const champ of ['ancrageFinal', 'ligneFinale']) {
      assert.ok(typeof r[champ] === 'string' && r[champ].length > 8 && r[champ] !== 'aucun', `${r.source} : ${champ}`);
      assert.ok(!['appliquer', 'resserrer', 'ecarter'].includes(r[champ]), `${r.source} : ${champ} contient un verdict`);
    }
    assert.ok(!/Ancrage et verdict/.test(r.ligneFinale) && !/^Ligne :/.test(r.ligneFinale), `${r.source} : ligne finale propre`);
    assert.match(r.ligneFinale, /\([^)]*\d{4}[^)]*\)|\(note de concept\)/, `${r.source} : auteur (année)`);
  }
  assert.deepEqual(verdicts, { appliquer: 13, resserrer: 45, ecarter: 1 });
});
