// Registre des articles déjà contrôlés contre leur capture.
// Le champ « révision » ne suffit pas : une note jugée conforme n'est pas modifiée,
// donc sa date ne bouge pas et elle revenait sans fin dans les lots à traiter.
// On lit donc les verdicts rendus par les relecteurs et on tient une liste.
import fs from 'node:fs';
import path from 'node:path';

const JOURNAUX = 'C:/Users/Frank/.claude/projects/C--Users-Frank-Claude-code/0d2c4633-c3c2-4e53-bca8-68f39f006a6c/subagents/workflows';
const REGISTRE = 'C:/Users/Frank/Claude code/Wiki_SST_Site/tools/recueil-verifies.json';
const REC = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines/Recueil législatif SST';

// index des noms d'article présents, pour rattacher un verdict à un fichier réel
const parNom = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(98 - Archives|99 - Templates|_À supprimer|📥|\.)/.test(e.name)) walk(p); continue; }
    if (!e.name.startsWith('art-') || !e.name.endsWith('.md')) continue;
    const base = path.basename(e.name, '.md');
    // « art-51-LSST, obligations employeur » -> clé « art-51-lsst »
    const cle = base.split(',')[0].trim().toLowerCase();
    if (!parNom.has(cle)) parNom.set(cle, []);
    parNom.get(cle).push(p.split(path.sep).join('/'));
  }
})(REC);

const vus = new Set();
if (fs.existsSync(REGISTRE)) for (const f of JSON.parse(fs.readFileSync(REGISTRE, 'utf8'))) vus.add(f);
const avant = vus.size;

for (const dir of fs.readdirSync(JOURNAUX)) {
  const j = path.join(JOURNAUX, dir, 'journal.jsonl');
  if (!fs.existsSync(j)) continue;
  for (const ligne of fs.readFileSync(j, 'utf8').trim().split(/\r?\n/)) {
    let o; try { o = JSON.parse(ligne); } catch (e) { continue; }
    if (o.type !== 'result') continue;
    let r = o.result;
    if (typeof r === 'string') { try { r = JSON.parse(r); } catch (e) { continue; } }
    for (const x of (r && r.resultats) || []) {
      if (!x.verdict || !x.article) continue;
      if (x.verdict === 'sans-capture') continue;      // rien n'a pu être contrôlé
      // le relecteur nomme l'article de plusieurs façons : on isole « art-N-SIGLE »
      const m = String(x.article).match(/art[-. ]?([\dA-Za-z.]+)[-. ]?(LSST|LATMP|LMRSST|LNT|RSST|RSSM|CSTC)/i);
      if (!m) continue;
      const cle = ('art-' + m[1].replace(/[-. ]+$/, '') + '-' + m[2]).toLowerCase();
      for (const f of parNom.get(cle) || []) vus.add(f);
    }
  }
}
fs.writeFileSync(REGISTRE, JSON.stringify([...vus].sort(), null, 1));
console.log('registre : ' + vus.size + ' articles contrôlés (' + (vus.size - avant) + ' ajoutés)');
