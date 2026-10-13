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
  const pad = (n) => String(n).padStart(3, '0');
  K.PASSPORT = [];
  K.DISTRICTS.forEach((d) => { for (let n = d.first; n <= d.last; n++) K.PASSPORT.push({
    id: 'd' + pad(n), serial: n, districtOrder: d.order, passportDistrict: d.name, currentDistrict: d.official, district: d.name,
    name: '', attraction: '', category: 'Heritage', postOffice: '', postOfficeType: '', pin: '', address: '', source: '', verifiedDate: '',
    indexPage: d.page, passportPage: null, pageInferred: d.page + 2 * (n - d.first),
    lat: null, lng: null, coordSource: '', coordStatus: 'none', coordsVerified: false, nameSource: '',
    visitDate: '', plannedDate: '', planned: true, visited: false, cancellationCollected: false, blogPublished: false,
    notes: '', history: '', route: '', transport: '', nearby: '', photos: [], blogUrl: '', demo: false }); });

  /* UNOFFICIAL candidate names (community site philatelypassport.in, 106 sites). NOT matched to passport serials and NOT verified.
     Use only as a picker while you hold the passport; district labels there differ from the passport's. [slug, name, community district, post office, category, needsVerification] */
  K.CANDIDATE_SOURCE = 'https://www.philatelypassport.in/sites/';
  K.CANDIDATES = [
    ["aihole-heritage-complex", "Aihole Heritage Complex", "Bagalkot", "Aihole Post Office", "Heritage"],
    ["amritapura-amriteshwara-temple", "Amritapura Amriteshwara Temple", "Chikkamagaluru", "Amritapura Post Office", "Temple"],
    ["ashoka-pillar", "Ashoka Pillar", "Bengaluru Urban", "Jayanagar Post Office", "Heritage"],
    ["baba-budangiri-hills", "Baba Budangiri Hills", "Chikkamagaluru", "Baba Budangiri Post Office", "Hill Station"],
    ["badami-cave-temples", "Badami Cave Temples", "Bagalkot", "Badami Post Office", "Heritage"],
    ["bahmani-tombs", "Bahmani Tombs", "Bidar", "Ashtur Post Office", "Heritage"],
    ["banashankari-amma-temple", "Banashankari Amma Temple", "Bagalkot", "Banashankari Post Office", "Temple"],
    ["bandipur-tiger-reserve", "Bandipur Tiger Reserve", "Chamarajanagar", "Bandipur Post Office", "Wildlife"],
    ["bannerghatta-national-park", "Bannerghatta National Park Butterfly Sanctuary", "Bengaluru Urban", "Bannerghatta Post Office", "Wildlife"],
    ["barah-kaman-ruins", "Barah Kaman Ruins", "Vijayapura", "Vijayapura Post Office", "Heritage"],
    ["beaulieu-heritage-mansion", "Beaulieu Heritage Mansion", "Bengaluru Urban", "Ambedkar Veedhi Post Office", "Heritage", true],
    ["belagavi-fort", "Belagavi Fort", "Belagavi", "Belagavi Head Post Office", "Heritage"],
    ["belur-chennakeshava-temple", "Belur Chennakeshava Temple", "Hassan", "Belur Post Office", "Temple"],
    ["bhoga-nandeeshwara-temple", "Bhoga Nandeeshwara Temple", "Chikkaballapur", "Nandi Post Office", "Temple"],
    ["bidar-fort", "Bidar Fort", "Bidar", "Bidar Head Post Office", "Heritage"],
    ["br-hills-wildlife-sanctuary", "BR Hills Wildlife Sanctuary", "Chamarajanagar", "BR Hills Post Office", "Wildlife"],
    ["brindavan-gardens-krs-dam", "Brindavan Gardens & KRS Dam", "Mandya", "KRS Dam Post Office", "Heritage"],
    ["chamarajeshwara-temple", "Chamarajeshwara Temple", "Chamarajanagar", "Chamarajanagar Post Office", "Temple"],
    ["chamundi-hills-nandi-monolith", "Chamundi Hills & Nandi Monolith", "Mysuru", "Chamundi Hill Post Office", "Hill Station"],
    ["channapatna-wooden-toys-craft-site", "Channapatna Wooden Toys Craft Site", "Ramanagara", "Channapatna Post Office", "Heritage"],
    ["chitradurga-fort-seven-circles", "Chitradurga Fort Seven-Circles", "Chitradurga", "Chitradurga Post Office", "Heritage"],
    ["devanahalli-fort", "Devanahalli Fort", "Bengaluru Rural", "Devanahalli Post Office", "Heritage"],
    ["dharwad-pedha-culinary-heritage-location", "Dharwad Pedha Culinary Heritage Location", "Dharwad", "Dharwad Head Post Office", "Heritage"],
    ["gadag-trikuteshwara-temple", "Gadag Trikuteshwara Temple", "Gadag", "Gadag Post Office", "Temple"],
    ["gaganachukki-barachukki-twin-falls", "Gaganachukki & Barachukki Twin Falls", "Mandya", "Shivanasamudra Post Office", "Hill Station"],
    ["gokak-falls", "Gokak Falls", "Belagavi", "Gokak Post Office", "Hill Station"],
    ["gokarna-mahabaleshwar-temple", "Gokarna Mahabaleshwar Temple", "Uttara Kannada", "Gokarna Post Office", "Temple"],
    ["gol-gumbaz-whispering-gallery", "Gol Gumbaz Whispering Gallery", "Vijayapura", "Vijayapura Post Office", "Heritage"],
    ["gulbarga-fort-jama-masjid", "Gulbarga Fort & Jama Masjid", "Kalaburagi", "Gulbarga Post Office", "Heritage"],
    ["gurudwara-nanak-jhira-sahib", "Gurudwara Nanak Jhira Sahib", "Bidar", "Bidar Post Office", "Temple"],
    ["halebidu-hoysaleswara-temple", "Halebidu Hoysaleswara Temple", "Hassan", "Halebidu Post Office", "Temple"],
    ["hampi-stone-chariot", "Hampi Stone Chariot", "Vijayanagara", "Hampi Post Office", "Heritage"],
    ["harihareshwara-temple", "Harihareshwara Temple", "Davanagere", "Harihar Post Office", "Temple"],
    ["ibrahim-rauza-tomb", "Ibrahim Rauza Tomb", "Vijayapura", "Vijayapura Post Office", "Heritage"],
    ["ikkeri-aghoreshwara-temple", "Ikkeri Aghoreshwara Temple", "Shivamogga", "Ikkeri Post Office", "Temple"],
    ["indian-institute-of-science-iisc", "Indian Institute of Science - IISc", "Bengaluru Urban", "IISc Post Office", "Heritage"],
    ["isro-headquarters-landmark", "ISRO Headquarters Landmark", "Bengaluru Urban", "ISRO Post Office", "Heritage"],
    ["jog-falls", "Jog Falls", "Shivamogga", "Jog Falls Post Office", "Nature"],
    ["kaiwara-heritage-site", "Kaiwara Heritage Site", "Chikkaballapur", "Kaiwara Post Office", "Temple"],
    ["kamal-basadi-jain-temple", "Kamal Basadi Jain Temple", "Belagavi", "Belagavi Post Office", "Temple"],
    ["kanakagiri-kanakachalapathi-temple", "Kanakagiri Kanakachalapathi Temple", "Koppal", "Kanakagiri Post Office", "Temple"],
    ["karkala-gommateshwara-statue", "Karkala Gommateshwara Statue", "Udupi", "Karkala Post Office", "Temple"],
    ["karnatak-university-landmark", "Karnatak University Landmark", "Dharwad", "Dharwad Post Office", "Heritage"],
    ["karwar-rabindranath-tagore-beach", "Karwar Rabindranath Tagore Beach", "Uttara Kannada", "Karwar Post Office", "Coast"],
    ["keladi-rameshwara-temple", "Keladi Rameshwara Temple", "Shivamogga", "Keladi Post Office", "Temple"],
    ["kemmangundi-hill-station", "Kemmangundi Hill Station", "Chikkamagaluru", "Kemmangundi Post Office", "Hill Station"],
    ["kempegowda-tower", "Kempegowda Tower", "Bengaluru Urban", "Basavanagudi Post Office", "Heritage"],
    ["khwaja-bande-nawaz-dargah", "Khwaja Bande Nawaz Dargah", "Kalaburagi", "Kalaburagi Post Office", "Temple"],
    ["kittur-rani-channamma-fort", "Kittur Rani Channamma Fort", "Belagavi", "Kittur Post Office", "Heritage"],
    ["kolar-amma-temple", "Kolar Amma Temple", "Kolar", "Kolar Post Office", "Temple"],
    ["kollur-mookambika-temple", "Kollur Mookambika Temple", "Udupi", "Kollur Post Office", "Temple"],
    ["koppal-fort", "Koppal Fort", "Koppal", "Koppal Post Office", "Heritage"],
    ["kotilingeshwara-temple", "Kotilingeshwara Temple", "Kolar", "Kamasandra Post Office", "Temple"],
    ["kudalasangama-temple", "Kudalasangama Temple", "Bagalkot", "Kudalasangama Post Office", "Temple"],
    ["lakkundi-temple-complex", "Lakkundi Temple Complex", "Gadag", "Lakkundi Post Office", "Temple"],
    ["lalbagh-botanical-garden-watch-tower", "Lalbagh Botanical Garden Watch Tower", "Bengaluru Urban", "Lalbagh Post Office", "Heritage"],
    ["lalitha-mahal-palace", "Lalitha Mahal Palace", "Mysuru", "Mysuru Post Office", "Heritage"],
    ["lotus-mahal", "Lotus Mahal", "Vijayanagara", "Hampi Post Office", "Heritage"],
    ["madhugiri-monolithic-fort", "Madhugiri Monolithic Fort", "Tumakuru", "Madhugiri Post Office", "Heritage"],
    ["madikeri-fort", "Madikeri Fort", "Kodagu", "Madikeri Post Office", "Heritage"],
    ["mahakuta-temples", "Mahakuta Temples", "Bagalkot", "Mahakuta Post Office", "Temple"],
    ["mahmud-gawan-madrasa", "Mahmud Gawan Madrasa", "Bidar", "Bidar Post Office", "Heritage"],
    ["male-mahadeshwara-hills", "Male Mahadeshwara Hills", "Chamarajanagar", "MM Hills Post Office", "Temple"],
    ["malpe-st-marys-island", "Malpe St. Mary's Island", "Udupi", "Malpe Post Office", "Coast"],
    ["malyavanta-raghunatha-temple", "Malyavanta Raghunatha Temple", "Vijayanagara", "Kamalapura Post Office", "Temple"],
    ["mangaladevi-temple", "Mangaladevi Temple", "Dakshina Kannada", "Mangaluru Post Office", "Temple"],
    ["melukote-cheluvanarayana-swamy-temple", "Melukote Cheluvanarayana Swamy Temple", "Mandya", "Melukote Post Office", "Temple"],
    ["moodabidri-thousand-pillar-jain-temple", "Moodabidri Thousand Pillar Jain Temple", "Dakshina Kannada", "Moodabidri Post Office", "Temple"],
    ["mudgal-fort", "Mudgal Fort", "Raichur", "Mudgal Post Office", "Heritage"],
    ["mudhol-hound-heritage-site", "Mudhol Hound Heritage Site", "Bagalkot", "Mudhol Post Office", "Heritage"],
    ["murudeshwar-shiva-statue", "Murudeshwar Shiva Statue", "Uttara Kannada", "Murudeshwar Post Office", "Coast"],
    ["murugha-matha-heritage-site", "Murugha Matha Heritage site", "Chitradurga", "Chitradurga Post Office", "Heritage"],
    ["mysuru-palace", "Mysuru Amba Vilas Palace", "Mysuru", "Mysuru Head Post Office", "Heritage"],
    ["namdroling-monastery-golden-temple", "Namdroling Monastery Golden Temple", "Kodagu", "Bylakuppe Post Office", "Temple"],
    ["nandi-hills-historical-site", "Nandi Hills Historical Site", "Chikkaballapur", "Nandi Hills Post Office", "Hill Station"],
    ["nanjangud-srikanteshwara-temple", "Nanjangud Srikanteshwara Temple", "Mysuru", "Nanjangud Post Office", "Temple"],
    ["pant-balekundri-heritage-site", "Pant Balekundri Heritage Site", "Belagavi", "Balekundri Post Office", "Heritage"],
    ["pattadakal-temples", "Pattadakal Temples", "Bagalkot", "Pattadakal Post Office", "Heritage"],
    ["raichur-fort", "Raichur Fort", "Raichur", "Raichur Post Office", "Heritage"],
    ["rajas-seat", "Raja's Seat", "Kodagu", "Madikeri Post Office", "Hill Station"],
    ["ramanagara-sholay-hills", "Ramanagara Sholay Hills", "Ramanagara", "Ramanagara Post Office", "Hill Station"],
    ["ranganathaswamy-temple", "Ranganathaswamy Temple", "Mandya", "Srirangapatna Post Office", "Temple"],
    ["sandesh-museum-of-communication", "Sandesh Museum of Communication", "Bengaluru Urban", "Museum Road Post Office", "Heritage"],
    ["santi-bastwad-landmark", "Santi Bastwad Landmark", "Davanagere", "Davanagere Post Office", "Heritage", true],
    ["shettihalli-rosary-church-submerged-ruins", "Shettihalli Rosary Church Submerged Ruins", "Hassan", "Shettihalli Post Office", "Heritage"],
    ["shivappa-nayaka-palace", "Shivappa Nayaka Palace", "Shivamogga", "Shivamogga Post Office", "Heritage"],
    ["shravanabelagola-monolithic-gommateshwara-statue", "Shravanabelagola Monolithic Gommateshwara Statue", "Hassan", "Shravanabelagola Post Office", "Temple"],
    ["siddaganga-matha-landmark", "Siddaganga Matha Landmark", "Tumakuru", "Tumakuru Post Office", "Heritage"],
    ["siddheshwara-temple", "Siddheshwara Temple", "Haveri", "Haveri Post Office", "Temple"],
    ["sogal-someshwara-temple", "Sogal Someshwara Temple", "Belagavi", "Sogal Post Office", "Temple"],
    ["somnathpur-keshava-temple", "Somnathpur Keshava Temple", "Mysuru", "Somnathpur Post Office", "Temple"],
    ["sringeri-sharada-peetham", "Sringeri Sharada Peetham", "Chikkamagaluru", "Sringeri Post Office", "Temple"],
    ["srirangapatna-daria-daulat-bagh", "Srirangapatna Daria Daulat Bagh", "Mandya", "Srirangapatna Post Office", "Heritage"],
    ["st-aloysius-chapel-heritage-paintings", "St. Aloysius Chapel Heritage Paintings", "Dakshina Kannada", "Mangaluru Head Post Office", "Heritage"],
    ["st-philomenas-cathedral", "St. Philomena's Cathedral", "Mysuru", "Mysuru Post Office", "Heritage"],
    ["talakaveri-kaveri-river-origin", "Talakaveri Kaveri River Origin", "Kodagu", "Talakaveri Post Office", "Temple"],
    ["tungabhadra-dam", "Tungabhadra Dam", "Vijayanagara", "Hosapete Post Office", "Heritage"],
    ["udupi-sri-krishna-mutt", "Udupi Sri Krishna Mutt", "Udupi", "Udupi Post Office", "Temple"],
    ["ugra-narasimha-statue", "Ugra Narasimha Statue", "Vijayanagara", "Hampi Post Office", "Heritage"],
    ["vidhana-soudha", "Vidhana Soudha", "Bengaluru Urban", "Bengaluru GPO", "Heritage"],
    ["vidyashankara-temple", "Vidyashankara Temple", "Chikkamagaluru", "Sringeri Post Office", "Temple"],
    ["virupaksha-temple", "Virupaksha Temple", "Vijayanagara", "Hampi Post Office", "Temple"],
    ["virupakshapura-ancient-inscription-stones", "Virupakshapura Ancient Inscription Stones", "Bengaluru Urban", "Kodigehalli Post Office", "Heritage", true],
    ["vittala-temple-complex", "Vittala Temple Complex", "Vijayanagara", "Hampi Post Office", "Heritage"],
    ["yadagiri-fort", "Yadagiri Fort", "Yadgir", "Yadagiri Post Office", "Heritage"],
    ["yana-caves-black-limestone-formations", "Yana Caves Black Limestone Formations", "Uttara Kannada", "Kodambale Branch Post Office", "Heritage"]
  ];

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
(window.K24.mods = window.K24.mods || {})['data'] = '2026.10.13b';
