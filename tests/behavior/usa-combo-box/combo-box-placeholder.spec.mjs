// Port of @uswds/uswds packages/usa-combo-box/src/test/combo-box-placeholder.spec.js
// Fixture: packages/usa-combo-box/src/test/combo-box-placeholder.template.html
//
// USWDS runs the case twice, initializing at document.body and at the combo box.
// On a page the behavior starts at document.body, so it runs once.

import { test, expect } from "../harness/test.mjs";
import { input } from "./combo-box.helpers.mjs";

test.describe("Combo box initialized at document.body", () => {
  test.describe("combo box component with placeholder attribute", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-combo-box/combo-box-placeholder.template");
    });

    test("enhances a select element into a combo box component", async ({ page }) => {
      await expect(input(page), "adds an input element").toHaveCount(1);
      await expect(input(page), "transfers placeholder attribute from combo box").toHaveJSProperty("placeholder", "Select one...");
    });
  });
});
