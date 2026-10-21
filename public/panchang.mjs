import { PanchangAstronomy } from "./astronomy.mjs";

export const panchangNames = {
  tithi: [
    ["Padyami", "పాడ్యమి"], ["Vidiya", "విదియ"], ["Thadiya", "తదియ"], ["Chavithi", "చవితి"],
    ["Panchami", "పంచమి"], ["Shashti", "షష్ఠి"], ["Saptami", "సప్తమి"], ["Ashtami", "అష్టమి"],
    ["Navami", "నవమి"], ["Dasami", "దశమి"], ["Ekadasi", "ఏకాదశి"], ["Dwadasi", "ద్వాదశి"],
    ["Trayodasi", "త్రయోదశి"], ["Chaturdasi", "చతుర్దశి"], ["Pournami", "పౌర్ణమి"], ["Amavasya", "అమావాస్య"],
  ],
  nakshatra: [
    ["Ashwini", "అశ్విని"], ["Bharani", "భరణి"], ["Krittika", "కృత్తిక"], ["Rohini", "రోహిణి"],
    ["Mrigashira", "మృగశిర"], ["Ardra", "ఆరుద్ర"], ["Punarvasu", "పునర్వసు"], ["Pushyami", "పుష్యమి"],
    ["Ashlesha", "ఆశ్లేష"], ["Magha", "మఖ"], ["Purva Phalguni", "పుబ్బ"], ["Uttara Phalguni", "ఉత్తర"],
    ["Hasta", "హస్త"], ["Chitra", "చిత్త"], ["Swati", "స్వాతి"], ["Vishakha", "విశాఖ"],
    ["Anuradha", "అనూరాధ"], ["Jyeshtha", "జ్యేష్ఠ"], ["Moola", "మూల"], ["Purva Ashadha", "పూర్వాషాఢ"],
    ["Uttara Ashadha", "ఉత్తరాషాఢ"], ["Shravana", "శ్రవణం"], ["Dhanishtha", "ధనిష్ఠ"],
    ["Shatabhisha", "శతభిషం"], ["Purva Bhadra", "పూర్వాభాద్ర"], ["Uttara Bhadra", "ఉత్తరాభాద్ర"], ["Revati", "రేవతి"],
  ],
  month: [
    ["Chaitram", "చైత్రం"], ["Vaisakham", "వైశాఖం"], ["Jyeshtham", "జ్యేష్ఠం"], ["Ashadham", "ఆషాఢం"],
    ["Shravanam", "శ్రావణం"], ["Bhadrapadam", "భాద్రపదం"], ["Ashwayujam", "ఆశ్వయుజం"],
    ["Kartikam", "కార్తీకం"], ["Margasiram", "మార్గశిరం"], ["Pushyam", "పుష్యం"], ["Magham", "మాఘం"], ["Phalgunam", "ఫాల్గుణం"],
  ],
  paksha: [["Shukla paksha", "శుక్ల పక్షం"], ["Krishna paksha", "కృష్ణ పక్షం"]],
};
const PANCHANG_DAY = 86400000;
const panchangMod = (value, divisor) => ((value % divisor) + divisor) % divisor;

export function panchangDateKey(instant, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function panchangAddDays(key, count) {
  const date = new Date(`${key}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== key || !Number.isInteger(count)) throw new Error("Invalid calendar date.");
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function panchangLocalTime(key, timeZone, hour = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("Invalid calendar date or hour.");
  const target = Date.parse(`${key}T${String(hour).padStart(2, "0")}:00:00Z`);
  if (!Number.isFinite(target) || new Date(target).toISOString().slice(0, 10) !== key) throw new Error("Invalid calendar date.");
  let guess = target;
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let attempt = 0; attempt < 5; attempt++) {
    const parts = formatter.formatToParts(new Date(guess));
    const get = (type) => parts.find((part) => part.type === type).value;
    const represented = Date.parse(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`);
    if (represented === target) return new Date(guess);
    guess += target - represented;
  }
  const error = new Error("This local time does not exist in the selected timezone. Choose another date.");
  error.code = "NONEXISTENT_LOCAL_TIME";
  throw error;
}

