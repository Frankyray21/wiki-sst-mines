// L'article en PDF (bouton « PDF » de la barre de lecture) : module de tools/app.js exécuté hors
// navigateur avec un DOM simulé, contrat de la feuille d'impression, pont de l'application Android.
// Le rendu réel (Chromium : bouton, impression, PDF produit) a été vérifié à part.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const debut = app.indexOf("  // ---------- l'article en PDF ----------");
const fin = app.indexOf('  // ---------- confort de lecture', debut);
const code = app.slice(debut, fin);
const ADRESSE = 'https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/page.html';

function ecouteur(obj = {}) {
  const l = {};
  return Object.assign(obj, {
    addEventListener(n, fn) { (l[n] ||= []).push(fn); },
    dispatch(n) { for (const fn of [...(l[n] || [])]) fn({ target: this }); },
  });
}
function monde({ article = true, ua = 'Mozilla/5.0 Chrome/128', pont = false, enLigne = true, adresse = ADRESSE, pret = 'interactive' } = {}) {
  const imgs = [
    ecouteur({ attrs: { loading: 'lazy' }, complete: false }),
    ecouteur({ attrs: {}, complete: true }),
  ];
  for (const i of imgs) Object.assign(i, { getAttribute(k) { return this.attrs[k] ?? null; }, setAttribute(k, v) { this.attrs[k] = v; } });
  const main = { enfants: [{ className: 'breadcrumbs' }], get firstChild() { return this.enfants[0]; }, insertBefore(e, ref) { this.enfants.splice(this.enfants.indexOf(ref), 0, e); } };
  const document = {
    readyState: pret,
    title: 'Page — WIKI SST Mines',
    querySelector: s => ({ '.page-body': article ? {} : null, '.page-title': article ? {} : null, 'main.content': main })[s] ?? null,
    querySelectorAll: s => (s === 'main img' ? imgs : []),
    createElement: () => ({ className: '', textContent: '' }),
  };
  const u = new URL(adresse);
  const location = { href: adresse, search: u.search };
  const journal = { imprime: 0, alertes: [], pont: [], remplace: [], minuteries: [] };
  const window = ecouteur({ print() { journal.imprime++; } });
  if (pont) window.WikiSSTMinesApp = { imprimer: t => journal.pont.push(t) };
  const ctx = {
    document, window, location, navigator: { userAgent: ua, onLine: enLigne },
    history: { state: null, replaceState(s, t, a) { journal.remplace.push(a); } },
    alert: m => journal.alertes.push(m),
    setTimeout: (fn, ms) => { journal.minuteries.push(ms); if (ms <= 300) fn(); },
  };
  vm.runInNewContext(code, ctx);
  return { PDF: ctx.PDF, window, main, imgs, journal, location };
}
const tour = () => new Promise(r => setImmediate(r));

