# Bloc 2 : sources, renvois aux lois et forme (27 septembre 2026)

Frank a dit « go pour le bloc 2 », la partie contenu de la liste « Que reste-t-il à bonifier ». Tout est publié
directement dans `docs/`. Chaque changement de texte a aussi son lot pour le vault dans `content-updates/`. Sans ces
lots, la prochaine construction du site effacerait les changements (voir « À faire dans le vault »).

## 1. Sources des marques « (source à préciser) » (pages RPS)

Trois agents ont cherché une source pour chaque marque. Ils ne pouvaient qu'interroger un moteur de recherche : l'accès
direct aux sites est bloqué.

**Résultat :**
- 33 marques remplacées par une source vérifiée : 5 sont sourcées telles quelles, 28 reformulées pour dire ce que dit
  la source.
- 4 propositions sont écartées (voir plus bas).
- 87 marques restent sur les pages RPS, contre 116 sur main. Ce compte inclut les 3 marques posées aujourd'hui : le
  coût du programme de prévention (2 pages) et la courbe de Bradley.

**Vérification.** Aucune source n'est posée sur la seule foi d'un agent. Pour chaque référence :
- le DOI ou l'adresse, et les chiffres cités, apparaissent tels quels dans un résultat de recherche. C'est contrôlé
  automatiquement dans la transcription de l'agent, sur les résultats d'outil et non sur son propre texte ;
- les deux citations de l'INSPQ sur le FIFO sont vérifiées dans le PDF déposé dans le wiki (p. 2 et p. 5) ;
- les références concordent avec ce que l'on sait de ces publications.

**Limite.** Le quota de 200 recherches web de la session a été épuisé en cours de route : 44 marques n'ont pas été
cherchées du tout. Elles restent marquées. Pour les reprendre, relancer une session avec un quota relevé (variable
`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`).

| Page | Source posée | Ce qui change |
|---|---|---|
| Conséquences du stress | Goh, Pfeffer et Zenios (2016), *Management Science* | « sans ambiguïté » → « vont dans le même sens », avec les rapports de cotes de la méta-analyse (228 études) |
| Conséquences du stress | Lavigne-Robichaud et al. (2023), *Circ Cardiovasc Qual Outcomes* | « risque cumulatif substantiel » → risque coronarien doublé sur 18 ans (job strain + déséquilibre efforts-récompenses, hommes) |
| Conséquences du stress | Madsen et al. (2017), *Psychological Medicine* | dépression : « risque doublé » → +77 % (études publiées), +27 % (dépression hospitalisée) ; Stansfeld et Candy gardé |
| Conséquences du stress | Melchior et al. (2007), *Psychological Medicine* | anxiété généralisée : « 1,5 à 2 fois » → risque environ doublé avec des exigences élevées |
| Conséquences du stress, MBI, note INRS | OMS (2019), communiqué CIM-11 | burnout : phénomène lié au travail, non classé comme maladie (la note INRS disait « diagnostic clinique valide ») |
| Conséquences du stress | Milner et al. (2018), *Occup Environ Med* | idéation suicidaire : augmentation significative |
| Coût économique des RPS | Evans-Lacko et Knapp (2016) ; EU-OSHA (2014) | présentéisme : « 2 à 3 fois » → 5 à 10 fois l'absentéisme pour la dépression ; rapport coût-bénéfice « favorable » (sans « largement ») |
| Culture minière | Galdas et al. (2005), *J Adv Nurs* | les hommes consultent moins ; « attendent plus longtemps » reste marqué |
| Retour au travail (8 passages, 4 pages) | Arends et al. (2013), *PLOS ONE* ; Arends et al. (2014), *Occup Environ Med* | « plus de 50 % de rechutes » → 62 % (suivi habituel) contre 39 % (accompagnement structuré) dans un essai néerlandais |
| Soutien post-événement, Gestion post-incident | Roberts et al. (2019) ; Geoffrion et al. (2022) ; Santiago et al. (2013) | taux reformulés (14-36 % de stress aigu, 17 % de TSPT à 12 mois) ; efficacité réservée à la TCC centrée sur le trauma |
| Aide-foreur, Contremaître | Pelletier, Vézina et Mantha-Bélisle (2018), INSPQ | études FIFO recensées par l'INSPQ ; faible soutien du supérieur associé aux problèmes de santé psychologique |
| Séparation famille en FIFO | Meredith et al. (2014), AIFS | « risque accru » → effets négatifs, positifs ou minimes selon le contexte |
| Axe HHS | Dhabhar (2018) | « quelques heures » → « quelques minutes à quelques heures » |
| Types de personnalité | Grande et al. (2012) ; CDPDJ (1998) ; Denollet (2005) | type D : pronostic cardiaque (effet qui diminue avec les années) ; sélection sur la personnalité « illégale » → « juridiquement suspecte » ; référence Denollet complétée |
| PAE | Csiernik (2003) | « 5 % à 15 % » → 9,2 % en moyenne (102 organisations canadiennes) |

