# Faire passer une page d'ébauche à presque final

> Méthode déduite de ton propre corpus (analyse du 29 août 2026), puis passée au crible
> d'un vérificateur qui a invalidé plusieurs constats. Ne restent ici que les faits vérifiés.

---

Racine du vault : `C:\Users\Frank\OneDrive\Documents\SST\🏠 WIKI SST - Mines` — tous les chemins ci-dessous partent de là. Générateur : `C:\Users\Frank\Claude code\Wiki_SST_Site\tools\build_site.mjs`.

## Ce qui sépare vraiment une de tes ébauches d'une de tes bonnes pages

Ce n'est **pas ton écriture**. Mesure faite sur la prose seule, hors tableaux et listes : 15,8 mots par phrase dans tes pages notées bonnes, 17,6 dans tes ébauches. 1,8 mot d'écart. Ton style est déjà homogène et sobre partout. Arrête de croire que « améliorer la qualité » veut dire réécrire.

Ce qui manque dans une ébauche, c'est **la matière et l'ancrage**. Quatre choses, vérifiables en 30 secondes sur n'importe quelle page :

1. **Un tableau qui décide.** `Wiki Toxicologie\20 - Articles internes\Substances dangereuses\Asphyxiants.md` : un tableau % O₂ → effets, un tableau gaz / source minière / mesure clé. `Wiki Ergonomie\20 - Articles internes\Contraintes\Vibrations.md` : tableaux de seuils 2,5 et 5,0 m/s², plus deux tableaux poste/outil. En face, `Wiki Toxicologie\20 - Articles internes\Surveillance biologique des métaux en mine.md` : deux paragraphes, aucun tableau. C'est bien écrit, et ça n'aide personne à décider.
2. **Une valeur chiffrée avec son unité et sa source.** Asphyxiants donne VEMP 35 ppm, VECD 200 ppm. `Wiki Hygiène industrielle\20 - Articles internes\Substances dangereuses\Amiante.md` explique même l'unité après le tableau. Tes ébauches donnent des chiffres nus ou pas de chiffres : `Wiki Ergonomie\25 - Articles travailleurs\Manutention.md` avance « 56 % des TMS » et « 88 jours » sans source, alors que sa jumelle `Manutention manuelle.md` (1142 mots, complet/bonne) contient la matière.
3. **Un ancrage légal.** Sur tes 62 fiches travailleurs, **59 ne contiennent pas un seul `[[art-…]]`**. `Wiki Sécurité industrielle\25 - Articles travailleurs\Risques mécaniques\Cadenassage.md` a un excellent contenu terrain — 4 étapes, 8 formes d'énergie, la règle du cadenas personnel — et **zéro wikilink dans toute la page**. À côté, `Wiki Droit du travail\25 - Articles travailleurs\Accidents et lésions\Droit de refus.md` cite les articles 12 à 31 LSST et lie vers `[[LSST]]`, `[[CNESST, rôles et pouvoirs]]`, `[[TAT]]`. C'est la seule vraie différence entre les deux.
4. **Un poste minier nommé.** Foreur jumbo, boulonneur, opérateur de scoop, concentrateur, souterrain vs surface. Tes bonnes pages en nomment ; tes ébauches parlent de « travailleurs exposés ».

