// Pose les schémas d'une page d'après une « spec » (texte alternatif, légende, version texte, sources,
// ancre), dans la page publiée ET dans un lot pour le vault, pour que les deux disent la même chose.
// Généralise ce qui a été fait à la main pour « Espaces clos » (25 septembre 2026).
//
//   node tools/poser_schemas.mjs --spec <spec.json> --medias <dossier des SVG> --lot content-updates/<lot>.json [--ecrire]
//
// Sans --ecrire : essai, rien n'est écrit (ancres, captures et liens sont tout de même vérifiés).
//
// spec.json :
//   page        adresse publiée (w/<wiki>/<page>.html)
//   note        { titre, wiki, chemin? } — pour retrouver la note du vault (appliquer_retouches.mjs)
//   schemas[]   { fichier, ancre, remplace?, alt, legende, puces[], sources }
//     fichier   schéma SVG (480 de large), ou image PNG / JPEG (une illustration fournie par l'auteur,
//               par exemple : au moins 480 px de large, 1,5 Mo au plus)
//     sombre    true : dessin conçu sur fond sombre (style retenu par Frank le 26 septembre 2026) ; le
//               thème sombre du site ne l'inverse pas (classe « infographie-sombre »)
//     ancre     texte visible d'un paragraphe, d'un titre ou d'une dernière puce, unique : le schéma se pose
//               juste après ; sans ancre, il prend la place exacte de la capture qu'il remplace
//     remplace  capture de cours que le schéma remplace (« pasted-image-AAAAMMJJhhmmss » ou nom de fichier)
//     remplaceSchema  fichier de la version publiée avant (« …-v1.svg »), ou liste des versions antérieures
//               (la plus récente d'abord : la note a pu recevoir l'une ou l'autre) : le nouveau bloc prend sa
//               place, dans la page comme dans la note (retouche remplacerBloc) ; un ancien fichier qui n'est
//               plus cité par aucune page est retiré du site
//     sources   liens internes {{lien:w/…/page.html|libellé}}, liens externes <a href="https://…">libellé</a>
//   paragraphesRetires[]  texte visible de <p> à retirer (légende d'une capture retirée, par exemple)
//   remplacementsHtml[]   { avant, apres } : correction exacte dans la page publiée (une seule occurrence)
//   retouchesVault[]      retouches du même changement dans la note (format de retouches.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dimensionsSvg, dimensionsImage } from './dimensions_svg.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const texte = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const entites = s => String(s).replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// texte visible d'un fragment HTML, comparé sans égard aux apostrophes, espaces insécables et blancs
export const visible = h => entites(String(h).replace(/<[^>]+>/g, ''))
  .replace(/[’‘]/g, "'").replace(/[  ]/g, ' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

// Versions antérieures d'un schéma (remplaceSchema : un fichier ou une liste, la plus récente d'abord).
export const precedents = s => [].concat(s.remplaceSchema || []);

// Classes du bloc : un dessin conçu sur fond sombre porte « infographie-sombre », que le thème sombre n'inverse pas.
const classesBloc = s => 'infographie infographie-compacte infographie-schema' + (s.sombre ? ' infographie-sombre' : '');

// Bloc de la page publiée, tel que le générateur le rend depuis le bloc de la note (bloc Markdown ci-dessous).
export function blocHtml(s, { racine, dims, titreDe, hrefDe = a => racine + a }) {
  const u = racine + 'files/infographies/' + s.fichier;
  const dim = dims ? ` width="${dims.largeur}" height="${dims.hauteur}"` : '';
  return `<div class="${classesBloc(s)}"><span class="page-img"><a class="img-lien" href="${u}"><img src="${u}" alt="${esc(s.alt)}"${dim} loading="lazy"></a><span class="img-zoom">Toucher l'image pour l'agrandir</span></span>\n`
    + `<p class="infographie-legende">${texte(s.legende)}</p><details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n`
    + s.puces.map(p => `<li>${texte(p)}</li>\n`).join('')
    + `</ul>\n</details>\n<p class="infographie-sources">${sourcesHtml(s.sources, { titreDe, hrefDe })}</p></div>`;
}

export function blocMd(s) {
  const alt = String(s.alt).replace(/\|/g, '/').replace(/\]\]/g, '] ]');
  return `<div class="${classesBloc(s)}">\n\n![[Infographies/${s.fichier}|${alt}]]\n\n`
    + `<p class="infographie-legende">${texte(s.legende)}</p>\n\n<details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n`
    + s.puces.map(p => `<li>${texte(p)}</li>\n`).join('')
    + `</ul>\n</details>\n<p class="infographie-sources">${sourcesMd(s.sources)}</p>\n\n</div>`;
}

