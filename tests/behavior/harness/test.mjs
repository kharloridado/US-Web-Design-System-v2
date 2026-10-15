// Shared test setup for the ported USWDS behavior cases.
//
//   import { test, expect } from "../harness/test.mjs";
//   test.beforeEach(async ({ fixture }) => fixture.open("usa-accordion/template"));
//
// fixture.open(id) loads reference/fixtures/<id>.html. The USWDS behaviors start
// on page load, like USWDS's specs (body.innerHTML = TEMPLATE; Component.on(body)).
// fixture.open(id, { before }) runs `before(page)` first, then starts the
// behaviors, for specs that change the fixture before initializing.
// fixture.open(id, { start: { only, root } }) starts only some behaviors and/or
// on another root, for specs that call one Component.on(someRoot); see
// window.USWDS_TEST.start in uswds-entry.js.
//
// Every test fails if the page throws an uncaught error, unless it calls
// fixture.allowErrors().

import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  fixture: async ({ page }, use) => {
    const errors = [];
    let allowErrors = false;
    page.on("pageerror", (error) => errors.push(error.message));

    await use({
      page,
      async open(id, { before, start } = {}) {
        // BEHAVIOR_NO_START=1 loads fixtures without starting USWDS. Ported tests
        // that still pass then only check static markup, which is how to spot
        // a port that doesn't exercise the behavior.
        const noStart = !!process.env.BEHAVIOR_NO_START;
        const manual = !!(before || start);
        await page.goto(`/fixtures/${id}.html${manual || noStart ? "?manual" : ""}`);
        if (before) await before(page);
        if (manual && !noStart) await page.evaluate((options) => window.USWDS_TEST.start(options), start ?? {});
      },
      allowErrors() {
        allowErrors = true;
      },
      errors,
    });

    if (!allowErrors) expect(errors, "uncaught errors on the page").toEqual([]);
  },
});

export { expect };
