// Vérifie les gestionnaires et contrats CSS/HTML sans simuler un rendu de navigateur.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const build = fs.readFileSync(new URL('../build_site.mjs', import.meta.url), 'utf8');
function bloc(debut, fin) {
  const start = app.indexOf(debut), end = app.indexOf(fin, start);
  assert.ok(start >= 0 && end > start);
  return app.slice(start, end);
}
function cibleEvenements(obj = {}) {
  const listeners = {};
  return Object.assign(obj, {
    addEventListener(nom, fn) { (listeners[nom] ||= []).push(fn); },
    dispatch(nom, values = {}) {
      const ev = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...values };
      for (const fn of listeners[nom] || []) fn(ev);
      return ev;
    },
  });
}
function menu(mobile = true, ancienMedia = false) {
  const document = cibleEvenements({ activeElement: null });
  function el() {
    const attrs = {}, classes = new Set();
    return cibleEvenements({
      attrs, children: [], inert: false,
      setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: k => { delete attrs[k]; },
      classList: { contains: c => classes.has(c), toggle(c, on) { if (on) classes.add(c); else classes.delete(c); } },
      contains(child) { return child === this || this.children.includes(child); },
      focus() { document.activeElement = this; },
    });
  }
  const burger = el(), sidebar = el(), lien = el();
  lien.closest = () => lien; sidebar.children = [lien]; sidebar.querySelector = () => lien;
  document.getElementById = id => ({ burger, sidebar })[id] || null;
  const media = cibleEvenements({ matches: mobile });
  if (ancienMedia) delete media.addEventListener;
  const window = cibleEvenements({ matchMedia: () => media });
  vm.runInNewContext(bloc('  // ---------- menu mobile', '  // ---------- sommaire repliable'), { document, window });
  return { burger, sidebar, lien, media, document, window };
}

test('menu mobile fermé non accessible au focus ; ouverture et Échap synchronisent état et focus', () => {
  const m = menu();
  assert.equal(m.sidebar.inert, true);
  assert.equal(m.sidebar.attrs['aria-hidden'], 'true');
  assert.equal(m.burger.attrs['aria-controls'], 'sidebar');
  assert.equal(m.burger.attrs['aria-expanded'], 'false');
  m.burger.dispatch('click');
  assert.equal(m.sidebar.inert, false);
  assert.equal(m.sidebar.attrs['aria-hidden'], undefined);
  assert.equal(m.burger.attrs['aria-label'], 'Fermer le menu');
  assert.equal(m.document.activeElement, m.lien);
  assert.equal(m.document.dispatch('keydown', { key: 'Escape' }).defaultPrevented, true);
  assert.equal(m.document.activeElement, m.burger);
  assert.equal(m.burger.attrs['aria-expanded'], 'false');
});

test('lien du menu : navigation native préservée, clic modifié conservé, fermeture par clic extérieur', () => {
  const m = menu();
  m.burger.dispatch('click');
  m.sidebar.dispatch('click', { target: m.lien, ctrlKey: true });
  assert.equal(m.sidebar.classList.contains('open'), true);
  assert.equal(m.sidebar.dispatch('click', { target: m.lien, button: 0 }).defaultPrevented, false);
  assert.equal(m.sidebar.inert, true);
  m.burger.dispatch('click');
  m.document.dispatch('click', { target: m.burger });
  assert.equal(m.sidebar.inert, false);
  m.document.dispatch('click', { target: {} });
  assert.equal(m.sidebar.inert, true);
});

test('le passage ordinateur/mobile rétablit la navigation et fonctionne sans listener MediaQueryList', () => {
  for (const ancien of [false, true]) {
    const m = menu(true, ancien);
    m.media.matches = false;
    (ancien ? m.window : m.media).dispatch(ancien ? 'resize' : 'change');
    assert.equal(m.sidebar.inert, false);
    assert.equal(m.sidebar.attrs['aria-hidden'], undefined);
    m.lien.focus(); m.media.matches = true;
    (ancien ? m.window : m.media).dispatch(ancien ? 'resize' : 'change');
    assert.equal(m.sidebar.inert, true);
    assert.equal(m.document.activeElement, m.burger);
  }
});

function navigation({ hash = '#section', observer = true, entete = true, animation = true, historique = null } = {}) {
  const ecritures = [], frames = [], appels = [];
  let hauteur = 106, observe, fontsReady;
  const titre = { id: 'section', textContent: 'Définition', scrollIntoView: args => appels.push(args) };
  const ref = { id: 'ref-test-1', scrollIntoView: args => appels.push(args) };
  const liens = ['1', 'Bibliographie', '2'].map(textContent => ({
    textContent, attrs: textContent === '2' ? { 'aria-label': 'Référence annotée' } : {},
    hasAttribute(k) { return k in this.attrs; }, setAttribute(k, v) { this.attrs[k] = v; },
  }));
  const header = { getBoundingClientRect: () => ({ height: hauteur }) };
  const document = {
    documentElement: { style: { setProperty: (k, v) => ecritures.push([k, v]) } },
    fonts: { ready: new Promise(resolve => { fontsReady = resolve; }) },
    getElementById: id => [titre, ref].find(el => el.id === id) || null,
    querySelector: s => s === '.site-header' && entete ? header : null,
    querySelectorAll: s => s.includes('a[href') ? liens : s === '.page-body [id]' ? [titre, ref] : [titre],
  };
  const window = cibleEvenements();
  if (historique === 'moderne') window.performance = { getEntriesByType: () => [{ type: 'back_forward' }] };
  if (historique === 'ancien') window.performance = { navigation: { type: 2 } };
  if (animation) window.requestAnimationFrame = fn => frames.push(fn);
  if (observer) window.ResizeObserver = class { constructor(fn) { observe = fn; } observe(el) { assert.equal(el, header); } };
  const location = { hash };
  const ctx = { document, window, location, setTimeout: fn => frames.push(fn), norm: s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() };
  vm.createContext(ctx);
  vm.runInContext(bloc('  // ---------- ancres accentuées', '  // ---------- confort de lecture'), ctx);
  vm.runInContext(bloc("  // ---------- hauteur d'en-tête", '  // ---------- bouton « haut de page »'), ctx);
  return { ctx, window, location, ecritures, appels, liens, titre, ref, frames, fontsReady,
    taille(h) { hauteur = h; if (observe) observe(); else window.dispatch('resize'); } };
}

