// Fiches pour les travailleurs : index du fond documentaire et redirections.
//
// L'ancien wiki des travailleurs (/t/ : portail en tableau de bord et copie des pages)
// est abandonné. Les mêmes pages, retenues par la même autorisation inscrite dans le
// vault (publication-travailleur / public-cible, veto de niveau-sensibilité), sont
// listées ici par situation, dans une page ordinaire du wiki. Ce module ne rédige aucun
// contenu SST : il n'emploie que les titres, chemins et domaines des notes, ainsi que les
// numéros d'aide déjà inscrits dans les notes « Où appeler quand ça ne va pas » et
// « Lignes d'aide et ressources de soutien ».
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const INDEX_FICHES = { out: 'travailleurs.html', titre: 'Fiches pour les travailleurs', icone: '👷' };
export const LIEN_INDEX_FICHES = `${INDEX_FICHES.icone} ${INDEX_FICHES.titre}`;

// Rubriques par situation. L'ordre compte : une fiche entre dans la première rubrique dont
// un mot apparaît, en mots entiers, dans son titre ou son chemin (dossiers du vault compris).
// Les mots servent au classement seulement ; ils ne sont pas affichés.
export const RUBRIQUES = [
  { id: 'douleurs', titre: 'Douleurs, postures et efforts', mots: ['postures', 'manutention', 'travail répétitif', 'vibrations', 'tms'] },
  { id: 'air', titre: 'Air, poussières et produits', mots: ['poussières', 'poussière', 'diesel', 'silice', 'solvants', 'gaz', 'simdut', 'fds', 'amiante', 'fumées', 'produit chimique', 'produits chimiques', 'exposition', 'allergies', 'prise de sang'] },
  { id: 'ambiance', titre: 'Chaleur, froid et bruit', mots: ['chaleur', 'bruit', 'froid', 'thermique'] },
  { id: 'sante-mentale', titre: 'Santé mentale et soutien', mots: ['détresse', 'santé mentale', 'stress', 'aide', 'pae', 'appeler', 'rps', 'idées noires', 'moins bien', 'accident grave', 'événement marquant', 'dépression', 'tête fatigue'] },
  { id: 'sommeil', titre: 'Sommeil, fatigue et récupération', mots: ['sommeil', 'fatigue', 'quart de nuit', 'récupération'] },
  { id: 'equipe', titre: 'Équipe, reconnaissance et conflits', mots: ['équipe', 'reconnaissance', 'reconnu', 'conflit', 'harcèlement', 'soutien', 'épaulé', 'collègues'] },
  { id: 'droits', titre: 'Droits, réclamations et démarches', mots: ['droit de refus', 'réclamation', 'retour au travail', 'droits', 'lésion', 'cnesst', 'bem', 'comité sst', 'congédiement', 'couvert', 'vacances', 'rotation'] },
  { id: 'dangers', titre: 'Dangers, machines et procédures', mots: ['danger', 'dangers', 'presqu', 'cadenassage', 'espace clos', 'espaces clos', 'machines', 'machinerie', 'protection', 'convoyeur', 'hauteur', 'électrique', 'roche', 'accident', 'circuler'] },
  { id: 'camp', titre: 'Vie au camp et rotation', mots: ['camp', 'fifo', 'famille', 'séjour', 'alcool', 'consommation'] },
];

// Comparaison sur des mots entiers normalisés : « équipe » ne doit pas attraper « équipements ».
export function motsDe(s) {
  return ' ' + String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
}
const contient = (texte, expr) => texte.includes(' ' + motsDe(expr).trim() + ' ');