**Propositions écartées :**
- **Grille INSPQ, « outil le plus accessible et reconnu »** : la phrase trouvée venait d'une autre page de l'INSPQ que
  celle citée.
- **Séparation, « taux plus élevés »** : la preuve est un résumé de presse, et elle inverse l'affirmation. La revue de
  l'AIFS dirait qu'aucune preuve empirique ne montre des taux plus élevés : à vérifier dans le PDF de l'AIFS.
- **Axe HHS, « l'un des quatre systèmes »** : la source parle de deux composantes principales, ce qui contredirait la
  phrase suivante (« les trois autres systèmes »). Il faut réécrire le passage entier.
- **Coût, programmes individuels « faible ROI »** : LaMontagne et al. (2007) mesurent l'efficacité, pas le rendement.

**Dans les lots.** Chaque correction remplace la retouche du lot précédent qui avait posé la marque (même passage).
Une note du vault qui a déjà reçu la version marquée passe à la version sourcée (champ `ancienApres`). Un nouveau test
le vérifie pour chaque lot concerné.

## 2. Renvois aux lois (Ergonomie, Hygiène, Toxicologie, Sécurité, Droit du travail)

Six agents ont vérifié chaque renvoi « art. X » de ces wikis contre le texte officiel du recueil
(`tools/textes-loi/*.json`, LMRSST comprise). Seules les erreurs certaines sont corrigées. Le motif de chaque retouche
recopie la phrase de loi qui la fonde ; un contrôle automatique a retrouvé chaque citation mot pour mot.

HYGIENE_TOXICOLOGIE_CHIFFRES

