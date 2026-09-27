// Single source of truth for how statuses are shown (see CONTEXT.md › Status labels).
import i18n from 'i18n';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusDisplay {
  label: string;
  tone: StatusTone;
}

// The label is translated when read, so it follows the current UI language.
const status = (key: string, tone: StatusTone): StatusDisplay => ({
  get label() {
    return i18n.t(`enums:status.${key}`);
  },
  tone,
});

export const missionStatus: Record<string, StatusDisplay> = {
  INPROGRESS: status('INPROGRESS', 'info'),
  COMPLETED: status('COMPLETED', 'success'),
};

export const decompteStatus: Record<string, StatusDisplay> = {
  PENDING: status('PENDING', 'warning'),
  ACCEPTED: status('ACCEPTED', 'success'),
  // The API enum is spelled REGECTED; REJECTED is accepted for forward compatibility.
  REGECTED: status('REJECTED', 'danger'),
  REJECTED: status('REJECTED', 'danger'),
};

export function getStatusDisplay(map: Record<string, StatusDisplay>, code?: string | null): StatusDisplay {
  if (!code) return { label: '—', tone: 'neutral' };
  return map[code] ?? { label: code, tone: 'neutral' };
}
