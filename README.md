# USWDS for OutSystems 11 Reactive Web

The [U.S. Web Design System](https://designsystem.digital.gov) (`@uswds/uswds` 3.14.0) migrated to an OutSystems 11 Reactive Web **standalone theme** (no OutSystems UI). Stock USWDS tokens, English.

- Plan and architecture: [`docs/MIGRATION_PLAN.md`](docs/MIGRATION_PLAN.md)
- What done means: [`docs/DEFINITION_OF_DONE.md`](docs/DEFINITION_OF_DONE.md) (inventory: [`docs/acceptance/inventory.md`](docs/acceptance/inventory.md))
- Reference pages O11 is compared against: [`reference/README.md`](reference/README.md)
- Service Studio setup and platform spike: [`docs/phase-0-outsystems-setup.md`](docs/phase-0-outsystems-setup.md)

## Build

```sh
npm ci
npm run build   # compile Theme + Block CSS, copy fonts/images, write dist/manifest.json
npm run check   # prove dist/ has 100% of the official USWDS CSS, with nothing duplicated
npm run inventory  # list every USWDS variant and behavior case that must work in O11
npm run reference  # render all 208 USWDS variants as reference pages and verify them in Chromium
npm run test:elements  # test the 7 USWDS custom elements against those reference pages
```

| Output | Goes to |
|---|---|
| `dist/theme/uswds-theme.min.css` | `USWDS_Theme` → Theme stylesheet |
| `dist/blocks/<Block>.min.css` | `USWDS_Patterns` → `<Block>` stylesheet |
| `dist/assets/{fonts,img}/…` | `USWDS_Theme` → Resources (Deploy to Target Directory) |
| `dist/js/uswds-os.min.js` | `USWDS_Patterns` → Script, required by the Web Component Blocks ([guide](docs/blocks/web-components.md)) |
| `dist/manifest.json` | Which USWDS package maps to which Block, required Blocks, sizes |

`dist/` is committed so every OutSystems release traces back to a commit. CI fails if it is out of date.

## Layout

```
src/settings/_uswds-settings.scss   USWDS configuration (paths, globals, utilities)
src/theme/index.scss                Theme-owned USWDS packages + tokens + platform contract
src/theme/_tokens-custom-props.scss USWDS tokens as :root --usa-* custom properties
src/theme/platform/                 OutSystems platform widget → USWDS styling (Phase 2)
src/blocks.json                     USWDS packages compiled as Block stylesheets
scripts/build.mjs                   Build + coverage check (every USWDS package must be assigned)
scripts/check-parity.mjs            Rule-level comparison against the official USWDS bundle
```

## Upgrading USWDS

Bump `@uswds/uswds` in `package.json`, run `npm install && npm run ci`, then review the `dist/` diff. Any new USWDS package fails the build until it is assigned to the Theme, a Block, or `noStyles` in `src/blocks.json`. Paste only the changed files into Service Studio.
