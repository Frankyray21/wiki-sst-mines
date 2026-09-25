// Contrôles du résultat construit : lancer après build_site.mjs.
// Aucun accès réseau et aucune mutation du site ou du vault.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const outils = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(outils, '../docs');
const lire = rel => fs.readFileSync(path.join(out, rel), 'utf8');
const manifeste = JSON.parse(lire('assets/hors-ligne.json'));
assert.match(manifeste.version, /^\d{14}$/);
assert.equal(lire('assets/app.js'), fs.readFileSync(path.join(outils, 'app.js'), 'utf8'), 'script publié conforme');
assert.equal(lire('assets/style.css'), fs.readFileSync(path.join(outils, 'style.css'), 'utf8'), 'styles publiés conformes');
assert.ok(lire('sw.js').includes('X-Wiki-SST-Hash'), 'worker avec reçus de fraîcheur');

let octetsPages = 0, octetsMedias = 0;
let appelsReference = 0;
let entetesArticles = 0;
let titresGroupes = 0;
let bibliographiesCompactes = 0;
for (const [rel, attendu, taille] of manifeste.pages) {
  const brut = fs.readFileSync(path.join(out, rel));
  if (rel.endsWith('.html')) {
    const html = brut.toString('utf8');
    if (html.includes('<div class="page-meta">') && html.includes('<div class="page-body">')) {
      const entete = html.match(/<header class="article-(?:titre|entete)">[\s\S]*?<\/header>/)?.[0];
      assert.ok(entete, 'titre et domaine groupés : ' + rel);
      assert.ok(entete.includes('class="page-title"') && entete.includes('class="page-sub"'), 'point d’insertion de la barre conservé : ' + rel);
      if (entete.includes('class="article-titre"')) {
        assert.ok(!entete.includes('class="toc'), 'sommaire hors de la barre du titre : ' + rel);
        titresGroupes++;
      }
    }
    bibliographiesCompactes += (html.match(/<ol[^>]*class="[^"]*references-liste[^"]*"/g) || []).length;
    if (html.includes('<header class="site-header">')) {
      assert.ok(html.includes('<html lang="fr" data-wiki-entete>'), 'décalage des ancres activé : ' + rel);
      assert.match(html, /id="burger"[^>]*aria-expanded="false"[^>]*aria-controls="sidebar"/, 'commande du menu reliée : ' + rel);
      assert.ok(html.includes('id="sidebar" aria-label="Navigation du wiki"'), 'navigation nommée : ' + rel);
      entetesArticles++;
    }
    // Wiki des travailleurs abandonné le 12 septembre 2026 : aucun lien vers son ancien portail
    // (t/) ni vers son ancien index (travailleurs.html), sur aucune page.
    assert.doesNotMatch(html, /href="(?:\.\.\/)*t\/(?:index\.html|w\/)/, 'aucun lien vers l’ancien wiki des travailleurs : ' + rel);
    assert.doesNotMatch(html, /travailleurs\.html">👷/, 'aucun lien vers l’ancien index des fiches : ' + rel);
    for (const appel of brut.toString('utf8').matchAll(/<a\b[^>]*href="#ref-[^"]+"[^>]*>([\s\S]*?)<\/a>/g)) {
      assert.match(appel[1], /^\s*\d+\s*$/, 'exposant réservé aux appels numériques : ' + rel);
      appelsReference++;
    }
  }
  const normalise = Buffer.from(brut.toString('latin1').split(manifeste.version).join(''), 'latin1');
  assert.equal(createHash('sha1').update(normalise).digest('hex').slice(0, 10), attendu, 'hash : ' + rel);
  assert.equal(brut.length, taille, 'taille : ' + rel);
  octetsPages += taille;
}
for (const [rel, taille] of manifeste.medias) {
  assert.equal(fs.statSync(path.join(out, rel)).size, taille, 'média présent : ' + rel);
  octetsMedias += taille;
}
assert.equal(octetsPages, manifeste.octetsPages);
assert.ok(appelsReference > 0, 'appels bibliographiques présents');
assert.ok(entetesArticles > 0, 'en-têtes partagés présents');
assert.equal(octetsMedias, manifeste.octetsMedias);

// Infographies : seules celles dont la page hôte survit à l'archivage du wiki des travailleurs
// (12 septembre 2026) sont vérifiées ici. « wiki-manutention-reperes-v1.png » et
// « wiki-exposition-voies-v1.png » (côté « Reconnaître une exposition ») n'étaient embarquées
// QUE dans des fiches travailleurs désormais archivées ; la première a disparu du site avec
// elles (perte réelle, signalée à Frank), la seconde survit par ailleurs (voies d'exposition).
const visuels = [
  { page: 'hygiene/bruit.html', fichier: 'wiki-bruit-mesurer-v1.png', parcours: ['w/', 'g/w/'] },
  { page: 'ergonomie/vibrations.html', fichier: 'wiki-vibrations-transmission-v1.png', parcours: ['w/', 'g/w/'] },
  { page: 'hygiene/silice-cristalline.html', fichier: 'wiki-silice-prevention-v1.png', parcours: ['w/', 'g/w/'] },
  { page: 'toxicologie/voies-dexposition.html', fichier: 'wiki-exposition-voies-v1.png', parcours: ['w/'] },
];
let pagesVisuelles = 0;
for (const visuel of visuels) {
  const asset = 'files/infographies/' + visuel.fichier;
  assert.ok(manifeste.medias.some(m => m[0] === asset), 'infographie disponible hors ligne : ' + asset);
  const png = fs.readFileSync(path.join(out, asset));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'image PNG valide');
  for (const parcours of visuel.parcours) {
    const rel = parcours + visuel.page;
    const html = lire(rel);
    assert.ok(html.includes(visuel.fichier), rel + ' : image conservée');
    assert.match(html, /<details class="infographie-texte">[\s\S]*?<summary>[\s\S]*?<\/details>/, rel + ' : version texte');
    assert.match(html, /<img[^>]+alt="[^"]{20,}"/, rel + ' : description accessible');
    assert.ok(html.includes('infographie-sources'), rel + ' : sources conservées');
    assert.ok(html.includes('Relecture éditoriale : non attestée'), rel + ' : aucune relecture inventée');
    pagesVisuelles++;
  }
}

// Wiki des travailleurs abandonné (12 septembre 2026) : ni portail ni copie t/w/, ni index
// travailleurs.html ; les anciennes adresses (dossiers de cours, wiki des travailleurs) sont
// redirigées par 404.html, autonome, à partir d'une table écrite par build_site.mjs ; le
// parcours de l'encadrement (/g/) reste intact.
assert.ok(!fs.existsSync(path.join(out, 't')), 'ancien wiki des travailleurs retiré');
assert.ok(!fs.existsSync(path.join(out, 'travailleurs.html')), 'ancien index des fiches retiré');
assert.ok(!lire('g/index.html').includes('window.WIKI_UI') && lire('g/index.html').includes('tb-layout'), 'portail encadrement conservé');
const page404 = lire('404.html');
assert.ok(page404.includes('location.replace'), 'redirection des anciennes adresses');
assert.ok(!page404.includes('<link') && !page404.includes('assets/'), 'page 404 autonome, sans ressource relative');
const redirections = JSON.parse(lire('assets/redirections.json'));
const nbRedirections = Object.keys(redirections).length;
assert.ok(nbRedirections > 100, 'table de redirection substantielle : ' + nbRedirections + ' entrée(s)');
for (const [ancienne, nouvelle] of Object.entries(redirections)) {
  assert.ok(fs.existsSync(path.join(out, nouvelle)), 'cible de redirection existante : ' + ancienne + ' → ' + nouvelle);
}

// Adresses par notion (12 septembre 2026) : aucune page des six wikis à plus d'un niveau sous
// w/<wiki>/ (hors theme/) — le rangement en dossiers de cours a disparu des adresses.
const SIX = ['droit-travail', 'ergonomie', 'hygiene', 'psychosocial', 'securite', 'toxicologie'];
for (const wiki of SIX) {
  const profondes = [];
  (function marcher(d, prof) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'theme') marcher(p, prof + 1); continue; }
      if (prof > 1 && e.name.endsWith('.html')) profondes.push(p);
    }
  })(path.join(out, 'w', wiki), 0);
  assert.equal(profondes.length, 0, `w/${wiki} : aucune page sous un dossier de cours, trouvé ${profondes.slice(0, 3).join(', ')}`);
}
assert.ok(fs.existsSync(path.join(out, 'themes.html')), 'page Thèmes présente');
for (const wiki of SIX) {
  const home = lire(`w/${wiki}/index.html`);
  assert.ok(home.includes('id="themes-du-wiki"') || home.includes('>Thèmes<'), `w/${wiki}/index.html : grille des thèmes`);
}

