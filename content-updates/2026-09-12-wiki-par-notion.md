# Wiki par notion et par thème (12 septembre 2026)

Décision de Frank : le wiki séparé des travailleurs est abandonné. Le site devient un vrai wiki
organisé par notion et par thème. Détail du plan exécuté : `plans/2026-09-12-wiki-par-notion.md`
(et ses annexes, `plans/2026-09-12-annexes/`).

## Ce qui a changé

- **Archivage du vault** : 112 notes des dossiers `24 - Références internes pages travailleurs`,
  `25 - Articles travailleurs`, `26 - Brouillons travailleurs` (six wikis) sont déplacées dans
  `98 - Archives` de chaque wiki, avec `publish: false`, `chemin-origine`, `archive-date`,
  `motif-archivage` (`tools/archiver_travailleurs.mjs`, sauvegarde locale non versionnée
  `sauvegarde-vault/2026-09-12-travailleurs/`, journal versionné
  `content-updates/2026-09-12-archivage-travailleurs.json`). 23 étaient déjà `publish: false`.
  6 notes sans `version-jumelle` en ont reçu une (confiance élevée uniquement, source :
  `plans/2026-09-12-annexes/equivalents-travailleurs.json`).
- **Adresses par notion** : `w/<wiki>/<slug-de-la-note>.html` pour les six wikis (`tools/adresses.mjs`),
  au lieu du miroir des dossiers de cours. Le Recueil législatif garde sa formule miroir, inchangée.
- **Thèmes** : `w/<wiki>/theme/<slug>.html`, source = notes `type: thème` publiées de « 10 - Thèmes »
  (Ergonomie n'en a aucune : ses 5 notes index de sous-dossier de « 20 - Articles internes »
  tiennent lieu de thème). Une notion s'y rattache par sa clé `theme:`/`thème:`, par le wikilien de
  la note de thème vers elle, ou (Ergonomie seulement) par son sous-dossier. Rien n'est écrit dans
  le vault ; les notions sans thème restent joignables par l'index alphabétique et la recherche.
- **Collisions de nom** (mêmes six wikis) : la note d'un dossier « 20 - … » l'emporte sur toute
  autre ; à égalité, celle au corps le plus long ; les perdantes reçoivent un suffixe explicite
  (`-encadrement` pour le dossier « 27 - … », sinon le nom de leur propre dossier), jamais un `-2`
  silencieux. Le Recueil garde son mécanisme `-2`/`-3` (inchangé).
- **Renvoi vers la version jumelle** : un lien qui visait une fiche archivée suit sa
  `version-jumelle` (indexée par wiki : un même nom peut avoir des jumelles différentes selon le
  wiki citant) ; sans jumelle, il reste grisé « (source non publiée) », comportement déjà existant.
- **Redirections** : `404.html` autonome (`tools/redirections.mjs`) — règle générique (retirer les
  segments de dossier, ignorer `t/`, garder `g/`) + table inline (`docs/assets/redirections.json`,
  691 entrées) pour les accueils, les thèmes, les collisions suffixées et les notes archivées.
- **Portail de l'encadrement (`/g/`)** : forme inchangée ; ses 20 cibles codées en dur sont
  réécrites aux adresses par notion ; une cible introuvable arrête désormais le build
  (`rendu.morts`, autrefois un simple avertissement).
- **Simplification assumée** : les sommaires par dossier des six wikis (une page générée par
  dossier de cours) ne sont plus produits — ils n'étaient qu'une vue secondaire, remplacée par les
  pages de thème et l'index alphabétique. Écart au plan initial (qui proposait de les garder sous
  `section/`), fait pour tenir le chantier dans un temps raisonnable ; à rouvrir si Frank les veut.

## Chiffres

- Pages : 3991 → 3902 (−89, soit 112 notes archivées moins 23 déjà non publiées).
- Catégories : 151 → 143 (8 catégories tombées sous le seuil de 5 pages : leurs anciennes adresses
  `categorie/<x>.html` sont redirigées vers `categories.html`).
