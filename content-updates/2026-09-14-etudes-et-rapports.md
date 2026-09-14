# Études et rapports hors des volets de l'accueil — 14 septembre 2026

Sur l'accueil d'un wiki, chaque volet de thème listait ses notions **puis** ses études et rapports,
sous deux sous-titres « Notions » et « Études et rapports ». Frank, 14 septembre : les études sortent
de cette page pour aller ailleurs, et le titre d'un thème doit mener à la page de ce thème.

## Ce qui change

- **Les volets de l'accueil ne listent plus que des notions.** Une notion dont le titre porte une
  année entre parenthèses (« Karasek (1979) - Modèle Demandes-Contrôle ») ou commence par
  « Analyse - » est la fiche d'une source, pas une notion du sujet : elle quitte le volet. Les deux
  sous-titres disparaissent (une seule liste), et le compte annoncé est celui des articles listés
  (« Communication » passe de 8 à 6 articles).
- **Nouvelle page `w/<wiki>/etudes-et-rapports.html`**, classée par thème, avec le nombre d'études par
  thème et un groupe « Sans thème » à la fin. Elle n'existe que pour un wiki qui en a : aujourd'hui la
  seule SST psychosociale, avec 44 pages — 23 rattachées à au moins un thème (68 placements, une étude
  pouvant servir plusieurs thèmes) et 21 sans thème, qui ne figuraient jusqu'ici sur aucune page
  d'accueil.
- **Le titre de chaque volet mène à la page de son thème.** Le volet se replie toujours par la flèche
  ou par le reste de la ligne ; le lien « Page du thème → » au bas du volet est conservé.
- La nouvelle page est liée depuis la barre d'index de l'accueil (« Index alphabétique · **Études et
  rapports** · Catégories · Tous les thèmes ») et depuis la barre latérale des 322 pages du wiki.

## Ce qui ne change pas

- Aucune note du vault n'est modifiée, aucun texte n'est réécrit : les mêmes liens, les mêmes libellés,
  déplacés.
- **La page d'un thème continue de lister toutes ses pages, études comprises** (« Articles de ce thème ») :
  rien n'est retiré du site, seulement de l'accueil.
- Les cinq autres wikis n'ont aucune étude au sens de cette règle : leurs volets sont inchangés (hors
  titre cliquable) et ils n'ont pas la page.

## Vérification

- Aucune étude perdue : les 44 pages d'analyse de la SST psychosociale se retrouvent sur la nouvelle
  page (compte contrôlé contre l'index de recherche, et contre le balayage des pages d'article du wiki).
- `tools/tests/etudes-rapports.test.mjs` : volets sans étude ni sous-titre, titre cliquable pointant la
  même page que « Page du thème → », compte annoncé égal aux articles listés, page présente pour le
  wiki qui a des études et absente pour les autres, chaque étude du wiki présente sur la page, chaque
  cible publiée, comptes des groupes égaux aux liens listés, lien dans la barre d'index et dans les
  322 barres latérales, et page de thème qui garde ses études.
- Rendu réel dans Chromium (`tools/verif_rendu.mjs`) sur l'accueil, la nouvelle page et une page de
  thème : aucun défilement horizontal, cibles tactiles conformes sur l'accueil et la nouvelle page.
- Clic vérifié dans Chromium à 1 200 px et à 390 px : le titre navigue vers la page du thème, et le
  repli fonctionne toujours (ouvert → replié sur bureau, replié → ouvert sur téléphone).
- `verif_site`, `verif_liens` (0 erreur sur 245 385 liens), `verif_publication --staged`.

## Deux constats hors de ce lot, à décider

- **`tools/tests/textes-loi.test.mjs` échoue déjà sur `main` avant ce lot** : 11 pages d'article de loi
  n'ont pas de texte extrait. Neuf sont des articles absents du PDF consolidé courant (art. 51.4 et
  51.11 LSST, abrogés ; art. 180.3, 180.4, 180.6, 217.1, 242.1, 242.2, 81.18 LSST et 221.1 LATMP,
  ajoutés depuis l'extraction), une relève du Règlement canadien SST, dont le PDF n'est pas au recueil.
  À trancher : réextraire depuis un PDF à jour, ou admettre dans le test les articles absents du PDF.
- **Cibles tactiles des pages d'article** : sur une page de thème à 390 px, les liens du corps mesurent
  moins de 24 px de haut (WCAG 2.5.8 AA). Le correctif appliqué aux accueils ne couvre que ceux-ci ;
  l'étendre à `.page-body a` toucherait toutes les pages du site, ce qui dépasse ce lot.
