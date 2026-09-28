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

test('lien dans une cellule de tableau : barre du libellé échappée', () => {
  const r = appliquerRetouches('| a | b |\n|---|---|\n| x | vieux |', [{ type: 'remplacerLigne', ligneContenant: 'vieux', tableau: true, par: '| x | {{lien:w/legislation/x/art-308-rsst-surveillant.html|art. 308}} |' }], { resoudreLien });
  assert.ok(r.texte.endsWith('| x | [[art-308-RSST surveillant\\|art. 308]] |'));
  assert.equal(appliquerRetouches(r.texte, [{ type: 'remplacerLigne', ligneContenant: 'vieux', tableau: true, par: '| x | {{lien:w/legislation/x/art-308-rsst-surveillant.html|art. 308}} |' }], { resoudreLien }).rapports[0].statut, 'déjà faite');
});

test('remplacerBloc : la nouvelle version d’un schéma prend la place de l’ancienne, ou s’insère si la note ne l’a jamais reçue', () => {
  const bloc = v => `<div class="infographie infographie-compacte infographie-schema">\n\n![[Infographies/wiki-x-${v}.svg|alt ${v}]]\n\n<p class="infographie-legende">Légende ${v}.</p>\n\n<details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n<li>Puce ${v}.</li>\n</ul>\n</details>\n<p class="infographie-sources">Sources ${v}.</p>\n\n</div>`;
  const r = { type: 'remplacerBloc', ligneContenant: 'Options et leviers', ancien: 'Infographies/wiki-x-v1.svg', bloc: bloc('v2'), marqueur: 'Infographies/wiki-x-v2.svg' };
  const crlf = s => s.replace(/\r?\n/g, '\r\n');
  const avecV1 = crlf(['### Options et leviers', '', bloc('v1'), '', '#### Suite', ''].join('\n'));
  const une = appliquerRetouches(avecV1, [r]);
  assert.ok(une.ok, JSON.stringify(une.rapports));
  assert.equal(une.texte, crlf(['### Options et leviers', '', bloc('v2'), '', '#### Suite', ''].join('\n')), 'même place, CRLF conservés, rien de la v1');
  assert.equal(appliquerRetouches(une.texte, [r]).rapports[0].statut, 'déjà faite');
  // note qui n'a jamais reçu la v1 : insertion après la ligne désignée
  const neuve = appliquerRetouches('### Options et leviers\n\n#### Suite\n', [r]);
  assert.ok(neuve.ok);
  assert.equal(neuve.texte, '### Options et leviers\n\n' + bloc('v2') + '\n\n#### Suite\n');
  assert.equal(appliquerRetouches(neuve.texte, [r]).texte, neuve.texte, 'rejoué : sans effet');
  // les deux versions dans la note, ou l'ancienne hors d'un bloc : rien n'est touché
  assert.equal(appliquerRetouches(avecV1 + '\r\n' + bloc('v2'), [r]).ok, false);
  const nue = appliquerRetouches('### Options et leviers\n\n![[Infographies/wiki-x-v1.svg]]\n\nTexte.\n', [r]);
  assert.equal(nue.ok, false);
  assert.match(nue.rapports[0].statut, /hors d’un bloc/);
});

test('remplacerBloc : plusieurs versions antérieures possibles (la note a pu recevoir la v1 ou la v2)', () => {
  const bloc = v => `<div class="infographie infographie-compacte infographie-schema">\n\n![[Infographies/wiki-x-${v}.svg|alt ${v}]]\n\n<p class="infographie-legende">Légende ${v}.</p>\n\n</div>`;
  const r = { type: 'remplacerBloc', ligneContenant: 'Options', ancien: ['Infographies/wiki-x-v2.svg', 'Infographies/wiki-x-v1.svg'], bloc: bloc('v3'), marqueur: 'Infographies/wiki-x-v3.svg' };
  const attendu = '### Options\n\n' + bloc('v3') + '\n\nSuite.\n';
  for (const v of ['v1', 'v2']) {
    const r1 = appliquerRetouches('### Options\n\n' + bloc(v) + '\n\nSuite.\n', [r]);
    assert.ok(r1.ok, v + ' : ' + JSON.stringify(r1.rapports));
    assert.equal(r1.texte, attendu, 'la ' + v + ' est remplacée à sa place');
    assert.equal(appliquerRetouches(r1.texte, [r]).rapports[0].statut, 'déjà faite');
  }
  assert.equal(appliquerRetouches('### Options\n\nSuite.\n', [r]).texte, attendu, 'aucune version : insertion après la ligne');
  const deux = appliquerRetouches('### Options\n\n' + bloc('v1') + '\n\n' + bloc('v2') + '\n', [r]);
  assert.equal(deux.ok, false, 'v1 et v2 toutes deux dans la note : rien n’est touché');
  assert.match(deux.rapports[0].statut, /ambiguë/);
});

