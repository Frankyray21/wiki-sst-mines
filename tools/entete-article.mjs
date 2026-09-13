// En-tête commun à toutes les pages d'article : titre et domaine groupés dans un même bloc,
// pour que les commandes de confort de lecture s'insèrent au bon endroit (juste après).
//
// Un en-tête compact avec sommaire intégré existait ici, réservé à la seule fiche Cadenassage
// du wiki des travailleurs (« Première application limitée… », pilote jamais étendu). Cette
// fiche a été archivée le 12 septembre 2026 avec le reste du wiki des travailleurs ; l'en-tête
// compact est retiré avec elle plutôt que repointé sur sa jumelle du dossier « 27 - Articles
// gestionnaires », qui n'a ni le même contenu ni le même sommaire. Voir
// plans/2026-09-12-wiki-par-notion.md, § 9.2.
const esc = valeur => String(valeur).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function rendreTitreArticle({ titre, domaineHtml }) {
  return `<header class="article-titre">
<h1 class="page-title">${esc(titre)}</h1>
<div class="page-sub">${domaineHtml}</div>
</header>`;
}
