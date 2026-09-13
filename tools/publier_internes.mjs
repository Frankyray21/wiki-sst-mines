// Ouvre à la publication les notes du vault encore retenues (publish: false ou
// traitement-publication interne-non-publie / interne-strict / a-archiver / archive-confirmee),
// HORS des dossiers « 98 - Archives ». Décision de Frank, 13 septembre 2026 : « tu peux
// publier — tout (les 32) », en connaissance du caractère public du site (questionnaires
// cliniques et sujets sensibles compris).
//
// Seul le frontmatter change, par édition textuelle (ordre, fins de ligne et autres clés
// intacts) : la ligne « publish: false » est retirée, « traitement-publication » passe à
// « publie », et « publication-ouverte-le: 2026-09-13 » garde la trace. Rien d'autre.
//
// Usage : node publier_internes.mjs            (simulation)
//         node publier_internes.mjs --appliquer
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const REPO = path.resolve(__dirname, '..');
const SAUV = path.join(REPO, 'sauvegarde-vault', '2026-09-13-publication');
const JOURNAL = path.join(REPO, 'content-updates', '2026-09-13-publication-internes.json');
const ATTENDU = 32;
const appliquer = process.argv.includes('--appliquer');

const REFUS = new Set(['interne-non-publie', 'interne-strict', 'a-archiver', 'archive-confirmee']);
const EXCLUS = new Set(['.obsidian', '.trash', '99 - Templates', '_À supprimer (vérifier puis effacer)', '📥 PDF à téléverser']);

const notes = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const abs = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (EXCLUS.has(e.name) || e.name === '98 - Archives') continue; walk(abs, r); continue; }
    if (!e.name.endsWith('.md') || !rel) continue;
    const brut = fs.readFileSync(abs, 'utf8');
    const texte = brut.replace(/^\uFEFF/, '');
    const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) continue;
    let fm = {};
    try { fm = yaml.load(m[1]) || {}; } catch { continue; }
    const tp = String(fm['traitement-publication'] ?? '').trim().toLowerCase();
    if (fm.publish === false || REFUS.has(tp)) notes.push({ rel: r.replace(/\\/g, '/'), abs, motif: fm.publish === false ? 'publish: false' : tp });
  }
})(VAULT, '');

console.log(`${appliquer ? 'Mode : appliquer' : 'Mode : simulation'} — ${notes.length} note(s) retenue(s) hors archives (attendu ${ATTENDU})`);
if (notes.length !== ATTENDU && !process.argv.includes('--force')) {
  console.error('Compte inattendu : vérifier la liste avant d\'appliquer (--force pour passer outre).');
  process.exit(1);
}

const journal = [];
for (const n of notes) {
  const brut = fs.readFileSync(n.abs, 'utf8');
  const bom = brut.charCodeAt(0) === 0xFEFF ? '\uFEFF' : '';
  const texte = brut.slice(bom.length);
  const nl = texte.includes('\r\n') ? '\r\n' : '\n';
  const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const lignes = m[1].split(/\r?\n/);
  const modifs = [];
  const gardees = [];
  for (const l of lignes) {
    if (/^publish\s*:\s*false\s*$/.test(l)) { modifs.push('publish: false retiré'); continue; }
    const tpm = l.match(/^(traitement-publication\s*:\s*)(.+?)\s*$/);
    if (tpm && REFUS.has(tpm[2].trim().toLowerCase().replace(/^['"]|['"]$/g, ''))) {
      gardees.push('traitement-publication: publie');
      modifs.push(`traitement-publication: ${tpm[2].trim()} -> publie`);
      continue;
    }
    gardees.push(l);
  }
  if (!gardees.some(l => /^publication-ouverte-le\s*:/.test(l))) gardees.push('publication-ouverte-le: 2026-09-13');
  const nouveau = bom + '---' + nl + gardees.join(nl) + nl + '---' + nl + texte.slice(m[0].length);
  console.log(`  ${n.rel}\n    ${modifs.join(' ; ')}`);
  journal.push({ note: n.rel, motifAvant: n.motif, modifications: modifs });
  if (appliquer) {
    const sauv = path.join(SAUV, n.rel);
    fs.mkdirSync(path.dirname(sauv), { recursive: true });
    fs.copyFileSync(n.abs, sauv);
    fs.writeFileSync(n.abs, nouveau, 'utf8');
  }
}

if (appliquer) {
  fs.writeFileSync(JOURNAL, JSON.stringify({ date: '2026-09-13', decision: 'Frank : « tu peux publier — tout (les 32) », site public assumé', sauvegarde: 'sauvegarde-vault/2026-09-13-publication (locale, non versionnée)', notes: journal }, null, 1), 'utf8');
  console.log(`\n✅ ${journal.length} note(s) ouverte(s) à la publication. Journal : ${JOURNAL}`);
} else {
  console.log('\nRelancer avec --appliquer pour exécuter.');
}
