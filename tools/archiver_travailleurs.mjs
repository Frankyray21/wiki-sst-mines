// Archive les dossiers « 24/25/26 - … » (fiches travailleurs) des six wikis thématiques
// dans « 98 - Archives » de chaque wiki, avec sauvegarde datée et journal versionné.
// Décision de Frank, 12 septembre 2026 : le wiki des travailleurs est abandonné.
//
// Usage : node archiver_travailleurs.mjs            (simulation, ne touche rien)
//         node archiver_travailleurs.mjs --appliquer (déplace réellement, écrit le journal)
//         node archiver_travailleurs.mjs --annuler   (relit le journal, restaure depuis la sauvegarde)
//
// Modèle : tools/archiver_stubs_refuses.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const REPO = path.resolve(__dirname, '..');
const SAUV = path.join(REPO, 'sauvegarde-vault', '2026-09-12-travailleurs');
const JOURNAL = path.join(REPO, 'content-updates', '2026-09-12-archivage-travailleurs.json');
const EQUIVALENTS = path.join(REPO, 'plans', '2026-09-12-annexes', 'equivalents-travailleurs.json');

const SIX_WIKIS = [
  'Wiki Ergonomie', 'Wiki Hygiène industrielle', 'Wiki Toxicologie',
  'Wiki Sécurité industrielle', 'Wiki Droit du travail', 'Wiki SST psychosociale',
];
const DOSSIERS = [
  '24 - Références internes pages travailleurs',
  '25 - Articles travailleurs',
  '26 - Brouillons travailleurs',
];

const MOTIF = 'Wiki des travailleurs abandonne le 12 septembre 2026 ; la notion vit dans l article principal, voir version-jumelle.';
const DATE = '2026-09-12';

const mode = process.argv[2] === '--appliquer' ? 'appliquer' : process.argv[2] === '--annuler' ? 'annuler' : 'simulation';

function listerMd(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
      else out.push({ nonMd: p });
    }
  })(dir);
  return out;
}

