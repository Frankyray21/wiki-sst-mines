/* Amélioration progressive : aucun fetch, compte, traceur ou donnée de dossier. */
(() => {
  'use strict';
  function init(root) {
    if (root.hasAttribute('data-ci-ready')) return;
    const tabs = [...root.querySelectorAll('[data-ci-view]')];
    const panels = [...root.querySelectorAll('[data-ci-panel]')];
    const branches = [...root.querySelectorAll('[data-ci-branch-panel]')];
    const selectors = [...root.querySelectorAll('[data-ci-branch]')];
    const details = [...root.querySelectorAll('details')];
    const toolbar = root.querySelector('.ci-toolbar');
    const readingButton = root.querySelector('[data-ci-reading]');
    const status = root.querySelector('[data-ci-status]');
    if (tabs.length !== 3 || panels.length !== 3 || branches.length !== 3 || !toolbar || !readingButton) return;
    let view = 'comprendre';
    let volet = 'prevention';
    let reading = false;
    let printing = false;
    let readingSnapshot = null;
    let printSnapshot = null;
    const announce = text => { if (status) status.textContent = text; };
    const snapshot = () => details.map(d => d.open);
    const restore = state => details.forEach((d,i) => { d.open = !!state[i]; });
    function paint() {
      tabs.forEach(t => {
        const active = t.dataset.ciView === view;
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
      });
      panels.forEach(p => { p.hidden = !reading && !printing && p.dataset.ciPanel !== view; });
      branches.forEach(b => { b.hidden = !reading && !printing && b.dataset.ciBranchPanel !== volet; });
      selectors.forEach(s => s.setAttribute('aria-pressed', String(s.dataset.ciBranch === volet)));
      readingButton.setAttribute('aria-pressed', String(reading));
      readingButton.textContent = reading ? 'Revenir aux onglets' : 'Tout lire';
    }
    function stopReading() {
      if (!reading) return;
      reading = false;
      if (readingSnapshot) restore(readingSnapshot);
    }
    function selectView(name, focusTab = false) {
      if (!tabs.some(t => t.dataset.ciView === name)) return;
      stopReading(); view = name; paint();
      if (focusTab) tabs.find(t => t.dataset.ciView === name).focus();
    }
    function selectBranch(name) {
      if (!branches.some(b => b.dataset.ciBranchPanel === name)) return;
      volet = name; selectView('echanges');
    }
    function highlights(b) {
      const selected = b.querySelector('[data-ci-exchange][open]');
      const ids = selected?.dataset.ciActors.split(' ') || [];
      b.querySelectorAll('[data-ci-actor]').forEach(a => a.toggleAttribute('data-ci-highlight', ids.includes(a.dataset.ciActor)));
    }
    tabs[0].parentElement.setAttribute('role','tablist');
    tabs.forEach(t => {
      t.setAttribute('role','tab');
      t.setAttribute('aria-controls','ci-'+t.dataset.ciView);
    });
    panels.forEach(p => {
      p.setAttribute('role','tabpanel');
      p.setAttribute('aria-labelledby','ci-tab-'+p.dataset.ciPanel);
    });
    selectors.forEach(s => s.setAttribute('role','button'));
    root.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const t = event.target.closest('[data-ci-view]');
      if (t) { event.preventDefault(); selectView(t.dataset.ciView); return; }
      const s = event.target.closest('[data-ci-branch]');
      if (s) { event.preventDefault(); selectBranch(s.dataset.ciBranch); return; }
      const go = event.target.closest('[data-ci-explore]');
      if (go) {
        event.preventDefault(); selectBranch(go.dataset.ciExplore);
        const target = go.dataset.ciTarget ? document.getElementById('ci-'+go.dataset.ciTarget) : document.getElementById('ci-branch-title-'+volet);
        if (target && root.contains(target)) {
          if (target.tagName === 'DETAILS') target.open = true;
          const focus = target.querySelector('summary') || target;
          if (focus.tagName !== 'SUMMARY') focus.tabIndex = -1;
          focus.focus(); // Navigation explicite, contrairement à l’ouverture d’un échange.
        }
        return;
      }
      const law = event.target.closest('a[href="#ci-lois"]');
      if (law) root.querySelector('#ci-lois').open = true;
    });
    root.addEventListener('keydown', event => {
      const tab = event.target.closest('[data-ci-view]');
      if (tab && ['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) {
        event.preventDefault();
        const i = tabs.indexOf(tab);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (i+(event.key === 'ArrowRight' ? 1 : -1)+tabs.length)%tabs.length;
        selectView(tabs[index].dataset.ciView, true);
      } else if ((tab || event.target.closest('[data-ci-branch]')) && event.key === ' ') {
        event.preventDefault(); event.target.click();
      }
    });
    details.forEach(d => d.addEventListener('toggle', () => {
      if (reading || printing) return;
      const b = d.closest('[data-ci-branch-panel]');
      if (d.open && (d.matches('.ci-exchange,.ci-actor') || d.matches('.ci-case'))) {
        const scope = b || root.querySelector('.ci-cases');
        scope.querySelectorAll('details[open]').forEach(other => { if (other !== d && !other.contains(d) && !d.contains(other)) other.open = false; });
        const title = d.querySelector('.ci-exchange-title') || d.querySelector('summary');
        announce('Explication ouverte : '+title.textContent.trim().replace(/\s+/g,' '));
      }
      if (b) highlights(b);
    }));
    readingButton.addEventListener('click', () => {
      if (reading) stopReading();
      else { readingSnapshot = snapshot(); reading = true; details.forEach(d => { d.open = true; }); }
      paint(); announce(reading ? 'Mode lecture : tous les volets et toutes les explications sont ouverts.' : 'Consultation par onglets rétablie.');
    });
    root.querySelector('[data-ci-print]').addEventListener('click', () => {
      document.body.classList.add('ci-printing'); window.print();
    });
    window.addEventListener('beforeprint', () => {
      if (printing) return;
      printSnapshot = snapshot(); printing = true; details.forEach(d => { d.open = true; }); paint();
    });
    window.addEventListener('afterprint', () => {
      if (printSnapshot) restore(printSnapshot);
      printing = false; paint(); document.body.classList.remove('ci-printing');
    });
    function openHash() {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
      if (!id.startsWith('ci-')) return;
      const element = document.getElementById(id);
      if (!element || !root.contains(element)) return;
      const panel = element.closest('[data-ci-panel]');
      const b = element.closest('[data-ci-branch-panel]');
      if (panel) selectView(panel.dataset.ciPanel);
      if (b) selectBranch(b.dataset.ciBranchPanel);
      if (element.tagName === 'DETAILS') element.open = true;
    }
    details.forEach(d => { d.open = false; });
    toolbar.hidden = false;
    root.setAttribute('data-ci-ready','');
    paint(); openHash();
    window.addEventListener('hashchange',openHash);
  }
  function start() {
    document.querySelectorAll('[data-cnesst-module]').forEach(root => {
      try { init(root); }
      catch (error) {
        console.error('Module CNESST : lecture statique conservée.',error);
        root.querySelectorAll('[hidden]').forEach(e => { if (!e.matches('.ci-toolbar')) e.hidden = false; });
        root.querySelectorAll('details').forEach(d => { d.open = true; });
      }
    });
    // Uniquement sur la page indépendante, jamais un deuxième bouton dans l’article.
    const theme = document.querySelector('[data-ci-theme]');
    if (theme) {
      const label = () => { const t = document.documentElement.dataset.theme || 'dark'; theme.textContent = 'Thème : '+({light:'clair',dark:'sombre',auto:'appareil'}[t] || 'sombre'); };
      theme.hidden = false; label();
      theme.addEventListener('click', () => {
        const order = ['dark','light','auto'];
        const current = document.documentElement.dataset.theme || 'dark';
        const next = order[(order.indexOf(current)+1)%3];
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('theme',next); } catch (_) {}
        label();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
