# Dawei Sun — academic website

English physician academic homepage with a chronological education and experience timeline and all 24 publications on the homepage.

- Live site: https://daweisun.com
- Hosting: GitHub Pages, root of `main`; DNS remains unchanged.
- Pages: `index.html` and `publications.html`.
- Public CV: `assets/Dawei-Sun-CV.pdf`. The original CV is not stored in this repository.
- Styles: `assets/site.css`; no JavaScript, analytics, external fonts, or backend.

## Preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173.

## Update content

`data/publications.json` contains the reviewed bibliography, links, authorship roles, and verification provenance. `scripts/build_site.py` contains the reviewed biography, training, clinical experience, and document layout; it generates both HTML pages and the public CV without network calls.

Run with Python plus `reportlab` (Arial fonts are loaded from macOS):

```sh
python3 scripts/build_site.py
```

Optional portrait: add an approved `assets/portrait.jpg`, `portrait.png`, or `portrait.webp`, then rebuild. In its absence the homepage uses a complete text layout with no empty image frame. Review the crop and layout after adding a photograph.

Push reviewed changes to `main` to publish automatically. Confirm the GitHub Pages build and the three public URLs after deployment. GitHub Pages serves all tracked source files as well as the pages: never commit private CVs, phone numbers, credentials, or private notes.

## Content provenance — October 14, 2026

Primary source: September 2026 CV, supplemented by the owner’s confirmation of ECFMG certification, scheduled Step 3, current appointment, and October 2026 Torrance Memorial Hospital anesthesiology observership. Observership completion status is not asserted. Utah is omitted pending details. The owner confirmed a four-week Torrance observership and clarified that the current Associate Researcher role focuses on cerebral ischemia, rather than patient blood management. Explicit application intentions and clinical-interest statements are omitted. No fellowship admission or U.S. clinical licensure is claimed.

The public CV omits the phone number, retains all 24 publications, and adds the owner-supplied observership with a document note. Original source PDFs remain untouched outside the repository.

Bibliography checks:

- 19 exact or near-exact title matches in Crossref, plus publisher verification of four additional records: 23 of 24 independently located. Corresponding authorship for the 2025 sevoflurane and ciprofol trials is corroborated by publisher correspondence information. Co-first authorship follows the supplied CV.
- The 2017 *Critical care progress of traumatic spinal cord injury* review is retained as supplied in the CV, without an unverified external link. A similar Crossref title is a different paper and was deliberately rejected.
- The Global Spine Journal paper was published online in 2023 and in print in 2025; both dates are shown, and it remains under 2023 to match the CV.
- The A2BAR paper’s volume and pages are completed from Crossref. The European Journal of Preventive Cardiology paper retains its 2025 online-first article identifier.
- No third-party full-text PDFs are hosted.

## Verification

Check desktop/tablet/mobile layouts, keyboard skip navigation, anchor targets, all local asset URLs, publication counts, author highlighting, and PDF download. Extract text from the public PDF to check phone removal, qualification wording, observership wording, and paper count; render every page to inspect pagination and glyphs.
