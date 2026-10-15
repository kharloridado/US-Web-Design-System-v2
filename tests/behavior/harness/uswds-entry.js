// The USWDS behaviors under test, exposed to fixture pages as window.USWDS_TEST.
// Same source modules as dist/js/uswds.js (packages/uswds-core/src/js/start.js),
// but starting is controlled by the page, so a test can change the fixture first.

import components from "@uswds/uswds/src/js/components";

window.uswdsPresent = true;
window.USWDS_TEST = {
  components,
  started: false,
  // Default: same as USWDS's initComponents(), every behavior on document.body.
  //   only: ["fileInput"]          start just these behaviors (keys of components),
  //                                like a spec that calls one Component.on()
  //   root: "#id" | "shadow:#id"   start them on that element, or on its shadow root
  start({ only, root } = {}) {
    let target = document.body;
    if (root) {
      const shadow = root.startsWith("shadow:");
      const el = document.querySelector(shadow ? root.slice(7) : root);
      target = shadow ? el?.shadowRoot : el;
      if (!target) throw new Error(`USWDS_TEST.start: no root for "${root}"`);
    }
    const keys = only ?? Object.keys(components);
    for (const key of keys) {
      if (!components[key]) throw new Error(`USWDS_TEST.start: unknown behavior "${key}"`);
      components[key].on(target);
    }
    this.started = true;
  },
};
