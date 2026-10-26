# K_24 Karnataka Post Trails — simple version

Three pages: **Home**, **Passport** (all 100 post offices, your visited ones highlighted) and **Journey** (your Karnataka travel stories).
Visitors can only look. You — and only you — can add a visit description, photos of the stamp / location / post office, and travel stories.
English / ಕನ್ನಡ and light / dark are included. No other features.

## 1. Put it on GitHub
1. In your repository `k24-karnataka-post-trails`, upload **everything in this zip** (all folders too), replacing the old files. **The zip deliberately does not contain `data/content.json` or the `photos` folder — those are your published posts; never replace them.** Keep the folder names: `assets`, `css`, `js`, `data`, `docs`, `tools`.
2. Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. Wait about a minute and open your site in a private tab. If something is missing, the page itself tells you which file.

## 2. One-time setup to edit from the website (about 5 minutes)
A website on GitHub Pages cannot save anything by itself, so the site saves your edits **into your repository** using a private key (a “token”) that only you hold.
1. On GitHub (use *Desktop site* on a phone): profile picture → **Settings** → **Developer settings** (bottom of the left menu) → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Name: `K24 site`. Expiration: 90 days (you can renew later).
3. **Repository access → Only select repositories →** choose `k24-karnataka-post-trails`.
4. **Permissions → Repository permissions → Contents → Read and write.** Nothing else.
5. **Generate token** and copy it (it starts with `github_pat_`).
6. Open your site → footer → **Owner** → paste the token → **Connect**.
The token is stored only in that browser on that device. **Sign out** (footer “Owner mode” button) removes it. If you ever lose the phone, delete the token on GitHub.

## 3. Using it
* **Map page:** a real, zoomable OpenStreetMap with a marker for each located post office (green = not visited, gold = visited, dashed outline = approximate position). 72 of 100 start with approximate town-level positions. Sign in as Owner → Map page → **Locate with OpenStreetMap** finds the other 28 (takes about 2 minutes; keep the page open) and you press Save to publish them. On any post office page, **Fix location** (paste latitude, longitude from Google Maps) or **Confirm location** turns it into a confirmed position. Positions are never claimed to be exact until you confirm them.
* **Passport map:** the Passport page shows the map from your passport’s front page. Each district chip shows visited / total; tap one to jump to that district’s post offices.
* **Passport →** open a post office → **Edit**: tick *Visited*, set the date, write what you want to remember, add photos of the **stamp**, the **location** and the **post office**, then **Save & publish**.
* **Journey → + New story**: title, date, text, optional photos, optional link to a post office.
* Visitors see your changes about **1 minute** after you press Save & publish. Photos are shrunk automatically (max 1600 px) before upload.
* Serial 63 (Mysuru HO) starts as visited, dated 30.08.2023 — change it by editing.

## Where things are stored
* `data/content.json` — everything you publish (visits, descriptions, stories). Editable by hand if you ever want to.
* `photos/` — your uploaded photos.
* `js/places.js` — the 100 post offices read from your passport (name, PIN, date of issue, theme, district). Fixed list. The full source data and checking report are in `data/passport-source.json` and `docs/VERIFICATION_REPORT.md`.

## Good to know
* Details such as PIN and “date of issue (DOI)” come from your scanned passport and have **not** been checked against India Post. One conflict is flagged (Nandgad: PLACE line 591115 vs stamp 591120).
* Deleting or replacing a photo/story does not delete the old photo file from `photos/` (harmless; delete it on GitHub if you want).
* Only one person should edit at a time. If a save fails, read the message — usually the token expired or lacks “Contents: Read and write”.
* The site works without any server. Fonts come from Google Fonts; nothing else is loaded from other websites.
* Your old local data from the previous version (blogs, expenses, collection) is not used any more; it stays untouched in that browser.
