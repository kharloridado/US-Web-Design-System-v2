// Proves every USWDS behavior case (docs/acceptance/inventory.json → specs) is
// accounted for in tests/behavior/coverage/*.json, exactly once:
//   "ported"   → a Playwright test with the identical title exists in the named file
//   "internal" → no on-page equivalent; needs a category and a reason
// Exits 1 on any missing, extra or unverifiable entry.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const behaviorDir = path.join(root, "tests/behavior");
const coverageDir = path.join(behaviorDir, "coverage");
const inventory = JSON.parse(fs.readFileSync(path.join(root, "docs/acceptance/inventory.json"), "utf8"));

// Why a case can't run on a page. Anything else must be ported.
const CATEGORIES = {
  "unit-function": "tests a pure helper function (no DOM or user interaction)",
  "api-only": "calls a JavaScript API of the behavior that has no user-facing equivalent",
  "invalid-markup": "checks the error USWDS throws for malformed developer markup",
};

const entries = fs.existsSync(coverageDir)
  ? fs.readdirSync(coverageDir).filter((f) => f.endsWith(".json")).flatMap((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(coverageDir, f), "utf8"));
      return data.cases.map((c) => ({ ...c, ledger: f }));
    })
  : [];

const problems = [];
const key = (spec, title) => `${spec}\u0000${title}`;
const expected = new Map();
for (const s of inventory.specs) for (const title of s.cases) expected.set(key(s.file, title), (expected.get(key(s.file, title)) ?? 0) + 1);
const actual = new Map();
for (const e of entries) actual.set(key(e.spec, e.title), (actual.get(key(e.spec, e.title)) ?? 0) + 1);

for (const [k, n] of expected) {
  const got = actual.get(k) ?? 0;
  const [spec, title] = k.split("\u0000");
  if (got < n) problems.push(`missing: ${spec} › "${title}"${n > 1 ? ` (${got} of ${n})` : ""}`);
}
for (const [k, n] of actual) {
  const want = expected.get(k) ?? 0;
  const [spec, title] = k.split("\u0000");
  if (n > want) problems.push(`not a USWDS case (or listed too often): ${spec} › "${title}"`);
}

const testSources = new Map();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const quoted = (title) => [`"${title.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`, `'${title.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`, `\`${title.replace(/`/g, "\\`")}\``];

for (const e of entries) {
  if (e.status === "ported") {
    const file = path.join(behaviorDir, e.test ?? "");
    if (!e.test || !fs.existsSync(file)) {
      problems.push(`ported test file not found: ${e.test} (${e.spec} › "${e.title}")`);
      continue;
    }
    if (!testSources.has(file)) testSources.set(file, fs.readFileSync(file, "utf8"));
    const src = testSources.get(file);
    const found = quoted(e.title).some((q) => new RegExp(`\\btest\\(\\s*${escapeRe(q)}`).test(src));
    if (!found) problems.push(`no test("${e.title}") in ${e.test}`);
  } else if (e.status === "internal") {
    if (!CATEGORIES[e.category]) problems.push(`internal case needs a category (${Object.keys(CATEGORIES).join(", ")}): ${e.spec} › "${e.title}"`);
    if (!e.reason) problems.push(`internal case needs a reason: ${e.spec} › "${e.title}"`);
  } else {
    problems.push(`status must be "ported" or "internal": ${e.spec} › "${e.title}"`);
  }
}

const total = inventory.summary.behaviorCases;
const ported = entries.filter((e) => e.status === "ported").length;
const internal = entries.filter((e) => e.status === "internal");
console.log(`USWDS behavior cases: ${total}. Ported to Playwright: ${ported}. No on-page equivalent: ${internal.length}.`);
for (const [cat, label] of Object.entries(CATEGORIES)) {
  const n = internal.filter((e) => e.category === cat).length;
  if (n) console.log(`  ${cat}: ${n} (${label})`);
}
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.slice(0, 60).forEach((p) => console.error(`  ${p}`));
  if (problems.length > 60) console.error(`  … and ${problems.length - 60} more`);
  process.exit(1);
}
console.log("All cases accounted for.");
