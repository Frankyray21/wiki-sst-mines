import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { rendreEnteteCompact } from '../entete-article.mjs';

const page = 'w/securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html';
const sections = [
  { lv: 2, id: 'ce-que-la-procedure-doit-preciser', text: 'Ce que la procédure doit préciser' },
  { lv: 2, id: 'arreter-ne-suffit-pas', text: 'Arrêter ne suffit pas' },
  { lv: 2, id: 'plusieurs-personnes-et-changement-de-quart', text: 'Plusieurs personnes et changement de quart' },
  { lv: 2, id: 'a-qui-en-parler', text: 'À qui en parler' },
  { lv: 2, id: 'portee-et-validation', text: 'Portée et validation' },
];
const options = { titre: 'Comprendre le cadenassage en mine', domaineHtml: 'Sécurité industrielle', sections };
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('en-tête limité au fond documentaire et au parcours travailleurs du cadenassage', () => {
  for (const out of [page, 't/' + page]) assert.ok(rendreEnteteCompact({ ...options, out }).includes('article-entete'));
  for (const out of ['w/ergonomie/20-articles-internes/contraintes/postures-contraignantes.html', 'g/' + page, 'w/securite/27-articles-gestionnaires/cadenassage.html']) {
    assert.equal(rendreEnteteCompact({ ...options, out }), null);
  }
});

test('titre unique, cinq ancres conservées et commande reliée à une liste accessible sans JS', () => {
  const html = rendreEnteteCompact({ ...options, out: page });
  assert.equal((html.match(/<h1 /g) || []).length, 1);
  assert.ok(html.includes('5 sections'));
  assert.ok(html.includes('type="button"'));
  assert.ok(html.includes('aria-controls="sommaire-sections"'));
  assert.ok(html.includes('aria-expanded="true"'));
  assert.ok(html.includes('<ul id="sommaire-sections">'));
  assert.ok(!html.includes('hidden'));
  for (const section of sections) assert.ok(html.includes('href="#' + section.id + '"'));
});

test('titres et libellés sont échappés ; pas de sommaire vide', () => {
  const html = rendreEnteteCompact({ ...options, out: page, titre: '<test>', sections: [{ lv: 2, id: 'a', text: 'A' }] });
  assert.ok(html.includes('&lt;test&gt;'));
  assert.ok(!html.includes('<nav'));
  const avecToc = rendreEnteteCompact({ ...options, out: page, sections: sections.map(s => ({ ...s, text: '<' + s.text + '>' })) });
  assert.ok(avecToc.includes('&lt;Arrêter ne suffit pas&gt;'));
});

function sommaire({ compact = true, width = 390, pref = null, count = 5 } = {}) {
  const classes = new Set();
  const attrs = { 'aria-expanded': 'true', 'aria-controls': 'sommaire-sections', ...(compact ? { 'data-label-ferme': 'Afficher', 'data-label-ouvert': 'Masquer' } : {}) };
  const handlers = {};
  const button = { textContent: compact ? 'Masquer' : '[masquer]', getAttribute: n => attrs[n] ?? null, setAttribute: (n, v) => { attrs[n] = v; }, addEventListener: (n, f) => { handlers[n] = f; } };
  const toc = {
    getAttribute: n => n === 'data-mobile-replie' && compact ? 'true' : null,
    querySelector: () => button, querySelectorAll: () => Array.from({ length: count }),
    classList: { contains: n => classes.has(n), toggle: (n, on) => { if (on) classes.add(n); else classes.delete(n); } },
  };
  const stored = new Map(pref === null ? [] : [['tdm-repliee', pref]]);
  const ctx = { document: { querySelectorAll: () => [toc] }, window: { innerWidth: width }, localStorage: { getItem: k => stored.get(k) ?? null, setItem: (k, v) => stored.set(k, v) } };
  const start = app.indexOf('  var SEUIL_REPLI =');
  const end = app.indexOf('  // ---------- ancres accentuées', start);
  assert.ok(start >= 0 && end > start);
  vm.runInNewContext(app.slice(start, end), ctx);
  return { button, attrs, stored, collapsed: () => classes.has('collapsed'), click: () => handlers.click() };
}

