import { topics, topicById, searchTopics, collectionUrl, reviewedDate, sourceUrl } from "./content.mjs";
import { chantTexts } from "./chant-data.mjs";
import { chantCategories, chantDefinitions, pujaRoutine, ritualPhase, ritualDay, websiteBhajans, searchWebsiteBhajans } from "./rituals.mjs";
import { primaryBook, bookChapters, bookPages, resolveBookLocation, chapterForPage, searchBook } from "./book.mjs";
import { pronounceTelugu } from "./pronunciation.mjs";
import { abpTabs, abpSource, abpTabTitle, abpSectionTitle, resolveAbp, searchAbp, sahasranamavaliGroups } from "./abp.mjs";
import { calendarContent, calendarSummary, bindCalendar, startCalendar } from "./calendar.mjs";
import { decryptSchedule, loadScheduleCipher, renderSchedule } from "./schedule.mjs";

const app = document.querySelector("#app");
const state = { inventory: null, inventoryError: null, checked: new Set(), query: "", fontSize: 18, chantId: "", category: "all", readerMode: "list", positions: {}, routine: new Set(), storageWarning: false, phaseOverride: null };
state.bookChapter = "";
state.bookPage = "";
state.bookView = "auto";
state.guide = "abp";
state.abpTab = "";
state.abpPart = "";
state.bhajanSong = "";
state.bhajanPage = "";
state.bhajanCollection = "";
state.scheduleRows = null;
state.scheduleLoading = false;
state.scheduleError = "";
state.scheduleUnlockVersion = 0;
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
let lang = "en";
let active = "abp";
const t = (en, te) => lang === "te" ? te : en;
const text = (value) => value?.[lang] || "";
const sourceOneTitle = abpSource.title;
const sourceTwoTitle = "Source 2: Nitya Puja";
const navigationOpen = new Map();
let navigationPath = "";
const icon = (name) => {
  const paths = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    share: '<path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8"/>',
    arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
    book: '<path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
    lamp: '<path d="M4 14h16c-1 5-4 7-8 7s-7-2-8-7Zm8-4c-5-3 0-6 0-9 4 3 4 7 0 9Z"/>',
    external: '<path d="M14 3h7v7M21 3l-9 9M10 5H4v15h15v-6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
};
const route = (id, extras = {}) => {
  const params = new URLSearchParams({ topic: id, lang, ...extras });
  return `#${params}`;
};
const link = (id, label, className = "") => `<a class="${className}" href="${route(id)}">${label}</a>`;
const statusLabels = () => ({
  "text-extracted": t("Text extracted · not all editorially reviewed", "పాఠ్యం లభించింది · పూర్తి సంపాదకీయ సమీక్ష కాలేదు"),
  "needs-ocr": t("Scan / image text · needs OCR", "స్కాన్ / చిత్ర పాఠ్యం · OCR అవసరం"),
  "needs-font-decoding": t("Legacy font · needs transcription", "పాత ఫాంట్ · లిప్యంతరీకరణ అవసరం"),
  "download-confirmation": t("Large file · download confirmation needed", "పెద్ద ఫైలు · డౌన్‌లోడ్ నిర్ధారణ అవసరం"),
  "extraction-failed": t("Could not extract · review original", "వెలికితీయలేకపోయాం · మూలాన్ని చూడండి"),
  "reference-only": t("Photo / other reference", "చిత్రం / ఇతర ఆధారం"),
});

function readRoute() {
  const params = new URLSearchParams(location.hash.slice(1));
  lang = params.get("lang") === "te" ? "te" : "en";
  active = params.get("topic") || "abp";
  if (active !== "schedule") {
    state.scheduleRows = null;
    state.scheduleLoading = false;
    state.scheduleError = "";
    state.scheduleUnlockVersion++;
  }
  if (active === "abp" || active === "book") state.guide = active;
  state.abpTab = params.get("tab") || "";
  state.abpPart = params.get("part") || "";
  const suprabhatamSection = active === "abp" && state.abpTab === "suprabhatam" && state.abpPart
    ? `outline-suprabhatam-${state.abpPart}` : "";
  if (suprabhatamSection) state.abpPart = "";
  state.bhajanSong = params.get("song") || "";
  state.bhajanPage = params.get("bhajanPage") || "";
  const section = params.get("section") || "";
  state.bhajanCollection = params.get("collection") || (section === "separate-bhajan-book" || section.startsWith("reading-song-") ? "book" : section.startsWith("process-") ? "prayers" : "");
  state.bookChapter = params.get("chapter") || "";
  state.bookPage = params.get("page") || "";
  state.query = params.get("q") || "";
  if (state.query.trim() && active === "schedule") {
    state.scheduleRows = null;
    state.scheduleLoading = false;
    state.scheduleError = "";
    state.scheduleUnlockVersion++;
  }
  state.chantId = params.get("chant") || "";
  state.category = chantCategories.some((category) => category.id === params.get("category")) ? params.get("category") : "all";
  const path = [active, state.abpTab, state.abpPart, state.bookChapter, state.chantId].join("/");
  if (path !== navigationPath) {
    if (active === "abp") {
      navigationOpen.set("source-one", true);
      if (state.abpTab) navigationOpen.set(`tab-${state.abpTab}`, true);
    } else if (active === "book") navigationOpen.set("source-two", true);
    else if (active === "bhajans" || (active === "chanting" && ["ashtottaram", "sahasranamavali"].includes(state.chantId))) navigationOpen.set("library", true);
    else if (active !== "calendar" && active !== "schedule") navigationOpen.set("companion", true);
    navigationPath = path;
  }
  return params.get("section") || suprabhatamSection;
}

function citations(sources) {
  if (!sources.length) return "";
  return `<div class="citations">${sources.map((source) => {
    const pageText = source.sheet ? `${t("Sheet", "షీట్")}: ${source.sheet}` : source.pages.length ? `${t("PDF p.", "PDF పేజీ")} ${source.pages.join(", ")}` : t("Word document", "వర్డ్ పత్రం");
    return `<a href="${sourceUrl(source)}" target="_blank" rel="noopener noreferrer" title="${esc(source.label)}">${icon("book")} ${esc(source.label)} <span>${pageText}</span>${icon("external")}</a>`;
  }).join("")}</div>`;
}

function sectionMarkup(section, topic, headingLevel = 2, number = "", idPrefix = "") {
  const label = section.status === "confirm"
    ? t("Confirm with your Guruswamy", "గురుస్వామితో నిర్ధారించండి")
    : section.status === "editorial" ? t("Editorial guidance", "సంపాదకీయ సూచన") : "";
  const id = `${idPrefix}${section.id}`;
  return `<section class="reading-section" id="${esc(id)}" aria-labelledby="${esc(id)}-heading">
    ${label ? `<p class="section-status">${label}</p>` : ""}
    <h${headingLevel} id="${esc(id)}-heading">${number ? `<span class="outline-number" aria-hidden="true">${number}.</span> ` : ""}${esc(text(section.title))}</h${headingLevel}>
    <div class="outline-children">
    ${section.body ? `<p>${esc(text(section.body))}</p>` : ""}
    ${section.items ? `<${section.ordered ? "ol" : "ul"} class="reading-list">${section.items.map((item) => `<li>${esc(text(item))}</li>`).join("")}</${section.ordered ? "ol" : "ul"}>` : ""}
    ${section.checklist ? `<fieldset class="checklist"><legend>${t("Preparation checklist · stays checked during this visit", "సిద్ధత జాబితా · ఈ సందర్శనలో గుర్తులు నిలుస్తాయి")}</legend>${section.checklist.map((item, index) => {
      const key = `${topic.id}-${section.id}-${index}`;
      return `<label><input type="checkbox" data-check="${key}" ${state.checked.has(key) ? "checked" : ""}><span>${esc(text(item))}</span></label>`;
    }).join("")}</fieldset>` : ""}
    ${section.table ? `<table class="supplies-table"><caption>${t("Preparation checklist · stays checked during this visit", "సిద్ధత జాబితా · ఈ సందర్శనలో గుర్తులు నిలుస్తాయి")}</caption><thead><tr><th scope="col">${t("Item", "వస్తువు")}</th><th scope="col">${t("Quantity / arrangement", "పరిమాణం / ఏర్పాటు")} ${lang === "te" ? "(English)" : ""}</th></tr></thead><tbody>${section.table.map((item, index) => {
      const key = `${topic.id}-${section.id}-${index}`;
      return `<tr><td><label><input type="checkbox" data-check="${key}" ${state.checked.has(key) ? "checked" : ""}><span>${esc(t(item.item, item.telugu))}</span></label></td><td lang="${item.quantity ? "en" : lang}">${esc(item.quantity || t("Not specified in the source", "మూలంలో పరిమాణం ఇవ్వలేదు"))}</td></tr>`;
    }).join("")}</tbody></table>` : ""}
    ${section.verse ? `<figure class="prayer"><blockquote lang="${lang === "en" ? "te-Latn" : "te"}">${esc(lang === "en" ? pronounceTelugu(section.verse.te) : section.verse.te).replaceAll("\n", "<br>")}</blockquote><figcaption>${t("Pronunciation in English letters, not a translation. Confirm with your Guruswamy.", "ఉచ్చారణను గురుస్వామితో నిర్ధారించుకోండి.")}</figcaption></figure>` : ""}
    ${section.note ? `<p class="editorial-note">${esc(text(section.note))}</p>` : ""}
    ${section.externalLinks ? `<div class="external-links">${section.externalLinks.map((item) => `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(text(item.title))}${icon("external")}</a>`).join("")}</div>` : ""}
    ${citations(section.sources)}
    </div>
  </section>`;
}

function renderTopic(topic) {
  const isHome = topic.id === "daily";
  const photo = isHome ? `<figure class="devotional-photo"><img src="ayyappa.jpg" alt="${t("Ayyappa idol adorned in blue cloth, gold ornaments, and flowers", "నీలి వస్త్రం, బంగారు అలంకారాలు, పుష్పాలతో అయ్యప్ప స్వామి")}"><figcaption>${t("From your Ayyappa collection", "మీ అయ్యప్ప సేకరణ నుండి")}</figcaption></figure>` : "";
  return `<div class="topic-intro ${isHome ? "with-photo" : ""}">
    <div><h1 id="page-title">${esc(text(topic.title))}</h1>
    <p class="intro-copy">${esc(text(topic.description))}</p>
    ${isHome ? `<p class="sharanam" lang="te">స్వామియే శరణం అయ్యప్ప</p>` : ""}
    <p class="edition-label">${t("Consolidated reading · English / తెలుగు", "సంక్షిప్త మార్గదర్శి · తెలుగు / English")}</p></div>${photo}
  </div>
  ${isHome ? quickAccess() : ""}
  <div class="editorial-banner">${icon("book")}<p>${t("A reading companion, not a single universal rulebook.", "ఇది పఠన సహచరి; అందరికీ ఒకే నియమావళి కాదు.")} <span>${t("Customs differ. Source details and open questions are kept visible.", "ఆచారాలు భిన్నంగా ఉంటాయి. మూల వివరాలు, నిర్ధారించాల్సిన అంశాలు విడిగా ఉన్నాయి.")}</span></p></div>
  <div class="reading-layout">
    <article class="reading-column">${topic.sections.map((section, index) => sectionMarkup(section, topic, 2, index + 1)).join("")}</article>
    <aside class="on-this-page" aria-label="${t("On this page", "ఈ పేజీలో")}"><h2>${t("On this page", "ఈ పేజీలో")}</h2><nav>${topic.sections.map((section, index) => `<a href="${route(topic.id, { section: section.id })}">${index + 1}. ${esc(text(section.title))}</a>`).join("")}</nav><p>${t("Page references count from the PDF’s first page, not its printed page numbers.", "మూల సూచనలు PDF మొదటి పేజీ నుండి లెక్కించినవి; ముద్రిత పేజీ సంఖ్యలు కావు.")}</p></aside>
  </div>
  <nav class="related" aria-label="${t("Related topics", "సంబంధిత అంశాలు")}"><h2>${t("Keep reading", "ఇంకా చదవండి")}</h2>${topic.related.map((id) => link(id, `<span>${id === "sources" ? t("Source library", "మూలాల సేకరణ") : esc(text(topicById(id).short))}</span>${icon("arrow")}`)).join("")}</nav>`;
}

function pageChildren(start, end, hrefForPage, labelForPage) {
  return `<ol class="page-children" role="list">${Array.from({ length: end - start + 1 }, (_, index) => start + index).map((page) => `<li><a href="${hrefForPage(page)}">${labelForPage(page)}</a></li>`).join("")}</ol>`;
}

