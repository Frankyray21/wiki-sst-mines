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

## Trois entrées

| Entrée | Pour qui | Contenu |
| --- | --- | --- |
| 👷 [`/t/`](https://frankyray21.github.io/wiki-sst-mines/t/) | Travailleurs | Pages vulgarisées, rangées par problème vécu, plus les articles de loi qui fondent leurs droits |
| 🎓 [`/g/`](https://frankyray21.github.io/wiki-sst-mines/g/) | Superviseurs, gestionnaires, direction | Portail en tableau de bord : entrée par rôle, par situation à gérer, ou par thème |
| 📚 [`/w/`](https://frankyray21.github.io/wiki-sst-mines/) | Conseiller SST, recherche documentaire | Le fond documentaire classé par discipline |

La répartition est automatique, à partir du frontmatter du vault : `publication-travailleur`,
`publication-gestionnaire` et `public-cible`, avec veto sur `niveau-sensibilité` (interne ou ≥ 2).
**Une page n'entre jamais dans le wiki des travailleurs sans autorisation explicite.**
Le Recueil législatif n'est pas dupliqué : le texte de loi est public et identique pour tous.

**Ces parcours ne sont pas un contrôle d'accès.** GitHub Pages est public : les contenus confidentiels ne doivent pas y être publiés. Le champ « interne » historiquement utilisé pour désigner un public n'assure aucune protection. Une authentification réelle nécessiterait une décision d'hébergement distincte.

## Structure

- `docs/` — le site statique généré (HTML pur, aucune dépendance serveur) — c'est ce dossier que GitHub Pages publie
- `tools/build_site.mjs` — générateur : markdown Obsidian → HTML type Wikipédia
- `tools/png_palette.mjs` — recompression PNG sans perte (palette 8 bits, zlib natif)
- `tools/portail_encadrement.mjs` — portail `/g/` en tableau de bord : contenu des cartes, icônes SVG.
  Les cibles sont vérifiées à la construction ; le build avertit si l'une disparaît du site.
- `tools/portail.css` — feuille de style de ce portail (chargée par lui seul)
- `tools/serve.mjs` — serveur local de prévisualisation (port 8090)

## Utilisation

```bash
# Regénérer le site depuis le vault Obsidian
node tools/build_site.mjs

# Vérifier qu'aucun lien interne ne pointe dans le vide
node tools/verif_liens.mjs        # tout docs/, fichiers et ancres — ou passer t / g / w

# Tests de non-régression
npm --prefix tools test

# Vérifier le résultat construit : assets, hashes et infographies
npm --prefix tools run check:site

# Prévisualiser en local
node tools/serve.mjs
# → http://localhost:8090
```

## Fonctionnalités

- **Recherche plein texte** : numéros d'article (`art 4 RSST`, `RSST 51`), tolérance aux pluriels et aux accents, filtres par wiki, pagination, suggestion en cas de zéro résultat
- **Wikilinks Obsidian** résolus, y compris les variantes (chiffres romains/arabes, zéros de tête) ; liens rouges pour les pages réellement absentes du vault
- Callouts, **infobox** générée depuis le frontmatter YAML (réparé automatiquement s'il est invalide), sommaires, backlinks
- **Recueil législatif** : tri naturel des articles (art-1, art-2, art-10…), sommaire par règlement, index par loi
- Captures officielles des articles de loi + PDF sources, images cliquables pour agrandir
- **Mobile** : styles adaptatifs, cibles tactiles, bouton de retour en haut ; la vérification sur appareils réels reste distincte des tests automatiques
- **Catégories** : une page par mot-clé du frontmatter porté par au moins 5 pages, tous domaines confondus
- **Visite guidée** : se lance à la première venue sur chaque type de page (portail, wiki travailleurs,
  tableau de bord, article), puis se relance à la demande par le bouton « ? » de l'en-tête. Les étapes
  dont l'élément est absent sont ignorées.
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
- En-tête pilote : `tools/entete-article.mjs` regroupe titre, domaine, commandes de lecture et sommaire uniquement pour les deux versions de Cadenassage. Sur petit écran, le sommaire se replie par défaut, tout en respectant la préférence existante du lecteur. Le corps de l’article et les autres en-têtes restent inchangés.
- Portail travailleurs : pictogrammes SVG pour les rubriques et commandes, cartes sans icônes répétitives. Les émojis des titres sont retirés uniquement à l’affichage du portail, y compris dans ses suggestions, son historique et ses favoris. Notes, liens, index et données mémorisées restent intacts ; les autres pages conservent leur présentation.
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
- Réutilisation ciblée : les schémas d’exposition et de vibrations enrichissent aussi « Voies d’exposition » et « Vibrations (pour toi) ». Notes archivées dans `content-updates/2026-09-06-images-utiles.json`. Ajouter un visuel seulement s’il explique un mécanisme, situe des éléments ou facilite une comparaison ; conserver le texte, les limites et les sources. Ne pas illustrer systématiquement les procédures ou les textes de loi.
- Les dates « révision déclarée », « relecture éditoriale », « sources vérifiées » et « génération du site » ne sont pas interchangeables. Une date de fichier n'atteste plus une relecture.
- Pour attester une relecture humaine, renseigner `relecture-editoriale-le` et `relecteur-editorial`. Pour une vérification documentaire, `sources-verifiees-le`. Pour une validation spécialisée, `validation-specialisee-le` et `validateur-specialise`. Ne pas renseigner ces champs tant que le travail correspondant n'a pas été effectué.
- `qualite.html` distingue le contrôle automatique de forme et les métadonnées de traçabilité. Aucun score automatique ne certifie la conformité ou la justesse du contenu.
- `content-updates/2026-09-06.json` conserve le contenu des onze notes révisées ; le fichier `2026-09-06-navigation.json` conserve les corrections exactes de navigation et de YAML. Ces archives utilisent des chemins relatifs au vault. Elles ne sont pas réappliquées automatiquement : comparer les versions avant toute restauration pour préserver les modifications ultérieures dans Obsidian.