const voiesExposition = lire('w/toxicologie/voies-dexposition.html');
assert.ok(!lire('w/ergonomie/postures-contraignantes.html').includes('class="article-entete"'), 'en-tête compact retiré du site (pilote Cadenassage archivé avec sa fiche)');
assert.ok(voiesExposition.includes('ne signifie pas qu’un produit la traverse'), 'contact et absorption distingués');
assert.ok(voiesExposition.includes('<strong>Injection :</strong>'), 'voie non illustrée conservée en texte');
// « couleurs de transmission contextualisées » et « signes à surveiller hors du volet » :
// assertions du 1er septembre sur la fiche travailleur « 25 - .../Vibrations », archivée le
// 12 septembre 2026 avec le reste du wiki des travailleurs — leur texte précis n'a pas
// d'équivalent sur la notion « Vibrations » de 20 - Articles internes, retirées ici.
assert.ok(lire('w/hygiene/silice-cristalline.html').includes('une protection respiratoire appropriée peut rester requise'));
const isoStrain = lire('w/psychosocial/iso-strain-ce-que-ca-signifie.html');
for (const id of ['comprendre-les-trois-dimensions', 'ce-que-montrent-les-recherches', 'application-en-mine-un-exemple-a-verifier', 'comment-le-reperer-sans-surinterpreter', 'orienter-la-prevention', 'references']) {
  assert.ok(isoStrain.includes('id="' + id + '"'), 'iso-strain : section ' + id);
}
for (let i = 1; i <= 5; i++) {
  assert.equal((isoStrain.match(new RegExp('id="ref-iso-' + i + '"', 'g')) || []).length, 1, 'iso-strain : référence unique ' + i);
  assert.ok(isoStrain.includes('href="#ref-iso-' + i + '"'), 'iso-strain : référence appelée depuis le texte ' + i);
}
for (const source of ['https://www.inrs.fr/media.html?refINRS=FRPS+2', 'https://www.inrs.fr/dam/inrs/CataloguePapier/DMT/TI-FRPS-2.pdf', 'https://pubmed.ncbi.nlm.nih.gov/3421392/', 'https://pubmed.ncbi.nlm.nih.gov/2772582/', 'https://www.inspq.qc.ca/publications/2894']) assert.ok(isoStrain.includes(source), 'iso-strain : source conservée');
assert.ok(isoStrain.includes('Exemple fictif'), 'exemple minier présenté comme fictif');
assert.ok(isoStrain.includes('ne constituent pas automatiquement'), 'pas de généralisation au FIFO');
assert.ok(isoStrain.includes('ne permet pas de conclure à une relation causale'), 'limite de causalité conservée');
assert.ok(isoStrain.includes('Relecture éditoriale : non attestée'), 'pas de relecture humaine inventée');
assert.ok(!isoStrain.includes('Article en construction'), 'ancienne coquille remplacée');
assert.ok(!fs.existsSync(path.join(out, 'g/w/psychosocial/iso-strain-ce-que-ca-signifie.html')), 'publication gestionnaires inchangée');

