// Relais des avis du WIKI SST — Mines vers Airtable.
//
// Pourquoi un relais : le site est statique (GitHub Pages). Un jeton Airtable posé dans une page
// publique serait lisible — et utilisable — par n'importe qui : il reste donc ici, côté serveur.
// Le navigateur envoie l'avis à ce Worker, qui seul connaît le jeton.
//
// Un enregistrement par page et par lecteur : la clé « Réf » (identifiant local du lecteur + adresse
// de la page) permet de retrouver la ligne du pouce quand le commentaire arrive ensuite, ou quand le
// lecteur change d'avis. Même convention que les Workers « attestations-tms » et
// « attestations-procedures ».
//
// L'adresse est publique : tout ce qui arrive ici est traité comme hostile jusqu'à preuve du
// contraire. Origine permise (l'en-tête se forge, mais il écarte le tout-venant), débit borné par
// adresse, corps borné avant lecture, formes contrôlées, et une distinction nette entre un refus
// définitif (le navigateur jette l'avis) et une panne (il le garde pour plus tard).
//
// Variables (Cloudflare → Settings → Variables) :
//   AIRTABLE_TOKEN   secret — jeton d'accès personnel Airtable, portées data.records:read et
//                    data.records:write, limité à la base Formations
//   AIRTABLE_BASE    appmq82YjvEUglYZU
//   AIRTABLE_TABLE   tbl3kDCV13AFkd6X6        (identifiant : survit à un renommage de la table)
//   ORIGINES         https://frankyray21.github.io   (séparées par des virgules si plusieurs ;
//                    en développement, y ajouter http://localhost:8090 — rien n'est admis d'office)
//   LIMITE           liaison de limitation de débit déclarée dans wrangler.toml (facultative)

const AVIS_VALIDES = ['👍 Utile', '👎 À revoir'];
const WIKIS_VALIDES = ['Ergonomie', 'Hygiène industrielle', 'Toxicologie', 'Sécurité industrielle',
  'Droit du travail', 'SST psychosociale', 'Recueil législatif', 'Espace encadrement'];
const LIMITES = { page: 300, adresse: 300, lien: 500, commentaire: 1500, nom: 80, ref: 400, source: 60 };
// forme des adresses produites par le générateur : minuscules, chiffres, . - _ / et .html
const ADRESSE = /^[a-z0-9][a-z0-9._/-]{0,250}\.html$/;
const CORPS_MAX = 8 * 1024;   // un envoi légitime complet fait environ 3 Ko
const FUSEAU = 'America/Toronto';

// Sur une ligne : tout blanc devient une espace simple. Le commentaire, lui, garde ses retours à la
// ligne — le champ Airtable est multiligne, et un rapport de terrain se lit en paragraphes.
const coupe = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
const coupeTexte = (v, n) => String(v == null ? '' : v)
  .replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
// « https://site.example/ » et « https://site.example/wiki » désignent la même origine que
// l'en-tête Origin : on compare des origines, pas des chaînes saisies à la main.
const origineDe = (v) => { try { return new URL(v).origin; } catch { return ''; } };
// Le champ « Lien » d'Airtable est de type URL : une valeur qui n'en est pas une ferait refuser
// toute la ligne (422). On n'écrit que ce qui en a la forme, et seulement en http(s).
const lienValide = (v) => { try { const u = new URL(v); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } };
// Jour civil au Québec. Si les données de fuseau manquaient à l'exécution, le jour UTC vaut
// mieux qu'une ligne refusée.
function jour() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch { return new Date().toISOString().slice(0, 10); }
}
// Clé du seau de débit : l'adresse IPv4, ou le préfixe /64 en IPv6 — le plus petit bloc qu'un
// fournisseur délègue, sinon un attaquant disposerait de 2^64 adresses distinctes.
function seau(ip) {
  if (!ip) return 'inconnu';
  if (!ip.includes(':')) return ip;
  const m = ip.match(/^((?:[0-9a-f]{0,4}:){1,4})/i);
  return m ? m[1].replace(/:$/, '') : ip;
}
// Lecture bornée : Content-Length est facultatif et sous le contrôle de l'émetteur. On lit le flux
// et on s'arrête dès que la borne est dépassée, sans jamais garder un corps entier en mémoire.
async function lireCorps(requete, max) {
  const annonce = Number(requete.headers.get('Content-Length'));
  if (annonce > max) return null;
  if (!requete.body) return '';
  const lecteur = requete.body.getReader();
  const morceaux = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) { await lecteur.cancel().catch(() => {}); return null; }
    morceaux.push(value);
  }
  const tout = new Uint8Array(total);
  let i = 0;
  for (const m of morceaux) { tout.set(m, i); i += m.byteLength; }
  return new TextDecoder().decode(tout);
}

// L'en-tête d'origine n'est posé que s'il y a une origine à nommer : « null » n'est pas une
// valeur neutre (c'est l'origine des documents opaques), et une absence bloque proprement.
function entetes(origine) {
  const e = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (origine) e['Access-Control-Allow-Origin'] = origine;
  return e;
}
const reponse = (corps, statut, origine) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { ...entetes(origine), 'Content-Type': 'application/json' } });

