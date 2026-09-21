// Contrôle du rendu réel dans un navigateur (Chromium via playwright-core) : les tests unitaires
// vérifient la structure des pages, jamais leur affichage. Ce script charge des pages publiées à
// 390 px (clair et sombre) et 1 200 px, et échoue sur ce qu'un lecteur verrait : défilement
// horizontal, lien de moins de 24 px de haut sur téléphone (WCAG 2.5.8), tuile de moins de 44 px,
// infobox ou sommaire sur une page d'accueil, plus d'un h1. Il écrit aussi les captures et les
// mesures, pour les regarder.
//
// Usage : node tools/verif_rendu.mjs [--pages a.html,b.html] [--sortie dossier] [--captures]
//   Par défaut : les 22 pages d'accueil. Chromium : variable CHROME (chemin de l'exécutable),
//   sinon celui que playwright-core connaît (npx playwright install chromium). Variable PLAYWRIGHT :
//   chemin d'un playwright-core installé ailleurs (sinon celui de tools/node_modules).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(__dirname, '../docs');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const SORTIE = path.resolve(opt('--sortie', path.join(__dirname, '..', 'rendu')));
const CAPTURES = args.includes('--captures');

// Adresses par notion (12 septembre 2026) : accueil de wiki = w/<wiki>/index.html ; le wiki
// des travailleurs est archivé (plus de « 25 - Articles travailleurs ») ; les accueils de
// l'encadrement gardent leur propre adresse de notion (« 27 - Articles gestionnaires » en
// Droit et Ergonomie, « 00 - Accueil gestionnaires » ailleurs). Le Recueil garde sa formule
// miroir, inchangée.
export const ACCUEILS = [
  'w/droit-travail/index.html', 'w/droit-travail/27-articles-gestionnaires.html',
  'w/ergonomie/index.html', 'w/ergonomie/27-articles-gestionnaires.html',
  'w/hygiene/index.html', 'w/hygiene/00-accueil-gestionnaires.html',
  'w/legislation/00-accueil/00-accueil.html', 'w/psychosocial/index.html',
  'w/securite/index.html', 'w/securite/00-accueil-gestionnaires.html',
  'w/toxicologie/index.html', 'w/toxicologie/00-accueil-gestionnaires.html',
  'g/w/droit-travail/27-articles-gestionnaires.html', 'g/w/ergonomie/27-articles-gestionnaires.html', 'g/w/hygiene/00-accueil-gestionnaires.html', 'g/w/securite/00-accueil-gestionnaires.html', 'g/w/toxicologie/00-accueil-gestionnaires.html',
];
// Le téléphone, la tablette de chantier (Galaxy Tab Active4 Pro : 1 920 × 1 200 à densité 1,5,
// soit 1 280 × 800 px CSS en paysage et 800 × 1 280 en portrait) et le bureau. Sur les trois
// premiers le pointeur est tactile : les cibles sont mesurées.
const MODES = [
  { nom: 'mobile-clair', viewport: { width: 390, height: 844 }, mobile: true, echelle: 2, tactile: true, clair: true },
  { nom: 'mobile-sombre', viewport: { width: 390, height: 844 }, mobile: true, echelle: 2, tactile: true },
  { nom: 'tablette-paysage', viewport: { width: 1280, height: 800 }, echelle: 1.5, tactile: true },
  { nom: 'tablette-portrait', viewport: { width: 800, height: 1280 }, echelle: 1.5, tactile: true },
  { nom: 'bureau', viewport: { width: 1200, height: 900 }, echelle: 1 },
];

// Mesuré dans la page : ce qu'un lecteur verrait ou toucherait. Les liens de navigation et de
// liste doivent atteindre 24 px de haut (WCAG 2.5.8 AA) partout où le doigt sert de pointeur.
function mesurerDansLaPage() {
  const vw = document.documentElement.clientWidth;
  const liens = [...document.querySelectorAll('main .page-body a, main .accueil-index a, main .accueil-chapeau a, main .accueil-titre a')];
  const petits = liens.filter(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height < 24; }).map(a => a.textContent.trim().slice(0, 40));
  const tuiles = [...document.querySelectorAll('.accueil-tuiles li')].map(li => Math.round(li.getBoundingClientRect().height));
  // un <pre> ou un tableau défile dans son cadre : seul le document compte pour le débordement
  return {
    vw, scrollWidth: document.documentElement.scrollWidth, hauteur: document.documentElement.scrollHeight,
    liens: liens.length, liensPetits: petits.slice(0, 6), tuileMin: tuiles.length ? Math.min(...tuiles) : null,
    h1: document.querySelectorAll('h1').length, infobox: !!document.querySelector('.infobox'), toc: !!document.querySelector('nav.toc'),
    accueil: !!document.querySelector('.accueil-banniere'), titre: document.title,
  };
}

export function anomalies(m) {
  const a = [];
  if (m.scrollWidth > m.vw) a.push(`défilement horizontal (${m.scrollWidth} px pour ${m.vw})`);
  if (m.tactile && m.liensPetits.length) a.push(`liens de moins de 24 px : ${m.liensPetits.join(' ; ')}`);
  if (m.tuileMin !== null && m.tuileMin < 44) a.push(`tuile de ${m.tuileMin} px`);
  if (m.h1 !== 1) a.push(`${m.h1} h1`);
  if (m.accueil && (m.infobox || m.toc)) a.push('infobox ou sommaire sur un accueil');
  if (/^[\p{Extended_Pictographic}]/u.test(m.titre)) a.push('emoji en tête du titre de fenêtre');
  return a;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pw = await import(process.env.PLAYWRIGHT || 'playwright-core');
  const chromium = pw.chromium || pw.default.chromium;   // module CommonJS : export par défaut
  const pages = opt('--pages', '') ? opt('--pages', '').split(',') : ACCUEILS;
  fs.mkdirSync(SORTIE, { recursive: true });
  const navigateur = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const mesures = [];
  let defauts = 0;
  for (const rel of pages) {
    for (const { nom: mode, viewport, mobile = false, echelle, tactile = false, clair = false } of MODES) {
      const ctx = await navigateur.newContext({ viewport, deviceScaleFactor: echelle, isMobile: mobile, hasTouch: tactile });
      const page = await ctx.newPage();
      await page.goto('file://' + path.join(DOCS, rel), { waitUntil: 'load' });
      // le wiki s'affiche en sombre par défaut : c'est le mode clair qui se demande
      if (clair) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
      await page.waitForTimeout(120);
      const m = { page: rel, mode, tactile, ...(await page.evaluate(mesurerDansLaPage)) };
      const nom = rel.replace(/\.html$/, '').replace(/\//g, '_') + '--' + mode + '.png';
      if (CAPTURES) { await page.screenshot({ path: path.join(SORTIE, nom), fullPage: true }); m.capture = nom; }
      m.anomalies = anomalies(m);
      if (m.anomalies.length) { defauts++; console.log(`✗ ${rel} [${mode}] : ${m.anomalies.join(' · ')}`); }
      mesures.push(m);
      await ctx.close();
    }
  }
  await navigateur.close();
  fs.writeFileSync(path.join(SORTIE, 'mesures.json'), JSON.stringify(mesures, null, 1));
  console.log(`${mesures.length} rendus mesurés (${pages.length} pages × ${MODES.length} modes) · ${defauts} avec défaut · mesures dans ${path.relative(process.cwd(), SORTIE)}/mesures.json${CAPTURES ? ' + captures' : ''}`);
  process.exit(defauts ? 1 : 0);
}
