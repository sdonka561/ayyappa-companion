import { panchangNames, panchangDateKey, panchangAddDays, panchangDayStart, validatePanchangPlace, panchangLunarAt, panchangTithiName, calculatePanchang, panchangMonthCells, searchPanchangCities, fetchPanchangSolar, resolvePanchangCoordinates } from "./panchang.mjs";

const calendarState = {
  place: null, today: "", selected: "", month: "", followToday: true, data: null, todayData: null,
  solar: null, solarDay: "", solarError: "", updatedAt: null, attemptedAt: 0, loading: false,
  error: "", locationError: "", storageWarning: "", cities: [], query: "", searching: false,
  locating: false, generation: 0, searchGeneration: 0, monthCells: null, monthCacheKey: "",
};
const calendarEscape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
let calendarLanguage = "en";
let calendarStarted = false;
const calendarText = (en, te) => calendarLanguage === "te" ? te : en;
const calendarName = (pair) => pair[calendarLanguage === "te" ? 1 : 0];
const calendarLocationKey = "ayyappa-calendar-place-v1";
const defaultCalendarPlace = {
  name: "Austin, TX",
  latitude: 30.2672,
  longitude: -97.7431,
  timeZone: "America/Chicago",
};

export function calendarFormatTime(instant, place, selectedKey) {
  if (!instant) return calendarText("Unavailable", "అందుబాటులో లేదు");
  const time = new Intl.DateTimeFormat(calendarLanguage === "te" ? "te-IN" : "en-US", { timeZone: place.timeZone, hour: "numeric", minute: "2-digit", hour12: true }).format(instant);
  const key = panchangDateKey(instant, place.timeZone);
  if (key === selectedKey) return time;
  const day = new Intl.DateTimeFormat(calendarLanguage === "te" ? "te-IN" : "en-US", { timeZone: place.timeZone, month: "short", day: "numeric" }).format(instant);
  return `${time} (${day})`;
}

function calendarRange(range) {
  return `${calendarFormatTime(range.start, calendarState.place, calendarState.selected)} – ${calendarFormatTime(range.end, calendarState.place, calendarState.selected)}`;
}

