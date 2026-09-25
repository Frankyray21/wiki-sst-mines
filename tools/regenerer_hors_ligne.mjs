// Retouche de docs/ sans reconstruction complète (vault absent) : recopie les sources partagées
// (style.css, app.js) comme le fait build_site.mjs, puis réécrit le manifeste hors ligne en
// GARDANT l'estampille de version en place — les pages ne sont pas régénérées, leur « ?v= »
// reste valable, et seuls les fichiers réellement modifiés changent de hash (le service worker
// ne retélécharge qu'eux).
//   node tools/regenerer_hors_ligne.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { genererListeHorsLigne } from './pwa.mjs';

const outils = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(outils, '../docs');
const manifeste = path.join(OUT, 'assets', 'hors-ligne.json');
const { version } = JSON.parse(fs.readFileSync(manifeste, 'utf8'));
if (!/^\d{14}$/.test(version)) { console.error('Estampille de version illisible : ' + version); process.exit(1); }

for (const f of ['style.css', 'app.js']) fs.copyFileSync(path.join(outils, f), path.join(OUT, 'assets', f));
const r = genererListeHorsLigne(OUT, version);
console.log(`Manifeste hors ligne réécrit (version ${version} conservée) : ${r.pages} pages, ${r.medias} médias`);
