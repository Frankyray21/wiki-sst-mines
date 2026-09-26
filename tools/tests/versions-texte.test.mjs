// Versions texte dépliables retirées du site (demandes de Frank, 26 septembre 2026) : « Lire le schéma en
// texte », puis les autres (« Lire la version texte — … », « Lire les voies en texte », « Lire l’illustration en
// texte »). Le générateur ne les publie plus, même depuis une note qui les garde ; tools/retirer_versions_texte.mjs
// nettoie les notes du vault. Aucun autre <details> n'est touché.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { sansVersionsTexte, sansVersionsTexteMd } from '../versions_texte.mjs';
import { blocMd } from '../poser_schemas.mjs';

const outils = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.dirname(outils);
const generateur = fs.readFileSync(path.join(outils, 'build_site.mjs'), 'utf8');
marked.setOptions({ gfm: true, breaks: true, mangle: false, headerIds: false }); // réglages de build_site.mjs
const rendu = md => sansVersionsTexte(marked.parse(md.replace(/!\[\[[^\]]+\]\]/g, 'IMAGE')));
const crlf = t => t.replace(/\n/g, '\r\n');
const encadre = t => '> [!info] Schéma\n' + t.split('\n').map(l => l ? '> ' + l : '>').join('\n');

const schema = { fichier: 'wiki-x-v1.svg', alt: 'Texte alternatif assez long pour être utile au lecteur.', legende: 'Légende.', sources: 'Sources.' };
const avecSchemaTexte = b => b.replace('</p>\n\n<p class="infographie-sources">', '</p>\n\n<details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n<li>Une puce.</li>\n<li>Une autre &lt; 1.</li>\n</ul>\n</details>\n<p class="infographie-sources">');
// infographie plus ancienne : tableau dans la version texte, ligne vide avant les sources
const infographie = t => ['<div class="infographie">', '', '![[Infographies/wiki-silice-prevention-v1.png|Alt assez long pour le lecteur.]]', '', '<p class="infographie-legende">Légende.</p>', '',
  ...(t ? ['<details class="infographie-texte">', '<summary>Lire la version texte — mesures et suivi</summary>', '<table>', '<thead><tr><th>Mesure</th><th>But</th></tr></thead>', '<tbody><tr><td>Capter</td><td>Réduire</td></tr></tbody>', '</table>', '</details>', ''] : []),
  '<p class="infographie-sources">Sources.</p>', '', '</div>'].join('\n');
// illustration des conflits : la version texte tient dans la ligne de la légende
const figure = t => ['<figure class="illustration-conflits" style="max-width:760px;margin:1.25rem auto">', '![[typologie-conflits-v2.jpg|Quatre objets de désaccord.]]',
  `<figcaption style="font-size:.9375rem"><p>Identifier l’objet du désaccord aide à distinguer les types.</p>${t ? '<details><summary>Lire l’illustration en texte</summary><ul><li><strong>Tâche :</strong> objectifs.</li></ul></details>' : ''}<p style="font-size:.8125rem">Illustration pédagogique créée avec l’aide de l’IA.</p></figcaption>`, '</figure>'].join('\n');

test('générateur : les versions texte sont retirées dès la lecture de la note, et encore au rendu', () => {
  assert.match(generateur, /import \{ sansVersionsTexte, sansVersionsTexteMd \} from '\.\/versions_texte\.mjs';/);
  assert.match(generateur, /p\.body = sansVersionsTexteMd\(raw\);/, 'avant le rendu, l’index de recherche (motsDePage) et les extraits');
  assert.match(generateur, /let html = sansVersionsTexte\(marked\.parse\(s\)\);/);
});

test('note du vault : chaque forme de version texte part, et la note devient celle qui ne l’a jamais eue', () => {
  const cas = [
    ['schéma', '### S\n\n' + blocMd(schema) + '\n\nSuite.\n', t => t ? avecSchemaTexte('### S\n\n' + blocMd(schema) + '\n\nSuite.\n') : '### S\n\n' + blocMd(schema) + '\n\nSuite.\n'],
    ['infographie', null, t => '### I\n\n' + infographie(t) + '\n\nSuite.\n'],
    ['illustration', null, t => '### F\n\n' + figure(t) + '\n\nSuite.\n'],
  ];
  for (const [nom, , note] of cas) {
    for (const [forme, v] of [['LF', t => t], ['CRLF', crlf], ['encadré', encadre], ['encadré CRLF', t => crlf(encadre(t))]]) {
      const avec = v(note(true)), sans = v(note(false));
      assert.ok(/<details/.test(avec), nom + ' ' + forme);
      assert.equal(sansVersionsTexteMd(avec), sans, `${nom} ${forme} : même note que sans version texte`);
      assert.equal(sansVersionsTexteMd(sans), sans, `${nom} ${forme} : note déjà nettoyée inchangée`);
    }
    assert.equal(rendu(note(true)), rendu(note(false)), nom + ' : même page rendue');
    assert.ok(!/<details/.test(rendu(note(true))), nom + ' : plus de <details>');
  }
  assert.ok(rendu(infographie(false)).includes('<p class="infographie-legende">Légende.</p><p class="infographie-sources">Sources.</p>'), 'légende puis sources, comme les pages publiées');
});

