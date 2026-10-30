# Dawei Sun — academic website

English physician academic homepage with a reverse chronological education and experience timeline, clinical experience, and all 24 publications on the homepage.

- Live site: https://daweisun.com
- Repository: https://github.com/godlovedawei-cloud/daweisun-homepage
- Hosting: GitHub Pages, root of `main`; DNS remains unchanged.
- Pages: `index.html` and `publications.html`.
- Public CV: `assets/Dawei-Sun-CV.pdf`. Original CVs and clinical logs remain outside the repository.
- Styles: `assets/site.css`; academic pages use a small navigation script for dismissing the Tools dropdown. The anesthesia tool uses local JavaScript and an isolated offline worker. No analytics, external fonts, or backend.

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

The clinical-volume tables and Torrance count placeholders are omitted from both the website and public CV at the owner’s request on October 28, 2026. In a subsequent clarification, the owner supplied residency case counts for inclusion only within that experience: adult anesthesia 1,200 (including cardiac, neurosurgical, and emergency anesthesia), obstetric/gynecologic anesthesia 140, and pediatric anesthesia 220. These are owner-supplied counts and do not derive from the earlier estimation table. `SHOW_CLINICAL_VOLUMES` is disabled. Retained aggregate data and rendering code are for possible future fellowship applications; do not re-enable them without a new request. Homepage ASA entries include the meeting name and city from the presentation records.

## Clinical counts (not displayed)

Previously displayed numbers were aggregate anesthesia records extracted read-only from the owner's training workbook, sheet 数据, skill-name/count columns N:O, rows 8–29. The owner identifies the coverage as through approximately July 2023. The workbook uses a batch-entry date rather than individual case dates. ICU rotation records are not used in the quantitative tables.

The retained data distinguish residency records from cumulative self-estimates through October 2024. Estimates use the **original**, unrounded residency count × 4/3, then round half-up to the nearest ten. The displayed residency records are also rounded to tens. Categories overlap, so there is no summed unique patient total. No block subtype, difficult-airway, or TEE count is inferred. The source workbook, reviewer names, and individual clinical records are not committed.

The owner also confirmed participation in establishing the preoperative anesthesia clinic: screening criteria, assessment workflows, IT optimization, critical-value alerts/escalation, and interdepartmental communication. Wording reflects a contributing role without an invented formal management title or measured efficiency improvement.

## Research, grants, service, and images

The NSFC Young Scientists Fund award is Project 82302479, PI, 2024–2026. Its English title is a consistent translation of the owner-supplied Chinese project title, rather than an independently verified official English title. Grants and ASA presentations have a dedicated section and navigation link. Both ASA presentations were oral; the 2019 selection as one of ten from more than 1,000 submissions is owner-reported.

The ScvO2 patent lists the owner as first inventor. Its description explains the intended application and Chinese utility-model category without claiming validated clinical outcomes. Peer review remains volunteer service: 50+ assignments across 17 journals, as of September 2026, from the newer CV. The tracking workbook supports journal names. Five actual journal names are displayed with “12 other journals”; Brazilian Journal of Anesthesiology is not confused with British Journal of Anaesthesia. Student-union roles are listed separately under leadership.

Three approved clinical photographs retain complete frames and omit EXIF metadata. The owner confirmed their suitability for publication. The decorative neuron image is no longer displayed. The portrait is the social-preview image.

## Bibliography and public CV

All 24 papers remain visible; first, co-first, and corresponding authorship are highlighted. Twenty-three papers were independently located in Crossref or publisher records. The 2017 *Critical care progress of traumatic spinal cord injury* citation remains based on the supplied CV: the journal's full name is verified, but the article, issue number, and external article link remain unverified and are not fabricated.

The Global Spine Journal article shows its 2023 online and 2025 print dates and remains under 2023 to match the CV. The European Journal of Preventive Cardiology paper shows its November 24, 2025 online date; Crossref had no volume/issue assignment at the check. Chinese-language articles are marked, Factor XI and iTRAQ typography are normalized, and verified DOI links are used. No third-party full-text PDFs are hosted.

The public CV omits the phone number and clinical-volume tables, follows the same reviewed facts as the website, and ends with “Updated October 2026”. Original documents remain untouched.

## Verification

