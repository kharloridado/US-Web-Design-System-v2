// Base class for the light-DOM custom elements that wrap USWDS behaviors
// (MIGRATION_PLAN.md §7, strategy W).
//
// Why: in OutSystems Reactive, React owns the DOM it renders. Several USWDS
// components rebuild their own markup (combo box, date and time pickers, file
// input, input mask, in-page navigation), which breaks React. So React renders
// only an empty host element; the element writes the USWDS markup inside itself
// and runs the official USWDS behavior on it, then removes the behavior when the
// host leaves the page.
//
// Contract for OutSystems Block wrappers:
//   - configure with attributes (kebab-case, listed per element)
//   - listen for the "uswds-change" event; event.detail carries the new value
//   - set attributes again in OnParametersChanged; echoing back the value the
//     element just reported is ignored, any other change re-renders the element

let nextId = 0;

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for use in HTML text or a double-quoted attribute. */
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

/**
 * Renders ` name="value"`, ` name` for `true`, or nothing for empty values, so
 * templates can mirror USWDS's twig conditionals.
 */
export const attr = (name, value) => {
  if (value === undefined || value === null || value === false || value === "") return "";
  if (value === true) return ` ${name}`;
  return ` ${name}="${esc(value)}"`;
};

export class UswdsElement extends HTMLElement {
  /** The USWDS behavior ({ on, off }) this element runs. Set by subclasses. */
  static behavior = null;

  /** Attributes that re-render the element when they change. Subclasses extend this. */
  static get observedAttributes() {
    return ["input-id", "name", "label", "hint", "disabled-state", "required", "value"];
  }

  #mounted = false;
  #autoId = null;
  #lastValue = undefined;

  connectedCallback() {
    this.#mount();
  }

  disconnectedCallback() {
    this.#unmount();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.#mounted || oldValue === newValue) return;
    if (this.isEcho(name, newValue)) return;
    this.#unmount();
    this.#mount();
  }

  /** Markup that USWDS's twig template would produce for the current attributes. */
  template() {
    throw new Error(`${this.localName} must implement template()`);
  }

  /** The element's current value, as a string. */
  get value() {
    return "";
  }

  /** What "uswds-change" carries in event.detail. */
  detail() {
    return { value: this.value };
  }

  /** True when an attribute change only repeats what the element already shows. */
  isEcho(name, newValue) {
    return name === "value" && (newValue ?? "") === this.value;
  }

  /** Id of the main form control, from input-id or generated once per element. */
  get inputId() {
    const given = this.getAttribute("input-id");
    if (given) return given;
    this.#autoId ??= `uswds-os-${++nextId}`;
    return this.#autoId;
  }

  /** USWDS stories use disabled_state "disabled" or "aria-disabled". */
  get disabledAttrs() {
    const state = this.getAttribute("disabled-state");
    if (state === "disabled") return " disabled";
    if (state === "aria-disabled") return ' aria-disabled="true"';
    return "";
  }

  /** Sends "uswds-change" when the value differs from the last one reported. */
  emitChange() {
    const value = this.value;
    if (value === this.#lastValue) return;
    this.#lastValue = value;
    this.dispatchEvent(new CustomEvent("uswds-change", { bubbles: true, composed: true, detail: this.detail() }));
  }

  #onChange = (event) => {
    if (event.target !== this) this.emitChange();
  };

  #mount() {
    if (this.#mounted) return;
    this.innerHTML = this.template();
    this.constructor.behavior.on(this);
    this.addEventListener("change", this.#onChange);
    this.#lastValue = this.value;
    this.#mounted = true;
  }

  #unmount() {
    if (!this.#mounted) return;
    this.removeEventListener("change", this.#onChange);
    this.constructor.behavior.off(this);
    this.innerHTML = "";
    this.#mounted = false;
  }
}

/** Registers an element once, so loading the bundle twice is harmless. */
export const define = (name, constructor) => {
  if (!customElements.get(name)) customElements.define(name, constructor);
};
