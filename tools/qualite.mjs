// Contrôle qualité rédactionnelle : signale des défauts mesurables, sans jamais réécrire.
// Chaque règle répond à « qu'est-ce qu'un lecteur verrait qui cloche ? », jamais à un goût personnel.

const RE_LIEN = /\[\[([^\]]+)\]\]/g;

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
  const bloc = texte.match(/#{1,4}\s*(Références|Sources|Bibliographie|Pour aller plus loin)[\s\S]{0,1200}/i);
  if (!bloc) return 0;
  const lignes = bloc[0].split('\n').filter(l => /^\s*[-*]\s+\S/.test(l));
  return lignes.filter(l => {
    if (/https?:\/\//.test(l)) return false;                 // une adresse suffit à vérifier
    if (/\(\s*(19|20)\d{2}[a-z]?\s*\)|,\s*(19|20)\d{2}\b/.test(l)) return false; // auteur (année)
    if (/\[\[/.test(l)) return false;                         // renvoi interne
    return l.replace(/^\s*[-*]\s+/, '').trim().length > 8;
  }).length;
}

const RE_A_FAIRE = /(À compléter|à compléter\b|À documenter|à documenter\b|\bTODO\b|\bFIXME\b|\bXXX\b|à rédiger|section vide)/i;

export function analyserQualite(p) {
  const t = p.body || '';
  const defauts = [];
  const corps = t.replace(/^---[\s\S]*?---/, '');
  const mots = corps.replace(/[#>*_`|\[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;

  if (estTronque(t)) defauts.push({ code: 'tronque', gravite: 3, texte: 'Le texte s’arrête en plein mot : du contenu manque à la fin.' });

  // Coquille créée automatiquement pour servir de cible à un lien : aucun contenu propre.
  if (/Stub créé automatiquement|page vide à documenter/i.test(corps)) {
    defauts.push({ code: 'stub', gravite: 3, texte: 'Page créée automatiquement comme cible de lien : elle ne contient encore rien.' });
  }

  if (RE_A_FAIRE.test(corps)) {
    const m = corps.match(RE_A_FAIRE);
    defauts.push({ code: 'a-faire', gravite: 2, texte: `Mention « ${m[0]} » visible par le lecteur.` });
  }

  // Un lien de la page vers elle-même ne mène nulle part.
  const base = String(p.base || '').toLowerCase();
  let m2, auto = 0;
  RE_LIEN.lastIndex = 0;
  while ((m2 = RE_LIEN.exec(corps))) {
    const cible = m2[1].split('|')[0].split('#')[0].trim().toLowerCase();
    if (cible && cible === base) auto++;
  }
  if (auto) defauts.push({ code: 'auto-lien', gravite: 2, texte: `${auto} lien${auto > 1 ? 's' : ''} de la page vers elle-même.` });

  // Une page sans phrase d'ouverture : le lecteur tombe sur un tableau ou un titre.
  const premiereProse = corps.split('\n').find(l => {
    const s = l.trim();
    return s.length > 60 && !/^[#>|\-*!\[]/.test(s) && !/^\*\*Table des matières/i.test(s);
  });
  if (!premiereProse && mots > 80) {
    defauts.push({ code: 'sans-intro', gravite: 2, texte: 'Aucune phrase d’introduction : la page démarre sur un titre, un tableau ou une liste.' });
  }

  const vagues = sourcesVagues(corps);
  if (vagues >= 2) defauts.push({ code: 'sources-vagues', gravite: 1, texte: `${vagues} références sans auteur, année ni lien : invérifiables.` });

  // Un titre suivi immédiatement d'un autre titre annonce une section jamais écrite.
  const lignes = corps.split('\n').map(l => l.trim()).filter(l => l !== '');
  let vides = 0;
  for (let i = 0; i < lignes.length - 1; i++) {
    if (/^#{2,4}\s/.test(lignes[i]) && /^#{2,4}\s/.test(lignes[i + 1])) vides++;
  }
  if (vides) defauts.push({ code: 'section-vide', gravite: 2, texte: `${vides} section${vides > 1 ? 's' : ''} annoncée${vides > 1 ? 's' : ''} par un titre mais sans contenu.` });

  // Phrases très longues, mesurées sur la PROSE seule.
  // Une première version comptait aussi les tableaux, les listes et les titres :
  // 92 % des signalements ne contenaient aucune phrase réellement longue.
  const prose = corps
    .replace(/```[\s\S]*?```/g, ' ')          // blocs de code
    .replace(/^---[\s\S]*?^---/gm, ' ')       // frontmatter résiduel
    .split('\n')
    .filter(l => {
      const s = l.trim();
      if (!s) return false;
      if (/^[#>|\-*+\d]/.test(s)) return false;  // titres, citations, tableaux, listes
      if (/^!?\[\[/.test(s)) return false;        // images et transclusions
      return true;
    })
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