test('hauteur mesurée, arrondie et actualisée sans réécriture identique, avec et sans ResizeObserver', () => {
  for (const observer of [true, false]) {
    const n = navigation({ observer });
    assert.deepEqual(n.ecritures, [['--hh', '106px']]);
    n.taille(169.2); n.taille(169.2);
    assert.deepEqual(n.ecritures.at(-1), ['--hh', '170px']);
    assert.equal(n.ecritures.length, 2);
    n.taille(NaN); assert.equal(n.ecritures.length, 2);
    n.taille(0); assert.deepEqual(n.ecritures.at(-1), ['--hh', '0px']);
  }
});

test('arrivée différée sur une section ou référence exacte ; hashchange exact reste natif', () => {
  for (const hash of ['#section', '#ref-test-1']) {
    const n = navigation({ hash });
    assert.equal(n.appels.length, 0);
    n.frames[0](); assert.equal(n.appels.length, 1);
    assert.equal(n.appels[0].block, 'start');
    n.window.dispatch('hashchange'); assert.equal(n.appels.length, 1);
    assert.equal(n.location.hash, hash);
  }
});

test('ancres accentuées, texte de titre et hash malformé sans arrêt du script', () => {
  const n = navigation({ hash: '#d%C3%A9finition' });
  assert.equal(n.ctx.cibleAncre(), n.titre);
  n.window.dispatch('hashchange'); assert.equal(n.appels.length, 1);
  n.location.hash = '#SECTI%C3%93N'; assert.equal(n.ctx.cibleAncre(), n.titre);
  for (const hash of ['#%E0%A4%A', '#inconnue', '', '#']) {
    n.location.hash = hash;
    assert.doesNotThrow(() => n.window.dispatch('hashchange'));
    assert.equal(n.ctx.cibleAncre(), null);
  }
});

test('aucun réalignement tardif après une interaction ou un changement de fragment', async () => {
  for (const nom of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'hashchange']) {
    const n = navigation();
    n.frames[0]();
    if (nom === 'hashchange') n.location.hash = '#ref-test-1';
    n.window.dispatch(nom); n.window.dispatch('load'); n.fontsReady();
    await Promise.resolve();
    assert.equal(n.appels.length, 1, nom);
    n.taille(150); assert.equal(n.appels.length, 1, 'redimensionnement sans saut');
  }
});

test('pas de modification des portails ; références nommées sans écraser leurs libellés', () => {
  const n = navigation({ animation: false });
  n.frames[0](); assert.equal(n.appels.length, 1);
  assert.equal(n.liens[0].attrs['aria-label'], 'Consulter la référence 1');
  assert.equal(n.liens[1].attrs['aria-label'], undefined);
  assert.equal(n.liens[2].attrs['aria-label'], 'Référence annotée');
  const portail = navigation({ entete: false });
  assert.equal(portail.ecritures.length, 0); assert.equal(portail.frames.length, 0);
});

test('retour arrière/avant : le navigateur garde la restauration de position', async () => {
  for (const historique of ['moderne', 'ancien']) {
    const n = navigation({ historique });
    n.frames[0](); n.window.dispatch('load'); n.fontsReady();
    await Promise.resolve();
    assert.equal(n.appels.length, 0);
    assert.deepEqual(n.ecritures, [['--hh', '106px']]);
  }
});

test('contrats statiques : un décalage d’ancre, en-tête compact et menu nommé', () => {
  assert.match(css, /html\[data-wiki-entete\]\s*\{\s*scroll-padding-top:\s*calc\(var\(--hh\) \+ \.75rem\)/);
  assert.doesNotMatch(css, /scroll-margin[^;]*var\(--hh\)/);
  assert.match(css, /grid-template-columns: 44px minmax\(0, 1fr\) repeat\(4, 44px\)/);
  assert.match(css, /\.site-header > \.searchbox \{ grid-area: 2 \/ 1 \/ auto \/ -1/);
  assert.match(css, /\.site-header:has\(> #btnInstall\) > \.searchbox \{ grid-column-end: -2/);
  assert.match(css, /\.site-header > #btnInstall \{ grid-area: 2 \/ 6/);
  assert.match(css, /\.page-body \{ font-size: calc\(1rem \* var\(--echelle, 1\)\)/);
  assert.match(css, /\.page-body li:has\(> span\[id\^="ref-"\]:target\)/);
  assert.match(build, /<html lang="fr" data-wiki-entete>/);
  assert.match(build, /aria-expanded="false" aria-controls="sidebar"/);
  assert.match(build, /id="sidebar" aria-label="Navigation du wiki"/);
});
