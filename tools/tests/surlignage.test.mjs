// Surlignage coloré d'Obsidian (« ~={couleur}texte=~ ») : le générateur le rend en <mark> teinté au lieu du
// texte barré que produisait marked ; les pages publiées sont reposées par la même règle (27 septembre 2026).
// Le code reste tel quel, une couleur inconnue garde le surlignage par défaut, et les marqueurs ne laissent plus de
// trace dans le sommaire, les extraits ni l'index de recherche (29 septembre 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { surlignagesColores, surlignagesColoresHtml, horsCode, sansMarqueursSurlignage, sommaireSansSurlignage, COULEURS_SURLIGNAGE } from '../surlignage.mjs';
import { motsDePage, decoderListe } from '../recherche_mots.mjs';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const m = (c, t) => `<mark class="surligne surligne-${c}">${t}</mark>`;
const defaut = t => `<mark class="surligne">${t}</mark>`;
const gen = fs.readFileSync(path.join(R, 'tools/build_site.mjs'), 'utf8');
const css = fs.readFileSync(path.join(R, 'tools/style.css'), 'utf8');
// même analyseur que le générateur (gfm : un seul « ~ » suffit à ouvrir un barré)
const rendre = md => new Marked({ gfm: true, breaks: true }).parse(surlignagesColores(md));

test('note : couleur, double accolade, espace avant « =~ », mot collé, fin de ligne sans « =~ »', () => {
  assert.equal(surlignagesColores('**~={purple}aide-foreur =~** junior'), `**${m('purple', 'aide-foreur')}** junior`);
  assert.equal(surlignagesColores('~={{red}}dépression =~ et anxiété'), m('red', 'dépression') + ' et anxiété');
  assert.equal(surlignagesColores('~={orange}N = 240, 4  =~semaines'), m('orange', 'N = 240, 4') + ' semaines', 'le mot collé reste séparé');
  assert.equal(surlignagesColores('- isolement ~={purple}FIFO ='), '- isolement ' + m('purple', 'FIFO'));
  assert.equal(surlignagesColores('~=sans couleur=~'), defaut('sans couleur'));
  assert.equal(surlignagesColores('~={orange}~15-18 % =~'), m('orange', '~15-18 %'), 'tilde d’approximation gardé');
});

test('couleur connue : chaque teinte de la feuille de style, majuscules comprises', () => {
  for (const c of COULEURS_SURLIGNAGE) {
    assert.equal(surlignagesColores(`~={${c}}texte=~`), m(c, 'texte'));
    assert.ok(css.includes('mark.surligne-' + c), 'teinte prévue pour ' + c);
  }
  assert.equal(surlignagesColores('~={Red}Texte =~'), m('red', 'Texte'));
});

test('couleur inconnue : le surlignage par défaut, jamais la syntaxe ni une classe sans teinte', () => {
  assert.equal(surlignagesColores('~={teal}texte=~'), defaut('texte'));
  assert.equal(surlignagesColores('~={{grey}}texte =~ suite'), defaut('texte') + ' suite');
  assert.equal(surlignagesColores('fin ~={beige}texte ='), 'fin ' + defaut('texte'));
  assert.equal(surlignagesColoresHtml('<del>={teal}texte =</del>'), defaut('texte'));
});

test('texte avec ponctuation : les signes restent dedans ou autour, à leur place', () => {
  assert.equal(surlignagesColores('logique du travailleur = ~={green}prévention =~ dangers pour santé'),
    `logique du travailleur = ${m('green', 'prévention')} dangers pour santé`);
  assert.equal(surlignagesColores('(~={red}burnout=~), puis ~={orange}« 15 % » !=~ ; fin.'),
    `(${m('red', 'burnout')}), puis ${m('orange', '« 15 % » !')} ; fin.`);
  assert.equal(surlignagesColores('~={cyan}d’après l’INSPQ : 1/3 (2018)=~.'), m('cyan', 'd’après l’INSPQ : 1/3 (2018)') + '.');
});

