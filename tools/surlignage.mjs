// Surlignage coloré d'Obsidian : « ~={couleur}texte=~ » (parfois « ={{couleur}} », ou sans « =~ » final en fin de
// ligne) et sa forme sans couleur « ~=texte=~ ». marked y voyait un texte barré (« ~…~ ») et publiait
// « ={red}texte = » barré (27 septembre 2026). L'espace que la note met avant « =~ » sépare le mot suivant quand il
// est collé (« =~semaines »). Le code n'est pas touché (29 septembre 2026).

// Couleurs teintées par la feuille de style (mark.surligne-<couleur>) ; une autre couleur garde le surlignage par
// défaut, plutôt qu'une classe sans teinte.
export const COULEURS_SURLIGNAGE = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink'];

function marque(c, t) {
  const couleur = String(c || '').toLowerCase();
  return `<mark class="surligne${COULEURS_SURLIGNAGE.includes(couleur) ? ' surligne-' + couleur : ''}">${t.trim()}</mark>`;
}

// Applique f au Markdown hors du code, que f ne voit pas : blocs clôturés (``` ou ~~~, jusqu'à une clôture du même
// signe au moins aussi longue, ou jusqu'à la fin de la note, comme marked) et code en ligne (`…`, ``…``). Le code est
// mis de côté puis remis tel quel ; un surlignage peut donc contenir du code en ligne. Un bloc indenté de quatre
// espaces n'est pas reconnu : dans les notes, cette indentation est celle des listes imbriquées.
export function horsCode(md, f) {
  const mis = [];
  const garde = t => `${mis.push(t) - 1}`;
  const lignes = String(md).split('\n'), out = [];
  let bloc = null;
  for (const l of lignes) {
    const nue = l.replace(/\r$/, '');
    if (bloc) {
      bloc.push(l);
      const m = nue.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (m && m[1][0] === bloc.signe && m[1].length >= bloc.long) { out.push(garde(bloc.join('\n'))); bloc = null; }
      continue;
    }
    const m = nue.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (m && !(m[1][0] === '`' && m[2].includes('`'))) { bloc = Object.assign([l], { signe: m[1][0], long: m[1].length }); continue; }
    out.push(l);
  }
  if (bloc) out.push(garde(bloc.join('\n')));
  const s = out.join('\n').replace(/(?<![`\\])(`+)(?!`)((?:(?!\n[ \t]*\r?\n)[\s\S])*?[^`])\1(?!`)/g, m => garde(m));
  return f(s).replace(/(\d+)/g, (m, i) => mis[+i]);
}

export function surlignagesColores(s) {
  return horsCode(s, t => {
    // du plus intérieur au plus extérieur : un surlignage peut en contenir un autre
    let avant;
    do {
      avant = t;
      t = t.replace(/~=(?:\{\{?([a-zA-Z]+)\}\}?)?((?:(?!~=)[^\n])*?)=~/g, (m, c, x, i, tout) => marque(c, x) + (/\s$/.test(x) && /[\p{L}\p{N}]/u.test(tout[i + m.length] || '') ? ' ' : ''));
    } while (t !== avant);
    return t.replace(/~=\{\{?([a-zA-Z]+)\}\}?([^\n]*?)\s*=[ \t]*$/gm, (m, c, x) => marque(c, x));
  });
}

// Texte brut tiré de la note (index de recherche, extraits, sous-titres) : les marqueurs de couleur disparaissent,
// le texte surligné reste. Sans cela, « red », « purple »… entraient dans l'index des notes d'analyse.
export function sansMarqueursSurlignage(s) {
  return String(s).replace(/~?=\{\{?[a-zA-Z]+\}\}?/g, ' ');
}

// Même transformation sur une page déjà publiée (texte barré produit par marked, ou syntaxe restée telle
// quelle) : sert à reposer les pages sans reconstruire le site. Le résultat est celui que le générateur
// produit désormais à partir de la note.
export function surlignagesColoresHtml(html) {
  // « ~={orange}~15-18 % =~ » : le « ~ » d'approximation ouvrait le barré
  html = html.replace(/~=\{\{?([a-zA-Z]+)\}\}?<del>([\s\S]*?)=<\/del>/g, (m, c, t) => marque(c, '~' + t));
  // barrés imbriqués : du plus intérieur au plus extérieur
  let avant;
  do {
    avant = html;
    html = html.replace(/<del>=(?:\{\{?([a-zA-Z]+)\}\}?)?((?:(?!<del>)[\s\S])*?)=<\/del>/g, (m, c, t) => marque(c, t));
  } while (html !== avant);
  return html
    // syntaxe restée telle quelle (fermeture « =~ » collée au mot suivant, ou absente en fin de ligne)
    .replace(/~=(?:\{\{?([a-zA-Z]+)\}\}?)?([^<\n]*?)=~/g, (m, c, t, i, tout) => marque(c, t) + (/\s$/.test(t) && /[\p{L}\p{N}]/u.test(tout[i + m.length] || '') ? ' ' : ''))
    .replace(/~=\{\{?([a-zA-Z]+)\}\}?([^<\n]*?)\s*=[ \t]*(?=<\/(?:li|td|p)>|\n)/g, (m, c, t) => marque(c, t));
}

// Sommaire d'une page déjà publiée : le générateur y met le texte du titre sans balises. Le barré de marked y
// laissait « ={purple}dyade = » ; le générateur y met désormais « dyade ».
export function sommaireSansSurlignage(texte) {
  return texte.replace(/=\{\{?[a-zA-Z]+\}\}?([^=<]*?)\s*=(?=\s|<|$)/g, (m, t) => t.trim());
}
