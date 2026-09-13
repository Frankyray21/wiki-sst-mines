import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify, cleanLabel, RESERVES, ancienneAdresse, formuleMiroir, adresseDe, attribuerAdresses } from '../adresses.mjs';

const WIKIS = {
  'Wiki Ergonomie':            { slug: 'ergonomie' },
  'Wiki Hygiène industrielle': { slug: 'hygiene' },
  'Wiki Toxicologie':          { slug: 'toxicologie' },
  'Wiki Sécurité industrielle':{ slug: 'securite' },
  'Wiki Droit du travail':     { slug: 'droit-travail' },
  'Wiki SST psychosociale':    { slug: 'psychosocial' },
  'Recueil législatif SST':    { slug: 'legislation' },
};

function page(wikiKey, relPath, { role, body = '' } = {}) {
  return { wikiKey, relPath, base: relPath.split('/').pop().replace(/\.md$/, ''), role, body };
}

test('slugify : accents, apostrophes, espaces', () => {
  assert.equal(slugify("L'ergonomie du travail"), 'lergonomie-du-travail');
  assert.equal(slugify('Contrainte thermique'), 'contrainte-thermique');
  assert.equal(slugify(''), 'page');
});

test('cleanLabel : retire le préfixe numérique et les emojis de tête', () => {
  assert.equal(cleanLabel('20 - Articles internes'), 'Articles internes');
  assert.equal(cleanLabel('🏠 Accueil'), 'Accueil');
});

test('adresseDe : accueil, thème, notion, réservé', () => {
  const accueil = page('Wiki Ergonomie', 'Wiki Ergonomie/00 - \u{1F3E0} Accueil/00 - \u{1F3E0} Accueil.md');
  assert.equal(adresseDe(accueil, 'ergonomie', 'accueil'), 'w/ergonomie/index.html');

  const theme = page('Wiki Hygiène industrielle', 'Wiki Hygiène industrielle/10 - Thèmes/Agresseurs chimiques.md');
  assert.equal(adresseDe(theme, 'hygiene', 'theme'), 'w/hygiene/theme/agresseurs-chimiques.html');

  const notion = page('Wiki Ergonomie', 'Wiki Ergonomie/20 - Articles internes/Contraintes/Manutention manuelle.md');
  assert.equal(adresseDe(notion, 'ergonomie', 'notion'), 'w/ergonomie/manutention-manuelle.html');

  const reserve = page('Wiki SST psychosociale', 'Wiki SST psychosociale/15 - Navigation/\u{1F524} Index alphabétique.md');
  assert.ok(RESERVES.has(slugify(reserve.base)));
  assert.equal(adresseDe(reserve, 'psychosocial', 'notion'), 'w/psychosocial/index-alphabetique-note.html');
});

test('formuleMiroir / ancienneAdresse : formule miroir historique, inchangée', () => {
  const p = page('Wiki Ergonomie', 'Wiki Ergonomie/20 - Articles internes/Contraintes/Manutention manuelle.md');
  assert.equal(ancienneAdresse(p, 'ergonomie'), 'w/ergonomie/20-articles-internes/contraintes/manutention-manuelle.html');
  // reconstruction depuis un chemin-origine brut (note déjà archivée, plus dans `pages`)
  assert.equal(
    formuleMiroir('Wiki Sécurité industrielle/25 - Articles travailleurs/Risques mécaniques/Cadenassage', 'securite'),
    'w/securite/25-articles-travailleurs/risques-mecaniques/cadenassage.html'
  );
});

test('attribuerAdresses : Recueil inchangé, y compris son exception -2 (acgih)', () => {
  const pages = [
    page('Recueil législatif SST', 'Recueil législatif SST/30 - Organismes et tribunaux/ACGIH.md', { role: 'loi' }),
    page('Recueil législatif SST', 'Recueil législatif SST/40 - Concepts juridiques transverses/ACGIH.md', { role: 'loi' }),
  ];
  attribuerAdresses(pages, WIKIS);
  assert.equal(pages[0].out, 'w/legislation/30-organismes-et-tribunaux/acgih.html');
  assert.equal(pages[1].out, 'w/legislation/40-concepts-juridiques-transverses/acgih.html');
});

