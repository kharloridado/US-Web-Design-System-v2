# Porting USWDS behavior cases to Playwright

Definition of Done gate 6: every behavior case in USWDS's own spec files (`node_modules/@uswds/uswds/packages/<package>/src/test/*.spec.js`, 414 cases) must pass against our implementation. USWDS's specs are jsdom unit tests: they inject a fixture with `body.innerHTML = TEMPLATE`, call the behavior's JavaScript API, and assert on the DOM. Our implementations (custom elements, native OutSystems Blocks) can only be tested from the outside, so each case is ported to a **black-box Playwright test** that acts as a user would and asserts on what the page shows.

## Layout

```
tests/behavior/
  harness/            shared setup (don't change without coordinating)
  <package>/<spec-name>.spec.mjs    one file per USWDS spec file
  coverage/<package>.json           ledger: every USWDS case → ported or internal
reference/fixtures/   one page per USWDS fixture template (npm run fixtures:behavior)
```

## Writing a test

```js
// Port of @uswds/uswds packages/usa-accordion/src/test/accordion.spec.js
// Fixture: packages/usa-accordion/src/test/template.html
import { test, expect } from "../harness/test.mjs";

test.describe("Accordion behavior", () => {
  test.beforeEach(async ({ fixture }) => {
    await fixture.open("usa-accordion/template"); // reference/fixtures/<package>/<template name without .html>
  });

  test("shows the second item when clicked", async ({ page }) => {
    await page.locator(".usa-accordion__button").nth(1).click();
    await expect(page.locator(".usa-accordion__button").nth(1)).toHaveAttribute("aria-expanded", "true");
  });
});
```

Rules:

1. **One Playwright test per USWDS `it(...)`, with the identical title** (copy it exactly, including quotes and punctuation). Keep USWDS's `describe` nesting as `test.describe` so full titles stay unique. A spec that runs its cases in a loop (e.g. once per init root) counts each textual `it` once; port it once.
2. **Fixture:** use the spec's own template via `fixture.open("<package>/<template>")`. USWDS starts on `document.body` at page load, which matches `Component.on(document.body)`. If the spec changes the fixture **before** calling `on()` (sets attributes, adds options, removes elements), use `fixture.open(id, { before: async (page) => { … } })`; the behaviors start after `before`. If it changes things after `on()`, do it in the test with `page.evaluate`.
3. **Act like a user:** `click()`, `page.keyboard.press("ArrowDown")`, `fill()`, `pressSequentially()`, `hover()`, `focus()`, `setInputFiles()`, `page.mouse`. USWDS's helpers that dispatch synthetic `KeyboardEvent`s map to real key presses. When the spec calls a behavior API (e.g. `Accordion.show(button)`), use the user action that produces the same state (click the button) and say so in a comment.
4. **Assert what the page shows:** `expect(locator).toHaveAttribute/toHaveText/toBeVisible/toBeFocused/toHaveValue/toHaveClass`, or `page.evaluate` for DOM reads. Keep every assertion USWDS makes. Making one stricter is fine; making one weaker is not.
5. **Time:** where a spec fixes "today" (sinon fake timers, `new Date(...)` stubs), use `await page.clock.setFixedTime(new Date(...))` or `page.clock.install({ time })` **before** `fixture.open`. Where it advances timers, use `page.clock.runFor(ms)` after `page.clock.install()`.
6. **Viewport:** jsdom `matchMedia` / `mq-polyfill` setups become `page.setViewportSize(...)` (USWDS desktop breakpoint is 1024px; the default here is 1024×768).
7. **Files:** jsdom `FileList` hacks become `locator.setInputFiles([{ name, mimeType, buffer }])`, or a drop event built with `DataTransfer` in `page.evaluate`.
8. **Uncaught page errors fail the test.** Call `fixture.allowErrors()` only where USWDS expects one.
9. **Never** use `test.skip`, `test.fixme`, `test.only`, or weaken an assertion to get a pass.

## Cases with no on-page equivalent

Some cases don't describe anything a person can see or do. Record them in the ledger as `internal` with one of these categories, and a one-line reason:

| category | when |
|---|---|
| `unit-function` | tests a pure helper (e.g. `generateDynamicRegExp`, time parsing regexes) with no DOM |
| `api-only` | calls a behavior method that has no user-facing equivalent (e.g. `on()`/`off()` re-initialization, `enhanceComboBox` called twice) |
| `invalid-markup` | asserts the error USWDS throws for malformed developer markup (`invalid-template-*`) |

Use these sparingly. If a person could observe the outcome, port it.

## Ledger: `tests/behavior/coverage/<package>.json`

```json
{
  "package": "usa-accordion",
  "cases": [
    { "spec": "usa-accordion/src/test/accordion.spec.js", "title": "shows the second item when clicked", "status": "ported", "test": "usa-accordion/accordion.spec.mjs" },
    { "spec": "usa-combo-box/src/test/generateDynamicRegExp.spec.js", "title": "…", "status": "internal", "category": "unit-function", "reason": "Pure regex builder; no DOM." }
  ]
}
```

`spec` is the path under `packages/`; `test` is the path under `tests/behavior/`. Every case listed for that spec file in `docs/acceptance/inventory.json` must appear exactly once (duplicate titles appear as many times as USWDS has them).

## Checking your work

```sh
npx playwright test tests/behavior/<package>                       # must all pass (project "reference")
BEHAVIOR_NO_START=1 npx playwright test tests/behavior/<package>   # USWDS JavaScript off: behavior tests should fail
npm run check:behavior                                             # ledger complete and every ported title found
```

With `BEHAVIOR_NO_START=1`, a test that still passes is only checking the fixture's static markup. That's fine when the USWDS case itself is about static markup; otherwise the port is missing the behavior, so fix it.
