// Pose une fiche de corrections de texte sur le site publié ET écrit le lot du vault qui fait la même chose dans la
// note : les deux disent la même chose, et la prochaine construction du site ne défait rien. Pendant de
// poser_schemas.mjs pour le texte ; c'est l'outil qui a servi aux corrections du 25 au 29 septembre 2026.
//
//   node tools/poser_corrections.mjs <fiche.json> [--ecrire] [--date AAAA-MM-JJ]
//
// Sans --ecrire : essai, rien n'est écrit. Avec --ecrire, rien n'est écrit non plus si une seule retouche échoue.
// Écrit docs/<page>, sa copie encadrement docs/g/<page> si elle existe, et content-updates/<date>-corr-<nom>.json
// (<nom> : nom de la fiche sans .json). Le lot s'applique au vault avec appliquer_retouches.mjs ou rejouer_lots.mjs.
// Après un lien ajouté, retiré ou redirigé : node tools/renvois_modifies.mjs (Pages qui pointent ici, graphe).
//
// fiche.json :
//   page        adresse publiée (w/<wiki>/<page>.html)
//   note        { titre, wiki, chemin? } — pour retrouver la note du vault
//   portee, precautions   textes du lot (facultatifs)
//   medias[]    comme dans un lot (facultatif)
//   retouches[] au format de retouches.mjs, avec pour le site :
//     remplacer    « avant » doit être trouvé exactement une fois dans le corps de la page (texte comparé sans
//                  égard aux apostrophes et aux espaces insécables) ; « apres » ne doit pas contenir « avant » (lot
//                  rejouable). {{lien:<adresse>|<libellé>}}, **gras** et [texte](https://…) deviennent le HTML du
//                  générateur. « toutes » : chaque occurrence. « ancienApres » : texte d'une version déjà posée de
//                  la correction, remplacé par la nouvelle
//     recibler     le lien de libellé « libelle » mène désormais à « adresse »
//     relibeller   le lien de libellé « libelle » (ou site.libelle) prend le libellé « nouveau » ; « ancre » ;
//                  « adresse » : il mène aussi à cette page (site.cibleAvant : son ancienne cible, pour le
//                  retrouver sur une page déjà relibellée)
//     delier       le lien devient du texte (« texte », sinon le libellé)
//     insererApres, remplacerLigne, supprimerLigne, ajouterFin : site = { avant, apres }, HTML exact du corps
//                  ({{racine}} dans « apres » : le préfixe « ../ » de la page)
//   Tout champ « site » reste hors du lot du vault.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const rx = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Adresse d'un lien, comme urlDe() du générateur : dans la copie encadrement (g/), un lien vers une page qui a
// aussi sa copie g/ reste dans le parcours ; le Recueil n'est jamais dupliqué.
export function cibleLien(adresse, rel, existe) {
  return rel.startsWith('g/') && !adresse.startsWith('w/legislation/') && existe('g/' + adresse) ? 'g/' + adresse : adresse;
}

// HTML que le générateur produit pour un texte de note sans autre mise en forme (marked échappe & < > " ').
// ctx : { titreDe(adresse) → titre de la page cible, existe(adresse publiée) → booléen }
export function versHtml(texte, racine, rel, ctx) {
  let out = '', i = 0;
  const re = /\{\{lien:([^|}]+)\|([^}]+)\}\}|\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let m;
  while ((m = re.exec(texte))) {
    out += esc(texte.slice(i, m.index));
    if (m[1]) out += `<a href="${racine}${cibleLien(m[1].trim(), rel, ctx.existe)}" title="${ctx.titreDe(m[1].trim())}">${esc(m[2])}</a>`;
    else if (m[4]) out += `<a class="external" target="_blank" rel="noopener" href="${m[5]}">${esc(m[4])}</a>`;
    else out += `<strong>${esc(m[3])}</strong>`;
    i = re.lastIndex;
  }
  return out + esc(texte.slice(i));
}