// Sources : le texte est échappé, les balises <a href> et les {{lien:…}} gardées telles quelles.
function morceaux(src) {
  // toute balise <a …>…</a> est isolée : une forme non prise en charge est refusée plus bas, jamais
  // publiée comme du texte échappé (« &lt;a class=… »)
  return String(src).split(/(<a\b[^>]*>[^<]*<\/a>|\{\{lien:[^|}]+\|[^}]+\}\})/);
}
function sourcesMd(src) {
  return morceaux(src).map(m => (m.startsWith('<a ') || m.startsWith('{{lien:')) ? m : texte(entites(m))).join('');
}
function sourcesHtml(src, { titreDe, hrefDe }) {
  return morceaux(src).map(m => {
    const lien = m.match(/^\{\{lien:([^|}]+)\|([^}]+)\}\}$/);
    if (lien) return `<a href="${hrefDe(lien[1].trim())}" title="${esc(titreDe(lien[1].trim()))}">${texte(entites(lien[2]))}</a>`;
    if (m.startsWith('<a href="https://') || m.startsWith('<a href="http://')) return m.replace(/^<a href=/, '<a class="external" target="_blank" rel="noopener" href=');
    if (m.startsWith('<a ')) throw new Error('lien de source non pris en charge : ' + m);
    return texte(entites(m));
  }).join('');
}

// Élément (paragraphe, titre ou puce) dont le texte visible est l'ancre — le texte entier, sinon son
// début, sinon un fragment d'au moins 20 caractères, comme « ligneContenant » côté note ; un seul doit
// répondre. Une puce n'est admise que si elle est la dernière de sa liste : le schéma se pose après la
// liste, là où la note, qui l'insère après la ligne de la puce, termine aussi la liste.
export function trouverAncre(html, ancre) {
  const voulu = visible(ancre);
  // le sommaire, la navigation et « Voir aussi » répètent les titres de la page : on n'y pose rien
  const navs = [...html.matchAll(/<nav\b[\s\S]*?<\/nav>/g)].map(m => [m.index, m.index + m[0].length]);
  const blocs = [...html.matchAll(/<(p|h[1-6]|li)\b[^>]*>([\s\S]*?)<\/\1>/g)]
    .filter(m => !navs.some(([debut, fin]) => m.index >= debut && m.index < fin));
  let r = blocs.filter(m => visible(m[2]) === voulu);
  if (r.length === 0 && voulu.length >= 25) r = blocs.filter(m => visible(m[2]).startsWith(voulu));
  if (r.length === 0 && voulu.length >= 20) r = blocs.filter(m => visible(m[2]).includes(voulu));
  if (r.length !== 1) throw new Error(`ancre ${r.length ? 'ambiguë (' + r.length + ')' : 'introuvable'} : « ${ancre} »`);
  const fin = r[0].index + r[0][0].length;
  if (r[0][1] !== 'li') return { debut: r[0].index, fin };
  const suite = html.slice(fin).match(/^\s*<\/(ul|ol)>/);
  if (!suite) throw new Error(`ancre sur une puce qui n'est pas la dernière de sa liste : « ${ancre} »`);
  return { debut: r[0].index, fin: fin + suite[0].length };
}

