// Correctif de chantier exécuté une fois par la validation, puis retiré du commit final.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const edits=new Map();
function replace(file,oldText,newText){
 const p=path.join(dir,file); const s=edits.get(p)??fs.readFileSync(p,'utf8');
 if(s.split(oldText).length!==2)throw new Error('Correctif ambigu : '+file);
 edits.set(p,s.replace(oldText,newText));
}
replace('rendu.mjs',"if(['light','dark','auto'].includes(t))document.documentElement.dataset.theme=t","if(t==='light'||t==='auto')document.documentElement.setAttribute('data-theme',t)");
replace('rendu.mjs','/<link data-ci-asset="style"[^>]*>/g','/<link data-ci-asset="style"[^>]*>\\n?/g');
replace('rendu.mjs','/<script data-ci-asset="script"[^>]*><\\/script>/g','/<script data-ci-asset="script"[^>]*><\\/script>\\n?/g');
replace('cnesst.test.mjs',"// Normalisation des seuls sauts de ligne : les documents restent sémantiquement identiques.\n  assert.equal(twice.replace(/\\n/g,''),once.replace(/\\n/g,''));","assert.equal(twice,once);");
const test=path.join(dir,'cnesst.test.mjs');
edits.set(test,edits.get(test)+"\ntest('Le thème autonome suit le contrat du wiki : sombre par défaut',()=>{\n  assert.ok(rendrePage().includes(\"if(t==='light'||t==='auto')\"));\n});\n");
const css=path.join(dir,'styles.css');
edits.set(css,fs.readFileSync(css,'utf8')+`\n/* À petite largeur, conserver les mots entiers plutôt que réduire la police. */
@container cnesst (max-width: 23em) {
  .ci-root .ci-tabs { grid-template-columns: 1fr; }
  .ci-root .ci-tabs a { flex-direction: row; justify-content: flex-start; padding-inline: .85em; }
}
.ci-root .ci-actors { align-items: stretch; }
.ci-root .ci-actor:not([open]) > summary { height: 100%; justify-content: center; }
`);
for(const [p,text] of edits)fs.writeFileSync(p,text);
console.log('Thème, mobile et idempotence corrigés; tests renforcés.');
