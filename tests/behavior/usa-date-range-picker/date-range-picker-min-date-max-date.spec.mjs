// Port of @uswds/uswds packages/usa-date-range-picker/src/test/date-range-picker-min-date-max-date.spec.js
// Fixture: packages/usa-date-range-picker/src/test/date-range-picker-min-date-max-date.template.html
//
// USWDS runs each case twice, initializing at document.body and at the date range
// picker. On a page the behaviors start at document.body, so each case runs once.
//
// USWDS sets the external input's value and dispatches one "input" event; the test
// types the value with fill(), which does the same. For the "empty value" cases a
// fill("") on an already-empty field sends no input event, so the test first
// types a valid date and then clears the field: the clearing is the input event
// with an empty value, and every USWDS assertion is checked after it.
//
// USWDS has two cases titled "should not update the range end date picker
// properties when the range start date picker has an empty value" in one describe
// (the second one types into the range end). Playwright needs unique full titles,
// so the cases are grouped by which input is typed into.

import { test, expect } from "../harness/test.mjs";

const rangeStart = (page) => page.locator(".usa-date-range-picker .usa-date-range-picker__range-start");
const rangeEnd = (page) => page.locator(".usa-date-range-picker .usa-date-range-picker__range-end");
const rangeStartInput = (page) => rangeStart(page).locator(".usa-date-picker__external-input");
const rangeEndInput = (page) => rangeEnd(page).locator(".usa-date-picker__external-input");

test.describe("date range picker component with min date and max date", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-date-range-picker/date-range-picker-min-date-max-date.template");
  });

  test("should enhance the date picker and identify the start and end date pickers", async ({ page }) => {
    await expect(rangeStart(page), "has a range start date picker element").toHaveCount(1);
    await expect(rangeStart(page), "has the default min date").toHaveAttribute("data-min-date", "2020-05-22");
    await expect(rangeStart(page), "has the default max date").toHaveAttribute("data-max-date", "2021-06-20");

    await expect(rangeEnd(page), "has a range end date picker element").toHaveCount(1);
    await expect(rangeEnd(page), "has the default min date").toHaveAttribute("data-min-date", "2020-05-22");
    await expect(rangeEnd(page), "has the default max date").toHaveAttribute("data-max-date", "2021-06-20");
  });

  test.describe("range start input", () => {
    test("should not update the range end date picker properties when the range start date picker has an empty value", async ({ page }) => {
      await rangeStartInput(page).fill("12/12/2020");
      await rangeStartInput(page).fill("");

      await expect(rangeEnd(page), "has the default min date").toHaveAttribute("data-min-date", "2020-05-22");
      await expect(rangeEnd(page), "has the default max date").toHaveAttribute("data-max-date", "2021-06-20");
      await expect(rangeEnd(page), "has no range date").toHaveAttribute("data-range-date", "");
      await expect(rangeEnd(page), "has no default date").toHaveAttribute("data-default-date", "");
    });

    test("should update the range end date picker properties to have a min date and range date when the range start date picker has an updated valid value", async ({ page }) => {
      await rangeStartInput(page).fill("12/12/2020");

      await expect(rangeEnd(page), "has updated min date").toHaveAttribute("data-min-date", "2020-12-12");
      await expect(rangeEnd(page), "has the default max date").toHaveAttribute("data-max-date", "2021-06-20");
      await expect(rangeEnd(page), "has updated range date").toHaveAttribute("data-range-date", "2020-12-12");
      await expect(rangeEnd(page), "has updated default date to display").toHaveAttribute("data-default-date", "2020-12-12");
    });

    test("should reset the range end date picker properties when the range start date picker has an updated invalid value", async ({ page }) => {
      await rangeStartInput(page).fill("ab/dc/efg");

      await expect(rangeEnd(page), "has the default min date").toHaveAttribute("data-min-date", "2020-05-22");
      await expect(rangeEnd(page), "has the default max date").toHaveAttribute("data-max-date", "2021-06-20");
      await expect(rangeEnd(page), "has no range date").toHaveAttribute("data-range-date", "");
      await expect(rangeEnd(page), "has no default date").toHaveAttribute("data-default-date", "");
    });
  });

  test.describe("range end input", () => {
    // USWDS's title says "range end ... range start", but the case clears the range
    // end input and checks the range start picker; ported as written.
    test("should not update the range end date picker properties when the range start date picker has an empty value", async ({ page }) => {
      await rangeEndInput(page).fill("12/11/2020");
      await rangeEndInput(page).fill("");

      await expect(rangeStart(page), "has the default min date").toHaveAttribute("data-min-date", "2020-05-22");
      await expect(rangeStart(page), "has the default max date").toHaveAttribute("data-max-date", "2021-06-20");
      await expect(rangeStart(page), "has no range date").toHaveAttribute("data-range-date", "");
      await expect(rangeStart(page), "has no default date").toHaveAttribute("data-default-date", "");
    });

    test("should update the range start date picker properties to have a max date and range date when the range end date picker has an updated valid value", async ({ page }) => {
      await rangeEndInput(page).fill("12/11/2020");

      await expect(rangeStart(page), "has the default min date").toHaveAttribute("data-min-date", "2020-05-22");
      await expect(rangeStart(page), "has updated min date").toHaveAttribute("data-max-date", "2020-12-11");
      await expect(rangeStart(page), "has updated range date").toHaveAttribute("data-range-date", "2020-12-11");
      await expect(rangeStart(page), "has updated default date to display").toHaveAttribute("data-default-date", "2020-12-11");
    });

    // Same title mismatch as above: types an invalid date into the range end input.
    test("should not update the range end date picker properties when the range start date picker has an updated invalid value", async ({ page }) => {
      await rangeEndInput(page).fill("35/35/3535");

      await expect(rangeStart(page), "has the default min date").toHaveAttribute("data-min-date", "2020-05-22");
      await expect(rangeStart(page), "has the default max date").toHaveAttribute("data-max-date", "2021-06-20");
      await expect(rangeStart(page), "has no range date").toHaveAttribute("data-range-date", "");
      await expect(rangeStart(page), "has no default date").toHaveAttribute("data-default-date", "");
    });
  });
});
