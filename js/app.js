/* App shell: router, theme, language, owner button, start-up. */
(function () {
  const K = window.K24, { $, $$, esc } = K;
  let first = true, token = 0;
  const parse = () => { const h = location.hash.replace(/^#\/?/, '').split('?')[0], seg = h.split('/').filter(Boolean); return { name: seg[0] || 'home', params: seg.slice(1) }; };

  K.render = async function () {
    const my = ++token, ctx = parse(), main = $('#main');
    if (!first && !K.reduced()) { main.classList.add('leaving'); await new Promise((r) => setTimeout(r, 140)); if (my !== token) return; }
    K.leave(); let v;
    try { const fn = ctx.name === 'journey' && ctx.params[0] ? K.views.story : K.views[ctx.name]; v = fn ? fn(ctx) : K.views.notfound(); }
    catch (e) { console.error(e); v = { title: 'Error', html: `<div class="wrap page"><h1>Something went wrong</h1><p class="muted">${esc(e && e.message ? e.message : e)}</p><p><button class="btn gold" onclick="location.reload()">${esc(K.t('tryAgain'))}</button></p></div>` }; }
    const root = document.createElement('div'); root.className = 'view'; root.innerHTML = v.html; main.replaceChildren(root); main.classList.remove('leaving');
    document.title = v.title; const key = ctx.name === 'place' ? 'passport' : ctx.name; $$('[data-route]').forEach((a) => { if (a.dataset.route === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (K.loadFailed) root.insertAdjacentHTML('afterbegin', `<div class="banner" role="alert">${esc(K.t('loadFail'))} <button class="linkish" id="retry">${esc(K.t('tryAgain'))}</button></div>`);
    const rb = $('#retry', root); if (rb) rb.addEventListener('click', async () => { await K.load(); K.render(); });
    window.scrollTo(0, 0); try { if (v.after) v.after(root); } catch (e) { console.error(e); }
    $('#owner-pill').hidden = !K.isOwner();
    if (!first) { const h = $('h1', root); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    if (first) { first = false; window.dispatchEvent(new Event('k24:appready')); }
  };

  const applyTheme = (th) => { document.documentElement.dataset.theme = th; const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', th === 'dark' ? '#0a1a14' : '#103D2F'); const b = $('#theme-btn'); if (b) b.setAttribute('aria-pressed', th === 'dark'); };

  async function boot() {
    const bad = window.__k24Problems ? window.__k24Problems() : [];
    if (bad.length) { window.__k24Fatal([]); return; }
    try {
      K.setLang(K.lang); applyTheme(document.documentElement.dataset.theme || 'light');
      $('#theme-btn').addEventListener('click', () => { const th = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(th); try { localStorage.setItem('k24.theme', th); } catch (e) {} });
      $('#lang-btn').addEventListener('click', () => { K.setLang(K.lang === 'kn' ? 'en' : 'kn'); K.render(); });
      $('#owner-btn').addEventListener('click', () => K.ownerDialog()); $('#owner-pill').addEventListener('click', () => K.ownerDialog());
      window.addEventListener('hashchange', () => K.render());
      $('#year').textContent = new Date().getFullYear();
      await K.load(); K.render();
    } catch (e) { console.error(e); window.__k24Fatal(['Startup error: ' + (e && e.message ? e.message : e)]); }
  }
  (K.mods = K.mods || {}).app = '5.0';
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
