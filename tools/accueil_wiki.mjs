// Pages d'accueil des wikis (« 00 - 🏠 Accueil … », frontmatter `type: accueil`) et des sections
// travailleurs / gestionnaires : rendues comme la page d'accueil d'un vrai wiki — bandeau de
// bienvenue, une boîte par section de la note, listes en colonnes — et non comme un article
// ordinaire avec infobox, sommaire et sous-titre « Un article du wiki ». Le contenu reste celui de
// la note ; on retire seulement les préfixes de classement des titres (« 15 - Navigation ») et les
// artefacts illisibles (nom de fichier d'une vidéo non publiée, wikilink resté brut, item qui ne
// mène qu'à une source interne), et chaque retrait est signalé à la construction.

import fs from 'node:fs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Pictogrammes de l'interface : Material Design Icons (@mdi/js, Pictogrammers Free License), le même extrait
// que les schémas (tools/schemas-sombres/icones.json, LICENCE-icones.txt).
const ICONES = JSON.parse(fs.readFileSync(new URL('./schemas-sombres/icones.json', import.meta.url), 'utf8'));
// Illustration de la carte d'entrée d'un wiki (tools/illustrations/<slug>.svg, dessin plat dans l'esprit de la
// maquette du 26 sept. 2026) : insérée telle quelle, décorative ; sans fichier, l'emoji du wiki reste.
const ILLUSTRATIONS = new Map();
export function illustrationWiki(slug) {
  if (!slug) return '';
  if (!ILLUSTRATIONS.has(slug)) {
    const f = new URL(`./illustrations/${slug}.svg`, import.meta.url);
    let svg = '';
    try { svg = fs.readFileSync(f, 'utf8'); } catch { /* pas d'illustration : l'emoji */ }
    svg = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/\n\s*/g, '').trim()
      .replace(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, '<svg class="illustration" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"');
    ILLUSTRATIONS.set(slug, svg);
  }
  return ILLUSTRATIONS.get(slug);
}

export function icone(nom) {
  if (!ICONES[nom]) throw new Error('icône inconnue : ' + nom);
  return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONES[nom]}"/></svg>`;
}
const texteNu = (h) => String(h).replace(/<[^>]+>/g, '').replace(EMOJIS_DE_TETE_G, '').trim();
const sansAccents = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// même règle que le sommaire du générateur : préfixe « 15 - » retiré, titres numérotés légitimes conservés
const EMOJIS_DE_TETE = /^(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}️?)*|\s)+/u;
const EMOJIS_DE_TETE_G = new RegExp(EMOJIS_DE_TETE.source, 'u');
const MEDIA = /^!?[^\s<>]+\.(?:mp4|m4a|mp3|png|jpe?g|gif|svg|webp|pdf)$/i;
// entrée « point d'entrée » : un emoji, un lien, au plus une courte description après un tiret
const ENTREE_TUILE = /^\s*(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}️?)*)\s*<a [^>]*>[^<]+<\/a>\s*(?:[-–—:]\s*[^<]*)?$/u;

export function estAccueil({ fm, base }) {
  return String(fm?.type ?? '').trim().toLowerCase() === 'accueil' || /^00 - .*Accueil/u.test(String(base));
}
export function titreAccueil(titre) {
  return String(titre).replace(EMOJIS_DE_TETE, '').trim() || String(titre).trim();
}
export function libelleSection(inner) {
  // le préfixe peut se trouver dans le texte d'un lien : « <a …>20 - Articles internes</a> »
  const t = inner.trim().replace(/^((?:<[^>]+>\s*)*)(\d{1,3} +[-–—] +)(?=\p{L})/u, '$1');
  return t || inner.trim();
}

// Corps d'une page publiée (entre <div class="page-body"> et les blocs voisins / backlinks / page-meta).
export function extraireCorps(html) {
  const marque = '<div class="page-body">\n';
  const debut = html.indexOf(marque), fin = html.indexOf('<div class="page-meta">');
  if (debut < 0 || fin < 0) return null;
  const avant = html.slice(debut + marque.length, fin)
    .replace(/\s*<details class="backlinks">[\s\S]*?<\/details>\s*$/, '')
    .replace(/\s*<nav class="voisins"[^>]*>[\s\S]*?<\/nav>\s*$/, '')
    .replace(/\s*$/, '');
  return avant.endsWith('</div>') ? avant.slice(0, -6).replace(/\s*$/, '') : null;
}

