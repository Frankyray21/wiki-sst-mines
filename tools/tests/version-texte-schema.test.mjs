// « Lire le schéma en texte » retiré des schémas (demande de Frank, 26 septembre 2026) : le générateur ne la
// publie plus, même depuis une note du vault qui garde encore le bloc ; les autres versions texte restent.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { marked } from 'marked';
import { sansVersionTexteSchema, sansVersionTexteSchemaMd } from '../version_texte_schema.mjs';
import { blocMd } from '../poser_schemas.mjs';

const generateur = fs.readFileSync(new URL('../build_site.mjs', import.meta.url), 'utf8');
marked.setOptions({ gfm: true, breaks: true, mangle: false, headerIds: false }); // réglages de build_site.mjs
const schema = { fichier: 'wiki-x-v1.svg', alt: 'Texte alternatif assez long pour être utile au lecteur.', legende: 'Légende.', sources: 'Sources.' };
const ancienBloc = b => b.replace('</p>\n\n<p class="infographie-sources">', '</p>\n\n<details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n<li>Une puce.</li>\n<li>Une autre &lt; 1.</li>\n</ul>\n</details>\n<p class="infographie-sources">');

test('le générateur rend la même page, que la note garde l’ancienne version texte ou non', () => {
  assert.match(generateur, /import \{ sansVersionTexteSchema, sansVersionTexteSchemaMd \} from '\.\/version_texte_schema\.mjs';/);
  assert.match(generateur, /let html = sansVersionTexteSchema\(marked\.parse\(s\)\);/, 'appliqué au rendu de chaque note');
  const neuf = blocMd(schema);
  assert.ok(!neuf.includes('infographie-texte'));
  const ancien = ancienBloc(neuf);
  assert.ok(ancien.includes('Lire le schéma en texte'));
  const rendu = md => sansVersionTexteSchema(marked.parse(md.replace(/!\[\[[^\]]+\]\]/, 'IMAGE')));
  assert.equal(rendu(ancien), rendu(neuf));
  assert.ok(rendu(neuf).includes('<p class="infographie-legende">Légende.</p><p class="infographie-sources">Sources.</p></div>'));
});

test('note du vault : le bloc est retiré dès la lecture (LF, CRLF, encadré), la note devient celle d’aujourd’hui', () => {
  assert.match(generateur, /p\.body = sansVersionTexteSchemaMd\(raw\);/, 'avant le rendu, l’index de recherche (motsDePage) et les extraits');
  const neuf = '### Section\n\n' + blocMd(schema) + '\n\nSuite.\n';
  const ancien = ancienBloc(neuf);
  const crlf = t => t.replace(/\n/g, '\r\n');
  const encadre = t => '> [!info] Schéma\n' + t.split('\n').map(l => l ? '> ' + l : '>').join('\n');
  for (const [nom, v] of [['LF', t => t], ['CRLF', crlf], ['encadré', encadre], ['encadré CRLF', t => crlf(encadre(t))]]) {
    assert.ok(v(ancien).includes('Lire le schéma en texte'), nom);
    assert.equal(sansVersionTexteSchemaMd(v(ancien)), v(neuf), nom + ' : même texte que la note qui reçoit le lot aujourd’hui');
    assert.equal(sansVersionTexteSchemaMd(v(neuf)), v(neuf), nom + ' : note déjà nettoyée inchangée');
  }
  const autre = neuf.replace('</p>\n\n<p class="infographie-sources">', '</p>\n\n<details class="infographie-texte">\n<summary>Lire l’illustration en texte</summary>\n<p>x</p>\n</details>\n<p class="infographie-sources">');
  assert.equal(sansVersionTexteSchemaMd(autre), autre, 'autre résumé : rien n’est retiré');
});

test('générateur : estEtude déclaré avant son premier appel (il s’arrêtait au démarrage depuis le 21 septembre)', () => {
  const decl = generateur.indexOf('const estEtude = ');
  const appel = generateur.search(/(?<!const )\bestEtude\(q\)/);
  assert.ok(decl > 0 && appel > decl, 'la boucle des sources d’études appelle estEtude après sa déclaration');
});

test('seul le résumé « Lire le schéma en texte » est visé', () => {
  const autre = '<p class="infographie-legende">L.</p><details class="infographie-texte">\n<summary>Lire la version texte — les deux catégories</summary>\n<ul>\n<li>A.</li>\n</ul>\n</details>\n<p class="infographie-sources">S.</p>';
  assert.equal(sansVersionTexteSchema(autre), autre, 'infographies d’hygiène, d’ergonomie, de toxicologie : inchangées');
  const deux = '<p>a</p><details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n<li>x</li>\n</ul>\n</details>\n<p>b</p>' + autre;
  assert.equal(sansVersionTexteSchema(deux), '<p>a</p><p>b</p>' + autre, 'une version texte de schéma retirée, l’autre gardée');
});
