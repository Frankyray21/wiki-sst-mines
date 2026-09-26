// Lot du 25 septembre 2026 : cinq schémas sur « Espaces clos ». Le vault n'est pas dans le dépôt :
// le lot est rejoué de bout en bout sur une note reconstituée d'après la page publiée, dans un
// vault jetable, avec le vrai outil (essai, application, second passage sans effet).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outils = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.dirname(outils);
const LOT = path.join(racine, 'content-updates', '2026-09-25-espaces-clos-schemas.json');
const lot = JSON.parse(fs.readFileSync(LOT, 'utf8'));
const page = fs.readFileSync(path.join(racine, 'docs', lot.note.page), 'utf8');

// Extrait de la note tel que la page publiée permet de le reconstituer (Obsidian, fins de ligne CRLF).
const NOTE = [
  '---', 'tags: [wiki, hygiène, espace-clos, programme]', 'révision: 2026-05-22', '---', '',
  '# Espaces clos', '',
  '### Dangers spécifiques', '',
  'Les dangers en espace clos sont multiples et interagissent.', '',
  '![[Pasted image 20241214152521.png]]', '',
  '#### Atmosphériques', '',
  '| Risque | Description |', '|---|---|',
  '| Déficience en O2 (< 20,5 %) | Combustion, décomposition, oxydation, purge avec gaz inerte (azote, argon) |',
  "| Gaz inflammables | [[LIE]] ; doit rester < 5 % de la LIE |",
  '| [[Aérosols]], poussières combustibles | Risque d\'explosion |', '',
  'Un milieu enrichi en O2 voit son inflammabilité augmenter fortement.', '',
  '![[Pasted image 20241214152919.png]]', '',
  'La densité de vapeur conditionne où s\'accumulent les gaz.', '',
  '![[Pasted image 20241214153559.png]]', '',
  '### Articles RSST clés', '',
  '| Art. | Disposition |', '|---|---|',
  '| 302 | Ventilation, O2 entre 20,5-23 %, gaz inflammable < 5 % LIE, annexe I respectée |',
  "| 308 | Surveillance (visuelle/auditive, surveillant à l'extérieur) |",
  "| 308.1 | Situation imprévue, ordonner l'évacuation |", '',
  '3. **Purge** : vider l\'atmosphère, remplacer par air sain. APSAM suggère 7,5 CA/H.', '',
  'Situation type à éviter lors d\'une purge mal séquencée.', '',
  '![[Pasted image 20241214155015.png]]', '',
  '6. Établir un plan de sauvetage ([[art-309-RSST|art. 309]]) avec équipe, harnais, exercices.', '',
  '- Évaluation atmosphérique préalable : O2 (20,5-23 %), gaz combustibles (< 5 % LIE), autres agresseurs (CO, NO2, H2S, [[Solvants|solvants]]).', '',
  '#### Surveillant (obligatoire)', '',
  "- Personne qualifiée demeurant à l'extérieur.",
  '- Contact visuel, auditif ou autre moyen avec le travailleur.',
  '- Déclenche les procédures de sauvetage si nécessaire.',
  '- Ne peut entrer pour secourir (risque de devenir une victime).', '',
  '### Application terrain', '',
  "**Particularité minière** : un chantier souterrain en cul-de-sac avec ventilation auxiliaire défaillante peut, fonctionnellement, devenir un espace clos sans en avoir l'apparence. La procédure de travail doit prévoir ce basculement.", '',
  '### Ressources', '',
  '| Document | Type | Source |', '|---|---|---|',
  '| [[art-296.1-RSST : champ d\'application, espace clos]] à 312 | Règlement | LégisQuébec |',
  '| Guides espaces clos (fiches 17, 18, 32) | Guides | APSAM |',
  '| Permis d\'entrée modèle | Gabarit | À développer en interne |', '',
].join('\r\n');

