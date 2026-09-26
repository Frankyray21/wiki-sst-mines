# Liens lisibles dans les phrases — 26 septembre 2026

Demande : un lien écrit dans une phrase affichait le titre de la page visée au lieu du mot écrit. Exemples relevés le
25 septembre : « Aviser la CNESST, rôles et pouvoirs que… » (Réclamation CNESST), « Programme de prévention silice
cristalline respirable » et « Forage, sautage, concassage, Manutention (hub) » (Aérosols), et « Confinement », sur
la page Aérosols, qui menait à la note psychosociale « Confinement, profondeur et charge mentale ».

Le vault n'est pas accessible d'ici : les nombres viennent du site publié (`docs/w`, 3 978 pages). Le nom de fichier
tapé dans la note se retrouve dans l'index de recherche, qui le garde quand il diffère du titre.

## Trois causes

| Cause | Liens | Où se corrige |
| --- | --- | --- |
| Le générateur remplaçait le mot saisi par le titre de la page : `[[Silice cristalline]]` affichait « Programme de prévention silice cristalline » | 485 liens dans des phrases, sur 198 pages | Générateur (fait) |
| Le texte du vault porte lui-même le nom long, trace d'un renommage de note ou d'une réécriture des liens : la note dit `Aviser la [[CNESST, rôles et pouvoirs]] que…` | 553 liens, 236 pages, 44 noms | Vault (outil prêt, table à valider) |
| « Confinement » : même réécriture, qui a envoyé des liens d'hygiène, de toxicologie et de sécurité vers la note psychosociale | 8 liens, 8 pages | Vault (même outil) |

