import { createWorker } from "tesseract.js";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const directory = resolve(process.argv[2]);
const output = resolve(process.argv[3]);
const worker = await createWorker("tel", 1, { cachePath: directory });
try {
  const files = (await readdir(directory)).filter((file) => /^page-\d+\.png$/.test(file)).sort();
  if (files.length !== 61) throw new Error(`Expected 61 scanned pages; found ${files.length}.`);
  const pages = [];
  for (const file of files) {
    const page = Number(file.match(/\d+/)[0]);
    const cache = join(directory, `${file}.json`);
    const imageHash = createHash("sha256").update(await readFile(join(directory, file))).digest("hex");
    let data;
    try {
      data = JSON.parse(await readFile(cache, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (data?.imageHash !== imageHash) {
      const result = await worker.recognize(join(directory, file));
      data = { text: result.data.text.trim(), confidence: result.data.confidence, imageHash };
      await writeFile(cache, JSON.stringify(data));
    }
    pages.push({ page, printed: page === 1 ? null : page + 2, text: data.text, confidence: data.confidence, image: `book-pages/page-${String(page).padStart(2, "0")}.jpg` });
    console.log(`Page ${page}: ${data.confidence}% OCR confidence, ${data.text.length} characters`);
  }
  await writeFile(output, `export const bookPages = ${JSON.stringify(pages, null, 2)};\n`);
} finally {
  await worker.terminate();
}
