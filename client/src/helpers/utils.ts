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
// This matches the backend logic exactly
// Meals: Lunch (11:00-14:00) and Dinner (18:00-21:00)
// Accommodation: Overnight (00:00-06:00)
export const calculateMealsAndAccommodation = (
  date_sortie: string,
  heure_sortie: string,
  date_retour: string,
  heure_retour: string,
) => {
  try {
    const start = new Date(`${date_sortie}T${heure_sortie}:00`);
    const end = new Date(`${date_retour}T${heure_retour}:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return { meals: 0, accommodations: 0 };
    }

    let meals = 0;
    let accommodations = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      // Check for lunch (11:00 to 14:00)
      if (isWithinTimeRange(currentDate, 11, 0, 14, 0, start, end)) {
        meals++;
      }

      // Check for dinner (18:00 to 21:00)
      if (isWithinTimeRange(currentDate, 18, 0, 21, 0, start, end)) {
        meals++;
      }

      // Check for accommodation (00:00 to 06:00)
      if (isWithinTimeRange(currentDate, 0, 0, 6, 0, start, end)) {
        accommodations++;
      }

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    return { meals, accommodations };
  } catch {
    return { meals: 0, accommodations: 0 };
  }
};

function isWithinTimeRange(
  date: Date,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  tripStart: Date,
  tripEnd: Date,
): boolean {
  const rangeStart = new Date(date);
  rangeStart.setHours(startHour, startMinute, 0, 0);

  const rangeEnd = new Date(date);
  rangeEnd.setHours(endHour, endMinute, 0, 0);

  return rangeStart >= tripStart && rangeEnd <= tripEnd;
}
