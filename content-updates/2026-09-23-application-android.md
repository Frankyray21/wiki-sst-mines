# Application Android — 23 septembre 2026

Demande : « Crée version apk aussi ».

## Ce qui est livré

- `docs/app/wiki-sst-mines.apk` (8 Ko, version 1.0, code 1), téléchargeable depuis le lien
  **📱 Application Android** au pied du portail et de l'espace encadrement.
- Paquet `io.github.frankyray21.wikisstmines`, Android 7.0 et plus, cible API 34, signature v2.
- L'application ouvre le site publié en plein écran, fond sombre dès le démarrage, icône du wiki.
  Le contenu n'est pas embarqué : rien à republier quand le wiki change. Le hors-ligne est celui
  du site (« ⬇️ Télécharger hors ligne »), dans le cache propre à l'application. Première
  ouverture sans réseau : une page locale l'explique. Liens externes, PDF et téléchargements
  s'ouvrent dans le navigateur. Dans l'application, le lien vers l'APK se masque.
- L'APK est exclu du manifeste hors ligne : il n'est pas téléchargé dans le cache de chaque
  lecteur.

## Comment il est construit

`tools/android/construire_apk.mjs`. Les outils officiels d'Android (SDK, `aapt2`) viennent de
`dl.google.com`, injoignable depuis l'environnement de travail ; les dépendances sont donc prises
sur Maven Central (empreintes vérifiées) — `dalvik-dx`, `apksig` 2.3.0, `android-all` de
Robolectric pour compiler contre le vrai cadre Android — et les trois formats binaires (manifeste
compilé, `resources.arsc`, archive alignée) sont écrits par `tools/android/binaire.mjs`.

## Vérifications

- Signature v2 vérifiée par `apksig` ; relecture complète par androguard (paquet, activité de
  lancement, permissions, icône résolue, classes Dalvik) ; règle de routage des liens exécutée
  sur la JVM avec les vraies classes Android (11 cas) ; 4 tests dont un décodeur indépendant du
  codeur.
- Dans Chromium : le lien du portail télécharge `wiki-sst-mines.apk` ; avec l'agent utilisateur
  de l'application, le lien se masque.
- 150 tests (1 échec connu et antérieur : textes-loi), `verif_site`, `verif_liens` (0 erreur),
  `verif_publication --staged`.
- **Non essayé sur un appareil réel.**

## À garder hors Git

La clé de signature (`tools/android/cle/`) a été remise à Frank à part. Une mise à jour de
l'application doit être signée avec elle.
