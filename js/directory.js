/* Passport tracker (#/passport) and district-wise directory + map (#/explore) for the 100 post offices read from the scanned passport. */
(function () {
  const K = window.K24, S = K.store, G = K.geo, { esc, safeUrl, fmtDate, $, $$ } = K, { ic, empty, pageHead, enc } = K.c, V = K.views;
  const TYPE_LABEL = { HO: 'Head Office (HO)', SO: 'Sub Office (SO)', BO: 'Branch Office (BO)', GPO: 'General PO (GPO)', MDG: 'MDG (as printed)', '': 'Type not printed' };
  K.dn = (l) => (l.name ? l.name + (l.officeCode ? ' ' + l.officeCode : '') : 'Post office #' + l.serial);
  K.typeLabel = (l) => TYPE_LABEL[l.officeCode] || l.postOfficeType || 'Type not printed';
  const VER = { verified: ['chip-visited', 'Verified'], partial: ['chip-planned', 'Partially verified'], pending: ['chip-pending', 'Pending'] };
  K.vchip = (l) => { const v = S.verification(l); return `<span class="chip ${VER[v][0]}" title="${esc(v === 'verified' ? 'Key fields confirmed against an official source.' : 'Values come from the scanned passport. Still unconfirmed: ' + (S.missing(l).join('; ') || 'everything'))}">${VER[v][1]}</span>`; };
  const NV = '<span class="muted">Not verified</span>';
  const val = (v, empty) => (v ? esc(v) : empty || NV);
  K.describe = (l) => {
    const t = l.postOfficeType && l.postOfficeType !== 'Other' ? 'a ' + l.postOfficeType : (l.officeCode === 'MDG' ? 'a post office (office type printed as “MDG”)' : 'a post office (office type not printed in the passport)');
    let d = `${K.dn(l)} is ${t} in ${l.passportDistrict} district, Karnataka, with PIN ${l.pin}.`;
    if (l.currentDistrict && l.currentDistrict !== l.passportDistrict) d += ` The passport lists the district as ${l.passportDistrict}; its current official name is ${l.currentDistrict}.`;
    if (l.theme) d += ` The passport classifies its pictorial cancellation under “${l.theme}”.`;
    if (l.doi) d += ` The passport prints a date of issue (DOI) of ${fmtDate(l.doi)}.`;
    const miss = [!l.taluk && 'taluk', !l.parentOffice && 'parent office', !l.address && 'address', l.lat == null && 'coordinates'].filter(Boolean);
    return d + (miss.length ? ' Not yet verified: ' + miss.join(', ') + '.' : '');
  };

  /* ---------- origin (shared with planner) ---------- */
  K.origin = (function () { try { const o = JSON.parse(localStorage.getItem('k24.origin')); if (o && isFinite(o.lat) && isFinite(o.lng)) return o; } catch (e) {} return G.ORIGINS[0]; })();
  K.setOrigin = (o) => { K.origin = o; try { localStorage.setItem('k24.origin', JSON.stringify(o)); } catch (e) {} };
  K.originHTML = (id) => `<label class="origin"><span class="sr">Starting point for distances</span><select id="${id}" aria-label="Starting point for distances">${G.ORIGINS.map((o) => `<option value="${o.id}" ${K.origin.id === o.id ? 'selected' : ''}>From ${esc(o.name)}</option>`).join('')}<option value="custom" ${K.origin.id === 'custom' ? 'selected' : ''}>From custom location${K.origin.id === 'custom' ? ' (' + esc(K.origin.name) + ')' : '…'}</option></select></label>`;
  K.bindOrigin = (root, id, onChange) => {
    const sel = $('#' + id, root); if (!sel) return;
    sel.addEventListener('change', () => {
      if (sel.value !== 'custom') { K.setOrigin(G.ORIGINS.find((o) => o.id === sel.value)); onChange(); return; }
      K.form({ title: 'Custom starting point', intro: 'Enter the latitude and longitude of your start.', fields: [
        { name: 'name', label: 'Name', required: true, max: 60 }, { name: 'lat', label: 'Latitude', type: 'number', step: 'any', required: true, validate: (v) => (v >= 5 && v <= 37 ? '' : 'Must be inside India (about 5–37).') },
        { name: 'lng', label: 'Longitude', type: 'number', step: 'any', required: true, validate: (v) => (v >= 67 && v <= 98 ? '' : 'Must be inside India (about 67–98).') }],
        values: K.origin.id === 'custom' ? K.origin : {}, onSubmit(d) { K.setOrigin({ id: 'custom', name: d.name, lat: d.lat, lng: d.lng, note: 'custom' }); onChange(); } })
        .addEventListener('close', () => { sel.value = K.origin.id; });
    });
  };
  const distOf = (l) => (l.lat != null ? G.straight(K.origin, l) : null);
  K.navLinks = (l) => {
    const q = enc((l.name || '') + ' Post Office ' + l.pin + ', ' + l.passportDistrict + ', Karnataka, India');
    if (l.lat != null) { const ok = l.coordStatus === 'verified'; return { verified: ok, html: `<a class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer" href="${G.googleMaps(l)}">Navigate · Google Maps</a><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="${G.osm(l)}">OpenStreetMap</a>`, note: ok ? 'Verified location (coordinates confirmed by you).' : 'Approximate map location — coordinates are not yet confirmed.' }; }
    return { verified: false, html: `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${q}">Search in Google Maps</a><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/search?query=${q}">Search in OpenStreetMap</a>`, note: 'Search link only — built from the post office name and PIN, not a verified location.' };
  };

  /* ---------- OSM geocoding (user-initiated, cached) ---------- */
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
  const PDFF = ['name', 'officeCode', 'postOfficeType', 'pin', 'doi', 'theme'];
  function fields(l) {
    const pd = l.pdf || {};
    return [
      { name: 'name', label: 'Post office name (passport: ' + (pd.placeLine || '').replace('PLACE : ', '') + ')', full: true, max: 120, required: true },
      { name: 'officeCode', label: 'Office code (HO / SO / BO …)', max: 8 },
      { name: 'postOfficeType', label: 'Classification (type)', type: 'select', options: K.POST_OFFICE_TYPES },
      { name: 'pin', label: 'PIN code', inputmode: 'numeric', max: 6, required: true, validate: (v) => (/^\d{6}$/.test(v) ? '' : 'PIN codes have 6 digits.'), help: 'Several offices can share one PIN.' },
      { name: 'doi', label: 'DOI — date of issue (as printed in the passport)', type: 'date' },
      { name: 'theme', label: 'Passport theme (printed as “Classification”)', max: 60 },
      { name: 'taluk', label: 'Taluk', max: 80 }, { name: 'deliveryStatus', label: 'Delivery status', type: 'select', options: ['Delivery', 'Non-delivery'] },
      { name: 'parentOffice', label: 'Parent post office', max: 120 }, { name: 'division', label: 'Postal division', max: 80 },
      { name: 'region', label: 'Postal region', max: 80 }, { name: 'circle', label: 'Postal circle', max: 60, placeholder: 'e.g. Karnataka' },
      { name: 'address', label: 'Exact postal address', type: 'textarea', rows: 2, full: true, max: 400 },
      { name: 'source', label: 'Official source link', type: 'url', full: true, max: 300, placeholder: 'https://www.indiapost.gov.in/…', help: 'Needed (with a date and the ticks below) for “Verified”. Official domains: indiapost.gov.in, karnatakapost.gov.in, data.gov.in.' },
      { name: 'verifiedDate', label: 'Last verified on', type: 'date' },
      { name: 'vfHeader', label: '', type: 'checkbox', full: true, hidden: true },
      ...K.VERIFY_FIELDS.map((f) => ({ name: 'vf_' + f[0], label: 'Confirmed against an official source: ' + f[1], type: 'checkbox' })),
      { name: 'lat', label: 'Latitude', type: 'number', step: 'any', validate: (v) => (v >= 11.4 && v <= 18.6 ? '' : 'Outside Karnataka (11.4–18.6).') },
      { name: 'lng', label: 'Longitude', type: 'number', step: 'any', validate: (v) => (v >= 73.8 && v <= 78.7 ? '' : 'Outside Karnataka (73.8–78.7).') },
      { name: 'coordStatus', label: 'Coordinate status', type: 'select', required: true, options: [{ v: 'none', l: 'None' }, { v: 'geocoded', l: 'From map search — approximate' }, { v: 'verified', l: 'Confirmed against the post office location' }] },
      { name: 'coordSource', label: 'Coordinate source', max: 200, placeholder: 'e.g. OpenStreetMap, India Post locator' },
      { name: 'planned', label: 'Planned', type: 'checkbox' }, { name: 'plannedDate', label: 'Planned visit date', type: 'date' },
      { name: 'visited', label: 'Visited', type: 'checkbox', help: 'Only tick once you have actually been there.' }, { name: 'visitDate', label: 'Visit date', type: 'date' },
      { name: 'cancellationCollected', label: 'Pictorial cancellation (PPC) collected', type: 'checkbox' }, { name: 'blogPublished', label: 'Blog published', type: 'checkbox' },
      { name: 'blogUrl', label: 'Blog URL', type: 'url', full: true },
      { name: 'notes', label: 'Personal notes', type: 'textarea', rows: 4, full: true }, { name: 'photos', label: 'Photo links (one https:// link per line)', type: 'textarea', rows: 3, full: true, help: 'Only your own photographs or licensed images.' }].filter((f) => !f.hidden);
  }
  K.editLocation = (id, done) => {
    const cur = S.find('passport', id); if (!cur) return;
    const vals = Object.assign({}, cur, { photos: (cur.photos || []).join('\n') }); K.VERIFY_FIELDS.forEach((f) => { vals['vf_' + f[0]] = (cur.verifiedFields || []).includes(f[0]); });
    const d = K.form({ title: '#' + cur.serial + ' · ' + K.dn(cur), fields: fields(cur), values: vals,
      onSubmit(v) {
        v.verifiedFields = K.VERIFY_FIELDS.map((f) => f[0]).filter((f) => v['vf_' + f]); K.VERIFY_FIELDS.forEach((f) => delete v['vf_' + f[0]]);
        v.photos = String(v.photos || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
        const edited = new Set(cur.edited || []); PDFF.forEach((f) => { if (String(v[f] || '') !== String(cur[f] || '')) edited.add(f); }); v.edited = Array.from(edited); v.postOffice = v.name;
        if (v.lat === '' || v.lng === '') { v.lat = null; v.lng = null; v.coordStatus = 'none'; } else if (v.coordStatus === 'none') v.coordStatus = 'geocoded';
        S.upsert('passport', Object.assign({}, cur, v)); K.toast('Saved #' + cur.serial + '.'); if (done) done(cur.id);
      } });
    const box = document.createElement('div'); box.className = 'geo-tools full';
    box.innerHTML = '<button type="button" class="btn btn-ghost btn-sm" data-geo>Find coordinates on OpenStreetMap</button> <span class="small muted" data-geo-out role="status"></span>';
    $('#f-lat', d).closest('.field').before(box);
    $('[data-geo]', box).addEventListener('click', async () => {
      const out = $('[data-geo-out]', box), nm = $('#f-name', d).value.trim(); out.textContent = 'Searching…';
      try { const r = await K.geocode(nm + ' post office, ' + cur.passportDistrict + ', Karnataka, India'); if (!r) { out.textContent = 'No match found. Enter coordinates manually.'; return; }
        out.innerHTML = esc(r.name.slice(0, 110)) + ' — <button type="button" class="linkish" data-use>use these coordinates</button>';
        $('[data-use]', out).addEventListener('click', () => { $('#f-lat', d).value = r.lat.toFixed(5); $('#f-lng', d).value = r.lng.toFixed(5); $('#f-coordStatus', d).value = 'geocoded'; $('#f-coordSource', d).value = 'OpenStreetMap Nominatim search (approximate)'; });
      } catch (e) { out.textContent = 'Map search is unavailable right now (' + e.message + '). You can still type coordinates.'; }
    });
  };
  K.setTrack = (l, state) => { S.upsert('passport', Object.assign({}, l, { visited: state === 'visited', planned: state === 'planned' })); };

  /* ---------- progress blocks ---------- */
  function progress(st) {
    const w = (n) => (st.total ? (n / st.total) * 100 : 0);
    return `<div class="card pad prog"><div class="prog-top"><h2>My passport progress</h2><strong class="big-num">${st.visited}<small> / ${st.total}</small> visited</strong></div>
      <div class="stats" data-stagger><div class="stat"><strong>${st.total}</strong><span class="stat-l">Total post offices</span></div><div class="stat"><strong>${st.visited}</strong><span class="stat-l">Visited</span></div><div class="stat"><strong>${st.remaining}</strong><span class="stat-l">Remaining</span></div><div class="stat"><strong>${st.cancel}</strong><span class="stat-l">Cancellations collected</span></div></div>
      <div class="bar-label"><span>Completed</span><strong>${st.pct}%</strong></div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st.pct}" aria-label="Passport completed"><i style="width:${st.pct}%"></i></div>
      <h3 class="sub">Data verification</h3><div class="seg" role="img" aria-label="${st.verified} verified, ${st.partial} partially verified, ${st.pending} pending"><i class="s-v" style="width:${w(st.verified)}%"></i><i class="s-p" style="width:${w(st.partial)}%"></i></div>
      <ul class="seg-key"><li><i class="s-v"></i>Verified against official source <b>${st.verified}</b></li><li><i class="s-p"></i>Partially verified (passport values) <b>${st.partial}</b></li><li><i class="s-n"></i>Pending <b>${st.pending}</b></li></ul>
      <p class="small muted">Values were read from your scanned passport. “Verified” needs the key fields ticked as confirmed, an official source link and a date — nothing is marked verified automatically.</p></div>`;
  }
  function districtProgress() {
    const rows = K.DISTRICTS.map((d) => { const r = S.list('passport').filter((l) => l.districtOrder === d.order), v = r.filter((l) => l.visited).length, c = r.filter((l) => l.cancellationCollected).length;
      return `<tr><td data-label="District"><b>${d.order}.</b> ${esc(d.name)}</td><td data-label="Listed" class="num">${r.length}</td><td data-label="Visited" class="num">${v}</td><td data-label="PPC" class="num">${c}</td><td data-label="Progress"><div class="bar sm" aria-label="${v} of ${r.length} visited"><i style="width:${r.length ? (v / r.length) * 100 : 0}%"></i></div></td></tr>`; }).join('');
    return `<details class="card pad dprog"><summary><h2>District-wise progress</h2></summary><div class="table-wrap"><table class="tbl"><thead><tr><th>District</th><th class="num">Listed</th><th class="num">Visited</th><th class="num">PPC</th><th>Progress</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }

  /* ================= PASSPORT ================= */
  const P = { q: '', district: '', type: '', theme: '', track: '', ver: '', sort: 'serial', page: 1, size: 25 };
  const SORTS = { serial: 'Original passport order', name: 'Name (A–Z)', district: 'District (A–Z)', pin: 'PIN code', doi: 'Date of issue (DOI)', distance: 'Distance from start' };
  const themes = () => Array.from(new Set(S.list('passport').map((l) => l.theme).filter(Boolean))).sort();
  const hasFilters = () => !!(P.q || P.district || P.type || P.theme || P.track || P.ver);
  function filtered() {
    const q = P.q.toLowerCase().trim();
    const r = S.list('passport').filter((l) => (!P.district || String(l.districtOrder) === P.district) && (!P.type || (P.type === 'OTHER' ? !['HO', 'SO', 'BO'].includes(l.officeCode) : l.officeCode === P.type)) && (!P.theme || l.theme === P.theme)
      && (!P.ver || S.verification(l) === P.ver)
      && (!P.track || (P.track === 'ppc' ? l.cancellationCollected : S.track(l) === P.track))
      && (!q || [K.dn(l), l.name, l.pin, l.taluk, l.passportDistrict, l.currentDistrict, l.parentOffice, '#' + l.serial].join(' ').toLowerCase().includes(q)));
    const byS = (a, b) => a.serial - b.serial;
    const cmp = { serial: byS, name: (a, b) => a.name.localeCompare(b.name) || byS(a, b), district: (a, b) => a.passportDistrict.localeCompare(b.passportDistrict) || byS(a, b), pin: (a, b) => a.pin.localeCompare(b.pin) || byS(a, b),
      doi: (a, b) => (a.doi || '9').localeCompare(b.doi || '9') || byS(a, b),
      distance: (a, b) => { const x = distOf(a), y = distOf(b); return (x ? 0 : 1) - (y ? 0 : 1) || (x && y ? x.km - y.km : 0) || byS(a, b); } };
    return r.sort(cmp[P.sort] || byS);          // serial numbers never change; only the displayed order does
  }
  const trackSel = (l) => `<label class="sr" for="tr-${esc(l.id)}">Status of #${l.serial}</label><select id="tr-${esc(l.id)}" class="tr-sel" data-track="${esc(l.id)}"><option value="not" ${S.track(l) === 'not' ? 'selected' : ''}>Not visited</option><option value="planned" ${S.track(l) === 'planned' ? 'selected' : ''}>Planned</option><option value="visited" ${S.track(l) === 'visited' ? 'selected' : ''}>Visited</option></select><label class="ppc"><input type="checkbox" data-ppc="${esc(l.id)}" ${l.cancellationCollected ? 'checked' : ''}> PPC collected</label>`;
  function rowHTML(l) {
    const d = distOf(l);
    return `<tr data-id="${esc(l.id)}"><td data-label="Serial"><b>${l.serial}</b></td>
      <td data-label="Post office"><a href="#/destination/${enc(l.id)}"><strong>${esc(K.dn(l))}</strong></a><br><small class="muted">${esc(K.typeLabel(l))} · ${esc(l.theme)}</small></td>
      <td data-label="PIN">${esc(l.pin)}${l.pdf && l.pdf.pinOnStamp ? ' <span class="chip chip-cancel" title="The stamp on this passport page prints a different PIN">check PIN</span>' : ''}</td>
      <td data-label="District · Taluk">${esc(l.passportDistrict)}<br><small class="muted">${l.taluk ? esc(l.taluk) : 'Taluk: not verified'}</small></td>
      <td data-label="DOI"><small>${l.doi ? esc(fmtDate(l.doi)) : 'Not available'}</small></td>
      <td data-label="Verification">${K.vchip(l)}</td>
      <td data-label="My status"><div class="track">${trackSel(l)}</div></td>
      <td data-label="Distance"><small>${d ? esc(G.label(d)) : 'Not available (no coordinates)'}</small></td>
      <td data-label="Actions" class="actions"><a class="btn btn-ghost btn-sm" href="#/destination/${enc(l.id)}">View</a><button class="btn btn-ghost btn-sm" data-edit="${esc(l.id)}" aria-label="Edit #${l.serial}">${ic('edit')}</button></td></tr>`;
  }
  function printSheet() {
    let sheet = $('#print-sheet'); if (sheet) sheet.remove(); sheet = document.createElement('div'); sheet.id = 'print-sheet';
    const by = {}; S.list('passport').forEach((l) => { (by[l.districtOrder] = by[l.districtOrder] || []).push(l); });
    sheet.innerHTML = `<h1>K_24 Karnataka Post Trails — Passport checklist (100 post offices)</h1><p>Printed ${esc(new Date().toLocaleDateString('en-IN'))}. ☐ = cancellation not collected.</p>` + K.DISTRICTS.map((d) => `<h2>${d.order}. ${esc(d.name)} <small>(passport p.${d.page})</small></h2><table>${(by[d.order] || []).map((l) => `<tr><td>${l.cancellationCollected ? '☑' : '☐'}</td><td>${l.serial}</td><td>${esc(K.dn(l))}</td><td>${esc(l.pin)}</td><td>${l.visited ? 'visited' : ''}</td></tr>`).join('')}</table>`).join('');
    document.body.appendChild(sheet); window.print(); setTimeout(() => sheet.remove(), 1500);
  }
  function draw(root) {
    const st = S.stats(); $('#p-prog', root).innerHTML = progress(st);
    const list = filtered(), pages = Math.max(1, Math.ceil(list.length / P.size)); P.page = Math.min(P.page, pages);
    const from = (P.page - 1) * P.size, slice = list.slice(from, from + P.size), box = $('#p-list', root);
    box.innerHTML = slice.length ? `<div class="table-wrap"><table class="tbl tbl-po"><thead><tr><th>Serial</th><th>Post office</th><th>PIN</th><th>District · Taluk</th><th>DOI</th><th>Verification</th><th>My status</th><th>Distance from ${esc(K.origin.name)}</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${slice.map(rowHTML).join('')}</tbody></table></div>` : empty('No post offices match', 'Clear the filters or change the search.', '<button class="btn btn-primary" data-clear>Clear filters</button>');
    $('#p-foot', root).innerHTML = `<span><strong>Showing ${list.length ? from + 1 + '–' + (from + slice.length) : 0} of ${list.length}</strong> (dataset total: ${S.list('passport').length})${hasFilters() ? ' · <button class="linkish" data-clear>Clear filters</button>' : ''}</span>${list.length ? `<span class="pager"><button class="btn btn-ghost btn-sm" data-page="-1" ${P.page <= 1 ? 'disabled' : ''}>Previous</button><b>Page ${P.page} of ${pages}</b><button class="btn btn-ghost btn-sm" data-page="1" ${P.page >= pages ? 'disabled' : ''}>Next</button></span>` : ''}`;
    K.anim.listIn(box);
  }
  async function importFile(root) {
    const f = await K.pickFile('.csv,.json,text/csv,application/json'); if (!f) return;
    try {
      if (/\.csv$/i.test(f.name)) { const items = S.importCSV(f.text); if (await K.confirm('Update matching records from ' + items.length + ' CSV rows? Rows are matched by serial/id; the 100 records cannot be added or removed. The original passport values stay stored for comparison.', 'Import')) { const r = S.mergePassport(items); K.toast(r.updated + ' updated' + (r.skipped ? ', ' + r.skipped + ' skipped (unknown serial)' : '') + '.'); } else return; }
      else { const data = JSON.parse(f.text);
        if (Array.isArray(data)) { if (await K.confirm('Update matching records from ' + data.length + ' JSON rows?', 'Import')) { const r = S.mergePassport(data.filter((x) => x && typeof x === 'object')); K.toast(r.updated + ' updated.'); } else return; }
        else if (await K.confirm('Replace ALL data (tracking, blogs, collection, expenses) with this backup?', 'Replace everything')) { S.importJSON(f.text); K.toast('Backup restored.'); } else return; }
      draw(root);
    } catch (e) { K.toast(e.message || 'Import failed.', 'error'); }
  }
  V.passport = () => ({ title: 'Karnataka Philately Passport — K_24 Karnataka Post Trails', desc: 'All 100 Karnataka Philately Passport post offices by district: PIN codes, classification, date of issue, tracking of visits and pictorial cancellations.',
    html: `<div class="wrap">${pageHead('Karnataka Philately Passport', '100 post offices in 30 districts — in the passport’s own order.', `<div class="head-tools"><button class="btn btn-ghost" data-print>Print checklist</button><details class="menu"><summary class="btn btn-ghost">Import / export</summary><div class="menu-pop"><button data-exp="verified">Export verified records (CSV)</button><button data-exp="all">Export all 100 records (CSV)</button><button data-exp="backup">Full backup (JSON)</button><button data-import>Import CSV or JSON…</button></div></details></div>`)}
      ${S.migrated ? '<p class="note">Your earlier demo locations were replaced by the real 100-record list. Blogs, collection and expenses were kept.</p>' : ''}
      <div id="p-prog"></div>${districtProgress()}
      <div class="toolbar"><label class="search"><span class="sr">Search</span>${ic('search')}<input type="search" id="p-q" placeholder="Search name, PIN, taluk or district…" value="${esc(P.q)}"></label>
        <div class="filters"><label><span class="sr">District</span><select id="p-d"><option value="">All 30 districts</option>${K.DISTRICTS.map((d) => `<option value="${d.order}" ${P.district === String(d.order) ? 'selected' : ''}>${d.order}. ${esc(d.name)}</option>`).join('')}</select></label>
          <label><span class="sr">Classification</span><select id="p-t"><option value="">HO / SO / BO / other</option>${[['HO', 'Head Office (HO)'], ['SO', 'Sub Office (SO)'], ['BO', 'Branch Office (BO)'], ['OTHER', 'Other / not printed']].map((o) => `<option value="${o[0]}" ${P.type === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
          <label><span class="sr">Passport theme</span><select id="p-th"><option value="">All themes</option>${themes().map((t) => `<option ${P.theme === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
          <label><span class="sr">My status</span><select id="p-tr"><option value="">Any status</option>${[['not', 'Not visited'], ['planned', 'Planned'], ['visited', 'Visited'], ['ppc', 'PPC collected']].map((o) => `<option value="${o[0]}" ${P.track === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
          <label><span class="sr">Verification</span><select id="p-v"><option value="">All verification</option><option value="verified" ${P.ver === 'verified' ? 'selected' : ''}>Verified</option><option value="partial" ${P.ver === 'partial' ? 'selected' : ''}>Partially verified</option></select></label>
          <label><span class="sr">Sort</span><select id="p-s">${Object.keys(SORTS).map((k) => `<option value="${k}" ${P.sort === k ? 'selected' : ''}>Sort: ${SORTS[k]}</option>`).join('')}</select></label>${K.originHTML('p-o')}
          <button class="btn btn-ghost btn-sm" type="button" data-clear>Clear filters</button></div></div>
      <div id="p-list" aria-live="polite"></div><div id="p-foot" class="foot-row"></div>
      <p class="note">Distances are <strong>straight-line estimates</strong> from the chosen start, not road distances. “DOI” is the date of issue as printed in your passport. Data is stored only in this browser — export a backup.</p></div>`,
    after(root) {
      draw(root); const re = () => draw(root);
      const setF = (id, k) => $('#' + id, root).addEventListener('change', (e) => { P[k] = e.target.value; P.page = 1; re(); });
      $('#p-q', root).addEventListener('input', K.debounce((e) => { P.q = e.target.value; P.page = 1; re(); }, 180));
      setF('p-d', 'district'); setF('p-t', 'type'); setF('p-th', 'theme'); setF('p-tr', 'track'); setF('p-v', 'ver');
      $('#p-s', root).addEventListener('change', (e) => { P.sort = e.target.value; P.page = 1; re(); }); K.bindOrigin(root, 'p-o', re);
      root.addEventListener('change', (e) => { const t = e.target, l = t.dataset.track ? S.find('passport', t.dataset.track) : t.dataset.ppc ? S.find('passport', t.dataset.ppc) : null; if (!l) return;
        if (t.dataset.track) K.setTrack(l, t.value); else S.upsert('passport', Object.assign({}, l, { cancellationCollected: t.checked })); K.toast('Saved #' + l.serial + '.'); $('#p-prog', root).innerHTML = progress(S.stats()); });
      root.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.page) { P.page += Number(b.dataset.page); re(); } else if (b.dataset.edit) K.editLocation(b.dataset.edit, re);
        else if (b.hasAttribute('data-clear')) { Object.assign(P, { q: '', district: '', type: '', theme: '', track: '', ver: '', page: 1 }); ['p-q', 'p-d', 'p-t', 'p-th', 'p-tr', 'p-v'].forEach((id) => { $('#' + id, root).value = ''; }); re(); }
        else if (b.hasAttribute('data-print')) printSheet(); else if (b.hasAttribute('data-import')) { b.closest('details').open = false; importFile(root); }
        else if (b.dataset.exp) { b.closest('details').open = false; const d = new Date().toISOString().slice(0, 10);
          if (b.dataset.exp === 'verified') { if (!S.stats().verified) { K.toast('No record is fully verified yet, so there is nothing to export. Use “all records” instead.', 'error'); return; } K.download('k24-verified-post-offices-' + d + '.csv', S.exportVerifiedCSV(), 'text/csv'); }
          else if (b.dataset.exp === 'all') K.download('k24-all-100-post-offices-' + d + '.csv', S.exportCSV(), 'text/csv'); else K.download('k24-backup-' + d + '.json', S.exportJSON(), 'application/json'); } });
    } });

  /* ================= EXPLORE: district directory + map ================= */
  const E = { district: '', type: '', track: '', q: '', pane: 'list', open: {} };
  V.explore = (ctx) => {
    const focus = ctx.q.get('id') || '', st = S.stats();
    return { title: 'Explore Karnataka — K_24 Karnataka Post Trails', desc: 'District-wise directory of all 100 Karnataka Philately Passport post offices with an interactive map.',
      html: `<div class="wrap">${pageHead('Explore Karnataka', 'District by district, in the original passport order — with the map beside it.')}
        <div class="toolbar"><label class="search"><span class="sr">Search</span>${ic('search')}<input type="search" id="e-q" placeholder="Search name, PIN or taluk…" value="${esc(E.q)}"></label><div class="filters"><label><span class="sr">District</span><select id="e-d"><option value="">All 30 districts</option>${K.DISTRICTS.map((d) => `<option value="${d.order}" ${E.district === String(d.order) ? 'selected' : ''}>${d.order}. ${esc(d.name)}</option>`).join('')}</select></label>
          <label><span class="sr">Classification</span><select id="e-t"><option value="">HO / SO / BO / other</option><option value="HO">Head Office (HO)</option><option value="SO">Sub Office (SO)</option><option value="BO">Branch Office (BO)</option><option value="OTHER">Other / not printed</option></select></label>
          <label><span class="sr">My status</span><select id="e-tr"><option value="">Any status</option><option value="not">Not visited</option><option value="planned">Planned</option><option value="visited">Visited</option></select></label><button class="btn btn-ghost btn-sm" type="button" data-eclear>Clear filters</button></div>
          <div class="pills pane-toggle" role="group" aria-label="Show"><button class="pill ${E.pane === 'list' ? 'on' : ''}" data-pane="list" aria-pressed="${E.pane === 'list'}">Directory</button><button class="pill ${E.pane === 'map' ? 'on' : ''}" data-pane="map" aria-pressed="${E.pane === 'map'}">Map</button></div></div>
        <div class="xplore" data-pane="${E.pane}"><section class="xl" aria-label="District directory"><div class="xl-tools"><button class="btn btn-ghost btn-sm" data-all="open">Expand all</button><button class="btn btn-ghost btn-sm" data-all="close">Collapse all</button><span class="small muted" id="e-count"></span></div><div id="e-list"></div></section>
          <section class="xm" aria-label="Map"><form class="map-search" id="e-search" role="search"><label class="sr" for="e-mq">Search for a place on the map</label><input id="e-mq" type="search" placeholder="Find a place on the map (e.g. Hampi)…" maxlength="80"><button class="btn btn-primary btn-sm" type="submit">Find</button></form>
            <div id="e-warn" class="warn" hidden></div><div class="big-map" id="e-map" role="region" aria-label="Map of Karnataka post offices"></div>
            <div class="legend" aria-label="Map legend">${['planned', 'visited', 'cancel', 'blog'].map((k) => `<span><i style="background:${K.map.COLORS[k]}"></i>${K.map.LABELS[k]}</span>`).join('')}<span><i class="est-dot"></i>Dashed outline = coordinates not yet confirmed</span></div>
            <p class="note">Only post offices with coordinates get a marker; none are guessed. ${st.withCoords} of ${st.total} have coordinates so far.</p></section></div></div>`,
      after(root) {
        let ctl = null;
        const sel = () => { const q = E.q.toLowerCase().trim(); return S.list('passport').filter((l) => (!E.district || String(l.districtOrder) === E.district) && (!E.type || (E.type === 'OTHER' ? !['HO', 'SO', 'BO'].includes(l.officeCode) : l.officeCode === E.type)) && (!E.track || S.track(l) === E.track) && (!q || [K.dn(l), l.pin, l.taluk, l.passportDistrict].join(' ').toLowerCase().includes(q))); };
        const item = (l) => `<li id="x-${esc(l.id)}" class="xi"><span class="xs">${l.serial}</span><div class="xb"><a href="#/destination/${enc(l.id)}"><strong>${esc(K.dn(l))}</strong></a>
          <small class="muted">${esc(K.typeLabel(l))} · PIN ${esc(l.pin)} · ${l.taluk ? 'Taluk ' + esc(l.taluk) : 'Taluk not verified'} · ${esc(l.theme)} · p.${l.passportPage || '—'}</small><div class="chips">${K.vchip(l)}${l.visited ? '<span class="chip chip-visited">Visited</span>' : ''}${l.cancellationCollected ? '<span class="chip chip-cancel">PPC collected</span>' : ''}</div></div>
          <div class="xa">${l.lat != null ? `<button class="btn btn-ghost btn-sm" data-show="${esc(l.id)}">Show on map</button>` : '<small class="muted" title="No coordinates entered, so nothing is plotted.">No coordinates</small>'}</div></li>`;
        const drawList = () => {
          const rows = sel(), by = {}; rows.forEach((l) => { (by[l.districtOrder] = by[l.districtOrder] || []).push(l); }); const ds = K.DISTRICTS.filter((d) => by[d.order]);
          $('#e-count', root).textContent = 'Showing ' + rows.length + ' of ' + S.list('passport').length;
          $('#e-list', root).innerHTML = ds.length ? ds.map((d) => { const r = by[d.order], v = r.filter((l) => l.visited).length, open = E.open[d.order] || (E.district && ds.length === 1);
            return `<article class="dist ${open ? 'open' : ''}" data-d="${d.order}"><button class="dist-head" type="button" aria-expanded="${!!open}" aria-controls="dl-${d.order}"><span class="dn">${d.order}</span><span class="dt"><strong>${esc(d.name)}</strong><small>${r.length} post office${r.length === 1 ? '' : 's'} · #${d.first}${d.last > d.first ? '–' + d.last : ''} · passport p.${d.page}${d.official !== d.name ? ' · now ' + esc(d.official) : ''}</small></span><span class="dp" aria-label="${v} of ${r.length} visited"><i style="width:${(v / r.length) * 100}%"></i></span><span class="dc" aria-hidden="true">▾</span></button>
              <div class="dist-body" id="dl-${d.order}" ${open ? '' : 'hidden'}>${K.DISTRICT_NOTES[d.order] ? `<p class="small muted dist-note">${esc(K.DISTRICT_NOTES[d.order])}</p>` : ''}<ul>${r.map(item).join('')}</ul></div></article>`; }).join('') : empty('Nothing matches', 'Clear the filters or change the search.');
        };
        const warn = () => { const w = $('#e-warn', root), l = sel(), n = l.filter((x) => x.lat != null).length; w.hidden = !l.length || n === l.length; w.textContent = n === 0 ? 'None of these post offices has coordinates yet, so the map shows no markers. Open a record and use “Find coordinates on OpenStreetMap”, then confirm the position.' : (l.length - n) + ' of ' + l.length + ' post offices here have no coordinates and are not on the map.'; };
        const upd = () => { drawList(); warn(); if (ctl) ctl.set(sel()); };
        const hl = (id) => { const li = $('#x-' + CSS.escape(id), root); if (!li) return; const d = li.closest('.dist'); if (d && !d.classList.contains('open')) { d.classList.add('open'); E.open[d.dataset.d] = true; $('.dist-head', d).setAttribute('aria-expanded', 'true'); $('.dist-body', d).hidden = false; } li.scrollIntoView({ block: 'center', behavior: K.reduced() ? 'auto' : 'smooth' }); li.classList.add('hl'); setTimeout(() => li.classList.remove('hl'), 2400); };
        drawList(); warn();
        K.map.mount($('#e-map', root), sel(), { cluster: true, focusId: focus, onMarkerClick: hl, onError() { E.pane = 'list'; $('.xplore', root).dataset.pane = 'list'; K.toast('Map unavailable — the directory still works.', 'error'); } }).then((c) => { ctl = c; if (focus) hl(focus); });
        $('#e-q', root).addEventListener('input', K.debounce((e) => { E.q = e.target.value; upd(); }, 180));
        [['e-d', 'district'], ['e-t', 'type'], ['e-tr', 'track']].forEach(([id, k]) => { const el = $('#' + id, root); el.value = E[k]; el.addEventListener('change', (e) => { E[k] = e.target.value; upd(); }); });
        const setPane = (p) => { E.pane = p; $('.xplore', root).dataset.pane = p; $$('.pane-toggle .pill', root).forEach((x) => { const on = x.dataset.pane === p; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); if (ctl) ctl.invalidate(); };
        $$('[data-pane]', root).forEach((b) => b.addEventListener('click', () => setPane(b.dataset.pane)));
        root.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
          if (b.classList.contains('dist-head')) { const a = b.closest('.dist'), o = !a.classList.contains('open'); a.classList.toggle('open', o); b.setAttribute('aria-expanded', o); $('.dist-body', a).hidden = !o; E.open[a.dataset.d] = o; }
          else if (b.dataset.all) { K.DISTRICTS.forEach((d) => { E.open[d.order] = b.dataset.all === 'open'; }); drawList(); }
          else if (b.hasAttribute('data-eclear')) { Object.assign(E, { district: '', type: '', track: '', q: '' }); ['e-q', 'e-d', 'e-t', 'e-tr'].forEach((id) => { $('#' + id, root).value = ''; }); upd(); }
          else if (b.dataset.show) { setPane('map'); if (ctl) setTimeout(() => ctl.focus(b.dataset.show), 150); hl(b.dataset.show); } });
        $('#e-search', root).addEventListener('submit', async (e) => { e.preventDefault(); const q = $('#e-mq', root).value.trim(); if (!q || !ctl) return;
          const local = S.list('passport').find((l) => l.lat != null && K.dn(l).toLowerCase().includes(q.toLowerCase())); if (local) { ctl.focus(local.id); hl(local.id); return; }
          try { const r = await K.geocode(q + ', Karnataka, India'); if (!r) { K.toast('No place found for “' + q + '”.', 'error'); return; } ctl.probe(r.lat, r.lng, r.name.slice(0, 100)); } catch (x) { K.toast('Place search is unavailable right now.', 'error'); } });
      } };
  };
})();
(window.K24.mods = window.K24.mods || {})['directory'] = '2026.10.20a';