function calendarDateLabel(key, options = {}) {
  return new Intl.DateTimeFormat(calendarLanguage === "te" ? "te-IN" : "en-US", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric", ...options }).format(new Date(`${key}T12:00:00Z`));
}

function calendarTransitionList(entries, field) {
  return `<ol class="calendar-transitions">${entries.map((entry) => `<li><strong>${calendarEscape(field === "tithi" ? panchangTithiName(entry.index, calendarLanguage) : calendarName(panchangNames.nakshatra[entry.index]))}</strong><span>${entry.end
    ? `${calendarText("Until", "వరకు")} ${calendarFormatTime(entry.end, calendarState.place, calendarState.selected)}`
    : calendarText("Continues through the next sunrise; an exact end is not shown here.", "తదుపరి సూర్యోదయం వరకు కొనసాగుతుంది; ఖచ్చితమైన ముగింపు ఇక్కడ చూపలేదు.")}</span></li>`).join("")}</ol>`;
}

function calendarSourceLinks() {
  const key = calendarState.selected || calendarState.today;
  const date = key ? new Date(`${key}T12:00:00Z`) : new Date();
  const month = date.toLocaleString("en-US", { timeZone: "UTC", month: "long" }).toLowerCase();
  const panchangUrl = `https://www.prokerala.com/astrology/telugu-panchangam/${date.getUTCFullYear()}-${month}-${String(date.getUTCDate()).padStart(2, "0")}.html`;
  const drik = new URL("https://www.drikpanchang.com/panchang/day-panchang.html");
  if (key) drik.searchParams.set("date", key.split("-").reverse().join("/"));
  if (Number.isInteger(calendarState.place?.geonameId)) drik.searchParams.set("geoname-id", String(calendarState.place.geonameId));
  return `<section class="calendar-sources"><h2>${calendarText("Sources & verification", "మూలాలు, నిర్ధారణ")}</h2><p>${calendarText("Solar updates: Open-Meteo (CC BY 4.0). City search: Open-Meteo / GeoNames. Lunar calculations: Astronomy Engine 2.1.19 (MIT), with an approximate Lahiri ayanamsha and amanta month convention. These lunar values are calculated on your device, not downloaded from a Panchang provider.", "సూర్యోదయ/అస్తమయ సమాచారం: Open-Meteo (CC BY 4.0). నగర శోధన: Open-Meteo / GeoNames. చంద్ర గణనలు: Astronomy Engine 2.1.19 (MIT), సుమారు లాహిరి అయనాంశం, అమాంత మాస పద్ధతి. చంద్ర వివరాలు మీ పరికరంలో గణించినవి; పంచాంగ సేవ నుంచి తెచ్చినవి కావు.")}</p><div class="calendar-source-links"><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a><a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noopener noreferrer">Astronomy Engine</a><a href="${calendarEscape(drik.href)}" target="_blank" rel="noopener noreferrer">Drik Panchang</a><a href="${panchangUrl}" target="_blank" rel="noopener noreferrer">${calendarText("Telugu Panchangam", "తెలుగు పంచాంగం")}</a><a href="https://www.prokerala.com/general/calendar/telugucalendar.php" target="_blank" rel="noopener noreferrer">${calendarText("Published Telugu calendar", "ప్రచురిత తెలుగు క్యాలెండర్")}</a></div><p>${calendarText("On the external source, verify the same city, timezone, and date. A source may default to an Indian city. Regional calendars and sunrise definitions can differ by several minutes. Festival dates, Varjyam, Durmuhurtam, and personal muhurthams are not calculated here; use the source or your Guruswamy.", "బయటి మూలంలో అదే నగరం, కాలమండలం, తేదీని ఎంచుకోండి; అది మొదట భారత నగరాన్ని చూపవచ్చు. ప్రాంతీయ పద్ధతులు, సూర్యోదయ నిర్వచనాల వల్ల కొన్ని నిమిషాలు తేడా ఉండవచ్చు. పండుగ తేదీలు, వర్జ్యం, దుర్ముహూర్తం, వ్యక్తిగత ముహూర్తాలు ఇక్కడ గణించలేదు; మూలాన్ని లేదా గురుస్వామిని సంప్రదించండి.")}</p></section>`;
}

function calendarLocationForm() {
  return `<section class="calendar-location" aria-labelledby="calendar-location-title">
    <h2 id="calendar-location-title">${calendarText("Your location", "మీ ప్రదేశం")}</h2>
    ${calendarState.place ? `<p><strong>${calendarEscape(calendarState.place.name)}</strong><br><span>${calendarEscape(calendarState.place.timeZone)} · ${calendarState.place.latitude.toFixed(2)}, ${calendarState.place.longitude.toFixed(2)}</span></p>` : ""}
    <button type="button" data-calendar-action="locate" ${calendarState.locating ? "disabled" : ""}>${calendarState.locating ? calendarText("Finding location…", "ప్రదేశం వెతుకుతున్నాం…") : calendarText("Use my location", "నా ప్రదేశం ఉపయోగించండి")}</button>
    <form id="calendar-city-form" class="calendar-city-form">
      <label for="calendar-city">${calendarText("Or search for a city", "లేదా నగరాన్ని వెతకండి")}</label>
      <div><input id="calendar-city" name="city" type="search" required minlength="2" maxlength="100" value="${calendarEscape(calendarState.query)}" placeholder="${calendarText("City, e.g. Dallas or Hyderabad", "నగరం, ఉదా. Dallas లేదా Hyderabad")}" autocomplete="off"><button type="submit" ${calendarState.searching ? "disabled" : ""}>${calendarState.searching ? calendarText("Searching…", "వెతుకుతున్నాం…") : calendarText("Search city", "నగరం వెతకండి")}</button></div>
    </form>
    ${calendarState.locationError ? `<p class="calendar-error" role="alert">${calendarEscape(calendarState.locationError)}</p>` : ""}
    ${calendarState.cities.length ? `<ul class="calendar-city-results">${calendarState.cities.map((place, index) => `<li><button type="button" data-calendar-city="${index}">${calendarEscape(place.name)}<span>${calendarEscape(place.timeZone)}</span></button></li>`).join("")}</ul>` : ""}
    <p class="calendar-privacy">${calendarText("Austin, TX is the default. Use my location only if you choose; browser permission is optional. Coordinates are rounded to 0.01° before sending them to Open-Meteo for timezone and solar data; city searches send the typed name. Your chosen location is saved only in this browser, not in shared links. No account or tracking is added.", "ఆస్టిన్, టెక్సాస్ డిఫాల్ట్ ప్రదేశం. మీరు ఎంచుకుంటేనే నా ప్రదేశాన్ని ఉపయోగిస్తాం; బ్రౌజర్ అనుమతి ఐచ్ఛికం. కాలమండలం, సూర్య సమయాల కోసం అక్షాంశ/రేఖాంశాలను 0.01°కు గుండ్రంగా చేసి Open-Meteoకు పంపుతాం; నగర శోధనలో టైప్ చేసిన పేరు పంపుతాం. ఎంచుకున్న ప్రదేశం ఈ బ్రౌజర్‌లో మాత్రమే నిలుస్తుంది; పంచుకునే లింకులో ఉండదు. ఖాతా, ట్రాకింగ్ లేవు.")}</p>
    ${calendarState.place ? `<button class="calendar-forget" type="button" data-calendar-action="forget">${calendarText("Reset to Austin, TX", "ఆస్టిన్, టెక్సాస్‌కు తిరిగి మార్చు")}</button>` : ""}
    ${calendarState.storageWarning ? `<p class="calendar-error" role="alert">${calendarEscape(calendarState.storageWarning)}</p>` : ""}
  </section>`;
}

function calendarMonthMarkup() {
  const { place, month, selected, today } = calendarState;
  const cacheKey = `${place.latitude},${place.longitude},${place.timeZone},${month}`;
  if (calendarState.monthCacheKey !== cacheKey) {
    calendarState.monthCells = panchangMonthCells(month, place);
    calendarState.monthCacheKey = cacheKey;
  }
  const cells = calendarState.monthCells;
  const offset = new Date(`${month}-01T12:00:00Z`).getUTCDay();
  const slots = [...Array(offset).fill(null), ...cells];
  while (slots.length % 7) slots.push(null);
  const weekdays = calendarLanguage === "te" ? ["ఆది", "సోమ", "మం", "బుధ", "గురు", "శుక్ర", "శని"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const heading = new Intl.DateTimeFormat(calendarLanguage === "te" ? "te-IN" : "en-US", { timeZone: "UTC", year: "numeric", month: "long" }).format(new Date(`${month}-01T12:00:00Z`));
  return `<section class="calendar-month" aria-labelledby="calendar-month-title"><div class="calendar-month-heading"><h2 id="calendar-month-title">${heading}</h2><div><button type="button" data-calendar-action="previous" aria-label="${calendarText("Previous month", "ముందు నెల")}" ${month <= "1901-01" ? "disabled" : ""}>←</button><button type="button" data-calendar-action="next" aria-label="${calendarText("Next month", "తరువాతి నెల")}" ${month >= "2099-12" ? "disabled" : ""}>→</button></div></div><p class="calendar-note">${calendarText("Tap a date for its timings. Each cell shows the calculated tithi at local sunrise. S = Shukla; K = Krishna. A tithi can repeat or be skipped between sunrises.", "సమయాల కోసం తేదీని నొక్కండి. గడిలో స్థానిక సూర్యోదయానికి గణించిన తిథి ఉంది. శు. = శుక్ల; కృ. = కృష్ణ. సూర్యోదయాల మధ్య తిథి పునరావృతం కావచ్చు లేదా దాటవచ్చు.")}</p><table class="calendar-grid"><caption class="sr-only">${heading} · ${calendarEscape(place.name)} · ${calendarText("Calculated tithis", "గణించిన తిథులు")}</caption><thead><tr>${weekdays.map((day) => `<th scope="col">${day}</th>`).join("")}</tr></thead><tbody>${Array.from({ length: slots.length / 7 }, (_, row) => `<tr>${slots.slice(row * 7, row * 7 + 7).map((cell) => {
    if (!cell) return "<td></td>";
    if (cell.unavailable) return `<td><button type="button" disabled aria-label="${calendarEscape(cell.key)} · ${calendarText("Date skipped by this timezone", "ఈ కాలమండలంలో దాటిన తేదీ")}"><span class="calendar-day-number">${cell.day}</span><span class="calendar-cell-tithi">${calendarText("Date skipped", "దాటిన తేదీ")}</span></button></td>`;
    const prefix = cell.tithi >= 15 ? calendarText("K", "కృ.") : calendarText("S", "శు.");
    return `<td><button type="button" data-calendar-date="${cell.key}" aria-pressed="${cell.key === selected}" ${cell.key === today ? 'aria-current="date"' : ""} aria-label="${calendarEscape(`${calendarDateLabel(cell.key)} · ${panchangTithiName(cell.tithi, calendarLanguage)}`)}"><span class="calendar-day-number">${cell.day}</span><span class="calendar-cell-tithi">${prefix} ${calendarEscape(panchangTithiName(cell.tithi, calendarLanguage, false))}</span></button></td>`;
  }).join("")}</tr>`).join("")}</tbody></table><p class="calendar-note">${calendarText("Approximate Telugu amanta calendar, not a verified festival almanac.", "సుమారు తెలుగు అమాంత క్యాలెండర్; నిర్ధారించిన పండుగల పంచాంగం కాదు.")}</p></section>`;
}

function calendarDayMarkup() {
  const { data, place, selected, today } = calendarState;
  if (!data) return "";
  const periods = data.periods;
  const row = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
  const solarStatus = selected !== today
    ? calendarText("Solar timings for this selected date are calculated locally. Online updates are requested for today only.", "ఈ తేదీ సూర్య సమయాలు స్థానికంగా గణించినవి. ఆన్‌లైన్ సమాచారం ఈరోజుకే కోరుతాం.")
    : calendarState.loading
      ? calendarText("Checking online sunrise/sunset… Calculated values are shown while loading.", "ఆన్‌లైన్ సూర్య సమయాలు చూస్తున్నాం… అప్పటివరకు గణించిన వివరాలు చూపుతున్నాం.")
      : calendarState.solarError
        ? `${calendarText("Online solar update unavailable; using calculated values.", "ఆన్‌లైన్ సూర్య సమాచారం అందలేదు; గణించిన వివరాలు చూపుతున్నాం.")} ${calendarState.solarError}`
        : calendarState.updatedAt
          ? `${calendarText("Sunrise/sunset refreshed from Open-Meteo:", "Open-Meteo నుంచి సూర్య సమయాలు నవీకరించాం:")} ${calendarFormatTime(calendarState.updatedAt, place, selected)}.`
          : calendarText("Calculated solar timings. Select Refresh to check online data.", "గణించిన సూర్య సమయాలు. ఆన్‌లైన్ కోసం నవీకరించండి నొక్కండి.");
  const monthName = `${data.month.adhika ? calendarText("Adhika ", "అధిక ") : ""}${calendarName(panchangNames.month[data.month.index])}`;
  return `<section class="calendar-day" aria-labelledby="calendar-day-title"><h2 id="calendar-day-title">${calendarDateLabel(selected)}</h2><p class="calendar-lunar-date">${calendarEscape(monthName)} · ${calendarEscape(panchangTithiName(data.tithis[0].index, calendarLanguage))}</p><p class="calendar-note">${calendarText("Timings use the selected city’s timezone, including daylight-saving changes. Lunar details below begin at local sunrise, not midnight.", "సమయాలు ఎంచుకున్న నగర కాలమండలం, డేలైట్ సేవింగ్ మార్పులతో చూపుతాం. కింద చంద్ర వివరాలు అర్ధరాత్రి కాక స్థానిక సూర్యోదయానికి మొదలవుతాయి.")}</p>${data.month.uncertain ? `<p class="calendar-error">${calendarText("An unusual lunar-month transition needs verification in the published calendar.", "అసాధారణ మాస మార్పును ప్రచురిత క్యాలెండర్‌లో నిర్ధారించండి.")}</p>` : ""}<dl class="calendar-facts">${row(calendarText("Sunrise", "సూర్యోదయం"), calendarFormatTime(data.solar.sunrise, place, selected))}${row(calendarText("Sunset", "సూర్యాస్తమయం"), calendarFormatTime(data.solar.sunset, place, selected))}${row(calendarText("Tithi · approximate", "తిథి · సుమారు"), calendarTransitionList(data.tithis, "tithi"))}${row(calendarText("Nakshatram · approximate", "నక్షత్రం · సుమారు"), calendarTransitionList(data.nakshatras, "nakshatra"))}</dl><p class="${calendarState.solarError && selected === today ? "calendar-error" : "calendar-note"}" role="status">${calendarEscape(solarStatus)}</p>${!periods ? `<p class="calendar-error">${calendarText("A local sunrise and sunset could not both be found (for example, polar day/night). Daylight-based auspicious and avoidance periods are unavailable. Lunar values use local noon when sunrise is unavailable.", "స్థానిక సూర్యోదయం, అస్తమయం రెండూ దొరకలేదు (ఉదా. ధ్రువ పగలు/రాత్రి). పగలు ఆధారిత శుభ, నివారణ సమయాలు అందుబాటులో లేవు. సూర్యోదయం లేకపోతే చంద్ర వివరాలకు స్థానిక మధ్యాహ్నం ఉపయోగించాం.")}</p>` : `<h3>${calendarText("Shubha gadiyalu · indicative only", "శుభ ఘడియలు · సూచన మాత్రమే")}</h3><p class="calendar-note">${calendarText("Daytime Choghadiya: Amrit, Shubh, and Labh, excluding overlapping Rahukalam, Yamagandam, and Gulika. This is one timing convention, not Telugu Amrita Kalam, Varjyam checking, or a personal muhurtham.", "పగటి చౌఘడియా: అమృత్, శుభ్, లాభ్ సమయాలలో రాహుకాలం, యమగండం, గుళికతో కలిసిన భాగాలు తీసివేశాం. ఇది ఒక సమయ పద్ధతి మాత్రమే; తెలుగు అమృతకాలం, వర్జ్య పరిశీలన లేదా వ్యక్తిగత ముహూర్తం కాదు.")}</p><ul class="calendar-periods">${periods.auspicious.length ? periods.auspicious.map((period) => `<li><strong>${calendarName({ amrit: ["Amrit", "అమృత్"], shubh: ["Shubh", "శుభ్"], labh: ["Labh", "లాభ్"] }[period.name])}</strong><span>${calendarRange(period)}</span></li>`).join("") : `<li>${calendarText("No remaining daytime intervals under this convention.", "ఈ పద్ధతిలో మిగిలిన పగటి సమయాలు లేవు.")}</li>`}</ul><dl class="calendar-facts">${row(calendarText("Abhijit · approximate", "అభిజిత్ · సుమారు"), periods.abhijit ? calendarRange(periods.abhijit) : calendarText("Not listed on Wednesday in this convention.", "ఈ పద్ధతిలో బుధవారం చూపించరు."))}</dl><h3>${calendarText("Daily avoidance periods", "నివారించాల్సిన రోజువారీ సమయాలు")}</h3><dl class="calendar-facts">${row(calendarText("Rahukalam", "రాహుకాలం"), calendarRange(periods.rahu))}${row(calendarText("Yamagandam", "యమగండం"), calendarRange(periods.yamaganda))}${row(calendarText("Gulika", "గుళిక"), calendarRange(periods.gulika))}</dl><p class="calendar-note">${calendarText("These are the requested daily periods, not Rahu/Ketu planetary positions. Daylight is divided into eight parts using the selected date’s sunrise and sunset.", "ఇవి కోరిన రోజువారీ సమయాలు; రాహు/కేతు గ్రహస్థానాలు కావు. ఆ తేదీ సూర్యోదయం నుంచి అస్తమయం వరకు పగటిని ఎనిమిది భాగాలు చేశాం.")}</p>`}</section>`;
}

function calendarPageMarkup() {
  const { place } = calendarState;
  return `<div class="topic-intro"><h1 id="page-title">${calendarText("Today & Telugu calendar", "ఈరోజు, తెలుగు క్యాలెండర్")}</h1><p class="intro-copy">${calendarText("Austin, TX is the default location. Choose another city or optionally use your device location for local sunrise, sunset, tithi, nakshatram, and daily timing periods.", "ఆస్టిన్, టెక్సాస్ డిఫాల్ట్ ప్రదేశం. స్థానిక సూర్యోదయం, అస్తమయం, తిథి, నక్షత్రం, రోజువారీ సమయాల కోసం మరో నగరాన్ని ఎంచుకోండి లేదా ఐచ్ఛికంగా మీ పరికర ప్రదేశాన్ని ఉపయోగించండి.")}</p></div><p class="reader-notice">${calendarText("Approximate calculated Panchang—not a live temple Panchang feed. Only sunrise/sunset are refreshed online. Verify religious dates and muhurthams with a published calendar or your Guruswamy.", "ఇది సుమారు గణించిన పంచాంగం; ఆలయ ప్రత్యక్ష పంచాంగ సమాచారం కాదు. సూర్యోదయం/అస్తమయం మాత్రమే ఆన్‌లైన్‌లో నవీకరిస్తాం. పూజ తేదీలు, ముహూర్తాలను ప్రచురిత క్యాలెండర్ లేదా గురుస్వామితో నిర్ధారించండి.")}</p>${calendarLocationForm()}${calendarState.error ? `<p class="calendar-error" role="alert">${calendarEscape(calendarState.error)}</p>` : ""}${place && calendarState.data ? `<div class="calendar-day-actions"><label for="calendar-date">${calendarText("Reading date", "చూసే తేదీ")}<input id="calendar-date" type="date" value="${calendarState.selected}" min="1901-01-01" max="2099-12-31"></label><button type="button" data-calendar-action="today">${calendarText("Today", "ఈరోజు")}</button><button type="button" data-calendar-action="refresh" ${calendarState.loading ? "disabled" : ""}>${calendarText("Refresh online solar data", "ఆన్‌లైన్ సూర్య సమాచారం నవీకరించండి")}</button></div>${calendarDayMarkup()}${calendarMonthMarkup()}` : ""}${calendarSourceLinks()}`;
}

export function calendarContent(language) {
  calendarLanguage = language;
  return `<div id="calendar-page">${calendarPageMarkup()}</div>`;
}

export function calendarSummary(language) {
  calendarLanguage = language;
  const { place, todayData, today } = calendarState;
  if (!place || !todayData) return `<aside id="calendar-summary" class="calendar-summary"><strong>${calendarText("Today’s Panchang", "ఈరోజు పంచాంగం")}</strong><a href="#topic=calendar&lang=${language}">${calendarText("Choose your location for timings & Telugu calendar", "సమయాలు, తెలుగు క్యాలెండర్ కోసం ప్రదేశాన్ని ఎంచుకోండి")} →</a></aside>`;
  const now = panchangLunarAt(new Date());
  const online = todayData.solar.source === "online";
  return `<aside id="calendar-summary" class="calendar-summary"><strong>${calendarText("Today", "ఈరోజు")} · ${calendarEscape(place.name)}</strong><span>${calendarText("Sunrise", "సూర్యోదయం")} ${calendarFormatTime(todayData.solar.sunrise, place, today)} · ${calendarText("Sunset", "అస్తమయం")} ${calendarFormatTime(todayData.solar.sunset, place, today)}</span><span>${calendarEscape(panchangTithiName(now.tithi, language))} · ${calendarEscape(calendarName(panchangNames.nakshatra[now.nakshatra]))} ${calendarText("(now; approximate)", "(ప్రస్తుతం; సుమారు)")}</span><span class="calendar-summary-status">${calendarText("Solar:", "సూర్య సమాచారం:")} ${calendarState.loading ? calendarText("checking online", "ఆన్‌లైన్‌లో చూస్తున్నాం") : online ? calendarText("online update", "ఆన్‌లైన్ నవీకరణ") : calendarText("calculated; online unavailable", "గణించినది; ఆన్‌లైన్ అందలేదు")}</span><a href="#topic=calendar&lang=${language}">${calendarText("Daily timings & Telugu calendar", "రోజువారీ సమయాలు, తెలుగు క్యాలెండర్")} →</a></aside>`;
}

function repaintCalendar() {
  if (typeof document === "undefined") return;
  const focused = document.activeElement;
  const inputId = focused?.matches?.("#calendar-city, #calendar-date") ? focused.id : "";
  const selection = inputId === "calendar-city" ? [focused.selectionStart, focused.selectionEnd] : null;
  const page = document.querySelector("#calendar-page");
  if (page) page.innerHTML = calendarPageMarkup();
  const summary = document.querySelector("#calendar-summary");
  if (summary) summary.outerHTML = calendarSummary(calendarLanguage);
  bindCalendar(calendarLanguage);
  if (inputId) {
    const input = document.getElementById(inputId);
    input?.focus({ preventScroll: true });
    if (selection && input) input.setSelectionRange(...selection);
  }
}

function calculateCalendarSelection() {
  const { place, today, selected, solar, solarDay } = calendarState;
  try {
    calendarState.todayData = calculatePanchang(today, place, solarDay === today ? solar : null);
    calendarState.data = selected === today ? calendarState.todayData : calculatePanchang(selected, place);
    calendarState.error = "";
  } catch (error) {
    console.error("Calendar calculation failed:", error);
    calendarState.data = null;
    calendarState.todayData = null;
    calendarState.error = calendarText("Could not calculate this date. Choose another date or city.", "ఈ తేదీని గణించలేకపోయాం. మరో తేదీ లేదా నగరం ఎంచుకోండి.");
  }
}

async function updateCalendarSolar(force = false) {
  if (!calendarState.place || calendarState.loading || (!force && Date.now() - calendarState.attemptedAt < 6 * 3600000)) return;
  const { place, today, generation } = calendarState;
  calendarState.loading = true;
  calendarState.attemptedAt = Date.now();
  repaintCalendar();
  try {
    const solar = await fetchPanchangSolar(place, today);
    if (generation !== calendarState.generation || today !== calendarState.today) return;
    calendarState.solar = solar;
    calendarState.solarDay = today;
    calendarState.solarError = "";
    calendarState.updatedAt = new Date();
  } catch (error) {
    if (generation !== calendarState.generation || today !== calendarState.today) return;
    console.warn("Online calendar solar update failed:", error);
    calendarState.solar = null;
    calendarState.solarDay = "";
    calendarState.updatedAt = null;
    calendarState.solarError = calendarText("Check your connection and select Refresh to retry.", "ఇంటర్నెట్ చూసి నవీకరించండి నొక్కి మళ్లీ ప్రయత్నించండి.");
  } finally {
    if (generation === calendarState.generation && today === calendarState.today) {
      calendarState.loading = false;
      calculateCalendarSelection();
      repaintCalendar();
    }
  }
}

function selectCalendarPlace(place, save = true) {
  validatePanchangPlace(place);
  calendarState.generation++;
  calendarState.place = place;
  calendarState.today = panchangDateKey(new Date(), place.timeZone);
  calendarState.selected = calendarState.today;
  calendarState.month = calendarState.today.slice(0, 7);
  calendarState.followToday = true;
  calendarState.cities = [];
  calendarState.searching = false;
  calendarState.query = "";
  calendarState.locationError = "";
  calendarState.solar = null;
  calendarState.solarDay = "";
  calendarState.solarError = "";
  calendarState.updatedAt = null;
  calendarState.attemptedAt = 0;
  calendarState.loading = false;
  calendarState.monthCacheKey = "";
  if (save) {
    try {
      localStorage.setItem(calendarLocationKey, JSON.stringify(place));
      calendarState.storageWarning = "";
    } catch (error) {
      console.warn("Could not save calendar location:", error);
      calendarState.storageWarning = calendarText("Location could not be saved; it is available for this visit only.", "ప్రదేశం నిల్వ కాలేదు; ఈ సందర్శనకే ఉంటుంది.");
    }
  }
  calculateCalendarSelection();
  repaintCalendar();
  void updateCalendarSolar(true);
}

function selectCalendarDate(key) {
  try {
    if (key < "1901-01-01" || key > "2099-12-31") throw new Error("Date outside the supported range.");
    panchangDayStart(key, calendarState.place.timeZone);
    calendarState.selected = key;
    calendarState.followToday = key === calendarState.today;
    calendarState.month = key.slice(0, 7);
    calculateCalendarSelection();
  } catch (error) {
    console.warn("Calendar date selection failed:", error);
    calendarState.error = calendarText("Choose a valid date between 1901 and 2099.", "1901 నుంచి 2099 మధ్య సరైన తేదీ ఎంచుకోండి.");
  }
  repaintCalendar();
}

async function locateCalendarVisitor() {
  if (!navigator.geolocation) {
    calendarState.locationError = calendarText("Location access is unavailable in this browser. Search for your city instead.", "ఈ బ్రౌజర్‌లో ప్రదేశ అనుమతి అందుబాటులో లేదు. మీ నగరాన్ని వెతకండి.");
    repaintCalendar();
    return;
  }
  calendarState.locating = true;
  calendarState.searching = false;
  calendarState.locationError = "";
  const generation = ++calendarState.searchGeneration;
  repaintCalendar();
  try {
    const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }));
    const place = await resolvePanchangCoordinates(position.coords.latitude, position.coords.longitude);
    if (generation !== calendarState.searchGeneration) return;
    selectCalendarPlace(place);
  } catch (error) {
    if (generation !== calendarState.searchGeneration) return;
    console.warn("Calendar location access failed:", error);
    calendarState.locationError = calendarText("Could not get your location or its timezone. Allow browser permission and retry, or search for your city.", "మీ ప్రదేశం లేదా కాలమండలం పొందలేకపోయాం. అనుమతి ఇచ్చి మళ్లీ ప్రయత్నించండి లేదా నగరాన్ని వెతకండి.");
  } finally {
    if (generation === calendarState.searchGeneration) {
      calendarState.locating = false;
      repaintCalendar();
    }
  }
}

