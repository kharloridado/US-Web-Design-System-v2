// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-year-selection.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker.template.html
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.
//
// "Open year selection view": USWDS sets input.value = "6/20/2020" and clicks
// the toggle button, then the year selection button. The test types the date
// and clicks the same buttons. EVENTS.keydown* helpers become real key presses
// on the focused year (USWDS focuses it when the year picker opens).

import { test, expect } from "../harness/test.mjs";

const input = (page) => page.locator(".usa-date-picker__external-input");
const button = (page) => page.locator(".usa-date-picker__button");
const calendarEl = (page, query) => page.locator(`.usa-date-picker__calendar${query ? ` ${query}` : ""}`);
const focusedYear = (page) => calendarEl(page, ".usa-date-picker__calendar__year--focused");

test.describe("date picker component year selection initialized at document.body", () => {
  test.beforeEach(async ({ page, fixture }) => {
    await fixture.open("usa-date-picker/date-picker.template");

    // Open year selection view
    await input(page).fill("6/20/2020");
    await button(page).click();
    await calendarEl(page, ".usa-date-picker__calendar__year-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__year-picker")).toBeVisible();
  });

  test("should show year of 2020 as focused", async ({ page }) => {
    await expect(focusedYear(page), "focuses correct year").toHaveAttribute("data-value", "2020");
  });

  test("should show year of 2020 as selected", async ({ page }) => {
    await expect(calendarEl(page, ".usa-date-picker__calendar__year--selected"), "selects correct year").toHaveAttribute("data-value", "2020");
  });

  test("should navigate back three years when pressing up", async ({ page }) => {
    await page.keyboard.press("ArrowUp");

    await expect(focusedYear(page), "focuses correct year").toHaveAttribute("data-value", "2017");
  });

  test("should navigate ahead three years when pressing down", async ({ page }) => {
    await page.keyboard.press("ArrowDown");

    await expect(focusedYear(page), "focuses correct year").toHaveAttribute("data-value", "2023");
  });

  test("should navigate back one year when pressing left", async ({ page }) => {
    await page.keyboard.press("ArrowLeft");

    await expect(focusedYear(page), "focuses correct year").toHaveAttribute("data-value", "2019");
  });

  test("should navigate ahead one year when pressing right", async ({ page }) => {
    await page.keyboard.press("ArrowRight");

    await expect(focusedYear(page), "focuses correct year").toHaveAttribute("data-value", "2021");
  });

  test("should navigate to the beginning of the year row when pressing home", async ({ page }) => {
    await page.keyboard.press("Home");

    await expect(focusedYear(page), "focuses correct year").toHaveAttribute("data-value", "2019");
  });

  test("should navigate to the end of the year row when pressing end", async ({ page }) => {
    await page.keyboard.press("End");

    await expect(focusedYear(page), "focuses correct year").toHaveAttribute("data-value", "2021");
  });

  test("should navigate back 12 years when pressing page up", async ({ page }) => {
    await page.keyboard.press("PageUp");

    await expect(focusedYear(page), "focuses correct year").toHaveAttribute("data-value", "2008");
  });

  test("should navigate forward 12 years when pressing page down", async ({ page }) => {
    await page.keyboard.press("PageDown");

    await expect(focusedYear(page), "focuses correct year").toHaveAttribute("data-value", "2032");
  });
});
