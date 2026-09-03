// Contrôle qualité rédactionnelle : signale des défauts mesurables, sans jamais réécrire.
// Chaque règle répond à « qu'est-ce qu'un lecteur verrait qui cloche ? », jamais à un goût personnel.
//
// Principe de conception, appris à nos dépens : un détecteur qui crie au loup rend le
// tableau de bord inutile. Chaque règle est donc mesurée sur le TEXTE RENDU, pas sur la
// source markdown, et refuse de compter la syntaxe (liens, gras, ancres) comme du contenu.

const RE_LIEN = /\[\[([^\]]+)\]\]/g;

// Le texte tel que le lecteur le voit : wikilinks réduits à leur libellé, liens
// markdown à leur texte, marques de gras et d'italique retirées.
function texteRendu(s) {
  return String(s)
    .replace(/!?\[\[([^\]]+)\]\]/g, (m, t) => {
      const p = t.replace(/\\\|/g, '|').split('|');
      return p[p.length - 1].split('#')[0];
    })
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]{1,3}/g, '');
}

// Un texte coupé en plein mot : le pied de page « ← Accueil » amputé en est le signe le plus net.
function estTronque(texte) {
  const fin = texte.trimEnd();
  return /←\s*Accuei$/.test(fin)
    || /\[\[00 - $/.test(fin)
    || /\|←\s*Ac?$/.test(fin)
    || /\[\[[^\]]{0,40}$/.test(fin); // wikilink jamais refermé en fin de fichier
}

// Références trop vagues pour être vérifiables : ni auteur+année, ni titre, ni URL.
function sourcesVagues(texte) {
  // Le titre doit être une vraie bibliographie, pas une section qui commence par le
  // même mot : « Sources en dialogue » relie des notes entre elles, elle ne cite rien.
  // Et le bloc s'arrête au titre suivant : sans cela, les puces de la section d'après
  // étaient comptées comme des références bâclées.
  const lignes = [];
  const toutes = texte.split('\n');
  for (let i = 0; i < toutes.length; i++) {
    const m = toutes[i].match(/^(#{1,4})\s*(Références|Sources|Bibliographie|Pour aller plus loin)\s*:?\s*$/i);
    if (!m) continue;
    const niveau = m[1].length;
    for (let j = i + 1; j < toutes.length; j++) {
      const t = toutes[j];
      const h = t.match(/^(#{1,6})\s/);
      if (h && h[1].length <= niveau) break;
      if (/^\s*[-*]\s+\S/.test(t)) lignes.push(t);
    }
  }
  if (!lignes.length) return 0;
  return lignes.filter(l => {
    if (/https?:\/\//.test(l)) return false;                 // une adresse suffit à vérifier
    if (/\(\s*(19|20)\d{2}[a-z]?\s*\)|,\s*(19|20)\d{2}\b/.test(l)) return false; // auteur (année)
    if (/\[\[/.test(l)) return false;                         // renvoi interne
    if (/\]\(#/.test(l)) return false;                        // ancre de sommaire, pas une référence
    return l.replace(/^\s*[-*]\s+/, '').trim().length > 8;
  }).length;
}

// Marqueur de travail à faire, VISIBLE par le lecteur. « sert à documenter » est du
// français ordinaire : seules comptent les formes qui annoncent une lacune.
const RE_A_FAIRE = new RegExp([
  '^\\s*[>*_\\-]*\\s*(?:⚠️\\s*)?[ÀA]\\s+(?:compléter|documenter|rédiger)\\b', // en tête de ligne ou de callout
  '\\((?:à\\s+(?:compléter|documenter|rédiger))\\)',                            // « (à compléter) »
  '_[ÀA]\\s+(?:compléter|documenter|rédiger)\\._',                              // « _À compléter._ »
  '\\b(?:TODO|FIXME|XXX)\\b',
  '\\bsection\\s+vide\\b',
].join('|'), 'im');

export function analyserQualite(p) {
  const t = p.body || '';
  const defauts = [];
  const corps = t.replace(/^---[\s\S]*?---/, '');
  const rendu = texteRendu(corps);
  const mots = rendu.replace(/[#>|\[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;

  if (estTronque(t)) defauts.push({ code: 'tronque', gravite: 3, texte: 'Le texte s’arrête en plein mot : du contenu manque à la fin.' });

  // Coquille créée automatiquement pour servir de cible à un lien : aucun contenu propre.
  if (/Stub créé automatiquement|page vide à documenter/i.test(corps)) {
    defauts.push({ code: 'stub', gravite: 3, texte: 'Page créée automatiquement comme cible de lien : elle ne contient encore rien.' });
  }

  const mAF = corps.match(RE_A_FAIRE);
  if (mAF) {
    defauts.push({ code: 'a-faire', gravite: 2, texte: `Mention « ${mAF[0].trim().slice(0, 40)} » visible par le lecteur.` });
  }

  // Un lien de la page vers elle-même ne mène nulle part. Mesuré sur le corps seulement :
  // un renvoi à soi dans le frontmatter est une scorie de gabarit, invisible au lecteur.
  const base = String(p.base || '').toLowerCase();
  let m2, auto = 0;
  RE_LIEN.lastIndex = 0;
  while ((m2 = RE_LIEN.exec(corps))) {
    const cible = m2[1].split('|')[0].split('#')[0].trim().toLowerCase();
    if (cible && cible === base) auto++;
  }
  if (auto) defauts.push({ code: 'auto-lien', gravite: 2, texte: `${auto} lien${auto > 1 ? 's' : ''} de la page vers elle-même.` });

  // Une page sans phrase d'ouverture : le lecteur tombe sur un tableau ou un titre.
  // Le seuil porte sur le texte rendu : « Les sept lois encadrant la SST en mine au
  // Québec. » est une vraie introduction, même courte. Deux pièges évités : le résumé
  // « En bref » vit dans un encadré (lignes préfixées de « > »), et beaucoup de pages
  // ouvrent sur une phrase en gras : ni l'un ni l'autre n'est un titre ou une liste.
  const premierePros = corps.split('\n').find(l => {
    let s = l.trim();
    if (!s) return false;
    s = s.replace(/^>\s?/, '').trim();                    // corps d'encadré : c'est de la prose
    if (/^\[!/.test(s)) return false;                     // ligne de titre de l'encadré
    if (/^#{1,6}\s/.test(s)) return false;                // titre
    if (/^[|]/.test(s)) return false;                     // tableau
    if (/^!?\[\[/.test(s)) return false;                  // image ou transclusion
    if (/^[-+*]\s/.test(s) || /^\d+\.\s/.test(s)) return false; // liste
    if (/^\*\*Table des matières/i.test(s)) return false;
    const r = texteRendu(s).trim();
    return r.length >= 40 && /\s/.test(r);
  });
  if (!premierePros && mots > 80) {
    defauts.push({ code: 'sans-intro', gravite: 2, texte: 'Aucune phrase d’introduction : la page démarre sur un titre, un tableau ou une liste.' });
  }

  const vagues = sourcesVagues(corps);
  if (vagues >= 2) defauts.push({ code: 'sources-vagues', gravite: 1, texte: `${vagues} références sans auteur, année ni lien : invérifiables.` });

  // Un titre suivi d'un titre de MÊME niveau ou plus haut annonce une section jamais
  // écrite. Un H2 suivi d'un H3 est au contraire un plan normal : « Effets sur la
  // santé » puis « Aigus » ne cache aucune lacune.
  const titres = corps.split('\n').map(l => l.trim()).filter(l => l !== '')
    .map(l => ({ l, niv: (l.match(/^(#{2,4})\s/) || [])[1] ? (l.match(/^(#{2,4})\s/))[1].length : 0 }));
  let vides = 0;
  for (let i = 0; i < titres.length - 1; i++) {
    if (titres[i].niv && titres[i + 1].niv && titres[i + 1].niv <= titres[i].niv) vides++;
  }
  if (vides) defauts.push({ code: 'section-vide', gravite: 2, texte: `${vides} section${vides > 1 ? 's' : ''} annoncée${vides > 1 ? 's' : ''} par un titre mais sans contenu.` });

  // Phrases très longues, mesurées sur la PROSE RENDUE.
  // Deux corrections successives : une première version comptait les tableaux et les
  // listes (92 % de faux signalements) ; une seconde comptait encore la syntaxe des
  // liens, si bien qu'une phrase courte truffée de renvois passait pour interminable.
  // Les lignes sont triées AVANT d'être rendues : « texteRendu » retire les marques de
  // gras, et donc l'astérisque qui ouvre une puce. Trier après, c'est prendre une liste
  // de dix items pour une phrase de cent mots.
  const prose = corps
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^---[\s\S]*?^---/gm, ' ')
    .split('\n')
    .filter(l => {
      const s = l.trim();
      if (!s) return false;
      if (/^[#>|\-+]/.test(s)) return false;      // titres, citations, tableaux, listes
      if (/^\*\s/.test(s)) return false;           // puce en astérisque
      if (/^\d+[.)]\s/.test(s)) return false;      // liste numérotée
      return true;
    })
    .map(texteRendu)
    .join(' ');
  const longues = prose
    .replace(/\b(art|p|pp|vol|no|nº|ex|cf|etc|M|Mme|Dr|inc|ltée)\.\s/gi, '$1 ') // abréviations
    .split(/[.!?]+\s+/)
    .filter(ph => ph.split(/\s+/).filter(Boolean).length > 45).length;
  if (longues >= 3) defauts.push({ code: 'phrases-longues', gravite: 1, texte: `${longues} phrases de plus de 45 mots dans le texte suivi.` });

  return { mots, defauts, score: defauts.reduce((s, d) => s + d.gravite, 0) };
}

export const LIBELLES = {
  'stub': 'Page vide (coquille automatique)',
  'tronque': 'Texte tronqué',
  'a-faire': 'Mention « à compléter » visible',
  'auto-lien': 'Lien vers soi-même',
  'sans-intro': 'Pas de phrase d’introduction',
  'sources-vagues': 'Références invérifiables',
  'section-vide': 'Section annoncée mais vide',
  'phrases-longues': 'Phrases très longues',
};
