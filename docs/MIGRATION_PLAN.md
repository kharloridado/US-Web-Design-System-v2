# USWDS → OutSystems Reactive Web: Migration Plan

**Source:** U.S. Web Design System (https://designsystem.digital.gov), `@uswds/uswds` **3.14.0** (latest on npm, Oct 2026)
**Target:** OutSystems Reactive Web (O11). ODC differences are noted where relevant.
**Goal:** Ship USWDS tokens, base styles, layouts, utilities and components as a reusable OutSystems design system: one Theme, a Patterns library and a Live Style Guide. Keep it upgrade-safe against both USWDS and OutSystems UI releases.

---

## 1. Guiding principles

1. **The repo is the source of truth, Service Studio is the deployment target.** All CSS is compiled from USWDS SCSS in this repo. Nobody hand-edits the compiled CSS in Service Studio. Local overrides live in one clearly marked override file.
2. **USWDS markup and class names are kept as they are.** USWDS's `usa-` prefix already namespaces everything, and keeping it means the official docs, a11y guidance and upgrade diffs still apply. Our OutSystems-only additions use their own prefix (`uswds-os-`).
3. **Let React own the DOM.** Reactive Web renders with React. USWDS JavaScript that moves, wraps or regenerates DOM nodes must not run on React-owned nodes (details in §6).
4. **Use the platform where it fits.** Platform widgets (Input, Dropdown, Checkbox, Button, Table, Form validation) are styled to look like USWDS rather than replaced, so developers keep data binding, validation and accessibility built-ins.
5. **Accessibility parity is a release gate.** USWDS targets Section 508 / WCAG 2.x AA. Every Block must keep the USWDS markup semantics, ARIA and keyboard behavior.

---

## 2. Target OutSystems architecture (Architecture Canvas)

```
┌──────────────────────────── End-user ────────────────────────────┐
│  Agency apps (consumers)        USWDS_StyleGuide (Live Style Guide)│
├──────────────────────────── Core ────────────────────────────────┤
│  USWDS_Templates   – screen templates + sample data (optional)    │
├──────────────────────────── Foundation ──────────────────────────┤
│  USWDS_Patterns    – UI Blocks (components), static entities,     │
│                      client actions, Web Component wrappers       │
│  USWDS_Theme       – Theme, compiled CSS, layouts, fonts, images, │
│                      sprite, tokens, OS UI variable bridge        │
│  USWDS_JS          – (optional) JS library: USWDS behaviors +     │
│                      custom elements, as Required Scripts         │
│  OutSystemsUI      – platform dependency (kept, see §3)           │
└──────────────────────────────────────────────────────────────────┘
```

| Module | Type (O11 / ODC) | Contents | References |
|---|---|---|---|
| `USWDS_Theme` | Reactive Web module, no screens / ODC Library | Theme, Layout blocks (`LayoutDefault`, `LayoutSidenav`, `LayoutBlank`), fonts, img, `sprite.svg`, token `:root`, OS UI bridge, platform widget styling | OutSystemsUI (base theme) |
| `USWDS_JS` | Reactive Web module / Library | `uswds-os.js` (selected USWDS behaviors + custom elements) as a Script resource | none |
| `USWDS_Patterns` | Reactive Web module / Library | One Block per component, static entities for variants, helper client actions | `USWDS_Theme`, `USWDS_JS` |
| `USWDS_Templates` | Reactive Web module | Screen templates (form, list/detail, landing, docs/sidenav, sign-in, 404) | Patterns, Theme |
| `USWDS_StyleGuide` | Reactive Web app | Documentation + demo screens for every token and Block; also the target for visual regression tests | All of the above |

**Rules**
- No upward or sideways references between Foundation modules except `Patterns → Theme/JS`.
- Consumer apps set **Theme = `USWDS_Theme`** at module level and reference only the Blocks they use.
- Each Block's stylesheet holds **only that component's CSS** (compiled per USWDS package, §5.4). OutSystems loads Block CSS with the module, so unused components don't ship CSS to apps that don't reference them.
- Theme, Patterns and JS are released together under one version tag (`vMAJOR.MINOR.PATCH+uswds3.14.0`).

---

## 3. Key decision: relationship with OutSystems UI

| Option | Pros | Cons |
|---|---|---|
| **A. Theme based on OutSystems UI, USWDS layered on top (recommended)** | Platform widgets, Feedback Message, Popup, Loading, OS UI patterns and validation keep working. Teams can still use OS UI patterns where USWDS has no equivalent. | Two CSS systems coexist, so a reset/variable bridge and specificity discipline are needed. |
| B. Standalone theme (no OS UI base) | Smallest CSS, pure USWDS | Many platform and OS UI widgets render unstyled or broken. Every OS UI pattern has to be rebuilt. High maintenance. |

**Recommendation: Option A.** Mitigations:
- **Variable bridge.** Map OS UI CSS variables to USWDS tokens (`--color-primary: var(--usa-color-primary)`, `--font-family: var(--usa-font-sans)`, `--space-base: var(--usa-unit-2)`, border radius, focus color, etc.). Untouched OS UI widgets then pick up the USWDS look automatically.
- **Normalize conflicts.** OS UI sets `body`, heading, link, form-control and `.btn` styles. A `_os-reset.scss` partial re-applies USWDS base typography and maps OS default classes (`.btn`, `.btn-primary`, `.form-control`, `.dropdown-container`, `.not-valid`, `.validation-message`, `.table`) to USWDS appearance.
- **No `@layer` for USWDS.** OutSystems UI's CSS is unlayered, and unlayered rules beat layered ones. Wrapping USWDS in a cascade layer would make it *lose* every conflict. Instead, control order and specificity: OS UI → USWDS compiled → bridge/reset → overrides.
- **Breakpoints.** USWDS uses `mobile-lg 480 / tablet 640 / desktop 1024 / widescreen 1400`, and OS UI uses body classes `.phone/.tablet/.desktop`. All design-system layout uses USWDS media queries. OS UI body classes are left alone for OS UI patterns only. Document this for developers.

---

## 4. Repository structure (this repo)

```
/
├─ package.json              # pins @uswds/uswds@3.14.0, sass, postcss, playwright, axe
├─ src/
│  ├─ settings/_uswds-settings.scss   # theme tokens, font/image paths, utility config
│  ├─ theme/                          # → USWDS_Theme stylesheet
│  │  ├─ index.scss                   # uswds-core + global + typography + layout-grid + utilities
│  │  ├─ _tokens-custom-props.scss    # emits :root --usa-* custom properties from token maps
│  │  ├─ _os-bridge.scss              # OS UI variable mapping
│  │  ├─ _os-reset.scss               # platform widget → USWDS styling
│  │  ├─ _layouts.scss                # LayoutDefault / LayoutSidenav / LayoutBlank
│  │  └─ _overrides.scss              # agency-specific overrides (last)
│  ├─ components/<name>/index.scss    # one entry per USWDS package → Block stylesheet
│  └─ js/
│     ├─ uswds-os.js                  # entry; imports only the behaviors we wrap
│     └─ elements/                    # custom elements (combo-box, date-picker, …)
├─ dist/                              # build output, committed for paste/upload into Service Studio
│  ├─ theme/uswds-theme.css
│  ├─ components/<name>.css
│  ├─ js/uswds-os.min.js
│  └─ assets/{fonts,img}/
├─ docs/
│  ├─ MIGRATION_PLAN.md               # this file
│  ├─ blocks/<Block>.md               # Block API spec (inputs, events, placeholders, a11y)
│  └─ CHANGELOG.md
├─ tests/
│  ├─ visual/                         # Playwright screenshots: Style Guide vs USWDS reference
│  └─ a11y/                           # axe-core + keyboard tests against Style Guide
└─ scripts/                           # build, size report, upgrade diff
```

`.oml`/`.oap` binaries are versioned via OutSystems LifeTime, not git. The repo keeps the **inputs** (SCSS/JS) and **outputs** (`dist/`) so every OutSystems release can be traced to a commit.

---

## 5. Foundations (CSS building blocks)

### 5.1 Settings (`_uswds-settings.scss`)
```scss
@use "uswds-core" with (
  $theme-font-path: "/USWDS_Theme/fonts",     // matches Resource "Deploy to target directory"
  $theme-image-path: "/USWDS_Theme/img",
  $theme-show-compile-warnings: false,
  $theme-show-notifications: false,
  $theme-respect-user-font-size: true,
  $theme-global-content-styles: false,        // opt-in via .usa-prose, avoids clobbering OS UI widgets
  $theme-global-link-styles: false,
  $theme-global-paragraph-styles: false,
  $utilities-use-important: false,
  $theme-utility-breakpoints: ("mobile-lg": true, "tablet": true, "desktop": true),
  $output-these-utilities: ( /* curated list, see 5.5 */ ),
  // agency brand: $theme-color-primary, $theme-font-type-sans, etc.
);
```
- **Fonts and images.** Upload `dist/assets/fonts/**` and `img/**` (including `sprite.svg`, `usa-icons/`, `usa-icons-bg/`) as Resources in `USWDS_Theme` with *Deploy Action = Deploy to Target Directory* (`fonts/…`, `img/…`), so the URLs resolve as `/USWDS_Theme/fonts/...`. In ODC, resource paths differ, so the path is a build variable.
- Only ship the font families and weights the brand uses (Source Sans Pro + Merriweather + Roboto Mono by default). This saves the most weight.

### 5.2 Design tokens as CSS custom properties
USWDS tokens are Sass functions (`color("primary")`, `units(2)`), not runtime variables. OutSystems developers need runtime tokens for Style Classes, inline expressions and OS UI bridging, so `_tokens-custom-props.scss` loops over the USWDS maps and emits:

| Token family | Example custom properties |
|---|---|
| Theme colors | `--usa-color-primary`, `-primary-dark`, `-primary-darker`, `-secondary…`, `-accent-cool…`, `-accent-warm…`, `-base-lightest…darkest`, `-ink`, `-error`, `-warning`, `-success`, `-info`, `-emergency`, `-disabled` |
| Spacing units | `--usa-unit-05` … `--usa-unit-15` (8px base), `--usa-unit-card`, `--usa-unit-mobile`, … |
| Typography | `--usa-font-sans/serif/mono/heading/body/ui`, `--usa-font-size-3xs…3xl`, `--usa-line-height-1…6`, `--usa-font-weight-*`, `--usa-measure-1…6` |
| Other | `--usa-radius-sm/md/lg/pill`, `--usa-focus-color`, `--usa-focus-width`, `--usa-shadow-1…5`, `--usa-z-*` |

The custom properties are **generated from** the Sass tokens, so changing a `$theme-*` setting updates both. USWDS component CSS keeps using compiled Sass values, which matches upstream exactly.

### 5.3 Global/base, typography, layout grid
Theme stylesheet = `uswds-core` (no output) + `uswds-global` + `uswds-typography` (`usa-prose`, `usa-display`, `usa-intro`, `usa-paragraph`, `usa-link`, `usa-list`) + `usa-layout-grid` (`grid-container`, `grid-row`, `grid-col-*`, `tablet:grid-col-*`, `grid-gap`) + `usa-section`, `usa-embed-container`, `usa-skipnav`.

**Grid in Service Studio:** developers use a Container with Style Classes `grid-container` → `grid-row grid-gap` → `grid-col-12 tablet:grid-col-6`. The `:` in class names is valid in OutSystems Style Classes (it's just a string). Optionally, provide a `Grid/Row/Col` Block trio with Inputs (`Span`, `TabletSpan`, `DesktopSpan`) for discoverability.

### 5.4 Per-component CSS
Each `src/components/<name>/index.scss` is `@use "../settings"; @forward "usa-<name>";`. Its output goes into the matching Block's stylesheet in `USWDS_Patterns`. The build script also emits a size report and fails if any component exceeds its budget.

### 5.5 Utilities
The full USWDS bundle is ~527 KB minified (`dist/css/uswds.min.css`), with utilities as the bulk. Plan:
- Output a **curated utility set**: spacing (`margin`, `padding`), `display`, `flex*`, `text-align`, `font`, `text-color`, `bg-color`, `border*`, `radius`, `width/max-width`, `visibility` (`usa-sr-only`). Responsive variants are on only where needed.
- **No PurgeCSS.** OutSystems builds class names dynamically in expressions, so content-scanning purge is unsafe.
- Budget target: Theme CSS under ~150 KB min (to be confirmed after the first build). Measured in CI.

### 5.6 Icons
USWDS icons use `<svg><use href="…/sprite.svg#name">`, which Reactive Web widgets can't emit directly. Provide an **`Icon` Block** (Inputs: `Name`, `Size` static entity 3–9, `AriaLabel`, `ExtendedClass`) that renders a Container and, in `OnReady` / `OnParametersChanged`, sets its `innerHTML` to the `<svg class="usa-icon">` markup. This is safe because React never renders children into that container. Decorative icons are `aria-hidden="true"`. Labelled ones get `role="img"` + `<title>`.

---

## 6. JavaScript strategy (the critical part)

USWDS JS (`uswds.js`) auto-initializes on `DOMContentLoaded` and uses delegated listeners. In Reactive Web, screens mount **after** load and React re-renders and unmounts nodes. Running it unmodified causes:
- components on screens navigated to later never initializing;
- `modal` calling `document.body.appendChild(modal)`, `combo-box` / `date-picker` / `time-picker` / `file-input` / `input-mask` wrapping or regenerating DOM, and `tooltip` restructuring its trigger wrapper. React then throws (`removeChild`/`insertBefore` on nodes it no longer owns) or silently desyncs data binding.

**Therefore: never load the global `uswds.js` / `uswds-init.js`.** Every interactive component is handled in one of three ways:

| Strategy | When | How |
|---|---|---|
| **N – Native OutSystems logic** | Simple state toggles | Local variables + `aria-*` attributes bound in the widget tree. USWDS CSS provides the visuals. No USWDS JS. |
| **W – Web Component (custom element)** | USWDS JS regenerates or relocates DOM | Light-DOM custom element (`<uswds-os-combo-box>`) so USWDS CSS still applies. It builds its own inner markup, calls `comboBox.on(this)` in `connectedCallback` and `.off(this)` in `disconnectedCallback`, and dispatches `change` events. React renders only the empty host element. The Block wrapper renders the host via an HTML Element widget, syncs `Value` via attributes in `OnParametersChanged`, and raises an `OnChange` Event to the parent. |
| **P – Platform/OS UI widget restyled** | The platform already provides the behavior | Apply USWDS classes and bridge styling. Examples: platform Table + sorting, form validation, OS UI Tooltip. |

All W components share one Required Script (`USWDS_JS/uswds-os.min.js`) that bundles only the needed USWDS behavior modules (tree-shaken from `@uswds/uswds/js/*`).

---

## 7. Component inventory & approach

Legend: **CSS** = Theme classes only (documented Style Classes). **B** = Block (markup + Inputs + Placeholders). **N / W / P** = see §6.

| USWDS component | Approach | OutSystems notes |
|---|---|---|
| Accordion | B + N | `Items` via Placeholder of `AccordionItem` Blocks. Inputs: `IsBordered`, `IsMultiselectable`, `IsExpanded`. Bound `aria-expanded` / `hidden`. |
| Alert | B | Static entity `AlertType` (Info, Warning, Error, Success, Emergency). `IsSlim`, `HasIcon`, Heading + Content placeholders. Correct `role`. |
| Banner (".gov") | B + N | Lives in `LayoutDefault`. Toggle via local var. Domain (.gov/.mil) and language Inputs. |
| Breadcrumb | B | Placeholder of `BreadcrumbItem`. `IsWrapping`. Current page `aria-current`. |
| Button | P + CSS | Style platform Button/Link with `usa-button usa-button--{secondary,accent-cool,accent-warm,base,outline,inverse,big,unstyled}`. Map OS `.btn` / `.btn-primary` too. |
| Button group | B | `IsSegmented`. Placeholder. |
| Card / Card group | B | `Layout` (Default, Flag, MediaRight), `HeaderFirst`, `MediaInset`, `MediaExdent`. Placeholders: Media, Header, Body, Footer. |
| Character count | B + N | Wraps platform Input/TextArea. `MaxLength`; message computed with `Length()`. Polite live region updated on a debounce. |
| Collection | B | List-bound. Variants: default, condensed, with media/calendar/thumbnail. |
| Combo box | B + W | Replaces OS UI DropdownSearch for USWDS fidelity. Inputs: `Options` (List of `Value/Label`), `Value`, `Placeholder`, `IsDisabled`. Event `OnChange`. |
| Date picker | B + W | `Value` (Date), `MinDate`, `MaxDate`. Converts USWDS `MM/DD/YYYY` ↔ OS Date in the wrapper. |
| Date range picker | B + W | Composes two date pickers. `StartDate` / `EndDate`. |
| File input | B + W | `Accept`, `IsMultiple`. Emits files as Binary Data via FileReader for server upload. Restyles OS Upload is an alternative. |
| Footer (slim / medium / big) | B + N | Big footer's mobile collapsible menus are native. Placeholders for nav sections. |
| Form controls: Text input, Textarea, Select, Checkbox, Radio (+ tile), Label, Hint, Error message, Fieldset/Legend, Form group | P + CSS | Platform widgets + Style Classes (`usa-input`, `usa-select`, `usa-checkbox__input`…). Map `.not-valid` → `usa-input--error` styling and `.validation-message` → `usa-error-message`. Provide a `FormGroup` Block (Label, Hint, Input placeholder, error state from `Widget.Valid`). |
| Graphic list / Icon list / Process list / Summary box / Media block | B | Static content patterns with Placeholders. |
| Header (basic / extended, mega menu) | B + N | Inside layouts. Mobile menu toggle, submenu `aria-expanded`, Escape-to-close and focus return written as small client actions. No USWDS `navigation` JS. |
| Hero | B | Background image Input (URL), Placeholders. |
| Identifier | B | In `LayoutDefault`. Agency name/logo/links Inputs. Required links block. |
| In-page navigation | B + W | Builds from headings at runtime (IntersectionObserver). Its DOM is generated inside the custom element, so it's safe. |
| Input mask | B + W | `Mask` pattern Input. Alternatively the OS UI InputMask restyled. |
| Input prefix/suffix | B | Prefix/suffix Placeholders around platform Input. |
| Language selector | B + N | Two-language / dropdown variants. Integrates with OS `SetCurrentLocale` (multilingual). |
| Layout grid | CSS | See §5.3. |
| Link, List, Prose, Typography, Display, Intro, Section, Embed container | CSS | Theme classes. Documented in the Style Guide. |
| Memorable date | B | Three inputs (month select, day, year) → `OnChange(Date)` with validation. |
| Modal | B + N | **Rebuilt.** Renders in place (fixed overlay, no move to body), focus trap + `inert` on siblings + Escape + focus return, `IsForcedAction`, `IsLarge`. Do **not** use USWDS modal JS. (Restyling OS Popup is the fallback.) |
| Pagination | B | Inputs aligned with the OS UI Pagination pattern: `StartIndex`, `MaxRecords`, `TotalCount`, `MaxVisiblePages`. Event `OnNavigate(NewStartIndex)`. Unbounded variant. |
| Range slider | B | Native `<input type=range>` via platform Input + `aria-valuetext` expression. |
| Search | B | Big / default / small. Wraps platform Input + Button inside a Form. `OnSearch` event. |
| Side navigation | B | Nested list Blocks. `IsCurrent`. Used in `LayoutSidenav`. |
| Site alert | B | Above banner. Info / Emergency, slim, no-icon. |
| Skipnav | CSS + N | First element in every layout, targets `#main-content`. A tiny client action moves focus (SPA-safe). |
| Step indicator | B | Inputs `Steps` (List of Text), `CurrentStep`, `ShowLabels`, `ShowCounters`, `IsCentered`, `IsSmall`. |
| Table | P + CSS | Platform Table + `usa-table` classes (`--borderless`, `--striped`, `--compact`, `--stacked`, scrollable wrapper). Sorting uses the platform Table `OnSort` styled as USWDS sort buttons. No USWDS table JS. |
| Tag | B | `IsBig`. |
| Time picker | B + W | Built on combo box. `MinTime`, `MaxTime`, `Step`. Returns OS Time. |
| Tooltip | P / B + N | Native: wrapper span + `aria-describedby` + hover/focus local var + Escape. Position Input (top/right/bottom/left). |
| Validation (password checklist) | B + N | Rules list Input, live checklist bound to the input value. |

**Block API conventions** (all Blocks)
- Inputs: `ExtendedClass` (Text) on every Block. Variants as **static entities** (`ButtonVariant`, `AlertType`, `CardLayout`, …), not free text. Booleans prefixed `Is` / `Has`.
- Events: `On<Action>` (mandatory only when the Block can't work without it).
- Placeholders are named for their content (`Header`, `Body`, `Footer`, `Actions`).
- No server calls, aggregates or business logic inside Foundation Blocks.
- IDs: generate unique IDs from the Block's own `Id` runtime property for `aria-controls` / `aria-describedby`, never hard-coded.
- Each Block has a doc page in `docs/blocks/` and a demo screen in the Style Guide.

---

## 8. Layouts & screen templates

| Layout Block | Structure |
|---|---|
| `LayoutDefault` | Skipnav → (SiteAlert placeholder) → Banner → Header (basic/extended Input) → `<main id="main-content">` Content placeholder → Footer (slim/medium/big Input) → Identifier |
| `LayoutSidenav` | As above, with `grid-row` side navigation column (desktop:grid-col-3) + content column |
| `LayoutBlank` | Skipnav + main, for sign-in, error and print screens |

Screen templates (in `USWDS_Templates`, exposed in the New Screen dialog): Landing page, Documentation page, Form (single and multi-step with Step indicator), List with search + pagination + table, Detail, Sign-in, 404 / error. These mirror the USWDS page templates.

---

## 9. Phased delivery

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Setup** (1 wk) | Confirm decisions (§12). Repo scaffold, build pipeline, CI (build + size budget), create empty OS modules with naming and dependencies. | `npm run build` produces `dist/`. Modules published in DEV. |
| **1. Foundations** (2–3 wks) | Settings, tokens → custom properties, fonts/images/sprite resources, global + typography + grid + curated utilities, OS UI bridge + reset, platform widget styling (buttons, form controls, validation states, table), Icon Block. | Platform widgets and OS UI defaults visually match USWDS on a test screen. Token specimen page in the Style Guide. |
| **2. Layouts & site chrome** (1–2 wks) | Skipnav, Site alert, Banner, Header (basic/extended + mega menu), Footer variants, Identifier, Side nav, the 3 layouts. | Keyboard and screen reader pass on all layouts. Mobile menu works across navigation. |
| **3. Static components** (2 wks) | Alert, Breadcrumb, Button group, Card, Collection, Graphic/Icon/Process list, Hero, Media block, Summary box, Tag, Step indicator, Pagination, Search, Input prefix/suffix, FormGroup, Memorable date, Range. | Visual diff ≤ threshold vs USWDS reference. axe has 0 serious/critical issues. |
| **4. Stateful native** (2 wks) | Accordion, Character count, Modal, Tooltip, Language selector, Validation checklist, Footer/Header behaviors. | Focus management tests pass. No React console errors across navigate/unmount cycles. |
| **5. JS-enhanced (Web Components)** (3 wks) | `USWDS_JS` bundle. Combo box, Date picker, Date range picker, Time picker, File input, Input mask, In-page navigation. | Two-way binding verified. Mount/unmount stress test (navigate 50×) without leaks or errors. |
| **6. Style Guide, templates, hardening** (2 wks) | Style Guide app complete, screen templates, docs, CHANGELOG, LifeTime release of v1.0.0, developer onboarding guide. | Pilot app built on templates. Sign-off from accessibility review. |

Phases 3–5 can run in parallel with 2–3 developers once Phase 1 is done.

---

## 10. Quality gates

- **Visual regression:** Playwright screenshots of each Style Guide demo screen vs the same markup rendered from USWDS reference (package `.twig` templates / Storybook), at 320 / 640 / 1024 / 1400 px.
- **Accessibility:** axe-core on every demo screen. Scripted keyboard paths (Tab order, Escape, arrow keys for combo box/date picker). Manual NVDA + VoiceOver pass per component before release. Contrast is checked against brand tokens; brand-color conflicts are raised to design, not silently changed.
- **Runtime:** no React warnings or errors in console. Memory and listener check on mount/unmount for W components.
- **Performance:** CSS/JS size budgets in CI. Only used font weights shipped. Lighthouse on `LayoutDefault` template.
- **Code review checklist** for Service Studio: no inline styles, no hard-coded colors or spacing (use tokens/utilities), `ExtendedClass` present, static entities for variants, a11y attributes bound.

---

## 11. Upgrade & governance

- **USWDS upgrades:** bump the version in `package.json` → `npm run build` → `scripts/upgrade-diff` compares compiled CSS per component and changed JS modules → update only the affected Block stylesheets/scripts → run the visual and a11y suites → release.
- **OutSystems UI upgrades:** re-test the bridge/reset page and visual suite. The bridge relies on OS UI CSS variables, which is the most stable surface.
- **Semantic versioning** of the design system. Breaking Block API changes need a major version + migration note.
- **Contribution model:** new or changed components start as an issue with a Block API proposal in `docs/blocks/`, then SCSS/JS in the repo, then Service Studio, then Style Guide demo, then tests.
- **Ownership:** one design-system owner for Foundation modules. Consumer teams never edit Foundation modules. They use `ExtendedClass` / app-level theme overrides.

---

## 12. Decisions to confirm

1. **Platform:** O11 Reactive Web or ODC? (Affects module types, resource paths, Library packaging.)
2. **OutSystems UI coexistence:** Option A (recommended) vs standalone theme.
3. **Brand customization:** stock USWDS tokens, or agency theme colors/fonts? (Needed before Phase 1.)
4. **Component priority:** which components the first pilot app needs, to reorder Phases 3–5.
5. **Date/combo strategy:** USWDS Web Components (recommended for fidelity) vs restyled OS UI DatePicker/DropdownSearch (less code, lower fidelity).
6. **Multilingual:** is Spanish (USWDS language selector) in scope?
