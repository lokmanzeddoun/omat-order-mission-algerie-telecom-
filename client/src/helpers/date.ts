import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/fr';
import 'dayjs/locale/ar-dz';
import i18n from 'i18n';

// Shared dayjs instance: import dates through this module so plugins are always registered.
dayjs.extend(customParseFormat);

// Month and day names follow the UI language.
const dayjsLocale = (lng: string) => (lng === 'ar' ? 'ar-dz' : 'fr');
dayjs.locale(dayjsLocale(i18n.language));
i18n.on('languageChanged', (lng) => dayjs.locale(dayjsLocale(lng)));

export default dayjs;
