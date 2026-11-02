# Espace travailleurs — format des questions et des pages

Ce dossier est la **source** de l'espace travailleurs (`docs/travailleurs/`). Le générateur
(`tools/espace_travailleurs.mjs`) le relit à chaque construction ; rien ici ne dépend du vault.

- `pages.json` — la liste des pages de l'espace, dans l'ordre, rangées par section.
- `pages/<slug>.md` — les pages écrites pour l'espace (sujets que le wiki ne traitait pas
  encore en s'adressant au travailleur).
- `questions/<slug>.json` — les questions d'une page (une page sans fichier n'a pas de
  questions : l'attestation se fait alors après la lecture seule).

## Questions — `questions/<slug>.json`

```json
{
  "page": "reclamation-cnesst",
  "questions": [
    { "id": "q1", "type": "choix", "question": "…?", "options": ["…", "…", "…"], "reponse": 0,
      "explication": "« citation exacte de la page » — phrase qui explique la bonne réponse." },
    { "id": "q2", "type": "multi", "question": "Coche les phrases vraies.", "options": ["…", "…", "…", "…"],
      "reponses": [0, 2], "explication": "…" },
    { "id": "q3", "type": "vf", "question": "Affirmation à juger.", "reponse": true, "explication": "…" },
    { "id": "q4", "type": "ordre", "question": "Remets ces étapes dans l'ordre.",
      "etapes": ["première étape", "deuxième", "troisième", "quatrième"], "explication": "…" },
    { "id": "q5", "type": "court", "question": "En tes mots, …?",
      "attendu": ["élément de réponse 1", "élément de réponse 2"], "explication": "…" }
  ]
}
```

Les cinq types :

| `type` | Ce que voit le travailleur | Corrigé |
| --- | --- | --- |
| `choix` | une seule bonne réponse parmi 3 ou 4 (boutons radio) | `reponse` : indice (0 = première option) |
| `multi` | « choisis la ou les réponses vraies » (cases à cocher), 4 ou 5 options | `reponses` : indices des vraies, au moins une, pas toutes |
| `vf` | Vrai ou Faux | `reponse` : `true` ou `false` |
| `ordre` | des étapes mélangées à remettre en ordre (flèches ↑ ↓) | `etapes` : **dans le bon ordre** (3 à 6) ; le site mélange l'affichage |
| `court` | une réponse écrite de quelques lignes | non corrigée automatiquement : `attendu` liste les éléments qu'une bonne réponse contient ; ils sont montrés au travailleur après l'envoi, et la réponse part au conseiller dans Airtable |

Règles :

1. **5 à 7 questions par page**, dont au moins une `choix`, une `multi`, une `vf` et une `court` ;
   une `ordre` dès que la page décrit des étapes ou une marche à suivre.
2. **Tout vient de la page.** Une question ne vérifie qu'un fait écrit dans la page. Rien de ce
   qu'on sait par ailleurs, même juste.
3. **`explication` cite la page** entre « » : au moins une citation **mot pour mot** de 15
   caractères ou plus (le contrôle `node tools/travailleurs/verifier.mjs` la cherche dans le texte
   de la page). Puis une phrase simple qui dit pourquoi.
4. **Tutoiement**, phrases courtes, mots de tous les jours : le lecteur est un foreur, un mineur,
   un mécanicien en arrêt de travail, pas un juriste. Pas de piège, pas de double négation, pas
   de « toutes ces réponses ». Les mauvaises options sont plausibles mais clairement fausses
   d'après la page.
5. Les `id` sont `q1`, `q2`… dans l'ordre. Le texte des options ne trahit pas la réponse (même
   longueur à peu près, pas de « toujours / jamais » réservés aux fausses).
6. Une affirmation de la page qui semble fausse ou douteuse ne fait **pas** l'objet d'une
   question : la signaler (fichier `questions/A-VERIFIER.md`).

## Pages écrites pour l'espace — `pages/<slug>.md`

```markdown
---
titre: "Tu viens de te blesser : les premières démarches"
resume: "Une phrase qui dit au travailleur ce qu'il va trouver dans la page."
revision: 2026-11-02
sources:
  - "LATMP, art. 265 (avis à l'employeur)"
  - "Page du wiki : Processus de réclamation CNESST"
---

Paragraphe d'ouverture (2 ou 3 phrases, tutoiement).

## Un intertitre

Texte, listes `-`, listes numérotées `1.`, **gras**, tableaux Markdown.

> [!warning] Titre de l'encadré
> Texte de l'encadré. Types : note, info, tip, warning, danger, important.

Lien vers une autre page de l'espace : [ta réclamation](reclamation-cnesst.html).
```

Règles :

1. **S'adresse au travailleur** (« tu »), langage simple, 400 à 900 mots, des intertitres `##`.
2. **Chaque fait juridique** (délai, pourcentage, qui paie, qui décide) vient du texte de loi du
   dépôt (`tools/textes-loi/LATMP.json`, `LSST.json`…) ou d'une page du wiki, et l'article est
   nommé dans le texte entre parenthèses, par exemple « (LATMP, art. 270) ». Rien de mémoire.
   Les `sources` du frontmatter listent les articles et les pages utilisés.
3. **Aucun lien hors de l'espace.** Les liens ne visent que d'autres pages de l'espace
   (`<slug>.html`, liste dans `pages.json`). Un article de loi est nommé en texte, pas lié.
   Aucune adresse web ni aucun numéro de téléphone qui ne figure pas déjà dans une page du
   wiki (`docs/w/`).
4. Ne donne **ni avis médical ni avis juridique personnel** : la page explique les règles et dit
   vers qui se tourner (CNESST, représentant à la prévention, syndicat, médecin, PAE).
5. Pas d'encadré « En bref » : la phrase `resume` en tient lieu.
