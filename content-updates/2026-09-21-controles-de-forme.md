# Contrôles automatiques de forme — 21 septembre 2026

Point de départ : la page « Contrôles automatiques de forme » du site (`qualite.html`, construction du
13 septembre) signale **450 pages** — 432 « Source directe à vérifier », 133 « Pas de phrase
d'introduction », 31 « Outil non finalisé », 14 « Références invérifiables », 3 « Phrases très longues ».
Ce lot a relu chacune de ces catégories page par page, sur le site publié, pour séparer ce qui
tient de la mesure de ce qui tient des notes.

## 1. Ce qui venait de la mesure, corrigé dans `tools/qualite.mjs`

- **« Pas de phrase d'introduction » : 108 pages sur 133 en ont une.** Elles s'ouvrent sur « L'essentiel :
  … », que le lecteur lit en premier. Le contrôle s'arrêtait sur la « Table des matières » manuelle que
  ces notes posent avant leur première phrase — table que le générateur retire du rendu. Le contrôle
  la saute désormais, sans qu'elle consomme les douze lignes examinées. Vérifié sur deux notes réelles
  du vault (versées dans les lots du 6 et du 9 septembre) et sur une table de quinze entrées.
- **Notes d'analyse d'études** : 18 des 25 cas restants sont des notes « Auteur (année) - … », dont le
  gabarit (19 sections) commence par un titre. Le contrôle ne s'y applique plus, comme la page « Études
  et rapports » du générateur ne les compte pas parmi les notions. La règle reconnaît aussi « (dir.,
  1996) » : l'analyse de Daniellou rejoint la page « Études et rapports » du wiki psychosocial (45).
