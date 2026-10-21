/* Distance + routing helpers. Works in the browser (K24.geo) and in Node (for tests).
   RULE: straight-line figures are always labelled "straight-line"; only a real routing-engine result is ever called "road". */
(function (root) {
  const G = {};
  G.ORIGINS = [
    { id: 'mysuru', name: 'Mysuru', lat: 12.2958, lng: 76.6394, note: 'city centre, approximate' },
    { id: 'bengaluru', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, note: 'city centre, approximate' }
  ];
  G.KARNATAKA_BOUNDS = [[11.5, 74.0], [18.5, 78.6]];
  G.haversine = (a, b) => { const R = 6371, r = (d) => (d * Math.PI) / 180, dl = r(b.lat - a.lat), dg = r(b.lng - a.lng);
    const x = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  /* d = { km, type: 'straight' | 'road' } */
  G.label = (d) => {
    if (!d || d.km == null) return 'Not available (no coordinates)';
    const km = d.km >= 100 ? Math.round(d.km) : Math.round(d.km * 10) / 10;
    if (d.type === 'road') return km + ' km by road (OSRM routing estimate)';
    if (d.type === 'straight') return '≈ ' + km + ' km straight-line (not road distance)';
    throw new Error('Unknown distance type: ' + d.type);
  };
  G.straight = (a, b) => ({ km: G.haversine(a, b), type: 'straight' });
  /* Nearest-neighbour ordering from a start point. This is a PROXIMITY-BASED order, not an optimised driving route. */
  G.proximityOrder = (start, pts) => { const left = pts.slice(), out = []; let cur = start; while (left.length) { let bi = 0, bd = Infinity; left.forEach((p, i) => { const d = G.haversine(cur, p); if (d < bd) { bd = d; bi = i; } }); cur = left.splice(bi, 1)[0]; out.push(cur); } return out; };
  G.googleMaps = (p) => 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng;
  G.googleMapsAddr = (q) => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(q);
  G.osm = (p) => 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B' + p.lat + '%2C' + p.lng;
  /* Real road routing via the public OSRM demo server (free, no key, light use only). Throws on any failure. Cached per session. */
  G.osrmRoute = async (pts) => {
    if (pts.length < 2 || pts.length > 26) throw new Error('Routing needs 2–26 points');
    const key = 'k24.osrm.' + pts.map((p) => p.lat.toFixed(4) + ',' + p.lng.toFixed(4)).join(';');
    try { const c = sessionStorage.getItem(key); if (c) return JSON.parse(c); } catch (e) {}
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 9000);
    try {
      const u = 'https://router.project-osrm.org/route/v1/driving/' + pts.map((p) => p.lng + ',' + p.lat).join(';') + '?overview=full&geometries=geojson&steps=false';
      const r = await fetch(u, { signal: ctrl.signal }); if (!r.ok) throw new Error('Routing service returned HTTP ' + r.status);
      const j = await r.json(); if (j.code !== 'Ok' || !j.routes || !j.routes[0]) throw new Error('No route found (' + (j.code || 'unknown') + ')');
      const rt = j.routes[0], out = { km: rt.distance / 1000, minutes: rt.duration / 60, legs: rt.legs.map((l) => ({ km: l.distance / 1000, minutes: l.duration / 60 })), line: rt.geometry.coordinates.map((c) => [c[1], c[0]]) };
      try { sessionStorage.setItem(key, JSON.stringify(out)); } catch (e) {} return out;
    } finally { clearTimeout(t); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
  else if (root && root.K24 !== undefined || (root && 'K24' in root)) { root.K24.geo = G; (root.K24.mods = root.K24.mods || {}).geo = '2026.10.20a'; }
  else { root.K24 = root.K24 || {}; root.K24.geo = G; (root.K24.mods = root.K24.mods || {}).geo = '2026.10.20a'; }
})(typeof window !== 'undefined' ? window : globalThis);
