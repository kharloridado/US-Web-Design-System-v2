// Port of @uswds/uswds packages/usa-nav/src/test/navigation.spec.js
// (it exercises the header navigation behavior, packages/usa-header/src/index.js)
// Fixture: packages/usa-nav/src/test/template.html
//
// jsdom has no layout, so USWDS can click the menu button, close button and
// links whatever the viewport. On a real page the mobile menu (menu button,
// close button, overlay) only exists below the 1024px desktop breakpoint, and
// the submenu links are only reachable once their dropdown is open. So:
//   - cases that open the mobile menu run at a mobile width (480px);
//   - cases about the desktop dropdowns run at the default 1024px width;
//   - where USWDS clicks `nav.querySelector("a")` (the first link of the first,
//     collapsed submenu), the test first opens that submenu, as a user must.
// USWDS's synthetic Escape keydown is a real Escape key press on the focused
// control. The resize cases stub the close button's width; here the viewport
// really changes, which is what makes the close button's width 0 (or not).

import { test, expect } from "../harness/test.mjs";

const MOBILE = { width: 480, height: 768 };
const DESKTOP = { width: 1024, height: 768 };

const header = (page) => page.locator(".usa-header");
const nav = (page) => page.locator(".usa-nav");
const navControl = (page) => page.locator(".usa-nav__link").first();
const overlay = (page) => page.locator(".usa-overlay");
const closeButton = (page) => page.locator(".usa-nav__close");
const menuButton = (page) => page.locator(".usa-menu-btn");
const accordionButton = (page) => nav(page).locator(".usa-accordion__button").first();
const navLink = (page) => nav(page).locator("a").first();

const isVisible = /(^|\s)is-visible(\s|$)/;

// The first nav link sits in the first submenu; open it so the link can be clicked.
async function openFirstSubmenu(page) {
  await accordionButton(page).click();
  await expect(accordionButton(page)).toHaveAttribute("aria-expanded", "true");
  await expect(navLink(page)).toBeVisible();
}

