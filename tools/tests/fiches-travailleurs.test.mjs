import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { classerFiches, rendreIndexFiches, rendrePage404, INDEX_FICHES, LIEN_INDEX_FICHES, motsDe, SCRIPT_REDIRECTION, SCRIPT_LIENS_404, RUBRIQUES } from '../fiches_travailleurs.mjs';

const dom = {
  ergonomie: { icon: '🦺', name: 'Ergonomie', slug: 'ergonomie' },
  hygiene: { icon: '🌫️', name: 'Hygiène industrielle', slug: 'hygiene' },
  psychosocial: { icon: '🧠', name: 'SST psychosociale', slug: 'psychosocial' },
  securite: { icon: '⛑️', name: 'Sécurité industrielle', slug: 'securite' },
  droit: { icon: '📋', name: 'Droit du travail', slug: 'droit-travail' },
  toxicologie: { icon: '☣️', name: 'Toxicologie', slug: 'toxicologie' },
};
const fiche = (titre, out, domaine, base) => ({ titre, out, base: base || out.split('/').pop().replace(/\.html$/, ''), domaine: dom[domaine] });
const fiches = [
  fiche('Manutention (travailleurs)', 'w/ergonomie/25-articles-travailleurs/manutention-travailleurs.html', 'ergonomie'),
  fiche('Manutention (pour toi)', 'w/ergonomie/25-articles-travailleurs/manutention.html', 'ergonomie'),
  fiche('Le bruit en mine et ma protection auditive', 'w/hygiene/25-articles-travailleurs/environnement-de-travail/bruit.html', 'hygiene'),
  fiche('Équipements de protection', 'w/hygiene/25-articles-travailleurs/equipements-de-protection.html', 'hygiene'),
  fiche('Équipements de protection', 'w/securite/25-articles-travailleurs/equipements-de-protection.html', 'securite'),
  fiche('Dépression ou choc après un accident, est-ce reconnu par la CNESST', 'w/psychosocial/26-brouillons-travailleurs/depression-ou-choc.html', 'psychosocial'),
  fiche('Revenir à la maison après une période de travail', 'w/psychosocial/25-articles-travailleurs/30-fatigue-et-recuperation/revenir-a-la-maison.html', 'psychosocial'),
  fiche("Se sentir épaulé par l'équipe", 'w/psychosocial/25-articles-travailleurs/60-reconnaissance-et-soutien/se-sentir-epaule.html', 'psychosocial'),
  fiche('Bien utiliser les ressources de soutien', 'w/psychosocial/25-articles-travailleurs/20-ressources-et-aide/bien-utiliser.html', 'psychosocial'),
  fiche('Droits et ressources après lésion', 'w/droit-travail/25-articles-travailleurs/accidents-et-lesions/droits-et-ressources.html', 'droit'),
  fiche('Tes heures, tes vacances et tes congés quand tu travailles en rotation', 'w/droit-travail/26-brouillons-travailleurs/tes-heures.html', 'droit'),
  fiche('Mon droit de refus en mine', 'w/droit-travail/25-articles-travailleurs/accidents-et-lesions/droit-de-refus.html', 'droit'),
  fiche('👷 Wiki Hygiène industrielle mines - Travailleurs', 'w/hygiene/25-articles-travailleurs/00-accueil-travailleurs.html', 'hygiene', '00 - Accueil travailleurs'),
  fiche('👷 Bienvenue, travailleur', 'w/ergonomie/25-articles-travailleurs/25-articles-travailleurs.html', 'ergonomie', '25 - Articles travailleurs'),
  fiche('🎯 Démarrage rapide, travailleur', 'w/securite/05-demarrage-rapide/demarrage-rapide-travailleur.html', 'securite'),
  fiche('Une page sans mot connu <script>', 'w/toxicologie/26-brouillons-travailleurs/inconnue.html', 'toxicologie'),
];

test('mots entiers normalisés', () => {
  assert.equal(motsDe('Équipe & équipements — d’un « Quart de nuit »'), ' equipe equipements d un quart de nuit ');
  assert.equal(LIEN_INDEX_FICHES, '👷 Fiches pour les travailleurs');
  assert.equal(INDEX_FICHES.out, 'travailleurs.html');
  assert.equal(new Set(RUBRIQUES.map(r => r.id)).size, RUBRIQUES.length, 'identifiants de rubrique uniques');
});

test('classement : première rubrique, mots entiers, dossiers du vault et doublons', () => {
  const c = classerFiches(fiches);
  const ou = (titre) => c.rubriques.find(r => r.membres.some(f => f.titre === titre))?.id;
  assert.equal(ou('Manutention (pour toi)'), 'douleurs');
  assert.equal(ou('Manutention (travailleurs)'), undefined, 'doublon écarté au profit de la version vulgarisée');
  assert.equal(ou('Le bruit en mine et ma protection auditive'), 'ambiance', '« bruit » passe avant « protection »');
  assert.equal(ou('Dépression ou choc après un accident, est-ce reconnu par la CNESST'), 'sante-mentale');
  assert.equal(ou('Revenir à la maison après une période de travail'), 'sommeil', 'le dossier « Fatigue et récupération » compte');
  assert.equal(ou("Se sentir épaulé par l'équipe"), 'equipe', '« équipe » sans attraper « équipements »');
  assert.equal(ou('Bien utiliser les ressources de soutien'), 'sante-mentale', 'dossier « Ressources et aide »');
  assert.equal(ou('Droits et ressources après lésion'), 'droits');
  assert.equal(ou('Tes heures, tes vacances et tes congés quand tu travailles en rotation'), 'droits');
  assert.equal(ou('Mon droit de refus en mine'), 'droits');
  assert.deepEqual(c.rubriques.find(r => r.id === 'dangers').membres.map(f => f.out), ['w/hygiene/25-articles-travailleurs/equipements-de-protection.html'], 'un seul « Équipements de protection »');
  assert.equal(c.ecartees, 2);
  assert.deepEqual(c.autres.map(f => f.titre), ['Une page sans mot connu <script>']);
  assert.deepEqual(c.accueils.map(f => f.out), [
    'w/ergonomie/25-articles-travailleurs/25-articles-travailleurs.html',
    'w/hygiene/25-articles-travailleurs/00-accueil-travailleurs.html',
    'w/securite/05-demarrage-rapide/demarrage-rapide-travailleur.html',
  ]);
  assert.deepEqual(classerFiches([...fiches].reverse()).rubriques.map(r => r.membres.map(f => f.out)), c.rubriques.map(r => r.membres.map(f => f.out)), 'résultat indépendant de l’ordre d’entrée');
});

