// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker.template.html
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.
//
// Mapping of USWDS's jsdom helpers to user actions:
//   input.value = "…"           → fill() on the input (what typing produces)
//   EVENTS.click(el)            → click()
//   EVENTS.keydown*()           → page.keyboard.press() on the focused element
//   EVENTS.focusout()           → a click on an empty part of the page / Tab out
//   EVENTS.input(input)         → fill() (fires the input event)
//
// "Today": USWDS doesn't pin the date in this spec, but some expectations depend
// on it (the year chunk 2016–2027 shown by the year picker, two-digit years
// resolved in the current century). Those hold for any current year from 2016 to
// 2027, so the clock is pinned inside that window to keep the run deterministic.

import { test, expect } from "../harness/test.mjs";

const TODAY = new Date(2026, 9, 15, 12, 0, 0); // 15 October 2026, local time
const TODAY_VALUE = "2026-10-15";
const VALIDATION_MESSAGE = "Please enter a valid date";

const root = (page) => page.locator(".usa-date-picker");
const input = (page) => root(page).locator(".usa-date-picker__external-input");
const button = (page) => root(page).locator(".usa-date-picker__button");
const calendar = (page) => root(page).locator(".usa-date-picker__calendar");
const focusedDate = (page) => calendar(page).locator(".usa-date-picker__calendar__date--focused");
const monthSelection = (page) => calendar(page).locator(".usa-date-picker__calendar__month-selection");
const yearSelection = (page) => calendar(page).locator(".usa-date-picker__calendar__year-selection");
const firstYear = (page) => calendar(page).locator(".usa-date-picker__calendar__year").first();
const dateButton = (page, day) => calendar(page).locator(`.usa-date-picker__calendar__date[data-day="${day}"]`).first();

// getCalendarEl().hidden === false / true
const expectCalendarShown = (page) => expect(calendar(page), "The calendar is shown").toHaveJSProperty("hidden", false);
const expectCalendarHidden = (page) => expect(calendar(page), "The calendar is hidden").toHaveJSProperty("hidden", true);

// textContent strictEqual: exact, unnormalized text.
const expectText = (locator, text, message) => expect(locator, message).toHaveJSProperty("textContent", text);

const expectCalendarAt = async (page, { day, month, year }) => {
  await expectText(focusedDate(page), day, "focuses correct date");
  await expectText(monthSelection(page), month, "shows correct month");
  await expectText(yearSelection(page), year, "shows correct year");
};

// input.value = value; EVENTS.click(button); calendar shown
const openWith = async (page, value) => {
  await input(page).fill(value);
  await button(page).click();
  await expectCalendarShown(page);
};

