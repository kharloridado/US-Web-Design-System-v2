// <uswds-os-time-picker>: USWDS time picker (packages/usa-time-picker), built on the combo box.
//
// Attributes: input-id, name, label, hint, value (HH:MM 24-hour, or USWDS's "1:00pm"), min-time, max-time,
// step (minutes), disabled-state ("disabled" | "aria-disabled"), required.
// Event: uswds-change, detail { value } where value is HH:MM or "".

import timePicker from "@uswds/uswds/js/usa-time-picker";
import comboBox from "@uswds/uswds/js/usa-combo-box";
import { UswdsElement, attr, esc } from "./base.js";

// The time picker turns its input into a combo box; the combo box behavior handles it from there.
const behavior = {
  on(root) {
    timePicker.on(root);
    comboBox.on(root);
  },
  off(root) {
    comboBox.off(root);
    timePicker.off(root);
  },
};

// USWDS matches the default against option labels ("1:00pm"); OutSystems passes
// Time values as "13:00". Convert 24-hour values, pass USWDS labels through.
const toOptionLabel = (value) => {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value ?? "");
  if (!match) return value;
  const hour24 = Number(match[1]);
  return `${hour24 % 12 || 12}:${match[2]}${hour24 < 12 ? "am" : "pm"}`;
};

export class UswdsTimePicker extends UswdsElement {
  static behavior = behavior;

  static get observedAttributes() {
    return [...super.observedAttributes, "min-time", "max-time", "step"];
  }

  get value() {
    return this.querySelector("select")?.value ?? this.getAttribute("value") ?? "";
  }

  // Mirrors usa-time-picker.twig.
  template() {
    const id = esc(this.inputId);
    const hint = this.getAttribute("hint");
    return `<div class="usa-form-group">
  <label class="usa-label" id="${id}-label" for="${id}">${esc(this.getAttribute("label"))}</label>
  ${hint ? `<div class="usa-hint" id="${id}-hint">${esc(hint)}</div>` : ""}
  <div class="usa-time-picker"${attr("data-min-time", this.getAttribute("min-time"))}${attr("data-max-time", this.getAttribute("max-time"))}${attr("data-step", this.getAttribute("step"))}>
    <input class="usa-input" id="${id}" name="${esc(this.getAttribute("name") || this.inputId)}" type="text" aria-describedby="${id}-label${hint ? ` ${id}-hint` : ""}"${attr("value", toOptionLabel(this.getAttribute("value")))}${this.disabledAttrs}${attr("required", this.hasAttribute("required"))}>
  </div>
</div>`;
  }
}
