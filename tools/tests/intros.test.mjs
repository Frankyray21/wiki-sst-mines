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
