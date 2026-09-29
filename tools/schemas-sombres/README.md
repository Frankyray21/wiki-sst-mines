# Schémas sur fond sombre (style de Frank, 26 septembre 2026)

Le gabarit des affiches au style de l'infographie « CNESST — comprendre les 3 volets » de Frank. Ce style a été
retenu le 26 septembre 2026 pour les nouveaux schémas. Il comprend :

- un fond marine ;
- un titre blanc centré, et sous lui la légende des couleurs employées ;
- des cartes à pictogrammes blancs ;
- des sections encadrées de bleu-gris, avec médaillon rond ;
- des sous-cartes à puces ;
- un bandeau « Repère rapide ».

Le même jour, Frank a demandé « pas trop de couleur, une raison pour chaque couleur » : les cadres verts, bleus et
orange de la référence sont devenus neutres (lot 10, version 3).

## Fichiers

- `gabarit.py` : le gabarit. Chaque schéma se décrit par un dictionnaire : titre, sous-titre, cartes, sections,
  colonnes, éléments et repère. Le gabarit :
  - mesure le texte en Figtree ;
  - place les éléments ;
  - incorpore la police réduite aux caractères employés ;
  - rend un SVG de 480 de large, identique d'une fois à l'autre.
- `lot10.py` : les douze schémas du lot 10 (version 3). Il écrit, par page, les SVG et un `spec.json` pour
  `tools/poser_schemas.mjs`, avec `"sombre": true` et les versions antérieures à remplacer (`remplaceSchema`). Le
  texte alternatif et la description du SVG (`<desc>`) sont tirés de la mise en page, légende des couleurs comprise.
  Il n'y a plus de version texte dépliable (« Lire le schéma en texte ») sous le schéma : elle a été retirée du
  site le 26 septembre 2026.
  Un schéma corrigé après publication prend un numéro de version (`version=4`) : son fichier s'appelle `…-v4.svg`
  et remplace toutes les versions antérieures, dans la page comme dans le vault. Le 27 septembre 2026, c'est le cas
  des leviers de l'Aide-foreur (formation des foreurs au leadership au niveau primaire) et de Confinement (les salles
  de refuge ne sont pas des zones de pause).
- `grille_inspq.py` : le schéma « Grille INSPQ : 12 indicateurs » (27 septembre 2026), sur les mêmes règles ; les
  indicateurs y sont des éléments neutres (points gris).
- `diagrammes.py` (29 septembre 2026) : une boîte à outils pour redessiner les figures des captures de cours, que le
  gabarit ne sait pas tracer : pyramides, arêtes de poisson, barrières, logigrammes, escaliers d'étapes. Même
  police, même largeur (480) et mêmes règles de fond que le gabarit. Le fond est le noir du wiki (#16181d), choisi
  par Frank le 29 septembre 2026 ; le gabarit garde son fond marine. On y trouve :
  - la palette (les jetons du thème sombre de `tools/style.css`, plus trois teintes à justifier) ;
  - des formes (cartes, polygones, traits, flèches) ;
  - le texte coupé à la largeur, avec exposants (`t_riche`, `10^{–5}`) ;
  - l'en-tête, la légende des couleurs et le bandeau « repère ».
- `securite.py` : le pilote du bloc 3, soit dix schémas du wiki Sécurité industrielle sur trois pages (Accidents et
  incidents, théorie causale ; Hiérarchie des moyens de prévention ; Appréciation du risque, méthodes). Chaque
  schéma dit où il se pose : `remplace` (la capture de cours qui montre la même chose ; sans ancre, il prend sa
  place exacte), `ancre` (le texte après lequel il se pose). Le script écrit, par page, les SVG et un `spec.json`.
- `figtree-500.woff2` à `figtree-900.woff2` : la police Figtree (`LICENCE-figtree.txt`, SIL Open Font License 1.1).
- `icones.json` : un extrait de Material Design Icons (`@mdi/js`), avec sa licence dans `LICENCE-icones.txt`
  (Pictogrammers Free License, Apache 2.0). Pour ajouter une icône : `npm pack @mdi/js`, puis copier son tracé
  sous son nom (`mdiXxx`).

## Produire et poser

Il faut Python 3 et fontTools : `pip install fonttools brotli`.

```
SORTIE=/tmp/lot10v3 python3 tools/schemas-sombres/lot10.py
node tools/poser_schemas.mjs --spec /tmp/lot10v3/<page>/spec.json --medias /tmp/lot10v3/<page> --lot content-updates/<date>-<page>-schemas.json
node tools/poser_schemas.mjs … --ecrire
```

Même chose pour le pilote Sécurité : `SORTIE=/tmp/securite python3 tools/schemas-sombres/securite.py`, puis
`--spec /tmp/securite/<page>/spec.json --medias /tmp/securite/<page>`.

Lancée sans `--ecrire`, la commande fait un essai. Avec `--ecrire`, elle pose le schéma dans la page, copie les SVG
et écrit le lot du vault. Le fichier d'une version remplacée quitte le site quand plus aucune page ne l'affiche et
qu'aucun autre lot ne le fournit. Il en va de même, depuis le 29 septembre 2026, pour la capture de cours qu'un
schéma remplace : le générateur ne copie que les fichiers cités, et une reconstruction ne la recopierait pas. Une
capture qu'une autre page affiche encore reste en place.

## Règles de fond (wiki SST psychosociale)

- Chaque mot vient de la page, au plus raccourci. Ni chiffre, ni seuil, ni montant, ni effet absent de la page.
- Les puces ne jugent pas un travailleur :
  - « ! » orange : une condition de travail qui pèse (libellé ajustable par `legende_couleurs`, par exemple
    « un coût ») ;
  - coche verte : un levier de l'organisation ;
  - point gris : un élément neutre, sans légende ;
  - pictogramme blanc : un fait ou une particularité, sans jugement ;
  - jamais de ✗.
- Couleurs (retour de Frank : « une raison pour chaque couleur ») :
  - la structure (cadres, entêtes, médaillons, titres de colonne) reste en bleu-gris neutre ;
  - seules les puces portent de la couleur ;
  - chaque couleur employée est nommée dans la légende sous le titre (`genres_legende`, même règle pour le dessin,
    le texte alternatif et la description du SVG) ;
  - une seule couleur par schéma, autant que possible.

## Règles de fond des captures redessinées (pilote Sécurité, 29 septembre 2026)

- Le schéma suit le texte de la page, pas la capture. Quand la capture en montrait plus que la page n'en dit
  (des barrières nommées autrement, d'autres rubriques, des étapes absentes du texte), ce surplus n'est pas repris.
- La structure reste neutre (gris du thème). Une couleur ne marque qu'une chose, nommée dans la légende sous le
  titre : l'ambre marque le danger jusqu'à l'accident (Reason) et l'événement redouté (nœud papillon). Les trois
  zones ALARP portent chacune leur couleur, avec leur nom écrit sur la bande.
- Rien d'inventé : pas de chiffre, de seuil ni de table de combinaison que la page ne donne pas. La légende sous
  l'image dit ce qui est de principe (le nombre de trous, de causes, la largeur des bandes).

## Affichage

La classe `infographie-sombre`, posée par l'option `sombre`, exclut ces affiches de l'inversion du thème sombre.
Sur tablette, elles s'affichent jusqu'à 40 rem de large (`tools/style.css`).
