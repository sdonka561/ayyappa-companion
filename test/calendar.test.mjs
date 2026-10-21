import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import * as panchang from "../public/panchang.mjs";

const hyderabad = { name: "Hyderabad", latitude: 17.38, longitude: 78.46, timeZone: "Asia/Kolkata", geonameId: 1269843 };
const dallas = { name: "Dallas", latitude: 32.78, longitude: -96.8, timeZone: "America/Chicago" };
const settle = async () => { await new Promise((resolve) => setImmediate(resolve)); };

async function calendarHarness({ saved = null, solar, storageBlocked = false, geolocation } = {}) {
  const script = (await readFile(new URL("../public/calendar.mjs", import.meta.url), "utf8")).replace(/^import .*;\r?\n/gm, "").replace(/^export /gm, "");
  let now = Date.parse("2026-10-21T10:00:00Z");
  const events = {};
  const calls = [];
  const store = new Map(saved ? [["ayyappa-calendar-place-v1", saved]] : []);
  class CalendarDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const api = runInNewContext(`${script}
    ({ calendarContent, calendarSummary, calendarFormatTime, startCalendar, selectCalendarPlace, selectCalendarDate, updateCalendarSolar, locateCalendarVisitor,
       state: calendarState })`, {
    ...panchang,
    Date: CalendarDate, URL, URLSearchParams,
    console: { warn() {}, error() {} },
    localStorage: {
      getItem(key) { if (storageBlocked) throw new Error("blocked"); return store.get(key) || null; },
      setItem(key, value) { if (storageBlocked) throw new Error("blocked"); store.set(key, value); },
      removeItem(key) { if (storageBlocked) throw new Error("blocked"); store.delete(key); },
    },
    document: { querySelector: () => null, hidden: false, addEventListener: (event, callback) => { events[event] = callback; } },
    window: { addEventListener: (event, callback) => { events[event] = callback; } },
    navigator: { geolocation },
    setInterval(callback, delay) { assert.equal(delay, 60000); events.tick = callback; },
    fetchPanchangSolar: async (place, key) => {
      calls.push({ place, key });
      if (solar) return solar(place, key);
      const result = panchang.panchangSolar(key, place);
      return { sunrise: result.sunrise, sunset: result.sunset, nextSunrise: result.nextSunrise, previousSunset: result.previousSunset };
    },
  });
  return { ...api, calls, store, events, setNow: (iso) => { now = Date.parse(iso); } };
}

test("calendar never assumes a city, requests geolocation, or fetches solar data before location selection", async () => {
  let geolocationRequests = 0;
  const calendar = await calendarHarness({ geolocation: { getCurrentPosition() { geolocationRequests++; } } });
  calendar.startCalendar();
  await settle();
  assert.equal(calendar.state.place, null);
  assert.equal(calendar.calls.length, 0);
  assert.equal(geolocationRequests, 0);
  const en = calendar.calendarContent("en");
  assert.match(en, /No city or timezone is assumed/);
  assert.match(en, /id="calendar-city"/);
  assert.match(en, /data-calendar-action="locate"/);
  assert.match(en, /Approximate calculated Panchang/);
  const te = calendar.calendarContent("te");
  assert.match(te, /తెలుగు క్యాలెండర్/);
  assert.match(te, /0\.01°/);
  assert.doesNotMatch(te, /class="calendar-grid"/);
});

