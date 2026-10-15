// <uswds-os-in-page-navigation>: USWDS in-page navigation (packages/usa-in-page-navigation).
//
// Builds "On this page" links from the headings of the page's main content.
// Attributes: title-text, title-heading-level, scroll-offset, root-margin, threshold,
// main-content-selector, heading-elements, minimum-heading-count.
// Place it next to the content (USWDS's .usa-in-page-nav-container layout).
// No value; it emits no events.

import inPageNavigation from "@uswds/uswds/js/usa-in-page-navigation";
import { UswdsElement, attr } from "./base.js";

const DATA = [
  "title-text",
  "title-heading-level",
  "scroll-offset",
  "root-margin",
  "threshold",
  "main-content-selector",
  "heading-elements",
  "minimum-heading-count",
];

export class UswdsInPageNavigation extends UswdsElement {
  static behavior = inPageNavigation;

  static get observedAttributes() {
    return DATA;
  }

  isEcho() {
    return false;
  }

  // Mirrors the <aside> in usa-in-page-navigation.twig.
  template() {
    return `<aside class="usa-in-page-nav"${DATA.map((a) => attr(`data-${a}`, this.getAttribute(a))).join("")}></aside>`;
  }
}
