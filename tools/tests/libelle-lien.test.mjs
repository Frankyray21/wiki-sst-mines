// Texte affiché des wikilinks (tools/libelle_lien.mjs) et choix de la page quand plusieurs répondent au
// même nom (resolvePage de build_site.mjs). Cas tirés des pages signalées le 25 septembre 2026.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { libelleLien, contexteDuLien, estNomDeCode, estNoteDAnalyse, estLigneDeLiens } from '../libelle_lien.mjs';

const build = fs.readFileSync(new URL('../build_site.mjs', import.meta.url), 'utf8');

// [[saisi]] écrit dans `note` (markdown), vers une page dont le nom de fichier est `saisi` et le titre `titre` :
// comme dans build_site, la règle reçoit la ligne du lien, ou sa cellule dans un tableau
function lien(saisi, titre, note, autres = {}) {
  const pos = note.indexOf('[[' + saisi);
  assert.ok(pos >= 0, saisi);
  return libelleLien({ saisi, titre, parNom: true, ligne: contexteDuLien(note, pos), ...autres });
}

test('en pleine phrase, le mot saisi reste : les phrases signalées se lisent comme la note', () => {
  assert.equal(lien('CNESST', 'CNESST, rôles et pouvoirs', 'Aviser la [[CNESST]] que le travailleur est incapable d’exercer son emploi.'), 'CNESST');
  assert.equal(lien('Silice cristalline', 'Programme de prévention silice cristalline',
    '| Silice cristalline | Forage, sautage, concassage | [[Silice cristalline]] respirable |'), 'Silice cristalline');
  assert.equal(lien('Surveillance biologique', 'Surveillance biologique des métaux en mine',
    '| Métaux (Pb, Cd, Ni, As) | Fonderies, traitement de minerai | [[Surveillance biologique]] pertinente |'), 'Surveillance biologique');
  assert.equal(lien('Métaux', 'Métaux toxiques en milieu de travail', '- Allergies (poussières organiques, [[Métaux]])'), 'Métaux');
  assert.equal(lien('APR', 'Protection respiratoire (APR)', '- [[APR]] adapté à la fraction'), 'APR');
  // la casse saisie est gardée, même quand seul le titre commence par une majuscule
  assert.equal(lien('silice cristalline', 'Silice cristalline', 'exposition à la [[silice cristalline]] respirable'), 'silice cristalline');
});

test('le titre descriptif reste pour un article de loi et les autres noms de code', () => {
  assert.equal(lien('art-59-LATMP', 'art-59-LATMP : salaire de la journée de la lésion', 'L’employeur paie le jour de la lésion ([[art-59-LATMP]]).'),
    'art-59-LATMP : salaire de la journée de la lésion');
  assert.equal(lien('art-11-LATMP, exclusions', 'art. 11 LATMP : exclusions', 'voir [[art-11-LATMP, exclusions]] pour le détail'), 'art. 11 LATMP : exclusions');
  assert.equal(lien('INDEX_NOTES_WIKI', 'Index des 7 Notes Wiki Créées - SST1010', 'Le mécanisme est décrit dans [[INDEX_NOTES_WIKI]].'), 'Index des 7 Notes Wiki Créées - SST1010');
  assert.equal(lien('50 - Jurisprudence marquante', 'Jurisprudence marquante', 'Les décisions sont dans [[50 - Jurisprudence marquante]].'), 'Jurisprudence marquante');
  assert.ok(estNomDeCode('art. 51 LSST') && estNomDeCode('charge-mentale') && estNomDeCode('job_strain'));
  assert.ok(!estNomDeCode('CMPP-CSP') && !estNomDeCode('Aide-foreur') && !estNomDeCode('Artères') && !estNomDeCode('APR'));
});

