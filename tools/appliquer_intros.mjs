// Pose dans les notes du vault les phrases d'ouverture d'un lot (par défaut
// content-updates/2026-09-21-phrases-introduction.json). Chaque note est retrouvée par son titre
// H1, sinon par l'adresse de sa page publiée ; une seule doit répondre. Essai par défaut (rien
// n'est écrit) ; --appliquer écrit, après sauvegarde de chaque note dans sauvegarde-vault/<date>-intros/.
//   node tools/appliquer_intros.mjs [--appliquer] [--vault "C:/…/WIKI SST - Mines"] [--lot fichier.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { poserIntro, trouverNote } from './intros.mjs';
import { slugify } from './adresses.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const VAULT = opt('--vault', 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines');
const LOT = opt('--lot', path.join(__dirname, '..', 'content-updates', '2026-09-21-phrases-introduction.json'));
const APPLIQUER = args.includes('--appliquer');
const SAUVEGARDE = path.resolve('sauvegarde-vault', new Date().toISOString().slice(0, 10) + '-intros');

if (!fs.existsSync(VAULT)) { console.error(`Vault introuvable : ${VAULT} (--vault pour indiquer le chemin)`); process.exit(1); }
const lot = JSON.parse(fs.readFileSync(LOT, 'utf8'));
let posees = 0, sautees = 0, manquees = 0;
for (const e of lot.phrases) {
  const slug = path.basename(e.page, '.html');
  const notes = trouverNote(VAULT, { titre: e.titre, slug }, { fs, path, slugify });
  if (notes.length !== 1) {
    console.log(`  ✗ ${notes.length ? notes.length + ' notes répondent' : 'aucune note'} pour « ${e.titre} »${notes.length ? ' : ' + notes.map(n => n.chemin).join(' ; ') : ''}`);
    manquees++; continue;
  }
  const rel = notes[0].chemin, abs = path.join(VAULT, rel);
  const r = poserIntro(fs.readFileSync(abs, 'utf8'), e.phrase);
  if (!r.pose) { console.log(`  = ${r.motif} : ${rel}`); sautees++; continue; }
  if (APPLIQUER) {
    const dest = path.join(SAUVEGARDE, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    fs.writeFileSync(abs, r.texte);
  }
  console.log(`  ✓ ${r.motif} (retrouvée par ${notes[0].par}) : ${rel}\n      « ${e.phrase} »`);
  posees++;
}
console.log(`${APPLIQUER ? 'Appliqué' : 'Essai'} : ${posees} posée(s), ${sautees} déjà présente(s), ${manquees} non retrouvée(s)${APPLIQUER && posees ? ` · sauvegardes dans ${SAUVEGARDE}` : ''}`);
if (!APPLIQUER) console.log('Rien n’est écrit sans --appliquer.');
