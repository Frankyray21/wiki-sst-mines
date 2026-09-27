# Choix de contenu tranchés et améliorations (27 septembre 2026)

Frank a dit « go » pour deux listes en attente : les **choix de contenu** et les **améliorations possibles**. Tout est
publié directement dans `docs/`. Chaque changement de texte a aussi son **lot pour le vault** dans `content-updates/`,
sans quoi la prochaine construction du site l'effacerait. Un seul script les rejoue tous (voir « À faire dans le
vault »).

## 1. Choix de contenu

### Accueils des wikis (5 lots `2026-09-27-corr-accueil-*.json`)

- **Toxicologie** : l'item tronqué « LATMP art. 2, défin » est réparé en « LATMP art. 2, définitions ».
- **Liens « Pages gestionnaires »** : sur les accueils Hygiène, Sécurité et Toxicologie, le lien mène désormais à
  l'accueil gestionnaires du wiki. Avant, il menait à celui d'Ergonomie (retouche `recibler`, voir plus bas).
- **« Pages-index de sections »** devient « Vues d'ensemble » sur les accueils Droit du travail, Hygiène et SST
  psychosociale. Le pictogramme de liste suit le nouveau nom (`tools/accueil_wiki.mjs`).

### Voies d'exposition (`2026-09-27-corr-voies-dexposition.json`)

L'injection et les yeux ne figuraient plus que dans la version texte, retirée le 26 septembre. La légende du schéma
les nomme de nouveau.

### Rotations jour-nuit (8 lots, 8 pages)

Le sens de rotation est harmonisé sur huit pages (Ergonomie et SST psychosociale). La rotation jour → soir → nuit est dite
**horaire, ou vers l'avant**, et non antihoraire. Les comparaisons sont remises dans le bon sens, avec la source
CCHST.

### Pages RPS relevées (lots 26 septembre, 8, 9 et 10)

**Chiffres du lot :**
- 51 lots `2026-09-27-corr-*.json` au total, 238 retouches ;
- 36 pages RPS, dont 3 notes d'analyse (Bowers, INRS, Kivimäki) ;
- 1 page du Recueil législatif (CNESST).

**Politique appliquée, la même partout :**
- On ne touche qu'aux points relevés, plus une coquille évidente dans la même phrase.
- **Erreur juridique** : corrigée d'après le texte de loi du recueil (`tools/textes-loi/*.json`). Le motif de la
  retouche recopie mot pour mot la phrase de loi qui fonde la correction. 33 retouches citent un article (LSST,
  LATMP, LMRSST, LNT, RSSM). Quand la LSST du recueil est antérieure à la LMRSST, l'article de la LMRSST qui l'insère
  ou le remplace est cité aussi.
- **Référence fausse** : corrigée d'après la note d'analyse du wiki ou une source vérifiée ; le motif cite la ligne
  qui fait foi.
- **Chiffre ou affirmation sans source** : rien n'est supprimé. La marque « (source à préciser) » est ajoutée, ou
  « (référence à préciser) » pour une référence. Il y en a 116. Quand le wiki donne la valeur sourcée, on la cite à
  la place de la marque, par exemple la date du 1er octobre 2025 (LMRSST, art. 313 ; Décret 1154-2025).
- **Contradiction interne** : alignée sur la version sourcée.

**Exemples :**
- **CNESST, inspecteur** : l'amende est pénale, pas administrative (LSST, art. 236 et 242). L'avis de correction est
  émis « s'il l'estime opportun » (art. 182). Un recours passe par la révision puis le TAT (LATMP, art. 358 et
  359). Le harcèlement relève d'une plainte selon la LNT (art. 123.6) et la médiation se fait avec l'accord des
  parties (art. 123.10).
- **Recueil, CNESST** : les liens d'articles faux (238, 204) mènent aux bons (177 à 186 LSST, 209 LATMP).
- **LMRSST, Obligation d'identifier** :
  - l'effectif se compte « au cours de l'année » ;
  - un plan d'action remplace le programme de prévention sous 20 travailleurs (art. 61.1) ;
  - un représentant en santé et en sécurité peut y être exigé (art. 88 et 88.1).
- **Retour au travail** : l'assignation temporaire est une faculté soumise à l'avis du médecin (LATMP, art. 179).
  La collaboration de l'employeur est prévue à l'art. 170.2 et la LNT s'applique hors lésion (art. 79.1 et 79.4).
- **Contremaître** : il est exclu de la définition de « travailleur » de la LSST (art. 1), mais pas de celle de la
  LATMP (art. 2).
- **Foreur** : l'employeur doit la formation et la supervision (LSST, art. 51, 9°). Le stress lié au superviseur est
  au 5e rang des prédicteurs de Bowers et al. (2018), et non « dominant ». La thèse de la note Bowers est corrigée
  de même.