**Exemples de corrections :**
- **Cadenassage** : les articles 188.1 à 188.13 du RSST portent « (Remplacé). » ; la sous-section est aujourd'hui aux
  articles 195 à 207 (retrait d'un cadenas oublié : art. 206).
- **Inspecteur** : il visite « à toute heure raisonnable du jour ou de la nuit », et non « en tout temps » (LSST,
  art. 179).
- **Poursuites pénales** : elles sont intentées par la Commission (LSST, art. 242), et non par le DPCP.
- **Objet de la LSST** : « intégrité physique et psychique » (ajout de la LMRSST).
- **Formes juridiques** : « art. 51, 11° » au lieu de « art. 51.11 » ; « art. 242, al. 1 » au lieu de « 242.1 » ;
  l'article 221.1 de la LATMP n'existe pas (c'est l'art. 221).
- **Mauvais article** : le bénéficiaire est défini à l'art. 2 de la LATMP (et non 1) ; la formation du cariste est à
  l'art. 256.3 du RSST (et non 256.2) ; la semaine normale de travail est à l'art. 52 de la LNT (et non 78).
- **Liens** : les nouveaux renvois ajoutés dans les pages s'affichent aussi dans « Pages qui pointent ici » des pages
  visées, et dans le graphe.

**Non corrigé, à trancher par Frank (décisions de fond) :**
- **Programme de santé et médecin responsable (LSST, art. 107 à 126)** : régime abrogé ou remplacé par la LMRSST, en
  vigueur au plus tard le 6 octobre 2025. Les pages « LSST, programmes et inspection » et « LSST, droits et
  obligations » (comités SST, art. 68 à 86) le décrivent encore : il faut une réécriture de fond.
- **Page art-167 du RSST (siège ergonomique)** : toute la page repose sur un faux texte de l'art. 167, qui porte en
  réalité sur le travail dans des piles.
- **Wiki Sécurité** :
  - un « Cas type 1 » générique (maintenance, énergie résiduelle) revient sur 13 pages d'articles qu'il n'illustre pas ;
  - un paragraphe de jurisprudence sur l'exposition chimique figure sur les pages de cadenassage.
- **Libellés égaux au titre d'une page du recueil** : la page Conciliation travail-famille renvoie aux art. 79.1, 80
  et 81 de la LNT pour de mauvais congés. D'autres cas sont dans les rapports des agents. Seul un changement de lien
  dans la note peut les corriger.
- **Liens automatiques du générateur** : `lierTexteLegal` ignore le sigle écrit avant le numéro. Par exemple,
  « RSSM art. 109 » mène à la LSST, art. 109. C'est à corriger dans `tools/build_site.mjs`.
- **Montants de récidive du constat d'infraction** : ils ne correspondent pas à l'art. 236 de la LSST ; les montants
  indexés ne sont pas dans le recueil.

## 3. Références invérifiables

La règle du contrôle de forme a été reproduite sur les pages publiées. Le rapport de qualité publié (`qualite.html`,
14 pages) date d'avant le correctif du 21 septembre. Selon la règle actuelle, 11 pages étaient touchées ; il en reste 7.
- **Références précisées** :
  - Communication ascendante : Tourish et Robson (2006), Detert et Edmondson (2011) ;
  - Communication latérale : Wenger (1998) ;
  - Coût économique des RPS : EU-OSHA (2014).
- **Contrainte thermique (encadrement)** : la section « Pour aller plus loin » affichait un lien tronqué, écrit en
  toutes lettres (« [[Wiki SST/20 - Articles internes/… prévent »). Il redevient un lien vers « Hiérarchie des moyens
  de prévention ».
- **Lignes gardées** : les lignes trop générales (« Guides de gestion d'équipe ») et les documents internes (notes de
  cours SST1010) ne désignent aucune publication précise. Sept lignes qui nomment un organisme (IRSST, INRS, CSMC, MSSS,
  CSA) n'ont pas pu être cherchées, faute de quota.

## 4. Incohérences relevées

- **Grille de l'INSPQ, « huit dimensions »** : la grille compte 12 indicateurs en deux parties (Recueil de fiches de
  l'INSPQ, déjà cité sur la page Grille INSPQ). Quatre pages sont corrigées : la note d'analyse INSPQ (2021), Démarche
  de prévention des RPS, Prévalence au Québec et RPS au travail. La page Justice organisationnelle le disait déjà.
- **Coût d'un programme de prévention** : « quelques milliers de dollars par année » (Démarrage rapide pour direction
  et RH ; Lien entre RPS et invalidité prolongée) contre « 50 000 à 200 000 $ par année » (Coût économique des RPS).
  Aucune des estimations n'a de source et aucune n'a pu être vérifiée : les trois portent la marque. **À Frank de
  choisir l'ordre de grandeur et sa source.**
- **Courbe de Bradley** (De la conformité à la prévention) : le schéma en caractères tenait sur une seule ligne de la
  note. Il devient une phrase avec les quatre stades et leurs citations. Le constat « la plupart des organisations en
  industrie lourde » est marqué.

## 5. Forme

- **Phrases d'ouverture** : les 133 pages du rapport publié datent d'avant le correctif du 21 septembre :
  - 113 s'ouvrent sur « L'essentiel : … » après la table des matières manuelle ;
  - 18 sont des notes d'analyse (exemptées) ;
  - 2 ouvrent sur une image, puis du texte.

  Une seule page en manquait vraiment : le résumé Theorell (2015). Sa phrase a été rédigée depuis la page seule, puis
  réfutée et corrigée (lot `2026-09-27-phrases-introduction.json`, à poser avec `tools/appliquer_intros.mjs`).
- **Affichage au téléphone** : les 4 272 pages publiées ont été balayées à 390 px. Deux défilaient de côté ; les deux
  sont corrigées dans `tools/style.css` :
  - l'encadré « En bref » de l'art. 5.2.1 du CSTC (une ligne de soulignés tirée du tableau du PDF) ;
  - le titre « LOT 3 - NOTES INSTITUTIONNELLES/COMPLÉMENTAIRES ».
- **Outils non finalisés (31) et traçabilité (relecteur daté)** : rien n'est changé. Ces indicateurs décrivent le
  processus de Frank (outil réellement disponible, relecture attestée) et ne se corrigent pas à sa place.

## À faire dans le vault

```
node tools/rejouer_lots.mjs --vault "C:/…/WIKI SST - Mines"                          # essai de tous les lots
node tools/rejouer_lots.mjs --vault "C:/…/WIKI SST - Mines" --appliquer --construire
node tools/appliquer_intros.mjs --lot content-updates/2026-09-27-phrases-introduction.json --appliquer
```

`rejouer_lots.mjs` prend tous les lots, dont les nouveaux lots `2026-09-27-corr-lois-*.json` et `2026-09-27-corr-*.json`.
