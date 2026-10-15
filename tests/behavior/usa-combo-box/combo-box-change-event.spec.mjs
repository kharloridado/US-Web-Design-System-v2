// Port of @uswds/uswds packages/usa-combo-box/src/test/combo-box-change-event.spec.js
// Fixture: packages/usa-combo-box/src/test/combo-box-change-event.template.html
//
// USWDS runs each case twice, initializing at document.body and at the combo box.
// On a page the behavior starts at document.body, so each case runs once.
// USWDS's sinon change spies become page listeners on the select and the input.
// Where a case sets `select.value = x` first (no event), the test picks that
// option through the combo box and only then starts counting change events.
// "called" is checked against change events the component dispatches (not the
// browser's own trusted change events); "notCalled" against all change events.

import { test, expect } from "../harness/test.mjs";
import {
  activeElement,
  chooseOption,
  expectListHidden,
  expectListShown,
  input,
  list,
  listItems,
  select,
} from "./combo-box.helpers.mjs";

/** Start (or restart) counting change events on the select and the input. */
const countChanges = (page) =>
  page.evaluate(() => {
    const counts = { select: { all: 0, dispatched: 0 }, input: { all: 0, dispatched: 0 } };
    window.__changeCounts = counts;
    if (window.__changeListening) return;
    window.__changeListening = true;
    const count = (which) => (e) => {
      window.__changeCounts[which].all += 1;
      if (!e.isTrusted) window.__changeCounts[which].dispatched += 1;
    };
    document.querySelector(".usa-combo-box select").addEventListener("change", count("select"));
    document.querySelector(".usa-combo-box__input").addEventListener("change", count("input"));
  });

const changeCounts = (page) => page.evaluate(() => window.__changeCounts);

test.describe("Combo box initialized at document.body", () => {
  test.describe("combo box component change event dispatch", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-combo-box/combo-box-change-event.template");
    });

    test("enhances a select element into a combo box component", async ({ page }) => {
      await expect(input(page), "adds an input element").toHaveCount(1);
      await expect(select(page), "select element exists").toHaveCount(1);
      await expect(list(page), "adds an list element").toHaveCount(1);
    });

    test("should emit change events when selecting an item from the option list when clicking a list option", async ({ page }) => {
      await countChanges(page);

      await input(page).click();
      await listItems(page).nth(0).click();

      await expect(select(page), "should set that item to being the select option").toHaveValue("apple");
      await expect(input(page), "should set that item to being the input value").toHaveValue("Apple");
      const counts = await changeCounts(page);
      expect(counts.select.dispatched, "should have dispatched a change event from the select").toBeGreaterThan(0);
      expect(counts.input.dispatched, "should have dispatched a change event from the input").toBeGreaterThan(0);
    });

    test("should emit change events when resetting input values when an incomplete item is submitted through enter", async ({ page }) => {
      await chooseOption(page, "Apple");
      await countChanges(page);
      await input(page).fill("a");
      await expectListShown(page);

      await page.keyboard.press("Enter");

      await expect(select(page)).toHaveValue("apple");
      await expect(input(page), "should reset the value on the input").toHaveValue("Apple");
      const counts = await changeCounts(page);
      expect(counts.select.all, "should not have dispatched a change event").toBe(0);
      expect(counts.input.dispatched, "should have dispatched a change event").toBeGreaterThan(0);
    });

    test("should emit change events when closing the list but not the clear the input value when escape is performed while the list is open", async ({ page }) => {
      await chooseOption(page, "Apple");
      await countChanges(page);
      await input(page).fill("a");
      await expectListShown(page);

      await page.keyboard.press("Escape");

      await expect(select(page), "should not change the value of the select").toHaveValue("apple");
      await expect(input(page), "should reset the value in the input").toHaveValue("Apple");
      const counts = await changeCounts(page);
      expect(counts.select.all, "should not have dispatched a change event").toBe(0);
      expect(counts.input.dispatched, "should have dispatched a change event").toBeGreaterThan(0);
    });

    test("should emit change events when setting the input value when a complete selection is submitted by pressing enter", async ({ page }) => {
      await chooseOption(page, "Apple");
      await countChanges(page);
      await input(page).fill("fig");
      await expectListShown(page);

      await page.keyboard.press("Enter");

      await expect(select(page), "should set that item to being the select option").toHaveValue("fig");
      await expect(input(page), "should set that item to being the input value").toHaveValue("Fig");
      const counts = await changeCounts(page);
      expect(counts.select.dispatched, "should have dispatched a change event").toBeGreaterThan(0);
      expect(counts.input.dispatched, "should have dispatched a change event").toBeGreaterThan(0);
    });

    test("should emit change events when selecting the focused list item in the list when pressing enter on a focused item", async ({ page }) => {
      await chooseOption(page, "Grapefruit");
      await countChanges(page);
      await input(page).fill("emo");
      await page.keyboard.press("ArrowDown");
      await expect(activeElement(page), "should focus the first item in the list").toHaveJSProperty("textContent", "Lemon");

      await page.keyboard.press("Enter");

      await expect(select(page), "select the first item in the list").toHaveValue("lemon");
      await expect(input(page), "should set the value in the input").toHaveValue("Lemon");
      const counts = await changeCounts(page);
      expect(counts.select.dispatched, "should have dispatched a change event").toBeGreaterThan(0);
      expect(counts.input.dispatched, "should have dispatched a change event").toBeGreaterThan(0);
    });

    test("should emit change events when pressing escape from a focused item", async ({ page }) => {
      await chooseOption(page, "Grapefruit");
      await countChanges(page);
      await input(page).fill("dew");
      await expectListShown(page);
      expect(await listItems(page).count(), "should display the option list with options").toBeGreaterThan(0);
      await page.keyboard.press("ArrowDown");
      await expect(activeElement(page), "should focus the first item in the list").toHaveJSProperty("textContent", "Honeydew melon");

      await page.keyboard.press("Escape");

      await expectListHidden(page);
      await expect(select(page), "should not change the value of the select").toHaveValue("grapefruit");
      await expect(input(page), "should reset the value in the input").toHaveValue("Grapefruit");
      const counts = await changeCounts(page);
      expect(counts.select.all, "should not have dispatched a change event").toBe(0);
      expect(counts.input.dispatched, "should have dispatched a change event").toBeGreaterThan(0);
    });
  });
});
