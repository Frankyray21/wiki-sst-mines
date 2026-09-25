// Fichier désigné par un renvoi d'image d'une note (![[…]]) : chemin relatif au dossier de la note, chemin
// complet dans le vault, puis nom de fichier seul. Quand plusieurs fichiers portent ce nom, le premier est
// retenu et le choix est rendu comme ambigu : le 25 septembre 2026, huit captures de cours publiées étaient
// une autre image du même nom (img-000.png, img-001.png…) prise dans un autre dossier du vault.
//
//   choisirImage(ref, { dir, wikiKey }, { parChemin, parNom }) → { rel, ambigu? }
//     parChemin  Map chemin en minuscules → chemin relatif au vault
//     parNom     Map nom de fichier en minuscules → [chemins relatifs au vault]
//     ambigu     les fichiers entre lesquels le choix s'est fait (le premier est retenu)
export function choisirImage(ref, from, { parChemin, parNom }) {
  const t = String(ref).trim();
  for (const essai of [from.dir + '/' + t, t]) {
    const trouve = parChemin.get(essai.toLowerCase());
    if (trouve) return { rel: trouve };
  }
  const cands = parNom.get(t.split('/').pop().toLowerCase());
  if (!cands || !cands.length) return { rel: null };
  if (cands.length === 1) return { rel: cands[0] };
  // un renvoi réduit au nom de fichier finit comme tous les candidats : il reste ambigu
  const suffixe = cands.filter(c => c.toLowerCase().endsWith('/' + t.toLowerCase()));
  const memeWiki = cands.filter(c => c.split('/')[0] === from.wikiKey);
  const choix = suffixe.length ? suffixe : memeWiki.length ? memeWiki : cands;
  return choix.length > 1 ? { rel: choix[0], ambigu: choix } : { rel: choix[0] };
}
