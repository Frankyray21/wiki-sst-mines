// Liens du vault dont le texte est devenu le nom long d'une note renommée (tools/raccourcir_liens.mjs) :
// le mot court revient dans les phrases, les listes de liens gardent le nom long, les liens envoyés dans un
// autre wiki par le renommage disparaissent (le mot reste).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { raccourcirLiens } from '../raccourcir_liens.mjs';

const table = JSON.parse(fs.readFileSync(new URL('../../content-updates/2026-09-26-libelles-courts.json', import.meta.url), 'utf8'));
const hygiene = { wiki: 'Wiki Hygiène industrielle' };
const psycho = { wiki: 'Wiki SST psychosociale' };

test('dans une phrase, le nom long reçoit le texte court ; la ligne de liens garde le nom long', () => {
  const note = [
    '---',
    'theme: "[[CNESST, rôles et pouvoirs]]"',
    '---',
    'Aviser la [[CNESST, rôles et pouvoirs]] que le travailleur est incapable d’exercer son emploi.',
    '| À partir du 15e jour | [[CNESST, rôles et pouvoirs]] ([[Indemnités de remplacement du revenu (IRR)]]) |',
    'Forage, sautage, concassage, [[Manutention (hub)]] ; voir [[CNESST, rôles et pouvoirs#Pouvoirs|la section]].',
    '## Voir aussi',
    '- [[CNESST, rôles et pouvoirs]]',
    'Voir aussi : [[Manutention (hub)]], [[Amiante (hub)]].',
    '```',
    '[[CNESST, rôles et pouvoirs]] dans un bloc de code',
    '```',
  ].join('\r\n');
  const { texte, changements } = raccourcirLiens(note, table, psycho);
  const l = texte.split('\r\n');
  assert.equal(l[1], 'theme: "[[CNESST, rôles et pouvoirs]]"', 'l’en-tête n’est pas touché');
  assert.equal(l[3], 'Aviser la [[CNESST, rôles et pouvoirs|CNESST]] que le travailleur est incapable d’exercer son emploi.');
  assert.equal(l[4], '| À partir du 15e jour | [[CNESST, rôles et pouvoirs\\|CNESST]] ([[Indemnités de remplacement du revenu (IRR)]]) |', 'dans un tableau, « \\| »');
  assert.equal(l[5], 'Forage, sautage, concassage, [[Manutention (hub)|Manutention]] ; voir [[CNESST, rôles et pouvoirs#Pouvoirs|la section]].', 'un lien qui a son texte ne bouge pas');
  assert.equal(l[7], '- [[CNESST, rôles et pouvoirs]]');
  assert.equal(l[8], 'Voir aussi : [[Manutention (hub)]], [[Amiante (hub)]].');
  assert.equal(l[10], '[[CNESST, rôles et pouvoirs]] dans un bloc de code');
  assert.deepEqual(changements.map(c => c.ligne), [4, 5, 6]);
  assert.deepEqual(changements.map(c => c.noms), [['CNESST, rôles et pouvoirs'], ['CNESST, rôles et pouvoirs'], ['Manutention (hub)']]);
  assert.equal(raccourcirLiens(texte, table, psycho).changements.length, 0, 'un second passage ne change rien');
  // fins de ligne mêlées : chacune reste la sienne
  const melee = 'a\r\nAviser la [[CNESST, rôles et pouvoirs]] que\nb\r\n';
  assert.equal(raccourcirLiens(melee, table, psycho).texte, 'a\r\nAviser la [[CNESST, rôles et pouvoirs|CNESST]] que\nb\r\n');
});

test('hors du wiki psychosocial, le lien vers la note « Confinement, profondeur et charge mentale » disparaît, le mot reste', () => {
  const note = [
    '| Modéré | Travaux avec empoussiérage modéré | [[Confinement, profondeur et charge mentale]], EPI, dépressurisation |',
    '- [[Confinement, profondeur et charge mentale|Confinement]] et arrosage des piles de minerai.',
    '- [[Confinement]] : espace totalement ou partiellement fermé.',
    '- [[Confinement, profondeur et charge mentale]]',
  ].join('\n');
  const { texte } = raccourcirLiens(note, table, hygiene);
  assert.deepEqual(texte.split('\n'), [
    '| Modéré | Travaux avec empoussiérage modéré | Confinement, EPI, dépressurisation |',
    '- Confinement et arrosage des piles de minerai.',
    '- Confinement : espace totalement ou partiellement fermé.',
    '- [[Confinement, profondeur et charge mentale]]',
  ], 'une liste de liens choisie par l’auteur reste');
  // dans le wiki psychosocial, rien ne bouge : le mot d’origine y était parfois « charge mentale »
  assert.equal(raccourcirLiens(note, table, psycho).changements.length, 0);
});

test('la table : chaque texte court est tiré du nom long, sans nom en double', () => {
  const noms = [...table.raccourcir, ...table.delier].map(e => e.nom.toLowerCase());
  assert.equal(new Set(table.raccourcir.map(e => e.nom.toLowerCase())).size, table.raccourcir.length);
  for (const e of table.raccourcir) assert.ok(e.nom.startsWith(e.court), `${e.court} ⊄ ${e.nom}`);
  for (const e of table.aTrancher) assert.ok(!table.raccourcir.some(r => r.nom === e.nom), `${e.nom} est à trancher, pas à raccourcir`);
  assert.ok(noms.length > 0);
});