- **Grille INSPQ** :
  - 12 indicateurs en deux parties (Recueil de fiches de l'INSPQ, publication 2371) au lieu de « 7 catégories » ;
  - la CNESST n'impose pas d'outil unique ;
  - l'utilisation de la Grille suppose une formation ;
  - la démarche INSPQ en quatre étapes est ajoutée ;
  - la référence EQCOTESST (rapport R-691) est corrigée.
- **Kivimäki (2012)** : 2 358 événements, et non 1 957. Il s'agit de maladie coronarienne, et non « cardiovasculaire ».
- **Selye** : le nom est écrit Selye dans le texte et les références, et le modèle est daté de 1936. Le MBI est un
  outil de mesure, pas une maladie.
- **Autres pages** :
  - MBI : durée de 5 à 10 minutes (note INRS) ; LATMP sans le mot « burnout » (art. 2).
  - Accomplissement personnel : un score bas signale l'épuisement.
  - Culture minière : « stigmatisation de courtoisie » était employé à contresens.
  - Communication souterraine : CSA Z1004 n'est pas une norme sur le travail isolé ; le RSSM exige un téléphone
    (art. 283) et un contact toutes les 2 heures pour un travailleur seul (art. 15).
  - Confinement : un refus peut être l'exercice du droit de refus (LSST, art. 12) ; les salles de refuge sont des
    abris d'urgence (RSSM, art. 126 à 128), pas des zones de pause.
  - Coût des RPS : les indemnités et la hausse de cotisation risquaient d'être comptées deux fois (LATMP, art. 60,
    124, 326).
  - Types de personnalité : références de Kobasa et Rotter complétées ; celle de Denollet est à préciser.
  - Soutien post-événement : la revue Cochrane sur le debriefing (Rose et al., 2002) est ajoutée.
  - Axe HHS : le circuit CRH, ACTH, cortisol est ajouté (Smith et Vale, 2006).

Chaque lot garde, pour chaque retouche, le point relevé et la source dans le champ `motif`. Pour relire une page, il
suffit d'ouvrir son lot.

### Schémas mis en accord avec les corrections

- **Aide-foreur, leviers, v4** : la formation des foreurs au leadership passe au niveau primaire, comme sur la page
  Foreur. Elle porte sur la communication, le soutien et la reconnaissance, que la page « Les trois niveaux de
  prévention » range au primaire.
- **Confinement, leviers, v4** : les refuges ne sont plus présentés comme zones de pause.

Les deux lots de schémas du 26 septembre sont réécrits : ils posent la v4 à la place de la v1, de la v2 ou de la v3.
Le gabarit accepte désormais un numéro de version (`version=4` dans `tools/schemas-sombres/lot10.py`).

### Grille INSPQ : le schéma des indicateurs

Le nouveau schéma « Grille INSPQ : 12 indicateurs » présente les deux parties et les noms officiels, avec des points
gris neutres. Il est posé après le paragraphe qui suit le tableau et produit par
`tools/schemas-sombres/grille_inspq.py`.

Son lot, `2026-09-27-grille-inspq-didentification-des-rps-schemas.json`, s'ancre sur un texte présent avant et après
la correction de la page : il s'applique dans n'importe quel ordre. L'ancien schéma « catégories », jamais publié,
est abandonné.

### Surlignages colorés des notes d'analyse

La syntaxe `~={red}texte=~`, héritée du greffon de surlignage d'Obsidian, s'affichait brute sur 22 notes d'analyse.
Le générateur la rend désormais en surlignage lisible en clair et en sombre (`tools/surlignage.mjs`, classes
`surligne-<couleur>`). Les 22 pages sont reposées.

## 2. Améliorations

- **Nouveau style du portail, de la page Thèmes et des pages de thème** (`tools/habillage_pages.mjs`, repris par le
  générateur) :
  - cartes et tuiles du portail au style des accueils ;
  - thèmes en rangées à pictogramme teinté, avec nombre d'articles et chevron ;
  - pages de thème : articles et « Autres thèmes du wiki » en rangées.
- **Illustration par wiki sur la carte d'entrée** : sept dessins vectoriels (`tools/illustrations/*.svg`) remplacent
  l'emoji. Même rendu sur le portail.
- **Un seul script pour le vault** : `tools/rejouer_lots.mjs`. Il essaie les 118 lots depuis le 25 septembre, puis
  les applique dans l'ordre si aucun n'échoue. Il passe ensuite le retrait des versions texte et les libellés de
  liens courts.
- **Nouveau type de retouche `recibler`** (`tools/retouches.mjs`) : le lien d'un libellé donné mène à une autre note,
  sans changer le libellé. Il sert aux accueils, au lien « job strain » de l'Aide-foreur et aux liens d'articles du
  Recueil.

Au passage, le lot `2026-09-25-corr-diesel-sous-terre.json` désignait sa ligne par « NIOSH 5040 ». Or ce texte revient
dans les sources du schéma Diesel : au second passage, le lot aurait été refusé (« ambiguë »). Il désigne désormais
la rangée par « comparable site à site ».

## À faire dans le vault

