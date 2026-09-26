import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Shared dayjs instance: import dates through this module so plugins are always registered.
dayjs.extend(customParseFormat);

export default dayjs;
