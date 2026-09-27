import moment from 'moment';

type DateLike = Date | string | null | undefined;

function toDate(val: DateLike): Date | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function fmtDate(val: DateLike): string {
  const d = toDate(val);
  return d ? moment(d).format('DD/MM/YYYY') : '';
}

export function fmtHour(val: DateLike): string {
  const d = toDate(val);
  return d ? String(d.getHours()).padStart(2, '0') : '';
}

export function fmtMinute(val: DateLike): string {
  const d = toDate(val);
  return d ? String(d.getMinutes()).padStart(2, '0') : '';
}

/** Free text: null/undefined and the literal strings "null"/"undefined" become blank. */
export function text(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  const lower = s.toLowerCase();
  return lower === 'null' || lower === 'undefined' ? '' : s;
}

/** Plain count (repas, nuitées, jours, km). */
export function fmtCount(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '';
  return groupThousands(String(Math.round(val * 100) / 100).replace('.', ','));
}

/** Money: "4 500,00". Uses a regular space so every font renders the grouping. */
export function fmtAmount(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '';
  return groupThousands(val.toFixed(2).replace('.', ','));
}

function groupThousands(s: string): string {
  const [int, dec] = s.split(',');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return sign + grouped + (dec !== undefined ? ',' + dec : '');
}

/** Whole days between departure and return, as computed by the Word flow. */
export function missionDays(start: DateLike, end: DateLike): number | null {
  const a = toDate(start);
  const b = toDate(end);
  if (!a || !b) return null;
  return Math.max(
    0,
    Math.ceil((b.getTime() - a.getTime()) / (24 * 3600 * 1000)),
  );
}
