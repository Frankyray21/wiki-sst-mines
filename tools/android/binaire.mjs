// Formats binaires d'Android écrits à la main : manifeste compilé (AXML), table de ressources
// (resources.arsc) et archive APK alignée. Les outils officiels (aapt2, SDK) viennent de
// dl.google.com, que l'environnement de construction ne joint pas ; ces trois formats sont
// publics et stables (frameworks/base/libs/androidfw/include/androidfw/ResourceTypes.h).
import zlib from 'node:zlib';

// ---------- types de blocs et de valeurs (ResourceTypes.h) ----------
export const BLOC = {
  STRING_POOL: 0x0001, TABLE: 0x0002, XML: 0x0003,
  XML_START_NS: 0x0100, XML_END_NS: 0x0101, XML_START_EL: 0x0102, XML_END_EL: 0x0103, XML_RES_MAP: 0x0180,
  TABLE_PACKAGE: 0x0200, TABLE_TYPE: 0x0201, TABLE_TYPE_SPEC: 0x0202,
};
export const VAL = { REFERENCE: 0x01, STRING: 0x03, INT_DEC: 0x10, INT_HEX: 0x11, INT_BOOLEAN: 0x12 };
const AUCUN = 0xFFFFFFFF;

class Tampon {
  constructor() { this.parts = []; this.n = 0; }
  u8(v) { const b = Buffer.alloc(1); b.writeUInt8(v); return this.push(b); }
  u16(v) { const b = Buffer.alloc(2); b.writeUInt16LE(v); return this.push(b); }
  u32(v) { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); return this.push(b); }
  push(b) { this.parts.push(b); this.n += b.length; return this; }
  aligner(k = 4) { while (this.n % k) this.u8(0); return this; }
  get buffer() { return Buffer.concat(this.parts); }
}

// En-tête de bloc : type, taille d'en-tête, taille totale.
function bloc(type, entete, corps) {
  const t = new Tampon().u16(type).u16(entete.length + 8).u32(8 + entete.length + corps.length);
  return Buffer.concat([t.buffer, entete, corps]);
}

// ---------- bassin de chaînes (UTF-16, comme aapt pour les XML compilés) ----------
export function bassinDeChaines(chaines) {
  const donnees = new Tampon(), decalages = [];
  for (const s of chaines) {
    decalages.push(donnees.n);
    const u = Buffer.from(String(s), 'utf16le');
    const len = u.length / 2;
    if (len > 0x7FFF) donnees.u16(((len >> 16) & 0x7FFF) | 0x8000).u16(len & 0xFFFF); else donnees.u16(len);
    donnees.push(u).u16(0);
  }
  donnees.aligner(4);
  const debutChaines = 28 + 4 * chaines.length;
  const entete = new Tampon().u32(chaines.length).u32(0).u32(0 /* UTF-16, non trié */).u32(debutChaines).u32(0).buffer;
  const table = new Tampon(); for (const d of decalages) table.u32(d);
  return bloc(BLOC.STRING_POOL, entete, Buffer.concat([table.buffer, donnees.buffer]));
}

// ---------- manifeste compilé (AXML) ----------
// Un élément : { nom, attrs: [{ ns: 'android'|null, nom, id?, type, valeur }], enfants: [] }.
// Les attributs porteurs d'un identifiant de ressource sont triés par identifiant (le framework
// les lit par fusion avec un tableau trié), les autres suivent ; leurs noms occupent les
// premières entrées du bassin de chaînes, dans l'ordre de la table des identifiants.
export const NS_ANDROID = 'http://schemas.android.com/apk/res/android';

export function trierAttributs(attrs) {
  return [...attrs].sort((a, b) => {
    if (a.id && b.id) return a.id - b.id;
    if (a.id) return -1;
    if (b.id) return 1;
    return a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0;
  });
}