// fiches : [{ titre, out, base, domaine: { icon, name, slug } }] — `out` est le chemin
// dans le fond documentaire (w/…), `base` le nom de fichier de la note sans extension.
export function classerFiches(fiches) {
  const triees = [...fiches].sort((a, b) => a.out.localeCompare(b.out, 'fr'));
  const estAccueil = (f) => /\b(accueil|demarrage|bienvenue)\b/.test(motsDe(f.titre + ' ' + f.base)) || /^ \d+ articles /.test(motsDe(f.base));
  const accueils = triees.filter(estAccueil);
  const articles = triees.filter(f => !estAccueil(f));
  // Le vault contient souvent deux versions du même sujet : « Manutention (travailleurs) »
  // et « Manutention (pour toi) ». L'index n'en montre qu'une, en préférant la formulation
  // vulgarisée ; les listes complètes restent accessibles dans les sections de chaque wiki.
  const sujetDe = (f) => motsDe(f.titre.replace(/\s*\([^)]*\)\s*$/, '')).trim();
  const vulgarisee = (f) => /\(pour toi\)/i.test(f.titre);
  const meilleure = new Map();
  for (const f of articles) {
    const s = sujetDe(f);
    const dejaLa = meilleure.get(s);
    if (!dejaLa || (vulgarisee(f) && !vulgarisee(dejaLa))) meilleure.set(s, f);
  }
  const uniques = [...meilleure.values()];
  const rubriques = RUBRIQUES.map(r => ({ ...r, membres: [] }));
  const autres = [];
  for (const f of uniques) {
    const texte = motsDe(f.titre + ' ' + f.out);
    const rubrique = rubriques.find(r => r.mots.some(m => contient(texte, m)));
    (rubrique ? rubrique.membres : autres).push(f);
  }
  const parTitre = (a, b) => a.titre.localeCompare(b.titre, 'fr');
  for (const r of rubriques) r.membres.sort(parTitre);
  autres.sort(parTitre);
  return { accueils, rubriques, autres, ecartees: articles.length - uniques.length };
}

// liens : chemins facultatifs (null si la page n'existe pas dans le site généré).
export function rendreIndexFiches({ fiches, liens = {} }) {
  const { accueils, rubriques, autres, ecartees } = classerFiches(fiches);
  const R = '{{ROOT}}';
  const item = (f) => `<li><a href="${R}${f.out}">${esc(f.titre)}</a> <small class="cat-compte">${esc(f.domaine.icon + ' ' + f.domaine.name)}</small></li>`;
  const section = (id, titre, membres) => `<h2 id="rub-${id}">${esc(titre)} <a class="retour-haut" href="#haut">↑ haut</a></h2>
<ul class="cat-pages">${membres.map(item).join('')}</ul>`;
  const pleines = rubriques.filter(r => r.membres.length);
  const nav = [
    ...pleines.map(r => `<a href="#rub-${r.id}">${esc(r.titre)}</a>`),
    autres.length ? '<a href="#rub-autres">Autres fiches</a>' : '',
    accueils.length ? '<a href="#rub-accueils">Pages d’accueil</a>' : '',
  ].filter(Boolean).join(' · ');
  const lien = (cible, texte) => cible ? `<a href="${R}${cible}">${texte}</a>` : '';
  // Numéros et formulation repris des notes du vault (Où appeler quand ça ne va pas ; Lignes d'aide).
  const renvoisAide = [lien(liens.aide, 'Où appeler quand ça ne va pas'), lien(liens.ressources, 'Lignes d’aide et ressources de soutien')]
    .filter(Boolean).map(l => ' ' + l + '.').join('');
  // « encadre-urgence » : les numéros doivent rester touchables avec des gants, la feuille
  // de style leur donne une cible de 44 px sur petit écran.
  const aide = `<div class="callout callout-warning encadre-urgence"><div class="callout-title"><span class="callout-icon">⚠️</span>Détresse immédiate</div><div class="callout-body"><p>Urgence : <a href="tel:911">9-1-1</a>. Crise psychologique non urgente : Info-Social <a href="tel:811">8-1-1</a>, option 2, 24 heures sur 24. Prévention du suicide : <a href="tel:988">9-8-8</a> ou <a href="tel:18662773553">1-866-APPELLE</a>.${renvoisAide}</p></div></div>`;
  const voirAussi = [
    lien(liens.lois, 'Les articles de loi, classés par loi et par article'),
    lien(liens.categorie, 'Catégorie : travailleur') && `${lien(liens.categorie, 'Catégorie : travailleur')} — toutes les pages qui portent ce mot-clé`,
    lien(liens.encadrement, '🎓 Gestion &amp; prévention') && `${lien(liens.encadrement, '🎓 Gestion &amp; prévention')} — superviseurs, gestionnaires et direction`,
  ].filter(Boolean).map(l => `<li>${l}</li>`).join('');
  const total = fiches.length;
  const html = `
<div class="breadcrumbs"><a href="${R}index.html">Portail</a></div>
<h1 class="page-title" id="haut">${esc(INDEX_FICHES.titre)}</h1>
<div class="page-sub">${total} page${total > 1 ? 's' : ''} courtes, en français simple, écrites pour le personnel de la mine. Elles sont classées ici par situation ; chacune appartient à l'un des six wikis thématiques du fond documentaire.</div>
${aide}
<div class="letters-nav">${nav}</div>
${pleines.map(r => section(r.id, r.titre, r.membres)).join('\n')}
${autres.length ? section('autres', 'Autres fiches', autres) : ''}
${accueils.length ? section('accueils', 'Pages d’accueil et démarrage rapide, par domaine', accueils) : ''}
${voirAussi ? `<h2 id="voir-aussi">Voir aussi</h2>
<ul>${voirAussi}</ul>` : ''}
${ecartees ? `<p class="page-sub">Quand une fiche existe en deux versions, seule la version vulgarisée est listée ; ${ecartees} autre${ecartees > 1 ? 's' : ''} reste${ecartees > 1 ? 'nt' : ''} dans la section « Articles travailleurs » de son wiki.</p>` : ''}`;
  return { html, total, nonClassees: autres.length, ecartees, rubriques: pleines.map(r => ({ id: r.id, titre: r.titre, nombre: r.membres.length })) };
}

