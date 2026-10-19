# Ayyappa companion

A document-first mobile reading companion. The main guide follows the user-selected [Sri Ayyappa Swami Nitya Puja Vidhanam](https://drive.google.com/file/d/1EDanwSJyooDryISf5TedJcoKyl_VjJ5Q/view), with all 61 supplied pages organized into 15 chapter divisions. Previous guides from the permanent [Ayyappa collection](https://drive.google.com/drive/folders/1CksLIfctrHaQum3a2GMWF2M-ZbwC4pz0), typed chant readers, and the items table remain in **Companion sections**.

**Live website:** https://sdonka561.github.io/ayyappa-companion/

**Source repository:** https://github.com/sdonka561/ayyappa-companion

## Run

Requires Node.js 20 or later. Serving, building, and testing need no npm installation; the site has no runtime dependencies. The optional local OCR extraction tool uses the development dependency `tesseract.js` (`npm ci`).

```powershell
Set-Location .\ayyappa-guide
npm start
```

Open http://127.0.0.1:4173. The default landing page is the main book's contents. Topic, language, chapter, book page, search, and section links are addressable in the URL. Preparation checkmarks and text size last for the current visit. Existing shared companion links remain valid.

The book reader starts with the original Telugu scan, not OCR. Full-size images support native zoom; Previous/Next links cross chapter boundaries, and focus view removes surrounding navigation. Selectable Telugu text is separately labeled **unreviewed OCR draft** because recognized spellings and column ordering contain errors. Do not use this draft as verified chanting text. Switching the interface to English does not translate the book. Search covers chapter headings, draft OCR, and the separate companion content, with its limitations disclosed.

## Share with friends

**Single file:** `npm run build` creates `public\ayyappa-companion.html`. It includes all 61 original page images, draft OCR, companion content, and styles for offline use (approximately 27 MB). Desktop browsers can open it directly without a server or internet. Source links still require internet. The normal hosted website loads only the current page image, not all book images at once, and is preferable for phone sharing.

**Website:** upload **only the contents of `public`** to a static hosting provider such as Netlify Drop, Cloudflare Pages, or GitHub Pages. `index.html` must be at the published root. There is no server-side application or secret configuration. For a host that requires a build command, use `npm run build` and set the publish directory to `public`. Use the resulting HTTPS address, not the localhost preview address. The app's Share button copies the current topic/language link once hosted.

This app is published on GitHub Pages from the `gh-pages` branch, containing only the website files. The `main` branch contains source and tools. The user-selected book's rendered page images are included for the requested rebuild; keep private extraction artifacts, OCR model/cache, and unrelated source books out of `public`. No recordings are bundled.

To update the published site after editing and committing `main`:

```powershell
npm run build
npm test
git add public
git commit -m "Update Ayyappa companion"
git push origin main
git subtree split --prefix public -b pages-update
git push origin pages-update:gh-pages
```

Use a new local split branch name for subsequent publications, or split directly to a commit and push that commit. GitHub Pages rebuilds the site after the `gh-pages` push.

The portable file embeds scripts/styles. Open it as a downloaded local file; the development server intentionally blocks inline scripts on HTTP pages. The normal hosted website uses external script/style files instead.

## Content and limitations

- Main book: cover, 36 deeksha rules, mala/initiation and pilgrimage, Ayyappa's story, opening prayers, Devi/other prayers, Ayyappa prayer, offerings and anga puja, ashtottaram, arati/mantra pushpam, sharanaghosha, both padayatra pages, closing stotras and Harivarasanam, forgiveness/materials, and concluding bhajans. English labels are editorial navigation aids, not translations of the entire book. The originals are available even when the separate companion reader still marks an item as pending.
- Ten guide topics cover daily practice, puja, peetam, food, eating, sleeping, prayers, deeksha, eighteen daily reminders, and pilgrimage preparation. Dedicated Chant & Sing and daily-checklist views sit alongside them.
- Chant & Sing provides a complete, source-numbered 108-name ashtottaram in Telugu, the 107 invocations actually present in the ABP sharanaghosha sheet, a separate 108-repeat sharanam reader, traditional opening prayers, Ayyappa Gayatri, Pancharatna verses, forgiveness prayer, and call/response invocations. List/single-entry views and focus reading work on phones.
- The ABP sharanaghosha sheet is not padded to 108: its source has 107 nonempty invocations. Use the separate refrain counter for 108 repetitions. Prayer text remains Telugu regardless of the guide language; no Roman transliteration is generated or offered. Ganesha, Guru, Ayyappa Gayatri, and the sharanam refrain have separately labeled editorial English meanings for understanding, subject to Guruswamy review. Other readers explicitly state that English translation is not yet available. Tamil material remains accessible through its source references, not invented Telugu or English recitations.
- Sabarimala padayatra bhajans uses the user-selected Nitya Puja book (`1EDanwSJyooDryISf5TedJcoKyl_VjJ5Q`), printed page 42, which is physical PDF page 40. Its 19 call/response pairs are transcribed in Telugu script, with source spellings retained, including Tamil-sounding phrases. The original scanned page is available alongside the reader for comparison and zooming, and is embedded in the offline portable edition.
- Morning/evening quick access uses the browser's local time with a manual override. The twelve grouped daily-puja stages save checkmarks in this browser under a local-date key; they reset for a new date. If storage is blocked, the app warns that checkmarks last only for the current visit.
- In the separate companion, forty-three song titles are indexed by the supplied reference sheet, with deity filtering and source-recorded tempo metadata. Pending companion items remain references rather than invented tracks. This does not hide pages from the main user-selected book, whose original scans are included intact. No audio recording is bundled.
- The permanent folder snapshot contains 52 files in 10 folders. Main summaries use the ABP simplified workbook, selected niyamavali pages, the Telugu puja document, and the meal-prayer document.
- A separate “Sahasranamam puja items” topic contains all 49 rows (A2:B50) from the user-shared “Sahasranamam (ONLY) Pooja Items” sheet, ID `1DWuu49bo5aVFMjJHkKpSlo1WjGlGEX8sybj8F1JqvMk`. Items and quantities appear side by side in a two-column table with checkboxes; source-row labels are not displayed. The inventory additionally includes this external spreadsheet, for 53 files total. English item and quantity text is retained, with Telugu item-name translations; quantities remain in the source's English. Checkmarks last for the visit, including navigation and language changes. Organizer-provided items, local shop recommendations, and contact details are source-specific arrangements to confirm, not app promises. The original ghee-instruction hyperlink from cell A8 is preserved.
- Each source-backed section links its source and exact PDF page or workbook sheet. PDF references count from the PDF's first page, **not the printed page number**. Drive may ignore the PDF page fragment, so the page number is also shown visibly.
- Food-rule disagreements remain explicit: the ABP workbook names onion/garlic, while the niyamavali names ginger/garlic.
- Fourteen files yielded extractable text, three require legacy-font transcription, eight require OCR or image-text review, one large PDF requires Drive download confirmation, and 26 are photo/other references. Extraction is not editorial review; not all content is consolidated.
- These are editorial English/Telugu summaries, not an official temple publication or certified translations. Have a Guruswamy review before formal use. Health and fire-safety reminders are explicitly separated from ritual instructions.
- The main book is reproduced as user-supplied original page scans with separate draft OCR; other-source companion text retains its earlier source/translation disclosures.
- The image is a resized, metadata-free photograph from `SwamyAlankarams\2024\PXL_20240906_011811420.jpg` in the permanent collection (file ID `18wIc7zwk06ckEP9YwotuwGckurKTkxqf`).
- The app is a curated snapshot, not an automatic Drive sync. It has no Google login, analytics, external fonts, or AI API dependency. Daily-puja checkmarks are stored only on the device.

## Refresh the source inventory

To regenerate the main book locally (Python with PyMuPDF and Node with `npm ci`):

```powershell
python .\tools\prepare_book.py --pdf C:\private\selected-book.pdf --ocr C:\private\book-ocr --images .\public\book-pages
node .\tools\read_book.mjs C:\private\book-ocr .\public\book-data.mjs
npm run build
npm test
```

OCR runs locally. The tool downloads the public Telugu recognition model, never uploads book images, and caches recognition results outside the website. Chapter ranges in `public\book.mjs` were checked against all 61 original pages. A new edition or changed page count requires explicit mapping review; the preparation tool refuses non-61-page input. OCR confidence is machine metadata, not a guarantee of correct sacred text.

The optional editorial extraction tool requires Python and PyMuPDF:

```powershell
python -m pip install pymupdf
python .\tools\extract_sources.py --output C:\path\to\private-review-artifacts
```

Keep the output outside `public`. The tool inventories folders, extracts PDFs/Word/spreadsheets, and marks OCR, font, and download-confirmation limitations. A confirmation-required large file is not downloaded automatically. Do not treat raw extracted sacred text as reviewed transcription. Review the resulting inventory before copying `inventory.json` to `public\sources.json`, update summaries/citations in `public\content.mjs`, and rebuild the portable file.

To regenerate the chant readers from the downloaded permanent-source workbooks:

```powershell
python .\tools\prepare_chants.py --input C:\path\to\private-review-artifacts --output .\public\chant-data.mjs
```

This tool reads exact spreadsheet columns and validates all 108 namavali entries, rather than flattening adjacent deity lists together. It intentionally stops if the sharanaghosha count changes and needs review.

## Checks

```powershell
npm run build
npm test
```
