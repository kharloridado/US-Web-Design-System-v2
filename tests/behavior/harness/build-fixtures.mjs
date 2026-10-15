// Builds one page per USWDS spec fixture (packages/*/src/test/*.html) into
// reference/fixtures/<package>/<name>.html, the way each spec sets it up:
// document.body.innerHTML = TEMPLATE, then the behavior starts on document.body.
//
// Pages load the official compiled CSS and the USWDS behaviors (uswds-entry.js).
// They start automatically unless the URL has ?manual, which lets a test change
// the fixture first and then call window.USWDS_TEST.start().

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const packagesDir = path.join(root, "node_modules/@uswds/uswds/packages");
const outDir = path.join(root, "reference/fixtures");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "test-patterns") walk(p, out);
    } else if (e.name.endsWith(".html") && p.includes(`${path.sep}src${path.sep}test${path.sep}`)) out.push(p);
  }
  return out;
}

const templates = fs.readdirSync(packagesDir)
  .filter((p) => p !== "uswds-core")
  .flatMap((p) => walk(path.join(packagesDir, p)))
  .sort();

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [path.join(root, "tests/behavior/harness/uswds-entry.js")],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: path.join(outDir, "uswds-test.js"),
  logLevel: "warning",
});

const ids = [];
for (const file of templates) {
  const rel = path.relative(packagesDir, file);
  const pkg = rel.split(path.sep)[0];
  const name = path.basename(file, ".html");
  const id = `${pkg}/${name}`;
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>${id}</title>
<link rel="stylesheet" href="/uswds/css/uswds.min.css">
</head>
<body>${fs.readFileSync(file, "utf8")}<script src="/fixtures/uswds-test.js"></script>
<script>if (!new URLSearchParams(location.search).has("manual")) window.USWDS_TEST.start();</script>
</body>
</html>
`;
  fs.mkdirSync(path.join(outDir, pkg), { recursive: true });
  fs.writeFileSync(path.join(outDir, pkg, `${name}.html`), page);
  ids.push({ id, source: path.relative(packagesDir, file) });
}
fs.writeFileSync(path.join(outDir, "fixtures.json"), `${JSON.stringify(ids, null, 2)}\n`);
console.log(`Built ${ids.length} USWDS spec fixture pages → reference/fixtures/`);
