// WIKI SST — Mines · recherche + navigation
(function () {
  var ROOT = window.ROOT || '';
  function vUrl(u) { return u + (u.indexOf('?') >= 0 ? '&' : '?') + 'v=' + (window.V || '0'); }
  var index = null;
  var loading = null;
  var mots = null, motsCles = null, motsCache = {}; // index plein texte (mot → pages)

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = Promise.all([
      fetch(vUrl(ROOT + 'assets/search-index.json')).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }),
      // l'index plein texte est un plus : sans lui, la recherche marche sur les titres
      fetch(vUrl(ROOT + 'assets/search-mots.json'))
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
    ]).then(function (d) {
      index = d[0];
      if (d[1] && d[1].m) { mots = d[1].m; motsCles = Object.keys(mots).sort(); }
      return index;
    }).catch(function (e) { loading = null; throw e; });
    return loading;
  }

  // ---------- plein texte ----------
  // Les listes sont delta-encodées en base 36 ; décodées à la demande et mises en cache.
  function idsDuMot(mot) {
    if (motsCache[mot]) return motsCache[mot];
    var s = mots[mot], set = new Set(), prev = 0;
    if (s) {
      var parts = s.split(',');
      for (var k = 0; k < parts.length; k++) { prev += parseInt(parts[k], 36); set.add(prev); }
    }
    return (motsCache[mot] = set);
  }
  // pages dont le texte contient le mot, ou un mot qui commence par lui (« silic » → silice, silicose)
  function idsPour(mot) {
    if (!mots) return null;
    var cle = 'p:' + mot;
    if (motsCache[cle]) return motsCache[cle];
    var res = new Set(idsDuMot(mot));
    if (mot.length >= 4) {
      var lo = 0, hi = motsCles.length;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (motsCles[mid] < mot) lo = mid + 1; else hi = mid; }
      for (var j = lo, n = 0; j < motsCles.length && n < 40 && motsCles[j].indexOf(mot) === 0; j++, n++) {
        if (motsCles[j] !== mot) idsDuMot(motsCles[j]).forEach(function (id) { res.add(id); });
      }
    }
    return (motsCache[cle] = res);
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
    // Accepte « art.51.1 », « article 51 . 1 » et la virgule décimale.
    var requete = nq.replace(/\b(?:art|article)\.?\s*(?=\d)/g, 'art ')
      .replace(/\d+(?:\s*[.,]\s*\d+)+/g, function (n) { return n.replace(/\s/g, '').replace(/,/g, '.'); });
    var words = tokenize(requete);
    if (!words.length) return { total: 0, items: [] };

    // Motif législatif : un numéro + un sigle de loi, dans n'importe quel ordre
    var numTok = null, loiTok = null;
    for (var w0 = 0; w0 < words.length; w0++) {
      if (/^\d+(\.\d+)*$/.test(words[w0])) { if (!numTok) numTok = words[w0]; }
      else if (SIGLES.test(words[w0]) && words[w0].length >= 3) { if (!loiTok) loiTok = words[w0]; }
    }
    // La référence doit être exacte : 51 ne désigne ni 51.1, ni le paragraphe 51-11.
    var refLoi = numTok && loiTok ? { numero: numTok, loi: loiTok } : null;

    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var e = index[i];
      var nt = norm(e.t);
      var ng = norm((e.g || '') + ' ' + (e.b || ''));
      var nx = norm(e.x || '');
      var ktitre = ' ' + tokenize(nt).join(' ') + ' ';
      var kmots = ' ' + tokenize(ng).join(' ') + ' ';
      var score = 0, ok = true, premierePos = 9999, corps = false;

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
          else {
            // dernier recours : le mot est quelque part dans le texte de la page
            var ids = idsPour(m);
            if (ids && ids.has(i)) { score += 3 + bonus; trouve = true; corps = true; }
          }
        }
        if (!trouve) { ok = false; break; }
      }
      if (!ok) continue;

      // Un titre abrégé identique à la requête ne doit pas devancer le recueil.
      if (nt === nq) score += refLoi ? 40 : 500;
      var reference = nt.match(/^art(?:icle)?[\s.-]*(\d+(?:\s*[.,]\s*\d+)*)(?:\s*[-,:]\s*|\s+)([a-z]+)(?=$|[^a-z0-9])/);
      var numeroTitre = reference ? reference[1].replace(/\s/g, '').replace(/,/g, '.') : null;
      if (refLoi && reference && numeroTitre === refLoi.numero && reference[2] === refLoi.loi) {
        score += 400;
        // À référence identique, ouvrir d’abord le recueil législatif complet.
        if (/^w\/legislation\//.test(e.u)) score += 80;
      }
      // numéro sans sigle : privilégier l'article lui-même sur les articles qui le citent
      else if (numTok && nt.indexOf('art-' + numTok + '-') === 0) score += 150;
      // dépriorise les ébauches et les articles abrogés (champ ajouté par le générateur)
      if (e.q === 2) score = Math.round(score * 0.25);
      else if (e.q === 1) score = Math.round(score * 0.6);

      scored.push([score, e, premierePos, corps]);
    }
    scored.sort(function (a, b) { return b[0] - a[0] || a[2] - b[2] || a[1].t.localeCompare(b[1].t, 'fr'); });
    return {
      total: scored.length,
      items: scored.slice(0, limit || 8).map(function (s) {
        return s[3] ? Object.assign({}, s[1], { corps: true }) : s[1];
      }),
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
    var sel = -1, demande = 0;
    input.setAttribute('role', 'combobox');
    if (!input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
      input.setAttribute('aria-label', 'Rechercher dans le wiki');
    }
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', suggestId);
    input.setAttribute('aria-expanded', 'false');
    box.setAttribute('role', 'listbox');
    box.setAttribute('aria-label', 'Suggestions de recherche');
    var annonce = document.createElement('span');
    annonce.setAttribute('role', 'status');
    annonce.setAttribute('aria-live', 'polite');
    annonce.setAttribute('aria-atomic', 'true');
    annonce.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0';
    input.parentNode.appendChild(annonce);

    function close() {
      demande++;
      box.hidden = true;
      sel = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      annonce.textContent = '';
    }
    function message(html) {
      box.innerHTML = '<div class="s-msg" role="presentation">' + html + '</div>';
      box.hidden = false;
      sel = -1;
      input.setAttribute('aria-expanded', 'true');
      input.removeAttribute('aria-activedescendant');
      annonce.textContent = box.textContent;
    }

    function open(res, q) {
      if (!res.items.length) { message('Aucun résultat pour « ' + escHtml(q) + ' »'); return; }
      var html = res.items.map(function (e) {
        return '<a href="' + ROOT + e.u + '"><span class="s-title">' + e.i + ' ' + hl(e.t, q) +
          (pastille[e.q] || '') + '</span><span class="s-meta">' + ligneMeta(e) + '</span></a>';
      }).join('');
      html += '<a class="s-all" href="' + ROOT + 'recherche.html?q=' + encodeURIComponent(q) + '">' +
        'Voir les ' + res.total + ' résultat' + (res.total > 1 ? 's' : '') + ' pour « ' + escHtml(q) + ' »</a>';
      box.innerHTML = html;
      box.querySelectorAll('a').forEach(function (lien, i) {
        lien.id = suggestId + '-option-' + i;
        lien.setAttribute('role', 'option');
        lien.setAttribute('tabindex', '-1');
        lien.setAttribute('aria-selected', 'false');
      });
      box.hidden = false;
      sel = -1;
      input.setAttribute('aria-expanded', 'true');
      input.removeAttribute('aria-activedescendant');
      annonce.textContent = res.total + ' résultat' + (res.total > 1 ? 's' : '') +
        '. Utilisez les flèches pour parcourir les suggestions et Entrée pour ouvrir.';
    }

    input.addEventListener('input', function () {
      var q = input.value;
      var numeroDemande = ++demande;
      if (!q.trim()) { close(); return; }
      if (!index) message('<span class="s-loading"></span>Chargement de l\'index…');
      loadIndex().then(function () {
        if (input.value !== q || numeroDemande !== demande) return;
        open(search(q, 8), q);
      }).catch(function () {
        if (input.value !== q || numeroDemande !== demande) return;
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
      } else if (ev.key === 'Escape') { close(); ev.preventDefault(); }
      else if (ev.key === 'Tab') { close(); }
    });

    function mark(links) {
      for (var i = 0; i < links.length; i++) {
        links[i].classList.toggle('sel', i === sel);
        links[i].setAttribute('aria-selected', i === sel ? 'true' : 'false');
      }
      if (links[sel]) {
        input.setAttribute('aria-activedescendant', links[sel].id);
        links[sel].scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
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
          (e.corps ? '<span class="badge badge-corps">dans le texte</span>' : '') +
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
      try {
        var valeurs = JSON.parse(localStorage.getItem(cle) || '[]');
        return Array.isArray(valeurs) ? valeurs : [];
      } catch (e) { return []; }
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
      btn.setAttribute('aria-label', f ? 'Retirer des favoris' : 'Ajouter aux favoris');
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

    // Les cinq premières entrées restent compactes ; le bouton déplie toute la liste.
    function remplir(idListe, cle, avecEtoile, idVoir) {
      var ul = document.getElementById(idListe);
      if (!ul) return;
      var items = MEM.lire(cle), deplie = false;
      var ancien = document.getElementById(idVoir), bouton = null;
      if (ancien) ancien.hidden = true;
      if (!items.length) return;
      if (items.length > 5) {
        bouton = document.createElement('button');
        bouton.id = idVoir;
        bouton.type = 'button';
        bouton.className = ancien ? ancien.className : 'tb-voir';
        bouton.style.cssText = 'border:0;background:none;padding:.5rem 0;min-height:44px;cursor:pointer;font:inherit;font-size:.875rem;color:var(--p-bleu,var(--link));text-align:left';
        bouton.setAttribute('aria-controls', idListe);
        if (ancien && ancien.parentNode) ancien.parentNode.replaceChild(bouton, ancien);
        else ul.parentNode.insertBefore(bouton, ul.nextSibling);
        bouton.addEventListener('click', function () { deplie = !deplie; peindre(); });
      }
      function peindre() {
        var visibles = deplie ? items : items.slice(0, 5);
        ul.innerHTML = visibles.map(function (e) {
          var lien = '<a href="' + ROOT + e.u + '">' + escHtml(e.t) + (avecEtoile ? '' : '<span class="tb-quand">' + ilYA(e.d) + '</span>') + '</a>';
          return avecEtoile ? '<li><span class="tb-etoile">★</span>' + lien + '</li>' : '<li>' + lien + '</li>';
        }).join('');
        if (bouton) {
          bouton.setAttribute('aria-expanded', deplie ? 'true' : 'false');
          bouton.textContent = deplie
            ? (avecEtoile ? 'Réduire les favoris' : 'Réduire l’historique')
            : (avecEtoile ? 'Voir tous les favoris' : 'Voir tout l’historique') + ' (' + items.length + ')';
        }
      }
      peindre();
    }
    remplir('tbRecents', 'historique', false, 'tbVoirHist');
    remplir('tbFavoris', 'favoris', true, 'tbVoirFav');

    // en-tête : les deux boutons pointent vers les blocs correspondants
    var bf = document.getElementById('tbFav'), bh = document.getElementById('tbHist');
    if (bf) bf.addEventListener('click', function () { var e = document.getElementById('tbFavoris'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    if (bh) bh.addEventListener('click', function () { var e = document.getElementById('tbRecents'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); });

    // version et date réelles
    fetch(vUrl(ROOT + 'assets/version.json')).then(function (r) { return r.ok ? r.json() : null; }).then(function (v) {
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
      if (ev.defaultPrevented) return;
      // Entrée garde l’action native du contrôle qui a le focus (Passer, Précédent…).
      if (ev.key === 'Enter' && ev.target && ev.target.closest &&
          ev.target.closest('button, a[href], input, select, textarea, [contenteditable], [role="button"]')) return;
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
    if (document.querySelector('.portal-publics')) {
      return ['tour-portail', [
        { titre: 'Bienvenue dans le wiki SST', texte: 'Ce site réunit vos notes de cours en une encyclopédie consultable. Voici comment s’y retrouver en quelques secondes.' },
        { titre: 'Le fond documentaire', texte: 'Les pages sont classées par discipline : ergonomie, hygiène, toxicologie, sécurité, droit du travail, psychosocial, et le recueil des lois et règlements, article par article.', cible: '.portal-section + .portal-note + .portal-grid' },
        { titre: 'Par sujet ou par thème', texte: 'Les catégories traversent les disciplines : bruit, silice, espaces clos… Les thèmes rassemblent, à l’intérieur d’un même wiki, les articles d’un même sujet.', cible: '.portal-sujets' },
        { titre: 'L’espace de l’encadrement', texte: 'Gestion & prévention réunit obligations, programmes et outils pour les superviseurs, les gestionnaires et la direction.', cible: '.portal-publics' },
        { titre: 'Chercher partout à la fois', texte: 'La recherche lit le texte entier des pages, pas seulement les titres : un mot cité au détour d’un paragraphe se retrouve. Essayez « art 4 RSST », « silice » ou « boulonneur ».', cible: '.portal-search' },
      ]];
    }
    if (document.querySelector('.page-body')) {
      return ['tour-article', [
        { titre: 'Lire un article', texte: 'Voici les repères d’une page du wiki. Quelques repères, et vous êtes autonome.' },
        { titre: 'Lire à votre aise', texte: 'A− et A+ règlent la taille du texte, et « Lecture » ne garde que l’article : pratique sur un téléphone, sous terre. Le réglage vous suit d’une page à l’autre. « PDF » enregistre l’article, pour le garder ou le partager.', cible: '.lecture-outils' },
        { titre: 'L’essentiel, tout de suite', texte: 'Le résumé en tête donne la substance de l’article avant d’entrer dans le détail.', cible: '.chapo' },
        { titre: 'La fiche signalétique', texte: 'Loi, article, statut, date de révision : les repères de la page. Les mots-clés en bas sont cliquables et mènent à toutes les pages du même sujet.', cible: '.infobox' },
        { titre: 'Passer à la page voisine', texte: 'En bas de l’article, « Précédent » et « Suivant » enchaînent les pages du même dossier : les articles de loi se lisent ainsi dans l’ordre.', cible: '.voisins' },
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
    fetch(vUrl(ROOT + 'assets/version.json'))
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
  // Les images du texte gardent une taille standard (style.css) pour ne pas couper la lecture ;
  // toucher l'une d'elles l'ouvre agrandie par-dessus la page. Toucher l'image agrandie bascule
  // entre « ajustée à l'écran » et « taille réelle » (captures denses : on fait défiler) ; ✕,
  // Échap, un toucher à côté de l'image ou le bouton Retour du téléphone referment, et le focus
  // revient à l'image d'origine. Un clic modifié (Ctrl, ⌘, Maj) garde l'ouverture native.
  (function visionneuse() {
    var IMAGE = /\.(?:png|jpe?g|gif|svg|webp)(?:[?#]|$)/i;
    var ouverte = null;
    function surTouche(ev) {
      if (!ouverte) return;
      if (ev.key === 'Escape') { ev.preventDefault(); fermer(false); }
      // seul élément actif de la fenêtre : le focus ne repart pas dans la page cachée derrière
      else if (ev.key === 'Tab') { ev.preventDefault(); ouverte.bouton.focus(); }
    }
    function fermer(parRetour) {
      if (!ouverte) return;
      var o = ouverte;
      ouverte = null;
      o.v.remove();
      document.documentElement.classList.remove('visionneuse-ouverte');
      document.removeEventListener('keydown', surTouche, true);
      if (o.lien && o.lien.focus) o.lien.focus();
      // retire l'entrée d'historique posée à l'ouverture, sauf si c'est déjà le bouton Retour
      if (!parRetour && o.historique && history.state && history.state.visionneuse) history.back();
    }
    function ouvrir(lien, source) {
      var v = document.createElement('div');
      v.className = 'visionneuse';
      v.setAttribute('role', 'dialog');
      v.setAttribute('aria-modal', 'true');
      v.setAttribute('aria-label', 'Image agrandie' + (source && source.alt ? ' : ' + source.alt : ''));
      var bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'vis-fermer';
      bouton.setAttribute('aria-label', 'Fermer l’image agrandie');
      bouton.textContent = '✕';
      var img = document.createElement('img');
      img.src = lien.getAttribute('href');
      img.alt = source ? source.alt : '';
      // un schéma inversé en thème sombre le reste une fois agrandi
      var filtre = source && window.getComputedStyle ? window.getComputedStyle(source).filter : '';
      if (filtre && filtre !== 'none') img.style.filter = filtre;
      var aide = document.createElement('p');
      aide.className = 'vis-aide';
      aide.textContent = 'Toucher l’image : taille réelle ou ajustée à l’écran';
      v.appendChild(bouton);
      v.appendChild(img);
      v.appendChild(aide);
      v.addEventListener('click', function (ev) {
        if (ev.target !== img) { fermer(false); return; }
        var reelle = !v.classList.contains('vis-reelle');
        // « taille réelle » : au moins le double de l'image ajustée, même pour un schéma vectoriel
        img.style.width = reelle ? Math.max(img.naturalWidth || 0, img.getBoundingClientRect().width * 2) + 'px' : '';
        v.classList.toggle('vis-reelle', reelle);
      });
      document.addEventListener('keydown', surTouche, true);
      document.documentElement.classList.add('visionneuse-ouverte');
      document.body.appendChild(v);
      var historique = false;
      try { history.pushState({ visionneuse: true }, ''); historique = true; } catch (e) { /* navigation sans historique */ }
      ouverte = { v: v, lien: lien, bouton: bouton, historique: historique };
      bouton.focus();
    }
    window.addEventListener('popstate', function () { fermer(true); });
    document.addEventListener('click', function (ev) {
      if (ouverte || ev.defaultPrevented || ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      var a = ev.target.closest ? ev.target.closest('.page-img a') : null;
      if (!a || !IMAGE.test(a.getAttribute('href') || '')) return;
      ev.preventDefault();
      ouvrir(a, a.querySelector('img'));
    });
  })();

  // ---------- application installable (PWA) ----------
  (function pwa() {
    // service worker : tout le wiki (texte, puis images et PDF) se synchronise
    // tout seul, par tranches courtes pilotées d'ici — un service worker occupé
    // trop longtemps se fait tuer par le navigateur, jamais une tranche.
    // Reprend après interruption, retour du réseau ou mise à jour du site.
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) >= 0)) {
      var regOk = false;
      navigator.serviceWorker.register(ROOT + 'sw.js')
        .then(function () { regOk = true; })
        .catch(function () { /* le site marche sans lui */ });

      var sync = { quoi: null, depuis: 0, total: 0, gen: 0, signal: 0, echecs: 0 };
      var FINI = 'hl-fini-v2'; // ancienne complétude fondée sur la présence : ne pas la réutiliser
      var versionCible = String(window.V || '');
      var etatVerifie = false, attenteInitiale = true;
      var reprises = 0, minuterieReprise = null, dernierProbleme = '';
      var DELAIS_REPRISE = [5000, 15000, 45000];

      function dejaFini() {
        try { return etatVerifie && localStorage.getItem(FINI) === versionCible; } catch (e) { return false; }
      }
      function quotaPlein() {
        try { return sessionStorage.getItem('hl-quota') === '1'; } catch (e) { return false; }
      }
      function envoyer(msg) {
        navigator.serviceWorker.ready.then(function (reg) {
          if (reg.active) reg.active.postMessage(msg);
        });
      }
      function demarrer(quoi, depuis) {
        sync.gen++;
        sync.quoi = quoi; sync.depuis = depuis || 0; sync.total = 0; sync.signal = Date.now(); sync.echecs = 0;
        envoyer({ type: 'sync', quoi: quoi, depuis: sync.depuis, gen: sync.gen });
      }
      function lancerAuto() {
        if (navigator.onLine === false || sync.quoi || dejaFini() || quotaPlein()) return;
        demarrer('pages', 0);
      }

      function adopterVersion(d) {
        var candidate = String(d.version || '');
        // Les pages inchangées gardent leur ancien window.V dans le cache
        // différentiel. Le manifeste du SW courant définit la cible, à condition
        // de ne jamais reculer derrière la page affichée ou une cible déjà vue.
        // Le générateur utilise une estampille UTC YYYYMMDDhhmmss comparable.
        if (d.manifesteActuel === true && /^\d{14}$/.test(candidate) && candidate >= versionCible) {
          versionCible = candidate;
        }
      }
      function versionCourante(d) {
        return d.manifesteActuel === true && d.version === versionCible;
      }
      function pagesCompletes(d) {
        return versionCourante(d) && d.pages &&
          typeof d.pages.aJour === 'number' && d.pages.aJour === d.pages.total;
      }
      function invaliderFin() {
        etatVerifie = false;
        try { localStorage.removeItem(FINI); } catch (e) {}
      }
      function programmerReprise(message) {
        sync.quoi = null; sync.total = 0; sync.gen++;
        invaliderFin();
        dernierProbleme = message || 'Certains fichiers restent à actualiser.';
        clearTimeout(minuterieReprise);
        minuterieReprise = null;
        // Une passe a parcouru tout le manifeste, mais ses échecs peuvent être au
        // début : toujours repartir de zéro. Les hashes évitent les doublons.
        // Après trois reprises, attendre un geste ou le retour du réseau.
        if (reprises < DELAIS_REPRISE.length && navigator.onLine !== false && !quotaPlein()) {
          var delai = DELAIS_REPRISE[reprises++];
          minuterieReprise = setTimeout(function () {
            minuterieReprise = null;
            lancerAuto();
          }, delai);
        }
        majBouton();
        demanderEtat();
      }
      function revalider() {
        clearTimeout(minuterieReprise); minuterieReprise = null;
        reprises = 0; dernierProbleme = ''; attenteInitiale = true;
        invaliderFin();
        demanderEtat();
      }
      navigator.serviceWorker.ready.then(function () {
        // Même une version déjà marquée complète est recontrôlée : l'appareil
        // peut avoir évincé des fichiers depuis la consultation précédente.
        if ('requestIdleCallback' in window) requestIdleCallback(demanderEtat, { timeout: 4000 });
        else setTimeout(demanderEtat, 2500);
      });
      window.addEventListener('online', revalider);
      // nouveau service worker = site mis à jour : re-vérifier tout (delta par hash,
      // seuls les fichiers modifiés se retéléchargent)
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        sync.quoi = null; sync.gen++;
        setTimeout(revalider, 1500);
      });
      // chien de garde : si le service worker a été tué en pleine tranche, on renvoie la demande
      setInterval(function () {
        if (sync.quoi && Date.now() - sync.signal > 45000) {
          sync.signal = Date.now();
          envoyer({ type: 'sync', quoi: sync.quoi, depuis: sync.depuis, gen: sync.gen });
        }
      }, 15000);

      // panneau « Hors-ligne » : état du cache + progression
      var dlg = null;
      var minuterieEtat = null;
      function formatMo(o) { return Math.round(o / 1048576).toLocaleString('fr-CA') + ' Mo'; }
      var iosSansApp = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);

      function majBouton() {
        var b = document.getElementById('btnHorsLigne');
        if (!b) return;
        b.setAttribute('title', sync.quoi && sync.total
          ? 'Synchronisation hors ligne : ' + Math.round(sync.depuis / sync.total * 100) + ' %'
          : 'Consultation hors ligne');
      }
      function demanderEtat() { envoyer({ type: 'etat' }); }
      // Bouton « Télécharger » : le téléchargement se lance de lui-même à la première visite, mais
      // après trois reprises ratées, un manque d'espace ou une coupure, il attend un geste. Ce geste.
      function telecharger() {
        try { sessionStorage.removeItem('hl-quota'); } catch (e) {}
        clearTimeout(minuterieReprise); minuterieReprise = null;
        reprises = 0; dernierProbleme = ''; attenteInitiale = false;
        invaliderFin();
        if (!sync.quoi) { sync.gen++; lancerAuto(); }
        if (navigator.onLine === false) dernierProbleme = 'Pas de réseau : le téléchargement partira au retour du signal.';
        setTimeout(demanderEtat, 400);
      }

      function ouvrirPanneau() {
        if (dlg) dlg.remove();
        dlg = document.createElement('div');
        dlg.className = 'pwa-aide';
        dlg.innerHTML = '<div class="pwa-aide-boite" role="dialog" aria-label="Hors-ligne">' +
          '<h3>📶 Consultation hors ligne</h3>' +
          '<p id="hl-etat" role="status" aria-live="polite" aria-atomic="true">Interrogation du cache…</p>' +
          '<div class="hl-barre" id="hl-barre" hidden><div class="hl-barre-plein" id="hl-plein"></div></div>' +
          '<p id="hl-note" class="hl-note"></p>' +
          '<div class="hl-boutons">' +
          '<button class="tour-btn" data-fermer>Fermer</button>' +
          '<button class="tour-btn" id="hl-verifier" hidden>Vérifier maintenant</button>' +
          '<button class="tour-btn principal" id="hl-telecharger" hidden>⬇️ Télécharger tout le wiki</button>' +
          '</div></div>';
        dlg.addEventListener('click', function (ev) {
          if (ev.target === dlg || ev.target.hasAttribute('data-fermer')) { dlg.remove(); dlg = null; }
        });
        document.body.appendChild(dlg);
        demanderEtat();
        clearTimeout(minuterieEtat);
        minuterieEtat = setTimeout(function () {
          var etat = dlg && dlg.querySelector('#hl-etat');
          if (etat && etat.textContent.indexOf('Interrogation') === 0) {
            etat.textContent = regOk
              ? 'Le service hors ligne ne répond pas — recharge la page et réessaie.'
              : 'La consultation hors ligne n’est pas prise en charge par ce navigateur.';
          }
        }, 4000);
      }

      navigator.serviceWorker.addEventListener('message', function (ev) {
        var d = ev.data || {};
        // effets globaux d'abord : la synchronisation tourne panneau fermé
        // toute réponse est corrélée à la synchro courante par le jeton gen :
        // un message d'une synchro abandonnée (clic, redémarrage) est ignoré
        var actuel = d.gen === sync.gen && d.quoi === sync.quoi;
        if (d.type === 'tranche' && actuel) {
          sync.depuis = d.suivant; sync.total = d.total; sync.signal = Date.now();
          sync.echecs += d.rate || 0;
          majBouton();
          setTimeout(function () {
            if (sync.quoi === d.quoi && sync.gen === d.gen) {
              envoyer({ type: 'sync', quoi: sync.quoi, depuis: sync.depuis, gen: sync.gen });
            }
          }, 60);
        } else if (d.type === 'occupe' && actuel) {
          // une tranche d'une synchro précédente finit encore : réessayer sous peu
          sync.signal = Date.now();
          setTimeout(function () {
            if (sync.quoi === d.quoi && sync.gen === d.gen) {
              envoyer({ type: 'sync', quoi: sync.quoi, depuis: sync.depuis, gen: sync.gen });
            }
          }, 5000);
        } else if (d.type === 'sync-fin' && actuel) {
          sync.signal = Date.now();
          sync.echecs += d.rate || 0;
          if (d.complet !== true || d.version !== versionCible) {
            programmerReprise(sync.echecs
              ? 'Téléchargement incomplet : ' + sync.echecs + ' échec(s). Les anciennes copies sont conservées.'
              : 'La version actuelle n’est pas encore entièrement vérifiée. Les anciennes copies sont conservées.');
            return;
          }
          if (d.quoi === 'pages') {
            // le texte est vérifié : on enchaîne images et PDF, et on demande au
            // navigateur de protéger le stockage contre l'effacement automatique
            if (navigator.storage && navigator.storage.persist) {
              navigator.storage.persist().catch(function () {});
            }
            demarrer('medias', 0);
          } else {
            sync.quoi = null; sync.total = 0;
            majBouton();
            demanderEtat(); // l'état réel du cache décide si la version est complète
          }
        } else if (d.type === 'erreur-quota' && actuel) {
          sync.quoi = null; sync.total = 0; sync.gen++;
          clearTimeout(minuterieReprise); minuterieReprise = null;
          invaliderFin();
          try { sessionStorage.setItem('hl-quota', '1'); } catch (e) {}
          dernierProbleme = 'Espace de stockage insuffisant.';
          majBouton();
          demanderEtat();
        } else if (d.type === 'sync-erreur' && actuel) {
          programmerReprise('La mise à jour n’a pas abouti. Les copies déjà téléchargées restent disponibles.');
          return;
        } else if (d.type === 'etat' && d.pages && d.medias) {
          // Être disponible n'est pas être à jour : exiger le reçu de hash et
          // le manifeste correspondant à la page actuellement affichée.
          adopterVersion(d);
          var complet = pagesCompletes(d) && d.medias.en === d.medias.total;
          etatVerifie = true;
          if (!sync.quoi && complet) {
            try { localStorage.setItem(FINI, d.version); } catch (e) {}
            clearTimeout(minuterieReprise); minuterieReprise = null;
            dernierProbleme = ''; reprises = 0;
          } else if (!complet) {
            try { localStorage.removeItem(FINI); } catch (e) {}
          }
          if (attenteInitiale && !sync.quoi) {
            attenteInitiale = false;
            if (!complet) lancerAuto();
          }
        } else if (d.type === 'etat-indisponible' && attenteInitiale) {
          attenteInitiale = false;
          lancerAuto();
        }
        if (!dlg) return;
        var etat = dlg.querySelector('#hl-etat');
        var note = dlg.querySelector('#hl-note');
        var barre = dlg.querySelector('#hl-barre');
        var plein = dlg.querySelector('#hl-plein');
        var btnV = dlg.querySelector('#hl-verifier');
        var btnT = dlg.querySelector('#hl-telecharger');
        if (d.type === 'etat' && d.pages && d.medias) {
          var pOk = pagesCompletes(d);
          var mOk = d.medias.en === d.medias.total;
          var aJour = typeof d.pages.aJour === 'number' ? d.pages.aJour : 0;
          var anciens = Math.max(0, d.pages.en - aJour);
          etat.innerHTML = 'Texte du wiki : <strong>' + d.pages.en.toLocaleString('fr-CA') + ' / ' + d.pages.total.toLocaleString('fr-CA') + '</strong> fichiers disponibles (' + formatMo(d.pages.octets) + ')' +
            '<br><strong>' + aJour.toLocaleString('fr-CA') + ' / ' + d.pages.total.toLocaleString('fr-CA') + '</strong> ' +
            (versionCourante(d) ? 'à jour' : 'vérifiés selon un manifeste à revalider') + (pOk ? ' ✓' : '') +
            (anciens ? ' — ' + anciens.toLocaleString('fr-CA') + ' copie(s) ancienne(s) ou non vérifiée(s)' : '') +
            '<br>Images et PDF : <strong>' + d.medias.en.toLocaleString('fr-CA') + ' / ' + d.medias.total.toLocaleString('fr-CA') + '</strong> (' + formatMo(d.medias.octets) + ')' +
            (mOk ? ' ✓' : ' — reste ' + formatMo(d.medias.restant || 0));
          barre.hidden = !sync.quoi;
          if (quotaPlein()) {
            note.textContent = 'Espace de stockage insuffisant sur cet appareil : libère de l’espace puis touche « Télécharger ».';
          } else if (!versionCourante(d)) {
            note.textContent = 'La version actuelle ne peut pas encore être confirmée. Les copies présentes restent consultables ; retrouve du réseau puis vérifie à nouveau.';
          } else if (pOk && mOk) {
            note.textContent = 'Le texte du wiki est à jour. Les images et PDF du wiki sont disponibles sans réseau sur cet appareil. Les liens vers des sites externes nécessitent du réseau.';
          } else if (sync.quoi || (d.enCours && d.enCours.length)) {
            note.textContent = 'Téléchargement automatique en cours — tu peux fermer ce panneau, ça continue tout seul.';
          } else {
            note.textContent = (dernierProbleme ? dernierProbleme + ' ' : '') +
              (minuterieReprise !== null ? 'Une nouvelle tentative est prévue.' :
                'Touche « Télécharger » ou retrouve du réseau pour reprendre.');
          }
          if (iosSansApp) {
            note.textContent += ' Sur iPhone/iPad : installe d’abord l’app (Partager → Sur l’écran d’accueil) — le contenu téléchargé dans Safari ne suit pas dans l’app installée.';
          }
          btnV.hidden = (pOk && mOk && !quotaPlein()) || !!sync.quoi;
          btnV.onclick = function () {
            try { sessionStorage.removeItem('hl-quota'); } catch (e) {}
            clearTimeout(minuterieReprise); minuterieReprise = null;
            reprises = 0; dernierProbleme = ''; attenteInitiale = false;
            invaliderFin();
            btnV.disabled = true;
            sync.quoi = null; sync.gen++;
            lancerAuto();
            setTimeout(function () { btnV.disabled = false; demanderEtat(); }, 1500);
          };
          // ce qu'il reste à prendre : le texte si sa version n'est pas confirmée, puis les médias manquants
          var reste = (pOk ? 0 : (d.pages.octets || 0)) + (mOk ? 0 : (d.medias.restant || 0));
          btnT.hidden = pOk && mOk && !quotaPlein();
          btnT.disabled = !!sync.quoi;
          btnT.textContent = sync.quoi
            ? 'Téléchargement en cours…' + (sync.total ? ' ' + Math.round(sync.depuis / sync.total * 100) + ' %' : '')
            : '⬇️ Télécharger tout le wiki' + (reste ? ' (' + formatMo(reste) + ')' : '');
          btnT.onclick = function () { btnT.disabled = true; telecharger(); };
          if (navigator.storage && navigator.storage.persisted) {
            navigator.storage.persisted().then(function (p) {
              var bloc = dlg && dlg.querySelector('#hl-etat');
              if (bloc) bloc.innerHTML += '<br><small>' + (p ? 'Stockage protégé contre l’effacement automatique ✓' : 'Stockage non garanti — l’installation ne garantit pas sa conservation') + '</small>';
            }).catch(function () {});
          }
        } else if (d.type === 'tranche') {
          barre.hidden = false;
          plein.style.width = (sync.total ? Math.round(sync.depuis / sync.total * 100) : 0) + '%';
          btnT.hidden = false; btnT.disabled = true;
          btnT.textContent = 'Téléchargement en cours… ' + (sync.total ? Math.round(sync.depuis / sync.total * 100) : 0) + ' %';
          btnV.hidden = true;
          note.textContent = (d.quoi === 'medias' ? 'Images et PDF : ' : 'Texte : ') +
            sync.depuis.toLocaleString('fr-CA') + ' / ' + sync.total.toLocaleString('fr-CA') +
            ' — tu peux fermer ce panneau, ça continue tout seul.';
        } else if (d.type === 'etat-indisponible') {
          etat.textContent = 'État indisponible — le premier téléchargement n’a pas encore commencé.';
        }
      });

      // bouton 📶 dans l'en-tête, à côté du thème
      (function boutonHl() {
        var ancre = document.getElementById('btnTheme');
        if (!ancre || !ancre.parentNode) return;
        var b = document.createElement('button');
        b.id = 'btnHorsLigne';
        b.className = ancre.className;
        b.textContent = '📶';
        b.setAttribute('title', 'Télécharger pour consultation hors ligne');
        b.setAttribute('aria-label', 'Télécharger pour consultation hors ligne');
        b.addEventListener('click', ouvrirPanneau);
        ancre.parentNode.insertBefore(b, ancre);
      })();
      // liens « Télécharger hors ligne » de la barre latérale et du portail : un geste, et le
      // téléchargement part (s'il n'est pas déjà complet), le panneau montre l'avancement
      lierEntrees(function (ev) { ev.preventDefault(); telecharger(); ouvrirPanneau(); });
    } else {
      // navigateur sans service worker, ou site servi hors https : on le dit, sans mentir
      lierEntrees(function (ev) {
        ev.preventDefault();
        var v = document.createElement('div');
        v.className = 'pwa-aide';
        v.innerHTML = '<div class="pwa-aide-boite" role="dialog" aria-label="Hors-ligne"><h3>📶 Consultation hors ligne</h3>' +
          '<p>Ce navigateur ne prend pas en charge la consultation hors ligne. Sur la tablette ou le téléphone, ouvre le wiki dans Chrome, Edge ou Safari, puis touche « Télécharger hors ligne ».</p>' +
          '<button class="tour-btn principal" data-fermer>Compris</button></div>';
        v.addEventListener('click', function (e2) { if (e2.target === v || e2.target.hasAttribute('data-fermer')) v.remove(); });
        document.body.appendChild(v);
      });
    }
    function lierEntrees(action) {
      var ids = ['lienHorsLigne', 'lienHorsLigne2'];
      for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) el.addEventListener('click', action);
      }
    }

    // Dans l'application Android (sa signature est dans l'agent utilisateur), rien à installer :
    // ni bouton « Installer », ni lien vers l'APK.
    var dansApk = /WikiSSTMinesApp\//.test(navigator.userAgent);
    if (dansApk) {
      var liens = document.querySelectorAll('.lien-app');
      for (var la = 0; la < liens.length; la++) liens[la].hidden = true;
    }
    var enApp = dansApk || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
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
        '<p>Le wiki s’ouvrira ensuite comme une app. Sur iPhone/iPad, ouvre l’app installée au moins une fois avec du réseau : le contenu hors ligne se télécharge dans l’app, pas dans Safari.</p>' +
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

  // ---------- thème sombre (défaut), clair, automatique ----------
  // Le wiki s'affiche en sombre sans rien régler : il se lit sous terre et de nuit, et la
  // tablette de chantier arrive en clair d'usine. Deux autres états au bouton : « clair », et
  // « automatique » qui suit l'appareil. Le choix est retenu d'une page à l'autre.
  (function theme() {
    var btn = document.getElementById('btnTheme');
    if (!btn) return;
    var ETATS = [
      { cle: 'dark', icone: '🌙', libelle: 'Thème : sombre (par défaut)' },
      { cle: 'light', icone: '☀️', libelle: 'Thème : clair' },
      { cle: 'auto', icone: '🌗', libelle: 'Thème : automatique (suit votre appareil)' },
    ];

    function lire() {
      try { var v = localStorage.getItem('theme'); return (v === 'light' || v === 'auto') ? v : 'dark'; }
      catch (e) { return 'dark'; }
    }
    function ecrire(v) {
      try { if (v === 'dark') localStorage.removeItem('theme'); else localStorage.setItem('theme', v); }
      catch (e) { /* navigation privée : le thème vaut pour la page courante seulement */ }
    }
    function appliquer(v) {
      // « dark » ne pose rien : c'est l'état de la feuille de style sans attribut, donc celui
      // qu'obtient aussi un lecteur dont le stockage est bloqué.
      if (v === 'dark') document.documentElement.removeAttribute('data-theme');
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
    var mediaMenu = window.matchMedia('(max-width: 900px)');
    function etatMenu(ouvert, rendreFocus) {
      var mobile = mediaMenu.matches;
      var focusDansMenu = sidebar.contains(document.activeElement);
      ouvert = mobile && ouvert;
      sidebar.classList.toggle('open', ouvert);
      sidebar.inert = mobile && !ouvert;
      if (mobile && !ouvert) sidebar.setAttribute('aria-hidden', 'true');
      else sidebar.removeAttribute('aria-hidden');
      burger.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
      if (rendreFocus || (mobile && !ouvert && focusDansMenu)) burger.focus();
    }
    function synchroniserMenu() { etatMenu(sidebar.classList.contains('open'), false); }
    burger.setAttribute('aria-controls', 'sidebar');
    synchroniserMenu();
    burger.addEventListener('click', function () {
      var ouvrir = !sidebar.classList.contains('open');
      etatMenu(ouvrir, false);
      if (ouvrir && mediaMenu.matches) {
        var premier = sidebar.querySelector('a[href]');
        if (premier) premier.focus();
      }
    });
    sidebar.addEventListener('click', function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || (ev.button !== undefined && ev.button !== 0)) return;
      var lien = ev.target.closest ? ev.target.closest('a[href]') : null;
      if (lien && sidebar.contains(lien) && mediaMenu.matches) etatMenu(false, false);
      // L'action native du lien (et son historique) est conservée.
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && mediaMenu.matches && sidebar.classList.contains('open')) {
        etatMenu(false, true);
        ev.preventDefault();
      }
    });
    document.addEventListener('click', function (ev) {
      if (mediaMenu.matches && sidebar.classList.contains('open') && !sidebar.contains(ev.target) && !burger.contains(ev.target)) etatMenu(false, false);
    });
    if (mediaMenu.addEventListener) mediaMenu.addEventListener('change', synchroniserMenu);
    else window.addEventListener('resize', synchroniserMenu);
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
    btn.textContent = replie ? (btn.getAttribute('data-label-ferme') || '[afficher]') : (btn.getAttribute('data-label-ouvert') || '[masquer]');
    btn.setAttribute('aria-expanded', replie ? 'false' : 'true');
  }

  document.querySelectorAll('.toc').forEach(function (toc) {
    var btn = toc.querySelector('.toc-toggle');
    if (!btn) return;
    var nb = toc.querySelectorAll('li').length;
    var pref = prefTdm();
    // priorité au choix explicite du lecteur ; sinon repli auto sur petit écran si le sommaire est long
    var replie = pref !== null ? pref === '1' : (window.innerWidth <= 900 && (nb > SEUIL_REPLI || toc.getAttribute('data-mobile-replie') === 'true'));
    if (replie) appliquerEtat(toc, btn, true);
    btn.addEventListener('click', function () {
      var nouvelEtat = !toc.classList.contains('collapsed');
      appliquerEtat(toc, btn, nouvelEtat);
      prefTdm(nouvelEtat ? '1' : '0');
    });
  });

  // ---------- ancres accentuées : repli si le hash ne correspond à rien ----------
  function cibleAncre() {
    if (!location.hash || location.hash.length < 2) return null;
    var brut;
    try { brut = decodeURIComponent(location.hash.slice(1)); } catch (e) { return null; }
    var exacte = document.getElementById(brut);
    if (exacte) return exacte;
    var cible = norm(brut).replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    var titres = document.querySelectorAll('.page-body [id]');
    for (var i = 0; i < titres.length; i++) {
      if (titres[i].id === cible || norm(titres[i].id) === cible) return titres[i];
    }
    // dernier recours : comparer le texte visible des titres
    var hs = document.querySelectorAll('.page-body h1, .page-body h2, .page-body h3, .page-body h4');
    for (var j = 0; j < hs.length; j++) {
      if (norm(hs[j].textContent).trim() === norm(brut).trim()) return hs[j];
    }
    return null;
  }
  function ancreRepli() {
    var cible = cibleAncre();
    var exacte;
    try { exacte = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return; }
    if (cible && !exacte) cible.scrollIntoView({ block: 'start' });
  }
  window.addEventListener('hashchange', ancreRepli);

  // ---------- l'article en PDF ----------
  // « PDF » ouvre l'impression du navigateur, où « Enregistrer au format PDF » produit le fichier :
  // texte net et copiable, liens actifs, sans menus (feuille d'impression de style.css), avec la
  // source et la date en tête. Les images en chargement différé sont chargées d'abord : sinon,
  // elles manqueraient au PDF. L'application Android (vue intégrée) n'imprime pas d'elle-même :
  // une version qui le sait l'annonce par window.WikiSSTMinesApp.imprimer ; sinon, la page s'ouvre
  // dans le navigateur de l'appareil (en http, adresse que l'application confie au navigateur,
  // lequel passe aussitôt en https), où l'impression se lance à l'arrivée (?pdf=1).
  var PDF = (function () {
    if (!document.querySelector('.page-body') || !document.querySelector('.page-title')) return null;
    var dansApk = /WikiSSTMinesApp\//.test(navigator.userAgent);
    function pont() { var a = window.WikiSSTMinesApp; return a && typeof a.imprimer === 'function' ? a : null; }
    function adressePropre() {
      return location.href.split('#')[0].replace(/([?&])pdf=1(&|$)/, function (m, avant, apres) { return apres ? avant : ''; });
    }
    function dateDuJour() {
      try { return new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); }
      catch (e) { return new Date().toISOString().slice(0, 10); }
    }
    var source = null;
    function poserSource() {
      var cadre = document.querySelector('main.content') || document.querySelector('.page-body').parentNode;
      if (!source) {
        source = document.createElement('p');
        source.className = 'impression-source';
        cadre.insertBefore(source, cadre.firstChild);
      }
      source.textContent = 'WIKI SST Mines · ' + adressePropre() + ' · téléchargé le ' + dateDuJour();
    }
    function chargerImages(delai) {
      var attentes = [];
      var imgs = document.querySelectorAll('main img');
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        if (img.getAttribute('loading') === 'lazy') img.setAttribute('loading', 'eager');
        if (!img.complete) attentes.push(new Promise(function (ok) { img.addEventListener('load', ok); img.addEventListener('error', ok); }));
      }
      return Promise.race([Promise.all(attentes), new Promise(function (ok) { setTimeout(ok, delai); })]);
    }
    function ouvrirDansNavigateur() {
      if (navigator.onLine === false) { alert('Le PDF se fait dans le navigateur de l’appareil : il faut du réseau.'); return; }
      var u = adressePropre().replace(/^https:/, 'http:');
      location.href = u + (u.indexOf('?') >= 0 ? '&' : '?') + 'pdf=1';
    }
    function imprimer() {
      if (dansApk && !pont()) { ouvrirDansNavigateur(); return; }
      poserSource();
      chargerImages(5000).then(function () {
        var a = pont();
        if (a) a.imprimer(document.title); else window.print();
      });
    }
    // impression lancée par le menu du navigateur : la source et la date y sont aussi
    window.addEventListener('beforeprint', poserSource);
    if (/[?&]pdf=1(&|$)/.test(location.search)) {
      // arrivée depuis l'application : l'adresse perd ?pdf=1 (recharger ne relance pas l'impression)
      try { history.replaceState(history.state, '', adressePropre()); } catch (e) {}
      if (dansApk && !pont()) {
        alert('Pour le PDF, ouvrez cette page dans le navigateur de l’appareil (Chrome), puis touchez « PDF ».');
      } else {
        var lancer = function () { setTimeout(imprimer, 300); };
        if (document.readyState === 'complete') lancer(); else window.addEventListener('load', lancer);
      }
    }
    return { imprimer: imprimer };
  })();

  // ---------- confort de lecture : taille du texte, mode lecture ----------
  // Les réglages sont relus dans le <head> (SCRIPT_THEME) pour éviter tout saut de mise en page.
  (function outilsLecture() {
    var corps = document.querySelector('.page-body');
    var titre = document.querySelector('.page-title');
    if (!corps || !titre) return;
    var PALIERS = [0.85, 0.92, 1, 1.1, 1.2, 1.32, 1.45];
    function lireEchelle() {
      try { var v = parseFloat(localStorage.getItem('echelle')); return PALIERS.indexOf(v) >= 0 ? v : 1; } catch (e) { return 1; }
    }
    function poserEchelle(v) {
      document.documentElement.style.setProperty('--echelle', v);
      try { if (v === 1) localStorage.removeItem('echelle'); else localStorage.setItem('echelle', String(v)); } catch (e) {}
      etat();
    }
    var barre = document.createElement('div');
    barre.className = 'lecture-outils';
    barre.setAttribute('role', 'group');
    barre.setAttribute('aria-label', 'Confort de lecture');
    barre.innerHTML = '<button type="button" data-moins title="Texte plus petit" aria-label="Texte plus petit">A−</button>' +
      '<button type="button" data-plus title="Texte plus grand" aria-label="Texte plus grand">A+</button>' +
      '<button type="button" data-lecture title="Mode lecture : masque les menus" aria-pressed="false">📖 Lecture</button>' +
      (PDF ? '<button type="button" data-pdf title="Enregistrer l’article en PDF" aria-label="Télécharger l’article en PDF">📄 PDF</button>' : '');
    var ancre = document.querySelector('.page-sub') || titre;
    ancre.parentNode.insertBefore(barre, ancre.nextSibling);
    var bMoins = barre.querySelector('[data-moins]');
    var bPlus = barre.querySelector('[data-plus]');
    var bLect = barre.querySelector('[data-lecture]');
    function etat() {
      var i = PALIERS.indexOf(lireEchelle());
      bMoins.disabled = i <= 0;
      bPlus.disabled = i >= PALIERS.length - 1;
      var on = document.documentElement.getAttribute('data-lecture') === '1';
      bLect.setAttribute('aria-pressed', on ? 'true' : 'false');
      bLect.classList.toggle('actif', on);
    }
    bMoins.addEventListener('click', function () { var i = PALIERS.indexOf(lireEchelle()); if (i > 0) poserEchelle(PALIERS[i - 1]); });
    bPlus.addEventListener('click', function () { var i = PALIERS.indexOf(lireEchelle()); if (i < PALIERS.length - 1) poserEchelle(PALIERS[i + 1]); });
    var bPdf = barre.querySelector('[data-pdf]');
    if (bPdf) bPdf.addEventListener('click', function () { PDF.imprimer(); });
    bLect.addEventListener('click', function () {
      var on = document.documentElement.getAttribute('data-lecture') !== '1';
      if (on) document.documentElement.setAttribute('data-lecture', '1');
      else document.documentElement.removeAttribute('data-lecture');
      try { if (on) localStorage.setItem('lecture', '1'); else localStorage.removeItem('lecture'); } catch (e) {}
      etat();
    });
    etat();
  })();

  // ---------- hauteur d'en-tête et arrivée sur une section ----------
  (function navigationArticles() {
    var entete = document.querySelector('.site-header');
    if (!entete) return; // les portails tableaux de bord ont leur propre disposition
    var racine = document.documentElement, derniereHauteur = -1;
    var hashInitial = location.hash, interaction = false;
    // Lors d'un retour arrière/avant, laisser le navigateur restaurer la position.
    var performancePage = window.performance;
    var navigationPage = performancePage && performancePage.getEntriesByType ? performancePage.getEntriesByType('navigation')[0] : null;
    var retourHistorique = navigationPage ? navigationPage.type === 'back_forward' : !!(performancePage && performancePage.navigation && performancePage.navigation.type === 2);
    function mesurerEntete() {
      var hauteur = Math.max(0, Math.ceil(entete.getBoundingClientRect().height));
      if (!Number.isFinite(hauteur) || hauteur === derniereHauteur) return;
      racine.style.setProperty('--hh', hauteur + 'px');
      derniereHauteur = hauteur;
    }
    function alignerArrivee() {
      mesurerEntete();
      if (interaction || retourHistorique || !hashInitial || location.hash !== hashInitial) return;
      var cible = cibleAncre();
      if (cible) cible.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
    function interventionLecteur() { interaction = true; }
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (nom) {
      window.addEventListener(nom, interventionLecteur, { passive: true, once: true });
    });
    mesurerEntete();
    if (window.ResizeObserver) new window.ResizeObserver(mesurerEntete).observe(entete);
    window.addEventListener('resize', mesurerEntete);
    window.addEventListener('load', alignerArrivee, { once: true });
    window.addEventListener('pageshow', mesurerEntete);
    // Après les injections synchrones, notamment les commandes Lecture ci-dessus.
    if (window.requestAnimationFrame) window.requestAnimationFrame(alignerArrivee);
    else setTimeout(alignerArrivee, 0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignerArrivee).catch(function () {});
    document.querySelectorAll('.page-body a[href^="#ref-"]').forEach(function (lien) {
      var numero = lien.textContent.trim();
      if (/^\d+$/.test(numero) && !lien.hasAttribute('aria-label')) lien.setAttribute('aria-label', 'Consulter la référence ' + numero);
    });
  })();

  // ---------- bouton « haut de page » ----------
  if (document.querySelector('.page-body, .cat-pages, .search-results')) {
    var haut = document.createElement('button');
    haut.className = 'btn-haut';
    haut.setAttribute('aria-label', 'Remonter en haut de la page');
    haut.innerHTML = '↑';
    haut.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.body.appendChild(haut);
    var afficheHaut = function () { haut.classList.toggle('visible', window.scrollY > 400); };
    window.addEventListener('scroll', afficheHaut, { passive: true });
    afficheHaut();
  }

  // ---------- thèmes de l'accueil d'un wiki : volets repliables (13 sept. 2026) ----------
  // Rendus ouverts par le générateur (sans script, tout se lit). Sur téléphone on les referme,
  // sauf celui visé par l'ancre ; un raccourci de la barre ouvre son volet avant d'y descendre.
  (function themesAccueil() {
    var volets = document.querySelectorAll('details.accueil-theme');
    if (!volets.length) return;
    var vise = location.hash ? location.hash.slice(1) : '';
    if (window.innerWidth <= 900) {
      for (var i = 0; i < volets.length; i++) if (volets[i].id !== vise) volets[i].open = false;
    }
    var liens = document.querySelectorAll('.accueil-themes-nav a[href^="#theme-"]');
    for (var j = 0; j < liens.length; j++) {
      liens[j].addEventListener('click', function () {
        var d = document.getElementById(this.getAttribute('href').slice(1));
        if (d) d.open = true;
      });
    }
  })();

  // ---------- avis sur la page : pouce et commentaire (15 septembre 2026) ----------
  // Le générateur rend le bloc masqué : il n'apparaît que si assets/avis.json donne l'adresse d'un
  // relais. Changer de relais ne demande donc pas de reconstruire les 4 000 pages, et tant qu'il n'y
  // en a pas, personne ne voit un formulaire qui n'enverrait nulle part.
  // Le pouce part tout de suite (un avis sans commentaire compte) ; le commentaire envoyé ensuite
  // met à jour la même ligne, grâce à la clé « Réf » = lecteur + page. Hors ligne — sous terre, le
  // cas normal ici — l'avis attend dans localStorage et repart à la connexion suivante.
  (function avisPage() {
    var bloc = document.querySelector('.avis');
    var CLE_FILE = 'wiki-avis-file', CLE_LECTEUR = 'wiki-avis-lecteur';
    var DELAI = 15000;   // un portail captif accepte la connexion et ne répond jamais : on n'attend pas
    var relais = '';
    var idLecteur = '';
    // Un seul envoi à la fois, file comprise : deux tapes rapides sur un pouce partiraient en
    // parallèle, le relais ne trouverait la ligne ni pour l'une ni pour l'autre, et Airtable
    // garderait deux lignes. La chaîne ne se bloque jamais : chaque envoi est borné par DELAI.
    var chaine = Promise.resolve();

    function lire(cle) { try { return localStorage.getItem(cle) || ''; } catch (e) { return ''; } }
    function ecrire(cle, v) { try { localStorage.setItem(cle, v); return true; } catch (e) { return false; } }
    function lecteur() {
      // gardé en mémoire : sans localStorage (cookies bloqués, navigation privée), un tirage par
      // appel donnerait au commentaire une autre Réf que le pouce, donc deux lignes au lieu d'une
      if (idLecteur) return idLecteur;
      idLecteur = lire(CLE_LECTEUR);
      if (!idLecteur) { idLecteur = 'L' + Math.random().toString(36).slice(2, 10); ecrire(CLE_LECTEUR, idLecteur); }
      return idLecteur;
    }
    function file() { try { return JSON.parse(lire(CLE_FILE) || '[]'); } catch (e) { return []; } }
    function poserFile(f) { return ecrire(CLE_FILE, JSON.stringify(f.slice(-20))); }
    function retirer(a) {
      var f = file(), cle = JSON.stringify(a);
      for (var i = 0; i < f.length; i++) if (JSON.stringify(f[i]) === cle) { f.splice(i, 1); poserFile(f); return; }
    }

    // Un refus du relais (origine, forme, base qui refuse la valeur) ne se réparera pas tout seul :
    // l'avis est perdu, mais on ne le rejoue pas à chaque page en annonçant « pas de réseau » à
    // quelqu'un qui a le réseau. Une panne (502, 429, coupure, délai dépassé) se retente, elle.
    // Le relais dit lui-même ce qui est définitif (« definitif » dans sa réponse) ; le statut
    // HTTP ne sert que de repli quand le corps n'est pas lisible.
    function envoyer(avis) {
      if (!relais) return Promise.reject(new Error('sans relais'));
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var minuterie = null;
      var options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(avis) };
      if (ctrl) { options.signal = ctrl.signal; minuterie = setTimeout(function () { ctrl.abort(); }, DELAI); }
      var course = fetch(relais, options).then(function (r) {
        return r.json().then(null, function () { return {}; }).then(function (corps) {
          if (r.ok) return corps;
          var erreur = new Error('HTTP ' + r.status);
          erreur.definitif = (corps && corps.definitif === true) ||
            (r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429);
          throw erreur;
        });
      });
      if (!ctrl) {
        course = Promise.race([course, new Promise(function (_, rejeter) {
          minuterie = setTimeout(function () { rejeter(new Error('délai dépassé')); }, DELAI);
        })]);
      }
      return course.then(function (v) { clearTimeout(minuterie); return v; }, function (e) { clearTimeout(minuterie); throw e; });
    }
    // Chaque avis ne quitte la mémoire qu'une fois parti, ou définitivement refusé : si la page
    // meurt au milieu du renvoi (onglet fermé, tué par Android), ce qui restait est encore là.
    function viderFile() {
      if (!relais || !file().length) return;
      chaine = chaine.then(function () {
        var suite = Promise.resolve();
        file().forEach(function (a) {
          suite = suite.then(function () {
            return envoyer(a).then(function () { retirer(a); }, function (e) { if (e && e.definitif) retirer(a); });
          });
        });
        return suite;
      });
    }

    function brancher() {
      var pouces = bloc.querySelectorAll('.avis-pouce');
      var formulaire = bloc.querySelector('.avis-mot');
      var commentaire = bloc.querySelector('#avis-commentaire');
      var nom = bloc.querySelector('#avis-nom');
      var envoi = bloc.querySelector('.avis-envoyer');
      var etat = bloc.querySelector('.avis-etat');
      var choisi = '';

      function dire(texte, merci) {
        etat.textContent = texte;
        etat.className = 'avis-etat' + (merci ? ' avis-merci' : '');
      }
      function avisCourant() {
        return {
          ref: lecteur() + '·' + bloc.getAttribute('data-avis-adresse'),
          avis: choisi === 'haut' ? '👍 Utile' : '👎 À revoir',
          page: bloc.getAttribute('data-avis-titre'),
          adresse: bloc.getAttribute('data-avis-adresse'),
          wiki: bloc.getAttribute('data-avis-wiki'),
          lien: location.href.split('#')[0],
          commentaire: commentaire.value.trim(),
          nom: nom.value.trim(),
          source: 'wiki-sst-mines'
        };
      }
      function transmettre(merci) {
        var avis = avisCourant();
        dire('Envoi…');
        // Boîte d'envoi : l'avis est rangé en mémoire AVANT de partir, et n'en sort qu'une fois
        // parti ou refusé. Un onglet tué pendant l'envoi ne perd rien : il repartira à la visite
        // suivante. Puis à son tour dans la chaîne, qui continue quoi qu'il advienne de cet envoi.
        var garde = poserFile(file().concat([avis]));
        var envoiCourant = chaine.then(function () { return envoyer(avis); });
        chaine = envoiCourant.then(null, function () {});
        envoiCourant.then(function () { retirer(avis); dire(merci, true); }, function (e) {
          if (e && e.definitif) { retirer(avis); dire('Cet avis n’a pas pu être enregistré. Écrivez à l’équipe SST si cela se répète.'); return; }
          if (garde) dire('Pas de réseau : votre avis partira à la prochaine connexion.');
          else dire('Pas de réseau, et ce navigateur ne garde rien en mémoire : réessayez quand le signal revient.');
        }).then(function () { envoi.disabled = false; });
      }

      for (var i = 0; i < pouces.length; i++) {
        pouces[i].addEventListener('click', function () {
          choisi = this.getAttribute('data-avis');
          for (var j = 0; j < pouces.length; j++) pouces[j].setAttribute('aria-pressed', String(pouces[j] === this));
          formulaire.hidden = false;
          transmettre('Merci, c’est noté. Un mot pour expliquer ?');
        });
      }
      formulaire.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!choisi) return;
        // rendu au retour de l'envoi : une correction tapée ensuite doit pouvoir partir
        envoi.disabled = true;
        transmettre('Merci, votre commentaire est enregistré.');
      });
    }
    if (bloc) brancher();

    // Adresse du relais : un seul fichier à changer le jour où il bouge. Lu sur chaque page, bloc
    // ou non : une page d'index vide aussi la file d'attente laissée par une page précédente.
    // Le service worker garde ce fichier dans son noyau, donc l'avis fonctionne aussi hors ligne ;
    // « no-cache » fait revalider la copie HTTP (ETag), pour qu'une adresse changée à la main
    // sans reconstruction arrive sans attendre les dix minutes du cache de GitHub Pages.
    function chargerConf() {
      if (relais) { viderFile(); return; }
      fetch(vUrl(ROOT + 'assets/avis.json'), { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (conf) {
          // une adresse qui n'est pas https ne fera que des « pas de réseau » : on la tient pour absente
          if (!conf || typeof conf.url !== 'string' || !/^https:\/\//.test(conf.url)) return;
          relais = conf.url;
          if (bloc) bloc.hidden = false;
          viderFile();
        })
        .then(null, function () { /* première visite hors ligne : on retentera au retour du réseau */ });
    }
    // posé quoi qu'il arrive : si la configuration n'a pas pu être lue, le retour du réseau est
    // justement le moment de la relire et de vider la file
    window.addEventListener('online', chargerConf);
    chargerConf();
  })();
})();
