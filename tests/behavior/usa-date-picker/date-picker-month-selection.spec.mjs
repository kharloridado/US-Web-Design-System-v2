// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-month-selection.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker.template.html
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.
//
// "Open month selection view": USWDS sets input.value = "6/20/2020" and clicks
// the toggle button, then the month selection button. The test types the date
// and clicks the same buttons. EVENTS.keydown* helpers become real key presses
// on the focused month (USWDS focuses it when the month picker opens).

import { test, expect } from "../harness/test.mjs";

const input = (page) => page.locator(".usa-date-picker__external-input");
const button = (page) => page.locator(".usa-date-picker__button");
const calendarEl = (page, query) => page.locator(`.usa-date-picker__calendar${query ? ` ${query}` : ""}`);
const focusedMonth = (page) => calendarEl(page, ".usa-date-picker__calendar__month--focused");

test.describe("date picker component month selection initialized at document.body", () => {
  test.beforeEach(async ({ page, fixture }) => {
    await fixture.open("usa-date-picker/date-picker.template");

    // Open month selection view
    await input(page).fill("6/20/2020");
    await button(page).click();
    await calendarEl(page, ".usa-date-picker__calendar__month-selection").click();
    await expect(calendarEl(page, ".usa-date-picker__calendar__month-picker")).toBeVisible();
  });

  test("should show month of June as focused", async ({ page }) => {
    await expect(focusedMonth(page), "focuses correct month").toHaveAttribute("data-label", "June");
  });

  test("should show month of June as selected", async ({ page }) => {
    await expect(calendarEl(page, ".usa-date-picker__calendar__month--selected"), "selects correct month").toHaveAttribute("data-label", "June");
  });

  test("should navigate back three months when pressing up", async ({ page }) => {
    await page.keyboard.press("ArrowUp");

    await expect(focusedMonth(page), "focuses correct month").toHaveAttribute("data-label", "March");
  });

  test("should navigate ahead three months when pressing down", async ({ page }) => {
    await page.keyboard.press("ArrowDown");

    await expect(focusedMonth(page), "focuses correct month").toHaveAttribute("data-label", "September");
  });

  test("should navigate back one month when pressing left", async ({ page }) => {
    await page.keyboard.press("ArrowLeft");

    await expect(focusedMonth(page), "focuses correct month").toHaveAttribute("data-label", "May");
  });

  test("should navigate ahead one month when pressing right", async ({ page }) => {
    await page.keyboard.press("ArrowRight");

    await expect(focusedMonth(page), "focuses correct month").toHaveAttribute("data-label", "July");
  });

  test("should navigate to the beginning of the month row when pressing home", async ({ page }) => {
    await page.keyboard.press("Home");

    await expect(focusedMonth(page), "focuses correct month").toHaveAttribute("data-label", "April");
  });

  test("should navigate to the end of the month row when pressing end", async ({ page }) => {
    await page.keyboard.press("End");

    await expect(focusedMonth(page), "focuses correct month").toHaveAttribute("data-label", "June");
  });

  test("should navigate to January when pressing page up", async ({ page }) => {
    await page.keyboard.press("PageUp");

    await expect(focusedMonth(page), "focuses correct month").toHaveAttribute("data-label", "January");
  });

  test("should navigate to December when pressing page down", async ({ page }) => {
    await page.keyboard.press("PageDown");

    await expect(focusedMonth(page), "focuses correct month").toHaveAttribute("data-label", "December");
  });
});
