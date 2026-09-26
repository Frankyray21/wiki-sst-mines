# Six pages RPS illustrées dans le style de Frank (lot 10) — 26 septembre 2026

Demandes de Frank :
- « continue » ;
- « Améliore image, doit reproduire style à l'identique », puis « Même style que ces images », avec son infographie
  « CNESST — comprendre les 3 volets » :
  - fond marine ;
  - sections encadrées de vert, de bleu ou d'orange, avec médaillon rond ;
  - sous-cartes à puces ;
  - cartes à pictogrammes blancs ;
  - bandeau « Repère rapide » ;
- « Revoit, pas trop couleur, doit savoir une raison pour justifier utilisation couleur » (capture du schéma
  Foreur v2 au téléphone).

Trois versions se sont suivies le même jour :
- **v1** reprenait l'esprit de son image « Lieu de contrôle » ;
- **v2** refaisait les douze schémas à l'identique de la référence CNESST, cadres verts, bleus et orange compris ;
- **v3**, publiée maintenant, garde la mise en page de la v2 et applique la règle de couleur de Frank.

Le gabarit `tools/schemas-sombres/` produit exactement les SVG publiés et servira aux prochains schémas :
- **police** : Figtree, incorporée dans chaque SVG et réduite aux caractères employés (licence SIL OFL) ;
- **pictogrammes** : Material Design Icons (Pictogrammers Free License, Apache 2.0).

### Pourquoi chaque couleur (v3)

- **Structure neutre** : cadres, entêtes, médaillons et titres de colonne restent dans les bleus-gris du fond. Ils
  ne disent rien de plus que leur texte, ils n'ont donc pas de couleur.
- **Orange « ! »** : une condition de travail qui pèse (« un coût » sur les deux schémas du coût des RPS).
- **Vert, coche** : un levier de l'organisation.
- **Gris, point** : un élément neutre (le profil de scores du MBI, par exemple). Pas de légende.
- **Pictogramme blanc** : un fait ou une particularité, sans jugement (latitude, confidentialité, pénurie…).
- **Légende** sous le titre : chaque couleur employée y est nommée. Aucun schéma n'en emploie plus d'une.
- Jamais de ✗ : rien ne juge un travailleur.

Deux autres écarts avec la référence sont voulus :
- **taille du texte** : un peu plus grand que sur la référence, pour rester lisible au téléphone ;
- **mots** : tous tirés de la page, au plus raccourcis.

Ces affiches sont conçues sur fond sombre : le thème sombre du site ne les inverse plus (classe
« infographie-sombre »). Sur tablette, elles s'affichent jusqu'à 40 rem de large.

Chaque mot a été relu face à la page par trois relecteurs de fidélité (v2). La v3 est passée par un audit
(justification de chaque couleur, lisibilité au téléphone, mots), qui a corrigé :
- **Contremaître** : les deux leviers « Reconnaissance, conditions » portaient des pictogrammes au lieu de la coche
  verte ; l'étiquette « Niveau » isolée sur « Direction » est retirée ;
- **Foreur** : la latitude devient une section à part, comme dans le tableau de la page, au lieu de paraître découler
  de la responsabilité ; les cartes reprennent les mots de la page (« responsable de la foreuse et du chantier »,
  « coordination de son travail par le foreur », « communication avec le foreur ») ;
- **Confinement** : titre « Charge mentale en souterrain » (mot de la page) ; « face aux risques » rétabli dans
  l'en-tête ; les deux colonnes portent « Source de charge mentale », pour que « ! Procédures à suivre » ne se
  lise pas comme une consigne ; étiquettes « Un coût » et « Niveau » redondantes retirées ;
- **MBI** : sous-titre « Maslach Burnout Inventory » au lieu d'une formule absente de la page ;
- **Texte alternatif** : il donne aussi le sous-titre et la légende des couleurs ; espaces insécables autour du
  « ! ».

Le texte des articles n'est pas modifié : seuls les schémas changent, sur la page et, s'il y en a une, sur sa copie
encadrement.

## Pages

