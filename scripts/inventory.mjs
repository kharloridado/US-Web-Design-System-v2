// Builds the acceptance inventory: every variant USWDS itself publishes, read
// from the package's Storybook stories, plus the behavior test specs USWDS
// ships per component. "Done" means each row is reproduced in O11 and passes
// its checks (docs/DEFINITION_OF_DONE.md).
//
// Writes docs/acceptance/inventory.json and docs/acceptance/inventory.md.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uswdsRoot = path.join(root, "node_modules/@uswds/uswds");
const packagesDir = path.join(uswdsRoot, "packages");
const outDir = path.join(root, "docs/acceptance");
const version = JSON.parse(fs.readFileSync(path.join(uswdsRoot, "package.json"), "utf8")).version;

function walk(dir, pred, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, pred, out);
    else if (pred(p)) out.push(p);
  }
  return out;
}

// Storybook's story id: kebab-cased title, "--", kebab-cased export name.
const kebab = (str) => str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const storyId = (title, story) => `${kebab(title)}--${kebab(story)}`;

const pkgOf = (file) => path.relative(packagesDir, file).split(path.sep)[0];

// --- Stories ------------------------------------------------------------------
// A story renders through a template function bound to an imported twig file.
// Stories whose twig lives under test/ are USWDS's internal test fixtures.
function parseStories(file) {
  const src = fs.readFileSync(file, "utf8");
  const title = (src.match(/title:\s*"([^"]+)"/) || [])[1] ?? pkgOf(file);
  const imports = Object.fromEntries(
    [...src.matchAll(/^import\s+(\w+)\s+from\s+"([^"]+\.twig)";/gm)].map((m) => [m[1], m[2]]),
  );
  const templates = Object.fromEntries(
    [...src.matchAll(/^const\s+(\w+)\s*=\s*\(?[\w,{}\s]*\)?\s*=>\s*(?:\{[^}]*?)?(\w+)\(/gm)]
      .filter((m) => imports[m[2]])
      .map((m) => [m[1], imports[m[2]]]),
  );
  // Two story shapes: `export const X = Template.bind({})` and `export const X = () => Twig({...})`.
  const bound = [...src.matchAll(/^export const (\w+)\s*=\s*(\w+)\.bind\(/gm)].map((m) => [m[1], templates[m[2]]]);
  const direct = [...src.matchAll(/^export const (\w+)\s*=\s*\(\)\s*=>\s*(\w+)\(/gm)].map((m) => [m[1], imports[m[2]]]);
  return [...bound, ...direct].map(([story, twigPath]) => [story, twigPath ?? ""]).map(([story, twig]) => {
    const m = [null, story];
    const internal = /(^|\/)test\//.test(twig) || /^Test/.test(m[1]);
    const spanish = /spanish|~lang-es|Es$/i.test(m[1]) || /lang-es/.test(twig);
    return { story: m[1], twig, kind: internal ? "uswds-internal-test" : spanish ? "spanish" : "variant" };
  }).map((s) => ({ id: storyId(title, s.story), title, package: pkgOf(file), file: path.relative(packagesDir, file), ...s }));
}

const stories = walk(packagesDir, (p) => p.endsWith(".stories.js")).sort().flatMap(parseStories);

// Page templates that ship as twig without a story of their own (form templates).
const templatesDir = path.join(packagesDir, "templates");
for (const f of fs.readdirSync(templatesDir).filter((f) => f.endsWith(".twig"))) {
  const name = f.replace(/\.twig$/, "");
  if (!stories.some((s) => s.twig.includes(name))) {
    stories.push({ id: storyId("Pages/Form templates", name), title: "Pages/Form templates", package: "templates", file: null, story: name, twig: `./${f}`, kind: "variant" });
  }
}

// --- Behavior specs -------------------------------------------------------------
const specs = walk(packagesDir, (p) => p.endsWith(".spec.js") && !p.includes(`${path.sep}uswds-core${path.sep}`))
  .sort()
  .map((p) => {
    const src = fs.readFileSync(p, "utf8");
    // it("title", ...): the title runs to the matching closing quote, so titles may contain other quotes.
    const cases = [...src.matchAll(/\bit\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2].replace(/\\(.)/g, "$1"));
    return { package: pkgOf(p), file: path.relative(packagesDir, p), cases };
  });

// --- Output ------------------------------------------------------------------------
const byKind = (k) => stories.filter((s) => s.kind === k);
const variants = byKind("variant");
const summary = {
  uswdsVersion: version,
  variants: variants.length,
  spanishVariants: byKind("spanish").length,
  uswdsInternalTestStories: byKind("uswds-internal-test").length,
  behaviorSpecFiles: specs.length,
  behaviorCases: specs.reduce((n, s) => n + s.cases.length, 0),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "inventory.json"), `${JSON.stringify({ summary, stories, specs }, null, 2)}\n`);

const groups = new Map();
for (const s of variants) {
  if (!groups.has(s.title)) groups.set(s.title, []);
  groups.get(s.title).push(s.story);
}
const caseCount = new Map();
for (const s of specs) caseCount.set(s.package, (caseCount.get(s.package) ?? 0) + s.cases.length);

const lines = [
  `# Acceptance inventory: USWDS ${version}`,
  "",
  "Generated by `scripts/inventory.mjs` from the USWDS package. Do not edit by hand.",
  "",
  `- **${summary.variants}** variants to reproduce in O11 (one Style Guide demo each)`,
  `- **${summary.behaviorCases}** behavior cases from ${summary.behaviorSpecFiles} USWDS test spec files to pass`,
  `- ${summary.spanishVariants} Spanish variants, deferred (English-only v1)`,
  `- ${summary.uswdsInternalTestStories} USWDS-internal test stories, not part of the public system`,
  "",
  "| Storybook title | Package | Variants | Behavior cases |",
  "|---|---|---:|---:|",
  // Spec cases are per package; show them on the package's first row only.
  ...[...groups].map(([title, list], _, all) => {
    const pkg = variants.find((v) => v.title === title).package;
    const first = all.find(([t]) => variants.find((v) => v.title === t).package === pkg)[0] === title;
    const cases = first ? caseCount.get(pkg) ?? 0 : "↑";
    return `| ${title} | \`${pkg}\` | ${list.length}: ${list.join(", ")} | ${cases} |`;
  }),
  "",
];
fs.writeFileSync(path.join(outDir, "inventory.md"), lines.join("\n"));
console.log(summary);
