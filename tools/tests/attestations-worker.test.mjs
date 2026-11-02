import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../attestations-worker/worker.js';

// Relais des attestations de l'Espace travailleurs : ce qu'il accepte, refuse et écrit dans
// Airtable. Aucun appel réel — fetch est remplacé, et le jeton d'essai ne sort pas d'ici.
const ENV = {
  AIRTABLE_TOKEN: 'jeton-essai', AIRTABLE_BASE: 'appTEST', AIRTABLE_TABLE: 'tblATTEST', EMP_TABLE: 'tblEMP',
  EMP_NAME_FIELD: 'Name', ORIGINES: 'https://frankyray21.github.io', SEUIL: '80',
};
const ORIGINE = 'https://frankyray21.github.io';
const ATTESTATION = {
  nom: 'Jean Tremblay', employeId: 'recEMPLOYE000001', page: 'Ta réclamation à la CNESST',
  adresse: 'travailleurs/reclamation-cnesst.html', lien: 'https://frankyray21.github.io/wiki-sst-mines/travailleurs/reclamation-cnesst.html',
  section: 'Après ta blessure', score: '5/6 — 83 %', pourcentage: 83, essais: 2,
  tempsLecture: '6 min 12 s', secondesLecture: 372, lectureEstimee: '≈ 5 min', tempsQuestions: '3 min 05 s', secondesQuestions: 185,
  developpement: 'Q : Que fais-tu ?\nR : J’avertis mon superviseur.', detail: '✔ q1\n✘ q2', revision: '2026-05-22',
};
const poste = (corps, origine = ORIGINE) => new Request('https://relais.test/', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': origine }, body: JSON.stringify(corps),
});
const cherche = (q, origine = ORIGINE) => new Request('https://relais.test/?q=' + encodeURIComponent(q), { headers: { 'Origin': origine } });

// fetch simulé : employés de la liste, attestation déjà présente ou non, panne
function simuler({ employes = [{ id: 'recEMPLOYE000001', fields: { Name: 'Jean Tremblay' } }], existant = null, panne = false, refus = false } = {}) {
  const appels = [];
  globalThis.fetch = async (url, opts = {}) => {
    const u = decodeURIComponent(String(url));
    appels.push({ url: u, methode: opts.method || 'GET', corps: opts.body ? JSON.parse(opts.body) : null, entetes: opts.headers });
    if (panne) return new Response('indisponible', { status: 503 });
    if (refus && (opts.method || 'GET') !== 'GET') return new Response('{"error":"UNKNOWN_FIELD_NAME"}', { status: 422 });
    if ((opts.method || 'GET') === 'GET' && u.includes('/tblEMP?')) {
      const m = u.match(/RECORD_ID\(\)="(rec\w+)"/);
      if (m) return Response.json({ records: employes.filter(e => e.id === m[1]) });
      // nom exact : la formule TRIM(LOWER(…))="…" que le relais envoie, appliquée comme Airtable
      const exact = u.match(/TRIM\(.*\)="([^"]*)"/);
      const plat = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      if (exact) return Response.json({ records: employes.filter(e => plat(e.fields.Name) === exact[1]) });
      return Response.json({ records: employes });
    }
    if ((opts.method || 'GET') === 'GET') return Response.json({ records: existant ? [{ id: existant }] : [] });
    return Response.json({ id: existant || 'recNOUVELLE00001' });
  };
  return appels;
}
const ecriture = (appels) => appels.find(a => a.methode !== 'GET');

