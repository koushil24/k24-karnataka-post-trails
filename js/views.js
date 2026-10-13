/* Views, part 1: shared components, Home, Passport tracker, Explore map, Destination details. */
(function () {
  const K = window.K24, S = K.store, { esc, safeUrl, inr, fmtDate, $, $$ } = K;
  const V = (K.views = K.views || {});
  const enc = encodeURIComponent;

  const ICON = {
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/><circle cx="12" cy="12" r="10"/>',
    stamp: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/>',
    pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>'
  };
  const ic = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;
  const demoTag = (f) => (f ? '<span class="tag tag-demo" title="Illustrative content — replace with your verified information">Demo</span>' : '');
  const chips = (l) => [l.visited ? '<span class="chip chip-visited">Visited</span>' : '<span class="chip chip-planned">Planned</span>',
    l.cancellationCollected ? '<span class="chip chip-cancel">Cancellation collected</span>' : '', l.blogPublished ? '<span class="chip chip-blog">Blog published</span>' : ''].join('');
  const empty = (title, text, action) => `<div class="empty"><strong>${esc(title)}</strong><p>${esc(text)}</p>${action || ''}</div>`;
  const pageHead = (title, sub, extra) => `<header class="page-head" data-reveal><div><h1>${esc(title)}</h1>${sub ? `<p class="lede">${esc(sub)}</p>` : ''}</div>${extra || ''}</header>`;
  K.c = { ic, demoTag, chips, empty, pageHead, enc };

  function destCard(l) {
    return `<article class="card dest-card"><a class="card-link" href="#/destination/${enc(l.id)}" aria-label="${esc(l.name)} — open details">${K.thumb(l.category, l.photos && l.photos[0], l.name)}
      <div class="card-body"><div class="tags"><span class="tag">${esc(l.category)}</span>${demoTag(l.demo)}</div><h3>${esc(l.name)}</h3><p class="muted">${esc(l.attraction || l.district)}</p><div class="chips">${chips(l)}</div></div></a></article>`;
  }
  function blogCard(b) {
    const d = S.find('passport', b.destinationId);
    return `<article class="card blog-card"><a class="card-link" href="#/blog/${enc(b.id)}">${K.thumb(b.category, b.cover, b.title)}
      <div class="card-body"><div class="tags"><span class="tag">${esc(b.category)}</span>${demoTag(b.demo)}</div><h3>${esc(b.title)}</h3>
      <p class="muted">${esc(b.excerpt)}</p><p class="meta">${b.date ? esc(fmtDate(b.date)) : 'Coming soon'} · ${K.readingTime(b.body)} min read${d ? ' · ' + esc(d.district) : ''}</p></div></a></article>`;
  }
  function collCard(c, tools) {
    const img = safeUrl(c.image);
    return `<article class="card coll-card"><span class="thumb paper"><img class="art" src="${K.postmarkUri(c.location || c.title, c.date, c.type === 'cancellation' ? 'Post Trails' : K.COLLECTION_TYPES[c.type])}" alt="" loading="lazy" width="300" height="300">${img ? `<img class="real" src="${esc(img)}" alt="${esc(c.title)}" loading="lazy" width="300" height="300">` : ''}</span>
      <div class="card-body"><div class="tags">${demoTag(c.demo)}${img ? '' : '<span class="tag">No photo yet</span>'}</div><h3>${esc(c.title)}</h3><p class="muted">${esc(c.location)}${c.date ? ' · ' + esc(fmtDate(c.date)) : ''}</p>${c.note ? `<p class="small">${esc(c.note)}</p>` : ''}
      ${tools ? `<div class="row-actions"><button class="btn btn-ghost btn-sm" data-edit-coll="${esc(c.id)}">${ic('edit')} Edit</button><button class="btn btn-ghost btn-sm danger" data-del-coll="${esc(c.id)}">${ic('trash')} Delete</button></div>` : ''}</div></article>`;
  }
  K.c.destCard = destCard; K.c.blogCard = blogCard; K.c.collCard = collCard;

  /* ================= HOME ================= */
  const gop = (cx, by, s, fill) => { let o = ''; for (let i = 0; i < 7; i++) { const w = (150 - i * 18) * s, h = 34 * s; o += `<rect x="${cx - w / 2}" y="${by - (i + 1) * h}" width="${w}" height="${h - 5 * s}" fill="${fill}"/>`; }
    return o + `<rect x="${cx - 90 * s}" y="${by}" width="${180 * s}" height="${60 * s}" fill="${fill}"/><rect x="${cx - 14 * s}" y="${by + 8 * s}" width="${28 * s}" height="${52 * s}" fill="#050f0b" opacity=".55"/><path d="M${cx} ${by - 7 * 34 * s - 6 * s}v-${22 * s}" stroke="${fill}" stroke-width="${4 * s}"/>`; };
  function heroLayers() {
    const pillars = Array.from({ length: 9 }, (_, i) => `<rect x="${600 + i * 38}" y="700" width="16" height="110"/>`).join('');
    return `<div class="hero-bg" aria-hidden="true">
      <svg class="layer" data-depth=".08" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="hsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#123a33"/><stop offset=".42" stop-color="#b9704a"/><stop offset=".74" stop-color="#f0b86e"/><stop offset="1" stop-color="#f8dfa6"/></linearGradient><radialGradient id="hsn"><stop offset="0" stop-color="#fff3c9" stop-opacity=".95"/><stop offset="1" stop-color="#fff3c9" stop-opacity="0"/></radialGradient></defs>
        <rect width="1600" height="900" fill="url(#hsk)"/><circle cx="1130" cy="560" r="280" fill="url(#hsn)"/><circle cx="1130" cy="560" r="56" fill="#fff6dc"/><g fill="#fff" opacity=".16"><ellipse cx="380" cy="250" rx="240" ry="16"/><ellipse cx="520" cy="286" rx="170" ry="11"/><ellipse cx="980" cy="210" rx="220" ry="15"/></g></svg>
      <svg class="layer" data-depth=".18" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice"><path d="M0 640L130 560L250 612L390 500L530 604L660 540L810 622L970 520L1130 612L1290 532L1450 600L1600 540V900H0Z" fill="#2f5e4d" opacity=".62"/><path d="M0 712L160 640L300 700L470 600L620 690L790 628L960 706L1130 636L1300 700L1460 650L1600 690V900H0Z" fill="#1d4a3b" opacity=".85"/></svg>
      <svg class="layer" data-depth=".3" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice"><g fill="#f0b05f" opacity=".35" transform="translate(-4,-5)">${gop(1060, 700, 1.25, '#f0b05f')}</g><g fill="#0f2a21">${gop(1060, 700, 1.25, '#0f2a21')}<rect x="590" y="676" width="372" height="26"/>${pillars}<rect x="560" y="806" width="520" height="20"/></g><g fill="#0c231b"><ellipse cx="300" cy="800" rx="120" ry="52"/><ellipse cx="410" cy="822" rx="90" ry="40"/><ellipse cx="1390" cy="808" rx="110" ry="46"/></g></svg>
      <svg class="layer" data-depth=".48" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice"><path d="M0 836C300 780 540 880 840 826S1320 800 1600 850V900H0Z" fill="#081a13"/><g stroke="#081a13" stroke-width="9" fill="none" stroke-linecap="round"><path d="M120 860Q140 700 110 560"/><path d="M110 560q-70 -30 -120 10M110 560q60 -50 130 -20M110 560q-10 -60 -70 -90M110 560q40 -70 110 -80"/></g></svg>
    </div>`;
  }
  const stampSVG = (cls) => `<svg class="${cls || ''}" viewBox="0 0 160 190" role="img" aria-label="Illustrative postage stamp showing a Karnataka temple tower"><defs><linearGradient id="stg${cls ? cls.length : 0}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8dfa6"/><stop offset="1" stop-color="#e08a4b"/></linearGradient></defs>
    <rect x="3" y="3" width="154" height="184" fill="#F7F1E3" stroke="#F7F1E3" stroke-width="6" stroke-dasharray="2 6" stroke-linecap="round"/><rect x="12" y="12" width="136" height="166" fill="#F7F1E3"/><rect x="18" y="18" width="124" height="124" fill="url(#stg${cls ? cls.length : 0})"/>
    <g fill="#103D2F"><path d="M18 142V116l26-22 20 18 28-34 28 30v34z" opacity=".5"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${80 - (34 - i * 6) / 2}" y="${126 - (i + 1) * 15}" width="${34 - i * 6}" height="13"/>`).join('')}<rect x="60" y="126" width="40" height="16"/></g>
    <text x="80" y="160" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#103D2F" letter-spacing="2">KARNATAKA</text><text x="80" y="173" text-anchor="middle" font-family="Georgia,serif" font-size="7" fill="#C83742" letter-spacing="1.5">ILLUSTRATIVE</text></svg>`;
  const cancelSVG = (txt) => `<svg class="hero-mark" viewBox="0 0 300 220" aria-hidden="true"><defs><path id="hmp" d="M110 110m-84 0a84 84 0 1 1 168 0a84 84 0 1 1 -168 0"/></defs>
    <g fill="none" stroke="#F7F1E3" stroke-linecap="round"><circle class="draw" pathLength="1" cx="110" cy="110" r="100" stroke-width="3"/><circle class="draw d2" pathLength="1" cx="110" cy="110" r="64" stroke-width="1.5"/><path class="draw d3" pathLength="1" d="M214 78q22 -12 42 0t42 0M214 96q22 -12 42 0t42 0M214 114q22 -12 42 0t42 0" stroke-width="3"/></g>
    <text font-family="Georgia,serif" font-size="15" letter-spacing="3.2" fill="#F7F1E3"><textPath href="#hmp" startOffset="1%">${esc(txt)} • POST TRAILS •</textPath></text><g fill="#F7F1E3"><path d="M110 80l9 13h-18zM103 93h14v28h-14z"/><text x="110" y="142" font-size="11" text-anchor="middle" font-family="Georgia,serif" letter-spacing="1">KARNATAKA</text></g></svg>`;
  const statCard = (n, label, icon, sub) => `<div class="stat"><span class="stat-ic">${ic(icon)}</span><strong data-count="${n}">0</strong><span class="stat-l">${esc(label)}</span><small class="muted">${esc(sub || '')}</small></div>`;

  function dashboard(st, withMap) {
    return `<section class="dash" data-reveal aria-labelledby="dash-h"><div class="card dash-main"><h2 id="dash-h">${esc(K.t('progress'))}</h2>
      <p class="muted">${st.hasDemo ? 'Illustrative list for now — replace it with the official locations on the Passport page.' : 'Tracking every designated post office in Karnataka.'}</p>
      <div class="stats" data-stagger>${statCard(st.total, 'Locations in my list', 'pin', st.official !== st.total ? 'Official total: ' + st.official : '')}${statCard(st.visited, 'Visited', 'check', 'With my own input')}${statCard(st.cancel, 'Cancellations collected', 'stamp')}${statCard(st.blogs, 'Blog posts published', 'pen')}</div>
      <div class="bar-wrap"><div class="bar-label"><span>Completion</span><strong>${st.pct}%</strong></div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st.pct}" aria-label="Passport completion"><i data-progress="${st.pct}"></i></div></div></div>
      ${withMap ? `<div class="card dash-map"><h2>Explore Karnataka</h2><p class="muted">Where my list sits on the map.</p><div class="mini-map" id="mini-map"></div><div class="legend" aria-label="Map legend">${['planned', 'visited', 'cancel', 'blog'].map((k) => `<span><i style="background:${K.map.COLORS[k]}"></i>${K.map.LABELS[k]}</span>`).join('')}</div><a class="btn btn-primary" href="#/explore">${esc(K.t('viewMap'))} ${ic('arrow')}</a></div>` : ''}</section>`;
  }

  V.home = () => {
    const st = S.stats(), blogs = S.list('blogs').slice(0, 4), feat = S.list('passport').slice(0, 6), coll = S.list('collection').slice(0, 4), pass = S.list('passport');
    const words = K.t('tagline').split(' ').map((w) => `<span class="w"><span class="word">${esc(w)}</span></span>`).join(' ');
    const stops = pass.slice(0, 5).map((p) => p.name.replace(/\s*\(.*\)/, ''));
    const pts = [[60, 230], [200, 110], [350, 200], [520, 90], [650, 150]];
    return { title: 'K_24 Karnataka Post Trails — Every Postmark Tells a Story', desc: 'A personal blog documenting Karnataka Philately Passport journeys, pictorial cancellations, post offices and heritage destinations.',
      html: `<section class="hero" aria-labelledby="hero-title">${heroLayers()}<div class="hero-shade" aria-hidden="true"></div>
        <div class="hero-inner"><div class="hero-copy"><div class="hero-logo"><img src="assets/logo-emblem.png" alt="" width="64" height="64"><span><strong>K_24</strong> Karnataka Post Trails</span></div>
          <h1 id="hero-title">${words}</h1><p class="hero-sub">${esc(K.t('mission'))}</p><p class="hero-cta"><a class="btn btn-gold" href="#/passport">${esc(K.t('start'))} ${ic('arrow')}</a></p></div>
          <div class="hero-art" aria-hidden="false"><div class="hero-stamp">${stampSVG('stamp-art')}</div>${cancelSVG('KARNATAKA')}</div></div></section>
        <div class="wrap">${dashboard(st, true)}
        <section class="block" data-reveal><div class="block-head"><h2>${esc(K.t('latest'))}</h2><a class="more" href="#/blogs">${esc(K.t('viewAll'))} ${ic('arrow')}</a></div><div class="grid g4" data-stagger>${blogs.map(blogCard).join('')}</div></section>
        <section class="block" data-reveal><div class="block-head"><h2>${esc(K.t('featured'))}</h2><a class="more" href="#/passport">${esc(K.t('viewAll'))} ${ic('arrow')}</a></div><div class="grid g3" data-stagger>${feat.map(destCard).join('')}</div></section>
        <section class="block" data-reveal><div class="block-head"><h2>${esc(K.t('stamps'))}</h2><a class="more" href="#/collection">${esc(K.t('viewAll'))} ${ic('arrow')}</a></div><div class="grid g4" data-stagger>${coll.map((c) => collCard(c)).join('')}</div></section></div>
        <section class="next" aria-labelledby="next-h"><div class="wrap next-grid"><div data-reveal><h2 id="next-h">${esc(K.t('next'))}</h2><p>Let’s explore another destination in Karnataka.</p><p class="btn-row"><a class="btn btn-gold" href="#/passport">View passport locations ${ic('arrow')}</a><a class="btn btn-outline-light" href="#/planner">Plan a trip</a></p></div>
          <div class="route-card" data-reveal><svg viewBox="0 0 710 300" role="img" aria-label="Illustrative dotted travel route linking ${stops.map(esc).join(', ')}"><defs><mask id="rmask"><path class="route-path" pathLength="1" d="M60 230Q130 100 200 110T350 200T520 90T650 150" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/></mask></defs><path d="M60 230Q130 100 200 110T350 200T520 90T650 150" mask="url(#rmask)" fill="none" stroke="#D5AC49" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 11"/>
          ${pts.map((p, i) => `<g class="stop" style="--i:${i}"><circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#C83742" stroke="#F7F1E3" stroke-width="3"/><text x="${p[0]}" y="${p[1] + (i % 2 ? -16 : 28)}" text-anchor="middle" fill="#F7F1E3" font-size="14" font-family="Inter,sans-serif">${esc(stops[i] || '')}</text></g>`).join('')}</svg><small>Illustrative route — not a real itinerary or distance.</small><div class="settle-stamp">${stampSVG('stamp-art')}</div></div></div></section>
        <section class="wrap block invite" data-reveal><div class="card invite-card"><div><h2>Collecting too? Say hello.</h2><p>Swap tips on post offices, cancellations and routes. There’s no mailing list yet — the contact page opens your e-mail app.</p></div><a class="btn btn-primary" href="#/contact">Get in touch</a></div></section>`,
      after(root) {
        const el = $('#mini-map', root); if (el) K.map.mount(el, pass, { interactive: false, zoom: 6 });
      } };
  };

  /* ================= PASSPORT ================= */
  const P = { tab: 'all', q: '', district: '', cat: '', sort: 'name', page: 1, size: 10 };
  const SORTS = { name: 'Name', district: 'District', status: 'Status', visitDate: 'Visit date', pin: 'PIN code' };
  const rank = (l) => (l.blogPublished ? 3 : l.cancellationCollected ? 2 : l.visited ? 1 : 0);
  function filtered() {
    const q = P.q.toLowerCase();
    let r = S.list('passport').filter((l) => {
      if (P.tab === 'planned' && l.visited) return false; if (P.tab === 'visited' && !l.visited) return false;
      if (P.tab === 'cancel' && !l.cancellationCollected) return false; if (P.tab === 'blog' && !l.blogPublished) return false;
      if (P.district && l.district !== P.district) return false; if (P.cat && l.category !== P.cat) return false;
      return !q || [l.name, l.district, l.attraction, l.postOffice, l.pin].join(' ').toLowerCase().includes(q);
    });
    const cmp = { name: (a, b) => a.name.localeCompare(b.name), district: (a, b) => a.district.localeCompare(b.district) || a.name.localeCompare(b.name),
      status: (a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name), visitDate: (a, b) => (b.visitDate || '').localeCompare(a.visitDate || ''), pin: (a, b) => (a.pin || '~').localeCompare(b.pin || '~') };
    return r.sort(cmp[P.sort] || cmp.name);
  }
  const districts = () => Array.from(new Set(S.list('passport').map((l) => l.district).filter(Boolean))).sort();
  function locFields() {
    const dest = [];
    return [
      { name: 'name', label: 'Location name', required: true, full: true, max: 120 },
      { name: 'district', label: 'District', max: 80 }, { name: 'category', label: 'Category', type: 'select', options: K.CATEGORIES, required: true },
      { name: 'attraction', label: 'Associated attraction', full: true, max: 160 },
      { name: 'postOffice', label: 'Designated post office', full: true, max: 160 },
      { name: 'pin', label: 'PIN code', inputmode: 'numeric', max: 6, validate: (v) => (/^\d{6}$/.test(v) ? '' : 'PIN codes have 6 digits.') },
      { name: 'verifiedDate', label: 'Cancellation availability verified on', type: 'date' },
      { name: 'address', label: 'Verified address', type: 'textarea', rows: 2, full: true, max: 400 },
      { name: 'source', label: 'Official source (link)', type: 'url', full: true, max: 300, placeholder: 'https://…' },
      { name: 'planned', label: 'Planned', type: 'checkbox' }, { name: 'visited', label: 'Visited', type: 'checkbox', help: 'Only tick this once you have actually been there.' },
      { name: 'visitDate', label: 'Visit date', type: 'date' }, { name: 'cancellationCollected', label: 'Cancellation collected', type: 'checkbox' },
      { name: 'blogPublished', label: 'Blog published', type: 'checkbox' }, { name: 'blogUrl', label: 'Blog URL', type: 'url', full: true },
      { name: 'lat', label: 'Latitude', type: 'number', step: 'any', validate: (v) => (v >= 8 && v <= 20 ? '' : 'Expected 8–20 for Karnataka.') }, { name: 'lng', label: 'Longitude', type: 'number', step: 'any', validate: (v) => (v >= 72 && v <= 80 ? '' : 'Expected 72–80 for Karnataka.') },
      { name: 'coordsVerified', label: 'I verified these coordinates', type: 'checkbox', full: true },
      { name: 'history', label: 'Historical background', type: 'textarea', full: true }, { name: 'route', label: 'Travel route', type: 'textarea', rows: 3, full: true },
      { name: 'transport', label: 'Transport notes', type: 'textarea', rows: 3, full: true }, { name: 'nearby', label: 'Nearby attractions', type: 'textarea', rows: 3, full: true },
      { name: 'notes', label: 'My travel story / notes', type: 'textarea', rows: 5, full: true },
      { name: 'photos', label: 'Photo links (one https:// link per line)', type: 'textarea', rows: 3, full: true, help: 'Only add photographs you took or are licensed to use.' },
      { name: 'demo', label: 'Mark as demo / illustrative entry', type: 'checkbox', full: true }
    ];
  }
  K.editLocation = (id, done) => {
    const cur = id ? S.find('passport', id) : null;
    const vals = cur ? Object.assign({}, cur, { photos: (cur.photos || []).join('\n') }) : { category: 'Heritage', planned: true };
    K.form({ title: cur ? 'Edit ' + cur.name : 'Add passport location', fields: locFields(), values: vals, onSubmit(d) {
      d.photos = String(d.photos || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
      d.id = cur ? cur.id : S.newId('passport', d.name);
      S.upsert('passport', d); K.toast(cur ? 'Location updated.' : 'Location added.'); if (done) done(d.id);
    } });
  };
  K.deleteLocation = async (id, done) => { const l = S.find('passport', id); if (!l) return; if (await K.confirm('Delete “' + l.name + '” from your passport list? This can’t be undone (export a backup first if unsure).')) { S.remove('passport', id); K.toast('Location deleted.'); if (done) done(); } };

  function rowHTML(l, i) {
    return `<tr><td data-label="#">${String(i).padStart(2, '0')}</td><td data-label="Location"><a class="loc" href="#/destination/${enc(l.id)}"><span class="mini-thumb">${K.thumb(l.category, l.photos && l.photos[0], '')}</span><span><strong>${esc(l.name)}</strong> ${demoTag(l.demo)}<br><small class="muted">${esc(l.attraction)}</small></span></a></td>
      <td data-label="District">${esc(l.district) || '—'}</td><td data-label="Post office">${l.postOffice ? esc(l.postOffice) + (l.pin ? '<br><small class="muted">PIN ' + esc(l.pin) + '</small>' : '') : '<small class="muted">Not added yet</small>'}</td>
      <td data-label="Status"><div class="chips">${chips(l)}</div>${l.visitDate ? `<small class="muted">Visited ${esc(fmtDate(l.visitDate))}</small>` : ''}</td>
      <td data-label="Actions" class="actions"><a class="btn btn-ghost btn-sm" href="#/destination/${enc(l.id)}">View</a><button class="btn btn-ghost btn-sm" data-edit="${esc(l.id)}" aria-label="Edit ${esc(l.name)}">${ic('edit')}</button><button class="btn btn-ghost btn-sm danger" data-del="${esc(l.id)}" aria-label="Delete ${esc(l.name)}">${ic('trash')}</button></td></tr>`;
  }
  async function importFile(root) {
    const f = await K.pickFile('.csv,.json,text/csv,application/json'); if (!f) return;
    try {
      if (/\.csv$/i.test(f.name)) {
        const items = S.importCSV(f.text);
        if (await K.confirm('Import ' + items.length + ' locations from CSV? Rows with an existing ID overwrite that location; other rows are added.', 'Import')) { const r = S.mergePassport(items); K.toast('Imported: ' + r.added + ' added, ' + r.updated + ' updated.'); }
      } else {
        const data = JSON.parse(f.text);
        if (Array.isArray(data)) { if (await K.confirm('Import ' + data.length + ' locations from JSON? Existing IDs are overwritten; others are added.', 'Import')) { const r = S.mergePassport(data.filter((x) => x && typeof x === 'object')); K.toast('Imported: ' + r.added + ' added, ' + r.updated + ' updated.'); } }
        else if (await K.confirm('This looks like a full backup. Replace ALL your passport, blog, collection and expense data with it?', 'Replace everything')) { S.importJSON(f.text); K.toast('Backup restored.'); }
        else return;
      }
      P.page = 1; renderPassport(root);
    } catch (e) { K.toast(e.message || 'Import failed.', 'error'); }
  }
  function renderPassport(root) {
    const st = S.stats(), list = filtered(), pages = Math.max(1, Math.ceil(list.length / P.size)); P.page = Math.min(P.page, pages);
    const from = (P.page - 1) * P.size, slice = list.slice(from, from + P.size);
    const dashEl = $('#p-dash', root); dashEl.innerHTML = dashboard(st, false).replace(/data-reveal/, '');
    K.anim.run(dashEl);
    const tabs = [['all', 'All', st.total], ['planned', 'Not yet visited', st.planned], ['visited', 'Visited', st.visited], ['cancel', 'Cancellations', st.cancel], ['blog', 'Blogs', st.blogs]];
    $('#p-tabs', root).innerHTML = tabs.map((t) => `<button class="pill ${P.tab === t[0] ? 'on' : ''}" data-tab="${t[0]}" aria-pressed="${P.tab === t[0]}">${t[1]} <span>${t[2]}</span></button>`).join('');
    const box = $('#p-list', root);
    box.innerHTML = slice.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>#</th><th>Location</th><th>District</th><th>Post office</th><th>Status</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${slice.map((l, i) => rowHTML(l, from + i + 1)).join('')}</tbody></table></div>`
      : empty('No locations match', S.list('passport').length ? 'Try clearing the search or filters.' : 'Your passport list is empty. Add a location or import your official list from CSV.', '<button class="btn btn-primary" data-add>Add a location</button>');
    $('#p-foot', root).innerHTML = list.length ? `<span>Showing ${from + 1}–${from + slice.length} of ${list.length} location${list.length === 1 ? '' : 's'}${st.hasDemo ? ' (includes demo data)' : ''}</span><span class="pager"><button class="btn btn-ghost btn-sm" data-page="-1" ${P.page <= 1 ? 'disabled' : ''}>Previous</button><b>Page ${P.page} of ${pages}</b><button class="btn btn-ghost btn-sm" data-page="1" ${P.page >= pages ? 'disabled' : ''}>Next</button></span>` : '';
    K.anim.listIn(box);
  }
  V.passport = () => {
    const ds = districts();
    return { title: 'My Philately Passport — K_24 Karnataka Post Trails', desc: 'Track visited post offices, pictorial cancellations and blog posts across the Karnataka Philately Passport.',
      html: `<div class="wrap">${pageHead('My Philately Passport', 'Track your progress, view visited locations and manage your collection.', `<div class="head-tools"><button class="btn btn-primary" data-add>${ic('plus')} Add location</button><details class="menu"><summary class="btn btn-ghost">Import / export</summary><div class="menu-pop"><button data-import>Import CSV or JSON…</button><button data-exp="csv">Export passport (CSV)</button><button data-exp="json">Export passport (JSON)</button><button data-exp="backup">Full backup (JSON)</button><button data-total>Set official total…</button></div></details></div>`)}
        <div id="p-dash"></div>
        <div class="toolbar"><div id="p-tabs" class="pills" role="group" aria-label="Status filter"></div>
          <div class="filters"><label class="search"><span class="sr">Search locations</span>${ic('search')}<input type="search" id="p-q" placeholder="Search locations, PIN, post office…" value="${esc(P.q)}"></label>
          <label><span class="sr">District</span><select id="p-d"><option value="">All districts</option>${ds.map((d) => `<option ${P.district === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>
          <label><span class="sr">Category</span><select id="p-c"><option value="">All categories</option>${K.CATEGORIES.map((d) => `<option ${P.cat === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>
          <label><span class="sr">Sort by</span><select id="p-s">${Object.keys(SORTS).map((k) => `<option value="${k}" ${P.sort === k ? 'selected' : ''}>Sort: ${SORTS[k]}</option>`).join('')}</select></label></div></div>
        <div id="p-list" aria-live="polite"></div><div id="p-foot" class="foot-row"></div>
        <p class="note">Data lives only in this browser. Use <em>Import / export → Full backup</em> to keep a copy. Official post-office details must come from the official passport list — demo rows are illustrative.</p></div>`,
      after(root) {
        renderPassport(root);
        const re = () => renderPassport(root);
        $('#p-q', root).addEventListener('input', K.debounce((e) => { P.q = e.target.value; P.page = 1; re(); }, 180));
        $('#p-d', root).addEventListener('change', (e) => { P.district = e.target.value; P.page = 1; re(); });
        $('#p-c', root).addEventListener('change', (e) => { P.cat = e.target.value; P.page = 1; re(); });
        $('#p-s', root).addEventListener('change', (e) => { P.sort = e.target.value; re(); });
        root.addEventListener('click', async (e) => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.tab) { P.tab = b.dataset.tab; P.page = 1; re(); }
          else if (b.dataset.page) { P.page += Number(b.dataset.page); re(); }
          else if (b.hasAttribute('data-add')) K.editLocation(null, re);
          else if (b.dataset.edit) K.editLocation(b.dataset.edit, re);
          else if (b.dataset.del) K.deleteLocation(b.dataset.del, re);
          else if (b.hasAttribute('data-import')) { b.closest('details').open = false; importFile(root); }
          else if (b.dataset.exp) { b.closest('details').open = false; const d = new Date().toISOString().slice(0, 10);
            if (b.dataset.exp === 'csv') K.download('k24-passport-' + d + '.csv', S.exportCSV(), 'text/csv'); else if (b.dataset.exp === 'json') K.download('k24-passport-' + d + '.json', JSON.stringify(S.list('passport'), null, 2), 'application/json'); else K.download('k24-backup-' + d + '.json', S.exportJSON(), 'application/json'); }
          else if (b.hasAttribute('data-total')) { b.closest('details').open = false; K.form({ title: 'Official total', intro: 'How many locations does the official passport list contain? Completion % is measured against this. Leave 0 to use the size of your list.', fields: [{ name: 'n', label: 'Official number of locations', type: 'number', min: 0, step: 1 }], values: { n: S.state.settings.officialTotal }, onSubmit(d) { S.setOfficialTotal(d.n); re(); } }); }
        });
      } };
  };

  /* ================= EXPLORE (map + list) ================= */
  const E = { view: 'map', district: '', status: '' };
  V.explore = (ctx) => {
    const focus = ctx.q.get('id') || '';
    const st = S.stats();
    return { title: 'Explore Karnataka — K_24 Karnataka Post Trails', desc: 'Interactive map of Karnataka Philately Passport destinations.',
      html: `<div class="wrap">${pageHead('Explore Karnataka', 'An interactive map of every location in your passport list.')}
        <div class="toolbar"><div class="pills" role="group" aria-label="View"><button class="pill ${E.view === 'map' ? 'on' : ''}" data-view="map" aria-pressed="${E.view === 'map'}">Map</button><button class="pill ${E.view === 'list' ? 'on' : ''}" data-view="list" aria-pressed="${E.view === 'list'}">List</button></div>
          <div class="filters"><label><span class="sr">District</span><select id="e-d"><option value="">All districts</option>${districts().map((d) => `<option ${E.district === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>
          <label><span class="sr">Status</span><select id="e-s">${[['', 'All statuses'], ['planned', 'Planned'], ['visited', 'Visited'], ['cancel', 'Cancellation collected'], ['blog', 'Blog published']].map((o) => `<option value="${o[0]}" ${E.status === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label></div></div>
        <div class="legend big" aria-label="Map legend">${['planned', 'visited', 'cancel', 'blog'].map((k) => `<span><i style="background:${K.map.COLORS[k]}"></i>${K.map.LABELS[k]}</span>`).join('')}</div>
        <div id="e-map-wrap" ${E.view === 'list' ? 'hidden' : ''}><div class="big-map" id="e-map" role="region" aria-label="Map of Karnataka passport locations"></div></div>
        <div id="e-list" ${E.view === 'map' ? 'hidden' : ''}></div>
        <p class="note" id="e-note">${st.unverifiedCoords ? `${st.unverifiedCoords} marker${st.unverifiedCoords === 1 ? ' is' : 's are'} placed at approximate positions and ${st.unverifiedCoords === 1 ? 'has' : 'have'} not been verified — edit a location and tick “I verified these coordinates” once you have checked it. Locations without coordinates appear only in the list.` : 'Positions are those you entered.'}</p></div>`,
      after(root) {
        let ctl = null;
        const sel = () => S.list('passport').filter((l) => (!E.district || l.district === E.district) && (!E.status || S.statusOf(l) === E.status));
        const drawList = () => { const l = sel(); $('#e-list', root).innerHTML = l.length ? `<div class="grid g3">${l.map(destCard).join('')}</div>` : empty('Nothing matches these filters', 'Change the district or status filter.'); K.anim.listIn($('#e-list', root)); };
        const upd = () => { drawList(); if (ctl) { const n = ctl.set(sel(), true); const nc = sel().filter((l) => l.lat == null).length; $('#e-note', root).dataset.n = n + ':' + nc; } };
        const mountMap = async () => { ctl = await K.map.mount($('#e-map', root), sel(), { focusId: focus, onError() { K.toast('Map unavailable — showing the list instead.', 'error'); } }); if (!ctl) { E.view = 'list'; setView(); } };
        const setView = () => { $('#e-map-wrap', root).hidden = E.view !== 'map'; $('#e-list', root).hidden = E.view !== 'list'; $$('[data-view]', root).forEach((b) => { b.classList.toggle('on', b.dataset.view === E.view); b.setAttribute('aria-pressed', b.dataset.view === E.view); }); if (E.view === 'map' && ctl) ctl.invalidate(); };
        drawList(); if (E.view === 'map') mountMap();
        $$('[data-view]', root).forEach((b) => b.addEventListener('click', () => { E.view = b.dataset.view; if (E.view === 'map' && !ctl) mountMap(); setView(); }));
        $('#e-d', root).addEventListener('change', (e) => { E.district = e.target.value; upd(); });
        $('#e-s', root).addEventListener('change', (e) => { E.status = e.target.value; upd(); });
      } };
  };

  /* ================= DESTINATION DETAILS ================= */
  const para = (t, fallback) => (t ? `<p class="prose">${esc(t)}</p>` : `<p class="muted">${esc(fallback)}</p>`);
  V.destination = (ctx) => {
    const id = decodeURIComponent(ctx.params[0] || ''), l = S.find('passport', id);
    if (!l) return V.notfound({ what: 'destination' });
    const all = S.list('passport'), i = all.findIndex((x) => x.id === l.id), prev = all[i - 1], next = all[i + 1];
    const spent = S.list('expenses').filter((e) => e.destination === l.name), total = spent.reduce((a, e) => a + e.amount, 0);
    const posts = S.list('blogs').filter((b) => b.destinationId === l.id), related = all.filter((x) => x.id !== l.id && x.district === l.district).slice(0, 3);
    const photos = (l.photos || []).filter(safeUrl);
    const row = (k, v) => `<div class="kv"><dt>${k}</dt><dd>${v ? esc(v) : '<span class="muted">Not added yet</span>'}</dd></div>`;
    return { title: l.name + ' — K_24 Karnataka Post Trails', desc: 'Post office details, cancellation and travel notes for ' + l.name + (l.district ? ', ' + l.district : '') + '.',
      html: `<article class="dest"><header class="dest-cover"><img class="art" src="${K.sceneUri(K.kindOf(l.category))}" alt="Illustrative artwork for ${esc(l.name)} (not a photograph)">${photos[0] ? `<img class="real" src="${esc(photos[0])}" alt="${esc(l.name)}">` : ''}<div class="dest-title wrap"><a class="back" href="#/passport">${ic('left')} Passport</a><div class="tags"><span class="tag">${esc(l.category)}</span>${demoTag(l.demo)}</div><h1>${esc(l.name)}</h1><p>${esc(l.attraction)}${l.district ? ' · ' + esc(l.district) + ' district' : ''}</p></div></header>
        <div class="wrap dest-grid"><div class="dest-main">
          <div class="chips big-chips">${chips(l)}</div>
          <div class="btn-row"><a class="btn btn-primary" href="#/explore?id=${enc(l.id)}">View on map</a><button class="btn btn-ghost" data-edit="${esc(l.id)}">${ic('edit')} Edit details</button><button class="btn btn-ghost danger" data-del="${esc(l.id)}">${ic('trash')} Delete</button></div>
          <section><h2>Historical background</h2>${para(l.history, 'Add the history of this place by editing the destination.')}</section>
          <section><h2>My travel story</h2>${para(l.notes, 'Your own story goes here — write it when you’ve visited.')}</section>
          <section><h2>Travel route &amp; transport</h2><h3>Route</h3>${para(l.route, 'No route notes yet.')}<h3>Transport</h3>${para(l.transport, 'No transport notes yet. Check current timetables and fares with the operators.')}</section>
          <section><h2>Nearby attractions</h2>${para(l.nearby, 'No nearby attractions listed yet.')}${related.length ? `<p class="muted">Other passport locations in ${esc(l.district)}:</p><div class="grid g3">${related.map(destCard).join('')}</div>` : ''}</section>
          <section><h2>Gallery</h2>${photos.length ? `<div class="gallery">${photos.map((p) => `<figure class="ph"><img class="real" loading="lazy" src="${esc(p)}" alt="${esc(l.name)} photo"></figure>`).join('')}</div><p class="note">Photographs are shown as added by the owner.</p>` : empty('No photographs yet', 'Add links to your own photographs by editing this destination.')}</section>
          ${posts.length ? `<section><h2>Related posts</h2><div class="grid g3">${posts.map(blogCard).join('')}</div></section>` : ''}
        </div><aside class="dest-side">
          <div class="card pad"><h2>Post office details ${demoTag(l.demo)}</h2><dl>${row('Post office', l.postOffice)}${row('District', l.district)}${row('PIN code', l.pin)}${row('Address', l.address)}${row('Official source', l.source && safeUrl(l.source) ? '' : l.source)}${l.source && safeUrl(l.source) ? `<div class="kv"><dt>Source link</dt><dd><a href="${esc(safeUrl(l.source))}" target="_blank" rel="noopener noreferrer">Open official source</a></dd></div>` : ''}${row('Availability verified', fmtDate(l.verifiedDate))}${row('Visit date', fmtDate(l.visitDate))}</dl></div>
          <div class="card pad"><h2>Cancellation</h2><span class="thumb paper"><img class="art" src="${K.postmarkUri(l.name, l.visitDate, 'Post Trails')}" alt="Illustration of a postmark — not my actual cancellation"></span><p class="small muted">Illustration only. Your own cancellation photographs belong in the gallery.</p></div>
          <div class="card pad"><h2>Expenses</h2><p class="stat-inline"><strong>${inr(total)}</strong> <span class="muted">across ${spent.length} logged item${spent.length === 1 ? '' : 's'}</span></p><a class="btn btn-ghost btn-sm" href="#/expenses">Open expense tracker</a></div>
          ${l.blogUrl && safeUrl(l.blogUrl) ? `<a class="btn btn-gold" target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(l.blogUrl))}">Read my blog post</a>` : ''}
        </aside></div>
        <nav class="wrap pn" aria-label="Previous and next destination">${prev ? `<a href="#/destination/${enc(prev.id)}">${ic('left')} ${esc(prev.name)}</a>` : '<span></span>'}${next ? `<a href="#/destination/${enc(next.id)}">${esc(next.name)} ${ic('arrow')}</a>` : '<span></span>'}</nav></article>`,
      after(root) {
        root.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.edit) K.editLocation(b.dataset.edit, () => K.render());
          if (b.dataset.del) K.deleteLocation(b.dataset.del, () => { location.hash = '#/passport'; }); });
        root.addEventListener('error', (e) => { const f = e.target.closest && e.target.closest('.ph'); if (f) f.remove(); }, true);
      } };
  };
})();
(window.K24.mods = window.K24.mods || {})['views'] = '2026.10.13a';
