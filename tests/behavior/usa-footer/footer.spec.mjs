// Port of @uswds/uswds packages/usa-footer/src/test/footer.spec.js
// Fixture: packages/usa-footer/src/test/template.html
//
// USWDS runs each case twice, initializing at document.body and at the footer.
// On a page the behavior starts at document.body, so each case runs once.
// USWDS starts at innerWidth 1024 and uses mq-polyfill + resizeTo(width); here
// the viewport starts at 1024px and page.setViewportSize resizes it, which
// fires the real matchMedia change. Hidden/visible is checked exactly as
// USWDS does: computed `display` is (or isn't) "none".

import { test, expect } from "../harness/test.mjs";

const PRIMARY_CONTENT_SELECTOR = ".usa-footer--big .usa-footer__primary-content--collapsible .usa-list";
const BUTTON_SELECTOR = ".usa-footer__primary-link";

// USWDS's footer breakpoint (behavior.HIDE_MAX_WIDTH): below it the footer collapses.
const HIDE_MAX_WIDTH = 480;

const lists = (page) => page.locator(PRIMARY_CONTENT_SELECTOR);
const buttons = (page) => page.locator(BUTTON_SELECTOR);

async function resizeTo(page, width) {
  await page.setViewportSize({ width, height: 768 });
  await page.waitForFunction((w) => window.innerWidth === w, width);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function assertHidden(locator, hidden) {
  await expect
    .poll(() => locator.evaluate((el) => window.getComputedStyle(el).display === "none"), {
      message: `display none should be ${hidden}`,
    })
    .toBe(hidden);
}

const tagName = (locator) => locator.evaluate((el) => el.tagName);

test.describe("big footer accordion initialized at document.body", () => {
  test.beforeEach(async ({ page, fixture }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await fixture.open("usa-footer/template");
  });

  // USWDS checks that the behavior exports a numeric HIDE_MAX_WIDTH. On a page
  // that breakpoint is what you can see: the footer collapses just below 480px
  // and stays expanded at 480px.
  test("defines a max width", async ({ page }) => {
    await resizeTo(page, HIDE_MAX_WIDTH - 1);
    await assertHidden(lists(page).nth(0), true);
    await expect(buttons(page).nth(0)).toHaveJSProperty("tagName", "BUTTON");
    await resizeTo(page, HIDE_MAX_WIDTH);
    await assertHidden(lists(page).nth(0), false);
    await expect(buttons(page).nth(0)).toHaveJSProperty("tagName", "H4");
  });

  test("collapses at small screens", async ({ page }) => {
    await resizeTo(page, 400);
    await assertHidden(lists(page).nth(0), true);
  });

  test("collapses then expands again on larger screens", async ({ page }) => {
    await resizeTo(page, 400);
    await assertHidden(lists(page).nth(0), true);
    await resizeTo(page, 1024);
    await assertHidden(lists(page).nth(0), false);
  });

  test("opens panel when clicked", async ({ page }) => {
    await resizeTo(page, 400);
    await assertHidden(lists(page).nth(0), true);
    await buttons(page).nth(0).click();
    await assertHidden(lists(page).nth(0), false);
  });

  test("does not open panels when clicked on larger screens", async ({ page }) => {
    await buttons(page).nth(0).click();
    await assertHidden(lists(page).nth(0), false);
  });

  test("closes panel on subsequent click", async ({ page }) => {
    await resizeTo(page, 800);
    await resizeTo(page, 400);
    await buttons(page).nth(0).click();
    await assertHidden(lists(page).nth(0), false);
    await buttons(page).nth(0).click();
    await assertHidden(lists(page).nth(0), true);
  });

  test("closes other panels on small screens", async ({ page }) => {
    await resizeTo(page, 800);
    await resizeTo(page, 400);
    await buttons(page).nth(0).click();
    await assertHidden(lists(page).nth(0), false);
    await assertHidden(lists(page).nth(1), true);
    await assertHidden(lists(page).nth(2), true);
    await buttons(page).nth(1).click();
    await assertHidden(lists(page).nth(0), true);
    await assertHidden(lists(page).nth(1), false);
    await assertHidden(lists(page).nth(2), true);
  });

  test("does not close other panels on larger screens", async ({ page }) => {
    await buttons(page).nth(0).click();
    await assertHidden(lists(page).nth(0), false);
    await assertHidden(lists(page).nth(1), false);
    await assertHidden(lists(page).nth(2), false);
  });

  test("preserves html tag on resize", async ({ page }) => {
    const initialHtmlTag = await tagName(buttons(page).nth(0));
    expect(initialHtmlTag).toBe("H4");
    await expect(buttons(page).nth(0)).not.toHaveAttribute("data-tag");
    await resizeTo(page, 400);
    await expect(buttons(page).nth(0)).toHaveJSProperty("tagName", "BUTTON");
    await expect(buttons(page).nth(0)).toHaveAttribute("data-tag", initialHtmlTag);
    await resizeTo(page, 1024);
    await expect(buttons(page).nth(0)).toHaveJSProperty("tagName", initialHtmlTag);
    await expect(buttons(page).nth(0)).not.toHaveAttribute("data-tag");
  });

  test("falls back to h4 when data-tag is not in the allow-list", async ({ page }) => {
    await resizeTo(page, 400);
    await expect(buttons(page).nth(0)).toHaveJSProperty("tagName", "BUTTON");

    // USWDS sets these after initializing, like a page that tampers with the markup.
    await page.evaluate((selector) => {
      const b = document.querySelectorAll(selector);
      b[0].setAttribute("data-tag", "script");
      b[1].setAttribute("data-tag", "<img src=x onerror=alert(1)>");
      b[2].setAttribute("data-tag", "h7");
    }, BUTTON_SELECTOR);

    await resizeTo(page, 1024);
    await expect(buttons(page).nth(0)).toHaveJSProperty("tagName", "H4");
    await expect(buttons(page).nth(1)).toHaveJSProperty("tagName", "H4");
    await expect(buttons(page).nth(2)).toHaveJSProperty("tagName", "H4");
  });
});
