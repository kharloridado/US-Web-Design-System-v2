// Port of @uswds/uswds packages/usa-combo-box/src/test/combo-box-filter.spec.js
// Fixture: packages/usa-combo-box/src/test/combo-box-filter.template.html
//
// USWDS runs the case twice, initializing at document.body and at the combo box.
// On a page the behavior starts at document.body, so it runs once.
// The fixture's data-filter="{{query}}.*" keeps options that start with the query.

import { test, expect } from "../harness/test.mjs";
import { expectListShown, input, listItems } from "./combo-box.helpers.mjs";

test.describe("Combo box initialized at document.body", () => {
  test.describe("combo box component with filter attribute", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-combo-box/combo-box-filter.template");
    });

    test("should display and filter the option list after a character is typed", async ({ page }) => {
      await input(page).fill("st");

      await expectListShown(page);
      await expect(listItems(page), "should filter the item by the string starting with the option").toHaveCount(2);
    });
  });
});