Check desktop, tablet, and mobile layout; keyboard skip navigation; anchor targets; local asset URLs; profile links; all 24 publications and six authorship labels; and CV download. Extract PDF text to check qualifications, dates, estimates, paper count, and phone removal. Render every page to inspect glyphs and pagination. Confirm the deployed files match the reviewed local artifacts.

## Experience details — October 28, 2026

The owner supplied residency rotations in emergency medicine, intensive care, cardiology, neurology, and endocrinology; management of the preoperative preparation area for arterial lines, CVC placement, and peripheral nerve blocks; and clinical postdoctoral study implementation leadership in intraoperative oxygen supply–demand balance during cardiac and major vascular surgery. The study figures are 1,560 cardiac surgery patients enrolled and 314 included in the final analysis; no reason for exclusions is inferred. UCSF research concerned neonatal hypoxic-ischemic encephalopathy, and Ph.D. research concerned cerebral ischemia. These details are shared between the website and CV.

## Homepage introduction — October 28, 2026

The homepage introduction uses the five English paragraphs supplied by the owner, including physician-scientist identity, more than 1,500 residency cases, the 344-patient ciprofol trial, cardiac-surgery oxygen research, UK Biobank studies, and explicit U.S. fellowship intent. Wording is owner-supplied. This introduction update does not modify the public CV. Paragraph spacing preserves readability on mobile and desktop.

## Anesthesia Dose Quick Reference — October 28, 2026

The Tools dropdown opens `/tools/anesthesia-dosing/`, a self-contained English adult reference. The compact page has eight dose/ventilation items, a default-collapsed drug weight reference, default-collapsed adult Propofol and Fentanyl reference tables beside their respective entries in the drug-class order, and a formula list. The owner-supplied `drug-weight-reference.md` informs the reference; checked label sources and the correction to its Propofol maintenance note are recorded in `data/anesthesia-reference-review.md`, not displayed as a Sources section.

IBW/PBW use the same inch formula: male 50 + 2.3 × (height in inches − 60) kg; female 45.5 + 2.3 × (height in inches − 60) kg. Stored height remains centimeters and is converted exactly before applying the formula. BMI remains a calculated result and an LBW input, but its standalone formula is omitted from Formulas. LBW uses Janmahasatian; AdjBW uses coefficient 0.4. For drug selections using IBW/AdjBW, TBW replaces the dosing weight when TBW < IBW; ventilation still uses calculated PBW. Propofol adult label coefficient ranges are combined with the LBW obesity-literature scalar and identified as such. Fentanyl calculated doses show adult IV initial doses for minor (1–2 μg/kg) and major surgery (2–4 μg/kg), plus adult IM/IV premedication or postoperative analgesia (0.7–1.5 μg/kg), using the existing LBW obesity scalar. Pediatric analgesia (2–12 years, 2–3 μg/kg) is a reference-only row and never uses the adult patient's weight. All contexts are visible without selectors. The separate adult Fentanyl reference table retains its original content; its heading is simply 'Fentanyl · adults'. Rocuronium uses TBW automatically: routine 0.6 mg/kg and RSI 1.2 mg/kg. Conversions use exact 2.54 cm/in and 0.45359237 kg/lb; only display values are rounded.

Records remain in localStorage under `daweisun.anesthesia-dosing.patients.v1` (recent 5, maximum 100; oldest replaced at capacity). Legacy context fields are retained for compatibility but never determine displayed doses. No records are transmitted. Blocked storage permits temporary session calculations.

Safari installation: Share → Add to Home Screen; open the new icon once while online, then verify reopening in airplane mode. The calculator and all reference content work offline. Normal installation/status banners, the tutorial, and the visible Sources list are removed. Only actionable Update/Retry controls appear. Clearing website data or system eviction can remove local data. Physical iPhone Home Screen behavior still requires device verification; automated tests use Chromium mobile/touch layouts and offline mode.

Worker scope and versioned caches are isolated to the tool. Complete installation remains atomic. Failed updates preserve the current version; explicit updates preserve records. Retry checks the working cache before attempting repair and does not overwrite a healthy active cache just to retry an update. Successful caching is verified internally without a visible success banner.

