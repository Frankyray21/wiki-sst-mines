// Générateur de site statique "Wikipédia" pour le vault Obsidian WIKI SST - Mines
// Usage : node build_site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import * as yaml from 'js-yaml';
import { optimiserPng, estDocumentTexte } from './png_palette.mjs';
import { rendrePortailEncadrement } from './portail_encadrement.mjs';
import { analyserQualite, LIBELLES } from './qualite.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const OUT = path.resolve(__dirname, '..', 'docs');

const WIKIS = {
  'Wiki Ergonomie':            { slug: 'ergonomie',      icon: '🦺', name: 'Ergonomie',            desc: 'TMS, manutention, postures, vibrations, confort thermique' },
  'Wiki Hygiène industrielle': { slug: 'hygiene',        icon: '🌫️', name: 'Hygiène industrielle', desc: 'Bruit, poussières, diesel, ventilation, chaleur' },
  'Wiki Toxicologie':          { slug: 'toxicologie',    icon: '☣️', name: 'Toxicologie',          desc: 'Solvants, métaux, amiante, silice, voies d\'exposition' },
  'Wiki Sécurité industrielle':{ slug: 'securite',       icon: '⛑️', name: 'Sécurité industrielle', desc: 'Cadenassage, espaces clos, hauteur, explosifs, machines' },
  'Wiki Droit du travail':     { slug: 'droit-travail',  icon: '📋', name: 'Droit du travail',     desc: 'Cadre légal, droits du travailleur, LSST, LATMP, LMRSST' },
  'Wiki SST psychosociale':    { slug: 'psychosocial',   icon: '🧠', name: 'SST psychosociale',    desc: 'RPS, Karasek, Siegrist, détresse, FIFO, reconnaissance' },
  'Recueil législatif SST':    { slug: 'legislation',    icon: '⚖️', name: 'Recueil législatif',   desc: 'Lois, règlements, article par article, jurisprudence' },
};

const EXCLUDE_DIRS = new Set(['.obsidian', '.trash', '99 - Templates', '_À supprimer (vérifier puis effacer)', '📥 PDF à téléverser']);
const ASSET_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.mp4', '.m4a', '.mp3', '.epub']);
const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);

const CALLOUTS = {
  abstract: { label: 'En bref',     cls: 'abstract', icon: '📋' },
  summary:  { label: 'En bref',     cls: 'abstract', icon: '📋' },
  info:     { label: 'Information', cls: 'info',     icon: 'ℹ️' },
  note:     { label: 'Note',        cls: 'info',     icon: '🗒️' },
  quote:    { label: 'Citation',    cls: 'quote',    icon: '❝' },
  cite:     { label: 'Citation',    cls: 'quote',    icon: '❝' },
  warning:  { label: 'Attention',   cls: 'warning',  icon: '⚠️' },
  caution:  { label: 'Attention',   cls: 'warning',  icon: '⚠️' },
  danger:   { label: 'Danger',      cls: 'danger',   icon: '🚨' },
  tip:      { label: 'Conseil',     cls: 'tip',      icon: '💡' },
  hint:     { label: 'Conseil',     cls: 'tip',      icon: '💡' },
  example:  { label: 'Exemple',     cls: 'example',  icon: '🔍' },
  question: { label: 'Question',    cls: 'info',     icon: '❓' },
  faq:      { label: 'FAQ',         cls: 'info',     icon: '❓' },
  success:  { label: 'À retenir',   cls: 'tip',      icon: '✅' },
  todo:     { label: 'À faire',     cls: 'info',     icon: '☑️' },
};

marked.setOptions({ gfm: true, breaks: true, mangle: false, headerIds: false });

// ---------- utilitaires ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function slugify(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'page';
}

// Décode les entités produites par marked, sinon « d&#39;ensemble » finit dans les id ET dans le texte du sommaire
function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&(rsquo|lsquo|apos);/g, "'")
    .replace(/&(rdquo|ldquo|quot);/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function headingSlug(text) {
  return decodeEntities(String(text).replace(/<[^>]+>/g, ''))
    .replace(/['’]/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'section';
}

// Libellé du sommaire : on retire uniquement le préfixe de classement du vault
// (« 15 - Navigation »). Règle volontairement étroite : elle exige des espaces
// autour du tiret et une lettre derrière, pour ne pas toucher aux titres
// légitimement numérotés dans les notes (« 1. Diligence raisonnable », « 2.1 Comment mesurer »).
// Consomme une grappe d'emoji entière, y compris les emojis composés reliés par un
// ZWJ (U+200D) comme 🧑‍💼 : sinon on mange la première moitié et on laisse un liant orphelin.
const EMOJIS_DE_TETE = /^(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}️?)*|\s)+/u;

function libelleTdm(texte) {
  const t = texte.replace(/^\d{1,3} +[-–—] +(?=\p{L})/u, '').trim();
  return t || texte.trim();
}

function cleanLabel(name) {
  // "20 - Articles" -> "Articles" ; retire aussi les emojis de tête
  return name.replace(/^\d+\s*-\s*/, '').replace(EMOJIS_DE_TETE, '').trim() || name;
}

function stripMd(s) {
  return s
    .replace(/!?\[\[([^\]]+)\]\]/g, (m, t) => { const p = t.replace(/\\\|/g, '|').split('|'); return p[p.length - 1].split('#')[0]; })
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // boilerplate qui rendait 1838 extraits indiscernables les uns des autres
    .replace(/\[!\w+\][+-]?/g, ' ')
    .replace(/🌐 LegisQuébec[^\n]*/g, ' ')
    .replace(/Texte officiel : capture du PDF[^\n]*/gi, ' ')
    .replace(/🔗 Ouvrir a cette page[^\n]*/gi, ' ')
    .replace(/texte a jour au [^\n]*/gi, ' ')
    .replace(/^\s*(En bref|Table des matières|Voir aussi)\b/gim, ' ')
    .replace(/[*_`#>~=|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrait de 150 caractères coupé en fin de mot
function extrait(s, n = 150) {
  const t = stripMd(s);
  return t.length <= n ? t : t.slice(0, n).replace(/\s\S*$/, '');
}

// ---------- scan du vault ----------
const pages = [];              // {relPath, absPath, wikiKey, base, fm, body, mtime, ...}
const assetsByBase = new Map();// basename lower -> [relPath]
const assetsByPath = new Map();// relPath lower -> relPath
const assetAbs = new Map();    // relPath -> chemin absolu sur le disque

// Dossiers hors vault contenant des images référencées par les notes.
// Le préfixe correspond au chemin tel qu'il apparaît dans les [[embeds]].
const EXTRA_ASSET_ROOTS = [
  { prefix: 'Notes de cours SST', dir: 'C:/Users/Frank/OneDrive/Documents/SST/Notes de cours SST' },
  { prefix: 'SST-Images',         dir: 'C:/Users/Frank/OneDrive/Documents/SST/Images' },
  { prefix: 'Obsidian-Images',    dir: 'C:/Users/Frank/OneDrive/Documents/Obsidian Vault/Images' },
];

function indexAsset(relPath, absPath) {
  const b = path.basename(relPath).toLowerCase();
  if (!assetsByBase.has(b)) assetsByBase.set(b, []);
  assetsByBase.get(b).push(relPath);
  if (!assetsByPath.has(relPath.toLowerCase())) assetsByPath.set(relPath.toLowerCase(), relPath);
  if (!assetAbs.has(relPath)) assetAbs.set(relPath, absPath);
}

function walk(dir, rel, assetsOnly = false) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), rel ? rel + '/' + e.name : e.name, assetsOnly);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      const relPath = rel ? rel + '/' + e.name : e.name;
      if (ext === '.md') {
        if (assetsOnly || !rel) continue; // page racine remplacée par le portail
        const wikiKey = relPath.split('/')[0];
        if (!WIKIS[wikiKey]) continue;
        pages.push({ relPath, absPath: path.join(dir, e.name), wikiKey, base: e.name.slice(0, -3) });
      } else if (ASSET_EXT.has(ext)) {
        indexAsset(relPath, path.join(dir, e.name));
      }
    }
  }
}
walk(VAULT, '');
for (const root of EXTRA_ASSET_ROOTS) {
  if (fs.existsSync(root.dir)) walk(root.dir, root.prefix, true);
}
console.log(`Pages trouvées : ${pages.length} · assets indexés : ${assetsByPath.size}`);

// ---------- lecture + frontmatter + chemins de sortie ----------

// Répare un bloc YAML invalide : guillemete les valeurs contenant « : » non protégé.
// N'est appelé que si yaml.load a déjà échoué — on ne touche jamais un frontmatter sain.
function sanitizeFm(block) {
  return block.split(/\r?\n/).map((line) => {
    const m = line.match(/^(\s*[^:\s#][^:]*):[ \t]+(.+?)\s*$/);
    if (!m) return line;
    const [, cle, valeur] = m;
    if (/^['"|>&*!]/.test(valeur)) return line;             // déjà cité ou bloc YAML
    if (/^\[.*\]$/.test(valeur)) {                          // liste : ne citer que si illisible
      try { yaml.load('x: ' + valeur); return line; } catch { /* on cite plus bas */ }
    } else if (!valeur.includes(':')) return line;
    const propre = valeur.replace(/^[:\s]+|[:\s]+$/g, '');  // « visé:  : » → valeur vide
    if (!propre) return `${cle}: ''`;
    return `${cle}: '${propre.replace(/'/g, "''")}'`;
  }).join('\n');
}

// ---------- répartition des pages entre les deux publics ----------
// Le vault marque déjà chaque note : publication-travailleur / publication-gestionnaire.
// Principe de prudence : ce qui n'est pas explicitement autorisé n'est pas publié.
// Seule exception, assumée : le Recueil législatif (texte de loi du Québec, public par nature,
// et vérifié sans aucune note « interne » ni refus explicite).
const LEGISLATION_PUBLIQUE = true;

const estOui = (v) => String(v ?? '').trim().toLowerCase() === 'oui';

// Le vault mélange trois barèmes : « public »/« interne », 0-3, et « publique »/« vulgarisé ».
function sensibiliteRestreinte(v) {
  if (v === undefined || v === null || v === '') return false;
  const s = String(v).trim().toLowerCase();
  if (s === 'interne' || s === 'sensible' || s === 'confidentiel') return true;
  const n = Number(s);
  return Number.isFinite(n) && n >= 2;
}

const REFUS_ABSOLU = new Set(['interne-non-publie', 'interne-strict', 'a-archiver', 'archive-confirmee']);

const estNon = (v) => String(v ?? '').trim().toLowerCase() === 'non';

// « public-cible » désigne le LECTEUR visé. À ne pas confondre avec « visé », qui désigne
// le destinataire d'une obligation légale : router dessus retirerait aux travailleurs
// les articles qui fondent leurs propres droits.
const ENCADREMENT = ['direction', 'superviseur', 'gestionnaire', 'rh', 'employeur', 'contremaitre', 'contremaître'];

