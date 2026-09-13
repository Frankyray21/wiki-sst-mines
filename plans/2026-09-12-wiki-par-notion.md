# Plan : le WIKI SST devient un vrai wiki, par notion et par thème

Rédigé le 12 septembre 2026 pour être exécuté par un autre agent, sans accès à la conversation d'origine. Il synthétise quatre rapports de lecture (code, adresses, thèmes, vault), deux plans indépendants et une critique adversariale qui a vérifié chaque point dans le code. Les annexes dans `plans/2026-09-12-annexes/` contiennent les rapports complets avec les numéros de ligne relus ce jour ; **relire chaque voisinage avant d'éditer**, la critique a trouvé plusieurs numéros décalés (l'assertion « 404 autonome » est à `verif_site.mjs` l.138, pas l.128 ; `SCRIPT_REDIRECTION`, `SCRIPT_LIENS_404` et `rendrePage404` sont aux l.114-137 de `fiches_travailleurs.mjs`).

Dépôt : `C:/Users/Frank/Claude code/Wiki_SST_Site` (branche `main`, GitHub Pages publie `docs/`). Vault : `C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines`. Générateur : `tools/build_site.mjs` (1747 lignes le 12 septembre). Tests : `cd tools && npm test`. Vérifications : `node tools/verif_liens.mjs`, `node tools/verif_site.mjs`, `node tools/verif_rendu.mjs`, `node tools/verif_publication.mjs --staged`.

Contraintes absolues : ne jamais inventer de contenu SST ; ne pas renommer ni déplacer les notes du Recueil législatif (ses adresses ne changent pas non plus) ; aucun tiret cadratin ni demi-cadratin dans un texte écrit dans le vault ; chaque commit se termine par `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` ; ne jamais pousser deux fois à moins d'une minute (les deux builds Pages échouent) ; sauvegarde datée avant toute modification du vault ; **rester dans le périmètre décidé par Frank** (§ 0) : tout choix éditorial supplémentaire va au § 9, jamais dans le chantier.

---

## 0. Décisions de Frank (12 septembre 2026), à respecter telles quelles

1. Le wiki séparé pour les travailleurs est abandonné. Le site devient un vrai wiki organisé **par notion et par thème**.
2. Le portail « Espace encadrement » `/g/` (`tools/portail_encadrement.mjs`, `genererWikiPublic('g')`) **reste** comme portail d'entrée.
3. Les notes des dossiers `24 - Références internes pages travailleurs`, `25 - Articles travailleurs` et `26 - Brouillons travailleurs` des six wikis sont **archivées** dans `<wiki>/98 - Archives/` avec `publish: false`, après sauvegarde datée dans `sauvegarde-vault/2026-09-12-travailleurs/`.
4. Les adresses deviennent **par notion** : `/w/ergonomie/manutention-manuelle.html` au lieu de `/w/ergonomie/20-articles-internes/contraintes/manutention-manuelle.html`, avec redirection des anciennes adresses.

## 1. État mesuré (chiffres contre-vérifiés)

- 112 notes `.md` dans les dossiers 24/25/26 (et non 132) : Droit 12, Ergonomie 13, Hygiène 15, Psycho 48, Sécurité 14, Toxicologie 10. 23 sont déjà `publish: false`. 68 portent `version-jumelle: "[[…]]"` vers la notion correspondante (64 se résolvent). 14 sont des pages de navigation.
- 214 wikilinks depuis 93 notes hors 24/25/26 atterrissent aujourd'hui sur une fiche travailleur ; 99 sont des homonymes (Cadenassage 27, Espaces clos 20, Chaleur, Manutention, Postures) qui se re-résoudront seuls vers la notion survivante dès que la fiche est `publish: false` (`resolvePage`, build_site l.500-516). Sans renvoi vers la jumelle, les 115 autres deviendraient des mentions grises.
- 76 des 95 fiches de 25/26 ont un équivalent notionnel (60 à confiance élevée) : `plans/2026-09-12-annexes/equivalents-travailleurs.json`. 5 n'en ont aucun (§ 9).
- Thèmes rédigés (`type: thème`, dossier `10 - Thèmes`) **publiés** : Hygiène 4, Toxicologie 4, Sécurité 3, Droit 4, Psycho **12** (4 des 16 notes sont `traitement-publication: interne-non-publie` et écartées par `REFUS_ABSOLU` l.238 : Invalidité et Lésions, Modèles et Théories, Santé Mentale, Évaluation et Outils ; 3 autres ont `publication-gestionnaire: non`, absentes de `/g/`). Ergonomie 0, mais ses 5 sous-dossiers de `20 - Articles internes` (Fondements, Anatomie et biomécanique, Contraintes, Démarche, TMS) portent chacun une note index `type: index` homonyme du dossier.
- 364 notions (notes de 20/27 hors index) : 201 reliées à un thème, 163 orphelines (Psycho 102, Ergonomie 37 faute de thèmes, Droit 9, Sécurité 7, Hygiène 4, Toxicologie 4). Détail : `plans/2026-09-12-annexes/themes-par-wiki.json`.
- Collisions de noms après archivage, hors Recueil : 19 noms. 12 paires psycho « 10 - Thèmes/X.md » (thème) contre « 20 - Articles/X/X.md » (index de dossier), Latitude décisionnelle (`20 - Articles/Latitude-Décisionnelle.md`, doublon en kebab-case, contre `Modèles et Théories/Latitude décisionnelle.md`, l'article enrichi contrôlé par verif_site l.176), Hygiène Amiante et Contrainte thermique (20 vs 27), Sécurité Espaces clos (20 vs 27), Toxicologie Amiante, Cancérogénicité, Solvants (racine de 20 vs sous-dossier). Un nom réservé est déjà touché : `Wiki SST psychosociale/15 - Navigation/🔤 Index alphabétique.md` slugifie en `index-alphabetique`.
- Huit catégories passent sous le seuil de 5 avec l'archivage : harcèlement 6→4, bem 5→4, diesel 5→4, vibrations 6→4, pae 5→4, soutien 7→3, ressources 7→4, travailleurs 6→0 ; `categorie/travailleur.html` passe de 86 à 13 pages.
- Le wiki travailleurs `t/` n'est déjà plus généré ; il survit par `travailleurs.html` (index de 84 fiches), l'autorisation `S.add('t')` (build_site l.243-266, un seul consommateur l.1665), le module `tools/fiches_travailleurs.mjs`, la carte du portail racine, un lien dans la barre latérale de 4 430 pages, une étape de visite guidée et des règles CSS orphelines. 55 chemins codés en dur sur des dossiers numérotés (portail_encadrement 16, verif_site 28, verif_rendu 6, tests 32) casseront avec les adresses par notion.
- `sauvegarde-vault/` est dans `.gitignore` : une sauvegarde n'est jamais versionnée ; le journal d'archivage doit vivre dans `content-updates/`.
- Le serveur local `serve.mjs` renvoie un 404 texte (l.26), jamais `404.html` : les redirections ne se testent qu'unitairement puis en ligne.

## 2. Choix de conception retenus

Ossature du plan « fidélité » (annexe 5 : périmètre strictement 24/25/26, aucune page sautée, sommaires conservés, réservés suffixés, lots), greffée de trois idées du plan « encyclopédie » (annexe 6) validées par la critique : espace `theme/`, renvoi vers la version jumelle, cibles du portail `/g/` fatales.

| # | Choix | Décision retenue | Pourquoi |
|---|---|---|---|
| C1 | Adresse d'une notion | `w/<wiki>/<slugify(base)>.html` pour les six wikis (notions, accueils secondaires, index de dossier, démarrage rapide, glossaire, articles de loi locaux). Recueil : formule miroir actuelle, inchangée | Une adresse = une note ; indépendante du rangement en dossiers de cours |
| C2 | Thèmes | Espace réservé `w/<wiki>/theme/<slug>.html`. Source : les notes `type: thème` de `10 - Thèmes` **publiées** (liste construite depuis `pages` après le retrait de `refusees`) ; Ergonomie : les 5 notes index de sous-dossier. Aucune note de thème créée dans le vault | Sépare portail et notion comme Wikipédia sépare `Portail:` et article ; règle les 12 homonymies psycho sans suffixe |
| C3 | Rattachement notion → thème | Calculé au build, jamais écrit dans le vault : (1) clé frontmatter `theme:`/`thème:` qui résout vers une note de thème publiée ; (2) wikilink de la note de thème vers la notion ; (3) Ergonomie seulement : appartenance au sous-dossier de la note index. Premier trouvé = thème principal. Orphelines listées dans `tools/rapports/themes.json` et joignables par index alphabétique, sommaires, recherche | Rien d'inventé ; l'orphelinat est visible et se corrige dans le vault par la clé `theme:` |
| C4 | Pages de navigation du vault (accueils secondaires « 00 - Accueil gestionnaires », index « 27 - Articles gestionnaires.md », index de sous-dossier de `20 - Articles`) | **Rendues comme pages ordinaires** à leur adresse par nom. Aucune page sautée | Ce sont les cibles des cartes ROLES l.64 et EXPLORER l.108 du portail `/g/` que Frank garde ; les sauter serait une régression |
| C5 | Sommaires par dossier | Conservés comme vue secondaire sous `w/<wiki>/section/<dossiers slugifiés>/index.html` ; absents de la barre latérale des notions (sauf « Repères ») ; Recueil inchangé | Cibles de redirection ; seule vue groupée des dossiers 05/40/70 |
| C6 | Accueil d'un wiki | `w/<wiki>/index.html` directement (plus de stub meta-refresh pour les six wikis). Chapeau rédigé conservé ; **grille générée « Thèmes » insérée en première boîte** ; les sections rédigées de la note « 00 - 🏠 Accueil » restent rendues par `accueil_wiki.mjs`, avec `decouperAccueil` étendu pour retirer les `<p>` et `<h3>` réduits à une mention interne puis toute boîte sans plus aucun `<a>` ; sous-titre « N articles · T thèmes » | Les six notes d'accueil appartiennent à Frank (trois sont tronquées) ; on n'en jette rien, on signale (§ 9) |
| C7 | Collisions de slug | Règle explicite, jamais de `-2` silencieux sur les six wikis : homonyme sous `27 - …` reçoit `-encadrement` ; entre deux notes de `20 - …`, le slug nu va à la note au **corps le plus long** (le doublon kebab-case psycho perd), l'autre reçoit `-<slug du dossier parent nettoyé>` ; collision résiduelle = erreur de build. Noms réservés (`index`, `index-alphabetique`, `index-par-loi`, `theme`) : suffixe `-note`, jamais fatal. `tests/adresses.test.mjs` porte la liste attendue des collisions ; toute collision nouvelle le fait échouer. Recueil : `-2` conservé (exception connue `acgih`, documentée dans le test) | Aucune note renommée ; la fusion des doublons est une décision de Frank (§ 9) |
| C8 | Redirections | `404.html` autonome (ni `<link`, ni `assets/`, `noindex`) : règle générique (retirer les segments de dossier entre `w/<wiki>/` et `<slug>.html`, préfixe `t/` retiré, préfixe `g/` **conservé**) + table inline des exceptions générée par le build (collisions suffixées, thèmes, notes archivées, `travailleurs.html`) + règle `categorie/<x>.html` absente → `categories.html`. Copie de la table dans `docs/assets/redirections.json`. Aucun stub meta-refresh | GitHub Pages n'a pas de redirection serveur ; 4 100 stubs entreraient dans `hors-ligne.json` |
| C9 | Liens vers une fiche archivée | Renvoi automatique vers `version-jumelle` dans `resolvePage`, table **indexée par (wikiKey, base et alias)**, résolue d'abord dans le wiki de la note citante, appliquée seulement après l'échec de `byBase`/`byLoose`, chaque renvoi journalisé dans `tools/rapports/renvois.json` ; le script d'archivage pose `version-jumelle` sur les fiches qui n'en ont pas depuis `equivalents-travailleurs.json`, entrées `confiance: "élevée"` seulement ; sinon rendu gris « (source non publiée) » existant. Aucune note citante modifiée | « Chaleur » a une jumelle différente en Ergonomie et en Hygiène : une table globale enverrait au mauvais wiki |
| C10 | Voisins précédent/suivant | Réservés au Recueil. Sur les six wikis : bloc « Voir aussi » = jumelle publiée + jusqu'à 8 notions du même thème. Texte de l'étape de visite « Passer à la page voisine » (app.js l.810) reformulé pour le Recueil | L'ordre par dossier de cours n'a pas de sens par notion |
| C11 | Infobox | Ligne « Thème » calculée (C3) ajoutée ; la clé `theme:` du vault reste affichée telle quelle ; la ligne `Type` **reste** (retrait = choix éditorial, § 9) | Périmètre |
| C12 | Catégories (tags) | Inchangées (seuil 5, transversales) ; les tags de public restent des catégories (retrait = § 9) ; les 8 catégories qui passent sous le seuil sont redirigées par C8 et listées dans `content-updates/` | Périmètre |
| C13 | Page `themes.html` à la racine | Tous les thèmes groupés par wiki avec compte ; remplace la carte « Fiches pour les travailleurs » dans « Parcourir par sujet ». `.portal-sujets` et `.portal-publics` restent (app.js et le test commandes-entete s'y accrochent) | |
| C14 | Portail `/g/` | Forme inchangée ; arbre `g/w/<wiki>/<slug>.html` aplati automatiquement (`out = pub + '/' + p.out`, l.1556) ; `rendu.morts.length > 0` devient une **erreur de build dès l'étape E1**, avant tout changement d'adresse ; les 20 cibles sont réécrites d'après les slugs réels lus dans `docs/` après le premier build | Aujourd'hui une cible absente devient `href="#"` avec un simple `console.warn` (l.1588) et `verif_liens` ignore `href="#"` (l.31) |
| C15 | Pages « 05 - Démarrage rapide », « 30 - Glossaire », « 15 - Navigation », « 40 - Articles de loi », « 50 - Ressources d'aide », « 70 - Documents et outils » | Pages ordinaires à adresse par nom ; glossaire et index par loi dans la barre latérale | Attention aux slugs réels : « 30 - Glossaire.md » → `30-glossaire`, « Glossaire commun » en Hygiène/Sécurité/Toxicologie |
| C16 | Dossier `27 - Articles gestionnaires` | Ses 37 notes restent publiées (33 « jumelles gestionnaire », 6 uniques pages de fond de leur sujet) ; suffixe `-encadrement` en cas d'homonymie avec 20 | Frank n'a abandonné que le wiki des travailleurs ; `/g/` repose dessus |
| C17 | Livraison | Branche `wiki-par-notion` depuis `main`, un commit par étape, `merge --ff-only` puis un seul push à la fin | Un seul build Pages ; pas d'état intermédiaire déployé où les 111 anciennes adresses tombent en 404 sans redirection |
| C18 | Hors ligne | Aucun changement à `sw.js` ; retéléchargement complet (~61 Mo de pages) accepté à la première synchronisation ; `nettoyer` (pwa.mjs l.225-241) purge les anciennes clés au terme d'une synchronisation complète (l.281) ; dans `404.html`, si l'adresse est déjà de forme nouvelle, rechargement automatique après 30 s (cache de bord GitHub ~10 min) | Mécanisme déjà testé (`tests/hors-ligne.test.mjs`) |

## 3. Étapes ordonnées

### E0. Préparation
1. `git checkout -b wiki-par-notion` ; `cd tools && npm test` ; `node build_site.mjs` : état vert, noter les chiffres du journal (pages, non publiées, « 👷 fiches »).
2. `git tag avant-notion-2026-09-12`.
3. Fermer Obsidian et **suspendre la synchronisation OneDrive** pendant E1 (13 `renameSync` de dossiers ; les veilleurs de fichiers recréent des dossiers). Vérifier que `98 - Archives` n'est pas dans `EXCLUDE_DIRS` (l.48) : `notesInternes` doit voir les 112 notes.

### E1. Vault : sauvegarde puis archivage des dossiers 24/25/26 ; portail `/g/` rendu fatal
Nouveau script `tools/archiver_travailleurs.mjs` (modèle : `tools/archiver_stubs_refuses.mjs` ; simulation par défaut, `--appliquer`, `--annuler`).
- Constantes : `VAULT` (même valeur que build_site l.22), `SAUV = sauvegarde-vault/2026-09-12-travailleurs`, six wikis (jamais le Recueil), `DOSSIERS = ['24 - Références internes pages travailleurs', '25 - Articles travailleurs', '26 - Brouillons travailleurs']`.
- Pour chacun des 13 dossiers existants : (a) `fs.cpSync` intégral vers `SAUV/<wiki>/<dossier>/` ; (b) `mkdir 98 - Archives` si absent (n'existe qu'en psycho) puis `fs.renameSync` vers `<wiki>/98 - Archives/<dossier>` (arrêt si la destination existe ; repli `cpSync` + `rmSync` sur EXDEV) ; (c) frontmatter de chaque `.md` par insertion textuelle (pas de re-sérialisation YAML, fins de ligne préservées, BOM retiré) : `publish: false` (remplacer la ligne existante, sinon insérer ; créer le bloc s'il manque), `chemin-origine: "<relPath d'origine sans .md>"`, `archive-date: 2026-09-12`, `motif-archivage: "Wiki des travailleurs abandonne le 12 septembre 2026 ; la notion vit dans l article principal, voir version-jumelle."` ; si la note n'a pas de `version-jumelle` et que `plans/2026-09-12-annexes/equivalents-travailleurs.json` donne un équivalent `confiance: "élevée"`, ajouter `version-jumelle: "[[<equivalent>]]"`. Ne rien retirer d'autre.
- Journal **versionné** : `content-updates/2026-09-12-archivage-travailleurs.json` (`{wiki, ancien, nouveau, publishAvant, versionJumelle, ajoutee, frontmatterAvant}`) ; `--annuler` le relit et restaure depuis la sauvegarde. Le message de commit dit que la sauvegarde est locale (dossier ignoré par git) et que l'historique OneDrive fait foi.
- Ne pas toucher « 🏠 WIKI SST - Mines.md » ni « Notes internes citées sur le site.md ». En tête de « Brouillons travailleurs à valider.md » (note à moi, jamais construite), ajouter : « Archivé le 12 septembre 2026 : le wiki des travailleurs est abandonné, les fiches sont dans 98 - Archives de chaque wiki. »
- Exécuter en simulation (attendu 112, psycho 48), puis `--appliquer`. Contrôle : `find "<VAULT>/Wiki */98 - Archives" -name '*.md' | wc -l` = 51 + 112 ; aucun dossier 24/25/26 à la racine des wikis ; `grep -L '^publish: false'` vide sur les dossiers archivés.
- `build_site.mjs` l.1583-1591 : remplacer le `console.warn` sur `rendu.morts` par `throw new Error(...)` **maintenant** ; `node build_site.mjs` doit encore passer (aucune cible de `/g/` ne vise 24/25/26).
- Commit 1 : « Archivage des fiches travailleurs dans 98 - Archives, portail de l'encadrement vérifié à la construction ».

### E2. Nouveau module `tools/adresses.mjs`
Exporte `slugify` (déplacé de build_site l.76-84), `cleanLabel` (l.122-125), `RESERVES`, `ancienneAdresse(p, slugWiki)` (formule miroir l.376-377, sans suffixe), `adresseDe(p, slugWiki, role)` (Recueil → ancienne ; `accueil` → `w/<slug>/index.html` ; `theme` → `w/<slug>/theme/<slugify(base)>.html` ; sinon `w/<slug>/<slugify(base)>.html` ; réservé → suffixe `-note`), `attribuerAdresses(pages, WIKIS)` (pose `p.ancienOut` et `p.out`, résout les collisions selon C7, garde `usedOut -2` pour le Recueil seulement, retourne les collisions résolues). `appliquer_renvois.mjs` l.45 (formule dupliquée) importe ce module.
Test `tests/adresses.test.mjs` : accueil, thème, notion, réservé (`🔤 Index alphabétique` → `index-alphabetique-note`), collision 20/27 (Amiante hygiène → `amiante` et `amiante-encadrement`), collision racine/sous-dossier (Solvants toxicologie, gagnant = corps le plus long), Latitude décisionnelle (l'article enrichi gagne), Recueil inchangé avec l'exception `acgih`, liste attendue des 19 collisions.

### E3. `tools/build_site.mjs`
1. Imports l.10 : retirer `fiches_travailleurs.mjs` ; ajouter `adresses.mjs` et `redirections.mjs` (E4). Retirer la fonction locale `slugify`.
2. Public « t » : `publicsDeLaPage` l.243-267 : l.254 devient `S.add('g'); return S;` ; supprimer l.257-260 (`okTravailleur`) ; garder la branche `g` l.264-265 ; réécrire les commentaires l.35-38, l.216-220, l.238-240, l.1543.
3. Rôles (nouveau bloc avant le calcul des adresses, après l.370, **après le retrait de `refusees`**) : `SIX` = les six wikis ; `p.role` ∈ `loi`, `accueil` (`wikiHome(wikiKey) === p`, déplacer `wikiHome` l.845-848 plus haut), `theme` (`type` ∈ {thème, theme} et `parts[1]` /^10 - / ; à défaut, wiki sans aucun thème publié : `type === 'index'`, `parts.length === 4`, `parts[1]` /^20 - /, `cleanLabel(base) === cleanLabel(parts[2])`), sinon `notion`. Journal console par wiki (thèmes attendus : Ergonomie 5, Hygiène 4, Toxicologie 4, Sécurité 3, Droit 4, Psycho 12).
4. Adresses l.372-382 : `const collisions = attribuerAdresses(pages, WIKIS)` ; afficher chaque collision ; écrire `tools/rapports/adresses.json` (`ancienOut → out`) et `collisions.json`. Suivent automatiquement : `rootOf` l.744, `urlDe` l.574-579, arbre `g/` l.1556, graphe l.1419, index de recherche l.1465, cartes du portail l.1690.
5. Renvois (C9) après l.348 : `renvois = Map(wikiKey → Map(base et alias minuscules → cible de version-jumelle))` pour les `refusees` des six wikis (premier wikilink de `version-jumelle`). Dans `resolvePage` l.500-516, après l.509 : chercher `renvois.get(from.wikiKey)`, puis les autres wikis ; `if (j && profondeur < 2) return resolvePage(j, from, profondeur + 1)` ; journaliser `{citante, lien, cible}` dans `tools/rapports/renvois.json`.
6. Rattachement aux thèmes (C3), bloc après la boucle de rendu (l.1024, quand `p.liens` existe) : `p.themes`, `p.themePrincipal`, `themes[wikiKey]`, `orphelines[wikiKey]` ; rapport `tools/rapports/themes.json` ; journal console.
7. Barre latérale `wikiSidebar` l.809-820 : six wikis : Accueil du wiki, thèmes, « Repères » (sections de premier niveau autres que 00/10/20/27 vers `section/<slug>/index.html`), Glossaire (si trouvé), Index alphabétique, Index par loi (si `articlesLoi`) ; `wikiSections` l.822-843 reste calculé pour les sommaires. `pageShell` l.790-795 : supprimer l.792 (fiches) ; le lien `g/index.html` rejoint « Navigation » sous « 🎓 Espace encadrement » ; ajouter « 🗂️ Thèmes » → `themes.html`.
8. Fil d'Ariane l.1053-1059 : six wikis : Portail › Wiki › Thème principal (notion rattachée) ; Portail › Wiki (thème, accueil) ; Portail › Wiki › Section (page sans thème, vers `section/<slug>/index.html`) ; Recueil inchangé.
9. Voir aussi (C10) : `voisinsHtml` l.1041-1048 appelé seulement pour le Recueil ; sinon `voirAussiHtml(p)` ; style `.voir-aussi` dans `style.css`.
10. Infobox l.851-857 : ajouter la ligne « Thème » calculée depuis `p.themes` quand la clé du vault est absente.
11. Page de thème (boucle l.1051-1090, `p.role === 'theme'`) : fil d'Ariane, titre « Un thème du wiki … », corps rédigé intact, puis « Articles de ce thème (N) » (titre + extrait) et « Autres thèmes du wiki ». Pas d'infobox ni de voir-aussi.
12. Accueil du wiki (C6) `contenuAccueil` l.1096-1117 : grille « Thèmes » en première boîte (`.cat-grid`/`.cat-card`), sections rédigées ensuite ; sous-titre « N articles · T thèmes » ; supprimer l.1109 (fiches) ; garder l.1110 (`/gestionnaires/i` → `g/index.html`). `accueil_wiki.mjs` `decouperAccueil` (l.40-83) : retirer aussi les `<p>` et `<h3>` réduits à un `span.interne-inline`/`abroge-inline`, puis toute boîte sans plus aucun `<a>` ; signaler chaque retrait au build (l'accueil Ergonomie l.56-59 et Sécurité l.34-42 gardent sinon une boîte « Articles travailleurs » avec un titre gris).
13. Sommaires par dossier l.1143-1218 : six wikis : `outDir = 'w/' + slug + '/section/' + dossiers slugifiés` ; `dirCards` l.1170-1174 et `crumbsCat` l.1199-1204 suivent ; le stub `w/<wiki>/index.html` l.1160-1167 ne sert plus qu'au Recueil. En tête d'un sommaire dont un thème est homonyme : lien « Voir le thème X ».
14. Index alphabétique l.1221-1238 : regrouper les pages `theme` en tête sous « Thèmes ».
15. Index de recherche l.1477-1479 : six wikis : `e.c` = thèmes joints par « · », sinon chemin nettoyé ; ajouter une entrée par page de thème (`w: 'Thème'`, `i: '🗂️'`, comme les catégories l.1489-1497).
16. `themes.html` (C13) via `pageShell` ; l'ajouter à l'index de recherche.
17. Parcours `/g/` l.1545-1595 : `sidebarPublic` l.1597-1606 supprimer l.1603 ; pages de thème rendues par `contenuTheme` avec `urlDe`.
18. Index des fiches l.1660-1682 : supprimer l.1660-1680 et l.1682 ; à la place, construire la table de redirection (§ 5) et écrire `404.html` avec `rendrePage404(table)` ; l.1697 : retirer `nbFiches`, passer `nbThemes`.
19. Compteur de liens rendus gris vers des notes archivées, ventilé par note citante, dans `tools/rapports/liens-archives.json`.
Commit 2 : « Adresses par notion, thèmes et accueils dans build_site ».

### E4. Modules annexes
1. `tools/redirections.mjs` (nouveau ; `fiches_travailleurs.mjs` supprimé) : `SCRIPT_REDIRECTION(table)` (§ 5), `SCRIPT_LIENS_404` (repris de fiches_travailleurs l.119-124 sans `t`), `rendrePage404(table)` (repris de l.126-137 : autonome, `noindex`), `migrerAdresse(rel, table)` en JS pur pour les tests et `app.js`.
2. `tools/portail_racine.mjs` : supprimer l.3 (import) ; `nbFiches` → `nbThemes` (l.9) ; l.18 : « Les N pages, classées par discipline, par thème et par notion, avec le recueil des lois et règlements. » ; carte l.26-29 remplacée par « 🗂️ Thèmes » → `themes.html` ; garder l.35-41.
3. `tools/app.js` : l.799 texte de la visite du portail (catégories et thèmes) ; l.810 texte « Passer à la page voisine » (Recueil) ; migration au chargement de `historique` (l.461-468) et `favoris` (l.487-501) par `migrerAdresse` (règle générique) ; préfixe en dur `/wiki-sst-mines/` l.456 → `window.ROOT` si simple.
4. `tools/pwa.mjs` l.70 : description du manifeste sans « travailleurs ».
5. CSS : `style.css` supprimer l.668-672 (`.rub-*`), l.674-681 (`.encart-urgence`), l.761-771 (`.encadre-urgence`, garder l.772-773) ; ajouter `.voir-aussi`, `.theme-grille`. `portail.css` supprimer l.217-232. Vérifier par grep qu'aucun générateur ne les émet.
6. `tools/entete-article.mjs` (pilote de l'en-tête compact, l.2 vise la fiche Cadenassage 25 archivée) et `verif_site.mjs` l.91-120 (tableau des énergies, 5 sections, ancre `arreter-ne-suffit-pas` sur cette même page) : **retirer le pilote et son bloc de vérification** ainsi que `tests/entete-article.test.mjs` ; la jumelle 27 « Programme de cadenassage CSA Z460 » n'a pas ce contenu, « repointer » ne suffit pas. Alternative soumise à Frank au § 9 (promouvoir la fiche en notion).
7. `tools/accueil_wiki.mjs` l.1-2, l.23 : commentaires.
Commit 3 : « Redirections, portail racine, visite guidée et styles sans vestige du wiki des travailleurs ».

### E5. `tools/portail_encadrement.mjs` : 20 cibles réécrites
Après le premier build de E3, lire les slugs réels dans `docs/w/<wiki>/` (ne pas les deviner : « 30 - Glossaire.md » donne `30-glossaire.html`, Hygiène/Sécurité/Toxicologie ont « Glossaire commun »). Correspondance ligne par ligne dans l'annexe 6 § E5, à corriger avec les slugs réels ; cas particuliers : ROLES l.64 et EXPLORER l.108 gardent leurs cibles (accueils secondaires et index 27, rendus par C4, à leur nouvelle adresse par nom) ; barre l.170-171 → glossaire psycho et note réelle de « 50 - Ressources d'aide » (l'ancien `50-ressources-daide/index.html` devient `section/50-ressources-daide/index.html`). Nouveau `tests/portail-encadrement.test.mjs` : chaque cible existe dans `docs/`, `rendu.morts.length === 0`. Repère : `grep -c 'href="#"' docs/g/index.html` vaut **4** par conception (Accueil, Favoris, `#tbVoirHist`, `#tbVoirFav`).
Commit 4 : « Portail de l'encadrement : cibles aux adresses par notion ».

### E6. Vérificateurs et tests
- `verif_site.mjs` : l.44 inverser (interdire `travailleurs.html` et « Fiches pour les travailleurs ») ; l.122-138 : garder l.124 et l.135, supprimer l.125-134, réécrire l.136-138 (la 404 contient `location.replace` et `var T=`, ni `<link` ni `assets/`) ; réadresser les chemins de présence (`grep -n "25-articles-travailleurs\|26-brouillons\|20-articles-internes\|27-articles-gestionnaires\|20-articles/\|10-themes" tools/verif_site.mjs`) et **aussi les assertions négatives** (l.172, 214, 237, 267 : « parcours non élargi » sur `g/w/…`), en vérifiant qu'elles échouent si l'on force la page dans `/g/` ; retirer le bloc l.91-120 (E4.6) ; ajouter : aucune page des six wikis à plus d'un niveau sous `w/<wiki>/` sauf `theme/` et `section/` ; aucun `-2.html` hors `w/legislation/` ; `docs/themes.html` existe ; chaque `docs/w/<six>/index.html` contient « Thèmes » ; aucune page ne contient « Articles travailleurs » dans `.breadcrumbs` ou `.sidebar` ; chaque valeur de `docs/assets/redirections.json` existe dans `docs/` ; thèmes par wiki = 5/4/4/3/4/12.
- `verif_rendu.mjs` l.23-31 : retirer les 6 accueils 25 ; réadresser la ligne 27/g.
- Tests supprimés : `fiches-travailleurs.test.mjs`, `entete-article.test.mjs`, `terrain-references.test.mjs`, `terrain-references-lot2.test.mjs` (remplacés par un test : les 112 notes de `98 - Archives/2x - …` portent `publish: false` et `motif-archivage`).
- Tests adaptés : `portail-racine` (l.7 `nbThemes`, l.16 exiger `href="themes.html"`, garder l.13 et l.15), `commandes-entete` l.46-49 (interdire `travailleurs.html` et « Fiches pour les travailleurs »), `accueil-wiki` l.13-18, 21, 123-126, 148-149, `rendu-mobile` l.4 et l.14 (remplacer `rendreIndexFiches`), `recherche-rappel` l.39, `rps-references*` (repointer si nécessaire), `appliquer-renvois` (fixture, garder).
- Nouveaux tests : `adresses.test.mjs` (E2), `redirections.test.mjs` (cas du § 5), `themes.test.mjs` (règles C2/C3 sur un faux jeu de pages, dont un thème `interne-non-publie` ignoré), `portail-encadrement.test.mjs` (E5).
Commit 5 : « Vérificateurs et tests alignés sur le wiki par notion ».

### E7. Documentation, construction, déploiement
- `README.md` l.21-47 et l.121 ; `content-updates/2026-09-09-integration-travailleurs.md` : post-scriptum « remplacé le 12 septembre 2026 par l'archivage » ; nouveau `content-updates/2026-09-12-wiki-par-notion.md` (décisions, comptes réels, 19 collisions et leur gagnant, orphelines par wiki, 8 catégories passées sous le seuil, 5 sujets sans équivalent, renvois appliqués, limites hors ligne).
- Commit 6 : « Documentation : wiki par notion et par thème ».
- § 6 en entier, puis `git checkout main && git merge --ff-only wiki-par-notion && git push`. Attendre 2 minutes ; si « Page build failed », `gh api -X POST repos/Frankyray21/wiki-sst-mines/pages/builds`.
- Mémoires : § 8.

## 4. Liens entrants vers les pages archivées

Aucune note citante n'est modifiée. Après archivage :
1. Homonymes (99 liens) : `resolvePage` choisit l'homonyme survivant (`[[Cadenassage]]` depuis Sécurité → `27/Cadenassage`, `[[Espaces clos]]` depuis Hygiène → notion de 20). Comportement voulu, aucun code.
2. Jumelle déclarée ou posée par E1 : `renvois` par wiki (E3.5) fait résoudre le nom de la fiche et ses alias vers la notion, d'abord dans le wiki de la note citante. Le libellé saisi est conservé (l.652-658).
3. Ni homonyme ni jumelle : `<span class="interne-inline">Nom <small>(source non publiée)</small></span>` (l.627-628), jamais rouge ; `verif_liens.mjs` ne les compte pas comme morts.
4. Anciennes adresses (favoris, historique, liens externes) : table de redirection → adresse de la jumelle, sinon accueil du wiki.
5. Notes citantes lourdes (six accueils, « 05 - Démarrage rapide - Travailleur » d'Ergonomie, Hygiène et Sécurité, `Sécurité/10 - Thèmes/Sécurité machines`, note racine l.36 avec chemin périmé) : rien à faire pour le site ; signalées à Frank (§ 9).

Contrôle : `grep -o 'interne-inline' -r docs/w | wc -l` reste proche du niveau actuel (77 le 3 septembre) ; `renvois.json` liste les liens sauvés ; `verif_liens.mjs` = 0 erreur.

## 5. Adresses, collisions, redirections

Schéma : notion `w/<wiki>/<slugify(base)>.html` ; accueil `w/<wiki>/index.html` ; thème `w/<wiki>/theme/<slug>.html` ; sommaire `w/<wiki>/section/<dossiers>/index.html` ; index `w/<wiki>/index-alphabetique.html`, `w/<wiki>/index-par-loi.html` ; Recueil : formule miroir actuelle ; encadrement : `g/` + la même adresse. `rootOf` donne `../../` pour une notion et `../../../` pour un thème ou un sommaire de premier niveau, automatiquement.

Collisions attendues après E1 (C7) : Hygiène `amiante-encadrement`, `contrainte-thermique-encadrement` ; Sécurité `espaces-clos-encadrement` ; Toxicologie `amiante`/`amiante-substances-dangereuses`, idem Cancérogénicité et Solvants (gagnant = corps le plus long, à lire dans `collisions.json`) ; Psycho `latitude-decisionnelle` (Modèles et Théories) et `latitude-decisionnelle-articles` ; `index-alphabetique-note` (psycho 15 - Navigation). Les 12 paires psycho thème/index disparaissent par C2 (le thème est sous `theme/`, l'index garde le slug nu).

Table de redirection (E3.18, inline dans `404.html` sous `var T = {...}`, copie dans `docs/assets/redirections.json`, clés et valeurs relatives à la racine du site) : pages où la règle générique ne donne pas `p.out` (accueils, thèmes, collisions suffixées, réservés) ; notes archivées (`chemin-origine` → ancienne adresse) → jumelle sinon accueil du wiki ; `travailleurs.html` → `index.html`. Taille attendue : 200 à 300 entrées.

Script inline de `404.html` (`redirections.mjs`) :
```js
(function () {
  var T = /* table JSON */;
  var m = location.pathname.match(/^(.*?\/)((?:t\/)?(g\/)?(?:w\/|categorie\/|travailleurs\.html).*)$/);
  if (!m) return;
  var base = m[1], g = m[3] || '', rel = m[2].replace(/^t\//, '').replace(/^g\//, '');
  var cible = T[rel];
  if (!cible) {
    var w = rel.match(/^w\/([^\/]+)\/(?:.+\/)?([^\/]+)\.html$/);
    if (w && w[1] !== 'legislation' && rel.indexOf('/section/') < 0 && rel.indexOf('/theme/') < 0) {
      cible = w[2] === 'index' ? 'w/' + w[1] + '/section/' + rel.slice(('w/' + w[1] + '/').length) : 'w/' + w[1] + '/' + w[2] + '.html';
    } else if (/^categorie\/[^\/]+\.html$/.test(rel)) cible = 'categories.html';
  }
  if (cible && cible !== rel) location.replace(base + (cible.indexOf('w/') === 0 ? g : '') + cible + location.search + location.hash);
  else if (cible === rel) setTimeout(function () { location.reload(); }, 30000); // adresse déjà nouvelle : cache de bord GitHub encore périmé
})();
```
`t/` retiré, `g/` conservé (un favori de l'encadrement reste dans `/g/`) ; `cible !== rel` empêche toute boucle ; le Recueil n'est jamais réécrit ; `w/<wiki>/<dossiers>/index.html` → `section/…/index.html`. GitHub Pages sert `404.html` (statut 404) pour toute adresse absente ; le service worker (réseau d'abord, ne met en cache que `rep.ok`, pwa.mjs l.140-146) la laisse passer. Hors ligne, `secours()` (l.123-132) sert l'ancienne copie tant que `nettoyer()` n'a pas purgé les anciennes clés au terme d'une synchronisation complète : un appareil qui n'ouvre le site que quelques minutes garde un site fantôme cohérent pendant des jours. Accepté ; à écrire dans le README et le commit.

## 6. Vérification

1. `cd tools && npm test` : tout vert (dont `adresses`, `redirections`, `themes`, `portail-encadrement`).
2. `node tools/build_site.mjs` : « Non publiées » croît de 89 (112 moins 23) ; collisions résolues = liste du § 5, aucune erreur ; thèmes par wiki : Ergonomie 5, Hygiène 4, Toxicologie 4, Sécurité 3, Droit 4, Psycho 12 ; orphelines (Psycho ~102, Ergonomie 0) ; portail g : 0 cible introuvable (sinon le build s'arrête) ; retraits signalés par `decouperAccueil`.
3. `node tools/verif_liens.mjs` (0 erreur) ; `node tools/verif_site.mjs` ; `node tools/verif_rendu.mjs` ; `git add -A && node tools/verif_publication.mjs --staged`.
4. Shell : `find docs/w/<wiki> -name '*.html' | grep -v -e '/theme/' -e '/section/' | awk -F/ 'NF>4'` vide pour les six wikis ; `docs/t` et `docs/travailleurs.html` absents ; `grep -rl 'Fiches pour les travailleurs' docs | wc -l` = 0 ; `find docs/w -name '*-2.html' | grep -v legislation` vide ; chaque valeur de `redirections.json` existe ; `grep -c 'href="#"' docs/g/index.html` = 4.
5. Navigateur (`node tools/serve.mjs`, port 8090 ; Browser pane ; clair et sombre ; 375 px) : `index.html` (carte Thèmes, compte, plus de carte travailleurs) ; `themes.html` ; `w/ergonomie/index.html` (grille de 5 thèmes puis sections rédigées, aucune boîte « Articles travailleurs ») ; `w/ergonomie/theme/contraintes.html` ; `w/ergonomie/manutention-manuelle.html` (fil d'Ariane à 3 maillons, infobox avec Thème, Voir aussi, backlinks, graphe) ; `w/hygiene/amiante.html` et `amiante-encadrement.html` ; `w/psychosocial/theme/communication.html` et `w/psychosocial/communication.html` (index de dossier, lien vers le thème) ; un article du Recueil (voisins présents, adresse inchangée) ; `g/index.html` (cartes cliquables, visite guidée) ; `categories.html` ; console sans erreur ; `localStorage.historique` migré.
6. Redirections : `redirections.test.mjs` en local, puis en ligne après déploiement : `…/w/ergonomie/20-articles-internes/contraintes/manutention-manuelle.html`, `…/t/w/securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html`, `…/g/w/hygiene/27-articles-gestionnaires/contrainte-thermique.html` (reste dans `/g/`), `…/travailleurs.html`, `…/w/psychosocial/10-themes/communication.html`, `…/categorie/vibrations.html`, `…/w/legislation/index-par-loi.html` (pas de redirection).
7. Hors ligne, sur un appareil déjà synchronisé : panneau 📶, synchronisation complète, mode avion : une nouvelle adresse répond, une ancienne tombe sur `offline.html` une fois `nettoyer` passé ; Cache Storage `wiki-sst-pages` sans clé `…/20-articles-internes/…` ; les caches des autres sites de l'origine ne bougent pas.
8. Retour arrière : `git revert` du commit fautif ; vault : `node tools/archiver_travailleurs.mjs --annuler`.

## 7. Risques relevés par la critique adversariale et parades intégrées

| Gravité | Risque | Parade dans ce plan |
|---|---|---|
| bloquant | Un nom réservé fatal arrêterait le build sur « 🔤 Index alphabétique.md » (psycho) | C7 : suffixe `-note`, jamais fatal |
| bloquant | Table de renvois par nom seul : « Chaleur » a une jumelle différente en Ergonomie et en Hygiène ; le dernier inscrit gagne sans avertissement | C9 : table par (wiki, nom), wiki de la note citante d'abord, journal `renvois.json` |
| grave | 4 des 16 thèmes psycho sont `interne-non-publie` : compter 16 fait échouer les vérifications et redirigerait vers des thèmes inexistants | C2 : thèmes construits depuis `pages` après `refusees` ; attendus 5/4/4/3/4/12 |
| grave | Les accueils rédigés gardent une boîte « Articles travailleurs » avec titre gris (`decouperAccueil` ne retire que les `<li>` réduits à un span) | E3.12 : retrait des `<p>`/`<h3>` internes puis des boîtes sans `<a>` |
| grave | Sauter les accueils secondaires et index 27 retirerait les pages d'entrée de `/g/` (ROLES l.64, EXPLORER l.108) | C4 : aucune page sautée |
| grave | Cibles du portail `/g/` silencieusement mortes (`href="#"` + `console.warn`, ignoré par `verif_liens`) ; slugs devinés faux (`glossaire` vs `30-glossaire`) | C14 / E1 : `rendu.morts` fatal avant tout changement ; slugs lus dans `docs/` ; repère `href="#"` = 4 |
| mineur | 8 catégories passent sous le seuil, aucune redirection `categorie/` | C8 : règle `categorie/<x>.html` absente → `categories.html` ; liste dans `content-updates/` |
| mineur | Assertions négatives de `verif_site` (l.172, 214, 237, 267) deviennent vides | E6 : réadressées et testées en forçant la page |
| mineur | Hors ligne : site fantôme jusqu'à synchronisation complète ; cache de bord GitHub 10 min sert `404.html` sur une adresse valide | C18 : accepté et documenté ; rechargement automatique après 30 s |
| mineur | Le slug nu irait au doublon kebab-case « Latitude-Décisionnelle.md » (relPath le plus court) | C7 : gagnant = corps le plus long ; collisions soumises à Frank (§ 9) |
| mineur | `sauvegarde-vault/` ignoré par git | E1 : journal versionné dans `content-updates/`, historique OneDrive |
| mineur | Pilote `entete-article.mjs` et `verif_site` l.91-120 visent la fiche Cadenassage 25 archivée ; la jumelle 27 n'a pas ce contenu | E4.6 : pilote et bloc retirés ; promotion de la fiche soumise à Frank |
| mineur | Plan « encyclopédie » dépassait la décision (archivage hors 24/25/26, accueils jetés, ligne Type, catégories de public) | Sortis du chantier, § 9 |
| mineur | Numéros de ligne décalés dans les deux plans | Préambule : relire chaque voisinage |
| oubli | `serve.mjs` ne sert jamais `404.html` | § 6.6 : test unitaire puis contrôle en ligne |
| oubli | Notes racine « Notes internes citées sur le site.md » (86 noms) et « Brouillons travailleurs à valider.md » deviennent fausses (114 noms ou alias archivés sans homonyme publié) | E1 : en-tête daté sur la seconde ; régénération de la première proposée au § 9 |
| oubli | Étape de visite « Passer à la page voisine » (app.js l.810) parle de « pages du même dossier » | E4.3 : texte reformulé pour le Recueil |
| oubli | Obsidian et OneDrive pendant 13 `renameSync` | E0.3 |
| oubli | `-2` silencieux du Recueil (`acgih`) | C7 : exception documentée dans le test |

## 8. Mémoires à mettre à jour (après déploiement réussi)

- `C:/Users/Frank/.claude/projects/C--Users-Frank-Claude-code/memory/site-wiki-sst-mines.md` : remplacer « Trois entrées depuis le 28 août 2026 » par « Deux entrées depuis le 12 sept. 2026 : `/w/` fond documentaire par notion et par thème, `/g/` espace encadrement ; wiki travailleurs abandonné, 112 notes de 24/25/26 archivées dans `<wiki>/98 - Archives/` (sauvegarde locale `sauvegarde-vault/2026-09-12-travailleurs/`, journal `content-updates/2026-09-12-archivage-travailleurs.json`, `tools/archiver_travailleurs.mjs --annuler`) » ; ajouter « Adresses par notion (12 sept.) : `tools/adresses.mjs` (règle C7, suffixe `-encadrement`, gagnant = corps le plus long, réservés `-note`), thèmes = notes `type: thème` publiées (psycho 12, 4 internes) ou index de sous-dossier (Ergonomie), pages `w/<wiki>/theme/`, sommaires `section/`, `tools/redirections.mjs` + table inline dans 404.html + `assets/redirections.json`, renvoi automatique vers `version-jumelle` par wiki, `rendu.morts` fatal, rapports dans `tools/rapports/` » ; passer au passé les puces « Publication du wiki travailleurs (3 sept.) » et « Brouillons travailleurs » ; corriger le compte de pages (`docs/assets/version.json`, 3 991 avant chantier).
- `MEMORY.md` : ligne « Site Wiki SST Mines » : compte réel, « organisé par notion et par thème depuis le 12 sept. 2026 ».
- Leçon à consigner : une adresse ne doit jamais encoder le rangement du vault ; toute nouvelle page passe par `adresses.mjs` ; toute collision nouvelle casse `tests/adresses.test.mjs` ; un plan doit compter les pages publiées, pas les notes du vault.

## 9. Points à soumettre à Frank après exécution (aucune action sans sa réponse)

1. Cinq fiches disparaissent sans équivalent notionnel : « Équipements de protection » (Hygiène/25 et Sécurité/25, doublons de 7 Ko), « Où appeler quand ça ne va pas » (psycho/25), « Presqu'accident » (Sécurité/25, 9 liens entrants), « Le risque électrique, ce que tu dois savoir » (Sécurité/26). Options : écrire une notion dans `20 - …` ou accepter la perte.
2. Fiche « Cadenassage » de Sécurité/25 (27 liens entrants, contenu validé le 6 septembre, tableau des énergies) : la promouvoir en notion de `20 - …` (déplacement, pas réécriture) rendrait au wiki sa seule page de fond sur le cadenassage côté travailleur ; sinon la jumelle 27 « Programme de cadenassage CSA Z460 » reste la seule page.
3. 19 collisions d'homonymes tranchées par une règle mécanique (corps le plus long) : à confirmer ou à fusionner (`fusionner_doublons.mjs`) : Latitude décisionnelle ×2 (psycho), Amiante, Cancérogénicité, Solvants (Toxicologie racine vs sous-dossier), Amiante et Contrainte thermique (Hygiène 20/27), Espaces clos (Sécurité 20/27).
4. 4 thèmes psycho marqués `interne-non-publie` (Invalidité et Lésions, Modèles et Théories, Santé Mentale, Évaluation et Outils) et 3 sans `publication-gestionnaire` : à ouvrir ou non.
5. 102 notions psycho sans thème (92 `type: concept`) tant qu'une clé `theme:` n'est pas posée (répartition par tags proposée dans l'annexe 3) ; Droit 9, Sécurité 7, Hygiène 4, Toxicologie 4 orphelines ; thème Droit « Obligations de l'employeur » avec 0 notion reliée.
6. Six notes d'accueil : trois tronquées (Ergonomie l.59, Toxicologie l.64, Psycho l.83), chemins morts « _archive Wiki SST unifié/… » et « Notes de cours SST/… », rubriques par dossier de cours ; note racine l.36 ; « Notes internes citées sur le site.md » à régénérer (114 noms ou alias archivés de plus).
7. Huit catégories passées sous le seuil de 5 (harcèlement, bem, diesel, vibrations, pae, soutien, ressources, travailleurs) : relever des tags ou accepter.
8. Choix éditoriaux volontairement hors chantier, chacun un commit distinct si Frank les veut : retirer la ligne `Type` de l'infobox ; retirer les catégories de public (`travailleur`, `gestionnaire`, `superviseur`, `direction`, `conseiller`) ; ne plus rendre les index de dossier et accueils secondaires ; fusionner les doublons de Toxicologie.
9. Sept fiches psycho dont l'équivalent est lui-même `interne-strict` (Symptômes et signaux d'alerte, dépression comme lésion professionnelle, TSPT et présomption, Harcèlement psychologique) : le sujet disparaît du site tant que la notion reste interne.

## Annexes (`plans/2026-09-12-annexes/`)
1. `1-lecture-code-travailleurs.md` : chaque site de code du wiki travailleurs, avec lignes et action.
2. `2-lecture-adresses.md` : mécanique des adresses, dépendances, collisions mesurées, stratégies de redirection.
3. `3-lecture-themes.md` : thèmes par wiki, couverture, homonymes, accueils.
4. `4-lecture-vault-travailleurs.md` : comptes, liens entrants, équivalents, dossier 27.
5. `5-plan-angle-fidelite.md` et 6. `6-plan-angle-encyclopedie.md` : les deux plans complets (le second contient la correspondance ligne par ligne des cibles du portail `/g/`, à corriger avec les slugs réels).
7. `7-critique.md` : la critique adversariale intégrale.
8. `equivalents-travailleurs.json`, `themes-par-wiki.json` : données mesurées.
