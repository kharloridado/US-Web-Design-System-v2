// Port of @uswds/uswds packages/usa-range/src/test/range.spec.js
// Fixture: packages/usa-range/src/test/template.html
//
// USWDS runs each case twice, initializing at document.body and at the slider.
// On a page the behavior starts at document.body, so each case runs once.
// Where USWDS sets slider.value and dispatches "change", the user moves the
// slider with the keyboard (step 10: two ArrowRight presses take 20 to 40).

import { test, expect } from "../harness/test.mjs";

const slider = (page) => page.locator(".usa-range");
const wrapperDiv = (page) => page.locator(".usa-range__wrapper:has(> .usa-range)");
const spanElement = (page) => wrapperDiv(page).locator(".usa-range__value");

test.describe("Range slider with span initialized at document.body", () => {
  test.describe("range slider component", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-range/template");
    });

    test("check that the wrapper div and the span element are added and that they match the slider.", async ({ page }) => {
      await expect(wrapperDiv(page), "wrapperDiv was created.").toHaveCount(1);
      await expect(spanElement(page), "SPAN was created").toHaveCount(1);
      const value = await slider(page).inputValue();
      expect(await spanElement(page).evaluate((el) => el.textContent), "the span does not match the range slider value.").toBe(value);
    });

    test("Updates span element to match new slider value on change", async ({ page }) => {
      await slider(page).focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await expect(slider(page), "range slider value is not set to the value in the test.").toHaveValue("40");
      // change the span element, make sure it updated and that the span and the range are equal.
      await expect(spanElement(page), "slider value does not match span value").toHaveCount(1);
      expect(await spanElement(page).evaluate((el) => el.textContent), "slider value does not match span value").toBe(
        await slider(page).inputValue(),
      );
    });

    test("displays a visual hint to guide sighted users on how to operate the slider", async ({ page }) => {
      const hint = page.locator(".usa-hint");
      await expect(hint, "Visual hint element (.usa-hint) should exist in the range slider component").toHaveCount(1);
      expect(
        (await hint.evaluate((el) => el.textContent)).trim(),
        "Visual hint text should read: 'Move the slider to change the value'",
      ).toBe("Move the slider to change the value");
      await expect(hint, "Visual hint element should have id='range-hint'").toHaveAttribute("id", "range-hint");
      await expect(hint).toBeVisible();
      await expect(slider(page), "Range slider input should have aria-describedby='range-hint'").toHaveAttribute(
        "aria-describedby",
        "range-hint",
      );
    });
  });
});