function publicsDeLaPage(p) {
  const fm = p.fm || {};
  const S = new Set();
  if (fm.publish === false) return S;
  if (REFUS_ABSOLU.has(String(fm['traitement-publication'] ?? '').trim().toLowerCase())) return S;

  const cible = (Array.isArray(fm['public-cible']) ? fm['public-cible'] : String(fm['public-cible'] ?? '').split(/[,;]/))
    .map(x => String(x).trim().toLowerCase()).filter(Boolean);

  // Le texte de loi est public : il fonde les droits du travailleur comme les obligations de l'employeur.
  if (LEGISLATION_PUBLIQUE && p.wikiKey === 'Recueil législatif SST' && !sensibiliteRestreinte(fm['niveau-sensibilité'])) {
    S.add('t'); S.add('g');
    return S;
  }
  // Travailleurs : autorisation explicite ou public-cible, plus veto de sensibilité.
  const okTravailleur = estOui(fm['publication-travailleur'])
    || (cible.includes('travailleur') && !estNon(fm['publication-travailleur']));
  if (okTravailleur && !sensibiliteRestreinte(fm['niveau-sensibilité'])) S.add('t');

  // Encadrement : même logique. Ici « interne » signifie « pas pour les travailleurs »,
  // pas « pas pour l'encadrement » — ce n'est donc pas un veto.
  if (estOui(fm['publication-gestionnaire'])
    || (cible.some(c => ENCADREMENT.includes(c)) && !estNon(fm['publication-gestionnaire']))) S.add('g');
  return S;
}

const badFm = [];
for (const p of pages) {
  let raw = fs.readFileSync(p.absPath, 'utf8').replace(/^\uFEFF/, '');
  p.mtime = fs.statSync(p.absPath).mtime;
  p.fm = {};
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (m) {
    try {
      p.fm = yaml.load(m[1]) || {};
    } catch {
      try { p.fm = yaml.load(sanitizeFm(m[1])) || {}; badFm.push(`${p.relPath} (réparé)`); }
      catch (e) { p.fm = {}; badFm.push(`${p.relPath} : ${String(e.message).split('\n')[0]}`); }
    }
    raw = raw.slice(m[0].length);
  }
  p.body = raw;
  // titre unique : le H1 s'il existe, sinon le nom de fichier.
  // p.base reste la clé de résolution des wikilinks et du chemin de sortie.
  const h1 = p.body.match(/^\s*#\s+(.+?)\s*$/m);
  // Un titre peut contenir un wikilink brut : « Wiki [[Sécurité industrielle]] mines » → on garde le libellé.
  p.title = (h1 ? h1[1].trim() : p.base)
    .replace(/\[\[([^\]]+)\]\]/g, (m, t) => { const s = t.replace(/\\\|/g, '|').split('|'); return s[s.length - 1].split('#')[0]; })
    .trim();
  if (h1) p.body = p.body.replace(h1[0], ''); // évite le doublon de titre
  p.dir = p.relPath.split('/').slice(0, -1).join('/');
  p.publics = publicsDeLaPage(p);
}

// Les notes explicitement marquées « ne pas publier » sortent du site, y compris du fond
// documentaire : les publier irait contre une consigne écrite dans le vault lui-même.
// Les liens qui les visaient deviennent des liens rouges, sans révéler leur titre.
const refusees = pages.filter(p => {
  const fm = p.fm || {};
  return fm.publish === false
    || REFUS_ABSOLU.has(String(fm['traitement-publication'] ?? '').trim().toLowerCase());
});
if (refusees.length) {
  for (const p of refusees) pages.splice(pages.indexOf(p), 1);
  console.log(`Non publiées (publish: false / traitement interne) : ${refusees.length} notes écartées du site`);
}

// Chemin de sortie dans le fond documentaire : miroir du vault, slugifié.
// Les wikis par public préfixent ce chemin (t/… ou g/…) sans le recalculer.
const usedOut = new Set();
for (const p of pages) {
  const parts = p.relPath.slice(0, -3).split('/');
  let out = 'w/' + WIKIS[p.wikiKey].slug + '/' + parts.slice(1).map(slugify).join('/') + '.html';
  let n = 2;
  while (usedOut.has(out.toLowerCase())) out = out.replace(/\.html$/, '') + '-' + (n++) + '.html';
  usedOut.add(out.toLowerCase());
  p.out = out;
}

// index de résolution des liens
const byBase = new Map();  // basename lower -> [page]
const byPath = new Map();  // relPath sans .md, lower -> page
const byLoose = new Map(); // clé assouplie -> [page] (dernier recours)

const ROMAINS = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20, xxi: 21, xxii: 22, xxiii: 23, xxiv: 24, xxv: 25, xxvi: 26, xxvii: 27, xxviii: 28, xxix: 29, xxx: 30, xxxi: 31, xxxii: 32, xxxiii: 33, xxxiv: 34, xxxv: 35, xxxvi: 36, xxxvii: 37, xxxviii: 38, xxxix: 39, xl: 40 };

// « CSTC - Section 3 » et « CSTC - Section 03 », « RSST Section XXVI » et « RSST Section 26 »
// doivent tomber sur la même clé. Les romains ne sont convertis QUE derrière un mot structurant,
// sinon un « l' » réduit à « l » se transformerait en 50.
function looseKey(s) {
  let k = String(s).toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  k = k.replace(/\b(section|chapitre|partie|annexe|titre|livre|sous-section)\s+([ivxl]+)\b/g,
    (m, mot, rom) => ROMAINS[rom] ? `${mot} ${ROMAINS[rom]}` : m);
  k = k.replace(/\b0+(\d)/g, '$1'); // zéros de tête : « Section 03 » → « Section 3 »
  return k.replace(/\s+/g, ' ').trim();
}

function ajouterCle(map, cle, p) {
  if (!cle) return;
  if (!map.has(cle)) map.set(cle, []);
  if (!map.get(cle).includes(p)) map.get(cle).push(p);
}

for (const p of pages) {
  ajouterCle(byBase, p.base.toLowerCase(), p);
  byPath.set(p.relPath.slice(0, -3).toLowerCase(), p);
  ajouterCle(byLoose, looseKey(p.base), p);
  // Les alias déclarés dans le frontmatter deviennent des cibles de lien à part entière.
  // String() est indispensable : js-yaml rend un alias « 2631 » sous forme de nombre.
  const alias = Array.isArray(p.fm.aliases) ? p.fm.aliases
    : (p.fm.aliases ? [p.fm.aliases] : []);
  for (const a of alias) {
    const s = String(a).trim();
    if (!s) continue;
    ajouterCle(byBase, s.toLowerCase(), p);
    ajouterCle(byLoose, looseKey(s), p);
  }
}

function resolvePage(target, from) {
  let t = target.trim().replace(/^🏠 WIKI SST - Mines\//u, '');
  if (!t) return null;
  if (t.includes('/')) {
    const hit = byPath.get(t.toLowerCase());
    if (hit) return hit;
    t = t.split('/').pop();
  }
  const cands = byBase.get(t.toLowerCase()) || byLoose.get(looseKey(t));
  if (!cands || !cands.length) return null;
  if (cands.length === 1) return cands[0];
  const sameDir = cands.filter(c => c.dir === from.dir);
  if (sameDir.length) return sameDir[0];
  const sameWiki = cands.filter(c => c.wikiKey === from.wikiKey);
  if (sameWiki.length) return sameWiki[0];
  return cands.slice().sort((a, b) => a.relPath.length - b.relPath.length)[0];
}

function resolveAsset(ref, from) {
  let t = ref.trim();
  // essai : relatif au dossier de la page, puis suffixe, puis basename
  const tryPaths = [from.dir + '/' + t, t];
  for (const tp of tryPaths) {
    const hit = assetsByPath.get(tp.toLowerCase());
    if (hit) return hit;
  }
  const base = t.split('/').pop().toLowerCase();
  const cands = assetsByBase.get(base);
  if (!cands || !cands.length) return null;
  if (cands.length === 1) return cands[0];
  const suffix = cands.filter(c => c.toLowerCase().endsWith('/' + t.toLowerCase()));
  if (suffix.length) return suffix[0];
  const sameWiki = cands.filter(c => c.split('/')[0] === from.wikiKey);
  if (sameWiki.length) return sameWiki[0];
  return cands[0];
}

// copie paresseuse des assets référencés
const assetOut = new Map(); // relPath -> url sous files/
function assetUrl(relPath) {
  if (assetOut.has(relPath)) return assetOut.get(relPath);
  const parts = relPath.split('/');
  const ext = path.extname(parts[parts.length - 1]);
  const stem = parts[parts.length - 1].slice(0, -ext.length);
  let url = 'files/' + parts.slice(0, -1).map(slugify).join('/') + (parts.length > 1 ? '/' : '') + slugify(stem) + ext.toLowerCase();
  let n = 2;
  while ([...assetOut.values()].includes(url)) url = url.replace(ext.toLowerCase(), '') + '-' + (n++) + ext.toLowerCase();
  assetOut.set(relPath, url);
  const dest = path.join(OUT, url);
  const src = assetAbs.get(relPath) || path.join(VAULT, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  // Les captures d'articles de loi sont stockées en RVB 24 bits alors qu'elles tiennent
  // sous 256 couleurs : la palettisation divise leur poids par deux, sans perte.
  if (path.extname(dest).toLowerCase() === '.png') {
    const brut = fs.readFileSync(src);
    try { if (estDocumentTexte(brut)) docsTexte.add(url); } catch { /* image illisible : on n'inverse pas */ }
    let out = null;
    try { out = optimiserPng(brut); } catch { out = null; }
    if (out) { pngGain += brut.length - out.length; pngOptim++; fs.writeFileSync(dest, out); return url; }
    pngIntacts++;
    fs.writeFileSync(dest, brut);
    return url;
  }
  fs.copyFileSync(src, dest);
  return url;
}
let pngGain = 0, pngOptim = 0, pngIntacts = 0;
// URLs des images qui sont des captures de documents (texte noir sur blanc) : elles sont
// inversées en thème sombre au lieu d'éblouir le lecteur.
const docsTexte = new Set();

// Public en cours de génération : null pour le fond documentaire, 't' ou 'g' pour les wikis par public.
// Un lien vers une page du même public reste dans le wiki ; sinon il renvoie au fond documentaire.
let PUB = null;
function urlDe(pg) {
  // Le Recueil législatif n'est pas dupliqué dans les arbres par public : les deux wikis
  // renvoient vers l'exemplaire unique du fond documentaire.
  const dansLArbre = PUB && pg.publics && pg.publics.has(PUB) && pg.wikiKey !== 'Recueil législatif SST';
  return dansLArbre ? PUB + '/' + pg.out : pg.out;
}

// ---------- rendu markdown ----------
let CUR;          // page en cours
let CUR_LINKS;    // cibles collectées pour les backlinks
const blocks = [];// blocs HTML protégés du parseur markdown
function protect(html) { blocks.push(html); return `\n\nXBLOCKX${blocks.length - 1}X\n\n`; }

function renderWikilinks(md) {
  return md.replace(/(!?)\[\[([^\[\]]+?)\]\]/g, (m, bang, inner) => {
    inner = inner.replace(/\\\|/g, '|');
    const pipe = inner.indexOf('|');
    let target = pipe >= 0 ? inner.slice(0, pipe) : inner;
    let alias = pipe >= 0 ? inner.slice(pipe + 1) : '';
    let anchor = '';
    const hash = target.indexOf('#');
    if (hash >= 0) { anchor = target.slice(hash + 1); target = target.slice(0, hash); }
    target = target.trim();
    const extMatch = target.match(/\.(png|jpe?g|gif|svg|webp|pdf|mp4|m4a|mp3|epub)$/i);

    // ---- embeds ----
    if (bang) {
      if (extMatch) {
        const rel = resolveAsset(target, CUR);
        if (!rel) return `<span class="missing-file">[fichier introuvable : ${esc(target)}]</span>`;
        const url = assetUrl(rel);
        const ext = extMatch[1].toLowerCase();
        if (IMG_EXT.has('.' + ext)) {
          const w = alias && /^\d+/.test(alias) ? ` style="max-width:${parseInt(alias)}px"` : '';
          // alt utile : sur les captures d'articles de loi, le nom de fichier ne dit rien au lecteur d'écran
          const legende = alias && !/^\d+$/.test(alias) ? alias
            : /^art[-.]/i.test(target.split('/').pop()) ? `Texte officiel de l'article — ${CUR.title}`
            : `Illustration — ${CUR.title}`;
          const classeDoc = docsTexte.has(url) ? ' class="img-doc"' : '';
          return protect(`<span class="page-img"><a href="{{ROOT}}${url}" target="_blank" rel="noopener"><img${classeDoc} src="{{ROOT}}${url}" alt="${esc(legende)}" loading="lazy"${w}></a><span class="img-zoom">Toucher l'image pour l'agrandir</span></span>`);
        }
        if (ext === 'mp4') return protect(`<video controls preload="metadata" src="{{ROOT}}${url}" style="max-width:100%"></video>`);
        if (ext === 'm4a' || ext === 'mp3') return protect(`<audio controls src="{{ROOT}}${url}"></audio>`);
        return `<a class="external" href="{{ROOT}}${url}${anchor ? '#' + esc(anchor) : ''}" target="_blank">📄 ${esc(alias || target.split('/').pop())}</a>`;
      }
      // transclusion de note : simple lien encadré
      const pg = resolvePage(target, CUR);
      if (pg) { CUR_LINKS.add(pg); return `<a href="{{ROOT}}${urlDe(pg)}">${esc(alias || pg.title)}</a>`; }
      return `<span class="new">${esc(alias || target)}</span>`;
    }

    // ---- liens ----
    if (extMatch) {
      const rel = resolveAsset(target, CUR);
      const label = alias || target.split('/').pop();
      if (!rel) return `<span class="new" title="fichier introuvable">${esc(label)}</span>`;
      const url = assetUrl(rel);
      const pageAnchor = anchor && /^page=\d+$/.test(anchor) ? '#' + anchor : '';
      return `<a class="external" href="{{ROOT}}${url}${pageAnchor}" target="_blank">${esc(label)}</a>`;
    }
    if (!target && anchor) { // [[#Section]]
      return `<a href="#${headingSlug(anchor)}">${esc(alias || anchor)}</a>`;
    }
    const pg = resolvePage(target, CUR);
    // Libellé : jamais le chemin Obsidian complet. On affiche le titre de la page cible,
    // sauf quand le lien passe par un alias — « [[ISO 2631]] » doit rester « ISO 2631 »
    // et non devenir « ISO 2631 - Vibrations globales du corps » en pleine phrase.
    const saisi = target.split('/').pop();
    const parAlias = pg && looseKey(saisi) !== looseKey(pg.base) && looseKey(saisi) !== looseKey(pg.title);
    const nom = pg ? (parAlias ? saisi : pg.title) : saisi;
    const label = alias || (anchor ? `${nom} › ${anchor}` : nom);
    if (!pg) return `<span class="new" title="page non créée">${esc(label)}</span>`;
    CUR_LINKS.add(pg);
    const a = anchor ? '#' + headingSlug(anchor) : '';
    return `<a href="{{ROOT}}${urlDe(pg)}${a}" title="${esc(pg.title)}">${esc(label)}</a>`;
  });
}

function renderCallouts(md) {
  const lines = md.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^>\s*\[!(\w+)\][+-]?\s*(.*)$/);
    if (!m) { out.push(lines[i]); continue; }
    const type = m[1].toLowerCase();
    const def = CALLOUTS[type] || { label: type, cls: 'info', icon: 'ℹ️' };
    const title = m[2].trim();
    const inner = [];
    let j = i + 1;
    while (j < lines.length && /^>/.test(lines[j])) { inner.push(lines[j].replace(/^>\s?/, '')); j++; }
    i = j - 1;
    const innerHtml = renderBody(inner.join('\n'), true);
    out.push(protect(
      `<div class="callout callout-${def.cls}"><div class="callout-title"><span class="callout-icon">${def.icon}</span>${esc(title || def.label)}</div><div class="callout-body">${innerHtml}</div></div>`
    ));
  }
  return out.join('\n');
}

