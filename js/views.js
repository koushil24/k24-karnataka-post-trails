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
  const chips = (l) => [K.vchip ? K.vchip(l) : '', l.visited ? '<span class="chip chip-visited">Visited</span>' : '', l.cancellationCollected ? '<span class="chip chip-cancel">Cancellation collected</span>' : '', l.blogPublished ? '<span class="chip chip-blog">Blog published</span>' : ''].join('');
  const empty = (title, text, action) => `<div class="empty"><strong>${esc(title)}</strong><p>${esc(text)}</p>${action || ''}</div>`;
  const pageHead = (title, sub, extra) => `<header class="page-head" data-reveal><div><h1>${esc(title)}</h1>${sub ? `<p class="lede">${esc(sub)}</p>` : ''}</div>${extra || ''}</header>`;
  K.c = { ic, demoTag, chips, empty, pageHead, enc };

  function destCard(l) {
    return `<article class="card dest-card"><a class="card-link" href="#/destination/${enc(l.id)}" aria-label="${esc(K.dn(l))} — open details">${K.thumb(l.category, l.photos && l.photos[0], K.dn(l))}
      <div class="card-body"><div class="tags"><span class="tag">${esc(l.category)}</span></div><h3><span class="serial">#${l.serial}</span> ${esc(K.dn(l))}</h3><p class="muted">${esc(l.passportDistrict)}${l.postOffice ? ' · ' + esc(l.postOffice) : ''}</p><div class="chips">${chips(l)}</div></div></a></article>`;
  }
  function blogCard(b) {
    const d = S.find('passport', b.destinationId);
    return `<article class="card blog-card"><a class="card-link" href="#/blog/${enc(b.id)}">${K.thumb(b.category, b.cover, b.title)}
      <div class="card-body"><div class="tags"><span class="tag">${esc(b.category)}</span>${demoTag(b.demo)}</div><h3>${esc(b.title)}</h3>
      <p class="muted">${esc(b.excerpt)}</p><p class="meta">${b.date ? esc(fmtDate(b.date)) : 'Coming soon'} · ${K.readingTime(b.body)} min read${d ? ' · ' + esc(d.passportDistrict) : ''}</p></div></a></article>`;
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
    const w = (n) => (st.total ? (n / st.total) * 100 : 0);
    return `<section class="dash" data-reveal aria-labelledby="dash-h"><div class="card dash-main"><h2 id="dash-h">${esc(K.t('progress'))}</h2>
      <p class="muted">${st.named === 0 ? 'The 100 passport slots are ready in the original district order. Destination names and post-office details appear as you add and verify them.' : 'Tracking the 100 permanent pictorial cancellations of Karnataka.'}</p>
      <div class="stats" data-stagger>${statCard(st.total, 'Passport destinations', 'pin', '30 districts')}${statCard(st.visited, 'Visited', 'check', 'With my own input')}${statCard(st.cancel, 'Cancellations collected', 'stamp')}${statCard(st.verified, 'Fully verified records', 'pen', 'of ' + st.total)}</div>
      <div class="bar-wrap"><div class="bar-label"><span>Data verification</span><strong>${st.verified} verified · ${st.partial} partial · ${st.pending} pending</strong></div><div class="seg" role="img" aria-label="${st.verified} verified, ${st.partial} partial, ${st.pending} pending"><i class="s-v" style="width:${w(st.verified)}%"></i><i class="s-p" style="width:${w(st.partial)}%"></i></div></div>
      <div class="bar-wrap"><div class="bar-label"><span>Visited</span><strong>${st.pct}%</strong></div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st.pct}" aria-label="Passport visited"><i data-progress="${st.pct}"></i></div></div></div>
      ${withMap ? `<div class="card dash-map"><h2>Explore Karnataka</h2><p class="muted">${st.withCoords} of ${st.total} destinations have coordinates.</p><div class="mini-map" id="mini-map"></div><div class="legend" aria-label="Map legend">${['planned', 'visited', 'cancel', 'blog'].map((k) => `<span><i style="background:${K.map.COLORS[k]}"></i>${K.map.LABELS[k]}</span>`).join('')}</div><a class="btn btn-primary" href="#/explore">${esc(K.t('viewMap'))} ${ic('arrow')}</a></div>` : ''}</section>`;
  }

  V.home = () => {
    const st = S.stats(), blogs = S.list('blogs').slice(0, 4), feat = S.list('passport').filter((l) => l.name).slice(0, 6), coll = S.list('collection').slice(0, 4), pass = S.list('passport');
    const words = K.t('tagline').split(' ').map((w) => `<span class="w"><span class="word">${esc(w)}</span></span>`).join(' ');
    const named = pass.filter((p) => p.name); const stops = (named.length >= 5 ? named.slice(0, 5).map((p) => p.name.replace(/\s*\(.*\)/, '')) : K.DISTRICTS.slice(0, 5).map((d) => d.name));
    const pts = [[60, 230], [200, 110], [350, 200], [520, 90], [650, 150]];
    return { title: 'K_24 Karnataka Post Trails — Every Postmark Tells a Story', desc: 'A personal blog documenting Karnataka Philately Passport journeys, pictorial cancellations, post offices and heritage destinations.',
      html: `<section class="hero" aria-labelledby="hero-title">${heroLayers()}<div class="hero-shade" aria-hidden="true"></div>
        <div class="hero-inner"><div class="hero-copy"><div class="hero-logo"><img src="assets/logo-emblem.png" alt="" width="64" height="64"><span><strong>K_24</strong> Karnataka Post Trails</span></div>
          <h1 id="hero-title">${words}</h1><p class="hero-sub">${esc(K.t('mission'))}</p><p class="hero-cta"><a class="btn btn-gold" href="#/passport">${esc(K.t('start'))} ${ic('arrow')}</a></p></div>
          <div class="hero-art" aria-hidden="false"><div class="hero-stamp">${stampSVG('stamp-art')}</div>${cancelSVG('KARNATAKA')}</div></div></section>
        <div class="wrap">${dashboard(st, true)}
        <section class="block" data-reveal><div class="block-head"><h2>${esc(K.t('latest'))}</h2><a class="more" href="#/blogs">${esc(K.t('viewAll'))} ${ic('arrow')}</a></div><div class="grid g4" data-stagger>${blogs.map(blogCard).join('')}</div></section>
        <section class="block" data-reveal><div class="block-head"><h2>${esc(K.t('featured'))}</h2><a class="more" href="#/explore">${esc(K.t('viewAll'))} ${ic('arrow')}</a></div>${feat.length ? `<div class="grid g3" data-stagger>${feat.map(destCard).join('')}</div>` : empty('Destinations will appear here', 'Open the passport checklist and add the first destination names from your passport.', '<a class="btn btn-primary" href="#/passport">Open passport checklist</a>')}</section>
        <section class="block" data-reveal><div class="block-head"><h2>${esc(K.t('stamps'))}</h2><a class="more" href="#/collection">${esc(K.t('viewAll'))} ${ic('arrow')}</a></div><div class="grid g4" data-stagger>${coll.map((c) => collCard(c)).join('')}</div></section></div>
        <section class="next" aria-labelledby="next-h"><div class="wrap next-grid"><div data-reveal><h2 id="next-h">${esc(K.t('next'))}</h2><p>Let’s explore another destination in Karnataka.</p><p class="btn-row"><a class="btn btn-gold" href="#/passport">View passport locations ${ic('arrow')}</a><a class="btn btn-outline-light" href="#/planner">Plan a trip</a></p></div>
          <div class="route-card" data-reveal><svg viewBox="0 0 710 300" role="img" aria-label="Illustrative dotted route across ${stops.map(esc).join(', ')}"><defs><mask id="rmask"><path class="route-path" pathLength="1" d="M60 230Q130 100 200 110T350 200T520 90T650 150" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/></mask></defs><path d="M60 230Q130 100 200 110T350 200T520 90T650 150" mask="url(#rmask)" fill="none" stroke="#D5AC49" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 11"/>
          ${pts.map((p, i) => `<g class="stop" style="--i:${i}"><circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#C83742" stroke="#F7F1E3" stroke-width="3"/><text x="${p[0]}" y="${p[1] + (i % 2 ? -16 : 28)}" text-anchor="middle" fill="#F7F1E3" font-size="14" font-family="Inter,sans-serif">${esc(stops[i] || '')}</text></g>`).join('')}</svg><small>Illustrative route — not a real itinerary or distance.</small><div class="settle-stamp">${stampSVG('stamp-art')}</div></div></div></section>
        <section class="wrap block invite" data-reveal><div class="card invite-card"><div><h2>Collecting too? Say hello.</h2><p>Swap tips on post offices, cancellations and routes. There’s no mailing list yet — the contact page opens your e-mail app.</p></div><a class="btn btn-primary" href="#/contact">Get in touch</a></div></section>`,
      after(root) {
        const el = $('#mini-map', root); if (el) K.map.mount(el, pass, { interactive: false });
      } };
  };

  /* ================= DESTINATION DETAILS ================= */
  const para = (t, fallback) => (t ? `<p class="prose">${esc(t)}</p>` : `<p class="muted">${esc(fallback)}</p>`);
  V.destination = (ctx) => {
    const id = decodeURIComponent(ctx.params[0] || ''), l = S.find('passport', id);
    if (!l) return V.notfound({ what: 'destination' });
    const all = S.list('passport'), i = all.findIndex((x) => x.id === l.id), prev = all[i - 1], next = all[i + 1];
    const spent = l.name ? S.list('expenses').filter((e) => e.destination === l.name) : [], total = spent.reduce((a, e) => a + e.amount, 0);
    const posts = S.list('blogs').filter((b) => b.destinationId === l.id), photos = (l.photos || []).filter(safeUrl), miss = S.missing(l), ver = S.verification(l);
    const row = (k, v, empty) => `<div class="kv"><dt>${k}</dt><dd>${v ? v : `<span class="muted">${empty || 'Not available'}</span>`}</dd></div>`;
    const dist = l.lat != null ? K.geo.label(K.geo.straight(K.origin, l)) : '';
    return { title: '#' + l.serial + ' ' + K.dn(l) + ' — K_24 Karnataka Post Trails', desc: 'Passport destination ' + l.serial + ' in ' + l.passportDistrict + ' district: designated post office, PIN code and verification status.',
      html: `<article class="dest"><header class="dest-cover"><img class="art" src="${K.sceneUri(K.kindOf(l.category))}" alt="Illustrative artwork (not a photograph)">${photos[0] ? `<img class="real" src="${esc(photos[0])}" alt="${esc(K.dn(l))}">` : ''}<div class="dest-title wrap"><a class="back" href="#/passport">${ic('left')} Passport checklist</a><div class="tags"><span class="tag">#${l.serial}</span><span class="tag">${esc(l.passportDistrict)}</span></div><h1>${esc(K.dn(l))}</h1><p>${l.postOffice ? 'Post office: ' + esc(l.postOffice) : 'Designated post office: not available yet'}</p></div></header>
        <div class="wrap dest-grid"><div class="dest-main"><div class="chips big-chips">${chips(l)}</div>
          ${ver !== 'verified' ? `<div class="warn"><strong>${ver === 'pending' ? 'Pending verification.' : 'Partially verified.'}</strong> Still needed: ${esc(miss.join(', '))}.</div>` : ''}
          <div class="btn-row"><button class="btn btn-primary" data-edit="${esc(l.id)}">${ic('edit')} Edit / add details</button>${l.lat != null ? `<a class="btn btn-ghost" href="#/explore?id=${enc(l.id)}">View on map</a><a class="btn btn-ghost" target="_blank" rel="noopener noreferrer" href="${K.geo.googleMaps(l)}">Google Maps</a><a class="btn btn-ghost" target="_blank" rel="noopener noreferrer" href="${K.geo.osm(l)}">OpenStreetMap</a>` : ''}</div>
          ${l.lat == null ? '<p class="note">No coordinates yet, so there is no map marker and no distance. Use Edit → “Find coordinates on OpenStreetMap”, then confirm the position.</p>' : ''}
          <section><h2>Postal heritage significance</h2>${para(l.history, 'Add what makes this site and its pictorial cancellation special.')}</section>
          <section><h2>My travel story</h2>${para(l.notes, 'Your own story goes here once you’ve visited.')}</section>
          <section><h2>Gallery</h2>${photos.length ? `<div class="gallery">${photos.map((p) => `<figure class="ph"><img class="real" loading="lazy" src="${esc(p)}" alt="${esc(K.dn(l))} photo"></figure>`).join('')}</div>` : empty('No photographs yet', 'Add links to your own photographs by editing this record.')}</section>
          ${posts.length ? `<section><h2>Related posts</h2><div class="grid g3">${posts.map(blogCard).join('')}</div></section>` : ''}</div>
        <aside class="dest-side"><div class="card pad"><h2>Passport record</h2><dl>${row('Serial', '#' + l.serial)}${row('Passport district', esc(l.passportDistrict))}${row('Current district', esc(l.currentDistrict))}${row('Destination', l.name ? esc(l.name) : '', 'Pending verification')}${row('Post office', l.postOffice ? esc(l.postOffice) : '', 'Pending verification')}${row('Office type', esc(l.postOfficeType))}${row('PIN code', esc(l.pin), 'Pending verification')}
          ${row('Passport page', l.passportPage ? esc(l.passportPage) : (l.pageInferred ? '≈ ' + l.pageInferred + ' <small class="muted">(inferred from the index: district starts p.' + l.indexPage + ')</small>' : ''))}${row('Address', esc(l.address))}
          ${row('Coordinates', l.lat != null ? esc(l.lat.toFixed(5) + ', ' + l.lng.toFixed(5)) + ' <small class="muted">(' + (l.coordStatus === 'verified' ? 'confirmed' : 'not confirmed') + (l.coordSource ? ' · ' + esc(l.coordSource) : '') + ')</small>' : '', 'No verified coordinates')}
          ${row('Distance', dist ? esc(dist) + ' <small class="muted">from ' + esc(K.origin.name) + '</small>' : '', 'Not available (no coordinates)')}
          ${l.source && safeUrl(l.source) ? `<div class="kv"><dt>Source</dt><dd><a href="${esc(safeUrl(l.source))}" target="_blank" rel="noopener noreferrer">${K.store.officialSource(l.source) ? 'Official source' : 'Source (not an official domain)'}</a></dd></div>` : row('Source', '', 'No source link yet')}
          ${row('Last verified', esc(fmtDate(l.verifiedDate)), 'Not verified yet')}${row('Name came from', esc(l.nameSource))}${row('Planned / visited', esc([fmtDate(l.plannedDate) && 'planned ' + fmtDate(l.plannedDate), fmtDate(l.visitDate) && 'visited ' + fmtDate(l.visitDate)].filter(Boolean).join(' · ')), '—')}</dl></div>
          <div class="card pad"><h2>Expenses</h2><p class="stat-inline"><strong>${inr(total)}</strong> <span class="muted">across ${spent.length} logged item${spent.length === 1 ? '' : 's'}</span></p><a class="btn btn-ghost btn-sm" href="#/expenses">Open expense tracker</a></div></aside></div>
        <nav class="wrap pn" aria-label="Previous and next destination">${prev ? `<a href="#/destination/${enc(prev.id)}">${ic('left')} #${prev.serial} ${esc(K.dn(prev))}</a>` : '<span></span>'}${next ? `<a href="#/destination/${enc(next.id)}">#${next.serial} ${esc(K.dn(next))} ${ic('arrow')}</a>` : '<span></span>'}</nav></article>`,
      after(root) { root.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.dataset.edit) K.editLocation(b.dataset.edit, () => K.render()); });
        root.addEventListener('error', (e) => { const f = e.target.closest && e.target.closest('.ph'); if (f) f.remove(); }, true); } };
  };
})();
(window.K24.mods = window.K24.mods || {})['views'] = '2026.10.13b';
