# Versions texte dépliables retirées (schémas, infographies, illustrations) — 26 septembre 2026

Demandes de Frank :
- « Retire section lire schéma en texte » ;
- puis, pour les autres sections du même genre : « Oui retire aussi les autres ».

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

**Les autres sections suivent** (seconde demande) : **16 sections** de plus, sur **10 pages** :
- **« Lire la version texte — … » et « Lire les voies en texte »**, sous cinq infographies plus anciennes : Bruit,
  Silice cristalline, Vibrations, Manutention manuelle et Voies d'exposition. Cela fait 8 sections, copies
  encadrement comprises ;
- **« Lire l’illustration en texte »**, sous les quatre illustrations de « Définition et typologie des conflits au
  travail ». Cela fait 8 sections, avec la copie encadrement. Chaque illustration garde sa légende, ses repères et la
  mention « Illustration pédagogique créée avec l’aide de l’IA ».

Il n'en reste aucune sur le site. Les seuls `<details>` encore publiés sont « Pages qui pointent ici » et les volets
des pages d'accueil.

**Accessibilité** : un lecteur d'écran lit le texte alternatif de l'image, plus court que l'ancienne version
texte.

**À trancher — Voies d'exposition** : la voie **injection** (« pénétration à travers la peau, par exemple lors d'une
piqûre contaminée ») n'était décrite que dans « Lire les voies en texte ». Le schéma montre trois voies, et sa
légende dit qu'il ne les représente pas toutes. La page ne nomme plus l'injection. Elle peut revenir en une phrase
dans la légende ou dans le texte de la note.

## À faire dans le vault

```
Get-ChildItem content-updates\*-schemas.json | ForEach-Object { node tools/appliquer_retouches.mjs --lot $_.FullName --appliquer }
node tools/retirer_versions_texte.mjs
node tools/retirer_versions_texte.mjs --appliquer
node tools/build_site.mjs
```

`retirer_versions_texte.mjs` nettoie toutes les notes du vault, hors archives. Il retire chaque version texte
dépliable, schémas compris, quel que soit le lot qui l'a posée : lot de schémas, lot « note entière » du 6 ou du
9 septembre, ou ajout à la main (« Bruit »). Il fonctionne ainsi :
- **sans `--appliquer`** : il liste les notes concernées, sans rien écrire ;
- **avec `--appliquer`** : il sauvegarde chaque note dans `sauvegarde-vault/<date>-versions-texte/`, puis la
  réécrit ;
- **ce qu'il ne touche pas** : les autres `<details>` d'une note, les fins de ligne (CRLF compris) et une note sans
  version texte ;
- **rejeu** : le relancer est sans effet.

Pour les versions texte, le site en reste de toute façon exempt (garde du générateur ci-dessous) : l'outil ne sert
qu'à nettoyer les notes dans Obsidian. La boucle des 40 lots, elle, reste nécessaire, car elle pose aussi les schémas
que les notes n'ont pas encore reçus. Sans elle, la prochaine construction les retirerait du site.

La boucle rejoue les **40 lots de schémas**, du 25 et du 26 septembre. Chacun a été réécrit sous le même nom :
- **blocs** : ils n'ont plus de version texte. Une note qui n'a pas encore reçu un schéma le reçoit donc sans elle ;
- **nouvelle retouche `retirerVersionTexte`**, une par schéma : dans une note qui a déjà reçu le bloc, elle retire
  les lignes `<details class="infographie-texte">` … `</details>` dont le résumé est exactement « Lire le schéma
  en texte ». Rien d'autre du bloc ni de la note n'est touché. Une sauvegarde est faite, comme pour toute
  retouche.

Rejouer un lot déjà passé est sans effet : chaque retouche répond « déjà faite ».

**Garde du générateur** : `build_site.mjs` retire toute version texte dépliable dès la lecture de chaque note.
Même si une note la garde encore, le site ne la publie pas, la recherche n'indexe pas ses mots et les extraits ne
la reprennent pas.

