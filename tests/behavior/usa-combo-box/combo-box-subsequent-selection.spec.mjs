// Port of @uswds/uswds packages/usa-combo-box/src/test/combo-box-subsequent-selection.spec.js
// Fixture: packages/usa-combo-box/src/test/combo-box-subsequent-selection.template.html
//
// USWDS runs each case twice, initializing at document.body and at the combo box.
// On a page the behavior starts at document.body, so each case runs once.
// The fixture's data-default-value="blackberry" makes Blackberry the selection at load.

import { test, expect } from "../harness/test.mjs";
import {
  clearButton,
  comboBox,
  expectListShown,
  focusedOption,
  input,
  listItems,
  optionCountWithoutPlaceholder,
  select,
} from "./combo-box.helpers.mjs";

const PRISTINE = /(^|\s)usa-combo-box--pristine(\s|$)/;

test.describe("Combo box initialized at document.body", () => {
  test.describe("combo box component - subsequent selection", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-combo-box/combo-box-subsequent-selection.template");
    });

    test("should display the full list and focus the selected item when the input is pristine (after fresh selection)", async ({ page }) => {
      await expect(comboBox(page), "pristine class added after selection").toHaveClass(PRISTINE);
      await input(page).click();

      await expectListShown(page);
      await expect(listItems(page)).toHaveCount(await optionCountWithoutPlaceholder(page));
      await expect(focusedOption(page), "should style the focused item in the list").toHaveCount(1);
      await expect(focusedOption(page), "should be the previously selected item").toHaveJSProperty("textContent", "Blackberry");
    });

    test("should display the filtered list when the input is dirty (characters inputted)", async ({ page }) => {
      await input(page).click();
      await expect(listItems(page)).toHaveCount(await optionCountWithoutPlaceholder(page));

      await input(page).fill("COBOL");

      await expect(comboBox(page), "pristine class is removed after input").not.toHaveClass(PRISTINE);
      await expect(listItems(page), "should only show the filtered items").toHaveCount(1);
    });

    test("should show a clear button when the input has a selected value present", async ({ page }) => {
      await expect(comboBox(page), "pristine class added after selection").toHaveClass(PRISTINE);
      await expect(clearButton(page), "clear input button is present").toHaveCount(1);
      await expect(clearButton(page), "clear input button is shown").toBeVisible();
    });

    test("should clear the input when the clear button is clicked", async ({ page }) => {
      await expect(select(page)).toHaveValue("blackberry");
      await expect(input(page)).toHaveValue("Blackberry");

      await clearButton(page).click();

      await expect(select(page), "should clear the value on the select").toHaveValue("");
      await expect(input(page), "should clear the value on the input").toHaveValue("");
      await expect(input(page), "should focus the input").toBeFocused();
    });

    test("should update the filter and begin filtering once a pristine input value is changed", async ({ page }) => {
      // USWDS sets input.value = "go" without an input event, then clicks and
      // presses Enter. A person can only type it: click, type "go", press Enter.
      // Either way Enter finds no exact match and restores the selection.
      await input(page).click();
      await input(page).fill("go");
      await page.keyboard.press("Enter");
      await expect(input(page), "should set that item to the input value").toHaveValue("Blackberry");
      await input(page).click();
      await expect(listItems(page)).toHaveCount(await optionCountWithoutPlaceholder(page));

      await input(page).fill("Fig");

      await expect(listItems(page), "should only show the filtered items").toHaveCount(1);
    });
  });
});