test('deux surlignages sur une même ligne, dans le gras comme dans le texte', () => {
  assert.equal(surlignagesColores('~={green}prévention =~ et ~={purple}aide-foreur =~'), `${m('green', 'prévention')} et ${m('purple', 'aide-foreur')}`);
  assert.equal(surlignagesColores('**Implication ~={purple}aide-foreur =~** : RPS FIFO, ~={red}burnout =~, troubles mentaux'),
    `**Implication ${m('purple', 'aide-foreur')}** : RPS FIFO, ${m('red', 'burnout')}, troubles mentaux`);
  assert.equal(surlignagesColores('~={cyan}Santé = Prévention =~ RPS, ~={red}burnout =~, troubles'),
    `${m('cyan', 'Santé = Prévention')} RPS, ${m('red', 'burnout')}, troubles`, 'un « = » du texte ne ferme pas le surlignage');
});

test('note : un surlignage dans un autre, du plus intérieur au plus extérieur', () => {
  assert.equal(surlignagesColores('en ~={orange}5 RPS ~={purple}FIFO =~-spécifiques =~ ici'), `en ${m('orange', `5 RPS ${m('purple', 'FIFO')}-spécifiques`)} ici`);
});

test('code : rien ne change dans les blocs de code ni dans le code en ligne', () => {
  const blocs = [
    '```\n~={red}texte=~ et ==x==\n```',
    '```js\nconst s = "~={green}a=~";\n```',
    '~~~\n~={purple}b=~\n~~~',
    '````md\n```\n~={red}c=~\n```\n````',
    '```\r\n~={red}crlf=~\r\n```\r',
    '- étape :\n    ```\n    ~={red}dans une liste=~\n    ```',
    '> ```\n> ~={red}dans une citation=~\n> ```',
  ];
  for (const b of blocs) assert.equal(surlignagesColores(b), b, b);
  assert.equal(surlignagesColores('avant\n```\n~={red}x=~\n```\n~={red}après=~'), 'avant\n```\n~={red}x=~\n```\n' + m('red', 'après'));
  assert.equal(surlignagesColores('```\n~={red}bloc jamais fermé=~'), '```\n~={red}bloc jamais fermé=~', 'comme marked : du code jusqu’à la fin');
  assert.equal(surlignagesColores('`~={red}x=~` puis ~={red}y=~'), '`~={red}x=~` puis ' + m('red', 'y'));
  assert.equal(surlignagesColores('``a ` ~={red}x=~`` puis ``b``'), '``a ` ~={red}x=~`` puis ``b``');
  assert.equal(surlignagesColores('~={red}voir `x = 1` ici=~'), m('red', 'voir `x = 1` ici'), 'du code en ligne dans un surlignage');
  assert.equal(surlignagesColores('un \\` seul, ~={red}x=~'), 'un \\` seul, ' + m('red', 'x'), 'un accent grave échappé n’ouvre pas de code');
  // code écrit en HTML (relecture Codex, PR #53) : marked recopie un bloc <pre> tel quel, on n'y touche pas non plus
  const html1 = [
    '<pre>\n~={red}x=~ et ==y==\n</pre>',
    '<PRE class="a">~={red}x=~</PRE>',
    '<pre><code>~={red}x=~</code></pre>',
    '<script>const a = "~={red}x=~";</script>',
    '<code>a `b` ~={red}c=~</code>',
  ];
  for (const b of html1) assert.equal(surlignagesColores(b), b, b);
  assert.equal(surlignagesColores('Texte <code>~={red}x=~</code> puis ~={red}y=~'), 'Texte <code>~={red}x=~</code> puis ' + m('red', 'y'));
  assert.equal(surlignagesColores('`<code>` est une balise ; ~={red}ici=~ ; <code>z</code>'), '`<code>` est une balise ; ' + m('red', 'ici') + ' ; <code>z</code>',
    'une balise citée dans du code en ligne n’ouvre pas d’élément');
  assert.equal(rendre('<pre>\n~={red}x=~ et ==y==\n</pre>'), '<pre>\n~={red}x=~ et ==y==\n</pre>');
  // la règle « ==…== » du générateur passe par le même garde-fou
  assert.equal(horsCode('a ==b== `c ==d==`', t => t.replace(/==([^=\n][^=]*?)==/g, '<mark>$1</mark>')), 'a <mark>b</mark> `c ==d==`');
  assert.equal(horsCode('<pre>==d==</pre> ==e==', t => t.replace(/==([^=\n][^=]*?)==/g, '<mark>$1</mark>')), '<pre>==d==</pre> <mark>e</mark>');
  assert.match(gen, /s = surlignagesColores\(s\);\n {2}s = horsCode\(s, t => t\.replace\(\/==/);
  // rendu complet : le code affiche la syntaxe telle quelle
  const html = rendre('Texte ~={red}rouge=~.\n\n```\n~={red}x=~\n```\n\nEn ligne : `~={green}y=~`.');
  assert.ok(html.includes(m('red', 'rouge')));
  assert.ok(html.includes('<code>~={red}x=~\n</code>'), html);
  assert.ok(html.includes('<code>~={green}y=~</code>'), html);
});

test('barré : « ~~…~~ » reste un vrai texte barré, à côté d’un surlignage', () => {
  for (const t of ['Un ~~barré~~ reste.', 'x ~ y = z', 'a == b', '~~a = b~~']) assert.equal(surlignagesColores(t), t);
  assert.equal(surlignagesColores('Un ~~vrai barré~~ et ~={red}rouge=~'), `Un ~~vrai barré~~ et ${m('red', 'rouge')}`);
  const html = rendre('Un ~~vrai barré~~ et ~={red}rouge=~ ; ~={green}vert =~');
  assert.ok(html.includes('<del>vrai barré</del>'), html);
  assert.ok(html.includes(m('red', 'rouge')) && html.includes(m('green', 'vert')), html);
  assert.ok(!/<del>=|=<\/del>|=\{/.test(html), html);
});

test('titre : sommaire et ancre sans la couleur', () => {
  const html = rendre('### Configuration ICE en ~={purple}dyade =~ minière');
  assert.equal(html.trim(), `<h3>Configuration ICE en ${m('purple', 'dyade')} minière</h3>`);
  // le générateur tire le sommaire et l'ancre du titre sans balises : plus de « purple »
  assert.equal(html.replace(/<[^>]+>/g, '').trim(), 'Configuration ICE en dyade minière');
  // page déjà publiée : texte du sommaire laissé par le barré de marked
  assert.equal(sommaireSansSurlignage('Application illustrative : configuration ICE en ={purple}dyade = minière et exposition'),
    'Application illustrative : configuration ICE en dyade minière et exposition');
});

test('texte brut : les marqueurs sortent des extraits et de l’index de recherche', () => {
  const brut = sansMarqueursSurlignage('contexte ~={purple}FIFO =~ Québec, ~={{red}}burnout =~ et ~={cyan}fin =');
  const mots = motsDePage(brut.replace(/[*_`#>~=|]/g, ' '));
  for (const c of ['purple', 'red', 'cyan']) assert.ok(!mots.has(c), c);
  for (const w of ['fifo', 'quebec', 'burnout', 'fin']) assert.ok(mots.has(w), w);
  assert.match(gen, /function stripMd\(s\) \{\n {2}return sansMarqueursSurlignage\(s\)/);
});

test('page publiée : même résultat depuis le texte barré de marked', () => {
  assert.equal(surlignagesColoresHtml('<strong><del>={purple}aide-foreur =</del></strong> junior'), `<strong>${m('purple', 'aide-foreur')}</strong> junior`);
  assert.equal(surlignagesColoresHtml('<del>={orange}5 RPS <del>={purple}FIFO =</del>-spécifiques =</del>'), m('orange', `5 RPS ${m('purple', 'FIFO')}-spécifiques`));
  assert.equal(surlignagesColoresHtml('<td>~={orange}<del>15-18 % =</del></td>'), `<td>${m('orange', '~15-18 %')}</td>`);
  assert.equal(surlignagesColoresHtml('<li>~={orange}N = 240, 4  =~semaines</li>'), `<li>${m('orange', 'N = 240, 4')} semaines</li>`);
  assert.equal(surlignagesColoresHtml('<li>isolement ~={purple}FIFO =</li>'), `<li>isolement ${m('purple', 'FIFO')}</li>`);
  assert.equal(surlignagesColoresHtml('<p>logique du travailleur = <del>={green}prévention =</del> dangers pour santé</p>'),
    `<p>logique du travailleur = ${m('green', 'prévention')} dangers pour santé</p>`);
  assert.equal(surlignagesColoresHtml('<p>Un <del>barré</del> reste.</p>'), '<p>Un <del>barré</del> reste.</p>');
});

// Contraste WCAG du texte sur chaque teinte, posée sur le fond de l'article, dans les deux thèmes.
function variables(bloc) {
  const v = {};
  for (const [, k, val] of bloc.matchAll(/(--[\w-]+):\s*([^;]+);/g)) v[k] = val.trim();
  return v;
}
const rgb = h => { const x = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16)); };
const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const melange = (c, p, fond) => c.map((v, i) => Math.round(v * p + fond[i] * (1 - p)));

test('teintes lisibles : contraste d’au moins 4,5:1 en thème clair comme en sombre (le défaut)', () => {
  const clair = variables(css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {'))));
  const i = css.indexOf(':root:not([data-theme="light"]):not([data-theme="auto"]) {');
  assert.ok(i > 0, 'bloc sombre par défaut');
  const sombre = { ...clair, ...variables(css.slice(i, css.indexOf('}', i))) };
  const regles = [...css.matchAll(/((?:mark\.surligne-[a-z]+(?:, )?)+) \{ background: color-mix\(in srgb, var\((--teinte-[a-z]+)\) (\d+)%, transparent\); \}/g)];
  const couvertes = new Set(regles.flatMap(r => r[1].split(', ').map(s => s.replace('mark.surligne-', ''))));
  assert.deepEqual([...couvertes].sort(), [...COULEURS_SURLIGNAGE].sort(), 'une teinte par couleur connue');
  for (const [nom, v] of [['clair', clair], ['sombre', sombre]]) {
    const texte = rgb(v['--text']);
    for (const fond of ['--content-bg', '--bg']) {
      for (const [, classes, teinte, pct] of regles) {
        const r = contraste(texte, melange(rgb(v[teinte]), pct / 100, rgb(v[fond])));
        assert.ok(r >= 4.5, `${nom}, ${classes} sur ${fond} : ${r.toFixed(2)}:1`);
      }
      // surlignage par défaut (sans couleur, ou couleur inconnue) : texte hérité sur --surlignage-bg
      const r = contraste(texte, rgb(v['--surlignage-bg']));
      assert.ok(r >= 4.5, `${nom}, surlignage par défaut : ${r.toFixed(2)}:1`);
    }
  }
});

test('site publié : plus aucun reste de surlignage, ni dans la page, ni dans le sommaire, ni dans la recherche', () => {
  const couleurs = new Set();
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'files') walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      // le code montre la syntaxe telle quelle : il n'est pas un reste
      const t = fs.readFileSync(p, 'utf8').replace(/<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>/g, '');
      assert.doesNotMatch(t, /<del>=|~=\{|=<\/del>|=\{\{?[a-zA-Z]+\}\}?/, path.relative(R, p));
      for (const [, c] of t.matchAll(/<mark class="surligne surligne-([a-z]+)">/g)) couleurs.add(c);
    }
  })(path.join(R, 'docs'));
  assert.ok(couleurs.size >= 5);
  for (const c of couleurs) assert.ok(css.includes('mark.surligne-' + c), 'teinte pour ' + c);
  assert.match(css, /mark\.surligne \{ color: inherit;/);
  // l'ancre du titre surligné ne garde pas la couleur
  const palinkas = fs.readFileSync(path.join(R, 'docs/w/psychosocial/analyse-palinkas-et-suedfeld-2021.html'), 'utf8');
  assert.ok(palinkas.includes('<h3 id="application-illustrative-configuration-ice-en-dyade-miniere-et-exposition-cumulative-carriere">'));
  assert.ok(palinkas.includes('href="#application-illustrative-configuration-ice-en-dyade-miniere-et-exposition-cumulative-carriere">Application illustrative : configuration ICE en dyade minière et exposition cumulative carrière</a>'));
  // recherche : ni marqueur dans les extraits, ni mot de couleur venu d'un marqueur
  const idx = JSON.parse(fs.readFileSync(path.join(R, 'docs/assets/search-index.json'), 'utf8'));
  for (const e of idx) for (const k of ['t', 'x', 'g']) assert.doesNotMatch(String(e[k] ?? ''), /\{\{?(?:red|orange|yellow|green|cyan|blue|purple|pink)\}\}?/, e.u);
  const mots = JSON.parse(fs.readFileSync(path.join(R, 'docs/assets/search-mots.json'), 'utf8')).m;
  for (const c of COULEURS_SURLIGNAGE) {
    if (!mots[c]) continue;
    for (const id of decoderListe(mots[c])) {
      const u = idx[id].u;
      const h = fs.readFileSync(path.join(R, 'docs', u), 'utf8');
      const texte = h.slice(Math.max(0, h.indexOf('<div class="page-body'))).replace(/<[^>]+>/g, ' ');
      assert.ok(motsDePage(texte + ' ' + idx[id].t).has(c), `« ${c} » indexé pour ${u}, où il n’apparaît pas`);
    }
  }
});