// Motif souple sur le HTML : apostrophes droites, typographiques ou &#39; ; espaces normales ou insécables.
export function motifHtml(html) {
  const blanc = '(?:\\s|&nbsp;|\\u00a0|\\u202f)+';
  const parts = [];
  for (let i = 0; i < html.length; i++) {
    if (html.startsWith('&#39;', i)) { parts.push("(?:&#39;|'|’)"); i += 4; continue; }
    const c = html[i];
    if (c === '’' || c === "'") { parts.push("(?:&#39;|'|’)"); continue; }
    if (/\s/.test(c) || c === ' ' || c === ' ') { if (parts[parts.length - 1] !== blanc) parts.push(blanc); continue; }
    parts.push(rx(c));
  }
  return new RegExp(parts.join(''), 'g');
}

// Bornes du corps de la page : de la chapô ou du corps jusqu'aux « Pages qui pointent ici » (ou la fin de <main>).
export function corpsDe(page) {
  const d = page.indexOf('<div class="page-body');
  let f = page.indexOf('<details class="backlinks"');
  if (f < 0) f = page.indexOf('</main>');
  if (d < 0 || f < 0) throw new Error('corps de page introuvable');
  return [d, f];
}

// Forme que prend un HTML posé une fois appliquées les retouches « remplacer » qui le suivent dans la fiche : une
// insertion complétée plus loin dans la même fiche se reconnaît encore (sinon, rejouer la fiche l'insère deux fois).
function formeFinale(html, suivantes, racine, rel, ctx) {
  for (const r of suivantes) {
    if (r.type !== 'remplacer' || r.apres.includes(r.avant)) continue;
    const avantH = r.site?.avant ?? versHtml(r.avant, racine, rel, ctx);
    const apresH = r.site?.apres ?? versHtml(r.apres, racine, rel, ctx);
    html = html.replace(motifHtml(avantH), () => apresH);
  }
  return html;
}

