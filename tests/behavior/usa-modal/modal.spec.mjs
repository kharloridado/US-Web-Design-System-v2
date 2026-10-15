// Port of @uswds/uswds packages/usa-modal/src/test/modal.spec.js
// Fixture: packages/usa-modal/src/test/template.html
//
// USWDS runs each case twice, initializing at document.body and at the modal.
// On a page the behaviors (modal and the nested combo box) start at
// document.body, so each case runs once.
//
// USWDS's `element.click()` calls become real clicks. The overlay click lands
// on a corner of the overlay, outside the modal window, which is where a
// person clicks to dismiss it (a click at the overlay's centre would hit the
// modal window itself). DOM changes USWDS makes after on() (removing the
// opener, adding a [data-focus] button, removing the footer) are made with
// page.evaluate, as the spec does.
//
// The fixture page also holds the harness <script> elements as direct children
// of <body>. "restores other page content screen reader visibility" counts the
// template's own content (the non-script children), which is what USWDS's
// count of 3 covers in jsdom.

import { test, expect } from "../harness/test.mjs";

const wrapper = (page) => page.locator(".usa-modal-wrapper");
const modalWindow = (page) => page.locator(".usa-modal");
const overlay = (page) => page.locator(".usa-modal-overlay");
const closeButton = (page) => page.locator("#close-button");
const openButton1 = (page) => page.locator("#open-button1");
const openButton2 = (page) => page.locator("#open-button2");

const clickOverlayOutsideModal = (page) => overlay(page).click({ position: { x: 5, y: 5 } });

