// Pose dans les notes du vault les phrases d'ouverture du lot content-updates/2026-09-21-phrases-
// introduction.json. Essai par défaut (rien n'est écrit) ; --appliquer écrit, après sauvegarde de
// chaque note dans sauvegarde-vault/<date>/. Usage :
//   node tools/appliquer_intros.mjs [--appliquer] [--vault "C:/…/WIKI SST - Mines"]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { poserIntro } from './intros.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const VAULT = opt('--vault', 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines');
const LOT = opt('--lot', path.join(__dirname, '..', 'content-updates', '2026-09-21-phrases-introduction.json'));
const APPLIQUER = args.includes('--appliquer');
const SAUVEGARDE = path.resolve('sauvegarde-vault', new Date().toISOString().slice(0, 10) + '-intros');

const lot = JSON.parse(fs.readFileSync(LOT, 'utf8'));
let posees = 0, sautees = 0, introuvables = 0;
for (const e of lot.phrases) {
  const abs = path.join(VAULT, e.note);
  if (!fs.existsSync(abs)) { console.log(`  ✗ introuvable : ${e.note}`); introuvables++; continue; }
  const avant = fs.readFileSync(abs, 'utf8');
  const r = poserIntro(avant, e.phrase);
  if (!r.pose) { console.log(`  = ${r.motif} : ${e.note}`); sautees++; continue; }
  if (APPLIQUER) {
    const dest = path.join(SAUVEGARDE, e.note);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    fs.writeFileSync(abs, r.texte);
  }
  console.log(`  ✓ ${r.motif} : ${e.note}\n      « ${e.phrase} »`);
  posees++;
}
console.log(`${APPLIQUER ? 'Appliqué' : 'Essai'} : ${posees} posée(s), ${sautees} déjà présente(s), ${introuvables} introuvable(s)${APPLIQUER && posees ? ` · sauvegardes dans ${SAUVEGARDE}` : ''}`);
if (!APPLIQUER) console.log('Rien n’est écrit sans --appliquer.');
