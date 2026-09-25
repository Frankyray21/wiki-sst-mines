# Espaces clos : schémas, art. 308 en vigueur, images à taille standard — 25 septembre 2026

Demandes de Frank : « sélectionne une page qu'on va améliorer avec entre autres des photos et
schémas », puis « go » ; en cours de route : « les images dans le texte doivent avoir une grosseur
standard qui ne nuit pas à la lecture ; au besoin on clique dessus et elle grossit en pop-up ».

## Le choix de la page

35 pages des six wikis (psychosocial et textes de loi exclus) notées sur une grille commune :
potentiel de schéma, potentiel de photo, ancrage dans le contenu, enjeu minier, manque de vrais
visuels, maturité. Cinq finalistes départagés par trois juges (lecteur terrain, rigueur
éditoriale, faisabilité), puis un sceptique chargé de réfuter le choix. Égalité de points entre
**Espaces clos**, Protection respiratoire (APR) et Aérosols ; deux juges sur trois placent Espaces
clos en tête et le sceptique n'a pas pu la réfuter : risque mortel, page d'arrivée du travailleur
depuis l'archivage des fiches du 12 septembre, priorité 1 de l'audit du 6 septembre, dix images
qui n'étaient que des captures de cours — dont une fausse (« ALARME à 10 % de la LIE », alors que
l'art. 302 fixe au plus 5 %).

APR vient ensuite, mais son tableau des facteurs de protection se contredit (cagoule à 25 dans le
tableau, 1 000 dans la légende) : à corriger avant d'illustrer.

## Ce qui change sur la page (`w/securite/espaces-clos.html`)

Cinq schémas vectoriels (`docs/files/infographies/wiki-espaces-clos-*-v1.svg`, 4 à 8 Ko), dessinés
depuis la page et le texte officiel du recueil, relus chacun par un relecteur contradictoire :

| Schéma | Où | Remplace |
| --- | --- | --- |
| Gaz inflammable : où se situe 5 % de la LIE | Dangers spécifiques | la capture « alarme à 10 % » |
| Où un gaz tend à s'accumuler | Dangers spécifiques | la capture « Air / Toluène » |
| Purge : l'air qui fait un court-circuit | Mesures de contrôle | le croquis de purge |
| Le surveillant reste dehors | Surveillant | — |
| Chantier en cul-de-sac : quand l'air ne circule plus | Application terrain | — |

Chaque schéma a son texte alternatif, sa légende, sa version texte (« Lire le schéma en texte ») et
ses sources. Aucune valeur limite, aucun seuil ni aucune consigne n'est ajouté : seuls chiffres,
« 5 % de la LIE » et les numéros d'articles. Les schémas sont dessinés sur fond clair et **inversés
en thème sombre** (classe `infographie-schema`), jamais à l'impression.

Texte de la page :
- surveillant résumé d'après l'art. 308 en vigueur (à l'extérieur et à proximité de l'entrée,
  communication bidirectionnelle, pouvoir d'ordonner l'évacuation) — la page disait « contact
  visuel, auditif ou autre moyen » ; ajout de l'art. 308.1 (risque imprévu) ; « ne peut entrer
  pour secourir » appuyé sur l'art. 309 et la CNESST ;
