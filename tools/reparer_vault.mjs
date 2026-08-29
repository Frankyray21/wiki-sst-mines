// Répare les défauts MÉCANIQUES des notes endommagées, sans jamais inventer de contenu :
//  - retire les octets nuls et les caractères de remplacement (U+FFFD) issus d'écritures interrompues
//  - referme un wikilink final tronqué QUAND une seule note du vault correspond au fragment
//  - remplace un pied de page amputé (« ← Accuei ») par le pied de page standard du vault
//  - sinon, retire le fragment illisible (il s'affichait comme du « [[ » brut au lecteur)
// Chaque fichier modifié est d'abord copié dans un dossier de sauvegarde.
// Le texte réellement perdu reste à récupérer via l'historique de versions OneDrive.
import fs from 'node:fs';
import path from 'node:path';

const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const SAUVEGARDE = path.resolve('sauvegarde-vault', new Date().toISOString().slice(0, 10));
const ESSAI = process.argv.includes('--essai'); // ne rien écrire, seulement rapporter

// index des noms de notes pour compléter les fragments
const bases = [];
(function walk(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) walk(path.join(d, e.name), rel + e.name + '/');
    else if (e.name.endsWith('.md')) bases.push({ base: e.name.slice(0, -3), rel: rel + e.name });
  }
})(VAULT, '');

function completer(fragment) {
  const f = fragment.trim().toLowerCase();
  if (f.length < 6) return null; // trop court pour être sûr
  const candidats = bases.filter(b =>
    b.base.toLowerCase().startsWith(f) || b.rel.slice(0, -3).toLowerCase().startsWith(f));
  if (candidats.length === 1) return candidats[0].base;
  const parBase = [...new Set(candidats.map(c => c.base))];
  return parBase.length === 1 ? parBase[0] : null;
}

const actions = [];
for (const { rel } of bases.map(b => ({ rel: b.rel }))) {
  const abs = path.join(VAULT, rel);
  const brut = fs.readFileSync(abs);
  let texte = brut.toString('utf8');
  const faits = [];

  if (brut.includes(0)) {
    texte = texte.replace(/\u0000+/g, '');
    faits.push('octets nuls retirés');
  }
  if (texte.includes('\uFFFD')) {
    texte = texte.replace(/\uFFFD+/g, '');
    faits.push('caractères de remplacement retirés');
  }

  // wikilink final jamais refermé
  const fin = texte.trimEnd();
  const m = fin.match(/\[\[([^\[\]]{0,80})$/);
  if (m) {
    const avant = fin.slice(0, fin.length - m[0].length);
    const frag = m[1];
    if (/🏠 WIKI SST|Accuei/i.test(frag) || /←\s*Accuei/.test(frag)) {
      texte = avant.trimEnd() + '\n\n[[00 - 🏠 Accueil|← Accueil]]\n';
      faits.push('pied de page reconstruit');
    } else {
      const complet = completer(frag.split('|')[0]);
      if (complet) {
        texte = avant + '[[' + complet + ']]\n';
        faits.push(`lien refermé vers « ${complet} »`);
      } else {
        // le fragment ne correspond à rien d'identifiable : on retire ce débris,
        // en coupant à la dernière ligne complète
        const coupe = avant.replace(/[\n\r]+[^\n]*$/, '\n');
        texte = coupe.trimEnd() + '\n';
        faits.push(`fragment illisible retiré (« [[${frag.slice(0, 40)} »)`);
      }
    }
  }

  // pied amputé sans wikilink ouvert (« …|← Accuei » déjà géré ci-dessus via [[)
  if (/←\s*Accuei$/.test(texte.trimEnd()) && !/←\s*Accueil\]\]/.test(texte)) {
    texte = texte.trimEnd().replace(/\[\[[^\n]*←\s*Accuei$/, '') .trimEnd() + '\n\n[[00 - 🏠 Accueil|← Accueil]]\n';
    faits.push('pied de page reconstruit');
  }

  if (!faits.length) continue;
  if (!texte.endsWith('\n')) texte += '\n';

  if (!ESSAI) {
    const dest = path.join(SAUVEGARDE, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    fs.writeFileSync(abs, texte);
  }
  actions.push({ rel, faits });
}

console.log(`${actions.length} note(s) réparée(s)${ESSAI ? ' (ESSAI : rien écrit)' : ` · sauvegardes dans ${SAUVEGARDE}`}`);
for (const a of actions) console.log(`  ${a.rel}\n    → ${a.faits.join(' · ')}`);
