/* Local-first data store. Browser localStorage ONLY: single device, single browser, not synced.
   Use Backup → Export JSON regularly. Schema is versioned so it can migrate to a real database later. */
(function () {
  const K = window.K24;
  const KEY = 'k24.v1';
  const SCHEMA = 2;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const str = (v, n = 500) => String(v == null ? '' : v).trim().slice(0, n);
  const bool = (v) => v === true || /^(true|yes|1)$/i.test(String(v));
  const num = (v) => { if (v === '' || v == null) return null; const n = Number(v); return isFinite(n) ? n : null; };
  const okUrl = (u) => /^(https?:\/\/|assets\/|data:image\/(png|jpe?g|webp|gif);base64,)/i.test(u);
  const url = (v) => { const s = str(v, 2000); return s && okUrl(s) ? s : ''; };
  const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : '');
  const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const cleaners = {
    passport(o) {
      const lat = num(o.lat), lng = num(o.lng);
      const okC = lat != null && lng != null && lat >= 11.4 && lat <= 18.6 && lng >= 73.8 && lng <= 78.7; // Karnataka bounding box
      const photos = Array.isArray(o.photos) ? o.photos : String(o.photos || '').split('|');
      const serial = Math.round(num(o.serial) || 0), base = K.PASSPORT.find((x) => x.serial === serial) || {};
      const cs = ['none', 'geocoded', 'verified'].includes(o.coordStatus) ? o.coordStatus : (okC && bool(o.coordsVerified) ? 'verified' : okC ? 'geocoded' : 'none');
      const vf = (Array.isArray(o.verifiedFields) ? o.verifiedFields : String(o.verifiedFields || '').split('|').map((x) => x.trim())).filter((f) => K.VERIFY_FIELDS.some((x) => x[0] === f));
      const pdfF = ['name', 'postOffice', 'officeCode', 'postOfficeType', 'pin', 'doi', 'theme'];
      return {
        id: str(o.id, 80).replace(/[^\w-]/g, '-') || ('d' + String(serial).padStart(3, '0')),
        serial, districtOrder: Math.round(num(o.districtOrder) || base.districtOrder || 0),
        passportDistrict: str(o.passportDistrict || base.passportDistrict || o.district, 80), currentDistrict: str(o.currentDistrict || base.currentDistrict, 120),
        district: str(o.passportDistrict || base.passportDistrict || o.district, 80),
        name: str(o.name, 120), postOffice: str(o.postOffice || o.name, 160), officeCode: str(o.officeCode, 8).toUpperCase(), attraction: str(o.attraction, 160),
        category: K.CATEGORIES.includes(o.category) ? o.category : 'Heritage',
        postOfficeType: K.POST_OFFICE_TYPES.includes(o.postOfficeType) ? o.postOfficeType : '',
        pin: str(o.pin, 6).replace(/\D/g, ''), doi: date(o.doi), theme: str(o.theme, 60),
        taluk: str(o.taluk, 80), parentOffice: str(o.parentOffice, 120), division: str(o.division, 80), region: str(o.region, 80), circle: str(o.circle, 60),
        deliveryStatus: ['Delivery', 'Non-delivery'].includes(o.deliveryStatus) ? o.deliveryStatus : '', address: str(o.address, 400),
        source: str(o.source, 300), verifiedDate: date(o.verifiedDate), verifiedFields: vf, edited: (Array.isArray(o.edited) ? o.edited : []).filter((f) => pdfF.includes(f)),
        indexPage: Math.round(num(o.indexPage) || base.indexPage || 0) || null, passportPage: num(o.passportPage) != null && num(o.passportPage) > 0 ? Math.round(num(o.passportPage)) : (base.passportPage || null),
        pageInferred: base.passportPage || null,
        visitDate: date(o.visitDate), plannedDate: date(o.plannedDate),
        planned: bool(o.planned), visited: bool(o.visited),
        cancellationCollected: bool(o.cancellationCollected), blogPublished: bool(o.blogPublished),
        notes: str(o.notes, 4000), history: str(o.history, 4000), route: str(o.route, 1500), transport: str(o.transport, 1500),
        nearby: str(o.nearby, 1500), photos: photos.map((p) => url(String(p).trim())).filter(Boolean).slice(0, 24),
        blogUrl: url(o.blogUrl), lat: okC ? lat : null, lng: okC ? lng : null, coordSource: okC ? str(o.coordSource, 200) : '',
        coordStatus: okC ? cs : 'none', coordsVerified: okC && cs === 'verified', nameSource: str(o.nameSource || base.nameSource, 200), demo: false,
        pdf: base.pdf || null, dataNotes: base.dataNotes || []   // original passport values are never overwritten
      };
    },
    expenses(o) {
      const a = num(o.amount);
      return { id: str(o.id, 60) || uid(), date: date(o.date), destination: str(o.destination, 120), placeId: str(o.placeId, 20), category: K.EXPENSE_CATEGORIES.includes(o.category) ? o.category : 'Other',
        description: str(o.description, 200), amount: a != null && a >= 0 ? Math.round(a * 100) / 100 : 0, notes: str(o.notes, 500), demo: bool(o.demo) };
    },
    blogs(o) {
      return { id: str(o.id, 80).replace(/[^\w-]/g, '-') || uid(), title: str(o.title, 160) || 'Untitled post', category: K.CATEGORIES.includes(o.category) ? o.category : 'Travel',
        destinationId: str(o.destinationId, 80), date: date(o.date), excerpt: str(o.excerpt, 400), body: str(o.body, 30000), cover: url(o.cover), demo: bool(o.demo) };
    },
    collection(o) {
      return { id: str(o.id, 60) || uid(), type: K.COLLECTION_TYPES[o.type] ? o.type : 'cancellation', title: str(o.title, 160) || 'Untitled item', location: str(o.location, 120),
        date: date(o.date), note: str(o.note, 600), image: url(o.image), demo: bool(o.demo) };
    }
  };

  const S = {
    state: null, storageOk: true,
    seed() {
      const st = { schemaVersion: SCHEMA, updatedAt: new Date().toISOString(), settings: { seeded63: false, plannedReset: true },
        passport: clone(K.PASSPORT), expenses: [], blogs: clone(K.BLOGS), collection: clone(K.COLLECTION) };
      return this.applySeeds(st);
    },
    /* One-time seeding the owner asked for: serial 63 (Mysuru HO, passport pp.125–126) is visited with its cancellation collected.
       Date = the date on the stamp in the scanned passport page. Everything else stays "Not visited". */
    applySeeds(st) {
      if (!st.settings.seeded63) { const r = st.passport.find((x) => x.serial === 63); if (r) { r.visited = true; r.cancellationCollected = true; if (!r.visitDate) r.visitDate = '2023-08-30'; } st.settings.seeded63 = true; }
      return st;
    },
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) { const s = JSON.parse(raw); if (s && s.schemaVersion === SCHEMA) return (this.state = this.normalise(s)); /* schema 2 (earlier 100-slot directory) is read and upgraded in place */
          if (s && s.schemaVersion === 1) { this.state = this.seed(); ['expenses', 'blogs', 'collection'].forEach((c) => { this.state[c] = (Array.isArray(s[c]) ? s[c] : []).map(cleaners[c]); }); this.migrated = true; this.save(); return this.state; } }
      } catch (e) { this.storageOk = false; }
      this.state = this.seed();
      this.save();
      return this.state;
    },
    normalise(s) {
      const st0 = (s && s.settings) || {};
      const out = { schemaVersion: SCHEMA, updatedAt: s.updatedAt || '', settings: { seeded63: !!st0.seeded63, plannedReset: !!st0.plannedReset } };
      ['expenses', 'blogs', 'collection'].forEach((c) => { out[c] = (Array.isArray(s[c]) ? s[c] : []).slice(0, 5000).map(cleaners[c]); });
      const saved = {}; (Array.isArray(s.passport) ? s.passport : []).forEach((x) => { const c = cleaners.passport(x); saved[c.id] = { clean: c, raw: x }; });
      const USER = ['visitDate', 'plannedDate', 'blogUrl', 'notes', 'history', 'route', 'transport', 'nearby', 'passportPage', 'source', 'verifiedDate', 'address', 'taluk', 'parentOffice', 'division', 'region', 'circle', 'deliveryStatus', 'coordSource', 'attraction'];
      const PDFF = ['name', 'postOffice', 'officeCode', 'postOfficeType', 'pin', 'doi', 'theme'];
      out.passport = K.PASSPORT.map((b) => {
        const sv = saved[b.id]; const r = cleaners.passport(b); if (!sv) return r; const c = sv.clean;
        ['planned', 'visited', 'cancellationCollected', 'blogPublished'].forEach((f) => { r[f] = c[f]; });
        USER.forEach((f) => { if (c[f]) r[f] = c[f]; });
        if (c.photos.length) r.photos = c.photos; if (c.verifiedFields.length) r.verifiedFields = c.verifiedFields;
        if (c.lat != null) { r.lat = c.lat; r.lng = c.lng; r.coordStatus = c.coordStatus; r.coordsVerified = c.coordsVerified; }
        r.edited = c.edited; PDFF.forEach((f) => { if (c.edited.includes(f) && c[f]) r[f] = c[f]; });   // PDF values win unless you edited that field yourself
        return r;
      });
      // earlier builds marked every record "planned" by default; clear that once so the default is "Not visited"
      if (!out.settings.plannedReset) { if (out.passport.every((x) => x.planned) && !out.passport.some((x) => x.plannedDate)) out.passport.forEach((x) => { x.planned = false; }); out.settings.plannedReset = true; }
      return this.applySeeds(out);
    },
    save() {
      this.state.updatedAt = new Date().toISOString();
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); this.storageOk = true; }
      catch (e) { this.storageOk = false; K.toast && K.toast('Your browser blocked saving. Changes will be lost on refresh — export a backup.', 'error'); }
    },
    list(c) { return this.state[c]; },
    find(c, id) { return this.state[c].find((x) => x.id === id); },
    upsert(c, item) {
      const clean = cleaners[c](item);
      const i = this.state[c].findIndex((x) => x.id === clean.id);
      if (i >= 0) this.state[c][i] = clean; else this.state[c].push(clean);
      this.save(); return clean;
    },
    remove(c, id) { this.state[c] = this.state[c].filter((x) => x.id !== id); this.save(); },
    setOfficialTotal(n) { this.state.settings.officialTotal = Math.max(0, Math.min(5000, parseInt(n, 10) || 0)); this.save(); },
    newId(c, base) {
      let id = (base || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || uid();
      const base0 = id; let n = 2; while (this.find(c, id)) id = base0 + '-' + n++;
      return id;
    },
    officialSource(u) { try { const h = new URL(u).hostname.toLowerCase(); return K.OFFICIAL_HOSTS.some((d) => h === d || h.endsWith('.' + d)); } catch (e) { return false; } },
    /* What is still unconfirmed against an official source. */
    missing(l) {
      const m = [], vf = l.verifiedFields || [], lab = Object.fromEntries(K.VERIFY_FIELDS);
      K.VERIFY_REQUIRED.forEach((f) => { if (!vf.includes(f)) m.push(lab[f].toLowerCase() + ' (passport value, not yet checked)'); });
      if (!/^\d{6}$/.test(l.pin)) m.push('valid 6-digit PIN');
      if (!this.officialSource(l.source)) m.push('official source link (India Post / Karnataka Postal Circle)'); if (!l.verifiedDate) m.push('verification date');
      return m;
    },
    unverifiedFields(l) { const vf = l.verifiedFields || []; return K.VERIFY_FIELDS.map((x) => x[0]).filter((f) => !vf.includes(f)); },
    /* Computed, never typed in: verified only when the key fields are ticked as confirmed AND an official source link AND a date are recorded. */
    verification(l) { if (!l.name) return 'pending'; return this.missing(l).length ? 'partial' : 'verified'; },
    stats() {
      const p = this.state.passport, total = p.length, vs = p.map((x) => this.verification(x));
      const verified = vs.filter((v) => v === 'verified').length, partial = vs.filter((v) => v === 'partial').length;
      const visited = p.filter((x) => x.visited).length;
      return { total, verified, partial, pending: total - verified - partial, visited, remaining: total - visited,
        planned: p.filter((x) => x.planned && !x.visited).length, cancel: p.filter((x) => x.cancellationCollected).length, blogs: p.filter((x) => x.blogPublished).length,
        named: p.filter((x) => x.name).length, withCoords: p.filter((x) => x.lat != null).length,
        pct: total ? Math.round((visited / total) * 100) : 0, vpct: total ? Math.round((verified / total) * 100) : 0 };
    },
    statusOf(l) { return l.blogPublished ? 'blog' : l.cancellationCollected ? 'cancel' : l.visited ? 'visited' : 'planned'; },
    /* tracking state shown to the user: Not visited / Planned / Visited */
    track(l) { return l.visited ? 'visited' : l.planned ? 'planned' : 'not'; },
    // ---- backup / import ----
    exportJSON() { return JSON.stringify(this.state, null, 2); },
    importJSON(text) {
      let s; try { s = JSON.parse(text); } catch (e) { throw new Error('That file is not valid JSON.'); }
      if (!s || typeof s !== 'object' || s.schemaVersion !== SCHEMA || !Array.isArray(s.passport)) throw new Error('Not a K_24 backup (expected schemaVersion ' + SCHEMA + ' and a passport list).');
      this.state = this.normalise(s); this.save(); return this.state;
    },
    csvCols: ['id', 'serial', 'districtOrder', 'passportDistrict', 'currentDistrict', 'name', 'officeCode', 'postOfficeType', 'pin', 'doi', 'theme', 'taluk', 'parentOffice', 'division', 'region', 'circle', 'deliveryStatus', 'address', 'indexPage', 'passportPage', 'lat', 'lng', 'coordStatus', 'coordSource', 'source', 'verifiedDate', 'verifiedFields', 'visitDate', 'plannedDate', 'planned', 'visited', 'cancellationCollected', 'blogPublished', 'notes', 'photos', 'blogUrl'],
    verifiedCols: ['serial', 'passportDistrict', 'currentDistrict', 'name', 'officeCode', 'postOfficeType', 'pin', 'doi', 'theme', 'taluk', 'parentOffice', 'division', 'region', 'circle', 'deliveryStatus', 'address', 'indexPage', 'passportPage', 'lat', 'lng', 'coordSource', 'source', 'verifiedDate', 'verifiedFields', 'verification'],
    toCSV(rows, cols) {
      const q = (v) => { let s = Array.isArray(v) ? v.join(' | ') : v == null ? '' : String(v); if (/^[=+@\-]/.test(s) && isNaN(Number(s))) s = "'" + s; return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      return '\uFEFF' + [cols.join(',')].concat(rows.map((r) => cols.map((c) => q(r[c])).join(','))).join('\r\n');
    },
    exportCSV() { return this.toCSV(this.state.passport, this.csvCols); },
    exportVerifiedCSV() { return this.toCSV(this.state.passport.filter((l) => this.verification(l) === 'verified').map((l) => Object.assign({}, l, { verification: 'verified' })), this.verifiedCols); },
    parseCSV(text) {
      const rows = []; let row = [], cur = '', inQ = false;
      text = text.replace(/^\uFEFF/, '');
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQ) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += c; }
        else if (c === '"') inQ = true;
        else if (c === ',') { row.push(cur); cur = ''; }
        else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
        else cur += c;
      }
      if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
      return rows;
    },
    importCSV(text) {
      const rows = this.parseCSV(text);
      if (rows.length < 2) throw new Error('The CSV has no data rows.');
      const head = rows[0].map((h) => h.trim());
      if (!head.includes('name') || !(head.includes('serial') || head.includes('id'))) throw new Error('The CSV needs a header row with “serial” (or “id”) and “name” columns. Export the directory first to get the exact layout.');
      const items = rows.slice(1, 5001).map((r) => { const o = {}; head.forEach((h, i) => { let v = r[i] == null ? '' : r[i]; if (/^'[=+@\-]/.test(v)) v = v.slice(1); o[h] = v; }); return o; })
        .filter((o) => str(o.name));
      if (!items.length) throw new Error('No rows with a name were found.');
      return items;
    },
    mergePassport(items) {
      let updated = 0, skipped = 0;
      items.forEach((o) => {
        const serial = Math.round(num(o.serial) || 0), id = str(o.id, 80) || (serial ? 'd' + String(serial).padStart(3, '0') : '');
        const i = this.state.passport.findIndex((x) => x.id === id);
        if (i < 0) { skipped++; return; }               // the directory is fixed at the 100 passport records
        const cur = this.state.passport[i];
        const merged = cleaners.passport(Object.assign({}, cur, o, { id: cur.id, serial: cur.serial, districtOrder: cur.districtOrder, passportDistrict: cur.passportDistrict, currentDistrict: cur.currentDistrict }));
        const base = K.PASSPORT.find((x) => x.id === cur.id); ['name', 'officeCode', 'postOfficeType', 'pin', 'doi', 'theme'].forEach((f) => { if (base && merged[f] !== base[f] && !merged.edited.includes(f)) merged.edited.push(f); });
        this.state.passport[i] = merged;
        updated++;
      });
      this.save(); return { added: 0, updated, skipped };
    },
    reset() { this.state = this.seed(); this.save(); },
    uid
  };
  K.store = S;
})();
(window.K24.mods = window.K24.mods || {})['store'] = '2026.10.20a';
