# Web Component Blocks

Seven USWDS components rebuild their own HTML, which breaks React in OutSystems Reactive screens (MIGRATION_PLAN.md §7). Each one ships as a custom element in **`dist/js/uswds-os.min.js`**. React renders only the empty host element; the element writes USWDS's markup inside itself and runs USWDS's own JavaScript on it.

| Block (USWDS_Patterns) | Custom element | USWDS stories it reproduces |
|---|---|---|
| `ComboBox` | `uswds-os-combo-box` | 3 |
| `DatePicker` | `uswds-os-date-picker` | 6 |
| `DateRangePicker` | `uswds-os-date-range-picker` | 5 |
| `TimePicker` | `uswds-os-time-picker` | 4 |
| `FileInput` | `uswds-os-file-input` | 7 |
| `InputMask` | `uswds-os-input-mask` | 6 |
| `InPageNavigation` | `uswds-os-in-page-navigation` | 1 |

**Tested:** `npm run test:elements` puts each element into the USWDS reference page in place of USWDS's markup. For all 32 stories, the accessibility tree is identical, screenshots match at 320 and 1024 px, and there are no errors. It also checks that values reach OutSystems, that attribute updates re-render, and that 50 mount/unmount cycles leave nothing behind. CI runs it on every push.

---

## One-time setup in `USWDS_Patterns`

1. **Scripts** → import `dist/js/uswds-os.min.js` as `uswds-os.min.js`.
2. In each Block below: **Required Scripts** → add `uswds-os.min.js`.
3. Never add USWDS's own `uswds.js` / `uswds-init.js` anywhere.

The Theme already contains the host rule (`uswds-os-* { display: contents; }`), so the hosts don't affect layout.

## Building a Block (same pattern for all seven)

1. Add an **HTML Element** widget. Tag = the custom element name (e.g. `uswds-os-combo-box`). Name it `Host`.
2. In the widget's **Attributes**, bind each attribute to a Block input (tables below). React updates the attributes when inputs change, and the element re-renders. Attributes with an empty value are treated as absent.
3. Add an Event **`OnChange`** with the parameters below (not for InPageNavigation).
4. **OnReady** → JavaScript node, input `HostId` = `Host.Id`:

   ```js
   var host = document.getElementById($parameters.HostId);
   host.__uswdsOsChange = function (event) {
     $actions.ChangeHandler(event.detail.value); // per Block: see its "OnChange" line
   };
   host.addEventListener("uswds-change", host.__uswdsOsChange);
   ```

   `ChangeHandler` is a client action in the Block whose inputs are Text values from `event.detail`. It converts them (dates, times, files) and triggers the Block's `OnChange` event.
5. **OnDestroy** → JavaScript node, input `HostId`:

   ```js
   var host = document.getElementById($parameters.HostId);
   if (host && host.__uswdsOsChange) host.removeEventListener("uswds-change", host.__uswdsOsChange);
   ```

**Two-way binding:** the parent keeps the value in a local variable, updates it in its `OnChange` handler, and passes it back through the `Value` input. When the element receives the value it just reported, it ignores it, so focus and caret aren't lost. Any other value re-renders the component with that value.

**IDs:** pass `InputId` only when a label elsewhere on the screen must point at the control. Otherwise leave it empty and the element generates a unique ID.

**Disabled:** `DisabledState` is a static entity with `None`, `Disabled` and `AriaDisabled`, the two disabled variants USWDS ships. Map it to `""`, `"disabled"` or `"aria-disabled"`.

---

## ComboBox: `uswds-os-combo-box`

| Input | Type | Attribute |
|---|---|---|
| Label | Text | `label` |
| Options | List of `{ Value, Label }` | `options`: JSON, e.g. `JSONSerialize(Options)` with fields named `value`, `label` |
| EmptyOptionLabel | Text | `empty-option`: text of the first, value-less option (USWDS stories use one). Leave empty for none |
| Value | Text | `value` |
| Placeholder | Text | `placeholder` |
| Name, InputId | Text | `name`, `input-id` |
| IsRequired | Boolean | `required` (set only when True) |
| DisabledState | DisabledState | `disabled-state` |

**OnChange(Value: Text)**: `$actions.ChangeHandler(event.detail.value)`.

## DatePicker: `uswds-os-date-picker`

| Input | Type | Attribute |
|---|---|---|
| Label, Hint | Text | `label`, `hint` (USWDS uses hint "mm/dd/yyyy") |
| Value | Date | `value`: `If(Value = NullDate(), "", FormatDateTime(Value, "yyyy-MM-dd"))` |
| MinDate, MaxDate, RangeDate | Date | `min-date`, `max-date`, `range-date`, same format |
| Name, InputId, IsRequired, DisabledState | | as ComboBox |

