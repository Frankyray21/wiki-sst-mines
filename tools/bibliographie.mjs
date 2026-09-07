// Corrige uniquement les formes de références balisées ref- produites par Marked.
// Ni le contenu documentaire ni les numéros explicites ne sont recalculés.
const ancre = '<span id="ref-[^"<>]+">\\s*</span>';
const blocInterdit = /<\/?(?:address|article|aside|blockquote|details|dialog|div|dl|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|menu|nav|ol|p|pre|section|summary|table|ul)\b/i;
const entier = /^\d+$/;

function contenuInline(html) {
  return html.trim() !== '' && !blocInterdit.test(html);
}

function normaliserFragment(html) {
  const motifs = [
    // Une ancre isolée et une liste ne contenant qu'une référence.
    new RegExp('<p>\\s*(' + ancre + ')\\s*</p>\\s*<ol(?: start="(\\d+)")?>\\s*<li(?: value="(\\d+)")?>([\\s\\S]*?)</li>\\s*</ol>', 'g'),
    // Marked ne démarre pas une liste à 2 au milieu d'un paragraphe.
    new RegExp('<p>\\s*(' + ancre + ')\\s*<br\\s*/?>\\s*(\\d+)\\.\\s+([\\s\\S]*?)</p>', 'g'),
  ];
  const entrees = [];
  for (const [type, motif] of motifs.entries()) {
    for (const m of html.matchAll(motif)) {
      const contenu = type === 0 ? m[4] : m[3];
      if (!contenuInline(contenu)) continue;
      const numero = type === 0 ? (m[3] ?? m[2] ?? '1') : m[2];
      if (!entier.test(numero)) continue;
      entrees.push({ debut: m.index, fin: m.index + m[0].length, ancre: m[1], numero, contenu });
    }
  }
  entrees.sort((a, b) => a.debut - b.debut);
  const groupes = [];
  for (const entree of entrees) {
    const dernier = groupes.at(-1);
    if (dernier && entree.debut < dernier.fin) continue;
    if (dernier && /^\s*$/.test(html.slice(dernier.fin, entree.debut))) {
      dernier.entrees.push(entree); dernier.fin = entree.fin;
    } else groupes.push({ debut: entree.debut, fin: entree.fin, entrees: [entree] });
  }
  for (const groupe of groupes.reverse()) {
    const liste = '<ol class="references-liste">\n' + groupe.entrees.map(e =>
      '<li value="' + e.numero + '">' + e.ancre + e.contenu + '</li>'
    ).join('\n') + '\n</ol>';
    html = html.slice(0, groupe.debut) + liste + html.slice(groupe.fin);
  }

  // Une bibliographie déjà bien formée ne reçoit que la classe de présentation.
  return html.replace(/<ol\b([^>]*)>([\s\S]*?)<\/ol>/g, (tout, attributs, corps) => {
    if (/\breversed\b/i.test(attributs) || /<\/?(?:ol|ul)\b/i.test(corps)) return tout;
    const elements = [...corps.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)];
    const reste = corps.replace(/<li\b[^>]*>[\s\S]*?<\/li>/g, '').trim();
    if (!elements.length || reste || elements.some(m => !new RegExp('^\\s*' + ancre).test(m[1]))) return tout;
    if (/\bclass="[^"]*\breferences-liste\b/.test(attributs)) return tout;
    const classes = /\bclass="([^"]*)"/;
    attributs = classes.test(attributs)
      ? attributs.replace(classes, (_, c) => 'class="' + c + ' references-liste"')
      : attributs + ' class="references-liste"';
    return '<ol' + attributs + '>' + corps + '</ol>';
  });
}

export function normaliserBibliographie(html) {
  // Ne pas interpréter les exemples de code ou les scripts comme des références.
  return html.split(/(<(?:pre|code|script|style)\b[^>]*>[\s\S]*?<\/(?:pre|code|script|style)>)/gi)
    .map((fragment, i) => i % 2 ? fragment : normaliserFragment(fragment)).join('');
}
