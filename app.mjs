import { topics, topicById, searchTopics, collectionUrl, reviewedDate, sourceUrl } from "./content.mjs";
import { chantTexts, songCatalogue } from "./chant-data.mjs";
import { chantCategories, chantDefinitions, pujaRoutine, ritualPhase, ritualDay } from "./rituals.mjs";

const app = document.querySelector("#app");
const state = { inventory: null, inventoryError: null, checked: new Set(), query: "", fontSize: 18, chantId: "", category: "all", readerMode: "list", readerScript: "auto", positions: {}, routine: new Set(), storageWarning: false, phaseOverride: null };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
let lang = "en";
let active = "daily";
const t = (en, te) => lang === "te" ? te : en;
const text = (value) => value?.[lang] || "";
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
  active = params.get("topic") || "daily";
  state.query = params.get("q") || "";
  state.chantId = params.get("chant") || "";
  state.category = chantCategories.some((category) => category.id === params.get("category")) ? params.get("category") : "all";
  return params.get("section");
}

function citations(sources) {
  if (!sources.length) return "";
  return `<div class="citations">${sources.map((source) => {
    const pageText = source.sheet ? `${t("Sheet", "షీట్")}: ${source.sheet}` : source.pages.length ? `${t("PDF p.", "PDF పేజీ")} ${source.pages.join(", ")}` : t("Word document", "వర్డ్ పత్రం");
    return `<a href="${sourceUrl(source)}" target="_blank" rel="noopener noreferrer" title="${esc(source.label)}">${icon("book")} ${esc(source.label)} <span>${pageText}</span>${icon("external")}</a>`;
  }).join("")}</div>`;
}

function sectionMarkup(section, topic) {
  const label = section.status === "confirm"
    ? t("Confirm with your Guruswamy", "గురుస్వామితో నిర్ధారించండి")
    : section.status === "editorial" ? t("Editorial guidance", "సంపాదకీయ సూచన") : "";
  return `<section class="reading-section" id="${esc(section.id)}" aria-labelledby="${section.id}-heading">
    ${label ? `<p class="section-status">${label}</p>` : ""}
    <h2 id="${section.id}-heading">${esc(text(section.title))}</h2>
    ${section.body ? `<p>${esc(text(section.body))}</p>` : ""}
    ${section.items ? `<${section.ordered ? "ol" : "ul"} class="reading-list">${section.items.map((item) => `<li>${esc(text(item))}</li>`).join("")}</${section.ordered ? "ol" : "ul"}>` : ""}
    ${section.checklist ? `<fieldset class="checklist"><legend>${t("Preparation checklist · stays checked during this visit", "సిద్ధత జాబితా · ఈ సందర్శనలో గుర్తులు నిలుస్తాయి")}</legend>${section.checklist.map((item, index) => {
      const key = `${topic.id}-${section.id}-${index}`;
      return `<label><input type="checkbox" data-check="${key}" ${state.checked.has(key) ? "checked" : ""}><span>${esc(text(item))}</span></label>`;
    }).join("")}</fieldset>` : ""}
    ${section.verse ? `<figure class="prayer"><blockquote>${esc(text(section.verse)).replaceAll("\n", "<br>")}</blockquote><figcaption>${esc(text(section.verseLabel))}</figcaption></figure>` : ""}
    ${section.note ? `<p class="editorial-note">${esc(text(section.note))}</p>` : ""}
    ${section.externalLinks ? `<div class="external-links">${section.externalLinks.map((item) => `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(text(item.title))}${icon("external")}</a>`).join("")}</div>` : ""}
    ${citations(section.sources)}
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
    <article class="reading-column">${topic.sections.map((section) => sectionMarkup(section, topic)).join("")}</article>
    <aside class="on-this-page" aria-label="${t("On this page", "ఈ పేజీలో")}"><h2>${t("On this page", "ఈ పేజీలో")}</h2><nav>${topic.sections.map((section) => `<a href="${route(topic.id, { section: section.id })}">${esc(text(section.title))}</a>`).join("")}</nav><p>${t("Page references count from the PDF’s first page, not its printed page numbers.", "మూల సూచనలు PDF మొదటి పేజీ నుండి లెక్కించినవి; ముద్రిత పేజీ సంఖ్యలు కావు.")}</p></aside>
  </div>
  <nav class="related" aria-label="${t("Related topics", "సంబంధిత అంశాలు")}"><h2>${t("Keep reading", "ఇంకా చదవండి")}</h2>${topic.related.map((id) => link(id, `<span>${id === "sources" ? t("Source library", "మూలాల సేకరణ") : esc(text(topicById(id).short))}</span>${icon("arrow")}`)).join("")}</nav>`;
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
  const words = state.query.trim().toLocaleLowerCase().split(/\s+/);
  const chants = chantDefinitions.filter((entry) => words.every((word) => [entry.id, entry.title.en, entry.title.te, entry.purpose.en, entry.purpose.te].join(" ").toLocaleLowerCase().includes(word)));
  return `<div class="topic-intro"><h1 id="page-title">${t("Find in the guide", "మార్గదర్శిలో వెతకండి")}</h1><p class="intro-copy">${results.length + chants.length} ${t("topics and chants matching", "అంశాలు, ప్రార్థనలు లభించాయి")} “${esc(state.query)}”</p></div>
  ${results.length || chants.length ? `<div class="search-results">${chants.map((entry) => `<a href="${route("chanting", { chant: entry.id })}"><div><h2>${esc(text(entry.title))}</h2><p>${esc(text(entry.purpose))}</p></div>${icon("arrow")}</a>`).join("")}${results.map((topic) => link(topic.id, `<div><h2>${esc(text(topic.title))}</h2><p>${esc(text(topic.description))}</p></div>${icon("arrow")}`)).join("")}</div>` : `<div class="empty-state"><h2>${t("No matching topic yet", "సరిపోలే అంశం లేదు")}</h2><p>${t("Try “food”, “puja”, “sleep”, “garlic”, or a Telugu word such as “భిక్ష”. Search covers the consolidated guide, not the unreadable source files.", "“ఆహారం”, “పూజ”, “నిద్ర”, “భిక్ష” వంటి పదాలతో ప్రయత్నించండి. ఈ శోధన సంక్షిప్త మార్గదర్శిలో మాత్రమే; చదవలేని మూల ఫైళ్లలో కాదు.")}</p><button data-action="clear-search">${t("Show all topics", "అన్ని అంశాలు చూపించండి")}</button></div>`}`;
}

