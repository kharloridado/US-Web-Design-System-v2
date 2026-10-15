// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-default-date.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker-default-date.template.html
//   (data-default-date="2020-05-22")
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.
// `input.value = …` becomes fill(); EVENTS.click(button) becomes click().

import { test, expect } from "../harness/test.mjs";

const root = (page) => page.locator(".usa-date-picker");
const input = (page) => root(page).locator(".usa-date-picker__external-input");
const button = (page) => root(page).locator(".usa-date-picker__button");
const calendar = (page) => root(page).locator(".usa-date-picker__calendar");
const focusedDate = (page) => calendar(page).locator(".usa-date-picker__calendar__date--focused");

test.describe("date picker component with default date initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-date-picker/date-picker-default-date.template");
  });

  test("should display the input date when an input date is present", async ({ page }) => {
    await input(page).fill("06/20/2020");

    await button(page).click();

    await expect(calendar(page), "The calendar is shown").toHaveJSProperty("hidden", false);
    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-06-20");
  });

  test("should display the default date when the input date is empty", async ({ page }) => {
    await input(page).fill("");

    await button(page).click();

    await expect(calendar(page), "The calendar is shown").toHaveJSProperty("hidden", false);
    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  // USWDS's case sets input.value = "" here too (same steps as the case above);
  // ported as written.
  test("should display the default date when the input date is invalid", async ({ page }) => {
    await input(page).fill("");

    await button(page).click();

    await expect(calendar(page), "The calendar is shown").toHaveJSProperty("hidden", false);
    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });
});