test('une note d’analyse d’étude reste citée par son titre bibliographique', () => {
  assert.equal(lien('Analyse Karasek (1979)', 'Karasek (1979) - Modèle Demandes-Contrôle (DC)', 'Le modèle le plus étudié [[Analyse Karasek (1979)]].'),
    'Karasek (1979) - Modèle Demandes-Contrôle (DC)');
  assert.ok(estNoteDAnalyse('Analyse Daniellou (dir., 1996)') && estNoteDAnalyse('Analyse Tissot et al. - INSPQ (2022)'));
  assert.ok(!estNoteDAnalyse('Analyse des risques') && !estNoteDAnalyse('Karasek (1979)'));
});

test('dans un tableau, la cellule compte : seul dans sa cellule (index d’articles), le lien prend le titre', () => {
  const index = ['| Article | Description |', '|---|---|', '| [[IRR (indemnités)]] | L’IRR est l’indemnité versée par la CNESST. |'].join('\n');
  assert.equal(lien('IRR (indemnités)', 'Indemnités de remplacement du revenu (IRR)', index), 'Indemnités de remplacement du revenu (IRR)');
  // cas signalé : « À partir du 15e jour | CNESST, rôles et pouvoirs (Indemnités de remplacement du revenu (IRR)) »
  const versement = '| À partir du 15e jour | [[CNESST, rôles et pouvoirs\\|CNESST]] ([[IRR (indemnités)]]) | Formulaire |';
  assert.equal(lien('IRR (indemnités)', 'Indemnités de remplacement du revenu (IRR)', versement), 'Indemnités de remplacement du revenu (IRR)');
  assert.equal(contexteDuLien(versement, versement.indexOf('[[IRR')), ' [[CNESST, rôles et pouvoirs\\|CNESST]] ([[IRR (indemnités)]]) ', 'le « \\| » du lien ne coupe pas la cellule');
  // la même cellule avec d’autres mots : le mot saisi
  assert.equal(lien('Silice cristalline', 'Programme de prévention silice cristalline', '| Silice | [[Silice cristalline]] respirable |'), 'Silice cristalline');
  assert.equal(contexteDuLien('a\n- [[A]] b\nc', 4), '- [[A]] b');
});

test('une ligne faite seulement de liens garde les titres (« Voir aussi », liste, tableau de liens)', () => {
  assert.equal(lien('Silice cristalline', 'Programme de prévention silice cristalline', '- [[Silice cristalline]]'), 'Programme de prévention silice cristalline');
  assert.equal(lien('Métaux', 'Métaux toxiques en milieu de travail', '**Voir aussi** : [[Silice cristalline]], [[Métaux]] et [[APR]].'), 'Métaux toxiques en milieu de travail');
  for (const l of ['- [[A]]', 'Voir aussi : [[A]], [[B]] et [[C]].', '| [[A]] | [[B]] |', '> - [[A]]', '## [[A]]', '→ [[A]]', '📄 [[A]]', '- [x] [[A]]', '1. [[A]] ([[B]])', '- [[A]] · [guide](https://exemple.org)'])
    assert.ok(estLigneDeLiens(l), l);
  for (const l of ['Aviser la [[CNESST]] que', '- [[A]] : description', '| Silice | [[Silice cristalline]] |', '- [[A]] respirable', 'Voir aussi [[A]]',
    'Pour les indemnités pendant l’arrêt de travail, voir : [[A]]', 'Aucun lien ici'])
    assert.ok(!estLigneDeLiens(l), l);
});

