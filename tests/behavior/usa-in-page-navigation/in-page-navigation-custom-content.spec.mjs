// Port of @uswds/uswds packages/usa-in-page-navigation/src/test/in-page-navigation-custom-content.spec.js
// Fixture: packages/usa-in-page-navigation/src/test/in-page-navigation-custom-content.template.html
//
// USWDS runs each case twice, initializing at document.body and at the nav.
// On a page the behavior starts at document.body, so each case runs once.
// USWDS stubs IntersectionObserver for jsdom; the browser's real one is used here.

import { test, expect } from "../harness/test.mjs";

const PRIMARY_CONTENT_SELECTOR = ".usa-in-page-nav-container .usa-in-page-nav .usa-in-page-nav__list";

const navList = (page) => page.locator(PRIMARY_CONTENT_SELECTOR);
const navListLinks = (page) => navList(page).locator("a");
const customContentHeaderList = async (page) => {
  const customContentSelector = await page.locator(".usa-in-page-nav").getAttribute("data-main-content-selector");
  return page.locator(customContentSelector).locator("h2, h3");
};

test.describe("in-page navigation pulls in headers from the custom content region at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-in-page-navigation/in-page-navigation-custom-content.template");
  });

  test("pulls the headers from the designated custom content region into the nav list", async ({ page }) => {
    await expect(navList(page)).toHaveCount(1);
    const headers = await (await customContentHeaderList(page)).count();
    expect(headers).toBeGreaterThan(0);
    await expect(navListLinks(page)).toHaveCount(headers);
  });

  test("creates a link in the nav list for the header that is inside the custom content region", async ({ page }) => {
    await expect(navList(page)).toHaveCount(1);
    await expect(navList(page).locator('a[href*="#header-in-content-region"]')).toHaveCount(1);
  });

  test("does not create a link in the nav list for the header that is outside the custom content region", async ({ page }) => {
    // USWDS reads the nav list's links, so the list must have been built.
    await expect(navList(page)).toHaveCount(1);
    await expect(navList(page).locator('a[href*="#header-not-in-content-region"]')).toHaveCount(0);
  });
});
