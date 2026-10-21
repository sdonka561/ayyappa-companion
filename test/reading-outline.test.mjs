import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import * as content from "../public/content.mjs";
import * as chants from "../public/chant-data.mjs";
import * as rituals from "../public/rituals.mjs";
import * as book from "../public/book.mjs";
import * as pronunciation from "../public/pronunciation.mjs";
import * as abp from "../public/abp.mjs";
import * as bhajans from "../public/bhajans.mjs";
import * as panchang from "../public/panchang.mjs";
import * as calendar from "../public/calendar.mjs";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

async function reader(portable = false) {
  const source = await readFile(new URL(`../public/${portable ? "ayyappa-companion.html" : "app.mjs"}`, import.meta.url), "utf8");
  const script = portable ? source.match(/<script type="module">([\s\S]*?)<\/script>/)[1] : source.replace(/^import .*;\r?\n/gm, "");
  const declarations = script.slice(0, script.indexOf('const initialSection = readRoute();'));
  return runInNewContext(`${declarations}
    ({
      render(hash) { location.hash = hash; readRoute(); return guideContent(); },
      navigation(hash) { location.hash = hash; readRoute(); return calendarNavigation() + guideNavigation() + readingLibraries(); },
      collapseNavigation(id) { navigationOpen.set(id, false); },
      main(hash) { location.hash = hash; readRoute(); return mainContent(); },
      abpOutline(tab) { return abpSectionOutline(resolveAbp(tab).tab); },
      chantOutline(id) { return chantOutline(chantDefinitions.find(entry => entry.id === id)); },
      dailyCalendar(key, place) { return calculatePanchang(key, place); }
    })`, {
    ...content, ...chants, ...rituals, ...book, ...pronunciation, ...abp, ...bhajans, ...panchang, ...calendar,
    URL, URLSearchParams,
    location: { hash: "" },
    document: { querySelector: () => ({}), body: { classList: { contains: () => false } } },
    window: { addEventListener() {} },
  });
}

test("all ABP procedure lines are visible under numbered parents with source numbering intact", async () => {
  const app = await reader();
  for (const lang of ["en", "te"]) {
    for (const tab of abp.abpTabs.filter((tab) => tab.sections.every((part) => part.kind === "guide"))) {
      const html = app.render(`#topic=abp&lang=${lang}&tab=${tab.id}`);
      assert.equal((html.match(/<h2 /g) || []).length, tab.sections.length);
      assert.equal((html.match(/<p lang=/g) || []).length, tab.sections.flatMap((part) => part.lines).length);
      for (const part of tab.sections) for (const line of part.lines) {
        assert.ok(html.includes(escapeHtml(line.text).replaceAll("\n", "<br>")), `${tab.id}: ${line.ref}`);
      }
      assert.doesNotMatch(html, /<details\b|<summary\b|<[^>]*\shidden(?:[ =>])/);
    }
    const sequence = app.render(`#topic=abp&lang=${lang}&tab=sequence`);
    assert.equal((sequence.match(/class="abp-step-number"/g) || []).length, 23);
    assert.match(sequence, /class="abp-step-number">24\.<\/span>/);
    const shownNumbers = [...sequence.matchAll(/class="abp-step-number">(\d+)\.<\/span>/g)].map((match) => match[1]);
    const sourceNumbers = abp.resolveAbp("sequence").tab.sections.flatMap((part) => part.lines).map((line) => line.number).filter(Boolean);
    assert.deepEqual(shownNumbers, sourceNumbers);
  }
});

