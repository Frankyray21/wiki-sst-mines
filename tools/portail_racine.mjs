// Contenu du portail racine (index.html). L'habillage (en-tête, pied, scripts) reste dans
// build_site.mjs ; ce module ne produit que l'intérieur de <main>, pour être testable.
import { INDEX_FICHES } from './fiches_travailleurs.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nb = (n) => Number(n).toLocaleString('fr-CA');

// cartesWikis : le HTML des sept cartes du fond documentaire, déjà rendu par le générateur.
export function rendrePortailContenu({ total, cartesWikis, nbFiches, nbPagesEncadrement, taglineEncadrement, nbCategories, nbPagesQualite }) {
  return `
<div class="portal-hero">
  <div class="portal-globe">⛏️</div>
  <h1>WIKI SST — Mines</h1>
  <p class="portal-tagline">L'encyclopédie santé et sécurité du travail en milieu minier<br>${nb(total)} articles en français · construite à partir des notes de cours</p>
  <div class="portal-search"><input type="search" id="q2" aria-label="Rechercher dans le wiki" placeholder="Rechercher parmi ${nb(total)} articles…" autocomplete="off"><div id="suggest2" class="suggest" hidden></div></div>
</div>
<h2 class="portal-section">Le fond documentaire</h2>
<p class="portal-note">Les ${nb(total)} pages, classées par discipline : fiches pour les travailleurs, articles internes, pages pour l'encadrement et articles de loi.</p>
<div class="portal-grid">${cartesWikis}</div>
<h2 class="portal-section">Parcourir par sujet</h2>
<div class="portal-grid portal-sujets">
  <a class="portal-card" href="categories.html">
    <span class="portal-icon">🏷️</span>
    <span class="portal-info"><strong>Catégories</strong><span class="portal-desc">Les mots-clés qui traversent les disciplines : bruit, explosifs, espaces clos, silice… Chaque catégorie réunit les articles du même sujet, quel que soit le domaine.</span><span class="portal-count">${nbCategories} catégories</span></span>
  </a>
  <a class="portal-card" href="${INDEX_FICHES.out}">
    <span class="portal-icon">${INDEX_FICHES.icone}</span>
    <span class="portal-info"><strong>${esc(INDEX_FICHES.titre)}</strong><span class="portal-desc">Pages courtes, en français simple, classées par situation : douleurs, air et poussières, chaleur et bruit, santé mentale, sommeil, droits, dangers, vie au camp.</span><span class="portal-count">${nbFiches} pages</span></span>
  </a>
  <a class="portal-card" href="qualite.html">
    <span class="portal-icon">🔧</span>
    <span class="portal-info"><strong>Contrôles de forme</strong><span class="portal-desc">Repérer les textes coupés, sections vides et références à vérifier. Ces signalements automatiques ne valident ni le contenu SST ni sa conformité.</span><span class="portal-count">${nbPagesQualite} pages à examiner</span></span>
  </a>
</div>
<h2 class="portal-section">Espace encadrement</h2>
<div class="portal-grid portal-publics">
  <a class="portal-card carte-public" href="g/index.html">
    <span class="portal-icon">🎓</span>
    <span class="portal-info"><strong>Je supervise ou je dirige</strong><span class="portal-desc">${esc(taglineEncadrement)}</span><span class="portal-count">${nbPagesEncadrement} pages + les articles de loi</span></span>
  </a>
</div>
<div class="portal-foot">
  <a href="#" id="randomLink2">🎲 Une page au hasard</a>
</div>`;
}
