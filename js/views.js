/* Pages: Home, Passport, one post office, Journey, one story. */
(function () {
  const K = window.K24, { $, $$, esc, safeUrl, fmtDate, t } = Object.assign({ t: (k) => K.t(k) }, K), enc = encodeURIComponent;
  const V = (K.views = {}), TYPE = { HO: 'Head Office (HO)', SO: 'Sub Office (SO)', BO: 'Branch Office (BO)', GPO: 'General Post Office', MDG: 'MDG (as printed)', '': '—' };
  const dn = (p) => p.name + (p.code ? ' ' + p.code : '');
  const dist = (p) => K.DISTRICTS[p.d - 1];
  const find = (id) => K.PLACES.find((p) => p.id === id);
  K.dn = dn;
  const pad2 = (n) => String(n).padStart(2, '0');

  /* ---------- artwork (original vector, not photographs) ---------- */
  const tiers = (cx, by, s, fill) => { let o = ''; for (let i = 0; i < 7; i++) { const w = (150 - i * 18) * s, h = 34 * s; o += `<rect x="${cx - w / 2}" y="${by - (i + 1) * h}" width="${w}" height="${h - 5 * s}" fill="${fill}"/>`; } return o + `<rect x="${cx - 90 * s}" y="${by}" width="${180 * s}" height="${60 * s}" fill="${fill}"/>`; };
  const artFar = '<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14403a"/><stop offset=".5" stop-color="#c9784a"/><stop offset=".85" stop-color="#f1bd75"/><stop offset="1" stop-color="#f8dfa6"/></linearGradient></defs><rect width="400" height="500" fill="url(#sa)"/><circle cx="290" cy="270" r="46" fill="#fff4d2" opacity=".9"/><path d="M0 330L70 270 130 310 200 240 270 305 340 255 400 300V500H0Z" fill="#2c5b4b" opacity=".75"/></svg>';
  const artNear = '<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="#0d2a21">' + tiers(200, 400, .8, '#0d2a21') + '<path d="M0 410C100 380 200 430 400 395V500H0Z"/></g></svg>';
  const miniArt = (seed) => `<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="g${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6e6d9"/><stop offset="1" stop-color="#f7f1e3"/></linearGradient></defs><rect width="300" height="200" fill="url(#g${seed})"/><path d="M0 140L60 100 110 130 170 80 230 125 300 95V200H0Z" fill="#9fc2ae" opacity=".7"/><g fill="#103D2F" opacity=".85">${tiers(150, 150, .45, '#103D2F')}</g></svg>`;

  /* ---------- progress ring ---------- */
  const ring = (done, total) => { const pct = total ? Math.round((done / total) * 100) : 0; return `<div class="ring" style="--p:${pct}" role="img" aria-label="${done} / ${total}"><svg viewBox="0 0 120 120"><circle class="rb" cx="60" cy="60" r="52"/><circle class="rf" cx="60" cy="60" r="52" pathLength="100"/></svg><div class="rt"><strong data-count="${done}">0</strong><span>/ ${total}</span></div></div>`; };
  const countUp = (root) => $$('[data-count]', root).forEach((el) => { const to = +el.dataset.count; if (K.reduced() || !to) { el.textContent = to; return; } const t0 = performance.now(); (function tick(now) { const p = Math.min(1, (now - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1 && document.contains(el)) requestAnimationFrame(tick); })(t0); });
  const grow = (root) => requestAnimationFrame(() => setTimeout(() => $$('.ring,.bar', root).forEach((e) => e.classList.add('go')), 60));

  /* ---------- cards ---------- */
  const pcard = (p) => { const v = K.place(p.id).visited, ph = K.place(p.id).photos.stamp;
    return `<a class="pcard ${v ? 'is-visited' : ''}" href="#/place/${enc(p.id)}" aria-label="#${p.serial} ${esc(dn(p))} — ${esc(v ? t('visited') : t('notVisited'))}"><span class="pc-in perf"><span class="pc-no">${pad2(p.serial)}</span>
      ${v && ph ? `<img class="pc-img" src="${esc(safeUrl(K.img(ph)))}" alt="" loading="lazy">` : `<span class="pc-art">${miniArt(p.serial)}</span>`}
      <strong class="pc-name">${esc(dn(p))}</strong><small class="pc-meta">${esc(dist(p).name)} · ${esc(p.pin)}</small>
      <span class="pc-state">${v ? esc(t('visited')) : esc(t('notVisited'))}</span><span class="glare" aria-hidden="true"></span></span>${v ? `<span class="seal" aria-hidden="true">${esc(t('seal'))}</span>` : ''}</a>`; };
  const storyCard = (s) => { const c = s.photos[0]; return `<a class="scard" href="#/journey/${enc(s.id)}"><span class="s-cov">${c ? `<img src="${esc(safeUrl(K.img(c)))}" alt="" loading="lazy">` : miniArt('s' + s.id.length)}</span><span class="s-body"><small>${esc(fmtDate(s.date))}</small><strong>${esc(s.title)}</strong><span class="s-ex">${esc(s.text.slice(0, 140))}${s.text.length > 140 ? '…' : ''}</span></span><span class="glare" aria-hidden="true"></span></a>`; };
  const sortedStories = () => K.content.stories.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  /* ================= HOME ================= */
  V.home = () => {
    const done = K.visitedCount(), total = K.PLACES.length, stories = sortedStories().slice(0, 3);
    const latest = K.PLACES.filter((p) => K.place(p.id).visited).sort((a, b) => (K.place(b.id).visitDate || '').localeCompare(K.place(a.id).visitDate || '')).slice(0, 3);
    return { title: 'K_24 Karnataka Post Trails — ' + K.t('tagline'), html: `
      <section class="hero3d"><div class="aurora" aria-hidden="true"></div><div class="wrap hero-grid">
        <div class="hero-copy"><p class="eyebrow">${esc(t('eyebrow'))}</p><h1>${esc(t('tagline'))}</h1><p class="lede">${esc(t('lede'))}</p>
          <div class="btn-row"><a class="btn gold" href="#/passport">${esc(t('openPassport'))}</a><a class="btn ghost-l" href="#/journey">${esc(t('readJourney'))}</a></div>
          <div class="hero-stat">${ring(done, total)}<p><strong>${done}</strong> ${esc(done === 1 ? t('visitedOne') : t('visitedOf'))}<br><small>${esc(t('progressLabel'))}</small></p></div></div>
        <div class="stage" aria-hidden="true"><div class="rig"><div class="stamp3d">
            <div class="plate back2"></div><div class="plate back1"></div><div class="plate front perf"></div>
            <div class="layer l-far">${artFar}</div><div class="layer l-near">${artNear}</div>
            <div class="layer l-text"><b>KARNATAKA</b><i>POST TRAILS</i></div>
            <img class="layer l-emblem" src="assets/logo-emblem.png" alt="" width="120" height="120">
            <svg class="layer l-ring" viewBox="0 0 200 200"><defs><path id="pm" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1 -156 0"/></defs><g fill="none" stroke="#C83742" stroke-linecap="round"><circle class="draw" pathLength="1" cx="100" cy="100" r="92" stroke-width="3"/><circle class="draw d2" pathLength="1" cx="100" cy="100" r="66" stroke-width="1.5"/></g><text font-family="Georgia,serif" font-size="14" letter-spacing="3" fill="#C83742"><textPath href="#pm">KARNATAKA • POST TRAILS • EVERY POSTMARK •</textPath></text></svg></div>
          <div class="fl f1"><div class="mini perf"><span>${pad2(63)}</span></div></div><div class="fl f2"><div class="mini perf"><span>${pad2(1)}</span></div></div><div class="fl f3"><div class="mini perf"><span>${pad2(100)}</span></div></div></div></div></div></section>
      <div class="wrap block"><div class="bhead"><h2>${esc(t('latestVisits'))}</h2><a class="more" href="#/passport">${esc(t('viewAll'))} →</a></div>
        ${latest.length ? `<div class="grid pgrid3" id="home-cards">${latest.map(pcard).join('')}</div>` : `<p class="muted">${esc(t('nothingYet'))}</p>`}</div>
      <div class="wrap block"><div class="bhead"><h2>${esc(t('latestStories'))}</h2><a class="more" href="#/journey">${esc(t('viewAll'))} →</a></div>
        ${stories.length ? `<div class="grid sgrid" id="home-stories">${stories.map(storeCardSafe).join('')}</div>` : `<p class="muted">${esc(t('noStories'))}</p>`}</div>
      <div class="wrap block about"><p>${esc(t('about'))}</p></div>`,
      after(root) { countUp(root); grow(root); heroRig(root); $$('#home-cards,#home-stories', root).forEach((g) => K.tilt(g, '.pcard,.scard')); } };
  };
  function storeCardSafe(s) { return storyCard(s); }

  function heroRig(root) {
    const hero = $('.hero3d', root), rig = $('.rig', root); if (!hero || !rig) return;
    const onScroll = () => { const y = Math.max(0, Math.min(1, window.scrollY / 700)); hero.style.setProperty('--sy', y.toFixed(3)); };
    if (K.reduced()) { rig.style.setProperty('--ry', '-12deg'); rig.style.setProperty('--rx', '6deg'); return; }
    let tx = 0, ty = 0, cx = 0, cy = 0, active = false, vis = true, raf; const t0 = performance.now();
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis) { cancelAnimationFrame(raf); raf = requestAnimationFrame(step); } }); io.observe(hero);
    const move = (e) => { const r = hero.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 34; ty = -((e.clientY - r.top) / r.height - 0.5) * 22; active = true; };
    hero.addEventListener('pointermove', move); hero.addEventListener('pointerleave', () => { active = false; });
    window.addEventListener('scroll', onScroll, { passive: true });
    function step(now) { if (!vis || !document.contains(rig)) return; if (!active) { tx = -12 + Math.sin((now - t0) / 2600) * 12; ty = 5 + Math.cos((now - t0) / 3300) * 6; } cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07; rig.style.setProperty('--ry', cx.toFixed(2) + 'deg'); rig.style.setProperty('--rx', cy.toFixed(2) + 'deg'); raf = requestAnimationFrame(step); }
    raf = requestAnimationFrame(step); onScroll();
    K.onLeave(() => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('scroll', onScroll); });
  }

  /* ================= PASSPORT ================= */
  const F = { q: '', only: false, d: '' };
  V.passport = () => ({ title: t('passport') + ' — K_24 Karnataka Post Trails', html: `<div class="wrap page"><header class="phd"><div><p class="eyebrow dark">${esc(t('eyebrow'))}</p><h1>${esc(t('passport'))}</h1></div><div class="hero-stat sm">${ring(K.visitedCount(), K.PLACES.length)}</div></header>
      <details class="mapcard" open><summary><h2>${esc(t('mapTitle'))}</h2><span class="muted small">${esc(t('mapHint'))}</span></summary><div class="mapwrap"><div class="mapimg"><img src="assets/passport-map.jpg" alt="Map of Karnataka from the front page of my passport, with the 100 post offices numbered by district" width="1100" height="1542" loading="lazy">${K.DISTRICTS.map((d) => { const all = K.PLACES.filter((p) => p.d === d.order), vv = all.filter((p) => K.place(p.id).visited).length, sp = K.MAP_SPOTS[d.order]; return `<button type="button" class="hs ${vv ? 'on' : ''}" style="left:${sp[0]}%;top:${sp[1]}%" data-d="${d.order}" aria-label="${esc(d.name)} — ${vv} / ${all.length} ${esc(t('visited').toLowerCase())}"><span>${vv}/${all.length}</span></button>`; }).join('')}</div><p class="small muted">${esc(t('mapNote'))} <button class="linkish" type="button" data-fullmap>${esc(t('mapFull'))}</button></p></div></details>
      <div class="toolbar"><label class="search"><span class="sr">${esc(t('search'))}</span><input type="search" id="pq" placeholder="${esc(t('search'))}" value="${esc(F.q)}" autocomplete="off"></label>
        <label><span class="sr">${esc(t('jump'))}</span><select id="pd"><option value="">${esc(t('allDistricts'))}</option>${K.DISTRICTS.map((d) => `<option value="${d.order}" ${F.d === String(d.order) ? 'selected' : ''}>${pad2(d.order)} · ${esc(d.name)}</option>`).join('')}</select></label>
        <label class="switch"><input type="checkbox" id="po" ${F.only ? 'checked' : ''}><span>${esc(t('onlyVisited'))}</span></label><span class="count" id="pc" aria-live="polite"></span></div><div id="plist"></div></div>`,
    after(root) {
      countUp(root); grow(root);
      const draw = () => {
        const q = F.q.toLowerCase().trim(); let n = 0;
        const html = K.DISTRICTS.filter((d) => !F.d || String(d.order) === F.d).map((d) => {
          const rows = K.PLACES.filter((p) => p.d === d.order && (!F.only || K.place(p.id).visited) && (!q || [dn(p), p.pin, d.name, d.official, '#' + p.serial].join(' ').toLowerCase().includes(q)));
          if (!rows.length) return ''; n += rows.length; const all = K.PLACES.filter((p) => p.d === d.order), v = all.filter((p) => K.place(p.id).visited).length;
          return `<section class="dist" id="dist-${d.order}"><header class="dhead"><span class="dnum">${pad2(d.order)}</span><div><h2>${esc(d.name)}</h2><small>${all.length} · p.${d.page} · ${v} ${esc(t('visited').toLowerCase())}${d.official !== d.name ? ' · ' + esc(t('nowCalled')) + ' ' + esc(d.official) : ''}</small></div><div class="bar" aria-hidden="true"><i style="width:${(v / all.length) * 100}%"></i></div></header><div class="grid pgrid3">${rows.map(pcard).join('')}</div></section>`; }).join('');
        $('#plist', root).innerHTML = html || `<p class="muted">${esc(t('noMatch'))}</p>`; $('#pc', root).textContent = n + ' ' + t('shown');
      };
      draw(); K.tilt($('#plist', root), '.pcard');
      root.addEventListener('click', (e) => { const h = e.target.closest('.hs'); if (h) { F.d = h.dataset.d; F.only = false; F.q = ''; $('#pd', root).value = F.d; $('#po', root).checked = false; $('#pq', root).value = ''; draw(); const el = $('#dist-' + F.d, root); if (el) el.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'start' }); return; }
        if (e.target.closest('[data-fullmap]')) K.lightbox('assets/passport-map.jpg', 'Passport map'); });
      $('#pq', root).addEventListener('input', (e) => { F.q = e.target.value; draw(); });
      $('#pd', root).addEventListener('change', (e) => { F.d = e.target.value; draw(); });
      $('#po', root).addEventListener('change', (e) => { F.only = e.target.checked; draw(); });
    } });

  /* ================= ONE POST OFFICE ================= */
  V.place = (ctx) => {
    const p = find(decodeURIComponent(ctx.params[0] || '')); if (!p) return V.notfound();
    const c = K.place(p.id), d = dist(p), i = K.PLACES.indexOf(p), prev = K.PLACES[i - 1], next = K.PLACES[i + 1], owner = K.isOwner();
    const slot = (key, label) => { const src = c.photos[key]; return src ? `<button class="pic tiltable" data-lb="${esc(safeUrl(K.img(src)))}" data-alt="${esc(label)}" type="button"><img src="${esc(safeUrl(K.img(src)))}" alt="${esc(label + ' — ' + dn(p))}" loading="lazy"><span class="cap">${esc(label)}</span><span class="glare"></span></button>` : (owner ? `<div class="pic empty"><span class="cap">${esc(label)}</span><small>+</small></div>` : ''); };
    const pics = ['stamp', 'location', 'office'].map((k) => slot(k, t(k + 'Photo'))).join('');
    return { title: '#' + p.serial + ' ' + dn(p) + ' — K_24 Karnataka Post Trails', html: `<article class="place"><header class="phead3d"><div class="wrap"><a class="back" href="#/passport">← ${esc(t('passport'))}</a><p class="eyebrow">#${p.serial} · ${esc(d.name)}</p><h1>${esc(dn(p))}</h1><p class="sub">${esc(t('pin'))} ${esc(p.pin)} · ${esc(p.theme)}</p></div></header>
      <div class="wrap pl-grid"><section class="pl-main">
        ${c.visited ? `<div class="pressrow"><div class="press" aria-hidden="true"><svg viewBox="0 0 120 120"><circle class="draw" pathLength="1" cx="60" cy="60" r="54" fill="none" stroke="#C83742" stroke-width="3"/><circle cx="60" cy="60" r="44" fill="none" stroke="#C83742" stroke-width="1" opacity=".6"/></svg><b>${esc(t('seal'))}</b></div><div><h2>${esc(t('myVisit'))}</h2>${c.visitDate ? `<p class="muted">${esc(t('visitDate'))}: <strong>${esc(fmtDate(c.visitDate))}</strong></p>` : ''}</div></div>
          ${c.description ? `<p class="prose">${esc(c.description)}</p>` : ''}` : `<div class="notyet"><div class="ghost-stamp perf">${pad2(p.serial)}</div><p>${esc(t('notVisited'))}. ${esc(t('nothingYet'))}</p></div>`}
        ${pics ? `<div class="photos">${pics}</div>` : (c.visited ? `<p class="muted">${esc(t('nothingYet'))}</p>` : '')}
        ${owner ? `<p><button class="btn gold" data-edit type="button">✎ ${esc(t('edit'))}</button></p>` : ''}</section>
        <aside class="card details"><dl>
          <div><dt>${esc(t('district'))}</dt><dd>${esc(d.name)}${d.official !== d.name ? `<br><small class="muted">${esc(t('nowCalled'))} ${esc(d.official)}</small>` : ''}</dd></div><div><dt>${esc(t('pin'))}</dt><dd>${esc(p.pin)}</dd></div>
          <div><dt>${esc(t('office'))}</dt><dd>${esc(TYPE[p.code] || p.type)}</dd></div><div><dt>${esc(t('doi'))}</dt><dd>${esc(p.doiP)}</dd></div><div><dt>${esc(t('theme'))}</dt><dd>${esc(p.theme)}</dd></div>
          <div><dt>${esc(t('pages'))}</dt><dd>${p.page}–${p.page + 1}</dd></div></dl>
          ${p.pinStamp ? `<p class="warnbox">${esc(t('checkPin'))} ${esc(p.pinStamp)}.</p>` : ''}<p class="small muted">${esc(t('fromPassport'))}</p></aside></div>
        <nav class="wrap pn">${prev ? `<a href="#/place/${enc(prev.id)}">← #${prev.serial} ${esc(dn(prev))}</a>` : '<span></span>'}${next ? `<a href="#/place/${enc(next.id)}">#${next.serial} ${esc(dn(next))} →</a>` : '<span></span>'}</nav></article>`,
      after(root) { const pc = $('.photos', root); if (pc) { K.tilt(pc, '.pic', 7); pc.addEventListener('click', (e) => { const b = e.target.closest('[data-lb]'); if (b) K.lightbox(b.dataset.lb, b.dataset.alt); else if (e.target.closest('.pic.empty') && owner) K.editPlace(p.id); }); }
        const eb = $('[data-edit]', root); if (eb) eb.addEventListener('click', () => K.editPlace(p.id)); } };
  };

  /* ================= JOURNEY ================= */
  V.journey = () => { const list = sortedStories(), owner = K.isOwner();
    return { title: t('stories') + ' — K_24 Karnataka Post Trails', html: `<div class="wrap page"><header class="phd"><div><p class="eyebrow dark">${esc(t('eyebrow'))}</p><h1>${esc(t('stories'))}</h1></div>${owner ? `<button class="btn gold" data-new type="button">+ ${esc(t('newStory'))}</button>` : ''}</header>
      ${list.length ? `<div class="grid sgrid" id="slist">${list.map(storyCard).join('')}</div>` : `<p class="muted">${esc(t('noStories'))}</p>`}</div>`,
      after(root) { const g = $('#slist', root); if (g) K.tilt(g, '.scard'); const b = $('[data-new]', root); if (b) b.addEventListener('click', () => K.editStory(null)); } }; };
  V.story = (ctx) => { const s = K.content.stories.find((x) => x.id === decodeURIComponent(ctx.params[0] || '')); if (!s) return V.notfound(); const p = find(s.placeId), owner = K.isOwner();
    return { title: s.title + ' — K_24 Karnataka Post Trails', html: `<article class="place story"><header class="phead3d"><div class="wrap"><a class="back" href="#/journey">← ${esc(t('stories'))}</a><p class="eyebrow">${esc(fmtDate(s.date))}</p><h1>${esc(s.title)}</h1>${p ? `<p class="sub"><a href="#/place/${enc(p.id)}">#${p.serial} ${esc(dn(p))}</a></p>` : ''}</div></header>
      <div class="wrap narrow"><div class="prose">${s.text.split(/\n{2,}/).map((x) => `<p>${esc(x)}</p>`).join('')}</div>${s.photos.length ? `<div class="photos many">${s.photos.map((ph, i) => `<button class="pic" data-lb="${esc(safeUrl(K.img(ph)))}" data-alt="${esc(s.title)}" type="button"><img src="${esc(safeUrl(K.img(ph)))}" alt="${esc(s.title)} ${i + 1}" loading="lazy"><span class="glare"></span></button>`).join('')}</div>` : ''}
        ${owner ? `<p class="btn-row"><button class="btn gold" data-edit type="button">✎ ${esc(t('edit'))}</button><button class="btn danger" data-del type="button">${esc(t('del'))}</button></p>` : ''}</div></article>`,
      after(root) { const g = $('.photos', root); if (g) { K.tilt(g, '.pic', 6); g.addEventListener('click', (e) => { const b = e.target.closest('[data-lb]'); if (b) K.lightbox(b.dataset.lb, b.dataset.alt); }); }
        const e1 = $('[data-edit]', root), d1 = $('[data-del]', root); if (e1) e1.addEventListener('click', () => K.editStory(s.id)); if (d1) d1.addEventListener('click', () => K.deleteStory(s.id)); } }; };
  V.notfound = () => ({ title: 'Not found', html: `<div class="wrap page"><h1>Not found</h1><p class="muted">This page isn’t here.</p><p><a class="btn gold" href="#/">${esc(t('home'))}</a></p></div>` });
})();
(window.K24.mods = window.K24.mods || {}).views = '5.0';
