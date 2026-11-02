# Relais des attestations — `attestations-wiki-travailleurs`

Le Wiki prévention des travailleurs (`docs/travailleurs/`) est publié par GitHub Pages : il n'a pas de serveur.
Un jeton Airtable posé dans une page publique serait lisible, et utilisable, par n'importe qui.
Ce petit relais Cloudflare garde le jeton de son côté ; la page ne parle qu'à lui.

Même mécanique que vos Workers `attestations-procedures`, `attestations-tms` et
`attestations-rodbot`, avec les protections du relais des avis (`tools/avis-worker/`).

## Ce qu'il fait — et rien d'autre

| Requête | Rôle |
| --- | --- |
| `GET /` | État du service : `{ "ok": true, "service": "attestations-wiki-travailleurs", "configure": true }` |
| `GET /?q=<texte>` | Noms de la **Liste employé (registre formation)** qui contiennent le texte (2 lettres minimum, 8 noms au plus, accents et majuscules ignorés). Le travailleur choisit **son** nom dans cette liste. |
| `POST /` | Enregistre une attestation de lecture dans **Attestations Wiki SST travailleurs (web)** |

Aucune requête ne **lit** les attestations : personne ne peut, par ce relais, voir ce qu'un autre a
lu ou répondu. Les conseillers consultent la table dans Airtable.

## Ce qu'il écrit

Base **Formations** (`appmq82YjvEUglYZU`), table **Attestations Wiki SST travailleurs (web)**
(`tblh6H7GOXZUwgXor`, créée le 2 novembre 2026). Une ligne par page lue :

| Colonne | Exemple | D'où |
| --- | --- | --- |
| Nom | `Jean Tremblay` | nom choisi dans la liste |
| Employé | *(lien)* | relié par le relais : l'employé choisi, s'il porte bien ce nom ; sinon l'unique employé de ce nom exact |
| Page, Adresse, Lien, Section | `Comprendre le cadenassage en mine`, section `Risques et réflexes` … | la page lue ; les sections viennent de `tools/travailleurs/pages.json` (« etiquette ») et une nouvelle option du champ « Section » se crée d'elle-même (`typecast`) |
| Date | `2026-11-02` | jour au Québec, posé par le relais |
| Score, Pourcentage, Essais | `5/6 — 83 %`, `83`, `2` | questions corrigées automatiquement (note de passage 80 %) |
| Temps de lecture, Secondes lecture | `6 min 12 s`, `372` | temps actif sur la page, **montré au travailleur** quand il soumet ses réponses |
| Lecture estimée | `≈ 5 min` | 180 mots par minute |
| Temps sur les questions, Secondes questions | `3 min 05 s`, `185` | temps actif sur les questions |
| Réponses à développement | `Q : … / R : …` | à lire par un conseiller |
| Détail des réponses | `✔ q1 …` / `✘ q3 …` | chaque question corrigée |
| Révision page | `2026-05-22` | révision de la page lue |
| Statut | `Reçu` ou `À relier` | posé à la création seulement ; ensuite `Développement lu`, `Traité` à la main |
| Correction | | commentaire du conseiller, à la main |
| Réf | | clé technique : employé + page + jour — un renvoi met à jour la même ligne |

**À relier** : le nom n'a correspondu à aucun employé (ou à plusieurs). Le travailleur a coché
« Mon nom n'est pas dans la liste » et l'a écrit au long. Relier la ligne à la main.

## Déploiement, une fois

### Option A — depuis GitHub, sans ligne de commande (conseillé)

C'est ainsi qu'est branché `attestations-procedures` : chaque modification de ce dossier poussée
sur `main` redéploie le relais.

1. **dash.cloudflare.com** → **Workers & Pages** → **Create** → onglet **Workers** →
   **Import a repository** (« Connect to Git »).
2. Choisir le dépôt **Frankyray21/wiki-sst-mines**, branche **main**.
3. **Project name** : `attestations-wiki-travailleurs` (le même nom que dans `wrangler.toml`).
4. **Advanced settings → Root directory** (ou *Path*) : `tools/attestations-worker`.
   Commande de déploiement : `npx wrangler deploy` (la valeur proposée).
5. **Deploy**. Les variables (`AIRTABLE_BASE`, `AIRTABLE_TABLE`, `EMP_TABLE`, `EMP_NAME_FIELD`,
   `ORIGINES`, `SEUIL`) et les deux limites de débit viennent de `wrangler.toml` : rien à saisir.
