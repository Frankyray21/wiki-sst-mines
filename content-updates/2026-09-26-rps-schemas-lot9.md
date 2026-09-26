# Pages RPS illustrées (suite) et deux refontes pour le thème sombre — 26 septembre 2026

Demandes de Frank :

- « continue » : suite des pages RPS illustrées ;
- l'avis sur Premiers signes en mine (« améliore cette image, tu peux en créer plusieurs »), appliqué aux autres
  schémas publiés.

Les 51 schémas publiés ont été rendus à 340 px en thème sombre. Deux avaient le même défaut que l'ancien Premiers
signes (petits pictogrammes entassés) : Retour au travail et Types de personnalité. Ils sont refaits, en plusieurs
schémas plus grands.

Chaque schéma a été dessiné d'après la seule page, puis relu par un relecteur contradictoire qui l'a confronté mot à mot
au texte de la page et, pour les pages juridiques, aux textes officiels du recueil (tools/textes-loi/*.json). Dans le
wiki SST psychosociale, le texte des articles n'est pas modifié : seuls les schémas s'ajoutent.

## Pages

| Page | Schémas |
| --- | --- |
| [Étapes d'un retour au travail réussi](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/etapes-dun-retour-au-travail-reussi.html) | refonte : vue d'ensemble v2 (remplace la v1), grandes stations numérotées comme dans la page ; un schéma sous chacune des étapes 1 à 4 (lien pendant l'absence ; plan écrit, chaque acteur relié au plan, sans réunion ; retour progressif ; soutien des premières semaines). L'étape 5 n'a pas de schéma propre : il redisait la vue d'ensemble et le tableau |
| [Types de personnalité et lieu de contrôle](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/types-de-personnalite-et-lieu-de-controle.html) | refonte : lieu de contrôle interne ou externe, en deux grandes scènes (remplacé le soir même par l'illustration de Frank, voir `2026-09-26-image-lieu-de-controle.md`) ; croisement avec le type A ou B (v2, remplace la v1 publiée ce matin), mêmes mots que la v1 relue |
| [Conséquences du stress sur la santé](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/consequences-du-stress-sur-la-sante.html) | conséquences sur trois plans, situées sur un mineur ; pourquoi c'est critique en mine (les cinq rangées du tableau) |
| [Communication souterraine et isolement de l'équipe](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/communication-souterraine-et-isolement-de-lequipe.html) | ce qui isole l'équipe sous terre ; compenser au fil du quart, avec le téléphone relié à la surface qu'impose le RSSM, art. 283 |
| [Grille INSPQ d'identification des RPS](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/grille-inspq-didentification-des-rps.html) | la démarche : des sources à la grille, de la grille au plan d'action. Le schéma des catégories attend (voir plus bas) |
| [Culture minière et stigmatisation de la santé mentale](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/culture-miniere-et-stigmatisation-de-la-sante-mentale.html) | ce qui freine (pairs, soi, organisation, proches) ; les leviers de la page |
| [CNESST, rôles et pouvoirs](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/cnesst-roles-et-pouvoirs.html) | les trois rôles, entre l'employeur minier et le travailleur : prévention (inspection, soutien, avis de correction « s'il l'estime opportun ») ; indemnisation (réclamation, décision, réparation) ; normes du travail (plainte de harcèlement, enquête, médiation avec l'accord des parties). Ce que l'inspecteur peut demander à voir sur les RPS, puis la suite prévue par la LSST : avis de correction, infraction, poursuite pénale possible, amende |
| [LMRSST, vue d'ensemble pour les RPS](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/lmrsst-vue-densemble-pour-les-rps.html) | document et participation selon l'effectif de l'établissement au cours de l'année : au moins 20 travailleurs, programme de prévention, comité et représentant ; moins de 20, plan d'action et agent de liaison ; les cas particuliers. Les risques psychosociaux dans la même liste que les autres risques pour la santé, puis ce que prévoit le programme de prévention : identification et analyse, mesures et échéanciers, suivi |

Aucun schéma n'ajoute de chiffre, de délai, de montant ou de promesse d'effet.

CNESST et LMRSST sont posés après l'accord de Frank (« continue ») : le système de permissions avait refusé l'essai de
pose aux relecteurs, comme pour Axe HHS. L'essai a été refait avant la pose, et les rendus revus en thème sombre à
340 px. Les deux schémas juridiques qui citent les art. 59 et 78 de la LSST suivent leur texte modifié par la LMRSST
(art. 144 et 154). LégisQuébec n'est pas joignable depuis la session : leur entrée en vigueur découle de la LMRSST
elle-même (art. 313, 7° : au plus tard le 6 octobre 2025). Un changement postérieur de ces articles reste à exclure en
consultant LégisQuébec.

## En attente de Frank

- **Grille INSPQ, schéma des catégories** : la liste des sept catégories de la page (charge de travail,
  reconnaissance, soutien social, latitude décisionnelle, information et communication, harcèlement et violence,
  conciliation) n'est confirmée par aucun document du wiki. La fiche INSPQ n° 2373 (avril 2018), seul document INSPQ
  qui cite la grille, énumère d'autres risques : insécurité d'emploi, justice organisationnelle, soutien des collègues
  ou du supérieur, harcèlement psychologique. Les notes INSPQ (2021a) et INSPQ (2021) donnent encore d'autres listes.
  À vérifier dans la grille de l'INSPQ avant de publier ce schéma, déjà dessiné et relu (« selon cette page »).

## À faire dans le vault (sinon la prochaine construction efface ces schémas)

```
Get-ChildItem content-updates\2026-09-26-*-schemas.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
node tools/build_site.mjs
```

La boucle couvre tous les lots du jour ; les lots déjà appliqués sont reconnus et sautés. Les lots de Retour au
travail et de Types de personnalité remplacent ceux du matin, sous le même nom. Pour Retour au travail, la v2
remplace la v1 si la note l'a déjà reçue, sinon elle est insérée sous « Cinq étapes ». Pour Types de personnalité, si
la note a déjà reçu la v1, la v2 la remplace ; si elle a encore la capture du livre, la v2 prend sa place et la légende
est retirée. Les fichiers `wiki-etapes-dun-retour-au-travail-reussi-parcours-v1.svg` et
`wiki-types-de-personnalite-et-lieu-de-controle-combinaisons-v1.svg` peuvent ensuite quitter le dossier Infographies.

## Le recueil législatif : la LSST n'est pas à jour

Relevé par les relecteurs des pages LMRSST et CNESST, vérifié. Le PDF de la LSST du recueil
(`docs/files/recueil-legislatif-sst/10-lois-principales/lsst/lsst-loi-sur-la-sante-et-la-securite-du-travail.pdf`)
porte « À jour au 26 mars 2024 ». `tools/textes-loi/LSST.json` et les pages d'articles en sont tirés.

- **Ancien texte** : les dispositions du programme de prévention et de la participation, remplacées par la LMRSST et
  en vigueur au plus tard le 6 octobre 2025 (LMRSST, art. 313, 7° : « lesquelles ne peuvent être postérieures au
  6 octobre 2025 »), y figurent dans leur version d'avant :
  - art. 58 : « catégorie identifiée à cette fin par règlement » ;
  - art. 59, al. 2, sans les risques psychosociaux ;
  - art. 68 : comité qui « peut être formé » à « plus de vingt travailleurs » ;
  - art. 87 à 92, 98 et 101.
- **Articles absents** : 58.1, 61.1, 61.2 (plan d'action), 68.1, 68.2, 78.1, 87.1, 88.1, 97.1 à 97.5 (agent de
  liaison) et 100.1.
- **Articles abrogés encore présents** : 84 à 86 et 95.
- **Terme remplacé** : « représentant à la prévention » y reste, alors que la LMRSST (art. 233, 3°) le remplace
  partout.
- **Mauvais marquage** : la page LMRSST du recueil marque « Disposition remplacée, non repris dans le wiki » les art.
  143, 150, 160 et 161 (et 171, 172, 176, 182), et « Article abrogé » l'art. 159. Ce sont pourtant les articles qui
  remplacent ceux de la LSST, et ils sont en vigueur.

Les schémas LMRSST et CNESST s'appuient donc sur les articles modificatifs de la LMRSST, dont le texte est dans le
recueil. Mettre la LSST à jour demande le PDF en vigueur de LégisQuébec, puis `node tools/extraire_textes_loi.mjs` et
une reconstruction : c'est une tâche à part.

## Relevé en chemin, non modifié (à trancher)

**Conséquences du stress sur la santé**

- « Données clés » : « 23 % le risque de maladie cardiovasculaire » et « 200 000 travailleurs ». La note Kivimäki
  (2012) porte sur la maladie coronarienne, avec 197 473 participants.
- « Le risque cumulatif sur 20 ans est substantiel » : sans source ; le suivi de l'étude va de 2 à 14 ans (médiane
  7 ans).
- L'essentiel : « Les méta-analyses sont sans ambiguïté… mortalité prématurée » : sans source. D'après leurs titres,
  aucune des trois références ne porte sur la mortalité.
- Tableau psychologique : « Risque doublé (Stansfeld & Candy, 2006) ». Le wiki n'a pas de note sur cet article, et sa
  note Theorell (2015) donne un OR de 1,74. Sont aussi sans source : « 1,5 à 2 fois », « conséquence directe » et
  « augmentation significative ».
- Les tableaux physique et comportemental s'intitulent « Conséquences documentées » sans rien citer. « 50 000 $ à
  200 000 $ » est sans source.
- La note Kivimäki se contredit : « 1 957 événements » d'un côté, « we recorded 2358 events » de l'autre.

**Communication souterraine et isolement de l'équipe**

- « Norme CSA Z1004 sur le travail isolé » : le recueil la donne comme norme d'ergonomie (« CSA Z1004 : Ergonomie en
  milieu de travail »).
- « Règlement minier sur les communications, Règlement S-2.1, r.14 » : S-2.1, r. 14 est le RSSM lui-même.
- Le téléphone est présenté comme une bonne pratique, alors que le RSSM, art. 283, l'impose.
- Le RSSM, art. 15, n'est pas cité à propos des vérifications et du travailleur seul. Il prévoit que « Tous les
  postes de travail doivent être vérifiés au moins une fois par quart de travail » et, pour un travailleur seul, un
  contact « au moins à toutes les 2 heures, sauf si ce dernier est à vue ».
- Chiffres sans source : « toutes les 1-2 heures », « 2-3 personnes », « plusieurs kilomètres », « plusieurs
  minutes ». Phrase sans sujet : « Compense par d'autres mécanismes ».

**Grille INSPQ**

- La liste des catégories : voir plus haut.
- « Conformément aux exigences de la LMRSST » est anachronique : la grille existait en avril 2018, et la LMRSST est de
  2021.
- « Outil québécois officiel », « le plus accessible et reconnu » : sans source. La page Obligation d'identifier les
  RPS le contredit : « La CNESST n'impose pas d'outil unique ».
- « Sans expertise pointue » : la fiche 2373 et la page Soutien social parlent d'une formation.
- « Annuellement » et le cycle T1 à T4 : sans source, et ce n'est pas un délai légal.
- La démarche en six étapes de la page n'est pas celle de la fiche 2373 : « informer et sensibiliser le milieu,
  évaluer le milieu à l'aide la Grille…, soutenir la prise en charge et faire un suivi du plan d'action ».
- La référence EQCOTESST a un titre et des éditeurs faux (fiche 2373, p. 6).

**Culture minière et stigmatisation**

- Bowers (2018) : le titre de la référence (« Suicide in fly-in, fly-out workers… ») ne correspond ni au DOI ni à la
  note d'analyse. Celle-ci donne « Psychological distress in remote mining and construction workers in Australia ».
- « Données clés » : ni les taux de suicide « significativement plus élevés » ni « les hommes consultent moins » n'ont
  de source.
- Sont aussi sans source :
  - « Effort continu sur 2-3 ans » ;
  - « malgré besoin documenté » ;
  - le présentéisme et le « risque accru d'accidents ».
- « Stigmatisation de courtoisie » semble employé dans un autre sens que l'usage (Goffman). « mca.com.au » est à
  vérifier.

**CNESST, rôles et pouvoirs**

- « Sanctions administratives », deux fois : dans la LSST, l'amende est pénale (art. 236 et 242).
- Avis de correction présenté comme automatique, deux fois. La LSST (art. 182) dit : « L'inspecteur peut, s'il
  l'estime opportun, émettre un avis de correction ».
- « Appel TAT » : la LATMP prévoit une révision (art. 358), puis une contestation devant le Tribunal (art. 359).
- Le harcèlement est rangé parmi les réclamations LATMP, alors que c'est une plainte selon la LNT (art. 123.6).
- La médiation est présentée comme un « Service ». Elle se fait avec l'accord des parties (LNT, art. 123.10).
- D'autres points n'ont pas d'appui ou sont inexacts :
  - « Salaire » pour les indemnités ;
  - l'inspection « annuelle » ;
  - la « politique anti-violence » ;
  - le « plan d'action », qui est l'outil des établissements sans programme de prévention (LSST, art. 61.1).
- Page Inspecteur CNESST et RPS :
  - le tableau gradué des sanctions contredit les art. 182, 236 et 242 ;
  - le « Plan d'action sur la violence (depuis 2024) » n'a pas d'appui.
- Page CNESST du recueil :
  - « Inspecteur (art. 238 LSST) » : les pouvoirs de l'inspecteur sont aux art. 177 à 186 ;
  - « Médecin désigné par l'employeur (art. 204 LATMP) » : l'art. 204 vise celui de la Commission, et celui de
    l'employeur est à l'art. 209.

**LMRSST, vue d'ensemble pour les RPS**

- La page présente l'agent de liaison comme seul mécanisme sous 20 travailleurs. Elle omet les cas où un représentant
  est exigé (LSST, art. 88 et 88.1, par la LMRSST).
- « Au cours de l'année » est absent.
- « Mutuelle de prévention » et « 1er octobre 2025 » ne sont pas dans le recueil.
- La page Obligation d'identifier les RPS écrit « Programme de prévention obligatoire » et « Mise à jour : Annuelle »,
  sans le plan d'action sous 20 travailleurs.

**Étapes d'un retour au travail réussi** (remarques du matin confirmées)

- « Plus de 50 % » de rechutes et « réduit drastiquement » : sans source. Le chiffre ne concorde pas avec « 30 à 50 %
  … (Joyce et al., 2016) » de Prévenir les rechutes après retour.
- « Obligation légale de soutenir le retour (assignation temporaire, aménagements raisonnables) » est inexact.
  L'assignation temporaire est une faculté (LATMP, art. 179 : « peut »). Ce que la loi impose : collaborer aux mesures
  de réadaptation (art. 170.2). Le droit au retour relève de l'art. 236, ou de la LNT (art. 79.1 et 79.4).
- La colonne « Fréquence » de l'étape 5 contient des buts. Sont sans source :
  - les mois ;
  - « 4 à 12 semaines » ;
  - l'indicateur à 12 mois.
- La référence Briand et al. (2007) a une revue fausse (International Journal of Law and Psychiatry, 30(4-5),
  444-457).

**Types de personnalité** : les remarques de la v1 restent (lien « p. 169 », références tronquées ou manquantes,
« Type D », « Sélection à l'embauche … illégal »).

## Vérifications

- Hors blocs de schéma, aucune ligne des pages n'a changé. Les blocs v1 de Retour au travail et de Types de
  personnalité sont remplacés.
- Tests : 267 réussis sur 268 ; le seul échec, `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur), `verif_publication --staged`, manifeste hors ligne régénéré.
- Chromium, `verif_rendu` : chaque page dans les cinq modes, aucun défaut.
- Aucune validation spécialisée n'est attestée.
