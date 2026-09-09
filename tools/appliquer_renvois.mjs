// Pose dans le vault les renvois tranchés vers les notes d'analyse universitaires
// (content-updates/2026-09-09-renvois-sources.json).
//
// Pour chaque renvoi non écarté : retrouve la note de la fiche (même chemin de sortie que le
// générateur), retrouve la note d'analyse (même slug que le site), cherche l'ancrage mot à
// mot dans le markdown (en ignorant gras, italique et wikilinks), pose un appel « [n](#ref-…) »
// juste après l'ancrage et ajoute la ligne dans une section « ## Références ». Aucun autre
// texte n'est écrit. Un ancrage introuvable est signalé et laissé à la main.
//
// Usage : node tools/appliquer_renvois.mjs [--appliquer] [--vault <chemin>] [--fichier <json>]
//         Sans --appliquer : essai, rien n'est écrit. Chaque note modifiée est sauvegardée avant.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const VAULT = opt('--vault', 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines');
const FICHIER = opt('--fichier', path.resolve(__dirname, '../content-updates/2026-09-09-renvois-sources.json'));
const APPLIQUER = args.includes('--appliquer');
const SAUVEGARDE = path.resolve(process.cwd(), 'sauvegarde-vault', new Date().toISOString().slice(0, 10) + '-renvois');

// Même correspondance dossier → slug que build_site.mjs, même slugify : le chemin de sortie
// d'une note se recalcule à l'identique, donc « w/ergonomie/…/manutention.html » retrouve sa note.
const WIKIS = { 'Wiki Ergonomie': 'ergonomie', 'Wiki Hygiène industrielle': 'hygiene', 'Wiki Toxicologie': 'toxicologie', 'Wiki Sécurité industrielle': 'securite', 'Wiki Droit du travail': 'droit-travail', 'Wiki SST psychosociale': 'psychosocial', 'Recueil législatif SST': 'legislation' };
const EXCLUS = new Set(['.obsidian', '.trash', '99 - Templates', '_À supprimer (vérifier puis effacer)', '📥 PDF à téléverser']);
export function slugify(s) {
  return String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/['’]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'page';
}

export function inventaire(vault) {
  const parSortie = new Map(), parSlug = new Map();
  (function walk(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      if (e.isDirectory()) { if (!EXCLUS.has(e.name)) walk(path.join(dir, e.name), rel ? rel + '/' + e.name : e.name); continue; }
      if (!e.name.endsWith('.md') || !rel) continue;
      const relPath = rel + '/' + e.name;
      const parts = relPath.slice(0, -3).split('/');
      const slug = WIKIS[parts[0]];
      if (!slug) continue;
      const abs = path.join(dir, e.name);
      const base = e.name.slice(0, -3);
      parSortie.set('w/' + slug + '/' + parts.slice(1).map(slugify).join('/') + '.html', abs);
      if (!parSlug.has(slugify(base))) parSlug.set(slugify(base), { abs, base });
    }
  })(vault, '');
  return { parSortie, parSlug };
}

