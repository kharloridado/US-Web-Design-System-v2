// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-default-value.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker-default-value.template.html
//   (data-default-value="2020-05-22")
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.

import { test, expect } from "../harness/test.mjs";

const root = (page) => page.locator(".usa-date-picker");
const input = (page) => root(page).locator(".usa-date-picker__external-input");
const button = (page) => root(page).locator(".usa-date-picker__button");
const calendar = (page) => root(page).locator(".usa-date-picker__calendar");
const focusedDate = (page) => calendar(page).locator(".usa-date-picker__calendar__date--focused");

test.describe("date picker component with default date initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-date-picker/date-picker-default-value.template");
  });

  test("should set the input date of the calendar", async ({ page }) => {
    await expect(input(page), "updates the calendar value").toHaveValue("05/22/2020");
  });

  test("should display the selected date when the calendar is opened", async ({ page }) => {
    await button(page).click();

    await expect(calendar(page), "The calendar is shown").toHaveJSProperty("hidden", false);
    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });
});
