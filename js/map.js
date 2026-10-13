/* Leaflet map wrapper: clustering, highlight, route layer, reset control, graceful failure. Tiles: OpenStreetMap (attribution shown). */
(function () {
  const K = window.K24, esc = K.esc;
  const COLORS = { planned: '#C9A24B', visited: '#1f7a55', cancel: '#8b1e2d', blog: '#2f5f8a' };
  const LABELS = { planned: 'Not visited yet', visited: 'Visited', cancel: 'Cancellation collected', blog: 'Blog published' };
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';
  let current = null;
  const loadScript = (src, ms) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; const t = setTimeout(() => rej(new Error('timeout')), ms || 9000); s.onload = () => { clearTimeout(t); res(); }; s.onerror = () => { clearTimeout(t); rej(new Error('network')); }; document.head.appendChild(s); });
  const loadCss = (href) => { if (!document.querySelector('link[href="' + href + '"]')) { const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = href; document.head.appendChild(c); } };

  function ensureLeaflet() {
    if (window.L && window.L.map) return Promise.resolve();
    if (ensureLeaflet.p) return ensureLeaflet.p;
    loadCss(CDN + 'leaflet/1.9.4/leaflet.min.css');
    ensureLeaflet.p = loadScript(CDN + 'leaflet/1.9.4/leaflet.min.js').then(() => { if (!window.L) throw new Error('Leaflet missing'); }).catch((e) => { ensureLeaflet.p = null; throw e; });
    return ensureLeaflet.p;
  }
  function ensureCluster() {   // optional enhancement: if it fails, markers are simply not clustered
    if (window.L && window.L.markerClusterGroup) return Promise.resolve(true);
    if (ensureCluster.p) return ensureCluster.p;
    loadCss(CDN + 'leaflet.markercluster/1.5.3/MarkerCluster.css'); loadCss(CDN + 'leaflet.markercluster/1.5.3/MarkerCluster.Default.css');
    ensureCluster.p = loadScript(CDN + 'leaflet.markercluster/1.5.3/leaflet.markercluster.js', 7000).then(() => !!window.L.markerClusterGroup).catch(() => false);
    return ensureCluster.p;
  }

  function popupHTML(l) {
    const v = K.store.verification(l), vl = { verified: 'Fully verified', partial: 'Partially verified', pending: 'Pending verification' }[v];
    const page = l.passportPage ? 'p. ' + l.passportPage : (l.pageInferred ? '≈ p. ' + l.pageInferred + ' (inferred)' : 'Not available');
    const cs = { verified: 'Coordinates confirmed', geocoded: 'Coordinates from map search — not yet confirmed', none: '' }[l.coordStatus];
    return `<div class="map-pop"><strong>#${l.serial} ${esc(K.dn(l))}</strong><span class="pop-status" style="--c:${COLORS[K.store.statusOf(l)]}">${vl} · ${LABELS[K.store.statusOf(l)]}</span>
      <div>${esc(l.passportDistrict)}${l.currentDistrict && l.currentDistrict !== l.passportDistrict ? ' <span class="muted">(now ' + esc(l.currentDistrict) + ')</span>' : ''}</div>
      <div>Post office: ${l.postOffice ? esc(l.postOffice) : '<span class="muted">Not available</span>'}</div><div>PIN: ${l.pin ? esc(l.pin) : '<span class="muted">Pending verification</span>'} · Passport ${esc(page)}</div>
      ${cs ? `<div class="muted">${cs}</div>` : ''}
      <div class="pop-links"><a href="#/destination/${encodeURIComponent(l.id)}">Details</a><a target="_blank" rel="noopener noreferrer" href="${K.geo.googleMaps(l)}">Google Maps</a><a target="_blank" rel="noopener noreferrer" href="${K.geo.osm(l)}">OpenStreetMap</a></div></div>`;
  }

  function destroy() { if (current) { try { current.map.remove(); } catch (e) {} current = null; } }

  async function mount(el, locs, o) {
    o = o || {}; destroy();
    el.innerHTML = '<div class="map-state" role="status"><span class="spinner" aria-hidden="true"></span> Loading map…</div>';
    try { await ensureLeaflet(); }
    catch (e) {
      el.innerHTML = `<div class="map-state map-error" role="alert"><strong>The map couldn’t load.</strong><span>The map library didn’t download (offline or blocked). The directory list still works.</span><button class="btn btn-ghost" type="button" data-retry>Try again</button></div>`;
      const b = el.querySelector('[data-retry]'); if (b) b.addEventListener('click', () => mount(el, locs, o));
      if (o.onError) o.onError(e); return null;
    }
    const clustered = o.cluster ? await ensureCluster() : false;
    if (!el.isConnected) return null;
    el.innerHTML = ''; const L = window.L, inter = o.interactive !== false;
    const map = L.map(el, { zoomControl: inter, dragging: inter, touchZoom: inter, doubleClickZoom: inter, boxZoom: inter, keyboard: inter, scrollWheelZoom: false, minZoom: 5 });
    map.fitBounds(K.geo.KARNATAKA_BOUNDS);
    let loaded = false, errs = 0, banner = null;
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' }).addTo(map);
    tiles.on('tileload', () => { loaded = true; if (banner) { banner.remove(); banner = null; } });
    tiles.on('tileerror', () => { errs++; if (!loaded && errs >= 3 && !banner) { banner = document.createElement('div'); banner.className = 'map-banner'; banner.setAttribute('role', 'alert'); banner.textContent = 'Map tiles couldn’t load (connection or tile-server limit). Markers still work and the list has every destination.'; el.appendChild(banner); } });
    if (inter) {
      el.addEventListener('click', () => map.scrollWheelZoom.enable(), { once: true });
      const Reset = L.Control.extend({ options: { position: 'topleft' }, onAdd() { const b = L.DomUtil.create('button', 'map-reset'); b.type = 'button'; b.title = 'Reset map view to Karnataka'; b.setAttribute('aria-label', 'Reset map view to Karnataka'); b.textContent = '⟲'; L.DomEvent.disableClickPropagation(b); b.addEventListener('click', () => map.fitBounds(K.geo.KARNATAKA_BOUNDS)); return b; } });
      map.addControl(new Reset());
    }
    const layer = clustered ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 42 }) : L.layerGroup(); layer.addTo(map);
    const routeLayer = L.layerGroup().addTo(map), markers = {}; let probe = null;
    const ctl = {
      map, clustered,
      set(list) {
        layer.clearLayers(); Object.keys(markers).forEach((k) => delete markers[k]); let n = 0;
        list.filter((l) => l.lat != null && l.lng != null).forEach((l) => {      // only real coordinates ever become markers
          const st = K.store.statusOf(l), est = l.coordStatus !== 'verified';
          const icon = L.divIcon({ className: 'k24-pin-wrap', html: `<span class="k24-pin ${est ? 'est' : ''} ${st === 'visited' ? 'pulse' : ''}" style="--c:${COLORS[st]}"><i></i></span>`, iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -32] });
          const m = L.marker([l.lat, l.lng], { icon, title: '#' + l.serial + ' ' + K.dn(l), alt: K.dn(l), keyboard: inter }).bindPopup(popupHTML(l), { maxWidth: 270 });
          if (o.onMarkerClick) m.on('click', () => o.onMarkerClick(l.id));
          layer.addLayer(m); markers[l.id] = m; n++;
        });
        return n;
      },
      focus(id) { const m = markers[id]; if (!m) return false; const open = () => { map.setView(m.getLatLng(), Math.max(map.getZoom(), 11)); m.openPopup(); ctl.flash(id); }; if (clustered && layer.zoomToShowLayer) layer.zoomToShowLayer(m, () => { m.openPopup(); ctl.flash(id); }); else open(); return true; },
      flash(id) { const m = markers[id]; const e = m && m._icon && m._icon.firstChild; if (e) { e.classList.add('hl'); setTimeout(() => e.classList.remove('hl'), 2400); } },
      has(id) { return !!markers[id]; },
      reset() { map.fitBounds(K.geo.KARNATAKA_BOUNDS); },
      invalidate() { setTimeout(() => map.invalidateSize(), 60); },
      clearRoute() { routeLayer.clearLayers(); },
      /* stops: [{lat,lng,label}], line: [[lat,lng],…] — road geometry when available; type 'road' draws solid, anything else draws dashed */
      showRoute(origin, stops, line, type) {
        routeLayer.clearLayers(); const pts = [[origin.lat, origin.lng]].concat(stops.map((s) => [s.lat, s.lng]));
        L.polyline(line && line.length ? line : pts, { color: '#7a1f2b', weight: 4, opacity: .85, dashArray: type === 'road' ? null : '9 9' }).addTo(routeLayer);
        L.marker(pts[0], { icon: L.divIcon({ className: 'k24-num-wrap', html: '<b class="k24-num start">Start</b>', iconSize: [44, 26], iconAnchor: [22, 13] }), keyboard: false, title: 'Start: ' + (origin.name || 'origin') }).addTo(routeLayer);
        stops.forEach((s, i) => L.marker([s.lat, s.lng], { icon: L.divIcon({ className: 'k24-num-wrap', html: '<b class="k24-num">' + (i + 1) + '</b>', iconSize: [28, 28], iconAnchor: [14, 14] }), title: 'Stop ' + (i + 1) + ': ' + (s.label || '') }).bindPopup(esc((i + 1) + '. ' + (s.label || ''))).addTo(routeLayer));
        map.fitBounds(L.latLngBounds(pts), { padding: [36, 36] });
      },
      probe(lat, lng, text) { if (probe) probe.remove(); probe = L.marker([lat, lng], { title: 'Search result' }).addTo(map).bindPopup(esc(text) + '<br><em>Search result — not a passport destination</em>').openPopup(); map.setView([lat, lng], 12); }
    };
    ctl.set(locs || []); ctl.invalidate(); current = ctl;
    if (o.focusId) setTimeout(() => ctl.focus(o.focusId), 400);
    return ctl;
  }
  K.map = { mount, destroy, COLORS, LABELS };
})();
(window.K24.mods = window.K24.mods || {})['map'] = '2026.10.13b';
