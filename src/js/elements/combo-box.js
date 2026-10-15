// <uswds-os-combo-box>: USWDS combo box (packages/usa-combo-box).
//
// Attributes: input-id, name, label, options (JSON: [{"value": "", "label": ""}]),
// empty-option (text of the first, value-less option), value, placeholder,
// modifier, disabled-state ("disabled" | "aria-disabled"), required.
// Event: uswds-change, detail { value }.

import comboBox from "@uswds/uswds/js/usa-combo-box";
import { UswdsElement, attr, esc } from "./base.js";

export class UswdsComboBox extends UswdsElement {
  static behavior = comboBox;

  static get observedAttributes() {
    return [...super.observedAttributes, "options", "empty-option", "placeholder", "modifier"];
  }

  get options() {
    try {
      const parsed = JSON.parse(this.getAttribute("options") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  get value() {
    return this.querySelector("select")?.value ?? this.getAttribute("value") ?? "";
  }

  // Mirrors usa-combo-box.twig.
  template() {
    const id = this.inputId;
    const modifier = this.getAttribute("modifier");
    const empty = this.getAttribute("empty-option");
    return `<label class="usa-label" for="${esc(id)}">${esc(this.getAttribute("label"))}</label>
<div class="usa-combo-box${modifier ? ` ${esc(modifier)}` : ""}"${attr("data-default-value", this.getAttribute("value"))}${attr("data-placeholder", this.getAttribute("placeholder"))}>
  <select class="usa-select"${attr("name", this.getAttribute("name") || id)} id="${esc(id)}"${this.disabledAttrs}${attr("required", this.hasAttribute("required"))}>
    ${empty !== null ? `<option value>${esc(empty)}</option>` : ""}
    ${this.options.map((o) => `<option value="${esc(o.value)}">${esc(o.label ?? o.value)}</option>`).join("\n    ")}
  </select>
</div>`;
  }
}
