// Surlignage coloré d'Obsidian : « ~={couleur}texte=~ » (parfois « ={{couleur}} », ou sans « =~ » final en fin de
// ligne). marked y voyait un texte barré (« ~…~ ») et publiait « ={red}texte = » barré (27 septembre 2026).
// L'espace que la note met avant « =~ » sépare le mot suivant quand il est collé (« =~semaines »).
export function surlignagesColores(s) {
  const marque = (c, t) => `<mark class="surligne${c ? ' surligne-' + c : ''}">${t.trim()}</mark>`;
  // du plus intérieur au plus extérieur : un surlignage peut en contenir un autre
  let avant;
  do {
    avant = s;
    s = s.replace(/~=(?:\{\{?([a-z]+)\}\}?)?((?:(?!~=)[^\n])*?)=~/g, (m, c, t, i, tout) => marque(c, t) + (/\s$/.test(t) && /[\p{L}\p{N}]/u.test(tout[i + m.length] || '') ? ' ' : ''));
  } while (s !== avant);
  return s.replace(/~=\{\{?([a-z]+)\}\}?([^\n]*?)\s*=[ \t]*$/gm, (m, c, t) => marque(c, t));
}

// Même transformation sur une page déjà publiée (texte barré produit par marked, ou syntaxe restée telle
// quelle) : sert à reposer les pages sans reconstruire le site. Le résultat est celui que le générateur
// produit désormais à partir de la note.
export function surlignagesColoresHtml(html) {
  const marque = (c, t) => `<mark class="surligne${c ? ' surligne-' + c : ''}">${t.trim()}</mark>`;
  // « ~={orange}~15-18 % =~ » : le « ~ » d'approximation ouvrait le barré
  html = html.replace(/~=\{\{?([a-z]+)\}\}?<del>([\s\S]*?)=<\/del>/g, (m, c, t) => marque(c, '~' + t));
  // barrés imbriqués : du plus intérieur au plus extérieur
  let avant;
  do {
    avant = html;
    html = html.replace(/<del>=(?:\{\{?([a-z]+)\}\}?)?((?:(?!<del>)[\s\S])*?)=<\/del>/g, (m, c, t) => marque(c, t));
  } while (html !== avant);
  return html
    // syntaxe restée telle quelle (fermeture « =~ » collée au mot suivant, ou absente en fin de ligne)
    .replace(/~=(?:\{\{?([a-z]+)\}\}?)?([^<\n]*?)=~/g, (m, c, t, i, tout) => marque(c, t) + (/\s$/.test(t) && /[\p{L}\p{N}]/u.test(tout[i + m.length] || '') ? ' ' : ''))
    .replace(/~=\{\{?([a-z]+)\}\}?([^<\n]*?)\s*=[ \t]*(?=<\/(?:li|td|p)>|\n)/g, (m, c, t) => marque(c, t));
}
