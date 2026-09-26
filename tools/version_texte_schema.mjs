// « Lire le schéma en texte » retiré des schémas (demande de Frank, 26 septembre 2026) : chaque schéma garde
// son texte alternatif, sa légende et ses sources, sans version texte dépliable en dessous.
//
// Les autres versions texte (« Lire la version texte — … » des infographies d'hygiène, d'ergonomie et de
// toxicologie) ne sont pas concernées : seul ce résumé exact est visé.
export const RESUME_VERSION_TEXTE = 'Lire le schéma en texte';

// Page publiée : le bloc <details> que le générateur rend entre la légende et les sources d'un schéma.
const DETAILS_HTML = /<details class="infographie-texte">\n<summary>Lire le schéma en texte<\/summary>\n(?:(?!<\/details>)[\s\S])*<\/details>\n?/g;

export function sansVersionTexteSchema(html) {
  return String(html).replace(DETAILS_HTML, '');
}
