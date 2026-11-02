# Espace travailleurs — 2 novembre 2026

**Demande de Frank.** Une page qui regroupe les pages qui s'adressent aux travailleurs, à remettre aux
travailleurs en arrêt de travail à la suite d'une blessure, avec des questions (choix de réponse, mettre en
ordre, choisir la ou les réponses vraies, vrai ou faux, court développement), reliée à Airtable par un Worker
Cloudflare ; une fois les questions répondues, une attestation de lecture reliée à la liste des noms
d'Airtable, avec le temps de lecture de la page indiqué clairement au moment de soumettre ; la page des
travailleurs ne doit pas mener aux autres pages (encadrement, SST, RH). Puis : dresser la liste complète des
sujets pertinents pour le travailleur, vérifier s'ils existent, et créer les pages manquantes.

## Ce qui a été fait

- **`docs/travailleurs/`** : accueil et 29 lectures, généré par `tools/espace_travailleurs.mjs` (appelé par
  `build_site.mjs`, ou seul). Source : `tools/travailleurs/` (liste `pages.json`, pages écrites `pages/*.md`,
  questions `questions/*.json`, corrections `corrections.json`, script et styles). Format : `FORMAT.md`.
- **192 questions**, 5 à 7 par page, des cinq types demandés. Chaque explication cite la page mot pour mot ;
  `node tools/travailleurs/verifier.mjs` le contrôle sur le texte exact que lit le travailleur.
- **Temps de lecture** : temps actif (page visible, lecteur actif depuis moins de 3 minutes), compté à part
  du temps passé sur les questions ; affiché en continu (pastille ⏱), en grand dans l'encadré « Avant de
  soumettre », dans le bilan, sur le récapitulatif et sur l'attestation, à côté de la lecture estimée
  (180 mots par minute, même base que le site des procédures). Un temps de lecture sous la moitié du temps
  estimé déclenche un rappel, sans bloquer.
- **Attestation** : à 80 % de bonnes réponses aux questions corrigées (les réponses écrites partent au
  conseiller), le travailleur tape les premières lettres de son nom et le **choisit dans la « Liste employé
  (registre formation) »** ; s'il n'y figure pas, il coche « Mon nom n'est pas dans la liste » et l'écrit au
  long (la ligne arrive « À relier »). Il coche « J'atteste avoir lu… » et envoie. L'attestation s'affiche
  (nom, date, temps de lecture, lecture estimée, temps sur les questions, résultat, essais, n° de
  confirmation) et s'imprime ou s'enregistre en PDF. Hors réseau, elle attend sur l'appareil et repart seule.
- **Airtable** : table **Attestations Wiki SST travailleurs (web)** (`tblh6H7GOXZUwgXor`) créée dans la base
  **Formations**, champ **Employé** relié à la Liste employé. Colonnes et statuts : `tools/attestations-worker/README.md`.
- **Cloudflare** : relais `attestations-travailleurs` (`tools/attestations-worker/`) — recherche de nom (8 noms
  au plus) et écriture des attestations, rien d'autre ; employé vérifié par son nom ; une ligne par personne,
  page et jour.

## Un espace fermé, pas un espace protégé

Aucune page de l'espace ne contient de lien vers le portail, l'encadrement `/g/`, les démarrages rapides de la
direction, des RH ou des conseillers SST, la recherche, le graphe, les catégories ou toute autre page du wiki :
les liens vers une page de l'espace sont réécrits, tous les autres deviennent du texte (un test le vérifie sur
chaque attribut `href`/`src` de chaque page générée). L'espace n'a ni la barre latérale ni la recherche du wiki,
ne charge pas `app.js`, est hors du manifeste hors ligne et du service worker du wiki, et une adresse inconnue
sous `travailleurs/` ramène à l'accueil de l'espace. Restent permis : les images (`files/`), quelques sites
publics (CNESST, LégisQuébec, CCHST) ouverts dans un nouvel onglet, les numéros de téléphone.

