/* App shell: hash router, navigation, theme, language, search, boot. */
(function () {
  const K = window.K24, { $, $$, esc, enc } = Object.assign({ enc: encodeURIComponent }, K);
  const NAV_FOR = { destination: 'passport', blog: 'blogs', '': 'home' };
  let first = true, token = 0;

  function parse() {
    const h = location.hash.replace(/^#\/?/, ''), parts = h.split('?'), seg = parts[0].split('/').filter(Boolean);
    return { name: seg[0] || 'home', params: seg.slice(1), q: new URLSearchParams(parts[1] || '') };
  }
  function meta(sel, attr, val) { const el = $(sel); if (el) el.setAttribute(attr, val); }
  function setMeta(v) {
    document.title = v.title; const base = K.SITE.baseUrl || (location.origin + location.pathname), url = base.replace(/#.*$/, '') + location.hash;
    meta('meta[name="description"]', 'content', v.desc || ''); meta('meta[property="og:title"]', 'content', v.title); meta('meta[property="og:description"]', 'content', v.desc || '');
    meta('meta[property="og:url"]', 'content', url); meta('meta[name="twitter:title"]', 'content', v.title);
    if (v.image) meta('meta[property="og:image"]', 'content', v.image);
  }
  function setActive(name) {
    const key = NAV_FOR[name] != null ? NAV_FOR[name] : name;
    $$('[data-route]').forEach((a) => { const on = a.dataset.route === key; if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  }

  K.render = async function () {
    const my = ++token, ctx = parse(), main = $('#main');
    if (!first && !K.reduced()) { main.classList.add('leaving'); await new Promise((r) => setTimeout(r, 130)); if (my !== token) return; }
    K.anim.cleanup(); K.map.destroy();
    let v; const fn = K.views[ctx.name];
    try { v = fn ? fn(ctx) : K.views.notfound(); }
    catch (e) { console.error(e); v = { title: 'Something went wrong — K_24 Karnataka Post Trails', desc: '', html: '<div class="wrap"><h1>Something went wrong</h1><p class="lede">This page hit an error. Reload and try again. If it keeps happening, your saved data may be damaged — restore a backup from the Passport page.</p></div>' }; }
    const root = document.createElement('div'); root.className = 'view'; root.innerHTML = v.html;
    main.replaceChildren(root); main.classList.remove('leaving');
    setMeta(v); setActive(ctx.name);
    if (!first || location.hash.indexOf('#/') === 0) window.scrollTo(0, 0);
    try { if (v.after) v.after(root); } catch (e) { console.error(e); }
    try { K.anim.run(root); } catch (e) { console.error(e); }
    $$('[data-i18n]', root).forEach((el) => { el.textContent = K.t(el.dataset.i18n); });
    if (!first) { const h = $('h1', root); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } const a = $('#route-announcer'); if (a) a.textContent = v.title; }
    if (first) { first = false; window.dispatchEvent(new Event('k24:appready')); }
    closeDrawer();
  };

  /* ---------- theme ---------- */
  function applyTheme(t) { document.documentElement.dataset.theme = t; meta('meta[name="theme-color"]', 'content', t === 'dark' ? '#0b1a14' : '#103D2F'); const b = $('#theme-btn'); if (b) b.setAttribute('aria-pressed', t === 'dark'); }
  function initTheme() { applyTheme(document.documentElement.dataset.theme || 'light'); $('#theme-btn').addEventListener('click', () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(t); try { localStorage.setItem('k24.theme', t); } catch (e) {} }); }

  /* ---------- drawer ---------- */
  let lastFocus = null;
  function openDrawer() { const d = $('#drawer'); lastFocus = document.activeElement; d.hidden = false; requestAnimationFrame(() => d.classList.add('open')); $('#menu-btn').setAttribute('aria-expanded', 'true'); document.body.classList.add('no-scroll'); const a = $('a', d); if (a) a.focus(); }
  function closeDrawer() { const d = $('#drawer'); if (!d || d.hidden) return; d.classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); document.body.classList.remove('no-scroll'); setTimeout(() => { d.hidden = true; }, 220); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function initDrawer() {
    $('#menu-btn').addEventListener('click', () => ($('#drawer').hidden ? openDrawer() : closeDrawer()));
    $('#drawer').addEventListener('click', (e) => { if (e.target.closest('a') || e.target.hasAttribute('data-drawer-close')) closeDrawer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
    window.matchMedia('(min-width: 1181px)').addEventListener && window.matchMedia('(min-width: 1181px)').addEventListener('change', (m) => { if (m.matches) closeDrawer(); });
  }

  /* ---------- search ---------- */
  function openSearch() {
    const S = K.store, d = K.dialog(`<div class="dlg-form search-dlg"><header><h2>Search</h2><button class="icon-btn" data-close aria-label="Close search" type="button">✕</button></header><label class="search big"><span class="sr">Search locations, posts and collection</span><input id="gs" type="search" placeholder="Search locations, PIN codes, posts…" autocomplete="off"></label><div id="gs-out" aria-live="polite"><p class="muted">Type to search your passport list, blog posts and collection.</p></div></div>`);
    const out = $('#gs-out', d), inp = $('#gs', d);
    inp.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase(); if (q.length < 2) { out.innerHTML = '<p class="muted">Keep typing…</p>'; return; }
      const has = (s) => String(s).toLowerCase().includes(q);
      const loc = S.list('passport').filter((l) => has([K.dn(l), l.passportDistrict, l.currentDistrict, l.postOffice, l.pin, '#' + l.serial].join(' '))).slice(0, 8);
      const posts = S.list('blogs').filter((b) => has(b.title + ' ' + b.excerpt)).slice(0, 5), items = S.list('collection').filter((c) => has(c.title + ' ' + c.location)).slice(0, 4);
      const li = (href, a, b) => `<li><a href="${href}">${esc(a)} <small class="muted">${esc(b)}</small></a></li>`;
      out.innerHTML = loc.length + posts.length + items.length ? [loc.length ? `<h3>Locations</h3><ul class="results">${loc.map((l) => li('#/destination/' + enc(l.id), '#' + l.serial + ' ' + K.dn(l), l.passportDistrict)).join('')}</ul>` : '', posts.length ? `<h3>Posts</h3><ul class="results">${posts.map((b) => li('#/blog/' + enc(b.id), b.title, b.category)).join('')}</ul>` : '', items.length ? `<h3>Collection</h3><ul class="results">${items.map((c) => li('#/collection', c.title, c.location)).join('')}</ul>` : ''].join('') : `<p class="muted">Nothing found for “${esc(inp.value.trim())}”.</p>`;
    });
    out.addEventListener('click', (e) => { if (e.target.closest('a')) d.close(); });
    inp.focus();
  }

  (K.mods = K.mods || {}).app = '2026.10.13b';
  function boot() {
    const bad = window.__k24Problems ? window.__k24Problems() : [];
    if (bad.length) { window.__k24Fatal([]); return; }
    try {
      K.store.load(); K.applyLang(); initTheme(); initDrawer();
      $('#search-btn').addEventListener('click', openSearch);
      $$('[data-lang-btn]').forEach((b) => b.addEventListener('click', () => { K.setLang(K.lang === 'kn' ? 'en' : 'kn'); K.render(); }));
      window.addEventListener('hashchange', () => K.render());
      document.addEventListener('keydown', (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { e.preventDefault(); openSearch(); } });
      if (!K.store.storageOk) { const n = document.createElement('div'); n.className = 'banner'; n.setAttribute('role', 'alert'); n.textContent = 'Your browser is blocking local storage, so changes won’t be saved after you close this tab. Export backups from the Passport page.'; document.body.insertBefore(n, document.body.firstChild); }
      $$('[data-year]').forEach((e) => { e.textContent = new Date().getFullYear(); });
      K.render();
    } catch (e) { console.error(e); window.__k24Fatal(['Startup error: ' + (e && e.message ? e.message : e)]); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