function vaultJetable() {
  const v = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-ec-'));
  const ecrire = (rel, texte) => { fs.mkdirSync(path.dirname(path.join(v, rel)), { recursive: true }); fs.writeFileSync(path.join(v, rel), texte); };
  ecrire(lot.note.chemin, NOTE);
  const rsst = 'Recueil législatif SST/20 - Règlements/RSST/';
  for (const n of ['art-302-RSST ventilation espace clos', 'art-308-RSST surveillant', 'art-308.1-RSST situation imprévue', 'art-309-RSST plan de sauvetage']) ecrire(rsst + n + '.md', '# ' + n + '\n');
  ecrire('Wiki Sécurité industrielle/40 - Articles de loi/RSST/art-309-RSST.md', '# art-309-RSST\n'); // la fiche « électricité » mal intitulée
  ecrire('Wiki Hygiène industrielle/20 - Articles internes/Substances dangereuses/Gaz et vapeurs.md', '# Gaz et vapeurs\n');
  return v;
}
const outil = (vault, ...opts) => execFileSync(process.execPath, [path.join(outils, 'appliquer_retouches.mjs'), '--lot', LOT, '--vault', vault, ...opts], { cwd: vault, encoding: 'utf8' });

test('lot : essai sans écriture, application, second passage sans effet', () => {
  const vault = vaultJetable();
  const abs = path.join(vault, lot.note.chemin);
  const essai = outil(vault);
  assert.match(essai, /Essai : rien n’est écrit/);
  assert.equal(fs.readFileSync(abs, 'utf8'), NOTE, 'essai : note intacte');
  assert.ok(!fs.existsSync(path.join(vault, 'Infographies')), 'essai : aucun média copié');

  const sortie = outil(vault, '--appliquer');
  assert.doesNotMatch(sortie, /✗/);
  const note = fs.readFileSync(abs, 'utf8');
  for (const m of lot.medias) {
    const nom = path.basename(m.depuis);
    assert.ok(note.includes('![[Infographies/' + nom + '|'), 'schéma intégré : ' + nom);
    assert.deepEqual(fs.readFileSync(path.join(vault, 'Infographies', nom)), fs.readFileSync(path.join(racine, m.depuis)), 'média copié à l’identique : ' + nom);
  }
  for (const ancienne of ['20241214152919', '20241214153559', '20241214155015']) assert.ok(!note.includes(ancienne), 'capture remplacée retirée : ' + ancienne);
  assert.ok(note.includes('20241214152521'), 'captures non concernées conservées');
  assert.ok(note.includes('[[art-308-RSST surveillant|art. 308]]'));
  assert.ok(note.includes('[[art-309-RSST plan de sauvetage|art. 309]]') && !note.includes('[[art-309-RSST|art. 309]]'), 'plan de sauvetage : bon article');
  assert.ok(note.includes('moyen de communication bidirectionnel'));
  assert.ok(note.includes('- Déclenche les procédures de sauvetage si nécessaire.'), 'puces non concernées intactes');
  assert.match(note, /doit rester ≤ 5 % de la LIE/);
  assert.doesNotMatch(note, /< 5 % (?:de la )?LIE/);
  assert.ok(note.includes('| Guides espaces clos (fiches 17, 18, 32) | Guides | APSAM |\r\n| [Espaces clos](https://www.cnesst.gouv.qc.ca/'), 'rangées ajoutées dans le tableau, sans ligne vide');
  assert.doesNotMatch(note, /\{\{lien:/, 'tous les liens résolus');
  assert.doesNotMatch(note, /[^\r]\n/, 'fins de ligne CRLF conservées');
  assert.doesNotMatch(note, /(\r\n){3}/, 'aucune double ligne vide');
  assert.ok(fs.existsSync(path.join(vault, 'sauvegarde-vault')), 'note sauvegardée avant écriture');

  assert.match(outil(vault, '--appliquer'), /Rien à changer/);
  assert.equal(fs.readFileSync(abs, 'utf8'), note, 'second passage sans effet');
  fs.rmSync(vault, { recursive: true, force: true });
});

// « Lire le schéma en texte » retiré le 26 septembre 2026 : la note qui avait reçu les cinq blocs avec leur
// version texte la perd au passage du lot, avec le vrai outil, et devient la note qu'il produit aujourd'hui.
test('lot : la version texte reçue avant quitte la note, sauvegarde faite, second passage sans effet', () => {
  const avecTexte = r => (r.type === 'insererApres' && r.marqueur.startsWith('Infographies/')) ? { ...r, bloc: r.bloc.replace('</p>\n\n<p class="infographie-sources">', '</p>\n\n<details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n<li>Puce.</li>\n</ul>\n</details>\n<p class="infographie-sources">') } : r;
  const ancienLot = { ...lot, retouches: lot.retouches.filter(r => r.type !== 'retirerVersionTexte').map(avecTexte) };
  assert.equal(ancienLot.retouches.filter(r => r.bloc?.includes('Lire le schéma en texte')).length, 5);
  const vault = vaultJetable();
  const abs = path.join(vault, lot.note.chemin);
  const ancien = path.join(vault, 'ancien-lot.json');
  fs.writeFileSync(ancien, JSON.stringify(ancienLot));
  execFileSync(process.execPath, [path.join(outils, 'appliquer_retouches.mjs'), '--lot', ancien, '--vault', vault, '--appliquer'], { cwd: vault, encoding: 'utf8' });
  assert.equal(fs.readFileSync(abs, 'utf8').split('Lire le schéma en texte').length - 1, 5, 'la note a reçu les cinq versions texte');
  const sortie = outil(vault, '--appliquer');
  assert.equal((sortie.match(/✓ retirerVersionTexte/g) || []).length, 5);
  const nettoyee = fs.readFileSync(abs, 'utf8');
  const vaultNeuf = vaultJetable();
  outil(vaultNeuf, '--appliquer');
  assert.equal(nettoyee, fs.readFileSync(path.join(vaultNeuf, lot.note.chemin), 'utf8'), 'même note qu’une note qui reçoit le lot aujourd’hui');
  assert.ok(!nettoyee.includes('<details'));
  assert.match(outil(vault, '--appliquer'), /Rien à changer/);
  fs.rmSync(vault, { recursive: true, force: true });
  fs.rmSync(vaultNeuf, { recursive: true, force: true });
});

test('lot : une ligne introuvable dans la note arrête tout, rien n’est écrit', () => {
  const vault = vaultJetable();
  const abs = path.join(vault, lot.note.chemin);
  const sansSurveillant = NOTE.replace('- Contact visuel, auditif ou autre moyen avec le travailleur.\r\n', '');
  fs.writeFileSync(abs, sansSurveillant);
  assert.throws(() => outil(vault, '--appliquer'), /Rien n’est écrit/);
  assert.equal(fs.readFileSync(abs, 'utf8'), sansSurveillant);
  assert.ok(!fs.existsSync(path.join(vault, 'Infographies')));
  fs.rmSync(vault, { recursive: true, force: true });
});

test('page publiée et note du vault disent la même chose, schéma par schéma', () => {
  const blocs = lot.retouches.filter(r => r.type === 'insererApres' && r.marqueur.startsWith('Infographies/'));
  assert.equal(blocs.length, 5);
  for (const r of blocs) {
    const nom = r.marqueur.slice('Infographies/'.length);
    const legende = r.bloc.match(/<p class="infographie-legende">([\s\S]*?)<\/p>/)[1];
    const puces = [...r.bloc.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]);
    const alt = r.bloc.match(/!\[\[Infographies\/[^|]+\|([^\]]+)\]\]/)[1];
    const html = page.match(new RegExp('<div class="infographie infographie-compacte infographie-schema">(?:(?!<div class="infographie)[\\s\\S])*?' + nom.replace(/\./g, '\\.') + '[\\s\\S]*?</div>'))?.[0];
    assert.ok(html, 'bloc publié : ' + nom);
    assert.ok(html.includes('<p class="infographie-legende">' + legende + '</p>'), 'même légende : ' + nom);
    for (const p of puces) assert.ok(html.includes('<li>' + p + '</li>'), 'même version texte : ' + nom);
    const altHtml = html.match(/alt="([^"]*)"/)[1].replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    assert.equal(altHtml, alt, 'même texte alternatif : ' + nom);
  }
});

