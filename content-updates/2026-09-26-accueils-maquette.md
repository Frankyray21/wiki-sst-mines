# Accueils des wikis selon la maquette de Frank — 26 et 27 septembre 2026

Demande de Frank : reproduire, en HTML/CSS/JS et avec les composants du projet, la maquette d'accueil
« Wiki Ergonomie, mines » (image de référence), d'abord pour le téléphone, sans rien perdre du contenu ni des
fonctions, et sans casser les autres pages.

## Ce que montre la page

- **En-tête** : menu, « WIKI SST » avec « SST » en bleu d'accent, favoris, aide, thème ; boutons carrés à bordure
  discrète ; recherche pleine largeur, arrondie, sur un fond un peu plus clair que la page.
- **Fil d'Ariane** : maison, « › », Portail, « / », page courante en bleu d'accent.
- **Carte d'entrée** : pictogramme du wiki sur une tuile arrondie ; titre ; la première phrase du chapeau en
  sous-titre, le reste en description ; « 66 articles » avec un pictogramme de livre ; Lecture en bouton
  principal bleu, PDF en bouton secondaire, sur la même ligne que le compte. A− et A+ ne sont plus dans la
  carte : ils passent dans le menu latéral, sous « Taille du texte » (même boutons, même réglage).
- **Démarrage rapide par rôle**, avant les thèmes comme dans la maquette : pictogramme, sous-titre « Accédez
  rapidement aux contenus pertinents pour votre rôle. », tuiles à chevron en 2 × 2 dès 341 px (libellé sur deux
  lignes au besoin, hauteur égale), quatre par rangée sur ordinateur ; toute la tuile est le lien.
- **Thèmes** : pictogramme, lien « Explorer tous les thèmes » à droite sur la même ligne (sous le titre en
  dessous de 375 px), puis une ligne par thème — pictogramme teinté, titre, compte aligné à droite, chevron.
  Chaque ligne reste le volet du 13 septembre : un toucher l'ouvre sur ses notions et sa description (au
  téléphone), le titre mène à la page du thème. Plus de barre colorée à gauche.