function mainContent() {
  if (state.query.trim()) return renderSearch();
  if (active === "chanting") return state.chantId ? chantReader() : chantingLibrary();
  if (active === "routine") return routinePage();
  if (active === "sources") return sourceLibrary();
  const topic = topicById(active);
  if (topic) return renderTopic(topic);
  return `<div class="empty-state"><h1 id="page-title">${t("This topic is not in the guide", "ఈ అంశం మార్గదర్శిలో లేదు")}</h1><p>${t("The link may be incomplete. Choose a topic from the navigation.", "లింకు అసంపూర్ణంగా ఉండవచ్చు. నావిగేషన్‌లోని అంశాన్ని ఎంచుకోండి.")}</p>${link("daily", t("Open daily practice", "నిత్య ఆచరణ తెరవండి"), "button")}</div>`;
}

function render() {
  document.documentElement.lang = lang;
  document.title = `${active === "sources" ? t("Source library", "మూలాల సేకరణ") : active === "chanting" ? t("Chant & sing", "జపం, భజన") : active === "routine" ? t("Daily puja checklist", "నిత్యపూజ జాబితా") : text(topicById(active)?.title) || t("Guide", "మార్గదర్శి")} · Ayyappa companion`;
  app.innerHTML = `<div class="app-layout">
    <aside class="sidebar">
      <a class="brand" href="${route("daily")}" aria-label="${t("Ayyappa companion home", "అయ్యప్ప మార్గదర్శి మొదటి పేజీ")}"><span class="brand-symbol">${icon("lamp")}</span><span>Ayyappa<span class="brand-subtitle">${t("A companion for your deeksha", "మీ దీక్షకు పఠన సహచరి")}</span></span></a>
      <p class="nav-label">${t("THE READING GUIDE", "పఠన మార్గదర్శి")}</p>
      <nav class="topic-nav" aria-label="${t("Guide topics", "మార్గదర్శి అంశాలు")}">${[topics[0], { id: "chanting", short: { en: "Chant & sing", te: "జపం, భజన" } }, { id: "routine", short: { en: "Daily puja checklist", te: "నిత్యపూజ జాబితా" } }, ...topics.slice(1)].map((topic) => `<a href="${route(topic.id)}" ${active === topic.id && !state.query ? 'aria-current="page"' : ""}><span>${esc(text(topic.short))}</span><span class="nav-dot" aria-hidden="true"></span></a>`).join("")}<a class="library-nav" href="${route("sources")}" ${active === "sources" && !state.query ? 'aria-current="page"' : ""}>${icon("book")}<span>${t("Source library", "మూలాల సేకరణ")}</span></a></nav>
      <div class="sidebar-bottom"><p lang="te">స్వామియే శరణం అయ్యప్ప</p><p>${t("One collection. A clearer path to reading.", "ఒక సేకరణ. సులభమైన పఠనం.")}</p><a href="${collectionUrl}" target="_blank" rel="noopener noreferrer">${t("Permanent source folder", "శాశ్వత మూల ఫోల్డర్")}${icon("external")}</a></div>
    </aside>
    <div class="workspace"><header class="toolbar"><form class="search-form" role="search"><label for="guide-search" class="sr-only">${t("Search the consolidated guide", "సంక్షిప్త మార్గదర్శిలో వెతకండి")}</label>${icon("search")}<input id="guide-search" type="search" placeholder="${t("Find a practice, prayer, or question…", "ఆచారం, ప్రార్థన, ప్రశ్న వెతకండి…")}" value="${esc(state.query)}" autocomplete="off"><button class="search-submit" type="submit">${t("Search", "వెతకండి")}</button></form><div class="toolbar-actions"><div class="language-switch" role="group" aria-label="${t("Reading language", "చదివే భాష")}"><button data-lang="en" lang="en" aria-pressed="${lang === "en"}">English</button><button data-lang="te" lang="te" aria-pressed="${lang === "te"}">తెలుగు</button></div><button class="share-button" data-action="share">${icon("share")}<span>${t("Share", "పంచుకోండి")}</span></button></div></header>
    <main id="main" tabindex="-1"><div class="reading-tools"><span>${t("Your Ayyappa companion", "మీ అయ్యప్ప మార్గదర్శి")}</span><div role="group" aria-label="${t("Reading text size", "అక్షరాల పరిమాణం")}"><button data-size="-1" aria-label="${t("Decrease text size", "అక్షరాలు చిన్నవి చేయండి")}" ${state.fontSize <= 16 ? "disabled" : ""}>A−</button><button data-size="1" aria-label="${t("Increase text size", "అక్షరాలు పెద్దవి చేయండి")}" ${state.fontSize >= 24 ? "disabled" : ""}>A+</button></div></div><div id="page-content">${mainContent()}</div><footer class="footer"><p>${t("An editorial synthesis of the supplied collection. Not an official temple publication.", "అందించిన సేకరణకు సంపాదకీయ సారాంశం. ఇది అధికారిక ఆలయ ప్రచురణ కాదు.")}</p><p>${t("English and Telugu summaries need Guruswamy review before formal use.", "అధికారిక వినియోగానికి ముందు తెలుగు, ఆంగ్ల సారాంశాలకు గురుస్వామి సమీక్ష అవసరం.")}</p></footer></main></div></div>
    <dialog id="share-dialog" aria-labelledby="share-title"><form method="dialog"><button class="close-dialog" aria-label="${t("Close", "మూసివేయండి")}">×</button></form><h2 id="share-title">${t("Share this companion", "ఈ మార్గదర్శిని పంచుకోండి")}</h2><div id="share-content"></div></dialog>
    <div id="announcement" class="sr-only" role="status" aria-live="polite"></div>`;
  document.documentElement.style.setProperty("--reading-size", `${state.fontSize}px`);
  bindEvents();
}