test.describe("date picker component initialized at document.body", () => {
  test.beforeEach(async ({ page, fixture }) => {
    await page.clock.setFixedTime(TODAY);
    await fixture.open("usa-date-picker/date-picker.template");
  });

  test("should enhance the date input with a date picker button", async ({ page }) => {
    await expect(input(page), "has an input element").toHaveCount(1);
    await expect(button(page), "has a button element").toHaveCount(1);
  });

  // mouse interactions
  test("should display a calendar for the current date when the date picker button is clicked", async ({ page }) => {
    await button(page).click();

    await expectCalendarShown(page);
    await expect(calendar(page).locator(":focus"), "The focus is within the component").toHaveCount(1);
    // Stricter than USWDS: the calendar is for the current date.
    await expect(focusedDate(page)).toHaveAttribute("data-value", TODAY_VALUE);
  });

  test("should set aria-current='date' on today's date button", async ({ page }) => {
    await button(page).click();

    const todayBtn = calendar(page).locator(".usa-date-picker__calendar__date--today").first();
    await expect(todayBtn, "today's date button exists").toBeAttached();
    await expect(todayBtn, "today's date button has aria-current='date'").toHaveAttribute("aria-current", "date");
  });

  test("should not set aria-current on non-today date buttons", async ({ page }) => {
    await button(page).click();
    await expectCalendarShown(page);

    const ariaCurrent = await calendar(page)
      .locator(".usa-date-picker__calendar__date:not(.usa-date-picker__calendar__date--today)")
      .evaluateAll((btns) => btns.map((btn) => btn.getAttribute("aria-current")));

    // Stricter than USWDS: the calendar must actually have date buttons to check.
    expect(ariaCurrent.length).toBeGreaterThan(0);
    for (const value of ariaCurrent) expect(value, "non-today button should not have aria-current").toBeNull();
  });

  test("should hide the calendar when the date picker button is clicked and the calendar is already open", async ({ page }) => {
    await button(page).click();
    await expectCalendarShown(page);

    await button(page).click();
    await expectCalendarHidden(page);
  });

  test("should close the calendar you click outside of an active calendar", async ({ page }) => {
    await button(page).click();
    await expectCalendarShown(page);

    // EVENTS.focusout() from the focused date: click an empty part of the page.
    await page.mouse.click(1000, 700);

    await expectCalendarHidden(page);
  });

  test("should close the calendar you press escape from the input", async ({ page }) => {
    await button(page).click();
    await expectCalendarShown(page);

    // EVENTS.keydownEscape(input): go back to the input, then press Escape there.
    await input(page).click();
    await expectCalendarShown(page);
    await page.keyboard.press("Escape");

    await expectCalendarHidden(page);
  });

  test("should display a calendar for the inputted date when the date picker button is clicked with a date entered", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await expectCalendarAt(page, { day: "1", month: "January", year: "2020" });
  });

  test("should allow for the selection of a date within the calendar", async ({ page }) => {
    await openWith(page, "1/1/2020");

    // inputChangeSpy: count change events from the input from here on (typing the
    // date and leaving the input fires a native change, which USWDS's
    // programmatic `input.value =` doesn't).
    await input(page).evaluate((el) => {
      window.__changeEvents = 0;
      el.addEventListener("change", () => (window.__changeEvents += 1));
    });

    await dateButton(page, 10).click();

    await expect(input(page), "The value has been filled in").toHaveValue("01/10/2020");
    await expect(input(page), "The focus is on the input").toBeFocused();
    await expectCalendarHidden(page);
    expect(await page.evaluate(() => window.__changeEvents), "should have dispatched a change event from the input").toBeGreaterThan(0);
  });

  test("should allow for navigation to the preceding month by clicking the left single arrow button within the calendar", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await calendar(page).locator(".usa-date-picker__calendar__previous-month").click();
    await expectCalendarAt(page, { day: "1", month: "December", year: "2019" });
  });

  test("should allow for navigation to the succeeding month by clicking the right single arrow button within the calendar", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await calendar(page).locator(".usa-date-picker__calendar__next-month").click();
    await expectCalendarAt(page, { day: "1", month: "February", year: "2020" });
  });

  test("should allow for navigation to the preceding year by clicking the left double arrow button within the calendar", async ({ page }) => {
    await openWith(page, "1/1/2016");
    await calendar(page).locator(".usa-date-picker__calendar__previous-year").click();
    await expectCalendarAt(page, { day: "1", month: "January", year: "2015" });
  });

  test("should allow for navigation to the succeeding year by clicking the right double arrow button within the calendar", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await calendar(page).locator(".usa-date-picker__calendar__next-year").click();
    await expectCalendarAt(page, { day: "1", month: "January", year: "2021" });
  });

  test("should display a month selection screen by clicking the month display within the calendar", async ({ page }) => {
    await button(page).click();
    await expectCalendarShown(page);

    await monthSelection(page).click();

    await expect(page.locator(":focus"), "calendar month is focused").toContainClass("usa-date-picker__calendar__month--focused");
    await expect(calendar(page).locator(".usa-date-picker__calendar__month-picker").first(), "calendar is showing the month picker").toBeAttached();
  });

  test("should allow for the selection of a month within month selection screen", async ({ page }) => {
    await input(page).fill("2/1/2020");
    await button(page).click();
    await monthSelection(page).click();

    await calendar(page).locator(".usa-date-picker__calendar__month").first().click();

    await expectText(monthSelection(page), "January", "shows correct month");
  });

  test("should display a year selection screen by clicking the year display within the calendar", async ({ page }) => {
    await button(page).click();

    await yearSelection(page).click();

    await expect(calendar(page).locator(".usa-date-picker__calendar__year-picker").first(), "calendar is showing the year picker").toBeAttached();
    await expectText(firstYear(page), "2016", "shows correct first year of chunk");
    await expect(page.locator(":focus"), "calendar year is focused").toContainClass("usa-date-picker__calendar__year--focused");
  });

  test("should allow for navigation to the preceding dozen years by clicking the left single arrow button within the year selection screen", async ({ page }) => {
    await button(page).click();
    await yearSelection(page).click();

    await calendar(page).locator(".usa-date-picker__calendar__previous-year-chunk").click();

    await expectText(firstYear(page), "2004", "shows correct first year of chunk");
  });

  test("should allow for navigation to the succeeding dozen year by clicking the right single arrow button within the year selection screen", async ({ page }) => {
    await button(page).click();
    await yearSelection(page).click();

    await calendar(page).locator(".usa-date-picker__calendar__next-year-chunk").click();

    await expectText(firstYear(page), "2028", "shows correct first year of chunk");
  });

  test("should allow for the selection of a year within year selection screen", async ({ page }) => {
    await input(page).fill("2/1/2020");
    await button(page).click();
    await yearSelection(page).click();

    await firstYear(page).click();

    await expectText(yearSelection(page), "2016", "shows correct year");
  });

  // keyboard interactions

  test("should close the calendar when escape is pressed within the calendar", async ({ page }) => {
    await button(page).click();
    await expectCalendarShown(page);

    await page.keyboard.press("Escape");

    await expectCalendarHidden(page);
  });

  test("should move focus to the same day of week of the previous week when up is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/10/2020");
    await page.keyboard.press("ArrowUp");
    await expectCalendarAt(page, { day: "3", month: "January", year: "2020" });
  });

  test("should move focus to the same day of week of the next week when down is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/10/2020");
    await page.keyboard.press("ArrowDown");
    await expectCalendarAt(page, { day: "17", month: "January", year: "2020" });
  });

  test("should move focus to the previous day when left is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/10/2020");
    await page.keyboard.press("ArrowLeft");
    await expectCalendarAt(page, { day: "9", month: "January", year: "2020" });
  });

  test("should move focus to the next day when right is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/10/2020");
    await page.keyboard.press("ArrowRight");
    await expectCalendarAt(page, { day: "11", month: "January", year: "2020" });
  });

  test("should move focus to the first day (e.g. Sunday) of the current week when home is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await page.keyboard.press("Home");
    await expectCalendarAt(page, { day: "29", month: "December", year: "2019" });
  });

  test("should move focus to the last day (e.g. Saturday) of the current week when end is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await page.keyboard.press("End");
    await expectCalendarAt(page, { day: "4", month: "January", year: "2020" });
  });

  test("should move focus to the same day of the previous month when page up is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await page.keyboard.press("PageUp");
    await expectCalendarAt(page, { day: "1", month: "December", year: "2019" });
  });

  test("should move focus to the last day of the previous month when page up is pressed from the the last day of a longer month", async ({ page }) => {
    await openWith(page, "12/31/2019");
    await page.keyboard.press("PageUp");
    await expectCalendarAt(page, { day: "30", month: "November", year: "2019" });
  });

  test("should move focus to the same day of the next month when page down is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await page.keyboard.press("PageDown");
    await expectCalendarAt(page, { day: "1", month: "February", year: "2020" });
  });

  test("should move focus to the last day of the next month when page down is pressed from the the last day of a longer month", async ({ page }) => {
    await openWith(page, "1/31/2020");
    await page.keyboard.press("PageDown");
    await expectCalendarAt(page, { day: "29", month: "February", year: "2020" });
  });

  test("should move focus to the same day of the month January when page down is pressed from the currently focused day in December", async ({ page }) => {
    await openWith(page, "12/31/2020");
    await page.keyboard.press("PageDown");
    await expectCalendarAt(page, { day: "31", month: "January", year: "2021" });
  });

  test("should move focus to the same day/month of the previous year when shift + page up is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await page.keyboard.press("Shift+PageUp");
    await expectCalendarAt(page, { day: "1", month: "January", year: "2019" });
  });

  test("should move focus to February 28th of the previous year when shift + page up is pressed from a focused February 29th date of a leap year", async ({ page }) => {
    await openWith(page, "2/29/2020");
    await page.keyboard.press("Shift+PageUp");
    await expectCalendarAt(page, { day: "28", month: "February", year: "2019" });
  });

  test("should move focus to the same day/month of the next year when shift + page down is pressed from the currently focused day", async ({ page }) => {
    await openWith(page, "1/1/2020");
    await page.keyboard.press("Shift+PageDown");
    await expectCalendarAt(page, { day: "1", month: "January", year: "2021" });
  });

  test("should move focus to February 28th of the next year when shift + page down is pressed from a focused February 29th date of a leap year", async ({ page }) => {
    await openWith(page, "2/29/2020");
    await page.keyboard.press("Shift+PageDown");
    await expectCalendarAt(page, { day: "28", month: "February", year: "2021" });
  });

  test("should accept a parse-able date with a two digit year and display the calendar of that year in the current century", async ({ page }) => {
    await openWith(page, "2/29/20");
    await expectCalendarAt(page, { day: "29", month: "February", year: "2020" });
  });

  test("should show an improper date as invalid as the user leaves the input", async ({ page }) => {
    await input(page).fill("abcdefg... That means the convo is done");
    // EVENTS.focusout(input): the user tabs out of the input.
    await page.keyboard.press("Tab");

    await expect(input(page)).toHaveJSProperty("validationMessage", VALIDATION_MESSAGE);
  });

  // "should validate input on the static validate function being emitted" calls
  // DatePicker.validateDateInput(input) directly: ledger "internal" (api-only).

  test("should update the calendar when a valid date is entered in the input while the date picker is open", async ({ page }) => {
    await openWith(page, "6/1/2020");
    const firstFocus = await focusedDate(page).elementHandle();
    await expectText(focusedDate(page), "1");

    // input.value = "6/20/2020"; EVENTS.input(input): type the new date while open.
    await input(page).fill("6/20/2020");

    await expectCalendarShown(page);
    await expectText(focusedDate(page), "20");
    const secondFocus = await focusedDate(page).elementHandle();
    expect(await page.evaluate(([a, b]) => a !== b, [firstFocus, secondFocus])).toBe(true);
  });

  test("should validate the input when a date is selected", async ({ page }) => {
    await input(page).fill("2/31/2019");
    await page.keyboard.press("Tab"); // EVENTS.focusout(input)
    await expect(input(page)).toHaveJSProperty("validationMessage", VALIDATION_MESSAGE);
    await button(page).click();
    await expectCalendarShown(page);

    await dateButton(page, 10).click();

    await expect(input(page)).toHaveJSProperty("validationMessage", "");
  });

  test("should show an improper date as invalid if the user presses enter from the input", async ({ page }) => {
    await input(page).fill("2/31/2019");

    await page.keyboard.press("Enter");

    await expect(input(page)).toHaveJSProperty("validationMessage", VALIDATION_MESSAGE);
  });

  test("should show an empty input as valid", async ({ page }) => {
    await input(page).fill("");

    await page.keyboard.press("Enter");

    await expect(input(page)).toHaveJSProperty("validationMessage", "");
  });

  test("should prevent action from button when event didn't originate from date", async ({ page }) => {
    await openWith(page, "2/31/2019");

    // EVENTS.keyupEnter() on the focused date with no keydown in the calendar
    // (e.g. Enter pressed elsewhere, released after focus moved into the
    // calendar). Read defaultPrevented once the event has bubbled to window.
    await page.evaluate(() => {
      window.__keyupDefaultPrevented = [];
      window.addEventListener("keyup", (event) => window.__keyupDefaultPrevented.push(event.defaultPrevented));
    });
    await page.keyboard.up("Enter");

    expect(await page.evaluate(() => window.__keyupDefaultPrevented), "should not have allowed enter to perform default action").toEqual([true]);
  });
});
