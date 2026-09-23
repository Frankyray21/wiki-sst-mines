import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { compilerXml, compilerTable, archiver, positionsDesDonnees, bassinDeChaines, BLOC, VAL } from '../android/binaire.mjs';
import { manifeste, PAQUET } from '../android/construire_apk.mjs';

// Application Android (23 septembre 2026) : manifeste compilé, table de ressources et archive
// écrits à la main (les outils officiels viennent d'un hôte injoignable). Ces tests relisent ce
// qui est écrit avec un décodeur indépendant du codeur, et contrôlent l'APK publié.
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// décodeur minimal des blocs binaires Android, écrit séparément du codeur
function blocs(buf, debut, fin) {
  const res = [];
  for (let p = debut; p < fin;) {
    const type = buf.readUInt16LE(p), entete = buf.readUInt16LE(p + 2), taille = buf.readUInt32LE(p + 4);
    assert.ok(taille >= entete && p + taille <= fin, `bloc 0x${type.toString(16)} : taille ${taille}`);
    assert.equal(taille % 4, 0, `bloc 0x${type.toString(16)} : taille alignée sur 4`);
    res.push({ type, entete, taille, p });
    p += taille;
  }
  return res;
}
function chaines(buf, p) {
  const n = buf.readUInt32LE(p + 8), drapeaux = buf.readUInt32LE(p + 16), debut = buf.readUInt32LE(p + 20);
  assert.equal(drapeaux & 0x100, 0, 'UTF-16');
  return Array.from({ length: n }, (_, i) => {
    const o = p + debut + buf.readUInt32LE(p + 28 + 4 * i);
    const len = buf.readUInt16LE(o);
    return buf.toString('utf16le', o + 2, o + 2 + 2 * len);
  });
}
function lireXml(buf) {
  const [racine] = blocs(buf, 0, buf.length);
  assert.equal(racine.type, BLOC.XML);
  const enfants = blocs(buf, 8, buf.length);
  const s = chaines(buf, enfants[0].p);
  const carte = enfants[1];
  assert.equal(carte.type, BLOC.XML_RES_MAP);
  const ids = Array.from({ length: (carte.taille - 8) / 4 }, (_, i) => buf.readUInt32LE(carte.p + 8 + 4 * i));
  const elements = [];
  for (const b of enfants.slice(2)) {
    if (b.type !== BLOC.XML_START_EL) continue;
    const e = b.p + 16, nb = buf.readUInt16LE(e + 12);
    assert.equal(buf.readUInt16LE(e + 8), 20); assert.equal(buf.readUInt16LE(e + 10), 20);
    const attrs = Array.from({ length: nb }, (_, i) => {
      const a = e + 20 + 20 * i, nom = buf.readUInt32LE(a + 4);
      return { nom: s[nom], id: nom < ids.length ? ids[nom] : 0, type: buf.readUInt8(a + 15), donnee: buf.readUInt32LE(a + 16), brut: buf.readUInt32LE(a + 8) };
    });
    elements.push({ nom: s[buf.readUInt32LE(e + 4)], attrs, s });
  }
  return { s, ids, elements };
}

test('manifeste compilé : relu par un décodeur indépendant, attributs triés par identifiant', () => {
  const { s, ids, elements } = lireXml(compilerXml(manifeste({ version: '1.0', code: 1, icone: 0x7f010000 })));
  // les noms d'attributs à identifiant ouvrent le bassin, dans l'ordre de la table
  assert.deepEqual(ids, [...ids].sort((a, b) => a - b));
  ids.forEach((id, i) => assert.ok(s[i] && /^[a-zA-Z]+$/.test(s[i]), `chaîne ${i} = nom d’attribut`));
  assert.deepEqual(elements.map(e => e.nom), ['manifest', 'uses-sdk', 'uses-permission', 'uses-permission', 'application', 'activity', 'intent-filter', 'action', 'category']);
  for (const e of elements) {
    const avecId = e.attrs.filter(a => a.id).map(a => a.id);
    assert.deepEqual(avecId, [...avecId].sort((a, b) => a - b), e.nom + ' : attributs triés');
    assert.ok(e.attrs.findIndex(a => !a.id) === -1 || e.attrs.slice(e.attrs.findIndex(a => !a.id)).every(a => !a.id), e.nom + ' : sans identifiant à la fin');
  }
  const val = (el, nom) => elements.find(e => e.nom === el).attrs.find(a => a.nom === nom);
  assert.equal(elements[0].s[val('manifest', 'package').donnee], PAQUET);
  assert.equal(val('uses-sdk', 'minSdkVersion').donnee, 24);
  assert.equal(val('uses-sdk', 'targetSdkVersion').donnee, 34);
  assert.equal(val('activity', 'exported').type, VAL.INT_BOOLEAN);
  assert.equal(val('activity', 'exported').donnee, 0xFFFFFFFF, 'exported explicite (cible 31 et plus)');
  assert.equal(val('application', 'icon').type, VAL.REFERENCE);
  assert.equal(val('application', 'icon').donnee, 0x7f010000);
  assert.equal(val('application', 'theme').donnee, 0x0103022e, '@android:style/Theme.Material.NoActionBar');
  assert.equal(val('application', 'usesCleartextTraffic').donnee, 0, 'https seulement');
  const nomAct = val('activity', 'name');
  assert.equal(nomAct.brut, nomAct.donnee, 'une chaîne porte aussi sa valeur brute');
  assert.equal(elements[0].s[nomAct.donnee], PAQUET + '.MainActivity');
});

