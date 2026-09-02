// Fusionne les pages qui désignent le même concept sous deux noms : la forme
// technique héritée des coquilles automatiques (« modèle-ERI », « job-strain »)
// et le titre rédigé (« Modèle ERI », « Job strain »). La page la plus fournie
// est conservée ; l'autre nom devient un alias, pour que les liens existants
// continuent de résoudre. Le fichier retiré est sauvegardé, jamais perdu.
//
// Usage : node tools/fusionner_doublons.mjs [--appliquer] [--sauf-lots 3,4,5]
import fs from 'node:fs';
import path from 'node:path';

const WIKI = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines/Wiki SST psychosociale';
const SAUV = 'C:/Users/Frank/Claude code/Wiki_SST_Site/sauvegarde-vault/2026-09-02-doublons';
const LOTS_JSON = 'C:/Users/Frank/AppData/Local/Temp/claude/C--Users-Frank-Claude-code/0d2c4633-c3c2-4e53-bca8-68f39f006a6c/scratchpad/stubs-lots8.json';

const appliquer = process.argv.includes('--appliquer');
const iSauf = process.argv.indexOf('--sauf-lots');
const lotsExclus = iSauf > 0 ? new Set(process.argv[iSauf + 1].split(',').map(Number)) : new Set();

// fichiers appartenant à un lot encore en cours : on n'y touche pas
const enCours = new Set();
if (lotsExclus.size && fs.existsSync(LOTS_JSON)) {
  for (const r of JSON.parse(fs.readFileSync(LOTS_JSON, 'utf8'))) {
    if (lotsExclus.has(r.lot)) enCours.add(path.resolve(r.f).toLowerCase());
  }
}

const fichiers = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(98 - Archives|99 - Templates)/.test(e.name)) walk(p); }
    else if (e.name.endsWith('.md')) fichiers.push(p);
  }
})(WIKI);

const VIDES = /\b(au|du|de|des|la|le|les|en|et|d|l|dans|sur|un|une)\b/g;
const cle = (s) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, ' ').replace(VIDES, ' ')
  .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean).sort().join(' ');

// Une « forme technique » : mots collés par des traits d'union, ou tout en minuscules
// alors que l'autre page porte une majuscule. Ces noms viennent des coquilles.
const estForme = (base) => /[a-zà-ÿ]-[a-zà-ÿ]/i.test(base) || base === base.toLowerCase();

const groupes = new Map();
for (const f of fichiers) {
  const base = path.basename(f, '.md');
  const k = cle(base);
  if (!k) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (!groupes.has(k)) groupes.set(k, []);
  groupes.get(k).push({ f, base, t, mots: t.split(/\s+/).length, dossier: path.dirname(f) });
}

let fusions = 0, ignores = 0;
for (const [, g] of groupes) {
  if (g.length < 2) continue;
  // Les pages-index de dossier (« X/X.md ») sont une convention du vault, pas un doublon.
  const vrais = g.filter((x) => path.basename(x.dossier) !== x.base);
  if (vrais.length < 2) continue;
  vrais.sort((a, b) => b.mots - a.mots);
  const garde = vrais[0];
  for (const perdant of vrais.slice(1)) {
    // on ne fusionne que la forme technique dans le titre rédigé : deux titres
    // rédigés peuvent traiter le même sujet sous deux angles, c'est à Frank de trancher
    if (!estForme(perdant.base)) { ignores++; console.log('IGNORÉ (deux titres rédigés) :', perdant.base, 'vs', garde.base); continue; }
    if (enCours.has(path.resolve(perdant.f).toLowerCase()) || enCours.has(path.resolve(garde.f).toLowerCase())) {
      console.log('REPORTÉ (lot en cours) :', perdant.base); continue;
    }
    console.log(`FUSION : « ${perdant.base} » (${perdant.mots} mots) -> « ${garde.base} » (${garde.mots} mots)`);
    if (!appliquer) { fusions++; continue; }
    // 1. l'ancien nom devient un alias de la page conservée
    let t = garde.t;
    const fin = t.indexOf('\n---', 4);
    if (!/^---\r?\n/.test(t) || fin < 0) { console.log('  ! frontmatter illisible, fusion abandonnée'); continue; }
    let fm = t.slice(4, fin), corps = t.slice(fin);
    if (!fm.includes(perdant.base)) {
      if (/^aliases:/m.test(fm)) {
        fm = fm.replace(/^aliases:.*$/m, (m) => m.trim().endsWith(']')
          ? m.replace(/\]\s*$/, `, "${perdant.base}"]`)
          : m + `\n  - "${perdant.base}"`);
      } else {
        fm += `\naliases: ["${perdant.base}"]`;
      }
    }
    garde.t = '---\n' + fm.replace(/^\n/, '') + corps;
    fs.writeFileSync(garde.f, garde.t);
    // 2. la page retirée est sauvegardée puis supprimée
    fs.mkdirSync(SAUV, { recursive: true });
    fs.copyFileSync(perdant.f, path.join(SAUV, path.basename(perdant.f)));
    fs.unlinkSync(perdant.f);
    fusions++;
  }
}
console.log(`\n${appliquer ? 'fusions appliquées' : 'fusions possibles'} : ${fusions}${ignores ? ` · ignorées (deux titres rédigés) : ${ignores}` : ''}`);
if (!appliquer) console.log('relancer avec --appliquer pour exécuter');
