// Phrases d'ouverture posées dans les notes du vault (lot du 21 septembre 2026).
//
// Le contrôle de forme signale les pages qui démarrent sur un titre, un tableau ou une liste. La
// phrase d'ouverture ne dit rien que la page ne dise déjà : elle annonce de quoi parle la page et
// ce qu'on y trouve. Elle se pose juste après le titre H1 de la note (avant une éventuelle « Table
// des matières », que le générateur retire du rendu) ; sans H1, juste après le frontmatter.

export function poserIntro(texte, phrase) {
  const nl = texte.includes('\r\n') ? '\r\n' : '\n';
  const bom = texte.charCodeAt(0) === 0xFEFF ? '\uFEFF' : '';
  const corps = texte.slice(bom.length);
  const p = String(phrase).trim();
  if (!p) throw new Error('phrase vide');
  if (corps.includes(p)) return { texte, pose: false, motif: 'déjà présente' };
  const fm = corps.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  const apresFm = fm ? fm[0].length : 0;
  const h1 = corps.slice(apresFm).match(/^[ \t]*#[ \t]+.+$/m);
  let position;
  if (h1) position = apresFm + h1.index + h1[0].length;
  else position = apresFm;
  // une ligne vide de chaque côté, sans en doubler celles qui existent déjà
  const avant = corps.slice(0, position);
  let apres = corps.slice(position);
  apres = apres.replace(/^(\r?\n)*/, '');
  const nouveau = avant + (avant.endsWith(nl) || !avant ? '' : nl) + (h1 ? nl : '') + p + nl + nl + apres;
  return { texte: bom + nouveau, pose: true, motif: h1 ? 'après le titre' : 'après le frontmatter' };
}

// Même geste sur la page publiée : la phrase devient le premier paragraphe du corps, comme le
// générateur la rendrait depuis la note.
export function poserIntroHtml(html, phrase) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const marque = '<div class="page-body">\n';
  const i = html.indexOf(marque);
  if (i < 0) throw new Error('corps introuvable');
  const p = `<p>${esc(String(phrase).trim())}</p>\n`;
  if (html.slice(i + marque.length, i + marque.length + p.length + 2).includes(p)) return { html, pose: false };
  return { html: html.slice(0, i + marque.length) + p + html.slice(i + marque.length), pose: true };
}

// Retrouve la note du vault qui a produit une page publiée : par son titre H1 (normalisé comme le
// fait le générateur : un wikilink dans le titre devient son libellé), sinon par l'adresse de la
// page (slug du nom de fichier). Les archives sont ignorées. Une seule note doit répondre.
export function trouverNote(vault, { titre, slug }, { fs, path, slugify }) {
  const normaliser = (t) => String(t).replace(/\[\[([^\]]+)\]\]/g, (m, x) => { const s = x.replace(/\\\|/g, '|').split('|'); return s[s.length - 1].split('#')[0]; }).replace(/\s+/g, ' ').trim();
  const voulu = normaliser(titre);
  const candidats = [];
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!/^98 - Archives|^_archive|^\.|^sauvegarde/i.test(e.name)) walk(path.join(d, e.name), rel + e.name + '/'); continue; }
      if (!e.name.endsWith('.md')) continue;
      const base = e.name.slice(0, -3);
      let parTitre = false;
      if (voulu) {
        const texte = fs.readFileSync(path.join(d, e.name), 'utf8').replace(/^\uFEFF/, '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
        const h1 = texte.match(/^[ \t]*#[ \t]+(.+?)[ \t]*$/m);
        parTitre = !!h1 && normaliser(h1[1]) === voulu;
      }
      const parSlug = !!slug && slugify && slugify(base) === slug;
      if (parTitre || parSlug) candidats.push({ chemin: rel + e.name, par: parTitre ? 'titre' : 'adresse' });
    }
  })(vault, '');
  return candidats;
}
