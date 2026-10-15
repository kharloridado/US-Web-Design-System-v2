// Port of @uswds/uswds packages/usa-file-input/src/test/file-input-disabled.spec.js
// Fixture: packages/usa-file-input/src/test/file-input-disabled.template.html
//
// USWDS runs the case twice, initializing at document.body and at the file input.
// On a page the behavior starts at document.body, so the case runs once.

import { test, expect } from "../harness/test.mjs";

test.describe("File input", () => {
  test.describe("file input is disabled", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-file-input/file-input-disabled.template");
    });

    test("has disabled styling", async ({ page }) => {
      const expectedClass = "usa-file-input--disabled";
      const component = page.locator(".usa-file-input").first();
      expect((await component.getAttribute("class"))?.includes(expectedClass)).toBe(true);
    });
  });
});