function renderBody(md, nested = false) {
  let s = md.replace(/%%[\s\S]*?%%/g, '');
  s = renderCallouts(s);
  s = renderWikilinks(s);
  s = s.replace(/==([^=\n][^=]*?)==/g, '<mark>$1</mark>');
  let html = marked.parse(s);
  if (!nested) {
    // ids de titres + collecte du sommaire
    html = html.replace(/<h([1-4])>([\s\S]*?)<\/h\1>/g, (m, lv, inner) => {
      let id = headingSlug(inner);
      let n = 2;
      while (CUR.headIds.has(id)) id = headingSlug(inner) + '-' + (n++);
      CUR.headIds.add(id);
      if (lv === '2' || lv === '3') CUR.toc.push({ lv: +lv, id, text: libelleTdm(decodeEntities(inner.replace(/<[^>]+>/g, ''))) });
      return `<h${lv} id="${id}">${inner}</h${lv}>`;
    });
  }
  // liens markdown relatifs vers un fichier du vault : [Voir art. 51 (page 20)](RSST.pdf#page=20)
  html = html.replace(/<a href="(?!https?:|#|\{\{ROOT\}\}|mailto:|files\/)([^"]+)"/g, (m, href) => {
    let cible = href, frag = '';
    const h = cible.indexOf('#');
    if (h >= 0) { frag = cible.slice(h); cible = cible.slice(0, h); }
    try { cible = decodeURIComponent(cible); } catch { /* laisse tel quel */ }
    if (!/\.(pdf|png|jpe?g|gif|svg|webp|mp4|m4a|mp3|epub)$/i.test(cible)) return m;
    const rel = resolveAsset(cible, CUR);
    if (!rel) return '<a class="lien-mort" title="fichier introuvable" href="#"';
    return `<a class="external" target="_blank" rel="noopener" href="{{ROOT}}${assetUrl(rel)}${frag}"`;
  });
  // liens externes http(s)
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a class="external" target="_blank" rel="noopener" href="$1"');
  return html;
}

function finalize(html) {
  let guard = 0;
  while (/XBLOCKX\d+X/.test(html) && guard++ < 10) {
    html = html.replace(/(?:<p>)?XBLOCKX(\d+)X(?:<\/p>)?/g, (m, i) => blocks[+i]);
  }
  return html;
}

// ---------- gabarits ----------
const style = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
const appjs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

function rootOf(out) { return '../'.repeat(out.split('/').length - 1); }

// Posé dans le <head>, avant tout rendu : sans lui, une page s'afficherait en clair
// une fraction de seconde avant de basculer en sombre.
const SCRIPT_THEME = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}`;

function pageShell({ out, title, wikiKey, content, sidebarExtra = '' }) {
  const ROOT = rootOf(out);
  const wiki = wikiKey ? WIKIS[wikiKey] : null;
  const wikiLinks = Object.entries(WIKIS).map(([k, w]) =>
    `<li${wiki && w.slug === wiki.slug ? ' class="active"' : ''}><a href="${ROOT}w/${w.slug}/index.html">${w.icon} ${w.name}</a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} — WIKI SST Mines</title>
<link rel="stylesheet" href="${ROOT}assets/style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⛏️</text></svg>">
<script>window.ROOT='${ROOT}';${SCRIPT_THEME}</script>
</head>
<body>
<header class="site-header">
  <button class="burger" id="burger" aria-label="Menu">☰</button>
  <a class="brand" href="${ROOT}index.html"><span class="brand-icon">⛏️</span><span class="brand-text"><strong>WIKI SST</strong><small>Mines · Québec</small></span></a>
  <div class="searchbox">
    <input type="search" id="q" placeholder="Rechercher dans le wiki…" autocomplete="off">
    <div id="suggest" class="suggest" hidden></div>
  </div>
  <button class="btn-theme" id="btnFav" aria-label="Ajouter aux favoris" title="Ajouter aux favoris">☆</button>
  <button class="btn-theme" id="btnTheme" aria-label="Changer de thème" title="Changer de thème"></button>
</header>
<div class="layout">
<nav class="sidebar" id="sidebar">
  <div class="nav-group"><div class="nav-title">Navigation</div>
    <ul>
      <li><a href="${ROOT}index.html">🏠 Portail</a></li>
      <li><a href="${ROOT}categories.html">🏷️ Catégories</a></li>
      <li><a href="${ROOT}qualite.html">🔧 Qualité rédactionnelle</a></li>
      <li><a href="${ROOT}graphe.html">🕸️ Graphe des liens</a></li>
      <li><a href="#" id="randomLink">🎲 Une page au hasard</a></li>
    </ul>
  </div>
  <div class="nav-group"><div class="nav-title">Selon qui vous êtes</div>
    <ul>
      <li><a href="${ROOT}t/index.html">👷 Wiki des travailleurs</a></li>
      <li><a href="${ROOT}g/index.html">🎓 Wiki de l'encadrement</a></li>
    </ul>
  </div>
  ${sidebarExtra}
  <div class="nav-group"><div class="nav-title">Les wikis</div><ul>${wikiLinks}</ul></div>
