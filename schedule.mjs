const authenticatedContext = new TextEncoder().encode("ayyappa-schedule-v1");

export async function decryptSchedule(passphrase, payload) {
  if (!passphrase || typeof passphrase !== "string") throw new Error("empty-passphrase");
  if (
    payload?.version !== 1 ||
    payload.cipher !== "AES-256-GCM" ||
    payload.kdf !== "PBKDF2-SHA-256" ||
    payload.iterations !== 600000 ||
    !/^[0-9a-f]{32}$/i.test(payload.salt || "") ||
    !/^[0-9a-f]{24}$/i.test(payload.iv || "") ||
    typeof payload.ciphertext !== "string"
  ) throw new Error("invalid-ciphertext");

  const salt = hexBytes(payload.salt);
  const iv = hexBytes(payload.iv);
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: payload.iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  let cleartext;
  try {
    cleartext = await crypto.subtle.decrypt({
      name: "AES-GCM", iv, additionalData: authenticatedContext, tagLength: 128,
    }, key, base64Bytes(payload.ciphertext));
  } catch (error) {
    if (error.name === "OperationError") throw new Error("invalid-passphrase");
    throw error;
  }

  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(cleartext));
  } catch {
    throw new Error("invalid-ciphertext");
  }
  if (!Array.isArray(rows) || rows.some(row =>
    !row || typeof row !== "object" ||
    ["name", "address", "date", "day", "period", "time", "puja", "evite", "priest", "volunteers"]
      .some(key => typeof row[key] !== "string")
  )) throw new Error("invalid-ciphertext");
  return rows;
}

export async function loadScheduleCipher() {
  const inline = document.querySelector("#swami-schedule-cipher");
  if (inline) return parseCipher(inline.textContent);
  let response;
  try {
    response = await fetch("./swami-schedule.enc.json", { cache: "no-store" });
  } catch {
    throw new Error("schedule-unavailable");
  }
  if (!response.ok) throw new Error("schedule-unavailable");
  return parseCipher(await response.text());
}

