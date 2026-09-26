# Pages d'accueil des wikis allégées — 26 septembre 2026

Demande de Frank : « Améliore la page d'accueil Ergonomie, RPS, etc. »

## Ce qui pesait

Regardées au téléphone et sur ordinateur, les six pages d'accueil de wiki répétaient ce qu'elles venaient de
montrer :
- sous les volets de thèmes, les boîtes par public (« Articles internes », « Articles travailleurs », « Articles
  gestionnaires ») listaient les mêmes articles, souvent regroupés par les mêmes thèmes. Ergonomie : 33 liens sur
  33 déjà dans les volets ; SST psychosociale : 26 sur 26 ; Toxicologie : 26 sur 29 ;
- les tuiles « Démarrage rapide par rôle » portaient une description qui répétait le titre de la boîte
  (« Démarrage rapide - Travailleur » sous « Travailleur, opérateur ») ;
- sur ordinateur, la grille des volets laissait, sous un volet court, tout le vide du plus long de sa rangée
  (SST psychosociale : 16 volets, 167 liens, 5 441 px de haut) ;
- au téléphone, la barre de raccourcis répétait la liste des volets, fermés juste en dessous, et chaque volet
  fermé gardait sa description sur trois lignes.

## Ce qui change

Le contenu des notes d'accueil n'est pas modifié. Il est allégé de ce qui se répète, par une règle unique,
appliquée par le générateur et sur le site publié (`tools/accueil_wiki.mjs`, `epurerAccueil`) :
- **Boîtes repliées** : une boîte dont la moitié des liens ou plus est déjà offerte plus haut (volets de thèmes,
  barre d'index) se rend repliée, titre et nombre de pages sur une ligne ; tout le bandeau ouvre. Ouverte, elle
  est entière. Les thèmes, le démarrage rapide, la navigation et les autres boîtes propres restent ouverts.
- **Tuiles par rôle** : la description qui répète le titre de la boîte est retirée. Une vraie description reste
  (Recueil : « tes droits, tes obligations, tes recours en SST »). Une boîte faite de tuiles occupe toute la
  largeur : une rangée de rôles.
- **Volets de thèmes** : ils coulent en colonnes (plus de vide sous les volets courts) ; fermé, un volet tient
  sur une ligne, sa description ne s'affiche qu'ouvert. Au téléphone, où les volets sont refermés, la barre de
  raccourcis n'est plus affichée.
- **Grille** : les petites boîtes comblent les trous laissés par une demi-boîte isolée.

Hauteur des pages, mesurée dans Chromium :

| Page | Téléphone (390 px) | Ordinateur (1 280 px) |
| --- | --- | --- |
| Ergonomie | 2 769 → 1 462 px | 2 156 → 1 439 px |
| SST psychosociale | 5 120 → 2 388 px | 5 441 → 4 264 px |

Chaque retrait ou repli est signalé à la construction (« accueil … : « Articles internes » repliée (33 de ses 33
liens déjà dans les thèmes ou l’index) »), comme les autres retouches des accueils.

## Pages touchées

Les six accueils de wiki (Droit du travail, Ergonomie, Hygiène, SST psychosociale, Sécurité, Toxicologie) et
l'accueil du Recueil (sa rangée de profils passe sur toute la largeur). Les accueils de l'encadrement et leurs
copies `g/` sont inchangés : sans volets de thèmes, rien ne s'y répète.

## À trancher

- **Toxicologie, boîte « Articles de loi »** : son seul item, « LATMP art. 2, défin », vient d'un wikilink jamais
  fermé dans la note (signalé le 9 septembre). La boîte est maintenant repliée, mais le texte tronqué reste.
- **Hygiène, boîte « Articles gestionnaires »** : le lien « Hub : Pages gestionnaires » mène à l'accueil
  gestionnaires d'Ergonomie, pas à celui d'Hygiène (résolution d'un wikilink homonyme dans la note).
- Les boîtes « Pages-index de sections » (SST psychosociale, Hygiène, Droit) portent un titre qui parle
  d'organisation du vault, pas de contenu ; à renommer dans la note, si tu veux.

## Vérifications

- Les 17 pages d'accueil (12 du fond documentaire, 5 copies de l'encadrement) ont été rejouées par le script de
  repose avec les mêmes fonctions que le générateur ; sans les nouvelles règles, il redonne chaque page octet
  pour octet.
- Le vrai générateur, sur un vault d'essai (un accueil, un thème, des notions, des tuiles), rend l'accueil selon
  les mêmes règles et écrit les lignes de journal attendues.
- `verif_rendu` : 85 rendus (17 pages × 5 modes), aucun défaut ; aucun lien de moins de 24 px au toucher, aucun
  débordement.
- Tests : 297 réussis sur 298. Le seul échec, `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur), `verif_publication` ; manifeste hors ligne régénéré.