test("source names and nested navigation stay available in both sources and languages", async () => {
  for (const portable of [false, true]) {
    const app = await reader(portable);
    for (const language of ["en", "te"]) {
      for (const topic of ["abp", "book", "calendar"]) {
        const hash = `#topic=${topic}&lang=${language}`;
        const nav = app.navigation(hash);
        assert.match(nav, /class="nav-parent"[^>]+>Source 1: Ayyappa Process Guide<\/a>/);
        assert.match(nav, /class="nav-parent"[^>]+>Source 2: Nitya Puja<\/a>/);
        assert.equal((nav.match(/href="#topic=abp&lang=\w+&tab=[^"&]+"/g) || []).length, abp.abpTabs.length);
        assert.equal((nav.match(/href="#topic=book[^"]*&chapter=/g) || []).length, book.bookChapters.length);
        assert.match(nav, /<span class="nav-parent">[^<]+<\/span><button/);
        assert.equal((nav.match(/aria-current="page"/g) || []).length, 1);
        assert.doesNotMatch(nav, /\bABP\b|Simplified process guide|Original PDF/);
        const main = app.main(hash);
        assert.match(main, /<option value="abp"[^>]*>Source 1: Ayyappa Process Guide<\/option>/);
        assert.match(main, /<option value="book"[^>]*>Source 2: Nitya Puja<\/option>/);
      }
      const nav = app.navigation(`#topic=abp&lang=${language}&tab=sequence&part=${abp.resolveAbp("sequence").tab.sections[0].id}`);
      assert.equal((nav.match(/&part=/g) || []).length, abp.abpTabs.flatMap(tab => tab.sections).length);
      assert.equal((nav.match(/aria-current="page"/g) || []).length, 1);
    }
  }
});

test("calendar is first and disclosure state follows reading routes without losing manual collapse", async () => {
  for (const portable of [false, true]) {
    const app = await reader(portable);
    let nav = app.navigation("#topic=calendar&lang=en");
    assert.match(nav, /^<li><a class="nav-parent" href="#topic=calendar/);
    assert.equal((nav.match(/aria-expanded="true"/g) || []).length, 0);
    assert.equal((nav.match(/aria-expanded="false"/g) || []).length, 13);
    const controls = [...nav.matchAll(/aria-controls="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(controls).size, controls.length);
    for (const id of controls) assert.ok(nav.includes(`<ul id="${id}" hidden>`));
    nav = app.navigation("#topic=abp&lang=en&tab=sequence");
    assert.match(nav, /aria-expanded="true" aria-controls="navigation-source-one"/);
    assert.match(nav, /aria-expanded="true" aria-controls="navigation-tab-sequence"/);
    app.collapseNavigation("source-one");
    nav = app.navigation("#topic=abp&lang=te&tab=sequence");
    assert.match(nav, /aria-expanded="false" aria-controls="navigation-source-one"/);
    nav = app.navigation("#topic=abp&lang=te&tab=ashtottaram");
    assert.match(nav, /aria-expanded="true" aria-controls="navigation-source-one"/);
    nav = app.navigation("#topic=book&lang=te&chapter=opening");
    assert.match(nav, /aria-expanded="true" aria-controls="navigation-source-two"/);
  }
});

test("a fresh page starts the saved-location calendar without requiring hash navigation", async () => {
  for (const filename of ["app.mjs", "ayyappa-companion.html"]) {
    const source = await readFile(new URL(`../public/${filename}`, import.meta.url), "utf8");
    assert.match(source, /const initialSection = readRoute\(\);\s*loadRoutine\(\);\s*render\(\);\s*startCalendar\(\);/);
  }
});

test("all nine workbook tab names use Telugu-script pronunciation consistently", async () => {
  const labels = ["మాలధారణ మరియు పీఠం సెటప్", "పూజ వరుస", "అథ అంగపూజ", "అష్టోత్తరం", "శరణుఘోష", "పంచరత్న స్తోత్రం", "హారతి-క్షమాపణ", "సహస్రనామావళి", "సుప్రభాతం"];
  for (const [index, tab] of abp.abpTabs.entries()) {
    assert.equal(abp.abpTabTitle(tab, "te"), labels[index]);
    assert.equal(abp.abpTabTitle(tab, "en"), tab.title);
    assert.ok(abp.searchAbp(labels[index]).some(result => result.tab.id === tab.id));
  }
  for (const portable of [false, true]) {
    const app = await reader(portable);
    const nav = app.navigation("#topic=abp&lang=te");
    const contents = app.render("#topic=abp&lang=te");
    for (const [index, tab] of abp.abpTabs.entries()) {
      assert.ok(nav.includes(labels[index]));
      assert.ok(contents.includes(labels[index]));
      assert.match(app.render(`#topic=abp&lang=te&tab=${tab.id}`), new RegExp(`<h1 id="page-title">${labels[index]}</h1>`));
      const section = tab.sections[0];
      const reading = app.render(`#topic=abp&lang=te&tab=${tab.id}&part=${section.id}`);
      assert.ok(reading.includes(`>${labels[index]}</option>`));
      assert.ok(app.navigation("#topic=abp&lang=en").includes(escapeHtml(tab.title)));
    }
  }
});

test("all 54 subsection names have Telugu-script pronunciation without changing English source labels", async () => {
  const names = abp.abpTabs.flatMap(tab => tab.sections.map(section => ({ tab, section, label: abp.abpSectionTitle(tab, section, "te") })));
  assert.equal(names.length, 54);
  for (const { tab, section, label } of names) {
    assert.match(label, /[\u0c00-\u0c7f]/);
    assert.doesNotMatch(label, /[A-Za-z]/);
    assert.equal(abp.abpSectionTitle(tab, section, "en"), section.title);
    assert.ok(abp.searchAbp(label).some(result => result.tab.id === tab.id && result.section.id === section.id));
  }
  for (const portable of [false, true]) {
    const app = await reader(portable);
    const nav = app.navigation("#topic=abp&lang=te");
    const contents = app.render("#topic=abp&lang=te");
    for (const { tab, section, label } of names) {
      assert.ok(nav.includes(label));
      assert.ok(contents.includes(label));
      const reading = app.render(`#topic=abp&lang=te&tab=${tab.id}&part=${section.id}`);
      assert.ok(reading.includes(`<h1 id="page-title">${label}</h1>`));
      assert.ok(reading.includes(`>${label}</option>`));
      assert.ok(app.render(`#topic=abp&lang=en&tab=${tab.id}&part=${section.id}`).includes(`<h1 id="page-title">${escapeHtml(section.title)}</h1>`));
    }
  }
});

test("ABP short readings are complete inline; long lists have bounded previews and valid reader links", async () => {
  const app = await reader();
  for (const lang of ["en", "te"]) {
    app.render(`#topic=abp&lang=${lang}`);
    for (const tab of abp.abpTabs) {
      const html = app.abpOutline(tab.id);
      const expectedLines = tab.sections.reduce((count, part) => count + (part.kind === "guide" || part.lines.length <= 30 ? part.lines.length : 3), 0);
      assert.equal((html.match(/<p lang=/g) || []).length, expectedLines, tab.id);
      for (const part of tab.sections) {
        assert.ok(html.includes(`tab=${tab.id}&part=${part.id}`));
        const shown = part.kind === "guide" || part.lines.length <= 30 ? part.lines : part.lines.slice(0, 3);
        for (const line of shown) {
          const value = lang === "en" && /[\u0c00-\u0c7f]/.test(line.text) ? line.pronunciation || pronunciation.pronounceTelugu(line.text) : line.text;
          assert.ok(html.includes(escapeHtml(value).replaceAll("\n", "<br>")), `${tab.id}: ${line.ref}`);
        }
      }
    }
    const home = app.render(`#topic=abp&lang=${lang}`);
    assert.equal((home.match(/<h2 /g) || []).length, 9);
    assert.equal((home.match(/<h3 /g) || []).length, 54);
    assert.equal((home.match(/<img /g) || []).length, 1);
    assert.match(home, /Source count: 107|మూలంలో 107/);
    assert.match(home, /1000/);
  }
});

test("PDF and bhajan indexes expose every child page without loading scanned pages", async () => {
  const app = await reader();
  for (const lang of ["en", "te"]) {
    const pdf = app.render(`#topic=book&lang=${lang}`);
    const pageLinks = [...pdf.matchAll(/href="#topic=book&lang=\w+&chapter=([^"&]+)&page=(\d+)"/g)];
    assert.equal(pageLinks.length, 60);
    assert.deepEqual(pageLinks.map((match) => Number(match[2])), Array.from({ length: 60 }, (_, index) => index + 2));
    for (const match of pageLinks) assert.ok(book.resolveBookLocation(match[1], match[2]));
    assert.equal((pdf.match(/<img /g) || []).length, 1, "only the cover is loaded");
    const library = app.render(`#topic=bhajans&lang=${lang}`);
    assert.equal((library.match(/data-bhajan-title=/g) || []).length, 252);
    assert.doesNotMatch(library, /<img /);
    const links = [...library.matchAll(/href="#topic=bhajans&lang=\w+&song=(song-\d+)&bhajanPage=(\d+)"/g)];
    assert.equal(links.length, bhajans.bhajanBook.songs.reduce((count, song) => count + song.end - song.start + 1, 0));
    for (const match of links) assert.ok(bhajans.resolveBhajan(match[1], match[2]));
    for (const [index, song] of bhajans.bhajanBook.songs.entries()) {
      assert.ok(library.includes(`${index + 1}.</span> ${escapeHtml(song.title)}`));
    }
  }
});

test("chant library preserves source pronunciation and shows short prayers without a second click", async () => {
  const app = await reader();
  for (const lang of ["en", "te"]) {
    const library = app.render(`#topic=chanting&lang=${lang}`);
    assert.equal((library.match(/<h2><span class="outline-number"/g) || []).length, rituals.chantDefinitions.length);
    for (const definition of rituals.chantDefinitions.filter((entry) => chants.chantTexts[entry.id])) {
      const html = app.chantOutline(definition.id);
      const lines = chants.chantTexts[definition.id];
      assert.equal((html.match(/<li lang=/g) || []).length, lines.length <= 30 ? lines.length : 3);
      for (const line of lines.slice(0, lines.length <= 30 ? lines.length : 3)) {
        const value = lang === "en" ? line.pronunciation || pronunciation.pronounceTelugu(line.te) : line.te;
        assert.ok(html.includes(escapeHtml(value).replaceAll("\n", "<br>")), definition.id);
      }
    }
    assert.match(library, /1004/);
    assert.match(library, /633/);
    assert.match(library, /song=.+&bhajanPage=/);
    assert.doesNotMatch(library, /<img /);
  }
});

test("companion details have unique nested section IDs and working preparation checkboxes", async () => {
  const app = await reader();
  const html = app.render("#topic=companion&lang=en");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const topic of content.topics) {
    assert.ok(ids.includes(`companion-${topic.id}`));
    for (const section of topic.sections) {
      if (section.table) {
        assert.ok(html.includes(`topic=${topic.id}&lang=en&section=${section.id}`));
        assert.match(html, /49 items with quantities/);
      } else {
        assert.ok(ids.includes(`${topic.id}-${section.id}`));
      }
    }
  }
  assert.match(html, /data-check="peetam-materials-0"/);
  const topic = app.render("#topic=daily&lang=en");
  assert.equal((topic.match(/<h2 id="[^"]+-heading"><span class="outline-number"/g) || []).length, content.topicById("daily").sections.length);
});

test("portable and hosted guides render the same reading hierarchy", async () => {
  const hosted = await reader();
  const portable = await reader(true);
  for (const hash of ["#topic=abp&lang=en", "#topic=abp&lang=te&tab=sequence", "#topic=chanting&lang=en", "#topic=companion&lang=te", "#topic=calendar&lang=te"]) {
    const normalizeImages = (html) => html.replace(/src="(?:ayyappa\.jpg|data:image\/jpeg;base64,[^"]+)"/g, 'src="PHOTO"');
    assert.equal(normalizeImages(portable.render(hash)), normalizeImages(hosted.render(hash)), hash);
  }
  const place = { name: "Hyderabad", latitude: 17.38, longitude: 78.46, timeZone: "Asia/Kolkata" };
  assert.equal(JSON.stringify(portable.dailyCalendar("2026-10-21", place)), JSON.stringify(hosted.dailyCalendar("2026-10-21", place)));
});
