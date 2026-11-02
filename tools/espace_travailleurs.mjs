// Espace travailleurs (docs/travailleurs/) : les lectures remises aux travailleurs en arrêt de
// travail à la suite d'une blessure, avec questions et attestation de lecture.
//
// Un espace FERMÉ : aucune page de l'espace ne mène au reste du wiki (portail, encadrement /g/,
// démarrages rapides de la direction, des RH ou des conseillers, recherche, graphe…). Les pages
// du wiki y sont recopiées en gardant leur contenu ; un lien vers une autre page de l'espace est
// réécrit, un lien vers le reste du wiki devient du texte. Seules sortent : les images (médias de
// files/, pas des pages), les liens externes (sites publics, ouverts dans un nouvel onglet), les
// numéros de téléphone et les courriels.
//
// Ce n'est PAS un contrôle d'accès : GitHub Pages est public, et une adresse tapée à la main ouvre
// n'importe quelle page du site. L'espace n'offre simplement aucun chemin vers elles.
//
// Sources (rien ne dépend du vault) :
//   tools/travailleurs/pages.json      liste des pages, sections, relais, seuil, renvois
//   tools/travailleurs/pages/*.md      pages écrites pour l'espace
//   tools/travailleurs/questions/*.json  questions par page (format : tools/travailleurs/FORMAT.md)
//   tools/travailleurs/travailleurs.js|css  scripts et styles de l'espace
// Appelé par build_site.mjs après le rendu des pages ; seul, il réécrit docs/travailleurs/ à partir
// du docs/ en place :  node tools/espace_travailleurs.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

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
  const titre = h1 ? decoder(h1[1].replace(/<[^>]+>/g, '')).replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '').trim() : '';
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

// ---------- pages écrites pour l'espace (Markdown) ----------