const lotRps = [
  { page: 'psychosocial/demandes-psychologiques.html', prefixe: 'dem', parcours: ['w/'] },
  { page: 'psychosocial/latitude-decisionnelle.html', prefixe: 'lat', parcours: ['w/'] },
  { page: 'psychosocial/soutien-social-au-travail.html', prefixe: 'sou', parcours: ['w/', 'g/w/'] },
  { page: 'psychosocial/reconnaissance-au-travail.html', prefixe: 'rec', parcours: ['w/'], ancres: ['definition', 'les-quatre-formes-brun-et-dugas', 'pourquoi-cest-un-enjeu-de-sante', 'les-regles-dor-de-la-pratique', 'application-terrain', 'ressources'] },
  { page: 'psychosocial/justice-organisationnelle.html', prefixe: 'jus', parcours: ['w/'], ancres: ['definition', 'ce-que-dit-la-recherche', 'mesure', 'application-terrain', 'ressources'] },
  { page: 'psychosocial/definition-du-stress-professionnel.html', prefixe: 'str', parcours: ['w/', 'g/w/'], ancres: ['definition', 'stress-aigu-vs-chronique', 'mecanismes', 'application-en-mines', 'documents-et-outils', 'pour-aller-plus-loin'] },
];
let pagesRpsReferencees = 0;
for (const note of lotRps) {
  for (const parcours of note.parcours) {
    const html = lire(parcours + note.page);
    for (let n = 1; n <= 4; n++) {
      const ancre = 'ref-' + note.prefixe + '-' + n;
      assert.equal((html.match(new RegExp('id="' + ancre + '"', 'g')) || []).length, 1, 'RPS : référence unique ' + ancre);
      assert.ok(html.includes('href="#' + ancre + '"'), 'RPS : référence appelée ' + ancre);
    }
    assert.ok(html.includes('Sources consultées le'), 'RPS : traçabilité visible');
    assert.ok(html.includes('Relecture éditoriale : non attestée'), 'RPS : aucune validation humaine inventée');
    assert.ok(!html.includes('Article en construction'), 'RPS : ancienne coquille retirée');
    assert.match(html, /fictif|fictifs/, 'RPS : exemple identifié');
    for (const ancre of note.ancres || []) {
      assert.equal((html.match(new RegExp('id="' + ancre + '"', 'g')) || []).length, 1, 'RPS : ancienne ancre unique ' + ancre);
    }
    if (note.ancres) {
      // L'infobox est aussi un tableau : limiter ce contrôle au tableau de contenu.
      assert.equal((html.match(/<thead>/g) || []).length, 1, 'lot 3 : un seul tableau de compréhension');
      const entete = html.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] || '';
      assert.equal((entete.match(/<th(?:\s|>)/g) || []).length, 2, 'lot 3 : deux colonnes');
    }
    if (note.prefixe === 'str') assert.doesNotMatch(html, /img-000\.png|Usage personnel/i, 'stress : schéma de cours retiré de la page');
    if (note.prefixe === 'sou') {
      for (const ancre of ['definition', 'quatre-formes-de-soutien', 'sources-de-soutien', 'absence-de-soutien-et-iso-strain', 'application-en-mines', 'documents-et-outils', 'pour-aller-plus-loin']) {
        assert.equal((html.match(new RegExp('id="' + ancre + '"', 'g')) || []).length, 1, 'soutien : ancienne ancre unique ' + ancre);
      }
      assert.doesNotMatch(html, /2,2 à 2,8|15 minutes par jour|plus rentable|isolated prisoner/i);
    }
    pagesRpsReferencees++;
  }
}