- « ≤ 5 % de la LIE » au lieu de « < 5 % » (bornes incluses de l'art. 302), trois endroits ;
- le lien « art. 309 » du plan de sauvetage menait à la fiche « électricité » : il mène au recueil ;
- ressources : CNESST « Espaces clos », CCHST « Programme » et « Introduction » (adresses vérifiées
  le 6 septembre 2026 pour les fiches travailleurs archivées ; non revérifiées aujourd'hui, le réseau
  de l'environnement de travail ne les joint pas).

## Toutes les images du texte (demande en cours de route)

- **Taille standard** : captures et planches plafonnées à min(24rem, 60vh) de haut, proportions
  gardées — sur « Anatomie et biomécanique du dos », les planches passent d'environ 565 à 384 px ;
  infographies et schémas, lus sur place, dans une colonne de 30rem et à min(34rem, 75vh).
- **Visionneuse** : toucher une image l'ouvre agrandie par-dessus la page (elle existait ;
  complétée). Toucher l'image agrandie : taille réelle, avec défilement. ✕, Échap, toucher à côté
  ou **bouton Retour du téléphone** referment, sans quitter la page. Focus rendu à l'image.
- Le générateur pose désormais largeur et hauteur sur l'`<img>` d'un schéma SVG
  (`tools/dimensions_svg.mjs`) : la place est réservée avant le chargement différé.

## À faire dans le vault (sinon la prochaine construction efface la page)

```
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-espaces-clos-schemas.json
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-espaces-clos-schemas.json --appliquer
node tools/build_site.mjs
```

L'essai affiche chaque retouche avec sa ligne ; si une seule ne trouve pas sa ligne, rien n'est
écrit. Les cinq SVG sont copiés dans `Infographies/` du vault. Les anciennes captures restent
dans le vault. Le lot a été rejoué de bout en bout sur une note reconstituée d'après la page
publiée (`tools/tests/espaces-clos-schemas.test.mjs`) — pas sur la vraie note.

## Photos : pas encore

Aucune banque d'images (Wikimedia Commons compris) n'est joignable depuis l'environnement de
travail. Emplacements prévus, photos prises **de l'extérieur**, sans personne reconnaissable ni
signe du site, avec l'accord de l'employeur ; aucune scène générée présentée comme réelle :
1. trou d'homme d'un réservoir de procédé avec son affiche (section Définition) ;
2. trémie ou silo à minerai vu depuis son accès ;
3. chantier borgne sous terre avec son conduit de ventilation auxiliaire (Application terrain).
Légendes à écrire avec les mots de l'art. 1 (« puits d'accès », non « puits »).

## Relevé en chemin, non modifié (à trancher)

- **Page LIE du recueil** (`w/legislation/40-concepts-juridiques-transverses/lie.html`), liée
  juste au-dessus du premier schéma : son tableau « Seuils opérationnels en espace clos » donne
  « 10 % — Sortie immédiate requise (RSST espaces clos) » et une zone explosive de « 10-100 % LIE ».
  C'est la même erreur que la capture retirée : le RSST fixe au plus 5 %, la zone explosive commence
  à la LIE.
- Espaces clos : « Près de 40 Québécois… » ; tableaux « Effets de la déficience en O2 » et
  « Exemple H2S » ; « NIOSH > 20 changements d'air/h » et « APSAM 7,5 CA/H » — non sourcés. Le mot
  « permis » n'apparaît dans aucun des art. 296.1 à 312 ; l'art. 304 (travail à chaud) exige un
  relevé continu avec alarme, pas « un permis spécifique ». La CSTC (art. 3.21.2) retient 19,5 % d'O₂
  et 25 % de la LIE, sans que la page signale l'écart. Définition : « puits » là où l'art. 1 dit
  « puits d'accès ». « Antidéflagrant » est un mode de protection, pas un troisième type de
  ventilateur. Tétraèdre du feu : quatrième sommet « Auto-combustion » à vérifier.
- Voir aussi et fil d'Ariane : art-256-RSST (chariots élévateurs) présenté comme espaces clos,
  fiches casque et EPI ; thème « programme d'hygiène industrielle » dans le wiki Sécurité.
- Gaz et vapeurs : « sous 5 % de la LIE » (l'art. 302 dit « inférieure ou égale »).
- Bruit : son infographie PNG n'a pas de dimensions sur l'`<img>` (place non réservée avant
  chargement) — existait avant ce lot.

## Vérifications

- Tests : 168 réussis sur 169, le seul échec étant connu et antérieur (`textes-loi`).
- `verif_site` (dont les cinq schémas : hors ligne, autonomes, accessibles, aucune alarme à 10 %,
  « au plus » et non « < »), `verif_liens` (0 erreur), `verif_publication --staged`.
- Chromium, `verif_rendu` sur Espaces clos : téléphone clair et sombre, tablette de chantier en
  paysage et en portrait, bureau — aucun défaut. Visionneuse essayée sur bureau, tablette tactile
  et téléphone : ouverture, focus, taille réelle, retour.
- **Pas essayé sur un appareil réel.** Aucune validation spécialisée ni relecture éditoriale
  n'est attestée.
