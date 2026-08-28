// Recompression PNG SANS PERTE : truecolor 24 bits → palette 8 bits.
// Les captures d'articles de loi sont du texte noir sur blanc : elles tiennent
// largement sous 256 couleurs, mais sont stockées en 3 octets par pixel.
// Aucune dépendance externe : décodage et encodage via zlib natif.
// Garde-fou : au-delà de 256 couleurs distinctes, on recopie l'original tel quel.
import fs from 'node:fs';
import zlib from 'node:zlib';

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// ---------- décodage ----------
function lirePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) return null;
  let pos = 8, ihdr = null, idat = [], plte = null, trns = null, interlace = 0;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0), height: data.readUInt32BE(4),
        depth: data[8], colorType: data[9], interlace: data[12],
      };
      interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (!ihdr || !idat.length || interlace !== 0) return null;
  if (ihdr.depth !== 8) return null;                       // on ne traite que le 8 bits par canal
  if (![2, 6].includes(ihdr.colorType)) return null;       // RGB ou RGBA seulement
  const canaux = ihdr.colorType === 2 ? 3 : 4;
  let brut;
  try { brut = zlib.inflateSync(Buffer.concat(idat)); } catch { return null; }
  const { width: W, height: H } = ihdr;
  const ligne = W * canaux;
  if (brut.length < H * (ligne + 1)) return null;
  const px = Buffer.alloc(H * ligne);
  let prev = Buffer.alloc(ligne);
  for (let y = 0; y < H; y++) {
    const filtre = brut[y * (ligne + 1)];
    const src = brut.subarray(y * (ligne + 1) + 1, y * (ligne + 1) + 1 + ligne);
    const cur = px.subarray(y * ligne, (y + 1) * ligne);
    src.copy(cur);
    for (let i = 0; i < ligne; i++) {
      const a = i >= canaux ? cur[i - canaux] : 0;
      const b = prev[i];
      const c = i >= canaux ? prev[i - canaux] : 0;
      switch (filtre) {
        case 1: cur[i] = (cur[i] + a) & 0xff; break;
        case 2: cur[i] = (cur[i] + b) & 0xff; break;
        case 3: cur[i] = (cur[i] + ((a + b) >> 1)) & 0xff; break;
        case 4: {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
          break;
        }
      }
    }
    prev = cur;
  }
  return { ...ihdr, canaux, px };
}

// ---------- encodage palettisé ----------
function encoderPalette(img) {
  const { width: W, height: H, canaux, px } = img;
  const map = new Map();
  const palette = [];
  const alphas = [];
  const idx = Buffer.alloc(W * H);
  for (let i = 0, n = 0; i < px.length; i += canaux, n++) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const a = canaux === 4 ? px[i + 3] : 255;
    const cle = (a << 24 | r << 16 | g << 8 | b) >>> 0;
    let k = map.get(cle);
    if (k === undefined) {
      if (map.size >= 256) return null;  // garde-fou : au-delà de 256 couleurs, pas de palette possible
      k = map.size;
      map.set(cle, k);
      palette.push(r, g, b);
      alphas.push(a);
    }
    idx[n] = k;
  }
  // lignes filtrées : None (0) ou Up (2), on garde la moins coûteuse
  const brut = Buffer.alloc(H * (W + 1));
  for (let y = 0; y < H; y++) {
    const cur = idx.subarray(y * W, (y + 1) * W);
    const prev = y ? idx.subarray((y - 1) * W, y * W) : null;
    let coutNone = 0, coutUp = 0;
    const up = Buffer.alloc(W);
    for (let x = 0; x < W; x++) {
      coutNone += cur[x] < 128 ? cur[x] : 256 - cur[x];
      const d = prev ? (cur[x] - prev[x]) & 0xff : cur[x];
      up[x] = d;
      coutUp += d < 128 ? d : 256 - d;
    }
    const useUp = prev && coutUp < coutNone;
    brut[y * (W + 1)] = useUp ? 2 : 0;
    (useUp ? up : cur).copy(brut, y * (W + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 3; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const morceaux = [SIG, chunk('IHDR', ihdr), chunk('PLTE', Buffer.from(palette))];
  if (alphas.some(a => a !== 255)) morceaux.push(chunk('tRNS', Buffer.from(alphas)));
  morceaux.push(chunk('IDAT', zlib.deflateSync(brut, { level: 9 })), chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(morceaux);
}

// Recompresse si possible ; retourne le buffer optimisé ou null si aucun gain / non applicable.
export function optimiserPng(buf) {
  const img = lirePng(buf);
  if (!img) return null;
  const out = encoderPalette(img);
  if (!out || out.length >= buf.length) return null;
  // vérification : le résultat doit se relire et donner exactement les mêmes pixels
  const relu = lirePngPalette(out);
  if (!relu) return null;
  if (relu.length !== img.px.length) return null;
  for (let i = 0; i < relu.length; i++) if (relu[i] !== img.px[i]) return null;
  return out;
}

// relecture d'un PNG palettisé → pixels dans le même format que l'original (pour la vérification)
function lirePngPalette(buf) {
  let pos = 8, W = 0, H = 0, plte = null, trns = null, idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { W = data.readUInt32BE(0); H = data.readUInt32BE(4); }
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (!plte || !idat.length) return null;
  let brut;
  try { brut = zlib.inflateSync(Buffer.concat(idat)); } catch { return null; }
  const canaux = trns ? 4 : 3;
  const out = Buffer.alloc(W * H * canaux);
  let prev = Buffer.alloc(W);
  for (let y = 0; y < H; y++) {
    const f = brut[y * (W + 1)];
    const cur = Buffer.from(brut.subarray(y * (W + 1) + 1, y * (W + 1) + 1 + W));
    if (f === 2) for (let x = 0; x < W; x++) cur[x] = (cur[x] + prev[x]) & 0xff;
    for (let x = 0; x < W; x++) {
      const k = cur[x], o = (y * W + x) * canaux;
      out[o] = plte[k * 3]; out[o + 1] = plte[k * 3 + 1]; out[o + 2] = plte[k * 3 + 2];
      if (canaux === 4) out[o + 3] = trns && k < trns.length ? trns[k] : 255;
    }
    prev = cur;
  }
  return out;
}
