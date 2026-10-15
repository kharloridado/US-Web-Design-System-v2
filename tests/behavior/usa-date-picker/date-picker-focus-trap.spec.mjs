// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-focus-trap.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker.template.html
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.
// EVENTS.keydownTab() / keydownShiftTab() become real Tab / Shift+Tab presses on
// the focused element. USWDS doesn't pin "today" here and the cases don't depend
// on it; the clock is pinned anyway so the calendar shown is always the same.

import { test, expect } from "../harness/test.mjs";

const button = (page) => page.locator(".usa-date-picker .usa-date-picker__button");
const focused = (page) => page.locator(":focus");

test.describe("date picker component focus trap initialized at document.body", () => {
  test.beforeEach(async ({ page, fixture }) => {
    await page.clock.setFixedTime(new Date(2026, 9, 15, 12, 0, 0));
    await fixture.open("usa-date-picker/date-picker.template");
  });

  test("should move focus to the first item when pressing tab form last item", async ({ page }) => {
    await button(page).click();
    await expect(focused(page), "focuses correct item").toContainClass("usa-date-picker__calendar__date--focused");

    await page.keyboard.press("Tab");

    await expect(focused(page), "focuses correct item").toContainClass("usa-date-picker__calendar__previous-year");
  });

  test("should move focus to the last item when pressing shift+tab form first item", async ({ page }) => {
    await button(page).click();
    await page.keyboard.press("Tab");
    await expect(focused(page), "focuses correct item").toContainClass("usa-date-picker__calendar__previous-year");

    await page.keyboard.press("Shift+Tab");

    await expect(focused(page), "focuses correct item").toContainClass("usa-date-picker__calendar__date--focused");
  });
});
