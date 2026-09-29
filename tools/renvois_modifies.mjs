// Après une correction qui ajoute, retire ou redirige des liens dans des pages publiées (poser_corrections.mjs) :
// met à jour les « Pages qui pointent ici » des pages visées et les arêtes du graphe (docs/assets/graphe.json),
// comme le générateur les aurait produites. Compare chaque page docs/w modifiée à sa version Git de référence.
//
//   node tools/renvois_modifies.mjs [--depuis <réf. Git, HEAD par défaut>] [--ecrire]
//
// Sans --ecrire : essai. Ensuite : node tools/regenerer_hors_ligne.mjs (graphe.json et pages ont changé).
// Limite : seules les pages docs/w sont lues ; les copies encadrement (docs/g) gardent leurs renvois.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const texteDe = s => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
export const LIMITE = 60; // le générateur n'affiche que les 60 premiers renvois

// Pages du wiki (w/…) vers lesquelles pointe le corps d'une page (chapô et corps, sans ses propres renvois).
export function liensDuCorps(html, rel) {
  const c = html.indexOf('<div class="chapo">');
  const d = c >= 0 ? c : html.indexOf('<div class="page-body');
  let f = html.indexOf('<details class="backlinks"');
  if (f < 0) f = html.indexOf('</main>');
  const corps = html.slice(d, f);
  const out = new Set();
  for (const m of corps.matchAll(/<a href="([^"#]+\.html)(?:#[^"]*)?"/g)) {
    const cible = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1]));
    if (cible.startsWith('w/') && cible !== rel) out.add(cible);
  }
  return out;
}

// Liens gagnés et perdus par une page entre deux versions.
export function differenceLiens(avant, apres, rel) {
  const A = liensDuCorps(avant, rel), B = liensDuCorps(apres, rel);
  return { ajouts: [...B].filter(c => !A.has(c)), retraits: [...A].filter(c => !B.has(c)) };
}

// Bloc « Pages qui pointent ici » d'une page visée : ajoute et retire des pages sources.
// source(s) → { titre, wiki } (null : page inconnue du graphe, ignorée). Rend { html, ajoutes, retires }.
export function majRenvois(html, cible, { ajouts = [], retraits = [] }, source) {
  const m = html.match(/<details class="backlinks"><summary>Pages qui pointent ici \((\d+)\)<\/summary><ul>([\s\S]*?)<\/ul><\/details>/);
  if (!m) return { html, ajoutes: [], retires: [] };
  const racine = '../'.repeat(cible.split('/').length - 1);
  let items = [...m[2].matchAll(/<li>[\s\S]*?<\/li>/g)].map(x => x[0]);
  const tronque = items.includes('<li>…</li>');
  let n = Number(m[1]);
  const ajoutes = [], retires = [];
  for (const s of ajouts) {
    if (items.some(li => li.includes(`href="${racine}${s}"`))) continue;
    const src = source(s);
    if (!src) continue;
    items.push(`<li><a href="${racine}${s}">${esc(src.titre)}</a> <small class="bl-wiki">${src.wiki}</small></li>`);
    n++; ajoutes.push(s);
  }
  for (const s of retraits) {
    const avant = items.length;
    items = items.filter(li => !li.includes(`href="${racine}${s}"`));
    if (items.length < avant) { n--; retires.push(s); }
  }
  const titre = li => texteDe((li.match(/<a [^>]*>([\s\S]*?)<\/a>/) || [, '…'])[1]);
  const corps = items.filter(li => li !== '<li>…</li>').sort((x, y) => titre(x).localeCompare(titre(y), 'fr'));
  const liste = corps.slice(0, LIMITE).join('') + (n > LIMITE || tronque ? '<li>…</li>' : '');
  const bloc = `<details class="backlinks"><summary>Pages qui pointent ici (${n})</summary><ul>${liste}</ul></details>`;
  return { html: html.replace(m[0], () => bloc), ajoutes, retires };
}

// Arêtes du graphe (non orienté, [petit indice, grand indice]) : un lien ajouté crée l'arête ; un lien retiré
// l'enlève, sauf si la page visée pointe elle-même vers la source (retour(s) vrai).
export function majGraphe(g, cible, { ajouts = [], retraits = [] }, retour = () => false) {
  const idx = new Map(g.n.map((n, i) => [n.u, i]));
  const cle = (a, b) => [a, b].sort((x, y) => x - y);
  const aretes = new Set(g.e.map(([a, b]) => a + ',' + b));
  for (const s of ajouts) {
    if (!idx.has(s) || !idx.has(cible)) continue;
    const [a, b] = cle(idx.get(s), idx.get(cible));
    if (!aretes.has(a + ',' + b)) { g.e.push([a, b]); aretes.add(a + ',' + b); }
  }
  for (const s of retraits) {
    if (!idx.has(s) || !idx.has(cible) || retour(s)) continue;
    const [a, b] = cle(idx.get(s), idx.get(cible));
    g.e = g.e.filter(([x, y]) => !(x === a && y === b));
  }
  return g;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), D = path.join(R, 'docs');
  const args = process.argv.slice(2);
  const ecrire = args.includes('--ecrire');
  const i = args.indexOf('--depuis'); const ref = i >= 0 ? args[i + 1] : 'HEAD';
  const git = (...a) => execFileSync('git', a, { cwd: R, encoding: 'utf8', maxBuffer: 1 << 28 });
  const modifiees = git('diff', '--name-only', ref, '--', 'docs/w').split('\n').filter(f => f.endsWith('.html')).map(f => f.slice(5));
  const fGraphe = path.join(D, 'assets/graphe.json');
  const g = JSON.parse(fs.readFileSync(fGraphe, 'utf8'));
  const noeud = new Map(g.n.map(n => [n.u, n]));
  const source = s => noeud.has(s) ? { titre: noeud.get(s).t, wiki: g.wikis[noeud.get(s).w] } : null;
  const parCible = new Map();
  for (const rel of modifiees) {
    let avant; try { avant = git('show', `${ref}:docs/${rel}`); } catch { continue; } // page nouvelle
    const { ajouts, retraits } = differenceLiens(avant, fs.readFileSync(path.join(D, rel), 'utf8'), rel);
    for (const c of ajouts) (parCible.get(c) || parCible.set(c, { ajouts: [], retraits: [] }).get(c)).ajouts.push(rel);
    for (const c of retraits) (parCible.get(c) || parCible.set(c, { ajouts: [], retraits: [] }).get(c)).retraits.push(rel);
  }
  let nA = 0, nR = 0;
  for (const [cible, diff] of parCible) {
    const f = path.join(D, cible);
    if (!fs.existsSync(f)) { console.log('? page visée absente : ' + cible); continue; }
    const html = fs.readFileSync(f, 'utf8');
    const res = majRenvois(html, cible, diff, source);
    majGraphe(g, cible, diff, s => liensDuCorps(html, cible).has(s));
    for (const s of res.ajoutes) console.log(`+ ${s} → ${cible}`);
    for (const s of res.retires) console.log(`- ${s} ↛ ${cible}`);
    nA += res.ajoutes.length; nR += res.retires.length;
    if (ecrire && res.html !== html) fs.writeFileSync(f, res.html);
  }
  if (ecrire) fs.writeFileSync(fGraphe, JSON.stringify(g));
  console.log(`${modifiees.length} page(s) modifiée(s) depuis ${ref} ; ${nA} renvoi(s) ajouté(s), ${nR} retiré(s), ${parCible.size} page(s) visée(s)${ecrire ? ' (écrit)' : ' (essai)'}`);
}
