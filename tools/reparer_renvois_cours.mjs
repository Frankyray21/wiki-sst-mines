// Les notes citent des modules de cours (« 2. Principaux facteurs de RPS ») comme s il
// s agissait de pages du wiki. Ces modules n existent pas comme notes : le lecteur voit
// un lien mort là où il n y a qu un titre de support de cours. Le libellé reste, en
// italique, le lien disparaît.
//
// Usage : node tools/reparer_renvois_cours.mjs [--appliquer]
import fs from 'node:fs';
import path from 'node:path';

const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines';
const SAUV = 'C:/Users/Frank/Claude code/Wiki_SST_Site/sauvegarde-vault/2026-09-03-renvois-cours';
const appliquer = process.argv.includes('--appliquer');

// index des notes réellement présentes, pour ne jamais dégrader un lien qui aboutit
const notes = new Set();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^\./.test(e.name)) walk(p); }
    else if (e.name.endsWith('.md')) notes.add(e.name.slice(0, -3).toLowerCase());
  }
})(VAULT);

const RE_MODULE = /^\d{1,2}\.\s+[A-ZÉÈÀÎ]/;
let touchees = 0, liens = 0;
(function walk2(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(98 - Archives|99 - Templates|_À supprimer|\.)/.test(e.name)) walk2(p); continue; }
    if (!e.name.endsWith('.md')) continue;
    const t = fs.readFileSync(p, 'utf8');
    let n = 0;
    const neuf = t.replace(/\[\[([^\]]+)\]\]/g, (m, dedans) => {
      const parts = dedans.split('|');
      const nom = parts[0].split('#')[0].trim();
      if (!RE_MODULE.test(nom)) return m;
      if (notes.has(nom.toLowerCase().replace(/\.pdf$/, ''))) return m; // la note existe : on n y touche pas
      n++;
      const libelle = (parts.length > 1 ? parts[parts.length - 1] : nom).trim();
      return `*${libelle}*`;
    });
    if (!n) continue;
    touchees++; liens += n;
    console.log(String(n).padStart(2) + ' renvoi(s) · ' + e.name);
    if (appliquer) {
      fs.mkdirSync(SAUV, { recursive: true });
      fs.copyFileSync(p, path.join(SAUV, e.name));
      fs.writeFileSync(p, neuf);
    }
  }
})(VAULT);
console.log(`\n${appliquer ? 'corrigés' : 'à corriger'} : ${liens} renvois de module dans ${touchees} notes`);
