import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { websiteBhajans, searchWebsiteBhajans } from "../public/rituals.mjs";

const websiteTitles = [
  "గణనాథ ఏలుమయ", "గురుస్వామి పాట", "స్వామి కొండకు నేను వస్తా", "శుక్లాం బరధరం విష్ణుం",
  "సుబ్రహ్మణయ్య స్వామి పాట", "బుజ్జి బుజ్జి గణపయ్య", "నాగరాజ నాగరాజ", "దిగు దిగు దిగునాగ",
  "చుట్టూ ముట్టూ", "స్వామి రా రారారా", "జీవమున్నంత వరకూ", "నా చిన్న మణికంఠకు",
  "ఆడా నీవే..ఈడా నీవే..", "పడిమీద దీపాలు అయ్యప్పా", "నిన్నే నమ్మాను", "పందళ రాజా పంచ గిరీశ",
  "నాకు వచ్చిన ఘోష", "చల్లని ఓ చిరుగాలి", "పళ్ళి కట్టు - శబరి మళక్కు", "రావా అయ్యప్ప స్వామి రవ్వల పందిళ్ళలోకి",
  "మల్లెపూల పల్లకి", "ఓ కొండలారా ఓ కోనలారా", "నిను చూడగ నేనుండగలనా", "భూత నాథ సదా నందుడా",
  "ఊగే ఉయ్యాలకు అందమొచ్చెరా", "పుట్టెడు దుఃఖము", "కొండలన్ని దాటి దాటి", "పచ్చా పచ్చని చెట్టురా",
  "తండ్రి గొప్పతనము తెలుసుకో", "అమ్మా నాన్నలు ఇలలోన దైవమూ", "జీవితమే నీటి బుడగరా జీవమా", "శబరి కొండ బంగరు కొండ",
  "స్వామికిదే పూజ పాద పూజ", "మనసులో బాధ ఉంటే", "ప్రాణమున్నంత వరకు అయ్యప్ప", "నవ మాసాలు మోసిన తల్లి",
  "భూతనాథ సదానందా", "శబరిగిరి వాసా స్వామీ",
];
const websiteSlugs = [
  "ganesha-elumaya-2", "gurusvami-pata-3", "svami-kondaku-nenu-vasta-4", "shuklam-baradharam-vishnu-5",
  "subrahmanayya-svami-pata-6", "bujji-bujji-ganapayya-7", "nagaraja-nagaraja-8", "digu-digu-digunaga-9",
  "cuttu-muttu-10", "svami-ra-rarara-11", "jeevamunnantha-varaku-12", "naa-chinni-manikanta-13",
  "ade-neevu-ade-nenu-14", "padimeeda-deepalu-ayyappa-15", "ninne-namanu-16", "pandalaraja-panchagireesha-17",
  "naku-vachina-gosa-18", "challani-o-chirugali--19", "pallikattu-sabarimalaikku-20", "rava-ayyappa-swamy-ravvala-pandillaloki--21",
  "mallepula-pallaki-22", "o-kondalara-o-konalara-23", "ninnu-chudaka-nenundagalana-24", "bhootha-natha-sadananda-25",
  "ooge-uyyalaku-andam-ochhera-26", "puttedu-dukham-27", "kondalanni-dhaati-dhaati-28", "pacha-pachani-chettura-29",
  "tandri-goppathanam-telsuko-30", "amma-nannalu-ilalona-daivamu-31", "jeevitame-neeti-budaga-raa-jeevamaa-32",
  "shabari-konda-bangaru-konda-33", "swami-kidhe-pooja-padi-pooja-34", "manasulo-baadha-unte-36",
  "pranamunnantha-varaku-ayyappa-37", "nava-maasaalu-mosina-talli-38", "bhootanaada-sadaananda-ayyappa-39", "sabarigiri-vaasaa-swamy-40",
];

test("Bhajans contains only the 38 ordered songs from Ayyappa Telugu", () => {
  assert.equal(websiteBhajans.length, 38);
  assert.deepEqual(websiteBhajans.map(song => song.number), Array.from({ length: 38 }, (_, index) => index + 1));
  assert.deepEqual(websiteBhajans.map(song => song.id), Array.from({ length: 38 }, (_, index) => `site-${String(index + 1).padStart(3, "0")}`));
  assert.deepEqual(websiteBhajans.map(song => song.title), websiteTitles);
  assert.deepEqual(websiteBhajans.map(song => song.externalSource.url.replace("https://www.ayyappatelugu.com/bajanapatalu/", "")), websiteSlugs);
  assert.equal(new Set(websiteBhajans.map(song => song.externalSource.url)).size, 38);
  assert.ok(websiteBhajans.every(song =>
    song.singer && song.externalSource.singer === song.singer &&
    song.externalSource.title === song.title &&
    /^https:\/\/www\.ayyappatelugu\.com\/bajanapatalu\/[^/]+$/.test(song.externalSource.url) &&
    !song.lyrics && !song.audio && !song.referencePage));
  assert.equal(websiteBhajans[1].singer, "గానం: పి.కేశవ గురుస్వామి");
  assert.equal(websiteBhajans[7].externalSource.url, "https://www.ayyappatelugu.com/bajanapatalu/digu-digu-digunaga-9");
  assert.equal(websiteBhajans[37].externalSource.url, "https://www.ayyappatelugu.com/bajanapatalu/sabarigiri-vaasaa-swamy-40");
});

test("website song search matches Telugu titles and singer credits", () => {
  assert.equal(searchWebsiteBhajans("").length, 38);
  assert.deepEqual(searchWebsiteBhajans("దిగు").map(song => song.id), ["site-008"]);
  assert.deepEqual(searchWebsiteBhajans("పారుపల్లి").map(song => song.id), ["site-008"]);
  assert.deepEqual(searchWebsiteBhajans("నార్సింగి గురుస్వామి").map(song => song.id), [
    "site-004", "site-015", "site-016", "site-030", "site-033", "site-034", "site-035", "site-036", "site-037",
  ]);
  assert.equal(searchWebsiteBhajans("unmatched_12345").length, 0);
});

test("the removed 43-song list and lyrics do not remain in the Bhajan modules", async () => {
  for (const path of ["../public/app.mjs", "../public/rituals.mjs", "../public/chant-data.mjs"]) {
    const contents = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(contents, /Ganesha Saranam|Chinni chinni kavadi|Gurumaharaj Gurumaharaj|songCatalogue|selectedBhajanContent/);
  }
});

test("removed PDF archive is absent from the source inventory and frontend modules", async () => {
  const inventory = JSON.parse(await readFile(new URL("../public/sources.json", import.meta.url), "utf8"));
  assert.equal(inventory.some(source => source.name === "Ayyappa_bhajans3.pdf"), false);
  for (const path of ["../public/app.mjs", "../public/rituals.mjs", "../public/sources.json"]) {
    const contents = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(contents, /Ayyappa_bhajans3|bhajan-pages|bhajan-data\.mjs/);
  }
  const portable = await readFile(new URL("../public/ayyappa-companion.html", import.meta.url), "utf8");
  assert.doesNotMatch(portable, /Ayyappa_bhajans3|bhajan-pages|function searchBhajans|data:image\/webp;base64,/);
});
