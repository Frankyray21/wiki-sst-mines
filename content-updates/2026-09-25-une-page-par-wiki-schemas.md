# Une page illustrée par wiki : schémas et corrections sourcées — 25 septembre 2026

Demande de Frank, après Espaces clos : « fait une page dans chaque catégorie ex rps, ergonomie etc ».
Chaque page reçoit de vrais schémas, souvent à la place de captures de cours. Ses erreurs sont corrigées
lorsque le texte officiel du recueil les contredit, comme pour
[Espaces clos](2026-09-25-espaces-clos-schemas.md).

## Pages modifiées

Adresses du site publié : elles montrent ces changements une fois la branche fusionnée dans `main`.

| Wiki | Page | Ce qui change |
| --- | --- | --- |
| SST psychosociale | [Modèle de Karasek](https://frankyray21.github.io/wiki-sst-mines/w/psychosocial/modele-de-karasek.html) | Deux schémas ; retrait d'une capture qui montrait en réalité la courbe de Selye |
| Ergonomie | [Postures contraignantes](https://frankyray21.github.io/wiki-sst-mines/w/ergonomie/postures-contraignantes.html) | Deux schémas |
| Hygiène industrielle | [Aérosols](https://frankyray21.github.io/wiki-sst-mines/w/hygiene/aerosols.html) | Deux schémas ; silice cristalline à 0,05 mg/m³ et C2 ; fibres « > 3x » |
| Toxicologie | [Gestion des moteurs diesel sous terre](https://frankyray21.github.io/wiki-sst-mines/w/toxicologie/diesel-sous-terre.html) | Deux schémas ; NO₂ à 3 ppm |
| Droit du travail | [Processus de réclamation CNESST](https://frankyray21.github.io/wiki-sst-mines/w/droit-travail/reclamation-cnesst.html) | Deux schémas ; 14 cellules corrigées d'après la LATMP et l'art. 62 de la LSST |
| Droit du travail | [Indemnités de remplacement du revenu (IRR)](https://frankyray21.github.io/wiki-sst-mines/w/droit-travail/irr-indemnites.html) | Mêmes règles de versement, corrigées comme sur la page précédente |

Sécurité industrielle : Espaces clos, livrée plus tôt le même jour. Karasek et Diesel ont aussi une copie dans
l'espace encadrement (`g/`), modifiée de la même façon.

## Méthode

Chaque page est passée par un dessinateur, puis par un relecteur contradictoire. Tous suivent les consignes
d'Espaces clos :
- chaque mot d'un schéma s'appuie sur la page, sur un texte officiel du recueil local ou sur une note
  d'analyse du wiki qui cite sa source ;
- aucun chiffre, angle, durée ni seuil n'est ajouté ;
- SVG écrits à la main, 480 de large, texte de 19 px au moins, palette de la série, inversés en thème sombre ;
- texte alternatif, légende, version texte (« Lire le schéma en texte ») et sources pour chacun.

Le relecteur rend chaque schéma à 340 et 540 px, en clair et en sombre, le confronte mot à mot à ses appuis
et corrige lui-même ce qui cloche. Il a trouvé et réglé un défaut de fond sur chaque page :
- Karasek : « le soutien amortit » (lien de cause absent de la page) ;
- Postures : une frontière nette à 45° qui se lisait comme un angle limite ;
- Aérosols : deux trajectoires de particules invraisemblables ;
- Diesel : la cabine semblait suffire à arrêter les émissions ;
- Réclamation : le cas où aucun employeur n'est tenu de verser le salaire manquait ; l'art. 272 oubliait le
  bénéficiaire.

Les corrections de texte se limitent aux erreurs que contredit le texte officiel du recueil (LATMP, LSST, RSSM
et, pour l'annexe I du RSST, le PDF officiel à jour au 1er juin 2024). Le reste est relevé plus bas, sans
modification. Pour le wiki psychosocial, le texte de l'article n'est pas touché, par convention.

## Page par page

### Modèle de Karasek (SST psychosociale)

- **Demande et contrôle : quatre situations**, entre la phrase « Karasek 1979 p. 288 propose une matrice à
  quatre quadrants… » et le tableau. Ce schéma remplace la capture `03-stress-consequences/img-001.png` et sa
  légende (« Modèle de Karasek, 4 quadrants… »).
  - L'image montrait la courbe du syndrome général d'adaptation de Selye (« réaction d'alarme », « phase
    d'épuisement »), pas le modèle.
  - Cause : l'index des images du cours attribue le schéma de Karasek à `04-stress-modèles/img-001.png`, un
    fichier que le site n'a pas.
  - Le fichier reste dans le vault.
- **Quand le soutien manque : l'iso-strain**, après la définition de l'iso-strain.
  - Deux lignes montrent le même job strain, avec un fort puis un faible soutien au travail.
  - L'encadré FIFO suit la page sourcée « Iso-strain : ce que ça signifie » : la coupure du soutien externe ne
    fait pas, à elle seule, de l'iso-strain.

### Postures contraignantes (Ergonomie)

- **Du neutre à la limite**, à la fin de « Définition ».
  - L'épaule, de la posture neutre à la limite d'amplitude.
  - La zone de confort passe peu à peu à la zone contraignante, sans angle ni frontière.
  - En bas, les trois modulateurs du risque.
- **Postures à risque en mine**, sous « Postures contraignantes communes en mine », avant le tableau.
  - Six postures du tableau, la région touchée en rouge, un exemple minier pour chacune.
  - La capture de cours (poignet, outil, convoyeur) reste sous le tableau.
- Aucun chiffre de la page n'est repris (« 3 fois », « 4 fois », « 2 minutes »).

### Aérosols (Hygiène industrielle)

- **La zone atteinte par chaque fraction** : inhalable, thoracique, respirable, sans taille ni échelle.
  - Ce schéma remplace la capture « Régions de l'appareil respiratoire » (crédit Shutterstock).
  - Les courbes chiffrées qui la suivaient restent.
- **Cinq façons de se déposer** : les cinq mécanismes de la liste de la page, sur une même bifurcation. Ce
  schéma remplace sur place la capture du cours, qui en montrait six (dont « mouvement de nuage », crédit
  Marc Tellier).
- Texte corrigé d'après l'annexe I du RSST :
  - silice cristalline respirable : « C1, EM ; VEMP 0,1 mg/m³ » devient « C2, EM ; VEMP 0,05 mg/m³ »
    (p. 160 : quartz et cristobalite « 0,05 Pr, C2, EM ») ;
  - fibres : « Longueur >= 3x diamètre » devient « > 3x » (définition 5, et art. 1 : rapport « supérieur à 3:1 »).

### Gestion des moteurs diesel sous terre (Toxicologie)

- **Où agir contre les émissions diesel**, sous « Options et leviers » : quatre niveaux le long du trajet des
  émissions, jusqu'à la zone respiratoire du travailleur (source, échappement, air du chantier, autour du
  travailleur). Aucune efficacité comparée.
- **Ce que chaque dispositif réduit dans l'échappement**, sous « Post-traitement et carburant » : DOC, SCR,
  DPF et sa base requise, l'ULSD. La légende rappelle, sans chiffre, deux obligations de l'art. 102 du RSSM :
  un dispositif d'épuration ou de dilution sur chaque moteur, et un plafond de soufre.
- Texte corrigé : « NO2 0,2 ppm », attribué au RSST, devient « NO2 3 ppm ».
  - Annexe I, p. 135 : VEMP 3 ppm, VECD 5 ppm.
  - Le CO à 35 ppm concorde (p. 138).

### Processus de réclamation CNESST et IRR (Droit du travail)

- **Qui verse le revenu, et quand**, sous « Versement du salaire » :
  - le jour où débute l'incapacité (art. 59) ;
  - les 14 jours complets suivants, payés par l'employeur puis remboursés (art. 60) ;
  - à compter du 15e jour complet, la CNESST (art. 124) ;
  - et le cas où aucun employeur n'est tenu de verser ce salaire (art. 124, al. 2).
- **Réclamation à la CNESST : six mois à compter de quoi ?**, sous « Délais de réclamation » : art. 270, 271,
  272 (bénéficiaire compris) et 352.
- Cellules corrigées, mot à mot d'après la loi :

| La page disait | Elle dit | Appui |
| --- | --- | --- |
| Jour de l'accident (portion travaillée) | Jour où débute l'incapacité (reste de la journée de travail prévue) | LATMP, art. 59 |
| Jours 2 à 14 | 14 jours complets suivant le début de l'incapacité | art. 60 |
| À partir du 15e jour | À compter du 15e jour complet suivant le début de l'incapacité | art. 124 |
| 6 mois de l'atteinte ; 6 mois de la survenance | 6 mois de la lésion ; 6 mois de la lésion ou du décès | art. 270 |
| Verser le salaire net du jour de l'accident | … pour la partie de la journée de travail où le travailleur devient incapable et où il aurait normalement travaillé | art. 59 |
| Verser 90 % du salaire net pendant les 14 jours suivants | … pour chaque jour ou partie de jour normalement travaillé, pendant les 14 jours complets suivant le début de l'incapacité | art. 60 |
| Produire la réclamation dans les 14 premiers jours | Faire l'avis et la réclamation de remboursement sur le formulaire prescrit | art. 268 |
| Aviser la CNESST du retour ou non-retour dans les 14 jours | Transmettre ce formulaire à la CNESST, avec une copie de l'attestation médicale, dans les deux jours suivant le retour au travail ou la fin des 14 jours complets | art. 269 |
| Faciliter la déclaration et fournir les formulaires | Assister le travailleur dans la rédaction de sa réclamation et lui fournir les informations requises | art. 270 |
| Silicose : le délai part du diagnostic médical | … à compter de la date où il est porté à la connaissance du travailleur qu'il est atteint d'une maladie professionnelle | art. 272 |
| Sous-traitant : réclamation produite chez son employeur | Réclamation produite à la CNESST ; son employeur est le sous-traitant | art. 270 à 272 |
| Événement grave : avis dans les 24 heures (deux endroits) | Informer la CNESST par le moyen de communication le plus rapide, puis rapport écrit dans les 24 heures | LSST, art. 62 |

La page IRR portait les mêmes erreurs (« portion travaillée », « Jours 2 à 14 », « À partir du 15e jour ») :
elle est corrigée de la même façon (lot `2026-09-25-irr-indemnites.json`). Sans cela, elle aurait contredit
la page Réclamation, à laquelle elle renvoie.

## Outils

- `tools/poser_schemas.mjs` : le sommaire, la navigation et « Voir aussi » ne sont plus pris pour des ancres.
  Un titre de section qui figure aussi dans le sommaire était refusé comme ambigu.
- `tools/regenerer_hors_ligne.mjs` : `sw.js` porte désormais l'empreinte du manifeste hors ligne, ce qui
  répond à une remarque de relecture sur la PR. Sans cela, un service worker resté actif gardait l'ancien
  manifeste en mémoire : les pages modifiées étaient refusées au contrôle de hash et les nouveaux schémas
  manquaient au téléchargement hors ligne, jusqu'au redémarrage du worker. Le navigateur installe maintenant
  le nouveau worker, qui recharge le noyau et relit le manifeste.

## À faire dans le vault (sinon la prochaine construction efface ces pages)

```
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-modele-de-karasek-schemas.json
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-modele-de-karasek-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-postures-contraignantes-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-aerosols-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-diesel-sous-terre-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-reclamation-cnesst-schemas.json --appliquer
node tools/appliquer_retouches.mjs --lot content-updates/2026-09-25-irr-indemnites.json --appliquer
node tools/build_site.mjs
```

- Sans `--appliquer`, chaque commande fait un essai. Si une seule retouche ne trouve pas sa ligne, rien
  n'est écrit.
- Les lots retrouvent la note par son titre, dans son wiki. Si l'essai n'en trouve aucune, ou en trouve deux,
  ajoutez son chemin dans le champ `note.chemin` du lot.
- Les schémas sont copiés dans `Infographies/` ; les anciennes captures restent dans le vault.
- Karasek : la retouche retire la ligne qui contient « img-001.png ». Si la note en a deux, l'essai s'arrête.
- Les lots Réclamation et IRR ont été rejoués deux fois sur des notes reconstituées
  (`tools/tests/latmp-versement.test.mjs`), pas sur les vraies notes. Les autres lots ont été essayés contre
  la page publiée seulement.

## Photos : toujours pas

Les banques d'images restent injoignables depuis l'environnement de travail, comme pour Espaces clos.
Emplacements utiles, photos prises avec l'accord de l'employeur, sans personne reconnaissable :
- un filtre à particules sur un engin de chargement (Diesel) ;
- un poste de boulonnage en chantier bas (Postures) ;
- un échantillonneur de fraction respirable porté à l'épaule (Aérosols).

## Relevé en chemin, non modifié (à trancher)

**Karasek**
- Paragraphe FIFO : « un job strain modéré en milieu urbain peut basculer en Iso-strain en camp parce que le
  soutien social externe […] est temporairement coupé ». La page sourcée « Iso-strain : ce que ça signifie »
  le contredit ; le schéma suit la page sourcée.
- « Configuration la plus dommageable documentée » affirme une cause, sans source.
- « Sans les conséquences de santé du job strain » (travail actif) est trop absolu : la note Karasek (1979)
  dit « modéré-bas ».
- La même image de Selye illustre à tort « Les trois niveaux de prévention » et « Médiation et résolution de
  conflits ».

**Postures**
- « 3 fois » et « 4 fois plus de risques » ne sont pas sourcés ; la phrase est reprise dans la page
  Ergonomie posturale.
- « 2 minutes » contredit la courbe ISO 11226 affichée juste au-dessus, qui descend à 1 minute ; « quelques
  dizaines de minutes » n'est pas appuyé.
- Le renvoi à Articulations promet des amplitudes que cette page ne donne pas.
- « 2 à 5 m » de plafond n'est pas sourcé.

**Aérosols**
- Silice : 0,1 mg/m³ figure encore sur les pages RSST (annexe I), VEA et normes, VEMP, art-116-RSST (copies
  hygiène et ergonomie), MELCCFP, ACGIH (« plus stricte que le RSST québécois (0,1 mg/m³) ») et Silice
  cristalline (hub). La page Toxicité du système respiratoire écrit
  0,025 mg/m³. À harmoniser, après avoir vérifié sur LégisQuébec (injoignable d'ici) qu'aucune modification
  postérieure au 1er juin 2024 ne s'applique.
- Brouillards d'huile : « notation Pc possible », alors que le RSST ne leur en donne pas.
- DPM : « biomarqueur = EC » est impropre, c'est une mesure dans l'air.
- Deux phrases ne correspondent pas à l'image qui les suit : « notations RSST » devant des courbes,
  « Dispositif… thoracique » devant des tableaux.
- La capture ISO 14644-1 (salles propres) est hors sujet.
- Plusieurs captures portent un crédit de tiers.
- Aérosols et Toxicité du système respiratoire ne donnent pas les mêmes tailles : médiane de 4 ou d'environ
  5 µm ; diffusion sous 1 ou sous 0,5 µm.

**Diesel**
- « Annexe I LATMP : cancer du poumon » : cette annexe est abrogée (2021, c. 27).
- DPM : le RSSM fixe déjà une valeur, moins de 0,4 mg de carbone total par m³ selon la méthode NIOSH 5040
  (art. 102, 1°). Il impose des mesures au moins tous les six mois (art. 103.1). La page parle de « valeurs en
  révision » et d'une « campagne annuelle » en carbone élémentaire.
- « 90 %+ » et « 20-30 ans » ne sont pas sourcés.
- DOC : « modérément les particules » ici, « pas les particules » sur le concept DPF, non sourcé.
- NO₂ à 0,2 ppm aussi sur « Dose-réponse et DL50 » ; CO à 25 ppm sur « art-39-RSST », alors que l'annexe I
  donne 35 ppm.

**Réclamation CNESST**
- Restent imprécis :
  - l'introduction ;
  - l'attestation médicale, rattachée à l'art. 199 alors que l'obligation est à l'art. 267 ;
  - le rapport sommaire de l'art. 200 (son point de départ manque) ;
  - « Prolongation possible » ;
  - « Lésion professionnelle (cas général) » ;
  - l'obligation de l'art. 266, al. 2, qui n'a plus de ligne dans le tableau de l'employeur.
- Assignation temporaire :
  - « MQAC » plutôt que le professionnel de la santé qui a charge du travailleur (art. 179) ;
  - « les IRR sont rétablies pendant la contestation et ne sont pas recouvrables » n'est pas sourcé.
- Motifs raisonnables : « gravité insoupçonnée de la lésion » renvoie à Raymond et Électrogroupe, dont la
  fiche du wiki dit le contraire.
- « Période d'emploi sert au calcul du revenu brut ; conserver f » : la phrase est coupée.
- Deux cas que les schémas ne tranchent pas :
  - une incapacité de plus d'un jour mais d'au plus 14 jours complets, sans atteinte permanente, ne relève
    ni de l'art. 270 ni de l'art. 271 ;
  - un décès dû à une maladie professionnelle relève à la fois de l'art. 270 et de l'art. 272.
- Fraîcheur du recueil : LATMP à jour au 20 février 2024, LSST au 26 mars 2024.

**Sur tout le site**
- Le texte d'un lien est parfois remplacé par le titre de la page cible, ce qui fausse la phrase : « Aviser
  la CNESST, rôles et pouvoirs que le travailleur… », « Programme de prévention silice cristalline
  respirable ». Cause : le générateur (`tools/build_site.mjs`). Une tâche séparée est proposée.

## Vérifications

- Tests : 190 réussis sur 191 ; le seul échec, `textes-loi`, est connu et antérieur. Nouveaux tests :
  - `latmp-versement` : les deux lots de droit, rejoués deux fois ;
  - `regenerer-hors-ligne` ;
  - le sommaire ignoré dans `poser-schemas` ;
  - `schemas-lots`, qui couvre maintenant les six lots de schémas.
- `verif_site`, `verif_liens` (0 erreur), `verif_publication --staged` avant chaque commit.
- Chromium, `verif_rendu` : les six pages modifiées et les deux copies de l'encadrement, dans les cinq modes
  (téléphone clair et sombre, tablette de chantier en paysage et en portrait, bureau). Aucun défaut.
- Pas essayé sur un appareil réel. Aucune validation spécialisée ni relecture éditoriale humaine n'est
  attestée.
