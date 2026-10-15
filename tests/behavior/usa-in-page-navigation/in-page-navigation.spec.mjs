// Port of @uswds/uswds packages/usa-in-page-navigation/src/test/in-page-navigation.spec.js
// Fixture: packages/usa-in-page-navigation/src/test/template.html
//
// USWDS runs each case twice, initializing at document.body and at the nav.
// On a page the behavior starts at document.body, so each case runs once.
//
// jsdom has no layout, so USWDS stubs HTMLElement.offsetTop (heading index x 100),
// stubs window.scroll and fakes window.innerWidth. In a real browser:
//   - positions are real, and the test asserts where the page actually scrolled:
//     the clicked section's anchor, minus the nav's data-scroll-offset (20px),
//     which is what USWDS's stubbed numbers encode (100 - 20 = 80, 900 - 20 = 880);
//   - a tall spacer is appended after the fixture, before the behavior starts, so
//     the page is tall enough to scroll every heading to the top (in jsdom the
//     stubbed window.scroll could "scroll" anywhere);
//   - resizeTo(width) becomes page.setViewportSize.
// A dispatched Enter keydown becomes a real Enter key press on the focused link.

import { test, expect } from "../harness/test.mjs";

const HIDE_MAX_WIDTH = 639;
const SCROLL_OFFSET = 20; // data-scroll-offset on the fixture's nav
const PRIMARY_CONTENT_SELECTOR = ".usa-in-page-nav-container .usa-in-page-nav .usa-in-page-nav__list";

const theNav = (page) => page.locator(".usa-in-page-nav");
const theList = (page) => page.locator(PRIMARY_CONTENT_SELECTOR);

const display = (locator) => locator.evaluate((el) => window.getComputedStyle(el).display);

const addSpacer = (page) =>
  page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.setAttribute("data-test-spacer", "");
    spacer.style.height = "300vh";
    document.body.appendChild(spacer);
  });

// Distance between where the page is scrolled and where the section anchor
// minus the scroll offset sits in the document.
const scrollError = (page, id) =>
  page.evaluate(
    ([anchorId, offset]) => {
      const anchor = document.getElementById(anchorId);
      const target = anchor.getBoundingClientRect().top + window.scrollY - offset;
      return Math.abs(window.scrollY - target);
    },
    [id, SCROLL_OFFSET],
  );

const settle = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 500)));
      }),
  );

test.describe("in-page navigation initialized at document.body", () => {
  test.beforeEach(async ({ fixture }, testInfo) => {
    // USWDS's "with initial hash URL" context sets window.location.hash before
    // initializing the behavior.
    const initialHash = testInfo.titlePath.includes("with initial hash URL") ? "#section-1" : "";
    await fixture.open("usa-in-page-navigation/template", {
      before: async (page) => {
        await addSpacer(page);
        if (initialHash) await page.evaluate((hash) => (window.location.hash = hash), initialHash);
      },
    });
  });

  // USWDS asserts the spec's own HIDE_MAX_WIDTH constant is a number. On a page
  // that constant is the widest viewport at which the nav is hidden: hidden at
  // 639px, shown at 640px.
  test("defines a max width", async ({ page }) => {
    expect(typeof HIDE_MAX_WIDTH).toBe("number");
    await expect(theList(page)).toHaveCount(1);
    await page.setViewportSize({ width: HIDE_MAX_WIDTH, height: 768 });
    expect(await display(theNav(page))).toBe("none");
    await page.setViewportSize({ width: HIDE_MAX_WIDTH + 1, height: 768 });
    expect(await display(theNav(page))).not.toBe("none");
    await expect(theList(page)).toBeVisible();
  });

  test("hides at small screens", async ({ page }) => {
    // The nav must have been built for "hidden" to mean anything.
    await expect(theList(page)).toHaveCount(1);
    await page.setViewportSize({ width: 400, height: 768 });
    expect(await display(theNav(page))).toBe("none");
    await expect(theNav(page)).toBeHidden();
  });

  test("show on larger screens", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 768 });
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(theList(page)).toHaveCount(1);
    expect(await display(theList(page))).not.toBe("none");
    await expect(theList(page)).toBeVisible();
  });

  test("assigns id to section headings", async ({ page }) => {
    // Tests that new anchor children are created in the fixture template in
    // the expected locations.
    const selectors = [
      "h2 > .usa-anchor#section-1",
      "h2 ~ h3 > .usa-anchor#section-1-1",
      "h2 ~ h3 ~ h3 > .usa-anchor#section-1-2-2",
      "h2 ~ h3 ~ h3 ~ h3 > .usa-anchor#section-1-3",
      "h2 ~ h3 ~ h3 ~ h3 ~ h3 > .usa-anchor[id='1-4-section-1-4']",
    ];
    for (const selector of selectors) {
      await expect(page.locator(selector), selector).toHaveCount(1);
    }
  });

  test("scrolls to section", async ({ page }) => {
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await theNav(page).locator("a[href='#section-1']").click();
    await expect.poll(() => scrollError(page, "section-1")).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test("updates url when scrolling to section", async ({ page }) => {
    // Activate by click
    await theNav(page).locator("a[href='#section-1']").click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#section-1");

    // Activate by Enter press
    const secondLink = theNav(page).locator("a[href='#section-1-1']");
    await secondLink.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#section-1-1");
  });

  test("does not scroll to section on initialization", async ({ page }) => {
    // Wait until the behavior has built the nav, then give a scroll time to start.
    await expect(theList(page)).toHaveCount(1);
    await settle(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("handles headings starting with a number", async ({ page }) => {
    await theNav(page).locator("a[href='#1-4-section-1-4']").click();
    await expect.poll(() => scrollError(page, "1-4-section-1-4")).toBeLessThanOrEqual(1);
    // Further down the page than the first section (USWDS: 880 vs 80).
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(
      await page.evaluate(() => document.getElementById("section-1").getBoundingClientRect().top + window.scrollY),
    );
  });

  test.describe("with initial hash URL", () => {
    test("scrolls to section on initialization", async ({ page }) => {
      await expect(theList(page)).toHaveCount(1);
      await expect.poll(() => scrollError(page, "section-1")).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    });
  });
});
