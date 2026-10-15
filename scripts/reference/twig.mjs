// Renders a USWDS .twig file with twig 3.0.0 (the version USWDS's Storybook
// pins) and the same namespaces its Vite plugin configures.

import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Twig = require("twig");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const packagesDir = path.join(root, "node_modules/@uswds/uswds/packages");
const namespaces = {
  components: `${packagesDir}/`,
  templates: `${path.join(packagesDir, "templates")}/`,
};

Twig.cache(false);

export function renderTwig(file, context = {}) {
  const template = Twig.twig({
    path: file,
    namespaces,
    async: false,
    rethrow: true,
    allowInlineIncludes: true,
  });
  return template.render(context);
}
