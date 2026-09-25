// Lots du 25 septembre 2026 : page « LIE » du recueil (seuils attribués à tort au RSST) et
// « Gaz et vapeurs » (« sous 5 % »). Rejoués de bout en bout sur des notes reconstituées d'après
// les pages publiées, dans un vault jetable ; contrôle des pages publiées.
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

const NOTE_LIE = [
  '---', 'tags: [concept, lie]', '---', '', '# LIE', '',
  "**Limite inférieure d'explosivité** (LEL en anglais : *Lower Explosive Limit*).", '',
  '## Concepts associés', '',
  "- **LSE** (UEL) : Limite **supérieure** d'explosivité (au-dessus, mélange trop riche pour brûler : mais danger si dilué)", '',
  '## Seuils opérationnels en espace clos', '',
  '| % LIE | Statut | Action |', '|---|---|---|',
  '| 0 % | Atmosphère **sécuritaire** | Entrée possible avec procédures |',
  "| < 10 % | **Seuil d'alarme** typique des détecteurs 4 gaz | Surveillance accrue, ventilation |",
  '| 10 % | **Sortie immédiate** requise ([[RSST]] espaces clos) | Évacuation, ventilation |',
  "| 10-100 % LIE | Zone **explosive** | Aucune entrée, élimination de toute source d'ignition |",
  '| > LSE | Trop riche pour brûler | Dangereux : se dilue progressivement vers LIE en ventilant |', '',
  '## Exemples de LIE (et LSE)', '',
  '## Démarche d\'évaluation et surveillance', '',
  '1. **Identifier** les substances inflammables présentes (procédé, [[FDS]])',
  '4. **Ventilation forcée** si LIE > 0 %',
  '5. **Surveillance continue** pendant le travail (alarmes audibles à seuils 10 % et 20 % LIE)',
  '6. **Élimination** des sources d\'ignition', '',
].join('\n');
const NOTE_GAZ = ['# Gaz et vapeurs', '', 'En espace clos : maintenir les concentrations sous 5 % de la LIE ([[art-302-RSST ventilation espace clos|art. 302]] [[RSST]]).', ''].join('\n');

function vault() {
  const v = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-lie-'));
  const ecrire = (rel, t) => { fs.mkdirSync(path.dirname(path.join(v, rel)), { recursive: true }); fs.writeFileSync(path.join(v, rel), t); };
  ecrire('Recueil législatif SST/40 - Concepts juridiques transverses/LIE.md', NOTE_LIE);
  ecrire('Wiki Hygiène industrielle/20 - Articles internes/Substances dangereuses/Gaz et vapeurs.md', NOTE_GAZ);
  for (const n of ['art-302-RSST ventilation espace clos', 'art-303-RSST poussières combustibles', 'art-304-RSST travail à chaud', 'art-306-RSST méthode et fréquence des relevés atmosphériques'])
    ecrire('Recueil législatif SST/20 - Règlements/RSST/' + n + '.md', '# ' + n + '\n');
  return v;
}
const outil = (v, nom, ...o) => execFileSync(process.execPath, [path.join(outils, 'appliquer_retouches.mjs'), '--lot', lot(nom), '--vault', v, ...o], { cwd: v, encoding: 'utf8' });

test('LIE : lot appliqué, tableau intact à trois colonnes, liens échappés, second passage sans effet', () => {
  const v = vault();
  const abs = path.join(v, 'Recueil législatif SST/40 - Concepts juridiques transverses/LIE.md');
  assert.doesNotMatch(outil(v, '2026-09-25-lie.json', '--appliquer'), /✗/);
  const note = fs.readFileSync(abs, 'utf8');
  const rangees = note.split('\n').filter(l => l.startsWith('|'));
  assert.equal(rangees.length, 6, 'en-tête, séparateur et quatre rangées');
  for (const r of rangees) assert.equal(r.replace(/\\\|/g, '').split('|').length, 5, 'trois cellules : ' + r);
  assert.ok(note.includes("[[art-302-RSST ventilation espace clos\\|art. 302]]"), 'lien de tableau échappé');
  assert.ok(note.includes("[[art-304-RSST travail à chaud|art. 304]]"), 'lien hors tableau non échappé');
  assert.doesNotMatch(note, /10 %|sécuritaire|Ventilation forcée|10-100/);
  assert.ok(note.includes('## Seuils opérationnels en espace clos'), 'titre et ancre conservés');
  assert.ok(note.includes('le RSST ne les fixe pas'));
  assert.ok(/\| > LSE \|[^\n]*\n\nLes seuils d'alarme/.test(note), 'paragraphe après le tableau, séparé par une ligne vide');
  assert.match(outil(v, '2026-09-25-lie.json', '--appliquer'), /Rien à changer/);
  fs.rmSync(v, { recursive: true, force: true });
});

test('Gaz et vapeurs : « à 5 % de la LIE au plus », retrouvée sans chemin par son titre', () => {
  const v = vault();
  assert.doesNotMatch(outil(v, '2026-09-25-gaz-et-vapeurs.json', '--appliquer'), /✗/);
  const note = fs.readFileSync(path.join(v, 'Wiki Hygiène industrielle/20 - Articles internes/Substances dangereuses/Gaz et vapeurs.md'), 'utf8');
  assert.ok(note.includes('maintenir les concentrations à 5 % de la LIE au plus ([[art-302'));
  assert.match(outil(v, '2026-09-25-gaz-et-vapeurs.json', '--appliquer'), /Rien à changer/);
  fs.rmSync(v, { recursive: true, force: true });
});

test('pages publiées : plus aucun seuil attribué à tort au RSST', () => {
  const lie = lire('w/legislation/40-concepts-juridiques-transverses/lie.html');
  const corps = lie.split('<nav class="voisins"')[0];
  assert.doesNotMatch(corps, /10 %|Atmosphère <strong>sécuritaire|10-100 % LIE|Ventilation forcée/);
  assert.ok(corps.includes('<td>Au plus 5 % de la LIE</td>'));
  assert.ok(corps.includes('<td>De la LIE à la LSE</td>'));
  assert.ok(corps.includes('le RSST ne les fixe pas'));
  assert.ok(corps.includes('id="seuils-operationnels-en-espace-clos"'), 'ancre conservée');
  for (const a of ['art-302-rsst-ventilation-espace-clos', 'art-303-rsst-poussieres-combustibles', 'art-304-rsst-travail-a-chaud', 'art-306-rsst-methode-et-frequence-des-releves-atmospheriques'])
    assert.ok(corps.includes(`href="../../../w/legislation/20-reglements/rsst/${a}.html"`), 'renvoi au texte officiel : ' + a);
  const gaz = lire('w/hygiene/gaz-et-vapeurs.html');
  assert.ok(gaz.includes('maintenir les concentrations à 5 % de la LIE au plus'));
  assert.doesNotMatch(gaz, /sous 5 % de la LIE/);
});
