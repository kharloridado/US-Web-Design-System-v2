# USWDS → OutSystems 11 Reactive Web: Migration Plan

**Source:** U.S. Web Design System (https://designsystem.digital.gov), `@uswds/uswds` **3.14.0**
**Target:** OutSystems 11, Reactive Web
**Scope:** 100%, end to end. Every USWDS foundation (tokens, typography, color, spacing, grid, utilities, icons, fonts), every component, every page template, plus layouts, an app template and a Live Style Guide.
**Architecture:** **Standalone USWDS theme, not based on OutSystems UI** (see §3).
**Brand:** stock USWDS tokens. **Language:** English only for v1.
**Done:** the entire USWDS runs in O11, built exactly as it is: 208 variants, 414 behavior cases, 0 CSS differences. Measured by seven gates in [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md).

---

## 1. Guiding principles

1. **The repo is the source of truth, Service Studio is the deployment target.** All CSS and JS are compiled here from USWDS sources. Nobody hand-edits compiled output in Service Studio.
2. **USWDS markup and class names are kept as they are** (`usa-*`, `grid-*`, utilities). Upstream docs, a11y guidance and upgrade diffs then apply 1:1. OutSystems-only additions use the `uswds-os-` prefix.
3. **USWDS is the only design system in the runtime.** Design-system modules do not reference OutSystems UI. Platform widgets are styled by our theme.
4. **Let React own the DOM.** USWDS JS that moves, wraps or regenerates DOM nodes never runs on React-owned nodes (§7).
5. **Accessibility parity is a release gate.** USWDS markup semantics, ARIA and keyboard behavior are preserved in every Block.

---

## 2. Target architecture (Architecture Canvas)

```
┌───────────────────────────── End-user ─────────────────────────────┐
│  Agency apps (consumers)          USWDS_StyleGuide (Live Style Guide) │
│  USWDS_AppTemplate  (custom O11 app template → "New Application")    │
├───────────────────────────── Core ─────────────────────────────────┤
│  USWDS_Templates   – page templates (landing, docs, sign-in, forms, │
│                      error…) exposed in "New Screen"                │
├───────────────────────────── Foundation ───────────────────────────┤
│  USWDS_Patterns    – UI Blocks for every component, static entities,│
│                      USWDS behaviors + custom elements (Scripts)    │
│  USWDS_Theme       – standalone Theme: compiled CSS, platform-      │
│                      widget styling, layouts, site chrome, fonts,   │
│                      img, sprite, shared client actions             │
└──────────────────────────────────────────────────────────────────┘
        (no reference to OutSystemsUI from any of these modules)
```

| Module | Contents | References |
|---|---|---|
| `USWDS_Theme` | Theme (Base Theme = none), compiled USWDS CSS, platform widget contract CSS (§4), `:root` tokens, fonts, images, `sprite.svg`, Layout blocks **and the site-chrome Blocks they use** (Skipnav, Banner, Header, Footer, Identifier, Side navigation), and the **shared client actions** both layers need: `FocusFirstError`, `ScrollToElement`, `SetHtmlLang`, `TrapFocus`/`ReleaseFocus`, `SetInert`, `AnnounceLiveRegion`, `GetBreakpoint` | none |
| `USWDS_Patterns` | One Block per component, static entities for variants/sizes, and the `uswds-os` Script resources (selected USWDS behavior modules + light-DOM custom elements) used by the Web Component Blocks | Theme |
| `USWDS_Templates` | Screen templates from every USWDS page template | Patterns, Theme |
| `USWDS_AppTemplate` | Custom app template: Common flow (layouts, login, error/invalid-permissions screens, exception handler), Theme preset | Patterns, Theme, Templates |
| `USWDS_StyleGuide` | Docs + demo screens for every token, utility, Block and template. Also the target for automated tests | All |

**Why two Foundation modules, not four:** an earlier draft split out `USWDS_JS` and `USWDS_Utils`. The scripts are only used by Web Component Blocks in Patterns, and OutSystems loads a Script only on screens that use a Block requiring it, so a separate module added a dependency and a publish step for nothing. The client actions can't go in Patterns, because the Theme's Header, Skipnav and layouts need them and Theme must not reference Patterns, so they live in Theme, which Patterns already references.

**O11 application:** the Foundation and Core modules live in the application **US Web Design System Sandbox**. The Style Guide is a separate application.

**Rules:** the only Foundation reference is `Patterns → Theme`. Consumer apps use Theme = `USWDS_Theme` and must not reference OutSystems UI (enforced in code review / Architecture Dashboard). Releases are versioned together as `vX.Y.Z+uswds3.14.0`.

---

## 3. Based on OutSystems UI vs standalone

USWDS is a complete design system, so the question is whether OutSystems UI (OSUI) adds anything once *every* USWDS piece is migrated.

### 3.1 What OSUI actually provides in an O11 Reactive app
1. **Styling for platform widget output:** Button, Input, TextArea, Dropdown, Checkbox, Radio, Switch, Upload, Table, List, Popup, plus runtime classes such as `.not-valid`, `.validation-message`, feedback messages (`.feedback-message-*`), and Service Studio width classes (`.ThemeGrid_Width*`, `.ThemeGrid_MarginGutter`, `.OSFillParent`, `.OSInline`).
2. **The pattern library:** Tabs, Sidebar, DatePicker (Flatpickr), DropdownSearch (Virtual Select), RangeSlider (noUiSlider), Carousel, Notification, etc.
3. **Layouts and the default Common flow** (LayoutTopMenu/SideMenu, Menu, login screens) used by Service Studio's built-in app and screen templates.
4. **Utility client actions and body classes:** `.phone/.tablet/.desktop`, orientation, `.is-rtl`, skip-to-content, scroll and focus helpers.
5. **Service Studio tooling:** Theme Editor, OSUI screen templates, Styles Editor color/spacing presets, all driven by OSUI variables and classes.
6. **The dependency of most Forge UI components.**

### 3.2 Comparison

| Dimension | Based on OSUI | **Standalone (chosen)** |
|---|---|---|
| CSS loaded | OSUI theme + USWDS + bridge/reset layer | USWDS + platform-widget contract only |
| Style conflicts | Constant: OSUI sets `body`, headings, links, forms, `.btn`, `.table`. Needs a reset layer and specificity rules, and `@layer` can't be used (unlayered OSUI beats it) | None. One cascade, USWDS globals can be switched on |
| Visual fidelity to USWDS | Drifts wherever OSUI wins specificity or a dev drops in an OSUI pattern | 1:1 with USWDS reference |
| Accessibility | Mixed: OSUI patterns have their own ARIA/keyboard models next to USWDS's | One vetted model (USWDS) |
| Upgrade risk | Two upstreams. Every OSUI release can break the bridge/reset | Only USWDS upgrades. OSUI releases are irrelevant |
| Developer guardrails | Devs can mix OSUI patterns and USWDS freely, which causes inconsistency | Only USWDS Blocks available, so consistency by construction |
| Up-front effort | Lower: platform widgets and runtime classes come pre-styled | Higher: we own the platform widget contract (§4), layouts, Common flow, app template and the utilities we need |
| Service Studio tooling | Theme Editor and OSUI templates work | Theme Editor/OSUI templates unavailable. Replaced by our app template, screen templates and Style Guide. Styles Editor presets don't map to USWDS, so devs use USWDS utility classes |
| Forge components | OSUI-based Forge components work | OSUI-based Forge components render unstyled. Each one is evaluated: avoid, restyle, or rebuild |
| Platform widget behavior | Unchanged | Unchanged: data binding, validation, events are platform features, not OSUI. Only the *look* moves to our CSS |

### 3.3 Why standalone wins for a 100% migration
OSUI's main value is filling gaps. A full USWDS migration leaves no gaps, so what remains is cost: two CSS systems, a reset layer to maintain, two upgrade streams and an easy path for developers to drift off-system. The extra effort of going standalone is bounded and done once: the platform widget contract (§4), layouts and Common flow, and a handful of utility actions.

**Earlier draft correction:** going standalone does **not** break platform widgets. They keep working and only render unstyled until our contract CSS covers them.

---

## 4. Platform widget contract (what we take over from OSUI)

**Phase 0 spike:** create a theme with no base theme, place every platform widget and runtime state on one screen, and record the exact DOM/classes produced. That inventory becomes `src/theme/platform/` and a Style Guide test page. Mapping target:

| Platform output | Styled as (USWDS) | Notes |
|---|---|---|
| Button / Link (button-styled) | `usa-button` + modifiers | Default platform `.btn` / `.btn-primary` also mapped, so an unstyled Button still looks right |
| Input (text, email, number, password, phone, search) | `usa-input`, `usa-input--{2xs…xl}` sizes | Password gets the USWDS show/hide toggle Block (§8) |
| TextArea | `usa-textarea` | |
| Dropdown (`<select>`) | `usa-select` | |
| Checkbox / RadioButton / RadioGroup | `usa-checkbox`, `usa-radio` (+ `--tile`) | USWDS needs `input + label` siblings. `Checkbox`/`Radio` Blocks guarantee the structure |
| Switch | Not supported (no USWDS equivalent) | Replaced by Checkbox. Flagged in code review |
| Upload | `usa-file-input` look | Full behavior via File input Block (W) |
| Table + header sort | `usa-table` + variants, USWDS sort button visuals | Uses platform `OnSort`, not USWDS table JS |
| List / ListItem | Unstyled list (`usa-list--unstyled`) | |
| Popup | `usa-modal` look | Prefer the Modal Block. Popup styled for compatibility |
| Form validation `.not-valid`, `span.validation-message` | `usa-input--error`, `usa-error-message`, form-group error state | Plus `FocusFirstError` utility on submit |
| Feedback messages (`FeedbackMessage` action) | Slim `usa-alert` (info/success/warning/error), toast position | Keeps the built-in action usable |
| Width / layout classes (`ThemeGrid_Width1…12`, `ThemeGrid_MarginGutter`, `OSFillParent`, `OSInline`, `OSAutoMarginTop`) | Mapped to USWDS grid widths and gutters | So the Width property in Service Studio still works |
| Icon widget (Font Awesome) | **Not supported** | Use the `Icon` Block (USWDS sprite). Flagged in code review |
| Disabled / read-only / focus states | USWDS `:disabled`, focus ring tokens | |
| Loading / balloon / tooltip runtime bits | Per spike findings | |

---

## 5. Repository structure

```
/
├─ package.json                       # @uswds/uswds@3.14.0, sass, postcss, playwright, axe-core
├─ src/
│  ├─ settings/_uswds-settings.scss
│  ├─ theme/
│  │  ├─ index.scss                   # full USWDS global/typography/grid/utilities
│  │  ├─ _tokens-custom-props.scss    # :root --usa-* from USWDS token maps
│  │  ├─ platform/                    # §4 platform widget contract, one partial per widget
│  │  ├─ _layouts.scss
│  │  └─ _overrides.scss              # agency overrides, last
│  ├─ blocks.json                    # usa-* packages compiled as Block stylesheets
│  ├─ templates/<template>.scss            # template-specific CSS (if any)
│  └─ js/{uswds-os.js, elements/, utils/}
├─ dist/                              # committed build output for Service Studio
│  ├─ theme/uswds-theme.css
│  ├─ blocks/<Block>.css
│  ├─ manifest.json                  # package → Block, required Blocks, sizes, assets
│  ├─ js/uswds-os.min.js
│  └─ assets/{fonts,img}/
├─ docs/
│  ├─ MIGRATION_PLAN.md
│  ├─ blocks/<Block>.md               # Block API specs
│  ├─ templates/<Template>.md
│  ├─ developer-guide.md              # how to build screens with the system, banned widgets
│  └─ CHANGELOG.md
├─ reference/                         # USWDS twig templates rendered to static HTML (test baseline)
├─ tests/{visual,a11y,runtime}/
└─ scripts/                           # build.mjs (+ coverage check), check-parity.mjs, later: upgrade diff, reference render
```

`.oml`/`.oap` binaries are versioned in LifeTime. Each OutSystems release notes the repo commit it was built from.

---

## 6. Foundations

### 6.1 Settings
```scss
@use "uswds-core" with (
  $theme-font-path: "/USWDS_Theme/fonts",     // Resource "Deploy to Target Directory" = fonts
  $theme-image-path: "/USWDS_Theme/img",
  $theme-show-compile-warnings: false,
  $theme-show-notifications: false,
  $theme-respect-user-font-size: true,
  $theme-global-border-box-sizing: true,
  $theme-global-content-styles: true,         // safe now: no OSUI to clobber
  $theme-global-link-styles: true,
  $theme-global-paragraph-styles: true,
  $utilities-use-important: true,             // OS loads Block CSS after the Theme; keeps utilities winning
  // brand: stock USWDS tokens (decision #4). Agency theming later goes here only.
);
```

### 6.2 Foundations checklist (all in scope)
| Foundation | Deliverable |
|---|---|
| Color | System color tokens + theme tokens → `--usa-color-*`. Style Guide specimen with contrast "magic number" guidance |
| Typography | Font families/sizes/weights/line-heights/measure tokens, `usa-prose`, `usa-display`, `usa-intro`, `usa-paragraph`. Fonts as Resources (only shipped weights) |
| Spacing units | `units()` scale → `--usa-unit-*`. Spacing utilities |
| Layout grid | `grid-container`, `grid-row`, `grid-col-*`, responsive prefixes, `grid-gap`, `grid-offset`. Optional `Grid/Row/Col` Blocks |
| Utilities | **Full USWDS utility set** incl. responsive, state (hover/active/focus) variants. Size measured in CI. Utilities can be trimmed later from usage data, never by content-scanning purge (OutSystems builds class names dynamically) |
| Icons | `Icon` Block rendering `<svg class="usa-icon"><use href="/USWDS_Theme/img/sprite.svg#…">` into a non-React-owned container. Full icon set + `usa-icon-list` |
| Focus, shadows, radius, z-index, borders, opacity | Tokens + utilities |
| Breakpoints | `mobile-lg 480 / tablet 640 / desktop 1024 / widescreen 1400`. `GetBreakpoint` utility replaces OSUI device classes |
| Dark background | `usa-dark-background` |

---

## 7. JavaScript strategy

**Never load the global `uswds.js` / `uswds-init.js`.** It initializes once at `DOMContentLoaded` (Reactive screens mount later), and several modules mutate React-owned DOM: `modal` calls `document.body.appendChild`, `tooltip` restructures its trigger, and `combo-box`, `date-picker`, `time-picker`, `file-input`, `input-mask` rebuild markup.

| Strategy | When | How |
|---|---|---|
| **N – Native OutSystems** | Simple state | Local vars, bound `aria-*`/`hidden`, shared client actions in `USWDS_Theme`. USWDS CSS provides the visuals |
| **W – Web Component** | USWDS JS rebuilds DOM | Light-DOM custom element (`<uswds-os-…>`): builds inner markup, `behavior.on(this)` in `connectedCallback`, `.off(this)` in `disconnectedCallback`, emits `change`. The Block renders only the host element (HTML Element widget), syncs Inputs in `OnParametersChanged`, raises `OnChange` |
| **P – Platform widget** | Platform has the behavior | Styled via §4 contract |

---

## 8. Component inventory (all 47 USWDS components)

Legend: **CSS** = Theme classes only. **B** = Block. **N / W / P** = §7.

| Component | Approach | Key Block API / notes |
|---|---|---|
| Accordion | B + N | `AccordionItem` placeholder. `IsBordered`, `IsMultiselectable`, item `IsExpanded` |
| Alert | B | `AlertType` static entity (Info, Warning, Error, Success, Emergency), `IsSlim`, `HasIcon`, `role` per type |
| Banner | B + N | `.gov`/`.mil`, language. Inside layouts |
| Breadcrumb | B | Items placeholder, `IsWrapping`, `aria-current` |
| Button | P + B | Platform Button styled. `Button` Block for variants (`ButtonVariant`: Default, Secondary, AccentCool, AccentWarm, Base, Outline, Inverse, Unstyled; `IsBig`) |
| Button group | B | `IsSegmented` |
| Card | B | `CardLayout` (Default, Flag, FlagMediaRight), `HeaderFirst`, `MediaInset/Exdent`. Placeholders Media/Header/Body/Footer |
| Character count | B + N | `MaxLength`, debounced polite live region |
| Checkbox | P + B | Tile, description, indeterminate |
| Collection | B | Default, condensed, media, calendar, thumbnail |
| Combo box | B + W | `Options`, `Value`, `Placeholder`, `IsDisabled`, `OnChange` |
| Date picker | B + W | `Value` (Date), `MinDate`, `MaxDate`. Date ↔ `MM/DD/YYYY` conversion |
| Date range picker | B + W | `StartDate`, `EndDate` |
| File input | B + W | `Accept`, `IsMultiple`, `OnChange(Files)` → Binary Data |
| Footer | B + N | Slim / medium / big. Collapsible mobile menus |
| Form | CSS + B | `usa-form`, `--large`. `FormGroup` Block (label, hint, error from `Widget.Valid`) |
| Graphic list | B | |
| Header | B + N | Basic / extended / mega menu. Mobile menu, submenus, Escape + focus return |
| Icon | B | §6.2 |
| Icon list | B | Sizes, colors, rich content |
| Identifier | B | Agency info, required links |
| In-page navigation | B + W | Built from headings, IntersectionObserver |
| Input mask | B + W | `Mask` |
| Input prefix or suffix | B | Placeholders around platform Input |
| Language selector | B + N | Two-language / dropdown. `SetCurrentLocale` + `SetHtmlLang` |
| Link | CSS | Incl. external link icon |
| List | CSS | Ordered, unordered, unstyled |
| Memorable date | B | Month select + day + year → `OnChange(Date)` |
| Modal | B + N | Rendered in place, `TrapFocus` + `SetInert` + Escape + focus return, `IsLarge`, `IsForcedAction` |
| Pagination | B | `StartIndex`, `MaxRecords`, `TotalCount`, `MaxVisiblePages`, `OnNavigate`. Unbounded variant |
| Password (show/hide) | B + N | Toggles input `type`, announced state |
| Process list | B | |
| Prose | CSS | `usa-prose` |
| Radio buttons | P + B | Tile, description |
| Range slider | B | Native range + `aria-valuetext` |
| Search | B | Big / medium / small, `OnSearch` |
| Select | P | |
| Side navigation | B | Nested, `IsCurrent` |
| Site alert | B | Info / emergency, slim, no-icon |
| Skipnav | B + N | First element of every layout → `#main-content`, SPA-safe focus |
| Step indicator | B | `Steps`, `CurrentStep`, `ShowLabels`, `ShowCounters`, `IsCentered`, `IsSmall` |
| Summary box | B | |
| Table | P + CSS | Borderless, striped, compact, stacked, scrollable, sortable via platform `OnSort` |
| Tag | B | `IsBig` |
| Text input / Textarea | P | Sizes, error, success states |
| Time picker | B + W | `MinTime`, `MaxTime`, `Step` → OS Time |
| Tooltip | B + N | Position, hover/focus, Escape, `aria-describedby` |
| Validation | B + N | Live requirements checklist |
| Fieldset / Legend / Label / Hint / Error message | P + CSS | Covered by form contract and `FormGroup` |
| Typography, Display, Intro, Section, Embed container, Media block, Hero | CSS / B | Hero and Media block as Blocks |

**Block API conventions:** `ExtendedClass` on every Block. Variants as static entities. Booleans `Is`/`Has`. Events `On<Action>`. Named placeholders. No server logic in Foundation. Unique ARIA IDs derived from the Block `Id`. Each Block has a `docs/blocks/` page and a Style Guide demo.

---

## 9. Layouts, page templates, app template

**Layout Blocks (`USWDS_Theme`):** `LayoutDefault` (Skipnav → SiteAlert placeholder → Banner → Header → `main#main-content` → Footer → Identifier), `LayoutSidenav` (docs layout), `LayoutBlank` (auth/error/print).

**Screen templates (`USWDS_Templates`, one per USWDS page template, English only for v1):**

| USWDS template | OutSystems screen template |
|---|---|
| `usa-landing` | Landing page |
| `usa-documentation` | Documentation page (sidenav + in-page nav) |
| `usa-sign-in` | Sign in |
| `usa-sign-in--multiple` | Sign in (multiple options) |
| `usa-create-account` | Create account |
| `usa-password-reset-form` | Password reset |
| `usa-name-form` | Name form |
| `usa-address-form` | Address form |
| `usa-error` | Error / 404 page |
| *(added)* | List + search + table + pagination, Detail, Multi-step form with step indicator |

**`USWDS_AppTemplate`:** custom O11 app template so new apps start with `USWDS_Theme`, the layouts, a USWDS Common flow (Menu → Header, Login/Create account/Reset screens wired to platform user actions, InvalidPermissions, error screen, exception handler) and **no OutSystems UI dependency**.

---

## 10. Phased delivery (indicative, 2–3 front-end devs)

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Setup & spike** (1–2 wks) | Repo pipeline + CI ✅, module skeletons, **platform widget DOM spike** (§4), reference renderer for every USWDS story (Definition of Done gates 4–5) ✅ | `npm run build` → `dist/` ✅. Parity check: 0 missing/duplicated rules vs official USWDS ✅. Spike inventory documented ([setup guide](phase-0-outsystems-setup.md)) |
| **1. Foundations** (3 wks) | Settings, tokens, fonts/images/sprite, global + typography + grid + full utilities, Icon Block, shared client actions | Token/utility specimen pages in Style Guide |
| **2. Platform widget contract** (2 wks) | All of §4 | Every platform widget/state matches USWDS on the contract test page |
| **3. Layouts & site chrome** (2 wks) | Skipnav, Site alert, Banner, Header (all variants), Footer (all), Identifier, Side nav, Layout Blocks | Keyboard + screen-reader pass. Menus survive navigation |
| **4. Static components** (3 wks) | All **B** components without behavior | Visual diff vs reference within threshold. axe 0 serious/critical |
| **5. Stateful native** (2 wks) | All **B + N** components | Focus-management tests. No React errors on mount/unmount |
| **6. Web Components** (3–4 wks) | `uswds-os` Scripts in Patterns + all **B + W** components | Two-way binding. 50× navigate stress test without leaks. **Custom elements done ✅**: all 7 in `dist/js/uswds-os.min.js`, matching USWDS on all 32 stories (`npm run test:elements`). Remaining: build the Blocks in Service Studio per [docs/blocks/web-components.md](blocks/web-components.md) |
| **7. Templates & app template** (2–3 wks) | All page templates, extra templates, Common flow, `USWDS_AppTemplate` | New app from template runs end-to-end with no OSUI |
| **8. Style Guide & hardening** (2 wks) | Style Guide complete, docs, developer guide, v1.0.0 release, pilot app | **All seven Definition of Done gates pass.** Accessibility sign-off. Pilot app approved |

Total ≈ **20–23 weeks of effort** if phases run one after another. Phases 4–6 can overlap once Phase 2 is done, which shortens the calendar with 2–3 developers.

---

## 11. Quality gates

- **Visual regression:** Playwright compares each Style Guide demo and template screen to the USWDS reference HTML at 320 / 480 / 640 / 1024 / 1400 px.
- **Accessibility:** axe-core on every screen. Scripted keyboard paths. Manual NVDA + VoiceOver per component. Brand-color contrast conflicts are raised to design, not silently changed.
- **Runtime:** zero React warnings/errors. Listener/memory check on Web Components.
- **Performance:** CSS/JS budgets reported per build. Only used font weights. Lighthouse on templates.
- **Guardrails:** code-review checklist + Architecture Dashboard rules. No OSUI references, no platform Icon/Switch widgets, no inline styles or hard-coded colors/spacing, `ExtendedClass` present, static entities for variants.

---

## 12. Upgrade & governance

- **USWDS upgrade:** bump version → build → `scripts/upgrade-diff` (CSS per component, changed JS modules, template diffs) → update affected Blocks → full test suite → release.
- **OutSystems Platform upgrade:** re-run the §4 spike page and the visual suite. Platform widget DOM is the only coupling point.
- **SemVer** for the system. Breaking Block API changes need a major version + migration notes.
- **Contribution flow:** issue + Block API proposal → SCSS/JS in repo → Service Studio → Style Guide → tests → release.
- **Forge policy:** OSUI-based Forge components need design-system approval (restyle or rebuild).

---

## 13. Decisions

| # | Decision | Status |
|---|---|---|
| 1 | Platform | **O11 Reactive Web**, confirmed |
| 2 | Scope | **100%**: all foundations, components, templates, layouts, app template, confirmed |
| 3 | OutSystems UI | **Standalone (no OSUI)**, confirmed |
| 4 | Brand | **Stock USWDS tokens**, confirmed |
| 5 | Multilingual | **English only for v1.** Spanish template variants deferred. The Language selector component is still built (100% component scope) |
| 6 | Existing apps | **None.** No OSUI migration playbook needed |
