// Repère mécaniquement les notes du Recueil dont le résumé « En bref » est suspect,
// pour n'envoyer à une relecture humaine ou assistée que celles qui en ont besoin.
// Trois signatures, apprises d'un sondage sur 45 articles :
//   1. résumé coupé net, souvent en plein mot ou en pleine énumération ;
//   2. titre H1 fabriqué depuis le nom de fichier, qui n'est pas une phrase ;
//   3. résumé qui recopie la capture au lieu de la synthétiser.
// Le script ne corrige rien : il classe.
import fs from 'node:fs';
import path from 'node:path';

const REC = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines/Recueil législatif SST';
const SORTIE = process.argv.includes('--json');

const notes = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (!/^(98 - Archives|99 - Templates|_À supprimer|📥|\.)/.test(e.name)) walk(p);
    } else if (e.name.startsWith('art-') && e.name.endsWith('.md')) notes.push(p);
  }
})(REC);

function bloc(t, titre) {
  const i = t.indexOf(titre);
  if (i < 0) return '';
  const lignes = t.slice(i).split('\n');
  const out = [];
  for (let k = 1; k < lignes.length; k++) {
    if (!/^>/.test(lignes[k])) break;
    out.push(lignes[k].replace(/^>\s?/, ''));
  }
  return out.join('\n').trim();
}

const res = [];
for (const f of notes) {
  const t = fs.readFileSync(f, 'utf8');
  const base = path.basename(f, '.md');
  const enBref = bloc(t, '[!abstract] En bref');
  const h1 = (t.match(/^# (.+)$/m) || [])[1] || '';
  const aCapture = /!\[\[[^\]]*\.png/i.test(t);
  const defauts = [];

  if (!enBref) defauts.push('sans-resume');
  else {
    // 1. coupé net : une puce qui se termine sans ponctuation forte, ou une phrase
    // dont le dernier mot précède un point isolé après un fragment très court
    for (const l of enBref.split('\n')) {
      const s = l.replace(/^[-*]\s*/, '').trim();
      if (!s) continue;
      if (/\((?:[^)]*)$/.test(s)) { defauts.push('parenthese-ouverte'); break; }
      if (/\b(sous réserve|à savoir|notamment|dont|soit|par exemple|comprend|inclut|vise)\s*\.$/i.test(s)) { defauts.push('coupe-net'); break; }
      if (/:\s*\w+\s*\.$/.test(s) && s.length < 60) { defauts.push('enumeration-amputee'); break; }
      if (/\*\*[^*]*$/.test(s)) { defauts.push('gras-non-referme'); break; }
    }
    // 3. transcription : une longue phrase qui reprend la tournure de la loi
    if (/\b(Le présent règlement|Nul ne peut|Il est interdit|Aux fins du présent|doit, dans les)\b/.test(enBref)
      && enBref.length > 400) defauts.push('transcription-probable');
  }

  // 2. titre fabriqué : le H1 reprend le nom de fichier sans en faire une phrase
  const apresDeuxPoints = h1.split(':').slice(1).join(':').trim();
  if (apresDeuxPoints) {
    const mots = apresDeuxPoints.split(/\s+/);
    const finFaible = /\b(son|sa|ses|le|la|les|du|de|des|un|une|au|aux|et|ou|qui|que|dans|pour|sur|par)$/i.test(apresDeuxPoints);
    if (finFaible) defauts.push('titre-tronque');
    else if (mots.length >= 3 && !/[a-zà-ÿ]/.test(apresDeuxPoints.replace(/[A-Z]/g, ''))) defauts.push('titre-sigle');
  }

  if (defauts.length) res.push({ f: f.split(path.sep).join('/'), base, h1, aCapture, defauts });
}

if (SORTIE) {
  const dest = 'C:/Users/Frank/AppData/Local/Temp/claude/C--Users-Frank-Claude-code/0d2c4633-c3c2-4e53-bca8-68f39f006a6c/scratchpad/recueil-suspects.json';
  res.forEach((r, i) => { r.lot = Math.floor(i / 10); });
  fs.writeFileSync(dest, JSON.stringify(res, null, 1));
  console.log('écrit : ' + dest);
}
const parCode = {};
res.forEach((r) => r.defauts.forEach((d) => { parCode[d] = (parCode[d] || 0) + 1; }));
console.log('notes d\'article examinées : ' + notes.length);
console.log('suspectes : ' + res.length + ' (' + Math.round(res.length / notes.length * 100) + ' %)');
Object.entries(parCode).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log('   ' + String(n).padStart(4) + ' × ' + c));
console.log('sans capture : ' + res.filter((r) => !r.aCapture).length);
