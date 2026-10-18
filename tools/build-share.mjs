import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../public/", import.meta.url);
const [html, css, content, chantData, rituals, app, inventory, image, favicon, padayatraImage] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("style.css", root), "utf8"),
  readFile(new URL("content.mjs", root), "utf8"),
  readFile(new URL("chant-data.mjs", root), "utf8"),
  readFile(new URL("rituals.mjs", root), "utf8"),
  readFile(new URL("app.mjs", root), "utf8"),
  readFile(new URL("sources.json", root), "utf8"),
  readFile(new URL("ayyappa.jpg", root)),
  readFile(new URL("icon.svg", root)),
  readFile(new URL("padayatra-page-42.jpg", root)),
]);
const importLine = /^import \{[^\n]+\} from "\.\/[\w-]+\.mjs";\r?\n/gm;
if (!(app.match(importLine)?.length === 3)) throw new Error("App imports changed; update the standalone builder.");
const script = [
  content,
  chantData,
  rituals.replace(importLine, "").replaceAll('"padayatra-page-42.jpg"', `"data:image/jpeg;base64,${padayatraImage.toString("base64")}"`),
  app.replace(importLine, "").replaceAll('src="ayyappa.jpg"', `src="data:image/jpeg;base64,${image.toString("base64")}"`),
].join("\n").replace(/^export /gm, "").replace(/<\/script/gi, "<\\/script");
const output = html
  .replace('<link rel="icon" href="icon.svg" type="image/svg+xml">', `<link rel="icon" href="data:image/svg+xml;base64,${favicon.toString("base64")}">`)
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="app.mjs"></script>', () => `<script id="embedded-inventory" type="application/json">${inventory.replaceAll("<", "\\u003c")}</script><script type="module">${script}</script>`);
await writeFile(new URL("ayyappa-companion.html", root), output);
console.log("Built public\\ayyappa-companion.html (self-contained, offline reading).");
