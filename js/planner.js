/* Journey planner: configurable start, distance-sorted destinations, proximity-based itinerary, optional real road routing (OSRM). */
(function () {
  const K = window.K24, S = K.store, G = K.geo, { esc, fmtDate, $, $$ } = K, { ic, empty, pageHead, enc } = K.c, V = K.views;
  const PL = { districts: [], onlyUnvisited: true, max: 10, perTrip: 4, plan: null, road: null, roadErr: '' };
  const nm = (l) => '#' + l.serial + ' ' + K.dn(l);

  function compute() {
    const set = PL.districts.length ? PL.districts : K.DISTRICTS.map((d) => d.order);
    const all = S.list('passport').filter((l) => set.includes(l.districtOrder));
    const cand = all.filter((l) => l.lat != null && (!PL.onlyUnvisited || !l.visited));
    const byDist = cand.map((l) => ({ l, d: G.straight(K.origin, l) })).sort((a, b) => a.d.km - b.d.km);
    const picked = byDist.slice(0, PL.max).map((x) => x.l), ordered = G.proximityOrder(K.origin, picked);
    const legs = []; let cur = K.origin; ordered.forEach((l) => { legs.push(G.straight(cur, l)); cur = l; });
    return { all, cand, byDist, ordered, legs, truncated: cand.length > PL.max, noCoords: all.filter((l) => l.lat == null) };
  }
  function resultHTML() {
    const p = PL.plan; if (!p) return '';
    let h = '';
    if (!p.cand.length) h += `<div class="warn">None of the selected destinations has coordinates${PL.onlyUnvisited ? ' (or all are visited)' : ''}, so distances and routes can’t be calculated. Add coordinates in the Passport checklist (Edit → “Find coordinates on OpenStreetMap”). Nothing is estimated for records without coordinates.</div>`;
    else {
      h += `<section class="card pad"><h2>A. Nearest first — from ${esc(K.origin.name)}</h2><p class="small muted">Straight-line estimates from the start point, in kilometres. Not road distances.</p><ol class="near">${p.byDist.slice(0, 15).map((x) => `<li><span><a href="#/destination/${enc(x.l.id)}">${esc(nm(x.l))}</a><small class="muted">${esc(x.l.passportDistrict)}</small></span><b>${esc(G.label(x.d))}</b></li>`).join('')}</ol></section>`;
      const trips = []; for (let i = 0; i < p.ordered.length; i += PL.perTrip) trips.push(p.ordered.slice(i, i + PL.perTrip));
      h += `<section class="card pad"><h2>B. Proximity-based suggested order</h2><p class="small">${p.ordered.length} stop${p.ordered.length === 1 ? '' : 's'}${p.truncated ? ` (the ${PL.max} nearest of ${p.cand.length} — raise “max stops” for more)` : ''}. This is a <strong>proximity-based suggested order</strong> (always go to the nearest unvisited stop next) — <em>not</em> an optimised driving route. Leg distances are straight-line estimates.</p>
        <div class="big-map plan-map" id="pl-map" role="region" aria-label="Route map"></div>
        <ol class="stops">${p.ordered.map((l, i) => `<li><span class="num">${i + 1}</span><div><strong><a href="#/destination/${enc(l.id)}">${esc(nm(l))}</a></strong><small class="muted">${esc(l.passportDistrict)} · ${esc(G.label(p.legs[i]))} from ${i ? 'previous stop' : esc(K.origin.name)}</small>
          <div class="btn-row tight"><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="${G.googleMaps(l)}">Google Maps</a><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="${G.osm(l)}">OpenStreetMap</a>${l.postOffice && l.address ? `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="${G.googleMapsAddr(l.postOffice + ', ' + l.address)}">By address</a>` : ''}</div></div></li>`).join('')}</ol>
        <p><button class="btn btn-primary" type="button" data-road ${p.ordered.length > 25 ? 'disabled' : ''}>Get road route (OSRM)</button> <span class="small muted">Uses the free public OSRM server. If it is unavailable, the straight-line estimates above stay as they are.</span></p><div id="pl-road" role="status">${roadHTML()}</div></section>
        <section class="card pad"><h2>C. Suggested trips</h2><p class="small muted">You can’t do everything in one go. The stops are cut into trips of ${PL.perTrip} in the order above — a convenience grouping by proximity, not an optimised plan. Each trip is measured from your start point.</p>
        ${trips.map((t, i) => { let cur = K.origin, km = 0; t.forEach((l) => { km += G.haversine(cur, l); cur = l; }); return `<div class="trip"><strong>Trip ${i + 1}</strong> · ${t.map((l) => '#' + l.serial).join(' → ')} · ${esc(G.label({ km, type: 'straight' }))} (one way, via the stops)<br><small class="muted">${t.map((l) => esc(K.dn(l))).join(' → ')}</small></div>`; }).join('')}</section>`;
    }
    const byD = {}; p.all.forEach((l) => { (byD[l.districtOrder] = byD[l.districtOrder] || []).push(l); });
    h += `<section class="card pad"><h2>D. District checklist</h2><p class="small muted">Every destination in the selected districts — including those without coordinates. Tick “Visited” only when you have been there.</p>${K.DISTRICTS.filter((d) => byD[d.order]).map((d) => `<h3>${d.order}. ${esc(d.name)} <small class="muted">p.${d.page}</small></h3><ul class="check">${byD[d.order].map((l) => `<li><label class="pick"><input type="checkbox" data-visit="${esc(l.id)}" ${l.visited ? 'checked' : ''}> <span>#${l.serial} ${l.name ? esc(l.name) : '<em class="muted">name pending</em>'}${l.lat == null ? ' <small class="muted">(no coordinates)</small>' : ''}</span></label><label class="sr" for="pd-${esc(l.id)}">Planned visit date for ${l.serial}</label><input id="pd-${esc(l.id)}" type="date" data-pdate="${esc(l.id)}" value="${esc(l.plannedDate)}" title="Planned visit date"></li>`).join('')}</ul>`).join('')}</section>`;
    return h;
  }
  function roadHTML() {
    if (PL.roadErr) return `<div class="warn">Road routing is unavailable (${esc(PL.roadErr)}). Showing straight-line estimates only — these are <strong>not</strong> road distances.</div>`;
    const r = PL.road; if (!r) return '';
    return `<div class="callout"><strong>Road route (OSRM public server)</strong>: ${esc(G.label({ km: r.km, type: 'road' }))}, estimated driving time about ${Math.round(r.minutes)} min without stops — a model estimate, not a timetable.<br><small class="muted">${r.legs.map((l, i) => 'Leg ' + (i + 1) + ': ' + Math.round(l.km) + ' km').join(' · ')}</small></div>`;
  }
  function drawMap(root) {
    const p = PL.plan, el = $('#pl-map', root); if (!el || !p || !p.ordered.length) return;
    K.map.mount(el, [], { interactive: true }).then((ctl) => { if (!ctl) return; root._ctl = ctl; const stops = p.ordered.map((l) => ({ lat: l.lat, lng: l.lng, label: K.dn(l) }));
      ctl.showRoute(K.origin, stops, PL.road ? PL.road.line : null, PL.road ? 'road' : 'proximity'); });
  }
  V.planner = () => ({ title: 'Journey planner — K_24 Karnataka Post Trails', desc: 'Plan passport trips by distance from Mysuru, Bengaluru or your own start, with honest straight-line or road-routing labels.',
    html: `<div class="wrap">${pageHead('Journey planner', 'Pick a start and some districts. Distances are labelled for what they are.')}
      <form class="card pad planner-form" id="pl-form"><div class="fields"><div class="field"><label>Start from</label>${K.originHTML('pl-o')}</div>
        <div class="field"><label for="pl-max">Max stops to suggest (1–25)</label><input id="pl-max" type="number" min="1" max="25" value="${PL.max}"></div>
        <div class="field"><label for="pl-per">Stops per trip (1–10)</label><input id="pl-per" type="number" min="1" max="10" value="${PL.perTrip}"></div>
        <div class="field field-check"><label><input type="checkbox" id="pl-un" ${PL.onlyUnvisited ? 'checked' : ''}> <span>Only destinations I haven’t visited</span></label></div></div>
        <fieldset class="picker"><legend>Districts (none ticked = all 30)</legend>${K.DISTRICTS.map((d) => `<label class="pick"><input type="checkbox" value="${d.order}" ${PL.districts.includes(d.order) ? 'checked' : ''}> <span>${d.order}. ${esc(d.name)}</span></label>`).join('')}</fieldset>
        <div class="btn-row"><button class="btn btn-primary" type="submit">Plan</button><button class="btn btn-ghost" type="button" data-clear>Clear districts</button></div></form>
      <div id="pl-out" aria-live="polite">${PL.plan ? '' : '<p class="note">Choose districts and press Plan. Distances need coordinates — records without them are listed but never given an invented distance.</p>'}</div></div>`,
    after(root) {
      const out = $('#pl-out', root), show = () => { out.innerHTML = resultHTML(); K.anim.listIn(out); drawMap(root); };
      const read = () => { PL.max = Math.max(1, Math.min(25, parseInt($('#pl-max', root).value, 10) || 10)); PL.perTrip = Math.max(1, Math.min(10, parseInt($('#pl-per', root).value, 10) || 4)); PL.onlyUnvisited = $('#pl-un', root).checked; PL.districts = $$('.picker input:checked', root).map((i) => Number(i.value)); };
      const run = () => { read(); PL.road = null; PL.roadErr = ''; PL.plan = compute(); show(); };
      K.bindOrigin(root, 'pl-o', () => { if (PL.plan) run(); });
      $('#pl-form', root).addEventListener('submit', (e) => { e.preventDefault(); run(); });
      $('[data-clear]', root).addEventListener('click', () => { $$('.picker input', root).forEach((i) => (i.checked = false)); });
      if (PL.plan) show();
      out.addEventListener('click', async (e) => { const b = e.target.closest('[data-road]'); if (!b) return; b.disabled = true; b.textContent = 'Routing…';
        try { PL.road = await G.osrmRoute([K.origin].concat(PL.plan.ordered)); PL.roadErr = ''; } catch (x) { PL.road = null; PL.roadErr = x.name === 'AbortError' ? 'the service timed out' : x.message; }
        $('#pl-road', root).innerHTML = roadHTML(); b.disabled = false; b.textContent = 'Get road route (OSRM)'; if (root._ctl && PL.plan) root._ctl.showRoute(K.origin, PL.plan.ordered.map((l) => ({ lat: l.lat, lng: l.lng, label: K.dn(l) })), PL.road ? PL.road.line : null, PL.road ? 'road' : 'proximity'); });
      out.addEventListener('change', (e) => { const t = e.target;
        if (t.dataset.visit) { const l = S.find('passport', t.dataset.visit); if (l) { S.upsert('passport', Object.assign({}, l, { visited: t.checked })); K.toast(t.checked ? 'Marked visited.' : 'Marked not visited.'); } }
        else if (t.dataset.pdate) { const l = S.find('passport', t.dataset.pdate); if (l) S.upsert('passport', Object.assign({}, l, { plannedDate: t.value })); } });
    } });
})();
(window.K24.mods = window.K24.mods || {})['planner'] = '2026.10.20a';
