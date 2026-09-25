// Lots du 25 septembre 2026 : « Processus de réclamation CNESST » (deux schémas et cellules corrigées
// d'après la LATMP et l'art. 62 de la LSST) et « Indemnités de remplacement du revenu (IRR) » (mêmes
// règles de versement). Rejoués deux fois sur des notes reconstituées d'après les pages publiées,
// dans un vault jetable ; contrôle des pages publiées.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outils = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.dirname(outils);
const lot = nom => path.join(racine, 'content-updates', nom);
const lire = rel => fs.readFileSync(path.join(racine, 'docs', rel), 'utf8');
const LOT_RECLAMATION = '2026-09-25-reclamation-cnesst-schemas.json';
const LOT_IRR = '2026-09-25-irr-indemnites.json';

const NOTE_RECLAMATION = [
  '---', 'type: article', '---', '# Processus de réclamation CNESST', '',
  "La réclamation d'un travailleur victime d'une lésion professionnelle déclenche des obligations parallèles.", '',
  '## Cadre légal', '',
  '- [[art-270-LATMP|LATMP art. 270]], [[art-271-LATMP|271]] : délais de réclamation pour lésion.',
  '- [[art-59-LATMP|LATMP art. 59]], [[art-60-LATMP|60]], [[art-124-LATMP|124]] : versement du salaire.', '',
  '### Obligations du travailleur', '',
  '- Produire la réclamation dans les délais (voir ci-dessous).', '',
  "### Obligations de l'employeur", '',
  '| Obligation | Article |', '|---|---|',
  '| Faciliter la déclaration et fournir les formulaires | [[art-270-LATMP]] |',
  '| Aviser la [[CNESST, rôles et pouvoirs]] que le travailleur est incapable + réclamer le remboursement | [[art-268-LATMP]] ; [[art-62-LSST]] |',
  "| Verser le salaire net du jour de l'accident | [[art-59-LATMP]] |",
  '| Verser 90 % du salaire net pendant les 14 jours suivants | [[art-60-LATMP]] |',
  '| Produire la réclamation dans les 14 premiers jours | [[art-268-LATMP]] |',
  '| Aviser la CNESST du retour ou non-retour dans les 14 jours | [[art-269-LATMP]] |', '',
  "Voir aussi [[LSST, droits et obligations]] sur l'avis d'accident grave dans les 24 heures ([[art-62-LSST|LSST art. 62]]).", '',
  '### Délais de réclamation', '',
  '| Type | Délai | Article |', '|---|---|---|',
  '| Lésion professionnelle (cas général) | 6 mois de la survenance | [[art-270-LATMP]], [[art-271-LATMP]] |',
  '| Travailleur sans incapacité au-delà du jour de la lésion / sans employeur tenu de verser un salaire | 6 mois de la lésion | [[art-271-LATMP]] |',
  "| Atteinte permanente | 6 mois de l'atteinte | [[art-270-LATMP]] |",
  '| Maladie professionnelle | 6 mois de la portée à la connaissance | [[art-272-LATMP]] |',
  '| Prolongation possible (motif raisonnable) | - | [[art-352-LATMP]] |', '',
  '### Versement du salaire', '',
  '| Période | Payeur | Article |', '|---|---|---|',
  "| Jour de l'accident (portion travaillée) | Employeur (salaire net) | [[art-59-LATMP]] |",
  '| Jours 2 à 14 | Employeur (90 % salaire net) | [[art-60-LATMP]] |',
  '| À partir du 15e jour | [[CNESST, rôles et pouvoirs]] ([[Indemnités de remplacement du revenu (IRR)]]) | [[art-124-LATMP]] |', '',
  '### Application terrain', '',
  '| Situation | Particularités |', '|---|---|',
  "| Accident grave en souterrain | [[art-62-LSST]] : avis dans les 24 heures, lieux inchangés. Procédure d'enquête [[CNESST, rôles et pouvoirs]] + Loi sur les mines à activer en parallèle. |",
  "| Maladie professionnelle pulmonaire (silicose) | Délai de 6 mois part du diagnostic médical ([[art-272-LATMP]]), pas du début d'exposition. |",
  "| Travailleur sous-traitant | Réclamation produite chez son employeur (le sous-traitant), pas chez le donneur d'ouvrage. Identification claire de l'employeur. |", '',
].join('\n');

const NOTE_IRR = [
  '# Indemnités de remplacement du revenu (IRR)', '',
  '| Élément | Règle | Article |', '|---|---|---|',
  "| Versement initial [[CNESST, rôles et pouvoirs]] | À partir du 15e jour d'incapacité | [[art-124-LATMP]] |", '',
  '### Versement et règles de paiement', '',
  "- Premier jour de l'accident : l'employeur verse le salaire net pour la portion travaillée ([[art-59-LATMP|art. 59]]).",
  "- Jours 2 à 14 : l'employeur verse 90 % du salaire net ([[art-60-LATMP|art. 60]]).",
  '- À partir du 15e jour : la [[CNESST, rôles et pouvoirs|CNESST]] verse les IRR ([[art-124-LATMP|art. 124]]).', '',
].join('\n');

const REC = 'Wiki Droit du travail/20 - Articles internes/Réclamation CNESST.md';
const IRR = 'Wiki Droit du travail/20 - Articles internes/IRR indemnités.md';

