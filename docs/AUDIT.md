# Audit — K_24 Karnataka Post Trails (stages 1–3)

Checked: the live site (loads correctly — "didn't finish loading" no longer appears), every file in the project, and the site in a headless browser at 8 screen widths.

## 1. Existing features (working)
Home with 3D stamp and progress ring · Passport (100 post offices, 30 districts in passport order, search, district jump, only-visited) · one page per post office (details, photos, your description) · Journey (stories with photos) · Owner mode (publish edits to GitHub) · English/ಕನ್ನಡ · light/dark · loading screen with error report.

## 2. Broken
Nothing found on the live site. Fixed in this stage: "1 post offices visited" (now singular/plural); on 320–360 px phones the top bar was 22 px too wide (side-scroll) — replaced by a bottom navigation bar.

## 3. Missing (planned for later stages)
District pages and "nearby" · map with all 100 locations · route planner and Google Maps links · separate Planned / Visited / PPC / Photo / Notes boxes · private expenses and backup.

## 4. Data quality
All 100 records match your scanned passport (see DATA_VALIDATION.md). Still not verified against India Post: PIN codes, date of issue (DOI), taluk, parent office, delivery status, division, region, address, coordinates. One PIN conflict inside the passport (Nandgad #9). Four PINs are shared by several offices.

## 5. Mobile / desktop
No horizontal overflow at 320, 360, 390, 430, 768, 1024, 1366, 1920 px on Home, Passport, a post-office page, Journey and a story. Phones: bottom navigation. Tablets (640–1023 px): two-column hero and a side details panel. Large desktops (≥1700 px): wider layout.

## 6. Security and privacy
Visitors can only read. Publishing needs your private GitHub token, which lives only in the browser where you typed it (sign out removes it). Everything you publish (photos, text, stories) is public, as is the repository. Text from you is escaped before display. GitHub Pages cannot hide anything — do not publish private notes or expenses (planned to stay on your phone only).

## 7. Recommended fixes (next stages)
Add coordinates (one-click batch search in Owner mode, results marked "approximate"), build the district directory, then the route planner.
