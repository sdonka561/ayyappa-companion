import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { primaryBook, bookChapters, bookPages, chapterForPage, resolveBookLocation, searchBook } from "../public/book.mjs";

test("the selected Nitya Puja book covers all 61 pages exactly once", () => {
  assert.equal(primaryBook.id, "1EDanwSJyooDryISf5TedJcoKyl_VjJ5Q");
  assert.equal(bookPages.length, 61);
  assert.equal(bookChapters.length, 15);
  assert.equal(new Set(bookChapters.map((chapter) => chapter.id)).size, bookChapters.length);
  const coverage = bookChapters.flatMap((chapter) => Array.from({ length: chapter.end - chapter.start + 1 }, (_, index) => chapter.start + index));
  assert.deepEqual(coverage, Array.from({ length: 61 }, (_, index) => index + 1));
  for (const chapter of bookChapters) {
    assert.ok(chapter.title.en);
    assert.match(chapter.title.te, /[\u0c00-\u0c7f]/);
  }
});

test("all original pages exist and retain correct printed/PDF numbering", async () => {
  for (const [index, page] of bookPages.entries()) {
    assert.equal(page.page, index + 1);
    assert.equal(page.printed, index === 0 ? null : page.page + 2);
    assert.match(page.text, /[\u0c00-\u0c7f]/);
    assert.ok(page.confidence >= 0 && page.confidence <= 100);
    assert.ok((await stat(new URL(`../public/${page.image}`, import.meta.url))).size > 10000);
  }
  assert.equal(bookPages[39].printed, 42);
  assert.equal(chapterForPage(40).id, "padayatra");
  assert.equal(chapterForPage(41).id, "padayatra");
  assert.equal(chapterForPage(61).id, "bhajans");
  assert.equal(chapterForPage(62), undefined);
});

test("book routes reject missing chapters and out-of-chapter or non-integer pages", () => {
  assert.equal(resolveBookLocation("opening", "").page.page, 18);
  assert.equal(resolveBookLocation("padayatra", "40").page.printed, 42);
  for (const [chapter, page] of [["unknown", ""], ["cover", "0"], ["opening", "17"], ["opening", "21"], ["opening", "18.5"], ["opening", "NaN"], ["bhajans", "62"]]) {
    assert.equal(resolveBookLocation(chapter, page), null);
  }
});

test("book search covers chapter names and draft text without changing the source", () => {
  assert.equal(searchBook(" ").length, 0);
  assert.ok(searchBook("padayatra").some((chapter) => chapter.id === "padayatra"));
  assert.ok(searchBook("మాలధారణ").some((chapter) => chapter.id === "initiation"));
  assert.ok(searchBook("Harivarasanam").some((chapter) => chapter.id === "night"));
  for (const result of searchBook("శరణం")) {
    assert.ok(result.matchPage >= result.start && result.matchPage <= result.end);
  }
  assert.deepEqual(searchBook("nonexistent_12345"), []);
});

test("ABP defaults first while the original PDF and companion routes remain available", async () => {
  const app = await readFile(new URL("../public/app.mjs", import.meta.url), "utf8");
  assert.match(app, /active = params\.get\("topic"\) \|\| "abp"/);
  assert.match(app, /state\.bookView = "auto"/);
  assert.match(app, /lang === "en" \? "pronunciation" : "original"/);
  assert.match(app, /Unreviewed OCR draft—not verified chanting text/);
  assert.match(app, /if \(active === "companion"\) return companionHome/);
  assert.match(app, /if \(active === "routine"\) return routinePage/);
  assert.match(app, /if \(active === "chanting"\)/);
  assert.match(app, /id="book-image-error" role="alert"/);
});

test("portable app embeds all original pages and has no book module dependencies", async () => {
  const html = await readFile(new URL("../public/ayyappa-companion.html", import.meta.url), "utf8");
  for (const page of bookPages) {
    assert.ok(!html.includes(JSON.stringify(page.image)), page.image);
  }
  assert.equal((html.match(/"image": "data:image\/jpeg;base64,/g) || []).length, 61);
  assert.doesNotMatch(html, /^import .* from "\.\//m);
  assert.doesNotMatch(html, /^export /m);
  assert.ok(html.includes("function bookReader"));
});
