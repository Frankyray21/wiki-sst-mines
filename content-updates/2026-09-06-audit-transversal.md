# Wiki SST — amélioration transversale, 6 septembre 2026

**Suites autorisées le 6 septembre :** Frank a demandé « Go et publier », puis « Continue avec le reste ». Les deux fiches Espaces clos et la page FDS ont été reprises dans `2026-09-06-terrain-references.json`. Solvants, Sommeil et Obligations de l'employeur suivent dans `2026-09-06-terrain-references-lot2.json`, sans modification des publics. Les constats et chiffres ci-dessous sont historiques, antérieurs à ces deux reprises. Plusieurs anciennes fiches du recueil juridique ont des intitulés inexacts : elles restent à auditer séparément ; la page Obligations renvoie désormais à la loi officielle.

## Périmètre de ce lot

Améliorer la consultation commune des articles sans réécrire les contenus SST en masse, sans modifier les publics autorisés et sans nouvelle attestation de validation. Le wiki conserve sa structure et son hébergement GitHub Pages ; les consignes Sites ont guidé la préservation de l’existant, sans migration.

Les modifications concernent le générateur, la feuille de style, le script partagé, les contrôles de qualité et leurs tests. Les notes du vault restent inchangées. La publication de ce nouveau lot reste à confirmer après la prévisualisation.

## Changements réalisés

- En-tête d’article compact sur téléphone : une rangée de commandes, une rangée de recherche, emplacement prévu pour le bouton d’installation facultatif.
- Hauteur réelle de l’en-tête mesurée pour positionner le menu et dégager les destinations des liens internes. Recalcul lors des changements de dimensions, sans défilement continu.
- Arrivée sur un fragment après les injections de commandes ; arrêt des réalignements dès une interaction du lecteur et respect de la restauration arrière/avant.
- Menu mobile : état ouvert/fermé explicite, liens du volet fermé non focalisables, Échap et fermeture extérieure, conservation de l’action native des liens.
- Repère discret sur les titres et références ciblés. Petits numéros de référence conservés, avec un nom accessible explicite pour les appels numériques.
- Meilleur signalement des fins de texte interrompues des deux fiches « Espaces clos ». Une phrase commençant par un lien n’est plus prise à tort pour une introduction absente.

Les portails en tableau de bord conservent leur propre en-tête et leur propre menu. Aucun nouveau visuel n’a été ajouté : dans ce lot, la lisibilité et la navigation suffisent.

## Lecture du bilan automatique avant modification

Le contrôle repérait 488 pages comportant au moins un signalement, dont 487 parmi les 665 notes hors Recueil législatif. Ces nombres ne comptent pas les variantes par public comme de nouveaux articles. Les colonnes par public se recoupent : elles ne doivent pas être additionnées.

| Domaine | Notes avec signalement / notes examinées | Parcours travailleurs | Parcours encadrement |
| --- | ---: | ---: | ---: |
| Ergonomie | 49 / 79 | 7 / 13 | 9 / 11 |
| Hygiène industrielle | 54 / 86 | 14 / 15 | 15 / 18 |
| Toxicologie | 44 / 60 | 9 / 11 | 9 / 11 |
| Sécurité industrielle | 32 / 76 | 12 / 14 | 10 / 11 |
| Droit du travail | 39 / 51 | 10 / 12 | 12 / 13 |
| Psychosocial | 269 / 313 | 18 / 19 | 67 / 70 |

Un signalement n’établit pas qu’une page est fausse. L’absence de lien externe direct n’exclut pas des références dans les notes liées. Les contrôles automatiques ne remplacent pas la vérification des affirmations, de l’actualité des sources et de l’adaptation au public. Le tableau de bord affiche actuellement un sous-ensemble des pages signalées : il ne constitue pas un inventaire éditorial exhaustif.

## Prochain lot proposé : textes utiles sur le terrain

Ces constats sont des pistes de révision, pas de nouvelles consignes opérationnelles. Les corrections de fond nécessitent une vérification des sources primaires et du contexte d’utilisation.

| Priorité | Pages sources (chemins relatifs au vault) | Travail proposé |
| --- | --- | --- |
| 1 | `Wiki Sécurité industrielle/25 - Articles travailleurs/Risques mécaniques/Espaces clos.md` et `Wiki Hygiène industrielle/25 - Articles travailleurs/Espaces clos.md` | Réviser ensemble les deux versions dont les dernières puces se terminent par « Le comi » et « L ». Vérifier les chiffres et seuils, distinguer clairement l’information générale d’une procédure d’entrée propre au site. Conserver un tableau de rôles seulement s’il reste utile. |
| 2 | `Wiki Hygiène industrielle/25 - Articles travailleurs/SIMDUT et FDS.md` | Clarifier ce qui relève d’une première lecture de FDS et ce qui dépend de la situation. La liste initiale de quatre sections ne couvre pas tous les renvois du texte. Vérifier les affirmations sur la formation. |
| 3 | `Wiki Toxicologie/25 - Articles travailleurs/Solvants.md` | Vérifier les formulations reliant symptômes et surexposition ; préciser les limites des conseils généraux sur ventilation, protection et premiers secours. Renvoyer aux informations adaptées au produit. |
| 4 | `Wiki Ergonomie/25 - Articles travailleurs/Sommeil et quart de nuit.md` | Harmoniser les repères proposés et sourcer les durées, comparaisons et chiffres. Envisager un petit tableau avant/pendant/après le quart, uniquement après vérification du contenu. |
| 5 | `Wiki Droit du travail/10 - Thèmes/Obligations de l'employeur.md` | Vérifier les correspondances entre intitulés de liens légaux et colonne « Couvre ». Revoir les formulations trop absolues après consultation des textes officiels. |

## Règles de poursuite

1. Confirmer le public prioritaire avec Frank : travailleurs, encadrement ou deux parcours adaptés.
2. Reprendre un petit groupe cohérent de notes avec les sources primaires consultées et datées.
3. Employer un tableau, un schéma ou une image seulement s’il facilite une comparaison, une séquence ou la compréhension d’un mécanisme ; éviter les répétitions décoratives.
4. Conserver les anciennes ancres et les autorisations de publication. Ne pas inventer de validation spécialisée.
5. Faire valider le résultat avant publication du nouveau lot.

## Vérification

Les tests automatisés portent sur les gestionnaires JavaScript, les états ARIA, la structure produite et les contrats CSS. Ils ne prouvent pas le rendu sur un téléphone réel. Le bilan de génération et des liens est consigné dans la livraison locale de ce lot après construction complète.
