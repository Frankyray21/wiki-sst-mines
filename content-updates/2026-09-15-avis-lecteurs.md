# Avis des lecteurs sur chaque page — 15 septembre 2026

Frank, 15 septembre : « Ajoute à chaque page un espace pour évaluer l'article avec pouce haut ou bas
et champ commentaire. Connecter avec Airtable pour la base de données et faire le suivi. »

## Ce qui est en place

- **Un bloc au bas de chaque page issue d'une note** — 4 074 pages : articles, thèmes, accueils de
  wiki et les copies de l'espace encadrement. Les pages d'outil et d'index (recherche, graphe,
  catégories, index alphabétique, thèmes, études et rapports) n'en ont pas : il n'y a pas d'article
  à évaluer.
- **Un pouce en haut, un pouce en bas**, puis un commentaire et un nom, tous deux facultatifs. Le
  pouce part au clic : un avis sans commentaire compte. Le commentaire envoyé ensuite **met à jour
  la même ligne** plutôt que d'en créer une seconde, grâce à une clé `Réf` = identifiant local du
  lecteur + adresse de la page. Changer d'avis met aussi à jour la même ligne.
- **Destination** : base Airtable **Formations**, table **Avis wiki SST (web)** (`tbl3kDCV13AFkd6X6`),
  créée selon la convention de vos tables « Retours quiz … (web) » (procédures, TMS, RodBot).
  Champs : Page, Avis, Commentaire, Wiki, Adresse, Lien, Nom, Date, Source, **Statut**
  (Nouveau / En cours / Traité / Sans suite), **Suivi**, Réf. Les deux derniers sont là pour le suivi :
  le relais met « Nouveau » à la création seulement, donc un avis déjà traité ne repasse pas en
  « Nouveau » si le lecteur ajoute un mot.
- **Hors ligne** — le cas normal sous terre : l'avis attend dans `localStorage` et repart à la
  connexion suivante, au chargement d'une page ou au retour du réseau.

## Pourquoi un relais, et pas Airtable directement

Le site est statique : il est publié tel quel par GitHub Pages, sans serveur. Écrire dans Airtable
depuis la page demanderait d'y placer un jeton — que n'importe quel visiteur pourrait lire dans le
code source, puis utiliser pour lire, modifier ou vider la base. Le relais Cloudflare
(`tools/avis-worker/`) garde le jeton de son côté ; la page ne parle qu'à lui. C'est le même montage
que vos Workers `attestations-tms`, `attestations-procedures` et `attestations-rodbot`.

Le relais refuse une origine étrangère (403), un avis autre que les deux pouces (400), une requête
sans page (400), une `Réf` contenant un guillemet, une barre oblique inverse ou un caractère de
contrôle (400 : elle entre dans une formule Airtable) ; il coupe les textes (commentaire 1 500 caractères, nom 80) et n'écrit le wiki que
s'il fait partie des huit valeurs attendues. Si Airtable est en panne, il répond 502 et le navigateur
remet l'avis dans sa file.

## Il reste une étape, sur votre poste

Le bloc **est invisible aujourd'hui** : `docs/assets/avis.json` a une adresse vide, et aucune page ne
montre un formulaire qui n'enverrait nulle part. Pour l'allumer :

1. créer un jeton Airtable limité à la base Formations (lecture + écriture des enregistrements) ;
2. déployer le relais : `cd tools/avis-worker && npx wrangler secret put AIRTABLE_TOKEN && npx wrangler deploy` ;
3. écrire l'adresse obtenue dans `docs/assets/avis.json`, puis commiter.

Le mode d'emploi détaillé, y compris la version sans ligne de commande et la commande `curl` de
vérification, est dans `tools/avis-worker/README.md`. C'est le seul fichier à changer : les pages le
relisent au chargement, et le générateur ne l'écrase jamais. Il est volontairement hors du manifeste
hors ligne (`verif_publication` ne le contrôle pas, la synchronisation ne le retélécharge pas) et
dans le noyau du service worker, qui le rafraîchit à chaque visite en ligne et le sert sous terre.