test("selected city provides all daily values, complete month, source attribution and no location in shared URLs", async () => {
  const calendar = await calendarHarness();
  calendar.selectCalendarPlace(hyderabad);
  await settle();
  assert.equal(calendar.state.data.solar.source, "online");
  const html = calendar.calendarContent("en");
  for (const value of ["Sunrise", "Sunset", "Tithi", "Nakshatram", "Shubha gadiyalu", "Rahukalam", "Yamagandam", "Gulika", "Ashwayujam", "amanta"]) {
    assert.ok(html.includes(value), value);
  }
  assert.equal((html.match(/data-calendar-date=/g) || []).length, 31);
  assert.equal((html.match(/aria-current="date"/g) || []).length, 1);
  assert.match(html, /refreshed from Open-Meteo/);
  assert.match(html, /geoname-id=1269843/);
  assert.match(html, /not Telugu Amrita Kalam/);
  assert.match(html, /personal muhurtham/);
  const summary = calendar.calendarSummary("en");
  assert.match(summary, /now; approximate/);
  assert.match(summary, /online update/);
  assert.doesNotMatch(summary, /#topic=calendar[^"]*(?:latitude|longitude|place|timeZone)/);
  assert.ok(calendar.store.has("ayyappa-calendar-place-v1"));
  const telugu = calendar.calendarContent("te");
  for (const value of ["సూర్యోదయం", "సూర్యాస్తమయం", "తిథి", "నక్షత్రం", "శుభ ఘడియలు", "రాహుకాలం", "యమగండం", "గుళిక", "ఆశ్వయుజం"]) assert.ok(telugu.includes(value), value);
  assert.match(calendar.calendarFormatTime(new Date("2026-10-22T01:00:00Z"), hyderabad, "2026-10-21"), /\(/, "next-day timings visibly identify the date");
});

test("online failure stays explicit, calculated values remain usable, and a manual retry recovers", async () => {
  let offline = true;
  const calendar = await calendarHarness({ solar: (place, key) => {
    if (offline) throw new Error("offline");
    return panchang.panchangSolar(key, place);
  } });
  calendar.selectCalendarPlace(hyderabad);
  await settle();
  assert.equal(calendar.state.data.solar.source, "calculated");
  assert.match(calendar.calendarContent("en"), /Online solar update unavailable; using calculated values/);
  assert.match(calendar.calendarSummary("en"), /online unavailable/);
  offline = false;
  await calendar.updateCalendarSolar(true);
  assert.equal(calendar.state.data.solar.source, "online");
  assert.equal(calendar.state.solarError, "");
  assert.match(calendar.calendarContent("en"), /refreshed from Open-Meteo/);
});

test("location and date changes discard an older in-flight solar response", async () => {
  const pending = [];
  const calendar = await calendarHarness({ solar: (place, key) => new Promise((resolve) => pending.push({ place, key, resolve })) });
  calendar.selectCalendarPlace(hyderabad);
  calendar.selectCalendarPlace(dallas);
  assert.equal(pending.length, 2);
  pending[1].resolve(panchang.panchangSolar(pending[1].key, dallas));
  await settle();
  const newerRise = calendar.state.data.solar.sunrise.getTime();
  pending[0].resolve(panchang.panchangSolar(pending[0].key, hyderabad));
  await settle();
  assert.equal(calendar.state.place.name, "Dallas");
  assert.equal(calendar.state.data.solar.sunrise.getTime(), newerRise);
  assert.equal(calendar.state.loading, false);
});

test("refresh uses selected-city midnight, runs every six hours, and preserves a deliberately selected date", async () => {
  const calendar = await calendarHarness({ saved: JSON.stringify(dallas) });
  calendar.setNow("2026-10-21T04:59:00Z");
  calendar.startCalendar();
  await settle();
  assert.equal(calendar.state.today, "2026-10-20");
  const firstRequests = calendar.calls.length;
  calendar.events.tick();
  await settle();
  assert.equal(calendar.calls.length, firstRequests, "minute ticks do not repeatedly fetch");
  calendar.setNow("2026-10-21T05:01:00Z");
  calendar.events.tick();
  await settle();
  assert.equal(calendar.state.today, "2026-10-21");
  assert.equal(calendar.state.selected, "2026-10-21");
  assert.equal(calendar.calls.at(-1).key, "2026-10-21");
  calendar.selectCalendarDate("2026-10-18");
  assert.equal(calendar.state.data.solar.source, "calculated");
  assert.match(calendar.calendarContent("en"), /Online updates are requested for today only/);
  calendar.setNow("2026-10-22T05:01:00Z");
  calendar.events.visibilitychange();
  await settle();
  assert.equal(calendar.state.today, "2026-10-22");
  assert.equal(calendar.state.selected, "2026-10-18", "midnight does not replace a chosen historical date");
  const midnightRequests = calendar.calls.length;
  calendar.setNow("2026-10-22T11:02:00Z");
  calendar.events.tick();
  await settle();
  assert.equal(calendar.calls.length, midnightRequests + 1);
  calendar.selectCalendarDate("bad-date");
  assert.match(calendar.state.error, /valid date/);
});

test("saved location failures and denied location permission provide visible recovery", async () => {
  const blocked = await calendarHarness({ storageBlocked: true });
  blocked.startCalendar();
  assert.match(blocked.calendarContent("en"), /Saved location could not be read/);
  blocked.selectCalendarPlace(hyderabad);
  await settle();
  assert.match(blocked.calendarContent("en"), /could not be saved/);
  assert.equal(blocked.state.data.key, "2026-10-21");
  const corrupt = await calendarHarness({ saved: '{"latitude":999}' });
  corrupt.startCalendar();
  assert.equal(corrupt.state.place, null);
  assert.match(corrupt.calendarContent("en"), /Choose a city again/);
  const denied = await calendarHarness({ geolocation: { getCurrentPosition(resolve, reject) { reject(new Error("denied")); } } });
  await denied.locateCalendarVisitor();
  assert.match(denied.calendarContent("en"), /search for your city/);
  assert.equal(denied.state.locating, false);
  const unavailable = await calendarHarness();
  await unavailable.locateCalendarVisitor();
  assert.match(unavailable.calendarContent("en"), /Location access is unavailable/);
});

test("portable build includes licensed astronomy, calendar calculations, UI, and eight application imports are bundled", async () => {
  const portable = await readFile(new URL("../public/ayyappa-companion.html", import.meta.url), "utf8");
  for (const marker of ["const PanchangAstronomy", "function calculatePanchang", "function startCalendar", "id=\"calendar-page\"", "https://api.open-meteo.com", "MIT License"]) assert.ok(portable.includes(marker), marker);
  assert.doesNotMatch(portable, /^import .* from "\.\/(?:astronomy|panchang|calendar)\.mjs"/m);
  const app = await readFile(new URL("../public/app.mjs", import.meta.url), "utf8");
  assert.match(app, /if \(active === "calendar"\) return calendarContent\(lang\)/);
  assert.match(app, /startCalendar\(\)/);
  assert.match(app, /calendarSummary\(lang\)/);
});