export function panchangDayStart(key, timeZone) {
  try {
    return panchangLocalTime(key, timeZone);
  } catch (error) {
    if (error.code !== "NONEXISTENT_LOCAL_TIME") throw error;
    // Some timezone changes skip midnight without skipping the whole civil day.
    const noon = panchangLocalTime(key, timeZone, 12);
    let low = noon.getTime() - 86400000;
    let high = noon.getTime();
    while (high - low > 1000) {
      const middle = (low + high) / 2;
      if (panchangDateKey(new Date(middle), timeZone) < key) low = middle;
      else high = middle;
    }
    return new Date(high);
  }
}

export function validatePanchangPlace(place) {
  if (!place || typeof place.name !== "string" || !place.name.trim() || place.name.length > 200 ||
      !Number.isFinite(place.latitude) || Math.abs(place.latitude) > 90 ||
      !Number.isFinite(place.longitude) || Math.abs(place.longitude) > 180 || typeof place.timeZone !== "string") {
    throw new Error("Invalid location. Search for a city again.");
  }
  panchangDateKey(new Date(), place.timeZone);
  return place;
}

export function panchangSolar(key, place) {
  validatePanchangPlace(place);
  const start = panchangDayStart(key, place.timeZone);
  const observer = new PanchangAstronomy.Observer(place.latitude, place.longitude, 0);
  const find = (direction, from, day) => {
    const result = PanchangAstronomy.SearchRiseSet(PanchangAstronomy.Body.Sun, observer, direction, from, 1.1)?.date;
    return result && panchangDateKey(result, place.timeZone) === day ? result : null;
  };
  const sunrise = find(1, start, key);
  const sunset = find(-1, start, key);
  const adjacent = (direction, offset) => {
    for (let count = 1; count <= 2; count++) {
      const day = panchangAddDays(key, offset * count);
      try {
        return find(direction, panchangDayStart(day, place.timeZone), day);
      } catch (error) {
        if (error.code !== "NONEXISTENT_LOCAL_TIME") throw error;
      }
    }
    return null;
  };
  return {
    sunrise, sunset,
    nextSunrise: adjacent(1, 1),
    previousSunset: adjacent(-1, -1),
    source: "calculated",
  };
}

function panchangLongitudes(instant) {
  const centuries = (instant.getTime() / PANCHANG_DAY + 2440587.5 - 2451545) / 36525;
  // Approximate Lahiri ayanamsha; this is not a certified regional ephemeris.
  const ayanamsha = 23.85675 + 1.3969713 * centuries + 0.0003086 * centuries * centuries;
  const sun = PanchangAstronomy.SunPosition(instant).elon;
  const moon = PanchangAstronomy.Ecliptic(PanchangAstronomy.GeoVector(PanchangAstronomy.Body.Moon, instant, true)).elon;
  return { sun: panchangMod(sun - ayanamsha, 360), moon: panchangMod(moon - ayanamsha, 360), phase: PanchangAstronomy.MoonPhase(instant) };
}

export function panchangLunarAt(instant) {
  const angles = panchangLongitudes(instant);
  return { tithi: Math.floor(angles.phase / 12), nakshatra: Math.floor(angles.moon / (360 / 27)) };
}

export function panchangTithiName(index, language = "en", withPaksha = true) {
  if (!Number.isInteger(index) || index < 0 || index > 29) throw new Error("Invalid tithi.");
  const languageIndex = language === "te" ? 1 : 0;
  const name = panchangNames.tithi[index === 29 ? 15 : index % 15][languageIndex];
  return withPaksha ? `${panchangNames.paksha[index >= 15 ? 1 : 0][languageIndex]} ${name}` : name;
}

function panchangTransitions(start, end, field) {
  let cursor = start.getTime();
  let current = panchangLunarAt(start)[field];
  const entries = [{ index: current, start, end: null }];
  while (cursor < end.getTime()) {
    const probe = Math.min(cursor + 3 * 3600000, end.getTime());
    if (panchangLunarAt(new Date(probe))[field] !== current) {
      let low = cursor;
      let high = probe;
      while (high - low > 1000) {
        const middle = (low + high) / 2;
        if (panchangLunarAt(new Date(middle))[field] === current) low = middle;
        else high = middle;
      }
      const boundary = new Date(high);
      entries.at(-1).end = boundary;
      current = panchangLunarAt(boundary)[field];
      entries.push({ index: current, start: boundary, end: null });
    }
    cursor = probe;
  }
  return entries;
}

