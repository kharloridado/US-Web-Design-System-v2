// Node module hooks that let us import USWDS's own *.stories.js files the way
// its Storybook does (packages/.storybook/main.js + tasks/vite-plugin-twig.mjs):
//   - .twig  → module whose default export is (context) => html, rendered by twig 3.0.0
//              with the same @components / @templates namespaces
//   - .json  → module with the parsed JSON as default export and top-level keys as named exports
//   - extensionless relative imports → .js or /index.js (Vite resolution)
//   - component behavior JS (packages/<pkg>/src/index.js) and storybook/test → stubs.
//     Behaviors run in the browser from the official uswds.min.js instead.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const STUB = "uswds-reference-stub:";
const behaviorModule = /[\\/]packages[\\/]_?usa-[^\\/]+[\\/]src[\\/]index\.js$/;

export async function resolve(specifier, context, next) {
  if (specifier === "storybook/test" || specifier.startsWith("storybook/")) {
    return { url: `${STUB}storybook`, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    const candidates = path.extname(base) ? [base] : [`${base}.js`, path.join(base, "index.js")];
    const found = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
    if (found) {
      if (behaviorModule.test(found)) return { url: `${STUB}behavior`, shortCircuit: true };
      return { url: pathToFileURL(found).href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith(STUB)) {
    // A behavior object whose methods are no-ops, and storybook/test helpers.
    const source = url.endsWith("storybook")
      ? "export const expect = () => new Proxy({}, { get: () => () => {} }); export const userEvent = {}; export const within = () => ({}); export const waitFor = async () => {};"
      : "const noop = () => {}; export default new Proxy({}, { get: () => noop });";
    return { format: "module", source, shortCircuit: true };
  }
  if (url.endsWith(".twig")) {
    const file = fileURLToPath(url);
    const source = `
      import { renderTwig } from ${JSON.stringify(new URL("./twig.mjs", import.meta.url).href)};
      export default (context) => renderTwig(${JSON.stringify(file)}, context);
    `;
    return { format: "module", source, shortCircuit: true };
  }
  if (url.endsWith(".json")) {
    // Like Vite: default export plus a named export per top-level key.
    const data = JSON.parse(fs.readFileSync(fileURLToPath(url), "utf8"));
    const named = data && typeof data === "object" && !Array.isArray(data)
      ? Object.keys(data).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k)).map((k) => `export const ${k} = __json[${JSON.stringify(k)}];`)
      : [];
    const source = [`const __json = ${JSON.stringify(data)};`, "export default __json;", ...named].join("\n");
    return { format: "module", source, shortCircuit: true };
  }
  if (url.startsWith("file:") && url.includes("/@uswds/uswds/packages/") && url.endsWith(".js")) {
    // Story and content modules are ESM in a package without "type": "module".
    return { format: "module", source: fs.readFileSync(fileURLToPath(url), "utf8"), shortCircuit: true };
  }
  return next(url, context);
}
