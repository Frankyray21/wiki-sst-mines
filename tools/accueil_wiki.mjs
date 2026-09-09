// Pages d'accueil des wikis (« 00 - 🏠 Accueil … », frontmatter `type: accueil`) et des sections
// travailleurs / gestionnaires : rendues comme la page d'accueil d'un vrai wiki — bandeau de
// bienvenue, une boîte par section de la note, listes en colonnes — et non comme un article
// ordinaire avec infobox, sommaire et sous-titre « Un article du wiki ». Le contenu reste celui de
// la note ; on retire seulement les préfixes de classement des titres (« 15 - Navigation ») et les
// artefacts illisibles (nom de fichier d'une vidéo non publiée, wikilink resté brut, item qui ne
// mène qu'à une source interne), et chaque retrait est signalé à la construction.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// même règle que le sommaire du générateur : préfixe « 15 - » retiré, titres numérotés légitimes conservés
const EMOJIS_DE_TETE = /^(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}️?)*|\s)+/u;
const MEDIA = /^!?[^\s<>]+\.(?:mp4|m4a|mp3|png|jpe?g|gif|svg|webp|pdf)$/i;
// entrée « point d'entrée » : un emoji, un lien, au plus une courte description après un tiret
const ENTREE_TUILE = /^\s*(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}️?)*)\s*<a [^>]*>[^<]+<\/a>\s*(?:[-–—:]\s*[^<]*)?$/u;

export function estAccueil({ fm, base }) {
  return String(fm?.type ?? '').trim().toLowerCase() === 'accueil' || /^00 - .*Accueil/u.test(String(base));
}
export function titreAccueil(titre) {
  return String(titre).replace(EMOJIS_DE_TETE, '').trim() || String(titre).trim();
}
export function libelleSection(inner) {
  // le préfixe peut se trouver dans le texte d'un lien : « <a …>20 - Articles internes</a> »
  const t = inner.trim().replace(/^((?:<[^>]+>\s*)*)(\d{1,3} +[-–—] +)(?=\p{L})/u, '$1');
  return t || inner.trim();
}

// Corps d'une page publiée (entre <div class="page-body"> et les blocs voisins / backlinks / page-meta).
export function extraireCorps(html) {
  const marque = '<div class="page-body">\n';
  const debut = html.indexOf(marque), fin = html.indexOf('<div class="page-meta">');
  if (debut < 0 || fin < 0) return null;
  const avant = html.slice(debut + marque.length, fin)
    .replace(/\s*<details class="backlinks">[\s\S]*?<\/details>\s*$/, '')
    .replace(/\s*<nav class="voisins"[^>]*>[\s\S]*?<\/nav>\s*$/, '')
    .replace(/\s*$/, '');
  return avant.endsWith('</div>') ? avant.slice(0, -6).replace(/\s*$/, '') : null;
}

