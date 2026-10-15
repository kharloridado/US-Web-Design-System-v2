// A few USWDS stories hotlink images from other sites (card and collection
// examples). Screenshots must not depend on those sites being up, so this
// downloads each one into reference/external/<host>/<path>, which is committed.
// verify.mjs serves cached files and blocks every other outside request.
//
// Run where those hosts are reachable (e.g. GitHub Actions). Hosts that can't
// be reached are reported and skipped; the pages then render without that image
// and report.json lists them.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const siteDir = path.join(root, "reference/site");
const externalDir = path.join(root, "reference/external");

const cachePath = (url) => {
  const u = new URL(url);
  return path.join(externalDir, u.host, decodeURIComponent(u.pathname));
};

const urls = new Set();
for (const f of fs.readdirSync(siteDir).filter((f) => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(siteDir, f), "utf8");
  for (const m of html.matchAll(/\b(?:src|srcset|poster)="(https?:\/\/[^"\s]+)"/g)) urls.add(m[1]);
}

let fetched = 0;
let cached = 0;
const missing = [];
for (const url of [...urls].sort()) {
  const out = cachePath(url);
  if (fs.existsSync(out)) {
    cached++;
    continue;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    fetched++;
  } catch (err) {
    missing.push(`${url} (${err.cause?.code ?? err.message})`);
  }
}

console.log(`External images in USWDS stories: ${urls.size}. Already cached: ${cached}. Downloaded: ${fetched}.`);
if (missing.length) {
  console.warn(`Not reachable from here (${missing.length}); pages render without them:`);
  missing.forEach((m) => console.warn(`  ${m}`));
}
