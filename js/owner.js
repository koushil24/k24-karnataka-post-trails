/* Owner tools: sign in with your private GitHub token, then edit visits and stories. Visitors never see any of this. */
(function () {
  const K = window.K24, { $, $$, esc, safeUrl } = K, t = (k) => K.t(k);
  const enc = encodeURIComponent, tsid = () => Date.now().toString(36);
  const DEFAULT_REPO = 'koushil24/k24-karnataka-post-trails';

  K.ownerDialog = () => {
    const cur = K.owner.get();
    if (cur) {
      const d = K.dialog(`<div class="dlg-in"><h2>${esc(t('ownerMode'))}</h2><p>Connected to <strong>${esc(cur.repo)}</strong> (${esc(cur.branch)}). Your edits are published to this repository.</p><div class="dlg-foot"><button class="btn ghost" data-close type="button">${esc(t('cancel'))}</button><button class="btn danger" data-out type="button">${esc(t('signOut'))}</button></div></div>`, 'sm');
      $('[data-out]', d).addEventListener('click', () => { K.owner.clear(); d.close(); K.toast('Signed out.'); K.render(); }); return;
    }
    const d = K.dialog(`<form class="dlg-in" novalidate><h2>${esc(t('owner'))}</h2>
      <p class="small">Only you can edit. This needs a private GitHub “fine-grained token” limited to this one repository (permission: <em>Contents → Read and write</em>). It is stored only in this browser on this device. <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Create a token</a> — steps are in the README.</p>
      <div class="field"><label for="o-repo">Repository</label><input id="o-repo" value="${esc(DEFAULT_REPO)}" autocomplete="off"></div>
      <div class="field"><label for="o-br">Branch</label><input id="o-br" value="main" autocomplete="off"></div>
      <div class="field"><label for="o-tok">Token</label><input id="o-tok" type="password" autocomplete="off" placeholder="github_pat_…"></div>
      <p class="err" id="o-err" role="alert"></p><div class="dlg-foot"><button class="btn ghost" data-close type="button">${esc(t('cancel'))}</button><button class="btn gold" type="submit">Connect</button></div></form>`, 'sm');
    $('form', d).addEventListener('submit', async (e) => { e.preventDefault(); const err = $('#o-err', d), b = $('button[type=submit]', d); err.textContent = ''; b.disabled = true; b.textContent = 'Checking…';
      try { await K.connect({ repo: $('#o-repo', d).value, branch: $('#o-br', d).value, token: $('#o-tok', d).value }); d.close(); K.toast('Connected. You can now edit.'); K.render(); }
      catch (x) { err.textContent = x.message || 'Could not connect.'; b.disabled = false; b.textContent = 'Connect'; } });
  };

  /* ---- a photo slot: existing photo, new photo (resized in the browser), or removed ---- */
  const slotHTML = (id, label) => `<div class="slot" id="slot-${id}"><div class="sp" aria-hidden="true"></div><div class="sb"><strong>${esc(label)}</strong><label class="btn ghost sm">Choose photo<input type="file" accept="image/*" hidden></label><button type="button" class="btn ghost sm" data-rm>Remove</button><small class="muted" data-msg></small></div></div>`;
  function bindSlot(d, id, existing, onChange) {
    const st = { existing: existing || '', data: null, removed: false }, el = $('#slot-' + id, d), sp = $('.sp', el), msg = $('[data-msg]', el);
    const show = () => { const src = st.data || (!st.removed && st.existing ? K.img(st.existing) : ''); sp.innerHTML = src && safeUrl(src) ? `<img src="${esc(src)}" alt="">` : '<span>＋</span>'; };
    $('input[type=file]', el).addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; msg.textContent = 'Preparing…'; try { st.data = await K.resizePhoto(f); st.removed = false; msg.textContent = ''; show(); if (onChange) onChange(); } catch (x) { msg.textContent = x.message; } });
    $('[data-rm]', el).addEventListener('click', () => { st.data = null; st.removed = true; show(); if (onChange) onChange(); });
    show(); return st;
  }
  const busy = (d, on, text) => { $$('button,input,select,textarea', d).forEach((x) => { if (!x.hasAttribute('data-close')) x.disabled = on; }); const m = $('[data-status]', d); if (m) m.textContent = text || ''; };

  K.editPlace = (id) => {
    const p = K.PLACES.find((x) => x.id === id), c = K.place(id); if (!p || !K.isOwner()) return;
    const d = K.dialog(`<form class="dlg-in" novalidate><h2>#${p.serial} ${esc(K.dn(p))}</h2>
      <div class="field check"><label><input type="checkbox" id="e-v" ${c.visited ? 'checked' : ''}> <span>${esc(t('visited'))}</span></label></div>
      <div class="field"><label for="e-d">${esc(t('visitDate'))}</label><input id="e-d" type="date" value="${esc(c.visitDate)}"></div>
      <div class="field"><label for="e-t">${esc(t('description'))}</label><textarea id="e-t" rows="6" maxlength="4000">${esc(c.description)}</textarea></div>
      ${slotHTML('stamp', t('stampPhoto'))}${slotHTML('location', t('locationPhoto'))}${slotHTML('office', t('officePhoto'))}
      <p class="err" id="e-err" role="alert"></p><p class="small muted" data-status role="status"></p>
      <div class="dlg-foot"><button class="btn ghost" data-close type="button">${esc(t('cancel'))}</button><button class="btn gold" type="submit">${esc(t('save'))}</button></div></form>`);
    const slots = { stamp: bindSlot(d, 'stamp', c.photos.stamp), location: bindSlot(d, 'location', c.photos.location), office: bindSlot(d, 'office', c.photos.office) };
    $('#e-t', d).addEventListener('input', () => { if ($('#e-t', d).value && !$('#e-v', d).checked) $('#e-v', d).checked = true; });
    $('form', d).addEventListener('submit', async (e) => {
      e.preventDefault(); const files = [], photos = {}, ts = tsid(), err = $('#e-err', d); err.textContent = '';
      ['stamp', 'location', 'office'].forEach((k) => { const s = slots[k]; if (s.data) { const path = 'photos/' + p.id + '-' + k + '-' + ts + '.jpg'; files.push({ path, dataUrl: s.data }); photos[k] = path; } else photos[k] = s.removed ? '' : s.existing; });
      const rec = { visited: $('#e-v', d).checked, visitDate: $('#e-d', d).value, description: $('#e-t', d).value.trim(), photos };
      busy(d, true, 'Publishing…');
      try { await K.publish((cc) => { cc.places[p.id] = rec; }, files, (m) => { $('[data-status]', d).textContent = m; }); d.close(); K.toast('Published. Visitors will see it in about a minute.'); K.render(); }
      catch (x) { busy(d, false, ''); err.textContent = x.message || 'Could not publish.'; }
    });
  };

  K.editStory = (id) => {
    if (!K.isOwner()) return; const s = id ? K.content.stories.find((x) => x.id === id) : null, cur = s || { title: '', date: new Date().toISOString().slice(0, 10), text: '', placeId: '', photos: [] };
    const d = K.dialog(`<form class="dlg-in" novalidate><h2>${esc(s ? t('edit') : t('newStory'))}</h2>
      <div class="field"><label for="s-t">${esc(t('title'))}</label><input id="s-t" maxlength="160" value="${esc(cur.title)}" required></div>
      <div class="field"><label for="s-d">${esc(t('date'))}</label><input id="s-d" type="date" value="${esc(cur.date)}"></div>
      <div class="field"><label for="s-p">${esc(t('relatedOffice'))}</label><select id="s-p"><option value="">—</option>${K.PLACES.map((p) => `<option value="${esc(p.id)}" ${cur.placeId === p.id ? 'selected' : ''}>#${p.serial} ${esc(K.dn(p))}</option>`).join('')}</select></div>
      <div class="field"><label for="s-x">${esc(t('text'))}</label><textarea id="s-x" rows="9" maxlength="20000">${esc(cur.text)}</textarea></div>
      <div id="s-ph"></div><button type="button" class="btn ghost sm" id="s-add">＋ Add photo</button>
      <p class="err" id="s-err" role="alert"></p><p class="small muted" data-status role="status"></p>
      <div class="dlg-foot"><button class="btn ghost" data-close type="button">${esc(t('cancel'))}</button><button class="btn gold" type="submit">${esc(t('save'))}</button></div></form>`);
    const list = []; let n = 0;
    const add = (existing) => { if (list.length >= 8) { K.toast('Up to 8 photos per story.', 'error'); return; } const id2 = 'p' + (n++); const holder = document.createElement('div'); holder.innerHTML = slotHTML(id2, 'Photo ' + (list.length + 1)); $('#s-ph', d).appendChild(holder.firstChild); const st = bindSlot(d, id2, existing); list.push(st); };
    (cur.photos || []).forEach((p) => add(p)); $('#s-add', d).addEventListener('click', () => add(''));
    $('form', d).addEventListener('submit', async (e) => {
      e.preventDefault(); const err = $('#s-err', d); err.textContent = ''; const title = $('#s-t', d).value.trim(); if (!title) { err.textContent = 'Please add a title.'; return; }
      const sid = s ? s.id : (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'story') + '-' + tsid(), ts = tsid(), files = [], photos = [];
      list.forEach((st, i) => { if (st.data) { const path = 'photos/story-' + sid + '-' + i + '-' + ts + '.jpg'; files.push({ path, dataUrl: st.data }); photos.push(path); } else if (!st.removed && st.existing) photos.push(st.existing); });
      const rec = { id: sid, title, date: $('#s-d', d).value, text: $('#s-x', d).value.trim(), placeId: $('#s-p', d).value, photos };
      busy(d, true, 'Publishing…');
      try { await K.publish((cc) => { const i = cc.stories.findIndex((x) => x.id === sid); if (i >= 0) cc.stories[i] = rec; else cc.stories.push(rec); }, files, (m) => { $('[data-status]', d).textContent = m; }); d.close(); K.toast('Published. Visitors will see it in about a minute.'); location.hash = '#/journey/' + enc(sid); K.render(); }
      catch (x) { busy(d, false, ''); err.textContent = x.message || 'Could not publish.'; }
    });
  };
  K.deleteStory = async (id) => {
    if (!(await K.confirm('Delete this story? Visitors will no longer see it.', t('del')))) return;
    try { await K.publish((cc) => { cc.stories = cc.stories.filter((x) => x.id !== id); }, []); K.toast('Deleted.'); location.hash = '#/journey'; K.render(); } catch (x) { K.toast(x.message || 'Could not delete.', 'error'); }
  };
})();
(window.K24.mods = window.K24.mods || {}).owner = '5.0';
