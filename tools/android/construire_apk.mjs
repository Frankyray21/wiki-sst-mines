// Construit l'APK du WIKI SST — Mines : une application Android qui ouvre le site publié en plein
// écran, avec la consultation hors ligne du site (service worker) et une page locale pour la
// première ouverture sans réseau.
//
//   node tools/android/construire_apk.mjs [--version 1.0] [--code 1]
//
// Dépendances : Java 17+ (javac, keytool) et Node 22. Les outils Android nécessaires sont pris sur
// Maven Central (dx pour le code Dalvik, apksig pour la signature, le cadre Android pour compiler)
// et gardés dans tools/android/.cache ; le manifeste, la table de ressources et l'archive sont
// écrits par binaire.mjs. Sortie : tools/android/dist/wiki-sst-mines.apk.
//
// Signature : le magasin de clés tools/android/cle/wiki-sst-mines.p12 (hors Git) et son mot de
// passe (variable WIKI_APK_MDP, sinon tools/android/cle/mot-de-passe.txt). S'il n'existe pas, il
// est créé. GARDER CE MAGASIN : une mise à jour de l'application doit être signée avec la même clé,
// sinon Android refuse de l'installer par-dessus l'ancienne.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { compilerXml, compilerTable, archiver, positionsDesDonnees, VAL } from './binaire.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../..');
const CACHE = path.join(ICI, '.cache'), BUILD = path.join(ICI, 'build'), DIST = path.join(ICI, 'dist'), CLE = path.join(ICI, 'cle');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const VERSION = opt('--version', '1.0');
const CODE = Number(opt('--code', '1'));
export const PAQUET = 'io.github.frankyray21.wikisstmines';
const SDK_MIN = 24, SDK_CIBLE = 34;

