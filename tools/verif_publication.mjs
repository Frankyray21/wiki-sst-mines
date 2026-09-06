// Compare le manifeste aux octets réellement stockés dans Git, pas au worktree.
// Avant commit : node tools/verif_publication.mjs --staged ; après commit : sans argument.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const repo = fileURLToPath(new URL('../', import.meta.url));
const source = process.argv.includes('--staged') ? ':' : 'HEAD:';
const manifeste = JSON.parse(execFileSync('git', ['show', source + 'docs/assets/hors-ligne.json'], { cwd: repo, encoding: 'utf8' }));
const noms = entrees => entrees.map(p => source + 'docs/' + p[0]).join('\n') + '\n';
const pages = spawnSync('git', ['cat-file', '--batch'], {
  cwd: repo, input: noms(manifeste.pages), maxBuffer: manifeste.octetsPages + manifeste.pages.length * 200 + 1024 * 1024,
});
assert.equal(pages.status, 0, pages.error?.message || pages.stderr?.toString());
let position = 0, total = 0;
for (const [chemin, empreinte, taille] of manifeste.pages) {
  const fin = pages.stdout.indexOf(10, position);
  assert.ok(fin >= position, 'réponse Git complète');
  const entete = pages.stdout.subarray(position, fin).toString().match(/^[0-9a-f]+ blob (\d+)$/);
  assert.ok(entete, 'blob publié présent : ' + chemin);
  const longueur = Number(entete[1]);
  const contenu = pages.stdout.subarray(fin + 1, fin + 1 + longueur);
  position = fin + longueur + 2;
  assert.equal(longueur, taille, 'taille publiée : ' + chemin);
  const normalise = Buffer.from(contenu.toString('latin1').split(manifeste.version).join(''), 'latin1');
  assert.equal(createHash('sha1').update(normalise).digest('hex').slice(0, 10), empreinte, 'empreinte publiée : ' + chemin);
  total += longueur;
}
assert.equal(position, pages.stdout.length);
assert.equal(total, manifeste.octetsPages);

const medias = spawnSync('git', ['cat-file', '--batch-check=%(objecttype) %(objectsize)'], {
  cwd: repo, input: noms(manifeste.medias), encoding: 'utf8', maxBuffer: 1024 * 1024,
});
assert.equal(medias.status, 0, medias.error?.message || medias.stderr);
const lignes = medias.stdout.trimEnd().split('\n');
assert.equal(lignes.length, manifeste.medias.length);
let totalMedias = 0;
manifeste.medias.forEach(([chemin, taille], i) => {
  assert.equal(lignes[i].trim(), 'blob ' + taille, 'média publié présent : ' + chemin);
  totalMedias += taille;
});
assert.equal(totalMedias, manifeste.octetsMedias);
console.log(JSON.stringify({ version: manifeste.version, source, pages: manifeste.pages.length, medias: manifeste.medias.length, resultat: 'OK — octets Git conformes au manifeste hors ligne' }, null, 2));