// Découpe le corps rendu d'une note d'accueil : chapeau (avant le premier h2) et sections (un h2
// chacune, sous-groupes h3 conservés). `resoudre(cible)` rend l'URL d'une page du site, ou null.
export function decouperAccueil(html, { resoudre } = {}) {
  const retires = [], repares = [];
  const lienRepare = (cible, alias) => {
    const url = resoudre ? resoudre(cible.trim()) : null;
    repares.push(cible.trim() + (url ? '' : ' (page introuvable)'));
    return url ? `<a href="${url}">${alias}</a>` : `<span class="new" title="Page introuvable : ${esc(cible.trim())}">${alias}</span>`;
  };
  let h = html;
  // 1. paragraphe réduit au nom d'un fichier média, ou à « [fichier introuvable : …] » : l'embarquement
  //    n'a pas pu être rendu, et un nom de fichier ne dit rien au lecteur
  h = h.replace(/<p>([^<\n]+)<\/p>\n?/g, (m, texte) => { if (!MEDIA.test(texte.trim())) return m; retires.push(`paragraphe « ${texte.trim()} »`); return ''; });
  h = h.replace(/<p>\s*<span class="missing-file">([^<]*)<\/span>\s*<\/p>\n?/g, (m, texte) => { retires.push(`paragraphe « ${texte.trim()} »`); return ''; });
  // 1 bis. paragraphe réduit à un renvoi vers une source interne, non publiée sur le site, ou un
  //    article retiré — même chose que l'item de liste ci-dessous, mais pour un « Hub : … » en
  //    paragraphe (archivage du wiki des travailleurs, 12 septembre 2026 : un « Hub » de fiches
  //    archivées ne mène plus nulle part, mais reste entouré d'items réels dans la même boîte)
  h = h.replace(/<p>\s*[^<\n]*<span class="(?:interne-inline|abroge-inline|missing-file)"[^>]*>[\s\S]*?<\/span>\s*<\/p>\n?/g, (m) => { retires.push(`paragraphe « ${m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()} »`); return ''; });
  // 2. item qui ne mène nulle part : source interne non publiée, article retiré, fichier introuvable
  h = h.replace(/<li>\s*[^<\n]*<span class="(?:interne-inline|abroge-inline|missing-file)"[^>]*>[\s\S]*?<\/span>\s*<\/li>\n?/g, (m) => { retires.push(`item « ${m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()} »`); return ''; });
  // 2 bis. item vide
  h = h.replace(/<li>\s*<\/li>\n?/g, () => { retires.push('item vide'); return ''; });
  // 3. wikilinks restés bruts dans la note (crochets non fermés, alias imbriqué) : l'alias qui porte
  //    déjà des liens rendus est gardé tel quel ; sinon il devient un lien vers la cible, ou un lien rouge
  h = h.replace(/\[\[([^\[\]|<\n]+)\|([\s\S]*?)\]{0,2}(?=<\/li>|<\/p>)/g, (m, cible, alias) => {
    if (/<a /.test(alias)) { repares.push(m.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 60)); return alias.trim(); }
    return lienRepare(cible, alias.trim());
  });
  h = h.replace(/\[\[([^\[\]|<\n]+?)\]{0,2}(?=<\/li>|<\/p>)/g, (m, cible) => lienRepare(cible, cible.trim()));

  const parties = h.split(/(?=<h2 id=")/);
  const chapeau = parties[0].trim();
  const sections = [];
  for (const seg of parties.slice(1)) {
    const m = seg.match(/^<h2 id="([^"]*)">([\s\S]*?)<\/h2>\n?/);
    if (!m) continue;
    let corps = seg.slice(m[0].length).trim();
    if (!/<a |<td|<p>|<li>/.test(corps)) { retires.push(`section vide « ${m[2].replace(/<[^>]+>/g, '')} »`); continue; }
    corps = colonnes(corps);
    // sous-groupes h3 : chacun dans un bloc, pour couler en colonnes
    // split sur un lookahead en position 0 ne produit pas d'élément vide : on l'ajoute
    const groupes = (corps.startsWith('<h3 id="') ? [''] : []).concat(corps.split(/(?=<h3 id=")/));
    if (groupes.length > 1) {
      corps = groupes[0] + `<div class="accueil-groupes">` + groupes.slice(1).map(g => `<div class="accueil-groupe">${g.replace(/<h3 id="([^"]*)">([\s\S]*?)<\/h3>/, (x, id, inner) => `<h3 id="${id}">${libelleSection(inner)}</h3>`)}</div>`).join('') + `</div>`;
    }
    sections.push({ id: m[1], titre: libelleSection(m[2]), html: corps, grand: groupes.length > 1 || nbItems(corps) >= 12 });
  }
  return { chapeau, sections, retires, repares };
}

function nbItems(html) { return (html.match(/<li>/g) || []).length; }

// Pictogramme d'une tuile par rôle (maquette du 26 sept. 2026) : l'emoji de la note, ou le rôle nommé
// dans le libellé, choisit un pictogramme MDI teinté — casque pour le travailleur, cravate pour le
// superviseur, cœur pour le conseiller, immeuble pour la direction. Un emoji inconnu reste affiché.
// Décoratif dans les deux cas (aria-hidden) : le libellé porte le sens.
const PICTOS_ROLES = [
  [/^👷/u, /travailleur|op[ée]rateur|mineur/, 'mdiAccountHardHat', 'ambre'],
  [/^(?:👨‍💼|🧑‍💼|👩‍💼|👔|🛡️|🛡)/u, /superviseur|contrema[iî]tre|chef d/, 'mdiAccountTie', 'bleu'],
  [/^(?:👩‍⚕️|👨‍⚕️|🧑‍⚕️|🩺|🎯)/u, /conseill|ergonome|hygi[ée]niste|toxicologue|pr[ée]ventionniste/, 'mdiAccountHeart', 'vert'],
  [/^(?:🏢|🏛️|🏛|🏭)/u, /direction|\brh\b|gestionnaire|employeur/, 'mdiOfficeBuildingOutline', 'bleu'],
];
export function pictoTuile(emoji, libelle = '') {
  const e = String(emoji || '').trim();
  const l = sansAccents(texteNu(libelle));
  const r = PICTOS_ROLES.find(([re, mots]) => (e && re.test(e)) || (l && mots.test(l)));
  if (r) return `<span class="accueil-tuile-icone teinte-${r[3]}" aria-hidden="true">${icone(r[2])}</span>`;
  return e ? `<span class="accueil-tuile-emoji" aria-hidden="true">${e}</span>` : '';
}

// Une tuile : pictogramme, libellé du lien, puis une ligne de description — le texte qui suit le lien
// dans la note (« - tes droits, tes recours ») ou, à défaut, le titre de la page cible (attribut
// title posé par le générateur), quand il ne répète pas le libellé.
export function tuile(entree) {
  const m = entree.match(/^(\s*[^<]*?)<a ([^>]*)>([^<]+)<\/a>\s*(?:[-–—:]\s*)?([^<]*)$/u);
  if (!m) return entree;
  const [, emoji, attrs, libelle, suite] = m;
  const titre = (attrs.match(/title="([^"]*)"/) || [])[1] || '';
  const sansEmoji = (t) => t.replace(EMOJIS_DE_TETE, '').trim();
  let desc = suite.trim();
  if (!desc && titre && sansEmoji(titre).toLowerCase() !== libelle.trim().toLowerCase()) desc = sansEmoji(titre);
  const pictogramme = pictoTuile(emoji, libelle);
  return `${pictogramme}<a ${attrs}><span class="accueil-tuile-libelle">${libelle.trim()}</span>${desc ? `<small class="accueil-tuile-desc">${desc}</small>` : ''}</a>`;
}
// entrées de premier niveau d'une liste (les sous-listes ne comptent pas)
function entreesNiveau1(bloc) {
  const entrees = []; let p = 0, i = 0;
  while (i < bloc.length) {
    if (bloc.startsWith('<ul', i)) p++;
    else if (bloc.startsWith('</ul>', i)) p--;
    else if (p === 1 && bloc.startsWith('<li>', i)) { const fin = bloc.indexOf('</li>', i); entrees.push(bloc.slice(i + 4, fin < 0 ? bloc.length : fin)); }
    i++;
  }
  return entrees;
}

// Les listes de huit entrées ou plus coulent en colonnes ; une liste de deux à huit points d'entrée
// (emoji + lien, comme « Démarrage rapide par rôle ») devient une grille de tuiles. Classes posées
// sur les <ul> de premier niveau.
export function colonnes(html) {
  let sortie = '', profondeur = 0, i = 0;
  while (i < html.length) {
    if (html.startsWith('<ul>', i)) {
      if (profondeur === 0) {
        const fin = finDeListe(html, i);
        const bloc = html.slice(i, fin);
        // entrées courtes (au plus 24 caractères) : deux colonnes même sur un petit téléphone
        const entrees = entreesNiveau1(bloc);
        const courtes = entrees.every(e => e.replace(/<[^>]+>/g, '').trim().length <= 24);
        const tuiles = entrees.length >= 2 && entrees.length <= 8 && entrees.every(e => ENTREE_TUILE.test(e));
        sortie += tuiles ? '<ul class="accueil-tuiles">' + bloc.slice(4).replace(/<li>([\s\S]*?)<\/li>/g, (m, e) => '<li>' + tuile(e) + '</li>')
          : entrees.length >= 8 ? `<ul class="accueil-colonnes${courtes ? ' accueil-colonnes-courtes' : ''}">` + bloc.slice(4) : bloc;
        i = fin; continue;
      }
      profondeur++;
    }
    sortie += html[i]; i++;
  }
  return sortie;
}
function finDeListe(html, debut) {
  let p = 0, i = debut;
  while (i < html.length) {
    if (html.startsWith('<ul', i)) p++;
    else if (html.startsWith('</ul>', i)) { p--; if (p === 0) return i + 5; }
    i++;
  }
  return html.length;
}

// Adresses distinctes des liens d'un fragment.
export function liensDe(html) {
  return new Set([...String(html).matchAll(/<a href="([^"]+)"/g)].map(m => m[1]));
}
// Les deux premiers mots d'un titre ou d'une description, sans balise, emoji ni ponctuation.
const motsDeTete = (t) => String(t).replace(/<[^>]+>/g, '').replace(EMOJIS_DE_TETE, '').toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).slice(0, 2).join(' ');
const nbLiensTexte = (n) => `${n} page${n > 1 ? 's' : ''}`;

// Allège l'accueil après le découpage (Frank, 26 sept. 2026 : « améliore la page d'accueil »). Même
// règle dans le générateur et sur le site publié, appliquée au rendu des boîtes :
//   - la description d'une tuile qui répète le titre de sa boîte est retirée (« Démarrage rapide -
//     Travailleur » sous « Travailleur, opérateur », dans « Démarrage rapide par rôle ») ;
//   - une boîte faite de tuiles occupe toute la largeur : une rangée de rôles ;
//   - une boîte dont la moitié des liens ou plus est déjà offerte plus haut (volets de thèmes, barre
//     d'index) est repliée, titre et nombre de pages sur une ligne ; ouverte, elle reste entière.
// Le contenu de la note n'est jamais modifié, seulement replié ou allégé de ce qui se répète.
export function epurerAccueil(sections, { liensOfferts = new Set() } = {}) {
  const journal = [];
  const resultat = sections.map(s => {
    let html = s.html;
    let sansDescription = 0;
    const tete = motsDeTete(s.titre);
    if (tete) html = html.replace(/<small class="accueil-tuile-desc">([^<]*)<\/small>/g, (m, d) => { if (motsDeTete(d) !== tete) return m; sansDescription++; return ''; });
    const net = html.trim();
    const tuiles = net.startsWith('<ul class="accueil-tuiles">') && net.endsWith('</ul>') && (net.match(/<ul\b/g) || []).length === 1;
    const liens = liensDe(html);
    const repris = [...liens].filter(l => liensOfferts.has(l)).length;
    const replie = s.id !== 'themes-du-wiki' && liens.size > 0 && repris * 2 >= liens.size;
    if (sansDescription || replie) journal.push({ boite: s.titre.replace(/<[^>]+>/g, ''), sansDescription, replie, liens: liens.size, repris });
    return { ...s, html, grand: s.grand || replie || tuiles, replie, nbLiens: liens.size };
  });
  return { sections: resultat, journal };
}

// ---------- l'accueil selon la maquette de Frank (26 septembre 2026) ----------
// Une application sobre, lue au téléphone : carte d'entrée (pictogramme, titre, chapeau, nombre d'articles,
// Lecture et PDF), tuiles par rôle, lignes de thèmes à pictogramme coloré, cartes secondaires repliées.
// Le contenu reste celui des notes ; les pictogrammes, les sous-titres des cartes par public et le lien
// « Explorer tous les thèmes » sont de l'habillage, les mêmes pour les six wikis.

// Pictogramme d'un thème, d'après son titre ; teinte par position, pour reconnaître les catégories.
const ICONES_THEMES = [
  [/anatom|biomecan|\bcorps\b/, 'mdiHuman'],
  [/contrainte/, 'mdiCogOutline'],
  [/accident/, 'mdiMagnifyScan'],
  [/hierarchie/, 'mdiFormatListNumbered'],
  [/demarche|organisationnel|facteur/, 'mdiSitemapOutline'],
  [/fondement|theorie|modele/, 'mdiBookOpenVariant'],
  [/\btms\b|musculo/, 'mdiShieldPlusOutline'],
  [/communication/, 'mdiMessageTextOutline'],
  [/conditions? de travail|horaire/, 'mdiClockOutline'],
  [/conflit|harcelement|violence/, 'mdiAccountAlertOutline'],
  [/evaluation|outil|priorisation/, 'mdiClipboardTextOutline'],
  [/gestion|prevention/, 'mdiShieldCheck'],
  [/invalidit|lesion/, 'mdiBandage'],
  [/legislation|norme/, 'mdiGavel'],
  [/employeur/, 'mdiOfficeBuildingOutline'],
  [/droit|recours|obligation/, 'mdiScaleBalance'],
  [/minier|fifo|souterrain/, 'mdiPickaxe'],
  [/reconnaissance|motivation/, 'mdiStarFourPointsOutline'],
  [/retour au travail|readaptation/, 'mdiAccountArrowRightOutline'],
  [/psychosoc|\brps\b|stress/, 'mdiBrain'],
  [/sante/, 'mdiHeartPulse'],
  [/soutien|ressource|aide/, 'mdiHandHeartOutline'],
  [/supervision|superviseur|\brole/, 'mdiAccountSupervisorOutline'],
  [/biologique/, 'mdiBiohazard'],
  [/chimique|contaminant|substance/, 'mdiFlaskOutline'],
  [/physique|bruit|vibration/, 'mdiEarHearing'],
  [/machine|equipement/, 'mdiCogs'],
  [/organe|toxicit/, 'mdiStethoscope'],
  [/cinetique|\badme\b/, 'mdiTimerSandEmpty'],
  [/cnesst|regime|cotisation/, 'mdiBankOutline'],
];
export function iconeTheme(titre) {
  const t = sansAccents(texteNu(titre));
  const r = ICONES_THEMES.find(([re]) => re.test(t));
  return r ? r[1] : 'mdiTagOutline';
}

// Pictogramme et sous-titre d'une boîte de la note, d'après son titre. Le sous-titre ne va qu'aux boîtes
// par public (« Articles … ») et au démarrage rapide ; les autres n'ont qu'un pictogramme, ou rien.
export function genreBoite({ id, titre }) {
  if (id === 'themes-du-wiki') return { icone: 'mdiLayersTripleOutline', sousTexte: '' };
  const t = sansAccents(texteNu(titre));
  const liste = /^(?:articles?|pages?)\b/.test(t);
  if (/demarrage rapide/.test(t) && /role|profil/.test(t)) return { icone: 'mdiAccountGroupOutline', sousTexte: 'Accédez rapidement aux contenus pertinents pour votre rôle.' };
  if (/interne|conseiller/.test(t)) return { icone: 'mdiFileDocumentOutline', sousTexte: liste ? 'Outils, méthodes et références pour les professionnels.' : '' };
  if (/travailleur|vulgaris/.test(t)) return { icone: 'mdiAccountGroupOutline', sousTexte: liste ? 'Des explications simples et concrètes pour le terrain.' : '' };
  if (/gestionnaire|encadrement|strategique/.test(t)) return { icone: 'mdiAccountTieOutline', sousTexte: liste ? 'Programmes et décisions pour l’encadrement.' : '' };
  if (/navigation|liens utiles|mode d.emploi/.test(t)) return { icone: 'mdiCompassOutline', sousTexte: '' };
  if (/index|vues? d.ensemble/.test(t)) return { icone: 'mdiListBoxOutline', sousTexte: '' };
  if (/glossaire/.test(t)) return { icone: 'mdiSchoolOutline', sousTexte: '' };
  if (/\bloi\b|legal|reglement|normatif|conformite/.test(t)) return { icone: 'mdiScaleBalance', sousTexte: '' };
  if (/lesion|programme|evaluation|risque/.test(t)) return { icone: 'mdiClipboardTextOutline', sousTexte: '' };
  return { icone: '', sousTexte: '' };
}

// Chapeau de la note : la première phrase devient le sous-titre de la carte, le reste sa description.
// La coupe se fait hors balise et hors emphase ouverte (« … <strong>roche dure</strong>. Couvre … »).
export function scinderChapeau(html) {
  const m = String(html).match(/^<p>([\s\S]*?)<\/p>([\s\S]*)$/);
  if (!m) return html;
  const [, p, reste] = m;
  let prof = 0, i = 0, coupe = -1;
  while (i < p.length) {
    if (p[i] === '<') {
      const fin = p.indexOf('>', i);
      if (fin < 0) break;
      if (p[i + 1] === '/') prof--; else if (p[fin - 1] !== '/' && !/^<(?:br|img|wbr)\b/.test(p.slice(i, fin + 1))) prof++;
      i = fin + 1; continue;
    }
    if (/[.!?]/.test(p[i]) && prof === 0 && (i + 1 === p.length || /\s/.test(p[i + 1]))) { coupe = i + 1; break; }
    i++;
  }
  if (coupe < 0 || !p.slice(coupe).trim()) return `<p class="accueil-sous-titre">${p}</p>${reste}`;
  return `<p class="accueil-sous-titre">${p.slice(0, coupe)}</p><p>${p.slice(coupe).trim()}</p>${reste}`;
}

// Ordre de la maquette : la carte d'entrée, le démarrage rapide par rôle, les thèmes, puis les autres
// boîtes. La note met les thèmes en premier ; on avance la boîte de démarrage juste devant eux.
export function estDemarrage({ titre }) {
  const t = sansAccents(texteNu(titre));
  return /demarrage rapide/.test(t) && /role|profil/.test(t);
}
export function ordonnerBoites(sections) {
  const iThemes = sections.findIndex(s => s.id === 'themes-du-wiki');
  const iRoles = sections.findIndex(estDemarrage);
  if (iThemes < 0 || iRoles < 0 || iRoles < iThemes) return sections;
  const ordre = sections.filter((s, i) => i !== iRoles);
  ordre.splice(iThemes, 0, sections[iRoles]);
  return ordre;
}

const CHEVRON = '<span class="accueil-chevron" aria-hidden="true"></span>';

// Boîte « Thèmes » de l'accueil d'un wiki : barre de raccourcis (ordinateur), puis un volet par thème —
// pictogramme teinté, titre qui mène à la page du thème, compte, description (visible ouvert), notions.
// themes : [{ id, url, titre, desc, notions: [{ url, titre }] }], dans l'ordre alphabétique.
export function rendreThemesAccueil(themes) {
  const raccourcis = themes.map(t => `<a href="#${t.id}">${esc(t.titre)}</a>`).join('');
  const volets = themes.map((t, i) => {
    const n = t.notions.length;
    const listes = n ? `<ul>${t.notions.map(q => `<li><a href="${q.url}">${esc(q.titre)}</a></li>`).join('')}</ul>` : '<p class="page-sub">Aucun article rattaché pour l’instant.</p>';
    return `<details class="accueil-theme" id="${t.id}" open><summary><span class="accueil-theme-icone teinte-${i % 6 + 1}" aria-hidden="true">${icone(iconeTheme(t.titre))}</span><span class="accueil-theme-texte"><span class="accueil-theme-titre"><a href="${t.url}">${esc(t.titre)}</a></span>${t.desc ? `<span class="accueil-theme-desc">${esc(t.desc)}</span>` : ''}</span><small>${n} article${n > 1 ? 's' : ''}</small>${CHEVRON}</summary>${listes}<a class="accueil-theme-page" href="${t.url}">Page du thème →</a></details>`;
  }).join('');
  return `<nav class="accueil-themes-nav" aria-label="Aller à un thème">${raccourcis}</nav><div class="accueil-groupes accueil-themes">${volets}</div>`;
}

// Une boîte : carte ouverte (en-tête à pictogramme, sous-titre, lien « Explorer tous les thèmes » sur la
// boîte des thèmes), ou carte repliée (résumé : pictogramme, titre, sous-titre, nombre de pages, chevron).
export function rendreBoite(s, { lienTousThemes = null } = {}) {
  const g = genreBoite(s);
  const classes = 'accueil-boite' + (s.grand ? ' accueil-large' : '') + (s.replie ? ' accueil-repli' : '');
  const pictogramme = g.icone ? `<span class="accueil-boite-icone" aria-hidden="true">${icone(g.icone)}</span>` : '';
  const texte = `<div class="accueil-entete-texte"><h2 class="accueil-titre" id="${s.id}">${s.titre}</h2>${g.sousTexte ? `<p class="accueil-sous-texte">${g.sousTexte}</p>` : ''}</div>`;
  if (s.replie) {
    return `<details class="${classes}"><summary><div class="accueil-entete">${pictogramme}${texte}<span class="accueil-compte">${nbLiensTexte(s.nbLiens)}</span>${CHEVRON}</div></summary><div class="accueil-corps">\n${s.html}\n</div></details>`;
  }
  const lien = s.id === 'themes-du-wiki' && lienTousThemes ? `<a class="accueil-entete-lien" href="${lienTousThemes.url}">Explorer tous les thèmes${CHEVRON}</a>` : '';
  return `<section class="${classes}" aria-labelledby="${s.id}"><div class="accueil-entete">${pictogramme}${texte}${lien}</div><div class="accueil-corps">\n${s.html}\n</div></section>`;
}

// Pied d'une page d'accueil : la date de génération, la marque à droite — les indicateurs éditoriaux
// (relecture, vérification des sources) et les outils qualifient des articles, pas une page de navigation.
export function piedAccueil(date, complement = '') {
  return `<div class="page-meta"><span>Site généré le ${esc(date)}${complement ? ' · ' + complement : ''}</span><span class="accueil-marque">WIKI SST — Mines</span></div>`;
}

// HTML de la page (sans fil d'Ariane ni pied de page, fournis par l'habillage commun).
//   domaine : « Page d’accueil du wiki <a>…</a> » ou « Section « … » du wiki <a>…</a> », lu par les lecteurs
//   d'écran ; compte : nombre de pages du wiki ou de la section, affiché ; chapeau : texte de la note avant son
//   premier titre ; index : liens d'index du wiki, rendus en ligne discrète sous les boîtes (« Tous les thèmes »
//   passe dans la boîte des thèmes). Les mêmes liens sont dans le menu latéral.
export function rendreAccueil({ titre, icone: pictogramme, wiki = '', domaine, compte, chapeau, sections, index = [] }) {
  const aThemes = sections.some(s => s.id === 'themes-du-wiki');
  const tousThemes = aThemes ? index.find(l => /tous les th[èe]mes/i.test(l.libelle)) : null;
  const liensIndex = index.filter(l => l !== tousThemes);
  const boites = ordonnerBoites(sections).map(s => rendreBoite(s, { lienTousThemes: tousThemes })).join('\n');
  const n = String(compte);
  // <header class="article-titre"> reste tel quel : la barre de lecture s'insère après .page-sub
  // et verif_site exige ce groupe titre + domaine sur toute page à corps.
  return `<div class="accueil-banniere">
${illustrationWiki(wiki) ? `<span class="accueil-icone accueil-illustration" aria-hidden="true">${illustrationWiki(wiki)}</span>` : `<span class="accueil-icone" aria-hidden="true">${pictogramme}</span>`}
<header class="article-titre">
<h1 class="page-title">${esc(titreAccueil(titre))}</h1>
${chapeau ? `<div class="accueil-chapeau">${scinderChapeau(chapeau)}</div>\n` : ''}<div class="page-sub"><span class="accueil-domaine">${domaine}</span><span class="accueil-compte-pages">${icone('mdiBookOpenPageVariantOutline')} <span class="accueil-nombre">${n}</span> article${n === '1' ? '' : 's'}</span></div>
</header>
</div>
<div class="page-body accueil-grille">
${boites}
</div>${liensIndex.length ? `\n<nav class="accueil-index" aria-label="Index et outils du wiki">${liensIndex.map(l => `<a href="${l.url}">${esc(l.libelle)}</a>`).join(' <span class="crumb-sep">·</span> ')}</nav>` : ''}`;
}
