import dayjs from 'helpers/date';

export const formatDate = (v?: string | null) => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
export const formatDateTime = (v?: string | null) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—');

/** Mission length as shown before: whole days, or hours when under a day. */
export const missionDuration = (start?: string | null, end?: string | null) => {
  if (!start || !end) return '—';
  const s = dayjs(start);
  const e = dayjs(end);
  const days = Math.floor(e.diff(s, 'day', true));
  const hours = Math.floor(e.diff(s, 'hour', true));
  return days > 0 ? `${days} jour(s)` : `${hours} heure(s)`;
};

export const agentName = (u?: { nom?: string; prenom?: string } | null) =>
  u ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || '—' : '—';
