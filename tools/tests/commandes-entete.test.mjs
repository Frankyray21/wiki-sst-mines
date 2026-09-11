import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Commandes de l'en-tête partagées par toutes les pages : thème, hors ligne, installation.
// Depuis le retrait du wiki des travailleurs, il n'existe plus de mode « interface sobre » (WIKI_UI).
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('thème : trois états, mémoire et libellés accessibles', () => {
  const attrs = {}, store = new Map(); let click;
  const btn = { innerHTML: '', textContent: '', setAttribute(k, v) { attrs[k] = v; }, addEventListener(k, f) { click = f; } };
  const doc = { getElementById: () => btn, documentElement: { setAttribute(k, v) { attrs[k] = v; }, removeAttribute(k) { delete attrs[k]; } } };
  const ctx = { document: doc, window: {}, localStorage: { getItem: k => store.get(k), setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) } };
  const start = app.indexOf('  (function theme()');
  vm.runInNewContext(app.slice(start, app.indexOf('  // ---------- menu mobile', start)), ctx);
  for (const etat of ['auto', 'light', 'dark', 'auto']) {
    assert.equal(btn.textContent, { auto: '🌗', light: '☀️', dark: '🌙' }[etat]);
    assert.ok(attrs['aria-label'].includes('Thème :'));
    assert.equal(store.get('theme'), etat === 'auto' ? undefined : etat);
    click();
  }
});

test('les boutons hors ligne et installation gardent actions, noms et pictogrammes', () => {
  const boutons = [];
  const ancre = { className: 'btn-theme', parentNode: { insertBefore(b) { boutons.push(b); } } };
  const document = { getElementById: id => id === 'btnTheme' ? ancre : null, createElement: () => ({ attrs: {}, events: {}, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(k, f) { this.events[k] = f; } }) };
  const ctx = { document, window: {}, ouvrirPanneau() {}, aideInstallation() {}, promptInstall: null };
  const startHl = app.indexOf('      (function boutonHl()');
  const endHl = app.indexOf('      })();', startHl) + '      })();'.length;
  vm.runInNewContext(app.slice(startHl, endHl), ctx);
  const startInstall = app.indexOf('    function creerBouton()');
  vm.runInNewContext(app.slice(startInstall, app.indexOf('    // iPhone/iPad', startInstall)) + '\ncreerBouton();', ctx);
  assert.equal(boutons.length, 2);
  assert.equal(boutons[0].id, 'btnHorsLigne');
  assert.equal(boutons[0].textContent, '📶');
  assert.equal(boutons[1].id, 'btnInstall');
  assert.equal(boutons[1].textContent, '📲');
  for (const b of boutons) {
    assert.ok(b.attrs['aria-label']);
    assert.equal(typeof b.events.click, 'function');
  }
});

test('plus aucune trace du wiki des travailleurs dans le script partagé', () => {
  assert.doesNotMatch(app, /WIKI_UI|tour-travailleurs|encart-urgence|data-pub'\) === 't'/);
  assert.ok(app.includes("'tour-portail'") && app.includes('.portal-sujets') && app.includes('.portal-publics'), 'visite du portail mise à jour');
});
