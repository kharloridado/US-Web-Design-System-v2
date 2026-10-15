// Behavior tests: USWDS's own spec cases (packages/*/src/test/*.spec.js), ported
// to Playwright as black-box tests on real pages. Definition of Done gate 6.
//
// Project "reference" runs them on USWDS spec fixtures with USWDS's own JavaScript.
// That's where a port is proven correct. Later projects run the same tests on our
// implementations (custom elements, then the O11 Style Guide).

import { defineConfig } from "@playwright/test";

const port = Number(process.env.BEHAVIOR_PORT || 4310);

export default defineConfig({
  testDir: "tests/behavior",
  testMatch: "**/*.spec.mjs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1024, height: 768 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/behavior/harness/serve.mjs",
    url: `http://127.0.0.1:${port}/fixtures/fixtures.json`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "reference" }],
});
