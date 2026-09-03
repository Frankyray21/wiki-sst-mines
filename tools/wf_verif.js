export const meta = {
  name: 'verif-stubs',
  description: 'Relire fait par fait des pages complétées et corriger sur place ce qui n\'est pas traçable',
  phases: [{ title: 'Vérification', detail: 'un agent par groupe de pages' }],
}
const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines'
const SAUV = 'C:/Users/Frank/Claude code/Wiki_SST_Site/sauvegarde-vault/2026-09-01-stubs/stubs-concepts'
const SCHEMA = { type: 'object', required: ['resultats'], properties: { resultats: { type: 'array', items: { type: 'object', required: ['fichier', 'verdict'], properties: { fichier: { type: 'string' }, verdict: { type: 'string', enum: ['ok', 'corrigé', 'rétabli-stub'] }, corrections: { type: 'array', items: { type: 'string' } } } } } } }
const FICHIERS = Array.isArray(args) ? args : [args]
const res = await parallel([FICHIERS].map((groupe, i) => () => agent(`Tu es un VÉRIFICATEUR intransigeant. Des pages du wiki SST psychosociale (vault ${VAULT}) ont été complétées par un autre agent à partir des notes du vault. Elles ne doivent contenir AUCUN fait absent des notes sources citées : Frank doit pouvoir retrouver chaque phrase dans son vault.

Pages à vérifier :
${groupe.map((f) => '- ' + f).join('\n')}

Pour CHAQUE page : (1) lis-la et lis EN ENTIER les notes sources citées (les wikilinks [[…]] de la page, à retrouver avec Glob dans le vault) ; (2) pour chaque phrase factuelle, retrouve le passage source exact ; méfie-toi particulièrement des superlatifs (« le mieux documenté », « le plus courant »), des liens causals et des affirmations de fréquence, qui sont rarement dans les sources ; (3) format : H1 lisible (pas la forme technique du nom de fichier), frontmatter sans tag stub et statut partiel, aucun « Stub créé automatiquement » ni « _À compléter._ », sections H3, 25-60 lignes, AUCUN « — » ni « – », pas de [[X|alias]] dans une cellule de tableau, pied de page [[00 - 🏠 Accueil|← Accueil]].

CORRIGE SUR PLACE avec Edit : supprime toute phrase non traçable (ne la remplace JAMAIS par tes connaissances), remplace les tirets longs, répare le format. Si plus de la moitié du contenu n'est pas traçable, RÉTABLIS le stub d'origine en copiant le fichier de même nom depuis ${SAUV} (verdict 'rétabli-stub').

Réponds en JSON : resultats = liste de {fichier, verdict ('ok' | 'corrigé' | 'rétabli-stub'), corrections (phrases courtes)}.`,
  { label: 'vérif ' + (i + 1), phase: 'Vérification', schema: SCHEMA })))
const verdicts = res.filter(Boolean).flatMap((v) => v.resultats || [])
log(verdicts.length + ' pages relues · ' + verdicts.filter((v) => v.verdict === 'corrigé').length + ' corrigées')
return { verdicts }