</nav>
<main class="content">
${content}
</main>
</div>
<footer class="site-footer">WIKI SST — Mines · encyclopédie interne construite à partir des notes de cours<span id="version"></span></footer>
<script src="${ROOT}assets/app.js"></script>
</body>
</html>`;
}

function wikiSidebar(wikiKey, sections) {
  const wiki = WIKIS[wikiKey];
  const ROOT = '{{ROOT}}';
  const items = sections.map(s => `<li><a href="${ROOT}w/${wiki.slug}/${s.slug}/index.html">${esc(s.label)}</a></li>`).join('');
  return `<div class="nav-group"><div class="nav-title">${wiki.icon} ${esc(wiki.name)}</div>
  <ul>
    <li><a href="${ROOT}w/${wiki.slug}/index.html">Accueil du wiki</a></li>
    ${items}
    <li><a href="${ROOT}w/${wiki.slug}/index-alphabetique.html">Index alphabétique</a></li>
    ${wikiKey === 'Recueil législatif SST' ? `<li><a href="${ROOT}w/${wiki.slug}/index-par-loi.html">Index par loi</a></li>` : ''}
  </ul></div>`;
}

// ---------- structure des wikis (sections = sous-dossiers de 1er niveau) ----------
const wikiSections = {}; // wikiKey -> [{name, label, slug, pages:[...]}]
const pagesByDir = new Map();
for (const p of pages) {
  if (!pagesByDir.has(p.dir)) pagesByDir.set(p.dir, []);
  pagesByDir.get(p.dir).push(p);
}
for (const wikiKey of Object.keys(WIKIS)) {
  const secs = new Map();
  for (const p of pages) {
    if (p.wikiKey !== wikiKey) continue;
    const parts = p.relPath.split('/');
    if (parts.length < 3) continue;
    const sec = parts[1];
    if (!secs.has(sec)) secs.set(sec, []);
    secs.get(sec).push(p);
  }
  wikiSections[wikiKey] = [...secs.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'fr'))
    .filter(([name]) => !/accueil/i.test(name))
    .map(([name, pgs]) => ({ name, label: cleanLabel(name), slug: slugify(name), pages: pgs }));
}

function wikiHome(wikiKey) {
  const cand = pages.find(p => p.wikiKey === wikiKey && /^00 - .*Accueil/u.test(p.relPath.split('/')[1] || '') );
  return cand || pages.find(p => p.wikiKey === wikiKey);
}

// ---------- infobox ----------
const FM_LABELS = [
  ['loi', 'Loi'], ['article', 'Article'], ['référence', 'Référence'],
  ['en-vigueur-depuis', 'En vigueur depuis'], ['chapitre', 'Chapitre'], ['section', 'Section'], ['bloc', 'Bloc'],
  ['nature', 'Nature'], ['sujet', 'Sujet'], ['visé', 'Visé'], ['type', 'Type'], ['theme', 'Thème'], ['thème', 'Thème'],
  ['auteur', 'Auteur'], ['année', 'Année'],
  ['révision', 'Révision'], ['revision', 'Révision'],
];
// « statut », « qualité », « public-cible » et « niveau-sensibilité » sont volontairement absents :
// ce sont des étiquettes de travail. Afficher « Sensibilité : 3 » signale au lecteur qu'il existe
// une version qu'on lui cache, et « Statut : ébauche » décrédibilise une page souvent aboutie.
// Elles restent visibles dans le tableau de bord qualité, qui s'adresse à l'auteur.
function infobox(p) {
  const rows = [];
  const vus = new Set(); // évite « Révision » deux fois quand le vault écrit la clé avec et sans accent
  for (const [key, label] of FM_LABELS) {
    let v = p.fm[key];
    if (v === undefined || v === null || v === '' || vus.has(label)) continue;
    vus.add(label);
    if (Array.isArray(v)) v = v.join(', ');
    v = String(v);
    if (/^\[\[.*\]\]$/.test(v.trim())) {
      const t = v.trim().slice(2, -2).replace(/\\\|/g, '|').split('|');
      const pg = resolvePage(t[0].split('#')[0], p);
      v = pg ? `<a href="{{ROOT}}${pg.out}">${esc(t[1] || pg.title)}</a>` : esc(t[1] || t[0]);
      rows.push(`<tr><th>${label}</th><td>${v}</td></tr>`);
      continue;
    }
    rows.push(`<tr><th>${label}</th><td>${esc(v)}</td></tr>`);
  }
  let tags = p.fm.tags;
  if (tags && !Array.isArray(tags)) tags = String(tags).split(/[,\s]+/);
  // Une étiquette qui a sa page de catégorie devient un lien ; les autres restent inertes.
  const tagHtml = (tags && tags.length)
    ? `<div class="infobox-tags">${tags.map(t => {
        const cle = String(t).trim().toLowerCase().replace(/^#/, '');
        const slug = slugTag.get(cle);
        return slug
          ? `<a class="tag tag-lien" href="{{ROOT}}categorie/${slug}.html">${esc(t)}</a>`
          : `<span class="tag">${esc(t)}</span>`;
      }).join('')}</div>` : '';
  if (!rows.length && !tagHtml) return '';
  const wiki = WIKIS[p.wikiKey];
  return `<aside class="infobox"><div class="infobox-title">${wiki.icon} ${esc(p.title)}</div><table>${rows.join('')}</table>${tagHtml}</aside>`;
}

// ---------- rendu de toutes les pages ----------
console.log('Rendu des pages…');
// On vide le contenu sans supprimer OUT lui-même : sous Windows le dossier racine reste
// verrouillé dès qu'un terminal ou un serveur l'a comme répertoire courant.
if (fs.existsSync(OUT)) {
  for (const e of fs.readdirSync(OUT)) {
    fs.rmSync(path.join(OUT, e), { recursive: true, force: true, maxRetries: 20, retryDelay: 400 });
  }
}
fs.mkdirSync(OUT, { recursive: true });

// Résumé introductif, façon Wikipédia. On ne fabrique jamais de texte : on promeut le callout
// « En bref » que 3408 pages portent déjà, et on le retire du corps pour éviter le doublon.
// Sur un article de loi dont le texte officiel n'est qu'une capture d'image, ce résumé EST
// le texte de l'article : il est alors étiqueté comme tel.
function extraireChapo(p) {
  const lignes = p.body.split('\n');
  for (let i = 0; i < lignes.length; i++) {
    const m = lignes[i].match(/^>\s*\[!(abstract|summary)\][+-]?\s*(.*)$/i);
    if (!m) continue;
    const corps = [];
    let j = i + 1;
    while (j < lignes.length && /^>/.test(lignes[j])) { corps.push(lignes[j].replace(/^>\s?/, '')); j++; }
    const texte = corps.join('\n').trim();
    if (!texte) return null;
    return { md: texte, debut: i, fin: j, titre: m[2].trim() };
  }
  return null;
}

// ---------- mots-clés → catégories ----------
// Calculé avant l'écriture des pages : l'infobox rend cliquables les étiquettes qui ont une page.
// Étiquettes de structure : elles décrivent le classement interne du vault, pas un sujet.
const TAGS_STRUCTURELS = new Set([
  'wiki', 'loi', 'recueil', 'index', 'stub', 'à-documenter', 'a-documenter', 'template', 'moc',
  'article', 'articles', 'note', 'notes', 'brouillon', 'archive', 'accueil', 'hub', 'carrefour',
  'concept', 'section', 'sous-section', 'definition', 'définition', 'reference', 'référence',
  'chapitre', 'partie', 'titre', 'livre', 'navigation', 'transverse', 'acronyme',
  'en-cours', 'ebauche', 'ébauche', 'theme', 'thème', 'meta', 'méta', 'conventions',
  // Étiquettes de confidentialité : en faire un index public reviendrait à publier
  // un répertoire de ce qui n'est justement pas destiné à être diffusé.
  'interne', 'sensible', 'confidentiel', 'reference-interne', 'référence-interne', 'prive', 'privé',
  'lsst', 'latmp', 'lmrsst', 'lnt', 'rsst', 'rssm', 'cstc', 'csst',
]);

const parTag = new Map();
for (const p of pages) {
  const tags = Array.isArray(p.fm.tags) ? p.fm.tags : (p.fm.tags ? String(p.fm.tags).split(/[,\s]+/) : []);
  const vus = new Set();
  for (const brut of tags) {
    const t = String(brut).trim().toLowerCase().replace(/^#/, '');
    if (!t || t.length < 3 || vus.has(t)) continue;
    // « chapitre-i » à « chapitre-v » regroupaient les chapitres I de six lois sans rapport :
    // le filtre n'acceptait que les chiffres arabes. Les tags « wiki-… » sont aussi structurels.
    if (TAGS_STRUCTURELS.has(t)
      || /^(section|chapitre|partie|annexe|titre|livre|article|art)[-.\s]?(\d|[ivxl]+$)/i.test(t)
      || /^wiki-/.test(t)
      || /^\d+$/.test(t)) continue;
    vus.add(t);
    if (!parTag.has(t)) parTag.set(t, []);
    parTag.get(t).push(p);
  }
}

const SEUIL_CATEGORIE = 5;
const categories = [...parTag.entries()]
  .filter(([, pgs]) => pgs.length >= SEUIL_CATEGORIE)
  .sort((a, b) => b[1].length - a[1].length);
const slugTag = new Map(categories.map(([t]) => [t, slugify(t)]));

const backlinks = new Map(); // page -> Set(pages qui pointent vers elle)
for (const p of pages) {
  CUR = p; p.toc = []; p.headIds = new Set();
  CUR_LINKS = new Set();

  const ch = extraireChapo(p);
  let corpsMd = p.body;
  if (ch) {
    const lignes = p.body.split('\n');
    corpsMd = [...lignes.slice(0, ch.debut), ...lignes.slice(ch.fin)].join('\n');
    // Le chapô est rendu dans la même fenêtre que le corps : CUR et CUR_LINKS sont posés,
    // donc ses liens comptent dans les backlinks et les jetons de bloc restent alignés.
    // Le libellé reste « En bref » partout : les conventions du vault imposent de SYNTHÉTISER
    // le texte de loi, jamais de le transcrire. L'annoncer comme une transcription
    // ferait passer un résumé pour le texte officiel — inacceptable sur du droit.
    p.chapoHtml = finalize(renderBody(ch.md));
    p.chapoLabel = 'En bref';
  } else {
    p.chapoHtml = '';
  }

  p.html = finalize(renderBody(corpsMd));
  p.liens = [...CUR_LINKS].filter(x => x !== p); // liens sortants, pour le graphe
  blocks.length = 0;
  for (const target of CUR_LINKS) {
    if (target === p) continue;
    if (!backlinks.has(target)) backlinks.set(target, new Set());
    backlinks.get(target).add(p);
  }
}

console.log('Écriture des fichiers…');
for (const p of pages) {
  const wiki = WIKIS[p.wikiKey];
  const parts = p.relPath.split('/');
  const crumbs = [`<a href="{{ROOT}}index.html">Portail</a>`, `<a href="{{ROOT}}w/${wiki.slug}/index.html">${esc(wiki.name)}</a>`];
  let acc = 'w/' + wiki.slug;
  for (let i = 1; i < parts.length - 1; i++) {
    acc += '/' + slugify(parts[i]);
    crumbs.push(`<a href="{{ROOT}}${acc}/index.html">${esc(cleanLabel(parts[i]))}</a>`);
  }
  // Le compteur reste lisible quand le sommaire est replié : le lecteur sait ce qu'il y a derrière le bouton.
  const nbSections = p.toc.filter(t => t.lv === 2).length || p.toc.length;
  const tocHtml = p.toc.length >= 3
    ? `<nav class="toc" aria-label="Sommaire de la page"><div class="toc-title">Sommaire <span class="toc-compte">${nbSections} section${nbSections > 1 ? 's' : ''}</span> <button class="toc-toggle" aria-expanded="true">[masquer]</button></div><ul>${p.toc.map(t => `<li class="toc-l${t.lv}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul></nav>`
    : '';
  const bl = backlinks.get(p);
  const blHtml = bl && bl.size
    ? `<details class="backlinks"><summary>Pages qui pointent ici (${bl.size})</summary><ul>${[...bl].sort((a, b) => a.title.localeCompare(b.title, 'fr')).slice(0, 60).map(b => `<li><a href="{{ROOT}}${b.out}">${esc(b.title)}</a> <small class="bl-wiki">${WIKIS[b.wikiKey].name}</small></li>`).join('')}${bl.size > 60 ? '<li>…</li>' : ''}</ul></details>`
    : '';
  const rev = p.fm['révision'] || p.fm['revision'] || p.mtime.toISOString().slice(0, 10);
  const content = `
<div class="breadcrumbs">${crumbs.join(' <span class="crumb-sep">›</span> ')}</div>
<h1 class="page-title">${esc(p.title)}</h1>
<div class="page-sub">Un article du wiki <a href="{{ROOT}}w/${wiki.slug}/index.html">${wiki.icon} ${esc(wiki.name)}</a></div>
${infobox(p)}
${p.chapoHtml ? `<div class="chapo"><div class="chapo-label">${esc(p.chapoLabel)}</div>${p.chapoHtml}</div>` : ''}
${tocHtml}
<div class="page-body">
${p.html}
</div>
${blHtml}
<div class="page-meta">Dernière révision : ${esc(String(rev))} · <a href="{{ROOT}}graphe.html?focus=${encodeURIComponent(p.out)}">🕸️ Voir cette page dans le graphe</a></div>`;
  const html = pageShell({
    out: p.out, title: p.title, wikiKey: p.wikiKey, content,
    sidebarExtra: wikiSidebar(p.wikiKey, wikiSections[p.wikiKey]),
  }).replace(/\{\{ROOT\}\}/g, rootOf(p.out));
  const dest = path.join(OUT, p.out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}

// ---------- pages de catégorie (une par dossier) ----------
console.log('Pages de catégories…');

// Tri naturel : art-1, art-2, art-10 — et non art-1, art-10, art-100, art-11.
// Le numéro est lu dans le NOM DE FICHIER : le frontmatter `article: 312.100` est parsé
// en nombre par YAML et 312.1 / 312.10 / 312.100 s'effondreraient sur la même clé.
function numArticle(p) {
  const m = String(p.base).match(/^art[-.\s]*(\d+(?:\.\d+)*)/i);
  if (!m) return null;
  return m[1].split('.').map(Number);
}
function triNaturel(a, b) {
  const na = numArticle(a), nb = numArticle(b);
  if (na && nb) {
    for (let i = 0; i < Math.max(na.length, nb.length); i++) {
      const d = (na[i] ?? -1) - (nb[i] ?? -1);
      if (d) return d;
    }
    return a.base.localeCompare(b.base, 'fr');
  }
  if (na) return 1;   // les articles numérotés après les pages de structure
  if (nb) return -1;
  return a.title.localeCompare(b.title, 'fr', { numeric: true });
}
const dirsAll = new Set();
for (const p of pages) {
  const parts = p.relPath.split('/');
  for (let i = 1; i < parts.length; i++) dirsAll.add(parts.slice(0, i).join('/'));
}
for (const dir of dirsAll) {
  const parts = dir.split('/');
  const wikiKey = parts[0];
  const wiki = WIKIS[wikiKey];
  if (!wiki) continue;
  const isWikiRoot = parts.length === 1;
  const outDir = 'w/' + wiki.slug + (isWikiRoot ? '' : '/' + parts.slice(1).map(slugify).join('/'));
  const childDirs = [...dirsAll].filter(d => d.startsWith(dir + '/') && d.split('/').length === parts.length + 1)
    .sort((a, b) => a.localeCompare(b, 'fr'));
  const childPages = (pagesByDir.get(dir) || []).slice().sort(triNaturel);
  const countIn = (d) => pages.filter(p => p.relPath.startsWith(d + '/')).length;

  // page d'accueil de wiki : rediriger la catégorie racine vers la vraie page Accueil
  if (isWikiRoot) {
    const home = wikiHome(wikiKey);
    const target = home ? rootOf(outDir + '/index.html') + home.out : '';
    fs.mkdirSync(path.join(OUT, outDir), { recursive: true });
    fs.writeFileSync(path.join(OUT, outDir, 'index.html'),
      `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=${target}"><title>${esc(wiki.name)}</title></head><body><a href="${target}">${esc(wiki.name)}</a></body></html>`);
    continue;
  }
  const label = cleanLabel(parts[parts.length - 1]);
  const dirCards = childDirs.map(d => {
    const name = cleanLabel(d.split('/').pop());
    const url = 'w/' + wiki.slug + '/' + d.split('/').slice(1).map(slugify).join('/') + '/index.html';
    return `<a class="cat-card" href="{{ROOT}}${url}"><span class="cat-icon">📁</span><span><strong>${esc(name)}</strong><small>${countIn(d)} page${countIn(d) > 1 ? 's' : ''}</small></span></a>`;
  }).join('');
  // Sommaire : pages de structure (index, sections, chapitres) mises en avant.
  // Sans ça, les 32 pages « RSST - Section NN » se retrouvent en position 549 à 580.
  const estStructure = (p) => !numArticle(p) && /section|chapitre|index|sommaire|annexe|partie|^00 |^0\d /i.test(p.base);
  const structure = childPages.filter(estStructure);
  const articles = childPages.filter(p => !estStructure(p));
  const lien = (p) => `<li><a href="{{ROOT}}${p.out}">${esc(p.title)}</a></li>`;

  // regroupement par centaine d'articles au-delà de 60, pour casser le mur
  let blocsArticles = '';
  if (articles.length > 60 && articles.filter(numArticle).length > articles.length / 2) {
    const groupes = new Map();
    for (const p of articles) {
      const n = numArticle(p);
      const cle = n ? `${Math.floor(n[0] / 50) * 50 + 1}–${Math.floor(n[0] / 50) * 50 + 50}` : 'Autres';
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle).push(p);
    }
    const cles = [...groupes.keys()].sort((a, b) => (parseInt(a) || 1e9) - (parseInt(b) || 1e9));
    blocsArticles = `<div class="saut-nav">${cles.map(c => `<a href="#g-${slugify(c)}">art. ${esc(c)}</a>`).join(' · ')}</div>` +
      cles.map(c => `<h3 id="g-${slugify(c)}">Articles ${esc(c)}</h3><ul class="cat-pages">${groupes.get(c).map(lien).join('')}</ul>`).join('');
  } else if (articles.length) {
    blocsArticles = `<ul class="cat-pages">${articles.map(lien).join('')}</ul>`;
  }

  const crumbsCat = ['<a href="{{ROOT}}index.html">Portail</a>', `<a href="{{ROOT}}w/${wiki.slug}/index.html">${esc(wiki.name)}</a>`];
  let accCat = 'w/' + wiki.slug;
  for (let i = 1; i < parts.length - 1; i++) {
    accCat += '/' + slugify(parts[i]);
    crumbsCat.push(`<a href="{{ROOT}}${accCat}/index.html">${esc(cleanLabel(parts[i]))}</a>`);
  }

  const content = `
<div class="breadcrumbs">${crumbsCat.join(' <span class="crumb-sep">›</span> ')}</div>
<h1 class="page-title">Catégorie : ${esc(label)}</h1>
<div class="page-sub">${childPages.length} page${childPages.length > 1 ? 's' : ''}${childDirs.length ? ` · ${childDirs.length} sous-catégorie${childDirs.length > 1 ? 's' : ''}` : ''} — wiki ${esc(wiki.name)}</div>
${dirCards ? `<h2>Sous-catégories</h2><div class="cat-grid">${dirCards}</div>` : ''}
${structure.length ? `<h2>Sommaire</h2><ul class="cat-pages cat-structure">${structure.map(lien).join('')}</ul>` : ''}
${blocsArticles ? `<h2>${structure.length ? 'Articles' : 'Pages'}</h2>${blocsArticles}` : ''}`;
  const outPath = outDir + '/index.html';
  const html = pageShell({ out: outPath, title: 'Catégorie : ' + label, wikiKey, content, sidebarExtra: wikiSidebar(wikiKey, wikiSections[wikiKey]) })
    .replace(/\{\{ROOT\}\}/g, rootOf(outPath));
  fs.mkdirSync(path.join(OUT, outDir), { recursive: true });
  fs.writeFileSync(path.join(OUT, outPath), html);
}

// ---------- index alphabétique par wiki ----------
for (const [wikiKey, wiki] of Object.entries(WIKIS)) {
  const toutes = pages.filter(p => p.wikiKey === wikiKey);
  // Les articles de loi (3362 entrées toutes sous « A ») partent dans leur propre index par loi,
  // sinon les vraies entrées en A (ACGIH, amiante, assignation temporaire) sont noyées.
  const articlesLoi = toutes.filter(p => p.fm.loi && numArticle(p));
  const list = toutes.filter(p => !(p.fm.loi && numArticle(p))).sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  const groups = new Map();
  for (const p of list) {
    const c = p.title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
    const g = /[A-Z]/.test(c) ? c : /[0-9]/.test(c) ? '0-9' : '#';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(p);
  }
  const letters = [...groups.keys()].sort();
  const nav = letters.map(l => `<a href="#lettre-${l}">${l}</a>`).join(' · ');
  const sections = letters.map(l =>
    `<h2 id="lettre-${l}">${l} <a class="retour-haut" href="#haut">↑ haut</a></h2><ul class="cat-pages">${groups.get(l).map(p => `<li><a href="{{ROOT}}${p.out}">${esc(p.title)}</a></li>`).join('')}</ul>`).join('');
  const outPath = `w/${wiki.slug}/index-alphabetique.html`;

  // index par loi : classe les articles par loi puis par numéro, au lieu de 3362 lignes sous « A »
  let lienIndexLoi = '';
  if (articlesLoi.length) {
    const parLoi = new Map();
    for (const p of articlesLoi) {
      const l = String(p.fm.loi).trim();
      if (!parLoi.has(l)) parLoi.set(l, []);
      parLoi.get(l).push(p);
    }
    const lois = [...parLoi.keys()].sort((a, b) => parLoi.get(b).length - parLoi.get(a).length);
    const outLoi = `w/${wiki.slug}/index-par-loi.html`;
    const contenuLoi = `
<div class="breadcrumbs"><a href="{{ROOT}}index.html">Portail</a> <span class="crumb-sep">›</span> <a href="{{ROOT}}w/${wiki.slug}/index.html">${esc(wiki.name)}</a></div>
<h1 class="page-title" id="haut">Index par loi et par article</h1>
<div class="page-sub">${articlesLoi.length} articles répartis dans ${lois.length} lois et règlements</div>
<div class="letters-nav">${lois.map(l => `<a href="#loi-${slugify(l)}">${esc(l)}</a>`).join(' · ')}</div>
${lois.map(l => `<h2 id="loi-${slugify(l)}">${esc(l)} <small>(${parLoi.get(l).length} articles)</small> <a class="retour-haut" href="#haut">↑ haut</a></h2>
<ul class="cat-pages">${parLoi.get(l).sort(triNaturel).map(p => `<li><a href="{{ROOT}}${p.out}">${esc(p.title)}</a></li>`).join('')}</ul>`).join('')}`;
    fs.writeFileSync(path.join(OUT, outLoi),
      pageShell({ out: outLoi, title: 'Index par loi — ' + wiki.name, wikiKey, content: contenuLoi, sidebarExtra: wikiSidebar(wikiKey, wikiSections[wikiKey]) })
        .replace(/\{\{ROOT\}\}/g, rootOf(outLoi)));
    lienIndexLoi = `<p class="encart-nav">📜 Les ${articlesLoi.length} articles de loi sont classés à part : <a href="{{ROOT}}w/${wiki.slug}/index-par-loi.html"><strong>Index par loi et par article</strong></a></p>`;
  }

  const content = `
<div class="breadcrumbs"><a href="{{ROOT}}index.html">Portail</a> <span class="crumb-sep">›</span> <a href="{{ROOT}}w/${wiki.slug}/index.html">${esc(wiki.name)}</a></div>
<h1 class="page-title" id="haut">Index alphabétique — ${esc(wiki.name)}</h1>
<div class="page-sub">${list.length} page${list.length > 1 ? 's' : ''}</div>
${lienIndexLoi}
<div class="letters-nav">${nav}</div>
${sections}`;
  const html = pageShell({ out: outPath, title: 'Index — ' + wiki.name, wikiKey, content, sidebarExtra: wikiSidebar(wikiKey, wikiSections[wikiKey]) })
    .replace(/\{\{ROOT\}\}/g, rootOf(outPath));
  fs.writeFileSync(path.join(OUT, outPath), html);
}

// ---------- espace de noms « Catégorie: » ----------
// Le mécanisme central de Wikipédia : chaque mot-clé du frontmatter devient une page
// qui liste les articles qui le portent. Les étiquettes de l'infobox deviennent cliquables.
console.log('Catégories…');

fs.mkdirSync(path.join(OUT, 'categorie'), { recursive: true });
for (const [tag, membres] of categories) {
  const outPath = `categorie/${slugTag.get(tag)}.html`;
  // Regroupement par domaine : un tag comme « bruit » traverse plusieurs wikis.
  const parWiki = new Map();
  for (const p of membres) {
    if (!parWiki.has(p.wikiKey)) parWiki.set(p.wikiKey, []);
    parWiki.get(p.wikiKey).push(p);
  }
  const sections = [...parWiki.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([wk, pgs]) => `<h2>${WIKIS[wk].icon} ${esc(WIKIS[wk].name)} <small>(${pgs.length})</small></h2>
<ul class="cat-pages">${pgs.sort(triNaturel).map(p => `<li><a href="{{ROOT}}${p.out}">${esc(p.title)}</a></li>`).join('')}</ul>`)
    .join('');
  const voisins = categories
    .filter(([t]) => t !== tag && parTag.get(t).some(p => membres.includes(p)))
    .slice(0, 12)
    .map(([t]) => `<a class="tag tag-lien" href="{{ROOT}}categorie/${slugTag.get(t)}.html">${esc(t)}</a>`)
    .join('');
  const content = `
<div class="breadcrumbs"><a href="{{ROOT}}index.html">Portail</a> <span class="crumb-sep">›</span> <a href="{{ROOT}}categories.html">Catégories</a></div>
<h1 class="page-title">Catégorie : ${esc(tag)}</h1>
<div class="page-sub">${membres.length} page${membres.length > 1 ? 's' : ''} portent ce mot-clé, réparties dans ${parWiki.size} domaine${parWiki.size > 1 ? 's' : ''}.</div>
${sections}
${voisins ? `<h2>Mots-clés souvent associés</h2><div class="infobox-tags">${voisins}</div>` : ''}`;
  fs.writeFileSync(path.join(OUT, outPath),
    pageShell({ out: outPath, title: 'Catégorie : ' + tag, wikiKey: null, content })
      .replace(/\{\{ROOT\}\}/g, rootOf(outPath)));
}

// index de toutes les catégories
{
  const groupes = new Map();
  for (const [tag, membres] of categories) {
    const c = tag.normalize('NFKD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase();
    const g = /[A-Z]/.test(c) ? c : '#';
    if (!groupes.has(g)) groupes.set(g, []);
    groupes.get(g).push([tag, membres.length]);
  }
  const lettres = [...groupes.keys()].sort();
  const content = `
<div class="breadcrumbs"><a href="{{ROOT}}index.html">Portail</a></div>
<h1 class="page-title" id="haut">Catégories</h1>
<div class="page-sub">${categories.length} mots-clés portés par au moins ${SEUIL_CATEGORIE} pages. Chaque catégorie regroupe les articles qui traitent du même sujet, tous domaines confondus.</div>
<div class="letters-nav">${lettres.map(l => `<a href="#lettre-${l}">${l}</a>`).join(' · ')}</div>
${lettres.map(l => `<h2 id="lettre-${l}">${l} <a class="retour-haut" href="#haut">↑ haut</a></h2>
<ul class="cat-pages">${groupes.get(l).sort((a, b) => a[0].localeCompare(b[0], 'fr')).map(([t, n]) => `<li><a href="{{ROOT}}categorie/${slugTag.get(t)}.html">${esc(t)}</a> <small class="cat-compte">${n}</small></li>`).join('')}</ul>`).join('')}`;
  fs.writeFileSync(path.join(OUT, 'categories.html'),
    pageShell({ out: 'categories.html', title: 'Catégories', wikiKey: null, content })
      .replace(/\{\{ROOT\}\}/g, ''));
}
console.log(`  ${categories.length} catégories générées (seuil : ${SEUIL_CATEGORIE} pages)`);

// ---------- tableau de bord qualité ----------
// Il ne juge pas le fond : il signale ce qu'un lecteur verrait qui cloche, et rien d'autre.
console.log('Contrôle qualité…');
const rapportQualite = [];
for (const p of pages) {
  const r = analyserQualite(p);
  if (r.defauts.length) rapportQualite.push({ p, ...r });
}
rapportQualite.sort((a, b) => b.score - a.score || a.p.title.localeCompare(b.p.title, 'fr'));

{
  const parCode = new Map();
  for (const r of rapportQualite) for (const d of r.defauts) parCode.set(d.code, (parCode.get(d.code) || 0) + 1);
  const codes = [...parCode.entries()].sort((a, b) => b[1] - a[1]);

  const lignes = rapportQualite.slice(0, 250).map(r => `<tr>
    <td><a href="{{ROOT}}${r.p.out}">${esc(r.p.title)}</a><br><small class="q-chemin">${esc(WIKIS[r.p.wikiKey].name)}</small></td>
    <td class="q-mots">${r.mots}</td>
    <td>${r.defauts.map(d => `<span class="q-etiq q-g${d.gravite}" title="${esc(d.texte)}">${esc(LIBELLES[d.code] || d.code)}</span>`).join(' ')}</td>
  </tr>`).join('');

  const total = pages.length;
  const saines = total - rapportQualite.length;
  const content = `
<div class="breadcrumbs"><a href="{{ROOT}}index.html">Portail</a></div>
<h1 class="page-title">Qualité rédactionnelle</h1>
<div class="page-sub">${saines.toLocaleString('fr-CA')} pages sur ${total.toLocaleString('fr-CA')} ne présentent aucun défaut détecté (${Math.round(saines / total * 100)} %). Cette page liste les autres, les plus atteintes d'abord.</div>

<div class="callout callout-info"><div class="callout-title"><span class="callout-icon">ℹ️</span>Ce que cette page mesure — et ce qu'elle ne mesure pas</div><div class="callout-body">
<p>Elle repère des défauts <strong>mécaniques</strong> : un texte coupé, une section annoncée mais vide, une mention « à compléter » restée visible, une référence sans auteur ni année. Elle ne juge <strong>ni la justesse ni l'intérêt</strong> du contenu : une page peut être irréprochable ici et rester à étoffer, ou apparaître ci-dessous alors qu'elle est excellente sur le fond.</p>
</div></div>

<h2>Défauts par type</h2>
<table class="q-resume">
<tr><th>Défaut</th><th>Pages touchées</th><th>Ce que voit le lecteur</th></tr>
${codes.map(([c, n]) => {
  const ex = rapportQualite.find(r => r.defauts.some(d => d.code === c));
  const d = ex.defauts.find(x => x.code === c);
  return `<tr><td><strong>${esc(LIBELLES[c] || c)}</strong></td><td class="q-mots">${n}</td><td>${esc(d.texte)}</td></tr>`;
}).join('')}
</table>

<h2>Pages à reprendre</h2>
<p class="portal-note">${rapportQualite.length} pages présentent au moins un défaut${rapportQualite.length > 250 ? ' — les 250 plus atteintes sont listées' : ''}.</p>
<table class="q-table">
<tr><th>Page</th><th>Mots</th><th>Défauts</th></tr>
${lignes}
</table>`;
  fs.writeFileSync(path.join(OUT, 'qualite.html'),
    pageShell({ out: 'qualite.html', title: 'Qualité rédactionnelle', wikiKey: null, content })
      .replace(/\{\{ROOT\}\}/g, ''));

  // récapitulatif dans la console : c'est là que Frank verra le travail à faire
  console.log(`  ${rapportQualite.length} page(s) avec au moins un défaut · ${saines} page(s) sans défaut détecté`);
  for (const [c, n] of codes) console.log(`    ${String(n).padStart(4)} × ${LIBELLES[c] || c}`);
}

// ---------- graphe des liens, façon Obsidian ----------
console.log('Graphe des liens…');
{
  const wikisListe = Object.keys(WIKIS);
  const indexDe = new Map(pages.map((p, i) => [p, i]));
  const aretes = new Set();
  for (const p of pages) {
    for (const cible of (p.liens || [])) {
      const a = indexDe.get(p), b = indexDe.get(cible);
      if (b === undefined || a === b) continue;
      aretes.add(a < b ? a + ',' + b : b + ',' + a);
    }
  }
  const graphe = {
    wikis: wikisListe.map(k => WIKIS[k].name),
    n: pages.map(p => ({ t: p.title, u: p.out, w: wikisListe.indexOf(p.wikiKey) })),
    e: [...aretes].map(s => s.split(',').map(Number)),
  };
  fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'assets', 'graphe.json'), JSON.stringify(graphe));

  // les deux vues partagent les mêmes données et la même barre d'outils
  const pageGraphe = (mode) => {
    const est3d = mode === '3d';
    const client = fs.readFileSync(path.join(__dirname, est3d ? 'graphe3d_client.js' : 'graphe_client.js'), 'utf8');
    const autre = est3d
      ? `<a class="graphe-bascule" href="{{ROOT}}graphe.html" id="lien-vue">◱ Vue 2D</a>`
      : `<a class="graphe-bascule" href="{{ROOT}}graphe3d.html" id="lien-vue">◲ Vue 3D</a>`;
    const aide = est3d
      ? 'Glisser pour tourner, molette pour zoomer, cliquer pour ouvrir la page. Le graphe tourne tout seul tant que vous n’y touchez pas.'
      : 'Molette pour zoomer, glisser pour déplacer, cliquer pour ouvrir la page.';
    return `
<div class="breadcrumbs"><a href="{{ROOT}}index.html">Portail</a></div>
<h1 class="page-title">Graphe des liens${est3d ? ' — 3D' : ''}<span id="graphe-titre" class="graphe-titre"></span></h1>
<div class="page-sub" id="graphe-etat">${pages.length.toLocaleString('fr-CA')} pages · ${aretes.size.toLocaleString('fr-CA')} liens. ${aide} Le Recueil législatif est masqué par défaut : cochez-le pour l'afficher.</div>
<div class="graphe-barre">
  ${autre}
  ${est3d ? '<button class="graphe-bascule" id="graphe-rotation">⏸ Arrêter la rotation</button>' : ''}
  <input type="search" id="graphe-q" placeholder="Trouver une page dans le graphe…" autocomplete="off">
  <div id="graphe-filtres" class="graphe-filtres"></div>
</div>
<div class="graphe-cadre"><button id="graphe-plein" class="graphe-plein" aria-label="Plein écran" title="Plein écran">⛶</button><canvas id="graphe"></canvas></div>
<script>
// la bascule 2D/3D conserve la page en focus
(function(){var f=new URLSearchParams(location.search).get('focus');if(f){var l=document.getElementById('lien-vue');l.href+='?focus='+encodeURIComponent(f);}})();
${client}</script>`;
  };
  fs.writeFileSync(path.join(OUT, 'graphe.html'),
    pageShell({ out: 'graphe.html', title: 'Graphe des liens', wikiKey: null, content: pageGraphe('2d') })
      .replace(/\{\{ROOT\}\}/g, ''));
  fs.writeFileSync(path.join(OUT, 'graphe3d.html'),
    pageShell({ out: 'graphe3d.html', title: 'Graphe des liens 3D', wikiKey: null, content: pageGraphe('3d') })
      .replace(/\{\{ROOT\}\}/g, ''));
  console.log(`  ${aretes.size} liens entre ${pages.length} pages · vues 2D et 3D`);
}

// ---------- index de recherche ----------
console.log('Index de recherche…');
const searchIndex = pages.map(p => {
  const e = {
    t: p.title,
    u: p.out,
    w: WIKIS[p.wikiKey].name,
    i: WIKIS[p.wikiKey].icon,
    // tags + alias + nom de fichier : le nom porte souvent un mot absent du H1 (« art-11-LATMP, exclusions »)
    g: [
      ...(Array.isArray(p.fm.tags) ? p.fm.tags : []),
      ...(Array.isArray(p.fm.aliases) ? p.fm.aliases : []),
      p.base !== p.title ? p.base : '',
    ].filter(Boolean).join(' '),
    x: extrait(p.body),
  };
  // chemin de catégorie : distingue les 31 groupes de pages homonymes
  const cat = p.relPath.split('/').slice(1, -1).map(cleanLabel).filter(Boolean).join(' › ');
  if (cat) e.c = cat;
  // 2 = ébauche, 1 = article abrogé/remplacé → dépriorisés dans les résultats
  if (/Stub créé automatiquement|page vide à documenter/i.test(p.body)) e.q = 2;
  else if (/Article abrogé|Article remplacé|disposition remplacée/i.test(stripMd(p.body).slice(0, 400))) e.q = 1;
  return e;
});
searchIndex.push({ t: 'Graphe des liens 3D', u: 'graphe3d.html', w: 'Outil', i: '🕸️', g: 'graphe 3d liens réseau obsidian', x: 'Le réseau des pages en trois dimensions, en rotation libre.' });
searchIndex.push({ t: 'Graphe des liens', u: 'graphe.html', w: 'Outil', i: '🕸️', g: 'graphe liens réseau obsidian', x: 'Toutes les pages et leurs liens, en réseau interactif.' });
searchIndex.push({ t: 'Qualité rédactionnelle', u: 'qualite.html', w: 'Outil', i: '🔧', g: 'qualité relecture ébauche atelier', x: `${rapportQualite.length} pages présentent au moins un défaut de forme.` });
// Les catégories sont cherchables au même titre que les articles.
for (const [tag, membres] of categories) {
  searchIndex.push({
    t: 'Catégorie : ' + tag,
    u: 'categorie/' + slugTag.get(tag) + '.html',
    w: 'Catégorie', i: '🏷️',
    g: tag,
    x: `${membres.length} pages portent ce mot-clé.`,
  });
}
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'assets', 'search-index.json'), JSON.stringify(searchIndex));