test('schémas : autonomes, accessibles, sans chiffre hors du texte officiel', () => {
  for (const m of lot.medias) {
    const svg = fs.readFileSync(path.join(racine, m.depuis), 'utf8');
    assert.match(svg, /^(?:<\?xml[^>]*\?>\s*)?<svg[^>]+width="480" height="(\d+)"[^>]+viewBox="0 0 480 \1"/, 'dimensions intrinsèques = viewBox : ' + m.depuis);
    assert.match(svg, /<title id="t">[^<]{10,}<\/title>/);
    assert.match(svg, /<desc id="d">[^<]{40,}<\/desc>/);
    assert.doesNotMatch(svg, /<script|<image|<foreignObject|href="http|@import/i);
    assert.doesNotMatch(svg, /10\s*%\s*de la LIE|(?:<|&lt;)\s?5\s*%|CA\/h|ppm|mg\/m/i, 'aucune valeur absente du texte officiel : ' + m.depuis);
    const chiffres = (svg.replace(/<[^>]+>/g, ' ').match(/\d+(?:[,.]\d+)?/g) || []);
    assert.ok(chiffres.every(c => ['0', '1', '5', '100', '2', '302', '308', '309'].includes(c)), 'chiffres autorisés seulement (' + chiffres.join(', ') + ') : ' + m.depuis);
  }
});

test('dimensions des schémas : lues sur le SVG, posées sur l’<img> pour réserver la place', async () => {
  const { dimensionsSvg } = await import('../dimensions_svg.mjs');
  assert.deepEqual(dimensionsSvg('<?xml version="1.0"?><svg width="480" height="630" viewBox="0 0 480 630">'), { largeur: 480, hauteur: 630 });
  assert.deepEqual(dimensionsSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 456">'), { largeur: 480, hauteur: 456 }, 'viewBox à défaut');
  assert.equal(dimensionsSvg('<svg width="100%">'), null, 'pourcentage sans viewBox : rien');
  assert.equal(dimensionsSvg('pas un svg'), null);
  for (const m of lot.medias) {
    const d = dimensionsSvg(fs.readFileSync(path.join(racine, m.depuis), 'utf8'));
    assert.ok(page.includes(`src="../../${m.depuis.replace(/^docs\//, '')}"`) && new RegExp(`src="\\.\\./\\.\\./${m.depuis.replace(/^docs\//, '').replace(/\./g, '\\.')}" alt="[^"]+" width="${d.largeur}" height="${d.hauteur}" loading="lazy"`).test(page), 'place réservée : ' + m.depuis);
  }
  const build = fs.readFileSync(path.join(outils, 'build_site.mjs'), 'utf8');
  assert.match(build, /import \{ dimensionsSvg, dimensionsImage \} from '\.\/dimensions_svg\.mjs'/, 'le générateur pose aussi ces dimensions');
  assert.match(build, /else if \(url\.startsWith\('files\/infographies\/'\)\) \{\s*try \{ const d = dimensionsImage\(/, 'et celles des images PNG/JPEG des infographies');
});

test('dimensions d’une image PNG ou JPEG des infographies : lues dans son en-tête', async () => {
  const { dimensionsImage } = await import('../dimensions_svg.mjs');
  const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), u32(13), Buffer.from('IHDR'), u32(1200), u32(800), Buffer.from([8, 2, 0, 0, 0]), Buffer.alloc(4)]);
  assert.deepEqual(dimensionsImage(png), { largeur: 1200, hauteur: 800 });
  // un segment EXIF (APP1) avant l'en-tête de trame : il est sauté
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0, 0,
    0xff, 0xc2, 0x00, 0x11, 0x08, 0x05, 0xb2, 0x04, 0x38, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, 0xff, 0xd9]);
  assert.deepEqual(dimensionsImage(jpeg), { largeur: 1080, hauteur: 1458 }, 'trame progressive (SOF2)');
  assert.equal(dimensionsImage(Buffer.from('GIF89a')), null);
  assert.equal(dimensionsImage(Buffer.from([0xff, 0xd8, 0x00])), null, 'JPEG tronqué : rien');
});
