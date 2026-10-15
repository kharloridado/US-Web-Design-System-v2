// Builds everything Service Studio needs from USWDS sources:
//   dist/theme/uswds-theme(.min).css   → USWDS_Theme stylesheet
//   dist/blocks/<Block>(.min).css      → USWDS_Patterns Block stylesheets
//   dist/assets/{fonts,img}/           → USWDS_Theme Resources
//   dist/manifest.json                 → package → Block mapping, bundled deps, sizes
//
// Fails if any USWDS package is not accounted for (Theme, Block, or noStyles),
// which is how "100% of USWDS" stays true across upgrades.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uswdsRoot = path.join(root, "node_modules/@uswds/uswds");
const packagesDir = path.join(uswdsRoot, "packages");
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");

const THEME_MODULE = "USWDS_Theme";
const RESOURCE_PREFIX = `/${THEME_MODULE}/`;
// Packages that never emit CSS of their own in a bundle (loaded by the Theme).
const SHARED_DEPS = new Set(["uswds-core", "uswds-fonts", "uswds-helpers", "uswds-global"]);
// Images referenced from markup (not CSS) by Theme-owned Blocks.
const MARKUP_IMAGES = [
  "sprite.svg",
  "us_flag_small.png",
  "icon-dot-gov.svg",
  "icon-https.svg",
  "lock.svg",
  "circle-gray-20.svg",
];

const uswdsVersion = JSON.parse(fs.readFileSync(path.join(uswdsRoot, "package.json"), "utf8")).version;
const blocksConfig = JSON.parse(fs.readFileSync(path.join(srcDir, "blocks.json"), "utf8"));
const themeIndex = fs.readFileSync(path.join(srcDir, "theme/index.scss"), "utf8");

// --- Package inventory -------------------------------------------------------

const allPackages = fs
  .readdirSync(packagesDir)
  .filter((name) => /^_?usa-/.test(name))
  .sort();

const themePackages = [...themeIndex.matchAll(/@forward "(usa-[a-z-]+)\/src\/styles"/g)].map((m) => m[1]);
const blockPackages = Object.keys(blocksConfig.blocks);
const noStylePackages = Object.keys(blocksConfig.noStyles).filter((k) => !k.startsWith("$"));

function assertCoverage() {
  const owners = new Map();
  const errors = [];
  for (const [group, list] of [["theme", themePackages], ["blocks", blockPackages], ["noStyles", noStylePackages]]) {
    for (const pkg of list) {
      if (!allPackages.includes(pkg)) errors.push(`${group}: "${pkg}" is not a USWDS ${uswdsVersion} package`);
      if (owners.has(pkg)) errors.push(`"${pkg}" is listed in both ${owners.get(pkg)} and ${group}`);
      owners.set(pkg, group);
    }
  }
  for (const pkg of allPackages) {
    if (!owners.has(pkg)) errors.push(`"${pkg}" is not assigned to the Theme, a Block, or noStyles`);
  }
  if (errors.length) {
    throw new Error(`USWDS coverage check failed:\n  - ${errors.join("\n  - ")}`);
  }
}

// Direct package dependencies, as declared by @forward in packages/<pkg>/_index.scss.
function directDeps(pkg) {
  const index = path.join(packagesDir, pkg, "_index.scss");
  if (!fs.existsSync(index)) return [];
  return [...fs.readFileSync(index, "utf8").matchAll(/@forward "([^"]+)"/g)]
    .map((m) => m[1])
    .filter((dep) => !dep.startsWith("src") && dep !== pkg);
}

// Transitive deps not already provided by the Theme, in load order.
function externalDeps(pkg, seen = new Set()) {
  const out = [];
  for (const dep of directDeps(pkg)) {
    if (seen.has(dep) || SHARED_DEPS.has(dep) || themePackages.includes(dep)) continue;
    seen.add(dep);
    out.push(...externalDeps(dep, seen), dep);
  }
  return out;
}

// A Block that depends on another Block's package (time-picker → combo-box)
// declares that Block as required instead of bundling a second copy of its CSS.
function requiredBlocks(pkg) {
  return externalDeps(pkg).map((dep) => {
    const owner = blocksConfig.blocks[dep];
    if (!owner) throw new Error(`${pkg} depends on ${dep}, which is neither in the Theme nor a Block`);
    return owner.block;
  });
}

// --- Compilation ----------------------------------------------------------------

const sassOptions = {
  loadPaths: [srcDir, packagesDir],
  quietDeps: true,
  silenceDeprecations: ["import"],
};

// Identity of one selector of a rule: enclosing at-rules + selector + declarations.
function fingerprint(rule, selector) {
  const ctx = [];
  for (let p = rule.parent; p && p.type === "atrule"; p = p.parent) ctx.unshift(`@${p.name} ${p.params}`);
  const decls = rule.nodes.filter((n) => n.type === "decl").map((d) => `${d.prop}:${d.value}${d.important ? "!" : ""}`);
  return `${ctx.join("|")}|${selector.trim()}{${decls.join(";")}}`;
}

