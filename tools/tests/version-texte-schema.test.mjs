// « Lire le schéma en texte » retiré des schémas (demande de Frank, 26 septembre 2026) : le générateur ne la
// publie plus, même depuis une note du vault qui garde encore le bloc ; les autres versions texte restent.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { marked } from 'marked';
import { sansVersionTexteSchema } from '../version_texte_schema.mjs';
import { blocMd } from '../poser_schemas.mjs';

const generateur = fs.readFileSync(new URL('../build_site.mjs', import.meta.url), 'utf8');
marked.setOptions({ gfm: true, breaks: true, mangle: false, headerIds: false }); // réglages de build_site.mjs
const schema = { fichier: 'wiki-x-v1.svg', alt: 'Texte alternatif assez long pour être utile au lecteur.', legende: 'Légende.', sources: 'Sources.' };
const ancienBloc = b => b.replace('</p>\n\n<p class="infographie-sources">', '</p>\n\n<details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n<li>Une puce.</li>\n<li>Une autre &lt; 1.</li>\n</ul>\n</details>\n<p class="infographie-sources">');

test('le générateur rend la même page, que la note garde l’ancienne version texte ou non', () => {
  assert.match(generateur, /import \{ sansVersionTexteSchema \} from '\.\/version_texte_schema\.mjs';/);
  assert.match(generateur, /let html = sansVersionTexteSchema\(marked\.parse\(s\)\);/, 'appliqué au rendu de chaque note');
  const neuf = blocMd(schema);
  assert.ok(!neuf.includes('infographie-texte'));
  const ancien = ancienBloc(neuf);
  assert.ok(ancien.includes('Lire le schéma en texte'));
  const rendu = md => sansVersionTexteSchema(marked.parse(md.replace(/!\[\[[^\]]+\]\]/, 'IMAGE')));
  assert.equal(rendu(ancien), rendu(neuf));
  assert.ok(rendu(neuf).includes('<p class="infographie-legende">Légende.</p><p class="infographie-sources">Sources.</p></div>'));
});

test('seul le résumé « Lire le schéma en texte » est visé', () => {
  const autre = '<p class="infographie-legende">L.</p><details class="infographie-texte">\n<summary>Lire la version texte — les deux catégories</summary>\n<ul>\n<li>A.</li>\n</ul>\n</details>\n<p class="infographie-sources">S.</p>';
  assert.equal(sansVersionTexteSchema(autre), autre, 'infographies d’hygiène, d’ergonomie, de toxicologie : inchangées');
  const deux = '<p>a</p><details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n<li>x</li>\n</ul>\n</details>\n<p>b</p>' + autre;
  assert.equal(sansVersionTexteSchema(deux), '<p>a</p><p>b</p>' + autre, 'une version texte de schéma retirée, l’autre gardée');
});
