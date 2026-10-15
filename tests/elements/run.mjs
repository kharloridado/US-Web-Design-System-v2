// Tests the USWDS custom elements (dist/js/uswds-os.js) against the USWDS reference
// pages (reference/site, from npm run reference:render).
//
// For each story in stories.mjs, an "element page" is the reference page with the
// story's markup replaced by the custom element, and USWDS's uswds.min.js replaced
// by our bundle. Then:
//   1. accessibility tree equals the reference baseline (reference/aria/<id>.yml)
//   2. screenshots at 320 and 1024 px match the reference page (≤ 0.1% pixels differ)
//   3. no script or console errors
// Plus behavior checks: values reach OutSystems through "uswds-change", attribute
// updates re-render, echoed values don't, and 50 mount/unmount cycles leave nothing behind.
//
// Usage: node tests/elements/run.mjs [--only <id-substring>]

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { STORIES } from "./stories.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const siteDir = path.join(root, "reference/site");
const ariaDir = path.join(root, "reference/aria");
const bundle = path.join(root, "dist/js/uswds-os.js");
const uswdsDist = path.join(root, "node_modules/@uswds/uswds/dist");
const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const WIDTHS = [320, 1024];
const MAX_DIFF_RATIO = 0.001; // Definition of Done gate 4: ≤ 0.1% of pixels
const TAGS = [...new Set(Object.values(STORIES).map((s) => s.tag))];
const HOST_CSS = `<style>${TAGS.join(", ")} { display: contents; }</style>`;

for (const required of [bundle, path.join(siteDir, "pages.json")]) {
  if (!fs.existsSync(required)) {
    console.error(`Missing ${path.relative(root, required)}. Run npm run build and npm run reference:render first.`);
    process.exit(1);
  }
}

// --- Element pages ---------------------------------------------------------------

const decode = (s) => s.replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function comboBoxOptions(html) {
  const select = html.match(/<select[\s\S]*?<\/select>/)[0];
  const options = [...select.matchAll(/<option value(?:="([^"]*)")?>([^<]*)<\/option>/g)].map((m) => ({
    value: decode(m[1] ?? ""),
    label: decode(m[2].trim()),
  }));
  const [first, ...rest] = options;
  return first.value === "" ? { empty: first.label, options: rest } : { empty: null, options };
}

function elementHtml(spec, referenceHtml) {
  const attrs = { ...spec.attrs };
  if (spec.optionsFromReference) {
    const { empty, options } = comboBoxOptions(referenceHtml);
    if (empty !== null) attrs["empty-option"] = empty;
    attrs.options = JSON.stringify(options);
  }
  const list = Object.entries(attrs).map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${escAttr(v)}"`)).join("");
  return `<${spec.tag}${list}></${spec.tag}>`;
}

function elementPage(id) {
  const spec = STORIES[id];
  const reference = fs.readFileSync(path.join(siteDir, `${id}.html`), "utf8");
  const element = elementHtml(spec, reference);
  let html = reference;
  if (spec.replace === "aside") {
    html = html.replace(/<aside class="usa-in-page-nav"[\s\S]*?<\/aside>/, element);
  } else {
    html = html.replace(/(<div id="storybook-root">)[\s\S]*(<\/div>\s*<script src="uswds\/js\/uswds\.min\.js">)/, `$1\n${element}\n$2`);
  }
  return html
    .replace('<script src="uswds/js/uswds.min.js"></script>', '<script src="uswds-os/uswds-os.js"></script>')
    .replace("</head>", `${HOST_CSS}\n</head>`);
}

// --- Server ------------------------------------------------------------------------

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".gif": "image/gif" };

function serve() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const element = urlPath.match(/^\/element\/(.+)\.html$/);
    if (element && STORIES[element[1]]) {
      res.writeHead(200, { "content-type": MIME[".html"] }).end(elementPage(element[1]));
      return;
    }
    if (urlPath === "/blank.html") {
      res.writeHead(200, { "content-type": MIME[".html"] }).end(`<!doctype html><html lang="en"><head><link rel="stylesheet" href="/uswds/css/uswds.min.css">${HOST_CSS}</head><body><main id="main-content"><h2 id="a">A</h2><p>a</p></main><script src="/uswds-os/uswds-os.js"></script></body></html>`);
      return;
    }
    const bases = [
      ["/element/uswds-os/", path.dirname(bundle)],
      ["/uswds-os/", path.dirname(bundle)],
      ["/element/", siteDir],
      ["/element/", uswdsDist],
      ["/", siteDir],
      ["/", uswdsDist],
    ];
    for (const [prefix, base] of bases) {
      if (!urlPath.startsWith(prefix)) continue;
      const file = path.join(base, urlPath.slice(prefix.length));
      if (file.startsWith(base + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
        fs.createReadStream(file).pipe(res);
        return;
      }
    }
    res.writeHead(404).end();
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// --- Checks ------------------------------------------------------------------------

const results = [];
const record = (name, ok, details = "") => {
  results.push({ name, ok, details });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${details ? `\n     ${details.replace(/\n/g, "\n     ")}` : ""}`);
};

async function openPage(context, url) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`script error: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(`console: ${m.text()}`));
  await page.addInitScript(() => {
    window.__changes = [];
    document.addEventListener("uswds-change", (e) => window.__changes.push(e.detail));
  });
  await page.goto(url);
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return { page, errors };
}

