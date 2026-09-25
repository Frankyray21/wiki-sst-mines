// Visionneuse d'image : gestionnaires simulés hors navigateur, contrat CSS de la taille standard.
// Le rendu réel (Chromium, téléphone et tablette) est vérifié à part par tools/verif_rendu.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const debut = app.indexOf("  // ---------- visionneuse d'image sur place");
const fin = app.indexOf('  // ---------- application installable (PWA)', debut);
const code = app.slice(debut, fin);

function ecouteur(obj = {}) {
  const l = {};
  return Object.assign(obj, {
    addEventListener(n, fn) { (l[n] ||= []).push(fn); },
    removeEventListener(n, fn) { l[n] = (l[n] || []).filter(f => f !== fn); },
    dispatch(n, valeurs = {}) {
      const ev = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...valeurs };
      for (const fn of [...(l[n] || [])]) fn(ev);
      return ev;
    },
  });
}
function classes() {
  const c = new Set();
  return { contains: x => c.has(x), add: x => c.add(x), remove: x => c.delete(x), toggle(x, on) { if (on ?? !c.has(x)) c.add(x); else c.delete(x); return c.has(x); } };
}
function monde({ filtre = 'none' } = {}) {
  const document = ecouteur({ activeElement: null });
  const el = tag => ecouteur({
    tagName: tag.toUpperCase(), attrs: {}, style: {}, children: [], classList: classes(), parent: null,
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] ?? null; },
    appendChild(c) { c.parent = this; this.children.push(c); return c; },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); this.parent = null; },
    focus() { document.activeElement = this; },
    getBoundingClientRect: () => ({ width: 300 }), naturalWidth: 480,
  });
  document.createElement = el;
  document.body = el('body');
  document.documentElement = el('html');
  const historique = { state: null, pile: 0, pushState(s) { this.state = s; this.pile++; }, back() { this.pile--; this.state = null; window.dispatch('popstate'); } };
  const window = ecouteur({ getComputedStyle: () => ({ filter: filtre }) });
  vm.runInNewContext(code, { document, window, history: historique });
  const lien = el('a'); lien.attrs.href = '../../files/infographies/schema.svg';
  const image = el('img'); image.alt = 'Schéma de démonstration';
  lien.querySelector = () => image;
  image.closest = sel => (sel === '.page-img a' ? lien : null);
  const clic = (cible = image, extra = {}) => document.dispatch('click', { target: cible, button: 0, ...extra });
  const visionneuse = () => document.body.children.find(c => c.className === 'visionneuse');
  return { document, window, historique, lien, image, clic, visionneuse };
}

test('toucher une image l’ouvre agrandie sur place, focus sur ✕, entrée d’historique posée', () => {
  const m = monde();
  assert.equal(m.clic().defaultPrevented, true, 'pas de navigation vers le fichier');
  const v = m.visionneuse();
  assert.ok(v, 'visionneuse ouverte');
  assert.equal(v.attrs.role, 'dialog');
  assert.equal(v.attrs['aria-modal'], 'true');
  assert.match(v.attrs['aria-label'], /Schéma de démonstration/);
  const [bouton, img] = v.children;
  assert.equal(img.src, '../../files/infographies/schema.svg');
  assert.equal(m.document.activeElement, bouton, 'focus sur le bouton Fermer');
  assert.ok(m.document.documentElement.classList.contains('visionneuse-ouverte'), 'page figée derrière');
  assert.equal(m.historique.pile, 1);
});

test('Échap referme, rend le focus à l’image d’origine et retire l’entrée d’historique', () => {
  const m = monde();
  m.clic();
  assert.equal(m.document.dispatch('keydown', { key: 'Escape' }).defaultPrevented, true);
  assert.equal(m.visionneuse(), undefined);
  assert.equal(m.document.activeElement, m.lien);
  assert.equal(m.historique.pile, 0);
  assert.ok(!m.document.documentElement.classList.contains('visionneuse-ouverte'));
});

test('le bouton Retour du téléphone referme sans reculer d’une page de plus', () => {
  const m = monde();
  m.clic();
  m.historique.state = null; m.historique.pile--; // le navigateur a déjà reculé
  m.window.dispatch('popstate');
  assert.equal(m.visionneuse(), undefined);
  assert.equal(m.historique.pile, 0, 'aucun second retour');
});

test('toucher à côté ou ✕ referme ; toucher l’image bascule en taille réelle, au moins le double', () => {
  const m = monde();
  m.clic();
  const v = m.visionneuse(), [bouton, img] = v.children;
  v.dispatch('click', { target: img });
  assert.ok(v.classList.contains('vis-reelle'));
  assert.equal(img.style.width, '600px', 'double de la largeur ajustée quand l’image est petite');
  v.dispatch('click', { target: img });
  assert.ok(!v.classList.contains('vis-reelle'));
  assert.equal(img.style.width, '');
  v.dispatch('click', { target: bouton });
  assert.equal(m.visionneuse(), undefined);
});

test('Tab reste dans la fenêtre ; clic modifié et fichier non image gardent le comportement natif', () => {
  const m = monde();
  assert.equal(m.clic(m.image, { ctrlKey: true }).defaultPrevented, false);
  m.lien.attrs.href = 'doc.pdf';
  assert.equal(m.clic().defaultPrevented, false);
  m.lien.attrs.href = 'photo.JPG?v=2';
  m.clic();
  const bouton = m.visionneuse().children[0];
  m.document.activeElement = null;
  assert.equal(m.document.dispatch('keydown', { key: 'Tab' }).defaultPrevented, true);
  assert.equal(m.document.activeElement, bouton);
});

test('un schéma inversé en thème sombre le reste une fois agrandi', () => {
  const m = monde({ filtre: 'invert(0.9) hue-rotate(180deg)' });
  m.clic();
  assert.equal(m.visionneuse().children[1].style.filter, 'invert(0.9) hue-rotate(180deg)');
});

test('taille standard : captures plafonnées en hauteur, infographies plus hautes, proportions gardées', () => {
  assert.match(css, /\.page-img img \{ width: auto; max-height: min\(24rem, 60vh\); object-fit: contain; \}/);
  assert.match(css, /\.infographie \.page-img img \{[^}]*width: auto; max-width: 100%; height: auto; max-height: min\(34rem, 75vh\)/);
  assert.match(css, /\.page-img a \{[^}]*cursor: zoom-in/);
  assert.match(css, /\.visionneuse\.vis-reelle \{[^}]*overflow: auto/);
});
