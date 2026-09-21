import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliserNavigationInterne, metadonneesEditoriales, indicateursDocumentaires } from '../editorial.mjs';
import { analyserQualite } from '../qualite.mjs';

test('ancres accentuées corrigées seulement si la cible existe', () => {
  const html = '<h2 id="definition">Définition</h2><a href="#d%C3%A9finition">Lire</a><a href="#inconnue">Absent</a>';
  const actual = normaliserNavigationInterne(html);
  assert.ok(actual.includes('href="#definition"'));
  assert.ok(actual.includes('href="#inconnue"'));
});
test('sommaire manuel redondant retiré sans supprimer une liste d’actions', () => {
  const headings = '<h2 id="a">A</h2><h2 id="b">B</h2><h2 id="c">C</h2>';
  assert.ok(!normaliserNavigationInterne('<p><strong>Table des matières</strong></p><ol><li><a href="#a">A</a></li><li><a href="#b">B</a></li></ol>' + headings).includes('<ol>'));
  const actions = '<p><strong>Sommaire</strong></p><ul><li>Observer</li><li>Consulter</li></ul>';
  assert.ok(normaliserNavigationInterne(actions + headings).includes(actions));
});
test('la date du fichier ne devient jamais une relecture', () => {
  const text = metadonneesEditoriales({ fm: {}, mtime: new Date('2026-01-01') }, '2026-09-06');
  assert.ok(!text.includes('2026-01-01'));
  assert.ok(text.includes('Relecture éditoriale : non attestée'));
  assert.ok(text.includes('Site généré le 2026-09-06'));
});
test('sommaire imbriqué retiré en entier, liste mixte préservée', () => {
  const headings = '<h2 id="a">A</h2><h2 id="b">B</h2><h2 id="c">C</h2>';
  const nested = '<p><strong>Sommaire</strong></p><ul><li><a href="#a">A</a><ol><li><a href="#b">B</a></li></ol></li><li><a href="#c">C</a></li></ul>';
  assert.equal(normaliserNavigationInterne(nested + headings), headings);
  const mixed = '<p><strong>Sommaire</strong></p><ul><li><a href="#a">A</a></li><li>Vérifier l’équipement</li><li><a href="#b">B</a></li></ul>';
  assert.equal(normaliserNavigationInterne(mixed + headings), mixed + headings);
});
test('relecture exige une date explicite et un relecteur', () => {
  assert.equal(indicateursDocumentaires({ fm: { 'relecture-editoriale-le': '2026-09-06' } }).relecture, false);
  assert.equal(indicateursDocumentaires({ fm: { 'relecture-editoriale-le': '2026-09-06', 'relecteur-editorial': 'Équipe' } }).relecture, true);
});
test('la prose tardive ne masque plus une introduction absente', () => {
  const p = { body: '# Fiche\n\n## Tableau\n| Sujet | Repère |\n| A | B |\n\n## Détail\n' + 'Une explication importante suit le tableau de référence. '.repeat(30) };
  assert.ok(analyserQualite(p).defauts.some(d => d.code === 'sans-intro'));
});
test('une source interne seule appelle une vérification sans certifier absence de preuve', () => {
  const p = { body: 'Une fiche explicative décrit les situations de travail. '.repeat(30) + '\n## Sources\n- [[Guide interne]]' };
  assert.ok(analyserQualite(p).defauts.some(d => d.code === 'source-directe-absente'));
  p.body += '\nhttps://www.cnesst.gouv.qc.ca/';
  assert.ok(!analyserQualite(p).defauts.some(d => d.code === 'source-directe-absente'));
  assert.equal(indicateursDocumentaires(p).validationSpecialisee, false);
});
test('coupures constatées détectées', () => {
  for (const body of ['La sanction ne peut être imposée à un travaille', 'Tu peux simplement décrire ce q']) assert.ok(analyserQualite({ body }).defauts.some(d => d.code === 'tronque'));
});

