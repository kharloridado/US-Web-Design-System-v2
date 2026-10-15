// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-min-date-max-date.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker-min-date-max-date.template.html
//   (data-min-date="2020-05-22", data-max-date="2021-06-20")
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.
//
// Where USWDS sets `input.value = "…"` and then clicks the toggle button, the
// test types the date into the input (as a user would) and clicks the button.
// Where USWDS dispatches a click on a disabled control (navigation buttons,
// months, years or days outside the range), the test clicks it with
// { force: true }: a user can press it, the browser just ignores the press.
// EVENTS.keydown* helpers become real key presses on the focused element.
// Where USWDS changes root.dataset after DatePicker.on(), the test changes the
// attribute with page.evaluate after the page has started.

import { test, expect } from "../harness/test.mjs";

const VALIDATION_MESSAGE = "Please enter a valid date";

const root = (page) => page.locator(".usa-date-picker");
const input = (page) => page.locator(".usa-date-picker__external-input");
const button = (page) => page.locator(".usa-date-picker__button");
const calendarEl = (page, query) => page.locator(`.usa-date-picker__calendar${query ? ` ${query}` : ""}`);
const focusedDate = (page) => calendarEl(page, ".usa-date-picker__calendar__date--focused");

const expectCalendarShown = async (page) => {
  await expect(calendarEl(page), "The calendar is shown").not.toHaveAttribute("hidden");
  await expect(calendarEl(page), "The calendar is shown").toBeVisible();
};

// input.value = value; EVENTS.click(button)
const openCalendarWith = async (page, value) => {
  if (value !== undefined) await input(page).fill(value);
  await button(page).click();
};

const setRootData = (page, data) =>
  root(page).evaluate((el, d) => Object.assign(el.dataset, d), data);

