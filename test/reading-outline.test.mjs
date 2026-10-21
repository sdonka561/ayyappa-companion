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

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

async function reader(portable = false) {
  const source = await readFile(new URL(`../public/${portable ? "ayyappa-companion.html" : "app.mjs"}`, import.meta.url), "utf8");
  const script = portable ? source.match(/<script type="module">([\s\S]*?)<\/script>/)[1] : source.replace(/^import .*;\r?\n/gm, "");
  const declarations = script.slice(0, script.indexOf('const initialSection = readRoute();'));
  return runInNewContext(`${declarations}
    ({
      render(hash) { location.hash = hash; readRoute(); return guideContent(); },
      abpOutline(tab) { return abpSectionOutline(resolveAbp(tab).tab); },
      chantOutline(id) { return chantOutline(chantDefinitions.find(entry => entry.id === id)); }
    })`, {
    ...content, ...chants, ...rituals, ...book, ...pronunciation, ...abp, ...bhajans,
    URLSearchParams,
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
  for (const hash of ["#topic=abp&lang=en", "#topic=abp&lang=te&tab=sequence", "#topic=chanting&lang=en", "#topic=companion&lang=te"]) {
    const normalizeImages = (html) => html.replace(/src="(?:ayyappa\.jpg|data:image\/jpeg;base64,[^"]+)"/g, 'src="PHOTO"');
    assert.equal(normalizeImages(portable.render(hash)), normalizeImages(hosted.render(hash)), hash);
  }
});
