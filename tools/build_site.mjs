// Générateur de site statique "Wikipédia" pour le vault Obsidian WIKI SST - Mines
// Usage : node build_site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import * as yaml from 'js-yaml';

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

function headingSlug(text) {
  return String(text)
    .replace(/<[^>]+>/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'section';
}

function cleanLabel(name) {
  // "20 - Articles" -> "Articles" ; retire aussi les emojis de tête
  return name.replace(/^\d+\s*-\s*/, '').replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/gu, '').trim() || name;
}

function stripMd(s) {
  return s
    .replace(/!?\[\[([^\]]+)\]\]/g, (m, t) => { const p = t.replace(/\\\|/g, '|').split('|'); return p[p.length - 1].split('#')[0]; })
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>~=|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- scan du vault ----------
const pages = [];              // {relPath, absPath, wikiKey, base, fm, body, mtime, ...}
const assetsByBase = new Map();// basename lower -> [relPath]
const assetsByPath = new Map();// relPath lower -> relPath

function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), rel ? rel + '/' + e.name : e.name);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      const relPath = rel ? rel + '/' + e.name : e.name;
      if (ext === '.md') {
        if (!rel) continue; // page racine remplacée par le portail
        const wikiKey = relPath.split('/')[0];
        if (!WIKIS[wikiKey]) continue;
        pages.push({ relPath, absPath: path.join(dir, e.name), wikiKey, base: e.name.slice(0, -3) });
      } else if (ASSET_EXT.has(ext)) {
        const b = e.name.toLowerCase();
        if (!assetsByBase.has(b)) assetsByBase.set(b, []);
        assetsByBase.get(b).push(relPath);
        assetsByPath.set(relPath.toLowerCase(), relPath);
      }
    }
  }
}
walk(VAULT, '');
console.log(`Pages trouvées : ${pages.length} · assets indexés : ${assetsByPath.size}`);

// ---------- lecture + frontmatter + chemins de sortie ----------
const usedOut = new Set();
for (const p of pages) {
  let raw = fs.readFileSync(p.absPath, 'utf8').replace(/^\uFEFF/, '');
  p.mtime = fs.statSync(p.absPath).mtime;
  p.fm = {};
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (m) {
    try { p.fm = yaml.load(m[1]) || {}; } catch { p.fm = {}; }
    raw = raw.slice(m[0].length);
  }
  p.body = raw;
  // titre affiché : premier H1 s'il existe, sinon nom de fichier
  const h1 = p.body.match(/^\s*#\s+(.+?)\s*$/m);
  p.title = p.base;
  p.displayTitle = h1 ? h1[1].trim() : p.base;
  if (h1) p.body = p.body.replace(h1[0], ''); // évite le doublon de titre
  // chemin de sortie : miroir du vault, slugifié
  const parts = p.relPath.slice(0, -3).split('/');
  const wiki = WIKIS[p.wikiKey];
  let out = 'w/' + wiki.slug + '/' + parts.slice(1).map(slugify).join('/') + '.html';
  let n = 2;
  while (usedOut.has(out.toLowerCase())) out = out.replace(/\.html$/, '') + '-' + (n++) + '.html';
  usedOut.add(out.toLowerCase());
  p.out = out;
  p.dir = p.relPath.split('/').slice(0, -1).join('/');
}

// index de résolution des liens
const byBase = new Map();  // basename lower -> [page]
const byPath = new Map();  // relPath sans .md, lower -> page
for (const p of pages) {
  const b = p.base.toLowerCase();
  if (!byBase.has(b)) byBase.set(b, []);
  byBase.get(b).push(p);
  byPath.set(p.relPath.slice(0, -3).toLowerCase(), p);
}

function resolvePage(target, from) {
  let t = target.trim().replace(/^🏠 WIKI SST - Mines\//u, '');
  if (!t) return null;
  if (t.includes('/')) {
    const hit = byPath.get(t.toLowerCase());
    if (hit) return hit;
    t = t.split('/').pop();
  }
  const cands = byBase.get(t.toLowerCase());
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
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(VAULT, relPath), dest);
  return url;
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
          return protect(`<span class="page-img"><img src="{{ROOT}}${url}" alt="${esc(target.split('/').pop())}" loading="lazy"${w}></span>`);
        }
        if (ext === 'mp4') return protect(`<video controls preload="metadata" src="{{ROOT}}${url}" style="max-width:100%"></video>`);
        if (ext === 'm4a' || ext === 'mp3') return protect(`<audio controls src="{{ROOT}}${url}"></audio>`);
        return `<a class="external" href="{{ROOT}}${url}${anchor ? '#' + esc(anchor) : ''}" target="_blank">📄 ${esc(alias || target.split('/').pop())}</a>`;
      }
      // transclusion de note : simple lien encadré
      const pg = resolvePage(target, CUR);
      if (pg) { CUR_LINKS.add(pg); return `<a href="{{ROOT}}${pg.out}">${esc(alias || pg.title)}</a>`; }
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
    const label = alias || (anchor ? `${target} › ${anchor}` : target);
    if (!pg) return `<span class="new" title="page non créée">${esc(label)}</span>`;
    CUR_LINKS.add(pg);
    const a = anchor ? '#' + headingSlug(anchor) : '';
    return `<a href="{{ROOT}}${pg.out}${a}" title="${esc(pg.title)}">${esc(label)}</a>`;
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
      if (lv === '2' || lv === '3') CUR.toc.push({ lv: +lv, id, text: inner.replace(/<[^>]+>/g, '') });
      return `<h${lv} id="${id}">${inner}</h${lv}>`;
    });
  }
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
<script>window.ROOT='${ROOT}';</script>
</head>
<body>
<header class="site-header">
  <button class="burger" id="burger" aria-label="Menu">☰</button>
  <a class="brand" href="${ROOT}index.html"><span class="brand-icon">⛏️</span><span class="brand-text"><strong>WIKI SST</strong><small>Mines · Québec</small></span></a>
  <div class="searchbox">
    <input type="search" id="q" placeholder="Rechercher dans le wiki…" autocomplete="off">
    <div id="suggest" class="suggest" hidden></div>
  </div>