export function panchangLunarMonth(instant) {
  const prior = PanchangAstronomy.SearchMoonPhase(0, new Date(instant.getTime() - 32 * PANCHANG_DAY), 32);
  if (!prior) throw new Error("Could not determine the lunar month.");
  let previous = prior.date;
  let next = PanchangAstronomy.SearchMoonPhase(0, new Date(previous.getTime() + PANCHANG_DAY), 32)?.date;
  if (!next) throw new Error("Could not determine the next lunar month.");
  if (next <= instant) {
    previous = next;
    next = PanchangAstronomy.SearchMoonPhase(0, new Date(previous.getTime() + PANCHANG_DAY), 32)?.date;
  }
  if (!next) throw new Error("Could not determine the next lunar month.");
  const previousSign = Math.floor(panchangLongitudes(previous).sun / 30);
  const nextSign = Math.floor(panchangLongitudes(next).sun / 30);
  const adhika = previousSign === nextSign;
  return { index: adhika ? (nextSign + 1) % 12 : nextSign, adhika, uncertain: panchangMod(nextSign - previousSign, 12) > 1 };
}

export function panchangPeriods(sunrise, sunset, weekday) {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error("Invalid weekday.");
  if (!sunrise || !sunset || sunset <= sunrise) return null;
  const eighth = (sunset - sunrise) / 8;
  const interval = (segment) => ({ start: new Date(sunrise.getTime() + (segment - 1) * eighth), end: new Date(sunrise.getTime() + segment * eighth) });
  const rahu = interval([8, 2, 7, 5, 6, 4, 3][weekday]);
  const yamaganda = interval([5, 4, 3, 2, 1, 7, 6][weekday]);
  const gulika = interval([7, 6, 5, 4, 3, 2, 1][weekday]);
  const cycle = ["udveg", "chal", "labh", "amrit", "kaal", "shubh", "rog"];
  const first = [0, 3, 6, 2, 5, 1, 4][weekday];
  const auspicious = [];
  for (let index = 0; index < 8; index++) {
    const name = cycle[(first + index) % 7];
    if (!["labh", "amrit", "shubh"].includes(name)) continue;
    let pieces = [interval(index + 1)];
    for (const blocked of [rahu, yamaganda, gulika]) {
      pieces = pieces.flatMap((piece) => {
        if (blocked.end <= piece.start || blocked.start >= piece.end) return [piece];
        const remaining = [];
        if (blocked.start > piece.start) remaining.push({ start: piece.start, end: blocked.start });
        if (blocked.end < piece.end) remaining.push({ start: blocked.end, end: piece.end });
        return remaining;
      });
    }
    auspicious.push(...pieces.map((piece) => ({ ...piece, name })));
  }
  const midday = (sunrise.getTime() + sunset.getTime()) / 2;
  const halfMuhurta = (sunset - sunrise) / 30;
  return { rahu, yamaganda, gulika, auspicious, abhijit: weekday === 3 ? null : { start: new Date(midday - halfMuhurta), end: new Date(midday + halfMuhurta) } };
}

export function calculatePanchang(key, place, onlineSolar = null) {
  const solar = panchangSolar(key, place);
  if (onlineSolar) {
    for (const field of ["sunrise", "sunset", "nextSunrise", "previousSunset"]) {
      if (onlineSolar[field]) solar[field] = onlineSolar[field];
    }
    solar.source = "online";
  }
  const at = solar.sunrise || panchangLocalTime(key, place.timeZone, 12);
  const end = solar.nextSunrise || panchangLocalTime(panchangAddDays(key, 1), place.timeZone, 12);
  return {
    key, place, solar, at,
    tithis: panchangTransitions(at, end, "tithi"),
    nakshatras: panchangTransitions(at, end, "nakshatra"),
    month: panchangLunarMonth(at),
    periods: panchangPeriods(solar.sunrise, solar.sunset, new Date(`${key}T12:00:00Z`).getUTCDay()),
  };
}

export function panchangMonthCells(monthKey, place) {
  if (!/^(?:19\d{2}|20\d{2})-(?:0[1-9]|1[0-2])$/.test(monthKey)) throw new Error("Invalid calendar month.");
  const [year, month] = monthKey.split("-").map(Number);
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length }, (_, index) => {
    const key = `${monthKey}-${String(index + 1).padStart(2, "0")}`;
    try {
      const solar = panchangSolar(key, place);
      return { key, day: index + 1, ...panchangLunarAt(solar.sunrise || panchangLocalTime(key, place.timeZone, 12)) };
    } catch (error) {
      if (error.code !== "NONEXISTENT_LOCAL_TIME") throw error;
      return { key, day: index + 1, unavailable: true };
    }
  });
}