Et un cinquième écart, qui n'est même pas dans les pages : **ta meilleure matière n'est pas publiée.** Le dossier `20 - Articles internes` contient 50 pages complet/bonne, **dont zéro publiée** — ni travailleurs, ni encadrement. `Wiki Hygiène industrielle\20 - Articles internes\Environnement de travail\Bruit.md` (1070 mots, tableaux d'unités, art. 130 à 141 RSST, niveaux typiques par poste minier) porte `publication-travailleur: non` et `publication-gestionnaire: non`. Pendant ce temps sa jumelle `25 - Articles travailleurs\Environnement de travail\Bruit.md` (492 mots, ébauche) est en ligne. Hors Recueil, ce que le public voit, c'est 186 pages dont **3 seulement** en complet/bonne.

## Le plan type d'une page aboutie, chez toi

Tes conventions (`Wiki Ergonomie\99 - Templates\Conventions du wiki.md`) sont bonnes et déjà à jour : `### Application terrain` en H3, `### Ressources` qui fusionne « Documents et outils » et « Pour aller plus loin ». Garde-les. Le plan ci-dessous est celui de tes meilleures pages, pas un modèle importé.

**Variante A — article thématique interne** (modèles : Vibrations.md, Amiante.md, `Wiki Hygiène industrielle\20 - Articles internes\Prévention et programmes\Démarche AREC.md`)

1. H1 = le nom du concept.
2. Chapeau de 3-4 phrases, sans titre : ce que c'est, pourquoi ça compte, ce que ça change **en mine**, et au moins un chiffre ou un renvoi légal. Modèle : « L'amiante est une fibre minérale naturelle cancérogène (CIRC 1, C1 RSST, A1 ACGIH). Sa vente est interdite au Canada depuis le 30 décembre 2018, mais le risque demeure… »
3. Table des matières en liste numérotée.
4. `### Définition` — la définition d'autorité en bloc-quote quand elle existe (AREC cite l'AIHT mot à mot).
5. 4 à 10 sections H3. **Règle dure : une section de fond sans tableau, sans image légendée et sans chiffre est à fusionner ou à retravailler.**
6. `### Application terrain` — vise 150 à 200 mots, en trois blocs : un tableau configuration minière / risque, une liste de leviers propres au secteur, un paragraphe souterrain vs surface.
7. `### Ressources` — tableau Document / Type / Source, puis la liste **Articles wiki connexes**.
8. Pied de page `[[00 - 🏠 Accueil|← Accueil]]`.

**Variante B — fiche travailleur** (modèle : Droit de refus.md)

