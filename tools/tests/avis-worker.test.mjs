import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../avis-worker/worker.js';

// Relais des avis : ce que le Worker accepte, refuse, et écrit dans Airtable. Aucun appel réel —
// fetch est remplacé, et le jeton d'essai ne sort pas d'ici.
const ENV = { AIRTABLE_TOKEN: 'jeton-essai', AIRTABLE_BASE: 'appTEST', AIRTABLE_TABLE: 'tblTEST', ORIGINES: 'https://frankyray21.github.io' };
const ORIGINE = 'https://frankyray21.github.io';
const AVIS = {
  ref: 'L12345678·w/psychosocial/x.html', avis: '👍 Utile', page: 'Communication ascendante',
  adresse: 'w/psychosocial/x.html', wiki: 'SST psychosociale', lien: 'https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/x.html',
  commentaire: 'Il manque le quart de nuit.', nom: 'Frank', source: 'wiki-sst-mines',
};
const poste = (corps, origine = ORIGINE) => new Request('https://relais.test/avis', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': origine }, body: JSON.stringify(corps),
});

// fetch simulé : `existant` décide si la recherche par Réf trouve une ligne
function simuler({ existant = null, panne = false } = {}) {
  const appels = [];
  globalThis.fetch = async (url, opts = {}) => {
    appels.push({ url: String(url), methode: opts.method || 'GET', corps: opts.body ? JSON.parse(opts.body) : null, entetes: opts.headers });
    if (panne) return new Response('indisponible', { status: 503 });
    if ((opts.method || 'GET') === 'GET') return Response.json({ records: existant ? [{ id: existant }] : [] });
    return Response.json({ id: existant || 'recNEUF' });
  };
  return appels;
}

test('un avis nouveau crée une ligne, avec le statut « Nouveau »', async () => {
  const appels = simuler();
  const r = await worker.fetch(poste(AVIS), ENV);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, mis_a_jour: false });
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGINE);
  assert.equal(appels.length, 2, 'une recherche puis une création');
  assert.match(appels[0].url, /filterByFormula=/, 'recherche par Réf');
  assert.ok(decodeURIComponent(appels[0].url).includes('{Réf}="L12345678·w/psychosocial/x.html"'));
  assert.equal(appels[0].entetes.Authorization, 'Bearer jeton-essai', 'le jeton ne part que vers Airtable');
  assert.equal(appels[1].methode, 'POST');
  const champs = appels[1].corps.fields;
  assert.equal(champs['Avis'], '👍 Utile');
  assert.equal(champs['Page'], 'Communication ascendante');
  assert.equal(champs['Commentaire'], 'Il manque le quart de nuit.');
  assert.equal(champs['Wiki'], 'SST psychosociale');
  assert.equal(champs['Statut'], 'Nouveau');
  assert.match(champs['Date'], /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(champs['Réf'], AVIS.ref);
});

test('le même lecteur sur la même page met à jour sa ligne, sans toucher au statut', async () => {
  const appels = simuler({ existant: 'recDEJA' });
  const r = await worker.fetch(poste(AVIS), ENV);
  assert.deepEqual(await r.json(), { ok: true, mis_a_jour: true });
  assert.equal(appels[1].methode, 'PATCH');
  assert.match(appels[1].url, /\/recDEJA$/);
  assert.ok(!('Statut' in appels[1].corps.fields), 'un avis déjà traité ne repasse pas en « Nouveau »');
});

test('un commentaire ou un nom vide n’efface pas ce qui a été donné', async () => {
  const appels = simuler({ existant: 'recDEJA' });
  await worker.fetch(poste({ ...AVIS, commentaire: '   ', nom: '' }), ENV);
  const champs = appels[1].corps.fields;
  assert.ok(!('Commentaire' in champs) && !('Nom' in champs));
});

test('ce que le relais refuse', async () => {
  simuler();
  const cas = [
    [{ ...AVIS, avis: '⭐ Génial' }, 400, 'avis inattendu'],
    [{ ...AVIS, ref: '' }, 400, 'page manquante'],
    [{ ...AVIS, adresse: '' }, 400, 'page manquante'],
    // la Réf entre dans une formule Airtable : rien qui puisse en sortir
    [{ ...AVIS, ref: 'L1·x" != "y' }, 400, 'référence inattendue'],
    [{ ...AVIS, ref: 'L1·x\\" != \\"y' }, 400, 'référence inattendue'],
    [{ ...AVIS, ref: 'L1·x\u0007y' }, 400, 'référence inattendue'],
  ];
  for (const [corps, statut, erreur] of cas) {
    const r = await worker.fetch(poste(corps), ENV);
    assert.equal(r.status, statut, JSON.stringify(corps.avis || corps.ref));
    assert.equal((await r.json()).erreur, erreur);
  }
  // l'apostrophe typographique et le séparateur « · » d'une Réf normale passent
  assert.equal((await worker.fetch(poste({ ...AVIS, ref: 'L1·w/psychosocial/l’équipe.html' }), ENV)).status, 200);
  // origine étrangère
  const etranger = await worker.fetch(poste(AVIS, 'https://ailleurs.example'), ENV);
  assert.equal(etranger.status, 403);
  // méthode
  const get = await worker.fetch(new Request('https://relais.test/avis', { headers: { Origin: ORIGINE } }), ENV);
  assert.equal(get.status, 405);
  // pré-vol CORS
  const vol = await worker.fetch(new Request('https://relais.test/avis', { method: 'OPTIONS', headers: { Origin: ORIGINE } }), ENV);
  assert.equal(vol.status, 204);
  assert.equal(vol.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
});

test('les textes trop longs sont coupés, Airtable en panne renvoie 502', async () => {
  const appels = simuler();
  await worker.fetch(poste({ ...AVIS, commentaire: 'x'.repeat(3000), nom: 'y'.repeat(200) }), ENV);
  assert.equal(appels[1].corps.fields['Commentaire'].length, 1500);
  assert.equal(appels[1].corps.fields['Nom'].length, 80);
  simuler({ panne: true });
  const r = await worker.fetch(poste(AVIS), ENV);
  assert.equal(r.status, 502, 'le navigateur remettra l’avis dans sa file');
});
