// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-mousemove.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker.template.html
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.
// The spec sets data-min-date / data-max-date after DatePicker.on(), so the test
// sets them after the page has started. `input.value = …` becomes fill(),
// EVENTS.click(button) a click and EVENTS.mouseover(day) a hover on that day.
//
// The spec's getCalendarEl() takes no argument, so its
// getCalendarEl(".usa-date-picker__calendar__date--focused").dataset.value reads
// the calendar's own data-value (the date it shows). Both that and the focused
// date's data-value are asserted (the latter is what the message describes).

import { test, expect } from "../harness/test.mjs";

const root = (page) => page.locator(".usa-date-picker");
const input = (page) => root(page).locator(".usa-date-picker__external-input");
const button = (page) => root(page).locator(".usa-date-picker__button");
const calendar = (page) => root(page).locator(".usa-date-picker__calendar");
const focusedDate = (page) => calendar(page).locator(".usa-date-picker__calendar__date--focused");
const dateButton = (page, day) => calendar(page).locator(`.usa-date-picker__calendar__date[data-day="${day}"]`).first();

const expectFocusedOn = async (page, value, message) => {
  await expect(calendar(page), message).toHaveAttribute("data-value", value);
  await expect(focusedDate(page), message).toHaveAttribute("data-value", value);
};

const openJune2020 = async (page) => {
  await root(page).evaluate((el) => {
    el.dataset.minDate = "2020-06-01";
    el.dataset.maxDate = "2020-06-24";
  });
  await input(page).fill("6/20/2020");
  await button(page).click();
};

test.describe("date picker component mouse move selection initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-date-picker/date-picker.template");
  });

  test("should ignore mouse move events over disabled days", async ({ page }) => {
    await openJune2020(page);
    await expectFocusedOn(page, "2020-06-20", "focuses correct date");

    // Stricter than USWDS: the 26th is past data-max-date, so it is disabled.
    await expect(dateButton(page, 26)).toBeDisabled();
    await dateButton(page, 26).hover();

    await expectFocusedOn(page, "2020-06-20", "does not focus disabled day");
  });

  test("should ignore mouse event on the same day", async ({ page }) => {
    await openJune2020(page);
    await calendar(page).evaluate((el) => (el.dataset.wouldDisappearOnRerender = "true"));
    await expectFocusedOn(page, "2020-06-20", "focuses correct date");

    await dateButton(page, 20).hover();

    await expect(calendar(page), "calendar did not rerender").toHaveAttribute("data-would-disappear-on-rerender", "true");
    await expectFocusedOn(page, "2020-06-20", "focuses correct date");
  });
});