// Capture de cours insérée par le générateur (<span class="page-img">…</span></span>).
function trouverCapture(html, nom) {
  const motif = new RegExp('<span class="page-img"><a class="img-lien" href="[^"]*' + nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^"]*">[\\s\\S]*?</span></span>\\n?', 'g');
  const r = [...html.matchAll(motif)];
  if (r.length !== 1) throw new Error(`capture ${r.length ? 'ambiguë' : 'introuvable'} : ${nom}`);
  return r[0];
}

// Ligne de la note qui intègre la capture : les images collées s'appellent « Pasted image AAAAMMJJhhmmss ».
export function repereCapture(nom) {
  const m = String(nom).match(/pasted-image-(\d{14})/i);
  return m ? m[1] : path.basename(String(nom));
}

export function poserDansPage(html, spec, { racine, dimsDe, titreDe, hrefDe = a => racine + a }) {
  let h = html;
  for (const r of spec.remplacementsHtml || []) {
    // {{lien:<adresse publiée>|<libellé>}} devient un lien vers cette page, avec la racine de la page
    // posée (la copie encadrement g/ n'a pas la même) et le titre de la cible, comme le fait le générateur
    const apres = String(r.apres).replace(/\{\{lien:([^|}]+)\|([^}]+)\}\}/g,
      (m, a, lib) => `<a href="${hrefDe(a.trim())}" title="${esc(titreDe(a.trim()))}">${lib}</a>`);
    // « motif » (expression régulière) au lieu d'« avant » quand la page et sa copie g/ diffèrent
    // (un mot lié dans l'une, pas dans l'autre)
    const n = r.motif ? [...h.matchAll(new RegExp(r.motif, 'g'))].length : h.split(r.avant).length - 1;
    if (n === 1) h = r.motif ? h.replace(new RegExp(r.motif), () => apres) : h.replace(r.avant, () => apres);
    else if (!(n === 0 && h.includes(apres))) throw new Error(`correction ${n ? 'ambiguë' : 'introuvable'} : « ${String(r.avant || r.motif).slice(0, 60)} »`);
  }
  const blocPublie = fichier => new RegExp('<div class="infographie[^"]*infographie-schema[^"]*">(?:(?!<div class="infographie)[\\s\\S])*?' + fichier.replace(/\./g, '\\.') + '[\\s\\S]*?</div>');
  for (const s of spec.schemas) {
    const bloc = blocHtml(s, { racine, dims: dimsDe(s.fichier), titreDe, hrefDe });
    // schéma déjà posé : on le remplace par sa version à jour (spec corrigée)
    const deja = blocPublie(s.fichier);
    if (deja.test(h)) { h = h.replace(deja, () => bloc); continue; }
    // nouvelle version d'un schéma publié : elle prend la place de l'ancienne (une seule présente, comme côté vault)
    if (s.remplaceSchema) {
      const presents = precedents(s).filter(a => blocPublie(a).test(h));
      if (!presents.length) throw new Error('schéma à remplacer absent de la page : ' + precedents(s).join(' ou '));
      if (presents.length > 1) throw new Error('plusieurs versions du schéma à remplacer dans la page : ' + presents.join(' et '));
      h = h.replace(blocPublie(presents[0]), () => bloc);
      continue;
    }
    // sans ancre : le schéma prend la place exacte de la capture qu'il remplace (sous un tableau, par exemple)
    if (!s.ancre) {
      if (!s.remplace) throw new Error('schéma sans ancre ni capture à remplacer : ' + s.fichier);
      const c = trouverCapture(h, s.remplace);
      h = h.slice(0, c.index) + bloc + '\n' + h.slice(c.index + c[0].length);
      continue;
    }
    if (s.remplace) { const c = trouverCapture(h, s.remplace); h = h.slice(0, c.index) + h.slice(c.index + c[0].length); }
    const a = trouverAncre(h, s.ancre);
    h = h.slice(0, a.fin) + '\n' + bloc + h.slice(a.fin);
  }
  for (const p of spec.paragraphesRetires || []) {
    const voulu = visible(p);
    const r = [...h.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>\n?/g)].filter(m => visible(m[1]) === voulu);
    if (r.length > 1) throw new Error('paragraphe à retirer ambigu : ' + p);
    if (r.length === 1) h = h.slice(0, r[0].index) + h.slice(r[0].index + r[0][0].length);
  }
  return h;
}