function sourceLibrary() {
  return `<div class="topic-intro"><h1 id="page-title">${t("Source library", "మూలాల సేకరణ")}</h1><p class="intro-copy">${t("Your permanent collection, mapped out. Extracted text is not the same as a reviewed summary; scanned and unreadable files remain marked.", "మీ శాశ్వత సేకరణ జాబితా. పాఠ్యం లభించడం అంటే సమీక్షించిన సారాంశం అని కాదు. స్కాన్, చదవలేని ఫైళ్ల స్థితిని విడిగా చూపించాం.")}</p></div>
  <div class="library-summary"><p>${t("This edition consolidates selected readable passages, with page-level citations. The folder also contains photos, songs, spreadsheets, and scanned books that are not fully consolidated.", "ఈ సంచికలో చదవగలిగిన ఎంపిక చేసిన భాగాలకు పేజీ సూచనలతో సారాంశాలు ఉన్నాయి. ఫోల్డర్‌లో ఇంకా పూర్తిగా సంక్షిప్తీకరించని చిత్రాలు, పాటలు, పట్టికలు, స్కాన్ పుస్తకాలు కూడా ఉన్నాయి.")}</p><a href="${collectionUrl}" target="_blank" rel="noopener noreferrer">${t("Open permanent Drive collection", "శాశ్వత డ్రైవ్ సేకరణ తెరవండి")}${icon("external")}</a></div>
  <div id="inventory">${inventoryMarkup()}</div>`;
}

function inventoryMarkup() {
  if (state.inventoryError) return `<div class="error-box" role="alert"><h2>${t("The source list could not load", "మూలాల జాబితా తెరవలేకపోయాం")}</h2><p>${t("Your reading guide is still available. Retry loading the list or open the permanent Drive collection above.", "మార్గదర్శిని చదవవచ్చు. జాబితా కోసం మళ్లీ ప్రయత్నించండి లేదా పై డ్రైవ్ లింకును తెరవండి.")}</p><button data-action="retry">${t("Retry source list", "మళ్లీ ప్రయత్నించండి")}</button></div>`;
  if (!state.inventory) return `<p class="loading" role="status">${t("Loading source inventory…", "మూలాల జాబితా తెరుస్తున్నాం…")}</p>`;
  const files = state.inventory.filter((entry) => entry.kind === "file");
  const groups = [...new Set(files.map((entry) => entry.folder))];
  return `<p class="inventory-count">${files.length} ${t("files inventoried", "ఫైళ్లు జాబితాలో ఉన్నాయి")} · ${t("Snapshot", "సేకరణ తేదీ")} ${reviewedDate}</p><p class="library-help">${t("“Text extracted” only describes technical readability. Follow the citations in the topic pages to see what was actually synthesized.", "“పాఠ్యం లభించింది” అనేది సాంకేతిక స్థితి మాత్రమే. నిజంగా ఏ భాగాలను సంక్షిప్తీకరించామో అంశాల పేజీల్లోని మూల సూచనలు చూడండి.")}</p>
  ${groups.map((group) => `<details class="source-group" ${group.endsWith("PujaGuides") || group === "Ayyappa" ? "open" : ""}><summary>${esc(group.replace("Ayyappa/", ""))}<span>${files.filter((entry) => entry.folder === group).length} ${t("files", "ఫైళ్లు")}</span></summary><ul>${files.filter((entry) => entry.folder === group).map((entry) => `<li><a href="https://drive.google.com/file/d/${encodeURIComponent(entry.id)}/view" target="_blank" rel="noopener noreferrer">${esc(entry.name)}${icon("external")}</a><p class="source-status ${entry.status === "text-extracted" ? "readable" : ""}">${esc(statusLabels()[entry.status] || t("Review needed", "సమీక్ష అవసరం"))}${entry.pages ? ` · ${entry.pages} ${t("PDF pages", "PDF పేజీలు")}` : ""}</p></li>`).join("")}</ul></details>`).join("")}`;
}

function renderSearch() {
  const results = searchTopics(state.query);
  const abpResults = searchAbp(state.query);
  const bhajanMatches = searchWebsiteBhajans(state.query);
  const chapters = searchBook(state.query);
  const words = state.query.trim().toLocaleLowerCase().split(/\s+/);
  const chants = chantDefinitions.filter((entry) => words.every((word) => [entry.id, entry.title.en, entry.title.te, entry.purpose.en, entry.purpose.te].join(" ").toLocaleLowerCase().includes(word)));
  return `<div class="topic-intro"><h1 id="page-title">${t("Find in your guides & bhajans", "మార్గదర్శులు, భజనల్లో వెతకండి")}</h1><p class="intro-copy">${results.length + chants.length + chapters.length + abpResults.length + bhajanMatches.length} ${t("matches for", "ఫలితాలు")} “${esc(state.query)}”</p></div>
  ${bhajanMatches.length ? `<div class="search-results">${bhajanMatches.map(song => `<a href="${route("bhajans", { song: song.id })}"><div><h2 lang="te">${esc(song.title)}</h2><p>${t("Ayyappa Telugu bhajans", "అయ్యప్ప తెలుగు భజనలు")}${song.singer ? ` · ${esc(song.singer)}` : ""}</p></div>${icon("arrow")}</a>`).join("")}</div>` : ""}
  ${abpResults.length ? `<div class="search-results">${abpResults.map(({ tab, section }) => `<a href="${route("abp", { tab: tab.id, part: section.id })}"><div><h2>${esc(abpSectionTitle(tab, section, lang))}</h2><p>Source 1 · ${esc(abpTabTitle(tab, lang))}</p></div>${icon("arrow")}</a>`).join("")}</div>` : ""}
  <p class="reader-language-note">${t("Search covers guide chapters, prayers, and the 38 Ayyappa Telugu songs.", "శోధనలో మార్గదర్శి విభాగాలు, ప్రార్థనలు, అయ్యప్ప తెలుగు పాటలు ఉన్నాయి.")}</p>
  ${results.length || chants.length || chapters.length || abpResults.length || bhajanMatches.length ? `<div class="search-results">${chapters.map((chapter) => `<a href="${route("book", { chapter: chapter.id, page: chapter.matchPage })}"><div><h2>${esc(text(chapter.title))}</h2><p>${t("Nitya Puja PDF", "నిత్యపూజ PDF")} · ${esc(bookRange(chapter))}</p></div>${icon("arrow")}</a>`).join("")}${chants.map((entry) => `<a href="${route("chanting", { chant: entry.id })}"><div><h2>${esc(text(entry.title))}</h2><p>${t("Companion chant", "అదనపు ప్రార్థన")} · ${esc(text(entry.purpose))}</p></div>${icon("arrow")}</a>`).join("")}${results.map((topic) => link(topic.id, `<div><h2>${esc(text(topic.title))}</h2><p>${t("Companion guide", "అదనపు మార్గదర్శి")} · ${esc(text(topic.description))}</p></div>${icon("arrow")}`)).join("")}</div>` : `<div class="empty-state"><h2>${t("No matching section", "సరిపోలే విభాగం లేదు")}</h2><p>${t("Try a tab, prayer, or chapter title.", "ట్యాబ్, ప్రార్థన, విభాగం పేరుతో ప్రయత్నించండి.")}</p><button data-action="clear-search">${t("Show guide contents", "విషయ సూచిక చూపించండి")}</button></div>`}`;
}

function websiteBhajanList() {
  return `<div class="songbook-intro"><h1 id="page-title">${t("Ayyappa Telugu bhajans", "అయ్యప్ప తెలుగు భజనలు")}</h1><p>${t("38 songs from the Ayyappa Telugu list. Open a title to reach its full song page.", "అయ్యప్ప తెలుగు జాబితాలోని 38 పాటలు. పూర్తి పాట పేజీకి వెళ్లడానికి శీర్షికను ఎంచుకోండి.")}</p><div class="songbook-sources"><a href="${route("bhajans", { collection: "prayers" })}">${t("Source 1 prayers & stotras", "Source 1 ప్రార్థనలు, స్తోత్రాలు")}</a></div></div>
  <div class="songbook-tools"><label for="website-song-filter">${t("Find a song or singer", "పాట లేదా గాయకుల పేరు వెతకండి")}</label><input id="website-song-filter" type="search" placeholder="${t("Song title or singer", "పాట పేరు లేదా గాయకుడు")}" autocomplete="off" aria-controls="website-song-list"><p id="website-song-status" role="status">${t("38 songs from Ayyappa Telugu", "అయ్యప్ప తెలుగు నుంచి 38 పాటలు")}</p></div>
  <p class="songbook-notice">${t("Song titles and singer credits follow Ayyappa Telugu. Lyrics stay on that website.", "పాటల శీర్షికలు, గాయకుల వివరాలు అయ్యప్ప తెలుగు నుంచి తీసుకున్నాం. సాహిత్యం ఆ వెబ్‌సైట్‌లోనే ఉంటుంది.")}</p>
  <div id="website-song-list" class="selected-song-list"><ol role="list">${websiteBhajans.map(song => {
    const row = `<span class="songbook-number">${String(song.number).padStart(2, "0")}</span><span class="songbook-song"><span class="songbook-title" lang="te">${esc(song.title)}</span><span class="songbook-singer" lang="te">${esc(song.singer)}</span></span><span class="songbook-open" aria-hidden="true">${icon("arrow")}</span>`;
    return `<li data-website-song="${song.id}" value="${song.number}"><a class="selected-song-row" aria-label="${t("Open song:", "పాట తెరవండి:")} ${esc(song.title)}" href="${route("bhajans", { song: song.id })}">${row}</a></li>`;
  }).join("")}</ol></div>`;
}

function websiteBhajanReader(song) {
  return `<div class="reader-back"><a href="${route("bhajans")}">${t("← Back to the song list", "← పాటల జాబితాకు తిరిగి")}</a></div>
  <article class="songbook-reader">
    <header class="songbook-reader-heading"><h1 id="page-title" lang="te">${esc(song.title)}</h1><p lang="te">${esc(song.singer)}</p></header>
    <p class="songbook-source-note">${t("This song and its lyrics are hosted on Ayyappa Telugu; they are not reproduced here.", "ఈ పాట, సాహిత్యం అయ్యప్ప తెలుగు వెబ్‌సైట్‌లో ఉన్నాయి; ఇక్కడ పునర్ముద్రించలేదు.")}</p>
    <a class="songbook-source-link" href="${esc(song.externalSource.url)}" target="_blank" rel="noopener noreferrer">${t("Open full song on Ayyappa Telugu", "అయ్యప్ప తెలుగులో పూర్తి పాట తెరవండి")} ${icon("external")}</a>
  </article>
  <nav class="book-stepper" aria-label="${t("Song position", "పాటల స్థానం")}"><span>${song.number} / ${websiteBhajans.length}</span></nav>`;
}

  function processGuideReadings() {
    const tabs = abpTabs.filter(tab => tab.sections.some(section => section.kind === "prayer"));
    return `<section aria-labelledby="process-readings-title"><h2 id="process-readings-title">${sourceOneTitle}</h2><p class="reader-language-note">${t("These are the process guide's prayers, stotras, and Namavali. Short readings are complete below. Long Namavali lists show a preview with a link to their full typed reader. English mode uses pronunciation, not meanings.", "ఇవి ప్రక్రియ మార్గదర్శిలోని ప్రార్థనలు, స్తోత్రాలు, నామావళి. చిన్న పఠనాలు పూర్తిగా కింద ఉన్నాయి. పెద్ద నామావళి జాబితాలకు నమూనా, పూర్తి పఠన లింకు ఉన్నాయి. Englishలో ఉచ్చారణ మాత్రమే, అర్థాలు కావు.")}</p><nav class="outline-jumps" aria-label="${t("Prayer groups", "ప్రార్థనల సమూహాలు")}">${tabs.map(tab => `<a href="${route("bhajans", { section: `process-${tab.id}` })}">${esc(abpTabTitle(tab, lang))}</a>`).join("")}</nav>${tabs.map(tab => `<section class="reading-section" id="process-${tab.id}"><h2>${esc(abpTabTitle(tab, lang))}</h2>${abpSectionOutline(tab, 3)}</section>`).join("")}</section>`;
  }

  function bhajansContent() {
    if (state.bhajanSong) {
      if (state.bhajanSong.startsWith("site-")) {
        const song = websiteBhajans.find(entry => entry.id === state.bhajanSong);
        return song
          ? websiteBhajanReader(song)
          : `<div class="empty-state"><h1 id="page-title">${t("Song not found", "పాట లభించలేదు")}</h1>${link("bhajans", t("Back to the song list", "పాటల జాబితాకు తిరిగి"), "button")}</div>`;
      }
      return `<div class="empty-state"><h1 id="page-title">${t("This older song entry is no longer included", "ఈ పాత పాట నమోదు ఇక ఇక్కడ లేదు")}</h1><p>${t("The current list contains the 38 songs from Ayyappa Telugu.", "ప్రస్తుత జాబితాలో అయ్యప్ప తెలుగు నుంచి 38 పాటలు ఉన్నాయి.")}</p>${link("bhajans", t("Back to the song list", "పాటల జాబితాకు తిరిగి"), "button")}</div>`;
    }
    if (state.bhajanPage) return `<div class="empty-state"><h1 id="page-title">${t("This bhajan archive is no longer included", "ఈ భజనల సేకరణ ఇక ఇక్కడ లేదు")}</h1>${link("bhajans", t("Back to our songbook", "మన భజనల పుస్తకానికి తిరిగి"), "button")}</div>`;
    if (state.bhajanCollection === "prayers") return `<div class="reader-back">${link("bhajans", t("← Our songbook", "← మన భజనల పుస్తకం"))}</div><h1 id="page-title">${t("Source 1 prayers & stotras", "Source 1 ప్రార్థనలు, స్తోత్రాలు")}</h1>${processGuideReadings()}`;
    if (state.bhajanCollection === "book") return `<div class="empty-state"><h1 id="page-title">${t("This bhajan archive is no longer included", "ఈ భజనల సేకరణ ఇక ఇక్కడ లేదు")}</h1><p>${t("The old archive link has been removed. The Ayyappa Telugu song list remains available.", "పాత సేకరణ లింకును తొలగించాం. అయ్యప్ప తెలుగు పాటల జాబితా అందుబాటులో ఉంది.")}</p>${link("bhajans", t("Back to the song list", "పాటల జాబితాకు తిరిగి"), "button")}</div>`;
    return websiteBhajanList();
  }