// Resolves once the browser has dispatched the resize for the new viewport.
async function settleResize(page, width) {
  await page.waitForFunction((w) => window.innerWidth === w, width);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test.describe("navigation toggle", () => {
  test.describe("at mobile widths", () => {
    test.beforeEach(async ({ page, fixture }) => {
      await page.setViewportSize(MOBILE);
      await fixture.open("usa-nav/template");
    });

    test("shows the nav when the menu button is clicked", async ({ page }) => {
      await menuButton(page).click();
      await expect(nav(page)).toHaveClass(isVisible);
      await expect(overlay(page)).toHaveClass(isVisible);
    });

    test("hides the nav when the close button is clicked", async ({ page }) => {
      await menuButton(page).click();
      await closeButton(page).click();
      await expect(nav(page)).not.toHaveClass(isVisible);
      await expect(overlay(page)).not.toHaveClass(isVisible);
    });

    test("hides the nav when the overlay is clicked", async ({ page }) => {
      await menuButton(page).click();
      // The open nav panel covers the right of the overlay; click its uncovered left edge.
      await overlay(page).click({ position: { x: 10, y: 400 } });
      await expect(nav(page)).not.toHaveClass(isVisible);
      await expect(overlay(page)).not.toHaveClass(isVisible);
    });

    test("hides the nav when a nav link is clicked", async ({ page }) => {
      await menuButton(page).click();
      await expect(nav(page)).toHaveClass(isVisible);
      await openFirstSubmenu(page);
      await navLink(page).click();
      await expect(nav(page)).not.toHaveClass(isVisible);
    });

    test("focuses the close button when the menu button is clicked", async ({ page }) => {
      await menuButton(page).click();
      await expect(closeButton(page)).toBeFocused();
    });

    test("focuses the menu button when the close button is clicked", async ({ page }) => {
      await menuButton(page).click();
      await closeButton(page).click();
      await expect(menuButton(page)).toBeFocused();
    });

    test("makes all other page content invisible to screen readers", async ({ page }) => {
      await menuButton(page).click();
      await expect(nav(page)).toHaveClass(isVisible);
      const activeContent = page.locator("body > :not([aria-hidden])");
      await expect(activeContent).toHaveCount(1);
      expect(await activeContent.evaluate((el) => el === document.querySelector(".usa-header"))).toBe(true);
      await expect(header(page)).not.toHaveAttribute("aria-hidden");
    });

    test("collapses nav if needed on window resize", async ({ page }) => {
      await menuButton(page).click();
      await expect(nav(page)).toHaveClass(isVisible);
      // Widening to desktop hides the close button (its width becomes 0).
      await page.setViewportSize(DESKTOP);
      await settleResize(page, DESKTOP.width);
      expect(await closeButton(page).evaluate((el) => el.getBoundingClientRect().width)).toBe(0);
      await expect(nav(page)).not.toHaveClass(isVisible);
    });

    test("does not collapse nav if not needed on window resize", async ({ page }) => {
      await menuButton(page).click();
      await expect(nav(page)).toHaveClass(isVisible);
      // Still a mobile width: the close button stays visible.
      await page.setViewportSize({ width: 600, height: 768 });
      await settleResize(page, 600);
      expect(await closeButton(page).evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(0);
      await expect(nav(page)).toHaveClass(isVisible);
    });

    test("hides the nav when the Escape key is hit", async ({ page }) => {
      await menuButton(page).click();
      await expect(nav(page)).toHaveClass(isVisible);
      await navControl(page).focus();
      await expect(navControl(page)).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(nav(page)).not.toHaveClass(isVisible);
      await expect(overlay(page)).not.toHaveClass(isVisible);
      await expect(menuButton(page)).toBeFocused();
    });

    test("collapses dropdowns when focus leaves nav", async ({ page }) => {
      await menuButton(page).click();
      await expect(nav(page)).toHaveClass(isVisible);
      await openFirstSubmenu(page);
      await navLink(page).click();
      // Focus has left the nav (it moves to the menu button as the menu closes).
      await expect(page.locator(".usa-nav :focus")).toHaveCount(0);
      await expect(nav(page)).not.toHaveClass(isVisible);
      await expect(accordionButton(page)).toHaveAttribute("aria-expanded", "false");
    });
  });

  test.describe("at desktop widths", () => {
    test.beforeEach(async ({ page, fixture }) => {
      await page.setViewportSize(DESKTOP);
      await fixture.open("usa-nav/template");
    });

    test("hides a visible nav menu when the body is clicked", async ({ page }) => {
      const navMenu = page.locator("#basic-nav-section-one");
      await navControl(page).click();
      await expect(navMenu).not.toHaveAttribute("hidden");
      // Click the page body away from the navigation.
      await page.locator("body").click({ position: { x: 5, y: 5 } });
      await expect(navMenu).toHaveAttribute("hidden");
    });

    test("does not show the nav when a nav link is clicked", async ({ page }) => {
      await openFirstSubmenu(page);
      await navLink(page).click();
      await expect(nav(page)).not.toHaveClass(isVisible);
    });

    test("collapses accordions when a nav link is clicked", async ({ page }) => {
      await accordionButton(page).click();
      await expect(accordionButton(page)).toHaveAttribute("aria-expanded", "true");
      await navLink(page).click();
      await expect(accordionButton(page)).toHaveAttribute("aria-expanded", "false");
    });

    test("collapses dropdowns when the Escape key is hit", async ({ page }) => {
      await accordionButton(page).click();
      await expect(accordionButton(page)).toHaveAttribute("aria-expanded", "true");
      await accordionButton(page).focus();
      await page.keyboard.press("Escape");
      await expect(accordionButton(page)).toHaveAttribute("aria-expanded", "false");
    });
  });
});