export function lotDepuisSpec(spec, { date, revision, portee, precautions }) {
  const retouches = [];
  // ce qui a retiré une ligne de la note : le schéma, ou une version antérieure si la note l'a déjà reçue
  const retireePar = s => s.remplaceSchema ? ['Infographies/' + s.fichier, ...precedents(s).map(a => 'Infographies/' + a)] : 'Infographies/' + s.fichier;
  for (const s of spec.schemas) {
    const marqueur = 'Infographies/' + s.fichier;
    // sans ancre, le bloc se pose après la ligne de la capture, puis cette ligne est retirée : il prend sa place
    const ligneContenant = s.ancre || repereCapture(s.remplace);
    if (s.remplaceSchema) {
      const anciens = precedents(s).map(a => 'Infographies/' + a);
      retouches.push({ type: 'remplacerBloc', ligneContenant, ancien: anciens.length === 1 ? anciens[0] : anciens, bloc: blocMd(s), marqueur });
    }
    else retouches.push({ type: 'insererApres', ligneContenant, bloc: blocMd(s), marqueur });
    if (s.remplace) retouches.push({ type: 'supprimerLigne', ligneContenant: repereCapture(s.remplace), marqueur: retireePar(s) });
  }
  const premier = spec.schemas[0] && retireePar(spec.schemas[0]);
  for (const p of spec.paragraphesRetires || []) retouches.push({ type: 'supprimerLigne', ligneContenant: p, marqueur: premier });
  retouches.push(...(spec.retouchesVault || []));
  const lot = spec.lot || {};
  return {
    date: lot.date || date, revision: lot.revision || revision, portee: lot.portee || portee, precautions: lot.precautions || precautions,
    application: 'node tools/appliquer_retouches.mjs --lot <ce fichier> (essai), puis --appliquer ; ensuite node tools/build_site.mjs',
    note: { ...spec.note, page: spec.page },
    medias: spec.schemas.map(s => ({ depuis: 'docs/files/infographies/' + s.fichier, dossierVault: 'Infographies' })),
    retouches,
  };
}

export function verifierSvg(texteSvg, nom) {
  const d = dimensionsSvg(texteSvg);
  if (!d || d.largeur !== 480) throw new Error('schéma : largeur de dessin 480 attendue : ' + nom);
  const racineSvg = texteSvg.match(/<svg\b[^>]*>/)[0];
  const vb = racineSvg.match(/\sviewBox="0 0 480 (\d+)"/);
  if (!vb || !racineSvg.includes(' width="480"') || !racineSvg.includes(` height="${vb[1]}"`)) throw new Error('schéma : width/height identiques au viewBox « 0 0 480 H » : ' + nom);
  if (!/<title[^>]*>[^<]{10,}<\/title>/.test(texteSvg) || !/<desc[^>]*>[^<]{40,}<\/desc>/.test(texteSvg)) throw new Error('schéma : titre et description accessibles : ' + nom);
  if (/<script|<image|<foreignObject|href="http|@import|url\(http/i.test(texteSvg)) throw new Error('schéma : ressource externe ou script : ' + nom);
  return d;
}

// Image matricielle : signature vérifiée (une extension trompeuse est refusée), assez large pour rester
// nette à l'agrandissement, assez légère pour la lecture hors ligne. Ses dimensions, lues dans son en-tête,
// réservent sa place comme celles d'un SVG ; le générateur fait de même pour les images des infographies.
export function verifierImage(octets, nom) {
  const ext = path.extname(nom).toLowerCase();
  const b = Buffer.from(octets);
  const png = b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) throw new Error('schéma : format non pris en charge (SVG, PNG ou JPEG) : ' + nom);
  if (ext === '.png' ? !png : !jpeg) throw new Error('image : contenu illisible ou extension trompeuse : ' + nom);
  const d = dimensionsImage(b);
  if (!d || !d.largeur || !d.hauteur) throw new Error('image : dimensions illisibles : ' + nom);
  if (d.largeur < 480) throw new Error(`image : ${d.largeur} px de large, 480 au moins : ` + nom);
  if (b.length > 1.5e6) throw new Error('image : 1,5 Mo au plus : ' + nom);
  return d;
}

