// Vérifie que tous les liens internes des pages générées pointent vers un fichier existant.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const cibles = process.argv[2] ? [process.argv[2]] : ['t', 'g', 'w'];

let total = 0, morts = 0;
const exemples = [];

function fichiers(dir) {
  const acc = [];
  (function rec(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) rec(p);
      else if (e.name.endsWith('.html')) acc.push(p);
    }
  })(dir);
  return acc;
}

for (const c of cibles) {
  const racine = path.join(OUT, c);
  if (!fs.existsSync(racine)) continue;
  for (const f of fichiers(racine)) {
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      let href = m[1];
      if (/^(https?:|mailto:|tel:|data:|#)/.test(href)) continue;
      href = href.split('#')[0].split('?')[0];
      if (!href) continue;
      total++;
      const abs = path.resolve(path.dirname(f), decodeURIComponent(href));
      if (!fs.existsSync(abs)) {
        morts++;
        if (exemples.length < 15) exemples.push(`${path.relative(OUT, f)}\n     → ${href}`);
      }
    }
  }
}

console.log(`Liens internes vérifiés : ${total} · morts : ${morts}`);
if (exemples.length) {
  console.log('\nExemples :');
  exemples.forEach(e => console.log('  ' + e));
}
