// Wiki prévention des travailleurs — menu, sommaire, recherche interne, thème, visionneuse d'image,
// états de lecture ; puis, sur une page de lecture : chronomètre, questions, attestation.
// Aucun lien, aucun appel vers le reste du wiki : ce script ne parle qu'au relais des attestations
// (adresse dans data-relais, écrite par tools/espace_travailleurs.mjs) et ne lit que les fichiers
// du dossier travailleurs/.
(function () {
  'use strict';
  var doc = document, corps = doc.body;
  var CLE = 'et:';
  var ls = {
    lire: function (k) { try { return JSON.parse(localStorage.getItem(CLE + k)); } catch (e) { return null; } },
    ecrire: function (k, v) { try { localStorage.setItem(CLE + k, JSON.stringify(v)); } catch (e) { /* navigation privée */ } },
    cles: function (prefixe) {
      var r = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(CLE + prefixe) === 0) r.push(k.slice(CLE.length + prefixe.length)); } } catch (e) { /* rien */ }
      return r;
    },
  };
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var el = function (tag, attrs, enfants) {
    var n = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'texte') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (enfants || []).forEach(function (e) { if (e) n.appendChild(typeof e === 'string' ? doc.createTextNode(e) : e); });
    return n;
  };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var plat = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  function duree(s) {
    s = Math.max(0, Math.round(s || 0));
    var m = Math.floor(s / 60), r = s % 60;
    return m ? m + ' min ' + (r < 10 ? '0' : '') + r + ' s' : r + ' s';
  }
  function jour() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function melanger(tab) {
    var t = tab.slice();
    for (var i = t.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = t[i]; t[i] = t[j]; t[j] = x; }
    return t;
  }
  var WIKI = { pages: [], sections: [] };
  try { WIKI = JSON.parse($('#donnees-wiki').textContent); } catch (e) { /* page sans données */ }
  var sectionDe = {};
  WIKI.pages.forEach(function (p) { sectionDe[p.s] = p.k; });
  var titreDe = {};
  WIKI.pages.forEach(function (p) { titreDe[p.s] = p.t; });

  // ---------- thème (même réglage que le wiki : sombre par défaut, clair, ou comme l'appareil) ----------
  (function () {
    var b = $('#btnTheme');
    if (!b) return;
    var ordre = ['dark', 'light', 'auto'];
    var icones = { dark: '🌙', light: '☀️', auto: '🖥️' };
    var noms = { dark: 'sombre', light: 'clair', auto: 'comme l’appareil' };
    var actuel = function () { return doc.documentElement.getAttribute('data-theme') || 'dark'; };
    var montrer = function () { var t = actuel(); b.textContent = icones[t]; b.setAttribute('aria-label', 'Thème ' + noms[t] + ' — changer'); b.title = 'Thème ' + noms[t]; };
    b.addEventListener('click', function () {
      var t = ordre[(ordre.indexOf(actuel()) + 1) % ordre.length];
      if (t === 'dark') doc.documentElement.removeAttribute('data-theme'); else doc.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('theme', t); } catch (e) { /* rien */ }
      montrer();
    });
    montrer();
  })();

  // ---------- menu latéral sur téléphone (même conduite que le wiki) ----------
  (function () {
    var burger = $('#burger'), sidebar = $('#sidebar');
    if (!burger || !sidebar) return;
    var media = window.matchMedia('(max-width: 900px)');
    function etat(ouvert, rendreFocus) {
      var mobile = media.matches;
      var focusDedans = sidebar.contains(doc.activeElement);
      ouvert = mobile && ouvert;
      sidebar.classList.toggle('open', ouvert);
      sidebar.inert = mobile && !ouvert;
      if (mobile && !ouvert) sidebar.setAttribute('aria-hidden', 'true'); else sidebar.removeAttribute('aria-hidden');
      burger.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
      if (rendreFocus || (mobile && !ouvert && focusDedans)) burger.focus();
    }
    etat(false, false);
    burger.addEventListener('click', function () {
      var ouvrir = !sidebar.classList.contains('open');
      etat(ouvrir, false);
      if (ouvrir && media.matches) { var premier = sidebar.querySelector('a[href]'); if (premier) premier.focus(); }
    });
    sidebar.addEventListener('click', function (ev) {
      var lien = ev.target.closest ? ev.target.closest('a[href]') : null;
      if (lien && media.matches && lien.id !== 'randomLink') etat(false, false);
    });
    doc.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && media.matches && sidebar.classList.contains('open')) { etat(false, true); ev.preventDefault(); } });
    doc.addEventListener('click', function (ev) { if (media.matches && sidebar.classList.contains('open') && !sidebar.contains(ev.target) && !burger.contains(ev.target)) etat(false, false); });
    var sync = function () { etat(sidebar.classList.contains('open'), false); };
    if (media.addEventListener) media.addEventListener('change', sync); else window.addEventListener('resize', sync);
  })();

  // ---------- confort de lecture : taille du texte et mode lecture (mêmes réglages que le wiki) ----------
  (function () {
    var PALIERS = [0.85, 0.92, 1, 1.1, 1.2, 1.32, 1.45];
    var moins = $$('[data-moins]'), plus = $$('[data-plus]'), lect = $$('[data-lecture]');
    if (!moins.length && !lect.length) return;
    function echelle() { try { var v = parseFloat(localStorage.getItem('echelle')); return PALIERS.indexOf(v) >= 0 ? v : 1; } catch (e) { return 1; } }
    function poser(v) {
      doc.documentElement.style.setProperty('--echelle', v);
      try { if (v === 1) localStorage.removeItem('echelle'); else localStorage.setItem('echelle', String(v)); } catch (e) { /* rien */ }
      etat();
    }
    function etat() {
      var v = echelle();
      moins.forEach(function (b) { b.disabled = PALIERS.indexOf(v) <= 0; });
      plus.forEach(function (b) { b.disabled = PALIERS.indexOf(v) >= PALIERS.length - 1; });
      var on = doc.documentElement.getAttribute('data-lecture') === '1';
      lect.forEach(function (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('actif', on); });
    }
    moins.forEach(function (b) { b.addEventListener('click', function () { poser(PALIERS[Math.max(0, PALIERS.indexOf(echelle()) - 1)]); }); });
    plus.forEach(function (b) { b.addEventListener('click', function () { poser(PALIERS[Math.min(PALIERS.length - 1, PALIERS.indexOf(echelle()) + 1)]); }); });
    lect.forEach(function (b) { b.addEventListener('click', function () {
      var on = doc.documentElement.getAttribute('data-lecture') !== '1';
      if (on) doc.documentElement.setAttribute('data-lecture', '1'); else doc.documentElement.removeAttribute('data-lecture');
      try { if (on) localStorage.setItem('lecture', '1'); else localStorage.removeItem('lecture'); } catch (e) { /* rien */ }
      etat();
    }); });
    etat();
  })();

  // ---------- sommaire repliable ----------
  $$('.toc').forEach(function (toc) {
    var btn = $('.toc-toggle', toc);
    if (!btn) return;
    var appliquer = function (replie) {
      toc.classList.toggle('collapsed', replie);
      btn.textContent = replie ? '[afficher]' : '[masquer]';
      btn.setAttribute('aria-expanded', replie ? 'false' : 'true');
    };
    var pref = ls.lire('sommaire');
    appliquer(pref !== null ? pref === 1 : (window.innerWidth <= 900 && $$('li', toc).length > 8));
    btn.addEventListener('click', function () { var r = !toc.classList.contains('collapsed'); appliquer(r); ls.ecrire('sommaire', r ? 1 : 0); });
  });

  // ---------- une page au hasard (dans le wiki seulement) ----------
  (function () {
    var lien = $('#randomLink');
    if (!lien || !WIKI.pages.length) return;
    lien.addEventListener('click', function (ev) {
      ev.preventDefault();
      var ici = corps.getAttribute('data-slug');
      var choix = WIKI.pages.filter(function (p) { return p.s !== ici; });
      if (!choix.length) choix = WIKI.pages;
      location.href = choix[Math.floor(Math.random() * choix.length)].s + '.html';
    });
  })();

  // ---------- recherche interne (index : assets/index-recherche.json) ----------
  var index = null, indexPromesse = null;
  function chargerIndex() {
    if (index) return Promise.resolve(index);
    if (!indexPromesse) {
      indexPromesse = fetch('assets/index-recherche.json', { cache: 'no-cache', credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (j) {
        index = j.map(function (e) { e._t = plat(e.t); e._r = plat(e.r); e._x = plat(e.x); return e; });
        return index;
      }).catch(function () {
        // sans réseau : les titres embarqués dans la page suffisent pour retrouver un article
        indexPromesse = null;
        index = WIKI.pages.map(function (p) { var k = WIKI.sections.filter(function (s) { return s.id === p.k; })[0]; return { s: p.s, t: p.t, r: '', k: k ? k.titre : '', m: '', x: '', _t: plat(p.t), _r: '', _x: '', titresSeulement: true }; });
        return index;
      });
    }
    return indexPromesse;
  }
  function motsDe(q) { return plat(q).split(/[^a-z0-9]+/).filter(function (m) { return m.length >= 2; }).slice(0, 8); }
  function chercher(q) {
    var mots = motsDe(q);
    if (!mots.length || !index) return [];
    return index.map(function (e) {
      var score = 0, tous = true;
      mots.forEach(function (m) {
        var s = 0;
        if (e._t.indexOf(m) >= 0) s += 8;
        if (e._r.indexOf(m) >= 0) s += 3;
        var n = e._x.split(m).length - 1;
        if (n) s += Math.min(n, 5);
        if (!s) tous = false;
        score += s;
      });
      return { e: e, score: score, tous: tous };
    }).filter(function (r) { return r.score > 0; }).sort(function (a, b) { return (b.tous - a.tous) || (b.score - a.score) || a.e.t.localeCompare(b.e.t, 'fr'); });
  }
  // motif qui retrouve un mot sans égard aux accents ni à la casse, dans un texte non normalisé
  function motifDe(mots) {
    var variantes = { a: 'aàâä', e: 'eéèêë', i: 'iîï', o: 'oôö', u: 'uùûü', c: 'cç', y: 'yÿ' };
    return new RegExp('(' + mots.map(function (m) {
      return m.split('').map(function (c) { return variantes[c] ? '[' + variantes[c] + variantes[c].toUpperCase() + ']' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('');
    }).join('|') + ')', 'gi');
  }
  function surligner(texte, mots, balise) {
    return esc(texte).replace(motifDe(mots), '<' + balise + '>$1</' + balise + '>');
  }
  function extrait(e, mots) {
    var pos = -1;
    for (var i = 0; i < mots.length; i++) { var p = e._x.indexOf(mots[i]); if (p >= 0 && (pos < 0 || p < pos)) pos = p; }
    if (pos < 0) return e.r;
    var debut = Math.max(0, pos - 70), fin = Math.min(e.x.length, pos + 110);
    return (debut > 0 ? '…' : '') + e.x.slice(debut, fin).trim() + (fin < e.x.length ? '…' : '');
  }
  function brancherRecherche(idChamp, idBoite) {
    var champ = $('#' + idChamp), boite = $('#' + idBoite);
    if (!champ || !boite) return;
    var sel = -1, derniere = 0;
    champ.setAttribute('role', 'combobox');
    champ.setAttribute('aria-autocomplete', 'list');
    champ.setAttribute('aria-controls', idBoite);
    champ.setAttribute('aria-expanded', 'false');
    boite.setAttribute('role', 'listbox');
    boite.setAttribute('aria-label', 'Suggestions de recherche');
    var annonce = el('span', { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', style: 'position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0' });
    champ.parentNode.appendChild(annonce);
    function fermer() { boite.hidden = true; boite.innerHTML = ''; sel = -1; champ.setAttribute('aria-expanded', 'false'); champ.removeAttribute('aria-activedescendant'); }
    function montrer(resultats, q) {
      var mots = motsDe(q);
      if (!resultats.length) {
        boite.innerHTML = '<div class="s-msg" role="presentation">Aucun résultat pour « ' + esc(q) + ' »</div>';
        annonce.textContent = 'Aucun résultat';
      } else {
        boite.innerHTML = resultats.slice(0, 8).map(function (r) {
          return '<a href="' + r.e.s + '.html"><span class="s-title">' + surligner(r.e.t, mots, 'b') + '</span><span class="s-meta">' + esc(r.e.k) + (r.e.m ? ' · ≈ ' + r.e.m + ' min' : '') + '</span></a>';
        }).join('') + '<a class="s-all" href="recherche.html?q=' + encodeURIComponent(q) + '">Voir les ' + resultats.length + ' résultat' + (resultats.length > 1 ? 's' : '') + ' pour « ' + esc(q) + ' »</a>';
        $$('a', boite).forEach(function (a, i) { a.id = idBoite + '-option-' + i; a.setAttribute('role', 'option'); a.setAttribute('tabindex', '-1'); a.setAttribute('aria-selected', 'false'); });
        annonce.textContent = resultats.length + ' résultat' + (resultats.length > 1 ? 's' : '') + '. Flèches pour parcourir, Entrée pour ouvrir.';
      }
      boite.hidden = false; sel = -1;
      champ.setAttribute('aria-expanded', 'true');
    }
    function selectionner(n) {
      var options = $$('[role="option"]', boite);
      if (!options.length) return;
      sel = (n + options.length) % options.length;
      options.forEach(function (o, i) { o.classList.toggle('sel', i === sel); o.setAttribute('aria-selected', i === sel ? 'true' : 'false'); });
      champ.setAttribute('aria-activedescendant', options[sel].id);
    }
    champ.addEventListener('input', function () {
      var q = champ.value.trim(), demande = ++derniere;
      if (q.length < 2) { fermer(); return; }
      chargerIndex().then(function () { if (demande !== derniere || champ.value.trim() !== q) return; montrer(chercher(q), q); });
    });
    champ.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); if (boite.hidden && champ.value.trim().length >= 2) champ.dispatchEvent(new Event('input')); else selectionner(sel + 1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); selectionner(sel - 1); }
      else if (ev.key === 'Escape') { fermer(); }
      else if (ev.key === 'Enter') {
        var options = $$('[role="option"]', boite);
        if (sel >= 0 && options[sel]) { ev.preventDefault(); location.href = options[sel].getAttribute('href'); }
        else if (champ.form) { /* le formulaire de la page Recherche s'envoie */ }
        else if (champ.value.trim().length >= 2) { ev.preventDefault(); location.href = 'recherche.html?q=' + encodeURIComponent(champ.value.trim()); }
      }
    });
    champ.addEventListener('blur', function () { setTimeout(function () { if (!boite.contains(doc.activeElement)) fermer(); }, 150); });
    boite.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
  }
  brancherRecherche('q', 'suggest');
  brancherRecherche('q2', 'suggest2');
  // page Recherche : résultats complets, avec extrait
  (function () {
    var zone = $('#resultats');
    if (!zone) return;
    var champ = $('#q2'), form = $('.et-recherche');
    var q = '';
    try { q = (new URLSearchParams(location.search).get('q') || '').trim(); } catch (e) { /* rien */ }
    function rendre(q) {
      zone.innerHTML = '';
      if (q.length < 2) { zone.appendChild(el('p', { 'class': 'page-sub', texte: 'Tape au moins deux lettres, puis « Chercher ».' })); return; }
      zone.appendChild(el('p', { 'class': 'page-sub', texte: 'Recherche en cours…' }));
      chargerIndex().then(function () {
        var resultats = chercher(q), mots = motsDe(q);
        zone.innerHTML = '';
        if (!index || !index.length) { zone.appendChild(el('p', { 'class': 'page-sub', texte: 'La recherche n’est pas disponible pour le moment. Les thèmes du menu restent accessibles.' })); return; }
        if (!resultats.length) {
          zone.appendChild(el('h2', { texte: 'Aucun résultat pour « ' + q + ' »' }));
          zone.appendChild(el('p', { html: 'Essaie un autre mot, ou parcours les thèmes : ' + WIKI.sections.map(function (s) { return '<a href="section-' + s.id + '.html">' + esc(s.icone + ' ' + s.titre) + '</a>'; }).join(', ') + '.' }));
          return;
        }
        zone.appendChild(el('h2', { texte: resultats.length + ' résultat' + (resultats.length > 1 ? 's' : '') + ' pour « ' + q + ' »' + (index[0].titresSeulement ? ' (titres seulement, sans réseau)' : '') }));
        resultats.forEach(function (r) {
          zone.appendChild(el('div', { 'class': 'sr-item' }, [
            el('a', { 'class': 'sr-title', href: r.e.s + '.html', html: surligner(r.e.t, mots, 'b') }),
            el('div', { 'class': 'sr-meta', texte: r.e.k + (r.e.m ? ' · ≈ ' + r.e.m + ' min' : '') }),
            r.e.x ? el('div', { 'class': 'sr-x', html: surligner(extrait(r.e, mots), mots, 'b') }) : null,
          ]));
        });
      });
    }
    if (champ) champ.value = q;
    if (form) form.addEventListener('submit', function (ev) { ev.preventDefault(); var v = champ.value.trim(); try { history.replaceState(null, '', 'recherche.html?q=' + encodeURIComponent(v)); } catch (e) { /* rien */ } rendre(v); });
    rendre(q);
  })();

  // ---------- visionneuse d'image (même conduite que le wiki) ----------
  (function () {
    var IMAGE = /\.(?:png|jpe?g|gif|svg|webp)(?:[?#]|$)/i;
    var ouverte = null;
    function surTouche(ev) {
      if (!ouverte) return;
      if (ev.key === 'Escape') { ev.preventDefault(); fermer(false); }
      else if (ev.key === 'Tab') { ev.preventDefault(); ouverte.bouton.focus(); }
    }
    function fermer(parRetour) {
      if (!ouverte) return;
      var o = ouverte; ouverte = null;
      o.v.remove();
      doc.documentElement.classList.remove('visionneuse-ouverte');
      doc.removeEventListener('keydown', surTouche, true);
      if (o.lien && o.lien.focus) o.lien.focus();
      if (!parRetour && o.historique && history.state && history.state.visionneuse) history.back();
    }
    function ouvrir(lien, source) {
      var v = el('div', { 'class': 'visionneuse', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Image agrandie' + (source && source.alt ? ' : ' + source.alt : '') });
      var bouton = el('button', { type: 'button', 'class': 'vis-fermer', 'aria-label': 'Fermer l’image agrandie', texte: '✕' });
      var img = el('img', { src: lien.getAttribute('href'), alt: source ? source.alt : '' });
      var filtre = source && window.getComputedStyle ? window.getComputedStyle(source).filter : '';
      if (filtre && filtre !== 'none') img.style.filter = filtre;
      v.appendChild(bouton); v.appendChild(img); v.appendChild(el('p', { 'class': 'vis-aide', texte: 'Toucher l’image : taille réelle ou ajustée à l’écran' }));
      v.addEventListener('click', function (ev) {
        if (ev.target !== img) { fermer(false); return; }
        var reelle = !v.classList.contains('vis-reelle');
        img.style.width = reelle ? Math.max(img.naturalWidth || 0, img.getBoundingClientRect().width * 2) + 'px' : '';
        v.classList.toggle('vis-reelle', reelle);
      });
      doc.addEventListener('keydown', surTouche, true);
      doc.documentElement.classList.add('visionneuse-ouverte');
      corps.appendChild(v);
      var historique = false;
      try { history.pushState({ visionneuse: true }, ''); historique = true; } catch (e) { /* rien */ }
      ouverte = { v: v, lien: lien, bouton: bouton, historique: historique };
      bouton.focus();
    }
    window.addEventListener('popstate', function () { fermer(true); });
    doc.addEventListener('click', function (ev) {
      if (ouverte || ev.defaultPrevented || ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      var a = ev.target.closest ? ev.target.closest('.page-img a, a.img-lien') : null;
      if (!a || !IMAGE.test(a.getAttribute('href') || '')) return;
      ev.preventDefault();
      ouvrir(a, a.querySelector('img'));
    });
  })();

  // ---------- envoi au relais, file d'attente hors ligne ----------
  var RELAIS = corps.getAttribute('data-relais') || '';
  function envoyer(contenu) {
    if (!RELAIS) return Promise.resolve({ ok: false, definitif: false, erreur: 'service non configuré' });
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var minuterie = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    return fetch(RELAIS, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contenu),
      signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', referrerPolicy: 'no-referrer',
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok && j.ok) return { ok: true, id: j.id, relie: j.relie };
        return { ok: false, definitif: Boolean(j.definitif), erreur: j.erreur || ('erreur ' + r.status) };
      });
    }).catch(function () { return { ok: false, definitif: false, erreur: 'réseau injoignable' }; })
      .then(function (res) { clearTimeout(minuterie); return res; });
  }
  function mettreEnFile(contenu) {
    var file = ls.lire('file') || [];
    file = file.filter(function (x) { return !(x.adresse === contenu.adresse && x.nom === contenu.nom); });
    file.push(contenu);
    ls.ecrire('file', file);
  }
  var enCours = false;
  function viderFile(apres) {
    var file = ls.lire('file') || [];
    if (enCours || !file.length || !RELAIS || navigator.onLine === false) return;
    enCours = true;
    var restants = [];
    (function suivant(i) {
      if (i >= file.length) {
        ls.ecrire('file', restants.concat((ls.lire('file') || []).slice(file.length)));
        enCours = false;
        if (apres) apres();
        return;
      }
      var item = file[i];
      envoyer(item).then(function (r) {
        var slug = (item.adresse.match(/([a-z0-9-]+)\.html$/) || [])[1];
        var etat = ls.lire('etat:' + slug) || {};
        if (r.ok) {
          etat.atteste = true; etat.enAttente = false;
          if (etat.certificat) etat.certificat.numero = r.id;
          ls.ecrire('etat:' + slug, etat);
        } else if (r.definitif) {
          etat.enAttente = false; etat.refus = r.erreur;
          ls.ecrire('etat:' + slug, etat);
        } else restants.push(item);
        suivant(i + 1);
      });
    })(0);
  }

  // ---------- états de lecture : pastilles, infobox, barres de progression, mes attestations ----------
  function etatDe(slug) {
    var etat = ls.lire('etat:' + slug) || {};
    var date = etat.certificat && etat.certificat.date ? ' le ' + etat.certificat.date : '';
    if (etat.atteste) return { texte: 'Attestée ✓', long: 'Attestée' + date + ' ✓', classe: 'et-badge-ok', fait: true, rang: 4 };
    if (etat.enAttente) return { texte: 'En attente d’envoi', long: 'Attestée' + date + ', en attente d’envoi', classe: 'et-badge-attente', rang: 3 };
    if (etat.reussi) return { texte: 'À attester', long: 'Questions réussies : tu peux attester', classe: 'et-badge-cours', rang: 2, encours: true };
    if (etat.commence) return { texte: 'Commencée', long: 'Commencée', classe: 'et-badge-cours', rang: 1, encours: true };
    return { texte: 'À lire', long: 'À lire', classe: '', rang: 0 };
  }
  function rafraichirEtats() {
    $$('[data-etat-coche][data-slug]').forEach(function (c) { c.textContent = etatDe(c.getAttribute('data-slug')).fait ? '✓' : ''; });
    // reprendre : la page commencée et non attestée la plus avancée dans l'ordre de lecture
    var reprise = null;
    WIKI.pages.forEach(function (p) { if (etatDe(p.s).encours && p.s !== corps.getAttribute('data-slug')) reprise = p; });
    [['#reprendre', 'a'], ['#reprendreAccueil', 'a']].forEach(function (x) {
      var li = $(x[0]); if (!li) return;
      var a = $(x[1], li);
      if (!reprise) { li.hidden = true; return; }
      a.href = reprise.s + '.html';
      a.textContent = (x[0] === '#reprendre' ? '▶ Reprendre : ' : '') + reprise.t;
      li.hidden = false;
    });
    $$('[data-etat-badge][data-slug]').forEach(function (b) {
      var e = etatDe(b.getAttribute('data-slug'));
      b.textContent = b.hasAttribute('data-etat-long') ? e.long : e.texte;
      b.classList.remove('et-badge-ok', 'et-badge-cours', 'et-badge-attente');
      if (e.classe) b.classList.add(e.classe);
      if (b.classList.contains('et-badge-discret')) b.hidden = !e.fait;
    });
    var faits = {};
    WIKI.pages.forEach(function (p) { if (etatDe(p.s).fait) faits[p.k] = (faits[p.k] || 0) + 1; });
    var total = 0; Object.keys(faits).forEach(function (k) { total += faits[k]; });
    $$('[data-progression-compte]').forEach(function (c) { var k = c.getAttribute('data-progression-compte'); c.textContent = k ? (faits[k] || 0) : total; });
    $$('[data-progression-barre]').forEach(function (b) {
      var k = b.getAttribute('data-progression-barre');
      var n = k ? (faits[k] || 0) : total;
      var max = k ? WIKI.pages.filter(function (p) { return p.k === k; }).length : WIKI.pages.length;
      b.style.width = (max ? Math.round(n / max * 100) : 0) + '%';
      var role = b.parentNode; if (role && role.getAttribute('role') === 'progressbar') role.setAttribute('aria-valuenow', n);
    });
    var liste = $('#listeAttestations');
    if (liste) {
      var certs = ls.cles('etat:').map(function (slug) { var e = ls.lire('etat:' + slug) || {}; return e.certificat ? { slug: slug, c: e.certificat, atteste: e.atteste } : null; }).filter(Boolean)
        .sort(function (a, b) { return (b.c.date || '').localeCompare(a.c.date || ''); });
      if (certs.length) {
        liste.innerHTML = '';
        liste.appendChild(el('ul', { 'class': 'et-attestations' }, certs.map(function (x) {
          return el('li', {}, [
            el('span', { 'class': 'et-att-date', texte: x.c.date }),
            el('a', { href: x.slug + '.html', texte: titreDe[x.slug] || x.c.titre }),
            el('span', { 'class': 'et-badge ' + (x.atteste ? 'et-badge-ok' : 'et-badge-attente'), texte: x.atteste ? 'Transmise · n° ' + (x.c.numero || '') : 'En attente d’envoi' }),
            el('span', { 'class': 'et-att-date', texte: 'lecture ' + x.c.lecture + (x.c.score ? ' · ' + x.c.score : '') }),
          ]);
        })));
      }
    }
  }

  // ---------- page de lecture ----------
  function lecture() {
    var slug = corps.getAttribute('data-slug');
    var titre = corps.getAttribute('data-titre');
    var section = corps.getAttribute('data-section');
    var minutes = Number(corps.getAttribute('data-minutes')) || 1;
    var revision = corps.getAttribute('data-revision') || '';
    var seuil = Number(corps.getAttribute('data-seuil'));
    if (!(seuil >= 0)) seuil = 80;
    var donnees = { questions: [] };
    try { donnees = JSON.parse($('#donnees-questions').textContent); } catch (e) { /* page sans questions */ }
    var questions = donnees.questions || [];
    var etat = ls.lire('etat:' + slug) || {};
    if (!etat.commence) { etat.commence = jour(); ls.ecrire('etat:' + slug, etat); }
    var sauverEtat = function () { ls.ecrire('etat:' + slug, etat); rafraichirEtats(); };

    // -- chronomètre : temps ACTIF (page visible, lecteur actif depuis moins de 3 minutes) --
    var temps = ls.lire('temps:' + slug) || { lecture: 0, questions: 0 };
    var activite = Date.now();
    ['scroll', 'pointerdown', 'pointermove', 'keydown', 'touchstart', 'input', 'wheel'].forEach(function (t) {
      window.addEventListener(t, function () { activite = Date.now(); }, { passive: true });
    });
    doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible') activite = Date.now(); ls.ecrire('temps:' + slug, temps); });
    var zoneQuestions = $('#questions');
    var puce = el('div', { 'class': 'et-chrono', 'aria-hidden': 'true', title: 'Temps de lecture de cette page' });
    corps.appendChild(puce);
    var cellule = $('#chrono');
    var afficheurs = [];
    function rafraichir() {
      puce.textContent = '⏱ ' + duree(temps.lecture);
      if (cellule) cellule.textContent = duree(temps.lecture);
      afficheurs.forEach(function (f) { f(); });
    }
    var tic = 0;
    setInterval(function () {
      var r = zoneQuestions.getBoundingClientRect();
      var surQuestions = r.top < window.innerHeight * 0.55 && r.bottom > 0;
      puce.classList.toggle('et-cache', surQuestions);
      if (doc.visibilityState !== 'visible' || Date.now() - activite > 180000) return;
      if (surQuestions && questions.length) temps.questions++; else temps.lecture++;
      if (++tic % 5 === 0) ls.ecrire('temps:' + slug, temps);
      rafraichir();
    }, 1000);
    window.addEventListener('pagehide', function () { ls.ecrire('temps:' + slug, temps); });
    rafraichir();

    function blocTemps(fige) {
      var b = el('div', { 'class': 'et-temps', role: 'group', 'aria-label': 'Temps de lecture' });
      var ligne1 = el('p', { 'class': 'et-temps-principal' });
      var ligne2 = el('p', { 'class': 'et-temps-detail' });
      var alerte = el('p', { 'class': 'et-temps-alerte', hidden: true });
      b.appendChild(ligne1); b.appendChild(ligne2); b.appendChild(alerte);
      var maj = function () {
        var t = fige || temps;
        ligne1.innerHTML = '⏱ Temps de lecture de cette page : <strong>' + duree(t.lecture) + '</strong>';
        ligne2.textContent = 'Lecture estimée : ≈ ' + minutes + ' min' + (questions.length ? ' · Temps sur les questions : ' + duree(t.questions) : '');
        var court = t.lecture < minutes * 60 * 0.5;
        alerte.hidden = !court || Boolean(fige);
        if (court) alerte.textContent = 'Tu as lu vite par rapport au temps estimé (≈ ' + minutes + ' min). Si tu veux, relis la page avant de soumettre : ton temps de lecture paraîtra sur ton attestation.';
      };
      if (!fige) afficheurs.push(maj);
      maj();
      return b;
    }

    var bandeau = $('#etatPage');
    function montrerBandeau() {
      if (!etat.certificat) { bandeau.hidden = true; return; }
      bandeau.hidden = false;
      bandeau.className = 'et-etat-page ' + (etat.atteste ? 'et-ok' : 'et-attente');
      bandeau.innerHTML = '';
      bandeau.appendChild(el('p', { texte: etat.atteste
        ? '✓ Tu as attesté cette lecture le ' + etat.certificat.date + '.'
        : '⏳ Ton attestation du ' + etat.certificat.date + ' n’est pas encore transmise. Elle repartira toute seule à ta prochaine visite avec du réseau.' }));
      var voir = el('button', { type: 'button', 'class': 'et-bouton et-bouton-second', texte: 'Voir mon attestation' });
      voir.addEventListener('click', function () { montrerCertificat(etat.certificat); });
      bandeau.appendChild(voir);
    }
    montrerBandeau();

    var zone = $('#questionsZone');
    var essais = etat.essais || 0;
    var textesCourts = {};
    var LIBELLES = { choix: 'Choix de réponse', multi: 'Choisis la ou les réponses vraies', vf: 'Vrai ou faux', ordre: 'Mets en ordre', court: 'Court développement' };
    var CONSIGNES = {
      choix: 'Choisis une seule réponse.', multi: 'Coche toutes les réponses vraies : il peut y en avoir une ou plusieurs.',
      vf: 'Cette affirmation est-elle vraie ou fausse ?', ordre: 'Avec les flèches, place les étapes dans le bon ordre, de la première à la dernière.',
      court: 'Réponds en quelques phrases, avec tes mots (au moins 15 caractères). Ta réponse sera lue par un conseiller.',
    };

    function construireQuestions() {
      zone.innerHTML = '';
      if (!questions.length) {
        zone.appendChild(el('p', { texte: 'Cette page n’a pas de questions. Quand tu as fini de la lire, tu peux attester ta lecture.' }));
        zone.appendChild(blocTemps());
        var fini = el('button', { type: 'button', 'class': 'et-bouton', texte: 'J’ai terminé ma lecture' });
        fini.addEventListener('click', function () {
          etat.reussi = true; sauverEtat();
          fini.disabled = true;
          ouvrirAttestation({ pourcentage: null, score: '', essais: 0, detail: '', developpement: '', nbCourts: 0, temps: { lecture: temps.lecture, questions: temps.questions } });
        });
        zone.appendChild(fini);
        return;
      }
      var form = el('form', { 'class': 'et-formulaire', novalidate: true });
      questions.forEach(function (q, i) {
        var fs = el('fieldset', { 'class': 'et-q et-q-' + q.type, 'data-i': i });
        fs.appendChild(el('legend', {}, [el('span', { 'class': 'et-q-num', texte: 'Question ' + (i + 1) + ' · ' + LIBELLES[q.type] }), el('span', { 'class': 'et-q-texte', texte: q.question })]));
        fs.appendChild(el('p', { 'class': 'et-q-consigne', texte: CONSIGNES[q.type] }));
        var nom = 'q' + i;
        if (q.type === 'choix' || q.type === 'multi') {
          var liste = el('div', { 'class': 'et-options' });
          melanger(q.options.map(function (_, k) { return k; })).forEach(function (k) {
            var id = nom + '-' + k;
            liste.appendChild(el('label', { 'class': 'et-option', 'for': id }, [el('input', { type: q.type === 'choix' ? 'radio' : 'checkbox', name: nom, id: id, value: k }), el('span', { texte: q.options[k] })]));
          });
          fs.appendChild(liste);
        } else if (q.type === 'vf') {
          var vf = el('div', { 'class': 'et-options et-options-vf' });
          [['true', 'Vrai'], ['false', 'Faux']].forEach(function (o) {
            var id = nom + '-' + o[0];
            vf.appendChild(el('label', { 'class': 'et-option', 'for': id }, [el('input', { type: 'radio', name: nom, id: id, value: o[0] }), el('span', { texte: o[1] })]));
          });
          fs.appendChild(vf);
        } else if (q.type === 'ordre') {
          var ordre = q.etapes.map(function (_, k) { return k; });
          var essai = 0;
          do { ordre = melanger(ordre); } while (++essai < 20 && ordre.every(function (v, k) { return v === k; }));
          var ol = el('ol', { 'class': 'et-ordre', 'data-ordre': ordre.join(',') });
          var dessiner = function (focusSur) {
            var actuel = ol.getAttribute('data-ordre').split(',').map(Number);
            ol.innerHTML = '';
            actuel.forEach(function (k, pos) {
              var haut = el('button', { type: 'button', 'class': 'et-fleche', 'aria-label': 'Monter : ' + q.etapes[k], texte: '↑', disabled: pos === 0 });
              var bas = el('button', { type: 'button', 'class': 'et-fleche', 'aria-label': 'Descendre : ' + q.etapes[k], texte: '↓', disabled: pos === actuel.length - 1 });
              var bouger = function (dec, quel) {
                return function () {
                  if (ol.hasAttribute('data-fige')) return;
                  var t = actuel.slice(), j = pos + dec;
                  t[pos] = t[j]; t[j] = k;
                  ol.setAttribute('data-ordre', t.join(','));
                  dessiner({ k: k, quel: quel });
                };
              };
              haut.addEventListener('click', bouger(-1, 'haut'));
              bas.addEventListener('click', bouger(1, 'bas'));
              ol.appendChild(el('li', { 'class': 'et-etape', 'data-k': k }, [el('span', { 'class': 'et-etape-texte', texte: q.etapes[k] }), el('span', { 'class': 'et-fleches' }, [haut, bas])]));
              if (focusSur && focusSur.k === k) setTimeout(function () { var b = focusSur.quel === 'haut' && !haut.disabled ? haut : (!bas.disabled ? bas : haut); b.focus(); }, 0);
            });
          };
          dessiner();
          fs.appendChild(ol);
        } else if (q.type === 'court') {
          var ta = el('textarea', { name: nom, rows: 4, maxlength: 1500, 'aria-label': 'Ta réponse à la question ' + (i + 1) });
          ta.value = textesCourts[i] || '';
          ta.addEventListener('input', function () { textesCourts[i] = ta.value; });
          fs.appendChild(ta);
        }
        fs.appendChild(el('div', { 'class': 'et-q-retour', 'aria-live': 'polite' }));
        form.appendChild(fs);
      });
      var soumission = el('div', { 'class': 'et-soumission' });
      soumission.appendChild(el('h3', { texte: 'Avant de soumettre' }));
      soumission.appendChild(blocTemps());
      var message = el('p', { 'class': 'et-message', role: 'alert' });
      var bouton = el('button', { type: 'submit', 'class': 'et-bouton', texte: 'Soumettre mes réponses' });
      soumission.appendChild(bouton);
      soumission.appendChild(message);
      form.appendChild(soumission);
      form.addEventListener('submit', function (e) { e.preventDefault(); corriger(form, message, bouton); });
      zone.appendChild(form);
    }

    function reponseDonnee(form, q, i) {
      var nom = 'q' + i;
      if (q.type === 'choix' || q.type === 'vf') { var c = $('input[name="' + nom + '"]:checked', form); return c ? c.value : null; }
      if (q.type === 'multi') { var cs = $$('input[name="' + nom + '"]:checked', form).map(function (x) { return Number(x.value); }); return cs.length ? cs.sort() : null; }
      if (q.type === 'ordre') return $('.et-q[data-i="' + i + '"] .et-ordre', form).getAttribute('data-ordre').split(',').map(Number);
      if (q.type === 'court') { var t = ($('textarea[name="' + nom + '"]', form).value || '').trim(); return t.length >= 15 ? t : null; }
      return null;
    }
    function texteReponse(q, r) {
      if (q.type === 'choix') return q.options[Number(r)];
      if (q.type === 'vf') return r === 'true' ? 'Vrai' : 'Faux';
      if (q.type === 'multi') return r.map(function (k) { return q.options[k]; }).join(' ; ');
      if (q.type === 'ordre') return r.map(function (k) { return q.etapes[k]; }).join(' → ');
      return r;
    }
    function bonneReponse(q) {
      if (q.type === 'choix') return q.options[q.reponse];
      if (q.type === 'vf') return q.reponse ? 'Vrai' : 'Faux';
      if (q.type === 'multi') return q.reponses.map(function (k) { return q.options[k]; }).join(' ; ');
      if (q.type === 'ordre') return q.etapes.join(' → ');
      return '';
    }
    function estJuste(q, r) {
      if (q.type === 'choix') return Number(r) === q.reponse;
      if (q.type === 'vf') return r === String(q.reponse);
      if (q.type === 'multi') { var a = q.reponses.slice().sort(); return a.length === r.length && a.every(function (v, k) { return v === r[k]; }); }
      if (q.type === 'ordre') return r.every(function (v, k) { return v === k; });
      return null;
    }

    function corriger(form, message, bouton) {
      var manque = [];
      var reponses = questions.map(function (q, i) {
        var r = reponseDonnee(form, q, i);
        var fs = $('.et-q[data-i="' + i + '"]', form);
        fs.classList.toggle('et-manque', r === null);
        if (r === null) manque.push(fs);
        return r;
      });
      if (manque.length) {
        message.textContent = manque.length === 1 ? 'Il te reste une question sans réponse (encadrée en orange).' : 'Il te reste ' + manque.length + ' questions sans réponse (encadrées en orange).';
        manque[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      essais++;
      etat.essais = essais;
      var auto = 0, bons = 0, detail = [], developpement = [], nbCourts = 0;
      questions.forEach(function (q, i) {
        var r = reponses[i], fs = $('.et-q[data-i="' + i + '"]', form), retour = $('.et-q-retour', fs);
        $$('input, textarea', fs).forEach(function (x) { x.disabled = true; });
        var ol = $('.et-ordre', fs);
        if (ol) { ol.setAttribute('data-fige', ''); $$('button', ol).forEach(function (b) { b.disabled = true; }); }
        retour.innerHTML = '';
        if (q.type === 'court') {
          nbCourts++;
          developpement.push('Q' + (i + 1) + ' : ' + q.question + '\nR : ' + r);
          fs.classList.add('et-q-notee');
          retour.appendChild(el('p', { 'class': 'et-verdict', texte: '✎ Réponse notée : elle sera transmise avec ton attestation et lue par un conseiller.' }));
          retour.appendChild(el('p', { texte: 'Une bonne réponse contient :' }));
          retour.appendChild(el('ul', {}, q.attendu.map(function (a) { return el('li', { texte: a }); })));
        } else {
          auto++;
          var juste = estJuste(q, r);
          if (juste) bons++;
          detail.push((juste ? '✔' : '✘') + ' Q' + (i + 1) + ' (' + LIBELLES[q.type].toLowerCase() + ') ' + q.question + ' → ' + texteReponse(q, r));
          fs.classList.add(juste ? 'et-q-juste' : 'et-q-fausse');
          retour.appendChild(el('p', { 'class': 'et-verdict', texte: juste ? '✔ Bonne réponse' : '✘ Réponse à revoir' }));
          if (!juste && q.type === 'ordre') retour.appendChild(el('p', { texte: 'Le bon ordre : ' + bonneReponse(q) }));
        }
        retour.appendChild(el('p', { 'class': 'et-explication', texte: q.explication }));
      });
      var pct = auto ? Math.round(bons / auto * 100) : null;
      var reussi = pct === null || pct >= seuil;
      var fige = { lecture: temps.lecture, questions: temps.questions };
      ls.ecrire('temps:' + slug, temps);
      bouton.hidden = true;
      message.textContent = '';
      var bilan = el('div', { 'class': 'et-bilan ' + (reussi ? 'et-ok' : 'et-reprise'), role: 'status', tabindex: '-1' });
      bilan.appendChild(el('p', { 'class': 'et-bilan-score', texte: pct === null ? 'Réponses notées.' : 'Résultat : ' + bons + ' sur ' + auto + ' (' + pct + ' %)' }));
      bilan.appendChild(blocTemps(fige));
      if (reussi) {
        etat.reussi = true;
        bilan.appendChild(el('p', { texte: 'Bravo ! Tu peux maintenant attester ta lecture, juste en dessous.' }));
      } else {
        bilan.appendChild(el('p', { texte: 'Pas encore ' + seuil + ' %. Relis les explications et les passages de la page, puis recommence quand tu veux : rien n’est compté contre toi.' }));
        var encore = el('button', { type: 'button', 'class': 'et-bouton', texte: 'Recommencer les questions' });
        encore.addEventListener('click', function () { construireQuestions(); zoneQuestions.scrollIntoView({ behavior: 'smooth' }); });
        bilan.appendChild(encore);
      }
      sauverEtat();
      form.appendChild(bilan);
      bilan.focus({ preventScroll: true });
      bilan.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (reussi) {
        ouvrirAttestation({
          pourcentage: pct, score: pct === null ? '' : bons + '/' + auto + ' — ' + pct + ' %', essais: essais,
          detail: detail.join('\n'), developpement: developpement.join('\n\n'), nbCourts: nbCourts, temps: fige,
        });
      }
    }

    var zoneAtt = $('#attestation');
    function ouvrirAttestation(res) {
      zoneAtt.hidden = false;
      zoneAtt.innerHTML = '';
      zoneAtt.appendChild(el('h2', { id: 'attestation-titre', texte: 'Atteste ta lecture' }));
      var recap = el('dl', { 'class': 'et-recap' });
      [['Page', titre], ['Temps de lecture de la page', duree(res.temps.lecture)], ['Lecture estimée', '≈ ' + minutes + ' min'],
        questions.length ? ['Temps sur les questions', duree(res.temps.questions)] : null,
        res.score ? ['Résultat', res.score] : null, res.essais ? ['Essais', String(res.essais)] : null,
        res.nbCourts ? ['Réponses écrites', res.nbCourts + ' (lues par un conseiller)'] : null]
        .filter(Boolean).forEach(function (l) { recap.appendChild(el('dt', { texte: l[0] })); recap.appendChild(el('dd', { texte: l[1] })); });
      zoneAtt.appendChild(recap);

      var form = el('form', { 'class': 'et-form-att', autocomplete: 'off', novalidate: true });
      var choisi = null;
      var champ = el('input', { type: 'text', id: 'etNom', 'class': 'et-champ', role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': 'etNoms', maxlength: 80, autocomplete: 'off', spellcheck: 'false', placeholder: 'Tape les premières lettres de ton nom' });
      var liste = el('ul', { id: 'etNoms', 'class': 'et-noms', role: 'listbox', hidden: true });
      var etatNom = el('p', { 'class': 'et-etat-nom', 'aria-live': 'polite' });
      var hors = el('input', { type: 'checkbox', id: 'etHorsListe' });
      var engage = el('input', { type: 'checkbox', id: 'etEngage' });
      var bouton = el('button', { type: 'submit', 'class': 'et-bouton', texte: 'Attester ma lecture', disabled: true });
      var message = el('p', { 'class': 'et-message', role: 'alert' });
      form.appendChild(el('label', { 'for': 'etNom', 'class': 'et-libelle', texte: 'Ton nom, choisi dans la liste des employés' }));
      form.appendChild(el('div', { 'class': 'et-combo' }, [champ, liste]));
      form.appendChild(etatNom);
      form.appendChild(el('label', { 'class': 'et-case', 'for': 'etHorsListe' }, [hors, el('span', { texte: 'Mon nom n’est pas dans la liste : je l’écris au complet (prénom et nom). Le service de santé et de sécurité le reliera à mon dossier.' })]));
      form.appendChild(el('label', { 'class': 'et-case', 'for': 'etEngage' }, [engage, el('span', { texte: 'J’atteste avoir lu cette page et avoir répondu moi-même aux questions.' })]));
      form.appendChild(el('p', { 'class': 'et-note', texte: 'En envoyant, ton nom, la page lue, ton temps de lecture, ton résultat et tes réponses écrites sont enregistrés au registre de formation de ton employeur.' }));
      form.appendChild(bouton);
      form.appendChild(message);
      zoneAtt.appendChild(form);

      var valide = function () {
        var nom = champ.value.trim();
        var nomOk = choisi ? choisi.nom === nom : (hors.checked && /\S+\s+\S+/.test(nom) && nom.length >= 5);
        bouton.disabled = !(nomOk && engage.checked);
        return nomOk && engage.checked;
      };
      var minut = null, derniere = '';
      var fermer = function () { liste.hidden = true; champ.setAttribute('aria-expanded', 'false'); };
      champ.addEventListener('input', function () {
        if (choisi && choisi.nom !== champ.value.trim()) { choisi = null; etatNom.textContent = ''; }
        valide();
        clearTimeout(minut);
        var v = champ.value.trim();
        if (hors.checked || v.length < 2) { fermer(); return; }
        minut = setTimeout(function () { chercherNom(v); }, 250);
      });
      champ.addEventListener('keydown', function (e) {
        var items = $$('[role="option"]', liste);
        if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); items[0].focus(); }
        if (e.key === 'Escape') fermer();
      });
      liste.addEventListener('keydown', function (e) {
        var items = $$('[role="option"]', liste), i = items.indexOf(doc.activeElement);
        if (e.key === 'ArrowDown' && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? items[i - 1] : champ).focus(); }
        if (e.key === 'Escape') { fermer(); champ.focus(); }
      });
      function chercherNom(v) {
        if (!RELAIS) { etatNom.textContent = 'La liste des noms n’est pas encore branchée. Coche « Mon nom n’est pas dans la liste » et écris ton nom au complet.'; return; }
        derniere = v;
        var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        setTimeout(function () { if (ctrl) ctrl.abort(); }, 10000);
        fetch(RELAIS + (RELAIS.indexOf('?') < 0 ? '?' : '&') + 'q=' + encodeURIComponent(v), { signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', referrerPolicy: 'no-referrer' })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (derniere !== v || hors.checked) return;
            var res = (j && j.resultats) || [];
            liste.innerHTML = '';
            if (!res.length) { fermer(); etatNom.textContent = j && j.ok ? 'Aucun nom ne correspond. Vérifie l’orthographe, ou coche « Mon nom n’est pas dans la liste ».' : 'La liste des noms ne répond pas pour le moment. Réessaie dans un instant, ou coche « Mon nom n’est pas dans la liste ».'; return; }
            etatNom.textContent = res.length + ' nom(s) trouvé(s) : choisis le tien.';
            res.forEach(function (p) {
              var li = el('li', { role: 'option', tabindex: '-1', 'class': 'et-nom', texte: p.nom });
              var prendre = function () {
                choisi = { id: p.id, nom: p.nom };
                champ.value = p.nom;
                etatNom.textContent = '✓ Nom choisi dans la liste : ' + p.nom;
                fermer(); valide(); engage.focus();
              };
              li.addEventListener('click', prendre);
              li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); prendre(); } });
              liste.appendChild(li);
            });
            liste.hidden = false;
            champ.setAttribute('aria-expanded', 'true');
          })
          .catch(function () { if (derniere === v) etatNom.textContent = 'La liste des noms est injoignable (pas de réseau ?). Réessaie plus tard, ou coche « Mon nom n’est pas dans la liste ».'; });
      }
      hors.addEventListener('change', function () {
        if (hors.checked) { choisi = null; fermer(); etatNom.textContent = 'Écris ton prénom et ton nom au complet.'; champ.placeholder = 'Prénom et nom'; }
        else { etatNom.textContent = ''; champ.placeholder = 'Tape les premières lettres de ton nom'; }
        valide();
      });
      engage.addEventListener('change', valide);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!valide()) { message.textContent = choisi || hors.checked ? 'Coche la case « J’atteste avoir lu cette page… ».' : 'Choisis ton nom dans la liste (ou coche « Mon nom n’est pas dans la liste »).'; return; }
        bouton.disabled = true;
        message.textContent = 'Envoi en cours…';
        var nom = champ.value.trim().replace(/\s+/g, ' ');
        var lien = location.href.split('#')[0].split('?')[0];
        var contenu = {
          nom: nom, employeId: choisi ? choisi.id : '', nomHorsListe: !choisi,
          page: titre, adresse: 'travailleurs/' + slug + '.html', lien: lien, section: section,
          score: res.score, pourcentage: res.pourcentage, essais: res.essais,
          tempsLecture: duree(res.temps.lecture), secondesLecture: Math.round(res.temps.lecture), lectureEstimee: '≈ ' + minutes + ' min',
          tempsQuestions: questions.length ? duree(res.temps.questions) : '', secondesQuestions: questions.length ? Math.round(res.temps.questions) : null,
          developpement: res.developpement, detail: res.detail, revision: revision,
        };
        var cert = {
          nom: nom, date: jour(), titre: titre, section: section, revision: revision,
          lecture: contenu.tempsLecture, estimee: contenu.lectureEstimee, questions: contenu.tempsQuestions,
          score: res.score, essais: res.essais, nbCourts: res.nbCourts, numero: '', horsListe: !choisi,
        };
        etat.certificat = cert; etat.enAttente = true; delete etat.refus; sauverEtat();
        envoyer(contenu).then(function (r) {
          if (r.ok) {
            cert.numero = r.id; etat.atteste = true; etat.enAttente = false; sauverEtat();
            montrerCertificat(cert);
          } else if (r.definitif) {
            etat.enAttente = false; delete etat.certificat; sauverEtat();
            bouton.disabled = false;
            message.textContent = 'L’attestation a été refusée (' + r.erreur + '). Avertis ton conseiller en santé et sécurité.';
          } else {
            mettreEnFile(contenu);
            montrerCertificat(cert);
          }
          montrerBandeau();
        });
      });
      zoneAtt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function montrerCertificat(c) {
      zoneAtt.hidden = false;
      zoneAtt.innerHTML = '';
      var lignes = [['Date', c.date], ['Temps de lecture de la page', c.lecture], ['Lecture estimée', c.estimee],
        c.questions ? ['Temps sur les questions', c.questions] : null, c.score ? ['Résultat aux questions', c.score] : null,
        c.essais ? ['Essais', String(c.essais)] : null, c.nbCourts ? ['Réponses écrites transmises', String(c.nbCourts)] : null,
        ['Section', c.section], c.revision ? ['Révision de la page', c.revision] : null,
        ['N° de confirmation', c.numero || 'en attente d’envoi']].filter(Boolean);
      var table = el('table', { 'class': 'et-cert-table' }, lignes.map(function (l) { return el('tr', {}, [el('th', { scope: 'row', texte: l[0] }), el('td', { texte: l[1] })]); }));
      var cert = el('div', { 'class': 'et-certificat', id: 'certificat' }, [
        el('p', { 'class': 'et-cert-sur', texte: 'WIKI SST — Mines · Wiki prévention' }),
        el('h2', { 'class': 'et-cert-titre', id: 'attestation-titre', texte: 'Attestation de lecture' }),
        el('p', { 'class': 'et-cert-texte', html: 'Je, <strong></strong>, atteste avoir lu la page « <em></em> » et avoir répondu moi-même aux questions de compréhension.' }),
        table,
        c.numero ? null : el('p', { 'class': 'et-cert-attente', texte: 'Cette attestation n’est pas encore transmise au registre. Elle repartira toute seule à ta prochaine visite avec du réseau.' }),
        c.horsListe ? el('p', { 'class': 'et-cert-note', texte: 'Nom écrit à la main : le service de santé et de sécurité le reliera à ton dossier.' }) : null,
      ].filter(Boolean));
      $('strong', cert).textContent = c.nom;
      $('em', cert).textContent = c.titre;
      zoneAtt.appendChild(cert);
      var imprimer = el('button', { type: 'button', 'class': 'et-bouton', texte: 'Imprimer ou enregistrer en PDF' });
      imprimer.addEventListener('click', function () {
        corps.classList.add('et-imprime-certificat');
        window.print();
        setTimeout(function () { corps.classList.remove('et-imprime-certificat'); }, 500);
      });
      var actions = el('div', { 'class': 'et-actions' }, [imprimer, el('a', { 'class': 'et-bouton et-bouton-second', href: 'parcours.html', texte: 'Mes lectures' })]);
      var suiv = $('.voisin-suiv');
      if (suiv) actions.appendChild(el('a', { 'class': 'et-bouton et-bouton-second', href: suiv.getAttribute('href'), texte: 'Page suivante →' }));
      zoneAtt.appendChild(actions);
      zoneAtt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.addEventListener('afterprint', function () { corps.classList.remove('et-imprime-certificat'); });

    construireQuestions();
  }

  rafraichirEtats();
  if (corps.classList.contains('et-lecture')) lecture();
  viderFile(rafraichirEtats);
  window.addEventListener('online', function () { viderFile(rafraichirEtats); });
})();
