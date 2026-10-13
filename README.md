# K_24 Karnataka Post Trails — *Every Postmark Tells a Story.*

A static website (plain HTML/CSS/JS, **no build step**) for the Karnataka Philately Passport: 100 destinations in the passport's own 30-district order, a district directory, an interactive map, a journey planner, a collection archive, expenses and blogs. Works on GitHub Pages as-is; no accounts, no API keys, no paid services.

## Deploy (GitHub Pages)
1. In your repository, upload **every file and folder of this project** (replace the old ones). Keep the folder names exactly: `assets`, `css`, `js`, `tools`.
2. Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. Wait ~1 minute, open `https://USERNAME.github.io/REPO/` in a private tab.
If anything is missing or from an older upload, the site **names the exact file on screen** instead of spinning forever.

Local: `python3 -m http.server 8000` → http://localhost:8000. Tests: `npm test` (no dependencies; checks record counts, serials, district order, PIN/coordinate formats, and distance labels).

## What the 100 records are (and are not)
* **Structure is from your passport photos**: 30 districts in index order, the serial numbers (1–100) read from the passport map, and each district's first page from the index. Cross-check built into `npm test`: the index page gaps equal exactly 2 pages × destinations in every district.
* **Destination names, post offices, PINs and coordinates are NOT pre-filled.** None could be verified, so they show “Pending verification” / “Not available”. Nothing is invented.
* **Passport page numbers**: only the district's first page is known. Each record shows an *inferred* page (“≈ p.N”, 2 pages per destination) clearly marked; enter the real page to replace it.
* **Candidate list**: 106 names from the unofficial community site philatelypassport.in are included as an optional *picker* in each record's editor. They are **not matched to your serial numbers** (that site's per-district counts differ from your passport) and must be checked against your passport page and official sources.

## Verification rules (computed, never typed)
* **Pending** – no destination name.
* **Partially verified** – a name exists but something is missing.
* **Fully verified** – destination, designated post office, 6-digit PIN, *confirmed* coordinates, an official source link (`indiapost.gov.in`, `karnatakapost.gov.in` or `data.gov.in`) **and** a verification date.
Each record keeps separate fields: destination name, designated post office, PIN, office type, passport/current district, coordinates + source + status (none / from map search / confirmed), source link, verified date.
Authoritative sources to verify against: India Post PIN directory (https://www.indiapost.gov.in/rti/pincodelist), post-office locator (https://www.indiapost.gov.in/VAS/Pages/LocatePostOffices.aspx), Karnataka Postal Circle (https://karnatakapost.gov.in/).

## Districts
The directory keeps the passport's 30 districts in order. Karnataka officially has 31 districts; **Bengaluru Rural is not in the passport index**. “Ramanagara” was renamed **Bengaluru South** (notified 23 May 2025) and the passport still prints the old name; “Yadagiri” = official Yadgir. Each record stores both the passport district and the current official district.

## Distances
* **Straight-line** (great-circle) distance from the chosen start (Mysuru, Bengaluru or a custom point) is calculated from stored coordinates and always labelled “≈ N km straight-line (not road distance)”.
* **Road distance** appears only after you press *Get road route*, using the free public OSRM server; it is labelled “by road (OSRM routing estimate)”. If it fails, straight-line values stay and the page says so.
* The itinerary is a **proximity-based suggested order** (nearest next stop), not an optimised driving route. Trips are chunks of that order; nothing assumes everything can be done in one trip.
* Records without coordinates get “Not available” — never a made-up number. Google Maps / OpenStreetMap links use the destination's coordinates.

## Map
Leaflet + OpenStreetMap tiles (attribution shown), marker clustering, per-status colours, dashed outline for unconfirmed coordinates, reset button, district / visit / verification filters, place search (OSM Nominatim, only when you press Find, cached). Directory ↔ map: “Show on map” flies to the marker; clicking a marker highlights its directory row. Only real coordinates get markers.
Add coordinates: open a record → *Find coordinates on OpenStreetMap* → check the position → set status “Confirmed”.

## Data & privacy
Everything you enter lives in this browser's localStorage (single device, not synced). Use *Import / export → Full backup*. CSV export of **verified records only** and of all 100; CSV/JSON import updates records by serial. Third parties contacted: cdnjs (GSAP, Leaflet, marker-cluster), Google Fonts, OpenStreetMap tiles/Nominatim, OSRM (only on request).

## Files
`index.html` shell + loader + failure diagnostics · `css/styles.css` · `js/data.js` districts, 100 skeleton records, candidates · `js/store.js` storage, verification rules, CSV · `js/geo.js` distances/labels/OSRM · `js/map.js` · `js/directory.js` checklist + explore · `js/planner.js` · `js/views.js`/`views2.js` home, destination, blogs, collection, expenses, static pages · `js/app.js` router · `tools/validate-data.js` tests · `tools/generate-share-pages.js` optional share previews · `assets/` your logo files.

## Known limitations
* Names, post offices, PINs, coordinates and real passport pages still have to be entered/verified by you (or from the official sources above).
* Live GSAP animation, Leaflet map, clustering and OSRM were not exercisable in the build sandbox (no internet); the fallbacks were tested, the live paths need a check in your browser after deploying.
* Kannada covers navigation and key headings only; have a native speaker review.
* Public OSM tile and OSRM/Nominatim servers are for light use; switch providers if traffic grows.
