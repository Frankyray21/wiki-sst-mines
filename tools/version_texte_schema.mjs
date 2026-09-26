// « Lire le schéma en texte » retiré des schémas (demande de Frank, 26 septembre 2026) : chaque schéma garde
// son texte alternatif, sa légende et ses sources, sans version texte dépliable en dessous.
//
// Les autres versions texte ne sont pas concernées : seul ce résumé exact est visé. Il en reste sous les
// infographies d'hygiène, d'ergonomie et de toxicologie (« Lire la version texte — … », « Lire les voies en
// texte ») et sous les illustrations de « Définition et typologie des conflits au travail » (« Lire
// l’illustration en texte »).
export const RESUME_VERSION_TEXTE = 'Lire le schéma en texte';

// Note du vault (Markdown, LF ou CRLF, éventuellement dans un encadré « > ») : les lignes du bloc <details>,
// de la ligne d'ouverture à « </details> » comprise. Appliqué dès la lecture de la note par le générateur,
// pour que ni la page, ni l'index de recherche, ni les extraits ne reprennent ce texte.
const DETAILS_MD = /^[ \t]*(?:>[ \t]?)*<details class="infographie-texte">[ \t]*\r?\n[ \t]*(?:>[ \t]?)*<summary>Lire le schéma en texte<\/summary>[ \t]*\r?\n(?:(?!<\/details>)[\s\S])*<\/details>[ \t]*(?:\r?\n|$)/gm;

export function sansVersionTexteSchemaMd(md) {
  return String(md).replace(DETAILS_MD, '');
}

// Page publiée : le bloc <details> que le générateur rend entre la légende et les sources d'un schéma.
const DETAILS_HTML = /<details class="infographie-texte">\n<summary>Lire le schéma en texte<\/summary>\n(?:(?!<\/details>)[\s\S])*<\/details>\n?/g;

export function sansVersionTexteSchema(html) {
  return String(html).replace(DETAILS_HTML, '');
}
