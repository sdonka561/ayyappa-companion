import test from "node:test";
import assert from "node:assert/strict";
import { chantTexts, songCatalogue } from "../public/chant-data.mjs";
import { chantDefinitions, pujaRoutine, ritualPhase, ritualDay } from "../public/rituals.mjs";
import { topicById } from "../public/content.mjs";
import { readFile } from "node:fs/promises";

test("the ashtottaram contains exactly 108 source-numbered Telugu entries", () => {
  assert.equal(chantTexts.ashtottaram.length, 108);
  for (const [index, entry] of chantTexts.ashtottaram.entries()) {
    assert.equal(entry.reference, `C${index + 3}`);
    assert.match(entry.te, /[\u0c00-\u0c7f]/);
    assert.equal("roman" in entry, false);
  }
  assert.match(chantTexts.ashtottaram[107].te, /భక్తవత్సల/);
});

test("the incomplete source litany is preserved without being padded", () => {
  assert.equal(chantTexts.sharanaghosha.length, 107);
  assert.ok(chantDefinitions.find((entry) => entry.id === "sharanaghosha").notice.en.includes("107"));
  assert.equal(chantTexts["sharanam-108"].length, 108);
  assert.equal(new Set(chantTexts["sharanam-108"].map((line) => line.te)).size, 1);
});

test("each available reader has nonempty text; references are not fake playable tracks", () => {
  for (const definition of chantDefinitions) {
    if (definition.referenceOnly) assert.equal(chantTexts[definition.id], undefined);
    else {
      assert.ok(chantTexts[definition.id].length);
      for (const line of chantTexts[definition.id]) {
        assert.match(line.te, /[\u0c00-\u0c7f]/);
        assert.equal("roman" in line, false);
        assert.ok(line.reference);
      }
    }
  }
  assert.equal(chantTexts.pancharatna.length, 5);
  assert.ok(chantTexts.responses.length > 20);
});

test("English meanings are separate editorial translations, not transliterations", async () => {
  const translated = chantDefinitions.filter((entry) => entry.englishMeaning);
  assert.deepEqual(translated.map((entry) => entry.id), ["ganesha", "guru", "sharanam-108", "gayatri"]);
  for (const entry of translated) {
    assert.ok(chantTexts[entry.id]);
    assert.ok(entry.englishMeaning.length > 25);
  }
  const app = await readFile(new URL("../public/app.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(app, /readerScript|reader-script|item\.roman/);
  assert.match(app, /English meaning · editorial translation/);
  assert.match(app, /English translation is not yet available/);
  assert.match(app, /<span lang="te">/);
});

test("morning and evening essentials use local time", () => {
  assert.equal(ritualPhase(new Date(2026, 9, 18, 6)), "morning");
  assert.equal(ritualPhase(new Date(2026, 9, 18, 19)), "evening");
  assert.equal(ritualPhase(new Date(2026, 9, 18, 0)), "evening");
  assert.equal(ritualDay(new Date(2026, 0, 2, 23)), "2026-01-02");
});

test("padayatra reader uses printed page 42, not PDF page 42", async () => {
  const definition = chantDefinitions.find((entry) => entry.id === "padayatra");
  assert.equal(definition.source.id, "1EDanwSJyooDryISf5TedJcoKyl_VjJ5Q");
  assert.deepEqual(definition.source.pages, [40]);
  assert.match(definition.source.label, /printed p\. 42/);
  assert.equal(chantTexts.padayatra.length, 19);
  assert.equal(chantTexts.padayatra[0].te, "స్వామి శరణం\nఅయ్యప్ప శరణం");
  assert.equal(chantTexts.padayatra[18].te, "స్వామిమారే\nఅయ్యప్పమారే");
  for (const entry of chantTexts.padayatra) {
    assert.equal(entry.te.split("\n").length, 2);
    assert.match(entry.reference, /Printed p\. 42 · PDF p\. 40/);
  }
  const image = await readFile(new URL(`../public/${definition.sourceImage}`, import.meta.url));
  assert.equal(image.readUInt16BE(0), 0xffd8);
  const html = await readFile(new URL("../public/ayyappa-companion.html", import.meta.url), "utf8");
  assert.ok(html.includes(image.toString("base64")));
  assert.doesNotMatch(html, /sourceImage: "padayatra-page-42.jpg"/);
});

test("daily routine and eighteen reminders have complete bilingual content", () => {
  assert.equal(pujaRoutine.length, 12);
  for (const step of pujaRoutine) assert.ok(step.en && step.te);
  assert.equal(topicById("rules").sections[0].items.length, 18);
});

test("song catalogue has 43 distinct source cells and does not invent tempo", () => {
  assert.equal(songCatalogue.length, 43);
  assert.equal(new Set(songCatalogue.map((song) => song.cell)).size, 43);
  assert.equal(songCatalogue.filter((song) => song.tempo === "slow").length, 2);
  assert.equal(songCatalogue.filter((song) => song.tempo === "varied").length, 1);
  assert.ok(songCatalogue.every((song) => !("audio" in song) && !("lyrics" in song)));
});

test("portable file includes traditional readers and no remaining module imports", async () => {
  const html = await readFile(new URL("../public/ayyappa-companion.html", import.meta.url), "utf8");
  assert.ok(html.includes("const chantTexts ="));
  assert.ok(html.includes("function ritualPhase"));
  assert.doesNotMatch(html, /^import .* from "\.\//m);
});
