// Régénération du manifeste hors ligne sans reconstruction : l'estampille reste, mais le service
// worker change d'identité dès que le manifeste change (sinon un worker resté actif garderait
// l'ancien manifeste en mémoire et l'ancien noyau en cache).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { regenerer, marquerServiceWorker } from '../regenerer_hors_ligne.mjs';

const VERSION = '20260923190431';

function site() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'regen-hl-'));
  const out = path.join(d, 'docs'), outils = path.join(d, 'tools');
  fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
  fs.mkdirSync(outils);
  fs.writeFileSync(path.join(outils, 'style.css'), 'body{}\n');
  fs.writeFileSync(path.join(outils, 'app.js'), 'var a = 1;\r\n');
  fs.writeFileSync(path.join(out, 'assets', 'hors-ligne.json'), JSON.stringify({ version: VERSION, pages: [], medias: [] }));
  fs.writeFileSync(path.join(out, 'sw.js'), `// Service worker du WIKI SST — généré à la construction\nconst VERSION = '${VERSION}';\n`);
  fs.writeFileSync(path.join(out, 'page.html'), `<script>window.V='${VERSION}'</script><p>Avant</p>`);
  return { out, outils };
}

test('le service worker change d’identité quand le manifeste change, jamais son VERSION', () => {
  const { out, outils } = site();
  const lire = f => fs.readFileSync(path.join(out, f), 'utf8');
  const r1 = regenerer(out, outils);
  const sw1 = lire('sw.js');
  assert.equal(r1.version, VERSION);
  assert.equal(sw1.split('\n')[1], '// Manifeste hors ligne réécrit sans reconstruction : ' + r1.empreinte);
  assert.ok(sw1.includes(`const VERSION = '${VERSION}';`));
  assert.equal(lire('assets/app.js'), 'var a = 1;\r\n', 'sources partagées recopiées à l’octet près');
  const m1 = JSON.parse(lire('assets/hors-ligne.json'));
  assert.equal(m1.version, VERSION);
  assert.deepEqual(m1.pages.map(p => p[0]).sort(), ['assets/app.js', 'assets/style.css', 'page.html']);

  regenerer(out, outils);
  assert.equal(lire('sw.js'), sw1, 'relance sans changement : sw.js identique');

  fs.writeFileSync(path.join(out, 'page.html'), `<script>window.V='${VERSION}'</script><p>Après</p>`);
  const r3 = regenerer(out, outils);
  const sw3 = lire('sw.js');
  assert.notEqual(r3.empreinte, r1.empreinte);
  assert.notEqual(sw3, sw1, 'page modifiée : nouveau sw.js, donc nouveau worker installé');
  assert.equal(sw3.split('\n').filter(l => l.startsWith('// Manifeste hors ligne')).length, 1, 'une seule ligne d’empreinte');
  assert.equal(JSON.parse(lire('assets/hors-ligne.json')).version, VERSION, 'estampille conservée');
});

test('marquage du service worker : inséré sous l’en-tête, puis remplacé', () => {
  const sw = '// en-tête\nconst VERSION = \'1\';\n';
  const a = marquerServiceWorker(sw, 'aaaaaaaaaa');
  assert.equal(a, '// en-tête\n// Manifeste hors ligne réécrit sans reconstruction : aaaaaaaaaa\nconst VERSION = \'1\';\n');
  assert.equal(marquerServiceWorker(a, 'bbbbbbbbbb'), a.replace('aaaaaaaaaa', 'bbbbbbbbbb'));
});
