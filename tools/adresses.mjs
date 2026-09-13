// Adresses du site : une page = une note, adresse par notion plutôt que par dossier de
// cours. Module partagé par build_site.mjs (adresses courantes) et par la table de
// redirection (adresse d'AVANT le 12 septembre 2026, pour la 404 et le manifeste des
// anciens chemins). Voir plans/2026-09-12-wiki-par-notion.md, section « Choix de
// conception retenus » (C1, C2, C7) et section D.
//
// Rien ici ne dépend du contenu d'une note en particulier : ce module ne fait que
// calculer des chaînes de caractères à partir de chemins et de rôles déjà connus.

// Noms qu'une page générée par le site occupe déjà (index du wiki, index alphabétique,
// index par loi, espace des thèmes). Une note dont le nom slugifie vers l'un d'eux reçoit
// un suffixe « -note » : jamais d'erreur fatale (une vraie note du vault, « 🔤 Index
// alphabétique.md » en psychosociale, slugifie en « index-alphabetique »).
export const RESERVES = new Set(['index', 'index-alphabetique', 'index-par-loi', 'theme']);

export function slugify(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'page';
}

// Grappe d'emoji entière en tête d'un libellé (y compris les emojis composés reliés par
// un ZWJ), retirée avec le préfixe numérique de classement.
const EMOJIS_DE_TETE = /^(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}️?)*|\s)+/u;

export function cleanLabel(name) {
  // "20 - Articles" -> "Articles" ; retire aussi les emojis de tête
  return String(name).replace(/^\d+\s*-\s*/, '').replace(EMOJIS_DE_TETE, '').trim() || String(name);
}

// Formule miroir historique (avant le 12 septembre 2026) : le chemin de sortie reproduit
// le rangement en dossiers du vault, chaque segment slugifié. `cheminSansExt` inclut le
// dossier du wiki comme premier segment (c'est la forme de `p.relPath.slice(0,-3)` et de
// `chemin-origine` posé par tools/archiver_travailleurs.mjs), et est retiré du résultat.
export function formuleMiroir(cheminSansExt, slugWiki) {
  const parts = String(cheminSansExt).split('/');
  return 'w/' + slugWiki + '/' + parts.slice(1).map(slugify).join('/') + '.html';
}

export function ancienneAdresse(p, slugWiki) {
  return formuleMiroir(p.relPath.slice(0, -3), slugWiki);
}

// Adresse par notion. `role` ∈ 'loi' | 'accueil' | 'theme' | 'notion' (tout le reste).
// Le Recueil législatif garde la formule miroir, sans changement : ses adresses ne bougent
// pas (décision de Frank, point 0 du plan).
export function adresseDe(p, slugWiki, role) {
  if (role === 'loi') return ancienneAdresse(p, slugWiki);
  if (role === 'accueil') return 'w/' + slugWiki + '/index.html';
  if (role === 'theme') {
    const s = slugify(p.base);
    return 'w/' + slugWiki + '/theme/' + (RESERVES.has(s) ? s + '-note' : s) + '.html';
  }
  const s = slugify(p.base);
  return 'w/' + slugWiki + '/' + (RESERVES.has(s) ? s + '-note' : s) + '.html';
}

