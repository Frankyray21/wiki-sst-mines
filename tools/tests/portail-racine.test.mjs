import test from 'node:test';
import assert from 'node:assert/strict';
import { rendrePortailContenu } from '../portail_racine.mjs';

test('portail racine : fond documentaire d’abord, thèmes par sujet, un seul espace par public', () => {
  const html = rendrePortailContenu({
    total: 3902, cartesWikis: '<a class="portal-card" href="w/x">X</a>', nbThemes: 32,
    nbPagesEncadrement: 134, taglineEncadrement: 'Superviseurs & direction', nbCategories: 143, nbPagesQualite: 415,
  });
  assert.match(html, /Rechercher parmi 3\s902 articles/u);
  assert.ok(html.includes('<div class="portal-grid"><a class="portal-card" href="w/x">X</a></div>'), 'cartes des wikis reprises telles quelles');
  assert.equal((html.match(/carte-public/g) || []).length, 1, 'un seul espace par public');
  assert.ok(html.includes('href="g/index.html"') && html.includes('134 pages + les articles de loi'));
  assert.ok(html.includes('Superviseurs &amp; direction'), 'texte échappé');
  assert.ok(!html.includes('t/index.html') && !html.includes('Je suis travailleur') && !html.includes('Deux wikis'));
  assert.ok(html.includes('href="themes.html"') && html.includes('32 thèmes'));
  assert.ok(!html.includes('travailleurs.html') && !html.includes('Fiches pour les travailleurs'));
  assert.ok(html.includes('class="portal-grid portal-sujets"') && html.includes('class="portal-grid portal-publics"'));
  assert.ok(html.includes('143 catégories') && html.includes('415 pages à examiner'));
  assert.ok(html.includes('id="randomLink2"') && html.includes('id="q2"') && html.includes('id="suggest2"'));
  const ordre = ['portal-hero', 'Le fond documentaire', 'Parcourir par sujet', 'Espace encadrement', 'portal-foot'].map(m => html.indexOf(m));
  assert.deepEqual([...ordre].sort((a, b) => a - b), ordre, 'ordre des sections');
});
