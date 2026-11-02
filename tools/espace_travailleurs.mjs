// Wiki prévention des travailleurs (docs/travailleurs/) : des pages de prévention à lire, avec
// questions et attestation de lecture, présentées comme un vrai wiki (barre latérale, recherche,
// infobox, sommaire, pages de section, « Voir aussi », pages liées).
//
// Un espace FERMÉ : aucune page de l'espace ne mène au reste du wiki (portail, encadrement /g/,
// démarrages rapides de la direction, des RH ou des conseillers, recherche globale, graphe…). Les
// pages du wiki y sont recopiées en gardant leur contenu ; un lien vers une autre page de l'espace
// est réécrit, un lien vers le reste du wiki devient du texte. Seules sortent : les images (médias
// de files/, pas des pages), les liens externes (sites publics, ouverts dans un nouvel onglet), les
// numéros de téléphone et les courriels. La feuille de style du wiki (assets/style.css) est
// réutilisée telle quelle ; son script (app.js) ne l'est pas, il mène au reste du site :
// tools/travailleurs/travailleurs.js refait en petit ce qu'il faut (menu, sommaire, recherche
// interne, thème, visionneuse d'image).
//
// Ce n'est PAS un contrôle d'accès : GitHub Pages est public, et une adresse tapée à la main ouvre
// n'importe quelle page du site. L'espace n'offre simplement aucun chemin vers elles.
//
// Sources (rien ne dépend du vault) :
//   tools/travailleurs/pages.json          nom du wiki, sections, pages, relais, seuil, renvois
//   tools/travailleurs/pages/*.md          pages écrites pour l'espace
//   tools/travailleurs/questions/*.json    questions par page (format : tools/travailleurs/FORMAT.md)
//   tools/travailleurs/corrections.json    passages des pages du wiki corrigés dans la copie
//   tools/travailleurs/travailleurs.js|css scripts et styles propres à l'espace
// Appelé par build_site.mjs après le rendu des pages ; seul, il réécrit docs/travailleurs/ à partir
// du docs/ en place :  node tools/espace_travailleurs.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { icone, illustrationWiki } from './accueil_wiki.mjs';

const require = createRequire(import.meta.url);
const OUTILS = path.dirname(fileURLToPath(import.meta.url));
export const DOSSIER = 'travailleurs';
const MOTS_PAR_MINUTE = 180;   // même base que la « Lecture estimée » du site des procédures

const echapper = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decoder = (s) => String(s).replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');
export const texteDe = (html) => decoder(String(html)
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<\/(p|li|h[1-6]|tr|div|ul|ol|table|blockquote|figcaption|section)>|<br\s*\/?>/gi, '\n')
  .replace(/<\/t[dh]>/gi, ' | ')
  // balises de texte (lien, gras…) : retirées sans espace, sinon « <a>CNESST</a>. » deviendrait « CNESST . »
  .replace(/<\/?(?:a|span|strong|em|b|i|small|code|mark|sup|sub|abbr|u|s|q)\b[^>]*>/gi, '')
  .replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
export const compterMots = (html) => (texteDe(html).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
export const minutesEstimees = (mots) => Math.max(1, Math.ceil(mots / MOTS_PAR_MINUTE));
const slugifier = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
// première phrase d'un texte, pour les listes et la recherche
export function premierePhrase(texte, max = 180) {
  const t = String(texte).replace(/\s+/g, ' ').trim();
  const m = t.match(/^(.{20,}?[.!?])(\s|$)/);
  const p = m ? m[1] : t;
  return p.length > max ? p.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : p;
}

// ---------- extraction d'une page du wiki ----------

// Le bloc <tag ...> qui commence à `debut`, jusqu'à sa balise fermante (imbrication comprise).
function bloc(html, debut, tag) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'gi');
  re.lastIndex = debut;
  let prof = 0, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') { prof--; if (prof === 0) return { debut, fin: re.lastIndex }; }
    else prof++;
  }
  return null;
}
function retirerBlocs(html, ouverture, tag) {
  let sortie = html, i;
  while ((i = sortie.search(ouverture)) >= 0) {
    const b = bloc(sortie, i, tag);
    if (!b) break;
    sortie = sortie.slice(0, b.debut) + sortie.slice(b.fin);
  }
  return sortie;
}

export function extrairePage(html) {
  const h1 = html.match(/<h1[^>]*class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const titre = h1 ? decoder(h1[1].replace(/<[^>]+>/g, '')).replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '').trim() : '';
  const rev = html.match(/<th>Révision déclarée<\/th><td>([^<]+)<\/td>/);
  const i = html.indexOf('<div class="page-body">');
  if (i < 0) throw new Error('corps de page introuvable (<div class="page-body">)');
  const b = bloc(html, i, 'div');
  let corps = html.slice(i + '<div class="page-body">'.length, b.fin - '</div>'.length);
  // ce qui relie la page au reste du wiki : pages qui pointent ici, voisines, voir aussi, avis, méta
  corps = retirerBlocs(corps, /<details class="backlinks"/, 'details');
  corps = retirerBlocs(corps, /<nav class="voisins"/, 'nav');
  corps = retirerBlocs(corps, /<section class="avis/, 'section');
  corps = retirerBlocs(corps, /<div class="(?:voir-aussi|page-meta)"/, 'div');
  corps = retirerBlocs(corps, /<nav class="toc"/, 'nav');
  return { titre, revision: rev ? rev[1].trim() : '', corps: corps.trim() };
}

// ---------- liens ----------

const SITE = /^https?:\/\/frankyray21\.github\.io\/wiki-sst-mines\//i;
const relatif = (de, vers) => path.posix.relative(path.posix.dirname(de), vers) || path.posix.basename(vers);

// Réécrit les liens et les médias d'un corps de page venu de `source` (chemin dans docs/, ex.
// « w/droit-travail/x.html »). `cible(chemin)` rend le slug de l'espace qui remplace ce chemin, ou
// rien. Renvoie le HTML et la liste des liens coupés (pour le rapport).
export function reecrireLiens(corps, source, cible) {
  const coupes = [];
  const dossier = path.posix.dirname(source);
  const resoudre = (href) => {
    const [chemin, ...reste] = href.split('#');
    const ancre = reste.length ? '#' + reste.join('#') : '';
    const sansQuery = chemin.split('?')[0];
    return { chemin: path.posix.normalize(path.posix.join(dossier, decodeURI(sansQuery))), ancre };
  };
  let html = corps.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (tout, attrs, contenu) => {
    const m = attrs.match(/\bhref="([^"]*)"/);
    if (!m) return contenu;
    let href = decoder(m[1]);
    if (href.startsWith('#')) return tout;
    if (/^(mailto|tel):/i.test(href)) return tout;
    if (SITE.test(href)) href = '/' + href.replace(SITE, '');
    if (/^https?:\/\//i.test(href)) {
      const garde = attrs.replace(/\s(target|rel)="[^"]*"/gi, '');
      return `<a${garde} target="_blank" rel="noopener noreferrer">${contenu}</a>`;
    }
    const { chemin, ancre } = href.startsWith('/') ? { chemin: path.posix.normalize(href.slice(1).split(/[?#]/)[0]), ancre: href.includes('#') ? href.slice(href.indexOf('#')) : '' } : resoudre(href);
    // un média (capture, schéma, PDF du recueil) reste accessible : c'est un fichier, pas une page
    if (chemin.startsWith('files/')) return `<a${attrs.replace(/\bhref="[^"]*"/, `href="${echapper(relatif(DOSSIER + '/x.html', chemin))}"`)}>${contenu}</a>`;
    const slug = cible(chemin);
    if (slug) return `<a href="${slug}.html${echapper(ancre)}">${contenu}</a>`;
    coupes.push(chemin);
    return `<span class="et-hors">${contenu}</span>`;
  });
  // médias : chemin réécrit depuis travailleurs/ (les fichiers restent où ils sont)
  html = html.replace(/\s(src|poster)="([^"]+)"/gi, (tout, attr, v) => {
    if (/^(https?:|data:|\/\/)/i.test(v)) return tout;
    return ` ${attr}="${echapper(relatif(DOSSIER + '/x.html', resoudre(decoder(v)).chemin))}"`;
  });
  html = html.replace(/\ssrcset="([^"]+)"/gi, (_, v) => ` srcset="${echapper(decoder(v).split(',').map(part => {
    const [u, ...d] = part.trim().split(/\s+/);
    return [/^(https?:|data:)/i.test(u) ? u : relatif(DOSSIER + '/x.html', resoudre(u).chemin), ...d].join(' ');
  }).join(', '))}"`);
  // une note du vault non publiée : son titre reste, sans la mention « (source non publiée) »
  html = html.replace(/<span class="interne-inline"[^>]*>([^<]*?)\s*<small>\(source non publiée\)<\/small><\/span>/g, '<span class="et-hors">$1</span>');
  // un paragraphe ou un élément de liste qui n'était qu'un lien vers le reste du wiki (« ← Accueil »,
  // « Voir cette page dans le graphe ») disparaît plutôt que de laisser un texte sans objet
  html = html.replace(/<(p|li)>\s*<span class="et-hors">[^<]*<\/span>\s*<\/\1>/g, '');
  return { html, coupes };
}