</header>
<div class="layout">
<nav class="sidebar" id="sidebar">
  <div class="nav-group"><div class="nav-title">Navigation</div>
    <ul>
      <li><a href="${ROOT}index.html">🏠 Portail</a></li>
      <li><a href="#" id="randomLink">🎲 Une page au hasard</a></li>
    </ul>
  </div>
  ${sidebarExtra}
  <div class="nav-group"><div class="nav-title">Les wikis</div><ul>${wikiLinks}</ul></div>
</nav>
<main class="content">
${content}
</main>
</div>
<footer class="site-footer">WIKI SST — Mines · encyclopédie interne construite à partir des notes de cours · ${new Date().toLocaleDateString('fr-CA')}</footer>
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
  ['loi', 'Loi'], ['article', 'Article'], ['référence', 'Référence'], ['reference', 'Référence'],
  ['nature', 'Nature'], ['sujet', 'Sujet'], ['visé', 'Visé'], ['type', 'Type'], ['theme', 'Thème'], ['thème', 'Thème'],
  ['statut', 'Statut'], ['qualité', 'Qualité'], ['révision', 'Révision'], ['public-cible', 'Public cible'],
  ['niveau-sensibilité', 'Sensibilité'],
];
function infobox(p) {
  const rows = [];
  for (const [key, label] of FM_LABELS) {
    let v = p.fm[key];
    if (v === undefined || v === null || v === '') continue;
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
  const tagHtml = (tags && tags.length)
    ? `<div class="infobox-tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : '';
  if (!rows.length && !tagHtml) return '';
  const wiki = WIKIS[p.wikiKey];
  return `<aside class="infobox"><div class="infobox-title">${wiki.icon} ${esc(p.title)}</div><table>${rows.join('')}</table>${tagHtml}</aside>`;
}

// ---------- rendu de toutes les pages ----------
console.log('Rendu des pages…');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const backlinks = new Map(); // page -> Set(pages qui pointent vers elle)
for (const p of pages) {
  CUR = p; p.toc = []; p.headIds = new Set();
  CUR_LINKS = new Set();
  p.html = finalize(renderBody(p.body));
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
  const tocHtml = p.toc.length >= 3
    ? `<div class="toc"><div class="toc-title">Sommaire <button class="toc-toggle" data-toggle>[masquer]</button></div><ul>${p.toc.map(t => `<li class="toc-l${t.lv}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul></div>`
    : '';
  const bl = backlinks.get(p);
  const blHtml = bl && bl.size
    ? `<details class="backlinks"><summary>Pages qui pointent ici (${bl.size})</summary><ul>${[...bl].sort((a, b) => a.title.localeCompare(b.title, 'fr')).slice(0, 60).map(b => `<li><a href="{{ROOT}}${b.out}">${esc(b.title)}</a> <small class="bl-wiki">${WIKIS[b.wikiKey].name}</small></li>`).join('')}${bl.size > 60 ? '<li>…</li>' : ''}</ul></details>`
    : '';
  const rev = p.fm['révision'] || p.mtime.toISOString().slice(0, 10);
  const content = `
<div class="breadcrumbs">${crumbs.join(' <span class="crumb-sep">›</span> ')}</div>
<h1 class="page-title">${esc(p.displayTitle)}</h1>
<div class="page-sub">Un article du wiki <a href="{{ROOT}}w/${wiki.slug}/index.html">${wiki.icon} ${esc(wiki.name)}</a></div>
${infobox(p)}
${tocHtml}
<div class="page-body">
${p.html}
</div>
${blHtml}
<div class="page-meta">Dernière révision : ${esc(String(rev))}</div>`;
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
  const childPages = (pagesByDir.get(dir) || []).slice().sort((a, b) => a.title.localeCompare(b.title, 'fr'));
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
  const pageList = childPages.map(p => `<li><a href="{{ROOT}}${p.out}">${esc(p.title)}</a></li>`).join('');
  const content = `
<div class="breadcrumbs"><a href="{{ROOT}}index.html">Portail</a> <span class="crumb-sep">›</span> <a href="{{ROOT}}w/${wiki.slug}/index.html">${esc(wiki.name)}</a></div>
<h1 class="page-title">Catégorie : ${esc(label)}</h1>
<div class="page-sub">${childPages.length} page${childPages.length > 1 ? 's' : ''}${childDirs.length ? ` · ${childDirs.length} sous-catégorie${childDirs.length > 1 ? 's' : ''}` : ''} — wiki ${esc(wiki.name)}</div>
${dirCards ? `<h2>Sous-catégories</h2><div class="cat-grid">${dirCards}</div>` : ''}
${pageList ? `<h2>Pages</h2><ul class="cat-pages">${pageList}</ul>` : ''}`;
  const outPath = outDir + '/index.html';
  const html = pageShell({ out: outPath, title: 'Catégorie : ' + label, wikiKey, content, sidebarExtra: wikiSidebar(wikiKey, wikiSections[wikiKey]) })
    .replace(/\{\{ROOT\}\}/g, rootOf(outPath));
  fs.mkdirSync(path.join(OUT, outDir), { recursive: true });
  fs.writeFileSync(path.join(OUT, outPath), html);
}

// ---------- index alphabétique par wiki ----------
for (const [wikiKey, wiki] of Object.entries(WIKIS)) {
  const list = pages.filter(p => p.wikiKey === wikiKey).sort((a, b) => a.title.localeCompare(b.title, 'fr'));
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
    `<h2 id="lettre-${l}">${l}</h2><ul class="cat-pages">${groups.get(l).map(p => `<li><a href="{{ROOT}}${p.out}">${esc(p.title)}</a></li>`).join('')}</ul>`).join('');
  const outPath = `w/${wiki.slug}/index-alphabetique.html`;
  const content = `
<div class="breadcrumbs"><a href="{{ROOT}}index.html">Portail</a> <span class="crumb-sep">›</span> <a href="{{ROOT}}w/${wiki.slug}/index.html">${esc(wiki.name)}</a></div>
<h1 class="page-title">Index alphabétique — ${esc(wiki.name)}</h1>
<div class="page-sub">${list.length} pages</div>
<div class="letters-nav">${nav}</div>
${sections}`;
  const html = pageShell({ out: outPath, title: 'Index — ' + wiki.name, wikiKey, content, sidebarExtra: wikiSidebar(wikiKey, wikiSections[wikiKey]) })
    .replace(/\{\{ROOT\}\}/g, rootOf(outPath));
  fs.writeFileSync(path.join(OUT, outPath), html);
}

// ---------- index de recherche ----------
console.log('Index de recherche…');
const searchIndex = pages.map(p => ({
  t: p.title,
  u: p.out,
  w: WIKIS[p.wikiKey].name,
  i: WIKIS[p.wikiKey].icon,
  g: (Array.isArray(p.fm.tags) ? p.fm.tags.join(' ') : ''),
  x: stripMd(p.body).slice(0, 150),
}));
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
<div class="portal-grid">${cards}</div>
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
<script>window.ROOT='';</script>
</head>
<body class="portal">
<main class="portal-main">${content}</main>
<footer class="site-footer">WIKI SST — Mines · encyclopédie interne · générée le ${new Date().toLocaleDateString('fr-CA')}</footer>
<script src="assets/app.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
}

// ---------- assets statiques ----------
fs.writeFileSync(path.join(OUT, 'assets', 'style.css'), style);
fs.writeFileSync(path.join(OUT, 'assets', 'app.js'), appjs);
fs.writeFileSync(path.join(OUT, '.nojekyll'), ''); // GitHub Pages : ne pas passer par Jekyll

console.log(`Terminé : ${pages.length} pages · ${assetOut.size} fichiers copiés · sortie : ${OUT}`);