**Mais GitHub Pages est public** : quelqu'un qui tape une adresse à la main ouvre n'importe quelle page du site,
comme aujourd'hui. Le README le dit déjà : ces parcours ne sont pas un contrôle d'accès. Si des pages ne
doivent vraiment pas être lues par les travailleurs, il faut les retirer de la publication ou héberger le
wiki derrière une authentification (par exemple Cloudflare Access) : c'est une décision d'hébergement.

## Inventaire des sujets à présenter au travailleur

État avant ce chantier : **existe** = une page du wiki s'adresse déjà au travailleur ; **technique** = le sujet
n'existe qu'en page pour les conseillers, la direction ou en fiche de loi ; **absent** = aucune page.

### Après ta blessure : tes démarches et tes droits

| Sujet | Avant | Dans l'espace |
| --- | --- | --- |
| Premières démarches : avertir l'employeur, soins, attestation médicale, réclamation, délais | technique (Réclamation CNESST, Démarche en cas de lésion) | **créée** : `premieres-demarches` |
| Tes droits : par où commencer | existe (Démarrage rapide, travailleur — Droit du travail) | recopiée : `droit-demarrage-rapide` |
| La réclamation à la CNESST | technique, recommandée aux travailleurs par leur démarrage rapide | recopiée : `reclamation-cnesst` |
| Ton médecin, les rapports médicaux, l'examen par un autre médecin, le BEM | technique (Évaluation médicale et BEM, MQAC, BEM) | **créée** : `ton-medecin-et-le-bem` |
| Ton revenu pendant l'arrêt : les 14 premiers jours, l'IRR, les soins et frais remboursés | technique (IRR) | **créée** : `ton-revenu-pendant-larret` |
| Le calcul de l'IRR | technique, recommandée aux travailleurs | recopiée : `irr-indemnites` |
| Rechute, récidive ou aggravation | technique (Notions de la LATMP) | **créée** : `rechute-recidive-aggravation` |
| Contester une décision : révision (30 jours), Tribunal (60 jours), questions médicales | technique (Recours au TAT, TAT) | **créée** : `contester-une-decision` |
| Protection contre les représailles, plainte dans les 30 jours | technique (Représailles) | **créée** : `tes-protections` |
| Tes droits et tes recours (vue d'ensemble) | thème, catégorie « travailleur » | recopiée : `droits-et-recours` |
| Tes droits et obligations selon les lois | existe (Démarrage rapide du Recueil) | recopiée : `droits-et-obligations-lois` |

### Prendre soin de toi

| Sujet | Avant | Dans l'espace |
| --- | --- | --- |
| Garder le moral pendant l'arrêt : signaux, routine, contact, qui appeler | technique (pages psychosociales pour l'encadrement) | **créée** : `garder-le-moral` |
| Où appeler quand ça ne va pas | existe | recopiée : `ou-appeler` |
| Le programme d'aide aux employés (PAE) | existe | recopiée : `pae` |

### Préparer ton retour au travail

