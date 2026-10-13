/* Views, part 2: Blogs, Collection, Expenses, Journey planner, About, Contact, Privacy, 404. */
(function () {
  const K = window.K24, S = K.store, { esc, safeUrl, inr, fmtDate, $, $$ } = K;
  const V = K.views, { ic, demoTag, empty, pageHead, blogCard, collCard, destCard, enc } = K.c;
  const monthLabel = (ym) => { if (!/^\d{4}-\d{2}$/.test(ym)) return 'No date'; return new Date(ym + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); };

  /* ================= BLOGS ================= */
  const B = { q: '', cat: '' };
  function blogFields() {
    return [{ name: 'title', label: 'Title', required: true, full: true, max: 160 }, { name: 'category', label: 'Category', type: 'select', options: K.CATEGORIES, required: true },
      { name: 'destinationId', label: 'Related passport destination', type: 'select', options: S.list('passport').filter((l) => l.name).map((l) => ({ v: l.id, l: l.name })) },
      { name: 'date', label: 'Publish date (leave empty for “coming soon”)', type: 'date' }, { name: 'cover', label: 'Cover image link (your own photo)', type: 'url', full: true, max: 2000 },
      { name: 'excerpt', label: 'Short summary', type: 'textarea', rows: 2, full: true, max: 400 }, { name: 'body', label: 'Story (separate paragraphs with a blank line)', type: 'textarea', rows: 10, full: true, max: 30000 },
      { name: 'demo', label: 'Mark as demo / placeholder', type: 'checkbox', full: true }];
  }
  K.editBlog = (id, done) => {
    const cur = id ? S.find('blogs', id) : null;
    K.form({ title: cur ? 'Edit post' : 'New blog post', fields: blogFields(), values: cur || { category: 'Travel' }, onSubmit(d) { d.id = cur ? cur.id : S.newId('blogs', d.title); S.upsert('blogs', d); K.toast(cur ? 'Post updated.' : 'Post saved.'); if (done) done(d.id); } });
  };
  function renderBlogs(root) {
    const q = B.q.toLowerCase(), cats = Array.from(new Set(S.list('blogs').map((b) => b.category)));
    $('#b-cats', root).innerHTML = ['', ...cats].map((c) => `<button class="pill ${B.cat === c ? 'on' : ''}" data-cat="${esc(c)}" aria-pressed="${B.cat === c}">${c ? esc(c) : 'All'}</button>`).join('');
    const list = S.list('blogs').filter((b) => (!B.cat || b.category === B.cat) && (!q || (b.title + ' ' + b.excerpt + ' ' + b.body).toLowerCase().includes(q)));
    const box = $('#b-list', root); box.innerHTML = list.length ? `<div class="grid g3">${list.map(blogCard).join('')}</div>` : empty('No posts found', S.list('blogs').length ? 'Try a different category or search.' : 'Write your first post to get started.', '<button class="btn btn-primary" data-new>New post</button>');
    K.anim.listIn(box);
  }
  V.blogs = () => ({ title: 'Travel Blogs — K_24 Karnataka Post Trails', desc: 'Travel stories from the Karnataka Philately Passport trail: post offices, cancellations, heritage and budgets.',
    html: `<div class="wrap">${pageHead('Travel Blogs', 'Real journeys. Honest experiences. Useful tips.', `<div class="head-tools"><button class="btn btn-primary" data-new>${ic('plus')} New post</button></div>`)}
      <div class="toolbar"><div id="b-cats" class="pills" role="group" aria-label="Category filter"></div><label class="search"><span class="sr">Search blogs</span>${ic('search')}<input type="search" id="b-q" placeholder="Search posts…" value="${esc(B.q)}"></label></div><div id="b-list" aria-live="polite"></div></div>`,
    after(root) { renderBlogs(root); $('#b-q', root).addEventListener('input', K.debounce((e) => { B.q = e.target.value; renderBlogs(root); }, 180));
      root.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-cat')) { B.cat = b.dataset.cat; renderBlogs(root); } else if (b.hasAttribute('data-new')) K.editBlog(null, (id) => { location.hash = '#/blog/' + enc(id); }); }); } });

  V.blog = (ctx) => {
    const id = decodeURIComponent(ctx.params[0] || ''), b = S.find('blogs', id); if (!b) return V.notfound({ what: 'post' });
    const d = S.find('passport', b.destinationId), more = S.list('blogs').filter((x) => x.id !== b.id && x.category === b.category).slice(0, 3);
    const url = location.href.split('#')[0] + '#/blog/' + enc(b.id), text = b.title + ' — K_24 Karnataka Post Trails';
    return { title: b.title + ' — K_24 Karnataka Post Trails', desc: b.excerpt || 'Travel story from the Karnataka Philately Passport trail.', image: safeUrl(b.cover),
      html: `<article class="post"><header class="dest-cover short"><img class="art" src="${K.sceneUri(K.kindOf(b.category))}" alt="Illustrative artwork (not a photograph)">${safeUrl(b.cover) ? `<img class="real" src="${esc(safeUrl(b.cover))}" alt="${esc(b.title)}">` : ''}<div class="dest-title wrap"><a class="back" href="#/blogs">${ic('left')} All posts</a><div class="tags"><span class="tag">${esc(b.category)}</span>${demoTag(b.demo)}</div><h1>${esc(b.title)}</h1><p>${b.date ? esc(fmtDate(b.date)) : 'Coming soon'} · ${K.readingTime(b.body)} min read</p></div></header>
        <div class="wrap narrow"><div class="prose-body">${b.body.split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
          ${d ? `<p class="callout">Passport location: <a href="#/destination/${enc(d.id)}">${esc(K.dn(d))}</a> · ${esc(d.passportDistrict)}</p>` : ''}
          <div class="share" role="group" aria-label="Share this post"><span class="muted">Share</span>${navigator.share ? `<button class="btn btn-ghost btn-sm" data-share>${ic('share')} Share…</button>` : ''}<button class="btn btn-ghost btn-sm" data-copy>Copy link</button><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${enc(text + ' ' + url)}">WhatsApp</a><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}">X / Twitter</a></div>
          <div class="btn-row"><button class="btn btn-ghost" data-edit>${ic('edit')} Edit post</button><button class="btn btn-ghost danger" data-del>${ic('trash')} Delete</button></div></div>
        ${more.length ? `<section class="wrap block"><h2>Related posts</h2><div class="grid g3">${more.map(blogCard).join('')}</div></section>` : ''}</article>`,
      after(root) { root.addEventListener('click', async (e) => { const t = e.target.closest('button'); if (!t) return;
        if (t.hasAttribute('data-share')) { try { await navigator.share({ title: text, url }); } catch (x) {} }
        else if (t.hasAttribute('data-copy')) { try { await navigator.clipboard.writeText(url); K.toast('Link copied.'); } catch (x) { K.toast('Couldn’t copy — select the address bar instead.', 'error'); } }
        else if (t.hasAttribute('data-edit')) K.editBlog(b.id, () => K.render());
        else if (t.hasAttribute('data-del') && await K.confirm('Delete “' + b.title + '”? This can’t be undone.')) { S.remove('blogs', b.id); K.toast('Post deleted.'); location.hash = '#/blogs'; } }); } };
  };

  /* ================= COLLECTION ================= */
  const C = { type: 'cancellation' };
  K.editCollection = (id, done) => {
    const cur = id ? S.find('collection', id) : null;
    K.form({ title: cur ? 'Edit collection item' : 'Add to collection', values: cur || { type: C.type }, fields: [
      { name: 'type', label: 'Type', type: 'select', required: true, options: Object.keys(K.COLLECTION_TYPES).map((k) => ({ v: k, l: K.COLLECTION_TYPES[k] })) }, { name: 'date', label: 'Date collected', type: 'date' },
      { name: 'title', label: 'Title', required: true, full: true, max: 160 }, { name: 'location', label: 'Location / post office', full: true, max: 120 },
      { name: 'image', label: 'Photo link (your own photo)', type: 'url', full: true, max: 2000, help: 'Hosted image link. Without one, an illustrative postmark card is shown.' },
      { name: 'note', label: 'Note', type: 'textarea', rows: 3, full: true, max: 600 }, { name: 'demo', label: 'Mark as demo / illustrative', type: 'checkbox', full: true }],
      onSubmit(d) { d.id = cur ? cur.id : S.newId('collection', d.title); S.upsert('collection', d); C.type = d.type; K.toast('Collection updated.'); if (done) done(); } });
  };
  function renderColl(root) {
    $('#c-tabs', root).innerHTML = Object.keys(K.COLLECTION_TYPES).map((k) => `<button class="pill ${C.type === k ? 'on' : ''}" data-type="${k}" aria-pressed="${C.type === k}">${K.COLLECTION_TYPES[k]} <span>${S.list('collection').filter((c) => c.type === k).length}</span></button>`).join('');
    const items = S.list('collection').filter((c) => c.type === C.type), box = $('#c-list', root);
    box.innerHTML = items.length ? `<div class="grid g4">${items.map((c) => collCard(c, true)).join('')}</div>` : empty('Nothing here yet', 'Add a photo of a ' + K.COLLECTION_TYPES[C.type].toLowerCase().replace(/s$/, '') + ' you’ve collected.', '<button class="btn btn-primary" data-add>Add item</button>');
    K.anim.listIn(box);
  }
  V.collection = () => ({ title: 'My Stamp & Cancellation Collection — K_24 Karnataka Post Trails', desc: 'A visual archive of pictorial cancellations, stamps, special covers and postcards.',
    html: `<div class="wrap">${pageHead('My Stamp & Cancellation Collection', 'A visual archive of my philatelic journey.', `<div class="head-tools"><button class="btn btn-primary" data-add>${ic('plus')} Add item</button></div>`)}<div class="toolbar"><div id="c-tabs" class="pills" role="group" aria-label="Collection type"></div></div><div id="c-list" aria-live="polite"></div>
      <p class="note">Cards marked “Demo” or “No photo yet” show illustrative postmark artwork, not your real items.</p></div>`,
    after(root) { renderColl(root); root.addEventListener('click', async (e) => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.type) { C.type = b.dataset.type; renderColl(root); } else if (b.hasAttribute('data-add')) K.editCollection(null, () => renderColl(root));
      else if (b.dataset.editColl) K.editCollection(b.dataset.editColl, () => renderColl(root));
      else if (b.dataset.delColl && await K.confirm('Delete this collection item?')) { S.remove('collection', b.dataset.delColl); K.toast('Item deleted.'); renderColl(root); } }); } });

  /* ================= EXPENSES ================= */
  const X = { tab: 'list' };
  K.editExpense = (id, done) => {
    const cur = id ? S.find('expenses', id) : null;
    K.form({ title: cur ? 'Edit expense' : 'Add expense', values: cur || { date: new Date().toISOString().slice(0, 10), category: 'Transport' }, fields: [
      { name: 'date', label: 'Date', type: 'date', required: true }, { name: 'amount', label: 'Amount (₹)', type: 'number', required: true, min: 0, step: '0.01', inputmode: 'decimal' },
      { name: 'destination', label: 'Destination', type: 'select', options: S.list('passport').filter((l) => l.name).map((l) => l.name), help: 'Leave empty for general trip costs.' }, { name: 'category', label: 'Category', type: 'select', required: true, options: K.EXPENSE_CATEGORIES },
      { name: 'description', label: 'Description', required: true, full: true, max: 200 }, { name: 'notes', label: 'Notes', type: 'textarea', rows: 2, full: true, max: 500 }],
      onSubmit(d) { d.id = cur ? cur.id : S.uid(); d.demo = cur ? cur.demo : false; S.upsert('expenses', d); K.toast(cur ? 'Expense updated.' : 'Expense added.'); if (done) done(); } });
  };
  const groupSum = (list, key) => { const m = {}; list.forEach((e) => { const k = key(e); m[k] = (m[k] || 0) + e.amount; }); return m; };
  const bars = (m, labelFn, sortFn) => { const keys = Object.keys(m).sort(sortFn || ((a, b) => m[b] - m[a])), max = Math.max(1, ...Object.values(m)); return keys.length ? keys.map((k) => `<div class="hbar"><span>${esc(labelFn ? labelFn(k) : k)}</span><div class="bar"><i data-progress="${Math.round((m[k] / max) * 100)}"></i></div><b>${inr(m[k])}</b></div>`).join('') : '<p class="muted">Nothing to summarise yet.</p>'; };
  function renderExp(root) {
    const list = S.list('expenses').slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')), total = list.reduce((a, e) => a + e.amount, 0), hasDemo = list.some((e) => e.demo);
    $$('[data-xtab]', root).forEach((b) => { b.classList.toggle('on', b.dataset.xtab === X.tab); b.setAttribute('aria-pressed', b.dataset.xtab === X.tab); });
    const box = $('#x-body', root);
    if (!list.length) { box.innerHTML = empty('No expenses logged yet', 'Add what you spend on each trip to see totals, monthly summaries and budget estimates in the planner.', '<button class="btn btn-primary" data-add>Add expense</button> <button class="btn btn-ghost" data-sample>Load sample rows</button>'); return; }
    if (X.tab === 'list') {
      box.innerHTML = `<div class="table-wrap"><table class="tbl tbl-exp"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount (₹)</th><th>Notes</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${list.map((e) => `<tr><td data-label="Date">${esc(fmtDate(e.date)) || '—'}</td><td data-label="Description">${esc(e.description)} ${demoTag(e.demo)}${e.destination ? `<br><small class="muted">${esc(e.destination)}</small>` : ''}</td><td data-label="Category">${esc(e.category)}</td><td data-label="Amount" class="num">${inr(e.amount)}</td><td data-label="Notes">${esc(e.notes) || '—'}</td><td class="actions" data-label="Actions"><button class="btn btn-ghost btn-sm" data-edit="${esc(e.id)}" aria-label="Edit ${esc(e.description)}">${ic('edit')}</button><button class="btn btn-ghost btn-sm danger" data-del="${esc(e.id)}" aria-label="Delete ${esc(e.description)}">${ic('trash')}</button></td></tr>`).join('')}</tbody><tfoot><tr><th colspan="3">Total (${list.length} item${list.length === 1 ? '' : 's'})</th><th class="num">${inr(total)}</th><th colspan="2"></th></tr></tfoot></table></div>`;
    } else {
      const months = groupSum(list, (e) => (e.date || '').slice(0, 7) || 'none'), cats = groupSum(list, (e) => e.category), dests = groupSum(list.filter((e) => e.destination), (e) => e.destination);
      box.innerHTML = `<div class="stats three"><div class="stat"><strong data-count="${Math.round(total)}" data-format="inr">0</strong><span class="stat-l">Total spent</span></div><div class="stat"><strong data-count="${list.length}">0</strong><span class="stat-l">Items logged</span></div><div class="stat"><strong data-count="${Math.round(total / list.length)}" data-format="inr">0</strong><span class="stat-l">Average per item</span></div></div>
        <div class="grid g3 sum"><section class="card pad"><h2>By month</h2>${bars(months, monthLabel, (a, b) => b.localeCompare(a))}</section><section class="card pad"><h2>By category</h2>${bars(cats)}</section><section class="card pad"><h2>By destination</h2>${bars(dests)}</section></div>`;
    }
    if (hasDemo) box.insertAdjacentHTML('beforeend', '<p class="note">Rows marked “Demo” are sample data. <button class="linkish" data-clear-sample>Remove sample rows</button></p>');
    K.anim.run(box); K.anim.listIn(box);
  }
  V.expenses = () => ({ title: 'Trip Expense Tracker — K_24 Karnataka Post Trails', desc: 'Track travel expenses for Karnataka philately trips in INR.',
    html: `<div class="wrap">${pageHead('Trip Expense Tracker', 'Track your travel expenses and plan better.', `<div class="head-tools"><button class="btn btn-primary" data-add>${ic('plus')} Add expense</button><button class="btn btn-ghost" data-export>Export CSV</button></div>`)}
      <div class="toolbar"><div class="pills" role="group" aria-label="View"><button class="pill on" data-xtab="list" aria-pressed="true">Expenses</button><button class="pill" data-xtab="sum" aria-pressed="false">Summary</button></div></div><div id="x-body" aria-live="polite"></div></div>`,
    after(root) { renderExp(root); const re = () => renderExp(root);
      root.addEventListener('click', async (e) => { const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.xtab) { X.tab = b.dataset.xtab; re(); } else if (b.hasAttribute('data-add')) K.editExpense(null, re); else if (b.dataset.edit) K.editExpense(b.dataset.edit, re);
        else if (b.dataset.del) { if (await K.confirm('Delete this expense?')) { S.remove('expenses', b.dataset.del); K.toast('Expense deleted.'); re(); } }
        else if (b.hasAttribute('data-sample')) { const t = new Date().toISOString().slice(0, 10); [['Sample: bus ticket', 'Transport', 350], ['Sample: lunch', 'Food', 180], ['Sample: guest house', 'Stay', 900], ['Sample: stamps & postcards', 'Postage & stamps', 120]].forEach((r) => S.upsert('expenses', { id: S.uid(), date: t, destination: '', category: r[1], description: r[0], amount: r[2], notes: 'Sample row', demo: true })); re(); }
        else if (b.hasAttribute('data-clear-sample')) { S.list('expenses').filter((x) => x.demo).forEach((x) => S.remove('expenses', x.id)); re(); }
        else if (b.hasAttribute('data-export')) { const q = (v) => { let s = String(v == null ? '' : v); if (/^[=+@\-]/.test(s) && isNaN(Number(s))) s = "'" + s; return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
          K.download('k24-expenses.csv', ['date,destination,category,description,amount_inr,notes'].concat(S.list('expenses').map((x) => [x.date, x.destination, x.category, x.description, x.amount, x.notes].map(q).join(','))).join('\r\n'), 'text/csv'); } }); } });

  /* ================= STATIC PAGES ================= */
  V.about = () => {
    const soc = K.SITE.social, links = [['Instagram', soc.instagram], ['YouTube', soc.youtube]].filter((x) => safeUrl(x[1]));
    return { title: 'About — K_24 Karnataka Post Trails', desc: 'About the K_24 Karnataka Post Trails blog and its author.',
      html: `<div class="wrap narrow">${pageHead('About me')}<div class="about" data-reveal><img class="about-logo" src="assets/logo-full-640.png" alt="K_24 Karnataka Post Trails logo" width="240" height="240" loading="lazy"><div>${K.SITE.about.map((p) => `<p>${esc(p)}</p>`).join('')}<p><strong>${esc(K.SITE.owner)}</strong></p>${links.length ? `<p class="btn-row">${links.map((l) => `<a class="btn btn-ghost" target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(l[1]))}">${l[0]}</a>`).join('')}</p>` : ''}</div></div>
        <section class="card pad" data-reveal><h2>How this site works</h2><ul class="plain"><li>It’s a static website: no server, no account, no tracking.</li><li>Your passport progress, blog drafts, collection and expenses are stored in <em>this browser only</em>. Export a backup from the Passport page.</li><li>Illustrative artwork is original vector art, not photography. Photos appear only when you add links to your own.</li></ul></section></div>` };
  };
  V.contact = () => ({ title: 'Contact — K_24 Karnataka Post Trails', desc: 'Get in touch with K_24 Karnataka Post Trails.',
    html: `<div class="wrap narrow">${pageHead('Contact', 'Questions, tips or a post office I should visit? Write to me.')}${K.SITE.email ? '' : '<p class="warn">The contact e-mail isn’t configured yet. The site owner can add it in <code>js/data.js</code> (SITE.email). Until then this form can’t send anything.</p>'}
      <form class="card pad" id="ct-form" novalidate><div class="fields"><div class="field">${K.fieldHTML({ name: 'name', label: 'Your name', required: true, max: 80 }, '').replace(/^<div class="field ?">|<\/div>$/g, '')}</div><div class="field">${K.fieldHTML({ name: 'email', label: 'Your e-mail', type: 'email', required: true, max: 120 }, '').replace(/^<div class="field ?">|<\/div>$/g, '')}</div><div class="field full">${K.fieldHTML({ name: 'message', label: 'Message', type: 'textarea', rows: 6, required: true, max: 1500 }, '').replace(/^<div class="field ?">|<\/div>$/g, '')}</div></div>
      <p class="note">Pressing send opens your e-mail app with the message filled in — nothing is stored on this website.</p><button class="btn btn-primary" type="submit">Open e-mail draft</button></form></div>`,
    after(root) { const fields = [{ name: 'name', required: true }, { name: 'email', type: 'email', required: true }, { name: 'message', required: true }];
      $('#ct-form', root).addEventListener('submit', (e) => { e.preventDefault(); const r = K.readForm(e.target, fields); if (!r.ok) return; if (!K.SITE.email) { K.toast('Contact e-mail isn’t configured yet.', 'error'); return; }
        location.href = 'mailto:' + K.SITE.email + '?subject=' + enc('Message from ' + r.data.name + ' via K_24 Post Trails') + '&body=' + enc(r.data.message + '\n\n— ' + r.data.name + ' (' + r.data.email + ')'); }); } });
  V.privacy = () => ({ title: 'Privacy — K_24 Karnataka Post Trails', desc: 'How K_24 Karnataka Post Trails handles your data.',
    html: `<div class="wrap narrow prose-page">${pageHead('Privacy')}<section class="card pad"><h2>What stays on your device</h2><p>Everything you enter — passport progress, notes, blog posts, collection items and expenses — is saved in your browser’s local storage on this device. It is not uploaded, not synced between devices, and clears if you wipe your browser data. Use the backup export to keep a copy.</p><h2>Third-party requests</h2><p>To display the site, your browser loads code and assets from cdnjs.cloudflare.com (animation and map libraries), Google Fonts (typefaces) and OpenStreetMap tile servers (map images). Those providers can see your IP address and basic browser details as with any website.</p><h2>Cookies and analytics</h2><p>This site sets no cookies and includes no analytics or advertising scripts. Your theme and language choice are remembered in local storage.</p><h2>Contact</h2><p>The contact page opens your own e-mail app; messages are never processed by this site.</p></section></div>` });
  V.notfound = (o) => ({ title: 'Page not found — K_24 Karnataka Post Trails', desc: 'This page could not be found.', status: 404,
    html: `<div class="wrap nf"><img src="${K.postmarkUri('Lost in transit', '', 'Return to sender')}" alt="" width="220" height="220"><div><h1>${o && o.what ? 'That ' + esc(o.what) + ' isn’t in your list' : 'This letter went astray'}</h1><p class="lede">The address you followed doesn’t match a page here${o && o.what ? ' — it may have been deleted or renamed' : ''}.</p><p class="btn-row"><a class="btn btn-primary" href="#/">Back to home</a><a class="btn btn-ghost" href="#/passport">Open passport</a></p></div></div>` });
})();
(window.K24.mods = window.K24.mods || {})['views2'] = '2026.10.13b';
