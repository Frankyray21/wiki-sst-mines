import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Thème sombre par défaut (21 septembre 2026). Le wiki se lit sous terre et de nuit, sur une
// tablette de chantier livrée en clair : c'est le sombre qui ne doit rien demander. Trois états
// portés par data-theme — absent = sombre, « light » = clair, « auto » = comme l'appareil.
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
const portail = fs.readFileSync(path.join(R, 'tools/portail.css'), 'utf8');
const app = fs.readFileSync(path.join(R, 'tools/app.js'), 'utf8');
const gen = fs.readFileSync(path.join(R, 'tools/build_site.mjs'), 'utf8');

test('la palette sombre s’applique sans attribut, la claire sur demande', () => {
  for (const [nom, feuille] of [['style.css', css], ['portail.css', portail]]) {
    assert.match(feuille, /@media screen \{[\s\S]{0,600}:root:not\(\[data-theme="light"\]\):not\(\[data-theme="auto"\]\) \{/,
      nom + ' : sombre par défaut, hors impression');
    assert.match(feuille, /@media screen and \(prefers-color-scheme: dark\) \{\s*(\/\*[\s\S]*?\*\/\s*)?:root\[data-theme="auto"\] \{/,
      nom + ' : l’état « auto » suit l’appareil');
    assert.ok(!/^:root\[data-theme="dark"\] \{/m.test(feuille), nom + ' : plus de bloc lié au seul choix explicite');
  }
  // la palette claire reste celle de :root, donc l'impression sort en noir sur blanc
  assert.match(css, /^:root \{[\s\S]*?color-scheme: light;[\s\S]*?^\}/m);
  const print = css.slice(css.indexOf('@media print {\n  .site-header'));
  assert.match(print, /:root \{ --bg: #fff;/, 'l’impression force la palette claire');
  const sombres = [...css.matchAll(/--bg: #16181d/g)].map(m => m.index);
  assert.equal(sombres.length, 2, 'deux blocs sombres : défaut et auto');
  for (const i of sombres) {
    const avant = css.slice(0, i);
    assert.ok(avant.lastIndexOf('@media screen') > avant.lastIndexOf('@media print'), 'aucun bloc sombre ne survit à l’impression');
  }
});

test('le script d’entête et le bouton s’accordent sur le défaut sombre', () => {
  // posé avant le premier rendu : pas d'éclair blanc au chargement
  assert.match(gen, /if\(t==='light'\|\|t==='auto'\)document\.documentElement\.setAttribute\('data-theme',t\)/);
  assert.ok(!/t==='dark'\|\|t==='light'/.test(gen), 'un « dark » stocké n’a plus besoin d’attribut');
  assert.match(app, /return \(v === 'light' \|\| v === 'auto'\) \? v : 'dark';/, 'sans choix retenu : sombre');
  assert.match(app, /catch \(e\) \{ return 'dark'; \}/, 'stockage bloqué : sombre aussi');
  assert.match(app, /\{ cle: 'dark', icone: '🌙', libelle: 'Thème : sombre \(par défaut\)' \}/);
  assert.match(app, /if \(v === 'dark'\) document\.documentElement\.removeAttribute\('data-theme'\);/);
  // le cycle du bouton passe par les trois états
  const etats = [...app.matchAll(/\{ cle: '(dark|light|auto)'/g)].map(m => m[1]);
  assert.deepEqual(etats, ['dark', 'light', 'auto']);
});

test('site publié : le script d’entête est à jour sur toutes les pages', () => {
  const DOCS = path.join(R, 'docs');
  let vues = 0, anciennes = [];
  (function walk(d, rel = '') {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) { if (r !== 'files') walk(path.join(d, e.name), r); continue; }
      if (!e.name.endsWith('.html')) continue;
      const html = fs.readFileSync(path.join(d, e.name), 'utf8');
      if (!html.includes("localStorage.getItem('theme')")) continue;
      vues++;
      if (!html.includes("if(t==='light'||t==='auto')")) anciennes.push(r);
    }
  })(DOCS);
  assert.ok(vues > 4000, `${vues} pages portent le script de thème`);
  assert.deepEqual(anciennes.slice(0, 3), [], `${anciennes.length} page(s) avec l’ancien script`);
});
