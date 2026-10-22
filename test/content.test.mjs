import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { topics, topicById, searchTopics, sourceUrl, collectionUrl, poojaItems } from "../public/content.mjs";

const inventory = JSON.parse(await readFile(new URL("../public/sources.json", import.meta.url), "utf8"));
const byId = new Map(inventory.map((source) => [source.id, source]));
const hasBoth = (value) => {
  assert.ok(value.en?.trim(), "English text is required");
  assert.match(value.te || "", /[\u0c00-\u0c7f]/, "Telugu text is required");
};

test("the permanent collection is the sole folder reference", async () => {
  assert.ok(collectionUrl.includes("1CksLIfctrHaQum3a2GMWF2M-ZbwC4pz0"));
  for (const path of ["../public/app.mjs", "../public/content.mjs", "../PRODUCT.md", "../tools/extract_sources.py"]) {
    const file = await readFile(new URL(path, import.meta.url), "utf8");
    assert.ok(!file.includes("1-o54XXt-X0nm_LG_9iK6cn0bFPYssSee"), path);
  }
});

test("all requested topic surfaces are present", () => {
  for (const id of ["daily", "puja", "peetam", "food", "eating", "sleep", "prayers", "guidance"]) {
    assert.ok(topicById(id), id);
  }
  assert.equal(topicById("not-a-topic"), undefined);
});

test("all content and list items are bilingual", () => {
  for (const topic of topics) {
    hasBoth(topic.title);
    hasBoth(topic.short);
    hasBoth(topic.description);
    for (const section of topic.sections) {
      hasBoth(section.title);
      if (section.body) hasBoth(section.body);
      if (section.note) hasBoth(section.note);
      if (section.verse) { hasBoth(section.verse); hasBoth(section.verseLabel); }
      for (const item of [...(section.items || []), ...(section.checklist || [])]) hasBoth(item);
    }
  }
});

test("all navigation and section identifiers are valid and unique", () => {
  const ids = new Set();
  for (const topic of topics) {
    assert.ok(!ids.has(topic.id));
    ids.add(topic.id);
    for (const section of topic.sections) {
      assert.match(section.id, /^[a-z][a-z-]+$/);
      assert.ok(!ids.has(section.id), section.id);
      ids.add(section.id);
    }
    for (const related of topic.related) assert.ok(related === "sources" || topicById(related));
  }
});

test("all citations resolve to files in the permanent inventory with valid pages", () => {
  for (const topic of topics) for (const section of topic.sections) {
    if (!section.status) assert.ok(section.sources.length, `Missing source: ${section.id}`);
    for (const source of section.sources) {
      const file = byId.get(source.id);
      assert.ok(file, `Missing file: ${source.id}`);
      assert.equal(file.kind, "file");
      assert.equal(file.status, "text-extracted");
      for (const page of source.pages) assert.ok(Number.isInteger(page) && page >= 1 && page <= file.pages);
      if (source.sheet) assert.ok(file.name.endsWith(".xlsx"));
      assert.ok(sourceUrl(source).startsWith("https://drive.google.com/file/d/"));
    }
  }
});

test("English, Telugu, and multiple-term searches return relevant topics", () => {
  assert.ok(searchTopics("garlic").some((topic) => topic.id === "food"));
  assert.ok(searchTopics("  GARLIC  ginger ").some((topic) => topic.id === "food"));
  assert.ok(searchTopics("భిక్ష").some((topic) => topic.id === "eating"));
  assert.ok(searchTopics("peetham").some((topic) => topic.id === "peetam"));
  assert.deepEqual(searchTopics("unfindable_1234"), []);
  assert.equal(searchTopics(" ").length, topics.length);
});

test("source disagreements and editorial health advice remain visible", () => {
  const ingredients = topicById("food").sections.find((section) => section.id === "ingredients");
  assert.equal(ingredients.sources.length, 2);
  assert.match(ingredients.body.en, /not identical/i);
  const sleep = topicById("sleep");
  assert.ok(sleep.sections.find((section) => section.id === "where-to-sleep").sources[0].sheet);
  assert.equal(sleep.sections.find((section) => section.id === "adapt-rest").status, "editorial");
});

