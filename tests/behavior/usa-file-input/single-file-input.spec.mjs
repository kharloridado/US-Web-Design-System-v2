// Port of @uswds/uswds packages/usa-file-input/src/test/single-file-input.spec.js
// Fixture: packages/usa-file-input/src/test/file-input-single.template.html
//
// USWDS runs each case twice, initializing at document.body and at the file input.
// On a page the behavior starts at document.body, so each case runs once.
//
// USWDS stubs window.matchMedia to decide whether "(hover: hover) and
// (pointer: fine)" matches. Here:
// - fine pointer: desktop Chromium (the default) has a fine, hovering pointer, so
//   the real media query matches.
// - no fine pointer: the browser context emulates a touch device (hasTouch), so
//   the real media query does not match.
// - no matchMedia: window.matchMedia is removed before the behaviors start.
// - pointer changes: no browser API attaches or detaches a pointer while a page
//   is open (Chromium's touch emulation cannot be switched back to a fine
//   pointer), so, like USWDS, the fine-pointer media query list is replaced with
//   one the test can flip; it notifies "change" listeners the way the real one
//   does. Every other media query still goes to the real matchMedia.

import { test, expect } from "../harness/test.mjs";

const FINE_POINTER_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";

const dragText = (page) => page.locator(".usa-file-input__drag-text");
const chooseText = (page) => page.locator(".usa-file-input__choose").first();
const inputEl = (page) => page.locator(".usa-file-input__input").first();

test.describe("File input", () => {
  test.describe("file input: single file input", () => {
    test.beforeEach(async ({ page, fixture }) => {
      expect(await page.evaluate((q) => window.matchMedia(q).matches, FINE_POINTER_MEDIA_QUERY), "browser has a fine pointer").toBe(true);
      await fixture.open("usa-file-input/file-input-single.template");
    });

    test('uses singular "file" if there is not a "multiple" attribute', async ({ page }) => {
      await expect(dragText(page).first()).toHaveJSProperty("innerHTML", "Drag file here or");
    });

    test("uses the desktop drag instruction as its default aria label", async ({ page }) => {
      await expect(inputEl(page)).toHaveAttribute("aria-label", "Drag file here or choose from folder");
    });
  });

  test.describe("file input: mobile-safe instructions", () => {
    test.use({ hasTouch: true });

    test.beforeEach(async ({ page, fixture }) => {
      await fixture.open("usa-file-input/file-input-single.template");
      expect(await page.evaluate((q) => window.matchMedia(q).matches, FINE_POINTER_MEDIA_QUERY), "browser has no fine pointer").toBe(false);
    });

    test("removes the drag instruction", async ({ page }) => {
      // Stricter than USWDS: the instructions must have been built, so the
      // missing drag text means it was left out, not that nothing ran.
      await expect(page.locator(".usa-file-input__instructions")).toHaveCount(1);
      await expect(dragText(page)).toHaveCount(0);
    });

    test("uses a mobile-safe choose instruction", async ({ page }) => {
      await expect(chooseText(page)).toHaveJSProperty("innerHTML", "Choose from folder");
      await expect(inputEl(page)).toHaveAttribute("aria-label", await chooseText(page).evaluate((el) => el.innerHTML));
    });
  });

  test.describe("file input: unsupported media queries", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-file-input/file-input-single.template", {
        before: (page) =>
          page.evaluate(() => {
            window.matchMedia = undefined;
            // USWDS's spec starts only the file input. The page starts every
            // behavior, and the footer behavior calls window.matchMedia
            // unconditionally; there is no footer on this fixture, so it is not
            // started.
            if (window.USWDS_TEST) window.USWDS_TEST.components.footer.on = () => {};
          }),
      });
    });

    test("defaults to the mobile-safe instruction", async ({ page }) => {
      await expect(dragText(page)).toHaveCount(0);
      await expect(chooseText(page)).toHaveJSProperty("innerHTML", "Choose from folder");
      await expect(inputEl(page)).toHaveAttribute("aria-label", "Choose from folder");
    });
  });

  test.describe("file input: pointer changes", () => {
    test.beforeEach(async ({ page, fixture }) => {
      await page.addInitScript((query) => {
        const realMatchMedia = window.matchMedia.bind(window);
        const listeners = [];
        const mediaQueryList = {
          matches: false,
          media: query,
          onchange: null,
          addEventListener(type, listener) {
            if (type === "change") listeners.push(listener);
          },
          removeEventListener(type, listener) {
            if (type === "change" && listeners.includes(listener)) listeners.splice(listeners.indexOf(listener), 1);
          },
          addListener(listener) {
            this.addEventListener("change", listener);
          },
          removeListener(listener) {
            this.removeEventListener("change", listener);
          },
          dispatchEvent() {
            return true;
          },
        };
        window.matchMedia = (q) => (String(q).replace(/\s+/g, " ").trim() === query ? mediaQueryList : realMatchMedia(q));
        window.setFinePointer = (matches) => {
          mediaQueryList.matches = matches;
          const event = { matches, media: query };
          [...listeners].forEach((listener) => listener(event));
          if (mediaQueryList.onchange) mediaQueryList.onchange(event);
        };
      }, FINE_POINTER_MEDIA_QUERY);
      await fixture.open("usa-file-input/file-input-single.template");
    });

    test("updates instructions when a fine pointer is attached", async ({ page }) => {
      await expect(dragText(page)).toHaveCount(0);

      await page.evaluate(() => window.setFinePointer(true));

      await expect(dragText(page)).toHaveCount(1);
      await expect(dragText(page).first()).toHaveJSProperty("innerHTML", "Drag file here or");
      await expect(inputEl(page)).toHaveAttribute("aria-label", "Drag file here or choose from folder");
    });

    test("updates instructions when a fine pointer is detached", async ({ page }) => {
      await page.evaluate(() => window.setFinePointer(true));
      await page.evaluate(() => window.setFinePointer(false));

      await expect(dragText(page)).toHaveCount(0);
      await expect(inputEl(page)).toHaveAttribute("aria-label", "Choose from folder");
    });
  });
});
