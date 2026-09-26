// Tous les lots de schémas (content-updates/*-schemas.json) : chaque schéma (ou image PNG/JPEG fournie par
// l'auteur) est publié, autonome, accessible, et la page publiée dit la même chose que le bloc destiné à la
// note du vault.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifierSvg, verifierImage } from '../poser_schemas.mjs';
import { dimensionsImage } from '../dimensions_svg.mjs';

const racine = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const dossier = path.join(racine, 'content-updates');
const lots = fs.readdirSync(dossier).filter(f => /-schemas\.json$/.test(f)).sort();
const dec = s => s.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

test('au moins un lot de schémas', () => assert.ok(lots.length >= 1));

for (const nom of lots) {
  test('lot de schémas ' + nom, () => {
    const lot = JSON.parse(fs.readFileSync(path.join(dossier, nom), 'utf8'));
    // la page publiée et, si la note est aussi publiée pour l'encadrement, sa copie g/
    const pages = [lot.note.page, 'g/' + lot.note.page].filter(p => fs.existsSync(path.join(racine, 'docs', p)));
    for (const p of pages) verifierPage(lot, p, fs.readFileSync(path.join(racine, 'docs', p), 'utf8'));
  });
}

function verifierPage(lot, adresse, page) {
  // un bloc par schéma : inséré, ou remplaçant la version publiée avant (remplacerBloc)
  const blocs = lot.retouches.filter(r => (r.type === 'insererApres' || r.type === 'remplacerBloc') && String(r.marqueur).startsWith('Infographies/'));
  for (const r of blocs.filter(x => x.type === 'remplacerBloc')) {
    assert.ok(!page.includes(r.ancien.slice('Infographies/'.length)), adresse + ' : version remplacée retirée : ' + r.ancien);
    assert.notEqual(r.ancien, r.marqueur);
  }
  assert.equal(blocs.length, lot.medias.length, 'un bloc par schéma');
  for (const m of lot.medias) {
    if (!/\.svg$/i.test(m.depuis)) { verifierImage(fs.readFileSync(path.join(racine, m.depuis)), m.depuis); continue; }
    const svg = fs.readFileSync(path.join(racine, m.depuis), 'utf8');
    verifierSvg(svg, m.depuis);
    assert.doesNotMatch(svg, /(?:<|&lt;)\s?5\s*%\s*(?:de la )?LIE|10\s*%\s*de la LIE/, 'aucune limite de la LIE mal écrite : ' + m.depuis);
  }
  for (const r of blocs) {
    const fichier = r.marqueur.slice('Infographies/'.length);
    const html = page.match(new RegExp('<div class="infographie infographie-compacte infographie-schema">(?:(?!<div class="infographie)[\\s\\S])*?' + fichier.replace(/\./g, '\\.') + '[\\s\\S]*?</div>'))?.[0];
    assert.ok(html, adresse + ' : bloc publié : ' + fichier);
    assert.ok(html.includes('<p class="infographie-legende">' + r.bloc.match(/<p class="infographie-legende">([\s\S]*?)<\/p>/)[1] + '</p>'), 'même légende : ' + fichier);
    for (const p of r.bloc.matchAll(/<li>([\s\S]*?)<\/li>/g)) assert.ok(html.includes('<li>' + p[1] + '</li>'), 'même version texte : ' + fichier);
    const alt = r.bloc.match(/!\[\[Infographies\/[^|]+\|([^\]]+)\]\]/)[1];
    assert.equal(dec(html.match(/alt="([^"]*)"/)[1]), alt, 'même texte alternatif : ' + fichier);
    assert.ok(alt.length >= 40, 'texte alternatif utile : ' + fichier);
    if (/\.svg$/i.test(fichier)) assert.match(html, /width="480" height="\d+" loading="lazy"/, 'place réservée : ' + fichier);
    else {
      const d = dimensionsImage(fs.readFileSync(path.join(racine, 'docs/files/infographies', fichier)));
      assert.ok(html.includes(` width="${d.largeur}" height="${d.hauteur}" loading="lazy"`), 'place réservée, comme le fait le générateur : ' + fichier);
    }
    assert.ok(html.includes('infographie-sources'), 'sources : ' + fichier);
  }
  for (const r of lot.retouches.filter(x => x.type === 'supprimerLigne')) {
    const reste = r.ligneContenant;
    if (/^\d{14}$/.test(reste)) assert.ok(!page.includes('pasted-image-' + reste), adresse + ' : capture remplacée retirée : ' + reste);
  }
}