export function compilerXml(racine) {
  // 1. inventaire : noms d'attributs à identifiant (triés par id, sans doublon), puis le reste
  const parId = new Map();
  (function parcourir(el) {
    for (const a of el.attrs || []) if (a.id) {
      if (parId.has(a.nom) && parId.get(a.nom) !== a.id) throw new Error('attribut ' + a.nom + ' : deux identifiants');
      parId.set(a.nom, a.id);
    }
    for (const e of el.enfants || []) parcourir(e);
  })(racine);
  const attrsId = [...parId.entries()].sort((a, b) => a[1] - b[1]);
  const chaines = attrsId.map(([n]) => n);
  const index = new Map(chaines.map((s, i) => ['@' + s, i]));   // noms d'attributs à id : réservés
  const idx = (s) => {
    if (!index.has(s)) { index.set(s, chaines.length); chaines.push(s); }
    return index.get(s);
  };
  const idxAttr = (a) => a.id ? index.get('@' + a.nom) : idx(a.nom);
  idx('android'); idx(NS_ANDROID);
  (function parcourir(el) {
    idx(el.nom);
    for (const a of el.attrs || []) { if (!a.id) idx(a.nom); if (a.type === VAL.STRING) idx(String(a.valeur)); }
    for (const e of el.enfants || []) parcourir(e);
  })(racine);

  // 2. blocs
  const blocs = [];
  let ligne = 1;
  const noeud = (type, ext) => bloc(type, new Tampon().u32(ligne++).u32(AUCUN).buffer, ext);
  blocs.push(noeud(BLOC.XML_START_NS, new Tampon().u32(idx('android')).u32(idx(NS_ANDROID)).buffer));
  (function ecrire(el) {
    const attrs = trierAttributs(el.attrs || []);
    const ext = new Tampon().u32(AUCUN).u32(idx(el.nom)).u16(20).u16(20).u16(attrs.length).u16(0).u16(0).u16(0);
    for (const a of attrs) {
      const ns = a.ns === 'android' ? idx(NS_ANDROID) : AUCUN;
      let brut = AUCUN, donnee;
      switch (a.type) {
        case VAL.STRING: brut = donnee = idx(String(a.valeur)); break;
        case VAL.INT_BOOLEAN: donnee = a.valeur ? 0xFFFFFFFF : 0; break;
        case VAL.INT_DEC: case VAL.INT_HEX: case VAL.REFERENCE: donnee = a.valeur >>> 0; break;
        default: throw new Error('type de valeur inconnu : ' + a.type);
      }
      ext.u32(ns).u32(idxAttr(a)).u32(brut).u16(8).u8(0).u8(a.type).u32(donnee);
    }
    blocs.push(noeud(BLOC.XML_START_EL, ext.buffer));
    for (const e of el.enfants || []) ecrire(e);
    blocs.push(noeud(BLOC.XML_END_EL, new Tampon().u32(AUCUN).u32(idx(el.nom)).buffer));
  })(racine);
  blocs.push(noeud(BLOC.XML_END_NS, new Tampon().u32(idx('android')).u32(idx(NS_ANDROID)).buffer));

  const carte = new Tampon(); for (const [, id] of attrsId) carte.u32(id);
  const corps = Buffer.concat([bassinDeChaines(chaines), bloc(BLOC.XML_RES_MAP, Buffer.alloc(0), carte.buffer), ...blocs]);
  return bloc(BLOC.XML, Buffer.alloc(0), corps);
}

