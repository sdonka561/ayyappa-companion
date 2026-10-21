import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { abpTabs, abpSource, resolveAbp, searchAbp, sahasranamavaliGroups } from "../public/abp.mjs";
import { pronounceTelugu } from "../public/pronunciation.mjs";

test("ABP has all nine source tabs in order and 54 individually addressable subsections", () => {
  assert.deepEqual(abpTabs.map((tab) => tab.title), [
    "Maladharana and Peetham setup", "Pooja Sequence", "Atha Angapooja",
    "ASHTOTHARAM", "SARANUGHOSHA", "PANCHARATNA STOTRAM",
    "HARATHI-KSHAMAPANA", "SAHSRANAMAVALI", "SUPRABHATAM",
  ]);
  assert.equal(abpTabs.flatMap((tab) => tab.sections).length, 54);
  assert.equal(new Set(abpTabs.map((tab) => tab.id)).size, 9);
  assert.match(abpSource.url, /1oeRnnIt7VN2bI_ZjYu49dZqGRdkynvPx/);
  for (const tab of abpTabs) {
    assert.equal(new Set(tab.sections.map((section) => section.id)).size, tab.sections.length);
    for (const section of tab.sections) {
      assert.ok(section.lines.length);
      assert.equal(resolveAbp(tab.id, section.id)?.section, section);
      assert.ok(section.lines.every((line) => typeof line.text === "string" && line.text.length));
    }
  }
  assert.equal(resolveAbp("missing"), null);
  assert.equal(resolveAbp("ashtottaram", "missing"), null);
  assert.equal(resolveAbp("ashtottaram", "harathi"), null);
});

test("all non-branding workbook cells are preserved exactly once, including source pronunciation and numbering", () => {
  for (const tab of abpTabs) {
    const cells = new Map();
    const add = (ref, value) => {
      assert.ok(!cells.has(ref), `${tab.title}: duplicate cell ${ref}`);
      cells.set(ref, value);
    };
    for (const section of tab.sections) {
      for (const line of section.lines) {
        add(line.ref, line.text);
        if (line.pronunciationRef) add(line.pronunciationRef, line.pronunciation);
        if (line.numberRef) add(line.numberRef, line.number);
      }
    }
    assert.equal(cells.size, tab.cellCount);
    const entries = [...cells].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
    assert.equal(createHash("sha256").update(JSON.stringify(entries)).digest("hex"), tab.digest, tab.title);
  }
});

test("parallel deity prayers and source variants never mix; incomplete lists are not padded", () => {
  const anga = resolveAbp("angapooja").tab;
  assert.equal(anga.sections.length, 3);
  for (const [index, column] of ["A", "H", "N"].entries()) {
    assert.ok(anga.sections[index].lines.every((line) => line.ref.startsWith(column)));
  }
  assert.deepEqual(resolveAbp("harathi").tab.sections.map((section) => section.id), ["harathi", "responses", "kshamapana"]);
  assert.equal(resolveAbp("sharanaghosha", "sharanaghosha").section.lines.length - 1, 107);
  for (const variant of ["ayyappa-type-1", "ayyappa-type-2"]) {
    const section = resolveAbp("ashtottaram", variant).section;
    assert.equal(section.lines.filter((line) => /[KO](?:[3-9]|[1-9]\d|10\d)$/.test(line.ref)).length, 107);
  }
  assert.equal(resolveAbp("sahasranamavali", "names").section.lines.length, 1000);
  assert.ok(resolveAbp("sahasranamavali", "names").section.lines.every((line) => line.pronunciation));
  const numbers = resolveAbp("sequence").tab.sections.flatMap((section) => section.lines).filter((line) => line.number).map((line) => line.number);
  assert.equal(numbers.length, 23);
  assert.equal(numbers.at(-1), "24");
});

test("English-letter pronunciation is available for every Telugu prayer and source Roman text is retained", () => {
  for (const tab of abpTabs) for (const section of tab.sections) for (const line of section.lines) {
    const value = line.pronunciation || pronounceTelugu(line.text);
    assert.doesNotMatch(value, /[\u0c00-\u0c7f]/, `${tab.title} ${line.ref}`);
  }
  assert.equal(resolveAbp("sahasranamavali", "names").section.lines[0].pronunciation, "om shivaputraaya namah' .");
});

test("ABP search finds subsection titles, Telugu prayer lines, and supplied pronunciation", () => {
  assert.ok(searchAbp("Type 2").some(({ section }) => section.id === "ayyappa-type-2"));
  assert.ok(searchAbp("శివపుత్రాయ").some(({ tab }) => tab.id === "sahasranamavali"));
  assert.ok(searchAbp("shivaputraaya").some(({ tab }) => tab.id === "sahasranamavali"));
  assert.deepEqual(searchAbp(""), []);
  assert.deepEqual(searchAbp("nonexistent_12345"), []);
});

test("Sahasranamavali numbers exactly 1000 names in 100 groups of ten without modifying either source language", () => {
  const groups = sahasranamavaliGroups();
  const original = resolveAbp("sahasranamavali", "names").section.lines;
  assert.equal(groups.length, 100);
  for (const [index, group] of groups.entries()) {
    assert.equal(group.start, index * 10 + 1);
    assert.equal(group.end, index * 10 + 10);
    assert.equal(group.lines.length, 10);
    assert.ok(group.lines.every((line) => line.text && line.pronunciation));
  }
  assert.deepEqual(groups.flatMap((group) => group.lines), original);
  assert.equal(groups[0].start, 1);
  assert.equal(groups.at(-1).end, 1000);
});

test("version picker and ABP routing are included in normal and portable readers", async () => {
  for (const path of ["app.mjs", "ayyappa-companion.html"]) {
    const app = await readFile(new URL(`../public/${path}`, import.meta.url), "utf8");
    assert.match(app, /id="guide-version"/);
    assert.match(app, /active = params\.get\("topic"\) \|\| "abp"/);
    assert.match(app, /if \(active === "abp"\) return abpContent/);
    assert.match(app, /if \(active === "book"\)/);
    assert.match(app, /id="abp-part"/);
    assert.match(app, /line\.pronunciation \|\| pronounceTelugu\(line\.text\)/);
  }
});
