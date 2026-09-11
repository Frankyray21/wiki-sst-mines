// Tests sans navigateur ni dépendance : node app-proposal.test.cjs [app.js] [répertoire du dépôt]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appPath = path.resolve(process.argv[2] || path.join(__dirname, '../app.js'));
const repo = path.resolve(process.argv[3] || path.join(__dirname, '../..'));
const code = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');
const indexReel = JSON.parse(fs.readFileSync(path.join(repo, 'docs/assets/search-index.json'), 'utf8'));
const motsReels = JSON.parse(fs.readFileSync(path.join(repo, 'docs/assets/search-mots.json'), 'utf8')).m;

// Un DOM réduit aux opérations employées par les fonctions testées. Les actions
// natives du navigateur ne sont pas simulées : les assertions portent sur les
// gestionnaires, les liens produits et les états ARIA.
function fauxDocument() {
  const ids = new Map();
  const doc = {
    activeElement: null,
    listeners: {},
    getElementById: id => ids.get(id) || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
  };
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.attrs = {};
      this.children = [];
      this.listeners = {};
      this.style = {};
      this.hidden = false;
      this._html = '';
      this._text = '';
      this._classes = new Set();
      this.classList = {
        contains: c => this._classes.has(c),
        toggle: (c, value) => {
          const on = value === undefined ? !this._classes.has(c) : value;
          if (on) this._classes.add(c); else this._classes.delete(c);
          return on;
        },
      };
    }
    set id(value) { this.attrs.id = value; ids.set(value, this); }
    get id() { return this.attrs.id || ''; }
    set className(value) { this._classes = new Set(value.split(/\s+/).filter(Boolean)); }
    get className() { return [...this._classes].join(' '); }
    set innerHTML(value) { this._html = value; this._text = ''; this.children = []; this._links = null; }
    get innerHTML() { return this._html; }
    set textContent(value) { this._text = value; this._html = ''; this.children = []; this._links = null; }
    get textContent() { return this._text || this._html.replace(/<[^>]*>/g, ''); }
    setAttribute(name, value) { if (name === 'id') this.id = String(value); else this.attrs[name] = String(value); }
    getAttribute(name) { return this.attrs[name] ?? null; }
    hasAttribute(name) { return name in this.attrs; }
    removeAttribute(name) { delete this.attrs[name]; }
    get href() { return new URL(this.attrs.href || '', 'https://example.test/wiki-sst-mines/g/').href; }
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
    insertBefore(child, next) {
      const at = this.children.indexOf(next);
      if (at < 0) return this.appendChild(child);
      this.children.splice(at, 0, child); child.parentNode = this; return child;
    }
    replaceChild(child, old) {
      const at = this.children.indexOf(old);
      assert.ok(at >= 0, 'Élément remplacé présent dans son parent');
      this.children[at] = child; child.parentNode = this; old.parentNode = null;
    }
    contains(child) { return child === this || this.children.some(c => c.contains(child)); }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    dispatch(type, properties = {}) {
      const ev = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...properties };
      for (const fn of this.listeners[type] || []) fn(ev);
      return ev;
    }
    focus() { doc.activeElement = this; }
    scrollIntoView() { this.scrolled = true; }
    querySelectorAll(selector) {
      assert.equal(selector, 'a');
      if (!this._links) {
        this._links = [...this._html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(match => {
          const a = new Element('a');
          for (const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g)) a.setAttribute(attr[1], attr[2]);
          a.innerHTML = match[2]; this.appendChild(a); return a;
        });
      }
      return this._links;
    }
  }
  doc.createElement = tag => new Element(tag);
  doc.body = doc.createElement('body');
  doc.head = doc.createElement('head');
  doc.make = (tag, id, parent = doc.body) => {
    const el = doc.createElement(tag); el.id = id; parent.appendChild(el); return el;
  };
  return doc;
}

function recherche(document = fauxDocument(), fixtureIndex = indexReel, fixtureMots = motsReels, fetchImpl) {
  const ctx = {
    document, window: { ROOT: '../' }, location: { href: '' },
    fixtureIndex, fixtureMots,
    fetch: fetchImpl || (() => Promise.resolve({ ok: true, json: async () => null })),
  };
  vm.createContext(ctx);
  const end = code.indexOf("  wireSearch('q', 'suggest');");
  assert.ok(end > 0);
  vm.runInContext(code.slice(0, end) + `
    index = fixtureIndex;
    if (fixtureMots) { mots = fixtureMots; motsCles = Object.keys(mots).sort(); }
    globalThis.api = { search, wireSearch, resetIndex: function () { index = null; loading = null; } };
  })();`, ctx);
  return ctx;
}