- **Cartes secondaires** (articles internes, travailleurs, gestionnaires) : une ligne compacte — petit
  pictogramme, titre (15,5 px) et sous-titre (« Outils, méthodes et références pour les professionnels. », « Des
  explications simples et concrètes pour le terrain. », « Programmes et décisions pour l'encadrement. »), nombre
  de pages, chevron ; repliées, entières à l'ouverture.
- **Index du wiki** (« Index alphabétique · Catégories », « Études et rapports », « Index par loi ») : ligne
  discrète sous les boîtes, avant le pied ; elle ne coupe plus la page entre la carte et les thèmes. Les mêmes
  liens sont dans le menu latéral.
- **Pied** : « Site généré le … » à gauche, « WIKI SST — Mines » à droite ; le pied commun du site ne se répète
  pas sous un accueil.

Les six accueils de wiki, l'accueil du Recueil et les cinq accueils de l'encadrement (et leurs copies `g/`)
reçoivent le même habillage. Les pictogrammes de thèmes suivent le titre du thème (36 thèmes reconnus, repli
sur une étiquette) et leur teinte suit leur position (rose, bleu, vert, violet, ambre, turquoise).

## Passe de correction du 27 septembre (comparaison à la maquette, capture à 390 px)

Frank a comparé la maquette et le premier rendu ; corrections, dans l'ordre demandé :

1. **Ordre** : carte, démarrage rapide, thèmes, cartes secondaires (`ordonnerBoites`, dans le générateur : la note
   met les thèmes en premier, la boîte de démarrage est avancée juste devant eux).
2. **Largeur** : aucune contrainte héritée n'a été trouvée (`.layout` est borné à 1440 px pour l'ordinateur
   seulement ; `.content` a 16 px de marge au téléphone ; la règle `max-width: 80ch` ne joue qu'au-dessus de
   700 px et pas sur la grille d'accueil). La compression venait des marges internes des cartes, de la colonne
   du pictogramme et des tailles de police. Au téléphone, un accueil passe à 14 px de marge (`.content`) et les
   cartes à 14 px de marge intérieure.
3. **Carte principale** : le titre (21 à 24 px selon la largeur, `clamp`) est à côté du pictogramme (64 px) et
   tient sur une ligne dès 375 px ; le chapeau prend toute la largeur de la carte ; sous-titre 15,5 px, description
   13,5 px en couleur douce ; « 66 articles | Lecture PDF » sur une ligne, séparateur court. Sous 375 px, les
   boutons passent sous le compte.
4. **A− et A+** retirés de la carte, déplacés dans le menu (`app.js`, groupe « Taille du texte »).
5. **Ligne d'index** déplacée sous les boîtes.
6. **Tuiles** en 2 × 2 à 360, 375, 390 et 412 px (`repeat(2, minmax(0, 1fr))`, `grid-auto-rows: 1fr`, libellé
   de 12,5 à 14 px) ; une colonne seulement sous 341 px, et pour les tuiles à description (Recueil) sous 600 px.
7. **En-tête « Thèmes »** en flex (`min-width: 0` sur le titre, lien qui ne rétrécit pas) : plus de collision.
8. **Lignes de thèmes** : compte et chevron alignés, 50 px de haut, 6 px d'écart ; « Anatomie et biomécanique »
   tient sur une ligne dès 390 px.
9. **Cartes secondaires** : 97 px à 390 px (titre et sous-titre sur deux lignes chacun), au lieu de 190 px.
10. **Densité** : page Ergonomie de 1 932 px à 1 416 px de haut à 390 px ; cibles tactiles de 44 px et plus.

Mesuré dans Chromium (Liberation Sans, un peu plus large que Roboto : ce qui tient ici tient sur Android) :

| Largeur | Titre | Tuiles (lignes max) | Thèmes sur une ligne | Lien « Explorer » | Cartes secondaires |
| --- | --- | --- | --- | --- | --- |
| 360 px | 2 lignes | 2 × 2, 2 lignes | 4 sur 5 | sous le titre | 114 et 97 px |
| 375 px | 1 ligne | 2 × 2, 2 lignes | 4 sur 5 | à droite | 97 px |
| 390 px | 1 ligne | 2 × 2, 2 lignes | 5 sur 5 | à droite | 97 px |
| 412 px | 1 ligne | 2 × 2, 2 lignes | 5 sur 5 | à droite | 97 px |

Aucun débordement horizontal à 320, 360, 375, 390, 412, 768, 1024 et 1280 px.

## Validation visuelle finale (capture à 390 × 844 px face à la maquette)

Comparaison élément par élément, couleurs échantillonnées sur la maquette (fond `#0b151f`, cartes `#132233`,
lignes de thèmes `#101b27`, tuiles `#17293c`, bordures `#1e3249` et `#364c64`, bouton Lecture `#327bcf`,
texte doux `#b6c2d1`, teintes des pictogrammes), puis troisième passe :

- **Pictogrammes noirs** : aucune règle `fill` n'existait, un `<path>` MDI se remplissait en noir — sur les
  pages publiées le 27 septembre aussi. Règle `.ic { fill: currentColor }` ajoutée, testée ; les pictogrammes
  prennent enfin leur teinte (rose, bleu, vert, violet, ambre) et l'accent.
- **Palette sombre** alignée sur la maquette (jetons ci-dessous) ; bouton Lecture en `#2d6fc4` (5,0:1 sur
  blanc, la maquette est à 4,3:1) ; nouveaux jetons `--bg-surface-creux` (lignes de thèmes, plus sombres que
  la carte, comme la maquette) et `--bg-entete`.
- **En-tête** : « WIKI SST » à 18–22 px au téléphone, menu en icône nue, boutons plus sombres que l'en-tête,
  recherche sur une surface plus claire. **Fil d'Ariane** : seuls le dernier maillon est en accent.
- **Pictogrammes d'en-tête de section et de ligne de thème** nus (sans tuile), 25 à 28 px ; ceux des cartes
  repliées gardent leur tuile, comme la maquette.
- **Tuiles par rôle** : l'emoji de la note choisit un pictogramme MDI teinté (`pictoTuile` — casque ambre,
  cravate bleue, cœur vert, immeuble bleu ; le rôle nommé dans le libellé sert de repli, un emoji inconnu reste
  affiché) ; libellé en blanc ; toute la tuile est le lien.
- **Boutons Lecture et PDF** : pictogrammes MDI (livre ouvert, document) à la place des emojis, sur les
  accueils seulement (`app.js`). « 66 » en blanc, « articles » en accent.
- **Pied** sans filet, en texte doux.

## Ce qui est conservé

- Tout le contenu des notes d'accueil : chapeau, boîtes, listes, liens. Les boîtes repliées de la veille
  restent repliées ; ouvertes, elles sont entières.
- Toutes les fonctions : menu, recherche et suggestions, favoris, aide, thème clair ou sombre, A− et A+ (dans le
  menu), mode Lecture, PDF, volets de thèmes (fermés au téléphone par `app.js`), index, catégories, espace
  encadrement. La visite guidée dit, sur un accueil, où sont A− et A+.