export function bindCalendar(language) {
  calendarLanguage = language;
  const root = document.querySelector("#calendar-page");
  if (!root) return;
  root.onclick = (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.calendarCity !== undefined) {
      const place = calendarState.cities[Number(button.dataset.calendarCity)];
      if (place) {
        calendarState.searchGeneration++;
        calendarState.locating = false;
        selectCalendarPlace(place);
      }
    } else if (button.dataset.calendarDate) {
      selectCalendarDate(button.dataset.calendarDate);
      const heading = document.querySelector("#calendar-day-title");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: "start" });
      }
    } else {
      const action = button.dataset.calendarAction;
      if (action === "locate") void locateCalendarVisitor();
      if (action === "refresh") void updateCalendarSolar(true);
      if (action === "today") selectCalendarDate(calendarState.today);
      if (action === "previous" || action === "next") {
        const date = new Date(`${calendarState.month}-01T12:00:00Z`);
        date.setUTCMonth(date.getUTCMonth() + (action === "next" ? 1 : -1));
        const month = date.toISOString().slice(0, 7);
        if (month >= "1901-01" && month <= "2099-12") {
          calendarState.month = month;
          repaintCalendar();
          const heading = document.querySelector("#calendar-month-title");
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
          heading.scrollIntoView({ block: "start" });
        }
      }
      if (action === "forget") {
        calendarState.generation++;
        calendarState.searchGeneration++;
        calendarState.place = null;
        calendarState.data = null;
        calendarState.todayData = null;
        calendarState.cities = [];
        calendarState.locating = false;
        calendarState.searching = false;
        calendarState.loading = false;
        calendarState.locationError = "";
        calendarState.error = "";
        try {
          localStorage.removeItem(calendarLocationKey);
          calendarState.storageWarning = "";
        } catch (error) {
          console.warn("Could not forget saved calendar location:", error);
          calendarState.storageWarning = calendarText("Could not reset the saved city. Clear this site’s browser data to remove it.", "నిల్వ నగరాన్ని మార్చలేకపోయాం. తొలగించడానికి ఈ సైట్ బ్రౌజర్ డేటాను తొలగించండి.");
        }
        selectCalendarPlace(defaultCalendarPlace, false);
        repaintCalendar();
      }
    }
  };
  const dateInput = root.querySelector("#calendar-date");
  if (dateInput) dateInput.onchange = (event) => selectCalendarDate(event.target.value);
  const form = root.querySelector("#calendar-city-form");
  form.querySelector("input").oninput = (event) => { calendarState.query = event.target.value; };
  form.onsubmit = async (event) => {
    event.preventDefault();
    calendarState.query = form.querySelector("input").value.trim();
    const generation = ++calendarState.searchGeneration;
    calendarState.searching = true;
    calendarState.locating = false;
    calendarState.locationError = "";
    calendarState.cities = [];
    repaintCalendar();
    try {
      const cities = await searchPanchangCities(calendarState.query);
      if (generation !== calendarState.searchGeneration) return;
      calendarState.cities = cities;
      if (!cities.length) calendarState.locationError = calendarText("No city matched. Try a nearby larger city or another spelling.", "నగరం దొరకలేదు. దగ్గర పెద్ద నగరం లేదా మరో స్పెల్లింగ్ ప్రయత్నించండి.");
    } catch (error) {
      if (generation !== calendarState.searchGeneration) return;
      console.warn("Calendar city search failed:", error);
      calendarState.locationError = calendarText("City search could not load. Check your connection and retry; a previously chosen location still works offline.", "నగర శోధన తెరవలేదు. ఇంటర్నెట్ చూసి మళ్లీ ప్రయత్నించండి; ముందుగా ఎంచుకున్న ప్రదేశం ఆఫ్‌లైన్‌లో పనిచేస్తుంది.");
    } finally {
      if (generation === calendarState.searchGeneration) {
        calendarState.searching = false;
        repaintCalendar();
        root.querySelector(".calendar-city-results button")?.focus();
      }
    }
  };
}

