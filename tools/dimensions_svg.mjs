// Dimensions d'un schéma SVG, lues sur sa balise racine (width/height, sinon viewBox), pour les
// poser sur l'<img> : le navigateur réserve la place du schéma avant de le charger (chargement
// différé), la page ne saute pas et le lien de l'image garde une cible tactile à sa vraie taille.
export function dimensionsSvg(texte) {
  const racine = String(texte).match(/<svg\b[^>]*>/i)?.[0];
  if (!racine) return null;
  const attr = n => racine.match(new RegExp('\\s' + n + '="\\s*([\\d.]+)\\s*(?:px)?\\s*"', 'i'))?.[1];
  let w = attr('width'), h = attr('height');
  if (!w || !h) {
    const vb = racine.match(/\sviewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/i);
    if (vb) [w, h] = [vb[1], vb[2]];
  }
  if (!w || !h || !(+w > 0) || !(+h > 0)) return null;
  return { largeur: Math.round(+w), hauteur: Math.round(+h) };
}
