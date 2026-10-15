// Port of @uswds/uswds packages/usa-validation/src/test/validator-textarea.spec.js
// Fixture: packages/usa-validation/src/test/template-textarea.html
//
// USWDS runs each case twice, initializing at document.body and at the
// textarea. On a page the behavior starts at document.body, so each case runs
// once. USWDS's keyup() helper sets the value and fires a change event; a
// person types the value (fill) and leaves the field (blur), which fires input
// and change.
//
// "removes .usa-checklist__item--checked for failed validations": the spec
// validates "" on a fresh textarea, where nothing is checked yet. The port
// first types a valid comment (so the item is checked) and then clears the
// field, so the class is actually removed; the final assertions are the
// spec's.

import { test, expect } from "../harness/test.mjs";

const CHECKED_CLASS = "usa-checklist__item--checked";

const validated = (page) => page.locator("[data-validation-element]");
const validators = (page) => page.locator("[data-validator]");

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
    await fixture.open("usa-validation/template-textarea");
  });

  test.describe("initialization", () => {
    test("creates a hidden span element for accessibility status summary readout", async ({ page }) => {
      const summary = page.locator("[data-validation-status]");
      await expect(summary).toHaveCount(1);
      await expect(summary).toHaveClass(/(^|\s)usa-sr-only(\s|$)/);
    });
  });

  test.describe("validation state", () => {
    test(`adds .${CHECKED_CLASS} for all successful validations`, async ({ page }) => {
      await typeAndLeave(page, "This is one great comment!");

      const states = await validatorStates(page);
      expect(states).toHaveLength(1);
      for (const { checked } of states) expect(checked).toBe(true);
    });

    test(`removes .${CHECKED_CLASS} for failed validations`, async ({ page }) => {
      await typeAndLeave(page, "This is one great comment!");
      expect((await validatorStates(page)).every(({ checked }) => checked)).toBe(true);

      await typeAndLeave(page, "");

      const states = await validatorStates(page);
      expect(states).toHaveLength(1);
      for (const { validator, checked } of states) {
        if (validator === "empty") {
          expect(checked).toBe(false);
        } else {
          expect(checked).toBe(true);
        }
      }
    });
  });
});