Pour la première cause, 4 233 liens affichaient le titre à la place du nom de fichier tapé. Le titre reste là où il
renseigne mieux : 1 448 liens vers des articles de loi (`art-59-LATMP`) et autres noms de code, 1 624 citations de
notes d'analyse (`Analyse Karasek (1979)`), 628 liens dans une liste de liens ou seuls dans une cellule de tableau
(colonne « Article » d'un index). Restent les 485 liens de phrases qui changeront. Pour 48 liens, le nom tapé n'a pas
pu être retrouvé.

Pages de l'exemple : sur Réclamation CNESST, les trois « CNESST, rôles et pouvoirs » viennent du texte de la note
(cause 2), pas du générateur. Sur Aérosols, « Silice cristalline », « Surveillance biologique », « Métaux » et « APR »
relèvent de la cause 1 ; « Manutention (hub) » et « Confinement » de la cause 2.

## Règle du générateur (`tools/libelle_lien.mjs`)

- Dans une phrase, le mot saisi s'affiche, avec sa casse. C'est aussi ce qu'affiche Obsidian.
- Le titre descriptif s'affiche à la place :
  - pour un nom de code : article de loi (`art-59-LATMP` devient « art-59-LATMP : salaire de la journée de la
    lésion »), forme technique (`charge-mentale`), identifiant (`INDEX_NOTES_WIKI`), note numérotée
    (`50 - Jurisprudence marquante`) ;
  - pour une note d'analyse d'étude (`Analyse Karasek (1979)`, citée « Karasek (1979) - Modèle Demandes-Contrôle
    (DC) ») ;
  - sur une ligne faite seulement de liens (« Voir aussi : [[A]], [[B]] », puce, titre) et dans une cellule de
    tableau qui ne contient que le lien ;
  - quand le mot saisi ne diffère du titre que par la ponctuation (un nom de fichier ne peut pas porter « / »).
- Un lien passé par un alias garde le mot saisi, comme avant.

**À trancher** : les notes d'analyse gardent leur titre bibliographique, comme avant (1 624 liens inchangés). Deux
autres choix sont possibles : le mot saisi (« Analyse Karasek (1979) »), ou l'auteur et l'année seuls (« Karasek
(1979) »). Le changement tient en une ligne de `libelleLien`.

## « Confinement »

Aucune page ne s'appelle « Confinement ». Sur cinq pages, le lien du vault porte le nom de la note psychosociale
écrit en entier : `[[Confinement, profondeur et charge mentale]], EPI, dépressurisation` sur Amiante, en hygiène comme
en toxicologie. Sur trois autres (Aérosols, art. 296.1 et art. 1 du RSST), il s'affiche « Confinement » : écrit avec
ce texte, ou résolu par un alias (voir plus bas). Ces liens ont été réécrits d'un coup vers la note psychosociale,
sans égard au sens, par un renommage de note ou une réécriture automatique des liens. Ils parlaient pourtant du
confinement d'une source : amiante, contrôle des risques chimiques, espaces clos. Le générateur ne peut pas deviner
le sens d'un lien écrit en entier. La correction se fait donc dans le vault : hors du wiki psychosocial, le lien
disparaît et le mot « Confinement » reste.

Si la note psychosociale porte aussi l'alias « Confinement », le générateur le dira à la prochaine construction, dans
la liste « ⚠ Liens vers un autre wiki par un alias ». L'outil couvre aussi ce cas (`[[Confinement]]`).

Dans le wiki psychosocial, trois liens vers cette note viennent d'un autre mot, « charge mentale » : « Outils
d'évaluation de la Confinement, profondeur et charge mentale (NASA-TLX) ». Ils sont listés « à trancher », sans
correction automatique.

## Résolution des liens : le nom de fichier d'abord

Quand plusieurs pages répondent au mot saisi et qu'aucune n'est dans le wiki de la page, le nom de fichier l'emporte
désormais sur l'alias d'une autre page, comme dans Obsidian, qui n'ouvre un lien que par le nom de fichier. Avant, la
page au chemin le plus court était prise, même si elle ne répondait que par un alias. Dans son propre wiki, un alias
garde la priorité. Le site publié ne dit pas quels liens passent par un alias : le nombre de liens concernés se verra
à la construction.

En fin de construction, la liste « ⚠ Liens vers un autre wiki par un alias » donne chaque mot qui mène, par l'alias
d'une page, à un autre wiki thématique, avec les notes qui l'écrivent. Beaucoup sont justes (un modèle de
psychosociale cité en ergonomie). Il suffit de la parcourir une fois pour repérer un mot courant pris dans un autre
sens, comme « Confinement ».

## À faire là où est le vault

```
node tools/raccourcir_liens.mjs              # essai : chaque ligne changée est affichée, rien n'est écrit
node tools/raccourcir_liens.mjs --appliquer  # après relecture ; sauvegarde dans sauvegarde-vault/<date>-libelles-courts/
node tools/build_site.mjs
node tools/verif_site.mjs
node tools/verif_liens.mjs
npm --prefix tools test
```

La table `content-updates/2026-09-26-libelles-courts.json` ne retient que les cas sûrs :

- CNESST (118 liens) ;
- LMRSST (27) ;
- Foreur (12), Aide-foreur (5), Opérateur d'équipement lourd (5) ;
- les notes « (hub) » du Recueil (Manutention, Bruit, Solvants, Amiante, Espaces clos…) ;
- « Confinement » hors du wiki psychosocial.

Environ 180 liens en tout. Seules les phrases sont touchées : une liste de liens garde le nom complet, et un lien
qui a déjà son texte ne bouge pas. Les notes du Recueil ne sont pas touchées, sauf avec `--recueil`.

Douze noms restent à trancher, avec la raison (même fichier, rubrique `aTrancher`). Le mot d'origine y est inconnu,
ou il y en avait plusieurs : « Copenhagen MBI, épuisement professionnel Inventory » était « Copenhagen Burnout
Inventory », alors qu'ailleurs le mot était « MBI ». Pour les garder, ajouter l'entrée à `raccourcir` avec le texte
court voulu, puis relancer l'essai.

Après la reconstruction, relire :

- Réclamation CNESST (« Aviser la CNESST que… ») ;
- Aérosols (« Silice cristalline respirable », « Surveillance biologique pertinente », « Manutention »,
  « Confinement et arrosage des piles de minerai », sans lien) ;
- Solvants ;
- une page d'articles (les liens `art-…` gardent leur titre) ;
- une page avec « Voir aussi ».

## Vérifications faites ici

- Tests : `libelle-lien` (règle, contexte de cellule, choix du nom de fichier sur un index réel de `resolvePage`) et
  `raccourcir-liens` (phrase, tableau, liste de liens, bloc de code, en-tête, second passage sans effet,
  « Confinement » hors du wiki psychosocial).
- `node --check tools/build_site.mjs`.
- Le site n'est pas reconstruit (vault absent) : `docs/` est inchangé.
