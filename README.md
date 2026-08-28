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

## Structure

- `docs/` — le site statique généré (HTML pur, aucune dépendance serveur) — c'est ce dossier que GitHub Pages publie
- `tools/build_site.mjs` — générateur : markdown Obsidian → HTML type Wikipédia
- `tools/png_palette.mjs` — recompression PNG sans perte (palette 8 bits, zlib natif)
- `tools/serve.mjs` — serveur local de prévisualisation (port 8090)

## Utilisation

```bash
# Regénérer le site depuis le vault Obsidian
node tools/build_site.mjs

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

## Notes de maintenance

- Le générateur relit tout le vault à chaque exécution (~80 s) et réécrit `docs/` en entier.
- Les images sont cherchées dans le vault **et** dans les dossiers listés par `EXTRA_ASSET_ROOTS` (`Notes de cours SST`, `SST/Images`, `Obsidian Vault/Images`). Ne pas déplacer le dossier « Images wiki » du vault.
- Le build signale les frontmatters YAML illisibles : les corriger dans Obsidian améliore les infobox.
