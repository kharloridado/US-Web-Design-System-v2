// Port of @uswds/uswds packages/usa-date-picker/src/test/date-picker-i18n.spec.js
// Fixture: packages/usa-date-picker/src/test/date-picker-default-date.template.html
//
// USWDS runs each case twice, initializing at document.body and at the date
// picker. On a page the behavior starts at document.body, so each case runs once.
// changeLanguage(lang) sets <html lang> after the behavior has started and
// before the calendar is opened, exactly as the spec does.

import { test, expect } from "../harness/test.mjs";

const root = (page) => page.locator(".usa-date-picker");
const button = (page) => root(page).locator(".usa-date-picker__button");
const monthSelection = (page) => root(page).locator(".usa-date-picker__calendar__month-selection").first();
const changeLanguage = (page, lang) => page.evaluate((value) => (document.documentElement.lang = value), lang);
const innerHTMLs = (locator) => locator.evaluateAll((els) => els.map((el) => el.innerHTML));

test.describe("date picker in multiple languages document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-date-picker/date-picker-default-date.template");
  });

  test("should display month in english by default", async ({ page }) => {
    await button(page).click();

    await expect(monthSelection(page)).toHaveJSProperty("innerHTML", "May");
  });

  test("should display month in the document language", async ({ page }) => {
    await changeLanguage(page, "es");

    await button(page).click();

    await expect(monthSelection(page)).toHaveJSProperty("innerHTML", "mayo");
  });

  test("should display the correct aria-label in the document language", async ({ page }) => {
    await changeLanguage(page, "es");

    await button(page).click();

    await expect(monthSelection(page)).toHaveAttribute("aria-label", "mayo. Select month");
  });

  test("should display the full list of months in english by default", async ({ page }) => {
    await button(page).click();

    await monthSelection(page).click();

    await expect(root(page).locator(".usa-date-picker__calendar__month-picker")).toHaveCount(1);
    expect(await innerHTMLs(root(page).locator(".usa-date-picker__calendar__table button"))).toEqual([
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]);
  });

  test("should display the full list of months in the document language", async ({ page }) => {
    await changeLanguage(page, "es");

    await button(page).click();

    await monthSelection(page).click();

    await expect(root(page).locator(".usa-date-picker__calendar__month-picker")).toHaveCount(1);
    expect(await innerHTMLs(root(page).locator(".usa-date-picker__calendar__table button"))).toEqual([
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ]);
  });

  test("should display the days of the week headers in english by default", async ({ page }) => {
    await button(page).click();

    await expect(root(page).locator(".usa-date-picker__calendar__day-of-week")).toHaveCount(7);
    expect(await innerHTMLs(root(page).locator(".usa-date-picker__calendar__day-of-week"))).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
  });

  test("should display the days of the week headers the in document language", async ({ page }) => {
    await changeLanguage(page, "es");

    await button(page).click();

    await expect(root(page).locator(".usa-date-picker__calendar__day-of-week")).toHaveCount(7);
    expect(await innerHTMLs(root(page).locator(".usa-date-picker__calendar__day-of-week"))).toEqual(["D", "L", "M", "X", "J", "V", "S"]);
  });

  test("should display the aria-label in the document language", async ({ page }) => {
    await changeLanguage(page, "es");

    await button(page).click();

    await expect(root(page).locator(".usa-date-picker__calendar__day-of-week")).toHaveCount(7);
    const labels = await root(page)
      .locator(".usa-date-picker__calendar__day-of-week")
      .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
    expect(labels).toEqual(["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]);
  });
});