- **« Source directe » et notes d'analyse citées** : 107 pages citent dans leur corps une note d'analyse
  qui porte elle-même le DOI de la source — la source était à un clic, mais invisible sur la page. Le
  générateur affiche maintenant cette source **à côté de la citation** (pastille « DOI », ou « source »
  quand la note ne donne qu'une adresse), dans les listes et les tableaux — jamais au milieu d'une
  phrase. Le contrôle compte ces pages comme sourcées. Sur le site publié : 30 notes d'analyse portent
  une source (21 DOI), **629 citations sur 169 pages** reçoivent la pastille.

Le tableau de bord ne se recalcule qu'à la construction depuis le vault. Estimation faite d'ici, avec
les règles corrigées, sur le site publié : **≈ 320 pages** signalées au lieu de 450 — le détail par page
est dans `content-updates/2026-09-21-controles-de-forme.json` (champ `restants`).

## 2. Ce qui vient des notes

Aucun site externe n'est joignable d'ici (impossible de vérifier une référence) et le vault n'est pas
accessible : les sources, les outils et les références vagues restent à faire sur votre poste. La liste
est prête ; chaque entrée nomme la page et ce qui manque.

| Ce qui manque | Pages | Où |
| --- | ---: | --- |
| Aucune source repérable (ni adresse externe, ni note d'analyse citée qui en porte une) | 306 | SST psychosociale 150, Hygiène industrielle 37, Ergonomie 37, Toxicologie 31, Droit du travail 28, Sécurité industrielle 23 |
| Outil annoncé « À créer / À adapter » dans un tableau | 31 | SST psychosociale 30, Droit du travail 1 |
| Aucune phrase d'introduction (hors notes d'analyse) | 7 | SST psychosociale 7 — **phrases prêtes, voir § 3** |
| Références invérifiables sous « Références / Pour aller plus loin » | 15 | SST psychosociale 14, Hygiène industrielle 1 |
| Phrases de plus de 45 mots | 2 listées (3 selon le tableau de bord) | repris de la liste publiée |

### Les 15 pages avec des références invérifiables

- `w/psychosocial/communication-en-situation-difficile.html` — Communication en situation difficile : Guides de communication interpersonnelle. | Études sur la communication post-incident traumatique.
- `w/psychosocial/communication-laterale.html` — Communication latérale : Études en communication organisationnelle : aucune référence précise n'est consignée dans  | Recherches sur les communautés de pratique (Wenger) : aucun titre ni année n'est consigné 
- `w/psychosocial/cout-economique-des-rps-pour-lemployeur.html` — Coût économique des RPS pour l'employeur : EU-OSHA. Calculating the costs of work-related stress. | IRSST. Études sur le coût des lésions professionnelles. | Conference Board of Canada. Études sur la santé mentale au travail.
- `w/psychosocial/reunions-dequipe-efficaces.html` — Réunions d'équipe efficaces : Études en gestion sur l'efficacité des réunions. | Guides de gestion d'équipe.
- `w/hygiene/contrainte-thermique-encadrement.html` — Prévention de la contrainte thermique en mine : Contrainte thermique | [[Wiki SST/20 - Articles internes/60 - Prévention et programmes/Hiérarchie des moyens de p
- `w/psychosocial/aide-foreur-profil-rps.html` — Aide-foreur, profil RPS : IRSST. Études sur les métiers miniers québécois. | Études internationales sur les profils RPS en industrie minière.
- `w/psychosocial/communication-ascendante.html` — Communication ascendante : Notes de cours SST1010, module 11. | Études en communication organisationnelle (Tourish & Robson, Detert & Edmondson).
- `w/psychosocial/formation-des-superviseurs-a-la-detection.html` — Formation des superviseurs à la détection : Commission de la santé mentale du Canada. Premiers soins en santé mentale. | INRS. Stress au travail, le rôle du manager.
- `w/psychosocial/theme/conflits-et-harcelement.html` — Conflits et Harcèlement
- `w/psychosocial/demarche-de-prevention-en-rps-etapes.html` — Démarche de prévention en RPS, étapes : INRS. Risques psychosociaux, démarche de prévention. | INSPQ. Trousse d'outils pour la surveillance de la santé mentale en milieu de travail.
- `w/psychosocial/theme/invalidite-et-lesions.html` — Invalidité et Lésions
- `w/psychosocial/theme/legislation-et-normes.html` — Législation et Normes
- `w/psychosocial/theme/modeles-et-theories.html` — Modèles et Théories
- `w/psychosocial/theme/reconnaissance-et-motivation.html` — Reconnaissance et Motivation
- `w/psychosocial/reseau-de-la-sante-publique-en-sst-drsp-inspq.html` — Réseau de la santé publique en SST (DRSP, INSPQ)

### Les 31 pages avec un outil « À créer / À adapter »

- `w/psychosocial/communication-en-situation-difficile.html` — Communication en situation difficile (SST psychosociale)
- `w/psychosocial/communication-laterale.html` — Communication latérale (SST psychosociale)
- `w/psychosocial/cout-economique-des-rps-pour-lemployeur.html` — Coût économique des RPS pour l'employeur (SST psychosociale)
- `w/psychosocial/reunions-dequipe-efficaces.html` — Réunions d'équipe efficaces (SST psychosociale)
- `w/droit-travail/lsst-droits-et-obligations.html` — LSST, droits et obligations (Droit du travail)
- `w/psychosocial/comites-sst-en-milieu-minier.html` — Comités SST en milieu minier (SST psychosociale)
- `w/psychosocial/communication-avec-lequipe-lors-du-retour.html` — Communication avec l'équipe lors du retour (SST psychosociale)
- `w/psychosocial/communication-souterraine-et-isolement-de-lequipe.html` — Communication souterraine et isolement de l'équipe (SST psychosociale)
- `w/psychosocial/confidentialite-et-ethique-des-mesures-rps.html` — Confidentialité et éthique des mesures RPS (SST psychosociale)
- `w/psychosocial/coordination-avec-le-medecin-traitant-et-le-pae.html` — Coordination avec le médecin traitant et le PAE (SST psychosociale)
- `w/psychosocial/harcelement-psychologique-vs-conflit.html` — Harcèlement psychologique vs conflit (SST psychosociale)
- `w/psychosocial/indicateurs-rh-pour-suivre-les-rps.html` — Indicateurs RH pour suivre les RPS (SST psychosociale)
- `w/psychosocial/invalidite-de-courte-vs-longue-duree.html` — Invalidité de courte vs longue durée (SST psychosociale)
- `w/psychosocial/k10.html` — K10 (SST psychosociale)
- `w/psychosocial/mineur-entrepreneur-sous-traitance-vulnerabilites-rps.html` — Mineur entrepreneur (sous-traitance), vulnérabilités RPS (SST psychosociale)
- `w/psychosocial/phq-9.html` — PHQ-9 (SST psychosociale)
- `w/psychosocial/plan-de-retour-progressif.html` — Plan de retour progressif (SST psychosociale)
- `w/psychosocial/politique-dentreprise-sur-la-sante-psychologique.html` — Politique d'entreprise sur la santé psychologique (SST psychosociale)
- `w/psychosocial/politique-de-reconnaissance-au-travail.html` — Politique de reconnaissance au travail (SST psychosociale)
- `w/psychosocial/programme-daide-aux-employes-pae.html` — Programme d'aide aux employés (PAE) (SST psychosociale)
- `w/psychosocial/prevenir-les-rechutes-apres-retour.html` — Prévenir les rechutes après retour (SST psychosociale)
- `w/psychosocial/reconnaissance-dune-depression-comme-lesion-professionnelle.html` — Reconnaissance d'une dépression comme lésion professionnelle (SST psychosociale)
- `w/psychosocial/role-du-superviseur-dans-le-retour-au-travail.html` — Rôle du superviseur dans le retour au travail (SST psychosociale)
- `w/psychosocial/sensibilisation-a-la-sante-mentale.html` — Sensibilisation à la santé mentale (SST psychosociale)
- `w/psychosocial/sources-des-conflits.html` — Sources des conflits (SST psychosociale)
- `w/psychosocial/soutien-au-retour-au-travail.html` — Soutien au retour au travail (SST psychosociale)
- `w/psychosocial/tableau-de-bord-sst-psychosociale-pour-direction.html` — Tableau de bord SST psychosociale pour direction (SST psychosociale)
- `w/psychosocial/etapes-dun-retour-au-travail-reussi.html` — Étapes d'un retour au travail réussi (SST psychosociale)
- `w/psychosocial/audit-psychosocial-complet-methodologie.html` — Audit psychosocial complet, méthodologie (SST psychosociale)
- `w/psychosocial/bonnes-pratiques-pour-administrer-un-questionnaire.html` — Bonnes pratiques pour administrer un questionnaire (SST psychosociale)
- `w/psychosocial/lien-entre-rps-et-invalidite-prolongee.html` — Lien entre RPS et invalidité prolongée (SST psychosociale)

### Les 306 pages sans source repérable

Par wiki, dans le JSON. Les plus longues d'abord (une page de 1 500 mots sans une seule source
vérifiable pèse plus qu'une fiche de 160 mots) :

- `w/psychosocial/resume-theorell-t-a-systematic-review-including-meta-analysis-of-work-environment-and-depressive-symptoms.html` — Résumé Theorell, T. A systematic review including meta-analysis of work environment and depressive symptoms (SST psychosociale, 2886 mots)
- `w/hygiene/hierarchie-des-moyens-de-prevention.html` — Hiérarchie des moyens de prévention (Hygiène industrielle, 2144 mots)
- `w/securite/hierarchie-des-moyens-de-prevention.html` — Hiérarchie des moyens de prévention (Sécurité industrielle, 2135 mots)
- `w/droit-travail/cotisations-et-financement-cnesst.html` — Cotisations et financement CNESST (Droit du travail, 1667 mots)
- `w/securite/risques-sectoriels.html` — Risques sectoriels et bonnes pratiques (Sécurité industrielle, 1645 mots)
- `w/hygiene/simdut-et-classes-de-danger.html` — SIMDUT et classes de danger (Hygiène industrielle, 1513 mots)
- `w/toxicologie/simdut-et-classes-de-danger.html` — SIMDUT et classes de danger (Toxicologie, 1512 mots)
- `w/toxicologie/amiante.html` — Amiante (Toxicologie, 1445 mots)
- `w/hygiene/amiante.html` — Amiante (Hygiène industrielle, 1430 mots)
- `w/droit-travail/infractions-et-sanctions.html` — Infractions et sanctions SST (Droit du travail, 1387 mots)
- `w/droit-travail/lsst-droits-et-obligations.html` — LSST, droits et obligations (Droit du travail, 1321 mots)
- `w/toxicologie/priorisation-et-substitution-chimique.html` — Priorisation et substitution chimique (Toxicologie, 1317 mots)
- `w/psychosocial/programme-daide-aux-employes-pae.html` — Programme d'aide aux employés (PAE) (SST psychosociale, 1301 mots)
- `w/hygiene/demarche-arec.html` — Démarche AREC (Hygiène industrielle, 1272 mots)
- `w/securite/appreciation-du-risque.html` — Appréciation du risque, méthodes (Sécurité industrielle, 1251 mots)
- `w/securite/gestion-des-risques.html` — Gestion des risques en entreprise (Sécurité industrielle, 1214 mots)
- `w/hygiene/metaux.html` — Métaux toxiques en milieu de travail (Hygiène industrielle, 1186 mots)
- `w/toxicologie/metaux.html` — Métaux toxiques en milieu de travail (Toxicologie, 1186 mots)
- `w/psychosocial/phq-9.html` — PHQ-9 (SST psychosociale, 1174 mots)
- `w/ergonomie/travail-en-environnement-chaud.html` — Travail en environnement chaud (Ergonomie, 1157 mots)
- `w/psychosocial/de-la-conformite-a-la-prevention-comprendre-et-faire-evoluer-la-culture-sst.html` — 🔄 De la conformité à la prévention - Comprendre et faire évoluer la culture SST (SST psychosociale, 1154 mots)
- `w/psychosocial/comparatif-des-cycles-fifo-14-14-20-10-21-7.html` — Comparatif des cycles FIFO (14/14, 20/10, 21/7) (SST psychosociale, 1133 mots)
- `w/toxicologie/amiante-articles-internes.html` — Amiante (Toxicologie, 1128 mots)
- `w/psychosocial/travail-fifo-et-cycles-de-rotation.html` — Travail FIFO et cycles de rotation (SST psychosociale, 1125 mots)
- `w/securite/theorie-causale-des-accidents.html` — Accidents et incidents, théorie causale (Sécurité industrielle, 1119 mots)
- … et 281 autres, dans le JSON.

## 3. Les 7 phrases d'ouverture, prêtes à poser

Chaque phrase a été rédigée par un agent à partir de la page seule, avec l'appui textuel de chaque élément, puis soumise à un second agent chargé de la réfuter (tout fait, nom, année, nuance ou jugement sans appui dans la page ; forme : une à deux phrases, 40-220 caractères, ton encyclopédique). Trois formulations ont été réfutées et corrigées sans rien ajouter ; quatre ont tenu. Aucun contenu SST nouveau.

- **Charge de travail élevée** (`w/psychosocial/charge-de-travail-elevee.html`)
  > Facteur de risque psychosocial, la charge de travail élevée comporte trois dimensions (quantitative, cognitive et émotionnelle); ses conséquences, son application en mines et les outils pour l'évaluer sont présentés.
  _La section « Application en mines » ne contient que deux images ; « Pour aller plus loin » se termine sur un « L » orphelin (artefact du vault)._
- **RPS et symptômes dépressifs au travail - Fiche Obsidian centrée sur Theorell et al. 2015, avec mises à jour 2015-2025** (`w/psychosocial/theorell-et-al-2015-avec-mises-a-jour-2015-2025.html`)
  > Synthèse de la revue systématique de Theorell et al. (2015) sur les risques psychosociaux et les symptômes dépressifs au travail, avec les mises à jour 2015-2025 et les implications pour la SST minière québécoise.
  _Note de travail Obsidian (tutoiement, jetons de génération « citeturn6view2 », bloc Mermaid en texte brut, sources non attestées) : à nettoyer un jour, indépendamment de la phrase._
- **⭐ Top 20 articles** (`w/psychosocial/top-20-articles-essentiels.html`)
  > Sélection de vingt articles essentiels du wiki SST psychosociale, classés en cinq volets (comprendre, mesurer, cadre légal, contexte minier, agir), chacun assorti d'un mot sur le pourquoi.
  _Page de navigation ; le corps commence par une liste qui répète le sommaire automatique (pourrait être retirée)._
- **🔄 De la conformité à la prévention - Comprendre et faire évoluer la culture SST** (`w/psychosocial/de-la-conformite-a-la-prevention-comprendre-et-faire-evoluer-la-culture-sst.html`)
  > Une culture de conformité en SST est réactive; une culture de prévention va au-delà. L'article compare les deux, présente la courbe de Bradley, l'échec de la conformité sur les RPS et les leviers du changement.
  _Le corps s'ouvre sur « 📎 Retour à l'accueil (source interne) », renvoi vers une note non publiée : à retirer de la note._
- **Index des 7 Notes Wiki Créées - SST1010** (`w/psychosocial/index-notes-wiki.html`)
  > Index des sept notes d'analyse Obsidian sur les risques psychosociaux d'un aide-foreur en mine québécoise FIFO, classées par progression théorique, avec le profil de risque global et leur usage pour le cours SST1010.
  _Document de travail (« INDEX_NOTES_WIKI.md ← Vous êtes ici », tailles de fichiers) ; le « 7 » est dépassé : une trentaine d'analyses ajoutées sont listées en fin de page. Candidat à l'archivage plutôt qu'à la publication._
- **Iso-strain** (`w/psychosocial/iso-strain.html`)
  > L'iso-strain combine le job strain (forte demande, faible contrôle) et un faible soutien social au travail. L'article en présente la définition, la mesure dérivée du JCQ, l'application en mines et la prévention.
  _Le corps commence par un fragment de liste orphelin (« Maladies cardiovasculaires (Belkic et al., 2004; Kivimäki et al., 2006) », « Trouble ») avant la première image : à corriger dans la note._
- **LOT 3 - NOTES INSTITUTIONNELLES/COMPLÉMENTAIRES** (`w/psychosocial/readme-notes-lot3.html`)
  > Compte rendu de la génération des six notes institutionnelles et complémentaires (AMC, INRS, INSPQ, Gouvernement du Canada, CNESST) du travail SST1010 sur l'aide-foreur : contenu clé, structure commune et statistiques.
  _README d'un lot de génération (script Python, date, modèle) : document de travail, candidat à l'archivage plutôt qu'à la publication._

Pose sur votre poste : `node tools/appliquer_intros.mjs` (essai), puis `node tools/appliquer_intros.mjs
--appliquer` (sauvegarde de chaque note dans `sauvegarde-vault/<date>-intros/`, phrase posée juste après
le titre H1, avant la table des matières). Le site publié montre déjà ces phrases en tête de page,
comme la prochaine construction les rendra une fois le lot appliqué — sans le lot dans le vault, elles
disparaîtraient à cette construction.

## 4. Suite proposée

1. **Sources** : lot par lot et par wiki, à partir des sources primaires que vous consultez (CNESST,
   IRSST, INRS, INSPQ, LegisQuébec, articles à DOI), comme les lots « références » du 6 septembre. Une
   fois une note d'analyse créée pour une source, toutes les pages qui la citent héritent de sa
   pastille : c'est le levier le plus rentable pour le wiki psychosocial (150 pages).
2. **Outils annoncés** : 31 pages — décider, tableau par tableau, si l'outil existe (le lier), sera
   créé (garder la mention, avec un responsable) ou n'existera pas (retirer la ligne).
3. **Références vagues** : 15 pages — remplacer « Guides de communication interpersonnelle. » par la
   référence réelle, ou retirer la ligne.

## Vérifications

- 147 tests (1 échec connu et antérieur : textes-loi), dont : table des matières sur deux notes réelles
  et une table de quinze entrées, exemption des notes d'analyse (y compris « (dir., 1996) », et non
  « (Kivimäki, 2012) » qui est une notion citant une étude), source héritée et pastille (listes et
  tableaux seulement, idempotente), pose des phrases d'ouverture (après le H1, avant la table des
  matières, CRLF et BOM conservés, jamais deux fois).
- `verif_site`, `verif_liens` (0 erreur), `verif_publication --staged`, `verif_rendu` sur des pages à
  pastilles (cible de 29 px sur écran tactile).
- Les phrases d'ouverture : rédigées par un agent à partir de la page seule, avec l'appui textuel de
  chaque élément, puis réfutées par un second agent (fidélité au contenu, forme) ; relues ensuite.

