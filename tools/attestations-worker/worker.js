// Relais des attestations de lecture de l'Espace travailleurs (WIKI SST — Mines) vers Airtable.
//
// Pourquoi un relais : le site est statique (GitHub Pages). Un jeton Airtable posé dans une page
// publique serait lisible — et utilisable — par n'importe qui : il reste ici, côté serveur.
//
// Deux services, et rien d'autre :
//   GET  /?q=<texte>  → noms d'employés qui contiennent le texte (8 au plus, 2 lettres minimum),
//                       pour que le travailleur choisisse SON nom dans la liste Airtable ;
//   POST /            → enregistre une attestation de lecture (une page lue, questions réussies).
//   GET  /            → état du service.
// Aucune lecture des attestations : personne ne peut, par ce relais, voir ce qu'un autre a lu ou
// répondu. Les conseillers consultent la table dans Airtable.
//
// L'adresse est publique : tout ce qui arrive ici est traité comme hostile jusqu'à preuve du
// contraire. Origine permise (l'en-tête se forge, mais il écarte le tout-venant), débit borné par
// adresse IP, corps borné avant lecture, formes contrôlées, et une distinction nette entre un refus
// définitif (le navigateur jette l'envoi) et une panne (il le garde pour plus tard). Même
// convention que le relais des avis (tools/avis-worker/) et que « attestations-procedures ».
//
// Variables (Cloudflare → Settings → Variables and Secrets) :
//   AIRTABLE_TOKEN   secret — jeton d'accès personnel Airtable, portées data.records:read et
//                    data.records:write, accès à la base Formations
//   AIRTABLE_BASE    appmq82YjvEUglYZU          base « Formations »
//   AIRTABLE_TABLE   tblh6H7GOXZUwgXor          « Attestations Wiki SST travailleurs (web) »
//   EMP_TABLE        tbllKuNePDWZMr1cz          « Liste employé (registre formation) »
//   EMP_NAME_FIELD   Name                       champ du nom complet dans la liste des employés
//   ORIGINES         https://frankyray21.github.io  (virgules si plusieurs ; rien n'est admis d'office)
//   SEUIL            80                         note de passage, en pour cent
//   LIMITE           liaison de débit des attestations (wrangler.toml), facultative
//   LIMITE_RECHERCHE liaison de débit de la recherche de nom (wrangler.toml), facultative

const SECTIONS = ['Après ta blessure', 'Prendre soin de toi', 'Préparer ton retour', 'Travailler en sécurité'];
const LIMITES = { nom: 80, page: 200, lien: 500, score: 40, temps: 40, developpement: 6000, detail: 4000, revision: 40 };
// adresses produites par le générateur de l'espace : travailleurs/<slug>.html
const ADRESSE = /^travailleurs\/[a-z0-9][a-z0-9-]{0,80}\.html$/;
const REC = /^rec[A-Za-z0-9]{14}$/;
const CORPS_MAX = 16 * 1024;   // une attestation complète, réponses écrites comprises, fait 2 à 8 Ko
const FUSEAU = 'America/Toronto';
const SOURCE = 'wiki-sst-mines · espace travailleurs';

// Sur une ligne : tout blanc devient une espace simple, les caractères de contrôle disparaissent.
const coupe = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
// Texte long : garde les retours à la ligne (les réponses écrites se lisent en paragraphes).
const coupeTexte = (v, n) => String(v == null ? '' : v)
  .replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ')
  .replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
const origineDe = (v) => { try { return new URL(v).origin; } catch { return ''; } };
const lienValide = (v) => { try { const u = new URL(v); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
// Comparaison de noms : minuscules, sans accents, espaces simples.
const plat = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const entier = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= max ? n : null; };

function jour() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch { return new Date().toISOString().slice(0, 10); }
}
// Seau de débit : l'adresse IPv4, ou le préfixe /64 en IPv6.
function seau(ip) {
  if (!ip) return 'inconnu';
  if (!ip.includes(':')) return ip;
  const m = ip.match(/^((?:[0-9a-f]{0,4}:){1,4})/i);
  return m ? m[1].replace(/:$/, '') : ip;
}
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
function entetes(origine) {
  const e = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (origine) e['Access-Control-Allow-Origin'] = origine;
  return e;
}
const reponse = (corps, statut, origine, plus) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { ...entetes(origine), 'Content-Type': 'application/json; charset=utf-8', ...(plus || {}) } });