- Thèmes par wiki : Ergonomie 5, Hygiène industrielle 4, Toxicologie 4, Sécurité industrielle 3,
  Droit du travail 4, SST psychosociale 12 (4 des 16 notes `type: thème` sont
  `interne-non-publie` et n'entrent pas dans le compte).
- Notions sans thème (« Autres articles », restent joignables par l'index et la recherche) :
  Ergonomie 32, Hygiène industrielle 32, Toxicologie 19, Sécurité industrielle 30, Droit du travail
  18, SST psychosociale 166 (dont la majorité des 92 notes `type: concept`).
- Collisions de nom résolues (six wikis) : 7 — Hygiène (Contrainte thermique, Amiante),
  Sécurité (Espaces clos), Toxicologie (Amiante, Cancérogénicité, Solvants), SST psychosociale
  (Latitude décisionnelle). Le corps le plus long a gagné le slug nu dans chaque cas mesuré ; à
  confirmer avec Frank (point 3 ci-dessous).
- Table de redirection : 691 anciennes adresses.
- Tests : 111/112 (le seul échec, `textes-loi.test.mjs`, est antérieur à ce chantier et sans lien
  avec lui — 10 articles de loi sans texte extrait du PDF). `verif_liens.mjs` : 0 erreur sur
  239 045 liens internes. `verif_site.mjs` : conforme.

## Suite du 13 septembre 2026 : points 1, 2 et 7 tranchés par Frank (« go »)

`tools/promouvoir_fiches.mjs` (journal `content-updates/2026-09-13-promotion-fiches.json`,
sauvegarde locale `sauvegarde-vault/2026-09-13-promotion/`) : les cinq fiches sans équivalent et
la fiche Cadenassage sont revenues de « 98 - Archives » dans un dossier de notions de leur wiki,
frontmatter d'archivage retiré, rien d'autre réécrit (ni titre, ni corps, ni ton). Cadenassage
entre en collision de nom avec la jumelle du dossier « 27 - Articles gestionnaires » : la règle
C7 donne le slug nu (`w/securite/cadenassage.html`) à la note de « 20 - … », la jumelle passe à
`cadenassage-encadrement.html` (8e collision, redirigée). L'infographie « Quatre repères »
(image, version texte, sources) est réinsérée dans la notion « Manutention manuelle », à la fin
de sa Définition. 3902 → 3908 pages, 3430 médias. Les deux « Équipements de protection »
(Hygiène, Sécurité) restent des doublons : publiés chacun dans son wiki, à fusionner un jour si
Frank le veut. Points 3 à 6 : acceptés tels quels sur ma recommandation (rien à faire) ; point 4
laissé fermé.

## Suite du 13 septembre 2026 (bis) : ouverture des 32 notes internes (« tu peux publier — tout »)

`tools/publier_internes.mjs` (journal `content-updates/2026-09-13-publication-internes.json`,
sauvegarde locale `sauvegarde-vault/2026-09-13-publication/`) : les 32 notes encore retenues
hors archives sont ouvertes — `publish: false` retiré, `traitement-publication` interne passé à
`publie`, trace `publication-ouverte-le: 2026-09-13`. Frank a choisi « tout », en connaissance
du caractère public du site : les 8 questionnaires cliniques (PHQ-9, K10, PCL-5, MBI, JCQ, ERI,
scores, administration), Prévention du suicide, Alcool en FIFO, TSPT, les 4 Harcèlement/Violence,
les 3 Invalidité, les 5 notes marquées « à archiver », Iso-strain, l'index des images du cours,
et `art-221.1-LATMP` (dont l'existence restait à confirmer : sa page garde son encadré
d'avertissement). Effet : 3908 → 3940 pages ; psychosociale 12 → 16 thèmes (Invalidité et
Lésions, Modèles et Théories, Santé Mentale, Évaluation et Outils) ; 142 notions rattachées
au lieu de 109. Le point 4 ci-dessous est donc tranché. La note « Notes internes citées sur le
site » du vault (3 septembre) est périmée : plus aucune note interne hors archives.

## Points soumis à Frank (aucune action sans sa réponse)

1. **Cinq fiches disparaissent sans équivalent notionnel** *(fait le 13 septembre, voir ci-dessus)* : « Équipements de protection »
   (Hygiène/25 et Sécurité/25, doublons de 7 Ko), « Où appeler quand ça ne va pas »
   (psychosociale/25), « Presqu'accident » (Sécurité/25, 9 liens entrants), « Le risque électrique,
   ce que tu dois savoir » (Sécurité/26). Écrire une notion dans « 20 - … » ou accepter la perte.
2. **Fiche « Cadenassage » de Sécurité/25** (27 liens entrants, contenu validé le 6 septembre,
   tableau des énergies) : la promouvoir en notion de « 20 - … » rendrait au site sa seule page de
   fond sur le cadenassage écrite pour un lecteur non spécialiste ; sinon la jumelle du dossier
   « 27 - Articles gestionnaires » reste la seule page.
3. **7 collisions de nom tranchées mécaniquement** (corps le plus long) : à confirmer ou à fusionner
   (`tools/fusionner_doublons.mjs`) — Latitude décisionnelle (psychosociale, doublon en
   kebab-case), Amiante / Cancérogénicité / Solvants (Toxicologie, racine contre sous-dossier),
   Amiante / Contrainte thermique (Hygiène, 20 contre 27), Espaces clos (Sécurité, 20 contre 27).
4. **4 thèmes psychosociale marqués `interne-non-publie`** (Invalidité et Lésions, Modèles et
   Théories, Santé Mentale, Évaluation et Outils) : à ouvrir ou non.
5. **De nombreuses notions sans thème** (voir chiffres ci-dessus), dont 92 notes `type: concept`
   en psychosociale : à rattacher par la clé `theme:` quand Frank le juge utile.
6. **Huit catégories passées sous le seuil de 5** (harcèlement, bem, diesel, vibrations, pae,
   soutien, ressources, travailleurs) : relever des tags ou accepter.
7. **Une infographie a disparu du site** : « wiki-manutention-reperes-v1.png » n'était embarquée
   que dans la fiche travailleur « Manutention », maintenant archivée ; la notion « Manutention
   manuelle » ne la reprend pas. À réintégrer dans la notion si Frank le souhaite.
8. Choix éditoriaux volontairement laissés hors de ce chantier (chacun un commit distinct si Frank
   les demande) : retirer la ligne « Type » de l'infobox ; retirer les catégories de public
   (travailleur, gestionnaire, superviseur, direction) ; regénérer les sommaires par dossier sous
   `section/` plutôt que de les abandonner.
