import fs from 'node:fs'; import path from 'node:path';
const VAULT='C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const W=new Set(['Wiki Ergonomie','Wiki Hygiène industrielle','Wiki Toxicologie','Wiki Sécurité industrielle','Wiki Droit du travail','Wiki SST psychosociale','Recueil législatif SST']);
const P=[];(function w(d,r){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name.startsWith('.'))continue;
 if(e.isDirectory())w(path.join(d,e.name),r?r+'/'+e.name:e.name);
 else if(e.name.endsWith('.md')&&r&&W.has((r+'/'+e.name).split('/')[0]))P.push({r:r+'/'+e.name,a:path.join(d,e.name)});}})(VAULT,'');
let nul=[],tail=[];
for(const p of P){const b=fs.readFileSync(p.a,'utf8');
 if(b.includes('\u0000'))nul.push(p.r);
 const f=b.trimEnd();
 if(/\[\[[^\]\n]{0,60}$/.test(f))tail.push(p.r+' → '+JSON.stringify(f.slice(-45)));}
console.log('fichiers contenant un octet NUL :',nul.length);nul.slice(0,15).forEach(x=>console.log('  ',x));
console.log('\nfichiers se terminant sur un wikilink jamais refermé :',tail.length);tail.slice(0,12).forEach(x=>console.log('  ',x));