function renderAbpLine(line, number = line.number) {
  const sourceIsTelugu = /[ఀ-౿]/.test(line.text);
  const value = lang === "en" && sourceIsTelugu ? line.pronunciation || pronounceTelugu(line.text) : line.text;
  const language = sourceIsTelugu ? (lang === "en" ? "te-Latn" : "te") : "en";
  return `<p lang="${language}">${number ? `<span class="abp-step-number">${esc(number)}.</span> ` : ""}${esc(value).replaceAll("\n", "<br>")}</p>`;
}

function abpSectionOutline(tab, headingLevel = 2) {
  return `<ol class="reading-outline abp-outline" role="list">${tab.sections.map((part, index) => {
    const full = part.kind === "guide" || part.lines.length <= 30;
    const visibleLines = full ? part.lines : part.lines.slice(0, 3);
    const isSahasraNames = tab.id === "sahasranamavali" && part.id === "names";
    const countNote = tab.id === "sharanaghosha" || (tab.id === "ashtottaram" && part.id.startsWith("ayyappa-type"))
      ? `<p class="outline-note">${t("Source count: 107 invocations, preserved without adding a 108th.", "మూలంలో 107 నామాలు; లేని 108వ నామాన్ని జోడించలేదు.")}</p>` : "";
    return `<li><section aria-labelledby="outline-${tab.id}-${part.id}"><h${headingLevel} id="outline-${tab.id}-${part.id}" tabindex="-1"><span class="outline-number" aria-hidden="true">${index + 1}.</span> ${esc(abpSectionTitle(tab, part, lang))}</h${headingLevel}><div class="outline-children"><div class="inline-reading ${part.kind === "prayer" ? "inline-prayer" : ""}">${visibleLines.map((line, lineIndex) => renderAbpLine(line, isSahasraNames ? lineIndex + 1 : line.number)).join("")}</div>${!full ? `<p class="outline-note">${t(`Showing the first 3 of ${part.lines.length} source lines.`, `మూలంలోని ${part.lines.length} పంక్తులలో మొదటి 3 ఇక్కడ ఉన్నాయి.`)}</p>` : ""}${countNote}${isSahasraNames ? `<p class="outline-note">${t("The complete reader numbers all 1000 names in groups of ten.", "పూర్తి పఠనంలో 1000 నామాలు పది చొప్పున సంఖ్యలతో ఉన్నాయి.")}</p>` : ""}${tab.id === "suprabhatam" ? "" : `<a class="outline-reading-link" href="${route("abp", { tab: tab.id, part: part.id })}">${full ? t("Open separate reader", "ప్రత్యేక పఠనం తెరవండి") : t("Read the complete list", "పూర్తి జాబితా చదవండి")}${icon("arrow")}</a>`}</div></section></li>`;
  }).join("")}</ol>`;
}

function abpContent() {
  if (!state.abpTab && !state.abpPart) {
    return `<div class="topic-intro with-photo"><div><h1 id="page-title">${sourceOneTitle}</h1><p class="intro-copy">${t("Read the numbered sections and their indented steps below. Short prayers and procedures are already visible; long lists have previews and links to complete reading.", "సంఖ్యలతో ఉన్న విభాగాలు, వాటి కింద పూజా దశలు నేరుగా చదవండి. చిన్న ప్రార్థనలు, విధానాలు ఇక్కడే ఉన్నాయి; పెద్ద జాబితాలకు నమూనా, పూర్తి పఠన లింకులు ఉన్నాయి.")}</p><div class="book-start"><a class="button" href="${route("abp", { tab: "sequence" })}">${t("Follow the puja sequence", "పూజా క్రమం చూడండి")}${icon("arrow")}</a><a href="${route("abp", { tab: "maladharana" })}">${t("Maladharana & peetham setup", "మాలధారణ, పీఠం ఏర్పాటు")}</a></div></div><figure class="devotional-photo"><img src="ayyappa.jpg" alt="${t("Ayyappa from your collection", "మీ సేకరణలో అయ్యప్ప స్వామి")}"></figure></div>
    <p class="reader-language-note">${t("Nine original tabs, with their internal sections identified. Prayer text is extracted directly from the workbook, not OCR. English prayer reading uses supplied pronunciation where available, otherwise approximate pronunciation generated from Telugu; it is not translated meaning. Procedure instructions stay in the source’s English. Confirm customs and pronunciation with your Guruswamy; follow appropriate health and fire-safety precautions.", "అసలు తొమ్మిది ట్యాబ్‌లలోని ఉపవిభాగాలు వేరు చేశాం. పాఠ్యం వర్క్‌బుక్ నుంచి తీసుకున్నది; OCR కాదు. English పఠనం మూలంలో ఉన్న ఉచ్చారణ లేదా తెలుగు నుంచి రూపొందించిన ఉచ్చారణ; అర్థానువాదం కాదు. సూచనలు మూలంలోని Englishలోనే ఉన్నాయి. గురుస్వామితో నిర్ధారించండి; ఆరోగ్య, అగ్ని జాగ్రత్తలు పాటించండి.")}</p>
    <nav class="outline-jumps" aria-label="${t("Jump to a workbook tab", "వర్క్‌బుక్ ట్యాబ్‌కు వెళ్లండి")}">${abpTabs.map((tab, index) => `<a href="${route("abp", { section: `tab-${tab.id}` })}">${index + 1}. ${esc(abpTabTitle(tab, lang))}</a>`).join("")}</nav><ol class="reading-outline" role="list">${abpTabs.map((tab, index) => `<li><section class="reading-section" id="tab-${tab.id}" aria-labelledby="tab-${tab.id}-title"><h2 id="tab-${tab.id}-title"><span class="outline-number" aria-hidden="true">${index + 1}.</span> ${esc(abpTabTitle(tab, lang))}</h2><div class="outline-children">${abpSectionOutline(tab, 3)}</div></section></li>`).join("")}</ol><p class="book-source"><a href="${abpSource.url}" target="_blank" rel="noopener noreferrer">${t("Open original Source 1 workbook", "అసలు Source 1 వర్క్‌బుక్ తెరవండి")}${icon("external")}</a></p>`;
  }
  const resolved = resolveAbp(state.abpTab, state.abpPart);
  if (!resolved) return `<div class="empty-state"><h1 id="page-title">${t("Source 1 tab or subsection not found", "Source 1 ట్యాబ్ లేదా ఉపవిభాగం లభించలేదు")}</h1>${link("abp", t("Choose an Source 1 tab", "Source 1 ట్యాబ్ ఎంచుకోండి"), "button")}</div>`;
  const { tab, section } = resolved;
  if (tab.id === "suprabhatam") return `<div class="reader-back">${link("abp", t("← Source 1 contents", "← Source 1 విషయ సూచిక"))}<button data-action="focus">${document.body.classList.contains("focus-reading") ? t("Exit focus view", "సాధారణ వీక్షణ") : t("Focus view", "ఏకాగ్ర పఠనం")}</button></div><div class="topic-intro"><h1 id="page-title">${esc(abpTabTitle(tab, lang))}</h1><p class="intro-copy">${t("Read the opening prayer, all 14 verses, and closing prayer together on this page.", "ప్రారంభ ప్రార్థన, మొత్తం 14 శ్లోకాలు, ముగింపు ప్రార్థనను ఒకే పేజీలో చదవండి.")}</p></div><p class="reader-language-note">${t("Prayer text retains the workbook's Telugu or supplied English pronunciation, not meaning translations.", "మూలంలోని తెలుగు లేదా అందించిన English ఉచ్చారణను ఉంచాం; అర్థానువాదం కాదు.")}</p>${abpSectionOutline(tab)}<p class="book-source"><a href="${abpSource.url}" target="_blank" rel="noopener noreferrer">${t("Original Source 1 workbook", "అసలు Source 1 వర్క్‌బుక్")}${icon("external")}</a></p>`;
  if (!section) return `<div class="reader-back">${link("abp", t("← Source 1 contents", "← Source 1 విషయ సూచిక"))}</div><div class="topic-intro"><h1 id="page-title">${esc(abpTabTitle(tab, lang))}</h1><p class="intro-copy">${t("Read each section and its steps directly below. Separate deity prayers stay separate; long lists show a preview and a complete-reading link.", "ప్రతి విభాగం, దాని దశలను కిందే చదవండి. దేవతల ప్రార్థనలు వేర్వేరుగానే ఉన్నాయి; పెద్ద జాబితాలకు నమూనా, పూర్తి పఠన లింకులు ఉన్నాయి.")}</p></div><p class="reader-language-note">${t("Procedure instructions retain the source’s English. Prayer text uses Telugu or English-letter pronunciation, not translated meanings. Confirm source customs and pronunciation with your Guruswamy; use appropriate health and fire-safety precautions.", "విధాన సూచనలు మూలంలోని Englishలోనే ఉన్నాయి. ప్రార్థనలకు తెలుగు లేదా English ఉచ్చారణ; అర్థానువాదం కాదు. గురుస్వామితో నిర్ధారించండి; ఆరోగ్య, అగ్ని జాగ్రత్తలు పాటించండి.")}</p>${abpSectionOutline(tab)}`;
  const index = tab.sections.indexOf(section);
  const stepLink = (offset, label) => {
    const next = tab.sections[index + offset];
    return next ? `<a href="${route("abp", { tab: tab.id, part: next.id })}">${label}</a>` : `<span aria-disabled="true">${label}</span>`;
  };
  const stepper = `<nav class="book-stepper" aria-label="${t("Subsection navigation", "ఉపవిభాగాల మార్పు")}">${stepLink(-1, t("← Previous section", "← ముందు విభాగం"))}<span>${index + 1} / ${tab.sections.length}</span>${stepLink(1, t("Next section →", "తర్వాతి విభాగం →"))}</nav>`;
  const sourcePronunciation = section.lines.some((line) => line.pronunciation);
  const isSahasraNames = tab.id === "sahasranamavali" && section.id === "names";
  const reading = isSahasraNames ? sahasranamavaliGroups().map((group) => `<section class="namavali-group" aria-labelledby="names-${group.start}"><h2 id="names-${group.start}">${t("Names", "నామాలు")} ${group.start}–${group.end}</h2>${group.lines.map((line, index) => renderAbpLine(line, group.start + index)).join("")}</section>`).join("") : section.lines.map((line) => renderAbpLine(line)).join("");
  return `<div class="reader-back"><a href="${route("abp", { tab: tab.id })}">← ${esc(abpTabTitle(tab, lang))}</a><button data-action="focus">${document.body.classList.contains("focus-reading") ? t("Exit focus view", "సాధారణ వీక్షణ") : t("Focus view", "ఏకాగ్ర పఠనం")}</button></div><div class="topic-intro"><h1 id="page-title">${esc(abpSectionTitle(tab, section, lang))}</h1></div>
  <div class="book-controls"><label>${t("Workbook tab", "వర్క్‌బుక్ ట్యాబ్")}<select id="abp-tab">${abpTabs.map((entry) => `<option value="${entry.id}" ${entry.id === tab.id ? "selected" : ""}>${esc(abpTabTitle(entry, lang))}</option>`).join("")}</select></label><label>${t("Subsection", "ఉపవిభాగం")}<select id="abp-part">${tab.sections.map((part) => `<option value="${part.id}" ${part === section ? "selected" : ""}>${esc(abpSectionTitle(tab, part, lang))}</option>`).join("")}</select></label></div>
  <p class="reader-language-note">${section.kind === "guide" ? t("Procedure instructions are retained in the workbook’s English. These are source-specific customs, not medical advice. Follow your Guruswamy and appropriate health and fire-safety precautions.", "విధాన సూచనలు మూలంలోని Englishలోనే ఉన్నాయి. ఇవి మూలంలోని ఆచారాలు; వైద్య సలహా కాదు. గురుస్వామి సూచనలు, ఆరోగ్య, అగ్ని జాగ్రత్తలు పాటించండి.") : t(`${sourcePronunciation ? "English pronunciation is supplied by the workbook." : "English pronunciation is generated from the workbook’s Telugu."} This is pronunciation, not translated meaning. aa, ee, oo mark long vowels. Source spellings are retained; confirm pronunciation with your Guruswamy.`, "English పఠనం ఉచ్చారణ మాత్రమే; అర్థానువాదం కాదు. మూలంలోని తెలుగు అలాగే ఉంది. ఉచ్చారణను గురుస్వామితో నిర్ధారించుకోండి.")}</p>
  ${tab.id === "sharanaghosha" || (tab.id === "ashtottaram" && section.id.startsWith("ayyappa-type")) ? `<p class="reader-notice">${t("This source supplies 107 invocations in this list. It is preserved as supplied, without inventing a missing 108th entry.", "ఈ మూల జాబితాలో 107 నామాలు ఉన్నాయి. లేని 108వ అంశాన్ని కల్పించకుండా మూలాన్ని అలాగే ఉంచాం.")}</p>` : ""}
  ${isSahasraNames ? `<p class="reader-notice">${t("Sahasra means 1000: all 1000 names are numbered below in 100 groups of ten. Invocation and completion prayers remain separate.", "సహస్రం అంటే 1000: మొత్తం 1000 నామాలను పది చొప్పున 100 సమూహాలుగా సంఖ్యలతో ఉంచాం. ప్రారంభ, ముగింపు ప్రార్థనలు వేరుగా ఉన్నాయి.")}</p>` : ""}
  ${stepper}<article class="abp-reading ${section.kind === "prayer" ? "abp-prayer" : ""}" aria-label="${esc(abpSectionTitle(tab, section, lang))}">${reading}</article>${stepper}<p class="book-source"><a href="${abpSource.url}" target="_blank" rel="noopener noreferrer">${t("Original Source 1 workbook", "అసలు Source 1 వర్క్‌బుక్")} · ${esc(abpTabTitle(tab, lang))}${icon("external")}</a></p>`;
}

