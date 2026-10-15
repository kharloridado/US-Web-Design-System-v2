// Shared test setup for the ported USWDS behavior cases.
//
//   import { test, expect } from "../harness/test.mjs";
//   test.beforeEach(async ({ fixture }) => fixture.open("usa-accordion/template"));
//
// fixture.open(id) loads reference/fixtures/<id>.html. The USWDS behaviors start
// on page load, like USWDS's specs (body.innerHTML = TEMPLATE; Component.on(body)).
// fixture.open(id, { before }) runs `before(page)` first, then starts the
// behaviors, for specs that change the fixture before initializing.
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
      async open(id, { before } = {}) {
        // BEHAVIOR_NO_START=1 loads fixtures without starting USWDS. Ported tests
        // that still pass then only check static markup, which is how to spot
        // a port that doesn't exercise the behavior.
        const noStart = !!process.env.BEHAVIOR_NO_START;
        await page.goto(`/fixtures/${id}.html${before || noStart ? "?manual" : ""}`);
        if (before) await before(page);
        if (before && !noStart) await page.evaluate(() => window.USWDS_TEST.start());
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
