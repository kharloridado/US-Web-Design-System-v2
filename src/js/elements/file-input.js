// <uswds-os-file-input>: USWDS file input (packages/usa-file-input).
//
// Attributes: input-id, label, hint, error (error message; shows the error state),
// accept, multiple, invalid-file-text, disabled-state ("disabled" | "aria-disabled").
// Event: uswds-change, detail { files: [{ name, type, size, base64 }] }.
// base64 holds the file content without the data: prefix, ready for an OutSystems
// Binary Data parameter.

import fileInput from "@uswds/uswds/js/usa-file-input";
import { UswdsElement, attr, esc } from "./base.js";

const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export class UswdsFileInput extends UswdsElement {
  static behavior = fileInput;

  lastReported = "";

  static get observedAttributes() {
    return ["input-id", "label", "hint", "error", "accept", "multiple", "invalid-file-text", "disabled-state"];
  }

  get files() {
    return [...(this.querySelector('input[type="file"]')?.files ?? [])];
  }

  get value() {
    return this.files.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join("|");
  }

  /** Reads the selected files; the OutSystems wrapper passes base64 to Binary Data. */
  async readFiles() {
    return Promise.all(
      this.files.map(async (f) => ({ name: f.name, type: f.type, size: f.size, base64: await readAsBase64(f) })),
    );
  }

  // Files have to be read before they can be reported, so this event is async.
  emitChange() {
    const value = this.value;
    if (value === this.lastReported) return;
    this.lastReported = value;
    this.readFiles().then((files) => {
      if (this.value !== value) return; // a newer selection replaced these files
      this.dispatchEvent(new CustomEvent("uswds-change", { bubbles: true, composed: true, detail: { files } }));
    });
  }

  isEcho() {
    return false;
  }

  // Mirrors usa-file-input.twig.
  template() {
    const id = esc(this.inputId);
    const hint = this.getAttribute("hint");
    const error = this.getAttribute("error");
    return `<div class="usa-form-group${error ? " usa-form-group--error" : ""}">
  <label class="usa-label${error ? " usa-label--error" : ""}" for="${id}">${esc(this.getAttribute("label"))}</label>
  ${hint ? `<span class="usa-hint" id="${id}-hint">${esc(hint)}</span>` : ""}
  ${error ? `<span class="usa-error-message" id="${id}-alert">${esc(error)}</span>` : ""}
  <input id="${id}" class="usa-file-input" type="file" name="${id}"${hint ? ` aria-describedby="${id}-hint"` : ""}${attr("accept", this.getAttribute("accept"))}${attr("multiple", this.hasAttribute("multiple"))}${this.disabledAttrs}${attr("data-errorMessage", this.getAttribute("invalid-file-text"))}>
</div>`;
  }
}
