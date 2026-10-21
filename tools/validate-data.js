#!/usr/bin/env node
/* Data + label checks for the 100 passport post offices. Run: node tools/validate-data.js  (or: npm test). Exits non-zero on any failure. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const sandbox = { window: {}, URL, localStorage: { getItem() { return null; }, setItem() {} } }; vm.createContext(sandbox);
['js/post-offices.js', 'js/data.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f }));
const K = sandbox.window.K24, G = require(path.join(root, 'js/geo.js')), J = JSON.parse(fs.readFileSync(path.join(root, 'data/post-offices.json'), 'utf8'));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('FAIL  ' + m); } else console.log('ok    ' + m); };
const P = K.PASSPORT;
ok(J.length === 100 && P.length === 100, 'exactly 100 records in data/post-offices.json and in the app (' + J.length + ' / ' + P.length + ')');
ok(JSON.stringify(K.POST_OFFICES) === JSON.stringify(J), 'js/post-offices.js matches data/post-offices.json (run node tools/build-js.js if not)');
ok(new Set(P.map((x) => x.id)).size === 100, 'no duplicate IDs');
ok(P.every((x, i) => x.serial === i + 1), 'serial numbers run 1–100 in order, none missing');
ok(new Set(P.map((x) => x.name + '|' + x.pin + '|' + x.officeCode)).size === 100, 'no duplicate post offices (name + PIN + type)');
ok(K.DISTRICTS.length === 30 && K.DISTRICTS.every((d, i) => d.order === i + 1), '30 districts in the passport index order');
ok(K.DISTRICTS.every((d, i, a) => i === a.length - 1 || (a[i + 1].page - d.page) === 2 * (d.last - d.first + 1)), 'index pages equal 2 pages × records for every district');
ok(P.every((x) => x.serial >= K.DISTRICTS[x.districtOrder - 1].first && x.serial <= K.DISTRICTS[x.districtOrder - 1].last && x.passportDistrict === K.DISTRICTS[x.districtOrder - 1].name), 'every record sits in the district range from the passport index');
ok(J.every((x) => !x.districtPrinted || x.passportDistrict.toLowerCase().startsWith(x.districtPrinted.toLowerCase().slice(0, 6))), 'district printed on each passport page agrees with the index (checked on all 100)');
ok(P.every((x) => /^\d{6}$/.test(x.pin)), 'every PIN is exactly six digits');
ok(P.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.doi) && !isNaN(Date.parse(x.doi)) && x.doi <= '2026-12-31'), 'every DOI is a real calendar date');
ok(P.every((x) => ['HO', 'SO', 'BO', 'GPO', 'MDG', ''].includes(x.officeCode)), 'classification codes are consistent (HO/SO/BO/GPO, plus the 2 printed oddities flagged)');
ok(P.every((x) => x.theme && x.name), 'no record is missing a name or theme');
ok(P.every((x) => x.passportPage === K.DISTRICTS[x.districtOrder - 1].page + 2 * (x.serial - K.DISTRICTS[x.districtOrder - 1].first)), 'passport page numbers follow the index (verified on PDF pages 1, 57, 63)');
ok(P.every((x) => x.lat == null && x.lng == null), 'no coordinates are invented (all start empty; added only by you)');
ok(P.every((x) => x.taluk === '' && x.parentOffice === '' && x.division === '' && x.region === '' && x.address === ''), 'taluk, parent office, division, region, address are empty = "Not verified" (not in the PDF)');
ok(P.every((x) => x.verifiedFields.length === 0 && !x.source && !x.verifiedDate), 'nothing is pre-marked as verified');
ok(P.filter((x) => x.visited).length === 0 && P.every((x) => !x.planned && !x.cancellationCollected), 'seed data starts all "Not visited" (serial 63 is applied by the store)');
const shared = {}; P.forEach((x) => { (shared[x.pin] = shared[x.pin] || []).push(x.serial); });
const dup = Object.entries(shared).filter(([, v]) => v.length > 1); console.log('info  PINs shared by several offices: ' + dup.map(([p, v]) => p + ' → #' + v.join(',#')).join(' | '));
ok(P.filter((x) => x.pdf.pinOnStamp).length === 1 && P.find((x) => x.pdf.pinOnStamp).serial === 9, 'the one PIN conflict inside the passport (#9) is flagged');
// store logic with a fake localStorage
const store = {}; sandbox.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } };
vm.runInContext(fs.readFileSync(path.join(root, 'js/store.js'), 'utf8'), sandbox); const S = sandbox.window.K24.store; S.load();
const r63 = S.find('passport', 'd063'); ok(r63.visited && r63.cancellationCollected && r63.visitDate === '2023-08-30', 'serial 63 (Mysuru HO, pp.125–126) is visited with PPC collected');
ok(S.state.passport.filter((x) => x.visited).length === 1 && S.stats().remaining === 99, 'exactly 1 visited, 99 left to visit');
ok(S.stats().verified === 0 && S.stats().partial === 100, 'verification honest: 0 verified, 100 partially verified (passport values only)');
const t = Object.assign({}, S.find('passport', 'd001'), { verifiedFields: ['name', 'pin', 'officeType', 'district'], source: 'https://example.com/x', verifiedDate: '2026-10-20' });
ok(S.verification(t) === 'partial', 'a non-official source link can never make a record "verified"');
t.source = 'https://www.indiapost.gov.in/x'; ok(S.verification(t) === 'verified', 'key fields + official source + date = verified');
// distance labels
ok(/straight-line/.test(G.label({ km: 120, type: 'straight' })) && !/by road|OSRM/i.test(G.label({ km: 120, type: 'straight' })), 'straight-line distances are labelled straight-line, never road');
ok(/by road/.test(G.label({ km: 120, type: 'road' })) && /OSRM/.test(G.label({ km: 120, type: 'road' })), 'road distances name their routing source');
ok(/Not available/.test(G.label(null)), 'missing coordinates give "Not available"');
const ui = ['js/directory.js', 'js/planner.js', 'js/map.js'].map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
ok(!/straight[^'"`\n]{0,40}by road/i.test(ui), 'UI text never calls straight-line figures road distance');
ok(/proximity-based suggested order/i.test(ui), 'planner labels non-routed sequences "proximity-based suggested order"');
console.log(fails ? '\n' + fails + ' check(s) failed' : '\nAll checks passed'); process.exit(fails ? 1 : 0);
