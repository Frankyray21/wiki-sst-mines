# Six pages RPS illustrées — 26 septembre 2026

Suite de la demande « continue à bonifier des pages dans la section RPS ». Chaque schéma a été dessiné d'après la seule
page (et les pages qu'elle cite), puis relu par un relecteur contradictoire qui l'a confronté mot à mot au texte.
Dans le wiki SST psychosociale, le texte des articles n'est pas modifié : seuls les schémas s'ajoutent (page publiée
et copie de l'espace encadrement). Les erreurs de page relevées en chemin sont listées plus bas, sans correction.

## Pages

| Page | Schéma | Placé sous |
| --- | --- | --- |
| [Modèle de Sélye, syndrome général d'adaptation](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/modele-de-selye-syndrome-general-dadaptation.html) | courbe de la réponse du corps quand le stress dure : pointe d'alarme, longue résistance où la dette physiologique s'accumule, effondrement | « Point clé : la phase de résistance… » |
| [Définition du stress professionnel](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/definition-du-stress-professionnel.html) | balance exigences et ressources (ce qui manque : le soutien) ; stress aigu et stress chronique, sans graduation | Mécanismes ; précaution pour le terrain |
| [Étapes d'un retour au travail réussi](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/etapes-dun-retour-au-travail-reussi.html) | parcours du même travailleur en cinq étapes, noms et ordre de la page, sans durée ni mois | Cinq étapes |
| [Premiers signes en mine, ce que les superviseurs voient](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/premiers-signes-en-mine-ce-que-les-superviseurs-voient.html) | d'habitude et maintenant, un signal par catégorie ; en rouge, la consigne de l'encadré pour les idées suicidaires, mot pour mot | Signaux par catégorie |
| [Séparation famille et conjoint en FIFO](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/separation-famille-et-conjoint-en-fifo.html) | boucle maison et site : départ, absence, retour, retrouvailles, nouveau départ ; ce que vit chacun, avec les mots des tableaux | Réalité de la séparation |
| [Soutien post-événement traumatique structuré](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/soutien-post-evenement-traumatique-structure.html) | ordre des phases sur un axe du temps sans délai ; rencontre collective optionnelle, sans debriefing imposé | Phases d'intervention |

Aucun schéma n'ajoute de chiffre : les pourcentages, délais et mois sans source des pages ne sont pas repris.

## À faire dans le vault (sinon la prochaine construction efface ces schémas)

Un lot par page, `content-updates/2026-09-26-<page>-schemas.json`. Essai d'abord, puis sous Windows (PowerShell) :

```
Get-ChildItem content-updates\2026-09-26-*-schemas.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
node tools/build_site.mjs
```

Chaque lot copie le schéma dans le dossier Infographies et insère son bloc sous la ligne indiquée ci-dessus.

## Relevé en chemin, non modifié (à trancher)

**Modèle de Sélye**

- Le nom s'écrit « Selye » dans les publications d'origine et dans la note d'analyse du wiki. La page écrit
  « Sélye » partout, jusque dans les références APA.
- La datation n'est pas cohérente. L'essentiel et les Limites disent « années 1950 ». La Définition et la première
  référence disent 1936 (Nature, 138, 32).
- L'essentiel dit « face à un stress, le corps passe par trois phases ». L'épuisement ne survient que si le stresseur
  persiste (note d'analyse). Formulation possible : « face à un stress qui dure ».
- Le tableau range le MBI parmi les maladies. Le MBI est un questionnaire qui mesure l'épuisement professionnel.
- « Obligations d'identification précoce des RPS » : le mot « précoce » n'est pas dans la LMRSST. Ce que la loi
  prévoit, c'est l'identification et l'analyse des risques, dont les risques psychosociaux.

**Définition du stress professionnel** : aucune erreur relevée.

**Étapes d'un retour au travail réussi**

- « Plus de 50 % » de rechutes, sans source (L'essentiel, Pourquoi structurer). Le même chiffre figure sur
  Prévenir les rechutes après retour et sur la page thématique Retour au travail. La note d'analyse Briand et al.
  (2008) ne donne aucun taux.
- « Obligation légale … assignation temporaire, aménagements raisonnables » est inexact au regard de la LATMP :
  - l'assignation temporaire est une faculté de l'employeur (art. 179 : « peut »), qui demande l'avis favorable du
    professionnel de la santé qui a charge du travailleur ;
  - l'employeur doit collaborer aux mesures de réadaptation, « sous réserve de la démonstration d'une contrainte
    excessive » (art. 170.2) ;
  - ces mesures peuvent comprendre un retour progressif (art. 167, 9°).

  Hors lésion professionnelle, c'est la LNT qui s'applique (art. 79.1 et 79.4). L'accommodement raisonnable relève
  de la Charte, qui est absente du recueil.
- Étape 5 : la colonne « Fréquence » contient des objectifs. Les mois (1, 3, 6, 12) et « 4 à 12 semaines » n'ont pas
  de source.
- Référence Briand 2007 : la revue citée est fausse. La note d'analyse donne International Journal of Law and
  Psychiatry, 30(4-5), 444-457.
- Deux points de dessin sont à confirmer par toi :
  - l'étape 2 montre les acteurs autour d'une table, alors que la page liée décrit surtout des échanges indirects ;
    si tu le préfères, le dessin peut relier chaque acteur au plan par un trait ;
  - les numéros d'étape viennent de la page elle-même.

**Premiers signes en mine**

- Programme « Travailleur Avisé » de la CNESST : nom et existence non sourcés, sur quatre pages.
- « INSPQ. Trousse d'outils pour la surveillance de la santé mentale » : référence sans année ni lien.
- Deux précisions sans source : « Lundis, vendredis, lendemains de quart » et « (24/7) ».
- L'encadré dit « demander de l'aide sans attendre plusieurs jours ». Le tableau dit « Demander une aide
  professionnelle sans attendre ». Le schéma suit l'encadré.

**Séparation famille et conjoint en FIFO**

- Les parts d'événements familiaux manqués (~50 %, ~67 %, ~75 %) et les semaines d'absence sont un calcul d'après la
  durée du cycle, pas une mesure. Elles ne sont pas sourcées.
- « Les recherches montrent… » et les colonnes « Effet documenté » ne citent rien. Les deux références de la page
  (Roche et al., 2016 ; Asare et al., 2021) n'ont ni note d'analyse ni PDF dans le wiki.
- Plusieurs affirmations sans source :
  - « le 14/14 est mieux toléré » ;
  - les taux de séparation ;
  - l'insatisfaction qui augmente avec les rotations ;
  - les effets sur les enfants.
- Coquilles : point final manquant (« Le conjoint resté à la maison ») ; « mitigées; dépend » (espace manquante). Sur
  Réintégration au foyer, « Droit à la réadaptation » semble une coquille pour « Début de la réadaptation ».

**Soutien post-événement traumatique structuré**

- La rencontre de groupe « optionnelle » n'a pas de source. La seule référence, Rose et al. (2002), vise le
  debriefing ; selon des résumés non vérifiés ici, la revue ne trouve aucune preuve d'effet préventif.
- « Réduit significativement le risque de TSPT » : non sourcé.
- « 30 à 50 % » de symptômes aigus et « 5 à 30 % » de TSPT durable : non sourcés, et repris par Gestion post-incident
  en SST.
- Les délais du tableau des phases ne concordent pas avec ceux du protocole minier de la même page. Le schéma ne
  garde que l'ordre des phases.

## Vérifications

- Hors blocs de schéma, aucune ligne des douze fichiers (pages et copies encadrement) n'a changé.
- Tests : 256 réussis sur 257 ; le seul échec, `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur), `verif_publication --staged`, manifeste hors ligne régénéré.
- Chromium, `verif_rendu`, six pages dans les cinq modes. Un défaut signalé sur Définition du stress professionnel :
  des appels de note trop petits pour le doigt. Il est présent avant l'ajout des schémas et n'est pas lié à eux.
- Aucune validation spécialisée n'est attestée.