function bookRange(chapter) {
  if (chapter.start === 1) return t("Cover", "ముఖచిత్రం");
  const range = chapter.start === chapter.end ? chapter.start + 2 : `${chapter.start + 2}–${chapter.end + 2}`;
  return `${t("Printed p.", "ముద్రిత పేజీలు")} ${range}`;
}

function bookOutline() {
  return `<ol class="reading-outline book-outline" role="list">${bookChapters.filter((chapter) => chapter.id !== "cover").map((chapter, index) => `<li><section><h3><span class="outline-number" aria-hidden="true">${index + 1}.</span> ${esc(text(chapter.title))}</h3><div class="outline-children">${lang === "en" ? `<p lang="te">${esc(chapter.title.te)}</p><p>${esc(chapter.description)}</p>` : ""}${pageChildren(chapter.start, chapter.end, (page) => route("book", { chapter: chapter.id, page }), (page) => `${t("Printed page", "ముద్రిత పేజీ")} ${page + 2}`)}</div></section></li>`).join("")}</ol>`;
}

function bookHome() {
  return `<section class="book-intro"><div><h1 id="page-title">${sourceTwoTitle}</h1><p lang="te">${esc(primaryBook.title.te)}</p><p class="book-subtitle">${t("Your Nitya Puja book, organized for reading.", "మీ నిత్యపూజ పుస్తకం — విభాగాలవారీగా చదవండి.")}</p><p>${t("Begin with a prayer, follow the puja sequence, or open a bhajan. This main guide follows only the document you selected, in its printed order.", "ప్రార్థనతో ప్రారంభించండి, పూజా క్రమాన్ని అనుసరించండి లేదా భజన తెరవండి. ప్రధాన మార్గదర్శి మీరు ఎంచుకున్న ఒక్క పుస్తకాన్నే, ముద్రిత క్రమంలో అనుసరిస్తుంది.")}</p><div class="book-start"><a class="button" href="${route("book", { chapter: "opening" })}">${t("Begin puja", "పూజ ప్రారంభించండి")}${icon("arrow")}</a><a href="${route("book", { chapter: "vows" })}">${t("Read deeksha rules", "వ్రత నియమాలు చదవండి")}</a></div></div><a class="book-cover" href="${route("book", { chapter: "cover" })}"><img src="${esc(bookPages[0].image)}" alt="${t("Cover of the supplied Sri Ayyappa Swami Nitya Puja Vidhanam", "అందించిన శ్రీ అయ్యప్పస్వామి నిత్యపూజా విధానం ముఖచిత్రం")}" width="300" height="425"></a></section>
  <section class="book-contents" aria-labelledby="contents-heading"><div class="book-section-heading"><h2 id="contents-heading">${t("Read the book", "పుస్తకం చదవండి")}</h2><a href="${primaryBook.url}" target="_blank" rel="noopener noreferrer">${t("Original document", "అసలు పుస్తకం")}${icon("external")}</a></div><p class="reader-language-note">${t("All 61 supplied PDF pages are included. English reading gives Telugu pronunciation in English letters, not meanings. Telugu reading starts with original scans. Book pronunciation is generated from unreviewed OCR; compare with the scan before chanting.", "All 61 pages. English = Telugu pronunciation (draft), not meaning. Telugu = original scan. Compare the scan before chanting.")}</p>${bookOutline()}</section>
  <section class="companion-link"><h2>${t("Your other material is still here", "ఇతర సమాచారం ఇక్కడే ఉంది")}</h2><p>${t("The daily checklist, typed chant readers, Sahasranamam items table, and earlier guides remain separate, with their own sources. They are not presented as pages from this book.", "నిత్యపూజ జాబితా, టైప్ చేసిన ప్రార్థనలు, సహస్రనామ సామగ్రి పట్టిక, పాత మార్గదర్శులు తమ మూలాలతో విడిగా ఉన్నాయి. వాటిని ఈ పుస్తకంలోని పేజీలుగా చూపించలేదు.")}</p>${link("companion", t("Open companion sections", "అదనపు విభాగాలు తెరవండి"), "button")}</section>`;
}

function companionChildren(entry) {
  if (entry.id === "chanting") return `<ol class="outline-links">${chantDefinitions.map((chant) => `<li>${chantLink(chant.id, text(chant.title))}</li>`).join("")}</ol>`;
  if (entry.id === "routine") return `<ol class="reading-list">${pujaRoutine.map((step) => `<li>${esc(text(step))}</li>`).join("")}</ol>${link("routine", t("Open the saved daily checklist", "నిల్వచేసే నిత్యపూజ జాబితా తెరవండి"), "outline-reading-link")}`;
  return entry.sections.map((section, index) => {
    if (section.table || section.items?.length > 30) return `<section class="reading-section"><h3><span class="outline-number" aria-hidden="true">${index + 1}.</span> ${esc(text(section.title))}</h3>${section.body ? `<p>${esc(text(section.body))}</p>` : ""}<p class="outline-note">${section.table ? `${section.table.length} ${t("items with quantities in a side-by-side table.", "సామగ్రి, పరిమాణాలు పక్కపక్కన పట్టికలో ఉన్నాయి.")}` : `${section.items.length} ${t("source-listed entries.", "మూల జాబితా అంశాలు.")}`}</p><a class="outline-reading-link" href="${route(entry.id, { section: section.id })}">${t("Open complete checklist", "పూర్తి జాబితా తెరవండి")}${icon("arrow")}</a></section>`;
    return sectionMarkup(section, entry, 3, index + 1, `${entry.id}-`);
  }).join("");
}

function companionHome() {
  const entries = [
    { id: "chanting", title: { en: "Chant & sing", te: "జపం, భజన" }, description: { en: "Typed Telugu readers and the earlier song index.", te: "టైప్ చేసిన తెలుగు పఠనాలు, పాత పాటల సూచిక." } },
    { id: "routine", title: { en: "Daily puja checklist", te: "నిత్యపూజ జాబితా" }, description: { en: "Your saved daily checklist based on the Source 1 workbook.", te: "Source 1 వర్క్‌బుక్ ఆధారంగా నిల్వచేసే నిత్యపూజ జాబితా." } },
    ...topics,
  ];
  return `<div class="topic-intro"><h1 id="page-title">${t("Companion sections", "అదనపు విభాగాలు")}</h1><p class="intro-copy">${t("Your previous guides, chants, and lists are preserved here. These use the earlier collection and the separately shared spreadsheet, not only the main Nitya Puja book.", "మీ పాత మార్గదర్శులు, ప్రార్థనలు, జాబితాలు ఇక్కడ ఉన్నాయి. ఇవి ప్రధాన నిత్యపూజ పుస్తకం మాత్రమే కాకుండా పాత సేకరణ, విడిగా పంచుకున్న స్ప్రెడ్‌షీట్ ఆధారంగా ఉన్నాయి.")}</p></div><nav class="outline-jumps" aria-label="${t("Jump to a companion topic", "అదనపు అంశానికి వెళ్లండి")}">${entries.map((entry, index) => `<a href="${route("companion", { section: `companion-${entry.id}` })}">${index + 1}. ${esc(text(entry.title))}</a>`).join("")}</nav><ol class="reading-outline companion-outline" role="list">${entries.map((entry, index) => `<li><section class="reading-section" id="companion-${entry.id}" aria-labelledby="companion-${entry.id}-heading"><h2 id="companion-${entry.id}-heading"><span class="outline-number" aria-hidden="true">${index + 1}.</span> ${esc(text(entry.title))}</h2><p>${esc(text(entry.description))}</p><div class="outline-children">${companionChildren(entry)}</div><a class="outline-reading-link" href="${route(entry.id)}">${t("Open this section separately", "ఈ విభాగాన్ని ప్రత్యేకంగా తెరవండి")}${icon("arrow")}</a></section></li>`).join("")}<li><section><h2><span class="outline-number" aria-hidden="true">${entries.length + 1}.</span> ${t("Source library", "మూలాల సేకరణ")}</h2><div class="outline-children"><p>${t("The earlier collection and additional items sheet.", "పాత సేకరణ, అదనపు సామగ్రి షీట్.")}</p>${link("sources", t("Browse original sources", "అసలు మూలాలు చూడండి"), "outline-reading-link")}</div></section></li></ol>`;
}

function bookPageLink(page, label) {
  const chapter = chapterForPage(page);
  return chapter ? `<a href="${route("book", { chapter: chapter.id, page })}">${label}</a>` : `<span aria-disabled="true">${label}</span>`;
}