**OnChange(Value: Date)**: `$actions.ChangeHandler(event.detail.value)`, then `If(Value = "", NullDate(), TextToDate(Value))`.

## DateRangePicker: `uswds-os-date-range-picker`

| Input | Type | Attribute |
|---|---|---|
| StartLabel, StartHint, EndLabel, EndHint | Text | `start-label`, `start-hint`, `end-label`, `end-hint` |
| StartDate, EndDate | Date | `start-value`, `end-value` (yyyy-MM-dd) |
| MinDate, MaxDate | Date | `min-date`, `max-date` |
| StartInputId, EndInputId | Text | `start-input-id`, `end-input-id` |
| DisabledState | DisabledState | `disabled-state` |

**OnChange(StartDate: Date, EndDate: Date)**: `$actions.ChangeHandler(event.detail.start, event.detail.end)`, each converted as in DatePicker.

## TimePicker: `uswds-os-time-picker`

| Input | Type | Attribute |
|---|---|---|
| Label, Hint | Text | `label`, `hint` |
| Value | Time | `value`: `If(Value = NullTime(), "", FormatDateTime(Value, "HH:mm"))`. USWDS labels such as "1:00pm" also work |
| MinTime, MaxTime | Time | `min-time`, `max-time` (HH:mm) |
| StepMinutes | Integer | `step` (USWDS default 30, minimum 1) |
| Name, InputId, IsRequired, DisabledState | | as ComboBox |

**OnChange(Value: Time)**: `$actions.ChangeHandler(event.detail.value)`, then `If(Value = "", NullTime(), TextToTime(Value + ":00"))`.

## FileInput: `uswds-os-file-input`

| Input | Type | Attribute |
|---|---|---|
| Label, Hint | Text | `label`, `hint` |
| ErrorMessage | Text | `error`: when set, shows USWDS's error state with this message |
| Accept | Text | `accept`, e.g. `.pdf,.txt` or `image/*` |
| AllowMultiple | Boolean | `multiple` (set only when True) |
| InvalidFileText | Text | `invalid-file-text` (USWDS's message for a rejected file type) |
| InputId, DisabledState | | as ComboBox |

**OnChange(Files: List of SelectedFile)**: `$actions.ChangeHandler(JSON.stringify(event.detail.files))`, then `JSONDeserialize` into a list of the `SelectedFile` structure: `Name` (Text, JSON name `name`), `Type` (Text, `type`), `Size` (Long Integer, `size`), `Content` (Binary Data, JSON name `base64`). OutSystems JSON represents Binary Data as base64, so `Content` arrives as the file's bytes. Files are read in the browser, so check `Size` before sending them to the server.

## InputMask: `uswds-os-input-mask`

| Input | Type | Attribute |
|---|---|---|
| Label, Hint | Text | `label`, `hint` |
| Mask | Text | `placeholder`: the mask, e.g. `___ __ ____` |
| Pattern | Text | `pattern`: validation regex, e.g. `\d{3}-\d{3}-\d{4}` |
| Charset | Text | `charset`: mixed letters/digits mask, e.g. `A#A #A#` |
| InputType, InputMode | Text | `type` (`text`, `tel`), `inputmode` (`numeric`, `text`) |
| Value, InputId, DisabledState | | as ComboBox |

**OnChange(Value: Text)**: `$actions.ChangeHandler(event.detail.value)`, the masked value, sent on blur.

## InPageNavigation: `uswds-os-in-page-navigation`

| Input | Type | Attribute |
|---|---|---|
| TitleText | Text | `title-text` (USWDS default "On this page") |
| TitleHeadingLevel | Text | `title-heading-level` (`h2`–`h6`, USWDS story uses `h4`) |
| HeadingElements | Text | `heading-elements` (e.g. `h2 h3`) |
| MainContentSelector | Text | `main-content-selector` (default `main`, which is `#main-content` in LayoutDefault) |
| ScrollOffset, RootMargin, Threshold, MinimumHeadingCount | Text | `scroll-offset`, `root-margin`, `threshold`, `minimum-heading-count` |

No event. Place it with the content in a Container with class `usa-in-page-nav-container`, as `LayoutSidenav` does. It builds links when it mounts, so render it after the page content (same screen, below the content in the widget tree, or inside an `If` that shows once data is loaded).

Known USWDS limit: USWDS has no teardown for the in-page navigation's scroll observer, so each mount leaves one observer holding that screen's headings after the element is removed. It's one small object per screen visit; fixing it would mean patching USWDS.