- Le domaine (« Page d'accueil du wiki Ergonomie ») reste dans la page pour les lecteurs d'écran ; à l'écran,
  la carte montre le nombre d'articles.
- Le thème clair, avec ses propres surfaces et teintes (contrastes vérifiés à l'œil sur capture).

## Jetons de style

Le site avait déjà ses variables ; la maquette en ajoute quelques-unes, en clair et dans les deux blocs
sombres (`tools/style.css`) : `--bg-surface`, `--bg-surface-2`, `--bg-surface-hover`, `--accent-ui`,
`--accent-ui-hover`, `--accent-ui-text`, `--teinte-rose` à `--teinte-turquoise`, `--rayon`, `--rayon-petit`,
`--ombre-legere`, `--bg-surface-creux`, `--bg-entete`. La palette sombre passe du gris neutre au bleu-noir de la
maquette, échantillonné sur l'image (`--bg #0b151f`, `--content-bg #0c1620`, surfaces `#132233` / `#17293c`,
bordures `#1e3249` / `#364c64`, texte `#f2f6fa` / `#b6c2d1`, accent `#2d6fc4` et `#7cc0ff`), sur tout le site.

## Fichiers

- `tools/accueil_wiki.mjs` : `rendreAccueil` (carte d'entrée, chapeau scindé par `scinderChapeau`, boîtes dans
  l'ordre de `ordonnerBoites`, ligne d'index sous la grille, sans « Tous les thèmes »), `rendreBoite` (en-tête à
  pictogramme, sous-titre, lien, carte repliée), `rendreThemesAccueil` (lignes de thèmes), `iconeTheme`,
  `genreBoite`, `estDemarrage`, `icone` ; `tuile` met l'emoji dans un élément hors lecture d'écran.
- `tools/build_site.mjs` : `contenuAccueil` fournit les thèmes en données ; `pageShell` pose « SST » dans sa
  balise.
- `tools/app.js` : pose la balise « SST » sur une page publiée avant le générateur ; sur un accueil, déplace A− et
  A+ dans le menu et adapte la visite guidée.
- `tools/style.css` : jetons, en-tête, recherche, fil d'Ariane, section des accueils (en-têtes en flex, tuiles,
  lignes, cartes repliées, réglages de taille du menu), blocs téléphone (900, 374 et 340 px), tablette et
  impression.
- `tools/schemas-sombres/icones.json` : 30 pictogrammes MDI de plus (même licence), utilisés par l'interface.
- Les 17 pages d'accueil publiées, reposées avec les fonctions du générateur ; `docs/assets/style.css`,
  `app.js`, manifeste hors ligne.
- Tests : `tools/tests/accueil-wiki.test.mjs` (rendu, chapeau, pictogrammes, volets, ordre des boîtes, index,
  feuille de style, `app.js`, site publié), `tools/tests/theme.test.mjs` (palette sombre).

## Écarts avec la maquette

- Le pictogramme de la carte d'entrée est l'emoji du wiki (🦺) sur sa tuile, pas l'illustration veste et
  casque de la maquette : chaque wiki a le sien, et l'emoji est déjà celui du site.
- La ligne « Index alphabétique · Catégories » (et « Études et rapports » en SST psychosociale) reste dans la
  page, discrète, sous les boîtes : la maquette ne la montre pas.
- Les lignes de thèmes sont des volets (elles s'ouvrent sur les notions), pas de simples liens : c'est le choix
  du 13 septembre, gardé. Le chevron tourne à l'ouverture.
- Au téléphone, le chapeau passe sous le pictogramme et le titre, sur toute la largeur de la carte ; la maquette
  le garde dans la colonne du titre, ce qui, à 390 px et avec des polices lisibles, coupait chaque ligne.
- Les libellés de rôles tiennent sur deux lignes (« Superviseur, / contremaître »), comme sur la capture de la
  maquette au téléphone ; les titres des cartes secondaires aussi, à 390 px.
- Les pictogrammes des rôles sont choisis d'après l'emoji de la note (casque, cravate, cœur, immeuble) : quatre
  pictogrammes MDI teintés, proches de ceux de la maquette sans être les mêmes dessins.
- Les tailles de texte (21–24 px, 15,5 px, 13,5 px) sont plus grandes, relativement à la largeur, que sur la
  maquette, qui est dessinée pour un écran plus large : d'où le sous-titre sur trois lignes et la description
  sur quatre à 390 px, contre deux et trois sur l'image. Les descendre sous 13 px nuirait à la lecture.
- Sur ordinateur, les volets s'ouvrent et coulent en colonnes, comme avant ; la maquette ne montre que le
  téléphone.

## Vérifications

- Captures Chromium à 320, 360, 375, 390, 412, 768 et 1280 px, en sombre et en clair, sur Ergonomie, SST
  psychosociale, le Recueil et un accueil de l'encadrement : aucun débordement horizontal, aucun texte coupé,
  tuiles de 48 px, lignes de 50 px.
- `verif_rendu` : 85 rendus (17 accueils × 5 modes, tactile compris), aucun défaut, après la passe de correction.
- Le vrai générateur, sur un vault d'essai, produit exactement (contenu de `<main>`) ce que le script de
  repose produit à partir de l'ancienne page : générateur et site publié disent la même chose.
- Page d'article (Foreur) et portail regardés à 390 px : en-tête, fil d'Ariane et palette en place, rien de
  cassé.
- Tests : 300 réussis sur 301 (dont le `fill` des pictogrammes, `pictoTuile`, le compte). Le seul échec,
  `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur), `verif_publication` ; manifeste hors ligne régénéré.