test('les deux fins de puces interrompues des fiches Espaces clos sont signalées', () => {
  for (const fin of ['- Le comi', '- L\r\n']) {
    assert.ok(analyserQualite({ body: '## Contacts\n- Le département SST.\n' + fin }).defauts.some(d => d.code === 'tronque'));
  }
  for (const fin of ['- Le comité SST.', '- Le volume est de 5 L', '- L : symbole du litre.']) {
    assert.ok(!analyserQualite({ body: fin }).defauts.some(d => d.code === 'tronque'));
  }
});

test('une introduction peut commencer par un lien sans confondre prose, navigation et image', () => {
  const suite = '\n## Détails\n' + 'Ce paragraphe présente des explications complémentaires. '.repeat(20);
  for (const debut of [
    '[[Obligations]] : cette page présente les responsabilités et les ressources à consulter.',
    '> [[Obligations|Les obligations]] sont expliquées dans cette page destinée aux responsables.',
  ]) assert.ok(!analyserQualite({ body: debut + suite }).defauts.some(d => d.code === 'sans-intro'));
  for (const debut of [
    '[[Un lien de navigation particulièrement long qui ne constitue pas une introduction]]',
    '![[Une illustration dont le nom est long mais ne constitue pas une introduction.png]]',
    '- [[Obligations]] : cette puce est un élément de liste et non une introduction.',
  ]) assert.ok(analyserQualite({ body: debut + suite }).defauts.some(d => d.code === 'sans-intro'));
});