// ---------- page de recherche ----------
{
  const content = `
<h1 class="page-title">Résultats de la recherche</h1>
<div class="page-sub" id="search-count"></div>
<div id="search-results" class="search-results"></div>`;
  const html = pageShell({ out: 'recherche.html', title: 'Recherche', wikiKey: null, content })
    .replace(/\{\{ROOT\}\}/g, '');
  fs.writeFileSync(path.join(OUT, 'recherche.html'), html);
}

// ---------- wikis par public (travailleurs / encadrement) ----------
// Chaque public a son portail, sa navigation et ses pages. Le Recueil législatif n'est pas
// dupliqué : le texte de loi est public et identique pour tous, les deux wikis y renvoient.
const PUBLICS = {
  t: {
    slug: 't', icon: '👷', nom: 'Wiki des travailleurs',
    tagline: 'Tes droits, ta santé, ta sécurité — expliqué simplement',
    intro: 'Ce wiki est écrit pour toi qui travailles à la mine. Tu y trouves ce qu\'il faut savoir sur les risques du métier, ce que la loi te garantit, et où trouver de l\'aide.',
  },
  g: {
    slug: 'g', icon: '🎓', nom: 'Wiki de l\'encadrement',
    tagline: 'Superviseurs, gestionnaires et direction — obligations, programmes et outils',
    intro: 'Ce wiki réunit ce qu\'un superviseur, un gestionnaire ou un dirigeant doit connaître : obligations légales, programmes de prévention, gestion des situations et outils de suivi.',
  },
};

