# Dawei Sun — academic website

English physician academic homepage with a reverse chronological education and experience timeline, clinical experience, and all 24 publications on the homepage.

- Live site: https://daweisun.com
- Repository: https://github.com/godlovedawei-cloud/daweisun-homepage
- Hosting: GitHub Pages, root of `main`; DNS remains unchanged.
- Pages: `index.html` and `publications.html`.
- Public CV: `assets/Dawei-Sun-CV.pdf`. Original CVs and clinical logs remain outside the repository.
- Styles: `assets/site.css`; no JavaScript, analytics, external fonts, or backend.

## Preview and build

```sh
python3 scripts/build_site.py
python3 -m http.server 4173 --bind 127.0.0.1
```

The build requires Python and reportlab; Arial fonts are loaded from macOS. Open http://127.0.0.1:4173 to review. Push reviewed changes to `main` to publish automatically, then confirm the Pages build and public HTML, assets, and CV.

`data/publications.json` stores bibliography, authorship, links, and verification provenance. `data/clinical-experience.json` stores public rounded aggregate counts and estimation methodology. `scripts/build_site.py` contains the reviewed narrative and generates both HTML pages and the public CV without network calls. Asset URLs have content versions to refresh cached CSS and photos.

GitHub Pages serves tracked source files as well as pages: never commit private CVs, clinical logs, patient data, phone numbers, credentials, or private notes.

## Content provenance — October 14, 2026

The September 2026 CV is the principal source, supplemented by the December 2025 personal statement and the owner's subsequent corrections. The Wenzhou degree is **Bachelor of Medicine in Medicine**, matching the supplied translated certificate. The owner confirmed admission in October 2010, so the education dates are October 2010–July 2015. The owner explicitly retains **M.D., Ph.D.** in the public identity and uses **Anesthesiologist & Researcher** as the introductory role.

The clinical postdoctoral appointment overlapped the national standardized residency and initial postresidency work; it is explained as a Chinese program integrating research and clinical training. The Associate Researcher appointment from November 2024 concerns cerebral ischemia and neuroprotection, with no ongoing clinical practice asserted. Chinese professional titles are labeled by country; no U.S. licensure or ABA equivalence is asserted.

The owner confirmed Step 1, Step 2 CK, and OET passes, ECFMG certification in 2026, and planned Step 3 completion before December 2026. Expired resuscitation certificates are omitted. Torrance Memorial Hospital’s Department of Anesthesiology observership is dated October 2026; the University of Utah Hospital observership is dated November 2026. At the owner’s request, status labels and observation-area descriptions are omitted. Both last four weeks. The Utah department name is owner-supplied. No hands-on U.S. clinical practice is claimed.

UCSF visiting research was mentored by Donna Ferriero. ORCID 0000-0002-6631-8527 and Google Scholar Jt5Ds1kAAAAJ were confirmed by the owner; the Scholar link is also listed in the public ORCID profile. No unverified reviewer or bibliography profile is linked.

The clinical-volume tables and Torrance count placeholders are omitted from both the website and public CV at the owner’s request on October 28, 2026. In a subsequent clarification, the owner supplied residency case counts for inclusion only within that experience: adult anesthesia 1,200 (including cardiac, neurosurgical, and emergency anesthesia), obstetric/gynecologic anesthesia 140, and pediatric anesthesia 220. These are owner-supplied counts and do not derive from the earlier estimation table. `SHOW_CLINICAL_VOLUMES` is disabled. Retained aggregate data and rendering code are for possible future fellowship applications; do not re-enable them without a new request. The introductory biography also omits case counts. Homepage ASA entries include the meeting name and city from the presentation records.

## Clinical counts (not displayed)

Previously displayed numbers were aggregate anesthesia records extracted read-only from the owner's training workbook, sheet 数据, skill-name/count columns N:O, rows 8–29. The owner identifies the coverage as through approximately July 2023. The workbook uses a batch-entry date rather than individual case dates. ICU rotation records are not used in the quantitative tables.

The retained data distinguish residency records from cumulative self-estimates through October 2024. Estimates use the **original**, unrounded residency count × 4/3, then round half-up to the nearest ten. The displayed residency records are also rounded to tens. Categories overlap, so there is no summed unique patient total. No block subtype, difficult-airway, or TEE count is inferred. The source workbook, reviewer names, and individual clinical records are not committed.

The owner also confirmed participation in establishing the preoperative anesthesia clinic: screening criteria, assessment workflows, IT optimization, critical-value alerts/escalation, and interdepartmental communication. Wording reflects a contributing role without an invented formal management title or measured efficiency improvement.

## Research, grants, service, and images

The NSFC Young Scientists Fund award is Project 82302479, PI, 2024–2026. Its English title is a consistent translation of the owner-supplied Chinese project title, rather than an independently verified official English title. Grants and ASA presentations have a dedicated section and navigation link. Both ASA presentations were oral; the 2019 selection as one of ten from more than 1,000 submissions is owner-reported.

The ScvO2 patent lists the owner as first inventor. Its description explains the intended application and Chinese utility-model category without claiming validated clinical outcomes. Peer review remains volunteer service: 53 assignments across 17 journals, as of September 2026, from the newer CV. The tracking workbook supports journal names. Five actual journal names are displayed with “12 other journals”; Brazilian Journal of Anesthesiology is not confused with British Journal of Anaesthesia. Student-union roles are listed separately under leadership.

Three approved clinical photographs retain complete frames and omit EXIF metadata. The owner confirmed their suitability for publication. The decorative neuron image is no longer displayed. The portrait is the social-preview image.

## Bibliography and public CV

All 24 papers remain visible; first, co-first, and corresponding authorship are highlighted. Twenty-three papers were independently located in Crossref or publisher records. The 2017 *Critical care progress of traumatic spinal cord injury* citation remains based on the supplied CV: the journal's full name is verified, but the article, issue number, and external article link remain unverified and are not fabricated.

The Global Spine Journal article shows its 2023 online and 2025 print dates and remains under 2023 to match the CV. The European Journal of Preventive Cardiology paper shows its November 24, 2025 online date; Crossref had no volume/issue assignment at the check. Chinese-language articles are marked, Factor XI and iTRAQ typography are normalized, and verified DOI links are used. No third-party full-text PDFs are hosted.

The public CV omits the phone number and clinical volumes, follows the same reviewed facts as the website, and ends with “Updated October 2026”. Original documents remain untouched.

## Verification

Check desktop, tablet, and mobile layout; keyboard skip navigation; anchor targets; local asset URLs; profile links; all 24 publications and six authorship labels; and CV download. Extract PDF text to check qualifications, dates, estimates, paper count, and phone removal. Render every page to inspect glyphs and pagination. Confirm the deployed files match the reviewed local artifacts.

## Experience details — October 28, 2026

The owner supplied residency rotations in emergency medicine, intensive care, cardiology, neurology, and endocrinology; management of the preoperative preparation area for arterial lines, CVC placement, and peripheral nerve blocks; and clinical postdoctoral study implementation leadership in intraoperative oxygen supply–demand balance during cardiac and major vascular surgery. The study figures are 1,560 cardiac surgery patients enrolled and 314 included in the final analysis; no reason for exclusions is inferred. UCSF research concerned neonatal hypoxic-ischemic encephalopathy, and Ph.D. research concerned cerebral ischemia. These details are shared between the website and CV.
