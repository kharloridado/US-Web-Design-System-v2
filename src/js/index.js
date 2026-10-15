// uswds-os: USWDS components that rebuild their own markup, packaged as custom
// elements so they work inside OutSystems Reactive (React) screens.
// Loaded as a Script in USWDS_Patterns and required by the Web Component Blocks.
// Never load USWDS's global uswds.js alongside it (MIGRATION_PLAN.md §7).

import { define } from "./elements/base.js";
import { UswdsComboBox } from "./elements/combo-box.js";
import { UswdsDatePicker } from "./elements/date-picker.js";
import { UswdsDateRangePicker } from "./elements/date-range-picker.js";
import { UswdsTimePicker } from "./elements/time-picker.js";
import { UswdsFileInput } from "./elements/file-input.js";
import { UswdsInputMask } from "./elements/input-mask.js";
import { UswdsInPageNavigation } from "./elements/in-page-navigation.js";

define("uswds-os-combo-box", UswdsComboBox);
define("uswds-os-date-picker", UswdsDatePicker);
define("uswds-os-date-range-picker", UswdsDateRangePicker);
define("uswds-os-time-picker", UswdsTimePicker);
define("uswds-os-file-input", UswdsFileInput);
define("uswds-os-input-mask", UswdsInputMask);
define("uswds-os-in-page-navigation", UswdsInPageNavigation);
