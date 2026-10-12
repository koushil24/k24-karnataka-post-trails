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

  const L = (id, name, district, attraction, category, lat, lng) => ({
    id, name, district, attraction, category,
    postOffice: '', pin: '', address: '', source: '', verifiedDate: '',
    visitDate: '', planned: true, visited: false, cancellationCollected: false, blogPublished: false,
    notes: '', history: '', route: '', transport: '', nearby: '', photos: [], blogUrl: '',
    lat, lng, coordsVerified: false, demo: true
  });

  K.PASSPORT = [
    L('mysuru', 'Mysuru', 'Mysuru', 'Mysuru Palace', 'Heritage', 12.3052, 76.6552),
    L('hampi', 'Hampi', 'Vijayanagara', 'Group of Monuments at Hampi', 'Heritage', 15.3350, 76.4600),
    L('madikeri', 'Madikeri (Coorg)', 'Kodagu', 'Abbey Falls & Raja’s Seat', 'Hill Station', 12.4244, 75.7382),
    L('badami', 'Badami', 'Bagalkot', 'Badami Cave Temples', 'Temple', 15.9149, 75.6767),
    L('pattadakal', 'Pattadakal', 'Bagalkot', 'Pattadakal Group of Monuments', 'Temple', 15.9488, 75.8167),
    L('gokarna', 'Gokarna', 'Uttara Kannada', 'Om Beach & Mahabaleshwar Temple', 'Coast', 14.5479, 74.3188),
    L('udupi', 'Udupi', 'Udupi', 'Sri Krishna Matha', 'Temple', 13.3409, 74.7421),
    L('belur', 'Belur', 'Hassan', 'Chennakeshava Temple', 'Temple', 13.1650, 75.8650),
    L('halebidu', 'Halebidu', 'Hassan', 'Hoysaleswara Temple', 'Temple', 13.2127, 76.0073),
    L('shravanabelagola', 'Shravanabelagola', 'Hassan', 'Gommateshwara (Bahubali) statue', 'Heritage', 12.8540, 76.4840),
    L('bidar', 'Bidar', 'Bidar', 'Bidar Fort', 'Heritage', 17.9200, 77.5200),
    L('jog-falls', 'Jog Falls', 'Shivamogga', 'Jog Falls', 'Nature', 14.2292, 74.8125),
    L('bandipur', 'Bandipur', 'Chamarajanagar', 'Bandipur National Park', 'Wildlife', 11.7000, 76.6500)
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
