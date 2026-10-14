// Quality gate: proves dist/ contains 100% of the CSS of the official USWDS
// bundle (compiled with the same settings), and nothing is emitted twice.
// Comparison is per single selector + declarations, so selector grouping and
// file splitting don't matter.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
// Rules we add on purpose (not in the official bundle).
const ALLOWED_EXTRA = [/^\|:root\{--usa-/];

const { css: officialRaw } = sass.compileString(`@use "settings/uswds-settings";\n@forward "uswds";`, {
  loadPaths: [path.join(root, "src"), path.join(root, "node_modules/@uswds/uswds/packages")],
  url: pathToFileURL(path.join(root, "src/_parity.scss")),
  quietDeps: true,
  silenceDeprecations: ["import"],
});
const official = (await postcss([autoprefixer]).process(officialRaw, { from: undefined })).css;

const ours = [
  path.join(dist, "theme/uswds-theme.css"),
  ...fs.readdirSync(path.join(dist, "blocks")).filter((f) => !f.endsWith(".min.css")).map((f) => path.join(dist, "blocks", f)),
].map((f) => fs.readFileSync(f, "utf8"));

function count(cssList) {
  const counts = new Map();
  for (const css of cssList) {
    postcss.parse(css).walkRules((rule) => {
      const ctx = [];
      for (let p = rule.parent; p && p.type === "atrule"; p = p.parent) ctx.unshift(`@${p.name} ${p.params}`);
      const decls = rule.nodes.filter((n) => n.type === "decl").map((d) => `${d.prop}:${d.value}${d.important ? "!" : ""}`).join(";");
      for (const sel of rule.selectors) {
        const key = `${ctx.join("|")}|${sel.trim()}{${decls}}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    });
  }
  return counts;
}

const a = count([official]);
const b = count(ours);
const missing = [...a.keys()].filter((k) => !b.has(k));
const extra = [...b.keys()].filter((k) => !a.has(k) && !ALLOWED_EXTRA.some((re) => re.test(k)));
const duplicated = [...b].filter(([k, n]) => a.has(k) && n > a.get(k)).map(([k, n]) => `${k} (x${n} vs x${a.get(k)})`);

console.log(`Official USWDS selector rules: ${a.size}. dist/: ${b.size}.`);
const report = (label, list) => {
  console.log(`${label}: ${list.length}`);
  list.slice(0, 20).forEach((k) => console.log(`  ${k.slice(0, 200)}`));
};
report("Missing from dist", missing);
report("Unexpected extra in dist", extra);
report("Duplicated in dist", duplicated);
process.exit(missing.length || extra.length || duplicated.length ? 1 : 0);
