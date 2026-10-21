import test from "node:test";
import assert from "node:assert/strict";
import { open, readFile, stat } from "node:fs/promises";
import { bhajanBook, resolveBhajan, searchBhajans } from "../public/bhajans.mjs";
import { chantDefinitions } from "../public/rituals.mjs";

test("all 252 contents entries from all eight pages have unique title destinations", () => {
  assert.equal(bhajanBook.songs.length, 252);
  assert.equal(new Set(bhajanBook.songs.map((song) => song.id)).size, 252);
  assert.deepEqual([...new Set(bhajanBook.songs.map((song) => song.tocPage))], [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(bhajanBook.contentsPages, 8);
  assert.equal(bhajanBook.songs[0].title, "Shaastha Pancharathnam");
  assert.equal(bhajanBook.songs[0].start, 8);
  assert.equal(bhajanBook.songs.at(-1).title, "Vanji paattu");
  assert.equal(bhajanBook.songs.at(-1).end, 451);
  const covered = new Set();
  for (const song of bhajanBook.songs) {
    assert.ok(song.title.trim().length > 0);
    assert.ok(song.startY >= 0 && song.startY <= 1);
    assert.ok(song.start >= 8 && song.end >= song.start && song.end <= 451);
    assert.equal(resolveBhajan(song.id)?.page.page, song.start);
    assert.equal(resolveBhajan(song.id, song.end)?.page.page, song.end);
    for (let page = song.start; page <= song.end; page++) covered.add(page);
  }
  assert.deepEqual([...covered].sort((a, b) => a - b), Array.from({ length: 444 }, (_, i) => i + 8));
});

test("titles missing from PDF bookmarks are included and shared-page songs keep distinct destinations", () => {
  assert.equal(searchBhajans("Bhootha natha stotra dasakam")[0].start, 11);
  assert.equal(searchBhajans("Padi Pooja Kazhinju")[0].start, 69);
  assert.equal(searchBhajans("Pambayil Kuli Kazhinchu")[0].start, 70);
  assert.equal(searchBhajans("Bhajanam shey manamey")[0].start, 370);
  const shared = bhajanBook.songs.filter((song) => song.start === 69);
  assert.equal(shared.length, 2);
  assert.notEqual(shared[0].startY, shared[1].startY);
  assert.equal(searchBhajans("nonexistent_12345").length, 0);
  assert.equal(searchBhajans("").length, 252);
});

test("bhajan routes reject unknown titles, invalid pages, and pages outside the title's range", () => {
  assert.equal(resolveBhajan("missing"), null);
  for (const value of ["bad", "8.5", "-1", "0", "452", "9999999999999999999999999"]) {
    assert.equal(resolveBhajan("song-001", value), null);
  }
  assert.equal(resolveBhajan("contents").page.page, 1);
  assert.equal(resolveBhajan("contents", "8").page.page, 8);
  assert.equal(resolveBhajan("contents", "9"), null);
  assert.equal(resolveBhajan("song-001", "7"), null);
});

test("all 252 readings retain original PDF text with complete and nonoverlapping page fragments", () => {
  const pages = new Set();
  let lines = 0;
  for (const song of bhajanBook.songs) {
    assert.ok(song.excerpts.length > 0, song.id);
    assert.equal(song.excerpts[0].page, song.start);
    assert.equal(song.excerpts.at(-1).page, song.end);
    assert.equal(new Set(song.excerpts.map(excerpt => excerpt.page)).size, song.excerpts.length);
    for (const excerpt of song.excerpts) {
      assert.ok(excerpt.text.trim().length > 0);
      assert.doesNotMatch(excerpt.text, /\ufffd/);
      assert.ok(excerpt.page >= song.start && excerpt.page <= song.end);
      pages.add(excerpt.page);
      lines += excerpt.text.split("\n").filter(line => line.trim()).length;
    }
  }
  assert.deepEqual([...pages].sort((a, b) => a - b), Array.from({ length: 444 }, (_, i) => i + 8));
  assert.equal(lines, 19543);
  assert.equal(lines, bhajanBook.textExtraction.nonemptyLines);
  assert.equal(bhajanBook.textExtraction.generatedTranslation, false);
  assert.equal(bhajanBook.textExtraction.generatedPronunciation, false);
  assert.match(bhajanBook.songs[0].excerpts[0].text, /Shaastha Pancharathnam/);
  assert.match(bhajanBook.songs.flatMap(song => song.excerpts).find(excerpt => excerpt.page === 100).text, /[\u0b80-\u0bff]/);
  // Page 176 has the previous song's last lines before the next title near the top.
  assert.equal(bhajanBook.songs[81].end, 176);
  assert.match(bhajanBook.songs[81].excerpts.at(-1).text, /I Surrender, I surrender/);
  assert.doesNotMatch(bhajanBook.songs[81].excerpts.at(-1).text, /Saranam  Ayyappa SWamiye/);
  assert.match(bhajanBook.songs[82].excerpts[0].text, /Saranam  Ayyappa SWamiye/);
});

test("all 451 lossless original page images exist, including the contents", async () => {
  assert.equal(bhajanBook.pages.length, 451);
  for (const [index, page] of bhajanBook.pages.entries()) {
    assert.equal(page.page, index + 1);
    const url = new URL(`../public/${page.image}`, import.meta.url);
    assert.ok((await stat(url)).size > 1000, page.image);
    const file = await open(url);
    try {
      const header = Buffer.alloc(16);
      await file.read(header, 0, 16, 0);
      assert.equal(header.toString("ascii", 0, 4), "RIFF");
      assert.equal(header.toString("ascii", 8, 12), "WEBP");
      assert.equal(header.toString("ascii", 12, 16), "VP8L", "original must be losslessly encoded");
    } finally {
      await file.close();
    }
  }
});

test("previously reference-only companion items link to real guide readings", () => {
  for (const definition of chantDefinitions.filter((entry) => entry.bhajanQuery)) {
    assert.ok(searchBhajans(definition.bhajanQuery).length > 0, definition.id);
  }
  assert.deepEqual(chantDefinitions.find((entry) => entry.id === "suprabhatam").abpReference, ["suprabhatam", "verse-1"]);
});

test("portable guide embeds the entire bhajan book without external image paths", async () => {
  const html = await readFile(new URL("../public/ayyappa-companion.html", import.meta.url), "utf8");
  assert.equal((html.match(/data:image\/webp;base64,/g) || []).length, 451);
  assert.doesNotMatch(html, /"bhajan-pages\/page-\d+\.webp"/);
  assert.match(html, /function bhajansContent/);
  assert.match(html, /function resolveBhajan/);
});
