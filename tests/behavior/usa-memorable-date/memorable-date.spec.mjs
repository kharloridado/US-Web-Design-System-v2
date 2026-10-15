// Port of @uswds/uswds packages/usa-memorable-date/src/test/memorable-date.spec.js
// Fixture: packages/usa-memorable-date/src/test/template.html
//
// Memorable date has no USWDS JavaScript; the spec checks the component's
// markup contract (labels, hints, ids), so these tests read the rendered page.

import { test, expect } from "../harness/test.mjs";

const textContent = (locator) => locator.evaluate((el) => el.textContent);

test.describe("memorable date component", () => {
  let fieldset, groupHint, monthSelect, monthHint, monthLabel, dayInput, dayHint, dayLabel, yearInput, yearHint, yearLabel;

  test.beforeEach(async ({ page, fixture }) => {
    await fixture.open("usa-memorable-date/template");
    fieldset = page.locator(".usa-fieldset");
    groupHint = page.locator("#memorable-date-hint");
    monthSelect = page.locator("#memorable-date-month");
    monthHint = page.locator("#memorable-date-month-hint");
    monthLabel = page.locator('label[for="memorable-date-month"]');
    dayInput = page.locator("#memorable-date-day");
    dayHint = page.locator("#memorable-date-day-hint");
    dayLabel = page.locator('label[for="memorable-date-day"]');
    yearInput = page.locator("#memorable-date-year");
    yearHint = page.locator("#memorable-date-year-hint");
    yearLabel = page.locator('label[for="memorable-date-year"]');
  });

  test("renders a fieldset with a legend", async () => {
    await expect(fieldset, "fieldset exists").toHaveCount(1);
    expect(await textContent(fieldset.locator(".usa-legend").first())).toBe("Date of Birth");
    await expect(fieldset.locator(".usa-legend").first()).toBeVisible();
  });

  test("renders a visible group hint hidden from assistive technology", async () => {
    await expect(groupHint, "group hint exists").toHaveCount(1);
    await expect(groupHint).toHaveAttribute("aria-hidden", "true");
    await expect(groupHint, "group hint is visible to sighted users").not.toHaveClass(/(^|\s)usa-sr-only(\s|$)/);
    await expect(groupHint).toBeVisible();
  });

  test("associates each field label with its control", async () => {
    for (const [label, field] of [
      [monthLabel, monthSelect],
      [dayLabel, dayInput],
      [yearLabel, yearInput],
    ]) {
      await expect(field).toHaveCount(1);
      await expect(label).toHaveAttribute("for", await field.getAttribute("id"));
    }
  });

  test("uses per-field hint ids derived from the field id", async () => {
    for (const [hint, field] of [
      [monthHint, monthSelect],
      [dayHint, dayInput],
      [yearHint, yearInput],
    ]) {
      await expect(hint).toHaveCount(1);
      await expect(hint).toHaveAttribute("id", `${await field.getAttribute("id")}-hint`);
    }
  });

  test("describes each field with its own screen-reader-only hint", async () => {
    for (const hint of [monthHint, dayHint, yearHint]) {
      await expect(hint).toHaveClass(/(^|\s)usa-sr-only(\s|$)/);
    }
    await expect(monthSelect).toHaveAttribute("aria-describedby", await monthHint.getAttribute("id"));
    await expect(dayInput).toHaveAttribute("aria-describedby", await dayHint.getAttribute("id"));
    await expect(yearInput).toHaveAttribute("aria-describedby", await yearHint.getAttribute("id"));
  });

  test("does not associate fields with the group hint", async () => {
    const groupHintId = await groupHint.getAttribute("id");
    for (const field of [monthSelect, dayInput, yearInput]) {
      await expect(field).toHaveCount(1);
      expect(await field.getAttribute("aria-describedby")).not.toBe(groupHintId);
    }
  });

  test("uses matching id and name values for each field", async () => {
    for (const field of [monthSelect, dayInput, yearInput]) {
      await expect(field).toHaveCount(1);
      await expect(field).toHaveAttribute("name", await field.getAttribute("id"));
    }
  });
});
