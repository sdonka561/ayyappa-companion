# Ayyappa companion

A mobile-friendly English/Telugu reading guide consolidated from the permanent [Ayyappa collection](https://drive.google.com/drive/folders/1CksLIfctrHaQum3a2GMWF2M-ZbwC4pz0). It is a reading app, not a PDF viewer.

**Live website:** https://sdonka561.github.io/ayyappa-companion/

**Source repository:** https://github.com/sdonka561/ayyappa-companion

## Run

Requires Node.js 20 or later. No npm dependencies or installation step.

```powershell
Set-Location .\ayyappa-guide
npm start
```

Open http://127.0.0.1:4173. Topic, language, search, and section links are addressable in the URL. Preparation checkmarks and text size last for the current visit.

## Share with friends

**Single file:** `npm run build` creates `public\ayyappa-companion.html`. Send that HTML file to friends. It contains the guide, both languages, inventory, styles, and image; desktop browsers can open it directly without a server or internet. Source links still require internet. Mobile messaging apps may not open HTML attachments directly, so a hosted link is more convenient on phones.

**Website:** upload **only the contents of `public`** to a static hosting provider such as Netlify Drop, Cloudflare Pages, or GitHub Pages. `index.html` must be at the published root. There is no server-side application or secret configuration. For a host that requires a build command, use `npm run build` and set the publish directory to `public`. Use the resulting HTTPS address, not the localhost preview address. The app's Share button copies the current topic/language link once hosted.

This app is published on GitHub Pages from the `gh-pages` branch, containing only the website files. The `main` branch contains the source and tools. Do not upload the extraction artifacts or original books. Confirm permission before adding third-party recordings, song lyrics, or other new assets.

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

- Ten guide topics cover daily practice, puja, peetam, food, eating, sleeping, prayers, deeksha, eighteen daily reminders, and pilgrimage preparation. Dedicated Chant & Sing and daily-checklist views sit alongside them.
- Chant & Sing provides a complete, source-numbered 108-name ashtottaram in Telugu, the 107 invocations actually present in the ABP sharanaghosha sheet, a separate 108-repeat sharanam reader, traditional opening prayers, Ayyappa Gayatri, Pancharatna verses, forgiveness prayer, and call/response invocations. List/single-entry views and focus reading work on phones.
- The ABP sharanaghosha sheet is not padded to 108: its source has 107 nonempty invocations. Use the separate refrain counter for 108 repetitions. Prayer text remains Telugu regardless of the guide language; no Roman transliteration is generated or offered. Ganesha, Guru, Ayyappa Gayatri, and the sharanam refrain have separately labeled editorial English meanings for understanding, subject to Guruswamy review. Other readers explicitly state that English translation is not yet available. Tamil material remains accessible through its source references, not invented Telugu or English recitations.
- Morning/evening quick access uses the browser's local time with a manual override. The twelve grouped daily-puja stages save checkmarks in this browser under a local-date key; they reset for a new date. If storage is blocked, the app warns that checkmarks last only for the current visit.
- Forty-three song titles are indexed by the supplied reference sheet, with deity filtering and only source-recorded tempo metadata. Modern lyrics, recordings, Suprabhatam full text, Kavacham, Padi-puja songs, and Harivarasanam audio/full lyrics are **not** represented as complete playable/readable tracks: reuse/recording verification is pending. The source references remain available. No audio recording has been bundled.
- The permanent folder snapshot contains 52 files in 10 folders. Main summaries use the ABP simplified workbook, selected niyamavali pages, the Telugu puja document, and the meal-prayer document.
- Each source-backed section links its source and exact PDF page or workbook sheet. PDF references count from the PDF's first page, **not the printed page number**. Drive may ignore the PDF page fragment, so the page number is also shown visibly.
- Food-rule disagreements remain explicit: the ABP workbook names onion/garlic, while the niyamavali names ginger/garlic.
- Fourteen files yielded extractable text, three require legacy-font transcription, eight require OCR or image-text review, one large PDF requires Drive download confirmation, and 26 are photo/other references. Extraction is not editorial review; not all content is consolidated.
- These are editorial English/Telugu summaries, not an official temple publication or certified translations. Have a Guruswamy review before formal use. Health and fire-safety reminders are explicitly separated from ritual instructions.
- Readable prayer text is traditional liturgical material; modern songs and books are summarized or linked, not reproduced wholesale.
- The image is a resized, metadata-free photograph from `SwamyAlankarams\2024\PXL_20240906_011811420.jpg` in the permanent collection (file ID `18wIc7zwk06ckEP9YwotuwGckurKTkxqf`).
- The app is a curated snapshot, not an automatic Drive sync. It has no Google login, analytics, external fonts, or AI API dependency. Daily-puja checkmarks are stored only on the device.

## Refresh the source inventory

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
