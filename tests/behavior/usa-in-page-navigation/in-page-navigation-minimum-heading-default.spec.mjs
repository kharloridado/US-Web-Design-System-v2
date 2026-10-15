// Port of @uswds/uswds packages/usa-in-page-navigation/src/test/in-page-navigation-minimum-heading-default.spec.js
// Fixture: packages/usa-in-page-navigation/src/test/in-page-navigation-minimum-heading-default.template.html
//
// USWDS runs the case twice, initializing at document.body and at the nav
// (behavior.off then behavior.on). On a page the behavior starts once at
// document.body.

import { test, expect } from "../harness/test.mjs";

test.describe("Minimum heading count tests (document.body)", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-in-page-navigation/in-page-navigation-minimum-heading-default.template");
  });

  test("does not render the in-page navigation when default heading count of 2 has not been reached", async ({ page }) => {
    const theNav = page.locator(".usa-in-page-nav");
    expect(
      await theNav.evaluate((el) => el.hasChildNodes()),
      "In-page navigation should not have child nodes when the default minimum heading count of 2 has been reached",
    ).toBe(false);
    await expect(page.locator(".usa-in-page-nav__nav")).toHaveCount(0);
  });
});