test('une attestation reliée à l’employé choisi crée une ligne « Reçu »', async () => {
  const appels = simuler();
  const r = await worker.fetch(poste(ATTESTATION), ENV);
  assert.equal(r.status, 200);
  const corps = await r.json();
  assert.equal(corps.ok, true);
  assert.equal(corps.relie, true);
  assert.equal(corps.mis_a_jour, false);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGINE);
  const e = ecriture(appels);
  assert.equal(e.methode, 'POST');
  assert.match(e.url, /\/tblATTEST$/);
  const f = e.corps.fields;
  assert.deepEqual(f['Employé'], ['recEMPLOYE000001']);
  assert.equal(f['Statut'], 'Reçu');
  assert.equal(f['Nom'], 'Jean Tremblay');
  assert.equal(f['Section'], 'Après ta blessure');
  assert.equal(f['Temps de lecture'], '6 min 12 s');
  assert.equal(f['Secondes lecture'], 372);
  assert.equal(f['Pourcentage'], 83);
  assert.equal(f['Réponses à développement'], 'Q : Que fais-tu ?\nR : J’avertis mon superviseur.', 'les retours à la ligne restent');
  assert.match(f['Date'], /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(f['Réf'], `recEMPLOYE000001·travailleurs/reclamation-cnesst.html·${f['Date']}`);
  assert.ok(appels.every(a => a.entetes.Authorization === 'Bearer jeton-essai' && a.url.startsWith('https://api.airtable.com/v0/appTEST/')),
    'le jeton ne part que vers Airtable');
});

test('un identifiant d’employé qui ne porte pas ce nom n’est pas relié tel quel', async () => {
  const appels = simuler({ employes: [{ id: 'recEMPLOYE000001', fields: { Name: 'Marie Gagnon' } }] });
  const r = await worker.fetch(poste(ATTESTATION), ENV);
  assert.equal(r.status, 200);
  const f = ecriture(appels).corps.fields;
  assert.ok(appels.some(a => a.url.includes('TRIM(') && a.url.includes('="jean tremblay"')), 'repli sur le nom exact, sans accents');
  assert.equal(f['Employé'], undefined, 'pas de lien vers la fiche d’une autre personne');
  assert.equal(f['Statut'], 'À relier');
});

test('aucun employé de ce nom : la ligne part « À relier », sans lien', async () => {
  const appels = simuler({ employes: [] });
  const r = await worker.fetch(poste({ ...ATTESTATION, employeId: '' }), ENV);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).relie, false);
  const f = ecriture(appels).corps.fields;
  assert.equal(f['Statut'], 'À relier');
  assert.equal(f['Employé'], undefined);
  assert.match(f['Réf'], /^nom-jean-tremblay·travailleurs\/reclamation-cnesst\.html·/);
});

test('un renvoi le même jour met à jour la même ligne sans toucher au statut', async () => {
  const appels = simuler({ existant: 'recDEJALA0000001' });
  const r = await worker.fetch(poste(ATTESTATION), ENV);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).mis_a_jour, true);
  const e = ecriture(appels);
  assert.equal(e.methode, 'PATCH');
  assert.match(e.url, /\/tblATTEST\/recDEJALA0000001$/);
  assert.equal(e.corps.fields['Statut'], undefined, 'une ligne déjà lue par un conseiller ne repasse pas en « Reçu »');
});

test('la recherche de nom renvoie au plus 8 noms, ceux qui commencent par le texte d’abord', async () => {
  const appels = simuler({ employes: [
    { id: 'recA000000000001', fields: { Name: 'Alain Tremblay' } },
    { id: 'recB000000000002', fields: { Name: 'Trépanier Luc' } },
  ] });
  const r = await worker.fetch(cherche('tré'), ENV);
  assert.equal(r.status, 200);
  const { resultats } = await r.json();
  assert.deepEqual(resultats.map(x => x.nom), ['Trépanier Luc', 'Alain Tremblay']);
  assert.deepEqual(Object.keys(resultats[0]).sort(), ['id', 'nom'], 'rien d’autre que l’identifiant et le nom');
  assert.ok(appels[0].url.includes('maxRecords=8'));
  assert.ok(appels[0].url.includes('SEARCH("tre"'), 'accents retirés du texte cherché');
  assert.ok(!appels[0].url.includes('fields[]=Profession'), 'seul le champ du nom est demandé');
});

