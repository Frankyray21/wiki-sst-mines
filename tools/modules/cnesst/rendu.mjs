import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const contenu = JSON.parse(fs.readFileSync(path.join(DIR, 'contenu.json'), 'utf8'));
export const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function valider(data) {
  const seen = new Set();
  const identifier = id => {
    if (!/^[a-z][a-z0-9-]*$/.test(id) || seen.has(id)) throw new Error(`Identifiant invalide ou dupliqué : ${id}`);
    seen.add(id);
  };
  for (const item of [...data.actors, ...data.branches, ...data.exchanges, ...data.cases]) identifier(item.id);
  const actors = new Set(data.actors.map(x => x.id));
  const branches = new Set(data.branches.map(x => x.id));
  const exchanges = new Map(data.exchanges.map(x => [x.id, x]));
  const refs = item => {
    if (!item.sources?.length || item.sources.some(x => !data.sources[x])) throw new Error('Source manquante');
  };
  for (const s of Object.values(data.sources)) {
    const u = new URL(s.url);
    if (u.protocol !== 'https:' || u.hostname !== 'www.cnesst.gouv.qc.ca') throw new Error('Source officielle invalide');
  }
  for (const item of [...data.actors, ...data.branches, ...data.exchanges]) refs(item);
  for (const b of data.branches) if (!/^w\/[a-z0-9/#.-]+$/.test(b.wiki)) throw new Error('Lien wiki invalide');
  for (const e of data.exchanges) {
    if (!branches.has(e.branch) || !actors.has(e.from) || !e.to.length || e.to.some(x => !actors.has(x)) || (e.via && !actors.has(e.via))) throw new Error('Sens de l’échange invalide');
    if (!e.body || !e.note || !e.example) throw new Error('Explication incomplète');
  }
  for (const c of data.cases) for (const l of c.lessons) {
    refs(l);
    if (!branches.has(l.branch) || exchanges.get(l.exchange)?.branch !== l.branch) throw new Error('Cas et échange incohérents');
  }
  return true;
}
valider(contenu);

const icons = {
  shield:'<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  medical:'<path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v5h4M9 14h7m-3.5-3.5v7"/>',
  balance:'<path d="M12 3v18m-5 0h10M4 7h16M5 7l-3 7h6L5 7Zm14 0-3 7h6l-3-7Z"/>',
  mine:'<circle cx="9" cy="5" r="3"/><path d="m7 8-4 13m8-13 4 13M5 15l8 4M6 11l6 4M3 21h19M11 7l8 10m-3 0h6v4"/>',
  institution:'<path d="m2 8 10-5 10 5H2Zm2 12h16M2 22h20M6 10v8m6-8v8m6-8v8"/>',
  worker:'<path d="M4 9h16M6 9V7a6 6 0 0 1 12 0v2M12 1v5M7 10a5 5 0 0 0 10 0M4 22v-4c0-4 16-4 16 0v4M9 16v6m6-6v6"/>',
  arrow:'<path d="M3 12h18m-6-6 6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>'
};
export function icon(name, cls = '') {
  return `<svg class="ci-icon ${esc(cls)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name] || icons.info}</svg>`;
}
function refs(ids) {
  return `<div class="ci-refs">${[...new Set(ids)].map(id => `<a href="${esc(contenu.sources[id].url)}" target="_blank" rel="noopener noreferrer">${esc(contenu.sources[id].title)}<span class="ci-sr"> (nouvel onglet, connexion requise)</span> ↗</a>`).join('')}</div>`;
}
const branch = id => contenu.branches.find(b => b.id === id);
const actor = id => contenu.actors.find(a => a.id === id);
function route(e) {
  const join = e.type === 'dialogue' ? 'échange avec' : 'vers';
  return `${esc(actor(e.from).short)} <span aria-hidden="true">${e.type === 'dialogue' ? '↔' : '→'}</span><span class="ci-sr"> ${join} </span> ${e.to.map(x => esc(actor(x).short)).join(' et ')}${e.via ? ` <span class="ci-via">· avec la ${esc(actor(e.via).short)}</span>` : ''}`;
}
function badge(id) {
  const b = branch(id);
  return `<span class="ci-badge ci-${b.id}">${icon(b.icon)}${esc(b.title)}</span>`;
}
function actorCards(b) {
  return `<div class="ci-actors" aria-label="Acteurs du volet">${contenu.actors.filter(a => a.id !== 'tat').map(a => `<details class="ci-actor" data-ci-actor="${a.id}" id="ci-${b.id}-acteur-${a.id}" open><summary>${icon(a.icon)}<span>${esc(a.name)}</span><span class="ci-sr"> — comprendre son rôle</span>${icon('plus','ci-expand')}</summary><div class="ci-detail"><p>${esc(a.body)}</p><p class="ci-nuance">${esc(a.note)}</p>${refs(a.sources)}</div></details>`).join('')}</div>`;
}
function exchange(e, root) {
  const people = [...new Set([e.from, ...e.to, e.via].filter(Boolean))];
  return `<details class="ci-exchange" id="ci-${e.id}" data-ci-exchange="${e.id}" data-ci-actors="${people.join(' ')}" open>
<summary><span class="ci-route">${route(e)}</span><span class="ci-exchange-title">${esc(e.label)}</span>${icon('plus','ci-expand')}</summary>
<div class="ci-detail"><p>${esc(e.body)}</p><div class="ci-example"><strong>Exemple fictif</strong><p>${esc(e.example)}</p></div><p class="ci-nuance"><strong>À distinguer.</strong> ${esc(e.note)}</p>${refs(e.sources)}<a class="ci-wiki-link" href="${esc(root + branch(e.branch).wiki)}">Approfondir dans le wiki ${icon('arrow')}</a></div></details>`;
}
export function rendreModule({ root = '../../' } = {}) {
  if (!/^(\.\.\/)*$/.test(root) && root !== '') throw new Error('Racine relative invalide');
  return `<!-- cnesst-module:start -->
<section class="ci-root" id="cnesst-interactif" data-cnesst-module data-ci-version="${contenu.metadata.version}" aria-labelledby="ci-title">
<header class="ci-header"><p class="ci-eyebrow">Wiki SST · Module de compréhension</p><h2 id="ci-title" class="ci-title">${esc(contenu.metadata.title)}</h2><p>Identifier le bon volet, comprendre qui agit et faire le lien avec le terrain.</p></header>
<nav class="ci-tabs" aria-label="Façons de consulter le module"><a id="ci-tab-comprendre" href="#ci-comprendre" data-ci-view="comprendre">${icon('info')}Comprendre</a><a id="ci-tab-echanges" href="#ci-echanges" data-ci-view="echanges">${icon('arrow')}Les échanges</a><a id="ci-tab-cas" href="#ci-cas" data-ci-view="cas">${icon('worker')}Cas terrain</a></nav>
<div class="ci-toolbar" hidden><button type="button" data-ci-reading aria-pressed="false">Tout lire</button><button type="button" data-ci-print>Imprimer le module</button></div>
<p class="ci-connection">Une même situation peut concerner plusieurs volets.</p>
<section class="ci-panel" id="ci-comprendre" data-ci-panel="comprendre" aria-labelledby="ci-heading-comprendre"><h3 id="ci-heading-comprendre">Trois questions pour les distinguer</h3>
<div class="ci-overview">${contenu.branches.map(b => `<article class="ci-overview-row ci-${b.id}"><div class="ci-branch-name">${icon(b.icon)}<div><h4>${esc(b.title)}</h4><a class="ci-law" href="#ci-lois">${esc(b.law)}<span class="ci-sr"> — développer le nom de la loi</span></a></div></div><div><p class="ci-question">${esc(b.question)}</p><p>${esc(b.summary)}</p><p class="ci-muted"><strong>Exemple :</strong> ${esc(b.example)}</p><a class="ci-action" href="#ci-volet-${b.id}" data-ci-explore="${b.id}">Explorer les échanges ${icon('arrow')}</a></div></article>`).join('')}</div>
<p class="ci-hint">Les couleurs distinguent les volets, pas des niveaux de danger.</p></section>
<section class="ci-panel" id="ci-echanges" data-ci-panel="echanges" aria-labelledby="ci-heading-echanges"><h3 id="ci-heading-echanges">Qui agit, auprès de qui?</h3><div class="ci-branch-tabs" aria-label="Choisir un volet">${contenu.branches.map(b => `<a class="ci-${b.id}" href="#ci-volet-${b.id}" data-ci-branch="${b.id}">${icon(b.icon)}${esc(b.title)}</a>`).join('')}</div>
${contenu.branches.map(b => `<section class="ci-branch ci-${b.id}" id="ci-volet-${b.id}" data-ci-branch-panel="${b.id}" aria-labelledby="ci-branch-title-${b.id}"><h4 id="ci-branch-title-${b.id}">${esc(b.title)} · ${esc(b.law)}</h4><p class="ci-branch-note">${esc(b.note)}</p><p class="ci-hint">Ouvrir un acteur ou un échange pour lire son explication. Les flèches indiquent le sens, pas un ordre obligatoire.</p>${actorCards(b)}<div class="ci-exchanges">${contenu.exchanges.filter(e => e.branch === b.id).map(e => exchange(e, root)).join('')}</div></section>`).join('')}</section>
<section class="ci-panel" id="ci-cas" data-ci-panel="cas" aria-labelledby="ci-heading-cas"><h3 id="ci-heading-cas">Faire le lien avec le terrain</h3><p class="ci-muted">Trois situations fictives. Aucun diagnostic ni résultat d’admissibilité n’est donné.</p><div class="ci-cases">${contenu.cases.map((c,i) => `<details class="ci-case" id="ci-cas-${c.id}" open><summary><span class="ci-case-index" aria-hidden="true">0${i+1}</span><span><strong>${esc(c.title)}</strong><span class="ci-case-subtitle">${esc(c.subtitle)}</span></span>${icon('plus','ci-expand')}</summary><div class="ci-detail"><p class="ci-situation">${esc(c.situation)}</p><div class="ci-lessons">${c.lessons.map(l => `<article class="ci-lesson ci-${l.branch}">${badge(l.branch)}<h4>${esc(l.title)}</h4><p>${esc(l.body)}</p>${refs(l.sources)}<a class="ci-action" href="#ci-${l.exchange}" data-ci-explore="${l.branch}" data-ci-target="${l.exchange}">Voir l’échange expliqué ${icon('arrow')}</a></article>`).join('')}</div><p class="ci-takeaway"><strong>À retenir.</strong> ${esc(c.takeaway)}</p></div></details>`).join('')}</div></section>
<details class="ci-glossary" id="ci-lois"><summary>Lois et repères ${icon('plus','ci-expand')}</summary><div class="ci-detail"><dl>${contenu.branches.map(b => `<dt>${esc(b.law)}</dt><dd>${esc(b.lawName)}</dd>`).join('')}<dt>CNESST et Tribunal</dt><dd>${esc(actor('tat').body)} ${esc(actor('tat').note)}</dd></dl>${refs(['travailleurs','harcelement'])}</div></details>
<details class="ci-sources" id="ci-sources"><summary>Sources et portée du module ${icon('plus','ci-expand')}</summary><div class="ci-detail"><p>${esc(contenu.metadata.scope)}</p><p>Consulter rapidement la source correspondant à votre situation : des délais et des conditions peuvent s’appliquer. Les liens officiels nécessitent une connexion.</p>${refs(Object.keys(contenu.sources))}<p>Sources consultées le <time datetime="${contenu.metadata.verified}">26 septembre 2026</time>. Exemples pédagogiques fictifs.</p></div></details>
<footer class="ci-footer"><span>Module ${contenu.metadata.version}</span><span>Sans formulaire ni collecte de données dans ce module</span></footer><p class="ci-sr" role="status" aria-live="polite" data-ci-status></p>
</section>
<!-- cnesst-module:end -->`;
}

export function rendrePage({ inline = false } = {}) {
  const css = fs.readFileSync(path.join(DIR,'styles.css'),'utf8');
  const js = fs.readFileSync(path.join(DIR,'interactions.js'),'utf8');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>CNESST — module interactif | Wiki SST</title><script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='auto')document.documentElement.setAttribute('data-theme',t);var e=localStorage.getItem('echelle');if(e&&Number(e)>0&&Number(e)<=3)document.documentElement.style.setProperty('--echelle',e)}catch(e){}</script>${inline ? `<style>${css}</style>` : '<link rel="stylesheet" href="styles.css">'}</head><body class="ci-standalone"><header class="ci-demo-header"><a href="../../w/psychosocial/cnesst-roles-et-pouvoirs.html">← Retour à l’article du wiki</a><button type="button" data-ci-theme hidden>Changer de thème</button></header><main><h1 class="ci-sr">CNESST — module interactif</h1>${rendreModule()}</main>${inline ? `<script>${js}</script>` : '<script src="interactions.js" defer></script>'}</body></html>`;
}

export function publierCnesst(out) {
  // Post-traitement stable : aucun accès au vault nécessaire; aucun article réécrit.
  const dest = path.join(out, 'modules', 'cnesst');
  fs.mkdirSync(dest, { recursive:true });
  for (const f of ['styles.css','interactions.js']) fs.copyFileSync(path.join(DIR,f),path.join(dest,f));
  fs.writeFileSync(path.join(dest,'index.html'),rendrePage());
  const targets = ['w/psychosocial/cnesst-roles-et-pouvoirs.html','g/psychosocial/cnesst-roles-et-pouvoirs.html'];
  let changed = 0;
  for (const file of targets) {
    const p = path.join(out,file);
    if (!fs.existsSync(p)) continue;
    const old = fs.readFileSync(p,'utf8');
    const root = '../'.repeat(file.split('/').length - 1);
    const result = integrer(old,root);
    if (result !== old) { fs.writeFileSync(p,result); changed++; }
  }
  return { changed, destination:dest };
}

export function integrer(html, root = '../../') {
  const module = rendreModule({root});
  const block = /<!-- cnesst-module:start -->[\s\S]*?<!-- cnesst-module:end -->/g;
  let updated;
  if (html.includes('<!-- cnesst-module:start -->')) {
    if ([...html.matchAll(block)].length !== 1) throw new Error('Marqueurs CNESST incohérents : aucune modification');
    updated = html.replace(block, () => module);
  } else {
    const anchor = '<h2 id="presentation">';
    if (html.split(anchor).length !== 2) throw new Error('Ancre Présentation absente ou ambiguë : aucune modification');
    // Insérer avant Présentation; conserver l’infographie et toutes les ancres existantes.
    updated = html.replace(anchor, module + '\n' + anchor);
  }
  const css = `<link data-ci-asset="style" rel="stylesheet" href="${root}modules/cnesst/styles.css">`;
  const js = `<script data-ci-asset="script" src="${root}modules/cnesst/interactions.js" defer></script>`;
  updated = updated.replace(/<link data-ci-asset="style"[^>]*>\n?/g,'').replace(/<script data-ci-asset="script"[^>]*><\/script>\n?/g,'');
  if (!updated.includes('</head>') || !updated.includes('</body>')) throw new Error('Document HTML incomplet');
  updated = updated.replace('</head>',css+'\n</head>').replace('</body>',js+'\n</body>');
  // Les sauts de ligne ajoutés ne doivent pas s’accumuler à chaque publication.
  return updated.replace(/\n{3,}/g,'\n\n');
}