// Rubriques du portail travailleurs : on entre par le problème vécu, pas par la discipline.
const RUBRIQUES_T = [
  { titre: 'J\'ai mal quelque part', icone: '🤕', mots: ['postures', 'manutention', 'travail répétitif', 'vibrations', 'tms'] },
  { titre: 'Je respire quelque chose', icone: '😷', mots: ['poussières', 'diesel', 'silice', 'solvants', 'gaz', 'simdut', 'amiante'] },
  { titre: 'Il fait trop chaud, j\'entends moins bien', icone: '🌡️', mots: ['chaleur', 'bruit', 'froid', 'thermique'] },
  { titre: 'Ça ne va pas dans ma tête', icone: '🧠', mots: ['détresse', 'santé mentale', 'stress', 'aide', 'pae', 'appeler', 'rps'] },
  { titre: 'Je ne dors plus', icone: '😴', mots: ['sommeil', 'fatigue', 'quart de nuit', 'récupération'] },
  { titre: 'Ça chauffe avec l\'équipe ou le boss', icone: '💬', mots: ['équipe', 'reconnaissance', 'conflit', 'harcèlement', 'soutien'] },
  { titre: 'Est-ce que j\'ai le droit ?', icone: '⚖️', mots: ['droit de refus', 'réclamation', 'retour au travail', 'droits', 'lésion'] },
  { titre: 'C\'est dangereux ici', icone: '⚠️', mots: ['danger', 'presqu', 'cadenassage', 'espaces clos', 'machines', 'protection'] },
  { titre: 'La vie au camp', icone: '🏕️', mots: ['camp', 'fifo', 'famille', 'séjour'] },
];

