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
      const serial = Math.round(num(o.serial) || 0);
      const base = serial ? (K.PASSPORT.find((x) => x.serial === serial) || {}) : {};
      const cs = ['none', 'geocoded', 'verified'].includes(o.coordStatus) ? o.coordStatus : (okC && bool(o.coordsVerified) ? 'verified' : okC ? 'geocoded' : 'none');
      return {
        id: str(o.id, 80).replace(/[^\w-]/g, '-') || ('d' + String(serial).padStart(3, '0')),
        serial, districtOrder: Math.round(num(o.districtOrder) || base.districtOrder || 0),
        passportDistrict: str(o.passportDistrict || base.passportDistrict || o.district, 80), currentDistrict: str(o.currentDistrict || base.currentDistrict, 120),
        district: str(o.passportDistrict || base.passportDistrict || o.district, 80),
        name: str(o.name, 120), attraction: str(o.attraction, 160),
        category: K.CATEGORIES.includes(o.category) ? o.category : 'Heritage',
        postOffice: str(o.postOffice, 160), postOfficeType: K.POST_OFFICE_TYPES.includes(o.postOfficeType) ? o.postOfficeType : '',
        pin: str(o.pin, 6).replace(/\D/g, ''), address: str(o.address, 400),
        source: str(o.source, 300), verifiedDate: date(o.verifiedDate),
        indexPage: Math.round(num(o.indexPage) || base.indexPage || 0) || null, passportPage: num(o.passportPage) != null && num(o.passportPage) > 0 ? Math.round(num(o.passportPage)) : null,
        pageInferred: Math.round(num(o.pageInferred) || base.pageInferred || 0) || null,
        visitDate: date(o.visitDate), plannedDate: date(o.plannedDate),
        planned: o.planned === undefined ? true : bool(o.planned), visited: bool(o.visited),
        cancellationCollected: bool(o.cancellationCollected), blogPublished: bool(o.blogPublished),
        notes: str(o.notes, 4000), history: str(o.history, 4000), route: str(o.route, 1500), transport: str(o.transport, 1500),
        nearby: str(o.nearby, 1500), photos: photos.map((p) => url(String(p).trim())).filter(Boolean).slice(0, 24),
        blogUrl: url(o.blogUrl), lat: okC ? lat : null, lng: okC ? lng : null, coordSource: okC ? str(o.coordSource, 200) : '',
        coordStatus: okC ? cs : 'none', coordsVerified: okC && cs === 'verified', nameSource: str(o.nameSource, 200), demo: bool(o.demo)
      };
    },
    expenses(o) {
      const a = num(o.amount);
      return { id: str(o.id, 60) || uid(), date: date(o.date), destination: str(o.destination, 120), category: K.EXPENSE_CATEGORIES.includes(o.category) ? o.category : 'Other',
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
      return { schemaVersion: SCHEMA, updatedAt: new Date().toISOString(), settings: { officialTotal: 0 },
        passport: clone(K.PASSPORT), expenses: [], blogs: clone(K.BLOGS), collection: clone(K.COLLECTION) };
    },
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) { const s = JSON.parse(raw); if (s && s.schemaVersion === SCHEMA) return (this.state = this.normalise(s));
          if (s && s.schemaVersion === 1) { this.state = this.seed(); ['expenses', 'blogs', 'collection'].forEach((c) => { this.state[c] = (Array.isArray(s[c]) ? s[c] : []).map(cleaners[c]); }); this.migrated = true; this.save(); return this.state; } }
      } catch (e) { this.storageOk = false; }
      this.state = this.seed();
      this.save();
      return this.state;
    },
    normalise(s) {
      const out = { schemaVersion: SCHEMA, updatedAt: s.updatedAt || '', settings: { officialTotal: Math.max(0, Math.min(5000, parseInt(s.settings && s.settings.officialTotal, 10) || 0)) } };
      ['expenses', 'blogs', 'collection'].forEach((c) => { out[c] = (Array.isArray(s[c]) ? s[c] : []).slice(0, 5000).map(cleaners[c]); });
      const saved = {}; (Array.isArray(s.passport) ? s.passport : []).forEach((x) => { const c = cleaners.passport(x); saved[c.id] = c; });
      out.passport = K.PASSPORT.map((b) => saved[b.id] || cleaners.passport(b));
      return out;
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
    /* What is still missing before a record can count as fully verified. */
    missing(l) {
      const m = [];
      if (!l.name) m.push('destination name'); if (!l.postOffice) m.push('designated post office'); if (!/^\d{6}$/.test(l.pin)) m.push('PIN code');
      if (l.lat == null) m.push('coordinates'); else if (l.coordStatus !== 'verified') m.push('coordinate confirmation');
      if (!this.officialSource(l.source)) m.push('official source link (India Post / Karnataka Postal Circle)'); if (!l.verifiedDate) m.push('verification date');
      return m;
    },
    /* Computed, never typed in: verified = every field present AND an official source link AND a verification date. */
    verification(l) { if (!l.name) return 'pending'; return this.missing(l).length ? 'partial' : 'verified'; },
    stats() {
      const p = this.state.passport, total = p.length, vs = p.map((x) => this.verification(x));
      const verified = vs.filter((v) => v === 'verified').length, partial = vs.filter((v) => v === 'partial').length;
      const visited = p.filter((x) => x.visited).length;
      return { total, verified, partial, pending: total - verified - partial, visited, planned: total - visited,
        cancel: p.filter((x) => x.cancellationCollected).length, blogs: p.filter((x) => x.blogPublished).length,
        named: p.filter((x) => x.name).length, withCoords: p.filter((x) => x.lat != null).length,
        pct: total ? Math.round((visited / total) * 100) : 0, vpct: total ? Math.round((verified / total) * 100) : 0 };
    },
    statusOf(l) { return l.blogPublished ? 'blog' : l.cancellationCollected ? 'cancel' : l.visited ? 'visited' : 'planned'; },
    // ---- backup / import ----
    exportJSON() { return JSON.stringify(this.state, null, 2); },
    importJSON(text) {
      let s; try { s = JSON.parse(text); } catch (e) { throw new Error('That file is not valid JSON.'); }
      if (!s || typeof s !== 'object' || s.schemaVersion !== SCHEMA || !Array.isArray(s.passport)) throw new Error('Not a K_24 backup (expected schemaVersion ' + SCHEMA + ' and a passport list).');
      this.state = this.normalise(s); this.save(); return this.state;
    },
    csvCols: ['id', 'serial', 'districtOrder', 'passportDistrict', 'currentDistrict', 'name', 'attraction', 'category', 'postOffice', 'postOfficeType', 'pin', 'address', 'indexPage', 'passportPage', 'lat', 'lng', 'coordStatus', 'coordSource', 'source', 'verifiedDate', 'nameSource', 'visitDate', 'plannedDate', 'planned', 'visited', 'cancellationCollected', 'blogPublished', 'notes', 'history', 'photos', 'blogUrl'],
    verifiedCols: ['serial', 'passportDistrict', 'currentDistrict', 'name', 'postOffice', 'postOfficeType', 'pin', 'indexPage', 'passportPage', 'lat', 'lng', 'coordSource', 'source', 'verifiedDate', 'verification', 'notes'],
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
        this.state.passport[i] = cleaners.passport(Object.assign({}, cur, o, { id: cur.id, serial: cur.serial, districtOrder: cur.districtOrder, passportDistrict: cur.passportDistrict, currentDistrict: cur.currentDistrict }));
        updated++;
      });
      this.save(); return { added: 0, updated, skipped };
    },
    reset() { this.state = this.seed(); this.save(); },
    uid
  };
  K.store = S;
})();
(window.K24.mods = window.K24.mods || {})['store'] = '2026.10.13b';
