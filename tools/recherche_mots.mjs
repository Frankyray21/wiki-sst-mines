// Découpage d'une page en mots pour l'index plein texte (search-mots.json) : même normalisation
// que la recherche côté client (app.js) — minuscules, œ → oe, accents retirés — et mêmes règles
// (mots de trois lettres et plus, nombres de deux chiffres, sans les mots vides ci-dessous).
// Partagé entre le générateur et les retouches du site publié, pour qu'un mot ajouté après coup
// soit découpé exactement comme à la construction.
export const STOP = new Set(('le la les de des du un une et en au aux ou est sont pour par sur dans avec sans que qui dont ce cet cette ces se sa son ses leur leurs ne pas plus moins tout tous toute toutes comme mais donc car ni aussi ainsi entre vers chez sous selon lors puis afin etre avoir fait faire peut peuvent doit doivent elle elles ils lui nous vous votre vos notre nos meme memes autre autres cela ceci celui celle ceux celles ont ete etait sera soit').split(' '));
export const normIdx = (s) => String(s).toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function motsDePage(texte) {
  return new Set(normIdx(texte).split(/[^a-z0-9.]+/)
    .map(w => w.replace(/^\.+|\.+$/g, ''))
    .filter(w => (w.length >= 3 || (w.length === 2 && /^\d+$/.test(w))) && w.length <= 40 && !STOP.has(w)));
}

// Listes d'identifiants delta-encodées en base 36, comme dans search-mots.json.
export function encoderListe(ids) {
  let prev = 0;
  return ids.map(id => { const d = (id - prev).toString(36); prev = id; return d; }).join(',');
}
export function decoderListe(chaine) {
  let prev = 0;
  return chaine.split(',').map(d => (prev += parseInt(d, 36)));
}
