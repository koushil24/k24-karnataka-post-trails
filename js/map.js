/* Leaflet map wrapper with graceful failure handling. Tiles: OpenStreetMap (attribution required). */
(function () {
  const K = window.K24, esc = K.esc;
  const COLORS = { planned: '#D5AC49', visited: '#1f7a55', cancel: '#C83742', blog: '#2f5f8a' };
  const LABELS = { planned: 'Planned', visited: 'Visited', cancel: 'Cancellation collected', blog: 'Blog published' };
  const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  let current = null;

  function ensureLeaflet() {
    if (window.L && window.L.map) return Promise.resolve();
    if (ensureLeaflet.p) return ensureLeaflet.p;
    ensureLeaflet.p = new Promise((res, rej) => {
      if (!document.querySelector('link[data-leaflet]')) { const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = LEAFLET_CSS; c.dataset.leaflet = '1'; document.head.appendChild(c); }
      const s = document.createElement('script'); s.src = LEAFLET_JS; const to = setTimeout(() => rej(new Error('timeout')), 9000);
      s.onload = () => { clearTimeout(to); window.L ? res() : rej(new Error('Leaflet missing')); };
      s.onerror = () => { clearTimeout(to); rej(new Error('network')); };
      document.head.appendChild(s);
    }).catch((e) => { ensureLeaflet.p = null; throw e; });
    return ensureLeaflet.p;
  }

  function popupHTML(l) {
    const st = K.store.statusOf(l);
    return `<div class="map-pop"><strong>${esc(l.name)}</strong><span class="pop-status" style="--c:${COLORS[st]}">${LABELS[st]}</span>
      <div>${esc(l.attraction || '')}</div><div class="muted">${esc(l.district || '')}${l.demo ? ' · demo entry' : ''}</div>
      ${l.postOffice ? `<div>${esc(l.postOffice)}${l.pin ? ' · ' + esc(l.pin) : ''}</div>` : '<div class="muted">Post office not added yet</div>'}
      ${l.coordsVerified ? '' : '<div class="muted">Position is approximate, not verified.</div>'}
      <a href="#/destination/${encodeURIComponent(l.id)}">Open details</a></div>`;
  }

  function destroy() { if (current) { try { current.map.remove(); } catch (e) {} current = null; } }

  async function mount(el, locs, o) {
    o = o || {}; destroy();
    el.innerHTML = '<div class="map-state" role="status"><span class="spinner" aria-hidden="true"></span> Loading map…</div>';
    try { await ensureLeaflet(); }
    catch (e) {
      el.innerHTML = `<div class="map-state map-error" role="alert"><strong>The map couldn’t load.</strong><span>Leaflet didn’t download (offline or blocked). Your locations are still available in the list.</span><button class="btn btn-ghost" type="button" data-retry>Try again</button></div>`;
      const b = el.querySelector('[data-retry]'); if (b) b.addEventListener('click', () => mount(el, locs, o));
      if (o.onError) o.onError(e); return null;
    }
    if (!el.isConnected) return null;
    el.innerHTML = ''; const L = window.L, inter = o.interactive !== false;
    const map = L.map(el, { zoomControl: inter, dragging: inter, touchZoom: inter, doubleClickZoom: inter, boxZoom: inter, keyboard: inter, scrollWheelZoom: false, minZoom: 5, attributionControl: true }).setView([14.8, 76.2], o.zoom || 6);
    let loaded = false, errs = 0, banner = null;
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' }).addTo(map);
    tiles.on('tileload', () => { loaded = true; if (banner) { banner.remove(); banner = null; } });
    tiles.on('tileerror', () => { errs++; if (!loaded && errs >= 3 && !banner) { banner = document.createElement('div'); banner.className = 'map-banner'; banner.setAttribute('role', 'alert'); banner.textContent = 'Map tiles couldn’t load. Markers still show, and the list view has every location.'; el.appendChild(banner); } });
    if (inter) { el.addEventListener('click', () => map.scrollWheelZoom.enable(), { once: true }); }
    const layer = L.layerGroup().addTo(map); const markers = {};
    const ctl = {
      map,
      set(list, fit) {
        layer.clearLayers(); Object.keys(markers).forEach((k) => delete markers[k]);
        const pts = [];
        list.filter((l) => l.lat != null && l.lng != null).forEach((l) => {
          const st = K.store.statusOf(l);
          const icon = L.divIcon({ className: 'k24-pin-wrap', html: `<span class="k24-pin ${st === 'visited' ? 'pulse' : ''}" style="--c:${COLORS[st]}"><i></i></span>`, iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -32] });
          const m = L.marker([l.lat, l.lng], { icon, title: l.name, alt: l.name + ' – ' + LABELS[st], keyboard: inter }).bindPopup(popupHTML(l), { maxWidth: 260 });
          if (!inter) m.options.interactive = false;
          m.addTo(layer); markers[l.id] = m; pts.push([l.lat, l.lng]);
        });
        if (fit !== false) { if (pts.length > 1) map.fitBounds(pts, { padding: [28, 28], maxZoom: 9 }); else if (pts.length === 1) map.setView(pts[0], 9); else map.setView([14.8, 76.2], 6); }
        return pts.length;
      },
      focus(id) { const m = markers[id]; if (m) { map.setView(m.getLatLng(), Math.max(map.getZoom(), 10)); m.openPopup(); } },
      invalidate() { setTimeout(() => map.invalidateSize(), 60); }
    };
    ctl.set(locs, true); ctl.invalidate();
    current = ctl; if (o.focusId) setTimeout(() => ctl.focus(o.focusId), 300);
    return ctl;
  }
  K.map = { mount, destroy, COLORS, LABELS };
})();