function bookReader() {
  const location = resolveBookLocation(state.bookChapter, state.bookPage);
  if (!location) return `<div class="empty-state"><h1 id="page-title">${t("Book section or page not found", "పుస్తక విభాగం లేదా పేజీ లభించలేదు")}</h1><p>${t("Choose a section from the book contents.", "పుస్తక విషయ సూచిక నుంచి విభాగాన్ని ఎంచుకోండి.")}</p>${link("book", t("Book contents", "విషయ సూచిక"), "button")}</div>`;
  const { chapter, page } = location;
  const view = state.bookView === "auto" ? (lang === "en" ? "pronunciation" : "original") : state.bookView;
  const original = view === "original" || page.page === 1;
  return `<div class="reader-back">${link("book", t("← Book contents", "← విషయ సూచిక"))}<button data-action="focus">${document.body.classList.contains("focus-reading") ? t("Exit focus view", "సాధారణ వీక్షణ") : t("Focus view", "ఏకాగ్ర పఠనం")}</button></div><div class="topic-intro book-reader-intro"><h1 id="page-title">${esc(text(chapter.title))}</h1>${lang === "en" ? `<p class="book-telugu-title" lang="te">${esc(chapter.title.te)}</p>` : ""}<p class="reader-language-note">${t("The original Telugu book—not the companion’s other-source version.", "ఇది అసలు తెలుగు పుస్తకం; అదనపు విభాగాల ఇతర మూలాల పాఠ్యం కాదు.")}</p></div>
  <div class="book-controls"><label>${t("Chapter", "విభాగం")}<select id="book-chapter">${bookChapters.map((entry) => `<option value="${entry.id}" ${chapter.id === entry.id ? "selected" : ""}>${esc(text(entry.title))}</option>`).join("")}</select></label><label>${t("Page in this chapter", "ఈ విభాగంలో పేజీ")}<select id="book-page">${bookPages.slice(chapter.start - 1, chapter.end).map((entry) => `<option value="${entry.page}" ${page.page === entry.page ? "selected" : ""}>${entry.printed ? `${t("Printed p.", "ముద్రిత పేజీ")} ${entry.printed}` : t("Cover", "ముఖచిత్రం")}</option>`).join("")}</select></label>${page.page !== 1 ? `<label>${t("Read as", "పఠన రూపం")}<select id="book-view"><option value="original" ${original ? "selected" : ""}>${t("Original Telugu", "అసలు తెలుగు")}</option><option value="pronunciation" ${view === "pronunciation" ? "selected" : ""}>Pronunciation in English letters (draft)</option><option value="draft" ${view === "draft" ? "selected" : ""}>${t("Text · unreviewed draft", "పాఠ్యం · సమీక్షించని ముసాయిదా")}</option></select></label>` : ""}</div>
  ${!original ? `<div class="reader-notice" role="note"><strong>${t("Unreviewed OCR draft—not verified chanting text", "సమీక్షించని OCR ముసాయిదా — నిర్ధారించిన జప పాఠ్యం కాదు")}</strong><p>${t("Pronunciation in English letters is transliteration, not translation. It inherits OCR spelling and ordering errors, especially in mantras and two-column lists. Compare with Original Telugu and confirm with your Guruswamy. aa, ee, and oo indicate long vowels; spelling cannot represent every sound exactly.", "English-letter pronunciation is an OCR draft, not translation. Compare Original Telugu; confirm with your Guruswamy. aa, ee, oo = long vowels.")}</p></div>` : `<p class="reader-language-note">${t("Read the scan as supplied. Tap the page to open it full-size and pinch to zoom. Text-size buttons apply to typed text, not the scan.", "అందించిన అసలు స్కాన్ చదవండి. పూర్తి పరిమాణంలో తెరవడానికి పేజీని నొక్కి, వేళ్లతో పెద్దగా చూడండి. అక్షర పరిమాణ బటన్లు టైప్ చేసిన పాఠ్యానికే, స్కాన్‌కు కాదు.")}</p>`}
  <figure class="book-page"><figcaption id="book-page-label">${page.printed ? `${t("Printed page", "ముద్రిత పేజీ")} ${page.printed} · ` : ""}${t("PDF page", "PDF పేజీ")} ${page.page} / ${bookPages.length}</figcaption>${original ? `<a href="${esc(page.image)}" target="_blank" rel="noopener noreferrer"><img id="book-page-image" src="${esc(page.image)}" alt="${esc(text(chapter.title))} — ${t("original Telugu page", "అసలు తెలుగు పేజీ")} ${page.printed || t("cover", "ముఖచిత్రం")}" aria-describedby="book-page-label"></a><p id="book-image-error" role="alert" hidden>${t("This page image could not load. Reload the page or open the original document below.", "పేజీ చిత్రం తెరవలేకపోయాం. పేజీని మళ్లీ లోడ్ చేయండి లేదా కింద అసలు పుస్తకం తెరవండి.")}</p>` : `<div class="book-draft" lang="${view === "pronunciation" ? "te-Latn" : "te"}">${esc(view === "pronunciation" ? pronounceTelugu(page.text) : page.text)}</div>`}</figure>
  <nav class="book-stepper" aria-label="${t("Book page navigation", "పుస్తక పేజీల మార్పు")}">${bookPageLink(page.page - 1, t("← Previous page", "← ముందు పేజీ"))}<span>${page.printed ? `${t("Printed p.", "ముద్రిత పేజీ")} ${page.printed}` : t("Cover", "ముఖచిత్రం")}</span>${bookPageLink(page.page + 1, t("Next page →", "తర్వాతి పేజీ →"))}</nav><p class="book-source"><a href="${primaryBook.url}#page=${page.page}" target="_blank" rel="noopener noreferrer">${t("Open this page in the original document", "అసలు పుస్తకంలో ఈ పేజీ తెరవండి")}${icon("external")}</a></p>`;
}

function mainContent() {
  if (active === "bhajans" || active === "schedule") return guideContent();
  return `${active === "calendar" ? "" : calendarSummary(lang)}<div class="guide-picker"><label for="guide-version">${t("Guide source", "మార్గదర్శి మూలం")}</label><select id="guide-version"><option value="abp" ${state.guide === "abp" ? "selected" : ""}>${sourceOneTitle}</option><option value="book" ${state.guide === "book" ? "selected" : ""}>${sourceTwoTitle}</option></select></div>${guideContent()}`;
}

function guideContent() {
  if (state.query.trim()) return renderSearch();
  if (active === "schedule") return renderSchedule(lang, state.scheduleRows, { loading: state.scheduleLoading, error: state.scheduleError });
  if (active === "calendar") return calendarContent(lang);
  if (active === "bhajans") return bhajansContent();
  if (active === "abp") return abpContent();
  if (active === "book") return state.bookChapter ? bookReader() : bookHome();
  if (active === "companion") return companionHome();
  if (active === "chanting") return state.chantId ? chantReader() : chantingLibrary();
  if (active === "routine") return routinePage();
  if (active === "sources") return sourceLibrary();
  const topic = topicById(active);
  if (topic) return renderTopic(topic);
  return `<div class="empty-state"><h1 id="page-title">${t("This topic is not in the guide", "ఈ అంశం మార్గదర్శిలో లేదు")}</h1><p>${t("The link may be incomplete. Choose a topic from the navigation.", "లింకు అసంపూర్ణంగా ఉండవచ్చు. నావిగేషన్‌లోని అంశాన్ని ఎంచుకోండి.")}</p>${link("daily", t("Open daily practice", "నిత్య ఆచరణ తెరవండి"), "button")}</div>`;
}

function navigationBranch(id, label, href, children, current = "") {
  const open = navigationOpen.get(id) === true;
  const target = `navigation-${id}`;
  return `<li class="nav-branch"><div class="nav-branch-heading">${href ? `<a class="nav-parent" href="${href}" ${current}>${esc(label)}</a>` : `<span class="nav-parent">${esc(label)}</span>`}<button type="button" class="nav-toggle" data-nav-toggle="${id}" aria-expanded="${open}" aria-controls="${target}" aria-label="${esc(label)}"><span aria-hidden="true">›</span></button></div><ul id="${target}" ${open ? "" : "hidden"}>${children}</ul></li>`;
}

function calendarNavigation() {
  return `<li><a class="nav-parent" href="${route("calendar")}" ${active === "calendar" && !state.query ? 'aria-current="page"' : ""}>${t("Today & Telugu calendar", "ఈరోజు, తెలుగు క్యాలెండర్")}</a></li>`;
}

function scheduleNavigation() {
  return `<li><a class="nav-parent" href="${route("schedule")}" ${active === "schedule" && !state.query ? 'aria-current="page"' : ""}>${t("Swami Pooja Schedule", "స్వామి పూజా షెడ్యూల్")}<span class="nav-private">${t("Passphrase", "పాస్‌ఫ్రేజ్")}</span></a></li>`;
}

function guideNavigation() {
  const current = (matches) => matches && !state.query ? 'aria-current="page"' : "";
  const tabs = abpTabs.map((tab) => tab.id === "suprabhatam"
    ? `<li><a href="${route("abp", { tab: tab.id })}" ${current(active === "abp" && state.abpTab === tab.id)}>${esc(abpTabTitle(tab, lang))}</a></li>`
    : navigationBranch(`tab-${tab.id}`, abpTabTitle(tab, lang), route("abp", { tab: tab.id }), tab.sections.map((section) => `<li><a href="${route("abp", { tab: tab.id, part: section.id })}" ${current(active === "abp" && state.abpTab === tab.id && state.abpPart === section.id)}>${esc(abpSectionTitle(tab, section, lang))}</a></li>`).join(""), current(active === "abp" && state.abpTab === tab.id && !state.abpPart))).join("");
  const chapters = bookChapters.map((chapter) => `<li><a href="${route("book", { chapter: chapter.id })}" ${current(active === "book" && state.bookChapter === chapter.id)}>${esc(text(chapter.title))}</a></li>`).join("");
  return navigationBranch("source-one", sourceOneTitle, route("abp"), tabs, current(active === "abp" && !state.abpTab))
    + navigationBranch("source-two", sourceTwoTitle, route("book"), chapters, current(active === "book" && !state.bookChapter));
}

function readingLibraries() {
  const companionEntries = [
    { id: "chanting", title: { en: "Chant & sing", te: "జపం, భజన" } },
    { id: "routine", title: { en: "Daily puja checklist", te: "నిత్యపూజ జాబితా" } },
    ...topics,
    { id: "sources", title: { en: "Source library", te: "మూలాల సేకరణ" } },
  ];
  const library = `<li><a href="${route("bhajans")}" ${active === "bhajans" && !state.query ? 'aria-current="page"' : ""}>${t("Ayyappa Telugu bhajans · 38 songs", "అయ్యప్ప తెలుగు భజనలు · 38 పాటలు")}</a></li>${["ashtottaram", "sahasranamavali"].map((id) => `<li><a href="${route("chanting", { chant: id })}" ${active === "chanting" && state.chantId === id && !state.query ? 'aria-current="page"' : ""}>${esc(text(chantDefinitions.find((entry) => entry.id === id).title))}</a></li>`).join("")}`;
  const companion = companionEntries.map((entry) => `<li><a href="${route(entry.id)}" ${active === entry.id && !state.chantId && !state.query ? 'aria-current="page"' : ""}>${esc(text(entry.title))}</a></li>`).join("");
  return navigationBranch("library", t("Bhajans & Namavali", "భజనలు, నామావళి"), "", library)
    + navigationBranch("companion", t("Companion sections", "అదనపు విభాగాలు"), route("companion"), companion, active === "companion" && !state.query ? 'aria-current="page"' : "");
}