const RUBRIQUES_G = [
  { titre: 'Mes obligations légales', icone: '📋', mots: ['obligation', 'diligence', 'conformité', 'inspecteur', 'infraction', 'tarification', 'lmrsst'] },
  { titre: 'Programmes et prévention', icone: '🛠️', mots: ['programme', 'prévention', 'aménagement', 'conception', 'politique', 'surveillance'] },
  { titre: 'Gérer une situation', icone: '🚨', mots: ['accident', 'lésion', 'retour au travail', 'assignation', 'réclamation', 'refus', 'enquête'] },
  { titre: 'Évaluer et mesurer', icone: '📊', mots: ['évaluation', 'mesure', 'questionnaire', 'indicateur', 'score', 'grille', 'analyse'] },
];

function genererWikiPublic(pub) {
  const conf = PUBLICS[pub];
  const pagesPub = pages.filter(p => p.publics.has(pub));
  const horsLoi = pagesPub.filter(p => p.wikiKey !== 'Recueil législatif SST');
  PUB = pub;

  // --- pages de l'arbre (le Recueil reste dans le fond documentaire, non dupliqué) ---
  for (const p of horsLoi) {
    CUR = p; p.toc = []; p.headIds = new Set(); CUR_LINKS = new Set();
    const corps = finalize(renderBody(p.body));
    blocks.length = 0;
    const out = pub + '/' + p.out;
    const R = rootOf(out);
    const wiki = WIKIS[p.wikiKey];
    const tocHtml = p.toc.length >= 3
      ? `<nav class="toc" aria-label="Sommaire de la page"><div class="toc-title">Sommaire <span class="toc-compte">${p.toc.filter(t => t.lv === 2).length || p.toc.length} sections</span> <button class="toc-toggle" aria-expanded="true">[masquer]</button></div><ul>${p.toc.map(t => `<li class="toc-l${t.lv}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul></nav>`
      : '';
    const contenu = `
<div class="breadcrumbs"><a href="{{ROOT}}${pub}/index.html">${conf.icon} ${esc(conf.nom)}</a> <span class="crumb-sep">›</span> ${esc(wiki.name)}</div>
<h1 class="page-title">${esc(p.title)}</h1>
<div class="page-sub">${wiki.icon} ${esc(wiki.name)}</div>
${tocHtml}
<div class="page-body">
${corps}
</div>
<div class="page-meta">Dernière révision : ${esc(String(p.fm['révision'] || p.fm['revision'] || p.mtime.toISOString().slice(0, 10)))} · <a href="{{ROOT}}${p.out}">Voir cette page dans le fond documentaire</a></div>`;
    const html = pageShell({ out, title: p.title, wikiKey: null, content: contenu, sidebarExtra: sidebarPublic(pub) })
      .replace(/\{\{ROOT\}\}/g, R);
    const dest = path.join(OUT, out);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, html);
  }

  // --- rubriques du portail, remplies avec les pages réellement disponibles ---
  // Comparaison sur des mots entiers normalisés : « équipe » ne doit pas attraper « équipements ».
  const motsDe = (s) => ' ' + String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  const contientExpression = (texte, expr) => texte.includes(' ' + motsDe(expr).trim() + ' ');

  const accueils = horsLoi.filter(p => /accueil|démarrage|bienvenue/i.test(p.title) || /^\d+ - Articles/.test(p.base));
  const articles = horsLoi.filter(p => !accueils.includes(p));

  // Le vault contient souvent deux versions du même sujet : « Manutention (travailleurs) » et
  // « Manutention (pour toi) ». On n'en montre qu'une, en préférant la formulation vulgarisée.
  const sujetDe = (p) => motsDe(p.title.replace(/\s*\([^)]*\)\s*$/, '')).trim();
  const vulgarisee = (p) => /\(pour toi\)/i.test(p.title);
  const meilleure = new Map();
  for (const p of articles) {
    const s = sujetDe(p);
    const dejaLa = meilleure.get(s);
    if (!dejaLa || (vulgarisee(p) && !vulgarisee(dejaLa))) meilleure.set(s, p);
  }
  const articlesUniques = [...meilleure.values()];

  const rubriques = (pub === 't' ? RUBRIQUES_T : RUBRIQUES_G).map(r => {
    const membres = articlesUniques.filter(p => {
      const t = motsDe(p.title + ' ' + p.relPath);
      return r.mots.some(m => contientExpression(t, m));
    });
    return { ...r, membres };
  });
  const casees = new Set(rubriques.flatMap(r => r.membres));
  const autres = articlesUniques.filter(p => !casees.has(p));

  const carte = (r) => `<section class="rubrique">
  <h2><span class="rub-icone">${r.icone}</span> ${esc(r.titre)}</h2>
  ${r.membres.length
    ? `<ul class="rub-liste">${r.membres.slice(0, 14).map(p => `<li><a href="{{ROOT}}${pub}/${p.out}">${esc(p.title)}</a></li>`).join('')}</ul>`
    : `<p class="rub-vide">Aucune page publiée pour l'instant sur ce sujet.</p>`}