After tool edits, run `python3 scripts/build_anesthesia_tool.py`; `node scripts/test_anesthesia.mjs` checks both sexes, all simultaneously displayed dosing contexts, fixed rocuronium TBW, ignored legacy choices, underweight fallback, short-height boundaries, conversions, severe-obesity LBW behavior, and the 120 kg boundary. Browser verification covers 320–1280 px layouts with references open/closed, context persistence, legacy records, blocked storage, offline cold starts, previous-version upgrades, failed updates, first-install failures, and cache repair. `python3 scripts/build_site.py --pages-only` remains available for academic-page changes without rewriting the public CV.

## Web-only refinements — October 28, 2026

Tools is now a native disclosure menu in the shared header, with the anesthesia reference as its first item. Its former homepage body section and the header CV link are removed; the hero Download CV button remains. The menu supports touch/keyboard, Escape, focus departure, and outside-pointer dismissal. Tool return links point to the homepage. The formula section lists equations and units only.

The homepage introduction starts “I am an anesthesiologist and researcher.” Its first mention of the Second Affiliated Hospital of Zhejiang University School of Medicine links to https://en.z2hospital.com/. The Torrance department line omits the city/state; the anesthesiologist role omits preparation-area management; the clinical postdoctoral description introduces the program before the study and enrollment figures, without the former overlap sentence. These are web-only edits. The PDF and its existing narrative constants remain unchanged; rebuild with --pages-only.

## Pediatric anesthesia test tool

`/tools/pediatric-anesthesia/` adapts the owner-supplied `pediatric-anesthesia-quick-reference-v6.html`; both academic pages link to it from Tools. Clinical data and references have not been independently verified. “Under construction · Test version” and “Unverified data. For testing only; not for clinical use.” remain prominent. Reviewed-by and last-reviewed claims are removed.

The reference is visible before patient input, with patient-specific results shown as “—”. Click an item such as ETT size to expand its explanation; there are no separate Formula/rule rows or global formula button. Face mask and inline suction catheter entries are removed. Invalid, reset, and unconfirmed outlier inputs restore the general reference without retaining stale results. Drug, airway, fluid-volume and other non-vital calculations remain unchanged from the supplied v6 engine; the existing 24 built-in checks are retained. Initial ventilator RR uses the owner-supplied approximate starting ranges: newborn <1 month 30–40/min, infant 1–11 months 25–35/min, 1–3 years 20–30/min, 4–6 years 18–25/min, 7–12 years 14–20/min, and 13–18 years 12–16/min. Click Initial RR to view the complete table, including before entering patient inputs. These ranges are owner-supplied and unverified; Ti and tidal-volume bands are unchanged. Resting vital signs use the separate Stanford reference described below. Run `node scripts/test_pediatric_rr.mjs` to check the RR age boundaries and original Ti/Vt bands.

The patient module automatically saves the five most recently used records (optional initials, years/months, kg, and optional Hct) under `daweisun.pediatric-anesthesia.patients.v1`. Opening a record makes it recent; creating a sixth replaces the least recently used record. Inputs are restored after reload and remain local to this browser. Adult records are separate. Denied/corrupt storage falls back to in-memory use with a visible session-only status.

An independent service worker caches only pediatric assets under `/tools/pediatric-anesthesia/`. Open once online and wait for **Available offline** before disconnecting; calculations, references, and saved records then work on offline reload and new-tab navigation. The manifest supports Home Screen installation. First-install failures offer Retry; failed updates retain the previous complete cache; Update activates a ready new version after saving inputs. Cache checks detect eviction and offer repair. External source links and the homepage require a connection. Run `python3 scripts/build_anesthesia_tool.py` after editing either tool to version their caches; this preserves the existing adult cache when its files are unchanged. Physical iPhone Home Screen behavior still requires device verification.

### Fluid units and resting vital signs — October 30, 2026

Maintenance results display cc/hr and the equivalent mL/hr. The expandable 4-2-1 reference includes 5–60 kg examples and the 18 kg/35 kg worked examples. This remains a basal-maintenance calculation rather than an automatic intraoperative infusion order; the short clinical context links to OpenAnesthesia.

