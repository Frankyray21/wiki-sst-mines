// Retire les liens d'une page vers elle-même : ils ne mènent nulle part et le lecteur
// clique dans le vide. Le libellé reste, seul le lien disparaît. Deux cas traités :
//   - dans le corps : [[Page]] ou [[Page|alias]] devient le texte affiché
//   - dans le frontmatter : « theme: "[[Page]]" » ou « version-jumelle » pointant sur
//     la page elle-même est vidé (scorie de gabarit recopié)
//
// Usage : node tools/reparer_auto_liens.mjs [--appliquer]
import fs from 'node:fs';
import path from 'node:path';

const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines';
const SAUV = 'C:/Users/Frank/Claude code/Wiki_SST_Site/sauvegarde-vault/2026-09-03-auto-liens';
const appliquer = process.argv.includes('--appliquer');

const fichiers = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (!/^(98 - Archives|99 - Templates|_À supprimer|\.)/.test(e.name)) walk(p);
    } else if (e.name.endsWith('.md')) fichiers.push(p);
  }
})(VAULT);

let corps = 0, entetes = 0, touchees = 0;
for (const f of fichiers) {
  const base = path.basename(f, '.md');
  const cible = base.toLowerCase();
  const t = fs.readFileSync(f, 'utf8');
  const fin = /^---\r?\n/.test(t) ? t.indexOf('\n---', 4) : -1;
  let fm = fin > 0 ? t.slice(0, fin + 4) : '';
  let reste = fin > 0 ? t.slice(fin + 4) : t;
  let nC = 0, nE = 0;

  // corps : le wikilink devient son libellé
  reste = reste.replace(/\[\[([^\]]+)\]\]/g, (m, dedans) => {
    const parts = dedans.replace(/\\\|/g, '|').split('|');
    const nom = parts[0].split('#')[0].trim();
    if (nom.toLowerCase() !== cible) return m;
    nC++;
    return (parts.length > 1 ? parts[parts.length - 1] : nom).trim();
  });

  // frontmatter : un champ qui renvoie à la page elle-même ne dit rien
  if (fm) {
    fm = fm.replace(/^(theme|version-jumelle):\s*"?\[\[([^\]]+)\]\]"?\s*$/gim, (m, champ, dedans) => {
      const nom = dedans.split('|')[0].split('#')[0].trim();
      if (nom.toLowerCase() !== cible) return m;
      nE++;
      return `${champ}:`;
    });
  }

  if (!nC && !nE) continue;
  touchees++; corps += nC; entetes += nE;
  console.log(`${String(nC).padStart(2)} corps · ${nE} entête · ${base}`);
  if (appliquer) {
    fs.mkdirSync(SAUV, { recursive: true });
    fs.copyFileSync(f, path.join(SAUV, path.basename(f)));
    fs.writeFileSync(f, fm + reste);
  }
}
console.log(`\n${appliquer ? 'corrigées' : 'à corriger'} : ${touchees} pages · ${corps} liens dans le corps · ${entetes} champs d'entête`);
if (!appliquer) console.log('relancer avec --appliquer pour exécuter');
