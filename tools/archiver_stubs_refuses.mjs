// Archive les coquilles que les rédacteurs ont refusé de remplir, avec leur motif.
// Deux cas : la page fait double emploi avec un article existant, ou le vault ne
// dit rien du concept. Dans les deux cas, remplir aurait produit du faux contenu.
// Le motif du relecteur est conservé dans le frontmatter, et une copie est gardée.
//
// Usage : node tools/archiver_stubs_refuses.mjs [--appliquer]
import fs from 'node:fs';
import path from 'node:path';

const JOURNAUX = 'C:/Users/Frank/.claude/projects/C--Users-Frank-Claude-code/0d2c4633-c3c2-4e53-bca8-68f39f006a6c/subagents/workflows';
const ARCH = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines/Wiki SST psychosociale/98 - Archives/_stubs orphelins 2026-09-01';
const SAUV = 'C:/Users/Frank/Claude code/Wiki_SST_Site/sauvegarde-vault/2026-09-02-doublons';
const appliquer = process.argv.includes('--appliquer');

// Quand le relecteur nomme la page qui couvre déjà le sujet, l'ancien nom devient
// un alias : les liens qui visaient la coquille continuent d'aboutir.
const ALIAS = {
  'reconnaissance-professionnelle': 'Reconnaissance au travail',
  'santé mentale en milieu minier': 'Santé-mentale-mines',
  'Isolation-géographique': 'Isolement-géographique',
};

const refus = new Map(); // chemin -> motif
for (const dir of fs.readdirSync(JOURNAUX)) {
  const j = path.join(JOURNAUX, dir, 'journal.jsonl');
  if (!fs.existsSync(j)) continue;
  for (const ligne of fs.readFileSync(j, 'utf8').trim().split(/\r?\n/)) {
    let o; try { o = JSON.parse(ligne); } catch (e) { continue; }
    if (o.type !== 'result') continue;
    // certains agents rendent du texte libre : seuls les résultats structurés nous intéressent
    let r = o.result;
    if (typeof r === 'string') { try { r = JSON.parse(r); } catch (e) { continue; } }
    for (const x of (r && r.resultats) || []) {
      if (x.action === 'archiver' && x.fichier) refus.set(path.resolve(x.fichier), x.raison || '');
    }
  }
}

const estStub = (t) => /Stub créé automatiquement|page vide à documenter/i.test(t);
function chercher(nom) {
  const base = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines/Wiki SST psychosociale';
  const trouve = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!/^98 - Archives/.test(e.name)) walk(p); }
      else if (e.name === nom + '.md') trouve.push(p);
    }
  })(base);
  return trouve[0];
}

let n = 0, sautes = 0;
for (const [f, motif] of refus) {
  if (!fs.existsSync(f)) { sautes++; continue; }
  const t = fs.readFileSync(f, 'utf8');
  if (!estStub(t)) { sautes++; continue; } // déjà remplie ou déjà traitée
  const nom = path.basename(f, '.md');
  const court = String(motif).replace(/\s+/g, ' ').slice(0, 200);
  console.log(`ARCHIVE : ${nom}\n   ${court}`);
  const cible = ALIAS[nom];
  if (cible) {
    const fc = chercher(cible);
    if (fc) {
      console.log(`   alias « ${nom} » -> ${cible}`);
      if (appliquer) {
        let tc = fs.readFileSync(fc, 'utf8');
        const fin = tc.indexOf('\n---', 4);
        if (/^---\r?\n/.test(tc) && fin > 0) {
          let fm = tc.slice(4, fin);
          if (!fm.includes(nom)) {
            fm = /^aliases:/m.test(fm)
              ? fm.replace(/^aliases:.*$/m, (m) => m.trim().endsWith(']') ? m.replace(/\]\s*$/, `, "${nom}"]`) : m + `\n  - "${nom}"`)
              : fm + `\naliases: ["${nom}"]`;
            fs.writeFileSync(fc, '---\n' + fm.replace(/^\n/, '') + tc.slice(fin));
          }
        }
      }
    } else console.log(`   ! page « ${cible} » introuvable, alias non posé`);
  }
  if (appliquer) {
    fs.mkdirSync(ARCH, { recursive: true });
    fs.mkdirSync(SAUV, { recursive: true });
    fs.copyFileSync(f, path.join(SAUV, path.basename(f)));
    const marque = t.replace(/^---\r?\n/, `---\npublish: false\narchive-candidat: true\nmotif-archivage: ${JSON.stringify(court)}\n`);
    fs.writeFileSync(path.join(ARCH, path.basename(f)), marque);
    fs.unlinkSync(f);
  }
  n++;
}
console.log(`\n${appliquer ? 'archivées' : 'à archiver'} : ${n} · déjà traitées : ${sautes}`);
if (!appliquer) console.log('relancer avec --appliquer pour exécuter');
