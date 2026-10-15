// Reference renderer: renders every public USWDS variant (docs/acceptance/inventory.json)
// to a static page, exactly as USWDS's own Storybook would show it:
//   - the story's own export, called with the story args merged over the meta args
//   - the official compiled dist/css/uswds.min.css and dist/js/uswds.min.js
//   - Storybook's preview-head styles and "padded"/"fullscreen" layout
//
// Output (git-ignored, regenerate any time): reference/site/<story-id>.html + index.html
// These pages are the baseline that O11 Style Guide screens are compared against
// (Definition of Done gates 4 and 5).

import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

register(new URL("./hooks.mjs", import.meta.url));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const uswdsRoot = path.join(root, "node_modules/@uswds/uswds");
const packagesDir = path.join(uswdsRoot, "packages");
const siteDir = path.join(root, "reference/site");
const inventory = JSON.parse(fs.readFileSync(path.join(root, "docs/acceptance/inventory.json"), "utf8"));
const version = inventory.summary.uswdsVersion;

// Same as @uswds/uswds/.storybook/preview-head.html
const PREVIEW_HEAD = `<style>
  *, *:before, *:after { box-sizing: border-box !important; }
  html, body { font-size: 16px; }
</style>`;
// Storybook's layout parameter: "padded" (default) adds 1rem around the story.
const LAYOUT = { padded: "padding: 1rem;", fullscreen: "padding: 0;", centered: "padding: 1rem; display: flex; justify-content: center;" };

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function page({ title, story, layout, html }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<meta name="uswds-version" content="${version}">
<title>${escapeHtml(`${title} / ${story}`)}</title>
${PREVIEW_HEAD}
<link rel="stylesheet" href="uswds/css/uswds.min.css">
<style>body { margin: 0; ${LAYOUT[layout] ?? LAYOUT.padded} }</style>
</head>
<body>
<div id="storybook-root">
${html}
</div>
<script src="uswds/js/uswds.min.js"></script>
</body>
</html>
`;
}

// Official USWDS assets, linked rather than copied.
function linkAssets() {
  const target = path.join(siteDir, "uswds");
  fs.mkdirSync(target, { recursive: true });
  for (const dir of ["css", "js", "img", "fonts"]) {
    fs.symlinkSync(path.join(uswdsRoot, "dist", dir), path.join(target, dir), "dir");
  }
}

async function main() {
  fs.rmSync(siteDir, { recursive: true, force: true });
  fs.mkdirSync(siteDir, { recursive: true });
  linkAssets();

  const variants = inventory.stories.filter((s) => s.kind === "variant");
  const modules = new Map();
  const rendered = [];
  const failed = [];

  for (const v of variants) {
    try {
      if (!modules.has(v.file)) modules.set(v.file, await import(pathToFileURL(path.join(packagesDir, v.file)).href));
      const mod = modules.get(v.file);
      const story = mod[v.story];
      const meta = mod.default ?? {};
      const args = { ...(meta.args ?? {}), ...(story.args ?? {}) };
      const html = story(args, { args, parameters: { ...meta.parameters, ...story.parameters } });
      if (typeof html !== "string") throw new Error(`story returned ${typeof html}, expected an HTML string`);
      const layout = story.parameters?.layout ?? meta.parameters?.layout ?? "padded";
      fs.writeFileSync(path.join(siteDir, `${v.id}.html`), page({ title: v.title, story: v.story, layout, html }));
      rendered.push({ ...v, layout });
    } catch (err) {
      failed.push({ id: v.id, error: err.message });
    }
  }

  // Index page, grouped by Storybook title.
  const groups = new Map();
  for (const r of rendered) {
    if (!groups.has(r.title)) groups.set(r.title, []);
    groups.get(r.title).push(r);
  }
  const index = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>USWDS ${version} reference</title>
<link rel="stylesheet" href="uswds/css/uswds.min.css"></head>
<body><main class="usa-section"><div class="grid-container usa-prose">
<h1>USWDS ${version} reference pages</h1>
<p>${rendered.length} variants rendered from the official package. Baseline for the OutSystems 11 Style Guide.</p>
${[...groups].map(([title, list]) => `<h2>${escapeHtml(title)}</h2>
<ul>${list.map((r) => `<li><a href="${r.id}.html">${escapeHtml(r.story)}</a></li>`).join("")}</ul>`).join("\n")}
</div></main></body></html>
`;
  fs.writeFileSync(path.join(siteDir, "index.html"), index);
  fs.writeFileSync(path.join(siteDir, "pages.json"), `${JSON.stringify(rendered.map(({ id, title, story, package: pkg, layout }) => ({ id, title, story, package: pkg, layout })), null, 2)}\n`);

  console.log(`Rendered ${rendered.length} of ${variants.length} USWDS ${version} variants → reference/site/`);
  if (failed.length) {
    console.error(`Failed: ${failed.length}`);
    failed.forEach((f) => console.error(`  ${f.id}: ${f.error}`));
    process.exit(1);
  }
}

main();