| Page | Schémas (v3) |
| --- | --- |
| [Foreur, profil RPS et leadership de chantier](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/foreur-profil-rps-et-leadership-de-chantier.html) | ce qui pèse : cartes foreur, aide-foreur, contremaître ; sections Charge (cognitive, physique), Responsabilité (risques particuliers) et Latitude (technique, managériale). Leadership de chantier : leviers par niveau, primaire, secondaire, tertiaire, comme dans la page |
| [Aide-foreur, profil RPS](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/aide-foreur-profil-rps.html) | ce qui pèse : sections Le poste et La relation (« Vulnérabilité particulière »). Leviers par niveau, comme dans la page |
| [Contremaître ou capitaine, profil RPS](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/contremaitre-ou-capitaine-profil-rps.html) | ce qui pèse : cartes direction, contremaître, équipe ; sections Pivot (pression bidirectionnelle) et Charge. Le soutenir : direction, formation et pairs, soutien et conditions |
| [MBI, épuisement professionnel](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/mbi-epuisement-professionnel.html) | les trois dimensions en cartes et leur interprétation : un sous-score par dimension, pas de total. Mesure ou diagnostic |
| [Coût économique des RPS pour l'employeur](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/cout-economique-des-rps-pour-lemployeur.html) | éléments de l'estimation par cas et coûts cachés, sans montant. Remplacer en mine : recrutement et logistique, remplacement |
| [Confinement, profondeur et charge mentale](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/confinement-profondeur-et-charge-mentale.html) | les six sources de charge mentale et le coût de l'adaptation. Les leviers par niveau (conception, procédures, équipe, soutien, surveillance) |

Aucun schéma n'ajoute de chiffre, de seuil, de montant ou de promesse d'effet.

## À faire dans le vault (sinon la prochaine construction efface ces schémas)

```
Get-ChildItem content-updates\2026-09-26-*-schemas.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
node tools/build_site.mjs
```

La boucle couvre tous les lots du jour. Les six lots du lot 10 sont remplacés sous le même nom. La v3 prend la place
de la version que la note porte, v2 ou v1 ; une note qui n'a reçu aucune version la reçoit sous la même ancre. Une
note qui porterait à la fois la v1 et la v2 est refusée, sans rien modifier. Ces cas sont simulés. Les fichiers
`…-v1.svg` et `…-v2.svg` du lot 10 peuvent ensuite quitter le dossier Infographies.

## En priorité : droit d'auteur du MBI

La page MBI lie deux fois `70-documents-et-outils/questionnaires/mbi-maslach-burnout-algorithme-et-interpretation.pdf`.
Ce PDF reproduit les énoncés du questionnaire (p. 1-2, « 2. MBI – Items »). Or la page présente l'instrument sous
« Licence commerciale », « distribué par Mind Garden ». La note INRS (2024) cite aussi des « exemples d'items ». À
retirer, ou à réduire à la partie interprétation. Les schémas ne reprennent aucun énoncé.

## À trancher (choix des schémas)

- **Densité** : le texte est un peu plus grand que sur la référence. Si tu préfères la densité exacte de ton image,
  le gabarit se règle en une ligne et les douze schémas se régénèrent.
- **Couleur** : si tu veux encore moins de couleur, la légende et les puces peuvent passer toutes en gris ; le
  schéma ne distinguerait alors plus ce qui pèse des leviers que par le titre.
- **Regroupements** : quelques sections réunissent deux niveaux voisins d'un même tableau, sans rien ajouter :
  - « Formation et pairs » et « Soutien et conditions » (Contremaître) ;
  - « Procédures et équipe » et « Soutien et surveillance » (Confinement).
- **Titres de section tirés de la page** : « Pivot » (« pivot entre opérations et direction ») et « Par cas »
  (« Estimation par cas »).
- **MBI** : le profil de burnout de la page (« épuisement élevé + cynisme élevé + accomplissement bas ») est en puces
  neutres. C'est un profil de scores, pas une condition de travail.

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
- Essai de pose avant chaque pose. Les lots du vault ont été simulés sur une note qui a reçu la v2, sur une note
  restée en v1 et sur une note sans schéma ; une note qui porte v1 et v2 est refusée.
- Chaque schéma n'emploie qu'une couleur de puce, nommée dans sa légende ; le reste est en bleu-gris.
- Chromium : sur la page, en thème sombre comme en clair, les affiches ne sont pas inversées (filtre « none »).
  Au téléphone, elles font 327 px de large ; sur tablette, 640 px.
- Tests : 287 réussis sur 288 ; le seul échec, `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur), `verif_publication --staged`, manifeste hors ligne régénéré.
- Chromium, `verif_rendu` : les six pages dans les cinq modes, aucun défaut.
- Le générateur du dépôt (`tools/schemas-sombres/lot10.py`) rend, octet pour octet, les douze SVG publiés (v3).
- Aucune validation spécialisée n'est attestée.