export function renderSchedule(language, rows, options = {}) {
  const te = language === "te";
  const t = (en, telugu) => te ? telugu : en;
  const heading = rows ? t("Swami Pooja Schedule", "స్వామి పూజా షెడ్యూల్") : t("Swami Pooja Schedule", "స్వామి పూజా షెడ్యూల్");
  const intro = t(
    "A read-only schedule for Swamies and hosts. Dates are shown as listed in the source; the year is not specified.",
    "స్వాములు, ఆతిథ్యుల కోసం చదవడానికి మాత్రమే షెడ్యూల్. మూలంలో ఉన్న తేదీలనే చూపిస్తున్నాం; సంవత్సరం ఇవ్వలేదు.",
  );
  if (options.loading) {
    return `<section class="schedule-page"><h1 id="page-title">${heading}</h1><p>${escapeSchedule(intro)}</p><p role="status">${t("Unlocking the schedule…", "షెడ్యూల్ తెరుస్తున్నాం…")}</p></section>`;
  }
  if (!rows) {
    const error = options.error
      ? `<p class="schedule-error" id="schedule-error" role="alert">${options.error === "invalid-passphrase"
        ? t("That passphrase did not unlock the schedule. Check it and try again.", "ఈ పాస్‌ఫ్రేజ్‌తో షెడ్యూల్ తెరవలేదు. సరిచూసి మళ్లీ ప్రయత్నించండి.")
        : options.error === "schedule-unavailable"
          ? t("The encrypted schedule could not be loaded. Check your connection and try again.", "గుప్తీకరించిన షెడ్యూల్ లోడ్ కాలేదు. ఇంటర్నెట్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.")
          : t("The encrypted schedule could not be read. Contact the organizer for an updated copy.", "గుప్తీకరించిన షెడ్యూల్ చదవలేకపోయాం. కొత్త కాపీ కోసం నిర్వాహకుడిని సంప్రదించండి.")}</p>` : "";
    return `<section class="schedule-page"><h1 id="page-title">${heading}</h1><p class="schedule-intro">${escapeSchedule(intro)}</p><p class="schedule-privacy">${t("Enter the shared passphrase to view the table. The schedule is encrypted in the public website files; the passphrase is not saved or put in the URL.", "పట్టిక చూడటానికి పంచుకున్న పాస్‌ఫ్రేజ్ నమోదు చేయండి. షెడ్యూల్ వెబ్‌సైట్ ఫైళ్లలో గుప్తీకరించి ఉంది; పాస్‌ఫ్రేజ్ నిల్వ చేయము లేదా URLలో చేర్చము.")}</p>${error}<form id="schedule-unlock-form" class="schedule-unlock"><label for="schedule-passphrase">${t("Shared passphrase", "పంచుకున్న పాస్‌ఫ్రేజ్")}</label><div><input id="schedule-passphrase" name="passphrase" type="password" autocomplete="current-password" required aria-describedby="schedule-unlock-help"${options.error ? ' aria-invalid="true" aria-describedby="schedule-error schedule-unlock-help"' : ""}><button type="submit">${t("Unlock schedule", "షెడ్యూల్ తెరవండి")}</button></div><p id="schedule-unlock-help">${t("Ask the organizer for the passphrase. This page contains no link back to the source spreadsheet.", "నిర్వాహకుడిని పాస్‌ఫ్రేజ్ అడగండి. ఈ పేజీలో మూల స్ప్రెడ్‌షీట్‌కు లింకు లేదు.")}</p></form></section>`;
  }

  const rowsMarkup = rows.map((row, index) => {
    const name = row.name || t("Name not listed", "పేరు ఇవ్వలేదు");
    const address = row.address || t("Not listed", "ఇవ్వలేదు");
    const date = row.date || t("Not listed", "ఇవ్వలేదు");
    const day = row.day || t("Not listed", "ఇవ్వలేదు");
    const time = [row.period, row.time].filter(Boolean).join(" · ") || t("Not listed", "ఇవ్వలేదు");
    const puja = row.puja || t("Not selected", "ఎంచుకోలేదు");
    const evite = safeInvite(row.evite);
    const priest = row.priest || t("Not assigned", "కేటాయించలేదు");
    const volunteers = row.volunteers || t("Not listed", "ఇవ్వలేదు");
    const values = [
      ["Swami name", "స్వామి పేరు", name],
      ["Address", "చిరునామా", address],
      ["Date", "తేదీ", date],
      ["Day", "వారం రోజు", day],
      ["Time", "సమయం", time],
      ["Host-selected puja", "ఆతిథ్యులు ఎంచుకున్న పూజ", puja],
      ["Evite", "ఆహ్వానం", evite
        ? `<a href="${escapeSchedule(evite)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeSchedule(t(`Open Evite for ${name}`, `${name} కోసం Evite తెరవండి`))}">${t("Open Evite", "Evite తెరవండి")}</a>`
        : t("Not listed", "ఇవ్వలేదు"), Boolean(evite)],
      ["Priest", "పూజారి", priest],
      ["Volunteers", "సేవకులు", volunteers],
    ];
    const searchable = values.map(([, , value]) => value.replace(/<[^>]*>/g, " ")).join(" ").toLocaleLowerCase();
    return `<tr data-schedule-row="${index + 1}" data-search="${escapeSchedule(searchable)}">${values.map(([label, teluguLabel, value, isLink = false]) => `<td data-label="${escapeSchedule(t(label, teluguLabel))}">${isLink ? value : escapeSchedule(value)}</td>`).join("")}</tr>`;
  }).join("");
  return `<section class="schedule-page"><div class="schedule-heading"><div><h1 id="page-title">${heading}</h1><p class="schedule-intro">${escapeSchedule(intro)}</p></div><button type="button" id="schedule-lock">${t("Lock schedule", "షెడ్యూల్ లాక్ చేయండి")}</button></div><label class="schedule-search-label" for="schedule-filter">${t("Find a Swami, address, puja, priest, or volunteer", "స్వామి, చిరునామా, పూజారి లేదా సేవకుడి కోసం వెతకండి")}</label><input id="schedule-filter" type="search" autocomplete="off" aria-controls="swami-schedule-table"><p id="schedule-row-count" role="status">${rows.length} ${t("schedule entries · source order", "షెడ్యూల్ వివరాలు · మూల క్రమంలో")}</p><div class="schedule-table-scroll" role="region" aria-label="${escapeSchedule(t("Swami pooja schedule table", "స్వామి పూజా షెడ్యూల్ పట్టిక"))}" tabindex="0"><table id="swami-schedule-table" class="swami-schedule-table"><caption>${escapeSchedule(t("Read-only schedule · times and spellings are preserved from the source", "చదవడానికి మాత్రమే · మూలంలోని సమయాలు, పేర్ల వ్రాత అలాగే ఉన్నాయి"))}</caption><thead><tr>${["Swami name", "Address", "Date", "Day", "Time", "Pooja option selected by host", "Evite", "Priest name", "Volunteers"].map((label, index) => `<th scope="col">${escapeSchedule(t(label, ["స్వామి పేరు", "చిరునామా", "తేదీ", "వారం రోజు", "సమయం", "ఆతిథ్యులు ఎంచుకున్న పూజ", "ఆహ్వానం", "పూజారి పేరు", "సేవకులు"][index]))}</th>`).join("")}</tr></thead><tbody>${rowsMarkup}</tbody></table></div><p id="schedule-empty" class="schedule-empty" hidden>${t("No entries match. Try a different search.", "సరిపోలే వివరాలు లేవు. మరో పదంతో వెతకండి.")}</p></section>`;
}

function parseCipher(source) {
  let payload;
  try {
    payload = JSON.parse(source);
  } catch {
    throw new Error("invalid-ciphertext");
  }
  if (!payload || typeof payload !== "object") throw new Error("invalid-ciphertext");
  return payload;
}

function safeInvite(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function hexBytes(value) {
  return Uint8Array.from(value.match(/.{2}/g), byte => Number.parseInt(byte, 16));
}

function base64Bytes(value) {
  let binary;
  try {
    binary = atob(value);
  } catch {
    throw new Error("invalid-ciphertext");
  }
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function escapeSchedule(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}