export function startCalendar() {
  if (calendarStarted) return;
  calendarStarted = true;
  try {
    const saved = localStorage.getItem(calendarLocationKey);
    selectCalendarPlace(saved ? validatePanchangPlace(JSON.parse(saved)) : defaultCalendarPlace, false);
  } catch (error) {
    console.warn("Could not read saved calendar location:", error);
    calendarState.storageWarning = calendarText("Saved location could not be read. Austin, TX is being used; choose another city if needed.", "నిల్వ ప్రదేశం చదవలేకపోయాం. ఆస్టిన్, టెక్సాస్ ఉపయోగిస్తున్నాం; అవసరమైతే మరో నగరం ఎంచుకోండి.");
    selectCalendarPlace(defaultCalendarPlace, false);
  }
  const tick = () => {
    if (!calendarState.place) return;
    const key = panchangDateKey(new Date(), calendarState.place.timeZone);
    if (key !== calendarState.today) {
      calendarState.generation++;
      calendarState.today = key;
      if (calendarState.followToday) {
        calendarState.selected = key;
        calendarState.month = key.slice(0, 7);
      }
      calendarState.solar = null;
      calendarState.solarDay = "";
      calendarState.updatedAt = null;
      calendarState.attemptedAt = 0;
      calendarState.loading = false;
      calculateCalendarSelection();
      repaintCalendar();
    }
    const summary = document.querySelector("#calendar-summary");
    if (summary) summary.outerHTML = calendarSummary(calendarLanguage);
    void updateCalendarSolar();
  };
  setInterval(tick, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
  window.addEventListener("online", () => { if (calendarState.place && calendarState.solarError) void updateCalendarSolar(true); });
}
