# « Lire le schéma en texte » retiré des schémas — 26 septembre 2026

Demande de Frank : « Retire section lire schéma en texte ».

## Ce qui change sur le site

La section dépliable « Lire le schéma en texte », sous chaque schéma, est retirée partout :
- **127 schémas** sur **65 pages**, pages et copies encadrement (g/) ;
- wikis concernés : SST psychosociale, ergonomie, hygiène, sécurité, toxicologie et droit du travail.

Chaque schéma garde :
- l'image, et « Toucher l'image pour l'agrandir » ;
- son texte alternatif ;
- sa légende ;
- ses sources.

Le texte des articles ne change pas.

**Non touchées** : les cinq infographies plus anciennes dont la version texte porte un autre titre (« Lire la
version texte — … », « Lire les voies en texte »). Ce sont Bruit, Silice cristalline, Vibrations, Manutention
manuelle et Voies d'exposition, soit 8 pages avec les copies encadrement. Elles peuvent suivre le même chemin sur
demande.

**Accessibilité** : un lecteur d'écran lit le texte alternatif du schéma, plus court que l'ancienne version texte.

## À faire dans le vault (sinon la prochaine construction remet des blocs dans les notes)

```
Get-ChildItem content-updates\*-schemas.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
node tools/build_site.mjs
```

La boucle rejoue les **40 lots de schémas**, du 25 et du 26 septembre. Chacun a été réécrit sous le même nom :
- **blocs** : ils n'ont plus de version texte. Une note qui n'a pas encore reçu un schéma le reçoit donc sans elle ;
- **nouvelle retouche `retirerVersionTexte`**, une par schéma : dans une note qui a déjà reçu le bloc, elle retire
  les lignes `<details class="infographie-texte">` … `</details>` dont le résumé est exactement « Lire le schéma
  en texte ». Rien d'autre du bloc ni de la note n'est touché. Une sauvegarde est faite, comme pour toute
  retouche.

Rejouer un lot déjà passé est sans effet : chaque retouche répond « déjà faite ».

**Garde du générateur** : `build_site.mjs` ne publie plus ce bloc, même si une note le garde encore. Le site reste
donc sans cette section, même si le vault n'a pas été repris. La boucle ci-dessus reste utile pour nettoyer les
notes dans Obsidian.

**Effet de bord utile** : le lot « Premiers signes en mine » échouait sur une note neuve. Les puces de sa version
texte répétaient les titres qui servent d'ancres (« Performance et travail »…), ce qui rendait ces ancres
ambiguës. Il passe désormais.

## Outils

- `tools/version_texte_schema.mjs` : règle commune, appliquée à la page publiée et au rendu du générateur.
- `tools/poser_schemas.mjs` :
  - les blocs posés, dans la page comme dans la note, n'ont plus de version texte ; un champ `puces` de la spec
    est ignoré ;
  - chaque lot se termine par les retouches `retirerVersionTexte`.
- `tools/retouches.mjs` : le type `retirerVersionTexte`. Il refuse, sans rien écrire, un schéma absent de la note,
  ambigu ou dont la version texte n'a pas de fin.
- `tools/verif_site.mjs` : plus aucune page avec « Lire le schéma en texte ».
- `tools/schemas-sombres/lot10.py` : la spec ne porte plus de puces. La description du SVG (`<desc>`) est
  inchangée, et les douze SVG sont identiques octet pour octet.

## Vérifications

- Pages : seules ont disparu les 127 versions texte des schémas. Chaque bloc donne maintenant « légende, puis
  sources », exactement ce que le générateur (marked, réglages du site) rend depuis le nouveau bloc de note.
- Lot 10 reposé avec l'outil : pages et lots identiques, octet pour octet.
- Lots : hors des blocs et des retouches ajoutées, les 40 lots sont identiques à ceux d'avant.
- Simulation sur des notes qui avaient reçu les anciens blocs (39 lots) : 74 versions texte retirées. Chaque
  note devient identique à une note neuve qui reçoit le lot, et un second passage est sans effet.
- Espaces clos, le 40e lot : même contrôle avec le vrai outil, sur la note reconstituée de son test. 5 versions
  texte sont retirées, la sauvegarde est faite, puis « Rien à changer ».
- Tests : 292 réussis sur 293. Le seul échec, `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur), `verif_rendu`, `verif_publication` ; manifeste hors ligne régénéré.
