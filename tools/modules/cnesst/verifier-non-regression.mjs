import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const dest=path.join(root,'cnesst-validation');fs.mkdirSync(dest,{recursive:true});
const phase=process.argv.includes('--avant')?'avant':'apres';
const tests=fs.readdirSync(path.join(root,'tools/tests')).filter(f=>/\.test\.(mjs|cjs)$/.test(f)).sort().map(f=>'tests/'+f);
const run=spawnSync(process.execPath,['--test',...tests],{cwd:path.join(root,'tools'),encoding:'utf8',maxBuffer:20*1024*1024});
if(run.error||run.signal)throw run.error||new Error('Tests interrompus : '+run.signal);
const text=run.stdout+'\n'+run.stderr;fs.writeFileSync(path.join(dest,phase+'.tap'),text);
const fails=[];
for(const match of run.stdout.matchAll(/^not ok \d+ - (.+)\n([\s\S]*?)(?=^# Subtest:|^1\.\.|^ok \d|^not ok \d|\s*$)/gm)){
 const failure=match[1];const start=match.index;const rest=run.stdout.slice(start);
 const block=rest.slice(0,rest.indexOf('\n  ...')>=0?rest.indexOf('\n  ...'):1200);
 const error=block.match(/^\s+error: (.+)$/m)?.[1]||'';
 fails.push({test:failure,error});
}
if(run.status!==0&&!fails.length)throw new Error('Échec des tests sans résultat interprétable; consulter '+phase+'.tap');
const stats={phase,exitCode:run.status,failures:fails,summary:run.stdout.split('\n').filter(l=>/^# (tests|pass|fail|skipped) /.test(l))};
fs.writeFileSync(path.join(dest,phase+'.json'),JSON.stringify(stats,null,2));
console.log(JSON.stringify(stats,null,2));
if(phase==='apres'){
 const before=JSON.parse(fs.readFileSync(path.join(dest,'avant.json'),'utf8'));
 const baseline=new Set(before.failures.map(x=>JSON.stringify(x)));
 const regressions=fails.filter(x=>!baseline.has(JSON.stringify(x)));
 if(regressions.length)throw new Error('Régression après intégration : '+JSON.stringify(regressions));
 const summary=`## Module CNESST — non-régression\n\n${stats.summary.join(' · ')}\n\nAucune nouvelle défaillance par rapport au même checkout avant intégration.\n${fails.length?'\nAnomalie(s) déjà présente(s), NON corrigée(s) dans ce chantier :\n'+fails.map(f=>'- '+f.test+' — '+f.error).join('\n'):'\nTous les tests existants réussissent.'}\n`;
 fs.writeFileSync(path.join(dest,'resume.md'),summary);
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
 if(fails.length)console.log('::warning::'+fails.length+' anomalie(s) déjà présente(s) dans le wiki; détails dans le résumé et les journaux avant/après.');
}
