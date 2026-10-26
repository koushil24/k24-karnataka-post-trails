/* Real map (OpenStreetMap via Leaflet): tap a post office, zoom, open directions. Positions are approximate until the owner confirms them. */
(function () {
  const K = window.K24, { $, $$, esc } = K, t = (k) => K.t(k), enc = encodeURIComponent, V = K.views;
  const inK = (a, b) => a >= 11.4 && a <= 18.6 && b >= 73.8 && b <= 78.7; K.inKarnataka = inK;
  const LIBS = [['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'], ['https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js']];
  const CLS = [['https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js'], ['https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/MarkerCluster.css', 'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css', 'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js']];
  const js = (src, ms) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; const to = setTimeout(() => rej(new Error('timeout')), ms || 9000); s.onload = () => { clearTimeout(to); res(); }; s.onerror = () => { clearTimeout(to); rej(new Error('blocked')); }; document.head.appendChild(s); });
  const css = (h) => { if (!document.querySelector('link[href="' + h + '"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.appendChild(l); } };
  async function leaflet() { if (window.L && L.map) return; for (const [c, j] of LIBS) { try { css(c); await js(j); if (window.L && L.map) return; } catch (e) {} } throw new Error('The map library could not be loaded (blocked or offline).'); }
  async function cluster() { if (L.markerClusterGroup) return true; for (const [a, b, j] of CLS) { try { css(a); css(b); await js(j, 7000); if (L.markerClusterGroup) return true; } catch (e) {} } return false; }
  const dist = (p) => K.DISTRICTS[p.d - 1];
  K.navUrl = (p) => { const l = K.loc(p.id); return l ? 'https://www.google.com/maps/dir/?api=1&destination=' + l.lat + ',' + l.lng : 'https://www.google.com/maps/search/?api=1&query=' + enc(p.name + ' Post Office ' + p.pin + ', ' + dist(p).name + ', Karnataka, India'); };
  K.basisText = (l) => (!l ? t('locPending') : l.basis === 'confirmed' ? t('locConfirmed') : t('locApprox'));

  const F = { q: '', d: '', only: false, pane: 'map' };
  V.map = () => {
    const located = K.PLACES.filter((p) => K.loc(p.id)).length, owner = K.isOwner(), focus = new URLSearchParams((location.hash.split('?')[1] || '')).get('id') || '';
    return { title: t('map') + ' — K_24 Karnataka Post Trails', html: `<div class="wrap page"><header class="phd"><div><p class="eyebrow dark">${esc(t('eyebrow'))}</p><h1>${esc(t('mapPageTitle'))}</h1><p class="muted">${esc(t('mapPageSub'))}</p></div><div class="chipstat"><strong>${located}</strong> / ${K.PLACES.length} ${esc(t('located'))}</div></header>
      <div class="tabs" role="group" aria-label="View"><button class="tab ${F.pane === 'map' ? 'on' : ''}" data-pane="map" type="button">${esc(t('map'))}</button><button class="tab ${F.pane === 'list' ? 'on' : ''}" data-pane="list" type="button">${esc(t('list'))}</button></div>
      <div class="mapui" data-pane="${F.pane}"><aside class="mlist"><label class="search"><span class="sr">${esc(t('search'))}</span><input type="search" id="mq" placeholder="${esc(t('search'))}" value="${esc(F.q)}" autocomplete="off"></label>
        <label><span class="sr">${esc(t('jump'))}</span><select id="md"><option value="">${esc(t('allDistricts'))}</option>${K.DISTRICTS.map((d) => `<option value="${d.order}" ${F.d === String(d.order) ? 'selected' : ''}>${String(d.order).padStart(2, '0')} · ${esc(d.name)}</option>`).join('')}</select></label>
        <label class="switch"><input type="checkbox" id="mo" ${F.only ? 'checked' : ''}><span>${esc(t('onlyVisited'))}</span></label><ul id="ml" class="ml"></ul></aside>
        <section class="mmain"><div id="map" class="bigmap" role="region" aria-label="${esc(t('mapPageTitle'))}"><div class="mapmsg"><span class="spin"></span> ${esc(t('loadingMap'))}</div></div>
          <div class="legend"><span><i class="lg v"></i>${esc(t('visited'))}</span><span><i class="lg"></i>${esc(t('notVisited'))}</span><span><i class="lg ap"></i>${esc(t('locApprox'))}</span><button class="btn ghost sm" id="mreset" type="button">⟲ ${esc(t('resetView'))}</button></div>
          <p class="small muted">${esc(t('mapCredit'))}</p>
          ${owner ? `<div class="card ownerbox"><strong>${esc(t('ownerMode'))}</strong><p class="small">${esc(t('locateHelp'))}</p><button class="btn gold sm" id="locate" type="button">${esc(t('locateBtn'))}</button> <span class="small muted" id="locmsg" role="status"></span></div>` : ''}</section></div></div>`,
    async after(root) {
      const rows = () => { const q = F.q.toLowerCase().trim(); return K.PLACES.filter((p) => (!F.d || String(p.d) === F.d) && (!F.only || K.place(p.id).visited) && (!q || [K.dn(p), p.pin, dist(p).name, '#' + p.serial].join(' ').toLowerCase().includes(q))); };
      let ctl = null; const drawList = () => { const r = rows(); $('#ml', root).innerHTML = r.map((p) => { const l = K.loc(p.id), v = K.place(p.id).visited; return `<li><button class="mi ${v ? 'v' : ''}" data-id="${esc(p.id)}" type="button"><b>${p.serial}</b><span><strong>${esc(K.dn(p))}</strong><small>${esc(dist(p).name)} · ${esc(p.pin)} · ${esc(K.basisText(l))}</small></span></button></li>`; }).join('') || `<li class="muted">${esc(t('noMatch'))}</li>`; return r; };
      const setPane = (p) => { F.pane = p; $('.mapui', root).dataset.pane = p; $$('button[data-pane]', root).forEach((b) => b.classList.toggle('on', b.dataset.pane === p)); if (ctl) ctl.invalidate(); };
      const upd = () => { const r = drawList(); if (ctl) ctl.set(r); };
      drawList();
      $('#mq', root).addEventListener('input', (e) => { F.q = e.target.value; upd(); }); $('#md', root).addEventListener('change', (e) => { F.d = e.target.value; upd(); }); $('#mo', root).addEventListener('change', (e) => { F.only = e.target.checked; upd(); });
      $$('button[data-pane]', root).forEach((b) => b.addEventListener('click', () => setPane(b.dataset.pane)));
      $('#ml', root).addEventListener('click', (e) => { const b = e.target.closest('.mi'); if (!b) return; const ok = ctl && ctl.focus(b.dataset.id); if (ok) setPane('map'); else if (!K.loc(b.dataset.id)) K.toast(t('noLocYet'), 'error'); });
      try { await leaflet(); } catch (e) { $('#map', root).innerHTML = `<div class="mapmsg err" role="alert"><strong>${esc(t('mapFail'))}</strong><span>${esc(e.message)}</span></div>`; $('.mlist', root).insertAdjacentHTML('afterbegin', `<div class="banner" role="alert">${esc(t('mapFail'))} <button class="linkish" id="mretry" type="button">${esc(t('tryAgain'))}</button></div>`); $('#mretry', root).addEventListener('click', () => K.render()); setPane('list'); return; }
      if (!document.contains($('#map', root))) return;
      const clustered = await cluster(); const el = $('#map', root); el.innerHTML = '';
      const map = L.map(el, { scrollWheelZoom: false, minZoom: 5, zoomControl: true }); const KAR = [[11.5, 74.0], [18.5, 78.6]]; map.fitBounds(KAR);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' }).addTo(map);
      el.addEventListener('click', () => map.scrollWheelZoom.enable(), { once: true });
      const layer = clustered ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 40 }) : L.layerGroup(); layer.addTo(map); const mk = {};
      const highlight = (id) => { const li = $('.mi[data-id="' + id + '"]', root); if (li) { $$('.mi.hl', root).forEach((x) => x.classList.remove('hl')); li.classList.add('hl'); li.scrollIntoView({ block: 'nearest' }); } };
      ctl = {
        set(list) { layer.clearLayers(); Object.keys(mk).forEach((k) => delete mk[k]);
          list.forEach((p) => { const l = K.loc(p.id); if (!l) return; const v = K.place(p.id).visited, ap = l.basis !== 'confirmed';
            const m = L.marker([l.lat, l.lng], { icon: L.divIcon({ className: 'mkwrap', html: `<span class="mk ${v ? 'v' : ''} ${ap ? 'ap' : ''}"><i></i></span>`, iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -32] }), title: '#' + p.serial + ' ' + K.dn(p), alt: K.dn(p) });
            m.bindPopup(`<div class="pop"><strong>#${p.serial} ${esc(K.dn(p))}</strong><span>${esc(dist(p).name)} · PIN ${esc(p.pin)}</span><span class="${v ? 'okc' : ''}">${esc(v ? t('visited') : t('notVisited'))}</span><span class="muted">${esc(K.basisText(l))}</span><span class="pl"><a href="#/place/${enc(p.id)}">${esc(t('details'))}</a><a href="${esc(K.navUrl(p))}" target="_blank" rel="noopener noreferrer">${esc(t('navigate'))}</a></span></div>`, { maxWidth: 260 });
            m.on('click', () => highlight(p.id)); layer.addLayer(m); mk[p.id] = m; });
          return Object.keys(mk).length; },
        focus(id) { const m = mk[id]; if (!m) return false; const open = () => { map.setView(m.getLatLng(), Math.max(map.getZoom(), 12)); m.openPopup(); }; if (clustered && layer.zoomToShowLayer) layer.zoomToShowLayer(m, () => m.openPopup()); else open(); highlight(id); return true; },
        reset() { map.fitBounds(KAR); }, invalidate() { setTimeout(() => map.invalidateSize(), 80); }
      };
      ctl.set(rows()); ctl.invalidate(); $('#mreset', root).addEventListener('click', () => ctl.reset());
      K.onLeave(() => { try { map.remove(); } catch (e) {} });
      if (focus) setTimeout(() => ctl.focus(focus), 400);
      const lb = $('#locate', root); if (lb) lb.addEventListener('click', () => K.locateAll($('#locmsg', root), () => K.render()));
    } };
  };

  /* ---- owner: find positions of post offices without one, using OpenStreetMap search (runs in your browser, ~1 request per second) ---- */
  K.locateAll = async (msgEl, done) => {
    const all = K.PLACES.filter((p) => !K.loc(p.id)); if (!all.length) { K.toast(t('allLocated')); return; }
    let cancel = false; const found = {}, skipped = []; const d = K.dialog(`<div class="dlg-in"><h2>${esc(t('locateBtn'))}</h2><p class="small">${esc(t('locateRun'))}</p><div class="bar big"><i id="lp" style="width:0"></i></div><p class="small" id="lt" role="status">…</p><div class="dlg-foot"><button class="btn ghost" id="lc" type="button">${esc(t('cancel'))}</button></div></div>`, 'sm');
    $('#lc', d).addEventListener('click', () => { cancel = true; d.close(); });
    const ask = async (q) => { const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 9000); try { const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=' + enc(q), { signal: ctrl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); return j[0] ? { lat: +j[0].lat, lng: +j[0].lon, name: j[0].display_name } : null; } finally { clearTimeout(to); } };
    const wait = (ms) => new Promise((z) => setTimeout(z, ms));
    for (let i = 0; i < all.length && !cancel; i++) {
      const p = all[i]; $('#lt', d).textContent = (i + 1) + ' / ' + all.length + ' — ' + p.name; $('#lp', d).style.width = ((i / all.length) * 100) + '%';
      try { let r = await ask(p.name + ' post office, ' + dist(p).name + ', Karnataka, India'); await wait(1150); if (!r || !inK(r.lat, r.lng)) { r = await ask(p.name + ', ' + dist(p).name + ', Karnataka, India'); await wait(1150); }
        if (r && inK(r.lat, r.lng)) found[p.id] = { lat: +r.lat.toFixed(5), lng: +r.lng.toFixed(5), basis: 'osm', note: 'Found by OpenStreetMap search (approximate): ' + r.name.slice(0, 90) }; else skipped.push(p.name); }
      catch (e) { skipped.push(p.name); await wait(1500); }
    }
    if (cancel) return;
    const n = Object.keys(found).length; $('.dlg-in', d).innerHTML = `<h2>${esc(t('locateBtn'))}</h2><p>${n} ${esc(t('foundN'))}${skipped.length ? ' · ' + skipped.length + ' ' + esc(t('notFoundN')) + ': ' + esc(skipped.join(', ')) : ''}</p><p class="small muted">${esc(t('locateNote'))}</p><p class="err" id="le" role="alert"></p><div class="dlg-foot"><button class="btn ghost" data-close type="button">${esc(t('cancel'))}</button><button class="btn gold" id="lpub" type="button" ${n ? '' : 'disabled'}>${esc(t('save'))}</button></div>`;
    $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => d.close()));
    $('#lpub', d).addEventListener('click', async () => { $('#lpub', d).disabled = true; try { await K.publishJson('data/locations.json', (o) => { Object.keys(found).forEach((id) => { if (!o[id] || o[id].basis === 'approx') o[id] = found[id]; }); }, {}); Object.keys(found).forEach((id) => { if (!K.locs[id] || K.locs[id].basis === 'approx') K.locs[id] = found[id]; }); d.close(); K.toast(t('published')); if (done) done(); } catch (e) { $('#le', d).textContent = e.message; $('#lpub', d).disabled = false; } });
  };
})();
(window.K24.mods = window.K24.mods || {}).map = '5.0';
