// Port of @uswds/uswds packages/usa-in-page-navigation/src/test/in-page-navigation-custom-heading.spec.js
// Fixture: packages/usa-in-page-navigation/src/test/in-page-navigation-custom-heading.template.html
//
// USWDS runs each case twice, initializing at document.body and at the nav.
// On a page the behavior starts at document.body, so each case runs once.
// USWDS stubs IntersectionObserver for jsdom; the browser's real one is used here.

import { test, expect } from "../harness/test.mjs";

const PRIMARY_CONTENT_SELECTOR = ".usa-in-page-nav-container .usa-in-page-nav .usa-in-page-nav__list";

const navList = (page) => page.locator(PRIMARY_CONTENT_SELECTOR);
const dataHeadingSelector = (page) => page.locator(".usa-in-page-nav").getAttribute("data-heading-elements");

test.describe("in-page navigation pulls from custom header list in document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-in-page-navigation/in-page-navigation-custom-heading.template");
  });

  test("creates links in the nav list for the heading level listed in data-heading-elements", async ({ page }) => {
    await expect(navList(page)).toHaveCount(1);
    const selectedHeadingList = await page.locator("main").locator(await dataHeadingSelector(page)).count();
    expect(selectedHeadingList).toBeGreaterThan(0);
    await expect(navList(page).locator("a")).toHaveCount(selectedHeadingList);
  });

  test("creates a link in the nav list specifically for the designated header", async ({ page }) => {
    await expect(navList(page)).toHaveCount(1);
    const heading = await dataHeadingSelector(page);
    await expect(navList(page).locator(`a[href*="#${heading}-heading"]`)).toHaveCount(1);
  });
});
