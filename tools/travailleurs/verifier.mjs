// Contrôle du contenu de l'Espace travailleurs, sur le texte exact que lira le travailleur (la page
// telle que la génère tools/espace_travailleurs.mjs, corrections comprises) :
//   - chaque explication cite la page : au moins une citation « … » de 15 caractères ou plus,
//     retrouvée mot pour mot dans la page ;
//   - chaque page a ses questions, avec au moins un choix, une réponse multiple, un vrai ou faux et
//     un court développement (tools/travailleurs/FORMAT.md) ;
//   - les pages écrites pour l'espace ne donnent aucun numéro de téléphone absent du wiki.
//   node tools/travailleurs/verifier.mjs          → rapport, code 1 en cas d'erreur
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preparerEspace, texteDe } from '../espace_travailleurs.mjs';

const OUTILS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const normaliser = (s) => String(s).replace(/[’‘]/g, "'").replace(/[«»“”]/g, '"').replace(/ | /g, ' ').replace(/\s+/g, ' ').trim();
const TELEPHONE = /(?<![\d-])(?:1[ .-])?(?:\(\d{3}\)\s?|\d{3}[ .-])\d{3}[ .-]\d{4}(?![\d-])/g;

function numerosDuWiki(docs) {
  const vus = new Set();
  (function marcher(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) marcher(p);
      else if (e.name.endsWith('.html')) for (const n of fs.readFileSync(p, 'utf8').match(TELEPHONE) || []) vus.add(n.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''));
    }
  })(path.join(docs, 'w'));
  return vus;
}

export function verifierEspace(docs, { outils = OUTILS } = {}) {
  const { conf, pages } = preparerEspace(docs, { outils });
  const erreurs = [], avis = [];
  const sources = new Map(conf.sections.flatMap(s => s.pages).map(p => [p.slug, p]));
  let numeros = null;
  for (const p of pages) {
    const texte = normaliser(texteDe(p.corps) + ' ' + (p.resume || ''));
    if (!p.questions.length) { avis.push(`${p.slug} : aucune question (l'attestation suit la seule lecture)`); continue; }
    const types = new Set(p.questions.map(q => q.type));
    for (const t of ['choix', 'multi', 'vf', 'court']) if (!types.has(t)) erreurs.push(`${p.slug} : aucune question de type « ${t} »`);
    if (p.questions.length < 5 || p.questions.length > 7) avis.push(`${p.slug} : ${p.questions.length} questions (5 à 7 attendues)`);
    for (const q of p.questions) {
      const citations = [...q.explication.matchAll(/«\s*([\s\S]+?)\s*»/g)].map(m => m[1]).filter(c => c.length >= 15);
      if (!citations.length) erreurs.push(`${p.slug} ${q.id} : l'explication ne cite pas la page (« … » de 15 caractères ou plus)`);
      for (const c of citations) {
        // une citation peut sauter un passage : « début […] fin »
        const morceaux = c.split(/\s*\[(?:…|\.\.\.)\]\s*/).map(normaliser).filter(Boolean);
        if (!morceaux.every(m => texte.includes(m))) erreurs.push(`${p.slug} ${q.id} : citation introuvable dans la page « ${c.slice(0, 100)} »`);
      }
    }
    if (sources.get(p.slug).fichier) {
      numeros = numeros || numerosDuWiki(docs);
      for (const n of texteDe(p.corps).match(TELEPHONE) || []) {
        if (!numeros.has(n.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''))) erreurs.push(`${p.slug} : numéro ${n} absent des pages du wiki`);
      }
    }
  }
  return { erreurs, avis, pages: pages.length, questions: pages.reduce((a, p) => a + p.questions.length, 0) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const r = verifierEspace(path.resolve(OUTILS, '..', 'docs'));
    for (const a of r.avis) console.log('  · ' + a);
    for (const e of r.erreurs) console.log('  ✘ ' + e);
    console.log(`${r.pages} pages, ${r.questions} questions : ${r.erreurs.length ? r.erreurs.length + ' erreur(s)' : 'aucune erreur'}`);
    process.exit(r.erreurs.length ? 1 : 0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