test('retirerVersionTexte : seule la version « Lire le schéma en texte » du bloc désigné quitte la note', () => {
  const details = s => `<details class="infographie-texte">\n<summary>${s}</summary>\n<ul>\n<li>Puce.</li>\n</ul>\n</details>`;
  const bloc = (v, d) => `<div class="infographie infographie-compacte infographie-schema">\n\n![[Infographies/wiki-x-${v}.svg|alt ${v}]]\n\n<p class="infographie-legende">Légende ${v}.</p>\n\n${d ? d + '\n' : ''}<p class="infographie-sources">Sources ${v}.</p>\n\n</div>`;
  const r = v => ({ type: 'retirerVersionTexte', ligneContenant: `wiki-x-${v}.svg`, marqueur: `Infographies/wiki-x-${v}.svg` });
  const note = ['### A', '', bloc('a', details('Lire le schéma en texte')), '', '### B', '', bloc('b', details('Lire le schéma en texte')), ''].join('\n');
  const une = appliquerRetouches(note, [r('a')]);
  assert.ok(une.ok, JSON.stringify(une.rapports));
  assert.equal(une.texte, ['### A', '', bloc('a'), '', '### B', '', bloc('b', details('Lire le schéma en texte')), ''].join('\n'), 'le bloc b garde la sienne');
  assert.equal(appliquerRetouches(une.texte, [r('a')]).rapports[0].statut, 'déjà faite');
  // une ligne vide laissée après </details> ne double pas l'espacement
  const aere = note.replace('</details>\n<p class="infographie-sources">Sources a.', '</details>\n\n<p class="infographie-sources">Sources a.');
  assert.equal(appliquerRetouches(aere, [r('a')]).texte, une.texte);
  // autre résumé (infographie d'hygiène, par exemple) : rien n'est touché
  const autre = bloc('a', details('Lire la version texte — les deux catégories'));
  assert.equal(appliquerRetouches(autre, [r('a')]).texte, autre);
  // refus : schéma absent, ou version texte sans fin dans le bloc (la note reste intacte)
  assert.match(appliquerRetouches('### A\n', [r('a')]).rapports[0].statut, /absent/);
  const coupee = bloc('a', '<details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>');
  const rc = appliquerRetouches(coupee, [r('a')]);
  assert.equal(rc.ok, false);
  assert.equal(rc.texte, coupee);
});

test('supprimerLigne : plusieurs marqueurs possibles (schéma ou sa version antérieure)', () => {
  const r = { type: 'supprimerLigne', ligneContenant: 'img-001.png', marqueur: ['Infographies/x-v2.svg', 'Infographies/x-v1.svg'] };
  assert.equal(appliquerRetouches('![[Infographies/x-v1.svg]]\nSuite.', [r]).rapports[0].statut, 'déjà faite', 'capture retirée par la v1');
  assert.equal(appliquerRetouches('![[Infographies/x-v2.svg]]\nSuite.', [r]).rapports[0].statut, 'déjà faite', 'capture retirée par la v2');
  assert.equal(appliquerRetouches('Suite.', [r]).rapports[0].statut, 'introuvable');
  assert.equal(appliquerRetouches('![[img-001.png]]\n\nSuite.', [r]).texte, '\nSuite.');
});

