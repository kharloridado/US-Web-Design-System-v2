// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-range-date.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker-range-date.template.html
//   (data-range-date="2020-05-22")
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.
// `input.value = …` becomes fill(); EVENTS.click(button) becomes click().

import { test, expect } from "../harness/test.mjs";

const WITHIN_RANGE = "usa-date-picker__calendar__date--within-range";

const root = (page) => page.locator(".usa-date-picker");
const input = (page) => root(page).locator(".usa-date-picker__external-input");
const button = (page) => root(page).locator(".usa-date-picker__button");
const calendar = (page) => root(page).locator(".usa-date-picker__calendar");
// getCalendarEl(query) is root.querySelector(...): the first match.
const getCalendarEl = (page, query) => calendar(page).locator(query).first();
const dateButton = (page, day) => getCalendarEl(page, `.usa-date-picker__calendar__date[data-day="${day}"]`);

const expectWithinRange = async (page, day, within, message) => {
  const date = dateButton(page, day);
  await expect(date, message).toBeAttached();
  if (within) await expect(date, message).toContainClass(WITHIN_RANGE);
  else await expect(date, message).not.toContainClass(WITHIN_RANGE);
};

test.describe("date picker component with range date initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-date-picker/date-picker-range-date.template");
  });

  test("should display the range date when showing the month of the range date", async ({ page }) => {
    await input(page).fill("05/21/2020");

    await button(page).click();

    await expect(getCalendarEl(page, ".usa-date-picker__calendar__date--range-date"), "shows the correct date as the range date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should not display the range date when showing the a month different from the range date month", async ({ page }) => {
    await input(page).fill("06/21/2020");

    await button(page).click();

    // Stricter than USWDS: the calendar is open (on June 2020) when checked.
    await expect(calendar(page)).toHaveJSProperty("hidden", false);
    await expect(calendar(page)).toHaveAttribute("data-value", "2020-06-21");
    await expect(calendar(page).locator(".usa-date-picker__calendar__date--range-date"), "the range date is not present").toHaveCount(0);
  });

  test("should display the days between the calendar date and the range date as within range when the calendar date is above the range date", async ({ page }) => {
    await input(page).fill("05/25/2020");

    await button(page).click();

    await expectWithinRange(page, 22, false, "should not show the range date as within range");
    await expectWithinRange(page, 23, true, "shows date within range as within range");
    await expectWithinRange(page, 24, true, "shows date within range as within range");
    await expectWithinRange(page, 25, false, "should not show the current calendar date as within range");
    await expectWithinRange(page, 26, false, "does not show dates outside of the range as within range");
  });

  test("should display the days between the calendar date and the range date as within range when the calendar date is below the range date", async ({ page }) => {
    await input(page).fill("05/18/2020");

    await button(page).click();

    await expectWithinRange(page, 22, false, "should not show the range date as within range");
    await expectWithinRange(page, 21, true, "shows date within range as within range");
    await expectWithinRange(page, 20, true, "shows date within range as within range");
    await expectWithinRange(page, 19, true, "shows date within range as within range");
    await expectWithinRange(page, 18, false, "should not show the current calendar date as within range");
    await expectWithinRange(page, 17, false, "does not show dates outside of the range as within range");
  });
});
