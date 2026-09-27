import i18n, { currentLanguage, type Lang } from 'i18n';

const LOCALES: Record<Lang, string> = { fr: 'fr-DZ', ar: 'ar-DZ' };

/** BCP 47 locale for Intl APIs matching the current UI language (sorting, case folding). */
export const intlLocale = () => LOCALES[currentLanguage()];

// Numbers look the same in both languages: Latin digits and "1 500,50" grouping, as in
// Algerian administrative documents and the (French) PDFs. ar-DZ would group with a dot,
// so 568644 would read "568.644".
const NUMBER_LOCALE = 'fr-DZ';

const numberFormats = new Map<number, Intl.NumberFormat>();
const collators = new Map<string, Intl.Collator>();

/** Format a number (formatters are cached per precision). */
export const formatNumber = (value: number, maximumFractionDigits = 2) => {
  let fmt = numberFormats.get(maximumFractionDigits);
  if (!fmt) {
    fmt = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits });
    numberFormats.set(maximumFractionDigits, fmt);
  }
  return fmt.format(value);
};

/** Amount in dinars with the localized currency suffix ("DA" / "د.ج"). */
export const formatDA = (value?: number | null, maximumFractionDigits = 2) =>
  `${formatNumber(value ?? 0, maximumFractionDigits)} ${i18n.t('common:currency')}`;

/** Locale-aware, accent-insensitive, numeric collator for sorting table values. */
export const collator = () => {
  const locale = intlLocale();
  let c = collators.get(locale);
  if (!c) {
    c = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    collators.set(locale, c);
  }
  return c;
};
