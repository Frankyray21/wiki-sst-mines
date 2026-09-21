# Tablette de chantier, thème sombre par défaut, relais des avis durci — 21 septembre 2026

Trois lots d'un même mouvement : le wiki se lit désormais sur la tablette du terrain, dans le noir,
et le dispositif d'avis a été repris après une relecture adversariale.

## 1. Thème sombre par défaut

Le wiki s'affiche en sombre sans que personne n'ait à le régler. La raison est le terrain : la
lecture se fait sous terre, de nuit, et la tablette de chantier arrive réglée en clair d'usine —
suivre l'appareil revenait à éblouir tout le monde par défaut.

Le bouton de l'entête garde trois états, dans cet ordre : **sombre** (par défaut), **clair**,
**automatique** (suit l'appareil). Le choix est retenu d'une page à l'autre. Sans mémoire
disponible (navigation privée, stockage bloqué), c'est le sombre qui s'applique.

Mise en œuvre : la palette claire reste celle de `:root`, les deux blocs sombres passent sous
`@media screen` — l'un sans attribut (le défaut), l'autre pour `data-theme="auto"` avec la
préférence système. Conséquence utile : **une page imprimée sort toujours en noir sur blanc**,
puisque aucun bloc sombre ne s'applique hors écran. Ce n'était pas le cas avant : un lecteur qui
avait choisi le thème sombre imprimait du blanc sur noir.

Vérifié dans Chromium : sans réglage et appareil en clair → fond `#16181d` ; choix clair → fond
clair ; choix automatique → suit l'appareil dans les deux sens ; impression → fond blanc, texte
noir ; le bouton fait bien le tour des trois états.

## 2. Galaxy Tab Active4 Pro

1 920 × 1 200 à densité 1,5, soit **1 280 × 800 px CSS en paysage** et **800 × 1 280 en portrait**,
tenue avec des gants. Deux manques mesurés :

- en paysage, la page fait plus de 900 px : **aucune règle « téléphone » ne s'appliquait**. Les
  boutons de l'entête mesuraient 38 px, le champ de recherche 32 px, les liens de la barre latérale
  33 px, les liens de liste 15 à 22 px ;
- la ligne de texte atteignait **130 caractères** à 1 280 px.

Corrections, dans `tools/style.css` et `tools/portail.css` :

- les cibles grandissent sur `@media (pointer: coarse)`, donc **à toute largeur** dès que le doigt
  sert de pointeur : 44 px pour les commandes isolées (boutons, recherche, sommaire repliable,
  pastilles de thèmes), 36 à 40 px pour les listes et la barre latérale, et une zone d'au moins
  24 px pour les liens dans le texte, les tableaux et l'infobox (WCAG 2.5.8 AA — un lien de phrase
  ne peut pas faire 44 px sans disloquer le paragraphe) ;
- le texte courant passe de 15 à **16 px** sur écran tactile, sans toucher aux réglages A− / A+ ;
- la colonne de lecture se borne à **80 caractères** au-delà de 900 px ; tableaux, images, blocs de
  code et infobox gardent toute la largeur ;
- en portrait (800 px), les volets de thèmes passent de trois colonnes serrées à **deux**.

`tools/verif_rendu.mjs` compte maintenant cinq modes — téléphone clair et sombre, tablette paysage,
tablette portrait, bureau — et échoue sur toute cible tactile sous 24 px. Les 17 pages d'accueil et
les autres familles de pages (portail, encadrement, article, thème, études, recueil, recherche,
catégories, 404, qualité) passent les cinq modes sans défaut.

Au passage : le tableau du tableau de bord « qualité » poussait la page à 557 px sur un écran de
390 px. Il défile maintenant dans son cadre, comme les tableaux des articles.

## 3. Avis des lecteurs : ce que la relecture adversariale a trouvé

Cinq relecteurs indépendants (relais, script hors ligne, générateur, modèle Airtable, rendu réel)
ont produit 22 constats. Ceux qui tenaient à la vérification sont corrigés.

**Générateur** — deux défauts qui n'apparaissaient qu'à la prochaine construction :

