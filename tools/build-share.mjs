import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../public/", import.meta.url);
const [html, css, content, chantData, rituals, app, inventory, image, favicon, padayatraImage, bookData, book] = await Promise.all([
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
  readFile(new URL("book-data.mjs", root), "utf8"),
  readFile(new URL("book.mjs", root), "utf8"),
]);
const importLine = /^import \{[^\n]+\} from "\.\/[\w-]+\.mjs";\r?\n/gm;
if (!(app.match(importLine)?.length === 8)) throw new Error("App imports changed; update the standalone builder.");
let embeddedBook = bookData;
const { bookPages } = await import("../public/book-data.mjs");
for (const page of bookPages) {
  const bytes = await readFile(new URL(page.image, root));
  embeddedBook = embeddedBook.replace(JSON.stringify(page.image), JSON.stringify(`data:image/jpeg;base64,${bytes.toString("base64")}`));
}
const script = [
  await readFile(new URL("astronomy.mjs", root), "utf8"),
  (await readFile(new URL("panchang.mjs", root), "utf8")).replace(importLine, ""),
  (await readFile(new URL("calendar.mjs", root), "utf8")).replace(importLine, ""),
  await readFile(new URL("pronunciation.mjs", root), "utf8"),
  await readFile(new URL("abp-data.mjs", root), "utf8"),
  (await readFile(new URL("abp.mjs", root), "utf8")).replace(importLine, "").replace(/^export \{ abpTabs \};\r?\n/m, ""),
  await embedBhajanPages(),
  (await readFile(new URL("bhajans.mjs", root), "utf8")).replace(importLine, "").replace(/^export \{ bhajanBook \};\r?\n/m, ""),
  content,
  chantData,
  embeddedBook,
  book.replace(importLine, "").replace(/^export \{ bookPages \};\r?\n/m, ""),
  rituals.replace(importLine, "").replaceAll('"padayatra-page-42.jpg"', `"data:image/jpeg;base64,${padayatraImage.toString("base64")}"`),
  app.replace(importLine, "").replaceAll('src="ayyappa.jpg"', `src="data:image/jpeg;base64,${image.toString("base64")}"`),
].join("\n").replace(/^export /gm, "").replace(/<\/script/gi, "<\\/script");
const output = html
  .replace('<link rel="icon" href="icon.svg" type="image/svg+xml">', `<link rel="icon" href="data:image/svg+xml;base64,${favicon.toString("base64")}">`)
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="app.mjs"></script>', () => `<script id="embedded-inventory" type="application/json">${inventory.replaceAll("<", "\\u003c")}</script><script type="module">${script}</script>`);
await writeFile(new URL("ayyappa-companion.html", root), output);
console.log(`Built public\\ayyappa-companion.html (self-contained: ABP, Namavali, ${bookPages.length} Nitya Puja pages, and the complete bhajan book).`);

async function embedBhajanPages() {
  const { bhajanBook } = await import("../public/bhajan-data.mjs");
  const pages = [];
  for (const page of bhajanBook.pages) {
    const image = await readFile(new URL(page.image, root));
    pages.push({ ...page, image: `data:image/webp;base64,${image.toString("base64")}` });
  }
  return `export const bhajanBook = ${JSON.stringify({ ...bhajanBook, pages })};`;
}
