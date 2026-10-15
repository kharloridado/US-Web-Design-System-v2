// Port of @uswds/uswds packages/usa-character-count/src/test/character-count.spec.js
// Fixture: packages/usa-character-count/src/test/character-count.template.html
//
// USWDS runs each case twice, initializing at document.body and at the
// character count. On a page the behavior starts at document.body, so each
// case runs once.
//
// USWDS installs sinon fake timers before the fixture is built; here the page
// clock is installed and paused before the page loads, and clock.tick(ms)
// becomes page.clock.runFor(ms). `input.value = x` followed by an input event
// is `fill(x)`, which replaces the value and fires one input event.
//
// "does not create duplicate status messages when initialized twice" calls
// CharacterCount.on() a second time and is recorded as api-only in the ledger.
//
// The second describe uses the spec's inline SPECIAL_ID_TEMPLATE, swapped into
// the fixture page before the behavior starts.

import { test, expect } from "../harness/test.mjs";

// Constants exported by USWDS's character count behavior.
const FORM_GROUP_ERROR_CLASS = "usa-form-group--error";
const LABEL_ERROR_CLASS = "usa-label--error";
const INPUT_ERROR_CLASS = "usa-input--error";
const VALIDATION_MESSAGE = "The content is too long.";
const MESSAGE_INVALID_CLASS = "usa-character-count__status--invalid";
const LIMIT_EXCEEDED_MESSAGE = "Character limit exceeded.";
const SR_STATUS_DEBOUNCE_MS = 1200;
const AT_DEFER_MS = 100;

const root = (page) => page.locator(".usa-character-count");
const formGroup = (page) => root(page).locator(".usa-form-group");
const label = (page) => root(page).locator(".usa-label");
const input = (page) => root(page).locator(".usa-character-count__field");
const requirementsMessage = (page) => root(page).locator(".usa-character-count__message");
const statusMessageVisual = (page) => root(page).locator(".usa-character-count__status");
const statusMessageSR = (page) => root(page).locator(".usa-character-count__sr-status");

const innerHTML = (locator) => locator.evaluate((el) => el.innerHTML);
const validationMessage = (page) => input(page).evaluate((el) => el.validationMessage);
const hasClass = (locator, className) => locator.evaluate((el, c) => el.classList.contains(c), className);

/** Assert screen reader status message content and aria-live. */
const assertSrStatus = async (page, { text, ariaLive }) => {
  const sr = await statusMessageSR(page).evaluate((el) => ({
    text: el.textContent,
    ariaLive: el.getAttribute("aria-live"),
  }));
  expect(sr.text).toBe(text);
  expect(sr.ariaLive).toBe(ariaLive);
};