6. Le jeton : Worker **attestations-wiki-travailleurs** → **Settings** → **Variables and Secrets** →
   **Add** → Type **Secret**, nom **`AIRTABLE_TOKEN`**, valeur : le jeton Airtable. Celui du
   Worker `attestations-procedures` convient tel quel (il a déjà `data.records:read`,
   `data.records:write` et l'accès à la base Formations). **Deploy**.

> Tant que la branche de travail n'est pas fusionnée dans `main`, choisir à l'étape 2 la branche
> qui contient ce dossier, puis revenir à `main` après la fusion (Settings → Build → Branch).

### Option B — coller le code dans le tableau de bord

1. **Workers & Pages** → **Create** → **Create Worker** → nom `attestations-wiki-travailleurs` →
   **Deploy**, puis **Edit code** : tout effacer, coller [`worker.js`](./worker.js), **Deploy**.
2. **Settings → Variables and Secrets** → ajouter en **Text** : `AIRTABLE_BASE` =
   `appmq82YjvEUglYZU`, `AIRTABLE_TABLE` = `tblh6H7GOXZUwgXor`, `EMP_TABLE` =
   `tbllKuNePDWZMr1cz`, `EMP_NAME_FIELD` = `Name`, `ORIGINES` = `https://frankyray21.github.io`,
   `SEUIL` = `80` ; puis en **Secret** : `AIRTABLE_TOKEN`.
3. Les limites de débit ne se déclarent pas par ce chemin : le relais fonctionne sans elles
   (il ne limite rien, c'est tout). L'option A ou C les pose.

### Option C — en ligne de commande

```bash
cd tools/attestations-worker
npx wrangler login
npx wrangler secret put AIRTABLE_TOKEN     # coller le jeton
npx wrangler deploy
```

### Brancher le site

L'adresse attendue est `https://attestations-wiki-travailleurs.frankyray-21.workers.dev` (même
sous-domaine que `attestations-procedures`). Elle est déjà écrite dans
`tools/travailleurs/pages.json` (`"relais"`). Si Cloudflare affiche une autre adresse, la
corriger là, puis :

```bash
node tools/espace_travailleurs.mjs     # réécrit docs/travailleurs/ (sans reconstruire le wiki)
```

et commiter. Tant que le relais ne répond pas, le site garde chaque attestation sur l'appareil du
travailleur et la renvoie à la visite suivante ; l'attestation à l'écran l'indique (« pas encore
transmise »).

## Vérifier

```bash
# 1. le service répond
curl https://attestations-wiki-travailleurs.frankyray-21.workers.dev
# → {"ok":true,"service":"attestations-wiki-travailleurs","configure":true}

# 2. la recherche de nom (remplacer « tr » par deux lettres d'un nom réel)
curl -H 'Origin: https://frankyray21.github.io' 'https://attestations-wiki-travailleurs.frankyray-21.workers.dev/?q=tr'
# → {"ok":true,"resultats":[{"id":"rec…","nom":"…"}, …]}

# 3. une attestation d'essai (à supprimer ensuite dans Airtable)
curl -i -X POST https://attestations-wiki-travailleurs.frankyray-21.workers.dev \
  -H 'Content-Type: application/json' -H 'Origin: https://frankyray21.github.io' \
  -d '{"nom":"Essai Branchement","adresse":"travailleurs/cadenassage.html","page":"Essai","section":"Les bases","score":"5/5 — 100 %","pourcentage":100,"essais":1,"tempsLecture":"4 min 00 s","secondesLecture":240}'
# → {"ok":true,"id":"rec…","relie":false,"mis_a_jour":false,"date":"…"} et une ligne « À relier »
```

Relancer la même commande le même jour doit répondre `"mis_a_jour":true` sans créer de seconde
ligne.

## Ce que le relais refuse

- une origine hors de `ORIGINES` (403), et **toute** origine si `ORIGINES` est absente (503) ;
  pour essayer en local, ajouter `http://localhost:8090` à `ORIGINES` ;
- plus de 10 attestations ou 60 recherches par minute et par adresse IP (429) ;
- une `adresse` qui n'est pas une page de l'espace (`travailleurs/<page>.html`), un nom de moins
  de 2 lettres, une section inconnue (400) ;
- un `pourcentage` sous `SEUIL` (400) : le site n'envoie l'attestation qu'après la réussite ;
- un corps qui n'est pas un objet JSON, ou qui dépasse 16 Ko — lu par morceaux et coupé (400, 413) ;
- un `lien` qui n'est pas une adresse https n'est simplement pas écrit.

**Panne ou refus.** Airtable en panne ou saturé : le relais répond 502 et le navigateur garde
l'attestation pour plus tard. Airtable qui refuse (jeton, table, colonne renommée : 4xx) : 422 avec
`definitif: true`, et le navigateur l'indique au travailleur au lieu de réessayer sans fin.

## Ce que ce relais n'est pas

La recherche de nom est publique comme l'est celle de `attestations-procedures` : quiconque connaît
l'adresse du relais et tape deux lettres voit jusqu'à 8 noms d'employés. Le relais n'en donne pas
davantage (ni profession, ni mine, ni formations), et la limite de débit freine l'énumération.
Les questions sont corrigées dans le navigateur : l'attestation atteste une lecture, pas un
examen surveillé.
