# Ayyappa companion

A document-first mobile reading companion with two selectable versions. **ABP - Simplified version of process guide** opens by default: all nine workbook tabs are organized into 54 internal subsections, preserving separate deity prayers and variants. **Nitya Puja - Original PDF** retains all 61 supplied pages organized into 15 chapter divisions. Previous guides from the permanent [Ayyappa collection](https://drive.google.com/drive/folders/1CksLIfctrHaQum3a2GMWF2M-ZbwC4pz0), typed chant readers, and the items table remain in **Companion sections**.

**Live website:** https://sdonka561.github.io/ayyappa-companion/

**Source repository:** https://github.com/sdonka561/ayyappa-companion

## Run

Requires Node.js 20 or later. Serving, building, and testing need no npm installation; the site has no runtime dependencies. The optional local OCR extraction tool uses the development dependency `tesseract.js` (`npm ci`).

```powershell
Set-Location .\ayyappa-guide
npm start
```

Open http://127.0.0.1:4173. The default landing page is ABP contents. The **Guide version** selector switches between ABP and the PDF; their navigation and readings remain separate. Topic, language, ABP tab/subsection, PDF chapter/page, and search are addressable in the URL. Existing `topic=book` and companion links remain valid. Preparation checkmarks and text size last for the current visit.

ABP routes use `#topic=abp&lang=en&tab=ashtottaram&part=ayyappa-type-1`; Telugu uses `lang=te`. Each original workbook tab has its own contents page. Separate Ganesha, Subramanya, and Ayyappa columns, both Ayyappa Ashtottaram variants, viniyoga/dhyana, individual closing prayers, and Suprabhatam verses are individually selectable. The Sahasranamavali preserves the workbook's supplied English-letter pronunciation paired with Telugu; other Telugu readings use the shared pronunciation helper. Procedure instructions stay in the source's English. This is direct workbook extraction, not OCR; source spellings and numbering gaps remain. Both ABP Ayyappa Ashtottaram variants and Sharanaghosha supply 107 invocations, not 108; no extra invocation is invented.

ABP's Sahasranamavali names reader numbers the 1000 names continuously from 1 to 1000 and separates them into 100 labeled groups of ten (1–10 through 991–1000), in both languages and focus view. Invocation and completion stay separate; no source prayer text or supplied pronunciation is changed. The separately sourced dedicated workbook retains its own 1004-entry numbering and disclosure.

The book reader defaults to **pronunciation in English letters** when English is selected and to the original Telugu scan when Telugu is selected. Its Read as selector offers original scans, draft Telugu OCR, and draft English-letter pronunciation. English does not translate the book's meaning. Pronunciation is generated from **unreviewed OCR** and inherits spelling and column-order errors; do not treat it as verified chanting text. Compare with original scans and confirm with your Guruswamy. `aa`, `ee`, and `oo` denote long vowels; the spelling is only an approximate pronunciation aid. Full-size images support native zoom; Previous/Next links cross chapter boundaries, and focus view removes surrounding navigation. English titles, navigation, guide explanations, and the supplies table remain unchanged.

## Share with friends

**Single file:** `npm run build` creates `public\ayyappa-companion.html`. It includes both guide versions, the complete 451-page bhajan book, original paired Namavali pronunciation, companion content, and styles for offline use (approximately 61 MB). Desktop browsers can open it directly without a server or internet. Source links still require internet. The normal hosted website loads only the current page image, not all book images at once, and is preferable for phone sharing.

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
- Chant & Sing provides the dedicated 108-name Ashtottaram and HariHaraPutra Sahasranamavali with **the source workbooks' own Telugu/English pronunciation columns**, preserving diacritics without generated conversion. The dedicated Sahasranamavali numbers 1–1004, including closing invocations; all are retained. Its entry 633 has English pronunciation but a blank Telugu cell (`B635`), which the reader explicitly marks rather than inventing text. These separate workbooks are not substituted into ABP's different variants or 1000-name tab. List/single-entry views and focus reading work on phones.
- The ABP sharanaghosha sheet is not padded to 108: its source has 107 nonempty invocations. Use the separate refrain counter for 108 repetitions. Other typed English prayer readers use approximate pronunciation generated from Telugu only when no source pronunciation is supplied. Telugu remains original, and earlier editorial English prayer meanings have been removed. Traditional opening prayers, Gayatri, Pancharatna, forgiveness, and response readers remain available.
- **Bhajans · complete book** contains all **252 title entries** from contents pages 1–8 of `Ayyappa_bhajans3.pdf` (`1L7CcFrHsZ_OLO7TAvQ2vziDSGvViDBT_`). Its PDF bookmarks omit 51 titles, so extraction uses all contents hyperlinks and verifies their printed destinations instead. Every title has its full continuation-page range; same-page titles retain separate positions and a jump-to-title marker. Search/filter by title, select any page, use focus view, or open the full-size page to zoom. All 451 pages are preserved as lossless WebP images, including the eight original contents pages. As explicitly selected by the user, these original pages preserve **everything**, including Tamil, English pronunciation, meanings, and author/translator credits; the interface language does not rewrite them. No typed pronunciation-only version or audio is claimed.
- Sabarimala padayatra bhajans uses the user-selected Nitya Puja book (`1EDanwSJyooDryISf5TedJcoKyl_VjJ5Q`), printed page 42, which is physical PDF page 40. Its 19 call/response pairs are transcribed in Telugu script, with source spellings retained, including Tamil-sounding phrases. The original scanned page is available alongside the reader for comparison and zooming, and is embedded in the offline portable edition.
- Morning/evening quick access uses the browser's local time with a manual override. The twelve grouped daily-puja stages save checkmarks in this browser under a local-date key; they reset for a new date. If storage is blocked, the app warns that checkmarks last only for the current visit.
- In the separate companion, forty-three song titles remain indexed by the supplied reference sheet, with deity filtering and source-recorded tempo metadata. Suprabhatam now links to the ABP reader; Kavacham, Padi songs, and Harivarasanam link to their actual original bhajan pages rather than a text-pending notice. No audio recording is bundled.
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

To regenerate ABP tab/subsection data and the complete bhajan library (Python with PyMuPDF and Pillow):

```powershell
python .\tools\prepare_abp.py --input C:\private\ABP.xlsx --output .\public\abp-data.mjs
python .\tools\prepare_bhajans.py --input C:\private\Ayyappa_bhajans3.pdf --output .\public\bhajan-data.mjs --render
npm run build
npm test
```

The ABP extractor rejects reordered/changed tabs and accounts for every non-branding source cell exactly once, including supplied Roman pronunciation and source step numbers. The bhajan extractor rejects a changed page/title count or inconsistent contents destination; it renders at 2.5x resolution with lossless compression. The offline file embeds both sets of page images, while the hosted site requests only the selected image.

## Checks

```powershell
npm run build
npm test
```
