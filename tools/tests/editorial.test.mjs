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