const qualite = lire('qualite.html');
// Chantiers « terrain » (3 septembre 2026, sécurité/hygiène) et fiche cadenassage : appliqués
// à des pages du wiki des travailleurs, archivées le 12 septembre 2026. Leur contenu vit
// désormais dans 98 - Archives (non publié) ; les ancres et références qu'ils vérifiaient ne
// sont plus sur le site publié, ce n'est pas une régression de ce chantier-ci.
const terrainSuite = [
  { page: 'droit-travail/theme/obligations-de-lemployeur.html', prefixe: 'emp', refs: 4, parcours: ['w/', 'g/w/'], ancres: ['articles-couverts', 'articles-de-loi-pertinents'] },
];
for (const note of terrainSuite) {
  for (const parcours of note.parcours) {
    const html = lire(parcours + note.page);
    assert.ok(html.includes('<header class="article-titre">'), 'suite terrain : outils contenus dans le bloc du titre');
    const bibliographie = html.match(/<ol class="references-liste">([\s\S]*?)<\/ol>/)?.[1];
    assert.ok(bibliographie, 'suite terrain : bibliographie en une liste');
    assert.equal((bibliographie.match(/<li value="\d+">/g) || []).length, note.refs, 'suite terrain : une entrée par référence');
    for (let n = 1; n <= note.refs; n++) assert.ok(bibliographie.includes('<li value="' + n + '"><span id="ref-' + note.prefixe + '-' + n + '">'), 'suite terrain : numérotation et ancre réunies');
    assert.doesNotMatch(html, /<p>\s*<span id="ref-/, 'suite terrain : plus de ligne vide d’ancrage');
    for (const ancre of note.ancres) assert.equal((html.match(new RegExp('id="' + ancre + '"', 'g')) || []).length, 1, 'suite terrain : ancienne ancre unique');
    for (let n = 1; n <= note.refs; n++) {
      const ancre = 'ref-' + note.prefixe + '-' + n;
      assert.equal((html.match(new RegExp('id="' + ancre + '"', 'g')) || []).length, 1, 'suite terrain : référence unique');
      assert.ok(html.includes('href="#' + ancre + '"'), 'suite terrain : référence appelée');
    }
    assert.equal((html.match(/<thead>/g) || []).length, 1, 'suite terrain : un tableau');
    const entete = html.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] || '';
    assert.equal((entete.match(/<th(?:\s|>)/g) || []).length, 2, 'suite terrain : deux colonnes');
    assert.ok(html.includes('Sources consultées le'), 'suite terrain : traçabilité visible');
    assert.ok(html.includes('aucune validation spécialisée'), 'suite terrain : limite explicite');
    assert.ok(html.includes('Relecture éditoriale : non attestée'), 'suite terrain : aucune validation humaine inventée');
    assert.doesNotMatch(html, /class="redlink"/, 'suite terrain : aucun lien non résolu');
  }
}
assert.ok(qualite.includes('Contrôles automatiques de forme'));
assert.ok(qualite.includes('ni une note de fiabilité ni une validation SST'));
assert.ok(qualite.includes('Résultats par type de contenu'));
assert.ok(qualite.includes('Validation spécialisée datée et validateur déclaré'));