</section>`;

  const lienLoi = pub === 't'
    ? `<a class="portal-card" href="{{ROOT}}w/legislation/index-par-loi.html"><span class="portal-icon">⚖️</span><span class="portal-info"><strong>Ce que dit la loi</strong><span class="portal-desc">Les articles de loi qui fondent tes droits : refus de travail, retrait préventif, réclamation, retour au travail.</span><span class="portal-count">${pagesPub.length - horsLoi.length} articles de loi</span></span></a>`
    : `<a class="portal-card" href="{{ROOT}}w/legislation/index-par-loi.html"><span class="portal-icon">⚖️</span><span class="portal-info"><strong>Le cadre légal</strong><span class="portal-desc">Lois et règlements applicables, article par article : obligations de l'employeur, mécanismes de prévention, sanctions.</span><span class="portal-count">${pagesPub.length - horsLoi.length} articles de loi</span></span></a>`;

  const urgence = pub === 't' ? `
<div class="encart-urgence">
  <strong>☎ Ça ne va pas ?</strong>
  <span>Urgence <a href="tel:911">911</a> · Info-Santé <a href="tel:811">811</a> (option 2 pour Info-Social) · Prévention du suicide <a href="tel:988">988</a></span>
</div>` : '';

  const contenu = `
<div class="portal-hero">
  <div class="portal-globe">${conf.icon}</div>
  <h1>${esc(conf.nom)}</h1>
  <p class="portal-tagline">${esc(conf.tagline)}</p>
  <div class="portal-search"><input type="search" id="q2" placeholder="Rechercher…" autocomplete="off"><div id="suggest2" class="suggest" hidden></div></div>
</div>
${urgence}
<p class="portal-intro">${esc(conf.intro)}</p>
${accueils.length ? `<section class="rubrique"><h2><span class="rub-icone">🚩</span> Pour commencer</h2><ul class="rub-liste">${accueils.map(p => `<li><a href="{{ROOT}}${pub}/${p.out}">${esc(p.title)}</a> <small class="rub-domaine">${WIKIS[p.wikiKey].icon} ${esc(WIKIS[p.wikiKey].name)}</small></li>`).join('')}</ul></section>` : ''}
<div class="portal-grid">${lienLoi}</div>
${rubriques.map(carte).join('')}
${autres.length ? `<section class="rubrique"><h2><span class="rub-icone">📄</span> Autres pages</h2><ul class="rub-liste">${autres.map(p => `<li><a href="{{ROOT}}${pub}/${p.out}">${esc(p.title)}</a></li>`).join('')}</ul></section>` : ''}
<div class="portal-foot"><a href="{{ROOT}}index.html">← Retour à l'accueil du wiki</a></div>`;

  fs.mkdirSync(path.join(OUT, pub), { recursive: true });
  if (pub === 'g') {
    // L'encadrement a son propre portail, en tableau de bord.
    const { html: corps, morts } = rendrePortailEncadrement({
      R: '../',
      nbLois: pagesPub.length - horsLoi.length,
      majDate: new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }),
      verifier: (c) => existeDansLeSite(c),
    });
    if (morts.length) console.warn(`  ⚠ portail encadrement : ${morts.length} cible(s) introuvable(s) — ${morts.slice(0, 4).join(', ')}`);
    fs.writeFileSync(path.join(OUT, pub, 'index.html'), pageTableauDeBord({
      out: pub + '/index.html', titre: conf.nom, corps,
    }));
  } else {
    fs.writeFileSync(path.join(OUT, pub, 'index.html'), pageAutonome({
      out: pub + '/index.html', titre: conf.nom, contenu,
    }));
  }

  PUB = null;
  return { total: pagesPub.length, horsLoi: horsLoi.length, rubriques };
}

function sidebarPublic(pub) {
  const conf = PUBLICS[pub];
  const autre = pub === 't' ? PUBLICS.g : PUBLICS.t;
  return `<div class="nav-group"><div class="nav-title">${conf.icon} ${esc(conf.nom)}</div>
  <ul>
    <li><a href="{{ROOT}}${pub}/index.html">Accueil</a></li>
    <li><a href="{{ROOT}}w/legislation/index-par-loi.html">Les articles de loi</a></li>
    <li><a href="{{ROOT}}${autre.slug}/index.html">${autre.icon} ${esc(autre.nom)}</a></li>
    <li><a href="{{ROOT}}index.html">🏠 Tous les wikis</a></li>
  </ul></div>`;
}

// Une cible du portail existe-t-elle réellement dans le site généré ?
// Un renommage dans Obsidian ne doit pas laisser un lien mort en page d'accueil.
function existeDansLeSite(cible) {
  return fs.existsSync(path.join(OUT, cible.split('#')[0]));
}

// Gabarit du portail en tableau de bord : sa propre feuille de style, pas de barre latérale commune.
function pageTableauDeBord({ out, titre, corps }) {
  const R = rootOf(out);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titre)} — WIKI SST Mines</title>
<link rel="stylesheet" href="${R}assets/portail.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⛏️</text></svg>">
<script>window.ROOT='${R}';${SCRIPT_THEME}</script>
</head>
<body class="tb">
${corps}
<script src="${R}assets/app.js"></script>
</body>
</html>`;
}

// Page autonome (portail) : même habillage que le portail racine, sans barre latérale.
function pageAutonome({ out, titre, contenu }) {
  const R = rootOf(out);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titre)} — WIKI SST Mines</title>
<link rel="stylesheet" href="${R}assets/style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⛏️</text></svg>">
<script>window.ROOT='${R}';${SCRIPT_THEME}</script>
</head>
<body class="portal"><button class="btn-theme theme-portail" id="btnTheme" aria-label="Changer de thème" title="Changer de thème"></button>
<main class="portal-main">${contenu.replace(/\{\{ROOT\}\}/g, R)}</main>
<footer class="site-footer">WIKI SST — Mines<span id="version"></span></footer>
<script src="${R}assets/app.js"></script>
</body>
</html>`;
}

console.log('Wikis par public…');
const statT = genererWikiPublic('t');
const statG = genererWikiPublic('g');
console.log(`  👷 travailleurs : ${statT.horsLoi} pages + ${statT.total - statT.horsLoi} articles de loi`);
console.log(`  🎓 encadrement  : ${statG.horsLoi} pages + ${statG.total - statG.horsLoi} articles de loi`);

// ---------- portail ----------
{
  const counts = {};
  for (const p of pages) counts[p.wikiKey] = (counts[p.wikiKey] || 0) + 1;
  const cards = Object.entries(WIKIS).map(([k, w]) => {
    const home = wikiHome(k);
    return `<a class="portal-card" href="${home ? home.out : 'w/' + w.slug + '/index.html'}">
      <span class="portal-icon">${w.icon}</span>
      <span class="portal-info"><strong>${esc(w.name)}</strong><span class="portal-desc">${esc(w.desc)}</span><span class="portal-count">${counts[k] || 0} articles</span></span>
    </a>`;
  }).join('');
  const total = pages.length;
  const content = `
<div class="portal-hero">
  <div class="portal-globe">⛏️</div>
  <h1>WIKI SST — Mines</h1>
  <p class="portal-tagline">L'encyclopédie santé et sécurité du travail en milieu minier<br>${total.toLocaleString('fr-CA')} articles en français · construite à partir des notes de cours</p>
  <div class="portal-search"><input type="search" id="q2" placeholder="Rechercher parmi ${total.toLocaleString('fr-CA')} articles…" autocomplete="off"><div id="suggest2" class="suggest" hidden></div></div>
</div>
<h2 class="portal-section">Deux wikis selon qui tu es</h2>
<div class="portal-grid portal-publics">
  <a class="portal-card carte-public" href="t/index.html">
    <span class="portal-icon">👷</span>
    <span class="portal-info"><strong>Je suis travailleur</strong><span class="portal-desc">${esc(PUBLICS.t.tagline)}</span><span class="portal-count">${statT.horsLoi} pages + les articles de loi</span></span>
  </a>
  <a class="portal-card carte-public" href="g/index.html">
    <span class="portal-icon">🎓</span>
    <span class="portal-info"><strong>Je supervise ou je dirige</strong><span class="portal-desc">${esc(PUBLICS.g.tagline)}</span><span class="portal-count">${statG.horsLoi} pages + les articles de loi</span></span>
  </a>
</div>
<h2 class="portal-section">Le fond documentaire complet</h2>
<p class="portal-note">Les ${total.toLocaleString('fr-CA')} pages, classées par discipline. Destiné au conseiller SST et à la recherche documentaire.</p>
<div class="portal-grid">${cards}</div>
<h2 class="portal-section">Parcourir par sujet</h2>
<div class="portal-grid">
  <a class="portal-card" href="categories.html">
    <span class="portal-icon">🏷️</span>
    <span class="portal-info"><strong>Catégories</strong><span class="portal-desc">Les mots-clés qui traversent les disciplines : bruit, explosifs, espaces clos, silice… Chaque catégorie réunit les articles du même sujet, quel que soit le domaine.</span><span class="portal-count">${categories.length} catégories</span></span>
  </a>
  <a class="portal-card" href="qualite.html">
    <span class="portal-icon">🔧</span>
    <span class="portal-info"><strong>Qualité rédactionnelle</strong><span class="portal-desc">Atelier de l'auteur : les pages dont le texte est coupé, les sections restées vides, les mentions « à compléter » encore visibles. Les plus atteintes d'abord.</span><span class="portal-count">${rapportQualite.length} pages à reprendre</span></span>
  </a>
</div>
<div class="portal-foot">
  <a href="#" id="randomLink2">🎲 Une page au hasard</a>
</div>`;
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WIKI SST — Mines · Portail</title>
<link rel="stylesheet" href="assets/style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⛏️</text></svg>">
<script>window.ROOT='';${SCRIPT_THEME}</script>
</head>
<body class="portal"><button class="btn-theme theme-portail" id="btnTheme" aria-label="Changer de thème" title="Changer de thème"></button>
<main class="portal-main">${content}</main>
<footer class="site-footer">WIKI SST — Mines · encyclopédie interne<span id="version"></span></footer>
<script src="assets/app.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
}

// ---------- assets statiques ----------
fs.writeFileSync(path.join(OUT, 'assets', 'style.css'), style);
fs.writeFileSync(path.join(OUT, 'assets', 'app.js'), appjs);
fs.writeFileSync(path.join(OUT, 'assets', 'portail.css'), fs.readFileSync(path.join(__dirname, 'portail.css'), 'utf8'));
fs.writeFileSync(path.join(OUT, '.nojekyll'), ''); // GitHub Pages : ne pas passer par Jekyll

// La date de génération vit dans un seul fichier, lu par le pied de page. Écrite dans les
// 4970 pages, elle changeait tout le site à chaque reconstruction — ~60 Mo de dépôt pour une date.
fs.writeFileSync(path.join(OUT, 'assets', 'version.json'), JSON.stringify({
  date: new Date().toISOString().slice(0, 10),
  pages: pages.length,
  categories: categories.length,
  medias: assetOut.size,
}));

if (badFm.length) {
  const reparés = badFm.filter(l => l.endsWith('(réparé)')).length;
  console.warn(`\n⚠ Frontmatter YAML : ${badFm.length} note(s) en erreur — ${reparés} réparée(s), ${badFm.length - reparés} illisible(s)`);
  badFm.filter(l => !l.endsWith('(réparé)')).slice(0, 20).forEach(l => console.warn('   ' + l));
}
if (pngOptim) {
  console.log(`Images PNG : ${pngOptim} recompressées sans perte (${(pngGain / 1048576).toFixed(1)} Mo économisés), ${pngIntacts} laissées telles quelles`);
}
console.log(`Terminé : ${pages.length} pages · ${assetOut.size} fichiers copiés · sortie : ${OUT}`);
