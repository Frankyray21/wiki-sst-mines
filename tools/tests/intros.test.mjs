import test from 'node:test';
import assert from 'node:assert/strict';
import { poserIntro, poserIntroHtml } from '../intros.mjs';

// Phrases d'ouverture (21 septembre 2026) : posées après le H1 de la note, avant la table des
// matières manuelle ; sans H1, après le frontmatter ; jamais deux fois ; fins de ligne conservées.
const PHRASE = 'La charge de travail élevée se mesure sur trois dimensions.';

test('après le titre, avant la table des matières, avec une ligne vide de chaque côté', () => {
  const note = '---\ntags: [wiki]\n---\n\n# Charge de travail élevée\n\n**Table des matières**\n\n1. [A](#a)\n\n## A\n';
  const r = poserIntro(note, PHRASE);
  assert.equal(r.pose, true);
  assert.equal(r.texte, '---\ntags: [wiki]\n---\n\n# Charge de travail élevée\n\n' + PHRASE + '\n\n**Table des matières**\n\n1. [A](#a)\n\n## A\n');
  assert.equal(poserIntro(r.texte, PHRASE).pose, false, 'jamais deux fois');
});

test('sans H1 : après le frontmatter ; sans frontmatter : en tête ; CRLF et BOM conservés', () => {
  assert.equal(poserIntro('---\na: 1\n---\n## Suite\n', PHRASE).texte, '---\na: 1\n---\n' + PHRASE + '\n\n## Suite\n');
  assert.equal(poserIntro('## Suite\n', PHRASE).texte, PHRASE + '\n\n## Suite\n');
  const crlf = poserIntro('\uFEFF---\r\na: 1\r\n---\r\n\r\n# T\r\n\r\n## S\r\n', PHRASE);
  assert.equal(crlf.texte, '\uFEFF---\r\na: 1\r\n---\r\n\r\n# T\r\n\r\n' + PHRASE + '\r\n\r\n## S\r\n');
  assert.throws(() => poserIntro('# T\n', '  '), /phrase vide/);
});

test('sur la page publiée : premier paragraphe du corps, échappé, une seule fois', () => {
  const html = '<h1 class="page-title">T</h1>\n<div class="page-body">\n\n<h2 id="a">A</h2>\n</div>';
  const r = poserIntroHtml(html, 'Une phrase avec <b> & "guillemets".');
  assert.equal(r.pose, true);
  assert.ok(r.html.startsWith('<h1 class="page-title">T</h1>\n<div class="page-body">\n<p>Une phrase avec &lt;b&gt; &amp; &quot;guillemets&quot;.</p>\n\n<h2 id="a">A</h2>'));
  assert.equal(poserIntroHtml(r.html, 'Une phrase avec <b> & "guillemets".').pose, false);
  assert.throws(() => poserIntroHtml('<p>x</p>', PHRASE), /corps introuvable/);
});

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { trouverNote } from '../intros.mjs';
import { slugify } from '../adresses.mjs';

test('la note est retrouvée par son titre H1 (wikilink réduit), sinon par l’adresse ; les archives sont ignorées', () => {
  const v = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-'));
  const ecrire = (rel, texte) => { fs.mkdirSync(path.dirname(path.join(v, rel)), { recursive: true }); fs.writeFileSync(path.join(v, rel), texte); };
  ecrire('Wiki SST psychosociale/20 - Articles/Facteurs/Charge de travail élevée.md', '---\ntags: [a]\n---\n\n# Charge de travail élevée\n\n## A\n');
  ecrire('Wiki SST psychosociale/20 - Articles/Nav/⭐Top 20.md', '# ⭐ Top 20 [[Articles wiki|articles]]\n\n- a\n');
  ecrire('Wiki SST psychosociale/98 - Archives/Charge de travail élevée.md', '# Charge de travail élevée\n');
  ecrire('Wiki SST psychosociale/20 - Articles/Sans titre/iso-strain.md', 'Pas de H1 ici.\n');
  const outils = { fs, path, slugify };
  assert.deepEqual(trouverNote(v, { titre: 'Charge de travail élevée', slug: 'charge-de-travail-elevee' }, outils), [{ chemin: 'Wiki SST psychosociale/20 - Articles/Facteurs/Charge de travail élevée.md', par: 'titre' }]);
  assert.equal(trouverNote(v, { titre: '⭐ Top 20 articles', slug: 'top-20-articles' }, outils)[0].par, 'titre', 'le wikilink du titre est réduit à son libellé');
  assert.deepEqual(trouverNote(v, { titre: 'Iso-strain', slug: 'iso-strain' }, outils), [{ chemin: 'Wiki SST psychosociale/20 - Articles/Sans titre/iso-strain.md', par: 'adresse' }]);
  assert.deepEqual(trouverNote(v, { titre: 'Inconnue', slug: 'inconnue' }, outils), []);
  fs.rmSync(v, { recursive: true, force: true });
});
