# Module CNESST interactif — Wiki SST

## Contenu et fonctionnement

Trois vues : Comprendre, Les échanges, Cas terrain. Douze échanges et trois cas fictifs. Une explication s’ouvre immédiatement sous l’acteur ou l’échange sélectionné; l’ouverture n’impose aucun défilement. Les sources sont consultables dans le détail correspondant. La médiation reste volontaire et le Tribunal reste distinct de la CNESST.

- `contenu.json` : source unique des textes, acteurs, relations, cas et références.
- `rendu.mjs` : validation, rendu HTML complet et publication idempotente dans `docs/`.
- `styles.css` : composants préfixés `ci-`, thèmes du wiki, réglage `--echelle`, recomposition tactile.
- `interactions.js` : amélioration progressive, onglets au clavier, accordéons natifs, lecture complète et impression.
- `installer.mjs` : installation contrôlée du point de génération, publication et actualisation hors ligne.
- `cnesst.test.mjs` : tests des données, du rendu et de la reconstruction simulée.

Aucun framework, compte, formulaire de dossier ni API. L’état de consultation reste en mémoire. Le bouton de thème n’existe que sur la page autonome et réutilise la préférence du wiki.

## Installation

Depuis la racine du dépôt :

```sh
node --test tools/modules/cnesst/*.test.mjs
node tools/modules/cnesst/installer.mjs              # essai sans écrire
node tools/modules/cnesst/installer.mjs --appliquer
npm --prefix tools test
npm --prefix tools run check:site
```

Le module est ajouté à `docs/w/psychosocial/cnesst-roles-et-pouvoirs.html` et à sa copie `g/` si elle existe. L’ancien schéma, le texte, les sources et les ancres restent présents. La page autonome est `docs/modules/cnesst/index.html`.

L’installateur ajoute un import et un appel explicites à `tools/build_site.mjs`, après la génération des articles et avant celle des ressources hors ligne. La prochaine reconstruction depuis le vault rétablit donc le module sans retouche manuelle du HTML ni modification de la note Obsidian. L’installateur refuse une structure de générateur ou d’article inattendue.

Pour replier le chantier : retirer l’import et l’appel `publierCnesst(OUT)` puis revenir au commit précédent pour les pages générées. Le vault n’est pas modifié.

## Vérifications et limites

Les tests automatisés ne constituent pas une déclaration de conformité WCAG. Vérifier au minimum 320, 360, 390, 768 et 1280 px, thèmes clair/sombre, taille de texte augmentée, clavier et absence de JavaScript. Un essai sur la tablette physique, dans la WebView Android et avec lecteur d’écran demeure nécessaire. Une reconstruction complète du vault local ne peut être attestée par le seul test de post-traitement.

Les liens externes officiels nécessitent une connexion. L’usage hors ligne du wiki requiert le téléchargement/mise en cache du contenu; le code du module n’effectue aucune requête externe. La source éditoriale indique séparément la date de consultation des références et la version du module.

Le workflow `Module CNESST` travaille exclusivement sur `feat/cnesst-interactif`. Un changement du fichier `READY` déclenche tests, génération et conservation d’un artefact. Il ne fusionne rien dans `main` et ne publie pas de données privées.
