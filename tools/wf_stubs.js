export const meta = {
  name: 'stubs-lot',
  description: 'Compléter un ou plusieurs lots de stubs psychosociaux à partir du vault seulement, chaque lot vérifié dès qu\'il est rédigé',
  phases: [{ title: 'Rédaction', detail: 'un agent par lot de 8' }, { title: 'Vérification', detail: 'par lot, dès qu\'il est prêt' }],
}
const LISTE = 'C:\\Users\\Frank\\AppData\\Local\\Temp\\claude\\C--Users-Frank-Claude-code\\0d2c4633-c3c2-4e53-bca8-68f39f006a6c\\scratchpad\\stubs-lots8.json'
const VAULT = 'C:\\Users\\Frank\\OneDrive\\Documents\\SST\\🏠 WIKI SST - Mines'
const SAUV = 'C:\\Users\\Frank\\Claude code\\Wiki_SST_Site\\sauvegarde-vault\\2026-09-01-stubs\\stubs-concepts'
const LOTS = Array.isArray(args) ? args : [args]

const FORMAT = `FORMAT DE LA PAGE COMPLÉTÉE (convention Fiche-concept du vault, sections en H3) :
---
(frontmatter existant CONSERVÉ, modifié ainsi : retirer les tags « stub » et « à-documenter », ajouter « concept » et un tag de thème ; statut: partiel ; qualité: partielle ; révision: 2026-09-02 ; ajouter aliases: ["<Titre lisible>"] si le nom de fichier est une forme technique comme « soutien-social »)
---

# <Titre lisible> (ex. « Soutien social au travail », jamais « soutien-social »)

<2-3 phrases vulgarisées sans titre : ce qu'est le concept et pourquoi il compte en SST minière, SEULEMENT si les sources le disent.>

### Définition
<définition tirée des sources, chaque source citée en wikilink [[Nom de la note]] en fin de phrase>

### <1 à 3 sections de fond aux titres parlants (mécanisme, facteurs, conséquences, mesure…), selon ce que les sources contiennent>

### Application terrain
<uniquement si une source parle du contexte de travail ou minier ; sinon omettre cette section>

### Ressources
- [[Note source 1]]
- [[Note source 2]]

[[00 - 🏠 Accueil|← Accueil]]

Longueur : 25 à 60 lignes. Le bloc « ⚠️ Stub créé automatiquement » et les « _À compléter._ » disparaissent. Le NOM DU FICHIER NE CHANGE PAS (des liens en dépendent).`

const REGLES = `RÈGLES ABSOLUES :
1. Chaque fait, définition, chiffre, auteur ou année provient d'une note du vault que tu as LUE EN ENTIER, citée en wikilink à côté. Rien de tes connaissances générales, même si tu es certain : Frank doit pouvoir retrouver chaque phrase dans son vault. C'est de la santé-sécurité.
2. Si les sources ne contiennent pas assez de matière (moins de 3 phrases vraiment sur ce concept), tu NE TOUCHES PAS au fichier et tu rapportes action: "archiver" avec la raison. Un stub honnête vaut mieux qu'une page inventée.
3. Interdiction du tiret long « — » (U+2014) et du demi-cadratin « – » (U+2013) : utilise « : », « - » ou « , ».
4. Jamais de [[X|alias]] dans une cellule de tableau ; préfère les listes.
5. Cherche des sources supplémentaires toi-même avec Grep dans ${VAULT} (singulier/pluriel, avec/sans accents, synonymes évidents) : les candidats du JSON sont une aide, pas une limite. Ignore les candidats hors sujet (un article du RSSM sur le gravier n'est pas une source sur la cohésion d'équipe).
6. Les notes « Analyse … (année) » du dossier « 70 - Documents et outils/Analyses sources » sont les meilleures sources : elles résument des publications scientifiques déjà validées par Frank.
7. ÉCRIS CHAQUE PAGE DÈS QU'ELLE EST PRÊTE (Write, une par une), jamais toutes à la fin : le travail doit survivre à une interruption.
8. Sois économe : lis les notes vraiment utiles, pas tout le vault.`

