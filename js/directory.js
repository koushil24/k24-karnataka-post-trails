/* Passport checklist (#/passport) and district-wise directory + map (#/explore). The 100 records are fixed; you fill in verified details. */
(function () {
  const K = window.K24, S = K.store, G = K.geo, { esc, safeUrl, fmtDate, $, $$ } = K, { ic, empty, pageHead, enc } = K.c, V = K.views;
  K.dn = (l) => l.name || ('Destination ' + l.serial + ' — name pending');
  const VER = { verified: ['chip-visited', 'Fully verified'], partial: ['chip-planned', 'Partially verified'], pending: ['chip-pending', 'Pending verification'] };
  K.vchip = (l) => { const v = S.verification(l); return `<span class="chip ${VER[v][0]}" title="${esc(v === 'verified' ? 'All fields and an official source are recorded.' : 'Missing: ' + (S.missing(l).join(', ') || 'everything'))}">${VER[v][1]}</span>`; };

  /* ---------- origin (shared with planner) ---------- */
  K.origin = (function () { try { const o = JSON.parse(localStorage.getItem('k24.origin')); if (o && isFinite(o.lat) && isFinite(o.lng)) return o; } catch (e) {} return G.ORIGINS[0]; })();
  K.setOrigin = (o) => { K.origin = o; try { localStorage.setItem('k24.origin', JSON.stringify(o)); } catch (e) {} };
  K.originHTML = (id) => `<label class="origin"><span class="sr">Starting point for distances</span><select id="${id}" aria-label="Starting point for distances">${G.ORIGINS.map((o) => `<option value="${o.id}" ${K.origin.id === o.id ? 'selected' : ''}>From ${esc(o.name)}</option>`).join('')}<option value="custom" ${K.origin.id === 'custom' ? 'selected' : ''}>From custom location${K.origin.id === 'custom' ? ' (' + esc(K.origin.name) + ')' : '…'}</option></select></label>`;
  K.bindOrigin = (root, id, onChange) => {
    const sel = $('#' + id, root); if (!sel) return;
    sel.addEventListener('change', () => {
      if (sel.value !== 'custom') { K.setOrigin(G.ORIGINS.find((o) => o.id === sel.value)); onChange(); return; }
      K.form({ title: 'Custom starting point', intro: 'Enter the latitude and longitude of your start (e.g. copy them from a map app).', fields: [
        { name: 'name', label: 'Name', required: true, max: 60 }, { name: 'lat', label: 'Latitude', type: 'number', step: 'any', required: true, validate: (v) => (v >= 5 && v <= 37 ? '' : 'Must be inside India (about 5–37).') },
        { name: 'lng', label: 'Longitude', type: 'number', step: 'any', required: true, validate: (v) => (v >= 67 && v <= 98 ? '' : 'Must be inside India (about 67–98).') }],
        values: K.origin.id === 'custom' ? K.origin : {}, onSubmit(d) { K.setOrigin({ id: 'custom', name: d.name, lat: d.lat, lng: d.lng, note: 'custom' }); onChange(); } })
        .addEventListener('close', () => { sel.value = K.origin.id; });
    });
  };
  const distOf = (l) => (l.lat != null ? G.straight(K.origin, l) : null);

  /* ---------- OSM geocoding (user-initiated, cached, one request per click) ---------- */
  K.geocode = async (q) => {
    const key = 'k24.geo.' + q.toLowerCase();
    try { const c = localStorage.getItem(key); if (c) return JSON.parse(c); } catch (e) {}
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=' + enc(q), { signal: ctrl.signal });
      if (!r.ok) throw new Error('Search service returned HTTP ' + r.status);
      const j = await r.json(), out = j[0] ? { lat: +j[0].lat, lng: +j[0].lon, name: j[0].display_name } : null;
      try { localStorage.setItem(key, JSON.stringify(out)); } catch (e) {} return out;
    } finally { clearTimeout(t); }
  };

  /* ---------- edit dialog ---------- */
  const COMM = { 'Bengaluru': ['Bengaluru Urban', 'Bengaluru Rural'], 'Chikkaballapura': ['Chikkaballapur'], 'Chamarajanagara': ['Chamarajanagar'], 'Yadagiri': ['Yadgir'] };
  function fields(l) {
    const comm = COMM[l.passportDistrict] || [l.passportDistrict];
    const cands = K.CANDIDATES.filter((c) => comm.includes(c[2]));
    return [
      { name: 'candidate', label: 'Pick from the UNOFFICIAL candidate list (' + comm.join(' / ') + ')', type: 'select', full: true, options: cands.map((c) => ({ v: c[0], l: c[1] + ' — ' + c[3] + (c[5] ? ' (source flags: needs verification)' : '') })), help: 'Fills the name and post office below as a starting point only. Check them against your passport page and the official India Post sources.' },
      { name: 'name', label: 'Destination name (as printed in the passport)', full: true, max: 120 },
      { name: 'postOffice', label: 'Designated post office (actual name)', full: true, max: 160, help: 'Keep this separate from the destination name even if they differ.' },
      { name: 'postOfficeType', label: 'Post office type', type: 'select', options: K.POST_OFFICE_TYPES },
      { name: 'pin', label: 'Official PIN code', inputmode: 'numeric', max: 6, validate: (v) => (/^\d{6}$/.test(v) ? '' : 'PIN codes have 6 digits.') },
      { name: 'passportPage', label: 'Passport page number (as printed)', type: 'number', min: 1, step: 1, help: 'Index says this district starts on p.' + l.indexPage + (l.pageInferred ? '; this record is probably p.' + l.pageInferred + ' (2 pages each) — confirm.' : '.') },
      { name: 'address', label: 'Verified address', type: 'textarea', rows: 2, full: true, max: 400 },
      { name: 'source', label: 'Official source link (India Post / Karnataka Postal Circle)', type: 'url', full: true, max: 300, placeholder: 'https://www.indiapost.gov.in/…', help: 'A record only counts as “fully verified” with an official source link (indiapost.gov.in, karnatakapost.gov.in, data.gov.in) and a verification date.' },
      { name: 'verifiedDate', label: 'Last verified on', type: 'date' },
      { name: 'lat', label: 'Latitude', type: 'number', step: 'any', validate: (v) => (v >= 11.4 && v <= 18.6 ? '' : 'Outside Karnataka (11.4–18.6).') },
      { name: 'lng', label: 'Longitude', type: 'number', step: 'any', validate: (v) => (v >= 73.8 && v <= 78.7 ? '' : 'Outside Karnataka (73.8–78.7).') },
      { name: 'coordStatus', label: 'Coordinate status', type: 'select', required: true, options: [{ v: 'none', l: 'None' }, { v: 'geocoded', l: 'From map search — not confirmed' }, { v: 'verified', l: 'Confirmed by me against the post office location' }] },
      { name: 'coordSource', label: 'Coordinate source', max: 200, placeholder: 'e.g. OpenStreetMap, India Post locator' },
      { name: 'planned', label: 'Planned', type: 'checkbox' }, { name: 'plannedDate', label: 'Planned visit date', type: 'date' },
      { name: 'visited', label: 'Visited', type: 'checkbox', help: 'Only tick once you have actually been there.' }, { name: 'visitDate', label: 'Visit date', type: 'date' },
      { name: 'cancellationCollected', label: 'Cancellation collected', type: 'checkbox' }, { name: 'blogPublished', label: 'Blog published', type: 'checkbox' },
      { name: 'blogUrl', label: 'Blog URL', type: 'url', full: true }, { name: 'history', label: 'Postal heritage significance', type: 'textarea', rows: 3, full: true },
      { name: 'notes', label: 'Notes / my travel story', type: 'textarea', rows: 4, full: true }, { name: 'photos', label: 'Photo links (one https:// link per line)', type: 'textarea', rows: 3, full: true, help: 'Only your own photographs or licensed images.' }];
  }
  K.editLocation = (id, done) => {
    const cur = S.find('passport', id); if (!cur) return;
    const d = K.form({ title: '#' + cur.serial + ' · ' + cur.passportDistrict, fields: fields(cur), values: Object.assign({}, cur, { photos: (cur.photos || []).join('\n'), candidate: '' }),
      onSubmit(v) {
        const cand = K.CANDIDATES.find((c) => c[0] === v.candidate); delete v.candidate;
        v.photos = String(v.photos || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
        if (cand && cand[1] === v.name) v.nameSource = 'Unofficial community list (philatelypassport.in) — not confirmed'; else if (v.name !== cur.name) v.nameSource = 'Entered by me';
        if (v.lat === '' || v.lng === '') { v.lat = null; v.lng = null; v.coordStatus = 'none'; } else if (v.coordStatus === 'none') v.coordStatus = 'geocoded';
        S.upsert('passport', Object.assign({}, cur, v)); K.toast('Saved #' + cur.serial + '.'); if (done) done(cur.id);
      } });
    const pick = $('#f-candidate', d);
    if (pick) pick.addEventListener('change', () => { const c = K.CANDIDATES.find((x) => x[0] === pick.value); if (c) { $('#f-name', d).value = c[1]; $('#f-postOffice', d).value = c[3]; } });
    const box = document.createElement('div'); box.className = 'geo-tools full';
    box.innerHTML = '<button type="button" class="btn btn-ghost btn-sm" data-geo>Find coordinates on OpenStreetMap</button> <span class="small muted" data-geo-out role="status"></span>';
    $('#f-coordStatus', d).closest('.field').before(box);
    $('[data-geo]', box).addEventListener('click', async () => {
      const out = $('[data-geo-out]', box), q = ($('#f-name', d).value || $('#f-postOffice', d).value).trim();
      if (!q) { out.textContent = 'Enter the destination name or post office first.'; return; }
      out.textContent = 'Searching…';
      try { const r = await K.geocode(q + ', ' + cur.currentDistrict.replace(/ \(.*/, '') + ', Karnataka, India'); if (!r) { out.textContent = 'No match found. Enter coordinates manually.'; return; }
        out.innerHTML = esc(r.name.slice(0, 110)) + ' — <button type="button" class="linkish" data-use>use these coordinates</button>';
        $('[data-use]', out).addEventListener('click', () => { $('#f-lat', d).value = r.lat.toFixed(5); $('#f-lng', d).value = r.lng.toFixed(5); $('#f-coordStatus', d).value = 'geocoded'; $('#f-coordSource', d).value = 'OpenStreetMap Nominatim search (unconfirmed)'; });
      } catch (e) { out.textContent = 'Map search is unavailable right now (' + e.message + '). You can still type coordinates.'; }
    });
  };

  /* ---------- progress bar ---------- */
  function progress(st) {
    const w = (n) => (st.total ? (n / st.total) * 100 : 0);
    return `<div class="card pad prog"><div class="prog-top"><h2>Verification progress</h2><strong class="big-num">${st.verified}<small> / ${st.total}</small> verified</strong></div>
      <div class="seg" role="img" aria-label="${st.verified} fully verified, ${st.partial} partially verified, ${st.pending} pending of ${st.total}"><i class="s-v" style="width:${w(st.verified)}%"></i><i class="s-p" style="width:${w(st.partial)}%"></i></div>
      <ul class="seg-key"><li><i class="s-v"></i>Fully verified <b>${st.verified}</b></li><li><i class="s-p"></i>Partially verified <b>${st.partial}</b></li><li><i class="s-n"></i>Pending <b>${st.pending}</b></li></ul>
      <p class="small muted">“Fully verified” needs destination, post office, 6-digit PIN, confirmed coordinates, an official source link and a verification date. Nothing is marked verified automatically.</p>
      <div class="stats three"><div class="stat"><strong>${st.visited}<small> / ${st.total}</small></strong><span class="stat-l">Visited</span></div><div class="stat"><strong>${st.cancel}</strong><span class="stat-l">Cancellations collected</span></div><div class="stat"><strong>${st.withCoords}</strong><span class="stat-l">With coordinates</span></div></div></div>`;
  }

  /* ================= PASSPORT CHECKLIST ================= */
  const P = { q: '', district: '', ver: '', visit: '', sort: 'serial', page: 1, size: 25 };
  const SORTS = { serial: 'Original passport order', district: 'District (A–Z)', pin: 'PIN code', distance: 'Distance from start', name: 'Destination name' };
  function filtered() {
    const q = P.q.toLowerCase();
    const r = S.list('passport').filter((l) => (!P.district || String(l.districtOrder) === P.district) && (!P.ver || S.verification(l) === P.ver) && (P.visit !== 'visited' || l.visited) && (P.visit !== 'unvisited' || !l.visited)
      && (!q || [K.dn(l), l.postOffice, l.pin, l.passportDistrict, l.currentDistrict, l.serial].join(' ').toLowerCase().includes(q)));
    const byS = (a, b) => a.serial - b.serial;
    const cmp = { serial: byS, district: (a, b) => a.passportDistrict.localeCompare(b.passportDistrict) || byS(a, b), name: (a, b) => (a.name ? 0 : 1) - (b.name ? 0 : 1) || a.name.localeCompare(b.name) || byS(a, b),
      pin: (a, b) => (a.pin ? 0 : 1) - (b.pin ? 0 : 1) || a.pin.localeCompare(b.pin) || byS(a, b),
      distance: (a, b) => { const x = distOf(a), y = distOf(b); return (x ? 0 : 1) - (y ? 0 : 1) || (x && y ? x.km - y.km : 0) || byS(a, b); } };
    return r.sort(cmp[P.sort] || byS);                       // serial numbers are never changed, only the order shown
  }
  const pageCell = (l) => (l.passportPage ? esc(l.passportPage) : l.pageInferred ? `<small title="Inferred from the passport index (district starts p.${l.indexPage}, 2 pages per destination). Confirm and enter the real page.">≈ ${l.pageInferred}</small>` : '<small>Not available</small>');
  const distCell = (l) => { const d = distOf(l); return d ? `${G.label(d)}` : '<small>Not available (no coordinates)</small>'; };
  function rowHTML(l) {
    return `<tr data-id="${esc(l.id)}"><td data-label="Serial"><b>${l.serial}</b></td>
      <td data-label="Destination"><a href="#/destination/${enc(l.id)}">${l.name ? esc(l.name) : '<em class="muted">Name pending</em>'}</a><br><small class="muted">${esc(l.passportDistrict)}${l.currentDistrict !== l.passportDistrict ? ' · now ' + esc(l.currentDistrict) : ''}</small></td>
      <td data-label="Post office">${l.postOffice ? esc(l.postOffice) + (l.postOfficeType ? '<br><small class="muted">' + esc(l.postOfficeType) + '</small>' : '') : '<small>Not available</small>'}</td>
      <td data-label="PIN">${l.pin ? esc(l.pin) : '<small>Pending verification</small>'}</td><td data-label="Passport page">${pageCell(l)}</td>
      <td data-label="Verification">${K.vchip(l)}${l.visited ? ' <span class="chip chip-visited">Visited</span>' : ''}</td><td data-label="Distance"><small>${distCell(l)}</small></td>
      <td data-label="Actions" class="actions"><a class="btn btn-ghost btn-sm" href="#/destination/${enc(l.id)}">View</a><button class="btn btn-ghost btn-sm" data-edit="${esc(l.id)}" aria-label="Edit record ${l.serial}">${ic('edit')} Edit</button></td></tr>`;
  }
  function printSheet() {
    let sheet = $('#print-sheet'); if (sheet) sheet.remove(); sheet = document.createElement('div'); sheet.id = 'print-sheet';
    const by = {}; S.list('passport').forEach((l) => { (by[l.districtOrder] = by[l.districtOrder] || []).push(l); });
    sheet.innerHTML = `<h1>K_24 Karnataka Post Trails — Passport checklist</h1><p>Printed ${esc(new Date().toLocaleDateString('en-IN'))}. ☐ = not collected. Details marked “pending” are not yet verified.</p>` + K.DISTRICTS.map((d) => `<h2>${d.order}. ${esc(d.name)} <small>(passport p.${d.page})</small></h2><table>${(by[d.order] || []).map((l) => `<tr><td>${l.cancellationCollected ? '☑' : '☐'}</td><td>${l.serial}</td><td>${esc(K.dn(l))}</td><td>${esc(l.postOffice || '—')}</td><td>${esc(l.pin || '—')}</td></tr>`).join('')}</table>`).join('');
    document.body.appendChild(sheet); window.print(); setTimeout(() => sheet.remove(), 1500);
  }
  function draw(root) {
    const st = S.stats(); $('#p-prog', root).innerHTML = progress(st);
    const list = filtered(), pages = Math.max(1, Math.ceil(list.length / P.size)); P.page = Math.min(P.page, pages);
    const from = (P.page - 1) * P.size, slice = list.slice(from, from + P.size), box = $('#p-list', root);
    box.innerHTML = slice.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Serial</th><th>Destination</th><th>Post office</th><th>PIN</th><th>Passport page</th><th>Status</th><th>Distance from ${esc(K.origin.name)}</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${slice.map(rowHTML).join('')}</tbody></table></div>` : empty('No records match', 'Clear a filter or the search box.');
    $('#p-foot', root).innerHTML = list.length ? `<span>Showing ${from + 1}–${from + slice.length} of ${list.length}</span><span class="pager"><button class="btn btn-ghost btn-sm" data-page="-1" ${P.page <= 1 ? 'disabled' : ''}>Previous</button><b>Page ${P.page} of ${pages}</b><button class="btn btn-ghost btn-sm" data-page="1" ${P.page >= pages ? 'disabled' : ''}>Next</button></span>` : '';
    K.anim.listIn(box);
  }
  async function importFile(root) {
    const f = await K.pickFile('.csv,.json,text/csv,application/json'); if (!f) return;
    try {
      if (/\.csv$/i.test(f.name)) { const items = S.importCSV(f.text); if (await K.confirm('Update the matching records from ' + items.length + ' CSV rows? Rows are matched by serial/id; the 100 records themselves cannot be added or removed.', 'Import')) { const r = S.mergePassport(items); K.toast(r.updated + ' updated' + (r.skipped ? ', ' + r.skipped + ' skipped (unknown serial)' : '') + '.'); } else return; }
      else { const data = JSON.parse(f.text);
        if (Array.isArray(data)) { if (await K.confirm('Update matching records from ' + data.length + ' JSON rows?', 'Import')) { const r = S.mergePassport(data.filter((x) => x && typeof x === 'object')); K.toast(r.updated + ' updated.'); } else return; }
        else if (await K.confirm('Replace ALL data (directory edits, blogs, collection, expenses) with this backup?', 'Replace everything')) { S.importJSON(f.text); K.toast('Backup restored.'); } else return; }
      draw(root);
    } catch (e) { K.toast(e.message || 'Import failed.', 'error'); }
  }
  V.passport = () => ({ title: 'Passport checklist — K_24 Karnataka Post Trails', desc: 'Checklist of all 100 Karnataka Philately Passport destinations with verification status, post offices, PIN codes and distances.',
    html: `<div class="wrap">${pageHead('Passport checklist', 'All 100 destinations in the original passport order, with honest verification status.', `<div class="head-tools"><button class="btn btn-ghost" data-print>Print checklist</button><details class="menu"><summary class="btn btn-ghost">Import / export</summary><div class="menu-pop"><button data-exp="verified">Export verified records (CSV)</button><button data-exp="all">Export all 100 records (CSV)</button><button data-exp="backup">Full backup (JSON)</button><button data-import>Import CSV or JSON…</button></div></details></div>`)}
      ${S.migrated ? '<p class="note">Your earlier demo locations were replaced by the 100-record passport directory. Blogs, collection and expenses were kept.</p>' : ''}
      <div id="p-prog"></div>
      <div class="toolbar"><label class="search"><span class="sr">Search</span>${ic('search')}<input type="search" id="p-q" placeholder="Search destination, post office, district or PIN…" value="${esc(P.q)}"></label>
        <div class="filters"><label><span class="sr">District</span><select id="p-d"><option value="">All 30 districts</option>${K.DISTRICTS.map((d) => `<option value="${d.order}" ${P.district === String(d.order) ? 'selected' : ''}>${d.order}. ${esc(d.name)}</option>`).join('')}</select></label>
          <label><span class="sr">Verification</span><select id="p-v"><option value="">All verification</option><option value="verified" ${P.ver === 'verified' ? 'selected' : ''}>Fully verified</option><option value="partial" ${P.ver === 'partial' ? 'selected' : ''}>Partially verified</option><option value="pending" ${P.ver === 'pending' ? 'selected' : ''}>Pending</option></select></label>
          <label><span class="sr">Visit status</span><select id="p-vi"><option value="">Visited or not</option><option value="visited" ${P.visit === 'visited' ? 'selected' : ''}>Visited</option><option value="unvisited" ${P.visit === 'unvisited' ? 'selected' : ''}>Not visited</option></select></label>
          <label><span class="sr">Sort</span><select id="p-s">${Object.keys(SORTS).map((k) => `<option value="${k}" ${P.sort === k ? 'selected' : ''}>Sort: ${SORTS[k]}</option>`).join('')}</select></label>${K.originHTML('p-o')}</div></div>
      <div id="p-list" aria-live="polite"></div><div id="p-foot" class="foot-row"></div>
      <p class="note">Distances here are <strong>straight-line estimates</strong> from the chosen start, not road distances. Serial numbers never change when you sort or filter. Data is stored only in this browser — export a backup.</p></div>`,
    after(root) {
      draw(root); const re = () => draw(root);
      $('#p-q', root).addEventListener('input', K.debounce((e) => { P.q = e.target.value; P.page = 1; re(); }, 180));
      [['p-d', 'district'], ['p-v', 'ver'], ['p-vi', 'visit']].forEach(([id, k]) => $('#' + id, root).addEventListener('change', (e) => { P[k] = e.target.value; P.page = 1; re(); }));
      $('#p-s', root).addEventListener('change', (e) => { P.sort = e.target.value; P.page = 1; re(); }); K.bindOrigin(root, 'p-o', re);
      root.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.page) { P.page += Number(b.dataset.page); re(); } else if (b.dataset.edit) K.editLocation(b.dataset.edit, re);
        else if (b.hasAttribute('data-print')) printSheet(); else if (b.hasAttribute('data-import')) { b.closest('details').open = false; importFile(root); }
        else if (b.dataset.exp) { b.closest('details').open = false; const d = new Date().toISOString().slice(0, 10);
          if (b.dataset.exp === 'verified') { const n = S.stats().verified; if (!n) { K.toast('No record is fully verified yet, so there is nothing to export. Use “all records” instead.', 'error'); return; } K.download('k24-verified-directory-' + d + '.csv', S.exportVerifiedCSV(), 'text/csv'); }
          else if (b.dataset.exp === 'all') K.download('k24-all-records-' + d + '.csv', S.exportCSV(), 'text/csv'); else K.download('k24-backup-' + d + '.json', S.exportJSON(), 'application/json'); } });
    } });

  /* ================= EXPLORE: district directory + map ================= */
  const E = { district: '', ver: '', visit: '', pane: 'list', open: {} };
  V.explore = (ctx) => {
    const focus = ctx.q.get('id') || '', st = S.stats();
    return { title: 'Explore Karnataka — K_24 Karnataka Post Trails', desc: 'District-wise directory of all 100 Karnataka Philately Passport destinations with an interactive map.',
      html: `<div class="wrap">${pageHead('Explore Karnataka', 'District by district, in the original passport order — with the map beside it.')}
        <div class="toolbar"><div class="filters"><label><span class="sr">District</span><select id="e-d"><option value="">All 30 districts</option>${K.DISTRICTS.map((d) => `<option value="${d.order}" ${E.district === String(d.order) ? 'selected' : ''}>${d.order}. ${esc(d.name)}</option>`).join('')}</select></label>
          <label><span class="sr">Verification</span><select id="e-v"><option value="">All verification</option><option value="verified">Fully verified</option><option value="partial">Partially verified</option><option value="pending">Pending</option></select></label>
          <label><span class="sr">Visit status</span><select id="e-vi"><option value="">Visited or not</option><option value="visited">Visited</option><option value="unvisited">Not visited</option></select></label></div>
          <div class="pills pane-toggle" role="group" aria-label="Show"><button class="pill ${E.pane === 'list' ? 'on' : ''}" data-pane="list" aria-pressed="${E.pane === 'list'}">Directory</button><button class="pill ${E.pane === 'map' ? 'on' : ''}" data-pane="map" aria-pressed="${E.pane === 'map'}">Map</button></div></div>
        <div class="xplore" data-pane="${E.pane}"><section class="xl" aria-label="District directory"><div class="xl-tools"><button class="btn btn-ghost btn-sm" data-all="open">Expand all</button><button class="btn btn-ghost btn-sm" data-all="close">Collapse all</button><span class="small muted">${st.verified} of ${st.total} verified</span></div><div id="e-list"></div></section>
          <section class="xm" aria-label="Map"><form class="map-search" id="e-search" role="search"><label class="sr" for="e-q">Search for a place on the map</label><input id="e-q" type="search" placeholder="Find a place on the map (e.g. Hampi)…" maxlength="80"><button class="btn btn-primary btn-sm" type="submit">Find</button></form>
            <div id="e-warn" class="warn" hidden></div><div class="big-map" id="e-map" role="region" aria-label="Map of Karnataka passport destinations"></div>
            <div class="legend" aria-label="Map legend">${['planned', 'visited', 'cancel', 'blog'].map((k) => `<span><i style="background:${K.map.COLORS[k]}"></i>${K.map.LABELS[k]}</span>`).join('')}<span><i class="est-dot"></i>Dashed outline = coordinates not yet confirmed</span></div>
            <p class="note">Only destinations with coordinates get a marker; none are guessed. ${st.withCoords} of ${st.total} have coordinates.</p></section></div></div>`,
      after(root) {
        let ctl = null;
        const sel = () => S.list('passport').filter((l) => (!E.district || String(l.districtOrder) === E.district) && (!E.ver || S.verification(l) === E.ver) && (E.visit !== 'visited' || l.visited) && (E.visit !== 'unvisited' || !l.visited));
        const item = (l) => { const has = l.lat != null; return `<li id="x-${esc(l.id)}" class="xi"><span class="xs">${l.serial}</span><div class="xb"><a href="#/destination/${enc(l.id)}"><strong>${l.name ? esc(l.name) : '<em class="muted">Name pending</em>'}</strong></a>
          <small class="muted">${l.postOffice ? esc(l.postOffice) : 'Post office: not available'} · PIN ${l.pin ? esc(l.pin) : 'pending'} · p.${l.passportPage ? esc(l.passportPage) : (l.pageInferred ? '≈' + l.pageInferred : '—')}</small><div class="chips">${K.vchip(l)}</div></div>
          <div class="xa">${has ? `<button class="btn btn-ghost btn-sm" data-show="${esc(l.id)}">Show on map</button>` : '<small class="muted" title="No coordinates have been entered for this destination, so nothing is plotted.">No coordinates</small>'}</div></li>`; };
        const drawList = () => {
          const by = {}; sel().forEach((l) => { (by[l.districtOrder] = by[l.districtOrder] || []).push(l); });
          const ds = K.DISTRICTS.filter((d) => by[d.order]);
          $('#e-list', root).innerHTML = ds.length ? ds.map((d) => { const rows = by[d.order], v = rows.filter((l) => S.verification(l) === 'verified').length, open = E.open[d.order] || (E.district && ds.length === 1);
            return `<article class="dist ${open ? 'open' : ''}" data-d="${d.order}"><button class="dist-head" type="button" aria-expanded="${!!open}" aria-controls="dl-${d.order}"><span class="dn">${d.order}</span><span class="dt"><strong>${esc(d.name)}</strong><small>${rows.length} destination${rows.length === 1 ? '' : 's'} · #${d.first}${d.last > d.first ? '–' + d.last : ''} · passport p.${d.page}</small></span><span class="dp" aria-label="${v} of ${rows.length} verified"><i style="width:${(v / rows.length) * 100}%"></i></span><span class="dc" aria-hidden="true">▾</span></button>
              <div class="dist-body" id="dl-${d.order}" ${open ? '' : 'hidden'}>${K.DISTRICT_NOTES[d.order] ? `<p class="small muted dist-note">${esc(K.DISTRICT_NOTES[d.order])}</p>` : ''}<ul>${rows.map(item).join('')}</ul></div></article>`; }).join('') : empty('Nothing matches', 'Change the filters.');
        };
        const warn = () => { const w = $('#e-warn', root), l = sel(), n = l.filter((x) => x.lat != null).length; if (!l.length) { w.hidden = true; return; } w.hidden = n > 0 && n === l.length; w.textContent = n === 0 ? 'None of these destinations has coordinates yet, so the map shows no markers. Open a record and use “Find coordinates on OpenStreetMap”, then confirm the position.' : (l.length - n) + ' of ' + l.length + ' destinations here have no coordinates and are not shown on the map.'; };
        const upd = () => { drawList(); warn(); if (ctl) ctl.set(sel()); };
        const hl = (id) => { const li = $('#x-' + CSS.escape(id), root); if (!li) return; const d = li.closest('.dist'); if (d && !d.classList.contains('open')) { d.classList.add('open'); E.open[d.dataset.d] = true; $('.dist-head', d).setAttribute('aria-expanded', 'true'); $('.dist-body', d).hidden = false; } li.scrollIntoView({ block: 'center', behavior: K.reduced() ? 'auto' : 'smooth' }); li.classList.add('hl'); setTimeout(() => li.classList.remove('hl'), 2400); };
        drawList(); warn();
        K.map.mount($('#e-map', root), sel(), { cluster: true, focusId: focus, onMarkerClick: hl, onError() { E.pane = 'list'; $('.xplore', root).dataset.pane = 'list'; K.toast('Map unavailable — the directory still works.', 'error'); } }).then((c) => { ctl = c; if (focus) hl(focus); });
        [['e-d', 'district'], ['e-v', 'ver'], ['e-vi', 'visit']].forEach(([id, k]) => $('#' + id, root).addEventListener('change', (e) => { E[k] = e.target.value; upd(); }));
        $$('[data-pane]', root).forEach((b) => b.addEventListener('click', () => { E.pane = b.dataset.pane; $('.xplore', root).dataset.pane = E.pane; $$('.pane-toggle .pill', root).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); if (ctl) ctl.invalidate(); }));
        root.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
          if (b.classList.contains('dist-head')) { const a = b.closest('.dist'), o = !a.classList.contains('open'); a.classList.toggle('open', o); b.setAttribute('aria-expanded', o); $('.dist-body', a).hidden = !o; E.open[a.dataset.d] = o; }
          else if (b.dataset.all) { K.DISTRICTS.forEach((d) => { E.open[d.order] = b.dataset.all === 'open'; }); drawList(); }
          else if (b.dataset.show) { E.pane = 'map'; $('.xplore', root).dataset.pane = 'map'; $$('.pane-toggle .pill', root).forEach((x) => { const on = x.dataset.pane === 'map'; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); if (ctl) { ctl.invalidate(); setTimeout(() => ctl.focus(b.dataset.show), 120); } hl(b.dataset.show); } });
        $('#e-search', root).addEventListener('submit', async (e) => { e.preventDefault(); const q = $('#e-q', root).value.trim(); if (!q || !ctl) return;
          const local = S.list('passport').find((l) => l.lat != null && K.dn(l).toLowerCase().includes(q.toLowerCase())); if (local) { ctl.focus(local.id); hl(local.id); return; }
          try { const r = await K.geocode(q + ', Karnataka, India'); if (!r) { K.toast('No place found for “' + q + '”.', 'error'); return; } ctl.probe(r.lat, r.lng, r.name.slice(0, 100)); } catch (x) { K.toast('Place search is unavailable right now.', 'error'); } });
      } };
  };
})();
(window.K24.mods = window.K24.mods || {})['directory'] = '2026.10.13b';
