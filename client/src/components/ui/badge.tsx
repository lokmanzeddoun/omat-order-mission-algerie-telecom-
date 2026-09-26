import type { ReactNode } from 'react';
import { cn } from 'lib/utils';
import { getStatusDisplay, type StatusDisplay, type StatusTone } from 'constants/statusLabels';

const toneClass: Record<StatusTone, string> = {
  neutral: 'border-border-strong bg-surface-muted text-fg-muted',
  info: 'border-info/40 bg-info-soft text-info',
  success: 'border-success/40 bg-success-soft text-success',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  danger: 'border-danger/40 bg-danger-soft text-danger',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-xs border px-2 py-px text-xs font-medium whitespace-nowrap',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Status badge driven by the shared label map in constants/statusLabels. */
export function StatusBadge({ map, code }: { map: Record<string, StatusDisplay>; code?: string | null }) {
  const { label, tone } = getStatusDisplay(map, code);
  return (
    <Badge tone={tone}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