// Découpe le corps rendu d'une note d'accueil : chapeau (avant le premier h2) et sections (un h2
// chacune, sous-groupes h3 conservés). `resoudre(cible)` rend l'URL d'une page du site, ou null.
export function decouperAccueil(html, { resoudre } = {}) {
  const retires = [], repares = [];
  const lienRepare = (cible, alias) => {
    const url = resoudre ? resoudre(cible.trim()) : null;
    repares.push(cible.trim() + (url ? '' : ' (page introuvable)'));
    return url ? `<a href="${url}">${alias}</a>` : `<span class="new" title="Page introuvable : ${esc(cible.trim())}">${alias}</span>`;
  };
  let h = html;
  // 1. paragraphe réduit au nom d'un fichier média, ou à « [fichier introuvable : …] » : l'embarquement
  //    n'a pas pu être rendu, et un nom de fichier ne dit rien au lecteur
  h = h.replace(/<p>([^<\n]+)<\/p>\n?/g, (m, texte) => { if (!MEDIA.test(texte.trim())) return m; retires.push(`paragraphe « ${texte.trim()} »`); return ''; });
  h = h.replace(/<p>\s*<span class="missing-file">([^<]*)<\/span>\s*<\/p>\n?/g, (m, texte) => { retires.push(`paragraphe « ${texte.trim()} »`); return ''; });
  // 2. item qui ne mène nulle part : source interne non publiée, article retiré, fichier introuvable
  h = h.replace(/<li>\s*[^<\n]*<span class="(?:interne-inline|abroge-inline|missing-file)"[^>]*>[\s\S]*?<\/span>\s*<\/li>\n?/g, (m) => { retires.push(`item « ${m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()} »`); return ''; });
  // 2 bis. item vide
  h = h.replace(/<li>\s*<\/li>\n?/g, () => { retires.push('item vide'); return ''; });
  // 3. wikilinks restés bruts dans la note (crochets non fermés, alias imbriqué) : l'alias qui porte
  //    déjà des liens rendus est gardé tel quel ; sinon il devient un lien vers la cible, ou un lien rouge
  h = h.replace(/\[\[([^\[\]|<\n]+)\|([\s\S]*?)\]{0,2}(?=<\/li>|<\/p>)/g, (m, cible, alias) => {
    if (/<a /.test(alias)) { repares.push(m.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 60)); return alias.trim(); }
    return lienRepare(cible, alias.trim());
  });
  h = h.replace(/\[\[([^\[\]|<\n]+?)\]{0,2}(?=<\/li>|<\/p>)/g, (m, cible) => lienRepare(cible, cible.trim()));

  const parties = h.split(/(?=<h2 id=")/);
  const chapeau = parties[0].trim();
  const sections = [];
  for (const seg of parties.slice(1)) {
    const m = seg.match(/^<h2 id="([^"]*)">([\s\S]*?)<\/h2>\n?/);
    if (!m) continue;
    let corps = seg.slice(m[0].length).trim();
    if (!/<a |<td|<p>|<li>/.test(corps)) { retires.push(`section vide « ${m[2].replace(/<[^>]+>/g, '')} »`); continue; }
    corps = colonnes(corps);
    // sous-groupes h3 : chacun dans un bloc, pour couler en colonnes
    // split sur un lookahead en position 0 ne produit pas d'élément vide : on l'ajoute
    const groupes = (corps.startsWith('<h3 id="') ? [''] : []).concat(corps.split(/(?=<h3 id=")/));
    if (groupes.length > 1) {
      corps = groupes[0] + `<div class="accueil-groupes">` + groupes.slice(1).map(g => `<div class="accueil-groupe">${g.replace(/<h3 id="([^"]*)">([\s\S]*?)<\/h3>/, (x, id, inner) => `<h3 id="${id}">${libelleSection(inner)}</h3>`)}</div>`).join('') + `</div>`;
    }
    sections.push({ id: m[1], titre: libelleSection(m[2]), html: corps, grand: groupes.length > 1 || nbItems(corps) >= 12 });
  }
  return { chapeau, sections, retires, repares };
}

function nbItems(html) { return (html.match(/<li>/g) || []).length; }
// entrées de premier niveau d'une liste (les sous-listes ne comptent pas)
function entreesNiveau1(bloc) {
  const entrees = []; let p = 0, i = 0;
  while (i < bloc.length) {
    if (bloc.startsWith('<ul', i)) p++;
    else if (bloc.startsWith('</ul>', i)) p--;
    else if (p === 1 && bloc.startsWith('<li>', i)) { const fin = bloc.indexOf('</li>', i); entrees.push(bloc.slice(i + 4, fin < 0 ? bloc.length : fin)); }
    i++;
  }
  return entrees;
}

// Les listes de huit entrées ou plus coulent en colonnes ; une liste de deux à huit points d'entrée
// (emoji + lien, comme « Démarrage rapide par rôle ») devient une grille de tuiles. Classes posées
// sur les <ul> de premier niveau.
export function colonnes(html) {
  let sortie = '', profondeur = 0, i = 0;
  while (i < html.length) {
    if (html.startsWith('<ul>', i)) {
      if (profondeur === 0) {
        const fin = finDeListe(html, i);
        const bloc = html.slice(i, fin);
        // entrées courtes (au plus 24 caractères) : deux colonnes même sur un petit téléphone
        const entrees = entreesNiveau1(bloc);
        const courtes = entrees.every(e => e.replace(/<[^>]+>/g, '').trim().length <= 24);
        const tuiles = entrees.length >= 2 && entrees.length <= 8 && entrees.every(e => ENTREE_TUILE.test(e));
        sortie += tuiles ? '<ul class="accueil-tuiles">' + bloc.slice(4)
          : entrees.length >= 8 ? `<ul class="accueil-colonnes${courtes ? ' accueil-colonnes-courtes' : ''}">` + bloc.slice(4) : bloc;
        i = fin; continue;
      }
      profondeur++;
    }
    sortie += html[i]; i++;
  }
  return sortie;
}
function finDeListe(html, debut) {
  let p = 0, i = debut;
  while (i < html.length) {
    if (html.startsWith('<ul', i)) p++;
    else if (html.startsWith('</ul>', i)) { p--; if (p === 0) return i + 5; }
    i++;
  }
  return html.length;
}

// Pied d'une page d'accueil : la date de génération seule — les indicateurs éditoriaux (relecture,
// vérification des sources) et les outils qualifient des articles, pas une page de navigation.
export function piedAccueil(date) {
  return `<div class="page-meta">Site généré le ${esc(date)}</div>`;
}

// HTML de la page (sans fil d'Ariane ni pied de page, fournis par l'habillage commun).
export function rendreAccueil({ titre, icone, sousTitre, chapeau, sections, index = [] }) {
  const boites = sections.map(s =>
    `<section class="accueil-boite${s.grand ? ' accueil-large' : ''}" aria-labelledby="${s.id}"><h2 class="accueil-titre" id="${s.id}">${s.titre}</h2><div class="accueil-corps">\n${s.html}\n</div></section>`).join('\n');
  // <header class="article-titre"> reste tel quel : la barre de lecture s'insère après .page-sub
  // et verif_site exige ce groupe titre + domaine sur toute page à corps.
  return `<div class="accueil-banniere">
<span class="accueil-icone" aria-hidden="true">${icone}</span>
<header class="article-titre">
<h1 class="page-title">${esc(titreAccueil(titre))}</h1>
<div class="page-sub">${sousTitre}</div>
</header>
</div>
${chapeau ? `<div class="accueil-chapeau">${chapeau}</div>` : ''}
${index.length ? `<nav class="accueil-index" aria-label="Index et outils du wiki">${index.map(l => `<a href="${l.url}">${esc(l.libelle)}</a>`).join(' <span class="crumb-sep">·</span> ')}</nav>` : ''}
<div class="page-body accueil-grille">
${boites}
</div>`;
}