export default {
  async fetch(requete, env) {
    const origine = origineDe(requete.headers.get('Origin') || '');
    const permises = (env.ORIGINES || '').split(',').map(o => origineDe(o.trim())).filter(Boolean);
    const permise = permises.includes(origine);
    // Un refus (origine étrangère, relais non configuré) renvoie l'origine du demandeur : la
    // réponse ne contient rien, et le navigateur doit pouvoir lire « definitif » pour cesser de
    // rejouer l'avis à chaque page. Pour tout le reste, seule l'origine permise est nommée.
    if (requete.method === 'OPTIONS') return new Response(null, { status: 204, headers: entetes(origine) });
    // Rien n'est ouvert par défaut : sans ORIGINES, le relais refuse au lieu de servir tout le monde.
    if (!permises.length) return reponse({ erreur: 'relais non configuré : variable ORIGINES absente', definitif: true }, 503, origine);
    if (!permise) return reponse({ erreur: 'origine non permise', definitif: true }, 403, origine);
    if (requete.method !== 'POST') return reponse({ erreur: 'méthode non permise', definitif: true }, 405, origine);

    // Débit borné par adresse : l'en-tête Origin se forge, et la base Formations est partagée
    // avec les tables d'attestations et de retours de quiz. Une liaison absente ou en panne ne
    // ferme pas le relais : elle ne limite rien, c'est tout.
    if (env.LIMITE) {
      let resultat = null;
      try { resultat = await env.LIMITE.limit({ key: seau(requete.headers.get('CF-Connecting-IP')) }); }
      catch (e) { console.warn('limitation de débit indisponible :', String((e && e.message) || e)); }
      if (resultat && resultat.success === false) return reponse({ erreur: 'trop de requêtes' }, 429, origine);
    }

    let brut;
    try { brut = await lireCorps(requete, CORPS_MAX); } catch { return reponse({ erreur: 'corps illisible', definitif: true }, 400, origine); }
    if (brut === null) return reponse({ erreur: 'corps trop long', definitif: true }, 413, origine);
    let recu;
    try { recu = JSON.parse(brut); } catch { return reponse({ erreur: 'corps illisible', definitif: true }, 400, origine); }
    if (!recu || typeof recu !== 'object' || Array.isArray(recu)) return reponse({ erreur: 'corps inattendu', definitif: true }, 400, origine);

    const avis = coupe(recu.avis, 40);
    const ref = coupe(recu.ref, LIMITES.ref);
    const adresse = coupe(recu.adresse, LIMITES.adresse);
    if (!AVIS_VALIDES.includes(avis)) return reponse({ erreur: 'avis inattendu', definitif: true }, 400, origine);
    if (!ADRESSE.test(adresse)) return reponse({ erreur: 'adresse inattendue', definitif: true }, 400, origine);
    // La Réf entre dans une formule Airtable : elle doit être exactement « lecteur · adresse ».
    // Guillemet, barre oblique inverse et caractères de contrôle ne peuvent donc pas y entrer, et
    // un même lecteur ne peut pas semer une ligne nouvelle à chaque envoi.
    if (!/^[A-Za-z0-9]{2,40}·/.test(ref) || ref !== ref.slice(0, ref.indexOf('·') + 1) + adresse) {
      return reponse({ erreur: 'référence inattendue', definitif: true }, 400, origine);
    }

    const wiki = coupe(recu.wiki, 60);
    const champs = {
      'Page': coupe(recu.page, LIMITES.page) || adresse,
      'Avis': avis,
      'Commentaire': coupeTexte(recu.commentaire, LIMITES.commentaire),
      'Adresse': adresse,
      'Lien': lienValide(coupe(recu.lien, LIMITES.lien)),
      'Nom': coupe(recu.nom, LIMITES.nom),
      'Source': coupe(recu.source, LIMITES.source) || 'wiki-sst-mines',
      'Réf': ref,
    };
    if (WIKIS_VALIDES.includes(wiki)) champs['Wiki'] = wiki;
    // un commentaire vide n'efface pas celui déjà donné ; un lien absent ou difforme n'est pas écrit
    for (const c of ['Commentaire', 'Nom', 'Lien']) if (!champs[c]) delete champs[c];

    const api = `https://api.airtable.com/v0/${env.AIRTABLE_BASE}/${env.AIRTABLE_TABLE}`;
    const auth = { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' };
    // Airtable en panne ou saturé : le navigateur gardera l'avis. Airtable qui refuse (jeton, table,
    // valeur) : rien ne le réparera d'ici là, le navigateur doit jeter l'avis plutôt que le rejouer
    // à chaque page pendant des semaines en affichant « Pas de réseau » à un lecteur connecté.
    const echec = async (r) => {
      const detail = `Airtable ${r.status} ${(await r.text()).slice(0, 200)}`;
      const definitif = r.status >= 400 && r.status < 500 && r.status !== 429 && r.status !== 408;
      return reponse({ erreur: detail, definitif }, definitif ? 422 : 502, origine);
    };

    try {
      // la ligne de ce lecteur pour cette page existe-t-elle déjà ?
      const formule = `{Réf}=${JSON.stringify(ref)}`;
      const cherche = await fetch(`${api}?maxRecords=1&filterByFormula=${encodeURIComponent(formule)}`, { headers: auth });
      if (!cherche.ok) return echec(cherche);
      const trouve = (await cherche.json()).records || [];

      // « Date » est le jour du premier avis, au Québec : une mise à jour ne la réécrit pas.
      const ecrit = trouve.length
        ? await fetch(`${api}/${trouve[0].id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ fields: champs, typecast: true }) })
        : await fetch(api, { method: 'POST', headers: auth, body: JSON.stringify({ fields: { ...champs, 'Date': jour(), 'Statut': 'Nouveau' }, typecast: true }) });
      if (!ecrit.ok) return echec(ecrit);

      return reponse({ ok: true, mis_a_jour: trouve.length > 0 }, 200, origine);
    } catch (e) {
      // panne réseau entre le Worker et Airtable : le navigateur remettra l'avis dans sa file
      return reponse({ erreur: String((e && e.message) || e).slice(0, 200) }, 502, origine);
    }
  },
};
