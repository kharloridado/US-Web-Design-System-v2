// The USWDS behaviors under test, exposed to fixture pages as window.USWDS_TEST.
// Same source modules as dist/js/uswds.js (packages/uswds-core/src/js/start.js),
// but starting is controlled by the page, so a test can change the fixture first.

import components from "@uswds/uswds/src/js/components";

window.uswdsPresent = true;
window.USWDS_TEST = {
  components,
  started: false,
  // Same as USWDS's initComponents(): every behavior on document.body.
  start() {
    Object.values(components).forEach((behavior) => behavior.on(document.body));
    this.started = true;
  },
};
