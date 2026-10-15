// Port of @uswds/uswds packages/usa-file-input/src/test/file-input-accepts.spec.js
// Fixture: packages/usa-file-input/src/test/template.html (accept=".pdf,.txt", multiple)
//
// USWDS runs each case twice, initializing at document.body and at the file input.
// On a page the behavior starts at document.body, so each case runs once.
//
// USWDS stubs window.matchMedia so "(hover: hover) and (pointer: fine)" matches.
// Desktop Chromium (the default here) has a fine, hovering pointer, so the real
// media query already matches.
//
// USWDS builds a jsdom FileList with a 2 MB "pic.jpg" (image/jpeg), assigns it to
// input.files and dispatches "change". The test selects the same file with
// setInputFiles(), which sets the input's files and fires "change" like a user's
// file choice.

import { test, expect } from "../harness/test.mjs";

const INVALID_FILE_CLASS = "has-invalid-file";
const size = 1024 * 1024 * 2;
const file = { name: "pic.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(size, "a") };
const defaultErrorMessage = "Error: This is not a valid file type.";
const customErrorMessage = "Please upload a valid file";

const inputEl = (page) => page.locator("#file-input-specific");
const addFiles = (page) => inputEl(page).setInputFiles([file]);

test.describe("File input", () => {
  test.describe("file input component should respond to file type on change", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-file-input/template");
    });

    test("instructions are created", async ({ page }) => {
      await expect(page.locator(".usa-file-input__instructions").first()).toHaveAttribute("class", "usa-file-input__instructions");
    });

    test("target ui is created", async ({ page }) => {
      await expect(page.locator(".usa-file-input__target").first()).toHaveAttribute("class", "usa-file-input__target");
    });

    test("input gets new class", async ({ page }) => {
      await expect(inputEl(page)).toHaveAttribute("class", "usa-file-input__input");
    });

    test("box is created", async ({ page }) => {
      await expect(page.locator(".usa-file-input__box").first()).toHaveAttribute("class", "usa-file-input__box");
    });

    test('pluralizes "files" if there is a "multiple" attribute', async ({ page }) => {
      await expect(page.locator(".usa-file-input__drag-text").first()).toHaveJSProperty("innerHTML", "Drag files here or");
    });

    // USWDS checks its own mock file. The test checks the file the input actually
    // receives when it is selected (read in the capture phase, before the file
    // input's change handler clears the rejected selection).
    test("mock file should be defined with specific values", async ({ page }) => {
      await page.evaluate(() => {
        document.addEventListener(
          "change",
          (e) => {
            const [f] = e.target.files;
            window.selectedFile = f && { name: f.name, size: f.size, type: f.type };
          },
          { capture: true, once: true },
        );
      });
      await addFiles(page);
      const selected = await page.evaluate(() => window.selectedFile);
      expect(selected).toBeTruthy();
      expect(selected.name).toBe("pic.jpg");
      expect(selected.size).toBe(size);
      expect(selected.type).toBe("image/jpeg");
    });

    test("mock file should not be allowed", async ({ page }) => {
      await addFiles(page);
      await expect(page.locator(".usa-file-input__target").first()).toHaveClass(new RegExp(`(^|\\s)${INVALID_FILE_CLASS}(\\s|$)`));
    });

    test("should provide a default error message for invalid file type", async ({ page }) => {
      await addFiles(page);

      // Error message appended to DOM after change event.
      const visibleErrorMessage = page.locator(".usa-file-input__accepted-files-message").first();
      await expect(visibleErrorMessage).toHaveJSProperty("textContent", defaultErrorMessage);
      expect((await inputEl(page).getAttribute("aria-label"))?.startsWith(defaultErrorMessage)).toBe(true);
    });

    test("should allow a custom error message for invalid file type", async ({ page }) => {
      // USWDS sets inputEl.dataset.errormessage after initializing.
      await inputEl(page).evaluate((el, message) => {
        el.dataset.errormessage = message;
      }, customErrorMessage);
      await addFiles(page);

      // Error message appended to DOM after change event.
      const visibleErrorMessage = page.locator(".usa-file-input__accepted-files-message").first();
      await expect(visibleErrorMessage).toHaveJSProperty("textContent", customErrorMessage);
      expect((await inputEl(page).getAttribute("aria-label"))?.startsWith(customErrorMessage)).toBe(true);
    });
  });
});