// Schémas vectoriels d'« Espaces clos » (25 septembre 2026) : dessinés depuis la page et les
// art. 302, 308, 308.1 et 309 du RSST ; ils remplacent trois captures de cours, dont celle qui
// affichait une alarme à 10 % de la LIE, contraire à l'art. 302. Lot du vault :
// content-updates/2026-09-25-espaces-clos-schemas.json.
const espacesClos = lire('w/securite/espaces-clos.html');
const schemasEspacesClos = ['limites-explosion', 'densite', 'purge', 'surveillant', 'cul-de-sac'].map(n => 'wiki-espaces-clos-' + n + '-v1.svg');
for (const fichier of schemasEspacesClos) {
  const asset = 'files/infographies/' + fichier;
  assert.ok(manifeste.medias.some(m => m[0] === asset), 'schéma disponible hors ligne : ' + asset);
  const svg = lire(asset);
  assert.match(svg, /<svg[^>]+viewBox="0 0 480 \d+"/, 'schéma : largeur de dessin commune ' + fichier);
  assert.match(svg, /<title[^>]*>[^<]{10,}<\/title>/, 'schéma : titre accessible ' + fichier);
  assert.doesNotMatch(svg, /<script|<image|<foreignObject|href="http|@import|url\(http/i, 'schéma autonome, sans ressource externe : ' + fichier);
  assert.doesNotMatch(svg, /10\s*%\s*de la LIE|(?:<|&lt;)\s?5\s*%/, 'schéma : aucune alarme à 10 %, « au plus 5 % » et non « < 5 % » : ' + fichier);
  const bloc = espacesClos.match(new RegExp('<div class="infographie[^"]*infographie-schema[^"]*">(?:(?!<div class="infographie)[\\s\\S])*?' + fichier.replace(/\./g, '\\.') + '[\\s\\S]*?<\\/div>'))?.[0];
  assert.ok(bloc, 'espaces clos : schéma posé dans un bloc inversible en thème sombre : ' + fichier);
  assert.match(bloc, /<img[^>]+alt="[^"]{40,}"/, 'espaces clos : description accessible ' + fichier);
  assert.match(bloc, /<details class="infographie-texte">[\s\S]*?<summary>[\s\S]*?<\/details>/, 'espaces clos : version texte ' + fichier);
  assert.ok(bloc.includes('infographie-sources'), 'espaces clos : sources ' + fichier);
}
assert.ok(!espacesClos.includes('pasted-image-20241214152919'), 'espaces clos : capture « alarme à 10 % de la LIE » retirée');
assert.ok(espacesClos.includes('moyen de communication bidirectionnel'), 'espaces clos : art. 308 en vigueur');
assert.ok(!espacesClos.includes('Contact visuel, auditif'), 'espaces clos : ancien résumé de l’art. 308 retiré');
// (le corps seulement : la fiche « électricité » mal intitulée pointe vers la page, et figure donc dans ses rétroliens)
assert.ok(!espacesClos.split('<nav class="voir-aussi"')[0].includes('art-309-rsst-electricite'), 'espaces clos : plan de sauvetage relié au bon article');
assert.ok(espacesClos.includes('Relecture éditoriale : non attestée'), 'espaces clos : aucune relecture inventée');
assert.ok(tokensThemeSombre(lire('assets/style.css')), 'schémas inversés en thème sombre, pas à l’impression');
function tokensThemeSombre(css) {
  return /@media screen \{\s*:root:not\(\[data-theme="light"\]\):not\(\[data-theme="auto"\]\) \.infographie-schema \.page-img img \{ filter: invert/.test(css)
    && /@media screen and \(prefers-color-scheme: dark\) \{\s*:root\[data-theme="auto"\] \.infographie-schema \.page-img img \{ filter: invert/.test(css);
}

console.log(JSON.stringify({ version: manifeste.version, fichiersHaches: manifeste.pages.length, mediasPresents: manifeste.medias.length, entetesArticles, titresGroupes, bibliographiesCompactes, appelsReference, infographies: new Set(visuels.map(v => v.fichier)).size, articlesIllustres: visuels.length, pagesVisuelles, schemasEspacesClos: schemasEspacesClos.length, redirections: nbRedirections, pagesRpsReferencees, octetsPages, octetsMedias, resultat: 'OK — vérifications statiques, pas une validation médicale ni un test navigateur' }, null, 2));
