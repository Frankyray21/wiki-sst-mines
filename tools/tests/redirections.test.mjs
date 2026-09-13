import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { scriptRedirection, rendrePage404, SCRIPT_LIENS_404 } from '../redirections.mjs';

// Simule la redirection de 404.html dans un faux navigateur, comme le faisait
// fiches-travailleurs.test.mjs pour l'ancien wiki des travailleurs (avant le 12 septembre 2026).
function simuler(pathname, table) {
  let cible = null;
  const location = {
    pathname, search: '', hash: '',
    replace(url) { cible = url; },
  };
  vm.runInNewContext(scriptRedirection(table), { location });
  return cible;
}

test('adresse déjà par notion : aucune redirection (pas de boucle)', () => {
  assert.equal(simuler('/wiki-sst-mines/w/ergonomie/manutention-manuelle.html', {}), null);
  assert.equal(simuler('/wiki-sst-mines/w/legislation/20-reglements/rsst/art-4-rsst.html', {}), null);
});

test('ancien dossier de cours (règle générique) : segments retirés', () => {
  const cible = simuler('/wiki-sst-mines/w/ergonomie/20-articles-internes/contraintes/manutention-manuelle.html', {});
  assert.equal(cible, '/wiki-sst-mines/w/ergonomie/manutention-manuelle.html');
});

test('Recueil législatif : jamais réécrit, même avec des dossiers', () => {
  assert.equal(simuler('/wiki-sst-mines/w/legislation/20-reglements/rsst/art-4-rsst.html', {}), null);
});

test('ancien wiki des travailleurs (t/) : le préfixe est retiré, jamais vers travailleurs.html', () => {
  const table = { 'w/securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html': 'w/securite/27-articles-gestionnaires.html' };
  const cible = simuler('/wiki-sst-mines/t/w/securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html', table);
  assert.equal(cible, '/wiki-sst-mines/w/securite/27-articles-gestionnaires.html');
});

test('encadrement (g/) : reste dans son espace après redirection', () => {
  const table = { 'w/hygiene/27-articles-gestionnaires/contrainte-thermique.html': 'w/hygiene/contrainte-thermique-encadrement.html' };
  const cible = simuler('/wiki-sst-mines/g/w/hygiene/27-articles-gestionnaires/contrainte-thermique.html', table);
  assert.equal(cible, '/wiki-sst-mines/g/w/hygiene/contrainte-thermique-encadrement.html');
});

test('travailleurs.html : renvoyé au portail', () => {
  assert.equal(simuler('/wiki-sst-mines/travailleurs.html', {}), '/wiki-sst-mines/index.html');
});

test('catégorie disparue (sous le seuil de 5) : renvoyée vers categories.html', () => {
  assert.equal(simuler('/wiki-sst-mines/categorie/vibrations.html', {}), '/wiki-sst-mines/categories.html');
});

test('table explicite prioritaire sur la règle générique (accueil, thème, collision suffixée)', () => {
  const table = {
    'w/psychosocial/10-themes/communication.html': 'w/psychosocial/theme/communication.html',
    'w/toxicologie/20-articles-internes/amiante.html': 'w/toxicologie/amiante-articles-internes.html',
  };
  assert.equal(simuler('/wiki-sst-mines/w/psychosocial/10-themes/communication.html', table), '/wiki-sst-mines/w/psychosocial/theme/communication.html');
  assert.equal(simuler('/wiki-sst-mines/w/toxicologie/20-articles-internes/amiante.html', table), '/wiki-sst-mines/w/toxicologie/amiante-articles-internes.html');
});

test('adresse inconnue hors de tout schéma reconnu : rien ne se passe', () => {
  assert.equal(simuler('/wiki-sst-mines/quelque-chose-au-hasard.html', {}), null);
});

test('page 404 : autonome, sans ressource relative', () => {
  const html = rendrePage404({ 'w/a.html': 'w/b.html' });
  assert.ok(!html.includes('<link') && !html.includes('assets/'));
  assert.ok(html.includes(JSON.stringify({ 'w/a.html': 'w/b.html' })));
  assert.ok(html.includes(SCRIPT_LIENS_404));
  assert.match(html, /<meta name="robots" content="noindex">/);
});
