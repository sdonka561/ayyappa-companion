import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { pronounceTelugu } from "../public/pronunciation.mjs";
import { chantTexts } from "../public/chant-data.mjs";
import { bookPages } from "../public/book-data.mjs";

test("Telugu pronunciation uses English letters rather than translated meaning", () => {
  assert.equal(pronounceTelugu("స్వామియే శరణం అయ్యప్ప"), "svaamiyae sharanam ayyappa");
  assert.equal(pronounceTelugu("ఓం శ్రీ గురవే నమః"), "Om shree guravae namah");
  assert.equal(pronounceTelugu("అఆఇఈఉఊఎఏఐఒఓఔ"), "aaaieeuooeaeaiooaau");
  assert.equal(pronounceTelugu("క్క కా కి కీ కు కూ కృ కె కే కై కొ కో కౌ క్"), "kka kaa ki kee ku koo kru ke kae kai ko koa kau k");
  assert.equal(pronounceTelugu("౧౦౮\nశరణం!"), "108\nsharanam!");
  assert.equal(pronounceTelugu("క్\u200cష"), "ksha");
  assert.equal(pronounceTelugu("Next page 42"), "Next page 42");
  assert.equal(pronounceTelugu(""), "");
});

test("every typed chant and book draft can produce pronunciation without changing Telugu", () => {
  for (const line of Object.values(chantTexts).flat()) {
    const original = line.te;
    const pronunciation = pronounceTelugu(original);
    assert.ok(/[a-z]/i.test(pronunciation));
    assert.doesNotMatch(pronunciation, /[అ-హా-ౌ్]/);
    assert.equal(line.te, original);
    assert.equal(pronunciation.split("\n").length, original.split("\n").length);
  }
  for (const page of bookPages) {
    assert.ok(pronounceTelugu(page.text).length > 0);
  }
});

test("normal and portable reader scripts have valid JavaScript syntax", async () => {
  const app = await readFile(new URL("../public/app.mjs", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/ayyappa-companion.html", import.meta.url), "utf8");
  const portable = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(portable, "portable module must be embedded");
  assert.match(portable, /function pronounceTelugu/);
  for (const script of [app, portable]) {
    const result = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: script, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
});
