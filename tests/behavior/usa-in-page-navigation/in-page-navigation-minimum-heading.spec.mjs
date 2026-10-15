// Port of @uswds/uswds packages/usa-in-page-navigation/src/test/in-page-navigation-minimum-heading.spec.js
// Fixture: packages/usa-in-page-navigation/src/test/in-page-navigation-minimum-heading.template.html
//
// USWDS runs each case twice, initializing at document.body and at the nav
// (behavior.off then behavior.on). On a page the behavior starts once at
// document.body. Where USWDS sets data-minimum-heading-count before
// initializing, the test sets it in fixture.open's `before`.

import { test, expect } from "../harness/test.mjs";

const FIXTURE = "usa-in-page-navigation/in-page-navigation-minimum-heading.template";
const theNav = (page) => page.locator(".usa-in-page-nav");
const hasChildNodes = (page) => theNav(page).evaluate((el) => el.hasChildNodes());
const withMinimum = (count) => async (page) => {
  await page.locator(".usa-in-page-nav").evaluate((el, value) => el.setAttribute("data-minimum-heading-count", value), count);
};

test.describe("Minimum heading count tests (document.body)", () => {
  test("does render the in-page navigation when set minimum heading count of 1 has been reached", async ({ page, fixture }) => {
    await fixture.open(FIXTURE, { before: withMinimum("1") });
    expect(
      await hasChildNodes(page),
      "In-page navigation should have child nodes when the custom set minimum heading count of 1 has been reached",
    ).toBe(true);
    await expect(page.locator(".usa-in-page-nav__nav")).toHaveCount(1);
  });

  test("does not render the in-page navigation when custom set minimum heading count of 4 has not been reached", async ({ page, fixture }) => {
    await fixture.open(FIXTURE, { before: withMinimum("4") });
    expect(
      await hasChildNodes(page),
      "In-page navigation should not have child nodes when the custom set heading count is lower than the minimum of 4",
    ).toBe(false);
    await expect(page.locator(".usa-in-page-nav__nav")).toHaveCount(0);
  });

  test("does render the in-page navigation when default heading count of 2 has been reached", async ({ page, fixture }) => {
    await fixture.open(FIXTURE);
    expect(
      await hasChildNodes(page),
      "In-page navigation should have child nodes when the default minimum heading count of 2 has not been reached",
    ).toBe(true);
    await expect(page.locator(".usa-in-page-nav__nav")).toHaveCount(1);
  });
});
