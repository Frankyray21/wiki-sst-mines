# Texte officiel des articles de loi — 9 septembre 2026

Jusqu'ici, chaque page d'article du recueil législatif ne présentait le texte officiel que sous
forme de capture PNG du PDF. Une image ne se copie pas, ne se lit pas au lecteur d'écran, ne se
cherche pas et se lit mal sur téléphone. Les PDF de LégisQuébec ont une couche texte complète :
elle est désormais extraite article par article et posée dans la page, avant la capture, qui reste.

## Ce qui change

- 2 833 pages d'articles sur 2 834 portent leur texte officiel : LSST 393, LATMP 527, LNT 22,
  LMRSST 301, RSST 480, RSSM 538, CSTC 569. La seule page sans texte est l'art. 14.48 du Règlement
  canadien SST, dont le PDF n'est pas dans le recueil.
- Le titre « Texte officiel : capture du PDF » des notes devient « Texte officiel » au rendu (page et
  sommaire) ; le bloc de texte vient sous ce titre, la capture et le lien vers le PDF restent dessous.
  Trois pages RSSM (art. 105, 109, 110) n'ont ni frontmatter `loi`, ni titre, ni capture : la loi est
  lue dans le nom de la note et le texte est posé en fin de page sous un titre ajouté.
- Chaque bloc se termine par sa provenance : « Texte de l'article N LOI, extrait de la couche texte du
  PDF officiel (page P), sans OCR ni retouche. La capture ci-dessous et le PDF font foi. »
- Recherche : les mots des textes sont ajoutés à l'index plein texte (1 071 mots nouveaux, 6 186 listes
  complétées, 24 172 mots au total) et l'extrait affiché dans les résultats montre le début du texte
  de l'article plutôt que le nom de la capture.
- `tools/textes-loi/*.json` (2,1 Mo) est commis : la construction du site ne relit pas les PDF.
- Feuille de style (`.texte-loi`), estampille de version et manifeste hors ligne régénérés.

## Ce qui ne change pas

- Aucune note du vault n'est modifiée. Le texte extrait n'est ni corrigé, ni complété, ni reformulé :
  ce qui est dans le PDF est reproduit, rien d'autre.
- Les captures PNG, les liens « Voir art. N dans le PDF (page P) » et la mention de la date de mise à
  jour du texte restent tels quels.

## Méthode d'extraction (`tools/extraire_textes_loi.mjs`)

Chaque page du PDF est lue avec les coordonnées de ses items de texte (pdf.js, sans rendu).

1. Taille du corps = la taille qui porte le plus de caractères (11 pt sur LégisQuébec, 10,5 pt sur le
   projet de loi LMRSST). Les items sous 10 pt sont écartés : c'est l'historique législatif
   (« 1979, c. 63, a. 51 »), souvent imprimé glyphe par glyphe en colonne, et les pieds de page.
2. Bandes ignorées : au-dessus de 50 pt sous le bord supérieur (titre courant « SANTÉ ET SÉCURITÉ DU
   TRAVAIL » à 740 pt) et sous 34 pt (folio, dates en marge). Le titre courant est de plus détecté
   comme la première ligne qui se répète sur au moins un cinquième des pages, et exporté en contrôle.
3. Un numéro d'article est un item d'au moins un point de plus que le corps, de la forme « 51. »,
   « 49.1. », « 312.100. », en tête de ligne. Les noms de police de pdf.js dépendent de l'ordre de
   chargement des pages et ne disent pas si la police est grasse : la taille seule est utilisée.
4. Un article s'arrête au numéro suivant ou à un titre de section (CHAPITRE, SECTION, §, ou ligne tout
   en capitales hors citation « … »).
5. Alinéas : la marge gauche est mesurée sur chaque page (54 pt au verso, 72 pt au recto ; 144 pt sur
   le projet de loi) comme la plus petite abscisse portée par au moins deux lignes ; une ligne en
   retrait d'au moins 8 pt, ou qui commence par « 1° », « a) », « 1.1. », ouvre un paragraphe.
6. Ordre des numéros : « 7.01 » précède « 7.1 » ; la comparaison ne se fait qu'à profondeur égale, car
   dans le CSTC la sous-section 7.1.1 (articles 7.1.1.1 à 7.1.1.16) suit l'article 7.1.6.

## Contrôles

| Loi | Pages | Numéros lus | Articles exportés | Vides | Doublons | Non croissants | Titres courants dans un texte |
|---|---|---|---|---|---|---|---|
| LSST | 78 | 479 | 479 | 0 | 0 | 0 | 0 |
| LATMP | 142 | 793 | 793 | 0 | 0 | 0 | 0 |
| LNT | 70 | 347 | 347 | 0 | 0 | 0 | 0 |
| LMRSST | 104 | 313 | 313 | 0 | 0 | 0 | 0 |
| RSST | 230 | 576 | 576 | 0 | 0 | 0 | 0 |
| RSSM | 144 | 676 | 676 | 0 | 0 | 0 | 0 |
| CSTC | 222 | 748 | 748 | 0 | 0 | 0 | 0 |

