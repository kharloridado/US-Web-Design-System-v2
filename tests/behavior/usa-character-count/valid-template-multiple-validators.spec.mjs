// Port of @uswds/uswds packages/usa-character-count/src/test/valid-template-multiple-validators.spec.js
// Fixture: packages/usa-character-count/src/test/valid-template-multiple-validators.template.html
//
// USWDS runs each case twice, initializing at document.body and at the
// character count. On a page the behavior starts at document.body, so each
// case runs once. Fake timers become a paused page clock; clock.tick(ms) is
// page.clock.runFor(ms). `input.value = x` plus an input event is `fill(x)`.
//
// "Constraints not satisfied" is jsdom's text for the native pattern-mismatch
// message. In a browser that text is the browser's own, so the test reads the
// browser's pattern-mismatch message from a plain input with the same pattern
// and value, and also checks validity.patternMismatch on the field.
//
// input.setCustomValidity() is another validator on the page (the spec calls
// it after on()), so the test calls it with page.evaluate.
//
// Where the value is over the limit, the test also checks the visual status
// shows the over-limit count, so the case runs through the over-limit branch
// where USWDS would otherwise set its own message.

import { test, expect } from "../harness/test.mjs";

const VALIDATION_MESSAGE = "The content is too long.";
const AT_DEFER_MS = 100;

const input = (page) => page.locator(".usa-character-count .usa-character-count__field");
const statusMessageVisual = (page) => page.locator(".usa-character-count .usa-character-count__status");
const validity = (page) =>
  input(page).evaluate((el) => ({
    message: el.validationMessage,
    patternMismatch: el.validity.patternMismatch,
  }));
const nativePatternMismatchMessage = (page, value) =>
  page.evaluate((v) => {
    const plain = document.createElement("input");
    plain.pattern = "[A-Za-z]+";
    plain.value = v;
    return plain.validationMessage;
  }, value);
const setCustomValidity = (page, message) => input(page).evaluate((el, m) => el.setCustomValidity(m), message);

test.describe("character count component with multiple validators initialized at document.body", () => {
  test.beforeEach(async ({ page, fixture }) => {
    // sinon.useFakeTimers(): time only moves when the test advances it.
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await fixture.open("usa-character-count/valid-template-multiple-validators.template");
  });

  test("assert that input constraint validation adds a validation message", async ({ page }) => {
    await input(page).fill("abcd5");

    const native = await nativePatternMismatchMessage(page, "abcd5");
    expect(native).not.toBe("");
    const state = await validity(page);
    expect(state.patternMismatch).toBe(true);
    expect(state.message).toBe(native);
  });

  test("assert that input constraint validation does not overwrite a custom message", async ({ page }) => {
    await setCustomValidity(page, "There is an error");
    await input(page).fill("abcd5");

    expect((await validity(page)).message).toBe("There is an error");
  });

  test("should not affect the validation message when a custom error message is already present", async ({ page }) => {
    await setCustomValidity(page, "There is an error");
    await input(page).fill("abcdef");

    await expect(statusMessageVisual(page)).toHaveText("1 character over limit");
    expect((await validity(page)).message).toBe("There is an error");
  });

  test("should not affect the validation message when the input is already invalid", async ({ page }) => {
    await input(page).fill("abcde5");

    await expect(statusMessageVisual(page)).toHaveText("1 character over limit");
    const native = await nativePatternMismatchMessage(page, "abcde5");
    expect(native).not.toBe("");
    const state = await validity(page);
    expect(state.patternMismatch).toBe(true);
    expect(state.message).toBe(native);
  });

  test("should clear the validation message when input is only invalid by character count validation", async ({ page }) => {
    await input(page).fill("abcdef");

    expect((await validity(page)).message).toBe(VALIDATION_MESSAGE);

    await input(page).fill("abcde");
    await page.clock.runFor(AT_DEFER_MS);

    expect((await validity(page)).message).toBe("");
  });
});
