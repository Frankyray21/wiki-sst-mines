// Retouche de docs/ sans reconstruction complète (vault absent) : recopie les sources partagées
// (style.css, app.js) comme le fait build_site.mjs, puis réécrit le manifeste hors ligne en
// GARDANT l'estampille de version en place — les pages ne sont pas régénérées, leur « ?v= »
// reste valable, et seuls les fichiers réellement modifiés changent de hash (le service worker
// ne retélécharge qu'eux).
//
// Le service worker reçoit quand même une nouvelle identité : un navigateur n'installe un nouveau
// worker que si sw.js change. Sans cela, un worker resté actif garderait en mémoire l'ancien
// manifeste (même version que son VERSION) et le noyau (style.css, app.js) mis en cache à son
// installation. Une ligne d'empreinte du manifeste suffit : à manifeste identique, sw.js identique.
//   node tools/regenerer_hors_ligne.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { genererListeHorsLigne } from './pwa.mjs';

const REPERE = '// Manifeste hors ligne réécrit sans reconstruction : ';

// sw.js avec la ligne d'empreinte, juste sous l'en-tête (remplacée si elle existe déjà).
export function marquerServiceWorker(texteSw, empreinte) {
  const lignes = texteSw.split('\n');
  const i = lignes.findIndex(l => l.startsWith(REPERE));
  if (i >= 0) lignes[i] = REPERE + empreinte;
  else lignes.splice(1, 0, REPERE + empreinte);
  return lignes.join('\n');
}

export function regenerer(OUT, outils) {
  const manifeste = path.join(OUT, 'assets', 'hors-ligne.json');
  const { version } = JSON.parse(fs.readFileSync(manifeste, 'utf8'));
  if (!/^\d{14}$/.test(version)) throw new Error('Estampille de version illisible : ' + version);
  for (const f of ['style.css', 'app.js']) fs.copyFileSync(path.join(outils, f), path.join(OUT, 'assets', f));
  const r = genererListeHorsLigne(OUT, version);
  const empreinte = crypto.createHash('sha1').update(fs.readFileSync(manifeste)).digest('hex').slice(0, 10);
  const sw = path.join(OUT, 'sw.js');
  fs.writeFileSync(sw, marquerServiceWorker(fs.readFileSync(sw, 'utf8'), empreinte));
  return { ...r, version, empreinte };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outils = path.dirname(fileURLToPath(import.meta.url));
  try {
    const r = regenerer(path.resolve(outils, '../docs'), outils);
    console.log(`Manifeste hors ligne réécrit (version ${r.version} conservée) : ${r.pages} pages, ${r.medias} médias ; service worker marqué ${r.empreinte}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
