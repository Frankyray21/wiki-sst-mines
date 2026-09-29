// Outils de pose des corrections de texte sur le site publié (poser_corrections.mjs) et de mise à jour des renvois
// et du graphe (renvois_modifies.mjs), versés dans tools/ le 29 septembre 2026 : ils vivaient dans l'espace de
// travail temporaire des sessions et ont servi aux corrections du 25 au 29 septembre.
import test from 'node:test';
import assert from 'node:assert/strict';
import { poserRetouches, lotDepuisFiche, versHtml, motifHtml, cibleLien } from '../poser_corrections.mjs';
import { liensDuCorps, differenceLiens, majRenvois, majGraphe, LIMITE } from '../renvois_modifies.mjs';

const TITRES = {
  'w/legislation/10-lois-principales/lsst/art-179.html': 'art-179-LSST : pouvoirs d’accès',
  'w/legislation/10-lois-principales/lsst/art-238.html': 'art-238-LSST',
  'w/securite/cadenassage.html': 'Cadenassage',
};
const PUBLIEES = new Set([...Object.keys(TITRES), 'g/w/securite/cadenassage.html']);
const ctx = { titreDe: a => { if (!TITRES[a]) throw new Error('absente ' + a); return TITRES[a]; }, existe: a => PUBLIEES.has(a) };
const page = corps => `<html><head><title>X — WIKI SST Mines</title></head><body><main><div class="page-body">${corps}</div>`
  + '<details class="backlinks"><summary>Pages qui pointent ici (0)</summary><ul></ul></details></main></body></html>';
const REL = 'w/droit-travail/constat.html';
const poser = (html, retouches, rel = REL) => poserRetouches(html, rel, retouches, ctx);

test('remplacer : une occurrence, apostrophes et espaces souples, lien du wiki au format du générateur', () => {
  const p = page('<p>L&#39;inspecteur agit selon les articles 179 et 180. Voir aussi l’art. 51.11.</p>');
  const r = poser(p, [
    { type: 'remplacer', avant: "L'inspecteur agit selon les articles 179 et 180.", apres: "L'inspecteur agit selon les {{lien:w/legislation/10-lois-principales/lsst/art-179.html|articles 179 et 180}}." },
    { type: 'remplacer', avant: 'l’art. 51.11', apres: 'l’art. 51, 11°' },
  ]);
  assert.equal(r.erreurs, 0);
  assert.ok(r.page.includes('L&#39;inspecteur agit selon les <a href="../../w/legislation/10-lois-principales/lsst/art-179.html" title="art-179-LSST : pouvoirs d’accès">articles 179 et 180</a>.'), r.page);
  assert.ok(r.page.includes('l’art. 51, 11°'), 'l’apostrophe typographique reste telle quelle, comme chez marked');
  assert.ok(r.page.endsWith('</main></body></html>'), 'hors du corps, rien ne bouge');
});

test('rejouer une fiche ne change plus rien : chaque retouche se reconnaît déjà posée', () => {
  const fiche = [
    { type: 'remplacer', avant: 'texte ancien', apres: 'texte nouveau' },
    { type: 'remplacer', avant: 'alpha', apres: 'bêta', toutes: true },
  ];
  const un = poser(page('<p>texte ancien, alpha et alpha</p>'), fiche);
  assert.equal(un.erreurs, 0);
  assert.ok(un.page.includes('<p>texte nouveau, bêta et bêta</p>'), un.page);
  const deux = poser(un.page, fiche);
  assert.equal(deux.page, un.page);
  assert.deepEqual(deux.journal.map(j => j.etat), ['=', '=']);
});

test('insertion complétée plus loin dans la même fiche : rejouée, elle ne s’insère pas deux fois', () => {
  const fiche = [
    { type: 'insererApres', site: { avant: '<li>Kobasa (1979).</li>', apres: '<li>Kobasa (1979).</li>\n<li>Denollet (référence à préciser).</li>' } },
    { type: 'remplacer', avant: 'Denollet (référence à préciser).', apres: 'Denollet, J. (2005). DS14.' },
  ];
  const un = poser(page('<ul>\n<li>Kobasa (1979).</li>\n</ul>'), fiche);
  assert.equal(un.erreurs, 0);
  assert.ok(un.page.includes('<li>Kobasa (1979).</li>\n<li>Denollet, J. (2005). DS14.</li>'), un.page);
  const deux = poser(un.page, fiche);
  assert.equal(deux.page, un.page, 'aucune ligne en double');
  assert.deepEqual(deux.journal.map(j => j.etat), ['=', '=']);
});