| Sujet | Avant | Dans l'espace |
| --- | --- | --- |
| L'assignation temporaire : conditions, salaire, désaccord | technique (Assignation temporaire, Programme de retour au travail) | **créée** : `assignation-temporaire` |
| Le retour au travail : droit de retour (1 ou 2 ans), retour progressif, garder le contact | technique (pages psychosociales, Réadaptation) | **créée** : `ton-retour-au-travail` |
| Les séquelles : atteinte permanente, limitations, réadaptation, emploi convenable | technique (Droit à la réadaptation, Emploi convenable) | **créée** : `sequelles-et-readaptation` |
| Prévenir une nouvelle blessure : postures, manutention, gestes répétés, vibrations, signaler tôt | technique (notions d'ergonomie ; fiches travailleurs archivées le 12 septembre) | **créée** : `prevenir-une-nouvelle-blessure` |

### Travailler en sécurité au retour

| Sujet | Avant | Dans l'espace |
| --- | --- | --- |
| Tes six obligations (LSST, art. 49) | existe (catégorie « travailleur ») | recopiée : `obligations-du-travailleur` |
| Le droit de refus | existe (Recueil) | recopiée : `droit-de-refus` |
| Le comité SST et le représentant à la prévention | technique ; brouillon travailleur archivé | **créée** : `comite-sst-et-representant` |
| Sécurité, hygiène, produits dangereux, ergonomie : par où commencer | existent (démarrages rapides, travailleur) | recopiées (4) |
| Cadenassage, équipements de protection, presqu'accident, risque électrique | existent | recopiées (4) |

### Sujets pertinents encore sans page pour le travailleur

À décider : ils touchent moins directement un travailleur blessé, ou leur page de fond est à revoir d'abord.

- **Retrait préventif** (travailleuse enceinte ou qui allaite ; exposition à un contaminant) : pages du Recueil
  seulement.
- **Espaces clos, travail en hauteur, bruit, poussières et silice, diesel** : notions techniques ; les fiches
  pour les travailleurs ont été archivées le 12 septembre. Les démarrages rapides de l'espace y donnent accès
  en texte seulement.
- **Analyse sécuritaire de tâche et signalement d'un danger** (hors presqu'accident).
- **Avertissement, suspension, congédiement : ce que l'employeur a le droit de faire** et **sous-traitant,
  autonome ou stagiaire : es-tu couvert ?** : brouillons archivés, sans notion équivalente.
- **Harcèlement psychologique et violence au travail** : pages internes.

## Erreurs relevées dans les pages du wiki

Les rédacteurs des questions et des nouvelles pages ont comparé les pages au texte de loi du dépôt. Aucune
question ne porte sur une affirmation douteuse. Les erreurs des pages **recopiées** dans l'espace sont corrigées
dans la copie remise aux travailleurs (`tools/travailleurs/corrections.json`, chaque correction justifiée par
l'article ; une correction qui ne s'applique plus arrête la construction) ; **elles restent à corriger dans le
vault**, sinon le wiki garde l'erreur.

### Pages recopiées dans l'espace : corrigées dans la copie (37 corrections), à reporter dans le vault

| Page | Erreurs corrigées dans l'espace (fondement) |
| --- | --- |
| Droit de refus | « intégrité physique » sans « ou psychique » (LSST, art. 12) ; avis, convocation du représentant et inspecteur rattachés aux mauvais articles (15, 16, 18-19 et non 14, 15, 16) ; décision de l'inspecteur « liant les parties » alors qu'elle se révise et se conteste (art. 20) ; recours en cas de sanction : plainte à la CNESST dans les 30 jours (art. 227), puis Tribunal (art. 228), avec l'exception de l'exercice abusif (art. 30, al. 2) |
| Démarrage rapide, travailleur (Droit du travail) | délai de la maladie professionnelle : à partir du moment où il est porté à la connaissance du travailleur qu'il en est atteint (LATMP, art. 272) |
| Processus de réclamation CNESST | « IRR rétablies pendant la contestation » de l'assignation (faux : art. 179, al. 4 et 142) ; phrase abîmée « pendant la Droit à la réadaptation » ; « MQAC » au lieu du professionnel de la santé qui a charge (art. 179) ; remise de l'attestation à l'employeur : art. 267 |
| IRR | « art. 44 (remplacé) » ×3 : l'article est en vigueur ; rechute : revenu brut le plus élevé des deux (art. 70) |
| Droits et recours du travailleur | art. 30 LSST classé sous « Retrait préventif » ; « art. 44, indemnité décès (remplacé) » ; art. 25 et 27 classés sous « Présomption » ; « aucune sanction » sans l'exception de l'art. 30, al. 2 |
| Démarrage rapide - Travailleur (Recueil) | droit à l'information et à la formation : art. 10 et 51, 9° (et non 49 et 40) ; retrait préventif de la travailleuse enceinte : LSST, art. 40 et 46 (et non LATMP, art. 40) ; « art. 51.11 » → art. 51, 11° ; obligation manquante « prendre connaissance du programme de prévention » (art. 49, 1°) ; recours au Tribunal sans l'étape de la révision dans les 30 jours (LATMP, art. 358 et 359) ; soins « chez ton médecin de famille » → professionnel de la santé de ton choix (art. 192) |
| Où appeler quand ça ne va pas | urgence : « 9-1-1 ou 8-1-1 » alors que le tableau réserve le 8-1-1 aux cas sans danger immédiat (même page) |
| PAE | le PAE présenté comme ligne de crise, contredit par « Pas un service d'urgence » (même page) |
| Équipements de protection | **barbe : « ou APR autonome »**, dont le masque complet n'est pas étanche sur une barbe (prudence) ; **P100 contre la fumée diesel** sans dire qu'il n'arrête pas les gaz (prudence) ; quatre passages abîmés par des titres de liens ; une phrase coupée retirée |
| Le risque électrique | **« vérifie par essai de démarrage »**, que la page Cadenassage dit insuffisant (prudence, RSST art. 201) ; « basse tension » → très basse tension |
| Signaler un presqu'accident | « Le comit » complété (même page) |

