import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGS = ['fr', 'ar'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const defaultNS = 'common';
const LANG_KEY = 'omat.lang';

// Every locales/<lang>/<namespace>.json is registered automatically.
const files = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*/*.json', { eager: true });
const resources: Resource = {};
for (const [path, mod] of Object.entries(files)) {
  const [, lng, ns] = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/)!;
  (resources[lng] ??= {})[ns] = mod.default;
}

const isLang = (value: unknown): value is Lang => SUPPORTED_LANGS.includes(value as Lang);

// Read synchronously (not via redux-persist) so the first paint already has the right direction.
const initialLanguage = (): Lang => {
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage unavailable: fall through to the browser language */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'fr';
};

void i18n.use(initReactI18next).init({
  lng: initialLanguage(),
  fallbackLng: 'fr',
  supportedLngs: SUPPORTED_LANGS,
  defaultNS,
  ns: Object.keys(resources.fr ?? {}),
  resources,
  interpolation: { escapeValue: false },
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: (lngs, ns, key) => {
    console.warn(`[i18n] missing key "${ns}:${key}" for ${lngs.join(', ')}`);
  },
});

/** Switch the UI language and remember it in this browser. */
export const setLanguage = (lng: Lang) => {
  try {
    window.localStorage.setItem(LANG_KEY, lng);
  } catch {
    /* not remembered */
  }
  return i18n.changeLanguage(lng);
};

export const currentLanguage = (): Lang => (isLang(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'fr');

// Keep <html lang/dir> in sync so RTL languages (Arabic) flip the layout.
const applyDocumentLanguage = (lng: string) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
};
applyDocumentLanguage(i18n.language);
i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