test("bhiksha serving guidance retains all four user-supplied customs with clear attribution", () => {
  const eating = topicById("eating");
  const guidance = eating.sections.find(section => section.id === "serving-and-space");
  assert.ok(guidance);
  assert.equal(guidance.title.en, "Guidelines for Serving and Space");
  assert.equal(guidance.status, "editorial");
  assert.deepEqual(guidance.sources, []);
  assert.match(guidance.body.en, /User-supplied.*not a rule verified/);
  assert.equal(guidance.items.length, 4);
  for (const [index, heading] of ["Serve with Humility, Then Step Aside", "Avoid Crowding", "Maintain Strict Seating Separation", "The Exception for Help"].entries()) {
    assert.ok(guidance.items[index].en.startsWith(`${heading}:`));
    hasBoth(guidance.items[index]);
  }
  assert.match(guidance.items[2].en, /not sit at the same level or eat alongside them simultaneously/);
  assert.match(guidance.items[3].en, /second helping of food or water/);
  assert.match(guidance.note.en, /do not require floor seating/);
  assert.ok(searchTopics("bikhsa teesukune vidhanam").includes(eating));
  assert.ok(searchTopics("serving").includes(eating));
});

test("unreadable and confirmation-required documents are not passed off as extracted", () => {
  assert.equal(inventory.filter((entry) => entry.kind === "file").length, 52);
  assert.equal(inventory.filter((entry) => entry.kind === "file" && entry.folder.startsWith("Ayyappa")).length, 51);
  const largePdf = inventory.find((entry) => entry.name === "chandramouli-ayyappa pooja.pdf");
  assert.equal(largePdf.status, "download-confirmation");
  assert.ok(inventory.some((entry) => entry.status === "needs-ocr"));
  assert.ok(inventory.some((entry) => entry.status === "needs-font-decoding"));
});

test("Sahasranamam shopping checklist retains all 49 source rows and arrangements", () => {
  const topic = topicById("pooja-items");
  assert.equal(poojaItems.length, 49);
  assert.deepEqual(poojaItems.map((item) => item.row), Array.from({ length: 49 }, (_, index) => index + 2));
  const section = topic.sections.find((entry) => entry.id === "items-checklist");
  assert.equal(section.table.length, 49);
  for (const [index, item] of poojaItems.entries()) {
    assert.equal(section.table[index].item, item.item);
    assert.equal(section.table[index].quantity, item.quantity);
    assert.match(section.table[index].telugu, /[\u0c00-\u0c7f]/);
  }
  assert.match(poojaItems.find((item) => item.row === 22).quantity, /20 big, 40 small.*Do not buy/);
  assert.match(poojaItems.find((item) => item.row === 4).quantity, /3ft - 1 count.*\n2ft - 2/);
  assert.equal(poojaItems.find((item) => item.row === 48).quantity, "");
  assert.equal(section.table[46].item, "$21 for GuruDakshina");
  assert.equal(section.checklist, undefined);
  assert.match(topic.sections[0].body.en, /app does not arrange supplies/);
  assert.ok(topic.sections[0].externalLinks.some((link) => link.url.includes("1rUCbZVUdAHl3bUwDW8lb3_ODmJHfg1Yn")));
  assert.ok(searchTopics("sahasranamam ghee").includes(topic));
  assert.ok(searchTopics("సామగ్రి").includes(topic));
});

test("supplies render in a two-column table without source-row labels", async () => {
  const app = await readFile(new URL("../public/app.mjs", import.meta.url), "utf8");
  assert.match(app, /<table class="supplies-table">/);
  assert.match(app, /<th scope="col">/);
  assert.match(app, /t\("Item", "వస్తువు"\)/);
  assert.match(app, /t\("Quantity \/ arrangement"/);
  assert.doesNotMatch(app, /Source row|మూల వరుస|item\.row/);
});

test("portable build has embedded content, styles, inventory, and image", async () => {
  const portable = await readFile(new URL("../public/ayyappa-companion.html", import.meta.url), "utf8");
  assert.ok(portable.includes('id="embedded-inventory"'));
  assert.ok(portable.includes("data:image/jpeg;base64,"));
  assert.ok(portable.includes(collectionUrl));
  assert.ok(!portable.includes('src="app.mjs"'));
  assert.ok(!portable.includes('href="style.css"'));
  assert.ok(!portable.includes('src="ayyappa.jpg"'));
  assert.ok(!portable.includes('from "./content.mjs"'));
});