test('recibler : un lien homonyme résolu vers un autre wiki vise la note voulue, libellé conservé', () => {
  const resoudreLien = a => ({ 'w/hygiene/00-accueil-gestionnaires.html': 'Wiki Hygiène industrielle/00 - Accueil gestionnaires' })[a] || null;
  const note = '# Accueil\n\nHub : [[27 - Articles gestionnaires|Pages gestionnaires]]\n\n### [[27 - Articles gestionnaires]]\n| a | [[27 - Articles gestionnaires\\|Pages gestionnaires]] |\n';
  const lot = [{ type: 'recibler', ligneContenant: 'Hub : Pages gestionnaires', libelle: 'Pages gestionnaires', adresse: 'w/hygiene/00-accueil-gestionnaires.html' }];
  const r = appliquerRetouches(note, lot, { resoudreLien });
  assert.ok(r.ok);
  assert.match(r.texte, /^Hub : \[\[Wiki Hygiène industrielle\/00 - Accueil gestionnaires\|Pages gestionnaires\]\]$/m);
  assert.match(r.texte, /^### \[\[27 - Articles gestionnaires\]\]$/m, 'les autres lignes ne bougent pas');
  // rejoué : déjà fait, texte inchangé
  const r2 = appliquerRetouches(r.texte, lot, { resoudreLien });
  assert.equal(r2.rapports[0].statut, 'déjà faite');
  assert.equal(r2.texte, r.texte);
  // lien sans alias, et barre échappée d'une cellule de tableau conservée
  const r3 = appliquerRetouches(note, [{ type: 'recibler', ligneContenant: '### 27 - Articles gestionnaires', libelle: '27 - Articles gestionnaires', adresse: 'w/hygiene/00-accueil-gestionnaires.html' },
    { type: 'recibler', ligneContenant: '| a |', libelle: 'Pages gestionnaires', adresse: 'w/hygiene/00-accueil-gestionnaires.html' }], { resoudreLien });
  assert.ok(r3.ok);
  assert.match(r3.texte, /^### \[\[Wiki Hygiène industrielle\/00 - Accueil gestionnaires\|27 - Articles gestionnaires\]\]$/m);
  assert.match(r3.texte, /\| a \| \[\[Wiki Hygiène industrielle\/00 - Accueil gestionnaires\\\|Pages gestionnaires\]\] \|/);
  // lien absent ou note introuvable : rien n'est écrit
  assert.equal(appliquerRetouches(note, [{ ...lot[0], libelle: 'Autre' }], { resoudreLien }).ok, false);
  assert.equal(appliquerRetouches(note, [{ ...lot[0], adresse: 'w/x/y.html' }], { resoudreLien }).ok, false);
});

test('remplacer « toutes » : le même en-tête dans deux tableaux, corrigé partout, puis reconnu', () => {
  const note = '# Foreur\n\n**Protecteurs**\n\n| Comportement | Effet |\n|---|---|\n| Écoute | Soutien |\n\n**Destructeurs**\n\n| Comportement | Effet |\n|---|---|\n| Intimidation | Iso-strain |\n';
  const lot = [{ type: 'remplacer', toutes: true, ligneContenant: 'Comportement | Effet', avant: '| Effet |', apres: '| Effet attendu (source à préciser) |' }];
  const r = appliquerRetouches(note, lot);
  assert.ok(r.ok);
  assert.equal(r.rapports[0].statut, 'appliquée');
  assert.equal((r.texte.match(/\| Comportement \| Effet attendu \(source à préciser\) \|/g) || []).length, 2);
  assert.ok(!/\| Effet \|/.test(r.texte));
  const r2 = appliquerRetouches(r.texte, lot);
  assert.equal(r2.rapports[0].statut, 'déjà faite');
  assert.equal(r2.texte, r.texte);
  // sans « toutes », deux lignes désignées : ambiguë, rien n'est écrit
  assert.equal(appliquerRetouches(note, [{ ...lot[0], toutes: false }]).ok, false);
  assert.equal(appliquerRetouches('# Rien\n', lot).rapports[0].statut, 'introuvable');
});

test('relibeller : libellé d’un lien corrigé, cible gardée ou ancre de page changée ; rejoué sans effet', () => {
  const note = '# Bowers\n\n« Citation un. » (Bowers et al., 2018, p. 392). [[Roberts P. (2018).pdf#page=2|Roberts et al., 2018, p. 392]]\n\n'
    + '« Citation deux. » [[Roberts P. (2018).pdf#page=3|Roberts et al., 2018, p. 393]]\n\n« Citation trois. » [[Roberts P. (2018).pdf#page=3|Roberts et al., 2018, p. 393]]\n\n'
    + '| Doc | [[Dolan 2009.pdf#page=159\\|Dolan & Arsenault 2009 p. 169]] |\n';
  const lot = [
    { type: 'relibeller', ligneContenant: 'Roberts et al., 2018, p. 392', libelle: 'Roberts et al., 2018, p. 392', nouveau: 'Bowers et al., 2018, p. 392' },
    { type: 'relibeller', toutes: true, ligneContenant: 'Roberts et al., 2018, p. 393', libelle: 'Roberts et al., 2018, p. 393', nouveau: 'Bowers et al., 2018, p. 393' },
    { type: 'relibeller', ligneContenant: '| Doc |', libelle: 'Dolan & Arsenault 2009 p. 169', nouveau: 'Dolan & Arsenault 2009, p. 138-140', ancre: '#page=158' },
  ];
  const r = appliquerRetouches(note, lot);
  assert.ok(r.ok, JSON.stringify(r.rapports));
  assert.match(r.texte, /\[\[Roberts P\. \(2018\)\.pdf#page=2\|Bowers et al\., 2018, p\. 392\]\]/);
  assert.equal((r.texte.match(/\[\[Roberts P\. \(2018\)\.pdf#page=3\|Bowers et al\., 2018, p\. 393\]\]/g) || []).length, 2);
  assert.match(r.texte, /\| Doc \| \[\[Dolan 2009\.pdf#page=158\\\|Dolan & Arsenault 2009, p\. 138-140\]\] \|/, 'barre de tableau gardée, ancre changée');
  const r2 = appliquerRetouches(r.texte, lot);
  assert.deepEqual(r2.rapports.map(x => x.statut), ['déjà faite', 'déjà faite', 'déjà faite']);
  assert.equal(r2.texte, r.texte);
  assert.equal(appliquerRetouches('# Rien\n', [lot[0]]).ok, false, 'lien absent : rien n’est écrit');
});

test('relibeller avec adresse : le lien prend le nouveau libellé et la nouvelle cible ; un homonyme juste reste', () => {
  // « LATMP art. 1 » corrigé en « LATMP art. 2 » : le lien doit mener à l'article 2, et non plus à l'article 1
  const note = '# Bénéficiaires\n\nLe bénéficiaire est défini par la loi ([[art-1-LATMP|LATMP art. 1]]) ; voir aussi [[art-2-LATMP|LATMP art. 2]].\n\n'
    + '## Cadre légal\n\n- Définitions : [[art-1-LATMP|LATMP art. 1]].\n';
  const resoudreLien = a => (a === 'w/legislation/10-lois-principales/latmp/art-2-latmp-termes-utilises.html' ? 'art-2-LATMP' : null);
  const lot = [{ type: 'relibeller', toutes: true, ligneContenant: 'LATMP art. 1', libelle: 'LATMP art. 1', nouveau: 'LATMP art. 2',
    adresse: 'w/legislation/10-lois-principales/latmp/art-2-latmp-termes-utilises.html' }];
  const r = appliquerRetouches(note, lot, { resoudreLien });
  assert.ok(r.ok, JSON.stringify(r.rapports));
  assert.ok(!r.texte.includes('art-1-LATMP') && !r.texte.includes('LATMP art. 1'), 'plus aucun lien vers l’article 1');
  assert.equal((r.texte.match(/\[\[art-2-LATMP\|LATMP art\. 2\]\]/g) || []).length, 3, 'les deux liens corrigés et l’homonyme juste');
  const r2 = appliquerRetouches(r.texte, lot, { resoudreLien });
  assert.deepEqual(r2.rapports.map(x => x.statut), ['déjà faite']);
  assert.equal(r2.texte, r.texte);
  // adresse sans note dans le vault : rien n'est écrit
  assert.equal(appliquerRetouches(note, lot, { resoudreLien: () => null }).ok, false);
});

test('delier : un lien devient du texte simple (libellé ou texte donné), une image intégrée n’est pas touchée', () => {
  const note = '# PAE\n\n**L\'essentiel** : [[Programme d\'aide aux employés (PAE)|Le PAE]] est un service confidentiel. ![[Le PAE]]\n\n| 3-5 | [[Réadaptation]] | Reprise progressive du rôle familial |\n';
  const lot = [
    { type: 'delier', ligneContenant: 'est un service confidentiel', libelle: 'Le PAE' },
    { type: 'delier', ligneContenant: 'Reprise progressive du rôle familial', libelle: ['Réadaptation', 'Droit à la réadaptation'], texte: 'Réadaptation' },
  ];
  const r = appliquerRetouches(note, lot);
  assert.ok(r.ok, JSON.stringify(r.rapports));
  assert.match(r.texte, /: Le PAE est un service confidentiel\. !\[\[Le PAE\]\]$/m);
  assert.match(r.texte, /^\| 3-5 \| Réadaptation \| Reprise progressive du rôle familial \|$/m);
  const r2 = appliquerRetouches(r.texte, lot);
  assert.deepEqual(r2.rapports.map(x => x.statut), ['déjà faite', 'déjà faite']);
  assert.equal(r2.texte, r.texte);
  assert.equal(appliquerRetouches(note, [{ ...lot[0], libelle: 'Autre' }]).ok, false);
});

test('ajouterFin : point final manquant, marque avant le point final ; rejoué sans effet', () => {
  const note = '# FIFO\n\nLe conjoint vit aussi des **enjeux psychosociaux**\n\n- [[INSPQ]]. *Trousse d\'outils pour la surveillance de la santé mentale*.\n';
  const lot = [
    { type: 'ajouterFin', ligneContenant: 'Le conjoint vit aussi des enjeux psychosociaux', texte: '.' },
    { type: 'ajouterFin', ligneContenant: 'Trousse d\'outils pour la surveillance', texte: ' (référence à préciser)', avantPoint: true },
  ];
  const r = appliquerRetouches(note, lot);
  assert.ok(r.ok, JSON.stringify(r.rapports));
  assert.match(r.texte, /^Le conjoint vit aussi des \*\*enjeux psychosociaux\*\*\.$/m);
  assert.match(r.texte, /^- \[\[INSPQ\]\]\. \*Trousse d'outils pour la surveillance de la santé mentale\* \(référence à préciser\)\.$/m);
  const r2 = appliquerRetouches(r.texte, lot);
  assert.deepEqual(r2.rapports.map(x => x.statut), ['déjà faite', 'déjà faite']);
  assert.equal(r2.texte, r.texte);
});

test('relibeller : un lien homonyme sur une autre ligne, non visée, ne bloque pas le rejeu', () => {
  const note = '# P\n\nTypologie de Friedman : [[Dolan.pdf#page=159|Dolan p. 169]]\n\nAilleurs : [[Dolan.pdf#page=159|Dolan p. 169]]\n';
  const lot = [{ type: 'relibeller', ligneContenant: 'Typologie de Friedman', libelle: 'Dolan p. 169', nouveau: 'Dolan, p. 138-140', ancre: '#page=158' }];
  const r = appliquerRetouches(note, lot);
  assert.ok(r.ok);
  assert.match(r.texte, /Typologie de Friedman : \[\[Dolan\.pdf#page=158\|Dolan, p\. 138-140\]\]/);
  assert.match(r.texte, /Ailleurs : \[\[Dolan\.pdf#page=159\|Dolan p\. 169\]\]/, 'la ligne non visée ne change pas');
  assert.equal(appliquerRetouches(r.texte, lot).rapports[0].statut, 'déjà faite');
});

test('remplacer « ancienApres » : une note qui a reçu la version antérieure de la correction passe à la nouvelle', () => {
  const r = { type: 'remplacer', ligneContenant: 'Les méta-analyses sont sans ambiguïté', avant: 'mortalité prématurée.',
    apres: 'mortalité prématurée ([Kivimäki et al., 2015](https://doi.org/10.1016/S0140-6736(15)60295-1)).', ancienApres: 'mortalité prématurée (source à préciser).' };
  const neuve = 'Les méta-analyses sont sans ambiguïté : risque de mortalité prématurée.\n';
  const marquee = 'Les méta-analyses sont sans ambiguïté : risque de mortalité prématurée (source à préciser).\n';
  const a = appliquerRetouches(neuve, [r]);
  const b = appliquerRetouches(marquee, [r]);
  assert.ok(a.ok && b.ok, JSON.stringify([a.rapports, b.rapports]));
  assert.equal(a.texte, b.texte, 'même résultat, que la note ait reçu la marque ou non');
  assert.match(a.texte, /\(\[Kivimäki et al\., 2015\]/);
  assert.equal(appliquerRetouches(a.texte, [r]).rapports[0].statut, 'déjà faite');
  assert.equal(appliquerRetouches('Autre texte.\n', [r]).ok, false);
});