// Some USWDS packages re-forward Theme-owned styles (usa-icon-list → usa-icon,
// usa-input-mask → usa-input). Re-emitting them in a Block would load them after
// the Theme's utilities and override them, so any selector whose identical rule
// is already in the Theme is removed.
const dropThemeDuplicates = (themeFingerprints) => ({
  postcssPlugin: "drop-theme-duplicates",
  OnceExit(root) {
    root.walkRules((rule) => {
      const kept = rule.selectors.filter((sel) => !themeFingerprints.has(fingerprint(rule, sel)));
      if (kept.length === 0) rule.remove();
      else if (kept.length < rule.selectors.length) rule.selectors = kept;
    });
    let removed;
    do {
      removed = false;
      root.walkAtRules((at) => {
        if (at.nodes && at.nodes.length === 0) {
          at.remove();
          removed = true;
        }
      });
    } while (removed);
  },
});

// USWDS settings files are full of documentation comments; keep only /*! */.
const stripComments = {
  postcssPlugin: "strip-comments",
  OnceExit(root) {
    root.walkComments((c) => {
      if (!c.text.startsWith("!")) c.remove();
    });
  },
};

function fingerprints(css) {
  const set = new Set();
  postcss.parse(css).walkRules((rule) => rule.selectors.forEach((sel) => set.add(fingerprint(rule, sel))));
  return set;
}

async function compile(source, url, label, themeFingerprints) {
  const results = {};
  for (const style of ["expanded", "compressed"]) {
    const { css } = sass.compileString(source, { ...sassOptions, url, style });
    const plugins = [autoprefixer, stripComments];
    if (themeFingerprints) plugins.push(dropThemeDuplicates(themeFingerprints[style]));
    const processed = await postcss(plugins).process(css, { from: undefined });
    results[style] = `/*! ${label} | USWDS ${uswdsVersion} | generated by scripts/build.mjs, do not edit */\n${processed.css}`;
  }
  return results;
}

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function size(contents) {
  return { bytes: Buffer.byteLength(contents), gzip: zlib.gzipSync(contents).length };
}

function resourceUrls(css) {
  return [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]).filter((u) => !u.startsWith("data:"));
}

function assertResourceUrls(css, label) {
  const bad = resourceUrls(css).filter((u) => !u.startsWith(RESOURCE_PREFIX));
  if (bad.length) throw new Error(`${label}: url() outside ${RESOURCE_PREFIX}: ${[...new Set(bad)].join(", ")}`);
}

// --- Main -------------------------------------------------------------------------

async function main() {
  assertCoverage();
  fs.rmSync(distDir, { recursive: true, force: true });

  const manifest = {
    uswdsVersion,
    theme: { module: THEME_MODULE, packages: themePackages },
    blocks: {},
    noStyles: blocksConfig.noStyles,
  };
  const referencedUrls = new Set();

  // Theme
  const themeUrl = pathToFileURL(path.join(srcDir, "theme/index.scss"));
  const theme = await compile(themeIndex, themeUrl, `${THEME_MODULE} theme`);
  assertResourceUrls(theme.expanded, "theme");
  resourceUrls(theme.expanded).forEach((u) => referencedUrls.add(u));
  write(path.join(distDir, "theme/uswds-theme.css"), theme.expanded);
  write(path.join(distDir, "theme/uswds-theme.min.css"), theme.compressed);
  manifest.theme.file = "theme/uswds-theme.min.css";
  manifest.theme.size = size(theme.compressed);

  // Blocks
  const themeFingerprints = { expanded: fingerprints(theme.expanded), compressed: fingerprints(theme.compressed) };
  const blockUrl = pathToFileURL(path.join(srcDir, "blocks/_entry.scss"));
  for (const [pkg, { block, strategy }] of Object.entries(blocksConfig.blocks)) {
    const requires = requiredBlocks(pkg);
    const source = `@use "settings/uswds-settings";\n@forward "${pkg}/src/styles";`;
    const out = await compile(source, blockUrl, `${block} block (${pkg})`, themeFingerprints);
    assertResourceUrls(out.expanded, block);
    resourceUrls(out.expanded).forEach((u) => referencedUrls.add(u));
    write(path.join(distDir, `blocks/${block}.css`), out.expanded);
    write(path.join(distDir, `blocks/${block}.min.css`), out.compressed);
    manifest.blocks[block] = {
      package: pkg,
      strategy,
      file: `blocks/${block}.min.css`,
      requires,
      size: size(out.compressed),
    };
  }

  // Assets: only files the CSS references, plus markup images.
  const copied = [];
  const copy = (rel) => {
    const from = path.join(uswdsRoot, "dist", rel);
    if (!fs.existsSync(from)) throw new Error(`Referenced asset not found in USWDS dist: ${rel}`);
    const to = path.join(distDir, "assets", rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied.push(rel);
  };
  for (const url of referencedUrls) copy(url.slice(RESOURCE_PREFIX.length).split(/[?#]/)[0]);
  MARKUP_IMAGES.forEach((img) => copy(`img/${img}`));
  manifest.assets = [...new Set(copied)].sort();

  write(path.join(distDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  // Report
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  const rows = [
    [`Theme`, manifest.theme.size],
    ...Object.entries(manifest.blocks).map(([b, m]) => [b + (m.requires.length ? ` (requires ${m.requires.join(", ")})` : ""), m.size]),
  ];
  console.log(`USWDS ${uswdsVersion}: ${allPackages.length} packages accounted for ` +
    `(${themePackages.length} Theme, ${blockPackages.length} Block bundles, ${noStylePackages.length} without styles)\n`);
  for (const [name, s] of rows) console.log(`${name.padEnd(48)} ${kb(s.bytes).padStart(10)}  ${kb(s.gzip).padStart(9)} gz`);
  console.log(`\nAssets: ${manifest.assets.length} files → dist/assets/`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