- Croisement avec le site : chacun des 2 833 articles publiés est retrouvé dans l'extraction de sa loi.
  La page PDF de l'article concorde (à une page près) avec le renvoi `#page=N` de la note dans 2 823
  cas ; 9 notes n'ont pas de renvoi ; une note diverge : **RSSM art. 83** renvoie à la page 9 alors que
  l'article est à la page 34 du PDF — à corriger dans le vault.
- Vérification visuelle, texte extrait contre capture : LSST art. 51 (18 paragraphes, 1° à 16°),
  RSST art. 51 et 52, RSSM art. 83, CSTC art. 2.4.1 (37 paragraphes, dont les sous-paragraphes
  1., 1.1., 1.2., 1.3., 2., 3., 4., 5., 6.), LMRSST art. 52 et 53, LATMP art. 440.
- Deux paragraphes du LMRSST sont tout en capitales : ce sont des intitulés cités par le projet de loi
  (« 9. LE PRÉSIDENT-DIRECTEUR GÉNÉRAL… »), conservés à dessein.
- Tests : `tools/tests/textes-loi.test.mjs` (contrôles des sept fichiers, LSST 51, repérage loi et
  numéro, ordre des numéros, regroupement des lignes, rendu et pose, état du site publié, recherche).

## Limites

- La segmentation en paragraphes est une heuristique de mise en page : un retrait inhabituel (tableau,
  annexe, formule) peut couper ou fusionner un alinéa. Le texte, lui, n'est jamais perdu ni altéré.
- L'index plein texte du site publié a été complété, non reconstruit : un mot absent de l'index parce
  que présent dans plus de 40 % des pages à la construction ne réapparaît pas. La prochaine
  construction complète (`node tools/build_site.mjs`) recalcule tout.
- La date de mise à jour du texte est celle du PDF du recueil, rappelée par la ligne « texte à jour
  au … » de chaque page. Une mise à jour des PDF demande de relancer l'extraction, puis la construction.
- Ce travail ne vérifie ni l'exactitude juridique des notes ni la concordance entre résumé « En bref »
  et texte officiel.

## Renvois vers les notes d'analyse : outil de pose

Les 59 renvois tranchés le 9 septembre (`content-updates/2026-09-09-renvois-sources.json`) portent
maintenant chacun leur ancrage et leur ligne définitifs (`ancrageFinal`, `ligneFinale`). Le repli
automatique des sept corrections du contrôleur avait mal lu trois d'entre elles ; elles sont reprises
à la main :

- Bowers et al. (2018) : l'ancrage redevient « La culture du « tough guy » : on endure, on n'en parle
  pas. » (la ligne corrigée est conservée, sans la parenthèse de contrôle) ;
- Folkard et Tucker (2003) : l'ancrage redevient « Sur un quart de 12 heures, la performance baisse à
  partir de la 9e ou 10e heure, et nettement aux 11e et 12e. » ;
- Labra et al. (2022), fiche « Recevoir du soutien » : la ligne est celle du contrôleur (étude
  qualitative auprès de 22 hommes FIFO, demande d'aide psychosociale et non coup de main sur une tâche).

Les 58 ancrages des renvois retenus sont présents mot à mot dans le texte publié de leur fiche
(le 59e est l'écarté). L'ancrage « Ton syndicat » apparaît sept fois dans sa fiche : la première
occurrence est la bonne (tableau « Si tu veux quelqu'un avec toi ») ; un champ `occurrence` permet
d'en viser une autre si la note du vault diffère.

`tools/appliquer_renvois.mjs` retrouve la note de chaque fiche (même chemin de sortie que le
générateur) et la note d'analyse (même slug), cherche l'ancrage mot à mot en ignorant gras, italique
et wikilinks, pose « [n](#ref-uni-n) » juste après, et ajoute la ligne à « ## Références » (section
complétée si elle existe, créée avant le pied de page sinon), avec « Auteur (année) » en lien vers la
note d'analyse. Numérotation dans l'ordre du texte, à la suite des références existantes. Sans
`--appliquer`, l'outil affiche chaque pose avec ses 80 caractères de contexte et n'écrit rien ; avec,
chaque note est d'abord copiée dans `sauvegarde-vault/<date>-renvois/`. Un ancrage introuvable est
signalé et laissé à la main. Tests : `tools/tests/appliquer-renvois.test.mjs`. Le vault n'étant pas
accessible depuis l'environnement de génération, rien n'y a été écrit : la pose reste à lancer sur le
poste où se trouve le vault.

## Vérification

`npm --prefix tools test`, `node tools/verif_site.mjs`, `node tools/verif_liens.mjs` (0 erreur) et
`node tools/verif_publication.mjs --staged` passent sur le site retouché.
