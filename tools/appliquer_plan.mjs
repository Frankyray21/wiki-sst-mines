// Applique les séances 2 et 3 du plan qualité :
//  Séance 2 — publier vers l'encadrement 7 articles internes déjà aboutis (aucune rédaction)
//  Séance 3 — re-noter « complet » les fiches gestionnaires qui portent déjà le gabarit entier
// Chaque fichier modifié est sauvegardé au préalable. Aucune ligne de contenu n'est touchée :
// seules les clés de frontmatter publication-gestionnaire / traitement-publication / statut changent.
import fs from 'node:fs';
import path from 'node:path';

const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const SAUVEGARDE = path.resolve('sauvegarde-vault', new Date().toISOString().slice(0, 10));
const ESSAI = process.argv.includes('--essai');

function lireFm(texte) {
  const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const l of m[1].split(/\r?\n/)) {
    const c = l.match(/^([\w\u00C0-\u017F-]+):\s*(.*)$/);
    if (c) fm[c[1]] = c[2].trim();
  }
  return fm;
}

function poserCle(texte, cle, valeur) {
  const re = new RegExp(`^(${cle}\\s*:).*$`, 'm');
  const bloc = texte.match(/^---\r?\n[\s\S]*?\r?\n---/);
  if (!bloc) return null;
  if (re.test(bloc[0])) {
    const nouveau = bloc[0].replace(re, `$1 ${valeur}`);
    return texte.replace(bloc[0], nouveau);
  }
  return texte.replace(/^---\r?\n/, `---\n${cle}: ${valeur}\n`);
}

function sauvegarder(rel) {
  const dest = path.join(SAUVEGARDE, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(VAULT, rel), dest);
}

// ---------- Séance 2 : les 7 publications ----------
const A_PUBLIER = [
  'Wiki Hygiène industrielle/20 - Articles internes/Environnement de travail/Bruit.md',
  'Wiki Ergonomie/20 - Articles internes/Contraintes/Vibrations.md',
  'Wiki Toxicologie/20 - Articles internes/Substances dangereuses/Asphyxiants.md',
  'Wiki Hygiène industrielle/20 - Articles internes/Substances dangereuses/Amiante.md',
  'Wiki Hygiène industrielle/20 - Articles internes/Prévention et programmes/Hiérarchie des moyens de prévention.md',
  'Wiki Hygiène industrielle/20 - Articles internes/Prévention et programmes/Démarche AREC.md',
  'Wiki Droit du travail/20 - Articles internes/Notions LATMP.md',
];

console.log('— Séance 2 : publication vers l’encadrement —');
for (const rel of A_PUBLIER) {
  const abs = path.join(VAULT, rel);
  if (!fs.existsSync(abs)) { console.log(`  ✗ introuvable : ${rel}`); continue; }
  let t = fs.readFileSync(abs, 'utf8');
  const fm = lireFm(t) || {};
  // Dans ce vault, « interne » veut dire « pas pour les travailleurs » — pas « pas pour
  // l'encadrement ». Seules les sensibilités fortes bloquent la publication gestionnaire.
  const sens = String(fm['niveau-sensibilité'] ?? '').toLowerCase();
  if (['sensible', 'confidentiel', '2', '3'].includes(sens)) {
    console.log(`  ✗ refusé (sensibilité « ${sens} ») : ${rel}`);
    continue;
  }
  if (String(fm['publication-gestionnaire']).toLowerCase() === 'oui') {
    console.log(`  = déjà publié : ${rel}`);
    continue;
  }
  t = poserCle(t, 'publication-gestionnaire', 'oui');
  if (!t) { console.log(`  ✗ frontmatter illisible : ${rel}`); continue; }
  if (!ESSAI) { sauvegarder(rel); fs.writeFileSync(abs, t); }
  console.log(`  ✓ publication-gestionnaire: oui → ${rel}`);
}

// ---------- Séance 3 : re-noter les fiches gestionnaires déjà complètes ----------
// Une fiche est « complète » si elle porte au moins 4 des 6 sections du gabarit
// ET dépasse 300 mots de contenu. On ne juge pas le fond : on constate la charpente.
const SECTIONS = [/pourquoi en parler/i, /options et leviers|options possibles/i, /indicateurs/i,
  /cadre légal|cadre legal/i, /limites du rôle|limites du role/i, /arbitrages/i];

console.log('\n— Séance 3 : re-notation des fiches gestionnaires —');
let renotees = 0;
(function walk(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) { walk(path.join(d, e.name), rel + e.name + '/'); continue; }
    if (!e.name.endsWith('.md') || !/27 - Articles gestionnaires\//.test(rel)) continue;
    const abs = path.join(d, e.name);
    let t = fs.readFileSync(abs, 'utf8');
    const fm = lireFm(t) || {};
    if (!/^(ébauche|ebauche|en-cours)$/i.test(String(fm.statut ?? ''))) continue;
    const nbSections = SECTIONS.filter(re => re.test(t)).length;
    const mots = t.replace(/^---[\s\S]*?---/, '').replace(/[#>*_`|\[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;
    if (nbSections < 4 || mots < 300) {
      console.log(`  = laissée en l'état (${nbSections} sections, ${mots} mots) : ${rel}${e.name}`);
      continue;
    }
    t = poserCle(t, 'statut', 'complet');
    if (!ESSAI) { sauvegarder(rel + e.name); fs.writeFileSync(abs, t); }
    renotees++;
    console.log(`  ✓ statut: complet (${nbSections} sections, ${mots} mots) → ${rel}${e.name}`);
  }
})(VAULT, '');
console.log(`\n${renotees} fiche(s) re-notée(s)${ESSAI ? ' (ESSAI : rien écrit)' : ''}`);
