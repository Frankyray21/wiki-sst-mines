// Page 404 : anciennes adresses (dossiers de cours, wiki des travailleurs) vers les adresses
// par notion du 12 septembre 2026. Remplace fiches_travailleurs.mjs, supprimé avec le wiki
// des travailleurs. GitHub Pages sert cette page (statut 404) pour toute adresse absente.
// Page autonome : aucune ressource relative (ni <link>, ni assets/), car servie à n'importe
// quelle profondeur — voir tools/verif_site.mjs qui l'exige.
//
// `table` : { "w/<wiki>/<ancien chemin>.html": "w/<wiki>/<nouveau chemin>.html", … } — clés et
// valeurs relatives à la racine du site, construites par build_site.mjs (pages dont l'adresse a
// changé, et notes archivées avec leur ancienne adresse reconstituée). Une adresse absente de la
// table suit une règle générique : retirer les segments de dossier entre « w/<wiki>/ » et le nom
// de fichier ; « t/ » est retiré (l'ancien wiki des travailleurs) ; « g/ » est conservé (un favori
// de l'encadrement reste dans son espace) ; le Recueil (« w/legislation/… ») n'est jamais réécrit.
export function scriptRedirection(table) {
  return `(function () {
  var T = ${JSON.stringify(table)};
  var m = location.pathname.match(/^(.*?\\/)((?:t\\/)?(g\\/)?(?:w\\/|categorie\\/|travailleurs\\.html).*)$/);
  if (!m) return;
  var base = m[1], g = m[3] || '', rel = m[2].replace(/^t\\//, '').replace(/^g\\//, '');
  var cible = T[rel];
  if (!cible) {
    var w = rel.match(/^w\\/([^\\/]+)\\/(?:.+\\/)?([^\\/]+)\\.html$/);
    if (w && w[1] !== 'legislation' && rel.indexOf('/theme/') < 0) {
      cible = w[2] === 'index' ? 'w/' + w[1] + '/index.html' : 'w/' + w[1] + '/' + w[2] + '.html';
    } else if (/^categorie\\/[^/]+\\.html$/.test(rel)) cible = 'categories.html';
    else if (rel === 'travailleurs.html') cible = 'index.html';
  }
  if (cible && cible !== rel) location.replace(base + (cible.indexOf('w/') === 0 ? g : '') + cible + location.search + location.hash);
})();`;
}

export const SCRIPT_LIENS_404 = `(function () {
  var p = location.pathname;
  var base = /\\/(?:w|g|categorie|files|assets)\\//.test(p) ? p.replace(/\\/(?:w|g|categorie|files|assets)\\/.*$/, '/') : p.replace(/[^\\/]*$/, '');
  document.getElementById('lien-accueil').href = base + 'index.html';
  document.getElementById('lien-recherche').href = base + 'recherche.html';
})();`;

export function rendrePage404(table = {}) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page introuvable — Wiki SST</title>
<meta name="robots" content="noindex">
<script>${scriptRedirection(table)}</script>
<style>html{color-scheme:dark}body{font-family:-apple-system,'Segoe UI',sans-serif;background:#16181d;color:#e4e6e8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px}
.b{max-width:420px}h1{font-size:44px;margin:0 0 8px}p{line-height:1.6;color:#a9b1ba}a{color:#7ab0ff}@media print{body{background:#fff;color:#000}p{color:#333}a{color:#00c}}</style></head>
<body><div class="b"><h1>🔍</h1><h2>Page introuvable</h2>
<p>Cette adresse ne correspond à aucune page du wiki. <a id="lien-accueil" href="./">Retourner au portail</a> ou <a id="lien-recherche" href="./recherche.html">lancer une recherche</a>.</p></div>
<script>${SCRIPT_LIENS_404}</script></body></html>
`;
}
