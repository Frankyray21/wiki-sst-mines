// Rend aux phrases du vault le mot que l'auteur avait écrit, quand le renommage d'une note l'a remplacé par
// le nouveau nom long dans tous les liens : « Aviser la [[CNESST, rôles et pouvoirs]] que… » redevient
// « Aviser la [[CNESST, rôles et pouvoirs|CNESST]] que… ». Et retire les liens qu'un tel renommage a envoyés
// dans un autre wiki, vers une note d'un autre sens : « [[Confinement, profondeur et charge mentale]], EPI,
// dépressurisation », dans une page d'hygiène, parlait du confinement d'une source, pas de la charge mentale
// sous terre ; le lien disparaît, le mot reste (« Confinement, EPI, dépressurisation »).
//
// La table (content-updates/2026-09-26-libelles-courts.json) dit, nom long par nom long, le texte court à
// afficher : elle est à valider par Frank avant --appliquer. Seules les phrases sont touchées : une ligne faite
// seulement de liens (« Voir aussi », liste de pages) garde le nom long, qui y renseigne mieux (même règle que
// le générateur, tools/libelle_lien.mjs). Un lien qui porte déjà son texte ([[Nom long|texte]]) n'est pas
// raccourci. Le Recueil législatif n'est pas touché, sauf --recueil.
//
// Usage : node tools/raccourcir_liens.mjs [--table <json>] [--vault <chemin>] [--recueil] [--appliquer]
//         Sans --appliquer : essai, chaque changement est affiché, rien n'est écrit. Avec --appliquer, chaque
//         note modifiée est d'abord sauvegardée dans sauvegarde-vault/<date>-libelles-courts/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { estLigneDeLiens } from './libelle_lien.mjs';

const RECUEIL = 'Recueil législatif SST';
const cleNom = (s) => String(s).normalize('NFC').trim().toLowerCase();

// Un wikilink (pas un renvoi d'image) : cible, ancre, séparateur et texte éventuels.
const WIKILIEN = /(?<!!)\[\[([^\[\]\n]+?)\]\]/g;
function decouper(interieur) {
  const m = interieur.match(/^(.*?)(\\\||\|)(.*)$/);
  const cible = (m ? m[1] : interieur);
  const [chemin, ...ancre] = cible.split('#');
  return { cible, nom: chemin.split('/').pop().trim(), ancre: ancre.join('#'), texte: m ? m[3] : null };
}

// Applique la table au texte d'une note du wiki `wiki`. Rend le texte et la liste des changements.
export function raccourcirLiens(texte, table, { wiki = '' } = {}) {
  const courts = new Map((table.raccourcir || []).map(e => [cleNom(e.nom), e.court]));
  const deliers = new Map((table.delier || []).filter(e => e.wiki !== wiki).map(e => [cleNom(e.nom), e.court]));
  // lignes et fins de ligne, gardées telles quelles (une note peut mêler \n et \r\n)
  const morceaux = texte.split(/(\r?\n)/);
  const lignes = morceaux.filter((_, i) => i % 2 === 0);
  const changements = [];
  let enTete = lignes[0].replace(/^\uFEFF/, '') === '---', dansCode = false;
  lignes.forEach((ligne, i) => {
    if (enTete) { if (i > 0 && ligne === '---') enTete = false; return; }
    if (/^\s*(```|~~~)/.test(ligne)) { dansCode = !dansCode; return; }
    if (dansCode || !ligne.includes('[[') || estLigneDeLiens(ligne)) return;
    const tableau = /^\s*\|/.test(ligne);
    const noms = [];
    const neuve = ligne.replace(WIKILIEN, (tout, interieur) => {
      const l = decouper(interieur);
      const cle = cleNom(l.nom);
      if (deliers.has(cle)) { noms.push(l.nom); return l.texte !== null ? l.texte : deliers.get(cle); }
      if (courts.has(cle) && l.texte === null) { noms.push(l.nom); return `[[${l.cible}${tableau ? '\\|' : '|'}${courts.get(cle)}]]`; }
      return tout;
    });
    if (neuve !== ligne) { changements.push({ ligne: i + 1, avant: ligne, apres: neuve, noms }); lignes[i] = neuve; }
  });
  return { texte: morceaux.map((m, i) => i % 2 ? m : lignes[i / 2]).join(''), changements };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const VAULT = opt('--vault', 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines');
  const TABLE = path.resolve(opt('--table', path.join(racine, 'content-updates/2026-09-26-libelles-courts.json')));
  const APPLIQUER = args.includes('--appliquer');
  const SAUVEGARDE = path.resolve('sauvegarde-vault', new Date().toISOString().slice(0, 10) + '-libelles-courts');
  if (!fs.existsSync(VAULT)) { console.error(`Vault introuvable : ${VAULT} (--vault pour indiquer le chemin)`); process.exit(1); }
  const table = JSON.parse(fs.readFileSync(TABLE, 'utf8'));

  const notes = [];
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!/^(98 - Archives|99 - Templates|_À supprimer|📥 PDF|_archive|sauvegarde|\.)/i.test(e.name)) walk(path.join(d, e.name), rel + e.name + '/');
        continue;
      }
      if (e.name.endsWith('.md')) notes.push(rel + e.name);
    }
  })(VAULT, '');

  const parNom = new Map();
  let total = 0, touchees = 0;
  for (const rel of notes) {
    const wiki = rel.split('/')[0];
    if (wiki === RECUEIL && !args.includes('--recueil')) continue;
    const abs = path.join(VAULT, rel);
    const avant = fs.readFileSync(abs, 'utf8');
    const { texte, changements } = raccourcirLiens(avant, table, { wiki });
    if (!changements.length) continue;
    touchees++; total += changements.length;
    console.log(`\n${rel}`);
    for (const c of changements) {
      console.log(`  l.${c.ligne}  − ${c.avant.trim()}\n         + ${c.apres.trim()}`);
      for (const n of c.noms) parNom.set(n, (parNom.get(n) || 0) + 1);
    }
    if (APPLIQUER) {
      const copie = path.join(SAUVEGARDE, rel);
      fs.mkdirSync(path.dirname(copie), { recursive: true });
      fs.copyFileSync(abs, copie);
      fs.writeFileSync(abs, texte);
    }
  }
  console.log(`\n${total} ligne(s) ${APPLIQUER ? 'modifiée(s)' : 'à modifier'} dans ${touchees} note(s). Liens par nom :`);
  for (const [n, k] of [...parNom].sort((a, b) => b[1] - a[1])) console.log(`  ${String(k).padStart(4)}  ${n}`);
  if (APPLIQUER) console.log(`Sauvegarde : ${SAUVEGARDE}`);
  else console.log('Essai seulement : relire les changements, puis relancer avec --appliquer.');
}
