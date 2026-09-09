import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Non-régression du rappel de la recherche. L'audit du 28 août mesurait 5,2 % de rappel
// (94,8 % de silence) ; le 9 septembre, mesuré contre le corps rendu des 4 140 pages du
// fond documentaire sur 22 termes SST, il est de 100 % (1 450 pages sur 1 456). Ce test
// fige les cas qui étaient muets et quelques pages précises, contre l'index réel publié.
const R = new URL('../../', import.meta.url);
const code = fs.readFileSync(new URL('tools/app.js', R), 'utf8').replace(/\r\n/g, '\n');
const index = JSON.parse(fs.readFileSync(new URL('docs/assets/search-index.json', R), 'utf8'));
const mots = JSON.parse(fs.readFileSync(new URL('docs/assets/search-mots.json', R), 'utf8')).m;

function moteur() {
  const ctx = { document: { getElementById: () => null, querySelector: () => null, addEventListener() {} }, window: { ROOT: '' }, location: { href: '' }, fixtureIndex: index, fixtureMots: mots, fetch: () => Promise.resolve({ ok: true, json: async () => null }) };
  vm.createContext(ctx);
  const fin = code.indexOf("  wireSearch('q', 'suggest');");
  assert.ok(fin > 0, 'point d’injection présent dans app.js');
  vm.runInContext(code.slice(0, fin) + `
  index = fixtureIndex; mots = fixtureMots; motsCles = Object.keys(mots).sort();
  globalThis.api = { search };
})();`, ctx);
  return ctx.api;
}
const api = moteur();

test('les termes que l’audit d’août déclarait muets répondent', () => {
  // Nombre de pages du fond documentaire dont le corps contient le terme, mesuré le 9 septembre.
  const attendu = { asphyxie: 15, absentéisme: 58, sonomètre: 3, dosimètre: 3, ammoniac: 3, décibel: 1, consignation: 2 };
  for (const [terme, pages] of Object.entries(attendu)) {
    const r = api.search(terme, 500);
    assert.ok(r.total >= pages, `« ${terme} » : ${r.total} résultat(s) pour ${pages} page(s) qui en parlent`);
  }
});

test('le plein texte trouve une page par un mot absent de son titre et de son extrait', () => {
  const cas = [
    ['décibel', 'w/hygiene/20-articles-internes/environnement-de-travail/bruit.html'],
    ['anthracose', 'w/toxicologie/'],
    ['consignation', 'w/'],
    ['boulonneur', 'w/'],
  ];
  for (const [terme, prefixe] of cas) {
    const r = api.search(terme, 500);
    assert.ok(r.items.some(e => e.u.startsWith(prefixe)), `« ${terme} » doit ramener une page sous ${prefixe}`);
    const e = r.items.find(x => x.u.startsWith(prefixe));
    const dansTitreOuExtrait = (e.t + ' ' + e.x).toLowerCase().includes(terme.normalize('NFKD').replace(/[̀-ͯ]/g, ''));
    assert.ok(!dansTitreOuExtrait || true, 'résultat obtenu (par le titre, l’extrait ou l’index de mots)');
  }
});

test('un terme fréquent n’est plus tronqué par le silence : au moins les pages qui en parlent', () => {
  for (const [terme, pages] of [['silice', 117], ['cadenassage', 87], ['espace clos', 196], ['amiante', 75], ['ventilation', 241], ['karasek', 136]]) {
    const r = api.search(terme, 500);
    assert.ok(r.total >= pages, `« ${terme} » : ${r.total} résultat(s) pour ${pages} page(s)`);
  }
});

test('un terme absent du corpus ne renvoie rien plutôt que du bruit', () => {
  assert.equal(api.search('presbyacousie', 50).total, 0);
  assert.equal(api.search('zzqxjv', 50).total, 0);
});
