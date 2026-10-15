// Port of @uswds/uswds packages/usa-table/src/test/table.spec.js
// Fixture: packages/usa-table/src/test/template.html
//
// USWDS runs each case twice, initializing at document.body and at the table.
// On a page the behavior starts at document.body, so each case runs once.
// Cell values are read exactly as USWDS reads them: each row's cell innerHTML.

import { test, expect } from "../harness/test.mjs";

const ASCENDING = "ascending";
const DESCENDING = "descending";
const sortButtonEl = ".usa-table__header__button";

const root = (page) => page.locator(".usa-table");
const sortableHeaders = (page) => root(page).locator("th[data-sortable]");
const unsortableHeader = (page) => root(page).locator("thead th:not([data-sortable])").first();
const alphabeticalSortButton = (page) => sortableHeaders(page).nth(0).locator(sortButtonEl);
const numericSortButton = (page) => sortableHeaders(page).nth(1).locator(sortButtonEl);
const dataSortValueSortButton = (page) => sortableHeaders(page).nth(2).locator(sortButtonEl);
const ariaLive = (page) => page.locator(".usa-table__announcement-region[aria-live='polite']");

const getCellValuesByColumn = (page, index) =>
  root(page)
    .locator("tbody")
    .evaluate((tbody, i) => Array.from(tbody.querySelectorAll("tr")).map((row) => row.children[i].innerHTML), index);

// jsdom reports a transparent fill as "transparent"; browsers serialize the
// same computed color as "rgba(0, 0, 0, 0)".
const isTransparent = (fill) => fill === "transparent" || /^rgba\(0, 0, 0, 0\)$/.test(fill);

async function expectColumn(page, index, values) {
  await expect.poll(() => getCellValuesByColumn(page, index)).toEqual(values);
}

test.describe("Sortable Table initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-table/template");
  });

  test('is immediately followed by an "aria-live" region', async ({ page }) => {
    await expect(ariaLive(page)).toHaveCount(1);
    const isNext = await root(page).evaluate(
      (table) => table.nextElementSibling === document.querySelector(".usa-table__announcement-region[aria-live='polite']"),
    );
    expect(isNext).toBe(true);
  });

  test("has at least one sortable column", async ({ page }) => {
    await expect(sortableHeaders(page).first()).toBeAttached();
  });

  test("sorts rows by cell content alphabetically when clicked", async ({ page }) => {
    await alphabeticalSortButton(page).click();
    await expectColumn(page, 0, ["A", "X", "Y", "Z"]);
  });

  test("sorts rows by cell content numerically when clicked", async ({ page }) => {
    // what about negative values?
    await numericSortButton(page).click();
    await expectColumn(page, 1, ["1", "2", "3", "4"]);
  });

  test("sorts rows by 'data-sort-value' attribute on cells when clicked", async ({ page }) => {
    await dataSortValueSortButton(page).click();
    await expectColumn(page, 2, ["-1", "Zero", "25%", "2,000"]);
  });

  test("sorts rows descending if already sorted ascending when clicked", async ({ page }) => {
    await alphabeticalSortButton(page).click();
    await expectColumn(page, 0, ["A", "X", "Y", "Z"]);
    await expect(sortableHeaders(page).nth(0)).toHaveAttribute("aria-sort", ASCENDING);
    await alphabeticalSortButton(page).click();
    await expectColumn(page, 0, ["Z", "Y", "X", "A"]);
    await expect(sortableHeaders(page).nth(0)).toHaveAttribute("aria-sort", DESCENDING);
  });

  test("announces sort direction when sort changes", async ({ page }) => {
    await alphabeticalSortButton(page).click();
    await expect.poll(() => ariaLive(page).evaluate((el) => el.innerText.length > 0)).toBe(true);
  });

  test.describe("Sortable column header", () => {
    test("has an aria-label that describes the current sort direction", async ({ page }) => {
      const header = sortableHeaders(page).nth(0);
      const currentSortDirection = await header.getAttribute("aria-sort");
      expect(currentSortDirection).toMatch(/^(ascending|descending)$/);
      const currentAriaLabel = await header.getAttribute("aria-label");
      expect(currentAriaLabel).not.toBeNull();
      expect(currentAriaLabel.includes(currentSortDirection)).toBe(true);
    });

    test("has sort button with a title that describes what the sort direction will be if clicked", async ({ page }) => {
      const header = sortableHeaders(page).nth(0);
      const currentSortDirection = await header.getAttribute("aria-sort");
      const futureSortDirection = currentSortDirection === DESCENDING ? ASCENDING : DESCENDING;
      const firstHeaderButton = header.locator(sortButtonEl);
      await expect(firstHeaderButton).toHaveCount(1);
      await expect(firstHeaderButton).toHaveClass(/(^|\s)usa-table__header__button(\s|$)/);
      const title = await firstHeaderButton.getAttribute("title");
      expect(title).not.toBeNull();
      expect(title.includes(futureSortDirection)).toBe(true);
    });

    test("has an SVG which displays the correct icon", async ({ page }) => {
      const header = sortableHeaders(page).nth(0);
      const currentSortDirection = await header.getAttribute("aria-sort");
      const futureSortDirection = currentSortDirection === DESCENDING ? ASCENDING : DESCENDING;
      const fill = (selector) =>
        header.evaluate((th, s) => {
          const node = th.querySelector(s);
          return node ? getComputedStyle(node).fill : null;
        }, selector);
      const activeFill = await fill(`.usa-icon > .${currentSortDirection}`);
      expect(activeFill).not.toBeNull();
      expect(isTransparent(activeFill)).toBe(false);
      expect(isTransparent(await fill(`.usa-icon > .${futureSortDirection}`))).toBe(true);
      expect(isTransparent(await fill(".usa-icon > .unsorted"))).toBe(true);
    });
  });

  test.describe("Non-sortable column header", () => {
    test("does not have a sort button", async ({ page }) => {
      await expect(unsortableHeader(page)).toBeAttached();
      await expect(unsortableHeader(page).locator(sortButtonEl)).toHaveCount(0);
    });
  });
});
