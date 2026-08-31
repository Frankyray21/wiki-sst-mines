// Patch ponctuel : marqueurs U+0001 autour des jetons de lierTexteLegal,
// sinon la restitution par /\d+/ mange tous les nombres du texte rendu.
import fs from 'node:fs';
const f = 'tools/build_site.mjs';
let s = fs.readFileSync(f, 'utf8');
const M = '\\u0001'; // séquence littérale à injecter dans le source

const avant1 = 'return `${protege.length - 1}`;';
const apres1 = 'return `' + M + '${protege.length - 1}' + M + '`;';
const avant2 = 'return s.replace(/(\\d+)/g, (m, i) => protege[+i]);';
const apres2 = 'return s.replace(/' + M + '(\\d+)' + M + '/g, (m, i) => protege[+i]);';

if (!s.includes(avant1) || !s.includes(avant2)) {
  console.error('motif introuvable — fichier déjà patché ?');
  console.error('  jeton :', s.includes(avant1), '· restitution :', s.includes(avant2));
  process.exit(1);
}
s = s.replace(avant1, apres1).replace(avant2, apres2);
fs.writeFileSync(f, s);
console.log('patché : marqueurs U+0001 en place');
