// Texte officiel des articles de loi, extrait des PDF de LégisQuébec (tools/textes-loi/*.json,
// produits par extraire_textes_loi.mjs). Ce module le charge, retrouve l'article d'une page du
// recueil et pose le texte dans la page, avant la capture d'écran qui restait jusqu'ici le seul
// « texte officiel » : une image ne se copie pas, ne se lit pas au lecteur d'écran et ne se
// cherche pas. Le texte extrait n'est jamais retouché ; la capture et le PDF restent en place.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOSSIER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'textes-loi');
export const LIBELLE_CAPTURE = 'Texte officiel : capture du PDF';   // titre que portent les notes du vault
export const LIBELLE_TEXTE = 'Texte officiel';                      // même titre, une fois le texte posé
export const ID_TITRE = 'texte-officiel';
// « 1° », « a) », « i) », « 1.1. » : alinéas et sous-paragraphes, rendus en retrait
const MARQUE_ALINEA = /^(\d+(?:\.\d+)*°|[a-z]\s?\)\s|[ivx]+\)\s|\d+(?:\.\d+)*\.\s)/i;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function chargerTextesLoi(dossier = DOSSIER) {
  const textes = {};
  if (!fs.existsSync(dossier)) return textes;
  for (const f of fs.readdirSync(dossier).sort()) {
    if (!f.endsWith('.json')) continue;
    const j = JSON.parse(fs.readFileSync(path.join(dossier, f), 'utf8'));
    textes[j.loi] = j;
  }
  return textes;
}
export const TEXTES_LOI = chargerTextesLoi();

// Numéro d'article lu dans le nom de la note (« art-49.1-LSST … » → « 49.1 »), jamais dans le
// frontmatter : YAML y lirait 312.100 comme le nombre 312.1.
export function numeroDeLaPage(base) {
  const m = String(base).match(/^art[-.\s]*(\d+(?:\.\d+)*)/i);
  return m ? m[1] : null;
}
// Sigle de la loi : le frontmatter `loi`, sinon celui qui suit le numéro dans le nom (« art-105-RSSM »).
export function loiDeLaPage(fmLoi, base, textes = TEXTES_LOI) {
  const declaree = String(fmLoi ?? '').trim().toUpperCase();
  if (textes[declaree]) return declaree;
  const m = String(base).match(/^art[-.\s]*\d+(?:\.\d+)*[-.\s]+([A-Za-z]{3,6})(?![A-Za-z])/);
  const sigle = m ? m[1].toUpperCase() : '';
  return textes[sigle] ? sigle : null;
}
export function texteArticle(loi, numero, textes = TEXTES_LOI) {
  const a = textes[loi]?.articles?.[numero];
  return a ? { loi, numero, article: a } : null;
}
export function texteLoiDeLaPage(fmLoi, base, textes = TEXTES_LOI) {
  const numero = numeroDeLaPage(base);
  const loi = loiDeLaPage(fmLoi, base, textes);
  return numero && loi ? texteArticle(loi, numero, textes) : null;
}
export function texteBrut({ article }) {
  return article.paragraphes.join('\n');
}

export function rendreTexteLoi({ loi, numero, article }, avecCapture = true) {
  const paras = article.paragraphes.map(t => `<p${MARQUE_ALINEA.test(t) ? ' class="alinea"' : ''}>${esc(t)}</p>`).join('\n');
  const foi = avecCapture ? 'La capture ci-dessous et le PDF font foi.' : 'Le PDF fait foi.';
  return `<div class="texte-loi" data-loi="${esc(loi)}" data-article="${esc(numero)}">
${paras}
<p class="texte-loi-source">Texte de l’article ${esc(numero)} ${esc(loi)}, extrait de la couche texte du PDF officiel (page ${Number(article.page)}), sans OCR ni retouche. ${foi}</p>
</div>`;
}

// Pose le bloc dans le HTML d'une page : sous le titre « Texte officiel : capture du PDF » (qui
// devient « Texte officiel »), sinon devant la capture, sinon en fin de page sous un titre ajouté.
export function insererTexteLoi(html, tl) {
  const titre = /<h2 id="(texte-officiel[^"]*)">Texte officiel : capture du PDF<\/h2>/;
  const m = html.match(titre);
  if (m) return { html: html.replace(titre, () => `<h2 id="${m[1]}">${LIBELLE_TEXTE}</h2>\n${rendreTexteLoi(tl, true)}`), mode: 'titre' };
  const img = html.indexOf('<span class="page-img"><a class="img-lien"');
  if (img >= 0 && html.slice(img, img + 600).includes('class="img-doc"')) {
    return { html: html.slice(0, img) + rendreTexteLoi(tl, true) + '\n' + html.slice(img), mode: 'image' };
  }
  const id = html.includes(`id="${ID_TITRE}"`) ? ID_TITRE + '-2' : ID_TITRE;
  return { html: html.replace(/\s*$/, '\n') + `<h2 id="${id}">${LIBELLE_TEXTE}</h2>\n${rendreTexteLoi(tl, false)}\n`, mode: 'fin', ajoutTitre: id };
}
// Le sommaire de la page reprend le titre du vault : même renommage.
export function renommerLibelleCapture(toc) {
  for (const t of toc) if (t.text === LIBELLE_CAPTURE) t.text = LIBELLE_TEXTE;
  return toc;
}
