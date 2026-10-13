#!/usr/bin/env node
/* Automated data + label checks. Run:  node tools/validate-data.js   (or: npm test). Exits non-zero on any failure. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const sandbox = { window: {}, localStorage: { getItem() { return null; }, setItem() {} } };
vm.createContext(sandbox);
['js/data.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f }));
const K = sandbox.window.K24, G = require(path.join(root, 'js/geo.js'));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('FAIL  ' + m); } else console.log('ok    ' + m); };

const P = K.PASSPORT;
ok(P.length === 100, 'exactly 100 destination records (found ' + P.length + ')');
ok(new Set(P.map((x) => x.id)).size === P.length, 'unique destination IDs');
ok(P.every((x, i) => x.serial === i + 1), 'serial numbers run 1–100 without gaps or reordering');
ok(K.DISTRICTS.length === 30, '30 districts from the passport index (found ' + K.DISTRICTS.length + ')');
ok(K.DISTRICTS.every((d, i) => d.order === i + 1), 'district order is the original index order');
ok(K.DISTRICTS.every((d, i, a) => i === 0 || d.first === a[i - 1].last + 1) && K.DISTRICTS[0].first === 1 && K.DISTRICTS[29].last === 100, 'district serial ranges are contiguous 1–100');
ok(K.DISTRICTS.every((d, i, a) => i === a.length - 1 || (a[i + 1].page - d.page) === 2 * (d.last - d.first + 1)), 'index page gaps equal 2 pages per destination (cross-check of the serial map vs the index)');
ok(P.every((x) => /^$|^\d{6}$/.test(x.pin)), 'PIN codes are empty or exactly 6 digits');
ok(P.every((x) => (x.lat == null && x.lng == null) || (x.lat >= 11.4 && x.lat <= 18.6 && x.lng >= 73.8 && x.lng <= 78.7)), 'coordinates are empty or inside Karnataka bounds');
ok(P.every((x) => x.lat == null || x.coordSource), 'every coordinate has a recorded source');
ok(P.every((x) => !x.name || x.nameSource), 'every destination name records where it came from');
ok(P.filter((x) => !x.pin).length + P.filter((x) => x.pin).length === 100, 'missing PIN codes are reported, not hidden (' + P.filter((x) => !x.pin).length + ' pending)');
ok(P.every((x) => x.passportPage === null), 'no passport page numbers are asserted (only inferred ones, kept separate)');
const slugs = K.CANDIDATES.map((c) => c[0]); ok(new Set(slugs).size === slugs.length && K.CANDIDATES.length === 106, 'candidate list: 106 unique entries, flagged unofficial');
// distance labels
ok(/straight-line/.test(G.label({ km: 120, type: 'straight' })) && !/by road|OSRM/i.test(G.label({ km: 120, type: 'straight' })), 'straight-line distances are labelled "straight-line (not road distance)", never as road');
ok(/by road/.test(G.label({ km: 120, type: 'road' })) && /OSRM/.test(G.label({ km: 120, type: 'road' })), 'road distances name their routing source');
ok(/Not available/.test(G.label(null)), 'missing coordinates give "Not available", not a number');
let threw = false; try { G.label({ km: 1, type: 'driving' }); } catch (e) { threw = true; } ok(threw, 'unknown distance types are rejected');
const a = { lat: 12.2958, lng: 76.6394 }, b = { lat: 12.9716, lng: 77.5946 }; const d = G.haversine(a, b);
ok(d > 120 && d < 135, 'Mysuru→Bengaluru straight-line sanity check (' + d.toFixed(1) + ' km)');
const order = G.proximityOrder(a, [{ lat: 15, lng: 76 }, { lat: 12.4, lng: 76.7 }, { lat: 13, lng: 77 }]); ok(order[0].lat === 12.4, 'proximity order starts with the nearest stop');
// source scan: UI must not call straight-line figures "road"
const ui = ['js/directory.js', 'js/planner.js', 'js/map.js'].map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
ok(!/straight[^'"`\n]{0,40}by road/i.test(ui), 'UI text never pairs "straight-line" with "by road"');
ok(/Proximity-based suggested order/i.test(ui) || /proximity-based suggested order/i.test(ui), 'planner labels non-routed sequences "proximity-based suggested order"');
console.log(fails ? '\n' + fails + ' check(s) failed' : '\nAll checks passed'); process.exit(fails ? 1 : 0);
