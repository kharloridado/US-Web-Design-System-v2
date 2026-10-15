// <uswds-os-date-range-picker>: USWDS date range picker (packages/usa-date-range-picker).
//
// Attributes: start-input-id, start-name, start-label, start-hint, start-value,
// end-input-id, end-name, end-label, end-hint, end-value (dates YYYY-MM-DD),
// min-date, max-date, disabled-state ("disabled" | "aria-disabled").
// Event: uswds-change, detail { start, end } (YYYY-MM-DD or "").

import dateRangePicker from "@uswds/uswds/js/usa-date-range-picker";
import datePicker from "@uswds/uswds/js/usa-date-picker";
import { UswdsElement, attr } from "./base.js";
import { datePickerField } from "./date-picker.js";

// The range picker coordinates two date pickers; both behaviors must run.
const behavior = {
  on(root) {
    datePicker.on(root);
    dateRangePicker.on(root);
  },
  off(root) {
    dateRangePicker.off(root);
    datePicker.off(root);
  },
};

export class UswdsDateRangePicker extends UswdsElement {
  static behavior = behavior;

  static get observedAttributes() {
    const sides = ["input-id", "name", "label", "hint", "value"];
    return ["min-date", "max-date", "disabled-state", ...sides.flatMap((a) => [`start-${a}`, `end-${a}`])];
  }

  #field(side) {
    return datePickerField({
      id: this.getAttribute(`${side}-input-id`) || `${this.inputId}-${side}`,
      name: this.getAttribute(`${side}-name`),
      label: this.getAttribute(`${side}-label`),
      hint: this.getAttribute(`${side}-hint`),
      value: this.getAttribute(`${side}-value`),
      disabledAttrs: this.disabledAttrs,
    });
  }

  #internal(index) {
    return this.querySelectorAll(".usa-date-picker__internal-input")[index]?.value ?? "";
  }

  get start() {
    return this.#internal(0);
  }

  get end() {
    return this.#internal(1);
  }

  get value() {
    return `${this.start}/${this.end}`;
  }

  detail() {
    return { start: this.start, end: this.end };
  }

  isEcho(name, newValue) {
    if (name === "start-value") return (newValue ?? "") === this.start;
    if (name === "end-value") return (newValue ?? "") === this.end;
    return false;
  }

  // Mirrors usa-date-range-picker.twig.
  template() {
    return `<div class="usa-date-range-picker"${attr("data-min-date", this.getAttribute("min-date"))}${attr("data-max-date", this.getAttribute("max-date"))}>
  ${this.#field("start")}

  ${this.#field("end")}
</div>`;
  }
}