async function screenshot(page, width) {
  await page.setViewportSize({ width, height: 800 });
  await page.waitForTimeout(50);
  return PNG.sync.read(await page.screenshot({ fullPage: true, animations: "disabled" }));
}

function compare(a, b) {
  if (a.width !== b.width || a.height !== b.height) return { ratio: 1, note: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 });
  return { ratio: diff / (a.width * a.height), note: `${diff} px differ` };
}

async function storyChecks(context, origin, id) {
  const ref = await openPage(context, `${origin}/${id}.html`);
  const el = await openPage(context, `${origin}/element/${id}.html`);

  const expectedAria = fs.readFileSync(path.join(ariaDir, `${id}.yml`), "utf8").trim();
  await el.page.setViewportSize({ width: 1024, height: 800 });
  const aria = (await el.page.locator("#storybook-root").ariaSnapshot()).trim();
  record(`${id}: accessibility tree matches reference`, aria === expectedAria, aria === expectedAria ? "" : diffLines(expectedAria, aria));

  for (const width of WIDTHS) {
    const { ratio, note } = compare(await screenshot(ref.page, width), await screenshot(el.page, width));
    record(`${id}: looks identical at ${width}px`, ratio <= MAX_DIFF_RATIO, ratio <= MAX_DIFF_RATIO ? "" : `${(ratio * 100).toFixed(3)}% (${note})`);
  }
  record(`${id}: no script or console errors`, el.errors.length === 0, el.errors.join("\n"));
  await ref.page.close();
  await el.page.close();
}

function diffLines(expected, actual) {
  const e = expected.split("\n");
  const a = actual.split("\n");
  const out = [];
  for (let i = 0; i < Math.max(e.length, a.length) && out.length < 12; i++) {
    if (e[i] !== a[i]) out.push(`line ${i + 1}\n  expected: ${e[i] ?? "(none)"}\n  actual:   ${a[i] ?? "(none)"}`);
  }
  return out.join("\n");
}

const changes = (page) => page.evaluate(() => window.__changes);