// Texte « plat » du markdown avec, pour chaque caractère, sa position dans l'original :
// on cherche l'ancrage dans le plat, on insère dans l'original.
export function aplatir(md) {
  const plat = [], pos = [];
  let i = 0;
  const pousser = (ch, p) => { plat.push(ch); pos.push(p); };
  while (i < md.length) {
    if (md.startsWith('[[', i)) {
      const fin = md.indexOf(']]', i);
      if (fin > 0) {
        const inner = md.slice(i + 2, fin);
        const pipe = inner.lastIndexOf('|');
        const label = pipe >= 0 ? inner.slice(pipe + 1) : inner.split('#')[0];
        for (const ch of label) pousser(ch, fin + 2 - 1);   // tout le lien compte comme un bloc : insertion après « ]] »
        i = fin + 2; continue;
      }
    }
    if (md[i] === '[' ) {                                    // [texte](url) → texte
      const fermant = md.indexOf('](', i);
      const finUrl = fermant > 0 ? md.indexOf(')', fermant) : -1;
      if (fermant > 0 && finUrl > 0 && !md.slice(i, fermant).includes('\n')) {
        for (let k = i + 1; k < fermant; k++) pousser(md[k], finUrl);
        i = finUrl + 1; continue;
      }
    }
    if (md.startsWith('**', i) || md.startsWith('__', i) || md.startsWith('==', i)) { i += 2; continue; }
    if ((md[i] === '*' || md[i] === '_') && /\S/.test(md[i + 1] || '') && /\S/.test(md[i - 1] || ' ') === false) { i++; continue; }
    if (md[i] === '*' || md[i] === '_') { i++; continue; }
    pousser(md[i], i);
    i++;
  }
  return { plat: plat.join(''), pos };
}
const normaliser = (s) => String(s).replace(/[’]/g, "'").replace(/[«»]/g, '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

// Position d'insertion dans l'original juste après l'ancrage (après un « ** » fermant s'il y en a un).
export function localiser(md, ancrage, occurrence = 1) {
  const { plat, pos } = aplatir(md);
  const cible = normaliser(ancrage);
  const platN = plat.replace(/[’]/g, "'").replace(/[«»]/g, ' ').replace(/\u00a0/g, ' ').toLowerCase();
  // Recherche tolérante aux espaces multiples : on compare sur une version compactée en gardant l'index.
  const compact = [], idx = [];
  for (let k = 0; k < platN.length; k++) {
    const ch = platN[k];
    if (/\s/.test(ch)) { if (compact.length && compact[compact.length - 1] !== ' ') { compact.push(' '); idx.push(k); } }
    else { compact.push(ch); idx.push(k); }
  }
  const s = compact.join('');
  let at = -1;
  for (let k = 0; k < occurrence; k++) { at = s.indexOf(cible, at + 1); if (at < 0) return -1; }
  const finPlat = idx[at + cible.length - 1];
  let fin = pos[finPlat] + 1;
  while (md.startsWith('**', fin) || md.startsWith('__', fin) || md.startsWith('==', fin)) fin += 2;
  if (md[fin] === '*' || md[fin] === '_') fin += 1;
  return fin;
}

export function poserRenvois(md, renvois, prefixe) {
  // renvois : [{ ancrage, ligne }] ; retourne { md, poses, manques }
  const existants = [...md.matchAll(/id="ref-([a-z0-9]+)-(\d+)"/g)];
  let n = existants.length ? Math.max(...existants.map(m => +m[2])) : 0;
  const pfx = existants.length ? existants[0][1] : prefixe;
  const poses = [], manques = [];
  const insertions = [];
  for (const r of renvois) {
    const fin = localiser(md, r.ancrage, r.occurrence || 1);
    if (fin < 0) { manques.push(r); continue; }
    insertions.push({ fin, r, contexte: aplatir(md.slice(Math.max(0, fin - 90), fin)).plat.replace(/\s+/g, ' ').trim() });
  }
  // Numérotés dans l'ordre du texte ; insérés de la fin vers le début pour ne pas décaler les positions.
  insertions.sort((a, b) => a.fin - b.fin).forEach(ins => { ins.num = ++n; });
  for (const ins of [...insertions].sort((a, b) => b.fin - a.fin || b.num - a.num)) {
    md = md.slice(0, ins.fin) + ` [${ins.num}](#ref-${pfx}-${ins.num})` + md.slice(ins.fin);
    poses.push({ ...ins.r, num: ins.num, contexte: ins.contexte });
  }
  if (poses.length) {
    const lignes = poses.sort((a, b) => a.num - b.num).map(p => `${p.num}. <span id="ref-${pfx}-${p.num}"></span>${p.ligne}`).join('\n');
    const titre = md.match(/^##+ +Références[^\n]*$/m);
    if (titre) {
      // Ajouter à la fin de la liste existante de cette section.
      const debut = titre.index + titre[0].length;
      const suite = md.slice(debut).match(/\n(?=\n*##? |\n*\[\[00 - )/);
      const fin = suite ? debut + suite.index : md.length;
      const bloc = md.slice(debut, fin).replace(/\s+$/, '');
      md = md.slice(0, debut) + bloc + '\n' + lignes + (suite ? md.slice(fin) : '\n');
    } else {
      const pied = md.match(/\n\[\[00 - [^\n]*Accueil[^\n]*\]\]\s*$/);
      const section = `\n## Références\n\n${lignes}\n`;
      md = pied ? md.slice(0, pied.index).replace(/\s*$/, '\n') + section + md.slice(pied.index) : md.replace(/\s*$/, '\n') + section;
    }
  }
  return { md, poses, manques };
}

// Ligne de bibliographie : le « Auteur (année) » de tête — « (2022, INSPQ) », « (dir., 1996) » — devient un lien vers la note d'analyse.
export function ligneAvecLien(ligne, base) {
  const m = ligne.match(/^(.*?\([^)]*\d{4}[^)]*\))/);
  return m ? `[[${base}|${m[1]}]]${ligne.slice(m[1].length)}` : `[[${base}]] — ${ligne}`;
}

export function preparer(paquet, inv) {
  const parNote = new Map();
  const absents = [];
  for (const r of paquet.renvois) {
    if (r.verdict === 'ecarter') continue;
    const note = inv.parSortie.get(r.fiche);
    const source = inv.parSlug.get(r.source);
    if (!note) { absents.push({ ...r, cause: 'note de la fiche introuvable' }); continue; }
    if (!source) { absents.push({ ...r, cause: 'note d’analyse introuvable' }); continue; }
    if (!parNote.has(note)) parNote.set(note, []);
    parNote.get(note).push({ ancrage: r.ancrageFinal || r.ancrage, occurrence: r.occurrence, ligne: ligneAvecLien(r.ligneFinale || r.ligneBibliographie, source.base), verdict: r.verdict, titreFiche: r.titreFiche, source: r.source });
  }
  return { parNote, absents };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const paquet = JSON.parse(fs.readFileSync(FICHIER, 'utf8'));
  if (!fs.existsSync(VAULT)) { console.error('Vault introuvable : ' + VAULT); process.exit(1); }
  const inv = inventaire(VAULT);
  const { parNote, absents } = preparer(paquet, inv);
  let totalPoses = 0, totalManques = 0;
  for (const [abs, renvois] of parNote) {
    const md = fs.readFileSync(abs, 'utf8');
    const { md: nouveau, poses, manques } = poserRenvois(md, renvois, 'uni');
    console.log(`\n${path.relative(VAULT, abs)} — ${poses.length} posé(s), ${manques.length} introuvable(s)`);
    for (const p of poses) console.log(`  ✓ [${p.num}] ${p.verdict} « ${p.ancrage.slice(0, 70)} » ← ${p.source}\n      …${p.contexte.slice(-80)}|`);
    for (const m of manques) console.log(`  ✗ ancrage introuvable : « ${m.ancrage.slice(0, 70)} » ← ${m.source}`);
    totalPoses += poses.length; totalManques += manques.length;
    if (APPLIQUER && poses.length) {
      const dest = path.join(SAUVEGARDE, path.relative(VAULT, abs));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(abs, dest);
      fs.writeFileSync(abs, nouveau);
    }
  }
  for (const a of absents) console.log(`\n✗ ${a.cause} : ${a.titreFiche} ← ${a.source}`);
  console.log(`\n${totalPoses} renvoi(s) posé(s), ${totalManques} ancrage(s) à poser à la main, ${absents.length} note(s) introuvable(s)${APPLIQUER ? ` — sauvegardes dans ${SAUVEGARDE}` : ' — ESSAI : rien n’a été écrit, relancer avec --appliquer'}`);
}
