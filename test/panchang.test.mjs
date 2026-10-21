import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  panchangDateKey, panchangAddDays, panchangLocalTime, panchangDayStart, validatePanchangPlace, panchangSolar,
  panchangLunarAt, panchangTithiName, panchangLunarMonth, panchangPeriods, calculatePanchang,
  panchangMonthCells, parsePanchangSolar, searchPanchangCities, fetchPanchangSolar, resolvePanchangCoordinates,
} from "../public/panchang.mjs";

const hyderabad = { name: "Hyderabad", latitude: 17.38, longitude: 78.46, timeZone: "Asia/Kolkata", geonameId: 1269843 };
const dallas = { name: "Dallas", latitude: 32.78, longitude: -96.8, timeZone: "America/Chicago" };
const solarPayload = () => ({
  latitude: 17.398945, longitude: 78.457085, timezone: "Asia/Kolkata",
  daily_units: { sunrise: "unixtime", sunset: "unixtime" },
  daily: { sunrise: [1792456831, 1792543249, 1792629666], sunset: [1792498875, 1792585237, 1792671600] },
});
const minuteDifference = (date, iso) => Math.abs(date.getTime() - Date.parse(iso)) / 60000;

test("calendar dates and local midnight respect city timezone, DST, and leap days", () => {
  assert.equal(panchangDateKey(new Date("2026-10-21T01:00:00Z"), dallas.timeZone), "2026-10-20");
  assert.equal(panchangDateKey(new Date("2026-10-21T01:00:00Z"), hyderabad.timeZone), "2026-10-21");
  assert.equal(panchangLocalTime("2026-10-21", hyderabad.timeZone).toISOString(), "2026-10-20T18:30:00.000Z");
  assert.equal((panchangLocalTime("2026-03-09", dallas.timeZone) - panchangLocalTime("2026-03-08", dallas.timeZone)) / 3600000, 23);
  assert.equal((panchangLocalTime("2026-11-02", dallas.timeZone) - panchangLocalTime("2026-11-01", dallas.timeZone)) / 3600000, 25);
  assert.equal(panchangAddDays("2024-02-28", 1), "2024-02-29");
  assert.equal(panchangAddDays("2026-12-31", 1), "2027-01-01");
  for (const value of ["bad", "2026-02-30", "2026-13-01"]) {
    assert.throws(() => panchangLocalTime(value, dallas.timeZone));
    assert.throws(() => panchangAddDays(value, 1));
  }
  assert.throws(() => panchangLocalTime("2026-10-21", "invalid/timezone"));
  assert.throws(() => validatePanchangPlace({ ...hyderabad, latitude: 91 }));
  assert.throws(() => validatePanchangPlace({ ...hyderabad, longitude: NaN }));
  assert.throws(() => validatePanchangPlace({ ...hyderabad, name: "" }));
});

test("approximate lunar results agree with the published Hyderabad reference on 21 October 2026", () => {
  // Reference checked online: https://www.prokerala.com/astrology/telugu-panchangam/2026-october-21.html
  const day = calculatePanchang("2026-10-21", hyderabad);
  assert.deepEqual(day.tithis.map((entry) => entry.index), [9, 10]);
  assert.deepEqual(day.nakshatras.map((entry) => entry.index), [22, 23]);
  assert.ok(minuteDifference(day.tithis[0].end, "2026-10-21T08:42:00Z") < 5);
  assert.ok(minuteDifference(day.nakshatras[0].end, "2026-10-21T14:17:00Z") < 10);
  assert.equal(day.month.index, 6, "Ashwayujam");
  assert.equal(day.month.adhika, false);
  assert.ok(minuteDifference(day.solar.sunrise, "2026-10-21T00:44:00Z") < 5, "sunrise definitions differ by minutes");
  assert.ok(minuteDifference(day.solar.sunset, "2026-10-21T12:17:00Z") < 5);
  assert.equal(panchangLunarAt(new Date("2026-10-21T08:00:00Z")).tithi, 9);
  assert.equal(panchangLunarAt(new Date("2026-10-21T09:00:00Z")).tithi, 10);
  assert.match(panchangTithiName(9, "en"), /Shukla paksha Dasami/);
  assert.equal(panchangTithiName(29, "te", false), "అమావాస్య");
  assert.equal(panchangTithiName(14, "te", false), "పౌర్ణమి");
  assert.throws(() => panchangTithiName(30));
});

