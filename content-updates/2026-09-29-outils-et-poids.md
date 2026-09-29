# Outils, contrôle d'affichage et poids des images (29 septembre 2026)

Bloc 4 (« Technique ») de la liste « Que reste-t-il à bonifier ».

## 1. Outils de pose des corrections dans `tools/`

Les corrections publiées du 25 au 29 septembre ont été posées sur le site par deux scripts restés dans l'espace de
travail temporaire des sessions. Ils auraient disparu avec lui. Ils sont maintenant dans le dépôt, avec des tests :

- **`tools/poser_corrections.mjs`** : pose une fiche de corrections de texte dans la page publiée et sa copie
  encadrement, et écrit le lot du vault correspondant (`content-updates/<date>-corr-<nom>.json`). Le format de la fiche
  est décrit en tête du fichier. Essai par défaut ; avec `--ecrire`, rien n'est écrit si une seule retouche échoue.
- **`tools/renvois_modifies.mjs`** : après des liens ajoutés, retirés ou redirigés, met à jour les « Pages qui pointent
  ici » des pages visées et le graphe, comme le générateur.

La racine du dépôt est déduite de l'emplacement de l'outil (plus de chemin propre à une machine). La date du lot est
celle du jour par défaut.

**Défaut corrigé au passage.** Dans la fiche « Types de personnalité », une insertion (Rotter, Denollet) est
complétée plus loin dans la même fiche (référence Denollet complète). L'ancien script ne la reconnaissait plus
comme déjà posée : rejouer la fiche l'aurait insérée une seconde fois. Le site publié n'était pas touché.

**Vérifications.**
- Les 136 fiches déjà posées donnent le même journal avec l'ancien et le nouvel outil. Leurs 690 retouches se
  reconnaissent toutes comme déjà posées.
- Rejoué sur l'état d'avant la redirection des liens du 28 septembre, `renvois_modifies.mjs` reproduit à l'octet
  près les 22 pages visées et le graphe publiés.
- 9 tests (`tools/tests/poser-corrections.test.mjs`).

## 2. Contrôle d'affichage étendu aux pages de contenu

`tools/verif_rendu.mjs` ne contrôlait par défaut que les accueils. Les débordements trouvés plus tard l'ont été sur
des pages de contenu : Soutien social, art. 5.2.1 du CSTC, « De la conformité à la prévention ».

Il contrôle désormais aussi un échantillon fixe de 20 pages : chaque wiki, chaque gabarit (portail, thème, article,
note d'analyse, article de loi, copie encadrement) et les pages qui ont déjà fait défaut. `--accueils` garde
l'ancien comportement. Un test vérifie que l'échantillon existe et couvre chaque wiki.

Contrôle par défaut : 185 rendus (37 pages × 5 modes), 0 défaut, en une minute.

## 3. Poids des images

Les médias publiés pesaient 384 Mo : PNG 247 Mo, PDF 139 Mo. Le générateur recompressait déjà sans perte les PNG
qui tiennent en 256 couleurs (2 850 images, 64 Mo). Les 517 autres (captures de cours, photos, 183 Mo) étaient
recopiés tels quels. Or 443 d'entre eux portent un canal alpha partout opaque, et leur compression d'origine est
faible.

- **Générateur** (`tools/png_palette.mjs`) : une image de plus de 256 couleurs garde ses vraies couleurs, mais perd
  son canal alpha quand il est partout opaque et est refiltrée (filtre Paeth, deflate niveau 6). Le résultat est relu
  et doit donner exactement les mêmes pixels, sinon l'original est recopié. Coût : une trentaine de secondes de plus
  par construction (traitement des 3 367 PNG : 7,7 s avant, 39 s après, mesuré ici).
  - Le filtre Paeth seul fait presque aussi bien que le meilleur des cinq filtres choisi ligne à ligne (−22 % contre
    −23 %), en deux fois moins de temps.
- **Site publié** : la même règle est appliquée.
  - 425 images passent de 169,7 à 137,4 Mo, soit 32 Mo de moins.
  - Les médias du téléchargement hors ligne passent de 394 à 362 Mo (−8 %).
  - Un second passage ne change plus rien.
- **Pixels identiques** : optimiserPng relit chaque image et la compare. Un échantillon a aussi été vérifié dans
  Chromium : 0 octet de pixel différent.
- **Pas fait, à décider** : passer les photos (72 images RVB, 72 Mo) en JPEG diviserait leur poids par cinq environ,
  mais avec perte et un changement de nom de fichier. Les PDF (139 Mo) pourraient aussi sortir du téléchargement hors
  ligne, mais les lois seraient alors absentes sous terre. Ce sont deux décisions de Frank.

## À faire par l'auteur

Rien dans le vault. La prochaine construction (`node tools/build_site.mjs`) recompresse les images de la même façon.
Le journal de construction l'indique (« Images PNG : … recompressées sans perte »).
