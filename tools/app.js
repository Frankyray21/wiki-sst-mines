// WIKI SST — Mines · recherche + navigation
(function () {
  var ROOT = window.ROOT || '';
  var index = null;
  var loading = null;

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(ROOT + 'assets/search-index.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) { index = d; return d; })
      .catch(function (e) { loading = null; throw e; });
    return loading;
  }

  // ---------- normalisation ----------
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
      .normalize('NFKD').replace(/[̀-ͯ]/g, '');
  }

  // Découpe en mots : garde les points internes (art-51.4-LSST) mais retire les points finaux (« art. »)
  function tokenize(s) {
    return s.split(/[^a-z0-9.]+/)
      .map(function (w) { return w.replace(/^\.+|\.+$/g, ''); })
      .filter(Boolean);
  }

  var SIGLES = /^(lsst|latmp|lmrsst|lnt|rsst|rssm|cstc|csst|cnesst|reglement|loi|code)$/;

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---------- recherche ----------
  // Retourne { total: <nombre total de correspondances>, items: [<entrées>] }
  function search(q, limit) {
    var nq = norm(q).trim();
    if (!nq) return { total: 0, items: [] };
    var words = tokenize(nq);
    if (!words.length) return { total: 0, items: [] };

    // Motif législatif : un numéro + un sigle de loi, dans n'importe quel ordre
    var numTok = null, loiTok = null;
    for (var w0 = 0; w0 < words.length; w0++) {
      if (/^\d+(\.\d+)*$/.test(words[w0])) { if (!numTok) numTok = words[w0]; }
      else if (SIGLES.test(words[w0]) && words[w0].length >= 3) { if (!loiTok) loiTok = words[w0]; }
    }
    var prefixeLoi = (numTok && loiTok) ? 'art-' + numTok + '-' + loiTok + ',' : null;

    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var e = index[i];
      var nt = norm(e.t);
      var ng = norm((e.g || '') + ' ' + (e.b || ''));
      var nx = norm(e.x || '');
      var ktitre = ' ' + tokenize(nt).join(' ') + ' ';
      var kmots = ' ' + tokenize(ng).join(' ') + ' ';
      var score = 0, ok = true, premierePos = 9999;

      for (var w = 0; w < words.length; w++) {
        var mot = words[w];
        var variantes = [mot];
        // repli morphologique simple : bruits → bruit, travaux → travau…
        if (mot.length > 3 && /[sx]$/.test(mot)) variantes.push(mot.slice(0, -1));
        var trouve = false;
        for (var v = 0; v < variantes.length && !trouve; v++) {
          var m = variantes[v];
          var bonus = v === 0 ? 0 : -4; // légère pénalité pour la forme repliée
          if (ktitre.indexOf(' ' + m + ' ') >= 0) { score += 200 + bonus; trouve = true; }
          else if (nt.indexOf(m) >= 0) {
            var pos = nt.indexOf(m);
            score += (pos === 0 ? 30 : 12) + bonus;
            if (pos < premierePos) premierePos = pos;
            trouve = true;
          }
          else if (kmots.indexOf(' ' + m + ' ') >= 0) { score += 20 + bonus; trouve = true; }
          else if (ng.indexOf(m) >= 0) { score += 6 + bonus; trouve = true; }
          else if (nx.indexOf(m) >= 0) { score += 2 + bonus; trouve = true; }
        }
        if (!trouve) { ok = false; break; }
      }
      if (!ok) continue;

      if (nt === nq) score += 500;
      if (prefixeLoi && nt.indexOf(prefixeLoi) === 0) score += 400;
      // numéro sans sigle : privilégier l'article lui-même sur les articles qui le citent
      else if (numTok && nt.indexOf('art-' + numTok + '-') === 0) score += 150;
      // dépriorise les ébauches et les articles abrogés (champ ajouté par le générateur)
      if (e.q === 2) score = Math.round(score * 0.25);
      else if (e.q === 1) score = Math.round(score * 0.6);

      scored.push([score, e, premierePos]);
    }
    scored.sort(function (a, b) { return b[0] - a[0] || a[2] - b[2] || a[1].t.localeCompare(b[1].t, 'fr'); });
    return {
      total: scored.length,
      items: scored.slice(0, limit || 8).map(function (s) { return s[1]; }),
    };
  }

  // ---------- surlignage mot à mot ----------
  function hl(text, q) {
    text = String(text || '');
    var nt = norm(text);
    if (nt.length !== text.length) return escHtml(text); // garde-fou : offsets désalignés
    var mots = tokenize(norm(q).trim()).filter(function (m) { return m.length >= 3; });
    if (!mots.length) return escHtml(text);
    var spans = [];
    for (var i = 0; i < mots.length; i++) {
      var from = 0, p;
      while ((p = nt.indexOf(mots[i], from)) >= 0) {
        spans.push([p, p + mots[i].length]);
        from = p + mots[i].length;
        if (spans.length > 60) break;
      }
    }
    if (!spans.length) return escHtml(text);
    spans.sort(function (a, b) { return a[0] - b[0]; });
    var fusion = [spans[0]];
    for (var s = 1; s < spans.length; s++) {
      var last = fusion[fusion.length - 1];
      if (spans[s][0] <= last[1]) last[1] = Math.max(last[1], spans[s][1]);
      else fusion.push(spans[s]);
    }
    var out = '', cur = 0;
    for (var f = 0; f < fusion.length; f++) {
      out += escHtml(text.slice(cur, fusion[f][0])) + '<b>' + escHtml(text.slice(fusion[f][0], fusion[f][1])) + '</b>';
      cur = fusion[f][1];
    }
    return out + escHtml(text.slice(cur));
  }

  // ---------- suggestion « vouliez-vous dire » ----------
  function levenshtein(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur.slice();
    }
    return prev[b.length];
  }

  function suggestion(q) {
    var mots = tokenize(norm(q).trim());
    if (!mots.length || !index) return null;
    var cible = mots[mots.length - 1];
    if (cible.length < 4) return null;
    var best = null, bestD = 3;
    var vus = {};
    for (var i = 0; i < index.length; i++) {
      var toks = tokenize(norm(index[i].t));
      for (var t = 0; t < toks.length; t++) {
        var tok = toks[t];
        if (vus[tok] || tok.length < 4 || Math.abs(tok.length - cible.length) > 2) continue;
        vus[tok] = 1;
        var d = levenshtein(cible, tok);
        if (d > 0 && d < bestD) { bestD = d; best = tok; }
      }
    }
    return best;
  }

  var pastille = {
    2: '<span class="badge badge-stub">page à compléter</span>',
    1: '<span class="badge badge-abroge">article abrogé</span>',
  };

  function ligneMeta(e) {
    return escHtml(e.w) + (e.c ? ' <span class="s-path">› ' + escHtml(e.c) + '</span>' : '');
  }

  // ---------- barre de recherche + autocomplétion ----------
  function wireSearch(inputId, suggestId) {
    var input = document.getElementById(inputId);
    var box = document.getElementById(suggestId);
    if (!input || !box) return;
    var sel = -1;

    function close() { box.hidden = true; sel = -1; }
    function message(html) { box.innerHTML = '<div class="s-msg">' + html + '</div>'; box.hidden = false; }

    function open(res, q) {
      if (!res.items.length) { message('Aucun résultat pour « ' + escHtml(q) + ' »'); return; }
      var html = res.items.map(function (e) {
        return '<a href="' + ROOT + e.u + '"><span class="s-title">' + e.i + ' ' + hl(e.t, q) +
          (pastille[e.q] || '') + '</span><span class="s-meta">' + ligneMeta(e) + '</span></a>';
      }).join('');
      html += '<a class="s-all" href="' + ROOT + 'recherche.html?q=' + encodeURIComponent(q) + '">' +
        'Voir les ' + res.total + ' résultat' + (res.total > 1 ? 's' : '') + ' pour « ' + escHtml(q) + ' »</a>';
      box.innerHTML = html;
      box.hidden = false;
      sel = -1;
    }

    input.addEventListener('input', function () {
      var q = input.value;
      if (!q.trim()) { close(); return; }
      if (!index) message('<span class="s-loading"></span>Chargement de l\'index…');
      loadIndex().then(function () {
        if (input.value !== q) return; // la frappe a continué
        open(search(q, 8), q);
      }).catch(function () {
        message('Recherche indisponible (connexion). Réessaie.');
      });
    });

    input.addEventListener('keydown', function (ev) {
      var links = box.querySelectorAll('a');
      if (ev.key === 'ArrowDown' && !box.hidden) { sel = Math.min(sel + 1, links.length - 1); mark(links); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp' && !box.hidden) { sel = Math.max(sel - 1, 0); mark(links); ev.preventDefault(); }
      else if (ev.key === 'Enter') {
        if (sel >= 0 && links[sel]) location.href = links[sel].href;
        else if (input.value.trim()) location.href = ROOT + 'recherche.html?q=' + encodeURIComponent(input.value.trim());
        ev.preventDefault();
      } else if (ev.key === 'Escape') { close(); }
    });

    function mark(links) {
      for (var i = 0; i < links.length; i++) links[i].classList.toggle('sel', i === sel);
      if (links[sel]) links[sel].scrollIntoView({ block: 'nearest' });
    }

    document.addEventListener('click', function (ev) {
      if (!box.contains(ev.target) && ev.target !== input) close();
    });
  }

  wireSearch('q', 'suggest');
  wireSearch('q2', 'suggest2');

  // ---------- page de résultats ----------
  var resultsBox = document.getElementById('search-results');
  if (resultsBox) {
    var q = new URLSearchParams(location.search).get('q') || '';
    var champ = document.getElementById('q');
    if (champ) champ.value = q;
    var count = document.getElementById('search-count');
    var affiches = 50;
    var filtreWiki = null;
    var dernier = null;

    function rendre() {
      var res = search(q, 100000);
      dernier = res;
      var items = filtreWiki ? res.items.filter(function (e) { return e.w === filtreWiki; }) : res.items;
      var total = items.length;
      var tranche = items.slice(0, affiches);

      // compteur honnête
      count.textContent = total === 0 ? 'Aucun résultat pour « ' + q + ' »'
        : total + ' résultat' + (total > 1 ? 's' : '') + ' pour « ' + q + ' »' +
          (total > tranche.length ? ' — ' + tranche.length + ' premiers affichés' : '');

      // filtres par wiki (compteurs sur le total, pas sur la tranche)
      var parWiki = {};
      res.items.forEach(function (e) { parWiki[e.w] = (parWiki[e.w] || 0) + 1; });
      var noms = Object.keys(parWiki).sort(function (a, b) { return parWiki[b] - parWiki[a]; });
      var fbar = document.getElementById('search-filters');
      if (!fbar) {
        fbar = document.createElement('div');
        fbar.id = 'search-filters';
        fbar.className = 'search-filters';
        resultsBox.parentNode.insertBefore(fbar, resultsBox);
      }
      if (res.items.length && noms.length > 1) {
        fbar.innerHTML = '<button class="filtre' + (filtreWiki ? '' : ' actif') + '" data-w="">Tous (' + res.items.length + ')</button>' +
          noms.map(function (n) {
            var ic = (res.items.find(function (e) { return e.w === n; }) || {}).i || '';
            return '<button class="filtre' + (filtreWiki === n ? ' actif' : '') + '" data-w="' + escHtml(n) + '">' +
              ic + ' ' + escHtml(n) + ' (' + parWiki[n] + ')</button>';
          }).join('');
        fbar.hidden = false;
      } else { fbar.hidden = true; }

      // résultats
      if (!total) {
        var sug = suggestion(q);
        resultsBox.innerHTML = '<p>Aucun résultat.' +
          (sug ? ' Vouliez-vous dire : <a href="?q=' + encodeURIComponent(sug) + '"><b>' + escHtml(sug) + '</b></a> ?' : ' Essaie un autre terme.') + '</p>';
        return;
      }
      resultsBox.innerHTML = tranche.map(function (e) {
        return '<div class="sr-item"><a class="sr-title" href="' + ROOT + e.u + '">' + e.i + ' ' + hl(e.t, q) + '</a>' +
          (pastille[e.q] || '') +
          '<div class="sr-meta">' + ligneMeta(e) + '</div>' +
          (e.x ? '<div class="sr-x">' + hl(e.x, q) + '…</div>' : '') + '</div>';
      }).join('') +
        (total > tranche.length
          ? '<button id="plus" class="btn-plus">Afficher 50 résultats de plus (' + (total - tranche.length) + ' restants)</button>'
          : '');

      var plus = document.getElementById('plus');
      if (plus) plus.addEventListener('click', function () { affiches += 50; rendre(); });
    }

    document.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('.filtre') : null;
      if (!b) return;
      filtreWiki = b.getAttribute('data-w') || null;
      affiches = 50;
      rendre();
    });

    if (q.trim()) {
      count.innerHTML = '<span class="s-loading"></span>Chargement de l\'index de recherche…';
      loadIndex().then(rendre).catch(function () {
        count.textContent = 'Recherche indisponible (problème de connexion). Recharge la page pour réessayer.';
      });
    } else {
      count.textContent = 'Tape un terme dans la barre de recherche ci-dessus.';
    }
  }

  // ---------- page au hasard ----------
  function randomPage(ev) {
    ev.preventDefault();
    loadIndex().then(function () {
      location.href = ROOT + index[Math.floor(Math.random() * index.length)].u;
    }).catch(function () { /* silencieux */ });
  }
  var r1 = document.getElementById('randomLink');
  var r2 = document.getElementById('randomLink2');
  if (r1) r1.addEventListener('click', randomPage);
  if (r2) r2.addEventListener('click', randomPage);

  // ---------- menu mobile ----------
  var burger = document.getElementById('burger');
  var sidebar = document.getElementById('sidebar');
  if (burger && sidebar) {
    burger.addEventListener('click', function () {
      var ouvert = sidebar.classList.toggle('open');
      burger.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
  }

  // ---------- sommaire repliable ----------
  // Sur téléphone, un sommaire de 11 entrées occupe 561 px et repousse tout le contenu
  // sous la ligne de flottaison. Au-delà de 8 entrées on le replie d'entrée de jeu ;
  // le choix du lecteur est ensuite mémorisé pour toutes les pages.
  var SEUIL_REPLI = 8;

  function prefTdm(valeur) {
    try {
      if (valeur === undefined) return localStorage.getItem('tdm-repliee');
      localStorage.setItem('tdm-repliee', valeur);
    } catch (e) { /* navigation privée : on continue sans mémoire */ }
    return null;
  }

  function appliquerEtat(toc, btn, replie) {
    toc.classList.toggle('collapsed', replie);
    btn.textContent = replie ? '[afficher]' : '[masquer]';
    btn.setAttribute('aria-expanded', replie ? 'false' : 'true');
  }

  document.querySelectorAll('.toc').forEach(function (toc) {
    var btn = toc.querySelector('.toc-toggle');
    if (!btn) return;
    var nb = toc.querySelectorAll('li').length;
    var pref = prefTdm();
    // priorité au choix explicite du lecteur ; sinon repli auto sur petit écran si le sommaire est long
    var replie = pref !== null ? pref === '1' : (window.innerWidth <= 900 && nb > SEUIL_REPLI);
    if (replie) appliquerEtat(toc, btn, true);
    btn.addEventListener('click', function () {
      var nouvelEtat = !toc.classList.contains('collapsed');
      appliquerEtat(toc, btn, nouvelEtat);
      prefTdm(nouvelEtat ? '1' : '0');
    });
  });

  // ---------- ancres accentuées : repli si le hash ne correspond à rien ----------
  function ancreRepli() {
    if (!location.hash || location.hash.length < 2) return;
    var brut = decodeURIComponent(location.hash.slice(1));
    try { if (document.getElementById(brut)) return; } catch (e) { return; }
    var cible = norm(brut).replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    var titres = document.querySelectorAll('.page-body [id]');
    for (var i = 0; i < titres.length; i++) {
      if (titres[i].id === cible || norm(titres[i].id) === cible) {
        titres[i].scrollIntoView();
        return;
      }
    }
    // dernier recours : comparer le texte visible des titres
    var hs = document.querySelectorAll('.page-body h1, .page-body h2, .page-body h3, .page-body h4');
    for (var j = 0; j < hs.length; j++) {
      if (norm(hs[j].textContent).trim() === norm(brut).trim()) { hs[j].scrollIntoView(); return; }
    }
  }
  window.addEventListener('hashchange', ancreRepli);
  ancreRepli();

  // ---------- bouton « haut de page » ----------
  if (document.querySelector('.page-body, .cat-pages, .search-results')) {
    var haut = document.createElement('button');
    haut.className = 'btn-haut';
    haut.setAttribute('aria-label', 'Remonter en haut de la page');
    haut.innerHTML = '↑';
    haut.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.body.appendChild(haut);
    var afficheHaut = function () { haut.classList.toggle('visible', window.scrollY > 700); };
    window.addEventListener('scroll', afficheHaut, { passive: true });
    afficheHaut();
  }
})();
