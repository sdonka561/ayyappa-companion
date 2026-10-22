import { randomBytes, pbkdf2Sync, createCipheriv } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  if (!["--input", "--output", "--secret-output"].includes(key) || !process.argv[index + 1]) {
    throw new Error("Usage: node tools/prepare-schedule.mjs --input <private.csv> --output <public-cipher.json> --secret-output <private-code.txt>");
  }
  args.set(key, process.argv[index + 1]);
}
if (args.size !== 3) {
  throw new Error("Usage: node tools/prepare-schedule.mjs --input <private.csv> --output <public-cipher.json> --secret-output <private-code.txt>");
}

const headers = [
  "Swamies Name", "Address", "Date", "Day", "Period", "Time",
  "Pooja Option Selected by Host", "Evite", "Priest Name", "Volunteer List",
];
const input = resolve(args.get("--input"));
const output = resolve(args.get("--output"));
const secretOutput = resolve(args.get("--secret-output"));
if (output === input || secretOutput === input || secretOutput === output) throw new Error("Input, cipher, and private code paths must differ.");
const csv = await readFile(input, "utf8");
const records = parseCsv(csv);
if (records.length < 2) throw new Error("The spreadsheet export has no schedule rows.");
const [sourceHeaders, ...sourceRows] = records;
const columns = new Map(sourceHeaders.map((header, index) => [header.trim(), index]));
for (const header of headers) if (!columns.has(header)) throw new Error(`Missing expected spreadsheet column: ${header}`);

const rows = sourceRows.filter(row => row.some(value => value.trim())).map(row => {
  const get = name => (row[columns.get(name)] || "").trim();
  return {
    name: get("Swamies Name"),
    address: get("Address"),
    date: get("Date"),
    day: get("Day"),
    period: get("Period"),
    time: get("Time"),
    puja: get("Pooja Option Selected by Host"),
    evite: get("Evite"),
    priest: get("Priest Name"),
    volunteers: get("Volunteer List"),
  };
});
if (rows.length === 0) throw new Error("No populated schedule rows were found.");
for (const [index, row] of rows.entries()) {
  if (!row.date || !row.day) throw new Error(`Schedule row ${index + 2} has no date or weekday.`);
}

const passphrase = randomBytes(18).toString("base64url");
const salt = randomBytes(16);
const iv = randomBytes(12);
const iterations = 600000;
const key = pbkdf2Sync(passphrase, salt, iterations, 32, "sha256");
const cipher = createCipheriv("aes-256-gcm", key, iv);
cipher.setAAD(Buffer.from("ayyappa-schedule-v1", "utf8"));
const encrypted = Buffer.concat([
  cipher.update(Buffer.from(JSON.stringify(rows), "utf8")),
  cipher.final(),
]);
const payload = {
  version: 1,
  cipher: "AES-256-GCM",
  kdf: "PBKDF2-SHA-256",
  iterations,
  salt: salt.toString("hex"),
  iv: iv.toString("hex"),
  ciphertext: Buffer.concat([encrypted, cipher.getAuthTag()]).toString("base64"),
};
await writeFile(secretOutput, `${passphrase}\n`, { flag: "wx" });
await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, { flag: "w" });
console.log(`Encrypted ${rows.length} read-only schedule entries. The access passphrase is saved separately in the private file.`);

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index++;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"' && field === "") quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index++;
      row.push(field);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw new Error("The CSV export contains an unterminated quoted field.");
  if (field || row.length) {
    row.push(field);
    if (row.some(value => value.trim())) rows.push(row);
  }
  return rows;
}
