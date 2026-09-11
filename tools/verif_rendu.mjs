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

export const ACCUEILS = [
  'w/droit-travail/00-accueil/00-accueil.html', 'w/droit-travail/25-articles-travailleurs/25-articles-travailleurs.html', 'w/droit-travail/27-articles-gestionnaires/27-articles-gestionnaires.html',
  'w/ergonomie/00-accueil/00-accueil.html', 'w/ergonomie/25-articles-travailleurs/25-articles-travailleurs.html', 'w/ergonomie/27-articles-gestionnaires/27-articles-gestionnaires.html',
  'w/hygiene/00-accueil/00-accueil.html', 'w/hygiene/25-articles-travailleurs/00-accueil-travailleurs.html', 'w/hygiene/27-articles-gestionnaires/00-accueil-gestionnaires.html',
  'w/legislation/00-accueil/00-accueil.html', 'w/psychosocial/00-accueil/00-accueil.html',
  'w/securite/00-accueil/00-accueil.html', 'w/securite/25-articles-travailleurs/00-accueil-travailleurs.html', 'w/securite/27-articles-gestionnaires/00-accueil-gestionnaires.html',
  'w/toxicologie/00-accueil/00-accueil.html', 'w/toxicologie/25-articles-travailleurs/00-accueil-travailleurs.html', 'w/toxicologie/27-articles-gestionnaires/00-accueil-gestionnaires.html',
  'g/w/droit-travail/27-articles-gestionnaires/27-articles-gestionnaires.html', 'g/w/ergonomie/27-articles-gestionnaires/27-articles-gestionnaires.html', 'g/w/hygiene/27-articles-gestionnaires/00-accueil-gestionnaires.html', 'g/w/securite/27-articles-gestionnaires/00-accueil-gestionnaires.html', 'g/w/toxicologie/27-articles-gestionnaires/00-accueil-gestionnaires.html',
];
const MODES = [['mobile-clair', { width: 390, height: 844 }, true, false], ['mobile-sombre', { width: 390, height: 844 }, true, true], ['bureau', { width: 1200, height: 900 }, false, false]];

// Mesuré dans la page : ce qu'un lecteur verrait ou toucherait.
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
  if (m.mode !== 'bureau' && m.liensPetits.length) a.push(`liens de moins de 24 px : ${m.liensPetits.join(' ; ')}`);
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
    for (const [mode, viewport, mobile, sombre] of MODES) {
      const ctx = await navigateur.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage();
      await page.goto('file://' + path.join(DOCS, rel), { waitUntil: 'load' });
      if (sombre) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await page.waitForTimeout(120);
      const m = { page: rel, mode, ...(await page.evaluate(mesurerDansLaPage)) };
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
