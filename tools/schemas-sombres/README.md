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

Lancée sans `--ecrire`, la commande fait un essai. Avec `--ecrire`, elle pose le schéma dans la page, copie les SVG
et écrit le lot du vault. Le fichier d'une version remplacée quitte le site quand plus aucune page ne l'affiche et
qu'aucun autre lot ne le fournit.

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

## Affichage

La classe `infographie-sombre`, posée par l'option `sombre`, exclut ces affiches de l'inversion du thème sombre.
Sur tablette, elles s'affichent jusqu'à 40 rem de large (`tools/style.css`).
