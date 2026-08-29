// Liste les notes du vault dont le fichier lui-même est endommagé (fin manquante).
// Ce n'est pas un problème de rédaction : c'est une perte de données à récupérer
// via l'historique de versions de OneDrive (clic droit sur le fichier → Historique des versions).
import fs from 'node:fs';
import path from 'node:path';

const VAULT = 'C:/Users/Frank/OneDrive/Documents/SST/\u{1F3E0} WIKI SST - Mines';
const abimes = [];

(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) { walk(path.join(dir, e.name), rel + e.name + '/'); continue; }
    if (!e.name.endsWith('.md')) continue;
    const p = path.join(dir, e.name);
    const b = fs.readFileSync(p);
    const nuls = b.filter(x => x === 0).length;
    const t = b.toString('utf8').trimEnd();
    const coupe = /\[\[[^\]]{0,40}$/.test(t) || /←\s*Accuei$/.test(t) || /\|←\s*Ac?$/.test(t);
    if (nuls || coupe) {
      abimes.push({
        chemin: rel + e.name,
        octets: b.length,
        nuls,
        fin: t.replace(/\u0000/g, '').slice(-70).replace(/\n/g, ' ⏎ '),
        modifie: fs.statSync(p).mtime.toISOString().slice(0, 16).replace('T', ' '),
      });
    }
  }
})(VAULT, '');

abimes.sort((a, b) => (b.nuls ? 1 : 0) - (a.nuls ? 1 : 0) || a.chemin.localeCompare(b.chemin, 'fr'));

const corrompus = abimes.filter(a => a.nuls);
let sortie = `# Notes endommagées — ${new Date().toISOString().slice(0, 10)}

${abimes.length} notes du vault ont un fichier dont la fin manque.
${corrompus.length} d'entre elles contiennent en plus des octets nuls, signature d'une écriture
interrompue (synchronisation coupée, ordinateur éteint pendant l'enregistrement).

## Comment les récupérer

Dans l'Explorateur Windows, clic droit sur le fichier → **Historique des versions**.
OneDrive conserve les versions précédentes : restaurer celle d'avant la troncature rend le texte perdu.
À faire en priorité sur les fichiers marqués « corrompu ».

---

`;

for (const groupe of [
  { titre: `## Fichiers corrompus (${corrompus.length}) — à restaurer en priorité`, liste: corrompus },
  { titre: `## Fichiers tronqués sans corruption (${abimes.length - corrompus.length})`, liste: abimes.filter(a => !a.nuls) },
]) {
  sortie += groupe.titre + '\n\n';
  for (const a of groupe.liste) {
    sortie += `- **${a.chemin}**\n  ${a.octets} octets · modifié le ${a.modifie}${a.nuls ? ` · ${a.nuls} octets nuls` : ''}\n  se termine par : « …${a.fin} »\n\n`;
  }
}

fs.writeFileSync('NOTES-ENDOMMAGEES.md', sortie);
console.log(`${abimes.length} notes endommagées, dont ${corrompus.length} corrompues.`);
console.log('Liste écrite dans NOTES-ENDOMMAGEES.md');