// Applique les retouches au corps d'une page publiée. rel : adresse de la page (w/… ou g/w/…).
// Rend { page, journal: [{ etat: '✓' | '=' | '✗', texte }], erreurs }. Une retouche déjà posée est reconnue (=).
export function poserRetouches(page, rel, retouches, ctx) {
  const racine = '../'.repeat(rel.split('/').length - 1);
  const [d, f] = corpsDe(page);
  let body = page.slice(d, f);
  const journal = [];
  let erreurs = 0;
  const ok = t => journal.push({ etat: '✓', texte: t });
  const deja = t => journal.push({ etat: '=', texte: t + ' : déjà posée' });
  const ko = t => { journal.push({ etat: '✗', texte: t }); erreurs++; };
  for (const [k, r] of retouches.entries()) {
    const etiquette = `${rel} · ${r.type} « ${(r.ligneContenant || '').slice(0, 50)} »`;
    if (r.type === 'remplacer') {
      if (r.apres.includes(r.avant)) { ko(etiquette + ' : « avant » contenu dans « apres » (lot non rejouable)'); continue; }
      const avantH = r.site?.avant ?? versHtml(r.avant, racine, rel, ctx);
      const apresH = r.site?.apres ?? versHtml(r.apres, racine, rel, ctx);
      const motif = motifHtml(avantH);
      const n = (body.match(motif) || []).length;
      if (r.toutes && n >= 1) { body = body.replace(motif, () => apresH); ok(`${etiquette} (${n} fois)`); continue; }
      if (n !== 1) {
        if (n === 0 && body.includes(apresH)) { deja(etiquette); continue; }
        // la page porte une version antérieure de la correction : elle passe à la nouvelle
        if (n === 0 && r.ancienApres) {
          const anciens = [].concat(r.ancienApres).map(a => motifHtml(versHtml(a, racine, rel, ctx)));
          const trouve = anciens.find(a => (body.match(a) || []).length === 1);
          if (trouve) { body = body.replace(trouve, () => apresH); ok(etiquette + ' (version antérieure remplacée)'); continue; }
        }
        ko(`${etiquette} : « avant » trouvé ${n} fois`); continue;
      }
      body = body.replace(motif, () => apresH);
      ok(etiquette);
    } else if (r.type === 'insererApres' || r.type === 'remplacerLigne' || r.type === 'supprimerLigne') {
      if (!r.site) { ko(etiquette + ' : site requis pour ce type'); continue; }
      // une insertion laisse « avant » en place : ce qui est déjà posé se reconnaît d'abord à « apres »
      const apresSite = r.site.apres.replace(/\{\{racine\}\}/g, racine);
      const final = formeFinale(apresSite, retouches.slice(k + 1), racine, rel, ctx);
      if (apresSite && apresSite !== r.site.avant && (body.includes(apresSite) || body.includes(final))) { deja(etiquette); continue; }
      const motif = motifHtml(r.site.avant);
      const n = (body.match(motif) || []).length;
      if (n !== 1) {
        if (n === 0 && r.type === 'supprimerLigne') { deja(etiquette); continue; }
        ko(`${etiquette} : site.avant trouvé ${n} fois`); continue;
      }
      body = body.replace(motif, () => apresSite);
      ok(etiquette);
    } else if (r.type === 'recibler') {
      const re = new RegExp('<a href="[^"]*" title="[^"]*">' + rx(esc(r.libelle)) + '</a>', 'g');
      const liens = body.match(re) || [];
      const voulu = `<a href="${racine}${cibleLien(r.adresse, rel, ctx.existe)}" title="${ctx.titreDe(r.adresse)}">${esc(r.libelle)}</a>`;
      if (liens.length !== 1) { ko(`${etiquette} : lien « ${r.libelle} » trouvé ${liens.length} fois`); continue; }
      if (liens[0] === voulu) { deja(etiquette); continue; }
      body = body.replace(re, () => voulu);
      ok(etiquette);
    } else if (r.type === 'relibeller' || r.type === 'delier') {
      // lien(s) de libellé visible « libelle » (ou « site.libelle », quand la page affiche le titre de la cible)
      const libs = [].concat(r.site?.libelle ?? r.libelle);
      const reLien = new RegExp('<a ([^>]*?)href="([^"#]*)(#[^"]*)?"([^>]*)>(' + libs.map(l => rx(esc(l))).join('|') + ')</a>', 'g');
      const n = (body.match(reLien) || []).length;
      const neuf = r.type === 'relibeller' ? esc(r.nouveau) : null;
      // « adresse » : le lien relibellé mène aussi à une nouvelle page. Page déjà relibellée : le lien se retrouve
      // par son ancienne cible (site.cibleAvant) et son nouveau libellé ; seul celui-là est reciblé
      const lienNeuf = r.adresse ? `<a href="${racine}${cibleLien(r.adresse, rel, ctx.existe)}${r.ancre ?? ''}" title="${ctx.titreDe(r.adresse)}">${neuf}</a>` : null;
      if (r.type === 'relibeller' && r.adresse && n === 0) {
        if (!r.site?.cibleAvant) { ko(`${etiquette} : site.cibleAvant requis pour recibler une page déjà relibellée`); continue; }
        const reAncien = new RegExp('<a href="(?:\\.\\./)*(?:g/)?' + rx(r.site.cibleAvant) + '(?:#[^"]*)?"[^>]*>' + rx(neuf) + '</a>', 'g');
        const m = (body.match(reAncien) || []).length;
        if (m >= 1 && (r.toutes || m === 1)) { body = body.replace(reAncien, () => lienNeuf); ok(`${etiquette} (reciblé${m > 1 ? `, ${m} fois` : ''})`); continue; }
        if (m === 0 && body.includes(lienNeuf)) { deja(etiquette); continue; }
        ko(`${etiquette} : lien « ${r.nouveau} » vers ${r.site.cibleAvant} trouvé ${m} fois`); continue;
      }
      if (n === 0 || (!r.toutes && n !== 1)) {
        const dejaPose = r.type === 'relibeller' ? body.includes('>' + neuf + '</a>') : true;
        if (n === 0 && dejaPose) { deja(etiquette); continue; }
        ko(`${etiquette} : lien trouvé ${n} fois`); continue;
      }
      body = body.replace(reLien, (m, a1, href, ancre, a2) => r.type === 'relibeller'
        ? (lienNeuf ?? `<a ${a1}href="${href}${r.ancre ?? ancre ?? ''}"${a2}>${neuf}</a>`)
        : esc(r.texte ?? libs[0]));
      ok(`${etiquette}${n > 1 ? ` (${n} fois)` : ''}`);
    } else if (r.type === 'ajouterFin') {
      if (!r.site) { ko(etiquette + ' : site requis pour ce type'); continue; }
      if (body.includes(r.site.apres)) { deja(etiquette); continue; }
      const motif = motifHtml(r.site.avant);
      const n = (body.match(motif) || []).length;
      if (n !== 1) { ko(`${etiquette} : site.avant trouvé ${n} fois`); continue; }
      body = body.replace(motif, () => r.site.apres);
      ok(etiquette);
    } else ko('type inconnu ' + r.type);
  }
  return { page: page.slice(0, d) + body + page.slice(f), journal, erreurs };
}

