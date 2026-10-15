// Port of @uswds/uswds packages/usa-range/src/test/sr-callout.spec.js
// Fixture: packages/usa-range/src/test/sr-callout.spec.html
//
// USWDS runs each case twice, initializing at document.body and at the slider.
// On a page the behavior starts at document.body, so each case runs once.
// Where USWDS sets slider.value = "30" and dispatches "change", the user moves
// the slider one step (10) with ArrowRight.

import { test, expect } from "../harness/test.mjs";

const slider = (page) => page.locator(".usa-range");

test.describe("Range slider with aria-valuetext initialized at document.body", () => {
  test.describe("range slider component", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-range/sr-callout.spec");
    });

    test("adds aria-valuetext attribute", async ({ page }) => {
      await expect(slider(page), "aria-valuetext attribute is added").toHaveAttribute("aria-valuetext", /.+/);
      await expect(slider(page), "initial value is incorrect").toHaveAttribute("aria-valuetext", "20 percent of 100");
    });

    test("updates aria-valuetext to match new slider value on change", async ({ page }) => {
      await slider(page).focus();
      await page.keyboard.press("ArrowRight");
      await expect(slider(page)).toHaveValue("30");
      await expect(slider(page), "Screen reader value does not match range value").toHaveAttribute(
        "aria-valuetext",
        "30 percent of 100",
      );
    });
  });
});
