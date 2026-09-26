# Six pages RPS illustrées dans le style de Frank (lot 10) — 26 septembre 2026

Demandes de Frank :
- « continue » ;
- le style de son image « Lieu de contrôle », qu'il a choisi comme modèle des nouveaux schémas :
  - grand titre ;
  - panneaux à pastille et bandeau ;
  - phrases courtes ;
  - gros personnages ;
  - message clé en bleu en bas.

Trois règles du wiki restent : pas de ✓ ni de ✗ qui jugeraient un travailleur, des phrases tirées de la page, le
rouge pour ce qui pèse et le bleu pour les leviers.

Chaque schéma a été dessiné d'après la seule page, refait dans ce style, puis relu par un relecteur contradictoire.
Celui-ci l'a confronté mot à mot à la page et, pour les points juridiques, aux textes du recueil. Le texte des
articles n'est pas modifié : seuls les schémas s'ajoutent, sur la page et, s'il y en a une, sur sa copie
encadrement.

## Pages

| Page | Schémas |
| --- | --- |
| [Foreur, profil RPS et leadership de chantier](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/foreur-profil-rps-et-leadership-de-chantier.html) | ce qui pèse sur le foreur : charge (décisions techniques, surveillance multiple, pression de production), sécurité de soi et de l'aide-foreur. Leadership de chantier : les leviers sur le foreur et sur le binôme |
| [Aide-foreur, profil RPS](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/aide-foreur-profil-rps.html) | ce qui pèse sur l'aide-foreur : le poste (cadence imposée par l'équipement), la relation (dépendance forte). Les leviers de l'organisation, autour du poste et de la relation |
| [Contremaître ou capitaine, profil RPS](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/contremaitre-ou-capitaine-profil-rps.html) | le contremaître entre la direction qui pousse et l'équipe qui réclame ; sa charge mentale. Le soutenir : direction, back-up, formation, pairs, PAE |
| [MBI, épuisement professionnel](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/mbi-epuisement-professionnel.html) | les trois dimensions, chacune avec son côté à risque, en dégradé, sans seuil ni total. Une mesure, pas un diagnostic |
| [Coût économique des RPS pour l'employeur](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/cout-economique-des-rps-pour-lemployeur.html) | coûts visibles et coûts cachés, sans aucun montant. Ce qui alourdit le remplacement en mine |
| [Confinement, profondeur et charge mentale](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/confinement-profondeur-et-charge-mentale.html) | la vigilance permanente qui s'ajoute à la tâche, dans une galerie vue dans l'axe. Les leviers : éclairage, repères, listes de vérification, pauses, rotation |

Aucun schéma n'ajoute de chiffre, de seuil, de montant ou de promesse d'effet. Les objets dessinés sont des
exemples (vanne, jumbo, détecteur, chargeuse), et les légendes le disent.

## À faire dans le vault (sinon la prochaine construction efface ces schémas)

```
Get-ChildItem content-updates\2026-09-26-*-schemas.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
node tools/build_site.mjs
```

La boucle couvre tous les lots du jour. Les lots déjà appliqués sont reconnus et sautés.

## En priorité : droit d'auteur du MBI

La page MBI lie deux fois `70-documents-et-outils/questionnaires/mbi-maslach-burnout-algorithme-et-interpretation.pdf`.
Ce PDF reproduit les énoncés du questionnaire (p. 1-2, « 2. MBI – Items »). Or la page présente l'instrument sous
« Licence commerciale », « distribué par Mind Garden ». La note INRS (2024) cite aussi des « exemples d'items ». À
retirer, ou à réduire à la partie interprétation. Les schémas ne reprennent aucun énoncé.

## À trancher (choix des schémas)

- **Foreur** :
  - pas d'étiquettes FOREUR et AIDE-FOREUR dans le binôme ;
  - « Rôle de leadership reconnu » perd « institutionnelle » ;
  - « Latitude technique réelle, responsabilités lourdes » : la virgule remplace « mais ».
- **Aide-foreur** :
  - message clé « Vulnérabilité particulière : la dépendance à la relation », ou la phrase exacte « Dépendance
    forte à la qualité de la relation avec le foreur » ;
  - leviers regroupés par poste et par relation, alors que la page les classe par niveau de prévention.
- **Contremaître** :
  - le message « Reconnaître le rôle de contremaître » vient d'une seule ligne du tableau et peut se lire comme
    le levier principal ;
  - « Charge mentale élevée » coiffe aussi la sécurité de l'équipe, que le tableau range en charge émotionnelle.
- **MBI** :
  - trois bandes, alors que le style prévoit deux panneaux au plus ;
  - noms courts des dimensions (« Cynisme » pour « Dépersonnalisation ») ;
  - « Burnout ? » figure parmi les diagnostics, comme dans la page, qui dit pourtant que le burnout n'est pas un
    diagnostic médical.
- **Coût des RPS** :
  - le message « Les RPS coûtent cher » (L'essentiel) ne montre plus la prévention ;
  - « Visibles » est un mot du schéma : la page n'a que « Coûts cachés » ;
  - l'avion et le camp ne valent que pour les sites en rotation.
- **Confinement** :
  - « Agir avant l'épuisement » ampute « Le reconnaître permet » ;
  - « Orientation sans repères naturels » est rangée sous « Vigilance », alors que le tableau en fait la ligne
    « Repérage spatial » ;
  - l'ancre courte « Leviers » ne doit désigner qu'une ligne de la note.
- **Série** : les silhouettes du contremaître diffèrent un peu de celles du foreur et de l'aide-foreur (bras,
  planchette).

## Relevé en chemin, non modifié (à trancher)

**Foreur**

- Encadré « Effet multiplicateur » : effet affirmé et chiffré (« des dizaines ») sans source. « c'est des dizaines »
  devrait être « ce sont des dizaines ».
- « Effet en cascade » (L'essentiel) : sans source. Bowers et al. (2018) porte sur le superviseur immédiat et
  l'étude est transversale : la causalité n'y est pas établie. Dans le tableau de la note, le stress lié au
  superviseur (OR 4,3) vient au 5e rang, pas en « prédicteur dominant ».
- Autres points sans appui :
  - le surengagement « lié à l'identification au métier » est absent de la note Siegrist ;
  - la colonne « Effet » des comportements de leadership ne cite aucune étude ;
  - la reconnaissance « souvent meilleure que celle de l'aide-foreur » est une comparaison sans source.
- Termes : « cachage des erreurs » pour « dissimulation » ; « Intimidation → Iso-strain » est un raccourci.
- La formation au leadership est « Primaire » ici et « Secondaire » sur la page Aide-foreur.
- La page pourrait rappeler que la formation et la supervision incombent à l'employeur (LSST, art. 49, 3°, et 51,
  9°).

**Aide-foreur**

- « L'un des postes miniers les plus exposés au job strain » : classement sans source. Les deux références n'ont ni
  titre ni année.
- Encadré « Action à fort effet » (« transforme », « à coût faible ») : sans source.
- « Job strain | Charge élevée + faible contrôle » : le modèle croise la demande psychologique et la latitude, pas la
  charge physique. Le lien « job strain » mène à Iso-strain alors que la page Job strain existe.
- Ligne Horaires : « quart 12 h » est sans source, et le lien affiche en pleine phrase le titre complet du
  comparatif des cycles FIFO. Même défaut sur Opérateur d'équipement lourd.
- « Premier poste pour beaucoup… » est rangé parmi les tâches.

**Contremaître**

- « L'un des postes les plus exposés au burnout… celui qui a le plus d'effet » : deux classements sans source. La
  page reconnaît n'avoir « aucune référence précise ».
- Autres affirmations sans source :
  - « taux élevés de burnout et de troubles d'adaptation » ;
  - « multiplicateur d'effet » ;
  - les tableaux « Effet sur l'équipe » (« réduit iso-strain », « Réduit ERI »).
- La LSST (art. 1) exclut le contremaître de la définition de « travailleur » ; la page n'en dit rien.
- La note Bowers et al. (2018) libelle ses liens PDF « Roberts et al., 2018 ».

**MBI**

- Le lien « Maslach 1981 p. 1 » ouvre une fiche qui cite Maslach (1996) et Langballe et al. (2006). Coquille dans
  son titre : « Invenvotory ».
- Chiffres et affirmations sans source :
  - « 10 à 15 minutes », alors que la note INRS dit 5 à 10 ;
  - « ~3-5 $ par administration » ;
  - « cause fréquente d'invalidité reconnue par la CNESST » ;
  - « le CBI est souvent préféré ».
- Le mot « burnout » n'est pas dans la LATMP. La reconnaissance passe par l'art. 2 (lésion professionnelle,
  maladie professionnelle).
- « Ni à la CIM-10 » est probablement inexact : de mémoire, l'OMS (2019) dit que le burn-out y figurait déjà. Non
  vérifié ici.
- Hors page :
  - la note INRS parle d'une « cotation INVERSÉE » de l'accomplissement, que la fiche liée contredit ;
  - la page Accomplissement personnel se contredit ;
  - la note INRS fait du burnout « un diagnostic clinique valide ».

**Coût des RPS**

- Tous les montants et ratios sont sans source précise :
  - 2 à 5 $ par dollar, attribué tantôt à la prévention primaire, tantôt à un « programme intégré » ;
  - 25 000 à 200 000 $, plus de 300 000 $, « 2-3 fois », 250 000 à 3 000 000 $ ;
  - « à partir de 50 000 à 200 000 $ », qui se contredit ; Démarrage rapide pour direction et RH dit « quelques
    milliers de $ par année ».
- LATMP :
  - indemnités et hausse de cotisation risquent d'être comptées deux fois (art. 124, 60 et 326) ;
  - le taux personnalisé ne vise que certains employeurs (art. 304.1) ;
  - l'indemnité est plafonnée au maximum annuel assurable (art. 65).
- « Sanctions administratives » : dans la LSST, l'amende est pénale (art. 236). La seule sanction administrative
  pécuniaire du recueil vise le retour au travail (LATMP, art. 170.4, inséré par la LMRSST, art. 40).
- Comparer le coût total des cas au coût d'un programme ne donne pas un rendement. « Meilleur ROI », « ROI faible »
  et « contagion plus forte » sont sans source.
- Des liens affichent le nom long de la note liée (« Hausse de cotisation CNESST, rôles et pouvoirs »). C'est réglé
  par `tools/raccourcir_liens.mjs` (note `2026-09-26-libelles-liens.md`).

**Confinement**

- Mise en forme :
  - une phrase entière occupe la colonne « Concept » du tableau, à côté d'une cellule vide ;
  - « vs » est un anglicisme ;
  - il manque le deux-points après « Mais cette adaptation a un coût ».
- « Refus ou évitement de certaines tâches souterraines » est présenté comme un signal, sans rappeler le droit de
  refus (LSST, art. 12 et 13 ; « ou psychique » inséré par la LMRSST, art. 233).
- Sans source : les niveaux d'alerte, « La majorité… », « plus rare », « Quart de 12 h ».
- Références :
  - Siffre (1962) porte sur le rythme circadien ;
  - aucune des deux notes citées n'appuie les tableaux ;
  - trois références ne désignent aucun document identifiable.
- Les refuges sont présentés comme zones de pause ; le RSSM (art. 126 à 128) les encadre comme salles de refuge.

**Hors de ces pages** : 22 des 45 notes « Analyse… » affichent des restes de surlignage coloré (« ={red}… = »), que le
générateur ne traduit pas. C'est à traiter à part.

## Vérifications

- Hors blocs de schéma, aucune ligne des huit fichiers (pages et copies encadrement) n'a changé.
- Essai de pose avant la pose pour chaque page.
- Quatre relecteurs n'ont pas pu écraser les fichiers du dessinateur : le système de permissions l'a refusé. Ils
  ont écrit leurs versions corrigées dans un dossier à part, d'où elles ont été posées, sans rien écraser.
- Tests : 284 réussis sur 285 ; le seul échec, `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur), `verif_publication --staged`, manifeste hors ligne régénéré.
- Chromium, `verif_rendu` : les six pages dans les cinq modes, aucun défaut.
- Aucune validation spécialisée n'est attestée.