Resting HR/RR/SBP/DBP use the [Stanford badge card, revised 2019](https://www.stanfordchildrens.org/content/dam/sch/content-public/pdf/trauma-badge-buddy-stanford-childrens.pdf), visually checked against page 2. Two supplied transcription values were corrected: 1–6 mo HR is 120–170 (not 110–170); 9–11 yr SBP is 95–115 (not 95–110). The PDF's final age label is visibly incomplete; the ≥16-year grouping follows the owner-supplied table and is disclosed on the page. Overlapping month labels are implemented as 1–<6 mo and 6–<12 mo; 12 months begins the 1–3 yr group. For <1 month, the cards say “See table” instead of guessing the 0–7 day or 1–3 week range from whole-month input. The full 10-row table is available without patient input. The entire Stanford reference block is collapsed by default and opens only on a user click; input, save, patient switching and reload never auto-open it. SBP and DBP have separate cards within that block; the previous combined BP/MAP presentation is replaced. The PALS threshold remains outside the collapsed Stanford block. No new patient fields or storage migration are required.

The expandable hypotension reference retains the existing PALS thresholds, using the [Children’s Mercy AHA/PEARS-derived table](https://www.childrensmercy.org/siteassets/media-documents-for-depts-section/documents-for-health-care-providers/block-clinical-practice-guidelines/mobileview/anaphylaxis-normal-blood-pressure-by-age.pdf), and adds the baseline/perfusion caution from [SPA Pedi Crisis, hypotension card](https://pedsanesthesia.org/checklists/). Additional compact monitoring notes cover healthy-child SpO₂, typical EtCO₂, temperature, and the [ASA monitoring standard amended October 15, 2025](https://www.asahq.org/standards-and-practice-parameters/standards-for-basic-anesthetic-monitoring). Neonatal temperature guidance is distinguished using [RCH temperature ranges](https://www.rch.org.au/rchcpg/hospital_clinical_guideline_index/Temperature_Management/). The supplied condensed memo's PEEP 4–5 value does not overwrite the existing 5–8 reference. Source checks are limited to these additions; the overall tool remains unverified and for testing only. Run `node scripts/test_pediatric_reference.mjs` and `node scripts/test_pediatric_rr.mjs` after changing these references.

### Sevoflurane and quick navigation — October 30, 2026

The sticky quick navigation now has two explicit rows with Drugs first, followed by Airway, Ventilation and Fluids; the second row contains Vitals, Access, PALS, Emergency and Local. Section anchor offsets account for the taller menu.

Sevoflurane is the first drug entry, with its age table and MAC concepts collapsed under the item name. [DailyMed Table 9](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=0ca6da3a-6a18-400d-8c49-08a5534b025f) supplies the in-oxygen reference values: full-term newborn 3.3%, 1–<6 months 3.0%, 6 months–<3 years 2.8%, and 3–12 years 2.5%; the expanded reference contains only these four pediatric rows, with 1/0.7/1.3-MAC columns and a label link in each row. The 0.7 and 1.3 columns are arithmetic conversions, rounded as supplied: 2.3/4.3%, 2.1/3.9%, 2.0/3.6%, and 1.75/3.25%. Adult rows and the adult worked example are omitted. The automatic label lookup stops above 12 years (144 months); no adolescent value is extrapolated. Premature-infant MAC is undetermined. The age reference remains available when an outlier weight suppresses routine IV calculations. The existing calculation engine's outputs are otherwise unchanged.

The 0.7–1.3 age-adjusted MAC range is described as the adult B-Unaware ETAG alarm protocol, based on its [primary methods report](https://pmc.ncbi.nlm.nih.gov/articles/PMC3683547/). It is not presented as a validated universal pediatric maintenance range or a guarantee against awareness. The ~1.3-MAC MAC95 statement is explicitly an approximate movement endpoint; the [supporting primary discussion](https://pubs.asahq.org/anesthesiology/article-pdf/90/2/406/396157/0000542-199902000-00013.pdf) specifically discusses isoflurane. The [MAC-awake study](https://pubmed.ncbi.nlm.nih.gov/8214700/) concerns adult responsiveness to command, not an amnesia threshold. The label's pediatric N2O datum applies to 1–<3 years with 60% N2O; no generic “halve the dose” rule is applied. Run `node scripts/test_pediatric_sevo.mjs` with the other pediatric checks after changing this reference.
