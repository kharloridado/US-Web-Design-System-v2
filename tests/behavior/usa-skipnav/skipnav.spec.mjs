// Port of @uswds/uswds packages/usa-skipnav/src/test/skipnav.spec.js
// Fixture: packages/usa-skipnav/src/test/template.html
//
// The skip link is positioned off-screen until it has focus, so a user reaches
// it the way keyboard users do: Tab to it (it's first on the page) and press
// Enter. USWDS's `main.focus(); main.blur()` is the user moving focus on with Tab.

import { test, expect } from "../harness/test.mjs";

const skipLink = (page) => page.locator(".usa-skipnav");
const topLink = (page) => page.locator(".usa-footer__return-to-top a");
const main = (page) => page.locator("main");

async function activateSkipLink(page) {
  await page.keyboard.press("Tab");
  await expect(skipLink(page)).toBeFocused();
  await page.keyboard.press("Enter");
}

test.describe("skip nav link", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-skipnav/template");
  });

  test('skipnav link sets tabindex="0" when clicked', async ({ page }) => {
    await activateSkipLink(page);
    await expect(main(page)).toHaveAttribute("tabindex", "0");
    await expect(main(page)).toBeFocused();
  });

  test('skipnav link sets tabindex="-1" when blurred', async ({ page }) => {
    await activateSkipLink(page);
    await expect(main(page)).toHaveAttribute("tabindex", "0");
    await expect(main(page)).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(main(page)).not.toBeFocused();
    await expect(main(page)).toHaveAttribute("tabindex", "-1");
  });

  test('return to top link sets tabindex="0" when clicked', async ({ page }) => {
    await topLink(page).click();
    await expect(main(page)).toHaveAttribute("tabindex", "0");
    await expect(main(page)).toBeFocused();
  });
});
