// Port of @uswds/uswds packages/usa-tooltip/src/test/tooltips.spec.js
// Fixture: packages/usa-tooltip/src/test/template.html
//
// USWDS runs each case twice, initializing at document.body and at the tooltip.
// On a page the behavior starts at document.body, so each case runs once.
// USWDS's synthetic events become real user input: focus()/blur() on the
// trigger, a real mouse moving onto the trigger, onto the tooltip body and away
// from the wrapper, and a real Escape key press.

import { test, expect } from "../harness/test.mjs";

const tooltipBody = (page) => page.locator(".usa-tooltip__body");
const tooltipTrigger = (page) => page.locator(".usa-tooltip__trigger");
const tooltipWrapper = (page) => page.locator(".usa-tooltip");

const center = async (locator) => {
  const box = await locator.boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test.describe("tooltips initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-tooltip/template");
  });

  test("trigger is created", async ({ page }) => {
    await expect(tooltipTrigger(page)).toHaveCount(1);
    await expect(tooltipTrigger(page)).toHaveAttribute("class", "usa-button usa-tooltip__trigger");
  });

  test("title attribute on trigger is removed", async ({ page }) => {
    await expect(tooltipTrigger(page)).toHaveCount(1);
    await expect(tooltipTrigger(page)).not.toHaveAttribute("title");
  });

  test("tooltip body is created", async ({ page }) => {
    await expect(tooltipBody(page)).toHaveCount(1);
    expect(await tooltipBody(page).evaluate((el) => el.innerHTML)).toBe("This is a tooltip");
  });

  test("tooltip is visible on focus", async ({ page }) => {
    await tooltipTrigger(page).focus();
    await expect(tooltipBody(page)).toHaveClass(/(^|\s)is-set(\s|$)/);
    await expect(tooltipBody(page)).toBeVisible();
  });

  // USWDS calls blur() on a trigger that was never focused, so the tooltip was
  // never shown. Here the trigger is focused first (tooltip shown), then blurred.
  test("tooltip is hidden on blur", async ({ page }) => {
    await tooltipTrigger(page).focus();
    await expect(tooltipBody(page)).toHaveClass(/(^|\s)is-set(\s|$)/);
    await tooltipTrigger(page).blur();
    await expect(tooltipBody(page)).not.toHaveClass(/(^|\s)is-set(\s|$)/);
    await expect(tooltipBody(page)).toBeHidden();
  });

  test("tooltip is visible on mouseover", async ({ page }) => {
    await tooltipTrigger(page).hover();
    await expect(tooltipBody(page)).toHaveClass(/(^|\s)is-set(\s|$)/);
    await expect(tooltipBody(page)).toBeVisible();
  });

  test("tooltip is hidden on mouseleave", async ({ page }) => {
    await tooltipTrigger(page).hover();
    await expect(tooltipBody(page)).toHaveClass(/(^|\s)is-set(\s|$)/);
    // Move the mouse out of the wrapper (the trigger sits at the top left).
    const box = await tooltipWrapper(page).boundingBox();
    await page.mouse.move(box.x + box.width + 300, box.y + box.height + 300, { steps: 5 });
    await expect(tooltipBody(page)).not.toHaveClass(/(^|\s)is-set(\s|$)/);
    await expect(tooltipBody(page)).toBeHidden();
  });

  test("tooltip content is hoverable", async ({ page }) => {
    await tooltipTrigger(page).hover();
    await expect(tooltipBody(page)).toHaveClass(/(^|\s)is-set(\s|$)/);
    // Glide the mouse from the trigger onto the tooltip body.
    const target = await center(tooltipBody(page));
    await page.mouse.move(target.x, target.y, { steps: 10 });
    expect(await page.evaluate(() => document.querySelector(".usa-tooltip__body").matches(":hover"))).toBe(true);
    await expect(tooltipBody(page)).toHaveClass(/(^|\s)is-set(\s|$)/);
    await expect(tooltipBody(page)).toBeVisible();
  });

  test("tooltip is hidden on escape keydown", async ({ page }) => {
    await tooltipTrigger(page).focus();
    await expect(tooltipBody(page)).toHaveClass(/(^|\s)is-set(\s|$)/);
    await page.keyboard.press("Escape");
    await expect(tooltipBody(page)).not.toHaveClass(/(^|\s)is-set(\s|$)/);
    await expect(tooltipBody(page)).toBeHidden();
  });

  test("should not allow for innerHTML of child elements ", async ({ page, fixture }) => {
    // USWDS overrides the template with a tooltip whose title holds markup, then
    // initializes the behavior again; the page is reopened with that markup in
    // place before the behavior starts.
    const dialogs = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });
    await fixture.open("usa-tooltip/template", {
      before: (page) =>
        page.evaluate(() => {
          document.body.innerHTML = `<button class="usa-button usa-tooltip" title="Apricot &lt;img src='' onerror=alert('ouch')&gt;">Button</button>`;
        }),
    });
    await expect(tooltipBody(page)).toHaveCount(1);

    // confirm we are not on the original template
    expect(await tooltipBody(page).evaluate((el) => el.innerHTML)).not.toBe("This is a tooltip");

    const nodeTypes = await tooltipBody(page).evaluate((el) => Array.from(el.childNodes).map((n) => n.nodeType));
    expect(nodeTypes.length).toBeGreaterThan(0);
    for (const type of nodeTypes) expect(type).toBe(3); // Node.TEXT_NODE
    await expect(tooltipBody(page).locator("img")).toHaveCount(0);
    expect(await tooltipBody(page).evaluate((el) => el.textContent)).toBe("Apricot <img src='' onerror=alert('ouch')>");
    expect(dialogs, "markup in the title must not run").toEqual([]);
  });
});
