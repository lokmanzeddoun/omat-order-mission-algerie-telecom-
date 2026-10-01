import dayjs from 'helpers/date';

const ISO = 'YYYY-MM-DD';
const DISPLAY = 'DD/MM/YYYY';

/** Digits only, auto-inserting "/" → DD/MM/YYYY while typing. */
export function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
}

/** "15/03/2026" → "2026-03-15"; null unless it is a real date. */
export function parseDisplayDate(text: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return null;
  const d = dayjs(text, DISPLAY, true);
  return d.isValid() ? d.format(ISO) : null;
}

export const formatDisplayDate = (iso: string) =>
  iso && dayjs(iso, ISO, true).isValid() ? dayjs(iso).format(DISPLAY) : '';

/** 42 ISO dates (6 Monday-first weeks) covering the given month (month is 0-based). */
export function monthGrid(year: number, month: number): string[] {
  const first = dayjs(new Date(year, month, 1));
  const start = first.subtract((first.day() + 6) % 7, 'day');
  return Array.from({ length: 42 }, (_, i) => start.add(i, 'day').format(ISO));
}

/** Digits only → 24h "HH:mm" while typing; impossible digits are dropped. */
export function maskTime(raw: string): string {
  let d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length === 1 && d > '2') d = `0${d}`; // "8" → "08"
  if (d.length >= 2 && Number(d.slice(0, 2)) > 23) d = d.slice(0, 1);
  if (d.length >= 3 && d[2] > '5') d = d.slice(0, 2);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}

/** Loose input ("8:5", "0830", "8") → "HH:mm", or null when it is not a valid 24h time. */
export function normalizeTime(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})(?::?(\d{1,2}))?$/) ?? text.trim().match(/^(\d{2})(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