test.describe("Modal window initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-modal/template");
  });

  test.describe("Builds the modal HTML", () => {
    test("creates new parent elements", async ({ page }) => {
      await expect(modalWindow(page), "creates inner div").toHaveCount(1);
      await expect(overlay(page), "creates the overlay").toHaveCount(1);
      await expect(wrapper(page), "creates the outer div").toHaveCount(1);
      await expect(page.locator(".usa-modal-wrapper > .usa-modal-overlay > .usa-modal")).toHaveCount(1);
    });

    test('adds role="dialog" to modal parent', async ({ page }) => {
      await expect(wrapper(page)).toHaveAttribute("role", "dialog");
    });

    test('sets aria-hidden="true" on the closed dialog wrapper', async ({ page }) => {
      await expect(wrapper(page)).toHaveAttribute("aria-hidden", "true");
    });

    test("moves aria-labelledby, aria-describedby, and id to the parent", async ({ page }) => {
      await expect(wrapper(page)).toHaveCount(1);
      await expect(modalWindow(page)).not.toHaveAttribute("aria-describedby");
      await expect(modalWindow(page)).not.toHaveAttribute("aria-labelledby");
      await expect(modalWindow(page)).not.toHaveAttribute("id");
      await expect(wrapper(page)).toHaveAttribute("aria-describedby");
      await expect(wrapper(page)).toHaveAttribute("aria-labelledby");
      await expect(wrapper(page)).toHaveAttribute("id", "modal");
    });

    test('sets tabindex="-1" to the modal window', async ({ page }) => {
      await expect(modalWindow(page)).toHaveAttribute("tabindex", "-1");
    });

    test("moves the modal to the bottom of the DOM", async ({ page }) => {
      const lastIsWrapper = await page.evaluate(() =>
        document.body.lastElementChild.classList.contains("usa-modal-wrapper"),
      );
      expect(lastIsWrapper).toBe(true);
    });

    test('adds role="button" to any <a> opener, but not <button>', async ({ page }) => {
      await expect(openButton1(page)).toHaveAttribute("role", "button");
      await expect(openButton2(page)).not.toHaveAttribute("role");
    });

    test("adds aria-controls to each opener", async ({ page }) => {
      await expect(openButton1(page)).toHaveAttribute("aria-controls", "modal");
      await expect(openButton2(page)).toHaveAttribute("aria-controls", "modal");
    });
  });

  test.describe("When opened", () => {
    test.beforeEach(async ({ page }) => {
      await openButton1(page).click();
    });

    test("makes the modal visible", async ({ page }) => {
      await expect(wrapper(page)).toHaveClass(/(^|\s)is-visible(\s|$)/);
      await expect(modalWindow(page)).toBeVisible();
    });

    test("focuses the first footer button when opened", async ({ page }) => {
      await expect(page.locator(".usa-modal__footer button").first()).toBeFocused();
    });

    test('sets aria-modal="true" on the dialog wrapper', async ({ page }) => {
      await expect(wrapper(page)).toHaveAttribute("aria-modal", "true");
    });

    test("removes aria-hidden from the dialog wrapper", async ({ page }) => {
      await expect(wrapper(page)).toHaveCount(1);
      await expect(wrapper(page)).not.toHaveAttribute("aria-hidden");
    });

    test("makes all other page content invisible to screen readers", async ({ page }) => {
      const active = await page.evaluate(() => {
        const activeContent = document.querySelectorAll("body > :not([aria-hidden])");
        return {
          length: activeContent.length,
          isWrapper: activeContent[0] === document.querySelector(".usa-modal-wrapper"),
        };
      });
      expect(active.length).toBe(1);
      expect(active.isWrapper).toBe(true);
    });

    test("Allows event propagation and displays combobox list when toggle is clicked", async ({ page }) => {
      await page.locator(".usa-combo-box__toggle-list").click();
      await expect(page.locator("#nestedCB--list"), "should display the combobox option list").not.toHaveAttribute("hidden");
      await expect(page.locator("#nestedCB--list")).toBeVisible();
    });
  });

  test.describe("When closing", () => {
    test.beforeEach(async ({ page }) => {
      await openButton2(page).click();
      await expect(wrapper(page)).toHaveClass(/(^|\s)is-visible(\s|$)/);
    });

    test("hides the modal when close button is clicked", async ({ page }) => {
      await closeButton(page).click();
      await expect(wrapper(page)).not.toHaveClass(/(^|\s)is-visible(\s|$)/);
      await expect(modalWindow(page)).toBeHidden();
    });

    test("closes the modal when the overlay is clicked", async ({ page }) => {
      await clickOverlayOutsideModal(page);
      await expect(wrapper(page)).not.toHaveClass(/(^|\s)is-visible(\s|$)/);
      await expect(modalWindow(page)).toBeHidden();
    });

    test("sends focus to the element that opened it", async ({ page }) => {
      await closeButton(page).click();
      await expect(openButton2(page)).toBeFocused();
    });

    test('restores aria-hidden="true" on the dialog wrapper', async ({ page }) => {
      await closeButton(page).click();
      await expect(wrapper(page)).toHaveAttribute("aria-hidden", "true");
      await expect(wrapper(page)).not.toHaveAttribute("aria-modal");
    });

    test("restores other page content screen reader visibility", async ({ page }) => {
      await closeButton(page).click();
      const state = await page.evaluate(() => ({
        active: Array.from(document.querySelectorAll("body > :not([aria-hidden])"))
          .filter((el) => el.localName !== "script")
          .map((el) => el.id),
        scriptsHidden: document.querySelectorAll("body > script[aria-hidden]").length,
        staysHidden: document.getElementById("stays-hidden").hasAttribute("aria-hidden"),
      }));
      expect(state.active.length).toBe(3);
      expect(state.active).toEqual(["other-content", "open-button1", "open-button2"]);
      expect(state.scriptsHidden).toBe(0);
      expect(state.staysHidden).toBe(true);
    });

    test("restores page content when the opener has left the document", async ({ page }) => {
      // The view holding the opener re-renders while the modal is open, so
      // the element `data-opener` points at is gone by the time we close.
      // Another opener remains, so only the focus target is missing.
      await page.evaluate(() => document.querySelector("#open-button2").remove());

      await closeButton(page).click();

      const state = await page.evaluate(() => ({
        modalHidden: document.querySelectorAll("[data-modal-hidden]").length,
        otherContentHidden: document.getElementById("other-content").hasAttribute("aria-hidden"),
        staysHidden: document.getElementById("stays-hidden").hasAttribute("aria-hidden"),
      }));
      expect(state.modalHidden).toBe(0);
      expect(state.otherContentHidden).toBe(false);
      expect(state.staysHidden).toBe(true);
      await expect(wrapper(page)).not.toHaveClass(/(^|\s)is-visible(\s|$)/);
    });
  });

  test.describe("Open focus target", () => {
    test("focuses a [data-focus] element over the footer button", async ({ page }) => {
      await page.evaluate(() => {
        const customFocus = document.createElement("button");
        customFocus.type = "button";
        customFocus.setAttribute("data-focus", "");
        customFocus.textContent = "Custom focus";
        document.querySelector(".usa-modal-wrapper .usa-modal__main").prepend(customFocus);
      });
      await openButton1(page).click();

      await expect(page.locator("[data-focus]")).toBeFocused();
    });

    test("focuses any button when the footer has no buttons", async ({ page }) => {
      await page.evaluate(() => {
        const modalWrapper = document.querySelector(".usa-modal-wrapper");
        modalWrapper.querySelector(".usa-modal__footer").remove();
        modalWrapper.querySelector(".usa-combo-box").remove();
      });

      await openButton1(page).click();

      await expect(closeButton(page)).toBeFocused();
    });
  });
});
