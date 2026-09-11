import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rendreIndexFiches } from '../fiches_travailleurs.mjs';

// Ces contrats figent des corrections mesurées en émulation d'appareil (Chromium, cinq
// formats de 320 à 768 px). Ils ne prouvent pas le rendu sur un téléphone réel : ni doigt,
// ni clavier logiciel, ni moteur WebKit d'iOS.
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const portail = fs.readFileSync(new URL('../portail.css', import.meta.url), 'utf8');
const bloc900 = css.slice(css.lastIndexOf('@media (max-width: 900px)'));

test('les numéros d’urgence de l’index sont touchables', () => {
  const { html } = rendreIndexFiches({ fiches: [{ titre: 'T', out: 'w/a.html', base: 'a', domaine: { icon: '🦺', name: 'Ergonomie' } }], liens: {} });
  assert.ok(html.includes('class="callout callout-warning encadre-urgence"'), 'encadré marqué pour la feuille de style');
  for (const n of ['911', '811', '988']) assert.ok(html.includes('href="tel:' + n + '"'), 'numéro ' + n);
  assert.match(bloc900, /\.encadre-urgence \.callout-body a::after \{[^}]*height:\s*44px/, "zone tactile de 44 px, posée sans changer l’interligne");
  assert.doesNotMatch(bloc900, /\.encadre-urgence \.callout-body a \{[^}]*line-height:\s*44px/, "la hauteur de ligne du paragraphe reste intacte");
  assert.match(bloc900, /\.encadre-urgence \.callout-body a\[href\^="tel:"\] \{[^}]*font-weight:\s*700/, "seuls les numéros sont en gras");
});

test('le domaine affiché sous chaque fiche reste lisible', () => {
  assert.match(bloc900, /\.cat-pages \.cat-compte \{[^}]*font-size:\s*13px/, 'au moins 13 px, contre 11,5 px auparavant');
});

test('aucune grille ne déborde d’un écran de 320 px', () => {
  assert.match(bloc900, /\.portal-grid \{[^}]*minmax\(min\(300px, 100%\), 1fr\)/, 'la carte se replie au lieu de dépasser');
  assert.match(portail, /@media \(max-width: 480px\) \{\s*\.tb-profil \{ display: none; \}/, 'le bloc de profil décoratif s’efface');
});

test('les liens secondaires atteignent le minimum WCAG 2.5.8 AA de 24 px', () => {
  assert.match(bloc900, /\.retour-haut \{[^}]*padding:\s*6px 8px/, '« ↑ haut » mesurait 33 × 14 px');
  assert.match(bloc900, /\.breadcrumbs a \{[^}]*padding:\s*6px 3px/, 'fil d’Ariane mesurait 35 × 14 px');
});
