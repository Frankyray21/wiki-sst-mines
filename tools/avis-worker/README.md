# Relais des avis — `avis-wiki`

Le wiki est un site statique publié par GitHub Pages : il n'a pas de serveur. Un jeton Airtable
posé dans une page publique serait lisible, et utilisable, par n'importe qui. Ce petit relais
Cloudflare garde le jeton de son côté ; la page ne parle qu'à lui.

Même principe que vos Workers `attestations-tms`, `attestations-procedures` et `attestations-rodbot`.

## Ce qu'il écrit

Base **Formations** (`appmq82YjvEUglYZU`), table **Avis wiki SST (web)** (`tbl3kDCV13AFkd6X6`).

Un enregistrement par page **et par lecteur** : la clé `Réf` (identifiant local du lecteur +
adresse de la page) permet de retrouver la ligne du pouce quand le commentaire arrive ensuite, ou
quand le lecteur change d'avis. `Statut` est mis à « Nouveau » à la création seulement : un avis
déjà traité ne repasse pas en « Nouveau » si le lecteur ajoute un mot.

## Déploiement, une fois

1. **Jeton Airtable** — [airtable.com/create/tokens](https://airtable.com/create/tokens) → *Create
   token*. Portées `data.records:read` et `data.records:write`, accès limité à la seule base
   **Formations**. Copier le jeton (il ne s'affiche qu'une fois).
2. **Le Worker** — dans ce dossier :
   ```bash
   npx wrangler login
   npx wrangler secret put AIRTABLE_TOKEN     # coller le jeton
   npx wrangler deploy
   ```
   Wrangler affiche l'adresse du Worker, de la forme `https://avis-wiki.<votre-sous-domaine>.workers.dev`.

   Sans ligne de commande : Cloudflare → *Workers & Pages* → *Create* → *Start from Hello World*,
   coller `worker.js`, puis *Settings → Variables* pour `AIRTABLE_BASE`, `AIRTABLE_TABLE`,
   `ORIGINES` (texte) et `AIRTABLE_TOKEN` (**secret**).
3. **Brancher le site** — écrire l'adresse dans `docs/assets/avis.json` :
   ```json
   { "url": "https://avis-wiki.votre-sous-domaine.workers.dev", "base": "Formations", "table": "Avis wiki SST (web)" }
   ```
   puis commiter. C'est le seul fichier à changer : les pages le relisent au chargement, et le
   générateur ne l'écrase jamais.

Tant que `url` est vide, **le bloc d'avis reste invisible** sur toutes les pages : personne ne voit
un formulaire qui n'enverrait nulle part.

## Vérifier

```bash
curl -i -X POST https://avis-wiki.<sous-domaine>.workers.dev \
  -H 'Content-Type: application/json' -H 'Origin: https://frankyray21.github.io' \
  -d '{"ref":"essai·w/test.html","avis":"👍 Utile","page":"Essai","adresse":"w/test.html","wiki":"SST psychosociale","commentaire":"essai de branchement"}'
```

Réponse attendue : `{"ok":true,"mis_a_jour":false}`, et une ligne dans la table (à supprimer après
l'essai). Relancer la même commande doit répondre `"mis_a_jour":true` sans créer de seconde ligne.

## Ce que le relais refuse

- une origine hors de `ORIGINES` (403) ;
- un `avis` autre que « 👍 Utile » ou « 👎 À revoir » (400) ;
- une requête sans `ref` ni `adresse` (400).

Les textes sont coupés (commentaire 1 500 caractères, nom 80) et le `Wiki` n'est écrit que s'il
fait partie des huit valeurs attendues. En cas de panne d'Airtable, le relais répond 502 et le
navigateur remet l'avis dans sa file d'attente locale.
