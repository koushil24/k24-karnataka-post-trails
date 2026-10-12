# K_24 Karnataka Post Trails — *Every Postmark Tells a Story.*

A static, no-build website: vanilla HTML/CSS/JavaScript. Works on GitHub Pages as-is, needs no API keys or paid services.
(Chosen over React + Vite because no package registry was reachable when this was built, and the brief says not to mix architectures.)

## Run locally
```bash
cd k24-karnataka-post-trails
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```
Opening `index.html` directly (file://) also works.

## Deploy to GitHub Pages
1. Create a repository (e.g. `k24-post-trails`) and push these files to the root of the `main` branch.
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `/ (root)` → Save.
3. Your site appears at `https://USERNAME.github.io/REPO/`.
4. No base-path setting is needed: all paths are relative and routes use `#/…`, so refreshing any page works.
5. Optional, for WhatsApp/Facebook preview cards and a real sitemap: `node tools/generate-share-pages.js https://USERNAME.github.io/REPO/`, then commit the new `share/` folder, `sitemap.xml` and `robots.txt`. Set `SITE.baseUrl` in `js/data.js` too.

## Files
| Path | Purpose |
|---|---|
| `index.html` | Shell, inline branded loader, nav, footer, script tags |
| `css/styles.css` | All styling; colour tokens at the top; light + dark themes |
| `js/data.js` | **Edit me:** site info, seed passport list, blogs, collection (all marked demo) |
| `js/store.js` | localStorage store, schema v1, JSON/CSV import-export |
| `js/ui.js` | Escaping, i18n (EN/ಕನ್ನಡ), illustrative artwork, dialogs/forms, toasts |
| `js/map.js` | Leaflet + OpenStreetMap wrapper with loading/error handling |
| `js/anim.js` | GSAP/ScrollTrigger hero + parallax, IntersectionObserver reveals, counters |
| `js/views.js`, `js/views2.js` | Pages: home, passport, explore, destination, blogs, collection, expenses, planner, about, contact, privacy, 404 |
| `js/app.js` | Hash router, theme, drawer, search, boot |
| `assets/logo-full.png` | Your original logo, untouched. `logo-emblem.png` (round crop for nav/loader/favicons), `logo-full-640.png` (web size), `og-image.png` |
| `404.html` | GitHub Pages fallback → redirects to the app |
| `tools/generate-share-pages.js` | Optional static share pages + sitemap |

## Adding your real content
* **Passport list:** Passport page → *Import / export → Import CSV*. Export first to get the exact column layout. Columns: id, name, district, attraction, category, postOffice, pin, address, source, verifiedDate, visitDate, planned, visited, cancellationCollected, blogPublished, notes, history, route, transport, nearby, photos (separated by `|`), blogUrl, lat, lng, coordsVerified, demo. Then delete the demo rows. Set *Set official total…* so completion % uses the official count.
* Nothing is ever marked visited for you; tick *Visited* when editing a location.
* **Coordinates** in the demo rows are approximate town/attraction positions, not verified post-office locations; tick *I verified these coordinates* only after checking.
* **Photos:** add links (`https://…`) to images you own or are licensed to use. Hosting them in the repo under `assets/photos/` and linking `assets/photos/x.jpg` works too. The built-in scenes are original vector art, labelled as illustrations.
* **Blog posts, collection items, expenses:** add/edit/delete in the browser. To publish posts for all visitors, add them to `K.BLOGS` in `js/data.js` (browser-created posts exist only in your browser).
* **Site details:** edit `SITE` in `js/data.js` (name, e-mail for the contact form, social links, about text, `baseUrl`).
* **Colours:** CSS variables at the top of `css/styles.css`.

## Honest limitations
* **Data is local.** localStorage is per browser and per device, not synced, and is lost if browser data is cleared. Use *Full backup* often. Visitors see their own local copy of the seed data, not yours — this prototype is a personal tool plus a public shell. Syncing needs a real backend later; the JSON schema (`schemaVersion: 1`) is designed to migrate.
* **Routing** uses `#/` URLs so GitHub Pages refresh always works. Search engines mostly ignore fragments, so per-page SEO is limited to the share pages above. Page titles/meta update dynamically for browsers.
* **CDN dependencies** (GSAP, ScrollTrigger, Leaflet from cdnjs; Google Fonts) are not pinned with integrity hashes. If they fail, the site still works: no animation library → CSS motion; no Leaflet → list view with an error message. For production, vendor them into `assets/vendor/`.
* **Map tiles** come from `tile.openstreetmap.org`, which is fine for a small personal site with attribution but has a usage policy; switch the tile URL in `js/map.js` if traffic grows.
* **Planner** only uses straight-line distance between coordinates you've stored. It never invents routes, opening hours or fares, and flags sample data.
* **Kannada** covers navigation and key headings only; please have a native speaker review the wording.
* **Newsletter** does not exist (no backend). The contact form opens your e-mail app via `mailto:` and needs `SITE.email`.
* Not tested here: the live GSAP and Leaflet code paths (the build sandbox had no internet). Test the map and hero animation in your browser after deploying.

## Placeholders to replace
Passport locations (demo), blog posts (demo drafts), collection cards (demo), `SITE.owner`, `SITE.email`, `SITE.social`, `SITE.about`, `SITE.baseUrl`.
