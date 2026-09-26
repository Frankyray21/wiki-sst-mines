// Versions texte dépliables retirées du site (demandes de Frank, 26 septembre 2026 : « Retire section lire
// schéma en texte », puis « Oui retire aussi les autres »). Chaque schéma, infographie ou illustration garde
// son image, son texte alternatif, sa légende et ses sources ; seule la section « Lire … en texte » disparaît.
//
// Sont visés :
//   - tout <details class="infographie-texte"> : « Lire le schéma en texte » sous les schémas, « Lire la
//     version texte — … », « Lire les voies en texte », « Lire la comparaison en texte », « Les six repères en
//     texte »… sous les infographies ;
//   - un <details> sans classe dont le résumé est « Lire … en texte » : « Lire l’illustration en texte », sous
//     les illustrations de « Définition et typologie des conflits au travail ».
// Aucun autre <details> n'est touché (« Pages qui pointent ici », volets d'accueil, détails écrits dans une note).

const RESUME_ILLUSTRATION = /^Lire .+ en texte$/;
const estVersionTexte = (classe, resume) => classe ? classe === 'infographie-texte' : RESUME_ILLUSTRATION.test(resume.trim());

// Un <details> (sans <details> imbriqué) : classe éventuelle, résumé, fin de ligne qui suit.
const DETAILS = /<details(?: class="([^"]*)")?>\s*<summary>((?:(?!<\/summary>)[^<])*)<\/summary>(?:(?!<\/?details\b)[\s\S])*<\/details>(\r?\n)?/g;

// Page rendue (sortie de marked, ou page publiée) : le bloc disparaît avec la fin de ligne qui le suit, comme le
// générateur le rend depuis une note où il n'est plus.
export function sansVersionsTexte(html) {
  return String(html).replace(DETAILS, (m, classe, resume) => estVersionTexte(classe, resume) ? '' : m);
}

// Note du vault (Markdown, LF ou CRLF, éventuellement dans un encadré « > »), lue par le générateur avant le
// rendu, l'index de recherche et les extraits, et nettoyée par tools/retirer_versions_texte.mjs.
//   - bloc sur ses propres lignes (<details class="infographie-texte"> … </details>) : ses lignes sont retirées,
//     et une ligne vide laissée en double avec lui ;
//   - <details> écrit dans une ligne (légende d'une illustration) : retiré de la ligne, qui reste.
const OUVERTURE = /^[ \t]*(?:>[ \t]?)*<details(?: class="([^"]*)")?>[ \t]*$/;
const RESUME = /^[ \t]*(?:>[ \t]?)*<summary>((?:(?!<\/summary>)[^<])*)<\/summary>[ \t]*$/;
const FERMETURE = /^[ \t]*(?:>[ \t]?)*<\/details>[ \t]*$/;
const VIDE = /^[ \t]*(?:>[ \t]*)*$/;
const DETAILS_LIGNE = /<details(?: class="([^"]*)")?>[ \t]*<summary>((?:(?!<\/summary>)[^<\n])*)<\/summary>(?:(?!<\/?details\b)[^\n])*<\/details>/g;

export function sansVersionsTexteMd(md) {
  const texte = String(md);
  const nl = texte.includes('\r\n') ? '\r\n' : '\n';
  const lignes = texte.split(/\r?\n/);
  let change = false;
  const retirer = (debut, n) => {
    change = true;
    lignes.splice(debut, n);
    // pas de ligne vide en double là où était le bloc
    if (debut > 0 && debut < lignes.length && VIDE.test(lignes[debut - 1]) && VIDE.test(lignes[debut])) lignes.splice(debut, 1);
  };
  for (let i = 0; i < lignes.length; i++) {
    const o = lignes[i].match(OUVERTURE);
    const r = o && (lignes[i + 1] || '').match(RESUME);
    if (r && estVersionTexte(o[1], r[1])) {
      let fin = i + 2;
      while (fin < lignes.length && !FERMETURE.test(lignes[fin]) && !OUVERTURE.test(lignes[fin])) fin++;
      if (fin < lignes.length && FERMETURE.test(lignes[fin])) { retirer(i, fin - i + 1); i--; continue; }
      continue; // bloc sans fin : on n'y touche pas
    }
    // <details> tenu dans la ligne : retiré ; la ligne part aussi si elle ne portait que lui
    const nette = lignes[i].replace(DETAILS_LIGNE, (m, classe, resume) => estVersionTexte(classe, resume) ? '' : m);
    if (nette === lignes[i]) continue;
    if (VIDE.test(nette)) { retirer(i, 1); i--; } else { lignes[i] = nette; change = true; }
  }
  // note sans version texte : rendue telle quelle, fins de ligne mêlées comprises
  return change ? lignes.join(nl) : texte;
}
