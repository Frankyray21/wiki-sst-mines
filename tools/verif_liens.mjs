// Vérification des fichiers ET des fragments, y compris les ancres dans la même page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const decodeHtml = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

export function verifierLiens(out, cibles = ['.']) {
  let total = 0, fragments = 0;
  const erreurs = [], cache = new Map();
  const htmlDe = file => {
    if (!cache.has(file)) {
      const html = fs.readFileSync(file, 'utf8');
      cache.set(file, { html, ids: new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => decodeHtml(m[1]))) });
    }
    return cache.get(file);
  };
  function fichiers(dir) {
    if (fs.statSync(dir).isFile()) return dir.endsWith('.html') ? [dir] : [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? fichiers(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []);
  }
  for (const cible of cibles) {
    const root = path.resolve(out, cible);
    if (!fs.existsSync(root)) { erreurs.push({ page: cible, href: cible, cause: 'Périmètre absent' }); continue; }
    for (const file of fichiers(root)) {
      for (const m of htmlDe(file).html.matchAll(/href="([^"]+)"/g)) {
        const href = decodeHtml(m[1]);
        if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href) || href === '#') continue;
        const hash = href.indexOf('#');
        let chemin = (hash < 0 ? href : href.slice(0, hash)).split('?')[0];
        let fragment = hash < 0 ? '' : href.slice(hash + 1);
        try { chemin = decodeURIComponent(chemin); fragment = decodeURIComponent(fragment); }
        catch { erreurs.push({ page: path.relative(out, file), href, cause: 'Encodage invalide' }); continue; }
        let target = chemin ? path.resolve(path.dirname(file), chemin) : file;
        total++;
        if (!fs.existsSync(target)) { erreurs.push({ page: path.relative(out, file), href, cause: 'Fichier absent' }); continue; }
        if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
        if (!fs.existsSync(target)) { erreurs.push({ page: path.relative(out, file), href, cause: 'Index absent' }); continue; }
        if (fragment && target.endsWith('.html')) {
          fragments++;
          if (!htmlDe(target).ids.has(fragment)) erreurs.push({ page: path.relative(out, file), href, cause: 'Ancre absente' });
        }
      }
    }
  }
  return { total, fragments, erreurs };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = verifierLiens(OUT, process.argv[2] ? [process.argv[2]] : ['.']);
  console.log('Liens internes vérifiés : ' + result.total + ' · fragments vérifiés : ' + result.fragments + ' · erreurs : ' + result.erreurs.length);
  result.erreurs.slice(0, 20).forEach(e => console.log(e.cause + ' : ' + e.page + ' → ' + e.href));
  if (result.erreurs.length) process.exitCode = 1;
}
