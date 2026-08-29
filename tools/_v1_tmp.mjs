// Mesure le rendement réel des règles de qualite.mjs v1 sur le corpus — LECTURE SEULE
import fs from 'node:fs'; import path from 'node:path'; import * as yaml from 'js-yaml';
import { analyserQualite, LIBELLES } from './qualite.mjs';
const VAULT='C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const W=new Set(['Wiki Ergonomie','Wiki Hygiène industrielle','Wiki Toxicologie','Wiki Sécurité industrielle','Wiki Droit du travail','Wiki SST psychosociale','Recueil législatif SST']);
const EX=new Set(['.obsidian','.trash','99 - Templates','_À supprimer (vérifier puis effacer)','📥 PDF à téléverser']);
const P=[];(function w(d,r){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name.startsWith('.'))continue;
 if(e.isDirectory()){if(EX.has(e.name))continue;w(path.join(d,e.name),r?r+'/'+e.name:e.name);}
 else if(e.name.endsWith('.md')&&r&&W.has((r+'/'+e.name).split('/')[0]))P.push({relPath:r+'/'+e.name,a:path.join(d,e.name),base:e.name.slice(0,-3),wiki:(r+'/'+e.name).split('/')[0]});}})(VAULT,'');
for(const p of P){const raw=fs.readFileSync(p.a,'utf8');let fm={},b=raw;const m=raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
 if(m){try{fm=yaml.load(m[1])||{};}catch{}b=raw.slice(m[0].length);}p.fm=fm;p.body=b;
 p.loi=!!(fm.loi&&/^art[-.\s]*\d/i.test(p.base));}
const parCode=new Map();let avecDefaut=0;const parCodeLoi=new Map();
for(const p of P){const r=analyserQualite(p);if(!r.defauts.length)continue;avecDefaut++;
 for(const d of r.defauts){const M=p.loi?parCodeLoi:parCode;M.set(d.code,(M.get(d.code)||0)+1);}}
console.log('pages analysées',P.length,'· avec ≥1 défaut',avecDefaut,`(${(100*avecDefaut/P.length).toFixed(0)}%)`);
console.log('hors-loi :');for(const [c,n] of [...parCode].sort((a,b)=>b[1]-a[1]))console.log(`  ${String(n).padStart(5)} × ${LIBELLES[c]||c}`);
console.log('loi :');for(const [c,n] of [...parCodeLoi].sort((a,b)=>b[1]-a[1]))console.log(`  ${String(n).padStart(5)} × ${LIBELLES[c]||c}`);
