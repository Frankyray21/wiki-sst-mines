# L'illustration de Frank sur le lieu de contrôle — 26 septembre 2026

Frank a refait lui-même le schéma « lieu de contrôle interne ou externe » de la page
[Types de personnalité et lieu de contrôle](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/types-de-personnalite-et-lieu-de-controle.html)
(« J'ai amélioré une image du wiki »). À sa demande, son image est publiée telle quelle, à la place exacte du schéma v1,
sous « Nuance importante ». La grille des combinaisons (v2) ne change pas.

- **Fichier** : `wiki-types-de-personnalite-et-lieu-de-controle-interne-externe-v2.jpg` (1080 × 1458 px, 255 Ko). Elle
  est découpée dans sa capture d'écran, sans les bords du téléphone. Le JPEG a été réencodé à la qualité 90 ; rien
  n'est retouché dans l'image.
- **Thème sombre** : comme les schémas, elle est inversée par le filtre du site. Le rendu a été vérifié : le vert,
  l'orange et le bleu sont gardés, et le texte reste net.
- **Texte du bloc** :
  - le texte alternatif et la version texte décrivent toute l'image, mot pour mot ;
  - la légende reste celle de la page (« Une attribution externe n'est pas un défaut ; elle est réaliste quand
    l'environnement de travail offre objectivement peu de contrôle ») ;
  - les sources disent « Illustration pédagogique créée avec l'aide de l'IA », comme les autres illustrations de Frank.
    La mention de l'IA est déduite de la capture, qui vient de l'application ChatGPT : à retirer si elle est fausse.
- **Outil de pose** : `tools/poser_schemas.mjs` accepte désormais une image PNG ou JPEG. Il vérifie :
  - la signature du fichier (une extension trompeuse est refusée) ;
  - la largeur, 480 px au moins ;
  - le poids, 1,5 Mo au plus.

  Ses dimensions, lues dans l'en-tête du fichier, sont posées sur l'image, comme pour un SVG. Sans elles, l'image
  n'avait aucune hauteur avant son chargement : son lien mesurait moins de 24 px au téléphone, et la page aurait sauté.
- **Générateur** : `tools/build_site.mjs` pose lui aussi ces dimensions sur les images PNG et JPEG des infographies.
  La page reste donc la même après reconstruction. Les quatre infographies PNG déjà publiées (bruit, vibrations,
  silice, voies d'exposition) les recevront à la prochaine construction.
- **Tests** : ces contrôles sont couverts, pour l'outil de pose, le générateur et chaque lot publié.

## Écarts avec la page (choix de Frank, publiés tels quels)

- Les phrases de l'interne sont cochées en vert, celles de l'externe barrées d'une croix rouge. La page dit en gras
  « un lieu de contrôle externe n'est pas un défaut ». Elle range parmi les pièges « Justifier l'inaction
  organisationnelle par le profil individuel ».
- Plusieurs textes de l'image ne sont pas dans la page :
  - les six phrases à la première personne (« Je compte sur la chance », etc.) ;
  - le sous-titre « au travail et dans la vie » ;
  - la note du bas, « L'important est de reconnaître ce qui l'est… et d'agir là où c'est possible ».
- Le message du bas, « Réaliste quand le poste offre peu de contrôle », reprend la page, sans « objectivement » ni
  « adaptative ».

## Le style de l'image devient le modèle des nouveaux schémas

Frank l'a choisi pour le lot 10 et les suivants. On en reprend :
- le grand titre ;
- les panneaux à pastille et bandeau ;
- les phrases courtes ;
- les gros personnages ;
- le message clé en bleu en bas.

Ce qui reste :
- pas de ✓ ni de ✗ qui jugeraient un travailleur ;
- les mots viennent de la page ;
- le code de couleurs du wiki : rouge pour ce qui pèse, bleu pour les leviers.

## À faire dans le vault

La boucle de la note du lot 9 (`2026-09-26-rps-schemas-lot9.md`) applique aussi ce lot. Le lot de Types de
personnalité est remplacé sous le même nom et convient à tous les états de la note, essayés un à un :
- la capture du livre encore là ;
- le lot du matin appliqué ;
- le lot 9 appliqué ;
- les deux lots appliqués.

Le lot copie aussi l'image `.jpg` dans le dossier Infographies. Ensuite,
`wiki-types-de-personnalite-et-lieu-de-controle-interne-externe-v1.svg` peut quitter ce dossier.