- `docs/` est vidé à chaque construction. L'adresse du relais, écrite à la main dans
  `docs/assets/avis.json` (la seule étape qui reste à faire sur votre poste), était donc **effacée
  à chaque reconstruction** : le bloc d'avis se serait éteint sans prévenir. Elle est maintenant
  relue avant le nettoyage et réécrite en fin de construction ;
- les accueils copiés dans l'espace encadrement auraient porté l'adresse et le nom du wiki
  d'origine (`w/hygiene/…`, « Hygiène industrielle ») au lieu des leurs (`g/w/hygiene/…`, « Espace
  encadrement ») : l'avis aurait désigné une autre page que celle lue.

**Relais Cloudflare** :

- **débit borné** par adresse IP (liaison Cloudflare, 20 avis par minute) : l'adresse du relais est
  publique, l'en-tête `Origin` se forge, et la base Formations est partagée avec les tables
  d'attestations et de retours de quiz — une inondation aurait consommé la limite d'Airtable pour
  tout le monde ;
- **rien n'est ouvert par défaut** : sans variable `ORIGINES`, le relais refuse (503) au lieu
  d'accepter toutes les origines ; une origine écrite avec une barre finale ou un chemin
  (`https://frankyray21.github.io/wiki-sst-mines`) est maintenant comprise ;
- un **refus définitif** (jeton, table, valeur refusée, adresse ou référence invalide) ne se
  déguise plus en panne : le navigateur jette l'avis au lieu de le rejouer à chaque page en
  affichant « Pas de réseau » à quelqu'un qui a le réseau ;
- la **`Réf`** doit être exactement « lecteur · adresse de la page », l'adresse doit avoir la forme
  d'une page du site, le corps est borné à 8 Ko et doit être un objet : plus rien d'arbitraire
  n'entre dans la formule Airtable ni dans l'isolat ;
- la **date** est le jour au Québec (`America/Toronto`) et non le jour UTC — un avis donné à 21 h
  n'est plus daté du lendemain — et une mise à jour ne la réécrit plus : elle reste celle du
  premier avis ;
- le **commentaire garde ses paragraphes** (le champ Airtable est multiligne ; les retours à la
  ligne étaient aplatis en une espace).

**Script du navigateur** :

- les envois d'une page sont **sérialisés** : une double tape sur le pouce ne crée plus deux lignes ;
- l'identifiant de lecteur est **gardé en mémoire** : sans `localStorage` (cookies bloqués), le
  commentaire portait une référence différente du pouce, donc deux lignes au lieu d'une ;
- la file d'attente se vide **depuis n'importe quelle page**, bloc ou non, et un avis donné pendant
  le renvoi n'écrase plus le précédent (ordre corrigé) ;
- le bouton « Envoyer » **redevient actif** après l'envoi : une correction tapée ensuite peut partir ;
- l'écouteur « retour du réseau » est posé même si la configuration n'a pas pu être lue.

Vérifié de bout en bout dans Chromium : bloc invisible sans relais ; pouce envoyé aussitôt ;
commentaire sur la même `Réf` ; relais en panne → file locale puis renvoi ; file vidée depuis une
page sans bloc ; refus définitif → rien en file et message explicite ; double tape → un seul envoi
à la fois.

## Seconde relecture adversariale, sur ce lot même

Six relecteurs (thème, tablette, relais, script, générateur, état publié) ont rendu 46 constats,
tous contrôlés par mesure ou exécution. Ce qui tenait a été corrigé :

- **Portail de l'encadrement** : `portail.css` ne déclarait pas `color-scheme`, si bien que le
  « ? » de l'aide (bouton sans couleur propre) était dessiné en noir sur le fond sombre — invisible
  (1,17:1). Corrigé, avec une couleur explicite sur le bouton. Les bulles de la visite guidée et
  des panneaux hors ligne lisaient les variables du wiki, absentes du portail, et retombaient sur
  des replis clairs : le portail les fournit désormais. Le bouton « Rechercher » et la pastille de
  profil passaient à 2,5:1 en sombre (blanc sur bleu éclairci) : ils gardent le bleu plein (5,17:1).
