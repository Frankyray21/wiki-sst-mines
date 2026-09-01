// Portail de l'encadrement — reproduction de la maquette fournie par Frank.
// Toutes les cibles sont des pages réellement présentes dans le wiki : le générateur
// avertit (sans échouer) si l'une d'elles disparaît après un renommage dans Obsidian.

// --- icônes SVG en ligne (aucune dépendance externe) ---
const I = {
  logo: '<svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 0 0-5 5c0 1.6.8 3.1 2 4H9a4 4 0 0 0-4 4v7h14v-7a4 4 0 0 0-4-4h-.1c1.3-.9 2.1-2.4 2.1-4a5 5 0 0 0-5-5z"/></svg>',
  accueil: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  fusee: '<svg viewBox="0 0 24 24"><path d="M5 15c-1 2-1 5-1 5s3 0 5-1M9 14l-3-3 3-6 7-3 3 3-3 7-6 3zM9 14l1 1"/><circle cx="14.5" cy="9.5" r="1.5"/></svg>',
  balance: '<svg viewBox="0 0 24 24"><path d="M12 3v18M7 21h10M12 6 4 8l3 6a3 3 0 0 0 6 0zM12 6l8 2-3 6a3 3 0 0 1-6 0z"/></svg>',
  bouclier: '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  alerte: '<svg viewBox="0 0 24 24"><path d="M12 4 2 20h20zM12 10v5M12 17.5v.5"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4M9 12h6M9 16h6"/></svg>',
  livre: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z"/></svg>',
  etoile: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  casque: '<svg viewBox="0 0 24 24"><path d="M3 17h18M4 17v-2a8 8 0 0 1 16 0v2M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>',
  mallette: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/></svg>',
  gens: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0-2-5.2M17.5 20a5.5 5.5 0 0 0-2-4.3"/></svg>',
  loupe: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  fleche: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  retour: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  horloge: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>',
  soleil: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  cerveau: '<svg viewBox="0 0 24 24"><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>',
  cercle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8a4 4 0 0 0 0 8M12 8a4 4 0 0 1 0 8"/></svg>',
  personne: '<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.5"/><path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>',
  cle: '<svg viewBox="0 0 24 24"><path d="M14 7a4 4 0 1 1-3.5 5.9L4 19.4V21h-1v-2l7-7A4 4 0 0 1 14 7z"/><circle cx="15.5" cy="8.5" r="1"/></svg>',
  nouveau: '<svg viewBox="0 0 24 24"><path d="m12 3 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4L7.5 16.8l.9-5L4.8 8.3l5-.7z"/></svg>',
  maj: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M21 4v4h-4M3 20v-4h4"/></svg>',
  courriel: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  coche: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-5"/></svg>',
  calendrier: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  coeur: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.8-6 2 0 3.4 1.2 4.2 2.6C11.8 6.2 13.2 5 15.2 5c3.2 0 5 3.3 3.8 6-2 4.4-7 9-7 9z"/></svg>',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// --- contenu de la maquette : chaque cible est un chemin de page du site ---
export const NAV = [
  { libelle: 'Accueil', icone: 'accueil', cible: null, actif: true },
  { libelle: 'Démarrage', icone: 'fusee', cible: 'w/droit-travail/05-demarrage-rapide/demarrage-rapide-superviseur.html' },
  { libelle: 'Obligations légales', icone: 'balance', cible: 'w/droit-travail/27-articles-gestionnaires/conformite-et-inspection/mecanismes-lmrsst.html' },
  { libelle: 'Programmes de prévention', icone: 'bouclier', cible: 'w/ergonomie/27-articles-gestionnaires/programme-de-prevention-tms.html' },
  { libelle: 'Situations terrain', icone: 'alerte', cible: 'w/securite/27-articles-gestionnaires/gestion-des-risques-operationnels/enquete-daccidents.html' },
  { libelle: 'Outils et modèles', icone: 'doc', cible: 'w/psychosocial/20-articles/evaluation-et-outils/tableau-de-bord-sst-psychosociale-pour-direction.html' },
  { libelle: 'Lois et règlements', icone: 'livre', cible: 'w/legislation/index-par-loi.html' },
  { libelle: 'Favoris', icone: 'etoile', cible: null, id: 'navFavoris' },
];

export const ROLES = [
  { titre: 'Superviseur', icone: 'casque', couleur: '#2563eb',
    desc: 'Vos responsabilités essentielles et vos actions prioritaires au quotidien.',
    cible: 'w/droit-travail/05-demarrage-rapide/demarrage-rapide-superviseur.html' },
  { titre: 'Gestionnaire', icone: 'mallette', couleur: '#059669',
    desc: 'Vos obligations légales et vos devoirs en matière de santé et sécurité.',
    cible: 'w/droit-travail/27-articles-gestionnaires/27-articles-gestionnaires.html' },
  { titre: 'Direction / RH', icone: 'gens', couleur: '#2563eb',
    desc: 'Gouvernance, conformité et gestion des risques à l’échelle de l’organisation.',
    cible: 'w/ergonomie/05-demarrage-rapide/demarrage-rapide-direction-rh.html' },
  { titre: 'Conseiller SST', icone: 'bouclier', couleur: '#0891b2',
    desc: 'Outils, référentiels et ressources pour mettre en place une démarche SST efficace.',
    cible: 'w/ergonomie/05-demarrage-rapide/demarrage-rapide-conseiller-sst.html' },
];

export const SITUATIONS = [
  { titre: 'Accident ou incident', icone: 'alerte', couleur: '#dc2626',
    desc: 'Intervenir rapidement et respecter la loi.',
    cible: 'w/securite/27-articles-gestionnaires/gestion-des-risques-operationnels/enquete-daccidents.html' },
  { titre: 'Visite d’un inspecteur CNESST', icone: 'casque', couleur: '#2563eb',
    desc: 'Se préparer et savoir quoi présenter.',
    cible: 'w/droit-travail/27-articles-gestionnaires/conformite-et-inspection/visite-dinspecteur.html' },
  { titre: 'Constat d’infraction', icone: 'doc', couleur: '#ea580c',
    desc: 'Comprendre le constat et les étapes à suivre.',
    cible: 'w/droit-travail/20-articles-internes/constat-dinfraction.html' },
  { titre: 'Travailleur blessé / Assignation temporaire', icone: 'personne', couleur: '#059669',
    desc: 'Assurer un retour sécuritaire et conforme.',
    cible: 'w/droit-travail/27-articles-gestionnaires/retour-au-travail-et-assignation.html' },
  { titre: 'Contrainte thermique', icone: 'soleil', couleur: '#ea580c',
    desc: 'Prévenir les effets de la chaleur en milieu de travail.',
    cible: 'w/hygiene/27-articles-gestionnaires/contrainte-thermique.html' },
  { titre: 'Risques psychosociaux', icone: 'cerveau', couleur: '#7c3aed',
    desc: 'Identifier, prévenir et intervenir efficacement.',
    cible: 'w/psychosocial/20-articles/legislation-et-normes/obligation-didentifier-les-risques-psychosociaux.html' },
  { titre: 'Espace clos', icone: 'cercle', couleur: '#0891b2',
    desc: 'Exigences et mesures de sécurité à respecter.',
    cible: 'w/securite/27-articles-gestionnaires/espaces-clos.html' },
  { titre: 'Amiante', icone: 'alerte', couleur: '#ca8a04',
    desc: 'Travaux avec amiante : obligations et précautions.',
    cible: 'w/hygiene/27-articles-gestionnaires/programmes-de-prevention/amiante.html' },
];

export const EXPLORER = [
  { titre: 'Obligations légales', icone: 'balance', couleur: '#2563eb',
    desc: 'Responsabilités, mécanismes de prévention, sanctions, obligations spécifiques.',
    lien: 'Voir les obligations',
    cible: 'w/droit-travail/27-articles-gestionnaires/conformite-et-inspection/mecanismes-lmrsst.html' },
  { titre: 'Programmes de prévention', icone: 'bouclier', couleur: '#059669',
    desc: 'Programmes obligatoires, mesures de prévention et démarches de contrôle.',
    lien: 'Voir les programmes',
    cible: 'w/ergonomie/27-articles-gestionnaires/27-articles-gestionnaires.html' },
  { titre: 'Outils et modèles', icone: 'doc', couleur: '#7c3aed',
    desc: 'Formulaires, guides pratiques, listes de vérification et modèles téléchargeables.',
    lien: 'Voir les outils',
    cible: 'w/psychosocial/20-articles/evaluation-et-outils/tableau-de-bord-sst-psychosociale-pour-direction.html' },
  { titre: 'Lois et règlements', icone: 'livre', couleur: '#2563eb',
    desc: 'Accéder aux lois, règlements, normes et autres références légales.',
    lien: 'Voir les règlements',
    cible: 'w/legislation/index-par-loi.html' },
];

export const DOMAINES = [
  { nom: 'Santé et sécurité', couleur: '#3b82f6', cible: 'w/securite/index.html' },
  { nom: 'Ergonomie', couleur: '#8b5cf6', cible: 'w/ergonomie/index.html' },
  { nom: 'Hygiène industrielle', couleur: '#10b981', cible: 'w/hygiene/index.html' },
  { nom: 'Sécurité industrielle', couleur: '#f59e0b', cible: 'w/securite/index.html' },
  { nom: 'RPS et organisation', couleur: '#ef4444', cible: 'w/psychosocial/index.html' },
  { nom: 'Environnement', couleur: '#22c55e', cible: 'w/toxicologie/index.html' },
];

export const POPULAIRES = ['accident', 'inspecteur CNESST', 'chaleur', 'cadenassage', 'espace clos', 'amiante', 'RPS'];

// ---------- portail des travailleurs, même habillage tableau de bord ----------
// Le contenu vient du build (rubriques remplies avec les pages réellement publiées) ;
// seul l'habillage est défini ici. Ton reste au « tu », bandeau d'urgence en tête.
export function rendrePortailTravailleurs({ R, nbLois, majDate, verifier, rubriques, accueils, autres }) {
  const morts = [];
  const url = (cible) => {
    if (!cible) return '#';
    if (verifier && !verifier(cible)) { morts.push(cible); return '#'; }
    return R + cible;
  };
  const ico = (nom, style = '') => (I[nom] || I.doc).replace('<svg', `<svg${style ? ` style="${style}"` : ''}`);

  const aideUrl = 't/w/psychosocial/25-articles-travailleurs/20-ressources-et-aide/ou-appeler-quand-ca-ne-va-pas.html';

  const navHaut = [
    `<a href="#" class="actif">${ico('accueil')}<span>Accueil</span></a>`,
    `<a href="${url('w/legislation/index-par-loi.html')}">${ico('balance')}<span>Ce que dit la loi</span></a>`,
    `<a href="${url(aideUrl)}">${ico('coeur')}<span>Où trouver de l'aide</span></a>`,
    `<a href="${url('w/psychosocial/30-glossaire/glossaire.html')}">${ico('livre')}<span>Glossaire</span></a>`,
    `<a href="#tbFavoris">${ico('etoile')}<span>Favoris</span></a>`,
  ].join('');

  const navSujets = rubriques.map((r, i) =>
    `<a href="#rub-${i}"><span class="tb-nav-emoji">${r.icone}</span><span>${esc(r.titre)}</span></a>`).join('');

  const domaines = DOMAINES.map(d =>
    `<a href="${url(d.cible)}"><span class="tb-pastille" style="background:${d.couleur}"></span><span>${esc(d.nom)}</span></a>`).join('');

  const populaires = ['droit de refus', 'chaleur', 'bruit', 'sommeil', 'cadenassage', 'espace clos', 'CNESST']
    .map(p => `<button class="tb-puce" data-q="${esc(p)}">${esc(p)}</button>`).join('');

  const cartePage = (p) => `<a class="tb-carte tb-situ" href="${url(p.u)}">
      <span class="tb-situ-ic tb-situ-emoji">${p.icone || '📄'}</span>
      <span class="tb-situ-txt"><h3>${esc(p.t)}</h3>${p.dom ? `<p>${esc(p.dom)}</p>` : ''}</span>
      ${I.fleche.replace('<svg', '<svg class="tb-fleche"')}
    </a>`;

  const sections = rubriques.map((r, i) => r.membres.length ? `<section class="tb-rub" id="rub-${i}">
    <h2 class="tb-section"><span class="tb-rub-emoji">${r.icone}</span> ${esc(r.titre)}</h2>
    <div class="tb-grille tb-g4">${r.membres.map(m => cartePage({ ...m, icone: r.icone })).join('')}</div>
  </section>` : '').join('');

  const barre = [
    { t: 'Tous les articles', s: 'Parcourir par sujet', i: 'doc', c: 'categories.html' },
    { t: 'Glossaire', s: 'Termes et définitions', i: 'livre', c: 'w/psychosocial/30-glossaire/glossaire.html' },
    { t: 'Graphe des liens', s: 'Le wiki en réseau', i: 'cercle', c: 'graphe.html' },
    { t: 'Ressources d’aide', s: 'Lignes d’aide et PAE', i: 'coeur', c: 'w/psychosocial/50-ressources-daide/index.html' },
  ].map(b => `<a href="${url(b.c)}"><span class="tb-barre-ic">${ico(b.i)}</span><span><strong>${esc(b.t)}</strong><span>${esc(b.s)}</span></span></a>`).join('');

  const html = `<div class="tb-layout">
<aside class="tb-side" id="tbSide">
  <div class="tb-logo">
    <span class="tb-logo-carre" style="background:#ea580c">${I.casque.replace('<svg', '<svg style="fill:none;stroke:#fff;stroke-width:1.7"')}</span>
    <span class="tb-logo-txt"><strong>Wiki SST</strong><span>Espace travailleurs</span></span>
  </div>
  <nav class="tb-nav">${navHaut}</nav>
  <div class="tb-sep"></div>
  <div class="tb-titre-groupe">Par sujet</div>
  <nav class="tb-nav">${navSujets}</nav>
  <div class="tb-sep"></div>
  <div class="tb-titre-groupe">Par domaine</div>
  <nav class="tb-nav">${domaines}</nav>
  <a class="tb-btn-tags" href="${url('categories.html')}">Afficher tous les tags</a>
</aside>

<div class="tb-main">
  <header class="tb-head">
    <button class="tb-icone-btn tb-burger" id="tbBurger" aria-label="Menu">${I.menu}</button>
    <a class="tb-retour" href="${R}index.html">${I.retour}<span>Accueil</span></a>
    <div class="tb-head-recherche">
      <span class="tb-loupe">${I.loupe}</span>
      <input type="search" id="q" placeholder="Rechercher dans le wiki…" autocomplete="off">
      <div id="suggest" class="tb-sugg" hidden></div>
    </div>
    <button class="tb-icone-btn" id="btnTheme" aria-label="Changer de thème" title="Changer de thème"></button>
    <button class="tb-icone-btn" id="tbFav" aria-label="Mes favoris" title="Mes favoris">${I.etoile}</button>
    <button class="tb-icone-btn" id="tbHist" aria-label="Historique" title="Historique">${I.horloge}</button>
    <div class="tb-profil">
      <span class="tb-avatar tb-avatar-emoji">👷</span>
      <span class="tb-profil-txt"><strong>Espace travailleurs</strong><span>Wiki SST — Mines</span></span>
    </div>
  </header>

  <div class="tb-corps">
    <main class="tb-centre"><div class="tb-conteneur">
      <h1 class="tb-bonjour">Salut&nbsp;! 👋</h1>
      <p class="tb-sous-titre">Tes droits, ta santé, ta sécurité — expliqué simplement, pour toi qui travailles à la mine.</p>

      <div class="tb-urgence">
        <strong>☎ Ça ne va pas&nbsp;?</strong>
        <span>Urgence <a href="tel:911">911</a> · Info-Santé <a href="tel:811">811</a> (option 2 pour Info-Social) · Prévention du suicide <a href="tel:988">988</a></span>
        <a class="tb-urgence-lien" href="${url(aideUrl)}">Où appeler quand ça ne va pas →</a>
      </div>

      <div class="tb-recherche">
        ${I.loupe}
        <input type="search" id="q2" placeholder="Cherche un mot, un risque, un droit…" autocomplete="off">
        <button id="tbGo">Rechercher</button>
        <div id="suggest2" class="tb-sugg" hidden></div>
      </div>
      <div class="tb-populaires"><span>Recherches populaires :</span>${populaires}</div>

      ${accueils.length ? `<h2 class="tb-section">Pour commencer</h2>
      <div class="tb-grille tb-g4">${accueils.map(a => cartePage({ ...a, icone: '🚩' })).join('')}</div>` : ''}

      ${sections}

      ${autres.length ? `<section class="tb-rub"><h2 class="tb-section"><span class="tb-rub-emoji">📄</span> Autres pages</h2>
      <div class="tb-grille tb-g4">${autres.map(a => cartePage({ ...a, icone: '📄' })).join('')}</div></section>` : ''}

      <div class="tb-barre">${barre}</div>
    </div></main>

    <aside class="tb-droite">
      <section class="tb-bloc tb-legal">
        <span class="tb-legal-ic">${I.balance}</span>
        <div>
          <h2>Ce que dit la loi</h2>
          <p>Les articles qui fondent tes droits : refus de travail, retrait préventif, réclamation, retour au travail.</p>
          <a class="tb-btn-plein" href="${url('w/legislation/index-par-loi.html')}">Explorer les lois et règlements</a>
          <a class="tb-legal-compte" href="${url('w/legislation/index-par-loi.html')}">${nbLois.toLocaleString('fr-CA')} articles de loi</a>
        </div>
      </section>

      <section class="tb-bloc">
        <div class="tb-bloc-tete">${I.horloge}<h2>Récemment consulté</h2></div>
        <ul class="tb-liste" id="tbRecents"><li class="tb-vide">Les pages que tu ouvres apparaîtront ici.</li></ul>
        <a class="tb-voir" href="#" id="tbVoirHist" hidden>Voir tout l'historique →</a>
      </section>

      <section class="tb-bloc">
        <div class="tb-bloc-tete">${I.etoile.replace('<svg', '<svg style="stroke:#f5a623"')}<h2>Favoris</h2><a class="tb-voir" href="#" id="tbVoirFav" hidden>Voir tous</a></div>
        <ul class="tb-liste tb-liste-fav" id="tbFavoris"><li class="tb-vide">Garde une page sous la main avec l'étoile de son en-tête.</li></ul>
      </section>

      <section class="tb-bloc">
        <div class="tb-bloc-tete">${I.info}<h2>À propos du contenu</h2></div>
        <ul class="tb-apropos">
          <li>${I.coche}<span>Écrit à partir de notes de cours SST, en mots simples</span></li>
          <li>${I.balance}<span>Appuyé sur les lois et règlements du Québec en vigueur</span></li>
          <li>${I.calendrier}<span>Date de mise à jour : <span id="tbMaj">${esc(majDate)}</span></span></li>
        </ul>
      </section>
    </aside>
  </div>

  <footer class="tb-pied">
    <a href="${url('w/psychosocial/50-ressources-daide/index.html')}">Ressources d'aide</a>
    <a href="${R}index.html">Accueil du wiki</a>
    <span class="tb-droite-pied"><span>© ${new Date().getFullYear()} Machines Roger inc.</span><span id="tbVersion">Version 1.0.0</span></span>
  </footer>
</div>
</div>`;

  return { html, morts: [...new Set(morts)] };
}

// Rend le portail. `R` est le chemin racine relatif, `nbLois` le nombre d'articles de loi,
// `verifier` une fonction qui dit si une cible existe (pour n'afficher que des liens valides).
export function rendrePortailEncadrement({ R, nbLois, majDate, verifier }) {
  const morts = [];
  const url = (cible) => {
    if (!cible) return '#';
    if (verifier && !verifier(cible)) { morts.push(cible); return '#'; }
    return R + cible;
  };
  const ico = (nom, style = '') => (I[nom] || I.doc).replace('<svg', `<svg${style ? ` style="${style}"` : ''}`);

  const nav = NAV.map(n => `<a href="${url(n.cible)}"${n.actif ? ' class="actif"' : ''}${n.id ? ` id="${n.id}"` : ''}>${ico(n.icone)}<span>${esc(n.libelle)}</span></a>`).join('');

  const roles = ROLES.map(r => `<a class="tb-carte" href="${url(r.cible)}">
      <span class="tb-carte-icone">${ico(r.icone, `stroke:${r.couleur}`)}</span>
      <h3>${esc(r.titre)}</h3>
      <p>${esc(r.desc)}</p>
      <span class="tb-carte-lien">Commencer ${I.fleche.replace('<svg', '<svg style="width:13px;height:13px;stroke:currentColor;vertical-align:-1px"')}</span>
    </a>`).join('');

  const situations = SITUATIONS.map(s => `<a class="tb-carte tb-situ" href="${url(s.cible)}">
      <span class="tb-situ-ic">${ico(s.icone, `stroke:${s.couleur}`)}</span>
      <span class="tb-situ-txt"><h3>${esc(s.titre)}</h3><p>${esc(s.desc)}</p></span>
      ${I.fleche.replace('<svg', '<svg class="tb-fleche"')}
    </a>`).join('');

  const explorer = EXPLORER.map(e => `<a class="tb-carte" href="${url(e.cible)}">
      <span class="tb-carte-icone">${ico(e.icone, `stroke:${e.couleur}`)}</span>
      <h3>${esc(e.titre)}</h3>
      <p>${esc(e.desc)}</p>
      <span class="tb-carte-lien">${esc(e.lien)} ${I.fleche.replace('<svg', '<svg style="width:13px;height:13px;stroke:currentColor;vertical-align:-1px"')}</span>
    </a>`).join('');

  const domaines = DOMAINES.map(d => `<a href="${url(d.cible)}"><span class="tb-pastille" style="background:${d.couleur}"></span><span>${esc(d.nom)}</span></a>`).join('');
  const populaires = POPULAIRES.map(p => `<button class="tb-puce" data-q="${esc(p)}">${esc(p)}</button>`).join('');

  const barre = [
    { t: 'Tous les articles', s: 'Parcourir tout le contenu', i: 'doc', c: 'categories.html' },
    { t: 'Nouveautés', s: 'Contenu récemment ajouté', i: 'nouveau', c: 'w/psychosocial/index-alphabetique.html' },
    { t: 'Mises à jour', s: 'Articles mis à jour récemment', i: 'maj', c: 'w/legislation/index-par-loi.html' },
    { t: 'Glossaire', s: 'Termes et définitions', i: 'livre', c: 'w/psychosocial/30-glossaire/glossaire.html' },
    { t: 'Nous joindre', s: 'Équipe et contacts', i: 'courriel', c: 'w/psychosocial/50-ressources-daide/index.html' },
  ].map(b => `<a href="${url(b.c)}"><span class="tb-barre-ic">${ico(b.i)}</span><span><strong>${esc(b.t)}</strong><span>${esc(b.s)}</span></span></a>`).join('');

  const html = `<div class="tb-layout">
<aside class="tb-side" id="tbSide">
  <div class="tb-logo">
    <span class="tb-logo-carre">${I.logo}</span>
    <span class="tb-logo-txt"><strong>Wiki SST</strong><span>Gestion &amp; prévention</span></span>
  </div>
  <nav class="tb-nav">${nav}</nav>
  <div class="tb-sep"></div>
  <div class="tb-titre-groupe">Par rôle</div>
  <nav class="tb-nav">${ROLES.map(r => `<a href="${url(r.cible)}">${ico(r.icone)}<span>${esc(r.titre)}</span></a>`).join('')}</nav>
  <div class="tb-sep"></div>
  <div class="tb-titre-groupe">Par domaine</div>
  <nav class="tb-nav">${domaines}</nav>
  <a class="tb-btn-tags" href="${url('categories.html')}">Afficher tous les tags</a>
</aside>

<div class="tb-main">
  <header class="tb-head">
    <button class="tb-icone-btn tb-burger" id="tbBurger" aria-label="Menu">${I.menu}</button>
    <a class="tb-retour" href="${R}index.html">${I.retour}<span>Accueil</span></a>
    <div class="tb-head-recherche">
      <span class="tb-loupe">${I.loupe}</span>
      <input type="search" id="q" placeholder="Rechercher dans le wiki…" autocomplete="off">
      <div id="suggest" class="tb-sugg" hidden></div>
    </div>
    <button class="tb-icone-btn" id="btnTheme" aria-label="Changer de thème" title="Changer de thème"></button>
    <button class="tb-icone-btn" id="tbFav" aria-label="Mes favoris" title="Mes favoris">${I.etoile}</button>
    <button class="tb-icone-btn" id="tbHist" aria-label="Historique" title="Historique">${I.horloge}</button>
    <div class="tb-profil">
      <span class="tb-avatar">FR</span>
      <span class="tb-profil-txt"><strong>François Raymond</strong><span>Conseiller SST</span></span>
    </div>
  </header>

  <div class="tb-corps">
    <main class="tb-centre"><div class="tb-conteneur">
      <h1 class="tb-bonjour">Bonjour François 👋</h1>
      <p class="tb-sous-titre">Tout ce qu’un gestionnaire, superviseur ou dirigeant doit savoir pour prévenir, intervenir et respecter ses obligations SST.</p>

      <div class="tb-recherche">
        ${I.loupe}
        <input type="search" id="q2" placeholder="Rechercher une obligation, une procédure, un article de loi ou une situation…" autocomplete="off">
        <button id="tbGo">Rechercher</button>
        <div id="suggest2" class="tb-sugg" hidden></div>
      </div>
      <div class="tb-populaires"><span>Recherches populaires :</span>${populaires}</div>

      <h2 class="tb-section">Démarrer selon mon rôle</h2>
      <div class="tb-grille tb-g4">${roles}</div>

      <h2 class="tb-section">J’ai une situation à gérer</h2>
      <div class="tb-grille tb-g4">${situations}</div>

      <h2 class="tb-section">Explorer le wiki</h2>
      <div class="tb-grille tb-g4">${explorer}</div>

      <div class="tb-barre">${barre}</div>
    </div></main>

    <aside class="tb-droite">
      <section class="tb-bloc tb-legal">
        <span class="tb-legal-ic">${I.balance}</span>
        <div>
          <h2>Le cadre légal</h2>
          <p>Lois et règlements applicables, obligations de l’employeur, mécanismes de prévention et sanctions.</p>
          <a class="tb-btn-plein" href="${url('w/legislation/index-par-loi.html')}">Explorer les lois et règlements</a>
          <a class="tb-legal-compte" href="${url('w/legislation/index-par-loi.html')}">${nbLois.toLocaleString('fr-CA')} articles de loi</a>
        </div>
      </section>

      <section class="tb-bloc">
        <div class="tb-bloc-tete">${I.horloge}<h2>Récemment consulté</h2></div>
        <ul class="tb-liste" id="tbRecents"><li class="tb-vide">Les pages que vous ouvrirez apparaîtront ici.</li></ul>
        <a class="tb-voir" href="#" id="tbVoirHist" hidden>Voir tout l’historique →</a>
      </section>

      <section class="tb-bloc">
        <div class="tb-bloc-tete">${I.etoile.replace('<svg', '<svg style="stroke:#f5a623"')}<h2>Favoris</h2><a class="tb-voir" href="#" id="tbVoirFav" hidden>Voir tous</a></div>
        <ul class="tb-liste tb-liste-fav" id="tbFavoris"><li class="tb-vide">Ajoutez une page en favori depuis l’étoile de son en-tête.</li></ul>
      </section>

      <section class="tb-bloc">
        <div class="tb-bloc-tete">${I.info}<h2>À propos du contenu</h2></div>
        <ul class="tb-apropos">
          <li>${I.coche}<span>Contenu révisé régulièrement par notre équipe SST</span></li>
          <li>${I.balance}<span>Sources légales officielles et normes en vigueur</span></li>
          <li>${I.calendrier}<span>Date de mise à jour : <span id="tbMaj">${esc(majDate)}</span></span></li>
        </ul>
      </section>
    </aside>
  </div>

  <footer class="tb-pied">
    <a href="${url('w/psychosocial/50-ressources-daide/index.html')}">Confidentialité</a>
    <a href="${R}index.html">Conditions d’utilisation</a>
    <a href="${R}index.html">Accessibilité</a>
    <span class="tb-droite-pied"><span>© ${new Date().getFullYear()} Machines Roger inc.</span><span id="tbVersion">Version 1.0.0</span></span>
  </footer>
</div>
</div>`;

  return { html, morts: [...new Set(morts)] };
}
