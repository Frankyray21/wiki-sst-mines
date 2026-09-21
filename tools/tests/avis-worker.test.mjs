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

test('la date est le jour au Québec : un avis de 21 h 45 n’est pas daté du lendemain', async (t) => {
  // 02:45 UTC le 1er janvier = 21:45 la veille à Montréal (heure normale)
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-01T02:45:00Z') });
  const appels = simuler();
  await worker.fetch(poste(AVIS), ENV);
  assert.equal(appels[1].corps.fields['Date'], '2025-12-31');
  t.mock.timers.reset();
});

test('le commentaire garde ses paragraphes ; le champ est multiligne', async () => {
  const appels = simuler();
  await worker.fetch(poste({ ...AVIS, commentaire: 'Premier point.\r\n\nDeuxième   point.\n\n\n\nTroisième.' }), ENV);
  assert.equal(appels[1].corps.fields['Commentaire'], 'Premier point.\n\nDeuxième point.\n\nTroisième.');
});

test('le même lecteur sur la même page met à jour sa ligne, sans toucher au statut', async () => {
  const appels = simuler({ existant: 'recDEJA' });
  const r = await worker.fetch(poste(AVIS), ENV);
  assert.deepEqual(await r.json(), { ok: true, mis_a_jour: true });
  assert.equal(appels[1].methode, 'PATCH');
  assert.match(appels[1].url, /\/recDEJA$/);
  assert.ok(!('Statut' in appels[1].corps.fields), 'un avis déjà traité ne repasse pas en « Nouveau »');
  assert.ok(!('Date' in appels[1].corps.fields), 'la date reste celle du premier avis');
  assert.equal(appels[1].corps.typecast, true, 'même tolérance qu’à la création');
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
    [{ ...AVIS, adresse: '' }, 400, 'adresse inattendue'],
    [{ ...AVIS, adresse: 'https://ailleurs.example/x.html' }, 400, 'adresse inattendue'],
    [{ ...AVIS, ref: '' }, 400, 'référence inattendue'],
    // la Réf entre dans une formule Airtable : rien qui puisse en sortir, et elle doit désigner
    // la page envoyée — sinon un même lecteur sèmerait une ligne nouvelle à chaque appel
    [{ ...AVIS, ref: 'L1·x" != "y' }, 400, 'référence inattendue'],
    [{ ...AVIS, ref: 'L1·w/autre/page.html' }, 400, 'référence inattendue'],
    [{ ...AVIS, ref: 'L1·x\u0007y' }, 400, 'référence inattendue'],
    [{ ...AVIS, ref: AVIS.adresse }, 400, 'référence inattendue'],
  ];
  for (const [corps, statut, erreur] of cas) {
    const r = await worker.fetch(poste(corps), ENV);
    assert.equal(r.status, statut, JSON.stringify(corps.avis || corps.ref || corps.adresse));
    const recu = await r.json();
    assert.equal(recu.erreur, erreur);
    assert.equal(recu.definitif, true, 'un refus ne se retente pas : le navigateur doit jeter l’avis');
  }
  // corps qui n'est pas un objet, corps trop long : refusés proprement, avec les en-têtes CORS
  for (const [corps, statut] of [[null, 400], ['"texte"', 400], [{ ...AVIS, commentaire: 'x'.repeat(9000) }, 413]]) {
    const r = await worker.fetch(poste(corps), ENV);
    assert.equal(r.status, statut);
    assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGINE);
  }
  // Origine étrangère : refusée, aucune écriture. Le refus renvoie l'origine du demandeur (la
  // réponse ne contient rien) pour que le navigateur lise « definitif » et cesse de rejouer l'avis.
  {
    const appels = simuler();
    const etranger = await worker.fetch(poste(AVIS, 'https://ailleurs.example'), ENV);
    assert.equal(etranger.status, 403);
    assert.equal(appels.length, 0);
    assert.equal(etranger.headers.get('Access-Control-Allow-Origin'), 'https://ailleurs.example');
    assert.equal((await etranger.json()).definitif, true);
  }
  // une origine écrite avec une barre finale ou un chemin désigne la même origine
  for (const ecrit of ['https://frankyray21.github.io/', 'https://frankyray21.github.io/wiki-sst-mines']) {
    assert.equal((await worker.fetch(poste(AVIS), { ...ENV, ORIGINES: ecrit })).status, 200, ecrit);
  }
  // rien n'est ouvert par défaut : sans ORIGINES, AUCUNE origine ne passe — pas même localhost
  for (const org of ['https://frankyray21.github.io', 'http://localhost', 'http://localhost:5173']) {
    const appels = simuler();
    const r = await worker.fetch(poste(AVIS, org), { ...ENV, ORIGINES: '' });
    assert.equal(r.status, 503, org);
    assert.equal(appels.length, 0, 'aucun appel Airtable quand le relais n’est pas configuré');
    assert.equal((await r.json()).definitif, true);
  }
  // localhost n'est admis que s'il est écrit dans ORIGINES, comme n'importe quelle origine
  assert.equal((await worker.fetch(poste(AVIS, 'http://localhost:8090'), ENV)).status, 403);
  assert.equal((await worker.fetch(poste(AVIS, 'http://localhost:8090'), { ...ENV, ORIGINES: ORIGINE + ', http://localhost:8090' })).status, 200);
  // sans en-tête Origin (curl nu) : refusé, et aucun Access-Control-Allow-Origin — jamais « null »
  const nu = await worker.fetch(new Request('https://relais.test/avis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(AVIS) }), ENV);
  assert.equal(nu.status, 403);
  assert.equal(nu.headers.get('Access-Control-Allow-Origin'), null);
  // méthode
  const get = await worker.fetch(new Request('https://relais.test/avis', { headers: { Origin: ORIGINE } }), ENV);
  assert.equal(get.status, 405);
  // pré-vol CORS
  const vol = await worker.fetch(new Request('https://relais.test/avis', { method: 'OPTIONS', headers: { Origin: ORIGINE } }), ENV);
  assert.equal(vol.status, 204);
  assert.equal(vol.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
  // une Réf normale, avec l'adresse de la page, passe
  assert.equal((await worker.fetch(poste(AVIS), ENV)).status, 200);
});

test('un lien difforme n’est pas écrit : le champ Airtable est de type URL et refuserait la ligne', async () => {
  for (const [lien, attendu] of [['https://frankyray21.github.io/wiki-sst-mines/w/x.html', 'https://frankyray21.github.io/wiki-sst-mines/w/x.html'], ['file:///C:/wiki/x.html', undefined], ['pas une adresse', undefined], ['', undefined], ['javascript:alert(1)', undefined]]) {
    const appels = simuler();
    assert.equal((await worker.fetch(poste({ ...AVIS, lien }), ENV)).status, 200, lien);
    assert.equal(appels[1].corps.fields['Lien'], attendu, lien);
  }
});

test('corps borné avant lecture : Content-Length menteur ou absent, flux coupé à 8 Ko', async () => {
  simuler();
  const gros = JSON.stringify({ ...AVIS, commentaire: 'x'.repeat(20000) });
  // annoncé trop long : refusé sans lire
  let r = await worker.fetch(new Request('https://relais.test/avis', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGINE, 'Content-Length': String(gros.length) }, body: gros }), ENV);
  assert.equal(r.status, 413);
  // annoncé petit mais long en réalité : lu par morceaux et coupé
  const flux = new ReadableStream({ start(c) { for (let i = 0; i < gros.length; i += 1024) c.enqueue(new TextEncoder().encode(gros.slice(i, i + 1024))); c.close(); } });
  r = await worker.fetch(new Request('https://relais.test/avis', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGINE, 'Content-Length': '10' }, body: flux, duplex: 'half' }), ENV);
  assert.equal(r.status, 413);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGINE, 'en-têtes CORS présents sur un refus');
});

