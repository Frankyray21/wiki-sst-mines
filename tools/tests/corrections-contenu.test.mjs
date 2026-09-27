// Lots du 27 septembre 2026 « corr-* » : corrections de contenu décidées par Frank (« go » sur les choix en
// attente). Chaque lot est appliqué deux fois à une note reconstituée (le second passage ne change rien), et
// la page publiée porte le texte corrigé, plus l'ancien.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outils = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.dirname(outils);
const dossier = path.join(racine, 'content-updates');
const lots = fs.readdirSync(dossier).filter(f => /^2026-09-27-corr-.+\.json$/.test(f)).sort();
const decode = s => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const souple = s => decode(s).replace(/[’‘]/g, "'").replace(/[\s  ]+/g, ' ');
// texte d'un lot tel que la page l'affiche : lien → libellé, gras et italique → texte (un astérisque seul reste)
const visible = s => souple(String(s).replace(/\{\{lien:[^|}]+\|([^}]+)\}\}/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*\s][^*]*)\*/g, '$1').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1'));
function corpsDe(rel) {
  const t = fs.readFileSync(path.join(racine, 'docs', rel), 'utf8');
  const d = t.indexOf('<div class="page-body');
  let f = t.indexOf('<details class="backlinks"');
  if (f < 0) f = t.indexOf('</main>');
  const html = t.slice(d, f);
  // blocs : paragraphe, élément de liste, rangée de tableau, titre (une ligne de la note chacun)
  const blocsHtml = html.split(/<\/tr>|<\/p>|<\/li>|<br\s*\/?>|<\/h[1-6]>/).map(souple);
  const blocs = blocsHtml.map(b => b.replace(/<[^>]+>/g, ' ').replace(/ +/g, ' '));
  return { brut: souple(html), texte: souple(html.replace(/<[^>]+>/g, '')), blocs, blocsHtml };
}

test('lots de correction du 27 septembre : au moins un, chacun désigne une page publiée', () => {
  assert.ok(lots.length > 0);
  for (const nom of lots) {
    const lot = JSON.parse(fs.readFileSync(path.join(dossier, nom), 'utf8'));
    assert.ok(fs.existsSync(path.join(racine, 'docs', lot.note.page)), nom + ' : page ' + lot.note.page);
    assert.ok(lot.note.titre && lot.note.wiki, nom + ' : note désignée par son titre et son wiki');
  }
});

// Note reconstituée : le titre, puis une ligne par fragment désigné, qui porte les textes à remplacer.
function note(lot) {
  const lignes = ['# ' + lot.note.titre, ''];
  const par = new Map(), doubles = new Set();
  for (const r of lot.retouches) {
    if (r.type === 'remplacer') {
      const l = par.get(r.ligneContenant) ?? (r.avant.includes(r.ligneContenant) ? '' : r.ligneContenant);
      par.set(r.ligneContenant, l.includes(r.avant) ? l : (l ? l + ' ' : '') + r.avant);
    } else if (r.type === 'recibler') {
      // la ligne porte un lien de ce libellé vers une autre note (homonyme d'un autre wiki)
      const l = r.ligneContenant === r.libelle ? '### ' + r.libelle : r.ligneContenant;
      par.set(r.ligneContenant, l.replace(r.libelle, `[[Ancienne cible|${r.libelle}]]`));
    } else if (r.type === 'relibeller' || r.type === 'delier') {
      // la ligne porte un lien de ce libellé (vers un PDF à une page donnée, pour relibeller)
      const lib = [].concat(r.libelle)[0];
      const lien = `[[Ancienne cible${r.ancre ? '.pdf#page=1' : ''}|${lib}]]`;
      par.set(r.ligneContenant, (par.get(r.ligneContenant) ?? (r.ligneContenant === lib ? '' : r.ligneContenant)) + ' ' + lien);
    } else if (r.type === 'ajouterFin') {
      par.set(r.ligneContenant, par.get(r.ligneContenant) ?? r.ligneContenant + (r.avantPoint ? '.' : ''));
    } else if (!par.has(r.ligneContenant)) par.set(r.ligneContenant, (r.type === 'remplacerLigne' || r.type === 'supprimerLigne' ? '- ' : '') + r.ligneContenant);
    // une rangée de tableau (« avant » commence par une barre) : la ligne a la forme d'un en-tête
    if (r.type === 'remplacer' && /^\|/.test(r.avant)) {
      const rangee = '| ' + r.ligneContenant + ' |';
      par.set(r.ligneContenant, rangee.includes(r.avant.trim()) ? rangee : '| ' + r.ligneContenant + ' ' + r.avant.trim());
    }
    if (r.toutes) doubles.add(r.ligneContenant);
  }
  // « toutes » : la ligne revient deux fois (un en-tête identique dans deux tableaux, p. ex.)
  for (const [k, l] of par) { if (!lignes.includes(l)) lignes.push(l, ''); if (doubles.has(k)) lignes.push(l, ''); }
  return lignes.join('\n') + '\n';
}

