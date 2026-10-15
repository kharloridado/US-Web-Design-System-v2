// Port of @uswds/uswds packages/usa-combo-box/src/test/combo-box-default-value.spec.js
// Fixture: packages/usa-combo-box/src/test/combo-box-default-value.template.html
//
// USWDS runs the case twice, initializing at document.body and at the combo box.
// On a page the behavior starts at document.body, so it runs once.

import { test, expect } from "../harness/test.mjs";
import { input, select } from "./combo-box.helpers.mjs";

test.describe("Combo box initialized at document.body", () => {
  test.describe("combo box component with default value attribute", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-combo-box/combo-box-default-value.template");
    });

    test("enhances a select element into a combo box component", async ({ page }) => {
      await expect(input(page), "adds an input element").toHaveCount(1);
      await expect(input(page), "updates the default value of the input").toHaveValue("Blackberry");
      await expect(select(page), "updates the default value of the select").toHaveValue("blackberry");
    });
  });
});
