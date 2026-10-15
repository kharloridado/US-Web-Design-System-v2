// <uswds-os-date-picker>: USWDS date picker (packages/usa-date-picker).
//
// Attributes: input-id, name, label, hint, value (YYYY-MM-DD), min-date, max-date,
// range-date (all YYYY-MM-DD), disabled-state ("disabled" | "aria-disabled"), required.
// Event: uswds-change, detail { value } where value is YYYY-MM-DD or "".

import datePicker from "@uswds/uswds/js/usa-date-picker";
import { UswdsElement, attr, esc } from "./base.js";

/** Markup of one date picker field, shared with the date range picker. Mirrors usa-date-picker.twig. */
export const datePickerField = ({ id, name, label, hint, value, minDate, maxDate, rangeDate, disabledAttrs, required }) => `<div class="usa-form-group">
  <label class="usa-label" id="${esc(id)}-label" for="${esc(id)}">${esc(label)}</label>
  ${hint ? `<div class="usa-hint" id="${esc(id)}-hint">${esc(hint)}</div>` : ""}
  <div class="usa-date-picker"${attr("data-default-value", value)}${attr("data-range-date", rangeDate)}${attr("data-min-date", minDate)}${attr("data-max-date", maxDate)}>
    <input class="usa-input" id="${esc(id)}" name="${esc(name || id)}" type="text" aria-labelledby="${esc(id)}-label"${hint ? ` aria-describedby="${esc(id)}-hint"` : ""}${disabledAttrs}${attr("required", required)}>
  </div>
</div>`;

export class UswdsDatePicker extends UswdsElement {
  static behavior = datePicker;

  static get observedAttributes() {
    return [...super.observedAttributes, "min-date", "max-date", "range-date"];
  }

  get value() {
    return this.querySelector(".usa-date-picker__internal-input")?.value ?? this.getAttribute("value") ?? "";
  }

  template() {
    return datePickerField({
      id: this.inputId,
      name: this.getAttribute("name"),
      label: this.getAttribute("label"),
      hint: this.getAttribute("hint"),
      value: this.getAttribute("value"),
      minDate: this.getAttribute("min-date"),
      maxDate: this.getAttribute("max-date"),
      rangeDate: this.getAttribute("range-date"),
      disabledAttrs: this.disabledAttrs,
      required: this.hasAttribute("required"),
    });
  }
}