test('rendu : rubriques ancrées, échappement, numéros d’aide et renvois facultatifs', () => {
  const { html, total, nonClassees, ecartees, rubriques } = rendreIndexFiches({ fiches, liens: { aide: 'w/aide.html', lois: 'w/legislation/index-par-loi.html', categorie: null, encadrement: 'g/index.html' } });
  assert.equal(total, fiches.length);
  assert.equal(nonClassees, 1);
  assert.equal(ecartees, 2);
  assert.ok(rubriques.every(r => r.nombre > 0));
  assert.ok(html.includes('<h1 class="page-title" id="haut">Fiches pour les travailleurs</h1>'));
  assert.ok(html.includes('id="rub-douleurs"') && html.includes('href="#rub-douleurs"'));
  assert.ok(!html.includes('id="rub-camp"'), 'rubrique vide non affichée');
  assert.ok(html.includes('&lt;script&gt;') && !html.includes('<script>'), 'titres échappés');
  for (const n of ['911', '811', '988']) assert.ok(html.includes('href="tel:' + n + '"'));
  assert.ok(html.includes('href="{{ROOT}}w/aide.html">Où appeler quand ça ne va pas</a>'));
  assert.ok(!html.includes('Lignes d’aide'), 'renvoi absent quand la page manque');
  assert.ok(!html.includes('Catégorie : travailleur'));
  assert.ok(html.includes('href="{{ROOT}}g/index.html"'));
  assert.ok(html.includes('<small class="cat-compte">🦺 Ergonomie</small>'));
  assert.ok(html.includes('2 autres restent'));
  assert.ok(html.includes('id="rub-accueils"') && html.includes('id="rub-autres"'));
  const liens = [...html.matchAll(/<li><a href="\{\{ROOT\}\}(w\/[^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(liens).size, liens.length, 'chaque fiche listée une seule fois');
  assert.equal(liens.filter(l => l !== 'w/legislation/index-par-loi.html').length, fiches.length - ecartees);
});

function simuler(pathname) {
  const remplacements = [];
  vm.runInNewContext(SCRIPT_REDIRECTION, { location: { pathname, search: '?x=1', hash: '#h', replace: (u) => remplacements.push(u) } });
  return remplacements;
}

test('404 : redirections des anciennes adresses du wiki des travailleurs', () => {
  assert.deepEqual(simuler('/wiki-sst-mines/t/w/hygiene/25-articles-travailleurs/bruit.html'), ['/wiki-sst-mines/w/hygiene/25-articles-travailleurs/bruit.html?x=1#h']);
  assert.deepEqual(simuler('/wiki-sst-mines/t/'), ['/wiki-sst-mines/travailleurs.html?x=1#h']);
  assert.deepEqual(simuler('/wiki-sst-mines/t/index.html'), ['/wiki-sst-mines/travailleurs.html?x=1#h']);
  assert.deepEqual(simuler('/t/w/x.html'), ['/w/x.html?x=1#h']);
  for (const p of ['/wiki-sst-mines/w/absente.html', '/wiki-sst-mines/t', '/wiki-sst-mines/w/t/x.html', '/wiki-sst-mines/t/w/', '/wiki-sst-mines/travailleurs.html']) {
    assert.deepEqual(simuler(p), [], p);
  }
});

test('404 : page autonome, liens vers le portail et la recherche calculés depuis l’adresse', () => {
  const lier = (pathname) => {
    const liens = {};
    vm.runInNewContext(SCRIPT_LIENS_404, { location: { pathname }, document: { getElementById: id => ({ set href(v) { liens[id] = v; } }) } });
    return liens;
  };
  assert.deepEqual(lier('/wiki-sst-mines/w/hygiene/absente.html'), { 'lien-accueil': '/wiki-sst-mines/index.html', 'lien-recherche': '/wiki-sst-mines/recherche.html' });
  assert.equal(lier('/wiki-sst-mines/absente.html')['lien-accueil'], '/wiki-sst-mines/index.html');
  assert.equal(lier('/wiki-sst-mines/t/w/absente.html')['lien-accueil'], '/wiki-sst-mines/index.html');
  const page = rendrePage404();
  assert.ok(page.includes(SCRIPT_REDIRECTION) && page.includes(SCRIPT_LIENS_404));
  assert.ok(!page.includes('<link') && !page.includes('assets/'), 'aucune ressource relative');
  assert.ok(page.includes('noindex') && page.includes('id="lien-accueil"') && page.includes('id="lien-recherche"'));
});
