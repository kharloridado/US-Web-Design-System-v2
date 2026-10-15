// Port of @uswds/uswds packages/usa-combo-box/src/test/combo-box-disabled.spec.js
// Fixture: packages/usa-combo-box/src/test/combo-box-disabled.template.html
//
// USWDS runs each case twice, initializing at document.body and at the combo box.
// On a page the behavior starts at document.body, so each case runs once.
// Clicks on the disabled controls use { force: true }: Playwright otherwise
// waits for them to become enabled. That is the person clicking a disabled control.

import { test, expect } from "../harness/test.mjs";
import { clearButton, comboBox, expectListHidden, expectListShown, input, select, toggle } from "./combo-box.helpers.mjs";

test.describe("Combo box initialized at document.body", () => {
  test.describe("combo box component - disabled enhancement", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-combo-box/combo-box-disabled.template");
    });

    test("enhances a select element into a combo box component", async ({ page }) => {
      await expect(input(page), "adds an input element").toHaveCount(1);
      await expect(input(page), "transfers disabled attribute to combo box").toBeDisabled();
      await expect(select(page), "removes disabled attribute from select").toBeEnabled();
    });

    test("should not show the list when clicking the disabled input", async ({ page }) => {
      await input(page).click({ force: true });

      await expectListHidden(page);
    });

    test("should not show the list when clicking the disabled button", async ({ page }) => {
      await toggle(page).click({ force: true });

      await expectListHidden(page);
    });

    test("should show the list when clicking the input once the component has been enabled", async ({ page }) => {
      // USWDS calls ComboBox.enable(comboBox). There is no user action for that;
      // the page re-enables the control the way enable() does: input, toggle and
      // clear buttons lose `disabled`, and the clear button is unhidden.
      await expect(input(page)).toBeDisabled();
      await comboBox(page).evaluate((el) => {
        const clear = el.querySelector(".usa-combo-box__clear-input");
        clear.hidden = false;
        clear.disabled = false;
        el.querySelector(".usa-combo-box__toggle-list").disabled = false;
        el.querySelector(".usa-combo-box__input").disabled = false;
      });
      await expect(input(page)).toBeEnabled();
      await expect(toggle(page)).toBeEnabled();
      await expect(clearButton(page)).toBeEnabled();

      await input(page).click();

      await expectListShown(page);
    });
  });
});
