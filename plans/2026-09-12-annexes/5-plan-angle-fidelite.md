# Plan d'exécution : wiki par notion et par thème, archivage des fiches travailleurs

Dépôt : `C:/Users/Frank/Claude code/Wiki_SST_Site` (git, branche `main`, GitHub Pages sert `docs/`). Vault : `C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines`. Générateur : `tools/build_site.mjs` (1747 lignes au 12 sept. 2026). Tous les numéros de ligne ci-dessous ont été relus dans les fichiers ce jour ; relire le voisinage avant d'éditer, un décalage de quelques lignes est possible.

Commandes de référence (toutes depuis `tools/`) : `npm test` (node --test tests/*.test.mjs tests/*.test.cjs), `node build_site.mjs`, `node verif_liens.mjs`, `node verif_site.mjs`, `node verif_rendu.mjs`, `node verif_publication.mjs --staged`, `node serve.mjs` (port 8090). Chaque commit se termine par la ligne `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Ne jamais pousser deux fois à moins d'une minute (les deux builds Pages échouent).

---

## A. Décisions prises et choix de conception

### A.1 Décisions de Frank (12 sept. 2026), non négociables
1. Le wiki séparé des travailleurs est abandonné. Le site devient un wiki organisé par notion et par thème.
2. Le portail « Espace encadrement » `/g/` (`tools/portail_encadrement.mjs`, `genererWikiPublic('g')`) reste le portail d'entrée.
3. Les notes des dossiers `24 - Références internes pages travailleurs`, `25 - Articles travailleurs`, `26 - Brouillons travailleurs` sont archivées dans `<wiki>/98 - Archives/…` avec `publish: false`, après sauvegarde datée.
4. Les adresses des articles deviennent par notion : `/w/ergonomie/manutention.html` au lieu de `/w/ergonomie/20-articles-internes/manutention.html`, avec redirection des anciennes adresses.
5. Le Recueil législatif SST ne bouge pas (3326 articles, adresses et notes inchangées).

### A.2 Choix de conception proposés (angle : fidélité au vault, risque minimal, réversible)

| Choix | Décision | Justification courte |
|---|---|---|
| C1. Périmètre du vault touché | Seuls les fichiers des dossiers 24/25/26 sont déplacés ; aucune autre note n'est réécrite ; on n'ajoute que des clés de frontmatter aux notes archivées | Réversibilité totale ; aucun contenu SST inventé |
| C2. Source des thèmes | Une note `type: thème` de `10 - Thèmes` par thème (31 notes existantes dans 5 wikis). En Ergonomie, qui n'a pas de `10 - Thèmes`, le build prend comme thèmes les notes index des 5 sous-dossiers de `20 - Articles internes` (note dont le nom de base égale le nom du dossier, `type: index`). Aucune note de thème n'est créée dans le vault | « Chaque thème vient d'une note » ; l'Ergonomie a déjà ses 5 rubriques (accueil l.22-50) |
| C3. Rattachement notion → thème | Calculé au build, jamais écrit dans le vault : (1) clé frontmatter `theme:`/`thème:` si elle résout vers une note de thème ; (2) sinon wikilinks du corps de la note de thème (table « Articles couverts » ou prose) ; (3) sinon sous-dossier homonyme du thème (`20 - Articles/Communication/…` → thème « Communication » ; Ergonomie `20 - Articles internes/Contraintes/…` → thème « Contraintes ») ; (4) sinon « sans thème » (reste joignable par index alphabétique, sommaires par dossier, recherche). Les 163 orphelines mesurées sont listées dans un rapport de build pour Frank, pas corrigées | Pas de réécriture de notes ; les choix éditoriaux restent à Frank |
| C4. Schéma d'adresse | Six wikis : `w/<wiki>/<slugify(base)>.html` pour toute note (notion, thème, accueil, glossaire, démarrage, article de loi local). Sommaires par dossier conservés sous `w/<wiki>/section/<dossiers slugifiés>/index.html`. Recueil : formule actuelle inchangée | Une adresse = une note ; les sommaires par dossier restent une vue secondaire utile (articles de loi des dossiers 40 groupés par centaine) sans polluer l'espace des notions |
| C5. Collisions d'homonymes (19 noms / 38 fichiers hors 24/25/26 et hors Recueil) | Règle déterministe et lisible : la note `type: thème` garde le slug propre ; sinon la note dont le `relPath` est le plus court ; les perdantes reçoivent `-<slug de cleanLabel(dossier parent immédiat)>`, puis, si encore en collision, le chemin complet des dossiers. `console.warn` systématique + test à liste attendue | Aucune note renommée dans le vault ; la fusion des doublons (fusionner_doublons.mjs) est une décision éditoriale de Frank, hors plan |
| C6. Redirections | GitHub Pages n'a pas de redirection serveur : `404.html` autonome, règle de réécriture inline (retirer les segments de dossier) + table inline des exceptions générée par le build (pages suffixées, pages archivées, sommaires). Aucun stub meta-refresh aux anciennes adresses | Les stubs entreraient dans `hors-ligne.json` (4 100 fichiers de plus, à jamais) |
| C7. Cible des pages archivées | Le script d'archivage pose `chemin-origine:` dans le frontmatter ; le build lit les notes refusées et redirige l'ancienne adresse vers : `version-jumelle` résolue si présente, sinon l'homonyme survivant du même wiki (byBase), sinon l'accueil du wiki. Les liens `[[…]]` vers une note archivée sont rendus gris « (source non publiée) » par le mécanisme existant (`notesInternes`, l.315-349, rendu l.627 et l.666) | Tout vient du vault ; le comportement « source non publiée » existe déjà |
| C8. Livraison en lots déployables | Quatre lots, chacun construit, vérifié, commité et déployable seul : L1 archivage + retrait du public « t » ; L2 adresses par notion + 404 + portail /g/ ; L3 navigation par thème ; L4 documentation et mémoires | Chaque étape laisse un site cohérent ; retour arrière par `git revert` d'un seul commit |
| C9. Catégories (tags) | Inchangées (seuil 5, transversales). `categorie/travailleur.html` rétrécit d'elle-même | Les tags sont dans le vault ; la catégorie reste le second axe « par sujet tous wikis » |
| C10. Hors ligne | Aucun changement à `sw.js` ; on accepte le retéléchargement complet (~64 Mo de pages) à la première synchronisation ; `nettoyer` (pwa.mjs l.225-241) purge les anciennes clés au terme d'une synchronisation complète (l.281) | Mécanisme déjà testé (tests/hors-ligne.test.mjs) |
| C11. Outil d'archivage | Nouveau script `tools/archiver_travailleurs.mjs` (simulation par défaut, `--appliquer`, `--annuler`), modèle : `tools/archiver_stubs_refuses.mjs` | Journal machine-lisible, retour arrière automatique |

Points signalés à Frank, sans action dans ce plan (décisions éditoriales) :
- 5 fiches n'ont aucun équivalent notionnel et disparaîtront du site : `Wiki Hygiène industrielle/25 - Articles travailleurs/Équipements de protection.md` et son doublon `Wiki Sécurité industrielle/25 - Articles travailleurs/Équipements de protection.md`, `Wiki SST psychosociale/25 - Articles travailleurs/20 - Ressources et aide/Où appeler quand ça ne va pas.md`, `Wiki Sécurité industrielle/25 - Articles travailleurs/Presqu'accident.md` (9 liens entrants), `Wiki Sécurité industrielle/26 - Brouillons travailleurs/Le risque électrique, ce que tu dois savoir.md`. Option réversible : Frank les déplace lui-même vers `20 - …` s'il veut les garder.
- 16 paires homonymes en psycho (`10 - Thèmes/X.md` thème vs `20 - Articles/X/X.md` index de dossier) et 7 homonymes internes (Hygiène : Amiante, Contrainte thermique ; Toxicologie : Amiante, Cancérogénicité, Solvants ; Sécurité : Espaces clos) reçoivent un suffixe par C5 tant que Frank ne fusionne ou ne renomme pas.
- Trois accueils tronqués (Ergonomie l.59, Toxicologie l.64, Psycho l.83) et le thème Droit « Obligations de l'employeur » sans wikilink : à réparer par Frank.
- Le vault compte 112 notes .md dans 24/25/26 (17 + 62 + 33), pas 132 ; 23 sont déjà `publish: false`. Le script d'archivage affiche le compte réel avant d'agir.

---

## B. Étapes ordonnées

### Lot 0 : état de référence (aucune modification)
0.1 `cd tools && npm test` ; `node build_site.mjs` ; `node verif_liens.mjs` ; `node verif_site.mjs`. Noter les chiffres du journal de build (pages, catégories, « 👷 fiches … ») dans le message du premier commit.
0.2 `git tag avant-notion-2026-09-12` (point de retour).
0.3 `git status` propre avant de commencer.

### Lot 1 : archivage du vault et retrait du public « t »

**1.1 Script `tools/archiver_travailleurs.mjs` (nouveau)**
- Constantes : `VAULT`, `SAUVEGARDE = C:/Users/Frank/Claude code/Wiki_SST_Site/sauvegarde-vault/2026-09-12-travailleurs`, `DOSSIERS = /^(24|25|26) - /`, `WIKIS` = les six wikis (jamais « Recueil législatif SST »).
- Parcours : pour chaque `<wiki>/<dossier 24|25|26>` existant, lister récursivement tous les fichiers. Compter les `.md` par wiki et par dossier, afficher le total (attendu 112) ; lister les fichiers non `.md` éventuels et ne pas les déplacer (les signaler).
- Mode simulation (défaut) : imprime la table « ancien chemin → nouveau chemin » et les clés de frontmatter qui seront ajoutées ; ne touche rien.
- `--appliquer` :
  1. Copie intégrale de chaque dossier 24/25/26 (sous-dossiers compris, tel quel) vers `SAUVEGARDE/<wiki>/<dossier>/…`.
  2. Écrit `SAUVEGARDE/journal.json` : `[{ancien, nouveau, publishAvant, frontmatterAvant}]` et `SAUVEGARDE/journal.txt` lisible.
  3. Déplace (`fs.renameSync`, même volume OneDrive) `<wiki>/<dossier>` vers `<wiki>/98 - Archives/<dossier>` (crée `98 - Archives` s'il n'existe pas ; il n'existe qu'en psycho). Si `98 - Archives/<dossier>` existe déjà : arrêt avec erreur, ne rien faire.
  4. Pour chaque `.md` déplacé, modifie le frontmatter par insertion textuelle (pas de re-sérialisation YAML, pour ne rien réordonner) : `publish: false` (remplace la valeur si la clé existe, sinon ajoute avant le `---` fermant) ; ajoute `chemin-origine: "<relPath d'origine sans le .md>"` (ex. `Wiki Sécurité industrielle/25 - Articles travailleurs/Risques mécaniques/Cadenassage`) ; `archive-date: 2026-09-12` ; `motif-archivage: "Wiki des travailleurs abandonne le 12 septembre 2026 ; le contenu est repris par notion dans le wiki"`. Sans tiret cadratin ni demi-cadratin. Note sans frontmatter : en créer un avec ces quatre clés. Les autres clés (`publication-travailleur`, `version-jumelle`, `traitement-publication`, tags) restent intactes : `version-jumelle` sert à la redirection (C7).
- `--annuler` : relit `journal.json`, remet chaque fichier à `ancien`, restaure le frontmatter d'origine depuis la sauvegarde (copie inverse), supprime les dossiers `98 - Archives/<dossier>` vidés.
- Ne réécrit aucun wikilink dans aucune autre note (Obsidian résout par nom de base ; `resolvePage` l.500-506 retombe sur le nom de base quand le chemin complet ne matche pas).

**1.2 Exécuter** : `node tools/archiver_travailleurs.mjs` (lire la simulation), puis `--appliquer`. Vérifier : `find "<vault>/Wiki */98 - Archives" -name "*.md" | wc -l` (51 déjà en psycho + 112) ; aucun dossier 24/25/26 restant à la racine des wikis ; `grep -L "^publish: false" …/98 - Archives/2*/…` vide.

**1.3 build_site.mjs : retirer l'autorisation « t »**
- l.35-38 : réécrire le commentaire (« Un seul parcours par public : l'encadrement. Les fiches pour travailleurs sont archivées dans le vault (98 - Archives) depuis le 12 septembre 2026. »).
- l.243-266 `publicsDeLaPage` : supprimer la branche travailleur (l.257-260, `okTravailleur` et le veto de sensibilité qui n'est utilisé que là) ; l.253-255 Recueil : garder seulement `S.add('g')`. Garder `sensibiliteRestreinte` (l.226-232) si encore appelé ailleurs, sinon supprimer ; adapter les commentaires l.216-220 et l.238-240 (« deux publics » → « le parcours encadrement »).
- l.10 : supprimer l'import de `./fiches_travailleurs.mjs` ; importer `rendrePage404` depuis le nouveau `./redirections.mjs` (1.5).
- l.790-795 `pageShell` : remplacer le groupe « Selon qui vous êtes » par un groupe « Espace encadrement » ne contenant que `g/index.html` (ou fondre ce lien dans « Navigation » l.781-789 ; choisir la première option pour que `.nav-title` reste explicite).
- l.1109 `contenuAccueil` : supprimer la ligne (maillon `INDEX_FICHES`) ; garder l.1110 (`/gestionnaires/i` → `g/index.html`) ; reformuler le commentaire l.1093-1095.
- l.1597-1605 `sidebarPublic` : supprimer l.1603.
- l.1660-1680 : supprimer le bloc « index des fiches » (`fiches`, `siPresent`, `indexFiches`, écriture de `travailleurs.html`) et l.1682 (journal). Garder l.1681 en la remplaçant par `fs.writeFileSync(path.join(OUT, '404.html'), rendrePage404(tableRedirections))` (table vide au lot 1, remplie au lot 2). Commentaire l.1543 : « L'ancien wiki des travailleurs (t/) n'est plus généré. »
- l.1697 : retirer `nbFiches: indexFiches.total`.

**1.4 portail_racine.mjs** : supprimer l.3 (import), le paramètre `nbFiches` l.9, la carte l.26-29 ; réécrire l.18 : « Les N pages, classées par discipline et par notion : articles, thèmes, pages pour l'encadrement et articles de loi. » Garder `.portal-sujets` (Catégories, Contrôles de forme) et la section « Espace encadrement » l.35-41.

**1.5 Nouveau module `tools/redirections.mjs`** (remplace `fiches_travailleurs.mjs`, supprimé) : reprend `SCRIPT_LIENS_404` (l.119-124, en retirant `t` de la regex de base) et `rendrePage404(table)` (l.126-137) ; `SCRIPT_REDIRECTION` (l.114-117) devient au lot 1 une simple règle `/t/w/X → /w/X` et `/t/index.html → /index.html` (plus jamais vers `travailleurs.html`). La règle complète arrive au lot 2 (D.3). Page autonome : ni `<link`, ni `assets/` (verif_site l.128).

**1.6 app.js** : l.799 (étape « Par sujet ou par situation » de `tour-portail`) : texte limité aux catégories (« Les catégories traversent les disciplines : bruit, silice, espaces clos… ») ; garder l.800 (`.portal-publics`), `tableauDeBord()` l.508-530 et `tour-encadrement` l.783-794.

**1.7 pwa.mjs** l.70 : description du manifeste sans « travailleurs » (ex. « Encyclopédie santé et sécurité du travail en milieu minier : notions par thème, gestion et prévention, recueil législatif. »).

**1.8 CSS orphelines** : `style.css` l.668-672 (`.rub-liste`, `.rub-vide`, `.rub-domaine`), l.674-681 (`.encart-urgence`), l.761-771 (`.encadre-urgence`, garder l.772-773 `.cat-pages .cat-compte`) ; `portail.css` l.217-232 (`--p-rouge-*`, `.tb-urgence`, `.tb-urgence-lien`, `.tb-rub`). Vérifier par grep qu'aucun générateur ne les émet avant de supprimer.

**1.9 entete-article.mjs** l.2 : la page pilote `w/securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html` est archivée. Choisir : repointer `PAGE` sur une note conservée, la jumelle `Wiki Sécurité industrielle/27 - Articles gestionnaires/Cadenassage.md` (adresse lot 1 : `w/securite/27-articles-gestionnaires/cadenassage.html`, lot 2 : `w/securite/cadenassage.html`), et adapter `tests/entete-article.test.mjs` l.7 et l.35 (retirer la variante `t/`).

**1.10 Vérificateurs et tests (lot 1)**
- `verif_site.mjs` : l.44 inverser (interdire `travailleurs.html">👷` dans toute page) ; l.122-138 : garder l.124 (pas de `docs/t`) et l.135 (portail g), supprimer l.125-134 (contenu de `travailleurs.html`), réécrire l.136-138 pour la nouvelle 404 (contient `location.replace` et `'/w/'`, pas `'/travailleurs.html'`) ; retirer les 12 fixtures `25-articles-travailleurs` (l.65, 68, 71, 92-100, 140, 145-147, 156, 220-222, 240-241 ; les blocs `terrain` et `terrainSuite` l.230-245 gardent seulement leurs entrées hors 25/26, ex. `droit-travail/10-themes/obligations-de-lemployeur.html`).
- `verif_rendu.mjs` l.23-31 : retirer les 6 accueils `25-articles-travailleurs` (l.24-29).
- `tests/fiches-travailleurs.test.mjs` : supprimer ; créer `tests/redirections.test.mjs` (simulation `location` comme l'ancien l.94-112) avec les cas `/t/w/x/y.html → /w/x/y.html`, `/t/index.html → /index.html`, page 404 sans `<link`.
- `tests/portail-racine.test.mjs` : l.7 retirer `nbFiches`, l.16 retirer les assertions `travailleurs.html` / « 85 pages » ; garder l.13 et l.15.
- `tests/commandes-entete.test.mjs` l.46-49 : ajouter `travailleurs.html` et « Fiches pour les travailleurs » à la liste interdite.
- `tests/accueil-wiki.test.mjs` : l.13-18 retirer les 6 entrées `25-articles-travailleurs`, l.123 (« dix-sept accueils ») ajuster le compte, l.148-149 retirer « Section « Articles travailleurs » ».
- `tests/rendu-mobile.test.mjs` l.4 et l.14 : remplacer `rendreIndexFiches` par une page ordinaire (ex. `w/ergonomie/…/manutention.html` lue dans `docs/`).
- `tests/terrain-references.test.mjs` l.10-12, `terrain-references-lot2.test.mjs` l.48-49, `rps-references.test.mjs` l.39-42, `rps-references-lot3.test.mjs` l.41-49 : ces tests lisent des notes du vault sous « 25 - Articles travailleurs » ; repointer les chemins sur `98 - Archives/25 - Articles travailleurs/…` (le contenu est identique) et ne plus vérifier `publication-travailleur`. `tests/appliquer-renvois.test.mjs` l.16-83 : fixture d'un faux vault, garder.
- `accueil_wiki.mjs` l.1-7 : commentaire (« sections travailleurs / gestionnaires » → « sections de gestionnaires ») ; vérifier dans `decouperAccueil` (l.40-83) qu'une boîte dont tous les items sont devenus « source interne » est retirée entière (sinon l'ajouter : boîte sans `<a>` ni texte → retirée et signalée), car les rubriques « 25 - Articles travailleurs » des six accueils vont se vider.

**1.11 Construire et vérifier** : `node build_site.mjs` (attendu : « Non publiées … » augmente de ~89, `docs/travailleurs.html` absent, `docs/t` absent, `docs/w/*/25-articles-travailleurs` absent) ; `npm test` ; `node verif_liens.mjs` (0 erreur) ; `node verif_site.mjs` ; `node verif_rendu.mjs`.
**1.12 Commit** « Archivage des fiches travailleurs dans 98 - Archives et retrait du public t » (sauvegarde-vault/2026-09-12-travailleurs inclus dans le dépôt comme les sauvegardes précédentes). Déploiement possible.

### Lot 2 : adresses par notion, redirections, portail /g/

**2.1 Nouveau module `tools/adresses.mjs`** : exporte `slugify` (déplacé depuis build_site l.76-84), `cleanLabel` (l.122-125), `RESERVES = new Set(['index', 'index-alphabetique', 'index-par-loi'])`, `ancienneAdresse(relPath, slugWiki)` (formule actuelle l.376), `calculerAdresses(pages, WIKIS)` (D.1 et D.2) qui pose `p.ancienOut` et `p.out` et retourne `{collisions: [{base, wikiKey, gagnant, perdants}]}`. `build_site.mjs` importe ces fonctions ; `appliquer_renvois.mjs` l.45 (formule dupliquée) importe `ancienneAdresse`/`calculerAdresses` au lieu de recalculer.

**2.2 build_site.mjs l.374-382** : remplacer la boucle `usedOut` par `const {collisions} = calculerAdresses(pages, WIKIS)` ; `console.warn` de chaque collision ; écrire `tools/rapports/adresses.json` (`{ancienOut: out}` pour toutes les pages, non servi) et `tools/rapports/collisions.json`.

**2.3 Pages de sommaire par dossier (l.1143-1221)** : pour les six wikis, `outDir` (l.1154) devient `'w/' + wiki.slug + '/section/' + parts.slice(1).map(slugify).join('/')` ; `dirCards` l.1170-1174 et `crumbsCat` l.1199-1204 suivent le même préfixe ; le stub racine `w/<wiki>/index.html` (l.1160-1166) reste. Pour le Recueil (`wikiKey === 'Recueil législatif SST'`), tout reste inchangé. Le fil d'Ariane des articles (l.1054-1058) pointe provisoirement vers `section/…/index.html` (remplacé au lot 3 par le thème). `wikiSidebar` l.809-821 : `w/<wiki>/section/<s.slug>/index.html` pour les six wikis.

**2.4 Table de redirection (D.3)** : dans build_site, après le calcul des adresses et après `refusees` (l.301-309) : construire `tableRedirections` = (a) pages dont `ancienOut !== out` et dont `out` ne se déduit pas de la règle générique (les suffixées de C5) ; (b) chaque dossier de `dirsAll` des six wikis : `w/<wiki>/<d>/index.html → w/<wiki>/section/<d>/index.html` (couvert par la règle générique, mais inscrit pour les sous-dossiers homonymes d'un thème au lot 3) ; (c) chaque note refusée portant `chemin-origine` : `ancienneAdresse(chemin-origine)` → cible C7 (résolution de `version-jumelle` par `resolvePage(t, p)` après l'index l.385-427 ; sinon `byBase.get(base)` filtré sur le même wiki ; sinon `wikiHome(wiki).out`). Écrire `docs/assets/redirections.json` (petite, ~300 entrées) pour les tests et l'injecter inline dans `rendrePage404(table)`.

**2.5 portail_encadrement.mjs** : réécrire les 20 cibles codées en dur (`NAV` l.48-57, `ROLES` l.59-72, `SITUATIONS` l.74-99, `EXPLORER` l.101-122, barre l.164-170, pied l.243) aux nouvelles adresses lues dans `tools/rapports/adresses.json` (ex. `w/droit-travail/27-articles-gestionnaires/conformite-et-inspection/mecanismes-lmrsst.html` → `w/droit-travail/mecanismes-lmrsst.html` ; `w/psychosocial/30-glossaire/glossaire.html` → `w/psychosocial/glossaire.html` ; `w/psychosocial/50-ressources-daide/index.html` → `w/psychosocial/section/50-ressources-daide/index.html`). `DOMAINES` (l.124-131, `w/<wiki>/index.html`) inchangé. Ajouter dans `verif_site.mjs` : après lecture de `g/index.html`, aucune ancre de carte (`class="tb-carte"`, liens de `.tb-side`) avec `href="#"` sauf celles dont la cible est `null` par conception (`navFavoris`) ; et passer `rendu.morts.length` de `console.warn` (build_site l.1587) à une erreur de build (`throw`) une fois la liste réécrite.

**2.6 app.js** : l.461-468 `noterVisite` et l.487-501 favoris : au chargement, filtrer les entrées dont `u` est de l'ancienne forme (regex `^(?:g\/)?w\/(?!legislation\/)[a-z-]+\/.+\/[^/]+\.html$` et ne contenant pas `/section/`), ou les réécrire par la même règle que la 404 (D.3, copie de 8 lignes) ; remplacer le préfixe en dur `/wiki-sst-mines/` (l.456) par `window.ROOT` si disponible, sinon garder.

**2.7 graphe_client.js / graphe3d_client.js** : rien à changer (`n.u === focus` avec `p.out` ; un ancien `?focus=` retombe sur la vue globale).

**2.8 Tests et vérificateurs (lot 2)**
- Nouveau `tests/adresses.test.mjs` : (a) `slugify`, `RESERVES` ; (b) `calculerAdresses` sur un faux jeu de pages reproduisant les 19 collisions connues (Hygiène : contrainte-thermique, amiante ; Psycho : 12 paires thème/index + latitude-decisionnelle ; Sécurité : espaces-clos ; Toxicologie : amiante, cancerogenicite, solvants) et vérifiant le gagnant et le suffixe ; (c) le Recueil garde la formule miroir ; (d) une page nommée « Index » reçoit `-page`.
- `tests/redirections.test.mjs` : cas D.3 (article, sommaire, suffixée, archivée avec jumelle, `g/w/…`, `legislation` intouchée, nouvelle adresse sans boucle, `/t/w/…`).
- `verif_site.mjs` : chemins `g/w/…` (l.66-69, l.235, l.242) et `10-themes`, `20-articles` (l.129-131, 139-155, 185-207 dans la numérotation du rapport adresses) → nouvelles adresses ; ajouter : aucun fichier `.html` sous `docs/w/<six wikis>/` hors `section/` à plus d'un niveau de profondeur ; `docs/assets/redirections.json` existe et chaque cible existe dans `docs/`.
- `verif_rendu.mjs` l.30, `tests/accueil-wiki.test.mjs` l.21 et l.124-126 (`ACCUEILS_G`), `tests/recherche-rappel.test.mjs` l.39, `tests/entete-article.test.mjs` l.7 : nouvelles adresses.
- `verif_liens.mjs` : aucun chemin codé en dur, il valide tel quel.

**2.9 Construire, vérifier, commit** « Adresses par notion, sommaires sous section/, 404 avec table de redirection ». Déploiement possible ; prévenir dans le message de commit que la première synchronisation hors ligne retélécharge ~64 Mo.

### Lot 3 : navigation par thème

**3.1 Nouveau module `tools/themes.mjs`** : `construireThemes(pages, {resolvePage, WIKIS})` retourne `{parWiki: Map<wikiKey, [{page, notions:[...], ordre}]>, themeDe: Map<page, page thème principal>, orphelines: [...]}` selon C2/C3 : thème = `fm.type` normalisé (`thème`/`theme`) dans un dossier `10 - Thèmes` ; Ergonomie (aucun thème) : notes `type: index` des sous-dossiers directs de `20 - Articles internes` dont `base === nom du dossier` ; notions candidates = pages du même wiki dans `20 - …` ou `27 - …` qui ne sont ni thème, ni accueil (`estAccueil`), ni index de dossier. Rapport `tools/rapports/themes.json` (thèmes, notions par thème, orphelines par wiki).

**3.2 build_site.mjs**
- Barre latérale `wikiSidebar` (l.809-821) : groupe « <icône> <wiki> » : Accueil du wiki ; sous-liste « Thèmes » (une entrée par note de thème, `p.out`) ; sous-liste « Repères » : sections de premier niveau autres que `00/10/20/27` (`05 - Démarrage rapide`, `30 - Glossaire`, `40 - Articles de loi`, `15 - Navigation`, `50 - Ressources d'aide`, `70 - Documents et outils`) vers `section/<slug>/index.html`, puis `Index alphabétique` et, pour le Recueil, `Index par loi`. `wikiSections` (l.823-843) reste calculé pour les sommaires.
- Fil d'Ariane (l.1054-1058) : notion avec thème principal : Portail › Wiki › <Thème> (lien vers `theme.out`) ; note de thème et accueil : Portail › Wiki ; page sans thème : Portail › Wiki › <Section 1er niveau> (`section/<slug>/index.html`) ; Recueil inchangé.
- Voisins (l.1028-1039) : regrouper par thème principal (ordre = ordre des liens dans la note de thème, sinon alphabétique) pour les notions rattachées ; les autres pages gardent le regroupement par dossier (articles de loi des dossiers 40 en ordre numérique).
- Infobox (l.850-895) : si `fm.theme`/`fm.thème` absent et qu'un thème principal est déduit, ajouter la ligne « Thème » avec un lien vers la note de thème ; si la clé existe, la garder telle quelle (fidélité, même si elle vise un hub comme « Ergonomie du travail »).
- Page de thème : c'est la note rendue normalement ; ajouter après le corps une boîte générée « Articles de ce thème (N) » listant les notions rattachées (titre + wiki) ; en Ergonomie, la note index de dossier joue ce rôle (sa table « Articles de cette section » existe déjà ; la boîte générée complète sans dupliquer si les liens y sont déjà).
- `contenuAccueil` (l.1096-1118) : la note d'accueil reste la source ; ajouter en première boîte une grille générée « Thèmes » (nom, nombre de notions, lien) via `rendreAccueil` (`accueil_wiki.mjs` l.154-171, paramètre `sections`) ; `sousTitre` : « Section « X » » ne concerne plus que les accueils de dossier 27.
- Index de recherche l.1478 : `e.c` = nom du thème principal si présent, sinon chemin de dossiers nettoyé (inchangé pour le Recueil).
- Portail racine (`portail_racine.mjs`) : cartes de wiki l.1690-1697 : ajouter le nombre de thèmes (« N articles · M thèmes ») ; l.18 déjà réécrite.
- Visite guidée `app.js` l.796-802 : étape « Le fond documentaire » mentionne « chaque discipline est organisée par thème ».

**3.3 Sommaires par dossier de 20/27** : conservés sous `section/…` (lot 2) ; leurs cartes de sous-catégories restent ; ajouter en tête, quand un thème homonyme existe, un lien « Voir le thème <X> ».

**3.4 Tests et vérificateurs (lot 3)** : nouveau `tests/themes.test.mjs` (faux vault en mémoire : thème authored avec table « Articles couverts », clé `theme:`, sous-dossier homonyme, Ergonomie sans `10 - Thèmes`, orpheline) ; `verif_site.mjs` : chaque page des six wikis hors Recueil a un fil d'Ariane à 2 ou 3 maillons, jamais de maillon vers `section/20-…` pour une notion rattachée ; compte de thèmes par wiki attendu (Hygiène 4, Toxicologie 4, Sécurité 3, Droit 4, Psycho 16, Ergonomie 5) ; `tests/navigation-articles.test.mjs` et `tests/accueil-wiki.test.mjs` : adapter les attentes de barre latérale et d'accueil.

**3.5 Construire, vérifier, commit** « Navigation par thème : barre latérale, fil d'Ariane, voisins, accueil ».

### Lot 4 : documentation, mémoires, contrôle en ligne
4.1 `README.md` l.23-47 et l.121 (structure des adresses, plus de `travailleurs.html`, `98 - Archives`, `section/`, 404) ; `content-updates/2026-09-09-integration-travailleurs.md` : ajouter un post-scriptum « remplacé le 12 septembre 2026 par l'archivage » ; nouveau `content-updates/2026-09-12-wiki-par-notion.md` (résumé des lots, chiffres, liste des 5 sujets sans équivalent, 19 collisions suffixées, orphelines de thème).
4.2 Mémoires (section G).
4.3 Déploiement : `git push` sur `main` ; attendre ~2 min ; contrôle en ligne (F.4) ; vérifier le hors-ligne sur un appareil déjà synchronisé (F.5).

---

## C. Liens entrants vers les pages archivées

Mesure de référence (résolution fidèle à `resolvePage`) : 214 wikilinks depuis 93 notes atterrissent aujourd'hui sur une fiche 24/25/26 ; 99 d'entre eux sont ambigus (homonymes : Cadenassage 27 liens, Espaces clos 20, Chaleur, Manutention, Postures…) et 315 autres liens homonymes se résolvent déjà vers la notion.

Comportement après archivage, sans modifier aucune note citante :
1. Les notes archivées entrent dans `refusees` (l.301-309, `publish: false`) puis dans `notesInternes` (l.343-348, nature « non publiée », alias compris). Elles sortent de `byBase`/`byPath` (l.412-427).
2. Lien ambigu (homonyme survivant dans 20/27/Recueil) : `resolvePage` (l.508-515) choisit désormais l'homonyme survivant (même dossier, puis même wiki, puis chemin le plus court) : `[[Cadenassage]]` depuis Sécurité → `27 - Articles gestionnaires/Cadenassage`, `[[Espaces clos]]` depuis Hygiène → `Sécurité/20/…/Espaces clos` ou `Hygiène/27/…/Espaces clos` selon la règle. C'est le comportement voulu ; aucun code à écrire.
3. Lien non ambigu (115 liens) : rendu `<span class="interne-inline">Nom <small>(source non publiée)</small></span>` (l.627 et l.666), gris pointillé, jamais rouge « page non créée ». Aucun code à écrire ; `verif_liens.mjs` ne les compte pas comme liens morts.
4. Anciennes adresses web des 111 pages archivées : redirigées par la table 404 (C7 et D.3) vers `version-jumelle` (ex. `25/…/Cadenassage` → `[[Gestion des risques]]`), sinon l'homonyme survivant, sinon l'accueil du wiki.
5. Accueils de wiki : les rubriques « 25 - Articles travailleurs » / « 26 - Brouillons » de `00 - 🏠 Accueil.md` ne contiennent plus que des sources internes : `accueil_wiki.mjs` retire les items internes et signale chaque retrait au build (vérifier 1.10 pour la boîte vide). Les notes « 05 - Démarrage rapide - Travailleur » (Ergonomie, Hygiène, Sécurité, 5 à 7 liens chacune) et `Sécurité/10 - Thèmes/Sécurité machines` (8 liens) verront des mentions grises : à signaler à Frank dans le rapport, pas à réécrire.
6. Note racine « Brouillons travailleurs à valider.md » (33 liens, `publish: false`, hors dossier wiki, jamais publiée) et « 🏠 WIKI SST - Mines.md » l.36 : laisser telles quelles (hors site).
7. Rapport de build : après `refusees`, compter et journaliser « N liens vers des notes archivées rendus en source non publiée » (compteur à ajouter dans le rendu l.627/666, ventilé par note citante, écrit dans `tools/rapports/liens-archives.json`) pour que Frank corrige les notes citantes lourdes s'il le souhaite.

---

## D. Schéma d'adresses, collisions, redirections

### D.1 Formule (`tools/adresses.mjs`, appelée à la place de build_site l.374-382)
- Recueil législatif SST : `out = ancienneAdresse(relPath)` = `'w/legislation/' + parts.slice(1).map(slugify).join('/') + '.html'` (inchangé, y compris ses sommaires `w/legislation/<d>/index.html`).
- Six wikis : `s = slugify(p.base)` ; si `RESERVES.has(s)` → `s += '-page'` ; `out = 'w/' + WIKIS[wikiKey].slug + '/' + s + '.html'`.
- `p.ancienOut = ancienneAdresse(relPath)` conservé sur chaque page (table de redirection, tests).
- Profondeur : `rootOf(out)` (l.744) donne `../../` pour toute note des six wikis ; rien à changer, le calcul est générique.
- `g/` : `genererWikiPublic` l.1556 préfixe `pub + '/' + p.out` : l'arbre encadrement est aplati automatiquement (`g/w/<wiki>/<slug>.html`).

### D.2 Règle de collision (même wiki, même `s`)
1. Gagnant du slug propre, dans l'ordre : note `type: thème` ; sinon note de `20 - …` au `relPath` le plus court (racine avant sous-dossier) ; sinon `relPath` le plus court.
2. Perdantes : `s + '-' + slugify(cleanLabel(dossier parent immédiat))` (ex. `communication-communication` devient laid ; pour une note `type: index` dont le nom égale son dossier, employer `-sommaire` : `communication-sommaire.html`) ; `27 - Articles gestionnaires` → `-articles-gestionnaires` (ex. `espaces-clos-articles-gestionnaires.html`, `amiante-programmes-de-prevention.html` en Hygiène) ; Toxicologie racine vs sous-dossier : `amiante.html` (racine, plus court) et `amiante-substances-dangereuses.html`.
3. Si toujours en collision : suffixe = tous les dossiers slugifiés joints par `-`. Jamais de `-2` silencieux.
4. `console.warn` par collision et `tests/adresses.test.mjs` avec la liste attendue des 19 noms : toute collision nouvelle fait échouer le test, donc est vue.

### D.3 Redirections : `404.html` autonome (`tools/redirections.mjs`)
Script inline, sans dépendance (`verif_site` interdit `<link` et `assets/`) :
```
var T = {…table inline…};   // clés "wiki/reste-ancien" → "reste-nouveau" ou "w/autre-wiki/x.html"
var p = location.pathname, m = p.match(/^(.*?)\/(?:t\/)?(g\/)?w\/([a-z-]+)\/(.+)$/);
if (m && m[3] !== 'legislation') {
  var base = m[1], g = m[2] || '', wiki = m[3], reste = m[4], seg = reste.split('/'), cible = null;
  if (T[wiki + '/' + reste]) cible = T[wiki + '/' + reste];
  else if (seg[0] !== 'section' && seg.length > 1) cible = seg[seg.length - 1] === 'index.html' ? 'section/' + reste : seg[seg.length - 1];
  if (cible) location.replace(base + '/' + (cible.indexOf('w/') === 0 ? cible : g + 'w/' + wiki + '/' + cible) + location.search + location.hash);
}
else if (/\/t\/index\.html$/.test(p)) location.replace(p.replace(/t\/index\.html$/, 'index.html'));
```
Pas de boucle possible : une nouvelle adresse a `seg.length === 1` ou commence par `section/`, donc ne se réécrit jamais. Contenu de `T` : pages suffixées (D.2), pages archivées (C7), sommaires de sous-dossiers homonymes d'un thème (lot 3, `…/index.html → theme.out`). Le service worker laisse passer la 404 (réseau d'abord, `rep.ok` faux, non mise en cache, pwa.mjs l.134-160) ; hors ligne, aucune redirection n'est possible (`secours()` l.123-132), ce qui est accepté.
Fichier jumeau `docs/assets/redirections.json` (même table) pour `verif_site` (chaque cible existe) et les tests.

### D.4 Effets connexes
- `search-index.json` (`u = p.out`), `graphe.json` (`n[i].u`), `hors-ligne.json` (parcours brut de `docs/`) suivent automatiquement.
- `appliquer_renvois.mjs` l.45 : importer la formule (2.1).
- Historique/favoris `app.js` : 2.6.

---

## E. Ce que devient chaque élément

| Élément | Après le plan |
|---|---|
| Accueil de chaque wiki | La note `00 - 🏠 Accueil.md` reste la source (rendu `contenuAccueil` + `accueil_wiki.mjs`) ; boîte générée « Thèmes » en tête ; rubriques 25/26 vidées de leurs liens et retirées ; sous-titre « N pages » ; index (alphabétique, catégories, `g/` pour les accueils gestionnaires) sans le maillon travailleurs |
| Pages de thème | Note authored `10 - Thèmes/*.md` (31) rendue comme article + boîte « Articles de ce thème » ; Ergonomie : les 5 notes index de sous-dossier de `20 - Articles internes` ; adresse `w/<wiki>/<slug>.html` ; aucune note créée |
| Barre latérale | Navigation (Portail, Catégories, Contrôles, Graphe, Hasard) ; « Espace encadrement » (`g/index.html`) ; groupe du wiki : Accueil, Thèmes, Repères (sections 05/15/30/40/50/70 sous `section/`), Index alphabétique ; Les wikis |
| Fil d'Ariane | Portail › Wiki › Thème (notion rattachée) ; Portail › Wiki (thème, accueil) ; Portail › Wiki › Section (page annexe) ; Recueil inchangé |
| Voisins | Par thème principal pour les notions ; par dossier (ordre numérique) pour le reste |
| Infobox | Ligne « Thème » : clé du vault si présente, sinon thème déduit (lien) ; tags inchangés |
| Portail racine | Cartes de wiki « N articles · M thèmes » ; « Parcourir par sujet » = Catégories + Contrôles de forme ; « Espace encadrement » conservé ; carte « Fiches pour les travailleurs » retirée |
| Portail /g/ | Inchangé dans sa forme ; 20 cibles réadressées ; `rendu.morts` devient une erreur de build ; arbre `g/w/<wiki>/<slug>.html` (135 pages, aucune archivée) |
| Visite guidée | `tour-encadrement` inchangé ; `tour-portail` : étape sujets sans les fiches ; `tour-article` inchangé |
| Recherche | `u` = nouvelle adresse ; `c` = thème principal ou dossiers nettoyés ; `search-mots.json` inchangé |
| Graphe | `u` = nouvelle adresse ; `?focus=` fonctionne avec les nouvelles adresses |
| Catégories | Inchangées (tags, seuil 5) ; `categorie/travailleur.html` rétrécit |
| Manifeste hors ligne | Régénéré tel quel ; ~4 300 entrées ; retéléchargement complet une fois ; anciennes clés purgées par `nettoyer` après synchronisation complète |
| Sommaires par dossier | Conservés sous `w/<wiki>/section/…/index.html` (vue secondaire) ; Recueil inchangé |
| 404 | Page autonome avec règle + table (D.3) |

---

## F. Vérification

F.1 À chaque lot, dans l'ordre : `npm test` (0 échec) ; `node build_site.mjs` (lire le journal : nombre de pages, « Non publiées », collisions, `portail g : 0 cible introuvable`) ; `node verif_liens.mjs` (0 erreur) ; `node verif_site.mjs` ; `node verif_rendu.mjs` ; avant commit `node verif_publication.mjs --staged` (après `git add docs`).

F.2 Contrôles ciblés après le lot 2 : `find docs/w -mindepth 3 -name "*.html" | grep -v "/section/" | grep -v "^docs/w/legislation/"` doit être vide ; `ls docs/w/ergonomie/manutention.html` existe ; `docs/assets/redirections.json` : chaque valeur existe dans `docs/` ; `grep -c "href=\"#\"" docs/g/index.html` égal au nombre d'entrées `cible: null` de `NAV`.

F.3 Test manuel local (`node tools/serve.mjs`, http://localhost:8090/) : `serve.mjs` doit servir `404.html` pour une adresse absente (vérifier, sinon ouvrir `404.html` directement et simuler avec `?` la pathname dans la console). Ouvrir : `/w/ergonomie/20-articles-internes/contraintes/manutention.html` → arrive sur `/w/ergonomie/manutention.html` ; `/w/securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html` → jumelle « Gestion des risques » (ou homonyme 27) ; `/w/psychosocial/20-articles/index.html` → `section/20-articles/index.html` ; `/g/w/hygiene/27-articles-gestionnaires/…` → `/g/w/hygiene/<slug>.html` ; `/t/w/…` → `/w/…` ; `/w/legislation/…` intouché ; `/travailleurs.html` → 404 sans redirection.

F.4 Navigateur (local puis en ligne, thème clair et sombre, largeur mobile 375 px) : (1) portail : pas de carte travailleurs, compteur des cartes ; (2) `g/index.html` : toutes les cartes cliquables, visite guidée « ? » ; (3) une notion (ex. `w/ergonomie/manutention.html`) : fil d'Ariane à 3 maillons, barre latérale « Thèmes / Repères », infobox « Thème », voisins du même thème, backlinks, « Voir dans le graphe » ; (4) une page de thème : boîte « Articles de ce thème » ; (5) accueil d'un wiki : boîte « Thèmes », aucune rubrique vide, mentions grises « (source non publiée) » sur les démarrages rapides ; (6) recherche : résultats vers les nouvelles adresses, badge de thème dans `c` ; (7) `categories.html` ; (8) `graphe.html?focus=w/ergonomie/manutention.html`.

F.5 Hors ligne, sur un appareil déjà synchronisé avant déploiement : ouvrir le site en ligne, panneau 📶, attendre « à jour » (synchronisation complète, `localStorage hl-fini = V`) ; DevTools › Application › Cache Storage `wiki-sst-pages` : aucune clé `…/20-articles-internes/…` ni `travailleurs.html` ; passer hors ligne : une nouvelle adresse s'ouvre, une ancienne donne `offline.html`. Les caches des autres sites de l'origine ne sont pas touchés (`caches.keys()` avant/après).

F.6 Retour arrière : `git revert` du commit du lot fautif ; pour le vault, `node tools/archiver_travailleurs.mjs --annuler` (ou copie inverse depuis `sauvegarde-vault/2026-09-12-travailleurs/`).

---

## G. Mémoires à mettre à jour (`C:/Users/Frank/.claude/projects/C--Users-Frank-Claude-code/memory/`)

1. `site-wiki-sst-mines.md` : remplacer le paragraphe « Trois entrées » par « Deux entrées depuis le 12 sept. 2026 : `/w/` fond documentaire par notion et par thème, `/g/` Gestion & prévention ; wiki des travailleurs abandonné, 112 notes archivées dans `<wiki>/98 - Archives/2x - …` (`publish: false`, `chemin-origine`, `motif-archivage`), sauvegarde `sauvegarde-vault/2026-09-12-travailleurs/`, script `tools/archiver_travailleurs.mjs --annuler` » ; ajouter une entrée « Adresses par notion (12 sept.) » : formule `w/<wiki>/<slugify(base)>.html` dans `tools/adresses.mjs`, règle de collision (thème > 20 le plus court ; suffixe du dossier parent, `-sommaire` pour les index de dossier), sommaires sous `w/<wiki>/section/…`, Recueil inchangé, 404 = règle + table inline (`tools/redirections.mjs`, `docs/assets/redirections.json`), thèmes calculés par `tools/themes.mjs` (notes `type: thème`, Ergonomie = notes index des sous-dossiers), rapports dans `tools/rapports/` ; marquer « Publication du wiki travailleurs (3 sept.) » et « Brouillons travailleurs » comme historiques ; mettre à jour le compte de pages.
2. `MEMORY.md` : ligne « Site Wiki SST Mines » : remplacer « 4577 articles » par le compte du dernier build et ajouter « organisé par notion et par thème depuis le 12 sept. 2026 ».
3. Nouvelle mémoire courte `wiki-sst-archivage-travailleurs.md` (indexée dans MEMORY.md) : décision de Frank, ce qui a été archivé, les 5 sujets sans équivalent, les 19 collisions suffixées, les 3 accueils tronqués, et la règle « toute nouvelle collision d'homonymes casse `tests/adresses.test.mjs` ».
4. `origine-github-pages-partagee.md` : rien à changer (préfixe `wiki-sst-` conservé) ; le noter dans le commit du lot 4.