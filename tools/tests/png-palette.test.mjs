// Recompression PNG sans perte du générateur (png_palette.mjs) : palette quand l'image tient en 256 couleurs,
// sinon vraies couleurs refiltrées, canal alpha opaque retiré (29 septembre 2026). Les pixels ne changent jamais.
import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { optimiserPng, lirePng } from '../png_palette.mjs';

// PNG « comme sorti d'un outil de capture » : aucun filtre, compression rapide
function png(W, H, canaux, px, { entrelace = 0 } = {}) {
  const crc = b => { let c, r = 0xffffffff; for (const x of b) { c = (r ^ x) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; r = c ^ (r >>> 8); } return (r ^ 0xffffffff) >>> 0; };
  const morceau = (type, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const corps = Buffer.concat([Buffer.from(type), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(corps)); return Buffer.concat([l, corps, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = canaux === 3 ? 2 : 6; ih[12] = entrelace;
  const L = W * canaux, brut = Buffer.alloc(H * (L + 1));
  for (let y = 0; y < H; y++) px.copy(brut, y * (L + 1) + 1, y * L, (y + 1) * L);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), morceau('IHDR', ih), morceau('IDAT', zlib.deflateSync(brut, { level: 1 })), morceau('IEND', Buffer.alloc(0))]);
}
// dégradé de plus de 256 couleurs ; alpha facultatif
function degrade(W, H, alpha) {
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; px[o] = x * 3 & 255; px[o + 1] = y * 5 & 255; px[o + 2] = (x + y) & 255; px[o + 3] = alpha ? alpha(x, y) : 255; }
  return px;
}
const typeCouleur = b => b[25];
const pixels = b => { const i = lirePng(b); return { i, rgba: i && Array.from({ length: i.width * i.height }, (_, n) => [0, 1, 2].map(k => i.px[n * i.canaux + k]).concat(i.canaux === 4 ? i.px[n * i.canaux + 3] : 255)) }; };

test('plus de 256 couleurs, alpha partout opaque : vraies couleurs sans alpha, plus léger, mêmes pixels', () => {
  const src = png(120, 90, 4, degrade(120, 90));
  const out = optimiserPng(src);
  assert.ok(out && out.length < src.length, 'plus léger');
  assert.equal(typeCouleur(out), 2, 'RVB, sans canal alpha');
  assert.deepEqual(pixels(out).rgba, pixels(src).rgba);
  assert.equal(optimiserPng(out), null, 'relancé sur son propre résultat : rien à gagner');
});

test('transparence réelle : le canal alpha reste, les pixels aussi', () => {
  const src = png(120, 90, 4, degrade(120, 90, (x, y) => (x + y) % 7 ? 255 : 40));
  const out = optimiserPng(src);
  assert.ok(out);
  assert.equal(typeCouleur(out), 6);
  assert.deepEqual(pixels(out).rgba, pixels(src).rgba);
});

test('256 couleurs au plus : palette, comme avant', () => {
  const W = 64, H = 64, px = Buffer.alloc(W * H * 3);
  for (let n = 0; n < W * H; n++) { const v = (n % 16) * 16; px[n * 3] = v; px[n * 3 + 1] = v; px[n * 3 + 2] = v; }
  const src = png(W, H, 3, px);
  const out = optimiserPng(src);
  assert.equal(typeCouleur(out), 3);
  assert.ok(out.length < src.length, 'la palette est relue et comparée pixel à pixel par optimiserPng lui-même');
});

test('image que l’on ne sait pas lire (entrelacée) : recopiée telle quelle', () => {
  assert.equal(optimiserPng(png(20, 20, 4, degrade(20, 20), { entrelace: 1 })), null);
  assert.equal(optimiserPng(Buffer.from('pas un png')), null);
});
