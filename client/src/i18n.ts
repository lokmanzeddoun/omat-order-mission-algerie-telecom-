import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import frCommon from 'locales/fr/common.json';

export const defaultNS = 'common';

void i18n.use(initReactI18next).init({
  lng: 'fr',
  fallbackLng: 'fr',
  defaultNS,
  resources: { fr: { common: frCommon } },
  interpolation: { escapeValue: false },
});

// Keep <html lang/dir> in sync so RTL languages (Arabic) flip the layout.
const applyDocumentLanguage = (lng: string) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
};
applyDocumentLanguage(i18n.language);
i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
