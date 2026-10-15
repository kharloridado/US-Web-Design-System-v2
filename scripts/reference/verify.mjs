// Opens every reference page in Chromium and checks that USWDS's official CSS,
// JS, fonts and images load and run without errors. Captures the baselines that
// O11 Style Guide screens are compared against:
//   reference/aria/<story-id>.yml                      accessibility tree (gate 5), committed
//   reference/screenshots/<width>/<story-id>.png       with --screenshots (gate 4), git-ignored
//   reference/report.json                              summary, committed
//
// Usage: node scripts/reference/verify.mjs [--screenshots] [--only <id-substring>]

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const siteDir = path.join(root, "reference/site");
const ariaDir = path.join(root, "reference/aria");
const shotsDir = path.join(root, "reference/screenshots");
const uswdsDist = path.join(root, "node_modules/@uswds/uswds/dist");
const externalDir = path.join(root, "reference/external");
// Same layout as scripts/reference/fetch-external.mjs.
const cachePath = (url) => {
  const u = new URL(url);
  return path.join(externalDir, u.host, decodeURIComponent(u.pathname));
};

const args = process.argv.slice(2);
const takeScreenshots = args.includes("--screenshots");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
// Definition of Done gate 4 widths.
const WIDTHS = [320, 480, 640, 1024, 1400];
const ARIA_WIDTH = 1024;

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".ico": "image/x-icon", ".map": "application/json",
};

// Serves reference/site. Like USWDS's Storybook (staticDirs: ["../dist"]), any
// path not found there falls back to the official dist/, so stories that use
// root paths such as /img/hero.jpg resolve the same way.
function serve() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = [siteDir, uswdsDist]
      .map((base) => [base, path.join(base, urlPath)])
      .filter(([base, f]) => f.startsWith(base + path.sep))
      .map(([, f]) => f)
      .find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
    if (!file) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function settle(page) {
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
  // Let USWDS behaviors finish initializing (they run on DOMContentLoaded).
  await page.waitForTimeout(150);
}

async function main() {
  const pages = JSON.parse(fs.readFileSync(path.join(siteDir, "pages.json"), "utf8")).filter((p) => !only || p.id.includes(only));
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: ARIA_WIDTH, height: 800 }, reducedMotion: "reduce" });
  // No request leaves the local server. Images USWDS stories hotlink are served
  // from reference/external/ when cached (fetch-external.mjs), otherwise blocked.
  await context.route((url) => !url.href.startsWith(origin), (route) => {
    const cached = cachePath(route.request().url());
    return fs.existsSync(cached) ? route.fulfill({ path: cached }) : route.abort();
  });

  if (!only) fs.rmSync(ariaDir, { recursive: true, force: true });
  fs.mkdirSync(ariaDir, { recursive: true });

  const results = [];
  for (const p of pages) {
    const page = await context.newPage();
    const problems = [];
    const external = new Set();
    page.on("console", (msg) => msg.type() === "error" && problems.push(`console: ${msg.text()}`));
    page.on("pageerror", (err) => problems.push(`script error: ${err.message}`));
    page.on("requestfailed", (req) => {
      if (req.url().startsWith(origin)) problems.push(`request failed: ${req.url().slice(origin.length)}`);
      else external.add(new URL(req.url()).origin);
    });
    page.on("response", (res) => res.status() >= 400 && problems.push(`HTTP ${res.status()}: ${res.url().slice(origin.length)}`));

    await page.goto(`${origin}/${p.id}.html`);
    await settle(page);

    const aria = await page.locator("#storybook-root").ariaSnapshot();
    fs.writeFileSync(path.join(ariaDir, `${p.id}.yml`), `${aria}\n`);

    if (takeScreenshots) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        await page.waitForTimeout(50);
        const out = path.join(shotsDir, String(width), `${p.id}.png`);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        await page.screenshot({ path: out, fullPage: true, animations: "disabled" });
      }
    }

    // Console errors repeat the failed request they describe; keep one line per problem.
    const unique = [...new Set(problems.filter((m) => !/^console: Failed to load resource/.test(m)))];
    results.push({ id: p.id, ok: unique.length === 0, problems: unique, externalRequestsBlocked: [...external] });
    await page.close();
  }

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.ok);
  const withExternal = results.filter((r) => r.externalRequestsBlocked.length);
  const report = {
    uswdsVersion: JSON.parse(fs.readFileSync(path.join(uswdsDist, "../package.json"), "utf8")).version,
    pages: results.length,
    passed: results.length - failed.length,
    failed: failed.map(({ id, problems }) => ({ id, problems })),
    // Hotlinked images not in reference/external/ yet: run npm run reference:fetch where the hosts are reachable.
    externalImagesMissing: withExternal.map(({ id, externalRequestsBlocked }) => ({ id, origins: externalRequestsBlocked })),
    ariaSnapshots: results.length,
    screenshots: takeScreenshots ? results.length * WIDTHS.length : 0,
  };
  if (!only) fs.writeFileSync(path.join(root, "reference/report.json"), `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Verified ${report.passed} of ${report.pages} reference pages in Chromium.`);
  console.log(`Accessibility-tree baselines: ${report.ariaSnapshots} → reference/aria/`);
  if (takeScreenshots) console.log(`Screenshots: ${report.screenshots} at ${WIDTHS.join(", ")} px → reference/screenshots/`);
  if (withExternal.length) {
    console.log(`Pages missing a hotlinked USWDS example image: ${withExternal.length} (run npm run reference:fetch where the hosts are reachable)`);
  }
  for (const f of failed) {
    console.error(`FAIL ${f.id}`);
    f.problems.forEach((m) => console.error(`  ${m}`));
  }
  process.exit(failed.length ? 1 : 0);
}

main();