## Vie privée

Le site ne demande aucune identification. Le nom est facultatif et n'est proposé que « si vous voulez
une suite ». L'identifiant de lecteur est un code aléatoire créé dans le navigateur (`L` + 8
caractères), qui ne sert qu'à relier un commentaire à son pouce ; il ne quitte pas le poste autrement
que dans le champ `Réf`, et ne permet pas de retrouver une personne. Aucune adresse IP n'est
enregistrée par le site (Cloudflare en journalise pour son propre fonctionnement).

## Vérification

- **De bout en bout dans Chromium**, relais simulé : sans relais configuré, le bloc reste invisible ;
  avec relais, le pouce envoie aussitôt et ouvre le champ commentaire ; le commentaire part avec la
  même `Réf` ; relais en panne, l'avis est mis en file locale, puis renvoyé au rechargement et la
  file se vide.
- `tools/tests/avis.test.mjs` (4 tests) : balisage masqué par défaut, données de la page portées par
  les attributs, titre échappé (une injection dans un titre ne sort pas de l'attribut), formulaire
  caché avant le vote, cibles de 44 px, section nommée pour les lecteurs d'écran, aucun appel direct
  à Airtable ni jeton dans le script ou la configuration, et état du site publié (un bloc par page
  issue d'une note, aucun ailleurs, adresse et wiki justes).
- `tools/tests/avis-worker.test.mjs` (5 tests) : création avec « Nouveau », mise à jour de la même
  ligne sans toucher au statut, commentaire vide qui n'efface rien, refus (avis inattendu, page
  manquante, origine étrangère, mauvaise méthode), pré-vol CORS, textes coupés, 502 si Airtable tombe.
- 125 tests au total, `verif_site`, `verif_liens` (0 erreur sur 245 385 liens), `verif_publication --staged`.

## Relecture adversariale du même soir : trois corrections

- **`avis.json` était dans le manifeste hors ligne.** Suivre le mode d'emploi (écrire l'adresse du
  relais, commiter) aurait fait échouer `verif_publication` sur ce commit et, chez chaque lecteur,
  laissé la synchronisation buter indéfiniment sur un hash périmé (« 1 page ratée » à chaque passe).
  Le fichier sort du manifeste et entre dans le noyau du service worker : chargé à l'installation,
  gardé au nettoyage, rafraîchi à chaque visite en ligne, servi depuis le cache hors ligne. Test
  ajouté à `hors-ligne.test.mjs` (installation, synchronisation, nettoyage, requête hors ligne).
- **La file d'attente ne se vidait que sur une page portant le bloc** : la branche prévue pour les
  autres pages testait une variable encore vide. La configuration est désormais lue sur toute page ;
  vérifié dans Chromium, un avis mis en file sur une page de thème repart depuis l'index du portail.
  Un avis donné pendant l'envoi de la file n'est plus écrasé, et rien ne part sans relais connu.
- **`Réf` filtrée par le relais** avant d'entrer dans la formule `filterByFormula` : guillemet,
  barre oblique inverse et caractères de contrôle sont refusés (400) plutôt qu'échappés — le site
  n'en produit jamais. Trois cas de test, plus une `Réf` normale avec apostrophe typographique.

Nouvelle estampille `20260915010144` ; `verif_publication --staged` conforme (4 284 pages hachées).

## Deux constats préexistants, toujours ouverts

- `tools/tests/textes-loi.test.mjs` échoue encore : 11 pages d'article de loi sans texte extrait
  (voir la note du 14 septembre). Sans rapport avec ce lot.
- Les liens du corps des pages d'article mesurent moins de 24 px de haut sur téléphone. Le bloc
  d'avis, lui, a des cibles de 44 px.