test("midnight DST gaps and an entirely skipped civil date are not fabricated", () => {
  const brazil = { name: "Sao Paulo", latitude: -23.55, longitude: -46.63, timeZone: "America/Sao_Paulo" };
  assert.equal(panchangDateKey(panchangDayStart("2018-11-04", brazil.timeZone), brazil.timeZone), "2018-11-04");
  assert.equal(panchangDateKey(calculatePanchang("2018-11-04", brazil).solar.sunrise, brazil.timeZone), "2018-11-04");
  const apia = { name: "Apia", latitude: -13.83, longitude: -171.75, timeZone: "Pacific/Apia" };
  const cells = panchangMonthCells("2011-12", apia);
  assert.equal(cells[29].unavailable, true);
  assert.equal(cells[30].unavailable, undefined);
  const dayBefore = calculatePanchang("2011-12-29", apia);
  assert.equal(panchangDateKey(dayBefore.solar.nextSunrise, apia.timeZone), "2011-12-31");
});

test("amanta month changes after new moon and identifies the 2023 adhika Shravana", () => {
  assert.equal(panchangLunarMonth(new Date("2026-10-10T06:00:00Z")).index, 5);
  assert.equal(panchangLunarMonth(new Date("2026-10-11T06:00:00Z")).index, 6);
  assert.deepEqual(panchangLunarMonth(new Date("2023-07-20T06:00:00Z")), { index: 4, adhika: true, uncertain: false });
  assert.deepEqual(panchangLunarMonth(new Date("2023-08-20T06:00:00Z")), { index: 4, adhika: false, uncertain: false });
});

test("all weekday avoidance periods use actual daylight eighths; auspicious periods exclude conflicts", () => {
  const rise = new Date("2026-10-18T06:00:00Z");
  const set = new Date("2026-10-18T18:00:00Z");
  const starts = { rahu: [16.5, 7.5, 15, 12, 13.5, 10.5, 9], yamaganda: [12, 10.5, 9, 7.5, 6, 15, 13.5], gulika: [15, 13.5, 12, 10.5, 9, 7.5, 6] };
  for (let weekday = 0; weekday < 7; weekday++) {
    const periods = panchangPeriods(rise, set, weekday);
    for (const field of ["rahu", "yamaganda", "gulika"]) {
      assert.equal(periods[field].start.getUTCHours() + periods[field].start.getUTCMinutes() / 60, starts[field][weekday]);
      assert.equal((periods[field].end - periods[field].start) / 60000, 90);
    }
    assert.equal(periods.abhijit === null, weekday === 3);
    for (const good of periods.auspicious) {
      assert.ok(good.start >= rise && good.end <= set && good.start < good.end);
      for (const bad of [periods.rahu, periods.yamaganda, periods.gulika]) assert.ok(good.end <= bad.start || good.start >= bad.end);
    }
  }
  const shortDay = panchangPeriods(rise, new Date("2026-10-18T14:00:00Z"), 1);
  assert.equal((shortDay.rahu.end - shortDay.rahu.start) / 60000, 60);
  assert.equal(panchangPeriods(null, set, 0), null);
  assert.equal(panchangPeriods(set, rise, 0), null);
});

test("polar day/night explicitly has unavailable sunrise-based periods instead of invented timings", () => {
  const tromso = { name: "Tromso", latitude: 69.65, longitude: 18.96, timeZone: "Europe/Oslo" };
  for (const key of ["2026-06-21", "2026-12-21"]) {
    const day = calculatePanchang(key, tromso);
    assert.equal(day.solar.sunrise, null);
    assert.equal(day.solar.sunset, null);
    assert.equal(day.periods, null);
    assert.ok(day.tithis.length >= 1);
    assert.equal(day.at.getTime(), panchangLocalTime(key, tromso.timeZone, 12).getTime());
  }
});

test("month cells cover leap/year boundaries and preserve repeated/skipped sunrise tithis", () => {
  assert.equal(panchangMonthCells("2024-02", hyderabad).length, 29);
  assert.equal(panchangMonthCells("2026-02", hyderabad).length, 28);
  for (const month of ["2026-01", "2026-12"]) {
    const cells = panchangMonthCells(month, dallas);
    assert.equal(cells.length, 31);
    assert.equal(cells.at(-1).key, `${month}-31`);
    assert.ok(cells.every((cell) => cell.tithi >= 0 && cell.tithi < 30 && cell.nakshatra >= 0 && cell.nakshatra < 27));
  }
  const october = panchangMonthCells("2026-10", hyderabad);
  assert.equal(october[16].tithi, october[17].tithi);
  assert.equal(october[27].tithi - october[26].tithi, 2);
  assert.throws(() => panchangMonthCells("2026-13", hyderabad));
});

