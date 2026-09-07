import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { marked } from 'marked';
import { normaliserBibliographie } from '../bibliographie.mjs';

const ancre = n => '<span id="ref-test-' + n + '"></span>';
const rendu = md => marked.parse(md, {gfm:true, breaks:true});
const valeurs = html => [...html.matchAll(/<li value="(\d+)">/g)].map(m => +m[1]);
const liens = html => [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);

test('bibliographie : les formes Marked deviennent une liste continue sans lignes vides', () => {
  const md = '[1](#ref-test-1)\n\n## Références\n\n' + [1, 2, 3, 4].map(n =>
    ancre(n) + '\n' + n + '. **Source ' + n + '.** [Titre](https://example.org/' + n + '). Explication.'
  ).join('\n\n') + '\n\n## Portée\n\nTexte conservé.';
  const avant = rendu(md);
  assert.match(avant, /<br>2\./);
  const apres = normaliserBibliographie(avant);
  assert.equal((apres.match(/<ol class="references-liste">/g) || []).length, 1);
  assert.deepEqual(valeurs(apres), [1, 2, 3, 4]);
  assert.deepEqual(liens(apres), liens(avant));
  for (let n = 1; n <= 4; n++) assert.equal((apres.match(new RegExp('id="ref-test-' + n + '"', 'g')) || []).length, 1);
  assert.doesNotMatch(apres, /<p><span id="ref-|<br>[1-4]\./);
  assert.ok(apres.includes('<h2>Portée</h2>\n<p>Texte conservé.</p>'));
  assert.equal(normaliserBibliographie(apres), apres);
});

test('bibliographie : départ décalé et valeur explicite préservés, jamais déduits de l’ancre', () => {
  const html = '<p>' + ancre(99) + '</p><ol start="3"><li>Troisième.</li></ol>\n'
    + '<p>' + ancre(1) + '<br>7. Septième.</p>';
  const apres = normaliserBibliographie(html);
  assert.deepEqual(valeurs(apres), [3, 7]);
  const explicite = '<p>' + ancre(2) + '</p><ol start="3"><li value="8">Huitième.</li></ol>';
  assert.deepEqual(valeurs(normaliserBibliographie(explicite)), [8]);
});

test('bibliographie : listes déjà correctes, liens, ordre, attributs et sauts utiles conservés', () => {
  const corps = '<li value="4">' + ancre(1) + 'Source.<br>Complément <a href="https://example.org">lié</a>.</li>\n'
    + '<li>' + ancre(2) + '<p>Autre source.</p></li>';
  const html = '<ol start="4" class="existante" aria-label="Sources">' + corps + '</ol>';
  const apres = normaliserBibliographie(html);
  assert.equal(apres, '<ol start="4" class="existante references-liste" aria-label="Sources">' + corps + '</ol>');
  assert.equal(normaliserBibliographie(apres), apres);
});

test('bibliographie : une ancre ne transforme pas une liste d’actions ou imbriquée', () => {
  const ordinaires = [
    '<p>' + ancre(1) + '</p><ol><li>Agir.</li><li>Vérifier.</li></ol>',
    '<p>' + ancre(1) + '</p><ol><li>Agir.<ul><li>Vérifier.</li></ul></li></ol>',
    '<ol><li>Agir <a href="#ref-test-1">1</a>.</li></ol>',
    '<ol><li>' + ancre(1) + 'Source.</li><li>Action sans ancre.</li></ol>',
    '<ol reversed><li>' + ancre(1) + 'Source.</li></ol>',
    '<p>' + ancre(1) + '</p><ol reversed><li>Source.</li></ol>',
    '<p>' + ancre(1) + '<br>2. <strong>Source.</strong><ul><li>Contenu structuré.</li></ul></p>',
    '<p>' + ancre(1) + '<br>2. Source.<hr>Autre bloc.</p>',
    '<p>' + ancre(1) + '</p><ol><li><section>Source structurée.</section></li></ol>',
  ];
  for (const html of ordinaires) assert.equal(normaliserBibliographie(html), html, html);
});

test('bibliographie : prose intercalée non absorbée, code et scripts intacts', () => {
  const ref = '<p>' + ancre(1) + '<br>2. Une source.</p>';
  const html = ref + '<p>Ne pas retirer cette explication.</p>' + ref.replaceAll('test-1', 'test-2');
  const apres = normaliserBibliographie(html);
  assert.equal((apres.match(/references-liste/g) || []).length, 2);
  assert.ok(apres.includes('</ol><p>Ne pas retirer cette explication.</p><ol'));
  for (const balise of ['pre', 'code', 'script', 'style']) {
    const protege = '<' + balise + '>' + ref + '</' + balise + '>';
    assert.equal(normaliserBibliographie(protege), protege);
  }
});

test('bibliographie : style compact limité aux références, retours longs et échelle conservés', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const liste = css.match(/\.page-body ol\.references-liste\s*\{([^}]+)\}/)?.[1];
  assert.ok(liste);
  assert.match(liste, /line-height:\s*1\.3/);
  assert.match(liste, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(liste, /white-space:\s*nowrap|font-size|height:\s*\d+px/);
  assert.match(css, /\.page-body \.references-liste > li > p\s*\{\s*margin:\s*0/);
  assert.match(css, /\.page-body p\s*\{\s*margin:\s*9px 0/);
});