Restent dans ces pages, non corrigés : « validation MQAC » (tableau de Réclamation CNESST) ; « ajuster un Protection
respiratoire (APR) (masque) » (Équipements de protection) ; la mention des zones d'approche « interdite » de la
CSA Z462 (Risque électrique, norme absente du dépôt) ; le « Voir aussi » de Cadenassage, qui renvoie à des articles
du RSST mal numérotés (188.x, 256), retiré de la copie mais présent dans le wiki ; le lien « art-309-RSST » de
Presqu'accident (l'art. 309 porte sur le sauvetage en espace clos).

### Pages techniques du wiki (hors de l'espace) : à corriger dans le vault

- **Recours au TAT** et **TAT** : délai de « 45 jours » ; la loi dit 60 jours (LATMP, art. 359, 359.1). « Conciliation
  (art. 358.3) » : l'article porte sur la révision sur dossier. « Emploi convenable (art. 204) » : l'art. 204 porte
  sur l'examen médical exigé par la CNESST.
- **Organismes du régime SST** : Tribunal limité aux questions « non médicales », alors que l'art. 360 permet de
  le saisir directement après un avis du BEM.
- **Évaluation médicale et BEM**, **BEM**, **Contestation au BEM** : le rapport du médecin ne lie que la CNESST
  (art. 224) ; le BEM est saisi par la CNESST (212.1, 217), pas par l'employeur « via art. 216 » ; le rapport
  complémentaire est une faculté du médecin du travailleur (205.1) ; le délai de 30 jours est celui de l'employeur
  pour transmettre son rapport (212) ; après un avis du BEM, révision ou Tribunal au choix (360) ; contradiction
  interne sur la révision.