function chargerEquivalents() {
  if (!fs.existsSync(EQUIVALENTS)) return new Map();
  const data = JSON.parse(fs.readFileSync(EQUIVALENTS, 'utf8'));
  const m = new Map();
  for (const e of data) {
    if (e.confiance !== 'élevée') continue;
    const premier = String(e.equivalent || '').split(';')[0].trim();
    if (!premier || /^\(page de navigation/i.test(premier)) continue;
    const base = premier.split('/').pop().trim();
    if (!base) continue;
    // clé : "<wiki>::<fiche relative avec / et sans .md>"
    m.set(e.wiki + '::' + e.fiche.replace(/\.md$/, ''), base);
  }
  return m;
}

function retirerBOM(t) {
  return t.charCodeAt(0) === 0xFEFF ? t.slice(1) : t;
}

// Insère/modifie des clés dans le bloc frontmatter YAML sans re-sérialiser (préserve
// l'ordre, les commentaires, les fins de ligne). ajouts = [{cle, valeur}] posés seulement
// si la clé est absente.
function patcherFrontmatter(texte, { publishFalse, ajouts }) {
  const nl = texte.includes('\r\n') ? '\r\n' : '\n';
  const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  let bloc, avant, apres;
  if (m) {
    bloc = m[1];
    avant = '';
    apres = texte.slice(m[0].length);
  } else {
    // pas de frontmatter : en créer un vide
    bloc = '';
    avant = '';
    apres = texte;
  }
  const lignes = bloc.length ? bloc.split(/\r?\n/) : [];

  if (publishFalse) {
    const i = lignes.findIndex(l => /^publish\s*:/.test(l));
    if (i >= 0) lignes[i] = 'publish: false';
    else lignes.unshift('publish: false');
  }
  for (const { cle, valeur } of ajouts) {
    const re = new RegExp('^' + cle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:');
    if (!lignes.some(l => re.test(l))) lignes.push(`${cle}: ${valeur}`);
  }
  const nouveauBloc = '---' + nl + lignes.join(nl) + nl + '---' + nl;
  return avant + nouveauBloc + apres;
}

function dejaPublishFalse(texte) {
  const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return false;
  return /^publish\s*:\s*false\s*$/m.test(m[1]);
}

function aVersionJumelle(texte) {
  const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return false;
  return /^version-jumelle\s*:/m.test(m[1]);
}

function main() {
  if (mode === 'annuler') return annuler();

  const equivalents = chargerEquivalents();
  const plan = []; // {wiki, dossier, ancien, nouveau, nbMd, publishAvant:[], versionJumelleAjoutee:[]}
  let totalMd = 0;
  const nonMdSignales = [];

  for (const wiki of SIX_WIKIS) {
    for (const dossier of DOSSIERS) {
      const src = path.join(VAULT, wiki, dossier);
      if (!fs.existsSync(src)) continue;
      const entrees = listerMd(src);
      const mds = entrees.filter(e => typeof e === 'string');
      const nonMd = entrees.filter(e => e && e.nonMd).map(e => e.nonMd);
      if (nonMd.length) nonMdSignales.push(...nonMd);
      totalMd += mds.length;
      plan.push({ wiki, dossier, src, dest: path.join(VAULT, wiki, '98 - Archives', dossier), mds });
    }
  }

  console.log(`Mode : ${mode}`);
  console.log(`Dossiers trouvés : ${plan.length} (attendu 13)`);
  console.log(`Notes .md trouvées : ${totalMd} (attendu 112)`);
  const parWiki = {};
  for (const p of plan) parWiki[p.wiki] = (parWiki[p.wiki] || 0) + p.mds.length;
  for (const [w, n] of Object.entries(parWiki)) console.log(`  ${w} : ${n}`);
  if (nonMdSignales.length) {
    console.log(`⚠ ${nonMdSignales.length} fichier(s) non .md dans ces dossiers (non déplacés) :`);
    nonMdSignales.forEach(f => console.log('  ' + f));
  }

  if (mode === 'simulation') {
    console.log('\n--- Simulation : aperçu des 10 premiers chemins ---');
    let shown = 0;
    for (const p of plan) {
      for (const md of p.mds) {
        if (shown++ >= 10) break;
        console.log(`  ${md} -> ${path.join(p.dest, path.relative(p.src, md))}`);
      }
    }
    console.log('\nRelancer avec --appliquer pour exécuter.');
    return;
  }

  // --appliquer
  fs.mkdirSync(SAUV, { recursive: true });
  fs.mkdirSync(path.dirname(JOURNAL), { recursive: true });
  const journal = [];

  for (const p of plan) {
    // (a) sauvegarde intégrale
    const sauvDest = path.join(SAUV, p.wiki, p.dossier);
    fs.mkdirSync(path.dirname(sauvDest), { recursive: true });
    fs.cpSync(p.src, sauvDest, { recursive: true });

    // (b) déplacement
    const archivesDir = path.join(VAULT, p.wiki, '98 - Archives');
    fs.mkdirSync(archivesDir, { recursive: true });
    if (fs.existsSync(p.dest)) {
      throw new Error(`Destination existe déjà, arrêt : ${p.dest}`);
    }
    try {
      fs.renameSync(p.src, p.dest);
    } catch (e) {
      if (e.code === 'EXDEV') {
        fs.cpSync(p.src, p.dest, { recursive: true });
        fs.rmSync(p.src, { recursive: true, force: true });
      } else throw e;
    }

    // (c) frontmatter de chaque .md déplacé
    for (const ancienChemin of p.mds) {
      const relDansDossier = path.relative(p.src, ancienChemin);
      const nouveauChemin = path.join(p.dest, relDansDossier);
      const brut = fs.readFileSync(nouveauChemin, 'utf8');
      const texte = retirerBOM(brut);
      const cheminOrigine = path.relative(VAULT, ancienChemin).replace(/\\/g, '/').replace(/\.md$/, '');
      const publishAvant = dejaPublishFalse(texte);
      const avaitJumelle = aVersionJumelle(texte);

      const ajouts = [
        { cle: 'chemin-origine', valeur: `"${cheminOrigine}"` },
        { cle: 'archive-date', valeur: DATE },
        { cle: 'motif-archivage', valeur: `"${MOTIF}"` },
      ];
      let jumelleAjoutee = null;
      if (!avaitJumelle) {
        // la clé de equivalents-travailleurs.json inclut le dossier (« 25 - Articles
        // travailleurs/Chaleur.md »), pas seulement le chemin relatif à l'intérieur
        const cle = p.wiki + '::' + (p.dossier + '/' + relDansDossier).replace(/\\/g, '/').replace(/\.md$/, '');
        const eq = equivalents.get(cle);
        if (eq) {
          ajouts.push({ cle: 'version-jumelle', valeur: `"[[${eq}]]"` });
          jumelleAjoutee = eq;
        }
      }

      const nouveauTexte = patcherFrontmatter(texte, { publishFalse: !publishAvant, ajouts });
      fs.writeFileSync(nouveauChemin, nouveauTexte, 'utf8');

      journal.push({
        wiki: p.wiki,
        ancien: path.relative(VAULT, ancienChemin).replace(/\\/g, '/'),
        nouveau: path.relative(VAULT, nouveauChemin).replace(/\\/g, '/'),
        publishAvant,
        versionJumelleAjoutee: jumelleAjoutee,
        avaitDejaJumelle: avaitJumelle,
      });
    }
  }

  fs.writeFileSync(JOURNAL, JSON.stringify(journal, null, 1), 'utf8');
  console.log(`\n✅ Archivage appliqué : ${journal.length} notes déplacées et re-frontmattées.`);
  console.log(`Journal : ${JOURNAL}`);
  console.log(`Sauvegarde : ${SAUV}`);
  const dejaFalse = journal.filter(j => j.publishAvant).length;
  const jumellesAjoutees = journal.filter(j => j.versionJumelleAjoutee).length;
  console.log(`  déjà publish:false avant : ${dejaFalse}`);
  console.log(`  version-jumelle ajoutée (confiance élevée) : ${jumellesAjoutees}`);

  // note à Frank : ligne d'avertissement en tête, sans toucher au reste
  const brouillons = path.join(VAULT, 'Brouillons travailleurs à valider.md');
  if (fs.existsSync(brouillons)) {
    const t = retirerBOM(fs.readFileSync(brouillons, 'utf8'));
    const marque = 'Archivé le 12 septembre 2026 : le wiki des travailleurs est abandonné, les fiches sont dans 98 - Archives de chaque wiki.';
    if (!t.includes(marque)) {
      const m = t.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
      const insertion = marque + '\n\n';
      const nouveau = m ? t.slice(0, m[0].length) + insertion + t.slice(m[0].length) : insertion + t;
      fs.writeFileSync(brouillons, nouveau, 'utf8');
      console.log('Note « Brouillons travailleurs à valider.md » : ligne d\u2019avertissement ajoutée.');
    }
  }
}

function annuler() {
  if (!fs.existsSync(JOURNAL)) {
    console.log('Aucun journal trouvé, rien à annuler :', JOURNAL);
    return;
  }
  const journal = JSON.parse(fs.readFileSync(JOURNAL, 'utf8'));
  let restaures = 0;
  for (const entree of journal) {
    const sauvSrc = path.join(SAUV, entree.ancien);
    const dest = path.join(VAULT, entree.ancien);
    const actuel = path.join(VAULT, entree.nouveau);
    if (!fs.existsSync(sauvSrc)) {
      console.log('⚠ sauvegarde absente, ignoré :', entree.ancien);
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(sauvSrc, dest);
    if (fs.existsSync(actuel) && path.resolve(actuel) !== path.resolve(dest)) {
      fs.rmSync(actuel, { force: true });
    }
    restaures++;
  }
  // retirer les dossiers 98 - Archives/2x devenus vides (récursif : les sous-dossiers
  // thématiques restent vides après le retrait des fichiers)
  function rmVide(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) rmVide(path.join(d, e.name));
    }
    if (fs.readdirSync(d).length === 0) fs.rmdirSync(d);
  }
  for (const wiki of SIX_WIKIS) {
    for (const dossier of DOSSIERS) {
      rmVide(path.join(VAULT, wiki, '98 - Archives', dossier));
    }
  }
  console.log(`✅ Annulation : ${restaures} notes restaurées depuis la sauvegarde.`);
}

main();
