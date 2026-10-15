// Port of @uswds/uswds packages/usa-character-count/src/test/valid-template-no-maxlength.spec.js
// Fixture: packages/usa-character-count/src/test/valid-template-no-maxlength.template.html
//
// USWDS runs each case twice, initializing at document.body and at the
// character count. On a page the behavior starts at document.body, so each
// case runs once. `input.value = x` plus an input event is `fill(x)`.
//
// Both cases check that, without a maxlength, the behavior leaves the
// requirements message empty; that is also the fixture's static markup.

import { test, expect } from "../harness/test.mjs";

const input = (page) => page.locator(".usa-character-count .usa-character-count__field");
const requirementsMessage = (page) => page.locator(".usa-character-count .usa-character-count__message");
const innerHTML = (locator) => locator.evaluate((el) => el.innerHTML);

test.describe("character count component without maxlength initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-character-count/valid-template-no-maxlength.template");
  });

  test("should not update an initial message for the character count component", async ({ page }) => {
    expect(await innerHTML(requirementsMessage(page))).toBe("");
  });

  test("should not inform the user of remaining characters when typing", async ({ page }) => {
    await input(page).fill("1");

    expect(await innerHTML(requirementsMessage(page))).toBe("");
  });
});