- **Réglages tablette** : `.accueil-index a` en bloc empilait les trois liens de l'index des
  accueils et orphelinait leurs séparateurs (mesuré à 390, 800 et 1 280 px) — ramené en ligne ;
  la borne de 80 caractères oubliait le texte officiel des articles de loi (2 896 pages, jusqu'à
  159 caractères à 1 440 px) et les 198 pages sans `.page-body` — couverts, dès 700 px ; les
  liens dans les titres n'étaient pas agrandis ; les pastilles « Recherches populaires » du
  portail sont des boutons, pas des liens (sélecteur mort) ; les règles tactiles écrasaient sur
  téléphone deux réglages choisis exprès (barre latérale 11 px, sommaire 6 px) — mêmes valeurs
  maintenant ; les champs du formulaire d'avis n'étaient pas agrandis ; les blocs tactiles
  s'appliquaient à l'impression ; le séparateur du fil d'Ariane était à 2,1:1.
- **Relais** : la liaison de débit n'était pas protégée (une exception donnait un 500 sans CORS) ;
  `Origin: http://localhost` était admis d'office, en production aussi — l'en-tête se forge, c'était
  un contournement complet de `ORIGINES` ; la clé de débit IPv6 était l'adresse complète (2^64 clés
  par abonné) — préfixe /64 ; le `lien` n'était pas validé alors que le champ Airtable est de type
  URL (une ligne entière aurait été refusée) ; la borne du corps ne bornait rien (`Content-Length`
  facultatif) — lecture par morceaux, coupée à 8 Ko ; `Access-Control-Allow-Origin: null` n'est pas
  neutre — omis, et un refus renvoie l'origine du demandeur pour que le navigateur lise
  `definitif` ; repli sur le jour UTC si les données de fuseau manquaient.
- **Script** : la file était vidée de la mémoire avant l'envoi (une page fermée au milieu perdait
  tout) — chaque avis n'en sort qu'une fois parti ou refusé ; le renvoi de la file partait en
  parallèle d'un envoi en cours ; aucun délai de garde — un relais qui accepte la connexion sans
  répondre bloquait tout pour toujours, bouton compris — 15 s par envoi ; le script lit désormais
  le `definitif` du relais au lieu de deviner par le statut ; un stockage bloqué n'annonce plus
  « votre avis partira » ; `avis.json` est relu en revalidant le cache HTTP.
- **Générateur** : l'adresse du relais était réécrite en fin de construction — un arrêt en route
  (cible morte du portail) la perdait pour la construction suivante ; réécrite dès que `docs/`
  existe à nouveau, toutes clés conservées, adresse contrôlée (https), avertissement explicite si
  le fichier manque. Les tests qui prétendaient garder cet invariant étaient des tautologies :
  remplacés par des tests de comportement sur un dossier temporaire, plus un test d'identité
  `tools/` ↔ `docs/assets/` et des cas de relais (localhost, liaison cassée, IPv6, horloge figée
  à 21 h 45 pour la date, corps en flux).

Écartés : la date de `version.json` (13 septembre) est celle de la dernière construction depuis le
vault, ce qui est exact — ces lots ne reconstruisent pas le contenu ; les 46 titres qui commencent
par un emoji viennent des notes elles-mêmes ; les pages de graphe qui ne redessinent pas leurs
couleurs au changement de thème sont un défaut antérieur, noté pour plus tard.

## Vérifications

- 138 tests (`npm --prefix tools test`), dont 10 pour le thème et 11 pour le relais ;
- `verif_site`, `verif_liens` (245 385 liens, 0 erreur), `verif_publication --staged` ;
- `verif_rendu` : 17 accueils × 5 modes + 12 autres pages × 5 modes, 0 défaut ;
- dans Chromium : thème (défaut, clair, auto, impression, tour du bouton), avis de bout en bout
  (sans relais, pouce, commentaire, panne et renvoi, page sans bloc, refus définitif, double tape,
  relais qui ne répond jamais → délai, file et bouton rendus).

Reste ouvert, sans rapport avec ce lot : `tools/tests/textes-loi.test.mjs` échoue encore sur
11 pages d'article de loi sans texte extrait (voir la note du 14 septembre).
