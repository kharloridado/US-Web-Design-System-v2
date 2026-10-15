// Port of @uswds/uswds packages/usa-banner/src/test/banner.spec.js
// Fixture: packages/usa-banner/src/test/template.html
//
// USWDS runs the first three cases twice, initializing at document.body and at
// the banner. On a page the behavior starts at document.body, so they run once.
//
// The "shadow root" cases put the banner inside an open shadow root and start
// the banner behavior there (banner.on(root)). Here `before` moves the banner
// into a shadow root and has the page's start() also initialize the banner at
// that root, so the setup still only happens when the behaviors are started.
//
// USWDS asserts `content.getAttribute("hidden") !== true`, which can never be
// false; the ports check what it means: the content no longer has `hidden`.

import { test, expect } from "../harness/test.mjs";

const EXPANDED = "aria-expanded";
const EXPANDED_CLASS = /(^|\s)usa-banner__header--expanded(\s|$)/;

function banner(page) {
  return {
    header: page.locator(".usa-banner__header"),
    button: page.locator(".usa-banner__button"),
    content: page.locator(".usa-banner__content"),
  };
}

async function assertClosed({ header, button, content }) {
  await expect(header).not.toHaveClass(EXPANDED_CLASS);
  await expect(button).toHaveAttribute(EXPANDED, "false");
  await expect(content).toHaveAttribute("hidden");
}

async function assertOpen({ header, button, content }) {
  await expect(header).toHaveClass(EXPANDED_CLASS);
  await expect(button).toHaveAttribute(EXPANDED, "true");
  await expect(content).not.toHaveAttribute("hidden");
  await expect(content).toBeVisible();
}

test.describe("Banner initialized at document.body", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-banner/template");
  });

  test("initializes closed", async ({ page }) => {
    await assertClosed(banner(page));
  });

  test("opens when you click the button", async ({ page }) => {
    const b = banner(page);
    await b.button.click();
    await assertOpen(b);
  });

  test("closes when you click the button again", async ({ page }) => {
    const b = banner(page);
    await b.button.click();
    await b.button.click();
    await assertClosed(b);
  });
});

test.describe("Banner initialized at shadow root", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-banner/template", {
      before: (page) =>
        page.evaluate(() => {
          const host = document.createElement("div");
          host.id = "banner-host";
          document.body.prepend(host);
          const root = host.attachShadow({ mode: "open" });
          // Same look as the light-DOM banner: the page stylesheet, inside the root.
          root.append(document.querySelector('link[rel="stylesheet"]').cloneNode());
          root.append(document.querySelector(".usa-banner"));
          const start = window.USWDS_TEST.start.bind(window.USWDS_TEST);
          window.USWDS_TEST.start = () => {
            start();
            window.USWDS_TEST.components.banner.on(root);
          };
        }),
    });
  });

  test("opens when you click the button", async ({ page }) => {
    const b = banner(page);
    await expect(page.locator("#banner-host .usa-banner__button")).toHaveCount(1);
    await b.button.click();
    await assertOpen(b);
  });

  test("closes when you click the button again", async ({ page }) => {
    const b = banner(page);
    await expect(page.locator("#banner-host .usa-banner__button")).toHaveCount(1);
    await b.button.click();
    await b.button.click();
    await assertClosed(b);
  });
});
