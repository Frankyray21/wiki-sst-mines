export const meta = {
  name: 'corriger-recueil',
  description: 'Vérifier des notes d articles de loi contre leur capture officielle et corriger titre, sujet et résumé',
  phases: [{ title: 'Correction', detail: 'un agent par lot de 12 articles' }],
}
const LISTE = 'C:/Users/Frank/AppData/Local/Temp/claude/C--Users-Frank-Claude-code/0d2c4633-c3c2-4e53-bca8-68f39f006a6c/scratchpad/recueil-prioritaires.json'
const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/🏠 WIKI SST - Mines'
const LOTS = Array.isArray(args) ? args : [args]

const SCHEMA = {
  type: 'object', required: ['resultats'],
  properties: { resultats: { type: 'array', items: { type: 'object', required: ['article', 'verdict'], properties: {
    article: { type: 'string' },
    verdict: { type: 'string', enum: ['conforme', 'corrigé', 'sans-capture', 'à-voir'] },
    probleme: { type: 'string' },
    correction: { type: 'string' },
  } } } },
}

const CONSIGNES = `Chaque note d article du Recueil contient : un titre H1, un lien LegisQuébec, une CAPTURE D ÉCRAN du texte officiel (image PNG, que tu ouvres avec Read), puis un encadré « > [!abstract] En bref » qui doit SYNTHÉTISER l article.

LA CAPTURE FAIT FOI. Un sondage sur 45 articles a montré que 68 % des notes divergent de leur propre capture, de trois façons :
- le résumé appartient à un autre article, décalé d un ou deux numéros ;
- le résumé est coupé net, en plein mot ou en pleine énumération, ce qui ampute la règle ;
- le titre H1 est fabriqué à partir du nom de fichier et ne veut rien dire (« travailleur qui réintègre son »), voire annonce un autre sujet.

Pour CHAQUE article de ton lot :
1. Ouvre la note, puis ouvre sa capture PNG avec Read et lis le texte officiel.
2. Compare la capture avec le titre H1, le champ « sujet » du frontmatter et l encadré « En bref ».
3. Si tout concorde et que le résumé est une synthèse complète, verdict « conforme », tu ne touches à rien.
4. Sinon, CORRIGE : réécris le titre H1 et l encadré « En bref » d après la capture, en trois à cinq puces qui portent les chiffres exacts (seuils, délais, pourcentages, durées), et mets le champ « sujet » d accord. Mets « révision: 2026-09-03 ».
5. Si la capture manque ou est illisible, verdict « sans-capture » : tu ne touches pas au fond, tu ne devines rien.

RÈGLE ABSOLUE, tirée des conventions écrites du vault (« Recueil législatif SST/99 - Templates/Conventions du recueil.md », ligne 172) : le bloc « En bref » SYNTHÉTISE, il ne TRANSCRIT JAMAIS le texte de loi. Un résumé qui recopie la capture mot pour mot est fautif même s il est exact : reformule-le.

NE RENOMME AUCUN FICHIER : des milliers de liens en dépendent. Si le nom du fichier reste trompeur après ta correction, ajoute le libellé exact dans le champ « aliases » du frontmatter et signale-le dans « probleme ».

Interdiction du tiret cadratin U+2014 et du demi-cadratin U+2013 : deux-points, trait d union ou virgule.

Enregistre chaque note dès qu elle est finie : le travail doit survivre à une interruption.`

const res = await parallel(LOTS.map((k) => () => agent(`${CONSIGNES}

Lis le fichier JSON ${LISTE} : chaque entrée a f (chemin de la note), base (nom), n (nombre de renvois qui la visent) et lot. Tu traites UNIQUEMENT les entrées dont lot === ${k}, soit 12 articles. Ce sont les articles les plus cités du vault, ceux dont un résumé faux trompe le plus de lecteurs.

Le vault est à ${VAULT}.

Réponds en JSON : resultats = liste de {article, verdict, probleme, correction}.`,
  { label: 'lot ' + k, phase: 'Correction', schema: SCHEMA })))

const tous = res.filter(Boolean).flatMap((x) => x.resultats || [])
const c = {}
tous.forEach((x) => { c[x.verdict] = (c[x.verdict] || 0) + 1 })
log(tous.length + ' articles vérifiés · ' + JSON.stringify(c))
return { resultats: tous }
