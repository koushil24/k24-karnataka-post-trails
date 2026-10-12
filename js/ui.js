/* Shared UI helpers: escaping, i18n, illustrative artwork, dialogs/forms, toasts, downloads. */
(function () {
  const K = window.K24;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => { u = String(u || '').trim(); return /^(https?:\/\/|assets\/|#\/|data:image\/(png|jpe?g|webp|gif);base64,)/i.test(u) ? u : ''; };
  const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
  const fmtDate = (d) => { if (!d) return ''; const x = new Date(d + 'T00:00:00'); return isNaN(x) ? '' : x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const km = (a, b) => { const R = 6371, r = (d) => (d * Math.PI) / 180; const dl = r(b.lat - a.lat), dg = r(b.lng - a.lng);
    const x = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  Object.assign(K, { $, $$, esc, safeUrl, inr, fmtDate, debounce, reduced, km });

  /* ---------- i18n (English / Kannada). Only key UI strings are translated; review Kannada with a native speaker. ---------- */
  const DICT = {
    en: { home: 'Home', passport: 'Passport', explore: 'Explore', blogs: 'Blogs', collection: 'Collection', expenses: 'Expenses', planner: 'Planner', about: 'About', contact: 'Contact', privacy: 'Privacy',
      search: 'Search', start: 'Start Exploring', tagline: 'Every Postmark Tells a Story.', mission: 'A journey across Karnataka to collect permanent pictorial cancellations, explore heritage and capture stories — one post office at a time.',
      progress: 'My Karnataka passport progress', latest: 'Latest from the trail', featured: 'Featured destinations', stamps: 'From the collection', next: 'Where will the next postmark take me?', viewAll: 'View all', viewMap: 'View map', lang: 'ಕನ್ನಡ', menu: 'Menu', theme: 'Toggle light or dark mode' },
    kn: { home: 'ಮುಖಪುಟ', passport: 'ಪಾಸ್‌ಪೋರ್ಟ್', explore: 'ಅನ್ವೇಷಿಸಿ', blogs: 'ಬ್ಲಾಗ್‌ಗಳು', collection: 'ಸಂಗ್ರಹ', expenses: 'ಖರ್ಚುಗಳು', planner: 'ಯೋಜಕ', about: 'ನನ್ನ ಬಗ್ಗೆ', contact: 'ಸಂಪರ್ಕ', privacy: 'ಗೌಪ್ಯತೆ',
      search: 'ಹುಡುಕಿ', start: 'ಅನ್ವೇಷಿಸಲು ಪ್ರಾರಂಭಿಸಿ', tagline: 'ಪ್ರತಿ ಅಂಚೆ ಮುದ್ರೆಯೂ ಒಂದು ಕಥೆ ಹೇಳುತ್ತದೆ.', mission: 'ಶಾಶ್ವತ ಚಿತ್ರ ಮುದ್ರೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಲು, ಪರಂಪರೆಯನ್ನು ಅನ್ವೇಷಿಸಲು ಮತ್ತು ಕಥೆಗಳನ್ನು ಸೆರೆಹಿಡಿಯಲು ಕರ್ನಾಟಕದಾದ್ಯಂತ ಒಂದು ಪ್ರಯಾಣ — ಒಂದೊಂದು ಅಂಚೆ ಕಚೇರಿ.',
      progress: 'ನನ್ನ ಕರ್ನಾಟಕ ಪಾಸ್‌ಪೋರ್ಟ್ ಪ್ರಗತಿ', latest: 'ಇತ್ತೀಚಿನ ಬರಹಗಳು', featured: 'ಆಯ್ದ ತಾಣಗಳು', stamps: 'ಸಂಗ್ರಹದಿಂದ', next: 'ಮುಂದಿನ ಅಂಚೆ ಮುದ್ರೆ ನನ್ನನ್ನು ಎಲ್ಲಿಗೆ ಕರೆದೊಯ್ಯುತ್ತದೆ?', viewAll: 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ', viewMap: 'ನಕ್ಷೆ ನೋಡಿ', lang: 'English', menu: 'ಮೆನು', theme: 'ಬೆಳಕು ಅಥವಾ ಗಾಢ ಮೋಡ್' }
  };
  K.lang = (function () { try { return localStorage.getItem('k24.lang') === 'kn' ? 'kn' : 'en'; } catch (e) { return 'en'; } })();
  K.t = (k) => (DICT[K.lang] && DICT[K.lang][k]) || DICT.en[k] || k;
  K.setLang = (l) => { K.lang = l; try { localStorage.setItem('k24.lang', l); } catch (e) {} K.applyLang(); };
  K.applyLang = () => {
    document.documentElement.lang = K.lang === 'kn' ? 'kn' : 'en-IN';
    $$('[data-i18n]').forEach((el) => { el.textContent = K.t(el.dataset.i18n); });
    $$('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', K.t(el.dataset.i18nLabel)); });
    $$('[data-i18n-ph]').forEach((el) => { el.setAttribute('placeholder', K.t(el.dataset.i18nPh)); });
  };

  /* ---------- Illustrative artwork (original vector scenes — NOT photographs) ---------- */
  const PAL = { heritage: ['#F7D58B', '#E08A4B', '#7A3F2B', '#103D2F'], temple: ['#F5C97A', '#D9743F', '#6B3326', '#103D2F'], nature: ['#CFE8DA', '#7DB596', '#2E7A5B', '#0F3A2C'],
    wildlife: ['#EBD9A6', '#B5A35B', '#6C7A3D', '#16352A'], coast: ['#BFE6EE', '#5FB0BF', '#2F7F8F', '#0F3A2C'], hill: ['#D8E8DF', '#9CC3AF', '#4F8F73', '#0F3A2C'] };
  const KIND = { 'Heritage': 'heritage', 'Temple': 'temple', 'Nature': 'nature', 'Wildlife': 'wildlife', 'Coast': 'coast', 'Hill Station': 'hill', 'Travel': 'heritage' };
  K.kindOf = (c) => KIND[c] || 'heritage';
  const gopura = (cx, by, s, f) => { let o = ''; for (let i = 0; i < 6; i++) { const w = (64 - i * 9) * s, h = 13 * s; o += `<rect x="${cx - w / 2}" y="${by - (i + 1) * h}" width="${w}" height="${h - 2 * s}" fill="${f}"/>`; } return o + `<rect x="${cx - 40 * s}" y="${by}" width="${80 * s}" height="${20 * s}" fill="${f}"/><circle cx="${cx}" cy="${by - 6 * 13 * s - 4 * s}" r="${3 * s}" fill="${f}"/>`; };
  function sceneSVG(kind, w = 400, h = 260) {
    const p = PAL[kind] || PAL.heritage; let m = '';
    m += `<path d="M0 ${h * .62}C${w * .2} ${h * .46} ${w * .35} ${h * .6} ${w * .55} ${h * .5}S${w * .85} ${h * .44} ${w} ${h * .58}V${h}H0Z" fill="${p[1]}" opacity=".55"/>`;
    m += `<path d="M0 ${h * .74}C${w * .25} ${h * .62} ${w * .45} ${h * .8} ${w * .7} ${h * .68}S${w * .92} ${h * .7} ${w} ${h * .72}V${h}H0Z" fill="${p[2]}" opacity=".8"/>`;
    if (kind === 'temple' || kind === 'heritage') m += gopura(w * .5, h * .66 - 20 * 1.1, 1.1, p[3]) + `<rect x="${w * .1}" y="${h * .72}" width="${w * .8}" height="${h * .05}" fill="${p[3]}" opacity=".8"/>`;
    else if (kind === 'nature') m += `<rect x="${w * .5}" y="${h * .36}" width="${w * .22}" height="${h * .1}" fill="${p[3]}"/><rect x="${w * .56}" y="${h * .4}" width="12" height="${h * .36}" fill="#fff" opacity=".85"/><rect x="${w * .62}" y="${h * .42}" width="8" height="${h * .34}" fill="#fff" opacity=".6"/>`;
    else if (kind === 'coast') m += [0, 1, 2].map((i) => `<path d="M0 ${h * (.7 + i * .07)}q${w * .1} -10 ${w * .2} 0t${w * .2} 0t${w * .2} 0t${w * .2} 0t${w * .2} 0" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none"/>`).join('') + `<path d="M${w * .78} ${h * .72}Q${w * .8} ${h * .5} ${w * .74} ${h * .34}" stroke="${p[3]}" stroke-width="5" fill="none"/>` + [-1, 0, 1].map((i) => `<path d="M${w * .74} ${h * .34}q${i * 30} -22 ${i * 48} 6" stroke="${p[3]}" stroke-width="5" fill="none"/>`).join('');
    else if (kind === 'wildlife') m += [.2, .55, .8].map((x, i) => `<rect x="${w * x}" y="${h * (.55 - i * .02)}" width="5" height="${h * .2}" fill="${p[3]}"/><ellipse cx="${w * x + 2}" cy="${h * (.55 - i * .02)}" rx="${34 - i * 4}" ry="10" fill="${p[3]}"/>`).join('');
    else m += `<path d="M${w * .1} ${h * .76}L${w * .3} ${h * .4}L${w * .48} ${h * .76}ZM${w * .4} ${h * .76}L${w * .62} ${h * .3}L${w * .86} ${h * .76}Z" fill="${p[3]}" opacity=".85"/>`;
    m += `<path d="M0 ${h * .88}C${w * .3} ${h * .8} ${w * .6} ${h * .94} ${w} ${h * .85}V${h}H0Z" fill="${p[3]}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="#fff6e2"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * .8}" cy="${h * .26}" r="${h * .1}" fill="#fff" opacity=".6"/>${m}</svg>`;
  }
  const dataUri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  K.sceneUri = (kind) => dataUri(sceneSVG(kind));
  /* Thumbnail: illustrative art underneath, real photo (if URL given) on top; a broken photo removes itself. */
  K.thumb = (category, imageUrl, alt) => {
    const u = safeUrl(imageUrl);
    return `<span class="thumb"><img class="art" src="${K.sceneUri(K.kindOf(category))}" alt="" loading="lazy" width="400" height="260">${u ? `<img class="real" src="${esc(u)}" alt="${esc(alt || '')}" loading="lazy" width="400" height="260">` : ''}</span>`;
  };
  document.addEventListener('error', (e) => { if (e.target && e.target.classList && e.target.classList.contains('real')) e.target.remove(); }, true);

  K.postmarkUri = (place, dateStr, label) => {
    const p = esc((place || 'Karnataka').toUpperCase().slice(0, 22)), d = esc(dateStr ? fmtDate(dateStr) : 'DD MMM YYYY'), l = esc((label || 'Post Trails').toUpperCase().slice(0, 22));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EFE3C7"/><g fill="none" stroke="#3a3a30" stroke-opacity=".8"><circle cx="150" cy="150" r="104" stroke-width="3"/><circle cx="150" cy="150" r="64" stroke-width="1.6"/></g><defs><path id="a" d="M150 150m-84 0a84 84 0 1 1 168 0a84 84 0 1 1 -168 0"/></defs><text font-family="Georgia,serif" font-size="17" letter-spacing="3" fill="#3a3a30" fill-opacity=".85"><textPath href="#a" startOffset="2%">${p} • ${l} •</textPath></text><g fill="#3a3a30" fill-opacity=".8" font-family="Georgia,serif" text-anchor="middle"><path d="M150 112l8 12h-16zM144 124h12v20h-12z" opacity=".8"/><text x="150" y="168" font-size="13">${d}</text></g><g stroke="#3a3a30" stroke-opacity=".6" stroke-width="2" fill="none"><path d="M250 110q20 -8 36 0t36 0M250 124q20 -8 36 0t36 0"/></g><rect x="214" y="32" width="56" height="64" fill="#C83742" fill-opacity=".85" stroke="#EFE3C7" stroke-width="4" stroke-dasharray="3 4"/></svg>`;
    return dataUri(svg);
  };

  /* ---------- Toasts ---------- */
  K.toast = (msg, type) => {
    let box = $('#toasts'); if (!box) return;
    const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, type === 'error' ? 6000 : 3200);
  };

  /* ---------- Dialogs & forms ---------- */
  function dlg(html, cls) {
    const d = document.createElement('dialog'); d.className = 'dlg ' + (cls || ''); d.innerHTML = html; document.body.appendChild(d);
    d.addEventListener('close', () => d.remove());
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => d.close()));
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    return d;
  }
  K.dialog = dlg;
  K.confirm = (message, okLabel) => new Promise((resolve) => {
    let result = false;
    const d = dlg(`<div class="dlg-form"><header><h2>Please confirm</h2></header><p>${esc(message)}</p><footer><button class="btn btn-ghost" data-close type="button">Cancel</button><button class="btn btn-danger" data-ok type="button">${esc(okLabel || 'Delete')}</button></footer></div>`, 'dlg-sm');
    $('[data-ok]', d).addEventListener('click', () => { result = true; d.close(); });
    d.addEventListener('close', () => resolve(result));
    $('[data-close]', d).focus();
  });
  function fieldHTML(f, v) {
    const id = 'f-' + f.name, req = f.required ? ' required aria-required="true"' : '', val = v == null ? '' : v;
    const base = `id="${id}" name="${esc(f.name)}"${req} aria-describedby="e-${id}${f.help ? ' h-' + id : ''}"`;
    let input;
    if (f.type === 'textarea') input = `<textarea ${base} rows="${f.rows || 4}" maxlength="${f.max || 4000}" placeholder="${esc(f.placeholder || '')}">${esc(val)}</textarea>`;
    else if (f.type === 'select') input = `<select ${base}>${f.required ? '' : '<option value="">—</option>'}${f.options.map((o) => { const ov = typeof o === 'string' ? o : o.v, ol = typeof o === 'string' ? o : o.l; return `<option value="${esc(ov)}"${String(ov) === String(val) ? ' selected' : ''}>${esc(ol)}</option>`; }).join('')}</select>`;
    else if (f.type === 'checkbox') return `<div class="field field-check ${f.full ? 'full' : ''}"><label><input type="checkbox" id="${id}" name="${esc(f.name)}"${v ? ' checked' : ''}> <span>${esc(f.label)}</span></label>${f.help ? `<small id="h-${id}" class="muted">${esc(f.help)}</small>` : ''}</div>`;
    else input = `<input ${base} type="${f.type || 'text'}" value="${esc(val)}" maxlength="${f.max || 300}"${f.min != null ? ` min="${f.min}"` : ''}${f.max && f.type === 'number' ? '' : ''}${f.step ? ` step="${f.step}"` : ''} placeholder="${esc(f.placeholder || '')}"${f.inputmode ? ` inputmode="${f.inputmode}"` : ''}>`;
    return `<div class="field ${f.full ? 'full' : ''}"><label for="${id}">${esc(f.label)}${f.required ? ' <span aria-hidden="true">*</span>' : ''}</label>${input}${f.help ? `<small id="h-${id}" class="muted">${esc(f.help)}</small>` : ''}<span class="err" id="e-${id}" role="alert"></span></div>`;
  }
  function readForm(form, fields) {
    const data = {}; let ok = true, first = null;
    fields.forEach((f) => {
      const el = form.elements[f.name]; const err = $('#e-f-' + f.name, form); let v = f.type === 'checkbox' ? el.checked : el.value.trim(), msg = '';
      if (f.type !== 'checkbox') {
        if (f.required && !v) msg = 'This field is required.';
        else if (v && f.type === 'number') { const n = Number(v); if (!isFinite(n)) msg = 'Enter a number.'; else if (f.min != null && n < f.min) msg = 'Must be at least ' + f.min + '.'; else { v = n; if (f.validate) msg = f.validate(v) || ''; } }
        else if (v && f.type === 'url' && !safeUrl(v)) msg = 'Use a link starting with https://';
        else if (v && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'Enter a valid e-mail address.';
        else if (v && f.validate) msg = f.validate(v) || '';
      }
      if (err) err.textContent = msg; el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) { ok = false; first = first || el; }
      data[f.name] = v;
    });
    if (first) first.focus();
    return { ok, data };
  }
  K.fieldHTML = fieldHTML; K.readForm = readForm;
  K.form = ({ title, fields, values = {}, submitLabel = 'Save changes', onSubmit, intro }) => {
    const d = dlg(`<form class="dlg-form" novalidate><header><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="Close">✕</button></header>${intro ? `<p class="muted">${esc(intro)}</p>` : ''}<div class="fields">${fields.map((f) => fieldHTML(f, values[f.name])).join('')}</div><footer><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" type="submit">${esc(submitLabel)}</button></footer></form>`);
    $('form', d).addEventListener('submit', (e) => { e.preventDefault(); const r = readForm(e.target, fields); if (!r.ok) return; if (onSubmit(r.data) !== false) d.close(); });
    const first = $('input:not([type=checkbox]),textarea,select', d); if (first) first.focus();
    return d;
  };

  /* ---------- Files ---------- */
  K.download = (name, text, mime) => { const b = new Blob([text], { type: mime || 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  K.pickFile = (accept) => new Promise((resolve) => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.style.display = 'none'; document.body.appendChild(i);
    i.addEventListener('change', () => { const f = i.files[0]; i.remove(); if (!f) return resolve(null); if (f.size > 5 * 1024 * 1024) { K.toast('That file is larger than 5 MB.', 'error'); return resolve(null); }
      const r = new FileReader(); r.onload = () => resolve({ name: f.name, text: String(r.result) }); r.onerror = () => { K.toast('Could not read that file.', 'error'); resolve(null); }; r.readAsText(f); });
    i.addEventListener('cancel', () => { i.remove(); resolve(null); });
    i.click();
  });
  K.readingTime = (text) => Math.max(1, Math.round(String(text || '').split(/\s+/).filter(Boolean).length / 200));
})();
