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

  // ---------- historique et favoris (mémorisés sur l'appareil du lecteur) ----------
  var MEM = {
    lire: function (cle) {
      try { return JSON.parse(localStorage.getItem(cle) || '[]'); } catch (e) { return []; }
    },
    ecrire: function (cle, v) {
      try { localStorage.setItem(cle, JSON.stringify(v.slice(0, 40))); } catch (e) { /* espace saturé ou navigation privée */ }
    },
  };

  function urlCourante() {
    var u = location.pathname.split('/').pop() || 'index.html';
    var chemin = location.pathname;
    var i = chemin.indexOf('/wiki-sst-mines/');
    return i >= 0 ? chemin.slice(i + 16) : chemin.replace(/^\//, '');
  }

  // Toute page d'article s'inscrit dans l'historique en s'ouvrant.
  (function noterVisite() {
    var titre = document.querySelector('.page-title');
    if (!titre) return;
    var e = { u: urlCourante(), t: titre.textContent.trim(), d: Date.now() };
    var h = MEM.lire('historique').filter(function (x) { return x.u !== e.u; });
    h.unshift(e);
    MEM.ecrire('historique', h);
  })();

  function ilYA(ts) {
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 2) return 'à l’instant';
    if (m < 60) return 'il y a ' + m + ' min';
    var h = Math.floor(m / 60);
    if (h < 24) return 'il y a ' + h + ' h';
    var j = Math.floor(h / 24);
    if (j === 1) return 'hier';
    return 'il y a ' + j + ' jours';
  }

  // Bouton favori dans l'en-tête des articles
  (function boutonFavori() {
    var btn = document.getElementById('btnFav');
    var titre = document.querySelector('.page-title');
    if (!btn || !titre) return;
    var u = urlCourante(), t = titre.textContent.trim();
    function estFav() { return MEM.lire('favoris').some(function (x) { return x.u === u; }); }
    function peindre() {
      var f = estFav();
      btn.textContent = f ? '★' : '☆';
      btn.classList.toggle('actif', f);
      btn.setAttribute('title', f ? 'Retirer des favoris' : 'Ajouter aux favoris');
      btn.setAttribute('aria-pressed', f ? 'true' : 'false');
    }
    peindre();
    btn.addEventListener('click', function () {
      var f = MEM.lire('favoris');
      if (estFav()) f = f.filter(function (x) { return x.u !== u; });
      else f.unshift({ u: u, t: t, d: Date.now() });
      MEM.ecrire('favoris', f);
      peindre();
    });
  })();

  // ---------- portail en tableau de bord ----------
  (function tableauDeBord() {
    if (!document.body.classList.contains('tb')) return;

    // menu latéral sur petit écran
    var burger = document.getElementById('tbBurger'), side = document.getElementById('tbSide');
    if (burger && side) burger.addEventListener('click', function () { side.classList.toggle('ouvert'); });

    // bouton « Rechercher » et puces de recherches populaires
    function chercher(q) {
      if (q && q.trim()) location.href = ROOT + 'recherche.html?q=' + encodeURIComponent(q.trim());
    }
    var go = document.getElementById('tbGo'), champ = document.getElementById('q2');
    if (go && champ) go.addEventListener('click', function () { chercher(champ.value); });
    document.querySelectorAll('.tb-puce').forEach(function (p) {
      p.addEventListener('click', function () { chercher(p.getAttribute('data-q')); });
    });

    // listes « Récemment consulté » et « Favoris »
    function remplir(idListe, cle, avecEtoile) {
      var ul = document.getElementById(idListe);
      if (!ul) return 0;
      var items = MEM.lire(cle).slice(0, 5);
      if (!items.length) return 0;
      ul.innerHTML = items.map(function (e) {
        var lien = '<a href="' + ROOT + e.u + '">' + escHtml(e.t) + (avecEtoile ? '' : '<span class="tb-quand">' + ilYA(e.d) + '</span>') + '</a>';
        return avecEtoile ? '<li><span class="tb-etoile">★</span>' + lien + '</li>' : '<li>' + lien + '</li>';
      }).join('');
      return items.length;
    }
    if (remplir('tbRecents', 'historique', false)) {
      var vh = document.getElementById('tbVoirHist');
      if (vh) { vh.hidden = false; vh.setAttribute('href', ROOT + 'recherche.html'); }
    }
    remplir('tbFavoris', 'favoris', true);

    // en-tête : les deux boutons pointent vers les blocs correspondants
    var bf = document.getElementById('tbFav'), bh = document.getElementById('tbHist');
    if (bf) bf.addEventListener('click', function () { var e = document.getElementById('tbFavoris'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    if (bh) bh.addEventListener('click', function () { var e = document.getElementById('tbRecents'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); });

    // version et date réelles
    fetch(ROOT + 'assets/version.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (v) {
      if (!v) return;
      var maj = document.getElementById('tbMaj');
      if (maj && v.date) {
        var d = v.date.split('-');
        var mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        maj.textContent = (+d[2]) + ' ' + mois[+d[1] - 1] + ' ' + d[0];
      }
    }).catch(function () { /* la date écrite à la construction reste affichée */ });
  })();

  // ---------- aperçu des liens au survol, façon Obsidian ----------
  // Survoler un lien interne montre le titre, le domaine et le début de la page cible,
  // sans quitter la lecture. Désactivé au toucher (pas de survol sur téléphone).
  (function apercuLiens() {
    if (matchMedia('(hover: none)').matches) return;
    var zone = document.querySelector('.page-body');
    if (!zone) return;

    var bulle = null, minuterie = null, parUrl = null;

    function normaliser(href) {
      // ramène un href relatif à la clé du site : sans ../, sans préfixe t/ ou g/
      var u = href.split('#')[0].replace(/^(\.\.\/)+/, '');
      return u.replace(/^[tg]\//, '');
    }

    function construireCarte() {
      return loadIndex().then(function (idx) {
        if (!parUrl) {
          parUrl = new Map();
          for (var i = 0; i < idx.length; i++) parUrl.set(idx[i].u, idx[i]);
        }
      });
    }

    function montrer(a) {
      var href = a.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
      construireCarte().then(function () {
        var e = parUrl.get(normaliser(href));
        if (!e || !bulleDemandee) return;
        if (!bulle) {
          bulle = document.createElement('div');
          bulle.className = 'apercu-lien';
          document.body.appendChild(bulle);
        }
        bulle.innerHTML = '<div class="ap-titre">' + e.i + ' ' + escHtml(e.t) + '</div>' +
          '<div class="ap-meta">' + escHtml(e.w) + (e.c ? ' › ' + escHtml(e.c) : '') + '</div>' +
          (e.x ? '<div class="ap-texte">' + escHtml(e.x) + '…</div>' : '');
        var r = a.getBoundingClientRect();
        bulle.style.display = 'block';
        var lb = Math.min(380, innerWidth - 24);
        var gauche = Math.max(12, Math.min(r.left, innerWidth - lb - 12));
        var dessous = r.bottom + 10 + 150 < innerHeight;
        bulle.style.left = gauche + 'px';
        bulle.style.top = (dessous ? r.bottom + 8 : r.top - bulle.offsetHeight - 8) + 'px';
      }).catch(function () { /* index indisponible : pas d'aperçu, la navigation reste intacte */ });
    }

    var bulleDemandee = false;
    zone.addEventListener('mouseover', function (ev) {
      var a = ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a || !zone.contains(a)) return;
      bulleDemandee = true;
      clearTimeout(minuterie);
      minuterie = setTimeout(function () { montrer(a); }, 350);
    });
    zone.addEventListener('mouseout', function (ev) {
      var a = ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a) return;
      bulleDemandee = false;
      clearTimeout(minuterie);
      if (bulle) bulle.style.display = 'none';
    });
  })();

  // ---------- visite guidée ----------
  // Se déclenche une seule fois, à la première venue sur chaque type de page, et reste
  // relançable par le bouton « ? ». Les étapes s'adaptent à la page affichée ; celles dont
  // l'élément est absent sont ignorées, donc le tour ne montre jamais le vide.
  var TOUR = (function () {
    var CSS = '.tour-masque{position:fixed;inset:0;z-index:900;pointer-events:auto}' +
      '.tour-trou{position:absolute;border-radius:10px;box-shadow:0 0 0 9999px rgba(10,14,20,.72);transition:all .25s ease;pointer-events:none}' +
      '.tour-bulle{position:absolute;z-index:901;max-width:360px;background:var(--content-bg,#fff);color:var(--text,#202122);' +
      'border:1px solid var(--border-light,#c8ccd1);border-radius:12px;padding:18px 20px;box-shadow:0 10px 34px rgba(0,0,0,.35);' +
      'font-size:14.5px;line-height:1.55;font-family:inherit}' +
      '.tour-bulle h3{font-size:16.5px;font-weight:700;margin:0 0 7px}' +
      '.tour-bulle p{margin:0 0 14px}' +
      '.tour-pied{display:flex;align-items:center;gap:10px}' +
      '.tour-compte{font-size:12.5px;color:var(--text-soft,#54595d);margin-right:auto}' +
      '.tour-btn{border:1px solid var(--border-light,#c8ccd1);background:none;color:inherit;border-radius:8px;' +
      'padding:8px 15px;font-size:13.5px;cursor:pointer;font-family:inherit;min-height:38px}' +
      '.tour-btn:hover{background:var(--hover,#eaf3ff)}' +
      '.tour-btn.principal{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:600}' +
      '.tour-btn.principal:hover{background:#1d4ed8}' +
      '.tour-passer{background:none;border:0;color:var(--text-soft,#54595d);font-size:13px;cursor:pointer;text-decoration:underline;font-family:inherit}' +
      '@media(max-width:700px){.tour-bulle{left:12px!important;right:12px!important;max-width:none;width:auto}}' +
      '@media(prefers-reduced-motion:reduce){.tour-trou{transition:none}}';

    var etapes = [], i = 0, masque, trou, bulle, cleMemoire;

    function injecterCss() {
      if (document.getElementById('tourCss')) return;
      var s = document.createElement('style');
      s.id = 'tourCss';
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    function fermer(termine) {
      if (masque) masque.remove();
      if (bulle) bulle.remove();
      masque = bulle = trou = null;
      document.removeEventListener('keydown', auClavier);
      window.removeEventListener('resize', placer);
      if (termine && cleMemoire) { try { localStorage.setItem(cleMemoire, '1'); } catch (e) {} }
    }

    function auClavier(ev) {
      if (ev.key === 'Escape') { fermer(true); ev.preventDefault(); }
      else if (ev.key === 'ArrowRight' || ev.key === 'Enter') { aller(1); ev.preventDefault(); }
      else if (ev.key === 'ArrowLeft') { aller(-1); ev.preventDefault(); }
    }

    function placer() {
      if (!bulle) return;
      var e = etapes[i], cible = e.el;
      var marge = 8;
      if (cible) {
        var r = cible.getBoundingClientRect();
        trou.style.display = 'block';
        trou.style.left = (r.left - marge) + 'px';
        trou.style.top = (r.top - marge) + 'px';
        trou.style.width = (r.width + marge * 2) + 'px';
        trou.style.height = (r.height + marge * 2) + 'px';
        // la bulle se place sous la cible, ou au-dessus si le bas manque de place
        var hb = bulle.offsetHeight || 190, lb = Math.min(360, innerWidth - 24);
        var dessous = r.bottom + 14 + hb < innerHeight;
        bulle.style.top = (dessous ? r.bottom + 14 : Math.max(12, r.top - hb - 14)) + 'px';
        bulle.style.left = Math.max(12, Math.min(r.left, innerWidth - lb - 12)) + 'px';
        bulle.style.position = 'fixed';
      } else {
        // étape sans ancre : bulle centrée, aucun projecteur
        trou.style.display = 'none';
        bulle.style.position = 'fixed';
        bulle.style.top = Math.max(16, innerHeight / 2 - (bulle.offsetHeight || 190) / 2) + 'px';
        bulle.style.left = Math.max(12, innerWidth / 2 - Math.min(360, innerWidth - 24) / 2) + 'px';
      }
    }

    function peindre() {
      var e = etapes[i];
      var dernier = i === etapes.length - 1;
      bulle.innerHTML =
        '<h3>' + escHtml(e.titre) + '</h3><p>' + escHtml(e.texte) + '</p>' +
        '<div class="tour-pied">' +
        '<span class="tour-compte">Étape ' + (i + 1) + ' sur ' + etapes.length + '</span>' +
        (i > 0 ? '<button class="tour-btn" data-prec>Précédent</button>' : '<button class="tour-passer" data-fin>Passer</button>') +
        '<button class="tour-btn principal" data-suiv>' + (dernier ? 'Terminer' : 'Suivant') + '</button>' +
        '</div>';
      bulle.querySelector('[data-suiv]').addEventListener('click', function () { aller(1); });
      var p = bulle.querySelector('[data-prec]'); if (p) p.addEventListener('click', function () { aller(-1); });
      var f = bulle.querySelector('[data-fin]'); if (f) f.addEventListener('click', function () { fermer(true); });
      if (e.el) {
        var r = e.el.getBoundingClientRect();
        if (r.top < 60 || r.bottom > innerHeight - 60) e.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(placer, 320);
      }
      placer();
      bulle.querySelector('.principal').focus();
    }

    function aller(pas) {
      var n = i + pas;
      if (n < 0) return;
      if (n >= etapes.length) { fermer(true); return; }
      i = n;
      peindre();
    }

    function demarrer(liste, cle) {
      etapes = liste.map(function (e) {
        return { titre: e.titre, texte: e.texte, el: e.cible ? document.querySelector(e.cible) : null };
      }).filter(function (e) { return e.el || !e.ancre; });
      etapes = etapes.filter(function (e, n) { return e.el || n === 0 || n === liste.length - 1; });
      if (!etapes.length) return;
      cleMemoire = cle;
      injecterCss();
      i = 0;
      masque = document.createElement('div');
      masque.className = 'tour-masque';
      masque.addEventListener('click', function () { fermer(true); });
      trou = document.createElement('div');
      trou.className = 'tour-trou';
      masque.appendChild(trou);
      bulle = document.createElement('div');
      bulle.className = 'tour-bulle';
      bulle.setAttribute('role', 'dialog');
      bulle.setAttribute('aria-label', 'Visite guidée du wiki');
      bulle.addEventListener('click', function (ev) { ev.stopPropagation(); });
      document.body.appendChild(masque);
      document.body.appendChild(bulle);
      document.addEventListener('keydown', auClavier);
      window.addEventListener('resize', placer);
      peindre();
    }

    return { demarrer: demarrer };
  })();

  // Étapes selon la page affichée
  function etapesDeLaPage() {
    if (document.body.classList.contains('tb') && document.body.getAttribute('data-pub') === 't') {
      return ['tour-travailleurs', [
        { titre: 'Bienvenue', texte: 'Cet espace est écrit pour toi qui travailles à la mine. On y entre par ce qui t’arrive, pas par des termes techniques.' },
        { titre: 'Si ça ne va pas, c’est ici', texte: 'Ce bandeau reste en haut de l’accueil. Les numéros sont cliquables : un toucher et le téléphone compose.', cible: '.tb-urgence' },
        { titre: 'Cherche avec tes mots', texte: 'Un risque, un droit, un malaise — tape-le comme tu le dirais. Les puces reprennent les recherches les plus fréquentes.', cible: '.tb-recherche' },
        { titre: 'Trouve par ta situation', texte: '« J’ai mal quelque part », « Je ne dors plus », « Est-ce que j’ai le droit ? » : choisis la phrase qui te ressemble.', cible: '.tb-rub' },
        { titre: 'Tes droits, en toutes lettres', texte: 'Le refus de travail, le retrait préventif, la réclamation : ce que la loi te garantit, dans son texte officiel.', cible: '.tb-legal' },
        { titre: 'Tes pages te suivent', texte: 'Ce que tu ouvres s’inscrit dans « Récemment consulté », et l’étoile d’un article le garde dans tes favoris.', cible: '#tbRecents' },
        { titre: 'Tout est aussi rangé à gauche', texte: 'La barre latérale reprend les sujets et les domaines. Le bouton « ? » relance cette visite quand tu veux.', cible: '.tb-side' },
      ]];
    }
    if (document.body.classList.contains('tb')) {
      return ['tour-encadrement', [
        { titre: 'Bienvenue dans Gestion & prévention', texte: 'Cet espace réunit ce qu’un superviseur, un gestionnaire ou un dirigeant doit savoir. Voici comment vous y retrouver en quelques secondes.' },
        { titre: 'Chercher, même sans connaître le mot exact', texte: 'Tapez une obligation, une situation, ou un numéro d’article comme « art 51 RSST ». Les puces en dessous reprennent les recherches les plus fréquentes.', cible: '.tb-recherche' },
        { titre: 'Entrer par votre rôle', texte: 'Chaque rôle a son point de départ : responsabilités du superviseur, obligations du gestionnaire, gouvernance pour la direction.', cible: '.tb-grille' },
        { titre: 'Ou par ce qui vous arrive aujourd’hui', texte: 'Un accident, une visite d’inspecteur, un constat d’infraction, un travailleur blessé : chaque situation mène directement à la marche à suivre.', cible: '.tb-grille + .tb-section + .tb-grille' },
        { titre: 'Le cadre légal, article par article', texte: 'Les 3 818 articles de loi sont classés par loi et par numéro : LSST, LATMP, RSST, RSSM, CSTC.', cible: '.tb-legal' },
        { titre: 'Vos pages reviennent toutes seules', texte: 'Les articles que vous ouvrez s’inscrivent dans « Récemment consulté ». Pour garder une page sous la main, cliquez l’étoile dans son en-tête : elle rejoint vos favoris.', cible: '#tbRecents' },
        { titre: 'Tout est aussi rangé à gauche', texte: 'La barre latérale donne accès aux obligations, aux programmes, aux outils et aux domaines. Vous pouvez relancer cette visite à tout moment par le bouton « ? ».', cible: '.tb-side' },
      ]];
    }
    if (document.getElementById('tbRecents') === null && document.querySelector('.encart-urgence')) {
      return ['tour-travailleurs', [
        { titre: 'Bienvenue', texte: 'Ce wiki est écrit pour vous qui travaillez à la mine. On y entre par ce qui vous arrive, pas par des termes techniques.' },
        { titre: 'Si ça ne va pas, c’est ici', texte: 'Ce bandeau reste en haut de la page. Les numéros sont cliquables : un toucher et le téléphone compose.', cible: '.encart-urgence' },
        { titre: 'Trouvez par votre problème', texte: '« J’ai mal quelque part », « Je ne dors plus », « Est-ce que j’ai le droit ? » : choisissez la phrase qui vous ressemble.', cible: '.rubrique' },
        { titre: 'Vos droits, en toutes lettres', texte: 'Le refus de travail, le retrait préventif, la réclamation : ce que la loi vous garantit, dans son texte officiel.', cible: '.portal-grid' },
      ]];
    }
    if (document.querySelector('.portal-publics')) {
      return ['tour-portail', [
        { titre: 'Bienvenue dans le wiki SST', texte: 'Ce site réunit vos notes de cours en une encyclopédie consultable. Trois entrées, selon qui consulte.' },
        { titre: 'Deux espaces selon qui vous êtes', texte: 'L’espace travailleurs parle simplement des risques et des droits. Gestion & prévention traite des obligations et des programmes.', cible: '.portal-publics' },
        { titre: 'Le fond documentaire complet', texte: 'Les 4 500 pages classées par discipline, pour le conseiller SST et la recherche documentaire.', cible: '.portal-section + .portal-note + .portal-grid' },
        { titre: 'Chercher partout à la fois', texte: 'La recherche couvre tout le site, y compris les numéros d’articles de loi. Essayez « art 4 RSST » ou « silice ».', cible: '.portal-search' },
      ]];
    }
    if (document.querySelector('.page-body')) {
      return ['tour-article', [
        { titre: 'Lire un article', texte: 'Voici les repères d’une page du wiki. Trois choses à connaître, et vous êtes autonome.' },
        { titre: 'L’essentiel, tout de suite', texte: 'Le résumé en tête donne la substance de l’article avant d’entrer dans le détail.', cible: '.chapo' },
        { titre: 'La fiche signalétique', texte: 'Loi, article, statut, date de révision : les repères de la page. Les mots-clés en bas sont cliquables et mènent à toutes les pages du même sujet.', cible: '.infobox' },
        { titre: 'Garder cette page', texte: 'L’étoile ajoute la page à vos favoris, retrouvables depuis le portail. Le bouton à côté change le thème clair ou sombre.', cible: '#btnFav' },
      ]];
    }
    return null;
  }

  (function visiteGuidee() {
    var conf = etapesDeLaPage();
    if (!conf) return;
    var cle = conf[0], liste = conf[1];

    function lancer() { TOUR.demarrer(liste, cle); }

    // bouton « ? » permanent, pour relancer la visite quand on veut.
    // Les portails n'ont pas d'en-tête classique : on se cale alors sur le bouton de thème.
    var aide = document.createElement('button');
    aide.id = 'btnAide';
    aide.textContent = '?';
    aide.setAttribute('aria-label', 'Visite guidée de cette page');
    aide.setAttribute('title', 'Visite guidée de cette page');
    aide.addEventListener('click', lancer);

    var ancre = document.getElementById('btnTheme');
    var barre = document.querySelector('.site-header') || document.querySelector('.tb-head');
    if (ancre && ancre.parentNode) {
      aide.className = ancre.className;   // même habillage que son voisin
      ancre.parentNode.insertBefore(aide, ancre);
    } else if (barre) {
      aide.className = document.body.classList.contains('tb') ? 'tb-icone-btn' : 'btn-theme';
      barre.appendChild(aide);
    }

    // première visite : on lance de nous-mêmes, une seule fois
    var vu = null;
    try { vu = localStorage.getItem(cle); } catch (e) { vu = '1'; } // sans mémoire, on n'impose rien
    if (!vu && !location.search) setTimeout(lancer, 700);
  })();

  // ---------- date de dernière mise à jour ----------
  // Lue depuis un fichier unique : l'écrire dans chaque page ferait changer tout le site
  // à chaque reconstruction, même sans modification de contenu.
  (function version() {
    var el = document.getElementById('version');
    if (!el) return;
    fetch(ROOT + 'assets/version.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (v) {
        if (!v || !v.date) return;
        var d = v.date.split('-');
        el.textContent = ' · mis à jour le ' + d[2] + '/' + d[1] + '/' + d[0] +
          (v.pages ? ' · ' + v.pages.toLocaleString('fr-CA') + ' pages' : '');
      })
      .catch(function () { /* le pied de page reste simplement sans date */ });
  })();

  // ---------- visionneuse d'image sur place ----------
  // Cliquer une image l'agrandit par-dessus la page ; clic, ✕ ou Échap referme.
  (function visionneuse() {
    function ouvrir(src, alt) {
      var v = document.createElement('div');
      v.className = 'visionneuse';
      v.setAttribute('role', 'dialog');
      v.setAttribute('aria-label', 'Image agrandie');
      v.innerHTML = '<button class="vis-fermer" aria-label="Fermer">✕</button>';
      var img = document.createElement('img');
      img.src = src;
      img.alt = alt || '';
      v.appendChild(img);
      function fermer() { v.remove(); document.removeEventListener('keydown', surTouche); }
      function surTouche(ev) { if (ev.key === 'Escape') fermer(); }
      v.addEventListener('click', fermer);
      document.addEventListener('keydown', surTouche);
      document.body.appendChild(v);
    }
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest ? ev.target.closest('.page-img a') : null;
      if (!a) return;
      ev.preventDefault();
      var img = a.querySelector('img');
      ouvrir(a.getAttribute('href'), img ? img.alt : '');
    });
  })();

  // ---------- application installable (PWA) ----------
  (function pwa() {
    // service worker : les pages visitées restent lisibles sans réseau — utile sous terre
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register(ROOT + 'sw.js').catch(function () { /* le site marche sans lui */ });
    }

    var enApp = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (enApp) return; // déjà installée : pas de bouton

    var promptInstall = null;

    function creerBouton() {
      if (document.getElementById('btnInstall')) return;
      var ancre = document.getElementById('btnTheme');
      if (!ancre || !ancre.parentNode) return;
      var b = document.createElement('button');
      b.id = 'btnInstall';
      b.className = ancre.className;
      b.textContent = '📲';
      b.setAttribute('title', 'Installer l’application');
      b.setAttribute('aria-label', 'Installer l’application');
      b.addEventListener('click', function () {
        if (promptInstall) {
          promptInstall.prompt();
          promptInstall.userChoice.then(function (c) {
            if (c && c.outcome === 'accepted') b.remove();
            promptInstall = null;
          });
          return;
        }
        aideInstallation();
      });
      ancre.parentNode.insertBefore(b, ancre);
    }

    // iPhone/iPad : pas d'invite native — on explique le geste
    function aideInstallation() {
      var v = document.createElement('div');
      v.className = 'pwa-aide';
      v.innerHTML = '<div class="pwa-aide-boite" role="dialog" aria-label="Installer l’application">' +
        '<h3>📲 Installer le Wiki SST</h3>' +
        '<p>Ouvre le menu <strong>Partager</strong> de ton navigateur (l’icône <strong>⎋</strong> ou <strong>⋮</strong>), ' +
        'puis choisis <strong>« Sur l’écran d’accueil »</strong> ou <strong>« Installer l’application »</strong>.</p>' +
        '<p>Le wiki s’ouvrira ensuite comme une app, et les pages déjà visitées resteront lisibles sans réseau.</p>' +
        '<button class="tour-btn principal" data-fermer>Compris</button></div>';
      v.addEventListener('click', function (ev) {
        if (ev.target === v || ev.target.hasAttribute('data-fermer')) v.remove();
      });
      document.body.appendChild(v);
    }

    window.addEventListener('beforeinstallprompt', function (ev) {
      ev.preventDefault();
      promptInstall = ev;
      creerBouton();
    });

    // Safari iOS ne déclenche jamais beforeinstallprompt : bouton d'aide direct
    var estIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (estIos) creerBouton();
  })();

  // ---------- thème clair / sombre ----------
  // Trois états : « auto » suit le réglage du téléphone ou de l'ordinateur, les deux autres
  // forcent un thème. Le choix est retenu d'une page à l'autre.
  (function theme() {
    var btn = document.getElementById('btnTheme');
    if (!btn) return;
    var ETATS = [
      { cle: 'auto', icone: '🌗', libelle: 'Thème : automatique (suit votre appareil)' },
      { cle: 'light', icone: '☀️', libelle: 'Thème : clair' },
      { cle: 'dark', icone: '🌙', libelle: 'Thème : sombre' },
    ];

    function lire() {
      try { var v = localStorage.getItem('theme'); return (v === 'dark' || v === 'light') ? v : 'auto'; }
      catch (e) { return 'auto'; }
    }
    function ecrire(v) {
      try { if (v === 'auto') localStorage.removeItem('theme'); else localStorage.setItem('theme', v); }
      catch (e) { /* navigation privée : le thème vaut pour la page courante seulement */ }
    }
    function appliquer(v) {
      if (v === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', v);
      var e = ETATS.filter(function (x) { return x.cle === v; })[0] || ETATS[0];
      btn.textContent = e.icone;
      btn.setAttribute('title', e.libelle + ' — cliquer pour changer');
      btn.setAttribute('aria-label', e.libelle + ' — cliquer pour changer');
    }

    appliquer(lire());
    btn.addEventListener('click', function () {
      var i = 0;
      for (var k = 0; k < ETATS.length; k++) if (ETATS[k].cle === lire()) i = k;
      var suivant = ETATS[(i + 1) % ETATS.length].cle;
      ecrire(suivant);
      appliquer(suivant);
    });
  })();

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
