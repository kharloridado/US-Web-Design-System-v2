// Port of @uswds/uswds packages/usa-accordion/src/test/accordion.spec.js
// Fixture: packages/usa-accordion/src/test/template.html
//
// USWDS runs each case twice, initializing at document.body and at the accordion.
// On a page the behavior starts at document.body, so each case runs once.
// Where USWDS calls Accordion.show(button) / hide(button), the test does what a
// user does: click the button from the opposite state.

import { test, expect } from "../harness/test.mjs";

const accordion = (page) => page.locator(".usa-accordion");
const buttons = (page) => page.locator(".usa-accordion__button");
const contentOf = async (page, button) => page.locator(`#${await button.getAttribute("aria-controls")}`);

test.describe("Accordion behavior", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-accordion/template");
  });

  test.describe("DOM state", () => {
    test('has an "aria-expanded" attribute', async ({ page }) => {
      await expect(buttons(page).first()).toHaveAttribute("aria-expanded", /.+/);
    });

    test('has an "aria-controls" attribute', async ({ page }) => {
      await expect(buttons(page).first()).toHaveAttribute("aria-controls", /.+/);
    });

    test.describe("accordion.show()", () => {
      test.beforeEach(async ({ page }) => {
        const button = buttons(page).first();
        if ((await button.getAttribute("aria-expanded")) === "true") await button.click();
        await button.click();
      });

      test('toggles button aria-expanded="true"', async ({ page }) => {
        await expect(buttons(page).first()).toHaveAttribute("aria-expanded", "true");
      });

      test('toggles content "hidden" off', async ({ page }) => {
        await expect(await contentOf(page, buttons(page).first())).not.toHaveAttribute("hidden");
      });
    });

    test.describe("accordion.hide()", () => {
      test.beforeEach(async ({ page }) => {
        const button = buttons(page).first();
        if ((await button.getAttribute("aria-expanded")) !== "true") await button.click();
        await button.click();
      });

      test('toggles button aria-expanded="false"', async ({ page }) => {
        await expect(buttons(page).first()).toHaveAttribute("aria-expanded", "false");
      });

      test('toggles content "hidden" on', async ({ page }) => {
        await expect(await contentOf(page, buttons(page).first())).toHaveAttribute("hidden");
      });
    });
  });

  test.describe("interaction", () => {
    test("shows the second item when clicked", async ({ page }) => {
      const first = buttons(page).nth(0);
      const second = buttons(page).nth(1);
      await second.click();
      await expect(first).toHaveAttribute("aria-expanded", "false");
      await expect(await contentOf(page, first)).toHaveAttribute("hidden");
      await expect(second).toHaveAttribute("aria-expanded", "true");
      await expect(await contentOf(page, second)).not.toHaveAttribute("hidden");
    });

    test("keeps multiple sections open with data-allow-multiple", async ({ page }) => {
      await accordion(page).evaluate((el) => el.setAttribute("data-allow-multiple", ""));
      const first = buttons(page).nth(0);
      const second = buttons(page).nth(1);
      await second.click();
      await first.click();
      await expect(first).toHaveAttribute("aria-expanded", "true");
      await expect(await contentOf(page, first)).not.toHaveAttribute("hidden");
      await expect(second).toHaveAttribute("aria-expanded", "true");
      await expect(await contentOf(page, second)).not.toHaveAttribute("hidden");
    });
  });
});