export function parsePanchangSolar(payload, place, key) {
  if (!payload || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude) ||
      Math.abs(payload.latitude - place.latitude) > 0.3 || Math.abs(payload.longitude - place.longitude) > 0.3 ||
      typeof payload.timezone !== "string" || !Array.isArray(payload.daily?.sunrise) || !Array.isArray(payload.daily?.sunset) ||
      payload.daily.sunrise.length !== payload.daily.sunset.length || payload.daily_units?.sunrise !== "unixtime" || payload.daily_units?.sunset !== "unixtime") {
    throw new Error("Online solar data was incomplete or for a different location.");
  }
  panchangDateKey(new Date(), payload.timezone);
  if (payload.timezone !== place.timeZone) throw new Error("Online solar timezone does not match the selected city.");
  const rows = payload.daily.sunrise.map((value, index) => {
    const setting = payload.daily.sunset[index];
    if (!Number.isFinite(value) || !Number.isFinite(setting) || value <= 0 || setting <= value || setting - value > 86400) {
      throw new Error("Online sunrise/sunset is unavailable for this location or date.");
    }
    const sunrise = new Date(value * 1000);
    const sunset = new Date(setting * 1000);
    if (panchangDateKey(sunrise, place.timeZone) !== panchangDateKey(sunset, place.timeZone)) throw new Error("Online solar dates do not match.");
    return { key: panchangDateKey(sunrise, place.timeZone), sunrise, sunset };
  });
  const day = rows.find((row) => row.key === key);
  if (!day) throw new Error("Online solar data does not include the selected local date.");
  return { ...day, previousSunset: rows.find((row) => row.key === panchangAddDays(key, -1))?.sunset, nextSunrise: rows.find((row) => row.key === panchangAddDays(key, 1))?.sunrise };
}

export async function searchPanchangCities(query, request = fetch) {
  if (query.trim().length < 2) throw new Error("Enter at least two letters of a city name.");
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name: query.trim(), count: "6", language: "en", format: "json" });
  const response = await request(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`City search failed (HTTP ${response.status}).`);
  const payload = await response.json();
  if (payload.results !== undefined && !Array.isArray(payload.results)) throw new Error("City search returned invalid data.");
  return (payload.results || []).map((city) => validatePanchangPlace({
    name: [city.name, city.admin1, city.country].filter(Boolean).join(", "),
    latitude: city.latitude, longitude: city.longitude, timeZone: city.timezone, geonameId: city.id,
  }));
}

export async function fetchPanchangSolar(place, key, request = fetch) {
  validatePanchangPlace(place);
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(place.latitude), longitude: String(place.longitude),
    daily: "sunrise,sunset", timezone: place.timeZone, timeformat: "unixtime",
    start_date: panchangAddDays(key, -1), end_date: panchangAddDays(key, 1),
  });
  const response = await request(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Online solar update failed (HTTP ${response.status}).`);
  return parsePanchangSolar(await response.json(), place, key);
}

export async function resolvePanchangCoordinates(latitude, longitude, request = fetch) {
  const roundedLatitude = Math.round(latitude * 100) / 100;
  const roundedLongitude = Math.round(longitude * 100) / 100;
  if (!Number.isFinite(roundedLatitude) || Math.abs(roundedLatitude) > 90 || !Number.isFinite(roundedLongitude) || Math.abs(roundedLongitude) > 180) throw new Error("The browser returned invalid coordinates.");
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({ latitude: String(roundedLatitude), longitude: String(roundedLongitude), daily: "sunrise,sunset", forecast_days: "1", timezone: "auto" });
  const response = await request(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Location timezone lookup failed (HTTP ${response.status}). Search for your city instead.`);
  const payload = await response.json();
  return validatePanchangPlace({ name: `${roundedLatitude.toFixed(2)}, ${roundedLongitude.toFixed(2)}`, latitude: roundedLatitude, longitude: roundedLongitude, timeZone: payload.timezone });
}
