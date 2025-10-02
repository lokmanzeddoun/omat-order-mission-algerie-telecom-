import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(localizedFormat);

export const dateFormatFromUTC = (dateString: Date) => {
  return dayjs.utc(dateString).local().format('D MMM, h.mm A');
};

export const currencyFormat = (amount: number, options: Intl.NumberFormatOptions = {}) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'usd',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  }).format(amount);
};

export const numberFormat = (number: number, notation: 'standard' | 'compact' = 'standard') =>
  new Intl.NumberFormat('en-US', {
    notation,
  }).format(number);

/**
 * Normalize email by converting punycode domain to Unicode.
 * Simple mapping for known internationalized domains.
 *
 * @param email - Email address that may contain punycode domain
 * @returns Email with Unicode domain
 */
export const normalizeEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;

  // Map known punycode domains to their Unicode equivalents
  const punycodeMap: Record<string, string> = {
    'xn--algrietelecom-dhb.dz': 'algérietelecom.dz',
  };

  // Replace any punycode domain with Unicode version
  for (const [punycode, unicode] of Object.entries(punycodeMap)) {
    if (email.includes(punycode)) {
      const normalized = email.replace(punycode, unicode);
      console.log('[normalizeEmail]', email, '→', normalized);
      return normalized;
    }
  }

  return email;
};

// Calculate available meals and accommodations between two date-times
// startDate: YYYY-MM-DD (mission date_sortie UTC-based)
// startTime: HH:mm
// endDate: YYYY-MM-DD
// endTime: HH:mm
export const calculateMealsAndAccommodation = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
) => {
  try {
    const start = dayjs.utc(`${startDate}T${startTime}:00Z`);
    const end = dayjs.utc(`${endDate}T${endTime}:00Z`);
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      return { meals: 0, accommodations: 0 };
    }

    const totalHours = end.diff(start, 'hour');
    const fullDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    // Simple policy: 2 meals per full day
    // Remaining hours grant meals: 0 (<4h), 1 (4-12h), 2 (>12h)
    let partialMeals = 0;
    if (remainingHours >= 4 && remainingHours <= 12) partialMeals = 1;
    else if (remainingHours > 12) partialMeals = 2;

    const meals = fullDays * 2 + partialMeals;

    // Nights = number of midnights crossed ~ difference in calendar days
    const accommodations = end.startOf('day').diff(start.startOf('day'), 'day');

    return { meals, accommodations: Math.max(0, accommodations) };
  } catch {
    return { meals: 0, accommodations: 0 };
  }
};
