// Extrait le texte des articles de loi depuis les PDF officiels (LégisQuébec), article par article.
//
// Pourquoi : le recueil publie chaque article sous forme de capture PNG. Une image ne se
// copie pas, ne se lit pas au lecteur d'écran, ne se cherche pas et se lit mal sur téléphone.
// Les PDF sources ont une couche texte complète ; aucun OCR n'est employé, car un OCR
// introduirait des fautes dans un texte de loi.
//
// Comment : chaque page est lue avec ses coordonnées. Dans la mise en page de LégisQuébec,
// le corps est en 11 pt, les numéros d'article en 13 pt gras, et l'historique législatif
// (« 1979, c. 63, a. 49 ») en 9 pt, souvent imprimé glyphe par glyphe en colonne : on ne
// garde que les items d'au moins 10 pt. Un numéro d'article se reconnaît à sa taille, au moins
// un point de plus que le corps (les noms de police que donne pdf.js dépendent de l'ordre de
// chargement et ne disent pas si la police est grasse). Les lignes sont reconstituées par
// ordonnée, les articles découpés sur leurs numéros. Un article commence au numéro et
// s'arrête au suivant ou à un titre de section.
//
// Contrôles : numéros croissants, page du PDF cohérente avec le renvoi « #page=N » de la
// note, texte non vide. Un article qui échoue à un contrôle n'est pas exporté : la page
// garde alors sa capture seule. Rien ici n'est corrigé ou complété à la main.
//
// Usage : node tools/extraire_textes_loi.mjs [--pdf <dossier>] [--sortie tools/textes-loi]
//         [--loi LSST] — sans --loi, toutes les lois du tableau LOIS.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DOSSIER_PDF = opt('--pdf', path.resolve(__dirname, '../docs/files/recueil-legislatif-sst'));
const SORTIE = opt('--sortie', path.resolve(__dirname, 'textes-loi'));
const SEULE = opt('--loi', null);

// Chemin du PDF relatif au recueil, et forme des numéros d'article dans ce texte.
export const LOIS = {
  LSST: { pdf: '10-lois-principales/lsst/lsst-loi-sur-la-sante-et-la-securite-du-travail.pdf' },
  LATMP: { pdf: '10-lois-principales/latmp/latmp.pdf' },
  LNT: { pdf: '10-lois-principales/lnt/lnt.pdf' },
  LMRSST: { pdf: '10-lois-principales/lmrsst/lmrsst.pdf' },
  RSST: { pdf: '20-reglements/rsst/rsst.pdf' },
  RSSM: { pdf: '20-reglements/rssm/rssm-reglement-sur-la-sante-et-la-securite-du-travail-dans-les-mines.pdf' },
  CSTC: { pdf: '20-reglements/cstc/cstc.pdf' },
};

const TAILLE_MIN = 10;                 // sous 10 pt : historique législatif, notes marginales
const MARGE_HAUT = 50;                 // bande du titre courant (« SANTÉ ET SÉCURITÉ DU TRAVAIL » à 740 pt sur 792)
const MARGE_BAS = 34;                  // bande du folio (18 pt sur le projet de loi) et des dates en marge (≤ 30 pt)
const NUMERO = /^(\d+(?:\.\d+)*)\.$/;  // « 51. », « 49.1. », « 312.100. »
const TITRE_SECTION = /^(CHAPITRE|SECTION|TITRE|PARTIE|ANNEXE|LIVRE)\b|^§\s*\d/;
const MARQUE_ALINEA = /^(\d+(?:\.\d+)*°|\d+(?:\.\d+)*\.\s|[a-z]\s?\)\s|[ivx]+\)\s)/i;

function normaliser(s) {
  return s.normalize('NFKC').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim();
}

// Regroupe les items d'une page en lignes (même ordonnée, à 2 pt près), triées de haut en bas.
// « gras » marque les items plus grands que le corps du texte : numéros d'article, grands titres.
export function lignesDePage(items, tailleCorps = 11) {
  const gardes = items.filter(it => it.str && it.str.trim() && Math.abs(it.transform[3]) >= TAILLE_MIN);
  const lignes = [];
  for (const it of gardes.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])) {
    const y = it.transform[5], x = it.transform[4], h = Math.abs(it.transform[3]);
    const l = lignes.find(L => Math.abs(L.y - y) <= 2);
    const morceau = { x, h, gras: h >= tailleCorps + 1, texte: it.str };
    if (l) l.morceaux.push(morceau); else lignes.push({ y, morceaux: [morceau] });
  }
  return lignes.sort((a, b) => b.y - a.y).map(L => {
    L.morceaux.sort((a, b) => a.x - b.x);
    return { y: L.y, x: L.morceaux[0].x, morceaux: L.morceaux, texte: normaliser(L.morceaux.map(m => m.texte).join(' ')) };
  }).filter(L => L.texte);
}

