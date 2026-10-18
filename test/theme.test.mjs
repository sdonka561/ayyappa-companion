import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("all interface hex colors are black, white, or neutral gray", async () => {
  for (const path of ["style.css", "icon.svg"]) {
    const text = await readFile(new URL(`../public/${path}`, import.meta.url), "utf8");
    for (const match of text.matchAll(/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-f])/gi)) {
      const hex = match[1].length === 3 ? [...match[1]].map((char) => char + char).join("") : match[1];
      assert.equal(hex.slice(0, 2), hex.slice(2, 4), `${path}: ${match[0]}`);
      assert.equal(hex.slice(2, 4), hex.slice(4, 6), `${path}: ${match[0]}`);
    }
  }
});

test("photograph retains its natural color while browser theme is monochrome", async () => {
  const css = await readFile(new URL("../public/style.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(css, /grayscale\(/);
  assert.match(html, /name="theme-color" content="#111111"/);
  assert.match(css, /--canvas: #ffffff/);
  assert.match(css, /--black: #111111/);
});