test('attribuerAdresses : un seul accueil, une seule adresse par thème, pas de collision avec l’index de dossier homonyme', () => {
  const pages = [
    page('Wiki SST psychosociale', 'Wiki SST psychosociale/00 - \u{1F3E0} Accueil/00 - \u{1F3E0} Accueil.md', { role: 'accueil' }),
    page('Wiki SST psychosociale', 'Wiki SST psychosociale/10 - Thèmes/Communication.md', { role: 'theme', body: 'x'.repeat(50) }),
    page('Wiki SST psychosociale', 'Wiki SST psychosociale/20 - Articles/Communication/Communication.md', { role: 'notion', body: 'y'.repeat(30) }),
  ];
  attribuerAdresses(pages, WIKIS);
  assert.equal(pages[0].out, 'w/psychosocial/index.html');
  assert.equal(pages[1].out, 'w/psychosocial/theme/communication.html');
  assert.equal(pages[2].out, 'w/psychosocial/communication.html');
});

test('attribuerAdresses : collision 20 vs 27, la note du dossier 27 reçoit -encadrement', () => {
  const pages = [
    page('Wiki Hygiène industrielle', 'Wiki Hygiène industrielle/20 - Articles internes/Environnement de travail/Contrainte thermique.md', { role: 'notion', body: 'a'.repeat(100) }),
    page('Wiki Hygiène industrielle', 'Wiki Hygiène industrielle/27 - Articles gestionnaires/Contrainte thermique.md', { role: 'notion', body: 'b'.repeat(10) }),
  ];
  attribuerAdresses(pages, WIKIS);
  assert.equal(pages[0].out, 'w/hygiene/contrainte-thermique.html');
  assert.equal(pages[1].out, 'w/hygiene/contrainte-thermique-encadrement.html');
});

test('attribuerAdresses : collision racine/sous-dossier dans un même dossier « 20 - … », le corps le plus long gagne le slug nu', () => {
  const pages = [
    page('Wiki Toxicologie', 'Wiki Toxicologie/20 - Articles internes/Amiante.md', { role: 'notion', body: 'x'.repeat(145) }),
    page('Wiki Toxicologie', 'Wiki Toxicologie/20 - Articles internes/Substances dangereuses/Amiante.md', { role: 'notion', body: 'y'.repeat(320) }),
  ];
  attribuerAdresses(pages, WIKIS);
  const racine = pages[0], sousDossier = pages[1];
  assert.equal(sousDossier.out, 'w/toxicologie/amiante.html', 'le corps le plus long (sous-dossier) obtient le slug nu');
  assert.equal(racine.out, 'w/toxicologie/amiante-articles-internes.html', 'la racine, plus courte, est suffixée par son propre dossier');
});

test('attribuerAdresses : collision persistante (deux perdantes réduites au même suffixe) refuse de choisir en silence', () => {
  const pages = [
    page('Wiki Ergonomie', 'Wiki Ergonomie/20 - Articles internes/Chaleur.md', { role: 'notion', body: 'a'.repeat(100) }),
    page('Wiki Ergonomie', 'Wiki Ergonomie/27 - Articles gestionnaires/Chaleur.md', { role: 'notion', body: 'b'.repeat(10) }),
    page('Wiki Ergonomie', 'Wiki Ergonomie/27 - Articles gestionnaires/Ambiances thermiques/Chaleur.md', { role: 'notion', body: 'c'.repeat(10) }),
  ];
  assert.throws(() => attribuerAdresses(pages, WIKIS), /Collision d'adresse résiduelle/);
});
