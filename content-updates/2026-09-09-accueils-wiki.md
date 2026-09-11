# Pages d'accueil rendues comme celles d'un vrai wiki — 9 septembre 2026

Les 17 pages d'accueil (les sept accueils de wiki « 00 - 🏠 Accueil … » et les dix sous-accueils
« travailleurs » et « gestionnaires », toutes en `type: accueil`) étaient rendues comme des articles
ordinaires : infobox « Type : accueil », sommaire, sous-titre « Un article du wiki », titres de
section avec leur préfixe de classement (« 15 - Navigation », « 10 - Thèmes »), longues listes de
liens en une colonne et, sur l'accueil SST psychosociale, un paragraphe « !RPS___Virage_stratégique.mp4 »,
un item « [[Gestion » et cinq entrées « (source interne) » qui ne menaient nulle part. Regardées sur
un téléphone, elles ne ressemblaient pas à l'accueil d'un wiki.

## Ce qui change

- Bandeau : icône du wiki, titre de la note sans son emoji de tête, ligne « Page d'accueil du wiki
  🧠 SST psychosociale · 313 pages » (ou « Section « Articles travailleurs » du wiki … · 12 pages »),
  barre A−/A+/Lecture comme ailleurs. Ni infobox, ni sommaire, ni « Un article du wiki ».
- Chapeau : le texte de la note placé avant son premier titre, tel quel.
- Ligne d'index : Index alphabétique, Index par loi (recueil), Catégories, Fiches pour les travailleurs
  (accueils de wiki et sections travailleurs), Espace encadrement (sections gestionnaires).
- Une boîte par section de la note (titre de la note, préfixe « NN - » retiré, ancre conservée) :
  deux colonnes de boîtes sur ordinateur, une sur téléphone ; les sections à sous-titres h3 et les
  longues listes occupent toute la largeur, leurs sous-groupes coulent en colonnes ; les listes de
  huit entrées et plus se répartissent en colonnes selon la largeur disponible (`columns: 12em 3`,
  9 em pour les entrées de 24 caractères ou moins), jamais en nombre fixe : elles retombent seules
  à une colonne sur téléphone.
- Les listes de deux à huit points d'entrée « emoji + lien » (« Démarrage rapide par rôle », « par
  profil ») deviennent une grille de tuiles d'au moins 44 px, toute la tuile touchable.
  Chaque tuile porte une ligne de description : le texte qui suit le lien dans la note, sinon le
  titre de la page cible (attribut `title` posé par le générateur), jamais quand il répète le libellé.
- Les cinq copies des accueils gestionnaires dans l'espace encadrement (`g/w/…/27-articles-gestionnaires/`)
  reçoivent le même rendu, avec leur lien « Voir cette page dans le fond documentaire » dans le pied.
- Un « En bref » d'une note d'accueil, s'il en apparaît un, ouvre le chapeau sans son étiquette.
- Le pied de page se réduit à « Site généré le … » : les indicateurs éditoriaux (relecture,
  vérification des sources), le bloc « Pages qui pointent ici » (3 283 entrées sur l'accueil du
  recueil) et le lien vers le graphe qualifient des articles, pas une page de navigation.
- Le fil d'Ariane de l'accueil d'un wiki s'arrête au wiki : le maillon « Accueil » menait à la
  catégorie « Accueil », qui ne contient que cette page. Le titre de fenêtre perd l'emoji de tête.
- Le rendu est le même dans le générateur (`tools/build_site.mjs`, module `tools/accueil_wiki.mjs`)
  et sur le site publié, retouché sans reconstruction ; estampille de version, feuille de style et
  manifeste hors ligne régénérés.

## Ce qui est retiré ou réparé, et signalé

Le contenu reste celui des notes ; seuls sont écartés les éléments qui ne mènent nulle part sur le
site, chacun signalé à la construction par une ligne « ⚠ accueil … » pour être corrigé dans Obsidian :

- Sécurité industrielle, section gestionnaires : un item de liste vide.
- SST psychosociale : le paragraphe « !RPS___Virage_stratégique.mp4 » (vidéo non publiée dont seul le
  nom s'affichait) ; les items « Index images », « Harcèlement psychologique », « Harcèlement vs
  conflit », « Harcèlement, recours », « Violence travail », tous marqués « (source interne) » ;
  l'item « [[Gestion » (wikilink jamais fermé dans la note) rendu en lien rouge « Gestion ».
- Ergonomie : « [[Postures|Postures sécuritaires] » (crochet fermant manquant) rendu en lien vers la
  page Postures, qui existe.
- Toxicologie : un wikilink imbriqué dans l'alias d'un autre (« [[art-2-LATMP, termes utilisés|[[…]]]] »)
  rendu par le lien intérieur.

Aucune autre page n'est touchée ; les articles gardent leur infobox et leur sommaire.

## Vérification

- Captures réelles (Chromium) des 22 pages en trois modes (390 px clair et sombre, 1200 px), soit
  66 rendus mesurés par `tools/verif_rendu.mjs` : aucun défilement horizontal, aucun lien de moins
  de 24 px de haut sur téléphone (les liens des boîtes, de l'index, du chapeau et des en-têtes reçoivent
  4 px de marge interne verticale sous 900 px ; le texte des boîtes passe à 15 px), tuiles d'au moins
  59 px, un seul h1, ni infobox ni sommaire. Seul le bloc de code de la hiérarchie normative (recueil)
  dépasse — dans son propre cadre défilant, pas la page.
- Intégrité contre les notes d'origine (état `ac27d00b9`, hors voisins et pages liées) : sur les
  22 pages, 0 lien perdu ; les seuls mots absents viennent des retraits annoncés (items « source
  interne » de l'accueil SST psychosociale, « termes utilisés » du wikilink brut de Toxicologie).
- Quatre défauts n'étaient visibles que sur le rendu réel, aucun n'était détectable par les tests de
  structure :
  1. la section CSS des accueils, ajoutée en fin de feuille, passait **après** le bloc mobile : ses
     règles de base l'emportaient à spécificité égale et les boîtes restaient sur deux colonnes à
     390 px. Corrigé en plaçant la section avant ce bloc ;
  2. les liens de liste, d'index et de chapeau mesuraient moins de 24 px de haut sur téléphone
     (WCAG 2.5.8 AA) : 4 px de marge interne verticale, sans déplacer les lignes ;
  3. un en-tête de boîte qui est un lien (« Articles internes … », cinq pages) s'affichait en bleu de
     lien : **4,27:1** sur le fond pastel en thème clair, sous le seuil AA de 4,5:1 — 19 px en graisse
     600 n'est pas du « texte large » au sens WCAG, qui commence à 18,66 px en graisse 700. Il garde
     désormais la couleur de titre (12,84:1 en clair, 9,19:1 en sombre) et tous les en-têtes ont le
     même aspect, comme sur un accueil de wiki ;
  4. la description des tuiles était à 12,5 px, sous le plancher de 13 px retenu pour les textes
     secondaires du site sur petit écran.
- L'arbre de la hiérarchie normative (accueil du Recueil) reste le seul élément plus large que l'écran :
  il défile dans son cadre, comme les tableaux du site. Le faire passer à la ligne casserait son
  alignement ; sa bordure devient franche sur téléphone pour qu'on voie que c'est un cadre défilant.
- `tools/tests/accueil-wiki.test.mjs` : reconnaissance des accueils, nettoyage des titres, découpage
  (chapeau, boîtes, artefacts, réparation des wikilinks avec et sans page cible, premier groupe h3),
  colonnes, extraction du corps publié, rendu, et état des 17 pages publiées.
- `verif_site` (le groupe titre + domaine reste présent pour la barre de lecture), `verif_liens`,
  `verif_publication --staged`, suite de tests complète.

## À corriger dans les notes (relevé de l'atelier, non modifié ici)

- Descriptions coupées en fin de ligne dans trois sous-accueils : Droit du travail travailleurs
  (« interdiction des représailles si tu a »), Toxicologie travailleurs (« art-2-LATMP : défi ») et
  gestionnaires (« art-2-LATMP : » sans suite) ; l'item « [[art-2-LATMP, termes utilisés|… », jamais
  fermé, de l'accueil Toxicologie s'arrête aussi sur « défin ».
- Liens « Hub », « Pages travailleurs », « Pages gestionnaires », « Section travailleurs » des accueils
  Hygiène, Sécurité, Toxicologie et de leurs sous-accueils qui mènent aux sous-accueils du wiki
  Ergonomie plutôt qu'à ceux de leur propre wiki ; « Wikis frères » de la section gestionnaires
  d'Ergonomie dont les deux liens mènent à l'accueil Ergonomie.
- Sections « Articles de loi pertinents » réduites à leur paragraphe d'introduction (Droit du travail
  gestionnaires, Sécurité travailleurs) ; deux titres de section d'Hygiène travailleurs qui répètent
  leur unique item.

## Limites

- La disposition en boîtes suit les titres h2 de la note : une note d'accueil sans titre de section
  donnerait une seule boîte. Les tableaux et blocs de code des notes (recueil législatif) restent
  tels quels dans leur boîte, avec défilement horizontal au besoin.
- Un wikilink brut dont la cible n'existe pas reste un lien rouge : c'est la note qu'il faut corriger.