**Générateur réparé au passage** : depuis le 21 septembre, `node tools/build_site.mjs` s'arrêtait au démarrage,
avant de rendre la moindre page, sur « Cannot access 'estEtude' before initialization ». La fonction est
maintenant déclarée avant son premier appel. C'est vérifié en lançant le vrai générateur, dans une copie
temporaire, sur un petit vault d'essai.

**Effet de bord utile** : le lot « Premiers signes en mine » échouait, sur une note neuve comme sur une note qui
avait reçu sa v1. Les puces de sa version texte répétaient les titres qui servent d'ancres (« Performance et
travail »…), ce qui rendait ces ancres ambiguës. Il passe désormais.

## Outils

- `tools/versions_texte.mjs` (ex-`version_texte_schema.mjs`, élargi à la seconde demande) : règle commune,
  appliquée à la note lue par le générateur (Markdown, LF ou CRLF, encadrés compris), à son rendu HTML, à la page
  publiée et au nettoyage du vault. Elle vise :
  - tout `<details class="infographie-texte">` ;
  - un `<details>` sans classe dont le résumé est « Lire … en texte ».

  Aucun autre `<details>` n'est touché.
- `tools/retirer_versions_texte.mjs` : le nettoyage du vault (essai, `--appliquer`, sauvegardes).
- `tools/poser_schemas.mjs` :
  - les blocs posés, dans la page comme dans la note, n'ont plus de version texte ; un champ `puces` de la spec
    est ignoré ;
  - chaque lot se termine par les retouches `retirerVersionTexte`.
- `tools/retouches.mjs` : le type `retirerVersionTexte`. Il refuse, sans rien écrire, un schéma absent de la note,
  ambigu ou dont la version texte n'a pas de fin.
- `tools/verif_site.mjs` : plus aucune page avec une version texte dépliable.
- `tools/style.css` : les règles `.infographie-texte`, devenues sans objet, sont retirées. Le focus des liens des
  infographies est gardé.
- `tools/schemas-sombres/lot10.py` : la spec ne porte plus de puces. La description du SVG (`<desc>`) est
  inchangée, et les douze SVG sont identiques octet pour octet.

## Vérifications

- Pages : seules ont disparu les 127 versions texte des schémas. Chaque bloc donne maintenant « légende, puis
  sources », exactement ce que le générateur (marked, réglages du site) rend depuis le nouveau bloc de note.
- Lot 10 reposé avec l'outil : pages et lots identiques, octet pour octet.
- Lots : hors des blocs et des retouches ajoutées, les 40 lots sont identiques à ceux d'avant.
- Simulation sur des notes qui avaient reçu les anciens blocs : 68 versions texte retirées sur 38 lots. Chaque
  note devient identique à une note neuve qui reçoit le lot, et un second passage est sans effet. Pour Premiers
  signes, l'ancien lot n'a pu passer sur aucune note : la version texte de la v1 part avec `remplacerBloc`, et les
  six `retirerVersionTexte` répondent « déjà faite ».
- Relecture contradictoire : toutes les versions historiques de chaque lot, rejouées dans l'ordre puis suivies du
  lot actuel (250 enchaînements, en LF et en CRLF), donnent la note d'une note neuve, sans reste de version texte.
- Espaces clos, le 40e lot : même contrôle avec le vrai outil, sur la note reconstituée de son test. 5 versions
  texte sont retirées, la sauvegarde (la note d'avant) est vérifiée, puis « Rien à changer ».
- Seconde demande :
  - les 10 pages sont identiques à celles d'avant, privées des seules 16 sections ;
  - la note des conflits (lot du 9 septembre), nettoyée, donne exactement les légendes publiées ;
  - le vrai générateur, sur un vault d'essai qui porte encore ces sections (note des conflits en CRLF, note Silice
    du 6 septembre), rend des pages sans elles, et l'index de recherche ne contient aucun mot qui leur soit
    propre ;
  - l'outil du vault a été essayé sur un vault d'essai : essai sans écriture, application avec sauvegardes,
    archives et autres `<details>` intacts, second passage sans effet.
- Tests : 296 réussis sur 297. Le seul échec, `textes-loi`, est connu et antérieur.
- `verif_site`, `verif_liens` (0 erreur), `verif_rendu`, `verif_publication` ; manifeste hors ligne régénéré.