test('lien par un alias, page absente, ponctuation, ancre', () => {
  // alias : le mot saisi, comme avant (« ISO 2631 » ne devient pas le titre de la norme)
  assert.equal(libelleLien({ saisi: 'ISO 2631', titre: 'ISO 2631 - Vibrations globales du corps', parNom: false, ligne: '- [[ISO 2631]]' }), 'ISO 2631');
  // page absente : le mot saisi
  assert.equal(libelleLien({ saisi: 'Page à créer', titre: null, parNom: false, ligne: 'voir [[Page à créer]]' }), 'Page à créer');
  // un nom de fichier ne peut pas porter « / » : mêmes mots que le titre, le titre s'affiche avec ses barres
  assert.equal(lien('Comparatif des cycles FIFO (14-14, 20-10, 21-7)', 'Comparatif des cycles FIFO (14/14, 20/10, 21/7)', 'Le [[Comparatif des cycles FIFO (14-14, 20-10, 21-7)]] le montre.'),
    'Comparatif des cycles FIFO (14/14, 20/10, 21/7)');
  assert.equal(lien('Bruit', 'Bruit en milieu de travail', 'mesure du [[Bruit#Dosimétrie]] au poste', { ancre: 'Dosimétrie' }), 'Bruit › Dosimétrie');
});

test('build_site : le libellé passe par la règle, avec la ligne du lien', () => {
  assert.match(build, /import \{ libelleLien, contexteDuLien \} from '\.\/libelle_lien\.mjs'/);
  assert.match(build, /libelleLien\(\{ saisi, titre: pg \? pg\.title : null, parNom, ancre: anchor, ligne: contexteDuLien\(texte, pos\), cle: looseKey \}\)/);
  assert.match(build, /\(m, bang, inner, pos, texte\) =>/);
});

// resolvePage et looseKey tels qu'écrits dans build_site.mjs, évalués sur un petit index
function fonction(nom) {
  const debut = build.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, nom);
  return build.slice(debut, build.indexOf('\n}\n', debut) + 2);
}
function resolveur(pages) {
  const ctx = { byBase: new Map(), byPath: new Map(), byLoose: new Map(), renvois: new Map() };
  vm.createContext(ctx);
  vm.runInContext(build.match(/const ROMAINS = \{[^\n]*\};/)[0].replace('const ', 'var ') + fonction('looseKey') + fonction('resolvePage'), ctx);
  const ajouter = (map, cle, p) => { if (!map.has(cle)) map.set(cle, []); map.get(cle).push(p); };
  for (const p of pages) {
    for (const nom of [p.base, ...(p.alias || [])]) { ajouter(ctx.byBase, nom.toLowerCase(), p); ajouter(ctx.byLoose, ctx.looseKey(nom), p); }
    ctx.byPath.set(p.relPath.slice(0, -3).toLowerCase(), p);
  }
  return (cible, depuis) => ctx.resolvePage(cible, depuis);
}

test('plusieurs pages répondent au nom, aucune dans le wiki : le nom de fichier l’emporte sur un alias', () => {
  const loi = { base: 'LATMP', relPath: 'Recueil législatif SST/10 - Lois principales/LATMP/LATMP.md', wikiKey: 'Recueil législatif SST', dir: 'Recueil législatif SST/10 - Lois principales/LATMP' };
  const notions = { base: 'Notions LATMP', alias: ['LATMP'], relPath: 'Wiki Droit du travail/20 - Articles/Notions LATMP.md', wikiKey: 'Wiki Droit du travail', dir: 'Wiki Droit du travail/20 - Articles' };
  const resoudre = resolveur([loi, notions]);
  const hygiene = { wikiKey: 'Wiki Hygiène industrielle', dir: 'Wiki Hygiène industrielle/20 - Articles' };
  const droit = { wikiKey: 'Wiki Droit du travail', dir: 'Wiki Droit du travail/30 - Fiches' };
  assert.equal(resoudre('LATMP', hygiene), loi, 'hors du wiki : la loi, par son nom de fichier');
  assert.equal(resoudre('LATMP', droit), notions, 'dans son wiki, l’alias garde la priorité');
  assert.equal(resoudre('Notions LATMP', hygiene), notions);
});

test('build_site : les liens qui passent par un alias vers un autre wiki sont relevés en fin de construction', () => {
  assert.match(build, /if \(pg && !parNom\) noterLienHorsWiki\(saisi, pg\);/);
  assert.match(build, /⚠ Liens vers un autre wiki par un alias/);
});
