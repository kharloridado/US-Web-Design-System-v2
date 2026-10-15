// Port of @uswds/uswds packages/usa-combo-box/src/test/combo-box-disable-filtering.spec.js
// Fixture: packages/usa-combo-box/src/test/combo-box-disable-filtering.template.html
//
// USWDS runs the case twice, initializing at document.body and at the combo box.
// On a page the behavior starts at document.body, so it runs once.

import { test, expect } from "../harness/test.mjs";
import { expectListShown, focusedOption, input, listItems, optionCountWithoutPlaceholder } from "./combo-box.helpers.mjs";

test.describe("Combo box initialized at document.body", () => {
  test.describe("combo box component with disable filtering attribute", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-combo-box/combo-box-disable-filtering.template");
    });

    test("should display the full list and focus the first found item", async ({ page }) => {
      await input(page).fill("oo");

      await expectListShown(page);
      await expect(listItems(page)).toHaveCount(await optionCountWithoutPlaceholder(page));
      await expect(focusedOption(page)).toHaveCount(1);
      await expect(focusedOption(page), "should be the first found item").toHaveJSProperty("textContent", "Blood orange");
    });
  });
});
