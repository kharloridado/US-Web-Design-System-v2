// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-disabled.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker-disabled.template.html
//   (the input is `disabled`)
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.

import { test, expect } from "../harness/test.mjs";

const root = (page) => page.locator(".usa-date-picker");
const input = (page) => root(page).locator(".usa-date-picker__external-input");
const button = (page) => root(page).locator(".usa-date-picker__button");
const calendar = (page) => root(page).locator(".usa-date-picker__calendar");

test.describe("date picker component initialized at document.body - disabled initialization", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-date-picker/date-picker-disabled.template");
  });

  test("should not display the calendar when the button is clicked as it is disabled", async ({ page }) => {
    // Stricter than USWDS: the enhanced button is disabled.
    await expect(button(page)).toBeDisabled();

    // EVENTS.click(button): a real click on the (disabled) toggle button.
    await button(page).click({ force: true });

    await expect(calendar(page), "the calendar is hidden").toHaveJSProperty("hidden", true);
  });

  test("should display the calendar when the button is clicked once the component is enabled", async ({ page }) => {
    await expect(button(page)).toBeDisabled();

    // DatePicker.enable(root) is a developer API with no user action. Produce the
    // state it leaves (packages/usa-date-picker/src/index.js `enable`): toggle
    // button and input no longer disabled / aria-disabled / readonly.
    await root(page).evaluate((el) => {
      const toggle = el.querySelector(".usa-date-picker__button");
      const external = el.querySelector(".usa-date-picker__external-input");
      toggle.disabled = false;
      toggle.removeAttribute("aria-disabled");
      external.disabled = false;
      external.removeAttribute("aria-disabled");
      external.removeAttribute("readonly");
    });
    await expect(button(page)).toBeEnabled();
    await expect(input(page)).toBeEnabled();

    await button(page).click();

    await expect(calendar(page), "the calendar is shown").toHaveJSProperty("hidden", false);
  });
});