function bindEvents() {
  document.querySelector(".skip-link").onclick = (event) => {
    event.preventDefault();
    document.querySelector("#main").focus();
    document.querySelector("#main").scrollIntoView({ block: "start" });
  };
  if (matchMedia("(max-width: 760px)").matches) {
    app.querySelector('.topic-nav [aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
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
  app.querySelectorAll('[data-action="clear-search"]').forEach((button) => button.addEventListener("click", () => { location.hash = route("daily"); }));
  app.querySelectorAll('[data-action="retry"]').forEach((button) => button.addEventListener("click", loadInventory));
  app.querySelector('[data-action="share"]').addEventListener("click", showShare);
  bindRitualEvents();
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
  const definitions = state.category === "all" ? chantDefinitions : chantDefinitions.filter((entry) => entry.category === state.category);
  return `<div class="topic-intro"><h1 id="page-title">${t("Chant & sing", "జపం, భజన")}</h1><p class="intro-copy">${t("Open the words, set a comfortable text size, and chant from your phone. Telugu text and Roman reading are available for the traditional readers.", "పాఠ్యం తెరిచి, అక్షరాల పరిమాణాన్ని సర్దుకుని ఫోన్ చూస్తూ చదవండి. సంప్రదాయ పఠనాలకు తెలుగు, రోమన్ లిపులు అందుబాటులో ఉన్నాయి.")}</p></div><nav class="category-tabs" aria-label="${t("Chant categories", "ప్రార్థనా విభాగాలు")}">${chantCategories.map((category) => `<a href="${route("chanting", { category: category.id })}" ${state.category === category.id ? 'aria-current="page"' : ""}>${esc(text(category.title))}</a>`).join("")}</nav>
  <div class="chant-library">${definitions.map((entry) => `<a class="chant-entry" href="${route("chanting", { chant: entry.id })}"><div><h2>${esc(text(entry.title))}</h2><p>${esc(text(entry.purpose))}</p><span class="availability">${entry.referenceOnly ? t("Source reference · text/audio reuse pending", "మూల సూచన · పాఠ్యం/ఆడియో అనుమతి నిర్ధారణ కావాలి") : `${chantTexts[entry.id].length} ${t("readable entries · Telugu / Roman", "పఠన అంశాలు · తెలుగు / రోమన్")}`}</span></div>${icon("arrow")}</a>`).join("")}</div>
  ${["all", "bhajan", "opening"].includes(state.category) ? songCatalogueMarkup() : ""}
  <p class="editorial-note audio-note">${t("Audio status: no verified matching recordings are bundled. Reader controls advance text; they are not audio playback. Modern song lyrics are not reproduced without verified reuse permission.", "ఆడియో స్థితి: నిర్ధారించిన సంబంధిత రికార్డింగ్‌లు జత చేయలేదు. పఠన నియంత్రణలు పాఠ్యాన్ని మారుస్తాయి; ఆడియో ప్లే చేయవు. అనుమతి నిర్ధారణ లేకుండా ఆధునిక పాటల సాహిత్యం పునర్ముద్రించలేదు.")}</p>`;
}

function songCatalogueMarkup() {
  const selected = state.category === "opening" ? songCatalogue.filter((song) => ["Ganesh", "Guru"].includes(song.deity)) : songCatalogue;
  return `<section class="song-catalogue"><h2>${t("Bhajanas & keertanalu · collection index", "భజనలు, కీర్తనలు · సేకరణ సూచిక")}</h2><p>${t("43 song titles from your reference workbook. Deity and tempo are shown only where recorded. These are reference entries, not unverified lyrics or playable tracks.", "మీ సూచన వర్క్‌బుక్‌లోని 43 పాటల పేర్లు. నమోదైన దేవత, లయ వివరాలనే చూపించాం. ఇవి మూల సూచనలు మాత్రమే; నిర్ధారించని సాహిత్యం లేదా ఆడియో ట్రాక్‌లు కావు.")}</p><label class="song-filter">${t("Filter by deity", "దేవత ఆధారంగా వడపోత")}<select id="song-deity"><option value="">${t("All deities", "అన్ని దేవతలు")}</option>${[...new Set(selected.map((song) => song.deity))].map((deity) => `<option value="${esc(deity)}">${esc(deity)}</option>`).join("")}</select></label><ul class="song-list">${selected.map((song) => `<li data-deity="${esc(song.deity)}"><strong>${esc(song.title)}</strong><span>${esc(song.deity)} · ${song.tempo === "slow" ? t("Slow", "నెమ్మదిగా") : song.tempo === "varied" ? t("Slow & fast", "నెమ్మది, వేగం") : t("Tempo / language not verified", "లయ / భాష నిర్ధారణ కాలేదు")}</span><a href="https://drive.google.com/file/d/1HI2h4qhQ-5l4a6M-AbsBayYW4GgieKq1/view" target="_blank" rel="noopener noreferrer">${t("Reference sheet", "మూల షీట్")} · ${esc(song.cell)}${icon("external")}</a></li>`).join("")}</ul><p id="song-filter-status" role="status"></p></section>`;
}

function chantReader() {
  const definition = chantDefinitions.find((entry) => entry.id === state.chantId);
  if (!definition) return `<h1 id="page-title">${t("Chant not found", "ప్రార్థన లభించలేదు")}</h1>${link("chanting", t("Browse chants", "ప్రార్థనలు చూడండి"), "button")}`;
  const lines = chantTexts[definition.id];
  const position = Math.max(0, Math.min((lines?.length || 1) - 1, state.positions[definition.id] || 0));
  const script = state.readerScript === "auto" ? (lang === "te" ? "te" : "roman") : state.readerScript;
  const renderLine = (item, index) => `<button class="chant-line ${position === index ? "current-verse" : ""}" data-verse="${index}" ${position === index ? 'aria-current="step"' : ""}><span class="verse-number">${index + 1}</span><span class="verse-copy">${script !== "roman" ? `<span lang="te">${esc(item.te).replaceAll("\n", "<br>")}</span>` : ""}${script !== "te" ? `<span lang="en" class="${script === "both" ? "roman-secondary" : ""}">${esc(item.roman).replaceAll("\n", "<br>")}</span>` : ""}</span></button>`;
  return `<div class="reader-back">${link("chanting", t("← All chants & bhajans", "← అన్ని ప్రార్థనలు, భజనలు"))}<button data-action="focus">${document.body.classList.contains("focus-reading") ? t("Exit focus view", "సాధారణ వీక్షణ") : t("Focus view", "ఏకాగ్ర పఠనం")}</button></div><div class="topic-intro"><h1 id="page-title">${esc(text(definition.title))}</h1><p class="intro-copy">${esc(text(definition.purpose))}</p></div>${definition.notice ? `<p class="reader-notice">${esc(text(definition.notice))}</p>` : ""}
  ${lines ? `<div class="reader-controls"><label>${t("Script", "లిపి")}<select id="reader-script"><option value="te" ${script === "te" ? "selected" : ""}>తెలుగు</option><option value="roman" ${script === "roman" ? "selected" : ""}>Roman</option><option value="both" ${script === "both" ? "selected" : ""}>తెలుగు + Roman</option></select></label><label>${t("Reading view", "పఠన రూపం")}<select id="reader-mode"><option value="list" ${state.readerMode === "list" ? "selected" : ""}>${t("Full text", "పూర్తి పాఠ్యం")}</option><option value="single" ${state.readerMode === "single" ? "selected" : ""}>${t("One entry at a time", "ఒక్కో అంశం")}</option></select></label></div><p class="reader-language-note">${t("Roman text is transliteration, not translation. The 108-name Roman text comes from the source; other readers use mechanical transliteration and need pronunciation review. Supplied wording is retained.", "రోమన్ పాఠ్యం లిప్యంతరీకరణ; అనువాదం కాదు. 108 నామాల రోమన్ పాఠ్యం మూలం నుంచి తీసుకున్నది. ఇతర పఠనాల యాంత్రిక లిప్యంతరీకరణకు ఉచ్చారణ సమీక్ష అవసరం. మూల పదాలను ఉంచాం.")}</p><div class="chant-text ${state.readerMode === "single" ? "single-verse" : ""}" aria-label="${t("Chant text", "పఠన పాఠ్యం")}">${state.readerMode === "single" ? renderLine(lines[position], position) : lines.map(renderLine).join("")}</div><div class="reader-stepper"><button data-step="-1" ${position === 0 ? "disabled" : ""}>${t("Previous", "ముందుది")}</button><p role="status">${position + 1} / ${lines.length}<span>${t("Reading position · not audio playback", "పఠన స్థానం · ఆడియో కాదు")}</span></p><button data-step="1" ${position === lines.length - 1 ? "disabled" : ""}>${t("Next", "తర్వాత")}</button></div>` : `<div class="reference-notice"><h2>${t("Source available; in-app text/audio pending", "మూలం ఉంది; యాప్‌లో పాఠ్యం/ఆడియో పెండింగ్")}</h2><p>${t("This item is intentionally not shown as a complete playable or readable track. Use the supplied source while text/audio reuse and transcription are reviewed.", "ఈ అంశాన్ని పూర్తి ఆడియో లేదా పఠన ట్రాక్‌గా చూపించలేదు. పాఠ్యం, ఆడియో పునర్వినియోగం, లిప్యంతరీకరణ సమీక్ష అయ్యేవరకు అందించిన మూలాన్ని ఉపయోగించండి.")}</p></div>`}
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
  return `<div class="topic-intro"><h1 id="page-title">${t("Daily puja checklist", "నిత్యపూజ జాబితా")}</h1><p class="intro-copy">${t("A step-by-step companion to the ABP sequence. Mark the stages as you go; optional rites remain optional. Checkmarks are personal reminders, not a judgment of devotion.", "ABP క్రమానికి దశలవారీ సహచరి. పూర్తయిన దశలను గుర్తించండి; సందర్భానుసార ఆచారాలు అలాగే ఉంటాయి. గుర్తులు వ్యక్తిగత స్మరణలు మాత్రమే; భక్తికి కొలమానం కాదు.")}</p></div><div class="routine-progress"><strong id="routine-count">${state.routine.size} / ${pujaRoutine.length} ${t("checked today", "ఈ రోజు గుర్తించినవి")}</strong><span>${ritualDay()} · ${t("saved on this device", "ఈ పరికరంలో నిల్వ")}</span><button data-action="reset-routine">${t("Reset today", "ఈ రోజు గుర్తులు తీసివేయండి")}</button></div><p id="storage-warning" class="reader-notice" ${state.storageWarning ? "" : "hidden"}>${t("Browser storage is unavailable. Checkmarks will only last for this visit.", "బ్రౌజర్ నిల్వ అందుబాటులో లేదు. గుర్తులు ఈ సందర్శన వరకే ఉంటాయి.")}</p><fieldset class="routine-checklist"><legend class="sr-only">${t("Puja stages", "పూజా దశలు")}</legend>${pujaRoutine.map((item, index) => `<label><input type="checkbox" data-routine="${index}" ${state.routine.has(index) ? "checked" : ""}><span class="routine-index">${index + 1}</span><span>${esc(text(item))}</span></label>`).join("")}</fieldset>${citations([{ id: "1oeRnnIt7VN2bI_ZjYu49dZqGRdkynvPx", pages: [], sheet: "Pooja Sequence", label: "ABP · Simplified process guide" }])}<div class="quick-links routine-chants">${["ganesha", "ashtottaram", "sharanaghosha", "kshamapana"].map((id) => chantLink(id, text(chantDefinitions.find((entry) => entry.id === id).title))).join("")}</div>`;
}

function refreshReading() {
  app.querySelector("#page-content").innerHTML = mainContent();
  bindRitualEvents();
}

function bindRitualEvents() {
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
  app.querySelector("#reader-script")?.addEventListener("change", (event) => { state.readerScript = event.target.value; refreshReading(); app.querySelector("#reader-script").focus({ preventScroll: true }); });
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
    container.innerHTML = `<p>${t("A localhost link only works on this computer. Instead, download the self-contained guide and send the HTML file to friends; it opens in a browser without a server.", "localhost లింకు ఈ కంప్యూటర్‌లో మాత్రమే పనిచేస్తుంది. బదులుగా స్వయం సమగ్ర మార్గదర్శిని డౌన్‌లోడ్ చేసి HTML ఫైలును స్నేహితులకు పంపండి. సర్వర్ లేకుండా బ్రౌజర్‌లో తెరుచుకుంటుంది.")}</p><p><a class="button" href="ayyappa-companion.html" download="Ayyappa-companion.html">${t("Download shareable guide", "పంచుకోగల మార్గదర్శి డౌన్‌లోడ్")}</a></p><p>${t("For the easiest phone experience and a public link, publish the public folder to a static hosting service. README includes the steps. Only publish the website files—not the extraction folder or original books.", "ఫోన్‌లో సులభంగా చదవడానికి, పబ్లిక్ లింకు కోసం public ఫోల్డర్‌ను స్టాటిక్ హోస్టింగ్‌లో ప్రచురించండి. విధానం READMEలో ఉంది. వెబ్‌సైట్ ఫైళ్లను మాత్రమే ప్రచురించండి; వెలికితీసిన పాఠ్యం లేదా మూల పుస్తకాలను కాదు.")}</p>`;
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
  const section = readRoute();
  if (active !== "chanting" || !state.chantId) document.body.classList.remove("focus-reading");
  render();
  if (section) {
    const element = document.getElementById(section);
    if (element?.classList.contains("reading-section")) {
      element.scrollIntoView({ block: "start" });
      element.querySelector("h2").setAttribute("tabindex", "-1");
      element.querySelector("h2").focus({ preventScroll: true });
    }
  } else if (previousTopic !== active || previousLang !== lang || state.query) {
    document.querySelector("#main").scrollIntoView({ block: "start" });
    document.querySelector("#main").focus({ preventScroll: true });
  }
});

const initialSection = readRoute();
loadRoutine();
render();
if (initialSection) {
  requestAnimationFrame(() => document.getElementById(initialSection)?.scrollIntoView({ block: "start" }));
}
loadInventory();
