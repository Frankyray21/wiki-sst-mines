# Fiches pour les travailleurs — intégration au fond documentaire, 9 septembre 2026

**Demande de Frank :** abandonner le wiki des travailleurs et l'inclure discrètement dans le wiki référencé, comme un vrai wiki, en n'utilisant que les sources de ses notes universitaires dans Obsidian.

Lecture retenue : le wiki par public `/t/` (portail en tableau de bord au « tu », copie des pages sous `t/w/…`) disparaît ; ses pages, qui sont déjà des articles du fond documentaire, y restent et y sont indexées comme dans n'importe quel wiki. Rien n'est rédigé hors du vault : les seuls textes nouveaux sont des libellés de navigation et un encadré d'aide dont les numéros et la formulation viennent des notes « Où appeler quand ça ne va pas » et « Lignes d'aide et ressources de soutien ». Les renvois vers les notes d'analyse universitaires sont proposés en fin de document, sans être appliqués : ils relèvent d'une décision éditoriale dans Obsidian.

## Ce qui change

- Le site n'a plus de wiki des travailleurs : ni `t/index.html`, ni copie `t/w/…`. Le générateur ne produit plus le public « t » ; l'autorisation calculée à partir du vault (`publication-travailleur`, `public-cible`, veto `niveau-sensibilité`) sert désormais à sélectionner les fiches de l'index.
- `travailleurs.html`, dans l'habillage ordinaire du wiki (barre latérale, recherche, thème), regroupe les 84 pages autorisées par situation : 65 fiches uniques réparties en 9 rubriques, 11 pages d'accueil et de démarrage rapide, 8 doublons « (travailleurs) » écartés au profit de la version « (pour toi) » et laissés dans la section « Articles travailleurs » de leur wiki.
- Encadré « Détresse immédiate » en tête de l'index : 9-1-1, Info-Social 8-1-1 option 2, 9-8-8 ou 1-866-APPELLE, avec renvoi aux deux notes du vault qui les donnent.
- `404.html` : `t/index.html` → `travailleurs.html` ; `t/w/…` → `w/…` (même page du fond documentaire). Les anciennes adresses, les favoris et les copies hors ligne retombent sur leurs pieds.
- Portail racine : le fond documentaire d'abord, puis « Parcourir par sujet » (catégories, fiches pour les travailleurs, contrôles de forme), puis l'espace encadrement `/g/`, inchangé.
- Barre latérale de toutes les pages, parcours encadrement compris : « 👷 Fiches pour les travailleurs » remplace « 👷 Wiki des travailleurs » (4 420 pages).
- Script partagé : le mode d'affichage sans émojis (`WIKI_UI`) et la visite guidée « tour-travailleurs », propres à l'ancien portail, sont retirés ; la visite du portail racine est réécrite. Les règles `body.tb[data-pub="t"]` de `portail.css` sont retirées.
- Site publié transformé par le même code que le générateur (`tools/fiches_travailleurs.mjs`, `tools/portail_racine.mjs`), nouvelle estampille de version et manifeste hors ligne régénéré (4 443 fichiers texte, 3 435 médias).

## Ce qui ne change pas

- Aucune note du vault n'est modifiée ; aucun contenu SST n'est rédigé ; aucune validation n'est revendiquée.
- Les autorisations de publication et les publics sont inchangés : mêmes 84 pages, même parcours encadrement (134 pages).
- Le tutoiement et la forme des fiches restent ceux des notes. Les sections « Articles travailleurs » et « Brouillons travailleurs » gardent leur nom, qui est celui des dossiers du vault.
- La prochaine construction (`node tools/build_site.mjs`) produit la même structure ; `node tools/verif_site.mjs` contrôle l'absence de `docs/t`, la présence de l'index, des numéros d'aide, des redirections et du lien de barre latérale sur chaque page.

## Vérification

`node tools/verif_site.mjs` : OK (4 443 fichiers hachés, 84 liens de fiches dans l'index). `node tools/verif_liens.mjs` : 247 820 liens et 8 467 fragments vérifiés, 0 erreur. `npm --prefix tools test` : 70 tests, dont les nouveaux `fiches-travailleurs`, `portail-racine` et `commandes-entete`. Ces contrôles sont statiques : ils ne remplacent ni un essai sur téléphone ni une relecture du fond.

## Rubriques de l'index

Le classement se fait sur des mots entiers du titre et du chemin (dossiers du vault compris), première rubrique gagnante, dans cet ordre. Un renommage dans Obsidian peut déplacer une fiche ; le journal de construction indique le nombre de fiches hors rubrique (0 aujourd'hui).

| Rubrique | Fiches | Mots de classement |
| --- | ---: | --- |
| Douleurs, postures et efforts | 5 | postures, manutention, travail répétitif, vibrations, tms |
| Air, poussières et produits | 16 | poussières, diesel, silice, solvants, gaz, simdut, fds, amiante, fumées, produit chimique, exposition, allergies, prise de sang |
| Chaleur, froid et bruit | 4 | chaleur, bruit, froid, thermique |
| Santé mentale et soutien | 9 | détresse, santé mentale, stress, aide, pae, appeler, rps, idées noires, moins bien, accident grave, événement marquant, dépression, tête fatigue |
| Sommeil, fatigue et récupération | 3 | sommeil, fatigue, quart de nuit, récupération |
| Équipe, reconnaissance et conflits | 4 | équipe, reconnaissance, reconnu, conflit, harcèlement, soutien, épaulé, collègues |
| Droits, réclamations et démarches | 10 | droit de refus, réclamation, retour au travail, droits, lésion, cnesst, bem, comité sst, congédiement, couvert, vacances, rotation |
| Dangers, machines et procédures | 12 | danger, presqu, cadenassage, espace clos, machines, machinerie, protection, convoyeur, hauteur, électrique, roche, accident, circuler |
| Vie au camp et rotation | 2 | camp, fifo, famille, séjour, alcool, consommation |

## Sources : proposition de renvois vers les notes d'analyse universitaires (non appliquée)

Proposition en cours de production (relecture contradictoire des renvois, rubrique par rubrique) ; elle sera ajoutée à cette section dans un commit suivant, sans modification du site.
