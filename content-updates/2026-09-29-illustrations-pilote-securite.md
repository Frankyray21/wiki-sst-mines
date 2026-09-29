# Illustrations redessinées : pilote Sécurité (29 septembre 2026)

Bloc 3 (« Illustrations ») de la liste « Que reste-t-il à bonifier ». Choix de Frank, le 29 septembre 2026 :

- fond noir, comme le wiki ;
- un pilote d'une dizaine de schémas sur les pages Sécurité, montré avant d'étendre ;
- quand un schéma redessiné montre la même chose qu'une capture de cours, il la remplace.

## Les dix schémas

Tous sont en SVG de 480 de large, sur fond noir (#16181d), dessinés avec `tools/schemas-sombres/securite.py`.

| Page | Schéma | Pose |
|---|---|---|
| Accidents et incidents, théorie causale | Lignes de défense (Reason) | remplace la figure « adaptée de James Reason » |
| | Diagramme d'Ishikawa (6M) | remplace la diapositive UQAT |
| | Nœud papillon | ajouté après son paragraphe |
| Hiérarchie des moyens de prévention | Hiérarchie des moyens de prévention | remplace la figure 23.1 (manuel, S. C. Blundell) |
| | ISO 12100 : méthode en trois étapes | remplace la capture « Vue améliorée de la méthode » |
| Appréciation du risque, méthodes | Démarche ISO 12100 | remplace le logigramme de la section « Cadre normatif » ; posé sous la liste de la démarche |
| | Chaîne accidentelle | remplace la chaîne qui suivait la démarche ; posé sous le titre « Chaîne accidentelle » |
| | Estimation du risque (IRSST/CNESST) | remplace la diapositive des éléments du risque |
| | Appréciation et traitement du risque | remplace la diapositive « B1 … B4 B8 » |
| | ALARP : trois zones | ajouté après la liste des trois zones |

Captures gardées sur ces pages :

- les tableaux et les exemples d'arbres (tapis-ski, chute de cage) ;
- les figures d'étape (angles rentrants, protecteurs, distances) ;
- la capture « EPI » : la page ne cite que trois de ses critères.

## Règles suivies

- **Chaque mot vient de la page, au plus raccourci.** Le schéma suit le texte, pas la capture. Quand la capture en
  montrait plus que la page n'en dit, ce surplus n'est pas repris :
  - quatre barrières nommées autrement chez Reason ;
  - d'autres rubriques (Comportement, Communication, Locaux) sur la diapositive d'Ishikawa ;
  - l'étape 0, l'étape 2′ et le contournement des protecteurs sur la « Vue améliorée ».
- **Une raison pour chaque couleur.** La structure reste neutre. L'ambre marque le danger jusqu'à l'accident (Reason)
  et l'événement redouté (nœud papillon), nommé dans la légende sous le titre. Les trois zones ALARP portent chacune
  leur couleur, avec leur nom écrit sur la bande. Les sept autres schémas n'ont aucune couleur.
- **Rien d'inventé.** L'estimation reprend les facteurs, les niveaux et l'exemple de la page ; la table qui combine
  les facteurs en indice n'est pas reproduite, et la légende le dit. Les légendes disent ce qui est de principe
  (nombre de trous, de causes, largeur des bandes).
- Texte alternatif, description du SVG (`<desc>`), légende et sources pour chaque schéma. Aucune version texte
  dépliable.

## Captures retirées du site

Le générateur ne copie que les fichiers qu'une page cite : après reconstruction, une capture remplacée
disparaîtrait du site. `tools/poser_schemas.mjs` la retire donc dès la pose, quand plus aucune page ne l'affiche
(test ajouté).

- Retirées : 6 captures de ce pilote.
- Gardées : la figure de Blundell et la « Vue améliorée ». La page « Hiérarchie des moyens de prévention » du wiki
  Hygiène industrielle (et sa copie encadrement) les affiche aussi.
- Retirés aussi : 11 restes de lots précédents (2,6 Mo). Ce sont des captures déjà remplacées par des schémas (Espaces
  clos, Aérosols, pages RPS), que plus aucune page ne citait mais que le téléchargement hors ligne emportait encore.

Les captures restent dans le vault ; seule leur ligne quitte la note.

## À faire dans le vault

Pour chaque lot, faire un essai, puis appliquer avec `--appliquer` :

```
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-29-theorie-causale-des-accidents-schemas.json
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-29-hierarchie-des-moyens-de-prevention-schemas.json
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-29-appreciation-du-risque-schemas.json
```

Ensuite, reconstruire : `node tools/build_site.mjs`. Les SVG sont copiés dans `Infographies/` du vault par les lots
(`medias`).

## Vérifications

- Pose : essai sans erreur, puis écriture. Les ancres et les captures sont uniques dans chaque page.
- Renvois : aucun changement (les sources ne visent que des pages déjà liées par ces articles).
- `npm --prefix tools test` : 516 sur 517 ; l'échec connu est celui des textes de loi du recueil.
- `verif_site.mjs` : OK.
- `verif_liens.mjs` : 0 erreur.
- `verif_rendu.mjs` : aucun défaut sur les trois pages (5 modes chacune).
- Les dix schémas ont été regardés un à un, puis dans leur page au téléphone.

## Points pour Frank

- **Droits.** Beaucoup des captures qui restent sont des pages de manuel scannées ou des diapositives de cours
  (UQAT), publiées sur un site public. Le pilote en retire 6 ; le reste est à décider.
- **Hygiène industrielle.** Sa page « Hiérarchie des moyens de prévention » montre les deux mêmes captures. Elle
  pourrait recevoir les deux mêmes schémas.
- **Suite.** Étendre, ou non, aux autres pages Sécurité (risques sectoriels, gestion des risques), puis aux autres
  wikis, avec les mêmes règles.
