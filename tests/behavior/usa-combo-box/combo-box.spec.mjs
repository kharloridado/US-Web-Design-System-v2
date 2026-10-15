// Port of @uswds/uswds packages/usa-combo-box/src/test/combo-box.spec.js
// Fixture: packages/usa-combo-box/src/test/combo-box.template.html
//
// USWDS runs each case twice, initializing at document.body and at the combo box.
// On a page the behavior starts at document.body, so each case runs once.
// Event mapping (see combo-box.helpers.mjs): typing is fill(), focusout is a
// click on an empty part of the page, keydowns are real key presses on the
// focused element, and `select.value = x` setups pick that option through the
// combo box first.

import { test, expect } from "../harness/test.mjs";
import {
  activeElement,
  chooseOption,
  clickAway,
  expectListHidden,
  expectListShown,
  input,
  list,
  listItemChildNodeTypes,
  listItems,
  optionCountWithoutPlaceholder,
  recordKeydowns,
  recordedKeydowns,
  select,
  status,
  toggle,
} from "./combo-box.helpers.mjs";

test.describe("Combo box initialized at document.body", () => {
  test.describe("combo box component", () => {
    test.beforeEach(async ({ fixture }) => {
      await fixture.open("usa-combo-box/combo-box.template");
    });

    test("enhances a select element into a combo box component", async ({ page }) => {
      await expect(input(page), "adds an input element").toHaveCount(1);
      await expect(select(page), "hides the select element from view").toHaveClass(/(^|\s)usa-sr-only(\s|$)/);
      await expect(list(page), "adds an list element").toHaveCount(1);
      await expectListHidden(page);
      await expect(select(page), "transfers id attribute to combo box").toHaveAttribute("id", "");
      await expect(input(page), "transfers id attribute to combo box").toHaveAttribute("id", "fruit");
      await expect(select(page), "transfers required attribute to combo box").not.toHaveAttribute("required");
      await expect(input(page), "transfers required attribute to combo box").toHaveAttribute("required", "");
      await expect(select(page), "should not transfer name attribute to combo box").toHaveAttribute("name", "fruit");
      await expect(input(page), "should not transfer name attribute to combo box").not.toHaveAttribute("name");
      await expect(list(page), "the list should have a role of `listbox`").toHaveAttribute("role", "listbox");
      await expect(select(page), "the select should be hidden from screen readers").toHaveAttribute("aria-hidden", /.+/);
      await expect(select(page), "the select should be hidden from keyboard navigation").toHaveAttribute("tabindex", "-1");
      await expect(select(page), "add the class for the select element").toHaveClass(/(^|\s)usa-combo-box__select(\s|$)/);
      await expect(select(page), "the select value should be empty").toHaveValue("");
      await expect(input(page), "the input should be empty").toHaveValue("");
    });

    test("should show the list by clicking the input", async ({ page }) => {
      await input(page).click();

      await expectListShown(page);
      await expect(listItems(page)).toHaveCount(await optionCountWithoutPlaceholder(page));
    });

    test("should show the list by clicking the toggle button", async ({ page }) => {
      await toggle(page).click();

      await expectListShown(page);
    });

    test("should show the list by clicking when clicking the input twice", async ({ page }) => {
      await input(page).click();
      await input(page).click();

      await expectListShown(page);
    });

    test("should toggle the list and close by clicking when clicking the toggle button twice", async ({ page }) => {
      await toggle(page).click();
      await expectListShown(page);
      await toggle(page).click();

      await expectListHidden(page);
    });

    test("should set up the list items for accessibility", async ({ page }) => {
      await input(page).click();
      await expectListShown(page);

      // USWDS reads list.children.length before the click (0 items), so its loop
      // over items 1..n never runs; checking every item here is stricter.
      const items = await listItems(page).evaluateAll((lis) =>
        lis.map((li) => ({
          ariaSelected: li.getAttribute("aria-selected"),
          tabindex: li.getAttribute("tabindex"),
          role: li.getAttribute("role"),
        })),
      );
      expect(items.length).toBeGreaterThan(1);
      items.forEach((item, i) => {
        expect(item.ariaSelected, `item ${i} should not be shown as selected`).toBe("false");
        expect(item.tabindex, `item ${i} tabindex`).toBe(i === 0 ? "0" : "-1");
        expect(item.role, `item ${i} should have a role of 'option'`).toBe("option");
      });
    });

    test("should close the list by clicking away", async ({ page }) => {
      await input(page).click();
      await expectListShown(page);
      await clickAway(page);

      await expectListHidden(page);
    });

    test("should select an item from the option list when clicking a list option", async ({ page }) => {
      await input(page).click();
      await listItems(page).nth(0).click();

      await expect(select(page), "should set that item to the select option").toHaveValue("apple");
      await expect(input(page), "should set that item to the input value").toHaveValue("Apple");
      await expectListHidden(page);
    });

    test("should display and filter the option list after a character is typed", async ({ page }) => {
      await input(page).fill("a");

      await expectListShown(page);
      await expect(listItems(page)).toHaveCount(44);
    });

    test("should sort matches by options that start with the query, then options that contain the query", async ({ page }) => {
      await input(page).fill("tan");

      await expect(listItems(page)).toHaveCount(3);
      await expect(listItems(page).first()).toHaveAttribute("data-value", "tangelo");
      await expect(listItems(page).last()).toHaveAttribute("data-value", "rambutan");
    });

    test("should reset input values when an incomplete item is remaining on blur", async ({ page }) => {
      await chooseOption(page, "Apricot");
      await input(page).fill("a");
      await expectListShown(page);

      await clickAway(page);

      await expectListHidden(page);
      await expect(select(page)).toHaveValue("apricot");
      await expect(input(page)).toHaveValue("Apricot");
    });

    test("should reset input values when an incomplete item is submitted through enter", async ({ page }) => {
      await chooseOption(page, "Cantaloupe");
      await input(page).fill("a");
      await expectListShown(page);
      await recordKeydowns(page);
      await page.keyboard.press("Enter");

      await expectListHidden(page);
      await expect(select(page)).toHaveValue("cantaloupe");
      await expect(input(page), "should reset the value on the input").toHaveValue("Cantaloupe");
      expect(await recordedKeydowns(page), "should not have allowed enter to perform default action").toEqual([
        { key: "Enter", defaultPrevented: true },
      ]);
    });

    test("should not allow enter to perform default action when the list is hidden", async ({ page }) => {
      await expectListHidden(page);
      await input(page).focus();
      await recordKeydowns(page);
      await page.keyboard.press("Enter");

      expect(await recordedKeydowns(page), "should not allow event to perform default action").toEqual([
        { key: "Enter", defaultPrevented: true },
      ]);
    });

    test("should close the list and reset input value when escape is performed while the list is open", async ({ page }) => {
      await chooseOption(page, "Cherry");
      await input(page).fill("a");
      await expectListShown(page);
      await page.keyboard.press("Escape");

      await expectListHidden(page);
      await expect(select(page), "should not change the value of the select").toHaveValue("cherry");
      await expect(input(page), "should reset the value in the input").toHaveValue("Cherry");
    });

    test("should reset the input value when a complete selection is left on blur from the input element", async ({ page }) => {
      await chooseOption(page, "Coconut");
      await input(page).fill("date");
      await expectListShown(page);

      await clickAway(page);

      await expectListHidden(page);
      await expect(select(page)).toHaveValue("coconut");
      await expect(input(page)).toHaveValue("Coconut");
    });

    test("should set the input value when a complete selection is submitted by pressing enter", async ({ page }) => {
      await chooseOption(page, "Cranberry");
      await input(page).fill("grape");
      await expectListShown(page);
      await page.keyboard.press("Enter");

      await expectListHidden(page);
      await expect(select(page), "should set that item to the select option").toHaveValue("grape");
      await expect(input(page), "should set that item to the input value").toHaveValue("Grape");
    });

    test("should show the no results item when a nonexistent option is typed", async ({ page }) => {
      await input(page).fill("Bibbidi-Bobbidi-Boo");

      await expectListShown(page);
      await expect(listItems(page), "should show no results list item").toHaveCount(1);
      await expect(listItems(page).nth(0), "should show the no results list item").toHaveJSProperty("textContent", "No results found");
    });

    test("status should not allow innerHTML", async ({ page }) => {
      await input(page).fill("Ap");

      await expectListShown(page);
      // USWDS only asserts status.innerHTML is non-empty (its "9 results available."
      // is the assert message); checking the exact text is stricter.
      await expect(status(page)).toHaveJSProperty("innerHTML", "9 results available.");
      const nodeTypes = await status(page).evaluate((el) => [...el.childNodes].map((n) => n.nodeType));
      nodeTypes.forEach((type) => expect(type).toBe(3 /* Node.TEXT_NODE */));
    });

    test("should show the list when pressing down from an empty input", async ({ page }) => {
      await expectListHidden(page);

      await input(page).focus();
      await page.keyboard.press("ArrowDown");
      await expectListShown(page);
    });

    test("should focus the first item in the list when pressing down from the input", async ({ page }) => {
      await input(page).fill("grape");
      await expectListShown(page);
      await expect(listItems(page)).toHaveCount(2);
      await page.keyboard.press("ArrowDown");

      await expect(activeElement(page), "should style the focused item in the list").toHaveClass(/(^|\s)usa-combo-box__list-option--focused(\s|$)/);
      await expect(activeElement(page), "should focus the first item in the list").toHaveJSProperty("textContent", "Grape");
    });

    test("should select the focused list item in the list when pressing enter on a focused item", async ({ page }) => {
      await chooseOption(page, "Pineapple");
      await input(page).fill("berry");
      await page.keyboard.press("ArrowDown");
      await expect(activeElement(page), "should focus the first item in the list").toHaveJSProperty("textContent", "Blackberry");

      await page.keyboard.press("Enter");

      await expect(select(page), "select the first item in the list").toHaveValue("blackberry");
      await expect(input(page), "should set the value in the input").toHaveValue("Blackberry");
    });

    test("should select the focused list item in the list when pressing space on a focused item", async ({ page }) => {
      await chooseOption(page, "Cantaloupe");
      await input(page).fill("berry");
      await page.keyboard.press("ArrowDown");
      await expect(activeElement(page), "should focus the first item in the list").toHaveJSProperty("textContent", "Blackberry");

      await page.keyboard.press(" ");

      await expect(select(page), "select the first item in the list").toHaveValue("blackberry");
      await expect(input(page), "should set the value in the input").toHaveValue("Blackberry");
    });

    test("should not select the focused list item in the list when blurring component from a focused item", async ({ page }) => {
      await input(page).fill("la");
      await page.keyboard.press("ArrowDown");
      await expect(activeElement(page), "should focus the first item in the list").toHaveJSProperty("textContent", "Blackberry");

      await clickAway(page);

      await expect(select(page)).toHaveValue("");
      await expect(input(page), "should reset the value in the input").toHaveValue("");
    });

    test("should focus the last item in the list when pressing down many times from the input", async ({ page }) => {
      await input(page).fill("la");
      await expectListShown(page);
      await expect(listItems(page)).toHaveCount(2);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");

      await expect(activeElement(page), "should style the focused item in the list").toHaveClass(/(^|\s)usa-combo-box__list-option--focused(\s|$)/);
      await expect(activeElement(page), "should focus the last item in the list").toHaveJSProperty("textContent", "Plantain");
    });

    test("should not select the focused item in the list when pressing escape from the focused item", async ({ page }) => {
      await chooseOption(page, "Pineapple");
      await input(page).fill("la");
      await expectListShown(page);
      expect(await listItems(page).count(), "should display the option list with options").toBeGreaterThan(0);
      await page.keyboard.press("ArrowDown");
      await expect(activeElement(page), "should focus the first item in the list").toHaveJSProperty("textContent", "Blackberry");
      await page.keyboard.press("Escape");

      await expectListHidden(page);
      await expect(select(page), "should not change the value of the select").toHaveValue("pineapple");
      await expect(input(page), "should reset the value in the input").toHaveValue("Pineapple");
    });

    test("should focus the input and hide the list when pressing up from the first item in the list", async ({ page }) => {
      await input(page).fill("la");
      await expectListShown(page);
      await expect(listItems(page)).toHaveCount(2);
      await page.keyboard.press("ArrowDown");
      await expect(activeElement(page), "should focus the first item in the list").toHaveJSProperty("textContent", "Blackberry");
      await page.keyboard.press("ArrowUp");

      await expectListHidden(page);
      await expect(input(page), "should focus the input").toBeFocused();
    });

    test("should not allow for innerHTML of child elements ", async ({ page }) => {
      await input(page).fill("apricot");
      await expectListShown(page);

      const nodeTypes = await listItemChildNodeTypes(page);
      expect(nodeTypes.length).toBeGreaterThan(0);
      nodeTypes.forEach((type) => expect(type).toBe(3 /* Node.TEXT_NODE */));
    });

    test("should have attribute type of string", async ({ page }) => {
      await expect(input(page)).toHaveCount(1);
      expect(await input(page).evaluate((el) => typeof el.getAttribute("aria-label"))).toBe("string");
    });
  });
});