// ---------- dépendances (Maven Central), empreintes vérifiées ----------
const DEPENDANCES = {
  'dalvik-dx-16.0.1.jar': ['https://repo1.maven.org/maven2/com/jakewharton/android/repackaged/dalvik-dx/16.0.1/dalvik-dx-16.0.1.jar', '1e4b645628e3bdb097b5331d669e177ef235a551582a8c646dbe36865e541907'],
  'apksig-2.3.0.jar': ['https://repo1.maven.org/maven2/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar', '9637078c0016244e4be0941836295365a7e2e5b164c59cb7885783c40460bfee'],
  'android-all-14-robolectric-10818077.jar': ['https://repo1.maven.org/maven2/org/robolectric/android-all/14-robolectric-10818077/android-all-14-robolectric-10818077.jar', '6be2218c6a53fe3c57bc22ebdc723edcb7270a8a6f187545708aa5c0ed813977'],
};
async function dependance(nom) {
  const [url, empreinte] = DEPENDANCES[nom];
  const chemin = path.join(CACHE, nom);
  if (!fs.existsSync(chemin)) {
    fs.mkdirSync(CACHE, { recursive: true });
    console.log(`  téléchargement de ${nom}…`);
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${nom} : HTTP ${r.status}`);
    fs.writeFileSync(chemin, Buffer.from(await r.arrayBuffer()));
  }
  const h = crypto.createHash('sha256').update(fs.readFileSync(chemin)).digest('hex');
  if (h !== empreinte) throw new Error(`${nom} : empreinte inattendue (${h})`);
  return chemin;
}
const java = (outil, a) => execFileSync(outil, a, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });

// ---------- manifeste ----------
export function manifeste({ version, code, icone }) {
  const A = (nom, id, type, valeur) => ({ ns: 'android', nom, id, type, valeur });
  return {
    nom: 'manifest',
    attrs: [A('versionCode', 0x0101021b, VAL.INT_DEC, code), A('versionName', 0x0101021c, VAL.STRING, version),
      { ns: null, nom: 'package', type: VAL.STRING, valeur: PAQUET }],
    enfants: [
      { nom: 'uses-sdk', attrs: [A('minSdkVersion', 0x0101020c, VAL.INT_DEC, SDK_MIN), A('targetSdkVersion', 0x01010270, VAL.INT_DEC, SDK_CIBLE)] },
      { nom: 'uses-permission', attrs: [A('name', 0x01010003, VAL.STRING, 'android.permission.INTERNET')] },
      { nom: 'uses-permission', attrs: [A('name', 0x01010003, VAL.STRING, 'android.permission.ACCESS_NETWORK_STATE')] },
      {
        nom: 'application',
        attrs: [
          A('theme', 0x01010000, VAL.REFERENCE, 0x0103022e),          // @android:style/Theme.Material.NoActionBar
          A('label', 0x01010001, VAL.STRING, 'Wiki SST'),
          A('icon', 0x01010002, VAL.REFERENCE, icone),
          A('allowBackup', 0x01010280, VAL.INT_BOOLEAN, false),
          A('hardwareAccelerated', 0x010102d3, VAL.INT_BOOLEAN, true),
          A('usesCleartextTraffic', 0x010104ec, VAL.INT_BOOLEAN, false),
        ],
        enfants: [{
          nom: 'activity',
          attrs: [
            A('name', 0x01010003, VAL.STRING, PAQUET + '.MainActivity'),
            A('exported', 0x01010010, VAL.INT_BOOLEAN, true),
            A('launchMode', 0x0101001d, VAL.INT_DEC, 2),                  // singleTask : une seule fenêtre
            // rotation, clavier, taille, densité, mode nuit : pas de redémarrage, la page reste en place
            A('configChanges', 0x0101001f, VAL.INT_HEX, 0x80 | 0x20 | 0x10 | 0x400 | 0x800 | 0x100 | 0x1000 | 0x200),
          ],
          enfants: [{
            nom: 'intent-filter',
            enfants: [
              { nom: 'action', attrs: [A('name', 0x01010003, VAL.STRING, 'android.intent.action.MAIN')] },
              { nom: 'category', attrs: [A('name', 0x01010003, VAL.STRING, 'android.intent.category.LAUNCHER')] },
            ],
          }],
        }],
      },
    ],
  };
}

// ---------- construction ----------
async function construire() {
  if (!Number.isInteger(CODE) || CODE < 1) throw new Error('--code : entier positif attendu');
  const [dx, apksig, android] = await Promise.all(Object.keys(DEPENDANCES).map(dependance));
  fs.rmSync(BUILD, { recursive: true, force: true });
  fs.mkdirSync(path.join(BUILD, 'classes'), { recursive: true });

  // 1. code Java → classes → classes.dex
  const src = path.join(ICI, 'src/io/github/frankyray21/wikisstmines');
  fs.writeFileSync(path.join(BUILD, 'BuildConfig.java'),
    fs.readFileSync(path.join(src, 'BuildConfig.java.modele'), 'utf8').replace('@VERSION@', VERSION));
  java('javac', ['--release', '8', '-nowarn', '-encoding', 'UTF-8', '-cp', android, '-d', path.join(BUILD, 'classes'),
    path.join(src, 'MainActivity.java'), path.join(BUILD, 'BuildConfig.java')]);
  java('java', ['-cp', dx, 'com.android.dx.command.Main', '--dex', `--min-sdk-version=${SDK_MIN}`,
    `--output=${path.join(BUILD, 'classes.dex')}`, path.join(BUILD, 'classes')]);
  const dex = fs.readFileSync(path.join(BUILD, 'classes.dex'));

  // 2. ressources : l'icône du site, en xxxhdpi (192 px = 48 dp × 4)
  const icone = fs.readFileSync(path.join(RACINE, 'docs/assets/icone-192.png'));
  const fichierIcone = 'res/drawable-xxxhdpi-v4/icon.png';
  const { table, ids } = compilerTable(PAQUET, [{ type: 'drawable', nom: 'icon', fichier: fichierIcone, densite: 640 }]);
  const axml = compilerXml(manifeste({ version: VERSION, code: CODE, icone: ids['drawable/icon'] }));

  // 3. archive non signée
  const nonSigne = archiver([
    { nom: 'AndroidManifest.xml', donnees: axml },
    { nom: 'classes.dex', donnees: dex },
    { nom: 'resources.arsc', donnees: table, stocker: true },
    { nom: fichierIcone, donnees: icone, stocker: true },
    { nom: 'assets/hors-ligne.html', donnees: fs.readFileSync(path.join(ICI, 'assets/hors-ligne.html')) },
  ]);
  fs.writeFileSync(path.join(BUILD, 'non-signe.apk'), nonSigne);

  // 4. clé de signature (créée au premier passage, jamais versionnée)
  const magasin = path.join(CLE, 'wiki-sst-mines.p12');
  let mdp = process.env.WIKI_APK_MDP || (fs.existsSync(path.join(CLE, 'mot-de-passe.txt')) ? fs.readFileSync(path.join(CLE, 'mot-de-passe.txt'), 'utf8').trim() : '');
  if (!fs.existsSync(magasin)) {
    fs.mkdirSync(CLE, { recursive: true });
    if (!mdp) { mdp = crypto.randomBytes(18).toString('base64url'); fs.writeFileSync(path.join(CLE, 'mot-de-passe.txt'), mdp + '\n', { mode: 0o600 }); }
    java('keytool', ['-genkeypair', '-keystore', magasin, '-storetype', 'PKCS12', '-alias', 'wikisst', '-keyalg', 'RSA', '-keysize', '3072',
      '-validity', '12000', '-dname', 'CN=WIKI SST Mines, O=WIKI SST Mines, C=CA', '-storepass', mdp, '-keypass', mdp]);
    console.log(`  ⚠ nouvelle clé de signature : ${path.relative(RACINE, magasin)} — à conserver hors Git`);
  }
  if (!mdp) throw new Error('mot de passe du magasin introuvable (WIKI_APK_MDP ou cle/mot-de-passe.txt)');

  // 5. signature v2 (Android 7 et plus), vérifiée
  java('javac', ['-nowarn', '-cp', apksig, '-d', BUILD, path.join(ICI, 'Signataire.java')]);
  fs.mkdirSync(DIST, { recursive: true });
  const sortie = path.join(DIST, 'wiki-sst-mines.apk');
  // apksig 2.3.0 (le dernier publié sur Maven Central) lit des classes internes du JDK pour la
  // signature v1 : elles sont ouvertes explicitement depuis Java 17.
  const ouvertures = ['sun.security.x509', 'sun.security.pkcs', 'sun.security.util'].flatMap(p => ['--add-exports', `java.base/${p}=ALL-UNNAMED`]);
  const rapport = execFileSync('java', [...ouvertures, '-cp', `${apksig}${path.delimiter}${BUILD}`, 'Signataire', path.join(BUILD, 'non-signe.apk'), sortie, magasin, 'wikisst'],
    { env: { ...process.env, WIKI_APK_MDP: mdp }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('  ' + rapport.trim().split('\n').join('\n  '));

  // 6. contrôles : entrées non compressées alignées, taille, empreinte
  const apk = fs.readFileSync(sortie);
  for (const [nom, e] of Object.entries(positionsDesDonnees(apk))) {
    if (e.methode === 0 && e.donnees % 4) throw new Error(`${nom} : non aligné (${e.donnees})`);
    if (nom === 'resources.arsc' && e.methode !== 0) throw new Error('resources.arsc doit être stocké sans compression');
  }
  const empreinte = crypto.createHash('sha256').update(apk).digest('hex');
  fs.writeFileSync(path.join(DIST, 'wiki-sst-mines.json'), JSON.stringify({
    paquet: PAQUET, versionName: VERSION, versionCode: CODE, sdkMin: SDK_MIN, sdkCible: SDK_CIBLE,
    octets: apk.length, sha256: empreinte,
    certificatSha256: execFileSync('keytool', ['-list', '-keystore', magasin, '-storetype', 'PKCS12', '-storepass', mdp, '-alias', 'wikisst', '-v'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      .match(/SHA256:\s*([0-9A-F:]+)/)[1],
  }, null, 1) + '\n');
  console.log(`APK : ${path.relative(RACINE, sortie)} · ${(apk.length / 1024).toFixed(1)} Ko · version ${VERSION} (${CODE}) · sha256 ${empreinte.slice(0, 16)}…`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  construire().catch((e) => { console.error(String(e.stderr || e.message || e)); process.exit(1); });
}