function render() {
  document.documentElement.lang = lang;
  const selectedSong = websiteBhajans.find(song => song.id === state.bhajanSong);
  const bhajanTitle = selectedSong
    ? selectedSong.title
    : (state.bhajanSong || state.bhajanPage) ? t("Bhajan entry unavailable", "భజన నమోదు అందుబాటులో లేదు")
      : state.bhajanCollection === "prayers" ? t("Source 1 prayers & stotras", "Source 1 ప్రార్థనలు, స్తోత్రాలు")
        : t("Ayyappa Telugu bhajans", "అయ్యప్ప తెలుగు భజనలు");
  document.title = `${active === "schedule" ? t("Swami Pooja Schedule", "స్వామి పూజా షెడ్యూల్") : active === "bhajans" ? bhajanTitle : active === "abp" ? (resolveAbp(state.abpTab, state.abpPart)?.section ? abpSectionTitle(resolveAbp(state.abpTab).tab, resolveAbp(state.abpTab, state.abpPart).section, lang) : "") || (resolveAbp(state.abpTab) ? abpTabTitle(resolveAbp(state.abpTab).tab, lang) : sourceOneTitle) : active === "book" ? text(bookChapters.find((chapter) => chapter.id === state.bookChapter)?.title || { en: sourceTwoTitle, te: sourceTwoTitle }) : active === "companion" ? t("Companion sections", "అదనపు విభాగాలు") : active === "sources" ? t("Source library", "మూలాల సేకరణ") : active === "chanting" ? t("Chant & sing", "జపం, భజన") : active === "routine" ? t("Daily puja checklist", "నిత్యపూజ జాబితా") : text(topicById(active)?.title) || t("Guide", "మార్గదర్శి")} · Ayyappa companion`;
  app.innerHTML = `<div class="app-layout">
    <aside class="sidebar">
      <a class="brand" href="${route(state.guide)}" aria-label="${t("Ayyappa companion home", "అయ్యప్ప మార్గదర్శి మొదటి పేజీ")}"><span class="brand-symbol">${icon("lamp")}</span><span>Ayyappa<span class="brand-subtitle">${t("Daily puja · your guides", "నిత్యపూజ · మీ మార్గదర్శులు")}</span></span></a>
      <nav class="topic-nav book-nav" aria-label="${t("Guide sections", "మార్గదర్శి విభాగాలు")}"><ul class="nav-tree">${scheduleNavigation()}${calendarNavigation()}${guideNavigation()}${readingLibraries()}</ul></nav>
      <div class="sidebar-bottom"><p lang="te">స్వామియే శరణం అయ్యప్ప</p><p>${t("Choose the guide for your practice.", "మీ ఆచరణకు మార్గదర్శిని ఎంచుకోండి.")}</p><a href="${state.guide === "abp" ? abpSource.url : primaryBook.url}" target="_blank" rel="noopener noreferrer">${state.guide === "abp" ? t("Original Source 1 workbook", "అసలు Source 1 వర్క్‌బుక్") : t("Original Nitya Puja book", "అసలు నిత్యపూజ పుస్తకం")}${icon("external")}</a></div>
    </aside>
    <div class="workspace"><header class="toolbar"><form class="search-form" role="search"><label for="guide-search" class="sr-only">${t("Search the book and companion", "పుస్తకం, అదనపు విభాగాల్లో వెతకండి")}</label>${icon("search")}<input id="guide-search" type="search" placeholder="${t("Find a prayer, chapter, or item…", "ప్రార్థన, విభాగం, వస్తువు వెతకండి…")}" value="${esc(state.query)}" autocomplete="off"><button class="search-submit" type="submit">${t("Search", "వెతకండి")}</button></form><div class="toolbar-actions"><div class="language-switch" role="group" aria-label="${t("Interface language", "యాప్ భాష")}"><button data-lang="en" lang="en" aria-pressed="${lang === "en"}">English</button><button data-lang="te" lang="te" aria-pressed="${lang === "te"}">తెలుగు</button></div><button class="share-button" data-action="share">${icon("share")}<span>${t("Share", "పంచుకోండి")}</span></button></div></header>
    <main id="main" tabindex="-1"><div class="reading-tools"><span>${["abp", "book"].includes(active) ? t("Your puja guide", "మీ పూజా మార్గదర్శి") : active === "schedule" ? t("Shared schedule", "పంచుకున్న షెడ్యూల్") : link("companion", t("← Companion sections", "← అదనపు విభాగాలు"))}</span><div role="group" aria-label="${t("Reading text size", "అక్షరాల పరిమాణం")}"><button data-size="-1" aria-label="${t("Decrease text size", "అక్షరాలు చిన్నవి చేయండి")}" ${state.fontSize <= 16 ? "disabled" : ""}>A−</button><button data-size="1" aria-label="${t("Increase text size", "అక్షరాలు పెద్దవి చేయండి")}" ${state.fontSize >= 24 ? "disabled" : ""}>A+</button></div></div><div id="page-content">${mainContent()}</div><footer class="footer"><p>${t("Choose between the Source 1 workbook and the Nitya Puja PDF. Their readings remain separate; other-source guides are in Companion sections. Not an official temple publication.", "Source 1 వర్క్‌బుక్ లేదా నిత్యపూజ PDF ఎంచుకోండి. వాటి పాఠ్యాలు వేర్వేరుగా ఉన్నాయి; ఇతర మూలాలు అదనపు విభాగాల్లో ఉన్నాయి. ఇది అధికారిక ఆలయ ప్రచురణ కాదు.")}</p><p>${t("Original documents are the reference. Pronunciation is not translated meaning. PDF text inherits OCR errors; follow your Guruswamy’s guidance and appropriate health precautions.", "అసలు పత్రాలనే ఆధారంగా తీసుకోండి. ఉచ్చారణ అర్థానువాదం కాదు. PDF పాఠ్యంలో OCR తప్పులు ఉండవచ్చు; గురుస్వామి సూచనలు, ఆరోగ్య జాగ్రత్తలు పాటించండి.")}</p></footer></main></div></div>
    <dialog id="share-dialog" aria-labelledby="share-title"><form method="dialog"><button class="close-dialog" aria-label="${t("Close", "మూసివేయండి")}">×</button></form><h2 id="share-title">${t("Share this companion", "ఈ మార్గదర్శిని పంచుకోండి")}</h2><div id="share-content"></div></dialog>
    <div id="announcement" class="sr-only" role="status" aria-live="polite"></div>`;
  document.documentElement.style.setProperty("--reading-size", `${state.fontSize}px`);
  if (active === "calendar") {
    document.title = `${t("Today & Telugu calendar", "ఈరోజు, తెలుగు క్యాలెండర్")} · Ayyappa companion`;
    app.querySelector(".reading-tools > span").textContent = t("Local daily timings", "స్థానిక రోజువారీ సమయాలు");
  }
  bindEvents();
}

function bindEvents() {
  app.querySelectorAll("[data-nav-toggle]").forEach((button) => button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    navigationOpen.set(button.dataset.navToggle, open);
    button.setAttribute("aria-expanded", String(open));
    document.getElementById(button.getAttribute("aria-controls")).hidden = !open;
  }));
  document.querySelector(".skip-link").onclick = (event) => {
    event.preventDefault();
    document.querySelector("#main").focus();
    document.querySelector("#main").scrollIntoView({ block: "start" });
  };
  if (matchMedia("(max-width: 760px)").matches) {
    const navigation = app.querySelector(".topic-nav");
    const current = navigation.querySelector('[aria-current="page"]');
    if (current) navigation.scrollTop = current.getBoundingClientRect().top - navigation.getBoundingClientRect().top + navigation.scrollTop - 80;
  }
  app.querySelector(".search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = app.querySelector("#guide-search").value.trim();
    location.hash = route(active, query ? { q: query } : {});
  });
  app.querySelector("#guide-search").addEventListener("search", (event) => {
    if (!event.target.value) location.hash = route(active);
  });
  app.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
    state.bookView = "auto";
    const params = new URLSearchParams(location.hash.slice(1));
    params.set("topic", active);
    params.set("lang", button.dataset.lang);
    location.hash = `#${params}`;
  }));
  app.querySelectorAll("[data-size]").forEach((button) => button.addEventListener("click", () => {
    state.fontSize = Math.max(16, Math.min(24, state.fontSize + Number(button.dataset.size)));
    document.documentElement.style.setProperty("--reading-size", `${state.fontSize}px`);
    const buttons = app.querySelectorAll("[data-size]");
    buttons[0].disabled = state.fontSize <= 16;
    buttons[1].disabled = state.fontSize >= 24;
    app.querySelector("#announcement").textContent = `${t("Text size", "అక్షరాల పరిమాణం")}: ${state.fontSize}`;
  }));
  app.querySelectorAll("[data-check]").forEach((checkbox) => checkbox.addEventListener("change", () => {
    if (checkbox.checked) state.checked.add(checkbox.dataset.check);
    else state.checked.delete(checkbox.dataset.check);
  }));
  app.querySelectorAll('[data-action="clear-search"]').forEach((button) => button.addEventListener("click", () => { location.hash = route(state.guide); }));
  app.querySelectorAll('[data-action="retry"]').forEach((button) => button.addEventListener("click", loadInventory));
  app.querySelector('[data-action="share"]').addEventListener("click", showShare);
  bindRitualEvents();
  bindScheduleEvents();
}

function bindScheduleEvents() {
  app.querySelector("#schedule-unlock-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const passphrase = app.querySelector("#schedule-passphrase").value;
    app.querySelector("#schedule-passphrase").value = "";
    const requestVersion = ++state.scheduleUnlockVersion;
    state.scheduleError = "";
    state.scheduleLoading = true;
    render();
    try {
      const payload = await loadScheduleCipher();
      const rows = await decryptSchedule(passphrase, payload);
      if (requestVersion !== state.scheduleUnlockVersion || active !== "schedule") return;
      state.scheduleRows = rows;
    } catch (error) {
      if (requestVersion !== state.scheduleUnlockVersion || active !== "schedule") return;
      if (["invalid-passphrase", "invalid-ciphertext", "schedule-unavailable"].includes(error.message)) {
        state.scheduleError = error.message;
      } else {
        console.error("Swami schedule unlock failed:", error);
        state.scheduleError = "schedule-unavailable";
      }
    } finally {
      if (requestVersion === state.scheduleUnlockVersion && active === "schedule") {
        state.scheduleLoading = false;
        render();
        if (state.scheduleRows) app.querySelector("#schedule-filter")?.focus();
        else app.querySelector("#schedule-passphrase")?.focus();
      }
    }
  });
  app.querySelector("#schedule-lock")?.addEventListener("click", () => {
    state.scheduleUnlockVersion++;
    state.scheduleRows = null;
    state.scheduleLoading = false;
    state.scheduleError = "";
    render();
    app.querySelector("#schedule-passphrase")?.focus();
  });
  app.querySelector("#schedule-filter")?.addEventListener("input", (event) => {
    const words = event.target.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    app.querySelectorAll("[data-schedule-row]").forEach((row) => {
      row.hidden = !words.every((word) => row.dataset.search.includes(word));
      if (!row.hidden) count++;
    });
    app.querySelector("#schedule-row-count").textContent = `${count} ${t("matching entries", "సరిపోలిన వివరాలు")} · ${t("source order", "మూల క్రమం")}`;
    app.querySelector("#schedule-empty").hidden = count !== 0;
  });
}

function chantLink(id, label, className = "") {
  return `<a class="${className}" href="${route("chanting", { chant: id })}">${esc(label)}${icon("arrow")}</a>`;
}

function quickAccess() {
  const phase = state.phaseOverride || ritualPhase();
  const ids = phase === "morning" ? ["ganesha", "guru", "ashtottaram", "sharanaghosha"] : ["ashtottaram", "sharanaghosha", "kshamapana", "pancharatna"];
  return `<section class="quick-access" aria-labelledby="quick-title"><div class="quick-heading"><h2 id="quick-title">${t("Today’s essential chants", "ఈ రోజు ముఖ్య ప్రార్థనలు")}</h2><div class="phase-switch" role="group" aria-label="${t("Ritual time", "పూజా సమయం")}"><button data-phase="morning" aria-pressed="${phase === "morning"}">${t("Morning", "ఉదయం")}</button><button data-phase="evening" aria-pressed="${phase === "evening"}">${t("Evening", "సాయంత్రం")}</button></div></div><p>${t("Suggested from your collection for this time of day. Tap a chant and read directly on your phone.", "ఈ సమయానికి మీ సేకరణ నుంచి సూచనలు. ప్రార్థనను నొక్కి ఫోన్‌లోనే చదవండి.")}</p><div class="quick-links">${ids.map((id) => chantLink(id, text(chantDefinitions.find((entry) => entry.id === id).title))).join("")}</div><div class="daily-shortcuts">${link("routine", `${t("Daily puja checklist", "నిత్యపూజ జాబితా")}${icon("arrow")}`)}${link("rules", `${t("The 18 holy rules", "18 పవిత్ర నియమాలు")}${icon("arrow")}`)}</div></section>`;
}

function chantingLibrary() {
  const definitions = state.category === "all" ? chantDefinitions : chantDefinitions.filter((entry) => entry.category === state.category || (state.category === "padi" && entry.id === "padayatra"));
  return `<div class="topic-intro"><h1 id="page-title">${t("Chant & sing", "జపం, భజన")}</h1><p class="intro-copy">${t("Open the words, set a comfortable text size, and chant from your phone. Readers preserve Telugu prayer text; the collection also includes Tamil material. English reading gives Telugu pronunciation in English letters, not translated meanings.", "English = Telugu pronunciation, not translated meaning.")}</p></div><nav class="category-tabs" aria-label="${t("Chant categories", "ప్రార్థనా విభాగాలు")}">${chantCategories.map((category) => `<a href="${route("chanting", { category: category.id })}" ${state.category === category.id ? 'aria-current="page"' : ""}>${esc(text(category.title))}</a>`).join("")}</nav>
  <p class="reader-language-note">${t("Short prayers are shown in full. Long readings show the first three entries with a link to the complete reader. Supplied workbook pronunciation is retained; other English-letter readings are approximate, not translations. Confirm pronunciation with your Guruswamy.", "చిన్న ప్రార్థనలు పూర్తిగా ఇక్కడే ఉన్నాయి. పెద్ద పఠనాలకు మొదటి మూడు అంశాలు, పూర్తి పఠన లింకు ఉన్నాయి. మూలంలోని ఉచ్చారణను ఉంచాం; ఇతర English ఉచ్చారణలు అంచనా మాత్రమే, అర్థానువాదం కాదు. గురుస్వామితో నిర్ధారించండి.")}</p>
  <ol class="reading-outline chant-library" role="list">${definitions.map((entry, index) => `<li><section><h2><span class="outline-number" aria-hidden="true">${index + 1}.</span> ${esc(text(entry.title))}</h2><div class="outline-children"><p>${esc(text(entry.purpose))}</p>${entry.notice ? `<p class="reader-notice">${esc(text(entry.notice))}</p>` : ""}${chantOutline(entry)}${citations([entry.source])}</div></section></li>`).join("")}</ol>
  ${["all", "bhajan"].includes(state.category) ? websiteBhajanLink() : ""}
  <p class="editorial-note audio-note">${t("Audio status: no verified matching recordings are bundled. Reader controls advance text; they are not audio playback. Modern song lyrics are not reproduced without verified reuse permission.", "ఆడియో స్థితి: నిర్ధారించిన సంబంధిత రికార్డింగ్‌లు జత చేయలేదు. పఠన నియంత్రణలు పాఠ్యాన్ని మారుస్తాయి; ఆడియో ప్లే చేయవు. అనుమతి నిర్ధారణ లేకుండా ఆధునిక పాటల సాహిత్యం పునర్ముద్రించలేదు.")}</p>`;
}

