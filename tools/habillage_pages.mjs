// Habillage du portail, de la page Thèmes et des pages de thème (27 septembre 2026), appliqué à des pages
// déjà publiées : le résultat est celui que le générateur produit désormais (build_site.mjs,
// portail_racine.mjs). Sert à reposer ces pages sans reconstruire le site.
import { icone, iconeTheme, illustrationWiki } from './accueil_wiki.mjs';

const dec = t => String(t).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const picto = (titre, i) => `<span class="accueil-theme-icone teinte-${i % 6 + 1}" aria-hidden="true">${icone(iconeTheme(dec(titre)))}</span>`;

// Portail racine : titre à « SST » en accent, illustrations des wikis, pictogrammes des cartes de sujets.
export function habillerPortail(html) {
  const PICTOS = { '🏷️': 'mdiTagOutline', '🗂️': 'mdiLayersTripleOutline', '🔧': 'mdiWrench', '🎓': 'mdiSchoolOutline' };
  return html
    .replace('<h1>WIKI SST — Mines</h1>', '<h1>WIKI <span class="brand-sst">SST</span> — Mines</h1>')
    .replace(/(<a class="portal-card" href="w\/([a-z-]+)\/[^"]*">\n\s*)<span class="portal-icon">[^<]*<\/span>/g,
      (m, debut, slug) => illustrationWiki(slug) ? `${debut}<span class="portal-icon portal-illu" aria-hidden="true">${illustrationWiki(slug)}</span>` : m)
    .replace(/<span class="portal-icon">(🏷️|🗂️|🔧|🎓)<\/span>/g, (m, e) => `<span class="portal-icon portal-picto" aria-hidden="true">${icone(PICTOS[e])}</span>`);
}

// Page Thèmes : un bloc par wiki, une ligne par thème (pictogramme teinté, titre, « N articles », chevron).
export function habillerPageThemes(html) {
  return html.replace(/<h2>[^<]*? ([^<]+?) <small>\((\d+)\)<\/small><\/h2><ul class="cat-pages">([\s\S]*?)<\/ul>/g, (m, nom, n, items) => {
    const lignes = [...items.matchAll(/<li><a href="([^"]+)">([^<]*)<\/a> <small class="cat-compte">(\d+)<\/small><\/li>/g)];
    const slug = (lignes[0]?.[1].match(/w\/([a-z-]+)\//) || [])[1];
    const illu = illustrationWiki(slug);
    const li = lignes.map(([, url, titre, k], i) => `<li><a href="${url}">${picto(titre, i)}<span class="themes-nom">${titre}</span><small class="cat-compte">${k} article${+k > 1 ? 's' : ''}</small><span class="accueil-chevron" aria-hidden="true"></span></a></li>`).join('');
    const tete = illu ? `<span class="themes-wiki-illu" aria-hidden="true">${illu}</span>` : (m.match(/^<h2>(\S+) /) || [])[1] + ' ';
    return `<section class="themes-wiki"><h2 class="themes-wiki-titre">${tete}${nom} <small>(${n})</small></h2><ul class="themes-liste">${li}</ul></section>`;
  });
}

// Page de thème : notions en lignes, autres thèmes à pictogramme teinté (teinte selon la place du thème dans
// la liste alphabétique du wiki : `themesDuWiki`, titres dans l'ordre de la page Thèmes).
export function habillerPageTheme(html, themesDuWiki) {
  return html
    .replace(/(<h2>Articles de ce thème \(\d+\)<\/h2>\n)<ul class="cat-pages">/, '$1<ul class="cat-pages theme-notions">')
    .replace(/<h2>Autres thèmes du wiki<\/h2><ul class="cat-pages">([\s\S]*?)<\/ul>/, (m, items) =>
      '<h2>Autres thèmes du wiki</h2><ul class="cat-pages theme-voisins">' + items.replace(/<li><a href="([^"]+)">([^<]*)<\/a><\/li>/g, (x, url, titre) =>
        `<li><a href="${url}">${picto(titre, Math.max(0, themesDuWiki.indexOf(dec(titre))))}${titre}</a></li>`) + '</ul>');
}