test('hors d’un article, pas de module ni de bouton', () => {
  assert.equal(monde({ article: false }).PDF, null);
  assert.match(app, /\(PDF \? '<button type="button" data-pdf [^']*>📄 PDF<\/button>' : ''\)/, 'le bouton n’existe que si le module existe');
  assert.match(app, /if \(bPdf\) bPdf\.addEventListener\('click', function \(\) \{ PDF\.imprimer\(\); \}\);/);
});

test('navigateur : source et date en tête, images chargées, puis impression', async () => {
  const m = monde();
  m.PDF.imprimer();
  const source = m.main.firstChild;
  assert.equal(source.className, 'impression-source');
  assert.match(source.textContent, /^WIKI SST Mines · https:\/\/frankyray21\.github\.io\/wiki-sst-mines\/w\/psychosocial\/page\.html · téléchargé le \d{1,2} \S+ \d{4}$/);
  assert.equal(m.imgs[0].attrs.loading, 'eager', 'l’image en chargement différé est demandée tout de suite');
  await tour();
  assert.equal(m.journal.imprime, 0, 'on attend l’image');
  m.imgs[0].dispatch('load');
  await tour(); await tour();
  assert.equal(m.journal.imprime, 1);
  assert.ok(m.journal.minuteries.includes(5000), 'une image qui ne vient pas n’empêche pas le PDF plus de 5 s');
  m.PDF.imprimer();
  assert.equal(m.main.enfants.filter(e => e.className === 'impression-source').length, 1, 'une seule ligne de source');
  // impression par le menu du navigateur : la ligne est posée aussi
  const n = monde();
  n.window.dispatch('beforeprint');
  assert.equal(n.main.firstChild.className, 'impression-source');
});

test('application Android sans impression native : la page part au navigateur, en http, avec ?pdf=1', () => {
  const m = monde({ ua: 'Mozilla/5.0 Chrome/128 WikiSSTMinesApp/1.0' });
  m.PDF.imprimer();
  assert.equal(m.location.href, 'http://frankyray21.github.io/wiki-sst-mines/w/psychosocial/page.html?pdf=1');
  assert.equal(m.journal.imprime, 0);
  const h = monde({ ua: 'Mozilla/5.0 WikiSSTMinesApp/1.0', enLigne: false });
  h.PDF.imprimer();
  assert.equal(h.location.href, ADRESSE, 'hors réseau, on ne part pas');
  assert.match(h.journal.alertes[0], /il faut du réseau/);
});

test('application Android qui sait imprimer : le pont reçoit le titre, sans window.print', async () => {
  const m = monde({ ua: 'Mozilla/5.0 WikiSSTMinesApp/1.1', pont: true });
  m.PDF.imprimer();
  m.imgs[0].dispatch('load');
  await tour(); await tour();
  assert.deepEqual(m.journal.pont, ['Page — WIKI SST Mines']);
  assert.equal(m.journal.imprime, 0);
});

test('arrivée avec ?pdf=1 : l’adresse est nettoyée, l’impression se lance au chargement', async () => {
  const m = monde({ adresse: ADRESSE + '?a=1&pdf=1' });
  assert.deepEqual(m.journal.remplace, [ADRESSE + '?a=1']);
  assert.equal(m.journal.imprime, 0);
  m.window.dispatch('load');
  m.imgs[0].dispatch('load');
  await tour(); await tour();
  assert.equal(m.journal.imprime, 1);
  assert.deepEqual(monde({ adresse: ADRESSE + '?pdf=1&a=1' }).journal.remplace, [ADRESSE + '?a=1']);
  assert.deepEqual(monde({ adresse: ADRESSE + '?pdf=1' }).journal.remplace, [ADRESSE]);
  assert.deepEqual(monde({ adresse: ADRESSE + '?pdf=10' }).journal.remplace, [], 'seul pdf=1 compte');
  // restée dans l'application (le navigateur ne l'a pas prise) : un mot, pas d'impression muette
  const a = monde({ adresse: ADRESSE + '?pdf=1', ua: 'Mozilla/5.0 WikiSSTMinesApp/1.0' });
  a.window.dispatch('load');
  assert.equal(a.journal.imprime, 0);
  assert.match(a.journal.alertes[0], /ouvrez cette page dans le navigateur/);
});

test('feuille d’impression : un PDF autonome, en clair, sans les aides d’écran', () => {
  const bloc = css.slice(css.indexOf("/* ---------- l'article en PDF"));
  assert.match(bloc, /^\.impression-source \{ display: none; \}$/m, 'la ligne de source ne s’affiche pas à l’écran');
  assert.match(bloc, /@media print \{[\s\S]*\.impression-source \{ display: block;/);
  assert.match(bloc, /:root \{ --echelle: 1 !important; \}/, 'A+ ne grossit pas le PDF');
  assert.match(bloc, /\.img-zoom, \.infographie \.img-zoom \{ display: none !important; \}/, 'pas de « Toucher l’image » dans le PDF');
  assert.match(bloc, /\.page-body thead \{ display: table-header-group; \}/);
  // le thème sombre (défaut) ne vaut qu'à l'écran : le PDF est en noir sur blanc
  assert.match(css, /@media screen \{\s*\/\*[\s\S]*?\*\/\s*:root:not\(\[data-theme="light"\]\):not\(\[data-theme="auto"\]\) \{/);
  assert.match(css, /@media print \{\s*\.site-header, \.sidebar, \.site-footer/, 'menus, barre latérale et pied masqués');
});

test('application Android : un pont qui ne sait qu’imprimer la page affichée', () => {
  const java = fs.readFileSync(new URL('../android/src/io/github/frankyray21/wikisstmines/MainActivity.java', import.meta.url), 'utf8');
  assert.ok(java.includes('vue.addJavascriptInterface(new Pont(), "WikiSSTMinesApp");'));
  const pont = java.slice(java.indexOf('private class Pont'), java.indexOf('private class Client'));
  assert.equal((pont.match(/@JavascriptInterface/g) || []).length, 1, 'une seule méthode exposée à la page');
  assert.match(pont, /public void imprimer\(final String titre\)/);
  assert.match(pont, /impression\.print\(nom, vue\.createPrintDocumentAdapter\(nom\), new PrintAttributes\.Builder\(\)\.build\(\)\);/);
  assert.match(app, /var a = window\.WikiSSTMinesApp; return a && typeof a\.imprimer === 'function' \? a : null;/, 'le site cherche ce même nom');
});
