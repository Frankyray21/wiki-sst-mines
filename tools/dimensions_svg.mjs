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

// Dimensions d'une image PNG ou JPEG des infographies (une illustration fournie par l'auteur, par
// exemple), lues dans son en-tête : même usage, réserver sa place avant le chargement différé.
export function dimensionsImage(octets) {
  const b = Buffer.from(octets);
  if (b.length >= 24 && b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' && b.subarray(12, 16).toString('latin1') === 'IHDR') {
    return { largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20) };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    // segments JPEG jusqu'au premier en-tête de trame (SOFn, hors DHT, JPG et DAC)
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) return null;
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { largeur: b.readUInt16BE(i + 7), hauteur: b.readUInt16BE(i + 5) };
      if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7) || m === 0x01) { i += 2; continue; }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}