test("online solar records are validated by coordinates, timezone, date, and interval", () => {
  const parsed = parsePanchangSolar(solarPayload(), hyderabad, "2026-10-21");
  assert.equal(parsed.sunrise.toISOString(), "2026-10-21T00:40:49.000Z");
  assert.ok(parsed.nextSunrise > parsed.sunset);
  assert.ok(parsed.previousSunset < parsed.sunrise);
  const online = calculatePanchang("2026-10-21", hyderabad, parsed);
  assert.equal(online.solar.source, "online");
  assert.equal(online.solar.sunrise.getTime(), parsed.sunrise.getTime());
  assert.equal(calculatePanchang("2026-10-21", hyderabad).solar.source, "calculated");
  assert.throws(() => parsePanchangSolar(solarPayload(), dallas, "2026-10-21"));
  assert.throws(() => parsePanchangSolar(solarPayload(), hyderabad, "2026-10-23"));
  for (const mutate of [
    (payload) => { payload.daily.sunrise[1] = null; },
    (payload) => { payload.daily.sunset[1] = payload.daily.sunrise[1]; },
    (payload) => { payload.daily_units.sunrise = "iso8601"; },
    (payload) => { payload.timezone = "America/Chicago"; },
    (payload) => { payload.latitude = 40; },
  ]) {
    const payload = solarPayload();
    mutate(payload);
    assert.throws(() => parsePanchangSolar(payload, hyderabad, "2026-10-21"));
  }
});

test("network adapters use HTTPS, bounded requests, city timezone, and rounded consented coordinates", async () => {
  const urls = [];
  const request = async (url, options) => {
    urls.push(new URL(url));
    assert.ok(options.signal);
    return { ok: true, json: async () => solarPayload() };
  };
  await fetchPanchangSolar(hyderabad, "2026-10-21", request);
  assert.equal(urls[0].searchParams.get("timezone"), "Asia/Kolkata");
  assert.equal(urls[0].searchParams.get("start_date"), "2026-10-20");
  assert.equal(urls[0].searchParams.get("end_date"), "2026-10-22");
  const place = await resolvePanchangCoordinates(17.38405, 78.45636, request);
  assert.equal(place.latitude, 17.38);
  assert.equal(place.longitude, 78.46);
  assert.equal(place.timeZone, "Asia/Kolkata");
  assert.equal(urls[1].searchParams.get("latitude"), "17.38");
  assert.equal(urls[1].searchParams.get("longitude"), "78.46");
  const cities = await searchPanchangCities("Dallas", async (url) => {
    const query = new URL(url);
    assert.equal(query.origin, "https://geocoding-api.open-meteo.com");
    assert.equal(query.searchParams.get("name"), "Dallas");
    return { ok: true, json: async () => ({ results: [{ name: "Dallas", latitude: 32.78, longitude: -96.8, timezone: "America/Chicago", country: "United States", id: 4684888 }] }) };
  });
  assert.equal(cities[0].timeZone, "America/Chicago");
  assert.equal(cities[0].geonameId, 4684888);
  assert.deepEqual(await searchPanchangCities("NoMatch", async () => ({ ok: true, json: async () => ({}) })), []);
  const failed = async () => ({ ok: false, status: 429 });
  await assert.rejects(fetchPanchangSolar(hyderabad, "2026-10-21", failed), /429/);
  await assert.rejects(searchPanchangCities("Dallas", failed), /429/);
  await assert.rejects(resolvePanchangCoordinates(17, 78, failed), /429/);
  await assert.rejects(searchPanchangCities("a", request), /two letters/);
  await assert.rejects(searchPanchangCities("Dallas", async () => ({ ok: true, json: async () => ({ results: "invalid" }) })), /invalid data/);
});

test("the distributed astronomy wrapper retains the pinned upstream license and implementation", async () => {
  const source = await readFile(new URL("../public/astronomy.mjs", import.meta.url), "utf8");
  assert.match(source, /astronomy-engine 2\.1\.19/);
  assert.match(source, /MIT License/);
  assert.match(source, /Copyright \(c\) 2019-2023 Don Cross/);
  assert.equal(panchangSolar("2026-10-21", hyderabad).source, "calculated");
});