const ENCADRES = {
  note: ['info', '📝'], info: ['info', 'ℹ️'], tip: ['tip', '💡'], astuce: ['tip', '💡'],
  warning: ['warning', '⚠️'], attention: ['warning', '⚠️'], important: ['warning', '❗'], danger: ['danger', '🚨'],
};
export function lireMarkdown(texte, slugs) {
  const yaml = require('js-yaml');
  const { marked } = require('marked');
  const m = texte.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
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
  corps = corps.replace(/<a href="([^"]*)"([^>]*)>/g, (tout, href, reste) => {
    const s = href.match(/^([a-z0-9-]+)\.html(#[\w-]*)?$/);
    if (s && slugs.has(s[1])) return tout;
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

// ---------- gabarits ----------

const SCRIPT_THEME = "try{var t=localStorage.getItem('theme');if(t==='light'||t==='auto')document.documentElement.setAttribute('data-theme',t);}catch(e){}";
function tete(titre, version, description) {
  return `<!DOCTYPE html>
<html lang="fr" data-espace="travailleurs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${echapper(titre)}</title>
<meta name="description" content="${echapper(description)}">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#1f4f99">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⛑️</text></svg>">
<link rel="stylesheet" href="../assets/style.css?v=${version}">
<link rel="stylesheet" href="assets/travailleurs.css?v=${version}">
<script>${SCRIPT_THEME}</script>
</head>`;
}
function entete(conf) {
  return `<header class="et-entete">
  <a class="et-marque" href="index.html"><span class="et-marque-icone" aria-hidden="true">⛑️</span><span><strong>${echapper(conf.titre)}</strong><small>WIKI SST · Mines</small></span></a>
  <button type="button" class="et-theme" id="btnTheme" aria-label="Changer de thème" title="Changer de thème"></button>
</header>`;
}
const PIED = `<footer class="et-pied"><p>Espace travailleurs · WIKI SST — Mines. Ces pages expliquent les règles ; elles ne remplacent ni ton médecin, ni la CNESST, ni un avis juridique.</p>
<p>Détresse ou danger immédiat : compose le <a class="et-tel" href="tel:911">911</a>.</p></footer>`;

function pageLecture(conf, p, version) {
  const donnees = JSON.stringify({ slug: p.slug, questions: p.questions }).replace(/</g, '\\u003c');
  const n = p.questions.length;
  const ouvertes = nonCorrigees(p.questions);
  const meta = [`Lecture estimée ≈ ${p.minutes} min`, n ? `${n} question${n > 1 ? 's' : ''}` : 'sans questions', p.revision ? `révisée le ${p.revision}` : ''].filter(Boolean).join(' · ');
  const suivante = p.suivante ? `<nav class="et-suivante" aria-label="Lecture suivante"><a href="${p.suivante.slug}.html"><small>Lecture suivante</small><span>${echapper(p.suivante.titre)} →</span></a></nav>` : '';
  return `${tete(`${p.titre} — ${conf.titre}`, version, p.resume || conf.sousTitre)}
<body class="espace-travailleurs et-lecture" data-slug="${p.slug}" data-titre="${echapper(p.titre)}" data-section="${echapper(p.etiquette)}"
  data-mots="${p.mots}" data-minutes="${p.minutes}" data-revision="${echapper(p.revision)}" data-relais="${echapper(conf.relais || '')}" data-seuil="${conf.seuil}">
<a class="et-sauter" href="#contenu">Aller au contenu</a>
${entete(conf)}
<main class="content et-page" id="contenu">
<nav class="et-fil" aria-label="Fil d'Ariane"><a href="index.html">← Toutes les lectures</a></nav>
<header class="article-titre et-titre">
<p class="et-section">${p.icone} ${echapper(p.etiquette)}</p>
<h1 class="page-title">${echapper(p.titre)}</h1>
<p class="et-meta">${echapper(meta)}</p>
</header>
<div class="et-etat-page" id="etatPage" hidden></div>
<ol class="et-etapes" aria-label="Marche à suivre">
<li><strong>Lis la page</strong> à ton rythme. Le temps de lecture est compté quand la page est à l'écran.</li>
<li><strong>Réponds aux questions</strong>${n ? ` (${n}${ouvertes ? `, dont ${ouvertes} à développement` : ''})` : ''}, en bas de la page.</li>
<li><strong>Atteste ta lecture</strong> : choisis ton nom dans la liste et envoie.</li>
</ol>
${p.resume ? `<p class="et-resume">${echapper(p.resume)}</p>` : ''}
<div class="page-body">
${p.corps}
</div>
<section class="et-questions" id="questions" aria-labelledby="questions-titre">
<h2 id="questions-titre">${n ? 'Questions sur ta lecture' : 'Ta lecture'}</h2>
<noscript><p class="et-avis">Les questions et l'attestation demandent JavaScript. Ouvre la page dans le navigateur de ton téléphone ou de ton ordinateur.</p></noscript>
<div id="questionsZone"></div>
</section>
<section class="et-attestation" id="attestation" aria-labelledby="attestation-titre" hidden></section>
${suivante}
</main>
${PIED}
<script type="application/json" id="donnees-questions">${donnees}</script>
<script src="assets/travailleurs.js?v=${version}"></script>
</body>
</html>
`;
}

function pageAccueil(conf, sections, version) {
  const total = sections.reduce((a, s) => a + s.pages.length, 0);
  const minutes = sections.reduce((a, s) => a + s.pages.reduce((b, p) => b + p.minutes, 0), 0);
  const cartes = sections.map(s => `<section class="et-section-bloc" aria-labelledby="sec-${s.id}">
<h2 id="sec-${s.id}"><span aria-hidden="true">${s.icone}</span> ${echapper(s.titre)}</h2>
<ol class="et-cartes">
${s.pages.map(p => `<li class="et-carte" data-slug="${p.slug}"><a href="${p.slug}.html"><span class="et-carte-titre">${echapper(p.titre)}</span>${p.resume ? `<span class="et-carte-resume">${echapper(p.resume)}</span>` : ''}<span class="et-carte-meta">≈ ${p.minutes} min · ${p.questions.length ? `${p.questions.length} questions` : 'sans questions'}</span><span class="et-badge" data-etat-badge>À lire</span></a></li>`).join('\n')}
</ol>
</section>`).join('\n');
  return `${tete(`${conf.titre} — WIKI SST Mines`, version, conf.sousTitre)}
<body class="espace-travailleurs et-accueil" data-relais="${echapper(conf.relais || '')}" data-seuil="${conf.seuil}">
<a class="et-sauter" href="#contenu">Aller au contenu</a>
${entete(conf)}
<main class="content et-page" id="contenu">
<header class="et-accueil-titre">
<h1 class="page-title">${echapper(conf.sousTitre)}</h1>
<p class="et-chapeau">Tu es en arrêt de travail à la suite d'une blessure. Ces lectures t'expliquent tes démarches et tes droits, t'aident à prendre soin de toi et à préparer ton retour. Lis-les à ton rythme : une page à la fois, dans l'ordre que tu veux.</p>
</header>
<div class="callout callout-danger et-urgence"><div class="callout-title"><span class="callout-icon">🆘</span>Si ça ne va pas maintenant</div><div class="callout-body"><p>En cas de danger ou de détresse immédiate, compose le <a class="et-tel" href="tel:911">911</a>. Pour parler à quelqu'un, consulte <a href="ou-appeler.html">Où appeler quand ça ne va pas</a>.</p></div></div>
<div class="et-progression" id="progression" aria-live="polite">
<div class="et-progression-texte"><strong id="progressionCompte">0</strong> lecture(s) attestée(s) sur ${total} · environ ${String(Math.round(minutes / 60 * 10) / 10).replace('.', ',')} h de lecture en tout</div>
<div class="et-barre" role="progressbar" aria-label="Lectures attestées" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0"><span id="progressionBarre"></span></div>
</div>
<details class="et-comment">
<summary>Comment ça marche</summary>
<ol>
<li>Ouvre une lecture et lis la page. Le temps de lecture est compté pendant que la page est à l'écran, et il est affiché quand tu soumets tes réponses.</li>
<li>Réponds aux questions en bas de la page : choix de réponse, vrai ou faux, réponses à cocher, étapes à remettre en ordre et une ou deux réponses courtes à écrire. Il faut ${conf.seuil} % de bonnes réponses aux questions corrigées ; tu peux recommencer.</li>
<li>Atteste ta lecture : choisis ton nom dans la liste des employés et envoie. Tu obtiens une attestation à imprimer ou à enregistrer en PDF.</li>
</ol>
<p><strong>Ce qui est envoyé :</strong> ton nom, la page lue, ton temps de lecture, ton résultat et tes réponses écrites. Ils sont enregistrés dans le registre de formation de ton employeur, consulté par le service de santé et de sécurité. Rien n'est envoyé avant que tu cliques sur « Attester ma lecture ».</p>
</details>
${cartes}
</main>
${PIED}
<script src="assets/travailleurs.js?v=${version}"></script>
</body>
</html>
`;
}

// ---------- génération ----------

export function chargerConf(outils = OUTILS) {
  const conf = JSON.parse(fs.readFileSync(path.join(outils, 'travailleurs', 'pages.json'), 'utf8'));
  if (!Array.isArray(conf.sections) || !conf.sections.length) throw new Error('pages.json : aucune section');
  if (!Number.isInteger(conf.seuil) || conf.seuil < 0 || conf.seuil > 100) throw new Error('pages.json : « seuil » doit être un entier de 0 à 100');
  if (conf.relais && !/^https:\/\/[^\s"'<>]+$/.test(conf.relais)) throw new Error('pages.json : « relais » doit être une adresse https');
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
  const fCorr = path.join(racine, 'corrections.json');
  const corrections = fs.existsSync(fCorr) ? (JSON.parse(fs.readFileSync(fCorr, 'utf8')).corrections || []) : [];
  for (const c of corrections) if (!slugs.has(c.page) || !entrees.find(e => e.slug === c.page).source) throw new Error(`corrections.json : « ${c.page} » n'est pas une page du wiki recopiée dans l'espace`);
  const corrige = (slug, html) => corrections.filter(c => c.page === slug).reduce((h, c) => {
    const n = h.split(c.avant).length - 1;
    if (n !== 1) throw new Error(`corrections.json (${slug}) : le passage à corriger apparaît ${n} fois au lieu d'une — la page a changé ? « ${c.avant.slice(0, 90)}… »`);
    return h.replace(c.avant, () => c.apres);
  }, html);

  const introuvables = [];
  const coupes = new Map();
  const pages = entrees.map(e => {
    let titre, revision = '', corps, resume = '';
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
      try { md = lireMarkdown(fs.readFileSync(fichier, 'utf8'), slugs); }
      catch (err) { throw new Error(`tools/travailleurs/${e.fichier} : ${err.message}`); }
      titre = e.titre || md.titre; revision = md.revision; corps = md.corps; resume = e.resume || md.resume;
    }
    const fq = path.join(racine, 'questions', `${e.slug}.json`);
    const questions = fs.existsSync(fq) ? validerQuestions(JSON.parse(fs.readFileSync(fq, 'utf8')), e.slug) : [];
    corps = lierTelephones(corps);
    const mots = compterMots(corps);
    return { slug: e.slug, titre, revision, corps, resume, questions, mots, minutes: minutesEstimees(mots),
      etiquette: e.section.etiquette || e.section.titre, icone: e.section.icone || '', sectionId: e.section.id };
  });
  // Une page de la liste qui a disparu du site arrête la construction, comme une cible morte du
  // portail /g/ : un parcours remis aux travailleurs ne perd pas une lecture en silence.
  if (introuvables.length) throw new Error(`Espace travailleurs : page(s) introuvable(s) — corriger tools/travailleurs/pages.json :\n   ${introuvables.join('\n   ')}`);
  pages.forEach((p, i) => { if (pages[i + 1]) p.suivante = { slug: pages[i + 1].slug, titre: pages[i + 1].titre }; });

  return { conf, racine, pages, coupes, corrections };
}

export function genererEspaceTravailleurs(OUT, { outils = OUTILS, journal = console } = {}) {
  const { conf, racine, pages, coupes, corrections } = preparerEspace(OUT, { outils });
  // version des ressources : empreinte de ce qui est écrit, pour que le navigateur reprenne les
  // nouvelles versions sans dépendre de l'estampille du wiki
  const js = fs.readFileSync(path.join(racine, 'travailleurs.js'), 'utf8');
  const css = fs.readFileSync(path.join(racine, 'travailleurs.css'), 'utf8');
  const version = crypto.createHash('sha1').update(js).update(css).update(JSON.stringify(conf)).update(pages.map(p => p.corps + JSON.stringify(p.questions)).join('')).digest('hex').slice(0, 10);

  const dest = path.join(OUT, DOSSIER);
  const attendu = path.resolve(OUT, DOSSIER);
  if (path.relative(path.resolve(OUT), attendu) !== DOSSIER) throw new Error('Sortie de l\'espace travailleurs non sûre : nettoyage refusé.');
  fs.rmSync(dest, { recursive: true, force: true, maxRetries: 20, retryDelay: 400 });
  fs.mkdirSync(path.join(dest, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dest, 'assets', 'travailleurs.js'), js);
  fs.writeFileSync(path.join(dest, 'assets', 'travailleurs.css'), css);
  const sections = conf.sections.map(s => ({ ...s, pages: pages.filter(p => p.sectionId === s.id) }));
  for (const p of pages) fs.writeFileSync(path.join(dest, `${p.slug}.html`), pageLecture(conf, p, version));
  fs.writeFileSync(path.join(dest, 'index.html'), pageAccueil(conf, sections, version));

  const nbQuestions = pages.reduce((a, p) => a + p.questions.length, 0);
  const sansQuestions = pages.filter(p => !p.questions.length).map(p => p.slug);
  journal.log(`Espace travailleurs : ${pages.length} pages · ${nbQuestions} questions · ${corrections.length} corrections · relais ${conf.relais || 'non configuré'}${sansQuestions.length ? ` · sans questions : ${sansQuestions.join(', ')}` : ''}`);
  return { pages: pages.length, questions: nbQuestions, corrections: corrections.length, sansQuestions, coupes: [...coupes].sort((a, b) => b[1] - a[1]), version };
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
