# Verification report — K_24 Karnataka Post Trails

Source of the 100 records: your scanned passport, `Philately.pdf` (100 pages, one page per post office, all photographs — no text layer).

## Totals
| Item | Count |
|---|---|
| Records in the PDF | 100 |
| Records imported | 100 (serials 1–100, none skipped, none duplicated) |
| Fully verified against an official source | **0** |
| Partially verified (values read from your passport; official check still to do) | **100** |
| Pending (no data) | 0 |

"Verified" in the app means: key fields ticked as confirmed + an official source link (indiapost.gov.in / karnatakapost.gov.in / data.gov.in) + a verification date. Nothing was marked verified automatically. **No claim of 100% verification is made.**

## How the PDF was read
1. Embedded page images extracted at native resolution and OCR'd with Tesseract (English).
2. OCR alone was not trusted for the key fields. **All 100 "PLACE / DOI" lines were read by eye** from deskewed, zoomed crops (name, office type, PIN, DOI).
3. District printed on each page was compared with the district from your passport index: **100 of 100 agree**. The serial ranges I had read from your map were also confirmed (index page gaps = exactly 2 pages × destinations in all 30 districts).
4. PINs were cross-checked against the PIN printed on the cancellation stamp where the stamp was machine-readable: 38 pages had an independent stamp read; 30 matched immediately; 8 differed — 7 were OCR mistakes (stamp visually matched the PLACE line: #12, #27, #52, #59, #76, #84, #99) and **1 is a real conflict inside your passport (#9)**. For the other 62 pages the PIN rests on the PLACE line read by eye only.

## DOI
The passport prints "DOI" without explaining it. As you confirmed, it is stored and labelled **Date of issue (DOI)**, as printed. All 100 dates are valid calendar dates. They are **not** verified against any other source.

## Discrepancies and items needing manual review
* **#9 Nandgad SO** — PLACE line prints PIN **591115**; the cancellation stamp prints **591120**. Both are stored; the record is flagged.
* **PINs shared by several offices** (not a mistake — a PIN does not identify one office): 560001 → #15, #16, #17 · 577411 → #72, #73 · 587201 → #2, #3 · 591115 → #8, #9.
* **#57 Oorgaum (K.G.F)** and **#62 Srirangapatna** — no office type (HO/SO/BO) is printed.
* **#52 Ranebennur** — office type is printed as "MDG" (meaning not verified).
* **#15 Bengaluru GPO-PB** — printed as "GPO-PB" (Philatelic Bureau counter at the GPO); stored as Bengaluru, GPO.
* **#57** also prints: "The Champion Reefs Post Office relocated to the Oorgaum Post Office on June 15, 2026." (kept as a note).
* **#22** — the theme label is cut off at the page edge ("Science & Technolo…"); stored as "Science & Technology".
* Passport "Classification" is a **theme** (Monument, Flora and Fauna, Personality…), not HO/SO/BO. Both are stored separately: theme, and office type from the PLACE line.
* District names: the passport still prints Ramanagara (now Bengaluru South, notified 23 May 2025) and "Yadagiri" (official Yadgir); Bengaluru Rural is not in the passport index. Both passport and current names are stored.

## Unverified fields (all 100 records)
Taluk, parent post office, delivery status, postal division, postal region, postal circle, exact address, coordinates, and any official source link are **not in the PDF and not yet verified** — shown as "Not verified". The India Post locator is an interactive form that could not be queried in bulk from the build environment; fill these in the app (Edit → fields and "Confirmed against an official source" ticks) or by CSV import.

## Descriptions
Every record has a short generated description from its verified-from-passport fields (type, district, PIN, theme, DOI). For 88 records a machine-read draft of the printed passport text is stored for comparison; it may contain small OCR errors and is shown in a collapsed, clearly labelled section. Historical claims beyond what the passport prints are marked "not available".

## Your tracking data
As requested: all 100 start **Not visited**, except serial **63 (Mysuru HO, passport pp. 125–126)** which is **Visited** with **PPC collected** (visit date 30.08.2023, read from the stamp on that page — change it if wrong). Earlier local data is migrated: blogs, collection and expenses are kept; the demo locations from the first version were replaced.

## Website bugs fixed in this release line
* Stuck "Loading…" screen: startup now reports the exact missing/mismatched file (version stamps on every script, cache-busting URLs) instead of an endless spinner; loader always exits (4.5 s fallback).
* Map failures never block the page (list view + retry); marker clustering is optional.
* Passport dashboard overlapping controls; empty-hash route showing the 404 page; number-field validation; PIN/coordinate range validation.