// ---- Contrôles de forme, 21 septembre 2026 : ce que le lecteur voit vraiment ----
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { estEtude, sourceDeLaNote, poserSourcesHeritees } from '../qualite.mjs';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const noteDuLot = (fichier, cle) => {
  const d = JSON.parse(fs.readFileSync(path.join(R, 'content-updates', fichier), 'utf8'));
  const n = d.notes.find(n => (n.path || n.chemin).includes(cle));
  let body = (n.content || n.contenu).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const h1 = body.match(/^#\s+(.+)$/m);
  return { body: h1 ? body.replace(h1[0], '') : body, title: h1 ? h1[1] : cle, wikiKey: 'SST psychosociale' };
};

test('la table des matières manuelle ne cache pas la phrase d’ouverture qui la suit', () => {
  // deux notes réelles du vault, versées dans des lots antérieurs : « Table des matières » puis
  // « L'essentiel : … » — le générateur retire la table, le lecteur lit la phrase en premier
  for (const [f, cle] of [['2026-09-06.json', 'Premiers signes'], ['2026-09-09-notions-cles-conflits.json', 'Définition et typologie']]) {
    const p = noteDuLot(f, cle);
    assert.match(p.body, /\*\*Table des matières\*\*/);
    assert.ok(!analyserQualite(p).defauts.some(d => d.code === 'sans-intro'), cle);
  }
  // une table longue n'épuise pas les douze lignes examinées
  const longue = '**Table des matières**\n\n' + Array.from({ length: 15 }, (_, i) => `${i + 1}. [Section ${i}](#s${i})`).join('\n') + '\n\n**L\'essentiel** : cette page explique une notion importante pour la prévention en mine.\n\n## Suite\n\n' + 'mot '.repeat(120);
  assert.ok(!analyserQualite({ body: longue }).defauts.some(d => d.code === 'sans-intro'));
  // mais une table suivie d'un titre reste une page sans introduction
  const sans = '**Table des matières**\n\n1. [A](#a)\n2. [B](#b)\n\n## A\n\n' + 'mot '.repeat(120);
  assert.ok(analyserQualite({ body: sans }).defauts.some(d => d.code === 'sans-intro'));
});

test('une note d’analyse commence par un titre de section : ce n’est pas une page sans introduction', () => {
  const corps = '## Identification de la source\n\n| Attribut | Valeur |\n|---|---|\n| Auteur | Siegrist |\n\n## Résultats\n\n' + 'mot '.repeat(120);
  for (const title of ['Siegrist (1996) - Modèle Effort-Récompense', 'Analyse - INSPQ 2021', 'Analyse Kivimäki et al. (2006)', 'Analyse Daniellou (dir., 1996) - L’ergonomie en quête de ses principes', 'Guide (éd., 2001a)']) {
    assert.ok(estEtude(title), title);
    assert.ok(!analyserQualite({ body: corps, title }).defauts.some(d => d.code === 'sans-intro'), title);
  }
  assert.ok(!estEtude('Charge de travail élevée'));
  assert.ok(!estEtude('Job strain et maladie coronarienne (Kivimäki, 2012)'), 'une notion qui cite une étude n’est pas l’étude');
  assert.ok(analyserQualite({ body: corps, title: 'Charge de travail élevée' }).defauts.some(d => d.code === 'sans-intro'));
});

test('citer une note d’analyse qui porte un DOI vaut source directe, et la source s’affiche à côté de la citation', () => {
  assert.deepEqual(sourceDeLaNote('Siegrist, J. (1996). Adverse… [https://doi.org/10.1037/1076-8998.1.1.27](https://doi.org/10.1037/1076-8998.1.1.27)'), { url: 'https://doi.org/10.1037/1076-8998.1.1.27', type: 'DOI' });
  assert.deepEqual(sourceDeLaNote('Voir https://www.inspq.qc.ca/publications/2907 puis https://doi.org/10.1/x'), { url: 'https://doi.org/10.1/x', type: 'DOI' });
  assert.deepEqual(sourceDeLaNote('Rapport IRSST : https://www.irsst.qc.ca/publications-et-outils/publication/i/101234'), { url: 'https://www.irsst.qc.ca/publications-et-outils/publication/i/101234', type: 'source' });
  assert.equal(sourceDeLaNote('Aucune adresse ici.'), null);
  const p = { body: 'Une fiche explicative décrit les situations de travail. '.repeat(30) + '\n## Références\n- [[Analyse Karasek (1979)]]' };
  assert.ok(analyserQualite(p).defauts.some(d => d.code === 'source-directe-absente'));
  assert.ok(!analyserQualite(p, { sourcesHeritees: [{ titre: 'Karasek (1979)', url: 'https://doi.org/10.2307/2392498', type: 'DOI' }] }).defauts.some(d => d.code === 'source-directe-absente'));
  // la pastille : listes et tableaux seulement, jamais dans une phrase, jamais deux fois
  const resoudre = (href) => href.endsWith('analyse-karasek-1979.html') ? { url: 'https://doi.org/10.2307/2392498', type: 'DOI' } : null;
  const html = '<p>Comme le montre <a href="{{ROOT}}w/psychosocial/analyse-karasek-1979.html">Karasek</a>, la latitude compte.</p>'
    + '<ul><li><a href="{{ROOT}}w/psychosocial/analyse-karasek-1979.html">Karasek (1979)</a> — fondement</li><li><a href="{{ROOT}}w/psychosocial/autre.html">Autre</a></li></ul>'
    + '<table><tr><td><a href="{{ROOT}}g/w/psychosocial/analyse-karasek-1979.html">Karasek (1979)</a></td><td>Modèle parallèle</td></tr></table>';
  const pose = poserSourcesHeritees(html, resoudre);
  assert.equal((pose.match(/class="ref-source external"/g) || []).length, 2, 'une pastille par citation en liste ou tableau');
  assert.ok(pose.includes('<p>Comme le montre <a href="{{ROOT}}w/psychosocial/analyse-karasek-1979.html">Karasek</a>, la latitude compte.</p>'), 'la phrase reste intacte');
  assert.ok(pose.includes('Karasek (1979)</a> <a class="ref-source external" href="https://doi.org/10.2307/2392498" target="_blank" rel="noopener" title="Source de l’étude : https://doi.org/10.2307/2392498">DOI</a> — fondement'));
  assert.equal(poserSourcesHeritees(pose, resoudre), pose, 'idempotent');
  assert.ok(pose.includes('<a href="{{ROOT}}w/psychosocial/autre.html">Autre</a></li>'), 'une page sans source ne reçoit rien');
});
