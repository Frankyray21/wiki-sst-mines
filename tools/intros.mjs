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
