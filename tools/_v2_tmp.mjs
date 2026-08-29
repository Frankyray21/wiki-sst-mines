import fs from 'node:fs'; import path from 'node:path'; import * as yaml from 'js-yaml';
import { analyserQualite } from './qualite.mjs';
const VAULT='C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const W=new Set(['Wiki Ergonomie','Wiki Hygiène industrielle','Wiki Toxicologie','Wiki Sécurité industrielle','Wiki Droit du travail','Wiki SST psychosociale','Recueil législatif SST']);
const EX=new Set(['.obsidian','.trash','99 - Templates','_À supprimer (vérifier puis effacer)','📥 PDF à téléverser']);
const P=[];(function w(d,r){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name.startsWith('.'))continue;
 if(e.isDirectory()){if(EX.has(e.name))continue;w(path.join(d,e.name),r?r+'/'+e.name:e.name);}
 else if(e.name.endsWith('.md')&&r&&W.has((r+'/'+e.name).split('/')[0]))P.push({relPath:r+'/'+e.name,a:path.join(d,e.name),base:e.name.slice(0,-3)});}})(VAULT,'');
for(const p of P){const raw=fs.readFileSync(p.a,'utf8');let fm={},b=raw;const m=raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
 if(m){try{fm=yaml.load(m[1])||{};}catch{}b=raw.slice(m[0].length);}p.fm=fm;p.body=b;p.loi=!!(fm.loi&&/^art[-.\s]*\d/i.test(p.base));}
const nu=s=>s.replace(/!\[\[[^\]]*\]\]/g,' ').replace(/\[\[([^\]]+)\]\]/g,(m,t)=>t.split('|').pop()).replace(/[*_`#>~=|]/g,' ');
const nbMots=s=>(nu(s).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)||[]).length;
let nPL=0, nPLvrai=0, exPL=[], nTr=0, exTr=[];
for(const p of P){const r=analyserQualite(p);
 for(const d of r.defauts){
  if(d.code==='phrases-longues'){nPL++;
   // vérité terrain : phrase réelle (hors tableau, liste, citation) de plus de 40 mots
   const ph=nu(p.body.replace(/^\|.*$/gm,' ').replace(/^\s*([-*+]|\d+[.)])\s.*$/gm,' ').replace(/^>.*$/gm,' ')).split(/(?<=[.!?…])\s+|\n{2,}/);
   const vraies=ph.filter(s=>(s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)||[]).length>40).length;
   if(vraies>0)nPLvrai++; else if(exPL.length<4)exPL.push(`${p.relPath} — signalée « ${d.texte} », or 0 phrase réelle >40 mots (page de ${nbMots(p.body)} mots)`);}
  if(d.code==='tronque'){nTr++; if(exTr.length<6)exTr.push(`${p.relPath} → fin du fichier : ${JSON.stringify(p.body.trimEnd().slice(-70))}`);}
 }}
console.log('phrases-longues signalées :',nPL,'· dont au moins une phrase réelle >40 mots :',nPLvrai,'· faux positifs :',nPL-nPLvrai);
exPL.forEach(e=>console.log('  FP:',e));
console.log('\ntronque signalées :',nTr);exTr.forEach(e=>console.log('  ',e));