// ---------- table de ressources : un paquet, des fichiers (icônes) ----------
// ressources : [{ type: 'drawable', nom: 'icon', fichier: 'res/drawable-xxxhdpi-v4/icon.png', densite: 640 }]
// Chaque type reçoit un identifiant dans l'ordre d'apparition (1, 2…), chaque entrée le sien dans
// son type : l'identifiant d'une ressource vaut 0x7f TT EEEE.
export function compilerTable(paquet, ressources) {
  const types = [...new Set(ressources.map(r => r.type))];
  const cles = [...new Set(ressources.map(r => r.nom))];
  const fichiers = ressources.map(r => r.fichier);
  const ids = {};
  const blocsTypes = [];
  types.forEach((type, t) => {
    const duType = ressources.filter(r => r.type === type);
    const noms = [...new Set(duType.map(r => r.nom))];
    noms.forEach((n, e) => { ids[type + '/' + n] = (0x7f << 24) | ((t + 1) << 16) | e; });
    // spécification du type : quelles dimensions de configuration font varier chaque entrée
    const spec = new Tampon().u8(t + 1).u8(0).u16(0).u32(noms.length);
    for (const n of noms) spec.u32(duType.some(r => r.nom === n && r.densite) ? 0x0100 : 0);
    blocsTypes.push(bloc(BLOC.TABLE_TYPE_SPEC, spec.buffer.subarray(0, 8), spec.buffer.subarray(8)));
    // une configuration par densité
    for (const densite of [...new Set(duType.map(r => r.densite || 0))]) {
      const config = Buffer.alloc(64); config.writeUInt32LE(64, 0); config.writeUInt16LE(densite, 14);
      const entete = Buffer.concat([new Tampon().u8(t + 1).u8(0).u16(0).u32(noms.length).u32(8 + 12 + 64 + 4 * noms.length).buffer, config]);
      const decalages = new Tampon(), entrees = new Tampon();
      for (const n of noms) {
        const r = duType.find(x => x.nom === n && (x.densite || 0) === densite);
        if (!r) { decalages.u32(AUCUN); continue; }
        decalages.u32(entrees.n);
        entrees.u16(8).u16(0).u32(cles.indexOf(n)).u16(8).u8(0).u8(VAL.STRING).u32(fichiers.indexOf(r.fichier));
      }
      blocsTypes.push(bloc(BLOC.TABLE_TYPE, entete, Buffer.concat([decalages.buffer, entrees.buffer])));
    }
  });
  const bassinTypes = bassinDeChaines(types), bassinCles = bassinDeChaines(cles);
  const nom = Buffer.alloc(256); nom.write(paquet.slice(0, 127), 'utf16le');
  const entetePaquet = Buffer.concat([new Tampon().u32(0x7f).buffer, nom,
    new Tampon().u32(288).u32(types.length).u32(288 + bassinTypes.length).u32(cles.length).u32(0).buffer]);
  const blocPaquet = bloc(BLOC.TABLE_PACKAGE, entetePaquet, Buffer.concat([bassinTypes, bassinCles, ...blocsTypes]));
  const table = bloc(BLOC.TABLE, new Tampon().u32(1).buffer, Buffer.concat([bassinDeChaines(fichiers), blocPaquet]));
  return { table, ids };
}

// ---------- archive : entrées non compressées alignées sur 4 octets ----------
// Android (cible 30 et plus) exige resources.arsc non compressé et aligné ; les images le sont
// aussi, ce qui permet au système de les lire sans copie.
export function archiver(entrees) {
  const locales = [], centrales = [];
  let position = 0;
  for (const { nom, donnees, stocker } of entrees) {
    const n = Buffer.from(nom, 'utf8');
    const crc = zlib.crc32(donnees);
    const comprime = stocker ? donnees : zlib.deflateRawSync(donnees, { level: 9 });
    const methode = stocker ? 0 : 8;
    let bourrage = 0;
    if (stocker) while ((position + 30 + n.length + bourrage) % 4) bourrage++;
    const extra = Buffer.alloc(bourrage);
    const locale = new Tampon().u32(0x04034b50).u16(20).u16(0x0800).u16(methode).u16(0).u16(0x21)
      .u32(crc).u32(comprime.length).u32(donnees.length).u16(n.length).u16(extra.length).push(n).push(extra).buffer;
    centrales.push(new Tampon().u32(0x02014b50).u16(20).u16(20).u16(0x0800).u16(methode).u16(0).u16(0x21)
      .u32(crc).u32(comprime.length).u32(donnees.length).u16(n.length).u16(0).u16(0).u16(0).u16(0).u32(0).u32(position).push(n).buffer);
    locales.push(locale, comprime);
    position += locale.length + comprime.length;
  }
  const central = Buffer.concat(centrales);
  const fin = new Tampon().u32(0x06054b50).u16(0).u16(0).u16(entrees.length).u16(entrees.length)
    .u32(central.length).u32(position).u16(0).buffer;
  return Buffer.concat([...locales, central, fin]);
}

// Décalage des données de chaque entrée, lu dans l'archive : pour contrôler l'alignement.
export function positionsDesDonnees(zip) {
  const res = {};
  let i = zip.length - 22;
  while (i >= 0 && zip.readUInt32LE(i) !== 0x06054b50) i--;
  const nb = zip.readUInt16LE(i + 10);
  let p = zip.readUInt32LE(i + 16);
  for (let k = 0; k < nb; k++) {
    const methode = zip.readUInt16LE(p + 10), lnom = zip.readUInt16LE(p + 28), lextra = zip.readUInt16LE(p + 30), lcom = zip.readUInt16LE(p + 32);
    const local = zip.readUInt32LE(p + 42);
    const nom = zip.toString('utf8', p + 46, p + 46 + lnom);
    res[nom] = { methode, donnees: local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28) };
    p += 46 + lnom + lextra + lcom;
  }
  return res;
}
