// Deux scories de gabarit rendent le frontmatter de certaines notes invalide en YAML :
//   visé:  :                          -> la clé « visé » porte un deux-points orphelin
//   visé: : référence: RLRQ c. ...     -> deux champs fusionnés sur une seule ligne
// Obsidian et le générateur s'en accommodent, mais le champ « référence » disparaît et
// « visé » ne vaut rien. On sépare, sans rien inventer.
//
// Usage : node tools/reparer_frontmatter.mjs [--appliquer]
import fs from 'node:fs';
import path from 'node:path';

const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines';
const SAUV = 'C:/Users/Frank/Claude code/Wiki_SST_Site/sauvegarde-vault/2026-09-11-frontmatter';
const appliquer = process.argv.includes('--appliquer');

let fusion = 0, orphelin = 0, touchees = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!e.name.startsWith('.')) walk(p); continue; }
    if (!e.name.endsWith('.md')) continue;
    const t = fs.readFileSync(p, 'utf8');
    if (!/^---\r?\n/.test(t)) continue;
    const fin = t.indexOf('\n---', 4);
    if (fin < 0) continue;
    const avant = t.slice(0, fin);
    let apres = avant;
    let f = 0, o = 0;

    // deux champs collés : on les remet sur deux lignes
    apres = apres.replace(/^visé:\s*:\s*référence:\s*(.+)$/gm, (m, ref) => {
      f++;
      return 'visé: sans objet\nréférence: ' + ref.trim();
    });
    // deux-points orphelin : la valeur est vide, on l'écrit comme telle
    apres = apres.replace(/^visé:\s*:\s*$/gm, () => { o++; return 'visé:'; });

    if (apres === avant) continue;
    touchees++; fusion += f; orphelin += o;
    if (appliquer) {
      fs.mkdirSync(SAUV, { recursive: true });
      fs.copyFileSync(p, path.join(SAUV, e.name));
      fs.writeFileSync(p, apres + t.slice(fin));
    }
  }
})(VAULT);
console.log(`${appliquer ? 'réparées' : 'à réparer'} : ${touchees} notes · ${fusion} champs fusionnés séparés · ${orphelin} deux-points orphelins`);
