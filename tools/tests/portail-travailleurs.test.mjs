import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { rendrePortailTravailleurs, rendrePortailEncadrement, texteSansEmoji, faviconTravailleurs } from '../portail_encadrement.mjs';

const options = {
  R: '../', nbLois: 10, majDate: '6 septembre 2026', verifier: () => true,
  rubriques: ['personne', 'air', 'soleil', 'cerveau', 'lune', 'gens', 'balance', 'alerte', 'accueil'].map((icone, i) => ({
    titre: 'Sujet ' + i, icone, membres: [{ t: '👷🏽‍♀️ Une page ' + i, u: 't/page-' + i + '.html', dom: '🦺 Ergonomie' }],
  })),
  accueils: [{ t: '🎯 Démarrage rapide', u: 't/demarrage.html', dom: '📋 Droit du travail' }],
  autres: [{ t: '<script> & "titre"', u: 't/autre.html', dom: 'Domaine' }],
};
const { html } = rendrePortailTravailleurs(options);
const script = html.match(/<script>(window\.WIKI_UI[\s\S]*?)<\/script>/)[1];
const context = { window: {} };
vm.runInNewContext(script, context);
const ui = context.window.WIKI_UI;
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('nettoyage visuel des emojis composés, accents et valeurs conservés', () => {
  for (const source of ['👷🏽‍♀️ Postures', '🎯 Postures', '🇨🇦 Postures', 'Postures 🦺']) assert.equal(texteSansEmoji(source), 'Postures');
  assert.equal(texteSansEmoji('35 °C · 2,5 m/s² · art. 51.1 · Énergie'), '35 °C · 2,5 m/s² · art. 51.1 · Énergie');
  assert.equal(ui.texte('👷🏽‍♀️ Énergie'), 'Énergie', 'même fonction sérialisée côté navigateur');
});

test('rubriques SVG et cartes allégées, sans modifier destinations ou données', () => {
  const texte = html.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '').replace(/©/g, '');
  assert.doesNotMatch(texte, /\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u200D\uFE0F]/u);
  for (let i = 0; i < 9; i++) {
    assert.ok(html.includes('href="#rub-' + i + '"'));
    assert.ok(html.includes('id="rub-' + i + '"'));
    assert.ok(html.includes('href="../t/page-' + i + '.html"'));
  }
  assert.ok(html.includes('href="../t/demarrage.html"'));
  assert.ok(html.includes('&lt;script&gt; &amp; &quot;titre&quot;'));
  assert.ok(options.accueils[0].t.startsWith('🎯'), 'données sources intactes');
  assert.doesNotMatch(html, /tb-situ-emoji|tb-nav-emoji|tb-rub-emoji|tb-avatar-emoji/);
  assert.equal((html.match(/class="tb-carte tb-situ"/g) || []).length, 11);
  assert.doesNotMatch(html, /class="tb-situ-ic/);
  for (const numero of ['911', '811', '988']) assert.ok(html.includes('href="tel:' + numero + '"'));
  for (const svg of html.replace(/<script>[\s\S]*?<\/script>/g, '').matchAll(/<svg\b[^>]*>/g)) {
    assert.ok(svg[0].includes('aria-hidden="true"'));
    assert.ok(svg[0].includes('focusable="false"'));
  }
  for (const svg of Object.values(ui.icones)) assert.ok(svg.includes('aria-hidden="true"') && svg.includes('focusable="false"'));
  assert.ok(decodeURIComponent(faviconTravailleurs).includes('<path'));
  assert.ok(!decodeURIComponent(faviconTravailleurs).includes('<text'));
});

test('le portail encadrement ne reçoit pas le traitement travailleurs', () => {
  const encadrement = rendrePortailEncadrement(options).html;
  assert.ok(!encadrement.includes('WIKI_UI'));
  assert.ok(encadrement.includes('Bonjour François 👋'));
});

test('thème SVG : trois états, mémoire et libellés accessibles ; autres pages inchangées', () => {
  for (const sobre of [true, false]) {
    const attrs = {}, store = new Map(); let click;
    const btn = { innerHTML: '', textContent: '', setAttribute(k, v) { attrs[k] = v; }, addEventListener(k, f) { click = f; } };
    const doc = { getElementById: () => btn, documentElement: { setAttribute(k, v) { attrs[k] = v; }, removeAttribute(k) { delete attrs[k]; } } };
    const ctx = { document: doc, window: sobre ? { WIKI_UI: ui } : {}, localStorage: { getItem: k => store.get(k), setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) } };
    const start = app.indexOf('  (function theme()');
    vm.runInNewContext(app.slice(start, app.indexOf('  // ---------- menu mobile', start)), ctx);
    for (const etat of ['auto', 'light', 'dark', 'auto']) {
      assert.equal(sobre ? btn.innerHTML : btn.textContent, sobre ? ui.icones[etat] : { auto: '🌗', light: '☀️', dark: '🌙' }[etat]);
      assert.ok(attrs['aria-label'].includes('Thème :'));
      assert.equal(store.get('theme'), etat === 'auto' ? undefined : etat);
      click();
    }
  }
});

test('les boutons hors ligne et installation gardent actions et noms avec des SVG', () => {
  const boutons = [];
  const ancre = { className: 'tb-icone-btn', parentNode: { insertBefore(b) { boutons.push(b); } } };
  const document = { getElementById: id => id === 'btnTheme' ? ancre : null, createElement: () => ({ attrs: {}, events: {}, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(k, f) { this.events[k] = f; } }) };
  const ctx = { document, window: { WIKI_UI: ui }, ouvrirPanneau() {}, aideInstallation() {}, promptInstall: null };
  const startHl = app.indexOf('      (function boutonHl()');
  const endHl = app.indexOf('      })();', startHl) + '      })();'.length;
  vm.runInNewContext(app.slice(startHl, endHl), ctx);
  const startInstall = app.indexOf('    function creerBouton()');
  vm.runInNewContext(app.slice(startInstall, app.indexOf('    // iPhone/iPad', startInstall)) + '\ncreerBouton();', ctx);
  assert.equal(boutons.length, 2);
  for (const b of boutons) {
    assert.ok(b.innerHTML.startsWith('<svg'));
    assert.ok(b.attrs['aria-label']);
    assert.equal(typeof b.events.click, 'function');
  }
  assert.equal(boutons[0].id, 'btnHorsLigne');
  assert.equal(boutons[1].id, 'btnInstall');
});
