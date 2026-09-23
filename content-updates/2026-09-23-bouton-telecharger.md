# Bouton « Télécharger hors ligne » — 23 septembre 2026

Le wiki se téléchargeait déjà tout seul pour la consultation sans réseau (service worker, tranches
courtes, reprise après coupure), mais rien ne le disait ni ne permettait de le demander : le seul point
d'entrée était l'icône 📶 de l'entête, qui ouvrait un panneau d'état avec un bouton « Vérifier
maintenant » aux moments où la synchronisation s'était arrêtée.

## Ce qui change

- **Un lien « ⬇️ Télécharger hors ligne »** dans la navigation de chaque page (4 267 pages) et au pied
  du portail. Un geste : le téléchargement part s'il n'est pas déjà complet, et le panneau s'ouvre sur
  l'avancement.
- **Dans le panneau, un bouton principal** qui dit ce qu'il reste à prendre — « ⬇️ Télécharger tout le
  wiki (440 Mo) » au repos, texte et médias manquants confondus — puis « Téléchargement en cours… 34 % »
  pendant (désactivé), et qui disparaît quand tout est là. « Vérifier maintenant » reste en bouton
  secondaire pour recontrôler un cache complet.
- **Sans réseau**, le geste est retenu : « Pas de réseau : le téléchargement partira au retour du
  signal », et il repart de lui-même à l'événement `online`. Sans service worker (navigateur ancien,
  site ouvert hors https), un message l'explique au lieu de ne rien faire.
- L'icône 📶 de l'entête s'appelle maintenant « Télécharger pour consultation hors ligne ».
- Les trois boutons du panneau ne sont plus tous peints en bleu : seul « Télécharger » est plein ;
  44 px de haut sur écran tactile.

## Vérifié dans Chromium

Sur le site servi en local (service worker actif) : le lien de la barre latérale ouvre le panneau et
le bouton suit la synchronisation (17 % → 48 % en six secondes) ; hors ligne, le bouton se présente au
repos avec « (440 Mo) », le clic retient la demande, et le retour du réseau relance (« 34 % ») ; le lien
du portail fait de même ; sur `file://` (pas de service worker), le lien ouvre le message d'explication.

146 tests (1 échec connu et antérieur : textes-loi), `verif_site`, `verif_liens` (0 erreur),
`verif_publication --staged`.