export function verifierMedia(chemin, nom) {
  return /\.svg$/i.test(nom) ? verifierSvg(fs.readFileSync(chemin, 'utf8'), nom) : verifierImage(fs.readFileSync(chemin), nom);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outils = path.dirname(fileURLToPath(import.meta.url));
  const docs = path.resolve(outils, '../docs');
  const args = process.argv.slice(2);
  const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const ECRIRE = args.includes('--ecrire');
  const spec = JSON.parse(fs.readFileSync(opt('--spec'), 'utf8'));
  const medias = opt('--medias') || path.dirname(opt('--spec'));
  const lotChemin = opt('--lot');
  if (!lotChemin) { console.error('Indiquer --lot content-updates/<lot>.json'); process.exit(1); }
  const dims = {};
  for (const s of spec.schemas) dims[s.fichier] = verifierMedia(path.join(medias, s.fichier), s.fichier);
  const titreDe = adresse => {
    const f = path.join(docs, adresse);
    if (!fs.existsSync(f)) throw new Error('lien vers une page absente : ' + adresse);
    const h1 = fs.readFileSync(f, 'utf8').match(/<h1 class="page-title">([\s\S]*?)<\/h1>/);
    return h1 ? entites(h1[1].replace(/<[^>]+>/g, '')).trim() : adresse;
  };
  // La note produit aussi une copie dans l'espace encadrement (g/) quand elle y est publiée : même
  // pose, racine plus profonde, et les liens vont à la copie g/ de la cible quand elle existe (le
  // recueil n'est jamais dupliqué), comme le fait le générateur.
  const pages = [spec.page, 'g/' + spec.page].filter(p => fs.existsSync(path.join(docs, p)));
  const poses = pages.map(p => {
    const racine = '../'.repeat(p.split('/').length - 1);
    const dansG = p.startsWith('g/');
    const hrefDe = a => racine + (dansG && fs.existsSync(path.join(docs, 'g', a)) ? 'g/' + a : a);
    const avant = fs.readFileSync(path.join(docs, p), 'utf8');
    return { p, apres: poserDansPage(avant, spec, { racine, hrefDe, dimsDe: f => dims[f], titreDe }) };
  });
  const lot = lotDepuisSpec(spec, { date: new Date().toISOString().slice(0, 10), revision: path.basename(lotChemin, '.json'), portee: 'Schémas de la page ' + spec.page, precautions: '' });
  console.log(`${pages.join(' + ')} : ${spec.schemas.length} schéma(s), ${(spec.remplacementsHtml || []).length} correction(s), ${lot.retouches.length} retouche(s) pour le vault`);
  if (ECRIRE) {
    for (const s of spec.schemas) fs.copyFileSync(path.join(medias, s.fichier), path.join(docs, 'files', 'infographies', s.fichier));
    for (const { p, apres } of poses) fs.writeFileSync(path.join(docs, p), apres);
    fs.writeFileSync(lotChemin, JSON.stringify(lot, null, 1) + '\n');
    // version remplacée : son fichier quitte le site quand plus aucune page ne l'affiche et qu'aucun autre
    // lot du vault ne le fournit encore (medias.depuis), sinon ce lot ne s'appliquerait plus
    const anciens = spec.schemas.flatMap(precedents);
    if (anciens.length) {
      const pagesHtml = fs.readdirSync(docs, { recursive: true }).filter(f => String(f).endsWith('.html'));
      const dossierLots = path.resolve(outils, '../content-updates');
      const autresLots = fs.readdirSync(dossierLots).filter(f => f.endsWith('.json') && path.resolve(dossierLots, f) !== path.resolve(lotChemin))
        .map(f => fs.readFileSync(path.join(dossierLots, f), 'utf8'));
      for (const a of anciens) {
        const f = path.join(docs, 'files', 'infographies', a);
        if (!fs.existsSync(f)) continue;
        const lot = autresLots.find(l => l.includes('docs/files/infographies/' + a + '"'));
        if (lot) { console.log('Gardé (fourni par un autre lot du vault) : files/infographies/' + a); continue; }
        if (!pagesHtml.some(x => fs.readFileSync(path.join(docs, x), 'utf8').includes(a))) {
          fs.rmSync(f);
          console.log('Retiré du site (plus cité) : files/infographies/' + a);
        }
      }
    }
    console.log('Écrit : page(s), schémas, ' + lotChemin + ' — puis node tools/regenerer_hors_ligne.mjs');
  } else console.log('Essai : rien n’est écrit sans --ecrire.');
}
