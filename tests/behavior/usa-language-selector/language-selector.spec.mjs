// Port of @uswds/uswds packages/usa-language-selector/src/test/language-selector.spec.js
// Fixture: packages/usa-language-selector/src/test/template.html
//
// USWDS's synthetic Escape keydown is a real Escape key press on the focused
// element. USWDS's `body.click()` is a click on the page body away from the
// language selector.

import { test, expect } from "../harness/test.mjs";

const language = (page) => page.locator(".usa-language-container");
const languageList = (page) => page.locator(".usa-language__submenu");
const languageButton = (page) => page.locator(".usa-language__link");
const languageLink = (page) => language(page).locator("a").first();
const languageMenu = (page) => page.locator("#language-options");

async function openLanguageMenu(page) {
  await languageButton(page).click();
  await expect(languageButton(page)).toHaveAttribute("aria-expanded", "true");
  await expect(languageMenu(page)).not.toHaveAttribute("hidden");
}

// The fixture's links are href="javascript:void()", which is a syntax error a
// browser reports as an uncaught page error when it follows the link (jsdom
// never runs javascript: URLs). Cancel just that navigation, like jsdom; the
// click still reaches every USWDS listener.
async function suppressJavascriptHrefs(page) {
  await page.evaluate(() =>
    window.addEventListener(
      "click",
      (event) => {
        if (event.target.closest('a[href^="javascript:"]')) event.preventDefault();
      },
      true,
    ),
  );
}

test.describe("language selector component", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-language-selector/template");
  });

  test("shows the language dropdown when the language button is clicked", async ({ page }) => {
    await languageButton(page).click();
    await expect(languageMenu(page)).not.toHaveAttribute("hidden");
    await expect(languageMenu(page)).toBeVisible();
  });

  test("hides the visible language menu when the body is clicked", async ({ page }) => {
    await languageButton(page).click();
    await expect(languageMenu(page)).not.toHaveAttribute("hidden");
    // Click the page body to the left of the (right-aligned) language button.
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await expect(languageMenu(page)).toHaveAttribute("hidden");
  });

  test("collapses dropdown when a language link is clicked", async ({ page }) => {
    await suppressJavascriptHrefs(page);
    await openLanguageMenu(page);
    await languageLink(page).click();
    await expect(languageButton(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("collapses dropdown when the Escape key is hit", async ({ page }) => {
    await openLanguageMenu(page);
    await languageButton(page).focus();
    await page.keyboard.press("Escape");
    await expect(languageButton(page)).toHaveAttribute("aria-expanded", "false");
  });

  // USWDS turns on the submenu's FocusTrap through its API
  // (LanguageSelector.focusTrap.update(true)) and dispatches Escape from the
  // first language link, failing if any listener throws. There is no user
  // action that turns that trap on by itself; what a user can do is press
  // Escape while focused on that link inside the open submenu. The harness
  // fails the test on any uncaught page error, like USWDS's window.onerror check.
  test("collapses dropdown via the FocusTrap Escape callback", async ({ page }) => {
    await openLanguageMenu(page);
    await page.keyboard.press("Tab");
    await expect(languageLink(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(languageButton(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("contains a role of button", async ({ page }) => {
    await expect(languageButton(page)).toHaveAttribute("role", "button");
  });

  test("contains aria-controls of language-options", async ({ page }) => {
    await expect(languageButton(page)).toHaveAttribute("aria-controls", "language-options");
  });

  test("contains an id of language-options", async ({ page }) => {
    await expect(languageList(page)).toHaveAttribute("id", "language-options");
  });
});
