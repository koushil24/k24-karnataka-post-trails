#!/usr/bin/env node
/* Checks the 100 passport records and the site files. Run: node tools/validate-data.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), root = path.join(__dirname, '..');
const sb = {}; sb.window = sb; vm.createContext(sb); vm.runInContext(fs.readFileSync(path.join(root, 'js/places.js'), 'utf8'), sb);
const K = sb.K24, SRC = JSON.parse(fs.readFileSync(path.join(root, 'data/passport-source.json'), 'utf8')), P = K.PLACES, D = K.DISTRICTS;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('FAIL  ' + m); } else console.log('ok    ' + m); };
ok(P.length === 100 && SRC.length === 100, '100 records in the app and in the passport source (' + P.length + '/' + SRC.length + ')');
ok(new Set(P.map((x) => x.id)).size === 100, 'no duplicate IDs');
ok(P.every((x, i) => x.serial === i + 1), 'serial numbers 1–100 in order, none missing');
ok(new Set(P.map((x) => x.name + '|' + x.pin + '|' + x.code)).size === 100, 'no duplicate post offices');
ok(P.every((x, i) => ['name', 'pin', 'theme', 'doi'].every((f) => String(x[f]) === String(SRC[i][f === 'doi' ? 'doi' : f])) || (x.name === SRC[i].name && x.pin === SRC[i].pin && x.doi === SRC[i].doi && x.theme === SRC[i].theme)), 'app records match the passport source file field by field');
ok(P.every((x, i) => x.doiP === SRC[i].doiPrinted && x.code === SRC[i].officeCode), 'DOI text and office code are kept exactly as printed');
ok(D.length === 30 && D.every((d, i) => d.order === i + 1), '30 districts in the passport index order');
ok(D.every((d, i) => i === D.length - 1 || D[i + 1].page - d.page === 2 * (d.last - d.first + 1)), 'index pages = 2 pages × records in every district');
ok(P.every((x) => x.serial >= D[x.d - 1].first && x.serial <= D[x.d - 1].last), 'every record lies in its district’s serial range');
ok(P.every((x) => /^\d{6}$/.test(x.pin)), 'every PIN has exactly six digits');
ok(P.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.doi) && !isNaN(Date.parse(x.doi))), 'every DOI is a real date');
ok(P.every((x) => x.page === D[x.d - 1].page + 2 * (x.serial - D[x.d - 1].first)), 'passport page numbers follow the index');
ok(P.every((x) => ['HO', 'SO', 'BO', 'GPO', 'MDG', ''].includes(x.code)), 'office codes are as printed (2 have none, 1 is MDG)');
ok(P.every((x) => x.lat === undefined), 'no coordinates are invented in the data file');
const sh = {}; P.forEach((x) => { (sh[x.pin] = sh[x.pin] || []).push(x.serial); }); console.log('info  shared PINs: ' + Object.entries(sh).filter(([, v]) => v.length > 1).map(([p, v]) => p + ' → #' + v.join(',#')).join(' | '));
ok(P.filter((x) => x.pinStamp).length === 1 && P.find((x) => x.pinStamp).serial === 9, 'the single PIN conflict (#9) is flagged');
// ---- site files: every file referenced exists with the exact same capitalisation ----
const files = []; (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walk(p); } else files.push(path.relative(root, p).replace(/\\/g, '/')); }); })(root);
const set = new Set(files), refs = new Set(); ['index.html', 'js/views.js', 'js/app.js', 'js/owner.js', 'js/content.js', 'css/styles.css', '404.html'].forEach((f) => { if (!fs.existsSync(path.join(root, f))) return; (fs.readFileSync(path.join(root, f), 'utf8').match(/(?:src|href)="(?!https?:|#|data:|mailto:)([^"?#]+)/g) || []).forEach((m) => { const r = m.replace(/^(?:src|href)="/, ''); if (/\.(js|css|png|jpg|svg|json|html|txt|xml)$/.test(r) && !r.includes('${')) refs.add(r); }); });
const missing = [...refs].filter((r) => !set.has(r)); ok(!missing.length, 'every file referenced by the pages exists with exact capitalisation' + (missing.length ? ' — missing: ' + missing.join(', ') : ' (' + refs.size + ' checked)'));
if (fs.existsSync(path.join(root, 'data/content.json'))) { let j; try { j = JSON.parse(fs.readFileSync(path.join(root, 'data/content.json'), 'utf8')); } catch (e) { j = null; } ok(!!j && j.places && Array.isArray(j.stories), 'data/content.json is valid'); }
ok(fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/\?v=([\d.]+)/g).every((v, _, a) => v === a[0]), 'all script/style links carry the same version stamp');
const mods = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/__k24Need=\[(.*?)\]/)[1].replace(/'/g, '').split(','); ok(mods.every((m) => files.some((f) => f === 'js/' + m + '.js')), 'every module the page waits for exists');
console.log(fails ? '\n' + fails + ' check(s) failed' : '\nAll checks passed'); process.exit(fails ? 1 : 0);
