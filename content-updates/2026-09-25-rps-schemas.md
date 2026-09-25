# Pages RPS illustrées (neuf pages) — 25 septembre 2026

Demande de Frank : « continue à bonifier des pages dans la section RPS », puis « déploie avant qu'il ne reste plus de
tokens ». Le texte des articles du wiki SST psychosociale n'est pas modifié (convention de l'auteur) : on ajoute des
schémas, on retire seulement les captures fausses ou tierces et leur légende.

Chaque schéma a été dessiné d'après la page, ses notes d'analyse et, pour le harcèlement, le texte officiel de la LNT.
Chaque dessinateur a vérifié ses sources, le rendu en clair et en sombre et la pose. La relecture contradictoire
était en cours au moment de la publication : ses corrections suivront.

## Pages modifiées

| Page | Ce qui change |
| --- | --- |
| [Médiation et résolution de conflits](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/mediation-et-resolution-de-conflits.html) | Grille de Thomas-Kilmann (souci de soi, souci de l'autre, cinq styles) à la place d'une capture qui montrait la courbe de Selye ; échelle des niveaux d'intervention, la procédure formelle mise à part |
| [Modèle de Siegrist](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/modele-de-siegrist-desequilibre-efforts-recompenses.html) | Balance efforts / récompenses dessinée pour le wiki, à la place d'une diapositive tierce (filigrane e-psychiatrie.fr) |
| [Communication descendante](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/communication-descendante.html) | Modèle de la communication (émetteur, message, canal, bruit, récepteur, rétroaction), à la place d'une pyramide de Maslow |
| [Définition des risques psychosociaux](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/definition-des-risques-psychosociaux.html) | Cumul des facteurs de risque, à la place d'une pyramide de Maslow ; la capture des six familles, de l'auteur, reste |
| [Comparatif des cycles FIFO](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/comparatif-des-cycles-fifo-14-14-20-10-21-7.html) | Les cycles 14/14, 20/10 et 21/7 jour par jour (après relecture, sans les qualificatifs de récupération en congé : leurs sources ne sont pas dans le wiki) |
| [Démarche de prévention en RPS, étapes](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/demarche-de-prevention-en-rps-etapes.html) | Les six étapes en boucle, posées sur les conditions de réussite |
| [Harcèlement psychologique au travail](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/harcelement-psychologique-au-travail.html) | Définition de la LNT, art. 81.18 : conduite répétée ou conduite grave unique, et leurs conditions |
| [Les trois niveaux de prévention](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/les-trois-niveaux-de-prevention.html) | Trois niveaux, trois moments (à la place d'une pyramide de Maslow) ; un exemple minier par niveau, cycles FIFO et quarts de nuit (à la place d'une courbe de Selye) |
| [Reconnaissance et déséquilibre efforts récompenses](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/reconnaissance-et-desequilibre-efforts-recompenses.html) | Modèle élargi : une demande, trois appuis (latitude, soutien, reconnaissance), à la place d'une pyramide de Maslow |

Toutes ces pages, sauf Harcèlement et Reconnaissance, ont aussi une copie dans l'espace encadrement, modifiée de la
même façon.

## À faire dans le vault (sinon la prochaine construction efface ces changements)

Sous Windows (PowerShell), depuis le dossier du projet :

```
$lots = 'mediation-et-resolution-de-conflits','modele-de-siegrist-desequilibre-efforts-recompenses','communication-descendante','definition-des-risques-psychosociaux','comparatif-des-cycles-fifo-14-14-20-10-21-7','demarche-de-prevention-en-rps-etapes','harcelement-psychologique-au-travail','les-trois-niveaux-de-prevention','reconnaissance-et-desequilibre-efforts-recompenses'
$lots | ForEach-Object { node tools/appliquer_retouches.mjs --lot "content-updates/2026-09-25-$_-schemas.json" --appliquer }
node tools/build_site.mjs
```

- Sans `--appliquer`, chaque lot fait seulement un essai.
- La ligne de la capture retirée est repérée par son nom de fichier (`img-000.png`, `img-001.png`, `img-002.png`) :
  une seule ligne de la note doit le contenir, sinon le lot refuse sans rien écrire.
- Ne pas supprimer du vault `01-fondamentaux/img-000.png` : c'est la pyramide de Maslow, à sa place sur « Théories de la
  motivation au travail ».

## Relevé en chemin (à trancher ; texte des pages non modifié)

- **Cause des captures fausses.** Plusieurs images de cours portent le même nom dans des dossiers différents
  (`img-000.png`, `img-001.png`…). Quand le générateur ne trouve pas le chemin exact, il prend le premier fichier du
  même nom, sans avertir. Les dossiers 05-mesure, 06-prévention, 10-conflits et 11-communication n'ont jamais été
  publiés. Corrigées de même dans ce lot : « Les trois niveaux de prévention » (Maslow et Selye) et « Reconnaissance et
  déséquilibre efforts récompenses » (Maslow). L'« Index des images du cours » décrit encore les anciennes captures.
- **Comparatif des cycles FIFO.** « Idées suicidaires … en cycles ≥21/7 (Bowers et al. 2018 p. 4) » : l'article ne
  mesure pas les idées suicidaires. Il trouve plus de détresse avec des rotations courtes (1 ou 2 semaines au site
  pour 1 de congé) qu'avec 4 pour 1. Bowers et al. (2018) n'est pas une méta-analyse. « La recherche est claire » est
  contredit sur la santé mentale (« inconsistent »). Les qualificatifs de récupération viennent de Vojnovic (2014) et
  Parker (2018), absents du wiki : à confirmer.
- **Harcèlement psychologique.** La citation de l'art. 81.18 est ancienne (« du salarié ») et omet le 2e alinéa
  (conduite grave unique). Autres points :
  - « Quatre éléments cumulatifs » : le tableau en compte cinq ;
  - l'intention de nuire et le caractère délibéré ne sont pas dans l'art. 81.18 ;
  - la « hausse du taux de cotisation » ne figure pas dans la LNT ;
  - les liens « art. 81 » mènent à l'article sur le congé de mariage.
  Le recueil local de la LNT est à jour au 26 mars 2024 : vérifier sur LégisQuébec une modification de 2024 de
  l'art. 81.19. Le schéma des obligations de l'employeur est mis de côté pour cette raison.
- **Modèle de Siegrist.** L'affirmation « LMRSST : la reconnaissance… » va au-delà de l'art. 144. « Réduit
  significativement les scores ERI » n'a pas de source. La référence Kivimäki (2007) est tronquée.
- **Reconnaissance.** Le même encadré non sourcé (« réduit significativement les scores ERI ») y figure sous « Action à
  fort effet ». L'infographie de la section Cadre attribue le modèle élargi à Siegrist et enchaîne demande → latitude →
  soutien → reconnaissance → santé comme des étapes, alors que sa propre phrase parle d'une demande modulée par les
  trois autres.
- **Les trois niveaux.** La légende retirée annonçait une prévention « primordiale », dont la page ne parle pas. « 6 à
  18 mois » n'a pas de source (comme sur Démarche de prévention).
- **Démarche de prévention.** Deux coquilles : « plan.p » et « primaire s ». « 6 à 18 mois » n'a pas de source. La
  responsabilité de « l'opérateur principal » envers les sous-traitants n'a pas d'appui dans le recueil.
- **Définition des RPS.** « Trois sources » : la fiche INSPQ (2018) en nomme quatre. Cette fiche est attribuée à
  « inrs.fr ». « Depuis la LMRSST (2021) » : l'art. 144 entre en vigueur au plus tard le 6 octobre 2025 (art. 313).
- **Médiation.** « Les conflits non résolus s'aggravent rarement par eux-mêmes : il faut intervenir » se contredit.
  Un lien affiche « Camp Comparatif des cycles FIFO (14/14, 20/10, 21/7) ».
- **Communication descendante.** « Communication doit atteindre les trois quarts » : la page Travail posté donne le
  quart de 12 heures comme standard.
- **Recueil local.** `tools/textes-loi/LSST.json` donne l'art. 59 sans la modification de la LMRSST (art. 144).

## Vérifications

- Tests : 233 réussis sur 234 ; le seul échec, `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur) et `verif_publication --staged`.
- Chromium, `verif_rendu` : les 9 pages dans les cinq modes, aucun défaut.
- Hors blocs de schéma, le texte des 16 pages publiées ne diffère que par les six légendes retirées.
- Aucune validation spécialisée n'est attestée.
