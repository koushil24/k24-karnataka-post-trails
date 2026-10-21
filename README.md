# K_24 Karnataka Post Trails — *Every Postmark Tells a Story.*

A static website (plain HTML/CSS/JS, **no build step**) for the Karnataka Philately Passport: the 100 post offices from your scanned passport in its own 30-district order, a tracker, a district directory, an interactive map, a journey planner, a collection archive, expenses and blogs. Works on GitHub Pages as-is; no accounts, no API keys, no paid services.

## Deploy (GitHub Pages)
1. In your repository, upload **every file and folder of this project** (replace the old ones). Keep the folder names exactly: `assets`, `css`, `js`, `tools`.
2. Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. Wait ~1 minute, open `https://USERNAME.github.io/REPO/` in a private tab.
If anything is missing or from an older upload, the site **names the exact file on screen** instead of spinning forever.

Local: `python3 -m http.server 8000` → http://localhost:8000. Tests: `npm test` (no dependencies; checks record counts, serials, district order, PIN/coordinate formats, and distance labels).

## What the 100 records are
* **Source:** your scanned passport `Philately.pdf`. All 100 pages were read (OCR plus every PLACE/DOI line read by eye) into `data/post-offices.json` — the editable master file — and `js/post-offices.js` (generated: `node tools/build-js.js`).
* **From the passport:** serial, post office name, office type (HO/SO/BO as printed), PIN, **DOI = Date of issue (as printed)**, theme (printed as “Classification”), district, passport pages (district start + 2 per destination, verified on PDF pages 1, 57, 63).
* **NOT in the passport, so “Not verified”:** taluk, parent office, delivery status, division, region, circle, address, coordinates.
* The original passport values are kept in each record (`pdf`) and shown beside the current values, so edits are visible.
* One conflict inside the passport is flagged: #9 Nandgad (PLACE line 591115 vs stamp 591120). Four PINs are shared by several offices. See `VERIFICATION_REPORT.md`.

## Your tracking data
Not visited / Planned / Visited, PPC collected, visit date and notes live in the same records (no second tracking system) and are saved in this browser. Serial 63 (Mysuru HO, pp.125–126) starts as visited with PPC collected; everything else starts Not visited. Expenses can be linked to a post office from its page. Earlier local data is migrated safely (blogs, collection, expenses kept).

## Verification rules (computed, never typed)
* **Pending** – no name. **Partially verified** – values from the passport, not yet checked. **Verified** – the key fields (name, PIN, office type, district) ticked as confirmed **and** an official source link (`indiapost.gov.in`, `karnatakapost.gov.in`, `data.gov.in`) **and** a verification date.
* Official sources: India Post PIN directory (https://www.indiapost.gov.in/rti/pincodelist), post-office locator (https://www.indiapost.gov.in/VAS/Pages/LocatePostOffices.aspx), Karnataka Postal Circle (https://karnatakapost.gov.in/).

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
`index.html` shell + loader + failure diagnostics · `css/styles.css` · `data/post-offices.json` + `js/post-offices.js` the 100 records · `js/data.js` districts and field setup · `js/store.js` storage, verification rules, CSV · `js/geo.js` distances/labels/OSRM · `js/map.js` · `js/directory.js` checklist + explore · `js/planner.js` · `js/views.js`/`views2.js` home, destination, blogs, collection, expenses, static pages · `js/app.js` router · `tools/validate-data.js` tests · `tools/generate-share-pages.js` optional share previews · `assets/` your logo files.

## Known limitations
* Taluk, parent office, division, region, address and coordinates still have to be verified (nothing is invented). PINs/DOIs come from the passport and are not yet checked against India Post.
* Live GSAP animation, Leaflet map, clustering and OSRM were not exercisable in the build sandbox (no internet); the fallbacks were tested, the live paths need a check in your browser after deploying.
* Kannada covers navigation and key headings only; have a native speaker review.
* Public OSM tile and OSRM/Nominatim servers are for light use; switch providers if traffic grows.
