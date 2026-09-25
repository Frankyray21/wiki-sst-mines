import test from 'node:test';
import assert from 'node:assert/strict';
import { appliquerRetouches, normaliser, resoudreLiens } from '../retouches.mjs';

const NOTE = [
  '---', 'tags: [wiki]', '---', '', '# Exemple', '',
  '| Risque | Description |', '|---|---|', "| Gaz inflammables | [[LIE]] ; doit rester < 5 % de la LIE |", '',
  '![[Pasted image 20241214152919.png]]', '',
  "- Contact visuel, auditif ou autre moyen avec le travailleur.",
  '6. Établir un plan de sauvetage ([[art-309-RSST|art. 309]]) avec équipe.', '',
  "Situation type à éviter lors d'une purge mal séquencée.", '', 'Suite.',
].join('\r\n');

const LOT = [
  { type: 'insererApres', ligneContenant: 'Situation type à éviter lors d’une purge', bloc: '<div class="infographie">\n\n![[Infographies/x.svg|alt]]\n\n</div>', marqueur: 'Infographies/x.svg' },
  { type: 'supprimerLigne', ligneContenant: '20241214152919', marqueur: 'Infographies/x.svg' },
  { type: 'remplacer', ligneContenant: 'Gaz inflammables', avant: 'doit rester < 5 % de la LIE', apres: 'doit rester ≤ 5 % de la LIE' },
  { type: 'remplacerLigne', ligneContenant: 'Contact visuel, auditif', par: '- Demeure en contact ({{lien:w/legislation/x/art-308-rsst-surveillant.html|art. 308}}).' },
  { type: 'remplacer', ligneContenant: 'Établir un plan de sauvetage', avant: '[[art-309-RSST|art. 309]]', apres: '{{lien:w/legislation/x/art-309-rsst-plan-de-sauvetage.html|art. 309}}' },
];
const resoudreLien = a => ({ 'w/legislation/x/art-308-rsst-surveillant.html': 'art-308-RSST surveillant', 'w/legislation/x/art-309-rsst-plan-de-sauvetage.html': 'art-309-RSST plan de sauvetage' })[a] || null;

test('normaliser : wikilinks, gras, apostrophes et espaces insécables', () => {
  assert.equal(normaliser('**Voir** [[art-1-RSST|l’article 1]] et [[LIE]]'), "Voir l'article 1 et LIE");
});

test('lot appliqué : insertion, image retirée, remplacements, liens résolus, fins de ligne conservées', () => {
  const r = appliquerRetouches(NOTE, LOT, { resoudreLien });
  assert.ok(r.ok, JSON.stringify(r.rapports));
  assert.deepEqual(r.rapports.map(x => x.statut), Array(5).fill('appliquée'));
  assert.ok(!r.texte.includes('20241214152919'));
  assert.ok(r.texte.includes('doit rester ≤ 5 % de la LIE'));
  assert.ok(r.texte.includes('- Demeure en contact ([[art-308-RSST surveillant|art. 308]]).'));
  assert.ok(r.texte.includes('([[art-309-RSST plan de sauvetage|art. 309]]) avec équipe.'));
  assert.ok(r.texte.includes("purge mal séquencée.\r\n\r\n<div class=\"infographie\">"), 'bloc séparé par une ligne vide');
  assert.ok(r.texte.includes('</div>\r\n\r\nSuite.'), 'une seule ligne vide avant la suite');
  assert.ok(!/\r\n\r\n\r\n/.test(r.texte), 'aucune double ligne vide');
  assert.ok(!/[^\r]\n/.test(r.texte), 'fins de ligne CRLF conservées');
});

test('lot rejoué : tout est reconnu comme déjà fait, texte inchangé', () => {
  const une = appliquerRetouches(NOTE, LOT, { resoudreLien });
  const deux = appliquerRetouches(une.texte, LOT, { resoudreLien });
  assert.ok(deux.ok);
  assert.deepEqual(deux.rapports.map(x => x.statut), Array(5).fill('déjà faite'));
  assert.equal(deux.texte, une.texte);
});

test('remplacement dont le fragment de repérage était dans le texte remplacé : reconnu au second passage', () => {
  const r = { type: 'remplacer', ligneContenant: 'Contact visuel', avant: 'Contact visuel, auditif.', apres: 'Communication bidirectionnelle.' };
  const une = appliquerRetouches('- Contact visuel, auditif.\n- Autre.', [r]);
  assert.equal(une.texte, '- Communication bidirectionnelle.\n- Autre.');
  const deux = appliquerRetouches(une.texte, [r]);
  assert.equal(deux.rapports[0].statut, 'déjà faite');
  assert.equal(appliquerRetouches('- Autre.', [r]).rapports[0].statut, 'introuvable', 'ni avant ni après : introuvable');
});

test('ligne introuvable ou ambiguë : ok faux, rapport explicite', () => {
  const r = appliquerRetouches(NOTE + '\r\nGaz inflammables ailleurs', [LOT[2]], { resoudreLien });
  assert.equal(r.ok, false);
  assert.match(r.rapports[0].statut, /ambiguë/);
  const s = appliquerRetouches(NOTE, [{ type: 'supprimerLigne', ligneContenant: '20990101000000', marqueur: 'Infographies/x.svg' }]);
  assert.equal(s.ok, false, 'image absente et remplaçant absent : pas « déjà faite »');
  assert.equal(s.rapports[0].statut, 'introuvable');
});

test('insertion collée dans un tableau, sans ligne vide', () => {
  const r = appliquerRetouches(NOTE, [{ type: 'insererApres', ligneContenant: 'Gaz inflammables', bloc: '| Autre | x |', marqueur: '| Autre |', colle: true }]);
  assert.ok(r.texte.includes('de la LIE |\r\n| Autre | x |\r\n'));
});

test('lien sans note : erreur plutôt qu’un lien rouge', () => {
  assert.throws(() => resoudreLiens('{{lien:w/x.html|x}}', () => null), /lien sans note/);
});