- **MQAC** : page tronquée, tableau vide. **Consolidation** : ébauche sans accents ; l'art. 2 ne dit pas qui la
  détermine (c'est le rapport final, art. 203).
- **Démarche en cas de lésion** : « art. 44, indemnité décès (remplacé) » ; l'employeur ne « saisit » pas le BEM ;
  la liste des sujets médicaux oublie les soins et traitements. **Notions de la LATMP** : renversement de la
  présomption rattaché à l'art. 29.
- **Assignation temporaire** et **Programme de retour au travail et assignation** : « médecin qui a charge » au lieu
  du professionnel de la santé ; « salaire complet » sans le cas des heures réduites (art. 180, al. 2 et 5) ;
  « art. 53 » (il vise le travailleur de 60 ans et plus) ; « art. 234 à 247 » (244 à 246 abrogés) ; « PRIT »
  (la loi dit plan individualisé de réadaptation, art. 146).
- **Droit à la réadaptation** : délai de retour compté selon la « taille de l'entreprise » (la loi : travailleurs de
  l'établissement, art. 240) ; « art. 148 » pour les accommodements ; « IRR rétablies pendant la contestation » ;
  « barème des dommages corporels » (préjudice corporel, art. 83-84) ; art. 145 présenté comme un droit.
- **Emploi convenable** : définition confondue avec celle de l'emploi équivalent (art. 2) ; « révision au TAT ».
- **Comité SST et représentant en SST**, **Comité SST**, **Représentant à la prévention** : comité « obligatoire à 20
  travailleurs et plus » (art. 68 : « peut être formé » au-delà de 20) ; « au moins la moitié » rattaché à l'art. 68
  (c'est l'art. 71) ; « minimum 4 membres » introuvable ; représentants « élus » (art. 72) ; représentant
  « obligatoire dès 10 travailleurs » (aucun seuil aux art. 87-88) ; renvois aux art. 78 et 98 erronés.
- **Lignes d'aide et ressources de soutien** et **Où appeler** : numéros différents pour Tel-Aide et Hommes Québec.
- **Travail répétitif** : « ISO 11128-3 » → ISO 11228-3. **Évaluation des risques de TMS** : seuils de l'OCRA
  Checklist douteux. **Vibrations** : « VDV obligatoire si le facteur crête dépasse 9 », à vérifier.
- **Noms de fichiers trompeurs** (texte exact) : `art-253-latmp-registre-accidents-employeur`,
  `art-30-lsst-retrait-preventif`, `art-227-lsst-penalites-infractions`, `art-68-lsst-programme-sante-specifique`,
  `art-358-latmp-audition-tat`, `art-352-latmp-competence-tat`, `art-40-latmp-indemnite-deces`.


## À faire valider par un conseiller

- **Rechute** (`rechute-recidive-aggravation`) : la page applique à la rechute les règles d'avis et de
  réclamation (LATMP, art. 265, 267, 270, 271 : six mois « de la lésion »). C'est une lecture de l'art. 2, que
  la loi n'écrit pas en toutes lettres. Les critères de la jurisprudence (Boisvert, Halco) ne sont pas repris.
- **Assignation temporaire contestée** : la LSST (art. 37 et 37.2) dit que les décisions de la CNESST prennent
  effet immédiatement ; la LATMP (art. 179, al. 4) dit que le travailleur n'est pas tenu de faire le travail
  jusqu'à la décision finale. La page ne donne que la règle de l'art. 179.
- **Médecin et BEM** : la révision de la décision rendue après le BEM est tirée de l'art. 358 (al. 1 et 2) lu
  avec l'art. 358.3.
- **Comité SST** : les règles propres aux établissements miniers ne sont pas claires dans les textes du dépôt ;
  la page reste générale et renvoie à l'employeur ou au syndicat. La LSST du dépôt (à jour au 26 mars 2024)
  parle de « représentant à la prévention » ; la LATMP (art. 170.1) de « représentant en santé et en sécurité ».
- **Numéros d'aide** : deux pages du wiki ne donnent pas les mêmes numéros pour Tel-Aide (1-877-935-1101 ou
  1-877-700-2433) et Hommes Québec (1-877-908-4545 ou 514-355-8300). « Garder le moral » n'a repris que les
  numéros identiques dans les deux pages ; « Où appeler » est recopiée telle quelle.

## Limites connues

- Les questions sont corrigées dans le navigateur : l'attestation atteste une lecture, pas un examen surveillé.
- La recherche de nom est publique, comme celle d'`attestations-procedures` : deux lettres donnent jusqu'à 8
  noms d'employés (rien d'autre) ; la limite de débit freine l'énumération.
- L'environnement de travail ne joint pas `*.workers.dev` : le relais est vérifié par ses tests (fetch simulé)
  et le parcours complet dans Chromium avec un relais simulé, pas contre Airtable réel.
- Les pages recopiées suivent le wiki à chaque construction : une page renommée dans le vault arrête la
  construction (« page introuvable ») plutôt que de disparaître de l'espace en silence.