// Formule Airtable qui retire les accents français d'une expression (comparaison sans accents).
function sansAccentsFormule(expr) {
  const paires = [['à', 'a'], ['â', 'a'], ['ä', 'a'], ['á', 'a'], ['é', 'e'], ['è', 'e'], ['ê', 'e'], ['ë', 'e'],
    ['î', 'i'], ['ï', 'i'], ['í', 'i'], ['ô', 'o'], ['ö', 'o'], ['ó', 'o'], ['ù', 'u'], ['û', 'u'], ['ü', 'u'], ['ú', 'u'],
    ['ç', 'c'], ['ñ', 'n'], ['ÿ', 'y']];
  let f = expr;
  for (const [a, b] of paires) f = `SUBSTITUTE(${f},"${a}","${b}")`;
  return f;
}
// Texte sûr dans une chaîne de formule Airtable : ni guillemet ni barre oblique inverse.
const pourFormule = (s) => String(s).replace(/["\\]/g, ' ');

async function airtable(env, chemin, options) {
  return fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE}/${chemin}`, {
    ...(options || {}),
    headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json', ...((options && options.headers) || {}) },
  });
}
const champNom = (env) => env.EMP_NAME_FIELD || 'Name';

// Noms qui contiennent le texte, sans égard aux accents ni à la casse ; ceux qui COMMENCENT par le
// texte d'abord, puis l'ordre alphabétique.
async function chercherEmployes(env, texte) {
  const terme = pourFormule(plat(texte)).slice(0, 50);
  if (terme.length < 2) return [];
  const nom = champNom(env);
  const formule = `SEARCH("${terme}", ${sansAccentsFormule(`LOWER({${nom}})`)})`;
  const r = await airtable(env, `${env.EMP_TABLE}?maxRecords=8&fields%5B%5D=${encodeURIComponent(nom)}&filterByFormula=${encodeURIComponent(formule)}`);
  if (!r.ok) throw Object.assign(new Error(`Airtable ${r.status}`), { statut: r.status });
  const recs = (await r.json()).records || [];
  return recs
    .map((x) => ({ id: x.id, nom: String((x.fields && x.fields[nom]) || '').trim() }))
    .filter((x) => x.nom)
    .sort((a, b) => (plat(a.nom).startsWith(terme) ? 0 : 1) - (plat(b.nom).startsWith(terme) ? 0 : 1) || a.nom.localeCompare(b.nom, 'fr'));
}

// L'employé désigné par le navigateur, s'il existe ET porte bien ce nom ; sinon l'unique employé de
// ce nom exact. Rien si aucun ou plusieurs : la ligne partira « À relier ».
async function trouverEmploye(env, nomRecu, idRecu) {
  const nom = champNom(env);
  const cible = plat(nomRecu);
  if (REC.test(idRecu || '')) {
    const r = await airtable(env, `${env.EMP_TABLE}?maxRecords=1&fields%5B%5D=${encodeURIComponent(nom)}&filterByFormula=${encodeURIComponent(`RECORD_ID()="${idRecu}"`)}`);
    if (r.ok) {
      const rec = ((await r.json()).records || [])[0];
      if (rec && plat(rec.fields && rec.fields[nom]) === cible) return rec.id;
    }
  }
  if (cible.length < 2) return '';
  const formule = `TRIM(${sansAccentsFormule(`LOWER({${nom}})`)})="${pourFormule(cible)}"`;
  const r = await airtable(env, `${env.EMP_TABLE}?maxRecords=2&fields%5B%5D=${encodeURIComponent(nom)}&filterByFormula=${encodeURIComponent(formule)}`);
  if (!r.ok) return '';
  const recs = (await r.json()).records || [];
  return recs.length === 1 ? recs[0].id : '';
}

async function limiter(liaison, requete) {
  if (!liaison) return true;
  try {
    const r = await liaison.limit({ key: seau(requete.headers.get('CF-Connecting-IP')) });
    return !(r && r.success === false);
  } catch (e) {
    console.warn('limitation de débit indisponible :', String((e && e.message) || e));
    return true;
  }
}

export default {
  async fetch(requete, env) {
    const url = new URL(requete.url);
    const origine = origineDe(requete.headers.get('Origin') || '');
    const permises = (env.ORIGINES || '').split(',').map((o) => origineDe(o.trim())).filter(Boolean);
    const permise = permises.includes(origine);

    if (requete.method === 'OPTIONS') return new Response(null, { status: 204, headers: entetes(origine) });
    // État du service : sans données, ouvert à tous (vérification avec curl ou un navigateur).
    if (requete.method === 'GET' && !url.searchParams.has('q')) {
      return reponse({ ok: true, service: 'attestations-wiki-travailleurs', configure: Boolean(env.AIRTABLE_TOKEN && permises.length) }, 200, permise ? origine : '');
    }
    if (!permises.length) return reponse({ erreur: 'relais non configuré : variable ORIGINES absente', definitif: true }, 503, origine);
    if (!permise) return reponse({ erreur: 'origine non permise', definitif: true }, 403, origine);
    if (!env.AIRTABLE_TOKEN) return reponse({ erreur: 'relais non configuré : secret AIRTABLE_TOKEN absent' }, 503, origine);

    // ---- recherche de nom -------------------------------------------------------------------
    if (requete.method === 'GET') {
      if (!(await limiter(env.LIMITE_RECHERCHE, requete))) return reponse({ erreur: 'trop de requêtes', resultats: [] }, 429, origine);
      try {
        const resultats = await chercherEmployes(env, url.searchParams.get('q') || '');
        return reponse({ ok: true, resultats }, 200, origine, { 'Cache-Control': 'no-store' });
      } catch (e) {
        return reponse({ erreur: String((e && e.message) || e).slice(0, 200), resultats: [] }, 502, origine);
      }
    }
    if (requete.method !== 'POST') return reponse({ erreur: 'méthode non permise', definitif: true }, 405, origine);

    // ---- attestation ------------------------------------------------------------------------
    if (!(await limiter(env.LIMITE, requete))) return reponse({ erreur: 'trop de requêtes' }, 429, origine);
    let brut;
    try { brut = await lireCorps(requete, CORPS_MAX); } catch { return reponse({ erreur: 'corps illisible', definitif: true }, 400, origine); }
    if (brut === null) return reponse({ erreur: 'corps trop long', definitif: true }, 413, origine);
    let recu;
    try { recu = JSON.parse(brut); } catch { return reponse({ erreur: 'corps illisible', definitif: true }, 400, origine); }
    if (!recu || typeof recu !== 'object' || Array.isArray(recu)) return reponse({ erreur: 'corps inattendu', definitif: true }, 400, origine);

    const nom = coupe(recu.nom, LIMITES.nom);
    const adresse = coupe(recu.adresse, 120);
    const section = coupe(recu.section, 60);
    const pourcentage = recu.pourcentage == null || recu.pourcentage === '' ? null : entier(recu.pourcentage, 100);
    const seuil = entier(env.SEUIL == null ? 80 : env.SEUIL, 100);
    if (nom.length < 2) return reponse({ erreur: 'nom manquant', definitif: true }, 400, origine);
    if (!ADRESSE.test(adresse)) return reponse({ erreur: 'adresse inattendue', definitif: true }, 400, origine);
    if (section && !SECTIONS.includes(section)) return reponse({ erreur: 'section inattendue', definitif: true }, 400, origine);
    if (recu.pourcentage != null && recu.pourcentage !== '' && pourcentage === null) return reponse({ erreur: 'score inattendu', definitif: true }, 400, origine);
    // Une attestation suit des questions réussies. Le navigateur ne l'envoie qu'à ce moment ; un
    // score sous le seuil est donc une erreur du site, pas une attestation.
    if (pourcentage !== null && seuil !== null && pourcentage < seuil) return reponse({ erreur: `score sous le seuil de ${seuil} %`, definitif: true }, 400, origine);

    const date = jour();
    const champs = {
      'Nom': nom,
      'Page': coupe(recu.page, LIMITES.page) || adresse,
      'Adresse': adresse,
      'Lien': lienValide(coupe(recu.lien, LIMITES.lien)),
      'Section': section,
      'Date': date,
      'Score': coupe(recu.score, LIMITES.score),
      'Pourcentage': pourcentage,
      'Essais': entier(recu.essais, 1000),
      'Temps de lecture': coupe(recu.tempsLecture, LIMITES.temps),
      'Secondes lecture': entier(recu.secondesLecture, 1e7),
      'Lecture estimée': coupe(recu.lectureEstimee, LIMITES.temps),
      'Temps sur les questions': coupe(recu.tempsQuestions, LIMITES.temps),
      'Secondes questions': entier(recu.secondesQuestions, 1e7),
      'Réponses à développement': coupeTexte(recu.developpement, LIMITES.developpement),
      'Détail des réponses': coupeTexte(recu.detail, LIMITES.detail),
      'Révision page': coupe(recu.revision, LIMITES.revision),
      'Source': SOURCE,
    };
    for (const [c, v] of Object.entries(champs)) if (v === '' || v === null) delete champs[c];

    const echec = async (r) => {
      const detail = `Airtable ${r.status} ${(await r.text()).slice(0, 200)}`;
      const definitif = r.status >= 400 && r.status < 500 && r.status !== 429 && r.status !== 408;
      return reponse({ erreur: detail, definitif }, definitif ? 422 : 502, origine);
    };

    try {
      const employe = await trouverEmploye(env, nom, coupe(recu.employeId, 20));
      // Une même personne, une même page, un même jour : une seule ligne. Un renvoi (réseau coupé
      // pendant la réponse, double toucher) met à jour la ligne au lieu d'en créer une seconde.
      const cle = `${employe || 'nom-' + plat(nom).replace(/[^a-z0-9]+/g, '-')}·${adresse}·${date}`;
      champs['Réf'] = cle;
      const cherche = await airtable(env, `${env.AIRTABLE_TABLE}?maxRecords=1&filterByFormula=${encodeURIComponent(`{Réf}="${pourFormule(cle)}"`)}`);
      if (!cherche.ok) return echec(cherche);
      const trouve = ((await cherche.json()).records || [])[0];
      if (employe) champs['Employé'] = [employe];
      // Statut posé à la création seulement : une ligne déjà lue par un conseiller ne repasse pas
      // en « Reçu » parce que le navigateur a renvoyé l'attestation.
      const ecrit = trouve
        ? await airtable(env, `${env.AIRTABLE_TABLE}/${trouve.id}`, { method: 'PATCH', body: JSON.stringify({ fields: champs, typecast: true }) })
        : await airtable(env, env.AIRTABLE_TABLE, { method: 'POST', body: JSON.stringify({ fields: { ...champs, 'Statut': employe ? 'Reçu' : 'À relier' }, typecast: true }) });
      if (!ecrit.ok) return echec(ecrit);
      const rec = await ecrit.json();
      return reponse({ ok: true, id: rec.id, relie: Boolean(employe), mis_a_jour: Boolean(trouve), date }, 200, origine);
    } catch (e) {
      return reponse({ erreur: String((e && e.message) || e).slice(0, 200) }, 502, origine);
    }
  },
};