function vault() {
  const v = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-latmp-'));
  const ecrire = (rel, t) => { fs.mkdirSync(path.dirname(path.join(v, rel)), { recursive: true }); fs.writeFileSync(path.join(v, rel), t); };
  ecrire(REC, NOTE_RECLAMATION);
  ecrire(IRR, NOTE_IRR);
  // une note du recueil pour chaque renvoi {{lien:…}} des schémas, nommée comme son adresse publiée
  const texte = fs.readFileSync(lot(LOT_RECLAMATION), 'utf8');
  for (const [, adresse] of texte.matchAll(/\{\{lien:(w\/legislation\/[^|}]+)\|/g))
    ecrire('Recueil législatif SST/' + path.basename(adresse, '.html') + '.md', '# ' + path.basename(adresse, '.html') + '\n');
  return v;
}
const outil = (v, nom) => execFileSync(process.execPath, [path.join(outils, 'appliquer_retouches.mjs'), '--lot', lot(nom), '--vault', v, '--appliquer'], { cwd: v, encoding: 'utf8' });
const cellules = l => l.replace(/\\\|/g, '').split('|').length;

const PERIMES = [/portion travaillée/, /Jours 2 à 14/, /6 mois de l'atteinte/, /du jour de l'accident/, /14 jours suivants/,
  /réclamation dans les 14 premiers jours/, /retour ou non-retour/, /fournir les formulaires/, /6 mois de la survenance/, /part du diagnostic/,
  /chez son employeur/, /avis dans les 24 heures/, /avis d'accident grave dans les 24 heures/, /À partir du 15e jour/];

test('Réclamation CNESST : schémas sous leurs titres, cellules corrigées, tableaux intacts, second passage sans effet', () => {
  const v = vault();
  assert.doesNotMatch(outil(v, LOT_RECLAMATION), /✗/);
  const note = fs.readFileSync(path.join(v, REC), 'utf8');
  for (const p of PERIMES) assert.doesNotMatch(note, p);
  for (const l of note.split('\n').filter(x => x.startsWith('|'))) {
    const entete = note.split('\n').filter(x => x.startsWith('|')).find(x => cellules(x) === cellules(l));
    assert.ok(entete, 'rangée de tableau intacte : ' + l);
  }
  assert.match(note, /### Versement du salaire\n\n<div class="infographie[^\n]*\n\n!\[\[Infographies\/wiki-reclamation-cnesst-salaire-v1\.svg\|/);
  assert.match(note, /### Délais de réclamation\n\n<div class="infographie[^\n]*\n\n!\[\[Infographies\/wiki-reclamation-cnesst-delais-v1\.svg\|/);
  assert.doesNotMatch(note, /\{\{lien:/, 'renvois au recueil résolus');
  assert.ok(note.includes("| Jour où débute l'incapacité (reste de la journée de travail prévue) | Employeur (salaire net) |"));
  assert.ok(note.includes('informer la CNESST par le moyen de communication le plus rapide, puis lui faire un rapport écrit dans les 24 heures'));
  for (const f of ['wiki-reclamation-cnesst-salaire-v1.svg', 'wiki-reclamation-cnesst-delais-v1.svg'])
    assert.ok(fs.existsSync(path.join(v, 'Infographies', f)), 'schéma copié : ' + f);
  assert.match(outil(v, LOT_RECLAMATION), /Rien à changer/);
  assert.equal(fs.readFileSync(path.join(v, REC), 'utf8'), note);
  fs.rmSync(v, { recursive: true, force: true });
});

test('IRR : mêmes règles de versement que la page Réclamation, second passage sans effet', () => {
  const v = vault();
  assert.doesNotMatch(outil(v, LOT_IRR), /✗/);
  const note = fs.readFileSync(path.join(v, IRR), 'utf8');
  for (const p of [/portion travaillée/, /Jours 2 à 14/, /À partir du 15e jour/]) assert.doesNotMatch(note, p);
  assert.ok(note.includes("- Jour où débute l'incapacité : l'employeur verse le salaire net pour le reste de la journée de travail prévue ([[art-59-LATMP|art. 59]])."));
  assert.ok(note.includes("- Pendant les 14 jours complets suivant le début de l'incapacité : l'employeur verse 90 % du salaire net"));
  assert.ok(note.includes("- À compter du 15e jour complet suivant le début de l'incapacité : la [[CNESST, rôles et pouvoirs|CNESST]] verse les IRR"));
  assert.ok(note.includes("| Dès le 15e jour complet suivant le début de l'incapacité | [[art-124-LATMP]] |"));
  assert.match(outil(v, LOT_IRR), /Rien à changer/);
  fs.rmSync(v, { recursive: true, force: true });
});

test('pages publiées : versement du salaire et délais conformes à la LATMP, avis d’événement grave conforme à la LSST', () => {
  const dec = s => s.replace(/&#39;/g, "'");
  const rec = dec(lire('w/droit-travail/reclamation-cnesst.html').split('<nav class="voir-aussi"')[0]);
  for (const p of PERIMES) assert.doesNotMatch(rec, p);
  assert.ok(rec.includes("<td>Jour où débute l'incapacité (reste de la journée de travail prévue)</td>"));
  assert.ok(rec.includes('<td>À compter du 15e jour complet suivant le début de l\'incapacité</td>'));
  assert.ok(rec.includes('par le moyen de communication le plus rapide'));
  const irr = dec(lire('w/droit-travail/irr-indemnites.html').split('<nav class="voir-aussi"')[0]);
  for (const p of [/portion travaillée/, /Jours 2 à 14/, /À partir du 15e jour/]) assert.doesNotMatch(irr, p);
  assert.ok(irr.includes("<li>Jour où débute l'incapacité : l'employeur verse le salaire net pour le reste de la journée de travail prévue ("));
});
