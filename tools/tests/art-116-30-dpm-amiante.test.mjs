// Lots du 25 septembre 2026 « corr-* » et « titre-art-116-* » : pages art-116 et art-30 rattachées au
// mauvais article, valeurs du DPM (RSSM, art. 102) et de l'amiante (annexe I du RSST). Chaque lot est
// appliqué deux fois à une note reconstituée (le second passage ne change rien) ; les pages publiées ne
// gardent aucune des affirmations corrigées.
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
const lots = fs.readdirSync(dossier).filter(f => /^2026-09-25-(corr|titre-art-116)-.+\.json$/.test(f)).sort();
const corps = rel => {
  const t = fs.readFileSync(path.join(racine, 'docs', rel), 'utf8').split('<nav class="voir-aussi"')[0];
  const i = t.indexOf('<div class="page-body">');
  return (i >= 0 ? t.slice(i) : t).split('<h2 id="texte-officiel"')[0]
    .replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
};

test('onze lots : neuf de correction, deux de titre', () => {
  assert.equal(lots.filter(f => f.includes('-corr-')).length, 9);
  assert.equal(lots.filter(f => f.includes('-titre-art-116-')).length, 2);
});

// Note reconstituée : le titre, puis une ligne par fragment désigné, qui porte les textes à remplacer.
function note(lot) {
  const lignes = ['# ' + lot.note.titre, ''];
  const par = new Map();
  for (const r of lot.retouches) {
    const base = r.type === 'remplacer' && r.avant.includes(r.ligneContenant) ? '' : r.ligneContenant;
    const l = par.get(r.ligneContenant) ?? (r.type === 'remplacer' ? base : '- ' + base);
    par.set(r.ligneContenant, r.type === 'remplacer' ? (l ? l + ' ' : '') + r.avant : l);
  }
  for (const l of par.values()) if (!lignes.includes(l)) lignes.push(l);
  return lignes.join('\n') + '\n';
}

for (const nom of lots) {
  test('lot ' + nom + ' : appliqué, puis second passage sans effet', () => {
    const lot = JSON.parse(fs.readFileSync(path.join(dossier, nom), 'utf8'));
    const v = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-corr-'));
    // nommée d'après son titre : après le lot de titre, la note se retrouve par son adresse
    const abs = path.join(v, lot.note.wiki, '20 - Articles internes', lot.note.titre + '.md');
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, note(lot));
    // une note du recueil pour chaque renvoi {{lien:…}}, nommée comme son adresse publiée
    for (const [, a] of JSON.stringify(lot).matchAll(/\{\{lien:(w\/legislation\/[^|}]+)\|/g)) {
      const f = path.join(v, 'Recueil législatif SST', path.basename(a, '.html') + '.md');
      if (!fs.existsSync(f)) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, '# ' + path.basename(a, '.html') + '\n'); }
    }
    const outil = () => execFileSync(process.execPath, [path.join(outils, 'appliquer_retouches.mjs'), '--lot', path.join(dossier, nom), '--vault', v, '--appliquer'], { cwd: v, encoding: 'utf8' });
    assert.doesNotMatch(outil(), /✗/);
    const apres = fs.readFileSync(abs, 'utf8');
    assert.doesNotMatch(apres, /\{\{lien:/, 'renvois résolus');
    assert.match(outil(), /Rien à changer/);
    assert.equal(fs.readFileSync(abs, 'utf8'), apres);
    fs.rmSync(v, { recursive: true, force: true });
  });
}

test('pages publiées : plus d’article 116 pour la qualité de l’air, plus d’article 30 pour les cancérogènes', () => {
  for (const w of ['hygiene', 'ergonomie']) {
    const t = corps(`w/${w}/art-116-rsst-qualite-air-milieu-travail.html`);
    assert.match(t, /^\s*Texte officiel sur LegisQuébec · RSST\.pdf Température : Sous réserve des articles 117 et 118/, w + ' : texte officiel en tête');
    assert.doesNotMatch(t, /art\. 116 (?:RSST )?(?:est|qualité air)|infraction à l'art\. 116|Infraction à l'art\. 116|Article central|chauffé à minimum 20/, w);
    assert.ok(t.includes('(RSSM, art. 96)') && t.includes('Moins de 0,4 mg/m³ de carbone total (RSSM, art. 102)'), w);
    const html = fs.readFileSync(path.join(racine, 'docs', `w/${w}/art-116-rsst-qualite-air-milieu-travail.html`), 'utf8');
    assert.match(html, /<h1 class="page-title">art-116-RSST, température des locaux fermés<\/h1>/, w + ' : titre');
  }
  const t30 = corps('w/hygiene/art-30-rsst-substitution-cancerogenes.html');
  assert.match(t30, /Mesures de sécurité : Le travailleur doit: 1° faire face à l’échelle portative/);
  assert.doesNotMatch(t30, /obligation de substitution|visées par l'article 30|L'art\. 30 impose|en vertu de l'art\. 30|exigences de salubrité|plus de 90 %|émissions de moteurs diesel \(C1/);
  assert.ok(t30.includes('cadmium (C2)') && t30.includes('(C1 pour les composés insolubles et le subsulfure de nickel)'));
});

test('pages publiées : DPM selon le RSSM, amiante selon l’annexe I', () => {
  assert.ok(corps('w/legislation/20-reglements/rsst/rsst.html').includes("Diesel (DPM) Aucune à l'annexe I ; en mine souterraine, moins de 0,4 mg/m³ de carbone total (RSSM, art. 102)"));
  assert.ok(corps('w/legislation/40-concepts-juridiques-transverses/vemp.html').includes("DPM Aucune à l'annexe I ; en mine souterraine, moins de 0,4 mg/m³ de carbone total (RSSM, art. 102)"));
  const vea = corps('w/hygiene/vea-et-normes.html');
  assert.ok(vea.includes('Particules diesel (DPM, carbone total)') && vea.includes('Amiante (chrysotile) 0,1 f/cm³ C1, EM '));
  for (const p of ['w/toxicologie/diesel-sous-terre.html', 'g/w/toxicologie/diesel-sous-terre.html']) {
    const d = corps(p);
    assert.doesNotMatch(d, /valeurs en révision pour le DPM|Campagne annuelle EC/, p);
    assert.ok(d.includes('mesuré au moins tous les 6 mois (art. 103.1)') && d.includes('Mesures au moins tous les 6 mois, en carbone total (RSSM, art. 102 et 103.1 ; NIOSH 5040)'), p);
  }
  for (const p of ['w/hygiene/amiante.html', 'g/w/hygiene/amiante.html', 'w/toxicologie/amiante.html']) {
    const a = corps(p);
    assert.ok(a.includes('Toutes les formes (chrysotile, amosite, crocidolite, trémolite, actinolite, anthophyllite) 0,1 f/cm³ — C1, EM'), p);
    assert.doesNotMatch(a, /Crocidolite, amosite 0,2 f\/cm³|actinolite 1 f\/cm³/, p);
  }
  // nulle part (hors pages Amiante de la CSTC, qui citent le texte officiel) : l'amiante à 1 f/cm³ en VEMP
  for (const p of ['w/hygiene/art-116-rsst-qualite-air-milieu-travail.html', 'w/hygiene/vea-et-normes.html'])
    assert.doesNotMatch(corps(p), /Amiante[^|]{0,60}?(?<![\d,])1 f\/cm³/, p);
});