function chantText(item) {
  return lang === "en" ? item.pronunciation || pronounceTelugu(item.te) : item.te || "మూల వర్క్‌బుక్‌లో తెలుగు పాఠ్యం లేదు. అందించిన ఉచ్చారణ కోసం English ఎంచుకోండి.";
}

function chantOutline(entry) {
  const lines = chantTexts[entry.id];
  if (lines) {
    const full = lines.length <= 30;
    const visibleLines = full ? lines : lines.slice(0, 3);
    return `<ol class="inline-reading inline-prayer">${visibleLines.map((item) => `<li lang="${lang === "en" ? "te-Latn" : "te"}">${esc(chantText(item)).replaceAll("\n", "<br>")}</li>`).join("")}</ol>${!full ? `<p class="outline-note">${t(`Showing the first 3 of ${lines.length} entries.`, `మొత్తం ${lines.length} అంశాలలో మొదటి 3 ఇక్కడ ఉన్నాయి.`)}</p>` : ""}${chantLink(entry.id, full ? t("Open separate reader", "ప్రత్యేక పఠనం తెరవండి") : t("Read all entries", "అన్ని అంశాలు చదవండి"), "outline-reading-link")}`;
  }
  if (entry.abpReference) {
    const tab = resolveAbp(entry.abpReference[0]).tab;
    if (tab.id === "suprabhatam") return `<a class="outline-reading-link" href="${route("abp", { tab: tab.id })}">${t("Read the complete Suprabhatam", "పూర్తి సుప్రభాతం చదవండి")}${icon("arrow")}</a>`;
    return `<ol class="outline-links">${tab.sections.map((part) => `<li><a href="${route("abp", { tab: tab.id, part: part.id })}">${esc(abpSectionTitle(tab, part, lang))}${icon("arrow")}</a></li>`).join("")}</ol>`;
  }
  return chantLink(entry.id, t("Open source reference", "మూల సూచన తెరవండి"), "outline-reading-link");
}

function websiteBhajanLink() {
  return `<section class="song-catalogue"><h2>${t("Bhajanas & keertanalu", "భజనలు, కీర్తనలు")}</h2><p>${t("Browse the 38-song Ayyappa Telugu list; full lyrics remain on the source pages.", "అయ్యప్ప తెలుగు 38 పాటల జాబితాను చూడండి. పూర్తి సాహిత్యం మూల పేజీల్లోనే ఉంటుంది.")}</p>${link("bhajans", `${t("Open Ayyappa Telugu bhajans", "అయ్యప్ప తెలుగు భజనలు తెరవండి")}${icon("arrow")}`)}</section>`;
}

function chantReader() {
  const definition = chantDefinitions.find((entry) => entry.id === state.chantId);
  if (!definition) return `<h1 id="page-title">${t("Chant not found", "ప్రార్థన లభించలేదు")}</h1>${link("chanting", t("Browse chants", "ప్రార్థనలు చూడండి"), "button")}`;
  const lines = chantTexts[definition.id];
  const bookReference = {
    ganesha: ["opening", 19], guru: ["opening", 20], ashtottaram: ["names", 29],
    sharanaghosha: ["sharanaghosha", 34], padayatra: ["padayatra", 40],
    pancharatna: ["night", 42], kshamapana: ["materials", 46], harivarasanam: ["night", 43],
  }[definition.id];
  if (!lines && (definition.abpReference || bookReference)) {
    const readings = definition.abpReference
      ? [{ title: definition.title.en, href: route("abp", { tab: definition.abpReference[0], part: definition.abpReference[1] }) }]
      : [{ title: definition.title.en, href: route("book", { chapter: bookReference[0], page: bookReference[1] }) }];
    return `<div class="reader-back">${link("chanting", t("← All chants & bhajans", "← అన్ని ప్రార్థనలు, భజనలు"))}</div><div class="topic-intro"><h1 id="page-title">${esc(text(definition.title))}</h1><p class="intro-copy">${esc(text(definition.purpose))}</p></div><div class="quick-links">${readings.map((reading) => `<a href="${reading.href}">${esc(reading.title)}${icon("arrow")}</a>`).join("")}</div>    ${bookReference && lines ? `<p class="book-source"><a href="${route("book", { chapter: bookReference[0], page: bookReference[1] })}">${t("Read the Nitya Puja PDF version", "నిత్యపూజ PDF రూపం చదవండి")}${icon("arrow")}</a></p>` : ""}${citations([definition.source])}<p class="audio-note">${t("Reading pages only; no recording is attached.", "పఠన పేజీలు మాత్రమే; ఆడియో జత చేయలేదు.")}</p>`;
  }
  const position = Math.max(0, Math.min((lines?.length || 1) - 1, state.positions[definition.id] || 0));
  const isNamavaliReader = ["ashtottaram", "sahasranamavali"].includes(definition.id);
  const renderLine = (item, index) => `<button class="chant-line ${position === index ? "current-verse" : ""}" data-verse="${index}" ${position === index ? 'aria-current="step"' : ""}><span class="verse-number">${index + 1}</span><span class="verse-copy"><span lang="${lang === "en" ? "te-Latn" : "te"}">${esc(chantText(item)).replaceAll("\n", "<br>")}</span></span></button>`;
  const renderNamavaliLine = (item, index) => `<li class="chant-line"><span class="verse-number">${index + 1}</span><span class="verse-copy"><span lang="${lang === "en" ? "te-Latn" : "te"}">${esc(chantText(item)).replaceAll("\n", "<br>")}</span></span></li>`;
  const pronunciationNote = definition.sourcePronunciation
    ? t("English-letter pronunciation is copied from the workbook, including its diacritics—not generated from Telugu and not translated meaning. Telugu is the paired original. Confirm pronunciation with your Guruswamy.", "English ఉచ్చారణ మూల వర్క్‌బుక్‌లో ఉన్నదే; తెలుగు నుంచి కొత్తగా మార్చలేదు, అర్థానువాదం కాదు. జతగా ఉన్న అసలు తెలుగును ఉంచాం.")
    : t("English letters show Telugu pronunciation, not translated meanings. aa, ee, and oo mark long vowels. Spelling is approximate; confirm pronunciation with your Guruswamy.", "English: Telugu pronunciation only; aa, ee, oo = long vowels. Guruswamy review required.");
  return `<div class="reader-back">${link("chanting", t("← All chants & bhajans", "← అన్ని ప్రార్థనలు, భజనలు"))}<button data-action="focus">${document.body.classList.contains("focus-reading") ? t("Exit focus view", "సాధారణ వీక్షణ") : t("Focus view", "ఏకాగ్ర పఠనం")}</button></div><div class="topic-intro"><h1 id="page-title">${esc(text(definition.title))}</h1><p class="intro-copy">${esc(text(definition.purpose))}</p></div>${definition.notice ? `<p class="reader-notice">${esc(text(definition.notice))}</p>` : ""}
  ${lines ? `${isNamavaliReader ? "" : `<div class="reader-controls"><label>${t("Reading view", "పఠన రూపం")}<select id="reader-mode"><option value="list" ${state.readerMode === "list" ? "selected" : ""}>${t("Full text", "పూర్తి పాఠ్యం")}</option><option value="single" ${state.readerMode === "single" ? "selected" : ""}>${t("One entry at a time", "ఒక్కో అంశం")}</option></select></label></div>`}<p class="reader-language-note">${pronunciationNote}</p>${isNamavaliReader ? `<ol class="chant-text namavali-text" aria-label="${t("Complete Namavali", "పూర్తి నామావళి")}">${lines.map(renderNamavaliLine).join("")}</ol>` : `<div class="chant-text ${state.readerMode === "single" ? "single-verse" : ""}" aria-label="${t("Chant text", "పఠన పాఠ్యం")}">${state.readerMode === "single" ? renderLine(lines[position], position) : lines.map(renderLine).join("")}</div><div class="reader-stepper"><button data-step="-1" ${position === 0 ? "disabled" : ""}>${t("Previous", "ముందుది")}</button><p role="status">${position + 1} / ${lines.length}<span>${t("Reading position · not audio playback", "పఠన స్థానం · ఆడియో కాదు")}</span></p><button data-step="1" ${position === lines.length - 1 ? "disabled" : ""}>${t("Next", "తర్వాత")}</button></div>`}` : `<div class="reference-notice"><h2>${t("Source available; in-app text/audio pending", "మూలం ఉంది; యాప్‌లో పాఠ్యం/ఆడియో పెండింగ్")}</h2><p>${t("This item is intentionally not shown as a complete playable or readable track. Use the supplied source while text/audio reuse and transcription are reviewed.", "ఈ అంశాన్ని పూర్తి ఆడియో లేదా పఠన ట్రాక్‌గా చూపించలేదు. పాఠ్యం, ఆడియో పునర్వినియోగం, లిప్యంతరీకరణ సమీక్ష అయ్యేవరకు అందించిన మూలాన్ని ఉపయోగించండి.")}</p></div>`}
  ${bookReference ? `<p class="reader-notice">${t("This companion entry retains its earlier source. For the selected Nitya Puja book’s version:", "ఈ అదనపు పఠనం పాత మూలం ఆధారంగానే ఉంది. ఎంచుకున్న నిత్యపూజ పుస్తకంలోని రూపం కోసం:")} <a href="${route("book", { chapter: bookReference[0], page: bookReference[1] })}">${t("Read the original in the main book", "ప్రధాన పుస్తకంలో అసలు పాఠ్యం చదవండి")}</a></p>` : ""}
  ${definition.sourceImage ? `<details class="source-page"><summary>${t("Compare with the original · printed page 42", "అసలు ముద్రిత పేజీ 42తో పోల్చండి")}</summary><a href="${esc(definition.sourceImage)}" target="_blank" rel="noopener noreferrer"><img src="${esc(definition.sourceImage)}" alt="${t("Original Telugu-script pilgrimage calls and responses, printed page 42 (PDF page 40)", "తెలుగు లిపిలోని పాదయాత్ర నినాదాల అసలు ముద్రిత పేజీ 42 (PDF పేజీ 40)")}" loading="lazy"></a><p>${t("Tap the page to open the full-size image and zoom.", "పూర్తి పరిమాణంలో తెరిచి పెద్దగా చూడటానికి పేజీని నొక్కండి.")}</p></details>` : ""}
  ${citations([definition.source])}<p class="audio-note">${t("No verified recording is attached to this reader.", "ఈ పఠనానికి నిర్ధారించిన రికార్డింగ్ జత చేయలేదు.")}</p>`;
}

function loadRoutine() {
  state.routineDay = ritualDay();
  state.routine.clear();
  try {
    const saved = JSON.parse(localStorage.getItem(`ayyappa-routine-${ritualDay()}`) || "[]");
    state.routine = new Set(Array.isArray(saved) ? saved.filter((index) => Number.isInteger(index) && index >= 0 && index < pujaRoutine.length) : []);
  } catch (error) {
    state.storageWarning = true;
    console.warn("Daily checklist storage unavailable:", error);
  }
}

