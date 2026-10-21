import { readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../node_modules/astronomy-engine/esm/astronomy.js", import.meta.url), "utf8");
const library = source.replace(/^export (?=(?:const|let|var|class|function) )/gm, "");
if (/^export /m.test(library)) throw new Error("Astronomy Engine exports changed; review the browser wrapper.");
const names = "Body, Observer, SunPosition, Ecliptic, GeoVector, SearchRiseSet, SearchMoonPhase, MoonPhase";
await writeFile(new URL("../public/astronomy.mjs", import.meta.url), `// Generated from astronomy-engine 2.1.19 by tools\\prepare-astronomy.mjs; MIT license below.\nexport const PanchangAstronomy = (() => {\n${library}\nreturn { ${names} };\n})();\n`);
console.log("Prepared licensed, self-contained Astronomy Engine browser module.");
