// Retire des notes du vault les versions texte dépliables que le site ne publie plus (demandes de Frank,
// 26 septembre 2026) : « Lire le schéma en texte », « Lire la version texte — … », « Lire les voies en texte »,
// « Lire l’illustration en texte »… (règle de tools/versions_texte.mjs, la même que le générateur).
// Le générateur les retire déjà à la lecture ; cet outil nettoie les notes elles-mêmes, pour Obsidian.
//
// Essai par défaut : rien n'est écrit, chaque note concernée est listée. --appliquer écrit, après sauvegarde
// de chaque note dans sauvegarde-vault/<date>-versions-texte/. Les archives ne sont pas touchées. Rejouer
// l'outil est sans effet.
//   node tools/retirer_versions_texte.mjs [--appliquer] [--vault "C:/…/WIKI SST - Mines"]
import fs from 'node:fs';
import path from 'node:path';
import { sansVersionsTexteMd } from './versions_texte.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const VAULT = opt('--vault', 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines');
const APPLIQUER = args.includes('--appliquer');
const SAUVEGARDE = path.resolve('sauvegarde-vault', new Date().toISOString().slice(0, 10) + '-versions-texte');

if (!fs.existsSync(VAULT)) { console.error(`Vault introuvable : ${VAULT} (--vault pour indiquer le chemin)`); process.exit(1); }

// notes hors archives, comme appliquer_retouches.mjs
const notes = [];
(function walk(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!/^98 - Archives|^_archive|^\.|^sauvegarde/i.test(e.name)) walk(path.join(d, e.name), rel + e.name + '/'); continue; }
    if (e.name.endsWith('.md')) notes.push(rel + e.name);
  }
})(VAULT, '');

const compter = t => (t.match(/<details\b/g) || []).length;
let touchees = 0, retirees = 0;
for (const note of notes.sort()) {
  const abs = path.join(VAULT, note);
  const avant = fs.readFileSync(abs, 'utf8');
  const apres = sansVersionsTexteMd(avant);
  if (apres === avant) continue;
  const n = compter(avant) - compter(apres);
  touchees++; retirees += n;
  if (APPLIQUER) {
    const dest = path.join(SAUVEGARDE, note);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    fs.writeFileSync(abs, apres);
  }
  console.log(`  ${APPLIQUER ? '✓' : '·'} ${note} : ${n} version(s) texte ${APPLIQUER ? 'retirée(s)' : 'à retirer'}`);
}
if (!touchees) console.log('Rien à changer : aucune note ne porte de version texte.');
else if (APPLIQUER) console.log(`Appliqué : ${retirees} version(s) texte retirée(s) de ${touchees} note(s) · sauvegardes : ${SAUVEGARDE}`);
else console.log(`Essai : ${retirees} version(s) texte dans ${touchees} note(s) ; rien n’est écrit sans --appliquer.`);
