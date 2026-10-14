# Phase 0: OutSystems 11 setup & platform spike

This guide covers the Service Studio half of Phase 0. The repo half (build pipeline, parity check, CI) is done: `npm ci && npm run ci` produces everything below in `dist/`.

> Never edit pasted CSS in Service Studio. Change the SCSS in `src/`, run `npm run build`, and paste again. `dist/manifest.json` records the USWDS version and which file goes where.

---

## 1. Create the modules

Create one application, **USWDS Design System**, for the Foundation/Core modules, and a separate application, **USWDS Style Guide**, for the Live Style Guide. All modules are **Reactive Web** modules.

| Module | Create as | Screens | References (Manage Dependencies) |
|---|---|---|---|
| `USWDS_Theme` | Reactive Web module (blank) | none | none. **Remove the OutSystemsUI reference** that new modules get by default |
| `USWDS_Patterns` | Reactive Web module (blank) | none | `USWDS_Theme` |
| `USWDS_Templates` | Reactive Web module | template screens (Phase 7) | `USWDS_Patterns`, `USWDS_Theme` |
| `USWDS_StyleGuide` | Reactive Web app module | yes | all of the above |

Module names matter: compiled CSS references fonts and images at `/USWDS_Theme/...`. If you rename `USWDS_Theme`, change `THEME_MODULE` in `scripts/build.mjs` and `$theme-font-path` / `$theme-image-path` in `src/settings/_uswds-settings.scss`, then rebuild.

Delete anything the module template generated from OutSystems UI (Common flow, layouts, the OutSystemsUI theme reference) so nothing depends on OutSystemsUI. Architecture Dashboard / the Manage Dependencies dialog should show no OutSystemsUI producer.

## 2. Theme (`USWDS_Theme`)

1. Interface → Themes → create theme **USWDS**.
2. Theme properties: **Base Theme = (none)**.
3. Open the theme Style Sheet and paste the full contents of **`dist/theme/uswds-theme.min.css`** (~510 KB).
   - Pasting into the theme stylesheet (rather than `@import`-ing a resource) means the CSS is served with OutSystems' version-stamped URL, so browsers pick up new versions after every publish.
   - **Spike check:** confirm Service Studio's editor accepts and saves a stylesheet this size. Fallback: upload it as a Resource (`css/uswds-theme.min.css`) and put `@import url("/USWDS_Theme/css/uswds-theme.min.css?v=<uswdsVersion>-<build>");` in the theme stylesheet, bumping the query on every release.
4. Set the module's default theme to **USWDS**. In consumer modules, set Module → Theme = `USWDS_Theme.USWDS`.

## 3. Resources (fonts, images)

Every file in `dist/assets/` (listed in `dist/manifest.json` → `assets`) becomes a Resource in `USWDS_Theme`:

- Data → Resources → Import Resource.
- **Deploy Action: Deploy to Target Directory.**
- **Target Directory:** the file's folder under `dist/assets/`, e.g.
  - `fonts/source-sans-pro` for `dist/assets/fonts/source-sans-pro/sourcesanspro-regular-webfont.woff2`
  - `img` for `dist/assets/img/sprite.svg`
  - `img/usa-icons` for `dist/assets/img/usa-icons/close.svg`

The build copies **only** files the CSS references, plus images used in markup (`sprite.svg`, banner/identifier images), so nothing unused is deployed. After publishing, these URLs must return 200:

```
/USWDS_Theme/fonts/source-sans-pro/sourcesanspro-regular-webfont.woff2
/USWDS_Theme/fonts/merriweather/Latin-Merriweather-Bold.woff2
/USWDS_Theme/img/sprite.svg
/USWDS_Theme/img/usa-icons/close.svg
```

## 4. Block stylesheets (`USWDS_Patterns`)

Each entry in `dist/manifest.json` → `blocks` is one Block. Paste `dist/blocks/<Block>.min.css` into that Block's Style Sheet. Blocks in `requires` (e.g. TimePicker requires ComboBox) must be used inside that Block, so their CSS loads with it.

Site chrome (Banner, Header, Footer, Identifier, Skipnav, Side navigation) and form/button/table/alert/modal primitives are styled by the Theme, so their Blocks have no stylesheet of their own. Those Blocks live in `USWDS_Theme` next to the Layout blocks.

## 5. Platform widget spike (blocks Phase 2)

Goal: record exactly what O11 Reactive renders, with **Base Theme = none**, so the platform widget contract (`src/theme/platform/`) targets real markup.

In `USWDS_StyleGuide`, create a screen `PlatformSpike` using the USWDS theme and add:

| Area | Widgets / states to place |
|---|---|
| Buttons & links | Button (default, disabled, `Is Default` in a Form), Link styled as button, Link |
| Inputs | Input: Text, Password, Email, Number, Phone, Search, Date, Time, DateTime. Mandatory + invalid (after Form validation), disabled, read-only |
| Choice | Dropdown (+ empty option), Checkbox, Radio Group with Radio Buttons, Switch |
| Text | TextArea, Expression, Label (with Input Widget set) |
| Data | Table (with sortable column, `OnSort`), List + List Item, Pagination if any |
| Feedback | `FeedbackMessage` action for Info, Success, Warning, Error. Popup widget (open/close). Platform Icon widget |
| Upload | Upload widget |
| Layout | Container with Width = 3 / 6 / 12 col, Margin left/top set in Styles Editor, Fill parent, Inline |

Publish, open the screen in a browser, and for each item record into `docs/spike/platform-dom.md`:

1. The rendered HTML (copy outer HTML from devtools) and its classes in each state.
2. Which platform CSS still loads with Base Theme = none (Network tab → CSS files other than the theme/module).
3. **CSS load order** of Theme stylesheet vs Block stylesheets vs Screen stylesheet. This confirms the `$utilities-use-important: true` decision in `src/settings/_uswds-settings.scss`.
4. Whether `.ThemeGrid_*`, `.OSFillParent`, `.OSInline`, `.OSAutoMarginTop` rules exist without OutSystems UI (Width/Margin properties in Service Studio rely on them).
5. Focus handling of Popup (focus trap, Escape), to decide restyle-only vs Modal Block replacement.

## 6. Phase 0 exit checklist

- [ ] Modules created with dependencies as in §1, no OutSystemsUI reference anywhere
- [ ] USWDS theme published, Base Theme = none, `uswds-theme.min.css` pasted
- [ ] All `dist/assets` resources deployed, sample URLs in §3 return 200
- [ ] A test screen shows USWDS typography (Source Sans Pro), `usa-button`, `grid-row`/`grid-col-*` and a `usa-alert` correctly
- [ ] `docs/spike/platform-dom.md` completed (§5)
- [ ] CI green on the repo (`npm run ci`)
