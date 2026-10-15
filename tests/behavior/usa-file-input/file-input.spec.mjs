// Port of @uswds/uswds packages/usa-file-input/src/test/file-input.spec.js
// Fixture: packages/usa-file-input/src/test/file-input-multiple.template.html
//
// USWDS runs each case twice, initializing at document.body and at the file input.
// On a page the behavior starts at document.body, so each case runs once.
//
// USWDS stubs window.matchMedia so "(hover: hover) and (pointer: fine)" matches.
// Desktop Chromium (the default here) has a fine, hovering pointer, so the real
// media query already matches.

import { test, expect } from "../harness/test.mjs";

test.describe("File input", () => {
  test.describe("file input component builds successfully", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-file-input/file-input-multiple.template");
    });

    test("instructions are created", async ({ page }) => {
      await expect(page.locator(".usa-file-input__instructions").first()).toHaveAttribute("class", "usa-file-input__instructions");
    });

    test("target ui is created", async ({ page }) => {
      await expect(page.locator(".usa-file-input__target").first()).toHaveAttribute("class", "usa-file-input__target");
    });

    test("input gets new class", async ({ page }) => {
      await expect(page.locator(".usa-file-input__input").first()).toHaveAttribute("class", "usa-file-input__input");
    });

    test("box is created", async ({ page }) => {
      await expect(page.locator(".usa-file-input__box").first()).toHaveAttribute("class", "usa-file-input__box");
    });

    test('pluralizes "files" if there is a "multiple" attribute', async ({ page }) => {
      await expect(page.locator(".usa-file-input__drag-text").first()).toHaveJSProperty("innerHTML", "Drag files here or");
    });

    test("creates a status message element", async ({ page }) => {
      await expect(page.locator(".usa-sr-only").first()).toHaveAttribute("class", "usa-sr-only");
    });

    test("adds a default status message", async ({ page }) => {
      await expect(page.locator(".usa-sr-only").first()).toHaveJSProperty("innerHTML", "No files selected.");
    });
  });
});
