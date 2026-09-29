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

// Pages du wiki (w/…) vers lesquelles pointe une page, comme les compte le générateur : chapô et corps de la note,
// sans « Voir aussi », « Voisins », renvois ni les listes qu'il ajoute aux pages de thème.
const FINS = ['\n<nav class="voir-aussi"', '\n<nav class="voisins"', '\n<details class="backlinks"', '\n<section class="avis"', '</main>', '<h2>Articles de ce thème'];
export function liensDuCorps(html, rel) {
  const c = html.indexOf('<div class="chapo">');
  const d = c >= 0 ? c : html.indexOf('<div class="page-body');
  if (d < 0) return new Set();
  let f = html.length;
  for (const m of FINS) { const k = html.indexOf(m, d); if (k >= 0 && k < f) f = k; }
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

// Le générateur ne pose le bloc « Pages qui pointent ici » que sur un article, entre « Voir aussi » et le bloc d'avis :
// à vide, cet emplacement laisse une ligne vide juste avant le bloc d'avis.
const EMPLACEMENT = '\n\n<section class="avis"';
const estArticle = html => !html.includes('accueil-banniere') && !html.includes('Un thème du wiki') && html.includes(EMPLACEMENT);
const RE_BLOC = /<details class="backlinks"><summary>Pages qui pointent ici \((\d+)\)<\/summary><ul>([\s\S]*?)<\/ul><\/details>/;

// Bloc « Pages qui pointent ici » d'une page visée, mis à jour pour des pages sources qui y pointent désormais
// (ajouts) ou plus (retraits). source(s) → { titre, wiki } (null : page inconnue du graphe, ignorée).
// Le compte suit les liens, que la source soit visible ou non dans la liste. Au-delà de 60 renvois, le générateur
// n'affiche que les 60 premiers par titre : « caches » donne les autres sources connues, pour faire remonter la
// suivante quand une source visible s'en va. Rend { html, ajoutes, retires, incomplet } ; incomplet : la liste
// affichée compte moins d'entrées qu'elle ne devrait (source suivante inconnue).
export function majRenvois(html, cible, { ajouts = [], retraits = [] }, source, { caches = [] } = {}) {
  const racine = '../'.repeat(cible.split('/').length - 1);
  const li = (s, src) => `<li><a href="${racine}${s}">${esc(src.titre)}</a> <small class="bl-wiki">${src.wiki}</small></li>`;
  const titre = x => texteDe((x.match(/<a [^>]*>([\s\S]*?)<\/a>/) || [, '…'])[1]);
  const trier = l => l.sort((x, y) => titre(x).localeCompare(titre(y), 'fr'));
  const bloc = (n, items) => `<details class="backlinks"><summary>Pages qui pointent ici (${n})</summary><ul>${items.slice(0, LIMITE).join('')}${n > LIMITE ? '<li>…</li>' : ''}</ul></details>`;
  const m = html.match(RE_BLOC);
  if (!m) {
    // première page qui pointe ici
    const nouveaux = [...new Set(ajouts)].filter(s => source(s));
    if (!nouveaux.length || !estArticle(html)) return { html, ajoutes: [], retires: [], incomplet: false };
    const items = trier(nouveaux.map(s => li(s, source(s))));
    const k = html.indexOf(EMPLACEMENT);
    return { html: html.slice(0, k) + '\n' + bloc(nouveaux.length, items) + EMPLACEMENT.slice(1) + html.slice(k + EMPLACEMENT.length), ajoutes: nouveaux, retires: [], incomplet: false };
  }
  let items = [...m[2].matchAll(/<li>[\s\S]*?<\/li>/g)].map(x => x[0]).filter(x => x !== '<li>…</li>');
  const present = s => items.some(x => x.includes(`href="${racine}${s}"`));
  let n = Number(m[1]);
  const ajoutes = [], retires = [];
  for (const s of ajouts) {
    if (present(s)) continue;
    const src = source(s);
    if (!src) continue;
    items.push(li(s, src)); n++; ajoutes.push(s);
  }
  for (const s of retraits) {
    // la source pointait ici : elle était comptée, visible ou non
    items = items.filter(x => !x.includes(`href="${racine}${s}"`));
    n--; retires.push(s);
  }
  // sources cachées au-delà de la 60e, pour combler la liste
  for (const s of caches) {
    if (present(s) || retraits.includes(s)) continue;
    const src = source(s);
    if (src) items.push(li(s, src));
  }
  items = trier(items);
  const incomplet = Math.min(n, LIMITE) > Math.min(items.length, LIMITE);
  return { html: html.replace(m[0], () => bloc(n, items)), ajoutes, retires, incomplet };
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
  // Listes tronquées (plus de 60 renvois) : les sources cachées se retrouvent dans les liens de toutes les pages
  // publiées, à condition que cette reconstruction redonne la liste et le compte publiés (sinon : avertissement).
  let index = null;
  const indexDesLiens = () => {
    if (index) return index;
    index = new Map();
    (function walk(d, rel) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const r = rel + e.name;
        if (e.isDirectory()) walk(path.join(d, e.name), r + '/');
        else if (e.name.endsWith('.html')) for (const c of liensDuCorps(fs.readFileSync(path.join(d, e.name), 'utf8'), r)) (index.get(c) || index.set(c, new Set()).get(c)).add(r);
      }
    })(path.join(D, 'w'), 'w/');
    return index;
  };
  let nA = 0, nR = 0;
  for (const [cible, diff] of parCible) {
    const f = path.join(D, cible);
    if (!fs.existsSync(f)) { console.log('? page visée absente : ' + cible); continue; }
    const html = fs.readFileSync(f, 'utf8');
    let caches = [];
    const bloc = html.match(/Pages qui pointent ici \((\d+)\)<\/summary><ul>([\s\S]*?)<\/ul>/);
    if (bloc && Number(bloc[1]) > LIMITE) {
      const racine = '../'.repeat(cible.split('/').length - 1);
      const visibles = [...bloc[2].matchAll(/<li><a href="([^"]+)"/g)].map(x => x[1].slice(racine.length));
      const maintenant = indexDesLiens().get(cible) || new Set();
      // état publié : les sources d'aujourd'hui, moins les liens ajoutés, plus les liens retirés
      const avant = new Set([...maintenant].filter(s => !diff.ajouts.includes(s)).concat(diff.retraits));
      if (avant.size === Number(bloc[1]) && visibles.every(s => avant.has(s))) caches = [...maintenant].filter(s => !visibles.includes(s));
      else console.log(`! ${cible} : liste tronquée non reconstructible (${avant.size} sources trouvées pour ${bloc[1]} publiées)`);
    }
    const res = majRenvois(html, cible, diff, source, { caches });
    if (res.incomplet) console.log(`! ${cible} : liste incomplète, la source suivante est inconnue ; la prochaine construction la complétera`);
    majGraphe(g, cible, diff, s => liensDuCorps(html, cible).has(s));
    for (const s of res.ajoutes) console.log(`+ ${s} → ${cible}`);
    for (const s of res.retires) console.log(`- ${s} ↛ ${cible}`);
    nA += res.ajoutes.length; nR += res.retires.length;
    if (ecrire && res.html !== html) fs.writeFileSync(f, res.html);
  }
  if (ecrire) fs.writeFileSync(fGraphe, JSON.stringify(g));
  console.log(`${modifiees.length} page(s) modifiée(s) depuis ${ref} ; ${nA} renvoi(s) ajouté(s), ${nR} retiré(s), ${parCible.size} page(s) visée(s)${ecrire ? ' (écrit)' : ' (essai)'}`);
}