test('la recherche refuse une origine étrangère et ignore un texte d’une lettre', async () => {
  simuler();
  assert.equal((await worker.fetch(cherche('tr', 'https://ailleurs.example'), ENV)).status, 403);
  const appels = simuler();
  const r = await worker.fetch(cherche('t'), ENV);
  assert.deepEqual((await r.json()).resultats, []);
  assert.equal(appels.length, 0, 'aucun appel à Airtable pour une seule lettre');
});

test('un guillemet dans le texte cherché ne sort pas de la formule', async () => {
  const appels = simuler();
  await worker.fetch(cherche('a") , TRUE()'), ENV);
  assert.ok(appels[0].url.includes('SEARCH("a ) , true()",'), 'le guillemet devient une espace : la chaîne de la formule reste fermée');
});

test('refus définitifs : adresse, nom, section, score sous le seuil, origine, corps', async () => {
  simuler();
  const cas = [
    [{ ...ATTESTATION, adresse: 'w/droit-travail/reclamation-cnesst.html' }, 400],
    [{ ...ATTESTATION, adresse: 'travailleurs/../g/index.html' }, 400],
    [{ ...ATTESTATION, nom: 'J' }, 400],
    [{ ...ATTESTATION, section: 'Admin' }, 400],
    [{ ...ATTESTATION, pourcentage: 79 }, 400],
    [{ ...ATTESTATION, pourcentage: 'beaucoup' }, 400],
  ];
  for (const [corps, statut] of cas) {
    const r = await worker.fetch(poste(corps), ENV);
    assert.equal(r.status, statut, JSON.stringify(corps).slice(0, 80));
    assert.equal((await r.json()).definitif, true);
  }
  assert.equal((await worker.fetch(poste(ATTESTATION, 'https://ailleurs.example'), ENV)).status, 403);
  assert.equal((await worker.fetch(poste(ATTESTATION), { ...ENV, ORIGINES: '' })).status, 503);
  const gros = new Request('https://relais.test/', { method: 'POST', headers: { 'Origin': ORIGINE }, body: 'x'.repeat(17 * 1024) });
  assert.equal((await worker.fetch(gros, ENV)).status, 413);
  const tableau = new Request('https://relais.test/', { method: 'POST', headers: { 'Origin': ORIGINE }, body: '[1,2]' });
  assert.equal((await worker.fetch(tableau, ENV)).status, 400);
});

test('une page sans questions corrigées s’atteste sans score', async () => {
  const appels = simuler();
  const { pourcentage, score, ...sans } = ATTESTATION;
  const r = await worker.fetch(poste(sans), ENV);
  assert.equal(r.status, 200);
  const f = ecriture(appels).corps.fields;
  assert.equal(f['Pourcentage'], undefined);
  assert.equal(f['Score'], undefined);
});

test('panne d’Airtable : 502 non définitif ; refus d’Airtable : 422 définitif', async () => {
  simuler({ panne: true });
  const r1 = await worker.fetch(poste(ATTESTATION), ENV);
  assert.equal(r1.status, 502);
  assert.equal((await r1.json()).definitif, false);
  simuler({ refus: true });
  const r2 = await worker.fetch(poste(ATTESTATION), ENV);
  assert.equal(r2.status, 422);
  assert.equal((await r2.json()).definitif, true);
});

test('l’état du service répond sans origine et ne dit rien des données', async () => {
  simuler();
  const r = await worker.fetch(new Request('https://relais.test/'), ENV);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, service: 'attestations-wiki-travailleurs', configure: true });
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), null);
});

test('limite de débit atteinte : 429 ; liaison en panne : le relais ne ferme pas', async () => {
  simuler();
  const bloque = { limit: async () => ({ success: false }) };
  assert.equal((await worker.fetch(poste(ATTESTATION), { ...ENV, LIMITE: bloque })).status, 429);
  assert.equal((await worker.fetch(cherche('tr'), { ...ENV, LIMITE_RECHERCHE: bloque })).status, 429);
  const enPanne = { limit: async () => { throw new Error('indisponible'); } };
  assert.equal((await worker.fetch(poste(ATTESTATION), { ...ENV, LIMITE: enPanne })).status, 200);
});