test('table de ressources : paquet 0x7f, icône en xxxhdpi, en-têtes aux tailles du format', () => {
  const { table, ids } = compilerTable(PAQUET, [{ type: 'drawable', nom: 'icon', fichier: 'res/drawable-xxxhdpi-v4/icon.png', densite: 640 }]);
  assert.equal(ids['drawable/icon'], 0x7f010000);
  const [t] = blocs(table, 0, table.length);
  assert.equal(t.type, BLOC.TABLE); assert.equal(t.entete, 12); assert.equal(table.readUInt32LE(8), 1);
  const [pool, paquet] = blocs(table, 12, table.length);
  assert.deepEqual(chaines(table, pool.p), ['res/drawable-xxxhdpi-v4/icon.png']);
  assert.equal(paquet.type, BLOC.TABLE_PACKAGE); assert.equal(paquet.entete, 288);
  assert.equal(table.readUInt32LE(paquet.p + 8), 0x7f);
  assert.equal(table.toString('utf16le', paquet.p + 12, paquet.p + 12 + 2 * PAQUET.length), PAQUET);
  const dedans = blocs(table, paquet.p + 288, paquet.p + paquet.taille);
  assert.deepEqual(dedans.map(b => b.type), [BLOC.STRING_POOL, BLOC.STRING_POOL, BLOC.TABLE_TYPE_SPEC, BLOC.TABLE_TYPE]);
  assert.deepEqual(chaines(table, dedans[0].p), ['drawable']);
  assert.deepEqual(chaines(table, dedans[1].p), ['icon']);
  assert.equal(table.readUInt32LE(paquet.p + 268), 288, 'bassin des types juste après l’en-tête');
  assert.equal(table.readUInt32LE(paquet.p + 276), 288 + dedans[0].taille, 'bassin des clés ensuite');
  const type = dedans[3];
  assert.equal(type.entete, 84);
  assert.equal(table.readUInt32LE(type.p + 16), 88, 'début des entrées : en-tête + un décalage');
  assert.equal(table.readUInt16LE(type.p + 20 + 14), 640, 'densité xxxhdpi');
  assert.equal(table.readUInt8(type.p + 88 + 8 + 3), VAL.STRING, 'l’entrée désigne un fichier');
});

test('archive : entrées stockées alignées sur 4 octets, les autres compressées', () => {
  const zip = archiver([
    { nom: 'AndroidManifest.xml', donnees: Buffer.alloc(301, 1) },
    { nom: 'resources.arsc', donnees: Buffer.alloc(97, 2), stocker: true },
    { nom: 'res/x.png', donnees: Buffer.alloc(33, 3), stocker: true },
  ]);
  const pos = positionsDesDonnees(zip);
  assert.equal(pos['AndroidManifest.xml'].methode, 8);
  for (const n of ['resources.arsc', 'res/x.png']) { assert.equal(pos[n].methode, 0); assert.equal(pos[n].donnees % 4, 0, n); }
  assert.equal(bassinDeChaines(['é']).length % 4, 0);
});

test('APK publié : signé, décrit, identique à sa construction, hors du cache hors ligne', () => {
  const apk = fs.readFileSync(path.join(R, 'tools/android/dist/wiki-sst-mines.apk'));
  const info = JSON.parse(fs.readFileSync(path.join(R, 'tools/android/dist/wiki-sst-mines.json'), 'utf8'));
  assert.equal(info.paquet, PAQUET);
  assert.equal(info.octets, apk.length);
  assert.equal(info.sha256, crypto.createHash('sha256').update(apk).digest('hex'));
  assert.ok(fs.readFileSync(path.join(R, 'docs/app/wiki-sst-mines.apk')).equals(apk), 'docs/app/ = tools/android/dist/');
  // bloc de signature v2 (« APK Sig Block 42 ») juste avant le répertoire central
  assert.ok(apk.includes(Buffer.from('APK Sig Block 42')), 'signature v2 présente');
  const pos = positionsDesDonnees(apk);
  for (const n of ['AndroidManifest.xml', 'classes.dex', 'resources.arsc', 'res/drawable-xxxhdpi-v4/icon.png', 'assets/hors-ligne.html']) assert.ok(pos[n], n);
  assert.equal(pos['resources.arsc'].methode, 0);
  assert.equal(pos['resources.arsc'].donnees % 4, 0);
  const liste = JSON.parse(fs.readFileSync(path.join(R, 'docs/assets/hors-ligne.json'), 'utf8'));
  assert.ok(!liste.pages.some(p => p[0].startsWith('app/')), 'l’APK n’est pas téléchargé dans le cache de chaque lecteur');
  // les deux portails y mènent ; dans l'application, le lien se masque
  assert.ok(fs.readFileSync(path.join(R, 'docs/index.html'), 'utf8').includes('<span class="lien-app"> · <a href="app/wiki-sst-mines.apk" download>📱 Application Android</a></span>'));
  assert.ok(fs.readFileSync(path.join(R, 'docs/g/index.html'), 'utf8').includes('<a href="../app/wiki-sst-mines.apk" download>📱 Application Android</a>'));
  const app = fs.readFileSync(path.join(R, 'tools/app.js'), 'utf8');
  assert.ok(app.includes("var dansApk = /WikiSSTMinesApp\\//.test(navigator.userAgent);"));
  const java = fs.readFileSync(path.join(R, 'tools/android/src/io/github/frankyray21/wikisstmines/MainActivity.java'), 'utf8');
  assert.ok(java.includes('" WikiSSTMinesApp/" + BuildConfig.VERSION'), 'l’application se signale au site');
  // aucune clé de signature dans le dépôt
  const ignores = fs.readFileSync(path.join(R, '.gitignore'), 'utf8');
  assert.ok(ignores.includes('tools/android/cle/'));
});