// Lot du vault : les retouches sans les champs propres au site.
export function lotDepuisFiche(fiche, nom, date) {
  return {
    date, revision: `${date}-corr-${nom}`,
    portee: fiche.portee || `Corrections de la page ${fiche.page}`,
    precautions: fiche.precautions || '',
    application: 'node tools/appliquer_retouches.mjs --lot <ce fichier> (essai), puis --appliquer ; ensuite node tools/build_site.mjs',
    note: { titre: fiche.note.titre, wiki: fiche.note.wiki, page: fiche.page, ...(fiche.note.chemin ? { chemin: fiche.note.chemin } : {}) },
    medias: fiche.medias || [],
    retouches: fiche.retouches.map(({ site, ...r }) => r),
  };
}

// Titre et existence des pages publiées, lus dans docs/.
export function contexteDocs(docs) {
  return {
    existe: adresse => fs.existsSync(path.join(docs, adresse)),
    titreDe: adresse => {
      const f = path.join(docs, adresse);
      if (!fs.existsSync(f)) throw new Error('lien vers une page absente : ' + adresse);
      return (fs.readFileSync(f, 'utf8').match(/<title>([\s\S]*?) — WIKI SST Mines<\/title>/) || [])[1];
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const docs = path.join(R, 'docs');
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const chemin = args.find(a => a.endsWith('.json'));
  if (!chemin) { console.error('usage : node tools/poser_corrections.mjs <fiche.json> [--ecrire] [--date AAAA-MM-JJ]'); process.exit(2); }
  const ecrire = args.includes('--ecrire');
  const date = opt('--date', new Date().toISOString().slice(0, 10));
  const fiche = JSON.parse(fs.readFileSync(chemin, 'utf8'));
  const nom = path.basename(chemin, '.json');
  const ctx = contexteDocs(docs);
  const fichiers = [fiche.page, 'g/' + fiche.page].filter(p => fs.existsSync(path.join(docs, p)));
  if (!fichiers.length) { console.error('page absente : ' + fiche.page); process.exit(1); }
  let erreurs = 0;
  const pages = [];
  for (const rel of fichiers) {
    const res = poserRetouches(fs.readFileSync(path.join(docs, rel), 'utf8'), rel, fiche.retouches, ctx);
    for (const j of res.journal) console.log(`${j.etat} ${j.texte}`);
    erreurs += res.erreurs;
    pages.push([rel, res.page]);
  }
  const dest = path.join(R, 'content-updates', `${date}-corr-${nom}.json`);
  if (ecrire && !erreurs) {
    for (const [rel, html] of pages) fs.writeFileSync(path.join(docs, rel), html);
    fs.writeFileSync(dest, JSON.stringify(lotDepuisFiche(fiche, nom, date), null, 1) + '\n');
  }
  console.log(erreurs ? `${erreurs} erreur(s) : rien n'est écrit` : (ecrire ? `écrit : ${fichiers.join(', ')} et ${path.relative(R, dest)}` : 'essai : rien n’est écrit sans --ecrire'));
  process.exit(erreurs ? 1 : 0);
}
