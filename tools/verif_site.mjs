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
for (const [rel, attendu, taille] of manifeste.pages) {
  const brut = fs.readFileSync(path.join(out, rel));
  if (rel.endsWith('.html')) {
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
assert.equal(octetsMedias, manifeste.octetsMedias);

const visuels = [
  { page: 'ergonomie/25-articles-travailleurs/manutention.html', fichier: 'wiki-manutention-reperes-v1.png', parcours: ['w/', 't/w/'] },
  { page: 'hygiene/20-articles-internes/environnement-de-travail/bruit.html', fichier: 'wiki-bruit-mesurer-v1.png', parcours: ['w/', 'g/w/'] },
  { page: 'ergonomie/20-articles-internes/contraintes/vibrations.html', fichier: 'wiki-vibrations-transmission-v1.png', parcours: ['w/', 'g/w/'] },
  { page: 'toxicologie/25-articles-travailleurs/reconnaitre-une-exposition.html', fichier: 'wiki-exposition-voies-v1.png', parcours: ['w/', 't/w/'] },
  { page: 'hygiene/27-articles-gestionnaires/programmes-de-prevention/silice-cristalline.html', fichier: 'wiki-silice-prevention-v1.png', parcours: ['w/', 'g/w/'] },
  { page: 'toxicologie/20-articles-internes/voies-dexposition.html', fichier: 'wiki-exposition-voies-v1.png', parcours: ['w/'] },
  { page: 'ergonomie/25-articles-travailleurs/vibrations.html', fichier: 'wiki-vibrations-transmission-v1.png', parcours: ['w/', 't/w/'] },
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

for (const parcours of ['w/', 't/w/']) {
  const rel = parcours + 'securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html';
  const html = lire(rel);
  const entete = html.match(/<header class="article-entete">[\s\S]*?<\/header>/)?.[0];
  assert.ok(entete, rel + ' : en-tête compact présent');
  assert.equal((entete.match(/class="page-title"/g) || []).length, 1, rel + ' : titre unique');
  assert.equal((html.match(/<nav class="toc\b/g) || []).length, 1, rel + ' : sommaire unique');
  assert.ok(entete.includes('aria-controls="sommaire-sections"'), rel + ' : commande reliée au sommaire');
  assert.equal((entete.match(/<li class="toc-l/g) || []).length, 5, rel + ' : cinq sections accessibles');
  for (const lien of entete.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes('id="' + lien[1] + '"'), rel + ' : destination du sommaire existante');
  const tableau = html.match(/<table class="table-energies"[\s\S]*?<\/table>/)?.[0];
  assert.ok(tableau, rel + ' : tableau des énergies présent');
  assert.equal((tableau.match(/scope="col"/g) || []).length, 2, rel + ' : deux colonnes nommées');
  assert.equal((tableau.match(/scope="row"/g) || []).length, 6, rel + ' : six énergies nommées');
  assert.ok(tableau.includes('aria-label='), rel + ' : tableau nommé');
  for (const exemple of ['Un condensateur encore chargé', 'Un ressort encore comprimé', 'Une charge en hauteur pouvant redescendre', 'De la pression emprisonnée dans un circuit', 'Une pièce encore chaude', 'Des substances pouvant encore réagir']) {
    assert.ok(tableau.includes(exemple), rel + ' : exemple validé conservé');
  }
  assert.equal((html.match(/id="exemples-denergies-a-rechercher-en-mine"/g) || []).length, 1, rel + ' : ancienne ancre unique');
  assert.ok(html.includes('id="arreter-ne-suffit-pas"'), rel + ' : nouveau titre accessible');
  assert.ok(!/wiki-cadenassage-energies-v\d+\.png/.test(html), rel + ' : illustration remplacée');
  let detailsOuverts = 0;
  for (const tag of html.slice(0, html.indexOf(tableau)).matchAll(/<\/?details\b[^>]*>/g)) {
    detailsOuverts += tag[0].startsWith('</') ? -1 : 1;
  }
  assert.equal(detailsOuverts, 0, rel + ' : tableau hors de tout volet repliable');
  assert.ok(html.includes('Ces exemples ne sont pas exhaustifs'), rel + ' : portée conservée');
  assert.ok(html.includes('https://www.cchst.ca/oshanswers/hsprograms/hazardous_energy.html'), rel + ' : source conservée');
  assert.ok(html.includes('Relecture éditoriale : non attestée'), rel + ' : aucune relecture inventée');
}

const portailTravailleurs = lire('t/index.html');
const textePortail = portailTravailleurs.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '').replace(/©/g, '');
assert.doesNotMatch(textePortail, /\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u200D\uFE0F]/u, 'portail travailleurs sans emojis visibles');
assert.ok(portailTravailleurs.includes('window.WIKI_UI'), 'traitement des titres et commandes dynamiques présent');
assert.ok(portailTravailleurs.includes('tb-section-repere'), 'repères SVG présents');
assert.ok(!lire('g/index.html').includes('window.WIKI_UI'), 'portail encadrement exclu');
for (const numero of ['911', '811', '988']) assert.ok(portailTravailleurs.includes('href="tel:' + numero + '"'), 'accès téléphonique conservé');

const exposition = lire('t/w/toxicologie/25-articles-travailleurs/reconnaitre-une-exposition.html');
assert.ok(!lire('w/ergonomie/20-articles-internes/contraintes/postures-contraignantes.html').includes('class="article-entete"'), 'en-tête des autres articles inchangé');
const voiesExposition = lire('w/toxicologie/20-articles-internes/voies-dexposition.html');
assert.ok(voiesExposition.includes('ne signifie pas qu’un produit la traverse'), 'contact et absorption distingués');
assert.ok(voiesExposition.includes('<strong>Injection :</strong>'), 'voie non illustrée conservée en texte');
const vibrationsTravailleurs = lire('t/w/ergonomie/25-articles-travailleurs/vibrations.html');
assert.ok(vibrationsTravailleurs.includes('pas les seules zones du corps'), 'couleurs de transmission contextualisées');
assert.ok(vibrationsTravailleurs.includes('Les signes à surveiller'), 'signes à surveiller conservés hors du volet');
assert.ok(exposition.includes('Agir sans attendre après une exposition aiguë suspectée'));
assert.ok(!exposition.includes('Signaler dans le quart même'));
assert.ok(exposition.includes('sauvetage improvisé'));
assert.ok(exposition.includes('1 800 463-5060'));
assert.ok(exposition.includes('l’injection à travers la peau'), 'voies non exhaustives');
for (const id of ['les-trois-portes-dentree-dans-ton-corps', '1-les-poumons-inhalation', '2-la-peau-cutane', '3-la-bouche-digestif']) {
  assert.ok(exposition.includes('id="' + id + '"'), 'ancienne ancre conservée : ' + id);
}
assert.ok(lire('w/securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html').includes('Cette page ne constitue pas une procédure'));
assert.ok(lire('w/hygiene/27-articles-gestionnaires/programmes-de-prevention/silice-cristalline.html').includes('une protection respiratoire appropriée peut rester requise'));
const isoStrain = lire('w/psychosocial/20-articles/modeles-et-theories/iso-strain-ce-que-ca-signifie.html');
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
assert.ok(!fs.existsSync(path.join(out, 't/w/psychosocial/20-articles/modeles-et-theories/iso-strain-ce-que-ca-signifie.html')), 'publication travailleurs inchangée');
assert.ok(!fs.existsSync(path.join(out, 'g/w/psychosocial/20-articles/modeles-et-theories/iso-strain-ce-que-ca-signifie.html')), 'publication gestionnaires inchangée');

const lotRps = [
  { page: 'psychosocial/20-articles/modeles-et-theories/demandes-psychologiques.html', prefixe: 'dem', parcours: ['w/'] },
  { page: 'psychosocial/20-articles/modeles-et-theories/latitude-decisionnelle.html', prefixe: 'lat', parcours: ['w/'] },
  { page: 'psychosocial/20-articles/facteurs-organisationnels/soutien-social-au-travail.html', prefixe: 'sou', parcours: ['w/', 'g/w/'] },
  { page: 'psychosocial/20-articles/reconnaissance-au-travail.html', prefixe: 'rec', parcours: ['w/'], ancres: ['definition', 'les-quatre-formes-brun-et-dugas', 'pourquoi-cest-un-enjeu-de-sante', 'les-regles-dor-de-la-pratique', 'application-terrain', 'ressources'] },
  { page: 'psychosocial/20-articles/justice-organisationnelle.html', prefixe: 'jus', parcours: ['w/'], ancres: ['definition', 'ce-que-dit-la-recherche', 'mesure', 'application-terrain', 'ressources'] },
  { page: 'psychosocial/20-articles/modeles-et-theories/definition-du-stress-professionnel.html', prefixe: 'str', parcours: ['w/', 'g/w/'], ancres: ['definition', 'stress-aigu-vs-chronique', 'mecanismes', 'application-en-mines', 'documents-et-outils', 'pour-aller-plus-loin'] },
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
  for (const parcours of ['t/w/', 'g/w/'].filter(p => !note.parcours.includes(p))) {
    assert.ok(!fs.existsSync(path.join(out, parcours + note.page)), 'RPS : parcours non élargi');
  }
}

const qualite = lire('qualite.html');
assert.ok(qualite.includes('Contrôles automatiques de forme'));
assert.ok(qualite.includes('ni une note de fiabilité ni une validation SST'));
assert.ok(qualite.includes('Résultats par type de contenu'));
assert.ok(qualite.includes('Validation spécialisée datée et validateur déclaré'));
console.log(JSON.stringify({ version: manifeste.version, fichiersHaches: manifeste.pages.length, mediasPresents: manifeste.medias.length, infographies: new Set(visuels.map(v => v.fichier)).size, articlesIllustres: visuels.length, pagesVisuelles, tableauxCadenassage: 2, pagesRpsReferencees, octetsPages, octetsMedias, resultat: 'OK — vérifications statiques, pas une validation médicale ni un test navigateur' }, null, 2));
