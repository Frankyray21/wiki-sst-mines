// Pose dans le vault un lot de retouches préparé sans accès au vault (content-updates/*.json) :
// médias à copier (schémas, photos) et retouches ciblées d'une note (voir retouches.mjs).
// Essai par défaut : rien n'est écrit, chaque retouche est affichée avec sa ligne. --appliquer
// écrit, après sauvegarde de la note dans sauvegarde-vault/<date>-retouches/. Si une seule
// retouche ne trouve pas sa ligne, rien n'est écrit.
//   node tools/appliquer_retouches.mjs --lot content-updates/<lot>.json [--appliquer] [--vault "C:/…/WIKI SST - Mines"]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appliquerRetouches } from './retouches.mjs';
import { trouverNote } from './intros.mjs';
import { slugify } from './adresses.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const VAULT = opt('--vault', 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines');
const LOT = opt('--lot', null);
const APPLIQUER = args.includes('--appliquer');
const SAUVEGARDE = path.resolve('sauvegarde-vault', new Date().toISOString().slice(0, 10) + '-retouches');

if (!LOT) { console.error('Indiquer le lot : --lot content-updates/<lot>.json'); process.exit(1); }
if (!fs.existsSync(VAULT)) { console.error(`Vault introuvable : ${VAULT} (--vault pour indiquer le chemin)`); process.exit(1); }
const lot = JSON.parse(fs.readFileSync(path.resolve(LOT), 'utf8'));

// Toutes les notes du vault hors archives, une fois : pour retrouver la note du lot et les cibles des liens.
const notes = [];
(function walk(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!/^98 - Archives|^_archive|^\.|^sauvegarde/i.test(e.name)) walk(path.join(d, e.name), rel + e.name + '/'); continue; }
    if (e.name.endsWith('.md')) notes.push(rel + e.name);
  }
})(VAULT, '');

// {{lien:w/…/art-308-rsst-surveillant.html|art. 308}} : la note dont le nom de fichier donne cette
// adresse, dans le wiki que désigne l'adresse. Nom seul si unique dans le vault, chemin sinon.
const WIKI_DE = { legislation: 'Recueil législatif SST', securite: 'Wiki Sécurité industrielle', hygiene: 'Wiki Hygiène industrielle', toxicologie: 'Wiki Toxicologie', ergonomie: 'Wiki Ergonomie', 'droit-travail': 'Wiki Droit du travail', psychosocial: 'Wiki SST psychosociale' };
function resoudreLien(adresse) {
  const [, wiki] = adresse.split('/');
  const slug = path.basename(adresse, '.html');
  const cands = notes.filter(n => n.startsWith((WIKI_DE[wiki] || '\0') + '/') && slugify(path.basename(n, '.md')) === slug);
  if (cands.length !== 1) return null;
  const base = path.basename(cands[0], '.md');
  return notes.filter(n => path.basename(n, '.md') === base).length === 1 ? base : cands[0].slice(0, -3);
}

let note = lot.note.chemin && fs.existsSync(path.join(VAULT, lot.note.chemin)) ? lot.note.chemin : null;
if (!note) {
  const cands = trouverNote(VAULT, { titre: lot.note.titre, slug: path.basename(lot.note.page, '.html') }, { fs, path, slugify })
    .filter(c => !lot.note.wiki || c.chemin.startsWith(lot.note.wiki + '/'));
  if (cands.length !== 1) {
    console.error(`✗ ${cands.length ? cands.length + ' notes répondent' : 'aucune note'} pour « ${lot.note.titre} »${cands.length ? ' : ' + cands.map(c => c.chemin).join(' ; ') : ''}`);
    process.exit(1);
  }
  note = cands[0].chemin;
}
console.log(`Note : ${note}`);

const abs = path.join(VAULT, note);
const avant = fs.readFileSync(abs, 'utf8');
let r;
try { r = appliquerRetouches(avant, lot.retouches, { resoudreLien }); }
catch (e) { console.error('✗ ' + e.message); process.exit(1); }
for (const x of r.rapports) console.log(`  ${x.statut === 'appliquée' ? '✓' : x.statut === 'déjà faite' ? '=' : '✗'} ${x.type} « ${x.ligneContenant} » : ${x.statut}${x.ligne ? ' (ligne ' + x.ligne + ')' : ''}`);
if (!r.ok) { console.error('Rien n’est écrit : corriger les retouches signalées ✗ (ou la note) puis relancer.'); process.exit(1); }

// médias vérifiés tous d'abord, copiés seulement si aucun ne se heurte à un fichier existant
let erreurs = 0;
const aCopier = [];
for (const m of lot.medias || []) {
  const src = path.join(racine, m.depuis);
  const dest = path.join(VAULT, m.dossierVault, path.basename(m.depuis));
  const identique = fs.existsSync(dest) && Buffer.compare(fs.readFileSync(dest), fs.readFileSync(src)) === 0;
  if (identique) { console.log(`  = média déjà en place : ${m.dossierVault}/${path.basename(dest)}`); continue; }
  if (fs.existsSync(dest)) { console.log(`  ✗ un autre fichier porte déjà ce nom : ${m.dossierVault}/${path.basename(dest)} (non remplacé)`); erreurs++; continue; }
  aCopier.push([src, dest, m.dossierVault]);
}
if (erreurs) { console.error('Rien n’est écrit : un média porte le nom d’un autre fichier du vault.'); process.exit(1); }
for (const [src, dest, dossier] of aCopier) {
  if (APPLIQUER) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(src, dest); }
  console.log(`  ✓ média ${APPLIQUER ? 'copié' : 'à copier'} : ${dossier}/${path.basename(dest)}`);
}

if (APPLIQUER && r.texte !== avant) {
  const dest = path.join(SAUVEGARDE, note);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(abs, dest);
  fs.writeFileSync(abs, r.texte);
  console.log(`Appliqué · sauvegarde : ${dest}`);
} else {
  console.log(APPLIQUER ? 'Rien à changer.' : 'Essai : rien n’est écrit sans --appliquer.');
}