for (const nom of lots) {
  test('lot ' + nom + ' : appliqué, puis second passage sans effet ; page publiée corrigée', () => {
    const lot = JSON.parse(fs.readFileSync(path.join(dossier, nom), 'utf8'));
    const v = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-corr-'));
    const abs = path.join(v, lot.note.wiki, '20 - Articles internes', lot.note.titre + '.md');
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, note(lot));
    // une note pour chaque renvoi {{lien:…}}, nommée comme son adresse publiée, dans le wiki de l'adresse
    const WIKI_DE = { legislation: 'Recueil législatif SST', securite: 'Wiki Sécurité industrielle', hygiene: 'Wiki Hygiène industrielle', toxicologie: 'Wiki Toxicologie', ergonomie: 'Wiki Ergonomie', 'droit-travail': 'Wiki Droit du travail', psychosocial: 'Wiki SST psychosociale' };
    for (const [, a] of [...JSON.stringify(lot).matchAll(/\{\{lien:(w\/[^|}]+)\|/g), ...lot.retouches.filter(r => r.adresse).map(r => [null, r.adresse])]) {
      const f = path.join(v, WIKI_DE[a.split('/')[1]], path.basename(a, '.html') + '.md');
      if (!fs.existsSync(f)) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, '# ' + path.basename(a, '.html') + '\n'); }
    }
    const outil = () => execFileSync(process.execPath, [path.join(outils, 'appliquer_retouches.mjs'), '--lot', path.join(dossier, nom), '--vault', v, '--appliquer'], { cwd: v, encoding: 'utf8' });
    assert.doesNotMatch(outil(), /✗/);
    const apres = fs.readFileSync(abs, 'utf8');
    assert.doesNotMatch(apres, /\{\{lien:/, 'renvois résolus');
    assert.match(outil(), /Rien à changer/);
    assert.equal(fs.readFileSync(abs, 'utf8'), apres);
    for (const r of lot.retouches.filter(r => r.type === 'remplacer')) {
      assert.ok(!r.apres.includes(r.avant), nom + ' : « avant » hors de « apres »');
      assert.ok(apres.includes(r.apres.replace(/\{\{lien:[^}]+\}\}/g, '')) || /\{\{lien:/.test(r.apres), nom + ' : texte corrigé dans la note');
    }
    // page publiée (et sa copie encadrement) : le texte corrigé, plus l'ancien
    for (const rel of [lot.note.page, 'g/' + lot.note.page].filter(p => fs.existsSync(path.join(racine, 'docs', p)))) {
      const { brut, texte, blocs, blocsHtml } = corpsDe(rel);
      for (const r of lot.retouches.filter(r => r.type === 'remplacer')) {
        // en-tête ou cellule de tableau (« | Effet | » → « | Effet attendu (source à préciser) | ») : cellule par cellule
        if (/^\|/.test(r.avant)) {
          const cellules = t => visible(t).split('|').map(c => c.trim()).filter(Boolean);
          const nouvelles = cellules(r.apres), anciennes = cellules(r.avant).filter(c => !nouvelles.includes(c));
          for (const c of nouvelles) assert.ok(new RegExp('<t[hd]>' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</t[hd]>').test(brut), `${rel} : cellule « ${c} » publiée`);
          for (const c of anciennes) assert.ok(!new RegExp('<t[hd]>' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</t[hd]>').test(brut), `${rel} : cellule « ${c} » retirée`);
          continue;
        }
        const a = visible(r.apres), b = visible(r.avant);
        assert.ok(texte.includes(a) || brut.includes(a), `${rel} : « ${a.slice(0, 60)} » publié`);
        // un « avant » court qui revient ailleurs dans la page (« Secondaire » dans un tableau de niveaux) : retiré
        // de la ligne désignée seulement
        // même texte visible, un lien en plus (« consulter la page Iso-strain ») : le lien est publié
        if (a === b) {
          for (const [, adr, lib] of r.apres.matchAll(/\{\{lien:([^|}]+)\|([^}]+)\}\}/g)) {
            assert.ok(new RegExp('<a href="[./]*' + adr.trim().replace(/[.]/g, '\\.') + '"[^>]*>' + lib + '</a>').test(brut), `${rel} : lien « ${lib} » publié`);
          }
          continue;
        }
        const ligne = blocs.filter(x => x.includes(visible(r.ligneContenant)));
        const retire = (!texte.includes(b) && !brut.includes(b)) || (ligne.length === 1 && ligne[0].includes(a) && !ligne[0].includes(b));
        assert.ok(retire, `${rel} : « ${b.slice(0, 60)} » retiré`);
      }
      for (const r of lot.retouches.filter(r => r.type === 'remplacerLigne')) {
        const a = visible(r.par).replace(/^[-*]\s+/, '');
        assert.ok(texte.includes(a), `${rel} : ligne « ${a.slice(0, 60)} » publiée`);
      }
      for (const r of lot.retouches.filter(r => r.type === 'relibeller')) {
        assert.ok(brut.includes('>' + souple(r.nouveau) + '</a>'), `${rel} : libellé « ${r.nouveau} » publié`);
        assert.ok(!brut.includes('>' + souple(r.libelle) + '</a>'), `${rel} : libellé « ${r.libelle} » retiré`);
      }
      for (const r of lot.retouches.filter(r => r.type === 'delier')) {
        // la ligne visée ne porte plus de lien de ce libellé ; le texte y reste
        const ligne = blocsHtml.filter((b, i) => blocs[i].includes(visible(r.ligneContenant)));
        assert.equal(ligne.length, 1, `${rel} : une ligne « ${r.ligneContenant} »`);
        for (const lib of [].concat(r.libelle)) assert.ok(!ligne[0].includes('>' + souple(lib) + '</a>'), `${rel} : « ${lib} » n’est plus un lien sur la ligne visée`);
        assert.ok(blocs[blocsHtml.indexOf(ligne[0])].includes(souple(r.texte ?? [].concat(r.libelle)[0])), `${rel} : le texte reste`);
      }
      for (const r of lot.retouches.filter(r => r.type === 'recibler')) {
        const liens = [...brut.matchAll(/<a href="[./]*([^"]+)"[^>]*>([^<]*)<\/a>/g)].filter(m => m[2] === r.libelle);
        assert.ok(liens.length >= 1 && liens.every(m => m[1] === r.adresse), `${rel} : « ${r.libelle} » mène à ${r.adresse}`);
      }
    }
  });
}
