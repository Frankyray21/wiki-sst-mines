import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publierCnesst, integrer } from './rendu.mjs';
import { regenerer } from '../../regenerer_hors_ligne.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR,'../../..');
const IMPORT = "import { publierCnesst } from './modules/cnesst/rendu.mjs';";
const HOOK = 'publierCnesst(OUT);';
export function preparerGenerateur(source) {
  const hasImport = source.includes(IMPORT);
  const hasHook = source.includes(HOOK);
  if (hasImport && hasHook) return source;
  if (hasImport !== hasHook) throw new Error('Point de génération incomplet : intervention manuelle requise');
  const anchor = "import fs from 'node:fs';";
  const pwa = 'genererPwa(OUT, V);';
  if (source.split(anchor).length !== 2 || source.split(pwa).length !== 2) throw new Error('Générateur différent du contrat vérifié : aucune modification');
  return source.replace(anchor, IMPORT+'\n'+anchor).replace(pwa,'// Module CNESST : généré après les articles, avant les ressources hors ligne.\n'+HOOK+'\n'+pwa);
}
export function installer({ apply=false, root=ROOT }={}) {
  const tools = path.join(root,'tools');
  const out = path.join(root,'docs');
  const builder = path.join(tools,'build_site.mjs');
  const current = fs.readFileSync(builder,'utf8');
  const next = preparerGenerateur(current);
  const targets = ['w/psychosocial/cnesst-roles-et-pouvoirs.html','g/psychosocial/cnesst-roles-et-pouvoirs.html'];
  let count=0;
  for (const target of targets) {
    const file = path.join(out,target);
    if (!fs.existsSync(file)) continue;
    integrer(fs.readFileSync(file,'utf8'),'../'.repeat(target.split('/').length-1));
    count++;
  }
  if (!count) throw new Error('Article CNESST introuvable : aucune publication');
  if (!apply) return { dryRun:true, articles:count, generatorChange:current!==next };
  if (current!==next) {
    fs.writeFileSync(builder+'.cnesst-tmp',next);
    fs.renameSync(builder+'.cnesst-tmp',builder);
  }
  const result = publierCnesst(out);
  const offline = regenerer(out,tools);
  return { ...result, articles:count, offline:offline.empreinte };
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(installer({apply:process.argv.includes('--appliquer')}),null,2)); }
  catch(error) { console.error('Installation CNESST interrompue :',error.message); process.exitCode=1; }
}
