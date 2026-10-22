/* Published content (data/content.json) + owner publishing through the GitHub API.
   Visitors only READ data/content.json. Only someone holding your private GitHub token can publish changes. */
(function () {
  const K = window.K24;
  K.content = { schema: 1, updated: '', places: {}, stories: [] };
  K.localPhotos = {};   // photos you just uploaded, shown immediately until GitHub Pages catches up
  K.loadFailed = false;

  const clean = (c) => {
    const out = { schema: 1, updated: String((c && c.updated) || ''), places: {}, stories: [] };
    const photo = (p) => (K.safeUrl(p) ? p : '');
    Object.keys((c && c.places) || {}).forEach((id) => { const p = c.places[id] || {}, ph = p.photos || {};
      out.places[id] = { visited: !!p.visited, visitDate: /^\d{4}-\d{2}-\d{2}$/.test(p.visitDate || '') ? p.visitDate : '', description: String(p.description || '').slice(0, 4000), photos: { stamp: photo(ph.stamp), location: photo(ph.location), office: photo(ph.office) } }; });
    ((c && c.stories) || []).forEach((s) => { if (s && s.id) out.stories.push({ id: String(s.id).replace(/[^\w-]/g, ''), title: String(s.title || 'Untitled').slice(0, 160), date: /^\d{4}-\d{2}-\d{2}$/.test(s.date || '') ? s.date : '', text: String(s.text || '').slice(0, 20000), placeId: String(s.placeId || ''), photos: (Array.isArray(s.photos) ? s.photos : []).map(photo).filter(Boolean).slice(0, 12) }); });
    return out;
  };
  K.load = async () => {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 7000);
    try { const r = await fetch('data/content.json?t=' + Date.now(), { signal: ctrl.signal, cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); K.content = clean(await r.json()); K.loadFailed = false; }
    catch (e) { K.loadFailed = true; K.loadError = e.name === 'AbortError' ? 'timed out' : e.message; }
    finally { clearTimeout(t); }
    return K.content;
  };
  K.place = (id) => K.content.places[id] || { visited: false, visitDate: '', description: '', photos: {} };
  K.img = (p) => K.localPhotos[p] || p;
  K.visitedCount = () => K.PLACES.filter((p) => K.place(p.id).visited).length;

  /* ---------------- photos ---------------- */
  K.resizePhoto = (file) => new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('Please choose an image file.'));
    const fr = new FileReader(); fr.onerror = () => rej(new Error('Could not read that photo.'));
    fr.onload = () => { const im = new Image(); im.onerror = () => rej(new Error('That image could not be opened.'));
      im.onload = () => { const max = 1600, s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.82)); };
      im.src = fr.result; };
    fr.readAsDataURL(file);
  });

  /* ---------------- owner connection ---------------- */
  const KEY = 'k24.owner';
  K.owner = { get() { try { const o = JSON.parse(localStorage.getItem(KEY)); return o && o.token ? o : null; } catch (e) { return null; } }, set(o) { localStorage.setItem(KEY, JSON.stringify(o)); }, clear() { try { localStorage.removeItem(KEY); } catch (e) {} } };
  K.isOwner = () => !!K.owner.get();
  const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
  const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));
  async function gh(cfg, path, opts) {
    const url = 'https://api.github.com/repos/' + cfg.repo + (path ? '/' + path : '');
    const r = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, (opts && opts.headers) || {}) }));
    if (!r.ok) { let m = ''; try { m = (await r.json()).message || ''; } catch (e) {} const err = new Error(r.status === 401 ? 'GitHub rejected the token (expired or wrong).' : r.status === 403 || r.status === 404 ? 'GitHub says this token cannot write to ' + cfg.repo + '. Check the token has “Contents: Read and write” for that repository.' : 'GitHub error ' + r.status + (m ? ': ' + m : '')); err.status = r.status; throw err; }
    return r.json();
  }
  K.connect = async (cfg) => {
    const repo = (cfg.repo || '').trim(), token = (cfg.token || '').trim(), branch = (cfg.branch || 'main').trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Repository should look like username/repository.'); if (token.length < 20) throw new Error('Paste the full token.');
    const info = await gh({ repo, token }, '', {}); if (info.permissions && !info.permissions.push) throw new Error('This token can read the repository but not write to it.');
    K.owner.set({ repo, token, branch }); return info;
  };
  K.publish = async (mutate, files, progress) => {
    const cfg = K.owner.get(); if (!cfg) throw new Error('Owner sign-in is needed to publish.');
    const say = progress || (() => {}); let n = 0; const total = files.length + 1;
    for (const f of files) {   // 1) upload new photos
      say('Uploading photo ' + (++n) + ' of ' + (total - 1) + '…');
      try { await gh(cfg, 'contents/' + f.path, { method: 'PUT', body: JSON.stringify({ message: 'Add photo ' + f.path, content: f.dataUrl.split(',')[1], branch: cfg.branch }) }); }
      catch (e) { if (e.status === 422) continue; throw e; }   // already there
      K.localPhotos[f.path] = f.dataUrl;
    }
    say('Saving…');
    for (let attempt = 0; attempt < 2; attempt++) {   // 2) update content.json against the latest version
      let cur = { schema: 1, places: {}, stories: [] }, sha;
      try { const g = await gh(cfg, 'contents/data/content.json?ref=' + encodeURIComponent(cfg.branch), {}); sha = g.sha; cur = JSON.parse(unb64(g.content)); } catch (e) { if (e.status !== 404 || sha) throw e; }
      const next = clean(cur); mutate(next); next.updated = new Date().toISOString();
      try { await gh(cfg, 'contents/data/content.json', { method: 'PUT', body: JSON.stringify({ message: 'Update content', content: b64(JSON.stringify(next, null, 1)), branch: cfg.branch, sha }) }); K.content = next; return next; }
      catch (e) { if (e.status !== 409 && e.status !== 422) throw e; }
    }
    throw new Error('Someone else changed the content at the same moment. Please try once more.');
  };
})();
(window.K24.mods = window.K24.mods || {}).content = '5.0';