// Calcule p.ancienOut et p.out pour toutes les pages. Suppose que p.role est déjà posé
// (voir build_site.mjs, bloc « rôles des pages ») : 'loi' pour le Recueil, 'accueil',
// 'theme', sinon 'notion' implicite. Retourne la liste des collisions résolues, pour le
// journal de build et pour tools/rapports/collisions.json.
//
// Règle de collision (C7), entre notions d'un même wiki dont le nom slugifie pareil :
//   1. la note d'un dossier « 20 - … » l'emporte sur toute autre ; à égalité (plusieurs
//      candidates dans des dossiers « 20 - … », p. ex. une note racine ET une note dans
//      un sous-dossier), celle dont le CORPS est le plus long l'emporte — c'est le
//      contenu le plus abouti, jamais un choix de renommage.
//   2. les notes perdantes reçoivent un suffixe : « -encadrement » si elles viennent
//      d'un dossier « 27 - … », sinon le slug du nom de LEUR PROPRE dossier immédiat
//      (nettoyé de son préfixe numérique).
//   3. une collision qui subsiste malgré tout arrête le build (jamais de « -2 » silencieux
//      sur les six wikis ; le Recueil garde son propre mécanisme, inchangé).
export function attribuerAdresses(pages, WIKIS) {
  const collisions = [];

  for (const p of pages) {
    p.ancienOut = ancienneAdresse(p, WIKIS[p.wikiKey].slug);
  }

  // Recueil législatif : formule miroir + suffixe -2/-3 en cas d'homonyme, comme avant.
  const usedRecueil = new Set();
  for (const p of pages) {
    if (p.wikiKey !== 'Recueil législatif SST') continue;
    let out = p.ancienOut;
    let n = 2;
    while (usedRecueil.has(out.toLowerCase())) out = out.replace(/\.html$/, '') + '-' + (n++) + '.html';
    usedRecueil.add(out.toLowerCase());
    p.out = out;
  }

  // Six wikis : accueils et thèmes d'abord (jamais de collision entre eux : un seul
  // accueil par wiki, et l'espace theme/ est disjoint de l'espace des notions).
  const parWikiNotion = new Map(); // wikiKey -> Map(slug -> [pages])
  for (const p of pages) {
    if (p.wikiKey === 'Recueil législatif SST') continue;
    const role = p.role || 'notion';
    if (role === 'accueil' || role === 'theme') {
      p.out = adresseDe(p, WIKIS[p.wikiKey].slug, role);
      continue;
    }
    const slugWiki = WIKIS[p.wikiKey].slug;
    const s = slugify(p.base);
    if (!parWikiNotion.has(p.wikiKey)) parWikiNotion.set(p.wikiKey, new Map());
    const parSlug = parWikiNotion.get(p.wikiKey);
    if (!parSlug.has(s)) parSlug.set(s, []);
    parSlug.get(s).push(p);
    void slugWiki; // (juste pour lisibilité — slugWiki recalculé plus bas)
  }

  for (const [wikiKey, parSlug] of parWikiNotion) {
    const slugWiki = WIKIS[wikiKey].slug;
    for (const [s, liste] of parSlug) {
      const slugFinal = RESERVES.has(s) ? s + '-note' : s;
      if (liste.length === 1) {
        liste[0].out = 'w/' + slugWiki + '/' + slugFinal + '.html';
        continue;
      }
      const dossierImmediat = (p) => (p.relPath.split('/')[1] || '');
      const corpsLen = (p) => (p.body || '').length;
      const enVingt = liste.filter(p => /^20 - /.test(dossierImmediat(p)));
      let gagnant;
      if (enVingt.length >= 1) {
        gagnant = enVingt.reduce((a, b) => (corpsLen(b) > corpsLen(a) ? b : a));
      } else {
        gagnant = liste.reduce((a, b) => (corpsLen(b) > corpsLen(a) ? b : a));
      }
      gagnant.out = 'w/' + slugWiki + '/' + slugFinal + '.html';
      const perdants = [];
      for (const p of liste) {
        if (p === gagnant) continue;
        const dossier = dossierImmediat(p);
        let suffixe;
        if (/^27 - /.test(dossier)) suffixe = 'encadrement';
        else {
          // dossier immédiat de CETTE note perdante (peut différer du dossier du gagnant
          // même quand les deux partagent le même dossier de premier niveau : « Amiante »
          // à la racine de 20 - Articles internes contre « Substances dangereuses/Amiante »)
          const dossierPropre = p.relPath.split('/').slice(1, -1).pop() || dossier;
          suffixe = slugify(cleanLabel(dossierPropre)) || 'variante';
        }
        p.out = 'w/' + slugWiki + '/' + slugFinal + '-' + suffixe + '.html';
        perdants.push({ relPath: p.relPath, out: p.out });
      }
      collisions.push({ wikiKey, slug: s, gagnant: gagnant.relPath, gagnantOut: gagnant.out, perdants });
    }
  }

  // Contrôle final : aucune collision résiduelle (deux pages du même wiki, même adresse).
  const vus = new Map();
  for (const p of pages) {
    const cle = p.wikiKey + '::' + String(p.out).toLowerCase();
    if (vus.has(cle)) {
      throw new Error(`Collision d'adresse résiduelle dans ${p.wikiKey} : ${p.out} pour « ${p.relPath} » et « ${vus.get(cle)} »`);
    }
    vus.set(cle, p.relPath);
  }

  return { collisions };
}