test('la vraie note des conflits (lot du 9 septembre) : les quatre illustrations perdent leur version texte, rien d’autre', () => {
  const lot = JSON.parse(fs.readFileSync(path.join(racine, 'content-updates', '2026-09-09-notions-cles-conflits.json'), 'utf8'));
  const note = lot.notes[0].contenu;
  assert.equal(note.split('Lire l’illustration en texte').length - 1, 4);
  const nette = sansVersionsTexteMd(note);
  assert.ok(!nette.includes('<details') && nette.split('\n').length === note.split('\n').length, 'mêmes lignes, légendes gardées');
  assert.equal(nette.split('<figcaption').length - 1, 4);
  assert.equal(nette, note.replace(/<details><summary>Lire l’illustration en texte<\/summary>(?:(?!<\/details>)[\s\S])*<\/details>/g, ''));
  // la page publiée est ce que le générateur rend de la note nettoyée : même légende d'illustration (liens
  // externes marqués comme le fait build_site.mjs)
  const page = fs.readFileSync(path.join(racine, 'docs/w/psychosocial/definition-et-typologie-des-conflits-au-travail.html'), 'utf8');
  const commeLeGenerateur = l => l.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a class="external" target="_blank" rel="noopener" href="$1"');
  for (const l of nette.split('\n').filter(x => x.startsWith('<figcaption'))) assert.ok(page.includes(commeLeGenerateur(l)), 'légende publiée telle que dans la note nettoyée : ' + l.slice(0, 80));
});

test('rien d’autre n’est touché : autres <details>, bloc sans fin, note sans version texte', () => {
  const autres = [
    '<details class="backlinks"><summary>Pages qui pointent ici (2)</summary><ul><li>x</li></ul></details>',
    '<details class="accueil-theme" id="theme-x" open><summary><span>Thème</span></summary><ul><li>x</li></ul></details>',
    '<details>\n<summary>Voir la réponse</summary>\nOui.\n</details>',
    '<details><summary>Lire la suite</summary><p>x</p></details>',
  ];
  for (const a of autres) {
    assert.equal(sansVersionsTexte(a), a, a.slice(0, 40));
    assert.equal(sansVersionsTexteMd(a), a, a.slice(0, 40));
  }
  const coupee = 'L\n\n<details class="infographie-texte">\n<summary>Lire le schéma en texte</summary>\n<ul>\n<li>x</li>\n';
  assert.equal(sansVersionsTexteMd(coupee), coupee, 'bloc sans fin : on n’y touche pas');
  const melangee = 'a\r\nb\nc\r\n';
  assert.equal(sansVersionsTexteMd(melangee), melangee, 'note sans version texte : rendue telle quelle, fins de ligne mêlées comprises');
});

test('générateur : estEtude déclaré avant son premier appel (il s’arrêtait au démarrage depuis le 21 septembre)', () => {
  const decl = generateur.indexOf('const estEtude = ');
  const appel = generateur.search(/(?<!const )\bestEtude\(q\)/);
  assert.ok(decl > 0 && appel > decl, 'la boucle des sources d’études appelle estEtude après sa déclaration');
});

test('outil du vault : essai sans écriture, application avec sauvegarde, archives intactes, second passage sans effet', () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-vt-'));
  const ecrire = (rel, t) => { fs.mkdirSync(path.dirname(path.join(vault, rel)), { recursive: true }); fs.writeFileSync(path.join(vault, rel), t); };
  const notes = {
    'Wiki Hygiène industrielle/20 - Articles internes/Silice cristalline.md': crlf('# Silice\n\n' + infographie(true) + '\n'),
    'Wiki SST psychosociale/20 - Articles/Conflits.md': '# Conflits\n\n' + figure(true) + '\n\n' + figure(true) + '\n',
    'Wiki SST psychosociale/20 - Articles/Schéma.md': avecSchemaTexte('# S\n\n' + blocMd(schema) + '\n'),
    'Wiki Ergonomie/20 - Articles internes/Sans version texte.md': '# Rien\n\n<details>\n<summary>Voir la réponse</summary>\nOui.\n</details>\n',
    'Wiki Ergonomie/98 - Archives/Ancienne.md': '# Archivée\n\n' + infographie(true) + '\n',
  };
  for (const [rel, t] of Object.entries(notes)) ecrire(rel, t);
  const outil = (...o) => execFileSync(process.execPath, [path.join(outils, 'retirer_versions_texte.mjs'), '--vault', vault, ...o], { cwd: vault, encoding: 'utf8' });
  const lire = rel => fs.readFileSync(path.join(vault, rel), 'utf8');
  try {
    const essai = outil();
    assert.match(essai, /Essai : 4 version\(s\) texte dans 3 note\(s\)/);
    for (const [rel, t] of Object.entries(notes)) assert.equal(lire(rel), t, 'essai : ' + rel + ' intacte');
    const sortie = outil('--appliquer');
    assert.match(sortie, /Appliqué : 4 version\(s\) texte retirée\(s\) de 3 note\(s\)/);
    for (const [rel, t] of Object.entries(notes)) {
      const garde = rel.includes('98 - Archives') || rel.includes('Sans version texte');
      assert.equal(lire(rel), garde ? t : sansVersionsTexteMd(t), rel);
      if (!garde) {
        assert.ok(!/en texte<\/summary>/.test(lire(rel)), rel + ' : nettoyée');
        const copie = path.join(sortie.match(/sauvegardes : (.+)$/m)[1], rel);
        assert.equal(fs.readFileSync(copie, 'utf8'), t, rel + ' : sauvegarde = note d’avant');
      }
    }
    assert.ok(lire('Wiki Hygiène industrielle/20 - Articles internes/Silice cristalline.md').includes('\r\n'), 'fins de ligne CRLF gardées');
    assert.match(outil('--appliquer'), /Rien à changer/);
  } finally {
    fs.rmSync(vault, { recursive: true, force: true });
  }
});
