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

## Structure

- `docs/` — le site statique généré (HTML pur, aucune dépendance serveur)
- `tools/build_site.mjs` — générateur : markdown Obsidian → HTML type Wikipédia
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

- Recherche instantanée (titres, tags, contenu) sur les 4 577 articles
- Wikilinks Obsidian résolus, liens rouges pour les pages manquantes
- Callouts, infobox générées depuis le frontmatter YAML, sommaires automatiques
- Pages de catégories par dossier, index alphabétiques, backlinks (« Pages qui pointent ici »)
- Captures officielles des articles de loi + PDF sources intégrés
