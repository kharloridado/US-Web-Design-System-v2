// Port of @uswds/uswds packages/usa-time-picker/src/test/time-picker.spec.js
// Fixture: packages/usa-time-picker/src/test/time-picker.template.html
//
// USWDS runs each case twice, initializing at document.body and at the time picker.
// On a page the behaviors start at document.body, so each case runs once.
// The time picker becomes a combo box, so the combo box helpers apply
// (typing is fill(), keydowns are real key presses on the focused element).

import { test, expect } from "../harness/test.mjs";
import {
  activeElement,
  expectListHidden,
  expectListShown,
  input,
  list,
  select,
} from "../usa-combo-box/combo-box.helpers.mjs";

test.describe("time picker component initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-time-picker/time-picker.template");
  });

  test("enhances a select element into a combo box component", async ({ page }) => {
    await expect(input(page), "adds an input element").toHaveCount(1);
    await expect(select(page), "hides the select element from view").toHaveClass(/(^|\s)usa-sr-only(\s|$)/);
    await expect(list(page), "adds an list element").toHaveCount(1);
    await expectListHidden(page);
    await expect(select(page), "transfers id attribute to combo box").toHaveAttribute("id", "");
    await expect(input(page), "transfers id attribute to combo box").toHaveAttribute("id", "appointment-time");
    await expect(select(page), "transfers required attribute to combo box").not.toHaveAttribute("required");
    await expect(input(page), "transfers required attribute to combo box").toHaveAttribute("required", "");
    await expect(select(page), "transfers value attribute to combo box").toHaveValue("13:00");
    await expect(input(page), "transfers value attribute to combo box").toHaveValue("1:00pm");
    await expect(select(page), "should not transfer name attribute to combo box").toHaveAttribute("name", "appointment-time");
    await expect(input(page), "should not transfer name attribute to combo box").not.toHaveAttribute("name");
  });

  test("should focus the first item found in the list from the query when pressing down from the input", async ({ page }) => {
    await input(page).fill("4p");
    await expectListShown(page);

    await page.keyboard.press("ArrowDown");
    await expect(activeElement(page), "should focus the first found item in the list").toHaveJSProperty("textContent", "4:00pm");
  });

  test("should focus the first complete hour found in the list from the query when pressing down from the input", async ({ page }) => {
    await input(page).fill("1p");
    await expectListShown(page);

    await page.keyboard.press("ArrowDown");
    await expect(activeElement(page), "should focus the first complete hour in the list").toHaveJSProperty("textContent", "1:00pm");
  });
});