const SCHEMA_R = { type: 'object', required: ['resultats'], properties: { resultats: { type: 'array', items: { type: 'object', required: ['fichier', 'action'], properties: { fichier: { type: 'string' }, action: { type: 'string', enum: ['complété', 'archiver'] }, sources: { type: 'array', items: { type: 'string' } }, raison: { type: 'string' } } } } } }
const SCHEMA_V = { type: 'object', required: ['resultats'], properties: { resultats: { type: 'array', items: { type: 'object', required: ['fichier', 'verdict'], properties: { fichier: { type: 'string' }, verdict: { type: 'string', enum: ['ok', 'corrigé', 'rétabli-stub'] }, corrections: { type: 'array', items: { type: 'string' } } } } } } }

const res = await pipeline(LOTS,
  (k) => agent(`Tu complètes des pages « stub » (créées automatiquement le 2026-05-26, vides) du wiki SST psychosociale, vault Obsidian ${VAULT}, en n'utilisant QUE le contenu déjà présent dans le vault.
Lis le fichier JSON ${LISTE} : chaque entrée a f (chemin du stub), base, h1, terme, sources (notes candidates avec extrait) et lot. Tu traites UNIQUEMENT les entrées dont lot === ${k} (8 pages). Pour chacune : lis le stub, lis en entier les notes candidates pertinentes, cherche d'autres notes avec Grep, puis soit réécris le fichier complet (Write) au format ci-dessous, soit rapporte « archiver ».
${FORMAT}
${REGLES}
Réponds en JSON : resultats = liste de {fichier, action ('complété' ou 'archiver'), sources (noms des notes utilisées), raison (si archiver)}.`,
    { label: 'lot ' + k, phase: 'Rédaction', schema: SCHEMA_R }),
  (r, k) => {
    const faits = ((r && r.resultats) || []).filter((x) => x.action === 'complété')
    if (!faits.length) return Promise.resolve({ resultats: [] })
    return agent(`Tu es un VÉRIFICATEUR intransigeant. Des pages « stub » du wiki SST psychosociale (vault ${VAULT}) viennent d'être complétées par un autre agent. Elles ne doivent contenir AUCUN fait absent des notes sources citées : Frank doit pouvoir retrouver chaque phrase dans son vault.
Pages à vérifier (chemin ; sources déclarées) :
${faits.map((x) => `- ${x.fichier} ; ${(x.sources || []).join(' ; ')}`).join('\n')}
Pour CHAQUE page : (1) lis-la et lis EN ENTIER les notes sources citées (wikilinks [[…]], à retrouver avec Glob) ; (2) pour chaque phrase factuelle, retrouve le passage source exact ; (3) format : H1 lisible (pas la forme technique du nom de fichier), frontmatter modifié (plus de tag stub/à-documenter, statut partiel), aucun « Stub créé automatiquement » ni « _À compléter._ », sections H3, 25-60 lignes, AUCUN « — » ni « – », pas de [[X|alias]] dans un tableau, pied de page [[00 - 🏠 Accueil|← Accueil]].
CORRIGE SUR PLACE avec Edit : supprime toute phrase non traçable (jamais de remplacement par tes connaissances), remplace les tirets longs, répare le format. Si plus de la moitié du contenu n'est pas traçable, RÉTABLIS le stub d'origine en copiant le fichier de même nom depuis ${SAUV} (verdict 'rétabli-stub').
Réponds en JSON : resultats = liste de {fichier, verdict ('ok' | 'corrigé' | 'rétabli-stub'), corrections (phrases courtes)}.`,
      { label: 'vérif lot ' + k, phase: 'Vérification', schema: SCHEMA_V })
  })

const verdicts = res.filter(Boolean).flatMap((v) => v.resultats || [])
log(verdicts.length + ' pages vérifiées · ' + verdicts.filter((v) => v.verdict === 'rétabli-stub').length + ' rétablies en stub')
return { verdicts }
