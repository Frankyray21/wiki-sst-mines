// Première application limitée aux deux versions de la fiche Cadenassage.
const PAGE = 'w/securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html';
const cibles = new Set([PAGE, 't/' + PAGE]);
const esc = valeur => String(valeur).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Barre de lecture injectée dans un bloc distinct, jamais à côté du sommaire.
// Le titre garde la typographie du wiki ; le pilote Cadenassage reste séparé.
export function rendreTitreArticle({ titre, domaineHtml }) {
  return `<header class="article-titre">
<h1 class="page-title">${esc(titre)}</h1>
<div class="page-sub">${domaineHtml}</div>
</header>`;
}

export function rendreEnteteCompact({ out, titre, domaineHtml, sections }) {
  if (!cibles.has(out)) return null;
  const nombre = sections.filter(s => s.lv === 2).length || sections.length;
  const sommaire = sections.length < 3 ? '' : `
<nav class="toc toc-compacte" aria-label="Sommaire de la page" data-mobile-replie="true">
<div class="toc-title"><span>Sommaire <span class="toc-compte">${nombre} section${nombre > 1 ? 's' : ''}</span></span><button type="button" class="toc-toggle" aria-expanded="true" aria-controls="sommaire-sections" data-label-ouvert="Masquer" data-label-ferme="Afficher">Masquer</button></div>
<ul id="sommaire-sections">${sections.map(s => `<li class="toc-l${s.lv}"><a href="#${esc(s.id)}">${esc(s.text)}</a></li>`).join('')}</ul>
</nav>`;
  // Les commandes injectées après .page-sub restent hors de cet élément :
  // celui-ci disparaît en mode Lecture, mais le bouton de sortie doit rester visible.
  return `<header class="article-entete">
<h1 class="page-title">${esc(titre)}</h1>
<div class="page-sub">${domaineHtml}</div>
${sommaire}
</header>`;
}