async function behaviorChecks(context, origin) {
  const run = async (name, id, fn) => {
    if (only && !id.includes(only)) return;
    const { page, errors } = await openPage(context, `${origin}/element/${id}.html`);
    try {
      const failure = await fn(page);
      record(name, !failure && errors.length === 0, [failure, ...errors].filter(Boolean).join("\n"));
    } catch (err) {
      record(name, false, err.message.split("\n")[0]);
    }
    await page.close();
  };

  await run("combo box: choosing an option reports its value", "components-form-inputs-combo-box--default", async (page) => {
    await page.locator("#fruit").click();
    await page.keyboard.type("Apri");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    const got = await changes(page);
    return got.at(-1)?.value === "apricot" ? null : `events: ${JSON.stringify(got)}`;
  });

  await run("combo box: a new value attribute re-renders, an echoed one doesn't", "components-form-inputs-combo-box--default", async (page) => {
    return page.evaluate(async () => {
      const host = document.querySelector("uswds-os-combo-box");
      host.setAttribute("value", "banana");
      await new Promise((r) => setTimeout(r, 50));
      const input = host.querySelector(".usa-combo-box__input");
      if (host.value !== "banana" || input.value !== "Banana") return `after set: value=${host.value} input=${input.value}`;
      const select = host.querySelector("select");
      host.setAttribute("value", "banana");
      host.setAttribute("value", host.value);
      return host.querySelector("select") === select ? null : "echoed value re-rendered the element";
    });
  });

  await run("date picker: typing a date reports YYYY-MM-DD", "components-form-inputs-date-picker--default", async (page) => {
    await page.locator("#appointment-date").fill("03/06/1995");
    await page.keyboard.press("Tab");
    const got = await changes(page);
    return got.at(-1)?.value === "1995-03-06" ? null : `events: ${JSON.stringify(got)}`;
  });

  await run("date picker: picking from the calendar reports the date", "components-form-inputs-date-picker--default-date", async (page) => {
    await page.locator(".usa-date-picker__button").click();
    await page.locator('.usa-date-picker__calendar__date[data-day="15"]').first().click();
    const got = await changes(page);
    return got.at(-1)?.value === "1995-03-15" ? null : `events: ${JSON.stringify(got)}`;
  });

  await run("date range picker: start and end are reported", "components-form-inputs-date-range-picker--default", async (page) => {
    await page.locator("#event-date-start").fill("03/06/1995");
    await page.keyboard.press("Tab");
    await page.locator("#event-date-end").fill("03/15/1995");
    await page.keyboard.press("Tab");
    const last = (await changes(page)).at(-1);
    return last?.start === "1995-03-06" && last?.end === "1995-03-15" ? null : `last event: ${JSON.stringify(last)}`;
  });

  await run("time picker: choosing a time reports HH:MM", "components-form-inputs-time-picker--time-picker", async (page) => {
    await page.locator(".usa-combo-box__toggle-list").click();
    await page.locator(".usa-combo-box__list-option", { hasText: /^1:00pm$/ }).click();
    const got = await changes(page);
    return got.at(-1)?.value === "13:00" ? null : `events: ${JSON.stringify(got)}`;
  });

  await run("time picker: value attribute sets the default time", "components-form-inputs-time-picker--time-picker-default-value", async (page) => {
    const value = await page.evaluate(() => document.querySelector("uswds-os-time-picker").value);
    return value === "13:00" ? null : `value: ${value}`;
  });

  await run("time picker: a 24-hour value attribute (OutSystems Time) sets the time", "components-form-inputs-time-picker--time-picker", async (page) => {
    return page.evaluate(async () => {
      const host = document.querySelector("uswds-os-time-picker");
      host.setAttribute("value", "13:30");
      await new Promise((r) => setTimeout(r, 50));
      const input = host.querySelector(".usa-combo-box__input");
      return host.value === "13:30" && input.value === "1:30pm" ? null : `value=${host.value} input=${input.value}`;
    });
  });

  await run("input mask: typing is masked and reported", "components-form-inputs-text-input-mask--ssn", async (page) => {
    await page.locator("#ssn").pressSequentially("123456789");
    await page.keyboard.press("Tab");
    const got = await changes(page);
    return got.at(-1)?.value === "123 45 6789" ? null : `events: ${JSON.stringify(got)}`;
  });

  await run("file input: selected files are reported with base64 content", "components-form-inputs-file-input--multiple", async (page) => {
    await page.locator("#file-input-multiple").setInputFiles([
      { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
      { name: "b.txt", mimeType: "text/plain", buffer: Buffer.from("world") },
    ]);
    await page.waitForFunction(() => window.__changes.length > 0);
    const files = (await changes(page)).at(-1)?.files ?? [];
    const ok = files.length === 2 && files[0].name === "a.txt" && files[0].base64 === Buffer.from("hello").toString("base64");
    return ok ? null : `files: ${JSON.stringify(files)}`;
  });

  await run("in-page navigation: links are built from the page headings", "components-in-page-navigation--default", async (page) => {
    const links = await page.locator(".usa-in-page-nav__link").count();
    return links > 0 ? null : "no links built";
  });

  if (!only) {
    const { page, errors } = await openPage(context, `${origin}/blank.html`);
    const leftovers = await page.evaluate(async (tags) => {
      const attrs = {
        "uswds-os-combo-box": { label: "L", options: '[{"value":"a","label":"A"}]' },
        "uswds-os-date-picker": { label: "L", hint: "h" },
        "uswds-os-date-range-picker": { "start-label": "S", "end-label": "E" },
        "uswds-os-time-picker": { label: "L" },
        "uswds-os-file-input": { label: "L" },
        "uswds-os-input-mask": { label: "L", placeholder: "___", pattern: "\\d{3}" },
        "uswds-os-in-page-navigation": {},
      };
      for (let i = 0; i < 50; i++) {
        for (const tag of tags) {
          const el = document.createElement(tag);
          for (const [k, v] of Object.entries(attrs[tag])) el.setAttribute(k, v);
          document.body.appendChild(el);
          await new Promise((r) => setTimeout(r, 0));
          el.remove();
        }
      }
      return document.body.querySelectorAll("[class^='usa-'], [class*=' usa-']").length;
    }, TAGS);
    record("50 mount/unmount cycles of every element leave no markup behind", leftovers === 0 && errors.length === 0, [leftovers ? `${leftovers} USWDS nodes left` : "", ...errors].filter(Boolean).join("\n"));
    await page.close();
  }
}

// --- Main ----------------------------------------------------------------------------

const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1024, height: 800 }, reducedMotion: "reduce" });
await context.route((url) => !url.href.startsWith(origin), (route) => route.abort());

for (const id of Object.keys(STORIES).filter((id) => !only || id.includes(only))) {
  await storyChecks(context, origin, id);
}
await behaviorChecks(context, origin);

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed (${Object.keys(STORIES).length} USWDS stories, ${TAGS.length} elements).`);
process.exit(failed.length ? 1 : 0);