// Numéros de téléphone rendus cliquables (téléphone en main, c'est le geste attendu). Le texte
// visible ne change pas. Rien n'est touché dans un lien ou une balise existants.
export function lierTelephones(html) {
  return html.split(/(<a\b[\s\S]*?<\/a>|<[^>]+>)/i).map((morceau, i) => {
    if (i % 2 === 1) return morceau;
    return morceau
      .replace(/(?<![\d-])(?:1[ .-])?(?:\(\d{3}\)\s?|\d{3}[ .-])\d{3}[ .-]\d{4}(?![\d-])/g, (n) => {
        const ch = n.replace(/\D/g, '');
        const tel = ch.length === 10 ? '+1' + ch : ch.length === 11 && ch[0] === '1' ? '+' + ch : '';
        return tel ? `<a class="et-tel" href="tel:${tel}">${n}</a>` : n;
      })
      .replace(/(?<![\d-])(9-1-1|911|9-8-8|988|8-1-1)(?![\d-])/g, (n) => `<a class="et-tel" href="tel:${n.replace(/\D/g, '')}">${n}</a>`)
      .replace(/(Info-(?:Social|Santé)\s)(811)(?!\d)/g, '$1<a class="et-tel" href="tel:811">$2</a>');
  }).join('');
}

// Titres de section identifiés (sommaire, ancres) : un id par h2/h3 qui n'en a pas, unique dans la page.
export function identifierTitres(html, reserves = []) {
  const pris = new Set(reserves);
  for (const m of html.matchAll(/<h[23][^>]*\bid="([^"]+)"/g)) pris.add(m[1]);
  return html.replace(/<(h[23])(?![^>]*\bid=)([^>]*)>([\s\S]*?)<\/\1>/g, (_, tag, attrs, inner) => {
    let id = slugifier(texteDe(inner)), n = 2;
    while (pris.has(id)) id = `${slugifier(texteDe(inner))}-${n++}`;
    pris.add(id);
    return `<${tag} id="${id}"${attrs}>${inner}</${tag}>`;
  });
}
export function sommaireDe(html) {
  return [...html.matchAll(/<(h[23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)]
    .map(m => ({ niveau: m[1] === 'h2' ? 2 : 3, id: m[2], titre: texteDe(m[3]).replace(/\s+/g, ' ').trim() }))
    .filter(e => e.titre);
}

// ---------- pages écrites pour l'espace (Markdown) ----------

const ENCADRES = {
  note: ['info', '📝'], info: ['info', 'ℹ️'], tip: ['tip', '💡'], astuce: ['tip', '💡'],
  warning: ['warning', '⚠️'], attention: ['warning', '⚠️'], important: ['warning', '❗'], danger: ['danger', '🚨'],
};
// `slugs` : pages de l'espace (liens gardés) ; `connus` : pages connues du dossier mais hors de
// l'espace pour l'instant (lien rendu en texte) ; tout autre lien est une erreur.
export function lireMarkdown(texte, slugs, connus = slugs) {
  const yaml = require('js-yaml');
  const { marked } = require('marked');
  const m = texte.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('frontmatter absent (--- … ---)');
  const fm = yaml.load(m[1]) || {};
  if (!fm.titre) throw new Error('frontmatter : « titre » manquant');
  // encadrés « > [!type] Titre » : rendus comme les callouts du wiki
  const lignes = m[2].split(/\r?\n/);
  const morceaux = [];
  let courant = [];
  for (let i = 0; i < lignes.length; i++) {
    const e = lignes[i].match(/^>\s*\[!(\w+)\][-+]?\s*(.*)$/);
    if (!e) { courant.push(lignes[i]); continue; }
    const contenu = [];
    while (i + 1 < lignes.length && /^>/.test(lignes[i + 1])) contenu.push(lignes[++i].replace(/^>\s?/, ''));
    const [classe, icone] = ENCADRES[e[1].toLowerCase()] || ENCADRES.note;
    morceaux.push(marked.parse(courant.join('\n')));
    courant = [];
    morceaux.push(`<div class="callout callout-${classe}"><div class="callout-title"><span class="callout-icon">${icone}</span>${echapper(e[2] || '')}</div><div class="callout-body">${marked.parse(contenu.join('\n'))}</div></div>\n`);
  }
  morceaux.push(marked.parse(courant.join('\n')));
  let corps = morceaux.join('');
  // liens : seulement vers une autre page de l'espace
  const fautifs = [];
  corps = corps.replace(/<a href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (tout, href, reste, contenu) => {
    const s = href.match(/^([a-z0-9-]+)\.html(#[\w-]*)?$/);
    if (s && slugs.has(s[1])) return tout;
    if (s && connus.has(s[1])) return `<span class="et-hors">${contenu}</span>`;
    if (/^(tel|mailto):/.test(href)) return tout;
    fautifs.push(href);
    return tout;
  });
  if (fautifs.length) throw new Error(`liens hors de l'espace : ${fautifs.join(', ')}`);
  return { titre: String(fm.titre), resume: fm.resume ? String(fm.resume) : '', revision: fm.revision ? String(fm.revision instanceof Date ? fm.revision.toISOString().slice(0, 10) : fm.revision) : '', sources: Array.isArray(fm.sources) ? fm.sources.map(String) : [], corps };
}

// ---------- questions ----------

const TYPES = ['choix', 'multi', 'vf', 'ordre', 'court'];
export function validerQuestions(donnees, slug) {
  const err = (m) => { throw new Error(`questions/${slug}.json : ${m}`); };
  if (!donnees || !Array.isArray(donnees.questions)) err('tableau « questions » manquant');
  if (donnees.page && donnees.page !== slug) err(`« page » vaut ${donnees.page}`);
  const ids = new Set();
  const nonVide = (v) => typeof v === 'string' && v.trim().length > 0;
  donnees.questions.forEach((q, n) => {
    const ou = `question ${q && q.id || n + 1}`;
    if (!q || !TYPES.includes(q.type)) err(`${ou} : type inconnu (${q && q.type})`);
    if (!nonVide(q.id) || ids.has(q.id)) err(`${ou} : id manquant ou en double`);
    ids.add(q.id);
    if (!nonVide(q.question)) err(`${ou} : énoncé vide`);
    if (!nonVide(q.explication)) err(`${ou} : explication vide`);
    const options = () => { if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6 || !q.options.every(nonVide)) err(`${ou} : 2 à 6 options attendues`); };
    if (q.type === 'choix') { options(); if (!Number.isInteger(q.reponse) || q.reponse < 0 || q.reponse >= q.options.length) err(`${ou} : « reponse » hors des options`); }
    if (q.type === 'multi') {
      options();
      const r = q.reponses;
      if (!Array.isArray(r) || !r.length || r.length >= q.options.length || new Set(r).size !== r.length || !r.every(x => Number.isInteger(x) && x >= 0 && x < q.options.length)) err(`${ou} : « reponses » doit désigner au moins une option et pas toutes`);
    }
    if (q.type === 'vf' && typeof q.reponse !== 'boolean') err(`${ou} : « reponse » doit valoir true ou false`);
    if (q.type === 'ordre' && (!Array.isArray(q.etapes) || q.etapes.length < 3 || q.etapes.length > 7 || !q.etapes.every(nonVide) || new Set(q.etapes).size !== q.etapes.length)) err(`${ou} : 3 à 7 étapes distinctes attendues`);
    if (q.type === 'court' && (!Array.isArray(q.attendu) || !q.attendu.length || !q.attendu.every(nonVide))) err(`${ou} : « attendu » doit lister au moins un élément`);
  });
  return donnees.questions;
}
const nonCorrigees = (qs) => qs.filter(q => q.type === 'court').length;

// ---------- gabarits (les classes sont celles du wiki : assets/style.css) ----------

const SCRIPT_THEME = "try{var t=localStorage.getItem('theme');if(t==='light'||t==='auto')document.documentElement.setAttribute('data-theme',t);var ec=localStorage.getItem('echelle');if(ec)document.documentElement.style.setProperty('--echelle',ec);if(localStorage.getItem('lecture')==='1')document.documentElement.setAttribute('data-lecture','1');}catch(e){}";
const ICONE_LIVRE = 'M19 1L14 6V17L19 12.5V1M21 5V18.5C19.9 18.15 18.7 18 17.5 18C15.8 18 13.35 18.65 12 19.5V6C10.55 4.9 8.45 4.5 6.5 4.5C4.55 4.5 2.45 4.9 1 6V20.65C1 20.9 1.25 21.15 1.5 21.15C1.6 21.15 1.65 21.1 1.75 21.1C3.1 20.45 5.05 20 6.5 20C8.45 20 10.55 20.4 12 21.5C13.35 20.65 15.8 20 17.5 20C19.15 20 20.85 20.3 22.25 21.05C22.35 21.1 22.4 21.1 22.5 21.1C22.75 21.1 23 20.85 23 20.6V6C22.4 5.55 21.75 5.25 21 5M10 18.41C8.75 18.09 7.5 18 6.5 18C5.44 18 4.18 18.19 3 18.5V7.13C3.91 6.73 5.14 6.5 6.5 6.5C7.86 6.5 9.09 6.73 10 7.13V18.41Z';
const CHEVRON = '<span class="accueil-chevron" aria-hidden="true"></span>';
const sectionUrl = (s) => `section-${s.id}.html`;
const nomLong = (conf) => conf.nomLong || conf.nom;
const OUTILS_LECTURE = '<div class="lecture-outils" role="group" aria-label="Confort de lecture"><button type="button" data-moins title="Texte plus petit" aria-label="Texte plus petit">A−</button><button type="button" data-plus title="Texte plus grand" aria-label="Texte plus grand">A+</button><button type="button" data-lecture title="Mode lecture : masque les menus" aria-pressed="false">📖 Lecture</button></div>';
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
const questionsTexte = (p) => {
  const n = p.questions.length, c = nonCorrigees(p.questions);
  return n ? `${pluriel(n, 'question')}${c ? `, dont ${c} à développement` : ''}` : 'sans questions';
};

function tete(titre, version, description) {
  return `<!DOCTYPE html>
<html lang="fr" data-wiki-entete data-espace="travailleurs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${echapper(titre)}</title>
<meta name="description" content="${echapper(description)}">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#2563eb">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⛑️</text></svg>">
<link rel="stylesheet" href="../assets/style.css?v=${version}">
<link rel="stylesheet" href="assets/travailleurs.css?v=${version}">
<script>window.ROOT='';${SCRIPT_THEME}</script>
</head>`;
}
function enteteSite(conf) {
  const m = conf.marque;
  return `<header class="site-header">
  <button type="button" class="burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="sidebar">☰</button>
  <a class="brand" href="index.html"><span class="brand-icon">${m.icone}</span><span class="brand-text"><strong>${echapper(m.gros)}${m.accent ? ` <span class="brand-sst">${echapper(m.accent)}</span>` : ''}</strong><small>${echapper(m.petit)}</small></span></a>
  <div class="searchbox">
    <input type="search" id="q" aria-label="Rechercher dans le wiki" placeholder="Rechercher dans le wiki…" autocomplete="off">
    <div id="suggest" class="suggest" hidden></div>
  </div>
  <button type="button" class="btn-theme" id="btnTheme" aria-label="Changer de thème" title="Changer de thème"></button>
</header>`;
}
function barreLaterale(conf, sections, courant, sectionCourante) {
  const li = (href, texte, actif) => `<li${actif ? ' class="active"' : ''}><a href="${href}"${actif ? ' aria-current="page"' : ''}>${texte}</a></li>`;
  const themes = `  <div class="nav-group"><div class="nav-title">${conf.marque.icone} ${echapper(conf.nom)}</div><ul>
${sections.map(s => li(sectionUrl(s), `${s.icone} ${echapper(s.titre)}`, courant === sectionUrl(s))).join('\n')}
  </ul></div>`;
  const dansTheme = sectionCourante ? `  <div class="nav-group"><div class="nav-title">Dans ce thème</div><ul>
${sectionCourante.pages.map(p => li(`${p.slug}.html`, `${echapper(p.titre)} <span class="et-coche" data-etat-coche data-slug="${p.slug}" aria-hidden="true"></span>`, courant === `${p.slug}.html`)).join('\n')}
  </ul></div>` : '';
  const taille = courant.startsWith('section-') || ['index.html', 'recherche.html', 'parcours.html', 'index-alphabetique.html'].includes(courant)
    ? `  <div class="nav-group lecture-taille" role="group" aria-label="Taille du texte"><div class="nav-title">Taille du texte</div><div class="lecture-taille-boutons"><button type="button" data-moins aria-label="Texte plus petit">A−</button><button type="button" data-plus aria-label="Texte plus grand">A+</button></div></div>` : '';
  return `<nav class="sidebar" id="sidebar" aria-label="Navigation du wiki">
  <div class="nav-group"><div class="nav-title">Navigation</div><ul>
${li('index.html', '🏠 Accueil', courant === 'index.html')}
    <li id="reprendre" hidden><a href="#">▶ Reprendre</a></li>
${li('parcours.html', '📖 Mes lectures', courant === 'parcours.html')}
${li('recherche.html', '🔎 Recherche', courant === 'recherche.html')}
${li('index-alphabetique.html', '🔤 Index alphabétique', courant === 'index-alphabetique.html')}
    <li><a href="#" id="randomLink">🎲 Une page au hasard</a></li>
${li('ou-appeler.html', '📞 Où appeler', false)}
  </ul></div>
${themes}
${dansTheme}
${taille}
</nav>`;
}
const filAriane = (maillons) => `<div class="breadcrumbs">${maillons.map(([href, t]) => `<a href="${href}">${echapper(t)}</a>`).join(' <span class="crumb-sep">›</span> ')}</div>`;
const marqueCourte = (conf) => `${conf.marque.gros}${conf.marque.accent ? ' ' + conf.marque.accent : ''}`;
function pied(conf, version, donnees) {
  return `<footer class="site-footer">${echapper(marqueCourte(conf))} — ${echapper(conf.nom)}, pour les travailleurs des mines · Ces pages donnent des repères ; elles ne remplacent ni la procédure de ton site ni un avis médical.</footer>
<script type="application/json" id="donnees-wiki">${JSON.stringify(donnees).replace(/</g, '\\u003c')}</script>
<script src="assets/travailleurs.js?v=${version}"></script>
</body>
</html>
`;
}
function page(conf, { titre, description, courant, corps, classeBody = '', attributs = '', sectionCourante = null }, sections, version, donnees) {
  return `${tete(titre, version, description)}
<body class="espace-travailleurs ${classeBody}"${attributs}>
<a class="et-sauter" href="#contenu">Aller au contenu</a>
${enteteSite(conf)}
<div class="layout">
${barreLaterale(conf, sections, courant, sectionCourante)}
<main class="content" id="contenu">
${corps}
</main>
</div>
${pied(conf, version, donnees)}`;
}

function pageLecture(conf, p, sections, version, donnees) {
  const s = p.section;
  const n = p.questions.length;
  const sommaire = [...sommaireDe(p.corps), { niveau: 2, id: 'questions', titre: n ? 'Questions sur ta lecture' : 'Ta lecture' }];
  const toc = `<nav class="toc" aria-label="Sommaire de la page"><div class="toc-title">Sommaire <span class="toc-compte">${pluriel(sommaire.length, 'section')}</span> <button type="button" class="toc-toggle" aria-expanded="true">[masquer]</button></div><ul>${sommaire.map(e => `<li class="toc-l${e.niveau}"><a href="#${e.id}">${echapper(e.titre)}</a></li>`).join('')}</ul></nav>`;
  const infobox = `<aside class="infobox"><div class="infobox-title">${s.icone} ${echapper(p.titre)}</div><table>
<tr><th>Ta lecture</th><td id="infoboxEtat" data-etat-badge data-etat-long data-slug="${p.slug}">À lire</td></tr>
<tr><th>Temps sur cette page</th><td><span id="chrono" aria-hidden="true">0 s</span> <small class="et-chrono-note">il paraîtra sur ton attestation</small></td></tr>
<tr><th>Thème</th><td><a href="${sectionUrl(s)}">${echapper(s.titre)}</a></td></tr>
<tr><th>Lecture estimée</th><td>≈ ${p.minutes} min</td></tr>
<tr><th>Questions</th><td>${n ? `<a href="#questions">${questionsTexte(p)}</a>` : 'aucune'}</td></tr>
${p.revision ? `<tr><th>Révision</th><td>${echapper(p.revision)}</td></tr>` : ''}
</table><div class="infobox-tags"><span class="tag">wiki</span><span class="tag">prévention</span><span class="tag">${echapper(s.titre.toLowerCase())}</span></div></aside>`;
  const sources = p.sources.length ? `<h2 id="sources">Sources</h2>\n<ul class="et-sources">${p.sources.map(x => `<li>${echapper(x)}</li>`).join('')}</ul>` : '';
  const voirAussi = p.voirAussi.length ? `<nav class="voir-aussi" aria-label="Dans le même thème"><h2>Dans le même thème</h2><ul>${p.voirAussi.map(v => `<li><a href="${v.slug}.html">${echapper(v.titre)}</a></li>`).join('')}</ul></nav>` : '';
  const voisins = (p.precedente || p.suivante) ? `<nav class="voisins" aria-label="Pages voisines">${p.precedente ? `<a class="voisin voisin-prec" href="${p.precedente.slug}.html"><small>← Précédent</small><span>${echapper(p.precedente.titre)}</span></a>` : '<span></span>'}${p.suivante ? `<a class="voisin voisin-suiv" href="${p.suivante.slug}.html"><small>Suivant →</small><span>${echapper(p.suivante.titre)}</span></a>` : ''}</nav>` : '';
  const liees = p.liees.length ? `<details class="backlinks"><summary>Pages qui pointent ici (${p.liees.length})</summary><ul>${p.liees.map(v => `<li><a href="${v.slug}.html">${echapper(v.titre)}</a> <small class="bl-wiki">${echapper(v.section.titre)}</small></li>`).join('')}</ul></details>` : '';
  const corps = `${filAriane([['index.html', 'Accueil'], [sectionUrl(s), s.titre]])}
<header class="article-titre">
<h1 class="page-title">${echapper(p.titre)}</h1>
<div class="page-sub">Un article du ${echapper(conf.nom)} · thème <a href="${sectionUrl(s)}">${s.icone} ${echapper(s.titre)}</a> · lecture ≈ ${p.minutes} min${n ? ` · <a href="#questions">${questionsTexte(p)}</a> en bas de page` : ''}</div>
${OUTILS_LECTURE}
</header>
<div class="et-etat-page" id="etatPage" hidden></div>
${infobox}
${toc}
<div class="page-body">
${p.resume && p.fichier ? `<div class="chapo"><span class="chapo-label">En bref</span><p>${echapper(p.resume)}</p></div>\n` : ''}${p.corps}
${sources}
<section class="et-questions" id="questions" aria-labelledby="questions-titre">
<h2 id="questions-titre">${n ? 'Questions sur ta lecture' : 'Ta lecture'}</h2>
<p class="et-intro">Ces questions t'aident à retenir l'essentiel. Tu peux relire la page et recommencer autant de fois que tu veux : rien n'est envoyé avant que tu attestes.</p>
<noscript><p class="et-avis">Les questions et l'attestation demandent JavaScript. Ouvre la page dans le navigateur de ton téléphone ou de ton ordinateur.</p></noscript>
<div id="questionsZone"></div>
</section>
<section class="et-attestation" id="attestation" aria-labelledby="attestation-titre" hidden></section>
</div>
${voirAussi}
${voisins}
${liees}
<div class="page-meta"><span>${p.revision ? `Révision déclarée : ${echapper(p.revision)} · ` : ''}Lecture estimée ≈ ${p.minutes} min · ${p.mots} mots</span><span class="accueil-marque">${echapper(marqueCourte(conf))} — ${echapper(conf.nom)}</span></div>
<script type="application/json" id="donnees-questions">${JSON.stringify({ slug: p.slug, questions: p.questions }).replace(/</g, '\\u003c')}</script>`;
  return page(conf, {
    titre: `${p.titre} — ${conf.nom}`, description: p.resume || texteDe(conf.sousTitre), courant: `${p.slug}.html`, corps, classeBody: 'et-lecture', sectionCourante: s,
    attributs: ` data-slug="${p.slug}" data-titre="${echapper(p.titre)}" data-section="${echapper(s.etiquette)}" data-mots="${p.mots}" data-minutes="${p.minutes}" data-revision="${echapper(p.revision)}" data-relais="${echapper(conf.relais || '')}" data-seuil="${conf.seuil}"`,
  }, sections, version, donnees);
}

// liste de pages d'une section, rangées comme les notions d'un thème du wiki
const listeNotions = (pages) => `<ul class="cat-pages theme-notions et-notions">${pages.map(p => `<li><a href="${p.slug}.html"><span class="et-notion"><span class="themes-nom">${echapper(p.titre)}</span><small class="et-notion-meta">≈ ${p.minutes} min · ${questionsTexte(p)}</small></span><span class="et-badge" data-etat-badge data-slug="${p.slug}">À lire</span></a></li>`).join('')}</ul>`;

function pageSection(conf, s, sections, version, donnees) {
  const autres = sections.filter(x => x !== s);
  const corps = `${filAriane([['index.html', 'Accueil'], [sectionUrl(s), s.titre]])}
<header class="article-titre">
<h1 class="page-title">${s.icone} ${echapper(s.titre)}</h1>
<div class="page-sub">Un thème du ${echapper(conf.nom)} · ${pluriel(s.pages.length, 'article')} · ≈ ${s.pages.reduce((a, p) => a + p.minutes, 0)} min de lecture</div>
</header>
<div class="page-body">
<p>${echapper(s.chapeau)}</p>
<p class="et-progression-texte" aria-live="polite"><strong data-progression-compte="${s.id}">0</strong> lecture(s) attestée(s) sur ${s.pages.length} dans ce thème.</p>
<h2 id="articles">Articles de ce thème</h2>
${listeNotions(s.pages)}
</div>
<nav class="voir-aussi" aria-label="Les autres thèmes"><h2>Les autres thèmes</h2><ul>${autres.map(x => `<li><a href="${sectionUrl(x)}">${x.icone} ${echapper(x.titre)}</a> <small>(${x.pages.length})</small></li>`).join('')}</ul></nav>
<div class="page-meta"><span>${pluriel(s.pages.length, 'article')}</span><span class="accueil-marque">${echapper(marqueCourte(conf))} — ${echapper(conf.nom)}</span></div>`;
  return page(conf, { titre: `${s.titre} — ${conf.nom}`, description: s.chapeau, courant: sectionUrl(s), corps, classeBody: 'et-section-page', attributs: ` data-section-id="${s.id}"`, sectionCourante: s }, sections, version, donnees);
}

function boite({ id, titre, picto, sousTexte = '', html, grande = false, repliee = false }) {
  const classes = 'accueil-boite' + (grande ? ' accueil-large' : '') + (repliee ? ' accueil-repli' : '');
  const pictogramme = picto ? `<span class="accueil-boite-icone" aria-hidden="true">${icone(picto)}</span>` : '';
  const texte = `<div class="accueil-entete-texte"><h2 class="accueil-titre" id="${id}">${titre}</h2>${sousTexte ? `<p class="accueil-sous-texte">${echapper(sousTexte)}</p>` : ''}</div>`;
  if (repliee) return `<details class="${classes}"><summary><div class="accueil-entete">${pictogramme}${texte}${CHEVRON}</div></summary><div class="accueil-corps">\n${html}\n</div></details>`;
  return `<section class="${classes}" aria-labelledby="${id}"><div class="accueil-entete">${pictogramme}${texte}</div><div class="accueil-corps">\n${html}\n</div></section>`;
}

function pageAccueil(conf, sections, pages, version, donnees, date) {
  const total = pages.length;
  const entree = sections[0];
  const themes = sections.slice(1);
  const tuiles = boite({
    id: `section-${entree.id}`, titre: `<a href="${sectionUrl(entree)}">${echapper(entree.titre)}</a>`, picto: entree.picto || 'mdiCompassOutline', sousTexte: entree.chapeau, grande: true,
    html: `<ul class="accueil-tuiles">${entree.pages.map(p => `<li><span class="accueil-tuile-emoji" aria-hidden="true">${p.picto || entree.icone}</span><a href="${p.slug}.html"><span class="accueil-tuile-libelle">${echapper(p.titre)}</span><small class="accueil-tuile-desc">≈ ${p.minutes} min · ${questionsTexte(p)} <span class="et-badge et-badge-discret" data-etat-badge data-slug="${p.slug}" hidden></span></small></a></li>`).join('')}</ul>`,
  });
  const volets = themes.map((s, i) => `<details class="accueil-theme" id="theme-${s.id}" open><summary><span class="accueil-theme-icone teinte-${i % 6 + 1}" aria-hidden="true">${icone(s.picto || 'mdiTagOutline')}</span><span class="accueil-theme-texte"><span class="accueil-theme-titre"><a href="${sectionUrl(s)}">${echapper(s.titre)}</a></span><span class="accueil-theme-desc">${echapper(s.chapeau)}</span></span><small>${pluriel(s.pages.length, 'article')}</small>${CHEVRON}</summary><ul>${s.pages.map(p => `<li><a href="${p.slug}.html">${echapper(p.titre)}</a> <small class="et-liste-meta">≈ ${p.minutes} min</small> <span class="et-badge et-badge-discret" data-etat-badge data-slug="${p.slug}" hidden></span></li>`).join('')}</ul><a class="accueil-theme-page" href="${sectionUrl(s)}">Page du thème →</a></details>`).join('');
  const boiteThemes = boite({
    id: 'themes', titre: 'Les thèmes du wiki', picto: 'mdiLayersTripleOutline', grande: true, sousTexte: `${themes.length} thèmes, ${pages.length - entree.pages.length} articles, dans l'ordre que tu veux.`,
    html: `<nav class="accueil-themes-nav" aria-label="Aller à un thème">${themes.map(s => `<a href="#theme-${s.id}">${echapper(s.titre)}</a>`).join('')}</nav><div class="accueil-groupes accueil-themes">${volets}</div>`,
  });
  const lectures = boite({
    id: 'mes-lectures', titre: 'Mes lectures', picto: 'mdiBookOpenVariant',
    html: `<p aria-live="polite"><strong id="progressionCompte" data-progression-compte="">0</strong> lecture(s) attestée(s) sur ${total}.</p><p id="reprendreAccueil" hidden>Reprendre : <a href="#"></a></p><p><a href="parcours.html">Voir mes lectures et mes attestations →</a></p>`,
  });
  const aide = boite({
    id: 'besoin-de-parler', titre: 'Besoin de parler ?', picto: 'mdiPhone',
    html: `<p>Pour parler à quelqu'un, de jour comme de nuit : <a href="ou-appeler.html">Où appeler quand ça ne va pas</a>, et <a href="pae.html">le programme d'aide aux employés</a>. En cas de danger immédiat, compose le <a class="et-tel" href="tel:911">911</a>.</p>`,
  });
  const comment = boite({
    id: 'comment-ca-marche', titre: 'Comment ça marche', picto: 'mdiHelpCircle', grande: true, repliee: true, sousTexte: 'Lire, répondre, attester : trois étapes, à ton rythme.',
    html: `<ol>
<li><strong>Lis une page.</strong> Le temps passé sur la page, quand elle est à l'écran, est compté et affiché : il paraîtra sur ton attestation.</li>
<li><strong>Réponds aux questions</strong> en bas de la page : choix de réponse, vrai ou faux, réponses à cocher, étapes à remettre en ordre, et une réponse courte à écrire. Il faut ${conf.seuil} % de bonnes réponses aux questions corrigées ; tu peux recommencer autant de fois que tu veux.</li>
<li><strong>Atteste ta lecture</strong> : choisis ton nom dans la liste des employés et envoie. Tu obtiens une attestation à imprimer ou à enregistrer en PDF.</li>
</ol>
<p><strong>Ce qui est envoyé :</strong> ton nom, la page lue, ton temps de lecture, ton résultat et tes réponses écrites, au registre de formation de ton employeur, consulté par le service de santé et de sécurité. Rien ne part avant que tu cliques sur « Attester ma lecture ». Tes lectures en cours restent sur cet appareil.</p>`,
  });
  const corps = `${filAriane([['index.html', 'Accueil']])}
<div class="accueil-banniere">
<span class="accueil-icone accueil-illustration" aria-hidden="true">${illustrationWiki('securite') || conf.marque.icone}</span>
<header class="article-titre">
<h1 class="page-title">${echapper(nomLong(conf))}</h1>
<div class="accueil-chapeau"><p class="accueil-sous-titre">${conf.sousTitre}</p><p>${echapper(conf.chapeau)}</p></div>
<div class="page-sub"><span class="accueil-domaine">Page d’accueil du ${echapper(conf.nom)}</span><span class="accueil-compte-pages"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONE_LIVRE}"/></svg> <span class="accueil-nombre">${total}</span> articles</span></div>
</header>
</div>
<div class="page-body accueil-grille">
${tuiles}
${boiteThemes}
${lectures}
${aide}
${comment}
</div>
<nav class="accueil-index" aria-label="Index du wiki"><a href="index-alphabetique.html">Index alphabétique</a> <span class="crumb-sep">·</span> <a href="parcours.html">Mes lectures</a> <span class="crumb-sep">·</span> <a href="recherche.html">Recherche</a></nav>
<div class="page-meta"><span>Site généré le ${echapper(date)} · ${pluriel(total, 'article')}</span><span class="accueil-marque">${echapper(marqueCourte(conf))} — ${echapper(conf.nom)}</span></div>`;
  return page(conf, { titre: `${nomLong(conf)} — ${marqueCourte(conf)} Mines`, description: texteDe(conf.sousTitre), courant: 'index.html', corps, classeBody: 'et-accueil', attributs: ` data-relais="${echapper(conf.relais || '')}" data-seuil="${conf.seuil}"` }, sections, version, donnees);
}

function pageIndex(conf, sections, pages, version, donnees) {
  const tries = pages.slice().sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
  const corps = `${filAriane([['index.html', 'Accueil'], ['index-alphabetique.html', 'Index alphabétique']])}
<header class="article-titre">
<h1 class="page-title">Index alphabétique</h1>
<div class="page-sub">${pluriel(pages.length, 'article')} du ${echapper(conf.nom)}, de A à Z.</div>
</header>
<div class="page-body">
<ul class="cat-pages">${tries.map(p => `<li><a href="${p.slug}.html">${echapper(p.titre)}</a> <small class="cat-compte">${echapper(p.section.titre)} · ≈ ${p.minutes} min</small></li>`).join('')}</ul>
</div>`;
  return page(conf, { titre: `Index alphabétique — ${conf.nom}`, description: texteDe(conf.sousTitre), courant: 'index-alphabetique.html', corps, classeBody: 'et-index' }, sections, version, donnees);
}

function pageRecherche(conf, sections, version, donnees) {
  const corps = `${filAriane([['index.html', 'Accueil'], ['recherche.html', 'Recherche']])}
<header class="article-titre">
<h1 class="page-title">Recherche</h1>
<div class="page-sub">Cherche un mot dans les ${donnees.pages.length} articles du ${echapper(conf.nom)}.</div>
</header>
<div class="page-body">
<form class="et-recherche" role="search" action="recherche.html" method="get"><label for="q2" class="et-libelle">Que cherches-tu ?</label><div class="et-recherche-champ"><input type="search" id="q2" name="q" aria-label="Rechercher dans le wiki" placeholder="Par exemple : cadenas, masque, bruit…" autocomplete="off"><div id="suggest2" class="suggest" hidden></div></div><button type="submit" class="et-bouton">Chercher</button></form>
<div id="resultats" class="search-results" aria-live="polite"></div>
<noscript><h2>Tous les articles</h2><ul class="cat-pages">${donnees.pages.map(p => `<li><a href="${p.s}.html">${echapper(p.t)}</a></li>`).join('')}</ul></noscript>
</div>`;
  return page(conf, { titre: `Recherche — ${conf.nom}`, description: texteDe(conf.sousTitre), courant: 'recherche.html', corps, classeBody: 'et-recherche-page' }, sections, version, donnees);
}
function pageParcours(conf, sections, pages, version, donnees) {
  const corps = `${filAriane([['index.html', 'Accueil'], ['parcours.html', 'Mes lectures']])}
<header class="article-titre">
<h1 class="page-title">Mes lectures</h1>
<div class="page-sub">Ce que tu as lu et attesté, page par page. Ces repères sont gardés sur cet appareil seulement.</div>
</header>
<div class="page-body">
<p class="et-progression-texte" aria-live="polite"><strong id="progressionCompte" data-progression-compte="">0</strong> lecture(s) attestée(s) sur ${pages.length}.</p>
${sections.map(s => `<h2 id="${s.id}">${s.icone} ${echapper(s.titre)}</h2>\n${listeNotions(s.pages)}`).join('\n')}
<h2 id="attestations">Mes attestations</h2>
<div id="listeAttestations"><p>Aucune attestation sur cet appareil pour l'instant.</p></div>
</div>`;
  return page(conf, { titre: `Mes lectures — ${conf.nom}`, description: texteDe(conf.sousTitre), courant: 'parcours.html', corps, classeBody: 'et-parcours' }, sections, version, donnees);
}

// ---------- génération ----------

export function chargerConf(outils = OUTILS) {
  const conf = JSON.parse(fs.readFileSync(path.join(outils, 'travailleurs', 'pages.json'), 'utf8'));
  if (!conf.nom || !conf.marque || !conf.marque.gros) throw new Error('pages.json : « nom » et « marque » (icone, gros, petit) sont requis');
  if (!Array.isArray(conf.sections) || !conf.sections.length) throw new Error('pages.json : aucune section');
  if (!Number.isInteger(conf.seuil) || conf.seuil < 0 || conf.seuil > 100) throw new Error('pages.json : « seuil » doit être un entier de 0 à 100');
  if (conf.relais && !/^https:\/\/[^\s"'<>]+$/.test(conf.relais)) throw new Error('pages.json : « relais » doit être une adresse https');
  for (const s of conf.sections) {
    if (!/^[a-z0-9-]+$/.test(s.id || '') || !s.titre || !s.etiquette) throw new Error(`pages.json : section « ${s.id || s.titre} » : id, titre et etiquette requis`);
    if (s.picto) icone(s.picto);   // nom d'icône vérifié dès la lecture
  }
  return conf;
}

// Prépare les pages de l'espace (sans rien écrire) : utilisé par la génération et par le contrôle
// des questions (tools/travailleurs/verifier.mjs), qui lisent ainsi exactement le même texte.
export function preparerEspace(OUT, { outils = OUTILS } = {}) {
  const conf = chargerConf(outils);
  const racine = path.join(outils, 'travailleurs');
  const entrees = conf.sections.flatMap(s => s.pages.map(p => ({ ...p, section: s })));
  const slugs = new Set();
  for (const e of entrees) {
    if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(e.slug || '')) throw new Error(`pages.json : slug invalide « ${e.slug} »`);
    if (slugs.has(e.slug)) throw new Error(`pages.json : slug en double « ${e.slug} »`);
    if (!e.source === !e.fichier) throw new Error(`pages.json : « ${e.slug} » doit avoir une « source » (page du wiki) ou un « fichier » (Markdown), pas les deux`);
    slugs.add(e.slug);
  }
  // pages connues du dossier mais hors de l'espace : un lien vers elles devient du texte
  const connus = new Set([...slugs, ...((conf.horsEspace && conf.horsEspace.slugs) || []), ...fs.readdirSync(path.join(racine, 'pages')).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3))]);
  const parSource = new Map(entrees.filter(e => e.source).map(e => [e.source, e.slug]));
  for (const [chemin, slug] of Object.entries(conf.renvois || {})) {
    if (!slugs.has(slug)) throw new Error(`pages.json : renvoi vers une page absente de l'espace « ${slug} »`);
    if (!parSource.has(chemin)) parSource.set(chemin, slug);
  }
  const cible = (chemin) => parSource.get(chemin) || '';

  // corrections de l'espace (tools/travailleurs/corrections.json) : passages des pages du wiki
  // reconnus faux et corrigés dans la copie remise aux travailleurs, en attendant leur report dans
  // le vault. Chacune doit retrouver son passage exact une seule fois : une correction qui ne
  // s'applique plus (page modifiée dans le vault) arrête la construction au lieu de se perdre.
  // Une correction d'une page retirée de l'espace attend, sans rien bloquer.
  const fCorr = path.join(racine, 'corrections.json');
  const toutesCorrections = fs.existsSync(fCorr) ? (JSON.parse(fs.readFileSync(fCorr, 'utf8')).corrections || []) : [];
  const corrections = toutesCorrections.filter(c => slugs.has(c.page));
  for (const c of corrections) if (!entrees.find(e => e.slug === c.page).source) throw new Error(`corrections.json : « ${c.page} » n'est pas une page du wiki recopiée dans l'espace`);
  const corrige = (slug, html) => corrections.filter(c => c.page === slug).reduce((h, c) => {
    const n = h.split(c.avant).length - 1;
    if (n !== 1) throw new Error(`corrections.json (${slug}) : le passage à corriger apparaît ${n} fois au lieu d'une — la page a changé ? « ${c.avant.slice(0, 90)}… »`);
    return h.replace(c.avant, () => c.apres);
  }, html);

  const introuvables = [];
  const coupes = new Map();
  const pages = entrees.map(e => {
    let titre, revision = '', corps, resume = '', sources = [];
    if (e.source) {
      const fichier = path.join(OUT, e.source);
      if (!fs.existsSync(fichier)) { introuvables.push(`${e.slug} ← ${e.source}`); return null; }
      const x = extrairePage(fs.readFileSync(fichier, 'utf8'));
      const r = reecrireLiens(corrige(e.slug, x.corps), e.source, cible);
      for (const c of r.coupes) coupes.set(c, (coupes.get(c) || 0) + 1);
      titre = e.titre || x.titre; revision = x.revision; corps = r.html; resume = e.resume || '';
    } else {
      const fichier = path.join(racine, e.fichier);
      if (!fs.existsSync(fichier)) { introuvables.push(`${e.slug} ← tools/travailleurs/${e.fichier}`); return null; }
      let md;
      try { md = lireMarkdown(fs.readFileSync(fichier, 'utf8'), slugs, connus); }
      catch (err) { throw new Error(`tools/travailleurs/${e.fichier} : ${err.message}`); }
      titre = e.titre || md.titre; revision = md.revision; corps = md.corps; resume = e.resume || md.resume; sources = md.sources;
    }
    const fq = path.join(racine, 'questions', `${e.slug}.json`);
    const questions = fs.existsSync(fq) ? validerQuestions(JSON.parse(fs.readFileSync(fq, 'utf8')), e.slug) : [];
    corps = identifierTitres(lierTelephones(corps), ['questions', 'attestation', 'sources', 'questions-titre', 'attestation-titre']);
    const mots = compterMots(corps);
    return { slug: e.slug, titre, revision, corps, resume: resume || premierePhrase(texteDe(corps)), sources, questions, mots, minutes: minutesEstimees(mots),
      fichier: e.fichier || '', section: e.section, etiquette: e.section.etiquette, icone: e.section.icone };
  });
  // Une page de la liste qui a disparu du site arrête la construction, comme une cible morte du
  // portail /g/ : un parcours remis aux travailleurs ne perd pas une lecture en silence.
  if (introuvables.length) throw new Error(`Espace travailleurs : page(s) introuvable(s) — corriger tools/travailleurs/pages.json :\n   ${introuvables.join('\n   ')}`);
  pages.forEach((p, i) => { p.precedente = pages[i - 1] ? { slug: pages[i - 1].slug, titre: pages[i - 1].titre } : null; p.suivante = pages[i + 1] ? { slug: pages[i + 1].slug, titre: pages[i + 1].titre } : null; });
  const sections = conf.sections.map(s => ({ ...s, pages: pages.filter(p => p.section === s) }));
  for (const s of sections) for (const p of s.pages) p.section = s;
  // « Voir aussi » : les autres pages de la section ; « Pages qui pointent ici » : liens entre pages
  const parSlug = new Map(pages.map(p => [p.slug, p]));
  for (const p of pages) {
    p.voirAussi = p.section.pages.filter(v => v !== p).slice(0, 6).map(v => ({ slug: v.slug, titre: v.titre }));
    p.liens = [...new Set([...p.corps.matchAll(/href="([a-z0-9-]+)\.html(?:#[^"]*)?"/g)].map(m => m[1]).filter(s => s !== p.slug && parSlug.has(s)))];
  }
  for (const p of pages) p.liees = pages.filter(v => v.liens.includes(p.slug)).map(v => ({ slug: v.slug, titre: v.titre, section: v.section }));
  return { conf, racine, pages, sections, coupes, corrections, correctionsEnAttente: toutesCorrections.length - corrections.length };
}

export function genererEspaceTravailleurs(OUT, { outils = OUTILS, journal = console, date = new Date().toISOString().slice(0, 10) } = {}) {
  const { conf, racine, pages, sections, coupes, corrections, correctionsEnAttente } = preparerEspace(OUT, { outils });
  // version des ressources : empreinte de ce qui est écrit, pour que le navigateur reprenne les
  // nouvelles versions sans dépendre de l'estampille du wiki
  const js = fs.readFileSync(path.join(racine, 'travailleurs.js'), 'utf8');
  const css = fs.readFileSync(path.join(racine, 'travailleurs.css'), 'utf8');
  const version = crypto.createHash('sha1').update(js).update(css).update(JSON.stringify(conf)).update(pages.map(p => p.corps + JSON.stringify(p.questions)).join('')).digest('hex').slice(0, 10);
  // ce que chaque page embarque : la liste des pages (page au hasard, recherche, états de lecture)
  const donnees = { pages: pages.map((p, o) => ({ s: p.slug, t: p.titre, k: p.section.id, o })), sections: sections.map(s => ({ id: s.id, titre: s.titre, icone: s.icone })) };
  // index de la recherche interne : titre, résumé, section et texte de chaque page
  const index = pages.map(p => ({ s: p.slug, t: p.titre, r: p.resume, k: p.section.titre, m: p.minutes, x: texteDe(p.corps).replace(/\s+/g, ' ').slice(0, 4000) }));

  const dest = path.join(OUT, DOSSIER);
  const attendu = path.resolve(OUT, DOSSIER);
  if (path.relative(path.resolve(OUT), attendu) !== DOSSIER) throw new Error('Sortie de l\'espace travailleurs non sûre : nettoyage refusé.');
  fs.rmSync(dest, { recursive: true, force: true, maxRetries: 20, retryDelay: 400 });
  fs.mkdirSync(path.join(dest, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dest, 'assets', 'travailleurs.js'), js);
  fs.writeFileSync(path.join(dest, 'assets', 'travailleurs.css'), css);
  fs.writeFileSync(path.join(dest, 'assets', 'index-recherche.json'), JSON.stringify(index));
  for (const p of pages) fs.writeFileSync(path.join(dest, `${p.slug}.html`), pageLecture(conf, p, sections, version, donnees));
  for (const s of sections) fs.writeFileSync(path.join(dest, sectionUrl(s)), pageSection(conf, s, sections, version, donnees));
  fs.writeFileSync(path.join(dest, 'index.html'), pageAccueil(conf, sections, pages, version, donnees, date));
  fs.writeFileSync(path.join(dest, 'recherche.html'), pageRecherche(conf, sections, version, donnees));
  fs.writeFileSync(path.join(dest, 'index-alphabetique.html'), pageIndex(conf, sections, pages, version, donnees));
  fs.writeFileSync(path.join(dest, 'parcours.html'), pageParcours(conf, sections, pages, version, donnees));

  const nbQuestions = pages.reduce((a, p) => a + p.questions.length, 0);
  const sansQuestions = pages.filter(p => !p.questions.length).map(p => p.slug);
  journal.log(`Espace travailleurs : ${pages.length} pages en ${sections.length} sections · ${nbQuestions} questions · ${corrections.length} corrections${correctionsEnAttente ? ` (+${correctionsEnAttente} en attente, pages hors de l'espace)` : ''} · relais ${conf.relais || 'non configuré'}${sansQuestions.length ? ` · sans questions : ${sansQuestions.join(', ')}` : ''}`);
  return { pages: pages.length, sections: sections.length, questions: nbQuestions, corrections: corrections.length, sansQuestions, coupes: [...coupes].sort((a, b) => b[1] - a[1]), version };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const r = genererEspaceTravailleurs(path.resolve(OUTILS, '..', 'docs'));
    if (process.argv.includes('--liens')) {
      console.log('Liens vers le reste du wiki, rendus en texte :');
      r.coupes.forEach(([c, n]) => console.log(`   ${n}× ${c}`));
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
