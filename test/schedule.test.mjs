import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decryptSchedule, renderSchedule } from "../public/schedule.mjs";

const encoder = new TextEncoder();

async function seal(rows, passphrase = "test shared phrase") {
  const salt = new Uint8Array(16).fill(17);
  const iv = new Uint8Array(12).fill(29);
  const material = await webcrypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const key = await webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" }, material,
    { name: "AES-GCM", length: 256 }, false, ["encrypt"],
  );
  const sealed = new Uint8Array(await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode("ayyappa-schedule-v1"), tagLength: 128 },
    key, encoder.encode(JSON.stringify(rows)),
  ));
  return {
    version: 1, cipher: "AES-256-GCM", kdf: "PBKDF2-SHA-256", iterations: 600000,
    salt: Buffer.from(salt).toString("hex"), iv: Buffer.from(iv).toString("hex"),
    ciphertext: Buffer.from(sealed).toString("base64"),
  };
}

test("schedule encryption unlocks valid rows and rejects a wrong passphrase or tampered data", async () => {
  const rows = [{
    name: "Example Swamy", address: "1 Example Rd", date: "10/24", day: "Saturday",
    period: "Morning", time: "9:30 AM", puja: "Abhishekam", evite: "", priest: "Priest",
    volunteers: "Volunteer",
  }];
  const payload = await seal(rows);
  assert.deepEqual(await decryptSchedule("test shared phrase", payload), rows);
  await assert.rejects(decryptSchedule("wrong", payload), { message: "invalid-passphrase" });
  await assert.rejects(decryptSchedule("test shared phrase", { ...payload, ciphertext: "AAAA" }), { message: "invalid-passphrase" });
  await assert.rejects(decryptSchedule("phrase", { ...payload, iterations: 1 }), { message: "invalid-ciphertext" });
  await assert.rejects(decryptSchedule("phrase", payload), { message: "invalid-passphrase" });
});

test("schedule table escapes source values and only renders secure Evite links", async () => {
  const rows = [{
    name: "<img src=x onerror=alert(1)>", address: "<script>alert(1)</script>", date: "10/24",
    day: "Saturday", period: "Morning", time: "9:30 AM", puja: "Abhishekam",
    evite: "javascript:alert(1)", priest: "", volunteers: "",
  }];
  const english = renderSchedule("en", rows);
  assert.match(english, /Swami name/);
  assert.match(english, /Pooja option selected by host/);
  assert.match(english, /Saturday/);
  assert.match(english, /Abhishekam/);
  assert.match(english, /Not assigned/);
  assert.match(english, /aria-label="Swami pooja schedule table"/);
  assert.doesNotMatch(english, /<img src=x|<script>alert/);
  assert.doesNotMatch(english, /href="javascript:/);
  const safe = renderSchedule("te", [{ ...rows[0], evite: "https://evite.me/example" }]);
  assert.match(safe, /href="https:\/\/evite\.me\/example"/);
  assert.match(safe, /పూజా షెడ్యూల్/);
  assert.match(safe, /వారం రోజు/);
});

test("private CSV preparation preserves quoted values and writes only encrypted rows publicly", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ayyappa-schedule-test-"));
  const input = join(directory, "schedule.csv");
  const output = join(directory, "schedule.enc.json");
  const secret = join(directory, "private-code.txt");
  const csv = [
    '"Swamies Name",Address,Date,Day,Period,Time,"Pooja Option Selected by Host",Evite,"Priest Name","Volunteer List"',
    '"Example Swamy","123 Example St, Unit 4",10/24,Saturday,Morning,9:30 AM,"Abhishekam, Ganapathi Homam",https://evite.me/demo,"Priest Example","Volunteer One; Volunteer Two"',
    "",
  ].join("\n");
  try {
    await writeFile(input, csv);
    execFileSync(process.execPath, [
      "tools/prepare-schedule.mjs", "--input", input, "--output", output, "--secret-output", secret,
    ], { cwd: new URL("..", import.meta.url), stdio: "pipe" });
    const passphrase = (await readFile(secret, "utf8")).trim();
    const payloadText = await readFile(output, "utf8");
    const rows = await decryptSchedule(passphrase, JSON.parse(payloadText));
    assert.deepEqual(rows, [{
      name: "Example Swamy", address: "123 Example St, Unit 4", date: "10/24", day: "Saturday",
      period: "Morning", time: "9:30 AM", puja: "Abhishekam, Ganapathi Homam",
      evite: "https://evite.me/demo", priest: "Priest Example", volunteers: "Volunteer One; Volunteer Two",
    }]);
    assert.equal(payloadText.includes("Example Swamy"), false);
    assert.equal(payloadText.includes("123 Example St"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("deployed schedule payload and offline page do not contain readable source values", async () => {
  const payloadText = await readFile(new URL("../public/swami-schedule.enc.json", import.meta.url), "utf8");
  const payload = JSON.parse(payloadText);
  assert.equal(payload.version, 1);
  assert.equal(payload.cipher, "AES-256-GCM");
  assert.equal(payload.iterations, 600000);
  assert.equal(Buffer.from(payload.ciphertext, "base64").length > 8000, true);
  for (const marker of ["Swamies Name", "Pooja Option Selected by Host", "Evite", "Irumudi/Irumudi Pooja", "10/17,Saturday"]) {
    assert.equal(payloadText.includes(marker), false, marker);
  }
  const html = await readFile(new URL("../public/ayyappa-companion.html", import.meta.url), "utf8");
  const embedded = JSON.parse(html.match(/<script id="swami-schedule-cipher" type="application\/json">([^<]+)<\/script>/)[1]);
  assert.deepEqual(embedded, payload);
  assert.equal(html.includes("Swami Pooja Schedule"), true);
  assert.equal(html.includes("Swamies Name"), false);
  assert.equal(html.includes("Pooja Option Selected by Host"), false);
  assert.equal(html.includes("schedule.mjs"), false);
});