// ---------- page 404 : anciennes adresses du wiki des travailleurs ----------
// GitHub Pages sert 404.html pour toute adresse absente. Les anciennes adresses t/index.html
// et t/w/… renvoient vers l'index des fiches et vers la même page du fond documentaire.
// Page autonome : aucune ressource relative, car elle est servie à n'importe quelle profondeur.
export const SCRIPT_REDIRECTION = `(function () {
  var m = location.pathname.match(/^(.*?)\\/t\\/(?:w\\/(.+)|index\\.html)?$/);
  if (m) location.replace(m[1] + (m[2] ? '/w/' + m[2] : '/travailleurs.html') + location.search + location.hash);
})();`;

export const SCRIPT_LIENS_404 = `(function () {
  var p = location.pathname;
  var base = /\\/(?:w|g|t|categorie|files|assets)\\//.test(p) ? p.replace(/\\/(?:w|g|t|categorie|files|assets)\\/.*$/, '/') : p.replace(/[^\\/]*$/, '');
  document.getElementById('lien-accueil').href = base + 'index.html';
  document.getElementById('lien-recherche').href = base + 'recherche.html';
})();`;

export function rendrePage404() {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page introuvable — Wiki SST</title>
<meta name="robots" content="noindex">
<script>${SCRIPT_REDIRECTION}</script>
<style>body{font-family:-apple-system,'Segoe UI',sans-serif;background:#16181d;color:#e4e6e8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px}
.b{max-width:420px}h1{font-size:44px;margin:0 0 8px}p{line-height:1.6;color:#a9b1ba}a{color:#7ab0ff}</style></head>
<body><div class="b"><h1>🔍</h1><h2>Page introuvable</h2>
<p>Cette adresse ne correspond à aucune page du wiki. <a id="lien-accueil" href="./">Retourner au portail</a> ou <a id="lien-recherche" href="./recherche.html">lancer une recherche</a>.</p></div>
<script>${SCRIPT_LIENS_404}</script></body></html>
`;
}
