import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { contenu, valider, rendreModule, rendrePage, integrer, publierCnesst } from './rendu.mjs';
import { preparerGenerateur } from './installer.mjs';
const fixture = '<!doctype html>\n<html><head><title>Article</title>\n</head><body><div class="page-body"><p id="ancien">Texte original</p><h2 id="presentation">Présentation</h2><p id="suite">Suite intacte.</p></div>\n</body></html>';

test('Trois volets, trois cas et douze échanges valides',()=>{
  assert.equal(valider(contenu),true);
  assert.equal(contenu.branches.length,3); assert.equal(contenu.cases.length,3); assert.equal(contenu.exchanges.length,12);
});
test('Source ou acteur absent : échec explicite',()=>{
  const d=structuredClone(contenu); d.exchanges[0].to=['inconnu']; assert.throws(()=>valider(d));
  const s=structuredClone(contenu); s.exchanges[0].sources=['introuvable']; assert.throws(()=>valider(s));
});
test('Un identifiant dupliqué est rejeté',()=>{
  const d=structuredClone(contenu); d.exchanges[0].id=d.exchanges[1].id; assert.throws(()=>valider(d));
});
test('Le cas de manutention garde deux volets; le cas de harcèlement en garde trois',()=>{
  assert.equal(contenu.cases.find(c=>c.id==='manutention').lessons.length,2);
  assert.equal(contenu.cases.find(c=>c.id==='harcelement').lessons.length,3);
});
test('Médiation volontaire et Tribunal distinct',()=>{
  const mediation=contenu.exchanges.find(e=>e.id==='n-mediation');
  assert.equal(mediation.via,'cnesst'); assert.equal(mediation.type,'dialogue');
  assert.match(mediation.note,/accord des parties/);
  assert.deepEqual(contenu.exchanges.find(e=>e.id==='n-tribunal').to,['tat']);
});
test('Tous les détails sont présents avant JavaScript, sans identifiant HTML dupliqué',()=>{
  const html=rendreModule(); const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const e of contenu.exchanges) assert.ok(html.includes(`id="ci-${e.id}"`));
  assert.equal((html.match(/data-ci-panel=/g)||[]).length,3);
  assert.equal((html.match(/data-ci-exchange=/g)||[]).length,12);
  assert.ok(!html.includes('undefined'));
});
test('Les liens internes ont des cibles locales connues dans le module',()=>{
  const html=rendreModule(); const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(m[1]),m[1]);
});
test('Rendu autonome sans dépendance réseau obligatoire',()=>{
  const html=rendrePage({inline:true});
  assert.ok(html.includes('<style>')); assert.ok(html.includes('data-cnesst-module'));
  assert.ok(!html.includes('<script src=')); assert.ok(!html.includes('type="module"'));
});
test('Injection sans remplacement du texte et des ancres existantes',()=>{
  const html=integrer(fixture);
  for(const text of ['id="ancien"','Texte original','id="suite"','Suite intacte.','id="presentation"']) assert.ok(html.includes(text));
  assert.equal((html.match(/data-cnesst-module/g)||[]).length,1);
  assert.equal((html.match(/data-ci-asset="style"/g)||[]).length,1);
});
test('Injection rejouable sans duplication de contenu ou de ressources',()=>{
  const once=integrer(fixture); const twice=integrer(once);
  // Normalisation des seuls sauts de ligne : les documents restent sémantiquement identiques.
  assert.equal(twice.replace(/\n/g,''),once.replace(/\n/g,''));
});
test('Une ancre inconnue ne déclenche jamais une insertion au hasard',()=>{
  assert.throws(()=>integrer('<html><head></head><body>Autre page</body></html>'));
});
test('Point de génération unique, avant le manifeste, et installation idempotente',()=>{
  const src="import fs from 'node:fs';\n// articles générés\ngenererPwa(OUT, V);\n";
  const patched=preparerGenerateur(src);
  assert.equal(preparerGenerateur(patched),patched);
  assert.ok(patched.indexOf('publierCnesst(OUT);')<patched.indexOf('genererPwa(OUT, V);'));
  assert.throws(()=>preparerGenerateur('// structure inconnue'));
});
test('Après une nouvelle génération de l’article, le post-traitement rétablit le module',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cnesst-'));
  try {
    const page=path.join(dir,'w/psychosocial/cnesst-roles-et-pouvoirs.html'); fs.mkdirSync(path.dirname(page),{recursive:true});
    fs.writeFileSync(page,fixture); publierCnesst(dir);
    assert.ok(fs.readFileSync(page,'utf8').includes('data-cnesst-module'));
    fs.writeFileSync(page,fixture); publierCnesst(dir);
    assert.ok(fs.readFileSync(page,'utf8').includes('data-cnesst-module'));
    assert.ok(fs.existsSync(path.join(dir,'modules/cnesst/interactions.js')));
    assert.ok(fs.existsSync(path.join(dir,'modules/cnesst/index.html')));
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
