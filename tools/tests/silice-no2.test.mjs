// Lots du 25 septembre 2026 « silice-no2 » : valeurs de l'annexe I du RSST (PDF officiel du recueil, à
// jour au 1er juin 2024) sur les pages qui les donnaient fausses — silice cristalline (quartz,
// cristobalite) 0,05 mg/m³, fraction respirable, C2, EM ; NO2 3 ppm (VEMP) et 5 ppm (VECD) ; CO 35 ppm.
// Chaque lot est rejoué deux fois sur une note reconstituée ; le site publié ne garde aucune des
// anciennes valeurs attribuées au Québec.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outils = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.dirname(outils);
const dossier = path.join(racine, 'content-updates');
const lots = fs.readdirSync(dossier).filter(f => /^2026-09-25-silice-no2-.+\.json$/.test(f)).sort();
const corps = rel => {
  const t = fs.readFileSync(path.join(racine, 'docs', rel), 'utf8').split('<nav class="voir-aussi"')[0];
  const i = t.indexOf('<div class="page-body">');
  return (i >= 0 ? t.slice(i) : t).replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
};

test('douze lots, un par note', () => assert.equal(lots.length, 12));

for (const nom of lots) {
  test('lot ' + nom + ' : appliqué, puis second passage sans effet', () => {
    const lot = JSON.parse(fs.readFileSync(path.join(dossier, nom), 'utf8'));
    assert.equal(lot.medias.length, 0);
    // note reconstituée : une ligne par fragment désigné, qui porte tous les textes à remplacer
    const lignes = new Map();
    for (const r of lot.retouches) {
      assert.equal(r.type, 'remplacer');
      lignes.set(r.ligneContenant, [...(lignes.get(r.ligneContenant) || []), r.avant]);
    }
    const note = ['# ' + lot.note.titre, '', ...[...lignes].map(([l, avants]) => `| ${l} | ${avants.join(' | ')} |`), ''].join('\n');
    const v = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-silice-'));
    const abs = path.join(v, lot.note.wiki, '20 - Articles internes', 'note.md');
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, note);
    const outil = () => execFileSync(process.execPath, [path.join(outils, 'appliquer_retouches.mjs'), '--lot', path.join(dossier, nom), '--vault', v, '--appliquer'], { cwd: v, encoding: 'utf8' });
    assert.doesNotMatch(outil(), /✗/);
    const apres = fs.readFileSync(abs, 'utf8');
    for (const r of lot.retouches) {
      assert.ok(apres.includes(r.apres), 'nouvelle valeur : ' + r.apres);
      assert.ok(!apres.includes(r.avant) || r.apres.includes(r.avant), 'ancienne valeur retirée : ' + r.avant);
    }
    assert.match(outil(), /Rien à changer/);
    assert.equal(fs.readFileSync(abs, 'utf8'), apres);
    fs.rmSync(v, { recursive: true, force: true });
  });
}

test('pages publiées : valeurs de l’annexe I du RSST', () => {
  const pages = {
    'w/hygiene/art-116-rsst-qualite-air-milieu-travail.html': ['VEMP 3 ppm / VECD 5 ppm', 'VEMP 35 ppm', 'VEMP 0,05 mg/m³', 'VEMP dépassée de 340'],
    'w/ergonomie/art-116-rsst-qualite-air-milieu-travail.html': ['VEMP 3 ppm / VECD 5 ppm', 'VEMP 35 ppm', 'VEMP 0,05 mg/m³ (silicose)', 'VEMP dépassée de 260'],
    'w/hygiene/art-39-rsst-vea-admissibles.html': ['(0,05 mg/m³ fraction respirable, C2, EM)', '(35 ppm VEMP)'],
    'w/hygiene/art-30-rsst-substitution-cancerogenes.html': ['cristalline alpha-quartz (C2, EM)'],
    'w/hygiene/vea-et-normes.html': ['(quartz, respirable)0,05 mg/m³C2, EM'],
    'w/legislation/20-reglements/rsst/rsst.html': ['Silice cristalline0,05 mg/m³'],
    'w/legislation/30-organismes-et-tribunaux/acgih.html': ['RSST québécois (0,05 mg/m³)'],
    'w/legislation/30-organismes-et-tribunaux/melccfp.html': ['VEMP silice 0,05 mg/m³ (atelier)'],
    'w/legislation/40-concepts-juridiques-transverses/silice-cristalline-hub.html': ['(0,05 mg/m³ silice respirable)'],
    'w/legislation/40-concepts-juridiques-transverses/vemp.html': ['(quartz, fraction respirable)0,05 mg/m³0,025 mg/m³'],
    'w/toxicologie/dose-reponse-et-dl50.html': ['VEMP NO2 3 ppm', 'respirable 0,05 mg/m³'],
    'w/toxicologie/toxicite-respiratoire.html': ['VEMP Qc 0,05 mg/m³'],
  };
  for (const [p, attendus] of Object.entries(pages)) {
    const t = corps(p).replace(/\n/g, '');
    for (const a of attendus) assert.ok(t.includes(a), p + ' : ' + a);
    assert.doesNotMatch(t, /VECD dépassée/, p);
  }
  // nulle part sur le site : NO2 à 0,2 ppm, ni silice à 0,1 ou 0,025 mg/m³ donnée pour le RSST ou le Québec
  const fichiers = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name));
      else if (e.name.endsWith('.html')) fichiers.push(path.join(d, e.name));
    }
  })(path.join(racine, 'docs', 'w'));
  for (const f of fichiers) {
    const t = corps(path.relative(path.join(racine, 'docs'), f)).replace(/\s+/g, ' ');
    assert.doesNotMatch(t, /(?:NO2|NO₂|dioxyde d.azote)[^.|]{0,40}?0,2 ppm/i, f);
    // la première valeur en mg/m³ qui suit la mention de la silice ; 0,025 n'est admise que comme TLV de l'ACGIH
    for (const m of t.matchAll(/(?:silice|quartz)[^.]{0,60}?(\d+(?:,\d+)?) mg\/m³/gi))
      if (m[1] === '0,1' || m[1] === '0,025') assert.match(t.slice(Math.max(0, m.index - 40), m.index + m[0].length), /TLV|ACGIH/, f + ' : ' + m[0]);
  }
});