test.describe("character count component initialized at document.body", () => {
  test.beforeEach(async ({ page, fixture }) => {
    // sinon.useFakeTimers(): time only moves when the test advances it.
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await fixture.open("usa-character-count/character-count.template");
  });

  test("hides the requirements hint for screen readers", async ({ page }) => {
    expect(await hasClass(requirementsMessage(page), "usa-sr-only")).toBe(true);
  });

  test("creates a visual status message on init", async ({ page }) => {
    await expect(page.locator(".usa-character-count__status")).toHaveCount(1);
  });

  test("creates a screen reader status message on init", async ({ page }) => {
    await expect(page.locator(".usa-character-count__sr-status")).toHaveCount(1);
  });

  test("does not set aria-live on the sr status message synchronously", async ({ page }) => {
    await expect(statusMessageSR(page)).toHaveCount(1);
    expect(await statusMessageSR(page).getAttribute("aria-live")).toBe(null);
  });

  test("sets aria-live on the sr status message after a delay", async ({ page }) => {
    await page.clock.runFor(AT_DEFER_MS);

    expect(await statusMessageSR(page).getAttribute("aria-live")).toBe("polite");
  });

  test("adds initial status message for the character count component", async ({ page }) => {
    expect(await innerHTML(statusMessageVisual(page))).toBe("20 characters allowed");
    expect(await innerHTML(statusMessageSR(page))).toBe("20 characters allowed");
  });

  test("informs the user how many more characters they are allowed", async ({ page }) => {
    await input(page).fill("1");

    expect(await innerHTML(statusMessageVisual(page))).toBe("19 characters left");
  });

  test("informs the user they are allowed a single character", async ({ page }) => {
    await input(page).fill("1234567890123456789");

    expect(await innerHTML(statusMessageVisual(page))).toBe("1 character left");
  });

  test("informs the user they are over the limit by a single character", async ({ page }) => {
    await input(page).fill("123456789012345678901");

    expect(await innerHTML(statusMessageVisual(page))).toBe("1 character over limit");
  });

  test("informs the user how many characters they will need to remove", async ({ page }) => {
    await input(page).fill("1234567890123456789012345");

    expect(await innerHTML(statusMessageVisual(page))).toBe("5 characters over limit");
  });

  test("should show the component and input as valid when the input is under the limit", async ({ page }) => {
    await input(page).fill("1");

    expect(await validationMessage(page)).toBe("");
    await expect(statusMessageVisual(page)).toHaveCount(1);
    expect(await hasClass(statusMessageVisual(page), MESSAGE_INVALID_CLASS)).toBe(false);
  });

  test("should show the component and input as invalid when the input is over the limit", async ({ page }) => {
    // USWDS 3.14.0 finds the label with label[for="<input id>"], and the spec
    // template's label and input are not associated (no for / id), so USWDS's
    // own JavaScript never marks that label. Associate them, as a page using
    // the component does, so the label assertion is kept.
    await page.evaluate(() => {
      const root = document.querySelector(".usa-character-count");
      root.querySelector(".usa-character-count__field").id = "character-count-field";
      root.querySelector(".usa-label").htmlFor = "character-count-field";
    });

    await input(page).fill("123456789012345678901");

    expect(await validationMessage(page)).toBe(VALIDATION_MESSAGE);
    expect(await hasClass(label(page), LABEL_ERROR_CLASS)).toBe(true);
    expect(await hasClass(input(page), INPUT_ERROR_CLASS)).toBe(true);
    expect(await hasClass(formGroup(page), FORM_GROUP_ERROR_CLASS)).toBe(true);
    expect(await hasClass(statusMessageVisual(page), MESSAGE_INVALID_CLASS)).toBe(true);
  });

  test("should not allow for innerHTML of child elements ", async ({ page }) => {
    await expect(statusMessageVisual(page)).toHaveCount(1);
    const nodeTypes = await statusMessageVisual(page).evaluate((el) =>
      Array.from(el.childNodes).map((childNode) => childNode.nodeType),
    );
    for (const nodeType of nodeTypes) expect(nodeType).toBe(3 /* Node.TEXT_NODE */);
  });

  test("announces assertively after debounce when over the limit", async ({ page }) => {
    await input(page).fill("123456789012345678901");
    await page.clock.runFor(SR_STATUS_DEBOUNCE_MS);

    await assertSrStatus(page, {
      text: `${LIMIT_EXCEEDED_MESSAGE} 1 character over limit`,
      ariaLive: "assertive",
    });
  });

  test("waits for typing to pause before assertively announcing how far over the limit", async ({ page }) => {
    await input(page).fill("1234567890123456789");
    await input(page).fill("123456789012345678901");
    await input(page).fill("1234567890123456789012");

    await page.clock.runFor(SR_STATUS_DEBOUNCE_MS);

    await assertSrStatus(page, {
      text: `${LIMIT_EXCEEDED_MESSAGE} 2 characters over limit`,
      ariaLive: "assertive",
    });
  });

  test("uses polite announcements while typing under the limit", async ({ page }) => {
    await input(page).fill("1");
    await page.clock.runFor(SR_STATUS_DEBOUNCE_MS);

    await assertSrStatus(page, {
      text: "19 characters left",
      ariaLive: "polite",
    });
  });

  test("announces recovery quickly when backspacing under the limit", async ({ page }) => {
    await input(page).fill("123456789012345678901");
    await input(page).fill("1234567890123456789");

    await page.clock.runFor(AT_DEFER_MS);

    await assertSrStatus(page, {
      text: "1 character left",
      ariaLive: "polite",
    });
    expect(await validationMessage(page)).toBe("");
  });

  test("does not replay a stale over-limit announcement after backspacing to empty", async ({ page }) => {
    await input(page).fill("123456789012345678901");
    await input(page).fill("");

    await page.clock.runFor(AT_DEFER_MS);

    await assertSrStatus(page, {
      text: "20 characters allowed",
      ariaLive: "polite",
    });
  });
});

test.describe("character count with special characters in input ID", () => {
  const SPECIAL_ID_TEMPLATE = `
    <div class="usa-character-count">
      <div class="usa-form-group">
        <label class="usa-label" for="character-count-:r0:">Label</label>
        <input class="usa-character-count__field" id="character-count-:r0:" maxlength="20" />
        <span class="usa-character-count__message"></span>
      </div>
    </div>
  `;

  const openSpecialIdTemplate = (fixture) =>
    fixture.open("usa-character-count/character-count.template", {
      before: (page) =>
        page.evaluate((html) => {
          document.querySelector(".usa-character-count").outerHTML = html;
        }, SPECIAL_ID_TEMPLATE),
    });

  test("initializes without error when the input ID contains colons", async ({ page, fixture }) => {
    // Starting the behavior must not throw (the harness also fails on any
    // uncaught page error); it then shows the status message.
    await openSpecialIdTemplate(fixture);

    await expect(statusMessageVisual(page)).toHaveCount(1);
    expect(await innerHTML(statusMessageVisual(page))).toBe("20 characters allowed");
  });

  test("applies error class to the label found via for attribute", async ({ page, fixture }) => {
    await openSpecialIdTemplate(fixture);

    await input(page).fill("123456789012345678901");

    expect(await hasClass(label(page), LABEL_ERROR_CLASS)).toBe(true);
  });
});