test('sur mobile, cinq sections se replient ; bouton et état ARIA restent synchronisés', () => {
  const s = sommaire();
  assert.ok(s.collapsed()); assert.equal(s.attrs['aria-expanded'], 'false'); assert.equal(s.button.textContent, 'Afficher');
  s.click();
  assert.ok(!s.collapsed()); assert.equal(s.attrs['aria-expanded'], 'true'); assert.equal(s.button.textContent, 'Masquer');
  assert.equal(s.stored.get('tdm-repliee'), '0'); assert.equal(s.attrs['aria-controls'], 'sommaire-sections');
});

test('sur ordinateur le sommaire reste ouvert par défaut, le choix explicite est prioritaire', () => {
  assert.ok(!sommaire({ width: 1200 }).collapsed());
  assert.ok(!sommaire({ pref: '0' }).collapsed());
  assert.ok(sommaire({ width: 1200, pref: '1' }).collapsed());
});

test('les autres pages conservent le seuil et les libellés historiques', () => {
  const court = sommaire({ compact: false });
  assert.ok(!court.collapsed()); court.click(); assert.equal(court.button.textContent, '[afficher]');
  const long = sommaire({ compact: false, count: 9 });
  assert.ok(long.collapsed()); long.click(); assert.equal(long.button.textContent, '[masquer]');
});

test('les commandes restent sœurs du domaine et permettent de quitter le mode Lecture', () => {
  const attributs = new Map(); const stored = new Map(); const events = {};
  const bouton = nom => ({ disabled: false, attrs: {}, classList: { toggle() {} }, setAttribute(n, v) { this.attrs[n] = v; }, addEventListener(n, fn) { events[nom + '-' + n] = fn; } });
  const boutons = { '[data-moins]': bouton('moins'), '[data-plus]': bouton('plus'), '[data-lecture]': bouton('lecture') };
  const barre = { setAttribute() {}, querySelector: s => boutons[s] };
  const suite = {}; const sub = { nextSibling: suite }; const parent = { insertBefore(b, next) { assert.equal(b, barre); assert.equal(next, suite); barre.parentNode = parent; } }; sub.parentNode = parent;
  const ctx = {
    document: {
      querySelector: s => s === '.page-sub' ? sub : {}, createElement: () => barre,
      documentElement: { style: { setProperty() {} }, getAttribute: k => attributs.get(k) ?? null, setAttribute: (k, v) => attributs.set(k, v), removeAttribute: k => attributs.delete(k) },
    },
    localStorage: { getItem: k => stored.get(k) ?? null, setItem: (k, v) => stored.set(k, v), removeItem: k => stored.delete(k) },
  };
  const start = app.indexOf('  (function outilsLecture()');
  const end = app.indexOf("  // ---------- hauteur d'en-tête", start);
  vm.runInNewContext(app.slice(start, end), ctx);
  assert.equal(barre.parentNode, parent);
  events['lecture-click'](); assert.equal(attributs.get('data-lecture'), '1'); assert.equal(boutons['[data-lecture]'].attrs['aria-pressed'], 'true');
  events['lecture-click'](); assert.equal(attributs.has('data-lecture'), false); assert.equal(boutons['[data-lecture]'].attrs['aria-pressed'], 'false');
  for (let i = 0; i < 10; i++) events['plus-click']();
  assert.equal(boutons['[data-plus]'].disabled, true); assert.equal(stored.get('echelle'), '1.45');
  for (let i = 0; i < 10; i++) events['moins-click']();
  assert.equal(boutons['[data-moins]'].disabled, true); assert.equal(stored.get('echelle'), '0.85');
});
