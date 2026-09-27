// Surlignage coloré d'Obsidian (« ~={couleur}texte=~ ») : le générateur le rend en <mark> teinté au lieu du
// texte barré que produisait marked ; les pages publiées sont reposées par la même règle (27 septembre 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { surlignagesColores, surlignagesColoresHtml } from '../surlignage.mjs';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const m = (c, t) => `<mark class="surligne surligne-${c}">${t}</mark>`;

test('note : couleur, double accolade, espace avant « =~ », mot collé, fin de ligne sans « =~ »', () => {
  assert.equal(surlignagesColores('**~={purple}aide-foreur =~** junior'), `**${m('purple', 'aide-foreur')}** junior`);
  assert.equal(surlignagesColores('~={{red}}dépression =~ et anxiété'), m('red', 'dépression') + ' et anxiété');
  assert.equal(surlignagesColores('~={orange}N = 240, 4  =~semaines'), m('orange', 'N = 240, 4') + ' semaines', 'le mot collé reste séparé');
  assert.equal(surlignagesColores('- isolement ~={purple}FIFO ='), '- isolement ' + m('purple', 'FIFO'));
  assert.equal(surlignagesColores('~=sans couleur=~'), '<mark class="surligne">sans couleur</mark>');
  assert.equal(surlignagesColores('~={orange}~15-18 % =~'), m('orange', '~15-18 %'), 'tilde d’approximation gardé');
});

test('note : un surlignage dans un autre, du plus intérieur au plus extérieur', () => {
  assert.equal(surlignagesColores('en ~={orange}5 RPS ~={purple}FIFO =~-spécifiques =~ ici'), `en ${m('orange', `5 RPS ${m('purple', 'FIFO')}-spécifiques`)} ici`);
});

test('note : un vrai texte barré et un texte sans surlignage ne changent pas', () => {
  for (const t of ['Un ~~barré~~ reste.', 'x ~ y = z', 'a == b']) assert.equal(surlignagesColores(t), t);
});

test('page publiée : même résultat depuis le texte barré de marked', () => {
  assert.equal(surlignagesColoresHtml('<strong><del>={purple}aide-foreur =</del></strong> junior'), `<strong>${m('purple', 'aide-foreur')}</strong> junior`);
  assert.equal(surlignagesColoresHtml('<del>={orange}5 RPS <del>={purple}FIFO =</del>-spécifiques =</del>'), m('orange', `5 RPS ${m('purple', 'FIFO')}-spécifiques`));
  assert.equal(surlignagesColoresHtml('<td>~={orange}<del>15-18 % =</del></td>'), `<td>${m('orange', '~15-18 %')}</td>`);
  assert.equal(surlignagesColoresHtml('<li>~={orange}N = 240, 4  =~semaines</li>'), `<li>${m('orange', 'N = 240, 4')} semaines</li>`);
  assert.equal(surlignagesColoresHtml('<li>isolement ~={purple}FIFO =</li>'), `<li>isolement ${m('purple', 'FIFO')}</li>`);
  assert.equal(surlignagesColoresHtml('<p>Un <del>barré</del> reste.</p>'), '<p>Un <del>barré</del> reste.</p>');
});

test('site publié : plus aucun reste de surlignage, teintes prévues par la feuille de style', () => {
  const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
  const couleurs = new Set();
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const t = fs.readFileSync(p, 'utf8');
      const i = t.indexOf('<div class="page-body');
      if (i < 0) continue;
      const corps = t.slice(i);
      assert.doesNotMatch(corps, /<del>=|~=\{|=<\/del>/, path.relative(R, p));
      for (const [, c] of corps.matchAll(/<mark class="surligne surligne-([a-z]+)">/g)) couleurs.add(c);
    }
  })(path.join(R, 'docs'));
  assert.ok(couleurs.size >= 5);
  for (const c of couleurs) assert.ok(css.includes('mark.surligne-' + c), 'teinte pour ' + c);
  assert.match(css, /mark\.surligne \{ color: inherit;/);
});
