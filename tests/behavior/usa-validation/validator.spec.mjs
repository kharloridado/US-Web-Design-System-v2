// Port of @uswds/uswds packages/usa-validation/src/test/validator.spec.js
// Fixture: packages/usa-validation/src/test/template.html
//
// USWDS runs each case twice, initializing at document.body and at the input.
// On a page the behavior starts at document.body, so each case runs once.
// USWDS's keyup() helper sets the value and fires a change event; a person
// types the value (fill) and leaves the field (blur), which fires input and
// change.
//
// The spec collects the checklist items with `root.querySelectorAll(...)`
// where `root` is the <input>, which has no children, so its loops run over
// nothing in jsdom. The port checks the items of the input's checklist
// (data-validation-element="validation_list"), which is what the cases name.
// For "creates a hidden span element in each list item", USWDS 3.14.0 does not
// create per-item spans (the spec's `[data-checklist-label]` / `queryElement`
// would never match or run); it gives each item its hidden status readout as
// an aria-label ("<item text> status incomplete "), which is what this port
// checks.

import { test, expect } from "../harness/test.mjs";

const CHECKED_CLASS = "usa-checklist__item--checked";

const validated = (page) => page.locator("[data-validation-element]");
const validators = (page) => page.locator("#validation_list [data-validator]");

const validatorStates = (page) =>
  validators(page).evaluateAll((items, checkedClass) =>
    items.map((item) => ({
      validator: item.getAttribute("data-validator"),
      checked: item.classList.contains(checkedClass),
    })),
  CHECKED_CLASS);

const typeAndLeave = async (page, value) => {
  await validated(page).fill(value);
  await validated(page).blur();
};

test.describe("validator component initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-validation/template");
  });

  test.describe("initialization", () => {
    test("creates a hidden span element in each list item", async ({ page }) => {
      await expect(validators(page)).toHaveCount(3);
      const labels = await validators(page).evaluateAll((items) =>
        items.map((item) => ({ text: item.textContent, ariaLabel: item.getAttribute("aria-label") })),
      );
      for (const { text, ariaLabel } of labels) expect(ariaLabel).toBe(`${text} status incomplete `);
    });
  });

  test.describe("validation state", () => {
    test(`adds .${CHECKED_CLASS} for all successful validations`, async ({ page }) => {
      await typeAndLeave(page, "GreatPassword1");

      const states = await validatorStates(page);
      expect(states).toHaveLength(3);
      for (const { checked } of states) expect(checked).toBe(true);
    });

    test(`removes .${CHECKED_CLASS} for failed validations`, async ({ page }) => {
      await typeAndLeave(page, "GreatPassword");

      const states = await validatorStates(page);
      expect(states).toHaveLength(3);
      for (const { validator, checked } of states) {
        if (validator === "numerical") {
          expect(checked).toBe(false);
        } else {
          expect(checked).toBe(true);
        }
      }
    });
  });
});
