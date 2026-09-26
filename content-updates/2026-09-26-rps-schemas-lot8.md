# Six pages RPS illustrées et Premiers signes redessiné — 26 septembre 2026

Deux demandes de Frank :

- « continue » : suite des pages RPS illustrées ;
- « améliore cette image, tu peux en créer plusieurs », au sujet du schéma de la page Premiers signes en mine, trop
  petit et peu contrasté en thème sombre.

Chaque schéma a été dessiné d'après la seule page, puis relu par un relecteur contradictoire qui l'a confronté mot à mot
au texte. Dans le wiki SST psychosociale, le texte des articles n'est pas modifié. Deux captures tierces sont retirées
avec leur légende : une diapositive de cours et une figure de livre.

## Pages

| Page | Schémas | Retiré |
| --- | --- | --- |
| [Les quatre formes de reconnaissance (Brun et Dugas)](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/les-quatre-formes-de-reconnaissance-brun-et-dugas.html) | un foreur au front : la personne, sa manière de travailler, son effort, la volée forée ; bande « beaucoup d'organisations se concentrent sur une seule » | diapositive `09-reconnaissance/img-012.png` et sa légende « Personne + Pratique + Efforts = Résultats » |
| [Types de personnalité et lieu de contrôle](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/types-de-personnalite-et-lieu-de-controle.html) | type A ou B croisé avec lieu de contrôle interne ou externe (paroles du travailleur, mots de la page), dans le cadre des conditions de travail ; aucune case jugée | figure du livre de Dolan et Arsenault `04-stress-modeles/img-003.png` et sa légende |
| [Programme d'aide aux employés (PAE)](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/programme-daide-aux-employes-pae.html) | accès direct et confidentialité (principe), ce que l'employeur reçoit ou non ; un pansement, pas un traitement des causes | — |
| [Rotations jour-nuit](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/rotations-jour-nuit.html) | conflit entre l'horloge du corps et le quart de nuit ; dormir au camp : ce qui nuit, les leviers | — |
| [Soutien social au travail](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/soutien-social-au-travail.html) | qui aide et comment : les trois formes d'aide du supérieur, la coopération des collègues, la question de repérage | — |
| [Axe HHS et stress chronique](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/axe-hhs-et-stress-chronique.html) | le circuit hypothalamus, hypophyse, surrénales et la mobilisation immédiate des ressources ; une activation qui ne s'arrête plus : cortisol élevé maintenu, réactions cardiovasculaires, excès de risque de maladie coronarienne (sans le 23 %) | — |
| [Premiers signes en mine](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/premiers-signes-en-mine-ce-que-les-superviseurs-voient.html) | vue d'ensemble v2 (remplace la v1) ; un schéma par catégorie (performance, relations, apparence, comportements à risque) en scènes « d'habitude → maintenant » ; « Que faire quand on détecte », sans étapes numérotées | schéma v1, retiré du site |

Aucun schéma n'ajoute de chiffre, de délai ou de promesse d'effet.

## À faire dans le vault (sinon la prochaine construction efface ces schémas)

```
Get-ChildItem content-updates\2026-09-26-*-schemas.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
node tools/build_site.mjs
```

La boucle couvre aussi les six lots de la note du même jour (`2026-09-26-rps-schemas.md`), et les lots déjà appliqués
sont reconnus et sautés. Le lot de Premiers signes remplace celui du matin, sous le même nom. Si la note a déjà reçu le
schéma v1, il est remplacé par la v2 à sa place (`remplacerBloc`) ; sinon, la v2 est insérée. Une fois le lot appliqué,
`wiki-premiers-signes-en-mine-ce-que-les-superviseurs-voient-signaux-v1.svg` peut quitter le dossier Infographies.

## Relevé en chemin, non modifié (à trancher)

**Les quatre formes de reconnaissance**

- La légende retirée faisait des résultats la somme des trois autres formes. Or le tableau et L'essentiel en font une
  quatrième forme distincte.
- « Augmentation de l'iso-strain » en cas de manque de reconnaissance : ce lien n'a pas de source. L'iso-strain
  combine la demande, la latitude et le soutien.
- Brun et Dugas (2005) est présenté comme « Article », avec pour source la « Chaire CGSST », alors que la référence de
  fin de page le situe dans *Gestion*, 30(2), 79-88.

**Types de personnalité et lieu de contrôle**

- Le lien « Dolan & Arsenault 2009 p. 169 » ouvre la p. 139 du livre ; la typologie est p. 142-143.
- La référence Kobasa (1979) est tronquée. Les références de Rotter (1966) et de Denollet manquent.
- Deux affirmations sont sans source : « Type D … confirmé par études récentes » et « Sélection à l'embauche …
  illégal ».
- La page Index des images du cours cite encore la capture retirée.

**PAE**

- Un titre d'encadré s'affiche en syntaxe brute : « [[Le PAE, comment ça marche|Le PAE]] n'est pas une solution
  organisationnelle ». Dans L'essentiel, le lien « Le PAE » renvoie à la page elle-même.
- « LMRSST : le PAE peut faire partie du programme de prévention au volet tertiaire » : aucun texte du recueil ne parle
  de PAE ni de volet tertiaire.
- « L'employeur ne sait jamais… » est nuancé ailleurs par la page elle-même : en petit camp, un appel peut être
  remarqué (« confidentialité présumée »).
- Chiffres sans source : « 3 à 12 séances », « 30 $ à 150 $ », « 5 % à 15 % », « 2 mois », « 1500 km ».
- Le recueil local (LSST.json) n'a pas encore le nouveau deuxième alinéa de l'art. 59, sur les risques psychosociaux
  (LMRSST, art. 144).

**Rotations jour-nuit**

- **Sens de rotation.** « Le sens décrit comme antihoraire, soit jour puis soir puis nuit » : le même couple figure dans
  sept pages du wiki, sans source d'origine. La note Folkard et Tucker (2003) ne dit rien du sens de rotation. Il faut
  le vérifier dans l'article d'origine, puis corriger les sept pages ensemble si besoin.
- **Travail de nuit permanent.** La page dit à la fois qu'une adaptation est « jugée possible » et qu'« aucune
  adaptation complète » n'est possible. Le schéma ne tranche pas.

**Soutien social au travail**

- Une ancre vide « quatre-formes-de-soutien » précède une section qui décrit trois formes.
- « Consulter la page Iso-strain » : ce n'est pas un lien.
- Le schéma iso-strain proposé a été écarté : il redisait celui de Modèle de Karasek.

**Premiers signes en mine**

- Les remarques du matin restent : « Travailleur Avisé » sans source, référence INSPQ sans année, « Lundis, vendredis »
  et « (24/7) » sans source.
- Les scènes sont des exemples choisis pour illustrer chaque signal, sans règle, distance ni seuil :
  - le cadenas manquant ;
  - le wagonnet et l'horloge sans chiffres ;
  - la charge suspendue ;
  - le véhicule près d'un piéton.
- Le schéma « Danger immédiat » séparé a été écarté : il redisait l'encadré qui ouvre la page. La vue d'ensemble y
  renvoie, et le schéma des comportements à risque garde la consigne sur les propos suicidaires, mot pour mot.

**Axe HHS et stress chronique** (posé après accord de Frank, le relecteur n'ayant pas pu lancer l'essai de pose ;
essai refait avant la pose)

- Le sens hypothalamus → hypophyse → surrénales et la libération du cortisol par les surrénales sont dessinés comme en
  physiologie, mais aucune page du wiki ne l'écrit en toutes lettres : la page ne le donne que par le nom de l'axe et le
  mot « circuit ». À sourcer dans une note d'analyse.
- La section Définition attribue à Définition du stress professionnel des contenus absents de cette page.
- « Quelques heures » est sans source.
- Les graphies ne sont pas harmonisées (HHS, HPA, « corticosurrénalien » ; Selye, Sélye).

## Vérifications

- Hors blocs de schéma, seules les deux captures tierces et leurs légendes sont retirées des pages. Le bloc v1 de
  Premiers signes est remplacé.
- Tests : 262 réussis sur 263 ; le seul échec, `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur), `verif_publication --staged`, manifeste hors ligne régénéré.
- Chromium, `verif_rendu` : six pages dans les cinq modes. Seul défaut : les appels de note trop petits sur Soutien
  social, déjà présents avant.
- L'outil de pose refuse désormais un lien de source qu'il ne sait pas publier : il le publiait en texte échappé.
- Aucune validation spécialisée n'est attestée.