function routinePage() {
  if (state.routineDay !== ritualDay()) loadRoutine();
  return `<div class="topic-intro"><h1 id="page-title">${t("Daily puja checklist", "నిత్యపూజ జాబితా")}</h1><p class="intro-copy">${t("A step-by-step companion to the Source 1 sequence. Mark the stages as you go; optional rites remain optional. Checkmarks are personal reminders, not a judgment of devotion.", "Source 1 క్రమానికి దశలవారీ సహచరి. పూర్తయిన దశలను గుర్తించండి; సందర్భానుసార ఆచారాలు అలాగే ఉంటాయి. గుర్తులు వ్యక్తిగత స్మరణలు మాత్రమే; భక్తికి కొలమానం కాదు.")}</p></div><div class="routine-progress"><strong id="routine-count">${state.routine.size} / ${pujaRoutine.length} ${t("checked today", "ఈ రోజు గుర్తించినవి")}</strong><span>${ritualDay()} · ${t("saved on this device", "ఈ పరికరంలో నిల్వ")}</span><button data-action="reset-routine">${t("Reset today", "ఈ రోజు గుర్తులు తీసివేయండి")}</button></div><p id="storage-warning" class="reader-notice" ${state.storageWarning ? "" : "hidden"}>${t("Browser storage is unavailable. Checkmarks will only last for this visit.", "బ్రౌజర్ నిల్వ అందుబాటులో లేదు. గుర్తులు ఈ సందర్శన వరకే ఉంటాయి.")}</p><fieldset class="routine-checklist"><legend class="sr-only">${t("Puja stages", "పూజా దశలు")}</legend>${pujaRoutine.map((item, index) => `<label><input type="checkbox" data-routine="${index}" ${state.routine.has(index) ? "checked" : ""}><span class="routine-index">${index + 1}</span><span>${esc(text(item))}</span></label>`).join("")}</fieldset>${citations([{ id: "1oeRnnIt7VN2bI_ZjYu49dZqGRdkynvPx", pages: [], sheet: "Pooja Sequence", label: "Source 1: Ayyappa Process Guide" }])}<div class="quick-links routine-chants">${["ganesha", "ashtottaram", "sharanaghosha", "kshamapana"].map((id) => chantLink(id, text(chantDefinitions.find((entry) => entry.id === id).title))).join("")}</div>`;
}

function refreshReading() {
  app.querySelector("#page-content").innerHTML = mainContent();
  bindRitualEvents();
}

function bindRitualEvents() {
  bindBookEvents();
  app.querySelectorAll("[data-phase]").forEach((button) => button.addEventListener("click", () => {
    state.phaseOverride = button.dataset.phase;
    refreshReading();
  }));
  app.querySelector("#song-deity")?.addEventListener("change", (event) => {
    let visible = 0;
    app.querySelectorAll(".song-list li").forEach((item) => {
      item.hidden = Boolean(event.target.value && item.dataset.deity !== event.target.value);
      if (!item.hidden) visible++;
    });
    app.querySelector("#song-filter-status").textContent = `${visible} ${t("song references shown", "పాటల సూచనలు చూపిస్తున్నాం")}`;
  });
  app.querySelector("#reader-mode")?.addEventListener("change", (event) => { state.readerMode = event.target.value; refreshReading(); app.querySelector("#reader-mode").focus({ preventScroll: true }); });
  app.querySelectorAll("[data-verse]").forEach((button) => button.addEventListener("click", () => {
    const position = Number(button.dataset.verse);
    state.positions[state.chantId] = position;
    refreshReading();
    app.querySelector(`[data-verse="${position}"]`).focus({ preventScroll: true });
  }));
  app.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", () => {
    const lines = chantTexts[state.chantId];
    state.positions[state.chantId] = Math.max(0, Math.min(lines.length - 1, (state.positions[state.chantId] || 0) + Number(button.dataset.step)));
    refreshReading();
    if (state.readerMode === "list") app.querySelector(".current-verse")?.scrollIntoView({ block: "center" });
    const nextButton = app.querySelector(`[data-step="${button.dataset.step}"]`);
    if (nextButton && !nextButton.disabled) nextButton.focus({ preventScroll: true });
  }));
  app.querySelector('[data-action="focus"]')?.addEventListener("click", () => { document.body.classList.toggle("focus-reading"); refreshReading(); app.querySelector('[data-action="focus"]').focus({ preventScroll: true }); });
  app.querySelectorAll("[data-routine]").forEach((checkbox) => checkbox.addEventListener("change", () => {
    if (state.routineDay !== ritualDay()) loadRoutine();
    const index = Number(checkbox.dataset.routine);
    if (checkbox.checked) state.routine.add(index); else state.routine.delete(index);
    saveRoutine();
    app.querySelector("#routine-count").textContent = `${state.routine.size} / ${pujaRoutine.length} ${t("checked today", "ఈ రోజు గుర్తించినవి")}`;
  }));
  app.querySelector('[data-action="reset-routine"]')?.addEventListener("click", () => { state.routine.clear(); saveRoutine(); refreshReading(); });
}

function bindBookEvents() {
  bindCalendar(lang);
  const songFilter = app.querySelector("#website-song-filter");
  songFilter?.addEventListener("input", event => {
    const matches = new Set(searchWebsiteBhajans(event.target.value).map(song => song.id));
    app.querySelectorAll("[data-website-song]").forEach(row => { row.hidden = !matches.has(row.dataset.websiteSong); });
    app.querySelector("#website-song-status").textContent = matches.size
      ? `${matches.size} ${t("songs", "పాటలు")}`
      : t("No songs found. Try another song or singer name.", "పాటలు లభించలేదు. మరో పాట లేదా గాయకుడి పేరుతో ప్రయత్నించండి.");
  });
  if (songFilter?.value) songFilter.dispatchEvent(new Event("input"));
  app.querySelector("#guide-version")?.addEventListener("change", (event) => {
    document.body.classList.remove("focus-reading");
    location.hash = route(event.target.value);
  });
  app.querySelector("#abp-tab")?.addEventListener("change", (event) => {
    location.hash = route("abp", { tab: event.target.value });
  });
  app.querySelector("#abp-part")?.addEventListener("change", (event) => {
    location.hash = route("abp", { tab: state.abpTab, part: event.target.value });
  });
  app.querySelector("#book-chapter")?.addEventListener("change", (event) => {
    location.hash = route("book", { chapter: event.target.value });
  });
  app.querySelector("#book-page")?.addEventListener("change", (event) => {
    location.hash = route("book", { chapter: state.bookChapter, page: event.target.value });
  });
  app.querySelector("#book-view")?.addEventListener("change", (event) => {
    state.bookView = ["original", "draft", "pronunciation"].includes(event.target.value) ? event.target.value : "auto";
    refreshReading();
    app.querySelector("#book-view").focus({ preventScroll: true });
  });
  const image = app.querySelector("#book-page-image");
  if (image) {
    const showError = () => { app.querySelector("#book-image-error").hidden = false; };
    image.addEventListener("error", showError);
    if (image.complete && image.naturalWidth === 0) showError();
  }
}

function saveRoutine() {
  try {
    localStorage.setItem(`ayyappa-routine-${ritualDay()}`, JSON.stringify([...state.routine]));
  } catch (error) {
    state.storageWarning = true;
    console.warn("Could not save daily checklist:", error);
    const warning = app.querySelector("#storage-warning");
    if (warning) warning.hidden = false;
  }
}

function showShare() {
  const dialog = app.querySelector("#share-dialog");
  const local = ["localhost", "127.0.0.1", "[::1]", ""].includes(location.hostname);
  const url = new URL(location.href);
  url.search = "";
  const container = app.querySelector("#share-content");
  if (local) {
    container.innerHTML = `<p>${t("A localhost link only works on this computer. The offline HTML includes Source 1, all 61 Nitya Puja pages, all 451 bhajan-book pages, and the companion, approximately 61 MB. It opens without a server; the hosted website loads only the current image and is easier to share on phones.", "localhost లింకు ఈ కంప్యూటర్‌లో మాత్రమే పనిచేస్తుంది. ఆఫ్‌లైన్ HTMLలో Source 1, 61 నిత్యపూజ పేజీలు, 451 భజన పుస్తక పేజీలు, అదనపు విభాగాలు ఉన్నాయి; సుమారు 61 MB. ఫోన్‌లో పంచుకోవడానికి ప్రచురించిన వెబ్‌సైట్ లింకు సులభం.")}</p><p><a class="button" href="ayyappa-companion.html" download="Ayyappa-companion.html">${t("Download complete offline guide · about 61 MB", "పూర్తి ఆఫ్‌లైన్ మార్గదర్శి డౌన్‌లోడ్ · సుమారు 61 MB")}</a></p><p>${t("Publish only the public folder for a website link. Keep private extraction files and OCR model/cache outside the website. README includes the steps.", "వెబ్‌సైట్ కోసం public ఫోల్డర్‌ను మాత్రమే ప్రచురించండి. వ్యక్తిగత వెలికితీత ఫైళ్లు, OCR మోడల్, క్యాష్‌ను వెబ్‌సైట్ వెలుపల ఉంచండి. విధానం READMEలో ఉంది.")}</p>`;
  } else {
    container.innerHTML = `<p>${t("This link opens the current topic and reading language.", "ఈ లింకు ప్రస్తుతం ఉన్న అంశం, భాషను తెరుస్తుంది.")}</p><label class="share-url">${t("Link", "లింకు")}<input readonly value="${esc(url.href)}"></label><button class="button" id="copy-link">${t("Copy link", "లింకు కాపీ చేయండి")}</button><p id="copy-status" role="status"></p>`;
    container.querySelector("#copy-link").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(url.href);
        container.querySelector("#copy-status").textContent = t("Link copied.", "లింకు కాపీ అయింది.");
      } catch (error) {
        console.warn("Clipboard write failed:", error);
        container.querySelector("#copy-status").textContent = t("Copy was blocked. Select and copy the link above.", "కాపీ చేయడం అనుమతించబడలేదు. పై లింకును ఎంచుకుని కాపీ చేయండి.");
        container.querySelector("input").select();
      }
    });
  }
  dialog.showModal();
}

async function loadInventory() {
  state.inventoryError = null;
  if (active === "sources" && !state.query) {
    app.querySelector("#inventory").innerHTML = inventoryMarkup();
  }
  try {
    const embedded = document.querySelector("#embedded-inventory");
    let inventory;
    if (embedded) {
      inventory = JSON.parse(embedded.textContent);
    } else {
      const response = await fetch("sources.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      inventory = await response.json();
    }
    if (!Array.isArray(inventory) || inventory.some((entry) => typeof entry.name !== "string" || typeof entry.id !== "string" || typeof entry.folder !== "string" || !["file", "folder"].includes(entry.kind))) {
      throw new Error("Invalid source inventory");
    }
    state.inventory = inventory;
  } catch (error) {
    state.inventoryError = error;
    console.error("Source inventory could not be loaded:", error);
  }
  if (active === "sources" && !state.query) {
    app.querySelector("#inventory").innerHTML = inventoryMarkup();
    app.querySelector('[data-action="retry"]')?.addEventListener("click", loadInventory);
  }
}

window.addEventListener("hashchange", () => {
  const previousTopic = active;
  const previousLang = lang;
  const previousChapter = state.bookChapter;
  const previousPage = state.bookPage;
  const previousTab = state.abpTab;
  const previousPart = state.abpPart;
  const previousBhajanSong = state.bhajanSong;
  const previousBhajanPage = state.bhajanPage;
  const previousBhajanCollection = state.bhajanCollection;
  const section = readRoute();
  if (!((active === "chanting" && state.chantId) || (active === "book" && state.bookChapter) || (active === "abp" && (state.abpPart || state.abpTab === "suprabhatam")) || (active === "bhajans" && state.bhajanSong?.startsWith("site-")))) document.body.classList.remove("focus-reading");
  render();
  if (section) {
    const element = document.getElementById(section);
    if (element?.classList.contains("reading-section")) {
      element.scrollIntoView({ block: "start" });
      const heading = element.querySelector("h2, h3");
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    } else if (element?.matches("h2, h3")) {
      element.scrollIntoView({ block: "start" });
      element.focus({ preventScroll: true });
    }
  } else if (previousTopic !== active || previousLang !== lang || previousChapter !== state.bookChapter || previousPage !== state.bookPage || previousTab !== state.abpTab || previousPart !== state.abpPart || previousBhajanSong !== state.bhajanSong || previousBhajanPage !== state.bhajanPage || previousBhajanCollection !== state.bhajanCollection || state.query) {
    document.querySelector("#main").scrollIntoView({ block: "start" });
    document.querySelector("#main").focus({ preventScroll: true });
  }
});

const initialSection = readRoute();
loadRoutine();
render();
startCalendar();
if (initialSection) {
  requestAnimationFrame(() => {
    const element = document.getElementById(initialSection);
    element?.scrollIntoView({ block: "start" });
    if (element?.matches("h2, h3")) element.focus({ preventScroll: true });
  });
}
loadInventory();
