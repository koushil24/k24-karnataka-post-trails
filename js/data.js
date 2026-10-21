/* K_24 Karnataka Post Trails — seed data.
   EVERYTHING here is ILLUSTRATIVE until you replace it with verified information.
   Coordinates are approximate attraction/town positions, NOT verified post-office locations.
   Post office names, PIN codes, addresses and official sources are intentionally blank:
   fill them in from the official Karnataka Philately Passport list. */
(function () {
  const K = (window.K24 = window.K24 || {});

  K.SITE = {
    name: 'K_24 Karnataka Post Trails',
    tagline: 'Every Postmark Tells a Story.',
    owner: 'Your Name',                       // TODO: replace
    email: '',                                // TODO: add your contact e-mail to enable the contact form
    baseUrl: '',                              // TODO: e.g. https://USERNAME.github.io/REPO/
    social: { instagram: '', youtube: '' },   // TODO: add profile URLs (https://…)
    about: [
      'This is placeholder text. Replace it in js/data.js (SITE.about) with your own story: how you started collecting, what the Karnataka Philately Passport means to you, and what readers can expect.',
      'Only publish photographs you took yourself or have a licence to use, and label them honestly.'
    ]
  };

  K.CATEGORIES = ['Heritage', 'Temple', 'Nature', 'Wildlife', 'Coast', 'Hill Station', 'Travel'];
  K.POST_OFFICE_TYPES = ['Head Post Office', 'Sub Post Office', 'Branch Post Office', 'General Post Office (GPO)', 'Other'];
  K.VERIFY_FIELDS = [['name', 'Name'], ['pin', 'PIN code'], ['officeType', 'Office type (HO/SO/BO)'], ['district', 'District'], ['taluk', 'Taluk'], ['parentOffice', 'Parent office'], ['division', 'Postal division'], ['region', 'Postal region'], ['address', 'Address'], ['coordinates', 'Coordinates'], ['doi', 'Date of issue (DOI)']];
  K.VERIFY_REQUIRED = ['name', 'pin', 'officeType', 'district'];
  K.OFFICIAL_HOSTS = ['indiapost.gov.in', 'karnatakapost.gov.in', 'data.gov.in'];

  /* The 30 districts exactly as in the passport INDEX (order, spelling, first page) and the serial numbers read from the passport map.
     'official' = current official district name. Karnataka has 31 districts today: Bengaluru Rural is not in the passport index. */
  K.DISTRICTS = [
    { order: 1, name: "Bagalkot", official: "Bagalkot", first: 1, last: 3, page: 1 },
    { order: 2, name: "Ballari", official: "Ballari", first: 4, last: 5, page: 7 },
    { order: 3, name: "Belagavi", official: "Belagavi", first: 6, last: 14, page: 11 },
    { order: 4, name: "Bengaluru", official: "Bengaluru Urban", first: 15, last: 24, page: 29 },
    { order: 5, name: "Bidar", official: "Bidar", first: 25, last: 28, page: 49 },
    { order: 6, name: "Chamarajanagara", official: "Chamarajanagar", first: 29, last: 31, page: 57 },
    { order: 7, name: "Chikkaballapura", official: "Chikkaballapur", first: 32, last: 32, page: 63 },
    { order: 8, name: "Chikkamagaluru", official: "Chikkamagaluru", first: 33, last: 34, page: 65 },
    { order: 9, name: "Chitradurga", official: "Chitradurga", first: 35, last: 35, page: 69 },
    { order: 10, name: "Dakshina Kannada", official: "Dakshina Kannada", first: 36, last: 42, page: 71 },
    { order: 11, name: "Davanagere", official: "Davanagere", first: 43, last: 43, page: 85 },
    { order: 12, name: "Dharwad", official: "Dharwad", first: 44, last: 46, page: 87 },
    { order: 13, name: "Gadag", official: "Gadag", first: 47, last: 48, page: 93 },
    { order: 14, name: "Hassan", official: "Hassan", first: 49, last: 51, page: 97 },
    { order: 15, name: "Haveri", official: "Haveri", first: 52, last: 53, page: 103 },
    { order: 16, name: "Kalaburagi", official: "Kalaburagi", first: 54, last: 54, page: 107 },
    { order: 17, name: "Kodagu", official: "Kodagu", first: 55, last: 56, page: 109 },
    { order: 18, name: "Kolar", official: "Kolar", first: 57, last: 58, page: 113 },
    { order: 19, name: "Koppal", official: "Koppal", first: 59, last: 60, page: 117 },
    { order: 20, name: "Mandya", official: "Mandya", first: 61, last: 62, page: 121 },
    { order: 21, name: "Mysuru", official: "Mysuru", first: 63, last: 69, page: 125 },
    { order: 22, name: "Raichur", official: "Raichur", first: 70, last: 70, page: 139 },
    { order: 23, name: "Ramanagara", official: "Bengaluru South (renamed from Ramanagara, May 2025)", first: 71, last: 71, page: 141 },
    { order: 24, name: "Shivamogga", official: "Shivamogga", first: 72, last: 76, page: 143 },
    { order: 25, name: "Tumakuru", official: "Tumakuru", first: 77, last: 78, page: 153 },
    { order: 26, name: "Udupi", official: "Udupi", first: 79, last: 94, page: 157 },
    { order: 27, name: "Uttara Kannada", official: "Uttara Kannada", first: 95, last: 96, page: 189 },
    { order: 28, name: "Vijayanagara", official: "Vijayanagara", first: 97, last: 98, page: 193 },
    { order: 29, name: "Vijayapura", official: "Vijayapura", first: 99, last: 99, page: 197 },
    { order: 30, name: "Yadagiri", official: "Yadgir", first: 100, last: 100, page: 199 }
  ];
  K.DISTRICT_NOTES = {
    4: 'The passport lists “Bengaluru”. Some Bengaluru-area sites lie in Bengaluru Rural district (the 31st official district, absent from the passport index) — confirm per site.',
    23: 'Ramanagara district was officially renamed Bengaluru South (notification 23 May 2025); the passport index still prints the old name.',
    26: 'Serial range 79–94 was read from a crowded part of the passport map. It matches the index (32 pages from p.157 to p.189 = 16 destinations × 2 pages).',
    30: 'The passport index prints “Yadagiri”; the official district name is Yadgir.'
  };
  /* The 100 records come from the scanned passport (data/post-offices.json → js/post-offices.js). Fields the passport does not contain
     (taluk, parent office, division, region, address, coordinates…) start EMPTY and show "Not verified". */
  const dist = (o) => K.DISTRICTS[o - 1];
  K.PASSPORT = (K.POST_OFFICES || []).map((p) => ({
    id: p.id, serial: p.serial, districtOrder: p.districtOrder, passportDistrict: p.passportDistrict, currentDistrict: dist(p.districtOrder).official, district: p.passportDistrict,
    name: p.name, postOffice: p.name, officeCode: p.officeCode, postOfficeType: p.postOfficeType, pin: p.pin, doi: p.doi, theme: p.theme,
    taluk: '', parentOffice: '', division: '', region: '', circle: '', deliveryStatus: '', address: '', source: '', verifiedDate: '', verifiedFields: [], edited: [],
    attraction: '', category: 'Heritage', indexPage: dist(p.districtOrder).page, passportPage: p.passportPage, pageInferred: p.passportPage,
    lat: null, lng: null, coordSource: '', coordStatus: 'none', coordsVerified: false, nameSource: 'Scanned passport (Philately.pdf)',
    visitDate: '', plannedDate: '', planned: false, visited: false, cancellationCollected: false, blogPublished: false,
    notes: '', history: '', route: '', transport: '', nearby: '', photos: [], blogUrl: '', demo: false,
    pdf: { placeLine: p.placeLine, name: p.name, officeCode: p.officeCode, pin: p.pin, pinOnStamp: p.pinOnStamp, doiPrinted: p.doiPrinted, theme: p.theme, districtPrinted: p.districtPrinted, pdfPage: p.pdfPage, text: p.passportText, textBasis: p.passportTextBasis },
    dataNotes: p.notes || [] }));

  const body = (place) => [
    'DEMO DRAFT — replace this with your own travel story for ' + place + '.',
    'Suggested outline: how you got there, the post office visit, the cancellation you collected, what you spent, and one thing you would tell the next collector.',
    'Nothing in this placeholder describes a real trip of yours.'
  ].join('\n\n');

  K.BLOGS = [
    { id: 'mysuru-the-royal-city', title: 'Mysuru – The Royal City', category: 'Heritage', destinationId: 'mysuru', date: '', excerpt: 'Coming soon: the first postmark of the trail.', body: body('Mysuru'), cover: '', demo: true },
    { id: 'coorg-scotland-of-india', title: 'Coorg – Scotland of India', category: 'Nature', destinationId: 'madikeri', date: '', excerpt: 'Coming soon: coffee hills, mist and a hill-station post office.', body: body('Coorg'), cover: '', demo: true },
    { id: 'hampi-ruins-of-vijayanagara', title: 'Hampi – Ruins of Vijayanagara', category: 'Travel', destinationId: 'hampi', date: '', excerpt: 'Coming soon: boulders, bazaars and a pictorial cancellation.', body: body('Hampi'), cover: '', demo: true },
    { id: 'bandipur-into-the-wild', title: 'Bandipur – Into the Wild', category: 'Wildlife', destinationId: 'bandipur', date: '', excerpt: 'Coming soon: a forest-edge postmark.', body: body('Bandipur'), cover: '', demo: true }
  ];

  K.COLLECTION = [
    { id: 'c-demo-1', type: 'cancellation', title: 'Pictorial cancellation (demo)', location: 'Mysuru', date: '', note: 'Illustrative card. Add a photograph of your real cancellation.', image: '', demo: true },
    { id: 'c-demo-2', type: 'cancellation', title: 'Pictorial cancellation (demo)', location: 'Hampi', date: '', note: 'Illustrative card.', image: '', demo: true },
    { id: 'c-demo-3', type: 'stamp', title: 'Commemorative stamp (demo)', location: '', date: '', note: 'Illustrative card.', image: '', demo: true },
    { id: 'c-demo-4', type: 'cover', title: 'Special cover (demo)', location: '', date: '', note: 'Illustrative card.', image: '', demo: true }
  ];

  K.EXPENSE_CATEGORIES = ['Transport', 'Food', 'Stay', 'Entry fee', 'Local travel', 'Postage & stamps', 'Other'];
  K.TRAVEL_MODES = ['Any', 'Bus', 'Train', 'Car', 'Bike'];
  K.COLLECTION_TYPES = { cancellation: 'Cancellations', stamp: 'Stamps', cover: 'Special covers', postcard: 'Postcards' };
})();
(window.K24.mods = window.K24.mods || {})['data'] = '2026.10.20a';
