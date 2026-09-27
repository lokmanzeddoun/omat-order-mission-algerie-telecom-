// Single source of truth for how statuses are shown (see CONTEXT.md › Status labels).

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusDisplay {
  label: string;
  tone: StatusTone;
}

export const missionStatus: Record<string, StatusDisplay> = {
  INPROGRESS: { label: 'En cours', tone: 'info' },
  COMPLETED: { label: 'Validé', tone: 'success' },
};

export const decompteStatus: Record<string, StatusDisplay> = {
  PENDING: { label: 'En attente', tone: 'warning' },
  ACCEPTED: { label: 'Accepté', tone: 'success' },
  // The API enum is spelled REGECTED; REJECTED is accepted for forward compatibility.
  REGECTED: { label: 'Rejeté', tone: 'danger' },
  REJECTED: { label: 'Rejeté', tone: 'danger' },
};

export function getStatusDisplay(map: Record<string, StatusDisplay>, code?: string | null): StatusDisplay {
  if (!code) return { label: '—', tone: 'neutral' };
  return map[code] ?? { label: code, tone: 'neutral' };
}
