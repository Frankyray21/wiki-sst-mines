# WIKI SST — Mines

Encyclopédie interne de santé et sécurité du travail en milieu minier, générée automatiquement à partir du vault Obsidian « 🏠 WIKI SST - Mines » (notes de cours).

**4 577 articles** répartis en 6 wikis thématiques + 1 recueil législatif :

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
| 👷 [`/t/`](https://frankyray21.github.io/wiki-sst-mines/t/) | Travailleurs | 51 pages vulgarisées, rangées par problème vécu, plus les articles de loi qui fondent leurs droits |
| 🎓 [`/g/`](https://frankyray21.github.io/wiki-sst-mines/g/) | Superviseurs, gestionnaires, direction | Portail en tableau de bord : entrée par rôle, par situation à gérer, ou par thème |
| 📚 [`/w/`](https://frankyray21.github.io/wiki-sst-mines/) | Conseiller SST, recherche documentaire | Les 4 577 pages classées par discipline |

La répartition est automatique, à partir du frontmatter du vault : `publication-travailleur`,
`publication-gestionnaire` et `public-cible`, avec veto sur `niveau-sensibilité` (interne ou ≥ 2).
**Une page n'entre jamais dans le wiki des travailleurs sans autorisation explicite.**
Le Recueil législatif n'est pas dupliqué : le texte de loi est public et identique pour tous.

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
node tools/verif_liens.mjs        # t, g et w — ou passer t / g / w en argument

# Prévisualiser en local
node tools/serve.mjs
# → http://localhost:8090
```

## Fonctionnalités

- **Recherche** instantanée sur les 4 577 articles : numéros d'article (`art 4 RSST`, `RSST 51`), tolérance aux pluriels et aux accents, filtres par wiki, pagination, suggestion en cas de zéro résultat
- **Wikilinks Obsidian** résolus, y compris les variantes (chiffres romains/arabes, zéros de tête) ; liens rouges pour les pages réellement absentes du vault
- Callouts, **infobox** générée depuis le frontmatter YAML (réparé automatiquement s'il est invalide), sommaires, backlinks
- **Recueil législatif** : tri naturel des articles (art-1, art-2, art-10…), sommaire par règlement, index par loi
- Captures officielles des articles de loi + PDF sources, images cliquables pour agrandir
- **Mobile** : aucun débordement horizontal, cibles tactiles de 44 px, bouton de retour en haut
- **Catégories** : une page par mot-clé du frontmatter porté par au moins 5 pages, tous domaines confondus
- **Thème clair / sombre / automatique** : bouton dans l'en-tête, choix mémorisé. Les captures d'articles
  de loi (texte noir sur blanc) sont détectées à la construction et **inversées** en thème sombre, pour
  ne pas laisser un rectangle éblouissant au milieu de la page. L'impression reste toujours en clair.

## Notes de maintenance

- Le générateur relit tout le vault à chaque exécution (~80 s) et réécrit `docs/` en entier.
- Les images sont cherchées dans le vault **et** dans les dossiers listés par `EXTRA_ASSET_ROOTS` (`Notes de cours SST`, `SST/Images`, `Obsidian Vault/Images`). Ne pas déplacer le dossier « Images wiki » du vault.
- Le build signale les frontmatters YAML illisibles : les corriger dans Obsidian améliore les infobox.
