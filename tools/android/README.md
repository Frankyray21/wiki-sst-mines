# Application Android — `wiki-sst-mines.apk`

Une application Android qui ouvre le WIKI SST — Mines en plein écran, sans barre d'adresse, avec
l'icône du wiki sur l'écran d'accueil. Paquet `io.github.frankyray21.wikisstmines`, Android 7.0 et
plus (API 24), cible API 34. Environ 8 Ko.

## Ce qu'elle fait — et ce qu'elle ne fait pas

- Elle affiche **le site publié** (`https://frankyray21.github.io/wiki-sst-mines/`) : le contenu
  n'est pas embarqué, il n'y a donc **rien à republier quand le wiki change**.
- La **consultation sans réseau** est celle du site : le service worker garde les pages, et le
  lien « ⬇️ Télécharger hors ligne » du menu enregistre tout le wiki (440 Mo, dont 375 Mo d'images
  et de PDF — en Wi-Fi de préférence). Ce cache appartient à l'application : il est distinct de
  celui de Chrome.
- À la toute première ouverture sans réseau, une page locale explique quoi faire.
- Les liens vers d'autres sites (LegisQuébec, DOI…), **les PDF** et les téléchargements s'ouvrent
  dans le navigateur de l'appareil — la vue intégrée d'Android n'affiche pas les PDF. Hors réseau,
  un PDF qui n'a jamais été ouvert dans le navigateur ne s'affiche donc pas.
- Le bouton Retour remonte l'historique du wiki ; la rotation ne recharge pas la page.
- L'application se signale au site (`WikiSSTMinesApp/<version>` dans l'agent utilisateur) : le
  lien « 📱 Application Android » des portails s'y masque.

Pourquoi une vue intégrée (WebView) plutôt qu'une « Trusted Web Activity » : une TWA sans barre
d'adresse exige un fichier `/.well-known/assetlinks.json` à la racine du domaine
`frankyray21.github.io`, hors de ce dépôt (site de projet). La vue intégrée n'en a pas besoin et
prend en charge le service worker, donc le hors-ligne.

## Installer sur la tablette

1. Sur le portail du wiki (ou l'espace encadrement), toucher **📱 Application Android**.
2. Ouvrir le fichier téléchargé ; Android demande d'autoriser l'installation d'applications
   inconnues pour le navigateur (ou « Mes fichiers ») : l'accepter pour cette source.
3. Ouvrir **Wiki SST** une première fois avec du réseau, puis menu → **⬇️ Télécharger hors ligne**.

## Construire

```bash
node tools/android/construire_apk.mjs --version 1.1 --code 2
```

Java 17 ou plus (`javac`, `keytool`) et Node 22. Les outils Android sont pris sur **Maven
Central**, empreintes vérifiées, et gardés dans `tools/android/.cache/` (hors Git) :
`dalvik-dx` (code Dalvik), `apksig` 2.3.0 (signature v2), `android-all` de Robolectric (cadre
Android API 34, pour compiler). Le manifeste compilé, la table de ressources et l'archive alignée
sont écrits par `binaire.mjs` : les outils officiels (`aapt2`, SDK) viennent de `dl.google.com`,
injoignable depuis l'environnement où l'APK a été construit. Sortie : `dist/wiki-sst-mines.apk`
et sa fiche `dist/wiki-sst-mines.json` (taille, SHA-256, empreinte du certificat) ; la prochaine
construction du site les copie dans `docs/app/`, hors du manifeste hors ligne.

**Mise à jour** : augmenter `--code` à chaque nouvelle version, sinon Android refuse d'installer
par-dessus.

## La clé de signature — à garder

`tools/android/cle/wiki-sst-mines.p12` et son mot de passe (`cle/mot-de-passe.txt`, ou la
variable `WIKI_APK_MDP`) ne sont **pas** dans Git (`.gitignore`). Une mise à jour doit être signée
avec la **même** clé : sans elle, il faudra désinstaller l'application (et retélécharger le
hors-ligne) avant d'installer la nouvelle. Si le dossier est absent, `construire_apk.mjs` crée une
nouvelle clé.

Empreinte SHA-256 du certificat de la version 1.0 :
`24:EE:68:12:94:46:A5:EF:34:D2:77:1B:0B:A4:57:80:00:90:79:FB:11:5A:D7:C5:4D:FC:C5:B5:5E:98:ED:F7`

## Vérifications

- `apksig` : signature v2 vérifiée à chaque construction.
- `tools/tests/android.test.mjs` : manifeste et table relus par un décodeur indépendant du codeur
  (attributs triés par identifiant, types de valeurs, en-têtes aux tailles du format), archive
  alignée, APK publié identique à sa construction et absent du cache hors ligne.
- Relu par androguard (paquet, activité de lancement, permissions, icône résolue en xxxhdpi,
  classes Dalvik, signature v2) ; règle de routage des liens exécutée sur la JVM avec les vraies
  classes Android.
- **Non essayé sur un appareil réel** : si l'installation échoue, noter le message exact.