test('refus : « avant » introuvable ou en double, « avant » contenu dans « apres », type inconnu', () => {
  const p = page('<p>deux fois, deux fois</p>');
  assert.equal(poser(p, [{ type: 'remplacer', avant: 'deux fois', apres: 'une fois' }]).erreurs, 1);
  assert.equal(poser(p, [{ type: 'remplacer', avant: 'absent', apres: 'autre' }]).erreurs, 1);
  assert.equal(poser(p, [{ type: 'remplacer', avant: 'deux', apres: 'deux fois encore' }]).erreurs, 1, 'lot non rejouable');
  assert.equal(poser(p, [{ type: 'inventer' }]).erreurs, 1);
  assert.throws(() => poserRetouches('<p>sans corps</p>', REL, [], ctx), /corps de page introuvable/);
});

test('ancienApres : une page qui porte une version antérieure passe à la nouvelle', () => {
  const r = poser(page('<p>Chiffre (source à préciser).</p>'), [
    { type: 'remplacer', avant: 'Chiffre non sourcé.', apres: 'Chiffre (Goh et al., 2016).', ancienApres: 'Chiffre (source à préciser).' },
  ]);
  assert.equal(r.erreurs, 0);
  assert.ok(r.page.includes('<p>Chiffre (Goh et al., 2016).</p>'));
});

test('liens : relibeller (avec ou sans nouvelle cible), recibler, délier', () => {
  const lien238 = '<a href="../../w/legislation/10-lois-principales/lsst/art-238.html" title="art-238-LSST">articles 179 et 180</a>';
  const r = poser(page(`<p>Pouvoirs : ${lien238}.</p>`), [
    { type: 'relibeller', libelle: 'articles 179 et 180', nouveau: 'art. 179 et 180', adresse: 'w/legislation/10-lois-principales/lsst/art-179.html', site: { cibleAvant: 'w/legislation/10-lois-principales/lsst/art-238.html' } },
  ]);
  assert.equal(r.erreurs, 0);
  assert.ok(r.page.includes('<a href="../../w/legislation/10-lois-principales/lsst/art-179.html" title="art-179-LSST : pouvoirs d’accès">art. 179 et 180</a>'), r.page);
  // page déjà relibellée mais pas encore reciblée : retrouvée par son ancienne cible
  const moitie = page('<p><a href="../../w/legislation/10-lois-principales/lsst/art-238.html" title="art-238-LSST">art. 179 et 180</a></p>');
  const r2 = poser(moitie, [{ type: 'relibeller', libelle: 'articles 179 et 180', nouveau: 'art. 179 et 180', adresse: 'w/legislation/10-lois-principales/lsst/art-179.html', site: { cibleAvant: 'w/legislation/10-lois-principales/lsst/art-238.html' } }]);
  assert.ok(r2.page.includes('art-179.html" title="art-179-LSST : pouvoirs d’accès">art. 179 et 180</a>'));
  const r3 = poser(page(`<p>${lien238}</p>`), [{ type: 'recibler', libelle: 'articles 179 et 180', adresse: 'w/legislation/10-lois-principales/lsst/art-179.html' }]);
  assert.ok(r3.page.includes('art-179.html" title="art-179-LSST : pouvoirs d’accès">articles 179 et 180</a>'));
  const r4 = poser(page(`<p>${lien238}</p>`), [{ type: 'delier', libelle: 'articles 179 et 180' }]);
  assert.ok(r4.page.includes('<p>articles 179 et 180</p>'));
});

test('copie encadrement : un lien reste dans le parcours g/ si la page y existe ; jamais pour le Recueil', () => {
  assert.equal(cibleLien('w/securite/cadenassage.html', 'g/w/droit-travail/constat.html', ctx.existe), 'g/w/securite/cadenassage.html');
  assert.equal(cibleLien('w/legislation/10-lois-principales/lsst/art-179.html', 'g/w/droit-travail/constat.html', ctx.existe), 'w/legislation/10-lois-principales/lsst/art-179.html');
  assert.equal(cibleLien('w/securite/cadenassage.html', REL, ctx.existe), 'w/securite/cadenassage.html');
  const html = versHtml("Voir {{lien:w/securite/cadenassage.html|le cadenassage}} et **l'essentiel** (< 5 %).", '../../../', 'g/w/droit-travail/constat.html', ctx);
  assert.equal(html, 'Voir <a href="../../../g/w/securite/cadenassage.html" title="Cadenassage">le cadenassage</a> et <strong>l&#39;essentiel</strong> (&lt; 5 %).');
  assert.ok(motifHtml("l'art. 51").test('l&#39;art. 51'));
});

