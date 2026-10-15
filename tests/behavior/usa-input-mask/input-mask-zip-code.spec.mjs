// Port of @uswds/uswds packages/usa-input-mask/src/test/input-mask-zip-code.spec.js
// Fixture: packages/usa-input-mask/src/test/input-mask-zip-code.template.html
//
// USWDS runs the case twice, initializing at document.body and at the input mask.
// On a page the behavior starts at document.body, so the case runs once.
// USWDS sets the input's value and dispatches one "keyup"; the test types the
// characters, so the mask reformats on each key's keyup as it does for a user.

import { test, expect } from "../harness/test.mjs";

test.describe("input mask component", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-input-mask/input-mask-zip-code.template");
  });

  test("formats a US zip code to 12345-6789", async ({ page }) => {
    const root = page.locator(".usa-input-masking").first();
    await root.locator(".usa-input").first().pressSequentially("123456789");

    const shell = root.locator(".usa-input-mask--content").first();
    await expect(shell).toHaveJSProperty("textContent", "12345-6789");
  });
});