1. H1 formulé de son point de vue (« Mon droit de refus en mine »), pas « Droit de refus ».
2. Chapeau court + un encadré `> **En une phrase** : …`.
3. `## À quoi sert cette page`.
4. 3 à 5 sections dont **le titre dit quelque chose** : « Quand tu peux refuser », « Quand le droit ne s'applique pas », « Les étapes, dans l'ordre », « Ce que la mine peut compliquer ». Compare avec des titres comme « Contenu principal » : le même contenu, la moitié de l'effet.
5. `## À éviter` en tableau deux colonnes À éviter | Pourquoi.
6. `## À qui en parler`, puis `## Pour aller plus loin` (l'exception écrite dans tes conventions pour les fiches travailleur), avec le lien vers la jumelle interne.
7. Pied de page.

**Variante C — page encadrement** (modèles : `Wiki Toxicologie\27 - Articles gestionnaires\Priorisation et substitution chimique.md`, `Wiki Droit du travail\27 - Articles gestionnaires\Conformité et inspection\Mécanismes LMRSST.md`) — tout en H3 : chapeau de cadrage → `### Pourquoi en parler` → `### Options et leviers` (tableau **Option | Considérations**, jamais « Recommandation », la moins coûteuse en premier) → `### Indicateurs à suivre` → `### Arbitrages typiques` → `### Cadre légal` (article en gras + wikilink + une ligne de ce que ça oblige) → `### Limites du rôle SST`.

## La méthode, page par page

Compte 20 à 40 minutes. Dans cet ordre — et tu arrêtes quand le temps est écoulé, pas quand c'est parfait.

1. **Ouvre la jumelle d'abord.** Le champ `version-jumelle` du frontmatter te donne la cible. Tu ne pars jamais de zéro : la matière est dans l'article interne.
2. **Ouvre la page-modèle du même type** (A, B ou C ci-dessus) dans un deuxième onglet. Tu recopies la charpente, jamais le contenu.
3. **Regarde la dernière ligne du fichier.** Si elle se termine sur un `[[` non fermé, referme-la maintenant — c'est le défaut n°1 du vault.
4. **Écris ou corrige le chapeau** : 3-4 phrases, dont une qui nomme la mine. C'est le seul moment où tu rédiges vraiment.
5. **Ajoute un tableau** en réorganisant du texte déjà présent. Aucune information nouvelle n'est nécessaire pour transformer trois paragraphes en tableau.
6. **Vérifie les chiffres.** Chaque valeur limite doit avoir son unité et sa source sous les yeux. **Si tu n'as pas la source, tu enlèves le chiffre — tu ne le complètes pas de mémoire.**
7. **Ajoute le renvoi légal**, pris dans le Recueil, en copiant le lien depuis la jumelle interne. **Si l'article n'est pas déjà nommé dans la jumelle, tu n'en ajoutes pas.**
8. **Ferme la page** : `### Ressources` (ou `## Pour aller plus loin` côté travailleur), les Articles wiki connexes, le pied de page.
9. **Change le statut en dernier**, seulement si 4 à 8 sont faits.
10. **Ne relis pas le style.** Il est déjà bon.

## Par où commencer

**Ce soir — réparations, aucun contenu à écrire (5 min chacune).** Ces fichiers sont coupés en plein wikilink ; le site affiche du `[[` brut :
`Recueil législatif SST\10 - Lois principales\LSST\LSST.md` (2374 pages la citent — la plus grosse), `…\LNT\LNT.md`, `Wiki SST psychosociale\20 - Articles\Législation et Normes\LMRSST, vue d'ensemble pour les RPS.md` (65 citations), `Wiki Hygiène industrielle\27 - Articles gestionnaires\Programmes de prévention\Silice cristalline.md` (51), `Wiki Hygiène industrielle\20 - Articles internes\Prévention et programmes\Hiérarchie des moyens de prévention.md` (48), `Wiki SST psychosociale\20 - Articles\Facteurs Organisationnels\Soutien social au travail.md` (49), `Wiki Hygiène industrielle\10 - Thèmes\Agresseurs chimiques.md` (30), `Wiki SST psychosociale\20 - Articles\Gestion et Prévention\Démarche de prévention en RPS, étapes.md` (27), `Wiki Droit du travail\20 - Articles internes\Notions LATMP.md`. Au total 111 fichiers sont dans ce cas, dont 49 marqués « complet ».

**Séance 2 — publier ce qui est déjà fini (30 min, zéro rédaction).** Passe `publication-gestionnaire: oui` sur les articles internes complet/bonne qui n'ont rien de confidentiel : Bruit, Vibrations, Asphyxiants, Amiante, Hiérarchie des moyens de prévention, Démarche AREC, Notions LATMP. Sept bascules multiplient par plus de deux ce que l'encadrement voit d'abouti.

**Séance 3 — re-noter, pas réécrire (2 h).** 30 de tes 37 fiches `27 - Articles gestionnaires` portent déjà les 5 sections du gabarit ; 28 sont pourtant en `ébauche`. Ouvre, vérifie les sections et le pied de page, passe en `complet`. Même geste sur `Recueil législatif SST\30 - Organismes et tribunaux\IRSST.md` et `40 - Concepts juridiques transverses\EPI.md`, marquées `en-cours` alors qu'elles sont finies.

**Ensuite seulement — les 5 vraies rédactions**, toutes côté travailleurs, parce que c'est le public qui prend le risque physique et le moins outillé pour compenser :
`Wiki Sécurité industrielle\25 - Articles travailleurs\Risques mécaniques\Cadenassage.md`, `Wiki Ergonomie\25 - Articles travailleurs\Manutention.md`, `Wiki Hygiène industrielle\25 - Articles travailleurs\Espaces clos.md`, `Wiki Ergonomie\25 - Articles travailleurs\Postures.md`, et trancher le doublon `Reconnaître une exposition.md` (il existe en Hygiène et en Toxicologie, 2373 et 2363 mots, quasi identiques) avant d'en finir une.

## Ce que je peux automatiser pour t'aider

Tout ça se branche sur `tools/qualite.mjs` et `build_site.mjs`, sans jamais générer de contenu SST.

- **Bloquer le build sur les fichiers coupés.** La détection existe déjà (`estTronque`, lignes 7-13) et voit 103 pages ; il manque un `process.exit(1)`. Une ligne.
- **Trois correctifs de publication, ~30 lignes.** (a) Exclure `/99 - Templates/` : tes 12 gabarits vides portent un frontmatter d'exemple `publication-travailleur: oui` et **apparaîtront dans les wikis publics à la prochaine construction**. (b) Exclure `Recueil législatif SST\_À supprimer (vérifier puis effacer)\` — il est publié aujourd'hui. (c) Faire bloquer `à-réviser`, `gestionnaire-a-valider`, `gestionnaire-a-reformuler`, `source-travailleur` : 65 pages que tu avais signalées non relues sont en ligne parce que seul le mot exact `non` bloque.
- **Dédupliquer les pages des wikis publics.** Ton wiki travailleur affiche 5 « Démarrage rapide », 3 « Chaleur », 2 « Vibrations », 2 « Espaces clos ». La logique de préférence existe déjà (`Map meilleure`) mais ne sert qu'au portail. Le wiki travailleur perd un tiers de son bruit sans qu'une ligne soit écrite.
- **Un tableau de bord utile.** Retirer `phrases-longues` (616 signalements, 92 % de faux positifs : le découpage compte une page de loi entière comme une phrase). Ajouter : sections vides (260 dans 149 pages) **et sections squelettiques** (440, invisibles aujourd'hui), restes de gabarit (`NomCourt`, `XXX`, `{{`), liens morts avec décompte par cible (797 sur le site, concentrés dans 5 pages de navigation), et « statut contredit » — page en ébauche qui coche tout le gabarit.
- **Ce que ça ne mesure pas** : la justesse d'une valeur limite, la pertinence d'un article de loi, la vérité d'un énoncé. Aucun outil ne validera jamais ton fond. Il te dit seulement où regarder.
- **Un seul chiffre en haut du rapport**, articles de loi comptés à part, avec l'écart depuis le mois passé. Et un lien vers `qualite.html` dans la barre latérale : aujourd'hui la page existe mais n'est liée de nulle part.

## Ce qu'il ne faut PAS faire

- **Ne me laisse jamais compléter une valeur limite, un seuil, un article de loi ou une consigne.** Je peux proposer des gabarits, des critères, du code. Pas du contenu SST. Un `[!abstract]` généré automatiquement à partir de ton texte, oui ; inventé, jamais.
- **Ne remplace pas les puces « (à créer) » de tes 7 hubs par des articles de loi.** Choisir quel article fonde quelle règle, c'est du contenu. Retire les puces mortes, laisse le hub à 3 entrées vraies. Un sommaire de 3 entrées valides vaut mieux qu'un de 12 dont 9 sont mortes.
- **N'écris pas les 180 stubs automatiques.** `publish: false` scripté, c'est réversible et ça fait 100 % du bénéfice visible. Supprime seulement `concept 1/2/3`, `Source 1/2` et le dossier `_À supprimer`.
- **Ne touche pas au format du wiki psychosociale.** Ses conventions disent noir sur blanc que les 113 articles de `20 - Articles/` ne sont pas à modifier, décision confirmée. Ce n'est pas une dérive, c'est une exception assumée.
- **Ne lance pas de chercher-remplacer des tirets longs sur les 561 fichiers.** Beaucoup sont des citations de texte officiel. Cosmétique, gain nul pour le lecteur, risque réel.
- **N'empile pas une quatrième échelle de statut.** Tu en as déjà trois qui se contredisent (13 graphies de `statut`, et 3 des 4 valeurs de `qualité` déclarées dans tes conventions n'existent nulle part). Choisis-en une, écris-la dans `Conventions du wiki.md`, normalise par script — et supprime le champ `qualité`, redondant. En attendant, retire `statut`, `qualité` et `niveau-sensibilité` de l'infobox : le lecteur n'a pas besoin de lire « Statut : ébauche » avant ton contenu.
- **Ne relis pas ton style.** Tant que la page n'a pas son tableau, son chiffre sourcé et son poste minier, chaque minute passée sur une phrase est une minute perdue.