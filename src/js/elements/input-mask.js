// <uswds-os-input-mask>: USWDS text input mask (packages/usa-input-mask).
//
// Attributes: input-id, label, hint, type (default "text"), inputmode, placeholder
// (the mask, e.g. "___-__-____"), pattern, charset (data-charset), value,
// disabled-state ("disabled" | "aria-disabled").
// Event: uswds-change (on change), detail { value } with the masked value.
//
// USWDS's story wraps the field in <form class="usa-form">. OutSystems screens put
// fields inside their own Form widget and forms can't nest, so the element uses
// <div class="usa-form">: same styles, and an unnamed form has no landmark role,
// so the accessibility tree is unchanged.

import inputMask from "@uswds/uswds/js/usa-input-mask";
import { UswdsElement, attr, esc } from "./base.js";

export class UswdsInputMask extends UswdsElement {
  static behavior = inputMask;

  static get observedAttributes() {
    return ["input-id", "label", "hint", "type", "inputmode", "placeholder", "pattern", "charset", "value", "disabled-state"];
  }

  get value() {
    return this.querySelector("input")?.value ?? this.getAttribute("value") ?? "";
  }

  // Mirrors usa-input-mask.twig.
  template() {
    const id = esc(this.inputId);
    return `<div class="usa-form">
  <label class="usa-label" for="${id}">${esc(this.getAttribute("label"))}</label>
  <div class="usa-hint" id="${id}Hint">${esc(this.getAttribute("hint"))}</div>
  <input id="${id}" type="${esc(this.getAttribute("type") || "text")}" inputmode="${esc(this.getAttribute("inputmode") || "text")}" name="${id}" placeholder="${esc(this.getAttribute("placeholder"))}" pattern="${esc(this.getAttribute("pattern"))}" class="usa-input usa-masked" aria-describedby="${id}Hint"${attr("data-charset", this.getAttribute("charset"))}${attr("value", this.getAttribute("value"))}${this.disabledAttrs}>
</div>`;
  }
}
