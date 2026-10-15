# USWDS reference pages

The baseline that OutSystems 11 Style Guide screens are compared against ([Definition of Done](../docs/DEFINITION_OF_DONE.md) gates 4 and 5).

Every public USWDS variant (208 for 3.14.0, listed in [`docs/acceptance/inventory.md`](../docs/acceptance/inventory.md)) is rendered the way USWDS's own Storybook renders it:

- USWDS's own `*.stories.js` files are imported and each story export is called with its args. Nothing is re-typed by hand.
- `.twig` templates render with **twig 3.0.0**, the version USWDS pins, using the same `@components` / `@templates` namespaces.
- Pages load the **official** `dist/css/uswds.min.css` and `dist/js/uswds.min.js` (not our build), with Storybook's preview styles and padded/fullscreen layout.

## Commands

```sh
npm run reference              # render all variants, then verify them in Chromium
npm run reference:render       # → reference/site/<story-id>.html + index.html
npm run reference:fetch        # cache images USWDS stories hotlink → reference/external/
npm run reference:verify       # check every page, write accessibility baselines
npm run reference:screenshots  # same, plus screenshots at 320/480/640/1024/1400 px
```

Story ids match USWDS's Storybook ids, e.g. `components-accordion--bordered`.

## What gets checked

Each page opens in Chromium. It fails on any script error, console error or missing file. Requests to other hosts are blocked, so pages can't depend on the network.

## Outputs

| Path | Committed | Use |
|---|---|---|
| `aria/<story-id>.yml` | yes | Accessibility tree of each variant at 1024 px (roles, names, levels, states). Gate 5 compares O11 screens to these. Deterministic, so an upgrade shows up as a diff |
| `external/<host>/<path>` | yes, once fetched | Images USWDS stories hotlink from designsystem.digital.gov and performance.gov (4 files, used by 4 variants). Fetch where those hosts are reachable |
| `site/` | no | Rendered pages. Regenerate any time |
| `screenshots/<width>/<story-id>.png` | no | Gate 4 baseline. CI uploads them as the `uswds-reference-screenshots` artifact |
| `report.json` | no | Last verification summary |

Screenshots depend on the browser build and the fonts installed on the machine, so compare O11 screenshots only against reference screenshots taken in the same environment (same CI runner image and Playwright version). That's why they aren't committed.