function barreRecherche(fetchImpl) {
  const doc = fauxDocument();
  const parent = doc.make('div', 'search-wrapper');
  const input = doc.make('input', 'q', parent);
  const box = doc.make('div', 'suggest', parent);
  box.hidden = true;
  const fixture = [{ t: 'Silice', u: 'w/silice.html', w: 'Hygiène', i: '', g: '', x: '' }];
  const ctx = recherche(doc, fixture, null, fetchImpl);
  ctx.api.wireSearch('q', 'suggest');
  return { doc, input, box, ctx, fixture };
}

const flush = () => new Promise(resolve => setImmediate(resolve));
let nombre = 0;
async function test(nom, fn) { await fn(); nombre++; console.log('OK ' + nom); }

async function main() {
  await test('Références légales exactes : espaces, tirets, art., article et ordre inversé', () => {
    const ctx = recherche();
    const attendu = 'w/legislation/10-lois-principales/lsst/art-51-lsst-obligations-employeur.html';
    for (const q of ['art 51 LSST', 'art. 51 LSST', 'art.51 LSST', 'LSST art.51', 'article 51 LSST', 'art-51-LSST', '51 LSST']) {
      assert.equal(ctx.api.search(q, 8).items[0].u, attendu, q);
    }
  });
  await test('Références décimales : point, virgule et espaces internes', () => {
    const ctx = recherche();
    for (const q of ['art 212.1 LATMP', 'art.212.1 LATMP', '212,1 LATMP', 'article 212 . 1 LATMP', 'LATMP 212,1']) {
      assert.match(ctx.api.search(q, 8).items[0].t, /^art-212\.1-LATMP/, q);
    }
    assert.match(ctx.api.search('51.1 LSST', 8).items[0].t, /^art-51\.1-LSST/);
  });
  await test('Les paragraphes 51-11 ne remplacent pas l’article 51, même avec des titres ponctués autrement', () => {
    for (const titre of ['art-51-LSST : obligations', 'art-51-LSST, obligations', 'art 51 LSST — obligations', 'Article 51 LSST']) {
      const ctx = recherche(fauxDocument(), [
        { t: 'art-51-11-LSST', u: 'paragraphe', w: '', g: '', x: '' },
        { t: titre, u: 'article', w: '', g: '', x: '' },
      ], null);
      assert.equal(ctx.api.search('51 LSST', 8).items[0].u, 'article', titre);
    }
  });
  await test('La recherche générale conserve des résultats pertinents', () => {
    const ctx = recherche();
    assert.equal(ctx.api.search('stress au travail', 8).items[0].t, 'Stress au travail');
    assert.equal(ctx.api.search('droit de refus', 8).items[0].t, 'Droit de refus');
    assert.match(ctx.api.search('art 4 RSST', 8).items[0].t, /^art-4-RSST/);
    assert.equal(ctx.api.search('   ', 8).total, 0);
  });
  await test('Suggestions : nom accessible, listbox, sélection et fermeture par Échap/Tab', async () => {
    const { input, box, doc } = barreRecherche();
    assert.equal(input.getAttribute('role'), 'combobox');
    assert.equal(input.getAttribute('aria-label'), 'Rechercher dans le wiki');
    assert.equal(input.getAttribute('aria-controls'), 'suggest');
    assert.equal(input.getAttribute('aria-expanded'), 'false');
    assert.equal(box.getAttribute('role'), 'listbox');
    input.focus(); input.value = 'silice'; input.dispatch('input'); await flush();
    assert.equal(input.getAttribute('aria-expanded'), 'true');
    const options = box.querySelectorAll('a');
    assert.equal(options.length, 2, 'Un résultat et le lien vers tous les résultats');
    assert.equal(options[0].getAttribute('role'), 'option');
    assert.equal(options[0].getAttribute('tabindex'), '-1');
    input.dispatch('keydown', { key: 'ArrowDown' });
    assert.equal(input.getAttribute('aria-activedescendant'), options[0].id);
    assert.equal(options[0].getAttribute('aria-selected'), 'true');
    assert.equal(doc.activeElement, input, 'Le focus reste sur le champ');
    input.dispatch('keydown', { key: 'ArrowDown' });
    assert.equal(options[0].getAttribute('aria-selected'), 'false');
    assert.equal(options[1].getAttribute('aria-selected'), 'true');
    input.dispatch('keydown', { key: 'Escape' });
    assert.equal(box.hidden, true);
    assert.equal(input.getAttribute('aria-expanded'), 'false');
    assert.equal(input.getAttribute('aria-activedescendant'), null);
    input.dispatch('input'); await flush();
    assert.equal(box.hidden, false);
    const tab = input.dispatch('keydown', { key: 'Tab' });
    assert.equal(box.hidden, true);
    assert.equal(tab.defaultPrevented, false, 'Tab poursuit la navigation native');
  });
  await test('Entrée ouvre la suggestion sélectionnée', async () => {
    const { input, ctx } = barreRecherche();
    input.value = 'silice'; input.dispatch('input'); await flush();
    input.dispatch('keydown', { key: 'ArrowDown' });
    const enter = input.dispatch('keydown', { key: 'Enter' });
    assert.equal(ctx.location.href, 'https://example.test/wiki-sst-mines/w/silice.html');
    assert.equal(enter.defaultPrevented, true);
  });
  await test('Une réponse asynchrone ne rouvre pas les suggestions après Échap', async () => {
    const attente = [];
    const { input, box, ctx, fixture } = barreRecherche(() => new Promise(resolve => attente.push(resolve)));
    ctx.api.resetIndex(); input.value = 'silice'; input.dispatch('input');
    input.dispatch('keydown', { key: 'Escape' });
    attente[0]({ ok: true, json: async () => fixture });
    attente[1]({ ok: true, json: async () => null });
    await flush(); await flush();
    assert.equal(box.hidden, true);
    assert.equal(input.getAttribute('aria-expanded'), 'false');
  });
  await test('Historique et favoris : dépliage et stockage conservés, titres affichés tels quels', () => {
    const doc = fauxDocument(); doc.body.className = 'tb';
    for (const [liste, voir] of [['tbRecents', 'tbVoirHist'], ['tbFavoris', 'tbVoirFav']]) {
      doc.make('ul', liste).innerHTML = '<li>Liste vide</li>';
      const old = doc.make('a', voir); old.className = 'tb-voir'; old.hidden = true;
    }
    const values = Array.from({ length: 8 }, (_, i) => ({ u: 'w/page-' + i + '.html', t: '🎯 Page ' + i, d: 0 }));
    const ctx = { document: doc, window: {}, ROOT: '../', MEM: { lire: () => values }, escHtml: s => s,
      ilYA: () => 'hier', fetch: () => Promise.resolve({ ok: false }), vUrl: s => s };
    vm.createContext(ctx);
    const start = code.indexOf('  (function tableauDeBord()');
    const end = code.indexOf('  // ---------- aperçu des liens', start);
    vm.runInContext(code.slice(start, end), ctx);
    for (const [liste, voir] of [['tbRecents', 'tbVoirHist'], ['tbFavoris', 'tbVoirFav']]) {
      const ul = doc.getElementById(liste), button = doc.getElementById(voir);
      assert.ok(ul.innerHTML.includes('🎯'), 'titres affichés tels quels');
      assert.equal(values[0].t, '🎯 Page 0', 'stockage intact');
      assert.equal(ul.querySelectorAll('a').length, 5);
      assert.equal(button.tagName, 'BUTTON');
      assert.equal(button.type, 'button');
      assert.equal(button.hidden, false);
      assert.equal(button.getAttribute('aria-controls'), liste);
      assert.equal(button.getAttribute('aria-expanded'), 'false');
      assert.equal(button.hasAttribute('href'), false, 'Aucun détournement vers recherche.html');
      button.focus(); button.dispatch('click');
      assert.equal(ul.querySelectorAll('a').length, 8);
      assert.equal(ul.querySelectorAll('a')[7].getAttribute('href'), '../w/page-7.html');
      assert.equal(button.getAttribute('aria-expanded'), 'true');
      assert.equal(doc.activeElement, button);
      button.dispatch('click');
      assert.equal(ul.querySelectorAll('a').length, 5);
      assert.equal(button.getAttribute('aria-expanded'), 'false');
    }
  });
  await test('Les valeurs de stockage JSON non tableaux ne cassent pas les listes', () => {
    for (const value of ['null', '{}', 'false', 'invalide']) {
      const ctx = { localStorage: { getItem: () => value } }; vm.createContext(ctx);
      vm.runInContext(code.slice(code.indexOf('  var MEM ='), code.indexOf('  function urlCourante()')), ctx);
      assert.equal(ctx.MEM.lire('historique').length, 0, value);
    }
  });
  await test('Visite guidée : Entrée respecte Précédent/Passer, les raccourcis et Échap restent actifs', () => {
    const actions = [];
    const ctx = { aller: n => actions.push(n), fermer: () => actions.push('fermer') }; vm.createContext(ctx);
    const start = code.indexOf('    function auClavier(ev)');
    vm.runInContext(code.slice(start, code.indexOf('    function placer()', start)), ctx);
    for (const name of ['Précédent', 'Passer', 'Suivant']) {
      let prevented = false;
      ctx.auClavier({ key: 'Enter', target: { textContent: name, closest: () => ({}) }, preventDefault() { prevented = true; } });
      assert.equal(actions.length, 0, name);
      assert.equal(prevented, false, name + ' garde son activation native');
    }
    ctx.auClavier({ key: 'ArrowRight', preventDefault() {} });
    ctx.auClavier({ key: 'ArrowLeft', preventDefault() {} });
    ctx.auClavier({ key: 'Enter', defaultPrevented: true, preventDefault() {} });
    ctx.auClavier({ key: 'Escape', preventDefault() {} });
    assert.deepEqual(actions, [1, -1, 'fermer']);
  });
  console.log(nombre + ' tests réussis : ' + appPath);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