test('débit borné : au-delà de la limite, 429 — et le navigateur garde l’avis', async () => {
  const appels = simuler();
  let reste = 2;
  const cles = [];
  const LIMITE = { limit: async ({ key }) => { cles.push(key); return { success: reste-- > 0 }; } };
  const requete = (ip = '203.0.113.7') => new Request('https://relais.test/avis', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGINE, 'CF-Connecting-IP': ip }, body: JSON.stringify(AVIS),
  });
  assert.equal((await worker.fetch(requete(), { ...ENV, LIMITE })).status, 200);
  assert.equal((await worker.fetch(requete(), { ...ENV, LIMITE })).status, 200);
  const trop = await worker.fetch(requete(), { ...ENV, LIMITE });
  assert.equal(trop.status, 429);
  assert.ok(!(await trop.json()).definitif, 'une limite passe : l’avis repartira plus tard');
  assert.equal(appels.filter(a => a.methode !== 'GET').length, 2, 'aucune écriture Airtable au-delà de la limite');
  assert.deepEqual(cles, ['203.0.113.7', '203.0.113.7', '203.0.113.7']);
  // IPv6 : le seau est le préfixe /64, pas l'adresse complète — sinon 2^64 clés par abonné
  reste = 10; cles.length = 0;
  await worker.fetch(requete('2001:db8:85a3:8d3:1319:8a2e:370:7348'), { ...ENV, LIMITE });
  await worker.fetch(requete('2001:db8:85a3:8d3:ffff:ffff:ffff:1'), { ...ENV, LIMITE });
  assert.deepEqual(cles, ['2001:db8:85a3:8d3', '2001:db8:85a3:8d3']);
  // une liaison absente de forme, mal nommée ou qui lève ne ferme pas le relais
  for (const L of [{}, 20, { limit: async () => { throw new Error('indisponible'); } }, { limit: async () => undefined }]) {
    simuler();
    const r = await worker.fetch(requete(), { ...ENV, LIMITE: L });
    assert.equal(r.status, 200, 'liaison ' + JSON.stringify(L));
    assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGINE, 'en-têtes CORS présents même en panne de liaison');
  }
});

test('Airtable : un refus définitif n’est pas une panne', async () => {
  // 422 (valeur refusée), 401/403/404 (jeton, base, table) : rien ne se réparera au rechargement.
  for (const [statut, attendu, definitif] of [[422, 422, true], [404, 422, true], [429, 502, false], [500, 502, false]]) {
    globalThis.fetch = async (url, opts = {}) => ((opts.method || 'GET') === 'GET'
      ? Response.json({ records: [] })
      : new Response('refus', { status: statut }));
    const r = await worker.fetch(poste(AVIS), ENV);
    assert.equal(r.status, attendu, 'Airtable ' + statut);
    assert.equal((await r.json()).definitif, definitif);
  }
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
