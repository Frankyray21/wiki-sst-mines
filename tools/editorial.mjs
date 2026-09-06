// Helpers éditoriaux sans dépendance : aucune validation du fond n'est inférée.
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decode = value => String(value).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&').replace(/&(apos|rsquo|lsquo);/g, "'").replace(/&nbsp;/g, ' ');
export function cleAncre(value) {
  try { value = decodeURIComponent(value); } catch { /* fragment mal encodé : signalé par le vérificateur */ }
  return decode(value).replace(/<[^>]+>/g, '').replace(/['’]/g, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

export function normaliserNavigationInterne(html) {
  // Supprimer uniquement un sommaire manuel identifié, composé de liens locaux,
  // lorsqu'un sommaire généré pourra prendre le relais. Ne jamais enlever une liste d'actions.
  if ((html.match(/<h[23]\b/g) || []).length >= 3) {
    const titres = /<p>\s*(?:<strong>)?(?:Table des mati[eè]res|Sommaire)\s*:?(?:<\/strong>)?\s*<\/p>\s*(?=<(?:ol|ul)>)/gi;
    const retraits = [];
    for (const titre of html.matchAll(titres)) {
      const debut = titre.index + titre[0].length;
      const balises = /<\/?(?:ol|ul)\b[^>]*>/gi;
      balises.lastIndex = debut;
      const pile = [];
      let balise, fin = null;
      while ((balise = balises.exec(html))) {
        const type = balise[0].match(/(?:ol|ul)/i)[0].toLowerCase();
        if (!balise[0].startsWith('</')) pile.push(type);
        else if (pile.pop() !== type) break;
        if (!pile.length) { fin = balises.lastIndex; break; }
      }
      if (fin === null) continue;
      const liste = html.slice(debut, fin);
      const liens = [...liste.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>[\s\S]*?<\/a>/g)];
      const reste = liste.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '').replace(/<\/?(?:ul|ol|li)\b[^>]*>/g, '').trim();
      if (liens.length >= 2 && liens.every(m => m[1].startsWith('#')) && !reste) retraits.push([titre.index, fin]);
    }
    for (const [debut, fin] of retraits.reverse()) html = html.slice(0, debut) + html.slice(fin);
  }
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => decode(m[1])));
  const normalises = new Map();
  for (const id of ids) {
    const key = cleAncre(id);
    normalises.set(key, normalises.has(key) ? null : id);
  }
  return html.replace(/href="#([^"]+)"/g, (full, fragment) => {
    let decoded; try { decoded = decodeURIComponent(decode(fragment)); } catch { return full; }
    if (ids.has(decoded)) return full;
    const target = normalises.get(cleAncre(decoded));
    return target ? `href="#${esc(target)}"` : full;
  });
}

function dateExplicite(value) {
  if (value instanceof Date) return Number.isNaN(value.valueOf()) ? '' : value.toISOString().slice(0, 10);
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

export function metadonneesEditoriales(p, generation) {
  const fm = p.fm || {};
  const revision = dateExplicite(fm['révision'] || fm.revision);
  const relecture = dateExplicite(fm['relecture-editoriale-le']);
  const sources = dateExplicite(fm['sources-verifiees-le']);
  const auteur = fm['relecteur-editorial'];
  const items = [revision ? `Révision déclarée dans la note : ${esc(revision)}` : 'Révision de la note : non renseignée'];
  items.push(relecture && auteur ? `Relecture éditoriale : ${esc(relecture)} (${esc(auteur)})` : 'Relecture éditoriale : non attestée');
  items.push(sources ? `Sources vérifiées : ${esc(sources)}` : 'Vérification des sources : non attestée');
  items.push(`Site généré le ${esc(generation)}`);
  return items.join(' · ');
}

export function indicateursDocumentaires(p) {
  const fm = p.fm || {};
  return {
    lienSource: /https?:\/\//i.test(p.body || ''),
    relecture: !!(dateExplicite(fm['relecture-editoriale-le']) && fm['relecteur-editorial']),
    sourcesDatees: !!dateExplicite(fm['sources-verifiees-le']),
    validationSpecialisee: !!(dateExplicite(fm['validation-specialisee-le']) && fm['validateur-specialise']),
  };
}