// Vrai si le numéro « parts » peut suivre « precedent » : plus grand à profondeur égale, ou d'une
// autre profondeur (voir le commentaire ci-dessus sur la numérotation hiérarchique du CSTC).
export function numeroSuit(parts, precedent) {
  if (parts.length !== precedent.length) return true;
  for (let i = 0; i < parts.length; i++) {
    const d = Number(parts[i]) - Number(precedent[i]) || precedent[i].length - parts[i].length;
    if (d) return d > 0;
  }
  return false;
}

export async function extraireLoi(nom, cheminPdf, { getDocument }) {
  const doc = await getDocument({ url: cheminPdf, useSystemFonts: true, disableFontFace: true }).promise;
  // Première passe : les lignes de chaque page, hors bandes d'en-tête et de pied (titre courant,
  // folio, mention « À jour au … », dates imprimées glyphe par glyphe en marge). Le corps commence
  // sous 712 pt sur les pages LégisQuébec (792 pt de haut) et sous 612 pt sur le projet de loi (675 pt).
  const pagesItems = [];
  const tailles = new Map();
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const hauteur = page.getViewport({ scale: 1 }).height;
    const { items } = await page.getTextContent();
    pagesItems.push({ p, hauteur, items });
    for (const it of items) if (it.str.trim()) { const h = Math.round(Math.abs(it.transform[3]) * 2) / 2; if (h >= TAILLE_MIN) tailles.set(h, (tailles.get(h) || 0) + it.str.length); }
  }
  // Taille du corps : celle qui porte le plus de caractères (11 pt sur LégisQuébec, 10,5 pt sur le projet de loi).
  const tailleCorps = [...tailles].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 11;
  const pagesLignes = pagesItems.map(({ p, hauteur, items }) => {
    const lignes = lignesDePage(items, tailleCorps).filter(L => L.y > MARGE_BAS && L.y < hauteur - MARGE_HAUT);
    // Marge gauche de la page : les lignes de suite sont au ras de la marge, les premières lignes
    // d'alinéa en retrait. Elle change d'une page à l'autre (recto 72 pt, verso 54 pt), d'où un
    // calcul par page : la plus petite abscisse portée par au moins deux lignes.
    const xs = new Map();
    for (const L of lignes) xs.set(Math.round(L.x), (xs.get(Math.round(L.x)) || 0) + 1);
    const partagees = [...xs].filter(([, n]) => n >= 2).map(([x]) => x);
    const marge = partagees.length ? Math.min(...partagees) : xs.size ? Math.min(...xs.keys()) : 0;
    for (const L of lignes) L.retrait = Math.round(L.x) - marge;
    return { p, marge, lignes };
  });
  // Titre courant : la première ligne d'une page qui se répète à l'identique sur au moins un
  // cinquième des pages. Second filet derrière la bande d'en-tête, et contrôle exporté.
  const hauts = new Map();
  for (const pg of pagesLignes) if (pg.lignes.length) hauts.set(pg.lignes[0].texte, (hauts.get(pg.lignes[0].texte) || 0) + 1);
  const enTetes = new Set([...hauts].filter(([, n]) => n >= pagesLignes.length / 5).map(([t]) => t));

  const articles = [];      // { numero, page, lignes: [] }
  let courant = null;
  let hors = 0;             // lignes de corps rencontrées avant tout article (table des matières…)
  for (const { p, lignes } of pagesLignes) {
    for (const L of lignes) {
      if (enTetes.has(L.texte) && L === lignes[0]) continue;
      const premier = L.morceaux[0];
      const num = premier.gras && NUMERO.exec(normaliser(premier.texte));
      if (num) {
        // Un numéro seul ouvre l'article ; le reste de la ligne en est la première phrase.
        courant = { numero: num[1], page: p, lignes: [] };
        articles.push(courant);
        const reste = normaliser(L.morceaux.slice(1).map(m => m.texte).join(' '));
        if (reste) courant.lignes.push({ retrait: 0, texte: reste });
        continue;
      }
      if (TITRE_SECTION.test(L.texte) || (L.texte === L.texte.toUpperCase() && /[A-ZÀ-Ý]{3}/.test(L.texte) && !/^[«(]/.test(L.texte))) {
        courant = null;     // un titre de section ferme l'article en cours
        continue;
      }
      if (!courant) { hors++; continue; }
      courant.lignes.push({ retrait: L.retrait, texte: L.texte });
    }
  }
  // Paragraphes : une ligne qui commence en retrait ouvre un alinéa ou un paragraphe ; les marques
  // « 1° », « a) », « 1.1. » en ouvrent un aussi, même sans retrait mesurable.
  const rendu = {};
  const controles = { total: articles.length, vides: 0, nonCroissants: 0, doublons: 0, detailNonCroissants: [] };
  let precedent = null;
  for (const a of articles) {
    const paragraphes = [];
    let courantP = '';
    for (const l of a.lignes) {
      const ouvre = l.retrait > 8 || MARQUE_ALINEA.test(l.texte);
      if (ouvre && courantP) { paragraphes.push(courantP); courantP = l.texte; }
      else courantP = courantP ? courantP + ' ' + l.texte : l.texte;
    }
    if (courantP) paragraphes.push(courantP);
    const cle = a.numero;
    const parts = cle.split('.');
    // Ordre des numéros : « 7.01 » précède « 7.1 » (le zéro de tête compte) ; on ne compare qu'à
    // profondeur égale, car dans le CSTC la sous-section 7.1.1 (articles 7.1.1.1 à 7.1.1.16) suit
    // l'article 7.1.6 de la section 7.1 — la numérotation y est hiérarchique, non linéaire.
    if (precedent && !numeroSuit(parts, precedent)) {
      controles.nonCroissants++;
      if (controles.detailNonCroissants.length < 40) controles.detailNonCroissants.push({ numero: cle, page: a.page, apres: precedent.join('.'), debut: (a.lignes[0] || {}).texte?.slice(0, 60) });
      continue;
    }
    precedent = parts;
    if (!paragraphes.length) { controles.vides++; continue; }
    if (rendu[cle]) { controles.doublons++; continue; }
    rendu[cle] = { page: a.page, paragraphes };
  }
  controles.exportes = Object.keys(rendu).length;
  controles.horsArticle = hors;
  controles.enTetes = [...enTetes];
  controles.marges = [...pagesLignes.reduce((m, pg) => m.set(pg.marge, (m.get(pg.marge) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([x, n]) => x + ':' + n).join(' ');
  controles.tailleCorps = tailleCorps;
  // Paragraphes tout en capitales à l'intérieur d'un article : trace d'un titre mal fermé.
  controles.paragraphesCapitales = Object.values(rendu).reduce((n, a) => n + a.paragraphes.filter(t => t.length > 12 && t === t.toUpperCase() && /[A-ZÀ-Ý]{3}/.test(t)).length, 0);
  // Aucun titre courant ne doit s'être glissé dans un article.
  controles.enTetesFuites = Object.values(rendu).filter(a => a.paragraphes.some(t => [...enTetes].some(e => e && t.includes(e)))).length;
  controles.pages = doc.numPages;
  return { loi: nom, pdf: path.basename(cheminPdf), articles: rendu, controles };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pdfjs = await import(process.env.PDFJS || 'pdfjs-dist/legacy/build/pdf.mjs');
  fs.mkdirSync(SORTIE, { recursive: true });
  for (const [nom, conf] of Object.entries(LOIS)) {
    if (SEULE && nom !== SEULE) continue;
    const chemin = path.join(DOSSIER_PDF, conf.pdf);
    if (!fs.existsSync(chemin)) { console.warn(`${nom} : PDF absent (${chemin})`); continue; }
    const r = await extraireLoi(nom, chemin, pdfjs);
    fs.writeFileSync(path.join(SORTIE, nom + '.json'), JSON.stringify(r, null, 1));
    console.log(`${nom.padEnd(7)} ${String(r.controles.pages).padStart(4)} pages · ${String(r.controles.total).padStart(4)} numéros lus · ${String(r.controles.exportes).padStart(4)} articles exportés · vides ${r.controles.vides} · non croissants ${r.controles.nonCroissants} · doublons ${r.controles.doublons} · fuites d'en-tête ${r.controles.enTetesFuites} · § capitales ${r.controles.paragraphesCapitales} · corps ${r.controles.tailleCorps} pt · marges ${r.controles.marges} · en-tête « ${r.controles.enTetes.join(' / ')} »`);
  }
}
