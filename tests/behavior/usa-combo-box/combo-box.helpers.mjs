// Shared locators and user actions for the ported combo box cases
// (also used by usa-time-picker, which is a combo box underneath).
//
// How USWDS's jsdom events map to user actions here:
//   input.value = "x"; EVENTS.input(input)  -> input.fill("x") (one input event)
//   EVENTS.click(el)                        -> el.click()
//   EVENTS.focusout(el) (no relatedTarget)  -> clickAway(): click an empty part of the page
//   EVENTS.keydownX(document.activeElement) -> page.keyboard.press("X") on the focused element
//   select.value = "x" (before acting)      -> chooseOption(): pick that option through the combo box

import { expect } from "../harness/test.mjs";

export const comboBox = (page) => page.locator(".usa-combo-box");
export const input = (page) => page.locator(".usa-combo-box__input");
export const select = (page) => page.locator(".usa-combo-box select");
export const list = (page) => page.locator(".usa-combo-box__list");
export const listItems = (page) => page.locator(".usa-combo-box__list > *");
export const toggle = (page) => page.locator(".usa-combo-box__toggle-list");
export const clearButton = (page) => page.locator(".usa-combo-box__clear-input");
export const status = (page) => page.locator(".usa-combo-box__status");
export const focusedOption = (page) => page.locator(".usa-combo-box__list-option--focused");
export const activeElement = (page) => page.locator(":focus");

/** Number of <option>s in the combo box's select, minus the empty placeholder option. */
export const optionCountWithoutPlaceholder = (page) =>
  select(page).evaluate((el) => [...el.options].filter((o) => o.value).length);

/** The list is open: present, shown, and without the hidden attribute. */
export const expectListShown = async (page) => {
  await expect(list(page)).toBeVisible();
  await expect(list(page)).not.toHaveAttribute("hidden");
};

/** The list is closed: present in the page (so the combo box was built) and hidden. */
export const expectListHidden = async (page) => {
  await expect(list(page)).toHaveCount(1);
  await expect(list(page)).toHaveAttribute("hidden", "");
  await expect(list(page)).toBeHidden();
};

/**
 * Move focus out of the component the way a person does: click a blank part of
 * the page. Focus goes to <body>, so the focusout has no relatedTarget, like
 * USWDS's EVENTS.focusout(el).
 */
export const clickAway = (page) => page.mouse.click(1000, 740);

/**
 * Stand-in for USWDS's `select.value = "<value>"` setup: select the option
 * through the combo box (open the list, click the option), so the select holds
 * that value. The input then shows its text; the case's next fill() replaces it.
 */
export const chooseOption = async (page, text) => {
  await input(page).click();
  await list(page).getByRole("option", { name: text, exact: true }).click();
  await expectListHidden(page);
  // Park the pointer off the component. Left where the option was, it would
  // hover (and so highlight and focus) whatever item the next list shows there,
  // which USWDS's pointer-less jsdom cases never do.
  await page.mouse.move(1000, 740);
};

/**
 * Record whether keydown events were default-prevented by the component.
 * The listener sits on window (bubble phase), after the component's own
 * handlers, so it sees the final defaultPrevented state, which is what
 * USWDS checks with a sinon spy on preventDefault.
 */
export const recordKeydowns = (page) =>
  page.evaluate(() => {
    window.__keydowns = [];
    window.addEventListener("keydown", (e) => window.__keydowns.push({ key: e.key, defaultPrevented: e.defaultPrevented }));
  });

export const recordedKeydowns = (page) => page.evaluate(() => window.__keydowns);

/** Children of every list item, as node types (all must be Node.TEXT_NODE = 3). */
export const listItemChildNodeTypes = (page) =>
  list(page).evaluate((ul) => [...ul.children].flatMap((li) => [...li.childNodes].map((n) => n.nodeType)));
