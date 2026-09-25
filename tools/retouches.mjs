// Retouches ciblées d'une note du vault, décrites dans un lot (content-updates/*.json) quand le
// vault n'est pas accessible depuis l'environnement qui prépare la modification.
//
// Chaque retouche désigne SA ligne par un fragment de texte visible (« ligneContenant ») plutôt que
// par un numéro : la comparaison ignore la syntaxe des wikilinks ([[cible|libellé]] → libellé), le
// gras, les apostrophes droites ou typographiques et les espaces insécables. Une retouche dont le
// fragment ne désigne pas exactement une ligne n'est pas appliquée, et aucune retouche du lot ne
// l'est : la note reste intacte. Une retouche déjà faite est reconnue et sautée (lot rejouable).
//
// Types :
//   remplacer      { ligneContenant, avant, apres }  remplace « avant » dans la ligne
//   remplacerLigne { ligneContenant, par }           remplace la ligne entière
//   supprimerLigne { ligneContenant, marqueur }      retire la ligne (une image intégrée, p. ex.) ;
//                                                      « marqueur » = son remplaçant, s'il y en a un
//   insererApres   { ligneContenant, bloc, marqueur, colle } insère un bloc après la ligne ; « marqueur »
//                                                      (souvent le nom du fichier image) dit si c'est fait ;
//                                                      « colle » : sans ligne vide (rangée de tableau, puce)
// Dans « apres », « par » et « bloc », {{lien:<adresse publiée>|<libellé>}} devient un wikilink vers
// la note qui produit cette adresse (résolu par l'appelant, qui connaît le vault) ; « tableau: true »
// sur la retouche écrit le lien avec « \| », comme l'exige une cellule de tableau.

export function normaliser(s) {
  return String(s)
    .replace(/!?\[\[([^\]]+)\]\]/g, (m, x) => { const p = x.replace(/\\\|/g, '|').split('|'); return p[p.length - 1]; })
    .replace(/\*\*|__/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// « avant » tel qu'écrit dans le lot, retrouvé dans la ligne brute malgré apostrophes et espaces.
function motifSouple(avant) {
  const echap = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp([...String(avant)].map(c => {
    if (c === "'" || c === '’') return "['’]";
    if (/\s/.test(c) || c === ' ' || c === ' ') return '[\\s\\u00a0\\u202f]+';
    return echap(c);
  }).join('').replace(/(\[\\s\\u00a0\\u202f\]\+)+/g, '[\\s\\u00a0\\u202f]+'));
}

// Dans une cellule de tableau, la barre du libellé s'écrit « \| » (sinon elle coupe la cellule).
export function resoudreLiens(texte, resoudreLien, { tableau = false } = {}) {
  return String(texte).replace(/\{\{lien:([^|}]+)\|([^}]+)\}\}/g, (m, adresse, libelle) => {
    const cible = resoudreLien(adresse.trim());
    if (!cible) throw new Error('lien sans note : ' + adresse);
    return `[[${cible}${tableau ? '\\|' : '|'}${libelle}]]`;
  });
}

export function appliquerRetouches(texte, retouches, { resoudreLien = () => null } = {}) {
  const nl = texte.includes('\r\n') ? '\r\n' : '\n';
  let lignes = texte.split(/\r?\n/);
  const rapports = [];
  let ok = true;
  for (const r of retouches) {
    const voulu = normaliser(r.ligneContenant);
    const trouvees = [];
    lignes.forEach((l, i) => { if (normaliser(l).includes(voulu)) trouvees.push(i); });
    const rapport = { type: r.type, ligneContenant: r.ligneContenant };
    rapports.push(rapport);
    const dejaFait = () => {
      if (r.type === 'insererApres') return lignes.some(l => l.includes(r.marqueur));
      // comparaison sur le texte brut : « avant » et « apres » peuvent ne différer que par la cible d'un lien
      // (si la ligne n'est plus désignable — le fragment faisait partie du texte remplacé —, le
      // remplacement est fait quand « apres » figure sur une seule ligne et « avant » sur aucune)
      if (r.type === 'remplacer') {
        const avantL = motifSouple(r.avant), apresL = motifSouple(resoudreLiens(r.apres, resoudreLien, r));
        if (trouvees.length === 1) return !avantL.test(lignes[trouvees[0]]) && apresL.test(lignes[trouvees[0]]);
        return trouvees.length === 0 && lignes.filter(l => apresL.test(l)).length === 1 && !lignes.some(l => avantL.test(l));
      }
      if (r.type === 'remplacerLigne') return lignes.some(l => normaliser(l) === normaliser(resoudreLiens(r.par, resoudreLien, r)));
      // l'image est retirée pour être remplacée : sans ligne à retirer, la retouche n'est faite que si
      // la note portait déjà son remplaçant AVANT ce passage (lot rejoué), sinon elle est introuvable
      if (r.type === 'supprimerLigne') return trouvees.length === 0 && !!r.marqueur && texte.includes(r.marqueur);
      return false;
    };
    if (dejaFait()) { rapport.statut = 'déjà faite'; continue; }
    if (trouvees.length !== 1) {
      rapport.statut = trouvees.length ? `ambiguë (${trouvees.length} lignes)` : 'introuvable';
      ok = false; continue;
    }
    const i = trouvees[0];
    rapport.ligne = i + 1;
    if (r.type === 'remplacer') {
      const motif = motifSouple(r.avant);
      if (!motif.test(lignes[i])) { rapport.statut = 'fragment « avant » absent de la ligne'; ok = false; continue; }
      lignes[i] = lignes[i].replace(motif, () => resoudreLiens(r.apres, resoudreLien, r));
    } else if (r.type === 'remplacerLigne') {
      lignes[i] = resoudreLiens(r.par, resoudreLien, r);
    } else if (r.type === 'supprimerLigne') {
      lignes.splice(i, 1);
      // ne pas laisser deux lignes vides à la place de l'image retirée
      if (i < lignes.length && lignes[i].trim() === '' && i > 0 && lignes[i - 1].trim() === '') lignes.splice(i, 1);
    } else if (r.type === 'insererApres') {
      const bloc = resoudreLiens(r.bloc, resoudreLien, r).split(/\r?\n/);
      if (r.colle) {
        // lignes ajoutées à un tableau ou à une liste : aucune ligne vide, qui les en détacherait
        lignes.splice(i + 1, 0, ...bloc);
      } else {
        lignes.splice(i + 1, 0, '', ...bloc, '');
        // une seule ligne vide avant ce qui suit
        const fin = i + 1 + bloc.length + 2;
        while (fin < lignes.length && lignes[fin].trim() === '') lignes.splice(fin, 1);
      }
    } else {
      rapport.statut = 'type inconnu'; ok = false; continue;
    }
    rapport.statut = 'appliquée';
  }
  return { texte: lignes.join(nl), rapports, ok };
}
