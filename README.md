# WIKI SST — Mines

Encyclopédie interne de santé et sécurité du travail en milieu minier, générée automatiquement à partir du vault Obsidian « 🏠 WIKI SST - Mines » (notes de cours).

Les pages sont réparties en 6 wikis thématiques + 1 recueil législatif. Les [compteurs générés](docs/assets/version.json) distinguent les pages sources, catégories et médias ; les variantes par public ne sont pas des articles supplémentaires.

| Wiki | Contenu |
| --- | --- |
| 🦺 Ergonomie | TMS, manutention, postures, vibrations |
| 🌫️ Hygiène industrielle | Bruit, poussières, diesel, ventilation, chaleur |
| ☣️ Toxicologie | Solvants, métaux, amiante, silice |
| ⛑️ Sécurité industrielle | Cadenassage, espaces clos, hauteur, explosifs |
| 📋 Droit du travail | LSST, LATMP, LMRSST, droits du travailleur |
| 🧠 SST psychosociale | RPS, Karasek, Siegrist, détresse, FIFO |
| ⚖️ Recueil législatif | Lois et règlements du Québec, article par article |

**En ligne : https://frankyray21.github.io/wiki-sst-mines/**

## Entrées du site

| Entrée | Pour qui | Contenu |
| --- | --- | --- |
| 📚 [`/w/`](https://frankyray21.github.io/wiki-sst-mines/) | Tout le monde | Le fond documentaire, organisé par notion et par thème (une page par sujet, adresse `w/<wiki>/<notion>.html`) |
| 🗂️ [`themes.html`](https://frankyray21.github.io/wiki-sst-mines/themes.html) | Tout le monde | Tous les thèmes, groupés par discipline |
| 🎓 [`/g/`](https://frankyray21.github.io/wiki-sst-mines/g/) | Superviseurs, gestionnaires, direction | Portail en tableau de bord : entrée par rôle, par situation à gérer, ou par thème |

Le wiki séparé des travailleurs (`/t/`, abandonné le 9 septembre 2026, puis son index
`travailleurs.html` dans le fond documentaire) est à son tour abandonné le **12 septembre 2026** :
Frank a choisi un vrai wiki organisé par notion et par thème plutôt qu'un site distinct par
public. Les 112 notes des dossiers `24/25/26 - …` des six wikis sont archivées dans `98 - Archives`
de chaque wiki (`publish: false`, sauvegarde locale `sauvegarde-vault/2026-09-12-travailleurs/`,
journal versionné `content-updates/2026-09-12-archivage-travailleurs.json`) ; les adresses des
articles ne reflètent plus le rangement en dossiers du vault (`w/ergonomie/manutention-manuelle.html`
plutôt que `w/ergonomie/20-articles-internes/contraintes/manutention-manuelle.html`) ; `404.html`
redirige les anciennes adresses (dossiers de cours, `/t/…`, `travailleurs.html`) à partir d'une table
écrite par le générateur. Détail complet : `plans/2026-09-12-wiki-par-notion.md`.
Le parcours de l'encadrement suit `publication-gestionnaire` (frontmatter du vault, veto sur
`niveau-sensibilité` interne ou ≥ 2), inchangé par ce chantier.
Le Recueil législatif n'est pas dupliqué : le texte de loi est public et identique pour tous, et ses
adresses n'ont pas changé.

**Ces parcours ne sont pas un contrôle d'accès.** GitHub Pages est public : les contenus confidentiels ne doivent pas y être publiés. Le champ « interne » historiquement utilisé pour désigner un public n'assure aucune protection. Une authentification réelle nécessiterait une décision d'hébergement distincte.

## Structure

- `docs/` — le site statique généré (HTML pur, aucune dépendance serveur) — c'est ce dossier que GitHub Pages publie
- `tools/build_site.mjs` — générateur : markdown Obsidian → HTML type Wikipédia
- `tools/png_palette.mjs` — recompression PNG sans perte (palette 8 bits, zlib natif)
- `tools/portail_encadrement.mjs` — portail `/g/` en tableau de bord : contenu des cartes, icônes SVG.
  Les cibles sont vérifiées à la construction ; le build avertit si l'une disparaît du site.
- `tools/portail_racine.mjs` — contenu du portail racine (`index.html`)
- `tools/adresses.mjs` — formule d'adresse par notion (`w/<wiki>/<notion>.html`), thèmes
  (`w/<wiki>/theme/<slug>.html`) et règle de collision (12 septembre 2026)
- `tools/redirections.mjs` — page `404.html` autonome : anciennes adresses (dossiers de cours,
  wiki des travailleurs) vers les adresses par notion, à partir d'une table écrite par le générateur
- `tools/archiver_travailleurs.mjs` — archive les dossiers `24/25/26 - …` dans `98 - Archives` de
  chaque wiki (`--appliquer`, `--annuler`), sauvegarde datée et journal versionné
- `tools/portail.css` — feuille de style de ce portail (chargée par lui seul)
- `tools/extraire_textes_loi.mjs` — extrait des PDF de LégisQuébec le texte de chaque article (couche texte,
  sans OCR) vers `tools/textes-loi/*.json` ; `tools/textes_loi.mjs` le pose dans les pages d'articles
- `tools/appliquer_renvois.mjs` — pose dans les notes du vault les renvois tranchés vers les notes d'analyse
  (`content-updates/2026-09-09-renvois-sources.json`) ; essai par défaut, sauvegarde avant écriture
- `tools/recherche_mots.mjs` — découpage en mots de l'index plein texte, partagé avec les retouches du site
- `tools/accueil_wiki.mjs` — pages d'accueil des wikis et des sections rendues en bandeau et boîtes, comme
  la page d'accueil d'un wiki (découpage du corps de la note, artefacts retirés et signalés)
- `tools/verif_rendu.mjs` — contrôle du rendu réel dans Chromium (playwright-core, dépendance de développement) :
  ce que les tests de structure ne voient pas. Cinq modes : téléphone (clair et sombre), tablette de chantier
  en paysage et en portrait, bureau ; échec sur défilement horizontal, cible tactile sous 24 px, sommaire ou
  infobox sur un accueil, titre à plusieurs h1
- `tools/android/construire_apk.mjs` — construit l'APK (coquille WebView sur le site publié) ; `tools/android/binaire.mjs`
  écrit le manifeste compilé, la table de ressources et l'archive alignée
- `tools/appliquer_intros.mjs` — pose dans les notes du vault les phrases d'ouverture d'un lot (`tools/intros.mjs`) ;
  essai par défaut, sauvegarde avant écriture
- `tools/retouches.mjs` + `tools/appliquer_retouches.mjs` — pose dans le vault un lot de retouches préparé
  sans accès au vault (médias à copier, lignes désignées par leur texte visible, liens vers une adresse
  publiée ; nouvelle version d'un schéma à la place de l'ancienne) ; essai par défaut, tout ou rien, rejouable,
  sauvegarde avant écriture
- `tools/regenerer_hors_ligne.mjs` — retouche de `docs/` sans reconstruction : recopie `style.css` et `app.js`,
  réécrit le manifeste hors ligne en gardant l'estampille de version (seuls les fichiers modifiés changent de hash)
  et marque `sw.js` de l'empreinte du manifeste, pour que les navigateurs installent le nouveau service worker
- `tools/poser_schemas.mjs` — pose les schémas SVG d'une page, décrits dans une spec JSON (ancre, capture remplacée,
  version antérieure remplacée, texte alternatif, légende, version texte, sources, corrections du texte), dans la
  page publiée et sa copie encadrement, et écrit le lot du vault correspondant ; essai par défaut, `--ecrire` pour
  écrire
- `tools/dimensions_svg.mjs` — largeur et hauteur d'un schéma SVG, posées par le générateur sur son `<img>`
- `tools/resoudre_image.mjs` — choisit le fichier d'un renvoi d'image `![[…]]` ; un nom que portent plusieurs
  fichiers est listé en fin de construction (« ⚠ Images ambiguës »), avec le fichier retenu
- `tools/libelle_lien.mjs` — texte affiché d'un lien `[[Cible]]` : le mot saisi dans une phrase ; le titre de la page
  pour un nom de code (`art-59-LATMP`), une note d'analyse d'étude, une ligne ou une cellule de tableau faite de liens
  seulement. Les liens qui mènent à un autre wiki par un alias sont listés en fin de construction (« ⚠ Liens vers un
  autre wiki par un alias »)
- `tools/raccourcir_liens.mjs` — rend aux phrases du vault le mot court qu'un renommage de note avait remplacé par le
  nom long (`[[CNESST, rôles et pouvoirs]]` → `[[CNESST, rôles et pouvoirs|CNESST]]`) et retire les liens qu'un
  renommage a envoyés vers une note d'un autre wiki et d'un autre sens ; table à valider,
  `content-updates/2026-09-26-libelles-courts.json` ; essai par défaut, sauvegarde avant écriture
- `tools/avis.mjs` — bloc « Cette page vous a-t-elle été utile ? » (pouce et commentaire) posé sur chaque page
  issue d'une note ; `tools/avis-worker/` — le relais Cloudflare qui écrit dans Airtable, et son mode d'emploi
- `tools/serve.mjs` — serveur local de prévisualisation (port 8090)

## Utilisation

```bash
# Regénérer le site depuis le vault Obsidian
node tools/build_site.mjs

# Vérifier qu'aucun lien interne ne pointe dans le vide
node tools/verif_liens.mjs        # tout docs/, fichiers et ancres — ou passer g / w

# Tests de non-régression
npm --prefix tools test

# Ré-extraire le texte des lois depuis les PDF du recueil (après une mise à jour des PDF)
npm --prefix tools install          # installe pdfjs-dist (dépendance de développement)
node tools/extraire_textes_loi.mjs  # → tools/textes-loi/*.json, puis reconstruire le site

# Poser un lot de retouches préparé hors du vault (schémas d'Espaces clos, 25 septembre 2026)
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-espaces-clos-schemas.json
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-espaces-clos-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-lie.json --appliquer          # page LIE du recueil
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-gaz-et-vapeurs.json --appliquer
# … une page illustrée par wiki (même jour) : essai sans --appliquer, puis lot par lot
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-modele-de-karasek-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-postures-contraignantes-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-aerosols-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-diesel-sous-terre-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-reclamation-cnesst-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-irr-indemnites.json --appliquer
# … silice et NO₂ sur douze pages (même jour), un lot par note — sous Windows (PowerShell) :
#   Get-ChildItem content-updates\2026-09-25-silice-no2-*.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
# … pages art-116 et art-30, DPM, amiante (même jour) : lots « corr- », puis lots de titre « titre-art-116- »
#   Get-ChildItem content-updates\2026-09-25-corr-*.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
#   Get-ChildItem content-updates\2026-09-25-titre-art-116-*.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
# … pages RPS illustrées (même jour) : une commande par page, liste dans content-updates/2026-09-25-rps-schemas.md
#   six autres le 26 septembre : Get-ChildItem content-updates\2026-09-26-*-schemas.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }

# Rendre aux phrases du vault le mot que l'auteur avait écrit (26 septembre 2026) : essai, relecture, application
node tools/raccourcir_liens.mjs
node tools/raccourcir_liens.mjs --appliquer

# Poser les renvois tranchés dans le vault : essai, puis application avec sauvegarde
node tools/appliquer_renvois.mjs
node tools/appliquer_renvois.mjs --appliquer

# Vérifier le résultat construit : assets, hashes et infographies
npm --prefix tools run check:site

# Vérifier le rendu réel dans Chromium (390 px clair et sombre, 1200 px) : défilement horizontal,
# cibles tactiles, tuiles, infobox ou sommaire sur un accueil — les 22 accueils par défaut
CHROME=/chemin/vers/chrome node tools/verif_rendu.mjs --captures   # captures et mesures dans rendu/

# Prévisualiser en local
node tools/serve.mjs
# → http://localhost:8090
```

## Fonctionnalités

- **Recherche plein texte** : numéros d'article (`art 4 RSST`, `RSST 51`), tolérance aux pluriels et aux accents, filtres par wiki, pagination, suggestion en cas de zéro résultat
- **Wikilinks Obsidian** résolus, y compris les variantes (chiffres romains/arabes, zéros de tête) ; liens rouges pour les pages réellement absentes du vault
- Callouts, **infobox** générée depuis le frontmatter YAML (réparé automatiquement s'il est invalide), sommaires, backlinks
- **Pages d'accueil** (chaque wiki, et les pages d'accueil de l'encadrement) : bandeau avec le nom du wiki et son
  nombre de pages, chapeau, une grille des thèmes en tête sur l'accueil du wiki, puis une boîte par section de la
  note avec listes en colonnes — ni infobox, ni sommaire, ni préfixe de classement dans les titres, comme la page
  d'accueil d'un vrai wiki
- **Thèmes** : une page par thème (`w/<wiki>/theme/<slug>.html`), source authored (« type: thème ») ou — faute de
  thème, en Ergonomie — la note index d'un sous-dossier ; chaque notion rattachée porte un fil d'Ariane à trois
  maillons (Portail › Wiki › Thème) et un bloc « Voir aussi » (version jumelle publiée, notions du même thème).
  Sur l'accueil du wiki, le titre de chaque volet mène à la page de son thème ; la flèche et le reste de la ligne
  replient le volet
- **Images à taille standard (25 septembre 2026)** : une capture ou une planche ne coupe plus la lecture —
  hauteur plafonnée à min(24rem, 60vh), proportions gardées ; infographies et schémas dans une colonne de
  30rem, à min(34rem, 75vh). Toucher une image l'ouvre agrandie par-dessus la page ; toucher l'image agrandie
  passe en taille réelle ; ✕, Échap, un toucher à côté ou le bouton Retour du téléphone referment sans quitter
  la page. Détail : `content-updates/2026-09-25-espaces-clos-schemas.md`
- **Schémas d'Espaces clos (25 septembre 2026)** : cinq schémas vectoriels sur `w/securite/espaces-clos.html`
  (limites d'explosion, densité de vapeur, purge court-circuitée, surveillant, chantier en cul-de-sac), dessinés
  depuis la page et les art. 302, 308, 308.1 et 309 du RSST ; trois remplacent des captures de cours, dont une
  qui affichait une alarme à 10 % de la LIE. Inversés en thème sombre (classe `infographie-schema`). Résumé de
  l'art. 308 aligné sur le texte en vigueur. **À poser dans le vault** avec `tools/appliquer_retouches.mjs`,
  sinon la prochaine construction les efface. Photos à venir (aucune banque d'images joignable depuis
  l'environnement de travail). Détail et points relevés à trancher : `content-updates/2026-09-25-espaces-clos-schemas.md`
- **Page LIE du recueil (25 septembre 2026)** : le tableau des seuils en espace clos attribuait au RSST une
  sortie immédiate à 10 % de la LIE et plaçait la zone explosive entre 10 et 100 % de la LIE ; il suit désormais
  les art. 302, 303, 304 et 306 (au plus 5 % de la LIE ; la plage explosive va de la LIE à la LSE ; les seuils
  d'alarme sont des réglages d'appareil, que le RSST ne fixe pas). Lot du vault : `content-updates/2026-09-25-lie.json`
- **Une page illustrée par wiki (25 septembre 2026)** : deux schémas chacune, dessinés puis relus par un relecteur
  contradictoire, sur Modèle de Karasek (une capture qui montrait la courbe de Selye est retirée), Postures
  contraignantes, Aérosols, Gestion des moteurs diesel sous terre et Processus de réclamation CNESST. Textes
  corrigés d'après le recueil : silice cristalline à 0,05 mg/m³ (C2) et NO₂ à 3 ppm (annexe I du RSST) ; versement
  du salaire, délais de réclamation (LATMP) et avis d'événement grave (LSST, art. 62) sur Réclamation CNESST et IRR.
  **À poser dans le vault** (six lots). Détail et points relevés à trancher :
  `content-updates/2026-09-25-une-page-par-wiki-schemas.md`
- **Silice cristalline et NO₂ sur tout le site (25 septembre 2026)** : douze autres pages (hygiène, ergonomie,
  toxicologie, recueil) donnaient la silice à 0,1 ou 0,025 mg/m³ (C1) et le NO₂ à 0,2 ppm ; elles suivent l'annexe
  I du RSST (PDF du recueil à jour au 1er juin 2024) : silice 0,05 mg/m³, Pr, C2, EM ; NO₂ 3 ppm (VEMP) et 5 ppm
  (VECD) ; CO 35 ppm dans les mêmes tableaux. LégisQuébec non consulté. **À poser dans le vault** (douze lots
  `2026-09-25-silice-no2-*.json`). Détail : `content-updates/2026-09-25-silice-no2.md`
- **Pages art-116 et art-30, DPM, amiante (25 septembre 2026)** : les pages « art-116-RSST » (hygiène, ergonomie) et
  « art-30-RSST » s'ouvraient sur un faux texte d'article ; elles citent le vrai (température ; échelles) et
  rattachent leur sujet aux bons articles (RSST art. 39 à 42, 101, 118 ; RSSM art. 96). DPM : seule valeur
  québécoise, RSSM art. 102 (moins de 0,4 mg/m³ de carbone total), mesures au moins tous les 6 mois (art. 103.1).
  Amiante : toutes les formes 0,1 f/cm³, C1, EM (annexe I). **À poser dans le vault** (lots `2026-09-25-corr-*.json`
  et `2026-09-25-titre-art-116-*.json`). Détail : `content-updates/2026-09-25-art-116-30-dpm-amiante.md`
- **Moteurs diesel sous terre, schémas redessinés (25 septembre 2026)** : les deux schémas de la page deviennent des
  dessins (galerie avec chargeuse, ventilation et travailleur ; dispositifs d'échappement en coupe), et deux
  s'ajoutent : la ventilation d'un chantier en cul-de-sac et la mesure du carbone total selon le RSSM (art. 102 et
  103.1). Les fichiers v1 quittent le site. **À poser dans le vault** (le lot Diesel remplace la version précédente,
  qu'elle ait été appliquée ou non). Détail : `content-updates/2026-09-25-diesel-schemas-v2.md`
- **Liens lisibles dans les phrases (26 septembre 2026)** : un lien écrit dans une phrase affichait le titre de la
  page visée au lieu du mot écrit (« [[Silice cristalline]] respirable » devenait « Programme de prévention silice
  cristalline respirable »). Le générateur garde désormais le mot saisi dans les phrases (485 liens sur 198 pages à la
  prochaine construction) et le titre pour les articles de loi (`art-59-LATMP`), les notes d'analyse et les listes de
  liens. Hors du wiki de la page, un nom de fichier l'emporte sur l'alias d'une autre page, comme dans Obsidian. Deux
  défauts sont dans le texte du vault lui-même, traces de renommages : 553 liens portent le nom
  long (« Aviser la [[CNESST, rôles et pouvoirs]] que… ») et « Confinement » mène, dans huit pages d'hygiène, de
  toxicologie et de sécurité, à la note psychosociale sur la charge mentale : `tools/raccourcir_liens.mjs` les corrige
  d'après une table à valider. **À faire là où est le vault** : l'outil, puis la reconstruction. Détail :
  `content-updates/2026-09-26-libelles-liens.md`
- **Six pages RPS dans le style de Frank (26 septembre 2026)** : deux schémas chacune sur Foreur, Aide-foreur,
  Contremaître, MBI, Coût économique des RPS et Confinement. Ils sont refaits à l'identique de l'infographie
  « CNESST — comprendre les 3 volets » de Frank :
  - fond marine ;
  - sections encadrées de vert, de bleu ou d'orange, avec médaillon ;
  - pictogrammes blancs ;
  - bandeau « Repère rapide ».

  Le gabarit `tools/schemas-sombres/` les produit, avec la police Figtree et les icônes Material Design Icons
  incorporées ; il sert aussi aux prochains schémas. Les mots viennent de la page. Ces affiches, conçues sur fond
  sombre, ne sont plus inversées par le thème sombre (option `sombre` de `tools/poser_schemas.mjs`).
  **À poser dans le vault**. En priorité : le PDF lié à la page MBI reproduit les énoncés d'un questionnaire sous
  licence. Détail et erreurs relevées : `content-updates/2026-09-26-rps-schemas-lot10.md`
- **L'article en PDF (26 septembre 2026)** : un bouton « 📄 PDF » dans la barre de lecture de chaque article
  (à côté de A−, A+ et Lecture). Il ouvre l'impression du navigateur, où « Enregistrer au format PDF » produit le
  fichier : texte net et copiable, liens actifs, en noir sur blanc, sans menus. En tête du PDF figurent l'adresse de la
  page et la date du téléchargement. Les images sont chargées avant l'impression ; le texte reste à sa taille normale
  même si A+ est réglé. Dans l'application Android, la version 1.0 ouvre la page dans le navigateur (réseau requis).
  La version 1.1 imprime elle-même, sans réseau, mais elle reste à construire avec la clé de signature :
  `node tools/android/construire_apk.mjs --version 1.1 --code 2` (voir `tools/android/README.md`).
- **L'illustration de Frank sur le lieu de contrôle (26 septembre 2026)** : sur Types de personnalité et lieu de
  contrôle, l'image refaite par Frank remplace telle quelle le schéma « interne ou externe ». La légende reste celle
  de la page. L'outil de pose accepte désormais une image PNG ou JPEG : signature vérifiée, 480 px de large au moins,
  1,5 Mo au plus. L'outil et le générateur posent ses dimensions, pour que la page ne saute pas au chargement. Le
  style de cette image devient le modèle des nouveaux schémas, sans ✓ ni ✗ et avec les mots de la page. **À poser dans le vault**. Détail et écarts avec la page :
  `content-updates/2026-09-26-image-lieu-de-controle.md`
- **Pages RPS illustrées (suite) et deux refontes pour le thème sombre (26 septembre 2026)** : schémas sur
  Conséquences du stress, Communication souterraine (téléphone relié à la surface, RSSM art. 283), Grille INSPQ
  (démarche), Culture minière, CNESST (les trois rôles ; ce que l'inspecteur peut demander à voir sur les RPS) et
  LMRSST (document et participation selon l'effectif ; les RPS dans le programme de prévention) ; Retour au travail et
  Types de personnalité refaits en schémas plus grands, lisibles au téléphone en thème sombre. En attente de Frank :
  catégories de la grille INSPQ (liste à vérifier). La LSST du recueil est à jour au 26 mars 2024, avant la réforme du
  programme de prévention.
  **À poser dans le vault**. Détail : `content-updates/2026-09-26-rps-schemas-lot9.md`
- **Six pages RPS illustrées et Premiers signes redessiné (26 septembre 2026)** : schémas sur Les quatre formes de
  reconnaissance et Types de personnalité et lieu de contrôle (à la place d'une diapositive de cours et d'une figure de
  livre), PAE, Rotations jour-nuit, Soutien social et Axe HHS ; Premiers signes en mine passe d'un schéma serré à six schémas
  lisibles en thème sombre (vue d'ensemble, une catégorie par section, conversation). **À poser dans le vault**.
  Détail et erreurs relevées : `content-updates/2026-09-26-rps-schemas-lot8.md`
- **Six pages RPS illustrées (26 septembre 2026)** : schémas sur Modèle de Sélye (courbe des trois phases),
  Définition du stress professionnel (balance exigences et ressources ; stress aigu et chronique), Étapes d'un retour
  au travail réussi, Premiers signes en mine, Séparation famille et conjoint en FIFO et Soutien post-événement
  traumatique structuré. Relecture contradictoire ; aucun chiffre non sourcé repris ; texte des articles inchangé.
  **À poser dans le vault** (six lots `2026-09-26-*-schemas.json`). Détail et erreurs relevées :
  `content-updates/2026-09-26-rps-schemas.md`
- **Pages RPS illustrées (25 septembre 2026)** : schémas sur Médiation (Thomas-Kilmann, niveaux d'intervention),
  Modèle de Siegrist, Communication descendante, Définition des risques psychosociaux, Comparatif des cycles FIFO,
  Démarche de prévention en RPS, Harcèlement psychologique (LNT, art. 81.18), Les trois niveaux de prévention,
  Reconnaissance et Théories de la motivation (Kaufman, Herzberg). Huit captures fausses ou tierces retirées : Selye
  (deux fois), Maslow (trois fois), Dolan et Arsenault (deux fois) et une diapositive tierce, affichées à cause de noms
  de fichiers identiques dans le vault. Relecture contradictoire ; schémas corrigés en v2. Texte des articles inchangé.
  **À poser dans le vault** (dix lots `2026-09-25-*-schemas.json`). Détail et erreurs relevées : `content-updates/2026-09-25-rps-schemas.md`
- **Application Android (23 septembre 2026)** : `docs/app/wiki-sst-mines.apk` (8 Ko), lien « 📱 Application Android »
  au pied du portail et de l'espace encadrement. L'application ouvre le site publié en plein écran ; le hors-ligne est
  celui du site (service worker) ; les liens externes et les PDF partent au navigateur. Construite par
  `tools/android/construire_apk.mjs` (outils Maven Central, formats binaires écrits par `tools/android/binaire.mjs`),
  hors du manifeste hors ligne. La clé de signature reste hors Git. Détail : `tools/android/README.md`
- **Bouton « Télécharger hors ligne » (23 septembre 2026)** : le téléchargement du wiki pour consultation sans réseau
  se lançait tout seul, sans commande visible. Un lien « ⬇️ Télécharger hors ligne » est maintenant dans la navigation de
  chaque page et au pied du portail ; il lance le téléchargement et ouvre le panneau, dont le bouton principal montre ce
  qui reste à prendre (« Télécharger tout le wiki (440 Mo) »), puis l'avancement (« Téléchargement en cours… 34 % »),
  et disparaît quand tout est là. Sans réseau, le geste est retenu et part au retour du signal ; sans service worker
  (navigateur ancien, site servi hors https), un message le dit
- **Thème sombre par défaut (21 septembre 2026)** : le wiki se lit sous terre, de nuit, sur une tablette livrée
  en clair d'usine — c'est donc le sombre qui ne demande aucun réglage. Le bouton de l'entête fait le tour :
  sombre (défaut) → clair → automatique (suit l'appareil). Le choix est retenu d'une page à l'autre ; une page
  imprimée sort toujours en noir sur blanc
- **Tablette de chantier (21 septembre 2026)** : réglé pour la Galaxy Tab Active4 Pro — 1 920 × 1 200 à densité
  1,5, soit 1 280 × 800 px CSS en paysage et 800 × 1 280 en portrait, tenue avec des gants. Les cibles tactiles
  grandissent dès que le pointeur est grossier (et non plus sous 900 px seulement : en paysage, aucune règle
  « téléphone » ne s'appliquait), le texte courant passe à 16 px, la ligne se borne à 80 caractères sur les
  grands écrans, et le portrait affiche les volets de thèmes sur deux colonnes
- **Contrôles de forme (21 septembre 2026)** : le contrôle d'introduction ne s'arrête plus sur la « Table des
  matières » manuelle des notes (retirée du rendu : le lecteur lit la phrase qui la suit) et ne s'applique pas aux
  notes d'analyse d'études, dont le gabarit commence par un titre ; une page qui cite une note d'analyse porteuse
  d'un DOI compte comme sourcée, et la source s'affiche à côté de la citation (pastille « DOI » ou « source » dans
  les listes et les tableaux, 629 citations sur 169 pages). Ce qui reste à faire dans le vault est listé dans
  `content-updates/2026-09-21-controles-de-forme.json` ; les phrases d'ouverture des pages qui n'en avaient pas
  sont dans `content-updates/2026-09-21-phrases-introduction.json`, à poser avec `tools/appliquer_intros.mjs`
- **Avis des lecteurs** : sur chaque page issue d'une note, un pouce en haut, un pouce en bas et un commentaire
  facultatif, enregistrés dans Airtable (base Formations, table « Avis wiki SST (web) ») par un relais Cloudflare.
  Le bloc reste invisible tant que `docs/assets/avis.json` ne donne pas l'adresse d'un relais (fichier modifié à la
  main, hors du manifeste hors ligne, gardé dans le noyau du service worker) ; hors ligne, l'avis attend dans le
  navigateur et repart à la connexion suivante, depuis n'importe quelle page
- **Études et rapports** : les fiches de sources (titre avec une année entre parenthèses, ou « Analyse - … »)
  quittent les volets de l'accueil pour une page `w/<wiki>/etudes-et-rapports.html`, classée par thème, avec un
  groupe « Sans thème » pour n'en perdre aucune ; la page du thème, elle, continue de toutes les lister
- **Recueil législatif** : tri naturel des articles (art-1, art-2, art-10…), sommaire par règlement, index par loi
- **Articles de loi** : texte officiel extrait de la couche texte du PDF LégisQuébec (copiable, lisible au
  lecteur d'écran, cherchable), posé avant la capture officielle conservée ; PDF sources, images cliquables
- **Mobile** : styles adaptatifs, cibles tactiles, bouton de retour en haut ; la vérification sur appareils réels reste distincte des tests automatiques
- **Catégories** : une page par mot-clé du frontmatter porté par au moins 5 pages, tous domaines confondus
- **Visite guidée** : se lance à la première venue sur chaque type de page (portail, tableau de bord,
  article), puis se relance à la demande par le bouton « ? » de l'en-tête. Les étapes dont l'élément
  est absent sont ignorées.
- **Thème clair / sombre / automatique** : bouton dans l'en-tête, choix mémorisé. Les captures d'articles
  de loi (texte noir sur blanc) sont détectées à la construction et **inversées** en thème sombre, pour
  ne pas laisser un rectangle éblouissant au milieu de la page. L'impression reste toujours en clair.

## Notes de maintenance

- Le générateur relit tout le vault à chaque exécution (~80 s) et réécrit `docs/` en entier.
- Les images sont cherchées dans le vault **et** dans les dossiers listés par `EXTRA_ASSET_ROOTS` (`Notes de cours SST`, `SST/Images`, `Obsidian Vault/Images`). Ne pas déplacer le dossier « Images wiki » du vault.
- Le build signale les frontmatters YAML illisibles : les corriger dans Obsidian améliore les infobox.
- Les infographies conservent une version texte et des sources ; leurs notes et médias doivent rester dans le vault pour survivre à la prochaine génération.
- Cinq infographies restent intégrées : Manutention, Bruit, Vibrations, Exposition chimique et Silice. Le lot 2 historique (incluant alors Cadenassage) est archivé dans `content-updates/2026-09-06-visuels-lot2.json`, après la révision éditoriale du même jour ; les prompts sont dans `content-updates/prompts-visuels-lot2.md`. Les archives sont des instantanés successifs, pas des fichiers à réappliquer sans comparaison.
- Après validation, la section « Arrêter ne suffit pas » du cadenassage utilise un tableau visible à deux colonnes, à la place de l’image et de son volet déroulant. La dernière note figure dans `content-updates/2026-09-06-cadenassage-tableau.json`, après `2026-09-06-cadenassage-compact.json`. L’ancre historique est conservée ; les images v1 et v2 restent dans le vault.
- ~~En-tête pilote~~ : `tools/entete-article.mjs` regroupait titre, domaine, commandes de lecture et sommaire pour la seule fiche Cadenassage du wiki des travailleurs. Cette fiche a été archivée le 12 septembre 2026 avec le reste du wiki des travailleurs ; l'en-tête compact est retiré avec elle (sa jumelle du dossier « 27 - Articles gestionnaires » n'a ni le même contenu ni le même sommaire).
- Fiches pour les travailleurs (9 septembre 2026, **abandonné le 12 septembre 2026**, voir l'entrée suivante) : le wiki des travailleurs `/t/` n'était plus généré, ses 84 pages étaient indexées par situation dans `travailleurs.html`. Historique conservé dans `content-updates/2026-09-09-integration-travailleurs.md`.
- **Avis des lecteurs (15 septembre 2026)** : chaque page issue d'une note (4 074 pages : articles, thèmes, accueils et les copies de l'encadrement) porte un bloc « Cette page vous a-t-elle été utile ? » — pouce en haut, pouce en bas, puis un commentaire et un nom facultatifs. Le pouce part au clic (un avis sans commentaire compte) ; le commentaire envoyé ensuite met à jour la même ligne, grâce à une clé `Réf` = identifiant local anonyme du lecteur + adresse de la page. Destination : base Airtable **Formations**, table **Avis wiki SST (web)** (`tbl3kDCV13AFkd6X6`), même convention que les tables « Retours quiz … (web) » des sites de formation ; les champs `Statut` (Nouveau / En cours / Traité / Sans suite) et `Suivi` servent au suivi. Le site étant statique, l'envoi passe par un relais Cloudflare (`tools/avis-worker/`) qui seul détient le jeton : **aucun jeton n'est publié**. L'adresse du relais vit dans `docs/assets/avis.json`, relu au chargement — la changer ne demande pas de reconstruire les pages, et tant qu'elle est vide le bloc reste invisible. Hors ligne, l'avis attend dans `localStorage` et repart à la connexion suivante. Détail et déploiement : `tools/avis-worker/README.md`, `content-updates/2026-09-15-avis-lecteurs.md`.
- **Études et rapports à part (14 septembre 2026)** : Frank retire les études et rapports des volets de l'accueil d'un wiki, qui redevient une entrée par notion. Une notion dont le titre porte une année entre parenthèses (« Karasek (1979) - … ») ou commence par « Analyse - » est la fiche d'une source : les 44 de la SST psychosociale vont sur `w/psychosocial/etudes-et-rapports.html`, classées par thème (23 rattachées, en 68 placements puisqu'une étude peut servir plusieurs thèmes) et suivies d'un groupe « Sans thème » (21) qui, lui, ne figurait nulle part auparavant. La page est liée depuis la barre d'index de l'accueil et depuis la barre latérale de toutes les pages du wiki ; les cinq autres wikis n'ont aucune étude et n'ont donc pas la page. Le titre de chaque volet de thème devient un lien vers la page du thème (vérifié dans Chromium : le clic navigue, la flèche et le reste de la ligne replient toujours). Rien n'est retiré du site : la page d'un thème continue de lister ses études avec ses notions. Détail : `content-updates/2026-09-14-etudes-et-rapports.md`.
- **Wiki par notion et par thème (12 septembre 2026)** : Frank abandonne le wiki séparé des travailleurs pour un vrai wiki organisé par notion et par thème. Les 112 notes des dossiers `24/25/26 - …` des six wikis sont archivées dans `98 - Archives` de chaque wiki (`tools/archiver_travailleurs.mjs`, sauvegarde locale `sauvegarde-vault/2026-09-12-travailleurs/`). Les adresses deviennent `w/<wiki>/<notion>.html` (`tools/adresses.mjs`) ; les thèmes vivent sous `w/<wiki>/theme/<slug>.html` (notes authored « type: thème », ou les 5 notes index de sous-dossier en Ergonomie, qui n'en a aucune) ; les collisions de nom reçoivent un suffixe explicite (`-encadrement`, ou le dossier d'origine) plutôt qu'un « -2 » silencieux. Les liens qui visaient une fiche archivée suivent sa `version-jumelle` quand elle en déclare une, sinon restent grisés « (source non publiée) ». Les sommaires par dossier des six wikis ne sont plus générés (simplification assumée : ils n'étaient qu'une vue secondaire) ; leurs anciennes adresses, comme celles du wiki des travailleurs, sont redirigées par une `404.html` autonome (`tools/redirections.mjs`) à partir d'une table écrite par le générateur (`docs/assets/redirections.json`). Le portail de l'encadrement (`/g/`) est inchangé dans sa forme ; une de ses cibles introuvable arrête désormais le build plutôt que de devenir un lien mort silencieux. Détail complet, décisions, risques et points soumis à Frank : `plans/2026-09-12-wiki-par-notion.md`.
- Iso-strain : la page « Ce que ça signifie » est complétée et référencée (INRS, INSPQ, études de Johnson et collègues). La note est archivée dans `content-updates/2026-09-06-iso-strain.json`. Exemple minier fictif, associations et causalité distinguées ; aucune validation spécialisée ni extension aux parcours par public.
- Suite documentaire RPS : « Demandes psychologiques », « Latitude décisionnelle » et « Soutien social au travail » sont enrichies avec des références INRS, INSPQ et CNESST, appelées dans le texte. Les notes figurent dans `content-updates/2026-09-06-rps-references-lot2.json`. Tableaux à deux colonnes, exemples fictifs, anciennes ancres et parcours conservés ; aucun chiffre médical non étayé ni validation spécialisée revendiquée.
- Suite documentaire RPS, lot 3 : « Reconnaissance au travail », « Justice organisationnelle » et « Définition du stress professionnel » comportent chacune quatre références appelées et un tableau compact. Archive : `content-updates/2026-09-06-rps-references-lot3.json`. Modèles distingués, chiffres non vérifiés retirés et exemples miniers fictifs ; anciens liens et indicateurs de publication conservés. Le schéma de cours marqué « usage personnel » n'est plus intégré à la page Stress, sans suppression de son fichier source. Cette vérification documentaire n'atteste aucune validation spécialisée.
- Appels de référence : les liens numériques locaux `#ref-…` du corps des articles sont affichés en petit exposant, avec un minimum de `0.75rem`. La bibliographie, les destinations et les liens ordinaires sont inchangés ; couleurs et focus suivent le thème existant.
- Mise en page des articles : titre, domaine et barre A−/A+/Lecture sont groupés avant le sommaire. La barre ne peut plus s’aligner en bas du sommaire ; elle se replie sur plusieurs lignes si nécessaire et ses commandes restent accessibles en mode Lecture. Le pilote Cadenassage conserve sa disposition particulière, les autres titres gardent leur typographie.
- Bibliographies : `tools/bibliographie.mjs` regroupe les références `ref-…` séparées par Marked en une liste numérotée compacte. Les numéros explicites, les liens et les ancres sont conservés ; les listes déjà structurées reçoivent seulement une classe de présentation. Les paragraphes et listes ordinaires ne sont pas resserrés. Aucune note du vault n’est modifiée par cette correction d’affichage.
- Navigation des articles : l’en-tête partagé mesure sa hauteur réelle pour dégager les ancres et positionner le menu. Sur téléphone, les commandes et la recherche occupent deux rangées, y compris lorsque l’installation est proposée. Les cibles de section et de référence reçoivent un repère discret ; les appels numériques sont nommés pour les lecteurs d’écran. Aucun réalignement tardif après une interaction du lecteur. Les tableaux de bord gardent leur propre disposition.
- Menu mobile des articles : état ARIA synchronisé, liens du volet fermé retirés de la navigation au clavier, ouverture avec focus, fermeture par Échap, sélection ou clic extérieur ; les clics modifiés et la navigation native sont conservés. Les tests automatisés vérifient les gestionnaires et les contrats de structure, pas le rendu sur appareils réels.
- Contrôle qualité : les deux coupures terminales constatées dans « Espaces clos » sont désormais détectées ; une introduction commençant par un lien n’est plus confondue avec un lien de navigation isolé. Ces alertes ne réécrivent pas les notes et n’attestent ni leur exactitude ni leur conformité.
- Le bilan et les prochains textes à reprendre sont consignés dans [l’audit transversal du 6 septembre](content-updates/2026-09-06-audit-transversal.md). Il distingue les alertes automatiques des constats éditoriaux et laisse le choix du public prioritaire à confirmer.
- Suite terrain validée pour publication : les deux pages « Espaces clos » et « Lire une FDS rapidement » sont clarifiées et dotées de références officielles. Archive : `content-updates/2026-09-06-terrain-references.json`. Un tableau compact par note ; anciennes ancres, statuts et publics conservés. Retrait des raccourcis d’entrée, des seuils simplifiés et de la règle erronée des quatre rubriques suffisantes. La vérification documentaire n’est pas une validation spécialisée ni une procédure locale.
- Suite terrain, lot 2 : « Solvants », « Sommeil et quart de nuit » et « Obligations de l’employeur » sont référencés dans `content-updates/2026-09-06-terrain-references-lot2.json`. Protection chimique conditionnelle, fatigue traitée aussi par l’organisation et renvois LSST corrigés vers le texte officiel. Un tableau à deux colonnes par note ; anciennes ancres, statuts et publics conservés. Les anciennes fiches juridiques mal intitulées restent à auditer séparément. Aucune validation spécialisée ni garantie de conformité n’est revendiquée.
- Intégrité de publication : `.gitattributes` préserve les octets de `docs/` sans conversion de fins de ligne. Après construction et préparation des fichiers, `node tools/verif_publication.mjs --staged` compare les objets Git au manifeste hors ligne ; `npm --prefix tools run check:publication` vérifie le commit courant. Ce contrôle complète celui des fichiers locaux et évite les empreintes invalidées par une conversion Windows/Git.
- Les sources `tools/app.js` et `tools/style.css`, copiées directement dans les assets, gardent également leurs octets dans Git : un changement de branche sous Windows ne doit pas faire diverger source et copie générée.
- Texte officiel des articles de loi (9 septembre 2026) : `tools/extraire_textes_loi.mjs` lit les sept PDF du recueil (LSST, LATMP, LNT, LMRSST, RSST, RSSM, CSTC) page par page avec les coordonnées de chaque item — corps 11 pt, numéros d'article plus grands, historique législatif en 9 pt écarté, bandes d'en-tête et de pied ignorées, marge gauche mesurée par page pour découper les alinéas — et écrit `tools/textes-loi/*.json` (2,1 Mo, commis). Contrôles à l'extraction : aucun article vide, aucun doublon, numéros croissants à profondeur égale, aucun titre courant dans un texte ; croisement avec le site : les 2 833 articles publiés sont retrouvés et leur page PDF concorde avec le renvoi `#page=` de la note (sauf RSSM art. 83, dont la note renvoie à la page 9 alors que l'article est page 34). `tools/textes_loi.mjs` pose le texte sous le titre « Texte officiel » (le titre du vault « Texte officiel : capture du PDF » est renommé au rendu, la capture reste dessous) et l'ajoute à l'index plein texte. Aucune note du vault n'est modifiée ; le texte n'est ni corrigé ni complété. Détail dans `content-updates/2026-09-09-textes-de-loi.md`.
- Pages d'accueil (9 septembre 2026) : les 17 notes d'accueil (`type: accueil` ou « 00 - 🏠 Accueil … ») ne sont plus rendues comme des articles. `tools/accueil_wiki.mjs` découpe le corps rendu en boîtes (une par h2, sous-groupes h3 en colonnes, listes de huit entrées et plus en colonnes par largeur, points d'entrée « emoji + lien » en tuiles décrites par le titre de la page cible ; même rendu pour les copies des accueils gestionnaires dans l'espace encadrement `g/`), retire les préfixes de classement des titres (« 15 - Navigation »), et écarte ce qui ne mène nulle part sur le site : paragraphe réduit au nom d'une vidéo non publiée, items « (source interne) » ou « (abrogé) » sans explication, item vide, section vide ; un wikilink resté brut dans la note (« [[Gestion », « [[Postures|Postures sécuritaires] ») devient un lien si la page existe, sinon un lien rouge. Chaque retrait est signalé à la construction (`⚠ accueil …`) pour être corrigé dans Obsidian. Le fil d'Ariane de l'accueil d'un wiki s'arrête au wiki ; le pied de page se réduit à la date de génération (ni pages liées, ni indicateurs éditoriaux, qui qualifient des articles). Rien n'est ajouté au contenu, hormis le nombre de pages et les liens d'index. Détail dans `content-updates/2026-09-09-accueils-wiki.md`.
- Renvois vers les notes d'analyse : les 59 renvois tranchés (13 à appliquer, 45 resserrés, 1 écarté) sont dans `content-updates/2026-09-09-renvois-sources.json` avec, pour chacun, l'ancrage et la ligne définitifs (`ancrageFinal`, `ligneFinale`). `tools/appliquer_renvois.mjs` les pose dans les notes (appel `[n](#ref-uni-n)` après l'ancrage, ligne dans « ## Références » avec lien vers la note d'analyse) ; sans `--appliquer`, il ne fait qu'afficher chaque pose avec son contexte. Le vault n'étant pas accessible depuis l'environnement de génération, rien n'y a encore été écrit.
- Réutilisation ciblée : les schémas d’exposition et de vibrations enrichissent aussi « Voies d’exposition » et « Vibrations (pour toi) ». Notes archivées dans `content-updates/2026-09-06-images-utiles.json`. Ajouter un visuel seulement s’il explique un mécanisme, situe des éléments ou facilite une comparaison ; conserver le texte, les limites et les sources. Ne pas illustrer systématiquement les procédures ou les textes de loi.
- Renvois vers les notes universitaires (9 septembre 2026) : `content-updates/2026-09-09-renvois-sources.json` liste 59 renvois entre les fiches pour les travailleurs et les notes « Analyse … » du vault, chacun avec son verdict (appliquer, resserrer, écarter), l'ancrage exact recopié de la fiche et la ligne de bibliographie à écrire. Proposés, relus par deux relecteurs contradictoires, tranchés puis contrôlés ; les 59 ancrages ont été vérifiés mot à mot. Ce fichier ne modifie aucune note : il dit où poser chaque renvoi, la décision d'écrire reste à prendre dans Obsidian.
- Rendu sur petits écrans (9 septembre 2026) : les numéros d'urgence de l'index des fiches reçoivent une zone tactile de 44 px posée par un pseudo-élément, sans changer l'interligne du paragraphe ; le domaine affiché sous chaque fiche passe de 11,5 à 13 px ; la grille du portail cesse de déborder d'un écran de 320 px et le bloc de profil du tableau de bord s'efface sous 480 px ; « ↑ haut » et le fil d'Ariane atteignent le minimum WCAG 2.5.8 AA. Mesuré en émulation d'appareil sur cinq formats, figé par `tools/tests/rendu-mobile.test.mjs`. L'émulation ne remplace pas un essai sur téléphone réel.
- Les dates « révision déclarée », « relecture éditoriale », « sources vérifiées » et « génération du site » ne sont pas interchangeables. Une date de fichier n'atteste plus une relecture.
- Pour attester une relecture humaine, renseigner `relecture-editoriale-le` et `relecteur-editorial`. Pour une vérification documentaire, `sources-verifiees-le`. Pour une validation spécialisée, `validation-specialisee-le` et `validateur-specialise`. Ne pas renseigner ces champs tant que le travail correspondant n'a pas été effectué.
- `qualite.html` distingue le contrôle automatique de forme et les métadonnées de traçabilité. Aucun score automatique ne certifie la conformité ou la justesse du contenu.
- `content-updates/2026-09-06.json` conserve le contenu des onze notes révisées ; le fichier `2026-09-06-navigation.json` conserve les corrections exactes de navigation et de YAML. Ces archives utilisent des chemins relatifs au vault. Elles ne sont pas réappliquées automatiquement : comparer les versions avant toute restauration pour préserver les modifications ultérieures dans Obsidian.
