// Rejoue dans le vault, en une commande, tout ce qui a été préparé sans accès au vault depuis le 25 septembre
// 2026 : les lots de retouches (content-updates/*.json : corrections, schémas, pages du recueil), puis le retrait
// des versions texte et les libellés de liens courts. Sans cela, la prochaine construction du site efface ces
// changements, publiés directement dans docs/.
//
//   node tools/rejouer_lots.mjs                essai : chaque lot est essayé, rien n'est écrit
//   node tools/rejouer_lots.mjs --appliquer    essai de TOUS les lots d'abord ; si aucun n'échoue, application
//                                              dans l'ordre (chaque note est sauvegardée avant d'être réécrite)
// Options : --vault "C:/…/WIKI SST - Mines"   --construire (lance build_site.mjs après l'application)
//           --dossier <lots> (content-updates par défaut)   --sans-outils (lots seulement)
//
// Un lot déjà appliqué est reconnu (« déjà faite ») : relancer le script est sans effet. Un lot qui échoue à
// l'essai (ligne introuvable, note ambiguë) empêche toute écriture : le message dit lequel, et pourquoi.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outils = path.dirname(fileURLToPath(import.meta.url));
const racine = path.dirname(outils);

// Ordre : corrections et titres du 25, valeurs silice et NO₂, schémas (25 puis 26), autres lots de pages du
// recueil, corrections du 27. Seuls les fichiers au format lot (note + retouches) sont pris.
export function lotsARejouer(dossier, { depuis = '2026-09-25' } = {}) {
  const lots = fs.readdirSync(dossier).filter(f => f.endsWith('.json') && f.slice(0, 10) >= depuis).filter(f => {
    try { const d = JSON.parse(fs.readFileSync(path.join(dossier, f), 'utf8')); return !!(d.note && Array.isArray(d.retouches)); }
    catch { return false; }
  });
  const rang = f => /^2026-09-25-(corr|titre-art-116)-/.test(f) ? 0
    : /-silice-no2-/.test(f) ? 1
    : /-schemas\.json$/.test(f) ? 2
    : /^2026-09-2[5-6]-/.test(f) ? 3
    : 4;
  return lots.sort((a, b) => rang(a) - rang(b) || (a < b ? -1 : a > b ? 1 : 0));
}

function lancer(script, args) {
  // les sauvegardes (sauvegarde-vault/…) vont, comme pour chaque outil, dans le dossier d'où l'on lance la commande
  const r = spawnSync(process.execPath, [path.join(outils, script), ...args], { cwd: process.cwd(), encoding: 'utf8' });
  return { code: r.status, sortie: (r.stdout || '') + (r.stderr || '') };
}

// Bilan d'une sortie de appliquer_retouches : nombre de retouches à faire, déjà faites, en échec.
export function bilan(sortie) {
  const n = motif => (sortie.match(new RegExp('^\\s+' + motif + ' ', 'gm')) || []).length;
  return { faites: n('✓'), deja: n('='), echecs: n('✗'), note: (sortie.match(/^Note : (.+)$/m) || [])[1] || '' };
}

const principal = path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url);
if (principal) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const APPLIQUER = args.includes('--appliquer');
  const VAULT = opt('--vault', 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines');
  const DOSSIER = path.resolve(opt('--dossier', path.join(racine, 'content-updates')));
  if (!fs.existsSync(VAULT)) { console.error(`Vault introuvable : ${VAULT} (--vault pour indiquer le chemin)`); process.exit(1); }
  const lots = lotsARejouer(DOSSIER);
  console.log(`${lots.length} lots à rejouer, vault : ${VAULT}\n`);

  // 1. essai de tous les lots
  const echecs = [];
  let aFaire = 0;
  for (const f of lots) {
    const r = lancer('appliquer_retouches.mjs', ['--lot', path.join(DOSSIER, f), '--vault', VAULT]);
    const b = bilan(r.sortie);
    aFaire += b.faites;
    const etat = r.code ? '✗' : b.faites ? '✓' : '=';
    console.log(`${etat} ${f}${r.code ? '' : ` : ${b.faites} à faire, ${b.deja} déjà faite(s)`}`);
    if (r.code) { echecs.push(f); console.log(r.sortie.split('\n').filter(l => /✗|Rien|notes répondent|aucune note|introuvable/.test(l)).map(l => '    ' + l.trim()).join('\n')); }
  }
  console.log(`\nEssai : ${lots.length - echecs.length} lots prêts (${aFaire} retouche(s) à faire), ${echecs.length} en échec.`);
  if (echecs.length) {
    console.log('Rien n’est écrit. Corriger les lots en échec (ou la note visée), puis relancer.');
    process.exit(1);
  }
  const outilsNettoyage = [['retirer_versions_texte.mjs', []], ['raccourcir_liens.mjs', []]];
  if (!APPLIQUER) {
    if (!args.includes('--sans-outils')) for (const [s, a] of outilsNettoyage) {
      const r = lancer(s, [...a, '--vault', VAULT]);
      console.log(`\n— ${s} (essai) —\n` + r.sortie.trim().split('\n').slice(-6).join('\n'));
    }
    console.log('\nEssai terminé : relancer avec --appliquer pour écrire.');
    process.exit(0);
  }

  // 2. application, dans le même ordre
  for (const f of lots) {
    const r = lancer('appliquer_retouches.mjs', ['--lot', path.join(DOSSIER, f), '--vault', VAULT, '--appliquer']);
    if (r.code) { console.error(`✗ ${f} a échoué à l'application :\n${r.sortie}`); process.exit(1); }
    const b = bilan(r.sortie);
    if (b.faites) console.log(`✓ ${f} : ${b.faites} retouche(s) appliquée(s)`);
  }
  if (!args.includes('--sans-outils')) for (const [s, a] of outilsNettoyage) {
    const r = lancer(s, [...a, '--vault', VAULT, '--appliquer']);
    console.log(`\n— ${s} —\n` + r.sortie.trim().split('\n').slice(-4).join('\n'));
    if (r.code) process.exit(1);
  }
  if (args.includes('--construire')) {
    const r = spawnSync(process.execPath, [path.join(outils, 'build_site.mjs')], { cwd: racine, stdio: 'inherit' });
    process.exit(r.status || 0);
  }
  console.log('\nAppliqué. Étape suivante : node tools/build_site.mjs');
}