test('lot du vault : les champs propres au site restent dehors', () => {
  const fiche = { page: REL, note: { titre: 'Constat', wiki: 'Wiki Droit du travail' }, retouches: [
    { type: 'insererApres', ligneContenant: 'a', marqueur: 'b', bloc: '- c', site: { avant: 'x', apres: 'y' } },
  ] };
  const lot = lotDepuisFiche(fiche, 'constat', '2026-09-29');
  assert.equal(lot.revision, '2026-09-29-corr-constat');
  assert.deepEqual(lot.retouches, [{ type: 'insererApres', ligneContenant: 'a', marqueur: 'b', bloc: '- c' }]);
  assert.equal(lot.note.page, REL);
});

test('renvois : liens du corps, différence, bloc « Pages qui pointent ici » trié, graphe', () => {
  const avant = page('<p><a href="../../w/securite/cadenassage.html">a</a> <a href="../../w/legislation/10-lois-principales/lsst/art-238.html">b</a></p>');
  const apres = page('<p><a href="../../w/securite/cadenassage.html#s">a</a> <a href="../../w/legislation/10-lois-principales/lsst/art-179.html">b</a></p>');
  assert.deepEqual([...liensDuCorps(apres, REL)].sort(), ['w/legislation/10-lois-principales/lsst/art-179.html', 'w/securite/cadenassage.html']);
  assert.deepEqual(differenceLiens(avant, apres, REL), { ajouts: ['w/legislation/10-lois-principales/lsst/art-179.html'], retraits: ['w/legislation/10-lois-principales/lsst/art-238.html'] });
  const cible = 'w/legislation/10-lois-principales/lsst/art-179.html';
  const racine = '../../../../';
  const bloc = n => `<details class="backlinks"><summary>Pages qui pointent ici (${n})</summary><ul>`;
  const html = `<main>${bloc(1)}<li><a href="${racine}w/x/zeta.html">Zêta</a> <small class="bl-wiki">Sécurité</small></li></ul></details></main>`;
  const source = s => ({ 'w/droit-travail/constat.html': { titre: 'Constat d’infraction', wiki: 'Droit du travail' } })[s] || null;
  const r = majRenvois(html, cible, { ajouts: [REL, 'w/inconnue.html'] }, source);
  assert.deepEqual(r.ajoutes, [REL]);
  assert.equal(r.html, `<main>${bloc(2)}<li><a href="${racine}${REL}">Constat d’infraction</a> <small class="bl-wiki">Droit du travail</small></li><li><a href="${racine}w/x/zeta.html">Zêta</a> <small class="bl-wiki">Sécurité</small></li></ul></details></main>`, 'tri alphabétique à la française');
  assert.equal(majRenvois(r.html, cible, { ajouts: [REL] }, source).html, r.html, 'ajout déjà présent : rien ne change');
  const retire = majRenvois(r.html, cible, { retraits: [REL] }, source);
  assert.deepEqual(retire.retires, [REL]);
  assert.ok(retire.html.includes(bloc(1)));
  // au-delà de la limite du générateur, la liste s'arrête sur « … »
  const longue = `<main>${bloc(LIMITE)}${Array.from({ length: LIMITE }, (_, i) => `<li><a href="${racine}w/x/p${String(i).padStart(2, '0')}.html">P${String(i).padStart(2, '0')}</a> <small class="bl-wiki">W</small></li>`).join('')}</ul></details></main>`;
  const plus = majRenvois(longue, cible, { ajouts: [REL] }, source);
  assert.ok(plus.html.includes(bloc(LIMITE + 1)) && plus.html.includes('<li>…</li>'));
  // graphe non orienté : arête ajoutée ; retirée sauf si la cible pointe elle-même vers la source
  const g = { n: [{ u: REL }, { u: cible }, { u: 'w/y.html' }], e: [[0, 2]] };
  majGraphe(g, cible, { ajouts: [REL] });
  assert.deepEqual(g.e, [[0, 2], [0, 1]]);
  majGraphe(g, cible, { retraits: [REL] }, () => true);
  assert.deepEqual(g.e, [[0, 2], [0, 1]], 'lien retour : l’arête reste');
  majGraphe(g, cible, { retraits: [REL] });
  assert.deepEqual(g.e, [[0, 2]]);
});
