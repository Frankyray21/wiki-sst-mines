// Relais des avis du WIKI SST — Mines vers Airtable.
//
// Pourquoi un relais : le site est statique (GitHub Pages). Un jeton Airtable posé dans une page
// publique serait lisible — et utilisable — par n'importe qui : il resterait donc ici, côté serveur.
// Le navigateur envoie l'avis à ce Worker, qui seul connaît le jeton.
//
// Un enregistrement par page et par lecteur : la clé « Réf » (identifiant local du lecteur + adresse
// de la page) permet de retrouver la ligne du pouce quand le commentaire arrive ensuite, ou quand le
// lecteur change d'avis. Même convention que les Workers « attestations-tms » et
// « attestations-procedures ».
//
// Variables (Cloudflare → Settings → Variables) :
//   AIRTABLE_TOKEN   secret — jeton d'accès personnel Airtable, portées data.records:read et
//                    data.records:write, limité à la base Formations
//   AIRTABLE_BASE    appmq82YjvEUglYZU
//   AIRTABLE_TABLE   tbl3kDCV13AFkd6X6        (identifiant : survit à un renommage de la table)
//   ORIGINES         https://frankyray21.github.io   (séparées par des virgules si plusieurs)

const AVIS_VALIDES = ['👍 Utile', '👎 À revoir'];
const WIKIS_VALIDES = ['Ergonomie', 'Hygiène industrielle', 'Toxicologie', 'Sécurité industrielle',
  'Droit du travail', 'SST psychosociale', 'Recueil législatif', 'Espace encadrement'];
const LIMITES = { page: 300, adresse: 300, lien: 500, commentaire: 1500, nom: 80, ref: 400, source: 60 };

const coupe = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);

function entetes(origine) {
  return {
    'Access-Control-Allow-Origin': origine || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
const reponse = (corps, statut, origine) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { ...entetes(origine), 'Content-Type': 'application/json' } });

export default {
  async fetch(requete, env) {
    const origine = requete.headers.get('Origin') || '';
    const permises = (env.ORIGINES || '').split(',').map(o => o.trim()).filter(Boolean);
    const permise = !permises.length || permises.includes(origine) || /^http:\/\/localhost(:\d+)?$/.test(origine);

    if (requete.method === 'OPTIONS') return new Response(null, { status: 204, headers: entetes(permise ? origine : permises[0]) });
    if (requete.method !== 'POST') return reponse({ erreur: 'méthode non permise' }, 405, origine);
    if (!permise) return reponse({ erreur: 'origine non permise' }, 403, permises[0] || '*');

    let recu;
    try { recu = await requete.json(); } catch { return reponse({ erreur: 'corps illisible' }, 400, origine); }

    const avis = coupe(recu.avis, 40);
    const ref = coupe(recu.ref, LIMITES.ref);
    const adresse = coupe(recu.adresse, LIMITES.adresse);
    if (!AVIS_VALIDES.includes(avis)) return reponse({ erreur: 'avis inattendu' }, 400, origine);
    if (!ref || !adresse) return reponse({ erreur: 'page manquante' }, 400, origine);

    const wiki = coupe(recu.wiki, 60);
    const champs = {
      'Page': coupe(recu.page, LIMITES.page) || adresse,
      'Avis': avis,
      'Commentaire': coupe(recu.commentaire, LIMITES.commentaire),
      'Adresse': adresse,
      'Lien': coupe(recu.lien, LIMITES.lien),
      'Nom': coupe(recu.nom, LIMITES.nom),
      'Date': new Date().toISOString().slice(0, 10),
      'Source': coupe(recu.source, LIMITES.source) || 'wiki-sst-mines',
      'Réf': ref,
    };
    if (WIKIS_VALIDES.includes(wiki)) champs['Wiki'] = wiki;
    // un commentaire vide n'efface pas celui déjà donné
    if (!champs['Commentaire']) delete champs['Commentaire'];
    if (!champs['Nom']) delete champs['Nom'];

    const api = `https://api.airtable.com/v0/${env.AIRTABLE_BASE}/${env.AIRTABLE_TABLE}`;
    const auth = { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' };

    try {
      // la ligne de ce lecteur pour cette page existe-t-elle déjà ?
      const formule = `{Réf}=${JSON.stringify(ref)}`;
      const cherche = await fetch(`${api}?maxRecords=1&filterByFormula=${encodeURIComponent(formule)}`, { headers: auth });
      if (!cherche.ok) throw new Error(`Airtable ${cherche.status}`);
      const trouve = (await cherche.json()).records || [];

      const ecrit = trouve.length
        ? await fetch(`${api}/${trouve[0].id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ fields: champs }) })
        : await fetch(api, { method: 'POST', headers: auth, body: JSON.stringify({ fields: { ...champs, 'Statut': 'Nouveau' }, typecast: true }) });
      if (!ecrit.ok) throw new Error(`Airtable ${ecrit.status} ${(await ecrit.text()).slice(0, 200)}`);

      return reponse({ ok: true, mis_a_jour: trouve.length > 0 }, 200, origine);
    } catch (e) {
      // le navigateur remettra l'avis dans sa file d'attente
      return reponse({ erreur: String(e.message || e).slice(0, 200) }, 502, origine);
    }
  },
};
