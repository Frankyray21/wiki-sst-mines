# Gestion des moteurs diesel sous terre : schémas redessinés, deux nouveaux — 25 septembre 2026

Demande de Frank : « améliore les images et schéma de cette page Gestion des moteurs diesel sous terre ».

Page : [Gestion des moteurs diesel sous terre](https://frankyray21.github.io/wiki-sst-mines/w/toxicologie/diesel-sous-terre.html)
(et sa copie dans l'espace encadrement).

## Ce qui change

| Section | Schéma |
| --- | --- |
| Options et leviers | `wiki-diesel-sous-terre-leviers-v2.svg` remplace la v1 : une galerie en coupe, une chargeuse diesel dont l'échappement dérive vers un travailleur, un ventilateur qui amène de l'air frais ; les quatre leviers sont posés là où ils agissent (source, échappement, air, travailleur) |
| Post-traitement et carburant | `wiki-diesel-sous-terre-echappement-v2.svg` remplace la v1 : DOC, SCR et DPF dessinés en coupe, côte à côte, avec ce que chacun réduit (CO et HC ; NOx, avec l'urée ; particules, avec la régénération) et la base requise du DPF (ULSD) |
| Ventilation souterraine | `wiki-diesel-sous-terre-ventilation-v2.svg`, nouveau : chantier en cul-de-sac vu de haut, air primaire, ventilateur auxiliaire et conduite, échappement dilué dans la zone respiratoire du travailleur, ventilation à la demande |
| Mesure et surveillance d'exposition | `wiki-diesel-sous-terre-mesure-v2.svg`, nouveau : pompe et tête de prélèvement dans la zone respiratoire, laboratoire accrédité, moins de 0,4 mg/m³ de carbone total, registre du poste, au moins tous les 6 mois et après toute modification |

Le contenu validé des deux schémas de la première version (leviers, dispositifs, précautions : ni rendement
chiffré, ni ordre de montage) est conservé ; seule la forme change. Les deux nouveaux schémas suivent le RSSM, art.
90, 102 (1°, 1.1°) et 103.1, et la définition de la zone respiratoire du RSST, art. 1 ; un relecteur contradictoire les
a confrontés mot à mot au texte officiel (étiquette « ventilation à la demande », terme de la page ; art. 105 et
art. 102, 2° retirés des textes, faute d'être dessinés). Les fichiers v1 ne sont plus cités par aucune page : ils sont
retirés du site.

## À faire dans le vault (sinon la prochaine construction efface ces changements)

```
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-diesel-sous-terre-schemas.json --appliquer
node tools/build_site.mjs
```

- Le lot remplace celui de la première version, sous le même nom. Si la note a déjà reçu les blocs v1, ils sont
  remplacés à leur place (retouche `remplacerBloc`) ; sinon, les blocs v2 sont insérés sous leurs titres. Les deux
  nouveaux blocs sont insérés sous « Ventilation souterraine » et « Mesure et surveillance d'exposition ».
- Le lot garde la correction du NO₂ (3 ppm) de la première version : déjà faite, elle est reconnue et sautée.
- Les schémas de ventilation et de mesure, corrigés après relecture, portent aussi le numéro v2 : si la note a déjà reçu
  leur première version, le lot la remplace.
- Une fois le lot appliqué, les fichiers `wiki-diesel-sous-terre-leviers-v1.svg` et `…-echappement-v1.svg` peuvent
  être supprimés du dossier Infographies du vault : plus rien ne les cite.

## Relevé en chemin, non modifié (à trancher)

- « Indicateurs à suivre » : « Concentration moyenne EC par GHE (µg/m³) ». Le RSSM exprime l'exigence en carbone
  total, en mg par m³ d'air, au niveau de la zone respiratoire (art. 102, 1° a) et 1.1°) : un indicateur en carbone
  élémentaire ne se compare pas à cette exigence.
- « Pourquoi en parler » : « valeurs limites en révision (mesure du carbone élémentaire EC comme proxy) », sans
  source ; au Québec, le RSSM retient déjà le carbone total.
- « Post-traitement et carburant » : « Réduit 90 %+ de la masse particule », sans source (déjà signalé).
- Concept DPM du recueil (`w/legislation/40-concepts-juridiques-transverses/dpm.html`) : « 0,4 mg/m³ (en matières
  totales) ou 0,12 mg/m³ EC selon la méthode (RSST annexe I, mention C1) ». La valeur est au RSSM, en carbone total ;
  l'annexe I du RSST n'a pas de valeur pour les particules diesel ; aucune source du recueil pour 0,12 mg/m³ EC.
- Vocabulaire : la page dit « ventilateur auxiliaire » ; le RSSM dit « ventilateur secondaire » (art. 1). Le schéma
  garde le mot de la page.
- La page ne rappelle pas que la ventilation à la demande reste soumise aux débits minimaux du RSSM (art. 100.1, 101,
  102, 104), qu'un ventilateur fonctionne continuellement quand une personne se trouve dans son circuit (art. 94), ni
  que tout moteur diesel dans la zone affectée par l'arrêt d'un ventilateur doit être arrêté dans un délai de
  15 minutes (art. 105) : à ajouter au « Cadre légal » ou au tableau « Ventilation souterraine ».
- L'art. 103.1 du RSSM n'a pas de page dans le recueil du wiki (les pages vont de l'art. 103 à l'art. 104) : les
  sources le citent sans lien.

## Vérifications

- Tests : 233 réussis sur 234 ; le seul échec, `textes-loi`, est connu et antérieur. Le test `schemas-lots` vérifie
  que la version remplacée a disparu de la page.
- `verif_site`, `verif_liens` (0 erreur), `verif_publication --staged`.
- Chromium, `verif_rendu` : la page dans les cinq modes, aucun défaut.
- Hors blocs de schéma, le texte de la page et de sa copie est inchangé.
- Aucune validation spécialisée n'est attestée.
