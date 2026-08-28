// WIKI SST — Mines · recherche + navigation
(function () {
  var ROOT = window.ROOT || '';
  var index = null;
  var loading = null;

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(ROOT + 'assets/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { index = d; return d; });
    return loading;
  }

  function norm(s) {
    return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  }

  function search(q, limit) {
    var nq = norm(q).trim();
    if (!nq) return [];
    var words = nq.split(/\s+/);
    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var e = index[i];
      var nt = norm(e.t), ng = norm(e.g || ''), nx = norm(e.x || '');
      var score = 0, ok = true;
      for (var w = 0; w < words.length; w++) {
        var word = words[w];
        if (nt.indexOf(word) >= 0) { score += nt.indexOf(word) === 0 ? 30 : 12; }
        else if (ng.indexOf(word) >= 0) { score += 6; }
        else if (nx.indexOf(word) >= 0) { score += 2; }
        else { ok = false; break; }
      }
      if (ok) { if (nt === nq) score += 100; scored.push([score, e]); }
    }
    scored.sort(function (a, b) { return b[0] - a[0] || a[1].t.length - b[1].t.length; });
    return scored.slice(0, limit || 8).map(function (s) { return s[1]; });
  }

  function hl(text, q) {
    var nt = norm(text), nq = norm(q).trim();
    var pos = nt.indexOf(nq);
    if (pos < 0 || !nq) return escHtml(text);
    return escHtml(text.slice(0, pos)) + '<b>' + escHtml(text.slice(pos, pos + nq.length)) + '</b>' + escHtml(text.slice(pos + nq.length));
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function wireSearch(inputId, suggestId) {
    var input = document.getElementById(inputId);
    var box = document.getElementById(suggestId);
    if (!input || !box) return;
    var sel = -1;
    function close() { box.hidden = true; sel = -1; }
    function open(results, q) {
      if (!results.length) { close(); return; }
      var html = results.map(function (e) {
        return '<a href="' + ROOT + e.u + '"><span class="s-title">' + e.i + ' ' + hl(e.t, q) + '</span><span class="s-meta">' + escHtml(e.w) + '</span></a>';
      }).join('');
      html += '<a class="s-all" href="' + ROOT + 'recherche.html?q=' + encodeURIComponent(q) + '">Voir tous les résultats pour « ' + escHtml(q) + ' »</a>';
      box.innerHTML = html;
      box.hidden = false;
      sel = -1;
    }
    input.addEventListener('input', function () {
      var q = input.value;
      if (!q.trim()) { close(); return; }
      loadIndex().then(function () { open(search(q, 8), q); });
    });
    input.addEventListener('keydown', function (ev) {
      var links = box.querySelectorAll('a');
      if (ev.key === 'ArrowDown' && !box.hidden) { sel = Math.min(sel + 1, links.length - 1); mark(links); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp' && !box.hidden) { sel = Math.max(sel - 1, 0); mark(links); ev.preventDefault(); }
      else if (ev.key === 'Enter') {
        if (sel >= 0 && links[sel]) { location.href = links[sel].href; }
        else if (input.value.trim()) { location.href = ROOT + 'recherche.html?q=' + encodeURIComponent(input.value.trim()); }
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

  // page de résultats
  var resultsBox = document.getElementById('search-results');
  if (resultsBox) {
    var q = new URLSearchParams(location.search).get('q') || '';
    var input = document.getElementById('q');
    if (input) input.value = q;
    var count = document.getElementById('search-count');
    if (q.trim()) {
      loadIndex().then(function () {
        var res = search(q, 250);
        count.textContent = res.length + ' résultat' + (res.length > 1 ? 's' : '') + ' pour « ' + q + ' »';
        resultsBox.innerHTML = res.map(function (e) {
          return '<div class="sr-item"><a class="sr-title" href="' + ROOT + e.u + '">' + e.i + ' ' + hl(e.t, q) + '</a>' +
            '<div class="sr-meta">' + escHtml(e.w) + '</div>' +
            (e.x ? '<div class="sr-x">' + hl(e.x, q) + '…</div>' : '') + '</div>';
        }).join('') || '<p>Aucun résultat. Essaie un autre terme.</p>';
      });
    } else {
      count.textContent = 'Tape un terme dans la barre de recherche ci-dessus.';
    }
  }

  // page au hasard
  function randomPage(ev) {
    ev.preventDefault();
    loadIndex().then(function () {
      var e = index[Math.floor(Math.random() * index.length)];
      location.href = ROOT + e.u;
    });
  }
  var r1 = document.getElementById('randomLink');
  var r2 = document.getElementById('randomLink2');
  if (r1) r1.addEventListener('click', randomPage);
  if (r2) r2.addEventListener('click', randomPage);

  // menu mobile
  var burger = document.getElementById('burger');
  var sidebar = document.getElementById('sidebar');
  if (burger && sidebar) {
    burger.addEventListener('click', function () { sidebar.classList.toggle('open'); });
  }

  // sommaire repliable
  document.querySelectorAll('.toc-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var toc = btn.closest('.toc');
      toc.classList.toggle('collapsed');
      btn.textContent = toc.classList.contains('collapsed') ? '[afficher]' : '[masquer]';
    });
  });
})();
