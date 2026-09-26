// Texte affiché d'un wikilink écrit sans texte explicite ([[Cible]], et non [[Cible|texte]]) quand il
// mène à une page du site. Module pur, partagé par build_site.mjs et par tools/raccourcir_liens.mjs.
//
// Règle du 26 septembre 2026 : une phrase se lit comme l'auteur l'a écrite.
//   - En pleine phrase, le mot saisi s'affiche : « Aviser la [[CNESST]] que… » reste « Aviser la CNESST
//     que… », « [[Silice cristalline]] respirable » ne devient plus « Programme de prévention silice
//     cristalline respirable ». C'est aussi ce qu'affiche Obsidian.
//   - Le titre descriptif de la page cible s'affiche à la place du mot saisi :
//       · pour un nom de code, qui n'est pas un mot de la phrase : article de loi (« art-59-LATMP » devient
//         « art-59-LATMP : salaire de la journée de la lésion »), forme technique (« charge-mentale »),
//         identifiant (« INDEX_NOTES_WIKI »), note de classement numérotée (« 50 - Jurisprudence marquante ») ;
//       · pour une note d'analyse d'étude (« Analyse Karasek (1979) ») : elle est citée par son titre
//         bibliographique, comme avant ;
//       · sur une ligne faite seulement de liens (« Voir aussi », liste de pages) et dans une cellule de
//         tableau qui ne contient que le lien (colonne « Article » d'un index) : le titre y renseigne mieux
//         que le nom de fichier ;
//       · quand le mot saisi ne diffère du titre que par la ponctuation : un nom de fichier ne peut pas porter
//         « / » ni « : » (« Comparatif des cycles FIFO (14-14, 20-10, 21-7) » s'affiche avec ses barres).
//   - Un lien passé par un alias affiche toujours le mot saisi : « [[ISO 2631]] » reste « ISO 2631 ».

import { estEtude } from './qualite.mjs';

// Clé de comparaison par défaut : casse, accents et ponctuation ignorés (build_site.mjs passe la sienne,
// qui unifie aussi les numéros romains et les zéros de tête des noms de sections).
export function cleSouple(s) {
  return String(s).toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Nom de fichier qui n'est pas un mot de la phrase.
export function estNomDeCode(nom) {
  const s = String(nom || '').trim();
  return /^art[-.\s]\s*\d/i.test(s)                           // art-59-LATMP, art. 51 LSST
    || /^[\p{Ll}\d]+(?:[-_][\p{Ll}\d]+)+$/u.test(s)           // charge-mentale, job_strain
    || /^[\p{Lu}\d]+(?:_[\p{Lu}\d]+)+$/u.test(s)              // INDEX_NOTES_WIKI
    || /^\d+\s*-\s+\S/.test(s);                               // 50 - Jurisprudence marquante
}

// Note d'analyse d'une étude, nommée « Analyse <auteurs> (<année>) » ou « Analyse - … ».
export function estNoteDAnalyse(nom) {
  const s = String(nom || '').trim();
  return /^Analyse\b/i.test(s) && estEtude(s);
}

// Un lien, dans la ligne : wikilink, renvoi d'image, lien markdown.
const LIEN = /!?\[\[[^\[\]\n]*\]\]|!?\[[^\]\n]*\]\([^)\n]*\)/g;
// Ce qui peut séparer les liens d'une liste : ponctuation, flèches, barres de tableau, pictogrammes.
const SEPARATEURS = /[\s\u0000,;·•|/\\\-–—.…()[\]{}→←↔➜➔⇒>:+&"«»“”\p{Extended_Pictographic}️‍]+/u;
const sansMots = (t) => t.split(SEPARATEURS).every(m => m === '' || /^(?:et|ou)$/i.test(m));

// Ligne qui ne porte que des liens : puce ou ligne de tableau sans autre texte, « Voir aussi : [[A]], [[B]] ».
// Un court intitulé terminé par deux-points peut précéder la liste.
export function estLigneDeLiens(ligne) {
  let n = 0;
  let s = String(ligne || '').replace(LIEN, () => { n++; return '\u0000'; });
  if (!n) return false;
  s = s.replace(/^\s*(?:>\s*)*/, '')        // citation
    .replace(/^(?:[-*+]|\d+[.)])\s+/, '')     // puce, numéro
    .replace(/^\[[ xX]\]\s+/, '')             // case à cocher
    .replace(/^#{1,6}\s+/, '')                // titre de section
    .replace(/\*\*|__|[*_~`=]/g, '');         // gras, italique, barré, surligné
  const i = s.indexOf('\u0000');
  const avant = s.slice(0, i), apres = s.slice(i);
  const intitule = /^\s*[^:\u0000]{1,48}:\s*$/u.test(avant);
  return (intitule || sansMots(avant)) && sansMots(apres);
}

// Ce qui entoure un lien placé en `pos` dans `texte` (le markdown d'une note) : sa cellule s'il est dans une
// ligne de tableau, sa ligne sinon. Les « | » d'un wikilink ([[Cible\|texte]]) ne séparent pas de cellules.
export function contexteDuLien(texte, pos) {
  const debut = texte.lastIndexOf('\n', pos - 1) + 1;
  const fin = texte.indexOf('\n', pos);
  const ligne = texte.slice(debut, fin < 0 ? texte.length : fin);
  if (!/^\s*\|/.test(ligne)) return ligne;
  const p = pos - debut;
  let dansLien = false, gauche = 0, droite = ligne.length;
  for (let i = 0; i < ligne.length; i++) {
    if (ligne.startsWith('[[', i)) { dansLien = true; i++; continue; }
    if (dansLien && ligne.startsWith(']]', i)) { dansLien = false; i++; continue; }
    if (ligne[i] !== '|' || dansLien || ligne[i - 1] === '\\') continue;
    if (i < p) gauche = i + 1;
    else { droite = i; break; }
  }
  return ligne.slice(gauche, droite);
}

// Texte affiché. `saisi` : la cible telle qu'écrite, sans chemin ni ancre ; `titre` : le titre de la page
// (null si le lien ne mène à aucune page) ; `parNom` : la cible désigne la page par son nom de fichier ou
// son titre (faux quand le lien passe par un alias ou par le renvoi d'une fiche archivée) ; `ligne` : la
// ligne (ou la cellule de tableau) où se trouve le lien, voir contexteDuLien.
export function libelleLien({ saisi, titre = null, parNom = true, ancre = '', ligne = '', cle = cleSouple } = {}) {
  let nom = String(saisi);
  if (titre && parNom && nom !== titre) {
    if (estNomDeCode(nom) || estNoteDAnalyse(nom) || estLigneDeLiens(ligne)) nom = titre;
    else if (nom.toLowerCase() !== titre.toLowerCase() && cle(nom) === cle(titre)) nom = titre;
  }
  return ancre ? `${nom} › ${ancre}` : nom;
}
