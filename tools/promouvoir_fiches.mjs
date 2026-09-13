// Promotion de fiches archivées en notions publiées (décision de Frank, 13 septembre 2026,
// point 1, 2 et 7 du bilan du chantier « wiki par notion »). Chaque fiche revient de
// « 98 - Archives » vers un dossier de notions de son wiki ; seules les clés de frontmatter
// posées par l'archivage sont retirées (publish: false, chemin-origine, archive-date,
// motif-archivage). Rien d'autre n'est réécrit : ni le titre, ni le corps, ni le ton.
//
// Point 7 : l'infographie « Quatre repères » (image + version texte + sources), qui ne vivait
// que dans la fiche travailleur « Manutention » archivée, est réinsérée telle quelle dans la
// notion « Manutention manuelle », à la fin de sa section Définition.
//
// Usage : node promouvoir_fiches.mjs            (simulation)
//         node promouvoir_fiches.mjs --appliquer
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const REPO = path.resolve(__dirname, '..');
const SAUV = path.join(REPO, 'sauvegarde-vault', '2026-09-13-promotion');
const JOURNAL = path.join(REPO, 'content-updates', '2026-09-13-promotion-fiches.json');
const appliquer = process.argv.includes('--appliquer');

// [source dans 98 - Archives, destination = dossier de notions]
const PROMOTIONS = [
  ['Wiki Hygiène industrielle/98 - Archives/25 - Articles travailleurs/Équipements de protection.md',
   'Wiki Hygiène industrielle/20 - Articles internes/Prévention et programmes/Équipements de protection.md'],
  ['Wiki Sécurité industrielle/98 - Archives/25 - Articles travailleurs/Équipements de protection.md',
   'Wiki Sécurité industrielle/20 - Articles internes/Équipements de protection.md'],
  ['Wiki SST psychosociale/98 - Archives/25 - Articles travailleurs/20 - Ressources et aide/Où appeler quand ça ne va pas.md',
   'Wiki SST psychosociale/20 - Articles/Soutien et Ressources/Où appeler quand ça ne va pas.md'],
  ["Wiki Sécurité industrielle/98 - Archives/25 - Articles travailleurs/Presqu'accident.md",
   "Wiki Sécurité industrielle/20 - Articles internes/Presqu'accident.md"],
  ['Wiki Sécurité industrielle/98 - Archives/26 - Brouillons travailleurs/Le risque électrique, ce que tu dois savoir.md',
   'Wiki Sécurité industrielle/20 - Articles internes/Risques mécaniques et opérations/Le risque électrique, ce que tu dois savoir.md'],
  ['Wiki Sécurité industrielle/98 - Archives/25 - Articles travailleurs/Risques mécaniques/Cadenassage.md',
   'Wiki Sécurité industrielle/20 - Articles internes/Risques mécaniques et opérations/Cadenassage.md'],
];

const MANUTENTION_ARCHIVEE = 'Wiki Ergonomie/98 - Archives/25 - Articles travailleurs/Manutention.md';
const MANUTENTION_NOTION = 'Wiki Ergonomie/20 - Articles internes/Contraintes/Manutention manuelle.md';

const CLES_ARCHIVAGE = /^(publish|chemin-origine|archive-date|motif-archivage)\s*:/;

function nettoyerFrontmatter(texte) {
  const nl = texte.includes('\r\n') ? '\r\n' : '\n';
  const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { texte, retirees: [] };
  const lignes = m[1].split(/\r?\n/);
  const retirees = lignes.filter(l => CLES_ARCHIVAGE.test(l));
  const gardees = lignes.filter(l => !CLES_ARCHIVAGE.test(l));
  return { texte: '---' + nl + gardees.join(nl) + nl + '---' + nl + texte.slice(m[0].length), retirees };
}

function extraireInfographie(texte) {
  const debut = texte.indexOf('<div class="infographie">');
  const fin = texte.indexOf('</div>', debut);
  if (debut < 0 || fin < 0) throw new Error('bloc infographie introuvable dans ' + MANUTENTION_ARCHIVEE);
  return texte.slice(debut, fin + '</div>'.length);
}

const journal = [];
console.log(appliquer ? 'Mode : appliquer' : 'Mode : simulation');

for (const [src, dest] of PROMOTIONS) {
  const absSrc = path.join(VAULT, src), absDest = path.join(VAULT, dest);
  if (!fs.existsSync(absSrc)) { console.log('  ⚠ absente, ignorée : ' + src); continue; }
  if (fs.existsSync(absDest)) throw new Error('destination existe déjà : ' + dest);
  const brut = fs.readFileSync(absSrc, 'utf8');
  const { texte, retirees } = nettoyerFrontmatter(brut.replace(/^\uFEFF/, ''));
  console.log(`  ${src}\n    → ${dest}\n    clés retirées : ${retirees.map(l => l.split(':')[0]).join(', ')}`);
  journal.push({ source: src, destination: dest, clesRetirees: retirees });
  if (appliquer) {
    fs.mkdirSync(path.join(SAUV, path.dirname(src)), { recursive: true });
    fs.copyFileSync(absSrc, path.join(SAUV, src));
    fs.mkdirSync(path.dirname(absDest), { recursive: true });
    fs.writeFileSync(absDest, texte, 'utf8');
    fs.unlinkSync(absSrc);
  }
}

// point 7 : l'infographie
{
  const archivee = fs.readFileSync(path.join(VAULT, MANUTENTION_ARCHIVEE), 'utf8');
  const bloc = extraireInfographie(archivee);
  const absNotion = path.join(VAULT, MANUTENTION_NOTION);
  const notion = fs.readFileSync(absNotion, 'utf8');
  if (notion.includes('wiki-manutention-reperes-v1.png')) {
    console.log('  infographie déjà présente dans la notion, rien à faire');
  } else {
    const nl = notion.includes('\r\n') ? '\r\n' : '\n';
    const ancre = '### Statistiques et lésions';
    const i = notion.indexOf(ancre);
    if (i < 0) throw new Error('section « Statistiques et lésions » introuvable dans ' + MANUTENTION_NOTION);
    const nouveau = notion.slice(0, i) + bloc.replace(/\r?\n/g, nl) + nl + nl + notion.slice(i);
    console.log(`  infographie « Quatre repères » (${bloc.length} car.) insérée avant « ${ancre} » dans ${MANUTENTION_NOTION}`);
    journal.push({ infographie: 'wiki-manutention-reperes-v1.png', depuis: MANUTENTION_ARCHIVEE, vers: MANUTENTION_NOTION, avant: ancre });
    if (appliquer) {
      fs.mkdirSync(path.join(SAUV, path.dirname(MANUTENTION_NOTION)), { recursive: true });
      fs.copyFileSync(absNotion, path.join(SAUV, MANUTENTION_NOTION));
      fs.writeFileSync(absNotion, nouveau, 'utf8');
    }
  }
}

if (appliquer) {
  fs.writeFileSync(JOURNAL, JSON.stringify({ date: '2026-09-13', sauvegarde: 'sauvegarde-vault/2026-09-13-promotion (locale, non versionnée)', operations: journal }, null, 1), 'utf8');
  console.log(`\n✅ ${journal.length} opération(s) appliquée(s). Journal : ${JOURNAL}`);
} else {
  console.log('\nRelancer avec --appliquer pour exécuter.');
}
