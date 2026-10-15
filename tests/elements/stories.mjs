// For every USWDS story that a custom element replaces: the element and the
// attributes that reproduce the story. Values come from the story's args and
// the hardcoded text in its twig template (e.g. "Appointment date").
//
// replace: "root" swaps the whole story markup for the element; "aside" swaps
// only the in-page navigation <aside>, keeping the story's page content.

const DISABLED = { "": {}, disabled: { "disabled-state": "disabled" }, "aria-disabled": { "disabled-state": "aria-disabled" } };

const comboBox = (disabled) => ({
  tag: "uswds-os-combo-box",
  attrs: { "input-id": "fruit", name: "fruit", label: "Select a fruit", ...DISABLED[disabled] },
  optionsFromReference: true,
});

const datePicker = (extra) => ({
  tag: "uswds-os-date-picker",
  attrs: { "input-id": "appointment-date", label: "Appointment date", hint: "mm/dd/yyyy", ...extra },
});

const dateRange = (extra) => ({
  tag: "uswds-os-date-range-picker",
  attrs: {
    "start-input-id": "event-date-start",
    "start-label": "Event start date",
    "start-hint": "mm/dd/yyyy",
    "end-input-id": "event-date-end",
    "end-label": "Event end date",
    "end-hint": "mm/dd/yyyy",
    ...extra,
  },
});

const timePicker = (extra) => ({
  tag: "uswds-os-time-picker",
  attrs: {
    "input-id": "appointment-time",
    label: "Appointment time",
    hint: "Select a time from the dropdown. Type into the input to filter options.",
    ...extra,
  },
});

const fileInput = (attrs) => ({ tag: "uswds-os-file-input", attrs });

const mask = (attrs) => ({ tag: "uswds-os-input-mask", attrs });
const ALPHANUMERIC = {
  "input-id": "alphanumeric",
  label: "Alphanumeric",
  hint: "For example, A1B 2C3",
  type: "text",
  inputmode: "text",
  placeholder: "___ ___",
  pattern: "\\w\\d\\w \\d\\w\\d",
  charset: "A#A #A#",
};

export const STORIES = {
  "components-form-inputs-combo-box--default": comboBox(""),
  "components-form-inputs-combo-box--disabled": comboBox("disabled"),
  "components-form-inputs-combo-box--aria-disabled": comboBox("aria-disabled"),

  "components-form-inputs-date-picker--default": datePicker({}),
  "components-form-inputs-date-picker--default-date": datePicker({ value: "1995-03-06" }),
  "components-form-inputs-date-picker--range-date": datePicker({ "range-date": "2022-01-07" }),
  "components-form-inputs-date-picker--restricted-date": datePicker({ "min-date": "1995-03-06", "max-date": "1995-03-15" }),
  "components-form-inputs-date-picker--disabled": datePicker(DISABLED.disabled),
  "components-form-inputs-date-picker--aria-disabled": datePicker(DISABLED["aria-disabled"]),

  "components-form-inputs-date-range-picker--default": dateRange({}),
  "components-form-inputs-date-range-picker--default-date": dateRange({ "start-value": "1995-03-06", "end-value": "1995-03-15" }),
  "components-form-inputs-date-range-picker--restricted-date": dateRange({ "min-date": "1995-03-06", "max-date": "1995-03-15" }),
  "components-form-inputs-date-range-picker--disabled": dateRange(DISABLED.disabled),
  "components-form-inputs-date-range-picker--aria-disabled": dateRange(DISABLED["aria-disabled"]),

  "components-form-inputs-time-picker--time-picker": timePicker({}),
  "components-form-inputs-time-picker--time-picker-default-value": timePicker({ value: "1:00pm" }),
  "components-form-inputs-time-picker--disabled": timePicker(DISABLED.disabled),
  "components-form-inputs-time-picker--aria-disabled": timePicker(DISABLED["aria-disabled"]),

  "components-form-inputs-file-input--default": fileInput({ "input-id": "file-input-single", label: "Input accepts a single file" }),
  "components-form-inputs-file-input--error": fileInput({
    "input-id": "file-input-error",
    label: "Input has an error",
    hint: "Select any valid file",
    error: "Display a helpful error message",
  }),
  "components-form-inputs-file-input--multiple": fileInput({
    "input-id": "file-input-multiple",
    label: "Input accepts multiple files",
    hint: "Select one or more files",
    multiple: "",
  }),
  "components-form-inputs-file-input--specific": fileInput({
    "input-id": "file-input-specific",
    label: "Input accepts only specific file types",
    hint: "Select PDF or TXT files",
    accept: ".pdf,.txt",
    multiple: "",
  }),
  "components-form-inputs-file-input--wildcard": fileInput({
    "input-id": "file-input-wildcard",
    label: "Input accepts any kind of image",
    hint: "Select any type of image format",
    accept: "image/*",
    multiple: "",
  }),
  "components-form-inputs-file-input--disabled": fileInput({ "input-id": "file-input-single", label: "Input accepts a single file", ...DISABLED.disabled }),
  "components-form-inputs-file-input--aria-disabled": fileInput({ "input-id": "file-input-single", label: "Input accepts a single file", ...DISABLED["aria-disabled"] }),

  "components-form-inputs-text-input-mask--ssn": mask({
    "input-id": "ssn",
    label: "Social Security Number",
    hint: "For example, 123 45 6789",
    type: "text",
    inputmode: "numeric",
    placeholder: "___ __ ____",
    pattern: "^(?!(000|666|9))\\d{3} (?!00)\\d{2} (?!0000)\\d{4}$",
  }),
  "components-form-inputs-text-input-mask--phone": mask({
    "input-id": "tel",
    label: "US Telephone Number",
    hint: "For example, 123-456-7890",
    type: "tel",
    inputmode: "numeric",
    placeholder: "___-___-____",
    pattern: "\\d{3}-\\d{3}-\\d{4}",
  }),
  "components-form-inputs-text-input-mask--zip": mask({
    "input-id": "zip",
    label: "ZIP Code",
    hint: "For example, 12345-6789",
    type: "text",
    inputmode: "numeric",
    placeholder: "_____-____",
    pattern: "^[0-9]{5}(?:-[0-9]{4})?$",
  }),
  "components-form-inputs-text-input-mask--alphanumeric": mask(ALPHANUMERIC),
  "components-form-inputs-text-input-mask--disabled": mask({ ...ALPHANUMERIC, ...DISABLED.disabled }),
  "components-form-inputs-text-input-mask--aria-disabled": mask({ ...ALPHANUMERIC, ...DISABLED["aria-disabled"] }),

  "components-in-page-navigation--default": {
    tag: "uswds-os-in-page-navigation",
    replace: "aside",
    attrs: {
      "title-text": "On this page",
      "title-heading-level": "h4",
      "scroll-offset": "0",
      "root-margin": "0px 0px 0px 0px",
      threshold: "1",
    },
  },
};