test.describe("date picker component with min date and max date initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-date-picker/date-picker-min-date-max-date.template");
  });

  test("should allow navigation back a year to a month that is partially disabled due to a minimum date being set", async ({ page }) => {
    await openCalendarWith(page, "05/15/2021");
    await expectCalendarShown(page);

    await calendarEl(page, ".usa-date-picker__calendar__previous-year").click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should disable back buttons when displaying the minimum month", async ({ page }) => {
    await openCalendarWith(page, "05/30/2020");
    await expectCalendarShown(page);

    await expect(calendarEl(page, ".usa-date-picker__calendar__previous-month"), "the previous month button is disabled").toBeDisabled();
    await expect(calendarEl(page, ".usa-date-picker__calendar__previous-year"), "the previous year button is disabled").toBeDisabled();

    await calendarEl(page, ".usa-date-picker__calendar__previous-month").click({ force: true });
    await calendarEl(page, ".usa-date-picker__calendar__previous-year").click({ force: true });

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-30");
  });

  test("should disable forward buttons when displaying the maximum month", async ({ page }) => {
    await openCalendarWith(page, "06/01/2021");
    await expectCalendarShown(page);

    await expect(calendarEl(page, ".usa-date-picker__calendar__next-month"), "the next month button is disabled").toBeDisabled();
    await expect(calendarEl(page, ".usa-date-picker__calendar__next-year"), "the next year button is disabled").toBeDisabled();

    await calendarEl(page, ".usa-date-picker__calendar__next-month").click({ force: true });
    await calendarEl(page, ".usa-date-picker__calendar__next-year").click({ force: true });

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-01");
  });

  test("should allow navigation back a year to a month that is less than a year from the minimum date being set and cap at that minimum date", async ({ page }) => {
    await openCalendarWith(page, "04/15/2021");
    await expectCalendarShown(page);

    await calendarEl(page, ".usa-date-picker__calendar__previous-year").click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should allow navigation back a month to a month that is partially disabled due to a minimum date being set", async ({ page }) => {
    await openCalendarWith(page, "06/15/2020");
    await expectCalendarShown(page);

    await calendarEl(page, ".usa-date-picker__calendar__previous-month").click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should not allow navigation back a month to a month that is fully disabled due to a minimum date being set", async ({ page }) => {
    await openCalendarWith(page, "05/30/2020");
    await expectCalendarShown(page);

    await expect(calendarEl(page, ".usa-date-picker__calendar__previous-year"), "the button is disabled").toBeDisabled();

    await calendarEl(page, ".usa-date-picker__calendar__previous-month").click({ force: true });

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-30");
  });

  test("should allow navigation forward a year to a month that is partially disabled due to a maximum date being set", async ({ page }) => {
    await openCalendarWith(page, "06/25/2020");
    await expectCalendarShown(page);

    await calendarEl(page, ".usa-date-picker__calendar__next-year").click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should allow navigation forward a year to a month that is less than a year from the maximum date and cap at that maximum date", async ({ page }) => {
    await openCalendarWith(page, "07/25/2020");
    await expectCalendarShown(page);

    await calendarEl(page, ".usa-date-picker__calendar__next-year").click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should allow navigation forward a month to a month that is partially disabled due to a maximum date being set", async ({ page }) => {
    await openCalendarWith(page, "05/25/2021");
    await expectCalendarShown(page);

    await calendarEl(page, ".usa-date-picker__calendar__next-month").click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should not allow navigation forward a month to a month that is fully disabled due to a maximum date being set", async ({ page }) => {
    await openCalendarWith(page, "06/17/2021");
    await expectCalendarShown(page);

    // The next-month button is disabled in the maximum month; the press is ignored.
    await calendarEl(page, ".usa-date-picker__calendar__next-month").click({ force: true });

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-17");
  });

  test("should allow selection of a month in the month selection screen that is partially disabled due to a minimum date being set", async ({ page }) => {
    await openCalendarWith(page, "12/01/2020");
    await calendarEl(page, ".usa-date-picker__calendar__month-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__month-picker"), "the month picker is shown").toBeVisible();

    await calendarEl(page, '.usa-date-picker__calendar__month[data-label="May"]').click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
    await expect(calendarEl(page, ".usa-date-picker__calendar__date-picker"), "the date picker is shown").toBeVisible();
  });

  test("should not allow selection of a month in the month selection screen that is fully disabled due to a minimum date being set", async ({ page }) => {
    await openCalendarWith(page, "10/31/2020");
    await calendarEl(page, ".usa-date-picker__calendar__month-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__month-picker"), "the month picker is shown").toBeVisible();

    await calendarEl(page, '.usa-date-picker__calendar__month[data-label="January"]').click({ force: true });

    await expect(calendarEl(page, ".usa-date-picker__calendar__month-picker"), "the month picker is shown").toBeVisible();
  });

  test("should allow selection of a month in the month selection screen that is partially disabled due to a maximum date being set", async ({ page }) => {
    await openCalendarWith(page, "01/30/2021");
    await calendarEl(page, ".usa-date-picker__calendar__month-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__month-picker"), "the month picker is shown").toBeVisible();

    await calendarEl(page, '.usa-date-picker__calendar__month[data-label="June"]').click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
    await expect(calendarEl(page, ".usa-date-picker__calendar__date-picker"), "the date picker is shown").toBeVisible();
  });

  test("should not allow selection of a month in the month selection screen that is fully disabled due to a maximum date being set", async ({ page }) => {
    // 02/29/2021 is not a real date; USWDS clamps the day when opening (02/28/2021).
    await openCalendarWith(page, "02/29/2021");
    await calendarEl(page, ".usa-date-picker__calendar__month-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__month-picker"), "the month picker is shown").toBeVisible();

    await calendarEl(page, '.usa-date-picker__calendar__month[data-label="December"]').click({ force: true });

    await expect(calendarEl(page, ".usa-date-picker__calendar__month-picker"), "the month picker is shown").toBeVisible();
  });

  test("should allow selection of a year in the year selection screen that is partially disabled due to a minimum date being set", async ({ page }) => {
    await openCalendarWith(page, "04/01/2021");
    await calendarEl(page, ".usa-date-picker__calendar__year-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__year-picker"), "the year picker is shown").toBeVisible();

    await calendarEl(page, '.usa-date-picker__calendar__year[data-value="2020"]').click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
    await expect(calendarEl(page, ".usa-date-picker__calendar__date-picker"), "the date picker is shown").toBeVisible();
  });

  test("should allow selection of a year in the year selection screen that is partially disabled due to a maximum date being set", async ({ page }) => {
    await openCalendarWith(page, "12/01/2020");
    await calendarEl(page, ".usa-date-picker__calendar__year-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__year-picker"), "the year picker is shown").toBeVisible();

    await calendarEl(page, '.usa-date-picker__calendar__year[data-value="2021"]').click();

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
    await expect(calendarEl(page, ".usa-date-picker__calendar__date-picker"), "the date picker is shown").toBeVisible();
  });

  test("should not allow selection of a year in the year selection screen that is fully disabled due to a minimum date being set", async ({ page }) => {
    await openCalendarWith(page, "07/04/2020");
    await calendarEl(page, ".usa-date-picker__calendar__year-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__year-picker"), "the year picker is shown").toBeVisible();

    await calendarEl(page, '.usa-date-picker__calendar__year[data-value="2018"]').click({ force: true });

    await expect(calendarEl(page, ".usa-date-picker__calendar__year-picker"), "the year picker is shown").toBeVisible();
  });

  test("should not allow selection of a year  in the year selection screen that is fully disabled due to a maximum date being set", async ({ page }) => {
    await openCalendarWith(page, "12/01/2020");
    await calendarEl(page, ".usa-date-picker__calendar__year-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__year-picker"), "the year picker is shown").toBeVisible();

    await calendarEl(page, '.usa-date-picker__calendar__year[data-value="2023"]').click({ force: true });

    await expect(calendarEl(page, ".usa-date-picker__calendar__year-picker"), "the year picker is shown").toBeVisible();
  });

  test("should allow selection of a date that is the minimum date", async ({ page }) => {
    await openCalendarWith(page, "05/25/2020");
    await expectCalendarShown(page);

    await calendarEl(page, '.usa-date-picker__calendar__date[data-day="22"]').first().click();

    await expect(input(page), "The value has been filled in").toHaveValue("05/22/2020");
  });

  test("should allow selection of a date that is the maximum date", async ({ page }) => {
    await openCalendarWith(page, "06/15/2020");
    await expectCalendarShown(page);

    await calendarEl(page, '.usa-date-picker__calendar__date[data-day="20"]').first().click();

    await expect(input(page), "The value has been filled in").toHaveValue("06/20/2020");
  });

  test("should not allow selection of a date that is before the minimum date", async ({ page }) => {
    await openCalendarWith(page, "05/25/2020");
    await expectCalendarShown(page);

    await calendarEl(page, '.usa-date-picker__calendar__date[data-day="15"]').first().click({ force: true });

    await expectCalendarShown(page);
  });

  test("should not allow selection of a date that is after the maximum date", async ({ page }) => {
    await openCalendarWith(page, "06/15/2021");
    await expectCalendarShown(page);

    await calendarEl(page, '.usa-date-picker__calendar__date[data-day="25"]').first().click({ force: true });

    await expectCalendarShown(page);
  });

  test("should allow keyboard navigation to move back one day to a date that is the minimum date", async ({ page }) => {
    await openCalendarWith(page, "05/23/2020");
    await expectCalendarShown(page);

    await page.keyboard.press("ArrowLeft");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should allow keyboard navigation to move back one week to a date that is the minimum date", async ({ page }) => {
    await openCalendarWith(page, "05/29/2020");
    await expectCalendarShown(page);

    await page.keyboard.press("ArrowUp");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should allow keyboard navigation to move back one month to a date that is the minimum date", async ({ page }) => {
    await openCalendarWith(page, "06/22/2020");
    await expectCalendarShown(page);

    await page.keyboard.press("PageUp");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should allow keyboard navigation to move back one year to a date that is the minimum date", async ({ page }) => {
    await openCalendarWith(page, "05/22/2021");
    await expectCalendarShown(page);

    await page.keyboard.press("Shift+PageUp");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should not allow keyboard navigation to move back one day to a date that is before the minimum date", async ({ page }) => {
    await openCalendarWith(page, "05/22/2020");
    await expectCalendarShown(page);

    await page.keyboard.press("ArrowLeft");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should allow keyboard navigation to move to the start of the week to a date that is before the minimum date but cap at minimum date", async ({ page }) => {
    await openCalendarWith(page, "05/23/2020");
    await expectCalendarShown(page);

    await page.keyboard.press("Home");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should allow keyboard navigation to move back one week to a date that is before the minimum date but cap at minimum date", async ({ page }) => {
    await openCalendarWith(page, "05/28/2020");
    await expectCalendarShown(page);

    await page.keyboard.press("ArrowUp");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should allow keyboard navigation to move back one month to a date that is before the minimum date but cap at minimum date", async ({ page }) => {
    await openCalendarWith(page, "06/21/2020");
    await expectCalendarShown(page);

    await page.keyboard.press("PageUp");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should allow keyboard navigation to move back one year to a date that is before the minimum date but cap at minimum date", async ({ page }) => {
    await openCalendarWith(page, "05/21/2021");
    await expectCalendarShown(page);

    await page.keyboard.press("Shift+PageUp");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should allow keyboard navigation to move forward one day to a date that is the maximum date", async ({ page }) => {
    await openCalendarWith(page, "06/19/2021");
    await expectCalendarShown(page);

    await page.keyboard.press("ArrowRight");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should allow keyboard navigation to move forward one week to a date that is the maximum date", async ({ page }) => {
    await openCalendarWith(page, "06/13/2021");
    await expectCalendarShown(page);

    await page.keyboard.press("ArrowDown");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should allow keyboard navigation to move forward one month to a date that is the maximum date", async ({ page }) => {
    await openCalendarWith(page, "05/20/2021");
    await expectCalendarShown(page);

    await page.keyboard.press("PageDown");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should allow keyboard navigation to move forward one year to a date that is the maximum date", async ({ page }) => {
    await openCalendarWith(page, "06/20/2020");
    await expectCalendarShown(page);

    await page.keyboard.press("Shift+PageDown");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should not allow keyboard navigation to move forward one day to a date that is after the maximum date", async ({ page }) => {
    await openCalendarWith(page, "06/20/2021");
    await expectCalendarShown(page);

    await page.keyboard.press("ArrowRight");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should allow keyboard navigation to move to the end of the week to a date that is after the maximum date but cap at maximum date", async ({ page }) => {
    await setRootData(page, { maxDate: "2021-06-21" });
    await openCalendarWith(page, "06/20/2021");
    await expectCalendarShown(page);

    await page.keyboard.press("End");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-21");
  });

  test("should allow keyboard navigation to move forward one week to a date that is after the maximum date but cap at maximum date", async ({ page }) => {
    await openCalendarWith(page, "06/14/2021");
    await expectCalendarShown(page);

    await page.keyboard.press("ArrowDown");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should allow keyboard navigation to move forward one month to a date that is after the maximum date but cap at maximum date", async ({ page }) => {
    await openCalendarWith(page, "05/21/2021");
    await expectCalendarShown(page);

    await page.keyboard.press("PageDown");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  test("should allow keyboard navigation to move forward one year to a date that is after the maximum date but cap at maximum date", async ({ page }) => {
    await openCalendarWith(page, "06/21/2020");
    await expectCalendarShown(page);

    await page.keyboard.press("Shift+PageDown");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  // EVENTS.keydownEnter(input) → press Enter in the input after typing the date.
  test("should show a date that is after the maximum date as invalid", async ({ page }) => {
    await input(page).fill("06/30/2021");

    await input(page).press("Enter");

    await expect.poll(() => input(page).evaluate((el) => el.validationMessage)).toBe(VALIDATION_MESSAGE);
  });

  test("should show a date that is the maximum date as valid", async ({ page }) => {
    await input(page).fill("06/20/2021");

    await input(page).press("Enter");

    await expect.poll(() => input(page).evaluate((el) => el.validationMessage)).toBe("");
  });

  test("should show a date that is before the minimum date as invalid", async ({ page }) => {
    await input(page).fill("05/01/2020");

    await input(page).press("Enter");

    await expect.poll(() => input(page).evaluate((el) => el.validationMessage)).toBe(VALIDATION_MESSAGE);
  });

  test("should show a date that is the minimum date as valid", async ({ page }) => {
    await input(page).fill("05/22/2020");

    await input(page).press("Enter");

    await expect.poll(() => input(page).evaluate((el) => el.validationMessage)).toBe("");
  });

  // USWDS catches the error with window.onerror; on a page it is an uncaught
  // page error, so this test allows errors and asserts it is exactly that one.
  test("should throw when minDate is larger than maxDate", async ({ page, fixture }) => {
    fixture.allowErrors();
    await setRootData(page, { minDate: "2020-07-04", maxDate: "2020-06-20" });

    await button(page).click();

    await expect.poll(() => fixture.errors, "caught the error").toEqual(["Minimum date cannot be after maximum date"]);
  });

  test("should open the calendar on the min date when the input date is before the min date", async ({ page }) => {
    await openCalendarWith(page, "04/15/2020");

    await expectCalendarShown(page);
    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-05-22");
  });

  test("should open the calendar on the max date when the input date is after the max date", async ({ page }) => {
    await openCalendarWith(page, "04/15/2023");

    await expectCalendarShown(page);
    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2021-06-20");
  });

  // USWDS relies on the real current date being after 2020-02-14; so does this test.
  test("should open the calendar on the max date when the input is empty and the current date is after the max date", async ({ page }) => {
    await setRootData(page, { minDate: "2020-01-01", maxDate: "2020-02-14" });
    await openCalendarWith(page);

    await expectCalendarShown(page);
    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-02-14");
  });

  // EVENTS.input(input) after changing the value → the user types the new date
  // into the input while the calendar is open.
  test("should update the calendar to the max date when the input is changed and the input date is after the max date", async ({ page }) => {
    await setRootData(page, { minDate: "2020-01-01", maxDate: "2020-02-14" });
    await openCalendarWith(page, "01/20/2020");
    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-01-20");

    await input(page).fill("6/20/2020");

    await expect(focusedDate(page), "focuses correct date").toHaveAttribute("data-value", "2020-02-14");
  });
});