```
node tools/rejouer_lots.mjs --vault "C:/…/WIKI SST - Mines"               # essai : rien n'est écrit
node tools/rejouer_lots.mjs --vault "C:/…/WIKI SST - Mines" --appliquer   # puis application (sauvegardes)
node tools/build_site.mjs
```

Si un lot échoue à l'essai, rien n'est écrit : le message nomme le lot et la ligne introuvable.

**À faire à la main, parce qu'une retouche désignée par le texte visible ne peut pas le faire proprement :**
- **Foreur** : en-tête « Effet » ; **Contremaître** : en-tête « Effet sur l'équipe ». Chacun figure à l'identique dans
  deux tableaux de la note. Proposition : « Effet attendu (source à préciser) ».
- **Aide-foreur** : la puce « Premier poste pour beaucoup… » est rangée parmi les tâches ; la déplacer.
- **Note Bowers et al. (2018)** : trois liens vers le PDF sont libellés « Roberts et al., 2018 ».
- **Types de personnalité** : le lien « Dolan & Arsenault 2009 p. 169 » ouvre la page PDF 159, soit la p. 139 du
  livre. La typologie est aux p. 142-143 (page PDF 162).
- **Réintégration au foyer entre rotations** : la cellule « Droit à la réadaptation » (jours 3-5) est un lien
  `[[Réadaptation]]` vers la page de droit. Écrire « Réadaptation » en texte simple.
- **Séparation famille en FIFO** : point final manquant après `**enjeux psychosociaux**`.
- **Premiers signes en mine** : la Trousse d'outils de l'INSPQ est à marquer (référence à préciser).
- **PAE** : un lien « Le PAE » mène à la page elle-même.
- **MBI** : le lien « Maslach 1981 p. 1 » ouvre une fiche qui cite Maslach (1996) ; le titre du PDF porte la
  coquille « Invenvotory ».
- **Grille INSPQ** : dans le tableau, les cellules « Soutien social au travail » et « Latitude décisionnelle » restent
  des liens vers les pages du wiki. Le nom officiel des indicateurs est en tête de la cellule voisine.
- **Modèle de Selye** : le titre de la note, et de l'encadré « Ce que Sélye n'explique pas », garde l'accent. Renommer
  la note dans Obsidian corrige aussi les liens.

## Non traité, et pourquoi

- **Délais du soutien post-événement** : le tableau des phases et le protocole minier ne se contredisent pas. « 24 à
  72 h » tombe dans la « semaine 1 », et « 3, 6, 12 mois » recouvre « 3-6 mois ». Aucune mention « à harmoniser »
  n'est ajoutée.
- **Coût des RPS** :
  - le ratio « 2 à 5 $ par dollar » est marqué aux deux endroits, mais il reste attribué une fois à la prévention
    primaire, une fois à un programme intégré. C'est une décision de fond.
  - Démarrage rapide pour direction et RH et Lien entre RPS et invalidité prolongée parlent de « quelques milliers de
    dollars par année ». Ces pages étaient hors du relevé.
- **Mutuelle de prévention** : elle est marquée (source à préciser), car les articles de la LATMP qui la prévoient ne
  sont pas dans le recueil.
- **MBI, droit d'auteur** : le PDF lié à la page reproduit les énoncés d'un questionnaire sous licence. La question
  reste à trancher par Frank ; rien n'est modifié.
- **LSST.json** : le recueil est à jour au 26 mars 2024, avant la réforme du programme de prévention. Les corrections
  citent donc la LMRSST. Le texte consolidé n'a pas été mis à jour.
- **Hors relevé, remarqué en relisant** :
  - La note « INSPQ 2021 » parle de « huit dimensions », ce qui contredit les 12 indicateurs de la Grille.
  - Page Obligation d'identifier : « Pas de mise à jour annuelle » et « Outil québécois de référence » ne sont pas
    sourcés.
  - Sur les pages de contenu, les renvois numérotés « 1 », « 2 » sont des cibles tactiles de moins de 24 px
    (Soutien social, par exemple).

## Vérifications

- `npm --prefix tools test` : 369 tests sur 370. Le seul échec est connu et antérieur à ce travail : le texte
  officiel des lois du recueil, en attente.
- `tools/tests/corrections-contenu.test.mjs` applique chaque lot deux fois à une note reconstituée. Le second
  passage ne change rien. Le test vérifie aussi que la page publiée porte le texte corrigé, sans l'ancien.
- `node tools/verif_site.mjs` : OK. `node tools/verif_liens.mjs` : 245 725 liens internes, aucune erreur.
- Rendu réel dans Chromium (`tools/verif_rendu.mjs`) : les 51 pages corrigées, le portail et la page Thèmes, en cinq
  modes. Aucun défaut dû à ces changements.
- Toutes les citations entre guillemets des motifs ont été retrouvées mot pour mot dans le texte de loi du recueil,
  la page du wiki ou la note d'analyse citée. Les exceptions sont vérifiées à la main : fiche PDF du MBI, fiche
  INSPQ 2373, références fournies par la relecture.
